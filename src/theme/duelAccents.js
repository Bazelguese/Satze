// ============================================
// Accenti UI del duello — un solo punto di verità per i colori
// condivisi dalle scene del duello (DuelClashAuroraSequence, …).
// I colori delle armate restano in ARMY_COLORS (src/data/armies.js):
// usa getArmyAccent() per leggerli con fallback coerente.
// ============================================

import { ARMY_COLORS } from '../data/armies';

export const DUEL_ACCENTS = {
  /** Fallback accento armata quando l'armata non è mappata */
  armyFallback: '#38bdf8',
  /** Esito finale: oro vittoria / rosso sconfitta */
  victoryGold: '#fbbf24',
  defeatBlood: '#dc2626',
};

/** Accento dell'armata dell'agente, con fallback configurabile. */
export function getArmyAccent(agent, fallback = DUEL_ACCENTS.armyFallback) {
  return ARMY_COLORS?.[agent?.army]?.accent || fallback;
}
