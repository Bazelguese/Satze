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

## Nel gioco

Il gioco apre questa pagina in un frame come schermata della campagna, con `?slot=N`:

- la run è lo slot di salvataggio N del gioco (`satze_campaign_slot_N`), non quella del prototipo;
- si vedono solo la scena e le barre (niente intestazione e note), con un bottone Menu e Esc per tornare al menù;
- dopo «Attraversa» la scena dello scontro resta un attimo, va al nero e il gioco avvia il duello vero;
  a duello finito il gioco riapre la pagina, che parte subito dal premio (o dalla squadra successiva) e poi torna alla mappa.

Il frame parla col gioco con `postMessage` (`{ source: 'satze-campaign', type: 'ready' | 'duel' | 'menu' }`),
vedi `src/components/campaign/CampaignPrototypeFrame.jsx`. In sviluppo Vite serve la cartella così com'è,
nella build viene copiata in `dist/prototipi/campagna-cael` (vedi `vite.config.js`).

## File

- `index.html`: la pagina, con stile e logica della schermata.
- `campaign.js`: la logica della campagna, `window.SatzeCampaign`.
- `cards.js`, `cards.css`: il disegno delle carte.
- `card-images/`, `img/`, `fonts/`: immagini delle carte, sfondi e font.
