/**
 * Die Auslosung selbst.
 *
 * Der Zufall wird hereingereicht, damit die Ziehung prüfbar bleibt.
 */

import { BUCHSTABEN, FARBEN } from './pool.js';

/** @typedef {import('./token.js').Ergebnis} Ergebnis */

const zieheAus = (topf, zufall) => topf[Math.min(Math.floor(zufall() * topf.length), topf.length - 1)];

/**
 * Zieht einen Buchstaben und eine Farbe für das Jahr.
 *
 * Die Auslosung bindet die ganze Gruppe: ein Buchstabe und eine Farbe pro Jahr,
 * nicht einer pro Person.
 *
 * @param {number} jahr
 * @param {() => number} [zufall] Quelle im Bereich [0, 1), vorgebbar für Tests
 * @returns {Ergebnis}
 */
export const draw = (jahr, zufall = Math.random) => ({
  jahr,
  buchstabe: zieheAus(BUCHSTABEN, zufall),
  farbe: zieheAus(FARBEN, zufall),
});
