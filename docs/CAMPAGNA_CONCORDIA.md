# Campagna del Nascente — modello precedente

Questo documento conserva le istruzioni del modello precedente a tre atti. I nuovi slot aprono il primo atto 0.25, i cui flussi e stato di implementazione sono nel documento principale. L’editor qui descritto modifica soltanto il modello precedente.

Per il riferimento corrente: [Design base della campagna](DESIGN_CAMPAGNA.md).


## Avvio

Con il branch `codex/concordia-campaign-editor`, eseguire `npm install` e `npm run dev` (oppure `npm run dev:vite` per il solo client).
Nel menu **Campagna**, scegliere uno slot vuoto, **Nuova campagna**, l’Impronta e **Inizia il cammino**.
I salvataggi del vecchio Atto I mantengono il loro percorso; la nuova campagna parte in uno slot nuovo.

## Percorso giocabile

- Tre atti, sei incontri per percorso per atto. La terza tappa offre due alternative che si ricongiungono: una pattuglia della Concordia oppure un incontro speciale con un’armata esistente.
- Élite alla quarta tappa e boss alla sesta. Sconfitte e pareggi consentono di ritentare; nessun calendario o contrattacco automatico nel nuovo modello.
- Il Nascente parte 3 POT / 2 DAN con un’Impronta. Il mazzo contiene dieci carte, Lega massima 30; il Nascente è sempre presente nella mano di cinque carte.
- I boss hanno la propria carta firma garantita nella mano di cinque carte. La garanzia viene mostrata prima di iniziare.
- Il duello usa la composizione di produzione e il motore Satze: 25 PV, 18 FC, cinque campi, Eminenze attive. Le risorse si azzerano tra gli incontri; le mani sono riproducibili per seed e incontro. La selezione dei campi resta quella del gioco attuale.
- Ricompense in riserva ed evoluzione del Nascente. La schermata **Armata e Nascente** permette sostituzioni tra mazzo e riserva; almeno cinque Figli dell’Orizzonte rendono eleggibile l’Eminenza del giocatore.

## Concordia di Caelion

Catalogo nemico separato: 15 carte (6 L2, 4 L3, 3 L4, 2 L5), cinque mazzi da dieci carte di Lega 24/26/27/27/30. Non viene aggiunta al deckbuilder o al pool delle ricompense.

Le Campane del Vallo partono da 1 Presenza. Lo Statico aggiunge 1 a fine round se il controllore ha scelto effettivamente per secondo: la forzatura di Intervento non produce questo guadagno. Le tre attive usano le primitive condivise; i minimi dichiarati sono applicati al momento dello schieramento. Sortita modifica POT e DAN come effetto Eminenza, senza diventare un Potere bloccabile.

L’IA accumula con Serrate, usa Sortita quando pagabile e valuta Seconda Campana negli ultimi round quando sceglie per prima con carte reattive rimaste. La scelta usa esclusivamente mano propria e informazioni pubbliche. Questa politica iniziale e la difficoltà degli incontri richiedono ancora playtest.

## Editor eventi

Dal menu slot: **Editor distribuzione eventi**. Dalla mappa: **Editor eventi**.

1. Selezionare un evento o aggiungerne uno.
2. Assegnare l’incontro di destinazione, anche in un altro atto.
3. Modificare titolo, testo e da una a quattro scelte. Le ricompense sono crescita POT/DAN/Impronta, carta in riserva oppure nessuna modifica.
4. Usare le frecce per cambiare l’ordine. Eventi sullo stesso incontro si risolvono nell’ordine della lista; quelli sul ramo non scelto non si attivano.
5. **Salva distribuzione** applica il modello alle nuove campagne. Ogni run conserva una copia della definizione, quindi una modifica non altera una partita in corso.
6. **Esporta JSON** e **Importa JSON** trasferiscono il modello tra dispositivi. L’importazione valida struttura, carte, ricompense, duplicati e destinazioni prima di sostituire la bozza.

La distribuzione è salvata nello stesso ambiente locale dei salvataggi del gioco. Per cambiare il modello distribuito a tutti, aggiornare `src/campaign/data/controlledCampaign.js` nel repository. Un salvataggio dell’editor non modifica automaticamente il repository.

## Verifiche e limiti

