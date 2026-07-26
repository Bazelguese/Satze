# SATZE — IA STRATEGICA COMPLETA
## Specifica definitiva per Cursor

**Scopo:** sostituire il centro decisionale dell’IA attuale con un planner strategico completo, capace di analizzare le informazioni pubbliche della partita, scegliere congiuntamente Campo–carta–Focus, pianificare su più round e amministrare le risorse senza barare.

Il sistema deve riutilizzare il motore di duello esistente e non deve modificare le regole di SATZE.

---

# 1. Obiettivo generale

L’IA deve passare da:

```text
“Qual è la mossa più forte nel duello corrente?”
```

a:

```text
“Quale sequenza di decisioni mi offre la migliore probabilità di vincere la partita?”
```

L’IA deve essere in grado di:

- leggere e interpretare tutte le informazioni pubbliche;
- conoscere entrambe le mani quando sono pubblicamente visibili;
- amministrare PV, Focus Coin, carte e Campi;
- valutare trigger attivi, futuri, scaduti e preparabili;
- scegliere Campo, carta e Focus come un’unica azione;
- prevedere risposte plausibili senza leggere informazioni nascoste;
- pianificare uno o più round;
- effettuare sacrifici intenzionali;
- conservare carte per finestre strategiche future;
- riconoscere letali, terzo Campo e situazioni terminali;
- distinguere Facile, Normale e Difficile tramite qualità della ricerca, non tramite vantaggi informativi.

---

# 2. Regola assoluta sulle informazioni

## 2.1 Informazioni pubbliche utilizzabili

L’IA può conoscere:

- la propria mano;
- la mano del giocatore, se visibile secondo le regole di SATZE;
- tutte le carte già utilizzate;
- PV dei due giocatori;
- Focus Coin totali rimasti;
- Campi rivelati;
- Campi conquistati;
- Campo corrente;
- ordine di gioco;
- vincitore del duello precedente;
- round corrente;
- Bonus Armata;
- Tossina;
- effetti persistenti pubblici;
- modificatori della Campagna;
- carta avversaria corrente soltanto se già pubblicamente schierata.

## 2.2 Informazioni vietate

L’IA non deve conoscere o usare:

- Focus Coin segretamente investiti dal giocatore nel duello corrente;
- carta non ancora rivelata;
- valore d’assalto provvisorio derivato da dati nascosti;
- dati UI privati;
- animazioni o log da cui dedurre informazioni segrete;
- risultati futuri;
- RNG futuro;
- stato interno non pubblico.

## 2.3 Invariante obbligatoria

A parità di informazioni pubbliche e RNG, modificare:

```js
gameState.selectedFocus
```

non deve cambiare:

- Campo scelto;
- carta scelta;
- Focus scelto dall’IA;
- punteggio;
- rami di ricerca;
- cache;
- debug decisionale.

---

# 3. Architettura richiesta

Riorganizzare `src/game/ai/` così:

```text
src/game/ai/
├── information/
│   ├── buildAIInformationSet.js
│   ├── validateAIInformationSet.js
│   └── publicStateHash.js
│
├── actions/
│   ├── generateJointActions.js
│   ├── generateStrategicFocusCandidates.js
│   ├── generateOpponentScenarios.js
│   └── actionDiversity.js
│
├── planning/
│   ├── searchGameTree.js
│   ├── expandState.js
│   ├── beamSearch.js
│   ├── transpositionTable.js
│   ├── searchBudget.js
│   └── terminalSolver.js
│
├── evaluation/
│   ├── evaluateState.js
│   ├── evaluateTerminal.js
│   ├── evaluateTerritory.js
│   ├── evaluateFocusEconomy.js
│   ├── evaluateHand.js
│   ├── evaluateMatchups.js
│   ├── evaluateTriggers.js
│   ├── evaluateInitiative.js
│   ├── evaluateBattlefields.js
│   ├── evaluateFlexibility.js
│   └── evaluateRisk.js
│
├── simulation/
│   ├── simulatePublicDuel.js
│   ├── projectPostDuelState.js
│   ├── projectNextRound.js
│   └── buildScenarioResult.js
│
├── profiles/
│   └── aiProfiles.js
│
├── diagnostics/
│   ├── aiDebug.js
│   ├── aiMetrics.js
│   └── explainDecision.js
│
├── chooseAIAction.js
├── chooseAIField.js
├── aiConstants.js
└── index.js
```

