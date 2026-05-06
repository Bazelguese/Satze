# Sistema di Icone Personalizzate

Il sistema di icone personalizzate sostituisce le emoji con icone SVG/immagini personalizzate per un aspetto più professionale e coerente.

## Struttura

- **`src/components/ui/Icon.jsx`** - Componente React per renderizzare le icone
- **`src/data/icons.js`** - Configurazione e definizione delle icone
- **`src/assets/icons/`** - Cartella per file SVG/immagini personalizzate

## Come Usare le Icone

### Esempio 1: Icona di un'Armata

```jsx
import { Icon } from './components/ui/Icon';

// Renderizza l'icona di un'armata
<Icon name="Figli dell'Orizzonte" type="army" size={32} />
```

### Esempio 2: Icona con Colore Personalizzato

```jsx
import { Icon } from './components/ui/Icon';

// Icona con colore personalizzato
<Icon 
  name="Corte Rossa" 
  type="army" 
  size={24} 
  color="#ff0000" 
/>
```

### Esempio 3: Icona di Tipo Carta

```jsx
import { Icon } from './components/ui/Icon';

// Icona per tipo di carta (fallback)
<Icon name="cosmic_hero" type="cardType" size={48} />
```

### Esempio 4: Uso Diretto nelle Carte

Il componente `CardImage` usa automaticamente le icone personalizzate come fallback quando l'immagine della carta non è disponibile.

## Aggiungere Nuove Icone

### Metodo 1: Componente SVG React (Raccomandato)

Aggiungi un nuovo componente in `src/data/icons.js`:

```javascript
export const IconMiaIcona = ({ size = 24, color = '#a78bfa' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="..." fill={color} />
  </svg>
);

// Aggiungi alla mappa
export const ARMY_ICONS = {
  // ...
  'Nome Armata': IconMiaIcona,
};
```

### Metodo 2: File SVG/Immagine

1. Salva il file in `src/assets/icons/`
2. Importa e usa in `src/data/icons.js`:

```javascript
import miaIcona from '../assets/icons/mia-icona.svg';

export const ARMY_ICONS = {
  // ...
  'Nome Armata': miaIcona,
};
```

## Icone Disponibili

### Armate
- `Figli dell'Orizzonte` - Icona cometa
- `Kethran` - Icona tempio
- `Corte Rossa` - Icona fiamma
- `Calibri Pesanti` - Icona ingranaggio
- `Orathai` - Icona luna
- `Nati dalla Bocca` - Icona virus
- `L'Enclave delle Scaglie` - Icona drago
- `Ratti della Megera` - Icona ratto

### Tipi Carta
- `cosmic_hero`, `cosmic_mage`, `cosmic_spirit`
- `babel_king`, `babel_priest`, `babel_berserker`
- `devil_prince`, `devil_imp`, `devil_demon`
- `mech_titan`, `mech_drone`, `mech_golem`
- `mystic_arcane`, `mystic_oracle`, `mystic_spirit`
- `swarm_queen`, `swarm_beast`, `swarm_insect`

## Personalizzazione

Le icone supportano:
- **Dimensioni personalizzate** tramite prop `size`
- **Colori personalizzati** tramite prop `color` (per SVG)
- **Classi CSS** tramite prop `className`
- **Fallback automatico** se l'icona non è trovata

## Compatibilità

Le emoji originali sono ancora disponibili in `ARMY_SYMBOLS` per compatibilità con codice esistente, ma si raccomanda di migrare all'uso del componente `Icon` per un aspetto più professionale.
