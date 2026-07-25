# SATZE — Specifica tecnica della nuova IA per i duelli

**Documento operativo per Cursor**  
**Versione:** 1.0  
**Scopo:** sostituire l’attuale logica IA con un motore decisionale coerente con le regole reali del gioco e configurabile in tre difficoltà: **Facile**, **Normale** e **Difficile**.

---

## 0. Istruzione iniziale per Cursor

Leggi interamente questo documento prima di modificare il codice.

La nuova IA non deve essere realizzata aggiungendo altre condizioni casuali dentro `src/hooks/useAI.js`. Deve essere costruito un piccolo motore decisionale **puro**, separato da React, che:

1. genera le giocate legali rilevanti;
2. considera sempre **carta e Focus Coin come una singola decisione**;
3. usa il motore reale del duello per simulare il risultato;
4. valuta il risultato dal punto di vista dell’IA;
5. sceglie la mossa secondo il profilo di difficoltà;
6. rispetta le condizioni trigger definite nel codice corrente;
7. non riceve statistiche, Focus, informazioni o vantaggi nascosti;
8. non modifica il regolamento o i dati delle carte;
9. resta compatibile con duello classico, campagna, tutorial e multiplayer;
10. viene coperto da test automatici deterministici.

Il progetto è JavaScript/React. Non introdurre TypeScript, librerie esterne, servizi remoti o nuovi store globali.

Al termine del lavoro:

- eseguire `npm test`;
- eseguire `npm run build`;
- correggere tutti i test regressivi;
- indicare chiaramente i file creati e modificati;
- riassumere il comportamento delle tre difficoltà;
- segnalare eventuali casi non implementabili senza cambiare le regole.

---

# 1. Risultato desiderato

Le tre IA devono condividere la stessa comprensione corretta del gioco.

La difficoltà deve dipendere da:

- quantità di alternative analizzate;
- capacità di prevedere le risposte avversarie;
- capacità di preservare carte e Focus;
- precisione nell’evitare sovrainvestimenti;
- profondità della pianificazione;
- quantità di casualità applicata alle mosse migliori.

La difficoltà **non** deve dipendere da:

- statistiche alterate;
- Focus aggiuntivi;
- trigger attivati illegalmente;
- conoscenza di informazioni nascoste;
- correzioni della scelta dopo aver visto una risposta ancora segreta;
- moltiplicatori artificiali che fanno semplicemente spendere più Focus.

La Facile deve sembrare inesperta, non guasta.  
La Normale deve rappresentare un giocatore competente.  
La Difficile deve essere competitiva e prudente, senza barare.

---

# 2. Problemi dell’implementazione attuale

Il file principale attuale è:

```text
src/hooks/useAI.js
```

La logica corrente non simula realmente il duello. Usa una valutazione euristica separata dal motore di gioco.

## 2.1 Carta e Focus vengono scelti in due momenti distinti

Attualmente:

1. `selectEnemyAgent()` assegna un punteggio alle carte;
2. per farlo usa un `projectedFocus` ipotetico;
3. dopo aver scelto la carta, `calculateEnemyFocus()` decide il Focus reale;
4. la combinazione finale può quindi essere diversa da quella valutata.

Questo genera scelte incoerenti soprattutto per:

- `overdrive`;
- `opportunista`;
- effetti legati alla quantità di Focus;
- Campi che cambiano la soglia Overdrive;
- Campi che dimezzano il Focus nel VA;
- Campi in cui vince chi investe più Focus;
- Campi che premiano direttamente Overdrive;
- qualsiasi effetto il cui stato cambia tra il Focus ipotetico e quello realmente assegnato.

### Requisito

Carta e Focus devono costituire una sola azione candidata:

```js
{
  card,
  cardId: card.id,
  focus,
  fieldIndex,
}
```

Non scegliere prima la carta e poi il Focus.

---

## 2.2 L’IA usa una copia approssimata delle regole

L’attuale IA calcola soprattutto:

- una stima base dell’assalto;
- Danno con un coefficiente;
- una stima manuale del valore dell’abilità;
- differenze grezze tra statistiche;
- rumore casuale.

Questo non comprende in modo affidabile:

- bonus Armata;
- blocchi;
- immunità;
- copie di Potere, Danno, Potere o Bonus;
- Attrizione;
- Escalation;
- Tossina;
- modificatori profondi dei Campi;
- floor minimi;
- effetti post-duello;
- spareggi;
- ordine di giocata;
- consumo e recupero Focus;
- Danno diretto e cure;
- condizioni di vittoria della partita.

Il progetto dispone già di:

```text
src/game/duelResolve.js
```

La funzione:

```js
computeDuelResolution(...)
```

è pura ed è indicata nel codice come fonte di verità per VA, poteri, bonus ed esito dello scontro.

### Requisito

Il motore IA deve usare `computeDuelResolution()` per valutare le coppie di giocate complete.

Non ricostruire il duello dentro il sistema IA.

---

## 2.3 La modalità difficile spende di più invece di ragionare meglio

L’attuale difficoltà difficile:

- parte da un investimento Focus maggiore;
- aggiunge un buffer alla stima necessaria;
- tende a sovrainvestire;
- sceglie quasi sempre la prima carta di una classifica euristica.

### Requisito

La Difficile deve essere più forte perché:

- considera più risposte avversarie;
- pianifica meglio;
- riconosce letali e Campi decisivi;
- conserva carte e Focus;
- sfrutta gli spareggi;
- sceglie il minimo Focus necessario quando due azioni producono lo stesso risultato utile.

---

## 2.4 Casualità non controllabile

L’attuale codice usa direttamente `Math.random()` nel punteggio e nella selezione.

Questo rende difficile:

- riprodurre un bug;
- testare una scelta;
- confrontare due versioni dell’algoritmo;
- verificare che Facile, Normale e Difficile rispettino il proprio profilo.

### Requisito

La logica decisionale pura deve ricevere un RNG iniettato:

```js
chooseAIAction(context, profile, { rng = Math.random })
```

Il tempo di “pensiero” può continuare a essere casuale nel livello React. La scelta tattica deve essere riproducibile nei test.

---

## 2.5 Sono presenti quattro difficoltà

In `src/utils/aiConstants.js` sono presenti:

- `easy`;
- `medium`;
- `hard`;
- `chaos`.

La nuova selezione giocabile deve mostrare esclusivamente:

- Facile;
- Normale;
- Difficile.

### Requisito

Rimuovere `chaos` dalle opzioni giocabili e dalle diramazioni della nuova IA.

Prima di rimuovere completamente la chiave, cercarne tutti gli utilizzi. Per compatibilità con salvataggi o strumenti developer preesistenti è accettabile che:

```js
getDifficultyConfig('chaos')
```

ricada su `medium`, ma `chaos` non deve più apparire nella schermata normale di selezione.

Mantenere gli ID interni:

```js
'easy'
'medium'
'hard'
```

