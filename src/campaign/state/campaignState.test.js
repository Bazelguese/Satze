import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ACT } from '../data/atto1.js';
import {
  NASCENTE_ID,
  createCampaignRun,
  campaignReducer,
  validateDeck,
  deckTotalLeague,
} from './campaignState.js';
import {
  getMissionForNode,
  buildDuelConfig,
  resolveRunDeckCards,
  applyDuelResult,
} from '../logic/missionAdapter.js';
import {
  loadCampaignRun,
  saveCampaignRun,
  getCampaignRunSummary,
  clearCampaignRun,
} from './persistence.js';

// ---- shim localStorage per i test di persistenza ----
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

beforeEach(() => store.clear());

const newRun = (opts = {}) => createCampaignRun(ACT, { seed: 42, ...opts });

// ---- creazione run ----

test('run iniziale: prologo disponibile, resto bloccato, Nascente nel mazzo', () => {
  const run = newRun();
  assert.equal(run.day, 1);
  assert.equal(run.daysLimit, 14);
  assert.equal(run.nodes.n_prologo, 'available');
  assert.equal(run.nodes.n_enclave_a, 'locked');
  assert.equal(run.nodes.n_faro, 'locked');
  assert.equal(run.nodes.n_faglia_1, 'locked');
  assert.ok(run.deck.includes(NASCENTE_ID));
  assert.equal(run.outcome, null);
});

// ---- loop missione ----

test('vittoria al Prologo: nodo completato, enclave sbloccate, giorno +1, evento Impronta pendente', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'START_MISSION', nodeId: 'n_prologo' }, ACT);
  assert.equal(run.currentNode, 'n_prologo');
  run = campaignReducer(
    run,
    { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' },
    ACT
  );
  assert.equal(run.nodes.n_prologo, 'completed');
  assert.equal(run.nodes.n_enclave_a, 'available');
  assert.equal(run.nodes.n_enclave_b, 'available');
  assert.equal(run.nodes.n_enclave_c, 'available');
  assert.equal(run.day, 2);
  assert.ok(run.pendingEvents.includes('EV_impronta'));
  assert.equal(run.history.length, 1);
  assert.equal(run.history[0].result, 'player');
});

test('sconfitta: non è game over — nodo ancora disponibile, il giorno passa', () => {
  let run = newRun();
  run = campaignReducer(
    run,
    { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'enemy' },
    ACT
  );
  assert.equal(run.nodes.n_prologo, 'available');
  assert.equal(run.day, 2);
  assert.equal(run.outcome, null);
  assert.equal(run.pendingEvents.length, 0); // gli eventi afterMission arrivano solo in vittoria
});

test('§req-or: la Roccaforte si apre con UNA QUALSIASI enclave', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-03', nodeId: 'n_enclave_b', winner: 'player' }, ACT);
  assert.equal(run.nodes.n_roccaforte, 'available');
});

test('vittoria sul boss: outcome "won" senza consumare il giorno', () => {
  let run = newRun();
  // percorso: prologo → enclave_b → roccaforte → faro
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-03', nodeId: 'n_enclave_b', winner: 'player' }, ACT);
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-05', nodeId: 'n_roccaforte', winner: 'player' }, ACT);
  const dayBefore = run.day;
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-08', nodeId: 'n_faro', winner: 'player' }, ACT);
  assert.equal(run.outcome, 'won');
  assert.equal(run.day, dayBefore);
});

// ---- invarianti mazzo ----

test('SET_DECK: rimuovere il Nascente è vietato', () => {
  const run = newRun();
  assert.throws(() =>
    campaignReducer(run, { type: 'SET_DECK', deck: run.deck.filter((id) => id !== NASCENTE_ID) }, ACT)
  );
});

test('SET_DECK: duplicati vietati', () => {
  const run = newRun();
  assert.throws(() =>
    campaignReducer(run, { type: 'SET_DECK', deck: [...run.deck, run.deck[1]] }, ACT)
  );
});

