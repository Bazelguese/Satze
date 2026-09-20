# Eldritch · livelli (art alternativa)

Ogni agente Eldritch ha una cartella sotto questa directory. Non è l’artwork P4: è la forma a livelli (parallasse) + layout Eldritch.

## Percorso

```
public/card-images/eldritch/layers/<slug>/
```

Esempi già in repo:

- `sorethai/` — id 101 · Figli dell’Orizzonte  
- `glauson/` — id 221 · Kethran  
- `phimesto/` — id 323 · Corte Rossa  
- `nucleo-comando-nord/` — id 402 · Calibri Pesanti  
- `sylwajuck/` — id 524 · Orathai  
- `evoluzione-finale/` — id 611 · Mounthborn  
- `predatore-alato/` — id 705 · L’Enclave delle Scaglie  
- `cyber-may-punk/` — id 910 · Patto degli Indocili  
- `quarto-marito/` — id 830 · Ratti della Megera  
- `vel-khar/` — id 1004 · Khemet  

## Formato carta (Serie 23-33)

- Canvas export / composita: **1104×1584** (23:33)  
- Slot plancia: **cornice interna** = 230×H (non il bordo esterno)  
- Livelli artistici: **1024×1536** con `object-fit: fill`  
- Testi bake: da `agentToFaceData` (titolo bonus = «Sempre», mai «Bonus»)  

Import: `node scripts/import-eldritch-serie-23-33.mjs`  
Bake: `node scripts/bake-eldritch-composita.mjs`
## File obbligatori

| File | Ruolo |
|------|--------|
| `soggetto.webp` | Agente + effetti che devono uscire dalla cornice. Art **1024×1536**, WebP alpha. |
| `sfondo.webp` | Plate opaco senza l’agente (stessa risoluzione art). |
| `card.json` | Dati carta + composition / formato 23:33. |

## File opzionali

| File | Ruolo |
|------|--------|
| `cornice.webp` | Cornice dedicata; se manca si usa `eldritch/cornici/Cornice-<esercito>.png`. |
| `composita.webp` | Carta statica 1104×1584 (23:33) usata in partita. |
| `LEGGIMI.md` | Note / prompt usati per i livelli. |

Ottimizzazione: `node scripts/optimize-eldritch-layers.mjs` (PNG → WebP q90, alpha 100).

## Ordine di disegno

1. sfondo  
2. soggetto (nella finestra cornice)  
3. cornice  
4. pezzi di soggetto sopra la cornice (clip/mask da `composition`)  
5. layout Eldritch (macchie + anello lega + testi)

## Registrazione nel lab / gioco

Dopo aver messo i file nella cartella, registra l’agente in  
`src/components/cardFaceLab/cardFaceLabData.js` → `LAYERED_CARD_KITS`  
(id carta, slug cartella, fazione, `composition`).

Il Card Face Lab legge da qui. Gli upload nel tool sono solo override temporanei di prova.
