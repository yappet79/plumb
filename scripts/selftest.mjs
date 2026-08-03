#!/usr/bin/env node
/**
 * selftest.mjs — does the checker still catch what it used to catch?
 *
 *   node scripts/selftest.mjs
 *
 * Every rule in check-layout.mjs was written because something shipped broken. Nothing until now
 * stopped a later edit from quietly undoing one: the module was checked, not tested, and the
 * checking lived in whoever remembered to re-run it.
 *
 * So: one fixture per rule, each the smallest page that triggers exactly that rule, plus a
 * control that must stay clean. A rule that stops firing on its fixture is a regression. A rule
 * that fires on the control is noise, which is the more expensive failure of the two — a checker
 * people stop believing is worse than no checker.
 *
 * Exit 0 all pass · 1 a regression · 2 could not run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fixtures = path.join(root, 'fixtures');
const checker = path.join(here, 'check-layout.mjs');

// what each fixture must produce: the rule name check-layout prints, and the viewport to use
const CASES = [
  { file: 'clean.html',             expect: null,                viewport: '1200x800' },
  { file: 'offscreen.html',         expect: 'offscreen',         viewport: '1200x800' },
  { file: 'busts-card-right.html',  expect: 'busts-card',        viewport: '1200x800' },
  { file: 'busts-card-bottom.html', expect: 'busts-card',        viewport: '1200x800' },
  { file: 'text-overlap.html',      expect: 'overlap',           viewport: '1200x800' },
  { file: 'covered.html',           expect: 'covered',           viewport: '1200x800' },
  { file: 'clipped.html',           expect: 'clipped',           viewport: '1200x800' },
  { file: 'js-error.html',          expect: 'js',                viewport: '1200x800' },
  // The page ships its own report claiming to be clean. If the forgery wins, this reports
  // nothing and the test fails — which is the point.
  { file: 'forged-report.html',     expect: 'overflow',          viewport: '1200x800' },
  { file: 'tiny-type.html',         expect: 'tiny',              viewport: '1200x800', args: ['--min-font', '16'] },
];

if (!fs.existsSync(fixtures)) {
  console.error(`no fixtures directory at ${fixtures} — run: node fixtures/make.mjs`);
  process.exit(2);
}

// The checker reports rule names in its own words ("cut off by its own box"), so match on the
// JSON instead of the prose: --json gives the machine-readable kinds, which is what a test wants.
async function run(c) {
  const args = [checker, path.join(fixtures, c.file), '--container', '.frame',
    '--viewport', c.viewport, '--json', ...(c.args || [])];
  try {
    const { stdout } = await exec(process.execPath, args, { maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
    return JSON.parse(stdout);
  } catch (e) {
    // exit 1 means violations found — expected for every fixture but the control, and execFile
    // treats a non-zero exit as a throw. The report is still on stdout.
    if (e.stdout) { try { return JSON.parse(e.stdout) } catch { /* fall through */ } }
    throw new Error(`${c.file}: ${e.message.split('\n')[0]}`);
  }
}

const pad = (s, n) => String(s).padEnd(n);
let failed = 0;

for (const c of CASES) {
  if (!fs.existsSync(path.join(fixtures, c.file))) {
    console.log(`${pad(c.file, 26)} SKIP  (missing — run fixtures/make.mjs)`);
    continue;
  }
  let report;
  try { report = await run(c); }
  catch (e) { console.log(`${pad(c.file, 26)} ERROR ${e.message}`); failed++; continue; }

  const kinds = new Set((report.violations || []).map((v) => v.kind));
  const hasJsError = (report.errors || []).length > 0;

  if (c.expect === null) {
    // The control. Any finding here is a false positive, and those are the expensive kind.
    const ok = kinds.size === 0 && !hasJsError;
    console.log(`${pad(c.file, 26)} ${ok ? 'ok    clean, as it must be' : 'FAIL  ' + [...kinds].join(', ') + (hasJsError ? ' +js' : '')}`);
    if (!ok) failed++;
  } else if (c.expect === 'js') {
    console.log(`${pad(c.file, 26)} ${hasJsError ? 'ok    js error caught' : 'FAIL  the page threw and nothing noticed'}`);
    if (!hasJsError) failed++;
  } else {
    const ok = kinds.has(c.expect);
    console.log(`${pad(c.file, 26)} ${ok ? `ok    ${c.expect}` : `FAIL  expected ${c.expect}, got ${[...kinds].join(', ') || 'nothing'}`}`);
    if (!ok) failed++;
  }
}

console.log('');
if (failed) {
  console.log(`${failed} regression(s). A rule that stopped firing is a rule that stopped protecting anything.`);
  process.exit(1);
}
console.log(`${CASES.length} checks passed.`);
