import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BUCHSTABEN, FARBEN, tupferFuer, darstellungFuer, TUPFER_UNBEKANNT } from '../src/pool.js';

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

test('jede Farbe im Topf hat ihren eigenen Tupfer', () => {
  for (const farbe of FARBEN) {
    assert.notEqual(tupferFuer(farbe), TUPFER_UNBEKANNT, `ohne Tupfer: ${farbe}`);
  }
});

test('kein Tupfer wird von zwei Farben geteilt', () => {
  const tupfer = FARBEN.map(tupferFuer);
  assert.equal(new Set(tupfer).size, tupfer.length);
});

test('ein erfundener Farbname zerbricht die Seite nicht', () => {
  assert.equal(tupferFuer('Quatschfarbe'), TUPFER_UNBEKANNT);
});

test('jede Farbe erklärt ihren Schriftton', () => {
  for (const farbe of FARBEN) {
    const { ton } = darstellungFuer(farbe);
    assert.ok(['hell', 'dunkel'].includes(ton), `${farbe} hat den Ton ${ton}`);
  }
});

test('jede Farbe bringt einen Grund für die ganze Fläche mit', () => {
  for (const farbe of FARBEN) {
    assert.ok(darstellungFuer(farbe).flut.length > 0, `${farbe} ohne Flut`);
  }
});

test('eine Dämpfung nennt ihre Grundfarbe und bleibt zwischen null und eins', () => {
  for (const farbe of FARBEN) {
    const { daempfung } = darstellungFuer(farbe);
    if (daempfung === null) continue;
    assert.ok(daempfung.basis.length > 0, `${farbe} dämpft ohne Grundfarbe`);
    assert.ok(daempfung.staerke > 0 && daempfung.staerke <= 1, `${farbe}: ${daempfung.staerke}`);
  }
});

test('nur gemusterte Farben werden gedämpft, die einfarbigen nicht', () => {
  // Eine Dämpfung ueber einer einzelnen Farbe waere wirkungslos.
  for (const farbe of ['Rot', 'Blau', 'Weiß', 'Schwarz', 'Gold', 'Glitzer']) {
    assert.equal(darstellungFuer(farbe).daempfung, null, `${farbe} sollte ungedämpft sein`);
  }
});

test('ein erfundener Farbname liefert eine vollständige, neutrale Darstellung', () => {
  const d = darstellungFuer('Quatschfarbe');
  assert.equal(d.tupfer, TUPFER_UNBEKANNT);
  assert.ok(['hell', 'dunkel'].includes(d.ton));
  assert.ok(d.flut.length > 0);
});
