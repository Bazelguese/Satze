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
 * @property {number} [focusInvested] - Alias esplicito di focusCoins
 * @property {number} [enemyFocusInvested] - Alias esplicito di enemyFocusCoins
 * @property {number} [effectiveFocus] - Investiti + temporanei concessi da effetti
 * @property {number} [enemyEffectiveFocus] - Come sopra, lato nemico
 * @property {boolean} [hasEminence] - Il lato possiede un'Eminenza attiva
 * @property {boolean} [enemyHasEminence] - Il nemico possiede un'Eminenza attiva
 * @property {number|null} [playerPresence] - Presenza campionata a PRESENCE_SNAPSHOT
 * @property {number|null} [enemyPresence] - Presenza nemica campionata a PRESENCE_SNAPSHOT
 * @property {number} [presenceSpent] - Presenza spesa nel round corrente
 * @property {number} [enemyPresenceSpent] - Presenza spesa dal nemico nel round corrente
 * @property {number} [totalPresenceSpent] - Presenza spesa dall'inizio dello Scontro
 * @property {number} [enemyTotalPresenceSpent] - Come sopra, lato nemico
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
        if (fieldMods.overdriveDisabled) return false;
        const threshold = fieldMods.overdriveThreshold || 5;
        // Overdrive legge il Focus effettivo: gli FC temporanei concessi da un effetto
        // contano come normali FC posseduti dall'Agente.
        const focus = context.effectiveFocus ?? context.focusCoins;
        return focus >= threshold;
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
        if (fieldMods.conquestDisabled) return false;
        return context.won;
        
      // NUOVI TRIGGER
      case 'opportunista': // Opportunista - nemico ha speso 5+ FC
        // Legge i soli FC realmente investiti dal nemico: i temporanei non sono stati spesi.
        return (context.enemyFocusInvested ?? context.enemyFocusCoins ?? 0) >= 5;
        
      case 'sfida': // Sfida - tua Lega < Lega nemica
        return (context.playerLeague || 0) < (context.enemyLeague || 0);
        
      case 'sopraffare': // Sopraffare - tua Lega > Lega nemica
        return (context.playerLeague || 0) > (context.enemyLeague || 0);
        
      case 'invasione': // Invasione - hai conquistato 1+ campi
        if (fieldMods.invasioneAlwaysActive) return true;
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

      case 'debt':
        // Debito: "quando viene schierato" — al controllo del Potere l'Agente è già in campo.
        return true;

      // TRIGGER EMINENZA
      //
      // Leggono valori già campionati a PRESENCE_SNAPSHOT, non contatori vivi: una
      // variazione di Presenza successiva allo snapshot non li ricalcola.
      //
      // Un lato privo di Eminenza non ha Presenza: non è "Presenza 0". Senza questa guardia
      // il fallback tecnico `eminence: null` soddisfarebbe Digiuno.

      case 'manifestazione': // Hai speso Presenza in questo round
        if (!context.hasEminence) return false;
        return (context.presenceSpent || 0) > 0;

      case 'blasfemia': // Il nemico ha speso Presenza in questo round
        if (!context.enemyHasEminence) return false;
        return (context.enemyPresenceSpent || 0) > 0;

      case 'fervore': { // Presenza spesa cumulativa oltre soglia; latch, non si perde
        if (!context.hasEminence) return false;
        const threshold = fieldMods.fervoreThreshold ?? 3;
        return (context.totalPresenceSpent || 0) >= threshold;
      }

      case 'digiuno': // Presenza a 0
        if (!context.hasEminence) return false;
        return context.playerPresence === 0;

      case 'grazia': { // Presenza alta
        if (!context.hasEminence) return false;
        const threshold = fieldMods.graziaThreshold ?? 5;
        return (context.playerPresence ?? 0) >= threshold;
      }

      case 'ascendente': // Più Presenza del nemico
        if (!context.hasEminence || !context.enemyHasEminence) return false;
        return context.playerPresence > context.enemyPresence;

      case 'soggezione': // Meno Presenza del nemico
        if (!context.hasEminence || !context.enemyHasEminence) return false;
        return context.playerPresence < context.enemyPresence;

      default: 
        return false;
    }
  };

/** Trigger introdotti dal sottosistema Eminenza, tutti basati sulla Presenza. */
export const EMINENCE_TRIGGERS = [
  'manifestazione',
  'blasfemia',
  'fervore',
  'digiuno',
  'grazia',
  'ascendente',
  'soggezione',
];

export function isEminenceTrigger(trigger) {
  return EMINENCE_TRIGGERS.includes(trigger);
}
  
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
      fieldModifiers = {},

      // Focus: `focusCoins` resta l'investito storico; l'effettivo lo affianca senza
      // sostituirlo, così i chiamanti che non conoscono gli FC temporanei sono invariati.
      focusInvested = focusCoins,
      enemyFocusInvested = enemyFocusCoins,
      effectiveFocus = focusCoins,
      enemyEffectiveFocus = enemyFocusCoins,

      // Presenza: default nulli, mai 0, per non far scattare Digiuno su uno stato senza Eminenza.
      hasEminence = false,
      enemyHasEminence = false,
      playerPresence = null,
      enemyPresence = null,
      presenceSpent = 0,
      enemyPresenceSpent = 0,
      totalPresenceSpent = 0,
      enemyTotalPresenceSpent = 0,
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
      fieldModifiers,

      focusInvested,
      enemyFocusInvested,
      effectiveFocus,
      enemyEffectiveFocus,

      hasEminence,
      enemyHasEminence,
      playerPresence,
      enemyPresence,
      presenceSpent,
      enemyPresenceSpent,
      totalPresenceSpent,
      enemyTotalPresenceSpent,
    };
  };