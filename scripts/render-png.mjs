#!/usr/bin/env node
/**
 * render-png.mjs — turn an HTML artefact into the PNG a feed will actually accept.
 *
 *   node render-png.mjs <file.html> --out poster.png [--size 1200x1500] [--scale 2]
 *   node render-png.mjs deck.html --each .slide --out slide.png --size 1600x900
 *   node render-png.mjs deck.html --only .slide:5 --out five.png
 *
 * Why this exists rather than a bare `chrome --screenshot`:
 *
 * 1. **Scroll deck → blank frame.** Shooting slide 5 by scrolling to it — scrollIntoView() or a
 *    measured offset — produced uniformly blank images: the page snaps, layout is still settling
 *    under `zoom`, and headless does not wait for either. So we do not scroll. `--only` deletes
 *    every other slide and shoots the top of the document: no timing, no snap, nothing to race.
 *
 * 2. **Headless lies about animations.** A slide whose content is revealed by an
 *    IntersectionObserver never fires one — nothing scrolls — so the frame is empty and the deck
 *    looks broken when it is not. And a CSS entrance animation gets caught mid-flight, so the
 *    same file shot twice gives two different pictures. `--freeze` (on by default) stubs the
 *    observer to report everything visible and lands every animation on its final keyframe.
 *    Verification against a moving target is not verification.
 *
 * 3. **A feed wants pixels, not CSS.** LinkedIn re-compresses; upload at `--scale 2` so the type
 *    survives it.
 *
 * The two safety guards are lifted from bakeoff.mjs and matter for the same reason: the page may
 * have been written by a model from a brief we did not audit, so it is not allowed to reach the
 * network or touch a real browser profile.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromePath, baseArgs, usableWidth, fileUrl, CHROME_MIN_WIDTH } from './lib/chrome.mjs';

const exec = promisify(execFile);
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);

const src = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const out = arg('--out');
const size = arg('--size', '1200x1500');
const scale = Number(arg('--scale', '2'));
const only = arg('--only');
const each = arg('--each');
const freeze = !has('--no-freeze');
const wait = Number(arg('--wait', '9000'));
// Screen furniture — nav hints, arrow buttons, "press space" badges — is help for someone
// driving the deck. In an exported still it is a stray box in the corner that reads as a defect.
const hide = (arg('--hide', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
// A second, deliberately small copy at the width a phone feed actually gives the image. The
// full-size export always looks readable on a 27" monitor, which is exactly why it keeps
// shipping with 12px labels that vanish on the device most people will see it on.
const thumb = Number(arg('--thumb', '0'));

if (!src || !out) {
  console.error('usage: render-png.mjs <file.html> --out <file.png> [--size 1200x1500] [--scale 2]');
  console.error('       [--only <sel>[:n]] [--each <sel>] [--hide <sel,sel>] [--no-freeze] [--wait 9000]');
  process.exit(2);
}
if (!fs.existsSync(src)) { console.error(`no such file: ${src}`); process.exit(2); }
if (only && each) { console.error('--only and --each are mutually exclusive'); process.exit(2); }

const [W, H] = size.split('x').map(Number);
if (!W || !H) { console.error(`bad --size: ${size}`); process.exit(2); }

// Chrome will not lay out a CSS viewport narrower than ~504px, in either headless mode, and it
// does not say so. Ask for 390 and it lays out at 500 and then SCALES the result down to the
// 390px image you asked for — so the file looks right and the layout inside it is wrong: media
// queries fired at 500, not at 390.
//
// Measured 03 Aug with a 390px ruler box: it stopped short of the frame edge, and the page
// reported clientWidth=500. Same defect had already been found and fixed in check-layout.mjs —
// and survived here because the Chrome launch code is copied between the two files rather than
// shared. That is the whole argument for the dependency matrix.
const { width: renderW, clamped: clampedWidth } = usableWidth(W);

const bin = chromePath();
if (!bin) { console.error('Chrome not found — install it, or render elsewhere'); process.exit(2); }

const html = fs.readFileSync(src, 'utf8');

// Runs before the page's own scripts: the observer has to be replaced before anything observes.
const HEAD_PRELUDE = `<script>/* render-png */
(function () {
  var Real = window.IntersectionObserver;
  // Report every observed element as fully visible, immediately. Reveal-on-scroll code then
  // does its reveal on load, and the shot shows the slide the reader would see.
  function Stub(cb) {
    this.observe = function (el) {
      cb([{ target: el, isIntersecting: true, intersectionRatio: 1,
             boundingClientRect: el.getBoundingClientRect(), time: 0 }], this);
    };
    this.unobserve = function () {};
    this.disconnect = function () {};
    this.takeRecords = function () { return []; };
  }
  Stub.prototype.constructor = Stub;
  window.IntersectionObserver = Stub;
  window.__realIntersectionObserver = Real;
})();
</script>`;

// `animation-duration: .001s` with `fill-mode: both` lands each animation on its LAST keyframe
// rather than cancelling it — an entrance animation that fades in from 0 ends up visible, which
// is the point. Killing animations outright would leave exactly those elements invisible.
const FREEZE_CSS = `<style>/* render-png */
*, *::before, *::after {
  animation-delay: 0s !important;
  animation-duration: .001s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: both !important;
  transition: none !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; }
