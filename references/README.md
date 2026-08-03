# references/ — drop your examples here

Screenshots, exports, saved pages of work you want this module to learn from. The model reads
them **before** writing the brief.

```
references/
  ├─ landing/     # promo pages, hero sections
  ├─ ui/          # product screens, dashboards, consoles
  ├─ deck/        # slides
  └─ brand/       # your own identity: logo, palette, type spec
```

Subfolders are a convention, not a requirement — a flat pile works too. Anything Chrome can
open is fine: `png`, `jpg`, `webp`, `pdf`, a saved `html`.

## What the module does with them

It extracts **structure**, never pixels:

- the layout archetype and how the page is divided
- the type scale — how many sizes, what the step between them is
- colour discipline — how many accents, what they are used for
- the signature device that carries the work
- density: padding, row height, section gaps

Those become numbers in the brief, which is the only form the engines reliably execute.
See `../references.md` for the archetypes this vocabulary is built from.

## What it never does

- **Never copies.** Reproducing someone's layout, illustration or copy is wrong legally and
  useless practically — a copy inherits decisions that were made for a different problem.
- **Never names the source product in the brief.** "Make it like Linear" collides with the
  refusal to clone a brand and produces a worse result than describing the conventions.

## These files stay out of the repository

`.gitignore` excludes everything here except this README. The images are someone else's work:
they may inform your brief, they may not be redistributed. Keep your own brand material here
too — it is yours, and it is nobody else's business.

## Your own brand

`brand/` is the useful exception: put your palette, type spec and logo rules there, and the
module will hold them as a spec rather than as inspiration. That is the "to spec" intent from
`../SKILL.md` — tokens, and an explicit ban on improvising around them.
