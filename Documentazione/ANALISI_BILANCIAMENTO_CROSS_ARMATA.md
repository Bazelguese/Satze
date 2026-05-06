# SATZE — ANALISI BILANCIAMENTO CROSS-ARMATA (9 ARMATE)

*Versione 1.0 — Maggio 2026*  
*Fonte dati: `cards.js` (181 carte), `armies.js` (bonus armata), `SISTEMA_BILANCIAMENTO_COMPLETO.md` v2.1 (formule).*

---

## 0. SCOPO

Confrontare le 9 armate del roster (Figli dell'Orizzonte, Kethran, Corte Rossa, Calibri Pesanti, Orathai, Mounthborn, L'Enclave delle Scaglie, Ratti della Megera, Patto degli Indocili) sull'asse del bilanciamento numerico, usando le formule canoniche del sistema. Aggiorna e sostituisce la tabella obsoleta in `BILANCIAMENTO.md` (che includeva solo 6 armate con nomi vecchi).

---

## 1. METODOLOGIA

### 1.1 Formule applicate

Da `SISTEMA_BILANCIAMENTO_COMPLETO.md` v2.1:

```
Body Base       = POT × 0.50 + DAN × 0.35
Valore Potere   = Valore Effetto × Moltiplicatore Trigger
Valore Bonus    = Valore Bonus Armata × Moltiplicatore Trigger Bonus
Valore Effettivo = Body + Valore Potere + Valore Bonus
Efficienza Eff  = Valore Effettivo / Lega
Body Potenziato = (POT + mod) × 0.50 + (DAN + mod) × 0.35  [con tutti i mod attivi]
Valore Potenziale = Body Potenziato + Potere(*) + Bonus
Efficienza Pot  = Valore Potenziale / Lega
Delta           = Eff Pot − Eff Eff
```

(*) Per effetti che modificano stats proprie (`+1 POT`, `+1 DAN`, `powerAndDamage`, ecc.), il valore è **già catturato nel Body Potenziato** e non va sommato di nuovo come Valore Potere — questo evita un double-counting che la documentazione del sistema lascia ambiguo. Il framework Indocili applica già questa correzione, qui è applicata cross-armata.

### 1.2 Bonus armata calcolati

| Armata | Bonus | EffBonus | PotBonus |
|--------|-------|----------|----------|
| Figli dell'Orizzonte | -5 VA nem. (min 6) — Sempre | 0.77 | 0.77 |
| Kethran | Rimonta: +2 POT | 0.40 | 1.00 |
| Corte Rossa | Copia Bonus nem. — Sempre | 0.80 | 0.80 |
| Calibri Pesanti | -2 DAN nem. (min 2) — Sempre | 0.56 | 0.56 |
| Orathai | Resa dei conti: +2 DAN | 0.35 | 0.70 |
| Mounthborn | Imboscata: +1 POT, +1 DAN | 0.60 | 0.85 |
| L'Enclave delle Scaglie | Conquista: +2 FC | 0.84 | 1.40 |
| Ratti della Megera | Conquista: Tossina 2 (min 4) | 0.36 | 0.60 |
| Patto degli Indocili | Rinforzi: -1 POT, -1 DAN nem. (min 2) | 0.41 | 0.68 |

Per il Patto degli Indocili è usato il proxy operativo `0.60` come moltiplicatore Rinforzi (come da framework, da rifinire con telemetry reale).

### 1.3 Cosa il sistema NON cattura

Il valore numerico ignora deliberatamente: bluff (Overdrive), pressione psicologica, sinergie tra carte, valore meta di matchup specifici, varianza pesca, timing forzato, vantaggio informativo. Tutti questi fattori contano e vanno valutati separatamente in playtest. La tabella che segue dice cosa fanno *in media le carte da sole*, non cosa fanno *i mazzi nelle mani di un giocatore*.

---

## 2. AGGREGATI PER ARMATA (tutto il roster)

