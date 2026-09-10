# SATZE — Campagna del Nascente

**Design 0.25 · Implementazione del primo atto · 10 settembre 2026**

Il riferimento di design è il documento unificato 0.25, riportato sotto con le sue tabelle. Le diciture storiche «da implementare» appartengono alla specifica: lo stato del codice è riepilogato qui. Bilanciamento e rifinitura degli incontri restano rinviati.

## Stato dell’implementazione

I nuovi slot avviano il primo atto 0.25. I salvataggi dei due modelli precedenti continuano ad aprire il proprio hub.

- Progressione da 1v1 a esercito di dieci identità, due bivi, Faglia obbligatoria e facoltativa, quattro eventi e boss in due fasi.
- Quindici Poteri del Nascente, crescita e cambio tramite Domande; catture dal roster nemico, rinforzi nelle tappe di crescita, copie individuali e trasformazioni casuali di pari Lega.
- Esiti dei formati ridotti, PV conservati fra squadre, FC ripristinati, annientamento prioritario e ricompensa unica del nodo.
- Staffetta e Torre del Richiamo; Terraformare al timing del Potere con destinazioni esplicitamente abilitate e contributi continui separati.
- Salvataggio di tentativo, mani, stato logico del duello, esito, premio ed evento pendente; retry, riavvolgimento e controlli contro applicazioni duplicate.
- Piani P1/P2, Preparazione E06, flag di Comunione e chiusura dell’atto. Le Faglie sono incontri contro IA nell’ambientazione delle incursioni.

### Correzioni del primo incontro e della mappa

I1 è un tutorial con apertura nemica fissa (`openingPlayerFirst: false`): Nascente e Picca restano 2 POT, 2 DAN, Lega 2 e hanno 10 FC. Impegnando tutti i 10 FC il giocatore può conquistare il Varco contro ogni puntata legale nemica; a pari VA, Lega e POT vale il normale spareggio a favore del secondo. L’iniziativa degli altri incontri resta invariata. Un tentativo precedente già iniziato conserva il proprio stato: abbandonandolo e ritentando si applica l’apertura corretta.

L’hub riutilizza la mappa scenica esistente, i sentieri, i medaglioni, il ritratto dell’incontro, le carte dell’armata e la transizione di ingresso. Le diciotto tappe sono disposte su un unico percorso illustrato a scorrimento orizzontale, senza pulsanti di pagina. Rotella, trackpad e scorrimento touch permettono di esplorarlo; all’ingresso e dopo una tappa la vista si posiziona sul nodo corrente. Consultare tappe future non le sblocca.

### Flusso campagna e controlli di prova

- Alla fine dell’incontro il pannello centrale mostra soltanto **Prosegui** in caso di vittoria e **Ritenta** in caso di sconfitta o pareggio. Prosegui torna alla campagna, mantenendo premi o fase successiva pendenti; Ritenta salva un nuovo tentativo e riavvia subito l’intero incontro, dalla prima squadra e con risorse iniziali. Il pannello campagna non espone Menù, ragionamenti IA, rematch o storico playtest.
- Quando si entra in uno slot vengono precaricati campi, carte e risorse delle tappe future e preparate le animazioni del duello. All’interno della stessa sessione di campagna gli incontri successivi, i retry e le fasi successive riutilizzano questa preparazione, senza ripetere la schermata di caricamento. Una ripresa dello scontro ripristina direttamente la fase salvata. Gli altri formati conservano il proprio caricamento.
- Per le prove del primo atto, **Test: vinci incontro** è disponibile nella scheda dell’incontro e nel duello durante la selezione. Completa l’intero incontro, comprese eventuali squadre successive, tramite il normale percorso di esito e ricompensa; la scelta del premio resta da confermare. Non salta le Domande e non duplica ricompense già pendenti. Il comando è esplicito e temporaneo, da rimuovere terminata la fase di test.

### Avvio e configurazione

Eseguire `npm install` e `npm run dev:vite`. Nel menu Campagna scegliere uno slot vuoto, Nuova campagna e Inizia il cammino. Il Nascente parte 2 POT / 2 DAN senza Potere.

Le configurazioni provvisorie sono in `src/campaign/data/firstAct.js`; progressione e validazione in `src/campaign/state/firstActState.js`; il collegamento al duello è `src/campaign/logic/firstActBattle.js`. Le scelte narrative e le offerte vengono confermate solo dopo il salvataggio. Il registro di destinazioni Terraformare è `src/game/duel/terraform.js`: un futuro Campo deve avere una gestione del proprio timing verificata prima di entrarvi.

L’editor grafico precedente resta relativo alle campagne precedenti: i dati del nuovo primo atto si modificano per ora nel modulo versionato. Cambi incompatibili richiedono una nuova versione dei dati e una migrazione esplicita. L’Atto II, le Eminenze successive e il bilanciamento non sono inclusi in questa consegna.

### Verifica

I test dedicati attraversano entrambi i bivi e F2 affrontata/saltata, tutti i pacchetti, ricambio del boss, catture, maturazione, pool vuote, riavvolgimento, salvataggi ed errori di scrittura. I test del motore verificano Staffetta, blocchi, Terraformare, piani e impossibilità di recuperare da zero PV nella stessa risoluzione. I test React collegano slot, hub, hook reali del duello e ripresa.

Comandi: `npm run test:unit`, `npm run test:integration`, `npm run build`. Il test unitario snapshot `edge_effetto_gia_attivo` delle Eminenze fallisce anche sul commit originale `ef66f1e`; non è stato riscritto per rendere verde la suite. Non è stato svolto un playtest manuale completo né una valutazione di difficoltà.

## Specifica unificata 0.25

Documento di game design unificato

Versione 0.25 — 10 settembre 2026

La campagna narrativa rigiocabile segue il Nascente, portatore della Domanda, nella formazione di un esercito e nel confronto con la Concordia di Caelion. Il primo atto è il centro della progettazione attuale: introduce reclutamento, trasformazione facoltativa, scelta del Potere e risposta dei nemici.

Prima versione funzionante dell’Atto I: usare le regole operative consolidate al capitolo 26 e le schede qui richiamate. Bilanciamento e rifinitura degli incontri sono rinviati. I valori provvisori restano modificabili attraverso i dati della campagna.

Approvato indica una decisione acquisita; provvisorio indica il valore o comportamento scelto per il prototipo, senza attestazione di bilanciamento. Per l’Atto I il consolidamento 0.25 al capitolo 26 prevale sulle precedenti formule candidate; le proposte degli atti successivi restano separate.

### Decisioni acquisite

Tre atti, nessun calendario, partenza 1 contro 1, eserciti di pari numero, cinque agenti rapidamente e dieci entro fine Atto I, almeno dieci scontri nel primo atto. Le Eminenze arrivano poco dopo l’inizio dell’Atto II. Dopo una sconfitta si può riprovare o riavvolgere temporalmente tre tappe. Nei formati ridotti: 1v1 su Campo Conquista: Vinci la partita; 2–4 con più Campi e poi PV; 5v5 Classico. Élite a dieci e boss introducono squadre successive: FC ripristinati, PV conservati per tutto l’incontro. L’annientamento conclude il nodo anche prima dell’ultima fase.

I prigionieri entrano nell’esercito con identità originale. Dopo una successiva tappa completata possono essere trasformati, a scelta del giocatore, in un Figlio dell’Orizzonte casuale di pari Lega, senza doppioni. Gli eventi Domanda determinano il Potere del Nascente; le possibilità restano aperte fra gli archetipi. Staffetta e Terraformare sostengono l’identità della Concordia.

### Consultazione

Capitoli 2–6: combattimento, mappa e incontri. Capitoli 7–9: distribuzione nei tre atti. Capitoli 10–11: prigionieri e trasformazione. Capitoli 12–15: Nascente, bilanciamento, Campi e Domande. Capitoli 16–22: eventi, piani, Eminenze, risorse e sconfitta. Capitoli 23–26: schermate, editor, verifiche e decisioni aperte.

## 02  Regole comuni di combattimento

Stato: regole operative dell’Atto I consolidate nella 0.25; configurazioni numeriche provvisorie.

Una battaglia è l’intero incontro e può contenere più fasi; ogni fase impiega una squadra. Un duello confronta due agenti su un Campo. Una tappa è un nodo completato, anche narrativo: una fase intermedia non è una tappa. La versione 0.16 introduce il ricambio della mano fra fasi di élite e boss; non introduce pesca libera durante i duelli. Il designer può definire squadre e agenti obbligatori.

La parità numerica fra gli eserciti resta il riferimento. I.1 usa un Campo Conquista: Vinci la partita; I.2–I.4 confrontano Campi e poi PV; il 5v5 segue il Classico. Le mani del giocatore sono casuali. Il blocco candidato 0.21 del capitolo 4 completa risorse, Campi, pareggi, ordinari oltre cinque agenti e ricambio fra le fasi; i numeri restano da provare.

### Esiti e disponibilità

Come riferimento della copia del motore già esaminata: il duello confronta VA, poi Lega inferiore, POT effettiva inferiore e scelta per seconda, salvo eccezioni del Campo. Il Classico prevede annientamento e vittorie territoriali; a mano esaurita confronta PV e poi Campi. Nei formati 2–4 la nuova decisione inverte questo ultimo confronto: prima Campi, poi PV. Il Campo speciale determina l’esito di I.1. L’applicazione delle chiusure anticipate e dei conflitti simultanei ai formati ridotti è precisata come proposta al capitolo 4.

Il Bonus Armata richiede almeno due agenti della stessa armata nella mano iniziale della fase, salvo eccezioni proprie del gioco. Gli agenti del roster esclusi dalla mano e la riserva non contano. La disponibilità si fissa all’avvio della fase; giocare le carte non elimina la coppia. Il Potere personale non richiede questa coppia. Restano distinti disponibilità, trigger e risoluzione effettiva.

Fra incontri si prepara l’esercito. La proposta del capitolo 7 distingue esercito di 6–10 agenti, mano iniziale di cinque e riserva; adotta un budget massimo di 30 Lega da I.5 e include sempre il Nascente. È una scelta di design candidata, non un’estensione automatica delle regole competitive.

### Informazioni e iniziativa

Prima di Affronta sono visibili roster, garanzie nemiche, risorse, buff e lista dei Campi con calendario di rivelazione. Nessuna composizione nemica si adatta alla build. L’iniziativa usa l’apertura standard e poi chi ha perso il duello, come al capitolo 6. La vecchia alternanza per numero di battaglia è superata.

## 03  Mappa tappe e scelte

Stato: Ciclo di campagna confermato; numero di bivi e distribuzione globale proposti.

Il percorso principale è una sequenza di posizioni obbligatorie con sei bivi complessivi nei tre atti. Ogni bivio di piano contiene due battaglie alternative e torna al nodo successivo. Nell’Atto I si aggiungono F1 obbligatoria e F2 opzionale secondo il capitolo 7: F2 può essere saltata e non è un settimo bivio di piano. Non ci sono vicoli ciechi o incontri aggiuntivi casuali.

Ispezionare un nodo non impegna la scelta. Premere Affronta salva il tentativo e blocca quel ramo fino alla vittoria o al riavvolgimento. Una sconfitta non attiva il buff del ramo ignorato. Alla vittoria: premio, esito del piano e avanzamento vengono confermati insieme. F2 costituisce l’eccezione esplicita: dopo un tentativo fallito può essere lasciata per proseguire a I.10; non assegna né risolve un piano.

| Elemento | Si conta come tappa | Ripetibilità |
| --- | --- | --- |
| Battaglia vinta | Sì | Solo dopo ripristino temporale; nessun premio duplicato. |
| Evento autonomo risolto o rifiutato | Sì | Una volta nella linea temporale corrente. |
| Ricompensa o trasformazione di gestione | No | Consumo atomico del premio. |
| Preparazione e diario | No | Liberi fra incontri. |
| Sconfitta e pareggio | No | Nuovo tentativo sul medesimo nodo. |

Una transizione d’atto segue il boss e non aggiunge una tappa. Conserva collezione, evoluzione, scelte narrative e risorse base. Rimuove i buff nemici dell’atto e apre il nuovo percorso. Non esistono giorni né crescita mentre il giocatore riflette.

Il boss finale vinto chiude la campagna. Si salva una conclusione consultabile, con esercito, Nascente, Eminenza e decisioni. Una nuova campagna riparte da 1 contro 1: nessun bonus permanente di potenza viene trasferito.

## 04  Tipi di incontro e ricompense

Stato: formati e procedure adottati come base operativa 0.25; numeri e composizioni restano provvisori. Nessuna implementazione o prova di difficoltà è attestata.

| Tipo | Regola distintiva | Premio e collocazione |
| --- | --- | --- |
| Prologo | 1 contro 1: Campo Conquista: Vinci la partita. Da 2 a 4: più Campi, poi più PV. Nessuna Eminenza. | Un prigioniero e crescita dell’esercito per vittoria; solo I.1–I.4. |
| Ordinario | Profilo Concordia A o R; nessun modificatore di categoria. | Un prigioniero casuale. Posizioni indicate nelle tabelle. |
| Intervento | Battaglia ordinaria con due rami e una coppia di piani. | Un prigioniero; blocca un buff e attiva l’alternativo dopo la vittoria. |
| Élite | Profilo con +2 PV e carta garantita. Se dispone di dieci agenti: due squadre successive da cinque, FC ripristinati fra i match. | Due prigionieri distinti fra cui sceglierne uno. Un normale premio, non due carte. |
| Speciale | Armate esterne: Calibri, Corte Rossa, Apex. Regole e Bonus propri. | Un prigioniero di un’altra armata, trasformabile secondo il capitolo 11. |
| Boss | Carta firma; +4 PV proposti. Dopo il primo match: quattro nuovi agenti e ritorno del boss. Reset FC; dettagli al capitolo 4. | Un prigioniero dal mazzo, esclusa la firma; conclude l’atto. |
| Faglia | Deformazione spaziale attraversata da un’armata maggiore. Può essere obbligatoria o opzionale; appartiene alla categoria speciale, con origine narrativa propria. | F1 e F2 aggiuntive nell’Atto I; un prigioniero dall’esercito affrontato, nessun posto aggiunto. Schede nel capitolo 7. |

### Formati ridotti e incontri a squadre

La versione 0.16 sostituisce la vecchia fase boss da +2 FC dopo il secondo duello. Il boss ora ha una seconda squadra: quattro agenti nuovi e il ritorno della carta firma. L’élite con dieci agenti passa invece alle altre cinque carte dopo il primo match. Gli FC si resettano fra le fasi; i PV si conservano (decisione 0.17). Condizioni di passaggio e ricostruzione dei Campi seguono le precisazioni qui sotto; non si sommano i due modelli di fase.

Firme candidate: boss I N01 Cavaliere Nero della Corona Vuota, coerente con le due squadre I.12; boss II R03 Maresciallo della Livrea Rossa; boss III N01. I ruoli degli atti successivi restano da rivedere. Una firma occupa un posto normale e non compare nel premio del proprio boss; può essere ottenibile in altri incontri che la includono.

Intervento è una proprietà del nodo; in questa prima distribuzione è associata soltanto a ordinari. Élite e speciali non interrompono contemporaneamente un piano. Questa separazione permette di valutare rischio, premio e strategia senza sommare più regole nuove nello stesso incontro.

L’IA ordinaria usa il profilo Normale del motore, l’élite e il boss Difficile. La distinzione riguarda la qualità delle scelte, senza accesso a informazioni private. Le impostazioni vanno fissate nella versione dei dati della campagna.

### Vittoria nei primi cinque formati

Decisione 0.16. La progressione iniziale modifica il criterio di vittoria della battaglia senza riscrivere il confronto fra agenti. I roster I.1–I.6 restano quelli concordati. Il passaggio al Classico avviene con cinque agenti per lato; non richiede che il giocatore abbia già un’Eminenza.

| Formato | Criterio di vittoria stabilito |
| --- | --- |
| I.1  1 contro 1 | Un Campo speciale con testo «Conquista: Vinci la partita». |
| I.2  2 contro 2 | Vince chi ha conquistato più Campi; a parità di Campi, chi ha più PV. |
| I.3  3 contro 3 | Stesso criterio: prima Campi, poi PV. |
| I.4  4 contro 4 | Stesso criterio: prima Campi, poi PV. |
| I.5 e I.6  5 contro 5 | Regole del duello Classico, incluse le sue condizioni di chiusura. |

Campo del primo incontro: Il primo varco, nome proposto. È l’unico Campo disponibile in I.1, rivelato dall’inizio. La Conquista assegna la vittoria al lato che conquista quel Campo, anche se è il nemico. L’effetto appartiene al Campo e non al Potere della Picca o del Nascente. Blocca Potere o Blocca Bonus non lo annullano per il solo fatto di bloccare un agente. Per ora il Campo è esclusivo di I.1 e non entra nella pool di Terraformare.

Esempio I.1: il vincitore del confronto conquista Il primo varco e il suo effetto conclude la battaglia. Nessun confronto dei PV assegna un vincitore diverso, salvo la precedenza dello zero PV proposta nel blocco 0.21. Se il confronto ordinario non produce un vincitore, nessuno conquista il Campo: la mano esaurita produce un pareggio. Nessun premio supplementare proviene dal Campo.

Precisazione proposta per 2–4: al termine della mano si confrontano i Campi conquistati e soltanto in caso di uguaglianza i PV. Se anche i PV coincidono, la battaglia è un pareggio e segue il retry ordinario. Un 2–1 sui Campi vince anche con meno PV; un 1–1 si decide con i PV. La priorità Campi non modifica lo spareggio del singolo duello.

Proposta 0.21 per 2–4: nessuna Reklamazione o Supremazia. Si gioca fino a mano esaurita, salvo annientamento. Lo zero PV chiude anticipatamente l’incontro; se entrambi sono a zero nello stesso controllo terminale, è pareggio. Con entrambi vivi, prevalgono i Campi e poi i PV. Anche un vantaggio territoriale ormai irraggiungibile non tronca automaticamente la mano.

Il primo incontro insegna puntata, confronto e conquista. I.2 introduce Campi e seconda carta; I.3–I.4 aggiungono Poteri e scelte di Campo. I.5 segnala il passaggio al Classico. La configurazione seguente propone valori completi per provare questa progressione, senza renderli già bilanciati.

### Configurazione candidata degli incontri

La 0.25 adotta questa configurazione per il prototipo. Valori e composizioni potranno cambiare nella successiva rifinitura; non occorre attendere il bilanciamento per implementare le procedure.

| Nodo | Mano e PV / FC base | Campi proposti |
| --- | --- | --- |
| I.1 | 1 agente; 10 PV / 10 FC | Il primo varco, visibile dall’inizio. Conquista: Vinci la partita. |
| I.2 | 2 agenti; 10 PV / 10 FC | Cripta dei Sussurri e Torre d’Avorio; entrambi visibili dal round 1. |
| I.3 | 3 agenti; 10 PV / 10 FC | Come I.2, più Altopiano delle Tre Lune; tutti visibili dal round 1. |
| I.4 | 4 agenti; 10 PV / 10 FC | Primi tre come I.3. Quarto: Miniera di Lacrime, rivelata al round 3. |
| Da I.5 | 5 in mano; 25 PV / 18 FC | Classico e configurazione dichiarata dal nodo. I.8 e I.11: +2 PV nemici; I.12: +4 PV nemici. |

Risorse base uguali per entrambi i lati, poi modificatori dichiarati. I primi quattro scontri mantengono 10/10 per insegnare il formato senza ulteriori gradini; dal quinto si prova la base Classica 25/18. La crescita di risorse è distinta dall’aumento dei posti. Nessuna Eminenza nel primo atto.

Campi di catalogo: Cripta dà +1 FC al perdente; Torre d’Avorio +1 FC su Conquista; Altopiano −1 POT e +1 DAN a entrambi; Miniera +2 PV su Conquista. I nuovi Campi dell’Atto I sono Il primo varco e Torre del Richiamo. La Torre del Richiamo entra nella distribuzione da I.5. Rivelare rende selezionabile; non impone la scelta.

Formati e pareggi: I.1 si conclude con il Campo vittoria; se non c’è conquista, pareggio a mano esaurita. I.2–I.4 confrontano Campi, poi PV, poi pareggio. Da cinque agenti si conserva il Classico, con PV poi Campi al termine della mano. In tutti i casi si propone la precedenza dello zero PV descritta sotto; nessuno spareggio altera quello del singolo duello.

Controlli prima del bilanciamento: due agenti occupano due posti e quattro ne occupano quattro; il quarto Campo di I.4 è disponibile dal terzo round. Negli incontri a due fasi con dieci agenti il giocatore riceve cinque carte e poi le cinque escluse, anche se alcune della prima mano non sono state giocate. Non può scegliere i gruppi né ricevere una copia aggiuntiva del Nascente.

### Élite e avvicendamento delle squadre

Direzione 0.16: un’élite con dieci agenti disputa due match consecutivi. Il primo usa cinque carte; al termine, quelle carte lasciano la mano e arrivano le altre cinque. Gli FC si resettano. Il modello supporta squadre successive definite per incontro; non consente ancora di inserire agenti di supporto in risposta a una giocata o a metà duello.

Decisione 0.20: le mani del giocatore sono casuali anche negli incontri a due squadre. La prima contiene cinque agenti; nella seconda entrano gli altri cinque dell’esercito. Il Nascente resta garantito nella prima mano secondo la regola già proposta. Il giocatore prepara l’esercito, ma non assegna gli agenti alle fasi. Le squadre nemiche possono essere definite dall’incontro; per I.12 resta candidata la composizione riportata sotto.

Decisione 0.18: annientare il nemico conclude l’intero nodo con il premio finale; a zero PV il giocatore perde e nessuna squadra lo salva. Con il nemico ancora vivo, vincere il primo match avvia la seconda fase; il boss ritorna solo allora. Il blocco 0.21 propone pareggio per doppio zero, nessun avanzamento su sconfitta o pareggio e retry dell’intero nodo. Al ricambio tutta la mano precedente è esaurita, anche le carte non giocate. Senza annientamento, serve vincere l’ultima fase.

| Elemento al cambio fase | Regola o stato |
| --- | --- |
| Mano | Rimuovere tutta la squadra precedente e rendere disponibile quella successiva. Non aggiungere carte alla vecchia mano. |
| FC | Reset confermato; proposta 0.21: 18 FC base a ogni fase, +2 per Riserve nemiche. Preparazione FC solo nella prima fase; nessun accumulo del saldo precedente. |
| PV | Conservazione confermata (0.17): entrambi i lati mantengono i PV residui. Il cambio squadra non cura, non ripristina la base e non riapplica aumenti iniziali. |
| Campi e round | Nuovo set previsto dalla fase, conquiste azzerate, round locale 1. Slot 4 al round 3 e slot 5 al round 4. |
| Bonus e memoria | Disponibilità Bonus ricalcolata sulla mano della nuova fase. Memoria di Staffetta azzerata; si applica la clausola del primo duello. |
| Premi e maturazione | Una sola ricompensa e una sola tappa per il nodo intero. Nessun prigioniero o maturazione al passaggio di fase. |

Lo schieramento di supporto arriva immediatamente dopo la risoluzione del match, con una presentazione breve saltabile. Nessun accesso intermedio a riserva, trasformazioni o eventi. Salvare fase raggiunta, squadre esaurite e risorse impedisce che riaprire il gioco duplichi il ricambio. Eventuali effetti permanenti di campagna restano distinti dagli effetti temporanei del match.

Proposta 0.21: ogni fase riparte da 18 FC base; Riserve aggiunge +2 FC nemiche in entrambe. Corazze (+2 PV) e il +4 PV boss valgono solo all’apertura. Assalto e Tenuta si riarmano una volta per fase. Preparazione applica FC o PV solo all’inizio del nodo; i PV rimasti si conservano, le FC residue sono sostituite dal reset. Il beneficio non si ripete; il consumo definitivo resta alla vittoria del nodo.

### Il ritorno del boss e le squadre di supporto

Il boss dispone di cinque carte nel primo match; nel secondo tornano disponibili la sua carta e quattro agenti nuovi. La carta firma è la stessa identità: non è un doppione della collezione, non si duplica nella pool delle ricompense e non crea un secondo comandante. Si propone di ripulirla dagli effetti temporanei del primo match, conservando il suo profilo di campagna; il ritorno non aggiunge POT, DAN o immunità.

Per I.12 la firma candidata è N01, con G03 nella prima squadra secondo la composizione fissa qui proposta. G03 non torna nella seconda. Ogni schieramento comprende cinque carte: nella seconda sono N01 e quattro nuovi agenti, senza superstiti aggiunti. L’ordine di gioco rimane libero per l’IA.

Conteggio da rendere esplicito: 5 carte nella prima squadra e 4 nuove nella seconda usano 9 identità avversarie, con N01 giocabile in entrambe. Per mantenere il roster I.12 da dieci e la parità degli eserciti, si propone che una delle cinque carte escluse dalla prima squadra resti fuori anche dalla seconda. Le altre quattro sono fissate prima dell’avvio insieme alle squadre, senza adattamenti al giocatore. La decima identità resta parte del roster dichiarato e segue la normale eleggibilità ai premi, anche se non interviene; N01 resta escluso come firma.

Configurazione candidata 0.21: mantenere il roster boss da dieci identità. V02 resta escluso dalle mani ma eleggibile ai premi; N01 occupa un posto in entrambe le fasi. Il giocatore utilizza le sue dieci identità senza ripetizioni fra le mani: nessun ritorno automatico del Nascente. Esaurire una mano include le eventuali carte non giocate.

