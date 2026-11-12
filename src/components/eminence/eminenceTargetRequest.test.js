import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveTargetRequest, targetParams, targetSelector } from './eminenceTargetRequest.js';

test('bersaglio: Preda, Agente e Campo', () => {
  const prey = resolveTargetRequest({ preyCardId: [11, 12] });
  assert.equal(prey.targetType, 'card');
  assert.equal(prey.mark, 'Preda');
  assert.deepEqual(targetParams(prey, 12), { preyCardId: 12 });
  assert.equal(targetSelector(prey, 12), '[data-hand-agent="12"]');
  const slot = resolveTargetRequest({ slot: [0, 2, 4] });
  assert.equal(slot.targetType, 'slot');
  assert.deepEqual(targetParams(slot, 2), { slot: 2 });
  assert.equal(targetSelector(slot, 2), '[data-field-slot="2"]');
});

test('bersaglio con opzione: Ascesa / Declassamento', () => {
  const req = resolveTargetRequest({ cardId: [7, 8], leagueDelta: [1, -1] });
  assert.equal(req.optionKey, 'leagueDelta');
  assert.deepEqual(req.options.map((o) => o.label), ['+1 Lega', '−1 Lega']);
  assert.deepEqual(targetParams(req, 8, -1), { cardId: 8, leagueDelta: -1 });
});

test('resta al menù: niente bersagli, sole opzioni, due Frammenti da comporre, più opzioni', () => {
  assert.equal(resolveTargetRequest(null), null);
  assert.equal(resolveTargetRequest({ preyCardId: [] }), null);
  assert.equal(resolveTargetRequest({ pronostico: ['A', 'B'] }), null);
  assert.equal(resolveTargetRequest({ fragmentCardId: [1, 2], composeComponent: ['TRIGGER', 'EFFECT'] }), null);
  assert.equal(resolveTargetRequest({ fragmentCardId: [1, 2], __limits: { fragmentCardId: { min: 2, max: 2 } } }), null);
  assert.equal(resolveTargetRequest({ cardId: [1], a: [1, 2], b: [3, 4] }), null);
});

test('Innesto: un Frammento, poi al posto del Potere o del Bonus', () => {
  const req = resolveTargetRequest({ fragmentCardId: [21, 22], graftInto: ['power', 'bonus'] });
  assert.equal(req.targetType, 'card');
  assert.equal(req.mark, 'Frammento');
  assert.equal(req.guide, 'Scegli un Frammento');
  assert.deepEqual(req.options.map((o) => o.label), ['Al posto del Potere', 'Al posto del Bonus']);
  assert.deepEqual(targetParams(req, 22, 'bonus'), { fragmentCardId: 22, graftInto: 'bonus' });
});
