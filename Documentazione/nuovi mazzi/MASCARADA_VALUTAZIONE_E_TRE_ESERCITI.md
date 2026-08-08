# MASCARADA — VALUTAZIONE MECCANICA E TRE ESERCITI

## Fonti considerate

- `ARMATA_MASCARADA_v0.5.md`
- implementazione corrente di `Mascarada` in `src/data/cards.js`
- Bonus corrente in `src/data/armies.js`
- precostruiti introdotti nel commit `9fdd2a67039fe6971e6746f7dc24f145b99c4a67`

In caso di divergenza, questa analisi assume il codice come fonte di verità.

---

# 1. VERDETTO MECCANICO

## Giudizio complessivo

La Mascarada è una delle Armate più riuscite sul piano concettuale.

Il Bonus:

```text
Opportunista: +3 FC
```

non è un semplice generatore di risorse. Produce un rapporto diretto con la decisione segreta più importante del duello:

```text
quanto Focus è disposto a investire l’avversario
per superare la carta Mascarada
```

Quando il nemico spende almeno 5 FC:

- aumenta concretamente le proprie possibilità di vincere lo scontro;
- paga però 3 FC al giocatore Mascarada;
- spesso vince il Campo, ma finanzia il contrattacco successivo;
- rende più probabili Vendetta e Resistenza.

Il Bonus non funziona quindi come deterrente puro.

L’avversario non può semplicemente dire:

> “Non spenderò mai 5 FC.”

Limitarsi a 4 FC riduce troppo il proprio potenziale di assalto, soprattutto con l’attuale formula moltiplicativa del VA.

La Mascarada introduce quindi un **pedaggio inevitabile**, non una tassa facilmente aggirabile.

## Identità in una frase

> **La Mascarada costringe il nemico a scegliere fra perdere lo scontro o vincerlo finanziando lo spettacolo successivo.**

---

# 2. PERCHÉ IL BONUS FUNZIONA

## Frequenza corretta

La documentazione riporta:

```text
circa il 49% degli scontri oltre la soglia
circa 2 attivazioni per partita
96% dei Focus generati entro il terzo round
```

Questo è un ottimo profilo temporale.

Il Bonus:

- non è garantito;
- non arriva soltanto a partita quasi finita;
- non richiede al giocatore Mascarada di perdere volontariamente;
- dipende da una decisione reale dell’avversario;
- genera abbastanza Focus da cambiare le giocate successive.

## Valore comparativo

La simulazione documentata colloca `Opportunista: +3 FC` a circa:

```text
+12,4 punti percentuali di winrate
```

Il valore è vicino a Kethran e superiore a Enclave, ma molto sotto i Bonus estremi di Apex e Mounthborn.

Il risultato suggerisce che il Bonus non richiede una riscrittura.

## Asimmetria per Lega

L’attivazione del Bonus cresce con la POT della carta mostrata.

Le carte più costose tendono a presentare POT più alta e obbligano quindi il nemico a investire maggiormente.

La funzione approssimativa descritta nel documento è:

| Lega | Attivazione media stimata |
|:-:|---:|
| L2 | ~30% |
| L3 | ~41% |
| L4 | ~50% |
| L5 | ~51% |

Questo produce una struttura molto interessante:

```text
L2
→ fanno pagare la vittoria successiva

L3
→ gestiscono e convertono le risorse

L4
→ costringono il nemico a raggiungere la soglia

L5
→ spendono o capitalizzano il surplus
```

---

# 3. PUNTI DI FORZA DEL ROSTER

## 3.1 Interazione reale con il Focus

Molte Armate usano il Focus soltanto come risorsa universale.

La Mascarada lo trasforma invece in:

- oggetto di bluff;
- indicatore di rischio;
- risorsa trasferita indirettamente;
- informazione strategica;
- motore di sequenziamento.

Questo la distingue bene da:

- Enclave, che produce FC dopo una propria Conquista;
- Khemet, che investe 5 FC per ottenere Immune;
- Patto, che costruisce il Bonus tramite la Lega;
- Apex, che si attiva dopo un Campo conquistato.

## 3.2 Vendetta è l’accoppiamento naturale