</style>`;

const bodyPrelude = (sel, idx) => `<script>/* render-png */
(function () {
  ${sel ? `
  var all = document.querySelectorAll(${JSON.stringify(sel)});
  for (var i = 0; i < all.length; i++) if (i !== ${idx}) all[i].remove();
  ` : ''}
  window.scrollTo(0, 0);
})();
</script>`;

const hideCSS = hide.length
  ? `<style>/* render-png */ ${hide.join(', ')} { display: none !important; }</style>`
  : '';

function build(tmp, sel, idx) {
  let h = html;
  const head = (freeze ? HEAD_PRELUDE + FREEZE_CSS : '') + hideCSS;
  h = h.includes('</head>') ? h.replace('</head>', head + '</head>') : head + h;
  const body = bodyPrelude(sel, idx);
  h = h.includes('</body>') ? h.replace('</body>', body + '</body>') : h + body;
  fs.writeFileSync(tmp, h, 'utf8');
}

async function shoot(tmp, png, profile, dsf = scale) {
  await exec(bin, [
    ...baseArgs({ profile, width: renderW, height: H, timeBudgetMs: wait }),
    `--force-device-scale-factor=${dsf}`,
    `--screenshot=${String(png).replace(/\\/g, '/')}`,
    fileUrl(path.resolve(tmp)),
  ], { timeout: Math.max(wait + 30000, 60000) });
  if (!fs.existsSync(png)) throw new Error('Chrome wrote no file');
  return fs.statSync(png).size;
}

// How many elements the selector matches — needed for --each, and worth knowing for --only so a
// silent off-by-one becomes an error instead of an empty picture.
async function countMatches(sel) {
  const probe = path.join(work, 'count.html');
  build(probe, null, -1);
  const { stdout } = await exec(bin, [
    ...baseArgs({ profile: path.join(work, '.p-count'), width: renderW, height: H }),
    '--dump-dom', fileUrl(path.resolve(probe)),
  ], { timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
  // Counting in the dumped DOM avoids a second execution channel; the class may appear in
  // attributes other than class, so match the attribute form the selector actually uses.
  const cls = sel.replace(/^\./, '');
  return (stdout.match(new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`, 'g')) || []).length;
}

if (clampedWidth) {
  console.error(`⚠ ${W}px requested; the page is laid out at ${CHROME_MIN_WIDTH}px — headless Chrome goes no narrower.`);
  console.error('  The image would still come out at the size you asked for, which is why this is worth saying:');
  console.error('  it would show a wide layout shrunk, not a narrow layout. Use a real browser\'s device mode for phone widths.');
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'render-png-'));
const results = [];

try {
  if (each) {
    const n = await countMatches(each);
    if (!n) { console.error(`--each ${each} matched nothing in ${path.basename(src)}`); process.exit(1); }
    const pad = String(n).length;
    const base = out.replace(/\.png$/i, '');
    for (let i = 0; i < n; i++) {
      const png = `${base}-${String(i + 1).padStart(pad, '0')}.png`;
      const tmp = path.join(work, `each-${i}.html`);
      build(tmp, each, i);
      const bytes = await shoot(tmp, png, path.join(work, `.p-${i}`));
      results.push([png, bytes]);
      console.log(`${path.basename(png)}  ${(bytes / 1024).toFixed(0)} KB`);
    }
  } else {
    let sel = null, idx = -1;
    if (only) {
      const m = only.match(/^(.*?)(?::(\d+))?$/);
      sel = m[1];
      idx = m[2] ? Number(m[2]) - 1 : 0;
      const n = await countMatches(sel);
      if (idx >= n) { console.error(`--only ${only}: only ${n} element(s) match ${sel}`); process.exit(1); }
    }
    const tmp = path.join(work, 'one.html');
    build(tmp, sel, idx);
    const bytes = await shoot(tmp, out, path.join(work, '.p-one'));
    results.push([out, bytes]);
    console.log(`${path.basename(out)}  ${W * scale}×${H * scale}px  ${(bytes / 1024).toFixed(0)} KB`);
    if (thumb) {
      const tpng = out.replace(/\.png$/i, '-thumb.png');
      await shoot(tmp, tpng, path.join(work, '.p-thumb'), thumb / W);
      console.log(`${path.basename(tpng)}  ${thumb}px wide — this is what the feed shows.`);
      console.log('  open it and read it. Anything you cannot read here, nobody reads.');
    }
  }
} catch (e) {
  console.error(`render failed: ${e.message}`);
  process.exit(1);
} finally {
  try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* temp dir, not worth a throw */ }
}

// A frame under ~8 KB at this size is flat colour — the classic blank-slide result. Say so
// rather than reporting a byte count and letting it pass for a picture.
const blank = results.filter(([, b]) => b < 8000);
if (blank.length) {
  console.log('');
  console.log(`⚠ ${blank.length} frame(s) look blank (< 8 KB): ${blank.map(([p]) => path.basename(p)).join(', ')}`);
  console.log('  the element may render empty on its own — check it in a browser before posting');
}
