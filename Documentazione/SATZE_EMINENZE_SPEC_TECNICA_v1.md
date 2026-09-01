# SATZE — Eminenze
## Specifica tecnica di implementazione v1
**Data:** 31 agosto 2026  
**Stato:** specifica tecnica pre-implementazione  
**Ambito:** sistema generico Eminenze + integrazione delle 12 Eminenze attualmente definite

---

# 0. Obiettivo del documento

Questo documento traduce il design corrente delle **Eminenze** in una specifica tecnica implementabile nel progetto SATZE.

L’obiettivo non è modificare il design, ma definire:

1. **quando** l’Eminenza entra nella sequenza di round;
2. quali nuovi **stati di Scontro e di round** sono necessari;
3. come rappresentare dati, abilità, costi e modificatori;
4. come integrare il sistema con:
   - `src/game/triggerLogic.js`
   - `src/game/duelResolve.js`
   - `src/game/fieldBattleAftermath.js`
5. come evitare eccezioni hardcoded sparse per ogni Armata;
6. quali decisioni di regole sono ancora necessarie prima di implementare alcuni casi complessi;
7. quali test automatici servono per impedire regressioni.

> **Principio guida:** il sistema Eminenza deve essere un livello di regole sopra il Duello, non una seconda versione del motore di combattimento.

---

# 1. Regole strutturali comuni

## 1.1 Cos’è un’Eminenza

Un’Eminenza:

- è **fuori dal mazzo**;
- non occupa slot;
- non contribuisce ai punti Lega del mazzo;
- non possiede POT, DAN o VA;
- non viene schierata;
- non partecipa direttamente a un Duello;
- resta attiva per tutto lo **Scontro**;
- possiede:
  - una quantità di **Presenza**;
  - uno **Statico**;
  - normalmente **3 abilità attive**;
- può introdurre stati persistenti o modificatori di round.

### Eccezione attuale
La **Corte Rossa** possiede deliberatamente **4 abilità attive**.

La struttura dati non deve quindi assumere `abilities.length === 3`.

---

## 1.2 Requisito di accesso

Un mazzo sblocca l’Eminenza di un’Armata se contiene almeno:

**5 carte di quell’Armata su 10.**

Con un mazzo 5–5:

- entrambe le Eminenze sono disponibili;
- il giocatore ne sceglie **una sola** prima dello Scontro;
- una volta iniziato lo Scontro non si cambia Eminenza.

---

## 1.3 Presenza

La **Presenza** è la risorsa numerica dell’Eminenza.

Regole generali:

- persiste tra i round;
- non ha un massimo globale;
- non può scendere sotto 0;
- un costo negativo richiede Presenza sufficiente;
- un’abilità `+0` non modifica automaticamente la Presenza, ma può produrla tramite il proprio effetto;
- una capacità `+1`, ad esempio, aggiunge 1 Presenza alla risoluzione;
- spendere Presenza deve essere tracciato separatamente dal semplice cambiamento del valore.

### Funzione centrale raccomandata

```js
changePresence(playerId, delta, {
  reason,
  countsAsSpend = false,
  source = null,
  roundNumber = null
})
```

Responsabilità:

- clamp del valore a `>= 0`;
- aggiornamento della Presenza corrente;
- aggiornamento di `presenceSpentThisRound`;
- aggiornamento di `totalPresenceSpent`;
- emissione di eventuali log/eventi UI;
- distinzione fra:
  - guadagno;
  - spesa;
  - perdita non considerata “spesa”.

### Importante

Le abilità Eminenza con costo negativo usano:

```js
countsAsSpend: true
```

Un eventuale futuro effetto che dice:

> “Perdi 1 Presenza”

non dovrebbe automaticamente contare come “hai speso Presenza”.

---

# 2. Nuova sequenza di round

La fase Eminenza deve avvenire **prima della scelta del Campo**.

## 2.1 Pipeline completa proposta

### A. Inizio round

1. incremento / definizione `roundNumber`;
2. reset degli stati temporanei del round precedente;
3. applicazione di effetti “inizio round”;
4. controllo di `blockEminenza`;
5. apertura della **Fase Eminenza**.

---

### B. Scelta segreta Eminenza

Entrambi i giocatori:

1. vedono la propria Presenza;
2. vedono la Presenza avversaria;
3. scelgono segretamente una capacità disponibile;
4. la scelta viene bloccata.

Le abilità non pagabili non devono essere selezionabili.

### DECISIONE NECESSARIA — Pass

È ancora da stabilire se:

- esiste sempre un comando esplicito **Passa**;
- oppure ogni Eminenza deve necessariamente scegliere una delle proprie abilità.

La struttura tecnica dovrebbe supportare entrambe le possibilità.

Schema suggerito:

```js
eminenceChoice = {
  abilityId: '...',
  isPass: false
}
```

---

### C. Reveal simultaneo

Quando entrambi hanno confermato:

1. entrambe le scelte vengono rivelate;
2. si verifica nuovamente l’affordability sullo **snapshot pre-risoluzione**;
3. i costi in Presenza vengono pagati **simultaneamente**;
4. vengono registrati:
   - `presenceSpentThisRound`;
   - `totalPresenceSpent`;
5. vengono applicati i guadagni automatici `+X`;
6. vengono risolti gli effetti immediati;
7. vengono registrati gli effetti ritardati del round.

### Perché usare uno snapshot

Serve a evitare vantaggio di priorità.

Esempio futuro:

- A sceglie un’abilità da −3;
- B ha un effetto che potrebbe ridurre Presenza avversaria.

La validità dell’azione di A deve essere stabilita sulla Presenza che aveva **al momento della scelta/reveal**, non dipendere da quale giocatore viene risolto per primo.

---

### D. Scelta Campo

Dopo la fase Eminenza:

1. si applicano eventuali regole che modificano la procedura di scelta;
2. si sceglie il Campo;
3. si applicano:
   - Maledizioni Khemet;
   - stato Distrutto;
   - sostituzioni del Campo;
   - eventuali regole di Mascarada.

---

### E. Scelta / schieramento Agenti

