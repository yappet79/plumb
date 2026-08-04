---
name: plumb
description: Plumb — the design module. USE THIS PROACTIVELY, BEFORE ASKING ANY CLARIFYING QUESTIONS OF YOUR OWN, whenever the user wants something visual made or redone — a landing page, an interface, a screen, a deck, slides, a poster, an image for a post, a PDF, a design system, a mockup, a prototype, a redesign, or anything exported to PNG. Plumb runs its own onboarding and asks its own questions; a separate clarification round before it produces two interviews back to back and confuses the user. Three models draw the same brief in parallel, a script verifies the layout, the human picks the winner. Ships HTML, PNG, PDF; verifies PPTX; no Figma — the handoff is code. Triggers in any language — "design", "draw", "make it look", "screen", "prototype", "landing", "landing page", "deck", "slides", "presentation", "pdf", "design system", "mockup", "redesign", "poster", "carousel", "infographic", "linkedin image", "post image", "export to png", "plumb", "дизайн", "нарисуй", "нарисовать", "лендинг", "посадочная", "макет", "экран", "интерфейс", "прототип", "редизайн", "дека", "презентация", "слайды", "постер", "картинка для поста", "оформи", "свёрстай", "дизайн-система", "лендінг", "презентація", "інтерфейс", "малюнок".
---

# Plumb

A plumb line does not draw anything. It hangs there and tells you whether the wall is
straight — and it is right whether or not you like the answer. That is the whole idea:
**this module draws, and then it measures what it drew.**

## Who this is for

**Builders, not design teams.** The deliverable is a file that runs: HTML you commit, a PNG you
post, a PDF you send. Not a Figma document, not a set of specification artefacts for a designer
to interpret later. If the next step after "design" is "someone writes the code", this is the
wrong tool. If the next step is `git add`, it is the right one.

Say this out loud when someone asks about Figma: **Plumb does not export to Figma and is not
planning to.** The handoff is the code.

## Language — theirs for talking, English for the module

**Talk to the human in whatever language they write to you in.** They did not come here to
practise English, and a tool that answers in the wrong language is a tool that has not been
paying attention. The log takes their language too — it is theirs, on their machine.

**The module's own files stay in English. Always.** `SKILL.md`, `tokens.md`, `posters.md`,
`typography.md`, `references.md`, the scripts and their comments, the README. Never translate
them, never add a note in another language, never "helpfully" localise a rule. This repository
is forked by strangers, and a rule written in a language the next reader cannot follow is a
rule that stops being enforced.

**The one deliberate exception: the trigger list in this file's own `description`.** It carries
the same words in several languages on purpose — the router matches against that string and
nothing else, and an English-only list meant this skill did not fire when someone asked for a
«лендинг». That is routing, not prose. **Do not tidy those words away**; add to them when a
language is missing.

Copy inside the artefact is a third thing entirely: it goes in whatever language the *product*
needs, which is a question for the brief, not an inference from the chat.

## Read the log first — one line of work, before anything else

```
~/.claude/skills/plumb/.memory/log.md
```

**Read that file before you say a word.** It is local, plain markdown, gitignored, and it is
the difference between a tool and a stranger. Nothing goes to a cloud and there is no account:
this is a file on the machine, next to the module.

- **No file → you have never met.** Do the full introduction below, then create the file.
- **File exists → you have met.** Skip the introduction entirely. Greet in one line that shows
  you remember — *"Plumb again. Last time we did the Kastner landing — same brand, or something
  new?"* — and go straight to what is missing from the brief. Someone who has already heard the
  speech and gets it a second time concludes, correctly, that nobody is listening.

**Write to it after every finished piece of work**, one block, appended, never rewritten:

```markdown
## 2026-08-03 · werkstatt landing
medium: landing page, 1440 → 390 · shipped: ~/Downloads/werkstatt-landing.html
brief: independent Berlin workshop for German performance cars
picked: terra (of sol/terra/luna) · accent #9b2c2c · DM Serif Display + Inter
photos: flux-dev, 3 slots · checked: clean at 1440 and 504
note: editorial lane, warm ground allowed. Wanted the serif headline with one word in accent.
```

Keep it to what a future run needs and nothing else: **what was made, which engine won, which
palette and faces were chosen, where the file went, and what the human asked to change.** That
last line matters most — corrections are the only place their taste is stated out loud.

Also record, near the top of the file, the standing facts that stop being questions after the
first run: their brand tokens if they have any, the language they write copy in, the medium they
ask for most. **A returning user should be asked less each time, not the same amount.**

## Say hello properly — only the first time

Only when `.memory/log.md` does not exist. Someone handed an artefact by a process they cannot
see cannot steer it, and will not trust it — but that is a one-time debt, and paying it twice
is its own insult.

