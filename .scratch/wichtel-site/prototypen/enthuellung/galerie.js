/**
 * Die Vergleichsseite: fünf Enthüllungen, eine Ziehung.
 *
 * Alle fünf spielen dasselbe Ergebnis, sonst vergleicht man Farben statt
 * Animationen. Farbe und Buchstabe lassen sich festhalten, denn die Frage ist
 * nicht, ob eine Enthüllung bei Rot schön aussieht, sondern ob sie Schwarz,
 * Weiß, Durchsichtig und Glitzer genauso trägt.
 *
 * Vertrag eines Enthüllungs-Moduls:
 *
 *   export const meta = { titel, text, dauer, landung, abgang }
 *   export const bauen = ({ leinwand }) => ({
 *     groesse(breite, hoehe),  // bei jeder Größenänderung
 *     bereit(ziehung),         // auf den ersten Frame stellen
 *     schritt(t, sekunden),    // t läuft von 0 bis 1
 *     rendern(),               // ein Bild zeichnen
 *     freigeben(),
 *   })
 *
 * `landung` sagt, ab welchem Anteil die Seite den Text übernimmt. `abgang`
 * sagt, was danach mit der Leinwand geschieht: `flut` blendet sie aus und die
 * CSS-Farbflut ein, `bleibt` lässt das Bild stehen, weil es selbst schon die
 * Farbe der Seite ist.
 */

import { BUCHSTABEN, FARBEN, darstellungFuer } from '../../../../src/pool.js';
import { lauf, beobachteGroesse, zufallAus } from './buehne.js';

const MODULE = [
  './01-staub.js',
  './02-gommage.js',
  './03-prisma.js',
  './04-kugeln.js',
  './05-marmor.js',
];

const JAHR = new Date().getFullYear();
const $ = (id) => document.getElementById(id);

const ruhigeBewegung = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ziehung = { jahr: JAHR, buchstabe: 'W', farbe: 'Rot' };

const wahlFarbe = $('wahl-farbe');
const wahlBuchstabe = $('wahl-buchstabe');

const auswahlFuellen = (feld, werte) => {
  feld.replaceChildren(
    new Option('Zufällig', ''),
    ...werte.map((wert) => new Option(wert, wert)),
  );
};

auswahlFuellen(wahlFarbe, [...FARBEN]);
auswahlFuellen(wahlBuchstabe, [...BUCHSTABEN]);

const neuZiehen = () => {
  ziehung = {
    jahr: JAHR,
    buchstabe: wahlBuchstabe.value || zufallAus([...BUCHSTABEN]),
    farbe: wahlFarbe.value || zufallAus([...FARBEN]),
  };
  $('ziehung').innerHTML =
    `Gezogen: <b>${ziehung.buchstabe}</b> und <b>${ziehung.farbe}</b>`;
};

