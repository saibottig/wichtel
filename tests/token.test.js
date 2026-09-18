import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encodeToken, decodeToken } from '../src/token.js';

const ergebnis = { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' };

test('ein kodiertes Ergebnis dekodiert unveraendert zurueck', () => {
  assert.deepEqual(decodeToken(encodeToken(ergebnis)), ergebnis);
});

test('Umlaute ueberleben die Kodierung', () => {
  const mitUmlaut = { jahr: 2027, buchstabe: 'Ä', farbe: 'Türkis' };
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
