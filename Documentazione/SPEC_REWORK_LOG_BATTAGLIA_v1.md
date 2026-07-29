# SPEC — Rework Log Battaglia (v1.1)

**Target architetturale:** logica di risoluzione battaglia nell’attuale `useBattle.js`, componente `LogPanel` già esistente e componente/hook che espone `battleResult` e `duelPhase`.

**Obiettivo:** trasformare il log da cronaca ridondante a **storico causale per round**. Nel pannello entra solo ciò che la scena di duello non mostra, cioè *quale fonte ha cambiato un valore, quale effetto è stato bloccato e perché il risultato finale differisce dai valori iniziali*.

Il passaggio da stringhe a eventi strutturati è il prerequisito del redesign visivo: non è un refactor separato e non deve modificare le regole di gioco.

> ⚠️ I percorsi e i numeri di riga possono non essere allineati alla copia corrente del repository. Prima di intervenire, individuare i file reali tramite le **ancore di ricerca** indicate. Non creare un secondo `LogPanel` o una seconda risoluzione del duello se tali moduli esistono già.

> **Invariante:** il sistema di log osserva la risoluzione, ma non la governa. Un errore di formattazione o rendering non deve modificare POT, DAN, VA, PV, FC, vincitore o ordine delle fasi.

---

## 1. Diagnosi: perché va rifatto, non patchato

| # | Problema | Ancora nel codice | Effetto per il giocatore |
|---|----------|-------------------|--------------------------|
| D1 | I `phaseLogs` sono derivati dal `battleLog` piatto tramite `log.includes('NomeCampo')`, simboli ed emoji su una whitelist hardcoded | blocchi `battleLog.forEach(log => { ... log.includes(...) ... })` | Log **persi silenziosamente**: Eclissi Totale, Nebulosa dei Ricordi, Orlo del Buco Nero, Cimitero di Stelle, Mercato delle Anime, Sanctum, campi cap-FC e Firewall Centrale non matchano correttamente. Terza Luna può finire in RISULTATO invece che EFFETTI. Un rename rompe la classificazione senza errori |
| D2 | Tre sistemi paralleli: `logs` per il pannello, `battleLog` piatto e `phaseLogs` derivato. Il calcolo VA viene costruito più volte | `battleLog.push(\`━━━ CALCOLO VA ━━━\`)`, oggetto `phaseLogs`, stato `logs` | La stessa informazione viene ripetuta due o tre volte e può divergere |
| D3 | Il log duplica ciò che la scena mostra già: agenti, POT/DAN iniziali, FC investiti, formula VA ed esito | costruzione di `phaseLogs.phase0`, `phase1`, `phase3` | Circa 25 righe per round in un pannello ridotto; gli effetti realmente utili annegano nel restatement |
| D4 | Il trimming è incoerente: alcuni flussi conservano 50 righe, altri 20 | `prev.slice(-20)` e `prev.slice(-50)` | Il log dell’avversario può eliminare una parte del round o della cronologia |
| D5 | Ogni riga riceve il prefisso `[R#]`; la progressione avviene travasando stringhe tramite un `useEffect` legato a `duelPhase` | `` `[R${roundNumber}] ${message}` ``, `battleResult.phaseLogs` | Rumore visivo e sincronizzazione solo apparente |
| D6 | Formati incoerenti e no-op dichiarativi: `+2 POT → 8`, `-2 POT nem.`, `Immune attivo`, `Nessun effetto attivato` | `Immune attivo`, `Nessun effetto attivato`, vari `battleLog.push` | Righe prive di informazione utile e grammatica imprevedibile |
| D7 | Le stringhe sono interpolate nel punto di emissione | tutti i `battleLog.push(...)` | Impossibile localizzare, allineare, raggruppare, applicare accessibilità o sopprimere no-op in modo affidabile |
| D8 | Il modello usa concetti strutturali come `player`/`enemy` e testi specifici dell’IA | log `TU`, `IA`, `L'IA sceglie`, `L'IA perde` | Il nuovo sistema nascerebbe già accoppiato al duello IA e sarebbe scomodo per multiplayer e future modalità a squadre |

---

## 2. Architettura target: eventi strutturati

### 2.1 Moduli consigliati

Integrare il sistema nei moduli già presenti, evitando nuovi duplicati:

