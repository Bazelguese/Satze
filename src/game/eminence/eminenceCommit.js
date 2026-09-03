// ============================================
// EMINENZE — Protocollo commit–reveal per il multiplayer
// Fonte normativa: SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md §10.5
// ============================================
//
// Il server SATZE è un relay puro e non valida le mosse: la garanzia di segretezza deve
// quindi reggere fra pari. Un solo commitment per round; le aperture avvengono ai gate
// semantici. Attraversare un gate senza aprire è a sua volta informazione pubblica, quindi
// il "passo" è un messaggio esplicito e non un silenzio da interpretare.

import { REVEAL_GATES, SIDES } from './eminenceConstants.js';
import { getEminenceAbility } from '../../data/eminences.js';
import { getLegalAbilityIds } from './eminenceState.js';

/** Tipi di messaggio applicativo, inoltrati dentro il `relay` esistente. */
export const EMINENCE_MESSAGES = {
  COMMIT: 'eminence_commit',
  OPEN: 'eminence_open',
  PASS: 'eminence_pass',
};

// ------------------------------------------------------------------
// Primitive crittografiche
// ------------------------------------------------------------------

function requireWebCrypto() {
  const webcrypto = globalThis.crypto;
  if (!webcrypto?.subtle?.digest || !webcrypto.getRandomValues) {
    throw new Error('WebCrypto non disponibile: impossibile usare il commit-reveal Eminenza');
  }
  return webcrypto;
}