Non è obbligatorio creare tutti i file in un unico commit, ma questa deve essere la destinazione architetturale.

---

# 4. Fonte di verità del duello

`computeDuelResolution()` deve restare la fonte unica per:

- Potenza;
- Danno;
- VA;
- Poteri;
- Bonus;
- trigger;
- effetti dei Campi;
- vincitore;
- PV finali;
- Focus finali;
- Tossina;
- effetti post-duello.

Non duplicare né approssimare il motore del duello nei moduli IA.

Le valutazioni leggere possono essere usate soltanto per pruning e ordinamento preliminare. La decisione finale deve dipendere da simulazioni reali.

---

# 5. Information Set pubblico

Creare:

```js
buildAIInformationSet(gameState)
```

Output suggerito:

```js
{
  difficulty,
  mode,
  roundNumber,
  lastWinner,
  initiativeSide,

  fields: {
    battlefields,
    revealedIndexes,
    conqueredFields,
    legalIndexes,
    currentFieldIndex,
    currentField
  },

  player: {
    hp,
    focusPool,
    visibleHand,
    usedCardIds,
    visibleCurrentCard,
    armyBonuses,
    toxin
  },

  ai: {
    hp,
    focusPool,
    hand,
    usedCardIds,
    armyBonuses,
    toxin
  },

  campaignDuelMod
}
```

Il valore deve essere:

- immutabile;
- serializzabile;
- privo di setter React;
- privo di `selectedFocus` del giocatore;
- privo di alias privati;
- adatto a hashing e cache.

---

# 6. Stato strategico

Lo stato della ricerca deve rappresentare l’intera partita:

```js
{
  roundNumber,
  initiativeSide,
  lastWinner,

  playerHP,
  aiHP,

  playerFocus,
  aiFocus,

  playerRemainingCardIds,
  aiRemainingCardIds,

  playerUsedCardIds,
  aiUsedCardIds,

  conqueredFields,
  revealedFields,
  availableFieldIndexes,

  playerToxin,
  aiToxin,

  persistentEffects,

  terminalStatus
}
```

Lo stato non deve contenere informazioni segrete correnti.

---

# 7. Azione congiunta

Quando l’IA possiede l’iniziativa, l’azione deve essere:

```js
{
  fieldIndex,
  cardId,
  focus
}
```

Il motore deve confrontare direttamente:

```text
Campo A + Carta X + 4 FC
Campo B + Carta Y + 1 FC
Campo C + Carta Z + 5 FC
```

Non scegliere il Campo in modo definitivo prima di carta e Focus.

Quando il Campo è già stabilito, l’azione diventa:

```js
{
  fieldIndex: currentFieldIndex,
  cardId,
  focus
}
```

---

# 8. Focus strategici

Non enumerare ciecamente tutti i valori da 1 al massimo durante ogni livello della ricerca.

Creare:

```js
generateStrategicFocusCandidates({
  side,
  card,
  state,
  field,
  profile
})
```

La funzione deve considerare:

1. `1 FC`;
2. quota economica;
3. quota equa;
4. investimento standard;
5. soglia Overdrive effettiva;
6. punti di svolta del Campo;
7. investimento di pressione;
8. cap ordinario;
9. massimo legale soltanto se strategicamente giustificato.

Formula base:

```js
fairShare = Math.ceil(focusPool / cardsRemaining);
```

Valori iniziali:

