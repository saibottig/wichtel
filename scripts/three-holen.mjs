/**
 * Holt three.js in den Ordner `vendor/`.
 *
 * Die Seite hat keinen Build-Schritt und liefert alles aus, was im Zweig steht.
 * three.js macht da keine Ausnahme: es liegt als Datei im Repository und wird
 * von derselben Adresse geladen wie der Rest der Seite. Kein CDN, kein Dritter,
 * der die Anfragen der Gruppe zu sehen bekommt, und nichts, was ausfallen kann,
 * ohne dass auch die Seite selbst ausgefallen waere.
 *
 * Dass die Dateien im Repository liegen, ist der Punkt, nicht ein Versehen.
 * Sie werden nicht von Hand bearbeitet. Wer eine neue Fassung will, aendert
 * hier die Versionsnummer und laesst das Skript laufen:
 *
 *   npm run three-holen
 *
 * Die Beigaben aus `examples/jsm` schreiben `from 'three'`. Ohne Import-Map
 * loest das nichts auf, also wird die Adresse beim Holen durch den Weg zur
 * Datei ersetzt. Aus demselben Grund traegt auch die Seite selbst keine
 * Import-Map: siehe `docs/agents/animation.md`.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '0.186.0';
const QUELLE = `https://cdn.jsdelivr.net/npm/three@${VERSION}/`;

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(WURZEL, 'vendor', 'three');

/**
 * Was die Enthuellung braucht. Alles Weitere haengt daran und wird gefunden.
 *
 * Die Bibliothek selbst in der gepressten Fassung, die Beigaben nicht.
 * `three.module.js` und `three.core.js` sind zusammen zwei Megabyte und
 * vierhunderteinundzwanzig Kilobyte ueber die Leitung; gepresst ist es weniger
 * als die Haelfte. Die Beigaben sind zusammen fuenfzehn Kilobyte, da lohnt das
 * Pressen nicht, und unkomprimiert bleiben sie lesbar.
 *
 * Gepresst wird von jsDelivr, nicht von uns, damit hier keine zweite
 * Werkzeug-Abhaengigkeit einzieht. Die Ausgabe haengt an der festen Version und
 * liegt danach als Datei bei uns, also aendert sie sich nur, wenn dieses Skript
 * noch einmal laeuft.
 */
const ANFANG = [
  'build/three.module.min.js',
  'examples/jsm/postprocessing/EffectComposer.js',
  'examples/jsm/postprocessing/RenderPass.js',
  'examples/jsm/postprocessing/UnrealBloomPass.js',
  'examples/jsm/postprocessing/OutputPass.js',
];

/** Innerhalb von `build/` wird durchweg die gepresste Fassung genommen. */
const gepresst = (pfad) =>
  pfad.startsWith('build/') && !pfad.endsWith('.min.js')
    ? pfad.replace(/\.js$/, '.min.js')
    : pfad;

/** Wo eine Datei des Pakets bei uns landet. */
const abgelegtAls = (pfad) =>
  pfad.startsWith('examples/jsm/')
    ? `addons/${pfad.slice('examples/jsm/'.length)}`
    : pfad.slice('build/'.length);

/**
 * Ersetzt Adressen, aber nur in echten Einfuhr-Anweisungen.
 *
 * three.js schreibt seine Einfuhren ueber mehrere Zeilen, und die Adresse steht
 * dann allein auf der Zeile mit der schliessenden Klammer. Wer nur die erste
 * Zeile einer Anweisung prueft, laesst genau die Adressen stehen, um die es
 * geht, und merkt es erst, wenn die Seite leer bleibt.
 */
const adressen = (quelle, ersetzen) => {
  let drin = false;
  return quelle
    .split('\n')
    .map((zeile) => {
      if (!drin && !/^\s*(import|export)\b/.test(zeile)) return zeile;
      drin = true;
      // Alle Vorkommen der Zeile, nicht nur das erste. Die gepresste Fassung
      // steht auf einer einzigen Zeile, und dort sind es zwei: das `import`
      // und das `export *`. Wer nur das erste ersetzt, laesst einen Verweis auf
      // eine Datei stehen, die es bei uns gar nicht gibt.
      const neu = zeile.replace(
        /(\bfrom\s*)(['"])([^'"]+)\2/g,
        (_, vor, q, adresse) => `${vor}${q}${ersetzen(adresse)}${q}`,
      );
      if (/\bfrom\s*['"]/.test(zeile) || /;\s*$/.test(zeile)) drin = false;
      return neu;
    })
    .join('\n');
};

const geholt = new Set();

const holen = async (pfad) => {
  if (geholt.has(pfad)) return;
  geholt.add(pfad);

  const antwort = await fetch(QUELLE + pfad);
  if (!antwort.ok) throw new Error(`${pfad} kam nicht: ${antwort.status}`);
  const quelle = await antwort.text();

  const hier = abgelegtAls(pfad);
  // Von dieser Datei aus zurueck zur Bibliothek, als Weg mit Schraegstrichen.
  const zurueck = posix.relative(posix.dirname(hier), 'three.module.min.js');
  const weiter = [];

  const neu = adressen(quelle, (adresse) => {
    if (adresse === 'three') return zurueck.startsWith('.') ? zurueck : `./${zurueck}`;
    if (adresse.startsWith('.')) {
      // Die gepresste Fassung zeigt weiter auf die ungepresste. Beides muss
      // zusammenpassen, sonst liegen zwei Bibliotheken nebeneinander.
      const nachbar = gepresst(posix.normalize(posix.join(posix.dirname(pfad), adresse)));
      weiter.push(nachbar);
      return `./${posix.relative(posix.dirname(hier), abgelegtAls(nachbar))}`;
    }
    // Alles andere steht nicht in einer Einfuhr, sondern in einer Zeichenkette,
    // die zufaellig so aussieht. Unangetastet lassen und unten nachzaehlen.
    return adresse;
  });

  const datei = join(ZIEL, hier);
  await mkdir(dirname(datei), { recursive: true });
  await writeFile(datei, neu, 'utf8');

  for (const nachbar of weiter) await holen(nachbar);
};

for (const pfad of ANFANG) await holen(pfad);

/**
 * Nachzaehlen: zeigt jede Einfuhr auf eine Datei, die auch wirklich hier liegt?
 *
 * Das ist die Pruefung, die beim letzten Mal gefehlt hat. Ein einziger
 * stehengebliebener Verweis reicht, und die Seite laedt gar nichts mehr, ohne
 * dass beim Holen irgendetwas auffaellig gewesen waere.
 */
const abgelegt = new Set([...geholt].map(abgelegtAls));
const fehlt = [];

for (const pfad of geholt) {
  const hier = abgelegtAls(pfad);
  const quelle = await readFile(join(ZIEL, hier), 'utf8');
  adressen(quelle, (adresse) => {
    if (adresse === 'three') fehlt.push(`${hier}: nackter Name "three"`);
    else if (adresse.startsWith('.')) {
      const ziel = posix.normalize(posix.join(posix.dirname(hier), adresse));
      if (!abgelegt.has(ziel)) fehlt.push(`${hier} zeigt auf ${ziel}, das fehlt`);
    }
    return adresse;
  });
}

if (fehlt.length) {
  console.error(`Offene Verweise:\n  ${fehlt.join('\n  ')}`);
  process.exit(1);
}

console.log(
  `three.js ${VERSION}: ${geholt.size} Dateien nach ${relative(WURZEL, ZIEL)}, alle Verweise gehen auf.`,
);
