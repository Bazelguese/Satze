# SATZE — Handoff tecnico per Cursor: sistema APICE / categoria Eminenza

> Specifica di implementazione basata sui documenti `SATZE_APICE-1(1).pdf` e
> `SATZE_APICE_TRIGGER_EFFETTI_v2.pdf`, sulle decisioni successive del game designer e sul codice reale
> del repository `Bazelguese/Satze`, branch `main`, commit ispezionato
> `12f4283e6ac4361ed6fb16cd8cb00bbf2bf45884`.

## Istruzione principale

Implementa l'infrastruttura completa della categoria **Eminenza** senza inventare nuove carte, nuovi
effetti di design o un layout parallelo del duello.

La specifica di design è più recente del codice presente su `main`. In caso di conflitto:

1. per le regole dell'Eminenza prevale questo documento;
2. per l'architettura e il comportamento già esistente prevale il codice;
3. se manca una regola necessaria a risolvere un'interazione, non improvvisarla: lascia un'estensione
   esplicita e segnala il punto.

Prima di modificare il codice, leggi integralmente:

- `.cursor/rules/satze-mechanics-validation.mdc`;
- `.cursor/rules/satze-duel-layout-source.mdc`;
- `src/hooks/useGameState.js`;
- `src/hooks/useGameFlow.js`;
- `src/game/duelResolve.js`;
- `src/game/triggerLogic.js`;
- `src/game/duel/duelTurnContexts.js`;
- `src/game/duel/duelApplyEffect.js`;
- `src/game/duel/duelCombatState.js`;
- `src/game/duel/duelResolutionFinish.js`;
- `src/utils/deckManager.js`;
- `src/utils/deckResolve.js`;
- `src/utils/onlineMatch.js`;
- `src/game/ai/buildAIInformationSet.js`;
- `src/game/ai/simulateAIDuel.js`;
- `Codice/satze.jsx`, in particolare `completeShuffleDeal`, la selezione del Campo/agente, il relay
  multiplayer e `nextRound` / `advanceGuidedRoundState`.

---

## 1. Terminologia vincolante

Non confondere questi tre concetti:

| Termine | Significato |
|---|---|
| **Apex** | Una delle 12 Armate già presenti nel gioco. |
| **Eminenza** | Nome definitivo della nuova categoria di carta fuori mazzo. È il termine da mostrare nella UI e nel glossario. |
| **APICE** | Nome storico del progetto e dei documenti di design. Non deve diventare il nuovo nome runtime della categoria. |

Usa `eminence` negli identificatori tecnici di dominio e `presence` per la risorsa. Non introdurre una
nuova API chiamata genericamente `apex`, perché colliderebbe semanticamente con l'Armata `Apex`.

---

## 2. Regole confermate dell'Eminenza

Queste regole sono hard requirement.

### 2.1 Deckbuilding e presenza in partita

- L'Eminenza è **fuori mazzo**: non occupa uno dei 10 slot e non consuma punti Lega.
- Un'Armata rende selezionabile una propria Eminenza se nel mazzo completo da 10 carte sono presenti
  **almeno 5 carte** di quell'Armata.
- Il conteggio va eseguito sul mazzo completo, non sulla mano pescata da 5 carte.
- Ogni giocatore può avere **al massimo una Eminenza** nella partita.
- Un mazzo 5–5 può rendere eleggibili due Eminenze, ma il giocatore deve sceglierne una sola. La scelta
  appartiene al deckbuilding/setup, non al round.
- L'Eminenza selezionata è informazione pubblica.
- Una Eminenza possiede:
  - un effetto statico sempre attivo per tutta la partita;
  - esattamente 3 abilità attive;
  - una quantità iniziale di Presenza nel range 1–4;
  - almeno una abilità gratuita o che genera Presenza.
- I costi delle tre abilità non sono standardizzati: la curva dei costi definisce l'archetipo.

### 2.2 Presenza

