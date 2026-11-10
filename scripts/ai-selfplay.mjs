#!/usr/bin/env node
/**
 * Banco di prova IA (Fase 0 del piano in Documentazione/PIANO_MIGLIORAMENTO_IA.md).
 * Partite intere IA contro IA, senza interfaccia, con semi riproducibili.
 *
 * Uso:
 *   npm run selfplay:ai                         tutti gli accoppiamenti, Classico e Mani nude
 *   npm run selfplay:ai -- --n 30               30 semi per accoppiamento (60 partite, lati scambiati)
 *   npm run selfplay:ai -- --modes classic --pairings easy:medium,medium:hard
 *   npm run selfplay:ai -- --only-run --out-dir <dir>   solo partite (JSON), senza report
 *   npm run selfplay:ai -- --only-report --in-dir <dir> solo report dai JSON
 *
 * Agenti: easy | medium | hard (IA del gioco), random (casuale), greedy (avido).
 * Report: Documentazione/AI_SELFPLAY_LATEST.md (+ .json con i dati grezzi aggregati).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runPairing } from '../src/game/sim/selfPlay.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_MD = path.join(ROOT, 'Documentazione/AI_SELFPLAY_LATEST.md');
const REPORT_JSON = path.join(ROOT, 'Documentazione/AI_SELFPLAY_LATEST.json');

const DEFAULT_PAIRINGS = [
  'easy:medium',
  'medium:hard',
  'easy:hard',
  'easy:random',
  'medium:random',
  'hard:random',
  'easy:greedy',
  'medium:greedy',
  'hard:greedy',
  'greedy:random',
];
const DEFAULT_MODES = ['classic', 'bareHands'];
const LABEL = {
  easy: 'Facile',
  medium: 'Normale',
  hard: 'Difficile',
  random: 'Casuale',
  greedy: 'Avido',
  classic: 'Classico',
  bareHands: 'Mani nude',
};

function parseArgs(argv) {
  const args = { n: 40, seedBase: 1000, modes: DEFAULT_MODES, pairings: DEFAULT_PAIRINGS };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = () => argv[++i];
    if (key === '--n') args.n = Number(next());
    else if (key === '--seed-base') args.seedBase = Number(next());
    else if (key === '--modes') args.modes = next().split(',');
    else if (key === '--pairings') args.pairings = next().split(',');
    else if (key === '--out-dir') args.outDir = next();
    else if (key === '--in-dir') args.inDir = next();
    else if (key === '--only-run') args.onlyRun = true;
    else if (key === '--only-report') args.onlyReport = true;
    else throw new Error(`Argomento sconosciuto: ${key}`);
  }
  return args;
}

// ------------------------------------------------------------------
// Statistiche
// ------------------------------------------------------------------

function mean(values) {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

/** Intervallo di Wilson al 95% sul punteggio (pareggio = mezzo punto). */
function wilson(score, n) {
  if (!n) return [0, 0];
  const z = 1.96;
  const p = score / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(centre - margin) / denom, (centre + margin) / denom];
}

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function aggregate(records) {
  const n = records.length;
  const wins = records.filter((r) => r.outcome === 'win').length;
  const losses = records.filter((r) => r.outcome === 'loss').length;
  const draws = n - wins - losses;
  const score = wins + draws / 2;
  const [lo, hi] = wilson(score, n);
  const reasons = {};
  for (const r of records) {
    const key = `${r.outcome}:${r.reason}`;
    reasons[key] = (reasons[key] || 0) + 1;
  }
  const opened = records.filter((r) => r.aOpened);
  const notOpened = records.filter((r) => !r.aOpened);
  const scoreOf = (list) =>
    list.length ? (list.filter((r) => r.outcome === 'win').length + list.filter((r) => r.outcome === 'draw').length / 2) / list.length : null;
  return {
    n,
    wins,
    losses,
    draws,
    score: n ? score / n : 0,
    ci: [lo, hi],
    reasons,
    rounds: mean(records.map((r) => r.rounds)),
    focusA: mean(records.flatMap((r) => r.statsA.focus)),
    focusB: mean(records.flatMap((r) => r.statsB.focus)),
    fixesA: records.reduce((s, r) => s + r.statsA.fixes, 0),
    fixesB: records.reduce((s, r) => s + r.statsB.fixes, 0),
    scoreWhenAOpens: scoreOf(opened),
    scoreWhenBOpens: scoreOf(notOpened),
  };
}