/** Eine Karte mit Bühne, Knöpfen und dem Modul dahinter. */
const karteBauen = (modul, pfad) => {
  const { meta, bauen } = modul;
  const karte = document.createElement('article');
  karte.className = 'karte';
  karte.innerHTML = `
    <h2>${meta.titel}</h2>
    <p class="beschreibung">${meta.text}</p>
    <div class="buehne">
      <canvas></canvas>
      <div class="grund-farbe"></div>
      <div class="grund-muster"></div>
      <div class="grund-schleier"></div>
      <div class="inhalt">
        <span class="pille">Wichteln ${JAHR}</span>
        <div class="unten"><div class="riese"></div><div class="wort"></div></div>
      </div>
    </div>
    <div class="reihe">
      <button type="button" class="knopf ab">Abspielen</button>
      <button type="button" class="knopf gross">Groß</button>
    </div>`;

  const buehne = karte.querySelector('.buehne');
  const leinwand = karte.querySelector('canvas');
  const knopfAb = karte.querySelector('.ab');
  const laufwerk = bauen({ leinwand, pfad });

  let laeuft = false;

  beobachteGroesse(buehne, (breite, hoehe) => {
    laufwerk.groesse(breite, hoehe);
    if (!laeuft) laufwerk.rendern();
  });

  const zuruecksetzen = () => {
    // Ohne Überblendung zurück auf Anfang, sonst liegt die Farbflut des letzten
    // Durchgangs noch über dem Beginn des nächsten.
    buehne.classList.add('sofort');
    buehne.classList.remove('gelandet', 'geflutet', 'abgetreten', 'ton-hell', 'ton-dunkel');
    buehne.querySelector('.riese').textContent = '';
    buehne.querySelector('.wort').textContent = '';
    buehne.offsetHeight; // erzwingt das Neuberechnen, bevor die Übergänge zurückkommen
    buehne.classList.remove('sofort');
  };

  const landen = () => {
    const { flut, ton, daempfung } = darstellungFuer(ziehung.farbe);
    buehne.querySelector('.riese').textContent = ziehung.buchstabe;
    buehne.querySelector('.wort').textContent = ziehung.farbe;
    buehne.classList.add(ton === 'hell' ? 'ton-hell' : 'ton-dunkel');

    if (meta.abgang === 'flut') {
      buehne.querySelector('.grund-farbe').style.background = daempfung ? daempfung.basis : flut;
      buehne.querySelector('.grund-muster').style.background = daempfung ? flut : 'none';
      buehne.style.setProperty('--muster-staerke', daempfung ? String(daempfung.staerke) : '0');
      buehne.classList.add('geflutet', 'abgetreten');
    }
    buehne.classList.add('gelandet');
  };

  const spielen = async () => {
    if (laeuft) return;
    laeuft = true;
    knopfAb.disabled = true;
    zuruecksetzen();
    laufwerk.bereit(ziehung);

    let gelandet = false;
    await lauf(meta.dauer, (t, sekunden) => {
      laufwerk.schritt(t, sekunden);
      laufwerk.rendern();
      if (!gelandet && t >= meta.landung) {
        gelandet = true;
        landen();
      }
    });

    laeuft = false;
    knopfAb.disabled = false;
  };

  knopfAb.addEventListener('click', spielen);
  karte.querySelector('.gross').addEventListener('click', () => vergroessern(karte, buehne));

  // Ein erstes Bild, damit die Bühne nicht schwarz wartet.
  laufwerk.bereit(ziehung);
  laufwerk.schritt(0, 0);

  /**
   * Ein einzelnes Bild an der Stelle `t`, ohne abzuspielen.
   *
   * Setzt voraus, dass `schritt` nur vom Anteil abhängt und nicht davon, was
   * vorher lief. Das ist Absicht und gilt für alle fünf: eine Animation, die
   * sich anhalten und aufspulen lässt, lässt sich auch prüfen.
   */
  const standbild = (t = 0) => {
    if (laeuft) return;
    zuruecksetzen();
    laufwerk.bereit(ziehung);
    laufwerk.schritt(t, (t * meta.dauer) / 1000);
    laufwerk.rendern();
    if (t >= meta.landung) {
      buehne.classList.add('sofort');
      landen();
      buehne.offsetHeight;
      buehne.classList.remove('sofort');
    }
  };

  return { karte, spielen, standbild };
};

// --- Die Lupe -------------------------------------------------------------

const lupe = $('lupe');
const lupePlatz = $('lupe-platz');
let zurueckIn = null;

const vergroessern = (karte, buehne) => {
  zurueckIn = karte;
  lupePlatz.append(buehne);
  lupe.hidden = false;
};

const verkleinern = () => {
  if (!zurueckIn) return;
  const buehne = lupePlatz.firstElementChild;
  zurueckIn.insertBefore(buehne, zurueckIn.querySelector('.reihe'));
  zurueckIn = null;
  lupe.hidden = true;
};

$('lupe-zu').addEventListener('click', verkleinern);
lupe.addEventListener('click', (e) => {
  if (e.target === lupe || e.target === lupePlatz) verkleinern();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') verkleinern();
});

// --- Aufbau ---------------------------------------------------------------

const galerie = $('galerie');
const karten = [];

const fehlerKarte = (pfad, fehler) => {
  const karte = document.createElement('article');
  karte.className = 'karte';
  karte.innerHTML = `<h2>${pfad}</h2>
    <p class="beschreibung warnung">Lädt nicht: ${fehler.message}</p>`;
  return karte;
};

neuZiehen();

for (const pfad of MODULE) {
  try {
    const modul = await import(pfad);
    const eintrag = karteBauen(modul, pfad);
    galerie.append(eintrag.karte);
    karten.push(eintrag);
  } catch (fehler) {
    console.error(pfad, fehler);
    galerie.append(fehlerKarte(pfad, fehler));
  }
}

const alleSpielen = () => karten.forEach((k) => k.spielen());

/**
 * Haken für `bilder.mjs`: hält alle fünf bei demselben Anteil an.
 *
 * Auf die Uhr zu warten funktioniert nicht, weil ein Bildschirmfoto von fünf
 * laufenden WebGL-Bühnen selbst über eine Sekunde kostet und die Animation
 * derweil weiterläuft. Aufgespult ist das Bild dagegen exakt und wiederholbar.
 */
window.enthuellungStandbild = (t) => karten.forEach((k) => k.standbild(t));

$('alle').addEventListener('click', alleSpielen);
$('wuerfeln').addEventListener('click', () => {
  neuZiehen();
  alleSpielen();
});
for (const feld of [wahlFarbe, wahlBuchstabe]) {
  feld.addEventListener('change', () => {
    neuZiehen();
    karten.forEach((k) => k.standbild());
  });
}

if (ruhigeBewegung) {
  const warnung = $('warnung');
  warnung.hidden = false;
  warnung.textContent =
    'Das System steht auf "Bewegung reduzieren", darum läuft nichts von selbst los. Die Knöpfe spielen trotzdem.';
} else {
  alleSpielen();
}
