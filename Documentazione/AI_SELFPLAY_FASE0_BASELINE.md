# Banco di prova IA — misura di partenza (Fase 0, prima di ogni modifica)

Generato: 2026-11-10T09:19:49.727Z · commit `1888636`
Macchina: Intel(R) Xeon(R) Processor @ 2.10GHz · Node v22.23.4
Semi per accoppiamento: 100; ogni seme si gioca due volte a lati scambiati (stesse mani e stessi Campi).

Comando: `npm run selfplay:ai` (vedi `scripts/ai-selfplay.mjs`).
Motore: `src/game/sim/headlessMatch.js` (regole Classico / Mani nude, senza Eminenze; chi raggiunge la maggioranza dei Campi ai turni 3-4 rivendica sempre la vittoria).

Punteggio = vittorie + metà pareggi, sul totale, per il primo agente dell’accoppiamento. IC = intervallo di Wilson al 95%.
Riferimenti: **Casuale** (Campo, Agente e FC a caso) e **Avido** (Agente più forte, quota equa di FC, primo Campo).

## Classico

| A contro B | Partite | Punteggio A | IC 95% | V / N / P | A vince per | Turni medi | FC medi A / B | Punteggio A se apre / se apre B |
|---|---:|---:|---|---|---|---:|---|---|
| Facile – Normale | 200 | **8.5%** | 5.4%–13.2% | 17 / 0 / 183 | Supremazia 13, spareggio Campi 3, Campi 1 | 3.81 | 3.54 / 4.18 | 3.0% / 14.0% |
| Normale – Difficile | 200 | **50.5%** | 43.6%–57.4% | 101 / 0 / 99 | Supremazia 56, Campi 43, spareggio Campi 2 | 4.55 | 3.84 / 3.78 | 41.0% / 60.0% |
| Facile – Difficile | 200 | **9.5%** | 6.2%–14.4% | 19 / 0 / 181 | Supremazia 16, spareggio Campi 2, Campi 1 | 4.01 | 3.53 / 4.14 | 7.0% / 12.0% |
| Facile – Casuale | 200 | **62.5%** | 55.6%–68.9% | 125 / 0 / 75 | Campi 69, Supremazia 49, spareggio Campi 7 | 4.34 | 3.59 / 3.69 | 61.0% / 64.0% |
| Normale – Casuale | 200 | **87.5%** | 82.2%–91.4% | 175 / 0 / 25 | Campi 138, Supremazia 36, spareggio Campi 1 | 3.96 | 4.03 / 3.76 | 84.0% / 91.0% |
| Difficile – Casuale | 200 | **89.0%** | 83.9%–92.6% | 178 / 0 / 22 | Campi 131, Supremazia 45, spareggio Campi 2 | 4.02 | 3.98 / 3.79 | 86.0% / 92.0% |
| Facile – Avido | 200 | **48.0%** | 41.2%–54.9% | 96 / 0 / 104 | Campi 51, Supremazia 39, spareggio Campi 6 | 4.26 | 3.60 / 3.83 | 41.0% / 55.0% |
| Normale – Avido | 200 | **85.5%** | 80.0%–89.7% | 171 / 0 / 29 | Campi 136, Supremazia 33, spareggio Campi 2 | 3.83 | 4.18 / 3.79 | 73.0% / 98.0% |
| Difficile – Avido | 200 | **87.0%** | 81.6%–91.0% | 174 / 0 / 26 | Campi 132, Supremazia 41, spareggio Campi 1 | 4.07 | 4.07 / 3.79 | 84.0% / 90.0% |
| Avido – Casuale | 200 | **67.5%** | 60.7%–73.6% | 135 / 0 / 65 | Campi 86, Supremazia 47, spareggio Campi 2 | 4.26 | 3.83 / 3.67 | 59.0% / 76.0% |

## Mani nude

| A contro B | Partite | Punteggio A | IC 95% | V / N / P | A vince per | Turni medi | FC medi A / B | Punteggio A se apre / se apre B |
|---|---:|---:|---|---|---|---:|---|---|
| Facile – Normale | 200 | **12.0%** | 8.2%–17.2% | 24 / 0 / 176 | Supremazia 19, spareggio Campi 4, Campi 1 | 3.92 | 3.59 / 4.12 | 5.0% / 19.0% |
| Normale – Difficile | 200 | **55.0%** | 48.1%–61.7% | 110 / 0 / 90 | Supremazia 52, Campi 51, spareggio Campi 7 | 4.54 | 3.84 / 3.78 | 53.0% / 57.0% |
| Facile – Difficile | 200 | **18.5%** | 13.7%–24.5% | 37 / 0 / 163 | Supremazia 34, spareggio Campi 2, Campi 1 | 4.20 | 3.60 / 3.99 | 15.0% / 22.0% |
| Facile – Casuale | 200 | **65.0%** | 58.2%–71.3% | 130 / 0 / 70 | Campi 68, Supremazia 53, spareggio Campi 9 | 4.32 | 3.61 / 3.66 | 68.0% / 62.0% |
| Normale – Casuale | 200 | **86.5%** | 81.1%–90.6% | 173 / 0 / 27 | Campi 131, Supremazia 40, spareggio Campi 2 | 3.97 | 4.03 / 3.77 | 83.0% / 90.0% |
| Difficile – Casuale | 200 | **87.5%** | 82.2%–91.4% | 175 / 0 / 25 | Campi 116, Supremazia 55, spareggio Campi 4 | 4.13 | 3.96 / 3.76 | 84.0% / 91.0% |
| Facile – Avido | 200 | **54.5%** | 47.6%–61.3% | 109 / 0 / 91 | Supremazia 55, Campi 47, spareggio Campi 7 | 4.28 | 3.66 / 3.79 | 47.0% / 62.0% |
| Normale – Avido | 200 | **84.5%** | 78.8%–88.9% | 169 / 0 / 31 | Campi 134, Supremazia 35 | 3.89 | 4.18 / 3.78 | 72.0% / 97.0% |
| Difficile – Avido | 200 | **83.5%** | 77.7%–88.0% | 167 / 0 / 33 | Campi 122, Supremazia 41, spareggio Campi 4 | 4.15 | 4.03 / 3.80 | 78.0% / 89.0% |
| Avido – Casuale | 200 | **64.5%** | 57.7%–70.8% | 129 / 0 / 71 | Campi 84, Supremazia 40, spareggio Campi 5 | 4.26 | 3.82 / 3.66 | 62.0% / 67.0% |

## Tempi di decisione dell’IA (ms)

Con l’iniziativa la decisione è congiunta (Campo + Agente + FC); in risposta il Campo è già fissato.
I tempi dipendono dalla macchina e dal suo carico (le partite possono girare in più processi paralleli): vanno confrontati solo fra misure fatte nelle stesse condizioni.

| Livello | Modalità | Con iniziativa: media / p95 / max | In risposta: media / p95 / max |
|---|---|---|---|
| Facile | Classico | 13 / 29 / 91 | 3 / 7 / 22 |
| Facile | Mani nude | 11 / 24 / 66 | 2 / 5 / 37 |
| Normale | Classico | 14 / 29 / 75 | 484 / 1577 / 2762 |
| Normale | Mani nude | 12 / 24 / 50 | 414 / 1381 / 1776 |
| Difficile | Classico | 17 / 34 / 164 | 726 / 2015 / 3440 |
| Difficile | Mani nude | 17 / 36 / 78 | 630 / 1846 / 2359 |

