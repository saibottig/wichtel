# Runden als Archiv-Linse

Type: grilling
Status: resolved
Blocked by: 06

## Question

Die Seite ist heute die Seite einer einzigen Gruppe.
Sie soll auch anderen offenstehen, ohne dass deren Auslosungen die Historie dieser einen Gruppe durcheinanderbringen.

Der Ausrichter hat vorgeschlagen, vor der Auslosung einen Namen anzugeben und die Historisierung an diesen Namen zu hängen, mit dem Namen als Dateikennung.

## Was die Frage kleiner gemacht hat als sie klang

Zwei Eigenschaften des bestehenden Codes verändern die Aufgabe grundlegend, und beide waren beim Stellen der Frage nicht präsent.

**Es gibt keine Personen-Zuordnung.**
Das Archiv hält pro Jahr einen Buchstaben und eine Farbe, sonst nichts.
Wer wem schenkt, ist ausdrücklich außerhalb des Vorhabens, siehe `map.md` unter "Out of scope".
Im Archiv stehen also keine personenbezogenen Daten, sondern zwei Wörter pro Jahr.
Damit ist die Frage nach Geheimhaltung, Zugriffsschutz und Ratbarkeit des Namens hinfällig, bevor sie gestellt werden muss.

**Die Auslosung liest das Archiv nicht.**
`src/draw.js` importiert `src/archive.js` nicht, und `auslosen()` in `src/app.js` reicht das Archiv nicht weiter.
Es gibt keinen Wiederholungs-Constraint, und das ist eine Entscheidung und kein Versäumnis, siehe `src/pool.js` Zeile 19 bis 27: ein alter Name ist kein verbrauchter Name.

Daraus folgt der Kern der Antwort: Ein Name kann auf nichts wirken außer auf die Liste der vergangenen Jahre.

## Answer

**Eine Runde ist ein benannter Archiv-Strang und sonst nichts.**
Sie entscheidet ausschließlich, welche Datei die vergangenen Jahre füllt und welches Jahresergebnis bei leerer Adresse erscheint.
Sie berührt weder Topf noch Auslosung noch Filter noch Token.

**Die Runde steht als Query-Parameter in der Adresse, nicht im Hash.**
`https://wichtel.turbodev.eu/?runde=geschwisterwichteln`

Der Hash ist bereits vollständig als Ansichts-Grammatik verplant, siehe `src/view.js` Zeile 9 bis 15.
Ein Namensteil darin wäre mehrdeutig: bei `#geschwisterwichteln` könnte `chooseView` nicht unterscheiden, ob eine Runde mit leerer Ansicht gemeint ist oder ein unlesbarer Token, und würde heute die Fehlerseite zeigen.
Man bräuchte einen Pflichttrenner und damit die Form `#geschwisterwichteln/`, und jede Stelle, die einen Link baut, müsste die Runde aktiv durchreichen.
Vergisst eine davon es, fällt der Besucher still in die namenlose Runde zurück, ohne dass etwas kaputt aussieht.

Der Query-Parameter kostet nichts davon.
Er reist von selbst mit jedem geteilten Link, weil "Link kopieren" `location.href` kopiert, siehe `src/app.js` Zeile 368.
Der Preis ist allein die Optik der Adresse, und die war es nicht wert.

**Die Archive liegen in einem eigenen Verzeichnis, eine Datei je Runde.**
`archiv.json` wird zu `archiv/geschwisterwichteln.json`.
Der Slug ist der ganze Dateiname, es gibt also keine Namenskonvention, die man beim Anlegen falsch tippen kann.
Der Vorschlag `Geschwisterwichteln_archiv.json` im Wurzelverzeichnis wurde verworfen, weil der Wurzelordner mit jeder Runde wächst und `_archiv` in jedem Dateinamen dasselbe wiederholt.

**Der Ladepfad prüft, er normalisiert nicht.**
Passt der Parameter auf `^[a-z0-9-]{1,64}$`, wird `archiv/<slug>.json` geholt.
Fehlt er oder passt er nicht, wird gar nicht erst geholt, und das Archiv bleibt leer.
Eine unbekannte Runde liefert eine 404, die der bestehende Code bereits still zu einem leeren Archiv verarbeitet.

Prüfen statt Normalisieren ist strenger und einfacher: es kann keine Eingabe geben, die auf eine fremde Datei zeigt, und der häufigste Fall, nämlich der fremde Besucher ohne Parameter, erzeugt keinen Netzwerkverkehr und keine 404 in der Konsole.

Normalisiert wird nur beim Anlegen einer Runde durch den Ausrichter, und zwar so: kleinschreiben, Umlaute übertragen (ä zu ae, ö zu oe, ü zu ue, ß zu ss), jede verbleibende Folge von Nicht-`[a-z0-9]` wird ein Bindestrich, führende und schließende Bindestriche fallen weg.
"Büro Müller & Co" wird damit `buero-mueller-co`.
Ersatzloses Löschen ungültiger Zeichen wurde verworfen, weil es kollidiert: "Familie Ast" und "Familienast" ergäben denselben Slug.

