import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  EMINENCES,
  EMINENCE_IDS,
  EMINENCE_BY_ARMY,
  getEminence,
  getEminenceForArmy,
  getEminenceAbility,
} from '../../data/eminences.js';
import {
  REVEAL_GATES,
  ALL_REVEAL_GATES,
  GATE_SEQUENCES,
  CHOICE_PARAMS_TIMING,
  EMINENCE_FORMAT,
} from './eminenceConstants.js';
import {
  countCardsByArmy,
  getEligibleArmies,
  getEligibleEminences,
  validateDeckEminence,
  createEminenceState,
  createEminenceMatchState,
  isEminenceSubsystemEnabled,
  resetEminenceRoundState,
  resetEminenceMatchRound,
  selectPublicEminenceState,
  selectPrivateEminenceSelection,
  selectPublicEminenceMatchState,
  getLegalAbilityIds,
  isAbilitySelectable,
  hasAlwaysLegalOption,
} from './eminenceState.js';

// Le 12 Armate canoniche. Duplicate qui di proposito: `src/data/armies.js` importa un modulo
// JSX e non è caricabile dal runner node:test.
const CANONICAL_ARMIES = [
  "Figli dell'Orizzonte",
  'Kethran',
  'Corte Rossa',
  'Calibri Pesanti',
  'Orathai',
  'Mounthborn',
  "L'Enclave delle Scaglie",
  'Ratti della Megera',
  'Patto degli Indocili',
  'Khemet',
  'Apex',
  'Mascarada',
];

const card = (army, id) => ({ id, army, name: `${army} ${id}` });

/** Mazzo 10 carte: `counts` mappa Armata → numero di carte. */
const buildDeck = (counts) => {
  const cards = [];
  let id = 1;
  for (const [army, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i += 1) cards.push(card(army, id++));
  }
  return cards;
};

// ------------------------------------------------------------------
// Invarianti di catalogo
// ------------------------------------------------------------------

test('catalogo: dodici Eminenze, una per Armata canonica', () => {
  assert.equal(EMINENCE_IDS.length, 12);
  assert.deepEqual(
    Object.keys(EMINENCE_BY_ARMY).sort(),
    [...CANONICAL_ARMIES].sort()
  );
});

test('catalogo: ogni id di abilità è unico globalmente', () => {
  const seen = new Set();
  for (const id of EMINENCE_IDS) {
    for (const ability of EMINENCES[id].abilities) {
      assert.equal(seen.has(ability.id), false, `id duplicato: ${ability.id}`);
      seen.add(ability.id);
    }
  }
});

test('catalogo: campi obbligatori presenti su ogni abilità', () => {
  for (const id of EMINENCE_IDS) {
    for (const ability of EMINENCES[id].abilities) {
      assert.equal(typeof ability.id, 'string', `${id}: id`);
      assert.equal(typeof ability.presenceDelta, 'number', `${ability.id}: presenceDelta`);
      assert.ok(ALL_REVEAL_GATES.includes(ability.revealGate), `${ability.id}: revealGate`);
      assert.ok(
        Object.values(CHOICE_PARAMS_TIMING).includes(ability.choiceParamsTiming),
        `${ability.id}: choiceParamsTiming`
      );
      assert.equal(typeof ability.text, 'string', `${ability.id}: text`);
    }
  }
});

test('catalogo: ogni Eminenza ha almeno un\'opzione non negativa', () => {
  for (const id of EMINENCE_IDS) {
    assert.equal(hasAlwaysLegalOption(id), true, `${id} può restare senza scelta legale`);
  }
});

test('catalogo: la Corte Rossa ha quattro attive, nessuna struttura assume length === 3', () => {
  assert.equal(EMINENCES.corte_rossa.abilities.length, 4);
  const lengths = new Set(EMINENCE_IDS.map((id) => EMINENCES[id].abilities.length));
  assert.ok(lengths.has(3) && lengths.has(4));
});

