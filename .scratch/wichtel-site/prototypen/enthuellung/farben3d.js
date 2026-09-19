/**
 * Der Farbtopf, uebersetzt in Material.
 *
 * Auf der Seite ist eine Farbe ein CSS-Hintergrund. Im Raum ist sie etwas
 * anderes: Gold ist Metall, Glitzer ist Metall mit Klarlack, Durchsichtig ist
 * Glas, Neon leuchtet von selbst, Gestreift traegt ein Muster. Genau das ist
 * der Grund, warum die Enthuellung ueberhaupt in drei Dimensionen gebaut wird.
 * Mit Farbflaechen allein waere der Aufwand nicht zu rechtfertigen.
 *
 * Die Namen kommen aus `src/pool.js`, nicht aus einer zweiten Liste. Kommt eine
 * Farbe in den Topf und fehlt hier, bricht das Modul beim Laden ab, statt still
 * mit Grau weiterzumachen.
 */

import * as THREE from 'three';
import { FARBEN, darstellungFuer } from '../../../../src/pool.js';

/**
 * Wie eine Farbe des Topfes im Raum aussieht.
 *
 * - `basis`: die eine Farbe, wenn nur eine Platz hat. Kanten, Licht, Schimmer.
 * - `wolke`: woraus Partikel und Kugeln gestreut werden. Ohne Angabe die Basis.
 * - `verlauf` / `kreis`: die Textur, linear oder im Kreis.
 * - `muster`: gestreift, kariert oder gepunktet, in zwei Farben.
 * - `metall`, `rauheit`, `leuchten`, `schillern`, `funkeln`, `glas`: das Material.
 */
