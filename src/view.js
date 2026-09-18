/**
 * Was die Seite zeigt.
 *
 * Eine reine Funktion von URL-Token, Archiv und laufendem Jahr auf einen
 * Zustand. Das DOM hängt als dünne Schicht daran und entscheidet nichts.
 *
 * Welches Jahr das laufende ist, entscheidet dieses Modul bewusst nicht. Es
 * bekommt das Jahr gereicht, damit die noch offene Frage nach dem Jahreswechsel
 * an einer Stelle sitzt statt hier drin.
 *
 * @typedef {import('./token.js').Ergebnis} Ergebnis
 * @typedef {import('./archive.js').Archiv} Archiv
 */

import { decodeToken } from './token.js';
import { resultFor, pastYears } from './archive.js';

/**
 * Wählt den Zustand der Seite.
 *
 * Ein Token im Link schlägt das Archiv: der geteilte Link ist der Moment, der
 * Commit nur die Aufzeichnung danach.
 *
 * @param {{ token: string, archiv: Archiv, jahr: number }} eingabe
 * @returns {{ art: 'ergebnis' | 'auslosung' | 'fehler', ergebnis?: Ergebnis,
 *            quelle?: 'link' | 'archiv', grund?: string, jahr?: number,
 *            vergangeneJahre: Ergebnis[] }}
 */
export const chooseView = ({ token, archiv, jahr }) => {
  const ohne = (ausgelassenesJahr) =>
    pastYears(archiv).filter((eintrag) => eintrag.jahr !== ausgelassenesJahr);

  if (token) {
    try {
      const ergebnis = decodeToken(token);
      return { art: 'ergebnis', quelle: 'link', ergebnis, vergangeneJahre: ohne(ergebnis.jahr) };
    } catch (fehler) {
      return { art: 'fehler', grund: fehler.message, vergangeneJahre: pastYears(archiv) };
    }
  }

  const archiviert = resultFor(archiv, jahr);
  if (archiviert) {
    return { art: 'ergebnis', quelle: 'archiv', ergebnis: archiviert, vergangeneJahre: ohne(jahr) };
  }

  return { art: 'auslosung', jahr, vergangeneJahre: ohne(jahr) };
};
