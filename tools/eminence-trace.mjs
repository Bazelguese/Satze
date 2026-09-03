#!/usr/bin/env node
/**
 * SATZE — Harness di traccia Eminenza (lettore, non motore).
 *
 * Uso:
 *   node tools/eminence-trace.mjs --eminence <id> --ability <id> [--json]
 *   node tools/eminence-trace.mjs --scenario tools/fixtures/eminence/<nome>.json [--json]
 *   node tools/eminence-trace.mjs --gaps
 *   node tools/eminence-trace.mjs --scaffold
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runTrace,
  formatTraceHuman,
  findCatalogGaps,
  formatGapsHuman,
  scaffoldFixtures,
  loadScenario,
  scenarioFromFlags,
  stableStringify,
  DEFAULTS_PATH,
  FIXTURES_DIR,
} from './eminence-trace-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json' || arg === '--gaps' || arg === '--scaffold' || arg === '--force') {
      flags[arg.slice(2)] = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value == null || value.startsWith('--')) flags[key] = true;
      else {
        flags[key] = value;
        i += 1;
      }
    }
  }
  return flags;
}

function usage() {
  return `Uso:
  node tools/eminence-trace.mjs --eminence <id> --ability <id> [--json]
  node tools/eminence-trace.mjs --scenario <file.json> [--json]
  node tools/eminence-trace.mjs --gaps
  node tools/eminence-trace.mjs --scaffold [--force]

Defaults: ${DEFAULTS_PATH}`;
}

const flags = parseArgs(process.argv.slice(2));

if (flags.gaps) {
  const report = findCatalogGaps();
  process.stdout.write(formatGapsHuman(report));
  process.exit(report.ok ? 0 : 1);
}

if (flags.scaffold) {
  const result = scaffoldFixtures({ root: ROOT, force: Boolean(flags.force) });
  process.stdout.write(
    `Scaffold: ${result.written.length} nuovi, ${result.skipped.length} già presenti → ${path.relative(ROOT, FIXTURES_DIR)}\n`,
  );
  process.exit(0);
}

let scenario;
try {
  if (flags.scenario) {
    scenario = loadScenario(path.resolve(ROOT, flags.scenario));
  } else if (flags.eminence && flags.ability) {
    scenario = scenarioFromFlags({
      eminenceId: flags.eminence,
      abilityId: flags.ability,
      branch: flags.branch || 'hit',
    });
  } else {
    console.error(usage());
    process.exit(2);
  }
} catch (err) {
  console.error(`Fixture/scenario: ${err.message}`);
  process.exit(2);
}

let trace;
try {
  trace = runTrace(scenario);
} catch (err) {
  console.error(`Traccia interrotta: ${err.message}`);
  process.exit(1);
}

if (flags.json) process.stdout.write(`${stableStringify(trace)}\n`);
else process.stdout.write(formatTraceHuman(trace));
