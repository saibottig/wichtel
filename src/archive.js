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
 * @typedef {Record<string, { buchstabe: string, farbe: string }>} Archiv
 */

/**
 * Trägt ein Ergebnis ein und gibt ein neues Archiv zurueck.
 *
 * Ein bereits vorhandenes Jahr wird wortlos überschrieben. Das ist der Fall,
 * in dem die Gruppe neu auslosen wollte, und der letzte Lauf gewinnt.
 *
 * @param {Archiv} archiv
 * @param {Ergebnis} ergebnis
 * @returns {Archiv}
 */
export const addResult = (archiv, { jahr, buchstabe, farbe }) => ({
  ...archiv,
  [jahr]: { buchstabe, farbe },
});

/**
 * Schlaegt ein einzelnes Jahr nach.
 * @param {Archiv} archiv
 * @param {number} jahr
 * @returns {Ergebnis | null}
 */
export const resultFor = (archiv, jahr) => {
  const eintrag = archiv[jahr];
  return eintrag ? { jahr: Number(jahr), ...eintrag } : null;
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
