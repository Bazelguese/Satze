# SATZE — Copy guide testi Eminenza

> **Companion di:** `SATZE_EMINENZA_SCHEDA_IMPLEMENTAZIONE.md`, `SATZE_EMINENZE_SPEC_UNIFICATA_v2.2.md` §12  
> **Dati:** `src/data/eminences.js` · **Avvisi dinamici:** `src/game/eminence/eminenceAnnouncements.js`

Il badge dell'avviso comunica **quando** (Rivelazione, Verifica, Risoluzione…).  
Il campo `text` descrive **cosa fa** la regola, in linguaggio meccanico uniforme.

---

## 1. Glossario UI

| Termine | Uso |
|---|---|
| **Round** | Turno dello Scontro (1–5) |
| **Duello** | Confronto Agente vs Agente del round corrente |
| **Scontro** | Partita intera |
| **Presenza** | Risorsa Eminenza (maiuscola) |
| **Trigger** | Condizione del Potere (nome da `TRIGGER_NAMES`) |
| **Potere** | Effetto dell'Agente quando il trigger è soddisfatto |
| **Statico** | Regola permanente dell'Eminenza |
| **Abilità** | Scelta attiva di round (non “capacità”) |
| **slot** | Posizione sul tabellone (indice 0–4); nel catalogo: `Scegli uno slot.` |
| **Campo** | Carta di Campo o etichetta UI `Campo N` (1-based) negli avvisi dinamici |

**Evitare in UI:** “attivazione” generica, “effetto scatta”, “capacità”, “controllore”.

**Abbreviazioni sempre maiuscole:** POT, DAN, VA, PV, FC.

**Trigger:** usare i nomi UI da `src/data/triggers.js` → Imboscata, Intervento, Gloria, Vendetta, Conquista, Ultimo Desiderio, Turbo, Ultima Chance, Overdrive, …

---

## 2. Durata (4 formule)

| Codice | Testo | Quando |
|---|---|---|
| `D_DUELLO` | **In questo Duello** | Effetti sul confronto corrente |
| `D_ROUND` | **In questo round** | Prossimo Agente / intero round |
| `D_SCONTRO` | **Per il resto dello Scontro** | Persistenti (Preda, Frammento, slot…) |
| `D_POST` | *(omit)* | Payoff post-esito: il badge dice *Risoluzione · Dopo il Duello* |

Non ripetere nel `text` ciò che il badge già dice (gate, reveal, “dopo il Duello” se ridondante).

---

## 3. Verbi meccanici

| Primitive / effetto | Formula |
|---|---|
| Forza trigger | `[Trigger] è considerato soddisfatto.` |
| Vieta trigger | `[Trigger] non può attivarsi.` |
| Alias trigger | `[A] può essere soddisfatto anche come [B] e viceversa.` |
| Mod stat | `[Bersaglio] ottiene ±N [STAT].` |
| Perdi PV | `Perdi N PV.` (proprio lato) |
| Cura | `Cura N PV.` |
| Presenza | `±N Presenza.` (costo al reveal: non ripetere se solo `-presenceDelta`) |
| Marca | `Scegli [bersaglio]: diventa [Preda/Frammento].` |
| Ignora Campo | `Ignora gli effetti del Campo [D_DUELLO].` |
| Maledizione slot | `Scegli uno slot. [effetto persistente sugli Agenti schierati lì].` |
| Potere reale | `si attiva realmente` (non solo forzato o bloccato) |
| Bonus Armata | `Il Bonus d'Armata è considerato attivo e non può essere bloccato.` |

**Bersagli (testo catalogo condiviso):** `il prossimo Agente che schieri` · `il proprio Agente` · `un Agente nemico` · `un Agente nemico non ancora schierato`.

---

## 4. Struttura del `text`

### Statico
```
[Quando scatta]. [Cosa cambia].
```

### Attiva immediata
```
[Effetto]. [Costo non-Presenza, se presente].
```

### Attiva condizionale
```
Se [condizione breve], [effetto].
```

**Regole di stile**
- Max **2 frasi**, ~120 caratteri dove possibile.
- **Non** prefissare con `NomeAbilità:` — il nome è già nel banner.
- Nomi propri di stato: **Preda**, **Frammento**, **Debito** (maiuscola).

---

## 5. Avvisi dinamici (risoluzione)

Allineati a `eminenceAnnouncements.js`:

| Esito | Copy |
|---|---|
| Preda schierata | `Una Preda è schierata: +N Presenza.` |
| Preda assente | `Nessuna Preda schierata.` |
| Sconfitta vs Preda | `Sconfitta contro una Preda: Cura N PV.` |
| Pronostico corretto | `Pronostico: [esito]. +N Presenza.` |
| Condizione generica ok | `Condizione soddisfatta: [payoff].` |
| Condizione generica ko | `Condizione non soddisfatta.` |

