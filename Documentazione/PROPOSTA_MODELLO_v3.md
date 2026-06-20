# SATZE — PROPOSTA MODELLO DI BILANCIAMENTO v3.0

*Giugno 2026 — Documento di proposta, da fondere con SISTEMA_BILANCIAMENTO_COMPLETO.md v2.2*

> **Avvertenza di merge:** questa proposta è stata redatta avendo accesso alla v2.0 del documento di bilanciamento (la v2.2 canonica non era nei file di progetto della sessione). I cambiamenti strutturali (§1–§6) sono indipendenti dalla versione; i valori puntuali vanno riconciliati con la v2.2 prima dell'adozione. Include e formalizza i due item già pianificati per la v2.3 (split Ultima Chance, simmetria Turbo + economia).

---

## 1. IL PRINCIPIO: FREQUENZA ≠ GIOCABILITÀ

Il difetto strutturale del modello v2.x: il moltiplicatore trigger misura *quanto spesso la condizione è vera*, ma la grandezza che determina il valore reale di una carta è *la probabilità che la condizione sia vera nel turno in cui il giocatore sceglie di giocarla*.

Con mano fissa di 5 carte su 5 scontri, quasi tutte le condizioni trigger sono **osservabili al momento della scelta della carta** (Vendetta, Rimonta, Imboscata, Invasione, Turbo, Ultima Chance: lo stato è noto *prima* di decidere cosa giocare). Il giocatore non subisce la frequenza — la **schedula**. Per questi trigger il moltiplicatore corretto è molto più alto della frequenza naturale.

Il modello v3 sdoppia quindi il moltiplicatore in due colonne:

| Colonna | Definizione | Uso |
|---------|-------------|-----|
| **FN — Frequenza Naturale** | Frazione attesa di turni in cui la condizione è vera (partita a 5 scontri, winrate baseline 50%) | Valutazione **Bonus Armata** non convergente; diagnostica; trigger non osservabili |
| **MS — Moltiplicatore con Sequenziamento** | P(condizione vera nel turno in cui un giocatore competente sceglie di giocare la carta), incluso un fattore di contesa γ per la competizione tra le 5 carte per le finestre | Valutazione del **Potere della carta** nel Valore Effettivo |

### Regola di assegnazione (potere vs bonus)

- **Potere della carta → MS.** Il giocatore sceglie quando giocare la carta, quindi può cercare la finestra del suo trigger.
- **Bonus Armata → FN**, perché il bonus è incidentale: la carta viene schedulata per il *suo* potere, e il bonus si attiva o meno a seconda dello stato del turno.
- **Eccezione — Convergenza:** se trigger del potere == trigger del bonus, anche il bonus usa MS (schedulando la carta per il potere, schedulI anche il bonus). Questo formalizza numericamente la distinzione convergente/asso già usata nei framework identità: una carta Rimonta in un'armata con bonus Rimonta vale `bonus × 0.65`; la stessa carta in un'armata con bonus su altro trigger vale `bonus × FN` del trigger bonus.

---

## 2. TABELLA TRIGGER v3 (partita a 5 scontri)

