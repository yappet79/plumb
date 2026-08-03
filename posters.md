# Posters — one image that gets read in a feed

A poster is not a slide. A slide is one beat in a sequence with a person talking over it; a
poster is the whole argument in a single frame, read on a phone, with nobody explaining it.
That difference changes almost every decision, so it gets its own medium rather than a
resized deck.

The reference genre is the dense explainer image that circulates on LinkedIn: a headline
worth stopping for, then a structured teardown packed tight enough that saving the image is
worth more than reading the post. Do not copy any particular one — the grammar below is what
transfers, and anyone can hear the difference between an idea and a tracing.

---

## The rule that decides everything else

**Density is the feature, not the flaw.** Every other medium in this module fights crowding.
A poster earns its share by being worth zooming into: a reader who stops scrolling wants
something they could not have got from the caption. Half-empty white space reads as a slide
someone forgot to finish.

A useful reframing from the published guidance: **a good poster is three to five smaller square
graphics stacked**, not one composition. Design it so any section could be cropped out and
posted alone — that constraint forces self-contained sections, and it gives you a carousel for
free later without a redesign.

Concretely: a poster carries **three to four sections, each with three to five rows of real
content**. If the material does not fill that, it is a deck slide or a paragraph — say so
instead of inflating it. If it does not *fit* that at the type sizes below, it is a carousel.
Those are the only two honest answers; shrinking the type is the dishonest third.

---

## The type floor — the rule that gets broken first

Do the arithmetic once and it settles every argument. A 1200px-wide image in a phone feed is
displayed at roughly **390px** — a scale of about **0.33**. So 12px on the canvas arrives on
the reader's phone as **four physical pixels**. Not small: absent. Tapping the image barely
helps, because full-screen on a phone is about the same width; only a pinch-zoom does.

Measured on our own first three posters: table bodies at 14px, labels at 12px. They looked
fine on a 27" monitor, which is precisely how the defect survives — the author never sees the
device the reader uses.

**Floors, as a share of canvas width** (so they hold at any canvas; the px are for 1200):

| tier | share | at 1200px | what belongs here |
|---|---|---|---|
| headline | ≥ 4.5% | **≥ 54px** | the claim, plus the one accent phrase |
| feed-legible | ≥ 3.0% | **≥ 36px** | section titles, the single number that carries the poster, the winning row |
| **content rows** | **≥ 2.2%** | **≥ 26px** | **every line the reader is meant to actually read** |
| metadata | ≥ 1.3% | ≥ 16px | column headers, unit labels, source notes, the footer |

The two upper numbers are not ours: the published guidance for this format is **headings ≥ 48pt
and body ≥ 24pt on a 1080px canvas** — 4.4% and 2.2% of canvas width. We arrived at 1.8% by
measuring a reference poster and matching it, and were still below the industry floor. Use 2.2%.

Also from that guidance and worth obeying: keep **~7% of the canvas width as safe padding** on
every side (80px on 1080), because feeds crop; and hold to **three colours** in a 60/30/10
split — one ground, one ink, one accent.

**The middle tier is the one that gets broken, and it is the one that decides whether the
poster reads.** Measured against a reference poster in this genre, side by side: its headline
sat at 4.7% of canvas width and ours at 4.7% — identical. Its smallest metadata sat at 0.9%
and ours at 0.92% — identical. The whole difference was the content rows: **1.7% against our
1.17%**. Everything we wanted read had been filed into the squint band, and the poster read as
"all tiny" even though its headline was exactly the right size.

So the test is not "is the type big enough" but **"which tier is each line in, and was that
decided on purpose?"** Only genuinely optional material belongs in the metadata tier — the
kind of line whose absence would not change the argument. Keep it under roughly one text block
in six; past that the poster is a spreadsheet.

**Size is half of it; weight and contrast are the other half.** In the same comparison the
reference set its row names in near-black semibold with saturated colour bars as anchors, while
ours were regular-weight mid-grey. At the identical pixel size, one reads and one does not.
Content rows: ink at full strength, 500–600 weight. Reserve grey for the metadata tier — grey
is how you say "skip me", so never say it about something you want read.

