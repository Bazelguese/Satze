# html-to-image 1.11.13 (vendorizzato)

Copia dei moduli `es/` di [html-to-image](https://github.com/bubkoo/html-to-image) 1.11.13
(licenza MIT, vedi `LICENSE`), usata da `src/components/fx/captureElement.js`.

Modifiche rispetto all'originale, tutte opzionali (senza le opzioni il comportamento è identico):

- `clone-node.js` → `cloneCSSStyle`: opzione `omitStyle(nativeNode, name, value)`. Se ritorna
  `true` la proprietà non viene scritta nello stile in linea del clone (perché il clone la
  otterrebbe comunque uguale, per ereditarietà o come valore predefinito).
- `clone-pseudos.js`: opzione `omitPseudoStyle(nativeNode, pseudo, name, value)`, lo stesso per
  `::before` / `::after`.

Vendorizzata anche per fissare la versione: nel repository non c'è un lockfile.
