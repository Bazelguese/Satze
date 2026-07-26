# SATZE — Specifica correttiva IA: Focus nascosti e gestione razionale delle risorse

## Documento operativo per Cursor

**Obiettivo:** correggere il motore IA in `src/game/ai/` affinché le tre difficoltà giochino senza utilizzare informazioni nascoste e senza sovrainvestire sistematicamente Focus Coin, soprattutto nei primi round.

La correzione deve intervenire sull’implementazione esistente. Non creare una seconda IA parallela e non ripristinare la vecchia logica di `useAI`.

---

# 1. Problema osservato

A difficoltà **Normale**, nel primo round l’IA ha investito **12 FC su 18** su una singola carta, raggiungendo 84 VA e lasciandosi soltanto 6 FC per quattro carte.

Il comportamento nasce principalmente da questi difetti:

1. il pre-ranking in `lightRankAction()` premia fortemente `card.power * focus`;
2. la penalità preliminare dei Focus è troppo piccola;
3. la shortlist globale può essere occupata da molte varianti ad alto Focus della stessa carta;
4. quando il giocatore ha già confermato, l’IA può leggere `player.selectedFocus` e rispondere al valore esatto;
5. la valutazione considera troppo il caso peggiore teorico, inducendo l’IA a proteggersi da all-in improbabili.

Questi comportamenti devono essere eliminati.

---

# 2. Regola inderogabile: i Focus del giocatore sono nascosti

## 2.1 Principio

L’IA **non deve mai conoscere, leggere, usare o dedurre il numero esatto di Focus Coin scelti dal giocatore per il duello corrente**.

La regola vale per:

- Facile;
- Normale;
- Difficile.

Vale anche quando il valore è già presente nel React state. La disponibilità tecnica di un dato non lo rende un’informazione lecita per l’IA.

## 2.2 Informazioni utilizzabili

L’IA può utilizzare soltanto informazioni pubbliche o proprie:

- propria mano e proprie carte usate;
- propri FC e PV;
- PV e FC totali pubblici del giocatore;
- Campi rivelati e conquistati;
- round, ordine di gioco e vincitore precedente;
- bonus, Tossina ed effetti persistenti pubblici;
- mano del giocatore, poiché in SATZE entrambe le mani sono visibili;
- carta del giocatore soltanto se è già pubblicamente rivelata prima della scelta IA.

## 2.3 Informazioni vietate

L’IA non deve utilizzare:

- `selectedFocus` del giocatore;
- VA provvisorio derivato dai Focus scelti;
- log, animazioni o dati UI dai quali ricavare il Focus;
- alias come `knownPlayerFocus`, `enemyFocusCoins` o equivalenti;
- cache decisionali la cui chiave varia in base al Focus privato;
- funzioni che ricevono il Focus reale per valutare la mossa.

## 2.4 Invariante obbligatoria

A parità di stato pubblico e RNG, la decisione IA deve essere identica anche se cambia solo il Focus privato del giocatore.

Esempio:

```text
Stato A: player.selectedFocus = 2
Stato B: player.selectedFocus = 12
```

Risultato richiesto:

```text
stessa carta
stesso Focus
stesso Campo
stesso punteggio
```

---

# 3. Information set sanitizzato

Creare:

```text
src/game/ai/buildAIInformationSet.js
```

Esportare:

```js
export function buildAIInformationSet(gameState)
```