Il testo UI di `medium` deve diventare **Normale**, non “Medio”.

I nomi tematici esistenti possono essere conservati:

- Senza occhi — Facile;
- Mezzo ubriaco — Normale;
- Sfavorito — Difficile.

---

# 3. Fonti di verità da riutilizzare

Non creare versioni IA parallele delle regole già esistenti.

## 3.1 Risoluzione del duello

```text
src/game/duelResolve.js
```

Usare:

```js
computeDuelResolution()
```

## 3.2 Trigger

```text
src/game/triggerLogic.js
```

Usare:

```js
checkTrigger()
isPostBattleTrigger()
POST_BATTLE_TRIGGERS
```

## 3.3 Contesti simmetrici del duello

```text
src/game/duel/duelTurnContexts.js
```

Usare o riutilizzare il modello di:

```js
buildDuelTurnContexts()
```

## 3.4 Modificatori dei Campi

```text
src/game/battlefieldEffects.js
src/game/battlefieldDeepEffects.js
src/game/fieldLogic.js
```

Non ricreare manualmente gli effetti dei Campi.

## 3.5 Bonus Armata

```text
src/data/armies.js
```

Usare gli oggetti già calcolati in `gameState` e passati a `computeDuelResolution()`.

## 3.6 Validazione delle chiavi

```text
src/data/gameMechanicsFramework.js
```

Usare:

```js
TRIGGER_KEYS
EFFECT_KEYS
isKnownTriggerKey()
isKnownEffectKey()
```

quando serve validare dati o produrre warning developer.

---

# 4. Regole trigger da rispettare

Non usare vecchie versioni del regolamento o nomi ricordati da documenti precedenti. La fonte di verità è `src/game/triggerLogic.js`.

## 4.1 Trigger pre-duello

| Chiave | Condizione attuale nel codice |
|---|---|
| `imboscata` | il proprietario gioca per primo |
| `intervention` | il proprietario gioca per secondo |
| `glory` | il proprietario ha vinto lo scontro precedente |
| `vendetta` | il proprietario ha perso lo scontro precedente |
| `overdrive` | Focus investiti almeno pari alla soglia, normalmente 5 |
| `reckoning` | entrambi hanno giocato almeno 3 carte, inclusa quella corrente |
| `rimonta` | il proprietario ha meno Vita |
| `magnanimous` | il proprietario ha più Vita |
| `opportunista` | l’avversario investe almeno 5 Focus |
| `sfida` | la Lega della propria carta è inferiore a quella avversaria |
| `sopraffare` | la Lega della propria carta è superiore a quella avversaria |
| `invasione` | il proprietario ha conquistato almeno un Campo |
| `resistenza` | l’avversario ha conquistato almeno un Campo |
| `turbo` | round 1 o 2 |
| `ultimaChance` | round 5 o successivo |
| `rinforzi` | nella mano iniziale esiste almeno un’altra carta della stessa Lega |

## 4.2 Trigger post-duello

Le sole chiavi definite come post-duello sono:

```js
'conquest'
'lastWish'
```

- `conquest`: si attiva se il proprietario vince lo scontro;
- `lastWish`: si attiva se il proprietario perde lo scontro.

Non stabilire manualmente prima del duello se questi trigger sono attivi. Il loro valore emerge dalla simulazione completa.

## 4.3 Modificatori dei Campi

I Campi possono:

- forzare singoli trigger;
- rendere tutti i trigger attivi;
- scambiare Imboscata e Intervento;
- invertire Turbo e Ultima Chance;
- modificare la soglia Overdrive;
- sostituire il trigger dell’abilità;
- raddoppiare Conquista o Ultimo Desiderio;
- cambiare i bonus Armata;
- modificare Potenza, Danno, Focus e spareggi.

Non duplicare queste regole nel motore IA.

Una funzione di classificazione trigger può esistere soltanto per:

- debug;
- spiegazione della scelta;
- prefiltraggio leggero;
- test diagnostici.

Non deve determinare l’esito al posto del motore del duello.

---

# 5. Architettura richiesta

Creare la cartella:

```text
src/game/ai/
├── aiProfiles.js
├── aiConstants.js
├── buildAIContext.js
├── generateAIActions.js
├── simulateAIDuel.js
├── scoreAIAction.js
├── chooseAIAction.js
├── chooseAIField.js
├── aiDebug.js
└── index.js
```

I nomi possono essere leggermente adattati se la struttura esistente suggerisce una collocazione migliore, ma devono restare separati i seguenti compiti:

- costruzione del contesto;
- generazione delle mosse;
- simulazione;
- punteggio;
- eliminazione delle mosse dominate;
- selezione secondo difficoltà;
- adapter React.

## 5.1 Dipendenze consentite

I moduli IA puri possono importare:

- funzioni pure da `src/game/`;
- dati statici da `src/data/`;
- costanti IA;
- helper matematici locali.

Non devono importare:

- React;
- hook;
- componenti UI;
- setter;
- API browser;
- `localStorage`;
- timer.

---

# 6. Trasformare `useAI.js` in un adapter

`src/hooks/useAI.js` non deve più contenere l’intero algoritmo.

Deve occuparsi solo di:

1. leggere `gameState`;
2. costruire il contesto puro;
3. chiamare il motore decisionale;
4. impostare `enemyAgent`;
5. impostare `enemySelectedFocus`;
6. eventualmente impostare il Campo scelto;
7. scrivere un log sintetico;
8. mantenere l’API già usata dall’interfaccia.

Conservare, per compatibilità, almeno:

```js
selectEnemyAgent()
calculateEnemyFocus()
selectEnemyAgentAndFocus()
selectEnemyAgentAdvanced()
getThinkingTime()
```

Tuttavia:

- `selectEnemyAgentAndFocus()` deve diventare il percorso principale;
- `selectEnemyAgent()` e `calculateEnemyFocus()` possono essere wrapper compatibili;
- non devono effettuare due decisioni indipendenti;
- `selectEnemyAgentAdvanced()` non deve restare uno stub.

## 6.1 Compatibilità dei vecchi call site

Cercare tutti i punti in cui vengono chiamate le funzioni dell’hook.

Se alcuni call site fanno:

```js
const agent = selectEnemyAgent();
const focus = calculateEnemyFocus(agent);
```

migrare preferibilmente a:

```js
const decision = selectEnemyAgentAndFocus();
```

Se la migrazione completa non è sicura, conservare temporaneamente la stessa decisione in un `useRef`:

```js
const pendingDecisionRef = useRef(null);
```

- `selectEnemyAgent()` calcola e memorizza una decisione completa;
- `calculateEnemyFocus(agent)` restituisce il Focus della stessa decisione;
- il ref viene invalidato quando cambia uno dei dati decisionali rilevanti.

Non ricalcolare il Focus separatamente.

## 6.2 Forma del risultato

```js
{
  agent: decision.card,
  focus: decision.focus,
  fieldIndex: decision.fieldIndex,
  debug: decision.debug,
}
```

