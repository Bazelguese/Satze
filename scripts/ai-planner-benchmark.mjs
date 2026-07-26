#!/usr/bin/env node
/**
 * Development-only: benchmark decisioni planner IA.
 * Uso: npm run bench:ai
 * Scrive anche Documentazione/AI_BENCHMARK_LATEST.md
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chooseAIIndependentAction,
  chooseJointAIAction,
  getAIProfile,
  getOrdinaryFocusCap,
  getLegalFocusRange,
  simulateAIDuel,
  createSequenceRng,
} from '../src/game/ai/index.js';
import { makeCard, makeAIContext, neutralField } from '../src/game/ai/aiTestFixtures.js';

const DECISIONS_PER_DIFFICULTY = Number(process.env.AI_BENCH_N || 100);
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TARGETS_P95_MS = { easy: 30, medium: 200, hard: 800 };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(__dirname, '../Documentazione/AI_BENCHMARK_LATEST.md');

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function stats(values) {
  if (!values.length) {
    return { mean: 0, median: 0, p95: 0, min: 0, max: 0, n: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    mean,
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    n: values.length,
  };
}

function resolveDecisionContext(ctx, decision) {
  const fieldIndex =
    decision?.fieldIndex != null ? decision.fieldIndex : ctx.currentFieldIndex;
  const field =
    fieldIndex != null && ctx.battlefields?.[fieldIndex]
      ? ctx.battlefields[fieldIndex]
      : ctx.field;
  return {
    ...ctx,
    currentFieldIndex: fieldIndex,
    field,
  };
}

function opponentFocusForScenario(ctx, budget) {
  return Math.max(1, Math.min(3, Math.floor(budget.fairShare || 2)));
}

function pickOpponentCard(ctx) {
  if (ctx.player.visibleCard) return ctx.player.visibleCard;
  return (ctx.player.hand || []).find(
    (c) => c && !(ctx.player.usedCardIds || []).includes(c.id)
  );
}

/**
 * excessFocus: FC scelti − minimo candidato Focus sulla stessa carta
 * che produce stesso winner + terminalStatus contro lo scenario avversario.
 */
function computeExcessFocus(decisionCtx, decision, playerCard, playerFocus) {
  if (!decision?.card || !playerCard || !decisionCtx.field) return null;

  const { minFocus, maxFocus } = getLegalFocusRange(decisionCtx, 'ai');
  const baseSim = simulateAIDuel(
    decisionCtx,
    {
      card: decision.card,
      cardId: decision.cardId,
      focus: decision.focus,
      fieldIndex: decisionCtx.currentFieldIndex,
    },
    { card: playerCard, focus: playerFocus }
  );

  let minSame = decision.focus;
  for (let f = minFocus; f <= Math.min(maxFocus, decision.focus); f += 1) {
    const sim = simulateAIDuel(
      decisionCtx,
      {
        card: decision.card,
        cardId: decision.cardId,
        focus: f,
        fieldIndex: decisionCtx.currentFieldIndex,
      },
      { card: playerCard, focus: playerFocus }
    );
    if (
      sim.winner === baseSim.winner &&
      (sim.terminalStatus || null) === (baseSim.terminalStatus || null)
    ) {
      minSame = f;
      break;
    }
  }

  return {
    excessFocus: Math.max(0, decision.focus - minSame),
    minFocusSameOutcome: minSame,
    winner: baseSim.winner,
    terminalStatus: baseSim.terminalStatus,
    simulation: baseSim,
  };
}

