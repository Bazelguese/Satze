import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEminenceChoiceView,
  isAwaitingEminenceChoice,
  isAwaitingRevealParams,
  shouldHoldDuelForEminence,
  canSelectBattlefield,
  shouldShowEminenceAbilityRail,
  shouldShowEminenceSideZone,
  shouldShowEminenceLayer,
  shouldRevealEnemyHandForEminenceChoice,
  isEminenceTableInspectable,
  resolveEminenceChromeVisible,
  selectionParamsReady,
  abilityRailExpandsDown,
  legalPreyIdsForChoice,
  legalCardIdsForChoice,
  legalSlotIndicesForChoice,
  shouldRevealBoardForEminenceChoice,
  CHOICE_STATES,
  OPTION_BLOCKERS,
} from './eminenceChoiceView.js';
import { beginEminenceRound, selectEminenceAbility } from './eminenceRound.js';
import { commitEminenceSetupChoice } from './eminenceDuelGate.js';
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
  assert.equal(view.gateSequenceName, 'FIELD_FIRST');
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
  assert.equal(shouldShowEminenceLayer(view, { gamePhase: 'shuffleDeal' }), false);
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

test('vista: lo schema AT_SELECTION è pubblico, il valore scelto no', () => {
  const view = buildEminenceChoiceView(match('mascarada_organizzatore', 'patto_grande_semaforo'), SIDES.PLAYER);
  const scommessa = view.self.options.find((o) => o.id === 'mascarada_scommessa');
  assert.equal(scommessa.implemented, true);
  assert.deepEqual(scommessa.paramsSchema.pronostico, ['VITTORIA_PROPRIA', 'VITTORIA_AVVERSARIA', 'PAREGGIO']);

  const enemyView = buildEminenceChoiceView(
    selectEminenceAbility(match('patto_grande_semaforo', 'mascarada_organizzatore'), SIDES.ENEMY, 'mascarada_scommessa', {
      pronostico: 'PAREGGIO',
    }).matchState,
    SIDES.PLAYER,
  );
  assert.equal(enemyView.opponent.selectedAbilityId, undefined);
  assert.equal(enemyView.opponent.options.find((o) => o.id === 'mascarada_scommessa').selected, false);
});

test('vista: i Frammenti pubblici diventano opzioni di parametro', () => {
  const opened = match('kethran_altare', 'patto_grande_semaforo');
  opened.player.persistent.fragmentCardIds = [101, 116, 106];
  const view = buildEminenceChoiceView(opened, SIDES.PLAYER);
  const innesto = view.self.options.find((o) => o.id === 'kethran_innesto');
  const opera = view.self.options.find((o) => o.id === 'kethran_opera_composita');
  assert.equal(innesto.implemented, true);
  assert.deepEqual(innesto.paramsSchema.fragmentCardId, [101, 116]);
  assert.equal(innesto.paramsSchema.__limits, undefined);
  assert.deepEqual(opera.paramsSchema.fragmentCardId, [101, 116, 106]);
  assert.deepEqual(opera.paramsSchema.composeComponent, ['TRIGGER', 'EFFECT']);
  assert.deepEqual(opera.paramsSchema.__limits, { fragmentCardId: { min: 1, max: 2 } });
  assert.equal(selectionParamsReady(opera.paramsSchema, { fragmentCardId: 101 }), false);
  assert.equal(selectionParamsReady(opera.paramsSchema, { fragmentCardId: 101, composeComponent: 'TRIGGER' }), true);
  assert.equal(selectionParamsReady(opera.paramsSchema, { fragmentCardId: [101, 116] }), true);
});

test('vista: gli slot del tabellone diventano opzioni e lo 0 è una scelta valida', () => {
  const view = buildEminenceChoiceView(match('khemet_maledizioni', 'patto_grande_semaforo'), SIDES.PLAYER, {
    slotCount: 5,
  });
  const curse = view.self.options.find((o) => o.id === 'khemet_maledizione_va');
  const total = view.self.options.find((o) => o.id === 'khemet_maledizione_stat');
  assert.deepEqual(curse.paramsSchema.slot, [0, 1, 2, 3, 4]);
  assert.deepEqual(total.paramsSchema.slot, [0, 1, 2, 3, 4]);
  assert.equal(selectionParamsReady(curse.paramsSchema, {}), false);
  assert.equal(selectionParamsReady(curse.paramsSchema, { slot: 0 }), true);
  assert.equal(selectionParamsReady(curse.paramsSchema, { slot: 4 }), true);
});

