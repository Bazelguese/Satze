import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEminenceChoiceView,
  isAwaitingEminenceChoice,
  shouldShowEminenceLayer,
  isEminenceTableInspectable,
  resolveEminenceChromeVisible,
  CHOICE_STATES,
  OPTION_BLOCKERS,
} from './eminenceChoiceView.js';
import { beginEminenceRound, selectEminenceAbility } from './eminenceRound.js';
import { createEminenceMatchState } from './eminenceState.js';
import { EMINENCE_FORMAT, SIDES } from './eminenceConstants.js';
import { inkOn, formatPresenceDelta, relativeLuminance } from '../../components/eminence/eminenceUi.js';

function match(player = 'apex_sole_verde', enemy = 'patto_grande_semaforo') {
  return beginEminenceRound(
    createEminenceMatchState({
      format: EMINENCE_FORMAT.REQUIRED,
      playerEminenceId: player,
      enemyEminenceId: enemy,
    }),
    { roundNumber: 1 }
  );
}

test('vista: il giocatore vede le opzioni legali e l\'avversario resta sigillato', () => {
  const view = buildEminenceChoiceView(match(), SIDES.PLAYER);

  assert.equal(view.enabled, true);
  assert.equal(view.self.state, CHOICE_STATES.CHOOSING);
  assert.equal(view.opponent.state, CHOICE_STATES.CHOOSING);
  assert.equal(view.opponent.selectedAbilityId, undefined);
  assert.ok(view.opponent.options.length >= 3);
  assert.ok(view.opponent.options.every((o) => o.selected === false));
  assert.ok(view.opponent.options.every((o) => typeof o.text === 'string' && o.text.length > 0));

  const legal = view.self.options.filter((o) => o.selectable).map((o) => o.id);
  assert.ok(legal.includes('apex_furia'));
  assert.ok(legal.includes('apex_disprezzo'));
  assert.equal(legal.includes('apex_cataclisma'), false);

  const cataclisma = view.self.options.find((o) => o.id === 'apex_cataclisma');
  assert.equal(cataclisma.blocker, OPTION_BLOCKERS.INSUFFICIENT_PRESENCE);
  assert.equal(isAwaitingEminenceChoice(view), true);
  assert.equal(shouldShowEminenceLayer(view, { gamePhase: 'selectField' }), true);
});

test('vista: dopo la conferma propria il tavolo resta fermo solo se l\'avversario non ha scelto', () => {
  const chosen = selectEminenceAbility(match(), SIDES.PLAYER, 'apex_disprezzo').matchState;
  const view = buildEminenceChoiceView(chosen, SIDES.PLAYER);

  assert.equal(view.self.state, CHOICE_STATES.LOCKED_HIDDEN);
  assert.equal(isAwaitingEminenceChoice(view), false);
  assert.equal(shouldShowEminenceLayer(view, { gamePhase: 'selectField' }), true);

  const both = selectEminenceAbility(chosen, SIDES.ENEMY, 'semaforo_giallo').matchState;
  const done = buildEminenceChoiceView(both, SIDES.PLAYER);
  assert.equal(shouldShowEminenceLayer(done, { gamePhase: 'selectField' }), false);
});

test('vista: due scelte segrete diverse producono la stessa proiezione avversaria', () => {
  const base = match();
  const a = selectEminenceAbility(base, SIDES.ENEMY, 'semaforo_verde').matchState;
  const b = selectEminenceAbility(base, SIDES.ENEMY, 'semaforo_giallo').matchState;

  const viewA = buildEminenceChoiceView(a, SIDES.PLAYER);
  const viewB = buildEminenceChoiceView(b, SIDES.PLAYER);

  assert.deepEqual(viewA.opponent, viewB.opponent);
  assert.equal(viewA.opponent.selectedAbilityId, undefined);
  assert.equal(viewA.opponent.hasSealedSelection, true);
});

test('giallo a segmenti vuoti resta un\'opzione implementata', () => {
  const view = buildEminenceChoiceView(match('patto_grande_semaforo', 'apex_sole_verde'), SIDES.PLAYER);
  const yellow = view.self.options.find((o) => o.id === 'semaforo_giallo');
  assert.equal(yellow.implemented, true);
  assert.equal(yellow.selectable, true);
});

test('inchiostro del costo: fondo chiaro scrive scuro', () => {
  assert.ok(relativeLuminance('#d5ecf9') > 0.42);
  assert.equal(inkOn('#d5ecf9'), '#0a0d12');
  assert.equal(inkOn('#437ef2'), '#f7f4ee');
  assert.equal(formatPresenceDelta(1), '+1');
  assert.equal(formatPresenceDelta(0), '±0');
  assert.equal(formatPresenceDelta(-2), '−2');
});

test('vista tavolo: il peek non ritarda la comparsa e dopo il lock si può riaprire', () => {
  const view = buildEminenceChoiceView(match(), SIDES.PLAYER);
  assert.equal(isEminenceTableInspectable(view, 'selectField'), true);
  assert.equal(isEminenceTableInspectable(view, 'selectAgent'), true);
  assert.equal(isEminenceTableInspectable(view, 'battle'), false);

  const forced = shouldShowEminenceLayer(view, { gamePhase: 'selectField' });
  assert.equal(forced, true);
  assert.equal(resolveEminenceChromeVisible({
    forced,
    peekCampo: false,
    peekEminence: false,
    inspectable: true,
  }), true);
  assert.equal(resolveEminenceChromeVisible({
    forced,
    peekCampo: true,
    peekEminence: false,
    inspectable: true,
  }), false);

  const both = selectEminenceAbility(
    selectEminenceAbility(match(), SIDES.PLAYER, 'apex_disprezzo').matchState,
    SIDES.ENEMY,
    'semaforo_giallo',
  ).matchState;
  const done = buildEminenceChoiceView(both, SIDES.PLAYER);
  const afterLock = shouldShowEminenceLayer(done, { gamePhase: 'selectField' });
  assert.equal(afterLock, false);
  assert.equal(resolveEminenceChromeVisible({
    forced: afterLock,
    peekCampo: false,
    peekEminence: false,
    inspectable: true,
  }), false);
  assert.equal(resolveEminenceChromeVisible({
    forced: afterLock,
    peekCampo: false,
    peekEminence: true,
    inspectable: true,
  }), true);
});