Il campo `debug` può essere omesso in produzione.

---

# 7. Modello del contesto IA

Creare un oggetto puro, senza setter React.

```js
{
  difficulty,
  mode,

  roundNumber,
  lastWinner,
  isPlayerFirst,

  currentFieldIndex,
  field,
  battlefields,
  conqueredFields,
  revealedFields,

  player: {
    hand,
    usedCardIds,
    hp,
    focus,
    armyBonuses,
    toxin,
    selectedCard,
    selectedFocus,
  },

  ai: {
    hand,
    usedCardIds,
    hp,
    focus,
    armyBonuses,
    toxin,
  },

  campaignDuelMod,
}
```

Usare i dati reali disponibili in `useGameState`.

## 7.1 Immutabilità

Il contesto deve:

- referenziare dati in sola lettura oppure copiarli superficialmente;
- non contenere setter;
- non essere modificato durante la generazione dei candidati;
- non mutare carte, mani, Campi o `conqueredFields`.

## 7.2 Validazione del contesto

In sviluppo validare almeno:

- Campo presente quando la carta deve essere scelta;
- mano IA non vuota;
- Focus non negativo;
- carte candidate non già usate;
- valori Focus interi;
- `isPlayerFirst` coerente con l’ordine;
- carta del giocatore presente quando l’IA gioca per seconda.

Non lanciare errori bloccanti in produzione per casi recuperabili. Restituire un fallback legale e scrivere un warning developer.

---

# 8. Generazione delle azioni legali

## 8.1 Struttura

```js
{
  card,
  cardId: card.id,
  focus,
  fieldIndex,
}
```

## 8.2 Carte disponibili

Una carta è disponibile quando il suo `id` non è presente in `enemyUsedCards`.

Non confrontare gli oggetti carta per riferimento. Usare gli ID.

```js
const used = new Set(context.ai.usedCardIds);
const cards = context.ai.hand.filter((card) => !used.has(card.id));
```

## 8.3 Focus legale e riserva strategica

Separare due concetti.

### Limite legale

È il massimo Focus che le regole permettono di assegnare in questo momento.

### Riserva strategica

È il Focus che l’IA preferisce conservare per i turni futuri.

L’attuale formula riserva obbligatoriamente un Focus per ogni carta futura:

```js
enemyFocus - (available.length - 1)
```

Non trattare questa riserva come regola legale a meno che la UI o il regolamento impediscano realmente al giocatore di spendere di più.

Cursor deve verificare il validatore usato dal selettore Focus del giocatore.

- Se il giocatore può spendere tutto, anche l’IA deve poterlo fare.
- Il rischio di restare senza Focus deve essere gestito dal punteggio futuro.
- Letale o Campo decisivo devono poter giustificare un investimento totale.

## 8.4 Generazione dei valori Focus

Per l’IA che gioca per seconda, generare ogni valore intero legale:

```js
for (let focus = minFocus; focus <= maxFocus; focus += 1) {
  actions.push({ card, cardId: card.id, focus, fieldIndex });
}
```

Con un massimo ordinario di 18 Focus e una mano ridotta, il numero di candidati resta contenuto.

Per l’IA che gioca per prima, usare lo stesso insieme iniziale e poi applicare pruning prima di analizzare tutte le risposte avversarie.

Non generare soltanto valori basati sulla Lega. La Lega non deve essere trattata come costo della carta.

## 8.5 Azioni invalide

Escludere:

- Focus inferiore al minimo legale;
- Focus superiore alla risorsa disponibile;
- carta già usata;
- Campo non selezionabile;
- carta nulla;
- Focus non intero.

---

# 9. Simulazione del duello

Creare una funzione pura:

```js
simulateAIDuel(context, aiAction, playerAction)
```

La simulazione deve chiamare:

```js
computeDuelResolution(...)
```

con la prospettiva già usata dal gioco:

```js
const { battleResult } = computeDuelResolution({
  field,

  selectedAgent: playerAction.card,
  enemyAgent: aiAction.card,

  selectedFocus: playerAction.focus,
  enemySelectedFocus: aiAction.focus,

  playerHP: context.player.hp,
  enemyHP: context.ai.hp,

  playerFocus: context.player.focus,
  enemyFocus: context.ai.focus,

  playerUsedCards: context.player.usedCardIds,
  enemyUsedCards: context.ai.usedCardIds,

  isPlayerFirst: context.isPlayerFirst,
  lastWinner: context.lastWinner,

  playerArmyBonuses: context.player.armyBonuses,
  enemyArmyBonuses: context.ai.armyBonuses,

  playerToxin: context.player.toxin,
  enemyToxin: context.ai.toxin,

  roundNumber: context.roundNumber,
  conqueredFields: context.conqueredFields,

  playerHand: context.player.hand,
  enemyHand: context.ai.hand,

  currentFieldIndex: aiAction.fieldIndex,
});
```

## 9.1 Nessuna mutazione

La simulazione non deve:

- modificare `gameState`;
- chiamare setter;
- rimuovere carte dagli array originali;
- modificare gli oggetti carta;
- modificare `conqueredFields`;
- scrivere log visibili per ogni candidato.

I log e gli step visuali prodotti da `computeDuelResolution()` possono essere ignorati durante la valutazione.

## 9.2 Risultato sintetico

Costruire una struttura sintetica:

```js
{
  winner,
  battleResult,

  aiHpBefore,
  aiHpAfter,
  playerHpBefore,
  playerHpAfter,

  aiFocusBefore,
  aiFocusAfter,
  playerFocusBefore,
  playerFocusAfter,

  aiFieldsBefore,
  aiFieldsAfter,
  playerFieldsBefore,
  playerFieldsAfter,

  aiCardsRemaining,
  playerCardsRemaining,

  aiAbilityTriggered,
  playerAbilityTriggered,
  aiBonusTriggered,
  playerBonusTriggered,

  terminalStatus,
}
```

## 9.3 Conteggio dei Campi proiettato

Non aggiornare realmente i Campi.

Calcolare il conteggio proiettato aggiungendo il risultato del Campo corrente al conteggio esistente.

Verificare come il gioco tratta:

- terzo Campo;
- eventuale scelta di reclamare la vittoria;
- continuazione della partita;
- vittoria per Vita;
- vittoria per esaurimento carte.

Non introdurre una regola parallela. Estrarre o riutilizzare lo stesso helper usato dal flusso di gioco.

## 9.4 Prestazioni

`computeDuelResolution()` produce anche log e step visuali. Nella prima implementazione può essere usato senza modificarlo, purché le prestazioni siano accettabili.

Se il profiling mostra un costo elevato, aggiungere opzionalmente un parametro retrocompatibile:

```js
computeDuelResolution({ ..., simulationMode: true })
```

che eviti soltanto la costruzione di dati visuali non necessari, senza cambiare alcuna regola o risultato.

Non ottimizzare preventivamente duplicando la logica.

