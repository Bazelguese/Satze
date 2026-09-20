# SATZE — Eldritch: carte illustrate a livelli

Documento di design e procedura di produzione · versione 1.0 · 19 settembre 2026

## Idea di design

**Eldritch è una linea di alternative art di Satze:** illustrazioni scure, sporche ed espressive, montate su carte con una cornice dipinta del colore dell’esercito. Il personaggio è separato dal fondale; alcune sue parti oltrepassano il bordo e una parallasse leggera dà profondità alla carta. Le macchie nere sostengono la leggibilità dei testi e fanno parte del linguaggio visivo.

L’effetto cercato è quello di un’illustrazione viva dentro un oggetto stampato e consumato. Silhouette, segni e pigmento devono avere carattere anche a carta ferma. Il movimento valorizza una composizione già funzionante.

Questo documento registra il percorso svolto e rende ripetibile la produzione. I prototipi di Cyber May Punk e Sorethai sono esempi concreti; l’integrazione nel gioco resta un lavoro successivo. Non documenta una funzionalità già implementata nel repository.

## Decisioni da conservare

| Aspetto | Decisione |
| --- | --- |
| Nome | Eldritch, nome della direzione artistica scelta per le carte. |
| Tratto | Pennellato sporco, angoloso, quasi caricaturale; incisione e stampa consumata come riferimenti tecnici. |
| Identità | Partire dall’immagine in gioco e conservare i dettagli che rendono riconoscibile l’agente. |
| Posa e punto di vista | Possono essere reinterpretati. Valutare la variante prima di separarla in livelli. La frontalità non è un vincolo generale. |
| Cornice | Immagine dipinta e materica, disponibile nei colori degli eserciti. |
| Testi | Elementi modificabili, separati dall’artwork, con macchie nere dipinte dietro. |
| Profondità | Soggetto PNG trasparente e sfondo completo separato, con movimento relativo contenuto. |
| Sovrapposizioni | Porzioni selezionate del soggetto sopra la cornice; informazioni di gioco sempre leggibili. |
| Iterazione | Possibilità di vedere il layout su sfondo bianco e ciascun componente isolato. |
| Dati | Nome, esercito, lega, potenza, danno, potere e bonus provengono dai dati reali del gioco. |

La cornice SVG geometrica e i cinque segni neri decorativi della prima prova sono stati scartati. Il problema era la povertà del risultato: sostituirli con texture e forme dipinte coerenti con l’illustrazione. Un SVG può ancora contenere testo e immagini raster: il formato del contenitore non determina lo stile del bordo.

## Direzione artistica

Eldritch è una definizione interna al progetto, non il nome di una tecnica unica. La descrizione operativa è: **illustrazione digitale espressiva con pennellate a secco, segni da xilografia/linoleografia, pigmento graffiato e serigrafia consumata**.

- Masse nere profonde, silhouette leggibile, contrasti netti.
- Bordi spezzati, incisioni angolose, graffi e diagonali che costruiscono le forme.
- Proporzioni e gesti espressivi, anche leggermente caricaturali, mantenendo l’identità dell’agente.
- Palette limitata, un colore dominante e pochi accenti; luci avorio o metalliche dove pertinenti.
- Sfondo subordinato al soggetto, capace di sostenere il contrasto.
- Nessun testo o layout dentro l’artwork generato.

Evitare un dipinto liscio con rumore applicato sopra, il 3D lucido, l’aerografo uniforme e la semplice riproduzione della pixel art. Non trasferire elementi narrativi dai riferimenti di stile: un cyberpunk non acquisisce aureola, corona o armatura medievale solo perché compaiono in Sorethai o Ur-Nammu.

### Riferimenti fissi e continuità tra chat

Nel pacchetto, `riferimenti/` contiene gli artwork Eldritch di Sorethai e Ur-Nammu. Servono per tratto e materia. L’immagine in gioco del nuovo agente serve per identità, equipaggiamento e dettagli distintivi. Una carta finale serve invece come riferimento del layout.

Riutilizzare questi riferimenti fissi, senza sostituirli progressivamente con le generazioni più recenti: si riduce la deriva stilistica. Il nome Eldritch o un prompt da soli non garantiscono continuità visiva. In una nuova chat fornire questo documento, i riferimenti e l’originale dell’agente; indicare quale versione è stata approvata.

