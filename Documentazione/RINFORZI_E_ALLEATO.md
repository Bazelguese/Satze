# SATZE — RINFORZI E ALLEATO

*Separazione dei due trigger, riprezzatura del Bonus del Patto degli Indocili, migrazione del pool*  
*Agosto 2026 — verificato su `Bazelguese/Satze@main` + regole locali*

---

## 1. LE DECISIONI PRESE

| | |
|---|---|
| **Rinforzi** | Richiede **2 altre carte della stessa Lega** in mano (3 in totale). Vive come Bonus del Patto degli Indocili e come Potere di carta, in qualunque Armata. |
| **Alleato** | Richiede **1 altra carta della stessa Lega** in mano (2 in totale). Sostituisce Rinforzi sulle 21 carte esistenti del pool. |
| **Attivazione del Bonus Patto** | **Lettura per-carta.** Il Bonus si applica alla carta giocata solo se quella carta ha 2 compagne di Lega in mano. Non è un interruttore che resta acceso per la partita. |
| **Condizione d'Armata** | Il Patto **sostituisce** la regola standard (2+ carte della stessa Armata in mano) con la concentrazione di Lega. È l'unica Armata con questa eccezione. |

### Perché la lettura per-carta

La lettura alternativa — bonus acceso per tutta la partita se in mano esiste un gruppo di 3 carte della stessa Lega — è stata scartata perché **cinque configurazioni su sette arrivano al 100%**. Basta un solo gruppo e la condizione smette di esistere; la costruzione conterebbe soltanto per evitare i deck estremamente sparsi.

| Deck | Per-mano | **Per-carta** |
|---|---:|---:|
| 10×L3 | 100.0% | **100.0%** |
| 5L2 + 5L4 | 100.0% | **64.3%** |
| 7L3 + 3L2 | 100.0% | **71.7%** |
| 3L2 + 4L3 + 3L4 | 42.9% | **26.2%** |
| 3L2+3L3+2L4+2L5 | 16.7% | **10.0%** |

La lettura per-carta è anche l'unica in cui *vivere in squadra* significa qualcosa turno per turno: la carta isolata non riceve il Bonus, quella accompagnata sì.

---

## 2. IL BONUS DEL PATTO: RIPREZZATURA

Il Bonus è `Rinforzi: -1 POT, -1 DAN nem. (min 2)`. Il suo valore pieno secondo il modello v3:

```
-1 POT nem. = 1 × 0.50 × 0.80 (efficacia min 2)              = 0.400
-1 DAN nem. = 1 × 0.35 × 0.80 × L(POT)   con L(POT 3-4)=0.90 = 0.252
                                                     TOTALE  = 0.652
```

Ma la copertura varia con la costruzione. Enumerate tutte le **67 configurazioni di Lega legali** sotto il cap di 30 punti:

| Scenario | Copertura della mano | Valore atteso del Bonus |
|---|---:|---:|
| Peggiore (massima dispersione) | 21.2% | 0.138 |
| 25° percentile | 48.3% | 0.315 |
| **Mediana** | 55.0% | 0.359 |
| 75° percentile | 71.7% | 0.467 |
| Migliore (monoLega) | 100.0% | 0.652 |
| *Media su tutte le 67* | *58.5%* | *0.381* |

| Fascia di copertura | Configurazioni | Quota |
|---|---:|---:|
| sotto 25% | 1 | 1.5% |
| 25–50% | 20 | 29.9% |
| 50–75% | 32 | 47.8% |
| oltre 75% | 14 | 20.9% |

> **Il Bonus del Patto non ha un valore, ha un intervallo: da 0.138 a 0.652, mediana 0.359.**

È l'unico Bonus del gioco con questa proprietà. Tutti gli altri hanno una FN determinata dalla struttura della partita; questo è determinato da **come costruisci il deck**. Per il precostruito ufficiale va prezzato sulla configurazione effettiva di quel mazzo, con l'intervallo documentato accanto. ⚖️

### Lo splash è deliberato

Sostituendo la condizione standard, il Bonus del Patto **non richiede carte del Patto**. Una singola carta del Patto in un deck di altra Armata attiva il Bonus, se la mano ha la concentrazione richiesta.

| | Costo d'accesso al proprio Bonus | Resa media |
|---|---|---:|
| Armate standard | 2 carte su 10 vincolate (**20% del deck**) | 100% del valore |
| **Patto degli Indocili** | 1 carta su 10 (**10% del deck**) | **58.5% del valore** |

Il rapporto costo/resa è quasi identico — metà del costo per poco più della metà della resa — quindi lo splash **non è uno sfruttamento, è il prezzo pagato in affidabilità**. Il Patto è l'Armata che entra in poco spazio e rende meno; le altre occupano più spazio e rendono sempre.