Warm, a little wry, and honest about the limits. Something in this spirit — **write it fresh
each time, do not paste this**:

> **Plumb.** Three models draw the same brief, a script checks the result, and you pick the
> winner. I can't promise you beautiful — I can show you what I measured, and tell you when I
> couldn't measure it.

Then, in four short lines:

- **What comes out:** an HTML page, deck or screen · a PNG for a feed · a PDF. `.pptx` I check
  but do not draw, and Figma I do not do at all — the handoff here is code.
- **How it runs:** three engines, in parallel, about $0.25 a round. You choose from one contact
  sheet rather than one model choosing for you.
- **What I check myself:** overflow, clipping, collisions, type below the readable floor, JS
  errors, contrast, whether it still works offline.
- **What I need from you:** two keys of your own, and anything you like the look of dropped
  into `references/`.
  - `OPENAI_API_KEY` — the three drawing engines. Without it nothing can be drawn at all.
  - `REPLICATE_API_TOKEN` — photographs and video, through Flux and Wan. Optional: everything
    except real images works without it.

  **They are yours and they stay yours.** Plumb has no account of its own, reaches into nobody
  else's, and spends nothing until you export one of those two. Say this plainly — a tool that
  is vague about whose money it is spending has not earned the key.

And say the uncomfortable part once, plainly: **layout defects still get through.** The checks
catch the classes of failure listed below, not every possible one. They were built from real
defects and they keep finding new ones — seven of the eight current rules exist because someone
looked at a result and said "this is crooked". If something looks off, say so; that is how the
next rule gets written.

## Then ask three things, and only three — minus whatever the log already answers

Do not interrogate. Three questions get you to a good brief; the rest is guessing on the
human's behalf, which is what the search step and the templates are for.

**Ask only what is still unknown.** If the log says they work in English and their brand tokens
are on file, question three is already answered and asking it again is not thoroughness, it is
amnesia. On a second run it is normal to ask one question, or none.

1. **Where does it live?** — a page, a deck, a poster for a feed, a product screen, a PDF. The
   medium decides the constraints, and guessing it is the most expensive mistake here.
2. **What is it, in one sentence?** — the product and who is looking at it. "A landing page for
   an independent car workshop in Berlin" is enough to start.
3. **Is there a brand already?** — tokens, a palette, a typeface, an existing page. If yes, it
   is binding and improvisation is off. If no, say so and Plumb will go and look at what
   current work in that field looks like before writing the brief.

If they arrive with a written brief, skip all three and read it. If they arrive with nothing and
want to see something now, say what you are assuming, draw, and show three — an assumption
stated out loud is cheaper to correct than a questionnaire.

**Offer the references folder in the same breath.** Create `references/` if it does not exist
and tell them it is there: screenshots, a URL, an existing page — anything they drop in gets
read before the brief is written. Reference by file beats reference by adjective, every time.
The folder is gitignored, because what they put there is usually somebody else's work.

## Where it goes when it is done

Ask this **before** drawing, not after. It changes what gets built.

| destination | what Plumb does |
|---|---|
| **a repo** | one self-contained file, fonts embedded, no external requests — it will still render in five years. Say whether it needs to be a component instead |
| **a feed** | 4:5 canvas, exported at 2× with a 400px thumbnail so you can see what the feed actually shows |
| **a deck** | a scroll deck that fits any screen, exportable to PNG per slide for a carousel |
| **print / a projector** | PDF, margins and contrast checked |
| **a design tool** | not supported. Say so now, not after they have an HTML file they cannot open |

Own, not rented. Built 28 Jul 2026 after a hosted design assistant ignored the brief three
rounds running — 0 of 16 fixed hex values, 222 uses of a typeface the brief had cancelled —
while three `gpt-5.6` engines executed the same spec cleanly on the first pass.

## First principle

**We do not guess whose taste fits — we show three and let the human choose.**
A triple run costs about $0.25 and happens in parallel. Guessing costs more than generating.

The judge is the human. The module's job is to make that choice cheap: one contact sheet,
not three tabs.

## Step 0 — where will this live

**Ask before drawing.** "A presentation" is not one job but five, and what separates them is
not taste but the medium: it dictates the constraints and the way they are verified.

| medium | choose when | what it costs | verified by |
|---|---|---|---|
| **HTML deck** | animation, one file to share | only someone with the model can edit it | `check-layout.mjs` |
| **Poster / carousel** | one image that has to work in a feed, alone | density is the job — a resized slide fails it | `check-layout.mjs` + the phone test |
| **PPTX** | **the team will edit it themselves** | we verify these files, we do not draw them — see below | `pptx-check.mjs` |
| **PDF** | print, projector, "just send it" | no interaction | margins and contrast |
| **Canva** | corporate brand kit, non-engineers editing | someone else's engine, connector only | outside our reach |
| **DOCX** | a document edited in Word | its own mechanics, see below | open and page through |
| **Product UI** | behaviour, not a picture | "pretty" is barely the point | walk the states |

