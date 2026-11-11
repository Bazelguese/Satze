# SATZE — Eminenze
## Mattoni base, scala di valore e audit
**Versione:** v1 — 10 novembre 2026
**Stato:** proposta di lavoro. I valori sono stime fatte a tavolino, non misure di playtest.

---

## 0. Scopo e fonti

Questo documento dà alle abilità delle Eminenze una base di design comune:

1. una **scala di valore** che converte la Presenza nella stessa unità usata per le carte (1 FC);
2. un **catalogo di mattoni base** (effetti elementari) con il loro prezzo, compresi i trigger forzati e Terraformare;
3. le **leve** che rendono un'abilità qualcosa di più di un numero, con l'effetto che ognuna ha sul prezzo;
4. un **audit** delle 12 Eminenze attuali (più Concordia, di campagna) su questa scala.

Il documento non modifica i testi canonici. Serve a misurarli e a progettarne di nuovi.

**Fonti usate**

| Cosa | File |
|---|---|
| Testi canonici delle Eminenze | `Documentazione/SATZE_EMINENZE_REWORK_TESTI_CORRETTI_2026-09-06.md` |
| Catalogo dati effettivo | `src/data/eminences.js`, `src/campaign/data/concordiaEminence.js` |
| Primitive del motore | `src/game/eminence/eminenceConstants.js`, `primitiveHandlers.js` |
| Regole di Presenza e pipeline del round | `Documentazione/SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md` §2–3 |
| Valori in FC degli effetti e moltiplicatori dei trigger | `Documentazione/SISTEMA_BILANCIAMENTO_COMPLETO.md` |
| Medie per armata (Body, EffEff, EffPot) | `Documentazione/ANALISI_BILANCIAMENTO_CROSS_ARMATA.md` (maggio 2026, 9 armate) |
| Bonus d'Armata attuali | `src/data/armies.js` |
| Terraformare | `docs/DESIGN_CAMPAGNA.md` cap. 14, `src/game/duel/terraform.js` |
| Campi | `src/data/battlefieldsData.js` |

**Terminologia:** come nella specifica delle Eminenze, **Duello** = un round, **Scontro** = la partita intera (5 round al massimo). Il `GLOSSARIO.md` usa ancora la convenzione vecchia.

---

## 1. Scala di valore

### 1.1 Unità di misura

- **1 FC** è l'unità di valore, la stessa di `SISTEMA_BILANCIAMENTO_COMPLETO.md`.
- **1 Presenza = 0.75 FC** (deciso).
- Il budget è **lineare**: nessun sovrapprezzo sui costi alti (vedi punti aperti §9).

### 1.2 Budget per fascia di costo

| Costo | Budget netto dell'effetto (FC) | Ruolo |
|---|---|---|
| +2 | −1.50 | ricarica pesante: deve costare davvero |
| +1 | −0.75 | ricarica: il giocatore paga qualcosa per ottenere Presenza |
| 0 | 0.00 | scelta "sicura": effetto piccolo, oppure Presenza solo se si verifica una condizione |
| −1 | 0.75 | |
| −2 | 1.50 | |
| −3 | 2.25 | |
| −4 | 3.00 | colpo forte |

**Formula:** `Budget = −(costo) × 0.75`. Un'abilità +1 ha budget −0.75: il suo effetto, sommato a eventuali costi, deve valere circa −0.75 FC.

### 1.3 Tolleranza e verdetti

**Scarto** = valore stimato − budget. **Tolleranza** = il maggiore tra 0.4 FC e il 20% del budget.

| Simbolo | Significato |
|---|---|
| ✅ | in fascia (scarto entro la tolleranza) |
| ⬆️ | generosa (scarto positivo oltre la tolleranza) |
| ⬆️⬆️ | molto generosa (scarto > +1.0) |
| ⬇️ | debole (scarto negativo oltre la tolleranza) |
| ⬇️⬇️ | molto debole (scarto < −1.0) |
| 〰️ | alta varianza: il valore dipende molto dalla situazione o dalla carta |

### 1.4 Presenza iniziale e Statico

Anche la Presenza iniziale e lo Statico hanno un valore sulla stessa scala:

- **Presenza iniziale** = P₀ × 0.75 FC.
- **Statico** = Presenza attesa per Scontro × 0.75 FC + eventuale effetto non di Presenza.

Il "motore" di un'Eminenza è la somma dei due: quanto valore può spendere in uno Scontro prima di contare le ricariche.

**Fascia proposta (da confermare):** Statico tra 1.5 e 2.5 Presenza per Scontro; motore totale (P₀ + Statico) tra 2 e 3 FC.

---

## 2. Valori di riferimento

Ipotesi usate in tutto il documento. Dove un dato non esiste, è indicato come **proposta**.

| Grandezza | Valore | Origine |
|---|---|---|
| FC medi per Duello | 3.6 | 18 FC / 5 Duelli |
| PV iniziali | 25 | `SISTEMA_BILANCIAMENTO_COMPLETO.md` |
| Probabilità di vincere un Duello | 0.5 | ipotesi neutra |
| POT / DAN medi | circa 3.9 / 2.6 | `ANALISI_BILANCIAMENTO_CROSS_ARMATA.md` §2 |
| **Potere di riferimento** (valore di un Potere medio con trigger attivo) | **circa 2.0 FC** | derivato, vedi §2.1 |
| **Fattore di selezione** | **×1.3** | **proposta**, vedi §2.2 |
| **P(blocco)**: probabilità che l'avversario blocchi un Potere in un Duello | **0.15** | **proposta**, da misurare con la telemetria |

### 2.1 Potere di riferimento

Molti mattoni sui trigger valgono "una parte del Potere della carta". Serve quindi un Potere medio.

1. In `ANALISI_BILANCIAMENTO_CROSS_ARMATA.md` la differenza media tra trigger accesi e trigger spenti è circa **0.34 di efficienza per punto di Lega**. Con una Lega media di circa 3–3.5 sono **circa 1.1 FC per carta** (Potere + Bonus).
2. Il Bonus ne spiega in media circa 0.25 (tabella §1.2 dello stesso file). Al solo Potere restano **circa 0.85–0.9 FC** di differenza tra acceso e spento.
3. Questa differenza vale `V × (1 − m)`, con `m` medio dei trigger circa 0.55. Ne viene **V ≈ 2.0 FC**.

Il valore è coerente come ordine di grandezza con *Blocca Potere = 1.50 FC* della tabella effetti.

**Varianza:** la stessa differenza va da circa 0.4 FC (Corte Rossa) a circa 1.7 FC (Kethran) per carta, e i singoli outlier vanno oltre. Ogni mattone che dipende dal Potere della carta è quindi 〰️ per costruzione.

**Limite:** l'analisi copre 9 armate su 12 (mancano Khemet, Apex, Mascarada) ed è di maggio 2026. Andrebbe rifatta sul catalogo attuale (vedi §9).

### 2.2 Fattore di selezione

L'abilità si sceglie in segreto a inizio round, **prima** di Campo, Agenti e FC (spec v2.2 §3.3). Chi la sceglie sa già quale carta schiererà. Per i mattoni che dipendono dalla carta, il giocatore ne sceglierà una migliore della media: per questo propongo di moltiplicare quei mattoni per **×1.3**.

---

## 3. Catalogo dei mattoni base

Ogni mattone ha un **valore**, la **primitiva del motore** che lo implementa e note d'uso. Se non diversamente indicato, l'effetto vale "per questo Duello" sul proprio lato.

### 3.1 Statistiche

| Mattone | Valore (FC) | Primitiva | Note |
|---|---|---|---|
| +1 POT | 0.50 | `MODIFY_STAT` (`power`) | sale a 0.70–0.80 se il giocatore investe molti FC; a 3.6 FC medi può arrivare a 1.0 |
| +1 DAN | 0.35 | `MODIFY_STAT` (`damage`) | conta solo se vinci |
| +1 VA | 0.28 | `MODIFY_STAT` (`assaultValue`) | additivo, non scala con gli FC |
| −1 POT / DAN / VA nemico | 0.50 / 0.35 / 0.28 × efficacia del minimo | `MODIFY_STAT` + `minimum` | efficacia: min 1–2 → 80%; min 3–4 → 70%; min 5–6 → 55% |
| ±1 Lega | circa 0.5–0.8, solo se cambia un trigger | `MODIFY_LEAGUE` | conta solo se attiva o spegne Sfida, Sopraffare, Alleato o Rinforzi: vale come un trigger forzato da m 0.6 (0.8), meno se pubblico |
| Potere concesso | valore dell'effetto × (1 − P(blocco)) | `GRANT_POWER` | un "Potere" si può bloccare; un `MODIFY_STAT` diretto no |

### 3.2 Risorse