La documentazione misura:

```text
P(Vendetta attiva dopo Opportunista) ≈ 67,7%
```

La ragione è semplice:

```text
nemico spende 5+ FC
→ Bonus Mascarada genera 3 FC
→ il nemico ha maggiore probabilità di vincere
→ nel turno successivo Vendetta è spesso disponibile
```

È una catena elegante perché non richiede una regola nuova.

## 3.3 Buona varietà di conversione

Il roster permette di reinvestire i Focus in modi differenti:

- Overdrive su Janissa, Komodo e Oleg;
- +POT moltiplicativa;
- controllo del Potere;
- +VA piatto;
- danni diretti;
- corpi alti che continuano a forzare puntate;
- Cura ed effetti di recupero.

## 3.4 Face e Heel possono restare narrativi

Non vedo una necessità meccanica immediata di trasformare Face e Heel in una nuova regola.

La distinzione funziona già come:

- identità visiva;
- criterio per i precostruiti;
- linguaggio narrativo;
- modo di rappresentare vantaggio e scorrettezza.

Aggiungere ora una regola Face/Heel rischierebbe di sovrapporsi a:

- Gloria;
- Vendetta;
- Magnanimo;
- Rimonta;
- Alleato e Rinforzi.

Meglio sfruttarla nella costruzione dei deck, non nel motore.

---

# 4. RISCHI E PUNTI DA TESTARE

## 4.1 Doppia ricompensa di Opportunista

Le due carte più delicate sono:

### Montgomery “Deep Piledriver”

```text
L4 — 4/4
Opportunista: +3 POT
Bonus: Opportunista: +3 FC
```

Quando il nemico spende almeno 5 FC:

```text
Montgomery diventa 7/4
e recupera 3 FC
```

Il +3 POT entra nella moltiplicazione del VA, quindi il payoff è enorme.

### Dandelion “Kingslayer’s Cutter”

```text
L5 — 6/3
Opportunista: 4 Danni diretti
Bonus: Opportunista: +3 FC
```

Con la stessa condizione:

```text
4 Danni diretti
+3 FC
corpo 6/3
```

Non ritengo necessario nerfarli prima del test, ma devono essere monitorati separatamente dal Bonus medio dell’Armata.

Il rischio non è soltanto che siano forti.

Il rischio è che diventino **auto-include**, riducendo la varietà reale del pool.

## 4.2 Documento e roster non sono più perfettamente sincronizzati

La matrice teorica dichiara:

```text
Opportunista ×6
Ultimo desiderio ×0
Conquista ×0
```

Il roster effettivo contiene invece:

```text
Opportunista personale ×2
Montgomery
Dandelion

Conquista ×2
Fantastique Jerome
Mordecai

Ultimo desiderio ×1
Killer
```

Questo non significa necessariamente che le carte siano sbagliate.

Significa che la matrice descrive una fase precedente del design e va aggiornata.

## 4.3 Eccezioni alla regola “non ridurre POT nemica”

La teoria afferma che ridurre la POT nemica lavora contro il Bonus, perché può scoraggiare l’investimento elevato.

Il roster contiene però:

- Belisa: `−2 POT`;
- Miguel: `−1 POT, −1 DAN`;
- Foxie: `−2 POT, −2 DAN`.

Le considero eccezioni accettabili, purché non diventino il nucleo dominante dell’Armata.

Servono come:

- strumenti da vantaggio;
- risposte di controllo;
- alternative quando il piano Opportunista non è sufficiente.

La regola dovrebbe quindi diventare:

> **La Mascarada non deve essere costruita principalmente intorno alla riduzione della POT nemica.**

Non:

> **La Mascarada non può mai possedere riduzioni della POT.**

## 4.4 Anomalie delle L2

Le tre carte più anomale sono:

- Janissa: `Overdrive: +11 VA`;
- Badgero: `Turbo: Immune` a L2;
- Blackwing: `Resa dei conti: +3 DAN` a L2.

Sono tutte comprensibili singolarmente.

Il rischio nasce se una curva bassa può combinarle troppo facilmente e ottenere:

- iniziativa frequente;
- corpi anomali;
- payoff da Leghe superiori;
- Bonus Armata comunque disponibile.