| Nodo del primo atto | Agenti per esercito | Applicazione della nuova struttura |
| --- | --- | --- |
| I.8  Élite | 6 | Una fase: non raggiunge la soglia di dieci. |
| I.11  Élite | 9 | Una fase: non raggiunge la soglia di dieci. |
| I.12  Boss | 10 | Due squadre da cinque; N01 ritorna nel secondo match. Procedura proposta sopra. |

Con questa distribuzione è il boss a introdurre l’avvicendamento nel primo atto. Portare una delle due élite a dieci agenti richiederebbe anticipare anche la crescita del giocatore o cambiare la parità: non viene fatto automaticamente. Le élite a dieci dei successivi atti potranno usare due squadre completamente diverse, senza ritorno della firma.

Struttura estendibile: ogni fase dichiara politica delle mani, eventuali richiami, Campi, risorse e condizione di avanzamento. Il giocatore conserva la distribuzione casuale; il designer può fissare le squadre nemiche. Per l’Atto I il blocco 0.21 propone al massimo due fasi, annunciate prima di Affronta. Ulteriori fasi richiedono una valutazione separata e non aggiungono carte alla mano corrente.

### Mani casuali negli incontri a due squadre

Decisione 0.20: il giocatore sceglie i dieci agenti dell’esercito, ma la loro distribuzione nelle mani è casuale. Con il Nascente garantito all’apertura secondo la proposta esistente, la prima mano comprende altri quattro agenti estratti dai nove rimanenti. La seconda comprende i cinque esclusi dalla prima. Non si sceglie chi conservare per la fase successiva. Il tetto candidato di 30 Lega riguarda l’intero esercito.

La mano propria si rivela all’avvio della fase. Prima di Affronta sono visibili esercito, probabilità e Bonus possibili, senza assegnazione manuale dei gruppi. I Bonus disponibili si calcolano sulla mano effettiva: due Concordia distribuiti fra le fasi non formano una coppia. Gli agenti in riserva non entrano al ricambio; l’ordine delle giocate resta libero durante ciascuna fase.

Per I.12 propongo squadre nemiche fisse e visibili prima di Affronta. La loro composizione non cambia in base al Nascente o al tentativo. L’IA sceglie ordine, puntate e Campi. I nomi e i Poteri sono quelli del catalogo di campagna del capitolo 5.

| Schieramento | Agenti del boss | Lega |
| --- | --- | --- |
| Prima squadra | N01 Cavaliere Nero; G03 Seconda Campana; G01 Portastendardo; V01 Scudiero; V05 Cavaliere della Campana. | 15 |
| Seconda squadra | N01 Cavaliere Nero; G02 Duellante; R01 Breccia; R02 Giustiziere; V04 Guardia. | 18 |
| Fuori dalle due mani | V02 Picca: resta nel roster di dieci e nella normale pool del premio; non interviene. | 2 |

La prima squadra combina Staffetta, recupero FC e Terraformare. La seconda concentra DAN e controllo di POT, VA e Potere nemico. G03 non torna: il sabotaggio resta significativo e la Torre naturale, proposta nello slot 4 rivelato al round 3 di ciascuna fase, conserva la sua funzione.

Sono nove identità schierate e dieci presenze: il solo N01 ritorna. Il roster vale 30 Lega; le presenze valgono 33 perché V02 resta fuori e N01 conta due volte. Il ritorno non crea una seconda copia ottenibile. La pool dei premi resta quella del roster, con l’esclusione della firma già proposta.

La casualità non applica correzioni nascoste alla Lega o alla distribuzione delle armate fra le mani. Il bilanciamento deve considerare anche estrazioni sfavorevoli contro la seconda squadra nemica da 18 Lega, mantenendo i PV residui della prima fase. Se il confronto risulta eccessivo, si rivede la composizione nemica prima di aggiungere risorse.

### Esiti e passaggio alla squadra successiva

Proposta consolidata 0.21. A ogni controllo terminale si valutano prima i PV dei due lati insieme: doppio zero significa pareggio; un solo lato a zero perde. Se entrambi vivono si applica la vittoria del formato. Negli incontri a fasi una vittoria territoriale effettiva, compresa la scelta di Reklamazione del Classico, passa alla fase successiva soltanto se prevista.

| Esito rilevato | Conseguenza proposta |
| --- | --- |
| Solo nemico a zero PV | Vittoria dell’intero nodo, premio finale una sola volta. Nessun ritorno del boss e nessun cambio squadra. Regola acquisita. |
| Solo giocatore a zero PV | Sconfitta dell’intero incontro. Nessuna riserva lo salva. Regola acquisita. |
| Entrambi a zero nello stesso controllo | Pareggio dell’incontro; nessun premio, avanzamento o fase successiva. Proposta simmetrica. |
| Vittoria del primo match; entrambi vivi | Seconda squadra, PV residui conservati e FC ripristinati. Nessun premio intermedio. |
| Sconfitta o pareggio del primo match | Non si passa alla seconda fase. La sconfitta segue retry o riavvolgimento; il pareggio segue retry. |
| Vittoria dell’ultima fase; entrambi vivi | Nodo completato e premio finale. Stesso avanzamento e stessa pool dell’annientamento anticipato. |

La precedenza dei PV vale anche se lo stesso controllo rileva una vittoria territoriale o del Campo Il primo varco. Non crea un nuovo timing per i danni: gli effetti seguono le proprie finestre. Un esito già terminale ferma la risoluzione; non si eseguono effetti successivi per curare, uccidere o trasformarlo in un pareggio. Se nessuna condizione terminale è soddisfatta, il match prosegue.

Proposta 0.21: nuovo set dei cinque Campi del capitolo 6, conquiste zero e round locale 1 per ogni fase del boss; tre Campi visibili, quarto al round 3 e quinto al round 4. I Bonus si ricalcolano sulla nuova mano. Staffetta riparte senza agente precedente, con la propria clausola del primo duello. Terminano effetti e modifiche limitati al match; restano forme e modifiche permanenti di campagna. L’iniziativa segue l’apertura normale.

Il retry riparte dall’apertura del nodo, anche dopo una sconfitta nella seconda fase. Ripristina risorse, Preparazione e configurazione nemica; il giocatore può riorganizzare l’esercito, ma non scegliere le due mani. Resta proposta l’estrazione deterministica del capitolo 7: stessa composizione e stesso seme producono gli stessi gruppi. Riaprire un salvataggio conserva fase, mani e risorse; il pareggio non matura prigionieri né consuma Preparazione.

Riscontro locale: projectPostDuelState.js riconosce draw_hp quando entrambi sono a zero. Nel controllo di Codice/satze.jsx, invece, i Campi precedono i PV e il controllo dei PV del giocatore precede quello nemico. Questa divergenza richiede allineamento; la proposta non è già implementata. campaignEncounterSetup.js genera una mano da cinque con una sola carta garantita: non gestisce ancora le due squadre qui descritte.

## 05  Concordia di Caelion e Staffetta

Stato: Identità e Bonus di design acquisiti; valori del roster da bilanciare.

La Concordia discende dai Resistenti alla Fusione. Difende identità, memoria, legami e continuità delle persone. Il suo esercito usa il coordinamento degli agenti e la capacità di riprendere una sequenza interrotta. I nomi e i valori seguenti sono il roster di design della campagna, non una certificazione dell’implementazione corrente.

Staffetta: +1 POT. Il trigger è soddisfatto al primo duello oppure se il proprio agente del duello precedente ha effettivamente attivato il suo Bonus Armata. Si considera il precedente agente del proprio lato, anche di un’altra armata. Non basta vincere né soddisfare una condizione quando il Bonus è bloccato, sostituito o annullato.

Il beneficio riguarda l’agente corrente e non cresce cumulativamente lungo la catena. Il Bonus corrente deve essere disponibile e superare i normali blocchi. La Torre del Richiamo può rendere soddisfatto Staffetta; non concede da sola disponibilità o immunità ai blocchi.

### Roster

| Codice | Agente | L | POT DAN | Potere |
| --- | --- | --- | --- | --- |
| V01 | Scudiero del Vallo | 2 | 3 / 1 | Staffetta: +3 VA |
| V02 | Picca delle Porte | 2 | 2 / 2 | Resistenza: +2 POT |
| V03 | Balestriere delle Mura | 2 | 3 / 1 | Imboscata: 2 danni diretti |
| V04 | Guardia del Fossato | 2 | 3 / 1 | Turbo: -2 DAN nem. (min 1) |
| V05 | Cavaliere della Campana | 2 | 3 / 2 | Staffetta: +1 DAN |
| V06 | Portascudo di Caelion | 2 | 2 / 2 | Intervento: -2 POT nem. (min 2) |
| G01 | Portastendardo dell’Aurora | 3 | 4 / 2 | Conquista: +1 FC |
| G02 | Duellante del Sole Pallido | 3 | 4 / 2 | Sfida: +2 POT |
| G03 | Cavaliere della Seconda Campana | 3 candidata | 3 / 3 | Resistenza: Terraformare Torre del Richiamo |
| G04 | Reliquiario Errante | 3 | 3 / 2 | Ultimo desiderio: Cura 3 |
| R01 | Cavaliere della Breccia | 4 | 5 / 3 | Resistenza: +2 DAN |
| R02 | Giustiziere del Vespro | 4 | 4 / 4 | Intervento: -5 VA nem. (min 6) |
| R03 | Maresciallo della Livrea Rossa | 4 | 5 / 2 | Gloria: +2 POT |
| N01 | Cavaliere Nero della Corona Vuota | 5 | 5 / 4 | Intervento: Blocca Potere |
| N02 | Custode del Primo Sole | 5 | 5 / 4 | Resistenza: +2 POT, +2 DAN |

Il Portascudo conserva Intervento: −2 POT nemica, minimo 2. Non riceve un Potere inventato per riattivare il Bonus. Il Cavaliere della Seconda Campana conserva il corpo 3/3; la sua Lega 3 deve essere rivalutata dopo la sostituzione del Potere.

Resistenza richiede che l’avversario abbia conquistato almeno un Campo. Intervento richiede di scegliere per secondi. Conquista e Ultimo Desiderio si risolvono dopo l’esito. Il trigger Staffetta può essere impiegato in un Potere, senza trasformarlo in un’Eminenza.

## 06  Composizioni e agenti obbligatori

Stato: composizioni fisse dei primi sei incontri; I.5 e I.6 restano 5 contro 5. Dopo I.6 l’esercito cresce a sei identità e la mano rimane di cinque.

L’editor permette una mano interamente definita oppure presenze obbligatorie e completamento con varianti ammesse dell’incontro. Le carte obbligatorie occupano posti normali, rispettano la parità numerica e non stabiliscono l’ordine di gioco. La composizione iniziale non introduce pesca.

| Incontro | Composizione confermata | Funzione |
| --- | --- | --- |
| I.1 Primo contatto | V02 Picca delle Porte | 1 contro 1; Resistenza inizialmente falsa e nessuna coppia per il Bonus. |
| I.2 Pattuglia | V01 Scudiero e V04 Guardia | 2 contro 2; prima armata Concordia con Bonus disponibile. |
| I.3 Presidio | V02 Picca, V03 Balestriere, V06 Portascudo | 3 contro 3; prova delle risposte e della composizione mista. |
| I.4 Posto di blocco | V01 Scudiero, V03 Balestriere, V04 Guardia, V05 Cavaliere della Campana | 4 contro 4; dopo la vittoria si sbloccano cinque posti. La proposta del capitolo 10 garantisce le identità necessarie. |
| I.5 | V01 Scudiero, V02 Picca, V03 Balestriere, V04 Guardia, V05 Cavaliere della Campana | 5 contro 5; prova del primo Potere. Nessun Terraformare. Premio: un nemico casuale, doppione Concordia in riserva; restano cinque posti. |
| I.6 | V01 Scudiero, V02 Picca, V04 Guardia, V05 Cavaliere della Campana, G03 Cavaliere della Seconda Campana | 5 contro 5; G03 sostituisce V03 e introduce Terraformare. Premio dal roster, poi sei posti nell’esercito e mano sempre di cinque; eventuale rinforzo di crescita. |

Nessun evento fra I.1 e I.2. Il primo prigioniero entra subito nell’esercito; completa la successiva tappa con I.2 e può allora essere trasformato. Il suo reclutamento non attiva automaticamente il Bonus dei Figli dell’Orizzonte.

Nel sesto incontro il Cavaliere è disponibile inizialmente qualunque sia l’archetipo del Nascente. La trasformazione del Campo richiede condizioni e risoluzione del Potere valide. Essere obbligatorio nella composizione non lo rende un premio garantito.

I profili A e R restano segnaposto per gli incontri successivi. I.1–I.6 usano le composizioni fisse di questa tabella, indipendentemente dal Potere del Nascente. Non sono ordini di giocata imposti all’IA. Le varianti potranno essere progettate dopo aver valutato la sequenza comune.

### Preparazione e obiettivo dei due incontri

I.5 permette di sperimentare il Potere ottenuto nella prima Domanda. La lista dei Campi deve preservare questa possibilità ed escludere la disattivazione globale dei Poteri. I.6 cambia una sola carta nemica: il Cavaliere della Seconda Campana sostituisce il Balestriere. La presenza di G03 è certa; Resistenza, blocchi e risoluzione ordinaria determinano se Terraformare avviene davvero. La Torre soddisfa Staffetta senza superare l’indisponibilità o un blocco del Bonus.

In I.5 e I.6 sono previsti cinque agenti per lato. La quinta ricompensa può offrire una sostituzione oppure una copia Concordia in riserva; dopo I.6 si sbloccano sei posti. La proposta Crescita garantita del capitolo 10 raccorda premi e identità disponibili. Non si introduce pesca.

### Ricompense e copie in riserva

In entrambi gli incontri si ottiene un agente casuale della composizione nemica. Gli agenti Concordia già posseduti restano eleggibili: la nuova copia va in riserva. G03 è eleggibile in I.6 senza garanzia di estrazione. La trasformazione rimane facoltativa, di pari Lega e senza doppioni fra i Figli, dopo una tappa successiva completata.

Il precedente conteggio di 24 sequenze è superato. La proposta del capitolo 10 mantiene il premio casuale e aggiunge un rinforzo soltanto se serve a coprire il nuovo posto. I totali di copie dipendono quindi dai premi ottenuti; la disponibilità di identità distinte va verificata separatamente dalla Lega e dall’equilibrio delle battaglie.

### Blocco di progetto per I 5 e I 6

Proposta 0.8 da valutare come blocco unico. Le composizioni e i premi già approvati restano acquisiti; i Campi, le risorse e le impostazioni qui sotto sono la configurazione candidata per il primo test. Non sono risultati di una simulazione.

I due incontri condividono preparazione e ambiente. In I.5 si prova il primo Potere del Nascente contro la Concordia; I.6 introduce G03 al posto del Balestriere. La sostituzione aumenta il corpo complessivo del roster da 14 POT / 7 DAN a 14 POT / 9 DAN prima dei Poteri e dei Bonus: è già una crescita di pressione, pur mantenendo cinque agenti.

| Parametro | I.5 e I.6 |
| --- | --- |
| Formato | Cinque agenti iniziali per lato, fino a cinque duelli. Nessuna pesca o sostituzione durante la battaglia. |
| Risorse iniziali | 25 PV e 18 FC per lato, ripristinati a ogni battaglia. Riferimento: configurazione Classica locale; valori candidati per la campagna. |
| Modificatori | Nessun incremento aggiuntivo di PV, FC, POT o DAN per la categoria Ordinario. Eventuali piani di percorso devono essere mostrati separatamente. |
| Eminenze e IA | Nessuna Eminenza. IA Normale per entrambi gli incontri; nessun ordine obbligatorio di giocata. |
| Iniziativa | Apertura secondo la regola standard; dal duello seguente inizia chi ha perso, come nel risolutore locale. Nessuna alternanza speciale fra I.5 e I.6. |
| Preparazione | Mostrare roster nemico, Campi, risorse e modificatori prima di Affronta. Confermare cinque agenti posseduti. Cambiare composizione non completa una tappa. |

### Campi condivisi e rivelazione

Una lista fissa permette di capire l’effetto di Terraformare. La rivelazione rende un Campo selezionabile; non impone di combattervi in quel round. I Campi restano soggetti alle normali regole di scelta e conquista. Consultare la lista in anteprima non rende giocabile un Campo ancora nascosto.

| Slot | Campo ed effetto | Rivelazione |
| --- | --- | --- |
| 1 | Cripta dei Sussurri — ID 8. Post-scontro: il perdente ottiene +1 FC. | Inizio round 1 |
| 2 | Torre d’Avorio — ID 12. Conquista: +1 FC. È distinta dalla Torre del Richiamo. | Inizio round 1 |
| 3 | Altopiano delle Tre Lune — ID 2. In scontro: entrambi −1 POT, +1 DAN. | Inizio round 1 |
| 4 | Torre del Richiamo — nuovo Campo di campagna. Regola: Staffetta è soddisfatto per entrambi. Disponibilità e blocchi restano validi. | Inizio round 3 |
| 5 | Miniera di Lacrime — ID 4. Conquista: +2 PV. | Inizio round 4, proposto |

Il quarto Campo al terzo round è la correzione esplicita del giocatore. Il quinto al quarto round completa questa proposta. Nei primi due round non è possibile selezionare la Torre naturale. Non si aggiungono Campi, ricompense o rivelazioni se la battaglia termina prima.

La copia locale parte da tre Campi rivelati e ne aggiunge uno dopo ogni duello: renderebbe disponibile lo slot 4 al round 2. Il design di campagna richiede quindi un calendario di rivelazione per slot, distinto dal parametro minTurn usato dal selettore. Occorre allineare interfaccia, mosse legali dell’IA e salvataggi prima di implementare queste schede. Questa verifica non certifica lo stato del repository remoto.

Cripta e Torre d’Avorio offrono recuperi di FC diversi; l’Altopiano modifica il valore di POT e DAN; la Miniera rende utile una conquista anche per il saldo finale dei PV. Nessuno di questi Campi disattiva globalmente Poteri o Bonus, concede immunità ai blocchi o moltiplica il Focus. La Torre può favorire anche il giocatore che conserva agenti Concordia.

### Terraformare e possibilità di risposta

I.6 mantiene una sola Torre naturale e un solo G03 nemico. G03 può trasformare prima della rivelazione naturale, ma soltanto quando Resistenza è soddisfatto e il Potere supera i blocchi. Se gioca al primo duello, in assenza di altre eccezioni, Resistenza è falso. Se il giocatore ha conquistato un Campo, G03 diventa una minaccia da considerare, senza essere obbligato a giocare subito.

La trasformazione usa il timing ordinario pre-esito descritto nel capitolo 14. Sull’Altopiano cessano i contributi continui del Campo sostituito; su Cripta e Torre d’Avorio non si ottiene il premio futuro del vecchio Campo. La Torre rende soddisfatto Staffetta prima del controllo dei Bonus ancora da risolvere, senza ricalcolare Poteri già processati. Trasformare una Torre del Richiamo già attiva non ripete un’entrata.

Un Blocca Bonus valido impedisce comunque quel Bonus anche sulla Torre. Se il Bonus resta non attivato, l’agente successivo non riceve una precedente attivazione fittizia: deve soddisfare Staffetta secondo le regole effettive. Bloccare il Potere di G03 impedisce Terraformare. Il giocatore può inoltre conquistare la Torre una volta rivelata; non si garantisce al nemico la sua disponibilità nel momento preferito.

### Conclusione e ricompensa

I.5 e I.6 usano il Classico: Reklamazione ai round 3–4 e Supremazia dal quinto; a mano esaurita PV, poi Campi, poi pareggio. La precedenza dei controlli terminali è quella unica del capitolo 4, adottata nella 0.25. Proseguire dopo aver rinunciato alla Reklamazione non concede premi aggiuntivi. L’interfaccia e il risolutore devono applicare lo stesso esito.

La ricompensa dipende dalla vittoria della battaglia e proviene dalla composizione nemica iniziale, anche se alcuni agenti non sono stati giocati: G03 resta eleggibile in una vittoria anticipata. Il premio ordinario è un solo agente; in I.6 la proposta Crescita garantita può aggiungere il rinforzo del capitolo 10. I doppioni Concordia entrano in riserva; non si estraggono carte assenti dall’esercito affrontato.

Per il primo test isolato nessun piano è applicato. Nella campagna il bivio P1 di I.5 resta candidato: il suo eventuale buff scatta dopo la vittoria e va mostrato fra i modificatori di I.6. Non si assorbe quel buff nei valori base e non si descrive il confronto con piani attivi come equivalente alla prova isolata.

### Verifica del blocco

Provare i due incontri con lo stesso esercito e lo stesso Potere, poi con le otto famiglie di pacchetti e con eserciti misti. Registrare vittoria per PV o Campi, round conclusivo, saldo FC, attivazioni di Staffetta, blocchi riusciti e uso di G03. Le priorità sono: il primo Potere deve offrire una scelta utile in I.5; il sabotaggio deve rimanere incisivo in I.6; la ripartenza della Concordia deve dipendere da una giocata valida. Non serve che Terraformare si attivi in ogni partita.

Accettazione funzionale: Torre naturale non selezionabile prima del round 3; nessuna selezione di Campi nascosti da parte dell’IA; G03 bloccato non trasforma; Torre non supera Blocca Bonus; un Campo trasformato non duplica premi; retry e riavvolgimento ripristinano la stessa configurazione. Il controllo numerico del roster e la lettura del codice non sostituiscono questi test.

## 07  Atto 1 distribuzione degli incontri

Stato: sei roster iniziali, prima Domanda, debutto di Terraformare e crescita dopo I.6 approvati. Faglie come deformazioni spaziali delle armate maggiori e introduzione obbligatoria più incontro opzionale sono accolti. Collocazione, avversari e dettagli operativi seguenti sono proposte.

La spina dell’atto mantiene dodici battaglie contro la Concordia e quattro eventi. Si aggiungono F1 obbligatoria e F2 opzionale: tredici battaglie necessarie, quattordici con la deviazione; rispettivamente diciassette e diciotto tappe completabili. Gli ID I.1–I.12 identificano la spina, non il conteggio cronologico comprensivo delle Faglie. Le ricompense Faglia non sbloccano posti.

| Batt. | Incontro | Profilo o piano | Premio | Evento subito dopo |
| --- | --- | --- | --- | --- |
| 1.1 | Prologo | I.1 | Crescita 1→2 | — |
| 1.2 | Prologo | I.2 | Crescita 2→3 | — |
| 1.3 | Prologo | I.3 | Crescita 3→4 | — |
| 1.4 | Prologo | I.4 | Crescita 4→5 | E01 Acquisizione |
| 1.5 | Ordinario e piano | I.5 fisso · P1 candidato | Un agente; 5 posti invariati | — |
| 1.6 | Ordinario | I.6 fisso con G03 | Un agente; posti 5→6 | E02 Stat I |
| 1.7 | Ordinario | 6 / 5 | Riserva | — |
| 1.8 | Élite | 6 / 5 | Crescita 6→7 | E06 Prigionieri |
| 1.9 | Ordinario e piano | 7 / 5; P2 | Crescita 7→8 | — |
| 1.10 | Ordinario | 8 / 5 | Crescita 8→9 | — |
| 1.11 | Élite | 9 / 5 | Crescita 9→10 | E03 Effetto I |
| 1.12 | Boss | 10 carte; 2 fasi (cap. 4) | Riserva | Fine Atto I |

Faglie aggiuntive: I.6 → E02 → F1 obbligatoria → I.7; I.9 → scelta fra F2 e prosecuzione diretta → I.10. E06 resta dopo I.8, E03 dopo I.11. Aprire la scheda di F2 o rinunciare non conta come tappa; vincerla sì.

Nella colonna Profilo, N / 5 indica esercito di N carte e mano di cinque nella proposta 0.11. I bivi in I.5 e I.9, E02, E06 ed E03 restano distribuiti come in tabella; E01 dopo I.4 è confermato. Il capitolo 10 raccorda posti e ricompense. Il blocco seguente propone eserciti di 6–10 agenti e mani di cinque per I.7–I.12, con roster e risorse espliciti.

Ordine esatto: ogni riga è una battaglia; l’evento della stessa riga, se presente, è la tappa successiva prima della prossima battaglia. Le transizioni e l’epilogo non contano come eventi aggiuntivi. Le alternative A/R di un bivio occupano la stessa posizione e offrono lo stesso tipo di premio.

Per il prototipo, I.5 e I.6 usano le schede del capitolo 6, con P1 in I.5. Crescita, quattro eventi e Faglie seguono il presente capitolo e il capitolo 10. I.5 esclude Campi che disattivino globalmente i Poteri. I due rami P1 conservano il medesimo roster: cambia il piano impedito.

### Esercito e mano nella seconda metà dell’atto

Proposta consolidata 0.21: con esercito di 6–10 identità, ordinari e Faglie usano una sola mano casuale da cinque e al massimo cinque duelli. Le carte escluse non entrano dopo. Élite con meno di dieci agenti: una fase; con dieci: due mani complementari. I.12 usa due fasi con ritorno boss, secondo il capitolo 4. Nessuna fase extra viene creata dal solo possesso di dieci agenti o dalle copie in riserva.

