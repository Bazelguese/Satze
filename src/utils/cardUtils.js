// ============================================
// UTILITÀ - Gestione Carte
// ============================================

import { ALL_AGENTS, TRIGGER_NAMES } from '../data';
import { AGENT_IMAGES } from '../data/images';

/**
 * Conta le armate presenti in una mano
 * @param {Array} hand - Array di carte
 * @returns {Object} - Oggetto con conteggio per armata
 */
export const countArmies = (hand) => {
  const counts = {};
  hand.forEach(card => {
    counts[card.army] = (counts[card.army] || 0) + 1;
  });
  return counts;
};

/**
 * Trova una carta per ID
 * @param {number} cardId - ID della carta
 * @returns {Object|null} - Carta trovata o null
 */
export const findCardById = (cardId) => {
  return ALL_AGENTS.find(card => card.id === cardId) || null;
};

/**
 * Calcola la lega totale di un deck
 * @param {Array} deck - Array di ID carte
 * @returns {number} - Somma delle leghe
 */
export const calculateDeckLeague = (deck) => {
  return deck.reduce((total, cardId) => {
    const card = findCardById(cardId);
    return total + (card ? card.league : 0);
  }, 0);
};

/**
 * Verifica se un deck è valido (10 carte, lega <= 30)
 * @param {Array} deck - Array di ID carte
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateDeck = (deck) => {
  const errors = [];
  
  if (deck.length !== 10) {
    errors.push(`Il deck deve contenere esattamente 10 carte (attualmente: ${deck.length})`);
  }
  
  const league = calculateDeckLeague(deck);
  if (league > 30) {
    errors.push(`La lega totale non può superare 30 (attualmente: ${league})`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    league
  };
};

/**
 * Separa il suffisso ` (min N)` solo se è in coda al testo (effetti riduzione con pavimento).
 * Senza suffisso: `minSuffix` è stringa vuota e `base` coincide con l’input.
 * @param {string} text
 * @returns {{ base: string, minSuffix: string }}
 */
export function splitAbilityMinSuffix(text) {
  if (typeof text !== 'string' || !text) return { base: text || '', minSuffix: '' };
  const m = text.match(/^(.*)( \(min \d+\))$/);
  if (!m || m[1].length === 0) return { base: text, minSuffix: '' };
  return { base: m[1], minSuffix: m[2] };
}

/**
 * Formatta un'abilità in formato compatto per la visualizzazione
 * @param {Object} ability - Oggetto abilità con trigger, effect, value
 * @param {Object} options - Opzioni: { currentValue } per mostrare valore attuale tra parentesi (Attrizione/Escalation)
 * @returns {string} - Stringa formattata (es. "Imboscata: +2 POT", "Attrizione 1 POT (+3)")
 */
export const formatAbilityHelper = (ability, options = {}) => {
  if (!ability) return "—";
  const minFloorReduction = options.minFloorReduction || 0;
  const adjMin = (n) =>
    n != null && minFloorReduction > 0 ? Math.max(1, n - minFloorReduction) : n;
  const abilityForFormat =
    minFloorReduction > 0
      ? {
          ...ability,
          ...(ability.minPower != null ? { minPower: adjMin(ability.minPower) } : {}),
          ...(ability.minDamage != null ? { minDamage: adjMin(ability.minDamage) } : {}),
          ...(ability.minAssault != null ? { minAssault: adjMin(ability.minAssault) } : {}),
        }
      : ability;
  const trigger = abilityForFormat.trigger ? `${TRIGGER_NAMES[abilityForFormat.trigger]}: ` : "";
  const { currentValue } = options;
  let effect = "";
  switch (abilityForFormat.effect) {
    case 'power': effect = `+${abilityForFormat.value} POT`; break;
    case 'enemyPower': effect = `${abilityForFormat.value} POT nem.${abilityForFormat.minPower ? ` (min ${abilityForFormat.minPower})` : ''}`; break;
    case 'damage': effect = `+${abilityForFormat.value} DAN`; break;
    case 'enemyDamage': effect = `${abilityForFormat.value} DAN nem.${abilityForFormat.minDamage ? ` (min ${abilityForFormat.minDamage})` : ''}`; break;
    case 'enemyPowerAndDamage': {
      let minSuffix = '';
      if (abilityForFormat.minPower != null || abilityForFormat.minDamage != null) {
        if (abilityForFormat.minPower != null && abilityForFormat.minDamage != null && abilityForFormat.minPower === abilityForFormat.minDamage) {
          minSuffix = ` (min ${abilityForFormat.minPower})`;
        } else {
          const parts = [];
          if (abilityForFormat.minPower != null) parts.push(`POT min ${abilityForFormat.minPower}`);
          if (abilityForFormat.minDamage != null) parts.push(`DAN min ${abilityForFormat.minDamage}`);
          minSuffix = ` (${parts.join(', ')})`;
        }
      }
      effect = `${abilityForFormat.value} POT, ${abilityForFormat.value} DAN nem.${minSuffix}`;
      break;
    }
    case 'imponiPower': effect = "Imponi POT"; break;
    case 'imponiDamage': effect = "Imponi DAN"; break;
    case 'assaultValue': effect = `+${abilityForFormat.value} VA`; break;
    case 'enemyAssault': effect = `${abilityForFormat.value} VA nem.${abilityForFormat.minAssault ? ` (min ${abilityForFormat.minAssault})` : ''}`; break;
    case 'copyPower': effect = "Copia POT"; break;
    case 'copyDamage': effect = "Copia DAN"; break;
    case 'copyAbility': effect = "Copia Potere"; break;
    case 'copyBonus': effect = "Copia Bonus"; break;
    case 'blockAbility': effect = "Blocca Potere"; break;
    case 'blockBonus': effect = "Blocca Bonus"; break;
    case 'immune': effect = "Immune"; break;
    case 'focusCoin': effect = `+${ability.value} FC`; break;
    case 'heal': effect = `Cura ${ability.value}`; break;
    case 'selfDamage': effect = `-${ability.value} PV (a te)`; break;
    case 'directDamage': effect = `${ability.value} Danni dir.`; break;
    case 'powerAndDamage': effect = `+${ability.value} POT, +${ability.value} DAN`; break;
    case 'toxin': effect = `Tossina ${ability.value}${ability.minHealth ? ` (min ${ability.minHealth})` : ''}`; break;
    case 'escalation': 
      const escalationStat = ability.stat === 'power' ? 'POT' : (ability.stat === 'damage' ? 'DAN' : ability.stat?.toUpperCase() || 'STAT');
      effect = ability.stat === 'powerAndDamage' ? `Escalation ${ability.value} POT, ${ability.value} DAN` : `Escalation ${ability.value} ${escalationStat}`;
      if (currentValue !== undefined && currentValue !== null) effect += ` (+${currentValue})`;
      break;
    case 'attrition': 
      const attritionStat = ability.stat === 'power' ? 'POT' : (ability.stat === 'damage' ? 'DAN' : ability.stat?.toUpperCase() || 'STAT');
      effect = `Attrizione ${ability.value} ${attritionStat}`;
      if (currentValue !== undefined && currentValue !== null) effect += ` (+${currentValue})`;
      break;
    case 'inversion': effect = "Inversione"; break;
    default: effect = "—";
  }
  return trigger + effect;
};

