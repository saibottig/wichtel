#!/usr/bin/env node
/**
 * Traegt ein ausgelostes Ergebnis ins Archiv ein.
 *
 * Archivieren ist Sache des Ausrichters. Die Mitwichtelnden bekommen davon
 * nichts mit und muessen nichts kopieren.
 *
 * Aufruf mit dem geteilten Link oder nur dem Token dahinter:
 *
 *   npm run archivieren -- 'https://wichtel.turbodev.eu/#MjAyNnxRfEdsaXR6ZXJ8c3ZoNw'
 *   npm run archivieren -- MjAyNnxRfEdsaXR6ZXJ8c3ZoNw
 *
 * Ein bereits archiviertes Jahr wird wortlos ueberschrieben, denn genau das ist
 * der Fall, in dem die Gruppe neu auslosen wollte. Committet wird nicht: die
 * Datei wird geändert, der Commit bleibt beim Menschen.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { decodeToken } from '../src/token.js';
import { addResult, resultFor } from '../src/archive.js';

const ARCHIV = fileURLToPath(new URL('../archiv.json', import.meta.url));

/** Nimmt den vollen Link genauso an wie den blossen Token. */
const tokenAus = (eingabe) => (eingabe.includes('#') ? eingabe.slice(eingabe.indexOf('#') + 1) : eingabe);

const archivLesen = async () => {
  try {
    return JSON.parse(await readFile(ARCHIV, 'utf8'));
  } catch (fehler) {
    if (fehler.code === 'ENOENT') {
      return {};
    }
    throw new Error(`archiv.json ist nicht lesbar: ${fehler.message}`);
  }
};

const main = async () => {
  const eingabe = process.argv[2];
  if (!eingabe) {
    console.error('Aufruf: npm run archivieren -- <link-oder-token>');
    process.exit(2);
  }

  const ergebnis = decodeToken(tokenAus(eingabe));
  const archiv = await archivLesen();
  const vorher = resultFor(archiv, ergebnis.jahr);

  await writeFile(ARCHIV, `${JSON.stringify(addResult(archiv, ergebnis), null, 2)}\n`, 'utf8');

  if (vorher) {
    console.log(`${ergebnis.jahr}: ${vorher.buchstabe}/${vorher.farbe} ersetzt durch ${ergebnis.buchstabe}/${ergebnis.farbe}`);
  } else {
    console.log(`${ergebnis.jahr}: ${ergebnis.buchstabe}/${ergebnis.farbe} archiviert`);
  }
  console.log('archiv.json geändert. Der Commit liegt bei dir.');
};

main().catch((fehler) => {
  console.error(fehler.message);
  process.exit(1);
});
