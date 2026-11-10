import { describe, it, expect } from 'vitest';
import {
  createHeadlessMatch,
  playHeadlessMatch,
  playHeadlessRound,
  resolveMatchEnd,
  viewForSide,
  listPresetDecks,
  legalFieldIndexes,
} from './headlessMatch.js';
import { createAgentFromSpec, createGreedyAgent } from './simAgents.js';
import { buildAIInformationSet } from '../ai/buildAIInformationSet.js';

const decks = listPresetDecks();
const deckA = decks[0];
const deckB = decks[5];

function newMatch(seed = 7, extra = {}) {
  return createHeadlessMatch({ seed, player: deckA, enemy: deckB, ...extra });
}

describe('partita senza interfaccia: setup', () => {
  it('stesso seme → stesso setup; mani da 5, 25 PV, 18 FC, 3 Campi rivelati', () => {
    const a = newMatch(11);
    const b = newMatch(11);
    expect(a.playerHand.map((c) => c.id)).toEqual(b.playerHand.map((c) => c.id));
    expect(a.battlefields.map((f) => f.id)).toEqual(b.battlefields.map((f) => f.id));
    expect(a.playerHand).toHaveLength(5);
    expect(a.enemyHand).toHaveLength(5);
    expect(a.battlefields).toHaveLength(5);
    expect([a.playerHP, a.enemyHP, a.playerFocus, a.enemyFocus]).toEqual([25, 25, 18, 18]);
    expect(a.revealedFields).toBe(3);
  });

  it('Mani nude: tutti i Campi rivelati', () => {
    expect(newMatch(11, { mode: 'bareHands' }).revealedFields).toBe(5);
  });

  it('apre chi ha la Lega totale più bassa', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const s = newMatch(seed);
      const { player, enemy } = s.leagueSums;
      if (player < enemy) expect(s.openingPlayerFirst).toBe(true);
      if (player > enemy) expect(s.openingPlayerFirst).toBe(false);
    }
  });
});

describe('partita senza interfaccia: prospettive e informazione nascosta', () => {
  it('la vista del giocatore scambia i lati, Campi e iniziativa', () => {
    const s = {
      ...newMatch(3),
      conqueredFields: { 0: { winner: 'player', army: 'X' } },
      lastWinner: 'player',
      isPlayerFirst: true,
      openingPlayerFirst: true,
    };
    const view = viewForSide(s, 'player');
    expect(view.enemyHand).toBe(s.playerHand);
    expect(view.playerHand).toBe(s.enemyHand);
    expect(view.conqueredFields[0].winner).toBe('enemy');
    expect(view.lastWinner).toBe('enemy');
    expect(view.isPlayerFirst).toBe(false);
    expect(view.openingPlayerFirst).toBe(false);

    const info = buildAIInformationSet({ ...view, aiDifficulty: 'medium' });
    expect(info.ai.hand.map((c) => c.id)).toEqual(s.playerHand.map((c) => c.id));
    expect(info.enemyFieldsConquered).toBe(1);
  });

  it('chi risponde vede l’Agente avversario ma non i suoi FC', () => {
    const s = newMatch(5);
    const seen = [];
    const spy = (inner) => ({
      lead: (view) => {
        seen.push({ role: 'lead', view });
        return inner.lead(view);
      },
      respond: (view) => {
        seen.push({ role: 'respond', view });
        return inner.respond(view);
      },
    });
    playHeadlessRound(s, {
      player: spy(createGreedyAgent()),
      enemy: spy(createGreedyAgent()),
    });
    const lead = seen.find((x) => x.role === 'lead').view;
    const respond = seen.find((x) => x.role === 'respond').view;
    expect(lead.selectedAgent).toBeNull();
    expect(respond.selectedAgent).not.toBeNull();
    expect(respond.currentFieldIndex).not.toBeNull();
    for (const view of [lead, respond]) {
      expect(view).not.toHaveProperty('selectedFocus');
      expect(view).not.toHaveProperty('enemySelectedFocus');
    }
  });
});

describe('partita senza interfaccia: turni e fine partita', () => {
  it('l’iniziativa si alterna a ogni turno, qualunque sia l’esito', () => {
    const s = newMatch(9);
    const result = playHeadlessMatch(s, {
      player: createGreedyAgent(),
      enemy: createGreedyAgent(),
    });
    result.rounds.forEach((round, i) => {
      const playerLeads = s.openingPlayerFirst === (i % 2 === 0);
      expect(round.leader).toBe(playerLeads ? 'player' : 'enemy');
    });
  });

  it('il Campo scelto è sempre legale e non viene ripetuto', () => {
    const result = playHeadlessMatch(newMatch(13), {
      player: createAgentFromSpec('random', { seed: 1 }),
      enemy: createAgentFromSpec('random', { seed: 2 }),
    });
    const fields = result.rounds.map((r) => r.fieldIndex);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it('maggioranza dei Campi prima del turno 5 → vittoria; dal turno 5 decide la Supremazia', () => {
    const base = newMatch(1);
    const conquered = {
      0: { winner: 'enemy' },
      1: { winner: 'enemy' },
      2: { winner: 'enemy' },
    };
    const s = { ...base, conqueredFields: conquered, playerHP: 20, enemyHP: 5 };
    expect(resolveMatchEnd(s, 4)).toEqual({ winner: 'enemy', reason: 'fields' });
    // Turno 5 con carte finite: vince chi ha più PV
    const exhausted = {
      ...s,
      playerUsedCards: s.playerHand.map((c) => c.id),
      enemyUsedCards: s.enemyHand.map((c) => c.id),
    };
    expect(resolveMatchEnd(exhausted, 5)).toEqual({ winner: 'player', reason: 'supremacy' });
  });

  it('PV a zero, spareggio sui Campi e pareggio', () => {
    const base = newMatch(1);
    expect(resolveMatchEnd({ ...base, playerHP: 0, enemyHP: 0 }, 2)).toEqual({
      winner: 'enemy',
      reason: 'hp',
    });
    const exhausted = {
      ...base,
      playerUsedCards: base.playerHand.map((c) => c.id),
      enemyUsedCards: base.enemyHand.map((c) => c.id),
      playerHP: 10,
      enemyHP: 10,
    };
    expect(
      resolveMatchEnd({ ...exhausted, conqueredFields: { 0: { winner: 'player' } } }, 5)
    ).toEqual({ winner: 'player', reason: 'fields_tiebreak' });
    expect(resolveMatchEnd(exhausted, 5)).toEqual({ winner: 'draw', reason: 'draw' });
  });

  it('IA del gioco: partita completa, deterministica, sempre mosse legali', () => {
    const play = () =>
      playHeadlessMatch(newMatch(21), {
        player: createAgentFromSpec('easy', { seed: 3 }),
        enemy: createAgentFromSpec('medium', { seed: 4 }),
      });
    const a = play();
    const b = play();
    const strip = (r) => r.rounds.map(({ ms, ...rest }) => rest);
    expect(strip(a)).toEqual(strip(b));
    expect(a.winner).toBe(b.winner);
    for (const round of a.rounds) {
      expect(round.player.fixes).toEqual([]);
      expect(round.enemy.fixes).toEqual([]);
    }
    expect(legalFieldIndexes(a.finalState).length).toBeLessThan(5);
  }, 60000);
});
