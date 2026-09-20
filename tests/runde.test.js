import { test } from 'node:test';
import assert from 'node:assert/strict';

import { istRunde, archivPfad, rundeAus } from '../src/runde.js';

test('ein Slug aus Kleinbuchstaben, Ziffern und Bindestrichen ist eine Runde', () => {
  assert.equal(istRunde('geschwisterwichteln'), true);
  assert.equal(istRunde('buero-mueller-co'), true);
  assert.equal(istRunde('wichteln-2026'), true);
});

test('alles, was nicht in den Slug gehoert, ist keine Runde', () => {
  assert.equal(istRunde('Geschwisterwichteln'), false);
  assert.equal(istRunde('büro'), false);
  assert.equal(istRunde('familie müller'), false);
  assert.equal(istRunde('familie_mueller'), false);
});

test('was auf eine fremde Datei zeigen koennte, ist keine Runde', () => {
  assert.equal(istRunde('../archiv'), false);
  assert.equal(istRunde('unter/ordner'), false);
  assert.equal(istRunde('runde.json'), false);
});

test('ein leerer Name ist keine Runde, ein sehr langer auch nicht', () => {
  assert.equal(istRunde(''), false);
  assert.equal(istRunde('a'.repeat(64)), true);
  assert.equal(istRunde('a'.repeat(65)), false);
});

test('was gar kein Text ist, ist keine Runde', () => {
  assert.equal(istRunde(null), false);
  assert.equal(istRunde(undefined), false);
});

test('der Slug ist der ganze Dateiname im Archivverzeichnis', () => {
  assert.equal(archivPfad('geschwisterwichteln'), 'archiv/geschwisterwichteln.json');
});

test('ohne gueltige Runde gibt es keinen Pfad, der geholt werden koennte', () => {
  assert.equal(archivPfad('../archiv'), null);
  assert.equal(archivPfad(''), null);
  assert.equal(archivPfad(null), null);
});

test('die Runde steht im Abfrageteil der Adresse', () => {
  assert.equal(rundeAus('https://wichtel.turbodev.eu/?runde=geschwisterwichteln'), 'geschwisterwichteln');
});

test('die Runde laesst sich auch aus location.search allein lesen', () => {
  assert.equal(rundeAus('?runde=geschwisterwichteln'), 'geschwisterwichteln');
});

test('ein Ergebnis hinter der Raute stoert die Runde nicht', () => {
  const link = 'https://wichtel.turbodev.eu/?runde=geschwisterwichteln#MjAyNnxRfEdsaXR6ZXJ8c3ZoNw';
  assert.equal(rundeAus(link), 'geschwisterwichteln');
});

test('die Runde findet sich auch neben anderen Parametern', () => {
  assert.equal(rundeAus('?quelle=chat&runde=buero-mueller-co'), 'buero-mueller-co');
});

test('eine Adresse ohne Abfrageteil hat keine Runde', () => {
  assert.equal(rundeAus('https://wichtel.turbodev.eu/#MjAyNnxRfEdsaXR6ZXJ8c3ZoNw'), null);
  assert.equal(rundeAus(''), null);
});

test('ein Fragezeichen hinter der Raute ist keine Runde', () => {
  assert.equal(rundeAus('https://wichtel.turbodev.eu/#topf?runde=geschwisterwichteln'), null);
});

test('ein Parameter, der nicht auf einen Slug passt, gilt als keine Runde', () => {
  assert.equal(rundeAus('?runde=Familie%20M%C3%BCller'), null);
  assert.equal(rundeAus('?runde=../archiv'), null);
  assert.equal(rundeAus('?runde='), null);
});
