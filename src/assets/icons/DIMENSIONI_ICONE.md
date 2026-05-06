# Dimensioni Consigliate per le Icone

## 📐 Dimensioni Standard

### Per Icone SVG (Raccomandato)

**ViewBox standard: `24x24`**

Le icone SVG dovrebbero sempre usare `viewBox="0 0 24 24"`. Questo permette al componente React di scalarle a qualsiasi dimensione senza perdita di qualità.

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Il tuo disegno qui -->
</svg>
```

**Vantaggi:**
- ✅ Scalabili a qualsiasi dimensione
- ✅ File piccoli
- ✅ Nitide su qualsiasi risoluzione
- ✅ Facili da modificare

### Per Immagini PNG/JPG

Se preferisci creare icone come immagini raster, usa queste dimensioni:

| Uso | Dimensione Consigliata | Dimensione Minima |
|-----|------------------------|-------------------|
| **Icone piccole** (toolbar, badge) | 48x48 px | 24x24 px |
| **Icone medie** (carte, UI) | 128x128 px | 64x64 px |
| **Icone grandi** (selezione, hero) | 256x256 px | 128x128 px |
| **Icone extra-large** (splash, decorazioni) | 512x512 px | 256x256 px |

**Raccomandazione:** Crea a **256x256 px** o **512x512 px** e lascia che il browser le scala. Questo garantisce nitidezza anche su schermi ad alta risoluzione.

## 🎯 Dimensioni di Utilizzo nel Codice

Analizzando il codice, le icone vengono usate a queste dimensioni:

### Icone Armate
- **Default:** 24px (`<Icon size={24} />`)
- **Selezione Agente:** 48px (`<Icon size={48} />`)
- **Carte piccole:** ~38px (64px carta × 0.6)
- **Carte medie:** ~78px (130px carta × 0.6)
- **Carte grandi:** ~84px (140px carta × 0.6)
- **Carte extra-large:** ~108px (180px carta × 0.6) o ~156px (260px carta × 0.6)

### Icone Tipi Carta (Fallback)
- Stesse dimensioni delle icone armate
- Scalate automaticamente in base alla dimensione della carta

## 📏 Linee Guida di Design

### Spaziatura e Margini
- Lascia almeno **2px di padding** intorno al disegno nel viewBox
- Per icone 24x24, il disegno dovrebbe occupare circa **20x20 px** al centro

### Spessore Linee
- **Linee sottili:** 1-1.5px per icone piccole
- **Linee medie:** 2px per icone medie/grandi
- **Evita linee troppo spesse** (< 3px) per mantenere dettagli visibili quando scalate

### Dettagli
- **Evita dettagli troppo piccoli** che scompaiono quando scalati
- **Usa forme semplici e riconoscibili**
- **Testa l'icona a 16px, 24px, 48px** per verificare la leggibilità

## 🎨 Esempi di Dimensioni

### Icona Cometa (Figli dell'Orizzonte)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Disegno ottimizzato per 24x24 -->
  <!-- Scala perfettamente a qualsiasi dimensione -->
</svg>
```

### Icona Tempio (Kethran)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Struttura chiara, linee 1.5-2px -->
  <!-- Forme geometriche semplici -->
</svg>
```

## ✅ Checklist per Creare Icone

- [ ] ViewBox impostato a `0 0 24 24` (per SVG)
- [ ] Disegno centrato con 2px di padding
- [ ] Linee con spessore 1-2px
- [ ] Testato a 16px, 24px, 48px
- [ ] Forme semplici e riconoscibili
- [ ] Colori compatibili con il sistema di temi
- [ ] File ottimizzato (SVG pulito o PNG compresso)

## 🔧 Strumenti Consigliati

- **SVG:** Inkscape, Figma, Adobe Illustrator
- **PNG:** Photoshop, GIMP, Figma
- **Ottimizzazione SVG:** SVGO, SVGOMG
- **Ottimizzazione PNG:** TinyPNG, ImageOptim

## 💡 Suggerimenti

1. **Inizia sempre con SVG** - più flessibili e scalabili
2. **Usa un template 24x24** come base
3. **Mantieni uno stile coerente** tra tutte le icone
4. **Testa su schermi diversi** per verificare la leggibilità
5. **Ottimizza i file** prima di aggiungerli al progetto
