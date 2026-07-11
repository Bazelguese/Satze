# FLUSSO TUTORIAL GUIDATO — Completamento Intro + Avanzato

> Documento di design da cui derivare il codice. Riferimenti: `useTutorialOrchestrator.js`, `useGuidedTutorialFlow.jsx`, `tutorialGuidedContent.js`, `GuidedTutorialOverlay.jsx`, `useTutorial.js`. Regole verificate su `REGOLE_Rework.md`.
>
> Le decisioni genuinamente aperte sono marcate **⚠️ DECISIONE** con raccomandazione.

---

## 0. Problemi strutturali da risolvere PRIMA di scrivere i nuovi stage

Questi quattro punti condizionano tutto il flusso: se non si sistemano, i nuovi stage insegnano cose che il gioco poi smentisce.

### P1 — Mani guidate implicite (slice per id)
`startGuidedMatch` fa `sort by id → slice(0,5)/(5,10)`. Le mani dipendono da quali carte hanno gli id più bassi nel pool: oggi il giocatore riceve Sorethal (POT 6, **-8 VA nem.**), Tessitrice (Sopraffare +2 FC), Portatore della Domanda (Resa dei conti -6 VA nem.), ecc. Ogni aggiunta di carte può cambiare silenziosamente le mani e ribaltare gli esiti scriptati.