```text
src/
  game/
    battleLog/
      battleEventTypes.js       # enum/costanti e factory
      formatBattleEvent.js      # unica localizzazione visibile
      battleEventSelectors.js   # filtri, grouping, aggregazione
  hooks/
    useBattle.js                # emissione durante la risoluzione
  components/
    .../LogPanel.jsx            # refactor del componente esistente
```

I percorsi sono indicativi: rispettare l’organizzazione reale del repository. Se il progetto possiede già moduli equivalenti, estenderli invece di crearne altri.

### 2.2 Principi dello schema

1. **Evento atomico:** una singola causa applicata a un singolo bersaglio e, per le transizioni, a una singola statistica.
2. **Dati, non frasi:** nessun testo destinato al giocatore viene composto dentro `useBattle.js`.
3. **Fase semantica separata dalla rivelazione visiva:** `phase` dice *dove appartiene l’evento nella risoluzione*; `revealAt` dice *quando appare nella scena*.
4. **Lati neutrali rispetto alla modalità:** usare `local` / `opponent`, non `player` / `enemy` o `TU` / `IA` nello schema.
5. **Identità stabile:** usare ID di carte, campi, giocatori ed effetti quando disponibili; il nome è solo dato di visualizzazione/fallback.
6. **Nessuna interpretazione di `note`:** il renderer non deve mai eseguire parsing o `includes()` su testo libero.

### 2.3 Schema evento

```js
/**
 * @typedef {'preDuel'|'deploy'|'focus'|'effects'|'assault'|'result'|'post'} BattlePhase
 * @typedef {'local'|'opponent'|'both'|null} BattleSide
 * @typedef {
 *   'roundHeader'|'statChange'|'resourceChange'|'block'|'copy'|
 *   'fieldRule'|'assaultCalculation'|'outcome'|'info'
 * } BattleEventType
 */

/**
 * Evento del log di battaglia.
 * I campi specifici dipendono da `type`; vedere §2.4.
 */
const battleEvent = {
  id: 'r2:e14',             // univoco nell’intera partita, non solo nel round
  round: 2,
  sequence: 14,             // ordine deterministico all’interno del round
  phase: 'effects',         // fase semantica
  revealAt: 'abilityFx',    // chiave della timeline visiva condivisa
  type: 'statChange',

  source: {
    kind: 'field',          // 'field'|'ability'|'bonus'|'clash'|'system'
    id: 'gran_corno',
    name: 'Gran Corno',
    ownerSide: null         // local/opponent per potere o bonus; null per campo/sistema
  },

  target: {
    kind: 'agent',          // 'agent'|'player'|'round'|'rule'
    side: 'local',
    id: 'lama_curva',
    name: 'Lama Curva'
  },

  stat: 'POT',              // 'POT'|'DAN'|'VA'|'PV'|'FC'
  before: 8,
  after: 6,

  // Solo per informazioni residuali non mostrate al giocatore.
  // `debugNote` non viene mai interpretato né renderizzato nella vista normale.
  debugNote: null
};
```

`revealAt` deve usare chiavi condivise con la timeline del duello, non numeri o delay duplicati nel `LogPanel`. Se esiste una configurazione come `duelVisualTimeline`, importare o estendere quella sorgente unica.

### 2.4 Tipi di evento e payload obbligatori

| `type` | Quando | Payload obbligatorio |
|--------|--------|----------------------|
| `roundHeader` | Inizio risoluzione | `field`, `localAgent`, `opponentAgent`, `initiativeSide` come campi strutturati |
| `statChange` | Modifica a POT, DAN o VA di un agente | `source`, `target`, `stat`, `before`, `after` |
| `resourceChange` | Modifica a PV o FC di un giocatore | `source`, `target`, `stat: 'PV'|'FC'`, `before`, `after` |
| `block` | Un effetto concreto viene annullato | `source` del blocco, `target`, `blockedEffect` strutturato, `blockedBy` |
| `copy` | Copia riuscita di POT, DAN, Potere o Bonus | `source`, `target`, `copied.kind`, `copied.value`, `copied.fromId` quando applicabile |
| `fieldRule` | Il campo altera una regola senza transizione numerica | `source`, `ruleCode`, `params` strutturati |
| `assaultCalculation` | Dati completi del calcolo VA, destinati al dettaglio | `target`, `basePower`, `focus`, `modifiers`, `floorApplied`, `finalVA` |
| `outcome` | Esito risolto del duello | `winnerSide`, `localVA`, `opponentVA`, `tieBreakCode`, `tieBreakData` |
| `info` | Informazione pre-duello non disponibile altrove | `infoCode`, `data` strutturati |

