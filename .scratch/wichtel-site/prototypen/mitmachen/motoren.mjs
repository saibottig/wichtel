/** Laedt die Vergleichsseite in allen vier Motoren und meldet, was bricht. */
import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('.scratch/wichtel-site/prototypen/mitmachen/bilder', { recursive: true });

const ADRESSE = 'http://127.0.0.1:8099/.scratch/wichtel-site/prototypen/mitmachen/';
const motoren = [
  ['chromium', () => chromium.launch()],
  ['firefox', () => firefox.launch()],
  ['webkit', () => webkit.launch()],
  ['edge', () => chromium.launch({ channel: 'msedge' })],
];

for (const [name, starten] of motoren) {
  try {
    const browser = await starten();
    const seite = await browser.newPage({ viewport: { width: 1660, height: 1040 } });
    const fehler = [];
    seite.on('console', (m) => {
      if (m.type() === 'error') fehler.push(m.text());
    });
    seite.on('pageerror', (f) => fehler.push(`[pageerror] ${f.message}`));
    await seite.goto(ADRESSE, { waitUntil: 'networkidle' });
    await seite.waitForTimeout(1500);
    const buehnen = await seite.locator('.karte .buehne').count();
    await seite.evaluate(() => window.mitmachenStandbild?.(1));
    await seite.waitForTimeout(500);
    await seite
      .locator('.galerie')
      .screenshot({ path: `.scratch/wichtel-site/prototypen/mitmachen/bilder/motor-${name}.png` });
    console.log(`${name}: ${buehnen} Buehnen, ${fehler.length ? fehler.join(' | ') : 'keine Fehler'}`);
    await browser.close();
  } catch (f) {
    console.log(`${name}: geht nicht - ${f.message.split('\n')[0]}`);
  }
}