---

# 10. IA che gioca per seconda

Quando:

```js
context.isPlayerFirst === true
```

la carta e il Focus del giocatore sono già noti.

Questo è il caso più semplice e deve essere implementato per primo.

Per ogni combinazione IA:

```text
carta disponibile × Focus legale
```

1. simulare il duello;
2. calcolare il punteggio;
3. eliminare o penalizzare le mosse dominate;
4. ordinare i candidati;
5. applicare il profilo di difficoltà;
6. scegliere una mossa.

La Difficile deve riconoscere il minimo Focus utile.

Esempio:

- con 3 Focus vince;
- con 4 Focus produce lo stesso vincitore, stesso Danno, stessi effetti e stesso stato utile;
- la mossa da 4 è dominata;
- scegliere 3.

---

# 11. IA che gioca per prima

Quando:

```js
context.isPlayerFirst === false
```

il giocatore non ha ancora scelto la risposta.

L’IA deve valutare come il giocatore potrebbe rispondere usando la mano visibile.

Entrambe le mani sono visibili in SATZE: analizzare le carte avversarie non è barare.

## 11.1 Risposte possibili

Generare azioni del giocatore con:

- carte non usate;
- Focus legale;
- Campo già scelto;
- ordine corretto.

## 11.2 Evitare l’esplosione combinatoria

Non eseguire ingenuamente ogni azione IA contro ogni possibile risposta completa se il numero totale diventa eccessivo.

Usare due passaggi.

### Passaggio A — pre-ranking leggero

Per ogni azione IA calcolare un punteggio preliminare usando:

- statistiche base;
- Focus;
- stato trigger conoscibile prima del duello;
- importanza del Campo;
- Focus speso;
- valore futuro della carta;
- presenza di una condizione terminale evidente.

Questo punteggio non decide l’esito. Serve soltanto a mantenere un insieme limitato di azioni IA da simulare.

### Passaggio B — simulazione reale

Conservare indicativamente:

- Facile: circa 6 azioni IA;
- Normale: circa 10 azioni IA;
- Difficile: circa 14–18 azioni IA.

Per ogni azione conservata, simulare le risposte avversarie secondo il profilo.

## 11.3 Pre-ranking delle risposte avversarie

Per limitare le risposte della Facile e della Normale, usare un ranking leggero dal punto di vista del giocatore.

Non usare il punteggio IA con segno invertito in modo cieco se contiene preferenze specifiche della difficoltà. Creare una valutazione simmetrica dello stato o una funzione:

```js
scoreSimulationForSide(simulation, side)
```

## 11.4 Modello delle risposte

### Facile

- considera una sola risposta plausibile;
- può usare la carta avversaria con migliore forza immediata;
- non applica minimax completo;
- può sottostimare bluff e conservazione risorse.

### Normale

- considera le 3–5 risposte avversarie più forti;
- usa una media prudente tra risposta migliore e risposte probabili;
- non assume sempre la risposta perfetta.

### Difficile

- considera tutte le risposte non dominate o un insieme molto ampio;
- valuta il risultato peggiore ragionevole per l’IA;
- applica minimax a profondità un turno;
- distingue risposte equivalenti per consumo Focus e valore futuro.

Formula suggerita:

```js
robustScore =
  worstResponseScore * profile.worstCaseWeight +
  averageTopResponses * (1 - profile.worstCaseWeight);
```

Valori iniziali:

```js
// Normale
worstCaseWeight = 0.55;

// Difficile
worstCaseWeight = 0.85;
```

---

# 12. Sistema di punteggio

Creare una funzione centralizzata e leggibile:

```js
scoreAIAction(simulation, context, aiAction, profile)
```

Il punteggio deve derivare soprattutto dallo stato finale simulato, non da una stima manuale dell’effetto.

## 12.1 Ordine delle priorità

1. vittoria o sconfitta della partita;
2. terzo Campo o minaccia di terzo Campo;
3. letale o prevenzione del letale;
4. esito del duello;
5. variazione Vita;
6. economia Focus;
7. valore delle carte residue;
8. preparazione dei trigger futuri;
9. efficienza del Focus;
10. varietà controllata prevista dalla difficoltà.

## 12.2 Pesi iniziali consigliati

Questi valori sono una base da calibrare con i test, non regole permanenti.

```js
export const AI_SCORE_WEIGHTS = {
  matchWin: 100000,
  matchLoss: -100000,

  claimVictoryThreshold: 15000,
  opponentClaimThreshold: -17000,

  lethalCreated: 20000,
  lethalPrevented: 15000,

  duelWin: 1400,
  duelLoss: -950,

  damageToPlayerPerPoint: 260,
  damageToAiPerPoint: -300,

  healAiPerPoint: 170,
  healPlayerPerPoint: -180,

  aiFocusRemainingPerPoint: 45,
  playerFocusRemainingPerPoint: -35,

  aiFieldGain: 2400,
  playerFieldGain: -2700,

  activeTriggerTiePreference: 40,
  futureTriggerSetup: 120,

  focusSpentPerPoint: -28,
  wastedFocusPerPoint: -160,

  valuableCardConsumed: -100,
};
```

## 12.3 Evitare doppio conteggio

Gli effetti di:

- Potenza;
- Danno;
- Danno diretto;
- cura;
- recupero Focus;
- rimozione Focus;
- Tossina;
- blocchi;
- copie;
- bonus Armata;

sono già riflessi nel risultato della simulazione.

Non aggiungere nuovamente il valore nominale dell’abilità al punteggio.

Il trigger può ricevere soltanto un piccolo valore di preferenza quando due mosse producono risultati quasi equivalenti.

## 12.4 Vincere il singolo duello non è sempre obbligatorio

Non rendere `duelWin` così alto da impedire sconfitte strategiche.

Una sconfitta può essere corretta quando:

- attiva `lastWish`;
- conserva molti Focus;
- sacrifica una carta poco utile;
- prepara `vendetta`;
- impedisce di consumare una carta necessaria per un altro Campo;
- il Campo ha poco valore;
- il giocatore ha sovrainvestito e l’IA vuole esaurirne le risorse;
- il risultato finale di Vita o Focus è comunque favorevole.

La simulazione deve consentire che una sconfitta ben costruita superi una vittoria inefficiente.

## 12.5 Vittoria per Vita e vittoria per Campi

Il punteggio deve valutare entrambe.

Non assumere che conquistare il Campo sia sempre più importante del Danno. Se l’avversario è prossimo a zero Vita, il letale deve dominare.

Non assumere neppure il contrario: quando il Campo corrente decide la partita, una carta a basso Danno può essere la scelta corretta.

---

# 13. Dominanza ed efficienza Focus

Dopo aver simulato le azioni, eliminare o penalizzare le mosse dominate.

Un’azione A domina B quando:

- usa la stessa carta;
- sullo stesso Campo;
- contro la stessa giocata o lo stesso insieme di risposte;
- spende meno o uguale Focus;
- non produce meno Vita per l’IA;
- non produce più Vita per il giocatore;
- non produce meno Focus residuo per l’IA;
- non produce più Focus residuo per il giocatore;
- non perde un effetto utile;
- non peggiora esito, Campo o trigger futuro.

Esempio:

```text
A: 3 Focus, vittoria, 4 Danni, stessi effetti
B: 5 Focus, vittoria, 4 Danni, stessi effetti
```

B è dominata.

- Difficile: scartare B;
- Normale: scartare o penalizzare fortemente B;
- Facile: può occasionalmente conservare B nella propria fascia di errore.

Non usare semplicemente “Focus minimo per vincere”, perché Focus aggiuntivi possono:

- attivare Overdrive;
- aumentare Danno tramite Campo;
- cambiare il Focus recuperato;
- cambiare il vincitore su Campi speciali;
- proteggere da una risposta prevista;
- produrre un esito post-duello diverso.

Confrontare il risultato completo.

---

# 14. Valore futuro delle carte

Creare una stima leggera del valore residuo della mano.

Non simulare l’intera partita fino alla fine nella prima versione.

Per ogni carta non usata stimare:

```js
futureCardValue =
  baseStatsValue +
  leagueFlexibility +
  triggerFutureAvailability +
  effectUtility;
```

Questa stima serve soltanto a evitare errori evidenti, come consumare:

- una carta da Ultima Chance al round 1 senza necessità;
- una carta da Resa dei conti nei primi round;
- l’unica carta capace di infliggere letale;
- una carta con Conquista quando il recupero Focus sarà più utile in seguito;
- una carta da Intervento quando l’IA prevede di giocare per seconda nel turno seguente.

Non duplicare l’intero punteggio del duello futuro.

## 14.1 Trigger futuri

Attribuire un piccolo bonus di conservazione quando il trigger non è attivo ora ma ha alta probabilità di diventarlo.

Esempi:

- `turbo` perde valore dopo il round 2: non conservarla troppo;
- `ultimaChance` acquista valore verso il round 5;
- `reckoning` acquista valore dal terzo duello;
- `glory` è più interessante se l’IA sta per vincere;
- `vendetta` è più interessante dopo una sconfitta;
- `resistenza` diventa attiva appena l’avversario conquista un Campo;
- `invasione` diventa attiva dopo il primo Campo IA.

## 14.2 Carte senza trigger attivo

Non escludere automaticamente una carta soltanto perché il trigger non è attivo.

Una carta può essere corretta perché:

- ha buone statistiche base;
- infligge letale;
- è il sacrificio meno costoso;
- conserva carte più importanti;
- il Campo annulla o sostituisce comunque il trigger;
- prepara uno stato futuro migliore.

La simulazione completa stabilirà il valore reale della mossa.

---

# 15. Profili delle tre difficoltà

Creare:

```text
src/game/ai/aiProfiles.js
```

Configurazione iniziale suggerita:

```js
export const AI_PROFILES = {
  easy: {
    id: 'easy',
    label: 'Facile',

    ownActionLimitWhenFirst: 6,
    opponentResponseLimit: 1,

    worstCaseWeight: 0.15,
    futurePlanningWeight: 0.15,
    focusEfficiencyWeight: 0.45,

    selectionMode: 'top-band-random',
    topBandRatio: 0.40,
    scoreWindow: 1600,

    useDominanceFilter: false,
    preferExactMinFocus: false,
  },

  medium: {
    id: 'medium',
    label: 'Normale',

    ownActionLimitWhenFirst: 10,
    opponentResponseLimit: 5,

    worstCaseWeight: 0.55,
    futurePlanningWeight: 0.70,
    focusEfficiencyWeight: 0.85,

    selectionMode: 'weighted-top',
    topCount: 3,
    scoreWindow: 550,

    useDominanceFilter: true,
    preferExactMinFocus: true,
  },

  hard: {
    id: 'hard',
    label: 'Difficile',

    ownActionLimitWhenFirst: 18,
    opponentResponseLimit: Infinity,

    worstCaseWeight: 0.85,
    futurePlanningWeight: 1,
    focusEfficiencyWeight: 1,

    selectionMode: 'best',
    scoreWindow: 40,

    useDominanceFilter: true,
    preferExactMinFocus: true,
  },
};
```

I valori devono essere centralizzati e facili da bilanciare.

---

# 16. Comportamento della Facile

La Facile deve sembrare inesperta, non rotta.

Deve sempre:

- rispettare le regole;
- giocare una carta disponibile;
- assegnare un Focus legale;
- conoscere lo stato reale dei trigger;
- non fingere che un trigger inattivo sia attivo;
- riconoscere un letale evidente;
- riconoscere un Campo decisivo evidente;
- non scegliere mosse completamente assurde se esistono alternative ragionevoli.

Può:

- sovrainvestire moderatamente;
- conservare male le carte;
- ignorare alcune risposte avversarie;
- scegliere una mossa nel miglior 40% circa;
- preferire una vittoria immediata poco efficiente;
- usare una carta senza trigger attivo se le statistiche base restano buone;
- commettere errori tattici controllati.

Non deve mai scegliere casualmente fra tutte le carte.

## 16.1 Selezione consigliata

1. ordina i candidati;
2. conserva quelli entro `scoreWindow` dal migliore oppure il miglior 40%;
3. applica pesi decrescenti;
4. usa l’RNG iniettato.

Le condizioni terminali devono prevalere sulla casualità:

- se esiste un letale sicuro, non scegliere una mossa che non chiude senza un motivo eccezionale;
- se esiste un’unica difesa da letale, non ignorarla per casualità pura.

---

# 17. Comportamento della Normale

La Normale è il riferimento del gioco.

Deve:

- valutare tutte le combinazioni carta/Focus quando gioca per seconda;
- riconoscere il minimo Focus efficace;
- usare correttamente i trigger;
- considerare Campo, bonus, Potere e ordine;
- riconoscere spareggi e Lega;
- riconoscere letale e Campo decisivo;
- conservare risorse;
- accettare una sconfitta strategica;
- considerare alcune risposte avversarie quando gioca per prima;
- scegliere prevalentemente fra le migliori tre mosse non dominate.

La casualità deve differenziare partite simili senza trasformare la scelta in rumore.

## 17.1 Selezione consigliata

- filtra le mosse dominate;
- conserva le prime tre entro una finestra di punteggio;
- assegna probabilità indicativa 60% / 27% / 13%;
- se la prima mossa è terminale e le altre non lo sono, scegliere sempre la prima;
- se una mossa previene una sconfitta terminale, non scartarla per casualità.

---

# 18. Comportamento della Difficile

La Difficile deve essere competitiva senza barare.

Deve:

