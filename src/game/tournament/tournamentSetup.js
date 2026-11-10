// ============================================
// TORNEO — iscrizione dei partecipanti e salvataggio locale
// ============================================

import { ARMY_SETS, ARMY_DECKS } from '../../data/cards.js';
import { ALL_BATTLEFIELDS } from '../../data/battlefields.js';
import { selectBattlefields } from '../fieldLogic.js';
import { playAiGame, playAiGameAsync } from './aiMatchEngine.js';
import {
  createTournament,
  dealAiSeriesHands,
  getMatch,
  getPendingAiMatches,
  recordAiSeries,
  tallySeries,
  TOURNAMENT_SIZE,
} from './tournamentLogic.js';

const STORAGE_KEY = 'satze_tournament';
export const TOURNAMENT_HUMAN_ID = 'human';

/** Carte complete (con armata) a partire dagli id, cercando in tutte le armate. */
export function resolveTournamentCards(cardIds) {
  return cardIds
    .map((id) => {
      for (const [army, cards] of Object.entries(ARMY_SETS)) {
        const card = cards.find((c) => c.id === id);
        if (card) return { ...card, army: card.army || army };
      }
      return null;
    })
    .filter(Boolean);
}

function pickRandom(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

/**
 * Nuovo torneo: il giocatore con il suo mazzo bloccato e 11 IA, una per armata.
 * Se il giocatore usa una delle 12 armate, le IA prendono le altre 11; con un esercito
 * personalizzato misto una delle 12 armate resta fuori a sorte.
 * @param {{ playerArmy: string, playerDeckKey: string, playerDeckName: string, playerCardIds: number[], settings: object, rng?: () => number }} cfg
 */
export function createTournamentForPlayer({ playerArmy, playerDeckKey, playerDeckName, playerCardIds, settings, rng = Math.random }) {
  const armies = Object.keys(ARMY_DECKS);
  let aiArmies = armies.filter((a) => a !== playerArmy);
  while (aiArmies.length > TOURNAMENT_SIZE - 1) {
    aiArmies.splice(Math.floor(rng() * aiArmies.length), 1);
  }
  if (aiArmies.length !== TOURNAMENT_SIZE - 1) {
    throw new Error('Armate insufficienti per comporre il tabellone.');
  }
  const participants = [
    {
      id: TOURNAMENT_HUMAN_ID,
      name: 'Tu',
      army: playerArmy,
      deckKey: playerDeckKey,
      deckName: playerDeckName,
      cardIds: [...playerCardIds],
      isHuman: true,
    },
    ...aiArmies.map((army, i) => {
      const deckKey = pickRandom(Object.keys(ARMY_DECKS[army]), rng);
      const deck = ARMY_DECKS[army][deckKey];
      return {
        id: `ai${i + 1}`,
        name: army,
        army,
        deckKey,
        deckName: deck.name,
        cardIds: [...deck.cards],
        isHuman: false,
      };
    }),
  ];
  return createTournament({ participants, settings, rng });
}

/** Campi di una partita salvata: per id quando esistono nel catalogo, altrimenti per intero. */
function packFields(fields) {
  return fields.map((f) => (ALL_BATTLEFIELDS.some((x) => x.id === f.id && x.name === f.name) ? f.id : f));
}

function unpackFields(packed) {
  return packed.map((f) => (typeof f === 'object' ? f : ALL_BATTLEFIELDS.find((x) => x.id === f)));
}

const nextTick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/**
 * Gioca per intero una serie tra IA (motore vero, senza Eminenze) e la registra.
 * Le mani seguono la regola del torneo; i Campi si rigenerano a ogni partita.
 * @param {object} tournament
 * @param {string} matchId
 * @param {{ rng?: () => number, onGame?: (gameNumber: number) => void }} [options]
 * @returns {Promise<object>} il torneo aggiornato
 */
export async function playAiSeries(tournament, matchId, { rng = Math.random, onGame = null } = {}) {
  const match = getMatch(tournament, matchId);
  if (!match || match.winnerId) return tournament;
  const mode = tournament.settings?.mode || 'classic';
  const difficulty = tournament.settings?.difficulty || 'medium';
  const games = [];
  while (!tallySeries(games).winner) {
    onGame?.(games.length + 1);
    await nextTick();
    const hands = dealAiSeriesHands(tournament, match, games, rng);
    const battlefields = selectBattlefields(mode, ALL_BATTLEFIELDS, { rng });
    const game = await playAiGameAsync({
      handA: resolveTournamentCards(hands.a),
      handB: resolveTournamentCards(hands.b),
      battlefields,
      mode,
      difficulty,
      rng,
    }, nextTick);
    games.push({
      hands,
      winner: game.winner,
      reason: game.reason,
      simulated: true,
      aFirst: game.aFirst,
      fields: packFields(battlefields),
      rounds: game.rounds,
      final: game.final,
    });
  }
  return recordAiSeries(tournament, matchId, games);
}

/**
 * Conclude il turno: gioca, una dopo l'altra, le serie tra IA pronte del turno più arretrato.
 * Le serie del turno successivo che così diventano note restano da giocare.
 */
export async function playPendingAiSeries(tournament, { rng = Math.random, onProgress = null, onSeriesDone = null } = {}) {
  const pending = getPendingAiMatches(tournament);
  if (pending.length === 0) return tournament;
  const round = Math.min(...pending.map((m) => m.round));
  const matches = pending.filter((m) => m.round === round);
  let current = tournament;
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    current = await playAiSeries(current, match.id, {
      rng,
      onGame: (gameNumber) => onProgress?.({ match, gameNumber, done: i, remaining: matches.length - i }),
    });
    // chi guarda il tabellone vede arrivare i risultati una serie alla volta
    await onSeriesDone?.(current);
  }
  return current;
}

/** Una partita IA salvata ha il registro dei turni (si può riguardare e riassumere). */
export function hasGameLog(game) {
  return Boolean(game?.simulated && Array.isArray(game.rounds) && Array.isArray(game.fields));
}

/**
 * Rigioca una partita IA salvata, identica, per mostrarla sul tavolo.
 * @returns {{ handA: object[], handB: object[], battlefields: object[], game: object }}
 */
export function replaySavedAiGame(tournament, savedGame) {
  const handA = resolveTournamentCards(savedGame.hands.a);
  const handB = resolveTournamentCards(savedGame.hands.b);
  const battlefields = unpackFields(savedGame.fields);
  const game = playAiGame({
    handA,
    handB,
    battlefields,
    mode: tournament.settings?.mode || 'classic',
    difficulty: tournament.settings?.difficulty || 'medium',
    script: { aFirst: savedGame.aFirst, rounds: savedGame.rounds },
  });
  return { handA, handB, battlefields, game };
}

export function getTournamentField(packed) {
  return unpackFields([packed])[0] || null;
}

export function loadTournament() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data?.version === 1 && Array.isArray(data.rounds) ? data : null;
  } catch {
    return null;
  }
}

export function saveTournament(tournament) {
  try {
    if (tournament) window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(tournament));
    else window.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* senza salvataggio il torneo vive solo in memoria */
  }
}