/** Margine VA IA − giocatore (solo se IA vince). */
function vaMargin(simulation) {
  const br = simulation?.battleResult;
  if (!br || simulation.winner !== 'enemy') return null;
  const aiVa = Number(br.enemyAssault ?? 0);
  const playerVa = Number(br.playerAssault ?? 0);
  return Math.max(0, aiVa - playerVa);
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
  const focusByRound = { 1: [], 2: [], '3+': [] };
  const vaMargins = [];
  const excessFocuses = [];
  let overCap = 0;
  let jointCount = 0;

  for (let i = 0; i < DECISIONS_PER_DIFFICULTY; i += 1) {
    const { ctx, joint } = makeBenchContext(difficulty, i);
    if (joint) jointCount += 1;
    const searchStats = { nodes: 0, cacheHits: 0 };
    const rng = createSequenceRng([((i * 17) % 100) / 100, ((i * 31) % 100) / 100]);

    const t0 = performance.now();
    const decision = joint
      ? chooseJointAIAction(ctx, difficulty, { rng, profile, searchStats })
      : chooseAIIndependentAction(ctx, difficulty, { rng, profile, searchStats });
    const t1 = performance.now();

    times.push(t1 - t0);
    nodes.push(searchStats.nodes || decision?.debug?.searchNodes || 0);
    cacheHits.push(searchStats.cacheHits || decision?.debug?.searchCacheHits || 0);

    if (!decision?.card) continue;

    focuses.push(decision.focus);
    if (ctx.roundNumber <= 1) focusByRound[1].push(decision.focus);
    else if (ctx.roundNumber === 2) focusByRound[2].push(decision.focus);
    else focusByRound['3+'].push(decision.focus);

    const decisionCtx = resolveDecisionContext(ctx, decision);
    const budget = getOrdinaryFocusCap(decisionCtx, 'ai', profile);
    if (decision.focus > budget.ordinaryCap) overCap += 1;

    const playerCard = pickOpponentCard(decisionCtx);
    if (!playerCard || !decisionCtx.field) continue;

    const playerFocus = opponentFocusForScenario(decisionCtx, budget);
    const excess = computeExcessFocus(decisionCtx, decision, playerCard, playerFocus);
    if (excess) {
      excessFocuses.push(excess.excessFocus);
      const margin = vaMargin(excess.simulation);
      if (margin != null) vaMargins.push(margin);
    }
  }

  return {
    difficulty,
    decisions: DECISIONS_PER_DIFFICULTY,
    jointDecisions: jointCount,
    timeMs: stats(times),
    nodes: stats(nodes),
    cacheHits: stats(cacheHits),
    focus: stats(focuses),
    focusR1: stats(focusByRound[1]),
    focusR2: stats(focusByRound[2]),
    focusR3p: stats(focusByRound['3+']),
    overCapRate: overCap / DECISIONS_PER_DIFFICULTY,
    meanVaMargin: vaMargins.length ? vaMargins.reduce((s, v) => s + v, 0) / vaMargins.length : 0,
    vaMarginN: vaMargins.length,
    meanExcessFocus: excessFocuses.length
      ? excessFocuses.reduce((s, v) => s + v, 0) / excessFocuses.length
      : 0,
    excessFocus: stats(excessFocuses),
    targetP95: TARGETS_P95_MS[difficulty],
    meetsP95: stats(times).p95 <= TARGETS_P95_MS[difficulty],
  };
}

function fmt(n, d = 2) {
  return Number(n).toFixed(d);
}

function printReport(results, meta) {
  console.log('\n=== SATZE AI Planner Benchmark (dev-only) ===\n');
  console.log(`Macchina: ${meta.machine}`);
  console.log(`Node: ${meta.node}`);
  console.log(`Decisioni per difficoltà: ${DECISIONS_PER_DIFFICULTY}\n`);

  for (const r of results) {
    console.log(`## ${r.difficulty.toUpperCase()}`);
    console.log(
      `  tempo ms     mean=${fmt(r.timeMs.mean)}  median=${fmt(r.timeMs.median)}  p95=${fmt(r.timeMs.p95)}  (target ≤ ${r.targetP95}) ${r.meetsP95 ? 'OK' : 'SOPRA TARGET'}`
    );
    console.log(
      `  nodi         mean=${fmt(r.nodes.mean, 1)}  median=${fmt(r.nodes.median, 0)}  p95=${fmt(r.nodes.p95, 0)}`
    );
    console.log(
      `  cache hit    mean=${fmt(r.cacheHits.mean, 1)}  median=${fmt(r.cacheHits.median, 0)}  p95=${fmt(r.cacheHits.p95, 0)}`
    );
    console.log(
      `  Focus        mean=${fmt(r.focus.mean)}  median=${fmt(r.focus.median)}  p95=${fmt(r.focus.p95)}`
    );
    console.log(
      `  Focus R1     mean=${fmt(r.focusR1.mean)}  p95=${fmt(r.focusR1.p95)}  (n=${r.focusR1.n})`
    );
    console.log(
      `  Focus R2     mean=${fmt(r.focusR2.mean)}  p95=${fmt(r.focusR2.p95)}  (n=${r.focusR2.n})`
    );
    console.log(
      `  Focus R3+    mean=${fmt(r.focusR3p.mean)}  p95=${fmt(r.focusR3p.p95)}  (n=${r.focusR3p.n})`
    );
    console.log(`  oltre cap    ${fmt(r.overCapRate * 100, 1)}%`);
    console.log(
      `  VA margin    mean=${fmt(r.meanVaMargin)}  (su ${r.vaMarginN} vittorie IA)`
    );
    console.log(
      `  excessFocus  mean=${fmt(r.meanExcessFocus)}  p95=${fmt(r.excessFocus.p95)}`
    );
    console.log(`  decisioni joint nel campione: ${r.jointDecisions}`);
    console.log('');
  }

  const allOk = results.every((r) => r.meetsP95);
  console.log(
    allOk
      ? 'Tutti i target p95 rispettati.'
      : 'Alcuni target p95 non rispettati (raccogliere dati, non bloccare ancora).'
  );
  return allOk;
}

