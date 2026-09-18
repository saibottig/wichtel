# Wichtel draw site

Label: wayfinder:map

## Destination

A static site live at https://wichtel.turbodev.eu that draws one starting letter and one colour per year for the group, shares that result as a link, and lists the draws from previous years.
Reaching the destination means the site is deployed and reachable at that address, not merely specified.

## Notes

Execution is in scope for this map.
This overrides Wayfinder's plan-only default, because the build is small enough that splitting a spec from the work would cost more than it saves.

The domain language is German.
The interface is written in German and colour names stay German.
Wichteln, Glitzer and Bunt are domain terms, not phrases to translate away.

Repository house rules in `AGENTS.md` apply to everything produced here.
No em dash, one sentence per line in long Markdown, and no co-author or session-link trailers in commit messages.

Skills every session should consult: grilling and domain-modeling for decisions, prototype for anything about look or behaviour, research for facts outside this repository.

### Settled while charting

These came out of the charting conversation.
They are not up for re-litigation without a new reason.

- The draw binds the whole group. One letter and one colour per year, not one per person.
- Who gifts whom is out of scope. See Out of scope.
- Every letter stays in the pool, including Q, X and Y, plus Ä, Ö and Ü. ß is excluded, because no German word begins with it.
- Colours are one flat list with equal probability. Ordinary and wild colours sit together, so Glitzer is exactly as likely as Blau.
- The reveal is shared as a link. The result is encoded in the URL and pasted into the group chat.
- Past years are shown, fed by results committed to the repository. The link is the moment, the commit is the record.
- Domain verification at GitHub is deliberately skipped. The documented takeover window is accepted.
- The site publishes from `master`, deploying straight from the branch with no build step.

## Decisions so far

- [GitHub Pages hosting requirements](issues/01-github-pages-hosting-requirements.md): DNS for `turbodev.eu` is run by Cloudflare, not Checkdomain, so the record goes in the Cloudflare dashboard. `wichtel.turbodev.eu` does not resolve at all yet. The record is a CNAME to `saibottig.github.io`, and it must be unproxied.

## Not yet specified

- How the site decides which year is current, and what it shows between the draw and Christmas. This sharpens once the archive format exists.
- Whether drawing needs to be gated somehow, so a visitor who is not hosting cannot roll a new result and confuse the group. This depends on what the link format turns out to be.
- What the site does on a first visit with no link and no draw yet for this year.

## Out of scope

- Assigning who gives a gift to whom. The site draws the shared constraint only, and pairing stays offline. Ruled out during charting, because it would need a participant list and per-person secrecy on a page with no backend.
- Serving anything at the apex `turbodev.eu` or at `www`. This effort touches one subdomain only.
