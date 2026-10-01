# Arcana · livelli (art alternativa)

Ogni agente Arcana ha una cartella sotto questa directory. Non è l’artwork P4: è la forma a livelli (parallasse) + layout Arcana (vetro, cartigli, sigilli).

Funziona come Eldritch: stesso canvas **1104×1584** (23:33), stessa preferenza Standard/alt in galleria, stessa slot plancia (cornice interna 230×H).

## Percorso

```
public/card-images/arcana/layers/<slug>/
```

Esempi:

- `leggero-richiamato/` — id 108 · Figli dell’Orizzonte

## File obbligatori

| File | Ruolo |
|------|--------|
| `soggetto.webp` | Personaggio su canvas finale 1104×1584, RGBA. |
| `sfondo-inquadrato.webp` | Fondale già montato sul canvas finale (layered). |
| `sfondo.webp` | Fondale sorgente 1024×1536 (movimento / rebuild). |
| `cornice.webp` | Vetro + cartigli + sigilli senza testi. |
| `layout.webp` | Solo tipografia. |
| `composita.webp` | Carta statica usata in partita. |
| `card.json` | Schema `satze.arcana-kit.v1` (colori, parallasse, layout). |

## Ordine di disegno

1. sfondo  
2. cornice (vetro)  
3. soggetto **sopra** la cornice (fuoriuscita)  
4. layout tipografico  

## Registrazione

Dopo i file nella cartella, registra in  
`src/components/cardFaceLab/cardFaceLabData.js` → `LAYERED_CARD_KITS`  
con `arcanaKitFromFolder(...)` (`style: 'arcana'`).

Import: `node scripts/import-arcana-kit.mjs`
