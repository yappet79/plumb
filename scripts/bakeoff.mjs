#!/usr/bin/env node
/**
 * Design bake-off — three models draw the same brief, Danila picks the winner.
 *
 *   node bakeoff.mjs --brief brief.md --out ./run1 [--models luna,sol,terra] [--no-render]
 *
 * Generates in parallel, renders each result headless, checks it against the spec the brief
 * itself declares, and glues one contact sheet so the choice costs a single glance.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromePath, baseArgs, fileUrl } from './lib/chrome.mjs';

const exec = promisify(execFile);

// No secrets in this file — it lives in a repo. Keys come from the environment, and the
// Supabase lookup is only a fallback for when the OpenAI key is not exported directly.

const ENGINES = {
  sol:   { id: 'gpt-5.6-sol',   note: 'builds the application · slow · dense' },
  terra: { id: 'gpt-5.6-terra', note: 'air and findings · takes risks' },
  luna:  { id: 'gpt-5.6-luna',  note: 'speed · clean' },
};

const SYSTEM = `You are a senior product designer who ships production front-end.
You honour a design specification to the letter: exact hex values, exact typeface, exact weights.
Inventing your own palette or typeface when one is given is a failure, however good your taste is.
Density and restraint over decoration. Output raw HTML only — no prose, no markdown fence.`;

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const briefPath = arg('--brief');
const outDir = path.resolve(arg('--out', './design-run'));
// Label becomes a filename — keep it to characters that cannot escape the output directory.
const label = arg('--label', 'design').replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 60) || 'design';
const picked = arg('--models', 'sol,terra,luna').split(',').map(s => s.trim()).filter(Boolean);
const doRender = !argv.includes('--no-render');
// Decks live in 16:9 — rendering them at app height leaves dead space under the slide.
const viewport = arg('--viewport', '1600x1100').replace('x', ',');
const maxTokens = parseInt(arg('--max-tokens', '32000'), 10);

if (!briefPath || !fs.existsSync(briefPath)) {
  console.error('usage: bakeoff.mjs --brief <file.md> --out <dir> [--models sol,terra,luna]');
  process.exit(1);
}
const brief = fs.readFileSync(briefPath, 'utf8');

// A redesign starts from what already exists. The source travels in the prompt but never into
// the spec: its own palette would otherwise be read as "allowed" and the obedience check,
// the whole point of the contact sheet, would pass everything.
const sourcePath = arg('--source');
if (sourcePath && !fs.existsSync(sourcePath)) {
  console.error(`--source not found: ${sourcePath}`);
  process.exit(1);
}
const source = sourcePath ? fs.readFileSync(sourcePath, 'utf8') : '';
const prompt = source
  ? `${brief}\n\n---\n\n## Current implementation — this is the file you are reworking\n\n` +
    `Read it for content, data and product logic. Do not reproduce its styling decisions,\n` +
    `and do not reproduce its application JavaScript — it is not part of what you return.\n\n` +
    `\`\`\`html\n${source}\n\`\`\`\n`
  : brief;

// Described in prose, a reference is just more adjectives. Shown, it is a target.
// Markup references carry exact spacing and type scale; screenshots carry the gestalt.
// Both ride inline — nothing is uploaded anywhere but the model endpoint itself.
const refs = (arg('--ref', '') || '').split(',').map(s => s.trim()).filter(Boolean);
for (const r of refs) {
  if (!fs.existsSync(r)) { console.error(`--ref not found: ${r}`); process.exit(1); }
}
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const isImage = f => !!MIME[path.extname(f).toLowerCase()];

const refMarkup = refs.filter(f => !isImage(f));
const refImages = refs.filter(isImage);

const refText = refMarkup.length
  ? `\n\n---\n\n## Reference designs — this is the visual language to match\n\n` +
    `These are finished screens whose look you are adopting: type scale, spacing, colour,\n` +
    `card and chart treatment. Take the language, not the content.\n\n` +
    refMarkup.map(f => `### Reference: ${path.basename(f)}\n\n\`\`\`html\n${fs.readFileSync(f, 'utf8')}\n\`\`\``).join('\n\n')
  : '';

const fullPrompt = prompt + refText;
const userContent = refImages.length
  ? [{ type: 'text', text: fullPrompt }, ...refImages.map(f => ({
      type: 'image_url',
      image_url: { url: `data:${MIME[path.extname(f).toLowerCase()]};base64,${fs.readFileSync(f).toString('base64')}` },
    }))]
  : fullPrompt;

fs.mkdirSync(outDir, { recursive: true });

/* ---------- the spec, read out of the brief itself ---------- */
function specFromBrief(b) {
  const hexes = [...new Set((b.match(/#[0-9a-fA-F]{6}\b/g) || []).map(h => h.toLowerCase()))];
  const face = (b.match(/Typeface:\s*([A-Za-z0-9 ]+)/i) || [])[1]?.trim();
  const minSize = parseFloat((b.match(/smaller than\s*([0-9.]+)\s*px/i) || [])[1] || '0');
  const maxWeight = parseInt((b.match(/([0-9]{3})\s*is the heaviest weight/i) || [])[1] || '0');
  const banGradient = /not introduce any colou?r, font or gradient/i.test(b);
  return { hexes, face, minSize, maxWeight, banGradient };
}
const SPEC = specFromBrief(brief);

function check(html) {
  const l = html.toLowerCase();
  const used = SPEC.hexes.filter(h => l.includes(h));
  const all = [...new Set(l.match(/#[0-9a-f]{6}\b/g) || [])];
  // With no palette in the brief the model is choosing its own — every hex would read as
  // "stray" and the sheet would cry wolf about the exact thing we asked for.
  const stray = SPEC.hexes.length
    ? all.filter(h => !SPEC.hexes.includes(h) && h !== '#ffffff' && h !== '#000000')
    : [];
  const sizes = (html.match(/font-size:\s*([0-9.]+)px/g) || []).map(s => parseFloat(s.match(/[0-9.]+/)[0]));
  const weights = (html.match(/font-weight:\s*([0-9]{3})/g) || []).map(s => parseInt(s.match(/[0-9]{3}/)[0]));
  const minSize = sizes.length ? Math.min(...sizes) : null;
  const maxWeight = weights.length ? Math.max(...weights) : null;

  // A brief can talk the model into emitting a beacon; the operator opens these files by hand,
  // so any host other than the font CDN has to be visible before the click, not after.
  // w3.org appears as the SVG xmlns declaration, which is an identifier and never fetched.
  // Flagging it cried wolf on every variant that drew a chart — the warning has to stay rare
  // enough to be believed.
  const FONT_HOSTS = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.w3\.org)$/i;
  const hosts = [...new Set(
    [...html.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)].map(m => m[1])
  )].filter(h => !FONT_HOSTS.test(h));
  const activeSinks = [
    /\bfetch\s*\(/i.test(html) && 'fetch',
    /XMLHttpRequest/i.test(html) && 'XHR',
    /sendBeacon/i.test(html) && 'sendBeacon',
    /<iframe/i.test(html) && 'iframe',
    /<script[^>]+src=/i.test(html) && 'external script',
  ].filter(Boolean);

  const flags = [];
  if (hosts.length) flags.push(`WARNING — reaches outside: ${hosts.slice(0, 3).join(' ')}`);
  if (activeSinks.length && hosts.length) flags.push(`active channels: ${activeSinks.join(', ')}`);
  if (SPEC.hexes.length && used.length < SPEC.hexes.length)
    flags.push(`palette ${used.length}/${SPEC.hexes.length}`);
  if (stray.length) flags.push(`stray colours: ${stray.slice(0, 4).join(' ')}${stray.length > 4 ? ` +${stray.length - 4}` : ''}`);
  if (SPEC.face && !new RegExp(SPEC.face, 'i').test(html)) flags.push(`wrong typeface (expected ${SPEC.face})`);
  if (SPEC.minSize && minSize !== null && minSize < SPEC.minSize) flags.push(`type ${minSize}px < ${SPEC.minSize}px`);
  if (SPEC.maxWeight && maxWeight && maxWeight > SPEC.maxWeight) flags.push(`weight ${maxWeight} > ${SPEC.maxWeight}`);
  if (SPEC.banGradient && /gradient/i.test(html)) flags.push('gradient despite the ban');

  return {
    palette: SPEC.hexes.length ? `${used.length}/${SPEC.hexes.length}` : '—',
    stray: stray.length, minSize, maxWeight, flags,
    egress: hosts.length > 0,
    kb: (html.length / 1024).toFixed(0),
  };
}

/* ---------- generation ---------- */
// Never let a key fragment reach a file or the console, whoever put it in the string.
const redact = s => String(s)
  .replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***')
  .replace(/sbp_[A-Za-z0-9]{8,}/g, 'sbp_***')
  .replace(/Bearer\s+[A-Za-z0-9._-]{8,}/gi, 'Bearer ***');

// The key belongs to whoever runs this. Order: environment variable → local hook
// .local-keys.mjs beside the skill (git-ignored, everyone has their own) → a clear refusal.
// The module holds no address of anyone's vault, and must not.
async function resolveKey(envName, service, human) {
  if (process.env[envName]) return process.env[envName];
  try {
    const hook = await import(new URL('../.local-keys.mjs', import.meta.url));
    const k = await hook.getKey(service);
    if (k) return k;
  } catch { /* no hook — that is normal */ }
  console.error(`
You need your own key: ${human}

  PowerShell:  $env:${envName} = "..."
  bash:        export ${envName}=...

This module calls paid APIs — your key, your bill. Nothing is spent until you set one.
`);
  process.exit(2);
}
async function draw(name, key) {
  const eng = ENGINES[name];
  if (!eng) return { name, error: `unknown engine ${name}` };
  const t0 = Date.now();
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: eng.id,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userContent }],
        // A long deck or a full app screen can outgrow the default; truncation arrives as a
        // half-written file, which reads like a bad design rather than a hit ceiling.
        max_completion_tokens: maxTokens,
      }),
    });
    const d = await r.json();
    // Provider error text lands in the contact sheet and stdout; auth failures echo the key back.
    if (d.error) return { name, error: redact(d.error.message) };
    const html = (d.choices?.[0]?.message?.content || '').replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim();
    if (!html) return { name, error: 'empty response' };
    const file = path.join(outDir, `${label}-${name}.html`);
    fs.writeFileSync(file, html);
    const cost = (d.usage.prompt_tokens * 2.5 / 1e6 + d.usage.completion_tokens * 10 / 1e6);
    return { name, file, html, secs: Math.round((Date.now() - t0) / 1000), cost, ...check(html) };
  } catch (e) {
    return { name, error: redact(String(e)) };
  }
}

