# Icone Personalizzate

Questa cartella contiene le icone personalizzate per sostituire le emoji nel gioco.

## Struttura

Le icone possono essere:
- **File SVG** (`.svg`) - Raccomandato per scalabilità
- **File PNG/JPG** (`.png`, `.jpg`) - Per icone più complesse
- **Componenti React** - Definiti in `src/data/icons.js`

## Come Aggiungere Nuove Icone

### Opzione 1: File SVG/Immagine

1. Salva il tuo file icona in questa cartella (es. `comet.svg`, `temple.png`)
2. Aggiorna `src/data/icons.js` per importare e usare il file:

```javascript
// Importa il file
import cometIcon from '../assets/icons/comet.svg';

// Aggiungi alla mappa
export const ARMY_ICONS = {
  'Figli dell\'Orizzonte': cometIcon,
  // ...
};
```

### Opzione 2: Componente SVG React

1. Crea un nuovo componente in `src/data/icons.js`:

```javascript
export const IconMiaIcona = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Il tuo SVG qui */}
  </svg>
);
```

2. Aggiungilo alla mappa appropriata (`ARMY_ICONS` o `CARD_TYPE_ICONS`)

## Convenzioni

- **Dimensioni**: Le icone dovrebbero avere un `viewBox="0 0 24 24"` per scalabilità
- **Colori**: Usa il prop `color` per permettere personalizzazione
- **Stile**: Mantieni uno stile coerente tra tutte le icone
- **Naming**: Usa nomi descrittivi (es. `IconComet`, `IconTemple`)

## Esempi

Vedi `src/data/icons.js` per esempi di componenti SVG React già implementati.
