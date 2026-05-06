# SATZE - NUOVE MECCANICHE

*Versione 1.0 - Gennaio 2026*

---

## NUOVI TRIGGER

### Tabella Riassuntiva

| Trigger | Condizione | Momento Verifica |
|---------|------------|------------------|
| **Opportunista** | Il nemico ha speso 5+ FC questo turno | Dopo rivelazione FC |
| **Sfida** | La tua Lega è inferiore a quella nemica | Fase 3 |
| **Sopraffare** | La tua Lega è superiore a quella nemica | Fase 3 |
| **Invasione** | Hai conquistato 1+ campi | Inizio turno |
| **Resistenza** | Il nemico ha conquistato 1+ campi | Inizio turno |
| **Turbo** | Turno 1 o 2 | Inizio turno |
| **Ultima Chance** | Turno 5+ | Inizio turno |

---

### Descrizioni Dettagliate

#### Opportunista
> Si attiva quando il nemico ha speso 5 o più FC in questo scontro.

**Note:**
- È il "mirror" di Overdrive: punisce chi spende molto invece di premiarlo
- Verificato dopo la rivelazione simultanea dei FC
- Permette di costruire carte "anti-Overdrive"

#### Sfida
> Si attiva quando la tua carta ha Lega inferiore a quella nemica.

**Note:**
- Informazione pubblica: entrambi i giocatori sanno se si attiverà
- Premia il "giocare sotto-lega" con carte più deboli
- Ideale per carte Lega 2-3 che affrontano Lega 4-5

#### Sopraffare
> Si attiva quando la tua carta ha Lega superiore a quella nemica.

**Note:**
- Opposto di Sfida
- Premia lo snowball: i forti diventano più forti contro i deboli
- Ideale per carte Lega 4-5 che consolidano il vantaggio

#### Invasione
> Si attiva se hai conquistato almeno 1 campo di battaglia.

**Note:**
- Non attivo al turno 1 (non hai ancora conquistato nulla)
- Premia chi sta già vincendo territorialmente
- Diventa più affidabile man mano che conquisti

#### Resistenza
> Si attiva se il nemico ha conquistato almeno 1 campo di battaglia.

**Note:**
- Trigger "comeback": si attiva quando sei in svantaggio territoriale
- Non attivo al turno 1
- Speculare a Invasione

#### Turbo
> Si attiva solo durante i turni 1 e 2.

**Note:**
- Finestra molto stretta (2 turni su potenzialmente 10)
- Permette carte con effetti potenti ma limitati all'early game
- Dal turno 3 in poi, la carta funziona solo come "corpo"

#### Ultima Chance
> Si attiva dal turno 5 in poi (quando la condizione di vittoria diventa Supremazia).

**Note:**
- Trigger garantito nel late game
- Si "sveglia" proprio quando la partita entra nella fase decisiva
- Nessun effetto nei turni 1-4

---

### Moltiplicatori per Bilanciamento

| Trigger | Moltiplicatore | Affidabilità | Ragionamento |
|---------|----------------|--------------|--------------|
| **Opportunista** | 0.5 | Dipende dal nemico | Non controllabile; il nemico potrebbe non spendere 5+ FC |
| **Sfida** | 0.6 | Prevedibile | Richiede deckbuilding specifico; informazione pubblica |
| **Sopraffare** | 0.6 | Prevedibile | Come Sfida |
| **Invasione** | 0.5 | Variabile | Non attivo T1; richiede vittorie precedenti |
| **Resistenza** | 0.5 | Variabile | Come Invasione, versione "comeback" |
| **Turbo** | 0.3 | Molto limitato | Solo 2 turni su 5-10; finestra strettissima |
| **Ultima Chance** | 0.4 | Garantito tardi | Inattivo T1-4; garantito dal T5 |

---

## NUOVI EFFETTI

### Tabella Riassuntiva

