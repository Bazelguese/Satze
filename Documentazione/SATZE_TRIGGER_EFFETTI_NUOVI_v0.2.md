# SATZE — Nuovi Trigger ed Effetti
## Revisione di non-ridondanza — v0.2

**Scopo:** raccogliere nuove componenti modulari per i Poteri degli Agenti, utilizzabili da tutte le Armate.

Questa revisione confronta le proposte con le meccaniche già presenti nel gioco, così da evitare di rinominare o duplicare effetti esistenti.

---

# 1. Correzioni rispetto alla v0.1

## Proposte eliminate

### VA per Campo controllato

**Eliminata perché è già Escalation applicata al VA.**

Il motore supporta già:

- Escalation POT;
- Escalation DAN;
- Escalation POT e DAN;
- Escalation VA.

Esempio esistente: **Obice Campione — Overdrive: Escalation +10 VA**.

Non serve quindi una nuova categoria chiamata “VA per Campo”: eventuali carte di quel tipo devono usare l’effetto `escalation` con statistica `assaultValue`.

### Focus virtuale

**Eliminato completamente.**

La distinzione tra FC reali e FC validi soltanto per il calcolo del VA:

- complica la leggibilità;
- crea eccezioni per Overdrive, Opportunista, Predatore e Campi;
- richiede una rappresentazione UI dedicata;
- non produce un valore di design sufficiente a giustificare tale complessità.

### Immunità ai soli malus del Campo

**Eliminata perché troppo vicina a Immune.**

L’attuale Immunità protegge già da numerose riduzioni di POT, DAN e VA applicate dai Campi. Una seconda etichetta che protegga soltanto dai malus ambientali sarebbe ridondante.

### Baluardo

**Eliminato dalla lista principale.**

“Il nemico controlla esattamente 2 Campi” è una specializzazione molto stretta di Resistenza. Potrà essere rivalutato solo se servirà espressamente una finestra da ultimo Campo, ma non è prioritario come nuovo trigger generale.

### Limite al DAN subito

**Eliminato dalla lista dei nuovi effetti principali.**

Il gioco possiede già:

- riduzioni del DAN;
- minimi al DAN;
- Campi con DAN massimo;
- un’Armata interamente incentrata sulla mitigazione.

Un cap al DAN su un Agente può essere ripreso in futuro, ma per ora espanderebbe soprattutto uno spazio già molto occupato.

---

# 2. Distinzione importante: Inversione e Scambio POT/DAN

## Inversione esistente

**Inversione** trasforma i modificatori esterni ricevuti:

- una riduzione di POT diventa un aumento;
- una riduzione di DAN diventa un aumento;
- una riduzione di VA diventa un aumento;
- alcuni buff positivi dei Campi possono diventare malus.

Non scambia le statistiche stampate dell’Agente.

## Scambio POT/DAN proposto

> **Scambia tra loro la POT e il DAN corrente dell’Agente.**

Esempio:

- prima: 2 POT / 6 DAN;
- dopo: 6 POT / 2 DAN.

La regola esiste già come effetto di un Campo, ma non come effetto modulare dei Poteri. Per questo viene mantenuta come nuova implementazione nel sistema degli Agenti.

---

# 3. Principi di progettazione

## 3.1 Ogni Agente risolve il proprio duello

Sono sconsigliati:

- potenziamenti destinati alla carta successiva;
- statistiche accumulate su Agenti futuri;
- effetti ritardati che dipendono dalla possibilità di giocare un’altra carta;
- catene che costruiscono un corpo fuori curva in un duello successivo.

Sono ammessi effetti sulle risorse persistenti fondamentali, come PV e FC, purché abbiano valori molto controllati.

## 3.2 Economia di riferimento

- Focus Coin iniziali: **18**
- Duelli: **5**
- Investimento minimo: **1 FC**
- Spesa media teorica: **3,6 FC per duello**

Soglie naturali:

- `1–3 FC`: investimento sotto media;
- `4 FC`: investimento centrale;
- `5+ FC`: investimento elevato, Overdrive e Opportunista.

## 3.3 Fasi degli effetti

Le nuove meccaniche devono specificare se si risolvono:

1. prima del calcolo del VA;
2. durante il calcolo del VA;
3. dopo aver determinato il vincitore;
4. dopo l’applicazione del DAN.

---

# 4. Nuovi Trigger consigliati

## 4.1 Predatore

