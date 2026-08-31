// Acceptance test dell'infrastruttura Eminenze.
//
// Apex e il Grande Semaforo sono i primi due utilizzatori reali: se funzionano attraversando
// solo dati e primitive, l'infrastruttura regge. Se per farli funzionare servisse un ramo con
// il loro nome dentro il motore, l'infrastruttura avrebbe fallito — ed è quello che verifica
// il test finale di questo file, leggendo i sorgenti.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  REVEAL_GATES,
  EFFECT_TIMINGS,
  EMINENCE_PRIMITIVES as P,
  PRIMITIVE_TARGETS as T,
  TRIGGER_SCOPES,
  HP_LOSS_CAUSES,
  SIDES,
} from './eminenceConstants.js';
import { EMINENCES, EMINENCE_IDS } from '../../data/eminences.js';
import { createEminenceMatchState } from './eminenceState.js';
import {
  beginEminenceRound,
  selectEminenceAbility,
  completeGate,
  completeGeneralGate,
  collectPendingEffects,
} from './eminenceRound.js';
import { applyEminenceSegments, createEffectBundle, getSupportedPrimitives } from './primitiveHandlers.js';
import { resolveTriggerState } from './triggerRulesOverlay.js';
import { checkTrigger } from '../triggerLogic.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const duelContext = (overrides = {}) => ({
  fieldModifiers: {},
  isFirst: true,
  roundNumber: 3,
  playerHP: 25,
  enemyHP: 25,
  ...overrides,
});

/** Esegue un round completo dalla scelta segreta fino ai segmenti applicati. */
function playRound({ playerEminenceId, enemyEminenceId, playerAbility, enemyAbility, presence = {}, initiativeSide = SIDES.PLAYER }) {
  const base = createEminenceMatchState({ playerEminenceId, enemyEminenceId });
  if (presence.player != null) base.player.presence = presence.player;
  if (presence.enemy != null) base.enemy.presence = presence.enemy;

  let matchState = beginEminenceRound(base, { roundNumber: 3 });

  const p = selectEminenceAbility(matchState, SIDES.PLAYER, playerAbility);
  assert.equal(p.ok, true, `scelta giocatore rifiutata: ${p.reason}`);
  const e = selectEminenceAbility(p.matchState, SIDES.ENEMY, enemyAbility);
  assert.equal(e.ok, true, `scelta avversario rifiutata: ${e.reason}`);
  matchState = e.matchState;

  // I gate anticipati vengono comunque attraversati, anche se nessuno apre.
  matchState = completeGate(matchState, REVEAL_GATES.PRE_FIELD, { initiativeSide }).matchState;
  matchState = completeGate(matchState, REVEAL_GATES.PRE_AGENT, { initiativeSide }).matchState;

  const general = completeGeneralGate(matchState, { initiativeSide });
  matchState = general.matchState;

  const bundle = applyEminenceSegments(general.resolutionQueue);

  const preTrigger = collectPendingEffects(matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, { initiativeSide });
  matchState = preTrigger.matchState;
  applyEminenceSegments(preTrigger.queue, bundle);

  return { matchState, bundle, events: general.events };
}

// ------------------------------------------------------------------
// Apex — Il Sole Verde
// ------------------------------------------------------------------

test('Apex +1: +1 POT al proprio Agente e 2 PV di costo al controllore', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_giallo',
  });

  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 1);
  assert.equal(bundle.statDeltas[SIDES.ENEMY].power, 0);

  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: -2, cause: HP_LOSS_CAUSES.EMINENCE_COST, source: 'apex_furia' },
  ]);

  // Il +1 è un guadagno, non una spesa: non alimenta Manifestazione.
  assert.equal(matchState.player.presence, 4);
  assert.equal(matchState.player.presenceSpentThisRound, 0);
  assert.equal(checkTrigger('manifestazione', duelContext({
    hasEminence: true,
    presenceSpent: matchState.player.presenceSpentThisRound,
  })), false);
});

