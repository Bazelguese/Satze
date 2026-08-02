# APEX — PRIMI TRE ESERCITI

## Identità dell’Armata

**Bonus:** `Invasione: +5 VA`

Il Bonus di Apex si attiva quando il giocatore ha già conquistato almeno un Campo.

```text
0 Campi conquistati
→ Bonus inattivo

1 o più Campi conquistati
→ +5 VA su ogni successiva carta Apex giocata
```

Il Bonus non cresce con il numero dei Campi conquistati: la soglia è binaria.

Questo divide ogni partita Apex in due fasi:

```text
prima della prima Conquista
→ il mazzo deve funzionare con i soli corpi e Poteri

dopo la prima Conquista
→ ogni carta riceve +5 VA
→ il vantaggio tende a propagarsi
```

L’Armata non può quindi essere costruita soltanto con carte forti “dopo l’attivazione”. Deve contenere:

- strumenti per conquistare il primo Campo;
- carte che trasformano la prima vittoria in continuità;
- risposte quando il primo Campo viene perso;
- modi per convertire il +5 VA in Conquista, Supremazia o pressione diretta.

L’identità di Apex è:

> **Cacciare la prima preda senza il sostegno della Loggia, poi usare il territorio conquistato per rendere ogni cacciatore successivo più efficiente.**

I tre eserciti esplorano tre interpretazioni:

| Esercito | Piano primario | Uso di Invasione |
|---|---|---|
| **La Prima Preda** | Snowball di Conquista | Converte la prima vittoria in Gloria e blocchi |
| **La Loggia Non Arretra** | Controllo e sustain | Usa +5 VA per stabilizzare corpi L2/L4 |
| **La Caccia Maggiore** | Adattamento e pressione | Somma +5 VA a trigger che leggono nemico e stato partita |

Tutti rispettano:

```text
10 carte
30 punti Lega esatti
0 duplicati interni
```

---

# ESERCITO A — LA PRIMA PREDA

## Profilo

```text
Tipo: identitario
Piano primario: Conquista
Piano secondario: snowball e Supremazia
Curva: bilanciata

Lega: 30/30
POT totale: 35
DAN totale: 28
Corpo totale: 63

Curva:
4×L2
3×L3
2×L4
1×L5

Somme delle mani:
minimo 11
media 15
massimo 19
deviazione 1,67
```

Questo è il mazzo che mostra nel modo più chiaro il ritmo Apex:

```text
aprire il varco
→ conquistare il primo Campo
→ attivare Invasione
→ usare Gloria e blocchi per mantenere l’iniziativa
```

## Lista

| # | Agente | L | POT/DAN | Potere | Funzione |
|---:|---|:-:|:-:|---|---|
| 1 | Sentinella della tundra | 2 | 3/1 | Turbo: +5 VA | Apertura |
| 2 | Restauratore di trofei | 2 | 2/2 | Imboscata: +2 POT | Apertura |
| 3 | Cacciatore ubriaco | 2 | 2/3 | Opportunista: +2 FC | Economia |
| 4 | Zanna Corta, l’abile lanciere | 2 | 3/2 | Sfida: +1 POT, +1 DAN | Risposta alle Leghe alte |
| 5 | Capobranco per un Giorno | 3 | 4/2 | Gloria: +2 POT | Snowball |
| 6 | Leggiossa | 3 | 3/3 | Imboscata: Copia Bonus | Apertura adattiva |
| 7 | Svuotanidi | 3 | 4/2 | Turbo: −6 VA nemico (min 6) | Apertura di controllo |
| 8 | Scagliabraci | 4 | 3/4 | Imboscata: +9 VA | Prima Conquista |
| 9 | Dissuasore di turisti | 4 | 4/4 | Invasione: Blocca Potere | Continuità |
| 10 | Volontà del Sole Verde | 5 | 7/5 | Gloria: Blocca Bonus | Chiusura |

## Controllo della Lega

```text
4×2 = 8
3×3 = 9
2×4 = 8
1×5 = 5

Totale = 30
```

## Pacchetto di apertura

