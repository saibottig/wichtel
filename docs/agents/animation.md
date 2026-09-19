# Animation

What was learned building the reveal in three.js, and what to do differently next time.

The first round of reveal animations was built with CSS and 2D canvas and was rejected.
The second round, in `.scratch/wichtel-site/prototypen/enthuellung/`, uses three.js from a CDN.
Everything below comes out of that second round.
Each item is here because it cost time, not because it is generally true.

## Where it lives and how to run it

Five reveals, one comparison page, in `.scratch/wichtel-site/prototypen/enthuellung/`.
Serve the repository root and open the folder:

```
npx --yes http-server -p 8099 -s
# http://localhost:8099/.scratch/wichtel-site/prototypen/enthuellung/
```

three.js comes from `https://cdn.jsdelivr.net/npm/three@0.186.0/` through an import map, pinned to an exact version.
There is no build step and there is no three.js in `package.json`, because nothing in the published site uses it yet.
Whether a chosen reveal may add that dependency to the real site is an open question, not a settled one.

## Every animation is a pure function of its progress

`schritt(t, sekunden)` must depend on `t` and on nothing else.
No accumulated state, no `performance.now()`, no counter that advances once per frame.
The gallery passes `sekunden` derived from `t`, so even time-based motion stays reproducible.

This is not tidiness, it is the only way to check the work.
A screenshot of five running WebGL stages costs over a second in Playwright, so by the third shot the clock is off by seconds and the pictures show nothing you asked for.
With a pure function the test script can scrub: `window.enthuellungStandbild(0.58)` puts all five at exactly 58 percent and holds them there.

`bilder.mjs` does that and writes one picture per mark.
Run it with a colour and a letter to pin the draw:

```
node .scratch/wichtel-site/prototypen/enthuellung/bilder.mjs <Ordner> Gestreift M
```

## Take the picture in the middle, not at the end

This was already true of the CSS round and it stayed true.
Four of five faults in the first round were invisible in the final frame.
In this round the same held: the marbling that rendered as coloured grit, the letter drawn off-centre and clipped, the dust that never arrived, all of them looked fine at `t = 1`.

## The hand-off to the page is the hard part

The animation ends and the page takes over.
If the animation leaves a huge letter in the middle and the page then draws a small one in the corner, the viewer sees two letters and a jump, and the whole reveal reads as cheap.
That single flaw did more damage to the first round than any missing effect.

So every reveal ends by moving its letter to exactly where `.riese` sits in the page, at exactly that size, and fades out there.
`landeplatz()` in `buehne.js` computes that spot.

Do not estimate it.
The vertical position depends on where the baseline falls inside a line box with `line-height: 1`, which depends on the font's ascender and descender, not on the font size.
Ask the font through `measureText`: `fontBoundingBoxAscent`, `fontBoundingBoxDescent` for the line, `actualBoundingBox*` for the ink of that one glyph.
Four pixels of error is enough to see two letters instead of one.

The stage uses container query units (`cqh`) throughout for the same reason.
The card and the enlarged view are then the same layout at two sizes, and the world-space computation is one formula instead of two.

## Colour has to match the page exactly, and that is harder than it looks

Three separate things have to line up, and getting two of three right still looks wrong.

**The colour space.**
CSS blends two colours in sRGB, a shader blends them in linear light.
`mix(basis, muster, 0.3)` in a shader comes out visibly lighter than the same line in CSS.
`FARBRAUM` in `farben3d.js` carries `mischeWieCss` for rebuilding a CSS blend; everything that is actual light stays linear, because there it is physically right.

**The damping.**
Patterned colours on the page lie faintly over a calm base colour, otherwise the text sits on stripes.
A shader that paints the final background itself has to do the same, with the same `daempfung` values out of `src/pool.js`.

**The tiling.**
A gradient runs once across the whole stage and may be stretched, because a stretched gradient is still the same gradient.
A pattern must repeat and must not be stretched, or stripes that run at 45 degrees on the page stand at 63 in the scene, because the stage is twice as tall as it is wide.
`kachelung()` returns a `Vector2` for exactly that reason.

A diagonal stripe texture only tiles seamlessly if its step divides the tile.
Drawing rotated rectangles does not tile; computing over `(x + y)` does.

## Test against the whole pool, never against a pretty colour

Twenty-eight colours, and four of them break things that Rot never will:

- **Schwarz** catches any constant that is added to every pixel. A lighting term that is not zero on a flat surface turns the black page mid-grey, and then the page shows a colour that was not drawn. Subtract the flat-surface response.
- **Weiß** and the pale colours blow out under additive blending and bloom.
- **Durchsichtig** is glass as a body and a checkerboard as a surface, and it needs both. Glass in front of a black background is black, so anything transmissive needs something behind it worth refracting.
- **Glitzer** is the one that repays the whole exercise, because metal with clearcoat and an environment map is something CSS cannot do at all.

The comparison page has a colour and a letter picker for this.
Use it before declaring anything finished.

## Smaller things that cost time

**Dark colours on a dark stage.**
Particles carrying the pool's colours make Schwarz invisible.
`sichtbar()` lifts a colour to a minimum brightness while keeping its hue, which turns black dust into grey dust.
That is honest: the true colour arrives with the flood at the end.

**Additive blending plus bloom becomes grey fog.**
Tens of thousands of additive points over a small area saturate, and the individual colours disappear into a bright haze.
Lower the per-point alpha and raise the bloom threshold before adding more particles.

**Domain warping multiplies frequency.**
Each warp stage multiplies the frequency of whatever it displaces, and two stages multiply with each other, and then the octaves of an fBm multiply again on top.
Set too high, marbled paper comes out as per-pixel colour grit.
`fbm3` exists next to `fbm` because after a warp the fourth octave is no longer structure, only grain.

**Transparent objects are not in the transmission backdrop.**
three.js renders opaque, then transmissive, then transparent.
A letter behind a glass gem must be opaque with `alphaTest`, not `transparent`, or it is neither refracted by the glass nor behind it, and lands in front of it instead.

**`canvas.measureText` measures from the alignment point.**
Set `textAlign` and `textBaseline` before measuring, not after.
Measuring under `start` and then drawing under `center` puts the glyph half off the canvas, which looks like a broken particle system rather than a broken measurement.

**Reset without transitions.**
Playing a second time while the first run's colour flood is still fading out looks like a fault in the animation.
It is a fault in the reset: strip the transitions for one frame, then put them back.

## Cost

One `WebGLRenderer` per animation, not one shared.
Five WebGL contexts on the comparison page is the price, and in exchange a chosen reveal lifts out as one file with no scaffolding attached.

Cap the pixel ratio at 2, and at 1.5 for anything that runs a heavy fragment shader over the whole surface.
The marbling costs a couple of dozen noise samples per pixel and has no hard edges to lose.
