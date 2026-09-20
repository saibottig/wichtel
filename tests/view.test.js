import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chooseView } from '../src/view.js';
import { encodeToken, encodeAusschluss } from '../src/token.js';
import { OHNE_AUSSCHLUSS } from '../src/filter.js';

const archiv = {
  2024: { buchstabe: 'M', farbe: 'Gold' },
  2025: { buchstabe: 'B', farbe: 'Bunt' },
};

const ansichtFuer = (hash, jahr = 2026) => chooseView({ hash, archiv, jahr });
const voll = { ...OHNE_AUSSCHLUSS };

test('ein gültiger Token zeigt sein Ergebnis', () => {
  const token = encodeToken({ jahr: 2026, buchstabe: 'Q', farbe: 'Glitzer', filter: voll });
  const ansicht = ansichtFuer(token);

  assert.equal(ansicht.art, 'ergebnis');
  assert.equal(ansicht.quelle, 'link');
  assert.equal(ansicht.ergebnis.buchstabe, 'Q');
  assert.equal(ansicht.ergebnis.farbe, 'Glitzer');
});

test('der Link schlägt das Archiv, denn der Link ist der Moment', () => {
  const token = encodeToken({ jahr: 2025, buchstabe: 'Z', farbe: 'Neon', filter: voll });
  assert.equal(ansichtFuer(token).ergebnis.farbe, 'Neon');
});

test('ohne Token zeigt ein archiviertes Jahr seinen Eintrag', () => {
  const ansicht = ansichtFuer('', 2025);
  assert.equal(ansicht.art, 'ergebnis');
  assert.equal(ansicht.quelle, 'archiv');
  assert.equal(ansicht.ergebnis.farbe, 'Bunt');
});

test('ohne Token und ohne Eintrag wird zur Auslosung eingeladen', () => {
  const ansicht = ansichtFuer('');
  assert.equal(ansicht.art, 'auslosung');
  assert.equal(ansicht.jahr, 2026);
  assert.deepEqual(ansicht.filter, OHNE_AUSSCHLUSS);
});

test('ein unleserlicher Token wird als Fehler gezeigt, nicht verschluckt', () => {
  assert.equal(ansichtFuer('kaputt!!').art, 'fehler');
});

test('auch bei kaputtem Token bleiben die vergangenen Jahre sichtbar', () => {
  assert.deepEqual(ansichtFuer('kaputt!!').vergangeneJahre.map((e) => e.jahr), [2025, 2024]);
});

test('das gezeigte Jahr taucht nicht noch einmal unter den vergangenen auf', () => {
  assert.deepEqual(ansichtFuer('', 2025).vergangeneJahre.map((e) => e.jahr), [2024]);
});

test('topf zeigt den Topf und lässt ihn bearbeiten', () => {
  const ansicht = ansichtFuer('topf');
  assert.equal(ansicht.art, 'topf');
  assert.equal(ansicht.bearbeitbar, true);
  assert.deepEqual(ansicht.filter, OHNE_AUSSCHLUSS);
});

test('ein Filter im Topf-Link kommt mit', () => {
  const filter = { buchstaben: ['Q', 'X'], farben: ['Glitzer'] };
  const ansicht = ansichtFuer(`topf~${encodeAusschluss(filter)}`);

  assert.equal(ansicht.art, 'topf');
  assert.equal(ansicht.bearbeitbar, true);
  assert.deepEqual(ansicht.filter, filter);
});

test('die Auslosung merkt sich ihren Filter über die Adresse', () => {
  const filter = { buchstaben: [], farben: ['Bunt'] };
  const ansicht = ansichtFuer(`losen~${encodeAusschluss(filter)}`);

  assert.equal(ansicht.art, 'auslosung');
  assert.deepEqual(ansicht.filter, filter);
});

test('losen lädt zur Auslosung ein, auch wenn das Jahr schon archiviert ist', () => {
  const ansicht = ansichtFuer('losen', 2025);

  assert.equal(ansicht.art, 'auslosung');
  assert.equal(ansicht.jahr, 2025);
  assert.deepEqual(ansicht.filter, OHNE_AUSSCHLUSS);
});

test('auch mit Filter schlägt losen das Archiv', () => {
  const filter = { buchstaben: ['X'], farben: [] };
  const ansicht = ansichtFuer(`losen~${encodeAusschluss(filter)}`, 2025);

  assert.equal(ansicht.art, 'auslosung');
  assert.deepEqual(ansicht.filter, filter);
});

test('das Jahr der Einladung steht nicht auch unter den vergangenen', () => {
  assert.deepEqual(ansichtFuer('losen', 2025).vergangeneJahre.map((e) => e.jahr), [2024]);
});

test('der Topf zu einem Ergebnis zeigt dessen Menge und ist schreibgeschützt', () => {
  const filter = { buchstaben: ['Q'], farben: ['Neon', 'Bunt'] };
  const token = encodeToken({ jahr: 2026, buchstabe: 'B', farbe: 'Rot', filter });
  const ansicht = ansichtFuer(`${token}~topf`);

  assert.equal(ansicht.art, 'topf');
  assert.equal(ansicht.bearbeitbar, false);
  assert.equal(ansicht.ergebnis.farbe, 'Rot');
  // Bunt steht im Topf vor Neon, und so kommt der Filter auch zurück.
  assert.deepEqual(ansicht.filter, { buchstaben: ['Q'], farben: ['Bunt', 'Neon'] });
});

test('ein kaputter Token mit Topf-Anhang bleibt ein Fehler', () => {
  assert.equal(ansichtFuer('kaputt!!~topf').art, 'fehler');
});