- usare tutte le informazioni visibili;
- simulare esattamente la risposta del giocatore quando gioca per seconda;
- analizzare un insieme molto ampio di risposte quando gioca per prima;
- evitare mosse dominate;
- spendere il minimo Focus equivalente;
- conservare carte chiave;
- preparare trigger futuri;
- forzare sovrainvestimenti avversari;
- riconoscere quando sacrificare un Campo;
- scegliere il percorso migliore fra vittoria per Vita e vittoria per Campi;
- evitare di lasciare un letale evidente;
- essere quasi deterministica a parità di stato.

La Difficile può usare RNG soltanto per rompere pareggi sostanziali.

Non deve:

- vedere carte non visibili;
- conoscere scelte future casuali;
- ricevere Focus extra;
- alterare valori;
- cambiare il risultato dopo la scelta;
- selezionare la risposta conoscendo una scelta ancora nascosta.

---

# 19. Scelta del Campo

L’attuale `useAI.js` gestisce carta e Focus, non necessariamente la scelta del Campo.

Cursor deve cercare nel progetto il punto in cui l’IA seleziona il Campo.

Se la scelta è casuale o separata, sostituirla con:

```js
chooseAIField(context, profile)
```

## 19.1 Campi legali

Usare la stessa logica dell’interfaccia per identificare:

- Campi rivelati;
- Campi non già conquistati;
- Campi selezionabili nel round;
- eventuali restrizioni della campagna;
- modificatori del game mode.

Non duplicare tali regole se esiste già un helper.

## 19.2 Valutazione

Per ogni Campo legale:

- costruire il contesto con quel Campo;
- stimare le migliori azioni IA;
- considerare le risposte previste;
- usare il punteggio risultante.

Profili:

- Facile: casuale pesato tra Campi non pessimi;
- Normale: valuta i Campi con un lookahead ridotto;
- Difficile: valuta Campo + carta + Focus come decisione concatenata.

Se integrare la scelta del Campo nello stesso intervento causa regressioni eccessive, implementarla in un secondo commit, ma non lasciare una scelta casuale come soluzione definitiva.

---

# 20. Debug e spiegabilità

Creare un output developer opzionale.

```js
{
  difficulty: 'hard',
  selected: {
    cardId,
    cardName,
    focus,
    fieldIndex,
    score,
  },
  reasons: [
    'previene letale',
    'vince il Campo con Focus minimo',
    'Overdrive attivo',
    'conserva carta Ultima Chance',
  ],
  candidates: [
    {
      cardId,
      focus,
      score,
      winner,
      aiHpAfter,
      playerHpAfter,
      aiFocusAfter,
      playerFocusAfter,
      dominated,
    },
  ],
}
```

## 20.1 Attivazione

Il debug non deve apparire nell’interfaccia normale.

Possibili modalità:

```js
const AI_DEBUG = import.meta.env.DEV && window.__SATZE_AI_DEBUG__ === true;
```

oppure una costante developer già coerente con il progetto.

## 20.2 Log visibile

Il log normale del duello deve restare sintetico:

```text
[R3] IA schiera Nome Carta con 4 FC
```

Non mostrare al giocatore il punteggio interno o le risposte simulate.

## 20.3 Log console developer

Quando il debug è attivo, produrre una tabella delle prime mosse:

```js
console.table(debug.candidates.slice(0, 10));
```

Non produrre centinaia di log per ogni simulazione.

---

# 21. Cache e determinismo

## 21.1 Cache per singola decisione

Durante una sola decisione, la stessa simulazione può essere richiesta più volte.

Usare una `Map` locale con chiave stabile:

```js
const key = [
  fieldIndex,
  aiCardId,
  aiFocus,
  playerCardId,
  playerFocus,
].join(':');
```

La cache non deve sopravvivere a cambiamenti di stato senza una chiave completa.

Preferire una cache locale alla chiamata di `chooseAIAction()`.

## 21.2 RNG nei test

Creare un helper semplice:

```js
export function createSequenceRng(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
```

Oppure usare un generatore deterministico locale.

Non aggiungere dipendenze.

---

# 22. Test automatici richiesti

Creare test puri in:

```text
src/game/ai/*.test.js
```

Poiché lo script `npm test` attuale non include automaticamente questa cartella nei test Node, aggiornare `package.json` affinché includa:

```text
"src/game/ai/*.test.js"
```

nello script `test` e nello script `test:unit`.

Non spostare i test IA in React se possono essere testati come funzioni pure.

## 22.1 Test di generazione azioni

1. esclude carte già usate;
2. genera soltanto Focus interi legali;
3. permette di investire tutto il Focus quando legalmente consentito;
4. non tratta la riserva strategica come limite legale;
5. genera una singola struttura carta + Focus;
6. non muta mano o stato.

## 22.2 Test trigger e simulazione

7. `imboscata` è valutata correttamente quando l’IA gioca per prima;
8. `intervention` è valutato correttamente quando l’IA gioca per seconda;
9. `glory` usa `lastWinner === 'enemy'`;
10. `vendetta` usa `lastWinner === 'player'`;
11. Overdrive cambia realmente tra soglia - 1 e soglia;
12. il Campo con soglia Overdrive 4 viene rispettato;
13. `opportunista` dipende dal Focus reale del giocatore;
14. `sfida` e `sopraffare` usano le Leghe delle carte realmente contrapposte;
15. `conquest` viene valutata dopo la vittoria;
16. `lastWish` viene valutata dopo la sconfitta;
17. i Campi che rendono i trigger attivi sono rispettati;
18. il Campo che sostituisce il trigger abilità è rispettato;
19. i bonus Armata entrano nella simulazione;
20. blocco e immunità producono lo stesso risultato del duello reale.

## 22.3 Test decisionali fondamentali

21. la Difficile sceglie un letale disponibile;
22. la Normale sceglie un letale disponibile;
23. la Facile non ignora un letale sicuro per casualità pura;
24. la Difficile previene un letale quando esiste una sola difesa;
25. la Difficile conquista il Campo decisivo;
26. la Difficile impedisce il Campo decisivo avversario quando possibile;
27. la Difficile sceglie il minimo Focus che produce lo stesso risultato completo;
28. la Difficile investe Focus aggiuntivo quando questo attiva Overdrive e migliora realmente il risultato;
29. la Difficile non investe Focus aggiuntivo se Overdrive non cambia il risultato;
30. la Normale evita nella maggioranza dei seed una mossa dominata;
31. la Facile può sovrainvestire con un seed controllato, ma la mossa resta legale;
32. una carta con trigger inattivo può essere scelta quando è comunque la migliore mossa;
33. una carta con trigger inattivo non riceve effetti che non si sono attivati;
34. `lastWish` può rendere conveniente una sconfitta;
35. una sconfitta economica può superare una vittoria con sovrainvestimento quando il Campo non è decisivo;
36. lo spareggio viene risolto esattamente come il motore del duello;
37. la Difficile non cambia scelta tra due esecuzioni con lo stesso RNG e stesso stato.

## 22.4 Test IA che gioca per prima