1. scelta degli Agenti;
2. reveal secondo la sequenza normale o modificata;
3. applicazione di effetti Eminenza ritardati che richiedono un Agente esistente;
4. applicazione di:
   - Preda;
   - Debito;
   - Lega temporanea;
   - trigger sostituiti;
   - altri override della carta.

---

### F. Focus Coin

1. investimento FC normale;
2. applicazione di eventuali **FC temporanei**;
3. determinazione dei valori effettivi usati nel Duello.

### DECISIONE NECESSARIA — Focus Coin temporanei

Va definito centralmente se i FC temporanei:

- aumentano il VA come FC normali;
- contano per Overdrive;
- contano per Opportunista;
- contano per lo Statico dell’Enclave `>=3 FC`;
- contano come “FC spesi”;
- vengono mostrati separatamente nell’HUD.

La specifica non deve assumere una risposta finché la regola non viene fissata.

Si raccomanda comunque di rappresentarli separatamente:

```js
focus = {
  invested: 3,
  temporary: 1
}
```

e di calcolare esplicitamente i vari valori derivati.

---

### G. Costruzione TriggerContext

Prima della risoluzione dei Poteri:

1. applicare Lega temporanea;
2. applicare eventuale trigger sostituito;
3. costruire il TriggerContext;
4. applicare le regole Eminenza sui trigger;
5. determinare soddisfazione / blocco / forzatura.

---

### H. Risoluzione Duello

Ordine concettuale:

1. trigger pre-battle;
2. Poteri;
3. Bonus d’Armata;
4. modificatori;
5. calcolo VA;
6. determinazione vincitore;
7. DAN / PV;
8. trigger post-battle;
9. Conquista;
10. aftermath del Campo;
11. guadagni di Presenza post-Duello;
12. cleanup.

---

### I. Fine round

1. rimuovere modificatori temporanei;
2. rimuovere Preda quando previsto;
3. azzerare:
   - `presenceSpentThisRound`;
   - scelte Eminenza;
   - trigger overlay temporanei;
   - temporary FC;
   - temporary League;
4. preservare gli stati di Scontro.

---

### J. Fine Scontro

Prima della proclamazione definitiva del vincitore devono essere risolti gli effetti definiti come:

**“Alla fine dello Scontro”**

Esempio attuale:

- debito finale del −4 Corte Rossa.

### DECISIONE NECESSARIA
Va formalizzato se il vincitore finale viene determinato:

1. dopo tutti gli effetti di fine Scontro;
2. oppure prima.

Per rendere significativo il −4 Corte Rossa, la raccomandazione è:

> risolvere gli effetti di fine Scontro **prima** della determinazione finale del vincitore.

Non considerare questa raccomandazione regola definitiva finché non viene approvata.

---

# 3. Modello di stato

## 3.1 Stato Eminenza per giocatore

Struttura proposta:

```js
eminenceState: {
  eminenceId: null,

  presence: 0,
  totalPresenceSpent: 0,
  presenceSpentThisRound: 0,

  selectedAbilityId: null,
  revealedAbilityId: null,

  blockedThisRound: false,
  blockedNextRound: false,

  persistent: {},
  round: {}
}
```

---

## 3.2 Stato persistente

`persistent` contiene solo informazioni che sopravvivono al round.

Esempi:

```js
persistent: {
  anchoredThresholdDelta: 0,

  fragmentCardIds: [],

  preyCardIds: [],

  debitoByCardId: {},

  endMatchDebts: [],

  fieldCurses: {},

  destroyedFieldIds: [],

  custom: {}
}
```

Non è obbligatorio usare un unico oggetto gigantesco.

Può essere preferibile conservare gli stati globali nel game state e lasciare nell’Eminenza solo gli identificatori.

---

## 3.3 Stato temporaneo di round

```js
round: {
  pendingEffects: [],

  triggerRules: null,

  temporaryLeagueByCardId: {},
  temporaryFocusByCardId: {},

  suppressArmyBonus: false,
  forceArmyBonusActive: false,
  armyBonusUnblockable: false,

  suppressConquest: false,
  forceConquestForCardIds: [],

  ignoreFieldForCardIds: [],

  custom: {}
}
```

---

# 4. Schema dati Eminenza

File suggerito:

```text
src/data/eminences.js
```

Schema proposto:

```js
export const EMINENCES = {
  figli_orizzonte_domanda: {
    id: 'figli_orizzonte_domanda',
    army: "Figli dell'Orizzonte",
    name: 'La Domanda Senza Fine',
    initialPresence: 1,

    static: {
      id: '...',
      text: '...'
    },

    abilities: [
      {
        id: '...',
        presenceDelta: 1,
        text: '...',
        timing: 'EMINENCE_PHASE'
      },
      {
        id: '...',
        presenceDelta: 0,
        text: '...',
        timing: 'DUEL'
      },
      {
        id: '...',
        presenceDelta: -4,
        text: '...',
        timing: 'DUEL'
      }
    ]
  }
}
```

### `presenceDelta`

- `+1` → guadagna Presenza;
- `0` → nessuna variazione immediata;
- `-3` → costo di 3 Presenza.

Non codificare il costo nel testo.

---

## 4.1 Timing consigliati

Enum possibile:

```js
EMINENCE_PHASE
AFTER_FIELD_SELECTION
AFTER_AGENT_SELECTION
BEFORE_FOCUS
BEFORE_TRIGGER_CHECK
DUEL
POST_BATTLE
END_ROUND
END_MATCH
```

Una capacità può produrre un effetto futuro:

```js
{
  timing: 'EMINENCE_PHASE',
  createsPendingEffect: true
}
```

---

# 5. Trigger rules overlay

È sconsigliato aggiungere decine di:

```js
if (eminence === '...')
```

dentro `checkTrigger`.

Serve un livello generico di regole.

## 5.1 Struttura proposta

```js
triggerRules: {
  forceSatisfied: [],
  forceFailed: [],

  aliases: {},

  replacedByCardId: {},

  unblockablePowerCardIds: [],

  forceConquestCardIds: [],
  suppressConquestForSide: {
    player: false,
    enemy: false
  },

  custom: {}
}
```

---

## 5.2 Resolver consigliato

