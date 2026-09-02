// ============================================
// EMINENZE — Fasi, colori e label degli avvisi pubblici
// ============================================
//
// Separazione presentazione / dati: `eminenceAnnouncements.js` descrive i fatti;
// questo modulo traduce fase, colore e copy UI senza conoscere le singole Eminenze.

import { EFFECT_TIMINGS, REVEAL_GATES } from './eminenceConstants.js';

/** Fasi visibili al giocatore (max 6 — oltre confonde). */
export const ANNOUNCE_PHASES = {
  SETUP: 'SETUP',
  PASSIVE: 'PASSIVE',
  REVEAL: 'REVEAL',
  VERIFY: 'VERIFY',
  RESOLVE: 'RESOLVE',
  MISS: 'MISS',
};

export const PHASE_LABELS = {
  [ANNOUNCE_PHASES.SETUP]: 'Preparazione',
  [ANNOUNCE_PHASES.PASSIVE]: 'Passivo',
  [ANNOUNCE_PHASES.REVEAL]: 'Rivelazione',
  [ANNOUNCE_PHASES.VERIFY]: 'Verifica',
  [ANNOUNCE_PHASES.RESOLVE]: 'Risoluzione',
  [ANNOUNCE_PHASES.MISS]: 'Mancato',
};

/** Colore semantico della fase (indipendente dall'accento armata). */
export const PHASE_COLORS = {
  [ANNOUNCE_PHASES.SETUP]: '#e8b04a',
  [ANNOUNCE_PHASES.PASSIVE]: '#8ba8c8',
  [ANNOUNCE_PHASES.REVEAL]: '#5ec8e8',
  [ANNOUNCE_PHASES.VERIFY]: '#9ed4a0',
  [ANNOUNCE_PHASES.RESOLVE]: '#7dd87a',
  [ANNOUNCE_PHASES.MISS]: '#c97878',
};

export const GATE_LABELS = {
  [REVEAL_GATES.PRE_FIELD]: 'Prima del Campo',
  [REVEAL_GATES.PRE_AGENT]: 'Prima dell\'Agente',
  [REVEAL_GATES.GENERAL]: 'Prima del Duello',
};

const POST_DUEL_TIMINGS = new Set([
  EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
  EFFECT_TIMINGS.BEFORE_CONQUEST,
  EFFECT_TIMINGS.POST_BATTLE,
  EFFECT_TIMINGS.END_ROUND,
  EFFECT_TIMINGS.END_MATCH,
]);

const OWNER_LABELS = {
  player: 'La tua Eminenza',
  enemy: 'Eminenza avversaria',
};

function resolvePhase(notice) {
  if (notice.phase) return notice.phase;
  if (notice.kind === 'setup') return ANNOUNCE_PHASES.SETUP;
  if (notice.kind === 'static') return ANNOUNCE_PHASES.PASSIVE;
  if (notice.kind === 'reveal') return ANNOUNCE_PHASES.REVEAL;
  if (notice.kind === 'effect') {
    if (notice.outcome === 'miss') return ANNOUNCE_PHASES.MISS;
    if (notice.origin === 'deployed_mark') return ANNOUNCE_PHASES.VERIFY;
    return ANNOUNCE_PHASES.RESOLVE;
  }
  return ANNOUNCE_PHASES.REVEAL;
}

function resolvePhaseDetail(notice, phase) {
  if (notice.phaseDetail) return notice.phaseDetail;

  switch (phase) {
    case ANNOUNCE_PHASES.SETUP:
      return 'Prima dello Scontro';
    case ANNOUNCE_PHASES.PASSIVE:
      if (notice.staticMode === 'triggered') {
        return notice.roundNumber != null
          ? `Scatta ora · Round ${notice.roundNumber}`
          : 'Scatta ora';
      }
      return 'Regola attiva';
    case ANNOUNCE_PHASES.REVEAL:
      return notice.gate ? (GATE_LABELS[notice.gate] || notice.gate) : null;
    case ANNOUNCE_PHASES.VERIFY:
      return 'Agenti schierati';
    case ANNOUNCE_PHASES.RESOLVE:
      if (notice.timing && POST_DUEL_TIMINGS.has(notice.timing)) return 'Dopo il Duello';
      if (notice.timing === EFFECT_TIMINGS.BEFORE_TRIGGER_CHECK) return 'Prima dei trigger';
      if (notice.timing === EFFECT_TIMINGS.BEFORE_POWER_RESOLUTION) return 'Prima del confronto';
      return 'Condizione soddisfatta';
    case ANNOUNCE_PHASES.MISS:
      if (notice.origin === 'deployed_mark') return 'Agenti schierati';
      if (notice.timing && POST_DUEL_TIMINGS.has(notice.timing)) return 'Dopo il Duello';
      return 'Condizione non soddisfatta';
    default:
      return null;
  }
}

function resolveHint(notice, phase) {
  if (notice.hint) return notice.hint;
  if (phase === ANNOUNCE_PHASES.SETUP) return 'Clicca per scegliere il bersaglio';
  return 'Clicca per chiudere';
}

/**
 * Arricchisce un avviso con campi di presentazione UI.
 *
 * @param {object} notice avviso grezzo da `eminenceAnnouncements.js`
 * @returns {object} stesso avviso + phase, phaseLabel, phaseDetail, phaseColor, badgeText, ownerLabel, hint
 */
export function enrichNotice(notice) {
  if (!notice) return notice;

  const phase = resolvePhase(notice);
  const phaseLabel = PHASE_LABELS[phase] || phase;
  const phaseDetail = resolvePhaseDetail(notice, phase);
  const phaseColor = PHASE_COLORS[phase] || PHASE_COLORS[ANNOUNCE_PHASES.REVEAL];
  const badgeText = phaseDetail ? `${phaseLabel} · ${phaseDetail}` : phaseLabel;
  const ownerLabel = OWNER_LABELS[notice.side] || 'Eminenza';

  return {
    ...notice,
    phase,
    phaseLabel,
    phaseDetail,
    phaseColor,
    badgeText,
    ownerLabel,
    hint: resolveHint(notice, phase),
  };
}

/** @param {object[]} notices */
export function enrichNotices(notices = []) {
  return notices.map(enrichNotice);
}