const AUSSEHEN = {
  Rot: { basis: 0xd33b33, rauheit: 0.48 },
  Blau: { basis: 0x2f6fd0, rauheit: 0.46 },
  'Grün': { basis: 0x3a9e52, rauheit: 0.5 },
  Gelb: { basis: 0xe8cf3f, rauheit: 0.44 },
  Orange: { basis: 0xe3892f, rauheit: 0.46 },
  Lila: { basis: 0x8a4fc4, rauheit: 0.46 },
  Rosa: { basis: 0xe37fae, rauheit: 0.5 },
  'Türkis': { basis: 0x2fb8ad, rauheit: 0.42 },
  Braun: { basis: 0x8a5a33, rauheit: 0.74 },
  Schwarz: { basis: 0x1b1b1b, rauheit: 0.38 },
  'Weiß': { basis: 0xf4f4f0, rauheit: 0.56 },
  Grau: { basis: 0x8d938f, rauheit: 0.6 },
  Beige: { basis: 0xddceae, rauheit: 0.78 },
  Gold: {
    basis: 0xc2932f,
    wolke: [0xf9e6a8, 0xf6dd8c, 0xc2932f, 0x8f6a1c],
    verlauf: [0xf9e6a8, 0xc2932f, 0x8f6a1c],
    metall: 1,
    rauheit: 0.22,
  },
  Silber: {
    basis: 0xb8c0c6,
    wolke: [0xf4f7f9, 0xb8c0c6, 0x6f787e],
    verlauf: [0xf4f7f9, 0x9aa3a9, 0x6f787e],
    metall: 1,
    rauheit: 0.16,
  },
  Dunkelblau: { basis: 0x1e3a73, rauheit: 0.44 },
  'Hellgrün': { basis: 0x8ed06a, rauheit: 0.52 },
  Bordeaux: { basis: 0x7a2233, rauheit: 0.46 },
  Glitzer: {
    basis: 0xe9c65a,
    wolke: [0xfff3c4, 0xf6dd8c, 0xd6a93c, 0xfffbe8],
    kreis: [0xf6dd8c, 0xfff3c4, 0xd6a93c, 0xfffbe8, 0xe9c65a, 0xf6dd8c],
    metall: 1,
    rauheit: 0.12,
    funkeln: true,
  },
  Bunt: {
    basis: 0xd33b33,
    wolke: [0xd33b33, 0xe8cf3f, 0x3a9e52, 0x2f6fd0, 0x8a4fc4],
    kreis: [0xd33b33, 0xe8cf3f, 0x3a9e52, 0x2f6fd0, 0xd33b33],
    rauheit: 0.46,
  },
  Neon: {
    basis: 0x6af58e,
    wolke: [0xb6ff2e, 0x66fa88, 0x17f0d0],
    verlauf: [0xb6ff2e, 0x17f0d0],
    rauheit: 0.3,
    leuchten: 1.6,
  },
  Pastell: {
    basis: 0xe2dbe6,
    wolke: [0xf7c9d9, 0xcfe3f7, 0xd8f2d4],
    verlauf: [0xf7c9d9, 0xcfe3f7, 0xd8f2d4],
    rauheit: 0.72,
  },
  Gestreift: {
    basis: 0xd33b33,
    wolke: [0xf4f4f0, 0xd33b33],
    muster: { art: 'streifen', a: 0xf4f4f0, b: 0xd33b33 },
    rauheit: 0.52,
  },
  Kariert: {
    basis: 0xd33b33,
    wolke: [0xd33b33, 0xf4f4f0],
    muster: { art: 'karo', a: 0xd33b33, b: 0xf4f4f0 },
    rauheit: 0.52,
  },
  Gepunktet: {
    basis: 0xe9e8e3,
    wolke: [0x1b1b1b, 0xf4f4f0],
    muster: { art: 'punkte', a: 0x1b1b1b, b: 0xf4f4f0 },
    rauheit: 0.56,
  },
  Durchsichtig: {
    basis: 0xdfe8ec,
    wolke: [0xe2e6ea, 0xfbfcfd],
    // Zwei Seiten derselben Farbe: als Koerper ist sie Glas, als Flaeche ist
    // sie das Karomuster, mit dem Bildprogramme Durchsichtigkeit zeigen. Genau
    // so haelt es auch `src/pool.js`.
    muster: { art: 'karo', a: 0xe2e6ea, b: 0xfbfcfd },
    glas: true,
    rauheit: 0.05,
  },
  Metallic: {
    basis: 0xa8b1b7,
    wolke: [0xdde3e7, 0xa8b1b7, 0x7d878d],
    verlauf: [0xdde3e7, 0x7d878d, 0xeef1f3, 0x838d93],
    metall: 1,
    rauheit: 0.34,
  },
  Regenbogen: {
    basis: 0xe8892f,
    wolke: [0xd33b33, 0xe8892f, 0xe8cf3f, 0x3a9e52, 0x2f6fd0, 0x8a4fc4],
    verlauf: [0xd33b33, 0xe8892f, 0xe8cf3f, 0x3a9e52, 0x2f6fd0, 0x8a4fc4],
    rauheit: 0.34,
    schillern: 1,
  },
};

const fehlend = FARBEN.filter((name) => !AUSSEHEN[name]);
if (fehlend.length > 0) {
  throw new Error(`Ohne Aussehen im Raum: ${fehlend.join(', ')}`);
}

/** Alle Farben des Topfes, jede als eine Farbe im Raum. */
export const LEITFARBEN = Object.freeze(FARBEN.map((name) => AUSSEHEN[name].basis));

const alsFarbe = (hex) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace);
const alsCss = (hex) => `#${hex.toString(16).padStart(6, '0')}`;

/** Die eine Farbe, wenn nur eine Platz hat. */
export const leitfarbe = (name) => alsFarbe(AUSSEHEN[name].basis);

/** Woraus Partikel und Kugeln gestreut werden. */
export const farbwolke = (name) => {
  const { basis, wolke } = AUSSEHEN[name];
  return (wolke ?? [basis]).map(alsFarbe);
};

/** Alle Farben des Topfes auf einmal, fuer den Zustand vor der Ziehung. */
export const ganzerTopf = () => FARBEN.flatMap((name) => farbwolke(name));

