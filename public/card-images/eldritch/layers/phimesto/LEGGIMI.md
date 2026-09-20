# Phimesto — Eldritch

Apri Phimesto-Anteprima.html nel browser: demo offline con parallasse, comando per fermare il movimento, controllo delle sovrapposizioni e selezione dei livelli. La preferenza di movimento ridotto è rispettata all’apertura.

## Asset

Tela comune 1024×1536, da mantenere intera senza ritagliare i margini trasparenti.

- Phimesto-Soggetto.png: PNG RGBA trasparente; personaggio, carte e fiamme.
- Phimesto-Sfondo.png: sala da gioco completa, senza soggetto, carte o fiamme.
- Phimesto-Cornice.png: cornice rossa Corte Rossa.
- Phimesto-Layout.svg: macchie, anello della lega e testi, con font incorporati.
- Phimesto-Artwork.png: variante illustrata prima della separazione generativa.
- Phimesto-Eldritch.png: carta statica completa.
- Phimesto-Eldritch.json: dati, fonti e parametri della composizione.
- Phimesto-Anteprima.html: anteprima autonoma con asset incorporati.

## Regole applicate

Nome senza virgola: titolo unico, nessun sottotitolo inventato. Carte e fiamme attraversano la cornice sinistra; la mano si sovrappone alla macchia del potere. Il corno destro interagisce con il bordo opposto. La sovrapposizione è visibile anche senza movimento. Testi e valori devono restare leggibili.

Scala soggetto 1.025, traslazione verticale base +4%; scala sfondo 1.07. Le copie del soggetto davanti al layout seguono la stessa trasformazione del soggetto principale. Maschere e parametri di parallasse sono nell’HTML.

## Dati della carta

Phimesto, id 323, Corte Rossa. Lega 3, Potenza 4, Danno 2. Potere Alleato: Blocca Bonus. Bonus: Copia Bonus nemico. Fonte e commit del riferimento di progetto nel JSON; usare i dati correnti del gioco per eventuali aggiornamenti futuri.

## Produzione

Generatore immagini integrato. Originale 323.webp per identità: corna asimmetriche, pizzetto chiaro, abito aristocratico cremisi e carte infuocate. Riferimenti Eldritch fissi Sorethai e Ur-Nammu per tecnica e materia: pennellate sporche, incisioni e pigmento graffiato. Progettazione iniziale con mano e carte in primo piano al margine sinistro e spazio libero sopra il volto per il nome. Layout composto separatamente.

Prompt estrazione: “Extract the devil aristocrat character and his hand of burning playing cards onto a transparent background. Transparent PNG with real alpha channel. Keep the exact original pose, scale, placement, framing and painterly appearance. Keep his asymmetrical horns, face, coat, hand, cards and flames. Keep black inside the character opaque. Remove the chair, casino table, chips, candle and ALL background. Do not draw a checkerboard. 1024x1536.”

Prompt fondale: rimuovere personaggio, corna, mano, carte e tutte le fiamme delle carte; ricostruire sala con sedia cremisi dorata, tendaggi, candele e tavolo da gioco. Stesso tratto Eldritch, tela opaca 1024×1536, senza testo o cornice.

L’estrazione generativa può variare dettagli rispetto all’artwork. I due livelli finali sono quelli montati nella demo e nella carta esportata.