/* ---------- headless render ---------- */
// The page we render is written by a model that was told to follow the brief to the letter, so a
// brief carrying injected instructions yields a page carrying injected script. Measured 28 Jul:
// JS does execute here, and an unguarded render did reach an outside host (img beacon + fetch).
// Two guards, both verified to leave the render byte-identical:
//   - host-resolver blackhole, so nothing but the font CDN can be reached
//   - a throwaway profile, so the payload never touches the operator's cookie jar
async function shoot(r) {
  const bin = chromePath();
  if (!bin || r.error) return null;
  const png = path.join(outDir, `shot-${label}-${r.name}.png`);
  // One profile per variant: the shots run in parallel and Chrome locks its user-data-dir,
  // so a shared path let exactly one screenshot through and silently dropped the rest.
  const profile = path.join(outDir, `.chrome-profile-${r.name}`);
  try {
    const [vw, vh] = viewport.split(',').map(Number);
    await exec(bin, [
      ...baseArgs({ profile, width: vw, height: vh, timeBudgetMs: 9000 }),
      `--screenshot=${String(png).replace(/\\/g, '/')}`,
      fileUrl(r.file),
    ], { timeout: 90000 });
    if (fs.existsSync(png)) return path.basename(png);
    console.error(`  ⚠ ${r.name}: Chrome exited without writing a screenshot — the contact sheet will show this variant without a preview.`);
    return null;
  } catch (e) {
    // Swallowing this made a failed render look identical to a variant that simply had no
    // preview: the contact sheet came back with a hole in it and nothing said why. Same class
    // as marking a job done because the extraction returned nothing — a failed read must not
    // wear the shape of a real answer.
    console.error(`  ⚠ ${r.name}: screenshot failed — ${redact(e.message)}`);
    return null;
  }
}