/**
 * Determina il tipo di sprite per una carta agente
 * @param {Object} agent - Oggetto agente con id, army, name
 * @returns {Object} - { type, palette, agentId? }
 */
export const getCardSprite = (agent) => {
  if (!agent) return { type: 'cosmic_hero', palette: 'cosmic' };
  // Prima controlla se esiste un'immagine specifica per questo agente
  if (AGENT_IMAGES[agent.id]) {
    return { type: 'specific', agentId: agent.id, palette: 'cosmic' };
  }
  
  const armyMap = {
    'Figli dell\'Orizzonte': 'cosmic',
    'Kethran': 'babel',
    'Corte Rossa': 'devil',
    'Calibri Pesanti': 'mech',
    'Orathai': 'mystic',
    'Mounthborn': 'swarm'
  };
  
  const palette = armyMap[agent.army] || 'cosmic';
  const name = agent.name.toLowerCase();
  let type = `${palette}_hero`;
  
  if (palette === 'cosmic') {
    if (name.includes('stella') || name.includes('polvere') || name.includes('frammento') || name.includes('spirito') || name.includes('sentinella')) type = 'cosmic_spirit';
    else if (name.includes('profeta') || name.includes('tessitrice') || name.includes('nomade') || name.includes('cavaliere')) type = 'cosmic_mage';
    else type = 'cosmic_hero';
  } else if (palette === 'babel') {
    if (name.includes('ur-nammu') || name.includes('conquistatore') || name.includes('araldo')) type = 'babel_king';
    else if (name.includes('profeta') || name.includes('sacerdote') || name.includes('custode') || name.includes('costruttore') || name.includes('martire')) type = 'babel_priest';
    else type = 'babel_berserker';
  } else if (palette === 'devil') {
    if (name.includes('principe') || name.includes('esattore') || name.includes('giudice')) type = 'devil_prince';
    else if (name.includes('imp') || name.includes('diavoletto') || name.includes('servo') || name.includes('anima')) type = 'devil_imp';
    else type = 'devil_demon';
  } else if (palette === 'mech') {
    if (name.includes('titano') || name.includes('fortezza') || name.includes('nucleo')) type = 'mech_titan';
    else if (name.includes('drone') || name.includes('robot') || name.includes('scudo')) type = 'mech_drone';
    else type = 'mech_golem';
  } else if (palette === 'mystic') {
    if (name.includes('arcanista') || name.includes('stregone') || name.includes('maestro') || name.includes('guardiano')) type = 'mystic_arcane';
    else if (name.includes('oracolo') || name.includes('evocatore') || name.includes('custode')) type = 'mystic_oracle';
    else type = 'mystic_spirit';
  } else if (palette === 'swarm') {
    if (name.includes('regina')) type = 'swarm_queen';
    else if (name.includes('bruto') || name.includes('predatore') || name.includes('divoratore')) type = 'swarm_beast';
    else type = 'swarm_insect';
  }
  
  return { type, palette };
};