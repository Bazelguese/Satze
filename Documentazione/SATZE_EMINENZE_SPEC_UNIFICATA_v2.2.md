# SATZE — Eminenze
## Specifica unificata di design e implementazione v2.2

**Data:** 31 agosto 2026  
**Stato:** **FONTE CANONICA UNICA PRE-IMPLEMENTAZIONE**  
**Ambito:** regole di sistema, formati e deckbuilding, pipeline del round, modello tecnico, IA, multiplayer online, UI, test e catalogo completo delle 12 Eminenze

> **Autorità del documento.** Da questa versione, questo file sostituisce come fonte normativa sia `SATZE_EMINENZE_PROTOTIPI.md` sia `SATZE_EMINENZE_SPEC_TECNICA_v1.md`. I due documenti precedenti possono essere conservati come storico, ma non devono essere usati per implementare il sistema quando divergono da questa specifica.

> **Aggiornamento v2.2.** Consolidata la semantica informativa dei gate: anche il superamento di un gate senza reveal è informazione pubblica. Khemet +0 passa a `PRE_FIELD`, rendendo esplicitamente aperta l'intera scelta Khemet prima del Campo. Il resolver degli overlay trigger viene anticipato alla Fase 1 perché necessario al Grande Semaforo MVP. Chiarito inoltre il setup pubblico della prima Preda Mounthborn.

> **Addendum pre-implementazione.** Generalizzata l'assegnazione di un gate per igiene informativa (§3.2), così che Khemet +0 sia l'applicazione di una regola e non una deroga. Precisato che la deduzione di legalità dell'IA usa la Presenza pubblica **al checkpoint di selezione**, non il contatore corrente (§10.4).

> **Addendum di implementazione — Apex.** Fissati momento, bersaglio e carta della sostituzione operata dall'Ora Verde, e delimitata la portata di “ignora gli effetti del Campo” alla sola dimensione per-Agente, lasciando in vigore per entrambi i giocatori le regole strutturali del Campo (§12.1). Entrambe le precisazioni erano necessarie a rendere l'Eminenza eseguibile senza scelte di design lasciate al codice.

> **Addendum di design — economia e timing.** (1) Ogni abilità di ricarica (slot non negativo) deve agire sul tavolo oppure essere una scommessa reale; non basta «se [osservazione], +N Presenza» senza decisione (§11.9). (2) Un guadagno di Presenza si risolve al primo checkpoint in cui la sua condizione è conoscibile; anticiparlo o posticiparlo rispetto a `PRESENCE_SNAPSHOT` (§8.1) è una leva di bilanciamento dichiarata, non un dettaglio implementativo (§8.1.1). (3) Invarianti di curva: esattamente una opzione non negativa; la top raggiungibile al più due volte per Scontro (§11.10).

---

# 0. Obiettivo e principi

L'Eminenza deve essere implementata come **livello di regole sopra il Duello**, non come una seconda versione del motore di combattimento.

Questa specifica unifica le decisioni di design già approvate con i vincoli tecnici verificati nel progetto SATZE. L'obiettivo è rendere non ambigui:

1. accesso e stato dell'Eminenza;
2. economia della **Presenza**;
3. scelta segreta e bluff;
4. **tre gate semantici di reveal**;
5. differenza tra reveal, pagamento, attivazione e risoluzione;
6. Focus Coin temporanei;
7. sostituzione/forzatura/divieto dei trigger;
8. Lega effettiva e Ancorato;
9. effetti persistenti, post-Duello e Fine Scontro;
10. formati e validazione della scelta Eminenza;
11. integrazione IA senza accesso all'informazione segreta;
12. commit–reveal per il multiplayer online;
13. UI, logging, test e ordine di implementazione;
14. testi canonici delle dodici Eminenze.

Principio di design centrale:

> **L'Eminenza è una cosa sotto cui l'Armata combatte.**

Può essere creatura, luogo, rito, istituzione, fenomeno, oggetto o ambiente. Non è semplicemente un Agente più forte.

---

# 1. Regole strutturali comuni

## 1.1 Natura dell'Eminenza

Un'Eminenza:

- è **fuori dal Deck**;
- non occupa slot;
- non contribuisce ai punti Lega;
- non possiede POT, DAN o VA;
- non viene schierata;
- non partecipa direttamente al Duello;
- resta attiva per tutto lo **Scontro**;
- possiede una quantità di **Presenza**;
- possiede uno **Statico**;
- possiede normalmente **3 abilità attive**;
- può creare stati persistenti e modificatori temporanei.

**Eccezione approvata:** la Corte Rossa possiede **4 abilità attive**. La struttura dati non deve assumere `abilities.length === 3`.

## 1.2 Accesso, formati e deckbuilding

Un Deck rende **eleggibile** l'Eminenza di un'Armata se contiene almeno **5 carte di quell'Armata su 10**.

La presenza del sottosistema Eminenza dipende dal **formato**. La specifica riconosce due stati di formato:

- **Eminenze richieste:** ogni Deck deve registrare **esattamente una Eminenza valida già durante la costruzione del mazzo**;
- **Eminenze disattivate:** il sottosistema Eminenza non viene usato e la relativa fase/gate non esiste.

Nei formati con Eminenze richieste:

- una partita non può iniziare se uno dei Deck non possiede un'Eminenza valida;
- l'Eminenza scelta deve appartenere a un'Armata resa eleggibile dalla composizione del Deck;
- in un Deck 5–5 entrambe le Eminenze sono eleggibili, ma **una sola viene scelta e salvata nella decklist**;
- la scelta dell'Eminenza non avviene all'inizio dello Scontro e non può essere cambiata durante lo Scontro;
- lo stato legale normale contiene quindi sempre un'Eminenza per entrambi i giocatori.

Il codice deve comunque tollerare difensivamente `eminence: null` per vecchi salvataggi, test o stati corrotti, ma **non deve attribuire a tale fallback alcuna semantica competitiva**. In particolare non va trattato come “Presenza 0” per soddisfare Digiuno o confronti di Presenza.

`blockEminenza` non rimuove l'Eminenza dal Deck e non crea uno stato “senza Eminenza”: impedisce soltanto di usarla nel round indicato.

## 1.3 Terminologia temporale

- **Duello** = confronto del singolo round.
- **Scontro** = partita completa, normalmente fino a cinque round / condizione terminale.
- **Scelta** = decisione segreta dell'abilità Eminenza.
- **Reveal** = momento in cui l'abilità diventa pubblica e il suo delta base di Presenza viene applicato.
- **Attivazione** = l'abilità è stata scelta, rivelata e resa operativa.
- **Risoluzione** = applicazione concreta dell'effetto; può avvenire subito o in un checkpoint successivo.
- **Pendente** = effetto già attivato che aspetta il proprio checkpoint.

---

# 2. Presenza

## 2.1 Regole generali

La **Presenza**:

- persiste fra i round;
- è pubblica;
- non ha un massimo globale;
- non può scendere sotto 0;
- può tornare a crescere dopo aver raggiunto 0;
- viene generata da abilità/statici Eminenza e, in futuro, da effetti Agente;
- non deve essere trattata come semplice secondo Focus Coin.

Ogni Eminenza deve avere almeno un'opzione non negativa, così da non rimanere senza scelta legale.

## 2.2 Nessun Pass volontario

> **In un formato con Eminenze richieste, ogni giocatore la cui Eminenza non è bloccata deve scegliere esattamente una capacità attiva a inizio round.**

Non esiste un comando Pass volontario.

Se `blockEminenza` impedisce l'uso dell'Eminenza, il mancato utilizzo è forzato.

## 2.3 Legalità della scelta e costo

Una capacità a costo negativo è selezionabile solo se il giocatore possiede Presenza sufficiente **nel momento della scelta segreta**.

La scelta viene poi bloccata. Non può diventare retroattivamente illegale perché un altro effetto risolve prima.

Per robustezza tecnica conviene registrare:

```js
selectionSnapshotPresence
committedPresenceCost
```

`committedPresenceCost` è una **prenotazione di legalità**, non una spesa pubblica anticipata: il contatore non cambia fino al reveal.

## 2.4 Reveal e variazione della Presenza

Al reveal dell'abilità:

- il costo `−X` viene pagato;
- il guadagno base `+X` viene applicato;
- `presenceSpentThisRound` e `totalPresenceSpent` vengono aggiornati per i costi;
- la variazione diventa pubblica.

Se un effetto condizionale dell'abilità genera Presenza più avanti, quel guadagno avviene nel checkpoint in cui la condizione si verifica, non al reveal.

Esempio: **Sacrificio** Kethran genera +1 solo dopo una sconfitta.

## 2.5 Pagamento atomico vs risoluzione ordinata

Questa distinzione è canonica:

> **Le scelte sono simultanee. Il reveal della stessa finestra è simultaneo. Legalità e pagamento dei costi della stessa finestra sono atomici rispetto allo snapshot delle scelte. La risoluzione degli effetti non è simultanea: a parità di checkpoint segue l'iniziativa.**

Quindi non esiste un “vantaggio del first player” che renda illegale o impedisca il pagamento di una scelta già confermata; esiste invece deliberatamente una **precedenza del giocatore con iniziativa nella risoluzione degli effetti**.

## 2.6 API centrale consigliata

```js
changePresence(playerId, delta, {
  reason,
  countsAsSpend = false,
  source = null,
  roundNumber = null
})
```

Responsabilità:

- clamp `>= 0`;
- aggiornamento Presenza;
- `presenceSpentThisRound`;
- `totalPresenceSpent`;
- log/eventi;
- distinzione fra **spesa** e semplice perdita di Presenza.

Un futuro effetto “perdi 1 Presenza” non conta automaticamente come “spendi 1 Presenza”.

---

# 3. Pipeline del round e sistema di bluff

## 3.1 Principio cardine

> **Tutte le Eminenze vengono scelte segretamente nello stesso momento, ma vengono rivelate il più tardi possibile senza oltrepassare una scelta che il loro effetto deve legittimamente influenzare.**

Il bluff deve restare vivo finché esistono decisioni che l'informazione nascosta può influenzare. Quando quelle decisioni sono locked, il segreto non ha più valore regolamentare.

## 3.2 Tre gate semantici di reveal

Le finestre sono **gate semantici**, non tre fasi rigide sempre nello stesso ordine cronologico.

### `PRE_FIELD`
Reveal necessario **prima della scelta del Campo**.