test('catalogo: i parametri AT_SELECTION dichiarano uno schema', () => {
  for (const id of EMINENCE_IDS) {
    for (const ability of EMINENCES[id].abilities) {
      if (ability.choiceParamsTiming !== CHOICE_PARAMS_TIMING.AT_SELECTION) continue;
      assert.ok(ability.paramsSchema, `${ability.id}: paramsSchema mancante`);
    }
  }
});

// ------------------------------------------------------------------
// Igiene informativa dei gate (spec §3.2)
// ------------------------------------------------------------------

test('igiene informativa: nessun gate anticipato lascia una sola abilità sigillata', () => {
  // Se, superato un gate, l'insieme delle abilità ancora sigillate ha cardinalità 1,
  // il silenzio identifica la scelta con certezza. Cardinalità 0 è ammessa: significa
  // che l'Eminenza è dichiaratamente a informazione aperta a quel gate.
  for (const [sequenceName, sequence] of Object.entries(GATE_SEQUENCES)) {
    for (const id of EMINENCE_IDS) {
      const abilities = EMINENCES[id].abilities;
      const opened = new Set();

      for (const gate of sequence) {
        if (gate === REVEAL_GATES.GENERAL) break;
        for (const ability of abilities) {
          if (ability.revealGate === gate) opened.add(ability.id);
        }
        const sealed = abilities.filter((ability) => !opened.has(ability.id));
        assert.notEqual(
          sealed.length,
          1,
          `${id} in sequenza ${sequenceName}: dopo ${gate} resta sigillata la sola ${sealed[0]?.id}`
        );
      }
    }
  }
});

test('igiene informativa: Khemet apre tutte e tre le attive a PRE_FIELD', () => {
  const gates = EMINENCES.khemet_maledizioni.abilities.map((a) => a.revealGate);
  assert.deepEqual(gates, [
    REVEAL_GATES.PRE_FIELD,
    REVEAL_GATES.PRE_FIELD,
    REVEAL_GATES.PRE_FIELD,
  ]);
});

// ------------------------------------------------------------------
// Eleggibilità e deckbuilding (§1.2)
// ------------------------------------------------------------------

test('eleggibilità: soglia di 5 carte su 10', () => {
  const deck = buildDeck({ Apex: 5, Khemet: 5 });
  assert.deepEqual(countCardsByArmy(deck), { Apex: 5, Khemet: 5 });
  assert.deepEqual(getEligibleArmies(deck).sort(), ['Apex', 'Khemet']);
});

test('eleggibilità: un Deck 5-5 rende eleggibili due Eminenze', () => {
  const eligible = getEligibleEminences(buildDeck({ Apex: 5, Khemet: 5 }));
  assert.equal(eligible.length, 2);
});

test('eleggibilità: un Deck 4-3-3 non rende eleggibile nessuna Eminenza', () => {
  const deck = buildDeck({ Apex: 4, Khemet: 3, Orathai: 3 });
  assert.deepEqual(getEligibleEminences(deck), []);
});

test('eleggibilità: 6-4 rende eleggibile solo l\'Armata maggioritaria', () => {
  const eligible = getEligibleEminences(buildDeck({ Apex: 6, Khemet: 4 }));
  assert.deepEqual(eligible.map((e) => e.id), ['apex_sole_verde']);
});

test('validazione: il formato con Eminenze richieste rifiuta un Deck senza Eminenza', () => {
  const deck = buildDeck({ Apex: 5, Khemet: 5 });
  assert.deepEqual(validateDeckEminence(deck, null), {
    valid: false,
    reason: 'MISSING_EMINENCE',
  });
});

test('validazione: l\'Eminenza deve appartenere a un\'Armata eleggibile', () => {
  const deck = buildDeck({ Apex: 6, Khemet: 4 });
  assert.equal(validateDeckEminence(deck, 'khemet_maledizioni').reason, 'ARMY_NOT_ELIGIBLE');
  assert.equal(validateDeckEminence(deck, 'apex_sole_verde').valid, true);
});

