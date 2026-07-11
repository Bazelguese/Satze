const BASE = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
  ? import.meta.env.BASE_URL
  : './';

/** Dorsi carta in public/card-images/back/ */
export const CARD_BACK_IMAGES = [
  `${BASE}card-images/back/back1.png`,
  `${BASE}card-images/back/back2.png`,
  `${BASE}card-images/back/back3.png`,
  `${BASE}card-images/back/back4.png`,
];

function shuffleIndices(length) {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

/**
 * Sceglie due dorsi distinti per giocatore e avversario (deterministico con PRNG).
 * @param {() => number} rng
 */
export function pickDistinctCardBackPairSeeded(rng) {
  if (CARD_BACK_IMAGES.length < 2) {
    const only = CARD_BACK_IMAGES[0] ?? null;
    return { playerCardBack: only, enemyCardBack: only };
  }
  const playerIdx = Math.floor(rng() * CARD_BACK_IMAGES.length);
  let enemyIdx = Math.floor(rng() * (CARD_BACK_IMAGES.length - 1));
  if (enemyIdx >= playerIdx) enemyIdx += 1;
  return {
    playerCardBack: CARD_BACK_IMAGES[playerIdx],
    enemyCardBack: CARD_BACK_IMAGES[enemyIdx],
  };
}

/**
 * Sceglie due dorsi distinti per giocatore e avversario.
 * @returns {{ playerCardBack: string, enemyCardBack: string }}
 */
export function pickDistinctCardBackPair() {
  if (CARD_BACK_IMAGES.length < 2) {
    const only = CARD_BACK_IMAGES[0] ?? null;
    return { playerCardBack: only, enemyCardBack: only };
  }
  const [playerIdx, enemyIdx] = shuffleIndices(CARD_BACK_IMAGES.length);
  return {
    playerCardBack: CARD_BACK_IMAGES[playerIdx],
    enemyCardBack: CARD_BACK_IMAGES[enemyIdx],
  };
}
