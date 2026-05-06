# SATZE — Identità e sinergie (note di design)

Questo file è **curato a mano**: ragruppa ruoli tipici delle carte e sinergie ricorrenti per armata. I numeri, i nomi e i testi dei poteri restano definitivi in [`src/data/cards.js`](../src/data/cards.js); il catalogo tabellare aggiornato automaticamente è in [`CARTE.md`](./CARTE.md) (`node scripts/generate-carte-md.mjs`).

Quando cambiano carte o bilanciamento, conviene aggiornare anche le tabelle qui sotto.

---

## ☄️ Figli dell'Orizzonte

### Identità

| Ruolo | Carte |
|-------|-------|
| Pressione VA | Sorethal, Portatore della Domanda |
| Turbo / primo round | L'Eco del Primo Sole, Richiamante dell'Ordine |
| Focus Coin | Tessitrice della Trama, Cartografo del Vuoto, Vethan |
| Blocco effetti | Eco Svanente (Blocca Bonus), Serath (Blocca Potere a Resa dei conti) |
| Copia / adattamento | L'Ultimo Specchio di Oris |
| Attrizione / peeling POT | Condensato per la Guerra |
| Chiusura / danni da caduta | Leggero Richiamato (Ultima Chance), Ashara (Imboscata) |
| Scaling su Vendetta / Gloria | Naela, Il Portatore della Campana |

### Sinergie

- Il **bonus armata** (-5 VA nem., min 6) si combina con **Sorethal** e **Portatore della Domanda** per stringere la partita sul valore d’assalto.
- **Turbo** su **Eco del Primo Sole** (+8 VA) e **Richiamante** (2 danni diretti in Turbo) premiano la lettura del turno Turbo.
- **Serath** a Resa dei conti neutralizza il potere nemico: si abbina a lineup che già controllano VA, per chiudere senza risposte.
- Tre carte costruiscono **economia FC** (102, 104, 115): utile se il mazzo punta su trigger legati a risorse o follow-up in round successivi.

---

## 🏛️ Kethran

### Identità

| Ruolo | Carte |
|-------|-------|
| Boss / curve alta | Ur-Nammu, Nimrod |
| Rimonta / immune | Spirito della Spira |
| Vendetta | Profeta delle Rovine, Berserker della Spira |
| Escalation POT | Eco del Tradimento |
| Chiusura ultimi PV | Araldo della Fine, Martire della Spira, Ultimo Testimone |
| Controllo bonus | Custode della Ziqqurat |
| Gloria / momentum | Seguace Fanatico, Ombra della Spira |
| Trade-off PV | Il Primo Mattone |
| Utility scala | Costruttore Maledetto (Resistenza), Sacerdote della Ricomposizione (Sfida) |

### Sinergie

- **Bonus armata** (“Rimonta: +2 POT”) rende **Spirito della Spira** il pivô ideale: immune proprio quando sei in rimonta sui PV.
- Catena **Vendetta**: Profeta (+2 DAN), Berserker (+1 POT/+1 DAN), Nimrod (+2 DAN a Resa dei conti) — costruzione aggressiva dopo il primo colpo subìto.
- **Il Primo Mattone** (-2 PV a Conquista) può aiutare ad entrare in fascia Rimonta con cautela (sinergia situazionale col bonus armata).
- **Eco del Tradimento** (Escalation POT) premia round lunghi e ripetuti confronti sullo stesso piano numerico.

---

## 🔥 Corte Rossa

### Identità

| Ruolo | Carte |
|-------|-------|
| Boss / burst | Vaelith Sorn, Generale Karthessi |
| Copia potere / POT | L'Estrattrice, Avvocato del Diavolo, Generale Karthessi |
| Debuff POT | Esattore Infernale, Dammeri Spezzato, Ombra del Creditore |
| Debuff DAN | Archivista degli Obblighi |
| Blocco | Tentatore d'Anime (Blocca Potere), Giudice Corrotto (Blocca Bonus a Resa dei conti) |
| Danni diretti | Artigiano Velithari |
| Curve compatte | Larva della Corte, Messaggero Burlone, Anima Dannata |

### Sinergie

- **Copia Bonus nemico** (bonus armata) moltiplica il valore delle carte che vivono di confronto diretto sul piano risorse/tempo — ottimo con lineup ricche di **Intervento** e **Imboscata**.
- **Copia Potere** su **Estrattrice** (Intervento) e **Generale** (Resa dei conti) permette di rubare il miglior effetto nemico nei momenti chiave del clock del duello.
- **Tentatore** + **Giudice** coprono due assi diversi (potere vs bonus), rendendo difficile per il nemico “caricare tutto” su un solo tipo di effetto.

---

## ⚙️ Calibri Pesanti

### Identità

| Ruolo | Carte |
|-------|-------|
| Tank assoluto | Titano Corazzato MK-IV (Immune) |
| Overdrive / FC engine | Nucleo di Comando Nord, Bastione Ambulante, Cannone Semovente |
| Finish line | Protocollo Cenere (Sopraffare: 4 danni diretti) |
| Magnanimo / scaling | Pugno del Fronte Ovest |
| Supporto / cura | Tecnico di Prima Linea |
| Controllo poteri | Guardiano di Settore |
| Attrizione | Analista da Combattimento |
| Riduzione DAN nem. | Operaio Meccanico (stack morale col bonus armata -2 DAN) |

### Sinergie

