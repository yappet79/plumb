/**
 * lib/chrome.mjs — one place that knows how to start Chrome.
 *
 * Three scripts drove Chrome and each carried its own copy of the launch code. That is not a
 * style complaint; it cost two live defects in a single day:
 *
 *   1. The viewport clamp. Chrome will not lay out a CSS viewport narrower than ~504px and says
 *      nothing about it. Found and fixed in check-layout.mjs in the morning; still live in
 *      render-png.mjs that evening, where it was worse — the page was laid out at 500px and the
 *      result SCALED DOWN into the 390px image that was asked for, so the file came out the
 *      right size with the wrong layout inside it.
 *   2. The network blackhole. bakeoff.mjs and render-png.mjs blocked outbound requests from a
 *      page written by a model; check-layout.mjs, which injects a probe and executes that same
 *      page, did not.
 *
 * Importing a sibling file costs nothing here — it is a relative import, not a dependency. Any
 * single script still runs from a fresh clone with no install step.
 */
import fs from 'node:fs';

/** Chrome refuses a CSS viewport narrower than this, in both headless modes, silently. */
export const CHROME_MIN_WIDTH = 504;

/**
 * Where Chrome lives. CHROME_PATH wins, so a fork on an unusual setup has one thing to set.
 * Returns null rather than exiting: the caller decides whether Chrome is required or optional.
 */
export function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find((p) => { try { return fs.existsSync(p) } catch { return false } }) || null;
}

/**
 * The width Chrome will actually give you, and whether it differs from the one requested.
 * Callers must say so out loud when it does — a measurement taken at a width nobody asked for
 * is the same class of lie as a failed read printed as a zero.
 */
export function usableWidth(requested) {
  const clamped = requested < CHROME_MIN_WIDTH;
  return { width: clamped ? CHROME_MIN_WIDTH : requested, clamped };
}

/**
 * Flags every headless run here needs.
 *
 * `profile` is mandatory and must be unique per concurrent run: Chrome locks its user-data-dir,
 * and three parallel screenshots sharing one path let exactly one through — silently, with no
 * error. That was a real bug on 29 Jul.
 *
 * The resolver blackhole is not optional either. Measured 28 Jul: a page rendered from an
 * unaudited brief did reach an outside host — an image beacon and a fetch. Only the font CDN
 * resolves. Verified to leave the render byte-identical.
 */
export function baseArgs({ profile, width, height, timeBudgetMs = 4000 }) {
  if (!profile) throw new Error('baseArgs: a unique profile path is required');
  return [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--disable-extensions', '--disable-sync',
    `--user-data-dir=${String(profile).replace(/\\/g, '/')}`,

    // Nothing but the font CDN is reachable. A security review argued this covers hostnames
    // only — that a literal address needs no resolving and would sail through, letting a page
    // reach services on the operator's own machine. It was a reasonable argument and it is
    // wrong: measured 03 Aug against a real local listener, with a control run to prove the
    // test could see the channel at all. Unrestricted Chrome hit the server; this rule blocked
    // it. Chrome routes IP literals through the host resolver too.
    //
    // A proxy layer was added on that argument and removed again when the measurement came
    // back. Defence that a test says does nothing is not defence, it is another thing to break.
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE fonts.googleapis.com, EXCLUDE fonts.gstatic.com',

    ...sandboxArgs(),
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${timeBudgetMs}`,
  ];
}

/**
 * The renderer sandbox stays ON.
 *
 * `--no-sandbox` used to be in the list unconditionally, and nothing here needs it: no root, no
 * container. It only matters once a renderer memory-safety bug fires — at which point it is the
 * difference between one bug and two, on a machine holding the operator's keys. Cheap to keep,
 * expensive to have given away by default.
 *
 * If a CI image genuinely cannot run the sandbox, opt in loudly rather than shipping it off for
 * everyone.
 */
function sandboxArgs() {
  if (process.env.PLUMB_NO_SANDBOX !== '1') return [];
  console.error('⚠ PLUMB_NO_SANDBOX=1 — Chrome is running without its renderer sandbox.');
  console.error('  Only do this where the sandbox cannot run at all, and not on a machine you keep keys on.');
  return ['--no-sandbox'];
}

/** file:// URL for a local path, with Windows backslashes normalised. */
export const fileUrl = (p) => 'file:///' + String(p).replace(/\\/g, '/');
