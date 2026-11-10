# Piano di miglioramento dell'IA di SATZE

Stato: approvato. Fase 0 completata; Fase 1 da avviare.
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
