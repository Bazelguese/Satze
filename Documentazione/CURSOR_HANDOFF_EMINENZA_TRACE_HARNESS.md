# SATZE — Handoff tecnico per Cursor: harness di traccia Eminenza e snapshot

> Basato sul codice reale di `Bazelguese/Satze@main`, commit ispezionato
> `f5419985a56c4cab07dd1713e17b6a0f3669fe9e`.

## Obiettivo

Costruire uno strumento da riga di comando che, data un'abilità di Eminenza e uno stato di round
sintetico, stampi **l'intera sequenza osservabile**: checkpoint in ordine, risoluzione per
iniziativa, condizioni valutate, avvisi con i loro badge, cue cinematiche con destinazione,
movimenti di Presenza.

Il fine non è il debug. È **eliminare la specifica discorsiva**: oggi ogni abilità nuova richiede di
descrivere a parole quando appare cosa, e quella descrizione è già interamente derivabile dal
catalogo più le tabelle di `eminenceAnnounceLabels.js`, `eminenceAnnouncements.js` e
`eminenceCinematics.js`. Con l'harness la sequenza si legge invece di scriverla, e congelata come
snapshot ogni modifica futura produce un diff invece di una nuova spiegazione.

**Non modificare la logica di gioco in questo lavoro.** L'harness è un lettore. Se emerge un
comportamento sbagliato, va annotato, non corretto qui.

Prima di iniziare, leggi:

- `src/game/eminence/eminenceState.js` — `createEminenceMatchState`, `getLegalAbilityIds`, `hasAlwaysLegalOption`
- `src/game/eminence/eminenceRound.js` — `beginEminenceRound`, `selectEminenceAbility`, `collectPendingEffects`, `completeGate`, `completeGeneralGate`
- `src/game/eminence/eminenceDuelGate.js` — `openEminenceRound`, `advanceToNextRevealGate`, `settleEminenceRound`, `notifyHpLossEvents`
- `src/game/eminence/eminenceAnnouncements.js` e `eminenceAnnounceLabels.js`
- `src/game/eminence/eminenceCinematics.js` — `resolveNoticeCinematics`
- `tools/validate-campagna.mjs` — convenzione per gli script CLI di questo repo

---

## Parte A — `tools/eminence-trace.mjs`

Stesso stile di `tools/validate-campagna.mjs`: modulo ESM eseguito con `node` puro, che importa
direttamente da `src/`. I moduli sotto `src/game/eminence/` sono logica pura e sono già importabili
così (girano sotto `node --test`). **Nessuna dipendenza nuova.**

### Interfaccia

```
node tools/eminence-trace.mjs --eminence <id> --ability <id> [--scenario <file.json>] [--json]
node tools/eminence-trace.mjs --scenario tools/fixtures/eminence/<nome>.json
node tools/eminence-trace.mjs --gaps
```

- `--eminence` / `--ability`: traccia una singola voce con lo scenario di default.
- `--scenario`: fixture JSON (vedi sotto). Prevale sui flag singoli.
- `--json`: output macchina invece che leggibile, per gli snapshot.
- `--gaps`: modalità diagnostica, vedi Parte C.

### Formato fixture

Lo scenario è **dato**, non codice, così che aggiungere un caso non richieda scrivere un test.
`tools/fixtures/eminence/*.json`:

```json
{
  "name": "kethran_sacrificio_sconfitta",
  "roundNumber": 3,
  "initiativeSide": "player",
  "player": {
    "eminenceId": "kethran_altare",
    "presence": 2,
    "abilityId": "kethran_sacrificio",
    "params": null,
    "agent": { "cardId": 231, "league": 4, "power": 3, "damage": 2, "trigger": "rimonta", "focusInvested": 2 }
  },
  "enemy": {
    "eminenceId": null,
    "agent": { "cardId": 118, "league": 4, "power": 5, "damage": 3, "trigger": "glory", "focusInvested": 3 }
  },
  "outcome": {
    "winner": "enemy",
    "powerResolvedBySide": { "player": false, "enemy": true },
    "activatedTriggerBySide": { "player": null, "enemy": "glory" },
    "hpDeltas": { "player": -3, "enemy": 0 }
  }
}
```

Campi assenti prendono default espliciti e documentati in `tools/fixtures/eminence/_defaults.json`.
Un default silenzioso in codice vanifica lo scopo dell'harness.