| # | Armata | Carte | POT med | DAN med | Body med | EffEff | EffPot | Delta |
|---|--------|-------|---------|---------|----------|--------|--------|-------|
| 1 | Corte Rossa | 20 | 4.00 | 2.85 | 3.00 | **1.405** | 1.512 | 0.107 |
| 2 | L'Enclave delle Scaglie | 20 | 3.90 | 2.45 | 2.81 | **1.399** | 1.807 | 0.408 |
| 3 | Figli dell'Orizzonte | 20 | 3.65 | 2.75 | 2.79 | **1.380** | 1.541 | 0.162 |
| 4 | Calibri Pesanti | 20 | 4.00 | 2.60 | 2.91 | **1.323** | 1.485 | 0.162 |
| 5 | Mounthborn | 20 | 4.10 | 2.55 | 2.94 | **1.293** | 1.794 | 0.501 |
| 6 | Orathai | 20 | 4.15 | 2.35 | 2.90 | **1.237** | 1.744 | 0.508 |
| 7 | **Patto degli Indocili** | **21** | **3.52** | **2.48** | **2.63** | **1.213** | **1.513** | **0.300** |
| 8 | Kethran | 20 | 3.65 | 2.85 | 2.82 | **1.192** | 1.858 | 0.666 |
| 9 | Ratti della Megera | 20 | 4.20 | 2.05 | 2.82 | **1.188** | 1.423 | 0.235 |

**Range generale del pool:** EffEff `1.188 – 1.405` (spread 0.217), EffPot `1.423 – 1.858` (spread 0.435).

### Letture immediate

- **EffEff più alta** = Corte Rossa. È l'armata più "consistente" in valore medio. Coerente con il bonus armata `Copia Bonus nem.` che è sempre attivo a 0.80 FC e con le carte dense di buff sicuri (`intervention` + body alto).
- **EffPot più alta** = Kethran (1.858), seguita da Enclave (1.807) e Mounthborn (1.794). Sono le armate con il ceiling più alto: quando i loro trigger si attivano, le carte rendono molto.
- **Delta più alto** = Kethran (0.666). Significa che la differenza tra "trigger spento" e "trigger acceso" è enorme. È un'armata da skill players: rende come Ratti se giocata male, rende come l'Enclave se giocata bene.
- **Delta più basso** = Corte Rossa (0.107). È l'armata più stabile del roster: rende quasi uguale qualunque cosa succeda. È giocabile da chiunque ottenga un risultato decente.

### Posizione del Patto degli Indocili

- **EffEff = 1.213** → posizione 7 su 9. Sotto la media globale (1.292).
- **EffPot = 1.513** → posizione 7 su 9. Anche il ceiling è verso il basso.
- **Delta = 0.300** → mediano. Né swing puro come Kethran/Orathai, né stabile come Corte Rossa.

Sono cifre complessive, ma sono *abbassate* dal fatto che gli Indocili **non hanno carte L5** e le L5 della altre armate, pur con EffEff bassa, alzano il body raw. Per un confronto onesto, vedi sezione 4.

---

## 3. CONFRONTO PER FASCIA DI LEGA (Eff Effettiva)

| Armata | L2 | L3 | L4 | L5 |
|--------|------|------|------|------|
| Figli dell'Orizzonte | 1.650 | 1.323 | 1.240 | 1.184 |
| Kethran | 1.394 | 1.158 | 1.112 | 0.988 |
| Corte Rossa | **1.672** | 1.383 | **1.295** | 1.100 |
| Calibri Pesanti | 1.518 | 1.301 | 1.196 | 1.188 |
| Orathai | 1.317 | 1.325 | 1.153 | 1.038 |
| Mounthborn | 1.440 | 1.381 | 1.155 | 1.053 |
| L'Enclave delle Scaglie | 1.575 | **1.432** | 1.254 | **1.223** |
| Ratti della Megera | 1.327 | 1.160 | 1.106 | 1.105 |
| **Patto degli Indocili** | **1.333** | **1.204** | **1.104** | — |

**Posizionamento del Patto per fascia di Lega:**
- **L2:** posizione 7 su 9. Il pool L2 è quello a più alta efficienza generale (1.467 medio).
- **L3:** posizione 7 su 9. Più dietro alle altre.
- **L4:** **posizione 9 su 9**. È la fascia più debole del Patto e dell'intero roster.
- **L5:** non applicabile (zero carte).