| Elemento | Regola proposta |
| --- | --- |
| Collezione e riserva | Tutte le copie possedute; la riserva non ha un limite in questo blocco. I doppioni Concordia sono conservati con ID individuali. |
| Esercito della missione | Esattamente N identità diverse, N uguale per entrambi i lati. Il giocatore include il Nascente e sceglie le altre dalla collezione prima di affrontare il nodo. |
| Mano iniziale | Fino a quattro agenti: l’intero esercito. Da cinque: Nascente e quattro estratti uniformemente dagli altri. Boss: nella seconda fase entrano i cinque esclusi; nessuna scelta manuale delle mani. |
| Durante la battaglia | Nessuna pesca libera nei duelli. Ogni agente si gioca al massimo una volta per fase. Negli incontri a squadre la mano cambia fra fasi; ritorno della firma solo dove dichiarato. |
| Bonus Armata | La disponibilità deriva dalle coppie nella mano iniziale, poi valgono i trigger e i blocchi normali. Agenti rimasti fuori mano o in riserva non abilitano il Bonus. |

Le garanzie occupano posti nei cinque e non aggiungono carte. L’ordine di gioco rimane una decisione dell’IA. Nelle fasi successive valgono le assegnazioni del capitolo 4: un agente obbligatorio all’apertura non ritorna automaticamente. Il numero di carte dell’esercito nemico non aumenta perché il giocatore possiede altre copie in riserva. Crescita garantita riguarda i posti dell’esercito, non carte aggiunte durante un duello.

La mano viene fissata per missione, seme e composizione ordinata per ID. Stessa composizione e stesso stato producono la stessa mano; cambiare soltanto l’ordine delle carte o riaprire la schermata non la rigenera. Un retry può permettere una diversa composizione, ma roster e garanzie nemiche non si adattano al Nascente. La mano propria si scopre all’avvio; prima sono visibili esercito, probabilità e Bonus possibili. La decisione 0.20 conserva la casualità anche negli incontri a più fasi: la seconda mano usa gli agenti esclusi dalla prima. Le squadre boss fisse restano una proposta riservata al nemico.

Budget proposto: massimo 30 Lega per l’esercito da I.5, Nascente compreso, senza un secondo cap sulla mano. Le riserve non consumano questo budget. Per I.1–I.4 restano i roster ridotti già stabiliti. Il cap resta fermo mentre i posti crescono: nel prologo la qualità è limitata soprattutto dagli agenti realmente ottenibili.

### Composizioni dalla settima battaglia al boss

Nomi di missione candidati; codici Concordia dal catalogo del capitolo 5, nella versione di design con Staffetta e G03 Terraformare. I.7 torna alla Concordia; i Calibri entrano nella Faglia F1 descritta più avanti. Tutti gli agenti di questi roster sono eleggibili ai premi ordinari ed élite; N01 resta escluso dal premio boss secondo la proposta specifica.

| Battaglia | Esercito nemico completo | Garantiti in mano | Lega totale |
| --- | --- | --- | --- |
| I.7 | V01 V02 V04 V05 V06 G01 | G01 | 13 |
| I.8 | V01 V02 V04 V05 G01 G03 | G01 G03 | 14 |
| I.9 A | V01 V02 V04 V05 G01 G02 G03 | G02 G03 | 17 |
| I.9 B | V01 V02 V04 V05 G01 G04 G03 | G04 G03 | 17 |
| I.10 | V01 V02 V04 V05 G01 G02 G03 R01 | R01 G03 | 21 |
| I.11 | V01 V02 V04 V05 G01 G02 G03 R01 R02 | R02 G03 | 25 |
| I.12 | V01 V02 V04 V05 G01 G02 G03 R01 R02 N01 | N01 G03 | 30 |

I.7 Presidio del Vallo torna alla Concordia: V01, V02, V04, V05, V06 e G01, con G01 garantito nella mano candidata. Cinque L2 e una L3; 13 Lega totali. Il Portascudo mantiene Intervento: −2 POT nemica, minimo 2. Il presidio riprende il confronto locale dopo F1, mentre il vecchio roster Calibri viene trasferito integralmente alla Faglia introduttiva.

I.8 Le due campane garantisce G01 e G03: il giocatore affronta sia Conquista: +1 FC sia una possibilità di Terraformare. I.9 divide il percorso: A, Arena del Sole, usa G02 e impedisce Assalto lasciando Tenuta; B, Custodia del Vallo, usa G04 e impedisce Tenuta lasciando Assalto. I buff P2 si attivano dopo la vittoria, come nel capitolo 18; non potenziano retroattivamente I.9.

I.10 La breccia garantisce R01 insieme a G03 e introduce il DAN di Lega 4. I.11 Il Vespro garantisce R02 insieme a G03: il controllo del VA richiede un piano diverso rispetto alla sola corsa ai PV. I.12 La porta della Corona garantisce N01 insieme a G03: il Cavaliere Nero mantiene Intervento: Blocca Potere. N01 è la carta firma della mano; nella seconda fase ritorna secondo il capitolo 4. I PV residui si conservano fra le fasi.

La singola fase boss si risolve secondo le condizioni del formato anche se N01 non viene giocato. La vittoria del nodo richiede la fase finale oppure l’annientamento anticipato. G03 resta una risposta condizionale: Resistenza deve essere soddisfatto e Terraformare può essere bloccato. Le garanzie iniziali non implicano attivazioni automatiche; il ritorno di N01 è l’eccezione dichiarata del secondo schieramento, descritta al capitolo 4.

### Risorse Campi e conseguenze delle vittorie

Base proposta per tutto il blocco: giocatore 25 PV e 18 FC; nessuna Eminenza per entrambi. Il nemico parte da 25 PV e 18 FC, con +2 PV nelle élite I.8 e I.11, +4 PV nel boss I.12. Il modificatore boss sostituisce quello élite. Ai valori si aggiungono soltanto Preparazione e piani già espliciti: nessun aumento nascosto delle statistiche delle carte.

| Battaglia | IA | PV nemici prima dei piani | Dopo la vittoria |
| --- | --- | --- | --- |
| I.7 | Normale | 25 | Premio ordinario; sei posti; nessun evento autonomo. |
| I.8 | Difficile | 27 | Scelta élite; crescita a sette; poi E06. |
| I.9 A o B | Normale | 25 | Premio ordinario; crescita a otto; attiva il piano alternativo P2. |
| I.10 | Normale | 25 | Premio ordinario; crescita a nove. |
| I.11 | Difficile | 27 | Scelta élite; crescita a dieci; poi E03. |
| I.12 | Difficile | 29 | Premio a vittoria finale o annientamento; dieci posti; fine Atto I. |

P1 di I.5 resta attivo contro la Concordia, compreso I.7, ma non si applica alle Faglie F1 e F2, come stabilito al capitolo 18. Riserve significa +2 FC iniziali nemiche; Corazze +2 PV. P2 vale dalla battaglia seguente sui Concordia. Esempio: boss con Corazze parte da 31 PV e 18 FC; con Riserve da 29 PV e 20 FC. Tenuta o Assalto resta un effetto separato, visibile, e non cambia quei valori iniziali.

Per il primo assetto giocabile, I.7–I.12 mantengono esattamente i cinque Campi e le rivelazioni della tabella I.5–I.6: Cripta, Torre d’Avorio e Altopiano iniziali; Torre del Richiamo nello slot 4 al round 3; Miniera nello slot 5 al round 4 proposto. Nessun Campo ulteriore viene aggiunto per il maggior numero di agenti nell’esercito.

Ogni fase da cinque segue il Classico: Reklamazione ai round 3–4, Supremazia al quinto e confronto finale PV poi Campi a mano esaurita. Il blocco 0.21 propone lo zero PV prioritario e il pareggio se anche i Campi coincidono. In un nodo a più fasi, vincere con PV nemici residui avvia la squadra successiva; annientare completa subito il nodo. Nessun premio intermedio.

Premi proposti: I.7, I.9 e I.10 assegnano un prigioniero uniforme dal roster completo. I.8 e I.11 offrono due identità diverse selezionate uniformemente senza ripetizione dal roster: se ne sceglie una. Il boss offre la stessa scelta fra due, escludendo N01; N01 è firma non reclutabile in Atto I. G03 non è escluso. La garanzia in mano non è una garanzia di premio. Crescita garantita si applica dopo la scelta nei nodi I.8–I.11, se necessaria.

### Controllo della curva e della disponibilità

Controllo combinatorio: i roster I.7–I.12, contando i due rami I.9, rispettano 30 Lega e le garanzie. I.7 ha cinque mani possibili di Lega 11; I.8–I.11 mantengono le 79 mani del controllo precedente. La proposta 0.19 sostituisce le 56 mani possibili del boss con due squadre fisse di Lega 15 e 18. Non sono simulazioni di battaglia.

| Incontro | Mani possibili | Lega esercito | Lega mano min media max |
| --- | --- | --- | --- |
| I.7 | 5 | 13 | 11 / 11,00 / 11 |
| I.8 | 4 | 14 | 12 / 12,00 / 12 |
| I.9 A | 10 | 17 | 12 / 12,60 / 13 |
| I.9 B | 10 | 17 | 12 / 12,60 / 13 |
| I.10 | 20 | 21 | 13 / 14,00 / 15 |
| I.11 | 35 | 25 | 13 / 14,71 / 17 |
| I.12 | 2 fisse (proposta) | 30 | Fase 1: 15; fase 2: 18 |

Il boss proposto concentra 15 Lega nella prima squadra e 18 nella seconda; la carta N01 di Lega 5 compare in entrambe. Il roster resta a 30 Lega, mentre le dieci presenze totalizzano 33. Questo vantaggio del ritorno va provato con i PV conservati e il +4 PV iniziale già proposto, senza aumenti gratuiti di POT o DAN. Il resto della progressione alterna picchi élite e incontri ordinari.

Disponibilità con il profilo provvisorio: entro I.4 si conservano cinque identità L2 incluso il Nascente. I.6 e I.8 aggiungono al massimo L3; I.9–I.11 al massimo L4. Il nucleo di dieci costa al massimo 28 con Nascente L2, oppure 30 con Nascente L4. Trasformazioni di pari Lega mantengono questo limite. È una formazione conservativa possibile, non la legalità di ogni selezione.

La 0.25 fissa Leghe di prova esplicite per Nascente e G03 al capitolo 26. Prima di confermare una modifica si verifica l’esistenza di una formazione legale; se occorre si riorganizza. Nessuna trasformazione è obbligata. Una futura revisione delle Leghe richiederà di ricontrollare il limite: non modifica retroattivamente la versione di una campagna avviata.

Le fonti di bilanciamento ANATOMIA_SEZIONE_6_BUDGET_LEGA, §§6.1 e 6.5, motivano la distinzione fra costo del roster e distribuzione delle mani; le percentuali storiche di pesca libera non sono trasferibili alle firme garantite. ARMATA_MASCARADA_v0.5, §§2.2–2.3, mostra la dipendenza del valore di un Bonus dal matchup e del VA dall’investimento in FC. I suoi risultati non sono una misura della nuova Concordia; qui non sono state simulate battaglie.

Verifiche funzionali per I.7–I.12: avanzamento, premi, mani casuali e ricambi devono risolversi senza blocchi. Provare i quindici pacchetti del Nascente e i rami P1/P2, inclusi blocco di G03 e mancata attivazione di Staffetta. Le prove comparative di difficoltà, FC e PV residui sono rinviate alla fase di bilanciamento.

Impatto sul codice futuro: campaignEncounterSetup.js oggi gestisce una sola carta garantita e una mano esatta di cinque. Occorre supportare un elenco di garanzie, validare roster di N carte e conservare la nuova definizione nel salvataggio. La regola di rivelazione dei Campi va allineata separatamente; queste schede non attestano che la campagna locale implementi già il design.

### Faglie e volontà oltre il fronte

Decisione introdotta in 0.12: una Faglia è una deformazione spaziale che mette in contatto luoghi incompatibili; da lì attaccano altre armate comandate da altri Giocatori. È un tipo di nodo della campagna. La proposta aggiunge una battaglia obbligatoria per insegnarlo e una deviazione opzionale per permettere di sceglierlo consapevolmente.

Il riferimento GDD_v2.1_Sezione17_Revisione, §§17.3 e 17.8, distingue le armate maggiori mosse da Giocatori dalla popolazione locale e dalla Concordia. Qui Giocatore conserva il significato meta-narrativo di una volontà dietro l’armata: le battaglie della campagna restano gestite dall’IA. Il documento non introduce matchmaking o avversari umani collegati in diretta. Un eventuale PvP nelle Faglie richiederebbe una decisione separata.

La presentazione mostra un paesaggio sovrapposto a quello locale e un esercito che avanza con una coordinazione estranea. I personaggi possono percepire una volontà diversa; il testo non spiega loro il segreto del Giocatore. Le Faglie non appartengono alla Concordia e non significano che le armate invasori siano sue alleate.

| Nodo | Posizione proposta | Funzione e percorso |
| --- | --- | --- |
| F1 La prima frattura | Dopo I.6 ed E02, prima di I.7 | Obbligatoria. Intercetti l’avanguardia uscita dalla deformazione; la vittoria riapre il passaggio verso il presidio Concordia. |
| F2 La scala impossibile | Dopo I.9, prima di I.10 | Opzionale. Puoi affrontare l’incursione oppure proseguire verso la breccia. Entrambi i percorsi confluiscono in I.10. |

Le Faglie si aprono in punti del percorso, senza calendario o crescita durante l’attesa. F1 resta irrisolta finché non viene vinta. F2 resta disponibile finché non avvii I.10: proseguire chiude quella deviazione nella linea corrente. Ignorarla non aggiunge un buff nemico, non toglie risorse e non ostacola la crescita fino a dieci agenti.

La scheda presenta natura obbligatoria/opzionale, armata invasore, composizione e presenze garantite, risorse, Campi, ricompensa e assenza di crescita dei posti. La deformazione è il contesto del nodo: da sola non cambia i Campi né applica Terraformare. Qualsiasi modifica di Campo deve avere un testo proprio e un timing esplicito.

### Avanguardie delle due Faglie

Avversari e numeri candidati. F1 recupera il roster Calibri della versione 0.11, ora con una provenienza narrativa. F2 propone Kethran per introdurre una seconda volontà e la pressione di Rimonta. Sono incursioni contenute: nessuna Eminenza nell’Atto I, nessun boss di Lega 5 e nessun aumento delle statistiche rispetto alle carte del catalogo.

| Parametro | F1 Calibri Pesanti | F2 Kethran |
| --- | --- | --- |
| Esercito per lato | 6 identità | 8 identità |
| Mano per lato | 5, nel formato candidato 0.11 | 5, nel formato candidato 0.11 |
| Roster nemico completo | 407, 408, 410, 421, 404, 405 | 207, 209, 210, 221, 204, 205, 206, 222 |
| Garantiti nemici | 405 Guardiano di Settore | 204 Custode della Ziqqurat; 221 Glauson |
| Lega del roster | 14; quattro L2 e due L3 | 20; quattro L2 e quattro L3 |
| Bonus Armata | −2 DAN nemica, minimo 2 | Rimonta: +2 POT |
| Risorse e IA | 25 PV, 18 FC; Normale | 25 PV, 18 FC; Normale |
| Premio | Un prigioniero dal roster; restano 6 posti | Un prigioniero dal roster; restano 8 posti |

F1: Drone Cacciatore X-9, Operaio Meccanico, Orecchio del Fronte Sud, Trenobomba, Tecnico di Prima Linea e Guardiano di Settore. Il Guardiano mantiene Sfida: Blocca Potere; il Bonus Calibri ha scarso impatto contro DAN 1–2. La funzione introduttiva è riconoscere un’armata diversa e leggere i suoi Poteri, non dimostrare che ogni Faglia sia più difficile della Concordia.

F2: Seguace Fanatico, Ombra della Spira, Martire della Spira, Glauson il Secondo Architetto, Custode della Ziqqurat, Sacerdote della Ricomposizione, Berserker della Spira e La Luccicante. Il Custode mantiene Blocca Bonus; Glauson mantiene Rimonta: +1 POT e +1 DAN. Il loro incontro permette di provare la risposta ai blocchi e a un’armata che cresce quando è in svantaggio, senza inventare nuovi Poteri.

Nelle Faglie a una sola fase il Nascente resta garantito al giocatore. Tutte le garanzie occupano posti nella mano e non aggiungono carte. Si mantengono i cinque Campi della tabella I.5–I.6 e le rispettive rivelazioni: la Torre può favorire i Concordia conservati. I piani P1/P2 non si applicano agli invasori; la Preparazione del giocatore sì.

Controllo combinatorio: F1 ha cinque mani possibili, Lega minima 11, media 11,80, massima 12; F2 ha venti mani possibili, minima 11, media 12,50, massima 14. Entrambi i roster sono senza doppioni, rispettano il budget 30 e contengono le garanzie. Non sono stati eseguiti playtest: Rimonta e le garanzie richiedono un confronto con i pacchetti del Nascente.

### Ricompense deviazioni e ritorno temporale

Ogni vittoria Faglia assegna un solo agente casuale uniforme dal roster nemico completo della missione, anche se non entrato in mano o non giocato. L’identità originale viene conservata; la trasformazione facoltativa in un Figlio non posseduto di pari Lega si abilita dopo una successiva tappa completata. Il premio non proviene da un account umano e non rimuove carte a un altro giocatore.

Le due Faglie non concedono posti, una Domanda aggiuntiva, un’Eminenza o un buff permanente. Non attivano il rinforzo di Crescita garantita. La loro ricompensa amplia le alternative della collezione. Le pool F1 e F2 appartengono ad armate diverse e non sono già ottenibili nella spina precedente; in questa distribuzione non producono doppioni di identità. Per future Faglie con pool ripetute servirà definire esplicitamente la politica dei doppioni delle altre armate, senza estendere in silenzio l’eccezione Concordia.

F1 completata conta come tappa, matura i prigionieri precedenti e consuma la Preparazione usata con la vittoria. Lo stesso vale per F2 se affrontata. Il suo vantaggio comprende quindi anche una maturazione anticipata rispetto al percorso diretto, oltre alla carta aggiunta; va incluso nel bilanciamento. F2 non concede una Preparazione sostitutiva.

F1 resta irrisolta dopo sconfitta o pareggio. Dopo una sconfitta si può riprovare o riavvolgere tre tappe; dopo un pareggio si può riprovare, senza riavvolgimento diretto. Per F2 valgono le stesse regole, con la possibilità aggiuntiva di rinunciare e proseguire a I.10 in entrambi i casi. La rinuncia non concede premi, non matura prigionieri e conserva la Preparazione non consumata. Nessun tentativo fallito crea nuove risorse.

Salvare per ogni Faglia uno stato fra disponibile, completata e rinunciata, insieme a roster, mano fissata, seme del premio e ID della ricompensa. I.10 chiude F2 se ancora disponibile; vedere la sua anteprima non lo fa. Il riavvolgimento conta soltanto tappe completate lungo il percorso realmente seguito: la deviazione F2 aggiunge una tappa se vinta, mentre una rinuncia non ne aggiunge.

Ripristinare una tappa precedente annulla coerentemente ricompensa, maturazione e stato della Faglia. Tornare alla scelta dopo I.9 permette di scegliere di nuovo F2. Ripetere la stessa linea non accumula premi: la copia ottenuta nella linea cancellata non resta posseduta. Avversari e premi restano riproducibili nello stesso stato; nessuna rotazione giornaliera o riapertura automatica.

Verifiche del blocco: percorso diretto con 13 battaglie e quattro eventi; percorso completo con 14 battaglie e quattro eventi; entrambi arrivano a dieci posti attraverso I.11. Verificare che F1 impedisca di raggiungere I.7 prima della vittoria, che F2 non blocchi I.10, che P1/P2 non alterino i due invasori e che ricompense, Preparazione e maturazione si ripristinino insieme. I numeri combinatori verificano le schede, non l’implementazione di questi flussi.

Fonte narrativa recuperata: GDD_v2.1_Sezione17_Revisione, §§17.3 e 17.8. Si conserva la distinzione fra fronte locale e armate delle Faglie; calendario, Integrità della sede e vecchie regole enemy-only della revisione storica restano superati dalle decisioni correnti. Le due Faglie sono nodi aggiuntivi fissi del primo atto; la generazione dinamica è fuori da questo blocco.

### I due bivi del primo atto

Blocco 0.15. Si precisano obiettivi narrativi, anteprime e conseguenze dei piani P1 e P2. Nomi e testi sono proposti; gli effetti riprendono il capitolo 18. Ogni bivio occupa una sola battaglia del percorso. Le scene sono parte della scheda e del debriefing: non aggiungono eventi, giorni o tappe.

I.5, Logistica. Dopo la prima Domanda, il Nascente scopre due operazioni parallele della Concordia: distribuire corazze alle guarnigioni e far arrivare scorte alle posizioni avanzate. Può interromperne una. La scheda mostra entrambe prima di Affronta. Nei due rami combatte il roster già fissato V01, V02, V03, V04 e V05, con gli stessi Campi e le stesse risorse; cambia l’obiettivo della missione.

| Ramo e obiettivo | Operazione interrotta | Conseguenza della vittoria |
| --- | --- | --- |
| I.5 A  Il deposito delle corazze | Corazze | Riserve: +2 FC iniziali ai nemici Concordia, da I.6 al boss incluso. |
| I.5 B  La colonna dei rifornimenti | Riserve | Corazze: +2 PV iniziali ai nemici Concordia, da I.6 al boss incluso. |
| I.9 A  Arena del Sole | Assalto | Tenuta: primo DAN subito dalla Concordia −1, min 0. G02 Duellante nel roster. |
| I.9 B  Custodia del Vallo | Tenuta | Assalto: primo DAN inflitto dalla Concordia +1. G04 Reliquiario nel roster. |

I.9, Dottrina. Nell’Arena si organizza la forza di sfondamento; nella Custodia si prepara la resistenza delle guarnigioni. I due roster condividono V01, V02, V04, V05, G01 e G03, e differiscono soltanto per G02 o G04. Nel formato candidato di cinque carte, G03 e la carta distintiva sono garantiti. P1 si applica già a I.9; P2 nasce soltanto dalla sua vittoria e vale sui successivi Concordia da I.10.

Testo comune dell’anteprima: «Se vinci, interrompi [piano]. L’altra operazione viene completata: [effetto]. Vale contro la Concordia fino alla fine dell’atto». Il debriefing conferma entrambi gli esiti. L’operazione scelta non deve essere raccontata come fallita: il giocatore ha impedito proprio il piano che ha affrontato. Dopo Affronta il ramo è impegnato secondo il capitolo 3; una sconfitta non completa nessuna delle due operazioni.

La scelta non assegna un archetipo o un orientamento morale. Fermare Riserve limita la flessibilità di spesa nemica; fermare Corazze evita PV aggiuntivi. Fermare Assalto limita la prima sconfitta per DAN; fermare Tenuta preserva il primo DAN inflitto. Queste sono ragioni tattiche, non garanzie di convenienza: contano anche Campi, Poteri e condizioni territoriali.

Le ricompense mantengono le regole dei rispettivi nodi. In I.9 il ramo scelto rende eleggibile G02 oppure G04 nel premio, senza garantirlo; il premio non include la carta esclusiva del ramo ignorato. F1 e F2 non ricevono P1/P2 e non ne cancellano l’effetto sul successivo incontro Concordia.

### Il boss come conseguenza del percorso

I.12, La porta della Corona, conclude il primo atto riunendo i due piani sopravvissuti e le risposte della Concordia già introdotte. Il boss mantiene N01 Cavaliere Nero e G03 Seconda Campana nel roster, con le garanzie del formato candidato. Il resto della composizione è quello della tabella I.7–I.12. Non si sostituiscono carte per contrastare il Potere scelto dal giocatore.

| Piani sopravvissuti | PV e FC iniziali nemici | Effetto P2 |
| --- | --- | --- |
| Riserve e Tenuta | 29 PV / 20 FC | Primo DAN subito −1, min 0 |
| Riserve e Assalto | 29 PV / 20 FC | Primo DAN inflitto +1 |
| Corazze e Tenuta | 31 PV / 18 FC | Primo DAN subito −1, min 0 |
| Corazze e Assalto | 31 PV / 18 FC | Primo DAN inflitto +1 |

Il +4 PV del boss è già incluso nei valori della tabella e sostituisce il +2 PV élite. Il giocatore mantiene 25 PV e 18 FC base, più l’eventuale Preparazione conservata. Nessuna Eminenza partecipa. Assalto e Tenuta riguardano solo DAN da duello, secondo il capitolo 18; costi in PV, danni diretti e ricompense dei Campi non consumano i relativi marcatori.

La fase II del boss usa ora quattro nuovi agenti e N01 nuovamente disponibile, al termine del primo match. Il recupero di +2 FC dopo il secondo duello è eliminato. Gli FC vengono ripristinati nel cambio di squadra, non aggiunti al saldo precedente. Procedura, contabilità delle identità e politica dei PV sono descritte al capitolo 4.

Prima di Affronta, la scheda mostra risorse effettive, P1/P2, composizione, squadre previste, ritorno del boss, Campi e reset fra le fasi. N01 mantiene Intervento: Blocca Potere; G03 mantiene Resistenza: Terraformare. Nessun Potere viene forzato per rendere spettacolare il boss. L’ordine delle carte resta una scelta dell’IA Difficile.

Ogni fase si può vincere territorialmente o per PV secondo il formato, anche senza vedere N01 giocato. La vittoria della fase finale o l’annientamento anticipato assegna l’offerta boss di due identità diverse dal roster, escluso N01, scegliendone una. G03 resta eleggibile. Non si aggiungono posti, livelli o trasformazioni gratuite. I prigionieri precedenti maturano per il nodo completato; la fase intermedia e il premio appena ottenuto non producono una maturazione aggiuntiva.

