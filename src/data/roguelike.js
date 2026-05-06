// ============================================
// DATI ROGUELIKE - Avatar, Zone, Eventi, Artefatti
// ============================================

/**
 * Pool POT/DAN per Avatar
 */
export const AVATAR_BODY_POOLS = {
  mediocre: [ // POT+DAN ≤3
    { power: 2, damage: 1 },
    { power: 1, damage: 2 },
    { power: 1, damage: 1 },
  ],
  medium: [ // POT+DAN =4
    { power: 2, damage: 2 },
    { power: 3, damage: 1 },
    { power: 1, damage: 3 },
  ],
  strong: [ // POT+DAN ≥5
    { power: 3, damage: 2 },
    { power: 2, damage: 3 },
    { power: 4, damage: 1 },
    { power: 1, damage: 4 },
    { power: 3, damage: 3 },
  ],
};

/**
 * Poteri Avatar per categoria corpo
 */
export const AVATAR_POWER_PROPOSALS = {
  mediocre: {
    weak: 1,   // 1 potere debole
    medium: 1, // 1 potere medio
    strong: 1, // 1 potere forte
  },
  medium: {
    weak: 1,
    medium: 2,
    strong: 0,
  },
  strong: {
    weak: 2,
    medium: 1,
    strong: 0,
  },
};

/**
 * Trigger pool per affidabilità
 */
export const AVATAR_TRIGGER_POOLS = {
  highReliability: [ // molt. 0.8-1.0
    'conquest',
    'intervention',
    'glory',
    'vendetta',
    'imboscata',
  ],
  mediumReliability: [ // molt. 0.5-0.7
    'sfida',
    'reckoning',
    'overdrive',
    'opportunista',
    'invasione',
    'resistenza',
  ],
  lowReliability: [ // molt. 0.3-0.4
    'rimonta',
    'magnanimous',
    'ultimaChance',
    'turbo',
  ],
};

/**
 * Soglie corpo per Lega Avatar
 */
export const AVATAR_BODY_THRESHOLDS = {
  2: { mediocre: 3, medium: 4, strong: 5 },
  3: { mediocre: 5, medium: 6, strong: 7 },
  4: { mediocre: 7, medium: 8, strong: 9 },
  5: { mediocre: 9, medium: 10, strong: 11 },
  6: { mediocre: 11, medium: 12, strong: 13 },
  7: { mediocre: 13, medium: 14, strong: 15 },
};

/**
 * Configurazione Zone
 */