function timingFor(records, agent) {
  const lead = [];
  const respond = [];
  for (const r of records) {
    if (r.a === agent) {
      lead.push(...r.statsA.leadMs);
      respond.push(...r.statsA.respondMs);
    }
    if (r.b === agent) {
      lead.push(...r.statsB.leadMs);
      respond.push(...r.statsB.respondMs);
    }
  }
  const pack = (v) => ({ n: v.length, mean: mean(v), p95: percentile(v, 95), max: v.length ? Math.max(...v) : 0 });
  return { lead: pack(lead), respond: pack(respond) };
}

// ------------------------------------------------------------------
// Esecuzione
// ------------------------------------------------------------------

function fileNameFor(mode, pairing) {
  return `${mode}__${pairing.replace(':', '-vs-')}.json`;
}

function runAll(args) {
  const seeds = Array.from({ length: args.n }, (_, i) => args.seedBase + i);
  const all = [];
  for (const mode of args.modes) {
    for (const pairing of args.pairings) {
      const [a, b] = pairing.split(':');
      const started = Date.now();
      let done = 0;
      const records = runPairing({
        a,
        b,
        mode,
        seeds,
        onMatch: () => {
          done += 1;
          if (done % 20 === 0) process.stdout.write(`  ${mode} ${pairing}: ${done}/${seeds.length * 2}\n`);
        },
      });
      const agg = aggregate(records);
      console.log(
        `${mode} ${pairing}: ${a} ${pct(agg.score)} [${pct(agg.ci[0])}–${pct(agg.ci[1])}] ` +
          `(${agg.wins}V ${agg.draws}N ${agg.losses}P) in ${((Date.now() - started) / 1000).toFixed(1)} s`
      );
      if (args.outDir) {
        fs.mkdirSync(args.outDir, { recursive: true });
        fs.writeFileSync(path.join(args.outDir, fileNameFor(mode, pairing)), JSON.stringify(records));
      }
      all.push(...records);
    }
  }
  return all;
}

function loadDir(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

// ------------------------------------------------------------------
// Report
// ------------------------------------------------------------------

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return 'n/d';
  }
}

function reasonText(reasons) {
  const names = { fields: 'Campi', hp: 'PV a zero', supremacy: 'Supremazia', fields_tiebreak: 'spareggio Campi', draw: 'pareggio' };
  return Object.entries(reasons)
    .filter(([key]) => key.startsWith('win:'))
    .sort((x, y) => y[1] - x[1])
    .map(([key, count]) => `${names[key.slice(4)] || key.slice(4)} ${count}`)
    .join(', ') || '—';
}