```text
Facile:
standard = fairShare
ordinaryCap = fairShare + 0

Normale:
standard = fairShare + 1
ordinaryCap = fairShare + 2

Difficile:
standard = fairShare + 2
ordinaryCap = fairShare + 3
```

Il massimo legale è incluso soltanto in caso di:

- ultima carta;
- possibile letale;
- possibile terzo Campo terminale;
- prevenzione di una sconfitta immediata;
- Campo `winnerByFocusNotVa`;
- effetto di Campagna esplicito;
- situazione terminale calcolata.

---

# 9. Modello dell’avversario

L’IA deve prevedere risposte plausibili senza conoscere il Focus reale.

Creare:

```js
generateOpponentScenarios({
  informationSet,
  strategicState,
  visibleOpponentCard,
  field,
  profile
})
```

## 9.1 Carta avversaria visibile

Se la carta è pubblica:

- generare scenari soltanto per quella carta;
- variare i Focus plausibili;
- non usare il Focus reale.

## 9.2 Carta non visibile

Se la carta non è pubblica:

- considerare tutte le carte ancora disponibili;
- applicare pruning per matchup e rilevanza;
- conservare almeno uno scenario per ogni carta strategicamente distinta.

## 9.3 Fasce Focus

Scenari:

```text
sacrificio
economico
standard
pressione
Overdrive
alto
massimo soltanto se plausibile
```

## 9.4 Probabilità iniziali

### Facile

```js
{
  sacrifice: 0.20,
  economical: 0.35,
  standard: 0.35,
  pressure: 0.10
}
```

### Normale

```js
{
  sacrifice: 0.10,
  economical: 0.25,
  standard: 0.40,
  pressure: 0.20,
  high: 0.05
}
```

### Difficile

```js
{
  sacrifice: 0.10,
  economical: 0.20,
  standard: 0.35,
  pressure: 0.25,
  high: 0.10
}
```

Le probabilità devono essere modificate da:

- round;
- Focus rimasti;
- carte rimaste;
- possibile letale;
- terzo Campo;
- Overdrive;
- caratteristiche della carta;
- Campo;
- comportamento pubblico passato, se sarà implementato un modello adattivo.

---

# 10. Ricerca a più turni

Creare:

```js
searchGameTree(rootState, options)
```

La ricerca deve alternare:

```text
decisione IA
scenari avversari
risoluzione duello
nuovo stato
iniziativa successiva
nuova scelta Campo
```

## 10.1 Profondità dinamica

### Facile

```text
duello corrente
+ valutazione statica del prossimo stato
```

### Normale

```text
duello corrente
+ 1 round futuro completo
```

### Difficile

```text
duello corrente
+ 2 round futuri
```

Quando restano:

```text
3 carte → aumentare profondità
2 carte → cercare fino alla fine
1 carta → soluzione terminale completa
```

## 10.2 Orizzonte terminale

Se la ricerca trova:

- PV a zero;
- terzo Campo terminale;
- fine carte;
- stato di vittoria o sconfitta certa;

deve interrompere quel ramo.

---

# 11. Algoritmo di ricerca

Usare una combinazione di:

- expectiminimax per scenari probabilistici;
- beam search per contenere la crescita;
- transposition table;
- pruning per dominanza sicura;
- terminal solver negli ultimi round.

Formula generale:

```js
actionValue =
  expectedValue * expectedWeight +
  lowerPercentileValue * riskWeight;
```

Valori iniziali:

```text
Facile:
expectedWeight = 0.95
riskWeight = 0.05

Normale:
expectedWeight = 0.80
riskWeight = 0.20

Difficile:
expectedWeight = 0.65
riskWeight = 0.35
```

Non usare il caso peggiore assoluto come criterio dominante in apertura.

---

# 12. Beam search

Dopo ogni livello conservare:

```text
Facile: 4–6 rami
Normale: 10–16 rami
Difficile: 24–48 rami
```

La selezione del beam deve preservare diversità:

- almeno un ramo per carta rilevante;
- almeno un ramo economico;
- almeno un ramo aggressivo;
- almeno un sacrificio plausibile;
- almeno un Campo alternativo, se l’IA sceglie il Campo.

Non riempire il beam con varianti quasi identiche della stessa carta.

---

# 13. Transposition table

Creare una cache basata su hash dello stato pubblico:

```text
round
iniziativa
PV
FC
carte rimaste
carte usate
Campi conquistati
Campi disponibili
Tossina
effetti persistenti
```

Non includere dati privati.

Ogni entry deve registrare:

```js
{
  depth,
  value,
  bestAction,
  terminalStatus
}
```

Riutilizzare una entry soltanto se la profondità già calcolata è almeno pari a quella richiesta.

---

# 14. Valutazione dello stato

Creare:

```js
evaluateState(state, perspective, profile)
```

Il punteggio deve essere composto da moduli separati.

## 14.1 Terminale

Valori dominanti:

```text
vittoria partita: +1.000.000
sconfitta partita: -1.000.000
```

Le altre componenti non devono superare una condizione terminale.

## 14.2 PV

Valutare:

- danni inflitti;
- danni subiti;
- distanza dal letale;
- soglie di rischio;
- cure;
- danni diretti futuri disponibili.

Usare un valore non lineare: perdere PV vicino allo zero deve pesare più che perdere gli stessi PV a Vita piena.

## 14.3 Territorio

Valutare:

- Campi conquistati;
- secondo Campo;
- terzo Campo;
- Campi disponibili;
- qualità dei Campi futuri;
- possibilità di negare un Campo favorevole al nemico.

## 14.4 Focus

Valutare:

- Focus rimasti;
- Focus per carta;
- capacità di attivare Overdrive;
- rischio di esaurimento;
- Focus recuperabili;
- pressione economica sull’avversario;
- sovrainvestimento;
- Focus inutilizzati a fine partita.

## 14.5 Mano

Valutare:

- forza corrente;
- forza futura;
- flessibilità;
- copertura dei matchup;
- trigger ancora utilizzabili;
- carta migliore conservata;
- carte con finestre in scadenza.

## 14.6 Matchup

Costruire una matrice dinamica tra carte rimaste:

```text
propria carta
contro
carta avversaria
su Campo
con fasce Focus
```

La matrice deve derivare da simulazioni reali ridotte.

## 14.7 Trigger

Valutare:

- attivo ora;
- attivabile;
- preparato dal risultato corrente;
- probabile nel prossimo round;
- in scadenza;
- ormai impossibile;
- sinergia con Campo;
- sinergia con Bonus;
- valore reale dell’effetto.

## 14.8 Iniziativa

Valutare:

- diritto di scegliere il Campo successivo;
- qualità media dei Campi disponibili;
- trigger attivati dalla vittoria o dalla sconfitta;
- capacità di imporre un matchup;
- valore di un sacrificio.

## 14.9 Flessibilità

Premiare stati che mantengono:

- più carte giocabili;
- distribuzione FC sostenibile;
- più trigger aperti;
- più risposte a carte nemiche;
- minore dipendenza da un singolo risultato.

---

# 15. Economia Focus e overkill

## 15.1 Penalità sovrainvestimento

```js
excess = Math.max(0, focus - standardFocus);

penalty =
  excess * linearPenalty +
  excess * excess * quadraticPenalty;
```

Moltiplicatore round:

```text
R1: 1,50
R2: 1,25
R3: 1,00
R4: 0,70
R5: 0,35
```

## 15.2 Overkill

Per ogni scenario:

```js
overkill = Math.max(0, aiVA - opponentVA - safetyMargin);
```

Poiché il Focus reale è nascosto, calcolare l’overkill sugli scenari simulati, non sulla scelta reale.

Premiare:

- margine sufficiente;
- vittoria efficiente.

Penalizzare:

- margine enorme non necessario;
- spesa che non cambia probabilità di vittoria;
- spesa che riduce drasticamente il budget futuro.

