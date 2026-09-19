/**
 * Die Auslosung selbst.
 *
 * Der Zufall wird hereingereicht, damit die Ziehung prüfbar bleibt.
 */

import { topfVon } from './filter.js';

/** @typedef {import('./token.js').Ergebnis} Ergebnis */

/**
 * Greift einen Eintrag aus einem Topf.
 *
 * Die Klammer fängt den Fall ab, dass die Zufallsquelle doch einmal genau 1
 * liefert. Ohne sie käme undefined zurück.
 *
 * @param {readonly string[]} topf
 * @param {() => number} zufall
 * @returns {string}
 */
export const waehleAus = (topf, zufall) =>
  topf[Math.min(Math.floor(zufall() * topf.length), topf.length - 1)];

/**
 * Zieht einen Buchstaben und eine Farbe für das Jahr.
 *
 * Die Auslosung bindet die ganze Gruppe: ein Buchstabe und eine Farbe pro Jahr,
 * nicht einer pro Person.
 *
 * Gezogen wird nur aus dem, was der Filter übrig lässt. Das Ergebnis trägt den
 * Filter mit, damit später nachvollziehbar bleibt, woraus gezogen wurde.
 *
 * @param {number} jahr
 * @param {import('./filter.js').Filter} filter
 * @param {() => number} [zufall] Quelle im Bereich [0, 1), vorgebbar für Tests
 * @returns {Ergebnis}
 */
export const draw = (jahr, filter, zufall = Math.random) => {
  const topf = topfVon(filter);
  return {
    jahr,
    buchstabe: waehleAus(topf.buchstaben, zufall),
    farbe: waehleAus(topf.farben, zufall),
    filter,
  };
};
