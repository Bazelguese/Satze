# Satze — Tutti contro tutti: Re della collina

Regolamento e specifica funzionale per Cursor · v0.2 · 3 novembre 2026

## 0. Novità rispetto alla v0.1

La v0.1 era stata redatta senza ispezionare il codice. La v0.2 è allineata al repository e alle decisioni dell'utente.

| Punto | v0.1 | v0.2 | Fonte |
| --- | --- | --- | --- |
| Formula VA | `POT + FC` | `POT × FC` + modificatori, minimo POT | `src/game/duel/duelAssaultPhase.js` |
| Lega massima mazzo | 28 | 30 | Validatori esistenti; decisione utente (2v2) |
| Spareggio | VA → Lega → sfidante | VA → Lega minore → POT minore → chi ha giocato per secondo (lo sfidante) | `src/game/duel/duelWinnerResolve.js` |
| Trigger | Nomi pre-rinomina | Significato del codice attuale | `src/data/triggers.js`, `src/game/triggerLogic.js` |
| Gloria / Vendetta | Esito della contesa precedente | Esito del **proprio scontro precedente** del giocatore | Decisione utente |
| Effetti di Campo legati all'esito | Solo alla conquista | Valgono **in ogni scontro** | Decisione utente |
| Vittoria | Più conquiste dopo 5 Campi | **Come 1v1**: maggioranza dei Campi nei turni 1–4, Supremazia dal 5, Annientamento sempre | Decisione utente |
| Campi visibili | Tutti e 5 dall'inizio | **3 visibili, poi 1 per contesa**, come 1v1 | Decisione utente; `Codice/satze.jsx` |
| Cura massima | Da verificare | 25 PV: regola base verificata | `src/game/duel/duelApplyEffect.js` |
| Riserva minima FC | Da verificare | Esiste già | `src/game/legalFocusSpend.js` |
| Arena Contesa | — | Esperimento accantonato: non usarlo come base | Decisione utente |

## 1. Obiettivo e stato delle decisioni

Implementare una modalità separata dal duello classico e dal 2v2. Una contesa per Campo: chi apre sceglie il Campo e schiera; gli altri rispondono in ordine; il vincitore di ogni scontro resta sulla collina e affronta il successivo con lo stesso Agente e lo stesso investimento. L'ultimo Agente rimasto conquista il Campo.

La modalità è pensata per tre giocatori; l'estensione a quattro resta una **proposta di prototipo [P]**: il quarto si aggiunge alla stessa catena, senza semifinali simultanee.

### Regole confermate dall'utente

- Le scelte avvengono in sequenza, vedendo le carte già schierate.
- Chi apre sceglie Campo, Agente e FC; ogni altro giocatore schiera un Agente e assegna FC.
- Il vincitore di uno scontro resta e affronta il giocatore successivo.
- L'investimento si paga una sola volta e vale per ogni scontro dello stesso Agente sul Campo.
- Ogni scontro infligge DAN al giocatore sconfitto.
- Il Trigger **Conquista** delle carte si attiva solo quando il Campo viene assegnato alla fine della contesa, mai dopo una vittoria intermedia.
- Gli **effetti di Campo legati all'esito** («al vincitore», «al perdente») valgono in ogni scontro.
- Ogni scontro ricalcola statistiche, Poteri, Bonus ed effetti del Campo contro l'avversario corrente.
- Una Cura 2 attiva in due scontri cura 2 PV in ciascuno. Nessun limite di una attivazione per Campo.
- I modificatori temporanei si azzerano fra scontri; PV e riserve FC conservano le variazioni.
- Recuperare FC non aumenta l'investimento già assegnato.
- Gloria e Vendetta leggono l'esito del proprio scontro precedente del giocatore.
- Vittoria per maggioranza dei Campi come nell'1v1.
- Rivelazione dei Campi come nell'1v1.

### Convenzioni [P]

Le sezioni marcate [P] fissano valori necessari al prototipo, non ancora approvati. Cursor le mantiene configurabili e le riporta nella consegna. Non importare dal 2v2 PV condivisi, abbinamenti segreti o applicazione simultanea della Vita: qui ogni scontro modifica lo stato prima del successivo.

### Contesto tecnico verificato

