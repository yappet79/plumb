#!/usr/bin/env node
/**
 * theme.mjs — verified palettes, with contrast computed rather than assumed.
 *
 *   node theme.mjs --list             every theme, with a contrast verdict
 *   node theme.mjs --show swiss       token block, ready to paste into a brief
 *   node theme.mjs --check            check them all; exit 1 if any fails
 *
 * Anthropic's `theme-factory` says "watch contrast and readability". That is a wish, not a
 * check: readability is not guaranteed by words. Here the WCAG ratio is computed and a theme
 * either clears the threshold or does not get used.
 *
 * Thresholds (WCAG 2.1):
 *   ink      / bg  >= 7.0  — body text, AAA
 *   ink-soft / bg  >= 4.5  — secondary text, AA
 *   accent   / bg  >= 3.0  — the accent carries large text and graphics, AA large
 *   line     / bg  >= 1.2  — a rule has to be visible without competing with text
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const THEMES = JSON.parse(fs.readFileSync(path.join(__dir, '..', 'themes.json'), 'utf8'));
const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };

const themes = Object.entries(THEMES).filter(([k]) => !k.startsWith('_'));

/* --- WCAG --- */
const srgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lum = (hex) => {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const RULES = [
  ['ink', 'bg', 7.0, 'body text'],
  ['ink-soft', 'bg', 4.5, 'secondary text'],
  ['accent', 'bg', 3.0, 'accent'],
  ['line', 'bg', 1.2, 'rule'],
  ['ink', 'panel', 7.0, 'text on a panel'],
];

function audit(t) {
  return RULES.map(([fg, bg, min, what]) => {
    const r = ratio(t.tokens[fg], t.tokens[bg]);
    return { pair: `${fg}/${bg}`, what, got: Math.round(r * 100) / 100, min, ok: r >= min };
  });
}

/* --- output --- */
if (argv.includes('--check') || argv.includes('--list')) {
  let bad = 0;
  for (const [name, t] of themes) {
    const rows = audit(t);
    const fails = rows.filter((r) => !r.ok);
    if (fails.length) bad++;
    const mark = fails.length ? '✗' : '✓';
    console.log(`${mark} ${name.padEnd(10)} ${t.fonts.display} / ${t.fonts.body}`);
    if (argv.includes('--list')) {
      console.log(`  ${t.about}`);
      console.log('  ' + Object.entries(t.tokens).map(([k, v]) => `${k} ${v}`).join('  ') + '\n');
    }
    for (const f of fails) {
      console.log(`    ${f.pair.padEnd(14)} ${f.got} < ${f.min}   ${f.what} is unreadable`);
    }
  }
  if (argv.includes('--check')) {
    console.log(bad ? `\n${bad} theme(s) fail contrast` : `\nall ${themes.length} themes clear contrast`);
    process.exit(bad ? 1 : 0);
  }
  process.exit(0);
}

const name = arg('--show');
const t = name && THEMES[name];
if (!t) {
  console.error(`usage: theme.mjs --list | --show <${themes.map(([k]) => k).join('|')}> | --check`);
  process.exit(2);
}

// A block for the brief: tokens, not adjectives — the module's rule, learned the hard way.
const fonts = t.fonts.display === t.fonts.body ? t.fonts.body : `${t.fonts.display} / ${t.fonts.body}`;
console.log(`/* theme: ${name} — ${t.about} */
/* type: ${fonts} */
:root {
${Object.entries(t.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')}
}

Do not introduce any colour, font or gradient not listed above.`);

const fails = audit(t).filter((r) => !r.ok);
if (fails.length) {
  console.error(`\n⚠ this theme fails contrast: ${fails.map((f) => `${f.pair} ${f.got}<${f.min}`).join(', ')}`);
  process.exit(1);
}
