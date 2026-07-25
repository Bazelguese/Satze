// Helper locali per i test del motore IA

import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';

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

export function makeAIContext(overrides = {}) {
  const playerCard =
    overrides.player?.selectedCard ??
    makeCard({ id: 100, name: 'Player', power: 2, damage: 2, league: 2 });
  const aiCardA = makeCard({ id: 200, name: 'AI-A', power: 4, damage: 4, league: 3 });
  const aiCardB = makeCard({ id: 201, name: 'AI-B', power: 2, damage: 2, league: 2 });

  const base = {
    difficulty: 'hard',
    mode: 'classic',
    roundNumber: 1,
    lastWinner: null,
    isPlayerFirst: true,
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
      focus: 8,
      armyBonuses: {},
      toxin: null,
      selectedCard: playerCard,
      selectedFocus: 2,
    },
    ai: {
      hand: [aiCardA, aiCardB],
      usedCardIds: [],
      hp: 20,
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
    },
    ai: {
      ...base.ai,
      ...(overrides.ai || {}),
    },
  };
}
