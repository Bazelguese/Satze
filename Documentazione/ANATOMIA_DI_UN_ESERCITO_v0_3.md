# SATZE — ANATOMIA DI UN ESERCITO

*Metodo di costruzione e verifica dei deck da 10 Agenti*  
*Bozza v0.3 — Agosto 2026*  
*Dipende da `SISTEMA_ARCHETIPI_v3.md` v3.4, `RINFORZI_E_ALLEATO.md` e dalle regole base di SATZE*

> **Stato:** fondazione metodologica. Le formule e le grandezze sono definite; le soglie di allerta sono volutamente marcate ⚖️ finché non vengono calibrate sui mazzi precostruiti e sui playtest. Le scelte di design ancora aperte sono marcate 🔶.

### Cosa cambia rispetto alla v0.2

| | |
|---|---|
| **Iniziativa formalizzata** | §6.6 e §9. `E[somma Lega della mano] = Lega totale / 2`, e la distribuzione è simmetrica attorno a quel centro: due deck con lo stesso totale hanno **esattamente** il 50%, non "tendono al 50%". Rimossa una curva illegale da 32 punti. |
| **Denominatori coerenti** | §10.4. Il confronto Patto/Armate standard usava tre grandezze diverse come fossero una. Ora una metrica unica. |
| **Spazio decisionale** | §12. Enumerabili sono gli *ordinamenti* (30.240), non le linee complete: con le allocazioni di Focus lo spazio è 259.096.320 anche ignorando l'avversario. Il divario confronta politiche, non ordini. |
| **Inefficienza asimmetrica** | §7.2. Una differenza firmata trattava "ho speso 2 FC di troppo" e "mi mancavano 2 FC e ho perso il Campo" come lo stesso errore. Ora tre grandezze. |
| **Settimo avviso** | §13.7. La Prova 7 non aveva ricaduta nell'interfaccia. Aggiunto anche l'immobilizzo relativo. |
| **Alleato nelle dipendenze** | §8. Mancava dalla tabella dopo la separazione dei due trigger. |

---

## 1. PRINCIPIO CENTRALE

Un esercito SATZE **non è semplicemente una lista di 10 carte**.

È l'insieme di:

1. **252 possibili mani iniziali** da 5 carte;
2. le possibili **sequenze di cinque giocate** costruibili da ogni mano;
3. il modo in cui quelle sequenze spendono i **18 Focus Coin**;
4. la capacità di raggiungere una delle tre condizioni di vittoria;
5. il comportamento dell'esercito nei diversi matchup.

> **Un buon esercito è un deck le cui mani più probabili riescono a costruire una sequenza sensata di cinque turni coerente con il piano dichiarato.**

Non è necessario che tutte le 252 mani siano perfette. È necessario che il piano non dipenda da una singola carta, che le carte non si contendano sistematicamente la stessa finestra e che il budget di Focus non richieda più risorse di quelle disponibili.

### Cosa questo documento non farà

Non stabilirà quote universali come:

- «ogni deck deve avere 3 Campioni»;
- «servono almeno 2 Carnefici»;
- «non si possono usare più di 2 Scalanti».

Queste regole sarebbero false: la composizione corretta dipende dal piano di vittoria, dal Bonus Armata, dalla curva di Lega e dal rapporto col Focus.

Il documento definisce invece **prove funzionali** che ogni esercito deve superare.

---

## 2. I TRE LIVELLI DI ANALISI

### 2.1 Deck — le 10 carte

A questo livello si misura:

- piano di vittoria dichiarato;
- distribuzione degli Archetipi;
- curva di Lega;
- concentrazione dei trigger;
- numero di carte Voraci, Predatrici, Indifferenti e Prodighe;
- presenza di carte Scalanti;
- ridondanza delle funzioni essenziali.

Il deck descrive **cosa può pescare**, non ciò che farà davvero in partita.

### 2.2 Mano — le 252 combinazioni da 5

È il livello principale.

Per ogni mano bisogna verificare:

- accesso al piano;
- presenza di una giocata iniziale accettabile;
- distribuzione delle finestre temporali;
- compatibilità dei trigger;
- domanda di Focus;
- pressione sui Campi e sui PV;
- possibilità di ordinare tutte e cinque le carte senza sacrificare più carte del necessario.

### 2.3 Matchup — mano contro mano

Alcune proprietà non esistono in isolamento:

- chi ottiene l'iniziativa;
- quanto valgono Imboscata e Intervento;
- quanto rendono le carte Predatrici;
- se Sfida o Sopraffare sono attivabili;
- quanto sono affidabili Copia, Imponi, Blocca Potere e Blocca Bonus;
- quale piano prevale nello scontro tra due eserciti.

L'analisi di matchup viene dopo quella del deck e delle mani. Un esercito che funziona solo contro un avversario specifico non è strutturalmente sano: è un counterdeck.

---

## 3. IL PIANO DI VITTORIA

Ogni esercito deve dichiarare **un piano primario**. Le altre condizioni restano vie secondarie o risultati emergenti.

### 3.1 Conquista

Obiettivo: conquistare 3 Campi entro la finestra in cui la vittoria territoriale è disponibile.

Un esercito da Conquista necessita soprattutto di:

- capacità di vincere almeno 3 dei primi 4 scontri;
- carte competitive già nei turni iniziali e centrali;
- efficienza nel trasformare i Focus in VA;
- bassa congestione tardiva;
- strumenti per ottenere la prima vittoria e alimentare Gloria, Conquista o Invasione;
- capacità di continuare a competere anche dopo una sconfitta iniziale.

Il DAN elevato è utile ma non è un requisito centrale. Un Assaltatore che perde lo scontro non conquista il Campo.

### 3.2 Annientamento

Obiettivo: portare i PV avversari a 0.

Un esercito da Annientamento necessita di:

- pressione PV sufficiente;
- capacità di vincere gli scontri che portano DAN;
- Assaltatori, Carnefici, DAN naturale elevato o Bonus Armata offensivi;
- linee che non dipendano tutte dalla stessa condizione;
- sufficiente economia di Focus per finanziare le carte che devono connettere il DAN.

La presenza di Carnefici non è obbligatoria. Il requisito è la **pressione PV credibile**, non un archetipo specifico.

### 3.3 Supremazia

Obiettivo: arrivare alla fine con più PV dell'avversario.

Un esercito da Supremazia necessita di:

- vantaggio netto nello scambio di PV;
- Guardiani, Soffocatori, danni efficienti o corpi capaci di limitare le perdite;
- controllo del budget di Focus;
- carte ancora funzionali nel turno finale;
- capacità di evitare che una linea troppo aggressiva consumi tutte le risorse prima della chiusura.

Per Supremazia conta la differenza di PV, non il danno inflitto. Servono però **due grandezze distinte, calcolabili a livelli diversi**.

**Contributo attivo ai PV** — misurabile su deck o mano, senza conoscere l'avversario:

```text
Contributo attivo = PV sottratti + PV curati + DAN prevenuti − autolesioni
```

**Scarto PV effettivo** — esiste soltanto nel matchup:

```text
Scarto PV effettivo = PV finali propri − PV finali avversari

per flussi:  danni inflitti + cure ricevute + danni prevenuti
             − danni subiti − autolesioni − cure avversarie
```

La seconda non è stimabile in isolamento: richiede probabilità di vincere ciascuno scontro, DAN ed effetti delle carte avversarie, puntate, trigger e Campi.