```js
resolveTriggerState({
  trigger,
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
  satisfied,
  forced,
  forbidden,
  source
}
```

Questo permette di distinguere:

- trigger naturalmente soddisfatto;
- trigger soddisfatto dall’Eminenza;
- trigger proibito;
- trigger sostituito;
- trigger interpretato tramite alias.

---

# 6. Precedenza dei trigger

Questa è una delle parti più importanti dell’implementazione.

## 6.1 Ordine raccomandato

### 1. Trigger originale della carta

Esempio:

```text
Vendetta
```

### 2. Sostituzione persistente

Esempio Corte Rossa:

```text
Vendetta → Debito
```

Una sostituzione cambia l’identità del trigger.

### 3. Alias

Esempio Mascarada:

```text
Gloria può essere soddisfatta come Vendetta
```

Non cambia necessariamente il trigger stampato: aggiunge una condizione alternativa.

### 4. Modificatori di contesto

Esempio:

- Campo;
- Grande Semaforo;
- Enclave;
- Figli.

### 5. Force satisfied / force failed

Serve una regola definitiva di precedenza.

### 6. Blocco del Potere

Il trigger può essere soddisfatto ma il Potere può comunque essere bloccato, salvo effetto **unblockable**.

---

## 6.2 DECISIONE NECESSARIA — Force vs forbid

Esempio:

- Grande Semaforo Verde: Turbo soddisfatto;
- Campo: Overdrive/Turbo disabilitato;
- altra Eminenza: trigger forzatamente attivo.

Serve una gerarchia universale.

Raccomandazione tecnica:

```text
REPLACE
→ FORBID
→ FORCE
→ NORMAL CHECK
→ POWER BLOCK
→ UNBLOCKABLE
```

Ma **FORBID vs FORCE è una decisione di design**, non deve essere fissata in codice senza approvazione.

---

# 7. TriggerContext — estensione Presenza

In `src/game/triggerLogic.js` aggiungere:

```js
presenceSpent
enemyPresenceSpent

totalPresenceSpent
enemyTotalPresenceSpent

playerPresence
enemyPresence
```

---

## 7.1 Nuovi trigger Eminenza

### Manifestazione

```js
case 'manifestazione':
  return (context.presenceSpent || 0) > 0;
```

### Blasfemia

```js
case 'blasfemia':
  return (context.enemyPresenceSpent || 0) > 0;
```

### Fervore

```js
case 'fervore':
  return (context.totalPresenceSpent || 0) >= threshold;
```

Default attualmente previsto:

```text
3
```

ma deve essere configurabile.

### Digiuno

```js
case 'digiuno':
  return (context.playerPresence || 0) === 0;
```

### Grazia

```js
case 'grazia':
  return (context.playerPresence || 0) >= threshold;
```

Default previsto:

```text
5
```

configurabile.

### Ascendente

```js
case 'ascendente':
  return context.playerPresence > context.enemyPresence;
```

### Soggezione

```js
case 'soggezione':
  return context.playerPresence < context.enemyPresence;
```

---

# 8. Nuovi effetti Agente

Effetti previsti:

## `presence`

```js
{ effect: 'presence', value: 1 }
```

Aumenta Presenza del controllore.

---

## `enemyPresence`

```js
{ effect: 'enemyPresence', value: -1 }
```

Riduce Presenza avversaria, minimo 0.

Non deve essere considerata automaticamente “Presenza spesa”.

---

## `blockEminenza`

```js
{ effect: 'blockEminenza', value: null }
```

L’avversario non può utilizzare la propria Eminenza nel round successivo.

Stato suggerito:

```js
eminenceState.blockedNextRound = true
```

A inizio round:

```js
blockedThisRound = blockedNextRound
blockedNextRound = false
```

---

# 9. Integrazione per file

# 9.1 `src/game/triggerLogic.js`

Responsabilità da aggiungere:

1. campi Presenza nel `TriggerContext`;
2. nuovi trigger Eminenza;
3. supporto a `triggerRules`;
4. separazione fra:
   - condizione naturale;
   - override;
   - blocco;
5. supporto a Lega effettiva già calcolata a monte.

### Da evitare

Non aggiungere logica specifica:

```js
if (army === 'Patto degli Indocili')
```

Il file deve ricevere regole già normalizzate.

---

# 9.2 `src/game/duelResolve.js`

Responsabilità principali:

1. costruire le carte effettive;
2. applicare:
   - `temporaryLeague`;
   - temporary FC;
   - trigger replacement;
   - trigger alias;
3. costruire `TriggerContext`;
4. usare il resolver trigger normalizzato;
5. risolvere:
   - Bonus forzati;
   - Bonus bloccati;
   - Conquista forzata;
   - Conquista soppressa;
6. produrre eventi utilizzabili dagli Statici Eminenza:
   - stat reduction;
   - power activated;
   - trigger activated;
   - HP loss event;
   - duel damage;
   - field conquest;
7. restituire dati sufficienti alla fase post-battle.

---

# 9.3 `src/game/fieldBattleAftermath.js`

Responsabilità Eminenza:

1. distinguere:
   - Duello vinto;
   - Conquista consentita;
   - Conquista soppressa;
2. supportare Campo Distrutto;
3. evitare assegnazione del Campo se distrutto;
4. conservare eventuali stati persistenti collegati al Campo;
5. gestire Maledizioni Khemet nel livello appropriato del game state.

---

# 9.4 State owner

**DA INDIVIDUARE NEL CODICE:** il componente/hook che possiede lo stato completo dello Scontro.

Qui devono vivere:

- Eminenza scelta;
- Presenza;
- stato persistente;
- choice/reveal della fase Eminenza;
- Campi distrutti;
- Maledizioni;
- Preda;
- Frammenti;
- Debiti;
- effetti di fine Scontro.

Non distribuire questi stati in componenti UI locali.

---

# 10. Eventi di gioco consigliati

Molti Statici possono essere implementati in modo più pulito se `duelResolve` produce eventi semantici.

