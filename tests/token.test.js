import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encodeToken, decodeToken } from '../src/token.js';
import { OHNE_AUSSCHLUSS } from '../src/filter.js';

const ergebnis = { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer', filter: OHNE_AUSSCHLUSS };

test('ein kodiertes Ergebnis dekodiert unveraendert zurueck', () => {
  assert.deepEqual(decodeToken(encodeToken(ergebnis)), ergebnis);
});

test('Umlaute ueberleben die Kodierung', () => {
  const mitUmlaut = { jahr: 2027, buchstabe: 'Ä', farbe: 'Türkis', filter: OHNE_AUSSCHLUSS };
  assert.deepEqual(decodeToken(encodeToken(mitUmlaut)), mitUmlaut);
});

test('ein eingefrorener Token dekodiert zum bekannten Ergebnis', () => {
  // Literal aus einem fruehen Lauf festgehalten. Schlaegt die Zusicherung fehl,
  // hat sich die Kodierung geaendert und alte Links sind unlesbar geworden.
  assert.deepEqual(decodeToken('MjAyNnxRfEdsaXR6ZXJ8c3ZoNw'), ergebnis);
});

test('der Token verraet die Farbe nicht im Klartext', () => {
  const token = encodeToken(ergebnis);
  assert.ok(!token.includes('Glitzer'));
  assert.ok(!token.includes('2026'));
});

test('der Token ist URL-sicher', () => {
  const token = encodeToken({ jahr: 2026, buchstabe: 'Ü', farbe: 'Weiß' });
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test('ein manipulierter Token wird abgewiesen', () => {
  const token = encodeToken(ergebnis);
  const manipuliert = (token[0] === 'A' ? 'B' : 'A') + token.slice(1);
  assert.throws(() => decodeToken(manipuliert));
});

test('ein abgeschnittener Token wird abgewiesen', () => {
  assert.throws(() => decodeToken(encodeToken(ergebnis).slice(0, -3)));
});

test('Unsinn wird abgewiesen', () => {
  for (const unsinn of ['', '!!!!', 'hallo', 'MjAyNnxR']) {
    assert.throws(() => decodeToken(unsinn), undefined, `akzeptierte: ${unsinn}`);
  }
});

test('ohne Ausschluss bleibt der Token genau der alte', () => {
  // Der volle Topf ist der Normalfall und soll den Link nicht verlängern.
  assert.equal(encodeToken({ ...ergebnis, filter: OHNE_AUSSCHLUSS }), 'MjAyNnxRfEdsaXR6ZXJ8c3ZoNw');
});

test('ein Token ohne Filterteil gilt als voller Topf', () => {
  // Links, die vor dem Filter geteilt wurden, müssen weiter aufgehen.
  assert.deepEqual(decodeToken('MjAyNnxRfEdsaXR6ZXJ8c3ZoNw').filter, OHNE_AUSSCHLUSS);
});

test('ein Ausschluss überlebt die Kodierung', () => {
  const gefiltert = {
    jahr: 2026,
    buchstabe: 'B',
    farbe: 'Neon',
    filter: { buchstaben: ['Q', 'X', 'Ä'], farben: ['Glitzer', 'Durchsichtig'] },
  };
  assert.deepEqual(decodeToken(encodeToken(gefiltert)), gefiltert);
});

test('ein Ausschluss nur auf einer Seite geht auch', () => {
  const nurFarben = {
    jahr: 2026,
    buchstabe: 'B',
    farbe: 'Rot',
    filter: { buchstaben: [], farben: ['Bunt'] },
  };
  assert.deepEqual(decodeToken(encodeToken(nurFarben)), nurFarben);
});

test('ein gefilterter Token wird ebenso auf Unversehrtheit geprüft', () => {
  const token = encodeToken({
    jahr: 2026,
    buchstabe: 'B',
    farbe: 'Neon',
    filter: { buchstaben: ['Q'], farben: [] },
  });
  assert.throws(() => decodeToken(token.slice(0, -2)));
});

test('der Ausschluss steht nicht im Klartext im Link', () => {
  const token = encodeToken({
    jahr: 2026,
    buchstabe: 'B',
    farbe: 'Neon',
    filter: { buchstaben: [], farben: ['Glitzer'] },
  });
  assert.ok(!token.includes('Glitzer'));
});
