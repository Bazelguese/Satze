# SATZE - GLOSSARIO UFFICIALE

---

## TERMINOLOGIA (turno / scontro)

- **Turno**: round di partita (1, 2, 3…); include uno scontro completo e il passaggio al turno successivo.
- **Scontro**: risoluzione del combattimento tra due Agenti (fasi fino a scarto e inversione iniziativa). In SATZE, **un turno** = **uno scontro**.
- **Duello**: non è termine tecnico ufficiale; se usato, equivale a **scontro**.

---

## CONCETTI BASE

| Termine | Abbreviazione | Descrizione |
|---------|---------------|-------------|
| **Potenza** | POT | Moltiplicata per i FC per calcolare il Valore Assalto |
| **Danno** | DAN | PV inflitti all'avversario se vinci lo scontro |
| **Focus Coin** | FC | Risorse spese per potenziare l'Agente (18 totali, minimo 1 per scontro) |
| **Valore Assalto** | VA | POT x FC + modificatori. Chi ha VA piu alto vince. (Min: POT base) |
| **Punti Vita** | PV | Vita del giocatore (25 iniziali) |
| **Lega** | - | Valore 2-5 che indica la potenza generale della carta |
| **Deck** | - | 10 carte con somma Lega massima di 30 punti |
| **Bonus Armata** | - | Effetto attivo se hai 2+ Agenti della stessa armata nel Deck |
| **Campo di Battaglia** | - | Terreno conteso. Chi vince lo scontro lo conquista |

---

## CONDIZIONI DI VITTORIA

| Turno | Condizione | Descrizione |
|-------|------------|-------------|
| **1-4** | Conquista territoriale | Vince chi conquista **3 terreni** |
| **5+** | Supremazia | Vince chi ha **piu PV** a fine turno |
| **Sempre** | Annientamento | Chi arriva a **0 PV** perde immediatamente |

> **Nota:** Le prime due condizioni sono alternative: la Conquista territoriale e attiva solo nei turni 1-4, poi viene sostituita dalla Supremazia dal turno 5 in poi. L'Annientamento invece e sempre attivo e coesiste con la condizione corrente.

---

## TRIGGER (Condizioni di Attivazione)

| Trigger | Condizione |
|---------|------------|
| *Nessuno* | Effetto sempre attivo (si applica automaticamente) |
| **Imboscata** | Sei il primo a scegliere |
| **Intervento** | Sei il secondo a scegliere |
| **Gloria** | Hai vinto lo scontro precedente |
| **Vendetta** | Hai perso lo scontro precedente |
| **Overdrive** | Spendi 5+ FC |
| **Resa dei conti** | Si attiva dal 3° scontro (entrambi hanno già giocato 2 carte) |
| **Rimonta** | Hai meno PV dell'avversario |
| **Magnanimo** | Hai piu PV dell'avversario |
| **Ultimo Desiderio** | Perdi questo scontro |
| **Conquista** | Vinci questo scontro |
| **Opportunista** | Il nemico ha speso 5+ FC in questo scontro |
| **Sfida** | La tua Lega è inferiore a quella nemica |
| **Sopraffare** | La tua Lega è superiore a quella nemica |
| **Invasione** | Hai conquistato 1+ campi |
| **Resistenza** | Il nemico ha conquistato 1+ campi |
| **Turbo** | Turno 1 o 2 |
| **Ultima Chance** | Turno 5+ |

---

## EFFETTI

### Buff (potenziamento proprio)

| Effetto | Descrizione |
|---------|-------------|
| **+X POT** | Aumenta la tua Potenza di X |
| **+X DAN** | Aumenta il tuo Danno di X |
| **+X VA** | Bonus diretto al Valore Assalto |
| **+X FC** | Guadagni X Focus Coin |
| **Cura X** | Recuperi X Punti Vita |

### Effetti Scaling (buff condizionali)

| Effetto | Descrizione |
|---------|-------------|
| **Escalation X [STAT]** | +X alla statistica (POT/DAN) per ogni campo di battaglia che hai conquistato |
| **Attrizione X [STAT]** | +X alla statistica (POT/DAN) per ogni carta che hai già giocato in questa partita |

### Debuff (riduzione nemica)

| Effetto | Descrizione | Variabile opzionale |
|---------|-------------|---------------------|
| **-X POT nem.** | Riduce la Potenza nemica di X | (min Y) |
| **-X DAN nem.** | Riduce il Danno nemico di X | (min Y) |
| **-X VA nem.** | Malus al Valore Assalto nemico | (min Y) |
| **X Danni dir.** | Infliggi X danni diretti ai PV nemici | - |
| **-X PV (a te)** | Infliggi X danni ai tuoi PV | - |

> **Nota "Minimo":** Gli effetti con (min Y) non possono ridurre la statistica sotto il valore Y. Se la statistica e gia minore o uguale a Y, l'effetto non ha effetto.
> 
> Esempio: "-2 DAN nem. (min 2)" contro un nemico con DAN 4 lo porta a 2, ma contro un nemico con DAN 2 non fa nulla.
>
> **Stack Riduzioni:** Quando piu effetti di riduzione con minimo si applicano alla stessa statistica, si sommano i valori e si usa il minimo piu basso (meno restrittivo).
>
> Esempio: "-2 DAN (min 2)" + "-2 DAN (min 1)" = -4 DAN (min 1). Contro DAN 5, risultato = 1.
>
> **Bilanciamento:** Piu e alto il valore negativo e piu e bassa la variabile minimo, piu l'effetto e forte.
>
> | Tipo | Esempio | Effetto |
> |------|---------|---------|
> | Anti-carry | -8 POT nem. (min 5) | Punisce solo carte forti |
> | Standard | -3 POT nem. (min 1) | Riduzione moderata |
> | Oppressivo | -5 POT nem. (min 1) | Riduzione pesante |

