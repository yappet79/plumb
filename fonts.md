# Type palette

The selection comes from `anthropics/skills/canvas-design/canvas-fonts` — 54 font files and
33 licences there, around 30 families. We took **the list, not the bytes**: their pipeline
draws in Python and needs a local `.ttf`, ours renders in Chrome and wants `woff2`, half the
weight and fetched on demand by `scripts/embed-fonts.mjs`. Carrying 15–20MB into a repo meant
for forking, for files that would need converting anyway, buys nothing.

Every family is on Google Fonts under the OFL: free to use, including commercially. If they
ever need to travel with us (offline generation, a Python pipeline) — **ship the licences
beside the files**, which is exactly why Anthropic keeps them in pairs.

## By role

| role | families |
|---|---|
| **display** | Boldonse · Erica One · Gloock · Italiana · Poiret One · Young Serif · Tektur · Big Shoulders |
| **serif** | Crimson Pro · IBM Plex Serif · Instrument Serif · Libre Baskerville · Lora |
| **grotesque** | Instrument Sans · Outfit · Work Sans · Bricolage Grotesque · National Park · Jura · Arsenal SC |
| **mono** | DM Mono · Geist Mono · IBM Plex Mono · JetBrains Mono · Red Hat Mono |
| **character** | Silkscreen · Pixelify Sans · Smooch Sans · Nothing You Could Do |

## What follows from it

**Inter is not in the selection** — despite being the most obvious choice. It also appears in
their own list of tells for generated interfaces, next to centred layouts and purple
gradients. The coincidence is not accidental: a recognisable default works against the work.

**Pair by contrast, not by similarity.** Combinations that carry:
Instrument Serif + Instrument Sans (one family, two characters) · Young Serif + Work Sans
(heavy serif against a neutral grotesque) · Gloock + Jura (high contrast against geometry) ·
Boldonse + IBM Plex Mono (poster display against technical mono).

**Mono is not only for code.** There are five of them here, and that is a hint: monospace in
captions, figures and reference marks gives the "clinical" register of the systematic
observation recipe — see step 0 in `SKILL.md`.

Palette compatibility is checked by `scripts/theme.mjs`; the themes in `themes.json` already
carry `display`/`body` pairs from this list.
