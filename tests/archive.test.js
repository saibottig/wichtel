import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addResult, resultFor, pastYears } from '../src/archive.js';

const archiv = {
  2024: { buchstabe: 'M', farbe: 'Gold' },
  2026: { buchstabe: 'Q', farbe: 'Glitzer' },
  2025: { buchstabe: 'B', farbe: 'Bunt' },
};

test('ein Ergebnis landet unter seinem Jahr', () => {
  const ergaenzt = addResult({}, { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' });
  assert.deepEqual(ergaenzt, { 2026: { buchstabe: 'Q', farbe: 'Glitzer' } });
});

test('ein zweites Mal ausgelost ueberschreibt das Jahr wortlos', () => {
  const neuAusgelost = addResult(archiv, { jahr: 2026, buchstabe: 'T', farbe: 'Neon' });
  assert.deepEqual(neuAusgelost[2026], { buchstabe: 'T', farbe: 'Neon' });
});

test('das uebergebene Archiv bleibt unangetastet', () => {
  const vorher = structuredClone(archiv);
  addResult(archiv, { jahr: 2026, buchstabe: 'T', farbe: 'Neon' });
  assert.deepEqual(archiv, vorher);
});

test('vergangene Jahre kommen neuestes zuerst', () => {
  assert.deepEqual(pastYears(archiv), [
    { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' },
    { jahr: 2025, buchstabe: 'B', farbe: 'Bunt' },
    { jahr: 2024, buchstabe: 'M', farbe: 'Gold' },
  ]);
});

test('das Jahr kommt als Zahl zurueck, nicht als JSON-Schluessel', () => {
  assert.equal(typeof pastYears(archiv)[0].jahr, 'number');
});

test('ein leeres Archiv ergibt eine leere Liste', () => {
  assert.deepEqual(pastYears({}), []);
});

test('ein einzelnes Jahr laesst sich nachschlagen', () => {
  assert.deepEqual(resultFor(archiv, 2025), { jahr: 2025, buchstabe: 'B', farbe: 'Bunt' });
});

test('ein unbekanntes Jahr ergibt null', () => {
  assert.equal(resultFor(archiv, 2030), null);
});
