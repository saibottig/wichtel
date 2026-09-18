import { test } from 'node:test';
import assert from 'node:assert/strict';

import { draw } from '../src/draw.js';
import { BUCHSTABEN, FARBEN } from '../src/pool.js';

/** Gibt die vorgegebenen Werte der Reihe nach zurueck, statt zu wuerfeln. */
const zufallAus = (...werte) => {
  let i = 0;
  return () => werte[i++];
};

test('die Auslosung reicht das Jahr durch', () => {
  assert.equal(draw(2026, zufallAus(0, 0)).jahr, 2026);
});

test('null trifft den ersten Eintrag beider Toepfe', () => {
  assert.deepEqual(draw(2026, zufallAus(0, 0)), {
    jahr: 2026,
    buchstabe: BUCHSTABEN[0],
    farbe: FARBEN[0],
  });
});

test('knapp unter eins trifft den letzten Eintrag, nicht daneben', () => {
  const ergebnis = draw(2026, zufallAus(0.9999999, 0.9999999));
  assert.equal(ergebnis.buchstabe, BUCHSTABEN.at(-1));
  assert.equal(ergebnis.farbe, FARBEN.at(-1));
});

test('jeder Eintrag beider Toepfe ist erreichbar', () => {
  const gezogeneBuchstaben = BUCHSTABEN.map(
    (_, i) => draw(2026, zufallAus(i / BUCHSTABEN.length, 0)).buchstabe,
  );
  assert.deepEqual(gezogeneBuchstaben, BUCHSTABEN);

  const gezogeneFarben = FARBEN.map((_, i) => draw(2026, zufallAus(0, i / FARBEN.length)).farbe);
  assert.deepEqual(gezogeneFarben, FARBEN);
});

test('ohne vorgegebenen Zufall wird trotzdem gueltig gezogen', () => {
  const ergebnis = draw(2026);
  assert.ok(BUCHSTABEN.includes(ergebnis.buchstabe));
  assert.ok(FARBEN.includes(ergebnis.farbe));
});
