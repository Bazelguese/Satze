#!/usr/bin/env node
/**
 * Addestramento della politica di simulazione (motore a simulazione, src/game/ai/mc).
 *
 * 1. collect: la Difficile gioca contro sé stessa; a ogni decisione si registrano le
 *    caratteristiche di ogni mossa (Agente × FC) e la sua stima di vittoria dalle simulazioni.
 * 2. train: si addestrano i pesi di una politica lineare a imitare quelle stime
 *    (softmax a lista); si scrivono in src/game/ai/mc/learnedPolicyWeights.js.
 *
 * Uso:
 *   npx vite-node scripts/ai-train-policy.mjs collect --games 60 --seed-base 5000 --out <dir>
 *   npx vite-node scripts/ai-train-policy.mjs train --in <dir> [--tau 0.05] [--epochs 40]
 *   opzioni di collect: --policy learned (usa i pesi attuali nelle simulazioni: secondo giro)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mulberry32 } from '../src/utils/seededRandom.js';
import { playHeadlessMatch } from '../src/game/sim/headlessMatch.js';
import { createHeadlessMatch } from '../src/game/sim/headlessSetup.js';
import { deckPairForSeed } from '../src/game/sim/selfPlay.js';
import { chooseMonteCarloAction } from '../src/game/ai/mc/mcSearch.js';
import { getMcProfile } from '../src/game/ai/mc/mcProfiles.js';
import { buildFeatureContext, moveFeatures, MC_FEATURE_NAMES } from '../src/game/ai/mc/mcFeatures.js';
import { focusOptionsFor } from '../src/game/ai/mc/mcPolicy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEIGHTS_FILE = path.join(ROOT, 'src/game/ai/mc/learnedPolicyWeights.js');

function parseArgs(argv) {
  const args = { cmd: argv[0], games: 60, seedBase: 5000, tau: 0.05, epochs: 40, mode: 'classic' };
  for (let i = 1; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--games') args.games = Number(v());
    else if (k === '--seed-base') args.seedBase = Number(v());
    else if (k === '--out') args.out = v();
    else if (k === '--in') args.in = v();
    else if (k === '--tau') args.tau = Number(v());
    else if (k === '--epochs') args.epochs = Number(v());
    else if (k === '--mode') args.mode = v();
    else if (k === '--policy') args.policy = v();
    else if (k === '--rollouts') args.rollouts = Number(v());
    else throw new Error(`Argomento sconosciuto: ${k}`);
  }
  return args;
}

// ------------------------------------------------------------------
// Raccolta
// ------------------------------------------------------------------

async function loadWeights() {
  if (!fs.existsSync(WEIGHTS_FILE)) return null;
  const mod = await import(WEIGHTS_FILE);
  return mod.LEARNED_POLICY?.weights || null;
}

/** Una decisione: per ogni (Agente, FC) la stima migliore fra i Campi provati. */
function decisionRecord(view, ranked) {
  const best = new Map();
  for (const c of ranked) {
    if (c.n < 2) continue;
    const key = `${c.cardId}:${c.focus}`;
    const prev = best.get(key);
    if (!prev || c.mean > prev.mean) best.set(key, { mean: c.mean, n: c.n });
  }
  const ctx = buildFeatureContext(view);
  const rows = [];
  for (const card of ctx.cards) {
    for (const focus of focusOptionsFor(view, card)) {
      const hit = best.get(`${card.id}:${focus}`);
      if (!hit) continue;
      rows.push({ x: moveFeatures(view, card, focus, ctx), v: hit.mean, n: hit.n });
    }
  }
  return rows.length >= 2 ? rows : null;
}

async function collect(args) {
  fs.mkdirSync(args.out, { recursive: true });
  const weights = args.policy === 'learned' ? await loadWeights() : null;
  if (args.policy === 'learned' && !weights) throw new Error('Pesi assenti: addestra prima.');
  const decisions = [];
  const started = Date.now();
  for (let g = 0; g < args.games; g += 1) {
    const seed = args.seedBase + g;
    const [d1, d2] = deckPairForSeed(seed);
    const state = createHeadlessMatch({ seed, mode: args.mode, player: d1, enemy: d2 });
    const make = (slot) => {
      const rng = mulberry32((seed * 31 + slot) >>> 0);
      const params = {
        ...getMcProfile('hard'),
        leadMode: undefined,
        ...(args.rollouts ? { rollouts: args.rollouts } : {}),
        ...(weights ? { policy: 'learned', learnedWeights: weights } : {}),
        maxMs: undefined,
        onCandidates: (view, ranked) => {
          const rec = decisionRecord(view, ranked);
          if (rec) decisions.push(rec);
        },
      };
      const decide = (view) => {
        const d = chooseMonteCarloAction(view, params, rng);
        return d ? { fieldIndex: d.fieldIndex, cardId: d.cardId, focus: d.focus } : null;
      };
      return { lead: decide, respond: decide };
    };
    playHeadlessMatch(state, { player: make(1), enemy: make(2) });
    if ((g + 1) % 10 === 0) {
      console.log(`  partite ${g + 1}/${args.games}, decisioni ${decisions.length}, ${((Date.now() - started) / 1000).toFixed(0)} s`);
    }
  }
  const file = path.join(args.out, `decisions_${args.mode}_${args.seedBase}.json`);
  fs.writeFileSync(file, JSON.stringify({ features: MC_FEATURE_NAMES, decisions }));
  console.log(`Salvate ${decisions.length} decisioni in ${file}`);
}