Questo è il dato più rilevante della tabella. **Le L4 del Patto sono le più sotto-curva del roster**, anche dietro a Ratti (1.106) e Kethran (1.112). Per un'armata che ha dichiarato la curva 7/7/7/0, le L4 sono la spina dorsale di forza media e dovrebbero stare almeno in linea con il pool, non sotto.

---

## 4. CONFRONTO L2-L4 SOLAMENTE (apples-to-apples)

Per neutralizzare il vantaggio strutturale che le L5 danno al "media generale" delle altre armate, escludo le L5 dal calcolo.

| # | Armata | N L2-L4 | EffEff | EffPot | Delta |
|---|--------|---------|--------|--------|-------|
| 1 | Corte Rossa | 17 | **1.459** | 1.578 | 0.119 |
| 2 | L'Enclave delle Scaglie | 17 | **1.430** | 1.864 | 0.434 |
| 3 | Figli dell'Orizzonte | 17 | **1.414** | 1.572 | 0.158 |
| 4 | Calibri Pesanti | 17 | **1.346** | 1.524 | 0.177 |
| 5 | Mounthborn | 17 | **1.335** | 1.860 | 0.525 |
| 6 | Orathai | 17 | **1.272** | 1.803 | 0.532 |
| 7 | Kethran | 17 | **1.228** | 1.948 | 0.720 |
| 8 | **Patto degli Indocili** | **21** | **1.213** | **1.513** | **0.300** |
| 9 | Ratti della Megera | 17 | **1.203** | 1.458 | 0.255 |

**A parità di curva, gli Indocili sono penultimi in EffEff** (1.213, dietro a tutti tranne i Ratti). Lo stesso vale per EffPot (1.513, terzultimi). Il numero non si nasconde: l'armata è genuinamente sotto-tono in valore numerico delle carte.

---

## 5. LETTURA DEL PATTO DEGLI INDOCILI

Quattro osservazioni operative.

### 5.1 L'armata è "stat-light"

Il **Body medio è il più basso del pool**: 2.63 FC vs media 2.85 FC. POT medio 3.52 (più basso del roster, gli altri stanno tra 3.65 e 4.20). Le carte hanno corpi più piccoli delle controparti di pari Lega. È una scelta coerente con il profilo "midrange tecnico-reattivo" del framework, ma ha una conseguenza concreta: a trigger spento, le carte degli Indocili **escono peggio dagli scambi PV** delle carte delle altre armate.

### 5.2 Il ceiling è dignitoso ma non eccezionale

EffPot 1.513 è in posizione 6-7 su 9. Quando i trigger si attivano, gli Indocili tornano in linea con Corte Rossa, Figli e Calibri (i tre "stabili" del pool). Non raggiungono i picchi di Kethran/Enclave/Mounthborn. Questo è coerente con la scelta di non avere L5: niente "boss cards" significa niente picchi a 2.0+ EffPot.

### 5.3 La varianza è media

Delta 0.300, in mezzo al pool. L'armata non è né "tutto o niente" come Kethran (delta 0.666) né "rendi sempre uguale" come Corte Rossa (0.107). Il framework la descriveva come "alta dipendenza dalla qualità decisionale" — il numero conferma: il ritorno all'investimento in skill è c'è, ma è proporzionato.

### 5.4 Il problema reale: le L4

Su L4, posizione 9 su 9 con 1.104. Le L4 sono **la curva centrale dell'armata** (7 carte su 21, e nelle build mono-Indocili a Lega 30 sono 5 su 10). Se le L4 sono sotto-curva, l'armata intera è sotto-curva nelle build pure. Le candidate più sotto-tono in L4 sono:

| ID | Carta | EffEff | Note |
|----|-------|--------|------|
| 902 | Elysium, L'Immortale | 0.977 | Overdrive: Cura 3 — heal a 0.20 FC vale poco |
| 907 | G.G.B. | 1.037 | Imboscata: -5 VA nem. (min 6) — VA è la stat meno efficiente |
| 904 | John, l'Idraulico | 1.059 | Resa dei conti: -2 DAN (min 2) — il min 2 erode il valore |

