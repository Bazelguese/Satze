import { describe, it, expect } from 'vitest';
import { npcSeatNames } from './seatAI.js';

describe('npcSeatNames', () => {
  it('usa PNG + archetipo quando gli archetipi sono diversi', () => {
    expect(npcSeatNames(['aggressivo', 'calcolatore'])).toEqual(['PNG Assaltatore', 'PNG Calcolatore']);
  });
  it('numera tutti gli archetipi ripetuti', () => {
    expect(npcSeatNames(['equilibrato', 'equilibrato', 'equilibrato'])).toEqual(['PNG Stratega 1', 'PNG Stratega 2', 'PNG Stratega 3']);
    expect(npcSeatNames(['prudente', 'casuale', 'casuale'])).toEqual(['PNG Custode', 'PNG Recluta 1', 'PNG Recluta 2']);
  });
});
