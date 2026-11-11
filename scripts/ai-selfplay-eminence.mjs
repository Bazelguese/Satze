#!/usr/bin/env node
/**
 * Banco di prova con le Eminenze (formato Standard): partite intere IA contro IA, senza
 * interfaccia, con semi riproducibili. Ogni seme si gioca due volte con i lati scambiati.
 *
 * Uso:
 *   npm run selfplay:eminence -- --pairing "mc-medium|smart:mc-medium|first" --n 50
 *   npm run selfplay:eminence -- --pairing "..." --from 100 --to 150 --out <file.jsonl>
 *   npm run selfplay:eminence -- --report <file1.jsonl,file2.jsonl,…>
 *
 * Un lato è "agente|politica":
 * - agente: come scripts/ai-selfplay.mjs (mc-easy, mc-medium, mc-hard, easy, medium, hard,
 *   random, greedy; varianti con @chiave=valore);
 * - politica Eminenza: smart (IA attuale) | first (prima abilità legale, IA precedente).
 *
 * Il report stampa il punteggio di A con l'intervallo di Wilson al 95%, i motivi di vittoria,
 * il punteggio per Eminenza di A e quanto spesso ogni abilità viene scelta.
 */

import fs from 'node:fs';
import { deckPairForSeed } from '../src/game/sim/selfPlay.js';
import { createAgentFromSpec } from '../src/game/sim/simAgents.js';
import {
  createHeadlessEminenceMatch,
  playHeadlessEminenceMatch,
} from '../src/game/sim/headlessEminenceMatch.js';
import { mulberry32 } from '../src/utils/seededRandom.js';

function parseArgs(argv) {
  const args = { n: 20, from: null, to: null, pairing: null, out: null, report: null };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = () => argv[++i];
    if (key === '--n') args.n = Number(next());
    else if (key === '--from') args.from = Number(next());
    else if (key === '--to') args.to = Number(next());
    else if (key === '--pairing') args.pairing = next();
    else if (key === '--out') args.out = next();
    else if (key === '--report') args.report = next().split(',');
  }
  return args;
}

function parseSide(text) {
  const [agent, policy = 'smart'] = String(text).split('|');
  return { agent, policy };
}

function agentSeed(seed, salt) {
  return ((seed * 2654435761) ^ (salt * 40503)) >>> 0;
}

function runSeed(seed, a, b) {
  const [deck1, deck2] = deckPairForSeed(seed);
  const base = createHeadlessEminenceMatch({ seed, player: deck1, enemy: deck2 });
  const out = [];
  for (const aSide of ['player', 'enemy']) {
    const bSide = aSide === 'player' ? 'enemy' : 'player';
    const agents = {
      [aSide]: createAgentFromSpec(a.agent, { seed: agentSeed(seed, aSide === 'player' ? 1 : 2) }),
      [bSide]: createAgentFromSpec(b.agent, { seed: agentSeed(seed, bSide === 'player' ? 3 : 4) }),
    };
    const policies = { [aSide]: a.policy, [bSide]: b.policy };
    const started = Date.now();
    const result = playHeadlessEminenceMatch(base, agents, policies, { rng: mulberry32(agentSeed(seed, 9)) });
    const final = result.finalState;
    const fields = (side) => Object.values(final.conqueredFields || {}).filter((f) => f?.winner === side).length;
    out.push({
      seed,
      a: `${a.agent}|${a.policy}`,
      b: `${b.agent}|${b.policy}`,
      aSide,
      outcome: result.winner === 'draw' ? 'draw' : result.winner === aSide ? 'win' : 'loss',
      reason: result.reason,
      rounds: result.rounds.length,
      eminenceA: result.eminences[aSide],
      eminenceB: result.eminences[bSide],
      hp: { a: final[`${aSide}HP`], b: final[`${bSide}HP`] },
      fields: { a: fields(aSide), b: fields(bSide) },
      abilitiesA: result.rounds.flatMap((r) => r.abilities.filter((x) => x.side === aSide).map((x) => x.abilityId)),
      abilitiesB: result.rounds.flatMap((r) => r.abilities.filter((x) => x.side === bSide).map((x) => x.abilityId)),
      dealsToA: result.rounds.flatMap((r) => r.deals.filter((d) => d.owner === bSide).map((d) => `${d.source}:${d.accepted ? 'si' : 'no'}${d.choice ? `:${d.choice}` : ''}`)),
      fixes: result.rounds.reduce((s, r) => s + r.fixes.length, 0),
      wallMs: Date.now() - started,
    });
  }
  return out;
}