- La risorsa si chiama **Presenza**.
- La Presenza di entrambi i giocatori è sempre visibile.
- Non esiste un cap globale.
- A Presenza 0 l'Eminenza non muore e non subisce penalità automatiche.
- La Presenza persiste per tutta la partita, normalmente i 5 round dello Scontro.
- La Presenza si azzera solo iniziando una nuova partita/rematch e viene inizializzata al valore della
  definizione dell'Eminenza.
- Le fonti sono le abilità dell'Eminenza e gli effetti degli agenti.
- Non convertire direttamente Presenza in FC, POT o VA nei dati di esempio. La Presenza deve restare
  una linea economica distinta.

### 2.3 Sequenza del round

La sequenza corretta è:

1. entrambi scelgono in segreto un'abilità della propria Eminenza;
2. entrambe le scelte vengono bloccate;
3. le abilità vengono rivelate simultaneamente;
4. le abilità si risolvono e la Presenza viene aggiornata;
5. solo dopo si passa alla scelta del Campo di battaglia;
6. prosegue il round normale: scelta agente, Focus Coin, duello, risultato.

L'Eminenza risolve **prima del Campo**. Di conseguenza:

- i Campi non annullano, copiano o modificano le abilità dell'Eminenza;
- l'Eminenza non deve passare da `applyDuelFieldSetup`;
- i trigger degli agenti leggono lo stato già risolto dell'Eminenza;
- gli effetti degli agenti sulla Presenza producono conseguenze soltanto per i round successivi;
- nessun effetto agente può reagire retroattivamente all'abilità dell'Eminenza nello stesso round.

### 2.4 Risoluzione simultanea

Non usare `isPlayerFirst` per decidere quale abilità dell'Eminenza risolve per prima.

Il resolver deve essere puro e a snapshot:

1. crea uno snapshot della Presenza pubblica di entrambi al momento del lock-in;
2. verifica la legalità di entrambe le abilità contro quello snapshot;
3. paga simultaneamente i costi validi;
4. applica simultaneamente guadagni ed effetti commutativi;
5. produce un unico risultato e una lista di eventi;
6. aggiorna lo stato persistente una sola volta.

Entrambe le abilità legalmente scelte devono risolversi anche se l'effetto avversario riduce in seguito la
Presenza. Non invalidare retroattivamente una scelta già pagabile allo snapshot.

Per futuri effetti non commutativi non inventare un ordine implicito: il registro degli effetti deve richiedere
una semantica simultanea esplicita. Finché non esiste tale semantica, il resolver deve rifiutare in sviluppo
un effetto sconosciuto invece di applicarlo nell'ordine player/enemy.

---

## 3. Trigger confermati

Aggiungi questi trigger a `src/game/triggerLogic.js`, a `src/data/triggers.js` e a tutti i punti di
valutazione IA/glossario interessati.

| Nome UI | Chiave | Condizione esatta |
|---|---|---|
| Invocazione | `invocazione` | Hai speso almeno 1 Presenza con l'abilità dell'Eminenza in questo round. |
| Riverbero | `riverbero` | Il nemico ha speso almeno 1 Presenza con l'abilità dell'Eminenza in questo round. |
| Vigilia | `vigilia` | La tua Presenza attuale è esattamente 0. Nessuna Eminenza parte da 0. |
| Auge | `auge` | La tua Presenza è strettamente maggiore di 5. |
| Eruzione | `eruzione` | Hai speso cumulativamente almeno 3 Presenza durante questa partita. Una volta raggiunta, resta soddisfatta. |
| Zenit | `zenit` | La tua Presenza è maggiore di quella nemica. Trigger in riserva/playtest, anche come drawback. |
| Eclissi | `eclissi` | La tua Presenza è minore di quella nemica. Trigger in riserva/playtest, soprattutto come drawback. |

### 3.1 Campi da aggiungere al contesto trigger

Usa nomi non ambigui:

```js
/** Presenza effettivamente pagata dalla tua Eminenza nel round corrente. */
presenceSpentThisRound: number

/** Presenza effettivamente pagata dall'Eminenza nemica nel round corrente. */
enemyPresenceSpentThisRound: number

/** Presenza effettivamente pagata da te dall'inizio della partita. */
totalPresenceSpent: number

/** Tua Presenza dopo la risoluzione delle Eminenze e prima del duello. */
playerPresence: number

/** Presenza nemica dopo la risoluzione delle Eminenze e prima del duello. */
enemyPresence: number
```

Il documento precedente usava `presenceSpent`; preferire il nome esplicito
`presenceSpentThisRound` ed evitare duplicati/alias nel nuovo codice.

### 3.2 Semantica importante

- `presenceSpentThisRound` è il costo realmente pagato, non il costo stampato di una scelta invalida,
  bloccata o passata.
- Una abilità gratuita o che genera Presenza non attiva Invocazione.
- Un drenaggio `enemyPresence` non conta come Presenza spesa dalla vittima e non attiva Riverbero.
- `totalPresenceSpent` aumenta solo per vera spesa di Presenza, non per perdite inflitte dal nemico.
- Gli effetti `presence` risolti dagli agenti durante il duello non cambiano i cinque valori dello snapshot
  usato dai trigger di quel duello.
- Auge usa confronto stretto: `playerPresence > threshold`.
- Se si usa `fieldModifiers`, la soglia base di Auge è 5 e va letta con `??`, non `||`:

```js
const threshold = fieldMods.augeThreshold ?? 5;
return context.playerPresence > threshold;
```

- Mantieni il pattern delle forzature già esistenti:
  `invocazioneAlwaysActive`, `riverberoAlwaysActive`, `vigiliaAlwaysActive`,
  `augeAlwaysActive`, `eruzioneAlwaysActive`, `zenitAlwaysActive`,
  `eclissiAlwaysActive`.
- Nessuno di questi trigger è post-duello. **Non aggiungerli a `POST_BATTLE_TRIGGERS`.**

### 3.3 Ordine nel `switch`

Nel blocco `// NUOVI TRIGGER` di `checkTrigger`, inserisci i nuovi `case` dopo `ultimaChance` e prima
di `alleato`, preservando il comportamento esistente.

Aggiorna anche `createTriggerContext`, la typedef `TriggerContext` e
`src/game/duel/duelTurnContexts.js`, mantenendo la perfetta simmetria player/enemy.

---

## 4. Effetti degli agenti sulla Presenza

Implementa soltanto gli effetti confermati:

| Nome UI | Chiave runtime | Semantica |
|---|---|---|
| Presenza +X | `presence` | Aumenta la Presenza del proprietario di X, senza cap. |
| Presenza nemica −X | `enemyPresence` | Riduce la Presenza nemica di `abs(value)`, minimo 0. |
| Blocca Eminenza | `blockEminence` | Il nemico non può usare un'abilità attiva dell'Eminenza nel round successivo. |

Regole:

- Non implementare `copyApice`, `copyEminence` o equivalenti: **Copia Apice è stata eliminata dal
  design**.
- Il nome storico `blockApice` può essere letto solo come eventuale alias di migrazione se esistono già
  dati salvati con quella chiave; non usarlo nei nuovi dati.
- `enemyPresence` deve sempre clampare a 0.
- L'effetto `enemyPresence` sarà raro e normalmente di valore 1–2; non codificare però un cap 2
  nell'engine, perché è un vincolo di card design, non una regola runtime.
- L'immunità attuale non va estesa automaticamente alla Presenza: finché il regolamento non lo dice,
  `immune` continua a proteggere soltanto ciò che protegge già oggi.
- `blockEminence` blocca le tre abilità attive, non l'effetto statico.
- Se un lato è bloccato nel round N, effettua un auto-pass nel round N; il blocco scade dopo quel round.

### 4.1 Nessuna retroattività

All'inizio di `computeDuelResolution` i contesti trigger devono contenere lo snapshot Presenza già
risolto nella fase Eminenza.

Durante `duelApplyEffect` è possibile aggiornare lo stato mutabile del duello, ma non si devono mutare
`playerContext` e `enemyContext`. In questo modo un `presence +2` applicato da un agente non può
attivare Auge, Zenit o altri trigger nello stesso duello.

