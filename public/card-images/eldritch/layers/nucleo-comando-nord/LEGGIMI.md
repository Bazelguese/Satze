# Nucleo di Comando Nord — Eldritch

Carta completa con livelli separati e anteprima HTML autonoma con parallasse.

## Dati
Calibri Pesanti · Lega 4 · Potenza 5 · Danno 3.
Potere: Overdrive, +2 POT. Bonus: −2 DAN nemici (min 2).
Fonte: snapshot Bazelguese/Satze, commit 094b4f7cd128d0575b2f795a81d43563770529eb, src/data/cards.js (id 402), src/data/armies.js.
Il nome non contiene virgole e non ha sottotitolo. Regola generale Eldritch: separare alla prima virgola e usare il resto come sottotitolo.

## File
- Soggetto.png: PNG RGBA con trasparenza reale, mantenere dimensioni e margini.
- Sfondo.png: ambiente pulito senza personaggio.
- Artwork.png: illustrazione completa di riferimento.
- Cornice.png: cornice pittorica Calibri Pesanti.
- Layout.svg: testi, macchie raster e anello della lega; font incorporati.
- Eldritch.png: composizione statica completa.
- Eldritch.json: dati e posizionamento del layout.
- Anteprima.html: demo autonoma con movimento, sovrapposizione e selezione livelli.
Tutti i nomi hanno prefisso Nucleo-Comando-Nord-. Canvas 1024 × 1536.

## Composizione
Sfondo scala 1.07. Soggetto scala 1.025 e traslazione verticale 5%.
Le spalle scavalcano la cornice anche senza movimento. Le copie anteriori del soggetto sono mascherate selettivamente; i testi restano leggibili sopra di esse. Le maschere CSS e le trasformazioni sono incluse nell’HTML. Ordine: sfondo, soggetto, cornice, spalle anteriori, macchie e testi.

## Direzione artistica
Rielaborazione dell’originale 402: cyborg militare, cranio scoperto, respiratore, cavi, spalle corazzate e antenne. Pennellata secca sporca, segni da xilografia, proporzioni espressive, ombre nere e blu freddo, avorio consumato e piccoli accenti rame. Pose e dettagli reinterpretati tramite generatore immagini integrato.
Prompt di estrazione utilizzato: “Extract this command cyborg onto a transparent background. Transparent PNG with real alpha channel. Keep the exact original pose, scale, placement, framing and painterly appearance. Preserve pale bald head, respirator, all neck cables, giant shoulder plates, chest insignia, medals, backpack and antennas. Keep black inside body and machinery opaque. Remove ALL bunker walls, conduits and cyan wall lights. Do not draw a checkerboard. Do not crop or recenter. 1024x1536.”
Lo sfondo è stato ricostruito separatamente eliminando il personaggio. L’estrazione generativa può reinterpretare piccoli dettagli.

## Verifica
Trasparenza RGBA controllata. Nessun avviso di layout o errore JavaScript. Verificati movimento, selezione livelli, interruttore di sovrapposizione e assenza di overflow a 360px.
