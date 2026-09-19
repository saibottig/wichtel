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
- Playwright, as the one dev dependency, with the Chromium and Firefox builds installed.
  Run `npm install` after a fresh clone, then `npx playwright install chromium firefox` once to fetch them.
  The browsers live outside the repository, under `%LOCALAPPDATA%\ms-playwright`.
  Firefox was added on 19 September 2026, after a fault that was invisible in Chromium and broke the page entirely in Firefox.
  See `docs/agents/animation.md`.

## The network is open

The live site, the GitHub API and the public CDNs all answer from here.
The 403 that the container's proxy returned for CDN requests is gone, so a library such as three.js can now actually be loaded and tried instead of written blind.

## Looking at the site

`index.html` loads `src/app.js` as a module and fetches `archiv.json`, so opening the file over `file://` will not work.
Serve the repository root:

```
npx --yes http-server -p 8099 -s
```

Then open http://localhost:8099.

The live site is https://wichtel.turbodev.eu.
It answers over HTTPS, and plain HTTP is redirected, because Enforce HTTPS is on.

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

`npm run archivieren -- '<geteilter Link>'` decodes the shared link and writes the year into `archiv.json`.
That is a maintainer job and it runs here now.
Commit the changed `archiv.json` afterwards, because the commit is the record.

## What still needs a human

- Cloudflare DNS for `turbodev.eu`.
  There is no Cloudflare token on this machine, so zone changes stay in the dashboard.
  See `.scratch/wichtel-site/issues/01-github-pages-hosting-requirements.md` for why the zone lives there.
- Every judgement about how the site should look or behave.
  Build the options side by side and let the maintainer choose.