| Elemento | Dove | Uso |
| --- | --- | --- |
| Risoluzione di uno scontro | `computeDuelResolution` in `src/game/duelResolve.js` | Una chiamata per scontro, con contesto nuovo |
| Trigger | `src/game/triggerLogic.js` | Riutilizzo integrale, cambia solo il contesto (§7) |
| Riserva minima FC | `src/game/legalFocusSpend.js` | Riutilizzo integrale |
| Selezione e rivelazione Campi | `src/game/fieldLogic.js`, `revealedFields` in `Codice/satze.jsx` | Come 1v1 (§3.2) |
| Campi legali | `getLegalFieldIndexes` in `src/game/ai/legalFields.js` | Rivelati e non consumati |
| Vittoria, soglia, reclamo | Fine turno in `Codice/satze.jsx` (`fieldsMajority`, `canReclaim`) | Logica da replicare nell'orchestratore (§9) |
| Effetti di Campo dopo lo scontro | `src/game/fieldBattleAftermath.js` | Applicati a ogni scontro |
| Server | `server/index.mjs` | Oggi solo relay, stanze da 2. Va esteso (§12) |

`src/game/arenaContesa/` è un esperimento accantonato: non usarlo come base, non estenderlo e non eliminarlo.

## 2. Terminologia

- **Partita:** insieme delle contese sui Campi.
- **Contesa:** tutte le pose e tutti gli scontri necessari ad assegnare un Campo.
- **Scontro:** un duello completo fra due Agenti.
- **Occupante:** Agente attualmente sulla collina.
- **Sfidante:** prossimo Agente in coda, che affronta l'occupante.
- **Eliminato dalla contesa:** Agente sconfitto; il proprietario può essere ancora vivo.
- **Eliminato dalla partita:** giocatore a 0 PV (§9).

Il nome «Re della collina» è di lavoro.

## 3. Configurazione

| Elemento | Regola | Stato |
| --- | --- | --- |
| Giocatori | Tre; quattro come estensione del §5 | 3: direzione scelta · 4: [P] |
| Squadre | Nessuna: PV, mano, mazzo e FC personali | Direzione scelta |
| Mazzo | 10 Agenti, nessuna copia, somma Lega massima 30 | Base verificata |
| Mano | Cinque Agenti, procedura base | Base verificata |
| FC | 18 personali | Base verificata |
| Investimento minimo | 1 FC per Agente | Base verificata |
| PV | 25 personali | Base verificata |
| Cura massima | 25 PV | Base verificata |
| Contese | Cinque, una per Campo | Base verificata |
| Pescata | Nessuna | Base verificata |
| Carte consumate | Una per giocatore vivo a ogni contesa, anche se combatte più volte | Direzione scelta |
| Campi | Cinque slot, come 1v1 | Base verificata |

### 3.1 FC per le contese future

Riutilizzare `legalFocusSpend.js`: la spesa massima è `FC_disponibili − (Agenti_da_giocare − 1)`. Anche le sottrazioni di riserva rispettano il minimo [P]. Non concedere FC gratuiti per riparare uno stato invalido.

### 3.2 Campi

Come nell'1v1:
- 5 Campi selezionati con `selectBattlefields`; i primi 3 slot solo con `minTurn: 1`.
- **3 Campi visibili** all'inizio; **1 nuovo Campo rivelato** alla fine di ogni contesa, finché non sono tutti visibili.
- Chi apre sceglie un Campo **rivelato e non ancora consumato**.
- Un Campo assegnato, o rimasto senza proprietario (§9.2), è consumato e non si rigioca.

## 4. Ordine e sequenza delle decisioni

### 4.1 Ordine iniziale e rotazione [P]

Il server sorteggia una sequenza iniziale e la conserva per il replay. A ogni contesa l'apertura avanza di una posizione, saltando gli eliminati; la coda degli sfidanti segue lo stesso ordine circolare fra i vivi.

Esempio a tre: `A-B-C`, poi `B-C-A`, poi `C-A-B`, poi `A-B-C`, poi `B-C-A`. Con cinque contese i ruoli non si distribuiscono in modo uniforme né a tre né a quattro: limite noto, da misurare. Non cambiare la durata senza riprogettare mano e FC.

### 4.2 Posa e impegno dei FC