> **Per Supremazia il contributo attivo non basta.** Un deck può generare molto valore attivo e incassare comunque più danni di quanti ne infligge. La v0.1 chiamava "scarto" quella che era solo la metà attiva del bilancio.

### 3.4 Piano primario e vie secondarie

Un esercito non deve essere ugualmente forte in tutte e tre le condizioni. Deve però evitare di essere completamente privo di una via di recupero quando il piano primario diventa irraggiungibile.

🔶 **Decisione da calibrare:** il deck builder richiederà soltanto un piano primario oppure consentirà di dichiarare anche un piano secondario? La prima soluzione è più semplice; la seconda permette avvisi più precisi.

---

## 4. AFFIDABILITÀ DELLA PESCA

Con 10 carte nel deck e 5 in mano, ogni carta singola viene pescata nel **50%** delle partite.

Un piano non può quindi dipendere da un Agente unico.

### 4.1 Probabilità di pescare carte appartenenti a un gruppo

Se il deck contiene `K` carte che svolgono una funzione essenziale, la probabilità di pescarne `x` nella mano da 5 segue la distribuzione ipergeometrica:

```text
P(X = x) = C(K, x) × C(10 − K, 5 − x) / C(10, 5)
```

| Carte della funzione nel deck | Almeno 1 in mano | Almeno 2 | Almeno 3 |
|---:|---:|---:|---:|
| 1 | 50.0% | 0.0% | 0.0% |
| 2 | 77.8% | 22.2% | 0.0% |
| 3 | 91.7% | 50.0% | 8.3% |
| 4 | 97.6% | 73.8% | 26.2% |
| 5 | 99.6% | 89.7% | 50.0% |
| 6 | 100.0% | 97.6% | 73.8% |

### 4.2 Conseguenze pratiche

- Una funzione presente su **1 carta** è un'opzione, non il piano.
- Con **2 carte**, almeno una appare spesso, ma entrambe insieme soltanto nel 22.2% delle mani.
- Con **3 carte**, la funzione compare quasi sempre, ma due copie funzionali compaiono soltanto in metà delle mani.
- Con **4 carte**, il deck può ragionevolmente aspettarsi almeno due carte di quella funzione.

Poiché SATZE non consente duplicati, “ridondanza” significa usare **Agenti differenti che svolgono lo stesso lavoro**, non copie della stessa carta.

### 4.3 Accesso al piano

Per ogni esercito si dovrà definire un insieme di **carte-portanti** del piano. Il primo controllo sarà:

```text
Accesso al piano = % di mani che contengono abbastanza carte-portanti
```

“Abbastanza” dipende dal piano:

- Conquista richiede più carte capaci di contestare gli scontri iniziali;
- Annientamento richiede una massa sufficiente di pressione PV;
- Supremazia richiede una combinazione di pressione e protezione.

Le soglie non vengono fissate nella v0.3. Verranno calibrate sui precostruiti. ⚖️

---

## 5. LA SEQUENZA DI CINQUE TURNI

Una mano non è sana soltanto perché contiene carte forti. Deve poterle **ordinare**.

### 5.1 Le cinque finestre

| Finestra | Turni | Domanda principale |
|---|---|---|
| Apertura | 1 | Esiste una carta che posso giocare senza bruciare valore essenziale? |
| Sviluppo | 2 | Posso proseguire senza consumare già il mio finisher? |
| Snodo | 3 | Il deck inizia a convertire il proprio piano? |
| Chiusura | 4 | Quante carte reclamano questa finestra? |
| Ultimo turno | 5 | Ho più di una carta che funziona solo qui? |

Queste non sono nuove etichette per le carte. Sono slot dell'analizzatore.

### 5.2 Carta autonoma

Una carta è **autonoma in una finestra** quando può essere giocata lì senza richiedere uno stato improbabile e senza perdere una quota eccessiva del valore per cui è stata pagata in Lega.

L'autonomia dipende da:

- corpo base;
- trigger;
- effetto;
- turno;
- iniziativa;
- stato dei PV e dei Campi;
- Focus disponibili.

Non è un tag permanente.

### 5.3 Carta tardiva rigida

Una carta è tardiva rigida quando giocarla prima della sua finestra ideale produce una perdita strutturale, non soltanto una lieve inefficienza.

Esempi evidenti:

- `Ultima Chance`: finestra obbligata al turno 5;
- Attrizione con corpo molto sotto curva;
- Scalanti che raggiungono un corpo adeguato soltanto al turno 4 o 5.

`Collezionista di Spade` è il caso guida: L4 2/1 con Attrizione POT/DAN. Al turno 1 il Potere vale 0 e il corpo è equivalente a una carta di Lega molto inferiore. Non preferisce il late game: **lo richiede**.

### 5.4 Congestione tardiva

La mano dispone di due slot realmente tardivi: turni 4 e 5. La presenza di tre carte che richiedono quegli slot crea conflitto, ma la gravità dipende dalla loro flessibilità.

Il controllo deve quindi calcolare:

```text
Congestione = domanda complessiva di slot tardivi − capacità tardiva disponibile
```

Non basta contare Scalanti, Resa dei conti e Ultima Chance. Bisogna misurare quanto ciascuna carta resta giocabile prima.

⚖️ **Soglie da calibrare:** percentuale di mani con almeno 2 o almeno 3 carte tardive rigide; deficit minimo di corpo che rende una Scalante “rigida”.

---

## 6. IL BUDGET DI LEGA


SATZE ha **due economie**, non una. Vengono spese in momenti diversi e limitano cose diverse.

| Risorsa | Si spende | Limita | Totale | Obbligatorio | Discrezionale |
|---|---|---|---:|---:|---:|
| **Lega** | costruzione del deck | qualità, curva, iniziativa, Rinforzi | 30 | 20 | **10** |
| **Focus** | durante la partita | intensità delle cinque giocate | 18 | 5 | **13** |

La riga della Lega è il dato che mancava alla v0.1. Un deck di 10 carte non può scendere sotto **20 punti** (dieci carte di Lega 2) e non può superare **30**. Il vero spazio di manovra della costruzione è quindi di **10 punti**, non di 30 — esattamente come il budget Focus reale è 13 e non 18.

Questa simmetria non è decorativa: significa che ogni punto di Lega speso sopra il minimo è una scelta che esclude un'altra scelta, allo stesso modo di un FC investito in un turno.

### 6.1 Lo spazio delle configurazioni

Enumerando tutte le ripartizioni di 10 carte fra L2, L3, L4 e L5 con somma ≤ 30:

```
configurazioni legali:            67
massimo carte L5 in un deck:       3
massimo carte L4 in un deck:       5
massimo carte L3 in un deck:      10
```

**Non esiste alcun deck con più di 3 carte di Lega 5.** Non è una linea guida: è aritmetica del cap. Analogamente, un deck non può avere più di 5 carte di Lega 4.

Tre configurazioni consumano esattamente i 30 punti e delimitano lo spazio:

| Configurazione | L2 | L3 | L4 | L5 | Carattere |
|---|:-:|:-:|:-:|:-:|---|
| Piatta media | 0 | 10 | 0 | 0 | nessuna varianza di mano, nessun picco |
| Bipolare | 5 | 0 | 5 | 0 | metà budget sui picchi, metà riempitivo |
| Estrema | 6 | 1 | 0 | 3 | massimo picco consentito, resto al minimo |

