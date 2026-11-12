import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundDuello, partitaDuello, partitaMultiPosto, latoScontro } from './recordPartita.js';
import { riepilogoPartita } from './telemetria.js';

const carta = (id, name, army, league) => ({ id, name, army, league, power: 3, damage: 2 });
const br = {
  winner: 'player',
  playerAgent: carta(101, 'Sorethai', "Figli dell'Orizzonte", 3),
  enemyAgent: carta(205, 'Chimera', 'Kethran', 4),
  playerAssault: 15, enemyAssault: 12,
  playerPower: 3, enemyPower: 4, playerDamage: 2, enemyDamage: 3,
  playerFocusInvested: 5, enemyFocusInvested: 3, playerTemporaryFocus: 0, enemyTemporaryFocus: 1,
  playerAbilityTriggered: true, enemyAbilityTriggered: false, enemyAbilityBlocked: true,
  playerHasBonus: false, enemyHasBonus: true,
  damageDealt: 2, field: { id: 9, name: 'Porte di Atlantide' }, fieldIndex: 2, perfectFocusSide: 'player',
};

test('latoScontro legge le statistiche di un lato', () => {
  const tu = latoScontro(br, 'player');
  assert.deepEqual(tu.agente, { id: 101, nome: 'Sorethai', armata: "Figli dell'Orizzonte", lega: 3 });
  assert.equal(tu.fc, 5);
  assert.equal(tu.va, 15);
  assert.equal(tu.potere, 'attivo');
  assert.equal(latoScontro(br, 'enemy').potere, 'bloccato');
  assert.equal(latoScontro(br, 'enemy').bonus, 'attivo');
});

test('roundDuello senza Eminenze', () => {
  const r = roundDuello({ roundNumber: 2, battleResult: br, isPlayerFirst: false, pvTu: 25, pvAvversario: 23, eminenze: { enabled: false } });
  assert.equal(r.n, 2);
  assert.equal(r.vincitore, 'tu');
  assert.equal(r.primo, 'avversario');
  assert.deepEqual(r.campo, { id: 9, nome: 'Porte di Atlantide', slot: 2 });
  assert.equal(r.perfect, 'tu');
  assert.deepEqual(r.pvDopo, { tu: 25, avversario: 23 });
  assert.equal(r.tu.eminenza, undefined);
});

test('roundDuello con Eminenze registra abilità e Presenza', () => {
  const eminenze = {
    enabled: true,
    player: { eminenceId: 'apex_sole_verde', revealedAbilityId: 'inesistente', presence: 2, presenceSpentThisRound: 1 },
    enemy: { eminenceId: null },
  };
  const r = roundDuello({ roundNumber: 1, battleResult: br, isPlayerFirst: true, pvTu: 25, pvAvversario: 23, eminenze });
  assert.equal(r.tu.eminenza.abilita, 'inesistente'); // id sconosciuto: resta l'id
  assert.equal(r.tu.eminenza.presenzaDopo, 2);
  assert.equal(r.avversario.eminenza, null);
});

