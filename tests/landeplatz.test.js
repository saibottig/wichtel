import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tuscheKasten, inWelt } from '../src/landeplatz.js';

/** Ungefähr die Maße einer fetten Grotesk, in Vielfachen der Schriftgröße. */
const MASSE = {
  fontAufstieg: 1,
  fontAbstieg: 0.2,
  aufstieg: 0.72,
  abstieg: 0,
  links: -0.05,
  rechts: 0.75,
};

test('die Tusche sitzt auf der Grundlinie, nicht in der Mitte der Zeile', () => {
  const kasten = tuscheKasten({ links: 100, oben: 200, hoehe: 110 }, 100, MASSE);

  // Die Zeile ist 110 hoch, die Schrift 120. Sie ragt also oben und unten je 5
  // heraus, die Grundlinie liegt bei 200 - 5 + 100 = 295, und eine Versalie
  // ohne Unterlänge steht mit ihrer Mitte 36 darüber.
  assert.equal(kasten.y, 259);
  assert.equal(kasten.hoehe, 72);
});

test('die Mitte der Tusche liegt rechts vom Anfang der Zeile', () => {
  const kasten = tuscheKasten({ links: 100, oben: 200, hoehe: 110 }, 100, MASSE);
  assert.equal(kasten.x, 140);
});

test('eine Zeile, die höher ist als die Schrift, schiebt die Tusche nach unten', () => {
  const eng = tuscheKasten({ links: 0, oben: 0, hoehe: 100 }, 100, MASSE);
  const weit = tuscheKasten({ links: 0, oben: 0, hoehe: 160 }, 100, MASSE);

  assert.ok(weit.y > eng.y, 'mehr Zeilenhöhe muss tiefer liegen');
  assert.equal(weit.y - eng.y, 30, 'und zwar um die halbe Zunahme');
  assert.equal(weit.hoehe, eng.hoehe, 'die Tusche selbst wächst nicht mit');
});

test('ein Buchstabe mit Unterlänge hängt tiefer als einer ohne', () => {
  const ohne = tuscheKasten({ links: 0, oben: 0, hoehe: 110 }, 100, MASSE);
  const mit = tuscheKasten(
    { links: 0, oben: 0, hoehe: 110 },
    100,
    { ...MASSE, abstieg: 0.2 },
  );

  assert.ok(mit.y > ohne.y);
  assert.equal(mit.hoehe, 92);
});

test('die Schriftgröße zieht alles gleichmäßig mit', () => {
  const klein = tuscheKasten({ links: 0, oben: 0, hoehe: 55 }, 50, MASSE);
  const gross = tuscheKasten({ links: 0, oben: 0, hoehe: 110 }, 100, MASSE);

  assert.equal(gross.x, klein.x * 2);
  assert.equal(gross.y, klein.y * 2);
  assert.equal(gross.hoehe, klein.hoehe * 2);
});

test('die Mitte des Fensters ist der Ursprung, und y zeigt nach oben', () => {
  const fenster = { breite: 400, hoehe: 800 };

  const mitte = inWelt({ x: 200, y: 400, hoehe: 0 }, fenster, 4);
  assert.equal(mitte.x, 0);
  assert.equal(mitte.y, 0);

  const obenLinks = inWelt({ x: 0, y: 0, hoehe: 0 }, fenster, 4);
  assert.equal(obenLinks.x, -1);
  assert.ok(obenLinks.y > 0, 'oben auf der Seite ist oben in der Welt');
});

test('die Höhe der Welt bestimmt den Maßstab', () => {
  const kasten = { x: 140, y: 259, hoehe: 72 };
  const welt = inWelt(kasten, { breite: 400, hoehe: 800 }, 4);

  assert.equal(welt.x, -0.3);
  assert.equal(welt.y, 0.705);
  assert.equal(welt.hoehe, 0.36);
});

test('ein doppelt so hohes Fenster ergibt bei gleicher WeltHöhe den halben Maßstab', () => {
  const kasten = { x: 0, y: 0, hoehe: 100 };
  const klein = inWelt(kasten, { breite: 400, hoehe: 400 }, 4);
  const gross = inWelt(kasten, { breite: 400, hoehe: 800 }, 4);

  assert.equal(gross.hoehe, klein.hoehe / 2);
});
