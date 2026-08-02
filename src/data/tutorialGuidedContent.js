export const INTRO_STAGE_PLAY = 9;
export const INTRO_STAGE_EPILOGUE = 90;
export const INTRO_STAGE_FREE_PLAY_FINAL = 91;

export const ADV_STAGE_GOAL = 0;
export const ADV_STAGE_TRIGGERS = 1;
export const ADV_STAGE_EPILOGUE = 90;

export const GUIDED_DECKS = {
  intro: {
    player: { army: 'Calibri Pesanti', deckKey: 'A', name: 'La Linea Infrangibile' },
    enemy: { army: 'Kethran', deckKey: 'B', name: 'Processione dei Caduti' },
  },
  advanced: {
    player: { army: 'Calibri Pesanti', deckKey: 'B', name: 'Batteria di Saturazione' },
    enemy: { army: 'Kethran', deckKey: 'C', name: 'La Legge dei Frammenti' },
  },
};

/** Cinque carte pescate dai mazzi sopra — tutte presenti nel deck da 10 carte. */
export const GUIDED_HANDS = {
  intro: {
    player: [401, 408, 406, 402, 403],
    enemy: [208, 205, 207, 204, 210],
  },
  advanced: {
    player: [401, 408, 406, 402, 403],
    enemy: [205, 208, 207, 211, 204],
  },
};