### 6.2 Il pool non offre tutte le Leghe in egual misura

| Armata | L2 | L3 | L4 | L5 |
|---|:-:|:-:|:-:|:-:|
| Figli dell'Orizzonte | 7 | 10 | 9 | 4 |
| Kethran | 7 | 10 | 9 | 4 |
| Corte Rossa | 7 | 10 | 9 | 4 |
| Calibri Pesanti | 7 | 10 | 9 | 4 |
| Orathai | 7 | 10 | 9 | 4 |
| Mounthborn | 7 | 10 | 9 | 4 |
| L'Enclave delle Scaglie | 7 | 10 | 9 | 4 |
| Ratti della Megera | 7 | 10 | 9 | 4 |
| Patto degli Indocili | 8 | 11 | 11 | 0 |
| Khemet | 7 | 10 | 9 | 4 |
| Apex | 7 | 10 | 9 | 4 |
| **Pool completo** | **78** | **111** | **101** | **40** |

Dieci Armate su undici hanno la stessa identica ripartizione **7 / 10 / 9 / 4**. È uno standard di design, non un caso.

L'eccezione è il **Patto degli Indocili: 8 / 11 / 11 / 0**. Non possiede alcuna carta di Lega 5, quindi **non può costruire la configurazione Estrema**, e il suo picco massimo è L4. È un vincolo identitario forte che è deliberato: interagisce direttamente col suo Bonus `Rinforzi`, che a Lega 5 sarebbe comunque limitato al 16.7% di attivazione (vedi §6.4). Il vincolo di design e l'aritmetica del cap puntano nella stessa direzione.

### 6.3 Rendimento decrescente dei punti Lega

| Lega | Corpo medio (POT+DAN) | Corpo per punto Lega |
|:-:|---:|---:|
| 2 | 4.23 | **2.12** |
| 3 | 5.90 | **1.97** |
| 4 | 7.49 | **1.87** |
| 5 | 9.07 | **1.81** |

Il corpo cresce con la Lega, ma **il corpo per punto speso cala**: da 2.12 a L2 fino a 1.81 a L5. Salire di Lega non compra efficienza, compra **concentrazione** — più statistiche su una singola carta, che è utile solo se quella carta arriva in mano e trova la sua finestra. Una L5 che resta nel mazzo costa 5 punti e rende 0; e resta nel mazzo nel 50% delle partite.

### 6.4 Il costo delle configurazioni Alleato e Rinforzi

Due trigger dipendono dalla concentrazione di Lega, con soglie diverse (vedi `RINFORZI_E_ALLEATO.md`):

- **Alleato** — 1 altra carta della stessa Lega in mano
- **Rinforzi** — 2 altre carte della stessa Lega in mano; è anche la condizione di attivazione del Bonus del Patto degli Indocili

§10 stabilisce le probabilità. Qui si aggiunge il prezzo in punti Lega.

| Lega scelta | k=3 | k=4 | k=5 | k=6 | k=7 |
|:-:|---|---|---|---|---|
| **L2** | 6 pt → 3.43/carta | 8 pt → 3.67/carta | 10 pt → 4.00/carta | 12 pt → 4.50/carta | 14 pt → 5.33/carta |
| **L3** | 9 pt → 3.00/carta | 12 pt → 3.00/carta | 15 pt → 3.00/carta | 18 pt → 3.00/carta | 21 pt → 3.00/carta |
| **L4** | 12 pt → 2.57/carta | 16 pt → 2.33/carta | 20 pt → 2.00/carta | **impossibile** | **impossibile** |
| **L5** | 15 pt → 2.14/carta | **impossibile** | **impossibile** | **impossibile** | **impossibile** |

Lettura: la cella indica quanti punti restano in media per ciascuna delle altre carte del deck. La soglia di fattibilità è 2.00, il minimo di Lega di una carta.

- **L3 è la Lega neutra.** Qualunque concentrazione lascia esattamente 3.00 punti per carta — la media naturale del deck. Concentrare su L3 non costa nulla in termini di curva.
- **L2 rende il deck più ricco.** Sei carte L2 costano 12 punti e lasciano 4.50 per ciascuna delle altre quattro.
- **L4 si ferma a k=5.** Sei carte L4 costano 24 punti e lascerebbero 1.50 per carta: aritmeticamente impossibile.
- **L5 si ferma a k=3.** Quattro carte L5 sono già illegali.

Il tetto di `k` per Lega si traduce direttamente in un tetto di affidabilità sui due trigger:

| Lega | k max legale | Alleato max | Rinforzi max |
|:-:|---:|---:|---:|
| 2 | 10 | 1.00 | 1.00 |
| 3 | 10 | 1.00 | 1.00 |
| 4 | 5 | 0.96 | **0.64** |
| 5 | 3 | 0.72 | **0.17** |

**Una carta Rinforzi di Lega 5 non può superare 0.17 di affidabilità in nessun deck legale.** Il pool non ne contiene infatti nessuna.

### 6.5 Somma di Lega delle mani e varianza

L'iniziativa del turno 1 va a chi ha la somma di Lega più bassa fra le 5 carte pescate. La curva del deck non determina un valore, ma una **distribuzione**.

| Curva | Lega deck | Somma minima | Media | Massima | Dev. std |
|---|---:|---:|---:|---:|---:|
| Piatta bassa (10×L2) | 20 | 10 | 10.0 | 10 | 0.00 |
| Piatta media (10×L3) | 30 | 15 | 15.0 | 15 | 0.00 |
| Bilanciata (4L2,3L3,3L4) | 29 | 11 | 14.5 | 18 | 1.38 |
| Bipolare (5L2,5L4) | 30 | 10 | 15.0 | 20 | 1.67 |
| Estrema (6L2,1L3,3L5) | 30 | 10 | 15.0 | 20 | 2.24 |
| Compatta (2L2,6L3,2L4) | 30 | 13 | 15.0 | 17 | 1.05 |

Tutte e sei le curve rispettano il cap di 30 punti. Si noti che **nessuna curva legale ha centro superiore a 15**: il cap fissa il massimo di `totale/2`. A parità di 30 punti le curve differiscono solo per dispersione, mai per centro — motivo per cui non esiste una curva "alta" in senso proprio.

### Il teorema dell'iniziativa

Ogni carta del deck entra in mano con probabilità esatta 1/2. Quindi:

```text
E[somma Lega della mano] = Lega totale del deck / 2
```

E c'è di più: per ogni mano possibile esiste la mano complementare, la cui somma è `totale − somma`. **La distribuzione delle somme è quindi simmetrica attorno al proprio centro**, sempre, qualunque sia la composizione.

Da cui la proprietà che governa l'iniziativa:

> **Due deck con la stessa Lega totale hanno esattamente il 50% di probabilità di cominciare per primi l'uno contro l'altro.** Non "tendono al 50%": è un'identità, non una tendenza.

Verificato: *Piatta media*, *Bipolare* ed *Estrema* sono tutte da 30 punti, hanno deviazioni standard da 0.00 a 2.24, e si affrontano esattamente al 50%.

### Media e varianza misurano cose diverse

> **La Lega totale determina il centro della distribuzione; la composizione della curva ne determina la varianza.**

- La **media** produce il bias sistematico contro deck di Lega totale diversa.
- La **deviazione standard** determina quanto l'iniziativa oscilla da una pesca all'altra.