There is no default: guessing the medium is the module's most expensive mistake.
**Incident 31 Jul:** a meetup deck shipped as a single `.html` while the team's source of
truth was a `.pptx`. It looked good, and every edit from the content owner had to come
through the model. The medium was chosen silently, and it turned out to be a dead end for
collaboration.

**Shared by every medium — the layout invariants.** Nothing leaves its frame, nothing
overlaps, margins are not eaten. Taken from `canvas-design`, where it is a line in a prompt;
here it is **a check in code**, because a model is free to ignore an instruction while a
script either passes or fails. On 01 Aug that difference cost three rounds of fixing a deck
by hand, guided by complaints rather than measurements.

**Philosophy before pixels** — also from `canvas-design`. Each engine names its movement in a
sentence or two ("Brutalist Joy", "dense Swiss grid") and only then draws. Without it
sol/terra/luna diverge at random; with it they diverge on purpose.

**Structural honesty** (from `frontend-design`, and it is about us). Numbering, rules and
meters may appear **only if they encode real information**. On 01 Aug slide 17 carried bars
at 100/90/80/70/60% — a neat descending staircase with no measurement behind it, which a room
would read as data. Interrogate every structural device: what exactly does it report?

From the same source: **one strong element** per layout, everything around it quiet — spend
boldness in one place instead of spreading it. Animation is either orchestrated as a whole or
absent; scattered effects read as generated. And check the cascade for self-cancellation —
conflicting specificity is the dead CSS we cleaned out by hand.

## Step 0.4 — reach for a template first

`templates/` holds five working screens produced by this module: two dashboard overviews, a
chart-forward variant, a full application shell, and a dense results table whose rows open onto
their evidence. **Pass the matching one as `--ref` before drawing anything of that shape.**

```bash
node scripts/bakeoff.mjs --brief brief.md --out ./run --ref templates/app-shell-dense.html
```

They exist because search and templates fix different problems and neither replaces the other:

- **A template sets the floor.** The run should not come out worse than the last good one. The
  clean run behind these files scored 14/14 on palette compliance across every engine, 0 stray
  hex, charts in real inline SVG, at $0.08–0.11 per engine. That is the bar to clear.
- **Search keeps it current.** A template freezes a moment; only looking outward stops the work
  drifting into last year.

Take the look, **freeze the function** — same blocks, same count, same names as the brief says.
Without that sentence the engines import panels out of the template and quietly drop a required
block in exchange, measured on 29 Jul. See `templates/README.md` for the shared language and
how it was measured.

## Step 0.5 — look before you draw

**Rules set the floor; they do not keep the work current.** Everything in `typography.md`,
`tokens.md` and `posters.md` is a floor written down at a point in time, and a model's own taste
is an average of its training data — measured on 29 Jul: three engines given free rein
independently converged on IBM Plex and a petrol accent, and the verdict was "this is
2000s-era". Their convergence meant "we all pull from the same place", not "this is right".

So before writing the brief, **go and look at what is current in this specific domain.** Ported
from a designer agent that treats this as a mandatory phase rather than an optional one:

**Costs nothing and needs no key.** `WebSearch` and `WebFetch` are Claude Code's own tools —
there is no search API to sign up for and no second bill. (A pipeline running over the API has
to pay a search provider for the same step, because these tools are not available there.)
Whoever forks this gets the step for free. The one honest limit: driven as a plain CLI without Claude, there is no
recon — the written floors still apply, but currency is on the operator.

**Search for craft, not for the industry.** This is the correction that makes the step worth
running, and it was paid for: a search for "LLM evaluation dashboard design 2026" returned the
vendors *in* that category, and the top result's interface was a decade behind. Of course it
was — the query asked who works in the niche, not who builds well. Industry search finds
competitors; it does not find a quality bar.

The primitives are universal. A table, a form, a field, a card, a modal, an empty state, a
filter bar are built the same way whether the product measures evals or sells insurance. So:

- **Craft reference** — search for the best-built interfaces in general, whatever the sector,
  and take *how a table, a form, a card is made*: density, radii, borders versus shadow, the
  weight scale, how empty and loading states are handled, how much motion.
- **Domain reference** — search the niche only for **what** goes on the screen and **how dense
  it should be**: which columns a practitioner needs, what they scan first, what belongs on one
  screen. Take the vocabulary, never the styling.

Mixing those two up is how you end up copying a weak interface because it happened to be in the
right vertical.

