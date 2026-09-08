# Campagna del Nascente e regia degli eventi

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