Le curve *Piatta media*, *Bipolare* ed *Estrema* condividono media 15.0 e totale 30, ma la varianza va da **0.00 a 2.24**. La prima produce sempre la stessa somma; l'ultima oscilla fra 10 e 20.

Conseguenza diretta: **un deck a varianza zero ha un'iniziativa perfettamente prevedibile ma non manipolabile**; un deck ad alta varianza a volte apre e a volte risponde, senza poterlo scegliere. Nessuna delle due è superiore in astratto, ma **la varianza dev'essere coerente col numero di carte Imboscata e Intervento** che il deck contiene. Un deck a varianza 2.24 con quattro carte Imboscata sta scommettendo sulla pesca.

### 6.6 Estremi realizzabili del bias d'iniziativa

P(giocare primo al turno 1), riga contro colonna:

| | Piatta bassa (20) | Piatta media (30) | Bilanciata (29) | Bipolare (30) | Estrema (30) | Compatta (30) |
|---|---|---|---|---|---|---|
| **Piatta bassa** (20 pt) | 50.0% | 100.0% | 100.0% | 99.8% | 98.8% | 100.0% |
| **Piatta media** (30 pt) | 0.0% | 50.0% | 36.9% | 50.0% | 50.0% | 50.0% |
| **Bilanciata** (29 pt) | 0.0% | 63.1% | 50.0% | 58.9% | 57.2% | 60.8% |
| **Bipolare** (30 pt) | 0.2% | 50.0% | 41.1% | 50.0% | 50.0% | 50.0% |
| **Estrema** (30 pt) | 1.2% | 50.0% | 42.8% | 50.0% | 50.0% | 50.0% |
| **Compatta** (30 pt) | 0.0% | 50.0% | 39.2% | 50.0% | 50.0% | 50.0% |

Fra i numeri in parentesi c'è la Lega totale. **Ogni coppia con lo stesso totale dà esattamente 50.0%** — *Piatta media*, *Bipolare*, *Estrema* e *Compatta* sono tutte da 30 punti e si affrontano fra loro al 50%, malgrado deviazioni standard da 0.00 a 2.24. Non è approssimazione: è il teorema sopra.

Gli estremi seguono il totale, non la forma. Una curva *Piatta bassa* (20 punti, il minimo assoluto) gioca per prima nel **98.8–100%** dei casi contro qualunque altra curva. Le quattro curve da 30 punti si affrontano fra loro esattamente al 50%, quali che siano le loro forme; il bias compare solo verso totali diversi, come la *Bilanciata* da 29 punti.

Ma la *Piatta bassa* paga quel controllo totale con **10 punti Lega non spesi su 30**: rinuncia a un terzo del budget di costruzione per comprare l'iniziativa.

> **L'iniziativa sistematica si compra rinunciando a punti Lega. Redistribuire lo stesso budget modifica la volatilità, non il bias medio.**

```
controllo sistematico dell'iniziativa  ←→  punti Lega per corpo e Poteri
redistribuzione a parità di totale     ←→  volatilità dell'iniziativa, non bias
```

### 6.7 Lega, Archetipo e Rapporto col Focus

Le Leghe non offrono gli stessi archetipi. Percentuale entro ciascuna Lega:

| Lega | n | Campione | Assaltatore | Soffocatore | Sabotatore | Carnefice | Guardiano | Catalizzatore | Colosso |
|:-:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 78 | 37.2% | 14.1% | 10.3% | 3.8% | 12.8% | 9.0% | 7.7% | 5.1% |
| 3 | 111 | 27.9% | 18.0% | 15.3% | 14.4% | 9.9% | 5.4% | 6.3% | 2.7% |
| 4 | 101 | 23.8% | 17.8% | 19.8% | 12.9% | 12.9% | 8.9% | 3.0% | 1.0% |
| 5 | 40 | 25.0% | 22.5% | 12.5% | 20.0% | 5.0% | 7.5% | 5.0% | 2.5% |

Tre asimmetrie rilevanti per la costruzione:

- **Campione è sovrarappresentato a L2** (37.2%) e meno frequente nelle Leghe superiori (23.8–27.9%). L'andamento non è monotono: risale leggermente a L5. Chi vuole molti Campioni li trova a buon mercato in basso.
- **Sabotatore è quasi assente a L2** (3.8%) e raggiunge la massima incidenza relativa a L5 (20.0%) — dove però non è l'archetipo numericamente prevalente. Un deck che vuole manipolare i Poteri **deve** spendere budget: non è un'opzione economica.
- **Catalizzatore è concentrato soprattutto nelle Leghe basse** (7.7% a L2 contro 3.0% a L4). L'economia dei Focus si finanzia con carte economiche, il che è coerente ma va sfruttato deliberatamente.

| Lega | n | Vorace | Predatore | Indifferente | Prodigo |
|:-:|---:|---:|---:|---:|---:|
| 2 | 78 | 43.6% | 7.7% | 41.0% | 7.7% |
| 3 | 111 | 26.1% | 8.1% | 59.5% | 6.3% |
| 4 | 101 | 24.8% | 13.9% | 58.4% | 3.0% |
| 5 | 40 | 25.0% | 10.0% | 60.0% | 5.0% |

**Le carte Voraci sono sovra-rappresentate a Lega 2 (43.6% contro ~25% alle altre Leghe).**

> **Il pool L2 espone a una maggiore concentrazione di carte Voraci: una curva bassa costruita senza controllare il Rapporto col Focus può comprare iniziativa al prezzo di una maggiore domanda di FC.**

Non è automatico — nulla obbliga una curva bassa a essere Vorace — ma è la deriva naturale se il costruttore guarda solo alla Lega. Le due economie interagiscono, e in direzione opposta a quella che l'intuizione suggerisce. ⚖️

### 6.8 Base per la Prova 7

> **Le carte giustificano i punti Lega assorbiti, e la curva sostiene il piano del deck?**

| Input | Output |
|---|---|
| Lega totale e ripartizione L2/L3/L4/L5 | punti Lega non spesi (su 30) |
| Statistiche e Potere di ogni carta | quota di budget immobilizzata in carte tardive rigide |
| Rigidità temporale (flag Scalante, trigger) | costo della configurazione Rinforzi, se presente |
| Trigger Rinforzi | distribuzione delle somme di Lega delle 252 mani (media e dev. std) |
| Carte Imboscata e Intervento | coerenza fra varianza di curva e carte dipendenti dall'iniziativa |
| Archetipo e Rapporto col Focus | interazione fra curva e domanda di Focus |

**Metrica proposta — immobilizzo tardivo:**

```
Immobilizzo assoluto = Σ(Lega tardive rigide) / 30
Immobilizzo relativo = Σ(Lega tardive rigide) / Lega effettivamente spesa
```

Il primo misura quanta parte del **cap massimo** viene assorbita; il secondo quanto quelle carte pesano **nel deck realmente costruito**. La differenza conta soprattutto quando il costruttore rinuncia deliberatamente a punti Lega per comprare iniziativa: su un deck da 22 punti, 8 punti immobilizzati sono il 27% del cap ma il 36% della spesa reale.

`Collezionista di Spade` (L4, corpo 2/1, Attrizione POT/DAN) da solo vale **13.3% del budget di costruzione**, e al turno 1 offre un corpo da Lega 1 con un Potere che vale 0. Due carte di questo profilo immobilizzano **oltre un quarto del budget** su un payoff che richiede uno dei due soli slot tardivi disponibili.