**Then get the real values, and note where the tooling lies.** `WebFetch` converts a page to
markdown and **throws the CSS away** — ask it for hex values and it will politely tell you it
cannot see any, which reads like the site has none. To get the actual tokens, fetch the page,
find its stylesheet link, and fetch that:

```bash
curl -sL -A "Mozilla/5.0" https://example.com/ -o page.html
grep -o 'href="[^"]*\.css[^"]*"' page.html          # then fetch the largest one
grep -o "font-family:[^;}]*" site.css | sort -u
grep -oE "oklch\([^)]*\)|#[0-9a-fA-F]{6}" site.css | sort | uniq -c | sort -rn | head
grep -o "\-\-radius[a-z-]*:[^;}]*" site.css | sort -u
```

That returns a real spec — named faces, the accent by hex, the radius scale — in about twenty
seconds. `WebFetch` is still the right tool for *what is on the page*: structure, sections,
copy, the vocabulary of the domain.

**Turn what you saw into concrete values in the brief.** "Modern and clean" is an adjective and
will be interpreted; `--accent: #2c1fea`, "Inter, radius scale 4/6/8/12px, 1px hairline borders
and no shadow" is a spec and will be executed. This is the same rule as everywhere else in this
module: a number is executed, a wish is interpreted.

The difference in one line, from the source: *"I think restaurants use warm colours"* versus
*"Noma uses Neue Haas Grotesk with muted earth tones and full-bleed photography"*.

**Boundaries, and they are firm:**

- **Look at conventions, take conventions. Never copy a site, a brand, or a layout.** Naming
  someone else's product in a brief is separately known to produce a *worse* result — measured:
  "make it like ClickUp" got a refusal to copy the brand plus the weakest output of that run.
- **A reference is a quality bar, not an instruction.** It shows the level, not the direction.
- **Skip this step** when the artefact carries someone's existing identity (brand kit, tokens
  already decided) or when the human has supplied references themselves. Recon exists to answer
  "what does current look like here", and if that is already answered, searching adds noise.
- Say what you looked at when you present the result. Research nobody can trace is an opinion.

### Second axis — intent

The medium answers "where". Intent answers "how freely", and without it we drag techniques
built for the opposite purpose into branded material.

| intent | how we behave | fits |
|---|---|---|
| **free art** | philosophy, a quiet reference, creative latitude | covers, posters, hero, a landing with character |
| **to spec** | tokens, explicit ban on improvisation | brand, product, reports, anything wearing someone's identity |

The difference is measured, not felt. `canvas-design` asks for "meticulously crafted",
"painstaking attention", "master-level execution" to be **repeated** through the brief. We
measured the opposite: a bloated brief drowns the specifics — a 4000-word spec produced 0 of
16 requested colours. There is no contradiction: **their goal is awe, ours is compliance.**
For "make it gorgeous" their approach is stronger; for a deck in a corporate purple it is
poison, because it explicitly licenses interpretation.

**Refine, don't add** (their closing pass, taken as-is). Asked to improve, a model paints
another layer. The rule is the reverse: if your hand reaches for a new shape or filter, stop —
the question is how to make **what is already there** more coherent. Improvement is more often
something removed than something added.

**The quiet reference.** The subject lives in form and colour rather than in a caption: those
who know will feel it, everyone else sees a strong abstraction. Their phrasing — "like a jazz
musician quoting another song".

**The "systematic observation" recipe** — dense accumulation of marks, repeating elements,
clinical typography, reference markers: the work reads as a diagram from a discipline that
does not exist. A ready visual language when depth is needed without illustration.

### Per-branch notes

