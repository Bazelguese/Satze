/**
 * Snapshot dell'output osservabile dell'harness `tools/eminence-trace-lib.mjs`.
 * Aggiorna con: UPDATE_SNAPSHOTS=1 npm run test:unit
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

import {
  FIXTURES_DIR,
  loadScenario,
  runTrace,
  stableStringify,
} from '../../../tools/eminence-trace-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(HERE, '__snapshots__');
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1';

function listFixtures() {
  return fs
    .readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort();
}

describe('eminence trace harness snapshots', () => {
  if (UPDATE) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  for (const fileName of listFixtures()) {
    const fixtureName = path.basename(fileName, '.json');
    test(fixtureName, () => {
      const scenario = loadScenario(path.join(FIXTURES_DIR, fileName));
      const trace = runTrace(scenario);
      const actual = `${stableStringify(trace)}\n`;
      const snapshotPath = path.join(SNAPSHOT_DIR, `${fixtureName}.json`);

      if (UPDATE) {
        fs.writeFileSync(snapshotPath, actual, 'utf8');
        assert.ok(true);
        return;
      }

      assert.ok(
        fs.existsSync(snapshotPath),
        `Manca snapshot ${snapshotPath}. Genera con UPDATE_SNAPSHOTS=1 npm run test:unit`,
      );
      const expected = fs.readFileSync(snapshotPath, 'utf8');
      assert.equal(actual, expected);
    });
  }
});
