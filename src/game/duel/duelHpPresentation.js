// Sequenza PV mostrata nel risultato del duello (solo presentazione).
// I PV veri si applicano su «Continua» (proceedToNextRound): qui si ricostruisce
// come arrivarci un punto alla volta — prima il DAN dello scontro, poi il resto
// del delta (cura o perdita del Campo) — senza toccare le regole.

export const HP_PROJECTILE_GAP_MS = 340;
export const HP_PROJECTILE_FLIGHT_MS = 720;
export const HP_AFTERMATH_DELAY_MS = 500;
export const HP_AFTERMATH_STEP_MS = 320;
/** Quota della fase 4 (scontro) dopo cui partono i proiettili: lo sconfitto è già stato sbalzato. */
export const HP_PROJECTILE_START_RATIO = 0.85;

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

/**
 * Raffiche di PV per lato.
 * @param {object|null} battleResult
 * @param {{ player: number, enemy: number }} startHP PV a schermo prima del risultato
 * @returns {{ damage: { side: 'player'|'enemy', amount: number } | null,
 *   aftermath: Array<{ side: 'player'|'enemy', kind: 'hit'|'heal', amount: number, label: string|null }> }}
 */
export function buildDuelHpBursts(battleResult, startHP) {
  const out = { damage: null, aftermath: [] };
  if (!battleResult || !startHP) return out;
  const winner = battleResult.winner;
  const loser = winner === 'player' ? 'enemy' : winner === 'enemy' ? 'player' : null;
  const start = { player: toInt(startHP.player), enemy: toInt(startHP.enemy) };
  const final = {
    player: toInt(battleResult.finalPlayerHP, start.player),
    enemy: toInt(battleResult.finalEnemyHP, start.enemy),
  };

  const afterDamage = { ...start };
  if (loser) {
    // Il DAN non scende sotto 0 PV; quel che resta del delta finisce nella raffica del Campo
    const amount = Math.max(0, Math.min(toInt(battleResult.damageDealt), start[loser]));
    if (amount > 0) {
      out.damage = { side: loser, amount };
      afterDamage[loser] = start[loser] - amount;
    }
  }

  const fieldName = battleResult.field?.name || null;
  ['player', 'enemy'].forEach((side) => {
    const rest = final[side] - afterDamage[side];
    if (rest === 0) return;
    out.aftermath.push({ side, kind: rest > 0 ? 'heal' : 'hit', amount: Math.abs(rest), label: fieldName });
  });
  return out;
}

/**
 * Eventi PV punto per punto con l'istante (ms) relativo all'inizio dei proiettili.
 * Ogni evento porta il gruppo (raffica) e il conteggio cumulativo per l'etichetta −1 → −2 → …
 * @returns {Array<{ t: number, side: string, from: number, to: number, kind: 'hit'|'heal',
 *   cause: 'damage'|'aftermath', n: number, total: number, label: string|null, group: string, projectile?: number }>}
 */
export function scheduleDuelHpEvents(battleResult, startHP) {
  const { damage, aftermath } = buildDuelHpBursts(battleResult, startHP);
  const hp = { player: toInt(startHP?.player), enemy: toInt(startHP?.enemy) };
  const events = [];
  let tEnd = 0;
  if (damage) {
    for (let i = 0; i < damage.amount; i++) {
      const t = i * HP_PROJECTILE_GAP_MS + HP_PROJECTILE_FLIGHT_MS;
      const from = hp[damage.side];
      hp[damage.side] = from - 1;
      events.push({ t, side: damage.side, from, to: from - 1, kind: 'hit', cause: 'damage', n: i + 1, total: damage.amount, label: null, group: `damage-${damage.side}`, projectile: i });
      tEnd = t;
    }
  }
  let t0 = tEnd + HP_AFTERMATH_DELAY_MS;
  aftermath.forEach((b) => {
    for (let i = 0; i < b.amount; i++) {
      const from = hp[b.side];
      const to = from + (b.kind === 'heal' ? 1 : -1);
      hp[b.side] = to;
      events.push({ t: t0 + i * HP_AFTERMATH_STEP_MS, side: b.side, from, to, kind: b.kind, cause: 'aftermath', n: i + 1, total: b.amount, label: b.label, group: `aftermath-${b.side}` });
    }
  });
  return events.sort((a, b) => a.t - b.t);
}

/** PV a schermo dopo gli eventi già avvenuti all'istante `elapsedMs`. */
export function displayedHpAt(events, startHP, elapsedMs) {
  const hp = { player: toInt(startHP?.player), enemy: toInt(startHP?.enemy) };
  for (const e of events) {
    if (e.t > elapsedMs) break;
    hp[e.side] = e.to;
  }
  return hp;
}
