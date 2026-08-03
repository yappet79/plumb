# Base visual language

## A bordered box around a small label is how a screen dates itself

The single most reliable tell of a dated interface is not the palette — it is a **1px rectangle
drawn around a small word**. Status chips, type tags, category labels: put a border on them and
the screen reads a decade old, whatever the colours are.

Current practice is a **tinted fill with no border**:

```css
.tag {
  padding: 2px 6px;
  border-radius: 5px;
  background: <hue at ~10% over white>;
  color: <the hue's deep tone>;
  font-size: 12px;
  font-weight: 500;
}
```

And a status is a **6px dot followed by plain text**, not a boxed chip.

Measured 03 Aug: the eval-run screen with bordered chips was called "labels like from the 90s";
the same screen with borderless tinted pills was not. Nothing else changed.

## White is the default ground for software

A tool's ground is **cool near-white**; cards on it are **pure white**. Warmth is an editorial
device — it belongs to a magazine layout, a poster, a book — and on a product screen it reads as
a scan of a document rather than as software.

The failure is easy to miss because each value looks harmless on its own. Measured 03 Aug: two
engines independently chose `#F3F4F0` / `#F8F8F6` grounds with `#20231F` / `#18211E` ink — all
of them faintly green-cream. Nothing was wrong with any single value, and the verdict on the
result was "yellowish, like paper". A near-white with a green cast is still a green cast, and
across a full screen the eye reads it as age.

A cool neutral set that works, and the one to fall back on when the brief has no palette:

```
--ground:        #F4F6F8;   /* the page behind the cards */
--surface:       #FFFFFF;   /* cards, table, panels — pure white, they must lift */
--surface-alt:   #F8FAFC;   /* sidebar, subdued rows */
--surface-strong:#EEF2F6;   /* pressed, selected */
--ink:           #111827;   /* body — cool black, not brown-black */
--ink-soft:      #374151;
--muted:         #6B7280;
--faint:         #9CA3AF;
--line:          #E2E8F0;
--line-strong:   #CBD5E1;
--accent:        #2F6FED;   /* decorative accent only — see below */
```

**Saturated data colours, muted surfaces.** The other half of the same verdict was that our
hues were "not tasty" — desaturated sage and dusty blue. Chips and bars want fully saturated
hues at a light tint; it is the *surface* that stays quiet, not the data.

```
green  #12A594   tint #E6F6F3   text #0B6E62
amber  #D99B1F   tint #FCF3E0   text #8A6208
coral  #E2603F   tint #FCEDE8   text #9C3A20
red    #C2371F   (solid fill, white text)
violet #7C5CD6   tint #F0ECFC   text #4C3699
blue   #2F6FED   tint #E8F0FE   text #1B4CB8
rose   #B8637F   tint #FBEDF2   text #8A2F4D
```

**No hue may carry two meanings in one screen.** If the score scale already owns amber, a
category tag may not also be amber — two meanings sharing a colour reintroduces exactly the
ambiguity the colour was added to remove.

## Semantic colour is not the accent

The "one accent" rule governs **decorative** colour: the active nav item, the primary button, a
link, the focus ring. It does not govern colour that carries meaning.

A score, a status, a severity, a failure cause are categories, and a table where every state is
another shade of grey has to be **read cell by cell instead of scanned**. That is a functional
defect, not restraint. Give them hues:

- **Scale states** (score 3/2/1/0, ok/warn/error) — green, amber, orange, red. Muted: a tinted
  fill with a matching border and darker text, never a solid bright block.
- **Category states** (retrieval / prompt / judge; billing / auth / infra) — distinct hues with
  no implied ranking, set as bordered tags rather than coloured words.
- **Deltas** — regression red, improvement green, and nothing else in the row competing.

**Hue never carries the meaning alone.** The numeral, the border weight and the fill must differ
too, so the column still reads in greyscale, in a printout, and to a colour-blind reader. If
removing the colour makes the table unreadable, the colour was doing the label's job.

Measured 03 Aug on the eval-run screen: identical layout, every state in grey, and the verdict
was "it's all grey". Semantic hues added and the regressions were visible from across the room.
Fourteen greys is not restraint — it is a table nobody can scan.

---

Validated on the eval-machine prototype, 28 Jul 2026. For a project with its own palette,
substitute the values — but **keep the shape of the block**: the token list first, then the
ban on improvising. That shape is what produced 14/14 compliance.

Paste into a brief as-is:

```
## Design system — binding. Use these values and no others.

--purple:       #7865f2;   /* primary accent */
--purple-deep:  #6c58ed;   /* pressed, links */
--purple-tab:   #8d79f2;   /* active tab, calm warning */
--row-active:   #ece9fc;   /* selected row fill */
--green:        #00ba85;   /* pass */
--red:          #c63c3c;   /* fail, urgent */
--amber:        #f1ac2b;   /* attention, never "bad" */
--ink:          #292d34;   /* primary text */
--ink-soft:     #656f7d;   /* secondary text */
--ink-faint:    #767c86;   /* labels — 4.6:1 on white, do not lighten */
--line:         #e6e6ea;   /* hairlines */
--bg:           #fbfbfb;   /* app background */
--panel:        #ffffff;   /* cards */
--panel-2:      #f4f4f6;   /* inset surfaces */

- Typeface: Inter, from Google Fonts. Weights 400/500/600 only.
- Base size 14px. Nothing on the page smaller than 10px.
- Almost nothing is bold: 600 is the heaviest weight, headings and key numbers only.
- Radius 8px, hairline borders in --line, at most one soft neutral shadow.
- Numbers in columns must align (tabular figures).
- Text under 14px must clear 4.5:1 contrast.
- Do not introduce any colour, font or gradient not listed above. Tint by compositing the
  listed hues on white; do not invent new hex values.
```

## Why these choices

- **Do not lighten `--ink-faint`.** The previous value `#a29fbd` measured about 2.5:1 on
  white — small captions were barely readable.
- **Warning stays lavender** (`--purple-tab`), not grey and not orange. Grey reads as
  "disabled"; orange as a "bad" signal was rejected by the owner.
- **Amber means "attention", not "bad".** Failure has `--red`.
- **Weights one step below the habit.** 600 as the maximum stops the interface shouting.
- **The gradient ban belongs in the brief, not in the code.** In finished code, depth
  (gradient rings, soft shadows) cures flatness better than a more saturated hue. It is easier
  to forbid a model and add depth by hand than to permit it and clean up afterwards.

Note: this set predates `themes.json` and is kept because it is validated. It also uses Inter,
which `fonts.md` argues against for new work — here it is a deliberate exception carried over
from the prototype, not a default.