- **HTML deck** — design on a 1600×900 canvas, but **the deck must fit any screen from the
  first render**. A slide fixed at 1600×900 px runs past the right edge of any laptop window,
  the page number is cut off, and the reader sees a broken deck and blames the design.

  **Do not hand-write the fit into the brief. Run `fit-deck.mjs` after generation.**

  ```bash
  node scripts/fit-deck.mjs deck.html --canvas 1600x900
  ```

  It applies `zoom`, which scales the layout *including its scroll height*, so the canvas
  keeps its pixel geometry — typography and hand-tuned slides stay exactly as drawn.

  **Never `transform: scale()` for this**, and never dictate it in a brief. Two reasons, both
  paid for on 04 Aug 2026, when this file itself prescribed it and three engines in a row
  copied it faithfully:

  - `transform: scale(min(100vw / 1600, 100dvh / 900))` is **not valid CSS**. `100vw / 1600`
    is a length; `scale()` takes a unitless number. The browser drops the declaration in
    silence and the deck never scales at all.
  - Even written validly, `transform` leaves the original boxes occupying their old space —
    the page still overflows horizontally and gaps open between slides.

  **Check at more than one viewport**: `--viewport 1600x900`, then `1440x780`, `1366x768` and
  `1280x700`. A deck that only passes at its own canvas size **has not been checked** — the
  canvas width is precisely the one width at which this defect is invisible, which is how it
  survived three generations before a human opened the file on a laptop.

  Self-containment counts for real: embed the font as base64 rather than linking Google
  Fonts. With no network the whole deck falls back to a substitute face, and the slides tuned
  by hand are the first to break.

  **Fill the frame, and make it checkable.** The commonest defect in a generated deck is content
  that stops around 600px and leaves the bottom third empty — on a projector that reads as an
  unfinished slide. Put a number in the brief: *the last element sits within 80px of the bottom
  edge*. And when a slide genuinely has less to say, spend the space — larger type, more leading,
  wider gaps, a band of image — rather than leaving it over.

  **No viewport units anywhere in a fitted deck** — no `vh`, `dvh`, `vw`, `svh`, `vmin`. Every
  length is a plain pixel on the canvas, and the deck container is `height: 900px`, not `100dvh`.
  Viewport units resolve *before* `fit-deck` scales the page, so afterwards they no longer mean
  what they say: a wrapper set to `100dvh` ends up shorter than the 900px stage inside it and
  `overflow: hidden` silently clips the bottom of every slide.

  **A footer costs more than it gives.** A running band with a logo and a slide number eats
  40–60px at the bottom of every slide, is the first thing to collide with content on a short
  window, and reads as a stray grey stripe when it half-fits. Put the mark and the confidentiality
  line on the title slide and leave the other slides the whole frame.

### A fixed-canvas deck is not a mobile format

Do not try to fix this with scaling. On a 390px phone a 1600×900 canvas fits at about 0.24, which
puts 18px body type at four physical pixels — not small, absent. `zoom` and `scroll-snap` also
behave differently on mobile browsers, so the page can look broken rather than merely tiny.

Ship a second medium instead:

```bash
node scripts/render-png.mjs deck.html --each ".slide" --out slides/slide.png --size 1600x900 --scale 2
```

Then serve those images to narrow screens from the same URL — hide the deck under
`@media (max-width:900px)`, reset `zoom`, and lay the slides out as a plain vertical list of
full-width images. Downscale them to ~1400px and encode as jpeg first: the full-resolution set
runs to several megabytes, which is the wrong thing to send over a phone connection.

Check the export count. `--each ".slide"` matches every element whose class list contains `slide`,
which can include wrappers you did not mean; the extra frames come out as flat 20KB files. Compare
the file count to the slide count and delete the blanks.

### Images in a generated artefact — five rules paid for in reruns

All five come from one deck on 04 Aug 2026.

- **Slots carry no inline size.** Write `<img data-slot="x" alt="…">` and nothing else; put the
  dimensions and `object-fit: cover` on the wrapping element. An inline `width:100%;height:100%`
  beats the engine's own `.thumb img{width:120px}` — inline always wins — and the row explodes.
- **Transparency dies in jpeg.** `fill-slots.mjs` now keeps an alpha source as png, because a
  transparent logo compressed to jpeg returns as a solid black rectangle, silently, and looks
  like a design decision. If you prepare an asset by hand, flatten it onto the ground colour
  yourself.
- **Photographs belong on sparse slides only.** On a dense slide — a ten-row table, two columns
  of content — a photograph steals width from content that needs it and leaves the frame no
  fuller. Title and statement slides, nowhere else.
- **Never crop a photograph into a wide, short band.** Any such crop is an unreadable smear of
  out-of-focus colour and reads as an accident. Full-height thirds, or a full-width band across
  the top half. And the footer line never crosses an image.
- **One mark per corner.** A logo on the title slide *and* the same logo in that slide's footer
  puts the same emblem twice in the same corner. Suppress the footer mark on the title.

### Numbers that must match something you ship

If a figure in the artefact has to agree with a spreadsheet, a repo or a report, **put the figure
in the brief**. An engine given a total and no breakdown will invent a plausible breakdown, and it
will be wrong in a way nobody notices until a client adds up the column.

