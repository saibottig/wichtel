# Prototype the draw and the reveal

Type: prototype
Status: resolved

## Question

Make something rough and concrete to react to, covering how the draw looks and behaves.

The interesting part is the reveal.
A result that simply appears is flat, and the drawing moment is most of the fun at a Wichteln.
Worth trying at least one animated version, for instance letters and colours cycling before settling.

Also needs a view of the finished state, meaning the current year's letter and colour plus the list of past years, since that is what most visitors will actually open.

German interface throughout.

Blocked by the link format and the colour list, because a prototype needs real data and a real URL shape to be worth reacting to.

## Note added after 04 and 06 resolved

No copy-snippet or archive UI is needed.
Archiving is a maintainer script, so the page only ever reads the archive to list past years.

The bare page with no token in the URL offers a draw, and drawing is ungated.

## Answer

Kein Wegwerf-Prototyp gebaut.
Die Umsetzung ging direkt in die echte Seite, weil die offenen Fragen zu Link, Farbtopf und Archiv vorher geklärt waren und damit nichts mehr übrig blieb, worauf ein Prototyp hätte antworten sollen.
Das ist eine bewusste Abweichung von der Prototyp-Regel, nicht ein übersprungener Schritt.

**Die Ziehung läuft durch, bevor sie landet.**
Buchstaben und Farben wechseln etwa zwei Sekunden lang und werden dabei langsamer, dann rastet das Ergebnis mit einem kurzen Sprung ein.
Bei `prefers-reduced-motion` entfällt der Lauf und das Ergebnis steht sofort.

**Der fertige Zustand ist das, was die meisten öffnen werden.**
Oben Jahr, Buchstabe und Farbe mit Tupfer, darunter ein Satz in Klartext, darunter die vergangenen Jahre.
Das laufende Jahr steht nie doppelt, also nicht gleichzeitig oben und in der Liste.

In Chromium durchgespielt: erster Besuch, Lauf und Landung, geteilter Link in einem frischen Tab, kaputter Link, Handybreite ohne seitlichen Überlauf.