Vanno testate soprattutto in deck con cinque o sei L2.

## 4.5 Il centro L4 è dichiarato, ma non completamente espresso

La teoria identifica le L4 come motore della Mascarada.

Il roster possiede nove L4, ma soltanto Montgomery ha un Potere personale Opportunista.

Le altre L4 forzano comunque la spesa tramite POT e corpi, ma il legame è più indiretto di quanto suggerisca la matrice teorica.

Non è necessariamente un problema.

Il vantaggio è che le L4 non diventano tutte la stessa carta.

Il punto da verificare è se Montgomery e Dandelion risultino troppo superiori alle altre scelte.

---

# 5. TRE ESERCITI IMPLEMENTATI

Precostruiti in `src/data/cards.js` → `ARMY_DECKS.Mascarada` (sostituiscono la terna mono-L3 / senza L4 caricata in precedenza).

| Deck | Curva L2/L3/L4/L5 | Piano | Difficoltà |
|---|---|---|:---:|
| **Il Main Event** | 2 / 6 / 2 / 0 | Pedaggio, tecnici e reinvestimento | Media |
| **Curtain Call** | 5 / 1 / 3 / 1 | Gloria, vantaggio e chiusura | Facile–media |
| **Heel Turn** | 5 / 2 / 1 / 2 | Vendetta, perdita controllata e Opportunista | Alta |

Nessuna carta compare in tutti e tre i deck.

## A — Il Main Event

```text
1201 Janissa · 1204 Cadrega · 1209 Tuiala · 1210 Faletau · 1211 Houquan
1215 Filomena · 1214 Komodo · 1217 Nobunaga · 1219 Mordecai · 1226 Montgomery
```

## B — Curtain Call

```text
1201 Janissa · 1203 Badgero · 1205 Castillo · 1202 Belisa · 1206 Joe
1216 Kirin · 1222 Maximillion · 1220 Gran Torino · 1219 Mordecai · 1227 Mary
```

## C — Heel Turn

```text
1202 Belisa · 1203 Badgero · 1204 Cadrega · 1206 Joe · 1207 Blackwing
1211 Houquan · 1213 Miguel · 1218 Wulf · 1229 Killer · 1230 Dandelion
```

---

# 6. NUOVA TERNA (dettaglio)

I tre deck rifatti sono:

| Deck | Curva | Piano |
|---|---|---|
| **Il Main Event** | 2 L2 / 6 L3 / 2 L4 | Pedaggio, tecnici e reinvestimento |
| **Curtain Call** | 5 L2 / 1 L3 / 3 L4 / 1 L5 | Gloria, vantaggio e chiusura |
| **Heel Turn** | 5 L2 / 2 L3 / 1 L4 / 2 L5 | Vendetta, perdita controllata e Opportunista |

Le tre curve sono differenti e nessuna carta compare in tutti e tre i deck.

---

# 7. DECK A — IL MAIN EVENT

## Profilo

```text
Piano primario: Conquista tecnica
Piano secondario: economia reattiva
Difficoltà: Media

Curva:
2 L2
6 L3
2 L4

Lega: 30/30
POT totale: 33
DAN totale: 24
Corpo totale: 57

Somma Lega mani:
minimo 13
media 15
massimo 17
deviazione 1,05
```

Questo deck sostituisce il vecchio mono-L3.

Mantiene il centro tecnico, ma aggiunge:

- due L2 con ruoli opposti;
- due L4 che rappresentano il motore economico;
- un vero ciclo fra spesa nemica e reinvestimento.

## Lista

