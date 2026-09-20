/**
 * Was die Seite zeigt.
 *
 * Eine reine Funktion von Adresse, Archiv und laufendem Jahr auf einen
 * Zustand. Das DOM hängt als dünne Schicht daran und entscheidet nichts.
 *
 * Dieses Modul ist die einzige Stelle, die weiß, was hinter dem `#` steht:
 *
 * - `` leer: die Einladung zur Auslosung, oder das archivierte Jahr
 * - `losen`: die Einladung, ausdrücklich, auch wenn das Jahr schon archiviert ist
 * - `losen~<ausschluss>`: dieselbe Einladung, aber mit gefiltertem Topf
 * - `topf`: der Topf zum Ansehen und Bearbeiten
 * - `topf~<ausschluss>`: derselbe Topf, schon gefiltert
 * - `<token>`: ein Ergebnis
 * - `<token>~topf`: der Topf, aus dem dieses Ergebnis gezogen wurde
 *
 * Der Unterschied zwischen leer und `losen` ist der Weg dorthin. Leer ist, wer
 * die Seite aufruft, und der soll sehen, was für dieses Jahr gilt. `losen` ist,
 * wer von einem Ergebnis aus zurückgegangen ist, und der will ziehen.
 *
 * `~` kommt in base64url nicht vor, trennt hier also eindeutig. `topf` und
 * `losen` sind als Adressen reserviert; für einen echten Token sind sie viel
 * zu kurz, weil der immer Jahr, Buchstabe, Farbe und Prüfsumme trägt.
 *
 * Welches Jahr das laufende ist, entscheidet dieses Modul bewusst nicht. Es
 * bekommt das Jahr gereicht, damit die noch offene Frage nach dem Jahreswechsel
 * an einer Stelle sitzt statt hier drin.
 *
 * @typedef {import('./token.js').Ergebnis} Ergebnis
 * @typedef {import('./archive.js').Archiv} Archiv
 * @typedef {import('./filter.js').Filter} Filter
 */

import { decodeToken, decodeAusschluss } from './token.js';
import { OHNE_AUSSCHLUSS } from './filter.js';
import { resultFor, pastYears } from './archive.js';

const TOPF = 'topf';
const LOSEN = 'losen';

/** Passt die Adresse auf ein reserviertes Wort, mit oder ohne Filter dahinter? */
const istWort = (hash, wort) => hash === wort || hash.startsWith(`${wort}~`);

/**
 * Der Filter hinter einem reservierten Wort, also das Stück nach dem `~`.
 * Steht da nichts, ist der Topf voll.
 */
const filterHinter = (hash, wort) => {
  const ausschluss = hash.slice(wort.length + 1);
  return ausschluss ? decodeAusschluss(ausschluss) : OHNE_AUSSCHLUSS;
};

/** Zerlegt die Adresse in Token, Ziel und mitgegebenen Filter. */
const leseAdresse = (hash) => {
  if (istWort(hash, TOPF)) {
    return { token: '', ziel: TOPF, filter: filterHinter(hash, TOPF) };
  }
  if (istWort(hash, LOSEN)) {
    return { token: '', ziel: LOSEN, filter: filterHinter(hash, LOSEN) };
  }
  if (hash.endsWith(`~${TOPF}`)) {
    return { token: hash.slice(0, -(TOPF.length + 1)), ziel: TOPF, filter: null };
  }
  return { token: hash, ziel: '', filter: null };
};

/**
 * Wählt den Zustand der Seite.
 *
 * Ein Token in der Adresse schlägt das Archiv: der geteilte Link ist der
 * Moment, der Commit nur die Aufzeichnung danach.
 *
 * @param {{ hash: string, archiv: Archiv, jahr: number }} eingabe
 * @returns {{ art: 'ergebnis' | 'auslosung' | 'fehler' | 'topf', ergebnis?: Ergebnis,
 *             quelle?: 'link' | 'archiv', jahr?: number, filter?: Filter,
 *             bearbeitbar?: boolean, vergangeneJahre: Ergebnis[] }}
 */
export const chooseView = ({ hash, archiv, jahr }) => {
  const { token, ziel, filter } = leseAdresse(hash);
  const ohne = (ausgelassenesJahr) =>
    pastYears(archiv).filter((eintrag) => eintrag.jahr !== ausgelassenesJahr);

  if (token) {
    let ergebnis;
    try {
      ergebnis = decodeToken(token);
    } catch {
      return { art: 'fehler', vergangeneJahre: pastYears(archiv) };
    }
    if (ziel === TOPF) {
      // Der Topf zu einem gezogenen Ergebnis zeigt nur, woraus gezogen wurde.
      return {
        art: 'topf',
        bearbeitbar: false,
        filter: ergebnis.filter,
        ergebnis,
        vergangeneJahre: ohne(ergebnis.jahr),
      };
    }
    return { art: 'ergebnis', quelle: 'link', ergebnis, vergangeneJahre: ohne(ergebnis.jahr) };
  }

  if (ziel === TOPF) {
    return { art: 'topf', bearbeitbar: true, filter, jahr, vergangeneJahre: ohne(jahr) };
  }

  const einladung = () => ({
    art: 'auslosung',
    jahr,
    filter: filter ?? OHNE_AUSSCHLUSS,
    vergangeneJahre: ohne(jahr),
  });

  // Wer ausdrücklich losen will, bekommt die Einladung, auch wenn für dieses
  // Jahr schon ein Ergebnis im Archiv steht. Sonst käme er von dort nie weg.
  if (ziel === LOSEN) {
    return einladung();
  }

  const archiviert = resultFor(archiv, jahr);
  if (archiviert) {
    return { art: 'ergebnis', quelle: 'archiv', ergebnis: archiviert, vergangeneJahre: ohne(jahr) };
  }

  return einladung();
};
