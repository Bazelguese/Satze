# Piano di miglioramento dell'IA di SATZE

Stato: Fase 0 completata. Motore a simulazione in gioco (Classico e Mani nude) con politica addestrata per la Difficile e scala dei livelli tarata (vedi "Strada B"). Prossimi passi: rifinitura del gradino Normale–Facile, Campagna e Multiposto.
Ultimo aggiornamento: 2026-11-10.

## Obiettivi

1. **IA divertenti da affrontare.** Non solo più forti: credibili, poco prevedibili, con errori "umani" ai livelli bassi e non assurdi.
2. **Livelli che corrispondono all'etichetta.** Facile, Normale e Difficile devono essere ben distanziati, con distanze misurate e non stimate.
3. **Livelli coerenti tra le modalità.** Un livello deve offrire una sfida comparabile in Classico, Mani nude, Campagna e Multiposto.
4. **Tempo di pensiero.** L'IA può usare fino a circa 15 secondi per decisione, o anche di più. Va però tenuto conto del timer del duello che verrà introdotto: il budget dell'IA dovrà restare sotto quel timer.

## Ambito

- **Incluse:** Classico, Mani nude, Campagna (missioni con profili `assault`/`defense`, Primo Atto, Cael, Concordia) e Multiposto (2v2, Re della Collina).
- **Escluse per ora:** le Eminenze e l'Arena Contesa.
- **Ordine:** prima il Classico, perché il suo motore è condiviso da Mani nude e Campagna. Poi le altre modalità.

## Situazione attuale (analisi verificata nel codice)

Il motore decisionale vive in `src/game/ai/`. Calcola l'esito dei duelli con il risolutore vero del gioco (`computeDuelResolution`), tiene nascosti i Focus del giocatore e fa una ricerca a più turni (beam, cache e scenari dell'avversario).

| # | Problema | Dove |
|---|---|---|
| 1 | **La Difficile non guarda ai turni futuri quando apre.** Con almeno due Campi disponibili, Campo, carta e Focus si scelgono con un profilo ridotto: niente ricerca, 3 scenari, 800 nodi. La scelta dell'Agente riusa poi questa decisione. La ricerca lavora quindi solo quando l'IA risponde, circa metà dei turni. | `src/game/ai/chooseJointAIAction.js:34-47`, `148-157`; `src/hooks/useAI.js:128-138` |
| 2 | **Nessuno misura la forza dell'IA.** `npm run bench:ai` misura tempi e uso dei Focus su contesti sintetici, non le partite vinte. Non esistono partite IA contro IA. I pesi sono fissati a mano e mai calibrati. | `scripts/ai-planner-benchmark.mjs`; `src/game/ai/aiConstants.js`; `src/game/ai/evaluateStrategicState.js` |
| 3 | **Il modello dell'avversario è rozzo.** Ogni carta del giocatore ha la stessa probabilità e i suoi Focus seguono fasce fisse. La Difficile sceglie sempre la mossa migliore (`best`), quindi è prevedibile anche nei Focus, che sono nascosti e scelti in contemporanea. | `src/game/ai/generateOpponentScenarios.js`; `src/game/ai/aiProfiles.js` |
| 4 | **Due punteggi con scale diverse vengono mescolati.** Il punteggio del duello (vittoria 1400, Campo 2400) viene sommato con pesi fissi a quello della ricerca (Campo 900, partita ±1.000.000). | `src/game/ai/chooseAIAction.js:223`; `src/game/ai/strategicScore.js` |
| 5 | **Filtro sulle sconfitte troppo severo.** Un'azione viene scartata se anche un solo scenario, per quanto improbabile, porta a perdere la partita. | `src/game/ai/chooseAIAction.js:248` |
| 6 | **Il calendario dell'iniziativa non viene sfruttato.** L'iniziativa si alterna in modo prevedibile, ma il planner guarda solo al turno successivo. Il commento in `strategyPlanner.js:503-504` descrive ancora la regola sbagliata "chi perde inizia". | `src/game/ai/strategyPlanner.js:490-530`; `src/game/ai/scoreAIAction.js` (`estimateFutureCardValue`) |
| 7 | **Il limite è a nodi, non a tempo.** Non esiste una ricerca interrompibile che restituisca la miglior mossa trovata fin lì. La Difficile ha un p95 di 902 ms, sopra il target di 800 ms dello script. | `src/game/ai/searchGameTree.js`; `Documentazione/AI_BENCHMARK_LATEST.md` |
| 8 | **Le IA del Multiposto sono euristiche separate.** Seguono profili con rumore e non usano il motore principale. I livelli vengono tradotti in profili (`casuale`, `equilibrato`, `calcolatore`) senza alcuna misura di coerenza con il 1v1. | `src/game/multiSeat/seatAI.js`; `src/game/teamDuel/teamDuelAI.js`; `src/game/kingOfHill/kingOfHillAI.js` |
| 9 | **Collegamento con il gioco.** `selectEnemyAgentAndFocusAsync` ignora il secondo argomento `{ revealAt, shouldAbort }` che `satze.jsx` le passa. | `src/hooks/useAI.js:315`; `Codice/satze.jsx:3835`, `4194` |

