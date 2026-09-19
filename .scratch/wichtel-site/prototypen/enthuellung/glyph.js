/**
 * Der gezogene Buchstabe als Form, aus der sich etwas bauen laesst.
 *
 * Es gibt keine Schriftdatei im Projekt und soll auch keine geben. Der
 * Buchstabe wird stattdessen mit der ganz gewoehnlichen Leinwand gezeichnet und
 * danach ausgelesen: einmal als Textur, einmal als Punktwolke, einmal als
 * Raster. Das traegt Ä, Ö und Ü ohne Sonderbehandlung, weil die Systemschrift
 * sie ohnehin kennt.
 */

import * as THREE from 'three';

const SCHRIFT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Zeichnet den Buchstaben mittig und moeglichst gross auf eine Leinwand.
 *
 * Mittig heisst: nach dem, was tatsaechlich Farbe bekommt, nicht nach der
 * Grundlinie. Sonst haengt ein Ä zu tief und ein O sitzt daneben.
 *
 * @param {string} buchstabe
 * @param {{ groesse?: number, anteil?: number, weich?: number }} einstellungen
 */
export const glyphLeinwand = (buchstabe, { groesse = 512, anteil = 0.82, weich = 0 } = {}) => {
  const leinwand = document.createElement('canvas');
  leinwand.width = groesse;
  leinwand.height = groesse;
  const g = leinwand.getContext('2d', { willReadFrequently: true });

  // Ausrichtung vor dem Messen, nicht danach. `actualBoundingBoxLeft` und
  // `actualBoundingBoxRight` werden vom Ankerpunkt aus gemessen, und der
  // verschiebt sich mit `textAlign`. Wer erst misst und dann ausrichtet,
  // bekommt einen Buchstaben, der halb aus der Leinwand haengt.
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';

  const messen = (schriftgrad) => {
    g.font = `800 ${schriftgrad}px ${SCHRIFT}`;
    const m = g.measureText(buchstabe);
    return {
      breite: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      hoehe: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      oben: m.actualBoundingBoxAscent,
      links: m.actualBoundingBoxLeft,
      rechts: m.actualBoundingBoxRight,
      unten: m.actualBoundingBoxDescent,
    };
  };

  // Erst bei einem Bezugsgrad messen, dann hochrechnen. Ein I braucht damit
  // denselben Platz in der Hoehe wie ein W in der Breite.
  const bezug = groesse * 0.5;
  const m = messen(bezug);
  const passend = (bezug * groesse * anteil) / Math.max(m.breite, m.hoehe);
  const fertig = messen(passend);

  g.clearRect(0, 0, groesse, groesse);
  if (weich > 0) g.filter = `blur(${weich}px)`;
  g.fillStyle = '#ffffff';
  const versatz = (fertig.rechts - fertig.links) / 2;
  g.fillText(
    buchstabe,
    groesse / 2 - versatz,
    groesse / 2 + (fertig.oben - fertig.unten) / 2,
  );
  g.filter = 'none';

  return leinwand;
};

/**
 * Wie breit und wie hoch der Buchstabe im Quadrat von -1 bis 1 steht.
 *
 * Ein I ist schmal und ein W ist breit, und beide werden gleich gross
 * gezeichnet, indem die groessere der beiden Seiten `anteil` ausfuellt. Wer
 * wissen will, wo der Buchstabe endet, muss das hier erfragen und darf es
 * nicht raten.
 */
export const glyphMasse = (buchstabe, { anteil = 0.82 } = {}) => {
  const g = document.createElement('canvas').getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `800 100px ${SCHRIFT}`;
  const m = g.measureText(buchstabe);
  const breite = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const hoehe = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const groesser = Math.max(breite, hoehe);
  return {
    breite: (2 * anteil * breite) / groesser,
    hoehe: (2 * anteil * hoehe) / groesser,
  };
};

/**
 * Wo der Buchstabe in seiner Textzeile steht, als Vielfaches der Schriftgroesse.
 *
 * Das ist die Auskunft, die man braucht, um im Raum genau dorthin zu treffen,
 * wo die Seite den Buchstaben spaeter hinsetzt. Geraten geht es nicht: bei
 * `line-height: 1` ist die Zeile genauso hoch wie die Schriftgroesse, die
 * Schrift selbst aber hoeher, und sie ragt oben und unten heraus. Wie weit,
 * sagt nur die Schrift.
 */
