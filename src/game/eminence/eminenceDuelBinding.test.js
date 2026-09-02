import test from 'node:test';
import assert from 'node:assert/strict';

import { SIDES } from './eminenceConstants.js';
import { powerResolutionFromDuel, consumeHpDeltas } from './eminenceDuelBinding.js';

test('risoluzione Potere: scatta solo se il trigger è vero e non bloccato', () => {
  const overdrive = { ability: { trigger: 'overdrive' } };
  const resolved = powerResolutionFromDuel({
    battleResult: { playerAbilityTriggered: true, playerAbilityBlocked: false },
    playerAgent: overdrive,
    enemyAgent: overdrive,
  });
  assert.equal(resolved.powerResolvedBySide[SIDES.PLAYER], true);
  assert.equal(resolved.activatedTriggerBySide[SIDES.PLAYER], 'overdrive');

  const blocked = powerResolutionFromDuel({
    battleResult: { playerAbilityTriggered: true, playerAbilityBlocked: true },
    playerAgent: overdrive,
  });
  assert.equal(blocked.powerResolvedBySide[SIDES.PLAYER], false);
  assert.equal(blocked.activatedTriggerBySide[SIDES.PLAYER], null);

  const unsatisfied = powerResolutionFromDuel({
    battleResult: { playerAbilityTriggered: false, playerAbilityBlocked: false },
    playerAgent: overdrive,
  });
  assert.equal(unsatisfied.powerResolvedBySide[SIDES.PLAYER], false);
  assert.equal(unsatisfied.activatedTriggerBySide[SIDES.PLAYER], null);
});

test('PV già riscossi: il Duello non ribatte i delta dell\'HUD', () => {
  const bundle = {
    hpDeltas: [
      { side: SIDES.PLAYER, amount: -3 },
      { side: SIDES.ENEMY, amount: -2 },
    ],
  };
  const next = consumeHpDeltas(bundle, { player: -3 });
  assert.deepEqual(next.hpDeltas, [{ side: SIDES.ENEMY, amount: -2 }]);
});