Esempio di blocco:

```js
emit({
  phase: 'effects',
  revealAt: 'abilityFx',
  type: 'block',
  source: {
    kind: 'ability',
    id: blocker.ability?.id ?? `${blocker.id}:immune`,
    name: blocker.name,
    ownerSide: 'opponent'
  },
  target: {
    kind: 'agent',
    side: 'local',
    id: localAgent.id,
    name: localAgent.name
  },
  blockedEffect: {
    kind: 'ability',
    sourceId: localAgent.id,
    effectType: localAgent.ability?.effect?.type ?? null
  },
  blockedBy: 'immune'
});
```

Esempio di esito:

```js
emit({
  phase: 'result',
  revealAt: 'outcome',
  type: 'outcome',
  winnerSide: 'opponent',
  localVA: 18,
  opponentVA: 24,
  tieBreakCode: null,
  tieBreakData: null
});
```

### 2.5 Emitter: fase esplicita, nessuno stato mutabile implicito

Non usare una variabile globale/locale `currentPhase` che modifica implicitamente le emissioni successive. Un `return`, una funzione annidata o un futuro riordino potrebbero assegnare la fase sbagliata.

```js
function createBattleEventEmitter(roundNumber) {
  const events = [];
  let sequence = 0;

  const emit = (event) => {
    const nextSequence = sequence++;
    events.push({
      id: `r${roundNumber}:e${nextSequence}`,
      round: roundNumber,
      sequence: nextSequence,
      ...event
    });
  };

  emit.at = (phase, revealAt) => (event) => {
    emit({ phase, revealAt, ...event });
  };

  return { events, emit };
}

const { events, emit } = createBattleEventEmitter(roundNumber);
const emitAbility = emit.at('effects', 'abilityFx');
const emitFocus = emit.at('focus', 'focusFx');
const emitPost = emit.at('post', 'postFx');
```

Le funzioni `applyEffect` e `applyBonusEffects` che oggi ricevono un array `log` devono ricevere un emitter compatibile. Non introdurre una seconda pipeline di risoluzione.

### 2.6 Formatter: unico punto di localizzazione

Tutto il testo visibile deve vivere nel formatter. Le emissioni contengono codici e dati, non frasi italiane.

```js
function formatBattleEvent(event, context) {
  return {
    iconName: getBattleEventIcon(event),
    text: getBattleEventText(event, context),
    ariaLabel: getBattleEventAriaLabel(event, context),
    tone: getEventTone(event),          // 'local'|'opponent'|'neutral'|'warning'
    emphasis: event.type === 'outcome'
  };
}
```

- `context` può contenere i nomi mostrati per i due lati: “Tu”, “IA”, nickname remoto ecc.
- Il formatter non deve classificare gli eventi tramite `includes()`.
- Le icone devono essere identificate tramite `iconName` e renderizzate con il sistema di icone del progetto; non inserire emoji nelle emissioni.
- Formato transizioni: **sempre `X→Y`**. Non mescolare `+2 POT → 8` e `POT 6→8`.
- Il delta può essere calcolato dal renderer e mostrato soltanto in tooltip/dettaglio, se utile.

---

## 3. Regole di rendering del pannello

### 3.1 Struttura: blocchi per round

Esempio concettuale:

```text
R2 · Terza Luna                                      SCONFITTA
Lama Curva 18  vs  Ombra del Vespro 24
  [campo]          POT 5→4 · DAN 3→4
  [bonus Kethran]  POT 4→6
  [blocco]         Potere di Lama Curva annullato
  [PV]             25→23
```

- L’header deriva da `roundHeader` e, quando visibile, da `outcome`.
- Il round corrente è aperto.
- I round precedenti restano blocchi compatti consultabili, non un flusso indistinto.
- Nessun prefisso `[R#]` per singola riga.
- Nessun separatore testuale `━━━ ... ━━━`: bordi e spaziatura sono componenti UI.
- L’esito deve essere espresso anche a testo o icona accessibile, non soltanto con ✓/✗ o colore.

