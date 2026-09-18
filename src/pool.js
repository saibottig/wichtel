/**
 * Die Töpfe, aus denen gezogen wird.
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
 * Gewöhnliche und wilde Farben in einem Topf, jede mit ihrem Tupfer.
 *
 * Die Länge ist gegen Wiederholungen bemessen. Bei 28 Einträgen bleibt eine
 * doppelte Farbe für weit über ein Jahrzehnt unwahrscheinlich, bei der Hälfte
 * fängt es nach ungefähr sechs Jahren an aufzufallen.
 *
 * Nichts ist rausgeflogen, weil es schwer zu kaufen wäre. Dieselbe Entscheidung
 * wie bei Q, X und Y.
 *
 * Der Tupfer ist Darstellung und steht trotzdem hier: eine Farbe wird an einer
 * einzigen Stelle hinzugefügt, und so kann keine Farbe ohne ihren Tupfer
 * existieren.
 */
const FARBTOPF = Object.freeze([
  { name: 'Rot', tupfer: '#d33b33' },
  { name: 'Blau', tupfer: '#2f6fd0' },
  { name: 'Grün', tupfer: '#3a9e52' },
  { name: 'Gelb', tupfer: '#e8cf3f' },
  { name: 'Orange', tupfer: '#e3892f' },
  { name: 'Lila', tupfer: '#8a4fc4' },
  { name: 'Rosa', tupfer: '#e37fae' },
  { name: 'Türkis', tupfer: '#2fb8ad' },
  { name: 'Braun', tupfer: '#8a5a33' },
  { name: 'Schwarz', tupfer: '#1b1b1b' },
  { name: 'Weiß', tupfer: '#f4f4f0' },
  { name: 'Grau', tupfer: '#8d938f' },
  { name: 'Beige', tupfer: '#ddceae' },
  { name: 'Gold', tupfer: 'linear-gradient(135deg, #f6dd8c, #c2932f)' },
  { name: 'Silber', tupfer: 'linear-gradient(135deg, #eef1f3, #9aa3a9)' },
  { name: 'Dunkelblau', tupfer: '#1e3a73' },
  { name: 'Hellgrün', tupfer: '#8ed06a' },
  { name: 'Bordeaux', tupfer: '#7a2233' },
  { name: 'Glitzer', tupfer: 'conic-gradient(#f6dd8c, #fff3c4, #d6a93c, #fffbe8, #f6dd8c)' },
  { name: 'Bunt', tupfer: 'conic-gradient(#d33b33, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4, #d33b33)' },
  { name: 'Neon', tupfer: 'linear-gradient(135deg, #b6ff2e, #17f0d0)' },
  { name: 'Pastell', tupfer: 'linear-gradient(135deg, #f7c9d9, #cfe3f7, #d8f2d4)' },
  { name: 'Gestreift', tupfer: 'repeating-linear-gradient(45deg, #f4f4f0 0 4px, #d33b33 4px 8px)' },
  { name: 'Kariert', tupfer: 'repeating-conic-gradient(#d33b33 0% 25%, #f4f4f0 0% 50%) 0 / 12px 12px' },
  { name: 'Gepunktet', tupfer: 'radial-gradient(#1b1b1b 32%, #f4f4f0 34%) 0 / 8px 8px' },
  {
    name: 'Durchsichtig',
    tupfer:
      'repeating-conic-gradient(rgba(255,255,255,0.22) 0% 25%, rgba(255,255,255,0.05) 0% 50%) 0 / 9px 9px',
  },
  { name: 'Metallic', tupfer: 'linear-gradient(135deg, #cfd6da, #7d878d 45%, #eef1f3 70%, #8c959b)' },
  {
    name: 'Regenbogen',
    tupfer: 'linear-gradient(135deg, #d33b33, #e8892f, #e8cf3f, #3a9e52, #2f6fd0, #8a4fc4)',
  },
]);

/** Der Farbtopf, aus dem gezogen wird. */
export const FARBEN = Object.freeze(FARBTOPF.map(({ name }) => name));

const TUPFER = new Map(FARBTOPF.map(({ name, tupfer }) => [name, tupfer]));

/** Ein neutraler Tupfer für einen Namen, den es im Topf nicht gibt. */
export const TUPFER_UNBEKANNT = 'rgba(255, 255, 255, 0.14)';

/**
 * Wie eine Farbe als Tupfer aussieht.
 *
 * Eine Farbe aus dem Topf hat immer einen. Unbekannte Namen können nur aus
 * einem gefälschten Token kommen, und daran soll die Seite nicht zerbrechen.
 *
 * @param {string} name
 * @returns {string}
 */
export const tupferFuer = (name) => TUPFER.get(name) ?? TUPFER_UNBEKANNT;