Usato quando l'abilità crea/modifica informazione che deve essere nota a chi sceglie il Campo.

Attualmente:
- Khemet +0;
- Khemet −2;
- Khemet −3.

**Decisione canonica Khemet:** tutte e tre le attive Khemet usano `PRE_FIELD`. Con due capacità su tre già obbligate a rivelarsi prima del Campo, il mancato reveal avrebbe comunque identificato con certezza il +0; renderlo esplicitamente `PRE_FIELD` non perde bluff ulteriore e rende coerenti UI, IA e multiplayer.

### `PRE_AGENT`
Reveal necessario **prima della scelta dell'Agente**.

Attualmente:
- Mounthborn +0;
- Enclave −1;
- Corte Rossa −3 Debito.

### `GENERAL`
Reveal più tardivo.

Avviene **appena tutte le decisioni dei giocatori rilevanti per il Duello sono state confermate e non sono più modificabili**, e comunque prima della normale risoluzione del Campo, dei trigger, dei Poteri e del VA.

Tutte le capacità che non devono influenzare Campo o scelta Agente restano nascoste fino a qui.

### Assegnazione di un gate per igiene informativa

La definizione funzionale dei gate non è l'unico criterio di assegnazione.

> **Un'abilità può essere assegnata a un gate anticipato anche quando il suo effetto non richiede direttamente quel gate, se ciò è necessario a evitare che il mancato reveal identifichi deterministicamente la scelta effettuata.**

Khemet +0 è il caso canonico: il suo effetto non produce informazione rilevante per la scelta del Campo, ma con le altre due attive obbligate a `PRE_FIELD` il suo silenzio equivarrebbe a una dichiarazione. Assegnarlo a `PRE_FIELD` non è una deroga arbitraria: è l'applicazione di questa regola.

Criterio operativo per ogni nuova Eminenza: se, tolte le abilità legate a un gate anticipato, l'insieme residuo ha cardinalità 1, quel gate rivela comunque tutto. In quel caso o si anticipa anche l'abilità residua, oppure si ridistribuiscono i gate.

### Il superamento di un gate è informazione pubblica

> **Attraversare un gate senza aprire il commitment è esso stesso informazione pubblica.**

Quando `PRE_FIELD` o `PRE_AGENT` è stato definitivamente superato:

- l'avversario sa che ogni abilità che avrebbe dovuto rivelarsi a quel gate non è stata scelta, salvo che l'abilità sia già stata rivelata;
- questa deduzione è informazione legittima e può restringere l'insieme delle abilità ancora possibili;
- lo stesso vale per l'IA: il gate attraversato e lo stato di reveal entrano nel suo information set;
- `publicStateHash` e le cache pubbliche devono distinguere “gate non ancora raggiunto” da “gate già superato senza reveal”;
- non è necessario duplicare lo stato con un flag specifico `didNotRevealAtGate` se la progressione dei gate e lo stato di apertura del commitment rendono il fatto deterministico.

Questa perdita parziale d'incertezza è una conseguenza intenzionale dei gate semantici. Mounthborn, Enclave e Corte Rossa possono quindi restringere l'insieme delle opzioni avversarie al passaggio di `PRE_AGENT`; Khemet è invece esplicitamente un'Eminenza a informazione aperta prima della scelta del Campo.

## 3.3 Pipeline normale

Questa pipeline è attiva **solo nei formati con Eminenze richieste**. Se il formato disattiva le Eminenze, l'intero sottosistema viene saltato: nessuna scelta Eminenza, nessun gate `PRE_FIELD` / `PRE_AGENT` / `GENERAL`, nessun contatore Presenza. Il resto del round segue la pipeline ordinaria del formato.

Senza effetti statici che cambiano l'ordine delle decisioni:

1. inizio round / cleanup;
2. scelta segreta Eminenza di entrambi;
3. `PRE_FIELD` per le abilità che lo richiedono;
4. scelta e lock del Campo;
5. `PRE_AGENT` per le abilità che lo richiedono;
6. scelta e lock degli Agenti;
7. investimento e lock dei Focus Coin;
8. `GENERAL`: reveal simultaneo di tutte le Eminenze ancora nascoste;
9. risoluzione degli effetti Eminenza immediati in ordine d'iniziativa;
10. armamento degli effetti Eminenza differiti;
11. normale risoluzione del Campo;
12. costruzione TriggerContext / trigger / Poteri / Bonus;
13. calcolo VA ed esito;
14. checkpoint post-esito / Conquista / Ultimo Desiderio / DAN / aftermath secondo le regole specifiche;
15. cleanup di fine round oppure ingresso nella Fine Scontro.

## 3.4 Pipeline con Mascarada

Lo Statico dell'Organizzatore rende pubblici gli Agenti **prima della scelta del Campo**. Per questo i gate seguono l'ordine effettivo delle decisioni:

1. inizio round;
2. scelta segreta Eminenza;
3. `PRE_AGENT`;
4. scelta/reveal e lock degli Agenti;
5. `PRE_FIELD`;
6. scelta e lock del Campo;
7. investimento e lock FC;
8. `GENERAL`;
9. risoluzione Eminenze;
10. normale risoluzione del Duello.

Questa è la ragione per cui `PRE_FIELD` e `PRE_AGENT` non devono essere hardcodati come “fase 2” e “fase 4”: sono **barriere prima di una decisione**, e la sequenza reale può essere riorganizzata da regole pubbliche dello Scontro.

## 3.5 Reveal generale

Il `GENERAL` è il punto in cui il bluff cessa di influenzare le scelte.

Devono essere già locked:

- Campo;
- Agenti;
- investimento FC;
- eventuali altre decisioni pre-risoluzione introdotte in futuro.

A quel punto:
- le abilità ancora nascoste vengono mostrate simultaneamente;
- i delta base di Presenza vengono applicati;
- gli effetti immediati vengono risolti in iniziativa;
- gli effetti differiti vengono registrati.

## 3.6 Target e parametri

Default:

> **Il bersaglio/parametro viene scelto al reveal dell'abilità.**

Eccezione:

> se poter aspettare il reveal fornirebbe informazione nuova che rende la scelta impropriamente più forte, il parametro deve essere scelto e bloccato già a inizio round.

Caso canonico:
- Mascarada +0: insieme alla capacità viene scelto segretamente anche il pronostico **vittoria propria / vittoria avversaria / pareggio**.

## 3.7 Effetti immediati e pendenti

Una stessa abilità può avere più segmenti:

```js
pendingEffect = {
  sourceEminenceId,
  abilityId,
  ownerPlayerId,
  timing,
  payload,
  consumed: false
}
```

Checkpoint consigliati:

```js
AFTER_REVEAL
BEFORE_FIELD_RESOLUTION
BEFORE_TRIGGER_CHECK
BEFORE_POWER_RESOLUTION
AFTER_DUEL_OUTCOME
BEFORE_CONQUEST
POST_BATTLE
END_ROUND
END_MATCH
```

`revealGate` e `effectTiming` sono due cose diverse.

Esempio: Calibri −4 è rivelata al `GENERAL`, ma il segmento operativo aspetta `BEFORE_CONQUEST`.

---

# 4. Modello di stato

## 4.1 Stato Eminenza per giocatore

Schema consigliato:

```js
eminenceState: {
  // Non-null nello stato legale di un formato con Eminenze richieste.
  eminenceId: null,

  presence: 0,
  totalPresenceSpent: 0,
  presenceSpentThisRound: 0,

  selectedAbilityId: null,
  selectedParams: null,
  selectionSnapshotPresence: 0,
  committedPresenceCost: 0,

  revealedAbilityId: null,
  revealGateReached: null,

  blockedThisRound: false,
  blockedNextRound: false,

  persistent: {},
  round: {}
}
```

`selectedAbilityId`, `selectedParams`, `selectionSnapshotPresence` e ogni nonce/commitment privato sono **informazione segreta** fino al gate corretto. Non basta nasconderli nella UI: non devono entrare nell'information set dell'IA avversaria, nel public state usato dalle cache, né nei payload online destinati all'avversario prima del reveal.

È consigliato separare logicamente:

```js
privateEminenceSelection = {
  selectedAbilityId,
  selectedParams,
  selectionSnapshotPresence,
  committedPresenceCost,
  commitNonce
}

publicEminenceState = {
  eminenceId,
  presence,
  totalPresenceSpent,
  revealedAbilityId,
  revealGateReached,
  blockedThisRound,
  persistentPublicState
}
```

La progressione dei gate è inoltre **stato pubblico del flusso di round**. Può vivere nella state machine generale (`currentGate`, `completedGates` o equivalente) invece che duplicata dentro ogni `eminenceState`, ma deve essere serializzabile e disponibile a UI, IA, replay e `publicStateHash`.

La separazione può essere fisica o ottenuta tramite selector/serializer dedicati, ma il confine informativo deve essere verificabile dai test.

## 4.2 Stato persistente

Esempi:

```js
persistent: {
  anchoredThresholdDelta: 0,
  fragmentCardIds: [],
  preyCardIds: [],
  debitoByCardId: {},
  endMatchDebts: [],
  slotCurses: {},
  custom: {}
}
```

Le Maledizioni Khemet appartengono allo **slot**, quindi è preferibile che lo stato reale viva nel game state della board e non nella carta Campo:

```js
battlefieldSlot: {
  field,
  eminenceModifiers: []
}
```

## 4.3 Stato temporaneo di round

```js
round: {
  pendingEffects: [],
  triggerRules: null,

  temporaryLeagueByCardId: {},
  temporaryFocusByCardId: {},

  suppressArmyBonus: false,
  forceArmyBonusActive: false,
  armyBonusUnblockable: false,

  ignoreFieldForCardIds: [],

  custom: {}
}
```

Non usare un singolo oggetto come pretesto per hardcodare ogni Eminenza: `custom` serve solo per payload specifici; le primitive di regole condivise devono avere campi normalizzati.

---

# 5. Schema dati Eminenza

File suggerito:

```text
src/data/eminences.js
```

Schema:

```js
export const EMINENCES = {
  apex_sole_verde: {
    id: 'apex_sole_verde',
    army: 'Apex',
    name: 'Il Sole Verde',
    initialPresence: 3,

    static: {
      id: 'ora_verde',
      text: '...'
    },

    abilities: [
      {
        id: '...',
        presenceDelta: 1,
        revealGate: 'GENERAL',
        choiceParamsTiming: 'AT_REVEAL',
        segments: [
          { timing: 'AFTER_REVEAL', effect: '...' }
        ],
        text: '...'
      }
    ]
  }
}
```