test('vista: gli slot conquistati spariscono e i maledetti restano etichettati', () => {
  const view = buildEminenceChoiceView(match('khemet_maledizioni', 'patto_grande_semaforo'), SIDES.PLAYER, {
    slots: [
      { index: 0, name: 'Arena Aperta', revealed: true, conquered: true, cursed: false },
      { index: 1, name: 'Ponte di Sale', revealed: true, conquered: false, cursed: true },
      { index: 2, name: 'Cripta Nona', revealed: false, conquered: false, cursed: false },
      { index: 3, name: 'Forte Ignoto', revealed: false, conquered: false, cursed: false },
      { index: 4, name: 'Ultimo Recinto', revealed: false, conquered: false, cursed: false },
    ],
  });
  const curse = view.self.options.find((o) => o.id === 'khemet_maledizione_va');
  assert.deepEqual(curse.paramsSchema.slot, [1, 2, 3, 4]);
  assert.equal(view.paramMeta.slot[1].label, 'Ponte di Sale');
  assert.equal(view.paramMeta.slot[1].cursed, true);
  assert.equal(view.paramMeta.slot[2].label, 'Campo 3');
  assert.equal(view.paramMeta.slot[0], undefined);
});

test('rail: sotto l\'ultima losanga scendono solo i Frammenti', () => {
  assert.equal(abilityRailExpandsDown({ fragmentCardId: [101, 116] }, { isLastOption: true }), true);
  assert.equal(abilityRailExpandsDown({ fragmentCardId: [101, 116] }, { isLastOption: false }), false);
  assert.equal(abilityRailExpandsDown({ preyCardId: [102, 116] }, { isLastOption: true }), false);
  assert.equal(abilityRailExpandsDown({ slot: [0, 1, 2] }, { isLastOption: true }), false);
});

test('vista: Clausola e Debito Eterno materializzano Agenti non schierati o confermati', () => {
  const view = buildEminenceChoiceView(match('corte_rossa', 'patto_grande_semaforo'), SIDES.PLAYER, {
    ownUndeployedCardIds: [201],
    enemyUndeployedCardIds: [301, 302],
    confirmedAgents: [
      { id: 201, side: SIDES.PLAYER, label: 'Proprio' },
      { id: 301, side: SIDES.ENEMY, label: 'Avversario' },
    ],
  });
  const clausola = view.self.options.find((o) => o.id === 'corte_clausola');
  const eterno = view.self.options.find((o) => o.id === 'corte_debito_eterno');
  assert.deepEqual(clausola.paramsSchema.cardId, [201, 301, 302]);
  assert.deepEqual(eterno.paramsSchema.cardId, [201, 301]);
  assert.deepEqual(legalCardIdsForChoice(view, { draftId: 'corte_clausola' }), [201, 301, 302]);
});