test('validazione: id sconosciuto rifiutato', () => {
  const deck = buildDeck({ Apex: 10 });
  assert.equal(validateDeckEminence(deck, 'non_esiste').reason, 'UNKNOWN_EMINENCE');
});

test('validazione: il formato disattivato accetta qualunque cosa', () => {
  const deck = buildDeck({ Apex: 4, Khemet: 3, Orathai: 3 });
  assert.equal(validateDeckEminence(deck, null, EMINENCE_FORMAT.DISABLED).valid, true);
});

// ------------------------------------------------------------------
// Stato (§4)
// ------------------------------------------------------------------

test('stato: la Presenza iniziale viene dal catalogo', () => {
  assert.equal(createEminenceState('apex_sole_verde').presence, 3);
  assert.equal(createEminenceState('patto_grande_semaforo').presence, 0);
  assert.equal(createEminenceState('khemet_maledizioni').presence, 2);
});

test('stato: il fallback null non è uno stato competitivo', () => {
  const state = createEminenceState(null);
  assert.equal(state.eminenceId, null);
  // Il valore numerico è 0 solo per non rompere l'aritmetica: chi legge deve prima
  // verificare eminenceId, non dedurre "Presenza 0" da questo stato.
  assert.equal(state.presence, 0);
});

test('stato: il formato disattivato non istanzia alcuno stato Eminenza', () => {
  const matchState = createEminenceMatchState({ format: EMINENCE_FORMAT.DISABLED });
  assert.equal(isEminenceSubsystemEnabled(matchState), false);
  assert.equal(matchState.player, null);
  assert.equal(matchState.enemy, null);
});

test('reset di round: conserva Presenza e stato persistente, azzera la selezione', () => {
  const state = {
    ...createEminenceState('apex_sole_verde'),
    presence: 5,
    presenceSpentThisRound: 2,
    totalPresenceSpent: 4,
    selectedAbilityId: 'apex_cataclisma',
    selectedParams: { foo: 1 },
    committedPresenceCost: 4,
    revealedAbilityId: 'apex_cataclisma',
    revealGateReached: REVEAL_GATES.GENERAL,
  };
  state.persistent.preyCardIds.push(42);
  state.round.suppressArmyBonus = true;

  const next = resetEminenceRoundState(state);

  assert.equal(next.presence, 5);
  assert.equal(next.totalPresenceSpent, 4);
  assert.deepEqual(next.persistent.preyCardIds, [42]);
  assert.equal(next.presenceSpentThisRound, 0);
  assert.equal(next.selectedAbilityId, null);
  assert.equal(next.revealedAbilityId, null);
  assert.equal(next.revealGateReached, null);
  assert.equal(next.round.suppressArmyBonus, false);
});

test('reset di round: il blocco pianificato diventa blocco del round che comincia', () => {
  const state = { ...createEminenceState('apex_sole_verde'), blockedNextRound: true };
  const next = resetEminenceRoundState(state);
  assert.equal(next.blockedThisRound, true);
  assert.equal(next.blockedNextRound, false);

  const after = resetEminenceRoundState(next);
  assert.equal(after.blockedThisRound, false);
});

test('reset di round: il checkpoint di selezione riparte dalla Presenza corrente', () => {
  const state = { ...createEminenceState('apex_sole_verde'), presence: 7 };
  assert.equal(resetEminenceRoundState(state).selectionCheckpointPresence, 7);
});

test('reset di round: applicato a entrambi i lati', () => {
  const matchState = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  matchState.player.selectedAbilityId = 'apex_furia';
  matchState.enemy.selectedAbilityId = 'semaforo_verde';

  const next = resetEminenceMatchRound(matchState);
  assert.equal(next.player.selectedAbilityId, null);
  assert.equal(next.enemy.selectedAbilityId, null);
});

