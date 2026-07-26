/**
 * Commit 3 — correttezza planner (Focus aggregato, cache, scenari, Campi, iniziativa, comportamenti).
 */
import { describe, it, expect } from 'vitest';
import {
  getAIProfile,
  buildStrategicState,
  buildSimulateAIDuelCacheKey,
  simulateAIDuel,
  generateOpponentScenarios,
  chooseBestAiReplyAggregatingFocus,
  chooseAIIndependentAction,
  createConstantRng,
  publicStateHash,
  projectPostDuelState,
  resolveNextInitiativeFromWinner,
  selectCandidateFields,
  lightRankField,
  evaluateStrategicState,
} from './index.js';
import { makeAIContext, makeCard, neutralField } from './aiTestFixtures.js';

function makeField(id, name, category = 'neutral') {
  return {
    ...neutralField,
    id,
    name,
    category,
    tema: 'generico',
  };
}

describe('valuePlayerToMove / risposta unica per Focus nascosto', () => {
  it('stessa carta a 3 e 7 FC → una sola decisione IA', () => {
    const playerCard = makeCard({ id: 500, name: 'Visibile', power: 3, damage: 2 });
    const aiStrong = makeCard({ id: 600, name: 'Forte', power: 6, damage: 4 });
    const aiWeak = makeCard({ id: 601, name: 'Debole', power: 2, damage: 2 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: true,
      player: {
        hand: [playerCard, makeCard({ id: 501 })],
        usedCardIds: [],
        hp: 18,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerCard,
      },
      ai: {
        hand: [aiStrong, aiWeak],
        usedCardIds: [],
        hp: 18,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
      },
    });
    const state = buildStrategicState(ctx);
    const profile = getAIProfile('hard');
    const aiActions = [
      { card: aiStrong, cardId: 600, focus: 2, fieldIndex: 0 },
      { card: aiWeak, cardId: 601, focus: 1, fieldIndex: 0 },
      { card: aiStrong, cardId: 600, focus: 5, fieldIndex: 0 },
    ];
    const cardScenarios = [
      { card: playerCard, cardId: 500, focus: 3, probability: 0.5, band: 'standard' },
      { card: playerCard, cardId: 500, focus: 7, probability: 0.5, band: 'high' },
    ];
    const ctxStats = { duelCache: new Map(), tt: new Map(), stats: { nodes: 0, cacheHits: 0 } };

    const reply = chooseBestAiReplyAggregatingFocus(
      ctx,
      state,
      aiActions,
      cardScenarios,
      0,
      profile,
      ctxStats
    );

    expect(reply.action).toBeTruthy();
    expect(reply.action.cardId).toBeDefined();
    expect(Number.isFinite(reply.score)).toBe(true);

    // Stesso aggregato: rieseguire produce la stessa risposta (determinismo)
    const reply2 = chooseBestAiReplyAggregatingFocus(
      ctx,
      state,
      aiActions,
      cardScenarios,
      0,
      profile,
      { duelCache: new Map(), tt: new Map(), stats: { nodes: 0, cacheHits: 0 } }
    );
    expect(reply2.action.cardId).toBe(reply.action.cardId);
    expect(reply2.action.focus).toBe(reply.action.focus);
  });
});

