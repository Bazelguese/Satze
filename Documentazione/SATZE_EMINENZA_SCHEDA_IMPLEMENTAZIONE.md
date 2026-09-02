# SATZE — Scheda operativa per l'implementazione di un'Eminenza

> **Uso:** compilare una copia di questa scheda per ogni Eminenza prima di scrivere codice.
> **Fonte normativa:** `Documentazione/SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md` (§3, §11.7, §12, §16).  
> **Copy testi:** `Documentazione/SATZE_EMINENZA_COPY_GUIDE.md`
> **Dati:** `src/data/eminences.js` · **Motore:** `src/game/eminence/*`

---

## 0. Identità

| Campo | Valore |
|---|---|
| **ID tecnico** | `armata_nome` (es. `khemet_maledizioni`) |
| **Armata** | |
| **Nome UI** | |
| **Presenza iniziale** | |
| **Curva costi** | +? / −? / −? (Corte Rossa: 4 attive) |
| **Fase spec §16** | 2 MVP · 4 persistenti · 5 Lega · 6 complessità |
| **Stato attuale** | `implemented: false` → da portare a `true` |

---

## 1. Due assi — non confonderli

Ogni abilità/segmento va mappato su **due dimensioni indipendenti**:

| Asse | Domanda | Valori |
|---|---|---|
| **`revealGate`** | Quando l'abilità diventa **pubblica**? | `PRE_FIELD` · `PRE_AGENT` · `GENERAL` |
| **`timing`** (segmento) | Quando l'**effetto** si risolve? | vedi §2 |

> Reveal ≠ risoluzione. Esempio: Calibri −4 → reveal `GENERAL`, effetto `BEFORE_CONQUEST`.

### 1.1 Tabella abilità → gate

Compilare per ogni attiva (e verificare igiene informativa §3.2):

| Abilità | `presenceDelta` | `revealGate` | Motivo gate |
|---|---:|---|---|
| +? | | | |
| −? | | | |
| −? | | | |

**Check igiene informativa:** se tolte le abilità già assegnate a un gate anticipato ne resta **una sola**, anche quella va anticipata (caso Khemet +0).

### 1.2 Riordino pipeline

- [ ] Nessuno Statico riordina le decisioni
- [ ] Statico con `reordersGateSequence: 'AGENTS_FIRST'` (caso Mascarada)

Se sì → la sequenza gate diventa `PRE_AGENT → PRE_FIELD → GENERAL`, non l'inverso.

---

## 2. Checkpoint di risoluzione (`EFFECT_TIMINGS`)

Ordine canonico (non tutti obbligatori per ogni Eminenza):

```
ROUND_START
  → scelta segreta + gate intermedi
AFTER_REVEAL
  → subito dopo il reveal del gate corrente
BEFORE_FIELD_RESOLUTION
  → prima che il Campo applichi effetti strutturali
BEFORE_TRIGGER_CHECK
  → overlay trigger / Grande Semaforo / alias Mascarada
BEFORE_POWER_RESOLUTION
  → modificatori POT/DAN/VA pre-confronto
  --- DUELLO ---
AFTER_DUEL_OUTCOME
  → esito noto, prima di effetti post-esito
BEFORE_CONQUEST
  → soppressione Conquista, distruzione Campo
POST_BATTLE
  → aftermath post-duello
END_ROUND
END_MATCH
```

### 2.1 Tabella segmenti

Per ogni riga del testo canonico (Statico + attive):

| Fonte (Statico/Attiva) | Segmento | `timing` | Primitiva | `target` | Condizione | Note |
|---|---|---|---|---|---|---|
| | | | | | | |

**Regola Statico:** se modifica le **premesse** di una decisione (Campo, ordine scelte), usare `ROUND_START`, non `AFTER_REVEAL`.

---

## 3. Parametri e scelte

| Abilità | `choiceParamsTiming` | Parametri | `paramsSchema` / fonte |
|---|---|---|---|
| | `AT_SELECTION` / `AT_REVEAL` | | |

