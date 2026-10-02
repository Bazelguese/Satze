// Overdrive nel duello (solo presentazione): da quale moneta FC l'Overdrive di un lato è
// acceso. Stesse regole dell'anteprima in mano (satze.jsx): soglia del Campo (di norma 5 FC),
// Campi che lo disattivano, e un effetto che lo usa — Potere, Bonus attivo o Campo.

import { checkTrigger } from '../triggerLogic.js';
import { getFieldModifiers, fieldGrantsOverdriveBonus } from '../battlefieldEffects.js';
import { ARMY_BONUSES } from '../../data/armies.js';

/**
 * Numero di monete (1-based) dopo cui l'Overdrive del lato si accende, o null.
 * @param {object|null} br battleResult
 * @param {'player'|'enemy'} side
 */
export function overdriveCoinThreshold(br, side) {
  if (!br) return null;
  const isPlayer = side === 'player';
  const field = br.field || null;
  const fieldModifiers = getFieldModifiers(field);
  const focus = Number(isPlayer ? br.playerFocusUsed : br.enemyFocusUsed) || 0;
  if (!checkTrigger('overdrive', { focusCoins: focus, effectiveFocus: focus, fieldModifiers })) return null;

  const agent = isPlayer ? br.playerAgent : br.enemyAgent;
  const ability = (isPlayer ? br.playerAbilityCopied : br.enemyAbilityCopied) || agent?.ability;
  const abilityBlocked = Boolean(isPlayer ? br.playerAbilityBlocked : br.enemyAbilityBlocked);
  const abilityOverdrive = ability?.trigger === 'overdrive' && !abilityBlocked;

  const bonus = (isPlayer ? br.playerBonusCopied : br.enemyBonusCopied)
    || (isPlayer ? br.playerEffectiveArmyBonus : br.enemyEffectiveArmyBonus)
    || ARMY_BONUSES[agent?.army];
  const bonusActive = Boolean(isPlayer ? br.playerHasBonus : br.enemyHasBonus)
    && !(isPlayer ? br.playerBonusBlocked : br.enemyBonusBlocked);
  const bonusOverdrive = bonusActive && bonus?.trigger === 'overdrive';

  if (!abilityOverdrive && !bonusOverdrive && !fieldGrantsOverdriveBonus(field)) return null;
  return fieldModifiers.overdriveThreshold || 5;
}