---

## 6. Before / after (7 Eminenze implementate)

### Apex — Il Sole Verde

| | Prima | Dopo |
|---|---|---|
| Statico | All'inizio del round 5, il Campo viene sostituito… | All'inizio del round 5, lo slot aperto viene sostituito da un Campo Apex. |
| Furia | …; il controllore perde 2 PV | Il prossimo Agente che schieri ottiene +1 POT. Perdi 2 PV. |
| Disprezzo | …effetti del Campo per questo Duello | Il prossimo Agente ignora gli effetti del Campo in questo Duello. |

### Patto — Il Grande Semaforo

| | Prima | Dopo |
|---|---|---|
| Verde | `Verde: Imboscata e Turbo…` | Imboscata e Turbo sono considerati soddisfatti in questo round. Intervento e Ultima Chance non possono attivarsi. |
| Giallo | `Giallo: tutti e quattro…` | Tutti i trigger seguono le condizioni normali. |
| Rosso | `Rosso: Intervento…` | Intervento e Ultima Chance sono considerati soddisfatti in questo round. Imboscata e Turbo non possono attivarsi. |

### Mascarada

| | Prima | Dopo |
|---|---|---|
| Statico | …selezionati e resi noti… | Gli Agenti vengono scelti e resi noti prima della scelta del Campo. |
| Scommessa | `Scommessa: pronostica segretamente…` | Pronostica segretamente l'esito del Duello. Se il pronostico è corretto, +2 Presenza. |
| Maschere | (ok) | In questo Duello, Gloria… (prefisso durata) |
| Incontro Truccato | …forzatamente soddisfatto… | Il trigger del proprio Agente è considerato soddisfatto. Il Potere non può essere bloccato. |

### Kethran

| | Prima | Dopo |
|---|---|---|
| Sacrificio | `Sacrificio: se il proprio Agente perde… dopo il Duello` | Se perdi il Duello, +1 Presenza. |
| Innesto | `Innesto: scegli…` | Scegli un Frammento: il Potere può attivarsi con il trigger proprio o con quello del Frammento. |
| Opera Composita | (prefisso nome) | Scegli uno o due Frammenti per sostituire trigger, effetto o entrambi. |

### Mounthborn

| | Prima | Dopo |
|---|---|---|
| Statico setup | …La scelta è di setup ed è pubblica… | All'inizio dello Scontro, scegli un Agente nemico: diventa Preda. |
| Gorgoglio | `Gorgoglio dai Cento Occhi:…` | Scegli un Agente nemico non schierato: diventa Preda. Se una Preda è schierata in questo round, +2 Presenza. |
| Frenesia | `Frenesia della Fame: se viene schierata…` | Se una Preda è schierata, il Bonus d'Armata è considerato attivo e non può essere bloccato. |
| Cannibalismo | `Cannibalismo: se perdi…` | Se perdi il Duello contro una Preda, Cura 3 PV. |

### Khemet — Il Castello dei Sigillatori

| | Prima | Dopo |
|---|---|---|
| Statico | `Quando un proprio Agente…` | Quando il proprio Agente attiva Overdrive, +1 Presenza. |
| Convalida | `…si attiva e non viene bloccato` | Se il Potere del proprio Agente si attiva realmente e non viene bloccato, +1 Presenza. |
| Sigilli | `Scegli un Campo…` | Scegli uno slot. Per il resto dello Scontro, gli Agenti schierati lì… |

*(Negli avvisi dinamici lo slot scelto resta `Campo N` — etichetta UI 1-based.)*

### Figli dell'Orizzonte — La Domanda Senza Fine

| | Prima | Dopo |
|---|---|---|
| Statico | (definizione lunga) | Un Agente è Ancorato se ha investito almeno 6 − Lega effettiva + aumenti del requisito. |
| Deriva | (prefisso nome) | Aumenta di 1 il requisito di Ancorato, per il resto dello Scontro, già da questo round. |
| Leggerezza | (prefisso nome) | Se il proprio Agente non è Ancorato, +1 Presenza. |
| Risposta | (prefisso nome) | Se il proprio Agente è Ancorato, il suo trigger è considerato soddisfatto. |

---

## 7. Checklist (scheda implementazione)

- [ ] `text` conforme a §12 (senza parafrasi che cambiano regole)
- [ ] Nessun prefisso `NomeAbilità:`
- [ ] Durata con una delle 4 formule
- [ ] Trigger da `TRIGGER_NAMES`
- [ ] Stat in maiuscolo (POT, DAN, VA, PV, FC)
- [ ] Nessuna ridondanza col badge di fase
- [ ] Test `eminenceCopy.test.js` verde

---

*Copy guide v1 — allineata ai badge di fase in `eminenceAnnounceLabels.js`.*