Il risultato del duello deve riportare la Presenza finale, che diventa la Presenza persistente per il round
successivo.

---

## 5. Modello dati consigliato

Crea un barrel dedicato, per esempio:

```text
src/data/eminences.js
src/game/eminence/eminenceEligibility.js
src/game/eminence/resolveEminenceRound.js
src/game/eminence/eminenceEffects.js
src/game/eminence/eminenceCommitReveal.js
src/components/eminence/EminencePanel.jsx
```

Esporta i dati anche da `src/data/index.js`.

### 5.1 Definizione

Non usare costi firmati tipo `-2` per rappresentare la spesa. Separa costo e guadagno:

```js
export const EMINENCES = {
  eminence_id: {
    id: 'eminence_id',
    name: 'Nome pubblico',
    army: 'Apex',
    startingPresence: 3,
    staticEffects: [],
    abilities: [
      {
        id: 'ability_id',
        name: 'Nome abilità',
        cost: 0,       // intero >= 0
        gain: 1,       // intero >= 0
        effects: [],
      },
      // esattamente altre 2
    ],
  },
};
```

Vincoli di validazione dei dati:

- `startingPresence` intero 1–4;
- esattamente 3 abilità con ID univoci;
- `cost` e `gain` interi non negativi;
- almeno una abilità con `cost === 0` oppure `gain > 0`;
- una abilità è legale se `cost <= currentPresence`;
- `staticEffects` ed `effects` passano da registri espliciti; nessun `switch default` silenzioso in dev.

Non creare adesso dati definitivi per **Il Sole Verde** o **L'Organizzatore degli Incontri** se i loro tre
testi non sono stati forniti. Per i test usa fixture locali ai file `.test.js`, non carte finte esportate nel
gioco di produzione.

### 5.2 Stato persistente per lato

Shape consigliato:

```js
{
  definitionId: null,
  presence: 0,
  presenceSpentThisRound: 0,
  totalPresenceSpent: 0,
  blockedUntilRound: null,
  lastResolved: null,
}
```

`lastResolved` può contenere solo informazione ormai pubblica:

```js
{
  roundNumber,
  abilityId,
  spent,
  gained,
}
```

Le scelte segrete non devono vivere dentro uno stato pubblico condiviso prima della rivelazione.

### 5.3 Risultato puro di round

`resolveEminenceRound` deve restituire almeno:

```js
{
  roundNumber,
  before: {
    playerPresence,
    enemyPresence,
  },
  selections: {
    playerAbilityId,
    enemyAbilityId,
  },
  spent: {
    player,
    enemy,
  },
  gained: {
    player,
    enemy,
  },
  after: {
    playerPresence,
    enemyPresence,
  },
  playerState,
  enemyState,
  events: [],
}
```

Il resolver non deve dipendere da React, DOM, Campo di battaglia o iniziativa.

---

## 6. Integrazione nello stato e nel flusso React

### 6.1 `useGameState.js`

Aggiungi almeno:

```js
playerEminenceState / setPlayerEminenceState
enemyEminenceState / setEnemyEminenceState
playerEminenceChoice / setPlayerEminenceChoice
enemyEminenceChoice / setEnemyEminenceChoice
eminenceRoundResult / setEminenceRoundResult
```

Le choice devono essere effimere e ripulite dopo la rivelazione, a ogni nuovo round, reset e rematch.
La Presenza e `totalPresenceSpent` non vanno ripulite tra i round.

### 6.2 Setup partita

In `useGameFlow.startGame` e `startOnlineMatch`:

- calcola l'eleggibilità sul set completo da 10 carte;
- valida l'Eminenza selezionata contro le Armate con almeno 5 carte;
- inizializza lo stato dalla definizione;
- non usare `calcInitialBonuses(hand)` per l'eleggibilità dell'Eminenza: quella funzione lavora oggi sulla
  mano e serve a un'altra meccanica;
