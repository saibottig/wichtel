/**
 * Die dünne Schicht zwischen den reinen Modulen und dem DOM.
 *
 * Hier wird nichts entschieden, was sich prüfen ließe. Der Zustand kommt aus
 * `chooseView`, gezogen wird in `draw`, kodiert in `token`. Übrig bleiben
 * Animation, Zwischenablage und das Setzen von Textknoten.
 */

import { draw, waehleAus } from './draw.js';
import { encodeToken, encodeAusschluss } from './token.js';
import { OHNE_AUSSCHLUSS, topfVon, ausgeschlossenVon, umschalten, istVoll, zaehle } from './filter.js';
import { chooseView } from './view.js';
import { pastYears } from './archive.js';
import { BUCHSTABEN, FARBEN, FARBTOENE, darstellungFuer, tupferFuer } from './pool.js';

const $ = (id) => document.getElementById(id);

const bereiche = {
  ergebnis: $('bereich-ergebnis'),
  auslosung: $('bereich-auslosung'),
  fehler: $('bereich-fehler'),
  topf: $('bereich-topf'),
};

/** Der Filter, den die Seite gerade zeigt. Steht immer auch in der Adresse. */
let filter = OHNE_AUSSCHLUSS;

/** Adresse für den Topf, mit Filter im Schlepptau, wenn einer gesetzt ist. */
const topfAdresse = (f) => (istVoll(f) ? 'topf' : `topf~${encodeAusschluss(f)}`);

/** Adresse für die Einladung, die sich denselben Filter merkt. */
const auslosungAdresse = (f) => (istVoll(f) ? '' : `filter~${encodeAusschluss(f)}`);

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

/** Alle Farben des Topfes im Kreis, einmal gebaut und dann wiederverwendet. */
const ALLE_MOEGLICH = `conic-gradient(from 0deg, ${[...FARBTOENE, FARBTOENE[0]].join(', ')})`;

/**
 * Lässt die gezogene Farbe die ganze Seite einnehmen.
 *
 * Ein Muster liegt schwach über seiner Grundfarbe, sonst stünde der Text auf
 * gestreiftem Grund. Ungemusterte Farben laufen in voller Stärke durch, denn
 * an einer einzelnen Farbe gäbe es nichts zu dämpfen.
 */
const grundFluten = (farbe, { ruhig = false } = {}) => {
  const { flut, ton, daempfung } = darstellungFuer(farbe);

  // Ruhig heißt: ohne Muster. Auf der Topf-Seite liegen Dutzende kleiner Chips,
  // und Punkte oder Streifen dahinter machen die Liste unlesbar. Die Farbe
  // bleibt, damit der Sprung vom Ergebnis nicht wie eine fremde Seite wirkt.
  const zeigeMuster = daempfung && !ruhig;
  $('grund-farbe').style.background = daempfung ? daempfung.basis : flut;
  $('grund-muster').style.background = zeigeMuster ? flut : 'none';
  $('grund-muster').style.opacity = zeigeMuster ? String(daempfung.staerke) : '0';

  // Die Schichten liegen fest am Fenster. Der Körper bekommt denselben Grund,
  // damit beim Überscrollen nichts vom alten durchblitzt. Kurzschreibweise,
  // weil die Hälfte der Farben Verläufe sind und backgroundColor die nicht nimmt.
  document.body.style.background = daempfung ? daempfung.basis : flut;
  document.body.classList.remove('moeglich');
  document.body.classList.add('geflutet');
  document.body.classList.toggle('ton-hell', ton === 'hell');
  document.body.classList.toggle('ton-dunkel', ton === 'dunkel');
};

/**
 * Der Grund, solange nichts gezogen ist.
 *
 * Vor der Auslosung ist jede Farbe noch möglich, also sind alle da. Das Ziehen
 * macht daraus eine.
 */
const grundMoeglich = () => {
  $('grund-farbe').style.background = ALLE_MOEGLICH;
  $('grund-muster').style.background = 'none';
  $('grund-muster').style.opacity = '0';

  document.body.style.background = '';
  document.body.classList.remove('geflutet', 'ton-hell');
  document.body.classList.add('moeglich', 'ton-dunkel');
};

const zeigeFarbe = (farbe) => {
  $('ergebnis-farbname').textContent = farbe;
};