- **`AT_SELECTION`:** solo se aspettare il reveal darebbe informazione nuova indebitamente (Scommessa Mascarada).
- **Setup Scontro:** Statico con `setupChoice: true` + `setupParamsSchema` (Preda Mounthborn).

### 3.1 Stato persistente

| Chiave `persistent` | Tipo | Quando scritta | Quando consumata |
|---|---|---|---|
| es. `preyCardIds` | `string[]` | | |
| es. `fragmentCardIds` | | | |
| es. `debitoByCardId` | | | |

Slot Campo (Maledizioni Khemet): preferire `battlefieldSlot.eminenceModifiers`, non la carta Campo.

---

## 4. Pipeline — dove agganciarsi (motore già fatto)

Non reimplementare il flusso. Consumare solo questi entry point:

| Fase round | Funzione | Cosa produce |
|---|---|---|
| Apertura round | `openEminenceRound` | Statici `ROUND_START`, `fieldOperations` |
| Setup Scontro | `commitEminenceSetupChoice` | marker iniziali (Preda, …) |
| Gate intermedi | `advanceToNextRevealGate` | eventi `REVEAL`, notifiche reveal |
| Soglia Duello | `prepareEminenceDuel` | reveal `GENERAL` + checkpoint pre-duello |
| Post-esito | `settleEminenceRound` | checkpoint post-duello, notifiche differite |

React/UI: leggere `events` + `notices`; non duplicare logica di timing.

---

## 5. Notifiche (automatiche se i dati sono corretti)

| Momento | Funzione | Quando compare |
|---|---|---|
| Setup statico | `noticesFromSetupPending` | scelta Preda / setup non committato |
| Statico round | `noticesFromRoundStart` | Statico always-on o segmento maturato |
| Reveal attiva | `noticesFromRevealEvents` | evento `REVEAL`, se almeno un segmento pre-duello |
| Effetto differito | `noticesFromAppliedEffects` | solo segmenti **post-duello** (`abilityAnnouncesAtReveal === false`) |

**Check manuale UI:** l'avviso al reveal per un'abilità post-duello pura sarebbe vuoto → i segmenti devono usare timing post-duello e l'avviso nasce a risoluzione.

---

## 6. Implementazione — ordine di lavoro

### Step A — Solo dati (`src/data/eminences.js`)

1. Compilare record con testi canonici §12.
2. Assegnare `revealGate` a ogni attiva.
3. Scomporre ogni effetto in segmenti + primitive da `EMINENCE_PRIMITIVES`.
4. Aggiungere condizioni dichiarative (`effectConditions.js`).
5. Lasciare `implemented: false` finché i segmenti non sono completi.

### Step B — Primitive mancanti?

Prima di aggiungere un ramo `if (eminenceId === '…')` nel motore:

- [ ] Esiste già una primitiva in `eminenceConstants.js`?
- [ ] Esiste già un handler in `primitiveHandlers.js`?
- [ ] Esiste già un termine di condizione in `effectConditions.js`?

Se no → **aggiungere primitiva/termine generico**, poi usarla nei dati.

### Step C — Integrazione Duello (solo se serve)

Alcune primitive richiedono binding nel risolutore Duello (`eminenceDuelBinding.js`, `duelApplyEffect.js`):

- [ ] `IGNORE_FIELD`
- [ ] `MODIFY_STAT` / `MODIFY_LEAGUE`
- [ ] overlay trigger (`triggerRulesOverlay.js`)
- [ ] operazioni Campo (`fieldOperations.js`)
- [ ] Conquista forzata / soppressa

Segnare qui quali hook del Duello devono leggere il bundle prodotto.

### Step D — Flag `implemented: true`

Mettere `implemented: true` su:

- record Eminenza;
- Statico (se presente e completo);
- ogni attiva con segmenti eseguibili.

---

## 7. Template dati (scheletro)