test('partitaDuello: formato, esito e riepilogo leggibile', () => {
  const round = [roundDuello({ roundNumber: 1, battleResult: br, isPlayerFirst: true, pvTu: 25, pvAvversario: 23 })];
  const p = partitaDuello({
    idPartita: 'P-1', inizio: 1_000, fine: 301_000, round,
    gameResult: { winner: 'player', reason: 'fields', playerFields: 3, enemyFields: 1 },
    online: null, aiDifficulty: 'medium', gameMode: 'classic', eminenze: { enabled: false },
    giocatore: { armata: "Figli dell'Orizzonte", esercito: 'A', mano: [br.playerAgent], pv: 20 },
    avversario: { mano: [br.enemyAgent], pv: 4 },
  });
  assert.equal(p.modalita, 'duello');
  assert.equal(p.formato, 'noEminenza');
  assert.equal(p.esito, 'vittoria');
  assert.equal(p.motivo, 'Campi');
  assert.equal(p.durataSecondi, 300);
  assert.equal(p.avversari[0].armata, 'Kethran');
  assert.equal(p.avversari[0].tipo, 'IA');
  const riga = riepilogoPartita({ ...p, versione: '0.1.0', giocatore: { ...p.giocatore, nome: 'Davide' } });
  assert.match(riga, /Davide/);
  assert.match(riga, /Duello No Eminenza/);
  assert.match(riga, /Figli dell'Orizzonte vs Kethran/);
  assert.match(riga, /Vittoria \(Campi\)/);
  assert.match(riga, /5 min/);
});

test('partitaDuello online e Mani nude', () => {
  const p = partitaDuello({
    idPartita: 'P-2', inizio: null, fine: 1, round: [], gameResult: { winner: 'enemy', reason: 'hp' },
    online: { stanza: 'ABC123' }, aiDifficulty: 'multiplayer', gameMode: 'bareHands', eminenze: { enabled: false },
    giocatore: {}, avversario: { nome: 'Luca' },
  });
  assert.equal(p.modalita, 'multiplayer');
  assert.equal(p.formato, 'maniNude');
  assert.equal(p.difficolta, null);
  assert.equal(p.avversari[0].tipo, 'umano');
  assert.equal(p.avversari[0].nome, 'Luca');
  assert.equal(p.stanza, 'ABC123');
  assert.equal(p.esito, 'sconfitta');
});

test('partitaMultiPosto 2v2: compagno separato dagli avversari, fronti per posto', () => {
  const seat = (id, team, isHuman = false) => ({ id, team, isHuman, name: id, army: `Armata ${id}`, hand: [], hp: 0, conquests: 0 });
  const p = partitaMultiPosto({
    idPartita: 'P-3', inizio: 0, fine: 60_000,
    gameResult: { winner: 'player', reason: 'fields' },
    telemetria: {
      opzioni: { kind: 'teamDuel', fieldMode: 'classic', difficulty: 'hard', teammatePreset: 'stratega' },
      posti: [seat('A1', 'A', true), seat('A2', 'A'), seat('B1', 'B'), seat('B2', 'B')],
      storico: [{
        roundNumber: 1, openingTeam: 'A', pairing: 'crossed', investments: { A1: 3, A2: 2, B1: 4, B2: 1 }, hpAfter: { A: 50, B: 46 },
        fronts: [{ fieldIndex: 0, firstSeatId: 'A1', playerSeatId: 'A1', enemySeatId: 'B2', winnerSeatId: 'A1', battleResult: br }],
      }],
    },
  });
  assert.equal(p.modalita, '2v2');
  assert.equal(p.formato, 'noEminenza');
  assert.equal(p.compagno.posto, 'A2');
  assert.deepEqual(p.avversari.map((a) => a.posto), ['B1', 'B2']);
  assert.equal(p.round[0].fronti[0].lati.A1.agente.nome, 'Sorethai');
  assert.equal(p.round[0].fronti[0].lati.B2.agente.nome, 'Chimera');
  assert.equal(p.round[0].disposizione, 'crossed');
});

test('partitaMultiPosto Re della collina', () => {
  const p = partitaMultiPosto({
    idPartita: 'P-4', inizio: 0, fine: 1,
    gameResult: { winner: 'enemy', reason: 'hp' },
    telemetria: {
      opzioni: { kind: 'kingOfHill', fieldMode: 'bareHands', players: 3 },
      posti: [{ id: 'P1', isHuman: true }, { id: 'P2' }, { id: 'P3' }],
      storico: [{
        roundNumber: 1, fieldIndex: 1, order: ['P2', 'P1', 'P3'], commits: { P1: { cardId: 101, investment: 4 } }, conquerorSeatId: 'P2',
        fights: [{ playerSeatId: 'P1', enemySeatId: 'P2', winnerSeatId: 'P2', battleResult: br, eliminated: ['P1'] }],
      }],
    },
  });
  assert.equal(p.modalita, 'reDellaCollina');
  assert.equal(p.formato, 'maniNude');
  assert.equal(p.giocatori, 3);
  assert.equal(p.round[0].fc.P1, 4);
  assert.deepEqual(p.round[0].scontri[0].eliminati, ['P1']);
  assert.equal(p.round[0].conquista, 'P2');
});

test('partitaDuello del Torneo: modalità Torneo con incontro e numero di partita', () => {
  const p = partitaDuello({
    idPartita: 'P-3', inizio: null, fine: 1, round: [], gameResult: { winner: 'player', reason: 'hp' },
    online: null, aiDifficulty: 'hard', gameMode: 'classic', eminenze: { enabled: true, player: null, enemy: null },
    giocatore: {}, avversario: {}, torneo: { incontro: 'QF-2', partita: 3 },
  });
  assert.equal(p.modalita, 'torneo');
  assert.deepEqual(p.torneo, { incontro: 'QF-2', partita: 3 });
  assert.equal(p.difficolta, 'hard');
  assert.match(riepilogoPartita({ ...p, versione: '0.1.1', giocatore: { ...p.giocatore, nome: 'Davide' } }), /Torneo Standard/);
  // Senza torneo il campo resta vuoto.
  assert.equal(partitaDuello({ idPartita: 'P-4', inizio: null, fine: 1, round: [], gameResult: {}, online: null, gameMode: 'classic', eminenze: {}, giocatore: {}, avversario: {} }).torneo, null);
});

test('partite online: nome del profilo e, tra parentesi, quello della stanza', () => {
  const p = partitaDuello({
    idPartita: 'P-5', inizio: null, fine: 1, round: [], gameResult: { winner: 'player', reason: 'hp' },
    online: { stanza: 'XYZ789' }, gameMode: 'classic', eminenze: { enabled: false },
    giocatore: { nomeOnline: 'Dado' }, avversario: { nome: 'Luca' },
  });
  assert.equal(p.giocatore.nomeOnline, 'Dado');
  const riga = riepilogoPartita({ ...p, versione: '0.1.1', giocatore: { nome: 'Davide', ...p.giocatore } });
  assert.match(riga, /^\*\*Davide\*\* \(Dado\)/);
  // In locale niente parentesi.
  const locale = partitaDuello({ idPartita: 'P-6', inizio: null, fine: 1, round: [], gameResult: {}, online: null, gameMode: 'classic', eminenze: {}, giocatore: { nomeOnline: null }, avversario: {} });
  assert.equal('nomeOnline' in locale.giocatore, false);
  assert.match(riepilogoPartita({ ...locale, giocatore: { nome: 'Davide', ...locale.giocatore } }), /^\*\*Davide\*\* ·/);
});
