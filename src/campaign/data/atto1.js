// ============================================
// ATTO I — "La Frattura dell'Orizzonte"
// Dati dichiarativi della campagna (SCHEMA_DATI_CAMPAGNA.md).
// Validare con: node tools/validate-campagna.mjs src/campaign/data/atto1.js --cards src/data/cards.js
//
// NOTA CONTENUTI: nomi, testi e mazzi nemici sono una prima stesura
// coerente col lore esistente (cards.js / armyLore) — da rifinire in editing.
//
// §req-or — RISOLTO: la disponibilità dei nodi è guidata da `unlocks`
//   (un nodo diventa disponibile quando UN QUALSIASI nodo completato lo
//   elenca in `unlocks`). `requires` documenta la provenienza e serve al
//   validatore per l'analisi del grafo. La Roccaforte si apre quindi con
//   una qualsiasi delle tre Enclave.
// §ann — RISOLTO: `life` delle missioni Annientamento tarata sul danno
//   massimo teorico calcolato dal validatore.
// ============================================

export const ACT = {
  id: 'atto1',
  title: "La Frattura dell'Orizzonte — Atto I",
  dayLimit: 14,
  maxActiveFaglie: 2,
  playerArmy: "Figli dell'Orizzonte",

  // ---- NODI -------------------------------------------------------------
  nodes: [
    { id: 'n_prologo', type: 'prologo', title: 'Il Richiamo',
      day: null,
      requires: [], unlocks: ['n_enclave_a', 'n_enclave_b', 'n_enclave_c'] },

    // Le tre Enclave: raggiungibili in parallelo, ognuna sblocca la Roccaforte
    { id: 'n_enclave_a', type: 'spina', title: 'Enclave delle Ceneri',
      day: null,
      requires: ['n_prologo'], unlocks: ['n_roccaforte'] },
    { id: 'n_enclave_b', type: 'spina', title: "Bastione dell'Aurora",
      day: null,
      requires: ['n_prologo'], unlocks: ['n_roccaforte'] },
    { id: 'n_enclave_c', type: 'spina', title: 'Il Velo di Cristallo',
      day: null,
      requires: ['n_prologo'], unlocks: ['n_roccaforte'] },

    { id: 'n_roccaforte', type: 'spina', title: 'La Roccaforte',
      day: null,
      requires: ['n_enclave_a', 'n_enclave_b', 'n_enclave_c'], // vedi §req-or: basta UNA
      unlocks: ['n_faro'] },
    { id: 'n_faro', type: 'boss', title: 'Il Faro',
      day: null,
      requires: ['n_roccaforte'], unlocks: [] },

    // Nodi Faglia: aperti dinamicamente dal ciclo del giorno,
    // non raggiungibili dal grafo fisso
    { id: 'n_faglia_1', type: 'faglia', title: 'Faglia instabile',
      day: null, requires: [], unlocks: [] },
    { id: 'n_faglia_2', type: 'faglia', title: 'Faglia instabile',
      day: null, requires: [], unlocks: [] }
  ],

  // ---- MISSIONI ---------------------------------------------------------
  // enemy.life: obbligatorio per objective 'annientamento' (default 25 altrove)
  // fields: deve essere <= taglia del mazzo più piccolo (e dispari)
  missions: [
    { id: 'A1-00', node: 'n_prologo', objective: 'dominazione', fields: 3,
      title: 'Il Richiamo',
      briefing: "Echi dei Figli, richiamati dalla Nebula, sbarrano la strada. Non sono nemici: sono ciò che resta di chi non ha retto la Fusione. Attraversali, e ricorda i loro volti.",
      enemy: { army: "Figli dell'Orizzonte", deck: [107, 110, 108], life: 25 },
      playerDeckSize: 3 },

    { id: 'A1-02', node: 'n_enclave_a', objective: 'dominazione', fields: 3,
      title: 'Enclave delle Ceneri',
      briefing: "I Ratti della Megera hanno infestato l'enclave. Le loro maledizioni consumano ciò che i Figli hanno costruito. Riprendi il controllo dei campi.",
      enemy: { army: 'Ratti della Megera', deck: [806, 808, 810, 804], life: 25 },
      playerDeckSize: 4,
      rewards: { warehouseCards: [106] } },

    { id: 'A1-03', node: 'n_enclave_b', objective: 'annientamento', fields: 3,
      title: "Bastione dell'Aurora",
      briefing: "L'Enclave delle Scaglie ha piantato una covata nel bastione. Non basta dominare il territorio: finché una scaglia respira, torneranno. Annientali.",
      enemy: { army: "L'Enclave delle Scaglie", deck: [710, 717, 704, 715], life: 8 }, // life tarata (§ann)
      playerDeckSize: 4,
      rewards: { warehouseCards: [114] } },

    { id: 'A1-04', node: 'n_enclave_c', objective: 'dominazione', fields: 3,
      title: 'Il Velo di Cristallo',
      briefing: "Emissari della Corte Rossa offrono contratti ai Figli dispersi. Ogni firma è un'anima persa. Spezza il negoziato sul campo.",
      enemy: { army: 'Corte Rossa', deck: [308, 309, 310, 315], life: 25 },
      playerDeckSize: 4,
      rewards: { warehouseCards: [118] } },

    { id: 'A1-05', node: 'n_roccaforte', objective: 'dominazione', fields: 5,
      title: 'La Roccaforte',
      briefing: "L'avanguardia Kethran si è trincerata nella roccaforte che domina la via del Faro. È il primo vero esercito che affronti: cinque campi, nessuna scorciatoia.",
      enemy: { army: 'Kethran', deck: [206, 207, 208, 209, 210], life: 25 },
      playerDeckSize: 5,
      rewards: { warehouseCards: [117] } },

    { id: 'A1-08', node: 'n_faro', objective: 'dominazione', fields: 5,
      title: 'Il Faro',
      briefing: "Il Vicario Berakol in persona custodisce il Faro. Ogni frammento che perdi lo rende più forte: leggi la sua regola prima di entrare.",
      enemy: { army: 'Kethran', deck: [230, 226, 219, 206, 210], life: 25 },
      playerDeckSize: 5,
      boss: { signatureCardId: 230, signatureRevealed: true, phaseShiftAfterFieldsLost: 2 } }
  ],

  // ---- EVENTI -----------------------------------------------------------
  // Vincolo validatore: la crescita del Nascente è simulata cumulando TUTTE
  // le scelte; il totale non deve superare la soglia L3 (4.35) del cap d'Atto.
  events: [
    // Impronta: acquisizione della coppia trigger+effetto (matrice 4×4)
    { id: 'EV_impronta',
      trigger: { type: 'afterMission', mission: 'A1-00' }, window: null,
      title: "L'Impronta",
      body: "Il Nascente ti fissa. Nella Nebula qualcosa ha lasciato un segno su di lui — ma la forma del segno la scegli tu, adesso. Non potrai tornare indietro senza pagare.",
      choices: [
        { label: "L'istinto del primo colpo",
          description: 'Nei primi scambi il Nascente brucia più forte.',
          effect: { nascente: { acquire: { trigger: 'turbo', effect: 'power', value: 1 } } } },
        { label: "L'arte dell'agguato",
          description: 'Quando colpisce per primo, lascia una ferita che resta.',
          effect: { nascente: { acquire: { trigger: 'imboscata', effect: 'directDamage', value: 1 } } } },
        { label: 'La memoria del torto',
          description: 'Quando viene colpito, la Nebula gli restituisce Focus.',
          effect: { nascente: { acquire: { trigger: 'vendetta', effect: 'focusCoin', value: 1 } } } }
      ] },

    // Potenziamento effetto (+1 al valore)
    { id: 'EV_potenziamento_1',
      trigger: { type: 'afterMission', mission: 'A1-02' }, window: null,
      title: 'Le Ceneri Parlano',
      body: 'Tra le rovine dell\'enclave, un frammento della Nebula pulsa ancora. Il Nascente lo guarda come si guarda uno specchio.',
      choices: [
        { label: 'Lascia che lo assorba',
          description: "L'Impronta si rafforza (+1 al valore del potere).",
          effect: { nascente: { upgrade: 1 } } },
        { label: 'Disperdilo al vento',
          description: 'Il frammento si spegne. Qualcuno, un giorno, ti ringrazierà.',
          effect: { flags: { rifiutato_potenziamento_1: true } } }
      ] },

    // Stabilizzazione: crescita del corpo (validatore: somma cumulata contenuta)
    { id: 'EV_stabilizzazione',
      trigger: { type: 'afterMission', mission: 'A1-05' }, window: [6, 9],
      title: 'La Stabilizzazione',
      body: 'Dopo la Roccaforte, il corpo del Nascente smette di tremare. La forma che prende ora è quella che porterà al Faro.',
      choices: [
        { label: 'Slancio',
          description: 'Il corpo si fa più imponente (+1 POT).',
          effect: { nascente: { stats: { power: 1, damage: 0 } } } },
        { label: 'Punizione',
          description: 'I colpi lasciano il segno (+1 DAN).',
          effect: { nascente: { stats: { power: 0, damage: 1 } } } },
        { label: 'Contenimento',
          description: 'Nessuna crescita: il Nascente resta leggero, e tu conservi le scorte.',
          effect: { flags: { nascente_contenuto: true }, warehouseCards: [113] } }
      ] },

    // Evento narrativo a giorno fisso: il fronte reagisce
    { id: 'EV_contrattacco_avviso',
      trigger: { type: 'day', day: 8 }, window: [8, 12],
      title: 'Voci dal Fronte',
      body: 'Le vedette riferiscono movimenti Kethran oltre il crinale. Qualcosa si sta preparando; le Faglie si allargano dove nessuno le presidia.',
      choices: [
        { label: 'Rafforza le vedette',
          description: 'Saprai in anticipo dove si aprirà la prossima Faglia.',
          effect: { flags: { vedette_rafforzate: true } } },
        { label: 'Ignora le voci',
          description: 'I giorni sono pochi e il Faro è lontano. Avanti.',
          effect: { flags: { voci_ignorate: true } } }
      ] }
  ],

  // ---- NASCENTE ---------------------------------------------------------
  nascente: {
    reservedId: 9001,
    startStats: { power: 2, damage: 2 },
    startLeague: 2,
    leagueCap: 3            // cap dell'Atto I: il Nascente non supera L3 qui
  },

  // ---- COMPAGNI DISPONIBILI (L2 Figli, verificati in cards.js) -----------
  companions: [107, 108, 109, 110, 115, 120],

  // ---- FAGLIE (configurazione dinamica: il validatore la ignora) ---------
  faglie: {
    // giorni in cui il ciclo prova ad aprire una nuova Faglia
    spawnDays: [3, 6, 9, 12],
    // giorni di vita prima del collasso (conseguenze su chi la ignora)
    durationDays: 3,
    // template delle missioni generate sui nodi faglia
    missionTemplates: [
      { army: 'Ratti della Megera', objective: 'dominazione', fields: 3,
        deck: [807, 806, 809], life: 25,
        title: 'Faglia: brulichio nel buio',
        briefing: 'Dalla Faglia filtrano cose che strisciano. Chiudila prima che il brulichio diventi marea.' },
      { army: 'Kethran', objective: 'dominazione', fields: 3,
        deck: [207, 209, 221], life: 25,
        title: 'Faglia: eco della Spira',
        briefing: 'Frammenti Kethran usano la Faglia come varco. Ricacciali nel buio da cui risalgono.' }
    ],
    // penalità al collasso di una Faglia ignorata
    collapse: { warehouseCardLoss: 1 }
  },

  // ---- POSIZIONI MAPPA -----------------------------------------------------
  // Coordinate normalizzate {id, x, y} per CampaignMapShell (mai hardcodate
  // nel markup — vedi INTEGRAZIONE.md §4 del pacchetto componenti).
  mapPositions: [
    { id: 'n_prologo', x: 0.10, y: 0.50 },
    { id: 'n_enclave_a', x: 0.30, y: 0.20 },
    { id: 'n_enclave_b', x: 0.34, y: 0.52 },
    { id: 'n_enclave_c', x: 0.30, y: 0.82 },
    { id: 'n_roccaforte', x: 0.60, y: 0.50 },
    { id: 'n_faro', x: 0.87, y: 0.50 },
    { id: 'n_faglia_1', x: 0.52, y: 0.16 },
    { id: 'n_faglia_2', x: 0.55, y: 0.85 },
  ],

  // ---- CONTRATTACCHI PROGRAMMATI ------------------------------------------
  // Al giorno indicato il nemico riprende una delle enclave conquistate:
  // il nodo torna 'available' e va riconquistato. Le sconfitte e l'attesa
  // hanno conseguenze, non game over.
  contrattacchi: [
    { day: 10, targets: ['n_enclave_a', 'n_enclave_b', 'n_enclave_c'] }
  ]
};
