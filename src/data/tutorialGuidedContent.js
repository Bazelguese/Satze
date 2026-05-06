export const GUIDED_COPY = {
  intro: {
    welcomeTitle: 'Ora facciamo un giro veloce!',
    welcomeContinue: 'Premi ok per continuare',
    openingParts: {
      beforeField: 'Iniziamo il tutorial Introduttivo! Quello che vedi è il ',
      fieldLabel: 'campo di gioco',
      between: ', dove avvengono i ',
      duelLabel: 'Duelli',
      end: '.',
    },
    handsTitle: 'Le mani dei giocatori',
    handsLines: [
      'Queste sono le vostre mani, i colori e le immagini rispecchiano il vostro esercito.',
      'Ogni esercito è composto da 10 agenti',
      'Ad inizio partita ogni giocatore pesca 5 agenti e potrà usare solo quelli fino alla fine della partita',
      'Premi ok per continuare',
    ],
    drawTitle: 'Pesca iniziale completata',
    drawInfo: 'Gli agenti in mano saranno sempre visibili per entrambi, sfrutta le informazioni in tuo possesso per elaborare una strategia fin da subito!',
    clickCardPrefix: 'Clicca su',
    previewTitle: 'Pannello anteprima',
    previewLine: "Quì potrai vedere bene le caratteristiche dell'agente, puoi controllare i tuoi o quelli del tuo avversario in qualsiasi momento",
    previewContinue: 'Premi ok per continuare',
    glossaryPromptTitle: 'Apri il Glossario',
    glossaryPromptLine: 'Ora clicca il pulsante Glossario per continuare.',
    glossaryOpenTitle: 'Glossario aperto',
    glossaryOpenLine: 'Nel glossario troverai la descrizione di ogni termine che vedrai in campo',
    glossaryCloseHint: 'ora chiudilo per continuare, avrai modo di leggerlo con calma dopo!',
    battlefieldsTitle: 'Campi di battaglia',
    battlefieldsLines: [
      "Campi: L'intera partita si svolge scegliendo ogni turno un campo di battaglia",
      "All'inizio sono disponibili solo 3 campi, gli altri 2 si scopriranno col progredire dei turni",
      "Ogni turno un giocatore sceglie il campo di battaglia su cui avverrà il duello e l'agente che ci parteciperà",
      "All'inizio di ogni partita, inizierà il giocatore con il valore totale lega più basso tra le mani (ogni agente ha un livello Lega che può variare da 2 a 5)",
    ],
    baseFieldTitle: 'Round {round}: regole base e scelta campo',
    baseFieldLine: 'Campi: ogni round scegli 1 campo. Ora seleziona "{field}".',
    selectAgentTitle: 'Round {round}: agente, FC e duello',
    stepLine: 'Step: usa "{player}" contro "{enemy}" ({enemyFocus} FC).',
    duelFormula: 'Formula duello: VA = POT × FC (+/- modificatori di poteri/campo).',
    expectedVa: 'Con questa scelta: tuo VA atteso {playerVa}, nemico {enemyVa}.',
    focusHintSelected: 'Imposta {focus} FC: VA previsto {power}×{focus} = {playerVa}.',
    focusHintUnselected: 'Schiera "{player}" e prepara {focus} FC.',
    confirmLine: 'Conferma solo quando agente e FC sono quelli richiesti.',
    resultTitle: 'Round {round}: lettura risultato',
    wonLabel: 'Hai vinto il duello.',
    lostLabel: 'Hai perso il duello.',
    resultLines: [
      'Se vinci il duello, conquisti il campo e applichi il DAN.',
      'Dopo il risultato, confronta sempre: PV residui, FC residui, campi conquistati.',
    ],
    resultState: 'Stato attuale: PV {playerHp}-{enemyHp}.',
    resultContinue: 'Premi Continua per passare allo step guidato successivo.',
    fallbackTitle: 'Partita guidata introduttiva',
    fallbackLine: 'Segui i passaggi in alto: il tutorial valida ogni mossa.',
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
    confirmObserve: 'Conferma la scelta e osserva il risultato reale del round.',
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
    zIndex: 18,
    cardStyle: {
      borderColor: 'rgba(244, 114, 182, 0.5)',
      background: 'rgba(2, 6, 18, 0.96)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
    },
    headerStyle: { fontSize: '0.9rem', letterSpacing: '0.1em' },
    titleStyle: { fontSize: '1.5rem' }, // ~text-2xl
    textStyle: { fontSize: '1.125rem', lineHeight: 1.35 }, // ~text-lg
    listStyle: { fontSize: '0.98rem' },
    hintStyle: { fontSize: '0.95rem' },
    continueButtonStyle: {
      borderColor: 'rgba(251, 191, 36, 0.85)',
      background: 'rgba(245, 158, 11, 0.18)',
      color: '#fde68a',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
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
