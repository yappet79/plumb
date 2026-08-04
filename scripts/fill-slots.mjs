#!/usr/bin/env node
/**
 * fill-slots.mjs — drop photographs into marked slots and inline them into the file.
 *
 *   node fill-slots.mjs <file.html> --photos <dir> [--out <file.html>]
 *                       [--quality 74] [--max 1600] [--grayscale]
 *
 * The brief asks engines to mark images as `<img data-slot="hero">` inside a frame that
 * already has its final size and `object-fit: cover`. That way variants can be compared
 * before any image exists, the photographs are prepared once and land identically in every
 * variant — the comparison stays fair and the images are paid for once, not three times.
 *
 * The output file is self-contained: images are base64-inlined. They are compressed to the
 * frame they actually occupy rather than to the size Flux produced — a 1.3MB png becomes
 * about 40KB of jpeg.
 */
import fs from 'node:fs';
import path from 'node:path';

// sharp is optional on purpose. With it, a 1.3MB png becomes ~40KB of jpeg sized to the frame
// it actually occupies. Without it the image is inlined as-is and the file gets heavy — which
// is worse, but still works. A module that dies because one library is missing is worse still,
// and this one resolved from a home directory for a while, which is the "works on my machine"
// trap: on the author's box everything passed, on a fresh clone nothing would.
let sharp = null;
try { sharp = (await import('sharp')).default } catch { /* compression unavailable */ }

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const DIR = arg('--photos');
const OUT = arg('--out', target);
const Q = Number(arg('--quality', '74'));
const MAX = Number(arg('--max', '1600'));
const GRAY = argv.includes('--grayscale');

if (!target || !DIR) {
  console.error('usage: fill-slots.mjs <file.html> --photos <dir> [--out <file.html>] [--quality 74] [--max 1600] [--grayscale]');
  process.exit(2);
}
if (!fs.existsSync(target)) { console.error(`no such file: ${target}`); process.exit(2); }
if (!fs.existsSync(DIR)) { console.error(`no such photo directory: ${DIR}`); process.exit(2); }

let html = fs.readFileSync(target, 'utf8');
const before = Buffer.byteLength(html);

const slots = [...new Set([...html.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]))];
if (!slots.length) { console.log('no slots in this file — nothing to fill'); process.exit(0); }

const files = fs.readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const pick = (slot) => files.find((f) => path.parse(f).name.toLowerCase() === slot.toLowerCase());

let filled = 0; const missing = []; let bytes = 0;
if (!sharp) console.log("note: sharp not installed — images are inlined uncompressed. `npm install sharp` for ~30x smaller files.");

for (const slot of slots) {
  const file = pick(slot);
  if (!file) { missing.push(slot); continue; }
  const src = path.join(DIR, file);
  // Transparency survives or it does not. jpeg has no alpha channel, so a logo or a cut-out
  // shipped as a transparent png comes back as a solid black rectangle — silently, and it looks
  // like a design decision rather than a conversion artefact. Caught 04 Aug 2026 on a government
  // emblem that arrived as a black box on the title slide of a client deck.
  const alpha = sharp ? (await sharp(src).metadata()).hasAlpha === true : false;
  const buf = sharp
    ? await (() => {
      const pipe = sharp(src)
        .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
        .modulate(GRAY ? { saturation: 0 } : {});
      // keep alpha as png; everything else takes the much smaller jpeg
      return alpha ? pipe.png({ compressionLevel: 9 }).toBuffer()
        : pipe.jpeg({ quality: Q, mozjpeg: true }).toBuffer();
    })()
    : fs.readFileSync(src);
  bytes += buf.length;
  const mime = sharp
    ? (alpha ? 'image/png' : 'image/jpeg')
    : `image/${path.extname(src).slice(1).replace('jpg', 'jpeg')}`;
  const uri = `data:${mime};base64,${buf.toString('base64')}`;
  // Replace the src on the tag carrying this slot, leaving its class, alt and frame alone.
  const re = new RegExp(`(<img[^>]*data-slot="${slot}"[^>]*)>`, 'g');
  const had = html.match(re);
  html = html.replace(re, (m, head) => `${head.replace(/\s+src="[^"]*"/, '')} src="${uri}">`);
  if (had) { filled += had.length; console.log(`  ${slot.padEnd(10)} ${file.padEnd(14)} → ${(buf.length / 1024).toFixed(0)} KB ×${had.length}`); }
}

fs.writeFileSync(OUT, html, 'utf8');
const after = Buffer.byteLength(html);
console.log(`\nslots filled: ${filled}/${slots.length} · ${(bytes / 1024).toFixed(0)} KB of images`);
console.log(`file: ${(before / 1024).toFixed(0)} KB → ${(after / 1024 / 1024).toFixed(2)} MB`);
if (missing.length) {
  // An empty slot is a hole in the layout — better known before the review than after.
  console.log(`⚠ left without an image: ${missing.join(', ')} (needs files with those names in ${DIR})`);
  process.exit(1);
}