Esempi:

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
  stat: 'power',
  amount: 2,
  source
}
```

```js
{
  type: 'TRIGGER_ACTIVATED',
  cardId,
  trigger
}
```

```js
{
  type: 'POWER_RESOLVED',
  cardId,
  blocked: false
}
```

```js
{
  type: 'FIELD_CONQUERED',
  fieldId,
  playerId
}
```

Questi eventi evitano che ogni Eminenza debba ricostruire a posteriori cosa è successo nel Duello.

---

# 11. Implementazione delle 12 Eminenze

# 11.1 Figli dell’Orizzonte — La Domanda Senza Fine

**Presenza iniziale:** 1

## Stato persistente

```js
{
  anchoredThresholdDelta: 0
}
```

## Funzione

```js
getAnchoredThreshold(card) {
  return (6 - card.effectiveLeague)
       + anchoredThresholdDelta;
}
```

## Ancorato

```js
isAnchored(card, focusState)
```

Controlla:

```text
FC investiti >= soglia
```

### DECISIONE NECESSARIA
Quale quantità di FC entra nel calcolo se esistono FC temporanei?

---

## +1

```js
anchoredThresholdDelta += 1
```

Persistente e cumulativo.

## +0

Effetto ritardato:

```text
se l’Agente del giocatore non è Ancorato nel Duello → +1 Presenza
```

## −4

Effetto ritardato:

```text
se l’Agente è Ancorato → forceSatisfied sul suo trigger Potere
```

### DECISIONE NECESSARIA
Momento esatto in cui si determina Ancorato:

- subito dopo investimento FC;
- all’inizio del trigger check;
- valore dinamico per tutto il Duello.

Raccomandazione tecnica: **snapshot prima del trigger check**.

Non ancora regola definitiva.

---

# 11.2 Kethran — L’Altare della Ricomposizione

**Presenza iniziale:** 2 provvisoria.

## Stato

```js
fragmentCardIds: []
```

Al termine di un Duello perso:

```js
fragmentCardIds.push(cardId)
```

solo se non già presente.

## Innesto −2

Effetto ritardato sul prossimo Agente:

```js
triggerRules.aliasesByCardId[deployedCardId]
```

deve permettere:

```text
trigger originale OR trigger del Frammento
```

Non copiare l’effetto.

## Opera Composita −4

Creare una `effectiveAbility` temporanea:

```js
{
  trigger: fragmentA.ability.trigger,
  effect: fragmentB.ability.effect,
  value: fragmentB.ability.value,
  ...
}
```

oppure viceversa secondo la scelta.

### DECISIONE NECESSARIA
- Frammenti consumati?
- Frammenti riutilizzabili?
- costo/guadagno esatto della capacità di ricarica?
- può essere scelto un Frammento con `trigger: null`?
- come si trattano effetti multi-parametro?

Questa Eminenza non va implementata prima di chiudere questi punti.

---

# 11.3 Corte Rossa — nome da definire

**Presenza iniziale:** 1  
**Abilità attive:** 4

## Statico

Ascolta eventi:

```js
HP_LOSS
```

Condizione:

```js
!event.isDuelDefeatDamage
```

Guadagno:

```text
+1 Presenza per evento
```

Non per singolo PV.

---

## +0

Effetto immediato:

```text
opponent HP −2
```

Crea poi:

```text
+1 temporary FC all’Agente avversario di questo Duello
```

Poiché l’Agente non esiste ancora quando l’abilità viene rivelata, deve essere un `pendingEffect`.

Lo Statico reagisce alla perdita dei 2 PV.

---

## −2

Effetto immediato:

```text
self HP −3
```

Pending:

```text
+1 temporary FC al proprio Agente
```

Lo Statico reagisce alla perdita dei PV.

---

## −3 — Debito

Stato persistente:

```js
debitoByCardId[cardId] = {
  originalTrigger: card.ability.trigger
}
```

Quando l’Agente viene schierato:

1. il controllore perde 2 PV;
2. il trigger effettivo è `debito`;
3. il Potere è soddisfatto;
4. l’effetto originale del Potere resta invariato.

### DECISIONE NECESSARIA
Se il controllore ha meno di 2 PV:

- può andare a 0 e perdere?
- il pagamento è impossibile?
- l’Agente non può essere schierato?

Non implementare comportamento implicito.

---

## −4

Alla fase Eminenza:

```js
pendingEffect = {
  type: 'CORTE_FINAL_DEBT',
  targetTiming: 'AFTER_AGENT_SELECTION'
}
```

Dopo schieramento:

1. scegli uno dei due Agenti;
2. assegna +3 temporary FC;
3. registra il debito:

```js
endMatchDebts.push({
  controllerId,
  cardId,
  recordedPower: null
})
```

### DECISIONE NECESSARIA
Quando registrare POT:

- POT stampata;
- POT al momento della scelta;
- POT finale del Duello.

### DECISIONE NECESSARIA
Quando risolvere i danni di fine Scontro.

---

# 11.4 Calibri Pesanti — Il Comando dei Quattro Fronti

**Presenza iniziale:** 1

## Statico

Dopo il Duello:

```text
se hai perso
AND enemyEffectiveDamage <= 2
→ +1 Presenza
```

Specificare che `enemyEffectiveDamage` è il DAN dell’Agente al termine della fase di calcolo.

---

## +0

Pending post-battle:

```text
se perdi
AND actualDuelDamageTaken <= 2
→ +1 Presenza
```

Usare il danno effettivamente subito dal giocatore, non il solo valore DAN stampato.

---

## −2

Pending:

```js
suppressConquestForSide.enemy = true
```

Si applica solo se il giocatore dei Calibri perde.

Risultato:

- l’avversario conquista comunque il Campo;
- i trigger/Bonus Conquista non risolvono.

### Attenzione

Separare nel codice:

```text
FIELD_WIN
CONQUEST_TRIGGER
FIELD_OWNERSHIP
```

perché non sono più sempre equivalenti.

---

## −4 — Terra Bruciata

Se il Calibro perde:

```js
destroyedFieldIds.add(fieldId)
```

e:

```text
nessun giocatore conquista il Campo
```

Il danno da sconfitta viene comunque applicato.

### DECISIONE NECESSARIA — Campo Distrutto

Definire:

1. resta selezionabile nei round successivi?
2. continua ad applicare il proprio effetto?
3. conta come Campo non conquistato?
4. può essere sostituito da Apex?
5. può ricevere Maledizioni Khemet?
6. come viene rappresentato graficamente?

Questa decisione è bloccante.

---

# 11.5 Orathai — Il Primo Canto

**Presenza iniziale:** 1

Serve calcolare per entrambi gli Agenti uno stato preliminare:

```js
wouldTriggerNaturally
```

prima di applicare Contrappunto/Silenzio.

## Statico

Se dopo la risoluzione finale:

```text
entrambi i trigger Potere si attivano
```

→ +1 Presenza.

---

## +0 — Tacet

Se:

```text
nessuno dei due trigger Potere si attiva
```

→ +2 Presenza.

---

## −2 — Contrappunto

Se nello snapshot preliminare:

```text
exactlyOneWouldTrigger === true
```

allora:

```text
forceSatisfied per entrambi
```

---

## −3 — Silenzio

Se nello snapshot preliminare:

```text
exactlyOneWouldTrigger === true
```

allora:

```text
forceFailed per entrambi
```

---

### DECISIONE NECESSARIA — trigger null

Un Potere con:

```js
trigger: null
```

attualmente è sempre attivo nel motore.

Va deciso se, per la grammatica del Primo Canto, conta come:

- trigger naturalmente attivo;
- Potere senza trigger e quindi fuori dal conteggio 0/1/2.

Decisione bloccante per questa Eminenza.

---

# 11.6 Mounthborn — La Fame

**Presenza iniziale:** 1

## Stato persistente

```js
preyCardIds: []
```

All’inizio dello Scontro:

1. il proprietario sceglie un Agente nemico;
2. aggiungere `cardId`.

---

## Perdita Preda

Dopo partecipazione a un Duello:

```js
removePrey(cardId)
```

Eccezione Turbo:

```text
gli Agenti con Turbo perdono Preda a fine round
```

Va chiarito tecnicamente che l’eccezione serve a mantenere lo stato abbastanza a lungo per gli effetti del round.

---

## +0

Alla fase Eminenza:

1. scegli Agente nemico non schierato;
2. aggiungi Preda.

Pending:

```text
se una Preda viene schierata questo round → +2 Presenza
```

Una sola risoluzione della capacità.

---

## −2 — Frenesia

Pending:

```text
if deployedEnemyCard is Prey:
  forceArmyBonusActive = true
  armyBonusUnblockable = true
