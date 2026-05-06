// ============================================
// EVENTI NARRATIVI ROGUELIKE
// ============================================

/**
 * Categorie eventi e probabilità
 */
export const EVENT_CATEGORIES = {
  curse: { name: 'Maledizione', probability: 0.05, count: 5, color: 'red' },
  omen: { name: 'Presagio', probability: 0.15, count: 10, color: 'orange' },
  neutral: { name: 'Neutrale', probability: 0.50, count: 20, color: 'blue' },
  generous: { name: 'Generoso', probability: 0.25, count: 15, color: 'green' },
  enlightening: { name: 'Illuminante', probability: 0.05, count: 5, color: 'purple' },
};

/**
 * Eventi Maledizioni (molto negativi)
 */
export const CURSE_EVENTS = [
  {
    id: 'M01',
    name: 'Il Prezzo del Sangue',
    category: 'curse',
    zones: 'all',
    text: 'Un mendicante cieco ti blocca il cammino. "Ho visto il tuo futuro," gracchia. "Pagherai per ogni vittoria con la tua stessa carne." Prima che tu possa rispondere, svanisce. Le sue parole ti perseguitano.',
    effect: { type: 'permanent', description: 'Per il resto della run, ogni vittoria ti costa 1 PV.' },
    choices: null, // Nessuna scelta, effetto automatico
  },
  {
    id: 'M02',
    name: 'La Maledizione del Traditore',
    category: 'curse',
    zones: 'all',
    text: 'Tra le rovine trovi il corpo di un comandante, pugnalato alle spalle dai suoi stessi uomini. Mentre lo superi, senti un sussurro gelido: "Anche i tuoi ti abbandoneranno."',
    effect: { type: 'loseAgent', description: "Perdi l'agente con Lega più alta dal tuo esercito. Se hai solo l'Avatar, -2 POT permanente all'Avatar." },
    choices: null,
  },
  {
    id: 'M03',
    name: 'L\'Ombra Famelica',
    category: 'curse',
    zones: [2, 3, 4],
    text: 'Una creatura d\'ombra ti segue da giorni. Non attacca mai, ma ogni notte la senti nutrirsi... di qualcosa. Al mattino ti svegli sempre più debole.',
    effect: { type: 'permanentStats', power: -1, damage: -1, description: '-1 POT e -1 DAN permanenti all\'Avatar.' },
    choices: null,
  },
  {
    id: 'M04',
    name: 'Il Patto Infranto',
    category: 'curse',
    zones: [2, 3, 4],
    text: 'Un demone appare nei tuoi sogni. "Avevi promesso," sibila. "Ora pagherai." Ti svegli urlando. Il marchio sulla tua mano brucia.',
    effect: { type: 'artifact', artifactId: 'marchio_debole', description: 'Ottieni l\'artefatto "Marchio del Debole" (-1 POT a tutte le carte).' },
    choices: null,
  },
  {
    id: 'M05',
    name: 'La Fonte Avvelenata',
    category: 'curse',
    zones: [1, 2],
    text: 'Assetato, bevi da una fonte nascosta. L\'acqua ha un sapore strano. Troppo tardi ti accorgi dei cadaveri di animali nascosti tra i cespugli.',
    effect: { type: 'temporary', hp: -5, focusMax: -2, duration: 3, description: '-5 PV e -2 FC Max per i prossimi 3 scontri.' },
    choices: null,
  },
];

/**
 * Eventi Presagi (negativi)
 */
