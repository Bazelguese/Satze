# SATZE — FRAMEWORK IDENTITA ARMATE v2 (STATO ATTUALE + LETTURA CONVERGENZA)

Versione: maggio 2026  
Obiettivo: unire **dati reali dal codice** e **interpretazione design** su convergente/situazionale/asso.

---

## 1) Fonti e regola di verita

Fonti prioritarie:
1. `src/data/cards.js`
2. `src/data/armies.js`
3. `src/game/triggerLogic.js`
4. `src/data/gameMechanicsFramework.js`

Regola: se questo documento diverge dal codice, **vince il codice**.

---

## 2) Lessico usato (design)

- **Convergente forte**: trigger+effetto che rinforzano direttamente bonus armata e piano principale.
- **Situazionale**: forte solo in alcuni stati (ordine pick, round, vantaggio/svantaggio, matchup).
- **Asso**: carta utile ma fuori asse rispetto al piano principale dell'armata; apre linee alternative.

Nota importante: questa classificazione e **euristica** (non matematica).

---

## 3) Mappa chiavi (design -> codice)

- Imboscata -> `imboscata`
- Intervento -> `intervention`
- Gloria -> `glory`
- Vendetta (hai perso lo scontro precedente) -> `vendetta`
- Rimonta (hai meno PV) -> `rimonta`
- Overdrive -> `overdrive`
- Resa dei conti -> `reckoning`
- Magnanimo -> `magnanimous`
- Ultimo Desiderio -> `lastWish`
- Conquista -> `conquest`
- Opportunista -> `opportunista`
- Sfida -> `sfida`
- Sopraffare -> `sopraffare`
- Invasione -> `invasione`
- Resistenza -> `resistenza`
- Turbo -> `turbo`
- Ultima Chance -> `ultimaChance`

Migrazione storica:
`turbo` (legacy) -> `imboscata`, `ambush` -> `vendetta`, `vendetta` (legacy) -> `rimonta`, `turboRound` -> `turbo`.

---

## 4) Dati certi (snapshot attuale)

- Armate: 8
- Carte totali: 160
- 20 carte per armata

Estensione prototipale fuori snapshot base:
- `Patto degli Indocili` (21 carte): vedi `Documentazione/Bilanciamento/FRAMEWORK_IDENTITA_PATTO_DEGLI_INDOCILI.md`

Bonus armata reali:
- Figli dell'Orizzonte: sempre, `enemyAssault -5 (min 6)`
- Kethran: `rimonta`, `power +2`
- Corte Rossa: sempre, `copyBonus`
- Calibri Pesanti: sempre, `enemyDamage -2 (min 2)`
- Orathai: `reckoning`, `damage +2`
- Mounthborn: `imboscata`, `power +1` e `damage +1`
- L'Enclave delle Scaglie: `conquest`, `focusCoin +2`
- Ratti della Megera: `conquest`, `toxin 2 (minHealth 4)`

---

## 5) Affidabilita pratica trigger (in generale)

Questa sezione serve per non classificare in modo rigido.

- **Affidabilita alta (strutturali):** `reckoning`, `turbo`, `ultimaChance`
- **Affidabilita media (ordine/board state):** `imboscata`, `intervention`, `invasione`, `resistenza`, `sfida`, `sopraffare`
- **Affidabilita variabile (stato partita):** `glory`, `vendetta`, `rimonta`, `magnanimous`, `lastWish`, `conquest`, `opportunista`, `overdrive`

Quindi: una carta puo essere "convergente forte su carta", ma solo "situazionale in partita".

---

## 6) Lettura per armata (stato attuale)

## Figli dell'Orizzonte

- **Nucleo dati:** `enemyAssault`, `focusCoin`, `reckoning`.
- **Convergente forte:** controllo VA + economia FC (soprattutto su `reckoning`/sempre).
- **Situazionale:** `imboscata`/`turbo` offensivi (utili ma meno centrali al piano controllo).
- **Asso:** burst puro non legato al controllo (chiusure troppo aggressive rispetto al piano base).
- **Giudizio:** identita coerente e leggibile.

## Kethran

- **Nucleo dati:** `rimonta` alto, `power` alto, presenza `selfDamage`.
- **Convergente forte:** tutto cio che forza o sfrutta svantaggio PV (`rimonta` + aumento POT).
- **Situazionale:** linee che dipendono dal ritmo del danno subito.
- **Asso:** opzioni che stabilizzano troppo presto e rischiano di spegnere la finestra rimonta.
- **Giudizio:** modello convergente molto solido.