```

Riguarda **Bonus d’Armata**, non Potere.

---

## −2 — Cannibalismo

Post-battle:

```text
if lostDuel && enemyCardWasPrey:
  heal(3)
```

Assicurarsi di controllare lo stato Preda **prima** della sua rimozione post-Duello.

---

# 11.7 Enclave delle Scaglie — L’Enclave dell’Ascensione

**Presenza iniziale:** 1

## Statico

Dopo definizione FC:

```text
se FC investiti >= 3 → +1 Presenza
```

### DECISIONE NECESSARIA
I temporary FC contano?

---

## +1

Pending:

```js
suppressArmyBonus = true
```

per il proprio Bonus d’Armata.

---

## −1

Effetto:

```text
Lega effettiva di un proprio Agente +1 oppure −1 per il round.
```

Stato:

```js
temporaryLeagueByCardId[cardId] = delta
```

La Lega effettiva deve essere utilizzata da:

- Sfida;
- Sopraffare;
- Alleato;
- Rinforzi;
- ogni confronto di Lega;
- eventuali nuovi effetti che leggono la Lega.

Non modifica il deckbuilding.

### Alleato / Rinforzi

Il conteggio deve essere ricalcolato rispetto alla **Lega effettiva dell’Agente**.

Esempio:

```text
L3 → temporaneamente L2
```

deve contare le altre L2 rilevanti per il trigger.

### DECISIONE NECESSARIA — target timing

Poiché la Fase Eminenza avviene prima della scelta dell’Agente:

A. scegliere una carta dalla mano durante la Fase Eminenza; oppure  
B. creare un effetto ritardato e scegliere l’Agente dopo lo schieramento.

Entrambe sono tecnicamente possibili, ma producono informazione e bluff differenti.

---

## −3

Round modifier:

```text
Sfida soddisfatta anche con Lega pari
Sopraffare soddisfatta anche con Lega pari
```

Tie-break:

```text
se VA pari → vince il proprietario dell’Eminenza
```

### Importante
Questo tie-break deve essere applicato nel punto unico del motore che determina il vincitore del Duello, non simulato con `+1 VA`.

---

# 11.8 Ratti della Megera — Bella dalle Malelabbra

**Presenza iniziale:** 1

## Statico — Male Crescente

Al momento dello schieramento:

```js
lowestLeagueInRemainingHand = Math.min(...)
```

Se:

```text
effective/deployed League == lowest League
```

→ +1 Presenza.

### DECISIONE TECNICA
Per coerenza con Enclave, se in futuro una Lega temporanea viene applicata prima dello schieramento, va deciso se Male Crescente legge:

- Lega stampata;
- Lega effettiva.

Non è un caso oggi necessariamente disponibile nello stesso mazzo, ma va definito per bi-Armata future.

---

## +0

Ascolta gli eventi:

```js
STAT_REDUCTION
```

Se almeno un Agente riceve riduzione a:

- POT;
- DAN;
- VA;

durante il Duello:

```text
+1 Presenza
```

Massimo **una volta per Duello**.

Flag:

```js
round.rattiReductionPresenceGranted = true
```

---

## −2

Immediato/pending:

```js
suppressArmyBonus = true
```

e:

```text
Tossina 1 all’avversario, min 10 PV
```

---

## −3

Pending:

```js
forceConquestCardIds.add(ownCardId)
```

e/o flag lato giocatore:

```js
forceConquestForOwnAgent = true
```

Deve forzare Conquista per:

- Bonus d’Armata;
- Potere dell’Agente se trigger = Conquista.

Non deve trasformare automaticamente il risultato del Duello in vittoria né assegnare il Campo se il Duello è perso.

---

# 11.9 Patto degli Indocili — Il Grande Semaforo

**Presenza iniziale:** 0

Il modificatore è globale e simmetrico.

## Verde +1

```js
forceSatisfied += ['imboscata', 'turbo']
forceFailed += ['intervention', 'ultimaChance']
```

per entrambi i lati.

---

## Giallo +0

Nessun overlay.

---

## Rosso −2

```js
forceSatisfied += ['intervention', 'ultimaChance']
forceFailed += ['imboscata', 'turbo']
```

per entrambi.

---

### DECISIONE NECESSARIA — precedenza con Campi

Il motore attuale possiede modificatori di Campo come:

- `imboscataAlwaysActive`;
- `swapImboscataIntervento`;
- `turboAlwaysActive`;
- `invertTurboUltimaChance`.

Va deciso se il Semaforo:

A. sovrascrive sempre il Campo;  
B. viene sovrascritto dal Campo;  
C. segue una regola generale Force/Forbid.

Non implementare eccezioni caso per caso.

---

# 11.10 Khemet — nome da definire

**Presenza iniziale:** 0

## Stato Campi

Proposta:

```js
fieldPersistentModifiers[fieldId].khemetCurses = [
  {
    type: 'LEAGUE_VA_CURSE',
    sourcePlayerId
  }
]
```

Le Maledizioni:

- sono persistenti;
- sono simmetriche;
- possono stackare.

---

## Statico

Se un proprio Agente:

```text
attiva Overdrive
```

→ +1 Presenza.

Ascoltare `TRIGGER_ACTIVATED`.

---

## +0

Se il Potere del proprio Agente:

```text
si attiva e non viene bloccato
```

→ +1 Presenza.

### DECISIONE NECESSARIA
Testo/regola esatta ancora da congelare.

---

## −2 — Maledizione della Lega

Sul Campo scelto:

```text
−VA pari alla Lega dell’Agente schierato
```

per entrambi i giocatori.

Deve essere calcolato con la **Lega effettiva** al momento del Duello.

---

## −3 — Maledizione del Deperimento

Ogni istanza applica:

```text
−1 POT
−1 DAN
−1 VA
```

a entrambi gli Agenti sul Campo.

Stack multipli:

```text
2 copie = −2 / −2 / −2
```

---

### DECISIONE NECESSARIA

Ordine rispetto a:

- altri modificatori permanenti;
- effetti temporanei;
- modifiche di Lega Enclave;
- Campo Distrutto Calibri.

---

# 11.11 Apex — Il Sole Verde

**Presenza iniziale:** 3

## Statico

All’inizio round 5:

```text
sostituisci il Campo con un Campo Apex
```

### DECISIONE TECNICA
Se il Campo è già Distrutto dai Calibri, serve una regola esplicita sul rapporto:

```text
Distrutto vs Sostituzione Apex
```

---

## +1

Pending sul proprio prossimo Agente:

```text
+1 POT
```

Effetto immediato:

```text
−2 PV al giocatore
```

La perdita PV può alimentare lo Statico Corte Rossa in futuri contesti bi-Armata/Eminenza avversaria.

---

## −2

Pending:

```js
ignoreFieldForCardIds.add(ownCardId)
```

L’Agente ignora:

- effetti positivi;
- effetti negativi;
- modificatori del Campo.

### DECISIONE NECESSARIA
Le Maledizioni Khemet sono considerate “effetti del Campo” e quindi ignorate?

Raccomandazione concettuale: sì, se sono materialmente applicate al Campo.  
Non ancora regola definitiva.

---

## −4

Pending:

```text
+2 POT
+2 DAN
```

al proprio Agente del round.

---

# 11.12 Mascarada — L’Organizzatore degli Incontri

**Presenza iniziale:** 1

## Statico

Modifica la pipeline:

```text
scelta Agenti → reveal Agenti → scelta Campo
```

invece della sequenza normale.

Questa è una modifica di **fase**, non un effetto di `duelResolve`.

Va gestita dallo state owner / round controller.

---

## +0 — Scommessa

Durante Fase Eminenza:

```text
scegli esito previsto
```

Post-battle:

```text
se previsione corretta → +2 Presenza
```

### DECISIONE NECESSARIA
Come viene trattato il pareggio:

- terza opzione scommettibile?
- scommessa persa?
- scommessa annullata?

---

## −2

Trigger aliases lato proprio Agente:

```text
Gloria ↔ Vendetta
Ultimo Desiderio ↔ Conquista
```

### DECISIONE NECESSARIA
Formalizzare “e viceversa”.

Raccomandazione tecnica:

```text
Gloria è soddisfatta se Gloria OR Vendetta
Vendetta è soddisfatta se Vendetta OR Gloria
Ultimo Desiderio è soddisfatto se Ultimo Desiderio OR Conquista
Conquista è soddisfatta se Conquista OR Ultimo Desiderio
```

Non ancora regola definitiva.

---

## −4

Pending sul proprio Agente:

```text
forceSatisfied = true
powerUnblockable = true
```

Il trigger viene considerato soddisfatto e il Potere non può essere bloccato.

Non deve rendere automaticamente attivo il Bonus d’Armata.

---

# 12. Compatibilità bi-Armata futura

Anche se le Eminenze attuali vengono selezionate una alla volta, la struttura deve evitare assunzioni mono-Armata.

Motivi:

- mazzi 5–5 possono scegliere fra due Eminenze;
- i Bonus possono essere copiati;
- Lega / trigger / Campi possono essere letti da effetti dell’altra Armata;
- futuri contenuti potrebbero introdurre Eminenze bi-Armata.

Ogni effetto deve quindi riferirsi esplicitamente a:

- `ownerPlayerId`;
- `sourceArmy`;
- `sourceEminenceId`;
- `targetCardId`;
- `targetSide`.

---

# 13. UI minima necessaria

## 13.1 HUD Eminenza

Mostrare sempre:

- nome Eminenza;
- Presenza corrente;
- Statico;
- abilità;
- costo/guadagno Presenza;
- stato bloccato;
- eventuali stati persistenti importanti.

---

## 13.2 Fase segreta

Ogni giocatore deve vedere:

- propria scelta;
- proprie abilità pagabili;
- Presenza propria;
- Presenza nemica.

Non deve vedere la scelta nemica prima del reveal.

---

## 13.3 Reveal

Mostrare contemporaneamente:

- abilità A;
- abilità B;
- variazione Presenza;
- eventuali modificatori prodotti.

---

## 13.4 Indicatori persistenti

Necessari almeno per:

- **Frammento**
- **Preda**
- **Debito**
- **Campo Maledetto**
- **Campo Distrutto**
- **Ancorato**
- Lega temporanea
- FC temporanei

Evitare di nascondere informazioni tatticamente rilevanti in tooltip non visibili.

---

# 14. Log di battaglia

Ogni effetto Eminenza dovrebbe produrre eventi leggibili.

Esempi:

```text
[EMINENZA] Il Grande Semaforo → VERDE
[EMINENZA] Turbo è considerato soddisfatto per entrambi i giocatori.