function wilson(score, n) {
  if (!n) return [0, 0];
  const z = 1.96;
  const p = score / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(centre - margin) / denom, (centre + margin) / denom];
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const scoreOf = (rows) => rows.filter((r) => r.outcome === 'win').length + rows.filter((r) => r.outcome === 'draw').length / 2;

function report(records) {
  const byPair = new Map();
  for (const r of records) {
    const key = `${r.a}  vs  ${r.b}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key).push(r);
  }
  for (const [key, rows] of byPair) {
    const score = scoreOf(rows);
    const [lo, hi] = wilson(score, rows.length);
    console.log(`\n## ${key}`);
    console.log(`partite ${rows.length} · punteggio A ${pct(score / rows.length)} [${pct(lo)}–${pct(hi)}] · correzioni ${rows.reduce((s, r) => s + r.fixes, 0)}`);
    const reasons = {};
    for (const r of rows) reasons[`${r.outcome}:${r.reason}`] = (reasons[`${r.outcome}:${r.reason}`] || 0) + 1;
    console.log('motivi:', Object.entries(reasons).sort().map(([k, v]) => `${k} ${v}`).join(' · '));
    console.log('turni medi:', (rows.reduce((s, r) => s + r.rounds, 0) / rows.length).toFixed(2));
    const byEm = new Map();
    for (const r of rows) {
      if (!byEm.has(r.eminenceA)) byEm.set(r.eminenceA, []);
      byEm.get(r.eminenceA).push(r);
    }
    console.log('per Eminenza di A:');
    for (const [em, list] of [...byEm].sort((x, y) => y[1].length - x[1].length)) {
      console.log(`  ${String(em).padEnd(26)} n ${String(list.length).padStart(3)}  ${pct(scoreOf(list) / list.length)}`);
    }
    const usage = (field) => {
      const counts = {};
      for (const r of rows) for (const id of r[field]) counts[id] = (counts[id] || 0) + 1;
      return Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
    };
    console.log('abilità A:', usage('abilitiesA'));
    console.log('abilità B:', usage('abilitiesB'));
    const deals = {};
    for (const r of rows) for (const d of r.dealsToA) deals[d] = (deals[d] || 0) + 1;
    if (Object.keys(deals).length) console.log('Offerte ad A:', Object.entries(deals).sort().map(([k, v]) => `${k} ${v}`).join(' · '));
    const ms = rows.map((r) => r.wallMs);
    console.log(`tempo medio per partita: ${(ms.reduce((s, v) => s + v, 0) / ms.length / 1000).toFixed(1)} s`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.report) {
  const records = args.report.flatMap((file) => fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
  report(records);
} else {
  if (!args.pairing) throw new Error('--pairing "agente|politica:agente|politica" obbligatorio');
  const [a, b] = args.pairing.split(':').map(parseSide);
  const from = args.from ?? 1;
  const to = args.to ?? from + args.n;
  const records = [];
  for (let seed = from; seed < to; seed += 1) {
    for (const record of runSeed(seed, a, b)) {
      records.push(record);
      if (args.out) fs.appendFileSync(args.out, `${JSON.stringify(record)}\n`);
    }
  }
  if (!args.out) report(records);
}