| Trigger | FN | MS | Derivazione MS |
|---------|-----|-----|----------------|
| **Sempre** | 1.00 | 1.00 | — |
| **Imboscata** | 0.50 | **0.90** | Ordine alternato e noto dal T1: 2–3 finestre garantite su 5. P(slot)≈1.0 × γ 0.90 |
| **Intervento** | 0.50 | **0.90** | Speculare a Imboscata |
| **Resa dei conti** | 0.60 | **0.85** | T3–T5 deterministici: 3 finestre garantite × γ 0.95 |
| **Turbo** | 0.40 | **0.85** | T1–T2 deterministici: 2 finestre garantite. Vedi §4 per il costo opportunità |
| **Gloria** | 0.40 | **0.80** | P(≥1 vittoria in T1–T4) = 1−0.5⁴ = 0.94 × γ 0.85 |
| **Vendetta** | 0.40 | **0.80** | P(≥1 sconfitta in T1–T4) = 0.94 × γ 0.85 |
| **Ultimo Desiderio** | 0.50 | **0.80** | Forzabile a costo FC ~0: i turni sandbag (1 FC) esistono strutturalmente (~2/partita). Il costo strategico di concedere lo scontro NON è nel moltiplicatore — vedi nota |
| **Invasione** | 0.55 | **0.75** | Stato osservabile e tendenzialmente persistente da T2 |
| **Resistenza** | 0.55 | **0.75** | Speculare |
| **Ultima Chance** | 0.16 | **0.70** | P(partita arriva a T5) ≈ 0.8 × γ 0.90. **Vincolo duro: una sola carta UC per mano è giocabile; la seconda vale ~0** |
| **Rimonta** | 0.40 | **0.65** | Stato osservabile ma non controllabile: P(≥1 turno sotto PV) ≈ 0.70 × γ 0.90. Stato "appiccicoso" una volta entrati |
| **Magnanimo** | 0.40 | **0.65** | Speculare. Nota qualitativa: win-more — il valore contestuale dell'effetto è inferiore a parità di numero |
| **Conquista** | 0.50 | **0.65** | Esito corrente, NON noto alla scelta. Forzabile investendo FC, ma conteso dall'avversario |
| **Overdrive** | 0.30 | **0.65** | Pianificabile, ma il budget (18 FC) sostiene ~1–2 turni da 5+. Baseline per 2 carte OD in mano; con 3+ carte OD scala verso 0.50 |
| **Opportunista** | 0.30 | **0.35** | Unico trigger genuinamente NON osservabile né forzabile (FC nemici segreti). ↓ da 0.5: era sopravvalutato. Valore deterrenza non numerico |
| **Sfida** | per lega | per lega | Vedi §3 |
| **Sopraffare** | per lega | per lega | Vedi §3 |

**Nota su Ultimo Desiderio:** MS 0.80 prezza la probabilità che l'effetto scatti, non la convenienza. Il designer deve verificare separatamente che l'effetto valga la concessione di campo + DAN subito quando il trigger viene forzato. In valutazione, per effetti deboli (< 1.0 FC) su Ultimo Desiderio è prudente usare 0.65.

**Lettura del cambiamento:** la v2.x comprimeva tutti i trigger condizionali nella fascia 0.3–0.7; la v3 li separa per *osservabilità e controllo* — esattamente la dimensione che la colonna "Controllo" della v2.x descriveva a parole senza tradurla in numeri. Conquista e Opportunista, gli unici trigger realmente non osservabili alla scelta, restano in basso; tutto ciò che è schedulabile sale.

---

## 3. SFIDA E SOPRAFFARE: MOLTIPLICATORE PER LEGA

La frequenza di Sfida/Sopraffare è funzione della Lega della carta portatrice. Un moltiplicatore piatto (0.6) è strutturalmente sbagliato. FN derivata dalla distribuzione reale del pool (`cards.js`, 201 carte: L2 30%, L3 30%, L4 26%, L5 13%, lega media 3.22). MS = FN + 0.10 (bonus informazione: quando giochi secondo vedi la carta nemica prima di scegliere), cap 0.90.

| Lega carta | Sfida FN | Sfida MS | Sopraffare FN | Sopraffare MS |
|------------|----------|----------|----------------|----------------|
| 2 | 0.70 | **0.80** | 0.00 | — (non valido) |
| 3 | 0.39 | **0.49** | 0.30 | **0.40** |
| 4 | 0.13 | **0.23** | 0.61 | **0.71** |
| 5 | 0.00 | — (non valido) | 0.87 | **0.90** |

