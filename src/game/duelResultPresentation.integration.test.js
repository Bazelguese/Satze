import { describe, it, expect } from 'vitest';
import { computeDuelResolution } from './duelResolve.js';
import { ALL_BATTLEFIELDS } from '../data/battlefields.js';
import { ALL_AGENTS } from '../data/cards.js';
import { applyToxin } from './toxinLogic.js';
import {
  buildDuelStepEffects,
  fcBeforeGains,
  scheduleDuelResultEvents,
  displayedStatAt,
} from './duel/duelResultPresentation.js';
import { hpAfterDuelSteps } from './duel/duelHpPresentation.js';

const baseInput = {
  selectedFocus: 4, enemySelectedFocus: 2, playerHP: 18, enemyHP: 20, playerFocus: 12, enemyFocus: 12,
  playerUsedCards: [], enemyUsedCards: [], isPlayerFirst: true, lastWinner: null,
  playerArmyBonuses: {}, enemyArmyBonuses: {}, playerToxin: null, enemyToxin: null,
  roundNumber: 1, conqueredFields: {}, playerHand: [], enemyHand: [], currentFieldIndex: 0,
};
const byName = (n) => ALL_AGENTS.find((a) => a.name.startsWith(n));

function runAll(br, startToxin = null) {
  const startHP = { player: baseInput.playerHP, enemy: baseInput.enemyHP };
  const finalFC = { player: br.finalPlayerFC, enemy: br.finalEnemyFC };
  const startFC = fcBeforeGains(br, finalFC);
  const plan = scheduleDuelResultEvents(br, { startHP, startFC, startToxin });
  const afterFC = { ...startFC };
  buildDuelStepEffects(br).filter((x) => x.stat === 'FC').forEach((x) => { afterFC[x.side] += x.amount; });
  return {
    plan,
    hp: displayedStatAt(plan.events, 'PV', hpAfterDuelSteps(br, startHP), Infinity),
    fc: displayedStatAt(plan.events, 'FC', afterFC, Infinity),
    finalFC,
  };
}

describe('FC e Tossina nel risultato, sul motore vero', () => {
  it('su tutti i Campi le FC arrivano a quelle del motore, un punto alla volta, solo in aumento', () => {
    for (const field of ALL_BATTLEFIELDS) {
      for (let i = 0; i < ALL_AGENTS.length; i += 13) {
        const p = ALL_AGENTS[i];
        const e = ALL_AGENTS[(i * 5 + 7) % ALL_AGENTS.length];
        const { battleResult: br } = computeDuelResolution({ ...baseInput, field, selectedAgent: p, enemyAgent: e });
        const { plan, fc, finalFC } = runAll(br);
        const label = `${field.name} · ${p.name} vs ${e.name}`;
        if (fcBeforeGains(br, finalFC).player > 0 || finalFC.player === 0) expect(fc.player, label).toBe(finalFC.player);
        if (fcBeforeGains(br, finalFC).enemy > 0 || finalFC.enemy === 0) expect(fc.enemy, label).toBe(finalFC.enemy);
        plan.events.filter((x) => x.stat === 'FC').forEach((x) => expect(x.to - x.from).toBe(1));
      }
    }
  });

  it('Tossina applicata da un Potere: nel passo di quel Potere, verso chi la riceve', () => {
    const untore = byName('Untore Silenzioso');
    const { battleResult: br } = computeDuelResolution({ ...baseInput, enemySelectedFocus: 5, field: ALL_BATTLEFIELDS[0], selectedAgent: untore, enemyAgent: byName('Vega') }); // Opportunista: nemico con 5+ FC
    const tox = buildDuelStepEffects(br).find((x) => x.stat === 'TOX');
    expect(tox, 'evento toxinApplied').toBeTruthy();
    expect(tox.side).toBe('enemy');
    expect(tox.origin).toEqual({ card: 'player' });
    expect(br.visualSteps[tox.stepIndex].side).toBe('player');
    expect(tox.toxin.value).toBeGreaterThan(0);
  });

  it('danno della Tossina di fine turno: stesso risultato di «Continua» (applyToxin), dal segno Tossina', () => {
    const toxin = { value: 2, minHealth: 5, source: 'Prova' };
    for (const field of ALL_BATTLEFIELDS.slice(0, 20)) {
      const { battleResult: br } = computeDuelResolution({ ...baseInput, field, selectedAgent: byName('Vega'), enemyAgent: byName('Sorethai') });
      const { plan, hp } = runAll(br, { player: toxin, enemy: null });
      const ref = applyToxin(br.playerToxinActivated || toxin, br.enemyToxinActivated || null, br.finalPlayerHP, br.finalEnemyHP);
      expect(hp, field.name).toEqual({ player: ref.newPlayerHP, enemy: ref.newEnemyHP });
      const ticks = plan.events.filter((e) => e.cause === 'toxin');
      ticks.forEach((e) => expect(e.origin).toEqual({ toxin: e.side }));
      // arriva dopo tutte le altre raffiche
      const others = plan.events.filter((e) => e.cause !== 'toxin');
      if (ticks.length && others.length) expect(Math.min(...ticks.map((e) => e.t))).toBeGreaterThan(Math.max(...others.map((e) => e.t)));
    }
  });

  it('Tossina applicata a fine duello (Bonus «Conquista: Tossina»): dopo lo scontro, prima del suo danno', () => {
    const bon = { 'Ratti della Megera': true };
    const ratti = ALL_AGENTS.filter((a) => a.army === 'Ratti della Megera');
    let found = null;
    for (const field of ALL_BATTLEFIELDS.slice(0, 15)) {
      for (const p of ratti) {
        const { battleResult: br } = computeDuelResolution({ ...baseInput, roundNumber: 3, selectedFocus: 6, enemySelectedFocus: 1, playerArmyBonuses: bon, field, selectedAgent: p, enemyAgent: byName('Vega') });
        if (br.events.some((e) => e.infoCode === 'toxinApplied' && e.revealAt === 'postFx')) { found = br; break; }
      }
      if (found) break;
    }
    expect(found, 'duello con Tossina di fine duello').toBeTruthy();
    const startHP = { player: baseInput.playerHP, enemy: baseInput.enemyHP };
    const plan = scheduleDuelResultEvents(found, { startHP, startFC: { player: 0, enemy: 0 } });
    const apply = plan.events.find((e) => e.stat === 'TOX');
    expect(apply).toMatchObject({ side: 'enemy', kind: 'tox', origin: { card: 'player' } });
    expect(plan.toxinAppliedAt.enemy.t).toBe(apply.t);
    const damage = plan.events.filter((e) => e.cause === 'damage');
    if (damage.length) expect(apply.t).toBeGreaterThan(Math.max(...damage.map((e) => e.t)));
    plan.events.filter((e) => e.cause === 'toxin').forEach((e) => expect(e.t).toBeGreaterThan(apply.t));
  });
});
