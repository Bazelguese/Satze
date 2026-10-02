import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';
import { buildDuelStepFx, currentStepFx, STEP_FX_TAGS } from './duel/duelStepFx.js';
import { buildDuelVaLedgerRows } from './duel/duelVaLedger.js';
import { countDuelEffectSteps, countDuelPostEffectSteps } from './duel/duelVisualSteps.js';

const baseInput = {
  selectedFocus: 5, enemySelectedFocus: 2, playerHP: 12, enemyHP: 20, playerFocus: 12, enemyFocus: 12,
  playerUsedCards: [], enemyUsedCards: [], isPlayerFirst: true, lastWinner: 'enemy',
  playerArmyBonuses: {}, enemyArmyBonuses: {}, playerToxin: null, enemyToxin: null,
  roundNumber: 3, conqueredFields: {}, playerHand: [], enemyHand: [], currentFieldIndex: 0,
};
const byName = (n) => ALL_AGENTS.find((a) => a.name.startsWith(n));

describe('Regia dei passi sul motore vero', () => {
  it('un riquadro per ogni step animato, con fasci verso bersagli che esistono', () => {
    let checked = 0;
    for (const field of ALL_BATTLEFIELDS) {
      for (let i = 0; i < ALL_AGENTS.length; i += 11) {
        const p = ALL_AGENTS[i];
        const e = ALL_AGENTS[(i * 5 + 7) % ALL_AGENTS.length];
        const { battleResult: br } = computeDuelResolution({ ...baseInput, field, selectedAgent: p, enemyAgent: e });
        const fx = buildDuelStepFx(br);
        const label = `${field.name} · ${p.name} vs ${e.name}`;
        expect(fx.filter((x) => x.phase === 1).length, label).toBe(countDuelEffectSteps(br.visualSteps));
        expect(fx.filter((x) => x.phase === 5).length, label).toBe(countDuelPostEffectSteps(br.visualSteps));
        for (const x of fx) {
          expect(Object.values(STEP_FX_TAGS), label).toContain(x.tag);
          expect(x.src, label).toBeTruthy();
          for (const b of x.beams) {
            if (b.to.ledger) {
              const rows = buildDuelVaLedgerRows(br, b.to.ledger);
              expect(rows.mods[b.to.mod]?.arriveStep, `${label} · step ${x.index}`).toBe(x.index);
            }
          }
          if (x.kind === 'powerBlocked') expect(x.tgt, label).toMatch(/^bloccato da /);
          if (x.kind === 'block') expect(x.burst, label).toBeTruthy();
        }
        checked += fx.length;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('Blocca Potere: fascio verso il Potere avversario, timbro ⊘, poi il Potere bloccato', () => {
    const field = ALL_BATTLEFIELDS[0];
    const blocker = byName('Guardiano dell');
    const victim = byName('Myrkrun-Khal');
    const { battleResult: br } = computeDuelResolution({ ...baseInput, field, selectedAgent: blocker, enemyAgent: victim });
    const fx = buildDuelStepFx(br);
    const block = fx.find((x) => x.kind === 'block');
    expect(block).toMatchObject({ side: 'player', state: 'active', eff: 'Blocca Potere' });
    expect(block.beams[0]).toMatchObject({ from: { card: 'player', row: 'ability' }, to: { card: 'enemy', row: 'ability' } });
    expect(block.burst).toMatchObject({ card: 'enemy', row: 'ability' });
    const blocked = fx.find((x) => x.kind === 'powerBlocked');
    expect(blocked).toMatchObject({ side: 'enemy', tag: 'BLOCCATO' });
    expect(currentStepFx(fx, 1, block.step)).toBe(block);
  });
});
