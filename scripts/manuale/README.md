# Manuale di istruzioni — come si aggiorna

Il libretto è un'unica sorgente che produce due cose:

- la schermata **MANUALE** del menu principale (`src/manual/ManualBook.jsx`);
- il PDF `public/manuale/SATZE-Manuale.pdf`, scaricabile dal pulsante **SCARICA PDF**.

## Dove sono le cose

| Cosa | Dove |
|---|---|
| Testi e ordine delle pagine | `src/manual/manualPages.jsx` |
| Aspetto (carta, titoli, riquadri) | `src/manual/manual.css` |
| Schermate | `public/manuale/img/*.jpg` |
| PDF | `public/manuale/SATZE-Manuale.pdf` |

Trigger, effetti, bonus d'armata, stile delle armate, livelli dell'IA ed Eminenze
**non sono scritti nel manuale**: vengono letti da `src/data/glossary.js`,
`src/data/armies.js`, `src/components/menu/cosmic/armyLore.js`,
`src/utils/aiConstants.js` e `src/data/eminences.js`. Cambiando quei file la
versione in gioco si aggiorna da sola; il PDF va rigenerato.

## Rigenerare il PDF

```bash
npm run manuale:pdf
```

Lo script si ferma con un errore se manca un'immagine o se una pagina ha più
testo di quanto ne entri nel foglio: in quel caso accorcia il testo o spostane
una parte nella pagina accanto.

## Rifare le schermate

Le schermate dei menu, gli stendardi delle armate e la copertina si rifanno da soli:

```bash
npm run manuale:schermate
```

Quelle di partita vanno rifatte a mano, perché dipendono da una partita vera.
Gioca a 1920×1080, cattura lo schermo e salva in `public/manuale/img/` con
questi nomi (JPEG, larghe 1400 px; non WebP, che nel PDF verrebbe ricodificato senza compressione):

| File | Momento da catturare |
|---|---|
| `tavolo.jpg` | Fase «Schieramento», con l'Agente avversario già sul tavolo |
| `campo.jpg` | Fase «Manovra», quando tocca a te scegliere il Campo |
| `investimento.jpg` | Fase «Investimento», con il cursore dei Focus Coin |
| `esito.jpg` | Schermata dell'esito, con il conto del VA ai lati |
| `eminenza.jpg` | Fase «Comando», con le abilità dell'Eminenza |
| `glossario.jpg` | Glossario aperto durante la partita |
| `fine.jpg` | Schermata di fine partita |

Se rifai `tavolo.jpg` o `carta.jpg`, controlla che i richiami numerati
(`dots` in `manualPages.jsx`) cadano ancora sui punti giusti. Se rifai
`esito.jpg`, aggiorna anche il riquadro «L'esempio della figura» nella pagina
*Lo scontro*: i numeri sono quelli della schermata.
