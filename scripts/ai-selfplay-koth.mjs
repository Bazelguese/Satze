#!/usr/bin/env node
/**
 * Banco di prova Re della collina (src/game/sim/kothSelfPlay.js).
 *   npm run selfplay:koth -- --pairings mc-hard:old-hard --players 3 --n 30
 * Punteggio dell'agente a confrontato con la quota alla pari (1/giocatori).
 */
import fs from 'node:fs';
import path from 'node:path';
import { runKothPairing } from '../src/game/sim/kothSelfPlay.js';

const args = { n: 30, seedBase: 11000, players: 3, mode: 'classic', pairings: ['mc-hard:old-hard'] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const k = argv[i];
  const v = () => argv[++i];
  if (k === '--n') args.n = Number(v());
  else if (k === '--seed-base') args.seedBase = Number(v());
  else if (k === '--players') args.players = Number(v());
  else if (k === '--mode') args.mode = v();
  else if (k === '--pairings') args.pairings = v().split(',');
  else if (k === '--out-dir') args.outDir = v();
  else throw new Error(`Argomento sconosciuto: ${k}`);
}
const seeds = Array.from({ length: args.n }, (_, i) => args.seedBase + i);
for (const pairing of args.pairings) {
  const [a, b] = pairing.split(':');
  const started = Date.now();
  const records = runKothPairing({ a, b, players: args.players, mode: args.mode, seeds });
  const n = records.length;
  const score = records.reduce((s, r) => s + r.score, 0) / n;
  const se = Math.sqrt(records.reduce((s, r) => s + (r.score - score) ** 2, 0) / Math.max(1, n - 1) / n);
  const ms = records.flatMap((r) => r.msA).sort((x, y) => x - y);
  const mean = ms.reduce((s, v) => s + v, 0) / Math.max(1, ms.length);
  console.log(
    `${args.mode} ${args.players}g ${pairing}: ${a} vince ${(score * 100).toFixed(1)}% (±${(1.96 * se * 100).toFixed(1)}) ` +
      `contro quota alla pari ${(100 / args.players).toFixed(1)}% · ${n} partite · decisioni media ${mean.toFixed(0)} ms, max ${(ms[ms.length - 1] || 0).toFixed(0)} ms · ${((Date.now() - started) / 1000).toFixed(0)} s`
  );
  if (args.outDir) {
    fs.mkdirSync(args.outDir, { recursive: true });
    const name = `${args.mode}_${args.players}g__${pairing.replace(':', '-vs-')}`.replace(/[^\w@=;.,-]+/g, '_');
    fs.writeFileSync(path.join(args.outDir, `${name}.json`), JSON.stringify(records));
  }
}