### 3.2 Regola di ammissione nella vista compatta

**Entra:**

- `statChange` e `resourceChange` con `before !== after`;
- `block` soltanto quando qualcosa è stato realmente bloccato;
- `copy` riuscita;
- `fieldRule` che cambia le regole del round;
- effetti post-scontro validi;
- eventuale indicatore “altri effetti” prodotto dall’aggregatore.

**Non entra:**

- schieramento degli agenti;
- FC investiti già mostrati dalla scena;
- formula VA completa;
- frase separata con l’esito;
- `Immune attivo` preventivo;
- `Nessun effetto attivato`;
- no-op con `before === after`.

I no-op non devono essere emessi. Il dettaglio espandibile mostra eventi validi soppressi dalla vista compatta, non operazioni che non hanno prodotto alcun cambiamento.

### 3.3 Aggregazione deterministica

Gli eventi restano atomici nel modello, ma il renderer può raggrupparli per rispettare la densità del pannello.

Sono aggregabili nella stessa riga solo eventi che condividono:

- stesso `round`;
- stessa `source.kind` e stesso `source.id`;
- stesso `target.kind`, `target.side` e `target.id`;
- stessa `phase` e stesso `revealAt`;
- tipo compatibile (`statChange` con altri `statChange`).

Esempio consentito:

```text
Terza Luna · POT 5→4 · DAN 3→4
```

Non aggregare mai:

- fonti diverse;
- bersagli diversi;
- `block` con transizioni numeriche;
- cambi PV/FC con cambi POT/DAN;
- eventi appartenenti a momenti visivi differenti.

**Limite compatto:** massimo 7 righe di dettaglio per round, esclusi i due elementi dell’header. Se gli eventi aggregati superano il limite, mostrare una riga esplicita `+N altri effetti`, che apre il dettaglio. Non troncare silenziosamente.

### 3.4 Log pre-duello

**Tenere soltanto quando non è già mostrato dalla scena:**

- scelta del campo da parte dell’avversario quando l’avversario inizia, come `infoCode: 'opponentFieldChosen'` con dati strutturati.

**Eliminare:**

- `Hai scelto: [campo]`;
- `Hai cambiato campo: [campo]`;
- `L’IA schiera: [agente]` o equivalente dell’avversario.

Lo schema non deve contenere la parola “IA”: il formatter decide se mostrare “IA”, “Avversario” o il nickname remoto in base alla modalità.

### 3.5 Colori, allineamento e accessibilità

- Verde per il lato locale, rosso per l’avversario, neutro per campo/sistema.
- Il colore **non è l’unico segnale**: usare anche posizione, icona/marker di lato e `aria-label` completo.
- Fonte a sinistra, transizione/effetto a destra.
- Non ripetere “TU/IA” in ogni riga se marker e contesto sono sufficienti, ma l’attore deve restare comprensibile senza percezione del colore.
- Il testo accessibile deve includere fonte, bersaglio, valore iniziale e finale.

---

## 4. Sincronizzazione con l’animazione

La scena usa una timeline `duelPhase`. Il pannello deve leggere direttamente gli eventi e filtrarli tramite `revealAt`.

`phase` e `revealAt` non sono intercambiabili:

- `phase` serve a organizzare e filtrare semanticamente;
- `revealAt` serve esclusivamente alla sincronizzazione visiva.

Esempio di mapping concettuale:

| Chiave `revealAt` | Momento della scena | Eventi tipici |
|-------------------|---------------------|---------------|
| `deploy` | Schieramento | `roundHeader` senza esito |
| `abilityFx` | Poteri e bonus | abilità, bonus, blocchi e copie collegati |
| `focusFx` | Focus | cambi FC, cap e regole campo legate ai FC |
| `assaultFx` | Modificatori VA | modifiche residue a VA e regole di assalto |
| `outcome` | Confronto risolto | `outcome`, esito nell’header |
| `postFx` | Danno e post-scontro | PV, cure e altri effetti post |

Implementazione concettuale:

```js
const visibleEvents = events.filter((event) =>
  getRevealIndex(event.revealAt) <= duelPhase
);
```

