#!/usr/bin/env node
/**
 * embed-fonts.mjs — inline Google Fonts so "self-contained" is true rather than nearly true.
 *
 *   node embed-fonts.mjs <file.html> [--out <file.html>] [--subsets latin,latin-ext]
 *
 * Why. The module demands self-contained HTML, and images were genuinely inlined — while the
 * typeface still arrived over a link. A 4.7MB file that breaks without a network. On 01 Aug
 * 2026 that nearly fired at a meetup: no connectivity at the venue means the whole deck falls
 * back to a substitute face, and the slides tuned by hand are the first to break.
 *
 * What it does: finds the `<link>` to fonts.googleapis, fetches the CSS with a browser
 * User-Agent (otherwise Google serves ttf instead of woff2), downloads only the needed
 * subsets, base64-encodes them and replaces the links with inline @font-face. No external
 * font reference survives — and that is verified and reported at the end.
 */
import fs from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = argv.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
const OUT = arg('--out', target);
const SUBSETS = arg('--subsets', 'latin,latin-ext').split(',').map((s) => s.trim());

if (!target) {
  console.error('usage: embed-fonts.mjs <file.html> [--out <file.html>] [--subsets latin,latin-ext]');
  process.exit(2);
}

let html = fs.readFileSync(target, 'utf8');
const before = Buffer.byteLength(html);

// Font links: the css2 request itself and the preconnects sitting beside it.
const cssLinks = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g)];

// `@import url(...)` inside a <style> block is the other way a generator asks for a webfont, and
// it is invisible to a <link> search. Rewriting it to a <link> first means one code path below.
// Caught 04 Aug 2026: two of three engines used @import, this script reported "nothing to inline",
// and both files shipped still depending on the network — the report was reassuring and wrong.
const imports = [...html.matchAll(/@import\s+url\((["']?)(https:\/\/fonts\.googleapis\.com\/css2[^)"']+)\1\)\s*;?/g)];
if (imports.length) {
  for (const m of imports) {
    html = html.replace(m[0], '');
    const link = `<link href="${m[2]}" rel="stylesheet">`;
    html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${link}\n</head>`) : `${link}\n${html}`;
  }
  console.log(`  rewrote ${imports.length} @import to <link> (@import is invisible to a link search)`);
  cssLinks.push(...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g));
}

if (!cssLinks.length) {
  const already = (html.match(/data:font\/woff2/g) || []).length;
  if (already) {
    console.log(`fonts already inlined (${already} faces), no external reference`);
    process.exit(0);
  }
  // Nothing to inline is only good news if nothing was asked for. A stylesheet that names a family
  // it never loads renders in a fallback face on every machine, and looks like a font bug.
  const declared = [...html.matchAll(/font-family:\s*["']?([A-Z][A-Za-z0-9 ]+)["']?/g)]
    .map((m) => m[1].trim())
    .filter((f) => !/^(ui-|system-|sans-serif|serif|monospace|Arial|Helvetica|Georgia|Consolas|Menlo|Monaco)/i.test(f));
  const unloaded = [...new Set(declared)];
  if (unloaded.length) {
    console.error('no webfont reference found, but the stylesheet declares families it never loads:');
    unloaded.forEach((f) => console.error(`  ${f}`));
    console.error('these will silently fall back. Add a <link rel="stylesheet"> for them and re-run.');
    process.exit(1);
  }
  console.log('no Google Fonts link found — nothing to inline');
  process.exit(0);
}

let faces = '';
let bytes = 0;
const kept = [];

for (const [tag, url] of cssLinks) {
  const css = await (await fetch(url.replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();
  // Blocks arrive prefixed by a subset comment: /* latin */ @font-face {...}
  const blocks = css.split('/*').slice(1)
    .map((b) => { const [name, body] = b.split('*/'); return { name: name.trim(), body }; })
    .filter((b) => SUBSETS.includes(b.name));

  for (const b of blocks) {
    const src = b.body.match(/url\((https:[^)]+)\)/);
    const fam = b.body.match(/font-family:\s*'([^']+)'/);
    const wt = b.body.match(/font-weight:\s*([^;]+);/);
    const style = b.body.match(/font-style:\s*([^;]+);/);
    const range = b.body.match(/unicode-range:\s*([^;]+);/);
    if (!src || !fam) continue;
    const buf = Buffer.from(await (await fetch(src[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
    bytes += buf.length;
    kept.push(`${fam[1]} ${wt ? wt[1].trim() : '400'} ${b.name}`);
    faces += `@font-face{font-family:'${fam[1]}';font-style:${style ? style[1].trim() : 'normal'};`
      + `font-weight:${wt ? wt[1].trim() : '400'};font-display:swap;`
      + `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');`
      + (range ? `unicode-range:${range[1].trim()}` : '') + '}\n';
  }
  html = html.replace(tag, '');
}

// preconnect to the font hosts is pointless now — it only hints that we still go out.
html = html.replace(/<link[^>]+rel="preconnect"[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
html = html.includes('</head>')
  ? html.replace('</head>', `<style>\n${faces}</style>\n</head>`)
  : `<style>\n${faces}</style>\n` + html;

fs.writeFileSync(OUT, html, 'utf8');

const leftover = (html.match(/https?:\/\/fonts\.(googleapis|gstatic)\.com/g) || []).length;
const after = Buffer.byteLength(html);
console.log(`faces inlined: ${kept.length} · ${(bytes / 1024).toFixed(0)} KB of fonts`);
console.log(kept.map((k) => '  ' + k).join('\n'));
console.log(`file: ${(before / 1048576).toFixed(2)} → ${(after / 1048576).toFixed(2)} MB`);
console.log(leftover ? `⚠ external font references left: ${leftover}` : '✅ no external font references remain');
process.exit(leftover ? 1 : 0);
