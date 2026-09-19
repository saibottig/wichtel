/**
 * Schiesst Bilder mitten in die Bedienung hinein.
 *
 * Eine Animation wird aufgespult, indem man ihren Fortschritt setzt. Eine
 * Bedienung hat keinen Fortschritt, sie hat eine Hand, und die steht in
 * `galerie.js` als gespeicherte Geste. `mitmachenStandbild(t)` spielt davon die
 * ersten t ab und haelt an. Nur so ist ein Bildschirmfoto wiederholbar: fuenf
 * laufende WebGL-Buehnen abzulichten kostet ueber eine Sekunde, und auf die Uhr
 * zu warten geht damit nicht.
 *
 * Voraussetzung ist ein laufender Server im Wurzelverzeichnis:
 *
 *   npx --yes http-server -p 8099 -s
 *
 * Aufruf:
 *
 *   node .scratch/wichtel-site/prototypen/mitmachen/bilder.mjs <Ordner> [Farbe] [Buchstabe]
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

const MARKEN = [0, 0.12, 0.3, 0.52, 0.7, 0.86, 1];
const ADRESSE = 'http://127.0.0.1:8099/.scratch/wichtel-site/prototypen/mitmachen/';

const browser = await chromium.launch();
const seite = await browser.newPage({
  viewport: { width: 1660, height: 1040 },
  deviceScaleFactor: 1,
});

const meldungen = [];
seite.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') meldungen.push(`[${m.type()}] ${m.text()}`);
});
seite.on('pageerror', (f) => meldungen.push(`[pageerror] ${f.message}`));
seite.on('requestfailed', (r) => meldungen.push(`[request] ${r.url()} ${r.failure()?.errorText}`));

await seite.goto(ADRESSE, { waitUntil: 'networkidle' });
await seite.waitForFunction(() => document.querySelectorAll('.karte .buehne').length === 5, null, {
  timeout: 20000,
});

if (farbe) await seite.selectOption('#wahl-farbe', farbe);
if (buchstabe) await seite.selectOption('#wahl-buchstabe', buchstabe);

const buehnen = seite.locator('.galerie');

for (const anteil of MARKEN) {
  await seite.evaluate((a) => window.mitmachenStandbild(a), anteil);
  const name = String(Math.round(anteil * 100)).padStart(3, '0');
  await buehnen.screenshot({ path: `${ziel}/${name}.png` });
}

console.log(meldungen.length ? meldungen.join('\n') : 'keine Meldungen');
await browser.close();