La distinzione da fare non è fra tardive e non tardive, ma fra:

- **tardive economiche** (L2–L3): situazionali ma poco costose, accettabili anche con probabilità media di raggiungere la finestra;
- **tardive costose** (L4–L5): devono avere probabilità **elevata** di arrivare alla propria finestra, altrimenti il deck sta pagando molto per un'opzione. ⚖️

Nel pool, le carte Scalanti sono distribuite abbastanza uniformemente per Lega (6.3–7.9%), quindi il problema non è che le Scalanti siano tutte costose: è che **il costruttore può facilmente sceglierne di costose senza accorgersi del cumulo**.
---

## 7. ECONOMIA DEI FOCUS

Ogni giocatore dispone di 18 FC e deve investire almeno 1 FC in ciascuno dei cinque scontri.

```text
Budget totale:       18 FC
Spesa obbligatoria:   5 FC
Budget discrezionale: 13 FC
Media disponibile:  3.6 FC per turno
```

### 7.1 Conseguenze immediate

Senza generazione di FC:

- tre giocate da 5 FC più due giocate da 1 costano 17 FC;
- quattro giocate da 5 FC più una da 1 costano 21 FC e sono impossibili;
- accumulare troppe carte che chiedono 4–5 FC costringe una parte della mano a essere giocata al minimo.

### 7.2 La puntata è segreta — e questo cambia il modello

`REGOLE_Rework.md` righe 69 e 74: entrambi i giocatori scelgono **segretamente** quanti FC investire.

La v0.1 formulava la domanda di Focus come somma dei FC necessari a far svolgere a ogni carta il lavoro previsto. Non è sbagliato, ma descrive il **costo ottimale a informazione completa** — quanto sarebbe bastato spendere *sapendo* quanto punta l'avversario. In partita quel numero non è conoscibile.

Servono tre grandezze.

| Grandezza | Definizione | Quando si calcola |
|---|---|---|
| **Fabbisogno ottimale** | Quanto sarebbe bastato spendere conoscendo la puntata avversaria | ex post — misura l'efficienza teorica |
| **Puntata prudenziale** | Quanto investire ex ante per una probabilità accettabile di vittoria contro le puntate plausibili | è la vera domanda economica della carta |
| **Inefficienza da incertezza** | tre grandezze distinte, vedi sotto | la distanza fra le due |

L'inefficienza **non è una differenza firmata**. Sovra-puntare e sotto-puntare non sono errori simmetrici: il primo spreca FC, il secondo può perdere il Campo e cambiare la partita. Servono tre risultati separati:

```text
Spreco Focus       = max(0, puntata effettiva − fabbisogno ottimale)     [in FC]
Deficit di puntata = max(0, fabbisogno ottimale − puntata effettiva)     [in FC]
Perdita decisionale = valore linea ottimale − valore linea scelta        [strategico]
```

I primi due si misurano in Focus Coin, il terzo in conseguenza sulla partita. Trattare *«ho speso 2 FC di troppo»* e *«mi mancavano 2 FC e ho perso lo scontro decisivo»* come lo stesso errore renderebbe la metrica inutile.

> Un buon deck non deve soltanto avere abbastanza Focus sulla carta. Deve offrire linee in cui il giocatore possa allocarli **senza dover indovinare perfettamente ogni volta**.

### 7.3 Rapporto col Focus come profilo di rischio

Il sistema Archetipi classifica ogni carta su quattro classi. La v0.1 le trattava come differenze di costo; sono anche differenze di **controllo e varianza**.

| Classe | Rendimento | Costo proprio | Varianza |
|---|---|---|---|
| **Vorace** | controllabile da te | elevato | bassa |
| **Predatore** | controllato dall'avversario | contenuto | **alta** |
| **Indifferente** | stabile | nullo | nulla *sul Potere* |
| **Prodigo** | espande il budget futuro | — | dipende dal trigger |

> «Varianza nulla» per Indifferente significa che il valore del **Potere** non varia con le puntate. Non che l'esito della carta sia privo di varianza: anche un `+8 VA` piatto affronta una puntata nemica nascosta.

Predatore non è semplicemente "economico": è **matchup-dipendente e comportamentale**. Un deck ricco di Predatrici può avere una media eccellente ed essere inconsistente — scambi eccellenti contro un avversario aggressivo, Poteri quasi nulli contro uno conservativo.

Il report deve quindi misurare, per le carte Predatrici:

- valore contro puntata avversaria bassa, media e alta;
- escursione fra minimo e massimo;
- quota di mani troppo dipendente da una risposta aggressiva dell'avversario.

### 7.4 Domanda e offerta

```text
Domanda Focus = puntata prudenziale sommata sulla sequenza prevista
Offerta Focus = 18 + FC realisticamente generabili dai Prodighi
```

L'avviso scatta quando la domanda supera l'offerta in una quota significativa delle mani — **non** quando il deck contiene "troppe Voraci". `+1 POT` e `+4 POT` sono entrambi Voraci e hanno fabbisogni diversi.

> Nota da §6.7: le carte Voraci sono sovra-rappresentate a Lega 2 (43.6% contro ~25% alle altre Leghe). **Una curva bassa non è automaticamente una curva economica.** Le due economie interagiscono in direzione opposta all'intuizione. ⚖️

La prova corrispondente si chiama quindi **Sostenibilità e rischio della puntata**, non semplice sostenibilità.

---

## 8. DIPENDENZE E AUTO-ABILITAZIONE

Il trigger esatto rimane il linguaggio corretto. Ai fini dell'analisi, però, i trigger pongono dipendenze differenti.

| Tipo di dipendenza | Trigger | Controllo principale |
|---|---|---|
| Temporale deterministica | Turbo, Resa dei conti, Ultima Chance | La carta è collocabile nella finestra richiesta? |
| Iniziativa | Imboscata, Intervento | La curva di Lega e il matchup producono abbastanza turni utili? |
| Spesa propria | Overdrive | Il budget può sostenere 5+ FC in quel turno? |
| Spesa avversaria | Opportunista | Il matchup tende a puntare alto? |
| Composizione mano | Alleato, Rinforzi | Concentrazione di Lega nel deck, rispetto alla soglia richiesta dal trigger |
| Esito precedente | Gloria, Vendetta | Il deck sa produrre lo stato richiesto? |
| Stato PV | Rimonta, Magnanimo | Il piano tende naturalmente a stare sotto o sopra? |
| Stato Campi | Invasione, Resistenza | Il deck tende a conquistare o cedere il primo Campo? |
| Confronto carta | Sfida, Sopraffare | La curva di Lega crea matchup favorevoli? |
| Esito corrente | Conquista, Ultimo Desiderio | Il corpo e l'investimento rendono credibile l'esito richiesto? |

### 8.1 Dipendenza sana

Una dipendenza è sana quando:

- il deck può produrla deliberatamente;
- è una conseguenza naturale del piano;
- oppure la carta resta accettabile anche quando il trigger non scatta.

### 8.2 Dipendenza tossica

Una dipendenza diventa un problema quando:

- molte carte richiedono lo stesso stato;
- nessuna carta della mano crea quello stato;
- il deck richiede contemporaneamente stati opposti;
- l'attivazione dipende quasi interamente dall'avversario;
- la carta senza Potere è gravemente sotto curva.