- Build Vite riuscita.
- Suite di integrazione: 237 test superati, inclusi editor, avvio dal menu attraverso `useGameFlow` e Campane nel duello reale.
- Suite unit: 715/729 superati. I 14 errori sono snapshot Corte Rossa/Kethran già presenti al commit di partenza `be376714d56539abd8d5e39932b18634814e211c`; non sono stati riscritti da questa patch.
- I sei nuovi test unit coprono tutti gli otto percorsi per ciascuna delle tre Impronte, i 18 incontri, garanzie delle mani, eventi, callback duplicati, import non validi e compatibilità dei salvataggi.
- La prova grafica con Chromium non è stata completata: il processo è bloccato dall’ambiente di esecuzione. I test dell’interfaccia usano il DOM con React.
- Testi dei tre atti e bilanciamento sono una prima versione giocabile. Per le carte senza illustrazioni dedicate si usano i fallback già disponibili. Artefatti e magie restano fuori da questa versione.

## Aggiornamento grafico della campagna

La presentazione della campagna controllata ora usa una scena a tutto schermo:

- Fondali esistenti `campo-54`, `campo-51`, `campo-53` per i tre atti, con velatura atmosferica e luce sui nodi disponibili.
- Percorso spaziale con sentieri, bivio, sigilli di battaglia/élite/speciale/boss e stato ricavato dal salvataggio. I collegamenti completati seguono il ramo effettivamente percorso.
- Illustrazione originale della Concordia nel pannello degli incontri. Gli incontri speciali mostrano un agente dell’armata corrispondente.
- Nuova apertura con il Nascente illustrato e tre Impronte selezionabili; il ritratto del Nascente in campagna segue la Lega raggiunta.
- Ricompense e armata mostrano il componente reale `CardReworkP4Scaled`, con anteprima del Nascente dopo la scelta e delle carte che entrano in riserva.
- Ricognizione dell’avversario in una finestra dedicata: mazzo, Eminenza e garanzia della carta firma. Chiusura con Escape e gestione del focus.
- Suoni di selezione/conferma tramite il bus audio del gioco, nel rispetto delle opzioni esistenti. Animazioni disattivate con `prefers-reduced-motion`.
- Layout adattato anche alle finestre più strette. L’editor eventi conserva la propria interfaccia di lavoro.

Queste modifiche valgono anche per le campagne controllate già salvate. Per vedere la nuova apertura iniziare una campagna in uno slot vuoto. Il modello legacy conserva la sua schermata.

Verifica di questo aggiornamento: build Vite e sei test UI della campagna superati, inclusi selezione del ramo speciale, avvio reale tramite `useGameFlow`, gestione del focus, ricompensa in riserva e sostituzione nel mazzo. La prova visiva nel browser resta da eseguire sul gioco: l’anteprima locale è bloccata da `ERR_BLOCKED_BY_CLIENT` nell’ambiente di lavoro. Il nuovo asset illustra la fazione; le quindici carte Concordia richiedono ancora illustrazioni individuali e mantengono i fallback esistenti.

### Asset Concordia

File consumato dal gioco: `public/campaign/concordia-vallo.webp` (1536×1024, WebP). Generato con lo strumento integrato Imagegen; conversione WebP con Sharp, qualità 88. Nessun caricamento remoto necessario durante il gioco.

Prompt finale:

> Use case: stylized-concept. Asset type: illustrated encounter background for original dark fantasy card game Satze. A solemn human military order, the Concordia di Caelion: foreground a fully armoured knight in dark worn steel, green cloth tabard, weathered gold sun insignia, closed visor, tall kite shield and upright spear; behind him a disciplined line of soldiers and hanging green and yellow banners below an enormous gothic bell tower and stone battlements. They resist a cosmic threat. Hand-crafted detailed pixel art, visible crisp square pixel clusters, rich dark teal shadows and muted antique gold highlights, subdued violet storm sky, cinematic dramatic lighting. Landscape composition 3:2 with the foreground knight at right-centre, atmospheric gate and troops visible at left, head and shield within central safe zone so the image can also be cropped to a portrait encounter panel. A serious, mysterious collectible-card-game atmosphere, no cartoon outlines, no UI, no text, no letters, no watermark. Original scene, no recognizable characters from another game.

## Movimento e conferme visive

La scena ora include parallasse leggera con mouse, particelle, indicatore della destinazione e sentiero animato. L’ingresso nell’incontro dura 650 ms ed è saltabile con «Entra subito»; timer e clic condividono una protezione contro il doppio avvio. Le ricompense salvate vengono presentate in una finestra con la carta ottenuta. Il comando Animazioni conserva la preferenza; movimento ridotto e pagina nascosta sono rispettati.

Verifica dell’aggiornamento: build riuscita e 13 test mirati superati, inclusi salto della transizione, recupero dopo errore di avvio e preferenze di movimento. La prova visiva resta da eseguire nel gioco.
