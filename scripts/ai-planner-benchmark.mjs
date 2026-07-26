#!/usr/bin/env node
/**
 * Development-only: benchmark decisioni planner IA.
 * Uso: npm run bench:ai
 * Non usa Web Worker né simulatore IA-vs-IA.
 */

import {
  chooseAIIndependentAction,
  chooseJointAIAction,
  getAIProfile,
  getOrdinaryFocusCap,
  simulateAIDuel,
  createSequenceRng,
} from '../src/game/ai/index.js';
import { makeCard, makeAIContext, neutralField } from '../src/game/ai/aiTestFixtures.js';

const DECISIONS_PER_DIFFICULTY = Number(process.env.AI_BENCH_N || 100);
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TARGETS_P95_MS = { easy: 30, medium: 200, hard: 800 };

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function stats(values) {
  if (!values.length) {
    return { mean: 0, median: 0, p95: 0, min: 0, max: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    mean,
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function makeBenchContext(difficulty, i) {
  const round = 1 + (i % 4);
  const aiLeads = i % 3 === 0;
  const cardsLeft = 5 - (i % 3);
  const pool = Math.max(6, 18 - (i % 5) * 2);

  const playerCards = Array.from({ length: cardsLeft }, (_, k) =>
    makeCard({
      id: 1000 + i * 10 + k,
      power: 1 + ((i + k) % 5),
      damage: 1 + ((i + k * 2) % 4),
      league: 1 + ((i + k) % 3),
      ability:
        k === 0 && i % 7 === 0
          ? { trigger: 'turbo', effect: 'power', value: 1 }
          : null,
    })
  );
  const aiCards = Array.from({ length: cardsLeft }, (_, k) =>
    makeCard({
      id: 2000 + i * 10 + k,
      power: 1 + ((i * 2 + k) % 6),
      damage: 1 + ((i + k) % 5),
      league: 1 + ((i + k * 3) % 3),
      ability:
        k === 0 && i % 5 === 0
          ? { trigger: 'overdrive', effect: 'power', value: 2 }
          : k === 1 && i % 6 === 0
            ? { trigger: 'vendetta', effect: 'power', value: 2 }
            : null,
    })
  );

  const fields = [
    { ...neutralField, id: 51 + (i % 3), name: `F${i % 3}`, category: 'neutral' },
    { ...neutralField, id: 79, name: 'Centrale', category: 'focus' },
    { ...neutralField, id: 10 + (i % 5), name: `G${i % 5}`, category: i % 2 ? 'values' : 'limit' },
  ];

  const visible = aiLeads ? null : playerCards[0];
  const joint = i % 4 === 1;

  const ctx = makeAIContext({
    difficulty,
    roundNumber: round,
    isPlayerFirst: !aiLeads,
    openingPlayerFirst: !aiLeads,
    lastWinner: i % 2 === 0 ? null : i % 4 === 0 ? 'player' : 'enemy',
    currentFieldIndex: joint ? null : 0,
    field: joint ? null : fields[0],
    battlefields: fields,
    revealedFields: Math.min(3, 1 + (i % 3)),
    conqueredFields: {},
    playerFieldsConquered: i % 3 === 0 ? 1 : 0,
    enemyFieldsConquered: i % 5 === 0 ? 1 : 0,
    player: {
      hand: playerCards,
      usedCardIds: [],
      hp: 12 + (i % 8),
      focusPool: pool,
      focus: pool,
      armyBonuses: {},
      toxin: null,
      visibleCard: visible,
    },
    ai: {
      hand: aiCards,
      usedCardIds: [],
      hp: 12 + ((i * 3) % 8),
      focusPool: pool,
      focus: pool,
      armyBonuses: {},
      toxin: null,
    },
  });

  return { ctx, joint };
}

function runDifficulty(difficulty) {
  const profile = getAIProfile(difficulty);
  const times = [];
  const nodes = [];
  const cacheHits = [];
  const focuses = [];
  const rounds = [];
  let overCap = 0;
  let overkillSum = 0;
  let overkillN = 0;

  for (let i = 0; i < DECISIONS_PER_DIFFICULTY; i += 1) {
    const { ctx, joint } = makeBenchContext(difficulty, i);
    const searchStats = { nodes: 0, cacheHits: 0 };
    const rng = createSequenceRng([((i * 17) % 100) / 100, ((i * 31) % 100) / 100]);

    const t0 = performance.now();
    const decision = joint
      ? chooseJointAIAction(ctx, difficulty, {
          rng,
          profile,
          searchStats,
        })
      : chooseAIIndependentAction(ctx, difficulty, {
          rng,
          profile,
          searchStats,
        });
    const t1 = performance.now();

    times.push(t1 - t0);
    nodes.push(searchStats.nodes || decision?.debug?.searchNodes || 0);
    cacheHits.push(searchStats.cacheHits || decision?.debug?.searchCacheHits || 0);

    if (!decision?.card) continue;

    focuses.push(decision.focus);
    rounds.push(ctx.roundNumber);

    const budget = getOrdinaryFocusCap(
      {
        ...ctx,
        currentFieldIndex: decision.fieldIndex ?? ctx.currentFieldIndex,
        field:
          decision.fieldIndex != null
            ? ctx.battlefields[decision.fieldIndex]
            : ctx.field,
      },
      'ai',
      profile
    );
    if (decision.focus > budget.ordinaryCap) overCap += 1;

    // Overkill: danno in eccesso su vittoria letale simulata (scenario focus medio)
    const playerCard =
      ctx.player.visibleCard ||
      ctx.player.hand.find((c) => c && !ctx.player.usedCardIds.includes(c.id));
    if (playerCard && ctx.field) {
      const sim = simulateAIDuel(
        {
          ...ctx,
          currentFieldIndex: decision.fieldIndex ?? ctx.currentFieldIndex,
          field:
            decision.fieldIndex != null
              ? ctx.battlefields[decision.fieldIndex]
              : ctx.field,
        },
        {
          card: decision.card,
          cardId: decision.cardId,
          focus: decision.focus,
          fieldIndex: decision.fieldIndex ?? ctx.currentFieldIndex,
        },
        { card: playerCard, focus: Math.max(1, Math.min(3, Math.floor(budget.fairShare))) }
      );
      if (sim.winner === 'enemy') {
        const damage = sim.playerHpBefore - sim.playerHpAfter;
        const overkill = Math.max(0, damage - sim.playerHpBefore);
        overkillSum += overkill;
        overkillN += 1;
      }
    }
  }

  const timeS = stats(times);
  const nodeS = stats(nodes);
  const cacheS = stats(cacheHits);
  const focusS = stats(focuses);

  return {
    difficulty,
    decisions: DECISIONS_PER_DIFFICULTY,
    timeMs: timeS,
    nodes: nodeS,
    cacheHits: cacheS,
    focus: focusS,
    overCapRate: overCap / DECISIONS_PER_DIFFICULTY,
    meanOverkill: overkillN ? overkillSum / overkillN : 0,
    targetP95: TARGETS_P95_MS[difficulty],
    meetsP95: timeS.p95 <= TARGETS_P95_MS[difficulty],
  };
}

function printReport(results) {
  console.log('\n=== SATZE AI Planner Benchmark (dev-only) ===\n');
  console.log(`Decisioni per difficoltà: ${DECISIONS_PER_DIFFICULTY}\n`);

  for (const r of results) {
    console.log(`## ${r.difficulty.toUpperCase()}`);
    console.log(
      `  tempo ms     mean=${r.timeMs.mean.toFixed(2)}  median=${r.timeMs.median.toFixed(2)}  p95=${r.timeMs.p95.toFixed(2)}  (target p95 ≤ ${r.targetP95}) ${r.meetsP95 ? 'OK' : 'SOPRA TARGET'}`
    );
    console.log(
      `  nodi         mean=${r.nodes.mean.toFixed(1)}  median=${r.nodes.median.toFixed(0)}  p95=${r.nodes.p95.toFixed(0)}`
    );
    console.log(
      `  cache hit    mean=${r.cacheHits.mean.toFixed(1)}  median=${r.cacheHits.median.toFixed(0)}  p95=${r.cacheHits.p95.toFixed(0)}`
    );
    console.log(
      `  Focus        mean=${r.focus.mean.toFixed(2)}  median=${r.focus.median.toFixed(2)}  p95=${r.focus.p95.toFixed(2)}`
    );
    console.log(`  oltre cap    ${(r.overCapRate * 100).toFixed(1)}%`);
    console.log(`  overkill medio (su vittorie) ${r.meanOverkill.toFixed(2)}`);
    console.log('');
  }

  const allOk = results.every((r) => r.meetsP95);
  console.log(allOk ? 'Tutti i target p95 rispettati.' : 'Alcuni target p95 non rispettati (raccogliere dati, non bloccare ancora).');
  return allOk;
}

const results = DIFFICULTIES.map(runDifficulty);
const ok = printReport(results);

// Exit 0 sempre: il benchmark raccoglie dati, non fallisce la CI per i target iniziali
process.exit(0);