### Copia

| Effetto | Descrizione |
|---------|-------------|
| **Copia POT** | La tua POT diventa uguale alla POT nemica |
| **Copia DAN** | Il tuo DAN diventa uguale al DAN nemico |
| **Copia Potere** | Usi il Potere dell'agente nemico |
| **Copia Bonus** | Usi il Bonus Armata nemico |

### Tossina

| Effetto | Descrizione | Parametri |
|---------|-------------|-----------|
| **Tossina X (min Y)** | Danno passivo che si attiva a fine di ogni turno successivo all'attivazione. Continua finché l'avversario non scende a Y PV o meno. Se riattivata mentre è già attiva, il valore aumenta di +1. | **X**: Danni inflitti a fine turno<br>**min Y**: Soglia PV sotto cui Tossina si disattiva |

**Funzionamento:**
1. Quando Tossina viene attivata, l'avversario subisce X danni a fine di ogni turno successivo
2. Tossina continua finché l'avversario non scende a Y PV o meno
3. Se Tossina viene riattivata mentre è già attiva, il valore aumenta di +1

**Esempio:**
- Turno 1: Vinci con bonus Ratti → Tossina 2 (min 4) attiva
- Fine Turno 2: Avversario subisce 2 danni
- Turno 3: Vinci ancora → Tossina sale a 3
- Fine Turno 3: Avversario subisce 3 danni
- Turno 4+: Continua finché avversario > 4 PV

### Controllo

| Effetto | Descrizione |
|---------|-------------|
| **Blocca Potere** | Annulla il Potere dell'agente nemico |
| **Blocca Bonus** | Annulla il Bonus Armata nemico |
| **Immune** | Ignora le riduzioni statistiche (-POT, -DAN, -VA). Non ignora Blocca Potere e Blocca Bonus |
| **Inversione** | I modificatori esterni (da effetti nemici e campi di battaglia) sono invertiti: buff → debuff, debuff → buff |

---

## BONUS ARMATA

| Armata | Bonus |
|--------|-------|
| **Figli dell'Orizzonte** | -5 VA nem. (min 6) |
| **Kethran** | Rimonta: +2 POT |
| **Corte Rossa** | Copia Bonus nemico |
| **Calibri Pesanti** | -2 DAN nem. (min 2) |
| **Orathai** | Resa dei conti: +2 DAN |
| **Mounthborn** | Imboscata: +1 POT, +1 DAN |
| **L'Enclave delle Scaglie** | Conquista: +2 FC |
| **Ratti della Megera** | Conquista: Tossina 2 (min 4) |

---

## BILANCIAMENTO

### Forza Numerica (POT + DAN rispetto alla Lega)

| Categoria | Formula |
|-----------|---------|
| **Mediocre** | <= Lega x 2 - 1 |
| **Buona** | = Lega x 2 |
| **Forte** | >= Lega x 2 + 1 |

| Lega | Mediocre | Buona | Forte |
|------|----------|-------|-------|
| 2 | <=3 | 4 | >=5 |
| 3 | <=5 | 6 | >=7 |
| 4 | <=7 | 8 | >=9 |
| 5 | <=9 | 10 | >=11 |

### Equilibrio Stats (differenza tra POT e DAN)

| Tipo | Differenza |
|------|------------|
| **Equilibrata** | <= 2 |
| **Sbilanciata** | >= 3 |

### Soglie Assolute

| Stat | Mediocre | Buono | Forte | Eccezionale |
|------|----------|-------|-------|-------------|
| **Potenza** | 1-3 | 4-5 | 6-7 | 8+ |
| **Danno** | 1-2 | 3 | 4-5 | 6+ |

### Moltiplicatori Trigger (nuovi)

| Trigger | Moltiplicatore |
|---------|----------------|
| Opportunista | 0.5 |
| Sfida | 0.6 |
| Sopraffare | 0.6 |
| Invasione | 0.5 |
| Resistenza | 0.5 |
| Turbo | 0.3 |
| Ultima Chance | 0.4 |

### Valori Effetti (nuovi)

| Effetto | Valore Stimato (FC) |
|---------|---------------------|
| Escalation 1 POT | ~0.65 |
| Escalation 1 DAN | ~0.45 |
| Attrizione 1 POT | ~1.00 |
| Attrizione 1 DAN | ~0.70 |
| Inversione | ~1.00 |

---

## NOTE DI DESIGN

- **Carta con corpo mediocre** -> Puo avere abilita potente
- **Carta con corpo forte** -> Abilita debole o assente
- **Carta sbilanciata** -> Puo avere stats totali piu alte come compensazione

*Queste sono linee guida, non regole assolute.*

---

## ORDINE DI RISOLUZIONE

1. **Potere Primo Giocatore** - Si attiva in base al trigger
2. **Potere Secondo Giocatore** - Si attiva in base al trigger
3. **Bonus Armata Primo Giocatore** - Se ha 2+ carte dell'armata nel Deck
4. **Bonus Armata Secondo Giocatore** - Se ha 2+ carte dell'armata nel Deck
5. **Calcolo VA** - POT x FC + modificatori
6. **Risoluzione scontro** - VA piu alto vince (parita: Lega minore, poi POT minore)
7. **Effetti post-scontro** - Conquista, Ultimo Desiderio, danni, cure

> **Nota:** Gli effetti Blocca (Blocca Potere, Blocca Bonus) annullano il Potere/Bonus bersaglio quando si tenta di risolverlo.

---

*Ultimo aggiornamento: Gennaio 2026*