test('vista: la Preda di setup e gli Agenti non schierati diventano opzioni', () => {
  const opened = match('mounthborn_fame', 'patto_grande_semaforo');
  const view = buildEminenceChoiceView(opened, SIDES.PLAYER, {
    enemyUndeployedCardIds: [102, 116],
  });
  assert.equal(view.setupPending, true);
  assert.equal(isAwaitingEminenceChoice(view), false);
  assert.equal(shouldShowEminenceLayer(view, { gamePhase: 'selectField' }), true);
  assert.deepEqual(view.self.setup.paramsSchema.preyCardId, [102, 116]);
  assert.deepEqual(legalPreyIdsForChoice(view), [102, 116]);
  const gorgoglio = view.self.options.find((o) => o.id === 'mounthborn_gorgoglio');
  assert.equal(gorgoglio.implemented, true);
  assert.deepEqual(gorgoglio.paramsSchema.preyCardId, [102, 116]);
  opened.player.persistent.preyCardIds = [102];
  const afterMark = buildEminenceChoiceView(opened, SIDES.PLAYER, {
    enemyUndeployedCardIds: [102, 116],
  });
  assert.deepEqual(afterMark.self.setup.paramsSchema.preyCardId, [116]);
  assert.deepEqual(
    afterMark.self.options.find((o) => o.id === 'mounthborn_gorgoglio').paramsSchema.preyCardId,
    [116],
  );
  assert.equal(shouldShowEminenceAbilityRail(view, { announcing: true, side: 'player' }), false);
  assert.equal(shouldShowEminenceAbilityRail(view, { announcing: false, side: 'player' }), true);
  assert.equal(shouldShowEminenceAbilityRail(view, { announcing: false, side: 'enemy' }), false);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    announcing: true,
    hasNotice: true,
    setupPending: true,
    isSetupActor: true,
  }), true);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    announcing: true,
    hasNotice: false,
    setupPending: true,
    isSetupActor: false,
  }), false);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    announcing: false,
    hasNotice: false,
    setupPending: true,
    isSetupActor: true,
  }), true);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    announcing: false,
    hasNotice: false,
    setupPending: true,
    isSetupActor: false,
  }), false);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    announcing: false,
    hasNotice: false,
    setupPending: false,
  }), true);
  assert.equal(shouldRevealEnemyHandForEminenceChoice(view, { announcing: true }), false);
  assert.equal(shouldRevealEnemyHandForEminenceChoice(view, { announcing: false }), true);
  const apex = buildEminenceChoiceView(match(), SIDES.PLAYER);
  assert.equal(shouldRevealEnemyHandForEminenceChoice(apex, { announcing: false }), false);
  assert.equal(shouldRevealEnemyHandForEminenceChoice(apex, {
    announcing: false,
    draftId: 'apex_disprezzo',
  }), false);
});

test('preda su abilità: l\'Eminenza avversaria si ritira mentre si legge la mano', () => {
  const opened = match('mounthborn_fame', 'patto_grande_semaforo');
  const committed = commitEminenceSetupChoice(opened, SIDES.PLAYER, { preyCardId: 102 });
  assert.equal(committed.ok, true);
  const view = buildEminenceChoiceView(committed.matchState, SIDES.PLAYER, {
    enemyUndeployedCardIds: [102, 116],
  });
  assert.equal(view.setupPending, false);
  assert.equal(shouldRevealEnemyHandForEminenceChoice(view, {
    announcing: false,
    draftId: 'mounthborn_gorgoglio',
  }), true);
  assert.deepEqual(legalPreyIdsForChoice(view, { draftId: 'mounthborn_gorgoglio' }), [116]);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    concealForEnemyHandRead: true,
  }), false);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    concealForEnemyHandRead: false,
  }), true);
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

test('rail: dopo un avviso non torna da sola se la scelta è già sigillata', () => {
  const choosing = buildEminenceChoiceView(match(), SIDES.PLAYER);
  assert.equal(shouldShowEminenceAbilityRail(choosing, { announcing: true }), false);
  assert.equal(shouldShowEminenceAbilityRail(choosing, { announcing: false }), true);

  const both = selectEminenceAbility(
    selectEminenceAbility(match(), SIDES.PLAYER, 'apex_disprezzo').matchState,
    SIDES.ENEMY,
    'semaforo_giallo',
  ).matchState;
  const locked = buildEminenceChoiceView(both, SIDES.PLAYER);
  assert.equal(isAwaitingEminenceChoice(locked), false);
  assert.equal(shouldShowEminenceAbilityRail(locked, { announcing: false }), false);
  assert.equal(shouldShowEminenceAbilityRail(locked, { announcing: false, peeking: true }), true);
});

test('avviso: in scena restano solo i messaggi del lato che parla', () => {
  assert.equal(shouldShowEminenceSideZone({ layerVisible: false, announcing: true, hasNotice: true }), false);
  assert.equal(shouldShowEminenceSideZone({ layerVisible: true, announcing: true, hasNotice: true }), true);
  assert.equal(shouldShowEminenceSideZone({ layerVisible: true, announcing: true, hasNotice: false }), false);
  assert.equal(shouldShowEminenceSideZone({ layerVisible: true, announcing: false, hasNotice: false }), true);
});

test('scia Preda: la scena resta sul lato che marca, senza l\'Eminenza avversaria', () => {
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    markFlightHold: true,
    isSetupActor: true,
  }), true);
  assert.equal(shouldShowEminenceSideZone({
    layerVisible: true,
    markFlightHold: true,
    isSetupActor: false,
  }), false);
  assert.equal(shouldShowEminenceAbilityRail(buildEminenceChoiceView(match(), SIDES.PLAYER), {
    markFlightHold: true,
    side: 'player',
  }), true);
  assert.equal(shouldShowEminenceAbilityRail(buildEminenceChoiceView(match(), SIDES.PLAYER), {
    markFlightHold: true,
    side: 'enemy',
  }), false);
});