38. la Difficile evita una carta facilmente punibile da una risposta visibile;
39. la Difficile sceglie una mossa robusta contro la risposta migliore;
40. la Normale considera soltanto il numero configurato di risposte;
41. la Facile può sottostimare una risposta, ma non usa informazioni illegali;
42. nessuna difficoltà accede a carte non presenti nella mano visibile;
43. la scelta non dipende da una futura selezione del giocatore non ancora avvenuta.

## 22.5 Test UI e configurazione

44. la schermata mostra esattamente tre difficoltà;
45. `medium` viene mostrata come Normale;
46. `chaos` non viene mostrata;
47. un vecchio valore `chaos` ricade su `medium` oppure viene migrato in modo sicuro;
48. `getThinkingTime()` continua a restituire un valore valido per le tre difficoltà;
49. l’integrazione imposta insieme `enemyAgent` ed `enemySelectedFocus`;
50. non esiste un secondo calcolo Focus indipendente dopo la scelta della carta.

## 22.6 Test di regressione

Eseguire sempre:

```bash
npm test
npm run build
```

Tutti i test esistenti di:

- trigger;
- duello;
- Campi;
- campagna;
- timeline visuale;
- integrazione React;

devono continuare a passare.

---

# 23. Fixture di test consigliate

Creare helper locali per comporre stati piccoli e leggibili.

```js
function makeCard(overrides = {}) {
  return {
    id: 9001,
    name: 'Test Card',
    army: "Figli dell'Orizzonte",
    league: 3,
    power: 3,
    damage: 3,
    ability: null,
    ...overrides,
  };
}
```

```js
function makeAIContext(overrides = {}) {
  return {
    difficulty: 'hard',
    mode: 'classic',
    roundNumber: 1,
    lastWinner: null,
    isPlayerFirst: true,
    currentFieldIndex: 0,
    field: neutralField,
    battlefields: [neutralField],
    conqueredFields: {},
    revealedFields: 1,
    player: { ... },
    ai: { ... },
    campaignDuelMod: null,
    ...overrides,
  };
}
```

Usare Campi reali quando si testano modificatori specifici. Per i test generici usare un Campo neutro compatibile con `computeDuelResolution()`.

Non basare i test su testi descrittivi delle carte. Usare le proprietà strutturate.

---

# 24. API suggerite

## 24.1 `buildAIContext.js`

```js
export function buildAIContext(gameState) {
  // restituisce solo dati puri
}
```

## 24.2 `generateAIActions.js`

```js
export function getAvailableCards(hand, usedCardIds) {}

export function getLegalFocusRange(context, side) {}

export function generateActionsForSide(context, side, fieldIndex) {}
```

## 24.3 `simulateAIDuel.js`

```js
export function simulateAIDuel(context, aiAction, playerAction) {}
```

## 24.4 `scoreAIAction.js`

```js
export function scoreSimulationForSide(simulation, context, side, weights) {}

export function scoreAIAction(simulation, context, aiAction, profile) {}

export function findDominatedActions(scoredActions) {}
```

## 24.5 `chooseAIAction.js`

```js
export function chooseAIAction(context, difficulty, options = {}) {}

export function chooseWhenAIResponds(context, profile, options = {}) {}

export function chooseWhenAILeads(context, profile, options = {}) {}
```

## 24.6 Risultato

```js
{
  card,
  cardId,
  focus,
  fieldIndex,
  score,
  debug,
}
```

---

# 25. Selezione casuale controllata

## 25.1 Facile

Usare una fascia, non tutta la lista.

```js
const threshold = bestScore - profile.scoreWindow;
const pool = sorted.filter((entry) => entry.score >= threshold);
```

Limitare inoltre il pool al miglior 40% circa.

Usare pesi decrescenti, per esempio:

```js
weight = pool.length - index;
```

## 25.2 Normale

Scegliere fra le prime tre mosse non dominate entro la finestra configurata.

## 25.3 Difficile

Scegliere la migliore mossa.

In caso di punteggio sostanzialmente pari:

1. preferire meno Focus;
2. preferire la carta con minor valore futuro consumato;
3. preferire la mossa più robusta;
4. usare RNG soltanto se resta una parità effettiva.

---

# 26. Criteri di confronto tra mosse equivalenti

Quando due mosse hanno punteggio molto vicino, applicare nell’ordine:

1. vittoria terminale;
2. prevenzione di sconfitta terminale;
3. miglior conteggio Campi;
4. maggior Vita IA;
5. minor Vita giocatore;
6. maggior Focus IA residuo;
7. minor Focus giocatore residuo;
8. minor Focus investito;
9. miglior valore residuo della mano;
10. minor varianza contro risposte avversarie;
11. RNG.

Centralizzare questo ordinamento in una funzione di confronto.

---

# 27. Gestione dei casi limite

## 27.1 Nessuna carta disponibile

Restituire `null` e lasciare che il flusso di gioco gestisca la fine partita.

## 27.2 Nessun Focus disponibile

Usare la stessa regola del giocatore. Non inventare Focus.

Se il gioco richiede almeno 1 Focus ma lo stato è 0, trattare il caso come stato terminale o incoerente secondo la logica esistente.

## 27.3 Carta del giocatore non disponibile quando l’IA risponde

Non simulare con valori inventati.

- in development: warning chiaro;
- fallback: scelta legale prudente oppure nessuna scelta;
- correggere il call site se l’IA viene invocata nella fase sbagliata.

## 27.4 Campo nullo

Non chiamare `computeDuelResolution()` senza Campo.

## 27.5 Dati carta non validi

Usare `validateAbilityShape()` in sviluppo. Una carta con trigger sconosciuto non deve far crashare l’intera partita.

## 27.6 Campagna

Passare tutti i modificatori già applicati al duello. Non ignorare `campaignDuelMod` se influenza le azioni legali o il risultato.

---

# 28. Aggiornamenti UI

Modificare:

```text
src/utils/aiConstants.js
src/components/menu/cosmic/DifficultySelectPopup.jsx
```

ed eventuali altri riferimenti.

## 28.1 Configurazione desiderata

```js
export const AI_DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Senza occhi',
    description: 'Facile',
    longDescription: 'Gioca correttamente, ma pianifica poco e commette errori tattici.',
  },

  medium: {
    id: 'medium',
    name: 'Mezzo ubriaco',
    description: 'Normale',
    longDescription: 'Valuta trigger, Campi e risorse con una strategia equilibrata.',
  },

  hard: {
    id: 'hard',
    name: 'Sfavorito',
    description: 'Difficile',
    longDescription: 'Analizza le risposte visibili, conserva risorse e punisce gli errori.',
  },
};
```

Rimuovere da questa configurazione i vecchi parametri non più usati:

- `agentStrategy`;
- `focusMultiplier`;
- `focusVariance`.

La strategia deve vivere in `src/game/ai/aiProfiles.js`, non nei dati UI.

---

# 29. Piano di implementazione consigliato

## Fase 1 — Motore puro per IA che risponde

