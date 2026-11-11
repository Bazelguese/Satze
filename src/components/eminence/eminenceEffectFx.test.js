import test from 'node:test';
import assert from 'node:assert/strict';

import { CINEMATIC_RECIPES as R } from '../../game/eminence/eminenceCinematics.js';
import { EFFECT_FX_THEMES, planEffectFx, semaforoLamp } from './eminenceEffectFx.js';
import { ARMY_ENTRY } from '../../lib/eminenzaEntry.js';

const flight = (to) => ({ accent: '#fff', from: { type: 'card', side: 'player' }, to });
const src = { side: 'player', army: 'Corte Rossa', accent: '#f8504f' };

test('effetti: Agente proprio = boon, Agente nemico = bane', () => {
  const own = planEffectFx([{ recipe: R.LINK_AGENT, flight: flight({ type: 'field-agent', side: 'player' }) }], src);
  const foe = planEffectFx([{ recipe: R.LINK_AGENT, flight: flight({ type: 'field-agent', side: 'enemy' }) }], src);
  assert.equal(own[0].kind, 'boon');
  assert.equal(foe[0].kind, 'bane');
  assert.equal(own[0].theme, 'corte');
  assert.deepEqual(own[0].from, { type: 'announce', side: 'player' });
});

test('effetti: Campo, PV, e niente doppioni sullo stesso bersaglio', () => {
  const plan = planEffectFx([
    { recipe: R.SLOT_CURSE, flight: flight({ type: 'slot', id: 2 }) },
    { recipe: R.FIELD_RULE, flight: flight({ type: 'slot', id: 2 }) },
    { recipe: R.HP_TICK, flight: flight({ type: 'hp', side: 'enemy' }) },
  ], src);
  assert.deepEqual(plan.map((p) => p.kind), ['slot', 'hp']);
});

test('effetti: senza bersaglio visibile resta il motivo sull\'avviso; il Mancato non mostra nulla', () => {
  assert.equal(planEffectFx([{ recipe: R.REVEAL_OPEN, flight: flight({ type: 'announce', side: 'player' }) }], src)[0].kind, 'aura');
  assert.equal(planEffectFx([{ recipe: R.PRESENCE_PULSE, flight: flight({ type: 'presence', side: 'player' }) }], src)[0].kind, 'aura');
  assert.equal(planEffectFx([], src)[0].kind, 'aura');
  assert.deepEqual(planEffectFx([{ recipe: R.MISS_DIM, flight: null }], src), []);
  assert.deepEqual(planEffectFx([], {}), []);
});

test('effetti: il Semaforo prende il colore della luce dal nome dell\'abilità', () => {
  assert.equal(semaforoLamp('Rosso'), '#ff3b3b');
  assert.equal(semaforoLamp('Altro'), null);
  const plan = planEffectFx([], { side: 'enemy', army: 'Patto degli Indocili', accent: '#e867c3', abilityName: 'Giallo' });
  assert.equal(plan[0].lamp, '#ffc933');
  assert.equal(planEffectFx([], src)[0].lamp, null);
});

test('effetti: ogni armata ha il suo motivo', () => {
  assert.deepEqual([...EFFECT_FX_THEMES].sort(), [...new Set(Object.values(ARMY_ENTRY))].sort());
});
