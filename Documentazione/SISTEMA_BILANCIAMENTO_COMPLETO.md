# SATZE - SISTEMA DI BILANCIAMENTO COMPLETO

*Versione 2.3 - Maggio 2026*

---

> Nota: questo documento e un modello di bilanciamento (formule + euristiche operative).
> Per la fotografia reale e aggiornata di trigger/effetti presenti nelle carte, usare `FRAMEWORK_IDENTITA_ARMATE_v2.md`.
> Se c'e divergenza, **vince il codice** (`src/data/cards.js`, `src/data/armies.js`, `src/game/triggerLogic.js`).

---

## CHANGELOG v2.3

Modifiche rispetto a v2.2, in ordine di impatto sui calcoli:

1. **[MIGLIORIA] Split `Ultima Chance` direttamente in tabella trigger**: `UC in-round = 0.4` e `UC economia/differita = 0.15`, evitando eccezioni nascoste fuori tabella.
2. **[COERENZA DATI] Riallineato bonus Ratti della Megera al codice** (`Conquista: Tossina 1 (min 10)` in `src/data/armies.js`) con ricalcolo Eff/Pot.
3. **[COERENZA DATI] Snapshot repository aggiornato** a 41 carte estese / 201 totali.
4. **[FORMA] Aggiornata la logica moltiplicatori** per distinguere esplicitamente UC in-round da UC economia.
5. **[ESEMPI] Ricalibrato Esempio 4** (Inversione + bonus Ratti) con i valori corretti del bonus armata.