test('SET_DECK: swap col magazzino aggiorna il magazzino', () => {
  const run = newRun();
  const fromWarehouse = run.warehouse[0];
  const dropped = run.deck.find((id) => id !== NASCENTE_ID);
  const nextDeck = run.deck.map((id) => (id === dropped ? fromWarehouse : id));
  const next = campaignReducer(run, { type: 'SET_DECK', deck: nextDeck }, ACT);
  assert.ok(next.deck.includes(fromWarehouse));
  assert.ok(next.warehouse.includes(dropped));
  assert.ok(!next.warehouse.includes(fromWarehouse));
});

test('validateDeck: Lega totale oltre 30 → non valido', () => {
  const run = newRun();
  // 9 carte L3+ dei Figli sforano facilmente
  const heavy = [NASCENTE_ID, 101, 102, 103, 104, 105, 106, 112, 113];
  const check = validateDeck(heavy, run.nascente);
  assert.equal(check.ok, false);
  assert.ok(check.errors.some((e) => e.includes('Lega')));
  assert.ok(deckTotalLeague(heavy, run.nascente) > 30);
});

// ---- eventi ----

test("APPLY_EVENT_CHOICE: l'Impronta imposta trigger+effetto del Nascente", () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  assert.ok(run.pendingEvents.includes('EV_impronta'));
  run = campaignReducer(run, { type: 'APPLY_EVENT_CHOICE', eventId: 'EV_impronta', choiceIndex: 0 }, ACT);
  assert.equal(run.nascente.trigger, 'turbo');
  assert.equal(run.nascente.effect, 'power');
  assert.equal(run.nascente.value, 1);
  assert.ok(!run.pendingEvents.includes('EV_impronta'));
});

test('eventi visti non si ripresentano', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  run = campaignReducer(run, { type: 'APPLY_EVENT_CHOICE', eventId: 'EV_impronta', choiceIndex: 2 }, ACT);
  // ripetere la missione non riapre l'evento
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  assert.ok(!run.pendingEvents.includes('EV_impronta'));
});

// ---- ciclo del giorno ----

test('spawn Faglia nei giorni previsti; lo slot diventa disponibile', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // day 2
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // day 3 → spawn
  assert.equal(run.day, 3);
  assert.equal(run.faglie.length, 1);
  const f = run.faglie[0];
  assert.equal(run.nodes[f.nodeId], 'available');
  assert.equal(f.closesDay, 3 + ACT.faglie.durationDays);
});

test('Faglia ignorata: collassa alla scadenza e libera lo slot', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 2
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 3 spawn (closes 6)
  const nodeId = run.faglie[0].nodeId;
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 4
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 5
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 6 (spawn seconda faglia)
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // 7 → collasso della prima
  assert.ok(!run.faglie.some((f) => f.nodeId === nodeId));
  assert.equal(run.flags.faglie_collassate >= 1, true);
});

test('criterio 9: superato il giorno limite → esito tempo_scaduto, non crash', () => {
  let run = newRun();
  for (let i = 0; i < 20; i++) {
    run = campaignReducer(run, { type: 'END_DAY' }, ACT);
  }
  assert.equal(run.outcome, 'tempo_scaduto');
  assert.equal(run.day, run.daysLimit + 1);
});

test('contrattacco programmato: al giorno 10 una enclave completata torna disponibile', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT); // day 2
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-02', nodeId: 'n_enclave_a', winner: 'player' }, ACT); // day 3
  assert.equal(run.nodes.n_enclave_a, 'completed');
  while (run.day < 10) {
    run = campaignReducer(run, { type: 'END_DAY' }, ACT);
  }
  assert.equal(run.day, 10);
  assert.equal(run.nodes.n_enclave_a, 'available'); // ripresa dal nemico
  assert.equal(run.flags.contrattacchi?.length, 1);
});

test('ricompensa missione: vittoria aggiunge carte al magazzino (solo la prima volta)', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  const before = run.warehouse.length;
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-02', nodeId: 'n_enclave_a', winner: 'player' }, ACT);
  assert.ok(run.warehouse.includes(106));
  assert.equal(run.warehouse.length, before + 1);
  // seconda vittoria sulla stessa missione (dopo contrattacco): nessun doppione
  run = { ...run, nodes: { ...run.nodes, n_enclave_a: 'available' } };
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-02', nodeId: 'n_enclave_a', winner: 'player' }, ACT);
  assert.equal(run.warehouse.filter((id) => id === 106).length, 1);
});

