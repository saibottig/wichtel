# Neu auslosen steht auch dem, der nur schauen kommt

Type: task
Status: resolved

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

## Answer

Keine der drei Richtungen, sondern die vierte, vom Ausrichter entschieden: "Neu auslosen" verschwindet bei `quelle: 'link'` und `quelle: 'archiv'` ganz.
An seine Stelle in der Knopfreihe rückt "Topf ansehen", also das, was der Besucher wahrscheinlich will.
Der Textlink auf den Topf darunter fällt dann weg, damit dasselbe Ziel nicht zweimal dasteht.

Ziehen bleibt ungesperrt, wie Ticket 04 es festgelegt hat, nur nicht mehr gleich laut: die Jahresmarke oben ist in diesem Fall ein Link zurück auf die Einladung.
Sie trägt eine schwache Unterstreichung, nicht erst beim Darüberfahren, weil es auf dem Telefon kein Darüberfahren gibt und sie für den Gast der einzige Weg zum eigenen Auslosen ist.
Nach einem frischen Zug bleibt alles, wie es war: "Neu auslosen" steht, der Topf steht klein darunter, und die Jahresmarke ist reiner Text ohne `href`.

`quelle: 'archiv'` wird dabei behandelt wie `'link'`, wie im Ticket vermutet.
Ein Hinweis nach dem Ziehen aus fremdem Link wurde verworfen: die Handlung, die ihn nötig machte, wird gar nicht mehr angeboten.

Dafür brauchte die Einladung eine eigene Adresse.
`#` leer zeigt weiter das archivierte Jahr, sonst käme die Gruppe im Dezember nicht mehr an ihr Ergebnis.
Neu ist das reservierte Wort `losen`, das ausdrücklich zur Auslosung führt, auch wenn das Jahr schon im Archiv steht.
Es ersetzt `filter~<ausschluss>`, das dieselbe Einladung mit Filter meinte, aber vom Archiv geschlagen wurde und darum auch als "Zurück" aus dem Topf nicht taugte.
Jetzt gibt es je ein Wort pro Ziel: `topf` und `losen`, beide mit optionalem `~<ausschluss>`.

Geprüft im Browser über alle sechs Wege: frisch gezogen, geteilter Link, Jahresmarke zurück, Topf zum Ergebnis, archiviertes laufendes Jahr, und Zurück aus dem bearbeitbaren Topf mit gesetztem Filter.

## Herkunft

Fiel beim Bauen des Topfes auf, nicht aus einem Bericht von außen.
Der Unterschied steckt seit der Einführung von `chooseView` im Code und wurde nie benutzt.
