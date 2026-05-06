# 📸 Guida al Caricamento delle Immagini delle Carte

Questa cartella contiene le immagini PNG delle carte del gioco.

## 📋 Come Caricare Nuove Immagini

### 1. Preparare le Immagini

- **Formato**: PNG, JPG, JPEG o WEBP
- **Nome file**: Deve seguire il formato `ID.png` dove `ID` è l'ID numerico della carta
  - Esempio: `101.png`, `102.png`, `201.png`, ecc.
- **Dimensioni consigliate**: 200x300px (formato verticale)

### 2. Posizionare i File

Metti i file PNG nella cartella `carte/Immagini/`:
```
carte/
  Immagini/
    101.png
    102.png
    103.png
    ...
```

### 3. Aggiornare il File images.js

Esegui lo script di aggiornamento:

```bash
npm run update-images
```

Oppure direttamente:

```bash
node scripts/update-card-images.js
```

Lo script:
- ✅ Legge tutti i file PNG dalla cartella `carte/Immagini/`
- ✅ Li converte in base64
- ✅ Aggiorna automaticamente `src/data/images.js`
- ✅ Mantiene le immagini esistenti e aggiunge/aggiorna solo quelle nuove

### 4. Verificare

Dopo aver eseguito lo script, verifica che:
- Il file `src/data/images.js` sia stato aggiornato
- Le nuove immagini appaiano correttamente nel gioco

## 🎯 Mapping ID Carte → Armate

- **101-115**: Comete
- **201-215**: Progenie di Babele
- **301-315**: Corte dei Diavoli
- **401-415**: Legione Meccanica
- **501-515**: Circolo Mistico
- **601-615**: Sciame Divorante
- **701-715**: L'Enclave delle Scaglie
- **801-815**: Ratti della Megera

## ⚠️ Note Importanti

- I file devono avere esattamente il nome `ID.png` (es: `101.png`, non `carta-101.png`)
- Se un'immagine con lo stesso ID esiste già, verrà sostituita
- Lo script mantiene automaticamente l'organizzazione per armata nel file `images.js`

## 🔍 Risoluzione Problemi

**Problema**: Lo script non trova le immagini
- Verifica che i file siano nella cartella `carte/Immagini/`
- Verifica che i nomi dei file seguano il formato `ID.png`

**Problema**: Le immagini non appaiono nel gioco
- Verifica che l'ID della carta corrisponda a quello nel file `src/data/cards.js`
- Controlla la console del browser per eventuali errori
