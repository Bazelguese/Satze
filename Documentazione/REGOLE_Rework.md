# SATZE - REGOLAMENTO COMPLETO

---

## PANORAMICA

SATZE e un gioco di carte strategico per 2 giocatori. Ogni giocatore controlla un'armata di Agenti e si scontra su campi di battaglia per la supremazia.

### Terminologia

- **Partita**: dall'inizio alla condizione di vittoria.
- **Turno** (round 1, 2, 3…): unità di gioco in cui si schiera, si risolve **uno** combattimento sul campo attivo e si passa all'ordine del turno successivo (incluso l'inversione di iniziativa).
- **Scontro**: la sequenza di fasi dal Pre-turno alla Fase 7 che risolve il combattimento tra due Agenti (VA, spareggi, danni, effetti post-combattimento).
- In questo regolamento **un turno** corrisponde **a uno scontro**; non ci sono più scontri nello stesso turno.
- La parola **duello** non è usata come termine tecnico: se compare altrove, va intesa come sinonimo di **scontro**.

---

## COMPONENTI

| Componente | Quantita | Descrizione |
|------------|----------|-------------|
| **Agenti** | 10 per armata | Carte con POT, DAN, Lega e Potere |
| **Focus Coin (FC)** | 18 per giocatore | Risorse per potenziare gli Agenti |
| **Punti Vita (PV)** | 25 per giocatore | Vita iniziale |
| **Campi di Battaglia** | 5+ | Terreni da conquistare |

---

## SETUP

1. Ogni giocatore costruisce un Deck di **10 carte** (da qualsiasi armata)
2. La somma totale dei **punti Lega** non puo superare **30**
3. Ogni giocatore inizia con 25 PV e 18 FC
4. Ogni giocatore **pesca 5 carte** casualmente dal proprio Deck di 10. Queste 5 carte formano la **mano** per la partita
5. Il primo giocatore del turno 1 e chi ha il valore di Lega totale piu basso tra le 5 carte in mano. In caso di parita, si determina casualmente

> **Costruzione Deck:** Puoi mescolare carte di armate diverse. Il Bonus Armata si attiva solo se hai 2+ carte della stessa armata **in mano** (contando anche le carte gia giocate).

---

## CONDIZIONI DI VITTORIA

| Turno | Condizione | Come si vince |
|-------|------------|---------------|
| **1-4** | Conquista territoriale | Conquista **3 campi di battaglia** |
| **5+** | Supremazia | Avere **piu PV** dell'avversario a fine turno |
| **Sempre** | Annientamento | L'avversario arriva a **0 PV** |