Questa è l'identità dichiarata: un'Armata che vive in squadra con le altre. Il Bonus è progettato per essere portato altrove, e il suo prezzo lo riflette già.

---

## 3. MIGRAZIONE DEL POOL

Le **21 carte** che oggi hanno `rinforzi` passano ad **Alleato**. Le loro MS tornano ai valori originali (L2 1.00, L3 1.00, L4 0.96, L5 0.72) e **nessun ricalcolo di efficienza è necessario**: il documento `RICALCOLO_RINFORZI.md` non si applica più.

| # | Carta | Armata | L | POT/DAN | Potere | Nuovo trigger |
|---:|---|---|:-:|:-:|---|---|
| 1107 | Delinquenti pianta-trappole | Apex | 2 | 2/3 | **Alleato:** -2 DAN nem. (min 1) | Alleato |
| 408 | Operaio Meccanico | Calibri Pesanti | 2 | 2/2 | **Alleato:** -2 DAN nem. (min 2) | Alleato |
| 321 | Raccogli Firme | Corte Rossa | 2 | 3/1 | **Alleato:** +2 POT | Alleato |
| 621 | Ape Ignobile | Mounthborn | 2 | 3/1 | **Alleato:** +1 POT, +1 DAN | Alleato |
| 521 | Orathai Vorace | Orathai | 2 | 2/2 | **Alleato:** 3 Danni dir. | Alleato |
| 1110 | Chiamavalanghe | Apex | 3 | 4/2 | **Alleato:** +6 VA | Alleato |
| 323 | Phimesto | Corte Rossa | 3 | 4/2 | **Alleato:** Blocca Bonus | Alleato |
| 223 | Angelo Ricomposto | Kethran | 3 | 3/4 | **Alleato:** Imponi POT | Alleato |
| 622 | Moscouter | Mounthborn | 3 | 4/2 | **Alleato:** -6 VA nem. (min 8) | Alleato |
| 504 | La Spina nel Bosco | Orathai | 3 | 4/3 | **Alleato:** Blocca Bonus | Alleato |
| 522 | Protettore degli Animali | Orathai | 3 | 4/2 | **Alleato:** +7 VA | Alleato |
| 923 | Artista dell'Ultrastrada | Patto degli Indocili | 3 | 3/2 | **Alleato:** Copia Potere | Alleato |
| 822 | Prete delle Malelabbra | Ratti della Megera | 3 | 4/3 | **Alleato:** Tossina 1 (min 15) | Alleato |
| 1121 | Pioggia notturna | Apex | 4 | 6/2 | **Alleato:** Blocca Bonus | Alleato |
| 417 | Santo Motore | Calibri Pesanti | 4 | 5/4 | **Alleato:** +8 VA | Alleato |
| 326 | Sigillatore dei Vili Affari | Corte Rossa | 4 | 5/3 | **Alleato:** Blocca Potere | Alleato |
| 117 | Prete dell'Ancora | Figli dell'Orizzonte | 4 | 5/2 | **Alleato:** +3 DAN | Alleato |
| 728 | Generalissimo | L'Enclave delle Scaglie | 4 | 5/3 | **Alleato:** -8 VA nem. (min 5) | Alleato |
| 526 | Regalità Baritonale | Orathai | 4 | 4/3 | **Alleato:** +3 POT | Alleato |
| 927 | Bosozu, l'incendia-asfalto | Patto degli Indocili | 4 | 4/3 | **Alleato:** 3 Danni dir. | Alleato |
| 826 | Principessa di Birgherund | Ratti della Megera | 4 | 4/1 | **Alleato:** -4 POT nem. (min 1) | Alleato |

Le due carte del **Patto degli Indocili** (`Artista dell'Ultrastrada`, `Bosozu, l'incendia-asfalto`) passano anch'esse ad Alleato. Conseguenza tecnica: **non c'è più convergenza** fra trigger del Potere e trigger del Bonus, quindi il Bonus usa la propria probabilità su tutte e 30 le carte dell'Armata, senza casi speciali. Sparisce il doppio conteggio.

---

## 4. LINEE GUIDA PER LE CARTE RINFORZI

Rinforzi resta disponibile come Potere di carta, in qualunque Armata. Ma ha un profilo di rischio che nessun altro trigger ha, e le carte vanno progettate di conseguenza.

### 4.1 Il trigger è bimodale

La condizione è determinata **alla pesca**, non durante la partita. Non esiste un turno in cui "quasi" si attiva: o la mano ha la concentrazione, o non ce l'ha per tutta la partita.

| k = carte della stessa Lega nel deck | P(attivo) | P(mai attivo) |
|---:|---:|---:|
| 2 | 0.0% | 100.0% |
| 3 | 16.7% | 83.3% |
| 4 | 40.5% | 59.5% |
| 5 | 64.3% | 35.7% |
| 6 | 83.3% | 16.7% |
| 7 | 95.2% | 4.8% |

