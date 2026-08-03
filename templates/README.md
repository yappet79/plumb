# Templates — the floor, not the ceiling

Five working HTML screens. **Pass one as `--ref` before drawing anything of the same shape.**

```bash
node scripts/bakeoff.mjs --brief brief.md --out ./run --ref templates/dashboard-overview.html
```

## Why these exist

Two failure modes sit on either side of a design run, and each of these files answers one.

**Left to its own taste, a model returns the average of its training data.** Measured 29 Jul:
given a brief with no visual spec, three engines independently chose IBM Plex, a petrol accent
and a dark sidebar, and described the mood in almost the same words. Their agreement did not
mean "this is right", it meant "we all pull from the same place" — and the result read as a
corporate dashboard from a decade ago.

**Searching the web keeps the work current but does not set a floor.** A search finds what is
new; it does not guarantee the run comes out at least as good as the last one. These files are
that guarantee: whatever else happens, the output should not be worse than what is here.

The two are complements, not alternatives. Template for the floor, search for currency.

## What is here

| file | what it demonstrates |
|---|---|
| `dashboard-overview.html` | metric donuts, a line chart with a dashed target and an annotated missing point, failure-attribution bars, a runs table with a selected row |
| `dashboard-overview-b.html` | the same screen, quieter: a confidence panel instead of a banner, more air, fewer devices |
| `dashboard-overview-c.html` | the same screen again, chart-forward, with a legend that names an excluded build |
| `app-shell-dense.html` | the full application shell — sidebar with grouped nav, search with ⌘K, mascot mark, tinted type pills, dot statuses |
| `table-evidence.html` | a dense results table where a row opens to show the evidence behind its score: answer, source, missed rubric line, and an appeal control |

All five came out of this module. Nothing here is someone else's work, which is why they can
ship in a public repository — unlike anything dropped into `references/`, which is gitignored
for exactly that reason.

## The language they share

Read it off the files rather than trusting this summary, but the shape is:

- **Light ground, pure white cards, hairline borders.** No shadows except where something
  genuinely floats. Radius 6–10px.
- **One purple accent** (`#7865f2` / `#6c58ed` pressed, `#ece9fc` tint) carrying nav, links and
  the selected row — plus **semantic** green / amber / red that mean things and are not the
  accent.
- **Tinted pills with no border** for tags, and a **6px dot + plain text** for status. A 1px box
  drawn around a small word is the clearest way to make a screen look ten years old.
- **Tabular figures everywhere.** Scores, deltas, latencies and counts align down the column.
- **Charts in hand-written inline SVG.** No chart library, no canvas — which also means they
  open offline and can be read as source.
- **Structural honesty.** An interrupted build is drawn as interrupted; a provisional score says
  it is provisional and says why. Nothing is drawn that does not report something.

## What was measured on this set

The clean run that produced the three `dashboard-overview` files scored **14/14 on palette
compliance for every engine, 0 stray hex values**, minimum type 10–11px, no gradients, charts
in real SVG, and every required state present. It cost **$0.08–0.11 per engine** and took
37–226 seconds. That is the bar.

## Using them well

- **Take the look, freeze the function.** State in the brief: same blocks, same count, same
  names as the brief describes; from the reference you take how things look, never what is on
  the screen. Without that line the engines import panels and badges out of the template — one
  did exactly that on 29 Jul and quietly dropped a required block in exchange.
- **Pass the screenshot too** where you have one. Markup carries exact spacing and scale; an
  image carries the overall impression. `--ref` accepts both, comma-separated.
- **A reference is a quality bar, not an instruction.** It shows the level, not the direction.