- resetta completamente gli stati Eminenza su nuova partita e rematch.

Compatibilità:

- mazzi vecchi senza `eminenceId` devono continuare ad avviarsi e saltare la fase Eminenza;
- tutorial/campagna privi di configurazione Eminenza devono continuare a funzionare senza modifiche
  comportamentali;
- non inserire automaticamente una Eminenza di produzione finché non esiste una definizione approvata.

### 6.3 Nuova fase

Usa una fase esplicita, per esempio `selectEminence`.

Modifica i tre ingressi principali:

- `completeShuffleDeal`: da `selectField` a `selectEminence` quando almeno un lato ha una Eminenza;
- avvio con `skipShuffleDeal`: stessa regola;
- `advanceGuidedRoundState` / avanzamento round: stessa regola.

Se nessun lato ha una Eminenza, passa direttamente a `selectField` come oggi.

Se un solo lato ha una Eminenza, l'altro è un auto-pass ma la fase deve comunque risolversi
correttamente.

Se un lato è sotto `blockEminence`, quel lato è auto-pass e la UI spiega il blocco.

Non permettere la scelta del Campo prima che il risultato Eminenza del round sia stato applicato.

### 6.4 UI di produzione

La fonte di verità del duello è `Codice/satze.jsx`, sezione `// Schermata di gioco`. Non costruire la UI
in `duelVfxLab`, StyleLab, design-system o un'altra schermata parallela.

La UI minima deve mostrare:

- le due Eminenze selezionate;
- la Presenza di entrambi, sempre visibile;
- le 3 abilità del giocatore, con costo/guadagno e stato legale/disabilitato;
- stato «scelta avversaria bloccata» senza rivelare quale abilità;
- rivelazione simultanea;
- risultato della variazione Presenza;
- indicazione di `blockEminence` quando presente.

Riusa il linguaggio visuale degli HUD esistenti (`.satze-hud-panel`) e il canvas 1920×1080. Non
ridisegnare il layout del duello e non inventare asset definitivi.

---

## 7. Integrazione con il duello puro

### 7.1 Input di `computeDuelResolution`

Aggiungi input espliciti per i due stati Eminenza o, almeno, per i valori necessari:

```js
playerEminenceState
enemyEminenceState
```

Passali da:

- `src/hooks/useBattle.js`;
- `src/game/ai/simulateAIDuel.js`;
- ogni fixture/test che chiama direttamente `computeDuelResolution`.

Usa default compatibili per i vecchi test.

### 7.2 Contesti trigger

`buildDuelTurnContexts` deve produrre la prospettiva simmetrica:

- nel `playerContext`, `playerPresence` è quella del giocatore e `enemyPresence` quella nemica;
- nell'`enemyContext`, i due valori sono invertiti;
- stessa inversione per spesa del round;
- `totalPresenceSpent` è sempre quello del lato che sta leggendo il contesto.

### 7.3 Stato mutabile ed effetti

Estendi `createDuelCombatState` con valori correnti e blocchi pendenti, per esempio:

```js
pPresenceCurrent
ePresenceCurrent
pEminenceBlockForNextRound
eEminenceBlockForNextRound
```

In `duelApplyEffect.js`:

- `presence` aggiorna la Presenza del proprietario;
- `enemyPresence` aggiorna quella dell'avversario e clampa a 0;
- `blockEminence` imposta il blocco dell'avversario per `roundNumber + 1`;
- non mutare i contesti trigger.

Estendi `pickPostBattleFields`, `buildDuelBattleResult` e la chiamata finale in `duelResolve.js` con:

```js
finalPlayerPresence
finalEnemyPresence
playerEminenceBlockedUntilRound
enemyEminenceBlockedUntilRound
```

In `useBattle.js`, applica questi valori allo stato persistente insieme a FC e used cards. Il fatto che lo
state React cambi durante la schermata risultato non crea retroattività: `computeDuelResolution` ha già
completato tutti i trigger usando lo snapshot iniziale.

### 7.4 Eventi e log

Se gli effetti agente devono comparire nel log strutturato:

- estendi `BATTLE_STATS` con una voce stabile per Presenza;
- emetti `resourceChange` con target giocatore, oppure un evento `info` esplicitamente documentato;
- aggiorna formatter e test;
- non far passare gli eventi pre-Campo dell'Eminenza dentro la timeline del duello come se fossero
  poteri agente. Mantieni un risultato/event log Eminenza separato e poi, se serve, uniscilo solo a livello UI.

---

## 8. Deckbuilder e persistenza mazzi

Estendi il formato del mazzo personalizzato con:

```js
{
  // campi esistenti
  eminenceId: string | null,
}
```

In `DeckBuilderLabPage.jsx`:

- calcola il conteggio per Armata sul roster completo;
- mostra soltanto le Eminenze delle Armate con conteggio >= 5;
- consenti una sola selezione;
- per un 5–5, mostra entrambe le possibilità ma salva una sola `eminenceId`;
- impedisci di salvare un ID non eleggibile;
- non rendere invalido un vecchio mazzo solo perché `eminenceId` manca.

Per i mazzi precostruiti, il formato può accettare `eminenceId` accanto a `name`, `description` e `cards`.
Non valorizzarlo finché le Eminenze di produzione non sono approvate.

Centralizza la logica in una funzione pura, ad esempio:

```js
getEligibleEminences(deckCards, eminenceDefinitions)
validateDeckEminence(deckCards, eminenceId, eminenceDefinitions)
```

Non duplicare il conteggio fra deckbuilder, startGame e multiplayer.

---

## 9. Multiplayer online: segretezza reale con commit–reveal

Il server attuale è principalmente un relay. Inviare subito `abilityId` al peer e nasconderlo soltanto nella
UI non è scelta segreta: il dato sarebbe già arrivato al client avversario.

Implementa un piccolo protocollo commit–reveal.

### 9.1 Setup match

Aggiungi ai payload `deck_ready` e `match_start` gli ID delle Eminenze selezionate. L'host deve validare
l'ID del guest contro il set completo ricevuto/risolto.

Campi suggeriti:

```js
hostPlayerEminenceId
hostEnemyEminenceId
```

`normalizeOnlineMatchPayload` deve idratare gli ID usando i dati canonici locali e fallire con un errore
chiaro se un client non possiede la definizione richiesta.

### 9.2 Commit

Quando un giocatore blocca la scelta:

1. genera un nonce crittograficamente casuale;
2. calcola SHA-256 su una stringa canonica che contenga almeno
   `roomCode|roundNumber|playerId|eminenceId|abilityId|nonce`;
3. invia soltanto hash e round;
4. conserva localmente `abilityId` e nonce.

Usa Web Crypto (`crypto.subtle.digest` e `crypto.getRandomValues`), non un hash custom.

### 9.3 Reveal

Quando entrambi i commit sono presenti:

- invia `abilityId` e nonce;
- ricalcola e verifica l'hash del peer;
- rifiuta reveal non valido o riferito a un altro round;
- risolvi soltanto dopo entrambe le verifiche;
- scarta messaggi di round vecchi e accoda quelli futuri come già avviene per `peer_move`.

Tipi relay suggeriti:

```js
{ type: 'eminence_commit', roundNumber, hash }
{ type: 'eminence_reveal', roundNumber, eminenceId, abilityId, nonce }
```

Non riutilizzare `phase: 'agent'` o `phase: 'field'` per questi messaggi.

### 9.4 Determinismo

Host e guest devono ottenere risultati speculari identici. Aggiungi un test che risolva lo stesso round
dalle due prospettive e confronti Presenza, spesa cumulativa, blocchi ed eventi normalizzati.

---

## 10. IA

L'IA deve scegliere l'abilità dell'Eminenza senza leggere la scelta segreta del giocatore.

### 10.1 Information set

In `buildAIInformationSet` includi soltanto dati pubblici:

```js
player.eminence = {
  definitionId,
  presence,
  totalPresenceSpent,
  blockedUntilRound,
}

ai.eminence = {
  definitionId,
  presence,
  totalPresenceSpent,
  blockedUntilRound,
}
```