test('scelta Campo: gli slot restano sul tabellone, non sotto la losanga', () => {
  const view = buildEminenceChoiceView(match('khemet_maledizioni'), SIDES.PLAYER, {
    slotCount: 5,
  });
  assert.deepEqual(legalSlotIndicesForChoice(view, { draftId: 'khemet_maledizione_va' }), [0, 1, 2, 3, 4]);
  assert.equal(shouldRevealBoardForEminenceChoice(view, {
    announcing: false,
    draftId: 'khemet_maledizione_va',
  }), true);
  assert.equal(shouldRevealBoardForEminenceChoice(view, {
    announcing: true,
    draftId: 'khemet_maledizione_va',
  }), false);
});

test('hold: il tendone R5 e il round non aperto bloccano Campo e Agenti', () => {
  assert.equal(shouldHoldDuelForEminence({}), false);
  assert.equal(shouldHoldDuelForEminence({ cinematic: true }), true);
  assert.equal(shouldHoldDuelForEminence({ roundPending: true }), true);
  assert.equal(shouldHoldDuelForEminence({ awaitingChoice: true }), true);
  assert.equal(shouldHoldDuelForEminence({ announceHold: true }), true);
  assert.equal(shouldHoldDuelForEminence({ markFlightHold: true }), true);
  assert.equal(shouldHoldDuelForEminence({ awaitingRevealParams: true }), true);
});

test('reveal: dopo il lock Agenti i bersagli confermati restano da scegliere', () => {
  const base = createEminenceMatchState({
    format: EMINENCE_FORMAT.REQUIRED,
    playerEminenceId: 'corte_rossa',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  base.player.presence = 4;
  const opened = beginEminenceRound(base, { roundNumber: 1 });
  const sealed = selectEminenceAbility(
    selectEminenceAbility(opened, SIDES.PLAYER, 'corte_debito_eterno').matchState,
    SIDES.ENEMY,
    'semaforo_giallo',
  ).matchState;
  const beforeAgents = buildEminenceChoiceView(sealed, SIDES.PLAYER);
  assert.equal(isAwaitingRevealParams(beforeAgents), false);
  assert.equal(shouldShowEminenceLayer(beforeAgents, { gamePhase: 'selectField' }), false);

  const ready = buildEminenceChoiceView(sealed, SIDES.PLAYER, {
    confirmedAgents: [
      { id: 201, side: SIDES.PLAYER, label: 'Proprio' },
      { id: 301, side: SIDES.ENEMY, label: 'Avversario' },
    ],
  });
  assert.equal(isAwaitingRevealParams(ready), true);
  assert.equal(shouldShowEminenceLayer(ready, { gamePhase: 'battle' }), false);
  assert.deepEqual(legalCardIdsForChoice(ready), [201, 301]);

  const picked = {
    ...sealed,
    player: { ...sealed.player, selectedParams: { cardId: 301, targetSide: SIDES.ENEMY } },
  };
  const done = buildEminenceChoiceView(picked, SIDES.PLAYER, {
    confirmedAgents: [
      { id: 201, side: SIDES.PLAYER },
      { id: 301, side: SIDES.ENEMY },
    ],
  });
  assert.equal(isAwaitingRevealParams(done), false);
});

test('tabellone: dopo il flush Campo-prima il Campo resta cliccabile', () => {
  assert.equal(canSelectBattlefield({
    isPlayerFirst: true,
    gamePhase: 'selectField',
    gateSequenceName: 'FIELD_FIRST',
  }), true);
  assert.equal(canSelectBattlefield({
    isPlayerFirst: true,
    eminenceBlocked: true,
    gamePhase: 'selectField',
    gateSequenceName: 'FIELD_FIRST',
  }), false);
  assert.equal(canSelectBattlefield({
    isPlayerFirst: true,
    gamePhase: 'selectAgent',
    gateSequenceName: 'AGENTS_FIRST',
  }), false);
  assert.equal(canSelectBattlefield({
    isPlayerFirst: true,
    gamePhase: 'selectField',
    gateSequenceName: 'AGENTS_FIRST',
  }), true);
});
