# SATZE — CAMPI DI BATTAGLIA · LISTA MASTER

Tutti gli 83 campi con nome finale, effetto e tag. Sostituisce App. B di `SISTEMA_POOL_CAMPI.md` per nomi e tag.

**Legenda tag**
- `category`: tipo meccanico + mode-gate — values · limit · conditional · focus · trigger · neutral
- `rarità`: grado di dirompenza (pilota la pesca) — comune · raro · special
- `minTurn`: turno minimo in cui il campo può essere attivo (1 / 2)
- *tema* = intestazione di sezione (etichetta, non pesa lo spawn)

**Totali:** comune 31 · raro 36 · special 11 · neutri 5 → **83**. Ogni armata: 6 campi a tema.

---

## Generico *(18 — riempitivo condiviso)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 1 | Gran Corno | In scontro · Entrambi · +4 POT | values | raro | 1 |
| 2 | Altopiano delle Tre Lune | In scontro · Entrambi · −1 POT, +1 DAN | values | comune | 1 |
| 3 | Arena degli Gnomi | Regola · Poteri disattivati | limit | raro | 1 |
| 4 | Miniera di Lacrime | Vincitore: +2 PV | conditional | comune | 2 |
| 5 | Nido dell'Antico | In scontro · Entrambi · −2 DAN | values | comune | 1 |
| 6 | Tempio del Monaco Pazzo | Regola · Bonus disattivati | limit | raro | 1 |
| 7 | Sala degli Specchi | In scontro · Entrambi · POT scambiate | values | special | 1 |
| 8 | Cripta dei Sussurri | Perdente: +1 FC | conditional | comune | 1 |
| 9 | Porte di Atlantide | FC raddoppiati nel calcolo VA | focus | special | 1 |
| 10 | Nido di Spine | Vincitore: −5 PV | conditional | raro | 1 |
| 11 | Canyon delle Lame | Vincitore: +2 DAN extra | conditional | comune | 1 |
| 12 | Torre d'Avorio | Vincitore: +1 FC | conditional | comune | 1 |
| 13 | Fossa dei Leoni | In scontro · Entrambi · +2 DAN | values | comune | 1 |
| 14 | Santuario del Silenzio | Regola · Poteri e Bonus disattivati | limit | special | 1 |
| 15 | Nexus Arcano | Regola · DAN max 4 | limit | raro | 1 |
| 16 | Voragine Infinita | Entrambi: −3 PV dopo lo scontro | conditional | comune | 2 |
| 17 | Altare del Sacrificio | Perdente: 2 Danni dir. extra | conditional | comune | 1 |
| 18 | Biblioteca Proibita | In scontro · Chi investe meno FC · +5 VA | values | special | 1 |

## Figli dell'Orizzonte *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 19 | Nebulosa dei Ricordi | In scontro · Entrambi · +1 POT | values | comune | 1 |
| 20 | Orlo del Buco Nero | In scontro · Entrambi · POT e DAN invertiti | values | special | 1 |
| 21 | Cimitero di Stelle | In scontro · Entrambi · −2 VA | values | comune | 1 |
| 35 | Frammento Oscurato | In scontro · Entrambi · −2 POT, −2 DAN | values | raro | 1 |
| 36 | Il Pozzo Gravitazionale | Regola · FC investiti max 3 | limit | special | 1 |
| 37 | Trono Solare | Vincitore: +1 PV | conditional | comune | 2 |

## Kethran *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 22 | Fondamenta della Torre | Gloria e Vendetta sempre attivi | trigger | raro | 2 |
| 23 | Ziqqurat Spezzata | Perdente: +1 FC | conditional | comune | 1 |
| 24 | Biblioteca delle Lingue Perdute | Regola · Effetti Blocca disattivati | limit | raro | 1 |
| 38 | Trono dei Re Caduti | Vincitore: 1 Danni dir. a sé | conditional | comune | 1 |
| 39 | Mura della Sfida | Rimonta sempre attiva per entrambi | trigger | raro | 2 |
| 56 | Falso idolo | Chi è sotto nei PV: +3 VA | conditional | raro | 2 |

## Corte Rossa *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 25 | Sala dei Contratti | Vincitore: −2 FC | conditional | comune | 1 |
| 26 | Trono di Cenere | In scontro · Entrambi · +1 DAN | values | comune | 1 |
| 27 | Fossa dei Traditori | Regola · Copia Bonus disattivata | limit | raro | 1 |
| 40 | Tribunale dell'Anima | Perdente: −1 FC | conditional | comune | 1 |
| 41 | Crocevia dei Patti | Poteri si attivano senza trigger | trigger | special | 1 |
| 42 | Mercato delle Anime | In scontro · Entrambi · −3 POT (min 1) | values | raro | 1 |

## Calibri Pesanti *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 28 | Mura EMP | Regola · Immune disattivato | limit | raro | 1 |
| 29 | Nucleo del Reattore | Overdrive si attiva con 4 FC | trigger | raro | 1 |
| 30 | Deposito di Rottami | Perdente: +1 FC | conditional | comune | 2 |
| 43 | Firewall Centrale | Regola · DAN dir. disattivati | limit | raro | 1 |
| 44 | Centrale Energetica | Overdrive: +1 DAN extra | conditional | comune | 1 |
| 57 | La Grande Forgia | Cura 1 PV a chi ha meno PV dopo lo scontro | conditional | comune | 2 |

