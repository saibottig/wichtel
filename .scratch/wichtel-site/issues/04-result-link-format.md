# Decide the result link format

Type: grilling
Status: open

## Question

The reveal is shared as a link, so the URL carries the drawn result.
Decide exactly what that URL looks like and how much it matters that anyone can edit it.

Open points:

- Query string or hash fragment. A hash never reaches a server, which suits a static page, and it keeps the result out of any referrer header.
- Readable or opaque. `?jahr=2026&buchstabe=Q&farbe=Glitzer` is legible and trivially editable. A short encoded token is harder to fiddle with but also harder to eyeball.
- Whether casual tampering is worth defending against at all. This is siblings and friends, so the honest answer may be no.
- What the page shows when the URL carries nothing, which is the first-visit case listed in the map's fog.

This blocks the archive format and the prototype, because both need to know what a drawn result looks like as data.
