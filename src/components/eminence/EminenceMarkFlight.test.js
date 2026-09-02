import test from 'node:test';
import assert from 'node:assert/strict';

import { addedIds, curseSlotKeys, normalizeFlight } from './eminenceMarkCinematic.js';

test('marchi: solo gli id nuovi contano come prima creazione', () => {
  assert.deepEqual(addedIds(new Set([102]), [102, 116]), [116]);
  assert.deepEqual(addedIds(new Set([102, 116]), [102, 116]), []);
});

test('slot: un Campo già maledetto non è una nuova creazione', () => {
  assert.deepEqual(curseSlotKeys({ 2: [{ deltas: {} }], 4: [] }), [2]);
  assert.deepEqual(curseSlotKeys({}), []);
});

test('scia: normalizza un volo marchio verso la mano', () => {
  const buff = normalizeFlight({
    fromSide: 'player',
    kind: 'prey',
    id: 7,
  });
  assert.deepEqual(buff.from, { type: 'card', side: 'player' });
  assert.deepEqual(buff.to, { type: 'hand', id: 7 });
});