## Corte Rossa

- **Nucleo dati:** `intervention` dominante, copia/controllo.
- **Convergente forte:** reazione al nemico (copia, blocco, indebolimento) da secondo.
- **Situazionale:** strumenti che rendono bene solo contro bersagli "copiabili".
- **Asso:** forza diretta non parassitaria.
- **Giudizio:** molto coerente; rischio principale e polarizzazione matchup.

## Calibri Pesanti

- **Nucleo dati:** `overdrive`, `power`, `directDamage`, tenuta passiva dal bonus.
- **Convergente forte:** turni spike con risorse alte + mitigazione danno nel resto dei turni.
- **Situazionale:** tutto cio che richiede accumulo FC o tempistiche precise.
- **Asso:** tech troppo reattive rispetto al piano "picchi controllati".
- **Giudizio:** convergenza buona, ma sensibile alla gestione economia FC.

## Orathai

- **Nucleo dati:** `magnanimous` frequente, `heal` alto, bonus su `reckoning`.
- **Convergente forte:** linea mid/late con valore stabile e sustain; presente un sotto-asse concreto su `magnanimous`.
- **Situazionale:** pezzi che richiedono stato vantaggio/svantaggio molto specifico.
- **Asso:** estremi aggressivi non sostenuti dal resto del pacchetto.
- **Giudizio:** armata ibrida; qui la griglia convergente/asso e meno netta (volutamente).

## Mounthborn

- **Nucleo dati:** `imboscata` e `intervention` entrambe alte, `powerAndDamage` dominante.
- **Convergente forte:** pressione esplosiva quando sfrutta il bonus Imboscata.
- **Situazionale:** doppia anima primo/secondo giocatore (alta elasticita, alta varianza); parte del pacchetto `intervention` e meglio letto come situazionale-ibrido che come asso puro.
- **Asso:** linee difensive pure o troppo lente rispetto al ritmo sciame.
- **Giudizio:** corretta l'idea "convergente a due facce"; non va forzata in una sola.

## L'Enclave delle Scaglie

- **Nucleo dati:** `power` molto alta, bonus FC su `conquest`.
- **Convergente forte:** snowball da vittoria turno (vinco -> FC -> reinvesto).
- **Situazionale:** trigger che dipendono da sequenza positiva iniziale.
- **Asso:** recupero puro quando il piano snowball e gia rotto.
- **Giudizio:** la convergenza esiste ed e forte; rischio runaway da monitorare.

## Ratti della Megera

- **Nucleo dati:** `enemyPower`, `enemyAssault`, `toxin` concentrati.
- **Convergente forte:** debuff progressivo + chiusura indiretta via tossina.
- **Situazionale:** carte che richiedono tempo o avversario ad alto investimento.
- **Asso:** body/burst puri slegati dal piano di logoramento.
- **Giudizio:** lettura convergente molto plausibile; attenzione alla frizione UX nei match lenti.

---

## 7) Indice di confidenza (classificazione convergenza)

Quanto mi fido della classificazione convergente/situazionale/asso su ogni armata:

| Armata | Confidenza | Motivo sintetico |
|--------|------------|------------------|
| Figli dell'Orizzonte | Alta | nucleo controllo molto leggibile (`enemyAssault` + `focusCoin`) |
| Kethran | Alta | bonus e distribuzione trigger allineati in modo netto a `rimonta` |
| Corte Rossa | Alta | identita reattiva molto chiara (`intervention` + copia/blocco) |
| Calibri Pesanti | Media | convergenza forte ma dipende molto dalla curva FC/turni |
| Orathai | Media-Bassa | profilo ibrido, confini convergente/asso piu sfumati |
| Mounthborn | Media | doppia anima primo/secondo rende la classe dinamica |
| L'Enclave delle Scaglie | Alta | asse snowball coerente e statisticamente evidente |
| Ratti della Megera | Alta | piano attrito/tossina ben concentrato nei dati |

---

## 8) Esempi concreti con ID (operativi)

Per ogni armata: 1 esempio convergente forte, 1 situazionale, 1 asso.

