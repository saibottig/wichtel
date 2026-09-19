/**
 * Das Archiv der vergangenen Jahre.
 *
 * Der Link ist der Moment, der Commit ist die Aufzeichnung. Diese Funktionen
 * arbeiten auf dem Inhalt von `archiv.json`, einem Objekt mit dem Jahr als
 * Schlüssel.
 *
 * Archivieren ist Sache des Ausrichters und passiert über `scripts/archivieren.mjs`.
 * Die Seite liest hier nur.
 *
 * @typedef {import('./token.js').Ergebnis} Ergebnis
 * @typedef {import('./filter.js').Filter} Filter
 * @typedef {Record<string, { buchstabe: string, farbe: string, ausgeschlossen?: Filter }>} Archiv
 */

import { OHNE_AUSSCHLUSS, istVoll, ausgeschlossenVon } from './filter.js';

/**
 * Trägt ein Ergebnis ein und gibt ein neues Archiv zurueck.
 *
 * Ein bereits vorhandenes Jahr wird wortlos überschrieben. Das ist der Fall,
 * in dem die Gruppe neu auslosen wollte, und der letzte Lauf gewinnt.
 *
 * Der Filter wird nur vermerkt, wenn tatsächlich etwas ausgeschlossen war. Ein
 * voller Topf ist der Normalfall und muss nicht in der Datei stehen.
 *
 * @param {Archiv} archiv
 * @param {Ergebnis} ergebnis
 * @returns {Archiv}
 */
export const addResult = (archiv, { jahr, buchstabe, farbe, filter }) => ({
  ...archiv,
  [jahr]: {
    buchstabe,
    farbe,
    ...(filter && !istVoll(filter) ? { ausgeschlossen: ausgeschlossenVon(filter) } : {}),
  },
});

/**
 * Schlägt ein einzelnes Jahr nach.
 * @param {Archiv} archiv
 * @param {number} jahr
 * @returns {Ergebnis | null}
 */
export const resultFor = (archiv, jahr) => {
  const eintrag = archiv[jahr];
  if (!eintrag) {
    return null;
  }
  const { buchstabe, farbe, ausgeschlossen } = eintrag;
  // Ein Jahr ohne vermerkten Filter wurde aus dem vollen Topf gezogen.
  return {
    jahr: Number(jahr),
    buchstabe,
    farbe,
    filter: ausgeschlossen ? ausgeschlossenVon(ausgeschlossen) : OHNE_AUSSCHLUSS,
  };
};

/**
 * Alle archivierten Jahre, neuestes zuerst.
 * @param {Archiv} archiv
 * @returns {Ergebnis[]}
 */
export const pastYears = (archiv) =>
  Object.keys(archiv)
    .map(Number)
    .sort((a, b) => b - a)
    .map((jahr) => resultFor(archiv, jahr));