### Cosa deve stampare

Output di riferimento, in italiano, coerente con il glossario UI della copy guide:

```
EMINENZA  Kethran — L'Altare delle Membra Sbagliate
SCENARIO  kethran_sacrificio_sconfitta · round 3 · iniziativa: giocatore

SCELTA
  Presenza disponibile         2
  Abilità legali               kethran_sacrificio (+1), kethran_innesto (-2)
  Opzione sempre legale        sì
  Scelta                       kethran_sacrificio  (+1 al reveal)
  Presenza dopo il reveal      3

CHECKPOINT  AFTER_REVEAL                     [badge: Rivelazione]
  · nessun segmento

CHECKPOINT  BEFORE_TRIGGER_CHECK             [badge: Verifica]
  giocatore · statico kethran_frammenti · MARK_CARD → SELF
      condizione   duelWinnerRelative: opponent   →  non ancora valutabile
      esito        differito a AFTER_DUEL_OUTCOME

CHECKPOINT  AFTER_DUEL_OUTCOME               [badge: Risoluzione · Dopo il Duello]
  giocatore · kethran_sacrificio · CHANGE_PRESENCE +1 → SELF
      condizione   duelWinnerRelative: opponent   →  vera
      Presenza     3 → 4
      avviso       "Se perdi il Duello, +1 Presenza."   [badge: Risoluzione · Dopo il Duello]
      cue          PRESENCE_PULSE   card(player) → presence(player)
                   waitFor: —   holdAnnounce: no

  giocatore · statico kethran_frammenti · MARK_CARD → SELF
      condizione   duelWinnerRelative: opponent   →  vera
      avviso       "Il tuo Agente sconfitto diventa un Frammento."
      cue          nessuna   ⚠  MARK_CARD non produce cue (percorso MARK_SPAWN)

BILANCIO
  Presenza giocatore           2 → 4
  Frammenti giocatore          0 → 1
  Avvisi emessi                2
  Cue cinematiche              1
  Segmenti senza cue           1 (atteso: MARK_CARD)
  Segmenti senza avviso        0
```

Requisiti sull'output:

- **Ordine reale, non ricostruito.** I checkpoint vanno stampati nell'ordine in cui li produce il
  motore, e all'interno di un checkpoint nell'ordine di iniziativa che applica `resolveCheckpoint`.
  Se l'harness riordina, mente.
- **Ogni condizione stampa il termine, il valore osservato e l'esito.** È la riga che oggi costa
  più tempo a spiegare a voce.
- **Badge e testo dell'avviso vanno presi da `enrichNotices`**, non riscritti. Se un avviso è
  sbagliato lo si vede qui.
- **Le cue vanno da `resolveNoticeCinematics`**, con ricetta, ancora di partenza, ancora di arrivo,
  `waitFor` e `holdAnnounce`. Un `null` va stampato come `nessuna` con un `⚠`, mai omesso.
- **Deterministico.** Nessun timestamp, nessun id casuale, chiavi ordinate. Due esecuzioni sullo
  stesso fixture devono produrre byte identici, altrimenti gli snapshot non servono a niente.
- `--json` emette la stessa informazione come oggetto serializzabile, con le stesse garanzie di
  ordinamento.

### Come costruire lo stato

Riusa le funzioni pubbliche esistenti; non ricostruire lo stato a mano.

1. `createEminenceMatchState` con gli id di Eminenza dei due lati.
2. Forza la Presenza iniziale ai valori del fixture.
3. `openEminenceRound` con `roundNumber` e `initiativeSide`.
4. Registra `getLegalAbilityIds` e `hasAlwaysLegalOption` **prima** della scelta.
5. `selectEminenceAbility` per ciascun lato che ha un'Eminenza.
6. Percorri i gate con `advanceToNextRevealGate` / `completeGate` / `completeGeneralGate`,
   raccogliendo i notice a ogni passaggio.
7. `settleEminenceRound` con i campi di `outcome`, poi `notifyHpLossEvents` con `hpDeltas`.
8. Converti tutti i notice raccolti con `enrichNotices`, poi ciascuno con `resolveNoticeCinematics`.

Se una di queste chiamate richiede un contesto che l'harness non può produrre in modo onesto,
**fermati e segnalalo**: significa che il motore ha una dipendenza implicita da stato di duello che
va esplicitata come parametro. Non inventare valori per far girare l'harness.