La guida precedente è conservata in `riferimenti/Eldritch-Guida-Stile-v1.md` come documento storico. Il suo vincolo di conservare la posa va letto alla luce della decisione successiva: **identità stabile, posa e POV variabili quando richiesto**. Conservare la posa diventa invece essenziale durante l’estrazione dei livelli da una variante già approvata.

## Componenti del layout

| Componente | Formato / natura | Funzione |
| --- | --- | --- |
| Fondale | Immagine opaca | Ambiente ricostruito anche dietro il personaggio. |
| Soggetto | PNG RGBA | Personaggio isolato, con effetti che devono seguirlo. |
| Cornice | PNG RGBA dipinto | Identità della carta, tinta coerente con l’esercito. |
| Macchia larga | PNG RGBA nero, irregolare | Sostegno di titolo e blocchi di testo larghi. |
| Macchia compatta | PNG RGBA nero, irregolare | Sostegno di numeri e blocchi più stretti. |
| Anello della lega | PNG RGBA dipinto | Sede del valore di lega; colore coerente con l’esercito. |
| Tipografia | Testo nativo / SVG | Nome, esercito, numeri, etichette, potere e bonus. |
| Porzioni davanti al bordo | Copie mascherate del soggetto | Creano la fuoriuscita dal layout, senza un secondo artwork disallineato. |

Le due macchie possono essere riutilizzate e ridimensionate: sette istanze nel renderer corrente non implicano sette immagini diverse. La texture deve restare leggibile e i margini non devono diventare tagli rettangolari evidenti.

Ordine di composizione, dal fondo al primo piano: **sfondo → soggetto → cornice → porzioni mascherate del soggetto → macchie, anello e testi**. L’overlay attuale riunisce macchie, anello e tipografia; in un’integrazione futura possono restare componenti distinti.

## Procedura completa per un nuovo agente

### 1. Preparare il brief

Raccogliere immagine originale, riferimenti Eldritch e dati della carta. Annotare i dettagli invarianti: volto o casco, silhouette, arma, abiti, accessori, palette distintiva, effetti e tema. Specificare se mantenere la posa o proporre un altro POV.

Leggere i dati correnti quando si prepara una carta destinata al gioco. Non dedurre esercito o valori dall’immagine. I dati inclusi negli esempi sono fotografie del prototipo e non sostituiscono i futuri dati aggiornati del repository.

### 2. Creare l’alternative art

Generare un artwork verticale 2:3, senza cornice, testi o statistiche. Usare l’originale come riferimento di identità e i due artwork fissi come riferimento di tratto. Impostare lo spazio per titolo e informazioni in basso già nella composizione.

Se si cambia posa o punto di vista, valutare riconoscibilità, silhouette e gesto. Bloccare una versione approvata prima di passare alla separazione: generare soggetto e sfondo da varianti diverse introduce disallineamenti.

### 3. Decidere cosa appartiene a ogni livello

Gli effetti solidali al personaggio seguono il soggetto; ambiente e fenomeni distanti restano nel fondale. Registrare le eccezioni. In Sorethai la magia della mano segue il personaggio, mentre l’aureola appartiene allo sfondo. In Cyber May Punk testa digitale, occhio e cappotto seguono il personaggio; città e pioggia appartengono al fondale.

Un terzo livello per particelle o effetti è un possibile sviluppo, non un requisito del prototipo corrente.

### 4. Estrarre il soggetto

Produrre un PNG con vero canale alfa, mantenendo una tela completa di 1024 × 1536 nel formato attuale. Conservare posa, scala e posizione quanto possibile. Il nero interno a armatura, testa e vestiti deve restare opaco.

**Controllare il file, non soltanto l’anteprima:** verificare il canale alfa e provare la composizione su fondo chiaro, scuro e a scacchi. Una scacchiera disegnata dentro un RGB non è trasparenza. Durante queste prove è accaduto realmente; una richiesta più breve ed esplicita di PNG trasparente ha prodotto un RGBA valido.

Controllare anche bordi, aloni, aperture fra arti e vestiti e parti nere erroneamente cancellate. Un canale alfa presente da solo non garantisce uno scontorno corretto. L’estrazione generativa può reinterpretare dettagli: confrontarla con la versione approvata.

### 5. Ricostruire lo sfondo

Rimuovere completamente il personaggio e gli effetti assegnati al soggetto. Ricostruire il fondale dietro corpo e accessori, mantenendo palette, pennellate, luce e composizione. Evitare sagome residue o un buco nero sagomato sul personaggio.