> **Importante:** Conquista e Supremazia sono alternative (una sostituisce l'altra al turno 5). L'Annientamento e sempre attivo e coesiste con la condizione corrente.

---

## STRUTTURA DI UN TURNO

### Pre-turno: Condizioni Ambientali del Campo

Prima che i giocatori facciano qualsiasi scelta, il Campo di Battaglia attivo stabilisce le sue condizioni strutturali. Queste restano attive per l'intero scontro.

Le condizioni ambientali includono:
- **Cap FC** — limite massimo ai FC investibili (es. Anomalia Gravitazionale)
- **Annullamenti** — Poteri annullati, Bonus annullati, Immune disattivato, Copia annullata, DAN diretti annullati, Blocca Potere/Bonus disattivati
- **Trigger forzati** — trigger che si attivano sempre indipendentemente dalla condizione normale (es. Fondamenta della Torre, Alveare Abbandonato, Crocevia dei Patti)
- **Soglie modificate** — cambiamenti alle soglie di trigger esistenti (es. Nucleo del Reattore: Overdrive si attiva a 4 FC invece di 5)

### Fase 1: Primo Giocatore

1. Il **primo giocatore** sceglie un Agente dalla mano (visibile)
2. Il **primo giocatore** sceglie segretamente quanti FC investire (minimo 1)

### Fase 2: Secondo Giocatore

1. Il **secondo giocatore** sceglie un Agente dalla mano (visibile)
2. Il **secondo giocatore** sceglie segretamente quanti FC investire (minimo 1)
3. Entrambi rivelano i FC investiti simultaneamente

> **Nota:** Gli Agenti sono sempre visibili. Solo i FC sono segreti fino alla rivelazione.

### Fase 3: Risoluzione Effetti

La fase 3 si svolge in cinque passi distinti. I primi tre (layer carta) applicano gli effetti delle carte; gli ultimi due (layer campo) applicano i modificatori statistici del Campo di Battaglia.

**3.1 — Verifica Trigger**

Si verificano tutti i trigger di entrambi gli Agenti, tenendo conto delle condizioni ambientali del Pre-turno.

**3.2 — Poteri**

- Potere del Primo Giocatore (se trigger soddisfatto e non bloccato)
- Potere del Secondo Giocatore (se trigger soddisfatto e non bloccato)

**3.3 — Bonus Armata**

- Bonus Armata del Primo Giocatore (se attivo)
- Bonus Armata del Secondo Giocatore (se attivo)

**3.4 — Modificatori Statistici del Campo**

Si applicano i modificatori di POT e DAN del Campo di Battaglia attivo. Include anche gli effetti condizionali al trigger (es. Centrale Energetica applica +1 DAN a entrambi se Overdrive e stato verificato in 3.1).

> I modificatori del campo si applicano **dopo** i Poteri e i Bonus Armata. Il campo e lo strato ambientale che ha l'ultima parola sulle statistiche.

**3.5 — Finalizzazione Statistiche**

Si applicano in ordine:
1. **Specchio dell'Anima** — azzera tutti i modificatori di POT e DAN (da Poteri, Bonus e Campo)
2. **Inversione** — inverte il totale netto dei modificatori esterni ricevuti (da effetti nemici e dal Campo)
3. **Floor Min X** — nessuna statistica puo scendere sotto il proprio limite minimo dichiarato

> **Importante:** Gli effetti statistici (es. +2 POT) restano attivi solo finche il Potere o Bonus che li genera e attivo. Se un Potere viene bloccato, i suoi bonus statistici vengono annullati.

### Fase 4: Calcolo Valore Assalto

Per ogni giocatore:
```
VA = (POT + modificatori POT) x FC investiti + modificatori VA
```

I modificatori VA del Campo (es. Porte di Atlantide, Cimitero di Stelle, Biblioteca Proibita, Sanctum dell'Equilibrio) si applicano in questa fase, dopo il calcolo della formula base.

> **Minimo VA:** Il VA non puo mai essere inferiore alla POT base dell'Agente.

### Fase 5: Risoluzione Scontro

- Chi ha il **VA piu alto** vince lo scontro
- In caso di **parita VA**, vince chi ha la **Lega piu bassa**
- Se anche la Lega e pari, vince chi ha la **POT piu bassa**
- Se VA, Lega e POT sono pari, vince chi ha **giocato per secondo**

### Fase 6: Conseguenze

**Il vincitore:**
- Conquista il campo di battaglia
- Infligge il proprio DAN (+ modificatori) ai PV dell'avversario
- Attiva eventuali effetti "Conquista"

**Il perdente:**
- Subisce il DAN del vincitore
- Attiva eventuali effetti "Ultimo Desiderio"

Gli effetti del Campo basati sull'esito si attivano in questa fase (es. Canyon delle Lame: +2 DAN al vincitore; Altare del Sacrificio: 2 Danni dir. extra al perdente; Trono dei Re Caduti: 1 Danni dir. al vincitore; Nido della Regina: +1 ai DAN diretti).

### Fase 7: Post-combattimento

1. Si applicano gli effetti del Campo che modificano PV e FC in base all'esito (es. Miniera di Lacrime, Nido di Spine, Cripta dei Sussurri, Torre d'Avorio, Voragine Infinita, Fonte del Mana, ecc.)
2. L'auto-danno subito in questo scontro e ora definitivo — si verifica se attiva Rimonta per il turno successivo
3. Gli Agenti usati vengono scartati
4. Si verifica se qualcuno ha raggiunto una condizione di vittoria
5. L'ordine di gioco si inverte (chi era secondo diventa primo)
6. Inizia il turno successivo

---

## REGOLE DETTAGLIATE

### Focus Coin (FC)

- Ogni giocatore ha **18 FC totali** per l'intera partita
- I FC spesi **non si recuperano**
- Devi investire **almeno 1 FC** per ogni scontro
- Gestire i FC e cruciale: spendere troppo presto lascia senza risorse

### Bonus Armata

- Si attiva se hai **2 o piu Agenti della stessa armata** nella mano
- Conta sia le carte in mano che le carte gia giocate/scartate (purche fossero nella mano iniziale)
- Il bonus resta attivo per tutta la partita se la mano iniziale contiene 2+ carte dell'armata

### Trigger

| Trigger | Quando si attiva |
|---------|------------------|
| **Imboscata** | Sei stato il primo a scegliere l'Agente |
| **Intervento** | Sei stato il secondo a scegliere l'Agente |
| **Gloria** | Hai vinto lo scontro del turno precedente |
| **Vendetta** | Hai perso lo scontro del turno precedente |
| **Overdrive** | Hai investito 5 o piu FC in questo scontro |
| **Resa dei conti** | Si attiva dal 3° scontro (entrambi hanno gia giocato 2 carte) |
| **Rimonta** | Hai meno PV dell'avversario (prima dello scontro) |
| **Magnanimo** | Hai piu PV dell'avversario (prima dello scontro) |
| **Ultimo Desiderio** | Stai perdendo questo scontro |
| **Conquista** | Stai vincendo questo scontro |

### Effetto "Minimo" (min X)

Gli effetti di riduzione con (min X) non possono portare la statistica sotto X.

**Esempio:** "-2 DAN nem. (min 2)" contro DAN 5 lo riduce a 3. Contro DAN 2, non fa nulla.

> **Importante:** Se la statistica e gia sotto il minimo, l'effetto non la alza. Il minimo e un limite inferiore, non un valore target.

### Immune

L'Agente con Immune ignora:
- Riduzioni a POT (-X POT nem.)
- Riduzioni a DAN (-X DAN nem.)
- Riduzioni a VA (-X VA nem.)

L'Agente con Immune **non ignora:**
- Blocca Potere (il suo Potere puo essere bloccato)
- Blocca Bonus (il suo Bonus Armata puo essere bloccato)
- Il combattimento normale (puo comunque perdere per VA inferiore)
- I danni diretti inflitti ai PV

### Danni Diretti

I danni diretti (X Danni dir.) vengono inflitti ai PV dell'avversario indipendentemente dall'esito dello scontro:
- Si attivano quando il trigger e soddisfatto
- **Non** sono ridotti da effetti come -X DAN nem.
- Bypassano completamente il combattimento

### Copia

| Effetto | Cosa succede |
|---------|--------------|
| **Copia POT** | La tua POT diventa uguale alla POT nemica nel momento in cui il tuo Potere si risolve (passo 3.2) |
| **Copia DAN** | Il tuo DAN diventa uguale al DAN nemico nel momento in cui il tuo Potere si risolve (passo 3.2) |
| **Copia Potere** | Usi il Potere dell'Agente nemico con i suoi trigger |
| **Copia Bonus** | Usi il Bonus Armata nemico (se attivo per lui) |

> **Ordine:** Prima si risolvono i Poteri (incluse le copie), poi i Bonus Armata.

---

## INTERAZIONI SPECIALI

### Blocca Potere vs Immune

- Blocca Potere **funziona** contro un Agente con Immune
- Immune protegge solo dalle riduzioni statistiche, non dai blocchi
- L'Agente Immune puo perdere il suo Potere se viene bloccato

### Blocca Bonus vs Copia Bonus

- Se il tuo Bonus e "Copia Bonus nemico" e il nemico ha Blocca Bonus:
  - Il tuo Copia Bonus copia comunque il bonus originale del nemico
  - Ma il Blocca Bonus annulla il bonus che stai copiando
  - Risultato: non ottieni nulla

### Copia Potere con Trigger

Quando copi un Potere, copi anche il suo trigger. Se il trigger non e soddisfatto per te, il Potere copiato non si attiva.

**Esempio:** Copi un Potere con trigger "Vendetta", ma tu hai vinto lo scontro precedente. Il Potere copiato non si attiva.

### Inversione e Copia POT/DAN

Quando usi Copia POT o Copia DAN, il valore copiato diventa la tua nuova statistica base per questo scontro. Non e un modificatore esterno ricevuto, ma il tuo valore di partenza nel momento della copia.

**Conseguenza:** Inversione non inverte il valore copiato. Inversione agisce sui modificatori ricevuti successivamente (da Bonus Armata, Campo), non sul valore che e gia diventato tuo.

**Esempio:** Hai Copia POT e Inversione. Copi la POT nemica (es. 7) — ora la tua POT e 7. Se poi il Campo ti da -2 POT, Inversione lo converte in +2 POT. Ma il 7 di partenza non viene toccato.


### Rimonta/Magnanimo a PV Pari

- Se i PV sono **esattamente pari**, ne Rimonta ne Magnanimo si attivano
- Servono PV strettamente maggiori o minori

### Gloria/Vendetta al Turno 1

- Al primo turno, nessuno ha vinto o perso scontri precedenti
- Quindi Gloria e Vendetta **non si attivano** al turno 1

### Auto-danno e Rimonta

- L'auto-danno (-X PV a te) puo portarti sotto i PV dell'avversario
- Questo attiva Rimonta per le carte successive
- L'auto-danno si risolve come effetto post-scontro

### Effetti Multipli dello Stesso Tipo

Gli effetti dello stesso tipo si sommano:
- Due +2 POT = +4 POT totale
- -5 VA (bonus) + -8 VA (potere) = -13 VA totale

**Riduzioni con Minimo:** Quando piu effetti di riduzione con (min X) si applicano alla stessa statistica, si sommano i valori di riduzione e si usa il minimo piu restrittivo (il piu alto).

**Esempio:** Bonus Legione "-2 DAN nem. (min 2)" + Fortezza "-2 DAN nem. (min 1)" = -4 DAN nem. (min 2). Contro DAN 5, il risultato e 2 (non 1).

### Ordine dei Modificatori

All'interno di ogni passo della Fase 3, i modificatori si applicano in questo sotto-ordine:

1. Prima si applicano tutti i buff (al proprio Agente)
2. Poi si applicano tutti i debuff (all'Agente nemico)

Per il quadro completo vedere la sequenza dei passi 3.1-3.5 nella sezione Struttura di un turno.

---

## CASI SPECIALI

### Fine FC

Se hai meno FC di quanti scontri rimangono:
- Devi comunque investire almeno 1 FC per scontro
- Se hai 0 FC, non puoi piu combattere (perdi automaticamente gli scontri rimanenti)
- Effetti come +X FC possono darti FC extra

### Costruzione Deck Mista

- Puoi includere carte di armate diverse nel tuo Deck
- Il Bonus Armata si attiva per ogni armata con 2+ carte nella mano
- Se hai 2+ carte di piu armate in mano, tutti i relativi bonus sono attivi

### Pareggio di VA

In caso di VA identico:
1. Vince chi ha **Lega piu bassa**
2. Se pari, vince chi ha **POT piu bassa**
3. Se ancora pari, vince chi ha **giocato per secondo**

### Danni che Portano a 0 PV

- Se subisci danni che portano i tuoi PV a 0 o meno, perdi immediatamente
- Questo puo succedere anche se stai vincendo per terreni
- Controlla sempre i tuoi PV!

### Terreni al Turno 5

- Se nessuno ha 3 terreni alla fine del turno 4, la condizione cambia
- I terreni conquistati **non contano piu** per la vittoria
- Conta solo chi ha piu PV a fine turno (dal turno 5 in poi)

---

## RIASSUNTO RAPIDO

```
COSTRUZIONE MAZZO
- 10 carte, massimo 30 punti Lega totali

SETUP
- 25 PV, 18 FC per giocatore
- Pesca 5 carte dal Deck di 10
- Va prima chi ha Lega totale in mano piu bassa (parita: casuale)

TURNO DI GIOCO (un round = uno scontro completo sul campo)
PRE-TURNO: stabilisci condizioni ambientali del campo
1. Primo giocatore: sceglie Agente (visibile) + FC (segreto)
2. Secondo giocatore: sceglie Agente (visibile) + FC (segreto)
3. Rivela FC
4. [3.1] Verifica trigger
5. [3.2] Poteri P1 poi P2
6. [3.3] Bonus armata B1 poi B2
7. [3.4] Modificatori statistici del campo
8. [3.5] Finalizzazione: Specchio / Inversione / Min X
9. Calcola VA (POT x FC + modificatori VA del campo)
10. Chi ha VA piu alto vince
11. Parita: vince Lega minore, poi POT minore, poi chi ha giocato per secondo
12. Vincitore infligge DAN, conquista campo, effetti Fase 6
13. Effetti PV/FC del campo (Fase 7), scarta Agenti, inverti ordine

VITTORIA
- Turni 1-4: 3 terreni
- Turni 5+: Piu PV a fine turno
- Sempre: Avversario a 0 PV
```

---

*Ultimo aggiornamento: Aprile 2026*
