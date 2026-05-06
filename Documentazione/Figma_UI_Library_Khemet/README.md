# Libreria UI Khemet (solo design, zero impatto codice)

Questa cartella contiene una base completa per costruire in Figma una libreria UI di Satze/Khemet senza modificare nulla nel codice dell'app.

## Obiettivo

- Definire uno standard visuale coerente (token + componenti + stati).
- Accelerare la creazione di schermate (deck builder, match, risultati).
- Rendere il lavoro di design riusabile e allineato all'identita Khemet.

## Cosa contiene

- `01_TOKENS_UI.md`: palette, tipografia, spacing, radius, ombre, regole di uso.
- `02_COMPONENTI_E_VARIANTI.md`: componenti principali e varianti consigliate.
- `03_PROMPT_FIGMA_LIBRARY.txt`: prompt pronto per `/figma-generate-library`.
- `04_PROMPT_FIGMA_DESIGN.txt`: prompt pronto per `/figma-generate-design`.
- `05_CHECKLIST_QA_UI.md`: checklist rapida per quality gate visuale.

## Workflow consigliato (10-20 minuti)

1. Crea un file design:
   - `/figma-create-new-file design Satze Khemet UI Library`
2. Genera la libreria:
   - `/figma-generate-library`
   - usa il prompt in `03_PROMPT_FIGMA_LIBRARY.txt`
3. Genera una prima schermata:
   - `/figma-generate-design`
   - usa il prompt in `04_PROMPT_FIGMA_DESIGN.txt`
4. Valida con la checklist:
   - `05_CHECKLIST_QA_UI.md`

## Nota importante

Questa cartella e volutamente separata e documentale: non richiede commit su file sorgente UI e non tocca componenti React/Vue/etc esistenti.
