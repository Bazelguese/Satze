# Prototipo: il cammino verso Cael

Prototipo autonomo della schermata di campagna (atto I, verso Cael) in stile Persona, con le due armate:
mappa del cammino, ruota dell'esercito, schede degli agenti, schermata «Esercito e riserva»,
promozione all'altare della Concordia e sacrificio alla Domanda.

Non fa parte del gioco React: è una pagina sola, con i file che le servono accanto.

## Come aprirlo

Apri `index.html` da un server statico qualsiasi, per esempio dalla cartella del repo:

```
npx serve prototipi/campagna-cael
```

Funziona anche aprendo il file direttamente nel browser.
three.js (per le campane) viene caricato da jsDelivr, quindi la promozione ha bisogno della rete.

## File

- `index.html`: la pagina, con stile e logica della schermata.
- `campaign.js`: la logica della campagna, `window.SatzeCampaign`.
- `cards.js`, `cards.css`: il disegno delle carte.
- `card-images/`, `img/`, `fonts/`: immagini delle carte, sfondi e font.
