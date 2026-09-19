/**
 * Welcher Teil des Topfes überhaupt in die Auslosung geht.
 *
 * Der Filter hält fest, was draußen bleibt, nicht was drin ist. Das hat zwei
 * Gründe: der übliche Fall ist ein voller Topf, und so bleibt der Link kurz;
 * und kommt später eine Farbe dazu, ist sie selbstverständlich dabei, statt in
 * alten Links zu fehlen.
 *
 * @typedef {{ buchstaben: readonly string[], farben: readonly string[] }} Filter
 */

import { BUCHSTABEN, FARBEN } from './pool.js';

/** Nichts ausgeschlossen, also der ganze Topf. */
export const OHNE_AUSSCHLUSS = Object.freeze({
  buchstaben: Object.freeze([]),
  farben: Object.freeze([]),
});


/**
 * Was nach dem Filter übrig bleibt, in der Reihenfolge des Topfes.
 *
 * Namen, die der Topf nicht mehr kennt, werden übergangen. Sie stammen aus
 * einem Link, der älter ist als eine Änderung am Topf.
 *
 * @param {Filter} filter
 * @returns {{ buchstaben: string[], farben: string[] }}
 */
export const topfVon = (filter) => ({
  buchstaben: BUCHSTABEN.filter((b) => !filter.buchstaben.includes(b)),
  farben: FARBEN.filter((f) => !filter.farben.includes(f)),
});

/**
 * Nimmt einen Eintrag heraus oder legt ihn zurück.
 *
 * Der letzte Eintrag einer Art bleibt drin. Aus einem leeren Topf ließe sich
 * nichts ziehen, und eine Auslosung ohne Ausgang ist keine.
 *
 * @param {Filter} filter
 * @param {'buchstaben' | 'farben'} art
 * @param {string} wert
 * @returns {Filter}
 */
export const umschalten = (filter, art, wert) => {
  const drin = !filter[art].includes(wert);
  if (drin && topfVon(filter)[art].length <= 1) {
    return filter;
  }
  return {
    ...filter,
    [art]: drin ? [...filter[art], wert] : filter[art].filter((eintrag) => eintrag !== wert),
  };
};

/** Nichts ausgeschlossen? */
export const istVoll = (filter) => filter.buchstaben.length === 0 && filter.farben.length === 0;

/**
 * Wie viele Einträge noch im Topf liegen.
 * @param {Filter} filter
 * @returns {{ buchstaben: number, farben: number }}
 */
export const zaehle = (filter) => {
  const topf = topfVon(filter);
  return { buchstaben: topf.buchstaben.length, farben: topf.farben.length };
};

/**
 * Die Einträge, die draußen bleiben, in der Reihenfolge des Topfes.
 *
 * Nebenbei die Reinigung: Namen, die der Topf nicht mehr kennt, fallen weg.
 */
export const ausgeschlossenVon = (filter) => ({
  buchstaben: BUCHSTABEN.filter((b) => filter.buchstaben.includes(b)),
  farben: FARBEN.filter((f) => filter.farben.includes(f)),
});