export function createNonce(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  requireWebCrypto().getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await requireWebCrypto().subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Serializzazione deterministica: due oggetti equivalenti devono dare la stessa stringa. */
export function canonicalize(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Input del commitment. Include `matchId` e `roundNumber` perché un commitment valido in un
 * round non deve poter essere riusato in un altro.
 */
export function buildCommitmentInput({ matchId, roundNumber, eminenceId, abilityId, params = null, nonce }) {
  return canonicalize({ matchId, roundNumber, eminenceId, abilityId, params, nonce });
}

/**
 * @returns {Promise<{ commitment: string, opening: object }>} il commitment va inviato subito,
 *   l'opening conservato in locale fino al gate corretto.
 */
export async function createCommitment(
  { matchId, roundNumber, eminenceId, abilityId, params = null },
  { digest = sha256Hex, nonce = null } = {}
) {
  const opening = {
    matchId,
    roundNumber,
    eminenceId,
    abilityId,
    params,
    nonce: nonce || createNonce(),
  };
  return { commitment: await digest(buildCommitmentInput(opening)), opening };
}

export async function verifyCommitment(commitment, opening, { digest = sha256Hex } = {}) {
  if (!commitment || !opening) return false;
  return (await digest(buildCommitmentInput(opening))) === commitment;
}

// ------------------------------------------------------------------
// Macchina del round
// ------------------------------------------------------------------

export function createCommitRevealState({ matchId, roundNumber, localSide = SIDES.PLAYER }) {
  return {
    matchId,
    roundNumber,
    localSide,
    localCommitment: null,
    localOpening: null,
    remoteCommitment: null,
    remoteOpening: null,
    openedGate: null,
    remoteOpenedGate: null,
    passedGates: [],
    remotePassedGates: [],
  };
}

export function withLocalCommitment(state, { commitment, opening }) {
  return { ...state, localCommitment: commitment, localOpening: opening };
}

export function withRemoteCommitment(state, commitment) {
  return { ...state, remoteCommitment: commitment };
}

/** Nessuna apertura è lecita finché entrambi non si sono impegnati. */
export function areCommitmentsExchanged(state) {
  return Boolean(state.localCommitment && state.remoteCommitment);
}

export function buildCommitMessage(state) {
  return {
    type: EMINENCE_MESSAGES.COMMIT,
    matchId: state.matchId,
    roundNumber: state.roundNumber,
    commitment: state.localCommitment,
  };
}

/**
 * Messaggio da inviare a un gate: apertura se la capacità appartiene a quel gate, altrimenti
 * passo esplicito. Entrambi sono informazione pubblica.
 */
export function buildGateMessage(state, gate) {
  const opening = state.localOpening;
  if (!opening) {
    return { type: EMINENCE_MESSAGES.PASS, matchId: state.matchId, roundNumber: state.roundNumber, gate };
  }

  const ability = getEminenceAbility(opening.eminenceId, opening.abilityId);
  const belongsToGate = ability?.revealGate === gate;

  if (!belongsToGate) {
    return { type: EMINENCE_MESSAGES.PASS, matchId: state.matchId, roundNumber: state.roundNumber, gate };
  }

  return {
    type: EMINENCE_MESSAGES.OPEN,
    matchId: state.matchId,
    roundNumber: state.roundNumber,
    gate,
    opening,
  };
}

export function recordLocalGateMessage(state, message) {
  if (message.type === EMINENCE_MESSAGES.OPEN) {
    return { ...state, openedGate: message.gate };
  }
  return { ...state, passedGates: [...state.passedGates, message.gate] };
}

/**
 * Verifica e registra un messaggio di gate ricevuto dal pari.
 *
 * I controlli sono tutti necessari perché il relay non è autoritativo:
 * l'hash deve corrispondere, il commitment deve appartenere a questo round e a questa
 * partita, la capacità aperta deve appartenere davvero al gate dichiarato, e deve essere
 * stata legale alla Presenza del checkpoint di selezione.
 *
 * @param {object} options.remotePublicState proiezione pubblica del lato remoto
 * @returns {Promise<{ state: object, ok: boolean, reason: string|null }>}
 */
export async function applyRemoteGateMessage(state, message, { digest = sha256Hex, remotePublicState = null } = {}) {
  const reject = (reason) => ({ state, ok: false, reason });

  if (message.matchId !== state.matchId) return reject('MATCH_MISMATCH');
  if (message.roundNumber !== state.roundNumber) return reject('ROUND_MISMATCH');

  if (message.type === EMINENCE_MESSAGES.PASS) {
    if (state.remoteOpenedGate) return reject('ALREADY_OPENED');
    return {
      state: { ...state, remotePassedGates: [...state.remotePassedGates, message.gate] },
      ok: true,
      reason: null,
    };
  }

  if (message.type !== EMINENCE_MESSAGES.OPEN) return reject('UNKNOWN_MESSAGE');
  if (!areCommitmentsExchanged(state)) return reject('COMMITMENTS_NOT_EXCHANGED');
  if (state.remoteOpenedGate) return reject('ALREADY_OPENED');

  const { opening } = message;
  if (!opening) return reject('MISSING_OPENING');
  if (opening.matchId !== state.matchId) return reject('MATCH_MISMATCH');
  if (opening.roundNumber !== state.roundNumber) return reject('ROUND_MISMATCH');

  if (!(await verifyCommitment(state.remoteCommitment, opening, { digest }))) {
    return reject('COMMITMENT_MISMATCH');
  }

  const ability = getEminenceAbility(opening.eminenceId, opening.abilityId);
  if (!ability) return reject('UNKNOWN_ABILITY');
  if (ability.revealGate !== message.gate) return reject('WRONG_GATE');

  if (remotePublicState) {
    if (remotePublicState.eminenceId !== opening.eminenceId) return reject('EMINENCE_MISMATCH');
    const legal = getLegalAbilityIds(
      opening.eminenceId,
      remotePublicState.selectionCheckpointPresence,
      remotePublicState.persistent,
    );
    if (!legal.includes(opening.abilityId)) return reject('ILLEGAL_AT_SELECTION');
  }

  return {
    state: { ...state, remoteOpening: opening, remoteOpenedGate: message.gate },
    ok: true,
    reason: null,
  };
}

/**
 * Al termine del round ogni commitment deve risultare aperto: un commitment mai aperto
 * significa che un giocatore ha dichiarato una scelta che non ha mai mostrato.
 */
export function isRoundFullyRevealed(state) {
  const localDone = !state.localOpening || Boolean(state.openedGate);
  const remoteDone = !state.remoteCommitment || Boolean(state.remoteOpenedGate);
  return localDone && remoteDone;
}

export { REVEAL_GATES };