| # | Agente | L | POT/DAN | Potere |
|---:|---|:-:|:-:|---|
| 1 | Janissa “Coup de Grâce” | 2 | 2/2 | Overdrive: +11 VA |
| 2 | Cadrega “Cheap Shot” | 2 | 3/1 | Vendetta: 2 Danni diretti |
| 3 | Tuiala “Ocean Stomp” | 3 | 4/2 | Sopraffare: +1 POT, +1 DAN |
| 4 | Faletau “Shellsault” | 3 | 4/3 | Resistenza: +2 DAN |
| 5 | Houquan “Black Hurricanrana” | 3 | 2/3 | Imboscata: Copia POT |
| 6 | Filomena “Death Springboard” | 3 | 2/2 | Alleato: +3 POT |
| 7 | Komodo “Komodo Hug” | 3 | 4/2 | Overdrive: Blocca Potere |
| 8 | Nobunaga “Emperor’s Order: Guillotine” | 3 | 3/3 | Resa dei conti: +9 VA |
| 9 | Mordecai “Redemption Buster” | 4 | 5/2 | Conquista: +2 FC |
| 10 | Montgomery “Deep Piledriver” | 4 | 4/4 | Opportunista: +3 POT |

## Affidabilità dei pacchetti

### Carte capaci di costringere la spesa

Le cinque carte con POT almeno 4 sono:

- Tuiala;
- Faletau;
- Komodo;
- Mordecai;
- Montgomery.

```text
almeno una nella mano: 99,6%
almeno due nella mano: 89,7%
```

### Consumatori del surplus

- Janissa;
- Komodo.

```text
almeno uno nella mano: 77,8%
```

### Recupero dopo la vittoria nemica

- Cadrega;
- Faletau.

```text
almeno uno nella mano: 77,8%
```

### Filomena

Il deck contiene sei L3.

Data Filomena pescata:

```text
Alleato attivo: 99,2%
```

Filomena diventa quindi:

```text
2/2
→ 5/2
```

Non è più una carta bimodale inaffidabile.

## Sequenza ideale

```text
Mordecai o una L3 ad alta POT
→ il nemico investe molto
→ Bonus: +3 FC

se vinci:
Mordecai può aggiungere altri +2 FC

se perdi:
Cadrega o Faletau convertono il Campo nemico in pressione

surplus:
Janissa o Komodo
```

## Punti di forza

- Curva stabile.
- Motore L4 realmente presente.
- Filomena quasi sempre attiva.
- Copertura di prima posizione, Resistenza, Vendetta e centro partita.
- Due modi differenti di spendere il surplus.
- Montgomery mostra la doppia ricompensa Opportunista.

## Debolezze

- POT complessiva non elevata.
- Nessuna Cura.
- Montgomery può assorbire troppo valore rispetto alle altre L4.
- Nobunaga rende soprattutto dal terzo scontro.
- Houquan dipende dalla POT avversaria.
- Janissa richiede 5 FC per il massimo valore.

## Sensazione di gioco

> **“Ogni lottatore prepara il prossimo ingresso. Il pubblico paga il biglietto una seconda volta senza accorgersene.”**

---

# 8. DECK B — CURTAIN CALL

## Profilo

```text
Piano primario: Conquista e Gloria
Piano secondario: Supremazia
Difficoltà: Facile–media

Curva:
5 L2
1 L3
3 L4
1 L5

Lega: 30/30
POT totale: 35
DAN totale: 23
Corpo totale: 58

Somma Lega mani:
minimo 10
media 15
massimo 20
deviazione 1,83
```

Curtain Call è il deck Face.

Non richiede che tutte le carte siano letteralmente Face, ma la maggioranza costruisce una linea da vantaggio:

```text
apertura
→ prima vittoria
→ Gloria
→ Conquista
→ chiusura di Mary
```

## Lista

| # | Agente | L | POT/DAN | Potere |
|---:|---|:-:|:-:|---|
| 1 | Janissa “Coup de Grâce” | 2 | 2/2 | Overdrive: +11 VA |
| 2 | Badgero “Spear” | 2 | 4/1 | Turbo: Immune |
| 3 | Castillo “Tornillo” | 2 | 2/2 | Gloria: +3 POT |
| 4 | Belisa “Cazadora” | 2 | 3/2 | Magnanimo: −2 POT nemica |
| 5 | Joe “Legend Splash” | 2 | 2/3 | Vendetta: −1 POT, −1 DAN nemico |
| 6 | Kirin “Shocking Lariat” | 3 | 5/1 | Gloria: +2 DAN |
| 7 | Maximillion “Iron Press” | 4 | 4/4 | Turbo: Blocca Potere |
| 8 | Gran Torino “Toothbreaker” | 4 | 3/3 | Gloria: +2 POT, +2 DAN |
| 9 | Mordecai “Redemption Buster” | 4 | 5/2 | Conquista: +2 FC |
| 10 | Mary “Swan Punt Kick” | 5 | 5/3 | Gloria: +12 VA |

