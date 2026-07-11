# Satze · Dialogue Kit

Box di testo + dialoghi in stile **Undertale** per il duello: fumetto ancorato alla
carta che parla, testo scritto a macchina, font pixel e **11 effetti** di testo, con
**abbinamenti firmati font+effetto per ogni armata**.

## File
- `satze-dialogue.css` — stili del fumetto + tutti gli effetti (keyframes). Namespace `.sd-*`.
- `satze-dialogue.js` — libreria vanilla (nessuna dipendenza). Espone `window.SatzeDialogue`.
- `demo.html` — esempio funzionante con menu font/effetto e scambio scriptato.

## Installazione
```html
<link rel="stylesheet" href="satze-dialogue.css">
<script src="satze-dialogue.js"></script>
<script>
  SatzeDialogue.injectFonts();  // carica i Google Fonts usati dai preset
</script>
```
> `injectFonts()` aggiunge il `<link>` dei font. In alternativa carica tu i font che ti servono.

## Uso
```js
// il fumetto va montato dentro un contenitore con position:relative
const dlg = new SatzeDialogue.Box({ mount: document.querySelector('.scene'), charMs: 30 });

dlg.say({
  army: 'corte',                                  // preset firmato (font+fx+colore)
  name: 'Araldo di Brace',                        // opzionale (default = nome armata)
  text: '* La Corte Rossa non fa prigionieri.',
  x: 230, y: 125,                                 // punto verso cui punta la codina (px o '30%')
  side: 'above',                                  // 'above' (default) | 'below'
  onDone: () => console.log('riga finita')
});
```

### Opzioni di `say()`
| campo    | tipo               | note |
|----------|--------------------|------|
| `text`   | string             | testo (usa `* ` come in Undertale se vuoi) |
| `name`   | string             | intestazione; nascosta se vuota |
| `army`   | chiave preset      | imposta font+effetto+colore (vedi sotto) |
| `font`   | family CSS         | sovrascrive il font del preset, es. `"'VT323'"` |
| `size`   | number             | dimensione base in px |
| `fx`     | chiave effetto     | sovrascrive l'effetto del preset |
| `color`  | hex                | colore bordo/accent (default bianco) |
| `x` `y`  | number \| string   | ancora della codina |
| `side`   | `'above'\|'below'` | posizione del box rispetto all'ancora |
| `tail`   | string             | posizione codina, es. `'32%'` (verso il centro) |
| `width`  | number \| string   | larghezza box |
| `charMs` | number             | ms per carattere |

### Metodi
- `dlg.skip()` — completa subito la riga in corso
- `dlg.isDone()` — `true` se la riga è finita
- `dlg.hide()` — nasconde il box
- `dlg.destroy()` — rimuove il box dal DOM

## Effetti disponibili (`fx`)
`shake` (tremolio) · `tremor` (terremoto) · `wave` (onda) · `bounce` (rimbalzo) ·
`pulse` (pulsazione) · `sway` (dondolio) · `float` (fluttuo) · `glitch` ·
`flicker` (sfarfallio) · `rainbow` (arcobaleno) · `neon`.

## Preset per armata (`army`)
`orizzonte` · `corte` · `kethran` · `calibri` · `orathai` · `enclave` · `ratti` ·
`khemet` · `mounthborn` · `patto`.

Ognuno definisce `font`, `size`, `fx`, `color` e `name`. Modificali/aggiungine in
`satze-dialogue.js` → oggetto `ARMY`. Puoi anche leggerli a runtime:
```js
SatzeDialogue.ARMY.corte  // { name, font, size, fx, color }
```

## Sequenza di dialoghi
Concatena con `onDone` + un piccolo timeout (vedi `demo.html`, funzione `playFrom`).

## Accessibilità
Con `prefers-reduced-motion: reduce` gli effetti sono disattivati automaticamente
(le lettere restano leggibili, con una leggera inclinazione).
