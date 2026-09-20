# Cyber May Punk — livelli per animazione

Versione di tre quarti vista dal basso, precedente alla variante frontale.

## File

- Cyber-May-Punk-Soggetto.png: PNG RGBA con trasparenza reale, 1024 × 1536. Include frammenti digitali della testa.
- Cyber-May-Punk-Sfondo.png: immagine opaca, 1024 × 1536; fondale ricostruito anche dietro il soggetto.
- Cyber-May-Punk-Anteprima.html: demo autonoma offline, con immagini incorporate, parallasse, leggera inclinazione e porzioni del soggetto davanti alla cornice.

Le due immagini condividono tela e posizione. Per unirle, collocare il soggetto sullo sfondo con la stessa dimensione e lo stesso punto di origine. La separazione è generativa: conserva la composizione ma non è una ricostruzione pixel per pixel dell’artwork iniziale.

## Ordine dei livelli

1. Sfondo, leggermente ingrandito per evitare bordi scoperti durante il movimento.
2. Soggetto completo.
3. Cornice e supporti grafici.
4. Copia sincronizzata del soggetto, mascherata alle sole parti che devono scavalcare la cornice.
5. Testi e statistiche.

La copia del soggetto non richiede un terzo PNG: usa la stessa immagine e la stessa trasformazione, con una maschera diversa. Nella demo la testa e una porzione della spalla attraversano il bordo.

## Movimento

Per iniziare: pochi pixel di scarto tra i livelli, rotazione della carta entro 3–4 gradi, animazione morbida. L’esempio rispetta la preferenza di movimento ridotto; il movimento si può disattivare. Per movimenti ampi bisogna ricostruire le parti del corpo tagliate dai bordi dell’artwork. Questi due livelli permettono parallasse e movimento rigido; non animano autonomamente braccia o tessuto.

## Layout Eldritch completo

Cornice e anello rosa del Patto degli Indocili (#e867c3), macchie PNG dietro i testi e tipografia Eldritch. La testa e la spalla possono passare sopra la cornice; macchie, testi e statistiche restano in primo piano.

Dati del catalogo disponibile: Cyber May Punk, ID 910, lega 3, potenza 4, danno 1. Potere: Attrizione 1 DAN. Bonus del Patto degli Indocili: Rinforzi: -1 POT, -1 DAN nem. (min 2).

Fonti: Bazelguese/Satze, commit 094b4f7cd128d0575b2f795a81d43563770529eb, src/data/cards.js e src/data/armies.js.

File aggiunti:
- Cyber-May-Punk-Eldritch.png: carta composta, 1024 × 1536, posa statica dell’effetto.
- Cyber-May-Punk-Eldritch.json: dati della carta e riferimenti ai livelli.
- Cyber-May-Punk-Layout.svg: supporti neri, anello e testi su fondo trasparente; la cornice è incorporata separatamente nell’anteprima animata.


## Realizzazione

Soggetto e fondale sono stati preparati con imagegen. Direzione per il soggetto: rimuovere lo sfondo mantenendo la figura nella stessa posa e posizione, conservando il nero interno al corpo e i frammenti della testa, producendo un vero canale alpha. Direzione per il fondale: rimuovere completamente personaggio e particelle, ricostruire città, pioggia e cielo con la stessa prospettiva dal basso e il tratto Eldritch.