const schreibeErgebnis = (ergebnis) => {
  const { jahr, buchstabe, farbe } = ergebnis;

  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  $('ergebnis-buchstabe').textContent = buchstabe;
  zeigeFarbe(farbe);
  $('ergebnis-regel').textContent =
    `Das Geschenk fängt mit ${buchstabe} an und ist ${farbe.toLowerCase()}.`;
  // Der Topf hängt am Ergebnis, nicht am Zeichnen: nach einer frischen
  // Auslosung läuft das Zeichnen nicht noch einmal.
  $('link-ergebnis-topf').href = `#${encodeToken(ergebnis)}~topf`;
  grundFluten(farbe);
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
 * Baut eine Reihe Chips.
 *
 * Im bearbeitbaren Topf sind es Knöpfe, beim Ergebnis nur noch Beschriftungen,
 * denn da ist nichts mehr zu ändern.
 */
const chipsBauen = (liste, ziel, { art, bearbeitbar, beiKlick }) => {
  ziel.replaceChildren(
    ...liste.map((wert) => {
      const zeile = document.createElement('li');
      const chip = document.createElement(bearbeitbar ? 'button' : 'span');
      chip.className = 'chip';

      if (art === 'farben') {
        const tupfer = document.createElement('span');
        tupfer.className = 'tupfer';
        tupfer.style.background = tupferFuer(wert);
        chip.append(tupfer);
      }
      chip.append(document.createTextNode(wert));

      if (bearbeitbar) {
        chip.type = 'button';
        chip.addEventListener('click', () => beiKlick(art, wert));
      }
      zeile.append(chip);
      return zeile;
    }),
  );
};

const topfZeichnen = (ansicht) => {
  const { bearbeitbar } = ansicht;
  const drin = topfVon(filter);
  const raus = ausgeschlossenVon(filter);
  const anzahl = zaehle(filter);

  $('topf-jahr').textContent = ansicht.ergebnis
    ? `Wichteln ${ansicht.ergebnis.jahr}`
    : `Wichteln ${ansicht.jahr}`;
  $('topf-umfang').textContent = bearbeitbar
    ? `${anzahl.buchstaben} Buchstaben und ${anzahl.farben} Farben stehen zur Auswahl.`
    : `Gezogen wurde aus ${anzahl.buchstaben} Buchstaben und ${anzahl.farben} Farben.`;

  chipsBauen(drin.buchstaben, $('topf-buchstaben'), { art: 'buchstaben', bearbeitbar, beiKlick: filterUmschalten });
  chipsBauen(drin.farben, $('topf-farben'), { art: 'farben', bearbeitbar, beiKlick: filterUmschalten });

  // Draußen heißt unten und für sich, nicht durchgestrichen. Beim Ergebnis
  // steht es gar nicht da: dort zählt nur, woraus gezogen wurde.
  const zeigeRaus = bearbeitbar && !istVoll(filter);
  $('topf-draussen').hidden = !zeigeRaus;

  const zeile = $('topf-raus');
  chipsBauen(zeigeRaus ? raus.buchstaben : [], zeile, {
    art: 'buchstaben',
    bearbeitbar: true,
    beiKlick: filterUmschalten,
  });
  if (zeigeRaus) {
    const farbChips = document.createElement('ul');
    chipsBauen(raus.farben, farbChips, {
      art: 'farben',
      bearbeitbar: true,
      beiKlick: filterUmschalten,
    });
    zeile.append(...farbChips.children);
  }

  $('topf-knoepfe').hidden = !bearbeitbar;
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
  const ergebnis = draw(jahr, filter);

  knoepfeSperren(true);
  $('kopier-rueckmeldung').textContent = '';
  $('ergebnis-jahr').textContent = `Wichteln ${jahr}`;
  // Die Farbe bricht erst beim Landen herein, sonst verpufft der Moment.
  grundMoeglich();
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

let letztesArchiv = {};
let letztesJahr = new Date().getFullYear();

/** Nimmt einen Eintrag aus dem Topf oder legt ihn zurück. */
const filterUmschalten = (art, wert) => {
  filter = umschalten(filter, art, wert);
  // Ohne Eintrag in der Geschichte, sonst führt Zurück durch jeden Klick.
  history.replaceState(null, '', `#${topfAdresse(filter)}`);
  zeichnen(letztesArchiv, letztesJahr);
};

const zeichnen = (archiv, jahr) => {
  letztesArchiv = archiv;
  letztesJahr = jahr;

  const ansicht = chooseView({ hash: location.hash.slice(1), archiv, jahr });

  if (ansicht.filter) {
    filter = ansicht.filter;
  }

  if (ansicht.art === 'ergebnis') {
    schreibeErgebnis(ansicht.ergebnis);
    zeigeBereich('ergebnis');
  } else if (ansicht.art === 'auslosung') {
    grundMoeglich();
    $('auslosung-jahr').textContent = `Wichteln ${ansicht.jahr}`;
    $('link-auslosung-topf').href = `#${topfAdresse(filter)}`;
    zeigeBereich('auslosung');
  } else if (ansicht.art === 'topf') {
    // Der Topf zeigt, woraus gezogen wird. Beim Ergebnis behält er dessen Farbe,
    // damit der Sprung nicht aussieht wie eine andere Seite.
    if (ansicht.ergebnis) {
      grundFluten(ansicht.ergebnis.farbe, { ruhig: true });
    } else {
      grundMoeglich();
    }
    topfZeichnen(ansicht);
    zeigeBereich('topf');
  } else {
    // Der genaue Grund steht im Token und ist für das Archiv-Skript gedacht,
    // nicht für die Gruppe. Die Seite nennt den wahrscheinlichen Fall.
    grundMoeglich();
    $('fehler-jahr').textContent = `Wichteln ${jahr}`;
    zeigeBereich('fehler');
  }

  zeigeVergangeneJahre(ansicht.vergangeneJahre);
};

const starten = async () => {
  const jahr = new Date().getFullYear();

  // Sofort, damit beim Laden nicht erst der nackte Seitengrund aufblitzt und
  // dann der Farbkreis nachrückt.
  grundMoeglich();

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

  for (const id of ['knopf-auslosen', 'knopf-neu', 'knopf-fehler-auslosen', 'knopf-topf-auslosen']) {
    $(id).addEventListener('click', () => auslosen(archiv, jahr));
  }
  $('knopf-kopieren').addEventListener('click', kopieren);
  $('knopf-topf-zurueck').addEventListener('click', () => {
    location.hash = auslosungAdresse(filter);
  });

  window.addEventListener('hashchange', () => {
    if (location.hash.slice(1) === selbstGesetzterToken) {
      return;
    }
    zeichnen(archiv, jahr);
  });
};

starten();