Schema suggerito:

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
  playerFieldsConquered,
  enemyFieldsConquered,

  player: {
    hand,
    usedCardIds,
    hp,
    focusPool,
    armyBonuses,
    toxin,
    visibleCard
  },

  ai: {
    hand,
    usedCardIds,
    hp,
    focusPool,
    armyBonuses,
    toxin
  },

  campaignDuelMod
}
```

Non deve esistere:

```js
player.selectedFocus
```

`buildAIContext()` può diventare un wrapper compatibile, ma il motore decisionale deve ricevere soltanto il contesto sanitizzato.

Usare `player.visibleCard`, non `selectedCard`, per rendere esplicito che la carta è disponibile soltanto quando realmente pubblica.

---

# 4. Eliminare il vantaggio informativo quando l’IA gioca seconda

L’attuale separazione tra:

```js
chooseWhenAIResponds()
chooseWhenAILeads()
```

non deve più implicare che la prima funzione conosca il Focus esatto del giocatore.

Creare un entry point unico:

```js
chooseAIIndependentAction(context, difficulty, options)
```

L’ordine di gioco continua a influenzare:

- Imboscata;
- Intervento;
- Sfida;
- Sopraffare;
- tie-break;
- effetti del Campo;
- visibilità della carta avversaria.

Non deve influenzare l’accesso alle informazioni private.

### IA prima

Valuta carte e investimenti possibili dell’avversario senza conoscere la sua futura giocata.

### IA seconda con carta visibile

Conosce la carta, ma non i Focus. Valuta più scenari plausibili di investimento.

### IA seconda senza carta visibile

Valuta mano pubblica e scenari rappresentativi di carta + Focus.

---

# 5. Scenari avversari con Focus nascosti

Creare:

```text
src/game/ai/generateOpponentScenarios.js
```

L’IA può ragionare sui Focus possibili, ma non deve presumere che il giocatore investa sempre il massimo.

Per ogni carta avversaria considerata generare pochi valori rappresentativi:

```js
[
  1,
  economicalFocus,
  standardFocus,
  pressureFocus,
  overdriveThreshold,
  highFocus
]
```

Rimuovere duplicati e valori illegali.

Il massimo legale non deve essere incluso automaticamente. Può comparire solo:

- negli ultimi round;
- con una sola carta rimasta;
- su Campi che premiano esplicitamente l’investimento massimo;
- in situazioni pubblicamente decisive.

## 5.1 Quota standard

Creare:

```js
estimateStandardFocus({
  focusPool,
  cardsRemaining,
  roundNumber,
  profile
})
```

Formula iniziale:

```js
const fairShare = Math.ceil(focusPool / Math.max(1, cardsRemaining));
const standard = fairShare + profile.standardFocusBuffer;
```

Valori iniziali:

```js
easy.standardFocusBuffer = 0;
medium.standardFocusBuffer = 1;
hard.standardFocusBuffer = 2;
```

Con 18 FC e 5 carte:

```text
quota equa = 4
Facile = 4
Normale = 5
Difficile = 6
```

## 5.2 Pesi degli scenari

Normale:

```js
{
  economical: 0.20,
  standard: 0.45,
  pressure: 0.25,
  high: 0.10
}
```

Difficile:

```js
{
  economical: 0.15,
  standard: 0.35,
  pressure: 0.30,
  high: 0.20
}
```

Facile può usare soltanto `economical` e `standard`.

## 5.3 Punteggio aggregato

Per ogni azione IA:

```js
expectedScore = sum(scoreScenario * scenarioProbability)
```

Aggiungere prudenza moderata:

```js
finalScore =
  expectedScore * (1 - riskWeight) +
  lowerPercentileScore * riskWeight;
