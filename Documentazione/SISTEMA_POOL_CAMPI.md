# SATZE — SISTEMA POOL CAMPI DI BATTAGLIA

*Motore di selezione: tassonomia, composizione, rarità*
*Bozza di lavoro — sostituisce il `full random` di `selectBattlefields`*

---

## 0. STATO E SCOPE

Oggi la selezione (`selectBattlefields`) è **uniforme casuale** con due soli vincoli: in Classica esclude i `neutral`, forza il primo campo a `minTurn:1`, poi pesca 4 a caso. Questo documento definisce il sistema che la sostituisce:

- **Composizione garantita** della pescata (System B) — controlla la *texture* della partita.
- **Rarità con coda aperta** — alcuni campi sono più dirompenti e compaiono di rado, ma 3/4/5 rari restano *possibili*, mai impossibili.

> Questo documento copre **solo il motore**. Il design dei campi nuovi (28, per pareggiare le armate a 6) è un deliverable separato che dipende dallo schema qui sotto.

---

## 1. SCHEMA DATI DEL CAMPO

Campi attuali nell'oggetto: `id, name, icon, effect, category, minTurn, flavour, bgImage`.

Aggiunte:

| Campo | Tipo | Ruolo |
|-------|------|-------|
| `rarità` | `'comune' \| 'raro' \| 'special'` | **Pilota la pesca.** Unico asse letto dal motore di selezione. |
| `tema` | armata o `'generico'` | **Solo etichetta** (arte/lore/copertura). NON pesa lo spawn. |

`category` e `minTurn` restano come sono. Nota: `tema` oggi vive solo nei commenti e usa **nomi legacy** (Comete, Circolo Mistico, ecc.) → va portato nel dato con i **nomi attuali**.

Esempio:
```js
{ id: 9, name: "Porte di Atlantide", icon: "wave",
  effect: "FC investiti raddoppiati nel calcolo VA",
  category: "focus", rarità: "special", tema: "generico",
  minTurn: 1, flavour: "...", bgImage: "./campi_bg/campo-9.png" }
```

---

## 2. TASSONOMIA

### 2.1 `category` — tipo meccanico + mode-gate

Resta invariato. Valori: `values / limit / conditional / focus / trigger / neutral`.
`neutral` è un **mode-gate** (solo Bare Hands), non una rarità. Per questo `special` **non** è un valore di `category`: mescolerebbe "in che modalità esce" con "quanto è dirompente", e perderebbe il tipo meccanico (es. "POT/DAN invertiti" è `values` *e* special).

### 2.2 `rarità` — l'asse che pilota la selezione

| Tier | Definizione operativa | Esempi |
|------|------------------------|--------|
| **comune** | Nudge di stat/risorse, additivi, si sommano senza conflitti | +1 POT, -2 DAN, +1 FC al perdente |
| **raro** | Alto impatto numerico, ma sempre additivo/coerente | +4 POT a entrambi, +2 DAN extra al vincitore |
| **special** | **Piega le regole**: economia FC, inversioni, annullamenti, forzatura trigger | FC raddoppiati nel VA, POT/DAN invertiti, "poteri senza trigger", "annulla Copia" |

**Perché la distinzione raro/special conta:** i `raro` si possono impilare a piacere (5 modificatori di stat additivi = partita estrema ma coerente). Gli `special` no — alcuni si **contraddicono** ("FC raddoppiati" + "FC max 3", due "annulla X", "POT scambiate" + "POT/DAN invertiti"). Per questo gli `special` hanno **cap 1 per pescata** (vedi §3.3).

### 2.3 `tema` — etichetta, non peso

`tema` serve a copertura per armata, arte e lore. **Non** modifica la probabilità di spawn: se un campo a tema uscisse più spesso quando quell'armata è in gioco, romperebbe la simmetria (es. il campo Calibri che sblocca Overdrive a 4 FC aiuterebbe solo il giocatore Calibri).

Valori canonici (nomi attuali): `Figli dell'Orizzonte, Kethran, Corte Rossa, Calibri Pesanti, Orathai, Nati dalla Bocca, Enclave delle Scaglie, Ratti della Megera, Patto degli Indocili, Khemet, generico`. I 18 campi originali (001–018) = `generico` (riempitivo condiviso). I 5 neutri restano gestiti da `category: neutral`.

