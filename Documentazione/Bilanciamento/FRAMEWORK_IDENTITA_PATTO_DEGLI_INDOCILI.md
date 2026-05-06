# SATZE - FRAMEWORK IDENTITA ARMATA

## Patto degli Indocili (Prototipo 21 carte - Maggio 2026)

Versione: maggio 2026  
Fonti verita: `src/data/cards.js`, `src/data/armies.js`, `src/game/triggerLogic.js`, `src/data/cardTags.js`  
Regola: in caso di divergenza, vince il codice.

---

## 1) Identita armata

`Patto degli Indocili` e una armata **midrange tecnico-reattiva** con piano principale:

- vincere scambi a valore con debuff mirati (`enemyPower`, `enemyDamage`, `enemyAssault`, `blockAbility`, `blockBonus`);
- mantenere pressione costante con body efficienti L3/L4;
- chiudere tramite swing di tempo (`assaultValue`, `powerAndDamage`) piu che con burst diretto ai PV.

Bonus armata:

- **Rinforzi** -> `-1 POT`, `-1 DAN` nemico (min 2), condizione `rinforzi`.
- Nel motore, `rinforzi` dipende dalla mano iniziale e dalla lega della carta giocata.

Lettura design:

- asse principale = controllo tecnico del duello (non attrition puro, non all-in puro);
- asse secondario = spike temporali su `Turbo` e `Ultima Chance`;
- profilo = armata a media varianza, alta qualita decisionale.

---

## 2) Distribuzione reale (21 carte)

### Trigger

| Trigger | Conteggio | Peso |
|---------|-----------|------|
| Intervention | 4 | 19.0% |
| Turbo | 3 | 14.3% |
| Rimonta | 3 | 14.3% |
| Sfida | 2 | 9.5% |
| Sopraffare | 1 | 4.8% |
| Overdrive | 1 | 4.8% |
| Resa dei conti | 1 | 4.8% |
| Imboscata | 1 | 4.8% |
| Vendetta | 1 | 4.8% |
| Resistenza | 1 | 4.8% |
| Ultima Chance | 1 | 4.8% |
| Opportunista | 1 | 4.8% |
| Sempre | 1 | 4.8% |

### Effetti

| Effetto | Conteggio | Peso |
|---------|-----------|------|
| power | 4 | 19.0% |
| powerAndDamage | 3 | 14.3% |
| assaultValue | 3 | 14.3% |
| enemyPower | 2 | 9.5% |
| heal | 1 | 4.8% |
| enemyDamage | 1 | 4.8% |
| enemyAssault | 1 | 4.8% |
| enemyPowerAndDamage | 1 | 4.8% |
| focusCoin | 1 | 4.8% |
| damage | 1 | 4.8% |
| blockAbility | 1 | 4.8% |
| blockBonus | 1 | 4.8% |
| escalation | 1 | 4.8% |

Sintesi:

- trigger cardine: `intervention`, `turbo`, `rimonta`;
- pacchetto effetti bilanciato tra buff (`power`, `powerAndDamage`) e controllo (`enemy*`, blocchi);
- assenza di direct damage massivo: chiusure principalmente da vantaggio di scambio.

---

## 3) Tag sistema in game

Tag caricati in `src/data/cardTags.js` per ID `901-921`:

- 6 categorie automatiche: `Corpo`, `Equilibrio`, `POT`, `DAN`, `Postura`, `Funzione`;
- categoria manuale `Ruolo` (badge rosso) completata per tutte le 21 carte.

Distribuzione ruolo (macro):

- Pillar: 8
- Ace: 5
- Tech: 4
- Bomb: 4
- Finisher: 1
- Anchor: 1
- Flex: 1

Lettura: nucleo convergente ben presente (Pillar), con quota di flessibilita/tech coerente al profilo midrange tecnico.

---

## 4) Valutazione bilanciamento (metodo standard allineato)

Riferimento: `Documentazione/Bilanciamento/SISTEMA_BILANCIAMENTO_COMPLETO.md`

### 4.1 Parametri usati

