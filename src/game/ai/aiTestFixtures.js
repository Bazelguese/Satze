// Helper locali per i test del motore IA

import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { INFORMATION_POLICY } from './aiConstants.js';

export const neutralField =
  ALL_BATTLEFIELDS.find((f) => f.id === 51) ||
  ALL_BATTLEFIELDS.find((f) => f.category === 'neutral') ||
  ALL_BATTLEFIELDS[0];

export function makeCard(overrides = {}) {
  const { id, name, army, league, power, damage, ability, ...rest } = overrides;
  return {
    id: id ?? 9001,
    name: name ?? 'Test Card',
    army: army ?? "Figli dell'Orizzonte",
    league: league ?? 3,
    power: power ?? 3,
    damage: damage ?? 3,
    ability: ability ?? null,
    ...rest,
  };
}

/**
 * Contesto già in forma information-set (senza selectedFocus).
 */
export function makeAIContext(overrides = {}) {
  const playerCard =
    overrides.player?.visibleCard ??
    makeCard({ id: 100, name: 'Player', power: 2, damage: 2, league: 2 });
  const aiCardA = makeCard({ id: 200, name: 'AI-A', power: 4, damage: 4, league: 3 });
  const aiCardB = makeCard({ id: 201, name: 'AI-B', power: 2, damage: 2, league: 2 });

  const isPlayerFirst = overrides.isPlayerFirst !== false;

  const base = {
    difficulty: 'hard',
    mode: 'classic',
    informationPolicy: INFORMATION_POLICY,
    roundNumber: 1,
    lastWinner: null,
    isPlayerFirst,
    currentFieldIndex: 0,
    field: neutralField,
    battlefields: [neutralField],
    conqueredFields: {},
    revealedFields: 1,
    playerFieldsConquered: 0,
    enemyFieldsConquered: 0,
    player: {
      hand: [playerCard, makeCard({ id: 101, name: 'P2', power: 3, damage: 2 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 8,
      focus: 8,
      armyBonuses: {},
      toxin: null,
      visibleCard: isPlayerFirst ? playerCard : null,
    },
    ai: {
      hand: [aiCardA, aiCardB],
      usedCardIds: [],
      hp: 20,
      focusPool: 8,
      focus: 8,
      armyBonuses: {},
      toxin: null,
    },
    campaignDuelMod: null,
  };

  return {
    ...base,
    ...overrides,
    player: {
      ...base.player,
      ...(overrides.player || {}),
      focus: (overrides.player?.focusPool ?? overrides.player?.focus ?? base.player.focusPool),
      focusPool: (overrides.player?.focusPool ?? overrides.player?.focus ?? base.player.focusPool),
    },
    ai: {
      ...base.ai,
      ...(overrides.ai || {}),
      focus: (overrides.ai?.focusPool ?? overrides.ai?.focus ?? base.ai.focusPool),
      focusPool: (overrides.ai?.focusPool ?? overrides.ai?.focus ?? base.ai.focusPool),
    },
  };
}

/** Fixture regressione: 18 FC, 5 carte, round 1. */
export function makeRound1BudgetFixture(difficulty = 'medium') {
  const cards = [1, 2, 3, 4, 5].map((n) =>
    makeCard({
      id: 200 + n,
      name: `AI-${n}`,
      power: n === 1 ? 7 : 3,
      damage: 3,
      league: 3,
      ability:
        n === 1
          ? { trigger: 'imboscata', effect: 'power', value: 2 }
          : null,
    })
  );
  const playerCard = makeCard({ id: 100, name: 'Player', power: 3, damage: 2, league: 2 });

  return makeAIContext({
    difficulty,
    roundNumber: 1,
    isPlayerFirst: true,
    player: {
      hand: [playerCard, makeCard({ id: 101 }), makeCard({ id: 102 }), makeCard({ id: 103 }), makeCard({ id: 104 })],
      usedCardIds: [],
      hp: 20,
      focusPool: 18,
      focus: 18,
      armyBonuses: {},
      toxin: null,
      visibleCard: playerCard,
    },
    ai: {
      hand: cards,
      usedCardIds: [],
      hp: 20,
      focusPool: 18,
      focus: 18,
      armyBonuses: {},
      toxin: null,
    },
  });
}
