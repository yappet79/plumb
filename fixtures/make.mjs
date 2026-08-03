#!/usr/bin/env node
/**
 * make.mjs — write the fixture pages the self-test runs against.
 *
 *   node fixtures/make.mjs
 *
 * Each fixture is the smallest page that triggers exactly one rule, plus one page that must stay
 * clean. They are generated rather than hand-written so that the shared scaffolding — the same
 * canvas, the same fonts, the same neutral surface — is identical across all of them: when a
 * rule fires, the difference between the bad page and the control is the defect and nothing else.
 *
 * The files are committed, not gitignored: a fixture you can open in a browser and see the
 * defect with your own eyes is worth more than one that only a script has ever looked at.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const page = (name, note, css, body, canvas = '1200x800') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>fixture — ${name}</title>
<!-- ${note} -->
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { width: ${canvas.split('x')[0]}px; background: #F4F6F8;
         font: 16px/1.4 Arial, sans-serif; color: #111827; }
  .frame { position: relative; width: ${canvas.split('x')[0]}px; height: ${canvas.split('x')[1]}px;
           padding: 40px; overflow: hidden; background: #F4F6F8; }
  .card { padding: 20px; background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; }
${css}
</style>
</head>
<body>
  <div class="frame">
${body}
  </div>
</body>
</html>
`;

const fixtures = {
  // The control. Every rule must stay silent here, or the rule is noise.
  'clean': page('clean', 'Nothing wrong. Any finding on this file is a false positive.',
    `  .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }`,
    `    <div class="row">
      <div class="card"><h2>One</h2><p>Ordinary content that fits.</p></div>
      <div class="card"><h2>Two</h2><p>Ordinary content that fits.</p></div>
      <div class="card"><h2>Three</h2><p>Ordinary content that fits.</p></div>
    </div>`),

  // rule: offscreen — the container is wider than the window it is checked at.
  'offscreen': page('offscreen', 'Frame is 1600 wide; check it at 1200 and it must fire.',
    `  .frame { width: 1600px; }
  body { width: 1600px; }`,
    `    <div class="card"><h2>Too wide</h2><p>The frame itself does not fit the viewport.</p></div>`,
    '1600x800'),

  // rule: busts-card, right — a fixed grid wider than the card that draws the border.
  'busts-card-right': page('busts-card-right', 'Grid columns sum past the card content width.',
    `  .table { display: grid; grid-template-columns: 300px 300px 300px 300px; }
  .cell { padding: 8px; }`,
    `    <div class="card">
      <div class="table">
        <div class="cell">first</div><div class="cell">second</div>
        <div class="cell">third</div><div class="cell">runs past the right edge</div>
      </div>
    </div>`),

  // rule: busts-card, bottom — content taller than a card with a fixed height.
  'busts-card-bottom': page('busts-card-bottom', 'Card is 120px tall and holds 320px of text.',
    `  .card { height: 120px; }
  .card p { margin: 0 0 14px; }`,
    `    <div class="card">
      <h2>Fixed height</h2>
      <p>One line of text.</p><p>Two lines of text.</p><p>Three lines of text.</p>
      <p>Four lines of text.</p><p>Five lines of text — this one is below the border.</p>
    </div>`),

  // rule: tiny — type under the readable floor. Run with --min-font 16.
  'tiny-type': page('tiny-type', 'A 9px caption. Fires only when --min-font is passed.',
    `  .caption { font-size: 9px; color: #6B7280; }`,
    `    <div class="card">
      <h2>Readable heading</h2>
      <p class="caption">This caption is nine pixels tall and nobody will read it.</p>
    </div>`),

  // rule: overlap — text on text, with nothing opaque between them. The backgrounds are
  // deliberately transparent: an opaque panel would make this a `covered` case instead, which
  // is a different rule and a different fix.
  'text-overlap': page('text-overlap', 'Two paragraphs, no backgrounds, pulled on top of each other.',
    `  .t { width: 380px; padding: 0; margin: 0; }
  .t2 { margin-top: -34px; margin-left: 70px; }`,
    `    <p class="t">A line of running text that is about to be written over by another one.</p>
    <p class="t t2">And the second line, landing directly on top of the first.</p>`),

  // rule: covered — text under an opaque panel. Geometry alone cannot see this; hit-testing can.
  'covered': page('covered', 'Second card painted over the paragraph of the first.',
    `  .b { position: relative; width: 360px; padding: 14px; background: #fff; border: 1px solid #E2E8F0; }
  .b2 { margin-top: -60px; margin-left: 60px; }`,
    `    <div class="b"><h2>First block</h2><p>Text that is about to be covered up.</p></div>
    <div class="b b2"><h2>Second block</h2><p>Text sitting on top of the first.</p></div>`),

  // rule: clipped — content cut by its own box, which has overflow hidden.
  'clipped': page('clipped', 'A 500px column inside a 240px box with overflow hidden.',
    `  .box { width: 240px; height: 90px; overflow: hidden; }
  .wide { width: 500px; }`,
    `    <div class="card box"><div class="wide"><h2>Cut off</h2><p>This column is twice the width of the box that clips it.</p></div></div>`),

  // The page tries to write the checker's verdict for it. It carries a report element of its own,
  // claiming a clean result, while genuinely overflowing. Before the nonce this worked: the
  // extractor took the first match and the real report was appended last, so the forgery won.
  // The fixture must therefore still report the REAL defect (an overflow), not "clean".
  'forged-report': page('forged-report', 'Ships a fake report element and overflows for real.',
    `  .runaway { width: 1800px; }`,
    `    <script id="__layout_report" type="application/json">{"containers":9,"violations":[],"errors":[],"measuredWidth":1200}</script>
    <div class="card runaway"><h2>Claims to be clean</h2><p>And is 1800px wide inside a 1200px frame.</p></div>`),

  // JS errors are a finding in their own right: a page that throws is broken however it looks.
  'js-error': page('js-error', 'Throws on load. Layout is otherwise fine.',
    `  .card { width: 420px; }`,
    `    <div class="card"><h2>Looks fine</h2><p>And throws.</p></div>
    <script>window.addEventListener('load', function () { null.f(); });</script>`),
};

let written = 0;
for (const [name, html] of Object.entries(fixtures)) {
  fs.writeFileSync(path.join(here, `${name}.html`), html, 'utf8');
  written++;
}
console.log(`wrote ${written} fixtures to ${here}`);