> **Predatore — Il nemico ha investito 3 FC o meno.**

### Identità

Punisce un investimento inferiore alla media.

Insieme a Opportunista crea tre fasce leggibili:

- 1–3 FC: Predatore;
- 4 FC: zona neutra;
- 5+ FC: Opportunista.

### Interesse strategico

All’inizio della partita è una lettura dell’investimento nascosto. Negli ultimi duelli può diventare una deduzione basata sui FC residui.

### Effetti adatti

- +VA;
- +DAN;
- riduzione POT nemica;
- Blocca Bonus;
- Furto di 1 FC;
- Scambio POT/DAN.

### Implementazione

**Bassa complessità.**

---

## 4.2 A Regime

> **A Regime — Hai investito esattamente 4 FC.**

### Identità

Rappresenta un investimento preciso e controllabile, collocato tra il risparmio e Overdrive.

### Interesse strategico

Il giocatore può attivarlo deliberatamente, ma l’avversario conosce l’incentivo a puntare esattamente 4 FC. La prevedibilità parziale costituisce parte del costo.

### Effetti adatti

- +VA;
- +DAN;
- Immunità;
- Scambio POT/DAN;
- Copia POT;
- Protezione Potere;
- Conversione offensiva.

### Implementazione

**Bassa complessità.**

---

## 4.3 Tributo

> **Tributo — Hai investito meno di 3 FC.**

### Identità

Trigger destinato soprattutto a effetti negativi. Permette di progettare Agenti sopra curva che devono ricevere almeno 3 FC per funzionare senza penalità.

### Interesse strategico

Il giocatore può:

- investire almeno 3 FC ed evitare il costo;
- accettare il malus per conservare FC;
- usare la prevedibilità del trigger come contro-bluff.

### Effetti adatti

- Auto-danno;
- riduzione del proprio DAN;
- riduzione del proprio VA;
- perdita di 1 FC;
- recupero di 1 FC da parte del nemico.

### Implementazione

**Bassa complessità.**

---

## 4.4 Parità

> **Parità — La tua Lega è uguale alla Lega nemica.**

### Identità

Premia il confronto tra Agenti dello stesso livello.

### Interesse strategico

È asimmetrico:

- il secondo giocatore può cercare una Lega corrispondente;
- il primo dipende dalla risposta nemica.

### Effetti adatti

- +VA consistente;
- Copia POT;
- Copia DAN;
- Scambio POT/DAN;
- Blocca Potere;
- +DAN.

### Implementazione

**Bassa complessità.**

---

## 4.5 Disperazione

> **Disperazione — Hai 10 PV o meno.**

### Identità

Trigger assoluto da fase finale.

### Differenza da Rimonta

Rimonta confronta i PV dei due giocatori. Disperazione controlla una soglia fissa e può attivarsi anche quando entrambi hanno pochi PV o quando il proprietario è ancora avanti.

### Effetti adatti

- +POT;
- +VA;
- +DAN;
- Immunità;
- Scambio POT/DAN;
- Cura.

### Rischio

Non deve diventare l’identità generalizzata di un’altra Armata da rimonta.

### Implementazione

**Bassa complessità.**

---

## 4.6 Assedio

> **Assedio — Controlli esattamente 2 Campi.**

### Identità

Trigger da chiusura territoriale. Si attiva quando il proprietario è a un Campo dalla vittoria.

### Stati compatibili

- 2–0;
- 2–1;
- 2–2.

### Differenza da Invasione

Invasione richiede almeno un Campo e può accompagnare buona parte della partita. Assedio identifica soltanto la fase in cui il prossimo successo può chiudere la partita.

### Effetti adatti

- +VA;
- +DAN;
- Blocca Bonus;
- Congelamento di Focus;
- DAN inalterabile;
- Tetto VA su una carta sperimentale.

### Implementazione

**Bassa complessità.**

---

## 4.7 Contraccolpo

> **Contraccolpo — Il tuo Potere viene bloccato.**

### Identità

Il Potere originale resta bloccato, ma l’effetto associato a Contraccolpo si attiva.

### Interesse strategico

Introduce una risposta a Blocca Potere senza annullare il valore delle carte di controllo.

### Effetti adatti

- +VA elevato;
- Danni diretti;
- recupero FC;
- Blocca Bonus;
- riduzione DAN nemico;
- Scambio POT/DAN.

### Regola tecnica

