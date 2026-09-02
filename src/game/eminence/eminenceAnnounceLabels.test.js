import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANNOUNCE_PHASES,
  PHASE_COLORS,
  enrichNotice,
} from './eminenceAnnounceLabels.js';
import { REVEAL_GATES, SIDES } from './eminenceConstants.js';

test('enrichNotice: setup', () => {
  const notice = enrichNotice({
    id: 'x',
    side: SIDES.PLAYER,
    kind: 'setup',
    name: 'Istinto Predatorio',
    text: 'Scegli una Preda.',
  });
  assert.equal(notice.phase, ANNOUNCE_PHASES.SETUP);
  assert.equal(notice.phaseLabel, 'Preparazione');
  assert.equal(notice.phaseDetail, 'Prima dello Scontro');
  assert.equal(notice.phaseColor, PHASE_COLORS[ANNOUNCE_PHASES.SETUP]);
  assert.equal(notice.badgeText, 'Preparazione · Prima dello Scontro');
  assert.match(notice.hint, /bersaglio/i);
});

test('enrichNotice: passivo always-on vs triggered', () => {
  const always = enrichNotice({
    kind: 'static',
    side: SIDES.PLAYER,
    staticMode: 'always',
    name: 'Ordine',
    text: 'Agenti prima del Campo.',
  });
  assert.equal(always.phase, ANNOUNCE_PHASES.PASSIVE);
  assert.equal(always.phaseDetail, 'Regola attiva');

  const triggered = enrichNotice({
    kind: 'static',
    side: SIDES.PLAYER,
    staticMode: 'triggered',
    roundNumber: 5,
    name: 'Ora Verde',
    text: 'Campo sostituito.',
  });
  assert.equal(triggered.phaseDetail, 'Scatta ora · Round 5');
});

test('enrichNotice: rivelazione con gate', () => {
  const notice = enrichNotice({
    kind: 'reveal',
    side: SIDES.ENEMY,
    gate: REVEAL_GATES.PRE_AGENT,
    name: 'Gorgoglio',
    text: 'Scegli una Preda.',
    presenceDelta: 0,
  });
  assert.equal(notice.phase, ANNOUNCE_PHASES.REVEAL);
  assert.equal(notice.phaseColor, PHASE_COLORS[ANNOUNCE_PHASES.REVEAL]);
  assert.equal(notice.phaseDetail, 'Prima dell\'Agente');
  assert.equal(notice.ownerLabel, 'Eminenza avversaria');
});

test('enrichNotice: verifica vs risoluzione vs mancato', () => {
  const verify = enrichNotice({
    kind: 'effect',
    origin: 'deployed_mark',
    outcome: 'hit',
    side: SIDES.PLAYER,
    name: 'Gorgoglio',
    text: 'Preda schierata: +2 Presenza.',
    presenceDelta: 2,
  });
  assert.equal(verify.phase, ANNOUNCE_PHASES.VERIFY);
  assert.equal(verify.phaseDetail, 'Agenti schierati');

  const resolve = enrichNotice({
    kind: 'effect',
    origin: 'applied_effect',
    outcome: 'hit',
    timing: 'AFTER_DUEL_OUTCOME',
    side: SIDES.PLAYER,
    name: 'Scommessa',
    text: 'Pronostico corretto.',
  });
  assert.equal(resolve.phase, ANNOUNCE_PHASES.RESOLVE);
  assert.equal(resolve.phaseDetail, 'Dopo il Duello');

  const miss = enrichNotice({
    kind: 'effect',
    origin: 'deployed_mark',
    outcome: 'miss',
    side: SIDES.PLAYER,
    name: 'Gorgoglio',
    text: 'Nessuna Preda schierata.',
  });
  assert.equal(miss.phase, ANNOUNCE_PHASES.MISS);
  assert.equal(miss.phaseColor, PHASE_COLORS[ANNOUNCE_PHASES.MISS]);
});