Enforced, not requested:

```bash
node scripts/check-layout.mjs poster.html --container ".poster" --viewport 1200x1500 --min-font 16
```

And look at the thing at the size it will be seen:

```bash
node scripts/render-png.mjs poster.html --out poster.png --size 1200x1500 --scale 2 --thumb 400
```

`--thumb` writes a second file 400px wide — the feed's own size. Open it. **Whatever you
cannot read there, nobody reads.** This one habit is worth more than the rest of the page.

Everything else that keeps density from becoming mush: every block sits in a card with a
visible boundary, and rows stay under ~70 characters. Crowding is fine; ambiguity about what
belongs to what is not.

---

## The frame

| use | canvas (1×) | export |
|---|---|---|
| LinkedIn single image | **1200 × 1500** (4:5 — the tallest the feed will show uncropped) | `--scale 2` |
| Carousel page | 1080 × 1350 | `--scale 2` |
| Square / cross-post | 1200 × 1200 | `--scale 2` |
| Wide, slide-shaped | 1600 × 900 | `--scale 2` |

4:5 is the default and it is not a style choice: it is the largest slice of a phone screen the
feed will hand you. Always export at `--scale 2` — the platform re-compresses, and type at the
floor comes back mushy without the extra pixels.

---

## The parts

Six, in order. Skipping one is allowed; reordering them is usually a mistake, because this is
the order a stranger reads in.

**1 · Headline.** One or two lines, set large. **Exactly one word or phrase carries the
accent** — a different colour, an italic, or a contrasting face. That single switch is what
makes the line look composed rather than typed. Write a claim, not a topic: "You don't operate
your agent. You *manage* it" works; "Agent management" does not.

**2 · Deck line.** One sentence under the headline, small, muted, full width. It states the
scope and who it is for. Two sentences here and the poster starts feeling like a document.

**3 · Sections.** Numbered, two to five of them, each opening with a **pill**: a small filled
lozenge holding `1 · CHOOSE THE RIGHT PATH` in mono uppercase. The number is doing structural
work — it tells the reader how much is left. Which means: number them only if there is a real
sequence. Three unrelated blocks numbered 1-2-3 is the fake-staircase defect from `SKILL.md`
wearing a different hat.

**4 · Content blocks.** The vocabulary — mix two or three per poster, never all of them:

- *Label → value rows.* A left column of plain labels, a right column of mono chips. The
  workhorse; carries the most information per square inch of anything here.
- *Comparison bars.* Flat rounded bars on a shared scale, optionally two-tone to encode a
  second quantity. Print the number at the end of the bar — a bar alone is a shape.
- *Decision tree.* Boxes with YES/NO on the branches. Costs a lot of room; use it when the
  answer genuinely depends on the reader's situation.
- *Terminal panel.* Dark rounded rectangle, three window dots, mono text. Use it for something
  literally copy-pasteable, never as decoration for prose.
- *Step strip.* Numbered circles left to right with an arrow between. For a sequence in time.
- *Stat band.* Three or four big numbers with small captions. Best directly under the deck
  line, where it functions as evidence for the headline.

**5 · Margin note.** One handwritten-feeling annotation, set at a slight angle in the accent
colour, pointing at the single thing you most want noticed. This is the genre's signature
move and it works because it is **exactly one** per poster. Two and it turns into a mess.

**6 · Footer.** A quoted line in accent italic — the sentence you want repeated in the
comments — plus a quiet source/brand line. The footer is where the poster stops being an
artefact and becomes attributable.

---

## The visual system

- **Ground:** warm off-white (`#faf7f3`) or cool near-white (`#f6f8fb`). Never pure `#fff` —
  in a feed that reads as an unstyled screenshot, and the cards need to sit *on* something.
- **One accent, and it earns its keep.** Coral-orange or a deep navy carry this genre best.
  The accent may touch: one word of the headline, the pills, the mono chips, the bars, the
  margin note, the footer quote. That is the whole list.