Deve essere gestito come reazione al blocco, non come parte del Potere che è stato annullato.

### Implementazione

**Media complessità.**

---

## 4.8 Sfondamento

> **Sfondamento — Vinci il duello con almeno 10 VA di vantaggio.**

### Identità

Premia una vittoria netta senza contribuire alla conquista del Campo corrente.

### Effetti adatti

- +DAN applicato dopo la vittoria;
- Danni diretti;
- recupero di 1 FC;
- Furto di 1 FC su carte rare;
- Cura;
- Tossina.

### Rischio

È un trigger “win more”. Le ricompense non devono rendere inevitabile lo scontro successivo.

### Implementazione

**Media complessità.** Richiede la differenza tra i due VA finali nel contesto post-duello.

---

## 4.9 Caccia Grossa

> **Caccia Grossa — La POT base nemica è superiore alla tua POT base.**

### Identità

Permette a corpi deboli di possedere strumenti specifici contro bersagli naturalmente più potenti.

### Differenza da Sfida

Sfida confronta le Leghe. Caccia Grossa confronta le POT stampate.

### Regola tecnica

Il confronto deve usare le POT base, non quelle già modificate, per evitare circolarità.

### Effetti adatti

- Copia POT;
- +VA;
- +DAN;
- riduzione POT nemica;
- Scambio POT/DAN;
- Blocca Potere.

### Implementazione

**Media complessità.**

---

## 4.10 Sovrainvestimento

> **Sovrainvestimento — Hai investito almeno 2 FC più del nemico.**

### Identità

Premia una puntata aggressiva relativa, non una soglia assoluta.

### Differenza da Overdrive

Overdrive richiede 5 o più FC. Sovrainvestimento può attivarsi anche con 3 contro 1 o 4 contro 2.

### Effetti adatti

- +DAN;
- Danni diretti;
- Scambio POT/DAN;
- Immunità;
- Conversione offensiva.

### Rischio

Il giocatore sta già ottenendo VA naturale grazie all’investimento superiore. Il payoff deve essere inferiore a quello di un trigger raro.

### Implementazione

**Bassa complessità.**

---

# 5. Nuovi Effetti consigliati

## 5.1 Scambio POT/DAN

> **Scambia tra loro la POT e il DAN corrente dell’Agente.**

### Funzione

Trasforma il ruolo della carta senza generare statistiche dal nulla.

### Esempio

Un Agente 2/6 diventa 6/2.

### Nota

Il comportamento esiste già su un Campo, ma richiede una nuova chiave effetto per poter essere utilizzato dai Poteri.

### Implementazione

**Bassa-media complessità.**

---

## 5.2 Furto di Focus

> **Ruba 1 FC.**

### Funzione

Il proprietario guadagna 1 FC e il nemico perde 1 FC.

### Bilanciamento

Produce uno swing complessivo di 2 FC:

- +1 al proprietario;
- −1 al nemico.

Il valore deve restare tassativamente **1 FC per attivazione**.

### Utilizzo consigliato

- trigger post-duello;
- condizioni difficili;
- poche carte nel pool;
- preferibilmente carte rare o corpi sotto curva.

### Implementazione

**Media complessità.**

---

## 5.3 Congelamento di Focus

> **1 FC investito dal nemico viene speso normalmente ma non contribuisce al suo VA.**

### Funzione

Il nemico:

- paga normalmente il FC;
- mantiene attivi i trigger basati sui FC realmente investiti;
- calcola il VA con un FC efficace in meno.

### Valore

La riduzione equivale alla POT finale nemica.

### Vantaggio sul Tetto VA

Punisce gli investimenti elevati senza creare un limite assoluto.

### Implementazione

**Media complessità.** Richiede una distinzione tra FC investiti e FC efficaci nel calcolo del VA.

---

## 5.4 Armamento

> **Aggiungi al VA un valore basato sul DAN base dell’Agente.**

### Versione iniziale

`+1 VA per ogni punto di DAN base.`

### Funzione

Permette a una carta con POT bassa e DAN alto di convertire una parte della propria pericolosità in capacità di conquista.

### Regola tecnica

Deve usare il DAN stampato, non il DAN modificato, per evitare concatenazioni con buff e Scambio POT/DAN.

### Differenza da Escalation

Armamento dipende dalla statline stampata della carta. Escalation dipende dal numero di Campi conquistati.

### Implementazione