| Effetto | Descrizione | Formato su Carta |
|---------|-------------|------------------|
| **Escalation** | +X [STAT] per ogni campo conquistato da te | "Escalation 2 POT" |
| **Attrizione** | +X [STAT] per ogni tua carta già giocata | "Attrizione 1 DAN" |
| **Inversione** | I modificatori esterni sono invertiti | "Inversione" |

---

### Descrizioni Dettagliate

#### Escalation X [STAT]
> Guadagni +X alla statistica specificata per ogni campo di battaglia che hai conquistato.

| Campi Conquistati | Escalation 1 | Escalation 2 |
|-------------------|--------------|--------------|
| 0 | +0 | +0 |
| 1 | +1 | +2 |
| 2 | +2 | +4 |

**Note:**
- Nessun cap massimo
- La statistica (POT e/o DAN) va specificata
- Può applicarsi a più statistiche: "Escalation 1 POT, 1 DAN"
- Effetto "snowball": premia chi sta già vincendo

**Esempi di carte:**
- "Escalation 2 POT" con 2 campi = +4 POT
- "Escalation 1 POT, 1 DAN" con 1 campo = +1 POT, +1 DAN

#### Attrizione X [STAT]
> Guadagni +X alla statistica specificata per ogni carta che HAI già giocato in questa partita.

| Carte Giocate | Turno Tipico | Attrizione 1 |
|---------------|--------------|--------------|
| 0 | T1 | +0 |
| 1 | T2 | +1 |
| 2 | T3 | +2 |
| 3 | T4 | +3 |
| 4 | T5 | +4 |

**Note:**
- Conta SOLO le tue carte (non quelle del nemico)
- Cresce naturalmente durante la partita
- Debole all'inizio, potentissimo nel late game
- Sinergia naturale con Ultima Chance

**Esempi di carte:**
- "Attrizione 1 DAN" al turno 5 (4 carte giocate) = +4 DAN

#### Inversione
> Tutti i modificatori esterni (da effetti nemici e campi di battaglia) che questa carta riceve sono invertiti: i buff diventano debuff, i debuff diventano buff.

**Cosa viene invertito:**
- ✓ Debuff nemici (-X POT/DAN/VA → +X POT/DAN/VA)
- ✓ Buff da campi (+X → -X)
- ✓ Debuff da campi (-X → +X)

**Cosa NON viene invertito:**
- ✗ Il proprio Potere
- ✗ Il proprio Bonus Armata
- ✗ Danni diretti (non sono modificatori)
- ✗ Blocca Potere/Blocca Bonus (non sono modificatori numerici)

**Esempi:**
- Nemico usa -3 POT → Diventa +3 POT per te
- Campo dà +2 DAN a entrambi → Per te diventa -2 DAN
- Campo dà -2 POT a entrambi → Per te diventa +2 POT

**Interazione con Immune:**
- Inversione e Immune sono effetti diversi
- Immune ignora i debuff; Inversione li converte in buff
- Una carta può avere entrambi? Tecnicamente sì, ma Immune renderebbe Inversione parzialmente ridondante (i debuff sarebbero già ignorati)

---

### Valori per Bilanciamento

#### Escalation

Il valore dipende dal numero medio di campi conquistati quando la carta viene giocata.

| Momento | Campi Medi | Escalation 1 POT | Valore FC |
|---------|------------|------------------|-----------|
| Early (T1-2) | 0.5 | +0.5 POT | 0.25 FC |
| Mid (T3-4) | 1.5 | +1.5 POT | 0.75 FC |
| Late (T5+) | 2.0 | +2.0 POT | 1.00 FC |

**Stima media ponderata:** ~0.65 FC per "Escalation 1 POT"

**Formula proposta:**
```
Valore Escalation = X × 0.5 (per POT) o X × 0.35 (per DAN) × ~1.3 (media campi)
```

#### Attrizione

Il valore dipende dal turno medio in cui la carta viene giocata.

| Turno | Carte Giocate | Attrizione 1 DAN | Valore FC |
|-------|---------------|------------------|-----------|
| T1 | 0 | +0 | 0 |
| T2 | 1 | +1 | 0.35 FC |
| T3 | 2 | +2 | 0.70 FC |
| T4 | 3 | +3 | 1.05 FC |
| T5 | 4 | +4 | 1.40 FC |