- **Cards:** white fill, `1px` hairline border in a tint of the ink, radius 10–12px. Shadows
  optional and if used, barely — this genre reads as print, not as an interface.
- **Type:** display face for the headline (a high-contrast serif reads editorial, a heavy
  grotesque reads technical — pick one and commit); one grotesque for body; one mono for
  everything numeric, every chip, every label. Three families is the ceiling.
- **Labels:** mono, uppercase, letter-spaced, small, in the accent or a mid grey. They are
  what makes a dense grid navigable.
- **Icons: inline SVG, drawn by hand, never fetched.** This genre leans on small line glyphs —
  a document, a stack of files, a database cylinder, a robot head, a magnifier, a funnel, a
  cloud, an arrow between two boxes. They are what turns a table into a diagram. Rules that
  keep them from looking bought:
  - `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">` with
    `stroke-linecap="round"`. `currentColor` means one accent change repaints every icon.
  - **No icon fonts, no CDN, no emoji.** An emoji is somebody else's illustration in somebody
    else's colour, and it renders differently on every machine. The whole poster must survive
    being opened offline.
  - One stroke weight and one corner radius across every glyph on the poster. Mixed weights is
    the single clearest tell of icons grabbed from three different sets.
  - 20–28px in a row, 40–56px when an icon anchors a card. Below 20px a line glyph turns to
    fuzz at feed compression.
  - Draw the *thing being discussed*, not a mood: a vector store is a cylinder, a set of files
    is three offset rectangles, an agent is a rounded head with two eyes and an antenna. A
    sparkle means nothing and costs the same space.
  - Glyphs may be composed into a small diagram — `[files] → [grid] → [magnifier] → [reply]`
    reading left to right with thin arrows. That strip is often worth more than the paragraph
    it replaces.
- **One decorative element, at most.** A pale starburst behind the headline, or a tint block
  behind one section. It exists to keep the poster from reading as a spreadsheet.

Contrast is not negotiable because this is read on a phone in daylight: body ≥ 7.0, secondary
≥ 4.5, accent-on-ground ≥ 3.0. `theme.mjs` computes these; do not eyeball them.

---

## Build it

```bash
# 1. three engines draw the same poster brief, in parallel, at poster canvas
node scripts/bakeoff.mjs --brief poster-brief.md --out ./run --viewport 1200x1500

# 2. the layout gate, at the exact canvas it will be exported at
node scripts/check-layout.mjs ./run/design-sol.html --container ".poster" --viewport 1200x1500

# 3. the file a feed accepts
node scripts/render-png.mjs ./run/design-sol.html --out poster.png --size 1200x1500 --scale 2
```

For a carousel, draw the pages as one HTML with a repeating `.page` and export them in one
pass — same type, same grid, same accent across every page, which is exactly what hand-built
carousels fail at:

```bash
node scripts/render-png.mjs carousel.html --each .page --out page.png --size 1080x1350 --scale 2
```

An existing deck exports the same way; hide the screen furniture first, or the still carries a
navigation widget that reads as a bug:

```bash
node scripts/render-png.mjs deck.html --each .slide --out slide.png --size 1600x900 \
  --scale 2 --hide ".nav-hint,.deck-nav"
```

---

## Checks that apply to posters specifically

`check-layout.mjs` still rules on overflow, clipping and collisions. Three more things a
poster has to survive, and they are on the human:

1. **The phone test.** Render `--thumb 400` and read that file, not the full-size export. If
   the chips have gone to grey mud, the type floor was too low or the canvas too crowded — and
   the answer is fewer rows, never smaller type. `--min-font 16` catches the metadata floor —
   but it cannot tell you a content row was filed as metadata, which is the failure that
   actually happens. Read the thumbnail and ask which lines you can follow.
2. **The screenshot test.** Would someone save this image? If the poster only makes sense with
   the post text beside it, it is an illustration, and illustrations do not travel.
3. **The honesty test.** Every bar, every number, every ranking reports something real. This
   genre's whole persuasive power is that it *looks* measured — which is exactly why inventing
   a plausible-looking figure here is worse than in any other medium in this module.