- `Body = POT*0.50 + DAN*0.35`
- `Valore Potere = Valore Effetto * Moltiplicatore Trigger`
- `Valore Bonus = Valore Bonus Armata * Moltiplicatore Trigger Bonus`
- `Valore Effettivo = Body + Valore Potere + Valore Bonus`
- `Valore Potenziale = Body Potenziato + Potere + Bonus` (trigger a 1.0)
- `Efficienza = Valore / Lega`

### 4.2 Assunzioni esplicite (solo dove manca tabella canonica)

1. **Bonus Rinforzi**: valore pieno `0.68 FC`  
   (`-1 POT` + `-1 DAN` con `min 2` => `(0.50+0.35)*0.8`).
2. **Moltiplicatore trigger bonus Rinforzi**: `0.60` (proxy operativo, da rifinire con telemetry reale).
3. **Effetti con minimo**: applicata efficacia standard documento  
   - min 1-2 -> `80%`  
   - min 5-6 -> `55%`.
4. `escalation +1 POT/+1 DAN` trattata come base `0.85 FC` lato teorico.

### 4.3 Tabella carta-per-carta (formato classico)

`BonusEff` e costante su tutte le carte = `0.41` (`0.68*0.60`).  
`Delta` = `EffPot - EffEff` (indice varianza).

| ID | Carta | L | Body | PotereBase | Trig | PotereEff | BonusEff | ValEff | EffEff | ValPot | EffPot | Delta |
|----|------|---|------|------------|------|-----------|----------|--------|--------|--------|--------|-------|
| 901 | Brutus, Campione della Fossa | 4 | 3.55 | 0.85 | 0.60 | 0.51 | 0.41 | 4.47 | 1.12 | 5.08 | 1.27 | 0.15 |
| 902 | Elysium, L'Immortale | 4 | 3.20 | 0.60 | 0.50 | 0.30 | 0.41 | 3.91 | 0.98 | 4.48 | 1.12 | 0.14 |
| 903 | KMD-30 | 4 | 3.05 | 2.52 | 0.30 | 0.76 | 0.41 | 4.21 | 1.05 | 6.25 | 1.56 | 0.51 |
| 904 | John, l'Idraulico | 4 | 3.55 | 0.56 | 0.50 | 0.28 | 0.41 | 4.24 | 1.06 | 4.79 | 1.20 | 0.14 |
| 905 | Napoleone VII | 4 | 3.90 | 1.50 | 0.60 | 0.90 | 0.41 | 5.21 | 1.30 | 6.08 | 1.52 | 0.22 |
| 906 | Magnum l'Intrepido | 4 | 3.75 | 0.80 | 0.70 | 0.56 | 0.41 | 4.72 | 1.18 | 5.23 | 1.31 | 0.13 |
| 907 | G.G.B. | 4 | 3.20 | 0.77 | 0.70 | 0.54 | 0.41 | 4.15 | 1.04 | 4.65 | 1.16 | 0.12 |
| 908 | Contrabbandiere di Fortuna | 3 | 3.05 | 1.40 | 0.70 | 0.98 | 0.41 | 4.44 | 1.48 | 5.13 | 1.71 | 0.23 |
| 909 | Giustiziere Errante | 3 | 2.85 | 0.70 | 0.60 | 0.42 | 0.41 | 3.68 | 1.23 | 4.23 | 1.41 | 0.18 |
| 910 | Cyber May Punk | 3 | 2.90 | 1.00 | 0.40 | 0.40 | 0.41 | 3.71 | 1.24 | 4.58 | 1.53 | 0.29 |
| 911 | Vandalo dell'Ultrastrada | 3 | 2.70 | 0.68 | 0.60 | 0.41 | 0.41 | 3.52 | 1.17 | 4.06 | 1.35 | 0.18 |
| 912 | Repressore | 3 | 2.55 | 1.00 | 0.50 | 0.50 | 0.41 | 3.46 | 1.15 | 4.23 | 1.41 | 0.26 |
| 913 | Wraith dei Tunnel | 3 | 2.20 | 1.68 | 0.30 | 0.50 | 0.41 | 3.11 | 1.04 | 4.56 | 1.52 | 0.48 |
| 914 | Il Controllore | 3 | 2.40 | 0.80 | 0.70 | 0.56 | 0.41 | 3.37 | 1.12 | 3.88 | 1.29 | 0.17 |
| 915 | Predone della Fossa | 2 | 1.85 | 0.85 | 0.30 | 0.26 | 0.41 | 2.51 | 1.26 | 3.38 | 1.69 | 0.43 |
| 916 | Regolatore di Debiti | 2 | 1.35 | 2.52 | 0.40 | 1.01 | 0.41 | 2.77 | 1.38 | 4.55 | 2.28 | 0.90 |
| 917 | Piromane dell'Ultrastrada | 2 | 1.85 | 0.85 | 1.00 | 0.85 | 0.41 | 3.11 | 1.55 | 3.38 | 1.69 | 0.14 |
| 918 | Picchiatore di Infami | 2 | 2.05 | 1.00 | 0.40 | 0.40 | 0.41 | 2.86 | 1.43 | 3.73 | 1.86 | 0.43 |
| 919 | Milizia del Grande Semaforo | 2 | 1.70 | 1.50 | 0.50 | 0.75 | 0.41 | 2.86 | 1.43 | 3.88 | 1.94 | 0.51 |
| 920 | Mr. Cavalca Via | 2 | 1.85 | 1.00 | 0.70 | 0.70 | 0.41 | 2.96 | 1.48 | 3.53 | 1.77 | 0.29 |
| 921 | Picayune Lisa, la Rivoltosa | 2 | 1.70 | 0.85 | 0.40 | 0.34 | 0.41 | 2.45 | 1.22 | 3.23 | 1.61 | 0.39 |

