// Immune concesso da un Potere o da un Bonus vale solo se quel Potere o Bonus non è spento.
// L'immunità serve presto (gli effetti del Campo la leggono per ignorare i malus), prima del
// pre-scan reale dei Blocca: qui si calcola in anticipo, senza effetti collaterali, quali fonti
// risulteranno spente in questo scontro.
import { applyDuelBlockPrescan } from './duelBlockPrescan.js';
import { getFieldSetupFlags } from '../battlefieldEffects.js';
import { resolveTriggerState } from '../eminence/triggerRulesOverlay.js';

const nessunLog = { push() {}, setContext() {} };

/**
 * @returns {{ player: { ability: boolean, bonus: boolean }, enemy: { ability: boolean, bonus: boolean } }}
 *   true = quella fonte non si attiverà in questo scontro.
 */
export function previewDisabledSources({
  field,
  pAgent,
  eAgent,
  playerContext,
  enemyContext,
  duelCanTriggerAbility,
  isPlayerFirst = true,
  eminenceBundle = null,
}) {
  const id = field?.id ?? 0;
  const flags = getFieldSetupFlags(field);

  // Disattivazioni del Campo: valgono sempre, anche contro "non può essere bloccato".
  const campoPotere = { player: false, enemy: false };
  const campoBonus = { player: false, enemy: false };
  if (id === 3 || id === 14) campoPotere.player = campoPotere.enemy = true; // Arena degli Gnomi, Santuario del Silenzio
  if (id === 6 || id === 14 || id === 109) campoBonus.player = campoBonus.enemy = true; // Tempio, Santuario, Nodo dei Segnali
  if (id === 77) campoPotere[playerContext?.isFirst ?? isPlayerFirst ? 'enemy' : 'player'] = true; // Posto di Blocco: il secondo
  if (id === 94 && pAgent?.league === eAgent?.league) campoPotere.player = campoPotere.enemy = true; // Insegne Gemelle

  // Blocca degli Agenti (stessa logica del pre-scan vero, su uno stato di prova).
  const prova = { pAbilityBlocked: false, eAbilityBlocked: false, pBonusBlocked: false, eBonusBlocked: false };
  applyDuelBlockPrescan({
    blockDisabled: flags.blockDisabled,
    fieldName: field?.name ?? '',
    pAgent,
    eAgent,
    state: prova,
    battleLog: nessunLog,
    playerContext,
    enemyContext,
    triggersIgnored: flags.triggersIgnored === true,
    duelCanTriggerAbility,
    isPlayerFirst,
  });

  // Eminenze: "non può essere bloccato" supera i Blocca degli Agenti, non le disattivazioni del Campo.
  const rules = eminenceBundle?.triggerRules ?? null;
  const potereNonBloccabile = (side, agent, context) => {
    if (!rules || !agent?.ability) return false;
    return resolveTriggerState({
      originalTrigger: agent.ability.trigger ?? null,
      context,
      card: agent,
      side,
      triggerRules: rules,
      powerBlocked: true,
    }).unblockable;
  };
  const bonusNonBloccabile = (side) => Boolean(eminenceBundle?.armyBonusState?.[side]?.unblockable);

  return {
    player: {
      ability: campoPotere.player || (prova.pAbilityBlocked && !potereNonBloccabile('player', pAgent, playerContext)),
      bonus: campoBonus.player || (prova.pBonusBlocked && !bonusNonBloccabile('player')),
    },
    enemy: {
      ability: campoPotere.enemy || (prova.eAbilityBlocked && !potereNonBloccabile('enemy', eAgent, enemyContext)),
      bonus: campoBonus.enemy || (prova.eBonusBlocked && !bonusNonBloccabile('enemy')),
    },
  };
}
