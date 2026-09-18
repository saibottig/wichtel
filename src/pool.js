/**
 * Die Töpfeb, aus denen gezogen wird.
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
export const BUCHSTABEN = Object.freeze([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'Ä',
  'Ö',
  'Ü',
]);

/**
 * Gewoehnliche und wilde Farben in einem Topf.
 *
 * Die Laenge ist gegen Wiederholungen bemessen. Bei 28 Eintraegen bleibt eine
 * doppelte Farbe für weit ueber ein Jahrzehnt unwahrscheinlich, bei der Haelfte
 * fängt es nach ungefaehr sechs Jahren an aufzufallen.
 *
 * Nichts ist rausgeflogen, weil es schwer zu kaufen waere. Dieselbe
 * Entscheidung wie bei Q, X und Y.
 */
export const FARBEN = Object.freeze([
  'Rot',
  'Blau',
  'Grün',
  'Gelb',
  'Orange',
  'Lila',
  'Rosa',
  'Türkis',
  'Braun',
  'Schwarz',
  'Weiß',
  'Grau',
  'Beige',
  'Gold',
  'Silber',
  'Dunkelblau',
  'Hellgrün',
  'Bordeaux',
  'Glitzer',
  'Bunt',
  'Neon',
  'Pastell',
  'Gestreift',
  'Kariert',
  'Gepunktet',
  'Durchsichtig',
  'Metallic',
  'Regenbogen',
]);
