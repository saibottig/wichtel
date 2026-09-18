/**
 * Die dünne Schicht zwischen den reinen Modulen und dem DOM.
 *
 * Hier wird nichts entschieden, was sich prüfen ließe. Der Zustand kommt aus
 * `chooseView`, gezogen wird in `draw`, kodiert in `token`. Übrig bleiben
 * Animation, Zwischenablage und das Setzen von Textknoten.
 */

import { draw, waehleAus } from './draw.js';
import { encodeToken } from './token.js';
import { chooseView } from './view.js';
import { pastYears } from './archive.js';
import { BUCHSTABEN, FARBEN, darstellungFuer, tupferFuer } from './pool.js';

const $ = (id) => document.getElementById(id);

const bereiche = {
  ergebnis: $('bereich-ergebnis'),
  auslosung: $('bereich-auslosung'),
  fehler: $('bereich-fehler'),
};

const ruhigeBewegung = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Der Token, den diese Seite selbst gesetzt hat, damit `hashchange` ihn ignoriert. */
let selbstGesetzterToken = null;

const zeigeBereich = (name) => {
  for (const [schluessel, knoten] of Object.entries(bereiche)) {
    knoten.hidden = schluessel !== name;
  }
};

const knoepfeSperren = (gesperrt) => {
  for (const knopf of document.querySelectorAll('.knopf')) {
    knopf.disabled = gesperrt;
  }
};

/**
 * Lässt die gezogene Farbe die ganze Seite einnehmen.
 *
 * Ein Muster liegt schwach über seiner Grundfarbe, sonst stünde der Text auf
 * gestreiftem Grund. Ungemusterte Farben laufen in voller Stärke durch, denn
 * an einer einzelnen Farbe gäbe es nichts zu dämpfen.
 */
const flutSetzen = (farbe) => {
  const { flut, ton, daempfung } = darstellungFuer(farbe);

  $('flut-grund').style.background = daempfung ? daempfung.basis : flut;
  $('flut-muster').style.background = daempfung ? flut : 'none';
  $('flut-muster').style.opacity = daempfung ? String(daempfung.staerke) : '0';

  // Die Flut liegt fest am Fenster. Der Körper bekommt denselben Grund, damit
  // beim Überscrollen nichts vom alten Grün auftaucht. Kurzschreibweise, weil
  // die Hälfte der Farben Verläufe sind und backgroundColor die nicht nimmt.
  document.body.style.background = daempfung ? daempfung.basis : flut;
  document.body.classList.add('flutet');
  document.body.classList.toggle('ton-hell', ton === 'hell');
  document.body.classList.toggle('ton-dunkel', ton === 'dunkel');
};

const flutLoeschen = () => {
  document.body.style.background = '';
  document.body.classList.remove('flutet', 'ton-hell', 'ton-dunkel');
};

const zeigeFarbe = (farbe) => {
  $('ergebnis-farbname').textContent = farbe;
};

const schreibeErgebnis = ({ jahr, buchstabe, farbe }) => {
  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  $('ergebnis-buchstabe').textContent = buchstabe;
  zeigeFarbe(farbe);
  $('ergebnis-regel').textContent =
    `Das Geschenk fängt mit ${buchstabe} an und ist ${farbe.toLowerCase()}.`;
  flutSetzen(farbe);
};

const zeigeVergangeneJahre = (jahre) => {
  const bereich = $('bereich-vergangenes');
  bereich.hidden = jahre.length === 0;
  $('jahresliste').replaceChildren(
    ...jahre.map(({ jahr, buchstabe, farbe }) => {
      const zeile = document.createElement('li');
      zeile.className = 'jahreszeile';

      const jahreszahl = document.createElement('span');
      jahreszahl.className = 'jahreszahl';
      jahreszahl.textContent = String(jahr);

      const grossbuchstabe = document.createElement('span');
      grossbuchstabe.className = 'jahres-buchstabe';
      grossbuchstabe.textContent = buchstabe;

      const farbfeld = document.createElement('span');
      farbfeld.className = 'jahres-farbe';
      const tupfer = document.createElement('span');
      tupfer.className = 'tupfer';
      tupfer.style.background = tupferFuer(farbe);
      const farbname = document.createElement('span');
      farbname.textContent = farbe;
      farbfeld.append(tupfer, farbname);

      zeile.append(jahreszahl, grossbuchstabe, farbfeld);
      return zeile;
    }),
  );
};