export const GUIDED_INTRO_ROUNDS = [
  {
    round: 1,
    fieldIndex: 0,
    playerAgentId: 401,
    focus: 3,
    enemyAgentId: 208,
    enemyFocus: 2,
    focusPolicy: 'exact',
    lesson: {
      selectAgentTitle: 'Round 1: POT, FC e VA',
      selectAgentExtra: 'Primo duello: leggi trigger ed effetti sulle carte prima di confermare.',
      triggerNote:
        'Titano: Immune sempre attivo. Costruttore nemico: Resistenza (+1 POT) solo se tu hai 1+ campi — round 1, non scatta.',
      showVaFormula: true,
      duelBattleLines: [
        'Le basi: POT e DAN sulle carte, poi VA = POT × FC. Segui ogni fase con calma.',
      ],
      duelExtra: [
        'Il tuo VA base è {playerVa} ({playerPower} POT × {playerFc} FC); quello nemico è {enemyVa} ({enemyPower} POT × {enemyFc} FC).',
        'Chi ha VA più alto vince e infligge il DAN del vincitore al perdente.',
      ],
    },
  },
  {
    round: 2,
    fieldIndex: 1,
    playerAgentId: 408,
    focus: 2,
    enemyAgentId: 205,
    enemyFocus: 3,
    focusPolicy: 'exact',
    lesson: {
      selectAgentTitle: 'Round 2: economia FC',
      selectAgentExtra:
        'Il nemico investe 3 FC: per vincere dovresti spenderne troppi. Obiettivo: cedere il campo spendendo solo 2 FC.',
      triggerNote:
        'Nel duello ti guiderò nella sequenza degli effetti, fase per fase. Qui basta sapere: Operaio riduce DAN nemico (sempre attivo).',
      showVaFormula: false,
      duelBattleLines: [
        'Focus di questo duello: la SEQUENZA. Ogni fase applica un passaggio, nello stesso ordine che vedi al centro.',
      ],
      duelPhases: [
        {
          title: 'Sequenza 1/6 — Schieramento',
          lines: ['Passo 1: le carte entrano in campo. POT e DAN sono visibili, ma il confronto non è ancora iniziato.'],
        },
        {
          title: 'Sequenza 2/6 — Poteri e bonus',
          lines: [
            'Passo 2: si risolvono gli effetti PRE-duello, in ordine di iniziativa.',
            'Operaio Meccanico: -2 DAN nemico (sempre attivo, nessun trigger). Sacerdote: Sfida non scatta — la sua Lega 3 non è inferiore alla tua 2.',
          ],
        },
        {
          title: 'Sequenza 3/6 — Focus Coin',
          lines: [
            'Passo 3: le monete FC moltiplicano la POT → nasce il VA base sotto ogni carta.',
          ],
          showVaLine: true,
        },
        {
          title: 'Sequenza 4/6 — Modificatori VA',
          lines: [
            'Passo 4: eventuali bonus o malus finali al VA. Nessuna riga? I numeri del passo 3 restano quelli decisivi.',
          ],
          showClashLine: true,
        },
        {
          title: 'Sequenza 5/6 — Scontro',
          lines: [
            'Passo 5: confronto dei VA. Vince il valore più alto; a parità: Lega più bassa, poi POT più bassa, poi chi ha giocato per secondo.',
          ],
        },
        {
          title: 'Sequenza 6/6 — Conseguenze',
          lines: [
            'Passo 6: il perdente subisce DAN, il vincitore conquista il campo. La partita si misura anche in FC spesi, non solo in vittorie.',
          ],
          showOutcome: true,
        },
      ],
      resultTitle: 'Round 2: perdita controllata',
      resultCoreLines: [
        'Hai perso il duello e subito DAN, ma hai speso solo 2 FC.',
        'Cedere uno scontro con poco budget spesso conviene più che vincerlo svenandosi: la partita è sul totale.',
      ],
    },
  },
  {
    round: 3,
    fieldIndex: 2,
    playerAgentId: 406,
    focus: 4,
    enemyAgentId: 207,
    enemyFocus: 2,
    focusPolicy: 'exact',
    lesson: {
      selectAgentTitle: 'Round 3: trigger e conquista',
      selectAgentExtra:
        'Vincere qui ti porta a 2 campi conquistati: ne serve un terzo entro il turno 4 per chiudere la partita.',
      triggerNote:
        'Attenzione: il nemico ha Gloria (+2 POT) perché ha vinto il round 2. In fase 2 vedrai il suo POT salire prima del confronto VA.',
      showVaFormula: false,
      expectedVaNote:
        'VA base tuo {playerVa} ({playerPower}×{playerFc}). Nemico {enemyVa} ({enemyPower}×{enemyFc}) — ma Gloria può portarlo oltre prima dello scontro.',
      duelBattleLines: [
        'Nuova lezione: un trigger legato allo scontro PRECEDENTE modifica il nemico. Poi conta la corsa ai 3 campi.',
      ],
      duelPhases: [
        {
          title: 'Tabellone — Situazione',
          lines: [
            'Campi: 1-1. PV e FC residui sono pubblici: usali per decidere quanto investire.',
            'Conquista 3 campi entro il turno 4 = vittoria immediata.',
          ],
        },
        {
          title: 'Trigger Gloria (post-round 2)',
          lines: [
            'Gloria: +2 POT al Seguace perché ha vinto lo scontro precedente.',
            'I trigger possono dipendere da round passati, non solo da questo turno. Il POT nemico sale prima del calcolo VA.',
          ],
        },
        {
          title: 'FC e VA',
          lines: [
            'Con 4 FC il tuo VA deve superare quello nemico dopo Gloria. Conta POT aggiornata × FC.',
          ],
          showVaLine: true,
        },
        {
          title: 'Modificatori e confronto',
          lines: [
            'Ultimi aggiustamenti al VA, poi scontro diretto. Qui vincere significa secondo campo + DAN.',
          ],
          showClashLine: true,
        },
        {
          title: 'Scontro',
          lines: [
            'Vince il VA più alto. Se vinci, sei a un campo dalla vittoria territoriale.',
          ],
        },
        {
          title: 'Esito sul tabellone',
          lines: [
            'Aggiorna mentalmente: campi conquistati, PV e FC residui ({playerFcLeft} tu, {enemyFcLeft} nemico).',
          ],
          showOutcome: true,
        },
      ],
      resultTitle: 'Round 3: corsa alla conquista',
      resultCoreLines: [
        'Sei a 2 campi conquistati contro 1: te ne manca 1 per la vittoria territoriale.',
        'Hai speso {fcSpent} FC su 18 in 3 round — metà budget, metà partita. Questo ritmo conta per i round rimanenti.',
      ],
    },
  },
];

