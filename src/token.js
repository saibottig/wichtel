/**
 * Der Token, der ein Auslosungsergebnis durch die URL trägt.
 *
 * Trotz des Namens "Hash" im Sprachgebrauch ist das hier eine kodierte
 * Nutzlast, keine kryptografische Prüfsumme: das Archiv-Skript liest sie
 * wieder aus. Undurchsichtig heisst hier nur, dass ein Link in der
 * Gruppenchat-Vorschau das Ergebnis nicht verraet. Wer die Kodierung nachbaut,
 * kann einen Token faelschen, und das ist bewusst so hingenommen.
 *
 * Dieses Modul kennt die Buchstaben- und Farbtöpfe absichtlich nicht. Es
 * kodiert Werte statt Indizes, damit ein Token lesbar bleibt, wenn sich ein
 * Topf später ändert.
 *
 * @typedef {import('./filter.js').Filter} Filter
 * @typedef {{ jahr: number, buchstabe: string, farbe: string, filter: Filter }} Ergebnis
 */

import { OHNE_AUSSCHLUSS, istVoll, ausgeschlossenVon } from './filter.js';

const TRENNER = '|';
/** Trennt die beiden Listen im Filterteil, und deren Einträge untereinander. */
const ARTEN_TRENNER = ';';
const LISTEN_TRENNER = ',';
const FRUEHESTES_JAHR = 2000;
const SPAETESTES_JAHR = 2199;

/** FNV-1a, auf vier Base36-Zeichen gekürzt. Fängt Tippfehler, nicht Angreifer. */
const pruefsumme = (text) => {
  let h = 0x811c9dc5;
  for (const zeichen of text) {
    h ^= zeichen.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, '0').slice(-4);
};

/**
 * Der Filterteil, oder nichts, wenn der Topf voll ist.
 *
 * Ein voller Topf ist der Normalfall, und dann sieht der Token genauso aus wie
 * vor dem Filter. Das hält den üblichen Link kurz und lässt alte Links gelten.
 */
const filterTeil = (filter) => {
  if (!filter || istVoll(filter)) {
    return null;
  }
  const raus = ausgeschlossenVon(filter);
  return [raus.buchstaben.join(LISTEN_TRENNER), raus.farben.join(LISTEN_TRENNER)].join(
    ARTEN_TRENNER,
  );
};

const nutzlast = ({ jahr, buchstabe, farbe, filter }) => {
  const teil = filterTeil(filter);
  const felder = [jahr, buchstabe, farbe];
  return (teil === null ? felder : [...felder, teil]).join(TRENNER);
};

const filterAus = (teil) => {
  const [buchstaben, farben] = teil.split(ARTEN_TRENNER);
  return ausgeschlossenVon({
    buchstaben: buchstaben ? buchstaben.split(LISTEN_TRENNER) : [],
    farben: farben ? farben.split(LISTEN_TRENNER) : [],
  });
};

const zuBase64Url = (text) => {
  const bytes = new TextEncoder().encode(text);
  const binaer = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binaer).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const ausBase64Url = (token) => {
  const base64 = token.replaceAll('-', '+').replaceAll('_', '/');
  const binaer = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binaer, (zeichen) => zeichen.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

/**
 * Kodiert einen Filter für sich, für den Link auf den Topf.
 * @param {Filter} filter
 * @returns {string}
 */
export const encodeAusschluss = (filter) => zuBase64Url(filterTeil(filter) ?? ARTEN_TRENNER);

/**
 * Liest einen Filter aus seinem eigenen Token.
 * Unlesbares gilt als voller Topf, denn ein kaputter Filter darf die Seite
 * nicht aufhalten.
 * @param {string} token
 * @returns {Filter}
 */
export const decodeAusschluss = (token) => {
  try {
    return filterAus(ausBase64Url(token));
  } catch {
    return OHNE_AUSSCHLUSS;
  }
};

/**
 * Kodiert ein Ergebnis zu dem Token, der hinter dem `#` der geteilten URL steht.
 * @param {Ergebnis} ergebnis
 * @returns {string}
 */
export const encodeToken = (ergebnis) => {
  const kern = nutzlast(ergebnis);
  return zuBase64Url(kern + TRENNER + pruefsumme(kern));
};

/**
 * Liest ein Ergebnis aus einem Token zurueck.
 * @param {string} token
 * @returns {Ergebnis}
 * @throws {Error} wenn der Token unleserlich, unvollständig oder verändert ist
 */
export const decodeToken = (token) => {
  if (typeof token !== 'string' || token === '') {
    throw new Error('Leerer Token.');
  }

  let klartext;
  try {
    klartext = ausBase64Url(token);
  } catch {
    throw new Error('Token ist nicht lesbar.');
  }

  const teile = klartext.split(TRENNER);
  // Vier Felder heißt ein Link von vor dem Filter, also voller Topf.
  if (teile.length !== 4 && teile.length !== 5) {
    throw new Error('Token ist unvollständig.');
  }

  const mitgelieferteSumme = teile.at(-1);
  const [rohesJahr, buchstabe, farbe] = teile;
  const kern = teile.slice(0, -1).join(TRENNER);
  if (pruefsumme(kern) !== mitgelieferteSumme) {
    throw new Error('Token wurde verändert oder abgeschnitten.');
  }

  const jahr = Number(rohesJahr);
  if (!Number.isInteger(jahr) || jahr < FRUEHESTES_JAHR || jahr > SPAETESTES_JAHR) {
    throw new Error(`Jahr außerhalb des gültigen Bereichs: ${rohesJahr}`);
  }
  if (buchstabe === '' || farbe === '') {
    throw new Error('Token nennt keinen Buchstaben oder keine Farbe.');
  }

  return {
    jahr,
    buchstabe,
    farbe,
    filter: teile.length === 5 ? filterAus(teile[3]) : OHNE_AUSSCHLUSS,
  };
};