---

# 16. Sacrificio strategico

L’IA deve riconoscere un sacrificio valido quando:

- investe poco;
- usa una carta dal basso valore futuro;
- il danno subito è accettabile;
- ottiene iniziativa;
- prepara Vendetta o altri trigger;
- conserva una risposta importante;
- migliora il valore atteso dei round successivi.

Creare:

```js
evaluateStrategicLoss(currentResult, projectedState)
```

Non etichettare automaticamente ogni sconfitta come strategica.

Il debug deve indicare:

```text
Sacrificio intenzionale:
- costo 1 FC
- danno previsto 2
- iniziativa ottenuta
- Vendetta preparata
- Campo futuro favorevole
```

---

# 17. Pianificazione dei trigger

Il motore deve riconoscere catene:

```text
perdo ora
→ ottengo iniziativa
→ attivo Vendetta
→ scelgo Campo favorevole
→ gioco carta reattiva
```

```text
vinco ora
→ attivo Gloria
→ conservo carta che usa Gloria
```

```text
conquisto primo Campo
→ attivo Invasione
```

```text
spendo poco
→ mantengo soglia Overdrive futura
```

```text
conservo Ultima Chance
→ la uso nel round finale
```

Il valore deve emergere dalla proiezione dei futuri stati, non soltanto da bonus fissi.

---

# 18. Profili di difficoltà

## 18.1 Facile

```js
{
  searchDepth: 0,
  beamWidth: 6,
  opponentScenarioCount: 2,
  jointActionLimit: 20,
  riskWeight: 0.05,
  randomness: 0.35,
  preserveActionDiversity: true,
  useStrategicSacrifice: false,
  useDeepTriggerPlanning: false,
  solveEndgameAtCardsRemaining: 1
}
```

Comportamento:

- mosse legali e credibili;
- economia di base;
- comprende trigger immediati;
- casualità tra mosse ragionevoli;
- nessuno spreco estremo sistematico.

## 18.2 Normale

```js
{
  searchDepth: 1,
  beamWidth: 14,
  opponentScenarioCount: 4,
  jointActionLimit: 48,
  riskWeight: 0.20,
  randomness: 0.12,
  preserveActionDiversity: true,
  useStrategicSacrifice: true,
  useDeepTriggerPlanning: true,
  solveEndgameAtCardsRemaining: 2
}
```

Comportamento:

- valuta tutte le carte;
- pianifica un round;
- comprende iniziativa;
- conserva risorse;
- usa sacrifici;
- può sbagliare tra alternative vicine.

## 18.3 Difficile

```js
{
  searchDepth: 2,
  beamWidth: 36,
  opponentScenarioCount: 8,
  jointActionLimit: 96,
  riskWeight: 0.35,
  randomness: 0.01,
  preserveActionDiversity: true,
  useStrategicSacrifice: true,
  useDeepTriggerPlanning: true,
  solveEndgameAtCardsRemaining: 3
}
```

Comportamento:

- ricerca più profonda;
- valuta Campo–carta–Focus insieme;
- analizza matchup;
- pianifica catene di trigger;
- risolve il finale;
- non bara.

---

# 19. Ordinamento e tie-break

Il punteggio complessivo deve essere il criterio principale.

```js
if (Math.abs(a.score - b.score) > SCORE_TIE_EPSILON) {
  return b.score - a.score;
}
```

Tie-break entro epsilon:

1. vittoria terminale;
2. evitare sconfitta terminale;
3. meno Focus;
4. più Focus rimasti;
5. più PV;
6. maggiore flessibilità;
7. trigger attivo;
8. id stabile.

---

# 20. Dominanza sicura

Una mossa A può dominare B soltanto se:

- stessa carta;
- stesso Campo;
- stessi scenari avversari;
- A usa meno o uguale Focus;
- A non peggiora nessun esito;
- A non perde trigger;
- A non peggiora probabilità di vittoria;
- A non peggiora stato futuro;
- almeno un aspetto è strettamente migliore.

