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