Fuori ambito per ora, ma da ricordare: le scelte delle Eminenze sono automatiche (prima abilità legale, prima carta Preda, Affari sempre accettati; `src/game/eminence/eminenceDuelGate.js:163-205`, `1285-1391`). Anche la Concordia segue una regola fissa (`src/campaign/logic/concordiaAI.js`).

## Fasi

Ogni fase si chiude con una misura della Fase 0 confrontata con quella precedente. Una modifica che non migliora le misure non entra.

### Fase 0 — Misurare (completata)

Serve un banco di prova che giochi partite intere senza interfaccia.

- **Motore di partita senza React** per Classico e Mani nude. Deve essere fedele al gioco:
  - setup con semi fissi: mani da 5 carte dai mazzi da 10, Campi, 25 PV, 18 FC, apertura alla Lega più bassa;
  - turno: chi ha l'iniziativa sceglie il Campo e schiera per primo, l'altro vede l'Agente e risponde;
  - risoluzione con `computeDuelResolution`;
  - fine turno: Tossina, conquista, rivelazione dei Campi, alternanza dell'iniziativa;
  - condizioni di vittoria come in `satze.jsx`.
- **Giocatori collegabili:** i tre livelli del motore attuale, chiamati come li chiama il gioco, più due avversari di riferimento ("casuale" e "avido").
- **Script `npm run selfplay:ai`:**
  - tornei fra livelli e contro gli avversari di riferimento, su tutti i mazzi precostruiti;
  - lati alternati, semi riproducibili;
  - misura: percentuale di vittorie con intervallo di confidenza, motivo di vittoria, Focus spesi, durata delle partite, tempo per decisione.
- **Report** in `Documentazione/AI_SELFPLAY_LATEST.md`, con la misura di partenza prima di qualsiasi modifica.

#### Risultati della Fase 0

Realizzazione: `src/game/sim/` (motore di partita, agenti, tornei, con test) e `npm run selfplay:ai`.
Misura di partenza: `Documentazione/AI_SELFPLAY_FASE0_BASELINE.md` (e `.json`), commit `1888636`. Sono 100 semi per accoppiamento, cioè 200 partite a lati scambiati, in Classico e Mani nude.

Punteggio del primo agente (tra parentesi l’intervallo di confidenza al 95%):

| Accoppiamento | Classico | Mani nude |
|---|---|---|
| Facile – Normale | 8,5% (5,4–13,2) | 12,0% (8,2–17,2) |
| Normale – Difficile | 50,5% (43,6–57,4) | 55,0% (48,1–61,7) |
| Facile – Avido | 48,0% (41,2–54,9) | 54,5% (47,6–61,3) |
| Facile – Casuale | 62,5% (55,6–68,9) | 65,0% (58,2–71,3) |
| Normale – Avido | 85,5% (80,0–89,7) | 84,5% (78,8–88,9) |
| Difficile – Avido | 87,0% (81,6–91,0) | 83,5% (77,7–88,0) |

