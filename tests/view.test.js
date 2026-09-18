import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chooseView } from '../src/view.js';
import { encodeToken } from '../src/token.js';

const archiv = {
  2024: { buchstabe: 'M', farbe: 'Gold' },
  2025: { buchstabe: 'B', farbe: 'Bunt' },
};

test('ein gueltiger Token zeigt sein Ergebnis', () => {
  const token = encodeToken({ jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' });
  const ansicht = chooseView({ token, archiv, jahr: 2026 });

  assert.equal(ansicht.art, 'ergebnis');
  assert.equal(ansicht.quelle, 'link');
  assert.deepEqual(ansicht.ergebnis, { jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer' });
});

test('der Link schlaegt das Archiv, denn der Link ist der Moment', () => {
  const token = encodeToken({ jahr: 2025, buchstabe: 'Z', farbe: 'Neon' });
  const ansicht = chooseView({ token, archiv, jahr: 2026 });

  assert.equal(ansicht.ergebnis.farbe, 'Neon');
});

test('ohne Token zeigt ein archiviertes Jahr seinen Eintrag', () => {
  const ansicht = chooseView({ token: '', archiv, jahr: 2025 });

  assert.equal(ansicht.art, 'ergebnis');
  assert.equal(ansicht.quelle, 'archiv');
  assert.deepEqual(ansicht.ergebnis, { jahr: 2025, buchstabe: 'B', farbe: 'Bunt' });
});

test('ohne Token und ohne Eintrag wird zur Auslosung eingeladen', () => {
  const ansicht = chooseView({ token: '', archiv, jahr: 2026 });

  assert.equal(ansicht.art, 'auslosung');
  assert.equal(ansicht.jahr, 2026);
});

test('ein unleserlicher Token wird als Fehler gezeigt, nicht verschluckt', () => {
  const ansicht = chooseView({ token: 'kaputt!!', archiv, jahr: 2026 });

  assert.equal(ansicht.art, 'fehler');
  assert.ok(ansicht.grund.length > 0);
});

test('auch bei kaputtem Token bleiben die vergangenen Jahre sichtbar', () => {
  const ansicht = chooseView({ token: 'kaputt!!', archiv, jahr: 2026 });

  assert.deepEqual(ansicht.vergangeneJahre.map((e) => e.jahr), [2025, 2024]);
});

test('das gezeigte Jahr taucht nicht noch einmal unter den vergangenen auf', () => {
  const ansicht = chooseView({ token: '', archiv, jahr: 2025 });

  assert.deepEqual(ansicht.vergangeneJahre.map((e) => e.jahr), [2024]);
});

test('bei der Einladung zur Auslosung sind alle archivierten Jahre gelistet', () => {
  const ansicht = chooseView({ token: '', archiv, jahr: 2026 });

  assert.deepEqual(ansicht.vergangeneJahre.map((e) => e.jahr), [2025, 2024]);
});
