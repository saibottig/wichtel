/**
 * Baut aus dem Prototyp eine Fassung ohne nackte Modulnamen.
 *
 * Der Prototyp schreibt `import * as THREE from 'three'` und laesst eine
 * Import-Map den Namen aufloesen. Das ist die uebliche Schreibweise und
 * funktioniert ueberall, solange die Seite ihre Import-Map selbst mitbringt.
 *
 * In einer fremden Seite, die den Prototyp nur einbettet, funktioniert es
 * nicht. Eine Import-Map muss dort stehen, bevor das erste Modul geladen wird.
 * Laedt die einbettende Seite vorher ein eigenes Modul, verwirft Firefox die
 * Import-Map, und dann faellt jeder nackte Name auf die Nase und die Seite
 * bleibt leer. Chrome ist seit Version 133 nachsichtiger und nimmt sie noch an,
 * darum faellt es dort nicht auf.
 *
 * Also werden hier alle nackten Namen durch vollstaendige Adressen ersetzt.
 * three selbst kommt vom CDN, die Beigaben aus `examples/jsm` werden
 * heruntergeladen und mitgelegt, weil sie ihrerseits `from 'three'` schreiben.
 *
 * Aufruf:
 *
 *   node .scratch/wichtel-site/prototypen/enthuellung/artefakt.mjs <Zielordner>
 */

import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(HIER, '../../../..');
const VERSION = '0.186.0';
const DREI = `https://cdn.jsdelivr.net/npm/three@${VERSION}/build/three.module.js`;
const BEIGABEN = `https://cdn.jsdelivr.net/npm/three@${VERSION}/examples/jsm/`;

/** Wo die Module im Artefakt liegen, damit `../../../../src/pool.js` aufgeht. */
const UNTER = 'scratch/wichtel-site/prototypen/enthuellung';

const ziel = process.argv[2];
if (!ziel) {
  console.error('Es fehlt der Zielordner.');
  process.exit(1);
}

/**
 * Ersetzt die Adresse jeder Einfuhr, aber nur in echten Einfuhr-Anweisungen.
 *
 * Nicht ueber die ganze Datei, damit kein `from '...'` erwischt wird, das
 * mitten in einem GLSL-Text steht. Aber auch nicht Zeile fuer Zeile: three.js
 * schreibt seine Einfuhren ueber mehrere Zeilen, und die Adresse steht dann
 * allein auf der Zeile mit der schliessenden Klammer. Wer nur die erste Zeile
 * prueft, laesst genau die Adressen stehen, um die es geht.
 */
const adressenErsetzen = (quelle, ersetzen) => {
  let drin = false;
  return quelle
    .split('\n')
    .map((zeile) => {
      if (!drin && !/^\s*(import|export)\b/.test(zeile)) return zeile;
      drin = true;
      const neu = zeile.replace(/(\bfrom\s*)(['"])([^'"]+)\2/, (_, vor, q, adresse) =>
        `${vor}${q}${ersetzen(adresse)}${q}`,
      );
      // Die Anweisung ist zu Ende, sobald ihre Adresse dasteht oder ein
      // Semikolon sie schliesst.
      if (/\bfrom\s*['"]/.test(zeile) || /;\s*$/.test(zeile)) drin = false;
      return neu;
    })
    .join('\n');
};

/** Sammelt jede Einfuhr-Adresse einer Datei ein. */
const adressenLesen = (quelle) => {
  const gefunden = [];
  adressenErsetzen(quelle, (adresse) => {
    gefunden.push(adresse);
    return adresse;
  });
  return gefunden;
};

/**
 * Holt eine Beigabe und alles, was sie selbst noch braucht.
 *
 * `Pass.js` und die Shader haengen an den Nachbearbeitungs-Modulen und werden
 * nirgends aufgezaehlt, also wird hier nachgelaufen statt aufgelistet.
 */
const geholt = new Map();

const beigabeHolen = async (pfad) => {
  if (geholt.has(pfad)) return;
  geholt.set(pfad, null);

  const antwort = await fetch(BEIGABEN + pfad);
  if (!antwort.ok) throw new Error(`${pfad} kam nicht: ${antwort.status}`);
  const quelle = await antwort.text();

  const weiter = adressenLesen(quelle).filter((a) => a.startsWith('.'));
  geholt.set(
    pfad,
    adressenErsetzen(quelle, (adresse) => (adresse === 'three' ? DREI : adresse)),
  );

  for (const nachbar of weiter) {
    await beigabeHolen(posix.normalize(posix.join(posix.dirname(pfad), nachbar)));
  }
};

const schreiben = async (pfad, inhalt) => {
  await mkdir(dirname(pfad), { recursive: true });
  await writeFile(pfad, inhalt, 'utf8');
};

// Die eigenen Module, mit ersetzten Adressen.
const eigene = (await readdir(HIER)).filter(
  (name) => name.endsWith('.js') && !name.endsWith('.mjs'),
);

const beigabenGebraucht = new Set();

for (const name of eigene) {
  const quelle = await readFile(join(HIER, name), 'utf8');
  const neu = adressenErsetzen(quelle, (adresse) => {
    if (adresse === 'three') return DREI;
    if (adresse.startsWith('three/addons/')) {
      const pfad = adresse.slice('three/addons/'.length);
      beigabenGebraucht.add(pfad);
      return `./beigaben/${pfad}`;
    }
    return adresse;
  });
  await schreiben(join(ziel, UNTER, name), neu);
}

for (const pfad of beigabenGebraucht) {
  await beigabeHolen(pfad);
}

for (const [pfad, quelle] of geholt) {
  await schreiben(join(ziel, UNTER, 'beigaben', pfad), quelle);
}

// Der Farbtopf der echten Seite, an der Stelle, die die relativen Einfuhren
// der Module erwarten.
await schreiben(
  join(ziel, 'src/pool.js'),
  await readFile(join(WURZEL, 'src/pool.js'), 'utf8'),
);

// Nachzaehlen, und zwar in allem, was geschrieben wurde.
//
// Zuerst wurden hier nur die eigenen Module geprueft. Die waren sauber, die
// Beigaben nicht, und der Fehler stand trotzdem gross auf der Seite. Ein Pruefer,
// der nur das prueft, was man selbst geschrieben hat, findet nichts.
const alleDateien = async (ordner) => {
  const eintraege = await readdir(ordner, { withFileTypes: true });
  const raus = [];
  for (const eintrag of eintraege) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) raus.push(...(await alleDateien(pfad)));
    else if (eintrag.name.endsWith('.js')) raus.push(pfad);
  }
  return raus;
};

const uebrig = [];
for (const pfad of await alleDateien(ziel)) {
  const quelle = await readFile(pfad, 'utf8');
  for (const adresse of adressenLesen(quelle)) {
    if (!adresse.startsWith('.') && !adresse.startsWith('http')) {
      uebrig.push(`${pfad.slice(ziel.length + 1)}: ${adresse}`);
    }
  }
}

console.log(`${eigene.length} eigene Module, ${geholt.size} Beigaben, 1 Farbtopf.`);
if (uebrig.length) {
  console.error(`Nackte Namen uebrig:\n  ${uebrig.join('\n  ')}`);
  process.exit(1);
}
console.log('Kein nackter Name uebrig.');