Le cinque carte che possono incidere immediatamente sui primi due scontri sono:

- Sentinella;
- Restauratore;
- Leggiossa;
- Svuotanidi;
- Scagliabraci.

Probabilità:

| Aperture nella mano | Probabilità |
|---:|---:|
| almeno una | **99,6%** |
| almeno due | 89,7% |
| almeno tre | 50,0% |

Il mazzo quasi mai dipende da un corpo neutro per conquistare il primo Campo.

### Sentinella

```text
3 POT
+5 VA da Turbo
```

È una partenza leggera che conserva Focus per il resto della partita.

### Restauratore

In Imboscata raggiunge POT 4.

È meno esplosivo di Sentinella, ma ogni Focus investito beneficia della POT aumentata.

### Leggiossa

Copia il Bonus nemico quando gioca per primo.

Contro alcune Armate può diventare la miglior apertura del mazzo; contro altre è soltanto un corpo 3/3.

### Svuotanidi

Riduce il VA nemico di 6 nei primi due scontri.

È particolarmente efficace contro puntate alte, perché la riduzione resta fissa.

### Scagliabraci

```text
3 POT
+9 VA da Imboscata
```

È la carta più diretta per ottenere la prima Conquista.

Il suo DAN 4 rende la vittoria immediatamente rilevante anche per la Supremazia.

## Pacchetto snowball

Le carte che migliorano direttamente dopo una precedente Conquista sono:

- Capobranco;
- Dissuasore;
- Volontà del Sole Verde.

Almeno una compare nel:

```text
91,7% delle mani
```

Almeno due compaiono nel:

```text
50,0% delle mani
```

### Capobranco

Dopo una vittoria raggiunge POT 6.

A questa POT si aggiunge il Bonus Apex:

```text
Gloria: +2 POT
Invasione: +5 VA
```

### Dissuasore

Dopo la prima Conquista riceve contemporaneamente:

```text
Bonus: +5 VA
Potere: Blocca Potere
```

È la carta che rappresenta meglio l’identità dell’esercito: il territorio conquistato migliora la contesa e spegne la risposta avversaria.

### Volontà del Sole Verde

Dopo una vittoria:

```text
7/5
Blocca Bonus
+5 VA da Invasione
```

È una chiusura estremamente pesante, ma richiede che il giocatore abbia già ottenuto il controllo della partita.

## Economia

`Cacciatore ubriaco` produce 2 FC se il nemico investe almeno 5 Focus.

Non è una fonte affidabile in ogni partita, ma obbliga l’avversario a considerare il costo aggiuntivo di una puntata elevata.

## Gestione del Focus

### Prima della prima Conquista

- Sentinella e Svuotanidi possono rendere con puntate moderate.
- Scagliabraci non deve essere sovraccaricato se il +9 VA è già sufficiente.
- Leggiossa va valutato in base al Bonus copiabile.
- Zanna Corta compete bene contro Leghe superiori.

### Dopo Invasione

Il +5 VA permette di:

- ridurre il Focus necessario sulle carte di controllo;
- rendere Capobranco più efficiente;
- finanziare Volontà del Sole Verde senza esaurire tutto il budget;
- bluffare con carte apparentemente deboli.

## Punti di forza

- Apertura nel 99,6% delle mani.
- DAN totale 28.
- Pacchetto snowball nel 91,7%.
- Blocco di Potere e Bonus.
- Copia del Bonus nemico.
- Curva completa e adattabile.
- Forte capacità di convertire una vittoria in altre vittorie.

## Debolezze

- Prima della prima Conquista alcune carte sono molto più ordinarie.
- Volontà rende soprattutto in Gloria.
- Cacciatore dipende dalla puntata nemica.
- Leggiossa dipende dal matchup.
- Una sconfitta iniziale può ritardare l’intero piano.
- Nessuna Cura.

## Errore tipico

> Spendere troppo per la prima Conquista e non avere abbastanza Focus per sfruttare Invasione.

Il primo Campo è un mezzo, non il traguardo.

## Sensazione di gioco

> **“La prima preda apre la pista. Tutte le altre scoprono troppo tardi che la Loggia era già in marcia.”**