**Stima media ponderata:** ~0.70 FC per "Attrizione 1 DAN" (assumendo distribuzione uniforme)

**Formula proposta:**
```
Valore Attrizione = X × 0.5 (per POT) o X × 0.35 (per DAN) × ~2 (media carte giocate)
```

#### Inversione

Valore molto variabile, dipende da:
- Quanti debuff il nemico può infliggere
- Quali campi escono
- Se il nemico evita di usare debuff contro questa carta

**Stima conservativa:** ~1.00 FC

**Ragionamento:**
- Contro deck debuff-heavy (Ratti): valore alto (~2.0 FC)
- Contro deck senza debuff: valore nullo (0 FC)
- Media ponderata con incertezza tattica: ~1.00 FC

---

## NOTE DI DESIGN

### Sinergie Interessanti

| Combinazione | Effetto |
|--------------|---------|
| Turbo + malus forte | Carta potente T1-2 con downside, poi solo corpo |
| Ultima Chance + Attrizione | Doppio scaling nel late game |
| Invasione + Escalation | Triplo snowball (trigger + effetto + vantaggio territoriale) |
| Resistenza + Inversione | Comeback: sei in svantaggio ma converti debuff in buff |
| Sfida + corpo forte | Carte Lega bassa con stats alte che battono Lega alte |

### Contrasti Tematici

| Coppia | Filosofia |
|--------|-----------|
| Sfida / Sopraffare | Underdog vs Oppressore |
| Invasione / Resistenza | Aggressore vs Difensore |
| Turbo / Ultima Chance | Early game vs Late game |
| Overdrive / Opportunista | Spendi molto vs Punisci chi spende molto |

### Elementi Non Catturati dai Numeri

1. **Bluff con Inversione** — Il nemico potrebbe evitare di usare debuff
2. **Prevedibilità di Sfida/Sopraffare** — Informazione pubblica cambia le scelte
3. **Timing di Turbo** — Costretto a giocare la carta presto
4. **Pressione di Ultima Chance** — Incentiva a chiudere prima del T5

---

## RIEPILOGO RAPIDO

### Trigger — Per il Glossario

| Trigger | Condizione |
|---------|------------|
| **Opportunista** | Il nemico ha speso 5+ FC questo turno |
| **Sfida** | La tua Lega è inferiore a quella nemica |
| **Sopraffare** | La tua Lega è superiore a quella nemica |
| **Invasione** | Hai conquistato 1+ campi |
| **Resistenza** | Il nemico ha conquistato 1+ campi |
| **Turbo** | Turno 1 o 2 |
| **Ultima Chance** | Turno 5+ |

### Effetti — Per il Glossario

| Effetto | Descrizione |
|---------|-------------|
| **Escalation X [STAT]** | +X [STAT] per ogni campo che hai conquistato |
| **Attrizione X [STAT]** | +X [STAT] per ogni carta che hai già giocato |
| **Inversione** | I modificatori esterni (da nemico e campo) sono invertiti |

### Moltiplicatori — Per il Bilanciamento

| Trigger | Moltiplicatore |
|---------|----------------|
| Opportunista | 0.5 |
| Sfida | 0.6 |
| Sopraffare | 0.6 |
| Invasione | 0.5 |
| Resistenza | 0.5 |
| Turbo | 0.3 |
| Ultima Chance | 0.4 |

### Valori Effetti — Per il Bilanciamento

| Effetto | Valore Stimato |
|---------|----------------|
| Escalation 1 POT | ~0.65 FC |
| Escalation 1 DAN | ~0.45 FC |
| Attrizione 1 POT | ~1.00 FC |
| Attrizione 1 DAN | ~0.70 FC |
| Inversione | ~1.00 FC |

---

*Documento di lavoro — Da integrare in GLOSSARIO.md e BILANCIAMENTO.md*