export const GUIDED_ADVANCED_ROUNDS = [
  {
    round: 1,
    fieldIndex: 0,
    playerAgentId: 408,
    enemyAgentId: 205,
    enemyFocus: 3,
    focusPolicy: 'range',
    focus: 1,
    focusMin: 1,
    focusMax: 2,
    lesson: {
      selectAgentExtra: 'Il nemico è più forte su questo campo. Quanto vale NON vincere qui? Investi il minimo (1–2 FC).',
      feedbackOk: 'Perdita controllata: cedi il campo ma conservi {fcSaved} FC per i round che contano.',
      feedbackOver: 'Con {focus} FC perdi comunque o vinci un campo che non ti serve: overcommit.',
      resultExtra: ['Hai subìto {dan} DAN, ma il differenziale FC ora è a tuo favore: {playerFc} contro {enemyFc}.'],
    },
  },
  {
    round: 2,
    fieldIndex: 1,
    playerAgentId: 406,
    enemyAgentId: 208,
    enemyFocus: 1,
    focusPolicy: 'range',
    focus: 2,
    focusMin: 2,
    focusMax: 3,
    lesson: {
      selectAgentExtra: 'Il nemico sta risparmiando. Vinci spendendo il giusto: quanto basta a superarlo, non un FC di più.',
      feedbackOk: 'Efficienza: campo conquistato a {focus} FC.',
      feedbackOver: 'Vinci lo stesso, ma ogni FC oltre la soglia è regalato.',
      resultExtra: ['VA per FC è la metrica: vincere 10-a-2 spendendo 5 FC vale meno che vincere 6-a-4 spendendone 2.'],
    },
  },
  {
    round: 3,
    fieldIndex: 2,
    playerAgentId: 402,
    enemyAgentId: 207,
    enemyFocus: 2,
    focusPolicy: 'exact',
    focus: 5,
    lesson: {
      selectAgentExtra: '"{player}" ha Overdrive: il potere scatta solo se investi 5+ FC. Le soglie trasformano i FC da carburante a interruttore.',
      triggerNote:
        'Overdrive (se spendi 5+ FC): con {focus} FC il trigger è soddisfatto — in fase 2 vedrai +2 POT oltre al VA base.',
      resultExtra: [
        'Hai pagato caro (5 FC) ma il potere ha aggiunto valore oltre il VA base: le soglie si pagano solo quando il payoff supera il costo.',
        'FC residui: {playerFc} tu, {enemyFc} il nemico. Tienili d\'occhio: sono informazione pubblica.',
      ],
    },
  },
  {
    round: 4,
    fieldIndex: 3,
    playerAgentId: 403,
    enemyAgentId: 211,
    enemyFocus: 6,
    focusPolicy: 'range',
    focus: 3,
    focusMin: 2,
    focusMax: 4,
    lesson: {
      selectAgentExtra: 'Guarda i FC residui del nemico e i round rimanenti: quanto PUÒ investire al massimo qui, sapendo che al round 5 gli serve almeno 1 FC? Questo limita il suo VA massimo possibile.',
      resultExtra: [
        'Il nemico ha investito pesante: al round 5 arriverà con {enemyFc} FC contro i tuoi {playerFc}.',
        'Contare i FC non ti dice cosa farà: ti dice cosa NON può fare. È il tetto del suo bluff.',
      ],
    },
  },
  {
    round: 5,
    fieldIndex: 4,
    playerAgentId: 401,
    enemyAgentId: 204,
    enemyFocusAllIn: true,
    focusPolicy: 'free',
    lesson: {
      selectAgentExtra: [
        'Ultimo round: i campi non contano più, vince chi chiude con più PV.',
        'Dati: PV {playerHp}-{enemyHp}, il DAN in palio, i FC residui di entrambi. Decidi tu: contesti il duello o minimizzi la perdita?',
      ],
    },
  },
];

