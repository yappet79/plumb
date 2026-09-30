#!/usr/bin/env node
/**
 * record-frames.mjs — record a time-driven animated page as numbered PNG frames, for a video.
 *
 *   node record-frames.mjs <page.html> --out <dir> [--size 1080x1350] [--fps 30] [--from 0] [--to 10000]
 *   ffmpeg -framerate 30 -i <dir>/f%05d.png -c:v libx264 -pix_fmt yuv420p out.mp4
 *
 * The page contract: it exposes `window.__render(ms)`, which draws the scene at that moment and nothing else, and it
 * renders a still (no clock of its own) when opened with `?still`. Every frame is `__render(ms)` followed by a
 * screenshot over the DevTools protocol, so there is no race with the animation and no scrolling: the same file gives
 * the same frames every time. A page without `__render` is refused with the reason, not recorded as blank frames.
 *
 * Born as a one-off recorder for one animated scene (29 Sep 2026) and lifted here the next day so every animated deck
 * has it. Chrome starts through lib/chrome.mjs like the other scripts: its own profile, the network blackhole, the
 * renderer sandbox on — minus --virtual-time-budget, which hung the DevTools session with no frame at all (measured).
 * Node 22+ (global WebSocket), no npm deps.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromePath, baseArgs, fileUrl } from './lib/chrome.mjs';

/** argv (without node and the script) → { page, out, width, height, fps, from, to, frames } or { error }. */
export function parseRecordArgs(argv) {
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const page = argv.find((a, i) => /\.html?$/i.test(a) && !String(argv[i - 1] ?? '').startsWith('--'));
  const out = arg('--out');
  if (!page) return { error: 'нужна страница: <page.html>' };
  if (!out) return { error: 'нужна папка кадров: --out <dir>' };
  const m = /^(\d+)x(\d+)$/.exec(arg('--size', '1080x1350'));
  if (!m) return { error: '--size пишется как 1080x1350' };
  const fps = Number(arg('--fps', '30')), from = Number(arg('--from', '0')), to = Number(arg('--to', '10000'));
  if (!(fps > 0 && fps <= 120)) return { error: '--fps от 1 до 120' };
  if (!(Number.isFinite(from) && Number.isFinite(to) && to > from && from >= 0)) return { error: '--to должен быть больше --from' };
  return { page, out, width: Number(m[1]), height: Number(m[2]), fps, from, to, frames: Math.round(((to - from) / 1000) * fps) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function record(a) {
  const exe = chromePath();
  if (!exe) throw new Error('Chrome не найден (CHROME_PATH)');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'plumb-rec-'));
  // --virtual-time-budget is for one-shot captures; under the DevTools protocol the frames are driven by __render(ms)
  const flags = baseArgs({ profile, width: a.width, height: a.height }).filter((f) => !f.startsWith('--virtual-time-budget'));
  const chrome = spawn(exe, [...flags, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
  try {
    // port 0: Chrome picks a free port and writes it into the profile — no clash with another run
    let port = null;
    for (let i = 0; i < 50 && !port; i++) {
      try { port = Number(fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]) || null; } catch { await sleep(200); }
    }
    if (!port) throw new Error('Chrome не открыл порт отладки');
    let list = null;
    for (let i = 0; i < 25 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); } }
    const target = list?.find((p) => p.type === 'page');
    if (!target) throw new Error('нет вкладки для записи');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: a.width, height: a.height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${fileUrl(path.resolve(a.page))}?still&t=0` });
    await sleep(1500);
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => document.fonts.size)', awaitPromise: true });
    const has = await send('Runtime.evaluate', { expression: 'typeof window.__render' });
    if (has.result.value !== 'function') throw new Error('у страницы нет window.__render(ms): записывать нечего, кадры были бы пустыми');

    fs.mkdirSync(a.out, { recursive: true });
    const t0 = Date.now();
    for (let f = 0; f < a.frames; f++) {
      await send('Runtime.evaluate', { expression: `window.__render(${a.from + (f * 1000) / a.fps})` });
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: a.width, height: a.height, scale: 1 } });
      fs.writeFileSync(path.join(a.out, `f${String(f).padStart(5, '0')}.png`), Buffer.from(shot.data, 'base64'));
      if (f % 150 === 0) console.log(`frame ${f}/${a.frames} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    console.log(`done: ${a.frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${a.out}`);
    ws.close();
  } finally {
    chrome.kill();
    await sleep(1500); // Chrome holds the profile until it exits
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* a temp folder; the system clears it */ }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = parseRecordArgs(process.argv.slice(2));
  if (a.error) { console.error(`record-frames: ${a.error}`); process.exit(2); }
  record(a).catch((e) => { console.error(`record-frames: ${e.message}`); process.exit(1); });
}