export const ZONE_CONFIG = {
  1: {
    name: 'Reclutamento',
    narrative: 'L\'Avatar vaga solitario nelle terre selvagge, reclutando seguaci prima di attaccare un avamposto.',
    totalNodes: 12,
    duels: 7,
    eliteBosses: 0,
    events: 4,
    finalBoss: { name: 'Avamposto', league: 3 },
    branches: 4, // una per armata
    availableArmies: 'all', // tutte e 4 le armate estratte
    maxDeckSize: 5,
    initialEvent: {
      type: 'agentSelection',
      times: 2, // si ripete due volte
      options: 3, // 3 agenti proposti (uno per armata diversa)
    },
    combat: {
      battlefields: 3,
      victoryCondition: {
        turns1to2: 'fields', // 2 zone
        turn3: 'hp', // più PV
      },
      initialFC: 12,
      minPlayerCards: 3, // Avatar + 2 agenti
      enemyCards: 3, // agenti Lega 2
      defeatDamage: 'sumEnemyLeagues', // somma Leghe carte nemiche
      themes: 'piccoli_quotidiani',
    },
    playerHP: 30,
  },
  2: {
    name: 'Prima Conquista',
    narrative: 'L\'Avatar guida un\'armata, conquista città fino alla capitale della prima armata scelta.',
    totalNodes: 17,
    duels: 7,
    eliteBosses: 2,
    events: 8, // di cui 3 con duello
    finalBoss: { name: 'Capitale', league: 4 },
    branches: 3, // 3 armate rimanenti
    availableArmies: 'firstChosen', // solo prima armata scelta
    maxDeckSize: 10,
    combat: {
      battlefields: 5,
      victoryCondition: {
        turns1to4: 'fields', // 3 campi
        turn5plus: 'hp', // più PV
      },
      initialFC: 18,
      maxPlayerCards: 10,
      enemyCards: '3-5', // scala con difficoltà
      themes: 'guerra_assedio',
    },
    playerHP: 30,
  },
  3: {
    name: 'Seconda Conquista',
    narrative: 'L\'Avatar attacca la seconda armata scelta.',
    totalNodes: 17,
    duels: 7,
    eliteBosses: 2,
    events: 8, // di cui 3 con duello
    finalBoss: { name: 'Capitale', league: 5 },
    availableArmies: 'secondChosen', // solo seconda armata scelta
    maxDeckSize: 10,
    combat: {
      battlefields: 5,
      victoryCondition: {
        turns1to4: 'fields',
        turn5plus: 'hp',
      },
      initialFC: 18,
      maxPlayerCards: 10,
      enemyCards: '3-5',
      themes: 'guerra_assedio',
    },
    playerHP: 30,
  },
  4: {
    name: 'Difesa',
    narrative: 'Dopo due conquiste, le due armate rimanenti dichiarano guerra. L\'Avatar difende la capitale conquistata.',
    playerHP: 50,
    initialFC: 18,
    siegeZones: 5, // iniziano conquistate
    defeatCondition: ['hp0', 'zones0'], // 0 PV oppure 0 zone d'assedio
    duels: '6-7',
    events: '3-4',
    attackers: '2ArmateRimaste', // 2 armate rimanenti + armate casuali (escluse le 4 iniziali)
    finalBoss: { name: 'Avatar Nemico', league: 6 },
    postBattleDamage: {
      victory: 'sumEnemyLeagues/2', // arrotondato per difetto
      defeat: 'sumEnemyLeagues',
    },
  },
};

/**
 * Zone d'Assedio (Zona 4)
 */
export const SIEGE_ZONES = [
  {
    id: 'mura_esterne',
    name: 'Mura Esterne',
    bonusWhenConquered: { effect: 'power', value: 1, target: 'all' }, // +1 POT a tutte le carte
    malusWhenLost: { effect: 'power', value: -1, target: 'all' }, // -1 POT a tutte le carte
  },
  {
    id: 'bastione',
    name: 'Bastione',
    bonusWhenConquered: { effect: 'enemyDamage', value: -2, minDamage: 1 }, // -2 DAN nemico (min 1)
    malusWhenLost: { effect: 'enemyDamage', value: 1, target: 'all' }, // +1 DAN a tutte le carte nemiche
  },
  {
    id: 'armeria',
    name: 'Armeria',
    bonusWhenConquered: { effect: 'damage', value: 1, target: 'all' }, // +1 DAN a tutte le carte
    malusWhenLost: { effect: 'damage', value: -1, target: 'all' }, // -1 DAN a tutte le carte
  },
  {
    id: 'riserve',
    name: 'Riserve',
    bonusWhenConquered: { effect: 'focusMax', value: 2 }, // +2 FC Max
    malusWhenLost: { effect: 'focusMax', value: -2 }, // -2 FC Max
  },
  {
    id: 'piazza_centrale',
    name: 'Piazza Centrale',
    bonusWhenConquered: { effect: 'immuneToAvatar', value: true }, // Immune all'Avatar
    malusWhenLost: { effect: 'avatarPowersDisabled', value: true }, // Poteri dell'Avatar disattivati
  },
];

/**
 * Stati Zone d'Assedio
 */
export const SIEGE_ZONE_STATES = {
  conquered: 'conquered', // Inizio / 2 vittorie di fila da neutrale
  neutral: 'neutral', // 1 vittoria da persa
  lost: 'lost', // 1 sconfitta da conquistata o neutrale
};