Do not patch numbers into generated HTML afterwards by searching for the label: the same words
appear in more than one table, a string search hits the first one, and you silently corrupt a
different slide. Fix the brief and regenerate — it costs about $0.14 and it is correct.
- **PPTX — this module does not draw it.** We tried, and the output was structurally sound and
  visually poor, because a pptx is text boxes and shapes: no cascade, no real typography, no
  layers. Beauty and "editable in PowerPoint" are goals that fight, and pretending otherwise
  ships a weak deck under a strong claim. If the team must edit the file themselves, that is a
  deliberate trade — build it in PowerPoint, or design in HTML and hand the content over.
  What this module does offer: `pptx-check.mjs` validates **any** pptx, including one made
  elsewhere. Reading someone else's file: unzip → `ppt/slides/slideN.xml` → rezip; display
  order lives in `presentation.xml` → `sldIdLst`, hidden slides carry `show="0"`. Read text by
  unzipping rather than from screenshots — faster and exact. Visual QA needs LibreOffice
  `soffice` + `pdftoppm`, and its font substitution lies, so where fit matters use
  Arial/Calibri and ~10% slack.
- **PDF** — `reportlab` to write, `pdfplumber` to read; or simply Chrome `--print-to-pdf`,
  which needs no dependencies at all. Trap: unicode sub/superscript glyphs render as **solid
  black boxes** in the built-in fonts — use `<sub>`/`<super>` tags. For a projector: black and
  white with boosted contrast, not midtones; a projector crushes midtones into mush.
- **DOCX** — the `docx` package (Node). Page size in DXA (`{width:12240,height:15840}` =
  Letter, default A4) · table width must be set **twice**, as the sum of columns and on every
  cell in `WidthType.DXA` · shading only `ShadingType.CLEAR`, `SOLID` renders black · **no
  `\n`**, every paragraph is its own `Paragraph` · `PageBreak` must sit inside a `Paragraph`.
  Editing an existing file: unzip, `word/document.xml`, rezip — `docx` cannot open one.
  Reading: `pandoc -t markdown`.
- **Product UI** — demand five states: empty, loading, error, long text, no permission. And
  real data instead of lorem. A screen that is beautiful in one state and broken in five is a
  screenshot, not a design. **Draw the states as a separate deliverable** — cramming a state
  matrix into the working screen is what produced 9px type on 01 Aug.

**Generate abstract graphics with code, not with a model.** From `algorithmic-art`: one
seeded algorithm (`randomSeed(seed)`) yields a thousand reproducible variants — the search is
free and deterministic, while three engines cost money and never repeat. Techniques that work
for covers and grounds: layered Perlin fields, Voronoi and circle packing relaxed to
equilibrium, recursive branching on golden ratios, force fields with visible particle traces.
Parameters are chosen as dials — density, velocity, noise frequency — not as "pattern types".

### Reference screenshots the user supplies

**Look in `references/` before writing the brief.** If it holds anything, read it first —
`landing/`, `ui/`, `deck/` are examples the human chose deliberately, and `brand/` is their
own identity, which is a spec rather than an inspiration.

Extract **structure, never pixels**: the archetype and how the page divides · the type scale,
how many sizes and what step between them · colour discipline, how many accents and what each
is for · the signature device that carries the work · density — padding, row height, section
gaps. Turn those into **numbers in the brief**, which is the only form engines execute
reliably. Adjectives copied from a reference produce nothing.

Two prohibitions: never reproduce someone's layout, illustration or copy — a copy inherits
decisions made for a different problem; and never name the source product in the brief
("make it like Linear" collides with the refusal to clone a brand and yields a worse result
than describing the conventions).

The folder is git-ignored except its README: reference material belongs to whoever made it.

Type — `fonts.md` alongside: ~30 families grouped by role.
Layouts — `references.md`: archetypes with what holds each one up and what it costs.
**Name the archetype in the brief**, or hand different ones to different engines, and they
will diverge on purpose rather than by accident.

### Floors, not wishes

Measured 02 Aug: "make it beautiful, your call" produced 9px type and cream paper instead of
an interface. The same engines on the same product, given hard minimums, produced a readable
product screen — and **all three** stayed inside the minimums. A wish gets interpreted; a
number gets executed.

Working set for interfaces: **body 14px, secondary 13px, labels 12px, nothing below 12** ·
card padding ≥ 20px · table row ≥ 40px · section gap ≥ 32px · white or near-white ground, no
paper or cream textures · one recurring device carrying every number on the screen.

## Engines

| model | character | role |
|---|---|---|
| `gpt-5.6-sol` | builds the **application**: shell, sidebar, state badges. Slow (~2 min), densest | complex screens |
| `gpt-5.6-terra` | **air** and findings. Takes risks, sometimes breaks the spec | landings, decks, concepts |
| `gpt-5.6-luna` | **speed**: ~40 seconds, clean | iterations, drafts |

`gpt-5.5` is deliberately not in the rotation: measured on this work it draws less well than the
three above. Split the models by what each is actually good at.

## Writing the brief — learned the hard way

Three failed rounds were the brief's fault as much as the engine's. Rules:

1. **Short.** A bloated brief drowns the specifics: rules compete for attention with the rest
   of the text. A 4000-word spec meant the palette sank. Stay within a page.