**Soluzione:** costanti esplicite in `tutorialGuidedContent.js`:
```js
export const GUIDED_HANDS = {
  intro: { player: [/* 5 id */], enemy: [/* 5 id */] },
  advanced: { player: [/* 5 id */], enemy: [/* 5 id */] },
};
```
Criteri di selezione per l'**intro**: carte con `ability.trigger === null` e senza effetti VA/POT (o con effetti trascurabili), così il duello coincide con la formula insegnata. Per l'**avanzato**: carte scelte apposta per le lezioni (una con Overdrive per R3, una con Resa dei conti per l'interludio trigger).

### P2 — VA atteso vs VA reale
`expectedPlayerVA = power × focus` ignora poteri, bonus armata ed effetti campo, ma il copy dice "tuo VA atteso {playerVa}". Con le mani attuali il numero mostrato è **falso**.

**Soluzione:** per l'intro, con mani ripulite (P1) la formula torna vera — nessun cambio di calcolo necessario. Per l'avanzato, dove i poteri sono la lezione, il copy deve dire esplicitamente "VA base" e mostrare il modificatore atteso a parte (vedi §2, interludio trigger).

### P3 — Vittoria anticipata per conquista
Con lo script W-L-W l'esito è 2-1 campi e non scatta nulla, ma basta un potere non previsto a far vincere anche R2 → 3 campi → la partita guidata termina al round 3 saltando l'epilogo. Con P1 risolto il rischio è quasi nullo, ma serve comunque una rete.

**Soluzione:** in `guidedMatch.active`, il check di vittoria per conquista è sospeso finché `guidedIntroStage < STAGE_EPILOGO` (o flag equivalente). L'annientamento (0 PV) resta impossibile con i numeri scriptati; verificare comunque con il test di §5.

### P4 — Completamento per-track
`useTutorial.js` salva un solo flag `satze_tutorial_completed`. Con tre percorsi serve granularità.

**Soluzione:** chiavi `satze_tutorial_completed_brief|intro|advanced`, `completeTutorial(trackId)` / `wasCompleted(trackId)`. Retrocompatibilità: se esiste la chiave vecchia, considerala equivalente a `brief`.

---

## 1. TRACK INTRODUTTIVO — flusso completo

### 1.1 Mappa degli stage (stato → nuovo)

| Stage | Fase | Contenuto | Stato |
|---|---|---|---|
| 0 | selectField R1 | Benvenuto, campo di gioco, duelli | esistente |
| 1 | selectField R1 | Le mani (10 agenti, pesca 5, mani pubbliche) | esistente |
| 2 | selectField R1 | Click carta target | esistente |
| 3 | selectField R1 | Pannello anteprima | esistente |
| 4–5 | selectField R1 | Glossario (prompt + aperto) | esistente |
| 6 | selectField R1 | Campi di battaglia, iniziativa | esistente |
| **7** | selectField R1 | **Come si vince** | **NUOVO** |
| **8** | selectField R1 | **Il budget FC** | **NUOVO** |
| 9+ | fallthrough | `baseFieldTitle` → scegli campo R1 | esistente (rinumerato) |

Gli stage 7 e 8 usano il pulsante "OK, continua": aggiungere `isGuidedIntroVictoryPhase` (stage 7) e `isGuidedIntroFcBudgetPhase` (stage 8) alla condizione del bottone in `GuidedTutorialOverlay` e ai flag in `useGuidedTutorialFlow`. Il fallthrough a `baseFieldTitle` scatta con `guidedIntroStage >= 9`.

### 1.2 Copy nuovi stage (chiavi in `GUIDED_COPY.intro`)

```
victoryTitle: 'Come si vince'
victoryLines: [
  'Nei turni 1–4 vinci conquistando 3 campi di battaglia.',
  'Dal turno 5 in poi i campi non contano più: vince chi ha più PV a fine turno.',
  'In qualsiasi momento, se l'avversario arriva a 0 PV hai vinto.',
  'Premi ok per continuare',
]

fcBudgetTitle: 'I tuoi Focus Coin'
fcBudgetLines: [
  'Hai 18 FC per TUTTA la partita: quelli spesi non tornano indietro.',
  'Ogni scontro richiede almeno 1 FC.',
  'Spendere tanto vince il duello di oggi, ma può farti perdere la partita di domani.',
  'Premi ok per continuare',
]
```

### 1.3 Round 1 (esistente, ritocchi)

Invariato: scelta campo → agente → FC 3 → conferma → risultato. Due aggiunte al copy:

- `resultLines` (fase result): aggiungere in coda la riga contatore conquiste, template nuovo:
  `resultFieldsState: 'Campi conquistati: tu {playerFields} — avversario {enemyFields}. Ne servono 3 per vincere (entro il turno 4).'`
  Variabili derivate da `conqueredFields` in `useGuidedTutorialFlow` (passare la prop).

### 1.4 Round 2 — lezione: perdita controllata

Script esistente: FC 2 vs 3 nemici → **sconfitta pilotata** (verificare esito con le mani di P1; se necessario ritoccare i valori FC dello script, non le carte).

Copy round-specific. Struttura dati raccomandata: campo `lesson` dentro l'elemento dell'array `rounds` (data-driven, evita switch sul numero round nel hook):

```js
{ round: 2, fieldIndex: 1, playerAgentId: ..., focus: 2, enemyAgentId: ..., enemyFocus: 3,
  lesson: {
    selectAgentExtra: 'Il nemico investirà 3 FC: per superarlo dovresti spenderne troppi. Qui accettiamo di perdere poco.',
    resultExtra: [
      'Hai perso il duello e subìto il DAN, ma hai speso solo 2 FC.',
      'Perdere un duello investendo poco è spesso meglio che vincerlo svenandosi: la partita si vince sul totale, non sul singolo scontro.',
    ],
  } }
```

`useGuidedTutorialFlow` concatena `lesson.selectAgentExtra` alle lines della fase `selectAgent` e `lesson.resultExtra` alle lines della fase `result`, se presenti.

### 1.5 Round 3 — lezione: contare conquiste e FC

Script esistente: FC 4 vs 2 → vittoria pilotata. Copy:

```js
lesson: {
  selectAgentExtra: 'Qui vale la pena investire: vincere ti porta a 2 campi conquistati.',
  resultExtra: [
    'Sei a 2 campi conquistati contro 1: te ne manca 1 per la vittoria territoriale.',
    'Hai speso 9 FC su 18 in 3 round: metà budget, metà partita. Questo è il ritmo da tenere d'occhio.',
  ],
}
```

(Il "9 su 18" vale con lo script attuale 3+2+4; se P1 cambia i valori FC, ricalcolare o usare template `{fcSpent}`/`{fcLeft}` — raccomandato il template.)

### 1.6 Epilogo intro

Al "Continua" dopo il risultato di R3, invece di avanzare al round 4 normale: `guidedIntroStage = 90` (costante `INTRO_STAGE_EPILOGUE`), overlay epilogo.

```
epilogueTitle: 'Fine del percorso guidato'
epilogueLines: [
  'Hai visto tutto il ciclo: campo → agente → FC → duello → conseguenze.',
  'Situazione: campi {playerFields}-{enemyFields}, PV {playerHp}-{enemyHp}, FC {playerFc}-{enemyFc}.',
  'La partita continuerebbe: round 4 ancora a conquista, dal round 5 vince chi ha più PV.',
]
epiloguePlayButton: 'Gioca i round 4–5 liberamente'
epilogueEndButton: 'Termina il tutorial'
```

**⚠️ DECISIONE — chiusura intro.** Due opzioni:
- **(A) Fine forzata**: solo `epilogueEndButton` → `completeTutorial('intro')`, `resetGuidedTutorial()`, ritorno al menu.
- **(B) Round 4–5 liberi** *(raccomandata)*: entrambi i bottoni. Con "Gioca": `guidedMatch` resta attivo ma con `freePlay: true` → overlay ridotto a un solo hint contestuale per fase (`freePlayHints` sotto), validazione disattivata, check vittoria riattivati (chiude P3). Al `gameResult` → epilogo finale breve + `completeTutorial('intro')`.
  Raccomandata perché è l'unico modo di far *vivere* la Supremazia del turno 5 invece di raccontarla, e il costo implementativo è basso (le fasi di gioco normali esistono già).

```
freePlayHints: {
  selectField: 'Round {round}: scegli tu il campo. {victoryReminder}',
  selectAgent: 'Scegli agente e FC liberamente. FC residui: {playerFc}.',
  result: 'Leggi il risultato: PV, FC residui, campi.',
}
victoryReminder (round 4): 'Con 3 campi vinci subito.'
victoryReminder (round 5): 'Ora conta solo chi ha più PV a fine turno.'
```

---

## 2. TRACK AVANZATO — flusso completo

Prerequisito consigliato in UI: il selettore mostra l'avanzato come "consigliato dopo l'introduttivo" se `wasCompleted('intro') === false` (non bloccante).

L'avanzato **non** usa gli stage 0–8 dell'intro (tutti i flag `isGuidedIntro*` restano gated su `trackId === 'intro'`). Ha i suoi stage: `guidedAdvStage` oppure riuso di `guidedIntroStage` con costanti dedicate — raccomandato **riuso con costanti** (`ADV_STAGE_GOAL = 0`, `ADV_STAGE_TRIGGERS = 1`, `ADV_STAGE_EPILOGUE = 90`) per non aggiungere stato.

Differenza chiave di validazione: dove l'intro impone FC esatti, l'avanzato usa **fasce** (`focusPolicy`). Schema esteso dei round:

```js
{ round, fieldIndex, playerAgentId, enemyAgentId, enemyFocus,
  focusPolicy: 'exact' | 'range' | 'free',
  focus,            // valore target (exact) o consigliato (range)
  focusMin, focusMax, // solo per range
  lesson: { ... } }
```

Validazione in fase selectAgent: `exact` come oggi; `range` accetta min–max e commenta la scelta (`feedbackUnder` / `feedbackOk` / `feedbackOver`); `free` accetta tutto e valuta a posteriori.

### 2.1 Stage A0 — Macro-obiettivo (pre-round 1, selectField, stage 0)

Pulsante "OK, continua".

```
advGoalTitle: 'Giocare sul totale'
advGoalLines: [
  '18 FC, 5 round: la media è ~3,5 FC a scontro. Ogni FC sopra la media va giustificato.',
  'Non si gioca per vincere il singolo duello, ma per arrivare al round 5 con vantaggio: PV, FC o campi.',
  'In questo percorso scegli tu quanti FC investire: il tutorial valuta ogni scelta.',
]
```

### 2.2 Round 1 — Trade / perdita controllata (pratica)

Script: FC nemici 3, `focusPolicy: 'range'`, `focusMin: 1, focusMax: 2, focus: 1`. Esito atteso: sconfitta a costo minimo.

```
lesson.selectAgentExtra: 'Il nemico è più forte su questo campo. Quanto vale NON vincere qui? Investi il minimo (1–2 FC).'
lesson.feedbackOk: 'Perdita controllata: cedi il campo ma conservi {fcSaved} FC per i round che contano.'
lesson.feedbackOver: 'Con {focus} FC perdi comunque o vinci un campo che non ti serve: overcommit.'
lesson.resultExtra: ['Hai subìto {dan} DAN, ma il differenziale FC ora è a tuo favore: {playerFc} contro {enemyFc}.']
```

### 2.3 Interludio — Timing dei trigger (stage 1, prima della scelta campo R2)

Pulsante "OK, continua". Riprende `adv-timing` dei TutorialSteps ma dentro la partita:

```
advTriggersTitle: 'Quando scattano i poteri'
advTriggersLines: [
  'Trigger PRE-duello (Imboscata, Intervento, Gloria, Vendetta, Rimonta, Magnanimo, Overdrive, Resa dei conti): modificano il VA dello scontro in corso.',
  'Trigger legati all'esito (Conquista, Ultimo Desiderio) ed effetti campo di fase 7: cambiano risorse e stato per i round futuri, non il duello appena chiuso.',
  'Da qui in poi il "VA atteso" mostrato è il VA BASE (POT × FC): i modificatori vanno letti sulla carta e sommati a mente.',
]
```

Nota copy `expectedVa` per l'avanzato: sostituire con `advExpectedVa: 'VA base: tuo {playerVa}, nemico {enemyVa}. Controlla i poteri: possono ribaltare questi numeri.'` (chiude P2 per questo track).

### 2.4 Round 2 — Efficienza

Script: FC nemici 1, `range 2–3, focus: 2`. Esito atteso: vittoria a basso costo.

```
lesson.selectAgentExtra: 'Il nemico sta risparmiando. Vinci spendendo il giusto: quanto basta a superarlo, non un FC di più.'
lesson.feedbackOk: 'Efficienza: campo conquistato a {focus} FC.'
lesson.feedbackOver: 'Vinci lo stesso, ma ogni FC oltre la soglia è regalato.'
lesson.resultExtra: ['VA per FC è la metrica: vincere 10-a-2 spendendo 5 FC vale meno che vincere 6-a-4 spendendone 2.']
```

### 2.5 Round 3 — Overdrive e soglie

Richiede in mano giocatore una carta con `trigger: 'overdrive'` (vincolo su `GUIDED_HANDS.advanced.player`, vedi P1). Script: `focusPolicy: 'exact', focus: 5`, FC nemici 2.

```
lesson.selectAgentExtra: '"{player}" ha Overdrive: il potere scatta solo se investi 5+ FC. Le soglie trasformano i FC da carburante a interruttore.'
lesson.resultExtra: [
  'Hai pagato caro (5 FC) ma il potere ha aggiunto valore oltre il VA base: le soglie si pagano solo quando il payoff supera il costo.',
  'FC residui: {playerFc} tu, {enemyFc} il nemico. Tienili d'occhio: sono informazione pubblica.',
]
```

### 2.6 Round 4 — Contare i FC del nemico

Script: FC nemici 6 (spesa pesante pilotata), `range 2–4, focus: 3`.

```
lesson.selectAgentExtra: 'Guarda i FC residui del nemico e i round rimanenti: quanto PUÒ investire al massimo qui, sapendo che al round 5 gli serve almeno 1 FC? Questo limita il suo VA massimo possibile.'
lesson.resultExtra: [
  'Il nemico ha investito pesante: al round 5 arriverà con {enemyFc} FC contro i tuoi {playerFc}.',
  'Contare i FC non ti dice cosa farà: ti dice cosa NON può fare. È il tetto del suo bluff.',
]
```

(Esito del duello indifferente per la lezione: il copy funziona in entrambi i casi; niente `wonLabel`-dipendenze extra.)

### 2.7 Round 5 — Supremazia: decisione libera valutata

`focusPolicy: 'free'`. Il campo può restare imposto (fieldIndex scriptato) per controllare lo scenario. FC nemici: scriptati = tutti i residui − 0 (all-in) o valore fisso — **⚠️ DECISIONE**: raccomandato **all-in nemico** (`enemyFocus = enemyFcResidui`), perché rende il calcolo del giocatore un problema chiuso e verificabile.

```
lesson.selectAgentExtra: [
  'Ultimo round: i campi non contano più, vince chi chiude con più PV.',
  'Dati: PV {playerHp}-{enemyHp}, il DAN in palio, i FC residui di entrambi. Decidi tu: contesti il duello o minimizzi la perdita?',
]
```

Valutazione post-risultato (fase result), tre esiti calcolati confrontando la scelta con l'ottimo dato lo stato:

```
advEvalWinNeeded:  'Corretto: il differenziale PV imponeva di vincere questo duello, e hai investito quanto serviva.'
advEvalWinWasted:  'Hai vinto, ma eri già avanti di {pvLead} PV: il DAN nemico non bastava a ribaltarti. FC spesi per nulla.'
advEvalLossOk:     'Hai ceduto il duello ma il tuo vantaggio PV reggeva il DAN: chiusura corretta.'
advEvalLossFatal:  'Serviva vincere: il DAN subìto ha ribaltato i PV. Rifai i conti: VA nemico massimo era {enemyMaxVa}.'
```

Logica di classificazione (in `useGuidedTutorialFlow` o util dedicata): `needWin = (playerHp − enemyDan) ≤ enemyHp` calcolato pre-duello con i DAN effettivi in campo; poi incrocio con esito e FC spesi vs minimo sufficiente.

### 2.8 Epilogo avanzato (stage 90)

```
advEpilogueTitle: 'Percorso avanzato completato'
advEpilogueLines: [
  'Hai lavorato su: trade, efficienza, soglie, conteggio FC, chiusura al round 5.',
  'Risultato finale: {gameResultLabel} — ma qui contava il processo, non l'esito.',
  'Prossimo passo: partite vere. Le letture diventano riflessi solo giocando.',
]
```
Bottone unico "Torna al menu" → `completeTutorial('advanced')`, `resetGuidedTutorial()`.

---

## 3. Estensioni schema dati (riepilogo)

**`tutorialGuidedContent.js`**
- `GUIDED_HANDS` (P1)
- `GUIDED_COPY.intro`: `victoryTitle/Lines`, `fcBudgetTitle/Lines`, `resultFieldsState`, `epilogue*`, `freePlayHints`, `victoryReminder`
- `GUIDED_COPY.advanced` (nuova sezione): `advGoal*`, `advTriggers*`, `advExpectedVa`, `advEval*`, `advEpilogue*`
- Copy per-round dentro l'array `rounds` (campo `lesson`) — i template usano `fillGuidedTemplate` esistente

**Schema `rounds`**: `focusPolicy`, `focusMin/Max`, `lesson{selectAgentExtra, resultExtra, feedbackUnder/Ok/Over}`

**`useTutorialOrchestrator.js`**
- Mani da `GUIDED_HANDS` (non più slice)
- `enemyFocus` R5 avanzato calcolato sui residui (se DECISIONE all-in)
- Sospensione check vittoria in guided (P3), riattivazione in `freePlay`
- Stato aggiuntivo: `freePlay` dentro `guidedMatch`

**`useGuidedTutorialFlow.jsx`**
- Nuovi flag stage 7/8 intro, epilogo (90), stage avanzato 0/1
- Concatenazione `lesson.*` alle lines per fase
- Validazione `focusPolicy` a fasce con feedback
- Classificatore R5 avanzato
- Nuove prop: `conqueredFields`, `playerFocus`, `enemyFocus` (residui), `gameResult`

**`GuidedTutorialOverlay.jsx`**
- Bottone continua esteso ai nuovi stage OK-gated
- Doppio bottone epilogo intro (se DECISIONE B)

**`useTutorial.js`**: completamento per-track (P4)

---

## 4. Test/verifiche prima del merge

1. **Script di verifica esiti** (dev-only o test): dato `GUIDED_HANDS` + script round, simula i duelli con `gameMechanicsFramework` e asserisce gli esiti attesi (R1 intro = win, R2 = loss, R3 = win; avanzato analogo). Se cambia una carta del pool, il test rompe invece del tutorial.
2. Verifica che con gli script nessun giocatore scenda a 0 PV prima dell'epilogo.
3. Verifica FC: somma investimenti scriptati + minimi obbligatori ≤ 18 per entrambi in tutti i rami (incluso free play intro).
4. Verifica overlay: gli stage OK-gated non lasciano mai il gioco cliccabile sotto (pointer-events) e viceversa gli stage interattivi sì.

---

## 5. Decisioni aperte (riepilogo)

| # | Decisione | Raccomandazione |
|---|---|---|
| D1 | Chiusura intro: fine forzata (A) vs round 4–5 liberi (B) | **B** — è l'unico punto dove la Supremazia si vive davvero |
| D2 | R5 avanzato: FC nemici all-in vs valore fisso | **all-in** — problema chiuso, valutazione deterministica |
| D3 | Id concreti di `GUIDED_HANDS` | Da scegliere tu sul pool aggiornato (201 carte); vincoli: intro senza poteri VA-alteranti, avanzato con 1 Overdrive nel player |
| D4 | Selettore: gating soft dell'avanzato dietro l'intro | Sì, non bloccante (solo etichetta "consigliato dopo") |