### 2.4 `minTurn` — vincolo posizionale

Resta `1 | 2`. Diventa una regola di posizione nel motore (§3.2): i campi `minTurn:2` non possono finire negli slot attivi al turno 1.

---

## 3. MOTORE DI SELEZIONE

Genera 5 campi, **uno slot alla volta**, in ordine.

### 3.1 Ordine delle operazioni (per slot)

1. **Pool eligibile** = campi non-`neutral`, esclusi i già scelti.
2. **Filtro posizionale `minTurn`** (§3.2): se lo slot è attivo al turno 1, solo `minTurn:1`.
3. **Tira il tier** con le probabilità correnti (§3.3), rispettando il cap special.
4. **Pesca uniforme** dentro `{eligibili ∩ tier}`. Se quel bucket è vuoto → **declassa** il tier (special→raro→comune) e ripesca.
5. **Aggiorna** i contatori (`raresPlaced`, `specialPlaced`).

### 3.2 Vincolo posizionale `minTurn` (corregge una falla attuale)

I 5 campi non si rivelano "1 per turno": `revealedFields` parte da `REVEAL_START` (nel prototipo = **3**) e cresce di 1 a round. Quindi al turno 1 sono giocabili gli slot `0 .. REVEAL_START-1`, e la selezione del campo **non** controlla `minTurn` a runtime. Il vecchio vincolo proteggeva solo lo slot 0 → un `minTurn:2` in slot 1 o 2 era giocabile al turno 1.

**Regola corretta:** i primi `REVEAL_START` slot pescano **solo da `minTurn:1`**; i `minTurn:2` possono stare solo negli slot successivi (rivelati da round 2 in poi).

> ⚠️ `REVEAL_START` va confermato dal **codice reale del repo** (la copia che ho è il prototipo). Se nel repo è diverso da 3, cambia quali slot sono vincolati.

### 3.3 Probabilità di tier + coda aperta

```
pS(slot) = (slot >= SPECIAL_SLOT_MIN AND not specialPlaced) ? pS_base : 0      // cap special = 1
pR(slot) = max( f_R , pR_base * d^k )            // k = #(raro+special già piazzati)
pC(slot) = 1 - pS(slot) - pR(slot)
```

- **Niente cap sui rari.** Il floor `f_R > 0` tiene la probabilità sopra zero → 3/4/5 rari sempre possibili, sempre più improbabili.
- `d ∈ (0,1)` decide quanto in fretta sgonfia dopo ogni raro.
- `pR_base` decide la texture media.
- Gli `special` compaiono solo dagli slot tardi (`SPECIAL_SLOT_MIN`) e una volta soli per pescata.

---

## 4. PARAMETRI (default PROVVISORI — da tarare)

| Parametro | Default provv. | Significato |
|-----------|----------------|-------------|
| `pR_base` | 0.40 | prob. raro al primo slot senza rari precedenti |
| `d` | 0.50 | decadimento per ogni raro già piazzato |
| `f_R` | 0.10 | **pavimento**: prob. raro non scende sotto questo |
| `pS_base` | 0.12 | prob. special (solo slot tardi, cap 1) |
| `SPECIAL_SLOT_MIN` | 3 | primo slot da cui può uscire uno special |
| `REVEAL_START` | 3 *(da confermare dal repo)* | slot attivi al turno 1 → vincolati a `minTurn:1` |

**Verifica della coda** con questi valori (`pR` per slot: 0.40 → 0.20 → 0.10 → 0.10 → 0.10):

- P(tutti e 5 rari) ≈ 0.40·0.20·0.10·0.10·0.10 ≈ **1 su ~12.500 partite** — "molto difficile ma figo".
- Knob: `f_R` apre/chiude la coda, `d` la pendenza, `pR_base` la frequenza media.

> **Da decidere:** target della coda (es. tutti-rari ~1 su 10.000 vs ~1 su 1.000) → da lì derivo `pR_base / d / f_R` invece dei numeri a naso qui sopra. E se `pS_base` va concentrato sull'ultimo slot (special come sorpresa di fine partita) o spalmato sugli slot tardi.

