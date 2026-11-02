import { describe, expect, it } from 'vitest';
import { filterFontFaces } from './captureStyleFilter.js';

const face = (range, tag) =>
  `@font-face { font-family: "Chakra Petch"; src: url(data:font/woff2;base64,${tag}) format("woff2");${
    range ? ` unicode-range: ${range};` : ''
  } }`;

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC';
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+1E00-1E9F';
const THAI = 'U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC';
const CSS = [face(LATIN, 'LATIN'), face(LATIN_EXT, 'EXT'), face(THAI, 'THAI'), face(null, 'NORANGE')].join('\n');
const cps = (str) => new Set([...str].map((c) => c.codePointAt(0)));

describe('filterFontFaces', () => {
  it('tiene solo le facce che coprono almeno un carattere, e quelle senza unicode-range', () => {
    const out = filterFontFaces(CSS, cps('Già è così'));
    expect(out).toContain('LATIN');
    expect(out).not.toContain('EXT');
    expect(out).not.toContain('THAI');
    expect(out).toContain('NORANGE');
  });

  it('un carattere fuori dal latino base porta dentro la sua faccia', () => {
    const out = filterFontFaces(CSS, cps('Łódź'));
    expect(out).toContain('LATIN');
    expect(out).toContain('EXT');
  });

  it('caratteri jolly (U+4??) e insieme non determinabile', () => {
    const css = face('U+4??', 'CYR');
    expect(filterFontFaces(css, cps('Ж'))).toContain('CYR'); // U+0416
    expect(filterFontFaces(css, cps('A'))).not.toContain('CYR');
    expect(filterFontFaces(CSS, null)).toBe(CSS);
  });

  it('unicode-range in forma inattesa: la faccia resta', () => {
    const css = face('qualcosa di strano', 'ODD');
    expect(filterFontFaces(css, cps('A'))).toContain('ODD');
  });
});
