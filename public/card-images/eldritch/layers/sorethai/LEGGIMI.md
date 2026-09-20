# Sorethai · Eldritch a livelli

Apri Sorethai-Anteprima.html nel browser: funziona offline. Muovi il puntatore per la parallasse; i controlli permettono di fermare il movimento, disattivare le parti sopra la cornice e vedere i livelli. Il movimento è inizialmente disattivato se il sistema richiede movimento ridotto.

## File

- Sorethai-Soggetto.png: personaggio e magia, PNG RGBA con trasparenza reale, 1024 × 1536.
- Sorethai-Sfondo.png: fondale ricostruito con aureola, 1024 × 1536.
- Sorethai-Cornice.png: cornice dipinta viola dei Figli dell’Orizzonte.
- Sorethai-Layout.svg: macchie nere, anello della lega e testi; incorpora font e immagini.
- Sorethai-Eldritch.png: carta completa statica, 1024 × 1536.
- Sorethai-Eldritch.json: dati della carta, riferimenti e parametri di composizione.
- Sorethai-Anteprima.html: demo autonoma con immagini incorporate.

Ordine: sfondo → soggetto → cornice → porzioni mascherate del soggetto → macchie e testi. Le scie magiche e la mano possono oltrepassare il bordo. Il titolo lungo resta su due righe; il soggetto è abbassato per lasciare visibile l’elmo. Maschere CSS e trasformazioni sono incluse nell’HTML. Le immagini separate mantengono la tela completa; ritaglio e spostamenti avvengono nel layout.

Dati: Lega 5, Potenza 6, Danno 4. Overdrive: −8 VA nem. (min 6). Bonus: −5 VA nem. (min 6).

## Generazione delle immagini

Tool integrato di generazione immagini, con artwork Eldritch di Sorethai come riferimento. Ricostruzione generativa: i dettagli possono differire dall’artwork iniziale.

Prompt soggetto:
“Extract the armored character and his purple hand magic onto a transparent background. Transparent PNG with real alpha channel. Keep the exact original pose, placement, framing and painterly appearance. Keep the black armor and robes opaque. Remove the background and the golden halo. Do not draw a checkerboard. 1024x1536.”

Prompt sfondo:
“Create the background-only clean plate of this exact image for layered animation. Remove Sorethai entirely: no helmet, armor, hands, body, robes, or hand magic. Reconstruct the areas previously hidden by him with the same dark black/violet painterly background and diagonal crimson and violet brush slashes. Preserve the luminous rough gold circular halo behind the head, centered exactly where it is in the original, now fully visible. Same dirty expressive brush-painted dark eldritch aesthetic, same colors and composition. Flat full-frame opaque background image 1024x1536, no frame, no text, no figures or silhouette.”