test('Apex -2: il proprio Agente ignora il Campo e la spesa alimenta Manifestazione', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_disprezzo',
    enemyAbility: 'semaforo_giallo',
  });

  assert.deepEqual(bundle.ignoreFieldSides, [SIDES.PLAYER]);
  assert.equal(matchState.player.presence, 1);
  assert.equal(matchState.player.presenceSpentThisRound, 2);

  assert.equal(checkTrigger('manifestazione', duelContext({
    hasEminence: true,
    presenceSpent: matchState.player.presenceSpentThisRound,
  })), true);
  // Per l'avversario è Blasfemia.
  assert.equal(checkTrigger('blasfemia', duelContext({
    enemyHasEminence: true,
    enemyPresenceSpent: matchState.player.presenceSpentThisRound,
  })), true);
});

test('Apex -4: due modifiche di statistica dalla stessa abilità', () => {
  const { matchState, bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_cataclisma',
    enemyAbility: 'semaforo_giallo',
    presence: { player: 4 },
  });

  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 2);
  assert.equal(bundle.statDeltas[SIDES.PLAYER].damage, 2);
  assert.equal(matchState.player.presence, 0);
  // Presenza a 0 dopo la spesa: Digiuno è soddisfatto nello stesso round.
  assert.equal(checkTrigger('digiuno', duelContext({ hasEminence: true, playerPresence: 0 })), true);
});

// ------------------------------------------------------------------
// Patto degli Indocili — Il Grande Semaforo
// ------------------------------------------------------------------

const semaforoTriggers = (bundle, side) =>
  ['imboscata', 'turbo', 'intervention', 'ultimaChance'].reduce((acc, trigger) => {
    acc[trigger] = resolveTriggerState({
      originalTrigger: trigger,
      context: duelContext({ isFirst: side === SIDES.PLAYER }),
      card: { id: side === SIDES.PLAYER ? 1 : 2 },
      side,
      triggerRules: bundle.triggerRules,
    }).satisfied;
    return acc;
  }, {});

test('Semaforo Verde: apre Imboscata e Turbo, chiude Intervento e Ultima Chance', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_verde',
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.PLAYER), {
    imboscata: true,
    turbo: true,
    intervention: false,
    ultimaChance: false,
  });
});

test('Semaforo Rosso: inverte il quadro anche contro condizioni naturalmente vere', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.PLAYER), {
    imboscata: false,
    turbo: false,
    intervention: true,
    ultimaChance: true,
  });
});

test('Semaforo: l\'effetto è simmetrico e colpisce chi lo ha attivato', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_furia',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  });

  assert.deepEqual(semaforoTriggers(bundle, SIDES.ENEMY), {
    imboscata: false,
    turbo: false,
    intervention: true,
    ultimaChance: true,
  });
});

test('Semaforo: agisce a BEFORE_TRIGGER_CHECK, non al reveal', () => {
  const base = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'apex_furia').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'semaforo_verde').matchState;

  const general = completeGeneralGate(matchState, {});
  // Subito dopo il reveal l'overlay è ancora vuoto.
  const atReveal = applyEminenceSegments(general.resolutionQueue);
  assert.equal(atReveal.triggerRules.forceSatisfied.length, 0);

  const preTrigger = collectPendingEffects(general.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  const afterCheckpoint = applyEminenceSegments(preTrigger.queue, atReveal);
  assert.equal(afterCheckpoint.triggerRules.forceSatisfied.length, 1);
});

test('checkpoint: un segmento consumato non viene rieseguito', () => {
  const base = createEminenceMatchState({
    playerEminenceId: 'patto_grande_semaforo',
    enemyEminenceId: 'apex_sole_verde',
  });
  let matchState = beginEminenceRound(base, { roundNumber: 3 });
  matchState = selectEminenceAbility(matchState, SIDES.PLAYER, 'semaforo_verde').matchState;
  matchState = selectEminenceAbility(matchState, SIDES.ENEMY, 'apex_furia').matchState;
  matchState = completeGeneralGate(matchState, {}).matchState;

  const first = collectPendingEffects(matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  assert.equal(first.queue.length, 2);

  const second = collectPendingEffects(first.matchState, EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK, {});
  assert.equal(second.queue.length, 0);
});

// ------------------------------------------------------------------
// Apex contro Grande Semaforo
// ------------------------------------------------------------------

test('incrocio: il Semaforo Rosso spegne l\'Imboscata di un Agente potenziato da Apex', () => {
  const { bundle } = playRound({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_cataclisma',
    enemyAbility: 'semaforo_rosso',
    presence: { player: 4, enemy: 2 },
  });

  // Le statistiche arrivano lo stesso: sono due primitive indipendenti.
  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 2);
  assert.equal(bundle.statDeltas[SIDES.PLAYER].damage, 2);

  const state = resolveTriggerState({
    originalTrigger: 'imboscata',
    context: duelContext({ isFirst: true }),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
  });

  assert.equal(state.naturalSatisfied, true);
  assert.equal(state.satisfied, false);
  assert.equal(state.forbidden, true);
});