Il controllo non dirà «troppe carte di Slancio» o «poca Riscossa». Dirà, per esempio:

> Il 38% delle mani contiene almeno tre carte che richiedono una vittoria o un Campo già conquistato, ma nessuna apertura autonoma affidabile. ⚖️

---

## 9. INIZIATIVA E CURVA DI LEGA

L'iniziativa del turno 1 dipende dalla somma di Lega delle due mani: la mano con la somma più bassa gioca per prima; poi l'ordine si alterna.

Per una mano `H` contro una mano avversaria `O`:

```text
P(primo) = P(Lega(H) < Lega(O)) + 0.5 × P(Lega(H) = Lega(O))
```

### 9.1 Conseguenza sugli slot

Chi inizia per primo dispone normalmente di:

- 3 finestre Imboscata: turni 1, 3, 5;
- 2 finestre Intervento: turni 2, 4.

Chi inizia per secondo dispone del contrario.

La curva di Lega non garantisce l'iniziativa in assoluto: la pilota **rispetto all'avversario**.

### 9.2 Bias d'iniziativa

Per ogni esercito si dovrà calcolare:

- distribuzione della somma di Lega delle 252 mani;
- probabilità di iniziare contro ogni precostruito;
- probabilità media nell'ambiente di riferimento;
- compatibilità tra bias d'iniziativa e numero di carte Imboscata/Intervento pescate.

Un deck a Lega bassa con molte carte Intervento e poche Imboscata può essere internamente incoerente, anche se ciascuna carta è bilanciata singolarmente.

---

## 10. ALLEATO, RINFORZI E CONCENTRAZIONE DI LEGA

Due trigger dipendono dalla composizione della mano iniziale invece che dallo stato della partita. Sono l'unica coppia del gioco con questa proprietà, e la loro affidabilità è **una funzione della costruzione del deck**, non una costante.

| Trigger | Condizione | Dove vive |
|---|---|---|
| **Alleato** | 1 altra carta della stessa Lega in mano | Poteri di carta, tutte le Armate |
| **Rinforzi** | 2 altre carte della stessa Lega in mano | Poteri di carta + **Bonus del Patto degli Indocili** |

### 10.1 Probabilità esatte

Data una carta con uno dei due trigger già pescata, restano 4 slot da 9 carte:

| k = carte della stessa Lega nel deck | **Alleato** | **Rinforzi** |
|---:|---:|---:|
| 1 | 0.0% | 0.0% |
| 2 | 44.4% | 0.0% |
| 3 | 72.2% | 16.7% |
| 4 | 88.1% | 40.5% |
| 5 | 96.0% | 64.3% |
| 6 | 99.2% | 83.3% |
| 7 | 100.0% | 95.2% |
| 8 | 100.0% | 100.0% |

**Due carte della stessa Lega non bastano mai per Rinforzi** (0%, non "poco"). Per superare l'80% servono 6 carte su 10 sulla stessa Lega — vedi §6.4 per il costo in punti Lega.

### 10.2 Il trigger è bimodale

La condizione è determinata **alla pesca**. Non esiste un turno in cui "quasi" si attiva: o la mano ha la concentrazione, o non ce l'ha per tutta la partita. Il valore medio della carta non si osserva mai.

Conseguenza per l'analizzatore: queste carte non vanno valutate sul valore atteso ma sulla **coppia (rendimento senza Potere, picco con Potere)**.

> **Una carta Alleato o Rinforzi il cui rendimento senza Potere è gravemente sotto la soglia accettabile diventa disfunzionale nella quota di mani in cui il trigger manca** — non ingiocabile: un corpo autonomo eccellente può reggere anche un Potere inaffidabile.

La soglia numerica appartiene al modello di bilanciamento (`PROPOSTA_MODELLO_v3.md`, grandezza *Pavimento*), non a questo documento, e va invocata solo dopo aver definito la grandezza. ⚖️

### 10.3 Due misure differenti

**Affidabilità individuale** — probabilità che una specifica carta sia attiva quando viene pescata. È la tabella §10.1.

**Copertura della mano** — quota delle 5 carte in mano su cui la condizione è soddisfatta. È la misura che conta per il **Bonus del Patto degli Indocili**, che si valuta per singola carta giocata.

| Deck | Copertura Rinforzi |
|---|---:|
| 10×L3 (30 pt) | 100.0% |
| 7L3 + 3L2 (27 pt) | 71.7% |
| 5L2 + 5L4 (30 pt) | 64.3% |
| 3L2 + 4L3 + 3L4 (30 pt) | 26.2% |

Su tutte le 67 configurazioni legali: minimo 21.2%, mediana 55.0%, massimo 100%. **Il Bonus del Patto non ha un valore ma un intervallo**, ed è l'unico Bonus del gioco determinato dalla costruzione anziché dalla struttura della partita. ⚖️

### 10.4 Il Patto e i deck misti

Il Patto sostituisce la condizione standard di attivazione (2+ carte della stessa Armata in mano) con la concentrazione di Lega. Il suo Bonus è quindi **il più splashable del gioco**: una singola carta del Patto lo attiva.

Non è però accesso gratuito. Il confronto va fatto **a denominatore unico** — l'affidabilità della condizione data una carta rilevante già pescata — perché costo in slot, affidabilità condizionata e copertura media sono grandezze diverse.

| Configurazione | Slot richiesti nel deck | Affidabilità quando la carta è pescata |
|---|---|---:|
| Armata standard, 2 carte | 2 slot d'Armata | 44.4% |
| Armata standard, 3 carte | 3 slot d'Armata | 72.2% |
| Armata standard, 4 carte | 4 slot d'Armata | 88.1% |
| Carta del Patto, 4 carte della sua Lega | 1 slot d'Armata + struttura di Lega | 40.5% |
| Carta del Patto, 5 carte della sua Lega | 1 slot d'Armata + struttura di Lega | 64.3% |
| Carta del Patto, 6 carte della sua Lega | 1 slot d'Armata + struttura di Lega | 83.3% |

> **Il Patto richiede un solo slot della propria Armata, ma trasferisce il costo di attivazione sulla curva di Lega dell'intero deck.**

Un'Armata standard paga in *slot dedicati*: due carte vincolate, il resto libero. Il Patto paga in *forma della curva*: una sola carta vincolata, ma sei carte su dieci devono condividere una Lega. A parità di affidabilità (circa 83–88%) il costo è comparabile — solo espresso in una valuta diversa.

Per l'analizzatore la conseguenza è che **un deck "X + Patto" è una configurazione da riconoscere**, non un'anomalia. Le due concentrazioni richieste — carte del Patto e Leghe uguali — si allineano invece di competere, perché il Patto possiede 11 carte L3 e 11 L4.

---

## 11. LE SETTE PROVE DI UN ESERCITO

Ogni esercito verrà valutato attraverso sette prove. Nessuna produce da sola un verdetto.

### Prova 1 — Accesso al piano

> Quante mani contengono gli strumenti minimi per perseguire il piano dichiarato?

Input:

- Archetipi primari e secondari;
- DAN naturale;
- Bonus Armata;
- carte-portanti del piano.

Output:

- percentuale di mani con accesso sufficiente;
- mani prive di qualunque linea coerente.

### Prova 2 — Sequenziabilità

> Le cinque carte possono essere ordinate senza che troppe reclamino la stessa finestra?

