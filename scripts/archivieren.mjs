#!/usr/bin/env node
/**
 * Trägt ein ausgelostes Ergebnis ins Archiv einer Runde ein.
 *
 * Archivieren ist Sache des Ausrichters. Die Mitwichtelnden bekommen davon
 * nichts mit und müssen nichts kopieren.
 *
 * Aufruf mit dem geteilten Link, der die Runde schon mitbringt:
 *
 *   npm run archivieren -- 'https://wichtel.turbodev.eu/?runde=geschwisterwichteln#MjAyNnxRfEdsaXR6ZXJ8c3ZoNw'
 *
 * Liegt nur der nackte Token vor, muss die Runde dazu:
 *
 *   npm run archivieren -- --runde geschwisterwichteln MjAyNnxRfEdsaXR6ZXJ8c3ZoNw
 *
 * Ohne Runde bricht das Skript ab, statt irgendwohin zu schreiben. Sonst
 * landet eines Tages ein Ergebnis still in der falschen Datei, und das fällt
 * erst ein Jahr später auf.
 *
 * Ein bereits archiviertes Jahr wird wortlos überschrieben, denn genau das ist
 * der Fall, in dem die Gruppe neu auslosen wollte. Committet wird nicht: die
 * Datei wird geändert, der Commit bleibt beim Menschen.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeToken } from '../src/token.js';
import { addResult, resultFor } from '../src/archive.js';
import { archivPfad, rundeAus } from '../src/runde.js';

const WURZEL = new URL('../', import.meta.url);

/** Nimmt den vollen Link genauso an wie den bloßen Token. */
const tokenAus = (eingabe) => (eingabe.includes('#') ? eingabe.slice(eingabe.indexOf('#') + 1) : eingabe);

/**
 * Zerlegt die Aufrufargumente in Runde und Eingabe.
 *
 * `--runde` ohne Wert ergibt den leeren String und nicht `undefined`: der
 * Unterschied zwischen "nicht angegeben" und "falsch angegeben" muss erhalten
 * bleiben, sonst fiele ein Vertipper still auf den Link zurück.
 */
const argumenteLesen = (argumente) => {
  let runde;
  const uebrig = [];

  for (let i = 0; i < argumente.length; i += 1) {
    if (argumente[i] === '--runde') {
      runde = argumente[i + 1] ?? '';
      i += 1;
    } else {
      uebrig.push(argumente[i]);
    }
  }

  return { runde, eingabe: uebrig[0] };
};

const archivLesen = async (datei) => {
  try {
    return JSON.parse(await readFile(datei, 'utf8'));
  } catch (fehler) {
    if (fehler.code === 'ENOENT') {
      // Die erste Auslosung einer neuen Runde. Die Datei entsteht gleich.
      return {};
    }
    throw new Error(`${datei} ist nicht lesbar: ${fehler.message}`);
  }
};

const main = async () => {
  const { runde: uebersteuert, eingabe } = argumenteLesen(process.argv.slice(2));
  if (!eingabe) {
    console.error('Aufruf: npm run archivieren -- [--runde <slug>] <link-oder-token>');
    process.exit(2);
  }

  const imLink = rundeAus(eingabe);

  // Zwei Runden, die sich widersprechen, sind keine Übersteuerung, sondern ein
  // Versehen. Wortlos eine davon zu nehmen ist genau der stille Fehlgriff, den
  // dieses Skript verhindern soll.
  if (uebersteuert !== undefined && imLink && uebersteuert !== imLink) {
    console.error(`Der Link nennt "${imLink}", --runde nennt "${uebersteuert}". Entscheide dich.`);
    process.exit(2);
  }

  const runde = uebersteuert ?? imLink;
  const pfad = archivPfad(runde);
  if (!pfad) {
    console.error(
      uebersteuert === undefined
        ? 'Keine Runde im Link. Nimm den geteilten Link mit ?runde=<slug> oder gib --runde <slug> dazu.'
        : `"${uebersteuert}" ist kein Rundenname: bis zu 64 Kleinbuchstaben, Ziffern und Bindestriche.`,
    );
    process.exit(2);
  }

  const datei = fileURLToPath(new URL(pfad, WURZEL));

  const ergebnis = decodeToken(tokenAus(eingabe));
  const archiv = await archivLesen(datei);
  const vorher = resultFor(archiv, ergebnis.jahr);

  await mkdir(dirname(datei), { recursive: true });
  await writeFile(datei, `${JSON.stringify(addResult(archiv, ergebnis), null, 2)}\n`, 'utf8');

  if (vorher) {
    console.log(`${ergebnis.jahr}: ${vorher.buchstabe}/${vorher.farbe} ersetzt durch ${ergebnis.buchstabe}/${ergebnis.farbe}`);
  } else {
    console.log(`${ergebnis.jahr}: ${ergebnis.buchstabe}/${ergebnis.farbe} archiviert`);
  }
  console.log(`${pfad} geändert. Der Commit liegt bei dir.`);
};

main().catch((fehler) => {
  console.error(fehler.message);
  process.exit(1);
});