Cosa ne segue:

1. **La Difficile non è più forte della Normale.** Le due si equivalgono in entrambe le modalità e contro i riferimenti fanno lo stesso punteggio.
2. **Con l'iniziativa tutti i livelli giocano allo stesso modo.** La decisione congiunta richiede in media 13-17 ms per tutti e tre i livelli: è la versione ridotta, senza ricerca (problema 1). La differenza fra livelli c'è solo in risposta, che richiede in media 0,5-0,7 s e al massimo 3,4 s.
3. **L'IA rende peggio quando apre.** Normale contro Avido fa 73% quando apre la Normale e 98% quando apre l'Avido. In parte dipende dal gioco, perché chi risponde vede l'Agente avversario, ma lo scarto indica una decisione d'apertura debole.
4. **La Facile vale quanto l'Avido** (Agente più forte, quota equa di FC) e batte il Casuale solo nel 62,5% delle partite. Il salto fra Facile e Normale è enorme (8,5%).
5. **C'è molto margine di tempo.** Il p95 in risposta è di circa 2 s, contro i 15 s disponibili.

Limiti della misura: è una partita IA contro IA, non contro persone. I riferimenti sono semplici. La rivendicazione della vittoria ai turni 3-4 viene sempre accettata. I tempi sono stati misurati con 4 processi in parallelo.

### Fase 1 — Correzioni al motore comune

1. **Priorità confermata dalla Fase 0:** la Difficile (e, in misura minore, la Normale) usa la ricerca anche quando apre. Prima la versione ridotta sceglie i Campi migliori, poi carta e Focus vengono decisi con il profilo completo.
2. Pianificazione della mano sul calendario dell'iniziativa: Imboscata quando apre l'IA, Intervento quando risponde, Turbo nei turni 1-2, Ultima Chance dal turno 5, Resa dei conti dal terzo scontro.
3. Una sola scala di valutazione invece della somma di due punteggi diversi.
4. Il filtro sulle sconfitte diventa una soglia di probabilità, solo se la misura conferma che serve.
5. Correzione del commento con la vecchia regola.

Obiettivi di distanza confermati (Classico e Mani nude):

| Accoppiamento | Obiettivo |
|---|---|
| Normale contro Facile | 70-80% |
| Difficile contro Normale | 70-80% |
| Facile contro Casuale | almeno 80% |

#### Risultati della Fase 1 finora (Classico, 100 partite per misura)

Fatto (commit sul ramo `claude/cool-hopper-d5ddlw`):

- **1.1 Ricerca in apertura** (`jointRefineFields`: Facile 0, Normale 1, Difficile 2). Normale contro Avido passa dall'85,5% al 92%. La Difficile non migliora (87% contro Avido) e resta alla pari della Normale (la Normale fa il 55%).
- **1.2 Calendario dell'iniziativa** (`src/game/ai/initiativeCalendar.js`). È corretto ed è testato, ma l'effetto misurato è nullo: Normale contro Avido fa il 93%.
- Il commento con la vecchia regola è corretto.

**Scoperta 1: nessun parametro rende la Difficile più forte della Normale.** Ho fatto varianti della Difficile contro la Normale, misurando il punteggio della Normale:

| Variante | Normale fa |
|---|---|
| profilo attuale | 54% |
| senza scenario a FC massimi | 52% |
| aggregazione carte pesata | 55% |
| rischio 0,2 | 52% |
| profondità 1 | 59% |

Il limite non sta nei parametri, ma nella valutazione: pesi fissati a mano e un modello dell'avversario fisso. Più ricerca con una valutazione imprecisa non dà più forza.