[PRESENZA] Bella dalle Malelabbra +1 — Male Crescente.

[CAMPO] Protocollo Terra Bruciata: Campo X è stato distrutto.

[DEBITO] Agente Y perde 2 PV per Debito.

[ANCORATO] Agente Z: soglia 4 FC raggiunta.
```

Questo è particolarmente importante per debug e playtest.

---

# 15. Test automatici — sistema generico

## 15.1 Presenza

Testare:

- inizializzazione;
- guadagno;
- spesa;
- impossibilità di spendere sotto 0;
- `presenceSpentThisRound`;
- `totalPresenceSpent`;
- perdita forzata che non conta come spesa;
- reset round corretto.

---

## 15.2 Reveal simultaneo

Test:

- entrambi selezionano capacità costose;
- affordability sullo snapshot;
- nessun vantaggio del first player;
- un giocatore bloccato;
- eventuale Pass.

---

## 15.3 Trigger overlay

Matrice:

| Caso | Atteso |
|---|---|
| naturale true | true |
| naturale false | false |
| force true | true |
| forbid | false |
| alias true | true |
| replacement | usa trigger nuovo |
| power blocked | trigger può essere true ma effetto non risolve |
| unblockable | ignora blocco |

---

# 16. Test automatici — Eminenze

# Figli
- L5 con 1 FC → Ancorato.
- Dopo due +1 → stessa L5 richiede 3 FC.
- +0 concede Presenza solo se non Ancorato.
- −4 non forza il trigger se non Ancorato.

# Kethran
- sconfitta crea Frammento;
- Frammento non duplicato;
- Innesto usa trigger ma non effetto;
- Opera Composita combina correttamente i due componenti.

# Corte Rossa
- −2 PV in un unico evento → +1 Presenza, non +2;
- danno normale da sconfitta → nessuna Presenza;
- Debito mantiene effetto originale;
- −4 crea record di fine Scontro.

# Calibri
- enemy DAN 2 → Statico;
- actual damage 2 → +0;
- −2 lascia proprietà Campo ma sopprime Conquista;
- −4 impedisce proprietà e marca Distrutto.

# Orathai
- 2 trigger attivi → Statico;
- 0 → Tacet;
- esattamente 1 + Contrappunto → 2;
- esattamente 1 + Silenzio → 0.

# Mounthborn
- Preda iniziale;
- Preda rimossa dopo Duello;
- Turbo mantiene Preda fino a fine round;
- Frenesia forza solo Bonus;
- Cannibalismo guarisce solo perdendo contro Preda.

# Enclave
- 3 FC → +1 Presenza;
- +1 blocca proprio Bonus;
- Lega temporanea influenza Sfida;
- influenza Sopraffare;
- influenza Alleato;
- influenza Rinforzi;
- −3 risolve VA tie a favore Enclave.

# Ratti
- Lega minima → Statico;
- Lega non minima → niente;
- 3 riduzioni nello stesso Duello → +1 totale;
- −3 forza Conquista senza assegnare automaticamente il Campo.

# Patto
- Verde: I/Turbo true, Intervento/UC false per entrambi;
- Giallo invariato;
- Rosso inverso;
- test di precedenza con tutti i field modifier coinvolti.

# Khemet
- Overdrive → +1;
- Maledizione Lega simmetrica;
- due copie stackano;
- Deperimento stacka;
- cambio Campo non rimuove maledizione.

# Apex
- round 5 sostituisce Campo;
- −2 ignora sia bonus sia malus del Campo;
- −4 +2/+2;
- +1 applica −2 PV come evento separato.

# Mascarada
- pipeline Agente prima del Campo;
- scommessa post-battle;
- alias dei trigger;
- −4 forza e rende unblockable solo Potere.

---

# 17. Test di integrazione critica

## 17.1 Grande Semaforo + Campo

Testare tutte le combinazioni:

- Imboscata always active;
- swap Imboscata/Intervento;
- Turbo always active;
- inversione Turbo/Ultima Chance;
- Verde;
- Rosso.

Serve una sola tabella di precedenza, non casi speciali.

---

## 17.2 Enclave + Alleato/Rinforzi

Verificare che la Lega effettiva:

1. venga calcolata prima del trigger;
2. cambi il gruppo di carte considerate della stessa Lega;
3. non alteri permanentemente la carta.

---

## 17.3 Calibri + Conquista

Separare sempre:

```text
winner
damage
conquestTrigger
fieldOwnership
```

Sono quattro concetti diversi.

---

## 17.4 Corte + perdita PV

Distinguere cause:

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

Lo Statico della Corte deve poter filtrare correttamente.

---

## 17.5 Khemet + Apex + Calibri

Testare:

- Campo con Maledizioni;
- Apex ignora Campo;
- Campo Distrutto;
- sostituzione round 5.

Questo è il cluster di interazioni più delicato del sistema Campi.

---

# 18. Ordine di implementazione consigliato

## Fase 1 — Infrastruttura generica

Implementare:

- dati Eminenza;
- scelta pre-Scontro;
- Presence state;
- Fase Eminenza;
- scelta segreta;
- reveal simultaneo;
- `changePresence`;
- log;
- TriggerContext Presence.

Nessuna Eminenza complessa necessaria inizialmente.

---

## Fase 2 — Trigger Eminenza generici

Implementare:

- Manifestazione;
- Blasfemia;
- Fervore;
- Digiuno;
- Grazia;
- Ascendente;
- Soggezione.

Poi:

- `presence`;
- `enemyPresence`;
- `blockEminenza`.

---

## Fase 3 — Trigger rules overlay

Implementare genericamente:

- force satisfied;
- force failed;
- alias;
- replacement;
- unblockable;
- force/suppress Conquista;
- temporary League.

Questa fase è prerequisito per gran parte delle Eminenze.

---

## Fase 4 — Prime Eminenze MVP

Ordine consigliato:

1. **Apex**
2. **Ratti della Megera**
3. **Enclave delle Scaglie**
4. **Patto degli Indocili**

Motivo:

- coprono modificatori numerici;
- post-battle;
- Lega;
- override globali dei trigger;
- senza richiedere ancora Frammenti o debiti complessi.

---

## Fase 5 — Stati persistenti

Implementare:

5. **Mounthborn**
6. **Khemet**
7. **Figli dell’Orizzonte**
8. **Calibri Pesanti**

Questa fase aggiunge:

- marker su carte;
- modificatori persistenti dei Campi;
- soglie cumulative;
- Campo Distrutto.

---

## Fase 6 — Eminenze complesse

9. **Orathai**
10. **Mascarada**
11. **Kethran**
12. **Corte Rossa**

Sono le più sensibili a:

- precedenza;
- ricombinazione di trigger;
- pipeline;
- effetti ritardati;
- fine Scontro;
- reinterpretazione dei Poteri.

---

# 19. Telemetria di playtest

Per ogni Scontro registrare:

```js
eminenceTelemetry = {
  initialPresence,
  presenceByRound: [],
  generatedByRound: [],
  spentByRound: [],
  chosenAbilityByRound: [],
  abilityResolvedByRound: [],
  abilityWhiffedByRound: [],
  duelOutcomeByRound: [],
  directOutcomeImpact: []
}
```

Metriche utili:

1. Presenza media generata per round;
2. Presenza media spesa;
3. round con una sola scelta realmente pagabile;
4. round con ability “whiff”;
5. frequenza uso capacità più costosa;
6. differenziale vittorie con Eminenza attiva;
7. quanto spesso lo Statico produce valore;
8. quanto spesso un giocatore termina con molta Presenza inutilizzata.

---

# 20. Decisioni bloccanti prima del completamento

## Sistema generale
- [ ] Pass esplicito sì/no.
- [ ] Semantica dei Focus Coin temporanei.
- [ ] Precedenza universale Force / Forbid / Campo / Eminenza.
- [ ] Momento finale per determinare il vincitore dello Scontro.

## Figli dell’Orizzonte
- [ ] snapshot esatto di Ancorato;
- [ ] eventuale cap soglia.

## Kethran
- [ ] costo/guadagno Sacrificio;
- [ ] consumo Frammenti;
- [ ] casi `trigger: null`.

## Corte Rossa
- [ ] POT registrata dal −4;
- [ ] Debito con PV insufficienti;
- [ ] timing danno fine Scontro;
- [ ] semantica temporary FC.

## Calibri
- [ ] regole complete Campo Distrutto.

## Orathai
- [ ] Poteri senza trigger;
- [ ] precedenza Contrappunto/Silenzio.

## Mounthborn
- [ ] nessuna decisione strutturale bloccante al momento.

## Enclave
- [ ] momento scelta bersaglio del −1;
- [ ] temporary FC nello Statico.

## Ratti
- [ ] Lega stampata vs effettiva per Male Crescente in futuri casi cross-army.

## Patto
- [ ] precedenza Semaforo/Campi.

## Khemet
- [ ] nome;
- [ ] testo definitivo +0;
- [ ] interazione con Campo Distrutto / Apex.

## Apex
- [ ] interazione `ignora Campo` con Maledizioni Khemet;
- [ ] sostituzione di Campo Distrutto.

## Mascarada
- [ ] scommessa in pareggio;
- [ ] semantica esatta degli alias.

---

# 21. Definition of Done del sistema Eminenze

Il sistema può considerarsi implementato quando:

- [ ] una Eminenza viene scelta legalmente dal deckbuilder;
- [ ] la Presenza viene inizializzata;
- [ ] ogni round possiede una Fase Eminenza;
- [ ] le scelte sono segrete fino al reveal;
- [ ] il reveal è simultaneo;
- [ ] i costi sono atomicamente pagati;
- [ ] gli Statici possono reagire a eventi del Duello;
- [ ] gli effetti ritardati funzionano;
- [ ] gli stati persistono correttamente;
- [ ] il TriggerContext espone Presenza;
- [ ] i nuovi trigger Eminenza funzionano;
- [ ] `blockEminenza` funziona;
- [ ] i 12 prototipi possono essere rappresentati senza hardcode nel componente UI;
- [ ] tutte le decisioni bloccanti sono risolte;
- [ ] i test critici sono verdi;
- [ ] il log rende leggibili tutte le interazioni;
- [ ] la telemetria di playtest registra l’economia di Presenza.

---

# 22. Conclusione architetturale

La parte più importante dell’implementazione non è creare dodici blocchi di logica separati, ma introdurre quattro primitive generiche:

1. **Presence Engine**
2. **Pending Eminence Effects**
3. **Trigger Rules Overlay**
4. **Persistent Match Modifiers**

Con queste quattro primitive:

- La Domanda Senza Fine diventa una soglia persistente;
- Il Grande Semaforo diventa un overlay globale;
- Debito diventa un trigger replacement;
- Mascarada usa alias/force;
- Khemet usa persistent field modifiers;
- Mounthborn usa card markers;
- Calibri usa conquest/field state;
- Enclave usa effective League;
- Kethran costruisce temporary abilities;
- Ratti ascolta eventi;
- Apex usa pending modifiers;
- Orathai usa uno snapshot dei trigger.

Questo riduce drasticamente il rischio che l’aggiunta di nuove Eminenze trasformi `duelResolve.js` o `triggerLogic.js` in una sequenza crescente di eccezioni specifiche per Armata.

**Prima di iniziare il coding completo conviene chiudere soltanto le decisioni marcate come bloccanti; tutto il resto può essere costruito sulla struttura sopra senza modificare il design attuale.**