`getRevealIndex` deve dipendere dalla stessa configurazione usata dalla scena. Non duplicare nel `LogPanel` l’array dei delay o numeri magici della timeline.

Eliminare il travaso di stringhe tramite `addLog` nel `useEffect` legato a `duelPhase` (ancora: `battleResult.phaseLogs`). Il pannello legge `battleResult.events` e calcola la vista visibile.

**Default adottato:** rivelazione sincronizzata. Come fase di migrazione è accettabile mostrare il blocco completo a fine duello, ma il risultato finale deve rivelare l’effetto nel momento in cui il giocatore vede cambiare il relativo valore.

---

## 5. Dettaglio espandibile

Click sull’header del round: il blocco mostra tutti gli eventi validi del round, inclusi quelli esclusi o aggregati nella vista compatta.

Il dettaglio include:

- tutti gli eventi causali in ordine di `sequence`;
- calcolo VA tramite `assaultCalculation`, senza ricostruirlo da stringhe;
- floor alla POT base, se applicato;
- tie-break completo;
- sorgente e bersaglio di ogni modifica;
- eventuali info diagnostiche consentite dall’ambiente di sviluppo.

Il campo `debugNote` non è parte dell’interfaccia normale e non deve sostituire dati strutturati mancanti.

Implementare questa sezione per ultima: non blocca il nuovo pannello compatto.

---

## 6. Mapping delle emissioni attuali verso gli eventi

Sostituire tutti i `battleLog.push(...)` residui. Le ancore individuano categorie, non un elenco esaustivo di righe.

| Categoria attuale | Ancora | Evento target |
|-------------------|--------|---------------|
| Header duello con campo e agenti | `battleLog.push(\`📍 Campo:` o equivalente | `roundHeader`, `phase: 'deploy'`, `revealAt: 'deploy'` |
| `Immune attivo` preventivo | `Immune attivo` | **Eliminare**; emettere `block` solo al blocco reale |
| Effetti campo con transizione: Gran Corno, Terza Luna, Nido dell’Antico, Specchiata, Fossa dei Leoni, Trono di Cenere, Nebulosa, Buco Nero, Cimitero di Stelle, Mercato delle Anime, Sanctum, Eclissi, cap-FC, Atlantide | nomi dei campi | `statChange` o `resourceChange`, `source.kind: 'field'`; un evento per bersaglio e statistica |
| Regole di campo dichiarative: Arena degli Gnomi, Tempio del Monaco, Santuario del Silenzio, Nexus Arcano, Biblioteca Lingue Perdute, Fossa dei Traditori, Firewall, Specchio dell’Anima, Fondamenta, Mura della Sfida, Crocevia, Nucleo del Reattore, Cerchio, Alveare, Convergenza, Mura EMP | nomi dei campi | `fieldRule` con `ruleCode` e `params`, mai una frase in `note` |
| Poteri agente: `power`, `damage`, `assaultValue`, `enemyPower`, `enemyDamage`, `enemyAssault`, `powerAndDamage` | `case 'power':` ecc. | `statChange`, `source.kind: 'ability'`, `source.ownerSide` e `target.side` espliciti |
| Copie: `copyPower`, `copyDamage`, `copyAbility`, `copyBonus` | `case 'copyPower':` | `copy` se riuscita; `block` se impedita; `info` strutturato se un trigger copiato non è attivo e l’informazione è utile solo nel dettaglio |
| Blocchi: `blockAbility`, `blockBonus`, `Potere BLOCCATO`, `BLOCCATO (Immune)`, Firewall sul DAN diretto, Specchio sui modificatori | `Blocca Potere`, `BLOCCATO` | `block` con `blockedEffect` e `blockedBy` strutturati |
| Risorse durante gli effetti: `focusCoin`, `heal`, `directDamage`, `selfDamage` | `case 'focusCoin':` ecc. | `resourceChange` per PV/FC |
| Bonus armata | `Bonus ${...army}` | stessi eventi dei poteri, `source.kind: 'bonus'` |
| Calcolo VA e floor | `━━━ CALCOLO VA ━━━`, `non può scendere sotto` | `assaultCalculation`; non mostrare la formula nella vista compatta |
| Risultato e tie-break | `━━━ RISULTATO ━━━`, `Parità` | `outcome` con VA, vincitore e tie-break strutturati |
| Danno da sconfitta ed effetti post-scontro: Nido di Spine, Miniera, Torre d’Avorio, Cripta, Canyon, Voragine, Altare, Corona, Trono dei Re, Sala Contratti, Tribunale, Ziqqurat, Pianura, Palude, Fonte del Mana, Centrale Energetica, Nexus cap post e poteri `(post)` | `L'IA perde`, `Perdi`, `(post)` | `resourceChange`, `statChange` o `fieldRule`, `phase: 'post'`, `revealAt: 'postFx'` |