2. **Tokens, not adjectives.** `--purple: #7865f2;` listed up front. Not "a purple accent".
3. **Explicitly forbid improvisation**: "Do not introduce any colour, font or gradient not
   listed above." Without that line the model drifts into its house style.
4. **Never name someone else's product.** "Make it like ClickUp" hits the refusal to copy a
   brand and yields a worse result. Describe conventions and movements instead: "Swiss
   editorial", "dense product grid", "sidebar tree with colour tiles".
5. **Put product rules in the brief.** Models execute them and often extend them — an `ABSENT`
   badge, a "no delta shown" chip, a "score confidence" card were all invented on top of spec.
6. Require **self-contained HTML** — inline CSS/SVG/JS, Google Fonts the only external link.

## Running it

```bash
node scripts/bakeoff.mjs --brief <file.md> --out <dir>
```

**Keys belong to whoever runs it.** The module has no account and never reaches into anyone
else's: first the environment variable, then a local hook `.local-keys.mjs` beside the skill
(git-ignored, everyone has their own), otherwise a clear refusal with exit code 2 and **no
paid calls**.

```powershell
$env:OPENAI_API_KEY = "sk-..."        # drawing engines
$env:REPLICATE_API_TOKEN = "r8_..."   # Flux images, Wan video
```

There is one version, not two. No code reaching into anyone's vault exists in the module —
so there is nothing to strip before publishing and nothing to forget to strip.

Flags: `--models luna,sol,terra` · `--label <name>` · `--no-render` · `--viewport 1600x900`.

**Decks always want `--viewport 1600x900`** — a slide lives in 16:9, and at application height
the dead zone under the content makes a variant look worse than it is. The contact sheet shows
the first slide only; page through the rest in the html itself.

The module generates in parallel → renders headless Chrome → checks the spec → assembles
`contact.html` with three previews and violation marks.

**Flag offenders, don't drop them.** terra, carrying a forbidden gradient, produced the best
idea of that evening in the same run. Silently filtering out the risk-takers loses them.

## Checking the layout

```bash
node scripts/check-layout.mjs <file.html> [--container .slide] [--margin 16] [--json]
```

Eight invariants plus JS errors. Exit `0` clean, `1` violations, `2` **could not check** — and
that is not "clean": an unread state has no right to look like success.

**Check at more than one width, always.** The `offscreen` rule exists because every other rule
measures content *against its container* and therefore called a 1600px slide in a 1280px window
flawless — while the reader saw half a slide, a cut page number and a horizontal scrollbar. The
tool reported clean on a deck the human was looking at, broken, on his screen. Run
`1600x900`, `1440x780`, `1280x700`; a file that only passes at its own canvas size has not been
checked. `fit-deck.mjs` is the fix when it fires.

No dependencies by design: the probe is injected into a copy of the page and the report is
read back out of plain Chrome's `--dump-dom`. Anyone who forks runs it without `npm install`.

**Point `--container` at the canvas element, not at `body`.** A screen that declares its own
frame — `.app { width: 1600px; height: 1100px }` — must be measured against that frame. Measured
against `body`, whose box may be smaller or auto-sized, a clean screen reported eleven phantom
overflows of up to 126px on 03 Aug. Wrong ruler, not a broken layout.

**Run it before showing the human, not after they say the layout broke.** Verified on real
material: the deck before repair reported 2 escapes of 106px each — a paragraph stretching a
grid column — and the repaired deck reported none.

What is **not** a violation: photo cropping under `object-fit: cover` (a frame is supposed to
crop) · single-line horizontal truncation with an ellipsis · an inline element hanging below
its line under tight leading · an element bleeding out of an inner grid while staying inside
the container · a paragraph pulled 7px under a heading. Every one of those exemptions was
earned by a false positive on live material, and the margin rule became opt-in after
producing 100% noise across three decks.

## Posters, carousels, and any HTML that has to become a PNG

Read **`posters.md`** before drawing one — a poster is not a slide scaled down, and the brief
has to say so. Short version: one image carries the whole argument to a reader with nobody
narrating, so **density is the job**, three to five sections deep, 12px floor, one accent, one
handwritten margin note.

```bash
node scripts/render-png.mjs <file.html> --out poster.png --size 1200x1500 --scale 2
node scripts/render-png.mjs deck.html --each .slide --out slide.png --scale 2 --hide ".nav-hint"
```

`--scale 2` always: the feed re-compresses and 12px type at 1× returns as mud. `--each` walks
a repeating selector and writes one numbered PNG per match — deck to carousel in one command.

Two traps this script exists to close, both paid for in wasted rounds:

