/**
 * Was die Seite zeigt.
 *
 * Eine reine Funktion von Adresse, Archiv und laufendem Jahr auf einen
 * Zustand. Das DOM hängt als dünne Schicht daran und entscheidet nichts.
 *
 * Dieses Modul ist die einzige Stelle, die weiß, was hinter dem `#` steht:
 *
 * - `` leer: die Einladung zur Auslosung
 * - `filter~<ausschluss>`: dieselbe Einladung, aber mit gefiltertem Topf
 * - `topf`: der Topf zum Ansehen und Bearbeiten
 * - `topf~<ausschluss>`: derselbe Topf, schon gefiltert
 * - `<token>`: ein Ergebnis
 * - `<token>~topf`: der Topf, aus dem dieses Ergebnis gezogen wurde
 *
 * `~` kommt in base64url nicht vor, trennt hier also eindeutig. `topf` und
 * `filter` sind als Adressen reserviert; für einen echten Token sind sie viel
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
const FILTER = 'filter';

/** Zerlegt die Adresse in Token, Ziel und mitgegebenen Filter. */
const leseAdresse = (hash) => {
  if (hash === TOPF || hash.startsWith(`${TOPF}~`)) {
    const ausschluss = hash.slice(TOPF.length + 1);
    return { token: '', ziel: TOPF, filter: ausschluss ? decodeAusschluss(ausschluss) : OHNE_AUSSCHLUSS };
  }
  if (hash.startsWith(`${FILTER}~`)) {
    return { token: '', ziel: '', filter: decodeAusschluss(hash.slice(FILTER.length + 1)) };
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

  const archiviert = resultFor(archiv, jahr);
  if (archiviert) {
    return { art: 'ergebnis', quelle: 'archiv', ergebnis: archiviert, vergangeneJahre: ohne(jahr) };
  }

  return {
    art: 'auslosung',
    jahr,
    filter: filter ?? OHNE_AUSSCHLUSS,
    vergangeneJahre: ohne(jahr),
  };
};
