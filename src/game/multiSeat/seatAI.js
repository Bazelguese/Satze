// ============================================================
// IA dei posti per le modalità a più posti
// ============================================================
// Euristiche semplici e riproducibili (rng iniettato). Profili usati sia come preset del
// compagno nel 2v2 sia come livelli degli avversari (vedi `profileForDifficulty`).
// ============================================================

import { availableCards, legalFocusRange } from './multiSeatCore.js';

export const SEAT_AI_PROFILES = {
  equilibrato: {
    id: 'equilibrato',
    // Fiducia di base: probabilità di seguire un consiglio del compagno umano (2v2).
    trust: 0.7,
    name: 'Stratega',
    description: 'Distribuisce i FC con regolarità e conserva una carta forte per il finale.',
    spendBias: 1,
    cardPlan: 'balanced',
    noise: 0.15,
    simulate: false,
  },
  aggressivo: {
    id: 'aggressivo',
    // Fiducia di base: probabilità di seguire un consiglio del compagno umano (2v2).
    trust: 0.5,
    name: 'Assaltatore',
    description: 'Gioca subito le carte migliori e investe molto nei primi turni.',
    spendBias: 1.35,
    cardPlan: 'strongFirst',
    noise: 0.15,
    simulate: false,
  },
  prudente: {
    id: 'prudente',
    // Fiducia di base: probabilità di seguire un consiglio del compagno umano (2v2).
    trust: 0.8,
    name: 'Custode',
    description: 'Risparmia FC e carte forti per gli ultimi turni.',
    spendBias: 0.8,
    cardPlan: 'strongLast',
    noise: 0.1,
    simulate: false,
  },
  calcolatore: {
    id: 'calcolatore',
    // Fiducia di base: probabilità di seguire un consiglio del compagno umano (2v2).
    trust: 0.6,
    name: 'Calcolatore',
    description: 'Stima il VA avversario e investe quanto serve per superarlo.',
    spendBias: 1,
    cardPlan: 'balanced',
    noise: 0.05,
    simulate: true,
  },
  casuale: {
    id: 'casuale',
    // Fiducia di base: probabilità di seguire un consiglio del compagno umano (2v2).
    trust: 0.4,
    name: 'Recluta',
    description: 'Scelte poco ragionate.',
    spendBias: 1,
    cardPlan: 'random',
    noise: 0.6,
    simulate: false,
  },
};

/** Preset proposti per il compagno IA nel 2v2. */
export const TEAMMATE_PRESET_IDS = ['equilibrato', 'aggressivo', 'prudente', 'calcolatore'];

export function getSeatAIProfile(id) {
  return SEAT_AI_PROFILES[id] || SEAT_AI_PROFILES.equilibrato;
}

/** Livello degli avversari IA dalla difficoltà scelta nel menu. */
export function profileForDifficulty(difficulty) {
  if (difficulty === 'easy') return 'casuale';
  if (difficulty === 'hard') return 'calcolatore';
  return 'equilibrato';
}

export function cardValue(card) {
  return (Number(card?.power) || 0) + 0.8 * (Number(card?.damage) || 0);
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Sceglie la carta da schierare.
 * @param {object} seat
 * @param {object} profile
 * @param {{ round: number, totalRounds: number }} timing
 * @param {() => number} rng
 */
export function chooseCard(seat, profile, { round, totalRounds }, rng) {
  const cards = [...availableCards(seat)].sort((a, b) => cardValue(b) - cardValue(a));
  if (cards.length === 0) return null;
  if (cards.length === 1) return cards[0];
  const n = cards.length;
  const progress = totalRounds > 1 ? (round - 1) / (totalRounds - 1) : 1;
  let target;
  switch (profile.cardPlan) {
    case 'strongFirst':
      target = 0;
      break;
    case 'strongLast':
      // Dalle più deboli verso le più forti man mano che la partita avanza.
      target = (n - 1) * (1 - progress);
      break;
    case 'random':
      target = rng() * (n - 1);
      break;
    default:
      // Bilanciato: carte medie all'inizio, la migliore nell'ultimo turno.
      target = (n - 1) * 0.5 * (1 - progress);
      break;
  }
  const jitter = (rng() * 2 - 1) * profile.noise * (n - 1);
  return cards[clampInt(target + jitter, 0, n - 1)];
}

/** Stima dell'investimento di un posto di cui non si conoscono i FC: quota media. */
export function estimateInvestment(seat) {
  const { min, max } = legalFocusRange(seat);
  const remaining = Math.max(1, availableCards(seat).length);
  return clampInt(seat.focus / remaining, Math.max(1, min), Math.max(1, max));
}

/**
 * Sceglie l'investimento per la carta schierata.
 * @param {object} seat
 * @param {object} card
 * @param {object} profile
 * @param {() => number} rng
 * @param {{ opponentEstimatedVA?: number|null }} [hint]
 */
export function chooseInvestment(seat, card, profile, rng, hint = {}) {
  const { min, max } = legalFocusRange(seat);
  if (max <= 1) return Math.max(1, min);
  const remaining = Math.max(1, availableCards(seat).length);
  if (remaining === 1) return max;
  const base = seat.focus / remaining;
  const power = Math.max(1, Number(card?.power) || 1);

  if (profile.simulate && Number.isFinite(hint.opponentEstimatedVA)) {
    const needed = Math.floor(hint.opponentEstimatedVA / power) + 1;
    if (needed <= max && needed <= Math.ceil(base * 1.8)) return clampInt(needed, 1, max);
    // Fuori portata: si limita la perdita.
    return 1;
  }

  const damageFactor = Math.min(1.4, 0.7 + (Number(card?.damage) || 0) / 10);
  const jitter = 1 + (rng() * 2 - 1) * profile.noise;
  return clampInt(base * profile.spendBias * damageFactor * jitter, 1, max);
}

/** Livelli di investimento consigliabili al compagno. */
export const ADVICE_INVEST_LEVELS = ['basso', 'medio', 'alto'];

/**
 * Investimento corrispondente a un livello consigliato, dentro il range legale del posto:
 * basso ≈ metà della quota media, medio ≈ quota media, alto ≈ quasi il doppio.
 */
export function investmentForLevel(seat, level) {
  const { min, max } = legalFocusRange(seat);
  if (max <= 1) return Math.max(1, min);
  const remaining = Math.max(1, availableCards(seat).length);
  const base = seat.focus / remaining;
  const factor = level === 'alto' ? 1.8 : level === 'basso' ? 0.5 : 1;
  return clampInt(base * factor, 1, max);
}
