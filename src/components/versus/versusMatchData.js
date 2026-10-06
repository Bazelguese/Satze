// ============================================================
// versusMatchData.js — dati della schermata VS ricavati dalla partita
// ============================================================
// Puro (niente React): usato da Codice/satze.jsx per il caricamento del duello
// e dal VS LAB per le etichette dei due lati.
// ============================================================

import { DIFFICULTY_NAMES } from '../../utils/aiConstants.js';
import { EMINENCE_FORMAT } from '../../game/eminence/eminenceConstants.js';

/**
 * Etichette dei due lati.
 * Contro l'IA: «TU» vs «IA · <difficoltà>»; online: nomi scelti in lobby.
 */
export function buildVersusIdentity({ isOnline = false, difficulty = 'medium', selfName = '', peerName = '' } = {}) {
  if (isOnline) {
    return {
      player: { eyebrow: 'TU', name: String(selfName || '').trim() || 'Giocatore', sub: null },
      enemy: { eyebrow: 'AVVERSARIO', name: String(peerName || '').trim() || 'Avversario', sub: null },
    };
  }
  return {
    player: { eyebrow: 'GIOCATORE', name: 'TU', sub: null },
    enemy: {
      eyebrow: 'AVVERSARIO',
      name: 'IA',
      sub: DIFFICULTY_NAMES[difficulty] || DIFFICULTY_NAMES.medium,
    },
  };
}

function cardIdsOf(set) {
  if (!Array.isArray(set)) return null;
  const ids = set.map((c) => (c && typeof c === 'object' ? c.id : c)).filter((id) => id != null);
  return ids.length ? ids : null;
}

/**
 * Dati per DuelVersusScreen al caricamento del duello, oppure null quando il VS non va mostrato
 * (campagna: ha il suo caricamento).
 *
 * Online la chiave `custom_<id>` dell'avversario punta al SUO storage: non va mai risolta
 * sul nostro, quindi per lui passano solo carte, nome e copertina arrivati col messaggio «pronto».
 */
export function buildDuelVersusData({
  gameMode = 'classic',
  isOnline = false,
  difficulty = 'medium',
  selfName = '',
  peerName = '',
  playerArmy = null,
  playerDeckKey = null,
  playerSet = null,
  enemyArmy = null,
  enemyDeckKey = null,
  enemySet = null,
  peerDeck = null,
  eminenceMatchState = null,
} = {}) {
  if (gameMode === 'campaign') return null;

  const identity = buildVersusIdentity({ isOnline, difficulty, selfName, peerName });

  const playerDeck = {
    army: playerArmy,
    deckKey: typeof playerDeckKey === 'string' ? playerDeckKey : null,
    cardIds: cardIdsOf(playerSet),
  };

  let enemyDeck;
  if (isOnline) {
    const peerKey = typeof peerDeck?.deckKey === 'string' && !peerDeck.deckKey.startsWith('custom_')
      ? peerDeck.deckKey
      : null;
    const cardIds = cardIdsOf(enemySet) || cardIdsOf(peerDeck?.deckCardIds);
    enemyDeck = {
      army: peerDeck?.army || enemyArmy,
      deckKey: peerKey,
      cardIds,
      name: peerDeck?.deckName || null,
      coverCardId: cardIds && cardIds.includes(peerDeck?.coverCardId) ? peerDeck.coverCardId : null,
    };
  } else {
    enemyDeck = {
      army: enemyArmy,
      deckKey: typeof enemyDeckKey === 'string' ? enemyDeckKey : null,
      cardIds: cardIdsOf(enemySet),
    };
  }

  // Senza stato Eminenze la partita non le prevede: niente Eminenza dedotta dal mazzo.
  const eminenceFormat = eminenceMatchState?.format === EMINENCE_FORMAT.REQUIRED
    ? EMINENCE_FORMAT.REQUIRED
    : EMINENCE_FORMAT.DISABLED;

  return {
    playerIdentity: identity.player,
    enemyIdentity: identity.enemy,
    playerDeck,
    enemyDeck,
    eminenceFormat,
    playerEminenceId: eminenceMatchState?.player?.eminenceId ?? null,
    enemyEminenceId: eminenceMatchState?.enemy?.eminenceId ?? null,
  };
}