/**
 * Lässt Buchstaben und Farben durchlaufen und wird dabei langsamer.
 *
 * Der Moment des Ziehens ist der halbe Spaß, und ein Ergebnis, das einfach da
 * ist, fällt flach.
 */
const laufenLassen = () =>
  new Promise((fertig) => {
    if (ruhigeBewegung()) {
      fertig();
      return;
    }

    const karte = bereiche.ergebnis;
    const dauer = 2200;
    const start = performance.now();
    let naechsterWechsel = 0;

    karte.classList.add('laeuft');

    const schritt = (jetzt) => {
      const fortschritt = (jetzt - start) / dauer;
      if (fortschritt >= 1) {
        karte.classList.remove('laeuft');
        fertig();
        return;
      }
      if (jetzt >= naechsterWechsel) {
        naechsterWechsel = jetzt + 45 + 330 * fortschritt * fortschritt;
        $('ergebnis-buchstabe').textContent = waehleAus(BUCHSTABEN, Math.random);
        zeigeFarbe(waehleAus(FARBEN, Math.random));
      }
      requestAnimationFrame(schritt);
    };

    requestAnimationFrame(schritt);
  });

const auslosen = async (archiv, jahr) => {
  const ergebnis = draw(jahr);

  knoepfeSperren(true);
  $('kopier-rueckmeldung').textContent = '';
  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  // Die Farbe bricht erst beim Landen herein, sonst verpufft der Moment.
  flutLoeschen();
  zeigeBereich('ergebnis');

  await laufenLassen();

  schreibeErgebnis(ergebnis);
  // Das frisch gezogene Jahr steht oben und gehört nicht noch einmal in die Liste.
  zeigeVergangeneJahre(pastYears(archiv).filter((eintrag) => eintrag.jahr !== jahr));
  bereiche.ergebnis.classList.add('gelandet');
  setTimeout(() => bereiche.ergebnis.classList.remove('gelandet'), 600);
  knoepfeSperren(false);

  selbstGesetzterToken = encodeToken(ergebnis);
  location.hash = selbstGesetzterToken;
};

const kopieren = async () => {
  const rueckmeldung = $('kopier-rueckmeldung');
  try {
    await navigator.clipboard.writeText(location.href);
    rueckmeldung.textContent = 'Link kopiert. Ab in den Gruppenchat.';
  } catch {
    rueckmeldung.textContent = 'Kopieren ging nicht. Link aus der Adresszeile nehmen.';
  }
};

const zeichnen = (archiv, jahr) => {
  const ansicht = chooseView({ token: location.hash.slice(1), archiv, jahr });

  if (ansicht.art === 'ergebnis') {
    schreibeErgebnis(ansicht.ergebnis);
    zeigeBereich('ergebnis');
  } else if (ansicht.art === 'auslosung') {
    flutLoeschen();
    $('auslosung-jahr').textContent = `Wichteln ${ansicht.jahr}`;
    zeigeBereich('auslosung');
  } else {
    flutLoeschen();
    // Der genaue Grund ist für das Archiv-Skript gedacht, nicht für die Gruppe.
    $('fehler-grund').textContent =
      'Wahrscheinlich ist er beim Weiterleiten abgeschnitten worden. Lost einfach neu aus.';
    zeigeBereich('fehler');
  }

  zeigeVergangeneJahre(ansicht.vergangeneJahre);
};

const starten = async () => {
  const jahr = new Date().getFullYear();

  let archiv = {};
  try {
    const antwort = await fetch('archiv.json', { cache: 'no-cache' });
    if (antwort.ok) {
      archiv = await antwort.json();
    }
  } catch {
    // Ohne Archiv lässt sich immer noch ziehen und teilen.
  }

  zeichnen(archiv, jahr);

  for (const id of ['knopf-auslosen', 'knopf-neu', 'knopf-fehler-auslosen']) {
    $(id).addEventListener('click', () => auslosen(archiv, jahr));
  }
  $('knopf-kopieren').addEventListener('click', kopieren);

  window.addEventListener('hashchange', () => {
    if (location.hash.slice(1) === selbstGesetzterToken) {
      return;
    }
    zeichnen(archiv, jahr);
  });
};

starten();
