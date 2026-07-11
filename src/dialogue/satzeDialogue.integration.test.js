import { describe, expect, it } from 'vitest';
import { tokenizeDialogueText } from './satzeDialogue.js';

describe('satzeDialogue markup', () => {
  it('enfasi *parola* senza asterisco orfano nel testo mostrato', () => {
    const text = 'Sono il *sale* della terra.';
    const toks = tokenizeDialogueText(text, 'glitch', false);
    const rendered = toks.map((t) => t.ch).join('');
    expect(rendered).toBe('Sono il sale della terra.');
    expect(rendered).not.toContain('*');
    expect(toks.filter((t) => t.ch === 's' && t.fx === 'glitch').length).toBeGreaterThan(0);
  });

  it('frase intera *ENFASI* animata', () => {
    const text = '*COME OSI VOLTARMI LE SPALLE!*';
    const toks = tokenizeDialogueText(text, 'glitch', false);
    expect(toks.every((t) => t.fx === 'glitch')).toBe(true);
    expect(toks.map((t) => t.ch).join('')).toBe(
      'COME OSI VOLTARMI LE SPALLE!'
    );
  });
});