/* ---------- contact sheet ---------- */
// Model output and API error strings land in this page — escape everything that is not ours.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function contactSheet(rows) {
  const card = r => {
    if (r.error) return `<div class="c bad"><h2>${esc(r.name)}</h2><p class="err">${esc(r.error)}</p></div>`;
    const flags = r.flags.length
      ? `<ul class="fl">${r.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : `<p class="ok">brief executed without deviation</p>`;
    // Opening a variant runs its JS in the real browser — warn before the click, not after.
    const danger = r.egress
      ? `<p class="danger">This variant reaches outside. Read the source before opening it in a browser.</p>`
      : '';
    return `<div class="c${r.egress ? ' warn' : ''}">
      <h2>${esc(r.name)} <span class="note">${esc(ENGINES[r.name].note)}</span></h2>
      ${danger}
      <a href="${path.basename(r.file)}" target="_blank">${r.shot
        ? `<img src="${r.shot}" alt="${r.name}">`
        : `<div class="noimg">render failed — open the html</div>`}</a>
      <div class="m"><b>${r.palette}</b> palette · <b>${r.stray}</b> stray · ${r.kb} KB · ${r.secs}s · $${r.cost.toFixed(3)}</div>
      ${flags}
      <a class="open" href="${path.basename(r.file)}" target="_blank">open this variant →</a>
    </div>`;
  };
  return `<meta charset="utf-8"><title>${label} — pick a variant</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box;margin:0;padding:0}
 body{font-family:Inter,system-ui,sans-serif;background:#fbfbfb;color:#292d34;font-size:14px;padding:32px}
 h1{font-size:20px;font-weight:600;margin-bottom:4px}
 .sub{color:#656f7d;margin-bottom:24px}
 .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px}
 .c{background:#fff;border:1px solid #e6e6ea;border-radius:8px;padding:16px}
 .c.bad{border-color:#c63c3c}
 .c.warn{border-color:#f1ac2b;border-width:2px}
 .danger{background:#fdf4e3;color:#8a5316;border-radius:6px;padding:8px 10px;margin-bottom:10px}
 h2{font-size:15px;font-weight:600;margin-bottom:10px}
 .note{font-weight:400;color:#767c86;font-size:12px;margin-left:6px}
 img{width:100%;border:1px solid #e6e6ea;border-radius:6px;display:block}
 .noimg{padding:40px;text-align:center;color:#767c86;background:#f4f4f6;border-radius:6px}
 .m{margin-top:10px;color:#656f7d;font-variant-numeric:tabular-nums}
 .m b{color:#292d34;font-weight:600}
 .ok{margin-top:8px;color:#00ba85}
 .fl{margin-top:8px;list-style:none}
 .fl li{color:#c63c3c;padding-left:14px;position:relative}
 .fl li:before{content:"!";position:absolute;left:2px;font-weight:600}
 .err{color:#c63c3c}
 .open{display:inline-block;margin-top:12px;color:#7865f2;text-decoration:none;font-weight:500}
</style>
<h1>${label} — three variants</h1>
<p class="sub">The marks under each card are about obedience to the brief and nothing else. They say nothing about taste — the offender may well be the best one. Choose with your eyes.</p>
<div class="grid">${rows.map(card).join('')}</div>`;
}

/* ---------- run ---------- */
let key;
try {
  key = await resolveKey('OPENAI_API_KEY', 'openai', 'OpenAI — the three drawing engines');
} catch (e) {
  console.error(`\n  ${e.message}\n`);
  console.error('  PowerShell:  $env:OPENAI_API_KEY = "sk-..."');
  console.error('  bash:        export OPENAI_API_KEY=sk-...\n');
  process.exit(1);
}
console.log(`brief: ${path.basename(briefPath)}  ·  engines: ${picked.join(', ')}`);
if (source) console.log(`source: ${path.basename(sourcePath)} — ${(source.length / 1024).toFixed(0)} KB into the prompt (not into the spec)`);
if (refs.length) console.log(`references: ${refMarkup.length} as markup, ${refImages.length} as image — ${refs.map(f => path.basename(f)).join(', ')}`);
if (SPEC.hexes.length) console.log(`spec: ${SPEC.hexes.length} colours, typeface ${SPEC.face || '—'}, type ≥${SPEC.minSize || '—'}px, weight ≤${SPEC.maxWeight || '—'}`);
console.log('drawing in parallel…\n');

const results = await Promise.all(picked.map(n => draw(n, key)));
if (doRender) {
  await Promise.all(results.map(async r => { r.shot = await shoot(r); }));
}

for (const r of results) {
  if (r.error) { console.log(`  ✗ ${r.name}: ${r.error}`); continue; }
  const verdict = r.flags.length ? `⚠ ${r.flags.join('; ')}` : '✓ clean';
  console.log(`  ${r.name.padEnd(6)} ${String(r.palette).padStart(6)} palette · ${String(r.kb).padStart(3)} KB · ${String(r.secs).padStart(3)}s · $${r.cost.toFixed(3)}  ${verdict}`);
}

const sheet = path.join(outDir, 'contact.html');
fs.writeFileSync(sheet, contactSheet(results));
const spent = results.reduce((s, r) => s + (r.cost || 0), 0);
console.log(`\ntotal $${spent.toFixed(3)}`);
console.log(`contact sheet: ${sheet}`);