- **Never shoot a scroll deck by scrolling to the slide.** `scrollIntoView()` and measured
  offsets both produced uniformly blank frames — the page snaps, layout is still settling under
  `zoom`, and headless waits for neither. `--only` removes every other slide and shoots the top
  of the document: nothing to race.
- **Headless lies about animation.** Content revealed by an `IntersectionObserver` never
  reveals, because nothing scrolls, and a CSS entrance animation is caught mid-flight — so the
  same file shot twice yields two different pictures. `--freeze` (default on) stubs the observer
  to report everything visible and lands every animation on its final keyframe. Verifying
  against a moving target is not verifying.

A frame under 8 KB is flat colour, and the script says so instead of reporting a byte count
that passes for a picture.

## Type sizes are a property of the medium

**`typography.md`** carries the numbers per artefact, and they contradict each other on
purpose: 14px body is right in an admin table and unreadable on a poster; 26px content rows are
right on a poster and absurd in a CRM. Read the section that matches what is being built.

The short form:

| building | body | scale | families |
|---|---|---|---|
| dashboard, admin, CRM | 14px (caption 12px) | 1.125–1.2 | grotesque + mono for figures |
| landing page | 16–18px (hero 48–72px) | 1.25–1.333 | serif headline + sans body |
| poster / feed image | **≥26px at a 1200px canvas** | — | see `posters.md` |
| chart | axis 12px, line-height 1.2 | — | tabular figures, always |

Two rules hold everywhere. **Weight carries hierarchy at no cost in space** — 300 secondary,
400 body, 500 interactive, 600–700 headings — which matters most exactly where room is
scarcest. And **grey means "skip me"**, so never grey down something you want read: that is the
most common way a layout with correct sizes still reads as unreadable.

## Themes and fonts

```bash
node scripts/theme.mjs --list          # palettes with a contrast verdict
node scripts/theme.mjs --show swiss    # token block, ready to paste into a brief
node scripts/theme.mjs --check         # exit 1 if a theme is unreadable
node scripts/embed-fonts.mjs <file.html>   # inline Google Fonts
node scripts/fill-slots.mjs <file.html> --photos <dir>   # photos into data-slot frames
```

Six themes in `themes.json`: `swiss` (default) · `editorial` · `product` · `violet` · `stone` ·
`night`. Six tokens each — `frontend-design` advises 4–6 and that is the honest ceiling.

**Contrast is computed, not assumed.** `theme-factory` says "watch readability"; here the WCAG
thresholds are body 7.0 (AAA), secondary 4.5, accent 3.0, rule 1.2. The formula is checked
against reference values (black on white = 21.0), and the checker itself is checked with a
deliberately bad theme — it must fail, otherwise it is a rubber stamp.

**`embed-fonts.mjs` makes self-containment true.** Images were already inlined while the
typeface came over a link — a 4.7MB file that still broke without a network. The script reads
the `<link>`, fetches the needed subsets with a browser User-Agent (Google serves ttf
otherwise), inlines base64 and **verifies no external reference survives**. It does not guess
which families are needed: on 01 Aug a hand-embed caught one and the deck used two.

## Checking a PowerPoint file

```bash
node scripts/pptx-check.mjs <deck.pptx> [--min-font 12]
```

Works on any pptx, whoever built it: canvas size, empty slides, a type floor, slides carrying
no visual element, frames running off the canvas. A pptx is a zip of XML, so the check needs
nothing installed — it unzips and reads `ppt/slides/slideN.xml`.

The canvas rule earns its place: `LAYOUT_16x9` in pptxgenjs is the small 10×5.625in canvas
while a modern deck wants 13.33×7.5in, and the mistake is silent. The checker caught it on our
own probe file — written by the same person who had quoted that rule an hour earlier.

**Structural only.** Visual QA needs LibreOffice; without it we say so rather than imply the
deck was reviewed.

**Structural check only.** Visual QA needs LibreOffice; without it we say so rather than imply
the deck was reviewed.

## After the choice

The winner is the base. Further edits go **into the code**, not into another generation round:
on 28 Jul a restyle (font, palette, weights, sizes) took one scripted pass, where going
through the model would have been three rounds and an evening.

## Visual language

`tokens.md` alongside — a base set validated by the owner. For a project with its own palette
substitute theirs, but keep the brief's structure.

Owner's taste: light minimalism, one accent, editorial serif is welcome in content, native
SVG. **Hates:** neon, marquee, custom cursors, orange as a "bad" signal, yellow-gold accents,
bar charts drawn for decoration. Flatness is cured with depth (gradient, shadow), not with
saturation.

## Weapons

Images — **Flux**, video — **Wan**, both through Replicate. The token comes from the runner's
environment or the local hook; never from the module's files and never into a log.