```

Pesi iniziali:

```js
easy.riskWeight = 0.05;
medium.riskWeight = 0.20;
hard.riskWeight = 0.35;
```

Non usare il caso peggiore assoluto come elemento dominante.

---

# 6. Generazione strategica dei Focus IA

L’enumerazione completa carta × ogni Focus può restare disponibile per test o simulazioni mirate, ma non deve alimentare una shortlist globale dominata dai valori più alti.

Creare:

```js
generateStrategicFocusCandidates(context, card, profile)
```

Per ogni carta includere almeno:

1. 1 FC;
2. quota equa;
3. investimento standard;
4. soglia Overdrive effettiva, quando rilevante;
5. punto di svolta noto del Campo;
6. investimento pressione;
7. cap ordinario;
8. massimo legale soltanto in presenza di eccezione.

Rimuovere duplicati e valori illegali.

## 6.1 Shortlist bilanciata per carta

È vietata una shortlist simile a:

```text
Carta A — 14 FC
Carta A — 13 FC
Carta A — 12 FC
Carta B — 14 FC
Carta B — 13 FC
```

Prima del limite globale, conservare per ogni carta:

- migliore variante economica;
- migliore variante standard;
- migliore variante aggressiva.

Solo dopo unire i gruppi.

Ogni carta disponibile deve sopravvivere almeno con una variante alla prima fase.

---

# 7. Riscrivere `lightRankAction()`

Non usare più `card.power * focus` come termine dominante del pruning.

Formula concettuale suggerita:

```js
score =
  intrinsicCardValue
  + triggerSuitability
  + fieldSuitability
  + strategicFocusBandValue
  - earlyRoundOverinvestmentPenalty
  - futureResourcePressure;
```

`strategicFocusBandValue` deve premiare:

- quota equa;
- soglia Overdrive sensata;
- punti di svolta reali;
- investimenti coerenti con il round.

Non deve premiare semplicemente il Focus più alto.

---

# 8. Budget razionale dei Focus

## 8.1 Quota equa

```js
fairShare = Math.ceil(aiFocus / cardsRemaining)
```

## 8.2 Cap ordinario

Aggiungere ai profili:

```js
easy.ordinaryFocusBuffer = 0;
medium.ordinaryFocusBuffer = 2;
hard.ordinaryFocusBuffer = 3;
```

Calcolo:

```js
ordinaryCap = Math.min(
  legalMax,
  fairShare + profile.ordinaryFocusBuffer
);
```

Con 18 FC e 5 carte:

```text
Facile: 4
Normale: 6
Difficile: 7
```

Nel caso osservato, la Normale non può investire 12 FC al primo round.

## 8.3 Cap percentuale iniziale

Aggiungere:

```js
earlyPoolShareCap
```

Valori:

```js
easy: 0.30
medium: 0.40
hard: 0.50
```

Nei round 1 e 2:

```js
percentageCap = Math.ceil(aiFocus * earlyPoolShareCap);
ordinaryCap = Math.min(ordinaryCap, percentageCap);
```

## 8.4 Eccezioni al cap

Creare:

```js
getFocusCapException(context, action)
```

Eccezioni valide:

- ultima carta;
- penultima carta con risorse abbondanti;
- possibile vittoria immediata per PV;
- possibile terzo Campo decisivo;
- Overdrive distante al massimo 1 FC dal cap e realmente utile;
- Campo `winnerByFocusNotVa`;
- Campo con premio eccezionale verificabile per investimento alto;
- modificatore campagna esplicito.

Non sono eccezioni:

- il giocatore potrebbe fare all-in;
- la carta ha Potenza alta;
- è la difficoltà Difficile;
- il massimo VA è maggiore;
- una variante ad alto Focus vince più scenari estremi.

## 8.5 Penalità progressiva

Oltre lo standard:

```js
const excess = Math.max(0, focus - standardFocus);
const penalty =
  excess * linearPenalty +
  excess * excess * quadraticPenalty;