## 5.1 Campi obbligatori consigliati

Per ogni abilità:

```js
{
  id,
  presenceDelta,
  revealGate,          // PRE_FIELD | PRE_AGENT | GENERAL
  choiceParamsTiming,  // AT_SELECTION | AT_REVEAL
  segments,
  text
}
```

Non codificare il costo solo nel testo.

La Corte Rossa dimostra che l'array `abilities` deve essere a lunghezza variabile.

---

# 6. Focus Coin temporanei

Definizione canonica:

> **Un Focus Coin temporaneo viene assegnato a un Agente per il Duello corrente. Si comporta come un normale FC posseduto dall'Agente, ma non viene speso dal pool del controllore e scompare a fine Duello.**

Rappresentazione:

```js
focus = {
  invested: 3,
  temporary: 1,
  effective: 4
}
```

oppure valori separati equivalenti:

```js
focusInvested
temporaryFocus
effectiveFocus = focusInvested + temporaryFocus
```

Interazioni canoniche:

| Lettura | FC temporanei |
|---|---|
| VA | **Sì** |
| Overdrive | **Sì** |
| Opportunista | **No** |
| Accumulo Enclave (investi ≥3) | **No** |
| Ancorato Figli | **No** |
| riserva minima / legal spend pool | **No** |
| effetti Campo sul contributo FC al VA | **Sì**, perché lavorano sull'effettivo contributo al Duello |
| futuro testo “spendi/investi FC” | **No**, salvo testo esplicito |

## 6.1 Refactor necessario nel contesto trigger

Oggi `triggerLogic.js` documenta `focusCoins` e `enemyFocusCoins` come FC **investiti**, e Overdrive legge direttamente `context.focusCoins`, mentre Opportunista legge `enemyFocusCoins`. Il nuovo sistema deve distinguere almeno:

```js
focusInvested
enemyFocusInvested
effectiveFocus
enemyEffectiveFocus
```

Regola:
- Overdrive → `effectiveFocus`;
- Opportunista → `enemyFocusInvested`.

Il limite di spesa del pool deve continuare a usare soltanto i reali FC investiti.

---

# 7. Trigger, Power e Bonus: overlay di regole

## 7.1 Obiettivo

Non aggiungere una cascata di:

```js
if (eminence === '...')
```

dentro `checkTrigger`.

Serve un resolver generico che distingua:
- identità del trigger;
- condizione naturale;
- sostituzioni;
- alias;
- forzatura;
- divieto;
- disattivazione;
- blocco.

## 7.2 `triggerRules`

Schema indicativo:

```js
triggerRules: {
  replacementsByCardId: {},
  aliasesByCardId: {},

  forceSatisfied: [],
  forceForbidden: [],

  unblockablePowerCardIds: [],

  suppressConquestForSide: {
    player: false,
    enemy: false
  },

  custom: {}
}
```

## 7.3 Ordine canonico

La grammatica approvata è:

1. **Sostituzione del trigger** — determina quale trigger possiede il Potere.
2. **Modifiche normali alla condizione** — soglie, inversioni, swap, alias/condizioni alternative del Campo o di altre regole.
3. **Force / Forbid** — “considerato soddisfatto” / “non può attivarsi”.
4. **Disattivazione globale del Potere/Bonus**.
5. **Blocca Potere/Bonus** normale.

Regole:
- `FORBID` prevale su `FORCE` in conflitto diretto.
- Trigger soddisfatto non significa Potere necessariamente risolto.
- “non può essere bloccato” supera il normale Blocca.
- “non può essere bloccato” **non** supera “Poteri disattivati”.
- disattivazione di Blocca e disattivazione dei Poteri sono categorie diverse.

## 7.4 Sostituzioni multiple

Regola canonica:

> Una sostituzione temporanea specifica del Duello può sovrascrivere una sostituzione persistente; al termine del Duello la sostituzione persistente ritorna.

Esempio:
- Debito persistente;
- Il Circuito sostituisce temporaneamente il trigger;
- nel Duello vale Il Circuito;
- dopo il Duello torna Debito.

## 7.5 Resolver consigliato

```js
resolveTriggerState({
  originalTrigger,
  context,
  card,
  side,
  triggerRules
})
```

Output:

```js
{
  originalTrigger,
  effectiveTrigger,
  naturalSatisfied,
  satisfied,
  forced,
  forbidden,
  disabled,
  blocked,
  source
}
```

Questo output è necessario anche per Orathai, che deve leggere la **soddisfazione del requisito di attivazione** prima di eventuali Blocca successivi.

---

# 8. Trigger Eminenza e TriggerContext

Aggiungere al contesto:

```js
presenceSpent
enemyPresenceSpent
totalPresenceSpent
enemyTotalPresenceSpent
playerPresence
enemyPresence

focusInvested
enemyFocusInvested
effectiveFocus
enemyEffectiveFocus
```

Nuovi trigger:

| Trigger | Condizione |
|---|---|
| `manifestazione` | `presenceSpent > 0` |
| `blasfemia` | `enemyPresenceSpent > 0` |
| `fervore` | `totalPresenceSpent >= threshold`, default 3; latch cumulativo |
| `digiuno` | `playerPresence === 0` |
| `grazia` | `playerPresence >= threshold`, default 5 |
| `ascendente` | `playerPresence > enemyPresence` |
| `soggezione` | `playerPresence < enemyPresence` |

Nuovi effetti Agente:

```js
{ effect: 'presence', value: X }
{ effect: 'enemyPresence', value: -X }
{ effect: 'blockEminenza', value: null }
```

`enemyPresence` non conta automaticamente come Presenza “spesa” dal bersaglio.

`blockEminenza` imposta il blocco per il round successivo.

## 8.1 Snapshot canonico della Presenza

I trigger di Presenza non devono leggere un contatore “live” che cambia durante la successiva risoluzione del Duello.

> **Immediatamente prima della verifica dei normali trigger degli Agenti, dopo la risoluzione di tutti gli effetti Pre-Trigger del round, viene fissato uno snapshot della Presenza e dei contatori di spesa rilevanti. Tutti i trigger Eminenza di quel Duello usano quello snapshot e non vengono ricalcolati in seguito.**

Il checkpoint semantico è `PRESENCE_SNAPSHOT`, collocato dopo:

- tutti i reveal necessari, incluso `GENERAL`;
- gli effetti Eminenza immediati che risolvono prima dei trigger;
- la normale preparazione del Campo che deve precedere i trigger;
- il controllo **Ancorato** e l'eventuale guadagno del +0 dei Figli.

Vengono campionati almeno:

```js
playerPresence
enemyPresence
presenceSpent
enemyPresenceSpent
totalPresenceSpent
enemyTotalPresenceSpent
```

Conseguenze canoniche:

- una variazione di Presenza avvenuta **prima** di `PRESENCE_SNAPSHOT` può cambiare Digiuno, Grazia, Ascendente, Soggezione, Manifestazione, Blasfemia o Fervore del Duello corrente;
- una variazione avvenuta **dopo** lo snapshot non modifica retroattivamente quei trigger;
- la nuova Presenza resta comunque reale e sarà visibile ai checkpoint successivi e ai round futuri;
- se in futuro verrà creato un trigger di Presenza esplicitamente post-Duello, dovrà dichiarare il proprio checkpoint invece di riusare implicitamente lo snapshot pre-trigger.

### 8.1.1 Timing dei guadagni di Presenza

> **Un guadagno di Presenza si risolve al primo checkpoint in cui la sua condizione è conoscibile.** Anticiparlo o posticiparlo è una leva di bilanciamento **dichiarata** nella scheda dell'Eminenza, non una scelta silenziosa carta per carta.

Conseguenze:

- `BEFORE_TRIGGER_CHECK` (e qualunque timing prima di `PRESENCE_SNAPSHOT`) può accendere Digiuno, Grazia, Ascendente, ecc. nello stesso Duello;
- `AFTER_DUEL_OUTCOME` e oltre **non** lo fanno: due «+1 Presenza» nominalmente identici valgono cifre diverse se gli Agenti leggono la Presenza;
- oggi Leggerezza (Figli) è pre-snapshot per decisione esplicita del §12.9; Sacrificio, Convalida e lo Statico Khemet sono post — vanno trattati come scelte di bilanciamento documentate, non come default accidentale.

Il `TriggerContext` deve ricevere i valori già campionati, non riferimenti ai contatori live.

---

# 9. Lega effettiva e Ancorato

## 9.1 Regola generale

> **“Lega” significa sempre Lega effettiva nel momento della verifica. “Lega stampata” indica esplicitamente il valore originale della carta.**

Una modifica temporanea di Lega influenza quindi:
- Sfida;
- Sopraffare;
- Alleato;
- Rinforzi;
- Ancorato;
- Male Crescente;
- qualunque futuro controllo generico della Lega.

Non cambia la legalità di deckbuilding.

## 9.2 Alleato e Rinforzi

Se la Lega dell'Agente viene modificata per il round, il conteggio deve essere ricalcolato confrontando la **Lega effettiva dell'Agente giocato** con le altre carte della mano iniziale.

Non usare un conteggio precalcolato sulla Lega stampata se l'Enclave ha modificato la carta.

## 9.3 Ancorato

Snapshot canonico:
1. Campo/Agente/FC sono ormai definiti secondo la pipeline;
2. si usa `focusInvested`, non temporaryFocus;
3. si usa la Lega effettiva;
4. si determina Ancorato **una sola volta per Duello**;
5. lo snapshot non viene ricalcolato da modifiche successive;
6. il +0 dei Figli può generare Presenza subito dopo questo controllo e prima dei trigger.

---

# 10. Eventi semantici e integrazione al codice

## 10.1 Eventi consigliati

`duelResolve`/pipeline equivalente dovrebbe emettere eventi semantici, per evitare che gli Statici ricostruiscano a posteriori ciò che è successo:

```js
{
  type: 'HP_LOSS',
  playerId,
  amount,
  cause,
  isDuelDefeatDamage
}
```

```js
{
  type: 'STAT_REDUCTION',
  cardId,
  stat,
  amount,
  source
}
```