**Media complessità.**

---

## 5.5 Conversione offensiva

> **Riduci il tuo DAN di X e ottieni +Y VA durante questo duello.**

### Esempio preliminare

`−2 DAN, +8 VA.`

### Funzione

Permette di sacrificare la capacità di chiudere la partita tramite PV per aumentare le probabilità di conquistare il Campo.

### Interesse strategico

La carta diventa più affidabile territorialmente ma meno letale. Il costo viene pagato nello stesso duello, senza effetti ritardati.

### Regola tecnica

La riduzione del DAN deve avere un minimo esplicito, normalmente 1.

### Implementazione

**Bassa-media complessità.**

---

## 5.6 Protezione Potere

> **Il Potere di questo Agente non può essere bloccato durante il duello.**

### Funzione

Protegge esclusivamente il Potere, non la carta da riduzioni di statistiche o VA.

### Differenza da Immune

Immune protegge dagli effetti negativi, ma non impedisce necessariamente Blocca Potere.

### Utilizzo consigliato

- trigger condizionati;
- Agenti il cui corpo dipende fortemente dal Potere;
- poche carte per evitare di svalutare il controllo.

### Implementazione

**Media complessità.** Deve essere risolta prima della scansione dei Blocca Potere.

---

## 5.7 Protezione Bonus

> **Il Bonus Armata di questo Agente non può essere bloccato durante il duello.**

### Funzione

Protegge soltanto il Bonus associato all’Agente.

### Differenza da Protezione Potere

Le due protezioni devono restare separate, così è possibile contrastare una componente senza neutralizzare l’intera carta.

### Implementazione

**Media complessità.**

---

## 5.8 Dissipazione

> **Rimuovi i modificatori positivi ottenuti dall’Agente nemico durante questo duello.**

### Funzione

Riporta al valore precedente i soli aumenti positivi ricevuti a POT, DAN o VA, senza copiare le statistiche e senza applicare una riduzione ulteriore.

### Regole necessarie

Deve essere deciso quali fonti dissipa:

- Potere nemico;
- Bonus Armata;
- Campo;
- oppure tutte le fonti.

La versione iniziale più sana è:

> **Rimuovi i bonus positivi ottenuti dal Potere nemico.**

### Differenza da Blocca Potere

Blocca impedisce l’attivazione. Dissipazione permette al Potere di attivarsi e poi ne rimuove i soli potenziamenti, senza fermare cure, danni diretti o effetti non statistici.

### Implementazione

**Alta complessità.** Richiede il tracciamento della provenienza dei modificatori.

---

## 5.9 DAN inalterabile

> **Il DAN di questo Agente non può essere ridotto dal Potere o dal Bonus nemico.**

### Funzione

Protegge una sola statistica.

### Differenza da Immune

Immune protegge da più categorie di effetti. DAN inalterabile lascia vulnerabili POT, VA, Potere e Bonus.

### Regola consigliata

Non protegge dai limiti globali imposti dai Campi, salvo diversa decisione esplicita.

### Implementazione

**Media complessità.**

---

## 5.10 Neutralizza Campo

> **L’effetto del Campo è disattivato per entrambi i giocatori durante questo duello.**

### Funzione

Effetto simmetrico: rimuove un Campo sfavorevole, ma impedisce anche di sfruttarne i vantaggi.

### Differenza da Immune

Immune protegge il singolo Agente da vari effetti negativi. Neutralizza Campo spegne l’intera regola ambientale per entrambi.

### Rischio

Deve essere raro per non ridurre eccessivamente l’importanza dei Campi.

### Implementazione

**Alta complessità.** Deve risolversi prima del setup del Campo.

---

## 5.11 Protezione Focus

> **I tuoi FC non possono essere rubati o congelati durante questo duello.**

### Funzione

Contromisura dedicata alle nuove interazioni sui Focus Coin.

### Limite

Non impedisce:

- la normale spesa dei FC;
- i limiti globali imposti dai Campi;
- eventuali costi volontari del proprietario.

### Implementazione

**Media complessità.**

---

## 5.12 Tetto VA nemico

> **Il VA nemico non può superare X.**

### Stato

**Sperimentale.**

### Problema di bilanciamento

Il valore reale è:

`max(0, VA nemico − X)`

Può quindi valere zero contro investimenti bassi e moltissimo contro investimenti elevati.

### Utilizzo consigliato