---

## 5. PSEUDOCODICE `selectBattlefields` v2 (agnostico)

```
function selectBattlefields(mode):
    if mode == 'bareHands':
        return shuffle( ALL.filter(c => c.category == 'neutral') )

    pool = ALL.filter(c => c.category != 'neutral')
    selected = []
    raresPlaced = 0
    specialPlaced = false

    for slot in 0..4:
        eligible = pool.filter(c => c not in selected)
        if slot < REVEAL_START:
            eligible = eligible.filter(c => c.minTurn == 1)   // §3.2

        tier = rollTier(slot, raresPlaced, specialPlaced)
        bucket = eligible.filter(c => c.rarità == tier)
        while bucket.isEmpty():                                // §3.1 step 4
            tier = declass(tier)                              // special→raro→comune
            bucket = eligible.filter(c => c.rarità == tier)

        pick = uniformRandom(bucket)
        selected.push(pick)
        if pick.rarità == 'special': specialPlaced = true
        if pick.rarità in {'raro','special'}: raresPlaced += 1

    return selected

function rollTier(slot, k, specialDone):
    pS = (slot >= SPECIAL_SLOT_MIN and not specialDone) ? pS_base : 0
    pR = max(f_R, pR_base * pow(d, k))
    r = random()                                              // [0,1)
    if r < pS:        return 'special'
    if r < pS + pR:   return 'raro'
    return 'comune'
```

> Lo pseudocodice presuppone la rivelazione del prototipo (`REVEAL_START`, slot consumati come draft). **Va riallineato alla `selectBattlefields` + logica `revealedFields` del repo** prima di diventare codice definitivo.

---

## 6. APERTI / PROSSIMI PASSI

1. **Schema** (§1–2): confermare `interazione` assorbita in `rarità` (default qui) o tag descrittivo separato.
2. **Tuning** (§4): target della coda rari; posizione di `pS_base`.
3. **Repo**: incollare `selectBattlefields` + logica `revealedFields` → confermare `REVEAL_START` e riallineare §5.
4. **28 campi**: progettare per pareggiare ogni armata a 6 (Kethran/Calibri/Orathai/Nati +1; Enclave/Ratti/Patto/Khemet +6). Richiede schema bloccato + lettura file identità delle 4 armate mancanti.

---

## APPENDICE A — CLASSIFICAZIONE RARITÀ (50 campi esistenti)

Scoping: **`special` stretto** (solo alta-varianza / contraddittori). Va scritta nel dato come campo `rarità` su ogni oggetto (cards.js / array campi = ground truth).

**Distribuzione:** comune 24 · raro 18 · special 8 · (neutri 5: `category: neutral`, senza rarità).

### special (8) — cap 1, solo slot tardi
| # | Nome | Effetto |
|---|------|---------|
| 7 | Sala degli Specchi | POT scambiate tra i giocatori |
| 9 | Porte di Atlantide | FC raddoppiati nel calcolo VA |
| 14 | Santuario del Silenzio | Poteri e Bonus annullati |
| 18 | Biblioteca Proibita | Chi ha meno FC: +5 VA |
| 20 | Orlo del Buco Nero | POT e DAN invertiti |
| 32 | Radura dell'Anima | Annulla tutti i modificatori POT/DAN |
| 36 | Il Pozzo Gravitazionale | FC investiti max 3 |
| 41 | Crocevia dei Patti | Poteri si attivano senza trigger |