```js
{
  type: 'TRIGGER_STATE',
  cardId,
  effectiveTrigger,
  naturalSatisfied,
  satisfied,
  forbidden
}
```

```js
{
  type: 'POWER_RESOLVED',
  cardId,
  blocked,
  disabled
}
```

```js
{
  type: 'FIELD_CONQUERED',
  fieldId,
  playerId
}
```

Cause HP da distinguere almeno:

```js
DUEL_DEFEAT_DAMAGE
DIRECT_DAMAGE
SELF_DAMAGE
TOXIN
EMINENCE_COST
DEBT
END_MATCH_DEBT
OTHER
```

La Corte Rossa deve poter escludere il normale DAN da sconfitta.

## 10.2 File già rilevanti nel codice attuale

### `src/game/triggerLogic.js`
Oggi:
- Overdrive legge `context.focusCoins`;
- Opportunista legge `context.enemyFocusCoins`;
- Conquista e Ultimo Desiderio sono trigger post-battle;
- Alleato/Rinforzi usano `playerInitialLeagueCount`.

Da modificare:
- nuovi campi Presenza;
- split invested/effective Focus;
- nuovo resolver overlay;
- nuovi trigger Eminenza;
- supporto a Lega effettiva già calcolata.

### `src/game/duel/duelTurnContexts.js`
Oggi costruisce i due contesti usando `selectedFocus`, `enemySelectedFocus` e `pAgent.league/eAgent.league`.

Da modificare:
- ricevere le carte effettive;
- ricevere `focusInvested` ed `effectiveFocus`;
- includere Presenza;
- ricalcolare il count Lega quando necessario.

### `src/game/legalFocusSpend.js`
La riserva dura di almeno 1 FC per ogni Agente futuro deve continuare a considerare **solo il pool reale** e i reali FC investiti. I temporary Focus non modificano il legal max spendibile.

### Resolver Duello / aftermath Campo
Nel punto che determina esito e aftermath devono essere separati almeno:

```text
duelWinner
defeatDamage
conquestTriggerState
fieldOwnership
fieldDestroyed
```

Calibri dimostra che sono concetti distinti.

## 10.3 State owner

Gli stati Eminenza devono vivere nel proprietario dello stato completo dello Scontro, non in componenti UI locali.

Devono essere persistenti e serializzabili:
- Eminenza scelta;
- Presenza;
- scelta/reveal di round;
- Frammenti;
- Preda;
- Debiti;
- Maledizioni slot;
- Lega temporanea;
- pending effects;
- debiti Fine Scontro.


## 10.4 Integrazione IA

L'Eminenza entra nel sottosistema IA come **azione segreta obbligatoria di round** e come insieme di regole che modificano il valore dei Duelli simulati. Non è sufficiente aggiungere un punteggio all'abilità: l'IA deve giocare con lo stesso information model del giocatore umano.

File/sottosistemi già rilevanti nel progetto e da verificare/estendere durante l'implementazione:

- `buildAIInformationSet.js`;
- `simulateAIDuel.js`;
- `strategyPlanner.js`;
- `publicStateHash.js`;
- `scoreAIAction.js`;
- `projectPostDuelState.js`;
- test di integrazione IA collegati.

### Regola di non-cheating

Alla **scelta segreta di inizio round**, l'IA:

- conosce tutta l'informazione pubblica, inclusa la Presenza avversaria;
- conosce le proprie scelte private;
- **non conosce** `selectedAbilityId`, `selectedParams` o altri dati segreti della scelta Eminenza avversaria;
- deve scegliere la propria abilità e gli eventuali parametri `AT_SELECTION` usando esclusivamente l'information set legittimo in quel momento.

Quando l'avversario apre un commitment a `PRE_FIELD`, `PRE_AGENT` o `GENERAL`, l'informazione rivelata entra da quel momento nell'information set dell'IA e può essere usata per le decisioni che restano ancora aperte.

Anche **il superamento di un gate senza apertura** entra nell'information set: l'IA può eliminare dalle ipotesi le abilità avversarie che avrebbero obbligatoriamente dovuto rivelarsi a quel gate. Non può però inferire più di quanto derivi dallo stato pubblico effettivo.

### Deduzione di legalità dalla Presenza pubblica

Il secondo filtro legittimo dell'insieme delle ipotesi deriva dal §2.3: la Presenza è pubblica e la legalità di una capacità a costo negativo dipende dalla Presenza posseduta alla scelta segreta.

> **L'information set può escludere le abilità che erano pubblicamente illegali al momento della scelta segreta sulla base della Presenza allora disponibile. Questa deduzione usa lo stato pubblico al checkpoint di selezione, non eventuali variazioni di Presenza avvenute successivamente nel round.**

La precisazione è vincolante, non stilistica. Dopo un `PRE_FIELD`, un `PRE_AGENT`, un guadagno da Statico o il pagamento del costo altrui, il contatore corrente può non coincidere più con quello che determinava la legalità iniziale, in entrambe le direzioni: usare la Presenza corrente potrebbe escludere abilità che erano legali oppure ammetterne di illegali.

Va quindi conservato per il round il valore pubblico della Presenza di ciascun giocatore al checkpoint di selezione — l'equivalente pubblico di `selectionSnapshotPresence` — e la deduzione deve usare quello. I due filtri si compongono: insieme legale allo snapshot di selezione, intersecato con l'insieme compatibile con i gate già superati.

I parametri `AT_REVEAL` vengono scelti dall'IA al relativo gate e possono usare tutta l'informazione legittimamente pubblica in quel momento.

### Simulazione

`simulateAIDuel` e le proiezioni collegate devono modellare le **stesse primitive del resolver reale**, almeno per:

- `triggerRules` e ordine replacement → condition mods → force/forbid → disable → block;
- FC temporanei e distinzione `focusInvested` / `effectiveFocus`;
- Lega effettiva;
- Ancorato;
- stati persistenti pubblici come Preda, Frammenti, Debito, Maledizioni di slot e aumenti del requisito Ancorato;
- effetti Campo/Eminenza che cambiano Conquista, trigger o proprietà del Campo;
- pending effect rilevanti per la valutazione del Duello e della Fine Scontro.

L'IA non deve simulare un Duello con regole diverse da quelle usate dal resolver effettivo. Dove possibile, condividere primitive pure invece di duplicarne la logica.

### Hash e cache IA

`publicStateHash` e ogni chiave di cache che influenza la valutazione devono distinguere stati pubblicamente diversi. Includere almeno, quando rilevanti:

- Eminenza scelta in deckbuilding;
- Presenza corrente di entrambi;
- contatori pubblici/latch rilevanti, incluso lo stato di Fervore quando necessario;
- abilità già rivelate nel round e relativo gate;
- progressione pubblica dei gate e stato di apertura del commitment, così da distinguere un gate non ancora raggiunto da uno già superato senza reveal;
- stati persistenti pubblici Eminenza;
- modificatori pubblici di slot/Campo;
- Lega temporanea già resa pubblica;
- marker e debiti pubblici.

Non includere nella parte **pubblica** dell'hash una scelta Eminenza avversaria ancora sigillata. Se una simulazione interna dell'IA valuta una propria azione candidata, quella candidata deve invece far parte della chiave privata della simulazione per evitare collisioni fra linee diverse.

Per l'incertezza sulla scelta avversaria, l'IA può valutare/simulare più azioni Eminenza legalmente possibili dell'avversario secondo il proprio livello di difficoltà, ma non può usare la scelta reale ancora nascosta come scorciatoia.

## 10.5 Multiplayer online — commit–reveal

Il multiplayer remoto corrente usa un server WebSocket che inoltra i messaggi e **non è un arbitro autoritativo delle mosse di gioco**. Per impedire che un client cambi la propria scelta Eminenza dopo aver visto quella avversaria, la scelta segreta usa un protocollo commit–reveal lato client.

### Un solo commitment per round

I tre gate di reveal **non richiedono tre commit**. La scelta Eminenza viene effettuata una sola volta a inizio round e viene quindi sigillata con **un unico commitment**.

Payload canonico da impegnare:

```js
commitPayload = {
  protocolVersion,
  matchId,
  roundNumber,
  playerRole,
  eminenceId,
  abilityId,
  atSelectionParams, // solo parametri scelti segretamente a inizio round
  nonce
}

commitHash = SHA256(canonicalSerialize(commitPayload))
```

Requisiti:

- `nonce` deve provenire da una sorgente crittograficamente sicura;
- `canonicalSerialize` deve avere ordine dei campi deterministico e identico sui due client;
- il commitment deve coprire **tutti** i parametri `AT_SELECTION`, incluso il pronostico della Scommessa Mascarada;
- i parametri `AT_REVEAL` non fanno parte del commitment perché non esistono ancora al momento della scelta e vengono scelti legittimamente al gate;
- nessun client deve aprire il proprio commitment prima che entrambi i commitment del round siano stati ricevuti/confermati.

### Apertura al gate corretto

Quando l'abilità selezionata raggiunge il proprio `revealGate`, il client invia l'apertura:

```js
revealPayload = {
  protocolVersion,
  matchId,
  roundNumber,
  playerRole,
  eminenceId,
  abilityId,
  atSelectionParams,
  nonce
}
```

Il client avversario ricalcola l'hash e verifica che coincida con il commitment ricevuto.

- un'abilità `PRE_FIELD` apre il proprio commitment a `PRE_FIELD`;
- una `PRE_AGENT` lo apre a `PRE_AGENT`;
- una `GENERAL` resta sigillata fino a `GENERAL`;
- se i due giocatori hanno gate diversi, ciascun commitment viene aperto **solo al proprio gate**;
- una volta aperto, lo stesso commitment non viene “ricommesso” ai gate successivi.

### Gate superato senza apertura

Il protocollo deve considerare pubblico anche il fatto che un gate sia stato completato senza che un determinato commitment sia stato aperto. Questo non richiede un secondo commitment né un payload che dichiari quale abilità non è stata scelta: è sufficiente che entrambi i client condividano in modo deterministico la progressione del gate e lo stato `sealed/opened` del commitment.

Dopo il completamento del gate, l'avversario può legittimamente escludere tutte le abilità che avrebbero dovuto aprirsi in quella finestra. Tale informazione deve essere coerente fra UI, information set IA, replay/log e `publicStateHash`.

### Errori, riconnessione e limiti