test('incrocio: l\'iniziativa ordina la risoluzione, non l\'esito del pagamento', () => {
  const args = {
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
    playerAbility: 'apex_disprezzo',
    enemyAbility: 'semaforo_rosso',
    presence: { enemy: 2 },
  };

  const playerFirst = playRound({ ...args, initiativeSide: SIDES.PLAYER });
  const enemyFirst = playRound({ ...args, initiativeSide: SIDES.ENEMY });

  assert.equal(playerFirst.matchState.player.presence, enemyFirst.matchState.player.presence);
  assert.equal(playerFirst.matchState.enemy.presence, enemyFirst.matchState.enemy.presence);
});

// ------------------------------------------------------------------
// Estensibilità senza toccare il motore
// ------------------------------------------------------------------

test('estensibilità: una nuova Eminenza costruita solo su primitive funziona subito', () => {
  // Definita qui, ignota al motore: se serve modificare il motore per farla girare,
  // il vocabolario delle primitive è incompleto.
  const inventata = [
    { primitive: P.MODIFY_STAT, target: T.ENEMY_AGENT, stat: 'power', delta: -2 },
    { primitive: P.GRANT_TEMPORARY_FOCUS, target: T.OWN_AGENT, amount: 3 },
    { primitive: P.HEAL_HP, target: T.SELF, amount: 4 },
    { primitive: P.FORBID_TRIGGER, scope: TRIGGER_SCOPES.ENEMY, triggers: ['glory'] },
    { primitive: P.UNBLOCKABLE_POWER, scope: TRIGGER_SCOPES.OWN },
  ].map((segment) => ({ segment, ownerSide: SIDES.PLAYER, abilityId: 'eminenza_di_prova' }));

  const bundle = applyEminenceSegments(inventata);

  assert.equal(bundle.statDeltas[SIDES.ENEMY].power, -2);
  assert.equal(bundle.temporaryFocus[SIDES.PLAYER], 3);
  assert.deepEqual(bundle.hpDeltas, [
    { side: SIDES.PLAYER, amount: 4, cause: HP_LOSS_CAUSES.OTHER, source: 'eminenza_di_prova' },
  ]);

  const enemyGlory = resolveTriggerState({
    originalTrigger: 'glory',
    context: duelContext({ wonPrevious: true }),
    card: { id: 2 },
    side: SIDES.ENEMY,
    triggerRules: bundle.triggerRules,
  });
  assert.equal(enemyGlory.satisfied, false);

  const ownBlocked = resolveTriggerState({
    originalTrigger: 'imboscata',
    context: duelContext(),
    card: { id: 1 },
    side: SIDES.PLAYER,
    triggerRules: bundle.triggerRules,
    powerBlocked: true,
  });
  assert.equal(ownBlocked.resolves, true);
});

test('estensibilità: una primitiva senza handler fallisce in modo rumoroso', () => {
  assert.throws(
    () => applyEminenceSegments([{ segment: { primitive: 'PRIMITIVA_INVENTATA' }, ownerSide: SIDES.PLAYER }]),
    /Primitiva senza handler/
  );
});

test('estensibilità: ogni primitiva dichiarata nel vocabolario ha un handler', () => {
  const supported = new Set(getSupportedPrimitives());
  for (const primitive of Object.values(P)) {
    assert.equal(supported.has(primitive), true, `primitiva senza handler: ${primitive}`);
  }
});

test('estensibilità: ogni segmento del catalogo usa primitive supportate', () => {
  const supported = new Set(getSupportedPrimitives());
  for (const id of EMINENCE_IDS) {
    const eminence = EMINENCES[id];
    const all = [...(eminence.static?.segments || []), ...eminence.abilities.flatMap((a) => a.segments || [])];
    for (const seg of all) {
      assert.equal(supported.has(seg.primitive), true, `${id}: primitiva ignota ${seg.primitive}`);
    }
  }
});

