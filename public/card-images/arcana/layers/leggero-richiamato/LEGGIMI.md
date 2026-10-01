LEGGERO RICHIAMATO — ARCANA · KIT A LIVELLI

COME APRIRLO
Estrai lo ZIP e apri Leggero-Richiamato-Anteprima.html in Chrome o Edge.
L'HTML è autonomo e funziona anche offline: contiene font e immagini.
La stessa anteprima include l'editor di testi, colori, posizioni e movimento.

DATI DELLA CARTA
ID 108 · Figli dell’Orizzonte · L2 · Potenza 3 · Danno 1.
Potere, riga 1: ULTIMA CHANCE:
Potere, riga 2: 4 Danni dir.
Bonus, riga 1: Sempre:
Bonus, riga 2: −5 VA nem. (min 6)
Dati ripresi dalla carta approvata in questa lavorazione. Le descrizioni sono
la rappresentazione grafica, non un nuovo regolamento del gioco.

CONTENUTO PRINCIPALE (stessa struttura dei kit Eldritch)
- Leggero-Richiamato-ARCANA.png: carta statica ricomposta a livelli, RGBA.
- Leggero-Richiamato-Anteprima.html: parallasse e editor offline.
- Leggero-Richiamato-ARCANA.json: dati, layout, colori e parametri di movimento.
- Leggero-Richiamato-ARCANA.svg: composizione con testi nativi modificabili.
- Soggetto.png / Soggetto.svg: personaggio isolato, con vera trasparenza.
- Maschera.png: alfa bianco del soggetto, nero/trasparente fuori silhouette.
- Sfondo.png: fondale sorgente completo ricostruito, 1024 × 1536, opaco.
- Sfondo-inquadrato.png: fondale nella posizione di composizione, 1104 × 1584.
- Artwork.png: fondale e soggetto senza layout; serve come riferimento artistico.
- Cornice.png: cornice, cartigli e sigilli, senza scritte, su trasparenza.
- Layout.svg / Layout.png: solo tipografia, separata dall'illustrazione.
- componenti/: cornice, tre cartigli, tre sigilli e otto elementi di testo in SVG.
- assets/: sorgenti, riferimento approvato e font con licenza.
- src/: geometrie, renderer, interfaccia e script di compilazione.
- Prompt-artwork.txt: specifiche di produzione e separazione.
- manifest.json: inventario e ordine dei livelli.

FORMATO E COORDINATE
La carta esportata ha formato fisso 23:33, 1104 × 1584 px, come i kit Eldritch.
Il rettangolo dell'immagine è più grande della cornice: i margini esterni sono
trasparenti, inclusi negli asset e nell'esportazione, e non vanno ritagliati.
La grafica sorgente 1024 × 1536 è montata con scala UNIFORME 1,03125 e X=24.
Non viene stirata per riempire il formato più largo.
Soggetto.png, Cornice.png, Layout.png e Maschera.png condividono la tela finale.
Non applicare una seconda volta le trasformazioni sorgente ai PNG esportati.
Per usare il fondale già inquadrato sovrapponi Sfondo-inquadrato.png all'origine;
per il fondale con margine di movimento usa Sfondo.png e i parametri del JSON.

ORDINE DEI LIVELLI
1. Sfondo, ritagliato dalla sagoma interna della carta.
2. Cornice in vetro.
3. Soggetto davanti alla cornice (le mani creano la fuoriuscita).
4. Cartigli e sigilli, a protezione delle informazioni.
5. Testi nativi.
Disattivando «Soggetto sopra la cornice», il soggetto passa sotto il vetro.
La composizione non muove l'intero PNG come unico oggetto: i livelli di soggetto
e fondale sono indipendenti. Il layout rimane fermo rispetto alla carta.

EDITOR
- Testi: ogni trigger e ogni effetto restano su una singola riga; riduzione
  automatica del carattere se il testo è lungo. Solo il nome permette a capo.
- Posizioni: clicca e trascina un testo, oppure modifica X/Y/larghezza/corpo.
  Cornice, cartigli e sigilli hanno offset separati. Sfondo e soggetto hanno
  offset e scala uniformi: le proporzioni rimangono corrette.
- Colori: vetro, carta, numeri, sfondi delle statistiche sono indipendenti.
  La texture resta raster: la tinta è una trasformazione SVG, non una ridipintura.
- Salva JSON / Apri JSON: progetto dell'editor ARCANA a livelli, schema
  satze.arcana-kit.v1. Non è il JSON del vecchio editor ARCANA Vetro vuoto.
- Esporta PNG / SVG: salva la vista selezionata, ferma, senza fondo dell'editor.
  Puoi esportare solo soggetto, fondale, cornice, testi o maschera.
- Ripristina: torna ai dati di questo kit. Salva il JSON prima di chiudere.

PARALLASSE
Soggetto: ±5 px X e ±3 px Y nello spazio sorgente.
Fondale: ∓6 px X e ∓4 px Y, ingrandimento 1,06 e offset verticale +110 px.
Inclinazione: fino a 3° X / 4° Y. Interpolazione basata sul tempo.
Oscillazione lenta senza puntatore, comando pausa e rispetto di
prefers-reduced-motion, anche quando la preferenza cambia durante l'uso.
L'intervallo predefinito è quello verificato: ampiezze o posizioni maggiori
possono richiedere un nuovo controllo dei bordi e delle sovrapposizioni.

ASSET E FEDELTÀ
Il riferimento approvato è conservato in assets/Riferimento-approvato.png.
Il fondale è stato ricostruito integralmente dove prima c'erano soggetto e UI.
La separazione generativa ha ricostruito alcuni bordi, tessuti e parti nascoste;
il montaggio a livelli non è una copia pixel per pixel del riferimento appiattito.
Il soggetto è riportato alla posizione della composizione con scala uniforme;
una maschera sfumata nasconde la continuazione delle gambe dietro il potere.
La cornice scontornata conserva vetro e cartigli. I testi sono ricostruiti con
un'unica famiglia incorporata, Nimbus Roman Bold, liberamente modificabili.
Le parti individuali del layout sono ritagli SVG: spostarle molto può lasciare
interruzioni negli intrecci della cornice; gli offset iniziali sono allineati.

RICOMPILAZIONE E INTEGRAZIONE
Con Python 3: python src/build.py
Lo script ricostruisce l'HTML autonomo dai sorgenti e dagli asset originali.
Il renderer non richiede librerie esterne: window.ArcanaKit espone initial,
clone, render, fit, transform. Caricare prima ASSETS e GEOMETRY, poi renderer.js.
render(stato, {mode:'composite', pop:true, motion:{x:0,y:0}}) restituisce un SVG.
motion.x/y vanno da -1 a 1. Per l'animazione aggiornare le trasformazioni dei
gruppi subject-motion e background-motion come fa editor.js, senza ricreare
l'intero SVG a ogni fotogramma. L'integrazione nel repository non è inclusa.

VERIFICHE
Trasparenza reale, formato, testi su una riga, trascinamento, modifica colori,
salvataggio/riapertura JSON, livelli isolati, parallasse, pausa, reduced motion,
mobile ed esportazione PNG/SVG controllati nell'anteprima.
