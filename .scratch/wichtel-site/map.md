# Wichtel draw site

Label: wayfinder:map

## Destination

A static site live at https://wichtel.turbodev.eu that draws one starting letter and one colour per year for a group, shares that result as a link, and lists the draws from previous years.
Reaching the destination means the site is deployed and reachable at that address, not merely specified.

The site is no longer the site of one group.
Drawing and sharing are open to anyone who opens the address; only the history belongs to somebody, and it belongs to a round, `?runde=<slug>`.
The bare address has no history at all.

**Reached.**
The site answers at that address over HTTPS and was opened and checked there.
Enforce HTTPS is on as well, so plain HTTP is redirected, which closes the last settings item on ticket 02.
What remains below is not the destination, only the questions in the fog.

## Notes

Execution is in scope for this map.
This overrides Wayfinder's plan-only default, because the build is small enough that splitting a spec from the work would cost more than it saves.

The domain language is German.
The interface is written in German and colour names stay German.
Wichteln, Glitzer and Bunt are domain terms, not phrases to translate away.

Repository house rules in `AGENTS.md` apply to everything produced here.
No em dash, one sentence per line in long Markdown, and no co-author or session-link trailers in commit messages.

The work happens on the maintainer's machine, not in a web container.
`docs/agents/environment.md` says what that machine has and what it still cannot do.

Skills every session should consult: grilling and domain-modeling for decisions, prototype for anything about look or behaviour, research for facts outside this repository.

### Settled while charting

These came out of the charting conversation.
They are not up for re-litigation without a new reason.

- The draw binds the whole group. One letter and one colour per year, not one per person.
- A round is a named archive strand and nothing else. Several groups can use the site without mixing up each other's past years.
- Who gifts whom is out of scope. See Out of scope.
- Every letter stays in the pool, including Q, X and Y, plus Ä, Ö and Ü. ß is excluded, because no German word begins with it.
- Colours are one flat list with equal probability. Ordinary and wild colours sit together, so Glitzer is exactly as likely as Blau.
- The reveal is shared as a link. The result is encoded in the URL and pasted into the group chat.
- Past years are shown, fed by results committed to the repository. The link is the moment, the commit is the record.
- Domain verification at GitHub is deliberately skipped. The documented takeover window is accepted.
- The site publishes from `master`, deploying straight from the branch with no build step.

## Decisions so far

- [GitHub Pages hosting requirements](issues/01-github-pages-hosting-requirements.md): DNS for `turbodev.eu` is run by Cloudflare, not Checkdomain, so the record goes in the Cloudflare dashboard. `wichtel.turbodev.eu` does not resolve at all yet. The record is a CNAME to `saibottig.github.io`, and it must be unproxied.
- [Make master the default branch](issues/03-make-master-the-default-branch.md): already done before this session. `HEAD` on the remote points at `master` and the scratch branch is gone. Its deletion may have taken the `CNAME` with it.
- [Decide the result link format](issues/04-result-link-format.md): the result rides in the URL hash as one opaque token that decodes back to year, letter and colour. Drawing is ungated, and a bare page with no token offers a draw.
- [Curate the colour pool](issues/05-curate-the-colour-pool.md): about 28 entries in one flat list, ordinary and wild mixed, sized so repeats stay unlikely for over a decade. Nothing is excluded for being hard to shop for.
- [Archive format for past years](issues/06-archive-format-for-past-years.md): archiving is a maintainer job, invisible to participants. A repository script takes the token, decodes it, and writes the year into the archive JSON. The page gains no archiving UI.
- [Prototype the draw and the reveal](issues/07-prototype-the-draw-and-reveal.md): no throwaway prototype was built, because nothing was left open for one to answer. The reveal cycles for about two seconds and decelerates into the result, and stands still under `prefers-reduced-motion`.
- [Add the DNS record at Cloudflare](issues/02-dns-record-at-cloudflare.md): done by the account holder. The DNS check passes and the certificate is active. Setting the custom domain again also restored the `CNAME` on `master`, which the deleted scratch branch had taken with it.
- [Build and deploy the site](issues/08-build-and-deploy-the-site.md): built, pushed and live. Four pure modules behind a thin DOM adapter, no build step, published from `master`.
- [Die Enthüllung in drei Dimensionen](issues/10-enthuellung-in-drei-dimensionen.md): five reveals were built with three.js and Staub was chosen. It plays the same whether a draw just happened or a shared link was opened, and it runs in full every time. three.js is committed under `vendor/`, not loaded from a CDN, so no third party sees the group's requests and nothing can fail that the site itself would survive. If it does not load, the old cycling reveal stands in.

- [Die Enthüllung zum Mitmachen](issues/11-enthuellung-zum-mitmachen.md): five interactive reveals were built, where the result is uncovered by hand instead of playing by itself, and none of them was taken. Staub stays as it is. The drafts stay in `prototypen/mitmachen/` as the record of what Staub was measured against, and are not maintained further. The question the round leaves behind is not about gestures: a shared link is read by someone who only wanted to look something up, and that ties to ticket 09.

- [Neu auslosen steht auch dem, der nur schauen kommt](issues/09-neu-auslosen-fuer-gaeste.md): on a result reached by a shared link or from the archive, "Neu auslosen" is gone entirely and "Topf ansehen" takes its place in the button row. Drawing stays ungated, but quiet: the year badge is a link back to the invitation, faintly underlined so it is findable without hover. A fresh draw is unchanged. The invitation gained its own reserved address, `losen`, which beats the archive; it replaces `filter~<ausschluss>`, which did not.

- [Runden als Archiv-Linse](issues/12-runden-als-archiv-linse.md): the site opens to other groups, and a round is a named archive strand and nothing else.
  It rides in the query, `?runde=geschwisterwichteln`, because the hash is fully spoken for by the view grammar and a name in it would be ambiguous against a token.
  Archives move to `archiv/<slug>.json`, the loader validates rather than normalises, and a bare address has no history at all.
  Deliberately not built: no name field on the page, no pool per round, no registry of known rounds, no display name beside the slug.
  Built: `src/runde.js` checks and builds the path, `src/app.js` loads it, `archiv.json` moved to `archiv/geschwisterwichteln.json`, and `npm run archivieren` aborts rather than write into an unnamed round.
  The group has to be given the address with the parameter once, because an old bookmark now shows no history.
  The term itself and the slug rule now live in `CONTEXT.md`, which this ticket created as the repo's glossary.

## Not yet specified

- What the site should do in the months after Christmas. The page takes the calendar year, so on 1 January it stops showing the result the group is still wichteling under and invites a draw for a Wichteln eleven months away. Nobody will open it then, which is why this was left rather than guessed at.

## Out of scope

- Assigning who gives a gift to whom. The site draws the shared constraint only, and pairing stays offline. Ruled out during charting, because it would need a participant list and per-person secrecy on a page with no backend.
- Serving anything at the apex `turbodev.eu` or at `www`. This effort touches one subdomain only.
