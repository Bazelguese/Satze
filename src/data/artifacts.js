// ============================================
// ARTEFATTI ROGUELIKE
// ============================================

/**
 * Categorie artefatti
 */
export const ARTIFACT_CATEGORIES = {
  curse: { name: 'Maledizione', color: 'red', icon: '💀' },
  omen: { name: 'Presagio', color: 'orange', icon: '⚠️' },
  neutral: { name: 'Neutrale', color: 'blue', icon: '⚪' },
  generous: { name: 'Generoso', color: 'green', icon: '✨' },
  enlightening: { name: 'Illuminante', color: 'purple', icon: '🌟' },
};

/**
 * Artefatti Maledizioni (molto negativi)
 */
export const CURSE_ARTIFACTS = [
  {
    id: 'catene_esitazione',
    name: 'Catene dell\'Esitazione',
    category: 'curse',
    description: 'Inizi sempre per secondo',
    effect: { type: 'alwaysSecond', value: true },
  },
  {
    id: 'sigillo_poverta',
    name: 'Sigillo della Povertà',
    category: 'curse',
    description: '-2 FC Max permanente',
    effect: { type: 'focusMax', value: -2, permanent: true },
  },
  {
    id: 'marchio_debole',
    name: 'Marchio del Debole',
    category: 'curse',
    description: '-1 POT a tutte le carte',
    effect: { type: 'power', value: -1, target: 'all', permanent: true },
  },
  {
    id: 'peso_armata',
    name: 'Peso dell\'Armata',
    category: 'curse',
    description: '-1 DAN a tutte le carte',
    effect: { type: 'damage', value: -1, target: 'all', permanent: true },
  },
  {
    id: 'eco_sconfitta',
    name: 'Eco della Sconfitta',
    category: 'curse',
    description: 'Vendetta dei nemici sempre attiva',
    effect: { type: 'enemyTrigger', trigger: 'vendetta', alwaysActive: true },
  },
  {
    id: 'maschera_incrinata',
    name: 'Maschera Incrinata',
    category: 'curse',
    description: 'Il tuo Gregario non funziona',
    effect: { type: 'disableBonus', bonus: 'gregario' },
  },
];

/**
 * Artefatti Presagi (negativi)
 */
export const OMEN_ARTIFACTS = [
  {
    id: 'amuleto_corrotto',
    name: 'Amuleto Corrotto',
    category: 'omen',
    description: '-1 FC Max permanente',
    effect: { type: 'focusMax', value: -1, permanent: true },
  },
  {
    id: 'lama_spuntata',
    name: 'Lama Spuntata',
    category: 'omen',
    description: '-1 DAN all\'Avatar',
    effect: { type: 'damage', value: -1, target: 'avatar', permanent: true },
  },
  {
    id: 'scudo_incrinato',
    name: 'Scudo Incrinato',
    category: 'omen',
    description: '-1 POT all\'Avatar',
    effect: { type: 'power', value: -1, target: 'avatar', permanent: true },
  },
  {
    id: 'ombra_dubbio',
    name: 'Ombra del Dubbio',
    category: 'omen',
    description: 'Gloria del giocatore non si attiva',
    effect: { type: 'disableTrigger', trigger: 'glory', target: 'player' },
  },
  {
    id: 'moneta_falsa',
    name: 'Moneta Falsa',
    category: 'omen',
    description: 'Ogni 5 FC spesi, il nemico guadagna 1 FC',
    effect: { type: 'focusLeak', threshold: 5, enemyGain: 1 },
  },
  {
    id: 'stendardo_sbiadito',
    name: 'Stendardo Sbiadito',
    category: 'omen',
    description: 'Bonus armata attivo solo se 3+ carte dell\'armata in mano',
    effect: { type: 'armyBonusRequirement', minCards: 3 },
  },
];

/**
 * Artefatti Neutrali (standard)
 */
export const NEUTRAL_ARTIFACTS = [
  {
    id: 'bilancia_fato',
    name: 'Bilancia del Fato',
    category: 'neutral',
    description: 'A inizio scontro, 50% di iniziare primo o secondo',
    effect: { type: 'randomInitiative', probability: 0.5 },
  },
  {
    id: 'dado_caos',
    name: 'Dado del Caos',
    category: 'neutral',
    description: '+2/-2 VA casuale ogni scontro',
    effect: { type: 'randomAssault', min: -2, max: 2 },
  },
  {
    id: 'specchio_opaco',
    name: 'Specchio Opaco',
    category: 'neutral',
    description: 'Copia il trigger dell\'agente nemico (sostituisce il tuo)',
    effect: { type: 'copyEnemyTrigger' },
  },
  {
    id: 'anello_scambio',
    name: 'Anello dello Scambio',
    category: 'neutral',
    description: 'Puoi scambiare POT e DAN dell\'Avatar a inizio scontro',
    effect: { type: 'swapAvatarStats', optional: true },
  },
  {
    id: 'talismano_rischio',
    name: 'Talismano del Rischio',
    category: 'neutral',
    description: '+3 POT ma -2 DAN a tutte le carte',
    effect: { type: 'power', value: 3, target: 'all', permanent: true, lose: { type: 'damage', value: -2, target: 'all' } },
  },
  {
    id: 'contratto_vincolante',
    name: 'Contratto Vincolante',
    category: 'neutral',
    description: '+1 FC Max, ma non puoi scartare agenti',
    effect: { type: 'focusMax', value: 1, permanent: true, restriction: 'noDiscard' },
  },
];

/**
 * Artefatti Generosi (positivi)
 */
