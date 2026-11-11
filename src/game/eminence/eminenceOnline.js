// ============================================
// EMINENZE ONLINE — sincronizzazione delle scelte tra i due client del Duello.
//
// Il Duello online è lockstep: ogni client esegue lo stesso motore dal proprio punto di vista
// ('player' = sé, 'enemy' = l'altro). Le scelte che vs IA prende il motore al posto
// dell'avversario (abilità del round, params, scelta iniziale, risposta agli Affari) online le
// prende l'altro giocatore e arrivano con questi messaggi, dentro il `relay` esistente.
//
// Ogni messaggio è scritto dal punto di vista di chi lo invia: chi lo riceve lo applica al
// lato 'enemy' dopo aver scambiato i lati nei params (flipSides).
// ============================================

import { SIDES } from './eminenceConstants.js';
import { selectEminenceAbility, setEminenceAbilityParams } from './eminenceRound.js';
import { commitEminenceSetupChoice, resolvePendingDeal } from './eminenceDuelGate.js';

export const EMINENCE_ONLINE_MESSAGES = {
  /** Abilità scelta per il round (e params, anche aggiornati al momento del reveal). */
  CHOICE: 'eminence_choice',
  /** Scelta iniziale dello Scontro (es. la prima Preda di Mounthborn). */
  SETUP: 'eminence_setup',
  /** Risposta a un Affare proposto dall'altro giocatore. */
  DEAL: 'eminence_deal',
};

const OPPOSTO = { [SIDES.PLAYER]: SIDES.ENEMY, [SIDES.ENEMY]: SIDES.PLAYER };

/** Scambia 'player' ↔ 'enemy' nei campi `side` e in quelli il cui nome finisce per "Side" (anche annidati). */
export function flipSides(value) {
  if (Array.isArray(value)) return value.map(flipSides);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    if (/(^side|Side)$/.test(key) && typeof inner === 'string' && OPPOSTO[inner]) out[key] = OPPOSTO[inner];
    else out[key] = flipSides(inner);
  }
  return out;
}

export function choiceMessage(roundNumber, abilityId, params = null) {
  return { type: EMINENCE_ONLINE_MESSAGES.CHOICE, roundNumber, abilityId, params: params ?? null };
}

export function setupMessage(params) {
  return { type: EMINENCE_ONLINE_MESSAGES.SETUP, params: params ?? null };
}

export function dealMessage(roundNumber, response) {
  return { type: EMINENCE_ONLINE_MESSAGES.DEAL, roundNumber, response: response ?? {} };
}

/**
 * Applica al lato 'enemy' la scelta dell'altro giocatore.
 * @returns {{ ok: boolean, matchState: object, reason?: string }}
 */
export function applyRemoteChoice(matchState, message) {
  if (!matchState?.enemy) return { ok: false, matchState, reason: 'NO_STATE' };
  const params = message.params ? flipSides(message.params) : null;
  const current = matchState.enemy;
  if (current.revealedAbilityId) return { ok: false, matchState, reason: 'ALREADY_REVEALED' };
  if (current.selectedAbilityId === message.abilityId) {
    if (!params) return { ok: true, matchState };
    const updated = setEminenceAbilityParams(matchState, SIDES.ENEMY, params);
    return updated.ok ? { ok: true, matchState: updated.matchState } : { ok: false, matchState, reason: updated.reason };
  }
  const attempt = selectEminenceAbility(matchState, SIDES.ENEMY, message.abilityId, params);
  return attempt.ok ? { ok: true, matchState: attempt.matchState } : { ok: false, matchState, reason: attempt.reason };
}

export function applyRemoteSetup(matchState, message) {
  const attempt = commitEminenceSetupChoice(matchState, SIDES.ENEMY, flipSides(message.params));
  return attempt.ok ? { ok: true, matchState: attempt.matchState } : { ok: false, matchState, reason: attempt.reason };
}

/** Le opzioni di un Affare che il destinatario può accettare con la Presenza che ha. */
export function legalDealOptions(deal, matchState) {
  const presence = matchState?.[deal.recipientSide]?.presence ?? 0;
  return (deal.deals || []).filter((option) => option.minPresence == null || presence >= Math.abs(option.minPresence));
}

/**
 * true se la risposta a questo Affare deve arrivare dall'altro giocatore.
 * Un "scegli uno" con una sola opzione legale si risolve da solo su entrambi i client,
 * senza messaggi (come fa il client del destinatario).
 */
export function dealNeedsRemoteResponse(deal, matchState) {
  if (deal?.recipientSide !== SIDES.ENEMY) return false;
  // Un'Offerta obbligata senza varianti da scegliere non ha nulla da decidere.
  if (deal.mode === 'OFFER' && deal.mustAccept && !deal.choices?.length) return false;
  if (deal.mode === 'CHOOSE_ONE' && legalDealOptions(deal, matchState).length <= 1) return false;
  return true;
}

/**
 * Risposta automatica, identica sui due client, per un "scegli uno" con una sola opzione
 * legale o per un'Offerta obbligata senza varianti.
 */
export function forcedDealResponse(deal, matchState) {
  if (deal?.mode === 'OFFER') return { dealAccepted: true, dealChoice: null };
  const legal = legalDealOptions(deal, matchState);
  return {
    dealChoice: (legal[0] || deal.deals?.[0])?.id ?? null,
    opponentPresence: matchState?.[deal.recipientSide]?.presence ?? 0,
  };
}

/** Applica la risposta dell'altro giocatore a un Affare proposto da noi. */
export function applyRemoteDealResponse(matchState, deal, message, { initiativeSide = SIDES.PLAYER } = {}) {
  return resolvePendingDeal(matchState, deal, message.response || {}, { initiativeSide });
}
