# Die Enthüllung zum Mitmachen

Type: prototype
Status: resolved

## Question

Staub läuft von selbst ab, siehe `issues/10-enthuellung-in-drei-dimensionen.md`.
Der Ausrichter will eine Runde prüfen, in der das Ergebnis stattdessen aufgedeckt wird: Buchstabe und Farbe jeweils frei rubbeln, dazu ähnliche Ideen zum Vergleich.

Welche Geste deckt das Ergebnis auf, und wird überhaupt eine davon eingebaut?

## Die Entwürfe

Fünf spielbare Karten liegen in `prototypen/mitmachen/`.
Server im Wurzelverzeichnis starten und den Ordner öffnen:

```
npx --yes http-server -p 8099 -s
# http://localhost:8099/.scratch/wichtel-site/prototypen/mitmachen/
```

Sie sind nicht fünf Anstriche derselben Idee, sondern fünf verschiedene Gesten.

**1 Rubbellos.**
Silberfolie über beiden Feldern, hart abgerubbelt.
Die Geste ist das Hin und Her, die Kante bricht körnig, die Krümel bleiben am Rand liegen.
Das ist das Naheliegende und damit der Maßstab für die anderen vier.

**2 Geschenkpapier.**
Zwei eingepackte Felder, aufgerissen statt abgerubbelt.
Ein Zug quer durch genügt, die Kante franst grob, die Ränder rollen sich ein.
Der Unterschied zum Rubbellos ist nicht die Oberfläche, sondern die Zahl der Bewegungen: eine entschiedene statt dreißig kleine.

**3 Beschlagene Scheibe.**
Die Felder liegen hinter angelaufenem Glas, die flache Hand wischt frei, Tropfen laufen ab.
Der Beschlag zieht langsam wieder zu.
Der einzige Entwurf, der umkehrbar ist: schöner und weicher, und er nimmt in Kauf, dass jemand zu langsam wischt und nichts erreicht.

**4 Taschenlampe.**
Ein dunkler Raum, die Lampe hängt am Finger, es wird nicht gedrückt.
Was der Kegel getroffen hat, bleibt sichtbar, aber matt: gesehen ist nicht beleuchtet.
Nichts geht dabei kaputt, und Buchstabe und Farbe liegen im selben Raum statt in zwei Kästchen.

**5 Schneekugel.**
Der Gegenentwurf, und er stellt die Frage, um die es eigentlich geht.
Der Farbtopf liegt als Staub am Boden einer Kugel, Schütteln wirbelt ihn auf, Loslassen setzt ihn zum Buchstaben und in die gezogene Farbe.
Eine Geste für beides statt zwei Felder.
Es ist derselbe Staub wie in `src/enthuellung.js`, nur löst ihn die Hand aus statt die Uhr.

### Was für alle fünf gilt

Alle fünf spielen dieselbe Ziehung, damit verglichen wird und nicht geraten, und die Farben kommen aus `src/pool.js`.

**Das eine Feld darf das andere nicht beantworten.**
Deshalb steht der Buchstabe in neutraler Tinte auf Papier und nicht in der gezogenen Farbe.
Die Farbe bekommt die Seite erst, wenn beide Felder offen sind.
Ohne diese Trennung ist das zweite Feld schon beantwortet, bevor es jemand anfasst.

**Aufgedeckt wird, nicht gewählt.**
Jede Geste, die aussieht, als beeinflusse sie das Ergebnis - ein Rad anhalten, einen Würfel werfen - ist damit raus, und zwar unabhängig davon, wie gut sie aussieht.
Die Ziehung ist längst gefallen, wenn die Hand kommt.

**Über der Hälfte springt ein Feld von selbst auf.**
Niemand rubbelt eine Fläche vollständig frei.
Wer es müsste, hört vorher auf und hält die Enthüllung für kaputt.

**Die Übergabe an die Seite ist dieselbe wie bei Staub.**
Der Buchstabe fliegt genau dorthin, wo die Seite ihn hinsetzt, und blendet dort aus.
Nachgemessen mit angehaltenem Flug: der Buchstabe der Karte deckt den der Seite, bei M, W, Ä und I.

## Was beim Bauen gelernt wurde

