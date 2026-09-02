import test from 'node:test';
import assert from 'node:assert/strict';

import { describeComposedPower, stampComposeParams } from './composeAbilityParams.js';

const SORETHAL = 101;
const TESSITRICE = 102;
const CONDENSATO = 106;

test('stamp: un Frammento sostituisce solo trigger o solo effetto', () => {
  const trigger = stampComposeParams({ fragmentCardId: SORETHAL, composeComponent: 'TRIGGER' });
  assert.equal(trigger.composedTrigger, 'overdrive');
  assert.equal(trigger.composedAbility, undefined);
  assert.deepEqual(trigger.fragmentCardIds, [SORETHAL]);

  const effect = stampComposeParams({ fragmentCardId: SORETHAL, composeComponent: 'EFFECT' });
  assert.equal(effect.composedTrigger, undefined);
  assert.deepEqual(effect.composedAbility, { effect: 'enemyAssault', value: -8, minAssault: 6 });
});

test('stamp: due Frammenti compongono trigger del primo ed effetto del secondo', () => {
  const stamped = stampComposeParams({ fragmentCardId: [SORETHAL, TESSITRICE] });
  assert.equal(stamped.composedTrigger, 'overdrive');
  assert.deepEqual(stamped.composedAbility, { effect: 'focusCoin', value: 2 });
  assert.equal(stamped.triggerFragmentId, SORETHAL);
  assert.equal(stamped.effectFragmentId, TESSITRICE);
  assert.deepEqual(stamped.fragmentCardIds, [SORETHAL, TESSITRICE]);
  assert.equal(stamped.composeComponent, undefined);
});

test('stamp: se il primo Frammento non ha trigger, i ruoli si invertono', () => {
  const stamped = stampComposeParams({ fragmentCardId: [CONDENSATO, SORETHAL] });
  assert.equal(stamped.triggerFragmentId, SORETHAL);
  assert.equal(stamped.effectFragmentId, CONDENSATO);
  assert.equal(stamped.composedTrigger, 'overdrive');
  assert.equal(stamped.composedAbility.effect, 'attrition');
});

test('riepilogo: due Frammenti mostrano il Potere composito prima della conferma', () => {
  const recap = describeComposedPower({ fragmentCardId: [SORETHAL, TESSITRICE] });
  assert.equal(recap, 'Nuovo potere: Overdrive: +2 FC');
});

test('riepilogo: un Frammento tiene esplicita la metà dell\'Agente schierato', () => {
  assert.equal(
    describeComposedPower({ fragmentCardId: SORETHAL, composeComponent: 'TRIGGER' }),
    "Nuovo potere: Overdrive + effetto dell'Agente schierato",
  );
  assert.equal(
    describeComposedPower({ fragmentCardId: SORETHAL, composeComponent: 'EFFECT' }),
    "Nuovo potere: trigger dell'Agente schierato + -8 VA nem. (min 6)",
  );
});

test('riepilogo: l\'alias di un solo Frammento resta opt-in', () => {
  assert.equal(describeComposedPower({ fragmentCardId: SORETHAL }), null);
  assert.equal(
    describeComposedPower({ fragmentCardId: SORETHAL }, { allowAlias: true }),
    'Il Potere potrà scattare anche con: Overdrive',
  );
});