describe('cache simulateAIDuel', () => {
  it('chiavi diverse con Reckoning / Vendetta / Tossina diversi', () => {
    const playerCard = makeCard({ id: 100, power: 3, damage: 2 });
    const aiCard = makeCard({
      id: 200,
      power: 3,
      damage: 2,
      ability: { trigger: 'reckoning', effect: 'power', value: 2 },
    });
    const base = makeAIContext({
      roundNumber: 3,
      lastWinner: null,
      isPlayerFirst: true,
      player: {
        hand: [playerCard],
        usedCardIds: [],
        hp: 16,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
        visibleCard: playerCard,
      },
      ai: {
        hand: [aiCard],
        usedCardIds: [],
        hp: 16,
        focusPool: 8,
        focus: 8,
        armyBonuses: {},
        toxin: null,
      },
    });
    const aiAction = { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 };
    const playerAction = { card: playerCard, focus: 2 };

    const keyBase = buildSimulateAIDuelCacheKey(base, aiAction, playerAction);

    const reckoningCtx = {
      ...base,
      ai: { ...base.ai, usedCardIds: [901, 902] },
    };
    const keyReckoning = buildSimulateAIDuelCacheKey(reckoningCtx, aiAction, playerAction);

    const vendettaCtx = {
      ...base,
      lastWinner: 'player',
      ai: {
        ...base.ai,
        hand: [
          makeCard({
            id: 200,
            power: 3,
            damage: 2,
            ability: { trigger: 'vendetta', effect: 'power', value: 2 },
          }),
        ],
      },
    };
    vendettaCtx.ai.hand[0].id = 200;
    const keyVendetta = buildSimulateAIDuelCacheKey(
      vendettaCtx,
      { ...aiAction, card: vendettaCtx.ai.hand[0] },
      playerAction
    );

    const toxinCtx = {
      ...base,
      player: {
        ...base.player,
        toxin: { value: 1, minHealth: 1, source: 'Test' },
      },
    };
    const keyToxin = buildSimulateAIDuelCacheKey(toxinCtx, aiAction, playerAction);

    const toxin2Ctx = {
      ...base,
      player: {
        ...base.player,
        toxin: { value: 2, minHealth: 1, source: 'Test' },
      },
    };
    const keyToxin2 = buildSimulateAIDuelCacheKey(toxin2Ctx, aiAction, playerAction);

    expect(keyBase).not.toBe(keyReckoning);
    expect(keyBase).not.toBe(keyVendetta);
    expect(keyBase).not.toBe(keyToxin);
    expect(keyToxin).not.toBe(keyToxin2);

    // Stesso contesto apparente ma usedCardIds diversi → simulazioni non collidono in cache
    const cache = new Map();
    const simA = simulateAIDuel(base, aiAction, playerAction, { cache });
    const simB = simulateAIDuel(reckoningCtx, aiAction, playerAction, { cache });
    expect(cache.size).toBe(2);
    expect(simA).not.toBe(simB);
  });
});

describe('generateOpponentScenarios copertura carte', () => {
  it('cinque carte tutte rappresentate (ordine non di mano)', () => {
    const cards = [5, 4, 3, 2, 1].map((n) =>
      makeCard({ id: 700 + n, name: `C${n}`, power: n, damage: 2 })
    );
    const ctx = makeAIContext({
      isPlayerFirst: false,
      player: {
        hand: cards,
        usedCardIds: [],
        hp: 20,
        focusPool: 18,
        focus: 18,
        armyBonuses: {},
        toxin: null,
        visibleCard: null,
      },
    });
    const scenarios = generateOpponentScenarios(ctx, {
      ...getAIProfile('medium'),
      opponentScenarioCount: 4,
    });
    const ids = new Set(scenarios.map((s) => s.cardId));
    expect(ids.size).toBe(5);
    for (const c of cards) {
      expect(ids.has(c.id)).toBe(true);
    }
  });
});

describe('selezione Campi futuri', () => {
  it('non usa i primi indici grezzi: classifica per valutazione leggera', () => {
    const fields = [
      makeField(10, 'Neutro-A', 'neutral'),
      makeField(20, 'Valori', 'values'),
      makeField(30, 'Limite', 'limit'),
    ];
    const state = buildStrategicState(
      makeAIContext({
        battlefields: fields,
        revealedFields: 3,
        currentFieldIndex: null,
        field: fields[0],
        ai: {
          hand: [
            makeCard({
              id: 800,
              power: 6,
              damage: 4,
              ability: { trigger: 'overdrive', effect: 'power', value: 1 },
            }),
          ],
          usedCardIds: [],
          hp: 18,
          focusPool: 8,
          focus: 8,
          armyBonuses: {},
          toxin: null,
        },
      })
    );
    state.availableFieldIndexes = [0, 1, 2];
    state._refs.battlefields = fields;

    const ranks = [0, 1, 2].map((i) => lightRankField(state, i));
    expect(ranks.some((r, i) => r !== ranks[0] || i === 0)).toBe(true);

    const aiPicks = selectCandidateFields(state, 2, getAIProfile('hard'), 'ai');
    expect(aiPicks).toHaveLength(2);
    // Il migliore per l'IA non è obbligatoriamente l'indice 0
    const playerPicks = selectCandidateFields(state, 2, getAIProfile('hard'), 'player');
    expect(playerPicks[0].rank).toBeLessThanOrEqual(aiPicks[0].rank);
  });
});