1. creare `src/game/ai/`;
2. costruire il contesto;
3. generare carta + Focus;
4. simulare con `computeDuelResolution()`;
5. creare punteggio base;
6. implementare Normale;
7. aggiungere test fondamentali.

Questa fase deve già correggere il problema dei trigger e del Focus incoerente.

## Fase 2 — Profili Facile e Difficile

1. centralizzare i profili;
2. aggiungere dominanza;
3. aggiungere casualità iniettata;
4. aggiungere conservazione risorse;
5. aggiungere test differenziati.

## Fase 3 — IA che gioca per prima

1. generare risposte avversarie;
2. aggiungere pruning;
3. aggiungere valutazione robusta/minimax;
4. aggiungere cache;
5. aggiungere test di risposta visibile.

## Fase 4 — Scelta del Campo

1. trovare l’attuale punto di selezione;
2. estrarre regole di legalità;
3. valutare Campo + mossa;
4. integrare i tre profili.

## Fase 5 — Pulizia e UI

1. rimuovere vecchia logica euristica;
2. rimuovere `chaos` dalla UI;
3. aggiornare descrizioni;
4. aggiornare log;
5. eseguire test e build.

Ogni fase deve lasciare il progetto funzionante.

---

# 30. Cose da non fare

Non:

- riscrivere `computeDuelResolution()` dentro l’IA;
- duplicare la tabella dei trigger;
- usare il testo `description` per capire un effetto;
- scegliere la carta e il Focus separatamente;
- usare `Math.random()` direttamente nella logica pura;
- dare Focus extra alla Difficile;
- rendere la Facile completamente casuale;
- escludere automaticamente tutte le carte con trigger inattivo;
- assumere che vincere il duello sia sempre la scelta migliore;
- assumere che la Lega sia il costo Focus;
- mutare `gameState` durante le simulazioni;
- stampare i log di ogni simulazione nell’interfaccia;
- aggiungere dipendenze per un algoritmo gestibile con JavaScript puro;
- cambiare le regole dei trigger per adattarle all’IA;
- rompere tutorial o multiplayer.

---

# 31. Criteri di accettazione funzionali

L’intervento è accettato soltanto se tutti i punti seguenti sono veri.

## 31.1 Correttezza

- [ ] Carta e Focus sono scelti insieme.
- [ ] La simulazione usa `computeDuelResolution()`.
- [ ] I trigger usano le condizioni reali del gioco.
- [ ] `conquest` e `lastWish` vengono valutati post-duello.
- [ ] I modificatori dei Campi sono rispettati.
- [ ] I bonus Armata sono rispettati.
- [ ] Gli spareggi sono identici al duello reale.
- [ ] L’IA non usa carte già giocate.
- [ ] L’IA non investe Focus illegale.

## 31.2 Difficoltà

- [ ] La Facile è subottimale ma sensata.
- [ ] La Normale è il comportamento standard competente.
- [ ] La Difficile evita sovrainvestimenti equivalenti.
- [ ] La Difficile considera le risposte della mano visibile.
- [ ] La Difficile non riceve vantaggi nascosti.
- [ ] Le tre difficoltà producono scelte diverse in scenari non terminali.
- [ ] Le tre difficoltà riconoscono letali e difese obbligate.

## 31.3 Qualità tecnica

- [ ] Il motore IA è testabile senza React.
- [ ] L’RNG è iniettabile.
- [ ] `useAI.js` è un adapter, non il motore completo.
- [ ] Non esiste una seconda implementazione delle regole del duello.
- [ ] I pesi sono centralizzati.
- [ ] I profili sono centralizzati.
- [ ] Le simulazioni non mutano lo stato.
- [ ] I test IA sono inclusi in `npm test`.
- [ ] `npm test` passa.
- [ ] `npm run build` passa.

## 31.4 UI

- [ ] La selezione mostra Facile, Normale e Difficile.
- [ ] Non mostra Chaos.
- [ ] `medium` è presentata come Normale.
- [ ] Le descrizioni spiegano differenze reali, non bonus artificiali.

---

# 32. Criteri di accettazione osservabili durante il playtest

Dopo l’implementazione, giocare almeno 15 partite per difficoltà, usando più Armate.

Verificare che:

### Facile

- commetta errori riconoscibili;
- non giochi sistematicamente carte fuori trigger senza motivo;
- non sembri casuale pura;
- lasci spesso margine al giocatore;
- talvolta sprechi Focus, ma non sempre.

### Normale

- usi frequentemente trigger attivi;
- rinunci a Campi troppo costosi;
- conservi Focus per i turni successivi;
- riconosca le risposte evidenti;
- sia battibile ma non passiva.

### Difficile

- punisca un investimento Focus eccessivo;
- usi il minimo Focus efficace;
- conservi carte ad alto valore futuro;
- scelga sacrifici sensati;
- difenda letali e Campi decisivi;
- non sembri onnisciente quando gioca per prima;
- non mostri pattern identici in ogni partita quando esistono mosse equivalenti.

Registrare eventuali esempi problematici con:

- round;
- Campo;
- mani;
- carte già usate;
- Vita;
- Focus;
- ordine di giocata;
- carta e Focus scelti;
- risultato atteso.

Il debug IA deve consentire di ricostruire la decisione.

---

# 33. Bilanciamento successivo

Non cercare il bilanciamento perfetto nel primo commit.

La priorità è:

1. correttezza delle regole;
2. scelta congiunta carta + Focus;
3. simulazione reale;
4. differenziazione delle difficoltà;
5. prestazioni;
6. calibrazione dei pesi.

Dopo i playtest, i parametri da regolare devono essere concentrati in:

```text
src/game/ai/aiProfiles.js
src/game/ai/aiConstants.js
```

Non disseminare numeri magici nei moduli.

---

# 34. Output finale richiesto a Cursor

Al termine dell’implementazione, fornire:

1. riepilogo delle modifiche;
2. elenco dei file creati;
3. elenco dei file modificati;
4. spiegazione sintetica del flusso decisionale;
5. differenze tra Facile, Normale e Difficile;
6. risultati di `npm test`;
7. risultato di `npm run build`;
8. eventuali compromessi prestazionali;
9. eventuali passaggi di playtest manuale ancora consigliati.

Non dichiarare completata l’implementazione se i test o la build falliscono.

---

# 35. Sintesi operativa

La modifica più importante è questa:

```text
VECCHIO
scegli carta → calcola Focus → applica la mossa

NUOVO
crea tutte le coppie carta + Focus → simula il duello reale → assegna punteggio → scegli secondo difficoltà
```

La nuova IA deve condividere le stesse regole del giocatore. La Facile deve pianificare poco, la Normale deve pianificare bene, la Difficile deve analizzare più risposte e usare meglio le risorse.

La difficoltà non deve mai derivare dal fatto che una IA “capisce” i trigger e un’altra no: **tutte devono capire correttamente i trigger**.
