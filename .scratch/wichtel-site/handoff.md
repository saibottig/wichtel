# Handoff: Wichtel-Seite

Stand: 2026-09-19, Commit `b14d0ab` auf `master`.
Die Seite ist live unter https://wichtel.turbodev.eu.

Dieses Dokument wiederholt nicht, was anderswo schon steht.
Die Karte ist `map.md`, die Entscheidungen liegen in `issues/`, das Warum steht in den Commit-Nachrichten.
Lies zuerst `map.md`, dann diesen Text.

## Worauf die nächste Sitzung zusteuert

Eine von fünf Enthüllungs-Animationen auswählen und einbauen.
Die Vorschläge liegen spielbereit in `prototypen/reveal-animationen.html`.
Der Nutzer hat noch nicht gewählt, also ist das die erste Frage.

Festgesetzt ist bereits: die Animation läuft gleich, ob gerade gezogen wurde oder ein Link geöffnet wird.
Bisher zeigt ein geöffneter Link das Ergebnis sofort, es ist also eine echte Änderung an `src/app.js`.

Offen und vor dem Einbau zu klären: wer den Link zum fünften Mal öffnet, sitzt jedes Mal die volle Enthüllung ab.
Entweder ein Überspringen bei Berührung, oder einmal je Link und danach gemerkt.

## Was den Zustand erklärt, ohne irgendwo zu stehen

Die Gestaltung wurde in kleinen Schritten erarbeitet, jeder mit einer Auswahl durch den Nutzer.
Die Kette war: Farbflut gewählt, Dämpfung nur für die sechs gemusterten Farben, Bunt und Regenbogen nach hell statt nach dunkel gedämpft, und für die Zustände ohne gezogene Farbe alle Farben des Topfes auf einmal.
Wer davon etwas umwirft, wirft eine Entscheidung um, keine Verlegenheitslösung.

Bewusst hingenommen: wird Bunt oder Regenbogen gezogen, ähnelt die Ergebnis-Seite der Einladung, weil beide weiche Pastellfelder sind.
Unterschieden werden sie nur durch Bewegung.
Nicht reparieren, bevor es in einem echten Jahr stört.

## Wie in dieser Umgebung geprüft wird

Es gibt keine Browser-Tests im Projekt, nur `npm test` mit `node --test` und 73 Tests über die reinen Module.
Der Rest lief über Playwright von Hand, und das hat mehr Fehler gefunden als die Tests:

- `npx http-server -p 8099 -s` im Wurzelverzeichnis, dann Playwright aus `/opt/node22/lib/node_modules/playwright`.
- Bildschirmfotos **mitten** in einer Animation, nicht nur am Ende.
  Vier von fünf Animationsfehlern waren am Endbild unsichtbar.
- Screenshots über die ganze Seite zeigen unter der Fensterhöhe den Körpergrund, weil die Grundschichten `position: fixed` sind.
  Das ist ein Artefakt der Aufnahme, kein Fehler, solange der Körper denselben Grund trägt.

**three.js ist hier nicht ladbar.**
Der Proxy lehnt das CDN mit 403 ab.
Wer eine 3D-Variante bauen soll, braucht eine Umgebung mit Netzzugang, sonst entsteht ungeprüfter Code.

## Fallen, die schon einmal zugeschnappt sind

- `[hidden]` verliert gegen jede Klasse mit `display`.
  Steht als Regel in `styles.css`, bitte drin lassen.
- Frisch ausgelost läuft **nicht** durch `zeichnen`, sondern schreibt das Ergebnis direkt.
  Was beim Zeichnen gesetzt wird, muss auch dort gesetzt werden, sonst bleibt es veraltet.
- Der eingefrorene Token in `tests/token.test.js` bewacht die Kodierung.
  Schlägt er fehl, sind alle geteilten Links unlesbar geworden.
- Kein Linter im Projekt.
  Das ist unentschieden, nicht vergessen: der Preis wäre eine Abhängigkeit und eine Sperrdatei in einem Projekt, das bisher ohne beides auskommt.

## Sonst noch offen

- Ticket 09, `issues/09-neu-auslosen-fuer-gaeste.md`: "Neu auslosen" steht dem Besucher aus dem Gruppenchat genauso laut zur Verfügung wie dem, der gerade gezogen hat.
- "Enforce HTTPS" in den Repository-Einstellungen. Nur der Account-Inhaber kommt daran, siehe Ticket 02.
- Der Jahreswechsel im Januar, in `map.md` unter "Not yet specified".

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
