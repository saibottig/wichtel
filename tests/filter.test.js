import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  OHNE_AUSSCHLUSS,
  topfVon,
  umschalten,
  istVoll,
  zaehle,
  ausgeschlossenVon,
} from '../src/filter.js';
import { BUCHSTABEN, FARBEN } from '../src/pool.js';

test('ohne Ausschluss ist der ganze Topf im Spiel', () => {
  assert.deepEqual(topfVon(OHNE_AUSSCHLUSS), { buchstaben: BUCHSTABEN, farben: FARBEN });
  assert.equal(istVoll(OHNE_AUSSCHLUSS), true);
});

test('ausgeschlossene Einträge fehlen im Topf', () => {
  const filter = { buchstaben: ['Q', 'X'], farben: ['Glitzer'] };
  const topf = topfVon(filter);

  assert.ok(!topf.buchstaben.includes('Q'));
  assert.ok(!topf.buchstaben.includes('X'));
  assert.ok(!topf.farben.includes('Glitzer'));
  assert.equal(topf.buchstaben.length, BUCHSTABEN.length - 2);
  assert.equal(topf.farben.length, FARBEN.length - 1);
  assert.equal(istVoll(filter), false);
});

test('der Topf behält die Reihenfolge des Originals', () => {
  const topf = topfVon({ buchstaben: ['C'], farben: [] });
  assert.deepEqual(topf.buchstaben.slice(0, 3), ['A', 'B', 'D']);
});

test('zweimal umschalten führt zurück', () => {
  const einmal = umschalten(OHNE_AUSSCHLUSS, 'buchstaben', 'Q');
  const zweimal = umschalten(einmal, 'buchstaben', 'Q');

  assert.deepEqual(topfVon(einmal).buchstaben.includes('Q'), false);
  assert.equal(istVoll(zweimal), true);
});

test('der übergebene Filter bleibt unangetastet', () => {
  const filter = { buchstaben: ['Q'], farben: [] };
  umschalten(filter, 'buchstaben', 'X');
  assert.deepEqual(filter, { buchstaben: ['Q'], farben: [] });
});

test('der letzte Buchstabe lässt sich nicht auch noch entfernen', () => {
  let filter = { buchstaben: BUCHSTABEN.slice(1), farben: [] };
  assert.equal(topfVon(filter).buchstaben.length, 1);

  filter = umschalten(filter, 'buchstaben', BUCHSTABEN[0]);
  assert.equal(topfVon(filter).buchstaben.length, 1, 'der Topf darf nicht leer werden');
});

test('die letzte Farbe lässt sich nicht auch noch entfernen', () => {
  let filter = { buchstaben: [], farben: FARBEN.slice(1) };
  filter = umschalten(filter, 'farben', FARBEN[0]);
  assert.equal(topfVon(filter).farben.length, 1);
});

test('ein Name, den der Topf nicht mehr kennt, wird übergangen', () => {
  // Kommt aus einem alten Link, dessen Farbe inzwischen aus dem Topf ist.
  const topf = topfVon({ buchstaben: [], farben: ['Mauve', 'Glitzer'] });
  assert.equal(topf.farben.length, FARBEN.length - 1);
});

test('gezählt wird, was drin ist, nicht was fehlt', () => {
  assert.deepEqual(zaehle({ buchstaben: ['Q'], farben: ['Bunt', 'Neon'] }), {
    buchstaben: BUCHSTABEN.length - 1,
    farben: FARBEN.length - 2,
  });
});

test('der Filter ordnet sich nach dem Topf, nicht nach der Eingabe', () => {
  // Zwei Filter mit denselben Einträgen sollen gleich sein, egal wie sie
  // zusammengeklickt wurden.
  const eine = ausgeschlossenVon({ buchstaben: ['C', 'A'], farben: ['Neon', 'Bunt'] });
  const andere = ausgeschlossenVon({ buchstaben: ['A', 'C'], farben: ['Bunt', 'Neon'] });

  assert.deepEqual(eine, andere);
  assert.deepEqual(eine, { buchstaben: ['A', 'C'], farben: ['Bunt', 'Neon'] });
});
