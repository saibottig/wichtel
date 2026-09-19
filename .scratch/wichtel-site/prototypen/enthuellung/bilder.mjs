/**
 * Schiesst Bilder mitten in die Enthuellungen hinein.
 *
 * Das Endbild allein taugt nicht zur Pruefung: vier von fuenf Animationsfehlern
 * der letzten Runde waren am Ende unsichtbar und nur unterwegs zu sehen. Darum
 * nimmt dieses Skript eine Reihe von Zeitpunkten ab und meldet nebenbei jeden
 * Fehler aus der Konsole.
 *
 * Voraussetzung ist ein laufender Server im Wurzelverzeichnis:
 *
 *   npx --yes http-server -p 8099 -s
 *
 * Aufruf:
 *
 *   node .scratch/wichtel-site/prototypen/enthuellung/bilder.mjs <Ordner> [Farbe] [Buchstabe]
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [ordner, farbe = '', buchstabe = ''] = process.argv.slice(2);
if (!ordner) {
  console.error('Es fehlt der Ordner fuer die Bilder.');
  process.exit(1);
}

const ziel = resolve(ordner);
mkdirSync(ziel, { recursive: true });

/** Aufgespult wird in Anteilen, nicht in Millisekunden. */
const MARKEN = [0.08, 0.22, 0.4, 0.58, 0.72, 0.85, 0.94, 1];
const ADRESSE = 'http://127.0.0.1:8099/.scratch/wichtel-site/prototypen/enthuellung/';

const browser = await chromium.launch();
const seite = await browser.newPage({
  viewport: { width: 1660, height: 1000 },
  deviceScaleFactor: 1,
});

const meldungen = [];
seite.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') meldungen.push(`[${m.type()}] ${m.text()}`);
});
seite.on('pageerror', (f) => meldungen.push(`[pageerror] ${f.message}`));
seite.on('requestfailed', (r) => meldungen.push(`[request] ${r.url()} ${r.failure()?.errorText}`));

await seite.goto(ADRESSE, { waitUntil: 'networkidle' });

// Die Seite spielt beim Laden von selbst los. Erst abwarten, sonst zaehlen die
// Zeitpunkte unten ab dem Klick und die Animation ist laengst vorbei.
const alleRuhig = () => {
  const knoepfe = [...document.querySelectorAll('.karte .ab')];
  return knoepfe.length > 0 && knoepfe.every((k) => !k.disabled);
};
await seite.waitForFunction(alleRuhig, null, { timeout: 20000 });

if (farbe) await seite.selectOption('#wahl-farbe', farbe);
if (buchstabe) await seite.selectOption('#wahl-buchstabe', buchstabe);

// Nur die Buehnen, nicht die halbe Seite Erklaertext daneben.
const buehnen = seite.locator('.galerie');

for (const anteil of MARKEN) {
  await seite.evaluate((a) => window.enthuellungStandbild(a), anteil);
  const name = String(Math.round(anteil * 100)).padStart(3, '0');
  await buehnen.screenshot({ path: `${ziel}/${name}.png` });
}

console.log(meldungen.length ? meldungen.join('\n') : 'keine Meldungen');
await browser.close();