// ------------------------------------------------------------------
// Confine informativo (§4.1)
// ------------------------------------------------------------------

test('confine informativo: la proiezione pubblica non espone la selezione segreta', () => {
  const state = {
    ...createEminenceState('apex_sole_verde'),
    selectedAbilityId: 'apex_cataclisma',
    selectedParams: { slot: 2 },
    selectionSnapshotPresence: 4,
    committedPresenceCost: 4,
  };

  const publicState = selectPublicEminenceState(state);
  const serialized = JSON.stringify(publicState);

  assert.equal(publicState.selectedAbilityId, undefined);
  assert.equal(publicState.selectedParams, undefined);
  assert.equal(publicState.committedPresenceCost, undefined);
  assert.equal(serialized.includes('apex_cataclisma'), false);
  // Che una scelta sigillata esista è pubblico; quale sia, no.
  assert.equal(publicState.hasSealedSelection, true);
});

test('confine informativo: la vista di un lato include solo la propria selezione', () => {
  const matchState = createEminenceMatchState({
    playerEminenceId: 'apex_sole_verde',
    enemyEminenceId: 'patto_grande_semaforo',
  });
  matchState.player.selectedAbilityId = 'apex_furia';
  matchState.enemy.selectedAbilityId = 'semaforo_rosso';

  const view = selectPublicEminenceMatchState(matchState, 'player');

  assert.equal(view.player.private.selectedAbilityId, 'apex_furia');
  assert.equal(view.enemy.private, undefined);
  assert.equal(JSON.stringify(view.enemy).includes('semaforo_rosso'), false);
});

test('confine informativo: la Presenza al checkpoint di selezione è pubblica', () => {
  // La deduzione di legalità dell'IA deve poterla leggere senza toccare lo stato segreto.
  const state = { ...createEminenceState('apex_sole_verde'), selectionCheckpointPresence: 4 };
  assert.equal(selectPublicEminenceState(state).selectionCheckpointPresence, 4);
  assert.equal(selectPrivateEminenceSelection(state).selectedAbilityId, null);
});

// ------------------------------------------------------------------
// Legalità della scelta (§2.3)
// ------------------------------------------------------------------

test('legalità: le abilità a costo negativo richiedono Presenza sufficiente', () => {
  assert.deepEqual(getLegalAbilityIds('apex_sole_verde', 0), ['apex_furia']);
  assert.deepEqual(getLegalAbilityIds('apex_sole_verde', 2), ['apex_furia', 'apex_disprezzo']);
  assert.equal(getLegalAbilityIds('apex_sole_verde', 4).length, 3);
});

test('legalità: il Grande Semaforo a 0 Presenza non può scegliere Rosso', () => {
  assert.equal(isAbilitySelectable('patto_grande_semaforo', 'semaforo_rosso', 0), false);
  assert.equal(isAbilitySelectable('patto_grande_semaforo', 'semaforo_verde', 0), true);
  assert.equal(isAbilitySelectable('patto_grande_semaforo', 'semaforo_rosso', 2), true);
});

test('legalità: il costo esatto è pagabile', () => {
  assert.equal(isAbilitySelectable('apex_sole_verde', 'apex_cataclisma', 4), true);
  assert.equal(isAbilitySelectable('apex_sole_verde', 'apex_cataclisma', 3), false);
});

// ------------------------------------------------------------------
// Accessori
// ------------------------------------------------------------------

test('accessori: lookup per id, Armata e abilità', () => {
  assert.equal(getEminence('apex_sole_verde').name, 'Il Sole Verde');
  assert.equal(getEminenceForArmy('Apex').id, 'apex_sole_verde');
  assert.equal(getEminenceAbility('apex_sole_verde', 'apex_furia').presenceDelta, 1);
  assert.equal(getEminence('inesistente'), null);
  assert.equal(getEminenceAbility('apex_sole_verde', 'inesistente'), null);
});