**Regola trasversale:** una vecchia riga combinata come `TU X→Y | IA Z→W` deve generare due eventi atomici. L’aggregazione appartiene soltanto al selector/renderer.

---

## 7. Cosa eliminare esplicitamente

1. Tutti i blocchi che categorizzano stringhe tramite `battleLog.forEach` e `log.includes(...)`.
2. L’oggetto `phaseLogs` e ogni sua ricostruzione.
3. `battleResult.logs` e `battleResult.phaseLogs`, sostituiti da `battleResult.events`.
4. Il travaso `addLog` nell’`useEffect` su `duelPhase`.
5. Il prefisso `[R${roundNumber}]` sulle righe.
6. Le emissioni preventive `Immune attivo` e `Nessun effetto attivato`.
7. I log `Hai scelto`, `Hai cambiato campo` e schieramento avversario già rappresentati nella scena.
8. I trimming per numero di righe (`slice(-20)`, `slice(-50)`). Conservare round completi, per esempio gli ultimi 10.
9. Testo italiano interpolato dentro `useBattle.js`, `applyEffect`, `applyBonusEffects` o logica dei campi.
10. Qualsiasi parsing di `debugNote`, `text`, nome campo o icona per determinare fase, tipo, attore o visibilità.

---

## 8. Piano di implementazione

Ogni step deve essere indipendente, verificabile e lasciare il gioco avviabile.

### Step 1 — Schema, factory, formatter e test di base

- Creare enum/costanti e `createBattleEventEmitter`.
- Creare `formatBattleEvent` e selector minimi.
- Testare ID univoci, ordine `sequence`, transizioni e no-op.
- Adapter temporaneo: il pannello attuale può mostrare `formatBattleEvent(event).text` senza redesign.

### Step 2 — Migrazione in parallelo, solo sviluppo

- Durante la migrazione, produrre temporaneamente sia il vecchio log sia `events`.
- Il doppio output serve esclusivamente al confronto/test e non deve diventare architettura permanente.
- Aggiungere un controllo che segnali categorie migrate senza evento equivalente.

### Step 3 — Migrare `applyEffect` e `applyBonusEffects`

- Sostituire il parametro array `log` con un emitter.
- Ogni `case` emette eventi strutturati.
- Verificare target, lato, source e valori `before/after`.

### Step 4 — Migrare campi, risorse, risultato e post-scontro

- Migrare effetti campo pre e post.
- Emettere `roundHeader`, `assaultCalculation` e `outcome`.
- A fine step devono esistere eventi equivalenti per ogni emissione utile precedente.

### Step 5 — Test anti-regressione prima della rimozione

- Test specifici D1: Eclissi Totale, Nebulosa dei Ricordi, Sanctum, campo cap-FC e Terza Luna.
- Test blocchi reali vs immunità inattiva.
- Test copie riuscite/bloccate.
- Test tie-break e floor VA.
- Test che un rename visuale del campo non richieda modifiche al log.
- Eseguire la suite completa del progetto.

### Step 6 — Eliminare il vecchio sistema

- Zero `battleLog.push`.
- Zero `phaseLogs`.
- Zero string-matching sul testo del log.
- Rimuovere il doppio output temporaneo.

### Step 7 — Refactor dell’attuale `LogPanel`

- Blocchi per round.
- Header con esito.
- Regola compatta e aggregazione §3.
- Marker accessibili per lato.
- Conservazione per round interi.

### Step 8 — Sincronizzazione visiva

- Collegare `revealAt` alla configurazione condivisa della timeline.
- Eliminare il travaso via `useEffect`.
- Testare l’ordine di comparsa rispetto ai cambi numerici della scena.