---

# ESERCITO B — LA LOGGIA NON ARRETRA

## Profilo

```text
Tipo: controllo e sustain
Piano primario: Supremazia
Piano secondario: Conquista progressiva
Curva: bifascia

Lega: 30/30
POT totale: 41
DAN totale: 22
Corpo totale: 63

Curva:
5×L2
0×L3
5×L4

Somme delle mani:
minimo 10
media 15
massimo 20
deviazione 1,67
```

Il mazzo è diviso in due blocchi:

```text
L2
→ apertura, utilità, recupero, riduzione del DAN

L4
→ controllo, Cura, corpi pesanti e chiusura
```

> **La Loggia accetta di pagare carne per ottenere il territorio, poi usa Cura, Resistenza e controllo per non restituirlo.**

## Lista

### Blocco L2

| Agente | POT/DAN | Potere | Funzione |
|---|:-:|---|---|
| Sentinella della tundra | 3/1 | Turbo: +5 VA | Apertura |
| Veterano finito | 4/1 | Conquista: −3 PV a te | Prima Conquista rischiosa |
| Cavalca-tagliagole | 3/2 | Resistenza: +1 POT, +1 DAN | Recupero |
| Zanna Corta, l’abile lanciere | 3/2 | Sfida: +1 POT, +1 DAN | Contesa contro Leghe alte |
| Delinquenti pianta-trappole | 2/3 | Alleato: −2 DAN nemico (min 1) | Protezione PV |

### Blocco L4

| Agente | POT/DAN | Potere | Funzione |
|---|:-:|---|---|
| Domafuoco | 5/2 | Ultima Chance: −2 POT, −2 DAN nemico (min 3) | Chiusura |
| Pioggia notturna | 6/2 | Alleato: Blocca Bonus | Controllo |
| Terrore Cremisi | 6/4 | Conquista: −5 PV a te | Corpo offensivo |
| Senzariposo | 4/3 | Resistenza: −3 POT nemica (min 3) | Recupero |
| Campione dell’Ora Verde | 5/2 | Conquista: Cura 4 | Riparazione |

## Controllo della Lega

```text
5×2 = 10
5×4 = 20

Totale = 30
```

## Affidabilità di Alleato

Il deck contiene cinque L2 e cinque L4.

Quando `Delinquenti pianta-trappole` viene pescato, la probabilità di trovare almeno un’altra L2 è:

```text
96,0%
```

Quando `Pioggia notturna` viene pescata, la probabilità di trovare almeno un’altra L4 è:

```text
96,0%
```

Entrambe sono quindi quasi sempre pienamente operative.

## Pacchetto tributo e riparazione

Le tre carte centrali sono:

- Veterano finito;
- Terrore Cremisi;
- Campione dell’Ora Verde.

Almeno una compare nel:

```text
91,7% delle mani
```

Almeno due compaiono nel:

```text
50,0% delle mani
```

### Veterano finito

Corpo 4/1 a Lega 2.

Se conquista, infligge 3 PV al proprio giocatore.

Può essere usato per ottenere il primo Campo a basso costo di Lega, ma il suo DAN 1 e il costo in PV impediscono di trattarlo come apertura automatica.

### Terrore Cremisi

Corpo 6/4.

Se conquista, infligge 5 PV al proprio giocatore.

È una delle carte più forti del pool in termini di corpo, ma può distruggere la Supremazia se giocata senza un piano di recupero.

### Campione dell’Ora Verde

Conquista e cura 4.

Può:

- recuperare il costo del Veterano;
- mitigare quello del Terrore;
- stabilizzare una partita già avanti;
- trasformare il +5 VA di Invasione in una Conquista più affidabile.

## Pacchetto controllo e recupero

Le sei carte di tenuta sono:

- Cavalca-tagliagole;
- Delinquenti;
- Domafuoco;
- Pioggia notturna;
- Senzariposo;
- Campione dell’Ora Verde.

Ogni mano ne contiene almeno una:

```text
100%
```

Almeno due compaiono nel:

