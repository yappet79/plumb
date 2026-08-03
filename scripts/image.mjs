#!/usr/bin/env node
/**
 * image.mjs — generate an image through Replicate (Flux) and drop it beside the mockup.
 *
 *   node image.mjs --prompt "..." --out ./shots/hero.png [--model flux-dev] [--ar 16:9] [-n 3]
 *
 * The key is not in the code: it comes from REPLICATE_API_TOKEN, otherwise from the local
 * hook .local-keys.mjs (git-ignored). The module has no account and reaches into none.
 */
import fs from 'node:fs';
import path from 'node:path';


const MODELS = {
  'flux-schnell': 'black-forest-labs/flux-schnell', // fast and cheap, for drafts
  'flux-dev':     'black-forest-labs/flux-dev',     // better and pricier
  'flux-pro':     'black-forest-labs/flux-1.1-pro',
};

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const prompt = arg('--prompt');
const outArg = arg('--out', './image.png');
const model = MODELS[arg('--model', 'flux-schnell')] || arg('--model');
const ar = arg('--ar', '16:9');
const count = parseInt(arg('-n', '1'), 10);

if (!prompt) {
  console.error('usage: image.mjs --prompt "..." --out ./out.png [--model flux-schnell|flux-dev|flux-pro] [--ar 16:9] [-n 3]');
  process.exit(1);
}

// The key must never reach the log, whoever put it there.
const redact = s => String(s).replace(/r8_[A-Za-z0-9]{8,}/g, 'r8_***').replace(/sbp_[A-Za-z0-9]{8,}/g, 'sbp_***');

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
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generate(key, idx) {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ input: { prompt, aspect_ratio: ar, output_format: 'png', num_outputs: 1 } }),
  });
  const body = await res.json();
  if (body.error || res.status >= 400) throw new Error(redact(body.error || body.detail || `HTTP ${res.status}`));

  // Prefer:wait usually returns a finished result, but slow models still need polling.
  let pred = body;
  for (let i = 0; i < 90 && !['succeeded', 'failed', 'canceled'].includes(pred.status); i++) {
    await sleep(2000);
    const p = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${key}` } });
    pred = await p.json();
  }
  if (pred.status !== 'succeeded') throw new Error(redact(`status ${pred.status}: ${pred.error || 'no result'}`));

  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());

  const dir = path.dirname(path.resolve(outArg));
  fs.mkdirSync(dir, { recursive: true });
  const base = path.basename(outArg, path.extname(outArg));
  const file = count > 1
    ? path.join(dir, `${base}-${idx + 1}${path.extname(outArg) || '.png'}`)
    : path.resolve(outArg);
  fs.writeFileSync(file, buf);
  return { file, kb: (buf.length / 1024).toFixed(0) };
}

const key = await resolveKey('REPLICATE_API_TOKEN', 'replicate', 'Replicate — Flux images, Wan video');
console.log(`model: ${model} · ${ar} · variants: ${count}`);
const results = await Promise.all(
  Array.from({ length: count }, (_, i) => generate(key, i).catch(e => ({ error: e.message })))
);
for (const r of results) {
  if (r.error) console.log(`  ✗ ${r.error}`);
  else console.log(`  ✓ ${r.file}  (${r.kb} KB)`);
}
