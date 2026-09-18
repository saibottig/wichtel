# Build and deploy the site

Type: task
Status: resolved

## Question

Build the site and publish it.

A single static page with no build step, published from `master` at the repository root.
Add `.nojekyll` so Pages does not run Jekyll over it.
Leave the `CNAME` file alone, since enabling the custom domain in settings writes it.

Done when the destination is met, meaning the site is live and reachable at https://wichtel.turbodev.eu over HTTPS, it draws a letter and a colour, the link shares the result, and past years are listed.

Blocked by everything else on the map.

## Stand

Gebaut und auf `master` gepusht.
Eine statische Seite ohne Build-Schritt im Wurzelverzeichnis: `index.html`, `styles.css`, `src/`, `archiv.json`, `.nojekyll`.
`CNAME` ist bewusst nicht angelegt, weil die Einstellung sie schreibt.

Noch nicht erreicht, denn das Ziel ist Erreichbarkeit, nicht Fertigstellung.
Es fehlt der DNS-Eintrag aus Ticket 02, und den kann nur der Account-Inhaber setzen.

**Vor dem Abhaken zu prüfen: liegt wirklich eine `CNAME` auf `master`?**
Ticket 01 hält fest, die eigene Domain sei in den Einstellungen bereits gesetzt worden.
Dann müsste GitHub eine `CNAME` in den Veröffentlichungszweig geschrieben haben, und auf `master` liegt keine.
Naheliegende Erklärung: das geschah, als noch der inzwischen gelöschte Scratch-Zweig der Standardzweig war, und die Datei ist mit ihm verschwunden.
Ist das so, muss die eigene Domain in den Einstellungen neu gesetzt werden, sonst antwortet die Seite später unter der eigenen Adresse nicht.

## Stand nach dem DNS-Eintrag

Ticket 02 ist erledigt, die `CNAME` liegt auf `master`, das Zertifikat ist aktiv.
Damit ist alles getan, was in diesem Repository getan werden kann.

Offen bleibt genau eine Sache, und sie ist mit Absicht nicht abgehakt: niemand hat die Seite unter ihrer eigenen Adresse geöffnet.
Die Agent-Sitzung kann es nicht, weil die Netzwerk-Richtlinie dieser Umgebung die Verbindung nach `wichtel.turbodev.eu:443` mit 403 ablehnt.
Die Karte ist an dieser Stelle deutlich: erreichbar zählt, spezifiziert nicht.

Zum Abhaken reicht ein Blick auf https://wichtel.turbodev.eu:

- lädt über HTTPS ohne Zertifikatswarnung,
- der Knopf "Auslosen" lässt Buchstaben und Farbe durchlaufen und landet,
- der geteilte Link zeigt in einem neuen Tab dasselbe Ergebnis.

## Answer

Erledigt. Die Seite steht unter https://wichtel.turbodev.eu und wurde dort vom Account-Inhaber geöffnet und geprüft.

Damit ist das Ziel der Karte erreicht, und zwar in dem Sinn, den die Karte meint: erreichbar, nicht bloß spezifiziert.

**Was ausgeliefert wird.**
Eine statische Seite ohne Build-Schritt, veröffentlicht aus dem Wurzelverzeichnis von `master`.
`index.html`, `styles.css`, `src/` mit vier reinen Modulen hinter einer dünnen DOM-Schicht, `archiv.json`, `.nojekyll`.
Die `CNAME` hat GitHub selbst geschrieben, als die eigene Domain gesetzt wurde.

**Was der Ausrichter noch in die Hand nimmt.**
Nach der Auslosung einmal `npm run archivieren -- '<geteilter Link>'` laufen lassen und die geänderte `archiv.json` committen.
Danach zeigt die Seite das Jahr unter "Vergangene Jahre", und wer sie ohne Link öffnet, sieht das Ergebnis des laufenden Jahres statt einer Einladung zum Auslosen.

**Was offen bleibt und hier bewusst nicht mitabgehakt wird.**
"Enforce HTTPS" in den Repository-Einstellungen, das GitHub erst bis zu 24 Stunden nach der DNS-Prüfung freigibt. Siehe Ticket 02.
Und der Jahreswechsel im Januar, der in der Karte unter "Not yet specified" steht.
