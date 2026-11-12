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

test('effetti: le abilità senza ricetta trovano comunque il loro bersaglio', () => {
  const plan = (payoffs) => planEffectFx([], { ...src, payoffs }).map((p) => `${p.kind}:${p.to?.type}:${p.to?.side ?? ''}`);
  assert.deepEqual(plan([{ primitive: 'BLOCK_POWER', target: 'OWN_AGENT' }]), ['bane:field-agent:player']);
  assert.deepEqual(plan([{ primitive: 'BLOCK_POWER', target: 'ENEMY_AGENT' }]), ['bane:field-agent:enemy']);
  assert.deepEqual(plan([{ primitive: 'REPLACE_ABILITY', target: 'OWN_AGENT' }]), ['boon:field-agent:player']);
  assert.deepEqual(plan([{ primitive: 'MIRROR_UNSATISFIED_POWER', target: null }]), ['boon:field-agent:player', 'bane:field-agent:enemy']);
  assert.deepEqual(plan([{ primitive: 'MARK_CARD', target: null }]), ['bane:hand:enemy']);
  assert.deepEqual(plan([{ primitive: 'MARK_CARD', target: 'OWN_AGENT' }]), ['boon:field-agent:player']);
  assert.deepEqual(plan([{ primitive: 'CONSTRAIN_DEPLOY', target: 'SELF' }]), ['boon:hand:player']);
  assert.deepEqual(plan([{ primitive: 'PROPOSE_DEAL', target: null }]), ['hp:hp:enemy']);
  assert.deepEqual(plan([{ primitive: 'GRANT_POOL_FOCUS', target: 'SELF' }, { primitive: 'GRANT_POOL_FOCUS', target: 'SELF' }]), ['hp:fc:player']);
  // Presenza propria: resta alle scintille; Presenza tolta all'avversario: sul suo contatore o sulla sua targa
  assert.deepEqual(plan([{ primitive: 'CHANGE_PRESENCE', target: 'SELF' }]), ['aura:undefined:']);
  const steal = planEffectFx([], { ...src, payoffs: [{ primitive: 'CHANGE_PRESENCE', target: 'OPPONENT' }] });
  assert.deepEqual(steal[0].to, { type: 'presence', side: 'enemy' });
  assert.deepEqual(steal[0].fallback, { type: 'hp', side: 'enemy' });
});

test('effetti: ogni armata ha il suo motivo', () => {
  assert.deepEqual([...EFFECT_FX_THEMES].sort(), [...new Set(Object.values(ARMY_ENTRY))].sort());
});

// ── motore ────────────────────────────────────────────────────────────
import { createEffectRun, EFFECT_FX_DURATION_MS, EFFECT_FX_ENGINE_THEMES } from './effectFxEngine.js';
import { EFFECT_FX_KINDS } from './eminenceEffectFx.js';

/** Contesto finto: accetta qualunque chiamata e conta i disegni. */
function fakeCtx() {
  const calls = { n: 0 };
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient;
      return () => { calls.n += 1; };
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  return { ctx, calls };
}

test('motore: ogni motivo del piano ha il suo disegno', () => {
  assert.deepEqual([...EFFECT_FX_ENGINE_THEMES].sort(), [...EFFECT_FX_THEMES].sort());
});

test('motore: tutti i motivi e i tipi si disegnano dall\'inizio alla fine senza errori', () => {
  const g = { x1: 200, y1: 700, x2: 800, y2: 400, tw: 190, th: 290 };
  for (const theme of EFFECT_FX_ENGINE_THEMES) {
    for (const kind of Object.values(EFFECT_FX_KINDS)) {
      const run = createEffectRun({ theme, kind, accent: '#e867c3', lamp: '#ffc933', g });
      const { ctx, calls } = fakeCtx();
      for (let t = 0; t <= EFFECT_FX_DURATION_MS; t += 40) run.draw(ctx, t);
      assert.ok(calls.n > 50, `${theme}/${kind} disegna troppo poco (${calls.n})`);
      const before = calls.n;
      run.draw(ctx, EFFECT_FX_DURATION_MS + 1);
      run.draw(ctx, -1);
      assert.equal(calls.n, before, `${theme}/${kind} disegna fuori dalla sua durata`);
    }
  }
});