Il valore medio della carta **non si osserva mai in partita**. Vale corpo + Potere, oppure solo corpo.

### 4.2 Corpo minimo obbligatorio

Il modello v3 pone la soglia: *Pavimento < 0.90 → ingiocabile fuori finestra*. Per Rinforzi la soglia non è negoziabile, perché la carta va in mano priva del Potere in una quota alta delle partite.

| Lega | Corpo minimo (POT/DAN) | Pavimento |
|:-:|:-:|---:|
| 2 | **3/1** | 0.907 |
| 3 | **4/3** | 0.982 |
| 4 | **5/4** | 0.975 |
| 5 | **7/3** | 0.910 |

Alternative equivalenti: L2 → 3/2, 4/0 · L3 → 5/1, 3/4 · L4 → 6/2, 7/1 · L5 → 8/2, 6/5.

### 4.3 Tetto per Lega

Il cap di 30 punti limita quanto si può concentrare, quindi limita la MS massima raggiungibile:

| Lega | k massimo legale | **MS massima** |
|:-:|---:|---:|
| 2 | 10 | **1.00** |
| 3 | 10 | **1.00** |
| 4 | 5 | **0.64** |
| 5 | 3 | **0.17** |

**Una carta Rinforzi di Lega 5 non può superare MS 0.17 in alcun deck legale.** Sconsigliata a quella Lega — e infatti il pool attuale non ne contiene nessuna.

### 4.4 Rinforzi fuori dal Patto

Una carta Rinforzi in un'Armata diversa dal Patto è, meccanicamente, **un invito a un deck misto**: spinge a concentrare le Leghe, che è la stessa cosa che rende utile il Bonus del Patto. Le due concentrazioni non competono per gli slot — si allineano.

Il Patto possiede **11 carte L3 e 11 L4**. Cinque carte Patto della stessa Lega producono simultaneamente `k = 5`; una sola carta di un'altra Armata sulla stessa Lega porta a `k = 6`, cioè MS 0.83.

È il primo elemento meccanico che comunica un'**affinità fra Armate**. 🔶 Se in futuro il tema Intesa/Asse verrà sviluppato, Rinforzi è il precedente da cui partire.

---

## 5. IMPLEMENTAZIONE

```javascript
// triggerLogic.js
case 'alleato':
  // Almeno 1 altra carta della stessa Lega nella mano iniziale
  return Math.max(0, (context.playerInitialLeagueCount || 0) - 1) >= 1;

case 'rinforzi':
  // Almeno 2 altre carte della stessa Lega nella mano iniziale
  return Math.max(0, (context.playerInitialLeagueCount || 0) - 1) >= 2;
```

**Il Bonus del Patto richiede una deroga alla regola standard di attivazione.** Oggi il motore accende il Bonus per lato (`side.hasBonus`) sulla base di 2+ carte della stessa Armata in mano. Per il Patto va invece valutato **per carta giocata**, sulla condizione Rinforzi. È l'unica Armata con questa eccezione e va gestita esplicitamente, non come caso generale.

Checklist:

1. Aggiungere il case `alleato` in `triggerLogic.js`.
2. Portare `rinforzi` da `>= 1` a `>= 2` (oggi riga 117).
3. Migrare le 21 carte del pool da `rinforzi` ad `alleato` in `cards.js`.
4. Deroga di attivazione per il Bonus del Patto: valutazione per-carta invece che per-lato.
5. Aggiungere `Alleato` alla mappa profili di `SISTEMA_ARCHETIPI_v3.md` (i trigger diventano 19).
6. Testi UI e futura localizzazione: *Alleato* singolare, *Rinforzi* plurale — la differenza di soglia è già nella parola.

---

## 6. QUESTIONI APERTE

1. ⚖️ **Prezzo del Bonus del Patto** sulla configurazione del precostruito ufficiale, una volta scelta.
2. 🔶 **Quante carte Rinforzi introdurre e in quali Armate.** Decisione rimandata: dipende dalle espansioni future. Il vincolo tecnico è già fissato in §4.
3. 🔶 **`Tossina` e `Imponi POT` restano senza valore nel modello v3.** Bloccano `Prete delle Malelabbra` e `Angelo Ricomposto` fra le carte in migrazione, e molte altre nel pool.

### Stato implementazione (locale)

- [x] Case `alleato` + `rinforzi >= 2` in `triggerLogic.js`
- [x] Migrazione 21 carte → `alleato` in `cards.js`
- [x] Deroga Patto in `calcInitialBonuses` (1 carta basta; attivazione per-carta via Rinforzi)
- [x] Testi UI/glossario (`triggers.js`, `glossary.js`) + `SISTEMA_ARCHETIPI_v3.md`

---

*Rinforzi e Alleato — SATZE — 21 carte in migrazione, 67 configurazioni analizzate*