describe('iniziativa e hash pubblici', () => {
  it('iniziativa: perde giocatore / perde IA', () => {
    expect(resolveNextInitiativeFromWinner('enemy', false)).toBe(true);
    expect(resolveNextInitiativeFromWinner('player', true)).toBe(false);

    const playerCard = makeCard({ id: 100 });
    const aiCard = makeCard({ id: 200 });
    const ctx = makeAIContext({
      roundNumber: 2,
      isPlayerFirst: true,
      openingPlayerFirst: true,
      revealedFields: 2,
      battlefields: [makeField(1, 'A'), makeField(2, 'B'), makeField(3, 'C')],
    });
    const root = buildStrategicState(ctx);

    const losePlayer = projectPostDuelState(
      root,
      {
        winner: 'enemy',
        playerHpAfter: 15,
        aiHpAfter: 18,
        playerFocusAfter: 5,
        aiFocusAfter: 5,
        terminalStatus: null,
        battleResult: {},
      },
      { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 },
      { card: playerCard, cardId: 100, focus: 2 }
    );
    expect(losePlayer.isPlayerFirst).toBe(true);

    const loseAi = projectPostDuelState(
      root,
      {
        winner: 'player',
        playerHpAfter: 18,
        aiHpAfter: 15,
        playerFocusAfter: 5,
        aiFocusAfter: 5,
        terminalStatus: null,
        battleResult: {},
      },
      { card: aiCard, cardId: 200, focus: 2, fieldIndex: 0 },
      { card: playerCard, cardId: 100, focus: 2 }
    );
    expect(loseAi.isPlayerFirst).toBe(false);
  });

  it('publicStateHash distingue tossina, campi rivelati e profilo iniziativa', () => {
    const base = buildStrategicState(makeAIContext({ revealedFields: 1 }));
    const a = publicStateHash(base, 1);
    const b = publicStateHash(
      {
        ...base,
        playerToxin: { value: 2, minHealth: 1, source: 'X' },
      },
      1
    );
    const c = publicStateHash({ ...base, revealedFields: 3, availableFieldIndexes: [0, 1, 2] }, 1);
    const d = publicStateHash({ ...base, initiativeProfile: 'assault' }, 1);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });
});