La chiusura dell’atto mostra il superamento della porta e riepiloga i piani interrotti, quelli affrontati e le persone conservate. È parte del debriefing di I.12, non una nuova tappa. Il passaggio rimuove P1/P2 nemici e conserva esercito, riserva, Nascente e storia. La scelta dell’Eminenza avviene ancora dopo II.1; il boss non la anticipa.

Il blocco 0.21 del capitolo 4 completa la proposta di formati, risorse iniziali, priorità degli esiti e ricambio. Prima del codice occorre validare il blocco e allineare i risolutori discordanti. Le risorse della tabella sono iniziali: al cambio fase si conservano i PV residui; le due squadre del boss non sono ancora bilanciate mediante partite.

### Scene del primo atto dal varco al posto di blocco

Blocco 0.23 proposto. Le scene seguenti accompagnano i nodi già previsti: non aggiungono battaglie, eventi o premi. I testi di vittoria si mostrano solo dopo un esito valido; nomi, protagonisti e capacità restano quelli del catalogo. L’obiettivo della sequenza è far conoscere la Concordia attraverso la sua difesa e i compagni ottenuti.

#### I.1 Primo contatto

Apertura: «Una picca chiude il passaggio. Dietro il soldato, il varco è largo appena quanto basta per una persona. “Se vuoi passare, dovrai prendertelo.”» Prima di Affronta si mostra il Campo speciale e il suo testo Conquista: Vinci la partita. Vittoria: «La picca si abbassa. Il varco è tuo; il soldato sconfitto attende la tua decisione.» La ricompensa è V02, unico agente avversario. Due posti disponibili, nessuna scelta di premio aggiunta.

#### I.2 Pattuglia

Apertura: «Lo scudiero vede la picca che portate con voi. La guardia del fossato gli si affianca senza aspettare un ordine. Nessuno dei due abbandona il passaggio.» La scheda introduce la disponibilità del Bonus con la coppia nemica e il confronto finale Campi, poi PV. Vittoria: «La pattuglia arretra. Uno dei due rimane con il tuo gruppo, ancora nella propria livrea.» Si mostra l’agente realmente estratto, senza assegnare entrambi.

#### I.3 Presidio

Apertura: «Dalle mura vi segue una balestra. Sotto, una picca e uno scudo presidiano due accessi. Il passaggio non dipende più da un solo confronto.» Vittoria: «Il presidio cede e la strada si apre. Chi entra nel tuo seguito conserva nome, armi e appartenenza.» Il testo non garantisce una particolare carta e non impone di trasformare i nuovi compagni.

#### I.4 Posto di blocco

Apertura: «Una campana chiama i difensori alla strada. Le livree si raccolgono intorno al cavaliere; davanti a loro, il tuo piccolo seguito è ormai riconoscibile.» Vittoria: «Oltre il posto di blocco, nessuno cammina più solo. Alcuni dei tuoi compagni erano dall’altra parte poco fa. Che cosa significa guidarli?» Premio e crescita a cinque precedono E01; la domanda narrativa si sviluppa nell’evento già scritto al capitolo 15.

Sconfitta comune proposta: «Il passaggio resta difeso. Il tentativo si interrompe.» Pareggio: «Nessuno ottiene il passaggio. Lo scontro resta irrisolto.» Le opzioni effettive sono quelle del capitolo 22; il testo non racconta morti permanenti o reclutamenti prima della vittoria.

### Scene del primo atto dalla Logistica alle due campane

#### I.5 Due operazioni

Apertura: «Le guarnigioni attendono corazze e rifornimenti. Le due operazioni seguono strade diverse: puoi fermarne una.» Restano le anteprime P1 già definite. Vittoria al deposito: «Le corazze non raggiungeranno il Vallo. La colonna dei rifornimenti è passata.» Vittoria sulla colonna: «Le scorte sono ferme. Le guarnigioni hanno ricevuto le corazze.» Si esplicitano il piano interrotto e quello rimasto, senza cambiare il roster dei due rami.

#### I.6 La Seconda Campana

Apertura: «Il cavaliere raggiunge gli altri difensori e posa la mano sulla campana. “Una linea spezzata si può ricomporre.”» Si mostra Resistenza: Terraformare Torre del Richiamo nell’anteprima della carta. Vittoria comune: «La posizione è superata. Il cavaliere non può più fermare il tuo passaggio.» Solo se Terraformare è realmente avvenuto si aggiunge: «Hai visto il terreno mutare sotto i combattenti.» E02 segue premio e crescita a sei; G03 resta un esito possibile, non garantito.

#### F1 La prima Faglia

Apertura: «La strada si piega verso uno spazio che non dovrebbe esserci. Dalla deformazione avanzano i Calibri Pesanti. I loro ordini non provengono dalle mura: un altro Giocatore li dirige da oltre la Faglia.» La scheda indica incontro obbligatorio, esercito e garanzie nemiche. Vittoria: «L’assalto si arresta. La deformazione non sbarra più la strada; uno degli invasori rimane nelle tue mani.» Il premio conserva l’identità estratta. Non si dichiara sconfitto per sempre il Giocatore né sigillata ogni Faglia.

#### I.7 Presidio del Vallo

Apertura: «Sulla strada tornano le livree di Caelion. Il portastendardo richiama la guarnigione: la minaccia venuta dalla Faglia non ha cancellato i loro ordini.» Vittoria: «Il presidio abbandona la posizione. Le difese più interne continuano a rispondere alle campane.» Nessuna nuova meccanica; il nodo offre un agente e mantiene sei posti.

#### I.8 Le due campane

Apertura: «Il portastendardo e il cavaliere della Seconda Campana difendono insieme il passaggio. Dietro di loro attendono persone che non possono allontanarsi.» Vittoria: «I difensori depongono le armi. Ora puoi raggiungere chi è stato trattenuto al Vallo.» Il premio élite e la crescita a sette precedono E06. Le persone della scena non sono ulteriori carte reclutabili.

### Scene del primo atto dalla Dottrina alla Corona

#### I.9 Arena o Custodia

Apertura dell’Arena: «Il Duellante del Sole Pallido prepara chi dovrà aprire la prossima breccia.» Vittoria: «La forza d’assalto è dispersa. Nella Custodia, le guarnigioni hanno completato la preparazione difensiva.» Apertura della Custodia: «Intorno al Reliquiario Errante, i difensori si preparano a tenere il Vallo.» Vittoria: «La difesa organizzata qui è interrotta. Nell’Arena, la forza d’assalto è pronta.» P2 resta quello della scelta: Tenuta dopo Arena, Assalto dopo Custodia.

#### F2 Una seconda deformazione

Apertura: «Un’altra Faglia si apre fuori dalla strada verso la breccia. Oltre la piega dello spazio si muovono i Kethran, guidati dalla volontà di un altro Giocatore. Puoi affrontarli oppure continuare.» Vittoria: «L’assalto dalla Faglia è respinto. Un invasore si aggiunge ai prigionieri.» Rinuncia: «Lasci la deformazione alle spalle e prosegui verso la breccia.» La rinuncia non assegna malus, premi o conseguenze narrative punitive; il ramo resta opzionale come da capitolo 7.

#### I.10 La breccia

Apertura: «Oltre il Vallo, la livrea rossa occupa il passaggio. Il Cavaliere della Breccia attende chi è riuscito ad arrivare fin qui.» Vittoria: «La linea si apre. Il tuo esercito può avanzare verso l’ultima difesa della porta.» La scheda presenta R01 con il nome completo del catalogo e il Potere già definito; il testo non ne forza l’attivazione.

#### I.11 Il Vespro

Apertura: «Il Giustiziere attende davanti all’ultimo sbarramento. La Seconda Campana è con i difensori: il terreno conquistato potrebbe ancora cambiare.» Vittoria: «L’ultima difesa ha ceduto. Davanti alla porta, il tuo seguito attende che tu prenda posizione.» Premio élite e crescita a dieci precedono E03. Si concede l’opportunità già prevista di evolvere o cambiare il Nascente.

#### I.12 La porta della Corona

Apertura: «Il Cavaliere Nero custodisce la porta. Dietro la sua prima squadra, altri difensori aspettano il segnale. “Il Vallo era il principio.”» Le due squadre e il ritorno della firma sono annunciati nella scheda prima della battaglia. Solo dopo una vittoria di fase con il nemico ancora vivo: «La prima linea cede. Il Cavaliere Nero torna disponibile mentre quattro nuovi agenti prendono posizione.» Se l’annientamento conclude il nodo, questa transizione non viene mostrata.

Vittoria del nodo: «La porta della Corona non è più sbarrata. Il tuo esercito può attraversarla.» La frase vale sia dopo la seconda fase sia dopo annientamento anticipato. Il debriefing assegna una sola ricompensa boss; il ritorno di N01 non genera una seconda identità né un premio intermedio.

### Prigionieri e chiusura narrativa del primo atto

Questa pagina completa E06 e il debriefing di I.12. Tutti i testi sono proposti; le condizioni e i benefici restano quelli dei capitoli 10 e 17. La scena base di E06 precede le risposte: «Hanno deposto le armi. Le campane continuano a suonare. Chi è trattenuto al Vallo aspetta di sapere che cosa accadrà.»

#### E06 Liberali

Risposta: «Lasciateli andare.» Esito: «Le persone trattenute attraversano il posto di blocco. Per loro, la tua vittoria significa poter ripartire.» Si registra LIBERI e si offre Preparazione +3 PV. Nessuna carta posseduta viene rimossa: i prigionieri della scena sono distinti dagli agenti del giocatore.

#### E06 Trattienili per interrogare

Risposta: «Prima voglio sapere che cosa ci aspetta.» Esito: «Li trattieni al Vallo. Le loro indicazioni vengono confrontate con ciò che avete visto lungo la strada.» Si registra TRATTENUTI e si offre Preparazione +2 FC. Le informazioni narrative non rivelano mani nascoste, non cambiano i roster e non aggiungono reclutamenti.

#### E06 Lascia parlare i compagni

Con almeno due copie originali e mature della stessa identità Concordia: «Riconoscono le livree di chi hai conservato al tuo fianco. “Parlate voi.” Per la prima volta al posto di blocco, la risposta non passa dalle armi.» Si registra COMUNIONE_VALLO e si offre Preparazione +2 FC. Entrambe le copie restano possedute e originali; la scena riconosce la scelta passata senza promettere un’Eminenza automatica.

Se Preparazione è già occupata, la scelta successiva conserva il vecchio beneficio oppure lo sostituisce con quello offerto. Non si sommano i due. La risposta narrativa resta valida anche mantenendo la Preparazione precedente.

#### I.12 Il passaggio

Testo comune: «La porta è aperta. Nel tuo esercito camminano gli agenti incontrati lungo la strada. Oltre il Vallo, il cammino continua.» Il riepilogo elenca solo fatti realmente avvenuti: piani interrotti, prigionieri ottenuti e trasformazioni effettuate. Non interpreta un premio casuale come una scelta deliberata.

La riga su E06 riprende il fatto registrato: LIBERI, «Al Vallo hai lasciato ripartire chi era trattenuto»; TRATTENUTI, «Al Vallo hai trattenuto i prigionieri per interrogarli»; COMUNIONE_VALLO, «Al Vallo hai affidato la trattativa ai Concordia che avevi conservato». Trasformazioni successive non riscrivono il fatto. F2 compare nel riepilogo soltanto se vinta; saltarla non è un fallimento.

Il passaggio all’Atto II conserva esercito, riserva e Nascente e rimuove P1/P2. Non assegna ulteriori PV, FC, carte o crescita; non conta come tappa di maturazione. L’Eminenza si ottiene ancora dopo II.1. L’esito definitivo della città resta affidato agli eventi successivi: aprire questa porta non conclude l’intera campagna.

## 08  Atto 2 distribuzione degli incontri

Stato: Proposta conservata per gli sviluppi successivi. Priorità attuale all’Atto I.

Dare un comando all’esercito e scegliere come trattare la memoria dei Resistenti. Dieci battaglie e sei eventi: sedici tappe. Il mazzo resta di dieci carte.

| Batt. | Incontro | Profilo o piano | Premio | Evento subito dopo |
| --- | --- | --- | --- | --- |
| 2.1 | Ordinario | A | Riserva | E05 Eminenza |
| 2.2 | Ordinario | R | Riserva | E03 Effetto II |
| 2.3 | Ordinario e piano | A / R · P3 | Riserva | — |
| 2.4 | Élite | R + élite | Riserva | E02 Stat II |
| 2.5 | Speciale | Corte Rossa | Riserva | — |
| 2.6 | Ordinario | A | Riserva | E07 Archivio |
| 2.7 | Ordinario e piano | R / A · P1 | Riserva | — |
| 2.8 | Élite | R + élite | Riserva | E04 Cambio |
| 2.9 | Ordinario | A | Riserva | E09 Preparazione |
| 2.10 | Boss | R + R03 | Riserva | Fine Atto II |

La scelta della tua Eminenza segue II.1. La prima Eminenza nemica emerge dopo il bivio II.3 e vale da II.4. II.7 modifica un secondo piano, senza cambiare il comando dell’atto. E07 registra la sorte dell’archivio. E04 permette un cambio laterale del Nascente; E09 prepara il boss.

Ordine esatto: ogni riga è una battaglia; l’evento della stessa riga, se presente, è la tappa successiva prima della prossima battaglia. Le transizioni e l’epilogo non contano come eventi aggiuntivi. Le alternative A/R di un bivio occupano la stessa posizione e offrono lo stesso tipo di premio.

## 09  Atto 3 distribuzione degli incontri

Stato: Proposta conservata per gli sviluppi successivi. Priorità attuale all’Atto I.

Attraversare il centro della Concordia e decidere il significato della vittoria. Dieci battaglie e cinque eventi: quindici tappe. Il mazzo resta di dieci carte.

| Batt. | Incontro | Profilo o piano | Premio | Evento subito dopo |
| --- | --- | --- | --- | --- |
| 3.1 | Ordinario | R | Riserva | — |
| 3.2 | Élite | R + élite | Riserva | E02 Stat III |
| 3.3 | Ordinario e piano | A / R · P2 | Riserva | — |
| 3.4 | Ordinario | R | Riserva | E03 Effetto III |
| 3.5 | Speciale | Apex | Riserva | — |
| 3.6 | Élite | R + élite | Riserva | E08 Soglia |
| 3.7 | Ordinario e piano | R / A · P3 | Riserva | — |
| 3.8 | Ordinario | A | Riserva | E04 Cambio |
| 3.9 | Élite | R + élite | Riserva | E09 Preparazione |
| 3.10 | Boss finale | R + N01 | Riserva e epilogo | Conclusione |

III.3 modifica un piano; III.7 offre il cambio del comando nemico descritto al capitolo 20. E08 registra la decisione finale sulla Fusione. E04 permette l’ultimo cambio del Nascente, E09 prepara il boss. L’epilogo deriva dalle tre scelte narrative e dalla tua Eminenza.

Ordine esatto: ogni riga è una battaglia; l’evento della stessa riga, se presente, è la tappa successiva prima della prossima battaglia. Le transizioni e l’epilogo non contano come eventi aggiuntivi. Le alternative A/R di un bivio occupano la stessa posizione e offrono lo stesso tipo di premio.

## 10  Reclutamento e identità dei prigionieri

Stato: Regole acquisite; probabilità e casi di esaurimento richiedono la validazione delle pool.

La ricompensa ordinaria è un agente casuale presente nella composizione iniziale dell’avversario affrontato, anche se non giocato. Conserva identità, statistiche, Potere e armata originali. Un Concordia già posseduto può essere ottenuto nuovamente: la copia aggiuntiva entra in riserva. Questa eccezione supera il precedente divieto di ottenere doppioni Concordia; non autorizza copie multiple nello stesso schieramento.

Si mantiene un prigioniero per premio ordinario; la proposta élite presenta due identità distinte fra cui sceglierne una, entrambe presenti nell’incontro, anche se possedute quando Concordia. Presenza obbligatoria e premio garantito restano diversi. Per I.12 il capitolo 7 propone due candidati fra cui sceglierne uno, escludendo N01; i boss successivi richiedono proprie pool esplicite.

Il Nascente è portatore della Domanda: può trasformare le persone intorno a sé in propri simili. Il giocatore può scegliere di mantenere agenti originali e un esercito misto, seguendo una via di comunione. Questa scelta non introduce automaticamente un nuovo indicatore morale, Bonus o penalità di fazione.

| Momento | Stato dell’agente | Scelte disponibili |
| --- | --- | --- |
| Ottenimento dopo I.1 | Identità nemica originale | Utilizzabile subito; trasformazione non ancora disponibile. |
| Durante I.2 | Identità originale | Può combattere normalmente. |
| Dopo il completamento di I.2 | Una tappa successiva completata | Conservarlo oppure trasformarlo. |
| Tappe successive | Se conservato, identità originale | La possibilità di trasformarlo resta disponibile. |

Si conta una tappa successiva completata, non il tempo reale, una visita al menu o un tentativo perso. Un evento autonomo completato conta come tappa. Il calendario resta escluso.

La trasformazione sostituisce l’agente: non aggiunge un posto all’esercito. Il Bonus della carta ottenuta resta soggetto alla disponibilità ordinaria. Un esercito misto può avere più Bonus disponibili se ne soddisfa i requisiti; non si presume attivo il Bonus dei Figli solo perché il Nascente è presente.

### Riserva Concordia e riconoscimento futuro

Ogni copia conserva origine, tappa di ottenimento, maturazione e stato di trasformazione. La riserva non conta come agente aggiuntivo schierato e non attiva Bonus di armata. Se manca una copia attiva di quell’identità, si può usare una copia conservata nel rispetto dei posti e dei normali vincoli di preparazione. Non viene aggiunta una nuova azione di consumo o sacrificio: qui consumare indica anzitutto trasformare la copia.

La proposta dettagliata di E06 nel blocco seguente riconosce i Concordia conservati con identità originale, anche quando ridondanti. Requisiti, premio e rapporto con la crescita sono candidati della versione 0.10; le copie non vengono consumate per ricevere quel riconoscimento.

### Crescita garantita e valore della riserva

Regola operativa 0.25: conservare il premio casuale, compresi i doppioni Concordia. Solo nelle tappe di crescita aggiungere il rinforzo se necessario a coprire il nuovo posto. È l’eccezione esplicita al premio singolo, non un secondo premio generalizzato.

### Procedura della ricompensa

1. Assegnare il premio ordinario dal roster nemico iniziale e conservarlo anche quando è un doppione Concordia. Per le élite si mantiene la proposta di scegliere una delle due identità offerte. Nessuna carta viene aggiunta retroattivamente al nemico.

2. Se la vittoria sblocca un posto, contare le identità distinte possedute, incluso il Nascente e incluse quelle in riserva. Una coppia di copie identiche vale una sola identità. Il controllo avviene dopo il premio, prima della gestione o dell’evento seguente.

3. Se le identità sono meno dei nuovi posti, assegnare un rinforzo casuale non posseduto fra gli agenti eleggibili del medesimo roster sconfitto. Il rinforzo non sostituisce il doppione. Nella progressione proposta basta al massimo un rinforzo; se la pool è vuota o ne servono di più, la configurazione dell’incontro è invalida e va corretta prima del rilascio.

4. Confermare insieme premio, eventuale rinforzo, nuovi posti, esito del piano e avanzamento. I due prigionieri hanno ID individuali e maturano dopo una tappa successiva completata. La schermata mostra il motivo del rinforzo. Retry o ricaricamento non ripetono l’assegnazione.

| Vittoria | Posti successivi | Premio e rinforzo |
| --- | --- | --- |
| I.1–I.4 | 2, 3, 4, 5 | Un premio; rinforzo solo se manca un’identità. |
| I.5 | 5 | Un premio; nessun rinforzo di crescita. |
| I.6 | 6 | Un premio; rinforzo se necessario. |
| I.7 | 6 | Un premio; nessun rinforzo di crescita. |
| I.8–I.11 | 7, 8, 9, 10 | Un premio, con scelta nelle élite; rinforzo se necessario. |
| I.12 | 10 | Premio del boss; nessun rinforzo di crescita. |

Esempio: inizi I.3 con Nascente, Picca e Scudiero. Ottieni un’altra Picca: la conservi in riserva, ma resti a tre identità. Poiché si aprono quattro posti, ricevi anche Balestriere o Portascudo, entrambi presenti in I.3 e non posseduti. Alla fine hai cinque copie, quattro identità e quattro posti, senza trasformazioni.

### Vincoli e verifiche della crescita

Ogni incontro di crescita deve includere N nemici di identità diverse, tutti eleggibili al reclutamento, dove N è il numero di posti prima della vittoria. Il Nascente resta sempre posseduto e non compare nel roster nemico. Non si introducono scarti volontari o perdite permanenti di identità in questo blocco. Le trasformazioni sostituiscono una copia con un Figlio non posseduto e non riducono il numero di identità.

Garanzia numerica: se dopo il premio possiedi già N+1 identità, il rinforzo non serve. Se ne possiedi soltanto N, una è il Nascente: puoi quindi possedere al massimo N−1 delle N identità nemiche. Almeno un nemico eleggibile è nuovo e riempie il posto aggiunto. La dimostrazione riguarda la quantità di identità, non la Lega, le sinergie o le probabilità di vittoria.

I.1–I.6 rispettano il requisito di identità nemiche distinte. I roster successivi di crescita devono rispettarlo in entrambe le alternative dei bivi. Un’eventuale firma esclusa dal premio non può sottrarre l’unico candidato necessario. Con tetti di Lega o restrizioni ulteriori occorre verificare anche l’esistenza di uno schieramento legale: il solo conteggio non basta.

Il costo della soluzione è una maggiore riserva per chi riceve doppioni. La riserva non aumenta i Bonus in battaglia; conservare o trasformare rimane una scelta. Prima di fissare il sistema si confrontano quantità di copie, Leghe e varietà fra sequenze fortunate e sequenze con rinforzi. Non si assegna un secondo premio quando il giocatore può già riempire i posti con identità distinte.

### E06 Prigionieri del Vallo

Proposta: usare l’evento già previsto dopo I.8, senza aggiungere tappe. Scena: «Al posto di blocco riconoscono due dei tuoi compagni. Portano ancora i colori della Concordia. Per una volta, chiedi che siano loro a parlare». La variante compare solo se, all’ingresso nell’evento, conservi almeno due copie originali della stessa identità Concordia, entrambe già abilitate alla trasformazione.

Le copie possono essere in riserva o una schierata e una in riserva. Devono essere ancora originali: averle possedute in passato non basta. Il premio appena ottenuto in I.8 non soddisfa la maturazione entrando in E06. Il requisito verifica una reale occasione di trasformarle già trascorsa, senza contare attese nei menu o tentativi persi.

| Risposta | Esito candidato |
| --- | --- |
| Lascia parlare i compagni | Le copie restano possedute e originali. Flag COMUNIONE_VALLO; offerta Preparazione +2 FC per la prossima battaglia. |
| Liberali | Conserva la variante narrativa LIBERI e Preparazione +3 PV già proposta. Si riferisce ai prigionieri della scena, non rimuove carte possedute. |
| Trattienili per interrogare | Conserva TRATTENUTI e Preparazione +2 FC. Si riferisce ai prigionieri della scena; nessun nuovo reclutamento. |

Una sola risposta e un solo beneficio Preparazione; se lo slot è occupato, mantieni il vecchio o sostituiscilo. Più doppioni non moltiplicano il premio. Comunione resta nel diario e determina la variante E06 dell’epilogo: una trattativa resa possibile dai compagni conservati; non assegna una classe o un’Eminenza. Trasformazioni future non cancellano il fatto storico. Riavvolgere prima di E06 annulla flag e premio. I testi candidati di E06 e del debriefing del primo atto sono nel blocco 0.23 del capitolo 7.

### Dalla vittoria alla nuova formazione

Blocco 0.13. Reclutamento dall’esercito affrontato, identità originale e scelta facoltativa della trasformazione restano acquisiti. Le precisazioni seguenti propongono un ordine unico per premi, maturazione e preparazione, valido anche nelle Faglie. Non dipendono dall’adozione della mano di cinque.

La carta catturata usa il profilo permanente con cui quell’identità è definita nel catalogo della campagna: armata, Lega, POT, DAN e Potere. Conserva quindi anche G03 con Terraformare nella versione di campagna. Non eredita danni subiti, modifiche del Campo, blocchi, buff P1/P2, bonus élite o vantaggi del comandante nemico. La scheda del premio mostra il profilo ottenuto, separato dai modificatori dell’incontro.

| Passaggio | Regola proposta |
| --- | --- |
| 1  Risolvere la vittoria | Fissare esito, offerte e premio del nodo. Nei premi élite o boss il giocatore sceglie una sola carta fra gli esiti ammessi. |
| 2  Applicare la crescita | Assegnare il premio scelto; controllare i nuovi posti e, solo dove previsto, il rinforzo di Crescita garantita. Il doppione Concordia resta posseduto. |
| 3  Completare la tappa | Maturano le copie ottenute prima di questo nodo. Premio e rinforzo appena ottenuti non maturano nella stessa vittoria. |
| 4  Registrare le conseguenze | Confermare piano, consumo della Preparazione e avanzamento insieme ai premi, una volta sola. Non si accede alla gestione fra premio e rinforzo. |
| 5  Preparare la prossima tappa | Consentire confronto delle carte, spostamenti fra esercito e riserva e trasformazioni già abilitate, anche prima di un evento obbligatorio. |

Una copia nuova è disponibile subito per il prossimo incontro. Se serve a riempire un posto appena aperto, la schermata propone di inserirla; non rimuove altre carte senza una scelta. Se l’esercito è pieno, resta in riserva fino alla riorganizzazione. È ammessa una sola copia per identità nell’esercito, anche quando ne esistono diverse nella collezione.

