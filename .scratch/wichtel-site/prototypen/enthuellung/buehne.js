/**
 * Das Gemeinsame aller fuenf Enthuellungen.
 *
 * Jede Enthuellung bringt ihren eigenen Renderer mit, statt sich einen zu
 * teilen. Das kostet fuenf WebGL-Kontexte auf der Vergleichsseite und spart
 * dafuer die ganze Verflechtung: die gewaehlte Variante laesst sich als eine
 * Datei in die Seite heben, ohne ein Geruest mitzunehmen.
 *
 * Der Vertrag eines Enthuellungs-Moduls steht in `index.html`.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { glyphZeile } from './glyph.js';

export const warte = (ms) => new Promise((fertig) => setTimeout(fertig, ms));

export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeIn = (t) => t * t * t;

/** Federt ueber das Ziel hinaus und kommt zurueck. */
export const federn = (t) => {
  const c = 1.70158 + 1;
  return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
};

/**
 * Schneidet einen Abschnitt aus dem Fortschritt heraus und dehnt ihn auf 0 bis 1.
 *
 * Damit liest sich eine Abfolge als das, was sie ist: `spanne(t, 0.4, 0.75)`
 * ist der Teil, der bei vierzig Prozent anfaengt und bei fuenfundsiebzig
 * aufhoert, und davor und danach ist er sauber 0 und 1.
 */
export const spanne = (t, von, bis) => Math.min(Math.max((t - von) / (bis - von), 0), 1);

export const mische = (a, b, t) => a + (b - a) * t;

/** Laeuft `dauer` Millisekunden und ruft `schritt(t, sekunden)` je Bild. */
export const lauf = (dauer, schritt) =>
  new Promise((fertig) => {
    const start = performance.now();
    const bild = (jetzt) => {
      const vergangen = jetzt - start;
      const t = Math.min(vergangen / dauer, 1);
      schritt(t, vergangen / 1000);
      if (t < 1) requestAnimationFrame(bild);
      else fertig();
    };
    requestAnimationFrame(bild);
  });

/**
 * Ein Renderer mit den Einstellungen, die fuer alle fuenf gelten.
 *
 * `tonwert` steht auf `NoToneMapping`, solange eine Enthuellung nichts anderes
 * verlangt. Die gezogene Farbe soll aussehen wie die Farbe im Topf, und jede
 * Tonwertkurve zieht ihr genau das ab. Wo echtes Licht im Spiel ist, hat das
 * Modul einen Grund, davon abzuweichen, und setzt es selbst.
 */
export const rendererBauen = (leinwand, { alpha = true } = {}) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    alpha,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
};

const umgebungen = new WeakMap();

/**
 * Eine Zimmerbeleuchtung als Spiegelbild, damit Metall und Glas etwas haben,
 * worin sie sich spiegeln koennen.
 *
 * Ohne das sieht Gold aus wie brauner Kunststoff. Einmal je Renderer gerechnet,
 * denn die Textur haengt am Kontext.
 */
export const umgebungFuer = (renderer) => {
  if (!umgebungen.has(renderer)) {
    const erzeuger = new THREE.PMREMGenerator(renderer);
    const ziel = erzeuger.fromScene(new RoomEnvironment(), 0.04);
    erzeuger.dispose();
    umgebungen.set(renderer, ziel.texture);
  }
  return umgebungen.get(renderer);
};

/** Ruft `beiAenderung(breite, hoehe)`, sobald das Element seine Groesse aendert. */
export const beobachteGroesse = (element, beiAenderung) => {
  const beobachter = new ResizeObserver(([eintrag]) => {
    const { width, height } = eintrag.contentRect;
    if (width > 0 && height > 0) beiAenderung(width, height);
  });
  beobachter.observe(element);
  return () => beobachter.disconnect();
};

/**
 * Setzt eine Kamera so, dass `hoehe` Einheiten senkrecht ins Bild passen.
 *
 * Die Buehne ist hochkant wie ein Telefon. Waere die Kamera ueber die Breite
 * gesetzt, wuerde der Buchstabe oben und unten aus dem Bild laufen.
 */
export const kameraAufHoehe = (kamera, hoehe, abstand) => {
  kamera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(hoehe / 2 / abstand));
  kamera.position.z = abstand;
  kamera.updateProjectionMatrix();
};

/**
 * Wohin der Buchstabe laufen muss, damit die Seite ihn uebernehmen kann.
 *
 * Das ist der Punkt, an dem sich die letzte Runde verhoben hat: die Animation
 * endete mit einem riesigen Buchstaben in der Mitte, und die Seite setzte
 * gleich darauf einen kleinen unten links hin. Zwei Buchstaben, ein Sprung.
 *
 * Hier laeuft der Buchstabe stattdessen genau dorthin, wo `.riese` in
 * `buehne.css` steht, und schrumpft auf dessen Groesse. Die Uebergabe ist dann
 * eine Ueberblendung an Ort und Stelle und faellt nicht auf.
 *
 * Die Zahlen sind die Masse aus `buehne.css`, als Anteil der Buehnenhoehe. Die
 * Buehne ist immer halb so breit wie hoch, in der Karte wie in der Lupe. Alles
 * andere kommt aus den Massen der Schrift und nicht aus einer Schaetzung: vier
 * Bildpunkte daneben genuegen, und man sieht zwei Buchstaben statt einem.
 */
const RIESE = 0.197; // font-size von .riese
const WORT = 0.0433; // font-size von .wort
const WORT_ZEILE = 1.55; // line-height von .wort
const WORT_ABSTAND = 0.0067; // margin-top von .wort
const RAND_LINKS = 0.0283; // padding-left von .inhalt
const RAND_UNTEN = 0.0333; // padding-bottom von .inhalt
const BREITE = 0.5; // die Buehne ist halb so breit wie hoch

export const landeplatz = (buchstabe, hoeheWelt) => {
  const m = glyphZeile(buchstabe);

  // Die Zeile des Riesen, von der Unterkante der Buehne aus gerechnet.
  const zeileUnten = RAND_UNTEN + WORT * WORT_ZEILE + WORT_ABSTAND;
  const zeileOben = zeileUnten + RIESE;

  // Die Grundlinie in dieser Zeile. Bei `line-height: 1` ist die Zeile so hoch
  // wie die Schriftgroesse, die Schrift selbst aber hoeher, und ihr Ueberhang
  // verteilt sich gleichmaessig nach oben und unten.
  const grundlinie =
    (RIESE - (m.fontAufstieg + m.fontAbstieg) * RIESE) / 2 + m.fontAufstieg * RIESE;
  const tuscheVonOben = grundlinie + ((m.abstieg - m.aufstieg) * RIESE) / 2;

  return {
    hoehe: (m.aufstieg + m.abstieg) * RIESE * hoeheWelt,
    x: (RAND_LINKS + ((m.rechts - m.links) * RIESE) / 2 - BREITE / 2) * hoeheWelt,
    y: (zeileOben - tuscheVonOben - 0.5) * hoeheWelt,
  };
};

/** Zieht eine Farbe so weit ins Helle, dass sie auf dunklem Grund noch traegt. */
export const sichtbar = (farbe, mindest = 0.34) => {
  const hell = Math.max(farbe.r, farbe.g, farbe.b);
  if (hell >= mindest) return farbe;
  if (hell < 0.001) return farbe.setRGB(mindest, mindest, mindest);
  return farbe.multiplyScalar(mindest / hell);
};

export const zufallAus = (liste) => liste[(Math.random() * liste.length) | 0];
