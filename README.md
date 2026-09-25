# Friends — recovered doodle build

This folder contains a local recovery of the current public build at
<https://allmyfriendsaremadeofjavascript.nikolaj-sokolowski.de/>.

Last refreshed 2026-08-18. The live site added a native `punk` hairstyle
(`mohawk` in this copy), a per-trait re-roll seed system (upstream
`character.stil`, here `character.style`), and a standalone "Werkstatt" head
editor at `/werkstatt.html`. The Werkstatt page itself (and its `satz.js`-driven
UI, here `typeset.js`) was not recovered beyond the module — the local nav link
points at the live page instead of a local copy.

## Language

The upstream project is written in German: its module filenames, trait ids,
CSS custom properties, DOM ids and comments were all German. This recovery has
since been translated wholesale into English — `gesicht.js` became `face.js`,
the trait id `laecheln` became `smile`, `--ton-papier` became `--tone-paper`,
and so on. Where this README names something on the live site, it uses the
upstream German name, because that is still what the deployment serves.

## Run it

```powershell
npm run dev
```

Then open <http://127.0.0.1:4173>.

## What was recovered

- `src/` contains formatted, friendly-named copies of the deployed JavaScript
  modules and stylesheet.
- `assets/` preserves the exact hashed production bundles from the live page.
- `recovered-build.html` preserves the deployed HTML before paths were changed
  to point at `src/`.
- `head.svg` is the deployed favicon/head asset.

The main doodle style is assembled in `src/renderer.js`. It combines the paper
texture, seeded pen, head contour, face features, hair, hats, decoration,
palette, pose, and point-cloud modules. `src/sheet.js` lays out the sheet and
animates the heads; `src/logo.js` generates the distressed, hand-set title.

## Recovery limits

The deployment does not publish source maps. The original TypeScript names,
comments, tests, and pre-build folder structure cannot be reconstructed exactly
from the production files. The recovered modules retain the production export
aliases, but have stable filenames and can be edited and run directly.

The live documentation is linked from the local page because only the doodle
application was copied.

The folder state that existed immediately before this restoration was moved to
`_before_restore_20260818_003248/`, so none of those altered files were deleted.