> Nota: i conteggi snapshot sono aggiornati ai dati correnti del repository al momento della v2.3.

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
13. [Calibrazione Retrospettiva](#calibrazione-retrospettiva)

---

## DEFINIZIONI E PARAMETRI

### Terminologia

| Termine | Significato |
|---------|-------------|
| **Valore Effettivo** | Valore atteso considerando le probabilita di attivazione dei trigger |
| **Valore Potenziale** | Valore quando tutti i trigger della carta sono attivi (trigger = 1.0) |
| **Efficienza (Eff)** | Valore Totale / Lega |
| **Body** | Valore in FC delle statistiche di una carta |
| **Body Effettivo** | Body considerando le modifiche stat attese (con probabilita) |
| **Body Potenziato** | Body con tutte le modifiche stat applicate (a trigger pieno) |
| **Effetto stat-mod** | Effetto che modifica POT o DAN proprie (es. `+2 POT`, Mounthborn `+1 POT, +1 DAN`) |
| **Effetto non-stat** | Effetto che NON modifica POT o DAN proprie (es. `+2 FC`, `Immune`, `2 Danni dir.`, `-3 POT nem.`) |

> **Importante:** sia il Valore Effettivo sia il Potenziale vanno valutati. L'Effettivo indica la performance media; il Potenziale indica il ceiling.

### Allineamento con il motore (chiavi codice)

Per evitare ambiguita tra documentazione e implementazione:
- i nomi in tabella (es. "Intervento", "Resa dei conti") sono etichette di design/UI;
- il motore usa chiavi tecniche in `ability.trigger` e `ability.effect`.

| Etichetta design | Chiave trigger nel codice |
|------------------|---------------------------|
| Sempre attivo | `null` (trigger assente) |
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
| Scaling / conversione | `escalation`, `attrition`, `inversion` |
| Imponi POT | `imponiPower` |
| Imponi DAN | `imponiDamage` |
| Tossina | `toxin` |

| Armata | Trigger bonus (codice) | Effetto bonus (codice) | Descrizione bonus |
|--------|-------------------------|------------------------|-------------------|
| Figli dell'Orizzonte | `null` | `enemyAssault` | -5 VA nem. (min 6) |
| Kethran | `rimonta` | `power` | Rimonta: +2 POT |
| Corte Rossa | `null` | `copyBonus` | Copia Bonus nemico |
| Calibri Pesanti | `null` | `enemyDamage` | -2 DAN nem. (min 2) |
| Orathai | `reckoning` | `damage` | Resa dei conti: +2 DAN |
| Mounthborn | `imboscata` | `power`, `damage` | Imboscata: +1 POT, +1 DAN |
| L'Enclave delle Scaglie | `conquest` | `focusCoin` | Conquista: +2 FC |
| Ratti della Megera | `conquest` | `toxin` | Conquista: Tossina 1 (min 10) |
| Patto degli Indocili | `rinforzi` | `enemyPower`, `enemyDamage` | Rinforzi: -1 POT, -1 DAN nem. (min 2) |
| Khemet | `overdrive` | `immune` | Overdrive: Immune |

**Nota migrazione trigger (legacy -> attuale):**
`turbo` -> `imboscata`, `ambush` -> `vendetta`, `vendetta` -> `rimonta`, `turboRound` -> `turbo`.

### Parametri di Gioco

| Risorsa | Valore |
|---------|--------|
| Punti Vita iniziali | 25 PV |
| Focus Coin iniziali | 18 FC |
| Carte per deck | 10 |
| Carte in mano (pescate dal deck) | 5 |
| Limite Lega totale | 30 punti |
| Round/Scontri per partita | max 5 |
| Turni per Supremazia | dal turno 5 |

---

## SNAPSHOT DATI REALI (MAGGIO 2026)

Fonte: `src/data/cards.js`, `src/data/armies.js`, `src/game/triggerLogic.js`, `src/data/gameModes.js`.

> **Nota di consistenza:** i conteggi seguenti sono validi per il `core live` delle 8 armate originali. Dopo l'integrazione di `Khemet` e la rifinitura di `Patto degli Indocili`, lo snapshot va rigenerato con uno script su `cards.js`. La struttura delle tabelle resta valida.

### Perimetro dataset

| Perimetro | Armate | Carte |
|-----------|--------|-------|
| Core live | 8 | 160 |
| Estensioni integrate | 2 (`Patto degli Indocili`, `Khemet`) | 41 |
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

Nota: nel dataset esteso compaiono effetti oggi marginali nel core, in particolare `imponiPower`, `imponiDamage` (Patto degli Indocili) e `enemyPowerAndDamage`, e una densita maggiore di `overdrive` da Khemet.

---

## PROTOCOLLO MECHANICS-FIRST

Ordine obbligatorio quando valuti una carta nuova o una modifica:

1. **Timing trigger:** pre-duello o post-duello.
2. **Bersaglio effettivo:** cosa puo ancora essere modificato in quella fase.
3. **Spendibilita valore:** il valore e spendibile entro la partita attuale (5 round).
4. **Solo dopo:** convergenza/situazionale/asso, bilanciamento, flavour.

### Regole hard

- Se il trigger e post-duello (`conquest`, `lastWish`), non trattare come valido per il duello appena finito un effetto su `enemyPower`, `enemyDamage`, `enemyAssault` (salvo persistenza esplicita).
- Con `maxRounds: 5`, effetti economia su `ultimaChance` (`round >= 5`) sono spesso **dead value** se non spendibili nello stesso round. Vedi regola formale nella sezione Trigger.
- Non validare mai una proposta senza esplicitare: **fase**, **impatto reale**, **vincolo round**.
- Il moltiplicatore stat-mod entra nel `Body`, mai come componente `Potere`/`Bonus` separata, per evitare doppio conteggio (vedi Formule).

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

### Principio anti-doppio-conteggio

Ogni effetto va contato **una sola volta**, in una sola componente. Regola:

- **Effetti che modificano POT o DAN propri** (es. `+2 POT`, Attrizione DAN, Mounthborn `+1 POT/+1 DAN`) -> entrano nel `Body` (Effettivo o Potenziato), **non** come `Potere`/`Bonus` separata.
- **Effetti che NON modificano POT o DAN propri** (es. `+2 FC`, `2 Danni dir.`, `Immune`, `-3 POT nem.`, `Cura 2`, copie, blocchi, scaling non-stat) -> entrano come `Potere_non_stat` o `Bonus_non_stat`.

Questa partizione garantisce che il calcolo del Body Potenziato (che include le stats migliorate) e la componente Potere/Bonus non si sovrappongano.

### Formula Valore Effettivo

```
Valore Effettivo = Body Effettivo + Potere_non_stat_atteso + Bonus_non_stat_atteso

Dove:
- Body Effettivo = (POT + mod_POT_atteso) x 0.5 + (DAN + mod_DAN_atteso) x 0.35
  con mod_*_atteso = somma su tutti gli effetti stat-mod di (delta_stat x moltiplicatore_trigger)
- Potere_non_stat_atteso = Valore_FC_effetto_non_stat x moltiplicatore_trigger
- Bonus_non_stat_atteso = Valore_FC_bonus_non_stat x moltiplicatore_trigger_bonus
```

### Formula Valore Potenziale

```
Valore Potenziale = Body Potenziato + Potere_non_stat + Bonus_non_stat

Dove:
- Body Potenziato = (POT + mod_POT_pieno) x 0.5 + (DAN + mod_DAN_pieno) x 0.35
  con mod_*_pieno = somma su tutti gli effetti stat-mod di delta_stat (trigger = 1.0)
- Potere_non_stat = Valore_FC_effetto_non_stat (trigger = 1.0)
- Bonus_non_stat = Valore_FC_bonus_non_stat (trigger = 1.0)
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
| **+1 POT** | 0.50 FC* | Stat gateway, scala con FC investiti |
| **+1 DAN** | 0.35 FC | Valore per Supremazia, richiede vittoria |
| **+1 VA** | 0.28 FC | Non scala con FC, additivo puro |
| **+1 FC** | 0.70 FC** | Valore atteso medio sul decadimento round |
| **1 DAN diretto** | 0.50 FC | Garantito, bypassa combattimento |
| **Cura 1 PV** | 0.20 FC | Difensivo, non aiuta a vincere |
| **-1 PV (auto)** | -0.20 FC | Costo puro |

*Il valore `+1 POT = 0.50 FC` assume investimento FC moderato (~1.5-2 FC). A investimento medio teorico (`~18 FC / 5 duelli = 3.6`), `+1 POT` puo valere fino a `~1.0 FC` perche genera `+3.6 VA`. Calibrazione conservativa: usare 0.50 come base e adottare 0.70-0.80 come correzione per carte progettate per vincere duelli costosi.

**`0.70 FC` e la media ponderata sul decadimento dei round (vedi tabella decadimento). Per trigger turn-specific, NON moltiplicare 0.70 per il coefficiente del round: usare il **valore nominale 1.00** moltiplicato per il coefficiente specifico (vedi sezione Decadimento).

### Debuff (applicati al nemico)

| Effetto | Valore per punto | Note |
|---------|------------------|------|
| **-1 POT nem.** | 0.50 FC | Equivalente a +1 POT |
| **-1 DAN nem.** | 0.35 FC | Equivalente a +1 DAN |
| **-1 VA nem.** | 0.28 FC | Equivalente a +1 VA |

### Effetto "Minimo" (min X)

Gli effetti con minimo riducono i valori bersaglio fino a un floor X. L'efficacia dipende da quanto X e vicino o sopra la media osservata.

Stima (euristica calibrata su distribuzione attuale):

| Minimo | Efficacia stimata | Razionale |
|--------|-------------------|-----------|
| min 1-2 | ~80% | Sotto la media: il floor blocca pochi casi |
| min 3-4 | ~70% | Sulla media: il floor blocca circa il 30% dei casi |
| min 5-6 | ~55% | Sopra la media: il floor blocca circa la meta dei casi |

**Formula con minimo:**
```
Valore = Valore Base x Efficacia Minimo
```

> **Nota di calibrazione:** queste percentuali sono euristiche, non derivate da simulazione. Per una stima rigorosa: `efficacia = E[max(0, stat_target - X)] / E[stat_target]`, calcolata sulla distribuzione effettiva delle stat target nel meta corrente.

### Decadimento valore economia per round (max 5)

Per evitare sovrastima di `focusCoin` nei turni finali:

| Round attivazione | Coefficiente spendibilita FC |
|-------------------|------------------------------|
| T1 | 1.00 |
| T2 | 0.90 |
| T3 | 0.75 |
| T4 | 0.45 |
| T5 | 0.20 |

**Quando usare il valore base 0.70 vs il coefficiente specifico:**

- **Trigger universali** (Sempre attivo, Imboscata, Intervento, Vendetta, Gloria, Conquista, Ultimo Desiderio, Sfida, Sopraffare, Rimonta, Magnanimo, Opportunista, Overdrive, Invasione, Resistenza): usare `+1 FC = 0.70 FC` (gia media decadimento).
- **Trigger turn-specific** (Turbo T1-2, Resa dei conti T3+, Ultima Chance T5+): usare valore nominale `1.00` moltiplicato per il coefficiente specifico del round atteso. **Non applicare anche `0.70`**.

Esempio corretto:
```
Ultima Chance: +3 FC a T5 = 3 x 1.00 x 0.20 = 0.60 FC reali
Turbo: +2 FC a T1 = 2 x 1.00 x 1.00 = 2.00 FC reali
Resa dei conti: +1 FC a T3+ = 1 x 1.00 x 0.65 (media T3-T5) = 0.65 FC reali
```

---

## TRIGGER COMPLETI

### Tabella Riassuntiva

| Trigger | Moltiplicatore | Categoria | Controllo | Finestra |
|---------|----------------|-----------|-----------|----------|
| **Sempre attivo** | 1.0 | - | Totale | Sempre |
| **Rinforzi** | 0.75 | Composizione | Deck-tech | Sempre |
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
| **Ultima Chance (in-round)** | 0.4 | Temporale | Totale | T5+ |
| **Ultima Chance (economia/differita)** | 0.15 | Temporale | Totale | T5+ |
| **Turbo** | 0.3 | Temporale | Totale | T1-2 |

### Nota sull'indipendenza dei trigger

Alcuni trigger sono **mutualmente esclusivi o complementari** sullo stesso turno: combinarne i moltiplicatori per la stessa attivazione e scorretto.

- `Gloria` e `Vendetta` sono complementari: `P(Gloria) + P(Vendetta) ≈ 1` dal T2.
- `Rimonta` e `Magnanimo` sono complementari (escluso il caso di pareggio PV).
- `Sfida` e `Sopraffare` sono complementari (escluso il caso di Lega pari).
- `Turbo` (T1-2) e `Ultima Chance` (T5+) sono temporalmente disgiunti.
- `Conquista` e `Ultimo Desiderio` sono complementari sullo stesso duello.

Quando una carta combina due trigger complementari, **non sommare i moltiplicatori**: trattali come due rami di uno scenario, non come effetti aggiuntivi.

### Descrizioni Dettagliate

#### CATEGORIA: COMPOSIZIONE

| Trigger | Condizione | Note |
|---------|------------|------|
| **Rinforzi** | In mano iniziale ci sono 2+ carte della stessa Lega della carta che porta il trigger (le carte gia giocate/scartate dalla mano iniziale contano) | Deck-tech: per deck legali con bi-armata o split di lega, attivazione vicina al 100%. Per deck mono-lega molto concentrati, garantita. |

> **Calibrazione del moltiplicatore 0.75:** scelta come compromesso tra "Sempre attivo" (1.0) e "controllo parziale" (0.7). Si attiva quasi sempre nelle config legali ma richiede tech consapevole nel deckbuilding e ha varianza nei matchup di mulligan. Da rivedere dopo 50+ partite di playtest.

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

**Interazione:** in caso di Lega pari, ne Sfida ne Sopraffare si attivano.

#### CATEGORIA: RISORSE (FC)

| Trigger | Condizione | Note |
|---------|------------|------|
| **Overdrive** | Spendi 5+ FC | Controllabile ma costoso |
| **Opportunista** | Il nemico spende 5+ FC | Non controllabile, counter a Overdrive |

**Momento verifica:** dopo la rivelazione simultanea dei FC.

#### CATEGORIA: STATO PV

| Trigger | Condizione | Note |
|---------|------------|------|
| **Rimonta** | Hai meno PV del nemico | Verificato prima dello scontro |
| **Magnanimo** | Hai piu PV del nemico | Verificato prima dello scontro |

**Interazione:** se i PV sono pari, ne Rimonta ne Magnanimo si attivano.

#### CATEGORIA: STATO CAMPI

| Trigger | Condizione | Note |
|---------|------------|------|
| **Invasione** | Hai conquistato 1+ campi | Non attivo T1 |
| **Resistenza** | Il nemico ha conquistato 1+ campi | Non attivo T1 |

**Momento verifica:** inizio turno (prima della scelta carte).

#### CATEGORIA: TEMPORALE

| Trigger | Condizione | Turni attivi |
|---------|------------|--------------|
| **Turbo** | Turno 1 o 2 | Solo T1-T2 |
| **Resa dei conti** | Entrambi hanno giocato 2+ carte | T3+ |
| **Ultima Chance** | Turno 5+ | T5+ |

### Regola formale: Ultima Chance su effetti differiti

Per `Ultima Chance`, gli effetti differiti (economia o valore su turni successivi) non usano il moltiplicatore in-round `0.4`. Usare la classe `Ultima Chance (economia/differita) = 0.15`.

Per gli effetti `focusCoin` su Ultima Chance:

```
Valore UC + FC = (FC nominali) x 0.20 (coefficiente T5)
```

NON `(FC nominali) x 0.70 x 0.4`. La logica del decadimento sostituisce il moltiplicatore trigger per questa combinazione, perche al T5 i FC sono in larga parte non spendibili.

Per gli altri effetti in-round su UC (danno diretto, stat buff, blocchi, Immune, debuff in-round) il moltiplicatore `0.4` resta valido.

### Logica dei Moltiplicatori

- `1.0`: Sempre attivo (garantito).
- `0.75`: Rinforzi (deck-tech, attivazione quasi-certa nelle config legali).
- `0.7`: Imboscata, Intervento (circa 50% controllo).
- `0.6`: Gloria, Vendetta, Conquista, Ultimo Desiderio, Sfida, Sopraffare.
- `0.5`: Resa dei conti, Overdrive, Opportunista, Invasione, Resistenza.
- `0.4`: Rimonta, Magnanimo, Ultima Chance (in-round).
- `0.15`: Ultima Chance economia/differita (focusCoin, toxin e analoghi con valore residuo post-round).
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
| **Imposta POT** | 1.50* | Conversione | Setta POT nemico al POT dell'autore |
| **Inversione** | 1.00** | Conversione | Converte debuff in buff (e viceversa) |
| **Copia DAN** | 1.00 | Adattivo | Copia DAN base nemica |
| **Imposta DAN** | 1.00* | Conversione | Setta DAN nemico al DAN dell'autore |
| **Blocca Bonus** | 1.00 | Controllo | Neutralizza Bonus Armata nemico |
| **Copia Bonus** | 0.80 | Adattivo | Copia Bonus Armata nemico |
| **Tossina 1** | 0.35 | Danno differito | Perdita PV progressiva |
| **Tossina 2** | 0.70 | Danno differito | Perdita PV progressiva, alto impatto in attrito |

*Valori provvisori, alta incertezza. Vedi sezione dedicata.
**Valore medio su distribuzione meta uniforme. Vedi nota di calibrazione meta-dipendente.

#### IMPOSTA POT / IMPOSTA DAN

> **Imposta [STAT]:** la statistica omonima del nemico viene settata allo stesso valore della statistica dell'autore.

**Logica:** effetto simmetrico. Se la stat dell'autore e **alta** rispetto alla media del meta, l'effetto e un debuff netto sul nemico (nerf). Se la stat e **bassa**, l'effetto e un buff per il nemico (autogol). L'effetto e quindi quasi inutile su carte con stat media e cresce di valore lineare con l'outlier.

**Stima del valore:**
```
Valore Imposta POT ≈ |POT_autore - POT_atteso_nemico| x 0.50 x prob(applicazione_favorevole)
Valore Imposta DAN ≈ |DAN_autore - DAN_atteso_nemico| x 0.35 x prob(applicazione_favorevole)
```

Dove `POT_atteso_nemico ≈ 4` e `DAN_atteso_nemico ≈ 3` come stat medie observate. Per una carta con `Imposta POT` e `POT autore = 7`, valore stimato `≈ 3 x 0.50 x 0.85 = 1.28 FC`.

**Note di design:**
- Imposta funziona solo su carte progettate con stat outlier alta nella stat omonima.
- Va applicata a corpi con `POT + DAN >= Lega x 2 + 2` per giustificare il rischio simmetrico.
- Interazione con `Immune`: indefinita, da fissare. Suggerimento: `Immune` blocca anche `Imposta` (coerente con "ignora modifiche di stat dall'esterno").

> **Caveat:** valori 1.50 / 1.00 sono stime di lavoro. Da calibrare su dati di playtest dopo 30+ partite con carte Imposta. La varianza sara alta.

### Effetti Scaling (valore variabile)

#### ESCALATION

> **Escalation X [STAT]:** +X [STAT] per ogni campo che hai conquistato.

| Campi | Escalation 1 | Escalation 2 |
|-------|--------------|--------------|
| 0 | +0 | +0 |
| 1 | +1 | +2 |
| 2 | +2 | +4 |

**Valori FC (medi attesi):**

| Effetto | Calcolo | Valore medio |
|---------|---------|--------------|
| Escalation 1 POT | 0.50 x 1.3 (campi medi) | ~0.65 FC |
| Escalation 2 POT | 1.00 x 1.3 | ~1.30 FC |
| Escalation 1 DAN | 0.35 x 1.3 | ~0.45 FC |
| Escalation 2 DAN | 0.70 x 1.3 | ~0.90 FC |

> **Trattamento nel calcolo:** Escalation su POT/DAN e stat-mod -> entra nel `Body` (Effettivo o Potenziato), non come Potere separato. Per il Body Effettivo usare `+stat_atteso = X x 1.3` (campi medi). Per il Potenziato usare `+stat_pieno = X x 2` (caso 2 campi).

#### ATTRIZIONE

> **Attrizione X [STAT]:** +X [STAT] per ogni carta che hai gia giocato.

| Carte giocate | Turno tipico | Attrizione 1 | Attrizione 2 |
|---------------|--------------|--------------|--------------|
| 0 | T1 | +0 | +0 |
| 1 | T2 | +1 | +2 |
| 2 | T3 | +2 | +4 |
| 3 | T4 | +3 | +6 |
| 4 | T5 | +4 | +8 |

**Valori FC (medi attesi):**

| Effetto | Calcolo | Valore medio |
|---------|---------|--------------|
| Attrizione 1 POT | 0.50 x 2 (carte medie) | ~1.00 FC |
| Attrizione 2 POT | 1.00 x 2 | ~2.00 FC |
| Attrizione 1 DAN | 0.35 x 2 | ~0.70 FC |
| Attrizione 2 DAN | 0.70 x 2 | ~1.40 FC |

> **Trattamento nel calcolo:** stessa logica di Escalation. Stat-mod -> Body. Per il Body Effettivo `+stat_atteso = X x 2` (carte medie). Per il Potenziato `+stat_pieno = X x 4` (T5).

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
| vs Deck debuff-heavy (Ratti, Calibri) | ~2.5 FC |
| vs Deck misto | ~1.0 FC |
| vs Deck senza debuff | ~0 FC |

> **Nota di calibrazione meta-dipendente:** il valore `1.00 FC` assume distribuzione armate avversarie uniforme. In meta dove debuff-heavy e dominante (tipicamente Ratti, Calibri Pesanti, Patto degli Indocili dopo l'introduzione di Rinforzi), il valore reale e piu alto. Rivedere a `~1.30-1.50 FC` se il meta lo giustifica.

### Tabella Riepilogativa Effetti

| Tipo | Effetto | Valore FC | Variabilita | Stat-mod? |
|------|---------|-----------|-------------|-----------|
| **Buff fisso** | +1 POT | 0.50 | Nessuna | Si |
| **Buff fisso** | +1 DAN | 0.35 | Nessuna | Si |
| **Buff fisso** | +1 VA | 0.28 | Nessuna | No |
| **Buff fisso** | +1 FC | 0.70 | Nessuna | No |
| **Debuff fisso** | -1 POT nem. | 0.50 | Nessuna | No |
| **Debuff fisso** | -1 DAN nem. | 0.35 | Nessuna | No |
| **Debuff fisso** | -1 VA nem. | 0.28 | Nessuna | No |
| **Danno** | 1 DAN dir. | 0.50 | Nessuna | No |
| **Cura** | Cura 1 | 0.20 | Nessuna | No |
| **Costo** | -1 PV (auto) | -0.20 | Nessuna | No |
| **Speciale** | Immune | 2.00 | Bassa | No |
| **Speciale** | Copia Potere | 1.50 | Alta | No |
| **Speciale** | Blocca Potere | 1.50 | Media | No |
| **Speciale** | Copia POT | 1.50 | Alta | No |
| **Speciale** | Imposta POT | 1.50* | Molto alta | No |
| **Speciale** | Copia DAN | 1.00 | Alta | No |
| **Speciale** | Imposta DAN | 1.00* | Molto alta | No |
| **Speciale** | Blocca Bonus | 1.00 | Media | No |
| **Speciale** | Copia Bonus | 0.80 | Alta | No |
| **Speciale** | Tossina 1 | 0.35 | Media | No |
| **Speciale** | Tossina 2 | 0.70 | Media | No |
| **Conversione** | Inversione | 1.00 | Molto alta | No |
| **Scaling** | Escalation 1 POT | 0.65 | Media (campi) | Si |
| **Scaling** | Escalation 1 DAN | 0.45 | Media (campi) | Si |
| **Scaling** | Attrizione 1 POT | 1.00 | Media (turni) | Si |
| **Scaling** | Attrizione 1 DAN | 0.70 | Media (turni) | Si |

> La colonna `Stat-mod?` indica se l'effetto entra nel `Body` (Si) o come componente `Potere`/`Bonus` separata (No), per evitare doppio conteggio.

---

## BONUS ARMATA

### Tabella Completa (snapshot maggio 2026)

| Armata | Bonus | Trigger | Calcolo Eff | Valore Eff | Valore Pot | Modifica Stats |
|--------|-------|---------|-------------|------------|------------|----------------|
| **Figli dell'Orizzonte** | -5 VA nem. (min 6) | Sempre | `5 x 0.28 x 0.55` | 0.77 | 0.77 | - |
| **Kethran** | +2 POT | Rimonta | `2 x 0.50 x 0.4` | 0.40 | 1.00 | +2/+0 |
| **Corte Rossa** | Copia Bonus nem. | Sempre | `0.80 x 1.0` | 0.80 | 0.80 | - |
| **Calibri Pesanti** | -2 DAN nem. (min 2) | Sempre | `2 x 0.35 x 1.0 x 1.0` | 0.70 | 0.70 | - |
| **Orathai** | +2 DAN | Resa dei conti | `2 x 0.35 x 0.5` | 0.35 | 0.70 | +0/+2 |
| **Mounthborn** | +1 POT, +1 DAN | Imboscata | `(0.50 + 0.35) x 0.7` | 0.59 | 0.85 | +1/+1 |
| **L'Enclave delle Scaglie** | +2 FC | Conquista | `2 x 0.70 x 0.6` | 0.84 | 1.40 | - |
| **Ratti della Megera** | Tossina 1 (min 10) | Conquista | `0.35 x 0.6` | 0.21 | 0.35 | - |
| **Patto degli Indocili** | -1 POT, -1 DAN nem. (min 2) | Rinforzi | `(0.50 + 0.35) x 0.80 x 0.75` | 0.51 | 0.68 | - |
| **Khemet** | Immune | Overdrive | `2.00 x 0.5` | 1.00 | 2.00 | - |

> **Nota:** I bonus che modificano le stats proprie (Kethran, Mounthborn, Orathai) sono `stat-mod` e nella valutazione di una carta entrano nel `Body Potenziato`/`Effettivo`, NON come `Bonus_non_stat` separato. Per le altre armate (Figli, Corte Rossa, Calibri, Enclave, Ratti, Patto, Khemet) il bonus entra come `Bonus_non_stat`.

> **Calcolo Ratti:** `0.35 (Tossina 1 base) x 0.6 (Conquista) = 0.21`. Per `min 10` il valore reale e molto dipendente dallo stato PV nel round di attivazione: rivedere con dati di playtest.

> **Calcolo Khemet:** Immune ha valore base alto (2.00) ma il moltiplicatore Overdrive (0.5) tiene l'Eff a 1.00, ragionevole per un bonus che richiede investimento di 5+ FC. Il Pot 2.00 e il piu alto del roster, coerente con l'identita "ceiling alto".

> **Calcolo Patto degli Indocili:** efficacia `0.80` per `min 2` (sotto la media di POT 4 / DAN 3, blocca pochi casi). Moltiplicatore `0.75` per Rinforzi, da rivedere.

### Calcolo con Bonus Armata

Per attivare il Bonus Armata servono **2+ carte della stessa armata** nella mano iniziale (5 carte pescate dal deck di 10), contando anche carte gia giocate o scartate dalla mano iniziale.

```
Valore con Bonus = Valore Base + (Bonus_non_stat x Moltiplicatore Trigger Bonus)

oppure (per bonus stat-mod)

Body Potenziato = (POT + mod_POT_da_bonus + ...) x 0.5 + (DAN + mod_DAN_da_bonus + ...) x 0.35
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
4. **Carte flagship Lega 5: alto valore ASSOLUTO, non alta efficienza per lega**. Le L5 hanno corpo grande e impatto, ma il rapporto Valore/Lega e tipicamente piu basso delle L2-L3 (paghi un premium per accedere allo slot).
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
| Imposta POT/DAN | 1-2 carte per armata | Effetto simmetrico, va abbinato a stat outlier |

---

## GUIDA ALLA VALUTAZIONE

### Step 1: Classifica gli effetti

Per ogni effetto della carta (Potere e Bonus Armata), determina se e **stat-mod** o **non-stat** consultando la colonna `Stat-mod?` della Tabella Riepilogativa Effetti.

### Step 2: Calcola il Body Effettivo

```
mod_POT_atteso = somma su tutti gli effetti stat-mod che modificano POT di:
                   (delta_POT x moltiplicatore_trigger_relativo)
mod_DAN_atteso = analogo per DAN

Body Effettivo = (POT + mod_POT_atteso) x 0.5 + (DAN + mod_DAN_atteso) x 0.35
```

**Esempio:** carta L2, POT 3, DAN 1, `Vendetta: +3 POT`, no bonus armata stat-mod.
```
mod_POT_atteso = 3 x 0.6 (Vendetta) = 1.8
Body Effettivo = (3 + 1.8) x 0.5 + 1 x 0.35 = 2.4 + 0.35 = 2.75 FC
```

### Step 3: Calcola il Potere_non_stat_atteso

Per ogni effetto del Potere classificato come **non-stat**:
```
Valore_FC_effetto x moltiplicatore_trigger
```

Somma su tutti gli effetti non-stat.

### Step 4: Calcola il Bonus_non_stat_atteso

Se il bonus armata e non-stat, applica:
```
Valore_FC_bonus x moltiplicatore_trigger_bonus
```

Se il bonus armata e stat-mod, e gia nel Body Effettivo (passo 2), non aggiungerlo qui.

### Step 5: Somma il Valore Effettivo e calcola Efficienza

```
Valore Effettivo = Body Effettivo + Potere_non_stat_atteso + Bonus_non_stat_atteso
Efficienza Effettiva = Valore Effettivo / Lega
```

### Step 6: Calcola il Valore Potenziale

Stessa procedura, ma con tutti i moltiplicatori trigger fissati a `1.0`:
```
mod_POT_pieno = somma di tutti i delta_POT stat-mod (trigger = 1.0)
mod_DAN_pieno = analogo
Body Potenziato = (POT + mod_POT_pieno) x 0.5 + (DAN + mod_DAN_pieno) x 0.35
Potere_non_stat = Valore_FC effetto non-stat (trigger = 1.0)
Bonus_non_stat = Valore_FC bonus non-stat (trigger = 1.0)
Valore Potenziale = Body Potenziato + Potere_non_stat + Bonus_non_stat
```

### Step 7: Confronta con le Medie

Soglie aggiornate sul snapshot reale **core live (160 carte)**.
Metodo: efficienza calcolata con formula corretta v2.2 + bonus armata medio; soglie derivate da percentili `P25` (limite "media"), `P50` (mediana), `P75` (limite "alta") sul dataset core.

| Lega | Eff. Media (P25-P50) | Eff. Buona (P50-P75) | Eff. Alta (>P75) |
|------|----------------------|----------------------|------------------|
| 2 | 1.41-1.56 | 1.57-1.73 | 1.74+ |
| 3 | 1.18-1.40 | 1.41-1.53 | 1.54+ |
| 4 | 1.14-1.20 | 1.21-1.29 | 1.30+ |
| 5 | 1.04-1.20 | 1.21-1.27 | 1.28+ |

Valori guida (mediane):
- Lega 2: ~1.48
- Lega 3: ~1.30
- Lega 4: ~1.19
- Lega 5: ~1.12

> **Nota:** dopo l'integrazione formale di Khemet/Patto degli Indocili e dell'eliminazione del doppio conteggio, queste soglie vanno **ricalibrate** rilanciando lo script di analisi sul dataset corrente. I valori qui sopra sono dell'era v2.1.

---

## ESEMPI PRATICI

### Esempio 1: Carta Semplice (con Vendetta + Figli dell'Orizzonte)

```
SENTINELLA ASTRALE (ipotetica)
Lega: 2 | POT: 3 | DAN: 1
Potere: Vendetta: +3 POT (stat-mod)
Armata: Figli dell'Orizzonte (bonus -5 VA nem. min 6, sempre attivo, non-stat)

CALCOLO EFFETTIVO:
- mod_POT_atteso = 3 x 0.6 (Vendetta) = 1.8
- mod_DAN_atteso = 0
- Body Effettivo = (3 + 1.8) x 0.5 + 1 x 0.35 = 2.4 + 0.35 = 2.75 FC
- Potere_non_stat_atteso = 0 (l'unico effetto del Potere e stat-mod, gia contato)
- Bonus_non_stat_atteso = 0.77 (Figli, gia ponderato)
- Valore Effettivo = 2.75 + 0 + 0.77 = 3.52 FC
- Efficienza Effettiva = 3.52 / 2 = 1.76

CALCOLO POTENZIALE:
- mod_POT_pieno = 3 (Vendetta x 1.0)
- Body Potenziato = (3 + 3) x 0.5 + 1 x 0.35 = 3.0 + 0.35 = 3.35 FC
- Potere_non_stat = 0
- Bonus_non_stat = 0.77
- Valore Potenziale = 3.35 + 0 + 0.77 = 4.12 FC
- Efficienza Potenziale = 4.12 / 2 = 2.06

VALUTAZIONE: efficienza effettiva alta per L2 (P75+), ceiling potenziale 2.06 ragionevole.
Carta solida. Delta Eff/Pot = 0.30, dipendenza moderata dal trigger.
```

> **Confronto v2.1 (con doppio conteggio):** Valore Potenziale era `5.62 FC`, Eff Pot `2.81`. La v2.2 elimina il +1.50 FC fantasma del +3 POT contato due volte.

---

### Esempio 2: Carta con Effetto Scaling stat-mod (Attrizione + Calibri Pesanti)

```
VETERANO DI MILLE BATTAGLIE (ipotetica)
Lega: 4 | POT: 4 | DAN: 3
Potere: Attrizione 1 DAN (stat-mod, trigger di fatto "sempre attivo" - scaling)
Armata: Calibri Pesanti (bonus -2 DAN nem. min 2, sempre attivo, non-stat)

CALCOLO EFFETTIVO (carta media: 2 carte gia giocate):
- mod_POT_atteso = 0
- mod_DAN_atteso = 1 x 2 (carte medie) = +2
- Body Effettivo = 4 x 0.5 + (3 + 2) x 0.35 = 2.0 + 1.75 = 3.75 FC
- Potere_non_stat_atteso = 0
- Bonus_non_stat_atteso = 0.70 (Calibri)
- Valore Effettivo = 3.75 + 0 + 0.70 = 4.45 FC
- Efficienza Effettiva = 4.45 / 4 = 1.11

CALCOLO POTENZIALE (T5, 4 carte gia giocate):
- mod_DAN_pieno = 1 x 4 = +4
- Body Potenziato = 4 x 0.5 + (3 + 4) x 0.35 = 2.0 + 2.45 = 4.45 FC
- Potere_non_stat = 0
- Bonus_non_stat = 0.70
- Valore Potenziale = 4.45 + 0 + 0.70 = 5.15 FC
- Efficienza Potenziale = 5.15 / 4 = 1.29

VALUTAZIONE: efficienza in linea con la media L4 (~1.19). Scaling moderato (delta 0.18).
Carta affidabile, non win-condition. DAN 7 a T5 e forte ma non devastante.
```

> **Confronto v2.1 (con doppio conteggio):** Valore Potenziale era `6.55 FC`, Eff Pot `1.64`. La v2.2 elimina il +1.40 FC fantasma del +4 DAN contato due volte.

---

### Esempio 3: Carta con Sfida + Bonus Armata stat-mod (Kethran)

```
SFIDANTE TEMERARIO (ipotetica)
Lega: 2 | POT: 3 | DAN: 2
Potere: Sfida: +2 POT (stat-mod)
Armata: Kethran (bonus +2 POT con Rimonta, stat-mod)

CALCOLO EFFETTIVO:
- mod_POT_atteso = 2 x 0.6 (Sfida) + 2 x 0.4 (Rimonta-Kethran) = 1.2 + 0.8 = 2.0
- mod_DAN_atteso = 0
- Body Effettivo = (3 + 2.0) x 0.5 + 2 x 0.35 = 2.5 + 0.70 = 3.20 FC
- Potere_non_stat_atteso = 0
- Bonus_non_stat_atteso = 0 (Kethran e stat-mod, gia in Body)
- Valore Effettivo = 3.20 FC
- Efficienza Effettiva = 3.20 / 2 = 1.60

CALCOLO POTENZIALE (vs L5, Rimonta attivo):
- mod_POT_pieno = 2 (Sfida) + 2 (Kethran) = 4
- Body Potenziato = (3 + 4) x 0.5 + 2 x 0.35 = 3.5 + 0.70 = 4.20 FC
- Valore Potenziale = 4.20 FC
- Efficienza Potenziale = 4.20 / 2 = 2.10

VALUTAZIONE: bilanciato in media, ceiling esplosivo vs L5 + Rimonta.
Delta Eff/Pot = 0.50, alta dipendenza da matchup e stato PV.
```

> **Confronto v2.1:** Eff Pot dichiarata era `3.10`. La v2.2 elimina il doppio conteggio dei +4 POT (=2.0 FC).

---

### Esempio 4: Carta con Inversione (effetto non-stat, alta varianza)

```
SPECCHIO MALEDETTO (ipotetica)
Lega: 3 | POT: 3 | DAN: 2
Potere: Inversione (non-stat)
Armata: Ratti della Megera (bonus Tossina 1 min 10, Conquista, non-stat)

CALCOLO EFFETTIVO:
- mod_POT_atteso = 0
- mod_DAN_atteso = 0
- Body Effettivo = 3 x 0.5 + 2 x 0.35 = 1.5 + 0.70 = 2.20 FC
- Potere_non_stat_atteso = 1.00 x 1.0 = 1.00 (Inversione, sempre attiva, valore medio)
- Bonus_non_stat_atteso = 0.21 (Ratti)
- Valore Effettivo = 2.20 + 1.00 + 0.21 = 3.41 FC
- Efficienza Effettiva = 3.41 / 3 = 1.14

VALUTAZIONE: sotto la media L3. Ma alta varianza:
- vs Ratti/Calibri/Patto nemici (debuff-heavy): Inversione vale ~2.5 FC -> Eff ~1.66
- vs Khemet/Mounthborn (poco debuff): Inversione vale ~0 FC -> Eff ~0.83

Carta di nicchia, valore reale meta-dipendente.
```

---

### Esempio 5: Carta con Turbo (auto-danno come costo)

```
BERSERKER DELL'ALBA (ipotetica)
Lega: 2 | POT: 3 | DAN: 2
Potere: Turbo: -3 PV (a te) (non-stat, costo)
Armata: Mounthborn (bonus +1 POT, +1 DAN con Imboscata, stat-mod)

CALCOLO EFFETTIVO:
- mod_POT_atteso da Mounthborn = 1 x 0.7 (Imboscata) = 0.7
- mod_DAN_atteso da Mounthborn = 1 x 0.7 = 0.7
- Body Effettivo = (3 + 0.7) x 0.5 + (2 + 0.7) x 0.35 = 1.85 + 0.945 = 2.80 FC
- Potere_non_stat_atteso = (-3 x 0.20) x 0.3 (Turbo) = -0.18 (-3 PV come costo, valore Cura inverso)
- Bonus_non_stat_atteso = 0 (Mounthborn e stat-mod, gia in Body)
- Valore Effettivo = 2.80 + (-0.18) + 0 = 2.62 FC
- Efficienza Effettiva = 2.62 / 2 = 1.31

VALUTAZIONE:
- T1-2: corpo 4/3 effettivo se Imboscata e attiva, costo -3 PV -> aggressivo
- T3+: Turbo non si attiva (no malus, no bonus stat su Imboscata), corpo 3/2 base
Il design e intenzionale: scegli quando subire il malus per spingere presto.
Eff 1.31 sotto la media L2 ma con upside in finestra T1-2.
```

---

## CARTE DA MONITORARE

### Profili ad alto potenziale, bassa affidabilita

| Profilo | Segnale numerico | Rischio |
|---------|------------------|---------|
| Trigger doppio condizionale (es. esito + stato PV) | Delta Eff/Pot > 1.0 | Carta "lotteria", troppo dipendente da finestra |
| Bonus armata forte ma trigger raro | BonusEff << BonusPot | Slot che sembra forte ma rende poco in media |
| Effetto economia tardivo (`ultimaChance + focusCoin`) | Valore FC reale < 0.6 | Dead value strutturale (vedi regola UC+FC) |

### Profili ad alta efficienza, basso delta

| Profilo | Segnale numerico | Rischio |
|---------|------------------|---------|
| Trigger sempre/strutturale + body sopra curva | Efficienza Eff > soglia alta di lega | Overperformance costante |
| Debuff sempre attivo senza controcosto | Winrate stabile cross-matchup | Compressione spazio decisionale |
| Difesa forte + chiusura nello stesso slot | Eff alta e varianza bassa | Pezzo "tuttofare" non interattivo |

### Combinazioni da Monitorare

| Combinazione | Rischio | Note |
|--------------|---------|------|
| Sfida + effetto stat-mod forte (Lega 2) | Alto | Body Potenziato gonfio vs Lega 5 |
| Invasione + Escalation | Alto | Doppio snowball |
| Attrizione 2 + Ultima Chance non-FC | Alto | +8 stat garantito T5 |
| Turbo + corpo forte | Medio | Nessun downside dopo T2 |
| Inversione vs meta debuff-heavy | Medio | Counter troppo hard? |
| Conquista/LastWish + debuff stat duello | Alto | Mismatch timing (post-duello) |
| Ultima Chance + focusCoin | Strutturalmente debole | Vedi regola formale UC+FC |
| Imposta POT con stat outlier 7+ | Alto | Ceiling 1.50+ FC, va monitorata |
| Rinforzi su carta gia bilanciata | Medio | Bonus armata "free" se deck rispetta soglia |

---

## EFFETTI NON CATTURATI DAL SISTEMA

1. **Valore del bluff** - Overdrive crea incertezza tattica
2. **Sinergie con Bonus Armata** - alcune linee superano la somma dei singoli valori
3. **Combo tra carte** - Es. auto-danno per attivare Rimonta
4. **Meta-game** - alcune carte valgono di piu contro certi matchup
5. **Informazione pubblica** - Sfida/Sopraffare sono prevedibili
6. **Timing forzato** - Turbo costringe a giocare presto
7. **Pressione psicologica** - Ultima Chance incentiva a chiudere prima del T5
8. **Varianza di Inversione e Imposta** - dipendono dal matchup e dalla stat outlier
9. **Effetti di mulligan** - Rinforzi e i bonus armata dipendono dalla mano iniziale, soggetta a varianza

---

## CHECKLIST VALUTAZIONE RAPIDA

```
[ ] Body nella norma per la Lega? (Lega x 2)
[ ] POT >= 3? (stat gateway)
[ ] Trigger in fase utile (pre-duello/post-duello corretto)?
[ ] L'effetto impatta davvero la fase in cui si attiva?
[ ] Effetti classificati stat-mod vs non-stat? (per evitare doppio conteggio)
[ ] Per UC + FC: applicato il coefficiente T5 = 0.20, non il moltiplicatore 0.4?
[ ] Trigger complementari trattati come scenari (non sommati)?
[ ] Efficienza Effettiva nella media? (vedi tabella, ricalibrare post-snapshot)
[ ] Delta Eff/Pot ragionevole? (< 1.0 idealmente)
[ ] Sinergia con Bonus Armata?
[ ] Interazioni problematiche con Imposta/Inversione?
[ ] Considerati gli effetti non numerici?
```

---

## CALIBRAZIONE RETROSPETTIVA

Il modello e una **stima** del valore di una carta, non una verita. Va confrontato con il comportamento osservato in playtest. Questa sezione e il loop di falsificazione: se il modello sbaglia sistematicamente in una direzione, le formule o i moltiplicatori vanno aggiornati.

### Formato del log

Per ogni carta osservata in modo significativo (>= 5 partite con presenza in mano):

| Carta (id) | Eff modello | Win-rate / impatto osservato | Delta | Causa probabile | Azione |
|------------|-------------|-------------------------------|-------|-----------------|--------|
| _esempio_ | 1.32 | sottoperformante (giocata raramente in late) | -0.20 | UC+FC sovrastimata | Ridotta a 1.12 dopo regola formale UC+FC |
| _esempio_ | 1.18 | overperformante (sempre prima scelta) | +0.30 | Body Potenziato non cattura sinergia stat-mod multipla | Aggiunta nota sinergia non-lineare |

### Regole di intervento

- **Delta sistematico in 5+ carte di un trigger** -> rivedere il moltiplicatore di quel trigger.
- **Delta sistematico in carte di un'armata** -> rivedere il valore del bonus armata.
- **Delta in una sola carta** -> sospetto problema di design specifico, non del modello. Non toccare le formule.
- **Mai ricalibrare formule senza un campione di almeno 30 partite** sull'effetto in questione.

### Carte attualmente sotto osservazione

> Da popolare a partire da playtest reali. Esempio di placeholder:
> - `213 - Eco del Tradimento` (Kethran L4): Escalation 2 POT con corpo 2/5. Modello dice Eff ~1.20. Da verificare se non e troppo forte in late game (Body Potenziato a T5+2 campi = 4 x 0.5 + 5 x 0.35 = 3.75 FC, Eff Pot ~1.50, snowball significativo).
> - `Imposta POT carte L5 a Patto degli Indocili`: Imposta nuova, valore stimato 1.50 FC ma molto incerto. Calibrare dopo 30+ partite.
> - `Khemet bonus Overdrive: Immune`: Eff 1.00 sembra alta, ma dipende da quanto i giocatori Khemet riescano effettivamente ad attivare Overdrive 5+ FC nei turni decisivi. Possibile downgrade a 0.85 se attivazione media e bassa.

---

*Sistema di Bilanciamento Completo - Versione 2.2 - Maggio 2026*