// ---------------------------------------------------------------------------
// Texturen
// ---------------------------------------------------------------------------

const KACHEL = 512;
const texturen = new Map();

const zeichneMuster = (g, { art, a, b }) => {
  g.fillStyle = alsCss(b);
  g.fillRect(0, 0, KACHEL, KACHEL);
  g.fillStyle = alsCss(a);

  if (art === 'streifen') {
    // Gedrehte Rechtecke waeren einfacher, aber sie kacheln nicht: schraege
    // Streifen treffen am Rand der Kachel nur dann wieder aufeinander, wenn
    // ihre Schrittweite die Kachel teilt. Ueber (x + y) gerechnet stimmt das
    // von selbst.
    const bild = g.getImageData(0, 0, KACHEL, KACHEL);
    const schritt = KACHEL / 4;
    const streifen = [(a >> 16) & 255, (a >> 8) & 255, a & 255];
    for (let y = 0; y < KACHEL; y += 1) {
      for (let x = 0; x < KACHEL; x += 1) {
        if ((x + y) % schritt < schritt / 2) {
          const i = (y * KACHEL + x) * 4;
          bild.data[i] = streifen[0];
          bild.data[i + 1] = streifen[1];
          bild.data[i + 2] = streifen[2];
        }
      }
    }
    g.putImageData(bild, 0, 0);
    return;
  }

  if (art === 'karo') {
    const feld = KACHEL / 8;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        if ((x + y) % 2 === 0) g.fillRect(x * feld, y * feld, feld, feld);
      }
    }
    return;
  }

  const abstand = KACHEL / 8;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      g.beginPath();
      g.arc((x + 0.5) * abstand, (y + 0.5) * abstand, abstand * 0.26, 0, Math.PI * 2);
      g.fill();
    }
  }
};