**Implicazioni di design immediate:**
- **Sopraffare su Lega 5 va prezzato quasi come Sempre** (0.90). Protocollo Cenere passa da 1.06 a 1.11 di Eff — era sottovalutato.
- **Sfida su Lega 4 è quasi morta** (0.23 contro lo 0.6 modellato). Qualsiasi carta L4 con Sfida nel pool attuale è più debole di quanto la v2.x dichiari.
- **Sfida su Lega 2 sale a 0.80**: il rischio "Sfida + effetto forte su L2" già segnalato in v2.x viene quantificato — non è un rischio, è la norma.
- La tabella va **rigenerata se la distribuzione leghe del pool cambia** sensibilmente (es. +2 armate).

---

## 4. MODULAZIONE TEMPORALE DEGLI EFFETTI ECONOMICI (implementa v2.3)

Gli effetti il cui valore dipende dai turni rimanenti per spenderlo (+FC, e in misura minore Cura in ottica Annientamento) vanno modulati per la finestra del trigger:

| Trigger | Effetti spendibili nel round (+POT, DAN dir., debuff…) | Effetti economici differiti (+FC) |
|---------|--------------------------------------------------------|-----------------------------------|
| Turbo (T1–2) | MS 0.85 | MS 0.85 × **premio 1.1** (FC precoci = intero orizzonte di spesa) |
| Trigger mediani | MS standard | MS standard |
| Ultima Chance (T5) | MS 0.70 | **MS 0.05** (FC guadagnati all'ultimo turno: valore ~nullo) |

### Costo opportunità di Turbo

Il vecchio 0.3 di Turbo confondeva due cose: la probabilità di attivazione (che è ~0.85: T1 e T2 esistono sempre) e il costo strategico di giocare presto senza informazione. La v3 li separa:

```
Valore Potere (Turbo) = Valore Effetto × 0.85 − CO
dove CO (costo opportunità) = 0.40 FC
```

Il CO prezza: gioco forzato anticipato, nessuna lettura del matchup, carta rivelata quando l'informazione vale di più. È un costo fisso, non uno sconto percentuale: un effetto Turbo da 3 FC non "perde il 70%", perde 0.4 FC secchi. Questo corregge la sottovalutazione sistematica degli effetti Turbo grossi e la sopravvalutazione di quelli piccoli.

---

## 5. STATISTICHE CONDIZIONATE

### 5.1 DAN proprio condizionato alla vittoria — fattore W(POT)

Il DAN vale solo se vinci lo scontro. Il principio "POT è la stat gateway" entra nella formula:

```
Body = POT × 0.50 + DAN × 0.35 × W(POT)

W(POT):  POT 1–2 → 0.70  |  POT 3–4 → 0.90  |  POT 5+ → 1.00
```

Fasce volutamente miti per non rompere la calibrazione esistente; da raffinare con i winrate per fascia POT dai playtest. Si applica anche agli effetti **+X DAN** (usando il POT post-buff se l'effetto dà anche POT).

### 5.2 −DAN nemico condizionato alla sconfitta — fattore L(POT)

Simmetricamente: il debuff −DAN nem. realizza valore solo quando **perdi** lo scontro. Su una carta che vince spesso è quasi inutile; su un corpo debole è oro.

```
Valore(−X DAN nem.) = X × 0.35 × [efficacia min] × L(POT)

L(POT):  POT 1–2 → 1.00  |  POT 3–4 → 0.90  |  POT 5+ → 0.70
```

**Implicazione:** i debuff difensivi appartengono ai corpi deboli. Una carta POT 6 con −DAN nem. è un controsenso numerico (la v2.x non lo vedeva). Vale anche per i Bonus Armata: il bonus Calibri (−2 DAN nem.) vale 0.56 su una carta POT 2 ma 0.39 su una POT 6.

### 5.3 Rivalutazioni puntuali

| Effetto | v2.x | v3 | Motivazione |
|---------|------|-----|-------------|
| Cura 1 PV | 0.20 | **0.28** | In un gioco Supremazia-centrico (più PV a T5 = win condition), 1 PV di differenziale incondizionato vale quasi quanto 1 DAN evitato condizionato |
| −1 PV (auto) | −0.20 | **−0.28** | Simmetria con Cura |
| +1 FC | 0.70 | 0.70 | Invariato, ma soggetto alla modulazione temporale di §4 |

---

## 6. TERZA METRICA: VALORE PAVIMENTO

Alla coppia Effettivo/Potenziale si aggiunge il **Pavimento**: cosa vale la carta se il trigger non scatta mai.

```
Pavimento  = Body / Lega                          (solo corpo, con W applicato)
Effettivo  = (Body + Potere×MS + Bonus×molt.) / Lega
Potenziale = (Body potenziato + Potere + Bonus) / Lega   (tutto a 1.0, invariato da v2.x)
```

Il profilo a tre punti distingue carte indistinguibili a due punti: una carta Eff 1.4 con Pavimento 1.3 è affidabile; una con Pavimento 0.8 è una scommessa. Soglia di guardia suggerita: **Pavimento < 0.9 → la carta è ingiocabile fuori finestra**, accettabile solo se MS ≥ 0.8.

---

## 7. FORMULA COMPLETA v3

```
Valore Effettivo = Body + Potere + Bonus − CO

Body   = POT × 0.50 + DAN × 0.35 × W(POT)
Potere = Valore Effetto × MS(trigger) × [mod. temporale §4 se economico]
Bonus  = Valore Bonus × FN(trigger bonus)        se trigger bonus ≠ trigger carta
       = Valore Bonus × MS(trigger bonus)        se convergenti
CO     = 0.40 se trigger = Turbo, altrimenti 0

Efficienza Effettiva = Valore Effettivo / Lega
```

---

## 8. IMPATTO SU CARTE REALI (verificato in Python su cards.js)

| Carta | Lega | Potere | Eff v2.x | Eff v3 | Δ | Lettura |
|-------|------|--------|----------|--------|-----|---------|
| Seguace Fanatico | 2 | Gloria: +2 POT | 1.43 | 1.51 | +0.08 | Gloria schedulabile: sale |
| Martire della Spira | 2 | U.Desiderio: 3 DAN dir | 1.50 | 1.55 | +0.05 | Trigger forzabile: sale |
| Protocollo Cenere | 5 | Sopraffare: 4 DAN dir | 1.06 | 1.11 | +0.05 | Sopraffare su L5 ≈ Sempre |
| Titano Corazzato MK-IV | 5 | Immune (Sempre) | 1.56 | 1.50 | −0.06 | Bonus −DAN nem. su POT 6 scende (L=0.7) |
| Nucleo di Comando Nord | 4 | Overdrive: +2 POT | 1.24 | 1.18 | −0.06 | OD sale (0.5→0.65) ma bonus e W limano |
| Chimera | 4 | Sempre: −4 POT nem (min 3) | 1.19 | 1.06 | −0.13 | DAN 5 su POT 2: W=0.7 morde |
| Analista da Combattim. | 3 | Attrizione 1 POT | 1.25 | 1.10 | −0.15 | Corpo 2/3: DAN condizionato |
| Guardiano di Settore | 3 | Sfida: Blocca Potere | 1.60 | 1.44 | −0.16 | Sfida L3 reale = 0.49, non 0.6 |

**Pattern complessivo:** salgono le carte con trigger schedulabili (era il sospetto: le carte già segnalate come "alta efficienza" in v2.x avevano tutte trigger ad alto controllo — il nuovo modello rende esplicito il perché). Scendono le carte con DAN alto su POT basso e i debuff difensivi su corpi forti. Le soglie di Efficienza media per Lega (§Step 6 v2.x) vanno **ricalibrate dopo un ricalcolo completo del pool** — l'ordinamento relativo cambia, quindi anche le medie.

---

## 9. INCOERENZE TROVATE DURANTE L'AUDIT (da correggere a prescindere dal modello)

1. **[RISOLTO] Etichetta fossile `rimonta`/"Vendetta" — 9 carte:** il motore (`triggerLogic.js`) distingue nettamente `rimonta` (PV sotto) da `vendetta` (perso il precedente). Non era un bug della sola carta 206: **9 carte** avevano `trigger: "rimonta"` nel codice ma descrizione *"Vendetta: …"* — ID **109, 202, 206, 409, 513, 613, 619, 711, 813**. Causa: la migrazione trigger `vendetta -> rimonta` (vedi `SISTEMA_BILANCIAMENTO_COMPLETO.md`) ha rinominato la chiave nel codice ma non le stringhe `description`, lasciando l'etichetta col vecchio nome. Risolto con due esiti distinti in `src/data/cards.js` e `carte/CARTE.md`:
   - **Convertite a Vendetta** (trigger `vendetta` + testo "Vendetta"; **gameplay modificato**: ora si attivano su "scontro precedente perso"): **202, 206, 409, 513, 619**.
   - **Allineate a Rimonta** (testo → "Rimonta", trigger `rimonta` e gameplay invariati): **109, 613, 711, 813**.
   Le carte già coerentemente `vendetta` non sono state toccate.
2. **Carte fantasma nella lista "Carte da Monitorare" (v2.0):** Sentinella Astrale, Diavoletto Ingannatore, Scintilla Primordiale e Zarkon **non esistono in cards.js**. Inoltre Seguace Fanatico è lì descritto come "Gloria +4 POT" ma in cards.js è +2 POT. La lista va rigenerata da ground truth (se non già fatto nella v2.2).
3. **Bonus Calibri:** la v2.0 lo valuta 0.70 (2 × 0.35) ignorando lo sconto del `min 2` (~80%) che la stessa v2.0 prescrive per gli effetti con minimo. Valore coerente: 0.56 (prima del fattore L di §5.2).
4. **Parametri non riconciliati tra versioni:** v2.0 dice "max 10 scontri", v2.1 "max 5". Tutte le FN di questo documento sono derivate per **5 scontri**; se i moltiplicatori v2.x erano stati calibrati nell'era a 10, l'intera tabella era già scaduta prima di questa proposta.

---

## 10. PIANO DI VALIDAZIONE (i numeri MS sono ipotesi, non verità)

Ogni MS di questo documento è una derivazione teorica con assunzioni esplicite (winrate 50%, indipendenza tra turni, γ stimato). I playtest devono misurare, per ogni trigger, due numeri distinti:

1. **FN empirica** = turni con condizione vera / turni totali → valida la colonna FN.
2. **MS empirica** = attivazioni del potere / volte che la carta è stata giocata → valida la colonna MS. *Questo è il numero che il modello v2.x non poteva nemmeno concepire, perché non distingueva le due grandezze.*

Soglie di revisione su ≥50 partite: se |MS empirica − MS teorica| > 0.15 per un trigger, ricalibrare. Loggare anche: P(partita arriva a T5) (ipotizzato 0.8 — pilota Ultima Chance), numero medio di turni Overdrive per partita (ipotizzato 1.5), winrate per fascia POT (pilota W ed L).

### Limiti dichiarati del modello

- γ (contesa scheduling) è una stima a spanne, non derivato.
- L'indipendenza tra esiti dei turni è falsa (chi vince tende a rivincere): Gloria/Vendetta reali potrebbero divergere.
- W ed L usano il POT base, ignorando i buff: una carta Vendetta +3 POT ha un W reale più alto del suo POT base.
- Il valore di bluff, deterrenza (Opportunista) e informazione restano fuori dal numero, come in v2.x.

---

*Proposta Modello v3.0 — Giugno 2026 — tutti i valori numerici verificati via script Python su cards.js*