### raro (18)
| # | Nome | Effetto | Sottotipo |
|---|------|---------|-----------|
| 1 | Gran Corno | +4 POT a entrambi | stat forte |
| 10 | Nido di Spine | Vincitore: −5 PV | PV forte |
| 35 | Frammento Oscurato | −2 POT e −2 DAN a entrambi | stat forte |
| 42 | Mercato delle Anime | −3 POT a entrambi (min 1) | stat forte |
| 47 | Sanctum dell'Equilibrio | −5 VA a Lega più alta | VA forte |
| 3 | Arena degli Gnomi | Poteri annullati | disabilita 1 meccanica |
| 6 | Tempio del Monaco Pazzo | Bonus annullati | disabilita 1 meccanica |
| 24 | Biblioteca Lingue Perdute | Blocca Potere/Bonus non funzionano | disabilita 1 meccanica |
| 27 | Fossa dei Traditori | Effetti Copia annullati | disabilita 1 meccanica |
| 28 | Mura EMP | Immune non funziona | disabilita 1 meccanica |
| 43 | Firewall Centrale | DAN diretti annullati | disabilita 1 meccanica |
| 22 | Fondamenta della Torre | Gloria e Vendetta sempre attivi | trigger forzato |
| 31 | Convergenza delle Ley | Magnanimo sempre attivo | trigger forzato |
| 39 | Mura della Sfida | Rimonta sempre attiva | trigger forzato |
| 45 | Cerchio di Evocazione | Intervento sempre attivo | trigger forzato |
| 49 | Alveare Abbandonato | Imboscata sempre attiva | trigger forzato |
| 29 | Nucleo del Reattore | Overdrive si attiva con 4 FC | soglia/cap |
| 15 | Nexus Arcano | DAN massimo = 4 | soglia/cap |

### comune (24)
2 Altopiano delle Tre Lune · 4 Miniera di Lacrime · 5 Nido dell'Antico · 8 Cripta dei Sussurri · 11 Canyon delle Lame · 12 Torre d'Avorio · 13 Fossa dei Leoni · 16 Voragine Infinita · 17 Altare del Sacrificio · 19 Nebulosa dei Ricordi · 21 Cimitero di Stelle · 23 Ziqqurat Spezzata · 25 Sala dei Contratti · 26 Trono di Cenere · 30 Deposito di Rottami · 33 Nido della Regina · 34 Pianura Divorata · 37 Trono Solare · 38 Trono dei Re Caduti · 40 Tribunale dell'Anima · 44 Centrale Energetica · 46 Fonte del Mana · 48 Palude Tossica · 50 Terreno di Caccia

---

*Bozza — motore di selezione campi. I parametri di §4 sono provvisori. Classificazione rarità (App. A) confermata.*

---

## APPENDICE B — 28 CAMPI NUOVI (revisione 3 · sincronizzata)

> Nomi e tag rispecchiano **`CAMPI_MASTER.md`** (fonte unica per nomi/tag di tutti gli 83 campi). Qui resta il razionale di design.

Tutti **simmetrici**. `tema` = etichetta. **Rarità tenuta STRETTA** (App. A): `special` = solo economia FC + Imponi + shutdown totale; mod sui trigger, cap e singoli annullamenti restano `raro`.
**Distribuzione nuova:** comune 7 · raro 18 · special 3.

### Le quattro armate a +1

| id | Nome | Effetto | category | rarità | tema | minTurn |
|----|------|---------|----------|--------|------|---------|
| 56 | Falso idolo | Chi è sotto nei PV: +3 VA | conditional | raro | Kethran | 2 |
| 57 | La Grande Forgia | Cura 1 PV a chi ha meno PV dopo lo scontro | conditional | comune | Calibri Pesanti | 2 |
| 58 | L'Albero del Giudizio | Resa dei conti sempre attiva per entrambi | trigger | raro | Orathai | 1 |
| 59 | Le Grandi Fauci | Imboscata e Intervento con tempistiche invertite (Imboscata→2° · Intervento→1°) | limit | raro | Nati dalla Bocca | 1 |

### Enclave delle Scaglie

| id | Nome | Effetto | category | rarità | tema | minTurn |
|----|------|---------|----------|--------|------|---------|
| 60 | Volta del Tesoro | +2 FC a entrambi dopo lo scontro | conditional | comune | Enclave | 2 |
| 61 | Trono d'Ossidiana | Gli effetti con trigger Conquista valgono doppio (entrambi) | conditional | raro | Enclave | 1 |
| 62 | Arena delle Scaglie | Vince il duello chi ha investito più FC (ignora il VA) | focus | special | Enclave | 1 |
| 63 | Caverna del Wyrm | POT massima = 5 | limit | raro | Enclave | 1 |
| 64 | Cova di Scaglie | L'agente giocato per primo: +1 POT | conditional | comune | Enclave | 1 |
| 65 | Picco del Drago Caduto | Vincitore: +1 FC e −2 PV | conditional | raro | Enclave | 1 |