| Armata | Convergente forte | Situazionale | Asso |
|--------|-------------------|--------------|------|
| Figli dell'Orizzonte | `103` (`reckoning` + `enemyAssault`) | `111` (`turbo` + `assaultValue`) | `105` (`turbo` + `directDamage`) |
| Kethran | `212` (`rimonta` + `immune`) | `205` (`sfida` + `power`) | `201` (`magnanimous` + `power`) |
| Corte Rossa | `302` (`intervention` + `copyAbility`) | `303` (`opportunista` + `enemyPower`) | `301` (`conquest` + `directDamage`) |
| Calibri Pesanti | `402` (`overdrive` + `power`) | `419` (`ultimaChance` + `power`) | `407` (`imboscata` + `directDamage`) |
| Orathai | `517` (`reckoning` + `directDamage`) | `507` (`sfida` + `toxin`) | `511` (`overdrive` + `assaultValue`) |
| Mounthborn | `604` (`imboscata` + `powerAndDamage`) | `612` (`intervention` + `enemyPower`) | `609` (`lastWish` + `selfDamage`) |
| L'Enclave delle Scaglie | `712` (`conquest` + `directDamage`) | `703` (`turbo` + `power`) | `711` (`rimonta` + `immune`) |
| Ratti della Megera | `802` (`intervention` + `enemyAssault`) | `804` (`opportunista` + `toxin`) | `808` (`lastWish` + `directDamage`) |

Nota: "asso" qui significa "fuori asse rispetto al piano medio dell'armata", non "carta debole".

---

## 9) Casi ambigui (regole di lettura)

Trigger dove la classe cambia facilmente col contesto:

- `sfida` / `sopraffare`: dipendono dalla distribuzione leghe del meta e dall'ordine pick.
- `opportunista`: cresce molto se il meta spende spesso 5+ FC.
- `conquest` / `glory`: possono passare da convergenti ad asso se l'armata non punta alla catena vittoria.
- `rimonta` / `magnanimous`: speculari, fortemente legati all'andamento PV reale della partita.
- `overdrive`: da convergente a situazionale se la curva FC del deck non regge.

Regola pratica:
se un trigger non si attiva con buona frequenza nel tuo piano reale, declassalo almeno a "situazionale" anche se sulla carta sembra convergente.

---

## 10) Mini protocollo playtest (validazione framework)

Metriche minime da tracciare su 50+ partite per armata:

1. Frequenza di attivazione trigger per carta.
2. Winrate first/second player.
3. Delta PV medio al termine di ogni round.
4. Frequenza di "non attivazione" delle carte classificate convergenti.
5. Winrate matchup principali (specie contro hard control / burst).

Soglie utili:
- se una carta "convergente forte" attiva <55%: probabilmente e solo situazionale;
- se una carta "asso" ha impatto stabile top-tier in tutti i matchup: va riclassificata;
- se un trigger domina >75% delle vittorie di armata: rischio identita troppo stretta.

---

## 11) Tabella decisione design (accetta/rifiuta)

| Condizione proposta nuova carta | Decisione consigliata |
|---------------------------------|------------------------|
| Rafforza bonus + piano armata senza creare loop | Accetta |
| Forte solo in un contesto controllabile (ordine/round) | Accetta con test |
| Sposta l'armata su piano opposto in modo sistematico | Rifiuta o nerfa |
| Crea snowball cumulativo su trigger gia dominante | Rifiuta salvo forte controcosto |
| E asso dichiarato ma copre un buco reale di matchup | Accetta (1-2 slot max) |
| Riduce drasticamente la leggibilita identitaria dell'armata | Rifiuta |

---

## 12) Cosa considero corretto e cosa no

Corretto:
- usare convergente/asso come bussola di design;
- ancorare la convergenza a **bonus armata + gameplan reale**;
- distinguere stato dati (fatti) da lettura strategica (interpretazione).

Da evitare:
- classificazioni assolute senza nota di affidabilita trigger;
- trattare "asso" come errore (spesso e una scelta di flessibilita);
- confondere naming narrativo con chiavi tecniche.

---

## 13) Conclusione operativa

Questo framework e adatto a:
- revisione identita armata,
- valutazione nuove carte in fase concept,
- confronto tra "coerenza di armata" e "potenza grezza".

Non sostituisce:
- test di winrate/matchup,
- test ordine primo/secondo,
- validazione metagame.

In sintesi: il discorso convergente/asso e **buono e verosimile**, se usato come **modello probabilistico guidato dal contesto**.

---

Fine documento.