```

Normale, valori iniziali:

```js
linearPenalty = 90;
quadraticPenalty = 45;
```

Moltiplicatore round:

```js
round 1: 1.50
round 2: 1.25
round 3: 1.00
round 4: 0.70
round 5: 0.35
```

---

# 9. Ordinamento finale

`compareScoredActions()` deve ordinare prima per punteggio complessivo.

```js
score decrescente
```

I tie-break si applicano soltanto quando:

```js
Math.abs(a.score - b.score) <= SCORE_TIE_EPSILON
```

Valore iniziale:

```js
export const SCORE_TIE_EPSILON = 5;
```

Tie-break ammessi entro la finestra:

1. vittoria terminale;
2. evitare sconfitta terminale;
3. meno Focus investiti;
4. più Focus rimanenti;
5. più PV rimanenti;
6. più danno inflitto;
7. trigger attivo;
8. id carta stabile.

Fuori dalla finestra decide il punteggio.

---

# 10. Dominanza

Disattivare temporaneamente il filtro di dominanza nella valutazione con Focus nascosti:

```js
useDominanceFilterWhenHiddenFocus: false
```

La dominanza può essere reintrodotta soltanto confrontando due azioni sugli stessi identici scenari avversari.

Una variante con più Focus della stessa carta può essere eliminata solo se:

- non aumenta la probabilità di vittoria;
- non aumenta danno o sopravvivenza;
- non attiva un trigger;
- non cambia stato terminale;
- lascia meno Focus.

---

# 11. Scelta del Campo

`chooseAIField()` deve usare lo stesso information set sanitizzato.

La scelta del Campo non deve leggere o trasportare il Focus reale del giocatore e non deve reintrodurre un pruning dominato da `power * focus`.

---

# 12. Modifiche richieste ai file

## `src/game/ai/buildAIContext.js`

- rimuovere `player.selectedFocus`;
- sostituire `player.selectedCard` con `player.visibleCard`;
- non leggere il Focus corrente del giocatore;
- documentare la policy di informazione nascosta.

## Nuovo `src/game/ai/buildAIInformationSet.js`

Fonte unica consigliata del contesto sanitizzato.

## `src/hooks/useAI.js`

In `decisionKey()` rimuovere ogni riferimento a:

```js
ctx.player.selectedFocus
```

La cache non deve invalidarsi quando il giocatore modifica il proprio Focus.

Non passare il Focus reale a nessuna funzione IA.

## `src/game/ai/chooseAIAction.js`

- eliminare la risposta basata su Focus noto;
- creare flusso indipendente;
- usare scenari nascosti;
- shortlist bilanciata per carta;
- score prima dei tie-break;
- nessuna ipotesi automatica di all-in.

## `src/game/ai/generateAIActions.js`

Aggiungere:

```js
generateStrategicFocusCandidates()
generateStrategicActionsForSide()
```

## Nuovo `src/game/ai/generateOpponentScenarios.js`

Gestire carte, Focus rappresentativi, pesi e deduplicazione.

## `src/game/ai/aiProfiles.js`

Aggiungere:

```js
{
  standardFocusBuffer,
  ordinaryFocusBuffer,
  earlyPoolShareCap,
  riskWeight,
  opponentScenarioCount,
  ownVariantsPerCard,
  allowMaxFocusScenario,
  overinvestmentLinearPenalty,
  overinvestmentQuadraticPenalty
}
```

Configurazione iniziale:

```js
easy: {
  standardFocusBuffer: 0,
  ordinaryFocusBuffer: 0,
  earlyPoolShareCap: 0.30,
  riskWeight: 0.05,
  opponentScenarioCount: 2,
  ownVariantsPerCard: 2,
  allowMaxFocusScenario: false,
  overinvestmentLinearPenalty: 120,
  overinvestmentQuadraticPenalty: 60
}

medium: {
  standardFocusBuffer: 1,
  ordinaryFocusBuffer: 2,
  earlyPoolShareCap: 0.40,
  riskWeight: 0.20,
  opponentScenarioCount: 4,
  ownVariantsPerCard: 3,
  allowMaxFocusScenario: false,
  overinvestmentLinearPenalty: 90,
  overinvestmentQuadraticPenalty: 45
}