function writeMarkdown(results, meta) {
  const lines = [];
  lines.push('# SATZE AI Planner — Benchmark Latest');
  lines.push('');
  lines.push(`Generato: ${meta.generatedAt}`);
  lines.push('');
  lines.push('## Ambiente');
  lines.push('');
  lines.push(`- Macchina: ${meta.machine}`);
  lines.push(`- OS: ${meta.os}`);
  lines.push(`- CPU: ${meta.cpu}`);
  lines.push(`- Node: ${meta.node}`);
  lines.push(`- Decisioni per difficoltà: ${DECISIONS_PER_DIFFICULTY}`);
  lines.push(`- Include decisioni congiunte Campo–carta–Focus: sì`);
  lines.push('');
  lines.push('## Metriche');
  lines.push('');
  lines.push('- **tempo**: latenza `chooseAI*` / `chooseJointAIAction`');
  lines.push('- **nodi / cache**: searchStats del planner');
  lines.push('- **Focus**: FC scelti (anche per round)');
  lines.push('- **oltre-cap**: Focus > ordinaryCap');
  lines.push('- **VA margin**: `enemyAssault - playerAssault` quando l’IA vince lo scenario avversario');
  lines.push(
    '- **excessFocus**: FC scelti − minimo Focus sulla stessa carta con stesso `winner` e `terminalStatus`'
  );
  lines.push('');

  for (const r of results) {
    lines.push(`## ${r.difficulty}`);
    lines.push('');
    lines.push('| Metrica | mean | median | p95 |');
    lines.push('|---------|------|--------|-----|');
    lines.push(
      `| tempo ms | ${fmt(r.timeMs.mean)} | ${fmt(r.timeMs.median)} | ${fmt(r.timeMs.p95)} |`
    );
    lines.push(
      `| nodi | ${fmt(r.nodes.mean, 1)} | ${fmt(r.nodes.median, 0)} | ${fmt(r.nodes.p95, 0)} |`
    );
    lines.push(
      `| cache hit | ${fmt(r.cacheHits.mean, 1)} | ${fmt(r.cacheHits.median, 0)} | ${fmt(r.cacheHits.p95, 0)} |`
    );
    lines.push(
      `| Focus | ${fmt(r.focus.mean)} | ${fmt(r.focus.median)} | ${fmt(r.focus.p95)} |`
    );
    lines.push(
      `| excessFocus | ${fmt(r.meanExcessFocus)} | ${fmt(r.excessFocus.median)} | ${fmt(r.excessFocus.p95)} |`
    );
    lines.push('');
    lines.push(`- Target p95 tempo: ≤ ${r.targetP95} ms → **${r.meetsP95 ? 'OK' : 'SOPRA TARGET'}**`);
    lines.push(`- Oltre cap: ${fmt(r.overCapRate * 100, 1)}%`);
    lines.push(`- VA margin medio (vittorie IA): ${fmt(r.meanVaMargin)} (n=${r.vaMarginN})`);
    lines.push(`- Decisioni joint nel campione: ${r.jointDecisions}`);
    lines.push('');
    lines.push('### Focus per round');
    lines.push('');
    lines.push('| Round | mean | p95 | n |');
    lines.push('|-------|------|-----|---|');
    lines.push(
      `| R1 | ${fmt(r.focusR1.mean)} | ${fmt(r.focusR1.p95)} | ${r.focusR1.n} |`
    );
    lines.push(
      `| R2 | ${fmt(r.focusR2.mean)} | ${fmt(r.focusR2.p95)} | ${r.focusR2.n} |`
    );
    lines.push(
      `| R3+ | ${fmt(r.focusR3p.mean)} | ${fmt(r.focusR3p.p95)} | ${r.focusR3p.n} |`
    );
    lines.push('');
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`\nReport salvato in ${REPORT_PATH}`);
}

const meta = {
  generatedAt: new Date().toISOString(),
  machine: os.hostname(),
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpu: os.cpus()?.[0]?.model || 'unknown',
  node: process.version,
};

const results = DIFFICULTIES.map(runDifficulty);
printReport(results, meta);
writeMarkdown(results, meta);
process.exit(0);