Non applicare dominanza confrontando risposte rappresentative differenti.

---

# 21. Integrazione React

`src/hooks/useAI.js` deve diventare un adapter sottile.

Responsabilità consentite:

- costruire information set;
- invocare il planner;
- memorizzare la decisione;
- impostare carta e Focus;
- logging;
- tempo di pensiero.

Non deve contenere:

- logica strategica;
- calcolo Focus;
- punteggi;
- trigger duplicati;
- accesso al Focus privato del giocatore.

La chiave della cache non deve includere `selectedFocus`.

---

# 22. Prestazioni

Budget indicativi desktop:

```text
Facile: < 30 ms
Normale: < 150 ms
Difficile: < 700 ms
Finale Difficile: < 1500 ms
```

Se necessario:

- usare Web Worker;
- suddividere la ricerca;
- mostrare animazione di pensiero;
- interrompere alla scadenza del budget;
- restituire la migliore mossa trovata finora.

La ricerca deve essere deterministica con RNG iniettato.

---

# 23. Debug decisionale

Con:

```js
window.__SATZE_AI_DEBUG__ = true
```

mostrare:

```text
Difficoltà
Profondità
Nodi esplorati
Cache hit
Tempo
Campo
Carta
Focus
Quota equa
Cap ordinario
Eccezione
Valore atteso
Valore prudente
PV
Territorio
Focus economy
Mano
Matchup
Trigger
Iniziativa
Flessibilità
Overkill
Motivo sintetico
```

Esempio:

```text
Scelta: Centrale Energetica + Carta X + 5 FC

Motivi:
- Overdrive attivo
- investimento vicino alla quota sostenibile
- 13 FC conservati
- buona copertura delle carte avversarie
- prepara Invasione
- nessun overkill rilevante
```

---

# 24. Metriche di playtest

Registrare:

- Focus medio per round;
- mediana e 95° percentile;
- all-in;
- overkill medio;
- carte con trigger inattivo;
- sacrifici da 1 FC;
- Focus rimasti a fine partita;
- sconfitte con Focus eccessivi inutilizzati;
- sconfitte per esaurimento precoce;
- scelta Campi;
- vittorie per iniziativa iniziale;
- vittorie per Armata;
- tempo medio di calcolo;
- nodi esplorati;
- cache hit rate.

---

# 25. Simulatore IA contro IA

Creare uno strumento development-only:

```text
scripts/run-ai-simulations.mjs
```

Parametri:

```text
--games
--difficulty-a
--difficulty-b
--army-a
--army-b
--seed
--output
```

Output JSON/CSV:

- risultato;
- durata;
- Focus per round;
- Campi;
- trigger;
- all-in;
- overkill;
- errori;
- tempo IA.

Eseguire almeno:

```text
100 partite Facile vs Normale
100 partite Normale vs Normale
100 partite Normale vs Difficile
100 partite Difficile vs Difficile
```

---

# 26. Test obbligatori

## Informazioni

1. decisione invariata cambiando `selectedFocus`;
2. information set privo di Focus privato;
3. cache hash invariato;
4. Campo invariato;
5. Proxy test che fallisce se il dato privato viene letto.

## Focus

6. Normale R1 con 18 FC e 5 carte: investimento ordinario <= 6;
7. Difficile stessa situazione: ordinario <= 7;
8. 12 FC vietati senza eccezione;
9. Overdrive può superare il cap di 1;
10. ultima carta può usare tutto;
11. terzo Campo può superare il cap;
12. Campo winnerByFocus può superare il cap.

## Azioni

13. ogni carta ha almeno un candidato;
14. shortlist diversificata;
15. Campo–carta–Focus valutati insieme;
16. nessuna carta monopolizza il beam;
17. varianti economiche conservate.

## Pianificazione