### Step 9 — Pulizia pre-duello e localizzazione

- Conservare solo le info pre-duello realmente esclusive.
- Verificare che tutto il testo visibile provenga dal formatter.
- Nessuna stringa “IA” nello schema dati.

### Step 10 — Dettaglio espandibile

- Mostrare eventi completi, formula VA, floor e tie-break.
- Implementare dopo il pannello compatto e la sincronizzazione.

---

## 9. Criteri di accettazione

### Architettura

- [ ] Zero `battleLog.push` nel codice di battaglia.
- [ ] Zero `phaseLogs` e zero travasi di stringhe legati a `duelPhase`.
- [ ] Zero `.includes()` o parsing applicati a testo, nomi o icone del log per classificare eventi.
- [ ] Ogni evento possiede `id` univoco nella partita e `sequence` deterministico nel round.
- [ ] `phase` e `revealAt` sono distinti.
- [ ] `revealAt` usa la configurazione condivisa della timeline; nessun duplicato dei delay nel `LogPanel`.
- [ ] Lo schema usa `local`/`opponent`, non `player`/`enemy`, `TU`/`IA`.
- [ ] `debugNote` non viene interpretato né mostrato nella UI normale.

### Completezza e regressioni

- [ ] Eclissi Totale, Nebulosa dei Ricordi, Sanctum e un campo cap-FC producono eventi visibili nel momento corretto.
- [ ] Terza Luna appare nella fase causale corretta, non nel risultato.
- [ ] Rinominare il nome visualizzato di un campo non richiede modifiche alla classificazione del log.
- [ ] Una vecchia emissione combinata per due lati genera due eventi atomici.
- [ ] Copie, blocchi, tie-break, floor VA e post-scontro hanno test dedicati.
- [ ] La suite completa del progetto passa.

### UX

- [ ] Il round tipico occupa al massimo 7 righe di dettaglio nella vista compatta.
- [ ] Se gli effetti superano il limite, appare `+N altri effetti`; nessun troncamento silenzioso.
- [ ] Nessuna riga compatta duplica agenti, FC, formula VA o esito già mostrati dalla scena/header.
- [ ] Tutte le transizioni usano `X→Y`.
- [ ] `Immune attivo` non appare mai da solo; viene mostrato solo un blocco realmente avvenuto.
- [ ] I no-op non vengono emessi.
- [ ] Il lato è riconoscibile tramite colore **e** un secondo segnale visivo/accessibile.
- [ ] Gli screen reader ricevono fonte, bersaglio e transizione completa.
- [ ] Tutte le stringhe visibili vivono nel formatter/localizzazione.

### Integrità della logica

- [ ] Abilitare o disabilitare il rendering del log non cambia il risultato del duello.
- [ ] Un errore del formatter non modifica lo stato di gioco.
- [ ] Gli eventi registrano valori già calcolati; non ricalcolano POT, DAN, VA, PV o FC.

---

## 10. Note operative

- **Encoding:** il sorgente contiene mojibake sugli emoji. Non introdurne di nuovi. Le emissioni usano `iconName`; eventuali simboli visibili sono gestiti dal formatter/componente `Icon` in file UTF-8 corretti.
- **Scena di duello:** il rework non cambia zoom, carte, timing o regole. Legge `battleResult.events` e la timeline condivisa.
- **Nomi:** `source.name` e `target.name` sono fallback di presentazione; logica, grouping e test devono preferire gli ID.
- **Persistenza:** conservare gli ultimi N round completi, non le ultime N righe.
- **Multiplayer:** il formatter riceve il contesto della modalità per visualizzare “IA”, “Avversario” o nickname, senza cambiare gli eventi.
- **Decisioni default:** righe sincronizzate; sola scelta campo avversaria nel pre-duello quando non visibile altrove; dettaglio espandibile implementato per ultimo.

---

## 11. Fuori scope

Questo rework non comprende:

- modifica delle regole di battaglia;
- modifica delle abilità o dei campi;
- rifacimento della scena animata;
- storico permanente tra partite;
- telemetria remota;
- replay deterministico dell’intera partita.

Gli eventi possono facilitare in futuro replay e analytics, ma la v1.1 deve restare focalizzata sul log causale del duello.
