/**
 * Die Farben des Topfes als Staubkoerner.
 *
 * Die Enthuellung laesst den ganzen Topf als Staub kreisen und wechselt
 * unterwegs in die gezogene Farbe. Dafuer braucht jede Farbe eine Handvoll
 * echter Farbwerte, und das ist etwas anderes als ihr Hintergrund: Gold ist
 * kein Verlauf mehr, sondern drei Goldtoene, und Gestreift ist kein Muster,
 * sondern Rot und Weiss.
 *
 * Einfarbige Farben bringen ihren Wert schon mit, der steht im Topf. Nur die
 * Verlaeufe und Muster muessen hier aufgeschluesselt werden.
 */

import { FARBEN, darstellungFuer } from './pool.js';

/**
 * Woraus der Staub der gemusterten Farben besteht.
 *
 * Die Werte stammen aus denselben Verlaeufen und Mustern, die `pool.js` als
 * Hintergrund setzt. Kommt dort eine Farbe dazu, die kein schlichtes `#rrggbb`
 * ist, muss sie auch hier stehen, sonst bricht das Modul beim Laden ab.
 */
const GEMUSTERT = Object.freeze({
  Gold: { leit: '#c2932f', koerner: ['#f9e6a8', '#f6dd8c', '#c2932f', '#8f6a1c'] },
  Silber: { leit: '#b8c0c6', koerner: ['#f4f7f9', '#b8c0c6', '#9aa3a9', '#6f787e'] },
  Glitzer: { leit: '#e9c65a', koerner: ['#fff3c4', '#f6dd8c', '#d6a93c', '#fffbe8'] },
  Bunt: { leit: '#d33b33', koerner: ['#d33b33', '#e8cf3f', '#3a9e52', '#2f6fd0', '#8a4fc4'] },
  Neon: { leit: '#6af58e', koerner: ['#b6ff2e', '#66fa88', '#17f0d0'] },
  Pastell: { leit: '#e2dbe6', koerner: ['#f7c9d9', '#cfe3f7', '#d8f2d4'] },
  Gestreift: { leit: '#d33b33', koerner: ['#f4f4f0', '#d33b33'] },
  Kariert: { leit: '#d33b33', koerner: ['#d33b33', '#f4f4f0'] },
  // Der Grund ist hell und die Punkte sind dunkel. Die eine Farbe ist der
  // Grund, die Koerner sind beides.
  Gepunktet: { leit: '#e9e8e3', koerner: ['#1b1b1b', '#f4f4f0'] },
  Durchsichtig: { leit: '#dfe8ec', koerner: ['#e2e6ea', '#fbfcfd'] },
  Metallic: { leit: '#a8b1b7', koerner: ['#dde3e7', '#a8b1b7', '#7d878d'] },
  Regenbogen: {
    leit: '#e8892f',
    koerner: ['#d33b33', '#e8892f', '#e8cf3f', '#3a9e52', '#2f6fd0', '#8a4fc4'],
  },
});

const STAUB = new Map(
  FARBEN.map((name) => {
    const { tupfer } = darstellungFuer(name);
    if (tupfer.startsWith('#')) return [name, { leit: tupfer, koerner: Object.freeze([tupfer]) }];
    const eintrag = GEMUSTERT[name];
    if (!eintrag) return [name, null];
    return [name, { leit: eintrag.leit, koerner: Object.freeze([...eintrag.koerner]) }];
  }),
);

const fehlend = [...STAUB].filter(([, wert]) => wert === null).map(([name]) => name);
if (fehlend.length > 0) {
  throw new Error(`Ohne Staubfarben: ${fehlend.join(', ')}`);
}

/** Ein unauffaelliger Ersatz fuer einen Namen, den es im Topf nicht gibt. */
const UNBEKANNT = Object.freeze({ leit: '#8d938f', koerner: Object.freeze(['#8d938f']) });

/**
 * Die Koerner einer Farbe.
 * @param {string} name
 * @returns {readonly string[]}
 */
export const koernerVon = (name) => (STAUB.get(name) ?? UNBEKANNT).koerner;

/**
 * Die eine Farbe, wenn nur eine Platz hat.
 *
 * Nicht einfach die erste der Koerner: bei Gepunktet ist die Farbe, an die man
 * denkt, der helle Grund, und der ist kein Korn.
 */
export const leitfarbe = (name) => (STAUB.get(name) ?? UNBEKANNT).leit;

/** Alle Farben des Topfes auf einmal, fuer den Zustand vor der Ziehung. */
export const ganzerTopf = () => FARBEN.flatMap((name) => [...koernerVon(name)]);
