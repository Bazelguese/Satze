/**
 * Hash stabile dello stato strategico pubblico (niente Focus privati).
 * @param {object} state
 * @param {number} [depth]
 */

import { buildEminenceHashParts } from '../eminence/eminenceAIView.js';

function toxinHash(toxin) {
  if (!toxin) return '0';
  if (typeof toxin !== 'object') return String(toxin);
  return `v${toxin.value ?? 0}|m${toxin.minHealth ?? ''}|s${toxin.source ?? ''}`;
}

function conqueredHash(conqueredFields) {
  return Object.keys(conqueredFields || {})
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => {
      const v = conqueredFields[k];
      if (v && typeof v === 'object') {
        return `${k}:${v.winner || ''}:${v.army || ''}`;
      }
      return `${k}:${v}`;
    })
    .join(',');
}

export function publicStateHash(state, depth = null) {
  const aiCards = (state.aiRemainingCardIds || []).slice().sort().join(',');
  const playerCards = (state.playerRemainingCardIds || []).slice().sort().join(',');
  const aiUsed = (state.aiUsedCardIds || []).slice().sort().join(',');
  const playerUsed = (state.playerUsedCardIds || []).slice().sort().join(',');
  const available = (state.availableFieldIndexes || []).slice().sort((a, b) => a - b).join(',');

  const parts = [
    state.roundNumber,
    state.initiativeSide,
    state.isPlayerFirst ? 1 : 0,
    state.openingPlayerFirst ? 1 : 0,
    state.initiativeProfile ?? '',
    state.lastWinner ?? '',
    state.aiHP,
    state.playerHP,
    state.aiFocus,
    state.playerFocus,
    aiCards,
    playerCards,
    aiUsed,
    playerUsed,
    conqueredHash(state.conqueredFields),
    available,
    state.revealedFields ?? '',
    state.playerFieldsConquered ?? 0,
    state.enemyFieldsConquered ?? 0,
    toxinHash(state.playerToxin),
    toxinHash(state.aiToxin),
    state.terminalStatus ?? '',
    // Solo la parte pubblica: due stati che differiscono per la sola scelta segreta sono
    // indistinguibili da qui e devono condividere la stessa voce di transposition table.
    buildEminenceHashParts(state.eminence),
  ];
  if (depth != null) parts.push(`d${depth}`);
  return parts.join('|');
}
