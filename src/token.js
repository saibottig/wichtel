/**
 * Der Token, der ein Auslosungsergebnis durch die URL traegt.
 *
 * Trotz des Namens "Hash" im Sprachgebrauch ist das hier eine kodierte
 * Nutzlast, keine kryptografische Prüfsumme: das Archiv-Skript liest sie
 * wieder aus. Undurchsichtig heisst hier nur, dass ein Link in der
 * Gruppenchat-Vorschau das Ergebnis nicht verraet. Wer die Kodierung nachbaut,
 * kann einen Token faelschen, und das ist bewusst so hingenommen.
 *
 * Dieses Modul kennt die Buchstaben- und Farbtoepfe absichtlich nicht. Es
 * kodiert Werte statt Indizes, damit ein Token lesbar bleibt, wenn sich ein
 * Topf spaeter aendert.
 *
 * @typedef {{ jahr: number, buchstabe: string, farbe: string }} Ergebnis
 */

const TRENNER = '|';
const FRUEHESTES_JAHR = 2000;
const SPAETESTES_JAHR = 2199;

/** FNV-1a, auf vier Base36-Zeichen gekuerzt. Faengt Tippfehler, nicht Angreifer. */
const pruefsumme = (text) => {
  let h = 0x811c9dc5;
  for (const zeichen of text) {
    h ^= zeichen.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, '0').slice(-4);
};

const nutzlast = ({ jahr, buchstabe, farbe }) => [jahr, buchstabe, farbe].join(TRENNER);

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
  if (teile.length !== 4) {
    throw new Error('Token ist unvollständig.');
  }

  const [rohesJahr, buchstabe, farbe, mitgelieferteSumme] = teile;
  const kern = [rohesJahr, buchstabe, farbe].join(TRENNER);
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

  return { jahr, buchstabe, farbe };
};
