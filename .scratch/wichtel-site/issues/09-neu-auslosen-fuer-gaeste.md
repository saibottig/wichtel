# Neu auslosen steht auch dem, der nur schauen kommt

Type: task
Status: open

## Question

`chooseView` unterscheidet bereits, woher ein Ergebnis kommt: `quelle: 'link'`, wenn ein Token in der Adresse steht, und `quelle: 'archiv'`, wenn die Seite das laufende Jahr aus `archiv.json` zeigt.
`app.js` wertet das nirgends aus.
Beide Fälle bekommen dieselbe Ergebnis-Seite mit demselben Knopf "Neu auslosen", gleich prominent neben "Link kopieren".

Wer aus dem Gruppenchat kommt, will das Ergebnis sehen, nicht ziehen.
Ein Fehlklick ersetzt, was er eigentlich anschauen wollte.

**Was dabei nicht passiert, damit der Schaden richtig eingeschätzt wird:**
Das Archiv wird nicht überschrieben.
Eintragen tut nur `scripts/archivieren.mjs`, und das läuft von Hand beim Ausrichter.
Die Seite schreibt nichts.

**Was tatsächlich passiert:**
Der Besucher verliert das geteilte Ergebnis aus seiner Adresszeile und sieht stattdessen sein eigenes.
Schlimmer wird es, wenn er diesen neuen Link für den echten hält und ihn in die Gruppe zurückschickt.
Dann konkurrieren zwei Links um dieselbe Auslosung, und nur der Ausrichter weiß, welcher zählt.

## Was hier nicht zur Debatte steht

Ticket 04 hat entschieden, dass Ziehen ungesperrt ist, und das bleibt so.
Eine statische Seite kann es ohnehin nicht durchsetzen, und der Commit ist die Aufzeichnung.
Es geht nur darum, dieselbe Handlung nicht beiden gleich laut anzubieten.

## Mögliche Richtungen

- Bei `quelle: 'link'` "Neu auslosen" zurücknehmen: als stiller Textlink statt als Knopf, oder erst nach einem Klick auf "Noch einmal ziehen?" sichtbar.
- Bei `quelle: 'link'` stattdessen etwas anbieten, das der Besucher wirklich will, etwa "Topf ansehen" nach vorn.
- Nichts an der Sichtbarkeit ändern, aber nach einem Neu-Auslosen aus einem fremden Link einen Hinweis zeigen, dass das geteilte Ergebnis noch unter dem alten Link liegt.

Zu entscheiden ist auch, was `quelle: 'archiv'` bekommt.
Das ist der Fall, in dem die Gruppe das laufende, schon archivierte Jahr aufruft, und der verhält sich eher wie 'link' als wie eine frische Einladung.

## Herkunft

Fiel beim Bauen des Topfes auf, nicht aus einem Bericht von außen.
Der Unterschied steckt seit der Einführung von `chooseView` im Code und wurde nie benutzt.
