# Sylwajuck l’Estremo — Eldritch

Orathai. Lega 3 · Potenza 3 · Danno 4.
Potere: Magnanimo, +3 POT. Bonus: Resa dei conti, +2 DAN.
Dati: Bazelguese/Satze, snapshot commit 094b4f7cd128d0575b2f795a81d43563770529eb, src/data/cards.js id 524 e src/data/armies.js.
Nome originale senza virgola: nessun sottotitolo separato aggiunto. Regola generale: alla prima virgola il resto diventa sottotitolo.

## Contenuto
- Sylwajuck-Soggetto.png — vero PNG RGBA trasparente.
- Sylwajuck-Sfondo.png — bosco pulito per parallasse.
- Sylwajuck-Artwork.png — illustrazione completa di riferimento.
- Sylwajuck-Cornice.png — cornice pittorica Orathai.
- Sylwajuck-Layout.svg — testi con font incorporati, macchie raster e anello lega.
- Sylwajuck-Eldritch.png — carta statica completa.
- Sylwajuck-Eldritch.json — dati e posizioni.
- Sylwajuck-Anteprima.html — demo autonoma con movimento, selezione livelli e sovrapposizione.
Canvas 1024 × 1536. Conservare i margini trasparenti.

## Montaggio
Sfondo scala 1.07; soggetto scala 1.025 senza traslazione verticale di base. Ordine: sfondo, soggetto, cornice, copie anteriori mascherate di corna e artiglio, macchie e testi. Le corna oltrepassano la cornice superiore e l’artiglio quella destra anche a carta ferma. Maschere e trasformazioni sono nell’HTML.

## Generazione
Modalità: generatore immagini integrato. Originale 524.webp usato per identità; artwork Eldritch di Sorethai usato solo come riferimento stilistico. Le estrazioni generative possono reinterpretare piccoli dettagli.
Prompt artwork: “Use case: stylized-concept. Create a 1024x1536 portrait alternative artwork of Sylwajuck l’Estremo. Image 1 is character identity; image 2 is ONLY painterly stylistic reference. Preserve the deer skull with tiny glowing teal eye sockets, vast branching wood antlers, raven companions perched on branches and shoulders, a tall body woven from black roots and bark, draping olive moss and lichens, long clawlike wooden hands. Reinterpret in an expressive, slightly caricatural dirty drybrush, scratchy woodcut and distressed screenprint painting matching image 2’s coarse confident black shapes, ivory scratched pigment and dramatic angular silhouette. NOT pixel art, not smooth digital render. Palette forest black, olive moss, bone ivory, cold mist gray with restrained vivid teal light. Alternate dynamic low three-quarter viewpoint: head at about x520 y480, immense antlers spread across x35–980 y70–420, torso central, one foreshortened clawed hand reaching toward viewer on right at x850 y790, opposite long arm down left. Ravens recognizable. Dark ancient woodland with crooked trees and pale swirling mist, graphic atmospheric depth. Card composition: keep top center x150–790 y65–275 quiet dark negative space for a later two-line title; antler branches go around this area along upper side edges. Main skull unobscured at y410–640. Right claw visible outside usual card right border x950 at y650–970; do not crop fingertips; leave 20px margin. Main facial and hand details ABOVE y1000 to leave lower torso for later stats. Artwork only: absolutely no text, lettering, numbers, card border, icons, symbols or layout. No halo, no armor, no weapon.”

Prompt soggetto: “Extract the antlered woodland creature and all four perched ravens onto a transparent background. Transparent PNG with real alpha channel. Preserve exact pose, scale, placement, canvas 1024x1536 and scratchy painterly style. Keep skull, teal eyes, all branching antlers and their moss, ravens perched on antlers and shoulders, body, both arms and all claws. Preserve dark shadows inside its body as opaque. Remove only background forest trees and all background gray mist. Transparent holes between antlers, between arms and torso, and between fingers. Do not draw checkerboard. Do not recenter or crop.”

Prompt sfondo: “Use case: precise-object-edit. Create the clean background plate of this exact illustration, 1024x1536. Remove the ENTIRE creature, skull, every antler, every raven, all claws, moss cape and body. Fill behind them with continuous atmospheric ancient woodland: crooked black trees, gray fog and muted olive patches. Preserve the coarse scratchy drybrush/woodcut texture, black and ivory high contrast. Upper 20 percent nearly black and quiet; pale mist and layered trunks toward lower left and middle; darker at bottom. No creature, no skull, no birds, no antlers, no foreground silhouette. No text, no frame. Opaque background illustration for parallax.”

## Controlli
Alpha RGBA verificato. Nessun avviso layout o errore JavaScript. Controllati movimento, selezione livelli, sovrapposizione e assenza di overflow a 360px.
