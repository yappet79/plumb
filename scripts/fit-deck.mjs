#!/usr/bin/env node
/**
 * fit-deck.mjs — make a fixed-canvas deck fit any screen.
 *
 *   node fit-deck.mjs <deck.html> [--canvas 1600x900] [--out <file.html>]
 *
 * A deck drawn on a 1600×900 canvas is correct and unopenable: on any laptop the window is
 * narrower, the slide runs past the right edge, the page number is cut off and a horizontal
 * scrollbar appears. The reader sees a broken deck and blames the design.
 *
 * The fix is one line of CSS. `zoom` scales the layout including its scroll height, so the
 * canvas keeps its pixel geometry — typography and hand-tuned slides stay exactly as drawn —
 * while the whole thing shrinks to the window. `transform: scale()` would leave the original
 * boxes occupying their old space and open gaps between slides.
 *
 * Written after shipping a deck with this defect and describing the rule in the module without
 * applying it to the files. A rule that is documented and not applied is worth nothing.
 */
import fs from 'node:fs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const [CW, CH] = arg('--canvas', '1600x900').split('x').map(Number);
const OUT = arg('--out', target);

if (!target) {
  console.error('usage: fit-deck.mjs <deck.html> [--canvas 1600x900] [--out <file.html>]');
  process.exit(2);
}
if (!fs.existsSync(target)) { console.error(`no such file: ${target}`); process.exit(2); }

let html = fs.readFileSync(target, 'utf8');

if (html.includes('/* fit-deck */')) {
  console.log('already fitted — nothing to do');
  process.exit(0);
}

// The ratio is computed in script, not in CSS. `zoom: calc(100vw / 1600)` looks right and is
// invalid — dividing a length by a number yields a length, while zoom wants a factor, so the
// declaration is dropped silently and the deck stays broken while the tooling reports success.
// min(1, …) keeps the deck from scaling UP on a large monitor: enlarging a hand-tuned slide is
// as wrong as cutting it.
const css = `<style>/* fit-deck */
html { overflow-x: hidden; }
body { margin: 0; }
@media print { body { zoom: 1 !important; } }
</style>
<script>/* fit-deck */
(function () {
  var CANVAS = ${CW};
  function fit() { document.body.style.zoom = Math.min(1, window.innerWidth / CANVAS); }
  fit();
  addEventListener('resize', fit);
})();
</script>`;

// Injected at the end of body: it needs document.body to exist, and running it before the
// deck's own scripts would be pointless anyway.
html = html.includes('</body>') ? html.replace('</body>', css + '\n</body>') : html + css;
fs.writeFileSync(OUT, html, 'utf8');

console.log(`fitted to a ${CW}×${CH} canvas → ${OUT}`);
console.log(`check it at more than one width: --viewport ${CW}x${CH}, then 1440x780 and 1280x700`);
