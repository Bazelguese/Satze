import { describe, expect, it, vi } from 'vitest';
import {
  buildDialogueDuelArmyChoices,
  buildDialogueDuelShuffleChoices,
  isMenuFollowUpPicker,
} from './devDialogueDuelMenu.js';
import { SHUFFLE_STYLE_OPTIONS } from './shuffleStylePreference.js';

describe('devDialogueDuelMenu', () => {
  it('armata ritorna picker mischia (follow-up sincrono)', () => {
    const launch = vi.fn();
    const armies = buildDialogueDuelArmyChoices(['Corte Rossa'], launch);
    const followUp = armies[0].onClick();

    expect(isMenuFollowUpPicker(followUp)).toBe(true);
    expect(followUp.title).toContain('Mischia');
    expect(followUp.options).toHaveLength(SHUFFLE_STYLE_OPTIONS.length);
  });

  it('mischia avvia duello con armata scelta', () => {
    const launch = vi.fn();
    const shuffles = buildDialogueDuelShuffleChoices('Corte Rossa', launch);

    shuffles[0].onClick();
    expect(launch).toHaveBeenCalledWith('Corte Rossa', SHUFFLE_STYLE_OPTIONS[0].key);
  });
});