La riserva non ha un limite in questa proposta. La maturazione procede anche per le copie non schierate: dipende dalla tappa completata, non dalla partecipazione al combattimento. Non servono azioni di attesa o combattimenti ripetuti. Conservare una carta non richiede di rinunciare definitivamente alla trasformazione.

Per i controlli futuri: chiudere o ricaricare la schermata premio riprende la stessa scelta pendente; non rigenera le offerte. Il completamento è indivisibile: non può esistere uno stato con premio ricevuto e nodo ancora premiabile. La riorganizzazione successiva rispetta posti, identità e budget del formato scelto.

### Eserciti misti e occasioni di trasformazione

Conservare un invasore amplia subito i Poteri disponibili. Nell’Atto I il suo Bonus Armata segue la regola ordinaria delle coppie nella mano iniziale. La proposta di Eminenza della Comunione al capitolo 19 introduce un’eccezione dal secondo atto. F1 e F2 offrono un solo agente ciascuna e appartengono ad armate diverse: nel percorso attuale non forniscono da sole una coppia Calibri o Kethran. Questa è una conseguenza da rendere leggibile nella scelta fra conservazione e trasformazione.

| Situazione in battaglia | Conseguenza |
| --- | --- |
| Un Calibro nella mano iniziale | Può usare il proprio Potere. Il Bonus Calibri non è disponibile per mancanza della coppia. |
| Un Kethran nella mano iniziale | Il suo Potere mantiene il proprio trigger; Rimonta del Bonus non diventa disponibile grazie a un Calibro o a un Concordia. |
| Due Concordia nella mano iniziale | Il loro Bonus è disponibile; Staffetta deve comunque soddisfare il trigger e superare i normali blocchi. |
| Nascente e un altro Figlio nella mano iniziale | La coppia rende disponibile il Bonus dei Figli. Una carta rimasta fuori mano o in riserva non conta. |
| Concordia dopo un invasore dal Bonus inattivo | Staffetta non trova un’attivazione precedente valida. La Torre può soddisfarne la condizione secondo le regole del capitolo 14. |

Conservare l’identità non assegna una penalità di lealtà né un costo aggiuntivo. Il Potere di un invasore può essere utile anche senza Bonus; trasformarlo scambia quella capacità nota con un Figlio casuale di pari Lega non posseduto. Non si forza una trasformazione per correggere una sinergia debole. L’utilità concreta di entrambe le scelte richiede playtest degli eserciti misti.

Esempio I.6 → E02 → F1: il prigioniero ottenuto in I.6 è inizialmente non trasformabile. Risolvere E02, anche scegliendo Conserva dove consentito, completa la tappa successiva e lo abilita prima di F1. Il prigioniero ottenuto in F1 diventa invece trasformabile dopo I.7; non alla sola apertura della schermata successiva.

Esempio I.8 → E06: la copia ottenuta in I.8 entra in E06 ancora non matura. Il requisito Comunione si controlla all’ingresso, dopo l’ultima gestione: servono già due copie originali e mature della stessa identità Concordia. Terminare E06 matura la nuova copia, ma non ricalcola retroattivamente le risposte offerte. Se una copia richiesta viene trasformata prima dell’ingresso, non soddisfa più il requisito.

Esempio I.9 → F2 oppure I.10: il premio di I.9 matura alla vittoria di F2 se la affronti, oppure alla vittoria di I.10 se la salti. Sconfitte, pareggi e rinuncia a F2 non maturano copie. Il premio della stessa F2 attende a sua volta una successiva tappa completata.

### Ricompense del primo atto quadro operativo

Raccordo 0.23 delle proposte già presenti. Ogni vittoria assegna un agente del roster completo affrontato, comprese le identità non entrate in mano. Le offerte élite e boss restano la proposta di due identità distinte fra cui sceglierne una; questa scelta non interviene nella composizione casuale delle mani. I codici rinviano ai roster dei capitoli 6–7.

| Nodo | Premio principale | Posti dopo la vittoria |
| --- | --- | --- |
| I.1 | V02, unico nemico. | 2 |
| I.2–I.4 | Una identità uniforme dal rispettivo roster. | 3, 4, 5 |
| I.5 / I.6 | Una identità uniforme; G03 eleggibile solo in I.6. | 5 / 6 |
| F1 / I.7 | Un Calibro da F1 / un Concordia da I.7. | 6 / 6 |
| I.8 | Due identità del roster offerte; una ottenuta. | 7 |
| I.9 / F2 | Un agente del ramo I.9 / un Kethran se F2 è vinta. | 8 / 8 |
| I.10 / I.11 | Uno uniforme / scelta di uno fra due. | 9 / 10 |
| I.12 | Scelta di uno fra due, dal roster escluso N01. | 10 |

Le estrazioni uniformi usano identità, senza pesi basati su archetipo, Nascente o carte già possedute. Un doppione Concordia resta eleggibile e va in riserva. Nell’offerta boss i candidati sono V01, V02, V04, V05, G01, G02, G03, R01 e R02; V02 è eleggibile anche se non schierato nelle due squadre proposte. Annientare prima del ricambio non restringe questa pool.

Crescita garantita: solo dopo I.1–I.4, I.6 e I.8–I.11, se il premio lascia meno identità dei nuovi posti, si aggiunge un agente non posseduto dello stesso roster. Il doppione resta al giocatore. I.5, I.7, F1, F2 e I.12 non concedono questo rinforzo. Non basta preferire un’altra sinergia per ottenerlo.

Contabilità: percorso obbligatorio, 13 premi principali; percorso con F2, 14. Con il Nascente iniziale sono 14 o 15 copie complessive, più gli eventuali rinforzi di crescita. Una trasformazione sostituisce una copia e non aumenta il totale. Il numero di identità distinte e la Lega disponibile si controllano separatamente. E01, E02, E06 ed E03 non aggiungono agenti.

Prima della conferma finale si mostrano carta ottenuta, eventuale doppione, rinforzo e nuovi posti. Non sono assegnati livelli, valuta di crescita o trasformazioni gratuite aggiuntivi. Offerta e risultato restano salvati: riaprire, perdere un retry o ricaricare non rigenera il premio.

## 11  Trasformazione casuale di pari Lega

Stato: Trasformazione facoltativa, pari Lega e assenza di doppioni confermate. Fallback proposti dove indicato.

Dopo una tappa successiva al reclutamento, il giocatore può trasformare il prigioniero in un agente casuale dei Figli dell’Orizzonte di pari Lega che non possiede. Le vecchie corrispondenze fisse fra origine ed esito sono eliminate. L’armata originale, POT, DAN e identità non determinano una coppia preassegnata.

Pool valida: agenti dei Figli dell’Orizzonte ammessi dal catalogo della campagna, di pari Lega del prigioniero, esclusi gli ID posseduti in esercito o riserva. Il Nascente non è un esito ottenibile. L’estrazione provvisoria è uniforme. Prima di confermare si mostrano Lega, esiti eleggibili e sostituzione della copia originale.

Procedura: scegliere l’istanza del prigioniero e verificarne proprietà e maturazione; costruire la pool dei Figli di pari Lega non posseduti; confermare e salvare un solo esito; sostituire soltanto quella copia. Le altre copie originali restano disponibili. Ogni istanza ha un ID distinto dall’identità della carta. Riaprire la schermata non assegna un secondo agente; retry e riavvolgimento rispettano lo stato salvato. L’estrazione avviene soltanto alla conferma; l’anteprima mostra gli esiti possibili, senza rivelarne uno da cambiare riaprendo il menu. Una pool vuota conserva integralmente il prigioniero. Il risultato sostituisce una sola copia e non può essere trasformato di nuovo con questa procedura, riservata agli agenti delle altre armate.

| Caso | Trattamento | Stato |
| --- | --- | --- |
| Esito Figli già posseduto | Escluso dalla pool. | Confermato |
| Tappa successiva non completata | Trasformazione indisponibile; agente giocabile. | Confermato |
| Nessun Figlio disponibile di pari Lega | Conservare il prigioniero e mostrare pool esaurita; non cambiare Lega né generare un doppione. | Fallback proposto |
| Premio Concordia già posseduto | La nuova copia entra in riserva; resta un premio valido e trasformabile dopo la propria maturazione. | Confermato nella versione 0.9 |
| Un solo candidato per un premio élite | Mostrare il candidato unico senza duplicarlo. | Fallback proposto |
| Riavvolgimento prima della trasformazione | Ripristinare agente originale e collezione di quel momento. | Conseguenza del ripristino temporale |

I doppioni Concordia possono essere conservati o trasformati dopo la propria maturazione. Trasformare non aumenta le copie, ma può aumentare le identità distinte. Crescita garantita raccorda i premi ai posti nell’esercito; nel formato candidato del capitolo 7 solo cinque agenti entrano in mano. La verifica di Lega comprende anche il Nascente e le sue modifiche.

## 12  Nascente Domande e archetipi

Stato: Stato iniziale e direzione delle Domande confermati. Quindici pacchetti numerici candidati.

Confermato: il Nascente inizia 2 POT / 2 DAN senza Potere. Gli eventi Domanda usano domande filosofiche e militari per determinarne il Potere. Tutti gli otto archetipi devono essere accessibili, e le scelte successive possono cambiarne la direzione. L'archetipo classifica il Potere: non introduce un nuovo Bonus Armata o un'Eminenza.

Confermato per Colosso: un Potere «Conquista: −3 PV (a te)» compensa un aumento della POT base; il DAN della forma resta 2. Gli aumenti statistici della forma si rimuovono quando si abbandona quella forma; le modifiche indipendenti restano. Rientrare nella forma non accumula nuovamente lo stesso aumento.

Prima Domanda dopo I.4. Per il prototipo Colosso parte 4/2 e può evolvere a 5/2; gli altri pacchetti partono dal corpo 2/2. La Lega di prova segue il capitolo 26. Il calcolo definitivo del pacchetto completo resta rinviato e non usa coefficienti mancanti come zero.

### Offerta attraverso le Domande

Tutti gli otto archetipi sono raggiungibili nel primo evento tramite rami di domande. Le risposte filosofiche selezionano la direzione; quelle militari scelgono fra gli esiti completi previsti per quella direzione. Il giocatore vede l'anteprima meccanica e può rivedere le risposte prima della conferma.

Il blocco 0.22 del capitolo 15 scrive la prima Domanda per tutti i quindici esiti. La risposta filosofica conduce a una domanda militare e all’anteprima del Potere completo. I nomi degli archetipi classificano il catalogo; il giocatore non sceglie una classe permanente.

Colosso ha un solo esito iniziale in questa proposta. Il suo ramo dichiara esplicitamente forza e prezzo e conduce all'anteprima, senza una seconda domanda che finga di offrire una differenza meccanica inesistente.

Le pool organizzano le possibilità: non si estraggono separatamente un trigger e un effetto da due liste da incrociare liberamente. Nuove combinazioni entrano dopo un controllo del timing, del valore e dell'utilità. Il catalogo potrà ampliarsi senza eliminare archetipi o bloccare permanentemente il personaggio in una classe.

### Pool iniziale dei Poteri

Ogni riga è un Potere completo alternativo. Nessuna riga si somma alle altre. Le combinazioni sono proposte nuove, anche dove esistono precedenti identici o vicini. Tutti i corpi sono 2/2, salvo Colosso 4/2.

| ID | Archetipo | Potere iniziale | Funzione e limite |
| --- | --- | --- | --- |
| C1 | Campione | Imboscata: +2 POT | Premia il gioco per primi e l'investimento in Focus |
| C2 | Campione | Turbo: +6 VA | Vantaggio fisso nei primi due round, utile anche a puntate contenute |
| A1 | Assaltatore | Imboscata: +2 DAN | Arriva a 4 DAN ma deve vincere con POT base 2 |
| A2 | Assaltatore | Rimonta: +1 POT, +1 DAN | Recupero ibrido; il classificatore assegna Campione come secondario |
| S1 | Soffocatore | Imboscata: −2 POT nem. (min 2) | Efficace contro corpi più forti; non abbassa i nemici già a POT 2 |
| S2 | Soffocatore | Resistenza: −6 VA nem. (min 5) | Contesa dopo una conquista nemica; il minimo preserva le puntate molto basse |
| G1 | Guardiano | Resistenza: Cura 2 | Recupera PV dopo che il nemico ha conquistato un Campo |
| G2 | Guardiano | Intervento: −2 DAN nem. (min 1) | Limita le conseguenze della sconfitta; minimo più incisivo del precedente ID 307 |
| K1 | Carnefice | Imboscata: 2 Danni diretti | Pressione PV indipendente dalla vittoria del duello |
| K2 | Carnefice | Ultimo Desiderio: 3 Danni diretti | Rende costoso batterlo; cedere un Campo rimane un rischio |
| F1 | Catalizzatore | Turbo: +1 FC | Rifornimento nei primi due round; risorsa comune, non +1 alla puntata già scelta |
| F2 | Catalizzatore | Conquista: +2 FC | Premio maggiore subordinato a vincere con POT base 2 |
| B1 | Sabotatore | Intervento: Blocca Bonus | Permette di rispondere al Bonus nemico visibile, soggetto alle normali interazioni |
| B2 | Sabotatore | Turbo: Blocca Bonus | Pressione sui Bonus nei primi due round, indipendente dall'ordine |
| O1 | Colosso | Conquista: −3 PV (a te) | Corpo 4/2: +2 POT di forma; ogni vittoria pagata in PV |

Per il prototipo tutti i pacchetti iniziali usano Lega 2 secondo il profilo esplicito del capitolo 26. È un valore provvisorio, non un costo verificato. I confronti futuri comprenderanno esercito, Bonus dei Figli, iniziativa e Campi.

#### Precedenti principali

| Proposta | Carta esistente | Confronto |
| --- | --- | --- |
| C1 | 110 Ashara, L2 2/2, Imboscata: +2 POT | Corpo e Potere identici; diverso contesto evolutivo |
| C2 | 421 Trenobomba, L2 3/1, Turbo: +6 VA | Stesso Potere, corpo diverso |
| A1 | 224 Cacciatore di Normoformi, L3 4/2, Imboscata: +2 DAN | Potere esistente; il Nascente ha due POT base in meno |
| A2 | 221 Glauson, L2 2/2, Rimonta: +1 POT e +1 DAN | Corpo e Potere identici |
| S1 | 309 Ombra del Creditore, L2 3/2, Imboscata: −2 POT min 2 | Stesso Potere, una POT base in meno |
| S2 | 209 Ombra della Spira, L2 2/3, Resistenza: −6 VA min 5 | Stesso Potere, un DAN base in meno |
| G1 | 508 Il Muschio Curativo, L2 3/1, Resistenza: Cura 2 | Stesso Potere, corpo diverso |
| G2 | 307 Archivista degli Obblighi, L2 2/2, Intervento: −2 DAN min 2 | Corpo identico, minimo proposto più forte; verifica prioritaria contro DAN 1–3 |
| K1 | 407 Drone Cacciatore X-9, L2 3/1, Imboscata: 2 DD | Stesso Potere, corpo diverso |
| K2 | 210 Martire della Spira, L2 2/2, Ultimo Desiderio: 3 DD | Corpo e Potere identici |
| F1 | Vecchia matrice del Nascente | Combinazione già ammessa e valorizzata dal codice; non prova d'equilibrio fra archetipi |
| F2 | 115 Vethan, L2 3/1, Conquista: +2 FC | Stesso Potere, meno POT per procurarsi la vittoria |
| B1/B2 | 920 John, L2 3/1, Intervento: Blocca Bonus; 107 Eco, L2 3/1, Blocca Bonus senza trigger | B1 conserva il trigger di John; B2 è una proposta di finestra differente |
| O1 | 1103 Veterano finito, L2 4/1, Conquista: −3 PV; 1018 Prigioniero Khemet, L2 4/2, Conquista: −5 PV | O1 ha un DAN in più del primo e un costo minore del secondo: vantaggi espliciti da verificare |

### Colosso

Configurazione provvisoria: Colosso 4/2 all’acquisizione e 5/2 evolvendo la forma in E03. La Lega di prova segue il capitolo 26, separata dalla futura valutazione. Il Potere resta Conquista: −3 PV a sé.

La POT aggiuntiva resta utile anche quando il Potere è bloccato. Si segue il normale funzionamento dei Colossi: non si inventa una perdita di POT durante il duello per compensare il blocco dell'autolesione. Il ritiro del bonus statistico avviene quando si cambia forma tramite evento.

Se tutte le componenti sono applicabili e non ci sono altri modificatori, una vittoria porta 2 danni all'avversario e 3 PV persi a sé. Questo peggiora lo scambio diretto di PV di uno, ma può contribuire alla vittoria territoriale e far risparmiare Focus: il costo non rende automaticamente equilibrata una POT arbitrariamente alta.

L’autolesione può portare a zero i PV del Nascente. Non esiste un’immunità del protagonista. Si applicano i controlli terminali del capitolo 4 nella finestra raggiunta, senza rieseguire effetti già risolti o rimandare la sconfitta a una fase successiva.

## 13  Crescita cambi e bilanciamento del Nascente

Stato: Principio di provenienza confermato per Colosso; incrementi e valutazione completa da validare.

### Evoluzioni candidate

Ogni opportunità concede una modifica. I gradini seguenti sono alternative candidate per la fine dell'Atto I, non aumenti automatici e non nuove soglie di Lega. Il confronto comprende anche il potenziamento delle statistiche, quando l'effetto non è numerico o la sua finestra è più rilevante del valore.

| Esito | Prima evoluzione candidata | Nota |
| --- | --- | --- |
| C1 | +2 POT → +3 POT | Con Imboscata il vecchio valutatore passa da 2,60 a 3,05: da L2 a L3 |
| C2 | +6 VA → +8 VA | Nessun coefficiente VA nella vecchia matrice del Nascente |
| A1 | +2 DAN → +3 DAN | Aumenta il premio, non l'affidabilità della vittoria |
| A2 | +1 POT/+1 DAN → +2 POT/+1 DAN oppure +1 POT/+2 DAN | Proposta 0.22: cresce una sola componente a scelta. Sostituisce il precedente gradino doppio +2/+2; richiede valutazione completa. |
| S1 | −2 POT → −3 POT, min 2 invariato | Nessuna riduzione simultanea del minimo |
| S2 | −6 VA → −8 VA, min 5 invariato | Mantiene il limite contro piccoli assalti |
| G1 | Cura 2 → Cura 3 | Il motore attuale limita la cura a 25 PV |
| G2 | −2 DAN → −3 DAN, min 1 invariato | Utile contro DAN elevato; effetto spesso invariato contro i piccoli |
| K1 | 2 DD → 3 DD | Con Imboscata il vecchio valutatore passa da 2,60 a 3,05: L3 |
| K2 | 3 DD invariati, +1 POT indipendente come alternativa | Migliorare la POT rende meno frequente la sconfitta richiesta; non è un miglioramento senza compromesso |
| F1 | +1 FC → +2 FC | Il vecchio valore passa da 2,295 a 2,89; L2 formale, ma l'economia anticipata richiede verifica |
| F2 | +2 FC invariati, +1 POT indipendente | Aiuta a ottenere la vittoria che procura la risorsa |
| B1/B2 | Blocca Bonus invariato, +1 POT indipendente | Nessun artificiale «Blocca Bonus +1». Un cambio a Blocca Potere è un altro pacchetto, da prezzare |
| O1 | +2 POT di forma → +3 POT di forma, costo −3 PV invariato | Diventa 5/2; l'intero aumento della forma si perde se la si abbandona |

Proposta 0.22 per l’Atto I: E02 concede una modifica statistica indipendente; E03 concede una sola evoluzione dalla tabella oppure un cambio di pacchetto iniziale. Questo limite conta le scelte, non certifica pari valore. Il pricing resta da validare sul corpo e sul Potere completi; nessun coefficiente assente vale zero. Per A2 la nuova proposta aumenta una sola componente, POT oppure DAN.

### Provenienza delle modifiche

La scheda deve distinguere: statistiche originali, modificatori della forma, modifiche indipendenti ed effetti temporanei del duello.

Esempio con la proposta attuale: 2 POT originali +2 Colosso +1 modifica indipendente = 5 POT. Uscendo da Colosso resta 3 POT. Se il potenziamento acquistato è invece una crescita della forma da +2 a +3, all'uscita si rimuovono tutti e tre i punti della forma. L'evento deve dichiarare quale componente modifica.

Proposta generale per cambi successivi: trasferire gli investimenti della forma soltanto mediante esiti espliciti già valutati. Nel primo atto E03 offre una scelta fra evolvere e cambiare: il cambio usa un pacchetto iniziale del capitolo 12, conserva E02 indipendente e non concede anche l’evoluzione. Non serve quindi inventare un cambio numerico automatico fra effetti diversi. E04 degli atti successivi resta da valutare separatamente.

Le modifiche indipendenti restano registrate anche quando un cap impedisce di applicarle integralmente. Il valore effettivo rispetta i limiti; cambiare forma non cancella un investimento né permette di duplicarlo. I cap storici del Nascente sono POT 7 e DAN 6; applicarli dopo la composizione non basta a certificare la Lega.

Prima della conferma di un cambio: mostrare vecchie e nuove statistiche, Potere completo, modifiche conservate/perse e Lega. Proposta 0.23: verificare prima che le carte possedute consentano almeno una formazione legale con il nuovo Nascente. Se occorre, consentire la riorganizzazione; se nessuna formazione è possibile, lasciare disponibili gli altri esiti validi o Conserva. Non si avvia una battaglia illegale né si impone una trasformazione casuale per renderla possibile.

### Confronto con il modello esistente

Il catalogo locale contiene 360 agenti, dei quali 85 di Lega 2. La POT base massima delle L2 è 4. I vecchi conteggi di 330 agenti e 78 L2 descrivono una versione precedente.

Il VA prima dell'applicazione dei minimi è POT × Focus usato + modificatore VA. A 3 Focus, +2 POT produce +6 VA; a 5 Focus produce +10 VA. Un +6 VA fisso offre invece sempre sei punti prima dei minimi. Quindi i due effetti sostengono stili diversi e non vanno equiparati punto per punto.

Conquista e Ultimo Desiderio sono trigger post-esito. Le proposte non li abbinano a POT, VA, DAN o blocchi destinati a influenzare l'esito già calcolato. Conquista con autolesione o generazione FC e Ultimo Desiderio con danni diretti hanno precedenti nel catalogo.

I minimi dei debuff fanno parte del valore della carta: contro un agente a 2 DAN, «−2 DAN, min 2» non riduce nulla. Un minimo a 1 è quindi una scelta di forza effettiva, non un dettaglio di scrittura.

La formula attuale del Nascente è 0,50 × POT + 0,35 × DAN + valoreEffetto × FCPT × MS. I suoi coefficienti coprono soltanto POT, danno diretto, FC e riduzione POT, con Turbo, Imboscata, Vendetta e Invasione. Un effetto non supportato non può essere valutato come se costasse zero; un cambio di trigger può cambiare il valore complessivo anche lasciando invariato il numero stampato.

Le vecchie soglie V 2,90 / 4,35 / 5,80 / 7,25 e i cap POT 7 / DAN 6 restano riferimenti del modello precedente, non un pricing completo dei nuovi pacchetti. I coefficienti mancanti per VA, blocchi, autolesione e Terraformare non sono zero. Non si approva un cambio solo perché il vecchio valutatore lo accetta.

Le immagini degli stadi del Nascente possono continuare a seguire la Lega: L2 armatura parziale, L3 armatura leggera, L4 piastre e spadone, L5 armatura alata. Sono indicazioni artistiche candidate e non aggiungono statistiche.

### Verifiche dei pacchetti

1. Confrontare tutti i pacchetti contro gli stessi incontri dell'Atto I e le stesse composizioni iniziali, Campi e iniziativa; includere entrambi gli ordini iniziali.

2. Confrontare eserciti misti e concentrati, con Bonus dei Figli disponibile e indisponibile. Non presumere il Bonus attivo perché il Nascente è protagonista.

3. Misurare attivazioni del Potere, Focus usati e rimasti, Campi conquistati, saldo PV e vittorie per condizione. Nessuna percentuale di vittoria è stata misurata per questi pacchetti.

4. Provare debuff ai rispettivi minimi, blocchi e annullamenti, campo favorevole a Staffetta, azzeramento dei PV per autolesione e casi in cui i FC ottenuti non sono più spendibili.

5. Provare cambi ripetuti e riavvolgimento temporale: devono ripristinare forma, modifiche e ricompense del momento corretto, senza duplicazioni. Un semplice retry non concede un nuovo miglioramento.

6. Valutare la Lega del pacchetto completo con il modello esteso, inclusi costo negativo di Colosso e valore non numerico dei blocchi. Il ritorno automatico a L5 oltre 7,25 del codice attuale non costituisce un controllo del tetto.

Catalogo operativo del prototipo: otto famiglie, quindici Poteri iniziali e percorsi E01/E02/E03. Le Leghe di prova sono esplicite al capitolo 26. Il modello storico seguente serve alla successiva fase di bilanciamento e non sovrascrive i dati del prototipo.

### Costo cumulativo delle evoluzioni verifica parziale

Verifica 0.23 sul valutatore locale src/campaign/logic/nascente.js, non assegnazione definitiva della Lega. Il modello copre C1, S1, K1 e F1 dei quindici pacchetti; gli altri undici richiedono coefficienti o rappresentazioni assenti. Formula storica: V = 0,50 × POT + 0,35 × DAN + valore effetto × FCPT × MS. Soglie: L2 fino a 2,90; L3 fino a 4,35. Il conteggio comprende il corpo dopo E02, non soltanto l’incremento di E03.