Queste tre carte scendono verso 1.00 e alzano il problema strutturale. Non sono "rotte" né meritano nerf — sono solo *deboli*, e in un'armata già stat-light tirano la media dell'L4 verso il fondo. La domanda di design è: vuoi un'armata che *vince con le L4* (e allora vanno rinforzate) o un'armata che *vince con le L2* sfruttando la densità (e allora le L4 fanno da glue e va bene così)?

---

## 6. OUTLIER CROSS-ARMATA

### 6.1 Top 5 EffEff (carte più costantemente forti)

| ID | Carta | Armata | L | EffEff |
|----|-------|--------|---|--------|
| 308 | Messaggero Burlone | Corte Rossa | 2 | 2.025 |
| 107 | Eco Svanente | Figli dell'Orizzonte | 2 | 1.810 |
| 410 | Orecchio del Fronte Sud | Calibri Pesanti | 2 | 1.800 |
| 309 | Ombra del Creditore | Corte Rossa | 2 | 1.780 |
| 706 | Draghetto Famelico | L'Enclave delle Scaglie | 2 | 1.770 |

### 6.2 Top 5 EffPot (carte con ceiling più alto)

| ID | Carta | Armata | L | EffPot | Delta |
|----|-------|--------|---|--------|-------|
| 209 | Ombra della Spira | Kethran | 2 | 2.725 | 1.080 |
| 210 | Martire della Spira | Kethran | 2 | 2.600 | 1.100 |
| 615 | Zanzara Furiosa | Mounthborn | 2 | 2.450 | 0.752 |
| 207 | Seguace Fanatico | Kethran | 2 | 2.425 | 1.000 |
| 916 | **Regolatore di Debiti** (Indocili) | Patto | 2 | **2.275** | 0.892 |

Il **Regolatore di Debiti del Patto** entra nella top-10 ceiling ed è già una carta da monitorare flaggata dal framework. È l'unica carta degli Indocili nella top-10 EffPot del roster.

### 6.3 Bottom 5 EffEff (carte più deboli)

| ID | Carta | Armata | L | EffEff |
|----|-------|--------|---|--------|
| 809 | Larva Strisciante | Ratti della Megera | 2 | 0.702 |
| 216 | Crepuscolo, l'Assassino di Soli | Kethran | 5 | 0.794 |
| 516 | Il Coro | Orathai | 5 | 0.928 |
| 616 | Guardia Reale della Guglia | Mounthborn | 5 | 0.929 |
| 311 | Generale Karthessi | Corte Rossa | 5 | 0.940 |

Quattro su cinque sono L5 con auto-danno o trigger fragili — è il design corretto delle "boss cards" intenzionalmente sopra-curva nel potenziale ma sotto in efficienza. La presenza in lista è normale.

---

## 7. DISCREPANZE RISPETTO A `BILANCIAMENTO.md`

La tabella attuale in `BILANCIAMENTO.md` (sezione "Efficienza per Armata") ha tre problemi:

1. **Include solo 6 armate** (con nomi vecchi: Corte, Comete, Legione, Sciame, Circolo, Progenie). Mancano L'Enclave, Ratti, e ovviamente il Patto. **Va sostituita** con la tabella della sezione 2 di questo file.

2. **I valori di alcune armate sono leggermente diversi** dai miei. Esempio:

   | Armata | BILANCIAMENTO.md (Eff/Pot) | Questo report (Eff/Pot) | Probabile causa |
   |--------|----------------------------|--------------------------|------------------|
   | Corte Rossa | 1.48 / 1.73 | 1.405 / 1.512 | Carte aggiunte Maggio 2026 (+5 carte/armata) |
   | Figli Orizzonte | 1.45 / 1.68 | 1.380 / 1.541 | Idem + bonus aggiornato |
   | Orathai (ex-Circolo) | 1.30 / 1.87 | 1.237 / 1.744 | Bonus armata cambiato (+1 DAN sempre → Resa dei conti +2 DAN) |
   | Kethran (ex-Progenie) | 1.23 / 1.98 | 1.192 / 1.858 | Carte aggiunte |

   L'ordine relativo qualitativo è preservato. Le differenze sono dovute principalmente all'espansione del pool di Maggio 2026 e al cambio di alcuni bonus armata. **Il file `BILANCIAMENTO.md` è da aggiornare a v2.2 con questi numeri.**