Lo sfondo deve funzionare da solo: la parallasse rende visibili aree prima coperte. Mantenere il formato e controllare che ci sia copertura sufficiente durante il movimento.

### 6. Montare il layout Eldritch

Applicare la cornice del colore dell’esercito. Disporre le macchie in funzione delle effettive aree di testo e conservare nome, numeri ed effetti come testo modificabile. Usare il renderer e gli asset esistenti per mantenere coerenza.

Per valutare la ricchezza del solo layout, sostituire temporaneamente l’artwork con un fondo bianco: cornice, anello, macchie e spazi devono risultare intenzionali anche senza illustrazione. Il fondo bianco è uno strumento di verifica, non il fondale finale della carta.

### 7. Regolare inquadratura e fuoriuscite

Adattare posizione e scala all’agente. Un titolo lungo non deve coprire volto o elemento distintivo: per Sorethai il soggetto è stato abbassato sotto le due righe del nome. Scegliere poche parti che possono superare il bordo: testa, spalla, mano, arma o magia secondo la composizione.

Usare copie della stessa immagine con la stessa trasformazione e maschere locali, sfumate dove serve. Evitare interruzioni nette a metà braccio o scia. Testi e valori mantengono la precedenza visiva; verificare la carta anche alle dimensioni effettive di gioco.

### 8. Aggiungere movimento contenuto

Sfondo e soggetto si spostano in direzioni opposte; una lieve inclinazione accompagna il puntatore. In assenza di interazione, i prototipi usano un’oscillazione lenta. Le copie davanti alla cornice seguono esattamente il soggetto.

Prevedere comando per fermare il movimento, rispetto di `prefers-reduced-motion`, composizione statica valida e selezione dei livelli per ispezione. Nelle demo attuali la preferenza di movimento ridotto viene letta all’apertura.

### 9. Verificare e consegnare

Verificare soggetto, stile, trasparenza, copertura del fondale, maschere, gerarchia del layout e dati. Provare carta ferma, movimento, fuoriuscite disattivate, soggetto isolato e fondale isolato. Controllare la vista mobile e gli errori di caricamento delle immagini.

Consegnare soggetto PNG, sfondo, cornice, overlay, carta statica PNG, dati e parametri JSON, anteprima HTML autonoma e istruzioni. Raccogliere il tutto in uno ZIP. Conservare anche prompt, riferimenti e versione approvata, così la procedura non dipende dalla memoria della chat.

## Parametri effettivi dei prototipi

Questi numeri descrivono le prove realizzate; non sono vincoli da imporre a ogni agente. Le percentuali di traslazione sono relative alla dimensione del livello.

| Parametro | Cyber May Punk | Sorethai |
| --- | --- | --- |
| Tela asset | 1024 × 1536 | 1024 × 1536 |
| Cornice | Rosa, Patto degli Indocili | Viola, Figli dell’Orizzonte |
| Scala soggetto | 1,025 | 1,045 |
| Spostamento verticale base soggetto | 0% | +16% |
| Scala sfondo | 1,07 | 1,07 |
| Spostamento verticale base sfondo | 0% | +12% |
| Parti oltre il bordo | Testa e spalla | Mano e scie magiche |
| Titolo | Una riga nel prototipo | Due righe; inquadratura adattata |

Per entrambi, il movimento arriva a circa ±0,65% orizzontale e ±0,4% verticale sul soggetto; sullo sfondo circa ±0,75% e ±0,55% in senso opposto. Inclinazione fino a circa 3° sull’asse X e 4° sull’asse Y. Interpolazione corrente: 0,08 per fotogramma, quindi la risposta può variare con la frequenza dello schermo. Per il gioco, valutare un’interpolazione basata sul tempo trascorso.

Le maschere, il ritaglio e le trasformazioni esatte sono negli HTML allegati. Lo spostamento del fondale di Sorethai è specifico di quella composizione e si appoggia alla copertura del titolo: non va copiato ciecamente su altre carte.

## Prompt riutilizzabili

### Artwork con posa originale o alternativa