export const glyphZeile = (buchstabe) => {
  const g = document.createElement('canvas').getContext('2d');
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.font = `800 100px ${SCHRIFT}`;
  const m = g.measureText(buchstabe);
  return {
    fontAufstieg: (m.fontBoundingBoxAscent ?? 100) / 100,
    fontAbstieg: (m.fontBoundingBoxDescent ?? 21) / 100,
    aufstieg: m.actualBoundingBoxAscent / 100,
    abstieg: m.actualBoundingBoxDescent / 100,
    links: m.actualBoundingBoxLeft / 100,
    rechts: m.actualBoundingBoxRight / 100,
  };
};

/** Der Buchstabe als Textur, weiss auf durchsichtig. */
export const glyphTextur = (buchstabe, einstellungen) => {
  const textur = new THREE.CanvasTexture(glyphLeinwand(buchstabe, einstellungen));
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.minFilter = THREE.LinearFilter;
  textur.magFilter = THREE.LinearFilter;
  textur.generateMipmaps = false;
  return textur;
};

/** Alle Punkte der Leinwand, an denen der Buchstabe steht. */
const gefuellteFelder = (buchstabe, aufloesung) => {
  const leinwand = glyphLeinwand(buchstabe, { groesse: aufloesung });
  const daten = leinwand.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, aufloesung, aufloesung).data;

  const felder = [];
  for (let y = 0; y < aufloesung; y += 1) {
    for (let x = 0; x < aufloesung; x += 1) {
      if (daten[(y * aufloesung + x) * 4 + 3] > 140) felder.push([x, y]);
    }
  }
  return felder;
};

/**
 * Der Buchstabe als Punktwolke, `anzahl` Punkte in einem Quadrat von -1 bis 1.
 *
 * Gezogen wird mit Zuruecklegen und einem Zittern innerhalb des Bildpunktes.
 * Ein Buchstabe hat wenige tausend gefuellte Felder, die Wolke aber zehnmal so
 * viele Punkte, und ohne das Zittern saessen sie sichtbar in Reihen.
 *
 * @returns {Float32Array} x und y im Wechsel
 */
export const glyphWolke = (buchstabe, anzahl, { aufloesung = 256 } = {}) => {
  const felder = gefuellteFelder(buchstabe, aufloesung);
  const punkte = new Float32Array(anzahl * 2);

  for (let i = 0; i < anzahl; i += 1) {
    const [x, y] = felder[(Math.random() * felder.length) | 0];
    punkte[i * 2] = ((x + Math.random()) / aufloesung) * 2 - 1;
    punkte[i * 2 + 1] = 1 - ((y + Math.random()) / aufloesung) * 2;
  }
  return punkte;
};

/**
 * Der Buchstabe als grobes Raster, ein Platz je gefuelltem Feld.
 *
 * Fuer alles, was aus zaehlbaren Koerpern gebaut wird. Die Zahl der Plaetze
 * haengt am Buchstaben: ein W bekommt mehr Kugeln als ein I, und das ist
 * richtig so.
 *
 * Gezeichnet wird fein und danach zusammengefasst, nicht gleich grob. Ein
 * Buchstabe, der direkt auf dreissig Bildpunkten steht, verliert seine duennen
 * Striche an der Kantenglaettung, und ein E ohne Mittelbalken faellt auf.
 *
 * @returns {Array<{ x: number, y: number, deckung: number }>} im Quadrat von -1 bis 1
 */
export const glyphRaster = (buchstabe, spalten = 30) => {
  const fein = 8;
  const aufloesung = spalten * fein;
  const leinwand = glyphLeinwand(buchstabe, { groesse: aufloesung });
  const daten = leinwand
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, aufloesung, aufloesung).data;

  const plaetze = [];
  for (let zeile = 0; zeile < spalten; zeile += 1) {
    for (let feld = 0; feld < spalten; feld += 1) {
      let summe = 0;
      for (let y = 0; y < fein; y += 1) {
        for (let x = 0; x < fein; x += 1) {
          summe += daten[(((zeile * fein + y) * aufloesung) + feld * fein + x) * 4 + 3];
        }
      }
      const deckung = summe / (fein * fein * 255);
      if (deckung > 0.42) {
        plaetze.push({
          x: ((feld + 0.5) / spalten) * 2 - 1,
          y: 1 - ((zeile + 0.5) / spalten) * 2,
          deckung,
        });
      }
    }
  }
  return plaetze;
};