export const OMEN_EVENTS = [
  {
    id: 'P01',
    name: 'Il Mercante Disperato',
    category: 'omen',
    zones: 'all',
    text: 'Un mercante ti implora di comprare la sua merce. "È tutto ciò che ho!" I suoi occhi sono troppo lucidi, il suo sorriso troppo largo. Qualcosa non va.',
    choices: [
      { text: 'Compra qualcosa', effect: { type: 'loseFocusMax', value: 3, gain: { type: 'agent', league: 2 } } },
      { text: 'Rifiuta e vai via', effect: { type: 'permanentStats', damage: -1, target: 'avatar' } },
    ],
  },
  {
    id: 'P02',
    name: 'La Strada Pericolosa',
    category: 'omen',
    zones: 'all',
    text: 'Due strade si aprono davanti a te. Una attraversa una palude fetida, l\'altra costeggia un precipizio. Nessuna sembra sicura.',
    choices: [
      { text: 'La palude', effect: { type: 'hp', value: -3, gain: { type: 'artifact', category: 'neutral' } } },
      { text: 'Il precipizio', effect: { type: 'loseAgent', lowest: true, gain: { type: 'focusMax', value: 2 } } },
    ],
  },
  {
    id: 'P03',
    name: 'Il Villaggio Silenzioso',
    category: 'omen',
    zones: [1],
    text: 'Entri in un villaggio deserto. Il cibo è ancora caldo nelle case, ma non c\'è anima viva. Poi senti un rumore dal pozzo...',
    choices: [
      { text: 'Investiga il pozzo', effect: { type: 'duel', enemyLeague: 3, onVictory: { type: 'agents', count: 2, league: 2 } } },
      { text: 'Fuggi immediatamente', effect: { type: 'hp', value: -2 } },
    ],
  },
  {
    id: 'P04',
    name: 'Il Compagno Ferito',
    category: 'omen',
    zones: [2, 3],
    text: 'Uno dei tuoi agenti è gravemente ferito. Il guaritore scuote la testa: "Posso salvarlo, ma ci vorrà tempo. O posso... alleviare le sue sofferenze."',
    choices: [
      { text: 'Salvalo', effect: { type: 'agentPermanentStats', power: -1 } },
      { text: 'Lascialo andare', effect: { type: 'loseAgent', gain: { type: 'permanentStats', damage: 1, target: 'avatar' } } },
    ],
  },
  {
    id: 'P05',
    name: 'La Tempesta Innaturale',
    category: 'omen',
    zones: [2, 3, 4],
    text: 'Il cielo si oscura. Fulmini viola squarciano le nubi. Questa non è una tempesta normale.',
    effect: { type: 'temporary', power: -2, target: 'all', duration: 1, description: 'Prossimo scontro: -2 POT a tutte le tue carte.' },
    choices: null,
  },
  {
    id: 'P06',
    name: 'Il Messaggero Nero',
    category: 'omen',
    zones: [2, 3],
    text: 'Un corvo ti porta un messaggio: "Sappiamo dove sei. Stiamo arrivando." Il sigillo è di un\'armata nemica.',
    effect: { type: 'temporary', enemyPower: 1, duration: 2, description: 'Prossimi 2 scontri: i nemici hanno +1 POT.' },
    choices: null,
  },
  {
    id: 'P07',
    name: 'L\'Offerta Sospetta',
    category: 'omen',
    zones: 'all',
    text: 'Uno straniero incappucciato ti offre una fiala luminosa. "Ti renderà più forte," promette. Ma il suo sorriso è inquietante.',
    choices: [
      { text: 'Bevi la fiala', effect: { type: 'random', options: [
        { probability: 0.5, effect: { type: 'permanentStats', power: 2, target: 'avatar' } },
        { probability: 0.5, effect: { type: 'permanentStats', power: -2, target: 'avatar' } },
      ] } },
      { text: 'Rifiuta', effect: null },
    ],
  },
  {
    id: 'P08',
    name: 'Il Tributo',
    category: 'omen',
    zones: [2, 3, 4],
    text: 'Gli abitanti del villaggio conquistato si inchinano. "Prendetevi ciò che volete, ma risparmiateci." Ti offrono tutto ciò che hanno.',
    choices: [
      { text: 'Accetta il tributo', effect: { type: 'focusMax', value: 3, lose: { type: 'agent', random: true } } },
      { text: 'Rifiuta con onore', effect: { type: 'nextEventBonus', category: 'generous' } },
    ],
  },
  {
    id: 'P09',
    name: 'L\'Eco della Sconfitta',
    category: 'omen',
    zones: [3, 4],
    text: 'Nei tuoi sogni rivivi ogni battaglia persa. Ogni errore. Ogni morte. Ti svegli esausto, dubitando di te stesso.',
    effect: { type: 'temporary', power: -1, target: 'avatar', duration: 2, description: '-1 POT all\'Avatar per i prossimi 2 scontri.' },
    choices: null,
  },
  {
    id: 'P10',
    name: 'Il Prezzo della Vittoria',
    category: 'omen',
    zones: [4],
    text: 'Le mura della città mostrano i segni dell\'assedio. Un anziano ti fissa con odio: "Hai vinto, ma a che prezzo? Guarda cosa hai fatto."',
    effect: { type: 'loseSiegeZone', description: 'Perdi 1 Zona d\'Assedio a tua scelta.' },
    choices: null,
  },
];

/**
 * Eventi Neutrali (standard)
 * Implemento i primi 10 come esempio, gli altri seguiranno lo stesso pattern
 */