export const GUIDED_COPY = {
  intro: {
    welcomeTitle: 'Benvenuto nella partita guidata',
    welcomeContinue: 'Premi OK per continuare.',
    openingParts: {
      beforeField: 'Questa è la ',
      fieldLabel: 'plancia di gioco',
      between: ': qui scegli il ',
      duelLabel: 'campo',
      end: ' e segui ogni duello fino alle conseguenze.',
    },
    handsTitle: 'Le mani in partita',
    handsLines: [
      'In alto e in basso vedi le carte in mano: sono sempre visibili a entrambi i giocatori.',
      'Ogni esercito ha 10 agenti; a inizio partita ne peschi 5 e userai solo quelli.',
      'Leggi POT, DAN e poteri prima di schierare: le informazioni pubbliche sono parte della strategia.',
      'Premi OK per continuare.',
    ],
    drawTitle: 'Pesca iniziale',
    drawInfo: 'Le cinque carte in mano sono il tuo pool per tutta la partita. Pianifica gli FC su più round, non solo sul duello corrente.',
    clickCardPrefix: 'Clicca',
    previewTitle: 'Anteprima carta',
    previewLine: 'Il pannello laterale mostra POT, DAN, Lega e potere dell\'agente — tuoi o nemici.',
    previewContinue: 'Premi OK per continuare.',
    glossaryPromptTitle: 'Glossario',
    glossaryPromptLine: 'Clicca il pulsante Glossario in alto per aprire i termini di gioco.',
    glossaryOpenTitle: 'Glossario aperto',
    glossaryOpenLine: 'Nel glossario trovi VA, FC, DAN e ogni trigger: la condizione che decide se un potere si attiva in quello scontro.',
    glossaryCloseHint: 'Chiudilo per proseguire: potrai riaprirlo quando vuoi.',
    battlefieldsTitle: 'Campi di battaglia',
    battlefieldsLines: [
      'Ogni round si combatte su un solo campo: chi ha iniziativa lo sceglie tra quelli ancora liberi.',
      'All\'inizio sono visibili 3 campi; gli altri 2 si svelano man mano.',
      'Alcuni campi modificano FC, VA o PV — leggi sempre l\'effetto prima di confermare.',
      'Inizia chi ha la somma Lega più bassa tra le carte in mano (Lega 2–5 su ogni agente).',
    ],
    victoryTitle: 'Obiettivi di vittoria',
    victoryLines: [
      'Turni 1–4: conquista 3 campi per vincere subito.',
      'Turno 5: i campi non contano più — vince chi ha più PV a fine turno (Supremazia).',
      'In qualsiasi momento: se l\'avversario scende a 0 PV, hai vinto per annientamento.',
      'Premi OK per continuare.',
    ],
    fcBudgetTitle: 'Budget Focus Coin (FC)',
    fcBudgetLines: [
      'Parti con 18 FC per tutta la partita: ogni FC speso non torna.',
      'Ogni duello costa almeno 1 FC per partecipare.',
      'FC alti aumentano il tuo VA (POT × FC), ma ti lasciano meno risorse nei round successivi.',
      'La partita si vince sul piano totale — PV, campi e FC residui — non sul singolo scontro.',
      'Premi OK per continuare.',
    ],
    baseFieldTitle: 'Round {round}: scegli il campo',
    baseFieldLine: 'Hai l\'iniziativa. Seleziona "{field}" — leggi l\'effetto del campo prima di confermare.',
    enemyFieldTitle: 'Round {round}: iniziativa nemica',
    enemyFieldLine: 'Il nemico sceglie il campo. Leggi quale effetto avrà sul duello, poi premi continua.',
    enemyFieldChosen: 'Campo nemico: "{field}". Ora osserva come schiera agente e FC.',
    enemyDeployTitle: 'Round {round}: schieramento nemico',
    enemyDeployLines: [
      'Il nemico schiera "{enemy}" con {enemyFocus} FC.',
      'Nota POT e DAN sulla sua carta: con POT × FC calcoli il VA base e il DAN che subiresti se perdessi.',
      'Poi scegli il tuo agente e quanti FC investire.',
    ],
    ackContinueButton: 'Ho capito, continua',
    selectAgentTitle: 'Round {round}: agente e FC',
    stepLine: 'Schiera "{player}" contro "{enemy}" ({enemyFocus} FC nemici).',
    duelFormula: 'VA base = POT × FC investiti (prima di poteri e modificatori di campo).',
    expectedVa: 'VA base: tuo {playerVa}, nemico {enemyVa}. Con queste carte il VA più alto vince il duello.',
    focusHintSelected: 'Imposta {focus} FC → {power} POT × {focus} = {playerVa} VA base.',
    focusHintUnselected: 'Seleziona "{player}" e prepara {focus} FC come indicato.',
    confirmLine: 'Conferma solo quando agente e FC corrispondono allo step.',
    triggersPrimer:
      'Ogni potere ha un trigger: una condizione legata a campi, round, FC, PV o esito dello scontro precedente. Se la condizione non è vera, il potere non scatta e non modifica il duello.',
    triggersPhaseHint:
      'In questa fase compaiono solo i poteri il cui trigger è soddisfatto. Nessuna riga per un potere = trigger non attivo in questo scontro.',
    duel: {
      battleTitle: 'Round {round}: duello in corso',
      battleLines: ['Le scelte sono bloccate. Segui le fasi al centro: ogni passaggio spiega come nasce il risultato.'],
      phases: [
        {
          title: 'Fase 1 — Schieramento',
          lines: [
            'Le carte entrano al centro. POT = potenza d\'attacco; DAN = punti vita che il vincitore toglie al perdente.',
          ],
        },
        {
          title: 'Fase 2 — Poteri e bonus',
          lines: [
            'I poteri PRE-duello si attivano solo se il loro trigger è soddisfatto (condizione scritta sulla carta e nel Glossario).',
            'Trigger vero → l\'effetto compare qui e modifica POT, DAN o VA. Trigger falso → il potere resta inattivo: in questa fase non vedi nulla e conta solo POT × FC.',
          ],
        },
        {
          title: 'Fase 3 — Focus Coin',
          lines: [
            'Compaiono le monete FC spese. Qui si calcola il VA base: POT × FC sotto ogni carta.',
          ],
          vaLine: 'Tu: {playerPower} POT × {playerFc} FC = {playerVa} VA. Nemico: {enemyPower} POT × {enemyFc} FC = {enemyVa} VA.',
        },
        {
          title: 'Fase 4 — Modificatori VA',
          lines: [
            'Eventuali bonus o malus finali al VA. Se non compaiono righe, valgono i numeri della fase precedente.',
          ],
          clashLine: 'VA finale: tu {playerVa}, nemico {enemyVa}. {vaLeader}',
        },
        {
          title: 'Fase 5 — Scontro',
          lines: [
            'Confronto dei VA: vince il valore più alto.',
            'Pareggio? Vince la Lega più bassa, poi la POT più bassa, infine chi ha giocato per secondo.',
          ],
        },
        {
          title: 'Fase 6 — Esito',
          lines: [
            'Il vincitore infligge il DAN al perdente e, nei turni 1–4, conquista il campo.',
          ],
          outcomeWin: 'Hai vinto: infliggi {damage} DAN e conquisti il campo.',
          outcomeLoss: 'Hai perso: subisci {damage} DAN e cedi il campo.',
          outcomeDraw: 'Pareggio: nessun DAN e il campo resta in contesto.',
        },
        {
          title: 'Fase 7 — Prossimo passo',
          lines: ['Premi Continua sotto il campo per il riepilogo guidato del round.'],
        },
      ],
    },
    resultTitle: 'Round {round}: cosa è cambiato',
    wonLabel: 'Hai vinto il duello.',
    lostLabel: 'Hai perso il duello.',
    resultLines: [
      'Vincere = conquistare il campo (turni 1–4) + infliggere DAN al perdente.',
      'Controlla sempre la situazione complessiva, non solo questo scontro.',
    ],
    resultFieldsState: 'Campi: tu {playerFields} — avversario {enemyFields}. Ne servono 3 per vincere entro il turno 4.',
    resultState: 'PV: tu {playerHp} — avversario {enemyHp}. FC residui: tu {playerFc}, nemico {enemyFc}.',
    resultContinue: 'Premi Continua per lo step guidato successivo.',
    epilogueTitle: 'Fine del percorso guidato',
    epilogueLines: [
      'Hai visto tutto il ciclo: campo → agente → FC → duello → conseguenze.',
      'Situazione: campi {playerFields}-{enemyFields}, PV {playerHp}-{enemyHp}, FC {playerFc}-{enemyFc}.',
      'La partita continuerebbe: round 4 ancora a conquista, dal round 5 vince chi ha più PV.',
    ],
    epiloguePlayButton: 'Gioca i round 4–5 liberamente',
    epilogueEndButton: 'Termina il tutorial',
    freePlayFinalTitle: 'Tutorial introduttivo completato',
    freePlayFinalLines: [
      'Hai vissuto anche gli ultimi round: conquista e Supremazia.',
      'Risultato: {gameResultLabel}.',
    ],
    freePlayHints: {
      selectField: 'Round {round}: scegli il campo. {victoryReminder}',
      selectAgent: 'Scegli agente e FC. FC residui: {playerFc}. Ricorda: VA = POT × FC.',
      result: 'Leggi PV, FC e campi prima di continuare.',
      duel: 'Osserva le 7 fasi del duello: POT×FC → modificatori → scontro → DAN.',
    },
    victoryReminderRound4: 'Con 3 campi vinci subito.',
    victoryReminderRound5: 'Ora conta solo chi ha più PV a fine turno.',
    fallbackTitle: 'Partita guidata introduttiva',
    fallbackLine: 'Segui i passaggi in alto: il tutorial valida ogni mossa.',
  },
  advanced: {
    advGoalTitle: 'Pensare al totale',
    advGoalLines: [
      '18 FC su 5 round ≈ 3–4 FC a duello in media. Ogni FC extra deve avere un motivo.',
      'L\'obiettivo non è vincere ogni scontro, ma chiudere in vantaggio: PV, campi o FC per il round 5.',
      'Da qui scegli tu i FC: il tutorial commenta se la scelta è efficiente, eccessiva o troppo parsimoniosa.',
    ],
    advTriggersTitle: 'Quando scattano i poteri',
    advTriggersLines: [
      'Ogni potere ha un trigger: se la condizione non è vera, l\'effetto non compare nella fase 2 del duello.',
      'PRE-duello (Imboscata, Intervento, Gloria, Overdrive…): modificano il VA dello scontro in corso.',
      'POST-duello (Conquista, Ultimo Desiderio) ed effetti campo tardivi: valgono per i round futuri, non per il VA appena calcolato.',
      'Il VA mostrato negli step è il VA base (POT × FC): somma i modificatori dei poteri che si sono attivati.',
    ],
    advDuelPhases: [
      {
        title: 'Fase 2 — Poteri e bonus',
        lines: [
          'Qui compaiono solo i poteri il cui trigger è soddisfatto. Se un potere non compare, la sua condizione non era vera in questo scontro.',
          'Chiediti: quali trigger sono attivi adesso, e quanto spostano il VA rispetto al POT × FC?',
        ],
      },
    ],
    advExpectedVa: 'VA base: tuo {playerVa}, nemico {enemyVa}. Poteri e campo aggiungono modificatori deterministici; alla fine vince chi ha VA più alto.',
    advEpilogueTitle: 'Percorso avanzato completato',
    advEpilogueLines: [
      'Hai lavorato su: trade, efficienza, soglie, conteggio FC, chiusura al round 5.',
      'Risultato finale: {gameResultLabel} — ma qui contava il processo, non l\'esito.',
      'Prossimo passo: partite vere. Le letture diventano riflessi solo giocando.',
    ],
    advEpilogueButton: 'Torna al menu',
    eval: {
      advEvalWinNeeded: 'Corretto: il differenziale PV imponeva di vincere questo duello, e hai investito quanto serviva.',
      advEvalWinWasted: 'Hai vinto, ma eri già avanti di {pvLead} PV: il DAN nemico non bastava a ribaltarti. FC spesi per nulla.',
      advEvalLossOk: 'Hai ceduto il duello ma il tuo vantaggio PV reggeva il DAN: chiusura corretta.',
      advEvalLossFatal: 'Serviva vincere: il DAN subìto ha ribaltato i PV. Rifai i conti: VA nemico massimo era {enemyMaxVa}.',
    },
    fallbackTitle: 'Partita guidata avanzata',
    fallbackLine: 'Segui i passaggi guidati e valuta ogni scelta FC.',
  },
  generic: {
    step1: 'Step 1',
    step2: 'Step 2',
    step3: 'Step 3',
    step4: 'Step 4',
    step5: 'Step 5',
    pickField: 'Scegli il campo "{field}".',
    pickAgent: 'Schiera "{agent}".',
    enforceAgent: 'Per questo step devi usare "{agent}".',
    enforceFocus: 'Imposta {focus} FC, poi conferma.',
    confirmObserve: 'Conferma e osserva il duello fase per fase prima del riepilogo.',
    analyzeResult: 'Analizza il risultato e premi Continua per il prossimo step guidato.',
    fallbackTitle: 'Partita guidata',
    fallbackLine: 'Segui i passaggi guidati.',
  },
};