export const GENEROUS_ARTIFACTS = [
  {
    id: 'amuleto_lucente',
    name: 'Amuleto Lucente',
    category: 'generous',
    description: '+1 FC Max permanente',
    effect: { type: 'focusMax', value: 1, permanent: true },
  },
  {
    id: 'lama_affilata',
    name: 'Lama Affilata',
    category: 'generous',
    description: '+1 DAN all\'Avatar',
    effect: { type: 'damage', value: 1, target: 'avatar', permanent: true },
  },
  {
    id: 'scudo_rinforzato',
    name: 'Scudo Rinforzato',
    category: 'generous',
    description: '+1 POT all\'Avatar',
    effect: { type: 'power', value: 1, target: 'avatar', permanent: true },
  },
  {
    id: 'stendardo_vittoria',
    name: 'Stendardo della Vittoria',
    category: 'generous',
    description: 'Gloria del giocatore: +1 POT aggiuntivo',
    effect: { type: 'triggerBonus', trigger: 'glory', effect: 'power', value: 1, target: 'player' },
  },
  {
    id: 'moneta_fortunata',
    name: 'Moneta Fortunata',
    category: 'generous',
    description: 'Ogni 5 FC spesi guadagni 1 FC',
    effect: { type: 'focusGain', threshold: 5, gain: 1 },
  },
  {
    id: 'emblema_armata',
    name: 'Emblema dell\'Armata',
    category: 'generous',
    description: 'Bonus armata attivo anche con 1 sola carta dell\'armata in mano',
    effect: { type: 'armyBonusRequirement', minCards: 1 },
  },
];

/**
 * Artefatti Illuminanti (molto positivi)
 */
export const ENLIGHTENING_ARTIFACTS = [
  {
    id: 'corona_comando',
    name: 'Corona del Comando',
    category: 'enlightening',
    description: 'Inizi sempre per primo',
    effect: { type: 'alwaysFirst', value: true },
  },
  {
    id: 'tesoro_infinito',
    name: 'Tesoro Infinito',
    category: 'enlightening',
    description: '+2 FC Max permanente',
    effect: { type: 'focusMax', value: 2, permanent: true },
  },
  {
    id: 'cuore_titano',
    name: 'Cuore del Titano',
    category: 'enlightening',
    description: '+1 POT a tutte le carte',
    effect: { type: 'power', value: 1, target: 'all', permanent: true },
  },
  {
    id: 'furia_ancestrale',
    name: 'Furia Ancestrale',
    category: 'enlightening',
    description: '+1 DAN a tutte le carte',
    effect: { type: 'damage', value: 1, target: 'all', permanent: true },
  },
  {
    id: 'aura_conquistatore',
    name: 'Aura del Conquistatore',
    category: 'enlightening',
    description: 'Conquista del giocatore: +2 DAN diretto aggiuntivo',
    effect: { type: 'triggerBonus', trigger: 'conquest', effect: 'directDamage', value: 2, target: 'player' },
  },
  {
    id: 'essenza_doppia',
    name: 'Essenza Doppia',
    category: 'enlightening',
    description: 'Gregario copia entrambi i bonus armata in mano (se presenti)',
    effect: { type: 'gregarioDouble', value: true },
  },
  {
    id: 'sigillo_immunita',
    name: 'Sigillo dell\'Immunità',
    category: 'enlightening',
    description: 'L\'Avatar è Immune ai debuff da eventi/artefatti negativi',
    effect: { type: 'avatarImmune', immuneTo: ['debuff', 'events', 'artifacts'] },
  },
];

/**
 * Tutti gli artefatti combinati
 */
export const ALL_ARTIFACTS = [
  ...CURSE_ARTIFACTS,
  ...OMEN_ARTIFACTS,
  ...NEUTRAL_ARTIFACTS,
  ...GENEROUS_ARTIFACTS,
  ...ENLIGHTENING_ARTIFACTS,
];

/**
 * Seleziona un artefatto casuale per categoria
 */
export function selectRandomArtifact(category = null) {
  let pool = ALL_ARTIFACTS;
  
  if (category) {
    pool = ALL_ARTIFACTS.filter(a => a.category === category);
  }
  
  if (pool.length === 0) {
    // Fallback a neutrale
    pool = NEUTRAL_ARTIFACTS;
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Applica gli effetti di tutti gli artefatti
 */
export function applyArtifactEffects(artifacts, context) {
  const effects = {
    power: 0,
    damage: 0,
    focusMax: 0,
    alwaysFirst: false,
    alwaysSecond: false,
    disabledTriggers: [],
    disabledBonuses: [],
    // ... altri effetti
  };
  
  artifacts.forEach(artifact => {
    if (!artifact.effect) return;
    
    const effect = artifact.effect;
    
    switch (effect.type) {
      case 'power':
        if (effect.target === 'avatar' || effect.target === 'all') {
          effects.power += effect.value || 0;
        }
        break;
        
      case 'damage':
        if (effect.target === 'avatar' || effect.target === 'all') {
          effects.damage += effect.value || 0;
        }
        break;
        
      case 'focusMax':
        effects.focusMax += effect.value || 0;
        break;
        
      case 'alwaysFirst':
        effects.alwaysFirst = true;
        break;
        
      case 'alwaysSecond':
        effects.alwaysSecond = true;
        break;
        
      case 'disableTrigger':
        if (effect.target === 'player') {
          effects.disabledTriggers.push(effect.trigger);
        }
        break;
        
      case 'disableBonus':
        effects.disabledBonuses.push(effect.bonus);
        break;
        
      default:
        break;
    }
  });
  
  return effects;
}