1. L'apertura sceglie Campo, Agente e investimento. Alla conferma la carta e il Campo diventano pubblici e irrevocabili; l'investimento resta nascosto.
2. Il secondo vede Campo e prima carta, poi conferma Agente e FC.
3. Il terzo vede le due carte e conferma.
4. A quattro, il quarto vede le tre carte e conferma [P].

Tutti confermano **prima del primo scontro**. Nessuno può attendere l'esito di uno scontro per scegliere.

Gli investimenti restano nascosti agli avversari fino alla rivelazione, anche a livello tecnico (§12). Il saldo FC pubblico resta quello precedente all'impegno.

### 4.3 Rivelazione

Quando tutti hanno confermato, il server pubblica insieme tutti gli investimenti e i saldi aggiornati. Da quel momento non ci sono più scelte fino alla fine della contesa. Il costo è addebitato una sola volta per carta.

## 5. Catena degli scontri

### Tre giocatori

1. P1 è l'occupante; P2 lo sfida.
2. Si risolve lo scontro completo, con danni, effetti di fine scontro ed effetti di Campo legati all'esito.
3. Il vincitore, se vivo, resta occupante; P3 lo sfida.
4. Dopo l'ultimo scontro il vincitore vivo conquista il Campo e si risolvono i Trigger Conquista.

Esempi:
- P1 batte P2 e poi P3: P1 infligge DAN a entrambi e conquista.
- P2 batte P1, poi P3 batte P2: P2 danneggia P1, P3 danneggia P2 e conquista.
- P2 batte P1 e poi P3: P2 danneggia entrambi e conquista.

L'Agente sconfitto esce e non torna in coda. Il vincitore non sceglie una nuova carta.

### Quattro giocatori [P]

`P1 contro P2 → vincitore contro P3 → vincitore contro P4 → Conquista`

Al massimo tre scontri, una carta per persona. Non aggiungere semifinali, scontri simultanei o un'altra mano al quarto.

## 6. Calcolo di ogni scontro

### 6.1 Cosa riparte e cosa rimane

| Dato | Fra due scontri dello stesso Agente |
| --- | --- |
| Identità, Lega, POT e DAN base, Potere, Bonus, Armata | Restano quelli della carta e delle modifiche realmente persistenti |
| Investimento | Resta quello dichiarato alla posa |
| Modificatori temporanei di POT, DAN, VA | Rimossi e ricalcolati contro il nuovo avversario |
| Copie, blocchi, immunità temporanee | Rivalutati |
| PV personali | Conservano danni, cure e costi già risolti |
| Riserve FC | Conservano spese, recuperi e sottrazioni già risolti |
| Effetti esplicitamente persistenti (es. Tossina) | Seguono la durata prevista dal motore |
| Storia dei risultati | Aggiornata dopo ogni scontro (Gloria e Vendetta, §7) |

Il VA dello scontro precedente non è la base del successivo. Un +2 POT che si riattiva dà di nuovo +2, mai +4. Se il Bonus viene bloccato nel nuovo scontro, il beneficio precedente non resta.

### 6.2 Riattivazioni

Per ogni scontro si costruisce un contesto di risoluzione nuovo e si rivalutano le condizioni. Nessuna flag globale «già attivato su questo Campo». Le attivazioni si identificano con `fightId + fonte + trigger`.

- Cura 2 sempre attiva, proprietario a 17 PV, nessun danno subito: 19 dopo il primo scontro, 21 dopo il secondo, con due eventi nel log.
- Investimento 5 e recupero di 2 FC nel primo scontro: nel secondo l'investimento resta 5, i 2 FC sono nella riserva. Se il recupero si riattiva, aggiunge altri 2 alla riserva, non al VA.
- Un effetto che modifica i FC impegnati vale solo nel contesto locale; nello scontro successivo si riparte dall'investimento originario.

### 6.3 Avversario, VA, spareggio e danno