**Scoperta 2: una valutazione per simulazione è molto più forte e cresce con il tempo.** Il prototipo `src/game/sim/mcAgent.js`, solo banco di prova, prova ogni Campo, Agente e FC giocando molte volte il resto della partita con una politica veloce. Nel Classico le mani sono visibili e l'unica incognita sono le scelte dell'avversario.

| Accoppiamento | Punteggio del prototipo |
|---|---|
| Prototipo (40 simulazioni, ~0,5 s) – Normale | 63% (IC 53–72) |
| Prototipo (200 simulazioni) – Normale | 70% (IC 60–78) |
| Prototipo (40 simulazioni) – Avido | 100% |

Il prototipo è ancora grezzo: la politica di simulazione è semplice e non ci sono strategie miste sui FC. Ha però già la distanza voluta tra Difficile e Normale, e la sua forza si regola con un solo parametro, il numero di simulazioni, cioè il tempo. Questo si adatta bene anche alla coerenza fra le modalità: lo stesso metodo funziona in ogni modalità che il motore di partita sa giocare.

**Decisione dell'utente: opzione A.** Tutti i livelli passano a un motore a simulazione. I punti 1.3 e 1.4, che riguardavano il motore precedente, sono abbandonati.

### Motore a simulazione (in corso)

**Codice** (`src/game/ai/mc/`):

- `mcPolicy.js`: politica veloce per le simulazioni. In risposta stima il VA (POT × FC) o calcola il duello vero.
- `mcSearch.js`: candidati Campo × Agente × FC, simulazioni con gli stessi semi per tutti i candidati, eliminazione progressiva, limite di tempo, rumore nella scelta finale. Con l'iniziativa c'è anche un'apertura come gioco simultaneo: tabella FC dell'IA × risposte avversarie, risolta a somma zero, con strategia mista sui FC.
- `mcProfiles.js`: i livelli.
- `mcGameAdapter.js`: lo stato del gioco convertito in vista pubblica, senza i FC del giocatore.