function buildReport(records) {
  const modes = [...new Set(records.map((r) => r.mode))];
  const pairings = [...new Set(records.map((r) => `${r.a}:${r.b}`))];
  const seeds = new Set(records.map((r) => r.seed));
  const lines = [];
  lines.push('# Banco di prova IA — partite IA contro IA');
  lines.push('');
  lines.push(`Generato: ${new Date().toISOString()} · commit \`${gitCommit()}\``);
  lines.push(`Macchina: ${os.cpus()[0]?.model ?? 'n/d'} · Node ${process.version}`);
  lines.push(`Semi per accoppiamento: ${seeds.size}; ogni seme si gioca due volte a lati scambiati (stesse mani e stessi Campi).`);
  lines.push('');
  lines.push('Comando: `npm run selfplay:ai` (vedi `scripts/ai-selfplay.mjs`).');
  lines.push('Motore: `src/game/sim/headlessMatch.js` (regole Classico / Mani nude, senza Eminenze; chi raggiunge la maggioranza dei Campi ai turni 3-4 rivendica sempre la vittoria).');
  lines.push('');
  lines.push('Punteggio = vittorie + metà pareggi, sul totale, per il primo agente dell’accoppiamento. IC = intervallo di Wilson al 95%.');
  lines.push('Riferimenti: **Casuale** (Campo, Agente e FC a caso) e **Avido** (Agente più forte, quota equa di FC, primo Campo).');
  lines.push('');

  for (const mode of modes) {
    lines.push(`## ${LABEL[mode] || mode}`);
    lines.push('');
    lines.push('| A contro B | Partite | Punteggio A | IC 95% | V / N / P | A vince per | Turni medi | FC medi A / B | Punteggio A se apre / se apre B |');
    lines.push('|---|---:|---:|---|---|---|---:|---|---|');
    for (const pairing of pairings) {
      const recs = records.filter((r) => r.mode === mode && `${r.a}:${r.b}` === pairing);
      if (!recs.length) continue;
      const [a, b] = pairing.split(':');
      const g = aggregate(recs);
      const openScores =
        g.scoreWhenAOpens == null || g.scoreWhenBOpens == null
          ? '—'
          : `${pct(g.scoreWhenAOpens)} / ${pct(g.scoreWhenBOpens)}`;
      lines.push(
        `| ${LABEL[a] || a} – ${LABEL[b] || b} | ${g.n} | **${pct(g.score)}** | ${pct(g.ci[0])}–${pct(g.ci[1])} | ${g.wins} / ${g.draws} / ${g.losses} | ${reasonText(g.reasons)} | ${g.rounds.toFixed(2)} | ${g.focusA.toFixed(2)} / ${g.focusB.toFixed(2)} | ${openScores} |`
      );
      if (g.fixesA || g.fixesB) {
        lines.push(`| ↳ mosse illegali corrette: A ${g.fixesA}, B ${g.fixesB} | | | | | | | | |`);
      }
    }
    lines.push('');
  }

  const agents = [...new Set(records.flatMap((r) => [r.a, r.b]))].filter((x) => ['easy', 'medium', 'hard'].includes(x));
  lines.push('## Tempi di decisione dell’IA (ms)');
  lines.push('');
  lines.push('Con l’iniziativa la decisione è congiunta (Campo + Agente + FC); in risposta il Campo è già fissato.');
  lines.push('');
  lines.push('| Livello | Modalità | Con iniziativa: media / p95 / max | In risposta: media / p95 / max |');
  lines.push('|---|---|---|---|');
  for (const agent of ['easy', 'medium', 'hard'].filter((x) => agents.includes(x))) {
    for (const mode of modes) {
      const t = timingFor(records.filter((r) => r.mode === mode), agent);
      const fmt = (x) => `${x.mean.toFixed(0)} / ${x.p95.toFixed(0)} / ${x.max.toFixed(0)}`;
      lines.push(`| ${LABEL[agent]} | ${LABEL[mode] || mode} | ${fmt(t.lead)} | ${fmt(t.respond)} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function summaryJson(records) {
  const out = {};
  for (const r of records) {
    const key = `${r.mode}|${r.a}:${r.b}`;
    (out[key] ||= []).push(r);
  }
  return {
    generated: new Date().toISOString(),
    commit: gitCommit(),
    pairings: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, aggregate(v)])),
  };
}

// ------------------------------------------------------------------

const args = parseArgs(process.argv.slice(2));
let records = [];
if (!args.onlyReport) records = runAll(args);
if (args.onlyReport) records = loadDir(args.inDir);
if (!args.onlyRun) {
  fs.writeFileSync(REPORT_MD, `${buildReport(records)}\n`);
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(summaryJson(records), null, 2)}\n`);
  console.log(`Report: ${path.relative(ROOT, REPORT_MD)}`);
}
