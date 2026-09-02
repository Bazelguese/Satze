import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CINEMATIC_RECIPES,
  resolveNoticeCinematics,
  playNoticeCinematics,
} from './eminenceCinematics.js';
import { ANNOUNCE_PHASES } from './eminenceAnnounceLabels.js';
import { EMINENCE_PRIMITIVES as P } from './eminenceConstants.js';

const accents = { player: '#aabb00', enemy: '#ff5500' };

const deployedCtx = {
  accents,
  agentsDeployed: { player: true, enemy: true },
  agentIds: { player: 7, enemy: 102 },
};

test('cinematics: setup non produce cue', () => {
  assert.deepEqual(resolveNoticeCinematics({ kind: 'setup', side: 'player' }), []);
});

test('cinematics: Preda schierata non collega l\'Agente al testo, pulsa la Presenza', () => {
  const cues = resolveNoticeCinematics({
    id: 'x',
    side: 'player',
    phase: ANNOUNCE_PHASES.VERIFY,
    origin: 'deployed_mark',
    markCardId: 102,
    outcome: 'hit',
    presenceDelta: 2,
    payoffs: [{ primitive: P.CHANGE_PRESENCE, target: 'SELF', slot: null }],
  }, deployedCtx);

  assert.equal(cues.length, 1);
  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.PRESENCE_PULSE);
  assert.deepEqual(cues[0].flight.from, { type: 'card', side: 'player' });
  assert.deepEqual(cues[0].flight.to, { type: 'presence', side: 'player' });
  assert.equal(cues.some((cue) => cue.flight?.from?.type === 'field-agent'), false);
  assert.equal(cues.some((cue) => cue.flight?.to?.type === 'announce'), false);
});

test('cinematics: Preda assente → niente volo', () => {
  const cues = resolveNoticeCinematics({
    id: 'x',
    side: 'player',
    phase: ANNOUNCE_PHASES.MISS,
    origin: 'deployed_mark',
    markCardId: 88,
    outcome: 'miss',
  }, deployedCtx);

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.MISS_DIM);
  assert.equal(cues[0].flight, null);
});

test('cinematics: maledizione di slot → SLOT_CURSE', () => {
  const cues = resolveNoticeCinematics({
    kind: 'reveal',
    side: 'player',
    phase: ANNOUNCE_PHASES.REVEAL,
    payoffs: [{ primitive: P.APPLY_SLOT_MODIFIER, target: null, slot: 2 }],
  }, { accents, agentsDeployed: { player: false, enemy: false } });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.SLOT_CURSE);
  assert.deepEqual(cues[0].flight.to, { type: 'slot', id: 2 });
});

test('cinematics: sostituzione Campo → FIELD_RULE', () => {
  const cues = resolveNoticeCinematics({
    kind: 'static',
    side: 'player',
    phase: ANNOUNCE_PHASES.PASSIVE,
    payoffs: [{ primitive: P.REPLACE_FIELD, target: null, slot: null }],
  }, { accents });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.FIELD_RULE);
  assert.equal(cues[0].flight.to.type, 'slot');
});

test('cinematics: cura / danno → HP_TICK sul lato giusto', () => {
  const heal = resolveNoticeCinematics({
    kind: 'effect',
    side: 'player',
    phase: ANNOUNCE_PHASES.RESOLVE,
    payoffs: [{ primitive: P.HEAL_HP, target: 'SELF', slot: null }],
  }, { accents });
  assert.equal(heal[0].recipe, CINEMATIC_RECIPES.HP_TICK);
  assert.deepEqual(heal[0].flight.to, { type: 'hp', side: 'player' });

  const lose = resolveNoticeCinematics({
    kind: 'reveal',
    side: 'player',
    phase: ANNOUNCE_PHASES.REVEAL,
    payoffs: [
      { primitive: P.MODIFY_STAT, target: 'OWN_AGENT', slot: null },
      { primitive: P.LOSE_HP, target: 'SELF', slot: null },
    ],
  }, { accents, agentsDeployed: { player: true, enemy: false } });
  assert.equal(lose[0].recipe, CINEMATIC_RECIPES.LINK_AGENT);
  assert.equal(lose[1].recipe, CINEMATIC_RECIPES.HP_TICK);
});