const zeichneTextur = (name) => {
  const aussehen = AUSSEHEN[name];
  const leinwand = document.createElement('canvas');
  leinwand.width = KACHEL;
  leinwand.height = KACHEL;
  const g = leinwand.getContext('2d');

  if (aussehen.muster) {
    zeichneMuster(g, aussehen.muster);
  } else if (aussehen.kreis) {
    const kreis = g.createConicGradient(Math.PI * 0.6, KACHEL / 2, KACHEL / 2);
    aussehen.kreis.forEach((hex, i) => {
      kreis.addColorStop(i / (aussehen.kreis.length - 1), alsCss(hex));
    });
    g.fillStyle = kreis;
    g.fillRect(0, 0, KACHEL, KACHEL);
  } else if (aussehen.verlauf) {
    const strecke = g.createLinearGradient(0, 0, KACHEL, KACHEL);
    aussehen.verlauf.forEach((hex, i) => {
      strecke.addColorStop(i / (aussehen.verlauf.length - 1), alsCss(hex));
    });
    g.fillStyle = strecke;
    g.fillRect(0, 0, KACHEL, KACHEL);
  } else {
    g.fillStyle = alsCss(aussehen.basis);
    g.fillRect(0, 0, KACHEL, KACHEL);
  }

  // Glitzer bekommt sein Funkeln aufgestreut. Ein Verlauf allein glitzert nicht,
  // dafuer braucht es harte kleine Lichter, die das Material spiegeln kann.
  if (aussehen.funkeln) {
    for (let i = 0; i < 900; i += 1) {
      const r = 0.8 + Math.random() * 2.4;
      g.fillStyle = Math.random() > 0.35 ? 'rgba(255,255,255,0.9)' : 'rgba(120,80,10,0.55)';
      g.beginPath();
      g.arc(Math.random() * KACHEL, Math.random() * KACHEL, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  return leinwand;
};

/** Die Textur einer Farbe, einmal gezeichnet und dann wiederverwendet. */
export const texturFuer = (name) => {
  if (!texturen.has(name)) {
    const textur = new THREE.CanvasTexture(zeichneTextur(name));
    textur.colorSpace = THREE.SRGBColorSpace;
    textur.wrapS = THREE.RepeatWrapping;
    textur.wrapT = THREE.RepeatWrapping;
    textur.anisotropy = 4;
    texturen.set(name, textur);
  }
  return texturen.get(name);
};

/** Ob eine Farbe ueberhaupt eine Textur braucht, oder ob eine Farbe reicht. */
export const hatTextur = (name) => {
  const a = AUSSEHEN[name];
  return Boolean(a.muster || a.kreis || a.verlauf || a.funkeln);
};

/**
 * Wie oft die Textur ueber die Buehne laeuft, waagerecht und senkrecht.
 *
 * Zwei verschiedene Faelle, und sie einheitlich zu behandeln war ein Fehler:
 *
 * - Ein Verlauf laeuft genau einmal ueber die ganze Buehne, so wie der
 *   CSS-Verlauf der Seite. Er darf dabei verzerrt werden, denn ein gedehnter
 *   Verlauf ist immer noch derselbe Verlauf. Gekachelt dagegen bekaeme er
 *   Naehte, weil er an seinem Ende nicht dort steht, wo er angefangen hat.
 * - Ein Muster muss sich wiederholen und darf nicht verzerrt werden. Sonst
 *   stehen Streifen, die auf der Seite unter 45 Grad laufen, im Raum auf einmal
 *   unter 63, weil die Buehne doppelt so hoch ist wie breit.
 *
 * Zwei Kacheln je Buehnenhoehe treffen die Schrittweite, die `src/pool.js` fuer
 * die gemusterten Farben vorgibt.
 */
export const kachelung = (name, seitenverhaeltnis) =>
  AUSSEHEN[name].muster
    ? new THREE.Vector2(2 * seitenverhaeltnis, 2)
    : new THREE.Vector2(1, 1);

/**
 * Die Daempfung gemusterter Farben, so wie die Seite sie anwendet.
 *
 * Auf der Seite liegt ein Muster schwach ueber einer ruhigen Grundfarbe, sonst
 * stuende der Text auf gestreiftem Grund. Wer das Ende der Enthuellung selbst
 * malt statt es der Seite zu ueberlassen, muss dasselbe tun, sonst ist der
 * Uebergang ein Sprung.
 *
 * Ohne Daempfung ist die Staerke 1, und `mix(basis, muster, 1)` laesst die
 * Farbe unveraendert. Damit braucht der Shader keine Verzweigung.
 */
export const daempfungFuer = (name) => {
  const { daempfung } = darstellungFuer(name);
  return {
    basis: daempfung
      ? new THREE.Color().setStyle(daempfung.basis, THREE.SRGBColorSpace)
      : new THREE.Color(0, 0, 0),
    staerke: daempfung ? daempfung.staerke : 1,
  };
};

/**
 * Alle Farben des Topfes im Kreis, so wie die Seite sie zeigt, solange nichts
 * gezogen ist.
 */
let topfKreis = null;
export const topfKreisTextur = () => {
  if (!topfKreis) {
    const leinwand = document.createElement('canvas');
    leinwand.width = KACHEL;
    leinwand.height = KACHEL;
    const g = leinwand.getContext('2d');
    const kreis = g.createConicGradient(0, KACHEL / 2, KACHEL / 2);
    const runde = [...LEITFARBEN, LEITFARBEN[0]];
    runde.forEach((hex, i) => kreis.addColorStop(i / (runde.length - 1), alsCss(hex)));
    g.fillStyle = kreis;
    g.fillRect(0, 0, KACHEL, KACHEL);
    topfKreis = new THREE.CanvasTexture(leinwand);
    topfKreis.colorSpace = THREE.SRGBColorSpace;
  }
  return topfKreis;
};

/**
 * Ein Farbband ueber eine Liste von Farben, als Nachschlagetextur fuer Shader.
 *
 * Damit laesst sich im Shader eine Zahl in eine Farbe uebersetzen, ohne
 * achtundzwanzig Verzweigungen zu schreiben.
 */
export const farbbandTextur = (hexwerte, { weich = true } = {}) => {
  const leinwand = document.createElement('canvas');
  leinwand.width = 256;
  leinwand.height = 1;
  const g = leinwand.getContext('2d');

  if (weich) {
    const band = g.createLinearGradient(0, 0, 256, 0);
    hexwerte.forEach((hex, i) => band.addColorStop(i / (hexwerte.length - 1), alsCss(hex)));
    g.fillStyle = band;
    g.fillRect(0, 0, 256, 1);
  } else {
    const breite = 256 / hexwerte.length;
    hexwerte.forEach((hex, i) => {
      g.fillStyle = alsCss(hex);
      g.fillRect(i * breite, 0, Math.ceil(breite), 1);
    });
  }

  const textur = new THREE.CanvasTexture(leinwand);
  textur.colorSpace = THREE.SRGBColorSpace;
  textur.wrapS = THREE.ClampToEdgeWrapping;
  textur.wrapT = THREE.ClampToEdgeWrapping;
  textur.minFilter = THREE.LinearFilter;
  textur.magFilter = THREE.LinearFilter;
  return textur;
};

/**
 * Mischen wie CSS es mischt, als GLSL-Schnipsel zum Voranstellen.
 *
 * Ein Shader rechnet in linearem Licht, CSS rechnet in sRGB. Dieselbe Formel
 * ergibt darum nicht dieselbe Farbe: die Daempfung `mix(basis, muster, 0.3)`
 * faellt im Shader sichtbar heller aus als auf der Seite. Wer eine Mischung
 * nachbauen will, die daneben in CSS steht, muss sie im selben Raum rechnen.
 *
 * Das gilt nur fuer das Nachbauen. Licht, Schimmer und alles andere gehoert
 * weiter in den linearen Raum, dort ist es physikalisch richtig.
 */
export const FARBRAUM = /* glsl */ `
vec3 zuSrgb(vec3 c) {
  vec3 tief = c * 12.92;
  vec3 hoch = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(tief, hoch, step(vec3(0.0031308), c));
}

vec3 vonSrgb(vec3 c) {
  vec3 tief = c / 12.92;
  vec3 hoch = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(tief, hoch, step(vec3(0.04045), c));
}

/* Wie mix, nur so, wie der Browser zwei Farben uebereinanderlegt. */
vec3 mischeWieCss(vec3 a, vec3 b, float t) {
  return vonSrgb(mix(zuSrgb(a), zuSrgb(b), t));
}
`;

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

/**
 * Das Material einer Farbe.
 *
 * `kacheln` sagt, wie oft die Textur auf dem Koerper liegt. Eine Kugel von zwei
 * Zentimetern braucht ein feineres Karo als eine Wand.
 */
export const materialFuer = (name, { kacheln = 1, zusatz = {} } = {}) => {
  const a = AUSSEHEN[name];

  if (a.glas) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1,
      thickness: 0.8,
      ior: 1.48,
      dispersion: 2.5,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      ...zusatz,
    });
  }

  const textur = hatTextur(name) ? texturFuer(name).clone() : null;
  if (textur) {
    textur.needsUpdate = true;
    textur.repeat.set(kacheln, kacheln);
  }

  return new THREE.MeshPhysicalMaterial({
    color: textur ? 0xffffff : alsFarbe(a.basis),
    map: textur,
    metalness: a.metall ?? 0,
    roughness: a.rauheit ?? 0.5,
    emissive: a.leuchten ? alsFarbe(a.basis) : 0x000000,
    emissiveIntensity: a.leuchten ?? 0,
    iridescence: a.schillern ?? 0,
    iridescenceIOR: 1.6,
    clearcoat: a.funkeln ? 1 : 0,
    clearcoatRoughness: 0.08,
    ...zusatz,
  });
};

/** Ob die Schrift auf dieser Farbe hell oder dunkel steht, aus dem Topf. */
export { darstellungFuer };
