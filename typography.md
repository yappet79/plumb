# Typography — the numbers, by what you are building

Type rules do not generalise. A 14px body is correct in an admin table and unreadable on a
poster; a 56px headline is correct on a poster and absurd in a CRM. **Pick the column below
that matches the artefact, then use its numbers.** Mixing them is how a dashboard ends up
looking like a landing page and a landing page ends up looking like a spreadsheet.

Everything here is a floor and a starting scale, not a ceiling. Where a number came from an
external source it is cited at the foot.

---

## 1. Screens you sit in front of — dashboards, admin, CRM, internal tools

The reader is 50–70cm away, on a large display, and will be here for hours. Density is a
feature; every extra pixel of leading costs a row of data.

| role | size | weight | line-height |
|---|---|---|---|
| page title | 24–32px | 600–700 | 1.2 |
| section header | 18–20px | 600 | 1.25 |
| card / widget label | 15–16px | 500 | 1.3 |
| body, table cells | **14px** | 400 | **1.4** |
| secondary / muted data | 13–14px | **300** | 1.4 |
| caption, helper text | **12px** | 400 | 1.4 |
| chart axis labels | 12px | 400 | **1.2, never lower** |

- **Type scale ratio 1.125 (major second) or 1.2 (minor third).** Anything larger — 1.25, the
  golden ratio — produces jumps that read as a marketing page inside a tool.
- **Two families, maximum: a humanist grotesque for the UI, a monospace for data.** Numbers in
  a table need fixed-width figures or the columns will not align, and misaligned figures are
  read as sloppy data long before anyone blames the font. If the grotesque offers
  `font-variant-numeric: tabular-nums`, that solves it without a second family.
- **Weight is the hierarchy tool here, not size.** 300 for secondary data, 400 body, 500 for
  anything interactive, 600–700 for headings. Four steps of weight replace four steps of size
  and cost no vertical room.
- All-caps labels: add 0.5–1px letter-spacing. Text under 14px: add ~0.2px.
- Safe faces: **Inter**, **SF Pro**, **Segoe UI**, **IBM Plex Sans**. All designed for UI, all
  with real 300 and 500 weights — which most display faces lack.

## 2. Landing pages and marketing sites

The reader is deciding whether to trust you, in about four seconds, often on a phone.

| role | size (desktop) | notes |
|---|---|---|
| hero headline | 48–72px | on mobile no smaller than 32px |
| sub-headline | 20–24px | one sentence |
| section heading | 32–40px | |
| body | **16–18px** | 16px is the floor; 14px body reads as a document, not a page |
| caption / legal | 13–14px | |

Line length 60–75 characters. Body line-height 1.5–1.6 — the opposite instinct from the
dashboard column above.

**Face by domain**, from what actually ships in each sector:

| domain | what the type has to say | faces that say it |
|---|---|---|
| fintech, legal, research, health | credibility, permanence | a text serif (**STIX Two Text**, **Source Serif**) for headlines over a neutral grotesque |
| AI tools, design platforms | new, forward-leaning | **Outfit**, **Space Grotesk**, **Plus Jakarta Sans** |
| general B2B SaaS | competent and approachable | **Plus Jakarta Sans**, **Inter**, **Manrope** |
| e-commerce | fast, neutral, mobile-first | geometric grotesques — **Poppins**, **DM Sans** |
| developer tools | precision | grotesque + a real mono in the hero, not as decoration |

The classic safe pairing everywhere: **serif headline + sans body**. Two families, three at the
absolute outside. And the uncomfortable truth from the sources: users judge technical
competence from visual presentation, so cheap typography reads as cheap security.

## 3. Posters and feed images

Different medium, different arithmetic — see **`posters.md`** for the full treatment. The
short version, because it contradicts everything above: on a 1200px canvas the content rows
go at **≥26px**, not 14px, because the image is displayed at a third of its size in a phone
feed. Industry guidance for a 1080px canvas is headings ≥48pt and body ≥24pt — **4.4% and 2.2%
of canvas width**. Keep 7% of the width as safe padding on every side; feeds crop.

## 4. Charts and data graphics

- Axis labels 12px, line-height 1.2, never lighter than 400 — they sit on top of gridlines and
  lose contrast fast.
- Value labels in a monospace or tabular figures, always. A column of proportional digits is
  not a column.
- The chart title is a sentence stating the finding, not a noun phrase naming the axes.
  "Defects fell to zero after the brief carried floors" beats "Defects by brief version".
- Never smaller than the surrounding body text just because it is a legend. A legend nobody can
  read is decoration.

## 5. Rules that hold everywhere

- **Contrast, computed not eyeballed:** 4.5:1 body, 3:1 for large text (WCAG 2.1 AA). Our own
  bar is higher for anything long-form: 7.0 body, 4.5 secondary, 3.0 accent on ground.
  `theme.mjs` computes these.
- **Grey means "skip me".** Never grey down something you want read — this is the single most
  common way a layout with correct sizes still reads as unreadable.
- **Two families is the working number, three the ceiling.** A third family must be doing a job
  the other two cannot: usually numerals, occasionally a handwritten annotation.
- **Set the scale before the page.** Pick a ratio, generate the steps, and use only those.
  Sizes chosen per-element are why a layout feels almost-right and nobody can say why.

---

Sources: [Lollypop — enterprise SaaS typography](https://lollypop.design/blog/2026/july/enterprise-saas-typography-rules/) ·
[Datafloq — typography for data dashboards](https://datafloq.com/typography-basics-for-data-dashboards/) ·
[SaaS Landing Page — most popular landing page fonts](https://saaslandingpage.com/articles/the-20-most-popular-fonts-for-landing-pages/) ·
[Carouselli — LinkedIn carousel design practices](https://carouselli.com/blog/linkedin-carousel-design) ·
[Contentdrips — LinkedIn carousel sizes 2026](https://contentdrips.com/blog/2026/03/ultimate-guide-to-linkedin-carousel-sizes-for-2026/)