**Nel gioco** (`useAI`): Classico e Mani nude usano il nuovo motore nel Web Worker, anche nel formato Standard, ignorando le Eminenze (decisione dell'utente). Campagna e online restano sul motore precedente, che è anche il ripiego se il worker fallisce. La build e il worker compilato sono stati provati in Chromium: una decisione della Difficile richiede 2,3 s.

**Misure** (Classico, 100 partite ciascuna, punteggio del primo):

| Esperimento | Risultato | Cosa dice |
|---|---|---|
| Nuova Normale (1500 sim.) – Normale precedente | 61% | il motore a simulazione è più forte |
| Nuova Difficile (6000 sim.) – Normale precedente | 64% | |
| Nuova Difficile – nuova Normale | 45% | oltre ~1500 simulazioni la forza **satura** |
| Difficile con risposta calcolata – nuova Normale | 56% | entro il margine di errore |
| Difficile con prima risposta avversaria calcolata | 36% | peggiora |
| Difficile con apertura simultanea (5 Agenti) – nuova Normale | 58% | la migliore variante, e meno prevedibile |
| Difficile B – Casuale | **92%** | ampiezza totale della scala |
| Difficile B – Facile (rumore 0,06) | 67% | |
| Facile (rumore 0,06) – Casuale | 85% | |
| Difficile B – Normale con rumore 0,2 | 71% | il rumore separa bene i livelli |
| Normale con rumore 0,2 – Casuale | 76% | |
| Normale con rumore 0,2 – Facile con rumore 0,06 | 43% | il rumore pesa più del budget |

**Conclusione: gli obiettivi confermati non sono raggiungibili tutti insieme.** In SATZE le mani (5 carte su 10, e apre chi ha la mano più debole) pesano molto, e fra giocatori competenti le differenze si comprimono. Dal Casuale alla Difficile più forte trovata (92%) c'è spazio per circa due gradini da 70-80%, non per tre (Casuale→Facile ≥80%, Facile→Normale 70-80%, Normale→Difficile 70-80%). Va scelto quale obiettivo rilassare.

**Scala provvisoria nel codice:**

| Livello | Simulazioni | Rumore | Note |
|---|---|---|---|
| Facile | 300 | 0,2 | |
| Normale | 1500 | 0,06 | |
| Difficile | 6000 | 0 | apertura simultanea (5 Agenti, 16 simulazioni per casella) |

Verifica della scala provvisoria (100 partite ciascuna):

| Accoppiamento | Classico | Mani nude |
|---|---|---|
| Difficile – Normale | 58% | 58% |
| Normale – Facile | 63% | 61% |
| Facile – Casuale | 77% | 70% |
| Nuova Normale – Normale precedente | 58% | 49% |

La scala è ordinata e coerente fra le due modalità, ma i gradini sono di circa il 60%: l'obiettivo era 70-80%.

### Strada B — politica di simulazione addestrata (completata)

Decisione dell'utente: provare a rafforzare la Difficile prima di fissare la scala. L'IA non deve barare.

**Metodo.**

1. La Difficile gioca contro sé stessa: 400 partite, 300 in Classico e 100 in Mani nude.
2. A ogni decisione si registrano le caratteristiche di ogni mossa (`src/game/ai/mc/mcFeatures.js`) e la stima di vittoria che ne danno le simulazioni.
3. Una politica lineare impara a imitare quelle stime (`scripts/ai-train-policy.mjs`). I pesi sono in `src/game/ai/mc/learnedPolicyWeights.js`.
4. La politica addestrata diventa il modo in cui l'IA gioca le partite "immaginate".

**Misure** (Classico):

| Confronto | Partite | Risultato |
|---|---|---|
| Politica addestrata, senza apertura simultanea – Difficile precedente | 200 | **72,5%** |
| Politica addestrata, con apertura simultanea – Difficile precedente | 200 | 53,5% |
| Secondo giro di addestramento – primo giro | 200 | 49,5% (nessun guadagno) |
| Pesi addestrati su entrambi i giri – primo giro | 200 | 40,5% |

Restano i pesi del primo giro. Con le caratteristiche attuali, altri giri non aggiungono forza.

**Scala installata** (`mcProfiles.js`):

- **Difficile:** politica addestrata, 6000 simulazioni.
- **Normale:** la Difficile precedente (politica scritta a mano, apertura come gioco simultaneo).
- **Facile:** 300 simulazioni, rumore 0,08.

Misure: 100 partite per accoppiamento, semi 6000-6049.

| Accoppiamento | Classico | Mani nude | Obiettivo |
|---|---|---|---|
| Difficile – Normale | 70% | 76% | 70-80% ✔ |
| Normale – Facile | 68% | 62% | 70-80% (poco sotto) |
| Facile – Casuale | 85% | 79% | ≥80% (al limite in Mani nude) |
| Difficile – Casuale | 95% | — | |

Tempi per decisione con 4 processi in parallelo:

- **Difficile:** media 1,2-1,3 s, massimo 3,1 s;
- **Normale:** media 1,5-1,6 s, massimo circa 7 s, che è anche il tetto `maxMs`: oltre, decide con le simulazioni già fatte.

Gli obiettivi originali sono quasi raggiunti. Resta da allargare il gradino Normale–Facile, soprattutto in Mani nude, senza far scendere la Facile sotto l'80% contro il Casuale.

### Personalità dell'IA (in corso)

Richiesta dell'utente: stili di gioco indipendenti dalla difficoltà, scelti nel selettore della partita. La predefinita è Neutrale; c'è anche la voce "Casuale", e il tratto si mostra nella schermata VS. Per ora valgono nel Duello; il 2v2 verrà dopo.

**Codice:**

- `src/game/ai/mc/mcTraits.js`: i tratti, con preferenza sulle mosse, obiettivo a fine partita simulata, rischio e variabilità dei FC.
- Integrazione in `mcSearch.js`.
- Riga PERSONALITÀ nel selettore (`DifficultySelectPopup.jsx`).
- Stato `aiPersonality` e passaggio a `useAI` e al worker.
- Schermata VS: «Difficoltà · Tratto».

**Vincolo concordato:** ogni tratto resta entro circa 5 punti dal Neutrale dello stesso livello.

**Taratura** (Difficile con tratto contro Difficile Neutrale, entrambe a 2000 simulazioni, 100 partite in Classico, semi 7000-7049). I valori di stile sono del tratto, tra parentesi quelli del Neutrale:

| Tratto | Forza | Stile misurato | Stato |
|---|---|---|---|
| Impetuoso | 49% | FC nei primi due turni 5,9 (5,0), dal quarto 1,8 (2,5) | ✔ riconoscibile |
| Paziente | 48% | FC all'inizio 3,6 (4,7), alla fine 4,0 (3,0); vince sui Campi solo nel 33% dei casi | ✔ riconoscibile |
| Avaro | 48% | FC all'inizio 4,1 (4,8) | ✔ riconoscibile |
| Conquistatore | 51% | il 67% delle sue vittorie arriva dai Campi | ✔ riconoscibile |
| Spietato | 49% | danni fatti 8,2 (8,0) | appena percettibile |
| Temerario | 53% | FC all'inizio 5,3 (4,9) | poco riconoscibile |
| Cauto | 50% | nessuna differenza | ✗ da rivedere |
| Imprevedibile | 49% | nessuna differenza | ✗ da rivedere |

**Cosa ho imparato tarando:**

- Il "rischio" (media ± deviazione) indebolisce molto senza dare uno stile visibile: il Temerario estremo scende al 33%, il Cauto estremo al 41%.
- Per una stessa carta le puntate di FC hanno stime molto diverse, quindi rendere i FC imprevedibili costa forza.

### Fase 2 — Avversario e Focus

1. Probabilità delle carte del giocatore pesate su quanto gli convengono, invece che tutte uguali.
2. Focus come gioco simultaneo: per la Difficile, una strategia mista su una piccola tabella "Focus IA × Focus giocatore". Rende l'IA meno prevedibile senza indebolirla.
3. Modello dei Focus del giocatore che dipende dalla situazione (PV, Campi, turno) e non da fasce fisse.

### Fase 3 — Livelli e divertimento

1. Distanze fra i livelli fissate e verificate con il banco di prova. Gli obiettivi numerici si decidono dopo la misura di partenza.
2. La Facile sbaglia in modo credibile: errori di valutazione e di priorità, non mosse assurde. La Normale sbaglia meno spesso. La Difficile non regala nulla, ma resta imprevedibile.
3. Possibili "stili" all'interno di un livello (aggressivo, prudente, economo), purché la forza resti nella fascia del livello.

### Fase 4 — Tempo di pensiero

1. Ricerca interrompibile, con approfondimento progressivo e miglior mossa disponibile in ogni momento. Budget configurabile per livello, fino a circa 15 s, e sempre inferiore al timer del duello.
2. Riuso della cache tra profondità diverse e ordinamento delle mosse.
3. Le decisioni lunghe girano nel Web Worker, comprese quelle congiunte Campo-carta-Focus, e devono resistere al timeout.

### Fase 5 — Estensione alle altre modalità

1. **Campagna:** profili `assault`/`defense`, `alwaysPlayerFirst`, regole speciali di Primo Atto e Cael. La Concordia va verificata separatamente.
2. **Multiposto:** le IA di 2v2 e Re della Collina passano allo stesso motore, o a una sua versione adattata, con livelli tarati sul banco di prova per essere coerenti con il 1v1.
3. Il banco di prova viene esteso a ogni modalità per verificare la coerenza dei livelli.

## Cose da decidere più avanti

- Gli obiettivi numerici delle distanze fra i livelli, dopo la misura di partenza.
- Il budget di tempo esatto per livello, quando ci sarà il timer del duello.
- Se e quando riportare nell'ambito le Eminenze.
