#!/usr/bin/env node
/**
 * pptx-check.mjs — structural check of a .pptx without PowerPoint and without LibreOffice.
 *
 *   node pptx-check.mjs <deck.pptx> [--min-font 12]
 *
 * A pptx is a zip of XML, so it is checked the same way we read someone else's deck:
 * unzip and parse ppt/slides/slideN.xml.
 *
 * What is checked:
 *   1. the canvas is wide (13.333x7.5in) — LAYOUT_16x9 gives the small 10x5.625in one and
 *      that is the most common silent pptxgenjs mistake;
 *   2. no empty slides — each carries text;
 *   3. type is not below the floor (OOXML sizes are in hundredths: sz="1200" = 12pt);
 *   4. every slide carries at least one visual element, not only text;
 *   5. no frame runs off the canvas.
 *
 * Exit: 0 clean · 1 violations · 2 could not check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--') && /\.pptx$/i.test(a));
const MIN_FONT = Number((argv.indexOf('--min-font') >= 0 ? argv[argv.indexOf('--min-font') + 1] : 12));

if (!target) { console.error('usage: pptx-check.mjs <deck.pptx> [--min-font 12]'); process.exit(2); }
if (!fs.existsSync(target)) { console.error(`no such file: ${target}`); process.exit(2); }

// Unzipping through PowerShell — no external dependency on Windows; elsewhere we use unzip
// when it is available.
//
// The paths travel in the ENVIRONMENT, never inside the command string. `execFileSync` with an
// argv array protects the argv boundary and nothing more: argv[2] here is itself a script that
// PowerShell parses, so interpolating a path into it made the filename executable. A single
// quote, a semicolon and a parenthesis are all legal in a Windows filename, `path.resolve`
// escapes none of them, and the only filter is the `.pptx` extension — which a payload
// satisfies. A deck named
//     Q3 review');<command>;('x.pptx
// closed the string literal, ran whatever came next as the operator, and then failed in a way
// that reads exactly like an ordinary corrupt archive, because `stdio: 'pipe'` swallows the
// output and the catch below prints "could not unpack".
//
// This is the whole point of the tool: it reads a deck somebody else made and sent you, so the
// filename is chosen by the sender. Found 03 Aug by two independent review passes.
const tmp = path.join(path.dirname(target), `.unpack-${process.pid}`);
fs.mkdirSync(tmp, { recursive: true });
try {
  if (process.platform === 'win32') {
    execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      '$ErrorActionPreference = "Stop";' +
      'Add-Type -AssemblyName System.IO.Compression.FileSystem;' +
      '[System.IO.Compression.ZipFile]::ExtractToDirectory($env:PLUMB_ZIP_SRC, $env:PLUMB_ZIP_DST)'],
      { stdio: 'pipe', env: { ...process.env, PLUMB_ZIP_SRC: path.resolve(target), PLUMB_ZIP_DST: path.resolve(tmp) } });
  } else {
    execFileSync('unzip', ['-q', '-o', target, '-d', tmp], { stdio: 'pipe' });
  }
} catch (e) {
  console.error('could not unpack the pptx:', (e.stderr || e.message).toString().slice(0, 200));
  process.exit(2);
}

const read = (p) => fs.readFileSync(path.join(tmp, p), 'utf8');
const problems = [];

// 1. canvas
const pres = read('ppt/presentation.xml');
const sz = pres.match(/sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
const [cx, cy] = sz ? [Number(sz[1]), Number(sz[2])] : [0, 0];
const WIDE = cx >= 12000000;
if (!WIDE) problems.push(`canvas ${(cx / 914400).toFixed(2)}x${(cy / 914400).toFixed(2)}in — that is the narrow LAYOUT_16x9; LAYOUT_WIDE 13.33x7.5in is required`);

// 2-5. slides
const dir = path.join(tmp, 'ppt', 'slides');
const slides = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^slide\d+\.xml$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])) : [];
if (!slides.length) problems.push('no slides at all');

let tiny = 0, mute = 0, plain = 0, spill = 0;
for (const f of slides) {
  const x = read(path.join('ppt', 'slides', f));
  const n = f.match(/\d+/)[0];

  const texts = [...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (!texts.length) { problems.push(`slide ${n}: not a single line of text`); mute++; }

  for (const m of x.matchAll(/sz="(\d+)"/g)) {
    const pt = Number(m[1]) / 100;
    if (pt > 0 && pt < MIN_FONT) { problems.push(`slide ${n}: type ${pt}pt below ${MIN_FONT}pt`); tiny++; break; }
  }

  // a visual element: a shape with geometry, a picture or a chart
  const hasVisual = /<p:pic\b/.test(x) || /<a:prstGeom prst="(?!rect")/.test(x) || /graphicFrame/.test(x)
    || (x.match(/<p:sp>/g) || []).length > texts.length;
  if (!hasVisual) { problems.push(`slide ${n}: text only, not one visual element`); plain++; }

  // frames outside the canvas
  for (const m of x.matchAll(/<a:off x="(-?\d+)" y="(-?\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/g)) {
    const [ox, oy, w, h] = [1, 2, 3, 4].map((i) => Number(m[i]));
    if (cx && (ox + w > cx + 9144 || oy + h > cy + 9144 || ox < -9144 || oy < -9144)) {
      problems.push(`slide ${n}: a frame runs off the canvas by ${(Math.max(ox + w - cx, oy + h - cy) / 914400).toFixed(2)}in`);
      spill++; break;
    }
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`${path.basename(target)} · slides ${slides.length} · canvas ${(cx / 914400).toFixed(2)}x${(cy / 914400).toFixed(2)}in`);
if (!problems.length) { console.log('✅ structure clean'); process.exit(0); }
console.log(`⚠ findings: ${problems.length}`);
for (const p of problems.slice(0, 20)) console.log('   ' + p);
if (problems.length > 20) console.log(`   … and ${problems.length - 20} more`);
console.log(`\nno visual check: needs LibreOffice — soffice --headless --convert-to pdf "${target}"`);
process.exit(1);
