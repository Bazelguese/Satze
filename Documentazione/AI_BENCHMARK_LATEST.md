# SATZE AI Planner — Benchmark Latest

Generato: 2026-07-26T19:00:21.111Z

## Ambiente

- Macchina: DESKTOP-FNO2UBV
- OS: Windows_NT 10.0.26200 (x64)
- CPU: 11th Gen Intel(R) Core(TM) i7-11700K @ 3.60GHz
- Node: v24.13.0
- Decisioni per difficoltà: 100
- Include decisioni congiunte Campo–carta–Focus: sì

## Metriche

- **tempo**: latenza `chooseAI*` / `chooseJointAIAction`
- **nodi / cache**: searchStats del planner
- **Focus**: FC scelti (anche per round)
- **oltre-cap**: Focus > ordinaryCap
- **VA margin**: `enemyAssault - playerAssault` quando l’IA vince lo scenario avversario
- **excessFocus**: FC scelti − minimo Focus sulla stessa carta con stesso `winner` e `terminalStatus`

## easy

| Metrica | mean | median | p95 |
|---------|------|--------|-----|
| tempo ms | 1.21 | 0.81 | 2.41 |
| nodi | 0.0 | 0 | 0 |
| cache hit | 0.0 | 0 | 0 |
| Focus | 3.68 | 4.00 | 6.00 |
| excessFocus | 1.70 | 2.00 | 4.00 |

- Target p95 tempo: ≤ 30 ms → **OK**
- Oltre cap: 4.0%
- VA margin medio (vittorie IA): 12.26 (n=77)
- Decisioni joint nel campione: 25

### Focus per round

| Round | mean | p95 | n |
|-------|------|-----|---|
| R1 | 3.52 | 6.00 | 25 |
| R2 | 3.76 | 6.00 | 25 |
| R3+ | 3.72 | 6.00 | 50 |

## medium

| Metrica | mean | median | p95 |
|---------|------|--------|-----|
| tempo ms | 48.88 | 35.46 | 119.50 |
| nodi | 2780.0 | 1856 | 7582 |
| cache hit | 52.5 | 0 | 236 |
| Focus | 4.11 | 4.00 | 6.00 |
| excessFocus | 2.05 | 2.00 | 5.00 |

- Target p95 tempo: ≤ 200 ms → **OK**
- Oltre cap: 0.0%
- VA margin medio (vittorie IA): 16.22 (n=87)
- Decisioni joint nel campione: 25

### Focus per round

| Round | mean | p95 | n |
|-------|------|-----|---|
| R1 | 3.68 | 5.00 | 25 |
| R2 | 4.16 | 6.00 | 25 |
| R3+ | 4.30 | 6.00 | 50 |

## hard

| Metrica | mean | median | p95 |
|---------|------|--------|-----|
| tempo ms | 450.74 | 468.94 | 902.54 |
| nodi | 23521.1 | 25794 | 48107 |
| cache hit | 590.3 | 382 | 1525 |
| Focus | 4.78 | 5.00 | 7.00 |
| excessFocus | 2.67 | 3.00 | 5.00 |

- Target p95 tempo: ≤ 800 ms → **SOPRA TARGET**
- Oltre cap: 0.0%
- VA margin medio (vittorie IA): 20.39 (n=84)
- Decisioni joint nel campione: 25

### Focus per round

| Round | mean | p95 | n |
|-------|------|-----|---|
| R1 | 4.20 | 6.00 | 25 |
| R2 | 4.76 | 6.00 | 25 |
| R3+ | 5.08 | 7.00 | 50 |