## Orathai *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 31 | Convergenza delle Ley | Magnanimo sempre attivo per entrambi | trigger | raro | 1 |
| 32 | Radura dell'Anima | Regola · Modificatori POT/DAN disattivati | limit | special | 1 |
| 45 | Cerchio di Evocazione | Intervento sempre attivo per entrambi | trigger | raro | 1 |
| 46 | Fonte del Mana | +1 FC a entrambi dopo lo scontro | conditional | comune | 2 |
| 47 | Sanctum dell'Equilibrio | In scontro · Lega più alta · −5 VA | values | raro | 1 |
| 58 | L'Albero del Giudizio | Resa dei conti sempre attiva per entrambi | trigger | raro | 1 |

## Nati dalla Bocca *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 33 | Nido della Regina | In scontro · Entrambi · DAN dir. +1 | values | comune | 1 |
| 34 | Pianura Divorata | Cura 1 PV a entrambi dopo lo scontro | conditional | comune | 2 |
| 48 | Palude Tossica | Entrambi: −1 PV dopo lo scontro | conditional | comune | 2 |
| 49 | Alveare Abbandonato | Imboscata sempre attiva per entrambi | trigger | raro | 1 |
| 50 | Terreno di Caccia | In scontro · Entrambi · +2 DAN | values | comune | 1 |
| 59 | Le Grandi Fauci | Regola · Trigger invertiti · Imboscata ↔ Intervento | limit | raro | 1 |

## Enclave delle Scaglie *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 60 | Volta del Tesoro | +2 FC a entrambi dopo lo scontro | conditional | comune | 2 |
| 61 | Trono d'Ossidiana | Gli effetti con trigger Conquista valgono doppio (entrambi) | conditional | raro | 1 |
| 62 | Arena delle Scaglie | Vince il duello chi ha investito più FC (ignora il VA) | focus | special | 1 |
| 63 | Caverna del Wyrm | Regola · POT max 5 | limit | raro | 1 |
| 64 | Cova di Scaglie | L'agente giocato per primo: +1 POT | conditional | comune | 1 |
| 65 | Picco del Drago Caduto | Vincitore: +1 FC e −2 PV | conditional | raro | 1 |

## Ratti della Megera *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 66 | Fogna Maestra | Regola · Min effetti −1 (es. min 5 → 4) | limit | raro | 1 |
| 67 | Reggia del Custode | FC dimezzati (per eccesso) nel calcolo VA | focus | special | 1 |
| 68 | Trono della Megera | Ultimo Desiderio si attiva 2 volte (entrambi) | trigger | raro | 1 |
| 69 | Lago dei Miasmi | In scontro · Chi ha più POT · −1 POT | values | comune | 1 |
| 70 | Cattedrale del Decadimento | Regola · Bonus → Conquista: Tossina 2 (min 10) | limit | raro | 1 |
| 71 | Decadente Catrelburg | In scontro · Chi ha meno POT · +5 VA | values | raro | 1 |

## Patto degli Indocili *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 72 | L'Ultrastrada | Turbo sempre attivo per entrambi | trigger | raro | 1 |
| 73 | Ponte dei Vandali | Regola · Trigger invertiti · Ultima Chance ↔ Turbo | limit | raro | 1 |
| 74 | Il Circuito | Regola · 1° Potere: Sfida · 2°: Sopraffare | limit | raro | 1 |
| 75 | Undicesima Megalopoli | In scontro · Entrambi · −1 POT, −3 VA | values | comune | 1 |
| 76 | L'Ultimo Distributore | Ogni 3 FC investiti: +1 DAN | focus | comune | 1 |
| 77 | Posto di Blocco | Regola · Secondo giocato · Potere disattivato | limit | raro | 1 |

## Khemet *(6)*

| id | Nome | Effetto | category | rarità | minTurn |
|----|------|---------|----------|--------|---------|
| 78 | Tempio di Cobalto | In scontro · Entrambi · +4 VA | values | raro | 1 |
| 79 | Camera Rituale | Overdrive: +1 POT e +1 DAN extra a entrambi | conditional | raro | 1 |
| 80 | Sala dei Soulwright | Regola · Entrambi · Immune | limit | raro | 1 |
| 81 | Altare dell'Imposizione | Regola · Entrambi · DAN = POT | limit | special | 1 |
| 82 | Necropoli Dorata | Vincitore: cura 1 PV | conditional | comune | 2 |
| 83 | Cripta dei Re-Maghi | Resistenza sempre attiva per entrambi | trigger | raro | 2 |

## Neutri *(5 — solo Bare Hands · battaglie del mondo di SATZE)*

| id | Nome | Effetto | category | minTurn |
|----|------|---------|----------|---------|
| 51 | La Piana della Torre Caduta | Nessuno | neutral | 1 |
| 52 | Ignoto inarrivabile | Nessuno | neutral | 1 |
| 53 | Il Bastione del Nono Mondo | Nessuno | neutral | 1 |
| 54 | Il Ponte dell'Ultimo Campione | Nessuno | neutral | 1 |
| 55 | Le Ceneri del Mondo Senza Nome | Nessuno | neutral | 1 |

---

### Note d'implementazione (richiedono codice nuovo)

- **Nuovi field-mod `alwaysActive`** (oggi solo gloria/imboscata/intervento/magnanimo/rimonta/vendetta): 58, 72, 83.
- **Swap/override trigger:** 59, 73, 74.
- **`Imponi`** non ancora implementato: 81.
- **Modificatori globali di campo:** 61 (×2 Conquista), 62/67 (override calcolo VA), 66 (−1 ai "minimi"), 68 (×2 Ultimo Desiderio).