- una carta asso;
- corpo fortemente sotto curva;
- nessuna diffusione come categoria comune;
- playtest dedicato.

### Implementazione

**Media complessità tecnica, alta complessità di bilanciamento.**

---

# 6. Combinazioni di Potere consigliate

## Primo ciclo — semplici e leggibili

- Predatore: +VA
- A Regime: Scambio POT/DAN
- Tributo: Auto-danno
- Parità: Copia POT
- Disperazione: +POT
- Assedio: +DAN
- Caccia Grossa: Copia POT
- Sovrainvestimento: +DAN

## Secondo ciclo — nuove interazioni

- Predatore: Furto di 1 FC
- Contraccolpo: +VA elevato
- Sfondamento: recupera 1 FC
- Assedio: Congelamento di 1 FC
- A Regime: Conversione offensiva
- Parità: Protezione Potere
- Caccia Grossa: DAN inalterabile

## Sperimentali

- Assedio: Tetto VA nemico
- Neutralizza Campo
- Dissipazione
- Sfondamento: Furto di 1 FC

---

# 7. Priorità di implementazione

## Priorità 1 — Alto valore, bassa complessità

1. Predatore
2. A Regime
3. Tributo
4. Parità
5. Disperazione
6. Assedio
7. Sovrainvestimento
8. Scambio POT/DAN
9. Conversione offensiva

## Priorità 2 — Richiede nuovi dati o nuove fasi

10. Contraccolpo
11. Sfondamento
12. Caccia Grossa
13. Furto di 1 FC
14. Congelamento di Focus
15. Protezione Potere
16. Protezione Bonus
17. DAN inalterabile
18. Protezione Focus

## Priorità 3 — Richiede architettura o playtest specifici

19. Armamento
20. Dissipazione
21. Neutralizza Campo
22. Tetto VA nemico

---

# 8. Registro di non-ridondanza

| Proposta | Stato | Motivo |
|---|---|---|
| Predatore | Nuova | Nessun trigger attuale controlla 3 FC nemici o meno |
| A Regime | Nuova | Nessun trigger attuale controlla esattamente 4 FC propri |
| Tributo | Nuova | Nessun trigger attuale punisce meno di 3 FC propri |
| Parità | Nuova | Sfida e Sopraffare coprono solo Lega inferiore/superiore |
| Disperazione | Nuova | Rimonta confronta i PV; questa usa una soglia assoluta |
| Assedio | Nuova specializzazione | Invasione richiede 1+ Campi; questa richiede esattamente 2 |
| Contraccolpo | Nuova | Nessun trigger reagisce al Potere bloccato |
| Sfondamento | Nuova | Conquista non considera il margine di VA |
| Caccia Grossa | Nuova | Sfida confronta Leghe, non POT base |
| Sovrainvestimento | Nuova | Overdrive usa una soglia assoluta, non il confronto tra investimenti |
| Scambio POT/DAN | Nuovo per i Poteri | Esiste soltanto come regola di un Campo |
| Furto FC | Nuova | Recupero FC esiste, trasferimento no |
| Congelamento FC | Nuova | Nessun Potere separa FC investiti e FC efficaci |
| Armamento | Nuova | Dipende dal DAN base, non dai Campi |
| Conversione offensiva | Nuova | Nessun effetto scambia DAN proprio con VA |
| Protezione Potere | Nuova | Immune non equivale a Potere non bloccabile |
| Protezione Bonus | Nuova | Nessuna protezione dedicata al Bonus |
| Dissipazione | Nuova | Blocca impedisce; Dissipazione rimuove solo buff già applicati |
| DAN inalterabile | Nuova specializzazione | Immune è generale; questa protegge soltanto il DAN |
| Neutralizza Campo | Nuova per i Poteri | Esistono Campi che modificano regole, non Agenti che spengono il Campo |
| Protezione Focus | Nuova | Necessaria solo con Furto/Congelamento |
| Tetto VA | Nuova sperimentale | Riduzione VA esiste, cap rigido no |
| VA per Campo | Rimossa | È Escalation VA |
| Focus virtuale | Rimossa | Complessità non desiderata |
| Immunità ai malus del Campo | Rimossa | Sovrapposta a Immune |
| Baluardo | Rimossa | Troppo derivativa da Resistenza |
| Limite DAN subito | Rimossa | Spazio già coperto da riduzioni, cap dei Campi e Calibri |