Input:

- trigger;
- flag Scalante;
- corpo base;
- finestra efficiente stimata.

Output:

- percentuale di mani con apertura debole;
- percentuale con congestione tardiva;
- numero medio di carte sacrificate fuori finestra.

### Prova 3 — Capacità di contesa

> Il deck possiede abbastanza strumenti per vincere gli scontri necessari al piano?

Input:

- Campioni;
- Soffocatori;
- Colossi;
- POT base;
- effetti sul VA;
- rapporto col Focus.

Output:

- forza di contesa teorica per turno;
- dipendenza da puntate elevate;
- vulnerabilità a blocchi e Immune.

### Prova 4 — Pressione e tenuta PV

> Il deck converte le vittorie in PV e limita le perdite nella misura richiesta dal piano?

Input:

- Assaltatori e secondari Assaltatore;
- Carnefici;
- Guardiani;
- DAN naturale;
- Tossina;
- autolesioni dei Colossi;
- Bonus Armata.

Output:

- contributo attivo potenziale;
- pressione PV credibile;
- tenuta teorica;
- dipendenza da vittorie specifiche.

Lo **scarto PV atteso** non compare qui: per §3 esiste soltanto nell'analisi di matchup.

### Prova 5 — Sostenibilità e rischio della puntata

> Le mani possono finanziare le proprie linee senza esaurire i 18 FC, e senza dover indovinare la puntata avversaria?

Input:

- Voraci, Predatrici, Indifferenti, Prodighi;
- Overdrive;
- valore degli effetti;
- sequenza prevista.

Output:

- fabbisogno ottimale, puntata prudenziale e inefficienza attesa;
- percentuale di mani in deficit;
- dipendenza dall'attivazione dei Prodighi;
- escursione di rendimento delle Predatrici fra puntata avversaria bassa e alta.

### Prova 6 — Auto-abilitazione

> Il deck sa creare gli stati richiesti dai propri trigger?

Input:

- trigger della mano;
- ordine delle carte;
- piano dichiarato;
- curva di Lega;
- matchup.

Output:

- catene abilitatore → payoff;
- condizioni senza abilitatore;
- collisioni tra condizioni opposte;
- percentuale stimata di Poteri spenti.

---

### Prova 7 — Efficienza del budget di Lega

> Le carte giustificano i punti Lega assorbiti, e la curva sostiene il piano del deck?

Input:

- Lega totale e ripartizione L2/L3/L4/L5;
- statistiche e Potere di ogni carta;
- rigidità temporale (flag Scalante, trigger);
- trigger Alleato e Rinforzi;
- carte Imboscata e Intervento;
- Archetipo e Rapporto col Focus.

Output:

- punti Lega non spesi (su 30);
- immobilizzo tardivo assoluto e relativo;
- costo e affidabilità della configurazione Alleato/Rinforzi, se presente;
- distribuzione delle somme di Lega delle 252 mani (media e deviazione standard);
- coerenza fra varianza di curva e carte dipendenti dall'iniziativa;
- interazione fra curva e domanda di Focus.

---

## 12. COMPLESSITÀ ESECUTIVA

### 12.1 Cosa è enumerabile e cosa no

Gli **ordinamenti** delle carte sono un insieme piccolo:

```text
252 mani × 120 ordini = 30.240 ordinamenti per deck
```

Enumerabile in millisecondi. Ma un ordinamento non è una linea di gioco: manca la puntata. Con cinque giocate da almeno 1 FC e un totale non superiore a 18, le allocazioni possibili sono `C(18,5) = 8.568`, da cui:

```text
30.240 × 8.568 = 259.096.320 combinazioni ordine–puntata
```

E questo **prima** di considerare puntate avversarie segrete, trigger avversari, esiti degli scontri, variazione di PV e Campi, generazione di Focus e Campi di battaglia.

> **Gli ordinamenti delle carte sono completamente enumerabili. Le linee strategiche complete richiedono invece una politica di puntata e un modello dell'avversario.**

La v0.2 affermava che «lo spazio delle sequenze è completamente enumerabile»: è vero solo del sequenziamento, non del gioco.

### 12.2 Riduzione per la prima versione

L'analizzatore non deve risolvere il gioco. Riduzione praticabile:

1. enumerare tutti i 120 ordini di ciascuna mano;
2. associare a ogni carta una **puntata prudenziale predefinita** (§7.2);
3. confrontare l'ordine ottimale con l'ordine euristico a puntata fissata;
4. introdurre l'ottimizzazione dei Focus soltanto nella fase matchup.

Così il divario misura la **difficoltà di sequenziamento**, che è un problema reale e risolvibile, senza fingere di aver risolto l'intero gioco.

**Politica ottimizzata** — massimizza la funzione obiettivo del piano dichiarato: probabilità o valore di conquista dei Campi (Conquista), pressione PV (Annientamento), scarto PV atteso (Supremazia).

**Politica euristica** — regole leggibili e realistiche:

- non usare Ultima Chance prima del turno 5;
- conservare una Scalante rigida;
- aprire con una carta autonoma;
- non spendere più Focus di una stima prudenziale plausibile;
- giocare un abilitatore prima del suo payoff;
- non sacrificare il finisher se esiste un'alternativa.

Una politica comprende ordine delle carte, puntate, risposta allo stato ed eventuale conservazione delle risorse. Nella prima versione solo la prima componente varia.

### 12.3 Divario di padronanza

```text
Divario di padronanza =
    risultato della politica ottimizzata − risultato della politica euristica
```

Confronta **politiche decisionali nello stesso scenario**, non due ordini in astratto.

| Divario | Significa | Adatto a |
|---|---|---|
| **basso** | deck leggibile, errori poco punitivi, sequenze intuitive | precostruito iniziale |
| **alto** | ordine delle carte decisivo, gestione Focus delicata, rischio di bruciare payoff | giocatori esperti |

Questo apre un uso nuovo dell'analizzatore: non solo *«il mazzo funziona?»* ma **«quanto è difficile farlo funzionare?»**. È l'informazione che serve per decidere quali mazzi mettere nel gioco base.

Il report riporta: divario medio, divario massimo, percentuale di mani in cui l'euristica sceglie una sequenza significativamente peggiore, e le decisioni responsabili del divario.

---

## 13. AVVISI AUTOMATICI

Gli avvisi non dichiarano che il deck è illegale. Segnalano che una quota significativa delle mani presenta un rischio.

### 13.1 Congestione delle finestre tardive

> Troppe carte della stessa mano richiedono i turni 4–5 e non restano accettabili prima.

### 13.2 Pressione PV insufficiente

> Il piano dichiarato richiede di chiudere sui PV, ma le mani non contengono abbastanza conversione credibile.

### 13.3 Squilibrio funzionale rispetto al piano

> Il deck eccelle in una funzione che non basta a completare il piano.

Esempi:

- Conquista: molti Assaltatori ma pochi strumenti per vincere gli scontri;
- Annientamento: molti Campioni ma DAN e danni alternativi insufficienti;
- Supremazia: pressione offensiva senza protezione o gestione delle autolesioni.

### 13.4 Domanda attesa di Focus superiore alle risorse

> Le linee efficienti di troppe mani richiedono più di 18 FC, oppure dipendono da Prodighi poco affidabili.

### 13.5 Dipendenza da uno stato non prodotto

> Le carte richiedono vittorie, sconfitte, Campi, PV o iniziativa che il deck non tende a generare.

