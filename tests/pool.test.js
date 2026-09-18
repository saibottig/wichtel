import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BUCHSTABEN, FARBEN } from '../src/pool.js';

test('jeder Buchstabe bleibt im Topf, auch die unbequemen', () => {
  for (const buchstabe of ['Q', 'X', 'Y', 'Ä', 'Ö', 'Ü']) {
    assert.ok(BUCHSTABEN.includes(buchstabe), `fehlt: ${buchstabe}`);
  }
});

test('ß ist ausgeschlossen, weil kein deutsches Wort damit beginnt', () => {
  assert.ok(!BUCHSTABEN.includes('ß'));
});

test('der Buchstabentopf ist das Alphabet plus drei Umlaute', () => {
  assert.equal(BUCHSTABEN.length, 29);
});

test('der Farbtopf ist auf Wiederholungen hin bemessen', () => {
  assert.equal(FARBEN.length, 28);
});

test('Glitzer und Bunt liegen im selben Topf wie die gewoehnlichen Farben', () => {
  assert.ok(FARBEN.includes('Glitzer'));
  assert.ok(FARBEN.includes('Bunt'));
  assert.ok(FARBEN.includes('Blau'));
});

test('kein Eintrag doppelt, sonst waere er wahrscheinlicher als die anderen', () => {
  for (const [name, topf] of [['BUCHSTABEN', BUCHSTABEN], ['FARBEN', FARBEN]]) {
    assert.equal(new Set(topf).size, topf.length, `Doppelter Eintrag in ${name}`);
  }
});