## Pacchetto apertura

- Badgero;
- Maximillion.

```text
almeno uno nella mano: 77,8%
entrambi: 22,2%
```

Badgero offre corpo 4/1 e Immune nei primi due round.

Maximillion blocca il Potere e possiede corpo 4/4.

## Pacchetto da vantaggio

Le cinque carte che rendono quando il deck è avanti o ha appena vinto sono:

- Castillo;
- Belisa;
- Kirin;
- Gran Torino;
- Mary.

```text
almeno una nella mano: 99,6%
almeno due: 89,7%
```

### Castillo

Dopo una vittoria:

```text
2/2
→ 5/2
```

### Kirin

Dopo una vittoria:

```text
5/1
→ 5/3
```

### Gran Torino

Dopo una vittoria:

```text
3/3
→ 5/5
```

### Mary

Dopo una vittoria:

```text
5/3
+12 VA
```

È la chiusura principale.

## Economia e consumo

`Mordecai` genera 2 FC su Conquista.

`Janissa` converte 5 FC in +11 VA.

Il Bonus dell’Armata può finanziare entrambi i rami.

## Ramo di recupero

`Joe` impedisce che il deck sia interamente dipendente dal vantaggio.

Dopo una perdita riduce POT e DAN nemici.

È una sola carta, quindi il deck resta chiaramente orientato allo snowball.

## Punti di forza

- Apertura concreta.
- Cinque payoff da vantaggio.
- Cura indiretta della curva tramite corpi solidi.
- Economia su Conquista.
- Chiusura Mary.
- Presenza reale delle L4.
- Linea semplice da apprendere.

## Debolezze

- Mano molto variabile.
- Cinque L2 possono produrre una mano poco incisiva.
- Molte carte rendono dopo una vittoria.
- Belisa può ridurre l’incentivo del nemico a spendere 5 FC.
- Una partenza fallita rallenta Castillo, Kirin, Gran Torino e Mary.
- Nessuna Cura diretta.

## Sensazione di gioco

> **“Il pubblico vuole un eroe. La Mascarada gli concede una vittoria, poi vende il finale.”**

---

# 9. DECK C — HEEL TURN

## Profilo

```text
Piano primario: controllo reattivo
Piano secondario: danni indiretti
Difficoltà: Alta

Curva:
5 L2
2 L3
1 L4
2 L5

Lega: 30/30
POT totale: 36
DAN totale: 24
Corpo totale: 60

Somma Lega mani:
minimo 10
media 15
massimo 20
deviazione 1,97
```

Heel Turn accetta che il nemico vinca alcuni scontri costosi.

Il piano è:

```text
forzare una grande puntata
→ ottenere +3 FC
→ perdere in modo controllato
→ attivare Vendetta o Resistenza
→ punire il secondo investimento
```

## Lista

| # | Agente | L | POT/DAN | Potere |
|---:|---|:-:|:-:|---|
| 1 | Belisa “Cazadora” | 2 | 3/2 | Magnanimo: −2 POT nemica |
| 2 | Badgero “Spear” | 2 | 4/1 | Turbo: Immune |
| 3 | Cadrega “Cheap Shot” | 2 | 3/1 | Vendetta: 2 Danni diretti |
| 4 | Joe “Legend Splash” | 2 | 2/3 | Vendetta: −1 POT, −1 DAN nemico |
| 5 | Blackwing “Headbutt” | 2 | 3/1 | Resa dei conti: +3 DAN |
| 6 | Houquan “Black Hurricanrana” | 3 | 2/3 | Imboscata: Copia POT |
| 7 | Miguel “Cobra Plunge” | 3 | 3/3 | Imboscata: −1 POT, −1 DAN nemico |
| 8 | Wulf “Sleeper Hold” | 4 | 5/3 | Vendetta: −6 VA nemico |
| 9 | Killer “Widow’s Wail” | 5 | 5/4 | Ultimo desiderio: +2 FC |
| 10 | Dandelion “Kingslayer’s Cutter” | 5 | 6/3 | Opportunista: 4 Danni diretti |