> Crea l’alternative art Eldritch di [AGENTE]. Usa l’immagine originale per identità e dettagli distintivi; usa i riferimenti fissi di Sorethai e Ur-Nammu per tratto e materia. Pennellate sporche a secco, segni angolosi incisi, masse nere, pigmento consumato, contrasto alto, resa espressiva quasi caricaturale. Conserva [INVARIANTI]. Posa e POV: [MANTIENI / DESCRIVI LA VARIANTE]. Mantieni il tema del soggetto senza importare accessori dai riferimenti. Verticale 2:3, con spazio per il titolo in alto e le informazioni in basso. Solo artwork: niente scritte, numeri, cornice o watermark.

### Soggetto trasparente dalla variante approvata

> Extract [SUBJECT] and [ATTACHED EFFECTS] onto a transparent background. Transparent PNG with a real alpha channel. Keep the approved pose, placement, framing and painterly appearance. Keep black areas inside the character opaque. Remove [BACKGROUND ELEMENTS]. Do not draw a checkerboard. Same 1024×1536 canvas.

### Fondale completo

> Create the background-only clean plate of this approved artwork for layered animation. Remove [SUBJECT AND ATTACHED EFFECTS] completely and reconstruct everything previously hidden. Preserve [ENVIRONMENT, LIGHTING, PALETTE, BACKGROUND EFFECTS] and the same dirty painterly Eldritch style. No figure or residual silhouette. Opaque full-frame 1024×1536 background, no frame and no text.

### Riprendere il lavoro in un’altra chat

> Segui SATZE-Eldritch-Design-e-Procedura.md per creare [AGENTE]. Allego l’originale e i due riferimenti fissi dello stile. Voglio [POSA / POV]. Prima definisci un artwork coerente, poi ricava soggetto PNG trasparente e sfondo completo dalla versione approvata. Applica cornice del suo esercito, macchie dipinte e testi modificabili con dati reali. Prepara fuoriuscite selettive, parallasse leggera, carta statica e pacchetto dei livelli. Se un riferimento manca, segnalalo invece di presumere di ricordarlo.

## Errori incontrati e controlli risolutivi

| Problema | Controllo / correzione |
| --- | --- |
| Originale dell’agente sbagliato | Verificare la reference del soggetto prima della reinterpretazione. |
| Layout troppo scarno | Valutazione su bianco; cornice e macchie raster dipinte coerenti con l’artwork. |
| Scacchiera incorporata nell’immagine | Controllo RGBA e alfa reale; rigenerazione dell’estrazione. |
| Nero dell’abito scambiato per sfondo | Specificare che le masse nere interne al soggetto devono restare opache. |
| Titolo sopra l’elmo | Spostare l’inquadratura e ricontrollare l’intera composizione. |
| Taglio visibile sulle porzioni fuori cornice | Maschere con transizioni morbide e trasformazioni identiche al soggetto. |
| Deriva dello stile | Ripartire dai riferimenti fissi e correggere lo scostamento specifico. |
| Sfondo valido solo dietro il soggetto fermo | Ispezione isolata e prova degli estremi della parallasse. |

## Stato e passaggio all’implementazione

Sono disponibili prototipi HTML autonomi per Cyber May Punk e Sorethai, asset separati, esportazioni statiche e dati della carta. Ur-Nammu resta anche un riferimento visivo fisso per lo stile. Il trattamento descritto è registrato come idea di design e procedura riutilizzabile.

Per integrare nel gioco, usare questi prototipi come riferimento e collegare la presentazione ai dati correnti. Restano da valutare prestazioni con molte carte simultanee, caricamento e memoria delle texture, resa a piccole dimensioni, comportamento touch e gestione delle animazioni fuori schermo. Nelle demo le immagini sono incorporate più volte per rendere il file autonomo; nel gioco conviene riutilizzare gli stessi asset caricati.

Non è ancora definito se Eldritch sostituirà il layout principale o resterà una linea di alternative art, né come sarà distribuito ai giocatori. Queste scelte non sono implicite nell’approvazione dell’aspetto grafico.

## Contenuto del pacchetto di design

- Questo documento, punto di ingresso della procedura.
- `riferimenti/`: i due artwork fissi e la guida storica.
- `componenti-layout/`: cornice base, anello base, macchie larga e compatta.
- `esempi/Cyber-May-Punk/`: asset, dati, layout e demo completa.
- `esempi/Sorethai/`: asset, dati, layout e demo completa.

Origine delle decisioni: iterazioni di questa conversazione. Origine dei parametri: file HTML, JSON e asset dei prototipi. Contesto di progetto: README.md e ISTRUZIONI.md allegati; la cartella Documentazione/ indicata dal progetto è una possibile destinazione futura di questo documento.