- hash non valido, payload incoerente o doppia apertura incompatibile devono produrre uno stato di **desync/partita non valida**, non un'accettazione silenziosa;
- commitment e stato di apertura del round devono sopravvivere alla normale procedura di riconnessione della stanza;
- messaggi duplicati dopo riconnessione devono essere idempotenti;
- il commitment impedisce il cambio retroattivo della scelta Eminenza, ma **non trasforma il server relay in un server autoritativo** e non risolve da solo ogni forma di cheating su stato, RNG o altre mosse.

Se in futuro un'abilità richiederà di rivelare l'abilità a un gate ma mantenere un suo parametro già scelto segreto fino a un gate successivo, servirà una struttura di sub-commitment/Merkle o equivalente. **Nessuna Eminenza attuale lo richiede.**

---

# 11. UI, log e test

## 11.1 HUD Eminenza

Nei formati con Eminenze richieste, mostrare:
- nome;
- Presenza pubblica;
- Statico;
- abilità e delta Presenza;
- stato bloccato;
- stati persistenti tatticamente rilevanti.

## 11.2 Stati UI della scelta

Servono almeno:

1. **CHOOSING** — selezione segreta;
2. **LOCKED_HIDDEN** — scelta propria confermata, nemico ancora nascosto;
3. **REVEALED_PRE_FIELD** — se applicabile;
4. **REVEALED_PRE_AGENT** — se applicabile;
5. **REVEALED_GENERAL** — reveal definitivo del resto;
6. **PENDING_EFFECT** — capacità rivelata ma con segmento ancora in attesa;
7. **RESOLVED**.

Non è obbligatorio mostrare tutti questi nomi al giocatore; sono stati utili per la macchina/UI. Nei formati con Eminenze disattivate l'intero HUD e questi stati non vengono istanziati.

## 11.3 Reveal

Quando due abilità vengono rivelate nello stesso gate:
- apparizione simultanea;
- delta Presenza visualizzati nello stesso beat;
- poi animazione/risoluzione in ordine d'iniziativa.

Il pannello di reveal generale deve comparire **a ridosso della risoluzione del Duello**, dopo il lock delle scelte, non prima del Campo.

## 11.4 Indicatori persistenti

Necessari almeno:
- Frammento;
- Preda;
- Debito;
- Maledizione di slot;
- Campo Distrutto;
- Ancorato;
- Lega temporanea;
- FC temporanei.

## 11.5 Battle log

Esempi:

```text
[EMINENZA] Scelta confermata — nascosta.
[EMINENZA] Il Grande Semaforo → ROSSO.
[PRESENZA] Il Grande Semaforo: 2 → 0.
[TRIGGER] Turbo proibito dal Grande Semaforo.
[CAMPO] Protocollo Terra Bruciata: Campo X distrutto prima di Conquista.
[DEBITO] Agente Y: −2 PV; Potere attivato.
[ANCORATO] Agente Z: soglia 4 FC raggiunta.
```

Il log deve distinguere `REVEAL`, `PRESENCE_CHANGE`, `TRIGGER_OVERRIDE`, `PENDING_EFFECT`, `FIELD_STATE`, `END_MATCH_EFFECT`.

## 11.6 Test generici obbligatori

### Presenza
- inizializzazione;
- guadagno;
- costo;
- impossibilità di scegliere costo superiore alla Presenza allo snapshot;
- spesa e `totalPresenceSpent`;
- perdita di Presenza che non conta come spesa;
- reset del round;
- `PRESENCE_SNAPSHOT` include le variazioni avvenute prima del checkpoint;
- variazioni dopo `PRESENCE_SNAPSHOT` non cambiano retroattivamente i trigger del Duello corrente.

### Formati e deckbuilding
- formato Eminenza rifiuta Deck senza Eminenza;
- Eminenza scelta deve appartenere a un'Armata con almeno 5 carte;
- Deck 5–5 registra una sola Eminenza nella decklist;
- la scelta non cambia all'avvio dello Scontro;
- formato senza Eminenze salta completamente fase, gate e Presenza;
- fallback tecnico `eminence: null` non viene interpretato come Presenza 0.

### Bluff e reveal
- nessuna informazione avversaria prima del gate corretto;
- PRE_FIELD reveal prima della decisione Campo;
- PRE_AGENT reveal prima della decisione Agente;
- GENERAL solo dopo lock Campo/Agenti/FC;
- pipeline Mascarada con PRE_AGENT prima di PRE_FIELD;
- legalità e pagamento atomici;
- risoluzione in ordine d'iniziativa.

### Focus temporanei
- aumentano VA;
- attivano Overdrive;
- non attivano Opportunista;
- non contano per Accumulo;
- non contano per Ancorato;
- non modificano la riserva legale.

### Trigger overlay
- naturale true/false;
- replacement;
- alias/modifica condizione;
- force;
- forbid;
- forbid > force;
- global disable;
- block;
- unblockable vs block;
- unblockable non supera global disable.

### IA
- `buildAIInformationSet` non contiene scelta/parametri Eminenza avversari ancora nascosti;
- un reveal anticipato entra nell'information set solo dal gate corretto;
- superare `PRE_FIELD` / `PRE_AGENT` senza reveal restringe legittimamente le ipotesi IA sulle abilità avversarie;
- l'IA distingue “gate non ancora raggiunto” da “gate già superato senza reveal”;
- l'IA sceglie `AT_SELECTION` senza leggere la selezione reale avversaria;
- `publicStateHash` cambia quando cambia Presenza o uno stato Eminenza pubblico rilevante;
- `publicStateHash` cambia quando cambia la progressione pubblica dei gate in modo informativamente rilevante;
- `publicStateHash` non cambia soltanto perché cambia una scelta avversaria ancora sigillata;
- `simulateAIDuel` usa overlay trigger, FC temporanei, Lega effettiva e stati persistenti coerenti con il resolver reale;
- cache diverse per candidate Eminenza proprie diverse.

### Multiplayer commit–reveal
- entrambi i commitment vengono ricevuti prima di qualsiasi apertura;
- un solo commit per giocatore per round;
- apertura valida a PRE_FIELD / PRE_AGENT / GENERAL secondo `revealGate`;
- gate superato senza apertura è stato pubblico condiviso e restringe correttamente le abilità ancora compatibili;
- Mascarada Scommessa include il pronostico nel commitment;
- parametri `AT_REVEAL` non sono precommittati;
- modifica di abilityId, parametro `AT_SELECTION` o nonce causa verifica fallita;
- reconnect conserva commit e stato di apertura;
- replay di messaggi duplicati è idempotente.

### Fine Scontro
- effetti END_MATCH prima del verdetto;
- effetti END_MATCH possono essere letali;
- senza condizione terminale non si apre END_MATCH.

## 11.7 Test specifici per Eminenza

Devono essere mantenuti test per tutte le dodici. Casi minimi aggiuntivi particolarmente importanti:

- **Calibri −2:** annulla tutte le Conquista avversarie, incluse quelle con `selfDamage`; il Campo resta conquistato normalmente.
- **Calibri −4:** scatta dopo esito e prima di Conquista; nessuna Conquista; Campo distrutto; DAN normale prosegue.
- **Ratti −3:** forza Conquista anche se il Potere risultante ha `selfDamage`; non assegna automaticamente il Campo.
- **Ratti −2:** può non produrre valore aggiuntivo se Tossina è già al proprio minimo; nessun fallback.
- **Khemet:** inizializza a **2 Presenza** e **tutte e tre le attive, incluso il +0, si rivelano a `PRE_FIELD`**.
- **Khemet:** non esiste una deduzione “silenziosa” del +0 dopo `PRE_FIELD`, perché il +0 viene esplicitamente aperto nello stesso gate delle due Maledizioni.
- **Khemet + Apex:** `ignore field` non ignora le Maledizioni di slot.
- **Mounthborn:** la Preda iniziale è scelta nel setup, poi resa pubblica; se entrambi effettuano una scelta analoga, lock privato e reveal simultaneo.
- **Corte −4:** può bersagliare il proprio Agente o quello avversario; 3 FC temporanei seguono esattamente la semantica invested/effective; possono soddisfare Overdrive del bersaglio anche se nemico; POT finale viene registrata una volta.
- **Orathai:** `trigger:null` conta come requisito naturalmente soddisfatto.
- **Enclave:** modifica Lega prima dell'Agente e ricomputa Alleato/Rinforzi.
- **Mascarada:** ordine decisioni Agente → Campo senza anticipare indebitamente il GENERAL.

## 11.8 Punto aperto di test

**Grande Semaforo vs Grande Semaforo con colori concorrenti** resta l'unico conflitto di precedenza specifico ancora da formalizzare con una matrice dedicata. La base già fissata è:
- effetti allo stesso checkpoint in ordine d'iniziativa;
- `FORBID > FORCE`.

## 11.9 Slot di ricarica

> **Ogni abilità di ricarica (opzione non negativa della curva) deve agire sul tavolo oppure essere una scommessa reale.** Non basta «se [condizione osservata], +N Presenza» — quella è la grammatica di uno Statico, non di una scelta di round.

Con cinque round non puoi permetterti round in cui l'Eminenza non fa niente: il giocatore non sta decidendo, sta guardando.

| Forma ammessa | Esempi |
|---|---|
| Agisce sul tavolo | Furia, Verde/Rosso, Deriva, Accordo, Gorgoglio |
| Scommessa reale (bluff / informazione / rischio) | Scommessa (Mascarada) |
| **Non ammessa** | Solo osservazione → +Presenza |

**Debito di design (inerte oggi):** Sacrificio (Kethran), Convalida (Khemet), Tacet (Orathai), Sussurro (Ratti), Leggerezza (Figli). Da riscrivere prima del bilanciamento Agenti-che-leggono-Presenza.

## 11.10 Forma della curva

I valori nominali restano eterogenei (identità). Due invarianti sì:

1. **Esattamente una** opzione non negativa (`presenceDelta >= 0`), salvo eccezione documentata (Patto: Verde e Giallo; Figli: Deriva e Leggerezza — da rivedere alla luce del §11.9).
2. La **top** della curva è raggiungibile **una o due volte** per Scontro (metrica normalizzata), non il costo nominale.

**Nomi aperti (non standardizzare i registri liturgico/militare, ma chiudere le collisioni):**

