import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SIDES, REVEAL_GATES } from './eminenceConstants.js';
import { createEminenceMatchState } from './eminenceState.js';
import { beginEminenceRound, selectEminenceAbility, completeGate } from './eminenceRound.js';
import { changeSidePresence } from './presence.js';
import {
  buildEminenceAIView,
  cloneEminenceView,
  createDisabledEminenceView,
  buildEminenceHashParts,
  findEminenceViewLeaks,
} from './eminenceAIView.js';
import { buildAIInformationSet, validateAIInformationSet, buildPublicDecisionKey } from '../ai/buildAIInformationSet.js';
import { publicStateHash } from '../ai/publicStateHash.js';

// L'IA gioca il lato 'enemy'; il giocatore umano è 'player'.
const scenario = ({ playerAbility = 'apex_furia', aiAbility = 'semaforo_verde' } = {}) => {
  let matchState = beginEminenceRound(
    createEminenceMatchState({
      playerEminenceId: 'apex_sole_verde',
      enemyEminenceId: 'patto_grande_semaforo',
    }),
    { roundNumber: 1 }
  );
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility).matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, aiAbility).matchState;
  return matchState;
};

// ------------------------------------------------------------------
// Confine informativo
// ------------------------------------------------------------------

test('vista IA: l\'IA conosce la propria scelta segreta', () => {
  const view = buildEminenceAIView(scenario(), { aiSide: SIDES.ENEMY });
  assert.equal(view.ai.private.selectedAbilityId, 'semaforo_verde');
});

test('vista IA: la scelta avversaria non è identificabile', () => {
  const view = buildEminenceAIView(scenario({ playerAbility: 'apex_disprezzo' }), { aiSide: SIDES.ENEMY });

  assert.equal(view.player.private, undefined);
  assert.equal(view.player.selectedAbilityId, undefined);
  assert.deepEqual(findEminenceViewLeaks(view), []);

  // L'id scelto compare legittimamente tra le ipotesi: è un candidato come gli altri.
  // La fuga sarebbe che comparisse altrove, o che l'insieme lo isolasse.
  const { hypotheses, ...rest } = view.player;
  assert.equal(JSON.stringify(rest).includes('apex_disprezzo'), false);
  assert.ok(hypotheses.length > 1);
  assert.ok(hypotheses.includes('apex_disprezzo'));
});

test('vista IA: la stessa vista pubblica per due scelte segrete diverse', () => {
  // Controllo diretto di indistinguibilità: la proiezione non deve dipendere dalla scelta.
  const a = buildEminenceAIView(scenario({ playerAbility: 'apex_furia' }), { aiSide: SIDES.ENEMY });
  const b = buildEminenceAIView(scenario({ playerAbility: 'apex_disprezzo' }), { aiSide: SIDES.ENEMY });
  assert.deepEqual(a.player, b.player);
});

test('vista IA: dell\'avversario resta l\'insieme delle ipotesi', () => {
  const view = buildEminenceAIView(scenario(), { aiSide: SIDES.ENEMY });
  // Apex a 3 Presenza: il -4 era illegale al checkpoint di selezione.
  assert.deepEqual(view.player.hypotheses, ['apex_furia', 'apex_disprezzo']);
});

test('vista IA: le ipotesi si restringono superando i gate', () => {
  let matchState = beginEminenceRound(
    createEminenceMatchState({
      playerEminenceId: 'khemet_maledizioni',
      enemyEminenceId: 'patto_grande_semaforo',
    }),
    { roundNumber: 1 }
  );
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'khemet_maledizione_va').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;

  const before = buildEminenceAIView(matchState, { aiSide: SIDES.ENEMY });
  assert.equal(before.player.hypotheses.length, 2);

  const { matchState: after } = completeGate(matchState, REVEAL_GATES.PRE_FIELD, {});
  const view = buildEminenceAIView(after, { aiSide: SIDES.ENEMY });
  assert.deepEqual(view.player.hypotheses, ['khemet_maledizione_va']);
});

test('vista IA: la deduzione usa la Presenza al checkpoint, non quella corrente', () => {
  let matchState = scenario();
  matchState = changeSidePresence(matchState, SIDES.PLAYER, 5, { reason: 'statico' }).matchState;

  const view = buildEminenceAIView(matchState, { aiSide: SIDES.ENEMY });
  assert.equal(view.player.presence, 8);
  assert.equal(view.player.selectionCheckpointPresence, 3);
  // Con 8 Presenza il -4 sembrerebbe possibile; alla scelta segreta non lo era.
  assert.equal(view.player.hypotheses.includes('apex_cataclisma'), false);
});

test('vista IA: il clone non reintroduce segreti', () => {
  const view = buildEminenceAIView(scenario(), { aiSide: SIDES.ENEMY });
  const cloned = cloneEminenceView(view);

  assert.equal(cloned.player.private, undefined);
  assert.deepEqual(cloned.player.hypotheses, view.player.hypotheses);
  cloned.player.hypotheses.push('x');
  assert.equal(view.player.hypotheses.length, 2);
});

