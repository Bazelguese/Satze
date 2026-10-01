MEZZANOTTE, IL MAI NATO — ARCANA
Kit completo a livelli con la struttura di consegna dei kit Eldritch.

APERTURA
Estrai lo ZIP e apri Mezzanotte-Anteprima.html in Chrome o Edge.
L'HTML è autonomo: font e immagini incorporati, funzionamento offline.
Include anteprima con parallasse ed editor di testi, colori e posizioni.

DATI VERIFICATI
ID 220 · Kethran · L2 · Potenza 3 · Danno 2.
Potere: Sempre: / Inversione
Bonus: Rimonta: / +2 POT
Fonte: Bazelguese/Satze, src/data/cards.js e src/data/armies.js.
Dati-verificati.json conserva dati e identificatori delle versioni consultate.
Il trigger nullo del potere è rappresentato con «Sempre:», come richiesto.
La cornice usa l'accento Kethran #eebf3c. Potenza gialla, danno viola, lega grigia.

FILE PRINCIPALI
Mezzanotte-ARCANA.png — carta statica ricomposta, RGBA 1104 × 1584.
Mezzanotte-Anteprima.html — parallasse e editor offline.
Mezzanotte-ARCANA.json — dati, colori, posizioni e parametri.
Mezzanotte-ARCANA.svg — composizione con testi nativi.
Soggetto.png / Soggetto.svg — soggetto isolato con trasparenza reale.
Maschera.png — sagoma bianca del soggetto su trasparenza.
Sfondo.png — fondale completo e opaco, sorgente 1024 × 1536.
Sfondo-inquadrato.png — fondale nella posizione di montaggio, 1104 × 1584.
Artwork.png — soggetto e ambiente senza layout.
Cornice.png — cornice, cartigli e sigilli senza testi.
Layout.svg / Layout.png — testi separati, senza illustrazione.
componenti/ — vetro, cartigli, sigilli e singoli testi in SVG.
assets/ — originali, riferimento di stile, sorgenti e font con licenza.
src/ — renderer, geometrie, interfaccia e compilazione.
Prompt-artwork.txt — brief e istruzioni di separazione.
manifest.json — inventario di composizione.

COMPOSIZIONE E PROFONDITÀ
Formato fisso 23:33: la tela è più ampia della cornice e conserva margini
trasparenti. Le immagini mantengono le proporzioni. Non ritagliare gli asset.
La tela artistica sorgente 1024 × 1536 viene montata con scala uniforme 1,03125
e spostamento orizzontale 24 px nella tela finale 1104 × 1584.
Soggetto, cornice, maschera e testi esportati sono già allineati alla tela finale.
Non applicare nuovamente a questi PNG le trasformazioni dei sorgenti.

Ordine: fondale ritagliato nella carta → vetro → soggetto → cartigli e sigilli
→ testi. Le dita superano il vetro, mentre le statistiche rimangono leggibili.
Nuova posa asimmetrica in scorcio dal basso: mano sinistra nell'immagine
in primo piano, altro avambraccio rialzato, busto ruotato e panneggio ampio.
Il soggetto occupa una porzione maggiore della finestra illustrata.
Tutte le estremità restano dentro la dimensione massima della carta.
La trasparenza è reale; la scacchiera dell'editor non viene esportata.

PARALLASSE
Soggetto: fino a ±5 px X e ±3 px Y. Fondale: ∓6 px X e ∓4 px Y.
Inclinazione: massimo 3° X e 4° Y. Interpolazione basata sul tempo trascorso.
Movimento lento senza puntatore; pausa; rispetto dinamico di reduced-motion.
Il fondale è completo anche dietro al personaggio. Nessun movimento dei testi
rispetto alla cornice. Inquadratura sorgente del soggetto: X=65, Y=220, scala .86.
Inquadratura del fondale: offset X=50, Y=110, scala 1,06 attorno al centro.
Il JSON e il renderer contengono le trasformazioni esatte.

EDITOR
Testi e colori modificabili, nome e sottotitolo indipendenti.
Ogni trigger e ogni effetto rimangono su una riga: il carattere si riduce se
necessario. I due campi di ciascuna abilità sono su righe distinte.
Clicca e trascina una scritta oppure modifica X, Y, larghezza e corpo.
Cartigli, sigilli e cornice hanno offset indipendenti; soggetto e sfondo hanno
offset e scala. Ampi spostamenti del layout possono interrompere gli intrecci.
Salva JSON prima di chiudere. Apri JSON riconosce lo schema satze.arcana-kit.v1.
Esporta PNG / SVG salva la vista scelta: carta, soggetto, fondale, cornice,
testi o maschera. Il fondo di controllo non viene salvato.

ASSET
L'immagine del gioco è in assets/Originale-220.webp.
La reinterpretazione conserva cranio, corpo di pietra cucito in oro, addome
vuoto e panneggio; cambia posa e punto di vista con un forte scorcio frontale.
Il fondale della Spira è una nuova illustrazione coerente con il tema Kethran.
Cornice raster con maschere SVG; testi nativi, Nimbus Roman Bold incorporato.
Non è una vettorializzazione completa dell'illustrazione.

RICOMPILAZIONE E INTEGRAZIONE
python src/build.py ricompila l'HTML dai sorgenti con Python 3 standard.
window.ArcanaKit.render(stato, {mode:'composite', pop:true, motion:{x:0,y:0}})
restituisce la composizione SVG. Motion usa valori normalizzati da -1 a +1.
Per animare, aggiorna i gruppi subject-motion e background-motion come fa
editor.js, senza ricostruire tutto il documento a ogni fotogramma.
Gli SVG dei componenti incorporano cornice e font per rimanere autonomi.
Il kit non modifica né integra automaticamente il repository del gioco.

VERIFICHE
Controllati formato, alfa, estremità entro la tela, dati della carta, testi su
riga singola, trascinamento, colori indipendenti, JSON, esportazione, movimento,
pausa, reduced-motion e visualizzazione mobile. Risultato in Verifica.json.