hard: {
  standardFocusBuffer: 2,
  ordinaryFocusBuffer: 3,
  earlyPoolShareCap: 0.50,
  riskWeight: 0.35,
  opponentScenarioCount: 6,
  ownVariantsPerCard: 4,
  allowMaxFocusScenario: true,
  overinvestmentLinearPenalty: 70,
  overinvestmentQuadraticPenalty: 30
}
```

`allowMaxFocusScenario: true` non autorizza un massimo automatico: richiede comunque una delle eccezioni previste.

## `src/game/ai/scoreAIAction.js`

- penalità progressiva;
- costo dipendente da round e carte rimaste;
- punteggio aggregato degli scenari;
- evitare doppio conteggio incoerente tra Focus spesi e rimasti;
- tie-break separati.

## `src/game/ai/chooseAIField.js`

- contesto sanitizzato;
- scenari nascosti;
- ricerca ridotta ma bilanciata per carta.

## `src/game/ai/aiDebug.js`

Non mostrare né registrare il Focus reale del giocatore.

Aggiungere:

```js
informationPolicy: 'hidden-player-focus'
```

Mostrare:

- quota equa;
- cap ordinario;
- eccezione;
- scenari considerati;
- score atteso;
- penalità sovrainvestimento.

---

# 13. Test automatici obbligatori

Creare:

```text
src/game/ai/hiddenFocusPolicy.test.js
src/game/ai/focusBudget.test.js
src/game/ai/chooseAIAction.test.js
src/game/ai/opponentScenarios.test.js
```

Aggiornare `package.json` affinché vengano eseguiti tutti i file `src/game/ai/*.test.js`.

## Test privacy

1. stessa decisione con `selectedFocus = 1` e `selectedFocus = 12`;
2. stessa `decisionKey` al variare del Focus privato;
3. information set privo di `selectedFocus` e alias;
4. Proxy che genera errore se il motore tenta di leggere il dato privato;
5. stessa scelta del Campo al variare del Focus privato.

## Test regressione 12 FC

Fixture:

```text
round = 1
aiFocus = 18
aiCardsRemaining = 5
difficulty = medium
nessuna vittoria immediata
nessuna eccezione
```

Asserzione:

```text
chosen.focus <= 6
```

Includere una carta ad alta Potenza e Bonus Imboscata per riprodurre il caso osservato.

Per Difficile:

```text
chosen.focus <= 7
```

salvo eccezione esplicita.

## Test strategici

- Overdrive può superare il cap di 1 FC quando realmente utile;
- ultima carta può investire tutto;
- terzo Campo può superare il cap;
- ogni carta ha almeno una variante nella shortlist;
- nessuna carta supera `ownVariantsPerCard` nella prima fase;
- una mossa con score 1000 precede una con score 900 anche se la seconda usa meno Focus;
- lo scenario massimo non riceve il peso maggiore al round 1;
- la decisione può cambiare con carta visibile diversa, ma non con Focus privato diverso.

---

# 14. Criteri di accettazione

La correzione è accettata solo se:

1. la Normale non investe abitualmente più di 6 FC al primo round con 18 FC e 5 carte;
2. la Difficile non investe abitualmente più di 7 FC nella stessa situazione;
3. ogni superamento ha una motivazione esplicita nel debug;
4. la decisione non cambia osservando il Focus reale del giocatore;
5. Overdrive resta utilizzabile in modo sensato;
6. gli all-in compaiono negli ultimi round o per chiudere la partita;
7. ogni carta riceve almeno una valutazione;
8. le varianti economiche non vengono eliminate dal pre-ranking;
9. la Normale sbaglia scegliendo fra mosse ragionevoli, non sprecando risorse;
10. la Difficile è più forte per qualità di lettura, non perché spende di più o bara.

---

# 15. Comportamento delle difficoltà

## Facile

- pochi scenari;
- investimenti vicini alla quota equa;
- errori di carta o strategia;
- nessun accesso al Focus privato;
- niente sprechi estremi sistematici.

## Normale

- valuta ogni carta;
- usa scenari economici, standard, pressione e alti;
- privilegia valore atteso;
- conserva risorse per i round futuri;
- supera il cap solo con ragione concreta;
- nessun accesso al Focus privato.

## Difficile

- più scenari e maggiore prudenza;
- migliore valutazione di Campi, trigger e futuro;
- investimenti superiori solo quando giustificati;
- non presume all-in costanti;
- nessun vantaggio informativo artificiale.

---

# 16. Debug di sviluppo

Con:

```js
window.__SATZE_AI_DEBUG__ = true
```

stampare:

```text
Carta
Focus
Quota equa
Cap ordinario
Eccezione
Score atteso
Score prudente
Penalità sovrainvestimento
Trigger previsto
Probabilità di vittoria stimata
Policy informazioni: Focus giocatore nascosto
```

Non includere il Focus reale del giocatore nel payload.

---

# 17. Metriche di controllo

Eseguire molte decisioni su fixture differenti con 18 FC e 5 carte al round 1.

Valori attesi, escluse le eccezioni:

```text
Facile:
media Focus 2,5–4,5
95° percentile <= 5

Normale:
media Focus 3,5–5,5
95° percentile <= 6

Difficile:
media Focus 4–6
95° percentile <= 7
```

Escludere:

- vittorie immediate;
- terzo Campo;
- ultima carta;
- Campo `winnerByFocus`;
- eccezioni dichiarate.

---

# 18. Vincoli tecnici

- funzioni IA pure;
- usare `computeDuelResolution`, senza duplicarlo;
- non modificare le regole del duello per adattarle all’IA;
- non risolvere tutto con un semplice `Math.min(focus, 6)` globale;
- concentrare parametri in `aiProfiles.js` e `aiConstants.js`;
- RNG iniettabile nei test;
- nessuna dipendenza esterna;
- compatibilità con campagna;
- nessuna IA nel multiplayer PvP.

---

# 19. Piano di implementazione

## Fase 1 — Privacy

1. information set sanitizzato;
2. rimozione di `selectedFocus`;
3. rimozione dalla cache key;
4. test d’invarianza;
5. verifica della scelta Campo.

## Fase 2 — Budget

1. quota equa;
2. cap ordinario;
3. cap percentuale;
4. penalità non lineare;
5. eccezioni esplicite;
6. test regressione 12 FC.

## Fase 3 — Candidati

1. Focus strategici per carta;
2. limite varianti per carta;
3. rimozione pruning `power * focus`;
4. scenari avversari rappresentativi.

## Fase 4 — Punteggio

1. valore atteso;
2. rischio moderato;
3. score prima dei tie-break;
4. dominanza disattivata o riscritta;
5. calibrazione profili.

## Fase 5 — Verifica

1. tutti i test;
2. build;
3. almeno 30 decisioni simulate per difficoltà al round 1;
4. distribuzione media dei Focus;
5. playtest manuali.

---

# 20. Resoconto richiesto a Cursor

Cursor deve fornire:

1. file creati e modificati;
2. metodo con cui impedisce l’accesso al Focus privato;
3. nuova formula del budget;
4. eccezioni al cap;
5. nuova shortlist per carta;
6. test aggiunti;
7. risultato di `npm test`;
8. risultato di `npm run build`;
9. metriche round 1;
10. punti ancora da calibrare.

---

# 21. Istruzione finale per Cursor

Implementare la correzione completa, non una patch superficiale.

Priorità assoluta:

> L’IA sceglie carta e Focus usando soltanto informazioni pubbliche e proprie. Non deve conoscere quanti Focus ha scelto il giocatore.

Seconda priorità:

> L’IA non deve proteggersi abitualmente dal massimo investimento teorico dell’avversario. Deve amministrare i Focus sull’intera partita.

Terza priorità:

> La difficoltà dipende dalla qualità della lettura strategica, non dalla quantità di Focus spesi o dall’accesso a informazioni nascoste.

Prima di terminare, verificare espressamente che il caso “12 FC al primo round su 18” non sia più riproducibile in difficoltà Normale senza una delle eccezioni documentate.
