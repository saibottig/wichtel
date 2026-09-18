/**
 * Die duenne Schicht zwischen den reinen Modulen und dem DOM.
 *
 * Hier wird nichts entschieden, was sich prüfen liesse. Der Zustand kommt aus
 * `chooseView`, gezogen wird in `draw`, kodiert in `token`. Uebrig bleiben
 * Animation, Zwischenablage und das Setzen von Textknoten.
 */

import { draw } from './draw.js';
import { encodeToken } from './token.js';
import { chooseView } from './view.js';
import { BUCHSTABEN, FARBEN } from './pool.js';

/** Wie eine Farbe als Tupfer aussieht. Reine Darstellung, kein Teil der Domäne. */
const TUPFER = {
  Rot: '#d33b33',
  Blau: '#2f6fd0',
  Grün: '#3a9e52',
  Gelb: '#e8cf3f',
  Orange: '#e3892f',
  Lila: '#8a4fc4',
  Rosa: '#e37fae',
  Türkis: '#2fb8ad',
  Braun: '#8a5a33',
  Schwarz: '#1b1b1b',
  Weiß: '#f4f4f0',
  Grau: '#8d938f',
  Beige: '#ddceae',
  Gold: 'linear-gradient(135deg, #f6dd8c, #c2932f)',
  Silber: 'linear-gradient(135deg, #eef1f3, #9aa3a9)',
  Dunkelblau: '#1e3a73',
  Hellgrün: '#8ed06a',
  Bordeaux: '#7a2233',
  Glitzer: 'conic-gradient(#f6dd8c, #fff3c4, #d6a93c, #fffbe8, #f6dd8c)',
  Bunt: 'conic-gradient(#d33b33, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4, #d33b33)',
  Neon: 'linear-gradient(135deg, #b6ff2e, #17f0d0)',
  Pastell: 'linear-gradient(135deg, #f7c9d9, #cfe3f7, #d8f2d4)',
  Gestreift: 'repeating-linear-gradient(45deg, #f4f4f0 0 4px, #d33b33 4px 8px)',
  Kariert: 'repeating-conic-gradient(#d33b33 0% 25%, #f4f4f0 0% 50%) 0 / 12px 12px',
  Gepunktet: 'radial-gradient(#1b1b1b 32%, #f4f4f0 34%) 0 / 8px 8px',
  Durchsichtig:
    'repeating-conic-gradient(rgba(255,255,255,0.22) 0% 25%, rgba(255,255,255,0.05) 0% 50%) 0 / 9px 9px',
  Metallic: 'linear-gradient(135deg, #cfd6da, #7d878d 45%, #eef1f3 70%, #8c959b)',
  Regenbogen: 'linear-gradient(135deg, #d33b33, #e8892f, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4)',
};

const $ = (id) => document.getElementById(id);

const bereiche = {
  ergebnis: $('bereich-ergebnis'),
  auslosung: $('bereich-auslosung'),
  fehler: $('bereich-fehler'),
};

const zufaelligAus = (topf) => topf[Math.floor(Math.random() * topf.length)];

const ruhigeBewegung = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const faerbe = (knoten, farbe) => {
  knoten.style.background = TUPFER[farbe] ?? 'rgba(255,255,255,0.14)';
};

/** Der Token, den diese Seite selbst gesetzt hat, damit `hashchange` ihn ignoriert. */
let selbstGesetzterToken = null;

const zeigeBereich = (name) => {
  for (const [schluessel, knoten] of Object.entries(bereiche)) {
    knoten.hidden = schluessel !== name;
  }
};

const schreibeErgebnis = ({ jahr, buchstabe, farbe }) => {
  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  $('ergebnis-buchstabe').textContent = buchstabe;
  $('ergebnis-farbname').textContent = farbe;
  faerbe($('ergebnis-tupfer'), farbe);
  $('ergebnis-regel').textContent =
    `Das Geschenk fängt mit ${buchstabe} an und ist ${farbe.toLowerCase()}.`;
};

const zeigeVergangeneJahre = (jahre) => {
  const bereich = $('bereich-vergangenes');
  const liste = $('jahresliste');
  bereich.hidden = jahre.length === 0;
  liste.replaceChildren(
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
      faerbe(tupfer, farbe);
      const farbname = document.createElement('span');
      farbname.textContent = farbe;
      farbfeld.append(tupfer, farbname);

      zeile.append(jahreszahl, grossbuchstabe, farbfeld);
      return zeile;
    }),
  );
};

/**
 * Laesst Buchstaben und Farben durchlaufen und wird dabei langsamer.
 *
 * Der Moment des Ziehens ist der halbe Spaß, und ein Ergebnis, das einfach da
 * ist, faellt flach.
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
        $('ergebnis-buchstabe').textContent = zufaelligAus(BUCHSTABEN);
        const farbe = zufaelligAus(FARBEN);
        $('ergebnis-farbname').textContent = farbe;
        faerbe($('ergebnis-tupfer'), farbe);
      }
      requestAnimationFrame(schritt);
    };

    requestAnimationFrame(schritt);
  });

const auslosen = async (jahr) => {
  const ergebnis = draw(jahr);
  const token = encodeToken(ergebnis);

  for (const knopf of document.querySelectorAll('.knopf')) {
    knopf.disabled = true;
  }
  $('kopier-rueckmeldung').textContent = '';
  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  zeigeBereich('ergebnis');

  await laufenLassen();

  schreibeErgebnis(ergebnis);
  bereiche.ergebnis.classList.add('gelandet');
  setTimeout(() => bereiche.ergebnis.classList.remove('gelandet'), 600);

  for (const knopf of document.querySelectorAll('.knopf')) {
    knopf.disabled = false;
  }

  selbstGesetzterToken = token;
  location.hash = token;
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
    $('auslosung-jahr').textContent = `Wichteln ${ansicht.jahr}`;
    zeigeBereich('auslosung');
  } else {
    $('fehler-grund').textContent = ansicht.grund;
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

  $('knopf-auslosen').addEventListener('click', () => auslosen(jahr));
  $('knopf-neu').addEventListener('click', () => auslosen(jahr));
  $('knopf-fehler-auslosen').addEventListener('click', () => auslosen(jahr));
  $('knopf-kopieren').addEventListener('click', kopieren);

  window.addEventListener('hashchange', () => {
    if (location.hash.slice(1) === selbstGesetzterToken) {
      return;
    }
    zeichnen(archiv, jahr);
  });
};

starten();
