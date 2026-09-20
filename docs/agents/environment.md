# Environment

Where the work happens, and what that machine can and cannot do.

## Where the work happens

The work happens on the maintainer's own Windows machine, in an ordinary clone with a persistent working copy.
`origin` is `https://github.com/saibottig/wichtel.git`.
`master` is the default branch and also the branch GitHub Pages publishes from, straight out of the repository root with no build step.

Until 19 September 2026 the work ran in a throwaway Claude web container against that same repository.
That arrangement is over, and two things it forced are no longer true: the network is not filtered, and the working copy is not reclaimed between sessions.
Older notes written under the old arrangement are corrected where they still matter, chiefly in `.scratch/wichtel-site/handoff.md`.

Committing tickets and specs is still the rule.
The reason is no longer a disappearing container but the plain one: the file is the only record there is.

## What is installed

- Node v24.15.0 and npm 11.12.1.
  `npm test` runs 73 tests through `node --test` over the pure modules.
  Those tests need nothing installed.
- git 2.45.1 and the GitHub CLI `gh` 2.100.0, signed in as `saibottig` with `repo` scope.
  Repository settings that used to need the account holder at a browser can now be read from here, and changed.
  Read them freely.
  Changing one is the maintainer's call, so ask before you do.
- Both PowerShell and Git Bash.
  Everything the project runs is plain Node, so either shell works.
- Playwright, as the one dev dependency, with the Chromium, Firefox and WebKit builds installed.
  Run `npm install` after a fresh clone, then `npx playwright install chromium firefox webkit` once to fetch them.
  The browsers live outside the repository, under `%LOCALAPPDATA%\ms-playwright`.
  Edge needs no download: `chromium.launch({ channel: 'msedge' })` drives the one on the machine.
  Firefox and WebKit were added on 19 September 2026, after a fault that was invisible in Chromium and broke the page entirely everywhere else.
  See `docs/agents/animation.md`.

- three.js, committed under `vendor/three/` rather than installed.
  `npm run three-holen` fetches it for the pinned version in `scripts/three-holen.mjs`.
  It is not a dependency of the build, because there is no build; it is a file the site serves.

## The network is open

The live site, the GitHub API and the public CDNs all answer from here.
The 403 that the container's proxy returned for CDN requests is gone, so a library such as three.js can now actually be loaded and tried instead of written blind.

## Looking at the site

`index.html` loads `src/app.js` as a module and fetches `archiv/<runde>.json`, so opening the file over `file://` will not work.
Serve the repository root:

```
npx --yes http-server -p 8099 -s
```

Then open http://localhost:8099/?runde=geschwisterwichteln.
Without the parameter the page has no history, which is correct and not a fault to chase.

The live site is https://wichtel.turbodev.eu.
It answers over HTTPS, and plain HTTP is redirected, because Enforce HTTPS is on.

## The maintainer looks at this from a phone

The work runs on his machine, but he is often not sitting at it.
Then he has a phone and no local server, so anything that only exists at `http://localhost:8099` does not exist for him at all.

Whatever he is meant to look at or choose between therefore belongs on `master`, and with it on the live site.
That includes a round of drafts: it sits under `.scratch/…/prototypen/` and GitHub Pages serves it along with everything else, because `.nojekyll` in the root stops dot-prefixed paths from being dropped.

```
https://wichtel.turbodev.eu/.scratch/wichtel-site/prototypen/<runde>/
```

Three things belong with the push, or the push is only a claim:

- Check beforehand how it looks and feels on a phone, not only in a window.
  Playwright does that: `newPage({ ...devices['Pixel 7'] })`, and `touchscreen` instead of `mouse`.
- After pushing, wait for the Pages build and actually fetch the live address.
  `gh api repos/saibottig/wichtel/pages/builds/latest --jq '.status'` reads `building` until it is done.
- Name the address in the reply, in full and tappable.

A draft has to run without a build step for this, the same way the site does.
Anything that only runs after `npm run something` never reaches him.

## Screenshots, and why they are taken mid-animation

Against that same server, a plain Node script drives the browser:

```js
import { chromium } from 'playwright'

const browser = await chromium.launch()
const seite = await browser.newPage({ viewport: { width: 900, height: 900 } })
await seite.goto('http://127.0.0.1:8099/')
await seite.click('#knopf-auslosen')
await seite.waitForTimeout(600)
await seite.screenshot({ path: 'mitten-drin.png' })
await browser.close()
```

The `waitForTimeout` before the shot is the whole point, not an afterthought.
Four of the five animation faults found so far were invisible in the final frame and only showed up in the middle of the reveal.
Take the shot during the animation, not only after it.

A screenshot of the full page shows the body background below the window height, because the base layers are `position: fixed`.
That is an artefact of the capture and not a fault, as long as the body carries the same background.

## The one dependency

The project ran without dependencies and without a lockfile until 19 September 2026, and that was a deliberate property rather than an accident.
Playwright was added anyway, because the alternative was checking animations by eye and shipping the kind of fault that hides outside the final frame.
`package-lock.json` exists from now on and belongs in the repository.

That trade is spent now.
It is not a precedent for the next dependency, and the linter question in the handoff is still open on its own merits.

## Archiving a year

`npm run archivieren -- '<geteilter Link>'` decodes the shared link and writes the year into `archiv/<runde>.json`.
The round comes out of the link's `?runde=` parameter; a bare token needs `--runde <slug>` instead, and without either the script aborts rather than guess a file.
That is a maintainer job and it runs here now.
Commit the changed archive file afterwards, because the commit is the record.

## What still needs a human

- Cloudflare DNS for `turbodev.eu`.
  There is no Cloudflare token on this machine, so zone changes stay in the dashboard.
  See `.scratch/wichtel-site/issues/01-github-pages-hosting-requirements.md` for why the zone lives there.
- Every judgement about how the site should look or behave.
  Build the options side by side and let the maintainer choose.
