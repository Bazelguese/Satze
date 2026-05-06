# Dimensioni TABELLONE CAMPI – per mappa di guerra 32-bit

## Box principale (Tabellone Campi)
- **Larghezza:** 396px (colonna 428px − padding 32px)
- **Altezza:** ~477px (da DOM, dipende dal contenuto)
- **Padding:** 12px (p-3) su tutti i lati
- **Area contenuto:** 372 × 453px

---

## Riquadri interni (coordinate dall’angolo in alto a sinistra del contenuto)

### 1. Zona titolo "TABELLONE CAMPI"
- **Posizione:** x: 12px, y: 12px
- **Dimensioni:** 372 × 22px
- **Note:** Solo testo, nessun box

### 2. Box "Round e Stato Partita"
- **Posizione:** x: 12px, y: 42px (dopo titolo + mb-2)
- **Dimensioni:** 372 × ~130px
- **Padding interno:** 8px (p-2)
- **Margine sotto:** 12px (mb-3)

Contenuto:
- Riga ROUND: ~18px
- Barra progresso (5 segmenti): 6px + 4px margine
- Contatore Tu/IA: ~12px + 8px margine
- Box "Condizione di Vittoria": ~50px

### 3. Box "Condizione di Vittoria" (dentro il box Round)
- **Posizione relativa:** circa y: 90px dall’inizio del box Round
- **Dimensioni:** ~356 × 50px (372 − 16 padding)
- **Padding:** 8px orizzontale, 6px verticale (px-2 py-1.5)

### 4. Lista Campi di Battaglia (5 riquadri)
- **Posizione:** x: 12px, y: ~184px
- **Spaziatura tra elementi:** 4px (space-y-1)
- **Ogni MiniBattlefield:** 372 × 40px (h-10)
- **Totale altezza lista:** 5×40 + 4×4 = 216px

| # | Campo      | Y (da inizio contenuto) |
|---|------------|--------------------------|
| 1 | Campo 1    | 184px                    |
| 2 | Campo 2    | 228px                    |
| 3 | Campo 3    | 272px                    |
| 4 | Campo 4    | 316px                    |
| 5 | Campo 5    | 360px                    |

---

## Dimensioni consigliate per l’immagine
- **Risoluzione:** 396 × 477px (o 792 × 954px per retina)
- **Proporzioni:** ~0.83 : 1 (portrait)