| Voce | Stato |
|---|---|
| Orathai Statico | Rinominato **Consonanza** (evita collisione con «Risonanza del Nono Sigillo») |
| Eminenza Corte Rossa | APERTO (provvisorio in dati: *Sanguinaccio, il Registro*) |
| Corte −4 | APERTO (provvisorio: *Debito Eterno*) |
| Calibri −2 | APERTO (*Protocollo di Contenimento* non descrive più l'effetto) |

---


# 12. Catalogo canonico delle 12 Eminenze

## 12.1 Apex — Il Sole Verde

**Presenza iniziale:** 3  
**Curva:** +1 / −2 / −4  
**Identità:** forza brutale, sacrificio, disprezzo del terreno e inevitabilità dell'Ora Verde.

### Statico — Cataclisma: Ora Verde
All'inizio del round 5, il Campo viene sostituito da un Campo Apex.

**Momento.** La sostituzione avviene **prima della scelta del Campo**, non alla risoluzione. Cambia le premesse di una decisione, quindi deve essere pubblica prima che la decisione avvenga: un giocatore non deve poter scegliere uno slot e trovarne un altro al momento di combattere.

**Bersaglio.** Vengono sostituiti gli **slot non ancora conquistati**. Nel formato canonico — 5 Campi, 5 round, uno slot consumato per round — al round 5 ne resta esattamente uno, ed è "il Campo" del testo. La formulazione per slot aperti generalizza ai formati con un numero diverso di Campi senza cambiare il caso canonico.

**Quale Campo Apex.** Il **Meridiano del Sole Verde** (id 89), che è l'Ora Verde stessa. La scelta è fissa e non casuale: i sei Campi a tema Apex sono molto diversi fra loro e uno di essi (Tana dei Tagliagole) cambia la condizione di vittoria, quindi un sorteggio nel round decisivo introdurrebbe varianza dove il design promette inevitabilità. La lettura indeterminata — "un Campo Apex qualsiasi" — resta esprimibile nel catalogo sostituendo `fieldId` con `fieldArmy`.

### Attive
- **+1:** il prossimo Agente schierato questo round ottiene +1 POT; il controllore perde 2 PV.
- **−2:** il prossimo Agente ignora tutti gli **effetti del Campo** per questo Duello.
- **−4:** il prossimo Agente ottiene +2 POT e +2 DAN.

### Portata di “ignora gli effetti del Campo” (−2)

**Cade** tutto ciò che il Campo fa **all'Agente**, cioè ogni effetto che scrive una grandezza di un lato solo:
- modificatori di POT, DAN e VA, inclusi quelli condizionali;
- trigger resi sempre attivi, trigger scambiati, soglia di Overdrive alterata;
- disattivazione di Potere, Bonus d'Armata o Immune;
- cap e imposizioni sulle proprie statistiche (POT massima, DAN massimo, DAN = Lega, DAN = POT);
- regole di conteggio dei propri FC nel VA (dimezzamento, tetto, moltiplicatori);
- sostituzione o scambio del proprio Bonus d'Armata.

**Resta** ciò che definisce **chi vince**, e vale per entrambi i giocatori: condizione di vittoria alternativa (Arena delle Scaglie, Tana dei Tagliagole, Ponte di Roccaferma) e tie-break.

La ragione è che un Duello ha **un solo** vincitore: un Agente non può ignorare per conto proprio la regola che lo determina, perché il risultato non sarebbe più definito. “Disprezzo del terreno” significa non subirne gli effetti, non giocare a un gioco diverso da quello dell'avversario.

**Criterio operativo.** La linea di taglio è «di chi è questo numero». Se l'effetto scrive una grandezza attribuibile a un lato, è per-Agente e cade; se stabilisce come si confrontano i due lati, è strutturale e resta. Il criterio è verificabile a colpo d'occhio e non va rideciso a ogni Campo nuovo.

**Fuori portata.** L'aftermath di round del Campo — perdite di PV o FC dopo la determinazione del vincitore — non è velato: agisce sul **giocatore** dopo il Duello, mentre l'abilità parla dell'**Agente** e dura *per questo Duello*.

### Interazione Khemet
Le Maledizioni Khemet appartengono allo **slot**, non alla carta Campo. Pertanto:
- sostituire il Campo con Ora Verde non rimuove le Maledizioni;
- “ignora gli effetti del Campo” non ignora le Maledizioni Khemet.

---

## 12.2 Mascarada — L'Organizzatore degli Incontri

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −4

### Statico
Quando dovrebbe essere scelto il Campo, gli Agenti vengono selezionati e resi noti **prima** della scelta del Campo.

### Attive
- **+0 — Scommessa:** a inizio round, insieme alla scelta segreta dell'abilità, pronostica segretamente **vittoria propria / vittoria avversaria / pareggio**. Se il pronostico è corretto, +2 Presenza.
- **−2:** per questo Duello, Gloria può essere soddisfatta anche come Vendetta e viceversa; Conquista può essere soddisfatta anche come Ultimo Desiderio e viceversa. Si aggiunge una condizione alternativa valida, senza cambiare il normale timing dei trigger post-esito.
- **−4:** il trigger del proprio Agente è forzatamente soddisfatto e il suo Potere non può essere bloccato. Non supera una disattivazione globale dei Poteri.

---

## 12.3 Kethran — L'Altare della Ricomposizione

**Presenza iniziale:** **2 PROVVISORIA**  
**Curva:** +1 / −2 / −4

### Statico — Ricomposizione
Quando un proprio Agente perde un Duello, diventa un **Frammento** per il resto dello Scontro.

Un Frammento è uno stato applicato alla carta caduta, non una valuta numerica.

### Regola dei Frammenti
> **Ogni Frammento utilizzato da un'abilità dell'Altare viene consumato.**

Un Frammento con `trigger: null` può fornire il proprio effetto ma non un trigger da sostituire.

### Attive
- **+1 — Sacrificio:** se il proprio Agente perde il Duello di questo round, dopo il Duello ottieni +1 Presenza. La sconfitta genera inoltre normalmente il Frammento tramite lo Statico.
- **−2 — Innesto:** scegli un Frammento. Il Potere dell'Agente corrente/prossimo può soddisfarsi tramite il proprio trigger oppure tramite il trigger del Frammento. Se il trigger del Frammento viene utilizzato, il Frammento è consumato.
- **−4 — Opera Composita:** scegli **uno o due Frammenti**.
  - con **1 Frammento**, puoi sostituire una sola componente: il trigger oppure l'effetto, mantenendo l'altra componente del Potere dell'Agente corrente;
  - con **2 Frammenti**, puoi prendere il trigger da uno e l'effetto dall'altro, creando un Potere completamente composito;
  - ogni Frammento utilizzato viene consumato;
  - statistiche e Lega restano quelle dell'Agente corrente.

---

## 12.4 Mounthborn — La Fame

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −2

### Statico — Istinto Predatorio
All'inizio dello Scontro, scegli un Agente nemico: diventa **Preda**.

La prima Preda appartiene al **setup dello Scontro**, non alla scelta Eminenza di round e quindi non usa il protocollo commit–reveal descritto al §10.5. La scelta viene resa pubblica non appena il setup è confermato. Se entrambi i giocatori devono compiere una scelta analoga di setup, le scelte vengono bloccate senza vedere quella avversaria e poi rese pubbliche simultaneamente. Il marker Preda è pubblico da quel momento.

- Dopo che una Preda partecipa a un Duello, perde Preda.
- Gli Agenti con Turbo perdono Preda a fine round.
- Più Prede possono coesistere.

### Attive
- **+0 — Gorgoglio dai Cento Occhi:** reveal Pre-Agente; scegli un Agente nemico non ancora schierato, che diventa Preda. Se una Preda viene schierata in quel round, +2 Presenza.
- **−2 — Frenesia della Fame:** se viene schierata una Preda, il proprio **Bonus d'Armata** è considerato attivo e non può essere bloccato.
- **−2 — Cannibalismo:** se perdi il Duello contro una Preda, Cura 3 PV.

---

## 12.5 Khemet — nome da definire

**Presenza iniziale:** 2  
**Curva:** +0 / −2 / −3  
**Identità:** ritualisti che alimentano l'Eminenza attraverso l'attivazione dei Poteri e maledicono permanentemente gli slot di battaglia.

**Decisione consolidata:** la Presenza iniziale è stata portata da 0 a **2** per evitare il rischio di lock d'avvio; il motore di ricarica resta invariato.

### Statico
Quando un proprio Agente attiva **Overdrive**, +1 Presenza.

### Attive
- **+0:** **reveal Pre-Campo**; se il Potere del proprio Agente si **attiva realmente** e non viene bloccato nel Duello, +1 Presenza. Un trigger soddisfatto ma un Potere globalmente disattivato non genera Presenza.
- **−2:** reveal Pre-Campo; scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono **−VA pari alla propria Lega**.
- **−3:** reveal Pre-Campo; scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì subiscono **−1 POT, −1 DAN, −1 VA**.

### Regola delle Maledizioni
Le Maledizioni:
- appartengono allo **slot di battaglia / ambiente**, non alla carta Campo;
- persistono per tutto lo Scontro;
- sono simmetriche e colpiscono entrambi i giocatori;
- possono accumularsi sullo stesso slot;
- restano anche se il Campo nello slot viene sostituito o modificato;
- non vengono ignorate da un effetto che dice soltanto “ignora gli effetti del Campo”.

Implementazione concettuale consigliata: `slot = { field, eminenceModifiers[] }`.

**APERTO:** nome definitivo dell'Eminenza.

---

## 12.6 Orathai — Il Primo Canto

**Presenza iniziale:** 1  
**Curva:** +0 / −2 / −3

### Statico — Consonanza
Se entrambi gli Agenti soddisfano il requisito di attivazione del proprio Potere nello stesso Duello, +1 Presenza.

*(Nome cambiato da «Risonanza» per evitare collisione con lo Statico Khemet «Risonanza del Nono Sigillo».)*

### Attive
- **+0 — Tacet:** se nessuno dei due Agenti soddisfa il requisito di attivazione del Potere, +2 Presenza.
- **−2 — Contrappunto:** se esattamente uno dei due Agenti dovrebbe attivare il Potere, entrambi vengono considerati soddisfatti.
- **−3 — Silenzio:** se esattamente uno dei due dovrebbe attivare il Potere, nessuno dei due viene considerato soddisfatto.

### Conteggio 0 / 1 / 2
- `trigger: null` conta come **naturalmente soddisfatto**.
- Il Primo Canto legge il requisito di attivazione, non il successivo successo della risoluzione dell'effetto.
- Un Blocca successivo non cambia retroattivamente il conteggio.
- Snapshot per determinare 0/1/2: dopo sostituzioni di trigger e normali modifiche del Campo, ma prima della propria operazione di Contrappunto/Silenzio.

Esempi:
- `null` + trigger soddisfatto = 2;
- `null` + trigger non soddisfatto = 1;
- due `null` = 2;
- due trigger non soddisfatti = 0.

---

## 12.7 Corte Rossa — nome da definire

**Presenza iniziale:** **1 PROVVISORIA**  
**Numero attive:** 4, eccezione approvata.

### Statico
Ogni volta che un giocatore perde uno o più PV per una causa diversa dal normale DAN della sconfitta nel Duello, la Corte ottiene **+1 Presenza**.

Si conta **l'evento di perdita**, non il numero di PV persi.

### Attive
- **+0:** l'avversario perde 2 PV; in questo Duello il suo Agente riceve 1 FC temporaneo. Lo Statico genera normalmente +1 Presenza per l'evento di perdita PV.
- **−2:** perdi 3 PV; in questo Duello il tuo Agente riceve 1 FC temporaneo. Lo Statico genera normalmente +1 Presenza per l'evento di perdita PV.
- **−3 — Debito:** reveal Pre-Agente; scegli un Agente non ancora schierato. Per il resto dello Scontro il trigger del suo Potere diventa:
  > **Debito — Quando viene schierato, il suo controllore perde 2 PV; poi il Potere si attiva.**
  Il pagamento è obbligatorio e può essere letale. Viene sostituito soltanto il trigger: l'effetto del Potere resta quello originale. Una sostituzione temporanea del trigger può prevalere per un singolo Duello; poi Debito ritorna. La perdita di PV alimenta lo Statico.
- **−4 — nome da definire:** al reveal generale scegli **uno qualsiasi dei due Agenti già confermati, proprio o avversario**; riceve **3 FC temporanei** per questo Duello. I FC temporanei seguono la semantica `effectiveFocus` e possono quindi **soddisfare Overdrive anche sull'Agente avversario**: questo comportamento è intenzionale e fa parte del rischio/credito dell'abilità. Alla fine del Duello registra la **POT finale** dell'Agente bersagliato, dopo tutti i modificatori. Alla Fine Scontro il suo controllore perde PV pari alla POT registrata. La perdita può essere letale e viene risolta prima del verdetto definitivo dello Scontro; alimenta inoltre lo Statico prima della chiusura finale.

**APERTI:** nome definitivo dell'Eminenza e nome dell'abilità −4.

---

## 12.8 Patto degli Indocili — Il Grande Semaforo

**Presenza iniziale:** 0  
**Curva:** +1 / +0 / −2

### Attive
- **+1 — Verde:** Imboscata e Turbo sono considerati soddisfatti per questo round; Intervento e Ultima Chance non possono attivarsi.
- **+0 — Giallo:** tutti e quattro seguono le normali condizioni.
- **−2 — Rosso:** Intervento e Ultima Chance sono considerati soddisfatti; Imboscata e Turbo non possono attivarsi.

L'effetto è **globale e simmetrico** per l'intero round.

Il colore può restare nascosto fino al reveal generale, perché a quel punto Agenti e FC sono già locked ma i trigger non sono ancora stati verificati.

**APERTO:** caso speculare tra due Grandi Semafori con colori concorrenti, da formalizzare tramite la regola generale di iniziativa + divieto > forzatura.

---

## 12.9 Figli dell'Orizzonte — La Domanda Senza Fine

**Presenza iniziale:** 1

### Ancorato
Un Agente è **Ancorato** se ha investito almeno:

`6 − Lega effettiva + aumenti cumulativi del requisito`

Soglie base:
- Lega 5 → 1 FC;
- Lega 4 → 2 FC;
- Lega 3 → 3 FC;
- Lega 2 → 4 FC.

Regole:
- conta solo `focusInvested`, non FC temporanei;
- usa la **Lega effettiva** al momento del controllo;
- Ancorato viene determinato **una sola volta per Duello**, dopo la conferma dell'investimento FC e prima dei trigger;
- lo snapshot resta fisso per tutto il Duello;
- modifiche successive a Lega o FC non lo ricalcolano;
- non esiste un cap generale al requisito cumulativo.

### Attive
- **+1:** aumenta di 1 il requisito di Ancorato, cumulativamente per il resto dello Scontro. L'aumento vale **immediatamente già nel round corrente**.
- **+0:** se il proprio Agente non è Ancorato, +1 Presenza. La Presenza viene ottenuta al controllo Ancorato, quindi prima dei trigger e può influenzare trigger Eminenza dello stesso Duello.
- **−4:** se il proprio Agente è Ancorato, il suo trigger viene considerato soddisfatto. Non supera Poteri globalmente disattivati e non rende il Potere non bloccabile.

---

## 12.10 Ratti della Megera — Bella dalle Malelabbra, l'Erede della Megera

**Presenza iniziale:** 1

### Statico — Male Crescente
Quando schieri un Agente con la **Lega effettiva più bassa** tra gli Agenti che ti restano in mano, +1 Presenza.

In caso di parità, tutti gli Agenti legati per la Lega minima sono validi. Se resta in mano una carta con Lega inferiore, una carta di Lega superiore non soddisfa lo Statico.

### Attive
- **+0:** se durante il Duello almeno un Agente subisce una riduzione a POT, DAN o VA, +1 Presenza. È una sola condizione per Duello, non per singolo evento, e può essere soddisfatta da riduzioni su entrambi i giocatori.
- **−2:** blocca il proprio Bonus d'Armata per questo Duello; applica **Tossina 1** all'avversario, minimo 10 PV.

  **Nota intenzionale:** se la Tossina non può produrre ulteriore valore (per esempio bersaglio già al minimo previsto), l'abilità può risultare priva di effetto utile pur avendo comunque il proprio costo/opportunity cost. Non è previsto un fallback automatico.
- **−3:** per questo Duello, **Conquista è considerata soddisfatta per il proprio Agente indipendentemente dall'esito**. Mantiene il normale timing post-esito. Vale sia per il Bonus Ratti sia per un eventuale Potere dell'Agente con trigger Conquista.

  **Nota intenzionale:** la forzatura non è facoltativa. Se il Potere Conquista dell'Agente produce `selfDamage`, quel costo/malus viene comunque risolto.

Non introduce un nuovo sistema di marker oltre a quelli già previsti.

---

## 12.11 Enclave delle Scaglie — L'Enclave dell'Ascensione

**Presenza iniziale:** 1

### Statico — Accumulo
Quando investi almeno **3 FC reali** sul tuo Agente in un Duello, +1 Presenza. Gli FC temporanei non contano.

### Attive
- **+1 — Rinuncia al Privilegio:** il proprio Bonus d'Armata è bloccato per questo Duello. Può convivere con Accumulo se sono stati investiti almeno 3 FC.
- **−1 — Ascesa / Declassamento:** reveal Pre-Agente. Scegli pubblicamente un proprio Agente non ancora schierato e aumenta oppure diminuisci la sua Lega di 1 per questo round. La carta può poi non essere giocata: in tal caso la Presenza è stata spesa e la modifica scade a fine round. La Lega effettiva modificata vale per ogni regola in-match che legge Lega, inclusi Sfida, Sopraffare, Alleato, Rinforzi, Ancorato e futuri confronti analoghi. Alleato/Rinforzi vengono ricalcolati usando la Lega effettiva dell'Agente scelto e le altre carte della mano iniziale. Non cambia la legalità del Deck.
- **−3 — Ascensione:** per questo Duello, Sfida e Sopraffare del proprio Agente sono soddisfatti anche quando le Leghe sono uguali; in caso di parità di VA, il proprio lato vince il Duello.

Identità: gerarchia, privilegio, ricchezza e manipolazione dello status.

---

## 12.12 Calibri Pesanti — Il Comando dei Quattro Fronti

**Presenza iniziale:** 1

### Statico — Tenere la Linea
Quando perdi un Duello e l'Agente nemico ha **2 DAN o meno alla fine del Duello**, +1 Presenza.

### Attive
- **+0 — Guerra d'Attrito:** se perdi il Duello ma subisci **2 o meno danni della sconfitta**, +1 Presenza.
- **−2 — Protocollo di Contenimento:** se perdi il Duello, i trigger **Conquista dell'avversario** non possono attivarsi. Il Campo viene comunque conquistato normalmente; vengono negati i Poteri/Bonus che dipendono da Conquista.

  **Nota intenzionale:** la soppressione è totale e non selettiva. Se una Conquista avversaria avrebbe causato `selfDamage`, viene comunque annullata: spendere Presenza può quindi, in alcuni matchup, evitare un malus al nemico. Questo rischio è parte deliberata dell'abilità.
- **−4 — Protocollo Terra Bruciata:** se perdi il Duello, **immediatamente dopo la determinazione del vincitore e prima della finestra Conquista**, distruggi il Campo corrente. Nessun giocatore lo conquista e **nessun effetto Conquista si attiva per questo Duello**. Il normale DAN della vittoria e gli effetti non-Conquista proseguono normalmente.

Il Campo distrutto può essere marcato visivamente come **Distrutto**. Non serve introdurre regole di “non selezionabilità futura” perché un Campo già risolto non viene rigiocato.

---

# 13. Bilanciamento e watchlist

Questa sezione non modifica le regole; registra i punti da osservare nei test.

### Watchlist prioritaria
1. **Ratti:** possibile generazione molto alta tramite Male Crescente + abilità +0 nello stesso round.
2. **Corte Rossa:** forte riciclo della Presenza perché molte sue stesse abilità provocano eventi di perdita PV che alimentano lo Statico.
3. **Calibri:** Statico e Guerra d'Attrito possono sovrapporsi frequentemente sulle sconfitte a basso DAN; possibile ridondanza più che squilibrio puro.
4. **Enclave:** Ascesa/Declassamento −1 può risultare a costo netto 0 nei round in cui Accumulo genera +1 investendo almeno 3 FC; il costo reale viene trasferito sull'economia FC.
5. **Kethran:** rischio opposto, con economia lenta e necessità di perdere/consumare Frammenti per arrivare a Opera Composita.
6. **Corte Rossa −4:** 3 FC temporanei hanno un impatto molto alto in un sistema `VA = POT × FC`; il valore canonico resta 3, ma va confrontato in playtest con una variante a 2.
7. **Copertura trigger Presenza:** Digiuno e Grazia non sono distribuiti uniformemente rispetto alle dodici curve di Presenza. Non è una decisione bloccante; va misurata quando verranno introdotti Agenti che usano questi trigger.

### Benchmark ritenuti puliti
- **Grande Semaforo:** economia leggibile, Verde costruisce verso Rosso ma modifica realmente la legge del round.
- **Figli dell'Orizzonte:** la generazione di Presenza e l'aumento del requisito Ancorato si controbilanciano internamente.
- **Apex:** economia semplice e leggibile, con partenza alta ma costi netti chiari.

Prossimo test consigliato: per ogni Eminenza simulare almeno tre sequenze complete da 5 round — **conservativa, media, aggressiva** — registrando Presenza entrata/uscita, abilità utilizzate e opportunità reali perse per generarla.

---

# 14. Principi di design da preservare

- L'Eminenza deve creare una **domanda tattica distinta**, non essere solo un pacchetto di bonus numerici.
- Lo Statico dovrebbe definire la grammatica centrale; le attive dovrebbero sfruttarla o piegarla.
- La Presenza non deve diventare semplicemente un secondo Focus Coin con rapporto di cambio fisso.
- Mani e carte sono già pubbliche: non usare “rivela una carta” come valore.
- Non introdurre pescata carte come economia normale.
- Non rimuovere permanentemente carte non ancora schierate: lo Scontro deve mantenere cinque round giocabili.
- Le abilità allo stesso costo sono accettabili se offrono scelte laterali reali.
- Distinguere sempre **Potere dell'Agente** e **Bonus d'Armata**.
- Conquista e Ultimo Desiderio mantengono la loro finestra post-esito salvo testo esplicito.
- Un trigger “considerato soddisfatto” conserva il normale timing della sua sorgente.
- Gli effetti possono avere target o conseguenze differite, purché il momento di scelta e il momento di risoluzione siano formalizzati.
- I Campi già conquistati/risolti non vengono rigiocati: non progettare effetti partendo dall'ipotesi che un Duello futuro possa avvenire su un Campo già concluso.

---

# 15. Punti ancora aperti

1. Nome definitivo dell'Eminenza **Khemet**.
2. Nome definitivo dell'Eminenza **Corte Rossa**.
3. Nome dell'abilità **Corte Rossa −4**.
4. Conferma tramite playtest della **Presenza iniziale Kethran = 2**.
5. Conferma tramite playtest della **Presenza iniziale Corte Rossa = 1**.
6. Formalizzazione/test del caso **Grande Semaforo vs Grande Semaforo** con colori concorrenti.
7. Playtest comparativo delle 12 economie di Presenza.

---

**Stato:** sistema di design sostanzialmente consolidato; le regole sopra sostituiscono le versioni provvisorie precedenti di questo documento. Valori numerici e alcuni nomi restano soggetti a playtest e rifinitura.


---

# 16. Ordine di implementazione

## Fase 1 — Infrastruttura generica

Implementare senza ancora supportare tutte le Eminenze:

- `src/data/eminences.js`;
- regola di formato `Eminenze richieste / disattivate`;
- validazione dell'Eminenza in deckbuilding e salvataggio nella decklist;
- stato Presenza;
- scelta segreta;
- gate `PRE_FIELD`, `PRE_AGENT`, `GENERAL`;
- lock delle scelte;
- reveal simultaneo per gate;
- pagamento atomico;
- resolver in iniziativa;
- **trigger rules overlay e resolver di precedenza condiviso**, con ordine replacement → condition mods → force/forbid → disable → block e `FORBID > FORCE`;
- pending effects;
- checkpoint `PRESENCE_SNAPSHOT`;
- separazione public/private della scelta Eminenza;
- commit–reveal online a commitment singolo per round;
- information set IA senza leakage della scelta avversaria;
- estensione `publicStateHash` con stato Eminenza pubblico;
- log;
- estensione TriggerContext.

## Fase 2 — MVP: Apex + Patto degli Indocili

Le prime due Eminenze da rendere realmente giocabili devono essere:

1. **Apex — Il Sole Verde**
2. **Patto degli Indocili — Il Grande Semaforo**

Motivo:
- Apex testa Presence, modificatori numerici, `ignore field` e sostituzione del Campo;
- Patto testa scelta segreta, reveal `GENERAL`, overlay globale sui trigger e precedenza;
- il resolver overlay necessario al Patto è **primitiva di Fase 1**, non logica speciale dell'Eminenza;
- nessuna delle due richiede subito Conquista forzata o ricalcolo complesso della Lega.

L'MVP non è considerato completo finché Apex e Grande Semaforo non sono coerenti anche in:
- partita umana vs IA, senza accesso IA alla scelta nascosta;
- simulazione IA con gli stessi overlay del resolver;
- multiplayer remoto con commit–reveal verificato.

**Ratti ed Enclave non fanno parte del primo MVP.**

## Fase 3 — Primitive generiche

Implementare:
- trigger Eminenza;
- `presence`, `enemyPresence`, `blockEminenza`;
- split Focus invested/effective;
- Lega effettiva;
- event bus/semantic events.

Il **trigger rules overlay non appartiene più a questa fase**: è una dipendenza dell'MVP Grande Semaforo e deve essere già completo nella Fase 1, riutilizzando lo stesso resolver che useranno le Eminenze successive.

## Fase 4 — Stati persistenti e Campi

Ordine consigliato:
3. Mounthborn
4. Khemet
5. Figli dell'Orizzonte
6. Calibri Pesanti

Introducono:
- marker Preda;
- modificatori persistenti di slot;
- snapshot Ancorato;
- soppressione/distruzione del Campo e Conquista.

## Fase 5 — Lega e Conquista forzata

7. Enclave delle Scaglie
8. Ratti della Megera

Questa fase va dopo le primitive perché richiede:
- ricalcolo Lega effettiva;
- Alleato/Rinforzi dinamici;
- Conquista forzata indipendentemente dall'esito;
- corretta separazione fra Conquista e proprietà del Campo.

## Fase 6 — Eminenze ad alta complessità

9. Orathai
10. Mascarada
11. Kethran
12. Corte Rossa

Sono più sensibili a:
- reinterpretazione dei trigger;
- pipeline dinamica;
- Frammenti;
- Debito persistente;
- FC temporanei;
- Fine Scontro.

---

# 17. Telemetria di playtest

Per ogni Scontro:

```js
eminenceTelemetry = {
  eminenceId,
  initialPresence,
  presenceByRound: [],
  generatedByRound: [],
  spentByRound: [],
  chosenAbilityByRound: [],
  revealGateByRound: [],
  abilityResolvedByRound: [],
  abilityWhiffedByRound: [],
  duelOutcomeByRound: [],
  directOutcomeImpact: []
}
```

Metriche:
- Presenza media generata/spesa;
- round con una sola scelta realmente pagabile;
- whiff rate;
- frequenza abilità più costosa;
- Presenza inutilizzata a fine Scontro;
- valore dello Statico;
- win rate per Eminenza;
- quante volte un reveal anticipato modifica concretamente Campo/Agente;
- per Corte −4, confronto di playtest **3 FC temporanei vs eventuale variante 2**, senza cambiare il valore canonico finché i dati non lo giustificano; registrare inoltre lato bersagliato (proprio/nemico), `effectiveFocus` prima/dopo, quante volte i FC temporanei accendono Overdrive, esito del Duello e POT finale/debito generato.

---

# 18. Decisioni realmente aperte

Le vecchie liste di “decisioni bloccanti” non sono più valide.

Restano aperti soltanto:

1. nome definitivo dell'Eminenza **Khemet**;
2. nome definitivo dell'Eminenza **Corte Rossa**;
3. nome dell'abilità **Corte Rossa −4**;
4. conferma via playtest della Presenza iniziale **Kethran = 2**;
5. conferma via playtest della Presenza iniziale **Corte Rossa = 1**;
6. matrice definitiva **Grande Semaforo vs Grande Semaforo**;
7. bilanciamento numerico attraverso playtest, incluso il confronto 2/3 FC temporanei per Corte −4.

Non sono più aperti:
- Pass;
- semantica FC temporanei;
- snapshot Ancorato;
- Frammenti consumati;
- `trigger:null` Orathai;
- timing Enclave −1;
- Maledizioni Khemet vs sostituzione Campo;
- Apex `ignore field` vs Maledizioni;
- scommessa Mascarada in pareggio;
- fine Scontro prima del verdetto;
- risoluzione effetti in ordine d'iniziativa;
- Calibri Campo Distrutto;
- Ratti −2/−3 e Calibri −2 nei casi di valore negativo/intenzionale;
- obbligatorietà dell'Eminenza nei formati che la utilizzano;
- scelta Eminenza fissata in deckbuilding;
- Corte −4 può bersagliare anche l'Agente avversario e i suoi FC temporanei possono attivarne Overdrive;
- snapshot globale della Presenza prima dei trigger;
- modello IA di informazione segreta;
- commit–reveal online con un solo commitment per round;
- il superamento di un gate senza reveal è informazione pubblica;
- tutte le attive Khemet, incluso il +0, usano `PRE_FIELD`;
- la prima Preda Mounthborn appartiene al setup ed è pubblica dopo il lock del setup;
- il trigger rules overlay è una primitiva di Fase 1 necessaria al Grande Semaforo MVP;
- un gate può essere anticipato per igiene informativa anche quando l'effetto non lo richiede;
- la deduzione IA di legalità usa la Presenza pubblica al checkpoint di selezione, non quella corrente.

---

# 19. Regola di manutenzione della specifica

Qualunque futura modifica al sistema Eminenza deve essere applicata **prima a questo file**.

Non creare una nuova fonte normativa parallela per:
- formati/validazione Eminenza;
- pipeline;
- costi;
- timing;
- snapshot Presenza;
- visibilità IA;
- protocollo commit–reveal;
- testi delle Eminenze.

Documenti di analisi, playtest e UI possono riferirsi a questa specifica, ma non devono ridefinirne le regole senza aggiornare anche questa fonte canonica.

**Fine specifica unificata v2.2.**