### 13.6 Fragilità della pesca

> Una funzione essenziale è concentrata su troppo poche carte e manca in una quota eccessiva delle mani.

Deriva direttamente dal fatto che una singola carta compare soltanto nel 50% delle partite.

### 13.7 Impiego inefficiente del budget di Lega

> Una quota rilevante del budget è inutilizzata o immobilizzata in carte che difficilmente raggiungono la propria finestra, oppure la curva contraddice l'iniziativa e le concentrazioni richieste dal deck.

Casi rilevati:

- punti Lega non spesi senza un vantaggio d'iniziativa deliberato;
- troppe tardive rigide di Lega 4–5;
- configurazione Alleato o Rinforzi insufficiente rispetto alla soglia del trigger;
- molte carte Imboscata in una curva ad alta Lega;
- molte carte Intervento in una curva intenzionalmente bassa;
- curva bassa a forte componente Vorace senza sostenibilità Focus.

È la ricaduta della Prova 7, che nella v0.2 non aveva alcun avviso corrispondente.

---

## 14. OUTPUT DELL'ANALIZZATORE

Per ogni esercito il report dovrebbe mostrare:

### Sintesi deck

- Armata e Bonus;
- piano primario;
- Lega totale e **punti Lega inutilizzati**;
- **media e deviazione standard della somma di Lega delle 252 mani**;
- distribuzione Archetipi;
- distribuzione Rapporto col Focus;
- carte Scalanti e **immobilizzo tardivo assoluto e relativo**;
- concentrazione per Lega, con **affidabilità Alleato** e **affidabilità e copertura Rinforzi**.

### Affidabilità delle mani

- 252 mani analizzate;
- % con accesso al piano;
- % con apertura autonoma;
- % con congestione tardiva;
- % con deficit Focus;
- % con dipendenze non abilitate;
- % prive di una sequenza completa ragionevole.

### Matchup

- probabilità di iniziare;
- compatibilità Imboscata/Intervento;
- comportamento contro puntata alta e bassa;
- vulnerabilità a Sabotatore, Soffocatore, Immune e Bonus avversario;
- condizione di vittoria favorita nello scontro.

### Avvisi

Ogni avviso deve riportare:

- frequenza del problema;
- mani coinvolte;
- carte responsabili;
- possibile correzione;
- livello di gravità.

---

## 15. CAMPI DI BATTAGLIA: BASELINE E STRESS TEST

I Campi restano fuori dal primo passaggio di analisi, ma **il baseline va definito correttamente**.

L'analisi senza Campi non è un ambiente neutro in senso assoluto. È:

> il regolamento base **senza modificatori ambientali alle condizioni di attivazione**.

In questo stato Vendetta richiede la propria condizione normale, Rimonta richiede lo svantaggio di PV, Overdrive usa la soglia base di 5 FC. Ma `triggerLogic.js` contiene `fieldMods.vendettaAlwaysActive`, `fieldMods.rimontaAlwaysActive` e `fieldMods.overdriveThreshold`: **i Campi modificano le condizioni di attivazione dei trigger**, non soltanto le statistiche.

L'analisi ha quindi tre passaggi.

**Anatomia base.** Nessun modificatore di Campo. Misura la capacità autonoma del deck.

**Stress test ambientale.** Scenari che favoriscono il deck, che lo ostacolano, che alterano i trigger centrali e che modificano il fabbisogno di Focus.

**Robustezza ambientale.** Quanto poco cambiano accesso al piano, sequenziabilità e rendimento al variare dei Campi.

### 15.1 Conseguenza sulla formulazione degli avvisi

Un avviso sulla dipendenza da Vendetta nel baseline **non è un falso positivo**: indica che il deck non la abilita autonomamente. Ma la formulazione deve dirlo con precisione:

> ✔ «Dipendenza non auto-abilitata nel regolamento base; mitigabile da specifici Campi.»
>
> ✘ «La carta non funzionerà.»

---

## 16. METODO DI CALIBRAZIONE

Le soglie non verranno inventate a tavolino.

### Fase 1 — Baseline sui precostruiti

Analizzare i mazzi esistenti e confrontare:

- quelli percepiti come funzionanti;
- quelli percepiti come incoerenti;
- l'Arsenale della Nebula, caso documentato di congestione tardiva.

### Fase 2 — Simulazione delle 252 mani

Per ogni deck:

- enumerare tutte le mani;
- generare gli ordini legalmente rilevanti;
- calcolare finestre, trigger, Focus e funzioni presenti;
- identificare i failure mode ricorrenti.

### Fase 3 — Matchup tra precostruiti

Calcolare almeno:

- bias d'iniziativa;
- affidabilità dei trigger dipendenti dall'avversario;
- pressione relativa;
- piani favoriti.

### Fase 4 — Playtest

Confrontare gli avvisi con le partite reali:

- falsi positivi;
- falsi negativi;
- soglie troppo severe;
- problemi non catturati dal modello.

Solo dopo questa fase le soglie ⚖️ diventano regole dell'analizzatore.

---

## 17. QUESTIONI APERTE

1. 🔶 Il piano secondario deve essere dichiarato o soltanto misurato?
2. ⚖️ Quale deficit di corpo rende una carta Scalante tardiva rigida?
3. ⚖️ Quanta pressione PV è credibile per un deck da Annientamento?
4. ⚖️ Quale percentuale di mani disfunzionali è accettabile per un precostruito?
5. ⚖️ Come stimare la puntata prudenziale di una carta Vorace senza ridurla al solo trigger Overdrive?
6. ⚖️ Prezzo del Bonus del Patto degli Indocili sulla configurazione del precostruito ufficiale.
7. 🔶 Come pesare il divario di padronanza nella selezione dei mazzi base: soglia rigida o criterio di catalogazione?
8. 🔶 `Tossina` e `Imponi POT` non hanno un valore nel modello v3. Bloccano la valutazione di più carte del pool.

---

## 18. DECISIONI GIÀ CHIUSE

- Il deck è analizzato sulle 252 mani, non soltanto sulle 10 carte.
- Non esistono quote universali di Archetipi.
- Gli avvisi dipendono dal piano di vittoria.
- Il trigger resta il linguaggio esatto delle condizioni.
- `Scalante` è un flag analitico, non un nuovo timing.
- Il Rapporto col Focus distingue domanda propria, dipendenza avversaria, stabilità e generazione — ed è anche un profilo di rischio.
- L'iniziativa è una proprietà di matchup, non del deck isolato.
- **La Lega è la seconda economia del gioco**: 30 punti totali, 20 obbligatori, 10 discrezionali.
- **La puntata è segreta**: il fabbisogno ottimale non è la spesa reale.
- **Contributo attivo ai PV e scarto PV effettivo sono grandezze diverse**, su livelli diversi.
- **Gli ordinamenti delle carte sono completamente enumerabili** (30.240 per deck). Le politiche complete richiedono invece una regola di puntata e un modello dell'avversario; nella prima versione il divario di padronanza si calcola a puntata prudenziale fissata.
- **Il baseline senza Campi non è neutro**: è il regolamento base senza modificatori alle condizioni.
- **Alleato e Rinforzi sono due trigger distinti**, con soglie e affidabilità diverse.

---

*Anatomia di un esercito SATZE — Bozza v0.3 — sette prove, sette avvisi, due metriche trasversali*
