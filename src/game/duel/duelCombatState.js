/**
 * Stato mutabile del combattimento durante poteri e bonus.
 * Copia i campi da `duel` (dopo setup campo) e inizializza tracking aggiuntivo.
 *
 * @param {Object} duel - oggetto duello mutato da `applyDuelFieldSetup` / contesto risoluzione
 */
/** Campi aggiornati da effetti post-battaglia (da riassegnare ai `let` locali). */
export function pickPostBattleFields(state) {
  return {
    pPower: state.pPower,
    ePower: state.ePower,
    pDamage: state.pDamage,
    eDamage: state.eDamage,
    pFocusUsed: state.pFocusUsed,
    eFocusUsed: state.eFocusUsed,
    pAssaultMod: state.pAssaultMod,
    eAssaultMod: state.eAssaultMod,
    pHPCurrent: state.pHPCurrent,
    eHPCurrent: state.eHPCurrent,
    pFCCurrent: state.pFCCurrent,
    eFCCurrent: state.eFCCurrent,
    pImmune: state.pImmune,
    eImmune: state.eImmune,
    pAbilityCopied: state.pAbilityCopied,
    eAbilityCopied: state.eAbilityCopied,
    pCopiedAbilityNotTriggered: state.pCopiedAbilityNotTriggered,
    eCopiedAbilityNotTriggered: state.eCopiedAbilityNotTriggered,
    pBonusCopied: state.pBonusCopied,
    eBonusCopied: state.eBonusCopied,
    pCopiedBonusNotTriggered: state.pCopiedBonusNotTriggered,
    eCopiedBonusNotTriggered: state.eCopiedBonusNotTriggered,
    playerToxinActivated: state.playerToxinActivated,
    enemyToxinActivated: state.enemyToxinActivated,
  };
}

const WATCHED_COMBAT_STATS = ['pPower', 'ePower', 'pDamage', 'eDamage', 'pAssaultMod', 'eAssaultMod'];

function watchCombatStatReductions(state) {
  let occurred = Boolean(state.statReductionOccurred);
  const values = {};
  for (const key of WATCHED_COMBAT_STATS) values[key] = state[key];
  Object.defineProperty(state, 'statReductionOccurred', {
    get: () => occurred,
    set: (value) => { occurred = Boolean(value); },
    enumerable: true,
    configurable: true,
  });
  for (const key of WATCHED_COMBAT_STATS) {
    Object.defineProperty(state, key, {
      get: () => values[key],
      set: (next) => {
        if (typeof next === 'number' && typeof values[key] === 'number' && next < values[key]) {
          occurred = true;
        }
        values[key] = next;
      },
      enumerable: true,
      configurable: true,
    });
  }
  return state;
}

export function createDuelCombatState(duel, fieldStatDeltas = null, slotCurseStatDeltas = null) {
  return watchCombatStatReductions({
    pPower: duel.pPower,
    ePower: duel.ePower,
    pDamage: duel.pDamage,
    eDamage: duel.eDamage,
    pFocusUsed: duel.pFocusUsed,
    eFocusUsed: duel.eFocusUsed,
    pAssaultMod: duel.pAssaultMod,
    eAssaultMod: duel.eAssaultMod,
    pHPCurrent: duel.pHPCurrent,
    eHPCurrent: duel.eHPCurrent,
    pFCCurrent: duel.pFCCurrent,
    eFCCurrent: duel.eFCCurrent,
    pAbilityBlocked: duel.pAbilityBlocked,
    eAbilityBlocked: duel.eAbilityBlocked,
    pBonusBlocked: duel.pBonusBlocked,
    eBonusBlocked: duel.eBonusBlocked,
    pImmune: duel.pImmune,
    eImmune: duel.eImmune,
    pMinAssault: null,
    eMinAssault: null,
    pAbilityCopied: null,
    eAbilityCopied: null,
    pCopiedAbilityNotTriggered: false,
    eCopiedAbilityNotTriggered: false,
    pBonusCopied: null,
    eBonusCopied: null,
    pCopiedBonusNotTriggered: false,
    eCopiedBonusNotTriggered: false,
    playerToxinActivated: null,
    enemyToxinActivated: null,
    pModifierInversion: false,
    eModifierInversion: false,
    fieldStatDeltas,
    slotCurseStatDeltas,
  });
}
