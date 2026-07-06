# SATZE - SISTEMA DI BILANCIAMENTO COMPLETO

*Versione 2.1 - Maggio 2026*

---

> Nota: questo documento e un modello di bilanciamento (formule + euristiche operative).
> Per la fotografia reale e aggiornata di trigger/effetti presenti nelle carte, usare `FRAMEWORK_IDENTITA_ARMATE_v2.md`.
> Per fasi, tempistiche e attivazioni del duello (gameplay), vedere **[DUELLO_FASI.md](../DUELLO_FASI.md)** — Parte I per validazione carte, Parte II per il motore.
> Se c'e divergenza, **vince il codice** (`src/data/cards.js`, `src/data/armies.js`, `src/game/triggerLogic.js`).

---

## INDICE

1. [Definizioni e Parametri](#definizioni-e-parametri)
2. [Snapshot Dati Reali (Maggio 2026)](#snapshot-dati-reali-maggio-2026)
3. [Protocollo Mechanics-First](#protocollo-mechanics-first)
4. [Unita di Misura e Formule](#unita-di-misura-e-formule)
5. [Valori Statistiche](#valori-statistiche)
6. [Trigger Completi](#trigger-completi)
7. [Effetti Completi](#effetti-completi)
8. [Bonus Armata](#bonus-armata)
9. [Soglie e Principi di Design](#soglie-e-principi-di-design)
10. [Guida alla Valutazione](#guida-alla-valutazione)
11. [Esempi Pratici](#esempi-pratici)
12. [Carte da Monitorare](#carte-da-monitorare)

---

## DEFINIZIONI E PARAMETRI

### Terminologia

| Termine | Significato |
|---------|-------------|
| **Valore Effettivo** | Valore medio considerando la probabilita di attivazione dei trigger |
| **Valore Potenziale** | Valore massimo quando Potere E Bonus Armata sono entrambi attivi |
| **Efficienza (Eff)** | Valore Totale / Lega |
| **Body** | Statistiche base della carta (POT + DAN) |
| **Corpo** | Sinonimo di Body |

> **Importante:** Entrambi i valori (Effettivo e Potenziale) devono essere considerati nella valutazione di una carta. Il valore effettivo indica la performance media, il valore potenziale indica il ceiling della carta.

### Allineamento con il motore (chiavi codice)

Per evitare ambiguita tra documentazione e implementazione:
- i nomi in tabella (es. "Intervento", "Resa dei conti") sono etichette di design/UI;
- il motore usa chiavi tecniche in `ability.trigger` e `ability.effect`.

| Etichetta design | Chiave trigger nel codice |
|------------------|---------------------------|
| Imboscata | `imboscata` |
| Intervento | `intervention` |
| Gloria | `glory` |
| Vendetta | `vendetta` |
| Rimonta | `rimonta` |
| Magnanimo | `magnanimous` |
| Overdrive | `overdrive` |
| Resa dei conti | `reckoning` |
| Ultimo Desiderio | `lastWish` |
| Conquista | `conquest` |
| Opportunista | `opportunista` |
| Sfida | `sfida` |
| Sopraffare | `sopraffare` |
| Invasione | `invasione` |
| Resistenza | `resistenza` |
| Turbo | `turbo` |
| Ultima Chance | `ultimaChance` |
| Rinforzi | `rinforzi` |

| Etichetta design | Chiave effect nel codice |
|------------------|--------------------------|
| +POT / +DAN / +VA | `power`, `damage`, `assaultValue`, `powerAndDamage` |
| Debuff nemico | `enemyPower`, `enemyDamage`, `enemyAssault`, `enemyPowerAndDamage` |
| Copie | `copyPower`, `copyDamage`, `copyAbility`, `copyBonus` |
| Blocchi | `blockAbility`, `blockBonus` |
| Utility | `immune`, `focusCoin`, `heal`, `selfDamage`, `directDamage` |
| Scaling / conversione | `escalation`, `attrition`, `inversion`, `imponiPower`, `imponiDamage` |
| Tossina | `toxin` |

**Nota migrazione trigger (legacy -> attuale):**
`turbo` -> `imboscata`, `ambush` -> `vendetta`, `vendetta` -> `rimonta`, `turboRound` -> `turbo`.

### Parametri di Gioco

| Risorsa | Valore |
|---------|--------|
| Punti Vita iniziali | 25 PV |
| Focus Coin iniziali | 18 FC |
| Carte per deck | 10 |
| Limite Lega totale | 30 punti |
| Round/Scontri per partita | max 5 |
| Turni per Supremazia | dal turno 5 |

---

## SNAPSHOT DATI REALI (MAGGIO 2026)

Fonte: `src/data/cards.js`, `src/data/armies.js`, `src/game/triggerLogic.js`, `src/data/gameModes.js`.

### Perimetro dataset

| Perimetro | Armate | Carte |
|-----------|--------|-------|
| Core live | 8 | 160 |
| Estensioni/prototipi | 2 (`Patto degli Indocili`, `Khemet`) | 41 |
| Totale repository | 10 | 201 |

### Distribuzione trigger (core live, 160 carte)

| Trigger | Count | % |
|---------|-------|---|
| Rimonta | 20 | 12.5% |
| Sempre attivo | 18 | 11.3% |
| Imboscata | 18 | 11.3% |
| Intervento | 16 | 10.0% |
| Resa dei conti | 12 | 7.5% |
| Gloria | 11 | 6.9% |
| Ultimo desiderio | 10 | 6.3% |
| Conquista | 9 | 5.6% |
| Ultima Chance / Magnanimo / Overdrive | 7 ciascuno | 4.4% |
| Turbo / Opportunista / Sfida | 5 ciascuno | 3.1% |
| Invasione | 4 | 2.5% |
| Sopraffare | 3 | 1.9% |
| Resistenza | 2 | 1.3% |
| Vendetta | 1 | 0.6% |

### Distribuzione effetti (core live, 160 carte)

| Effetto | Count | % |
|---------|-------|---|
| `power` | 29 | 18.1% |
| `directDamage` | 21 | 13.1% |
| `focusCoin` | 12 | 7.5% |
| `powerAndDamage` | 12 | 7.5% |
| `enemyPower` | 10 | 6.3% |
| `blockAbility` | 8 | 5.0% |
| `heal` | 7 | 4.4% |
| `enemyAssault` / `blockBonus` / `damage` | 6 ciascuno | 3.8% |
| `assaultValue` / `attrition` / `copyPower` / `enemyDamage` | 5 ciascuno | 3.1% |
| `escalation` / `immune` / `selfDamage` / `toxin` | 4 ciascuno | 2.5% |
| `inversion` / `copyAbility` | 3 ciascuno | 1.9% |
| `copyBonus` | 1 | 0.6% |

### Distribuzione leghe (core live, 160 carte)

| Lega | Carte | % |
|------|-------|---|
| L2 | 48 | 30.0% |
| L3 | 48 | 30.0% |
| L4 | 40 | 25.0% |
| L5 | 24 | 15.0% |

Nota: nel dataset totale repository (201 carte) compaiono anche effetti/trigger oggi marginali nel core, ad esempio `imponiPower`, `imponiDamage`, `enemyPowerAndDamage` e una maggiore densita di `sfida`/`turbo` dovuta ai prototipi.

---

## PROTOCOLLO MECHANICS-FIRST

Ordine obbligatorio quando valuti una carta nuova o una modifica:

1. **Timing trigger:** pre-duello o post-duello.
2. **Bersaglio effettivo:** cosa puo ancora essere modificato in quella fase.
3. **Spendibilita valore:** il valore e spendibile entro la partita attuale (5 round).
4. **Solo dopo:** convergenza/situazionale/asso, bilanciamento, flavour.

### Regole hard

- Se il trigger e post-duello (`conquest`, `lastWish`), non trattare come valido per il duello appena finito un effetto su `enemyPower`, `enemyDamage`, `enemyAssault` (salvo persistenza esplicita).
- Con `maxRounds: 5`, effetti economia su `ultimaChance` (`round >= 5`) sono spesso **dead value** se non spendibili nello stesso round.
- Non validare mai una proposta senza esplicitare: **fase**, **impatto reale**, **vincolo round**.

### Formato minimo di giudizio (nuove carte)

- `Validita tecnica`: valida / non valida (con motivo fase-timing).
- `Utilita reale`: utile / dead value / situazionale.
- `Coerenza armata`: convergente / situazionale / asso.
- `Rischio`: win-more / non-fun / mismatch meccanico.

---

## UNITA DI MISURA E FORMULE

### Unita Base

Il sistema usa **1 FC come unita base** di valore.

**Motivazione:** I FC sono la risorsa finita, universale e quantificabile che determina ogni decisione nel gioco.

### Formula Valore Effettivo (medio)

```
Valore Effettivo = Body Base + (Potere x Trigger) + (Bonus x Trigger Bonus)

Dove:
- Body Base = (POT x 0.5) + (DAN x 0.35)
- Potere x Trigger = Valore Effetto x Moltiplicatore Trigger
- Bonus x Trigger Bonus = Valore Bonus x Moltiplicatore Trigger Bonus
```

### Formula Valore Potenziale (massimo)

```
Valore Potenziale = Body Potenziato + Potere + Bonus

Dove:
- Body Potenziato = (POT + mod POT potere + mod POT bonus) x 0.5 + (DAN + mod DAN potere + mod DAN bonus) x 0.35
- Potere = Valore Effetto pieno (trigger = 1.0)
- Bonus = Valore Bonus pieno (trigger = 1.0)
```

### Formula Efficienza

```
Efficienza Effettiva = Valore Effettivo / Lega
Efficienza Potenziale = Valore Potenziale / Lega
```

---

## VALORI STATISTICHE

### Buff (potenziamento proprio)

| Statistica | Valore per punto | Motivazione |
|------------|------------------|-------------|
| **+1 POT** | 0.50 FC | Stat gateway, scala con FC investiti |
| **+1 DAN** | 0.35 FC | Valore per Supremazia, richiede vittoria |
| **+1 VA** | 0.28 FC | Non scala, meno efficiente di POT |
| **+1 FC** | 0.70 FC | Valore differito; decresce molto nei round tardi |
| **1 DAN diretto** | 0.50 FC | Garantito, bypassa combattimento |
| **Cura 1 PV** | 0.20 FC | Difensivo, non aiuta a vincere |
| **-1 PV (auto)** | -0.20 FC | Costo puro |

### Debuff (applicati al nemico)

| Effetto | Valore per punto | Note |
|---------|------------------|------|
| **-1 POT nem.** | 0.50 FC | Equivalente a +1 POT |
| **-1 DAN nem.** | 0.35 FC | Equivalente a +1 DAN |
| **-1 VA nem.** | 0.28 FC | Equivalente a +1 VA |

### Effetto "Minimo" (min X)

Gli effetti con minimo hanno efficacia ridotta:

| Minimo | Efficacia stimata | Esempio |
|--------|-------------------|---------|
| min 1-2 | ~80% | -3 POT nem. (min 2) |
| min 3-4 | ~70% | -2 DAN nem. (min 3) |
| min 5-6 | ~55% | -12 VA nem. (min 6) |

**Formula con minimo:**
```
Valore = Valore Base x Efficacia Minimo
```

### Decadimento valore economia per round (max 5)

Per evitare sovrastima di `focusCoin` nei turni finali:

| Round attivazione | Coefficiente spendibilita FC |
|-------------------|------------------------------|
| T1 | 1.00 |
| T2 | 0.90 |
| T3 | 0.75 |
| T4 | 0.45 |
| T5 | 0.20 |

Formula pratica:
```
Valore FC reale = FC nominale x coefficiente round
```

Esempio:
```
Ultima Chance: +3 FC a T5 = 3 x 0.70 x 0.20 = 0.42 FC reali
```

---

## TRIGGER COMPLETI

### Tabella Riassuntiva

| Trigger | Moltiplicatore | Categoria | Controllo | Finestra |
|---------|----------------|-----------|-----------|----------|
| **Sempre attivo** | 1.0 | - | Totale | Sempre |
| **Imboscata** | 0.7 | Posizione | Parziale | Sempre |
| **Intervento** | 0.7 | Posizione | Parziale | Sempre |
| **Gloria** | 0.6 | Esito prec. | Bassa | Sempre |
| **Vendetta** | 0.6 | Esito prec. | Bassa | Sempre |
| **Conquista** | 0.6 | Esito corr. (post) | Media | Sempre |
| **Ultimo Desiderio** | 0.6 | Esito corr. (post) | Media | Sempre |
| **Sfida** | 0.6 | Lega | Totale | Sempre |
| **Sopraffare** | 0.6 | Lega | Totale | Sempre |
| **Resa dei conti** | 0.5 | Temporale | Totale | T3+ |
| **Overdrive** | 0.5 | Risorse | Totale | Sempre |
| **Opportunista** | 0.5 | Risorse | Nessuna | Sempre |
| **Invasione** | 0.5 | Stato campi | Bassa | T2+ |
| **Resistenza** | 0.5 | Stato campi | Nessuna | T2+ |
| **Rimonta** | 0.4 | Stato PV | Bassa | Variabile |
| **Magnanimo** | 0.4 | Stato PV | Bassa | Variabile |
| **Ultima Chance** | 0.4 | Temporale | Totale | T5+ |
| **Turbo** | 0.3 | Temporale | Totale | T1-2 |

---

### Descrizioni Dettagliate

#### CATEGORIA: POSIZIONE

| Trigger | Condizione | Note |
|---------|------------|------|
| **Imboscata** | Sei il primo a scegliere | 50% controllabile, dipende dall'ordine |
| **Intervento** | Sei il secondo a scegliere | 50% controllabile, vedi carta nemica |

#### CATEGORIA: ESITO PRECEDENTE

| Trigger | Condizione | Note |
|---------|------------|------|
| **Gloria** | Hai vinto lo scontro precedente | Non attivo T1 |
| **Vendetta** | Hai perso lo scontro precedente | Non attivo T1 |

#### CATEGORIA: ESITO CORRENTE

| Trigger | Condizione | Note |
|---------|------------|------|
| **Conquista** | Vinci questo scontro | Trigger post-duello: si risolve dopo il calcolo VA |
| **Ultimo Desiderio** | Perdi questo scontro | Trigger post-duello: si risolve dopo il calcolo VA |

**Regola pratica:** con trigger post-duello, debuff alle stat nemiche nello stesso scontro non producono impatto reale immediato (salvo persistenza dichiarata).

#### CATEGORIA: LEGA

| Trigger | Condizione | Note |
|---------|------------|------|
| **Sfida** | Tua Lega < Lega nemica | Informazione pubblica, prevedibile |
| **Sopraffare** | Tua Lega > Lega nemica | Informazione pubblica, prevedibile |

**Interazione:** In caso di Lega pari, ne Sfida ne Sopraffare si attivano.

#### CATEGORIA: RISORSE (FC)

| Trigger | Condizione | Note |
|---------|------------|------|
| **Overdrive** | Spendi 5+ FC | Controllabile ma costoso |
| **Opportunista** | Il nemico spende 5+ FC | Non controllabile, counter a Overdrive |

**Momento verifica:** Dopo la rivelazione simultanea dei FC.

#### CATEGORIA: STATO PV

| Trigger | Condizione | Note |
|---------|------------|------|
| **Rimonta** | Hai meno PV del nemico | Verificato prima dello scontro |
| **Magnanimo** | Hai piu PV del nemico | Verificato prima dello scontro |

**Interazione:** Se i PV sono pari, ne Rimonta ne Magnanimo si attivano.

#### CATEGORIA: STATO CAMPI

| Trigger | Condizione | Note |
|---------|------------|------|
| **Invasione** | Hai conquistato 1+ campi | Non attivo T1 |
| **Resistenza** | Il nemico ha conquistato 1+ campi | Non attivo T1 |

**Momento verifica:** Inizio turno (prima della scelta carte).

#### CATEGORIA: TEMPORALE

| Trigger | Condizione | Turni attivi |
|---------|------------|--------------|
| **Turbo** | Turno 1 o 2 | Solo T1-T2 |
| **Resa dei conti** | Entrambi hanno giocato 2+ carte | T3+ |
| **Ultima Chance** | Turno 5+ | T5+ |

---

### Logica dei Moltiplicatori

- `1.0`: Sempre attivo (garantito).
- `0.7`: Imboscata, Intervento (circa 50% controllo).
- `0.6`: Gloria, Vendetta, Conquista, Ultimo Desiderio, Sfida, Sopraffare.
- `0.5`: Resa dei conti, Overdrive, Opportunista, Invasione, Resistenza.
- `0.4`: Rimonta, Magnanimo, Ultima Chance.
- `0.3`: Turbo (finestra strettissima T1-T2).

---

## EFFETTI COMPLETI

### Effetti Speciali (valore fisso)

| Effetto | Valore FC | Tipo | Note |
|---------|-----------|------|------|
| **Immune** | 2.00 | Difensivo | Ignora debuff POT/DAN/VA |
| **Copia Potere** | 1.50 | Adattivo | Scala con forza avversario |
| **Blocca Potere** | 1.50 | Controllo | Neutralizza carte abilita-dipendenti |
| **Copia POT** | 1.50 | Adattivo | Copia POT base nemica |
| **Inversione** | 1.00 | Conversione | Converte debuff in buff (e viceversa) |
| **Copia DAN** | 1.00 | Adattivo | Copia DAN base nemica |
| **Blocca Bonus** | 1.00 | Controllo | Neutralizza Bonus Armata nemico |
| **Copia Bonus** | 0.80 | Adattivo | Copia Bonus Armata nemico |
| **Tossina 1** | 0.35 | Danno differito | Perdita PV progressiva, alto impatto in attrito |

---

### Effetti Scaling (valore variabile)

#### ESCALATION

> **Escalation X [STAT]:** +X [STAT] per ogni campo che hai conquistato.

| Campi | Escalation 1 | Escalation 2 |
|-------|--------------|--------------|
| 0 | +0 | +0 |
| 1 | +1 | +2 |
| 2 | +2 | +4 |

**Valori FC:**

| Effetto | Calcolo | Valore medio |
|---------|---------|--------------|
| Escalation 1 POT | 0.50 x 1.3 (campi medi) | ~0.65 FC |
| Escalation 2 POT | 1.00 x 1.3 | ~1.30 FC |
| Escalation 1 DAN | 0.35 x 1.3 | ~0.45 FC |
| Escalation 2 DAN | 0.70 x 1.3 | ~0.90 FC |

**Note:**
- Nessun cap massimo
- Puo applicarsi a piu stat: "Escalation 1 POT, 1 DAN"
- Effetto snowball: premia chi sta vincendo

---

#### ATTRIZIONE

> **Attrizione X [STAT]:** +X [STAT] per ogni carta che hai gia giocato.

| Carte giocate | Turno tipico | Attrizione 1 | Attrizione 2 |
|---------------|--------------|--------------|--------------|
| 0 | T1 | +0 | +0 |
| 1 | T2 | +1 | +2 |
| 2 | T3 | +2 | +4 |
| 3 | T4 | +3 | +6 |
| 4 | T5 | +4 | +8 |

**Valori FC:**

| Effetto | Calcolo | Valore medio |
|---------|---------|--------------|
| Attrizione 1 POT | 0.50 x 2 (carte medie) | ~1.00 FC |
| Attrizione 2 POT | 1.00 x 2 | ~2.00 FC |
| Attrizione 1 DAN | 0.35 x 2 | ~0.70 FC |
| Attrizione 2 DAN | 0.70 x 2 | ~1.40 FC |

**Note:**
- Conta SOLO le tue carte giocate
- Cresce naturalmente durante la partita
- Attenzione: Attrizione 2 puo diventare molto forte (cap implicito consigliato)

---

#### INVERSIONE

> **Inversione:** I modificatori esterni (da nemico e campo) sono invertiti.

**Cosa viene invertito:**
- Debuff nemici (-X POT/DAN/VA -> +X)
- Buff da campi (+X -> -X)
- Debuff da campi (-X -> +X)

**Cosa NON viene invertito:**
- Il proprio Potere
- Il proprio Bonus Armata
- Danni diretti
- Blocca Potere/Blocca Bonus

**Valore:** ~1.00 FC (alta varianza, dipende dal matchup)

| Scenario | Valore reale |
|----------|--------------|
| vs Deck debuff-heavy (Ratti) | ~2.5 FC |
| vs Deck misto | ~1.0 FC |
| vs Deck senza debuff | ~0 FC |

---

### Tabella Riepilogativa Effetti

| Tipo | Effetto | Valore FC | Variabilita |
|------|---------|-----------|-------------|
| **Buff fisso** | +1 POT | 0.50 | Nessuna |
| **Buff fisso** | +1 DAN | 0.35 | Nessuna |
| **Buff fisso** | +1 VA | 0.28 | Nessuna |
| **Buff fisso** | +1 FC | 0.70 | Nessuna |
| **Debuff fisso** | -1 POT nem. | 0.50 | Nessuna |
| **Debuff fisso** | -1 DAN nem. | 0.35 | Nessuna |
| **Debuff fisso** | -1 VA nem. | 0.28 | Nessuna |
| **Danno** | 1 DAN dir. | 0.50 | Nessuna |
| **Cura** | Cura 1 | 0.20 | Nessuna |
| **Costo** | -1 PV (auto) | -0.20 | Nessuna |
| **Speciale** | Immune | 2.00 | Bassa |
| **Speciale** | Copia Potere | 1.50 | Alta (dipende da nemico) |
| **Speciale** | Blocca Potere | 1.50 | Media |
| **Speciale** | Copia POT | 1.50 | Alta |
| **Speciale** | Copia DAN | 1.00 | Alta |
| **Speciale** | Blocca Bonus | 1.00 | Media |
| **Speciale** | Copia Bonus | 0.80 | Alta |
| **Speciale** | Tossina 1 | 0.35 | Media |
| **Conversione** | Inversione | 1.00 | Molto alta |
| **Scaling** | Escalation 1 POT | 0.65 | Media (campi) |
| **Scaling** | Escalation 1 DAN | 0.45 | Media (campi) |
| **Scaling** | Attrizione 1 POT | 1.00 | Media (turni) |
| **Scaling** | Attrizione 1 DAN | 0.70 | Media (turni) |

---

## BONUS ARMATA

### Tabella Completa (snapshot maggio 2026)

| Armata | Bonus | Trigger | Valore Eff | Valore Pot | Modifica Stats |
|--------|-------|---------|------------|------------|----------------|
| **Figli dell'Orizzonte** | -5 VA nem. (min 6) | Sempre | 0.77 | 0.77 | - |
| **Kethran** | +2 POT | Rimonta | 0.40 | 1.00 | +2/+0 |
| **Corte Rossa** | Copia Bonus nem. | Sempre | 0.80 | 0.80 | - |
| **Calibri Pesanti** | -2 DAN nem. (min 2) | Sempre | 0.70 | 0.70 | - |
| **Orathai** | +2 DAN | Resa dei conti | 0.35 | 0.70 | +0/+2 |
| **Mounthborn** | +1 POT, +1 DAN | Imboscata | 0.59 | 0.85 | +1/+1 |
| **L'Enclave delle Scaglie** | +2 FC | Conquista | 0.84 | 1.40 | - |
| **Ratti della Megera** | Tossina 1 (min 10) | Conquista | 0.21 | 0.35 | - |

> **Nota:** I bonus che modificano le stats proprie (Progenie, Sciame, Circolo) aumentano il Body Potenziato nel calcolo del Valore Potenziale.

### Calcolo con Bonus Armata

Per attivare il Bonus Armata servono **2+ carte della stessa armata** nel deck.

```
Valore con Bonus = Valore Base + (Bonus x Moltiplicatore Trigger Bonus)
```

---

## SOGLIE E PRINCIPI DI DESIGN

### Soglie Corpo (POT + DAN rispetto alla Lega)

| Categoria | Formula | Lega 2 | Lega 3 | Lega 4 | Lega 5 |
|-----------|---------|--------|--------|--------|--------|
| **Mediocre** | <= Lega x 2 - 1 | <=3 | <=5 | <=7 | <=9 |
| **Buona** | = Lega x 2 | 4 | 6 | 8 | 10 |
| **Forte** | >= Lega x 2 + 1 | >=5 | >=7 | >=9 | >=11 |

### Soglie Assolute

| Stat | Mediocre | Buono | Forte | Eccezionale |
|------|----------|-------|-------|-------------|
| **Potenza** | 1-2 | 3-4 | 5-6 | 7+ |
| **Danno** | 1-2 | 3 | 4-5 | 6+ |

### Equilibrio Stats

| Tipo | Differenza POT-DAN |
|------|-------------------|
| **Equilibrata** | <= 2 |
| **Sbilanciata** | >= 3 |

### Principi di Design

1. **Corpo mediocre -> puo avere abilita potente**
2. **Corpo forte -> abilita debole o assente**
3. **Auto-danno = Costo** (non valore strategico nel calcolo)
4. **Carte flagship Lega 5 = Intenzionalmente sopra curva**
5. **Considerare sempre il potenziale con Bonus Armata attivo**
6. **POT e la stat "gateway"** - serve per vincere, vale piu di DAN

### Limiti Consigliati per Nuovi Effetti

| Effetto | Limite | Motivo |
|---------|--------|--------|
| Escalation POT | Max 2 | Evita snowball eccessivo |
| Escalation DAN | Max 1 | DAN scala pericolosamente |
| Attrizione POT | Max 2 | Late game gia forte |
| Attrizione DAN | Max 1 | +4 DAN a T5 e gia molto |
| Inversione | 1-2 carte totali | Counter troppo hard ai debuff |

---

## GUIDA ALLA VALUTAZIONE

### Step 1: Calcola il Body Base

```
Body Base = (POT x 0.5) + (DAN x 0.35)
```

**Esempio:** POT 4, DAN 3
```
Body = (4 x 0.5) + (3 x 0.35) = 2.0 + 1.05 = 3.05 FC
```

### Step 2: Valuta il Potere

1. Determina il **valore dell'effetto** (dalla tabella effetti)
2. Moltiplica per il **moltiplicatore del trigger**

```
Valore Potere = Valore Effetto x Moltiplicatore Trigger
```

**Esempio:** "+2 POT" con trigger "Vendetta"
```
Valore = (2 x 0.5) x 0.6 = 1.0 x 0.6 = 0.6 FC
```

### Step 3: Aggiungi il Bonus Armata (se applicabile)

```
Valore Bonus = Valore Bonus Armata x Moltiplicatore Trigger Bonus
```

**Esempio:** Bonus Sciame (+1 POT, +1 DAN con Imboscata)
```
Valore = (0.5 + 0.35) x 0.7 = 0.85 x 0.7 = 0.59 FC
```

### Step 4: Calcola il Valore Totale

```
Valore Effettivo = Body + Potere + Bonus
Efficienza = Valore Effettivo / Lega
```

### Step 5: Calcola il Valore Potenziale

Ripeti i calcoli assumendo che **tutti i trigger siano attivi** (moltiplicatore = 1.0).

Per effetti che modificano stats, calcola il **Body Potenziato**:
```
Body Potenziato = (POT + mod POT) x 0.5 + (DAN + mod DAN) x 0.35
```

### Step 6: Confronta con le Medie

Range aggiornati su snapshot reale **core live (160 carte)**.
Metodo: efficienza calcolata con formula documento + bonus armata medio; soglie derivate da percentili per lega.

| Lega | Eff. Media | Eff. Buona | Eff. Alta |
|------|------------|------------|-----------|
| 2 | 1.41-1.56 | 1.57-1.73 | 1.74+ |
| 3 | 1.18-1.40 | 1.41-1.53 | 1.54+ |
| 4 | 1.14-1.20 | 1.21-1.29 | 1.30+ |
| 5 | 1.04-1.20 | 1.21-1.27 | 1.28+ |

Valori guida (medie osservate):
- Lega 2: ~1.48
- Lega 3: ~1.30
- Lega 4: ~1.19
- Lega 5: ~1.12

---

## ESEMPI PRATICI

### Esempio 1: Carta Semplice

```
SENTINELLA ASTRALE
Lega: 2 | POT: 3 | DAN: 1
Potere: Vendetta: +3 POT
Armata: Comete

CALCOLO EFFETTIVO:
- Body: (3 x 0.5) + (1 x 0.35) = 1.85 FC
- Potere: (3 x 0.5) x 0.6 = 0.9 FC
- Bonus Comete: 0.77 FC
- Totale: 1.85 + 0.9 + 0.77 = 3.52 FC
- Efficienza: 3.52 / 2 = 1.76

CALCOLO POTENZIALE:
- Body Potenziato: (6 x 0.5) + (1 x 0.35) = 3.35 FC
- Potere (trigger=1): 1.5 FC
- Bonus: 0.77 FC
- Totale: 3.35 + 1.5 + 0.77 = 5.62 FC
- Efficienza: 5.62 / 2 = 2.81

VALUTAZIONE: Alta varianza (1.76 -> 2.81). Forte se Vendetta attivo.
```

---

### Esempio 2: Carta con Effetto Scaling

```
VETERANO DI MILLE BATTAGLIE (ipotetica)
Lega: 4 | POT: 4 | DAN: 3
Potere: Attrizione 1 DAN
Armata: Legione

CALCOLO EFFETTIVO:
- Body: (4 x 0.5) + (3 x 0.35) = 3.05 FC
- Potere: 0.70 FC (Attrizione 1 DAN, media)
- Bonus Legione: 0.70 FC
- Totale: 3.05 + 0.70 + 0.70 = 4.45 FC
- Efficienza: 4.45 / 4 = 1.11

CALCOLO POTENZIALE (T5, 4 carte giocate):
- Body Potenziato: (4 x 0.5) + (7 x 0.35) = 4.45 FC
- Potere: 1.40 FC (4 x 0.35)
- Bonus: 0.70 FC
- Totale: 4.45 + 1.40 + 0.70 = 6.55 FC
- Efficienza: 6.55 / 4 = 1.64

VALUTAZIONE: Efficienza media ma scaling pericoloso. DAN 7 al T5 e devastante.
```

---

### Esempio 3: Carta con Nuovo Trigger

```
SFIDANTE TEMERARIO (ipotetica)
Lega: 2 | POT: 3 | DAN: 2
Potere: Sfida: +2 POT
Armata: Progenie

CALCOLO EFFETTIVO:
- Body: (3 x 0.5) + (2 x 0.35) = 2.2 FC
- Potere: (2 x 0.5) x 0.6 = 0.6 FC
- Bonus Progenie: 0.40 FC
- Totale: 2.2 + 0.6 + 0.40 = 3.2 FC
- Efficienza: 3.2 / 2 = 1.60

CALCOLO POTENZIALE (vs Lega 5, Rimonta attivo):
- Body Potenziato: (7 x 0.5) + (2 x 0.35) = 4.2 FC
- Potere: 1.0 FC
- Bonus: 1.0 FC
- Totale: 4.2 + 1.0 + 1.0 = 6.2 FC
- Efficienza: 6.2 / 2 = 3.10

VALUTAZIONE: Bilanciato in media, esplosivo contro Lega alte + Rimonta.
```

---

### Esempio 4: Carta con Inversione

```
SPECCHIO MALEDETTO (ipotetica)
Lega: 3 | POT: 3 | DAN: 2
Potere: Inversione
Armata: Ratti

CALCOLO EFFETTIVO:
- Body: (3 x 0.5) + (2 x 0.35) = 2.2 FC
- Potere: 1.0 FC (Inversione, stima media)
- Bonus Ratti: 0.42 FC
- Totale: 2.2 + 1.0 + 0.42 = 3.62 FC
- Efficienza: 3.62 / 3 = 1.21

VALUTAZIONE: Sotto la media per Lega 3. Ma:
- vs Ratti nemici: Inversione vale ~2.5 FC -> Efficienza ~1.70
- vs Circolo: Inversione vale ~0 FC -> Efficienza ~0.87

Alta varianza dipendente dal matchup. Carta di nicchia.
```

---

### Esempio 5: Carta con Turbo

```
BERSERKER DELL'ALBA (ipotetica)
Lega: 2 | POT: 3 | DAN: 2
Potere: Turbo: -3 PV (a te)
Armata: Progenie

CALCOLO EFFETTIVO (considerando che T3+ il malus non si attiva):
- Body: (3 x 0.5) + (2 x 0.35) = 2.2 FC
- Potere: (-3 x 0.2) x 0.3 = -0.18 FC
- Bonus Progenie: 0.40 FC
- Totale: 2.2 - 0.18 + 0.40 = 2.42 FC
- Efficienza: 2.42 / 2 = 1.21

VALUTAZIONE: 
- T1-2: Corpo 3/2 con -3 PV = aggressivo ma costoso
- T3+: Corpo 3/2 senza malus = solido per Lega 2

Il design e intenzionale: puoi scegliere quando subire il malus.
```

---

## CARTE DA MONITORARE

### Profili ad alto potenziale, bassa affidabilita

| Profilo | Segnale numerico | Rischio |
|---------|------------------|---------|
| Trigger doppio condizionale (es. esito + stato PV) | Delta Eff/Pot > 1.0 | Carta "lotteria", troppo dipendente da finestra |
| Bonus armata forte ma trigger raro | BonusEff << BonusPot | Slot che sembra forte ma rende poco in media |
| Effetto economia tardivo (`ultimaChance`) | Valore FC reale < 0.6 | Dead value strutturale |

### Profili ad alta efficienza, basso delta

| Profilo | Segnale numerico | Rischio |
|---------|------------------|---------|
| Trigger sempre/strutturale + body sopra curva | Efficienza Eff > soglia alta di lega | Overperformance costante |
| Debuff sempre attivo senza controcosto | Winrate stabile cross-matchup | Compressione spazio decisionale |
| Difesa forte + chiusura nello stesso slot | Eff alta e varianza bassa | Pezzo "tuttofare" non interattivo |

### Combinazioni da Monitorare (Nuove Meccaniche)

| Combinazione | Rischio | Note |
|--------------|---------|------|
| Sfida + effetto forte (Lega 2) | Alto | Efficienza esplosiva vs Lega 5 |
| Invasione + Escalation | Alto | Doppio snowball |
| Attrizione 2 + Ultima Chance | Alto | +8 stat garantito T5+ |
| Turbo + corpo forte | Medio | Nessun downside dopo T2 |
| Inversione vs Ratti | Medio | Counter troppo hard? |
| Conquista/LastWish + debuff stat duello | Alto | Possibile mismatch timing (post-duello) |
| Ultima Chance + focusCoin | Alto | Spesso dead value a round 5 |

---

## EFFETTI NON CATTURATI DAL SISTEMA

1. **Valore del bluff** - Overdrive crea incertezza tattica
2. **Sinergie con Bonus Armata** - alcune linee superano la somma dei singoli valori
3. **Combo tra carte** - Es. auto-danno per attivare Rimonta
4. **Meta-game** - Alcune carte valgono piu contro certi matchup
5. **Informazione pubblica** - Sfida/Sopraffare sono prevedibili
6. **Timing forzato** - Turbo costringe a giocare presto
7. **Pressione psicologica** - Ultima Chance incentiva a chiudere prima del T5
8. **Varianza di Inversione** - Dipende completamente dal matchup

---

## CHECKLIST VALUTAZIONE RAPIDA

```
[ ] Body nella norma per la Lega? (Lega x 2)
[ ] POT >= 3? (stat gateway)
[ ] Trigger in fase utile (pre-duello/post-duello corretto)?
[ ] L'effetto impatta davvero la fase in cui si attiva?
[ ] Potere ha valore proporzionato al trigger?
[ ] Se c'e economia FC, e spendibile entro i round restanti?
[ ] Efficienza Effettiva nella media? (vedi tabella)
[ ] Delta Eff/Pot ragionevole? (< 1.0 idealmente)
[ ] Sinergia con Bonus Armata?
[ ] Interazioni problematiche con altri effetti?
[ ] Considerati gli effetti non numerici?
```

---

*Sistema di Bilanciamento Completo - Versione 2.1 - Maggio 2026*