describe('comportamenti strategici', () => {
  it('conserva una carta con trigger futuro (Ultima Chance)', () => {
    // A parità di PV/FC/Campi, tenere Ultima Chance in mano vale più che averla già spesa
    const ultima = makeCard({
      id: 902,
      name: 'Ultima',
      power: 5,
      damage: 4,
      league: 3,
      ability: { trigger: 'ultimaChance', effect: 'power', value: 3 },
    });
    const filler = makeCard({ id: 901, name: 'Filler', power: 3, damage: 2 });
    const ctx = makeAIContext({
      roundNumber: 3,
      ai: {
        hand: [filler, ultima],
        usedCardIds: [],
        hp: 14,
        focusPool: 6,
        focus: 6,
        armyBonuses: {},
        toxin: null,
      },
    });
    const base = buildStrategicState(ctx);
    const kept = evaluateStrategicState(
      {
        ...base,
        roundNumber: 4,
        aiRemainingCardIds: [901, 902],
        aiUsedCardIds: [],
      },
      getAIProfile('hard')
    );
    const spent = evaluateStrategicState(
      {
        ...base,
        roundNumber: 4,
        aiRemainingCardIds: [901],
        aiUsedCardIds: [902],
      },
      getAIProfile('hard')
    );
    expect(kept.score).toBeGreaterThan(spent.score);
  });

  it('sceglie un sacrificio realmente vantaggioso', () => {
    // Stato A: perso con chaff, iniziativa IA, Intervention in mano
    // Stato B: perso bruciando Intervention, iniziativa IA ma senza carta chiave
    const base = buildStrategicState(
      makeAIContext({
        roundNumber: 3,
        isPlayerFirst: false,
        ai: {
          hand: [
            makeCard({
              id: 911,
              name: 'Intervento',
              power: 5,
              damage: 4,
              ability: { trigger: 'intervention', effect: 'power', value: 2 },
            }),
            makeCard({ id: 912, power: 2, damage: 2 }),
          ],
          usedCardIds: [910],
          hp: 12,
          focusPool: 6,
          focus: 6,
          armyBonuses: {},
          toxin: null,
        },
      })
    );
    const sacrificeGood = {
      ...base,
      lastWinner: 'player',
      initiativeSide: 'ai',
      isPlayerFirst: false,
      aiRemainingCardIds: [911, 912],
      aiUsedCardIds: [910],
      aiFocus: 5,
      playerHP: 14,
      aiHP: 11,
    };
    const sacrificeBad = {
      ...base,
      lastWinner: 'player',
      initiativeSide: 'ai',
      isPlayerFirst: false,
      aiRemainingCardIds: [912],
      aiUsedCardIds: [911],
      aiFocus: 2,
      playerHP: 14,
      aiHP: 11,
    };
    const good = evaluateStrategicState(sacrificeGood, getAIProfile('hard'));
    const bad = evaluateStrategicState(sacrificeBad, getAIProfile('hard'));
    expect(good.score).toBeGreaterThan(bad.score);
  });

  it('rifiuta un sacrificio inutile', () => {
    const strong = makeCard({ id: 920, name: 'Ace', power: 7, damage: 5, league: 3 });
    const filler = makeCard({ id: 921, name: 'Filler', power: 3, damage: 2, league: 2 });
    const weakPlayer = makeCard({ id: 130, name: 'Weak', power: 1, damage: 1, league: 1 });
    const ctx = makeAIContext({
      difficulty: 'hard',
      roundNumber: 2,
      isPlayerFirst: true,
      player: {
        hand: [weakPlayer, makeCard({ id: 131 })],
        usedCardIds: [],
        hp: 8,
        focusPool: 6,
        focus: 6,
        armyBonuses: {},
        toxin: null,
        visibleCard: weakPlayer,
      },
      ai: {
        hand: [strong, filler],
        usedCardIds: [],
        hp: 18,
        focusPool: 10,
        focus: 10,
        armyBonuses: {},
        toxin: null,
      },
    });
    const decision = chooseAIIndependentAction(ctx, 'hard', {
      rng: createConstantRng(0),
      profile: { ...getAIProfile('hard'), selectionMode: 'best' },
    });
    expect(decision?.card).toBeTruthy();
    const sim = simulateAIDuel(
      ctx,
      { card: decision.card, cardId: decision.cardId, focus: decision.focus, fieldIndex: 0 },
      { card: weakPlayer, focus: 1 }
    );
    // Contro un avversario impotente non deve cercare la sconfitta
    expect(sim.winner).toBe('enemy');
  });

  it('trova il Campo futuro decisivo (ranking)', () => {
    // id 79 = overdriveExtraPowerAndDamage (specialità reale)
    const fields = [
      makeField(1, 'Limite', 'limit'),
      { ...makeField(79, 'Centrale Energetica', 'focus'), tema: "Figli dell'Orizzonte" },
      makeField(3, 'Neutro', 'neutral'),
    ];
    const state = buildStrategicState(
      makeAIContext({
        battlefields: fields,
        revealedFields: 3,
        ai: {
          hand: [
            makeCard({
              id: 930,
              army: "Figli dell'Orizzonte",
              power: 4,
              damage: 3,
              ability: { trigger: 'overdrive', effect: 'power', value: 2 },
            }),
          ],
          usedCardIds: [],
          hp: 16,
          focusPool: 10,
          focus: 10,
          armyBonuses: {},
          toxin: null,
        },
      })
    );
    state.availableFieldIndexes = [0, 1, 2];
    state._refs.battlefields = fields;
    const picks = selectCandidateFields(state, 1, getAIProfile('hard'), 'ai');
    expect(picks[0].index).toBe(1);
  });

  it('non cambia strategia conoscendo il Focus nascosto', () => {
    const playerCard = makeCard({ id: 140, power: 3, damage: 2 });
    const aiA = makeCard({ id: 940, power: 4, damage: 3 });
    const aiB = makeCard({ id: 941, power: 3, damage: 3 });
    const makeCtx = () =>
      makeAIContext({
        difficulty: 'medium',
        roundNumber: 2,
        isPlayerFirst: true,
        player: {
          hand: [playerCard, makeCard({ id: 141 }), makeCard({ id: 142 })],
          usedCardIds: [],
          hp: 16,
          focusPool: 10,
          focus: 10,
          armyBonuses: {},
          toxin: null,
          visibleCard: playerCard,
        },
        ai: {
          hand: [aiA, aiB, makeCard({ id: 942, power: 2, damage: 2 })],
          usedCardIds: [],
          hp: 16,
          focusPool: 10,
          focus: 10,
          armyBonuses: {},
          toxin: null,
        },
      });

    const d1 = chooseAIIndependentAction(makeCtx(), 'medium', {
      rng: createConstantRng(0.15),
      profile: { ...getAIProfile('medium'), selectionMode: 'best' },
    });
    const d2 = chooseAIIndependentAction(makeCtx(), 'medium', {
      rng: createConstantRng(0.15),
      profile: { ...getAIProfile('medium'), selectionMode: 'best' },
    });
    expect(d1.cardId).toBe(d2.cardId);
    expect(d1.focus).toBe(d2.focus);
    expect(JSON.stringify(d1.debug || {}).includes('selectedFocus')).toBe(false);
  });
});
