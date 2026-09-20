# Kontext

Die Domänensprache dieses Vorhabens ist Deutsch, und zwar durchgehend: Modulnamen, Funktionsnamen, Kommentare, Oberfläche und Farbnamen.
Englisch steht nur da, wo es aus einer älteren Schicht stammt und noch nicht nachgezogen wurde.

Hier stehen die Begriffe, bei denen ein naheliegendes Synonym ausdrücklich verworfen wurde.
Wer einen davon durch ein anderes Wort ersetzt, arbeitet gegen eine Entscheidung.

## Glossar

**Runde**
Ein benannter Archiv-Strang und sonst nichts.
Sie entscheidet ausschließlich, welche Datei die vergangenen Jahre füllt, und berührt weder Topf noch Auslosung noch Filter noch Token.
Sie reist als Abfrageparameter in der Adresse mit, `?runde=geschwisterwichteln`, und ihr Slug ist zugleich der ganze Dateiname unter `archiv/`.
Nicht "Gruppe": das Wort ist belegt, siehe unten.

Einen Slug vergibt allein der Ausrichter, beim Anlegen der Datei.
Die Regel dafür ist: kleinschreiben, Umlaute übertragen (ä zu ae, ö zu oe, ü zu ue, ß zu ss), jede verbleibende Folge von Nicht-`[a-z0-9]` wird ein Bindestrich, führende und schließende Bindestriche fallen weg.
"Büro Müller & Co" wird damit `buero-mueller-co`.
Höchstens 64 Zeichen, denn ein Name, der länger ist als eine Adresszeile, ist keiner.
Ungültige Zeichen ersatzlos zu löschen wäre falsch, weil es kollidiert: "Familie Ast" und "Familienast" ergäben denselben Slug.
Im Code steht diese Regel nicht, weil die Seite nie einen Namen entgegennimmt: sie prüft nur, siehe `src/runde.js`.

**Gruppe**
Die Menschen, die miteinander wichteln, also die Teilnehmer einer Auslosung.
"Für die ganze Gruppe" meint genau das und nicht den Mandanten der Seite.
Dasselbe Wort auf zwei Ebenen wäre eine Falle, deshalb heißt der Mandant Runde.

**Ausrichter**
Der Mensch, der das Repository pflegt.
Er legt Runden an und archiviert Ergebnisse, beides per Commit.
Die Seite selbst schreibt nichts, sie ist statisch und rein lesend.

**Topf**
Die Menge, aus der gezogen wird: Buchstaben und Farben.
Alle Runden ziehen aus demselben Topf, denn der Topf ist Code und keine Daten, siehe `src/pool.js`.

**Ergebnis**
Ein Jahr, ein Buchstabe, eine Farbe und der Topf, aus dem sie kamen.
Es reist als ein einziger Token hinter der Raute.
Der Link ist der Moment, der Commit ist die Aufzeichnung.

**Enthüllung**
Der Moment, in dem das Ergebnis sichtbar wird.
Sie spielt gleich, ob gerade gezogen wurde oder ein geteilter Link aufgeht, siehe `docs/agents/animation.md`.
