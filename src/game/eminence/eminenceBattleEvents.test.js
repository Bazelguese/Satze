import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBattleEventEmitter } from '../duel/battleEventTypes.js';
import { createBattleLogChannel } from '../duel/battleEventEmit.js';
import { formatBattleEvent } from '../duel/formatBattleEvent.js';
import { isCompactEligible } from '../duel/battleEventSelectors.js';
import { SIDES } from './eminenceConstants.js';
import { emitEminenceDeployEvents } from './eminenceBattleEvents.js';

test('deploy: i FC temporanei sono distinti dagli investiti', () => {
  const emitter = createBattleEventEmitter(1);
  const channel = createBattleLogChannel(emitter, { dualStrings: false });

  emitEminenceDeployEvents(channel, {
    temporaryFocus: { [SIDES.PLAYER]: 2, [SIDES.ENEMY]: 0 },
    logs: [{ primitive: 'GRANT_TEMPORARY_FOCUS', source: 'test_grant', ownerSide: SIDES.PLAYER }],
    hpDeltas: [],
  }, {
    playerHPBefore: 20,
    enemyHPBefore: 20,
    playerHPAfter: 20,
    enemyHPAfter: 20,
    pAgent: { id: 'p', name: 'Lama' },
    eAgent: { id: 'e', name: 'Ombra' },
    statDeltas: {},
    focusInvestedBySide: { [SIDES.PLAYER]: 1, [SIDES.ENEMY]: 2 },
  });

  const event = emitter.events.find((entry) => entry.infoCode === 'temporaryFocus');
  assert.ok(event);
  assert.deepEqual(event.data, { invested: 1, temporary: 2, effective: 3 });
  assert.equal(event.source?.id, 'test_grant');
  assert.equal(formatBattleEvent(event).text, 'Lama: 3 FC (1 investiti + 2 temporanei)');
  assert.equal(isCompactEligible(event), true);
  assert.equal(
    emitter.events.some((entry) => entry.infoCode === 'temporaryFocus' && entry.target?.side === 'opponent'),
    false,
  );
});
