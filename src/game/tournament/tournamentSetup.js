// ============================================
// TORNEO — iscrizione dei partecipanti e salvataggio locale
// ============================================

import { ARMY_SETS, ARMY_DECKS } from '../../data/cards.js';
import { createTournament, TOURNAMENT_SIZE } from './tournamentLogic.js';

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
