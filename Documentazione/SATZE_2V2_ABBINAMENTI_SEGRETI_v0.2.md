# Satze — 2v2 ad abbinamenti segreti

Regolamento e specifica funzionale per Cursor · versione 0.2 · 3 novembre 2026

## 0. Novità rispetto alla v0.1

La v0.1 era stata redatta senza ispezionare il codice e conteneva valori superati. La v0.2 è allineata al repository e alle decisioni dell'utente.

| Punto | v0.1 | v0.2 | Fonte |
| --- | --- | --- | --- |
| Formula VA | `POT + FC` | `POT × FC` + modificatori, minimo POT | `src/game/duel/duelAssaultPhase.js` |
| Lega massima mazzo | 28 | 30 | Decisione utente; validatori esistenti |
| Spareggio | VA → Lega → risposta | VA → Lega minore → POT minore → chi gioca per secondo | `src/game/duel/duelWinnerResolve.js`; decisione utente |
| Trigger | Nomi pre-rinomina (Turbo = primo, Imboscata = sconfitta, Vendetta = PV) | Significato del codice attuale | `src/data/triggers.js`, `src/game/triggerLogic.js`; decisione utente |
| Campi | Un Campo per turno, in ordine; nessuna conquista | **Un Campo per coppia**, scelti dall'apertura fra quelli rivelati; conquista attiva | Decisione utente |
| Vittoria | Solo PV | Come 1v1: Campi nei turni 1–4, Supremazia dal 5, Annientamento sempre | Decisione utente |
| Soglia territoriale | — | **5 Campi su 8** | Decisione utente |
| Rivelazione Campi | 2 iniziali + 1 per turno | **6 iniziali + 2 per turno** (doppio dell'1v1) | Decisione utente; 1v1 in `Codice/satze.jsx` |
| PV | Riserva di squadra [P] | Riserva **condivisa** dalla squadra confermata; valore 50 ancora [P] | Decisione utente |
| Segretezza | Server autoritativo | **Server custode** dei segreti; risoluzione deterministica | Decisione utente |
| Investimento | Visibile al compagno [P] | Visibile **solo** al compagno (regola) | Decisione utente |

## 1. Stato del documento e istruzione per Cursor

Realizzare una modalità multiplayer separata per quattro giocatori, divisi in due squadre. Questo documento definisce un prototipo giocabile, non un bilanciamento definitivo. Il nome «Abbinamenti segreti» è provvisorio.

**Direzione scelta dall'utente:** tutti e quattro partecipano a ogni turno con un Agente; ogni coppia di Agenti avversari si scontra su un proprio Campo; la squadra in apertura sceglie i Campi e vi assegna pubblicamente i propri Agenti; la squadra in risposta sceglie segretamente quale dei propri Agenti affronta ciascun fronte; tutti investono FC personali, visibili solo al compagno.

**Convenzioni [P]:** le decisioni marcate [P] non sono ancora state approvate esplicitamente dall'utente. Implementarle come specificato, mantenendole configurabili e riportandole nel riepilogo delle modifiche. Non presentarle come regole definitive di Satze.

Non aggiungere fusioni, trasferimenti di statistiche o poteri fra compagni, scommesse, Eminenze, risorse nuove o interventi durante uno scontro. Non implementare il tutti contro tutti con questo documento.

### 1.1 Contesto tecnico verificato

| Elemento | Dove | Uso nel 2v2 |
| --- | --- | --- |
| Risoluzione di uno scontro | `computeDuelResolution` in `src/game/duelResolve.js` | Chiamata una volta per fronte, con contesti isolati |
| Esempio di modalità a 4 giocatori sul motore base | `src/game/arenaContesa/` (`resolveArenaDuel`, `buildDuelConqueredMap`) | Modello di riferimento per l'adattatore |
| Trigger | `src/game/triggerLogic.js`, `src/data/triggers.js` | Riutilizzo integrale, cambia solo il contesto (§7) |
| Riserva minima FC | `src/game/legalFocusSpend.js` | Riutilizzo integrale (§3.2) |
| Selezione Campi | `selectBattlefields` / `pickBattlefieldsByRarity` in `src/game/fieldLogic.js` (parametro `fieldCount`) | 10 Campi, vincolo `minTurn` sui primi 6 (§3.3) |
| Campi legali | `getLegalFieldIndexes` in `src/game/ai/legalFields.js` | Rivelati e non conquistati |
| Iniziativa | `resolveRoundInitiative` in `src/game/duel/resolveRoundInitiative.js` | Alternanza a ogni turno, profilo core |
| Conteggio Campi | `countConqueredFields` in `src/game/duel/duelHelpers.js` | Conteggio per squadra (§7) |
| Vittoria, reclamo, rivelazione | `Codice/satze.jsx` (fine turno) | Logica da replicare nell'orchestratore 2v2 (§9) |
| Tossina | `src/game/toxinLogic.js` | Da adattare alla Vita di squadra (§6.2) |
| Server | `server/index.mjs` | Oggi solo relay, stanze da 2. Va esteso (§12) |
| Payload partita online | `src/utils/onlineMatch.js` | Oggi contiene entrambe le mani: **non riutilizzabile** così nel 2v2 |

Cursor deve comunque verificare il repository attuale prima di scegliere file e API. Non modificare il comportamento della modalità classica, della campagna o di Arena Contesa. Se una regola qui richiamata contraddice il motore, segnalarlo: le regole specifiche di questa modalità prevalgono solo nel 2v2.

## 2. Terminologia

- **Partita:** fino a cinque turni, salvo conclusione anticipata.
- **Turno:** quattro Agenti schierati, due scontri, due Campi.
- **Fronte:** un Campo del turno con l'Agente dell'apertura assegnato a esso.
- **Scontro:** confronto completo fra due Agenti su un fronte, identico a uno scontro 1v1.
- **Apertura:** squadra con l'iniziativa del turno: sceglie i Campi e schiera per prima.
- **Risposta:** squadra che schiera per seconda e sceglie segretamente la disposizione.
- **Disposizione:** quale Agente della risposta va su ciascun fronte. Esistono solo due disposizioni.

Ogni Agente affronta esattamente un avversario, su un solo Campo. Il suo VA non si somma a quello del compagno.

## 3. Preparazione e parametri

| Elemento | Regola | Stato |
| --- | --- | --- |
| Partecipanti | Quattro, squadre A e B, posti A1/A2 e B1/B2 | Direzione scelta |
| Mazzo | Personale, 10 Agenti, nessuna copia, somma Lega massima **30**, validatore base | Base verificata |
| Copie fra compagni | Nessun vincolo fra due mazzi distinti | [P] |
| Mano | Cinque Agenti per persona, procedura base | Base verificata |
| Pescata | Nessuna; un Agente consumato per turno | Base verificata |
| FC | 18 per persona, riserve separate, nessun prestito | Base verificata |
| Investimento | Intero, minimo 1 FC per Agente | Base verificata |
| PV | Riserva **condivisa** dalla squadra: 50 iniziali, massimo 50 | Condivisione: decisione utente · valore 50: [P] |
| Campi | **10** per partita, uno per scontro | Decisione utente |
| Soglia territoriale | **5 Campi** conquistati dalla squadra | Decisione utente |
| Durata | Cinque turni | Base verificata |

Nota: la soglia 1v1 è calcolata come `floor(numeroCampi / 2) + 1`, che con 10 Campi darebbe 6. Nel 2v2 la soglia è un parametro di configurazione fissato a 5, non derivato dalla formula.

### 3.1 Prima apertura e alternanza

Si somma la Lega delle dieci carte nelle due mani iniziali di ciascuna squadra. **La squadra con la somma più bassa apre** il turno 1, come nell'1v1 apre chi ha la Lega più bassa. In parità, sorteggio sul server registrato nel replay.

Dal turno 2 apertura e risposta si alternano, come nel profilo core di `resolveRoundInitiative`. Nei turni 1–4 ogni squadra apre due volte e risponde due volte: la fase territoriale è simmetrica. Il turno 5 è aperto dalla stessa squadra del turno 1; è un'asimmetria nota da misurare, senza compensazioni automatiche. Nella rivincita proporre l'inversione della prima apertura.

### 3.2 Riserva minima dei FC

Riutilizzare `legalFocusSpend.js`: la spesa massima è `FC_disponibili − (Agenti_da_giocare − 1)`. Gli effetti che sottraggono FC rispettano lo stesso minimo [P]. Non generare FC per riparare uno stato invalido.

### 3.3 Selezione e rivelazione dei Campi

- Si selezionano **10 Campi** con `pickBattlefieldsByRarity(mode, pool, rng, config, 10)`, con seed del server.
- Il vincolo `minTurn: 1` si applica ai **primi 6 slot** (quelli giocabili al turno 1): nel 2v2 `REVEAL_START = 6`. Pool verificato: 116 Campi non neutri, di cui 98 con `minTurn: 1`.
- **Rivelazione:** 6 Campi visibili all'inizio della partita; alla fine di ogni turno se ne rivelano altri 2, finché non sono tutti visibili. Campi rivelati: 6 al turno 1, 8 al turno 2, 10 dal turno 3.
- I parametri di rarità (`BATTLEFIELD_SELECTION_DEFAULTS`) sono tarati su 5 slot; nel prototipo usarli invariati e misurare quanti Campi rari e speciali escono su 10 [P].
- I Campi speciali della campagna non entrano automaticamente nella modalità.

## 4. Sequenza del turno

### Fase 1 — Preparazione

Mostrare Campi rivelati e conquistati, PV, riserve FC pubbliche, squadra in apertura e squadra in risposta. Memorizzare lo snapshot dei PV di entrambe le squadre (§7.1).

### Fase 2 — Schieramento dell'apertura

Ciascun giocatore dell'apertura sceglie **un Agente dalla propria mano e un Campo legale** (rivelato e non conquistato). I due compagni devono scegliere Campi diversi. Possono vedere le proposte del compagno e discuterne.

Quando entrambi confermano la stessa revisione della proposta di squadra, i due Agenti e i rispettivi Campi diventano pubblici insieme e irrevocabili. Si formano i due fronti: «Fronte di A1» e «Fronte di A2» se apre A, o i corrispondenti di B.

Non si assegnano ancora FC.

### Fase 3 — Schieramento della risposta

La risposta vede i due fronti, sceglie e conferma i propri due Agenti, che diventano pubblici insieme e irrevocabili. **Non** viene ancora rivelato su quale fronte va ciascuno.

Gli Agenti dell'apertura sono «primi» e quelli della risposta «secondi» in entrambi gli scontri, qualunque sia la disposizione. L'ordine dei clic fra compagni non conta.

### Fase 4 — Scelte segrete

Tutti vedono i quattro Agenti e i due fronti, poi scelgono il proprio investimento. Solo la risposta sceglie la disposizione.

Con posti fissi A1/A2 e B1/B2:

| Disposizione | Scontro sul fronte di X1 | Scontro sul fronte di X2 |
| --- | --- | --- |
| Diretta | X1 contro Y1 | X2 contro Y2 |
| Incrociata | X1 contro Y2 | X2 contro Y1 |

X è la squadra in apertura, Y quella in risposta. I posti identificano i giocatori, non i ruoli.

**Piano di squadra:** disposizione proposta (solo risposta), i due investimenti e un numero di revisione formano il piano privato della squadra. Ogni modifica invalida le conferme precedenti. Il piano si blocca quando entrambi approvano la stessa revisione. Nessun compagno può impostare i FC dell'altro. Dopo il blocco nessuna modifica è possibile, anche se gli avversari stanno ancora decidendo. Anche l'apertura conferma un piano, con i soli investimenti.

### Fase 5 — Rivelazione atomica

Quando entrambi i piani sono bloccati, il server pubblica in un unico evento la disposizione e i quattro investimenti. Si deducono le spese una sola volta e si costruiscono i due contesti di scontro. I FC restano legati al proprietario e al suo Agente.

### Fase 6 — Risoluzione

Ogni fronte si risolve come uno scontro 1v1 completo sul proprio Campo, con il motore base e gli adattamenti dei §§6–8. Le due risoluzioni sono indipendenti: l'ordine di calcolo non deve cambiare i risultati.

### Fase 7 — Applicazione e avanzamento

1. Il vincitore di ogni scontro **conquista il Campo del proprio fronte** per la propria squadra, salvo effetti base che impediscono la conquista (`skipConquest`).
2. Si applicano insieme le variazioni di Vita (§7.1), FC, Tossine e storie personali; gli Agenti giocati sono consumati.
3. Si verifica la fine partita (§9).
4. Se la partita continua: si rivelano 2 nuovi Campi, se ce ne sono ancora di nascosti, e si invertono apertura e risposta.

## 5. Informazioni e comunicazione

| Informazione | Proprietario | Compagno | Avversari |
| --- | --- | --- | --- |
| Mano non giocata | Visibile | Visibile [P] | Nascosta |
| Agenti e Campi schierati, carte consumate | Visibili | Visibili | Visibili |
| Proposta di schieramento dell'apertura prima della conferma | Visibile | Visibile | Nascosta |
| FC disponibili prima della scelta | Visibili | Visibili | Visibili |
| Investimento in preparazione o bloccato | Visibile | **Visibile** | **Nascosto fino alla rivelazione** |
| Disposizione proposta o bloccata | Visibile (risposta) | Visibile (risposta) | Nascosta fino alla rivelazione |
| PV, Campi rivelati e conquistati | Visibili | Visibili | Visibili |

La segretezza deve valere anche a livello tecnico (§12), non solo nell'interfaccia. Comunicazione libera fra compagni; una chat di squadra, se presente, è privata. Durante le scelte il saldo FC pubblico resta quello precedente. Gli eventi di conferma non contengono valori, bersagli o dettagli del piano.

## 6. Regole dei singoli scontri

Ogni scontro segue integralmente il motore base sul Campo del proprio fronte:

- **Pre-turno e Fase 3:** condizioni ambientali e modificatori del Campo di quel fronte soltanto.
- **VA:** `(POT + modificatori POT) × FC investiti + modificatori VA`, mai sotto il minimo previsto dal motore (POT corrente o `minAssault`).
- **Spareggio:** VA più alto; poi Lega più bassa; poi POT più bassa; poi vince chi ha giocato per secondo, cioè l'Agente della risposta. Restano validi gli spareggi forzati già previsti dal motore (`vaTieWinnerSide`). Non usare i timestamp dei messaggi.
- **Danno:** il vincitore infligge il proprio DAN effettivo alla riserva PV della squadra avversaria. Se una squadra vince entrambi gli scontri, produce due eventi di danno distinti; protezioni e modificatori si applicano a ciascun evento prima della somma.

### 6.1 Bersagli e risorse

- «Avversario» o «nemico» significa l'Agente e il giocatore abbinati sul fronte.
- Modifiche a POT, DAN, VA, Potere e Bonus valgono solo per quello scontro.
- Effetti sui FC agiscono sulla riserva del singolo giocatore coinvolto.
- Cure, danni diretti e costi in Vita agiscono sui PV della squadra interessata, una volta per attivazione.
- Il Bonus Armata dipende dalla mano del singolo giocatore (regola base: 2+ carte della stessa armata nella mano iniziale; Patto degli Indocili come da regolamento). La mano del compagno non conta.
- Immunità, blocchi, copie, minimi e massimi seguono il motore base e non si estendono al compagno.

### 6.2 Tossina [P]

La Tossina è un effetto persistente che danneggia i PV a fine turno fino a una soglia `minHealth`. Nel 2v2 resta legata al giocatore che l'ha subita ma danneggia la Vita della squadra. La soglia `minHealth` è pensata per 25 PV individuali: nel prototipo raddoppiarla sui 50 PV di squadra, rendendola configurabile, e segnalarla fra i casi da rivedere. Due Tossine sulla stessa squadra producono due eventi distinti.

## 7. Trigger

Si usa il significato del codice attuale (`src/game/triggerLogic.js`). Nel 2v2 cambia solo il contesto passato a `checkTrigger`:

| Trigger | Condizione nel 2v2 |
| --- | --- |
| Imboscata | L'Agente è della squadra in apertura (`isFirst`) |
| Intervento | L'Agente è della squadra in risposta |
| Turbo | Turno 1 o 2 |
| Ultima Chance | Turno 5 |
| Gloria | Il proprietario ha vinto il **proprio** scontro nel turno precedente |
| Vendetta | Il proprietario ha perso il **proprio** scontro nel turno precedente |
| Rimonta | PV della propria squadra < PV della squadra avversaria (snapshot) |
| Magnanimo | PV della propria squadra > PV della squadra avversaria (snapshot) |
| Overdrive | Investimento personale (FC effettivi) ≥ soglia del Campo del fronte, default 5 |
| Opportunista | L'avversario abbinato ha investito 5+ FC |
| Sfida / Sopraffare | Lega del proprio Agente minore / maggiore di quella dell'avversario abbinato |
| Resa dei conti | Il proprietario e l'avversario abbinato hanno giocato almeno 3 Agenti, compreso quello corrente |
| Invasione | La **squadra** del proprietario ha conquistato almeno 1 Campo |
| Resistenza | La **squadra** avversaria ha conquistato almeno 1 Campo |
| Alleato / Rinforzi | Mano iniziale del proprietario, come da base |
| Staffetta | Storia del proprietario, come da base |
| Ultimo Desiderio / Conquista | Esito dello scontro del proprio Agente |
| Debito | Come da base |
| Trigger Eminenza | Non applicabili: Eminenze escluse |

Regole comuni:
- Al turno 1 Gloria e Vendetta sono false. Con PV pari, Rimonta e Magnanimo sono false.
- La storia segue il giocatore anche quando cambia avversario. Una vittoria del compagno non concede Gloria.
- I Campi conquistati si contano per squadra; i Campi che forzano un Trigger (`...AlwaysActive`) valgono solo sul proprio fronte.

### 7.1 Vita simultanea

Tutte le condizioni che leggono la Vita durante il turno leggono lo snapshot di inizio turno. Le variazioni di Vita dei due scontri sono raccolte come eventi e applicate alla fine:

`PV_finali = min(PV_massimi, max(0, PV_inizio_turno + somma_variazioni))`

Registrare danni, cure, costi e Tossine con origine e bersaglio. Esempio: a 49/50 PV, subire 4 e curare 3 nello stesso turno dà 48 PV. Una cura nello stesso turno può compensare un danno altrimenti letale [P]. Gli effetti che leggono la Vita appena modificata, i costi con limite di pagamento e gli effetti persistenti vanno verificati prima di abilitare le carte interessate.

Il motore attuale riceve `playerHP` ed `enemyHP` separati: per ogni fronte passare gli snapshot delle due squadre e raccogliere le variazioni restituite, senza far mutare a ciascun resolver la stessa Vita globale.

## 8. Campi e persistenza

Ogni fronte ha il proprio Campo: il suo effetto si applica solo ai due Agenti di quel fronte, esattamente come in un duello 1v1. Non servono istanze duplicate.

- La terraformazione o la sostituzione del Campo corrente riguarda solo quel fronte.
- Gli effetti di esito del Campo (conquista, perdita) riguardano solo lo scontro locale.
- Gli effetti del Campo sui PV vanno sulla riserva di squadra; quelli sui FC sul singolo giocatore.
- Un effetto personale persistente segue il giocatore nei turni successivi.
- Per effetti che modificano Campi futuri, il Campo precedente o «tutti i Campi», per trasformazioni persistenti, vittoria immediata o effetti di campagna: verificare la compatibilità prima. Una ricerca testuale in `src/data/battlefields.js` non ha trovato riferimenti espliciti a Campi successivi o precedenti, ma `src/game/duel/terraform.js` e gli effetti condizionali vanno controllati. La v0.1 di prova può escludere dal pool i Campi incompatibili, mostrando motivo e lista; non ignorarne silenziosamente gli effetti.

## 9. Fine partita

Dopo aver applicato tutti gli effetti del turno, come nell'1v1:

1. **Annientamento** (sempre): se una sola squadra è a 0 PV, perde. Se entrambe sono a 0 PV, pareggio.
2. **Conquista** (turni 1–4): se una squadra ha conquistato **5 Campi**, vince.
   - **Reclamo:** come nell'1v1, se la soglia è raggiunta al turno 3 o 4 la squadra può reclamare la vittoria o continuare. Nel 2v2 la scelta è un piano di squadra: serve la conferma di entrambi sulla stessa opzione; in attesa dell'accordo la partita resta in pausa [P]. Con 5 Campi su 8 la soglia non si può raggiungere prima del turno 3.
   - Le due squadre non possono raggiungere la soglia insieme: nei turni 1–4 si giocano 8 Campi e 5 + 5 supera 8. Il codice deve comunque trattare il caso come errore di stato, non come vittoria di una delle due.
3. **Supremazia** (dal turno 5): alla fine del turno 5 vince la squadra con più PV; a parità, pareggio. I Campi conquistati al turno 5 restano utili per Invasione, Resistenza e statistiche, non per la vittoria territoriale.

Non usare FC residui, somma Lega o numero di scontri vinti come spareggi. Non eliminare singoli giocatori.

## 10. Esempio verificabile

Nessun Potere, Bonus o effetto di Campo. **B apre** e mette B1 sul Campo X e B2 sul Campo Y. **A risponde** e sceglie la disposizione.

| Giocatore | POT | DAN | FC | VA = POT × FC |
| --- | ---: | ---: | ---: | ---: |
| A1 | 8 | 2 | 1 | 8 |
| A2 | 5 | 7 | 6 | 30 |
| B1 | 7 | 5 | 5 | 35 |
| B2 | 7 | 3 | 1 | 7 |

- **Diretta** (A1 su X contro B1, A2 su Y contro B2): B1 batte A1 (35–8), conquista X e infligge 5; A2 batte B2 (30–7), conquista Y e infligge 7. PV: A 45, B 43. Campi: A 1, B 1.
- **Incrociata** (A2 su X contro B1, A1 su Y contro B2): B1 batte A2 (35–30), conquista X e infligge 5; A1 batte B2 (8–7), conquista Y e infligge 2. PV: A 45, B 48. Campi: A 1, B 1.
- In entrambi i casi i FC finali sono A1 = 17, A2 = 12, B1 = 13, B2 = 17.

Se B1 e B2 scambiano gli investimenti (B1 = 1, B2 = 5), i loro VA diventano 7 e 35:
- Diretta: A1 batte B1 (8–7), infligge 2; B2 batte A2 (35–30), infligge 3.
- Incrociata: B2 batte A1 (35–8), infligge 3; A2 batte B1 (30–7), infligge 7.

Se B1 e B2 investono 3 ciascuno, entrambi hanno VA 21: A1 perde (8–21) e A2 vince (30–21) in entrambe le disposizioni. B elimina l'incertezza ma lascia passare la carta da 7 DAN.

## 11. Interfaccia minima

1. Lobby con quattro posti, squadre esplicite e validazione dei mazzi individuale.
2. Riserva PV grande per squadra; quattro contatori FC associati ai proprietari.
3. Dieci slot Campo con stato chiaro: nascosto, rivelato, conquistato (con squadra), attivo nel turno.
4. Durante lo schieramento dell'apertura: selezione di Agente e Campo per ciascun giocatore, con vincolo di Campi diversi.
5. Due fronti chiaramente distinti nel turno, ciascuno col proprio Campo e l'Agente dell'apertura.
6. Etichette «Apertura» e «Scelta abbinamenti», che cambiano squadra a ogni turno.
7. Mano personale e vista privata della mano del compagno, senza mescolare i proprietari.
8. Selettore della disposizione solo per la risposta, con anteprima privata dei collegamenti fronte-Agente.
9. Selettore FC personale, indicatori privati delle conferme della revisione corrente, pulsante di conferma.
10. Attesa pubblica neutra: nessuna freccia, anteprima o tooltip che sveli la disposizione o gli investimenti.
11. Rivelazione di disposizione e investimenti nello stesso passaggio, prima delle animazioni.
12. Riepilogo del turno: due esiti, Campi conquistati, danni e cure per origine, PV e FC finali, Campi appena rivelati, prossima squadra in apertura.
13. Dialogo di reclamo della vittoria per la squadra che raggiunge la soglia ai turni 3–4, con conferme di entrambi.

Le animazioni dei due scontri possono essere parallele o in sequenza, ma rappresentano un risultato già calcolato. Nessun input fra le due.

## 12. Indicazioni tecniche

### 12.1 Stato e orchestrazione

Modello concettuale, da adattare all'architettura verificata:

```text
Match:  mode, config, teams, players, battlefields[10], revealedFields,
        conqueredFields{fieldIndex: {teamId}}, roundIndex,
        openingTeamId, respondingTeamId, phase, rngState, result
Team:   playerIds[2], hp, maxHp, privatePlan, planRevision, approvals, locked
Player: teamId, seat, deck, hand, usedCards, fc, previousResult, toxin, history
Front:  fieldIndex, openingPlayerId, respondingPlayerId (dopo la rivelazione)
PrivatePlan: deployments[{playerId, cardId, fieldIndex}], investmentsByPlayer,
             pairing (solo risposta), claimChoice (solo reclamo)
RoundResult: fronts[2], pairResults[2], conquests, hpEvents, resourceEvents
```

Macchina a stati:

```text
LOBBY -> SETUP -> ROUND_START -> OPENING_DEPLOY -> RESPONSE_DEPLOY
-> SECRET_PLANNING -> REVEAL -> RESOLUTION -> ROUND_END
-> (CLAIM_CHOICE) -> ROUND_START oppure MATCH_END
```

Per ogni fronte costruire un contesto `computeDuelResolution` con: Campo del fronte, i due Agenti, gli investimenti, gli snapshot PV delle due squadre, FC, carte usate e mano dei due giocatori abbinati, `isPlayerFirst` dall'apertura, `lastWinner` dalla storia personale, `roundNumber`, `conqueredFields` riportato alla prospettiva delle due squadre (vedi `buildDuelConqueredMap` in Arena Contesa), Bonus Armata e Tossina dei rispettivi giocatori. Poi aggregare gli eventi.

### 12.2 Server custode dei segreti

Il server attuale (`server/index.mjs`) inoltra soltanto i messaggi fra due client. Nel 2v2 deve:

- gestire stanze da 4 posti in 2 squadre, con riconnessione per posto (stesso schema `reconnectSecret`);
- **distribuire le mani**: il seed di mescolamento e pescata resta sul server, oppure il server pesca e invia a ciascuno solo la propria mano e quella del compagno. Non condividere un seed da cui un client possa ricostruire le mani avversarie: il payload attuale di `onlineMatch.js` invia entrambe le mani e non va riutilizzato così;
- conservare proposte e piani di squadra e inoltrarli **solo al compagno**;
- validare fase, appartenenza alla squadra, proprietà della carta, Campo legale e diverso da quello del compagno, revisione del piano, range dell'investimento (riserva minima) e diritto di scegliere la disposizione;
- respingere conferme su revisioni vecchie e messaggi duplicati o fuori fase;
- pubblicare la rivelazione solo quando entrambi i piani sono bloccati, in un unico evento con identificativi di turno ed evento;
- inviare viste filtrate per destinatario, anche negli snapshot di riconnessione e nei messaggi di errore.

La risoluzione può restare sui client, perché dopo la rivelazione tutti i dati sono pubblici: deve essere deterministica (seed del turno pubblicato con la rivelazione, ordine canonico indipendente dall'ordine di arrivo dei messaggi). Per rilevare desincronizzazioni, i client inviano un hash del risultato; se differiscono, la partita si sospende e si registra il caso [P].

### 12.3 Altre regole tecniche

- Carte riservate allo schieramento e consumate una sola volta; uno schieramento pubblicato non può essere annullato.
- Un piano di squadra bloccato non è modificabile, anche dopo una riconnessione.
- Disconnessione: pausa e ripresa al rientro, senza giocate automatiche [P]. Una eventuale resa riguarda l'intera squadra e richiede una conferma chiara.

### 12.4 Integrazione progressiva

1. Orchestratore 2v2 puro (senza rete) con carte prive di effetti; coprire l'esempio del §10.
2. Fronti con Campi, conquista, soglia 5, reclamo, rivelazione 6+2.
3. Contesti dei Trigger, Vita simultanea, Tossina.
4. Classificazione di carte e Campi compatibili; nessuna capacità sconosciuta diventa un no-op silenzioso.
5. Server custode: stanze da 4, viste filtrate, piani, rivelazione, riconnessione.
6. Interfaccia, replay e diagnostica, partita completa con quattro client.
7. Test e build; verificare l'assenza di regressioni in 1v1, campagna e Arena Contesa.

## 13. Criteri di accettazione

Test da implementare ed eseguire, non già superati.

| Caso | Risultato richiesto |
| --- | --- |
| Esempio §10, diretta | A = 45, B = 43; Campi 1–1; FC 17/12/13/17 |
| Esempio §10, incrociata | A = 45, B = 48; Campi 1–1; stessi FC |
| B scambia i FC | Diretta: A infligge 2, B infligge 3; incrociata: A infligge 7, B infligge 3 |
| B investe 3 + 3 | A1 perde e A2 vince in entrambe le disposizioni |
| VA calcolato | `POT × FC` + modificatori, mai sotto il minimo del motore |
| VA pari, Lega diversa | Vince la Lega più bassa |
| VA e Lega pari, POT diversa | Vince la POT più bassa |
| VA, Lega e POT pari | Vince l'Agente della risposta, indipendentemente da posto e clic |
| Apertura sceglie due volte lo stesso Campo | Rifiutato |
| Apertura sceglie un Campo non rivelato o conquistato | Rifiutato |
| Rivelazione | 6 Campi al turno 1, 8 al turno 2, 10 dal turno 3 |
| Selezione Campi | I primi 6 slot hanno `minTurn: 1` |
| Conquista | Ogni vincitore conquista il Campo del proprio fronte |
| 5 Campi al turno 3 o 4 | Proposta di reclamo; serve la conferma di entrambi |
| 5 Campi al turno 5 | Nessuna vittoria territoriale; decide la Supremazia |
| Soglia | Configurata a 5, non derivata da `floor(10/2)+1` |
| Prima apertura | Apre la squadra con somma Lega più bassa |
| Alternanza | L'apertura cambia squadra a ogni turno |
| Imboscata / Intervento | Apertura / risposta, su entrambi i fronti |
| Turbo / Ultima Chance | Turni 1–2 / turno 5 |
| Gloria e Vendetta dopo un cambio di avversario | Dipendono dalla storia del proprietario |
| Rimonta / Magnanimo | Snapshot PV di squadra; false a parità |
| Invasione / Resistenza | Campi conquistati dalla squadra |
| Overdrive | Investimento personale, soglia del Campo del fronte |
| Opportunista, Sfida, Sopraffare | Riferiti all'avversario abbinato |
| Resa dei conti | Conta gli Agenti di ciascun giocatore abbinato |
| Bonus Armata | La mano del compagno non attiva il Bonus |
| Terraformazione | Non altera l'altro fronte |
| Vita 49, danno 4 e cura 3 | 48 PV |
| Entrambe le squadre a 0 PV | Pareggio, qualunque animazione sia mostrata per prima |
| Due vittorie della stessa squadra | Due eventi di DAN, nessuna somma di VA |
| Ordine di calcolo dei fronti scambiato | Stessi risultati |
| Modifica del piano dopo una conferma | Conferma invalidata |
| Piano bloccato | Nessuna modifica |
| Messaggio duplicato o fuori fase | Nessuna doppia spesa, rivelazione o risoluzione |
| Investimento negativo, frazionario, sotto 1 o oltre la riserva minima | Rifiutato dal server |
| Client avversario durante le scelte o la riconnessione | Non riceve mani, investimenti, proposte o disposizione |
| Seed e mani | Nessun client può ricostruire la mano degli avversari |
| Cinque turni completi | Cinque Agenti consumati per persona |
| 1v1, campagna, Arena Contesa | Comportamento e salvataggi invariati |

## 14. Punti da riesaminare con il playtest

- **Vantaggio della risposta:** sceglie la disposizione e vince l'ultimo spareggio; l'apertura sceglie Campi e fronti. Misurare danni netti, Campi e vittorie per ruolo.
- **Soglia 5 su 8:** misurare quante partite finiscono per Conquista, per Annientamento e per Supremazia, e quante volte si reclama.
- **50 PV:** valore non validato; con due danni possibili per turno a squadra.
- **Turno 5:** aperto sempre dalla squadra che ha aperto il turno 1.
- **Rarità su 10 Campi:** distribuzione di Campi rari e speciali.
- **Tossina:** soglia raddoppiata provvisoria.
- **Riserva minima FC:** impatto sui mazzi che riducono i FC.
- **Collaborazione:** verificare che entrambi i giocatori mantengano decisioni proprie.

Registrare per il playtest: configurazione, seed, apertura, Campi scelti, disposizione, Agenti, FC, effetti, esiti, Campi conquistati e PV finali. I log completi sono accessibili solo dopo la partita o in sviluppo, mai agli avversari durante le scelte.

## 15. Consegna attesa da Cursor

Una modalità selezionabile separatamente, una partita completa fra quattro client, elenco dei parametri [P] implementati, elenco motivato di carte e Campi esclusi, test eseguiti con esiti e riepilogo dei file modificati. Non dichiarare bilanciata la modalità senza playtest. Non pubblicare o distribuire il gioco sulla base di questo documento.

Il tutti contro tutti sarà oggetto di una specifica distinta.
