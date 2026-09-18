# Add the DNS record at Cloudflare

Type: task
Status: open

## Question

Create the DNS record that points `wichtel.turbodev.eu` at GitHub Pages, then confirm the site answers.

This is human work.
Only the account holder can sign in to Cloudflare and change the zone.

The record is a CNAME, named `wichtel`, with the target `saibottig.github.io`, and proxying turned off so it is DNS only.
See the answer on ticket 01 for why it is Cloudflare rather than Checkdomain, and why proxying breaks certificate issuance.

Done when `wichtel.turbodev.eu` resolves to the GitHub Pages addresses and the site answers over HTTPS.
Record in the answer how long propagation took and whether Enforce HTTPS could be switched on.

## Answer

Erledigt vom Account-Inhaber.

Der CNAME steht bei Cloudflare, GitHubs DNS-Prüfung meldet "DNS check successful", das Zertifikat wurde ausgestellt und ist aktiv.
GitHub weist darauf hin, dass es bis zu einer Stunde dauern kann, bis es global verfügbar ist, und dass ein Browser dazwischen einen Neustart braucht.

Damit ist auch die Frage aus Ticket 08 beantwortet: die eigene Domain wurde in den Einstellungen neu gesetzt, und GitHub hat die `CNAME` mit dem Inhalt `wichtel.turbodev.eu` nach `master` geschrieben (Commit `4cf52c0`).
Die Vermutung stimmte also, dass die erste `CNAME` mit dem gelöschten Scratch-Zweig verschwunden war.

**Noch nachzutragen, weil nur im Dashboard sichtbar:**

- Wie lange die Propagation tatsächlich gedauert hat.
- Ob "Enforce HTTPS" inzwischen angehakt werden konnte. GitHub gibt den Haken erst bis zu 24 Stunden nach bestandener DNS-Prüfung frei.
