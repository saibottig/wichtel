import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FARBEN } from '../src/pool.js';
import { koernerVon, leitfarbe, ganzerTopf } from '../src/farbkoerner.js';

const IST_HEX = /^#[0-9a-f]{6}$/i;

test('jede Farbe des Topfes hat Körner', () => {
  for (const name of FARBEN) {
    const koerner = koernerVon(name);
    assert.ok(koerner.length > 0, `ohne Körner: ${name}`);
  }
});

test('jedes Korn ist ein glatter Farbwert, kein Verlauf', () => {
  for (const name of FARBEN) {
    for (const korn of koernerVon(name)) {
      assert.match(korn, IST_HEX, `${name} trägt ${korn}`);
    }
  }
});

test('jede Farbe hat eine Leitfarbe, und auch die ist ein glatter Wert', () => {
  for (const name of FARBEN) {
    assert.match(leitfarbe(name), IST_HEX, `${name}`);
  }
});

test('die gemusterten Farben bringen mehr als ein Korn mit', () => {
  for (const name of ['Gold', 'Glitzer', 'Bunt', 'Regenbogen', 'Gestreift']) {
    assert.ok(koernerVon(name).length > 1, `${name} sollte mehrfarbig sein`);
  }
});

test('eine einfarbige Farbe ist ihr eigener Tupfer', () => {
  assert.deepEqual([...koernerVon('Rot')], ['#d33b33']);
  assert.equal(leitfarbe('Rot'), '#d33b33');
});

test('bei Gepunktet ist die Leitfarbe der helle Grund und nicht der Punkt', () => {
  // Sonst wäre die Seite nach der Ziehung schwarz, obwohl Gepunktet hell ist.
  assert.ok(koernerVon('Gepunktet').includes('#1b1b1b'));
  assert.notEqual(leitfarbe('Gepunktet'), '#1b1b1b');
});

test('der ganze Topf bringt mindestens ein Korn je Farbe mit', () => {
  assert.ok(ganzerTopf().length >= FARBEN.length);
});

test('ein Name, den es nicht gibt, bricht nicht, sondern wird grau', () => {
  // Kommen kann er nur aus einem gefälschten Token.
  assert.match(leitfarbe('Kupfer'), IST_HEX);
  assert.equal(koernerVon('Kupfer').length, 1);
});