**Eine Bedienung hat keinen Fortschritt, sie hat eine Hand.**
Die vorige Runde ließ sich aufspulen, weil jede Animation eine reine Funktion ihres Fortschritts war.
Das geht hier nicht, also wird stattdessen die Hand aufgeschrieben: ein Schlangenzug über beide Felder, und `mitmachenStandbild(t)` spielt davon die ersten t ab und hält an.
Damit sind Bildschirmfotos wieder wiederholbar, und `bilder.mjs` nimmt sie ab.
Aufgespult heißt dabei angehalten: ohne das rechnet die Schleife im nächsten Bild weiter, und das Foto zeigt nicht mehr, was aufgespult wurde.
Dieser Fehler hat erst ein falsches Ergebnis geliefert und dann die Fehlersuche in die falsche Richtung geschickt.

**Eine Decke, durch die man die Antwort liest, ist keine.**
Beschlag und Dunkelheit lagen zuerst bei 0.94 und 0.965 Deckung, und der Buchstabe stand als grauer Schatten darin.
Sechs Prozent genügen dafür.
Jetzt sind es 0.997 und beim Dunkel volle Deckung.

**Die Farbflut darf erst kommen, wenn der Buchstabe angekommen ist.**
Die Flut liegt als eigene Schicht über der Leinwand und deckt sie zu.
Bei 45 Prozent der Landung eingeblendet, verschwand der Buchstabe auf halbem Weg und tauchte unten links wieder auf: genau der Sprung, den die Landung vermeiden soll.
Die Übergabe steht jetzt auf 0.72, dem Punkt, an dem der Flug endet.

**Die Tinte muss in die Schriftfarbe der Seite wechseln, aber erst ganz zum Schluss.**
Sonst steht ein weißer Buchstabe kurz auf hellem Papier und ist für zwei Zehntel verschwunden.

**Ein Rückstand von einem Faden verrät die Antwort.**
Die Decke lag zuerst bündig auf der Karte, und von der roten Farbkarte blieb eine rote Linie stehen.
Sie liegt jetzt einen Hauch darüber hinaus.

**Ein Backtick in einem Kommentar beendet ein Template-Literal.**
Ein GLSL-Shader in einem Template mit dem Wort `mix` in Anführungszeichen im Kommentar, und das Modul lädt nicht mehr.
Die Meldung nennt das Wort dahinter, nicht den Backtick.

## Entschieden: keiner, es bleibt bei Staub

Der Ausrichter hat die fünf live angesehen und keinen davon genommen.
Es bleibt bei Staub, unverändert, wie in Ticket 10 beschrieben.

Damit ist die Frage beantwortet und nicht vertagt.
Wer sie noch einmal aufmacht, tut das gegen eine Entscheidung und nicht in eine Lücke hinein.

Die fünf Entwürfe bleiben liegen, aus demselben Grund wie die vier aus Ticket 10: sie zeigen, wogegen Staub angetreten ist.
Sie werden nicht weitergepflegt.
Was sie kosten, ist der Ordner `prototypen/mitmachen/`; die Seite selbst rührt keine Zeile davon an, und `npm test` kennt sie nicht.

Was aus dieser Runde bleibt, steht unter "Was beim Bauen gelernt wurde" und gilt für jede Enthüllung, die je wieder angefasst wird - besonders die Stelle, an der die Farbflut den Buchstaben zudeckt, bevor er angekommen ist.
Das ist derselbe Fehler, der schon die erste Runde gekostet hat, und er ist jetzt zum zweiten Mal aufgetreten.

## Was damit nicht entschieden ist

- **Ob Mitmachen den geteilten Link verträgt.** Für den, der zieht, ist die Geste ein Gewinn. Für den, der den Link aus dem Gruppenchat öffnet, ist sie eine Hürde vor einer Antwort, die er nur nachlesen wollte. Hängt mit Ticket 09 zusammen.
Die übrigen Fragen dieser Runde hingen an den Entwürfen und sind mit ihnen erledigt: die reduzierte Bewegung unter einer Decke, die blassen Farben auf der Karte, die zwei Fortschrittsbalken der Schneekugel.
Sie stehen hier nicht mehr als offen, weil nichts mehr da ist, woran sie hängen.

## Geprüft in

Chromium, Firefox, WebKit und Edge, jeweils geladen und einmal durchgespielt, dazu am Telefon mit dem Daumen (Pixel 7, 290 Bildpunkte Bühnenbreite).
Farben quer durch den Topf: Rot, Gestreift, Weiß, Durchsichtig, Hellgrün, Grau.