test('previewEventChoiceLeague: segnala il salto di Lega prima della conferma', async () => {
  const { previewEventChoiceLeague } = await import('./campaignState.js');
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  const impronta = ACT.events.find((e) => e.id === 'EV_impronta');
  const preview = previewEventChoiceLeague(run, impronta.choices[0].effect);
  assert.equal(typeof preview.league, 'number');
  assert.equal(preview.leagueOk, true);
  assert.ok(preview.nascenteLeague >= 2);
});

test('chiudere una Faglia con la vittoria la rimuove e libera lo slot', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'END_DAY' }, ACT);
  run = campaignReducer(run, { type: 'END_DAY' }, ACT); // day 3 spawn
  const faglia = run.faglie[0];
  const mission = getMissionForNode(ACT, run, faglia.nodeId);
  assert.ok(mission);
  assert.ok(mission.isFaglia);
  run = applyDuelResult(run, ACT, mission, { winner: 'player' });
  assert.equal(run.faglie.length, 0);
  assert.equal(run.nodes[faglia.nodeId], 'locked');
});

// ---- adapter ----

test('buildDuelConfig: fields, enemyLife e winCondition dalla missione', () => {
  const run = newRun();
  const m03 = ACT.missions.find((m) => m.id === 'A1-03');
  const cfg = buildDuelConfig(m03, run, ACT);
  assert.equal(cfg.campaignDuelMod.fields, 3);
  assert.equal(cfg.campaignDuelMod.enemyLife, 8);
  assert.equal(cfg.campaignDuelMod.winCondition, 'annihilation_only');
  assert.equal(cfg.campaignDuelMod.initiativeProfile, null);
  assert.equal(cfg.enemyArmy, "L'Enclave delle Scaglie");
});

test('buildDuelConfig: default 5 campi / 25 PV se assenti', () => {
  const run = newRun();
  const cfg = buildDuelConfig(
    { id: 'X', node: 'n_prologo', objective: 'assalto', enemy: { army: 'Kethran', deck: [207] } },
    run,
    ACT
  );
  assert.equal(cfg.campaignDuelMod.fields, 5);
  assert.equal(cfg.campaignDuelMod.enemyLife, 25);
  assert.equal(cfg.campaignDuelMod.playerLife, 25);
  assert.equal(cfg.campaignDuelMod.initiativeProfile, 'assault');
});

test('resolveRunDeckCards: il Nascente è assemblato al volo, non dal pool', () => {
  const run = newRun();
  const cards = resolveRunDeckCards(run);
  assert.equal(cards.length, run.deck.length);
  const nascente = cards.find((c) => c.id === NASCENTE_ID);
  assert.ok(nascente);
  assert.equal(nascente.ability, null);
  assert.equal(nascente.league, 2);
  assert.equal(nascente.evolving, true);
});

// ---- persistenza (criterio 8) ----

test('criterio 8: salvataggio e ripresa → stato identico', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  run = campaignReducer(run, { type: 'APPLY_EVENT_CHOICE', eventId: 'EV_impronta', choiceIndex: 1 }, ACT);
  saveCampaignRun(run, 0);
  const loaded = loadCampaignRun(0, ACT);
  assert.ok(loaded);
  const { savedAt: _a, ...savedRest } = loaded;
  const { savedAt: _b, ...origRest } = run;
  assert.deepEqual(savedRest, origRest);
});

test('slot legacy (vecchio modello) → trattato come non-run, summary legacy', () => {
  localStorage.setItem('satze_campaign_slot_1', JSON.stringify({ meta: { day: 3 }, war: {} }));
  assert.equal(loadCampaignRun(1, ACT), null);
  const s = getCampaignRunSummary(1);
  assert.equal(s.empty, true);
  assert.equal(s.legacy, true);
});

test('summary di uno slot attivo', () => {
  let run = newRun();
  run = campaignReducer(run, { type: 'APPLY_DUEL_RESULT', missionId: 'A1-00', nodeId: 'n_prologo', winner: 'player' }, ACT);
  saveCampaignRun(run, 2);
  const s = getCampaignRunSummary(2);
  assert.equal(s.empty, false);
  assert.equal(s.day, 2);
  assert.equal(s.missionsCompleted, 1);
  clearCampaignRun(2);
  assert.equal(getCampaignRunSummary(2).empty, true);
});
