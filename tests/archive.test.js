import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addResult, resultFor, pastYears } from '../src/archive.js';
import { OHNE_AUSSCHLUSS } from '../src/filter.js';

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
  assert.deepEqual(
    pastYears(archiv).map(({ jahr, buchstabe, farbe }) => ({ jahr, buchstabe, farbe })),
    [
      { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' },
      { jahr: 2025, buchstabe: 'B', farbe: 'Bunt' },
      { jahr: 2024, buchstabe: 'M', farbe: 'Gold' },
    ],
  );
});

test('das Jahr kommt als Zahl zurueck, nicht als JSON-Schluessel', () => {
  assert.equal(typeof pastYears(archiv)[0].jahr, 'number');
});

test('ein leeres Archiv ergibt eine leere Liste', () => {
  assert.deepEqual(pastYears({}), []);
});

test('ein einzelnes Jahr lässt sich nachschlagen', () => {
  const eintrag = resultFor(archiv, 2025);
  assert.equal(eintrag.jahr, 2025);
  assert.equal(eintrag.buchstabe, 'B');
  assert.equal(eintrag.farbe, 'Bunt');
});

test('ein unbekanntes Jahr ergibt null', () => {
  assert.equal(resultFor(archiv, 2030), null);
});

test('ein gefiltertes Jahr merkt sich, woraus gezogen wurde', () => {
  const ergaenzt = addResult({}, {
    jahr: 2026,
    buchstabe: 'Q',
    farbe: 'Glitzer',
    filter: { buchstaben: ['X'], farben: ['Bunt'] },
  });

  assert.deepEqual(ergaenzt[2026], {
    buchstabe: 'Q',
    farbe: 'Glitzer',
    ausgeschlossen: { buchstaben: ['X'], farben: ['Bunt'] },
  });
});

test('ein voller Topf schreibt nichts in die Datei, was ohnehin gilt', () => {
  const ergaenzt = addResult({}, {
    jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer', filter: OHNE_AUSSCHLUSS,
  });
  assert.deepEqual(ergaenzt[2026], { buchstabe: 'Q', farbe: 'Glitzer' });
});

test('ein nachgeschlagenes Jahr bringt seinen Filter mit', () => {
  const mitFilter = { 2026: { buchstabe: 'Q', farbe: 'Glitzer', ausgeschlossen: { buchstaben: ['X'], farben: [] } } };
  assert.deepEqual(resultFor(mitFilter, 2026).filter, { buchstaben: ['X'], farben: [] });
});

test('ein Jahr ohne gespeicherten Filter gilt als voll gezogen', () => {
  assert.deepEqual(resultFor(archiv, 2025).filter, OHNE_AUSSCHLUSS);
});