**Die namenlose Adresse hat keine Historie.**
`wichtel.turbodev.eu` ohne Parameter zeigt kein vergangenes Jahr.
Die Alternative, die namenlose Adresse dauerhaft auf `geschwisterwichteln` zeigen zu lassen, wurde verworfen: das ist ein Sonderfall, der für immer im Code lebt, und jede spätere Entscheidung müsste ihn mitdenken.

**Das Archivierskript liest die Runde aus dem Link.**
`npm run archivieren -- '<link>'` nimmt die Runde aus dem Parameter des Links.
Enthält der Link keine Runde, bricht das Skript ab, statt irgendwohin zu schreiben.
Der Abbruch ist der Punkt: sonst landet eines Tages ein Ergebnis still in der falschen Datei, und das fällt erst ein Jahr später auf.
`--runde <slug>` bleibt als Übersteuerung für den Fall, dass nur ein nackter Token vorliegt, den das Skript heute schon annimmt.

**Der Begriff heißt Runde.**
Deutsch wie der Rest der Domänensprache, und das Wort trägt die Wiederholung über Jahre in sich, also genau das, was ein Archiv ist.
"Gruppe" scheidet aus, weil es bereits belegt ist: "für die ganze Gruppe" bezeichnet die Teilnehmer einer Auslosung, nicht den Mandanten.
Dasselbe Wort auf zwei Ebenen wäre eine Falle.

## Was das kostet

Neu ist ein Modul `src/runde.js` mit Prüfung und Pfadbildung, testgetrieben wie die übrigen Logikmodule.
Dazu der Ladepfad in `src/app.js`, das Umbenennen der Archivdatei und das Archivierskript.

Unberührt bleiben `src/view.js`, `src/token.js`, `src/archive.js`, `src/draw.js`, `src/pool.js` und `src/filter.js`.
Die Runde wird in `src/app.js` aufgelöst, bevor `chooseView` gerufen wird, denn die bekommt ohnehin nur das fertig geladene Archiv.
Der eingefrorene Token-Test bleibt damit grün, und die 15 Tests zur Hash-Grammatik werden nicht angefasst.

## Bekannte Folge

Sobald `archiv.json` umgezogen ist, zeigt ein altes Lesezeichen auf `wichtel.turbodev.eu` keine Historie mehr.
Die Adresse mit Parameter muss einmal in der Familie geteilt werden.
Der Ausrichter hat diesen Bruch bewusst gewählt, statt dauerhaft einen Sonderfall zu tragen.

## Was ausdrücklich nicht gebaut wird

Diese vier Punkte sind entschieden und keine Lücken.
Wer sie nachbaut, tut das gegen eine Entscheidung.

- **Kein Eingabefeld für den Namen.**
Die ursprüngliche Idee sah eines vor der Auslosung vor.
Sie stammt aus der Annahme, der Name wirke auf die Auslosung, und die trägt nicht.
Wer "Familie Müller" eintippt, sieht keinen Unterschied: keine Fehlermeldung, keine Rückmeldung, keine Historie, weil Archive nur der Ausrichter anlegt.
Ein Feld verspräche etwas, das es für jeden außer dem Ausrichter nicht einlöst.

- **Keine eigenen Töpfe je Runde.**
Alle Runden ziehen aus denselben 29 Buchstaben und 28 Farben.
Der Topf ist Code und keine Daten: 28 handgeschriebene Farbdatensätze in `src/pool.js` mit Korn-Zuordnung in `src/farbkoerner.js`.
Das wäre ein eigenes, viel größeres Vorhaben und gehört in ein eigenes Ticket, falls es je gewollt ist.

- **Kein Verzeichnis der bekannten Runden.**
Eine `runden.json` könnte "diese Runde kenne ich nicht" sagen, müsste aber bei jeder neuen Runde mitgepflegt werden.
Eine Datei, die zweimal in zehn Jahren angefasst wird, steht irgendwann quer zum Dateibestand.
Die unbekannte Runde bleibt still leer.

- **Kein Anzeigename getrennt vom Slug.**
Der Slug ist der ganze Bezeichner.
Er erscheint nirgends auf der Seite, und die Seite hat auch keine Stelle dafür: in `index.html` steht kein Gruppenname, der Titel ist "Wichteln".
Ein Anzeigename in der Archivdatei würde ein Schema-Upgrade von `src/archive.js` samt seiner Tests kosten, für etwas, das niemand sieht.

- **Kein Schreibpfad.**
Die Seite bleibt statisch und rein lesend, Runden legt nur der Ausrichter per Commit an.
Damit gibt es nichts, was ein Besucher durch Tippen eines Namens auf dem Server anlegen könnte.

## Reihenfolge beim Bauen

1. `src/runde.js` testgetrieben
2. Ladepfad in `src/app.js`, `git mv archiv.json archiv/geschwisterwichteln.json`
3. `scripts/archivieren.mjs`
4. `map.md` und `docs/agents/domain.md` nachziehen

Beim letzten Schritt ist zu beachten, dass `map.md` die Seite heute durchgehend als die Seite einer Gruppe beschreibt.
Diese Annahme gilt nach diesem Ticket nicht mehr, und die Stelle unter "Destination" sagt es als Erste.
