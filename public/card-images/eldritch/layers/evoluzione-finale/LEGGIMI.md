# L’Evoluzione Finale — Eldritch

611 · Mounthborn · Lega 5 · Potenza 6 · Danno 3.
Potere: Turbo, +1 POT e +1 DAN. Bonus: Imboscata, +1 POT e +1 DAN.
Dati: snapshot Bazelguese/Satze, commit 094b4f7cd128d0575b2f795a81d43563770529eb; src/data/cards.js e src/data/armies.js.
Nome senza virgola, nessun sottotitolo aggiunto.

## Direzione
POV frontale basso, creatura in carica verso lo spettatore, mano e ginocchio in forte scorcio, testa abbassata, arti asimmetrici in corsa. Identità: quattro corna, occhi arancioni, chitina verde, spalle triangolari, costole nere e artigli. Pennellata secca sporca, xilografia e pigmento consumato nello stile Eldritch. Riferimento stilistico: artwork Sorethai; riferimento personaggio: 611.webp.

## File
- Evoluzione-Finale-Artwork.png: illustrazione completa originale.
- Evoluzione-Finale-Soggetto.png: PNG RGBA con trasparenza reale.
- Evoluzione-Finale-Sfondo.png: bosco e detriti senza creatura.
- Evoluzione-Finale-Cornice.png: cornice dipinta Mounthborn.
- Evoluzione-Finale-Layout.svg: testi con font incorporati, macchie raster e anello lega.
- Evoluzione-Finale-Eldritch.png: carta completa statica.
- Evoluzione-Finale-Eldritch.json: dati e posizionamenti.
- Evoluzione-Finale-Anteprima.html: demo autonoma con parallasse, selezione livelli e sovrapposizione.
- Prompt.json: prompt finali e modalità di generazione.

Canvas 1024 × 1536. Soggetto scala 1.025 senza traslazione verticale fissa; sfondo scala 1.07. Preservare i margini trasparenti. Le corna passano davanti al nome; il corno destro passa anche sopra la scritta Mounthborn. La mano sul lato destro della composizione supera la cornice; l’artiglio sul lato sinistro passa sopra il numero di Potenza, come richiesto. Tutte queste sovrapposizioni usano copie del soggetto con maschere selettive sopra il layout e seguono il movimento del personaggio. Potenza e Danno mantengono dimensioni e posizioni standard Eldritch: Potenza a sinistra accanto al potere, Danno a destra più in basso, etichette sotto i rispettivi numeri. Maschere e trasformazioni incluse nell’HTML.

Generazione con strumento immagini integrato. L’estrazione generativa può reinterpretare piccoli dettagli. Le prime due estrazioni avevano una scacchiera incorporata e sono state scartate: il PNG consegnato ha un vero canale alpha.

Verificati alpha RGBA, assenza di avvisi layout ed errori JavaScript, movimento, selezione livelli, interruttore sovrapposizione e assenza di overflow a 360px. Sovrapposizione visibile anche a carta ferma.
