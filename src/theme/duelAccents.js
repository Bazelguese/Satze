// ============================================
// Accenti UI del duello — un solo punto di verità per i colori
// condivisi tra DuelResultDuelBodies e DuelClashAuroraSequence.
// I colori delle armate restano in ARMY_COLORS (src/data/armies.js):
// usa getArmyAccent() per leggerli con fallback coerente.
// ============================================

import { ARMY_COLORS } from '../data/armies';

export const DUEL_ACCENTS = {
  /** Numero VA del vincitore (teal) e del perdente */
  vaWinner: '#4FD1C5',
  vaLoser: '#64748b',
  /** Scintille attorno al VA (teal / ambra / viola) */
  sparkTeal: '#4FD1C5',
  sparkAmber: '#FFB347',
  sparkViolet: '#a78bfa',
  /** Glow linee esito per lato vincitore */
  winnerPlayerGlow: '#7dd3fc',
  winnerEnemyGlow: '#5eead4',
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