export const GUIDED_UI = {
  overlay: {
    zIndex: 16,
    background: 'rgba(2, 6, 18, 0.46)',
  },
  goalCallout: {
    style: { top: 168, left: '50%', transform: 'translateX(-50%)', width: 620 },
    compactStyle: {
      bottom: 16,
      right: 16,
      left: 'auto',
      top: 'auto',
      transform: 'none',
      width: 360,
      maxWidth: 'calc(100vw - 32px)',
    },
    zIndex: 18,
    cardStyle: {
      borderColor: 'rgba(244, 114, 182, 0.5)',
      background: 'rgba(2, 6, 18, 0.96)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
    },
    headerStyle: { fontSize: '0.9rem', letterSpacing: '0.1em' },
    titleStyle: { fontSize: '1.5rem' },
    textStyle: { fontSize: '1.125rem', lineHeight: 1.35 },
    listStyle: { fontSize: '0.98rem' },
    hintStyle: { fontSize: '0.95rem' },
    continueButtonStyle: {
      borderColor: 'rgba(251, 191, 36, 0.85)',
      background: 'rgba(245, 158, 11, 0.18)',
      color: '#fde68a',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
      cursor: 'pointer',
    },
    secondaryButtonStyle: {
      borderColor: 'rgba(148, 163, 184, 0.55)',
      background: 'rgba(30, 41, 59, 0.45)',
      color: '#e2e8f0',
      cursor: 'pointer',
    },
  },
  trianglesHighlight: {
    common: {
      width: '1071px',
      height: '459px',
      border: '2px solid rgba(251, 191, 36, 0.95)',
      boxShadow: '0 0 26px rgba(251, 191, 36, 0.55)',
      zIndex: 17,
    },
    topLeft: {
      top: 0,
      left: 0,
      clipPath: 'polygon(0 0, 100% 0, 0 100%)',
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
    },
  },
};

export function fillGuidedTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export function getGameResultLabel(gameResult) {
  if (!gameResult) return 'partita conclusa';
  if (gameResult.winner === 'draw') return 'pareggio';
  if (gameResult.winner === 'player') {
    if (gameResult.reason === 'fields') return 'vittoria per conquista';
    if (gameResult.reason === 'hp') return 'vittoria per Supremazia / PV';
    return 'vittoria';
  }
  if (gameResult.reason === 'fields') return 'sconfitta per conquista';
  if (gameResult.reason === 'hp') return 'sconfitta per PV';
  return 'sconfitta';
}