3. **Non considera la nona armata.** Banale ma va fatto.

---

## 8. NOTE METODOLOGICHE

### 8.1 Scelte di calcolo dichiarate

- **No double-counting per buff propri.** Quando il potere modifica le stats proprie (es. +1 POT), il valore è contato nel Body Potenziato, non aggiunto separatamente come Valore Potere. Allinea al framework Indocili 4.3.
- **Efficacia dei "min"** applicata secondo la tabella standard (min 1-2 → 80%, min 3-4 → 70%, min 5-6 → 55%).
- **Bonus Rinforzi degli Indocili** usa il proxy operativo `0.60`. Da rifinire con telemetry una volta avviato il playtest.
- **Tossina** valutata a 0.85 FC per Tossina 2 e 0.50 per Tossina 1 (stima conservativa, il valore reale dipende dall'aggressività del piano e dalla durata della partita).

### 8.2 Verifica di consistenza con il framework Indocili

I valori carta-per-carta del Patto calcolati in questo report **coincidono** con la sezione 4.3 di `FRAMEWORK_IDENTITA_PATTO_DEGLI_INDOCILI.md` per tutte le 21 carte. Lo script di calcolo è quindi validato per coerenza.

### 8.3 Limiti

- I matchup non sono catturati. Una carta con `Inversione` vale ~0 contro un mazzo senza debuff e ~2.5 contro Ratti — il sistema dà un valore medio.
- Le sinergie tra carte non sono catturate. Il Patto può avere sinergie (es. `intervention` + `turbo` nello stesso turno) che il sistema non vede.
- La pressione psicologica (es. l'avversario gioca conservativo per paura di un trigger) non è catturata.

---

## 9. CONCLUSIONI OPERATIVE

1. **La tabella obsoleta in `BILANCIAMENTO.md` va sostituita.** I valori in sezione 2 di questo report sono quelli aggiornati per il roster di Maggio 2026.

2. **Il Patto degli Indocili è genuinamente verso il fondo del pool in EffEff** (penultimo a parità di curva). Non è un dramma — è entro range — ma è una posizione che va monitorata in playtest. Se anche il winrate reale lo conferma sotto-tono, ci sono due interventi possibili:
   - **Opzione A:** rinforzare le L4 del Patto (palette più stat o trigger più affidabili).
   - **Opzione B:** lasciare l'EffEff bassa e raffinare il bonus Rinforzi per alzare il valore "passivo" comune a tutte le carte.

3. **Le L4 del Patto sono la curva critica.** Posizione 9 su 9 nella loro fascia. Le carte 902 (Elysium), 907 (G.G.B.), 904 (John l'Idraulico) sono i contributori principali — non rotte, ma deboli. Decidere se è intenzionale o no.

4. **Il Regolatore di Debiti (916)** entra nella top-10 EffPot del roster. Già flaggato dal framework. Da monitorare.

5. **La differenziazione meccanica con i Ratti** (che era stata oggetto di discussione precedente) emerge anche dai numeri: i Ratti hanno EffEff 1.203 / EffPot 1.458 / Delta 0.255 (armata stabile-bassa-debuff), mentre il Patto ha EffEff 1.213 / EffPot 1.513 / Delta 0.300 (armata stabile-bassa-buff tempistico). Le metriche aggregate sono *vicine* ma le **funzioni dominanti delle carte sono diverse** (Ratti = Debuffer/Closer/Buffer; Patto = Buffer/Debuffer/Controller). La differenziazione regge a livello strutturale anche se a livello aggregato sembrano sorelle.

---

*Generato con script `calcola_bilanciamento.py` — sorgenti: `cards.js`, `armies.js`, `SISTEMA_BILANCIAMENTO_COMPLETO.md` v2.1.*  
*Output dettagliato carta-per-carta disponibile in `card_metrics.json` (181 righe).*