```text
97,6%
```

### Dopo un Campo perso

Si attivano:

- Cavalca-tagliagole;
- Senzariposo;
- la scelta del Campo successivo.

Cavalca-tagliagole diventa 4/3.

Senzariposo riduce la POT nemica di 3, fino a un minimo di 3.

### Nel quinto scontro

Domafuoco riduce POT e DAN nemici di 2, fino ai rispettivi minimi.

Il Bonus Apex può aggiungere +5 VA se il giocatore possiede già un Campo, rendendo Domafuoco una chiusura molto completa.

## La prima Conquista

Le principali opzioni sono:

- Sentinella;
- Veterano finito;
- Terrore Cremisi;
- Campione dell’Ora Verde.

Almeno una compare nel:

```text
97,6% delle mani
```

La scelta non riguarda soltanto chi può vincere.

Riguarda quale costo il giocatore è disposto ad accettare:

```text
Sentinella
→ basso DAN, nessun costo PV

Veterano
→ corpo efficiente, −3 PV

Terrore
→ corpo enorme, −5 PV

Campione
→ corpo medio, Cura 4
```

## Gestione del Focus

Le L2 devono generalmente:

- contenere le spese;
- assorbire un turno;
- ridurre il DAN;
- costringere l’avversario a investire.

Le L4 devono convertire il vantaggio:

- Pioggia blocca il Bonus;
- Terrore conquista con forza;
- Campione recupera PV;
- Senzariposo recupera un Campo;
- Domafuoco chiude.

## Punti di forza

- POT totale 41.
- Corpo totale 63.
- Alleato quasi sempre attivo.
- Controllo o sustain in ogni mano.
- Cura 4.
- Riduzione di POT e DAN.
- Due corpi molto efficienti per la propria Lega.
- Bonus Apex utile a entrambe le fasce.

## Debolezze

- Nessuna L3.
- Mani molto diverse fra loro.
- Due carte possono infliggere gravi danni al proprietario.
- Nessuna produzione di Focus.
- Il DAN medio non è elevato senza Terrore.
- Una mano troppo L2 può faticare a chiudere.
- Una mano troppo L4 può richiedere molto Focus.

## Errore tipico

> Usare Terrore Cremisi soltanto perché il suo corpo è il migliore.

Una vittoria che costa 5 PV può essere peggiore di una sconfitta controllata.

## Sensazione di gioco

> **“La Loggia perde sangue, non terreno. E il sangue versato viene contato prima della caccia successiva.”**

---

# ESERCITO C — LA CACCIA MAGGIORE

## Profilo

```text
Tipo: adattivo
Piano primario: Conquista selettiva
Piano secondario: pressione sui PV e sulle risorse
Curva: centrale

Lega: 30/30
POT totale: 37
DAN totale: 23
Corpo totale: 60

Curva:
3×L2
5×L3
1×L4
1×L5

Somme delle mani:
minimo 12
media 15
massimo 18
deviazione 1,49
```

La Caccia Maggiore non cerca sempre lo stesso bersaglio.

Legge:

- quanto Focus investe il nemico;
- quale Lega viene giocata;
- chi ha vinto il Campo precedente;
- chi è avanti nei PV;
- quale Bonus può essere copiato.

> **La preda decide quale arma usare contro di lei. Apex decide quando il +5 VA rende quell’arma sufficiente.**

## Lista

| # | Agente | L | POT/DAN | Potere | Funzione |
|---:|---|:-:|:-:|---|---|
| 1 | Restauratore di trofei | 2 | 2/2 | Imboscata: +2 POT | Apertura |
| 2 | Cacciatore ubriaco | 2 | 2/3 | Opportunista: +2 FC | Economia |
| 3 | Cavalca-tagliagole | 2 | 3/2 | Resistenza: +1 POT, +1 DAN | Recupero |
| 4 | Scorticatore delle Spoglie | 3 | 3/3 | Vendetta: +2 DAN | Contrattacco offensivo |
| 5 | Strappazanne | 3 | 5/1 | Sopraffare: +2 DAN | Caccia alle Leghe basse |
| 6 | Cavalca-belve | 3 | 4/1 | Overdrive: +2 POT, +2 DAN | Picco di investimento |
| 7 | Veterano della tana | 3 | 3/3 | Rimonta: +3 POT | Recupero PV |
| 8 | Leggiossa | 3 | 3/3 | Imboscata: Copia Bonus | Adattamento |
| 9 | Picchiagranchi | 4 | 6/1 | Sopraffare: 3 Danni diretti | Pressione indiretta |
| 10 | Bravo, il merita-nome | 5 | 6/4 | Opportunista: +3 FC | Corpo ed economia |