test('vista IA: il rilevatore riconosce una fuga costruita a mano', () => {
  const view = buildEminenceAIView(scenario(), { aiSide: SIDES.ENEMY });
  view.player.private = { selectedAbilityId: 'apex_furia' };
  assert.equal(findEminenceViewLeaks(view).length, 1);
});

test('vista IA: formato senza Eminenze produce una vista neutra', () => {
  assert.deepEqual(buildEminenceAIView(null), createDisabledEminenceView());
  assert.deepEqual(findEminenceViewLeaks(createDisabledEminenceView()), []);
});

// ------------------------------------------------------------------
// Hash dello stato pubblico
// ------------------------------------------------------------------

test('hash: due stati che differiscono solo per la scelta segreta collidono', () => {
  const a = buildEminenceAIView(scenario({ playerAbility: 'apex_furia' }), { aiSide: SIDES.ENEMY });
  const b = buildEminenceAIView(scenario({ playerAbility: 'apex_disprezzo' }), { aiSide: SIDES.ENEMY });

  // È il comportamento voluto: pubblicamente i due stati sono identici.
  assert.equal(buildEminenceHashParts(a), buildEminenceHashParts(b));
});

test('hash: la Presenza pubblica distingue gli stati', () => {
  const base = scenario();
  const moved = changeSidePresence(base, SIDES.PLAYER, 2, {}).matchState;

  assert.notEqual(
    buildEminenceHashParts(buildEminenceAIView(base, { aiSide: SIDES.ENEMY })),
    buildEminenceHashParts(buildEminenceAIView(moved, { aiSide: SIDES.ENEMY }))
  );
});

test('hash: il superamento di un gate distingue gli stati', () => {
  const base = scenario();
  const { matchState: after } = completeGate(base, REVEAL_GATES.PRE_FIELD, {});

  assert.notEqual(
    buildEminenceHashParts(buildEminenceAIView(base, { aiSide: SIDES.ENEMY })),
    buildEminenceHashParts(buildEminenceAIView(after, { aiSide: SIDES.ENEMY }))
  );
});

test('hash: senza Eminenze la porzione è costante e non rompe l\'hash esistente', () => {
  const state = { roundNumber: 1, aiHP: 25, playerHP: 25, conqueredFields: {} };
  assert.ok(publicStateHash(state).endsWith('|e0'));
  assert.equal(publicStateHash(state), publicStateHash({ ...state, eminence: null }));
});

// ------------------------------------------------------------------
// Integrazione con l'information set
// ------------------------------------------------------------------

const gameState = (eminenceState = null) => ({
  aiDifficulty: 'medium',
  gameMode: 'classic',
  roundNumber: 1,
  isPlayerFirst: true,
  selectedAgent: { id: 7, league: 3, army: 'Apex' },
  battlefields: [{ id: 1, name: 'Campo' }],
  currentFieldIndex: 0,
  conqueredFields: {},
  playerHand: [{ id: 7, league: 3, army: 'Apex' }],
  enemyHand: [{ id: 8, league: 2, army: 'Patto degli Indocili' }],
  playerHP: 25,
  enemyHP: 25,
  playerFocus: 18,
  enemyFocus: 18,
  eminenceState,
});

test('information set: espone la vista Eminenza sui due lati', () => {
  const infoSet = buildAIInformationSet(gameState(scenario()));

  assert.equal(infoSet.eminence.enabled, true);
  assert.equal(infoSet.ai.eminence.private.selectedAbilityId, 'semaforo_verde');
  assert.deepEqual(infoSet.player.eminence.hypotheses, ['apex_furia', 'apex_disprezzo']);
});

test('information set: la validazione segnala una fuga Eminenza', () => {
  const infoSet = buildAIInformationSet(gameState(scenario()));
  assert.deepEqual(validateAIInformationSet(infoSet, { warn: () => {} }), []);

  infoSet.player.eminence.selectedAbilityId = 'apex_furia';
  infoSet.eminence.player.selectedAbilityId = 'apex_furia';
  assert.equal(validateAIInformationSet(infoSet, { warn: () => {} }).length, 1);
});

test('information set: senza stato Eminenza tutto resta come prima', () => {
  const infoSet = buildAIInformationSet(gameState(null));
  assert.equal(infoSet.eminence.enabled, false);
  assert.equal(infoSet.player.eminence, null);
  assert.deepEqual(validateAIInformationSet(infoSet, { warn: () => {} }), []);
});

test('chiave di cache: non cambia con la scelta segreta, cambia con la Presenza pubblica', () => {
  const withFuria = buildPublicDecisionKey(buildAIInformationSet(gameState(scenario({ playerAbility: 'apex_furia' }))));
  const withDisprezzo = buildPublicDecisionKey(
    buildAIInformationSet(gameState(scenario({ playerAbility: 'apex_disprezzo' })))
  );
  assert.equal(withFuria, withDisprezzo);

  const moved = changeSidePresence(scenario(), SIDES.PLAYER, 2, {}).matchState;
  assert.notEqual(withFuria, buildPublicDecisionKey(buildAIInformationSet(gameState(moved))));
});