- «Avversario» o «nemico» significa solo l'Agente e il giocatore affrontati in quello scontro. Blocchi, copie e riduzioni non colpiscono chi aspetta o è già uscito.
- **VA:** `(POT + modificatori POT) × FC investiti + modificatori VA`, mai sotto il minimo del motore.
- **Spareggio:** VA più alto; Lega più bassa; POT più bassa; poi vince chi ha giocato per secondo, cioè lo sfidante. Restano validi gli spareggi forzati del motore.
- Il vincitore infligge il proprio DAN effettivo al perdente in ogni scontro, anche intermedio. Nessun danno a chi non è stato affrontato, nessun danno supplementare alla conquista.
- Danni diretti, cure, variazioni di FC ed effetti di fine scontro seguono l'ordine base. Lo stato risultante è l'ingresso dello scontro successivo.

## 7. Trigger

Si usa il significato del codice. Cambia solo il contesto passato a `checkTrigger`:

| Trigger | Condizione in questa modalità |
| --- | --- |
| Imboscata | L'Agente è l'occupante (ha schierato prima dello sfidante) |
| Intervento | L'Agente è lo sfidante |
| Turbo | Contesa 1 o 2 |
| Ultima Chance | Contesa 5 |
| Gloria | Il proprietario ha **vinto il proprio scontro precedente**, anche nella stessa contesa |
| Vendetta | Il proprietario ha **perso il proprio scontro precedente** |
| Rimonta | PV del proprietario < PV dell'avversario corrente, letti all'inizio dello scontro |
| Magnanimo | PV del proprietario > PV dell'avversario corrente, letti all'inizio dello scontro |
| Overdrive | Investimento del proprietario ≥ soglia del Campo, default 5 |
| Opportunista | L'avversario corrente ha investito 5+ FC |
| Sfida / Sopraffare | Lega dell'Agente minore / maggiore di quella dell'avversario corrente |
| Resa dei conti | Il proprietario e l'avversario corrente hanno giocato almeno 3 Agenti, compreso quello corrente. Rigiocare lo stesso Agente in più scontri non conta |
| Invasione | Il proprietario ha conquistato almeno 1 Campo |
| Resistenza | L'avversario corrente ha conquistato almeno 1 Campo [P] |
| Alleato / Rinforzi / Staffetta / Debito | Come da base, sul proprietario |
| Ultimo Desiderio | L'Agente perde il proprio scontro ed esce; una sola volta |
| Conquista | Solo per l'Agente che conquista il Campo, dopo l'ultimo scontro; una volta per fonte |

Conseguenze da evidenziare:
- **Imboscata e Intervento seguono il ruolo nello scontro.** Se P2 batte P1, contro P3 è occupante e ha Imboscata. Discende da `isFirst`: l'occupante ha sempre schierato prima dello sfidante.
- **Gloria nella catena.** Lo «scontro precedente» è l'ultimo combattuto dal giocatore, ovunque sia avvenuto. Chi batte P1 ha Gloria contro P3. Chi entra nella contesa usa l'esito del proprio ultimo scontro nelle contese precedenti.
- Al primo scontro della partita di ciascun giocatore, Gloria e Vendetta sono false. Un giocatore che subentra senza combattere (§9.2) non modifica la propria storia.
- Con PV pari, Rimonta e Magnanimo sono false.

### 7.1 Conquista ed effetti di Campo

- Il Trigger Conquista delle carte si attiva solo nella risoluzione finale della contesa: nel motore attuale significa «vinci questo scontro», quindi negli scontri intermedi va disattivato e nell'ultimo resta attivo per il vincitore. Non ricalcolare retroattivamente VA o DAN già risolti.
- Gli **effetti di Campo legati all'esito** («+2 DAN al vincitore», «danni al perdente», PV o FC dopo lo scontro in `fieldBattleAftermath.js`) si applicano in **ogni** scontro.
- Gli effetti di Campo che riguardano esplicitamente l'assegnazione del Campo (impedire la conquista, effetti di campagna alla conquista) agiscono solo sull'assegnazione finale. Verificarli uno per uno e segnalare i casi dubbi.
- Una carta che usa Conquista in modo incompatibile con questo momento va segnalata nella verifica del catalogo, non trasformata in silenzio.

## 8. Campo scelto e trasformazioni [P]

Il Campo scelto vale per l'intera contesa e i suoi effetti si rivalutano in ogni scontro. Una terraformazione o sostituzione temporanea vale solo nello scontro in cui avviene; nel successivo si riparte dal Campo scelto e la carta può riapplicarla se le condizioni ricorrono.