test('cinematics: Presenza → PRESENCE_PULSE, non verso l\'Agente', () => {
  const cues = resolveNoticeCinematics({
    kind: 'effect',
    side: 'player',
    phase: ANNOUNCE_PHASES.RESOLVE,
    presenceDelta: 1,
    payoffs: [{ primitive: P.CHANGE_PRESENCE, target: 'SELF', slot: null }],
  }, { accents, agentsDeployed: { player: true, enemy: true } });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.PRESENCE_PULSE);
  assert.equal(cues[0].flight.to.type, 'presence');
});

test('cinematics: rivelazione senza payoff visivo → REVEAL_OPEN verso banner', () => {
  const cues = resolveNoticeCinematics({
    kind: 'reveal',
    side: 'enemy',
    phase: ANNOUNCE_PHASES.REVEAL,
  }, { accents, agentsDeployed: { player: false, enemy: false } });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.REVEAL_OPEN);
  assert.equal(cues[0].flight.from.type, 'card');
  assert.equal(cues[0].flight.to.type, 'announce');
  assert.equal(cues[0].holdAnnounce, true);
  assert.equal(cues[0].flight.accent, '#ff5500');
});

test('cinematics: trigger / bonus con Agente in campo → LINK_AGENT', () => {
  const cues = resolveNoticeCinematics({
    kind: 'reveal',
    side: 'player',
    phase: ANNOUNCE_PHASES.REVEAL,
    payoffs: [{ primitive: P.FORCE_TRIGGER, target: 'OWN_AGENT', slot: null }],
  }, { accents, agentsDeployed: { player: true, enemy: false } });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.LINK_AGENT);
  assert.equal(cues[0].flight.to.type, 'field-agent');
  assert.deepEqual(cues[0].waitFor, { type: 'field-agent', side: 'player' });
});

test('cinematics: passivo senza primitive visive → PASSIVE_AURA', () => {
  const cues = resolveNoticeCinematics({
    kind: 'static',
    side: 'player',
    phase: ANNOUNCE_PHASES.PASSIVE,
  }, { accents });

  assert.equal(cues[0].recipe, CINEMATIC_RECIPES.PASSIVE_AURA);
  assert.equal(cues[0].flight, null);
});

test('playNoticeCinematics: hold announce sul volo VERIFY', () => {
  const calls = [];
  playNoticeCinematics([{
    recipe: CINEMATIC_RECIPES.VERIFY_LINK,
    flight: { accent: '#fff', from: { type: 'card', side: 'player' }, to: { type: 'announce', side: 'player' } },
    holdAnnounce: true,
  }], {
    playLink: (flight, cb) => calls.push({ flight, cb }),
    noticeId: 'n1',
    setAnnounceHeldId: (id) => calls.push({ held: id }),
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].held, 'n1');
  assert.equal(typeof calls[1].cb, 'function');
});

test('playNoticeCinematics: attende l\'ingresso prima del volo', async () => {
  const calls = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const done = playNoticeCinematics([{
    recipe: CINEMATIC_RECIPES.VERIFY_LINK,
    flight: { accent: '#fff', from: { type: 'field-agent', side: 'enemy' }, to: { type: 'announce', side: 'player' } },
    holdAnnounce: true,
    waitFor: { type: 'field-agent', side: 'enemy' },
  }], {
    playLink: (flight, cb) => calls.push({ flight, cb }),
    noticeId: 'n2',
    setAnnounceHeldId: (id) => calls.push({ held: id }),
    waitForEntrance: () => gate,
  });

  assert.deepEqual(calls, [{ held: 'n2' }]);
  release();
  await gate;
  await Promise.resolve();
  assert.equal(calls.length, 2);
  calls[1].cb();
  await done;
});

test('playNoticeCinematics: esegue i voli in coda', async () => {
  const flights = [];
  await playNoticeCinematics([
    {
      recipe: CINEMATIC_RECIPES.VERIFY_LINK,
      flight: { accent: '#fff', from: { type: 'field-agent', side: 'enemy' }, to: { type: 'announce', side: 'player' } },
      holdAnnounce: true,
    },
    {
      recipe: CINEMATIC_RECIPES.PRESENCE_PULSE,
      flight: { accent: '#fff', from: { type: 'announce', side: 'player' }, to: { type: 'presence', side: 'player' } },
    },
  ], {
    playLink: (flight, cb) => {
      flights.push(flight.to.type);
      cb?.();
    },
    noticeId: 'n3',
    setAnnounceHeldId: () => {},
  });
  assert.deepEqual(flights, ['announce', 'presence']);
});