Non includere mai `playerEminenceChoice`, `selectedAbilityId`, nonce o reveal non ancora pubblico.

Aggiorna `validateAIInformationSet` con un controllo esplicito contro queste informazioni private.

### 10.2 Scelta IA

Crea una funzione separata, per esempio `chooseAIEminenceAbility(infoSet, options)`, che:

- considera soltanto abilità legalmente pagabili;
- auto-passa se bloccata o senza Eminenza;
- non legge la scelta del giocatore;
- usa un sistema di scoring estendibile basato sul registro effetti;
- non contiene eccezioni hardcoded per una singola Eminenza.

Finché mancano le abilità di produzione, testa il comportamento con fixture locali. Non aggiungere una
scelta casuale non testata al flusso reale.

### 10.3 Simulazione e cache

Poiché i nuovi trigger ed effetti cambiano l'esito del duello, aggiungi lo stato pubblico Eminenza a:

- `buildPublicDecisionKey`;
- `publicStateHash`;
- `buildSimulateAIDuelCacheKey`;
- `buildStrategicState` e proiezione post-duello, se usate dal planner;
- input di `simulateAIDuel`.

Aggiorna `strategyPlanner.js` perché valuti correttamente le finestre di Invocazione, Riverbero, Vigilia,
Auge, Eruzione, Zenit ed Eclissi. Non aggiungere questi trigger al set locale dei post-battle trigger.

---

## 11. Glossario e spiegazioni

Aggiorna:

- `src/data/triggers.js` con nomi e descrizioni esatte;
- `getAbilityExplanation` con `presence`, `enemyPresence` e `blockEminence`;
- `src/data/glossary.js` con Eminenza e Presenza;
- eventuali filtri del deckbuilder che derivano gli effetti da liste hardcoded;
- debug IA che visualizza trigger/effetti.

Testi minimi:

```text
Eminenza — carta fuori mazzo legata a un'Armata, con un effetto statico e tre abilità scelte in segreto prima del Campo.
Presenza — risorsa persistente e visibile usata dalle abilità dell'Eminenza; non ha cap e a 0 non causa penalità.
```

---

## 12. Test obbligatori

Non considerare concluso il lavoro senza test automatici.

### 12.1 Eleggibilità

- 10 carte della stessa Armata → quell'Armata è eleggibile;
- 6–4 → è eleggibile soltanto l'Armata con 6;
- 5–5 → sono eleggibili entrambe, ma si può selezionare un solo ID;
- 4–4–2 → nessuna eleggibile;
- il conteggio usa il mazzo completo, non la mano;
- un `eminenceId` di Armata non eleggibile viene rifiutato;
- un vecchio mazzo con `eminenceId: null` resta caricabile.

### 12.2 Resolver Eminenza

- legalità del costo sullo snapshot;
- pagamento simultaneo;
- entrambe le abilità legali si risolvono anche se una drena l'altra;
- Presenza senza cap;
- clamp a 0 per i drenaggi;
- Presenza 0 senza morte/reset;
- spesa del round corretta;
- spesa cumulativa persistente;
- auto-pass per un lato senza Eminenza;
- auto-pass per `blockEminence` e scadenza esatta dopo un round;
- statico non disattivato dal blocco;
- errore in sviluppo per effect type non registrato.

### 12.3 Trigger

- Invocazione false a 0 speso, true a 1+;
- Riverbero speculare;
- Vigilia true soltanto a 0;
- Auge false a 5, true a 6;
- `augeThreshold` con confronto stretto;
- Eruzione false a totale 2, true a 3 e nei round successivi;
- Zenit/Eclissi corretti e false in parità;
- nessuno dei sette compare in `POST_BATTLE_TRIGGERS`;
- simmetria completa di `buildDuelTurnContexts`.

### 12.4 Non retroattività

Caso obbligatorio:

- il giocatore entra nel duello a Presenza 5;
- un agente applica `presence +2`;
- Auge resta non soddisfatta per quel duello;
- `battleResult.finalPlayerPresence` vale 7;
- nel round successivo Auge risulta soddisfatta.

Ripeti il principio con `enemyPresence` e Riverbero: il drenaggio non equivale a spesa.

### 12.5 Multiplayer e IA

- commit non rivela l'abilità;
- reveal valido verifica l'hash;
- nonce o abilityId alterati vengono rifiutati;
- messaggio di round vecchio viene scartato;
- risultato host/guest speculare;
- information set IA non contiene la scelta privata del giocatore;
- chiave cache cambia quando cambia la Presenza pubblica;
- IA bloccata effettua auto-pass.

### 12.6 Regressione

Esegui almeno:

```bash
npm test
npm run build
```

Non modificare i test esistenti per nascondere regressioni. Aggiungi default compatibili alle nuove API
quando i vecchi test costruiscono context senza Eminenza.

---

## 13. Ordine di implementazione

Procedi in piccoli commit logici, mantenendo sempre i test verdi.

1. **Dominio puro**: definizioni, validazione dati, eleggibilità, stato iniziale, resolver simultaneo, test.
2. **Trigger**: contesto e sette trigger, nomi/descrizioni, test.
3. **Effetti agente**: stato duello, `presence`, `enemyPresence`, `blockEminence`, battleResult, test di non
   retroattività.
4. **Stato e flusso locale**: `useGameState`, setup, nuova fase prima del Campo, reset/round/rematch.
5. **Deckbuilder**: `eminenceId`, selezione e validazione centralizzata.
6. **UI produzione**: pannello nel vero duello, senza layout parallelo.
7. **IA**: information set, scelta, simulazione, cache e planner.
8. **Multiplayer**: ID nel setup, commit–reveal, code round e determinismo.
9. **Glossario/log** e rifinitura.
10. **Suite completa e build**.

---

## 14. Non-obiettivi e decisioni che Cursor non deve inventare

Questa implementazione non autorizza Cursor a decidere:

- i testi definitivi delle tre abilità de **Il Sole Verde**;
- i testi definitivi delle tre abilità de **L'Organizzatore degli Incontri**;
- i valori di bilanciamento/FN/MS dei nuovi trigger;
- il prezzo teorico in FC di `presence`;
- quali Armate riceveranno agenti con `enemyPresence`;
- nuove immunità o interazioni dei Campi con l'Eminenza;
- Apici/Eminenze bi-Armata;
- `copyEminence`;
- una nuova estetica completa del duello.

Implementa punti di estensione chiari e usa fixture soltanto nei test.

---

## 15. Criteri finali di accettazione

Il lavoro è accettabile soltanto se:

- la categoria in UI si chiama Eminenza e non collide con l'Armata Apex;
- l'eleggibilità usa il mazzo completo da 10 e la soglia 5;
- esiste al massimo una Eminenza per lato;
- la Presenza è pubblica, persistente, senza cap e non penalizza a 0;
- ogni round Eminenza risolve prima del Campo;
- la scelta è realmente segreta e simultanea, anche online;
- i Campi non toccano le abilità dell'Eminenza;
- gli agenti leggono lo snapshot già risolto e modificano soltanto i round futuri;
- Invocazione, Riverbero, Vigilia, Auge, Eruzione, Zenit ed Eclissi hanno la semantica esatta;
- Eruzione resta attiva dopo il raggiungimento di 3 Presenza spese;
- `copyEminence` non esiste;
- locale, IA e multiplayer condividono resolver e regole, senza tre implementazioni divergenti;
- nessuna informazione segreta entra nell'information set IA;
- UI e logica non vivono in un lab parallelo;
- `npm test` e `npm run build` terminano con successo.

Al termine, fornisci:

1. elenco dei file modificati/creati;
2. breve descrizione delle decisioni architetturali;
3. test aggiunti;
4. output sintetico di `npm test` e `npm run build`;
5. elenco esplicito degli eventuali punti rimasti bloccati per mancanza di contenuto di game design.