18. conserva Ultima Chance;
19. usa Turbo prima della scadenza;
20. prepara Vendetta;
21. sfrutta Gloria;
22. riconosce Invasione;
23. mantiene Overdrive futuro;
24. effettua sacrificio vantaggioso;
25. rifiuta sacrificio senza vantaggio.

## Terminale

26. trova letale;
27. trova terzo Campo;
28. impedisce letale;
29. impedisce terzo Campo;
30. risolve finale a due carte.

## Valutazione

31. score prima dei tie-break;
32. penalizza overkill;
33. preferisce vittoria efficiente;
34. non presume all-in;
35. valuta iniziativa;
36. valuta flessibilità;
37. valuta Campo futuro.

## Prestazioni

38. rispetta budget Facile;
39. rispetta budget Normale;
40. rispetta budget Difficile;
41. cache riutilizzata;
42. risultati deterministici con seed.

---

# 27. Criteri di accettazione

Il sistema è accettato quando:

1. l’IA non legge Focus segreti;
2. non effettua abitualmente all-in iniziali;
3. sceglie Campo–carta–Focus congiuntamente;
4. la Normale pianifica almeno un round;
5. la Difficile pianifica almeno due round;
6. il finale viene cercato fino alla conclusione;
7. l’IA comprende l’iniziativa;
8. può perdere intenzionalmente con uno scopo;
9. conserva carte per trigger futuri;
10. usa il vero motore di duello;
11. ogni difficoltà usa le stesse informazioni;
12. le difficoltà cambiano profondità e precisione;
13. il debug spiega le decisioni;
14. i test passano;
15. la build passa;
16. le simulazioni non mostrano regressioni economiche.

---

# 28. Piano di implementazione

## Fase 1 — Information policy

- information set;
- rimozione Focus privato;
- hash;
- test privacy.

## Fase 2 — Azioni strategiche

- Focus significativi;
- azioni congiunte;
- diversità per carta;
- scenari avversari.

## Fase 3 — Stato ed evaluation

- stato strategico;
- moduli di valutazione;
- economia;
- trigger;
- iniziativa;
- matchup.

## Fase 4 — Ricerca

- expand state;
- expectiminimax;
- beam;
- cache;
- terminal solver.

## Fase 5 — Profili

- Facile;
- Normale;
- Difficile;
- budget prestazioni;
- casualità.

## Fase 6 — Diagnostica

- debug;
- spiegazioni;
- metriche;
- simulatore IA vs IA.

## Fase 7 — Calibrazione

- test automatici;
- simulazioni massive;
- playtest manuali;
- tuning pesi;
- report finale.

---

# 29. Vincoli

- nessuna dipendenza esterna necessaria;
- nessuna duplicazione del duello;
- nessuna modifica alle regole per aiutare l’IA;
- nessun accesso a dati nascosti;
- nessun cap rigido globale non motivato;
- funzioni pure;
- RNG iniettabile;
- compatibilità Campagna;
- nessuna esecuzione in PvP;
- parametri centralizzati;
- codice testabile.

---

# 30. Resoconto richiesto a Cursor

Cursor deve fornire:

1. file creati;
2. file modificati;
3. diagramma del flusso;
4. politica informazioni;
5. algoritmo di ricerca;
6. profondità per difficoltà;
7. formula evaluation;
8. budget Focus;
9. gestione sacrifici;
10. gestione trigger;
11. test;
12. risultati `npm test`;
13. risultati `npm run build`;
14. benchmark prestazioni;
15. metriche simulazioni;
16. problemi residui.

---

# 31. Istruzione finale

Non implementare una serie di euristiche isolate dentro `useAI`.

Costruire un planner strategico modulare.

La priorità è:

> vincere la partita amministrando informazioni pubbliche, Campi, mani, PV, Focus e finestre dei trigger.

La forza della Difficile deve derivare da:

> maggiore profondità, migliore valutazione e migliore pianificazione.

Non deve derivare da:

> informazioni segrete, Focus gratuiti, all-in sistematici o conoscenza della scelta reale del giocatore.