### Ratti della Megera

| id | Nome | Effetto | category | rarità | tema | minTurn |
|----|------|---------|----------|--------|------|---------|
| 66 | Fogna Maestra | I "minimi" degli effetti sul campo sono ridotti di 1 (es. −3 POT min 5 → min 4) | limit | raro | Ratti | 1 |
| 67 | Reggia del Custode | FC dimezzati (per eccesso) nel calcolo VA | focus | special | Ratti | 1 |
| 68 | Trono della Megera | Ultimo Desiderio si attiva 2 volte (entrambi) | trigger | raro | Ratti | 1 |
| 69 | Lago dei Miasmi | −1 POT all'agente con più POT | values | comune | Ratti | 1 |
| 70 | Cattedrale del Decadimento | Il Bonus armata è sostituito da "Conquista: Tossina 2 (min 10)" | limit | raro | Ratti | 1 |
| 71 | Decadente Catrelburg | +5 VA alla carta con meno POT | values | raro | Ratti | 1 |

### Patto degli Indocili

| id | Nome | Effetto | category | rarità | tema | minTurn |
|----|------|---------|----------|--------|------|---------|
| 72 | L'Ultrastrada | Turbo sempre attivo per entrambi | trigger | raro | Patto | 1 |
| 73 | Ponte dei Vandali | Turbo e Ultima Chance con tempistiche invertite (Turbo→Round 5+ · Ultima Chance→Round 1-2) | limit | raro | Patto | 1 |
| 74 | Il Circuito | L'agente giocato per primo attiva il Potere con trigger "Sfida", il secondo con "Sopraffare" | limit | raro | Patto | 1 |
| 75 | Undicesima Megalopoli | −1 POT e −3 VA a entrambi | values | comune | Patto | 1 |
| 76 | L'Ultimo Distributore | Ogni 3 FC investiti: +1 DAN | focus | comune | Patto | 1 |
| 77 | Posto di Blocco | L'agente giocato per secondo perde il Potere (Blocca Potere) | limit | raro | Patto | 1 |

### Khemet

| id | Nome | Effetto | category | rarità | tema | minTurn |
|----|------|---------|----------|--------|------|---------|
| 78 | Tempio di Cobalto | +4 VA a entrambi | values | raro | Khemet | 1 |
| 79 | Camera Rituale | Overdrive: +1 POT e +1 DAN extra a entrambi | conditional | raro | Khemet | 1 |
| 80 | Sala dei Soulwright | Entrambe le carte sono Immune (ignorano −POT/−DAN/−VA) | limit | raro | Khemet | 1 |
| 81 | Altare dell'Imposizione | Il DAN di ogni carta è imposto pari alla sua POT (entrambi) | limit | special | Khemet | 1 |
| 82 | Necropoli Dorata | Vincitore: cura 1 PV | conditional | comune | Khemet | 2 |
| 83 | Cripta dei Re-Maghi | Resistenza sempre attiva per entrambi | trigger | raro | Khemet | 2 |

---

### §B.fine — DIPENDENZE D'IMPLEMENTAZIONE

Tutti e 28 i campi sono definiti e coerenti. Restano solo cose che chiedono **codice nuovo**:

- **Nuovi field-mod `alwaysActive`** (oggi solo gloria/imboscata/intervento/magnanimo/rimonta/vendetta): **58**, **72**, **83**.
- **Swap/override di trigger** (nuova logica di campo): **59**, **73**, **74**.
- **`Imponi`** non ancora implementato: **81**.
- **Modificatori globali di campo**: **61** (×2 Conquista), **62**/**67** (override calcolo VA), **66** (−1 ai "minimi"), **68** (×2 Ultimo Desiderio).

---

*Bozza — App. A e App. B sincronizzate con `CAMPI_MASTER.md`. Nomi/tag finali; restano solo dipendenze di codice (§B.fine).*