---

## Parte B — Snapshot

`src/game/eminence/eminenceTrace.test.js`, sotto `node --test` come il resto della cartella (lo
script `test:unit` in `package.json` include già `src/game/eminence/*.test.js`, quindi non serve
toccarlo).

- Un test per fixture. Ogni test esegue l'harness in modalità `--json` come funzione importata (non
  come sottoprocesso) e confronta con il file atteso in `src/game/eminence/__snapshots__/`.
- Aggiornamento con `UPDATE_SNAPSHOTS=1 npm run test:unit`. Mai riscrivere gli attesi a mano.
- **Copertura minima da fornire con la PR:** per ognuna delle 8 Eminenze implementate, un fixture
  per lo Statico e uno per ciascuna abilità, sia nel ramo in cui la condizione è vera sia in quello
  in cui è falsa. Sono circa 50 fixture; vanno generati, non scritti a mano — aggiungi
  `node tools/eminence-trace.mjs --scaffold` che produce lo scheletro di un fixture per ogni voce
  del catalogo, da rifinire poi caso per caso.
- Aggiungi i tre casi limite che ricorrono in ogni abilità e che oggi vengono spiegati a voce ogni
  volta: **pareggio**, **bersaglio assente**, **effetto già attivo**.

Lo snapshot è il contratto osservabile dell'abilità. Un diff su un file di snapshot in una PR
significa che è cambiato qualcosa che il giocatore vede, e va giustificato nella descrizione.

---

## Parte C — Modalità `--gaps`

Percorre l'intero catalogo, per ogni segmento di ogni voce implementata, e riporta:

- primitive che non producono alcuna cue in `resolveNoticeCinematics`;
- segmenti che non producono alcun avviso;
- abilità i cui segmenti sono **tutti** `CHANGE_PRESENCE` (la ricarica inerte);
- Eminenze per cui `hasAlwaysLegalOption` è falso;
- chiavi di `condition` non presenti nel vocabolario di `effectConditions.js`;
- `timing` o `primitive` non presenti negli enum di `eminenceConstants.js`.

Output tabellare, exit code 1 se emerge qualcosa. Questa modalità sostituisce l'ispezione manuale:
è lo stesso lavoro che oggi si fa leggendo i file, ma ripetibile.

Sul commit attuale l'esecuzione deve riportare almeno questi casi, che servono da verifica che la
modalità funzioni davvero. Se non li trova, la modalità è incompleta:

- `COMPOSE_ABILITY`, `REGISTER_END_MATCH_DEBT` e `BLOCK_EMINENCE` non producono cue;
- sei voci sono di sola osservazione: le ricariche `kethran_sacrificio`, `khemet_devozione`,
  `orathai_tacet`, `ratti_sussurro`, `figli_leggerezza`, più lo Statico Khemet;
- `MARK_CARD` restituisce `null` **per scelta** — va classificato come atteso, non come buco, con
  una lista di eccezioni dichiarata in cima al file.

---

## Criteri di accettazione

1. `node tools/eminence-trace.mjs --eminence kethran_altare --ability kethran_sacrificio` stampa una
   traccia leggibile senza flag aggiuntivi.
2. Due esecuzioni consecutive sullo stesso fixture producono output identico byte per byte.
3. `npm run test:unit` resta verde, snapshot inclusi.
4. `--gaps` esce con codice 1 sul commit attuale e riporta i casi elencati in Parte C.
5. Nessun file sotto `src/game/` è stato modificato, tranne il nuovo file di test.
6. `Documentazione/` guadagna una pagina breve — non più di una schermata — che spiega come
   aggiungere un fixture e come rigenerare gli snapshot. È l'unica documentazione discorsiva che
   questo lavoro deve produrre.

---

## Nota sul seguito

L'harness rende leggibile la sequenza ma non impedisce di scrivere un segmento malformato: oggi un
`timing` sbagliato produce un segmento che non scatta mai, in silenzio, e l'harness lo mostrerebbe
solo come assenza. Il complemento naturale è un validatore di schema sul catalogo, con `primitive`
come discriminante che vincola `target`, `timing` e parametri ammessi. È un lavoro separato e va
fatto dopo: l'harness serve a vedere, il validatore a impedire.