| Mattone | Valore (FC) | Primitiva | Note |
|---|---|---|---|
| +1 FC temporaneo | **circa 1.0** (proposta) | `GRANT_TEMPORARY_FOCUS` | nel codice conta per VA e Overdrive (`duelResolve.js:298`); non decade perché si usa subito; non conta per Ancorato e Accumulo |
| +1 FC in riserva | 0.70 in media; per round 1.00 / 0.90 / 0.75 / 0.45 / 0.20 | `GRANT_POOL_FOCUS` | perde valore nei round finali |
| +1 Presenza a te | 0.75 | `CHANGE_PRESENCE` | per definizione |
| −1 Presenza all'avversario | circa 0.75 | `CHANGE_PRESENCE` (`OPPONENT`) | vale meno se l'avversario ha già 0 (la Presenza non scende sotto 0) |
| Blocca Eminenza avversaria | circa 0.75–1.5 (proposta) | `BLOCK_EMINENCE` | nega un round di scelta all'avversario; vale di più contro Eminenze a ricarica forte |

### 3.3 Punti Vita

| Mattone | Valore (FC) | Primitiva | Note |
|---|---|---|---|
| 1 Danno diretto all'avversario | 0.50 | `LOSE_HP` (`OPPONENT`) | garantito, non dipende dall'esito |
| −1 PV a te (come costo) | −0.20 | `LOSE_HP` (`SELF`) | |
| Cura 1 | 0.20 | `HEAL_HP` | **punto aperto**, vedi §9 |
| Tossina 1 / Tossina 2 | 0.35 / 0.70 | `APPLY_TOXIN` | se già attiva, sale di +1; vale meno nei round finali e vicino al minimo |

> ⚠️ **Il valore del PV non è uniforme.** La tabella delle carte dà 0.50 a un PV tolto all'avversario e solo −0.20 a un PV tolto a te. Per le carte regge, perché il costo in PV si paga quando conviene. Per le Eminenze che scambiano PV (Corte Rossa, Kethran, Apex) cambia molto i risultati. In questo audit ho applicato la tabella così com'è: 0.50 per i PV dell'avversario, 0.20 per i tuoi. Va deciso un valore unico (§9).

### 3.4 Controllo

| Mattone | Valore (FC) | Primitiva | Note |
|---|---|---|---|
| Blocca Potere nemico | 1.50 | — | dalla tabella effetti |
| Blocca Bonus nemico | 1.00 | `SET_ARMY_BONUS_STATE` (`suppressed`) | il valore reale dipende dal Bonus avversario (tabella §3.7) |
| Rinuncia al proprio Bonus | − valore del proprio Bonus | `SET_ARMY_BONUS_STATE` | va da −0.36 (Ratti) a −0.84 (Enclave) |
| Immune | 2.00 | `GRANT_IMMUNE` | ignora le riduzioni, non i Blocca |
| Ignora il Campo | circa 0.5 in media, da 0 a 1.5 〰️ | `IGNORE_FIELD` | vale quanto il Campo corrente toglie al tuo lato |

### 3.5 Trigger (nuovo)

Questa sezione dà un prezzo a tutte le manipolazioni dei trigger. Il principio è uno solo:

> **Il valore di un mattone sui trigger = Potere (o Bonus) di riferimento × variazione della probabilità che il trigger si attivi.**

Si usa `V = 2.0` per un Potere, il valore del Bonus d'Armata per un Bonus (§3.7), e `m` = moltiplicatore del trigger (`SISTEMA_BILANCIAMENTO_COMPLETO.md`).

#### 3.5.1 Formule

| Mattone | Formula | Primitiva | Esempio |
|---|---|---|---|
| **Forza un trigger proprio** ("il trigger del tuo Agente è considerato soddisfatto") | `V × (1 − m) × 1.3` | `FORCE_TRIGGER` (`OWN`) | Mascarada −4, Figli −2 |
| **Forza un trigger nominato** ("Intervento e Resistenza sono soddisfatti") | `V × (1 − m) × copertura` | `FORCE_TRIGGER` (`triggers: [...]`) | Concordia −2 |
| **Impedisci un trigger nemico** | `V × m` | `FORBID_TRIGGER` | Patto Rosso |
| **Potere non bloccabile** | `V × P(attivo) × P(blocco)`: circa **0.3** | `UNBLOCKABLE_POWER` | Mascarada −4 |
| **Trigger alternativo / alias** ("A vale anche come B") | `V × (p(A o B) − p(A))` | `ALIAS_TRIGGER` | Mascarada −2, Kethran Innesto |
| **Sostituisci il trigger** con X | `V × (p(X) − p(originale))` | `REPLACE_TRIGGER` | Orathai Silenzio, Corte Debito |
| **Scambia i trigger di Potere e Bonus** | `V_P × (p_B − p_P) + V_B × (p_P − p_B)` | `SWAP_POWER_BONUS_TRIGGERS` | Khemet +2 |
| **Rendi attivo il Bonus** | `V_B × (1 − m_B)` | `SET_ARMY_BONUS_STATE` (`forcedActive`) | Mounthborn Statico |
| **Specchio** ("se il tuo non si attiva, nemmeno il suo") | `V × m_nemico × P(il tuo fallisce)` | `MIRROR_UNSATISFIED_POWER` | Orathai −2 |

**Copertura** (per i trigger nominati): la probabilità di avere in mano una carta con quel trigger. Con l'abilità costruita sull'identità dell'armata (Concordia → Intervento) è circa 0.8–1.0; con un trigger raro nell'armata scende molto.

#### 3.5.2 Tabella pronta (V = 2.0, senza fattore di selezione)

| Trigger | m | Forza (proprio) | Impedisci (nemico) |
|---|---|---|---|
| Rinforzi | 0.75 | 0.50 | 1.50 |
| Imboscata, Intervento | 0.70 | 0.60 | 1.40 |
| Gloria, Vendetta, Conquista, Ultimo Desiderio, Sfida, Sopraffare | 0.60 | 0.80 | 1.20 |
| Resa dei conti, Overdrive, Opportunista, Invasione, Resistenza | 0.50 | 1.00 | 1.00 |
| Rimonta, Magnanimo, Ultima Chance | 0.40 | 1.20 | 0.80 |
| Turbo | 0.30 | 1.40 | 0.60 |
| Staffetta (campagna) | n.d. | da stimare | da stimare |

#### 3.5.3 Regole d'uso

1. **Trigger noti in anticipo** (Turbo, Resa dei conti, Ultima Chance, **Imboscata e Intervento**): nel singolo round la probabilità è 0 oppure 1, non `m`, ed è nota prima della scelta dell'Eminenza. L'iniziativa si alterna a ogni round (`src/game/duel/resolveRoundInitiative.js`) e chi sceglie per secondo vede l'Agente dell'altro. Forzare un trigger già attivo vale 0, forzarne uno spento vale l'intero `V`; rinunciare a un trigger già spento costa 0. Il prezzo va calcolato sul round in cui l'abilità sarà realisticamente usata. *(Correzione del 10 novembre 2026: la prima stesura usava `m` = 0.7 per Imboscata/Intervento.)*
2. **Conquista e Ultimo Desiderio** dipendono dall'esito. Forzarli fa scattare effetti "da vittoria" anche perdendo, e interagisce con Calibri −4 e Ratti −3. Mascarada −4 li esclude già (`excludeTriggers`). Consiglio di escluderli sempre dai "forza qualunque trigger".
3. **Overdrive forzato** risparmia anche l'obbligo di spendere 5 FC: vale più della tabella. Va prezzato a parte se mai usato.
4. **Effetti globali (simmetrici).** Un mattone che vale per entrambi i giocatori:
   - se l'abilità è **segreta** (rivelata al GENERAL): vale circa **50%** del valore unilaterale, perché solo tu sai in anticipo che sarà attivo e scegli la carta di conseguenza;
   - se è **pubblica prima della scelta degli Agenti** (PRE_AGENT o PRE_FIELD): vale circa **0–25%**, perché anche l'avversario si adatta.
5. **Più trigger sulla stessa carta** (Potere e Bonus): i valori si sommano. Il Bonus usa la tabella §3.7.

### 3.6 Campo, compreso Terraformare (nuovo)

#### 3.6.1 Terraformare

**Definizione di campagna** (`docs/DESIGN_CAMPAGNA.md` cap. 14): *Terraformare X: sostituisci il Campo corrente con X. Le regole del nuovo Campo si applicano da quel momento; le fasi già concluse non si ripetono.* Nei documenti di campagna Terraformare è un **effetto** (di Potere), non un trigger. Qui lo tratto come mattone di effetto.

Il Campo è **condiviso**, quindi Terraformare vale solo per il **vantaggio relativo** che crea tra te e l'avversario:

```
Valore(Terraformare X) = [Δ(X) − Δ(Campo corrente)] × fattore informazione × durata
Δ(campo) = effetto del Campo sul tuo lato − effetto sul lato avversario   (in FC)
```

**Δ di alcuni Campi abilitati a Terraformare** (ordine di grandezza):

| Campo | Effetto | Δ tipico per chi lo sceglie |
|---|---|---|
| Gran Corno (1) | +4 POT a entrambi | 4 × (tuoi FC − FC nemici) × 0.28: **fino a ±3 FC**, premia chi ha investito di più |
| Altopiano delle Tre Lune (2) | −1 POT, +1 DAN a entrambi | piccolo, circa ±0.3 |
| Arena degli Gnomi (3) | Poteri disattivati | Potere nemico − Potere tuo: circa ±1.2 |
| Nido dell'Antico (5) | −2 DAN a entrambi | favorisce chi si aspetta di perdere: circa ±0.7 |
| Tempio del Monaco Pazzo (6) | Bonus disattivati | Bonus nemico − Bonus tuo: circa ±0.8 |
| Torre del Richiamo (campagna) | Staffetta soddisfatta | vale come un trigger forzato per chi ha Staffetta |

