# Harness di traccia Eminenza

Strumento di sola lettura: stampa la sequenza osservabile (gate, avvisi, cue, Presenza) senza modificare le regole.

## Comandi

```bash
node tools/eminence-trace.mjs --eminence kethran_altare --ability kethran_sacrificio
node tools/eminence-trace.mjs --scenario tools/fixtures/eminence/kethran_sacrificio_hit.json
node tools/eminence-trace.mjs --scenario tools/fixtures/eminence/kethran_sacrificio_hit.json --json
node tools/eminence-trace.mjs --gaps
node tools/eminence-trace.mjs --scaffold
```

## Aggiungere un fixture

1. Copia un file in `tools/fixtures/eminence/` (o usa `--scaffold`).
2. I campi assenti prendono i valori di `tools/fixtures/eminence/_defaults.json`.
3. Imposta almeno `player.eminenceId`, `player.abilityId` e `outcome` (hit/miss).
4. Verifica con `--scenario …` poi rigenera gli snapshot.

## Rigenerare gli snapshot

```bash
UPDATE_SNAPSHOTS=1 npm run test:unit
```

I file finiscono in `src/game/eminence/__snapshots__/`. Un diff sullo snapshot segnala un cambiamento di ciò che il giocatore vede: va giustificato nella PR.