// ------------------------------------------------------------------
// Addestramento (softmax a lista, Adam, L2)
// ------------------------------------------------------------------

function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const total = exps.reduce((s, e) => s + e, 0);
  return exps.map((e) => e / total);
}

function evaluate(weights, decisions, tau) {
  let ce = 0;
  let top1 = 0;
  let regret = 0;
  for (const rows of decisions) {
    const target = softmax(rows.map((r) => r.v / tau));
    const logits = rows.map((r) => r.x.reduce((s, xi, i) => s + xi * weights[i], 0));
    const p = softmax(logits);
    for (let k = 0; k < rows.length; k += 1) ce -= target[k] * Math.log(p[k] + 1e-12);
    const bestV = Math.max(...rows.map((r) => r.v));
    const pick = logits.indexOf(Math.max(...logits));
    if (rows[pick].v >= bestV - 1e-9) top1 += 1;
    regret += bestV - rows[pick].v;
  }
  return { ce: ce / decisions.length, top1: top1 / decisions.length, regret: regret / decisions.length };
}

function train(args) {
  const files = fs.readdirSync(args.in).filter((f) => f.endsWith('.json'));
  let decisions = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(args.in, f), 'utf8'));
    if (JSON.stringify(data.features) !== JSON.stringify(MC_FEATURE_NAMES)) {
      throw new Error(`${f}: caratteristiche diverse da quelle attuali`);
    }
    decisions = decisions.concat(data.decisions);
  }
  // Divisione stabile: 1 decisione su 5 per la verifica.
  const trainSet = decisions.filter((_, i) => i % 5 !== 0);
  const testSet = decisions.filter((_, i) => i % 5 === 0);
  const dim = MC_FEATURE_NAMES.length;
  const w = new Array(dim).fill(0);
  const m = new Array(dim).fill(0);
  const v = new Array(dim).fill(0);
  const lr = 0.03;
  const l2 = 1e-4;
  let step = 0;
  const rng = mulberry32(12345);
  console.log(`Decisioni: ${decisions.length} (addestramento ${trainSet.length}, verifica ${testSet.length})`);
  console.log('Prima:', evaluate(w, testSet, args.tau));
  for (let epoch = 0; epoch < args.epochs; epoch += 1) {
    const order = trainSet.map((_, i) => i).sort(() => rng() - 0.5);
    for (const idx of order) {
      const rows = trainSet[idx];
      const target = softmax(rows.map((r) => r.v / args.tau));
      const p = softmax(rows.map((r) => r.x.reduce((s, xi, i) => s + xi * w[i], 0)));
      const grad = new Array(dim).fill(0);
      for (let k = 0; k < rows.length; k += 1) {
        const diff = p[k] - target[k];
        for (let i = 0; i < dim; i += 1) grad[i] += diff * rows[k].x[i];
      }
      step += 1;
      for (let i = 0; i < dim; i += 1) {
        const g = grad[i] + l2 * w[i];
        m[i] = 0.9 * m[i] + 0.1 * g;
        v[i] = 0.999 * v[i] + 0.001 * g * g;
        const mh = m[i] / (1 - 0.9 ** step);
        const vh = v[i] / (1 - 0.999 ** step);
        w[i] -= (lr * mh) / (Math.sqrt(vh) + 1e-8);
      }
    }
    if ((epoch + 1) % 10 === 0) {
      console.log(`epoca ${epoch + 1}: verifica`, evaluate(w, testSet, args.tau), 'addestramento', evaluate(w, trainSet, args.tau));
    }
  }
  const final = evaluate(w, testSet, args.tau);
  let commit = 'n/d';
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    /* ignore */
  }
  const body = `// Generato da scripts/ai-train-policy.mjs: non modificare a mano.
// Politica lineare per le simulazioni del motore a simulazione (src/game/ai/mc/mcPolicy.js).
// Dati: ${decisions.length} decisioni di autogioco della Difficile; commit ${commit}.
// Verifica (1 decisione su 5): ${JSON.stringify({ ce: +final.ce.toFixed(4), top1: +final.top1.toFixed(3), regret: +final.regret.toFixed(4) })}

export const LEARNED_POLICY = ${JSON.stringify(
    {
      features: MC_FEATURE_NAMES,
      tau: args.tau,
      decisions: decisions.length,
      weights: w.map((x) => +x.toFixed(5)),
    },
    null,
    2
  )};
`;
  fs.writeFileSync(WEIGHTS_FILE, body);
  console.log('Pesi:', Object.fromEntries(MC_FEATURE_NAMES.map((n, i) => [n, +w[i].toFixed(3)])));
  console.log(`Scritto ${path.relative(ROOT, WEIGHTS_FILE)}`);
}

const args = parseArgs(process.argv.slice(2));
if (args.cmd === 'collect') await collect(args);
else if (args.cmd === 'train') train(args);
else throw new Error('Comando: collect | train');