```js
nome_eminenza: {
  id: 'nome_eminenza',
  army: 'Armata',
  name: 'Nome UI',
  initialPresence: 0,
  implemented: false,
  // reordersGateSequence: 'AGENTS_FIRST',  // solo se Statico lo impone

  static: {
    id: 'static_id',
    name: 'Nome Statico',
    text: 'Testo canonico.',
    implemented: false,
    // setupChoice: true,
    // setupParamsSchema: { preyCardId: { source: PARAM_SOURCES.ENEMY_UNDEPLOYED } },
    // setupSegments: [ { primitive: P.MARK_CARD, mark: 'prey', persistent: true } ],
    segments: [
      {
        timing: EFFECT_TIMINGS.ROUND_START,
        primitive: P.REPLACE_FIELD,
        target: T.GLOBAL,
        condition: { roundNumber: 5 },
        // fieldId: 89,
      },
    ],
  },

  abilities: [
    {
      id: 'abilita_id',
      name: 'Nome',
      presenceDelta: 0,
      revealGate: REVEAL_GATES.GENERAL,
      choiceParamsTiming: CHOICE_PARAMS_TIMING.AT_REVEAL,
      text: 'Testo canonico.',
      // paramsSchema: { pronostico: { enum: ['VITTORIA_PROPRIA', ...] } },
      segments: [
        {
          timing: EFFECT_TIMINGS.AFTER_REVEAL,
          primitive: P.MODIFY_STAT,
          target: T.OWN_AGENT,
          stat: 'power',
          delta: 1,
        },
      ],
    },
  ],
},
```

---

## 8. Test obbligatori

### 8.1 Test file da estendere

| File | Cosa verifica |
|---|---|
| `src/game/eminence/acceptance.test.js` | round completo, bundle, assenza rami per-nome nel motore |
| `src/game/eminence/eminenceRound.test.js` | gate, legalità, ipotesi sigillate |
| `src/game/eminence/eminenceDuelGate.test.js` | orchestrazione round |
| `src/game/eminence/statics.test.js` | Statici e ROUND_START |
| `src/game/eminence/presenceTriggers.test.js` | Invocazione, Fervore, … |
| `src/game/eminenceDuel.integration.test.js` | integrazione Duello end-to-end |

### 8.2 Checklist casi minimi (compilare)

**Legalità e gate**

- [ ] Scelta illegale rifiutata al checkpoint Presenza
- [ ] Scelta bloccata non diventa retroattivamente illegale
- [ ] Gate superato senza reveal restringe ipotesi avversarie
- [ ] Pagamento Presenza atomico al reveal (iniziativa non blocca avversario)

**Per abilità**

- [ ] +? : effetto atteso al checkpoint corretto
- [ ] −? : costo Presenza + effetto
- [ ] −? : idem

**Statico**

- [ ] Condizione falsa → nessun effetto, nessun avviso spurio
- [ ] Condizione vera → effetto + avviso round-start (se applicabile)

**Interazioni (se pertinenti)**

- [ ] vs Apex `IGNORE_FIELD`
- [ ] vs overlay trigger (Patto)
- [ ] vs Maledizioni slot / Preda / Frammenti
- [ ] IA: scelta segreta non nel public hash
- [ ] Online: commit–reveal coerente

### 8.3 Casi canonici §11.7 (se questa Eminenza)

Spuntare solo quelli rilevanti dal catalogo spec:

- [ ] Calibri −2 / −4
- [ ] Ratti −3 / −2
- [ ] Khemet (tutte PRE_FIELD, Presenza 2)
- [ ] Mounthborn Preda setup
- [ ] Corte −4 FC temporanei
- [ ] Orathai trigger null
- [ ] Enclave Lega pre-Agente
- [ ] Mascarada ordine decisioni

### 8.4 Helper test (copiare da acceptance)

```js
function playRound({ playerEminenceId, enemyEminenceId, playerAbility, enemyAbility, ... }) {
  // vedi src/game/eminence/acceptance.test.js
}
```

