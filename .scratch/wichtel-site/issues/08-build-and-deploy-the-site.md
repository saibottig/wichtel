# Build and deploy the site

Type: task
Status: open
Blocked by: 02

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