### 4.4 Lettura coerente con il sistema

- **Sopra media controllata:** `905`, `908`, `917`, `920`.
- **Alto delta (carte swing):** `916`, `903`, `913`, `919`.
- **Ancore di stabilita (delta basso):** `901`, `902`, `904`, `906`, `907`, `917`.
- **Range generale sano:** prevalenza EffEff ~`1.05-1.48` con pochi picchi oltre.

---

## 5) Affidabilita trigger nel piano Indocili

Classificazione pratica nel contesto armata:

- Alta: `intervention`, `turbo`, `sempre`, `sfida/sopraffare` (in meta a leghe miste)
- Media: `rimonta`, `resistenza`, `reckoning`
- Media-bassa: `overdrive`, `opportunista`, `ultimaChance`, `vendetta`

Implicazione:

- una carta forte su trigger media-bassa non e overpowered di default;
- la vera forza dell'armata sta nella densita di trigger ad alta leggibilita tattica.

---

## 6) Valutazione identitaria finale

### Coerenza

Alta.

- Bonus `Rinforzi` e pacchetto carte spingono lo stesso asse: vincere il duello riducendo output nemico.
- Le carte "asso" esistono ma non sfondano il piano principale.

### Affidabilita

Buona.

- Molte carte hanno floor giocabile anche senza highroll.
- La curva L2-L3 sostiene la costruzione di mazzi ibridi con 2+ leghe.

### Rischi

Moderati.

- stack di utility (blocchi + debuff + VA swing) puo creare turni a bassa interazione;
- `916` e `919` sono le prime candidate a tuning se i test mostrano winrate fuori target;
- in caso di meta lento, `908` puo diventare troppo efficiente come engine.

---

## 7) Checklist tuning playtest

Monitorare su almeno 50 partite:

1. frequenza attivazione reale `rinforzi`;
2. winrate con e senza `916` in lista;
3. impatto di `920` contro armate bonus-dipendenti;
4. delta PV medio dopo turni 2-4 (fase in cui gli Indocili costruiscono vantaggio);
5. varianza first/second player (sensibile per presenza congiunta `intervention` + `turbo`).

Soglie suggerite:

- se una carta supera stabilmente `55%` win contribution nel suo slot -> rivedere;
- se il bonus armata decide da solo >`30%` degli scontri -> ridurre intensita o affidabilita;
- se il mazzo ha matchup estremamente polarizzati -> alleggerire i tech piu punitivi.

---

## 8) Conclusione operativa

`Patto degli Indocili` e un framework **plausibile, coerente e giocabile**:

- identita riconoscibile (midrange tecnico-reattivo),
- curve generalmente sane,
- alcuni picchi da monitorare ma senza segnali di rottura immediata.