## Pacchetto di apertura

- Badgero;
- Houquan;
- Miguel.

```text
almeno uno nella mano: 91,7%
almeno due: 50,0%
```

La curva bassa tende inoltre a favorire la prima posizione iniziale.

## Pacchetto Vendetta

- Cadrega;
- Joe;
- Wulf.

```text
almeno uno nella mano: 91,7%
almeno due: 50,0%
```

Le tre ricompense sono differenti:

```text
Cadrega
→ 2 Danni diretti

Joe
→ riduzione POT e DAN

Wulf
→ −6 VA nemico
```

## Campioni Heel

### Killer

Se perde lo scontro:

```text
Ultimo desiderio
→ +2 FC
```

Il giocatore può utilizzare Killer come:

- minaccia 5/4;
- bluff;
- sconfitta economica controllata.

### Dandelion

Se il nemico spende almeno 5 FC:

```text
Bonus Armata
→ +3 FC

Potere personale
→ 4 Danni diretti
```

È la carta più esplosiva del roster e la chiusura principale.

## Perché Houquan sostituisce Filomena

Il precostruito originale usava Filomena con soltanto due L3.

Houquan non richiede concentrazione di Lega e sostiene la prima posizione.

La sostituzione elimina una carta inattiva nel 55,6% delle mani in cui veniva pescata.

## Punti di forza

- Apertura nel 91,7% delle mani.
- Vendetta nel 91,7%.
- Corpo totale più alto della terna.
- Due L5 con funzioni opposte.
- Danni diretti.
- Produzione di FC anche perdendo.
- Buon rapporto con le puntate elevate nemiche.

## Debolezze

- Deviazione di Lega molto alta.
- Cinque L2 possono produrre mani fragili.
- Belisa e Miguel possono scoraggiare la soglia del Bonus.
- Dandelion rischia di essere un’auto-include.
- Blackwing rende soltanto dal terzo scontro.
- Nessuna Cura.
- Il pilotaggio richiede distinguere una sconfitta utile da una sconfitta gratuita.

## Sensazione di gioco

> **“Il pubblico crede che la scorrettezza sia il trucco. Il trucco vero è farsi pagare anche quando si perde.”**

---

# 10. CONFRONTO FINALE

| Metrica | Il Main Event | Curtain Call | Heel Turn |
|---|---:|---:|---:|
| Lega | 30 | 30 | 30 |
| Curva | 2/6/2/0 | 5/1/3/1 | 5/2/1/2 |
| POT totale | 33 | 35 | **36** |
| DAN totale | **24** | 23 | **24** |
| Corpo totale | 57 | 58 | **60** |
| Deviazione mani | **1,05** | 1,83 | 1,97 |
| Piano | Tecnico | Vantaggio | Reattivo |
| Difficoltà | Media | Facile–media | Alta |

## Utilizzo del pool

Le tre liste utilizzano complessivamente:

```text
25 delle 30 carte Mascarada
```

Condivisioni:

```text
Main Event ↔ Curtain Call
Janissa
Mordecai

Main Event ↔ Heel Turn
Cadrega
Houquan

Curtain Call ↔ Heel Turn
Belisa
Badgero
Joe
```

Nessuna carta compare in tutti e tre i deck.

---

# 11. VERDETTO FINALE

La Mascarada non necessita di una riprogettazione.

Necessita di:

1. aggiornare la matrice teorica al roster effettivo;
2. testare separatamente Montgomery e Dandelion;
3. monitorare le anomalie L2;
4. evitare precostruiti che ignorino sistematicamente le L4;
5. utilizzare Filomena soltanto con una densità di L3 adeguata.

Il Bonus è forte, leggibile e sufficientemente originale.

L’identità migliore non è:

> **“L’Armata che guadagna Focus quando il nemico spende molto.”**

È:

> **“L’Armata che rende costosa perfino una risposta corretta e trasforma il grande investimento nemico nel finanziamento del prossimo spettacolo.”**