| Pacchetto | E01 → E02 con +1 POT → E03 | E01 → E02 con +1 DAN → E03 |
| --- | --- | --- |
| C1 | 2,600 L2 → 3,100 L3 → 3,550 L3 | 2,600 L2 → 2,950 L3 → 3,400 L3 |
| S1 | 2,420 L2 → 2,920 L3 → 3,280 L3 | 2,420 L2 → 2,770 L2 → 3,130 L3 |
| K1 | 2,600 L2 → 3,100 L3 → 3,550 L3 | 2,600 L2 → 2,950 L3 → 3,400 L3 |
| F1 | 2,295 L2 → 2,795 L2 → 3,390 L3 | 2,295 L2 → 2,645 L2 → 3,240 L3 |

Le Leghe in tabella sono risultati del solo modello storico. E03 applica rispettivamente +3 POT, −3 POT nemiche min 2, 3 danni diretti e +2 FC. C1 e K1 hanno lo stesso costo formale, ma effetti diversi. F1 resterebbe formalmente L2 a 2,890 evolvendo il solo Potere sul corpo 2/2: dopo E02 arriva invece a L3. Quindi non si può prezzare ogni evento separatamente e sommare etichette di Lega.

Confronto delle fonti: Anatomia di un esercito v0.3, §6, distingue il budget di 30 Lega dalla riserva di 18 FC. Mascarada v0.6, §4.3-bis, distingue POT moltiplicativa e VA additivo e offre precedenti del catalogo; non fornisce una matrice universale per questi nuovi pacchetti. Il riferimento completo PROPOSTA_MODELLO_v3.md non è stato reperito neppure nella ricerca per titolo di questo blocco. Non si assegnano valori nulli a costi ignoti.

Costo dell’opportunità proposto: E02 e E03 consumano ciascuno una sola scelta dell’evento; non si introduce un pagamento in FC, PV o una nuova valuta. Conquista: −3 PV di Colosso resta un costo in battaglia. La Lega finale del Nascente, una volta validata, consuma il normale budget dell’esercito; riserva e copie non schierate non lo consumano.

Conseguenza a dieci agenti: Nascente L3 lascia 27 Lega agli altri nove, L4 ne lascia 26, L5 ne lascia 25. Il minimo teorico dei nove è 18, ma il giocatore deve possedere davvero nove identità compatibili. Prima di confermare una crescita va mostrato il nuovo totale e deve esistere una formazione legale, senza costringere a trasformazioni casuali per sbloccare la progressione. Se nessuna formazione è possibile, l’opzione resta indisponibile con motivo; rimangono le alternative valide o Conserva. Nessun aumento automatico del tetto.

Restano aperti: Lega completa degli undici pacchetti non coperti, G03 Terraformare, confronti con Bonus attivo o indisponibile e prove delle due squadre boss con PV conservati. Le cifre sopra sono calcoli riproducibili, non misure di vittoria o una certificazione del bilanciamento.

### Compatibilità dei Campi da verificare

Non tutti i Campi sono dichiarati compatibili. Prima di renderli selezionabili per Terraformare occorre verificare durata, fase, provenienza degli effetti e interazioni con le primitive del motore. La sostituzione del solo ID del Campo non soddisfa il contratto.

## 14  Campi Torre del Richiamo e Terraformare

Stato: Effetto parametrico e timing normale acquisiti. Contratto di dettaglio proposto per l’implementazione.

La Torre del Richiamo rende soddisfatto il trigger Staffetta per entrambi i lati, sia nei Poteri sia nei Bonus ancora da risolvere. Non supera indisponibilità, blocchi o annullamenti. Nell’Atto I è nello slot 4, rivelato all’inizio del round 3; Miniera è nello slot 5 al round 4. Rivelazione e selezione restano distinte.

I.5–I.12 usano la lista del capitolo 6; I.1–I.4 usano la progressione ridotta del capitolo 4. F1/F2 seguono le proprie schede. Terraformare può anticipare la Torre senza rivelare o spostare la Torre naturale. Altri Campi di destinazione saranno abilitati solo dopo la verifica del contratto parametrico.

Carta introduttiva approvata: G03 Cavaliere della Seconda Campana, 3 POT / 3 DAN, Lega 3 candidata, Resistenza: Terraformare Torre del Richiamo. Debutta obbligatoriamente nel sesto combattimento, in un solo esemplare, ed è reclutabile secondo i normali premi. Il quinto incontro non usa Terraformare.

### Testo dell'effetto

Terraformare X: sostituisci il Campo corrente con X. Le regole del nuovo Campo si applicano da quel momento; le fasi già concluse non si ripetono.

X è un Campo preciso indicato sulla carta. È un riferimento a un elemento del catalogo, non un numero da incrementare e non una scelta libera tra tutti i Campi durante la risoluzione.

Prima applicazione approvata per la Concordia: Resistenza: Terraformare Torre del Richiamo. La Torre rende soddisfatto Staffetta; non concede da sola la disponibilità del Bonus Armata e non annulla Blocca Bonus. Resistenza si verifica prima della trasformazione e richiede un Campo già conquistato dal nemico, salvo altre regole attive.

Terraformare è un effetto di Potere soggetto alle normali condizioni e ai blocchi validi prima della sua risoluzione. Non introduce una finestra anticipata rispetto agli altri Poteri ordinari. La natura condivisa del Campo consente a entrambi gli schieramenti di beneficiarne secondo il testo del Campo.

### Cosa viene sostituito

Si trasforma la singola istanza del Campo corrente, conservandone posizione nella battaglia e identità di istanza.

Il suo tipo di Campo diventa X. Il vecchio Campo non ritorna fra quelli disponibili e non produce una ricompensa aggiuntiva.

Il cambiamento persiste nella singola istanza per il resto della fase e viene registrato sul Campo conquistato. Il nuovo set della fase successiva riparte dai dati iniziali. Non modifica catalogo, altri Campi o battaglie successive.

Gli altri Campi disponibili, nascosti o conquistati restano invariati. Terraformare non rivela nuovi Campi.

Se il Campo corrente è già X, non avviene una nuova entrata e non si ripetono effetti. Il Potere può essersi attivato senza produrre un cambiamento.

Se X compare altrove, si crea lo stesso tipo di Campo in questa istanza: non si sposta, ruba o condivide lo stato dell'altra istanza.

Il vincolo di rivelazione naturale della Torre nel quarto o quinto slot riguarda la distribuzione dei Campi. Terraformare può anticiparne la presenza: è una proprietà esplicita dell'effetto. Slot di rivelazione e numero di round non sono sinonimi.

### Principio temporale

La risoluzione avanza sempre. Un cambio di Campo modifica ciò che deve ancora accadere; non ricomincia il duello.

La pipeline locale esaminata distingue: applicazione iniziale del Campo; blocchi dei Poteri; Poteri ordinari (con una gestione dedicata per Inversione); Bonus Armata; finalizzazioni e calcolo VA; determinazione del vincitore; Poteri/Bonus post-esito; danni e conseguenze del Campo.

Terraformare entra nella finestra normale del suo effetto. Per il primo contenuto viene usato su un Potere ordinario pre-esito, così la Torre può influenzare il successivo controllo dei Bonus. Un eventuale Terraformare su Conquista o Ultimo Desiderio entra nella fase post-esito: non può riattivare Staffetta nella fase Bonus già conclusa o cambiare il vincitore già determinato.

#### Procedura atomica proposta

1. Verificare blocchi, disponibilità e trigger sotto il Campo attuale. Registrare l'esito di questo controllo.

2. Se l'effetto non è attivo, lasciare tutto invariato. Se la destinazione coincide con il Campo corrente, registrare nessuna sostituzione.

3. Rimuovere soltanto le regole e i contributi continui appartenenti alla vecchia istanza attiva.

4. Installare X e i suoi contributi continui; eseguire gli eventuali effetti esplicitamente definiti «all'entrata» una volta per questa effettiva entrata.

5. Aggiornare le letture successive delle regole, quindi continuare dal punto raggiunto. Non ricontrollare il trigger dell'effetto in corso e non rieseguire altri Poteri già processati.

La trasformazione in corso completa la propria risoluzione: un nuovo Campo che disabilita i Poteri non cancella retroattivamente il Terraformare che lo ha introdotto. Impedisce invece le risoluzioni successive cui la sua regola si applica.

### Quattro categorie di comportamento dei Campi

Ogni componente del Campo deve dichiarare la propria durata o fase. Un Campo con più componenti può appartenere a più righe.

| Categoria | Uscita del vecchio Campo | Entrata del nuovo Campo |
| --- | --- | --- |
| Regola o contributo continuo: trigger forzati, disponibilità Bonus, POT/DAN/VA concessi mentre il Campo è attivo | Si rimuove il solo contributo di quella fonte; gli altri effetti restano | Vale da subito per controlli e calcoli ancora da eseguire |
| Effetto esplicito all'entrata: per esempio un futuro Campo che concede PV quando entra | Le risorse già ottenute o perse restano | Si esegue una volta per ciascuna effettiva entrata; non è il comportamento implicito di qualunque Campo |
| Effetto di fase: setup, calcolo VA, determinazione esito, danni, conseguenze post-scontro | Non si annullano risultati già prodotti; le fasi future non useranno più la vecchia regola | Si applica solo quando si raggiunge la sua fase, se non è già trascorsa |
| Scelta già impegnata: scelta agenti, iniziativa, puntata pagata | Le scelte e i pagamenti non si annullano | Non riapre la scelta; eventuali regole sul valore effettivo valgono solo nei successivi calcoli |

#### Precisazione sul significato di «non retroattivo»

Un +4 POT valido finché il Campo è attivo è un contributo continuo: cessa quando quel Campo viene sostituito. Una cura già risolta è un evento concluso: non viene ritirata. Sono comportamenti distinti e devono essere distinguibili nei dati, anche se il codice attuale li applica entrambi attraverso mutazioni di stato.

I Poteri già risolti conservano i propri risultati e le proprie letture storiche. Se una Copia ha letto una POT mentre il vecchio Campo era attivo, non si ripete la Copia dopo la trasformazione. La nuova situazione può invece influenzare il prossimo effetto ancora da risolvere.

Per scambi, imposizioni e modifiche non additive serve una dichiarazione specifica: non si assume che sottrarre il vecchio delta ricostruisca correttamente lo stato. Proposta per Sala degli Specchi: lo scambio iniziale è un'operazione di setup già conclusa; non si disfa all'uscita e non si esegue entrando dopo il setup. Se si desidera uno scambio a ogni entrata, questa deve diventare una modifica esplicita del testo e del comportamento del Campo.

### Esempi su Campi esistenti

Le definizioni e gli ID sono ricavati dai file locali. La classificazione in comportamento continuo o di fase è parte della proposta Terraformare, non una funzionalità già implementata.

| Campo | Comportamento proposto quando introdotto dal Potere |
| --- | --- |
| Torre del Richiamo, nuovo Campo di campagna | Forza Staffetta per i Bonus ancora da controllare. Non riapre quelli già processati |
| Gran Corno, ID 1, entrambi +4 POT | Contributo continuo: entra nel calcolo ancora futuro, sostituendo i contributi continui del vecchio Campo |
| Nido dell'Antico, ID 5, entrambi −2 DAN | Riduzione continua con le normali interazioni e protezioni, da tenere separata dai modificatori dei Poteri |
| Arena degli Gnomi, ID 3, Poteri disattivati | Ferma i Poteri successivi. Se è il Campo iniziale, Terraformare come Potere non può attivarsi per uscirne |
| Tempio del Monaco Pazzo, ID 6, Bonus disattivati | Se entra prima del controllo Bonus, li disabilita. Se lo si sostituisce prima di quella fase, viene meno questa interdizione del Campo |
| Biblioteca delle Lingue Perdute, ID 24, blocchi disattivati | Non cancella un blocco già risolto. Vale per eventuali effetti di blocco ancora da processare |
| Porte di Atlantide, ID 9, FC ×2 nel calcolo VA | Modifica il calcolo VA se questo deve ancora avvenire. Non raddoppia la riserva FC né la puntata pagata |
| Sala degli Specchi, ID 7, POT scambiate al setup | Entrando dopo il setup non ripete lo scambio; è una destinazione poco utile in questa finestra e va segnalata nell'editor |
| Miniera di Lacrime, ID 4, Conquista +2 PV | Il premio è disponibile alla normale fase di conseguenze del Campo, se X è ancora attivo quando viene valutato |
| Cripta dei Sussurri, ID 8, perdente +1 FC post-scontro | Si applica alla propria fase ancora futura, non all'istante della trasformazione |

I nomi o i soli testi non bastano a garantire compatibilità. Il catalogo completo richiede una revisione dei comportamenti per destinazione prima di esporli all'editor come selezionabili.

### Blocchi, annullamenti e disponibilità

| Caso | Esito |
| --- | --- |
| Blocca Potere valido prima di Terraformare | Nessuna trasformazione |
| Blocca Bonus sul terraformatore | Terraformare può avvenire, ma il Bonus bloccato resta bloccato |
| La trasformazione porta alla Biblioteca dopo un blocco già risolto | Il blocco resta. Nessuna rimozione retroattiva |
| Si lascia una Biblioteca che aveva impedito il pre-scan dei blocchi | Il pre-scan non si ripete; i blocchi già processati come inattivi non si riattivano |
| Il vecchio Campo disabilitava i Bonus; il nuovo è la Torre | Rimuovere l'interdizione del Campo, poi ricontrollare la disponibilità ordinaria alla fase Bonus. Un distinto blocco prodotto da un Agente resta |
| Il nuovo Campo rende soddisfatto un trigger già fallito | Nessuna seconda occasione per quell'effetto già processato; i controlli successivi usano la nuova regola |
| Il nuovo Campo rende soddisfatto Staffetta, ma manca la disponibilità del Bonus Armata | Nessuna attivazione del Bonus |

Il sistema deve distinguere un'interdizione continua del Campo da un blocco già prodotto da un Potere. Un solo booleano senza provenienza non permette di rimuovere la prima conservando il secondo in tutti i casi.

Terraformare cambia il Campo condiviso. Immune non è una protezione contro il cambio del Campo stesso; si applica agli effetti del nuovo Campo secondo le normali regole. Eventuali altri sistemi di protezione o copia devono avere un comportamento esplicito prima di abilitare le relative combinazioni nel catalogo.

### Più terraformazioni e copie

Le fonti si risolvono nell'ordine normale della rispettiva fase e dell'iniziativa; non si privilegia il giocatore o il nemico.

Esempio: A trasforma in Torre; B trasforma in Tempio del Monaco Pazzo. Se entrambi i Poteri sono validi quando arriva il loro momento, il Campo finale è il Tempio e i Bonus successivi risultano disabilitati. La Torre non ha ancora prodotto un'attivazione di Bonus solo per essere comparsa.

Se A trasforma nell'Arena degli Gnomi, il Potere ordinario di B può risultare disabilitato quando viene valutato. «Vince l'ultimo» significa quindi l'ultima trasformazione effettivamente risolta, non l'ultima carta selezionata.

Una copia legale di Terraformare conserva il riferimento X e risolve nella propria finestra. Se trova già X, non provoca una nuova entrata. La copia non concede una seconda esecuzione alla fonte originale. I normali limiti di copia e blocco restano applicabili.

Un'autentica sequenza A→B→A prodotta da fonti distinte può generare due entrate di A. Gli effetti esplicitamente all'entrata si applicano a ogni entrata; ciò deve essere considerato nel bilanciamento. La semplice rivalutazione delle regole non produce entrate. Nessun Campo in questa prima versione genera automaticamente ulteriori Terraformare: un futuro effetto ricorsivo richiederebbe regole aggiuntive, non va abilitato implicitamente.

La finestra Conquista o Ultimo Desiderio resta post-esito. Un eventuale raddoppio dell'effetto verso lo stesso Campo rende la seconda applicazione priva di sostituzione; X non è un valore numerico da moltiplicare.

### Puntate, vincitore e conseguenze

Il numero di Focus già pagati resta registrato: nessun rimborso o nuova puntata causato da Terraformare.

Un limite o moltiplicatore del nuovo Campo modifica soltanto le letture o i calcoli ancora futuri cui si riferisce. Si distingue sempre Focus investito, Focus effettivo e riserva.

Il cambio del Campo non modifica l'iniziativa già assegnata.

Una volta determinato il vincitore, quel risultato è fissato. Una trasformazione post-esito non ricalcola VA, vincitore o trigger già risolti.

Danni, conseguenze e ricompense ancora da risolvere consultano il Campo allora attivo, nella loro finestra. Ogni sottofase legge una sola volta la propria regola: non si paga il premio di entrambi i Campi per lo stesso passaggio.

L'istanza registrata come conquistata assume il tipo risultante dalla trasformazione. Non vengono assegnati due Campi.

Gli effetti che azzerano i PV seguono i controlli terminali del capitolo 4. Terraformare non introduce immunità, un nuovo controllo anticipato o una diversa priorità di vittoria.

### Dati necessari per estendere il sistema

Contratto proposto, non schema già presente nel codice:

Sull'effetto: tipo Terraformare; ID stabile del Campo di destinazione. Il trigger appartiene al Potere, come per gli altri effetti.

Sul Campo: componenti distinte con fase, durata, lato interessato, dipendenze e politica di entrata. Per ogni destinazione l'editor indica se può produrre un effetto utile nella finestra del Terraformare selezionato.

Nello stato della battaglia: ID dell'istanza, ID del tipo corrente, revisione della trasformazione, fonte, fase raggiunta, modificatori continui per fonte, effetti già risolti e dati immutabili di puntata/esito. Le entrate hanno un'identità distinta dalla sola coppia nome del Campo–round.

Nel motore: tutte le fasi successive consultano la revisione corrente del Campo. Servono aggiornamenti coerenti a disponibilità e sostituzione Bonus, condizioni dei trigger, opzioni degli effetti, limiti e moltiplicatori, tracciamento dei modificatori del Campo, risoluzione esito e conseguenze post-scontro.

La rimozione dei contributi continui deve rispettare minimi, massimi, Inversione, Copia e Imponi. Non si ripristina una fotografia precedente dell'intero duello: cancellerebbe Poteri e cambi di risorse già avvenuti. Non basta neppure sottrarre ciecamente un delta statistico aggregato in presenza di trasformazioni non additive.

L'attuale fieldOptions è costruito prima dei Poteri e varie funzioni ne destrutturano i valori all'ingresso. Queste letture devono diventare coerenti con i cambi avvenuti durante la fase; sostituire soltanto field.id non è sufficiente.

### Editor, salvataggio e leggibilità

Nell'editor della campagna Terraformare seleziona un Campo dal catalogo delle destinazioni validate. L'anteprima mostra nome, testo e momento in cui ciascuna componente può applicarsi. Una destinazione valida ma priva di effetti utili nella finestra scelta viene segnalata, senza inventarle attivazioni aggiuntive.

Il log distingue: Campo originale, fonte di Terraformare, nuovo Campo, regole cambiate, effetti già risolti conservati ed eventuale assenza di cambiamento perché X era già presente.

Il giocatore vede la destinazione sulla carta prima di giocarla e può consultarla. Gli eserciti nemici sono definiti dagli incontri: nessuna sostituzione segreta di carte in risposta alla scelta Sabotatore del giocatore.

Retry e riavvolgimento temporale ripristinano lo stato previsto da quelle operazioni. Una trasformazione effettuata nella battaglia perduta non modifica il Campo iniziale del retry; ricaricare a risoluzione conclusa non riesegue l'entrata. Per eventuali salvataggi a metà risoluzione servono cursore di fase e identificativi delle esecuzioni.

### Matrice di accettazione per l'implementazione

| Verifica | Risultato atteso |
| --- | --- |
| Torre, catena Staffetta interrotta, Bonus disponibile | Il Bonus corrente può attivarsi e alimentare il successivo |
| Torre con Blocca Bonus già valido | Bonus corrente inattivo; nessuna falsa registrazione di attivazione |
| Blocca Potere prima del terraformatore | Campo originale invariato |
| Uscita dal Tempio → Torre | Cessa la sola interdizione del Campo; i blocchi indipendenti restano |
| Entrata/uscita Biblioteca dopo il pre-scan | Nessuna ripetizione o cancellazione del pre-scan |
| Gran Corno → Torre | Cessa il +4 POT continuo del Gran Corno; modifiche degli Agenti conservate |
| Campo con cura all'entrata → altro Campo | I PV già curati restano |
| Entrata dopo la fase di uno scambio di setup | Lo scambio non si esegue tardivamente |
| Porte di Atlantide prima del calcolo VA | Si aggiorna il calcolo, non riserva o pagamento FC |
| Cambio dopo la determinazione del vincitore | Vincitore immutato; nessun ricalcolo dell'esito |
| Miniera attiva alla propria fase premio | Una sola applicazione del suo premio normale |
| Due terraformazioni valide verso destinazioni diverse | Ordine ordinario, regole lette alla risoluzione di ciascuna |
| Trasformazione nell'Arena prima del secondo Potere | Il secondo Potere ordinario viene valutato con Poteri disattivati |
| Stessa destinazione già attiva, anche da copia | Nessuna nuova entrata |
| X presente su un altro slot | L'altro slot e il suo proprietario restano invariati |
| Copia, Inversione, Imponi e minimi insieme a cambio Campo | Conservati risultati storici; contributi continui ricalcolati senza perdita o duplicazione |
| Retry, caricamento, rewind | Nessuna trasformazione o ricompensa duplicata |

Questi sono criteri da verificare in futuro: non test già eseguiti.

## 15  Eventi Domanda e crescita

Stato: prima Domanda dopo I.4 confermata. Blocco 0.22: testi, risposte, crescita e cambi dell’Atto I proposti; valori e Lega da validare.

Gli eventi pongono domande filosofiche e militari. Le risposte indirizzano verso Poteri completi formati da trigger ed effetto compatibili. L’archetipo organizza le possibilità e descrive lo stile: non blocca permanentemente la campagna in una classe. L’anteprima deve permettere di capire cosa cambia prima della conferma.

| Evento | Collocazione | Funzione | Stato |
| --- | --- | --- | --- |
| E01 Prima Domanda | Dopo I.4 | Primo Potere del Nascente, accesso agli otto archetipi. | Confermato; testi e pacchetti candidati. |
| E02 Modifica statistica | Dopo I.6, prima di F1; poi II.4 e III.2 proposti. | Una modifica indipendente: +1 POT oppure +1 DAN. | Collocazioni e budget proposti. |
| E03 Risonanza | Dopo I.11, II.2, III.4 | Atto I: evoluzione del Potere o cambio a un pacchetto iniziale. Una sola scelta; dettagli 0.22. | Collocazioni e incrementi proposti. |
| E04 Rifrazione | Dopo II.8, III.8 | Cambio di direzione con confronto completo fra vecchio e nuovo Potere. | Collocazioni e costo proposti. |

Le Domande usano esclusivamente i Poteri candidati dei capitoli 12–13. Per i blocchi non numerici E03 offre una modifica statistica dichiarata; non esiste Blocca Bonus +1. Un evento concede una sola scelta: potenziare, cambiare o conservare sono alternative. I quindici Poteri iniziali restano accessibili senza vincoli morali o di armata.

Proposta 0.22: si possono confrontare gli esiti e tornare alle risposte precedenti fino alla conferma. Conserva completa la tappa senza modifica e senza accumulare un credito. Se il Nascente è senza Potere, E02 ed E03 possono riaprire l’acquisizione E01 in alternativa al proprio beneficio. Limiti, origine delle modifiche e cambio di pacchetto sono precisati nelle schede seguenti.

Si salva separatamente ogni modifica di forma e ogni modifica indipendente. Il riavvolgimento ripristina entrambe; ricaricare una conferma già conclusa non concede una seconda crescita. Nessuna Domanda genera un Bonus Armata o un’Eminenza implicita.

### E01 La prima risposta

Dopo I.4, prima di I.5. Testo proposto: «Il varco è alle vostre spalle. Alcuni ti seguono per scelta, altri perché sono stati sconfitti. La Domanda prende forma: che cosa sei disposto a diventare per guidarli?»

Domanda filosofica: «Su che cosa vuoi fondare la tua forza?» Le otto risposte di queste due pagine appartengono allo stesso evento e sono tutte consultabili. Ciascuna apre soltanto la domanda militare della propria riga. La conseguenza meccanica è mostrata prima della conferma; nessuna risposta assegna un orientamento morale o preclude le altre in futuro.

| Risposta filosofica | Domanda militare | Risposta ed esito candidato |
| --- | --- | --- |
| «Sulla capacità di prevalere.» | «Come vuoi ottenere il vantaggio?» | «Prendendo l’iniziativa.» → C1, Imboscata: +2 POT.<br>«Concentrando lo sforzo all’apertura.» → C2, Turbo: +6 VA. |
| «Sulla forza di ogni colpo.» | «Quando deve pesare di più il tuo attacco?» | «Quando sono io a scegliere per primo.» → A1, Imboscata: +2 DAN.<br>«Quando rischio di essere sopraffatto.» → A2, Rimonta: +1 POT, +1 DAN. |
| «Sui limiti che impongo al nemico.» | «Come vuoi contenere il suo assalto?» | «Riducendone la forza prima che reagisca.» → S1, Imboscata: −2 POT nemiche, min 2.<br>«Contendendogli il terreno dopo la sua avanzata.» → S2, Resistenza: −6 VA nemico, min 5. |
| «Sulla capacità di resistere.» | «Come vuoi proteggere chi ti segue?» | «Recuperando dopo una conquista nemica.» → G1, Resistenza: Cura 2.<br>«Rispondendo al colpo che sta preparando.» → G2, Intervento: −2 DAN nemici, min 1. |

