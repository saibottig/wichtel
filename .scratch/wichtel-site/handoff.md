# Handoff: Wichtel-Seite

Stand: 2026-09-19, Commit `3c441db` auf `master`.
Die Seite ist live unter https://wichtel.turbodev.eu.

Seit dem 19. September 2026 läuft die Arbeit auf dem Rechner des Ausrichters statt im Web-Container.
Was das ändert, steht in `docs/agents/environment.md`.

Dieses Dokument wiederholt nicht, was anderswo schon steht.
Die Karte ist `map.md`, die Entscheidungen liegen in `issues/`, das Warum steht in den Commit-Nachrichten.
Lies zuerst `map.md`, dann diesen Text.

## Worauf die nächste Sitzung zusteuert

Die Enthüllung ist gewählt, gebaut und eingebaut, siehe `issues/10-enthuellung-in-drei-dimensionen.md`.
Staub, mit three.js aus `vendor/`, läuft gleich für eine frische Ziehung und für einen geteilten Link, jedes Mal voll durch.
Was dort noch offen steht, ist klein.

Offen bleibt Ticket 09 und der Jahreswechsel im Januar.

Die vier nicht gewählten Entwürfe bleiben in `prototypen/enthuellung/` liegen.
Sie zeigen, wogegen Staub angetreten ist.
Die noch ältere Runde in `prototypen/reveal-animationen.html` war mit CSS und 2D-Canvas gebaut und ist zweimal überholt.

Der alte Lauf in `src/app.js` ist nicht weg, er ist jetzt der Rückfall.
Kommt three.js nicht an, wechseln Buchstaben und Farben zwei Sekunden lang wie früher, und danach steht das Ergebnis.
Die Seite hängt nicht an der Bibliothek, und das soll so bleiben.

## Was den Zustand erklärt, ohne irgendwo zu stehen

Die Gestaltung wurde in kleinen Schritten erarbeitet, jeder mit einer Auswahl durch den Nutzer.
Die Kette war: Farbflut gewählt, Dämpfung nur für die sechs gemusterten Farben, Bunt und Regenbogen nach hell statt nach dunkel gedämpft, und für die Zustände ohne gezogene Farbe alle Farben des Topfes auf einmal.
Wer davon etwas umwirft, wirft eine Entscheidung um, keine Verlegenheitslösung.

Bewusst hingenommen: wird Bunt oder Regenbogen gezogen, ähnelt die Ergebnis-Seite der Einladung, weil beide weiche Pastellfelder sind.
Unterschieden werden sie nur durch Bewegung.
Nicht reparieren, bevor es in einem echten Jahr stört.

## Wie in dieser Umgebung geprüft wird

Es gibt keine Browser-Tests im Projekt, nur `npm test` mit `node --test` und 73 Tests über die reinen Module.
Die laufen hier und sind grün.

Der Rest lief über Playwright von Hand, und das hat mehr Fehler gefunden als die Tests.
Playwright ist inzwischen als einzige Abhängigkeit im Projekt eingetragen, mit Chromium daneben installiert.
`npx --yes http-server -p 8099 -s` im Wurzelverzeichnis, dann von einem Node-Skript aus auf http://127.0.0.1:8099 losgehen.
Das Rezept steht in `docs/agents/environment.md`.

Was dabei gelernt wurde und weiter gilt:

- Bildschirmfotos **mitten** in einer Animation, nicht nur am Ende.
  Vier von fünf Animationsfehlern waren am Endbild unsichtbar.
- Screenshots über die ganze Seite zeigen unter der Fensterhöhe den Körpergrund, weil die Grundschichten `position: fixed` sind.
  Das ist ein Artefakt der Aufnahme, kein Fehler, solange der Körper denselben Grund trägt.

**three.js ist jetzt ladbar, und es wird auch geladen.**
Der Netzzugang ist frei, das CDN antwortet, und `prototypen/enthuellung/` holt sich three.js von dort.
Was beim Bauen dieser Runde gelernt wurde, steht in `docs/agents/animation.md`.
Wer eine Animation anfasst oder eine prüft, liest das vorher, sonst werden dieselben fünf Fehler noch einmal gemacht.

Ein Punkt daraus gilt auch für alles andere, was sich bewegt: eine Animation, die nur von ihrem Fortschritt abhängt und nicht von dem, was vorher lief, lässt sich aufspulen und damit überhaupt erst prüfen.
Ein Bildschirmfoto von fünf laufenden WebGL-Bühnen kostet über eine Sekunde, und auf die Uhr zu warten geht damit nicht.

## Fallen, die schon einmal zugeschnappt sind

- `[hidden]` verliert gegen jede Klasse mit `display`.
  Steht als Regel in `styles.css`, bitte drin lassen.
- Frisch ausgelost läuft **nicht** durch `zeichnen`, sondern schreibt das Ergebnis direkt.
  Was beim Zeichnen gesetzt wird, muss auch dort gesetzt werden, sonst bleibt es veraltet.
- Der eingefrorene Token in `tests/token.test.js` bewacht die Kodierung.
  Schlägt er fehl, sind alle geteilten Links unlesbar geworden.
- Kein Linter im Projekt.
  Das ist unentschieden, nicht vergessen.
  Das alte Gegenargument, es gäbe weder Abhängigkeit noch Sperrdatei, ist mit Playwright hinfällig geworden.
  Entschieden ist der Linter damit trotzdem nicht, er muss sich selbst lohnen.

## Sonst noch offen

- Ticket 09, `issues/09-neu-auslosen-fuer-gaeste.md`: "Neu auslosen" steht dem Besucher aus dem Gruppenchat genauso laut zur Verfügung wie dem, der gerade gezogen hat.
- Der Jahreswechsel im Januar, in `map.md` unter "Not yet specified".

"Enforce HTTPS" ist erledigt und steht hier nicht mehr offen, siehe den Nachtrag in Ticket 02.

## Arbeitsweise, die der Nutzer eingefordert hat

Kleine Schritte mit Vorlage zur Auswahl, nicht eine große fertige Lösung.
Bei Gestaltungsfragen mehrere Entwürfe nebeneinander bauen und ihn wählen lassen.
Animation und Bewegung immer als spielbare Datei liefern, niemals als Standbild.
Deutsch in der Oberfläche, deutsche Fachwörter in den Daten, ASCII in den Bezeichnern.

## Empfohlene Skills

- `prototype` für die Entwurfsrunden, weil genau so gearbeitet wurde.
- `tdd` vor jeder Änderung an `src/filter.js`, `src/token.js`, `src/draw.js`, `src/archive.js`, `src/view.js`.
  Die Nahtstellen sind mit dem Nutzer vereinbart, das sind diese fünf.
- `run`, um die Seite tatsächlich zu starten und anzusehen, statt sie nur zu testen.
- `code-review` vor dem Ausliefern. Hat beim letzten Mal echte Fehler gefunden, unter anderem eine veraltete Liste nach dem Ziehen.
- `grilling`, wenn eine Entscheidung wackelt, bevor sie gebaut wird.

Nicht nötig: `domain-modeling`.
`CONTEXT.md` gibt es absichtlich nicht, siehe `docs/agents/domain.md`.