---

## 9. Definition of done

Un'Eminenza è **completa** quando:

1. `implemented: true` su record, Statico e attive completate.
2. Nessun ramo col suo `id` nei moduli motore (`acceptance.test.js` lo verifica).
3. Test dedicati verdi in `acceptance.test.js` (minimo un caso per attiva + Statico).
4. Notifiche corrette: reveal vs differito.
5. UI zona Eminenza mostra Presenza, reveal e blocco coerenti.
6. IA e `publicStateHash` aggiornati se introduce stato pubblico nuovo.
7. Testi UI = canonici §12 e conformi a `SATZE_EMINENZA_COPY_GUIDE.md`.

---

## 10. Red flags — fermarsi e generalizzare

| Segnale | Azione corretta |
|---|---|
| `if (eminenceId === '…')` nel motore | Aggiungere primitiva/condizione generica |
| Effetto post-duello che modifica POT del duello appena finito | Rivedere timing: serve persistenza o round successivo |
| Guadagno Presenza round 5 non spendibile | Dead value: spostare timing o accettare esplicitamente |
| Nuovo checkpoint non in `EFFECT_TIMINGS` | Aggiungere costante + aggancio in `eminenceDuelGate` |
| Parametro scelto al reveal ma dà vantaggio informativo | Spostare a `AT_SELECTION` |
| Due Eminenze con stessa primitiva ma handler duplicati | Unificare handler |

---

## 11. Stato implementazione (aggiornare)

| Eminenza | ID | Fase §16 | `implemented` | Test acceptance |
|---|---|---|:---:|---|
| Il Sole Verde | `apex_sole_verde` | 2 | ✅ | ✅ |
| Il Grande Semaforo | `patto_grande_semaforo` | 2 | ✅ | ✅ |
| L'Organizzatore | `mascarada_organizzatore` | 6 | ✅ | ✅ |
| L'Altare | `kethran_altare` | 6 | ✅ | ✅ |
| La Fame | `mounthborn_fame` | 4 | ✅ | ✅ |
| Il Castello dei Sigillatori | `khemet_maledizioni` | 4 | ✅ | ✅ |
| La Domanda Senza Fine | `figli_domanda_senza_fine` | 4 | ✅ | ✅ |
| Calibri Pesanti | `calibri_quattro_fronti` | 4 | ❌ | |
| Enclave | `enclave_ascensione` | 5 | ❌ | |
| Ratti | `ratti_bella_malelabbra` | 5 | ❌ | |
| Orathai | `orathai_primo_canto` | 6 | ❌ | |
| Sanguinaccio, il Registro | `corte_rossa` | 6 | ✅ | ✅ |

---

## 12. Riferimenti rapidi codice

| Concetto | File |
|---|---|
| Vocabolario gate/timing/primitive | `src/game/eminence/eminenceConstants.js` |
| Scelta, reveal, pending | `src/game/eminence/eminenceRound.js` |
| Orchestrazione round | `src/game/eminence/eminenceDuelGate.js` |
| Primitive → bundle | `src/game/eminence/primitiveHandlers.js` |
| Condizioni segmenti | `src/game/eminence/effectConditions.js` |
| Notifiche UI | `src/game/eminence/eminenceAnnouncements.js` |
| Copy guide | `Documentazione/SATZE_EMINENZA_COPY_GUIDE.md` |
| Lint copy | `src/game/eminence/eminenceCopy.test.js` |
| Cinematiche / scintille | `src/game/eminence/eminenceCinematics.js` |
| Guida cinematiche | `Documentazione/SATZE_EMINENZA_CINEMATIC_GUIDE.md` |
| Catalogo dati | `src/data/eminences.js` |
| Hook partita | `src/hooks/useBattle.js` |

---

*Scheda v1 — allineata a SATZE_EMINENZE_SPEC_UNIFICATA_v2.2 e al motore in `src/game/eminence/`.*