L’anteprima indica: Nascente 2 POT / 2 DAN, Potere scelto e condizione del trigger. Imboscata richiede di scegliere per primi; Intervento per secondi; Turbo vale nei round 1–2; Rimonta richiede meno PV del nemico; Resistenza richiede almeno un Campo conquistato dal nemico. Le frasi narrative non sostituiscono queste condizioni.

Conferma applica un solo pacchetto. «Non ho ancora una risposta» completa E01 conservando il Nascente 2/2 senza Potere; non sblocca una ricompensa alternativa. Il recupero negli eventi successivi è descritto sotto.

### E01 Le altre risposte

Stesso evento e stessa Domanda: «Su che cosa vuoi fondare la tua forza?» Queste risposte completano la scelta precedente; non richiedono un secondo nodo, una specifica composizione o l’adesione a un archetipo.

| Risposta filosofica | Domanda militare | Risposta ed esito candidato |
| --- | --- | --- |
| «Sul prezzo che faccio pagare.» | «Quando deve pagarlo il nemico?» | «Appena prendo l’iniziativa.» → K1, Imboscata: 2 danni diretti.<br>«Anche quando riesce a battermi.» → K2, Ultimo Desiderio: 3 danni diretti. |
| «Sulle risorse per continuare.» | «Come vuoi alimentare la battaglia?» | «Preparando subito le prossime mosse.» → F1, Turbo: +1 FC.<br>«Ricavando risorse dalle vittorie.» → F2, Conquista: +2 FC. |
| «Sulla rottura dei loro accordi.» | «Quando vuoi interrompere il Bonus nemico?» | «Dopo aver visto la sua scelta.» → B1, Intervento: Blocca Bonus.<br>«Nei primi momenti dello scontro.» → B2, Turbo: Blocca Bonus. |
| «Sul peso che accetto di portare.» | Un solo esito Colosso; anteprima diretta. | O1, Conquista: −3 PV a te. Corpo candidato 4 POT / 2 DAN: +2 POT di forma sul corpo originale 2/2. Nessuna seconda domanda fittizia. |

Ultimo Desiderio si risolve quando perdi il duello, Conquista quando lo vinci. I danni diretti non sono DAN aggiunto alla carta. Le FC ottenute entrano nella riserva di risorse e non modificano retroattivamente la puntata già fissata. Blocca Bonus segue le normali protezioni e interazioni; non garantisce di disattivare il nemico in ogni situazione.

Per Colosso l’anteprima dichiara insieme vantaggio e costo: «Più forza per conquistare; ogni vittoria ti costa 3 PV». Il costo può portare a zero; nessuna immunità del protagonista. I 2 DAN sono quelli della forma: una successiva modifica indipendente del DAN resta possibile e deve risultare separata.

Tracciamento di design: C = Campione, A = Assaltatore, S = Soffocatore, G = Guardiano, K = Carnefice, F = Catalizzatore, B = Sabotatore, O = Colosso. Questi codici identificano i pacchetti, non le Faglie F1/F2. Nel testo presentato al giocatore contano domanda, risposta ed effetto completo.

I quindici esiti riprendono il catalogo candidato del capitolo 12. Le due pagine coprono tutte le sue righe, senza combinare liberamente trigger ed effetti né attribuire una Lega definitiva non ancora verificata.

### E02 Ciò che hai imparato

Dopo I.6 e prima della Faglia obbligatoria F1. Testo proposto: «Hai superato la difesa della Seconda Campana. I compagni attendono un ordine. La Domanda ritorna: che cosa vuoi rendere più saldo in te?»

| Risposta | Conseguenza candidata | Provenienza e limite |
| --- | --- | --- |
| «La forza per contendere il terreno.» | +1 POT base del Nascente. | Modifica indipendente; si conserva cambiando forma. |
| «La capacità di rendere decisiva una vittoria.» | +1 DAN base del Nascente. | Modifica indipendente; si conserva cambiando forma. |
| «Prima devo capire quale forza cercare.» | Se sei senza Potere: riapri E01 e acquisisci un pacchetto iniziale. | Alternativa al +1 statistico, non un beneficio aggiuntivo. |
| «Per ora, ciò che sono basta.» | Conserva il Nascente attuale. | Completa la tappa; nessun credito da spendere in seguito. |

Una sola scelta confermata. L’opzione di acquisizione compare solo se manca il Potere; chi lo possiede potrà cambiarlo in E03. Il +1 statistico resta disponibile anche senza Potere. Acquisire Colosso in seguito aggiunge soltanto i suoi modificatori di forma al corpo già costruito.

Esempi: Colosso 4/2 con +1 POT indipendente diventa 5/2; uscendo da Colosso resta 3/2. Scegliendo invece +1 DAN diventa 4/3 e, uscendo dalla forma, resta 2/3. La forma continua a fornire soltanto +2 POT: il DAN aggiuntivo proviene dall’evento.

Se un incremento supera il cap adottato, l’opzione è indisponibile e ne mostra il motivo: non consuma la scelta. Restano l’altra statistica, se valida, e Conserva. Non si converte automaticamente un incremento vietato in PV, FC, premio o punti da accumulare. La Lega del corpo completo deve essere validata anche quando il Potere resta identico.

L’anteprima confronta corpo attuale e risultante, Potere, modifiche indipendenti e di forma. La conferma conclude una sola tappa: secondo la regola di maturazione, il prigioniero di I.6 diventa trasformabile prima di F1. Questo vale anche scegliendo Conserva; aprire la schermata senza risolverla non completa la tappa.

### E03 Una risposta alla prova

Dopo I.11, prima del boss. Testo proposto: «L’ultima difesa ha ceduto, ma la porta resta davanti a voi. Hai visto ciò che la tua risposta può ottenere e ciò che lascia scoperto. Vuoi renderla più incisiva, oppure rispondere diversamente?»

Tre vie: «Approfondire la mia risposta» apre una sola evoluzione della tabella; «Cambiare ciò su cui faccio affidamento» riapre tutti i quindici pacchetti iniziali E01; «Conservare la mia risposta» completa la tappa senza modifica. Se sei ancora senza Potere, acquisirne uno tramite E01 sostituisce l’evoluzione.

| Pacchetto | Evoluzione candidata | Vincolo |
| --- | --- | --- |
| C1 / C2 | +2 POT → +3 POT / +6 VA → +8 VA | Trigger invariato. |
| A1 | +2 DAN → +3 DAN | Richiede ancora di vincere per infliggere DAN. |
| A2 | +2 POT, +1 DAN oppure +1 POT, +2 DAN | Scegli una sola componente; sostituisce il vecchio +2/+2. |
| S1 / S2 | −2 POT → −3 POT / −6 VA → −8 VA | Minimi invariati: rispettivamente 2 e 5. |
| G1 / G2 | Cura 2 → 3 / −2 DAN → −3 DAN | Tetto della cura ordinario; minimo DAN 1. |
| K1 | 2 danni diretti → 3 | Imboscata invariata. |
| F1 | +1 FC → +2 FC | Turbo invariato; non aumenta la puntata corrente. |
| K2 / F2 / B1 / B2 | Potere invariato; +1 POT indipendente | Si conserva cambiando forma. Per K2 può ridurre la frequenza della sconfitta richiesta. |
| O1 | +2 POT di forma → +3 POT di forma | Costo −3 PV e DAN di forma 2 invariati; si rimuove tutta la POT di forma quando la abbandoni. |

Cambiare sceglie un pacchetto iniziale completo, conservando le statistiche indipendenti di E02. Si rimuovono il vecchio Potere e i modificatori della sua forma; non si ottiene anche l’evoluzione di questa tabella. Tornare sullo stesso pacchetto non accumula statistiche. Esempio: Colosso 5/2, di cui +1 POT indipendente, diventa C1 3/2 con Imboscata: +2 POT.

Se l’evoluzione statistica indipendente supera un cap, può essere proposta +1 DAN indipendente al suo posto, se valida, con anteprima esplicita. Per ogni altro esito non valido restano Cambio o Conserva; nessun premio sostitutivo automatico. Le singole evoluzioni sono candidate da prezzare, non incrementi già dichiarati equivalenti.

La conferma salva pacchetto e provenienza delle modifiche una sola volta. Ricaricare riprende la scelta o l’esito salvato; retry del boss non riapre E03. Il riavvolgimento precedente all’evento ripristina corpo e Potere precedenti. Nessun evento modifica le mani casuali, l’identità dei prigionieri o il Bonus Armata del Nascente.

## 16  Eventi di comando e preparazione

Stato: Proposte degli atti successivi da rivedere dopo la chiusura dell’Atto I.

| Evento | Scelte complete | Conseguenze |
| --- | --- | --- |
| E05 Voci del comando | Dopo II.1: Domanda, Coro e Varco sempre disponibili; Comunione con almeno tre armate nell’esercito selezionato. Anteprima delle regole e gestione prima della conferma. | Scegli esattamente una Eminenza, attiva dalla battaglia II.2. Non si può saltare; nessun costo. Resta fino alla fine salvo riavvolgimento. |
| E09 Preparare il varco | Dopo II.9 e III.9: Scorte +2 FC iniziali; Protezione +3 PV iniziali; oppure conserva. | Un beneficio nella prossima battaglia. Sostituisce lo slot Preparazione solo dopo conferma. Non si accumula. |
| Preparazione dal premio | Eventuale premio alternativo, se successivamente approvato: +1 FC iniziale oppure passa. | Stesso slot di E09; se hai già un beneficio, lo tieni o lo sostituisci. Nessuna somma automatica. |

E05 propone ancora, coro e varco a tutti, indipendentemente dalle scelte morali precedenti. Il ramo aggiuntivo della Comunione richiede almeno tre armate nell’esercito selezionato, come precisato al capitolo 19. Ogni opzione mostra requisiti e conseguenze; la scelta determina la voce dei passaggi successivi e una parte dell’epilogo.

E09 non cura ferite persistenti, perché le risorse si ripristinano fra battaglie. È una scelta fra due vantaggi per il prossimo incontro. Il buff rimane per tutti i tentativi di quella battaglia e viene consumato soltanto alla vittoria; non si perde su un pareggio.

### Perimetro degli eventi

Preparare l’esercito, consultare le carte e trasformare un prigioniero già abilitato sono operazioni fra incontri; non fanno trascorrere una tappa. I premi alternativi per esaurimento della pool non sono definiti dalla sola tabella Preparazione.

## 17  Scelte narrative e conseguenze

Stato: Scene e conseguenze candidate; da raccordare alla via di comunione e al reclutamento reale.

| Evento e testo di scena | Opzioni visibili | Esito esatto |
| --- | --- | --- |
| E06 Prigionieri del Vallo · dopo I.8. «Hanno deposto le armi. Le campane continuano a suonare». | Liberali; trattienili; oppure, se soddisfi il requisito, lascia parlare i Concordia conservati. Dettagli candidati al capitolo 10. | Liberi: +3 PV; Trattenuti: +2 FC; Comunione: +2 FC e flag COMUNIONE_VALLO. Una sola Preparazione; nessun consumo delle copie conservate per Comunione. |
| E07 Archivio delle voci · dopo II.6. «Qui conservano nomi che la Fusione avrebbe cancellato». | Custodisci l’archivio; oppure trasforma le tracce conservate. | Custodisci: flag ARCHIVIO, Preparazione +3 PV. Richiama: flag ECHI, ricompensa narrativa da ridefinire con il sistema attuale, nessun buff già stabilito. |
| E08 La soglia · dopo III.6. «La città apre una porta. Non ti ha ancora chiesto di entrare». | Limita il Richiamo a chi lo accetta; oppure estendilo alla città. | Consenso: flag CONSENSO, Preparazione +3 PV. Estendi: flag ESTENSIONE, Preparazione +2 FC. Nessun cambio automatico di Eminenza. |

Una sola opzione per evento. La conseguenza meccanica è visibile prima della conferma; le reazioni narrative non contengono penalità segrete. I flag sono alternativi all’interno di ciascuna coppia e persistono fino al finale. Un riavvolgimento precedente alla scelta li ripristina.

### Epilogo deterministico

L’epilogo è composto da quattro paragrafi: esito della città da E08; sorte delle persone da E06; sorte della memoria da E07; interpretazione del Nascente dalla sua Eminenza. Nessun finale viene estratto casualmente e non esiste un punteggio morale nascosto.

| Scelta | Conseguenza narrativa obbligatoria |
| --- | --- |
| CONSENSO / ESTENSIONE | La città rimane una comunità autonoma che negozia / entra nella Fusione con dissenso ancora presente. |
| LIBERI / TRATTENUTI / COMUNIONE_VALLO | Un ex prigioniero torna come interlocutore / i familiari chiedono conto della detenzione / i Concordia conservati rendono possibile una trattativa al Vallo. |
| ARCHIVIO / ECHI | I nomi restano consultabili da tutti / le voci sopravvivono dentro i Richiamati. |
| Domanda / Coro / Varco | Il Nascente assume un ruolo di custode / di voce collettiva / di tramite fra comunità. |

Prima dei boss II e III compare una breve reazione ai flag già presenti; non completa una nuova tappa. Il comandante nemico sconfitto viene nominato nell’epilogo, senza alterare le regole di vittoria. La scrittura dei dialoghi può essere rifinita mantenendo queste conseguenze.

## 18  Piani e buff della Concordia

Stato: Scelta dei buff tramite i nodi confermata; coppie numeriche, durata e distribuzione proposte.

| Coppia | Ramo A blocca e lascia | Ramo B blocca e lascia |
| --- | --- | --- |
| P1 Logistica | Blocca Corazze; attiva Riserve, +2 FC iniziali nemiche. | Blocca Riserve; attiva Corazze, +2 PV iniziali nemici. |
| P2 Dottrina | Blocca Assalto; attiva Tenuta, il primo DAN subito dalla Concordia è ridotto di 1, min 0. | Blocca Tenuta; attiva Assalto, il primo DAN inflitto vincendo è aumentato di 1. |
| P3 Segnali | Blocca Coro; attiva Segnali, +1 FC nemica a fine secondo duello se la battaglia continua. | Blocca Segnali; attiva Coro, +1 Presenza iniziale all’Eminenza nemica. |

I soggetti di Tenuta e Assalto sono la Concordia: Tenuta riduce il primo danno da DAN che essa subisce; Assalto aumenta il primo DAN che essa infligge. Non riguardano danni diretti, costi, maledizioni o terreno. Il marcatore si consuma solo quando quel danno viene applicato. Si azzera a ogni nuovo tentativo.

Due bivi per atto: I P1/P2; II P3/P1; III P2/P3. Una coppia compare una sola volta nello stesso atto, quindi due buff attivi al massimo. Durano fino al boss dell’atto incluso e poi vengono rimossi. Non si applicano agli speciali esterni. Rifiutare una ricompensa non cambia il piano.

Il buff alternativo si attiva dopo la vittoria del nodo scelto, per le battaglie successive. Scelta e attivazione sono reversibili soltanto ripristinando una tappa precedente. Le regole della categoria élite o boss sono separate e vengono mostrate accanto ai buff.

## 19  Eminenze del giocatore

Stato: Accesso poco dopo l’inizio dell’Atto II confermato. Scelte, valori e blocco del cambio sono proposte.

Una sola Eminenza, scelta in E05 dopo II.1; Presenza ripristinata a ogni battaglia, nessun trasferimento dei poteri del precedente scontro. Una sola abilità scelta per duello secondo i gate e i costi del motore. Un costo negativo richiede Presenza già disponibile al momento della scelta; non si paga con Presenza che si spera di ottenere dopo.

### La Domanda Senza Fine · riferimento del catalogo esaminato

Presenza iniziale 2. Ancorato: FC reali investite ≥ 6 − Lega effettiva + aumenti cumulativi del requisito; FC temporanee escluse. A fine duello, se il tuo Agente era Ancorato, +1 Presenza. Deriva +1: aumenta di 1 il requisito per tutta la battaglia, già dal duello corrente. Leggerezza −2: prima del controllo dei trigger, se sei Ancorato il trigger del tuo Agente è soddisfatto; non supera un blocco. Risposta −3: nello stesso controllo concede Immune all’Agente Ancorato per il duello. La formulazione storica «inizio dello Scontro» viene chiarita come timing del duello corrente, coerente con i segmenti del catalogo.

### Il Coro dei Richiamati · nuova carta di campagna

Presenza iniziale 2. Statico: a fine duello, +1 Presenza se il tuo Agente ha Lega effettiva 2 o 3; una sola volta per duello, anche se sconfitto. Ascolto +1: dopo la rivelazione il tuo Agente perde 1 POT, min 1, per il duello. Risposta comune −2: ottieni 2 FC a fine duello, disponibili dal successivo. Coro pieno −4: dopo la rivelazione il tuo Agente ottiene +2 POT e +1 DAN per il duello. La risorsa viene pagata anche se un effetto successivo rende il beneficio inutile.

### Il Varco Incompiuto · nuova carta di campagna

Presenza iniziale 2. Statico: a fine duello, +1 Presenza se hai scelto per secondo; una sola volta. Attesa +1: dopo la rivelazione il tuo Agente perde 1 DAN, min 0, per il duello. Riflesso −2: dopo la rivelazione riduci la POT nemica di 1, min 2, per il duello; Immune può impedirlo. Passaggio −4: prima dei trigger, considera soddisfatto il trigger del tuo Potere in questo duello; non supera Blocca Potere e non forza il Bonus Armata.

Le carte di campagna non sostituiscono Eminenze già esistenti nelle altre modalità. Il Bonus dei Figli resta −5 VA nemico, min 6. Domanda, Coro e Varco restano sempre disponibili e non richiedono il Nascente nel mazzo. La proposta 0.14 aggiunge un’Eminenza per il percorso della Comunione, accessibile con tre armate. Domanda premia Ancorato, Coro le Leghe basse, Varco la flessibilità; Comunione rende utilizzabili i Bonus delle armate rappresentate da un solo agente.

La scelta resta fino al finale. Per cambiarla occorre riavvolgere fino a prima di E05 o iniziare un’altra campagna; non esiste un costo di cambio non definito. Il finale usa l’Eminenza effettivamente scelta in questa linea temporale.

### Il percorso della Comunione

Proposta 0.14. La Comunione riconosce un esercito che riunisce agenti di origini diverse mantenendone l’identità. Il ramo richiede almeno tre armate nell’esercito selezionato e offre una nuova Eminenza all’inizio dell’Atto II. Il nome Comunione è provvisorio; non coincide con la Concordia di Caelion, che resta una specifica armata.

Accesso proposto in E05, dopo II.1: contare le armate distinte degli agenti presenti nella formazione di campagna, prima della selezione della mano di battaglia. Contano le identità attuali delle carte; il Nascente conta come Figlio dell’Orizzonte. Riserva, Eminenza e numero di copie non aumentano il conteggio. Una carta trasformata conta per i Figli, non più per la sua armata di origine. Il controllo usa una formazione legale per posti e budget.

La schermata mostra sempre il ramo e il requisito «Schiera agenti di almeno tre armate diverse», insieme al conteggio attuale. Prima della conferma è possibile aprire la gestione e riorganizzare l’esercito. Il requisito si ricontrolla alla conferma: avere posseduto tre armate in passato non basta. Non serve ottenere casualmente tre armate nella mano iniziale.

La prima Faglia rende il ramo raggiungibile senza la deviazione opzionale: Nascente, un Concordia e il Calibro di F1 rappresentano già tre armate. Occorre conservarle e inserirle nella formazione. Il Kethran di F2 aggiunge un’alternativa e permette di mantenere tre origini anche trasformando un altro invasore. Nessun agente viene assegnato fuori dal roster affrontato per rendere disponibile il ramo.

Il requisito riguarda l’ingresso nel percorso. Una volta scelta l’Eminenza, la proposta conserva ramo e carta anche se l’esercito cambia o scende sotto tre armate. Lo Statico non richiede di ricontare tre armate a ogni battaglia. La scelta ha quindi un requisito esplicito di accesso, non un obbligo permanente di composizione. Resta valida la regola generale di una sola Eminenza fino al finale, salvo riavvolgimento precedente a E05.

Raccordo narrativo proposto: E05 chiede se sia possibile condividere una causa senza condividere una sola risposta. Scegliere Comunione registra il percorso e la formazione che ne ha consentito l’accesso. Da II.2 le scene di comando adottano questa prospettiva. Non aggiunge combattimenti o tappe; nel primo atto ne preparano la possibilità le catture e le Faglie.

E06 può riconoscere compagni Concordia conservati, ma il suo flag non è necessario per Comunione e non ne soddisfa da solo il requisito. E07 ed E08 mantengono tutte le proprie opzioni: il percorso non obbliga a una risposta morale. L’epilogo conserva gli esiti degli eventi e usa, nel paragrafo dell’Eminenza, la prospettiva della convivenza. I testi delle scene restano da scrivere; non sono previsti premi automatici ulteriori.

### Statico della Comunione e interazioni

Testo proposto: «Il requisito di composizione del Bonus Armata dei tuoi agenti è sempre soddisfatto». Ogni agente può quindi accedere al proprio Bonus anche quando è l’unico rappresentante della sua armata nella mano iniziale. Lo Statico opera soltanto sul tuo lato, mentre questa Eminenza è attiva.

L’effetto soddisfa soltanto il numero di agenti richiesto. Il trigger del Bonus deve verificarsi normalmente; blocchi, sostituzioni, annullamenti e priorità continuano a seguire il motore. Il Bonus non è considerato attivato solo perché disponibile: Staffetta ed effetti che leggono un’attivazione precedente devono osservare la risoluzione effettiva. Non si attribuiscono tutte le armate a ogni carta e non si copiano o sommano Bonus diversi.

| Caso | Risultato con lo Statico |
| --- | --- |
| Un solo Calibro | Il suo Bonus supera il requisito di composizione; restano validi limiti e blocchi. |
| Un solo Kethran | Il Bonus è disponibile, ma Rimonta deve comunque verificarsi. |
| Un solo Concordia | Staffetta deve trovare il primo duello o una precedente attivazione valida, secondo la sua regola. |
| Blocca Bonus sul tuo agente | Lo Statico non protegge il Bonus. La disponibilità non supera il blocco. |
| Bonus sostituito o annullato | Si segue la normale risoluzione dell’effetto; lo Statico non ripristina il Bonus originale. |
| Torre del Richiamo | Soddisfa Staffetta secondo il proprio timing; lo Statico soddisfa la composizione. Nessuno dei due supera un blocco. |

Il vantaggio cresce soprattutto nelle mani con molte armate singole. Se una coppia rendeva già disponibile un Bonus, lo Statico non ne raddoppia l’effetto. Il confronto di bilanciamento deve usare le stesse mani e risorse con e senza l’Eminenza, includendo armate miste, coppie già valide e avversari capaci di bloccare il Bonus. Non si presume un costo uguale per Bonus di armate diverse.

Perimetro della carta: questo blocco definisce il requisito del percorso e lo Statico. Presenza iniziale, abilità attive e loro costi richiedono una scheda successiva prima dell’implementazione; non vengono ereditati da Coro o Varco. Non è ancora una carta completa da inserire nel catalogo.

Salvare percorso, Eminenza scelta e formazione d’ingresso insieme alla conferma di E05. Retry e ricaricamento non riaprono la scelta; riavvolgere prima di E05 ripristina lo stato precedente. Nel codice locale calcInitialBonuses verifica le quantità nella mano: l’eccezione futura deve restare legata all’Eminenza, senza modificare globalmente la soglia delle armate o registrare false attivazioni.

## 20  Eminenze nemiche e successione

Stato: Influenza del percorso confermata. Carte, valori e successione specifica proposti.

La Concordia non usa Eminenze nell’Atto I né in II.1–II.3. Dopo II.3: ramo A di P3 lascia Segnali e favorisce Le Campane del Vallo; ramo B lascia Coro e favorisce La Bandiera del Vespro. Il comando resta per il resto dell’Atto II e passa all’Atto III.

Dopo III.7: ramo A di P3 conserva il comando precedente e lascia Segnali; ramo B lo sostituisce con L’Archivio dei Nomi e lascia Coro. La mappa mostra sia buff sia Eminenza risultante prima della scelta. Il nuovo comando vale da III.8; non partecipa retroattivamente al bivio.

### Le Campane del Vallo · catalogo della Concordia

Presenza iniziale 1. Statico: +1 Presenza a fine duello se ha scelto per secondo. Serrate le porte +1: proprio Agente −1 POT, min 1; Agente avversario −1 DAN, min 1, nel duello. Alla seconda campana −2: prima dei trigger forza Intervento e Resistenza per proprio Potere e Bonus; blocchi e divieti restano validi. Sortita del Vallo −4: proprio Agente +2 POT e +2 DAN nel duello.

### La Bandiera del Vespro · nuova carta nemica

Presenza iniziale 1. Statico: +1 Presenza a fine duello vinto. Disciplina +1: dopo la rivelazione il proprio Agente perde 1 DAN, min 0. Carica −2: dopo la rivelazione ottiene +2 POT nel duello. Inseguimento −4: dopo la rivelazione ottiene +2 DAN nel duello. Nessuna risorsa o modificatore permanente si accumula fra battaglie.

### L’Archivio dei Nomi · nuova carta nemica