export const NEUTRAL_EVENTS = [
  {
    id: 'N01',
    name: 'Il Bivio del Mercante',
    category: 'neutral',
    zones: 'all',
    text: 'Un mercante itinerante ha allestito il suo banchetto. "Compro e vendo di tutto," annuncia. "Ma non faccio credito."',
    choices: [
      { text: 'Compra un agente', effect: { type: 'loseFocusMax', value: 2, gain: { type: 'agentChoice', count: 3 } } },
      { text: 'Vendi un agente', effect: { type: 'loseAgent', choice: true, gain: { type: 'focusMax', value: 3 } } },
      { text: 'Vai via', effect: null },
    ],
  },
  {
    id: 'N02',
    name: 'L\'Arena Clandestina',
    category: 'neutral',
    zones: [1, 2],
    text: 'In una taverna scopri un\'arena segreta. "Vuoi combattere?" chiede l\'organizzatore. "Se vinci, il premio è sostanzioso."',
    choices: [
      { text: 'Combatti', effect: { type: 'duel', enemyLeague: 'zone+1', onVictory: { type: 'agents', count: 2 }, onDefeat: { type: 'hp', value: -3 } } },
      { text: 'Scommetti', effect: { type: 'gamble', lose: 2, win: 5, probability: 0.6 } },
      { text: 'Declina', effect: null },
    ],
  },
  {
    id: 'N03',
    name: 'Il Santuario Abbandonato',
    category: 'neutral',
    zones: 'all',
    text: 'Tra le rovine trovi un santuario a una divinità dimenticata. L\'altare è ancora intatto. Forse una preghiera...',
    choices: [
      { text: 'Prega per forza', effect: { type: 'permanentStats', power: 1, target: 'avatar', lose: { type: 'hp', value: 2 } } },
      { text: 'Prega per resistenza', effect: { type: 'hp', value: 3, lose: { type: 'temporary', damage: -1, target: 'avatar', duration: 2 } } },
      { text: 'Non disturbare gli dei', effect: null },
    ],
  },
  // Aggiungo altri eventi neutrali come placeholder
  {
    id: 'N04',
    name: 'Il Disertore',
    category: 'neutral',
    zones: [2, 3],
    text: 'Un soldato nemico si arrende. "Sono stanco di combattere per loro. Prendimi con te." Sembra sincero, ma potrebbe essere una spia.',
    choices: [
      { text: 'Accettalo', effect: { type: 'agent', league: 3, risk: { type: 'betrayal', probability: 0.2, effect: { type: 'temporary', power: -3, duration: 1 } } } },
      { text: 'Rifiuta', effect: null },
      { text: 'Interrogalo', effect: { type: 'focusBonus', value: 2, duration: 1 } },
    ],
  },
  {
    id: 'N05',
    name: 'La Forgia Antica',
    category: 'neutral',
    zones: [2, 3],
    text: 'Trovi una forgia ancora funzionante. Il fabbro fantasma ti osserva: "Posso migliorare le tue armi, ma il fuoco richiede sacrificio."',
    choices: [
      { text: 'Migliora l\'Avatar', effect: { type: 'permanentStats', damage: 1, target: 'avatar', lose: { type: 'agent', random: true } } },
      { text: 'Migliora un agente', effect: { type: 'agentPermanentStats', power: 1, damage: 1, choice: true } },
      { text: 'Vai via', effect: null },
    ],
  },
  // Placeholder per altri eventi neutrali (N06-N20)
  // Per ora implemento solo i primi 5 come esempio completo
];

/**
 * Eventi Generosi (positivi)
 */
export const GENEROUS_EVENTS = [
  {
    id: 'G01',
    name: 'Il Tesoro Nascosto',
    category: 'generous',
    zones: 'all',
    text: 'Trovi una cassa nascosta tra le rovine. Dentro ci sono monete d\'oro e un\'arma antica.',
    choices: [
      { text: 'Prendi le monete', effect: { type: 'focusMax', value: 3 } },
      { text: 'Prendi l\'arma', effect: { type: 'permanentStats', damage: 1, target: 'avatar' } },
    ],
  },
  // Placeholder per altri eventi generosi
];

/**
 * Eventi Illuminanti (molto positivi)
 */
export const ENLIGHTENING_EVENTS = [
  {
    id: 'E01',
    name: 'La Visione',
    category: 'enlightening',
    zones: 'all',
    text: 'Una luce divina ti avvolge. Vedi il futuro: ogni scelta, ogni battaglia. Per un istante, tutto è chiaro.',
    effect: { type: 'permanentStats', power: 2, damage: 2, target: 'avatar', description: '+2 POT e +2 DAN permanenti all\'Avatar.' },
    choices: null,
  },
  // Placeholder per altri eventi illuminanti
];

/**
 * Tutti gli eventi combinati
 */
export const ALL_EVENTS = [
  ...CURSE_EVENTS,
  ...OMEN_EVENTS,
  ...NEUTRAL_EVENTS,
  ...GENEROUS_EVENTS,
  ...ENLIGHTENING_EVENTS,
];

/**
 * Seleziona un evento casuale in base alla zona
 */
export function selectRandomEvent(zoneNumber, excludeCategories = []) {
  const availableEvents = ALL_EVENTS.filter(event => {
    // Controlla se l'evento è disponibile per questa zona
    if (event.zones !== 'all' && !event.zones.includes(zoneNumber)) {
      return false;
    }
    // Escludi categorie specificate
    if (excludeCategories.includes(event.category)) {
      return false;
    }
    return true;
  });
  
  if (availableEvents.length === 0) {
    // Fallback a evento neutrale generico
    return NEUTRAL_EVENTS[0];
  }
  
  // Selezione pesata per categoria
  const categoryWeights = EVENT_CATEGORIES;
  const weightedEvents = [];
  
  availableEvents.forEach(event => {
    const category = categoryWeights[event.category];
    const weight = Math.floor(category.probability * 100);
    for (let i = 0; i < weight; i++) {
      weightedEvents.push(event);
    }
  });
  
  return weightedEvents[Math.floor(Math.random() * weightedEvents.length)] || availableEvents[0];
}
