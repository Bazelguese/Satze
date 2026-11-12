#!/usr/bin/env node
/**
 * Banco di prova 2v2: squadre IA contro squadre IA (src/game/sim/teamSelfPlay.js).
 *
 * Uso:
 *   npm run selfplay:team -- --pairings mc-hard:old-hard,mc-medium:mc-easy --n 50
 *   opzioni: --modes classic,bareHands  --seed-base 9000  --out-dir <dir> (JSON grezzi)
 *
 * Agenti: old-easy|old-medium|old-hard (IA precedente), mc-easy|mc-medium|mc-hard (nuova),
 * con varianti "mc-hard@trait=impetuoso;rollouts=3000".
 */

import fs from 'node:fs';
import path from 'node:path';
import { runTeamPairing } from '../src/game/sim/teamSelfPlay.js';

function parseArgs(argv) {
  const args = { n: 50, seedBase: 9000, modes: ['classic'], pairings: ['mc-hard:old-hard'] };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--n') args.n = Number(v());
    else if (k === '--seed-base') args.seedBase = Number(v());
    else if (k === '--modes') args.modes = v().split(',');
    else if (k === '--pairings') args.pairings = v().split(',');
    else if (k === '--out-dir') args.outDir = v();
    else throw new Error(`Argomento sconosciuto: ${k}`);
  }
  return args;
}

function wilson(score, n) {
  const z = 1.96;
  const p = score / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const args = parseArgs(process.argv.slice(2));
const seeds = Array.from({ length: args.n }, (_, i) => args.seedBase + i);
for (const mode of args.modes) {
  for (const pairing of args.pairings) {
    const [a, b] = pairing.split(':');
    const started = Date.now();
    let done = 0;
    const records = runTeamPairing({
      a,
      b,
      mode,
      seeds,
      onMatch: () => {
        done += 1;
        if (done % 20 === 0) console.log(`  ${mode} ${pairing}: ${done}/${seeds.length * 2}`);
      },
    });
    const wins = records.filter((r) => r.outcome === 'win').length;
    const draws = records.filter((r) => r.outcome === 'draw').length;
    const score = wins + draws / 2;
    const [lo, hi] = wilson(score, records.length);
    const ms = records.flatMap((r) => r.msA).sort((x, y) => x - y);
    const mean = ms.reduce((s, v) => s + v, 0) / Math.max(1, ms.length);
    const p95 = ms[Math.max(0, Math.ceil(ms.length * 0.95) - 1)] || 0;
    console.log(
      `${mode} ${pairing}: ${a} ${pct(score / records.length)} [${pct(lo)}–${pct(hi)}] ` +
        `(${wins}V ${draws}N ${records.length - wins - draws}P) · decisioni ${a}: media ${mean.toFixed(0)} ms, p95 ${p95.toFixed(0)} ms, max ${(ms[ms.length - 1] || 0).toFixed(0)} ms · ${((Date.now() - started) / 1000).toFixed(0)} s`
    );
    if (args.outDir) {
      fs.mkdirSync(args.outDir, { recursive: true });
      const name = `${mode}__${pairing.replace(':', '-vs-')}`.replace(/[^\w@=;.,-]+/g, '_');
      fs.writeFileSync(path.join(args.outDir, `${name}.json`), JSON.stringify(records));
    }
  }
}