## Controllo della Lega

```text
3×2 = 6
5×3 = 15
1×4 = 4
1×5 = 5

Totale = 30
```

## Densità di trigger adattivi

Le sette carte che reagiscono direttamente al nemico o allo stato della partita sono:

- Cacciatore ubriaco;
- Cavalca-tagliagole;
- Scorticatore;
- Strappazanne;
- Veterano della tana;
- Picchiagranchi;
- Bravo.

Ogni mano ne contiene almeno due:

```text
100%
```

Almeno tre compaiono nel:

```text
91,7% delle mani
```

Il mazzo non ha quasi mai una mano priva di una direzione tattica.

## Opportunista

Le due carte Opportunista sono:

- Cacciatore ubriaco;
- Bravo.

Almeno una compare nel:

```text
77,8% delle mani
```

Entrambe compaiono nel:

```text
22,2% delle mani
```

Se il nemico investe almeno 5 FC:

```text
Cacciatore
→ +2 FC

Bravo
→ +3 FC
```

Bravo possiede inoltre un corpo 6/4, quindi può contendere realmente lo scontro mentre genera risorse.

## Sfida implicita e Sopraffare

Il deck possiede due strumenti contro carte di Lega inferiore:

- Strappazanne;
- Picchiagranchi.

### Strappazanne

Contro una Lega inferiore:

```text
5/1
→ 5/3
```

Dopo la prima Conquista riceve anche +5 VA.

### Picchiagranchi

Contro una Lega inferiore infligge 3 danni diretti.

Il suo DAN stampato è soltanto 1, quindi la pressione dipende dal Potere.

Il Bonus Apex migliora la possibilità di vincere, ma i danni diretti vengono ottenuti dal trigger Sopraffare.

## Recupero

Le tre carte di recupero sono:

- Cavalca-tagliagole;
- Scorticatore;
- Veterano della tana.

Almeno una compare nel:

```text
91,7% delle mani
```

Almeno due compaiono nel:

```text
50,0% delle mani
```

### Dopo una perdita

Scorticatore raggiunge DAN 5 tramite Vendetta.

Cavalca-tagliagole diventa 4/3 se il nemico possiede almeno un Campo.

### Quando sei sotto nei PV

Veterano della tana raggiunge POT 6.

Con Invasione attiva:

```text
6 POT
+5 VA
```

diventa una risposta molto efficiente.

## Overdrive

Cavalca-belve è l’unica carta con Overdrive personale:

```text
4/1
→ 6/3 con almeno 5 FC
```

Il Bonus Apex non dipende dai Focus, quindi può sommarsi:

```text
Overdrive: +2 POT, +2 DAN
Invasione: +5 VA
```

È il picco più completo del deck, ma richiede sia un Campo conquistato sia una puntata elevata.

## Copia del Bonus

Leggiossa copia il Bonus nemico in Imboscata.

Il valore varia enormemente:

- contro Bonus statistici può diventare un’apertura forte;
- contro Bonus condizionali può non produrre nulla;
- contro Bonus di controllo può ribaltare il matchup.

Non deve essere giocata automaticamente per prima.

## Prima Conquista

Le aperture esplicite sono:

- Restauratore;
- Leggiossa.

Il mazzo possiede meno Turbo rispetto agli altri due eserciti.

Compensa attraverso:

- corpi solidi;
- Bravo 6/4;
- Strappazanne 5/1;
- lettura delle Leghe;
- puntate opportunistiche;
- possibilità di recuperare se la prima caccia fallisce.

