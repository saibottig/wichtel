/**
 * Die Töpfe, aus denen gezogen wird, samt Darstellung.
 *
 * Ein flacher Topf je Dimension, jeder Eintrag gleich wahrscheinlich. Glitzer
 * ist damit genauso wahrscheinlich wie Blau, und das ist Absicht.
 */

/**
 * Das Alphabet plus Ä, Ö und Ü.
 *
 * Q, X und Y bleiben drin: ein schwer zu beschenkender Buchstabe ist Teil des
 * Spiels, kein Fehler. ß fehlt, weil kein deutsches Wort damit anfängt.
 */
export const BUCHSTABEN = Object.freeze([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Ä', 'Ö', 'Ü']);

/**
 * Gewöhnliche und wilde Farben in einem Topf.
 *
 * Die Länge ist gegen Wiederholungen bemessen. Bei 30 Einträgen bleibt eine
 * doppelte Farbe für weit über ein Jahrzehnt unwahrscheinlich, bei der Hälfte
 * fängt es nach ungefähr sechs Jahren an aufzufallen.
 *
 * Moosgrün und Sonnengelb kommen aus den Jahren vor der Seite und stehen im
 * Archiv. Sie liegen im selben Topf wie alles andere, können also wieder
 * gezogen werden: ein alter Name ist kein verbrauchter Name.
 *
 * Nichts ist rausgeflogen, weil es schwer zu kaufen wäre. Dieselbe Entscheidung
 * wie bei Q, X und Y.
 *
 * Jeder Eintrag bringt seine Darstellung gleich mit, damit eine Farbe an einer
 * einzigen Stelle hinzugefügt wird:
 *
 * - `tupfer`: der kleine Punkt in der Liste vergangener Jahre.
 * - `flut`: derselbe Grund über die ganze Seite. Fehlt er, tut es der Tupfer.
 *   Gemusterte Farben brauchen ihn, weil eine Kachel von acht Pixeln auf einem
 *   ganzen Bildschirm nur flimmert.
 * - `ton`: ob die Schrift darauf hell oder dunkel steht. Erklärt, nicht
 *   gerechnet, denn die halbe Palette sind Verläufe und ein Verlauf hat keine
 *   eine Helligkeit, aus der sich das ableiten ließe.
 * - `daempfung`: nur für gemusterte Farben. Das Muster liegt dann schwach über
 *   einer ruhigen Grundfarbe, sonst läge der Text auf gestreiftem Grund. Bei
 *   einer einfarbigen Farbe gäbe es nichts zu dämpfen.
 */
const FARBTOPF = Object.freeze([
  { name: 'Rot', tupfer: '#d33b33', ton: 'hell' },
  { name: 'Blau', tupfer: '#2f6fd0', ton: 'hell' },
  { name: 'Grün', tupfer: '#3a9e52', ton: 'hell' },
  { name: 'Gelb', tupfer: '#e8cf3f', ton: 'dunkel' },
  { name: 'Orange', tupfer: '#e3892f', ton: 'dunkel' },
  { name: 'Lila', tupfer: '#8a4fc4', ton: 'hell' },
  { name: 'Rosa', tupfer: '#e37fae', ton: 'dunkel' },
  { name: 'Türkis', tupfer: '#2fb8ad', ton: 'dunkel' },
  { name: 'Braun', tupfer: '#8a5a33', ton: 'hell' },
  { name: 'Schwarz', tupfer: '#1b1b1b', ton: 'hell' },
  { name: 'Weiß', tupfer: '#f4f4f0', ton: 'dunkel' },
  { name: 'Grau', tupfer: '#8d938f', ton: 'dunkel' },
  { name: 'Beige', tupfer: '#ddceae', ton: 'dunkel' },
  {
    name: 'Gold',
    tupfer: 'linear-gradient(135deg, #f6dd8c, #c2932f)',
    flut: 'linear-gradient(160deg, #f9e6a8, #c2932f 70%, #8f6a1c)',
    ton: 'dunkel',
  },
  {
    name: 'Silber',
    tupfer: 'linear-gradient(135deg, #eef1f3, #9aa3a9)',
    flut: 'linear-gradient(160deg, #f4f7f9, #9aa3a9 70%, #6f787e)',
    ton: 'dunkel',
  },
  { name: 'Dunkelblau', tupfer: '#1e3a73', ton: 'hell' },
  { name: 'Hellgrün', tupfer: '#8ed06a', ton: 'dunkel' },
  { name: 'Moosgrün', tupfer: '#5b7238', ton: 'hell' },
  { name: 'Sonnengelb', tupfer: '#f5c21b', ton: 'dunkel' },
  { name: 'Bordeaux', tupfer: '#7a2233', ton: 'hell' },
  {
    name: 'Glitzer',
    tupfer: 'conic-gradient(#f6dd8c, #fff3c4, #d6a93c, #fffbe8, #f6dd8c)',
    flut: 'conic-gradient(from 210deg, #f6dd8c, #fff3c4, #d6a93c, #fffbe8, #e9c65a, #f6dd8c)',
    ton: 'dunkel',
  },
  {
    name: 'Bunt',
    tupfer: 'conic-gradient(#d33b33, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4, #d33b33)',
    ton: 'dunkel',
    daempfung: { basis: '#f4f3f0', staerke: 0.58 },
  },
  {
    name: 'Neon',
    tupfer: 'linear-gradient(135deg, #b6ff2e, #17f0d0)',
    flut: 'linear-gradient(150deg, #b6ff2e, #17f0d0)',
    ton: 'dunkel',
  },
  {
    name: 'Pastell',
    tupfer: 'linear-gradient(135deg, #f7c9d9, #cfe3f7, #d8f2d4)',
    flut: 'linear-gradient(150deg, #f7c9d9, #cfe3f7 55%, #d8f2d4)',
    ton: 'dunkel',
  },
  {
    name: 'Gestreift',
    tupfer: 'repeating-linear-gradient(45deg, #f4f4f0 0 4px, #d33b33 4px 8px)',
    flut: 'repeating-linear-gradient(45deg, #f4f4f0 0 26px, #d33b33 26px 52px)',
    ton: 'hell',
    daempfung: { basis: '#c4392f', staerke: 0.3 },
  },
  {
    name: 'Kariert',
    tupfer: 'repeating-conic-gradient(#d33b33 0% 25%, #f4f4f0 0% 50%) 0 / 12px 12px',
    flut: 'repeating-conic-gradient(#d33b33 0% 25%, #f4f4f0 0% 50%) 0 / 84px 84px',
    ton: 'hell',
    daempfung: { basis: '#c4392f', staerke: 0.3 },
  },
  {
    name: 'Gepunktet',
    tupfer: 'radial-gradient(#1b1b1b 32%, #f4f4f0 34%) 0 / 8px 8px',
    flut: 'radial-gradient(#1b1b1b 30%, #f4f4f0 32%) 0 / 46px 46px',
    ton: 'dunkel',
    daempfung: { basis: '#eeede8', staerke: 0.32 },
  },
  {
    name: 'Durchsichtig',
    tupfer:
      'repeating-conic-gradient(rgba(255,255,255,0.22) 0% 25%, rgba(255,255,255,0.05) 0% 50%) 0 / 9px 9px',
    flut: 'repeating-conic-gradient(#e2e6ea 0% 25%, #fbfcfd 0% 50%) 0 / 52px 52px',
    ton: 'dunkel',
    daempfung: { basis: '#edf0f3', staerke: 0.55 },
  },
  {
    name: 'Metallic',
    tupfer: 'linear-gradient(135deg, #cfd6da, #7d878d 45%, #eef1f3 70%, #8c959b)',
    flut: 'linear-gradient(150deg, #dde3e7, #7d878d 45%, #eef1f3 68%, #838d93)',
    ton: 'dunkel',
  },
  {
    name: 'Regenbogen',
    tupfer: 'linear-gradient(135deg, #d33b33, #e8892f, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4)',
    flut: 'linear-gradient(150deg, #d33b33, #e8892f, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4)',
    ton: 'dunkel',
    daempfung: { basis: '#f4f3f0', staerke: 0.58 },
  },
]);

/** Der Farbtopf, aus dem gezogen wird. */
export const FARBEN = Object.freeze(FARBTOPF.map(({ name }) => name));

/**
 * Die einfarbigen Töne des Topfes.
 *
 * Sie tragen den Grund der Seite, solange noch nichts gezogen ist: vor der
 * Auslosung ist jede Farbe möglich, also sind alle da. Verläufe und Muster
 * bleiben draußen, weil sie selbst schon aus mehreren Farben bestehen und im
 * Kreis nur matschen würden.
 *
 * Kommt eine einfarbige Farbe in den Topf, steht sie hier von selbst mit drin.
 */
export const FARBTOENE = Object.freeze(
  FARBTOPF.map(({ tupfer }) => tupfer).filter((tupfer) => tupfer.startsWith('#')),
);

/** Ein neutraler Tupfer für einen Namen, den es im Topf nicht gibt. */
export const TUPFER_UNBEKANNT = 'rgba(255, 255, 255, 0.14)';

const UNBEKANNT = Object.freeze({
  tupfer: TUPFER_UNBEKANNT,
  flut: '#14261f',
  ton: 'hell',
  daempfung: null,
});

const DARSTELLUNG = new Map(
  FARBTOPF.map(({ name, tupfer, flut, ton, daempfung }) => [
    name,
    Object.freeze({ tupfer, flut: flut ?? tupfer, ton, daempfung: daempfung ?? null }),
  ]),
);

/**
 * Wie eine Farbe dargestellt wird.
 *
 * Eine Farbe aus dem Topf hat immer eine Darstellung. Unbekannte Namen können
 * nur aus einem gefälschten Token kommen, und daran soll die Seite nicht
 * zerbrechen.
 *
 * @param {string} name
 * @returns {{ tupfer: string, flut: string, ton: 'hell' | 'dunkel',
 *             daempfung: { basis: string, staerke: number } | null }}
 */
export const darstellungFuer = (name) => DARSTELLUNG.get(name) ?? UNBEKANNT;

/**
 * Nur der Tupfer, für die Liste der vergangenen Jahre.
 * @param {string} name
 * @returns {string}
 */
export const tupferFuer = (name) => darstellungFuer(name).tupfer;