Stato raccomandato: **pronto per ciclo playtest strutturato**, con priorita di osservazione su `905`, `908`, `916`, `919`, `920`.

---

## 9) Confronto con le armate attuali

Snapshot confronto (dati da `src/data/cards.js`):

| Armata | Carte | Curva Leghe | POT medio | DAN medio | Body medio | Trigger dominanti | Funzioni dominanti |
|--------|-------|-------------|-----------|-----------|------------|-------------------|--------------------|
| Figli dell'Orizzonte | 20 | 6/6/5/3 | 3.65 | 2.75 | 6.40 | sempre, reckoning, turbo | Buffer, Debuffer, Engine |
| Kethran | 20 | 6/6/5/3 | 3.65 | 2.85 | 6.50 | rimonta, sempre, lastWish | Buffer, Tank, Closer |
| Corte Rossa | 20 | 6/6/5/3 | 4.00 | 2.85 | 6.85 | intervention, reckoning, rimonta | Closer, Mimic, Debuffer |
| Calibri Pesanti | 20 | 6/6/5/3 | 4.00 | 2.60 | 6.60 | overdrive, sempre, magnanimous | Buffer, Closer, Tank |
| Orathai | 20 | 6/6/5/3 | 4.15 | 2.35 | 6.50 | magnanimous, sempre, glory | Buffer, Tank, Engine |
| Mounthborn | 20 | 6/6/5/3 | 4.10 | 2.55 | 6.65 | imboscata, intervention, rimonta | Buffer, Closer, Tank |
| L'Enclave delle Scaglie | 20 | 6/6/5/3 | 3.90 | 2.45 | 6.35 | imboscata, glory, invasione | Buffer, Scaler, Closer |
| Ratti della Megera | 20 | 6/6/5/3 | 4.20 | 2.05 | 6.25 | intervention, rimonta, opportunista | Debuffer, Closer, Buffer |
| **Patto degli Indocili** | **21** | **7/7/7/0** | **3.52** | **2.48** | **6.00** | **intervention, turbo, rimonta** | **Buffer, Debuffer, Controller** |

Legenda curva: L2/L3/L4/L5.

### 9.1 Posizionamento competitivo Indocili

`Patto degli Indocili` risulta:

- piu "basso di corpo" medio rispetto a quasi tutte le armate legacy (6.00 vs 6.25-6.85);
- molto piu denso su L2-L4 e senza L5, quindi meno picchi "boss", piu continuita di pressione;
- piu tecnico nel controllo duello (debuff + blocchi) che nel burst ai PV.

In pratica:

- **vince** quando impone micro-vantaggi ripetuti su 2-4 round;
- **soffre** se il match si sposta su body raw molto alti o su snowball economico lungo.

### 9.2 Matchup qualitativi (stima)

| Avversario | Lettura matchup per Indocili |
|------------|------------------------------|
| Figli dell'Orizzonte | Tendenzialmente pari: Indocili possono spezzare il controllo VA, ma subiscono il grind lungo. |
| Kethran | Leggermente favorevole se negano i turni rimonta chiave con debuff e blocchi. |
| Corte Rossa | Skill matchup: entrambe tecniche; partita decisa da timing di intervention/blocchi. |
| Calibri Pesanti | Leggermente sfavorevole: corpi e picchi overdrive possono superare il vantaggio incrementale. |
| Orathai | Pari tendente sfavorevole nei game lunghi per sustain e value stabile Orathai. |
| Mounthborn | Pari/coinflip: chi vince i primi turni di tempo (imboscata/intervento) prende inerzia. |
| L'Enclave delle Scaglie | Favorevole se Indocili interrompono presto la catena conquista->FC; sfavorevole se Enclave snowballa. |
| Ratti della Megera | Leggermente favorevole: migliore qualità media DAN e strumenti controller contro piano attrito. |

### 9.3 Identita relativa (in una riga)

Se le altre armate rappresentano i poli "body", "sustain", "snowball", "debuff attrito",  
`Patto degli Indocili` occupa il polo **"midrange tecnico di precisione"**:

- meno potenza grezza,
- piu efficienza tattica turno per turno,
- alta dipendenza dalla qualita decisionale.