Questa è la lista meno lineare della terna.

## Gestione del Focus

- Conservare 5 FC per Cavalca-belve soltanto quando Overdrive è decisivo.
- Usare Cacciatore e Bravo per punire investimenti nemici.
- Non sovrainvestire su Picchiagranchi: parte del valore è nei danni diretti.
- Usare Veterano della tana quando Rimonta è attiva.
- Sfruttare il +5 VA di Invasione per diminuire il costo delle risposte.

## Punti di forza

- Almeno due trigger adattivi in ogni mano.
- Economia Opportunista nel 77,8%.
- Recupero nel 91,7%.
- Corpo 6/4 su Bravo.
- Danni diretti.
- Copia Bonus.
- Overdrive personale.
- Curva delle mani più stabile della terna.

## Debolezze

- Prima Conquista meno automatica.
- Molti Poteri dipendono dalla carta o dalla puntata nemica.
- Picchiagranchi ha DAN stampato 1.
- Cavalca-belve richiede 5 FC.
- Nessuna Cura.
- Una lettura sbagliata del matchup riduce molto il valore di Leggiossa.
- Il deck è più difficile da pilotare.

## Errore tipico

> Cercare di attivare tutti i trigger disponibili invece di scegliere quello che serve per vincere il Campo.

Adattarsi non significa fare tutto. Significa usare la risposta più economica.

## Sensazione di gioco

> **“La Caccia Maggiore non comincia quando trovi la preda. Comincia quando capisci cosa la farà correre.”**

---

# CONFRONTO DEI TRE ESERCITI

| Metrica | La Prima Preda | La Loggia Non Arretra | La Caccia Maggiore |
|---|---:|---:|---:|
| Lega | 30 | 30 | 30 |
| POT totale | 35 | **41** | 37 |
| DAN totale | **28** | 22 | 23 |
| Corpo totale | **63** | **63** | 60 |
| Curva | 4/3/2/1 | 5/0/5/0 | 3/5/1/1 |
| Deviazione mani | 1,67 | 1,67 | **1,49** |
| Aperture dedicate | **5** | 2–4 | 2 |
| Gloria/Invasione personali | **3** | 0 | 0 |
| Cura | 0 | **1** | 0 |
| Produzione FC | 1 | 0 | **2** |
| Danni diretti | 0 | 0 | **1** |
| Recupero | 0–1 | **4** | 3 |
| Difficoltà | Facile–media | Media | Alta |

## Perché funzionano come terna

### La Prima Preda

Insegna:

- ottenere la prima Conquista;
- riconoscere il momento in cui Invasione si attiva;
- concatenare Gloria, blocchi e +5 VA;
- non spendere tutto sul primo Campo.

### La Loggia Non Arretra

Insegna:

- gestione di L2 e L4;
- valore di Alleato;
- costi in PV;
- Cura e controllo;
- differenza fra conquistare un Campo e mantenere il vantaggio.

### La Caccia Maggiore

Insegna:

- Opportunista;
- Sopraffare;
- Vendetta, Rimonta e Resistenza;
- Overdrive personale;
- copia del Bonus;
- lettura del matchup.

## Diversità del pool

Le tre liste utilizzano complessivamente **24 delle 30 carte** Apex.

Condivisioni:

```text
A ↔ B:
Sentinella della tundra
Zanna Corta

A ↔ C:
Restauratore di trofei
Cacciatore ubriaco
Leggiossa

B ↔ C:
Cavalca-tagliagole
```

Nessuna carta compare in tutti e tre gli eserciti.

## Ordine consigliato

```text
1. La Prima Preda
2. La Loggia Non Arretra
3. La Caccia Maggiore
```

## Identità finale di Apex

Apex non è semplicemente:

> “L’Armata che ottiene +5 VA dopo aver vinto un Campo.”

È:

> **L’Armata che deve dimostrare di poter cacciare senza vantaggio, per poi trasformare il primo territorio conquistato in superiorità sistematica.**

Le tre interpretazioni sono:

```text
inseguire
→ resistere
→ adattarsi
```
