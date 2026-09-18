# Decide the result link format

Type: grilling
Status: resolved

## Question

The reveal is shared as a link, so the URL carries the drawn result.
Decide exactly what that URL looks like and how much it matters that anyone can edit it.

## Answer

**The result rides in the URL hash as a single opaque token.**
Shape is `https://wichtel.turbodev.eu/#<token>`.
A hash fragment never reaches a server and never appears in a referrer header, which suits a page served by GitHub Pages.

**The token encodes the year, the letter and the colour, and it must decode.**
This is an encoded payload, not a cryptographic hash, despite the name.
The archive script reads the token back out, so the encoding has to round-trip.
Base64url over a compact encoding of the three values is the obvious fit.

**Opaque buys tidiness, not security.**
The encoding lives in public page source, so anyone who cares can craft a token.
That is accepted.
What opaque does buy is that the link reveals nothing at a glance, so a result pasted into the group chat is not spoiled by the URL preview.

**Drawing is not gated.**
Anyone who opens the bare page can draw.
A static page cannot enforce a gate, and the committed archive is the record, so a stray roll changes nothing that matters.

**A bare page with no token offers a draw.**
That settles the first-visit case that was sitting in the map's fog.

## Nachtrag aus der Umsetzung

Der Token trägt eine kurze Prüfsumme.
Das widerspricht der Entscheidung oben nicht, denn sie verteidigt nicht gegen Manipulation.
Wer die Kodierung nachbaut, fälscht weiterhin ohne Mühe einen Token, und das bleibt hingenommen.
Sie fängt den Fall ab, dass ein Messenger den Link beim Weiterleiten abschneidet.
Ohne sie dekodiert ein abgeschnittener Link still zu einem falschen Ergebnis, was schlimmer ist als eine Fehlermeldung.

Die Seite zeigt den genauen Fehlergrund nicht an.
Sie nennt den wahrscheinlichen Fall in einem Satz und bietet neu auszulosen.
Der genaue Grund ist für das Archiv-Skript da, nicht für die Gruppe.