- **Bonus armata** (-2 DAN nem., min 2) **somma** con **Operaio Meccanico** per rendere molto costosi i picchi danneggianti nemici.
- **Titano** + curve **Overdrive** (402, 403, 413): investimento FC → payoff di POT o danni diretti quando il campo è maturo.
- **Protocollo Cenere** e **Cannone** portano **danni diretti** dopo che la riduzione DAN nemica ha già ammorbidito la risposta avversaria.

---

## 🌙 Orathai

### Identità

| Ruolo | Carte |
|-------|-------|
| Gloria / POT | Voce della Fine, La Guida del Bosco |
| Overdrive estremo | La Tempesta Cava (+12 VA) |
| Magnanimo | Radice dei Caduti, L'Eco Vivente, Il Fiore della Vittoria |
| Economia FC | Albero della Linfa d'Oro, Il Seme Finale, Radice dei Caduti |
| Copia POT | Il Parassita Armonico |
| Cura | Il Muschio Curativo, Il Canto della Cenere, L'Albero dei Trofei |
| Blocco bonus | La Spina nel Bosco |
| Tossina | Il Germoglio Ostinato |
| Imboscata | Il Cacciatore Paziente |

### Sinergie

- **Bonus armata** (+2 DAN a Resa dei conti) valorizza chi **arriva vivo** al trigger: **Eco Vivente** e **Voce della Fine** amplificano il profilo danneggiante sui round contabili.
- **Tempesta Cava** è la leva VA “unica”: costruzione mazzo che protegge i PV fino all’Overdrive o che genera FC per sostenere la partita lunga.
- Fascia **cura** (508, 513, 514) + **Blocca Bonus** (504) definisce uno stile controllo-valore sul campo.

---

## 🦠 Mounthborn

### Identità

| Ruolo | Carte |
|-------|-------|
| Leader | Regina della Colonia, L'Evoluzione Finale |
| Immune / Turbo | Regina (Immune a Resa dei conti), Evoluzione (Turbo +2/+2) |
| Invasione / escalation DAN | Bruto Corazzato |
| Copia POT | Divoratore di Menti |
| Imboscata line | L'Apripista, Larva Esplosiva, L'Ago Nascosto, L'Interrutore |
| Debuff POT nem. | Vedova Viola |
| Danni diretti | Seminatore di Rovina, Zanzara Furiosa |
| Sacrificio PV | Larva Esplosiva, Il Nido Ambulante |

### Sinergie

- **Bonus armata** (+1 POT, +1 DAN su **Imboscata**) rende densi **Apripista**, **Interrutore**, **Larva Esplosiva**, **Ago**: primo round molto minaccioso.
- **Regina** + **Evoluzione**: una chiude con immune contestuale, l’altra esplode il Turbo — due piani temporali diversi sullo stesso mazzo aggressivo.
- Carte che pagano **PV** (607, 609) sono deliberate per cambiare la corsa PV complessiva e favorire swing successivi (sinergia narrativa più che matematica fissa).

---

## 🐉 L'Enclave delle Scaglie

### Identità

| Ruolo | Carte |
|-------|-------|
| Boss statistiche | Patriarca dell'Enclave |
| Immune tardivo | Drago Antico Addormentato |
| Accumulo FC | Servo del Tesoro, Draghetto (Overdrive), Uovo (Ultima Chance), Custode del Tesoro (Escalation) |
| Turbo / Gloria | Cavaliere del Wyrm, Araldo della Fiamma |
| Burst Overdrive | Divoratore d'Oro |
| Danni diretti | Piromante della Corte |
| Controllo | Guardiano della Tana |

### Sinergie

- **Bonus armata** (Conquista: +2 FC) si integra con molte carte che già producono FC su **Conquista**, **Gloria**, **Ultimo desiderio**, **Ultima Chance**, **Overdrive** — economia “dragone” a più velocità.
- **Custode del Tesoro** (Escalation POT+DAN in Imboscata) + **Patriarca** (Invasione +1/+1): due motori di crescita stat diversi sul tempo di gioco.
- **Drago Antico** offre immune su **Vendetta**, utile nei finali dopo che Patriarca e FC hanno già messo il nemico sotto soglia.

---

## 🐀 Ratti della Megera

### Identità

| Ruolo | Carte |
|-------|-------|
| Blocco potere | La Megera Eterna |
| Debuff POT | Flagello della Colonia, Strega del Crepuscolo, Ratto delle Ombre |
| Debuff VA | Portatore di Peste, Spia della Megera |
| Debuff DAN | Sciamano dei Miasmi, Larva Strisciante |
| Tossina | Untore Silenzioso, Ratto Infetto, Divoratore di Speranza |
| Blocco bonus | Custode della Fogna |
| Danni diretti / opportunisti | Ratto Moribondo, Portatore di Ossa |
| Picchi POT su Vendetta | Ratto Gigante |

### Sinergie

- **Bonus armata** (Conquista: Tossina 2, min 4) converte le **Conquiste** in pressione lenticolare sui PV — si combina con le carte che applicano **Tossina** su altri trigger per uno stile attrito.
- **Megera Eterna** + **Custode della Fogna**: chiudono due binari diversi (potere vs bonus nemico).
- Molti debuff sono **ripetibili su più assi** (POT, DAN, VA): contro lineup che dipendono da un solo stat, la partita si inclina verso errore operativo avversario più che burst immediato.

---

*Ultimo aggiornamento note: Maggio 2026*
