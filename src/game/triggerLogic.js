// ============================================
// LOGICA TRIGGER
// ============================================

/**
 * Contesto per il controllo dei trigger
 * @typedef {Object} TriggerContext
 * @property {boolean} isFirst - Sei il primo giocatore
 * @property {boolean} wonPrevious - Hai vinto lo scontro precedente
 * @property {boolean} lostPrevious - Hai perso lo scontro precedente
 * @property {number} focusCoins - Focus Coin investiti
 * @property {number} enemyFocusCoins - Focus Coin investiti dal nemico
 * @property {number} cardsPlayed - Carte giocate da te in partita (inclusa la carta dello scontro corrente)
 * @property {number} enemyCardsPlayed - Carte giocate dal nemico in partita (inclusa la carta dello scontro corrente)
 * @property {number} playerHP - I tuoi PV
 * @property {number} enemyHP - PV del nemico
 * @property {boolean} won - Stai vincendo questo scontro
 * @property {boolean} lost - Stai perdendo questo scontro
 * @property {number} playerLeague - Lega della tua carta
 * @property {number} enemyLeague - Lega della carta nemica
 * @property {number} playerFieldsConquered - Campi conquistati da te
 * @property {number} enemyFieldsConquered - Campi conquistati dal nemico
 * @property {number} roundNumber - Numero del round corrente
 * @property {number} playerInitialLeagueCount - Carte della stessa Lega della carta giocata nella mano iniziale (inclusa la carta giocata)
 * @property {Object} fieldModifiers - Modificatori del campo di battaglia
 */

/** Trigger risolti solo dopo l'esito VA dello scontro corrente. */
export const POST_BATTLE_TRIGGERS = ['conquest', 'lastWish'];

export function isPostBattleTrigger(trigger) {
  return POST_BATTLE_TRIGGERS.includes(trigger);
}

/**
 * Verifica se un trigger è soddisfatto
 * @param {string|null} trigger - Nome del trigger
 * @param {TriggerContext} context - Contesto dello scontro
 * @returns {boolean} - True se il trigger è soddisfatto
 */
export const checkTrigger = (trigger, context) => {
    if (!trigger) return true;
    
    // Campi che forzano trigger sempre attivi
    const fieldMods = context.fieldModifiers || {};
    
    switch (trigger) {
      case 'imboscata':
        if (fieldMods.imboscataAlwaysActive) return true;
        if (fieldMods.swapImboscataIntervento) return !context.isFirst;
        return context.isFirst;

      case 'intervention':
        if (fieldMods.interventoAlwaysActive) return true;
        if (fieldMods.swapImboscataIntervento) return context.isFirst;
        return !context.isFirst;

      case 'glory':
        if (fieldMods.gloriaAlwaysActive) return true;
        return context.wonPrevious;

      case 'vendetta':
        if (fieldMods.vendettaAlwaysActive) return true;
        return context.lostPrevious;

      case 'overdrive': {
        const threshold = fieldMods.overdriveThreshold || 5;
        return context.focusCoins >= threshold;
      }

      case 'reckoning':
        if (fieldMods.reckoningAlwaysActive) return true;
        return context.cardsPlayed >= 3 && context.enemyCardsPlayed >= 3;

      case 'rimonta':
        if (fieldMods.rimontaAlwaysActive) return true;
        return context.playerHP < context.enemyHP;
        
      case 'magnanimous': // Magnanimo
        if (fieldMods.magnanimoAlwaysActive) return true;
        return context.playerHP > context.enemyHP;
        
      case 'lastWish': // Ultimo desiderio
        return context.lost;
        
      case 'conquest': // Conquista
        return context.won;
        
      // NUOVI TRIGGER
      case 'opportunista': // Opportunista - nemico ha speso 5+ FC
        return (context.enemyFocusCoins || 0) >= 5;
        
      case 'sfida': // Sfida - tua Lega < Lega nemica
        return (context.playerLeague || 0) < (context.enemyLeague || 0);
        
      case 'sopraffare': // Sopraffare - tua Lega > Lega nemica
        return (context.playerLeague || 0) > (context.enemyLeague || 0);
        
      case 'invasione': // Invasione - hai conquistato 1+ campi
        return (context.playerFieldsConquered || 0) >= 1;
        
      case 'resistenza': // Resistenza - nemico ha conquistato 1+ campi
        if (fieldMods.resistenzaAlwaysActive) return true;
        return (context.enemyFieldsConquered || 0) >= 1;
        
      case 'turbo':
        if (fieldMods.turboAlwaysActive) return true;
        if (fieldMods.invertTurboUltimaChance) return (context.roundNumber || 1) >= 5;
        return (context.roundNumber || 1) <= 2;
        
      case 'ultimaChance': // Ultima Chance - Round 5+
        if (fieldMods.invertTurboUltimaChance) return (context.roundNumber || 1) <= 2;
        return (context.roundNumber || 1) >= 5;

      case 'alleato':
        // Almeno 1 altra carta della stessa Lega in mano iniziale, oltre alla carta giocata.
        return Math.max(0, (context.playerInitialLeagueCount || 0) - 1) >= 1;

      case 'rinforzi':
        // Almeno 2 altre carte della stessa Lega in mano iniziale, oltre alla carta giocata.
        return Math.max(0, (context.playerInitialLeagueCount || 0) - 1) >= 2;
        
      default: 
        return false;
    }
  };
  
  /**
   * Crea il contesto per il controllo dei trigger
   * @param {Object} params - Parametri dello scontro
   * @returns {TriggerContext} - Contesto completo
   */
  export const createTriggerContext = (params) => {
    const {
      isFirst = false,
      wonPrevious = false,
      lostPrevious = false,
      focusCoins = 0,
      enemyFocusCoins = 0,
      cardsPlayed = 0,
      enemyCardsPlayed = 0,
      playerHP = 25,
      enemyHP = 25,
      won = false,
      lost = false,
      playerLeague = null,
      enemyLeague = null,
      playerFieldsConquered = 0,
      enemyFieldsConquered = 0,
      roundNumber = 1,
      playerInitialLeagueCount = 0,
      fieldModifiers = {}
    } = params;
    
    return {
      isFirst,
      wonPrevious,
      lostPrevious,
      focusCoins,
      enemyFocusCoins,
      cardsPlayed,
      enemyCardsPlayed,
      playerHP,
      enemyHP,
      won,
      lost,
      playerLeague,
      enemyLeague,
      playerFieldsConquered,
      enemyFieldsConquered,
      roundNumber,
      playerInitialLeagueCount,
      fieldModifiers
    };
  };