Presenza iniziale 1. Statico: +1 Presenza a fine duello perso. Registrare +1: dopo la rivelazione il proprio Agente perde 1 POT, min 1. Obiezione −2: dopo la rivelazione l’avversario perde 1 DAN, min 1, nel duello. Decreto −4: prima dei trigger blocca il Potere avversario nel duello. Effetti, protezioni e blocchi si risolvono con le primitive standard.

Il buff Coro aggiunge 1 alla Presenza iniziale dell’Eminenza in ogni battaglia, non concede un secondo Statico. Nessun nemico usa più Eminenze insieme. Nei boss il comandante è quello derivato dal percorso, mentre la carta firma è quella prevista dal boss.

IA candidata per le due nuove Eminenze: prova prima l’abilità costosa se rende vincente un duello altrimenti perso; poi l’abilità da −2 con lo stesso criterio; altrimenti usa +1 solo se il costo non cambia una vittoria prevista in sconfitta; in caso contrario passa. La simulazione usa soltanto informazioni pubbliche e scenari legali.

## 21  Risorse buff temporanei e limiti

Stato: Numeri e soglie candidati. Non certificati dai test.

| Fase | PV base giocatore | FC base giocatore |
| --- | --- | --- |
| Avvio fino a I.4 | 10 | 10 |
| I.5–I.6 | 25 | 18 |
| I.7–I.11 | 25 proposti | 18 proposti |
| Da I.12 | 25 | 18 |

All’apertura di ogni nodo di battaglia si ripristinano PV e FC base, poi si applica Preparazione. Fra le squadre dello stesso nodo si conservano i PV e si ripristinano soltanto gli FC. Fra nodi diversi, danni, FC spese, maledizioni e stati non persistono; nessuna morte permanente, cura esterna o riparazione. Per I.5–I.6 proponiamo 25 PV e 18 FC al posto di 15/13. Per I.7–I.12 il capitolo 7 propone ancora 25 PV e 18 FC; nessun ritorno a 20/16. Posti schierabili e risorse hanno progressioni distinte.

Il nemico parte dai medesimi valori base previsti dalla posizione della campagna, poi riceve crescita e modificatori: Atto I nessun incremento di base; Atto II +2 PV/+1 FC; Atto III +4 PV/+2 FC. Élite +2 PV; boss +4 PV. Si aggiungono infine i buff della Concordia. I primi incontri usano i valori base; la disponibilità dei Bonus dipende dalle composizioni, senza disattivazione globale.

### Uno slot Preparazione

Benefici possibili: +1 FC, +2 FC oppure +3 PV iniziali per la prossima battaglia. Si può mantenerne uno soltanto. Una nuova offerta mostra Mantieni attuale o Sostituisci; se non esiste un buff, si può accettare o rifiutare. Il beneficio si consuma alla vittoria di quella battaglia, resta identico in tutti i tentativi e non scade attraversando un evento narrativo.

Limiti di campagna: PV iniziali ≤40, FC iniziali ≤24. Sono limiti della preparazione, non sostituiscono i limiti interni del motore per guadagni durante il duello. Nessun incremento iniziale viene perso senza che l’anteprima lo mostri. In questa proposta il massimo iniziale nemico raggiungibile è 33 PV e 21 FC: boss II con Corazze per i PV, con Riserve per le FC. I due massimi non richiedono di coesistere.

I buff non hanno costi nascosti, non cambiano numero di carte e non riducono le risorse base permanentemente. Il riavvolgimento recupera anche crescita base, Preparazione e stato dei piani. Ricaricare un salvataggio conserva il beneficio già consumato o ancora disponibile correttamente.

## 22  Sconfitta pareggio e ritorno temporale

Stato: Riprova o ritorno temporale di tre tappe confermati; dettagli aggiuntivi restano proposte.

Riprova: torna alla preparazione del medesimo incontro con le risorse iniziali, carte possedute, buff e nemico del tentativo. Puoi riorganizzare l’esercito prima del nuovo tentativo. La configurazione nemica e il premio non vengono rigenerati per effetto della riorganizzazione. Tentativi illimitati, nessun aumento di difficoltà.

Riavvolgi: annulla tre tappe completate prima del tentativo fallito e ripristina lo stato precedente alla selezione del nodo di destinazione. Esempio: sconfitta alla tappa 8 → prima della tappa 5. Si annullano 5, 6, 7 e il tentativo 8. Se mancano tre tappe, si torna all’inizio. Si può attraversare un confine d’atto; si perdono anche premi del boss e sblocchi successivi.

Per chiudere la regola delle ripetizioni: ogni riavvolgimento è disponibile solo dopo una sconfitta, senza limite di utilizzi. Può riportare progressivamente fino all’inizio, ma annulla ogni guadagno successivo: non genera risorse. Non viene descritto come permanenza del bottino nel passato.

Pareggio: torna alla preparazione dello stesso incontro, senza completamento e senza premio; non concede direttamente riavvolgimento. Abbandono volontario di una battaglia: conta come sconfitta e offre le due opzioni. Uscire dall’app sospende il tentativo; non è un abbandono né una nuova assegnazione di ricompensa.

Ogni snapshot include storia dei nodi, esercito, riserva con ID delle singole copie, prigionieri e loro maturazione, trasformazioni, Nascente, risorse base, Preparazione, piani, comando, Eminenza, flag e riconoscimenti per copie conservate, seme e stato dei premi. Il diario può mostrare ricordi della linea annullata separatamente, ma essi non sbloccano carte o scelte. Nella prima versione il riavvolgimento non viene giustificato come potere canonico del Nascente.

## 23  Schermate e informazioni di gioco

Stato: Layout conservato; contenuti aggiornati al reclutamento e alle nuove meccaniche.

| Schermata | Contenuto e azioni obbligatorie |
| --- | --- |
| Ingresso | Nuova campagna o continua; descrizione dei tre atti e regola della sconfitta. |
| Mappa | Tappa, posizione di battaglia, rami accessibili, buff, comando previsto. Ispeziona, Armata, Affronta. |
| Armata | Carte richieste, riserva, prigionieri trasformabili, Nascente ed Eminenza; controlli di legalità approvati. |
| Ricompensa | Agente ottenuto, identità originale, Lega e momento di abilitazione alla trasformazione. |
| Evento | Scena, testo breve, scelte, anteprima numerica e narrativa, conferma. |
| Sconfitta | Riprova; Riavvolgi con destinazione e lista degli esiti annullati. |
| Diario e finale | Scelte effettive, piani impediti/attivi, origini delle carte e conseguenze narrative. |

L’interfaccia conserva mappa illustrata, figure dei comandanti e stadi del Nascente. Selezione e avanzamento hanno animazioni brevi saltabili; nessun movimento cambia il risultato. Icone e testo distinguono ordinari, élite, speciali, boss ed eventi. La modalità movimento ridotto mantiene tutte le informazioni.

La scheda del Nascente separa corpo originale, modifiche della forma e modifiche indipendenti. La schermata di trasformazione mostra pool di pari Lega e assenza di doppioni. Il log di battaglia mostra fonte di Terraformare, Campo prima e dopo e attivazione effettiva del Bonus. Le indicazioni «conversioni possibili» nello schema si riferiscono ora alle pool casuali di pari Lega.

## 24  Editor della campagna e salvataggi

Stato: contratto del prototipo consolidato nella 0.25. Le strutture indicate devono essere mappate al codice esistente; non sono API già implementate.

L’editor raccoglie le regole di campagna in dati versionati. Non richiede nuove condizioni arbitrarie scritte in codice per ogni incontro. Le configurazioni vengono validate prima della pubblicazione.

| Scheda | Dati richiesti |
| --- | --- |
| Campagna | Versione, atti, grafo delle tappe, cataloghi e progressione. |
| Incontro | Categoria, composizione iniziale completa oppure carte obbligatorie e varianti ammesse; parità numerica; risorse; Campi; premio; piani. |
| Campo | ID, testo, ordine di rivelazione, regole e timing; compatibilità con Terraformare. |
| Domanda | Testo filosofico o militare, risposte, destinazioni e anteprima del Potere completo. |
| Nascente | Pacchetti, statistiche originali, modifiche della forma e indipendenti, Lega provvisoria esplicita nel profilo della campagna. |
| Reclutamento | Pool dal roster nemico; copie Concordia in riserva con ID individuale; origine, maturazione ed eventuali esclusioni. |
| Trasformazione | Tappa di ottenimento, tappa successiva completata, pool Figli di pari Lega, esito salvato. |
| Piano | Rami, buff impedito e lasciato, durata e influenza sul comando. |
| Salvataggio | Stato, versione dati, snapshot, premi unici, composizioni iniziali e scelte. |

Controlli: carte obbligatorie entro i posti; nessun doppione nello schieramento; copie Concordia ammesse in riserva con ID individuali; premi presenti nel roster nemico; trasformazioni senza Figli duplicati; pool e fallback espliciti; crescita verificata anche senza trasformare; timing, budget ed Eminenze coerenti con l’atto.

La compatibilità di Terraformare comprende l’intero contratto del capitolo 14. Una destinazione non validata non deve apparire come pronta. L’editor deve ora descrivere anche il ricambio delle squadre fra fasi; non sono richiesti calendario o pesca libera durante i duelli.

Ogni ricompensa o trasformazione ha un ID e si applica una sola volta. Le campagne già avviate mantengono la versione dei dati; le migrazioni devono preservare la cronologia del riavvolgimento. Con le due Faglie dell’Atto I il totale candidato dei tre atti diventa 33 battaglie e 48 tappe obbligatorie; 34 e 49 affrontando anche F2. Nessuna Faglia ulteriore negli altri atti è inclusa in questi conteggi.

## 25  Verifiche della prima versione funzionante

Priorità approvata 0.24: funzionamento completo dell’Atto I. Bilanciamento e rifinitura degli incontri rinviati; nessun esito di prova dichiarato.

La prima versione deve consentire di avviare e completare l’atto con il profilo provvisorio del capitolo 26. Verificare preparazione, mani casuali, risoluzione, premi, eventi, riserva, ricambio e ripresa. Il pricing definitivo non è un requisito preliminare; ogni configurazione deve comunque avere dati completi.

| Area | Verifica necessaria |
| --- | --- |
| Prologo | I.1–I.4 con tutte le ricompense legali; disponibilità Bonus corretta; nessun Potere inesistente. |
| Crescita | Posti e identità sufficienti senza trasformazioni obbligate; esercito valido con i parametri provvisori. Il valore definitivo della Lega sarà bilanciato in seguito. |
| Mantenimento | Esercito misto e agenti originali utilizzabili; nessun vantaggio morale implicito. |
| Domanda | Otto famiglie e quindici esiti iniziali accessibili; anteprima fedele, conferma singola e recupero dopo il rifiuto. |
| Colosso | Costo PV, DAN 2 di forma, modifiche indipendenti e cambi ripetuti senza accumulo. |
| Staffetta | Attivazione effettiva precedente, primo duello, blocchi, sostituzioni, ripartenza sulla Torre. |
| I.6 | Roster fisso da cinque; G03 presente, senza posto aggiuntivo; trigger e blocchi normali; dopo la vittoria sei posti. |
| Premi | Premi appartenenti al roster nemico; copie in riserva; élite; riconoscimento senza consumi automatici o duplicazioni da retry. |
| Ritorno temporale | Ripristino di prigionieri, maturazione, forme, premi, Campi e buff. |
| Formati | 1v1 con Campo vittoria; 2–4 con Campi poi PV; 5 Classico. Squadre successive, reset FC e ritorno boss; PV conservati; annientamento chiude il nodo. Verificare premio unico e assenza di ricambio a zero PV. Formato ordinario oltre cinque: proposta 0.21 da validare. |

Restano necessarie la correttezza dei trigger e dei timing, la legalità delle transizioni e la gestione dei casi limite. La matrice di Terraformare è al capitolo 14. Difficoltà, percentuali di vittoria, valori ottimali e confronto fra pacchetti saranno valutati successivamente, insieme alla rifinitura dei singoli incontri.

I dati provvisori devono essere espliciti e sostituibili: roster, risorse, Campi, ricompense e Lega di prova. Una Lega assente non vale zero e non deve bloccare silenziosamente la progressione; occorre una configurazione provvisoria completa. I controlli su posti, identità, premi unici e possibilità di preparare un esercito restano funzionali. I conteggi precedenti non sono risultati di playtest.

## 26  Registro delle decisioni e fonti

Stato: Documento unico di riferimento; le nuove decisioni si integrano nei capitoli pertinenti.

| Area | Stato corrente |
| --- | --- |
| Identità | Narrativa rigiocabile; Nascente; Concordia principale; nessun calendario. |
| Reclutamento | Premio dal nemico affrontato; doppioni Concordia in riserva. Trasformazione facoltativa dopo una tappa in un Figlio di pari Lega non posseduto. |
| Nascente | Domande filosofiche e militari; otto archetipi accessibili; numeri dei pacchetti proposti. |
| Concordia | Staffetta; Torre; G03 con Terraformare nel sesto incontro. |
| Preparazione | Mani casuali del giocatore; garanzie e squadre nemiche dichiarate. Ricambio fra fasi; nessuna pesca libera durante i duelli. |
| Progressione | I.1–I.6 accolti. Crescita e riserva: cap. 10. I.7–I.12: roster, budget e mani di cinque proposti al cap. 7; bilanciamento da provare. |
| Atti successivi | Distribuzioni, eventi ed Eminenze conservati come proposte. |

### Priorità attuale e lavoro rinviato

Consolidamento 0.25: i due blocchi operativi seguenti fissano il riferimento del prototipo e risolvono i rinvii storici. Le schede dell’Atto I diventano configurazioni di lavoro modificabili, senza attestazione di equilibrio. Il lavoro successivo è l’implementazione e la verifica del percorso completo. Leghe definitive, difficoltà, composizioni e rifinitura narrativa restano rinviate. Comunione ed Eminenze successive non rientrano nella chiusura del primo atto.

### Profilo operativo del primo atto

Questo profilo adotta le configurazioni già descritte per la prima versione giocabile. Le etichette proposta o candidato nei capitoli precedenti indicano la loro origine e il carattere modificabile; non richiedono una nuova scelta durante l’implementazione. Restano escluse le varianti future e i confronti di bilanciamento.

#### Percorso e preparazione

Sequenza: I.1, I.2, I.3, I.4, E01, I.5 A/B, I.6, E02, F1, I.7, I.8, E06, I.9 A/B, F2 facoltativa, I.10, I.11, E03, I.12. I bivi scelgono una sola battaglia. Posti dopo I.1–I.4: 2/3/4/5; dopo I.6: 6; dopo I.8–I.11: 7/8/9/10. Gli altri nodi non aggiungono posti. Nessuna Eminenza nell’atto.

Preparare esattamente N identità possedute, Nascente compreso. Dall’incontro I.5 il tetto è 30 Lega; riserva esclusa. Fino a quattro carte entra tutto l’esercito; da cinque il Nascente è garantito all’apertura e gli altri quattro sono estratti uniformemente senza ripetizioni. Questa garanzia è il valore provvisorio già previsto, non una scelta della mano da parte del giocatore. Nel boss la seconda mano contiene i cinque esclusi.

#### Bonus, Campi e fasi

Il Bonus si rende disponibile con due agenti della stessa armata nella mano iniziale della fase. Disponibilità non significa attivazione. Staffetta verifica primo duello della fase oppure Bonus effettivamente attivato dal precedente agente del proprio lato. Torre soddisfa soltanto il trigger. I Campi ordinari seguono il calendario 1/1/1/3/4; I.1–I.4 e Faglie usano le liste dedicate. Il calendario ricomincia a ogni nuova fase.

I.1–I.4: 10 PV e 10 FC; da I.5: 25 PV e 18 FC, con modificatori dichiarati. Il boss usa le due squadre del capitolo 4; gli altri incontri dell’atto una sola fase. PV conservati al ricambio, FC ripristinati, Campi e conquiste nuovi, nessun premio intermedio. Applicare le priorità terminali del capitolo 4; annientamento chiude l’intero nodo. La seconda fase richiede la vittoria della prima con entrambi vivi.

#### Leghe di prova senza valutazione automatica

Scelta tecnica provvisoria 0.25: Nascente L2 iniziale e con qualsiasi pacchetto acquisito. Una modifica statistica E02 vale un gradino aggiuntivo; evolvere in E03 vale un altro gradino. Quindi Lega di prova = 2 + modifica E02 presente + evoluzione E03 presente, massimo L4. Conserva non aggiunge gradini. Acquisire un Potere tardivamente non aggiunge il gradino dell’evento cui si rinuncia; cambiare pacchetto in E03 mantiene E02 e non aggiunge evoluzione. Nessuna di queste cifre misura il valore reale del Potere.

G03 usa L3; gli altri agenti mantengono la Lega del catalogo. I cap del corpo del Nascente restano POT 7 e DAN 6. Questi dati servono a budget, anteprime, spareggi e trasformazioni: non si esegue il vecchio valutatore per sovrascriverli. Il modello numerico del capitolo 13 resta materiale per il bilanciamento futuro. Configurazioni prive di una Lega esplicita sono errori di dati, non carte a costo zero.

### Transizioni e condizioni di completamento

Gli stati seguenti descrivono un contratto da implementare. Non attestano che il motore locale li gestisca già. Ogni salvataggio conserva versione della campagna, nodo, fase e operazione pendente, insieme a esercito, copie, mani, Campi, risorse, modifiche, piani e semi casuali.

#### Avvio e risultato della battaglia

Dalla mappa si ispeziona senza impegnarsi. Affronta valida l’esercito e salva nodo, ramo, configurazione nemica e casualità del tentativo prima di mostrare la mano. Il seme delle mani è separato da quelli dei premi e delle trasformazioni: cambiare composizione non cambia il nemico o il premio. Stessa versione, nodo, seme e insieme ordinato di identità producono la stessa mano. L’iniziativa standard iniziale viene salvata, senza rilanci alla riapertura.

Una vittoria di fase con un’altra squadra prevista conduce al ricambio, applicato una sola volta. Una vittoria del nodo conduce al premio pendente; sconfitta e pareggio conducono ai rispettivi esiti, senza avanzamento. Il retry ritorna all’apertura dello stesso nodo con un nuovo tentativo: azzera lo stato del duello ed estrae nuovi Campi, mantenendo i vincoli dell’incontro. Consente riorganizzazione ma non assegnazione manuale delle mani. Uscire dall’app sospende. Il riavvolgimento usa gli snapshot di tre tappe completate precedenti come al capitolo 22.

#### Campi, mappa e trasformazioni — correzioni funzionali

I Campi ordinari sono estratti con il motore di rarità del duello, con un seme separato per nodo, tentativo e fase. Gli identificativi delle estrazioni di tutte le squadre vengono salvati all’avvio: riprendere un tentativo non li cambia; ritentare ne genera di nuovi. Il Varco introduttivo resta fisso. Negli incontri che prevedono la Torre del Richiamo, essa occupa il quarto o il quinto posto e il relativo posto speciale. Restano le rivelazioni concordate: quarto Campo al round 3, quinto al round 4. I tentativi già salvati con il formato precedente conservano i propri Campi fino al successivo avvio. Sfondi della pool casuale, carte e trasformazioni vengono precaricati all’ingresso in campagna.

La campagna usa lo stesso canvas logico 1920×1080 e lo stesso adattamento alla finestra del duello. La mappa scorre all’interno della scena; intestazione, riepilogo dell’armata e dettaglio dell’incontro mantengono il proprio posto. Tappe e tracciati condividono le coordinate: i bivi si separano e si ricongiungono, F2 dispone di una deviazione facoltativa e di un collegamento che la evita. Il percorso effettivamente compiuto è evidenziato; le alternative lasciate indietro sono attenuate.

Armata e riserva hanno viste distinte. Per trasformare si seleziona una copia, se ne leggono maturità, costo ed esiti possibili e si conferma il consumo. Il Figlio di pari Lega rimane casuale: gli esiti elencati non sono selezionabili. Dopo il salvataggio si mostra la carta ottenuta. Gli eventi del Nascente separano temi filosofici, risposte e anteprima della carta; nessuna selezione è applicata prima della conferma.

#### Premio e gestione

Ordinario e Faglia: un’identità uniforme dal roster intero; élite e boss: due identità distinte uniformi, una scelta. I.1 assegna V02; I.12 esclude N01 ma include V02. Offerte e scelta pendente sono salvate. Dopo la scelta si calcola l’eventuale rinforzo non posseduto del medesimo roster, soltanto nelle tappe di crescita. Si confermano insieme copie, posti, piano e completamento del nodo: nessuno stato può ricevere il premio due volte.

Ogni copia registra la tappa di acquisizione. Con k tappe completate, è matura quando k è almeno acquisizione + 1. La tappa che assegna la copia non la matura. Gestione, retry, ricambio e transizione d’atto non aumentano k. Una trasformazione confermata salva un solo esito uniforme di pari Lega e sostituisce la copia; se la pool è vuota l’azione è indisponibile e la copia resta intatta.

#### Eventi e Faglia facoltativa

L’ingresso in un evento salva condizioni e risposte ammesse. E06 controlla le copie mature all’ingresso e non ricalcola le opzioni. Durante l’evento si può riorganizzare l’esercito per validare una crescita, ma non trasformare copie. La scelta applica una sola modifica o Preparazione, registra i flag e completa una tappa. Conserva completa senza beneficio né credito. E01, E02, E03 ed E06 seguono le proprie schede; gli archetipi non limitano scelte future.

F2 può essere saltata prima di affrontarla oppure lasciata dopo un esito non vittorioso. Entrare in I.10 chiude quella deviazione nella linea corrente; il riavvolgimento può riaprirla. Saltare non dà premio, maturazione o penalità. Preparazione resta disponibile per la successiva battaglia affrontata e si consuma alla sua vittoria. Una vittoria di F2 completa normalmente la tappa prima di I.10.

#### Verifica di consegna

Il primo atto è funzionalmente completo quando entrambi i bivi, F1 e le alternative di F2 raggiungono la chiusura, i quindici Poteri sono acquisibili e gli eventi risolvibili, anche con Conserva e pool vuote. Provare esiti terminali, seconda fase boss, premi doppi in riserva, retry, riavvolgimento e riapertura in ciascuno stato pendente. Nessuna prova richiede una difficoltà ottimale. La chiusura salva il premio unico, rimuove P1/P2 e registra l’Atto I completato; l’Atto II può restare non implementato senza invalidare questo traguardo.

### Fonti e limiti

Decisioni di Davide in questa conversazione e catalogo locale già esaminato, commit ef66f1e. La documentazione descrive quel confronto e il design concordato, non una verifica del repository remoto attuale. Nessuna modifica al motore è inclusa in questo aggiornamento.

| Fonte | Uso | Limite |
| --- | --- | --- |
| REGISTRO_PROGETTAZIONE_POST_v2.1.md, luglio 2026, §1 | Stato iniziale, crescita e vincolo contro i cambi che regalano valore | Matrice 4×4 e calendario sono superati dalle decisioni recenti |
| ANATOMIA_DI_UN_ESERCITO_v0_3(1).md, agosto 2026 | Analisi per mano, sequenza, Focus, condizioni di vittoria e matchup | Metodo di analisi; molte soglie sono esplicitamente da calibrare |
| ANATOMIA_SEZIONE_6_BUDGET_LEGA.md | Budget e rapporto fra Lega, iniziativa e concentrazione | La v0.3 corregge la vecchia sezione: non riutilizzare la curva illegale da 32 punti o le vecchie conclusioni sull'iniziativa |
| ARMATA_MASCARADA_v0.5.md, §4.3–4.6 e §10 | Scala reale degli effetti, differenza POT/VA, confronto dei corpi | I suoi vincoli di identità valgono per Mascarada; il simulatore citato non include tutti i Poteri e Campi |
| src/data/cards.js, copia locale ef66f1e | Precedenti concreti e conteggio aggiornato | Una carta pubblicata non dimostra che una variante sia bilanciata |
| src/data/cardArchetypes.js v3.3 | Otto archetipi e associazione effetti | Classificatore, non generatore né valutatore di costo |
| src/game/triggerLogic.js | Condizioni e separazione pre/post esito | Descrive il motore locale verificato |
| src/game/duel/duelAssaultPhase.js, duelApplyEffect.js | VA, perdita PV, cure e Focus | Non è stata eseguita una simulazione completa degli incontri |
| src/campaign/logic/nascente.js | Stato attuale di costo, Lega, crescita e cambi | Gestisce solo quattro trigger e quattro effetti |

PROPOSTA_MODELLO_v3.md è citato dai documenti recuperati, ma il file completo non è stato reperito nelle ricerche effettuate. Non vengono ricostruiti o inventati i suoi coefficienti mancanti.

Per Terraformare sono stati esaminati src/data/battlefieldsData.js, src/game/battlefieldEffects.js, src/game/duelResolve.js e le fasi duelFieldSetup, duelMainAbilities, duelArmyBonusPhases, duelBlockPrescan, duelPostBattle, duelResolutionFinish e duelFieldStatTracking. Il catalogo dei Campi è generato e deve essere aggiornato dalla sua fonte. Nel blocco I.5–I.6 sono stati inoltre confrontati src/data/gameModes.js, src/hooks/useGameFlow.js, src/game/ai/projectPostDuelState.js e Codice/satze.jsx per risorse, iniziativa, rivelazioni e conclusione della battaglia.

I due approfondimenti precedenti su pacchetti del Nascente e Terraformare sono integrati rispettivamente nei capitoli 12–13 e 14. Le regole superate su impronte, conversioni fisse e matrice 4×4 restano sostituite. Il precedente divieto generale di pesca viene precisato dalla versione 0.16: il ricambio fra squadre è ammesso, la pesca libera durante i duelli non è introdotta.
