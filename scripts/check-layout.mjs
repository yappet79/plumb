#!/usr/bin/env node
/**
 * check-layout.mjs — layout invariants verified by code instead of by eye.
 *
 *   node check-layout.mjs <file.html> [--container .slide] [--viewport 1600x900]
 *                                     [--margin 16] [--json] [--quiet]
 *
 * `canvas-design` keeps these rules as a line in a prompt. A model is free to ignore an
 * instruction — a script either passes or fails. Where an instruction can be replaced with
 * code, replace it.
 *
 * Every rule below was earned from a real defect, and every exemption from a real false
 * positive on live material. Five rules catch breakage; margins are opinion and opt-in.
 *
 * No dependencies by design: the probe is injected into a copy of the page and the report is
 * read back out of plain Chrome's `--dump-dom`. Whoever forks runs it without `npm install`.
 *
 * Exit: 0 clean · 1 violations · 2 could not check — which is NOT the same as clean.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { chromePath, baseArgs, usableWidth, fileUrl, CHROME_MIN_WIDTH } from './lib/chrome.mjs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const CONTAINER = arg('--container', '.slide');
const [VW, VH] = arg('--viewport', '1600x900').split('x').map(Number);
// Margins are a matter of medium and taste, not breakage: in a deck, panels reaching the edge
// are a device; in a dense console 16px is normal, not cramped. Three decks in a row produced
// 100% noise here and not one real finding, so the rule is switched on explicitly: --margin N.
const MARGIN = argv.includes('--margin') ? Number(arg('--margin', '16')) : 0;
// Opt-in for the same reason as --margin: the readable floor belongs to the medium, not to
// layout in general. For anything exported as an image and viewed in a feed, pass it.
const MIN_FONT = argv.includes('--min-font') ? Number(arg('--min-font', '16')) : 0;
const AS_JSON = argv.includes('--json');
const QUIET = argv.includes('--quiet');

if (!target) {
  console.error('usage: check-layout.mjs <file.html> [--container .slide] [--viewport 1600x900] [--margin 16] [--json]');
  process.exit(2);
}

// chromePath, the launch flags and the viewport clamp live in lib/chrome.mjs. They used to be
// copied into each of the three scripts that drive Chrome, and the copies had drifted: this one
// knew about CHROME_PATH and chromium, the other two knew about Edge. On Linux with only
// chromium installed, this script worked and rendering did not.

// The probe runs INSIDE the page. Everything it needs arrives through placeholders.
const PROBE = `
<script id="__probe">
// Runs AFTER load, not at parse time. It used to be a bare IIFE, which meant two things nobody
// noticed until the self-test asked: an exception thrown from a load handler was never seen —
// the report had already been serialised — and every measurement was taken before the page had
// finished settling. Both were found on 03 Aug by a fixture that throws on load and a checker
// that called it clean.
(() => {
const __run = () => {
  const CONTAINER = %CONTAINER%, MARGIN = %MARGIN%, TOL = 1.5;
  // The width the artefact was asked to work at, not what the harness happened to leave. Chrome
  // hands a 1200px window a 1182px viewport — the scrollbar gutter survives --hide-scrollbars —
  // and measuring against that reported every correct 1200px poster as 18px too wide.
  // An exported PNG has no scrollbar; the ruler must not invent one.
  const ROOM = %VIEWPORT_W%, MIN_FONT = %MIN_FONT%;
  const out = { containers: 0, violations: [], errors: [], measuredWidth: 0 };
  // What the page actually got. If the harness could not deliver the requested width, every
  // number below is about a different page than the one asked about — say so instead of
  // reporting findings that belong to a viewport nobody uses.
  out.measuredWidth = document.documentElement.clientWidth;
  const rect = (el) => el.getBoundingClientRect();
  const label = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    const txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return (el.tagName.toLowerCase() + id + cls + (txt ? ' «' + txt + '»' : '')).slice(0, 90);
  };
  // A text leaf: carries its own text rather than only wrapping other elements.
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = rect(el);
    return r.width > 0 && r.height > 0;
  };

  const containers = [...document.querySelectorAll(CONTAINER)].filter(visible);
  const scope = containers.length ? containers : [document.body];
  out.containers = scope.length;

  scope.forEach((box, i) => {
    const B = rect(box);
    const name = box.id || (CONTAINER + '[' + i + ']');
    const kids = [...box.querySelectorAll('*')].filter(visible);

    // 0. offscreen — the container itself is wider than the window. Every rule below measures
    //    content against the container and calls a 1600px slide in a 1280px window flawless,
    //    while the reader sees half a slide, a cut page number and a horizontal scrollbar.
    //    A deck must fit the screen, not demand a screen; scale the canvas (see fit-deck.mjs).
    //    Measured on the right EDGE, not the width, because two different defects land here and
    //    the fix differs: a container wider than the window (scale it — fit-deck.mjs), or one
    //    that fits but is pushed out by a stray offset, usually the browser's default 8px body
    //    margin. The second one costs the last 8px of every export and reads as a rendering bug.
    if (i === 0 && B.right > ROOM + 2) {
      const cause = B.width > ROOM + 2
        ? 'container ' + Math.round(B.width) + 'px wider than the ' + ROOM + 'px window'
        : 'container fits, but starts at x=' + Math.round(B.left) + ' (body margin?)';
      out.violations.push({ kind: 'offscreen', container: name, side: 'right',
        px: Math.round(B.right - ROOM), el: cause });
    }

    // 1. overflow — measured against the container frame. overflow:hidden is no excuse:
    //    content cut off by the edge is just as lost to the viewer.
    //    A scrollable ancestor IS an excuse, though: sliding under its edge is the whole
    //    point of scrolling. A list of eleven quotes inside a scroll area is not broken.
    const inScroller = (el) => {
      for (let p = el.parentElement; p && p !== box; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY) || /(auto|scroll)/.test(s.overflowX)) return true;
      }
      return false;
    };
    for (const el of kids) {
      const r = rect(el);
      if (!ownText(el) && !el.matches('img,svg,video,canvas')) continue; // skip pure wrappers
      if (inScroller(el)) continue;
      const over = {
        right: r.right - B.right, bottom: r.bottom - B.bottom,
        left: B.left - r.left, top: B.top - r.top,
      };
      const worst = Object.entries(over).filter(([, v]) => v > TOL).sort((a, b) => b[1] - a[1])[0];
      if (worst) out.violations.push({ kind: 'overflow', container: name, side: worst[0], px: Math.round(worst[1]), el: label(el) });
    }

    // 1b. clipped — content does not fit its OWN box and is cut by it. Catches nested
    //     overflow that a check against the slide frame misses: on 01 Aug a 679px column
    //     sat in a 480px container while formally staying inside the slide.
    //     Cropping a photo under object-fit:cover is a technique, not a fault — a frame is
    //     supposed to crop. So pure media boxes are skipped and we look where TEXT is cut.
    //     (The first run produced 12 such false positives on a live deck.)
    const mediaOnly = (el) => el.children.length > 0 &&
      [...el.children].every((c) => c.matches('img,svg,video,canvas,picture'));
    for (const el of [box, ...kids]) {
      if (mediaOnly(el)) continue;
      const s = getComputedStyle(el);
      const hidesY = s.overflowY === 'hidden' || s.overflowY === 'clip';
      const hidesX = s.overflowX === 'hidden' || s.overflowX === 'clip';
      const dy = el.scrollHeight - el.clientHeight;
      const dx = el.scrollWidth - el.clientWidth;
      if (hidesY && dy > TOL && el.clientHeight > 0) out.violations.push({ kind: 'clipped', container: name, side: 'bottom', px: Math.round(dy), el: label(el) });
      // Horizontal clipping of a single-line element is truncation with an ellipsis, the
      // everyday device of lists and tables. Content is lost when a multi-line block is cut.
      // One live screen produced five such false positives in a row.
      // Measured on the CONTENT height, not clientHeight: clientHeight includes padding, so a
      // one-line table cell with 12px of padding stopped looking like one line and started
      // being reported as lost content. Found 03 Aug on a template, by a cell reading
      // "Did not finish…" — ellipsis present, nothing actually lost.
      else if (hidesX && dx > TOL && el.clientWidth > 0
               && (el.clientHeight - (parseFloat(s.paddingTop) || 0) - (parseFloat(s.paddingBottom) || 0))
                  > (parseFloat(s.lineHeight) || 0) * 1.6) {
        out.violations.push({ kind: 'clipped', container: name, side: 'right', px: Math.round(dx), el: label(el) });
      }
      // Overflow while the box is VISIBLE — the sneakiest case: nothing is clipped, no
      // neighbouring boxes intersect, and the letters still land on the next column. This is
      // how a large headline runs into the text beside it. Text only: for images and svg a
      // scroll/client gap is normal.
      else if (!hidesX && dx > 4 && el.clientWidth > 0 && ownText(el) && !el.matches('img,svg,video,canvas')) {
        out.violations.push({ kind: 'spills', container: name, side: 'right', px: Math.round(dx), el: label(el) });
      }
    }

    // 1c. escapes — leaves its OWN parent while the parent hides nothing. That is exactly how
    //     a column 679px tall sat in a 480px grid row: inside the slide, but over the photo
    //     and past the block's bottom edge. Neither the slide frame nor clipped sees it.
    for (const el of kids) {
      // The "text leaves only" filter must NOT apply here: what escaped was a wrapper column
      // carrying no text of its own, and that is precisely what had to be caught.
      const p = el.parentElement;
      if (!p || p === box || p === document.body) continue;
      const ps = getComputedStyle(p);
      if (ps.overflow !== 'visible') continue;            // a hiding parent is case 1b
      const es = getComputedStyle(el);
      if (ps.position === 'static' && es.position === 'absolute') continue;
      // An inline element routinely hangs below its line under tight leading: an italic tail
      // at line-height .88 drops ten pixels, and that is a device, not a break. Only the
      // collision matters, and overlap covers that.
      if (es.display === 'inline') continue;
      const r = rect(el), P = rect(p);
      // A negative margin on the side it leaves means a deliberate bleed, not an accident:
      // accidental overflow does not come with negative margins.
      const mb = parseFloat(es.marginBottom) || 0, mr = parseFloat(es.marginRight) || 0;
      const outB = r.bottom - P.bottom + (mb < 0 ? mb : 0);
      const outR = r.right - P.right + (mr < 0 ? mr : 0);
      const outBy = Math.max(outB, outR);
      // Leaving an inner grid only matters if the element also leaves the CONTAINER — the
      // thing that will actually clip it. A photo bleeding out of a text column into the
      // slide margin is a device: the viewer sees all of it.
      const insideBox = r.right <= B.right + TOL && r.bottom <= B.bottom + TOL
        && r.left >= B.left - TOL && r.top >= B.top - TOL;
      if (outBy > 4 && !insideBox) out.violations.push({ kind: 'escapes', container: name, side: outB >= outR ? 'bottom' : 'right', px: Math.round(outBy), el: label(el) });
    }

    // 2. overlap — between text leaves only, and only when they are not related.
    const leaves = kids.filter((el) => ownText(el) && rect(el).height < B.height * 0.9);
    for (let a = 0; a < leaves.length; a++) {
      for (let b = a + 1; b < leaves.length; b++) {
        const A = leaves[a], C = leaves[b];
        if (A.contains(C) || C.contains(A)) continue;
        const ra = rect(A), rc = rect(C);
        const ox = Math.min(ra.right, rc.right) - Math.max(ra.left, rc.left);
        const oy = Math.min(ra.bottom, rc.bottom) - Math.max(ra.top, rc.top);
        // Meaningful overlap is REQUIRED on both axes. Otherwise we catch leading
        // compensation rather than colliding letters: pulling a paragraph 7px under a heading
        // is ordinary typography — the boxes intersect, the glyphs do not.
        if (ox > 8 && oy > 8) {
          const area = Math.round(ox * oy);
          if (area > 120) out.violations.push({ kind: 'overlap', container: name, px: area, el: label(A), el2: label(C) });
        }
      }
    }

    // 2b. covered — text that something opaque is sitting on top of.
    //     Rule 2 compares text against text and therefore misses the commoner case: a panel,
    //     a card or a sticky bar painted over a paragraph. Found 03 Aug by the first run of the
    //     self-test, on a fixture where the collision was plainly visible and every rule was
    //     silent — the covering element had no text of its own, so nothing compared it.
    //
    //     Hit-testing rather than geometry, because geometry cannot tell what is on top:
    //     ask the document what is actually painted at the middle of the text. An element with
    //     pointer-events:none is transparent to this, which is the right answer — a decorative
    //     overlay is not what makes text unreadable.
    for (const el of kids) {
      if (!ownText(el)) continue;
      const r = rect(el);
      if (r.width < 12 || r.height < 8) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue; // off-screen, other rules own that
      const top = document.elementFromPoint(x, y);
      if (!top || top === el || el.contains(top) || top.contains(el)) continue;
      const s = getComputedStyle(top);
      const bg = s.backgroundColor || '';
      const opaque = bg && !/rgba\\(\\s*0,\\s*0,\\s*0,\\s*0\\s*\\)/.test(bg) && bg !== 'transparent';
      if (!opaque) continue; // see-through: the text still reads
      out.violations.push({ kind: 'covered', container: name, px: Math.round(r.width * r.height),
        el: label(el) + ' under ' + label(top) });
    }

    // 3. margins — even what technically fits has to breathe.
    //    Measure by CONTENT, not by the frame: a block element's frame always spans the
    //    parent's width, so "gap 0" appears even when the text is held off by forty pixels of
    //    padding. The very first control run produced exactly that false positive.
    const inset = (el, r) => {
      const s = getComputedStyle(el), n = (v) => parseFloat(v) || 0;
      return { left: r.left + n(s.paddingLeft), right: r.right - n(s.paddingRight),
               top: r.top + n(s.paddingTop), bottom: r.bottom - n(s.paddingBottom) };
    };
    const Bi = inset(box, B);
    for (const el of kids) {
      if (!ownText(el)) continue;
      const c = inset(el, rect(el));
      const gap = Math.min(c.left - Bi.left, Bi.right - c.right, c.top - Bi.top, Bi.bottom - c.bottom);
      if (gap >= 0 && gap < MARGIN) out.violations.push({ kind: 'margin', container: name, px: Math.round(gap), el: label(el) });
    }

    // 6b. busts-card — a child crosses the edge of a parent that READS AS A CARD.
    //     Rule 3 deliberately exempts this: bleeding out of an inner grid into the slide
    //     margin is a device, and demanding otherwise produced false positives. But a parent
    //     with its own border or its own fill is not a grid — it is a drawn box, and content
    //     crossing a drawn edge is a defect at any distance from the container.
    //     Earned 03 Aug: a results table with 1040px of fixed grid columns inside a 998px card
    //     pushed its last column and the total 42px past the card's border. The poster passed
    //     every rule, and the number sat visibly outside the box the reader saw.
    const looksLikeCard = (el) => {
      const s = getComputedStyle(el);
      if (parseFloat(s.borderRightWidth) > 0 && s.borderRightStyle !== 'none') return true;
      const bg = s.backgroundColor;
      if (!bg || bg === 'transparent' || /rgba\\(0, 0, 0, 0\\)/.test(bg)) return false;
      const p = el.parentElement;
      return !!p && getComputedStyle(p).backgroundColor !== bg;
    };
    //     Measured against the nearest CARDED ancestor, not the direct parent: what overflows
    //     is usually a grid cell, and the grid itself has no border of its own, so a
    //     parent-only check finds nothing while the number sits outside the drawn box.
    //     Threshold 8px, matching the overlap rule. Below that it is padding arithmetic and
    //     sub-pixel rounding — a control run over two clean decks produced eight findings of
    //     4-5px each and not one of them was visible.
    const cardOf = (el) => {
      for (let p = el.parentElement; p && p !== box; p = p.parentElement) if (looksLikeCard(p)) return p;
      return null;
    };
    const carded = new Set();
    for (const el of kids) {
      const p = cardOf(el);
      if (!p) continue;
      const ps = getComputedStyle(p), pr = rect(p);
      if (/(auto|scroll|hidden)/.test(ps.overflowX)) continue; // clipped, and rule 1b owns that
      // Both axes. The first version checked only the right edge and passed a poster whose
      // fourth command dropped its caption out of the bottom of the card and onto the cards
      // below — visible at a glance, invisible to the rule. A drawn edge is a drawn edge
      // whichever side content crosses.
      const rightEdge = pr.right - (parseFloat(ps.paddingRight) || 0) - (parseFloat(ps.borderRightWidth) || 0);
      const bottomEdge = pr.bottom - (parseFloat(ps.paddingBottom) || 0) - (parseFloat(ps.borderBottomWidth) || 0);
      const r = rect(el);
      const overRight = r.right - rightEdge;
      const overBottom = r.bottom - bottomEdge;
      // Different thresholds per axis, both earned. Right: 8px, the same as the overlap rule.
      // Bottom: 40px, because vertical overshoot of a few tens of pixels is dominated by
      // padding and margin arithmetic — a control pass over a screen verified clean by eye
      // reported 29px on a card whose content was visibly inside it, while the poster defect
      // this axis exists to catch measured 61px.
      const over = Math.max(overRight > 8 ? overRight : 0, overBottom > 40 ? overBottom : 0);
      if (over <= 8) continue;
      const key = label(p);
      if (carded.has(key)) continue; // the whole row overflows; report the box once
      carded.add(key);
      out.violations.push({ kind: 'busts-card', container: name,
        side: overBottom > overRight ? 'bottom' : 'right',
        px: Math.round(over), el: label(el) + ' out of ' + key });
    }

    // 7. tiny — type below the readable floor. Opt-in via --min-font, because the floor is a
    //    property of the medium: 13px in a dense console the reader sits 60cm from is normal,
    //    and the same 13px on an image that will be shown 1200px wide in a 390px phone feed
    //    renders at roughly four physical pixels. Nobody reads that; they scroll past.
    //    A number is checkable and an adjective is not — "make the type bigger" was the wish
    //    that produced this rule.
    if (MIN_FONT) {
      const seen = new Set();
      for (const el of kids) {
        if (!ownText(el)) continue;
        const fs2 = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (fs2 && fs2 < MIN_FONT - 0.5) {
          const key = Math.round(fs2) + '|' + el.tagName + '|' + (el.className || '');
          if (seen.has(key)) continue; // one line per distinct offender, not per paragraph
          seen.add(key);
          out.violations.push({ kind: 'tiny', container: name, px: Math.round(MIN_FONT - fs2),
            el: Math.round(fs2) + 'px · ' + label(el) });
        }
      }
    }
  });

  out.errors = (window.__err || []).slice(0, 10);
  const tag = document.createElement('script');
  // The id carries a per-run nonce and the probe clears anything already wearing it. Without
  // that, the page being measured could ship its own <script id="__layout_report"> and the
  // extractor — which took the FIRST match, while the genuine report is appended last — read
  // the page's forgery instead. A file could hand itself a green verdict.
  const REPORT_ID = '__layout_report_%NONCE%';
  document.querySelectorAll('#' + REPORT_ID).forEach((n) => n.remove());
  tag.id = REPORT_ID; tag.type = 'application/json';
  tag.textContent = JSON.stringify(out);
  document.documentElement.appendChild(tag);
};
// A short beat after load, so a page that moves something in its own load handler is not
// measured mid-move. It has to be a timer, not requestAnimationFrame: under
// --virtual-time-budget there is no compositor, rAF never fires, and the report never appears —
// which the harness correctly reported as "NOT checked" rather than as clean. Timers do advance
// with virtual time.
if (document.readyState === 'complete') setTimeout(__run, 60);
else addEventListener('load', () => setTimeout(__run, 60));
})();
</script>`;

// The error trap goes FIRST, ahead of everything: a page that throws is broken even when it
// lays out perfectly. The idea comes from webapp-testing, where the console is read through
// Playwright; catching it inside the page is enough and costs no dependency.
const TRAP = `<script>window.__err=[];
addEventListener('error',e=>__err.push((e.message||'error')+' @ '+(e.filename||'').split('/').pop()+':'+(e.lineno||0)));
addEventListener('unhandledrejection',e=>__err.push('unhandled rejection: '+(e.reason&&e.reason.message||e.reason)));
(c=>{console.error=(...a)=>{__err.push('console.error: '+a.join(' '));c(...a)}})(console.error);
</script>`;

if (!fs.existsSync(target)) {
  console.error(`no such file: ${target}`);
  process.exit(2);
}
const html = fs.readFileSync(target, 'utf8');
// Chrome will not render a CSS viewport narrower than ~504px, in either headless mode, and it
// reports no error: ask for 390 and you silently get 504. Measured 03 Aug — and
// --force-device-scale-factor does not help, since window-size is already in CSS pixels.
// So the ruler must be the width the page ACTUALLY got, never the width we asked for; comparing
// content against 390 while the page laid out at 504 reported a violation on a blank document.
const { width: winW, clamped } = usableWidth(VW);

// One unguessable id per run. A page cannot pre-write an element whose name it cannot know.
const NONCE = crypto.randomUUID().replace(/-/g, '');

const probe = PROBE
  .replace('%NONCE%', NONCE)
  .replace('%CONTAINER%', JSON.stringify(CONTAINER))
  .replace('%MARGIN%', String(MARGIN))
  .replace("%VIEWPORT_W%", String(winW))
  .replace("%MIN_FONT%", String(MIN_FONT));
// Injected before </body> so the page has laid out; if the tag is missing, appended.
let patched = html.includes('</body>') ? html.replace('</body>', probe + '\n</body>') : html + probe;
// The trap is the document's first line: an error thrown before it is installed is invisible.
patched = patched.includes('<head>') ? patched.replace('<head>', '<head>' + TRAP) : TRAP + patched;

// A private directory, not a predictable name in a shared one. os.tmpdir() is world-writable on
// POSIX and a PID is easy to guess, so `/tmp/layout-check-<pid>.html` could be pre-created as a
// symlink pointing at something the operator can write — and writeFileSync follows symlinks.
// render-png.mjs already did this correctly; the checker had not been brought in line.
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-check-'));
const tmp = path.join(work, 'page.html');
fs.writeFileSync(tmp, patched, 'utf8');

const bin = chromePath();
if (!bin) { console.error('Chrome not found. Set CHROME_PATH.'); process.exit(2); }
// A check that quietly ran at a different width than the one requested is the same class of lie
// as a failed read printed as a zero — so the clamp is announced, not hidden.
const profile = path.join(work, 'chrome-profile');
const args = [...baseArgs({ profile, width: winW, height: VH }), '--dump-dom', fileUrl(tmp)];

execFile(bin, args, { maxBuffer: 256 * 1024 * 1024, timeout: 120000 }, (err, stdout) => {
  try { fs.rmSync(work, { recursive: true, force: true }) } catch { /* a temp dir, not worth a throw */ }

  if (err && !stdout) { console.error('could not render:', err.message); process.exit(2); }
  // Match the nonce id, and take the LAST occurrence. The genuine report is appended last, so
  // even a page that somehow guessed the nonce could not get in front of it.
  const re = new RegExp('<script id="__layout_report_' + NONCE + '" type="application/json">([\\s\\S]*?)</script>', 'g');
  const all = [...stdout.matchAll(re)];
  const m = all.length ? all[all.length - 1] : null;
  if (!m) {
    // Silence is not "clean". Say so out loud: an unread state has no right to look like a
    // successful check.
    console.error('the probe returned no report — the page did not finish loading or threw. NOT checked.');
    process.exit(2);
  }
  const report = JSON.parse(m[1]);

  // The scrollbar gutter costs ~18px and is expected; anything wider apart means we measured a
  // page other than the one asked about, and every number below belongs to that other page.
  // Required, not optional. This was `report.measuredWidth || 0` guarded by `if (got && …)`, so
  // a report that simply omitted the field skipped the gate rather than failing it — a falsy
  // guard standing where a required-field check belonged.
  if (typeof report.measuredWidth !== 'number') {
    console.error('the report carries no measured width — NOT checked.');
    process.exit(2);
  }
  const got = report.measuredWidth;
  const wanted = clamped ? CHROME_MIN_WIDTH : VW;
  if (got > wanted + 4 || got < wanted - 24) {
    console.error(`asked for a ${wanted}px viewport, got ${got}px — NOT checked.`);
    process.exit(2);
  }
  if (clamped && !QUIET) {
    console.error(`⚠ ${VW}px requested; checked at ${CHROME_MIN_WIDTH}px — headless Chrome renders no narrower.`);
    console.error('  A true phone width has to be checked in a real browser\'s device mode.');
  }

  if (AS_JSON) { console.log(JSON.stringify(report, null, 1)); process.exit(report.violations.length ? 1 : 0); }

  const byKind = report.violations.reduce((a, v) => ((a[v.kind] ??= []).push(v), a), {});
  const errs = report.errors || [];
  const total = report.violations.length;
  if (!total && !errs.length) {
    if (!QUIET) console.log(`✅ layout clean · containers: ${report.containers} · ${path.basename(target)}`);
    process.exit(0);
  }
  if (errs.length) { console.log(`🔴 the page throws (${errs.length}):`); errs.forEach(e => console.log('   ' + e)); console.log('') }
  console.log(`⚠ violations: ${total} · containers: ${report.containers} · ${path.basename(target)}\n`);
  const titles = { overflow: 'left the container', clipped: 'cut off by its own box', spills: 'text overruns its box', escapes: 'escaped its parent', overlap: 'text collision', margin: 'crowding the edge' };
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`── ${titles[kind] || kind} (${list.length})`);
    for (const v of list.slice(0, 12)) {
      const where = ['overflow', 'clipped', 'escapes', 'spills'].includes(kind) ? `${v.side} +${v.px}px`
        : kind === 'overlap' ? `${v.px}px² with ${v.el2}` : `${v.px}px to edge`;
      console.log(`   ${v.container.padEnd(12)} ${where.padEnd(28)} ${v.el}`);
    }
    if (list.length > 12) console.log(`   … and ${list.length - 12} more`);
    console.log('');
  }
  process.exit(1);
});