**Fattore informazione:**

| Momento della scelta della destinazione | Fattore |
|---|---|
| Dopo il lock di Agenti e FC (parametro `AT_REVEAL`, effetto al GENERAL o durante il Duello) | 1.0: scegli conoscendo entrambi gli Agenti |
| Prima della scelta degli Agenti, in pubblico (PRE_FIELD / PRE_AGENT) | 0.5: l'avversario si adatta |
| Su uno slot futuro, pubblico, per il resto dello Scontro | 0.5 × numero di Duelli in cui conterà, con rendimento decrescente |

**Prezzi di partenza proposti** (per un Terraformare che agisce su questo Duello):

| Variante | Valore (FC) | Costo indicativo |
|---|---|---|
| Destinazione fissa (come G03: Torre del Richiamo) | circa 0.75 | −1 |
| Scelta tra 2 destinazioni, dopo il lock | circa 1.25 | −2 (un po' sotto budget) |
| Scelta tra 3 o più destinazioni, dopo il lock | circa 1.5–2.0 | −2 / −3 |
| Destinazione fissa pubblica, prima degli Agenti | circa 0.4 | 0 |

**Note di implementazione:**
- La primitiva `REPLACE_FIELD` delle Eminenze oggi agisce sul **tabellone a inizio round** e su **tutti gli slot aperti** (`src/game/eminence/fieldOperations.js`, usata dallo Statico di Apex). Un Terraformare **durante il Duello** richiede di collegare la logica di campagna in `src/game/duel/terraform.js`. È un lavoro di motore, non solo di dati.
- Le destinazioni devono restare nella lista validata `TERRAFORM_DESTINATIONS` (Torre, 1–9, 12, 24).

#### 3.6.2 Altri mattoni sul Campo

| Mattone | Valore (FC) | Primitiva | Note |
|---|---|---|---|
| Ignora il Campo (tuo Agente) | 0–1.5, media circa 0.5 〰️ | `IGNORE_FIELD` | vedi §3.4 |
| Maledizione di slot (persistente, simmetrica) | effetto per Duello × Duelli rimanenti × 25–50% | `APPLY_SLOT_MODIFIER` | simmetrica e pubblica: vale soprattutto se il tuo lato ne è immune o ne soffre meno |
| Sostituisci il Campo futuro (pubblico) | circa 0, salvo sinergia d'armata | `REPLACE_FIELD` | Apex Statico |
| Distruggi il Campo / nega la Conquista | **fuori scala** 〰️ | `DESTROY_FIELD`, `ARM_CONQUEST_OVERRIDE`, `SUPPRESS_CONQUEST` | tocca la condizione di vittoria (3 Campi nei round 1–4): va giudicato a parte, non in FC |

### 3.7 Bonus d'Armata di riferimento

Servono per i mattoni "rinuncia al Bonus", "blocca Bonus" e "rendi attivo il Bonus". Valori da `ANALISI_BILANCIAMENTO_CROSS_ARMATA.md` §1.2; per le tre armate assenti li ho stimati con la stessa formula.

| Armata | Bonus attuale (`armies.js`) | Valore medio | Valore con trigger attivo |
|---|---|---|---|
| Figli dell'Orizzonte | −5 VA nem. (min 6) | 0.77 | 0.77 |
| Kethran | Rimonta: +2 POT | 0.40 | 1.00 |
| Corte Rossa | Copia Bonus nemico | 0.80 | 0.80 |
| Calibri Pesanti | −2 DAN nem. (min 2) | 0.56 | 0.56 |
| Orathai | Resa dei conti: +2 DAN | 0.35 | 0.70 |
| Mounthborn | Imboscata: +1 POT, +1 DAN | 0.60 | 0.85 |
| Enclave delle Scaglie | Conquista: +2 FC | 0.84 | 1.40 |
| Ratti della Megera | Conquista: Tossina 1 (min 10) | 0.36 (la fonte riporta Tossina 2) | 0.60 |
| Patto degli Indocili | Rinforzi: −1 POT, −1 DAN nem. (min 2) | 0.41 | 0.68 |
| Khemet | Overdrive: Immune | circa 1.0 (stima) | 2.00 |
| Apex | Invasione: +5 VA | circa 0.7 (stima) | 1.40 |
| Mascarada | Opportunista: +2 FC | circa 0.7 (stima) | 1.40 |

---

## 4. Leve: cosa aggiunge identità e come cambia il prezzo

Un'abilità è **uno o più mattoni** più **una o più leve**. Ogni leva sposta il prezzo in modo prevedibile.

| Leva | Esempio | Effetto sul prezzo |
|---|---|---|
| **Condizione** | "se perdi", "se una Preda è schierata" | × probabilità della condizione. Per le condizioni già coperte dai trigger si usa la tabella `m` |
| **Costo alternativo** | perdi PV, rinunci al Bonus, perdi FC | si sottrae il valore del costo (§3) |
| **Bersaglio** | tuo, nemico, a scelta, entrambi | "a scelta" ≥ il migliore dei due; "entrambi" segue la regola dei simmetrici (§3.5.3, punto 4) |
| **Durata** | questo Duello oppure resto dello Scontro | × Duelli in cui l'effetto conterà davvero, con rendimento decrescente |
| **Informazione** | gate di reveal PRE_FIELD / PRE_AGENT | rivelare prima delle decisioni avversarie costa circa 25–50% del valore |
| **Parametri dopo il lock** | `choiceParamsTiming: AT_REVEAL` | vale di più: scegli il bersaglio conoscendo tutto |
| **Scaling sul tema** | "per ogni Frammento", "per ogni vittoria" | valore atteso sul numero tipico di unità |
| **Escalation** | Sacrificio, Guerra d'Attrito | va prezzato **a ogni uso**, non solo al primo |
| **Affare** (l'avversario sceglie) | Corte Rossa | vale l'opzione **peggiore per te**, perché l'avversario sceglie quella |

### 4.1 Come si costruisce un'abilità nuova

1. Scegli **il costo** (fascia) → leggi il **budget** (§1.2).
2. Scegli **uno o due mattoni** coerenti con l'identità dell'Eminenza.
3. Aggiungi **una leva** che la leghi al tema (condizione, bersaglio, scaling…).
4. Calcola il valore e regola i numeri finché lo scarto rientra nella tolleranza.
5. Segna 〰️ se dipende dalla carta schierata, e controlla il caso migliore (outlier) oltre a quello medio.

**Esempi su budget −2 (1.5 FC):**
- "+3 POT" → 1.50 ✅
- "+1 FC temporaneo, +1 DAN" → 1.35 ✅
- "Se perdi il Duello: 3 Danni diretti" → 1.50 × 0.5 = 0.75, quindi va portato a circa 5–6 Danni o spostato su −1
- "Terraformare: scegli tra 2 Campi, dopo il lock" → circa 1.25 ✅ (lieve sotto)
- "Il trigger Potere del tuo Agente è considerato soddisfatto" → 2.0 × 0.45 × 1.3 ≈ 1.2 ✅ (lieve sotto, 〰️)

---

## 5. Audit delle Eminenze

Per ogni Eminenza: Presenza iniziale (P₀), Statico con Presenza attesa per Scontro, poi ogni abilità attiva con costo, budget, stima, scarto e verdetto. Testi da `src/data/eminences.js`.

### 5.1 Apex — Il Sole Verde
**P₀ 3 (2.25 FC). Statico:** al round 5 lo slot aperto diventa il Meridiano del Sole Verde (tutti i Bonus diventano "Invasione: +2 POT, +1 DAN"). **0 Presenza per Scontro.** Effetto simmetrico e pubblico, valore netto circa 0. Apex scambia il proprio +5 VA (circa 1.4) con +2/+1 (circa 1.35).

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Furia | +1 | −0.75 | +0.10 | +0.85 | ⬆️ | +1 POT (0.50) − 2 PV (−0.40): dà valore *e* Presenza |
| Disprezzo | −2 | 1.50 | circa 0.5 (0–1.5) | −1.0 | ⬇️ 〰️ | vale solo sui Campi che penalizzano il tuo lato |
| Ora Verde | −4 | 3.00 | 1.45 | −1.55 | ⬇️⬇️ | +2 POT +2 DAN = 1.70, ma è un Potere: × 0.85 (P(blocco)) |

### 5.2 Patto degli Indocili — Il Grande Semaforo
**P₀ 0. Statico:** se nel Duello sono stati giocati almeno 8 FC in totale, +2 Presenza (ripetibile). Con circa 7.2 FC medi totali scatta spesso, soprattutto nei primi round: **circa 3.5 Presenza per Scontro (circa 2.6 FC).**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Verde | +1 | −0.75 | 0 | +0.75 | ⬆️ | non fa nulla: Presenza gratuita |
| Giallo | 0 | 0 | circa +0.3 | +0.3 | ✅ | forza Imboscata/Turbo globale e segreta |
| Rosso | −2 | 1.50 | circa 0.5 | −1.0 | ⬇️ | forza Intervento/UC e vieta Imboscata/Turbo, globale |

### 5.3 Mascarada — L'Organizzatore degli Incontri
**P₀ 1 (0.75 FC). Statico:** gli Agenti si scelgono e si rivelano prima del Campo. **0 Presenza per Scontro.** È una regola strutturale, non prezzata in FC.

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Scommessa | 0 | 0 | +0.9 / +1.2 | +1.0 | ⬆️ | 2 Presenza × p. Con pronostico "sconfitta" e un Duello lasciato andare apposta, p arriva a circa 0.8: linea degenere da controllare |
| Maschere Invertite | −2 | 1.50 | circa 0.4 | −1.1 | ⬇️⬇️ | alias **globale** (scope `GLOBAL` nel catalogo): aiuta anche l'avversario |
| Incontro Truccato | −4 | 3.00 | circa 1.5 (0.6–3.0) | −1.5 | ⬇️⬇️ 〰️ | forza trigger 2.0 × 0.45 × 1.3 ≈ 1.2 + non bloccabile 0.3 |

### 5.4 Kethran — L'Altare della Ricomposizione
**P₀ 2 (1.5 FC). Statico:** quando un tuo Agente perde → Frammento e +1 Presenza. **Circa 2.5 Presenza per Scontro (circa 1.9 FC).** È un meccanismo di recupero per chi perde.

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Sacrificio (1° uso) | +1 | −0.75 | +0.35 | +1.1 | ⬆️⬆️ | **nel codice dà +2 Presenza totali** (costo +1 più il segmento `CHANGE_PRESENCE` +1) per −2 PV |
| Sacrificio (2° uso) | +1 | −0.75 | +0.90 | +1.65 | ⬆️⬆️ | +3 Presenza per −3 PV; poi cresce ancora |
| Elogio al trionfo | −1 | 0.75 | circa 0.5 | −0.25 | ✅ | se vinci: Frammento più +1 Presenza dallo Statico |
| Innesto | −2 | 1.50 | circa 0.7 | −0.8 | ⬇️ | trigger alternativo, consuma il Frammento |

> ⚠️ **Da verificare:** il testo di Sacrificio dice "Perdi 2 PV e ottieni +1 Presenza" e l'abilità costa +1. Il catalogo applica sia il +1 di costo sia un +1 dal segmento. Va chiarito se la doppia Presenza è voluta.

### 5.5 Mounthborn — La Fame
**P₀ 1 (0.75 FC). Statico:** una Preda iniziale; quando viene schierata una Preda, il tuo Bonus è attivo (circa +0.26 per occorrenza). **0 Presenza per Scontro.**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Gorgoglio terrificante | 0 | 0 | circa 0.5 | +0.5 | ⬆️ (lieve) | rivelata PRE_AGENT: l'avversario evita la Preda (p circa 0.25), ma la negazione stessa ha valore |
| Frenesia della Fame | −2 | 1.50 | circa 0.5 | −1.0 | ⬇️ | Preda permanente + Potere/Bonus non bloccabili se c'è una Preda |
| Cannibalismo | −2 | 1.50 | circa 0.2 | −1.3 | ⬇️⬇️ | Cura 3 (0.6) × P(perdi contro una Preda) circa 0.3 |

### 5.6 Khemet — Il Castello dei Sigillatori
**P₀ 2 (1.5 FC). Statico:** Overdrive → +2 Presenza. Con circa 1.5 Overdrive per Scontro (gli FC temporanei contano): **circa 3 Presenza per Scontro (circa 2.25 FC).** Si somma al Bonus "Overdrive: Immune".

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Devozione al cervello | +2 | −1.50 | circa 0 (±0.5) | +1.5 | ⬆️⬆️ 〰️ | scambio dei trigger Potere/Bonus: spesso neutro, quindi +2 Presenza quasi gratis |
| Maledizione della Fama | −2 | 1.50 | circa 0.5 | −1.0 | ⬇️ 〰️ | persistente e simmetrica; colpisce di più le Leghe alte |
| Maledizione del Cosmo | −3 | 2.25 | circa 0.8 | −1.45 | ⬇️⬇️ 〰️ | simmetrica (−1/−1/−1 ≈ 1.13 per lato); asimmetrica solo quando Khemet è Immune |

### 5.7 Orathai — Il Primo Canto
**P₀ 1 (0.75 FC). Statico:** se entrambi gli Agenti soddisfano il trigger Potere, +1 Presenza. Con p circa 0.35: **circa 1.75 Presenza per Scontro (circa 1.3 FC).**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Tacet | 0 | 0 | +1.0 / +1.3 | +1.15 | ⬆️⬆️ | "se **uno dei due** non soddisfa": è il complemento esatto dello Statico. **Con Tacet ogni round dà almeno +1 Presenza** (+1 dallo Statico oppure +2 da Tacet). La prima stesura diceva "nessuno dei due" |
| Contrappunto | −2 | 1.50 | circa 0.8 | −0.7 | ⬇️ | immune ai Blocca + specchio sul trigger nemico |
| Silenzio | −3 | 2.25 | circa 2.0 se sei avanti in PV, negativa se indietro | −0.25 | ✅ 〰️ | trasforma entrambi i trigger in Magnanimo |

### 5.8 Corte Rossa — Sanguinaccio, il Registro
**P₀ 1 (0.75 FC). Statico:** +1 Presenza per **ogni evento** di perdita PV non dovuto al DAN, per **qualunque giocatore** (Tossina, danni diretti, costi, Affari). Quasi tutte le sue abilità lo alimentano: **circa 4–5 Presenza per Scontro (circa 3.4 FC).** Non può ripetere la stessa abilità due volte di fila.

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Accordo Unilaterale | 0 | 0 | ≥ +0.75 | +0.75 | ⬆️ | se accetta: +1.0 danno, −1.0 (FC temporaneo al nemico), +0.75 dallo Statico; se rifiuta: +1.35 |
| Debito | +1 | −0.75 | circa +1.15 | +1.9 | ⬆️⬆️ | su un proprio Agente: trigger forzato (0.8) − 2 PV (−0.4) + Statico (+0.75) **a ogni schieramento** |
| Salasso | −2 | 1.50 | circa +0.75 | −0.75 | ⬇️ | l'avversario sceglie "−3 PV, +2 Presenza" (gli conviene): **regala Presenza all'avversario** |
| Brutto Affare | −4 | 3.00 | circa 1.4 | −1.6 | ⬇️⬇️ | sul proprio Agente: +2 FC temporanei (2.0), −3 PV circa a fine Scontro (−0.6) |

### 5.9 Figli dell'Orizzonte — La Domanda Senza Fine
**P₀ 2 (1.5 FC). Statico:** Ancorato (FC reali ≥ 6 − Lega + aumenti) → +1 Presenza. Circa 65% dei Duelli: **circa 3 Presenza per Scontro (circa 2.25 FC)**, in calo con Deriva.

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Deriva | +1 | −0.75 | circa −0.5 | +0.25 | ✅ | costa Presenza futura e rende Leggerezza/Risposta più difficili; più cara se presa presto |
| Leggerezza | −2 | 1.50 | circa 1.0 | −0.5 | ⬇️ (lieve) | trigger forzato, condizionato ad Ancorato (che controlli) |
| Risposta | −3 | 2.25 | circa 1.4 | −0.85 | ⬇️ | Immune (2.0) × P(Ancorato) circa 0.7; timing "all'inizio dello **Scontro**" ancora da chiarire |

### 5.10 Ratti della Megera — Bella Malelabbra
**P₀ 1 (0.75 FC). Statico:** schieri l'Agente con la Lega più bassa tra quelli in mano (la parità vale) → +1 Presenza. È controllabile, al prezzo di giocare dal basso: **circa 4 Presenza per Scontro (circa 3 FC).**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Sussurro | 0 | 0 | circa 0.4 | +0.4 | ✅ | p di riduzione circa 0.5, più alta contro Calibri/Patto |
| Veleno | −2 | 1.50 | circa 0.0–0.35 | −1.3 | ⬇️⬇️ | blocca il proprio Bonus (−0.36) + Tossina 1 (+0.35) |
| Spezzacuore | −3 | 2.25 | 0.2 / 1.2 / 2.2 (Tossina 1/2/3) | −1.0 circa | ⬇️ 〰️ | 2X danni come Bonus (bloccabile), meno il Bonus perso e i tick futuri |

### 5.11 L'Enclave delle Scaglie — L'Enclave dell'Ascensione
**P₀ 1 (0.75 FC). Statico:** investi almeno 3 FC reali → +1 Presenza. Circa 60% dei Duelli: **circa 3 Presenza per Scontro (circa 2.25 FC).**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Rinuncia al Privilegio | +1 | −0.75 | −0.84 | −0.09 | ✅ | perde il Bonus "Conquista: +2 FC" |
| Ascesa / Declassamento | −1 | 0.75 | circa 0.6 | −0.15 | ✅ | pubblica (PRE_AGENT); cambia Sfida/Sopraffare/Alleato/Rinforzi |
| Ascensione | −3 | 2.25 | circa 0.85 | −1.4 | ⬇️⬇️ | Leghe pari circa 25–30% dei casi; parità di VA rara |

### 5.12 Calibri Pesanti — Il Comando dei Quattro Fronti
**P₀ 2 (1.5 FC). Statico:** DAN finale nemico ≤ 2 → +1 Presenza. Il proprio Bonus (−2 DAN nem., min 2, sempre attivo) porta a 2 ogni DAN ≤ 4: scatta circa l'85% delle volte. **Circa 4 Presenza per Scontro (circa 3.2 FC).** È il generatore più forte del roster.

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Guerra d'Attrito (0 vittorie) | 0 | 0 | 0.70–1.00 | +0.85 | ⬆️ | +1 FC in riserva gratis finché perdi (recupero, probabilmente voluto) |
| Guerra d'Attrito (1 vittoria) | −1 | 0.75 | 0.45–0.75 | −0.1 | ✅ | |
| Guerra d'Attrito (2+ vittorie) | −2 o più | 1.50 o più | ≤ 0.75 | ≤ −0.75 | ⬇️ | |
| Protocollo di Contenimento | −2 | 1.50 | circa 1.0 | −0.5 | ⬇️ (lieve) | danno garantito ceil(DAN/2) al posto del DAN solo in vittoria (+0.25), +2 Presenza se vinci (+0.75) |
| Protocollo Terra Bruciata | −4 | 3.00 | fuori scala | — | 〰️ | nega una Conquista: nei round 1–4 può impedire la terza, cioè la vittoria. Da giudicare in playtest |

### 5.13 Appendice — Concordia (solo campagna): Le Campane del Vallo
**P₀ 1 (0.75 FC). Statico:** se hai scelto l'Agente per secondo, +1 Presenza a fine round. **Circa 2.5 Presenza per Scontro (circa 1.9 FC).**

| Abilità | Costo | Budget | Stima | Scarto | Verdetto | Nota |
|---|---|---|---|---|---|---|
| Serrate le porte | +1 | −0.75 | circa −0.1 | +0.65 | ⬆️ | −1 POT proprio (min 1) contro −1 DAN nemico (min 1) |
| Alla seconda campana | −2 | 1.50 | circa 1.0 | −0.5 | ⬇️ (lieve) | forza Intervento/Resistenza su Potere e Bonus, copertura alta |
| Sortita del Vallo | −4 | 3.00 | 1.70 | −1.3 | ⬇️⬇️ | +2 POT, +2 DAN diretti (non bloccabili) |

---

## 6. Sintesi dell'audit

### 6.1 Motore di Presenza (P₀ + Statico)

| Eminenza | P₀ (FC) | Statico (Presenza/Scontro → FC) | Motore totale (FC) | Rispetto alla fascia 2–3 |
|---|---|---|---|---|
| Calibri Pesanti | 1.50 | circa 4 → 3.0 | **circa 4.5** | ⬆️⬆️ |
| Corte Rossa | 0.75 | circa 4.5 → 3.4 | **circa 4.1** | ⬆️⬆️ |
| Khemet | 1.50 | circa 3 → 2.25 | circa 3.75 | ⬆️ |
| Figli dell'Orizzonte | 1.50 | circa 3 → 2.25 | circa 3.75 | ⬆️ |
| Ratti della Megera | 0.75 | circa 4 → 3.0 | circa 3.75 | ⬆️ |
| Kethran | 1.50 | circa 2.5 → 1.9 | circa 3.4 (+ Sacrificio) | ⬆️ |
| Enclave delle Scaglie | 0.75 | circa 3 → 2.25 | circa 3.0 | ✅ |
| Patto degli Indocili | 0 | circa 3.5 → 2.6 | circa 2.6 | ✅ |
| Apex | 2.25 | 0 | circa 2.25 | ✅ |
| Orathai | 0.75 | circa 1.75 → 1.3 | circa 2.05 (+ Tacet) | ✅ (⬆️ con Tacet) |
| Mascarada | 0.75 | 0 | **circa 0.75** | ⬇️⬇️ |
| Mounthborn | 0.75 | 0 | **circa 0.75** | ⬇️⬇️ |

### 6.2 Conteggio dei verdetti sulle abilità attive (12 Eminenze, 37 abilità; Concordia esclusa)

Guerra d'Attrito è contata nella fascia del suo costo base (0).

- **Ricariche (+1/+2) e abilità a costo 0:** 10 su 14 sono generose (⬆️/⬆️⬆️). Spesso danno Presenza *e* valore.
- **Fascia −1/−2:** 2 su 14 in fascia (Elogio, Ascesa); le altre 12 sono deboli.
- **Fascia −3/−4:** 7 su 9 sono deboli, 1 è fuori scala (Terra Bruciata). Solo Silenzio (Orathai) rientra.

### 6.3 Diagnosi

Il problema principale è **strutturale**, non di singoli numeri:

1. **La Presenza si genera troppo facilmente** (Statici forti, ricariche gratuite)…
2. **…e compra troppo poco** (quasi tutte le −3/−4 valgono la metà del budget).

Il risultato è che il valore reale delle Eminenze arriva oggi soprattutto dalle **ricariche gratuite** e dagli Statici, non dalle abilità di spesa. Due Eminenze (Mascarada, Mounthborn) non hanno quasi motore.

### 6.4 Priorità d'intervento proposte

| # | Intervento | Eminenze |
|---|---|---|
| 1 | Dare un costo reale alle ricariche gratuite | Patto Verde, Khemet Devozione, Apex Furia, Kethran Sacrificio, Corte Debito |
| 2 | Rendere costoso il complemento Statico/Tacet | Orathai Tacet |
| 3 | Ridurre gli Statici oltre 3.5 Presenza per Scontro | Calibri, Corte Rossa (Ratti, Khemet, Figli in seconda battuta) |
| 4 | Dare un motore a chi non ne ha | Mascarada, Mounthborn (Statico o P₀) |
| 5 | Portare a budget le −3/−4 (alzare i numeri o abbassare i costi) | Apex Ora Verde, Corte Brutto Affare, Enclave Ascensione, Khemet Cosmo, Mascarada Incontro Truccato |
| 6 | Correggere le abilità che aiutano l'avversario | Mascarada Maschere (globale), Corte Salasso (regala Presenza) |
| 7 | Rendere significative le −2 molto deboli | Mounthborn Cannibalismo, Ratti Veleno |

---

## 7. Cosa non cattura questa scala

Come per le carte (`ANALISI_BILANCIAMENTO_CROSS_ARMATA.md` §1.3), la scala non misura: bluff e lettura della scelta segreta, informazione pubblica della Presenza accumulata, sinergie specifiche con il mazzo, effetti sulla condizione di vittoria (Conquista dei 3 Campi, Supremazia al round 5) e varianza della pesca. Questi fattori vanno valutati in playtest.

---

## 8. Validazione proposta

Per ogni Scontro di playtest registrare (in linea con `SATZE_EMINENZE_AUDIT_v1.md` §6 e `TELEMETRIA_PLAYTEST.md`):

1. Presenza generata dallo Statico per round (verifica delle stime §6.1);
2. abilità scelta per round e Presenza spesa;
3. frequenza di Blocca Potere (per sostituire P(blocco) = 0.15);
4. frequenza di Overdrive, Ancorato, investimento ≥ 3 FC, DAN nemico ≤ 2;
5. esito del Duello nei round con abilità −3/−4.

---

## 9. Punti aperti

| # | Questione | Stato |
|---|---|---|
| 1 | **Struttura delle Eminenze:** i mattoni sono un insieme comune da cui tutte pescano, oppure ogni Eminenza ha uno schema fisso (Statico + ricarica + base + firma)? | da decidere |
| 2 | **Valore del PV:** unificare 0.50 (danno dato) e 0.20 (costo/cura) in un valore unico per le Eminenze, oppure tenerli separati? Dal round 5 vince chi ha più PV. | da decidere |
| 3 | **Cura:** resta 0.20 come per le carte o si alza (legato al punto 2)? | da decidere |
| 4 | **Sovrapprezzo sulle fasce alte:** budget lineare (attuale) oppure extra per −3/−4, visto che accumulare Presenza è pubblico e costa round? | lineare per ora |
| 5 | **Fascia del motore:** confermare 1.5–2.5 Presenza per Scontro dallo Statico e 2–3 FC di motore totale. | proposta |
| 6 | **Potere di riferimento:** ricalcolare V = 2.0 e i valori dei Bonus sul catalogo attuale a 12 armate. | da fare |
| 7 | **P(blocco) e fattore di selezione ×1.3:** sostituire le stime con dati di telemetria. | da misurare |
| 8 | **Kethran Sacrificio:** la doppia Presenza del catalogo è voluta? | da verificare |
| 9 | **Terraformare per le Eminenze:** serve collegare `src/game/duel/terraform.js` al motore delle Eminenze per l'uso durante il Duello. | lavoro di motore |
| 10 | **Staffetta:** stimare `m` per inserirla nella tabella §3.5.2. | da fare |

---

## 10. Decisioni e rework approvati

### 10.1 Decisioni generali (10 novembre 2026)

- **Struttura:** schema comune — Statico (1.5–2.5 Presenza/Scontro), ricarica +1, abilità base −2, firma −3/−4 — con eccezioni ammesse quando servono all'identità.
- **Valore del PV per le Eminenze:** 0.5 FC in ogni direzione (danno inflitto, PV persi come costo, Cura). La Cura conta solo sui PV effettivamente mancanti. La tabella delle carte resta invariata. Questo valore sostituisce quello usato nell'audit §3.3 e §5 (ricalcolato nella versione HTML della pagina).
- **Ordine del rework:** ordine delle armate di `src/data/armies.js`.

### 10.2 Figli dell'Orizzonte — La Domanda Senza Fine (approvata)

**Presenza iniziale:** 1 (era 2). **Eccezione allo schema:** 4 abilità attive.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Ancorato *(invariato)* | Un Agente è Ancorato se ha investito almeno 6 − Lega effettiva + aumenti cumulativi del requisito. Ai fini di Ancorato contano gli FC reali investiti; gli FC temporanei non contano. Alla fine del Duello, se il tuo Agente era Ancorato, +1 Presenza. | — | circa 3 Presenza/Scontro |
| +1 | Deriva *(invariata)* | Aumenta di 1 il requisito di Ancorato, cumulativamente per il resto dello Scontro, già da questo round. | −0.75 | circa −0.5 ✅ |
| −1 | Condensazione | Se il tuo Agente schierato è Ancorato, riceve 1 FC temporaneo in questo Duello. Gli FC temporanei non contano per Ancorato. | 0.75 | circa 0.8 ✅ |
| −2 | La Domanda si diffonde | **Reveal: prima della scelta degli Agenti.** In questo Duello, il Potere dell'Agente nemico si attiva solo se è Ancorato. Per l'Agente nemico vale il tuo requisito di Ancorato, aumenti di Deriva compresi. | 1.50 | 0.4 / 0.75 / 1.1 / 1.4 con 0 / 1 / 2 / 3+ Derive |
| −4 | Risposta | Se il tuo Agente schierato è Ancorato, è Immune e il suo trigger Potere è considerato soddisfatto. | 3.00 | circa 2.7 ✅ |

**Motore:** 0.75 + circa 2.25 = circa 3.0 FC (limite alto della fascia).

**Lavoro di implementazione:**
- La Domanda si diffonde richiede il controllo di Ancorato anche per il lato avversario.
- Serve un'interfaccia che mostri all'avversario la soglia di Ancorato del proprio Agente mentre sceglie Agente e FC.

### 10.3 Kethran — L'Altare della Ricomposizione (approvata)

**Presenza iniziale:** 1 (era 2). **Eccezione allo schema:** 4 abilità attive, firma a −3.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Ricomposizione | Quando il tuo Agente perde un Duello, diventa un Frammento per il resto dello Scontro. Quando ottieni un Frammento, +1 Presenza. I Frammenti non vengono consumati. | — | circa 2.5 Presenza/Scontro |
| +1 | Sacrificio | Perdi 2 PV. | −0.75 | −1.0 ✅ (perdere PV aiuta Rimonta) |
| −1 | Elogio al trionfo *(invariato)* | Se il tuo Agente schierato vince il Duello, diventa un Frammento per il resto dello Scontro. | 0.75 | circa 0.5 ✅ |
| −2 | Innesto | Selezionabile solo se hai almeno 1 Frammento. Scegli un tuo Frammento: in questo Duello il suo Potere, con il suo trigger e il suo effetto, sostituisce a tua scelta il Potere oppure il Bonus del tuo Agente schierato. Se sostituisce il Bonus, è trattato come Bonus. | 1.50 | circa 1.0–1.4 ✅ 〰️ |
| −3 | Opera Composita | Selezionabile solo se hai almeno 2 Frammenti. Scegli due tuoi Frammenti: in questo Duello il Potere del tuo Agente schierato è sostituito da un Potere composto dal trigger di uno e dall'effetto dell'altro. | 2.25 | circa 2.0–2.5 ✅ 〰️ |

**Motore:** 0.75 + circa 1.9 = circa 2.65 FC.

**Lavoro di implementazione:**
- Sacrificio: togliere il segmento di Presenza e l'escalation.
- Frammenti: togliere il consumo da Innesto.
- Innesto nel Bonus: usare l'override del Bonus (come Ratti Spezzacuore).
- Innesto nel Potere e Opera Composita: usare la composizione da Frammenti (`src/game/eminence/composeAbilityParams.js`).
- Condizioni di selezionabilità: almeno 1 / 2 Frammenti.

### 10.4 Corte Rossa — Sanguinaccio, il Registro (approvata)

**Presenza iniziale:** 0 (era 1). **Eccezione allo schema:** tutte le abilità sono Offerte; 4 attive, nessuna a −2.

**Regola di design aggiunta alla scala (vale per tutte le Eminenze):** una ricarica (+1) non può infliggere danni all'avversario. Un danno che si ripete e a cui l'avversario non può opporsi va prezzato sull'accumulo, non sul singolo uso.

**Statico — Il Registro**
> Ogni abilità della Corte è un'Offerta all'avversario. L'Offerta viene rivelata all'inizio del round, subito dopo la scelta delle Eminenze e prima di ogni altra decisione, e l'avversario la accetta o la rifiuta. Se ha rifiutato l'Offerta del round precedente, deve accettare. Quando l'avversario accetta un'Offerta, +1 Presenza.
> I PV che l'avversario deve pagare alla Fine dello Scontro sono scritti nel suo Registro, una voce per ogni Offerta, e si pagano prima di determinare il vincitore.

| Slot | Nome | Offerta | Budget | Stima (se accettata) |
|---|---|---|---|---|
| +1 | Prestito | «Il tuo Agente riceve 2 FC temporanei in questo Duello; alla Fine dello Scontro perdi 2 PV.» | −0.75 | circa −0.55 ✅ |
| 0 | Rinforzo | «Il tuo Agente ottiene +2 DAN oppure +1 POT in questo Duello, a tua scelta; alla Fine dello Scontro perdi 1 PV.» | 0 | circa +0.35 ✅ |
| −1 | Debito | «Il trigger Potere del tuo Agente diventa Debito 2 in questo Duello.» | 0.75 | circa 0.85 ✅ 〰️ |
| −3 | Interessi | «Gli interessi maturano: ogni voce del tuo Registro aumenta di 2 PV.» | 2.25 | 1.45 / 2.15 / 2.85 con 1 / 2 / 3 voci ✅ 〰️ |

**Glossario (da aggiungere a `GLOSSARIO.md`) — Debito X:** il Potere si attiva senza bisogno del trigger; quando si attiva, chi lo controlla perde X PV. Se il Potere è bloccato, non si attiva e non si paga.

**Motore:** circa 3.5 firme a Scontro → circa 2.6 FC.

**Lavoro di implementazione:**
- Reveal dell'Offerta al primo gate del round (`PRE_FIELD`, oppure `PRE_AGENT` con lo Statico di Mascarada): nessun gate nuovo.
- Offerta accetta/rifiuta con blocco del secondo rifiuto consecutivo.
- Parola chiave Debito X.
- Registro: voci di debito di Fine Scontro, pagate prima della determinazione del vincitore.
- Interfaccia: Registro visibile a entrambi (voci e totale) e indicatore "rifiuto disponibile".

### 10.5 Calibri Pesanti — Il Comando dei Quattro Fronti (approvata)

**Presenza iniziale:** 1 (era 2). **Eccezione allo schema:** 4 abilità attive.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Tenere la Linea | Quando perdi un Duello, se il DAN nemico ti ha tolto 2 PV o meno, +1 Presenza. | — | circa 2.1 Presenza/Scontro |
| +1 | Fermo Macchine | Il Potere del tuo Agente non si attiva in questo Duello. | −0.75 | circa −1.1 ✅ |
| −1 | Guerra d'Attrito | Ottieni 1 FC. Se hai vinto meno Duelli dell'avversario, ottieni invece 2 FC. | 0.75 | circa 1.0 ✅ |
| −2 | Logoramento | Il tuo Agente ottiene +3 VA per ogni Duello che hai perso in questo Scontro. | 1.50 | circa 1.3 ✅ 〰️ (0.85 / 1.7 / 2.5 con 1 / 2 / 3 persi) |
| −4 | Protocollo Terra Bruciata | Se perdi il Duello, il Campo corrente viene distrutto: nessun giocatore lo conquista e nessun effetto Conquista si attiva. Il DAN della vittoria viene inflitto normalmente. Un Campo distrutto non conta per nessuno ai fini della vittoria territoriale. | 3.00 | fuori scala 〰️ |

**Motore:** 0.75 + circa 1.6 = circa 2.35 FC.

**Lavoro di implementazione:**
- Statico: condizione "sconfitta con PV persi per DAN ≤ 2".
- Fermo Macchine: blocco del proprio Potere.
- Guerra d'Attrito: costo fisso, quantità condizionata alle vittorie.
- Logoramento: bonus di VA scalato sui Duelli persi.
- Terra Bruciata: Campo distrutto escluso dal conteggio della vittoria territoriale.

### 10.6 Orathai — Il Primo Canto (approvata)

**Presenza iniziale:** 1. **Eccezione allo schema:** 4 abilità attive.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Risonanza *(invariato)* | Se entrambi gli Agenti soddisfano il requisito di attivazione del proprio Potere nello stesso Duello, +1 Presenza. | — | circa 1.75 Presenza/Scontro |
| +1 | Il Prezzo del Canto | In questo Duello, per ogni Potere che si attiva, tuo o nemico, perdi 1 PV. | −0.75 | circa −0.55 ✅ |
| −1 | Contrappunto | Se il trigger Potere del tuo Agente non è soddisfatto, non lo è nemmeno quello dell'Agente nemico. | 0.75 | circa 0.75 ✅ |
| −2 | Eco | In questo Duello, se il Potere dell'Agente nemico si attiva, si attiva anche per il tuo Agente. | 1.50 | circa 1.1 ✅ (al limite) 〰️ |
| −3 | Silenzio *(invariata)* | Il trigger Potere di entrambi gli Agenti schierati diventa Magnanimo. | 2.25 | circa 2.0 se in vantaggio di PV ✅ 〰️ |

**Motore:** 0.75 + circa 1.3 = circa 2.05 FC.

**Lavoro di implementazione:**
- Tolta Tacet.
- Il Prezzo del Canto: perdita di PV per ogni Potere attivato nel Duello.
- Contrappunto: solo lo specchio, senza immunità ai Blocca.
- Eco: Copia Potere condizionata all'attivazione del Potere nemico.

### 10.7 Mounthborn — La Fame (approvata)

**Presenza iniziale:** 1. **Eccezione allo schema:** 4 abilità attive.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Istinto Predatorio | All'inizio dello Scontro scegli un Agente nemico: diventa Preda. Quando l'avversario schiera una Preda, +1 Presenza e il Bonus del tuo Agente schierato è considerato attivo. Una Preda smette di esserlo dopo aver combattuto. | — | circa 2.5 Presenza/Scontro |
| +1 | Fame | Alla fine del Duello, se non hai sconfitto una Preda, perdi 2 PV. | −0.75 | circa −0.85 ✅ |
| −1 | Gorgoglio | **Reveal: prima degli Agenti.** Scegli un Agente nemico non schierato: diventa Preda. | 0.75 | circa 1.0 ✅ |
| −2 | Frenesia della Fame | In questo Duello, il Potere del tuo Agente diventa «Imboscata: +1 POT, +1 DAN». Se l'Agente nemico è una Preda, recuperi la Presenza spesa per questa abilità. | 1.50 (circa 1.05 col rimborso) | circa 0.85 ✅ |
| −3 | Caccia | **Reveal: prima degli Agenti.** Scegli un Agente nemico non schierato: diventa Preda e l'avversario deve schierarlo in questo Duello. | 2.25 | circa 2.5 ✅ 〰️ |

**Motore:** 0.75 + circa 1.9 = circa 2.65 FC.

**Lavoro di implementazione:**
- Statico: +1 Presenza alla schierata di una Preda; tolta la regola su Turbo.
- Fame: perdita di PV condizionata alla mancata sconfitta di una Preda.
- Frenesia: sostituzione del Potere (come Opera Composita) e rimborso di 2 Presenza se l'Agente nemico è una Preda.
- Caccia: obbligo di schierare una carta precisa; selezionabile solo con un bersaglio valido.
- Tolte Cannibalismo e la vecchia Frenesia.

### 10.8 L'Enclave delle Scaglie — L'Enclave dell'Ascensione (approvata)

**Presenza iniziale:** 1. **Eccezione allo schema:** 4 abilità attive, firma a costo variabile.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Accumulo *(invariato)* | Quando investi almeno 3 FC reali sul tuo Agente in un Duello, +1 Presenza. Gli FC temporanei non contano. | — | circa 3 Presenza/Scontro |
| +1 | Rinuncia al Privilegio *(invariata)* | Il Bonus d'Armata del tuo Agente schierato è bloccato in questo Duello. | −0.75 | circa −0.84 ✅ |
| −1 | Ascesa / Declassamento *(invariata)* | **Reveal: prima degli Agenti.** Scegli pubblicamente un tuo Agente non schierato e aumenta oppure diminuisci la sua Lega di 1 per questo round. | 0.75 | circa 0.6 ✅ |
| −2 | Furto di Reliquie | Se vinci il Duello, l'avversario perde 2 Presenza e tu ne ottieni 1. | 1.50 | circa 1.35 ✅ (se l'avversario ha almeno 2 Presenza) |
| −X | Ascensione | Selezionabile solo con almeno 3 Presenza. Spendi tutta la tua Presenza: il tuo Agente ottiene +1 POT per ogni Presenza spesa. | 0.75 × X | circa 0.75 × X ✅ |

**Motore:** 0.75 + circa 2.25 = circa 3.0 FC (limite alto).

**Da osservare in playtest:** quanto spesso Ascensione al round 5 decide la partita; impatto di Furto di Reliquie sulle Eminenze che accumulano Presenza.

**Lavoro di implementazione:**
- Furto di Reliquie: trasferimento di Presenza condizionato alla vittoria.
- Ascensione: costo variabile (tutta la Presenza, minimo 3) e bonus di POT pari alla Presenza spesa.

### 10.9 Ratti della Megera — Bella Malelabbra (approvata)

**Presenza iniziale:** 1. **Eccezione allo schema:** 3 abilità attive, base a −1. La Tossina resta solo nel Bonus d'Armata.

**Chiarimento di regola usato per il rework:** gli Agenti restano sempre in mano; un Agente già usato non può essere schierato di nuovo.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Male Crescente *(invariato)* | Quando schieri un Agente con la Lega effettiva più bassa tra quelli che non hai ancora usato, +1 Presenza. In caso di parità, la condizione è soddisfatta. | — | fino a 5 Presenza/Scontro (l'ordine crescente costa Duelli) |
| +1 | Corteggiamento | **Reveal: a inizio round.** In questo Duello l'avversario sceglie se essere il primo o il secondo a scegliere l'Agente. | −0.75 | circa −0.75 ✅ |
| −1 | Seduzione | **Reveal: prima degli Agenti.** Scegli un Agente dell'avversario non ancora utilizzato: se non è l'unico disponibile, non può usarlo in questo Duello. | 0.75 | circa 0.75 ✅ |
| −3 | Vendetta oltre la Morte | **Si rivela quando schieri l'Agente.** Scegli un tuo Agente che è stato sconfitto: in questo Duello puoi usarlo di nuovo. | 2.25 | circa 2.0 ✅ 〰️ |

**Motore:** 0.75 + 2.25–3.75 = circa 3.0–4.5 FC. **Da osservare in playtest:** Presenza reale generata da Male Crescente.

**Lavoro di implementazione:**
- Tolte Sussurro, Veleno e Spezzacuore.
- Corteggiamento: l'avversario sceglie la propria posizione (primo o secondo) per un singolo round; reveal a inizio round. *(Aggiornato l'11 novembre 2026: sostituisce il Dono della Megera, che coincideva con Vendere il Colpo di Mascarada.)*
- Seduzione: divieto di usare un Agente preciso per un Duello, se non è l'unico disponibile.
- Vendetta: permettere di schierare un Agente già usato e sconfitto; reveal al momento dello schieramento.

### 10.10 Patto degli Indocili — Il Grande Semaforo (approvata)

**Presenza iniziale:** 0. **Eccezione allo schema:** 3 abilità attive, nessuna ricarica a +1, nessuna firma −3/−4 (la firma è il Semaforo stesso).

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Multa per eccesso di Caos *(invariato)* | Se alla fine del Duello sono stati giocati almeno 8 FC, +2 Presenza. | — | circa 3.5 Presenza/Scontro |
| 0 | Verde | Se in questo Duello un Agente attiva un Potere o un Bonus con trigger Turbo o Intervento, +1 Presenza (una sola volta per Duello). | 0 | circa +0.5 (lieve ⬆️) |
| −2 | Giallo | Imboscata e Turbo sono considerati soddisfatti in questo round, per entrambi i giocatori. | 1.50 | circa 1.6 ✅ 〰️ |
| −2 | Rosso *(invariato)* | Imboscata e Turbo non possono attivarsi. Intervento e Ultima Chance sono considerati soddisfatti in questo round, per entrambi i giocatori. | 1.50 | circa 1.6–2.0 ✅ 〰️ |

**Motore:** circa 3.0 FC (limite alto). **Da osservare in playtest:** Multa alimentata dal Patto stesso; frequenza di Verde.

**Lavoro di implementazione:**
- Verde: +1 Presenza (max una per Duello) se si attiva un Potere o Bonus con trigger Turbo o Intervento.
- Giallo: costo da 0 a −2.

### 10.11 Khemet — Il Castello degli Arcanisti Nefasti (approvata, nuovo nome)

**Nome:** era "Il Castello dei Sigillatori". **Presenza iniziale:** 1 (era 2). **Eccezione allo schema:** 4 abilità attive, nessuna ricarica a +1. **Reveal delle attive:** prima del Campo.

**Chiarimento di regola usato per il rework:** il Campo lo sceglie chi sceglie per primo nel round; ogni slot si combatte una sola volta, quindi una Maledizione su uno slot riguarda un solo Duello (quello combattuto lì) e resta finché lo slot non viene combattuto, anche se il Campo nello slot viene sostituito.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Cattura-Energia *(invariato)* | Quando il tuo Agente attiva Overdrive, +2 Presenza. | — | circa 3 Presenza/Scontro |
| 0 | Devozione al cervello *(era +2)* | Il tuo Agente schierato inverte il trigger del suo Potere con quello del suo Bonus. | 0 | circa 0–0.3 ✅ |
| −1 | Maledizione della Fama *(era −2)* | Scegli uno slot: gli Agenti che combatteranno lì subiscono −VA pari alla propria Lega. | 0.75 | circa 0.8 ✅ 〰️ |
| −2 | Maledizione del Cosmo *(era −3)* | Scegli uno slot: gli Agenti che combatteranno lì subiscono −1 POT, −1 DAN, −1 VA. | 1.50 | circa 1.1 ✅ (al limite) 〰️ |
| −3 | Maledizione Inversa | Scegli uno slot: nel Duello combattuto lì, tutti i modificatori di POT, DAN e VA si invertono, per entrambi gli Agenti. I + diventano −, i − diventano +, e i minimi non si applicano. | 2.25 | circa 1.5–2.5 ✅ 〰️ |

**Regole di Maledizione Inversa:** non si invertono FC, Danni diretti, Cura, Tossina, Blocca, Immune, Copia; Immune ignora le riduzioni prodotte dall'inversione; una carta con Inversione sullo stesso slot non inverte di nuovo. Fama o Cosmo sullo stesso slot, invertite, diventano un vantaggio per entrambi.

**Motore:** 0.75 + circa 2.25 = circa 3.0 FC (limite alto).

**Lavoro di implementazione:**
- Rinomina dell'Eminenza.
- Costi aggiornati di Devozione, Fama, Cosmo.
- Maledizione Inversa: estendere `src/game/duel/duelInversionFinalization.js` a tutti i modificatori di POT/DAN/VA, per entrambi i lati, nello slot maledetto.

### 10.12 Apex — Il Sole Verde (approvata)

**Presenza iniziale:** 1 (era 3). **3 abilità attive.**

**Principio di design emerso (vale per tutto il rework):** un'Eminenza deve aggiungere scelte e interazioni nuove; i potenziamenti di statistiche come effetto principale vanno evitati perché accorciano la strada verso la vittoria senza ampliare il gioco. **Correzione di valore:** per le Eminenze +1 POT vale circa 0.75 (il giocatore lo conosce prima di investire gli FC), non 0.50.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Cataclisma Verde | All'inizio del round 5, lo slot aperto subisce Terraformare: Arena del Violento Gaudio. Quando il tuo Bonus d'Armata si attiva, +1 Presenza. | — | circa 3 Presenza/Scontro |
| +1 | Cielo Smeraldino | In questo Duello il tuo Agente schierato ha −1 DAN. | −0.75 | circa −0.35 ✅ (al limite) |
| −2 | Disprezzo *(originale)* | Il tuo Agente schierato ignora gli effetti del Campo in questo Duello. | 1.50 | circa 1.5–2.0 quando usato contro Campi pesanti ✅ 〰️ |
| −3 | Preghiera Ululata | Per il resto dello Scontro, il tuo Bonus d'Armata diventa «Invasione: Attrizione 3 VA». | 2.25 | circa 2.0–2.5 ✅ 〰️ |

**Nuovo Campo richiesto — «Arena del Violento Gaudio»:**
- id: nuovo (il catalogo arriva oggi a 121);
- tema: Apex;
- effetto: «In scontro · Entrambi · +2 POT, +2 DAN»;
- esclusivo del Cataclisma Verde: non entra nella pesca casuale dei Campi;
- il Meridiano del Sole Verde (id 89) resta invariato nel catalogo.

**Lavoro di implementazione:**
- Aggiungere il Campo a `Documentazione/CAMPI_MASTER.md` e rigenerare `src/data/battlefieldsData.js` con `scripts/gen-battlefields-data.mjs`; escluderlo dalla pesca casuale.
- Statico: `REPLACE_FIELD` verso il nuovo id al round 5; +1 Presenza all'attivazione del Bonus.
- Preghiera Ululata: override permanente del Bonus con Attrizione su VA (`assaultValue`, già supportata).
- Tolte Furia e Ora Verde (abilità).

### 10.13 Mascarada — L'Organizzatore degli Incontri (approvata)

**Presenza iniziale:** 1. **Eccezione allo schema:** 4 abilità attive.

| Slot | Nome | Testo | Budget | Stima |
|---|---|---|---|---|
| Statico | Organizzazione Impeccabile | Gli Agenti vengono scelti e resi noti prima della scelta del Campo. Il pubblico ama le rivalità: quando un Agente attiva un Potere con trigger Gloria o Vendetta, +1 Presenza (una sola volta per Duello). | — | circa 2.5 Presenza/Scontro |
| +1 | Vendere il Colpo | In questo Duello l'Agente avversario ottiene 1 FC temporaneo. | −0.75 | circa −1.0 ✅ |
| 0 | Scommessa | Pronostica segretamente l'esito del Duello: vittoria tua / vittoria avversaria / pareggio. Se il pronostico è corretto, +1 Presenza. | 0 | circa +0.6 (lieve ⬆️) |
| −2 | Maschere Invertite | In questo Duello, per il tuo Agente, Gloria può essere soddisfatta anche come Vendetta e viceversa, e Conquista anche come Ultimo Desiderio e viceversa. | 1.50 | circa 0.8 (lieve ⬇️) |
| −3 | Ego senza Maschere | Finché un tuo Agente non vince un Duello, il Bonus del tuo Agente schierato diventa «Overdrive: +2 POT, +2 DAN». | 2.25 | circa 1.8 ✅ (al limite) 〰️ |

**Motore:** 0.75 + circa 1.9 = circa 2.65 FC.

**Da osservare in playtest:** Scommessa sulla propria sconfitta nei round già persi; durata reale di Ego senza Maschere.

**Lavoro di implementazione:**
- Statico: +1 Presenza (max una per Duello) all'attivazione di un Potere con trigger Gloria o Vendetta.
- Vendere il Colpo: FC temporaneo all'Agente avversario.
- Scommessa: premio da 2 a 1 Presenza.
- Maschere Invertite: alias dei trigger limitato al proprio lato.
- Ego senza Maschere: override del Bonus con «Overdrive: +2 POT, +2 DAN», attivo finché il giocatore non vince un Duello.
- Tolto Incontro Truccato.

## 11. Stato dell'implementazione (11 novembre 2026)

Tutte le 12 Eminenze della §10 sono nel catalogo (`src/data/eminences.js`) e nel motore, con test di accettazione, integrazione nel Duello reale e snapshot del tracer.

### 11.1 Scelte interpretative da confermare

- **Calibri — Tenere la Linea:** «il DAN nemico ti ha tolto 2 PV o meno» è letto come *DAN finale dell'Agente nemico ≤ 2* in un Duello perso.
- **Orathai — Eco:** l'effetto del Potere nemico si applica anche al tuo Agente dopo che entrambi i Poteri si sono risolti. Non si ripetono i Poteri che agiscono su altri Poteri (Blocca, Copia, Inversione). Se il Potere del tuo Agente è bloccato, anche l'Eco è bloccata.
- **Ratti — Corteggiamento:** l'avversario sceglie l'iniziativa dell'intero round (chi sceglie per primo Campo e Agente), non solo l'ordine degli Agenti.
- **Ratti — Vendetta oltre la Morte:** «sconfitto» = ha perso un Duello (il pareggio non conta). La scelta resta sigillata fino al gate generale, ma con un'unica attiva a quel gate l'avversario la deduce quando PRE_AGENT passa senza aperture.
- **Khemet — Maledizione Inversa:** l'inversione lavora sul netto rispetto ai valori stampati sulla carta (`finale = base − (corrente − base)`); gli FC restano fuori. Un lato Immune non subisce riduzioni dall'inversione. Gli effetti Copia non sono esclusi dal netto.
- **Apex — Cataclisma Verde:** «subisce Terraformare» è realizzato come sostituzione del Campo all'apertura del round 5, prima della scelta del Campo.

### 11.2 Punti aperti

- **Corte Rossa:** manca l'interfaccia del Registro (voci e totale visibili a entrambi) e l'indicatore «rifiuto disponibile». L'Offerta si risponde dal portale di scelta.
- **Campo 122:** usa lo sfondo del Meridiano (89) finché non c'è l'illustrazione `campo-122.webp`.
- **Cinematiche:** le primitive nuove (BLOCK_POWER, ECHO_POWER, REPLACE_ABILITY, CONSTRAIN_DEPLOY, SET_ROUND_INITIATIVE, TRANSPLANT_POWER, ESCALATE_END_MATCH_DEBTS) non hanno ancora un cue cinematico, come diverse primitive già esistenti.
- **IA:** sceglie l'abilità con i valori della §10 corretti sullo stato della partita e pianifica la Presenza sui Duelli che restano (`src/game/ai/eminence/aiEminenceChoice.js`). Rifiuta le Offerte troppo care o letali quando può; al Corteggiamento sceglie per seconda nei turni 1-2 e per prima dopo (misurato). Restano aperti: la scelta di Agente e FC non tiene conto degli effetti delle Eminenze; slot delle Maledizioni, Ascesa e Opera Composita usano i bersagli predefiniti; nessuna misura di forza con le Eminenze (manca il banco di prova).