test('accumulatore: partire da un bundle esistente compone senza azzerare', () => {
  const bundle = createEffectBundle();
  bundle.statDeltas[SIDES.PLAYER].power = 5;

  applyEminenceSegments(
    [{ segment: { primitive: P.MODIFY_STAT, target: T.OWN_AGENT, stat: 'power', delta: 2 }, ownerSide: SIDES.PLAYER }],
    bundle
  );

  assert.equal(bundle.statDeltas[SIDES.PLAYER].power, 7);
});

// ------------------------------------------------------------------
// Vincolo architetturale, verificato sui sorgenti
// ------------------------------------------------------------------

/**
 * Rimuove i commenti conservando le stringhe.
 *
 * Il vincolo riguarda la logica, non la documentazione: un commento che spiega *perché*
 * esiste una primitiva citando l'Eminenza che l'ha motivata è informazione utile. Un
 * identificatore dentro il codice, anche solo in una stringa, sarebbe invece un ramo dedicato.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  let mode = 'code';
  let quote = '';

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (mode === 'code') {
      if (c === '/' && next === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && next === '*') { mode = 'block'; i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { mode = 'string'; quote = c; }
      out += c;
      i += 1;
      continue;
    }

    if (mode === 'string') {
      out += c;
      if (c === '\\') { out += next ?? ''; i += 2; continue; }
      if (c === quote) mode = 'code';
      i += 1;
      continue;
    }

    if (mode === 'line') {
      if (c === '\n') { mode = 'code'; out += c; }
      i += 1;
      continue;
    }

    // block
    if (c === '*' && next === '/') { mode = 'code'; i += 2; continue; }
    if (c === '\n') out += c;
    i += 1;
  }

  return out;
}

test('motore: nessun identificatore di Eminenza compare nei moduli generici', () => {
  const engineFiles = [
    ...readdirSync(HERE)
      .filter((file) => file.endsWith('.js') && !file.endsWith('.test.js'))
      .map((file) => path.join(HERE, file)),
    path.resolve(HERE, '../triggerLogic.js'),
    path.resolve(HERE, '../duel/duelTurnContexts.js'),
    path.resolve(HERE, '../ai/publicStateHash.js'),
    path.resolve(HERE, '../ai/buildAIInformationSet.js'),
    path.resolve(HERE, '../ai/strategicState.js'),
  ];

  const forbidden = [
    ...EMINENCE_IDS,
    ...EMINENCE_IDS.flatMap((id) => EMINENCES[id].abilities.map((a) => a.id)),
    ...EMINENCE_IDS.map((id) => EMINENCES[id].army),
  ];

  const offences = [];
  for (const file of engineFiles) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const token of forbidden) {
      if (code.includes(token)) offences.push(`${path.basename(file)} contiene "${token}"`);
    }
  }

  assert.deepEqual(offences, [], offences.join('; '));
});

test('motore: lo scanner riconoscerebbe un ramo dedicato', () => {
  // Senza questo controllo il test precedente potrebbe passare perché lo stripper mangia
  // troppo, anziché perché il motore è pulito.
  const sample = `
    // Mascarada riordina i gate
    /* Orathai conta le attivazioni */
    function f(id) {
      if (id === 'apex_sole_verde') return 1;
      return 0;
    }
  `;
  const code = stripComments(sample);

  assert.equal(code.includes('Mascarada'), false);
  assert.equal(code.includes('Orathai'), false);
  assert.equal(code.includes('apex_sole_verde'), true);
});

test('motore: il catalogo dati è l\'unico posto che nomina le Eminenze', () => {
  // Controprova del test precedente: se fallisse, il test sopra passerebbe per il motivo
  // sbagliato, cioè perché la lista dei token proibiti si è svuotata.
  const catalog = readFileSync(path.resolve(HERE, '../../data/eminences.js'), 'utf8');
  assert.ok(EMINENCE_IDS.length >= 12);
  for (const id of EMINENCE_IDS) {
    assert.ok(catalog.includes(id), `${id} assente dal catalogo`);
  }
});