Una modifica esplicitamente permanente del Campo o di altri slot segue la regola base. I casi con significato non definito vanno indicati come non supportati, con motivo, e non ignorati in partita. I Campi della campagna con effetti come «vinci la partita» o prigionieri non entrano nel pool.

## 9. Eliminazioni, posto vuoto e fine partita

### 9.1 Controllo dopo ogni scontro [P]

Completata la sequenza degli effetti dello scontro, si controllano i PV. Un giocatore a 0 PV è eliminato dalla partita. Un Agente sconfitto esce dalla contesa comunque.

Un vincitore portato a 0 da un effetto di fine scontro non resta occupante, e il perdente non viene promosso: entrambi lasciano lo scontro e si crea un posto vuoto.

### 9.2 Posto vuoto [P]

Se manca l'occupante, il prossimo Agente in coda di un giocatore vivo diventa occupante senza scontro: non infligge danno e non attiva effetti di scontro. Affronta il successivo, se c'è.

Esaurita la coda, l'occupante vivo conquista il Campo. Senza occupante il Campo resta senza proprietario ed è comunque consumato. Se l'ultimo occupante è subentrato senza combattere, i suoi effetti Conquista personali si attivano; quelli che richiedono un avversario non hanno bersaglio.

Carte e FC già impegnati non si rimborsano, anche se il proprietario viene eliminato prima del proprio scontro.

### 9.3 Vittoria di partita

Controllare dopo aver completato la contesa e gli effetti Conquista. Regole dell'1v1, estese a più giocatori:

1. **Annientamento** (sempre): se resta un solo giocatore vivo, vince. Se nessuno è vivo, pareggio.
2. **Conquista** (contese 1–4): un giocatore vivo con **3 Campi** conquistati vince (maggioranza di 5, `floor(5/2)+1`, come nell'1v1).
   - **Reclamo:** come nell'1v1, se la soglia è raggiunta alla contesa 3 o 4, il giocatore può reclamare la vittoria o continuare.
   - Due giocatori non possono raggiungere 3 Campi insieme: nelle contese 1–4 si assegnano al massimo 4 Campi.
3. **Supremazia** (dalla contesa 5): alla fine della contesa 5 vince il giocatore vivo con più PV. A parità fra i primi, vittoria condivisa fra loro [P].

Gli eliminati non possono vincere. Con due giocatori vivi la contesa ha un solo scontro, con le stesse regole di posa, scelta del Campo e rotazione. Non usare FC, Lega o scontri intermedi come spareggi.

## 10. Esempi numerici

Nessun effetto di Campo, nessun pareggio. 25 PV e 18 FC iniziali.

### A — L'apertura mantiene la collina

| Giocatore | POT | DAN | FC | VA = POT × FC |
| --- | ---: | ---: | ---: | ---: |
| A | 7 | 4 | 5 | 35 |
| B | 8 | 3 | 2 | 16 |
| C | 6 | 5 | 5 | 30 |

A batte B (35–16): B a 21. A batte C (35–30): C a 21. A conquista. PV: A 25, B 21, C 21. FC: A 13, B 16, C 13. A paga 5 FC una sola volta.

### B — Due vincitori diversi

| Giocatore | POT | DAN | FC | VA |
| --- | ---: | ---: | ---: | ---: |
| A | 7 | 4 | 2 | 14 |
| B | 8 | 3 | 3 | 24 |
| C | 6 | 5 | 6 | 36 |

B batte A (24–14): A a 22. C batte B (36–24): B a 20. C conquista. PV: A 22, B 20, C 25. FC: A 16, B 15, C 12. B ha inflitto danno ma non ha attivato Conquista. Nel secondo scontro B ha Gloria (ha vinto il proprio scontro precedente) e Imboscata (è l'occupante).

### C — Riattivazioni e azzeramento

Occupante con POT 7, investimento 3 e «+2 POT» sempre attivo: VA (7+2)×3 = 27 in ogni scontro in cui l'effetto vale, mai 33. Se l'effetto è bloccato nel secondo, VA 21.

Occupante a 17 PV con Cura 2 sempre attiva, due scontri vinti senza danni: 19, poi 21. Se la seconda attivazione è bloccata, resta a 19.

### D — Quattro giocatori [P]

| Giocatore | POT | DAN | FC | VA |
| --- | ---: | ---: | ---: | ---: |
| A | 7 | 4 | 2 | 14 |
| B | 5 | 3 | 2 | 10 |
| C | 4 | 3 | 3 | 12 |
| D | 3 | 3 | 4 | 12 |

A vince tre scontri, infligge 4 a B, C e D e conquista una volta. I suoi FC sono addebitati una volta sola. Con Cura 2 sempre attiva e partendo da 17 PV, sale a 19, 21 e 23.

## 11. Interfaccia

- Ordine di posa, giocatore attivo, Campo scelto, coda degli sfidanti.
- Cinque slot Campo con stato: nascosto, rivelato, conquistato (con proprietario), senza proprietario.
- «Scontro 1 di 2» distinto da «Conquista del Campo»; a quattro fino a tre scontri.
- Carte posate pubbliche, mani private, FC nascosti fino alla rivelazione, senza anteprime o saldi che li svelino.
- Dopo ogni scontro: PV e riserve aggiornati, poi il ricalcolo della carta rimasta.
- Evidenziare che l'investimento resta, non si paga di nuovo.
- Gli sconfitti assistono agli scontri restanti e rientrano alla contesa successiva se vivi.
- Dialogo di reclamo della vittoria alle contese 3–4.
- Al termine: conquiste, PV, FC e cronologia degli scontri.
- Nessun rilancio, sostituzione o intervento durante la risoluzione.

## 12. Indicazioni tecniche

### 12.1 Stato

```text
Match:   mode, config, seed, players, initialOrder, openingCursor,
         battlefields[5], revealedFields, conqueredFields, contestIndex,
         phase, result
Player:  id, hp, fc, hand, usedCards, conquests, eliminated,
         lastFightResult, toxin
Contest: fieldIndex, order, privateCommits, revealed, occupantId,
         nextChallengerIndex, fightIndex, fightResults
Commit:  playerId, cardId, investment, revision
Fight:   fightId, occupant, challenger, isFinal
```

```text
LOBBY -> SETUP -> CONTEST_START -> SEQUENTIAL_COMMITS -> REVEAL
-> FIGHT_SETUP -> FIGHT_RESOLUTION -> FIGHT_END
-> FIGHT_SETUP (se resta uno sfidante)
oppure -> FIELD_CONQUEST -> CONTEST_END -> (CLAIM_CHOICE)
-> CONTEST_START / MATCH_END
```

Per ogni scontro chiamare `computeDuelResolution` con: Campo della contesa, i due Agenti, gli investimenti originari, PV e FC correnti dei due giocatori, carte usate e mani, `isPlayerFirst` = occupante, `lastWinner` derivato dalla storia personale di ciascuno, numero della contesa, Campi conquistati riportati alla prospettiva dei due giocatori. Negli scontri intermedi disattivare il Trigger Conquista delle carte; applicare `fieldBattleAftermath` in ogni scontro.

Il motore attuale tratta Gloria e Vendetta con un unico `lastWinner` condiviso dai due lati (`src/game/duel/duelTurnContexts.js`): se un lato ha vinto, l’altro risulta sconfitto. Qui ciascun giocatore ha una propria storia: l'adattatore deve fornire a ciascun lato il proprio esito precedente. Se il motore non lo consente, estenderlo in modo retrocompatibile senza cambiare l'1v1.

### 12.2 Server [P]

Allineato al 2v2: **server custode dei segreti**.
- Stanze da 3 o 4 posti, riconnessione per posto (`reconnectSecret`).
- Il server pesca le mani o tiene il seed: nessun client deve poter ricostruire le mani altrui.
- Valida turno di posa, proprietà della carta, Campo legale, investimento e riserva minima.
- Conserva gli impegni privati e pubblica tutti gli investimenti in un unico evento quando tutti hanno confermato.
- Viste filtrate per destinatario, anche in riconnessione ed errori.
- Risoluzione deterministica sui client dopo la rivelazione, con hash del risultato per rilevare desincronizzazioni.
- Messaggi duplicati non consumano carte, non addebitano FC e non duplicano cure, danni o Conquista.
- Disconnessione: pausa e ripresa, senza giocate automatiche.

### 12.3 Compatibilità degli effetti

Verificare copie, blocchi, immunità, recuperi FC, riduzioni di riserva, danni diretti, Tossina, terraformazioni ed effetti legati a vittoria o sconfitta. Le capacità non interpretabili senza una nuova decisione vanno elencate e disattivate nel prototipo con motivo. Non introdurre limiti di una cura o un recupero per Campo.

## 13. Test di accettazione

Da implementare ed eseguire, non già superati.

| Caso | Risultato |
| --- | --- |
| Esempio A | PV 25/21/21; FC 13/16/13; una conquista per A |
| Esempio B | PV 22/20/25; FC 16/15/12; una conquista per C; B ha Gloria e Imboscata nel secondo scontro |
| Esempio D [P] | Tre danni separati, un solo pagamento, una conquista |
| VA | `POT × FC` + modificatori, mai sotto il minimo |
| VA, Lega pari, POT diversa | Vince la POT più bassa |
| VA, Lega e POT pari | Vince lo sfidante |
| Giocatore non ancora confermato | Nessuna risoluzione |
| Modifica di un impegno confermato | Respinta |
| Campi | 3 visibili all'inizio, +1 per contesa; si sceglie solo fra rivelati non consumati |
| Cura 2 per due / tre scontri | 17 → 19 → 21 (→ 23) |
| Cura oltre 25 | Limitata a 25 |
| Seconda cura bloccata | Nessuna cura nel secondo scontro |
| +2 POT riapplicato | Mai accumulo |
| Copia o riduzione del primo scontro | Non resta nel secondo |
| Recupero FC | Aggiorna la riserva, non l'investimento |
| Rimonta / Magnanimo | Leggono i PV correnti dei due giocatori |
| Gloria nella catena | Chi ha appena vinto ha Gloria nello scontro successivo |
| Vendetta | Chi ha perso il proprio ultimo scontro, anche in una contesa precedente |
| Imboscata / Intervento | Occupante / sfidante, anche dopo un cambio di occupante |
| Turbo / Ultima Chance | Contese 1–2 / 5 |
| Resa dei conti | Conta carte distinte, non scontri |
| Vittoria intermedia | DAN ed effetti di Campo legati all'esito, ma nessun Trigger Conquista |
| Vittoria finale | Una conquista, nessun DAN supplementare |
| Effetto di Campo «al vincitore» | Applicato in ogni scontro |
| Ultimo Desiderio | Alla sconfitta locale, prima del controllo eliminazioni |
| Vincitore a 0 dopo gli effetti | Posto vuoto |
| Posto vuoto | Il prossimo vivo diventa occupante senza danni né effetti di scontro |
| Nessun occupante finale | Campo consumato senza proprietario |
| 3 Campi alla contesa 3 o 4 | Proposta di reclamo |
| 3 Campi alla contesa 5 | Nessuna vittoria territoriale; decide la Supremazia |
| Un solo vivo | Vittoria dopo la contesa e gli effetti finali |
| Tutti a 0 | Pareggio |
| Fine contesa 5 | Più PV fra i vivi; parità: vittoria condivisa [P] |
| Riconnessione e duplicati | Nessuna nuova spesa o attivazione; segreti protetti |
| Regressioni | 1v1, campagna e 2v2 invariati |

## 14. Bilanciamento e consegna

Misurare per posizione in coda: conquiste, danni inflitti e subiti, cure e recuperi FC, scontri disputati. Chi apre ammortizza l'investimento su più scontri e può accumulare Gloria e Imboscata nella catena; chi chiude vede più carte e combatte una volta. Non assumere che si compensino.

Punti aperti: vantaggio delle posizioni, rotazione non uniforme su cinque contese, soglia di 3 Campi con più avversari per contesa, guadagni ripetuti di FC e cure, Campi trasformati, effetto valanga di Gloria nella catena. La riapplicazione degli effetti è una scelta confermata: eventuali problemi vanno riportati, non corretti introducendo limiti.

Consegna attesa da Cursor: modalità selezionabile, partita completa a tre, estensione a quattro marcata come prototipo, parametri [P] elencati, test con esiti, contenuti incompatibili e file modificati. Non pubblicare il gioco sulla base di questa specifica.
