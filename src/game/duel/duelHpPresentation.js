// Sequenza PV mostrata nel risultato del duello (solo presentazione).
// I PV finali arrivano dal motore (battleResult): qui si ricostruisce come arrivarci
// un punto alla volta — prima il DAN dello scontro, poi ogni altra fonte (Potere,
// Bonus, Campo, Eminenza) con la sua raffica — senza toccare le regole.

export const HP_PROJECTILE_GAP_MS = 340;
export const HP_PROJECTILE_FLIGHT_MS = 720;
export const HP_AFTERMATH_DELAY_MS = 500;
export const HP_AFTERMATH_STEP_MS = 320;
/** Raffiche di fonti diverse partono insieme, sfalsate di poco: il numero cambia sempre di un punto alla volta. */
export const HP_SOURCE_STAGGER_MS = 160;
/** Quota della fase 4 (scontro) dopo cui partono i proiettili: lo sconfitto è già stato sbalzato. */
export const HP_PROJECTILE_START_RATIO = 0.85;

/** Fasi del log dopo lo schieramento: le variazioni `deploy` sono già nei PV di partenza. */
const DUEL_REVEAL = new Set(['abilityFx', 'focusFx', 'assaultFx', 'outcome', 'postFx']);

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function engineSide(battleSide) {
  if (battleSide === 'local' || battleSide === 'player') return 'player';
  if (battleSide === 'opponent' || battleSide === 'enemy') return 'enemy';
  return null;
}

/** «TU (Nome Agente)» / «IA (Nome Agente) (copiato)» → «Nome Agente». */
function agentNameOf(name) {
  const m = /^(?:TU|IA)\s*\((.+?)\)/.exec(String(name || ''));
  return m ? m[1] : null;
}

/** Nome leggibile della fonte: l'Agente per i Poteri, «Bonus Armata» per i Bonus, il Campo, l'Eminenza. */
function sourceLabel(src, battleResult) {
  if (!src) return null;
  const owner = engineSide(src.ownerSide);
  const agent = owner === 'player' ? battleResult.playerAgent : owner === 'enemy' ? battleResult.enemyAgent : null;
  if (src.kind === 'field') return src.name || null;
  if (src.kind === 'ability') return agentNameOf(src.name) || agent?.name || src.name || null;
  if (src.kind === 'bonus') return agent?.army ? `Bonus ${agent.army}` : src.name || 'Bonus';
  if (src.kind === 'eminence') return 'Eminenza';
  return src.name || null;
}

const STEP_ABILITY_KINDS = new Set(['power', 'inversion', 'block']);

/** Step visivo (fase 1) in cui si attiva il Potere di un lato, o -1. */
function abilityStepOf(battleResult, side) {
  const steps = Array.isArray(battleResult?.visualSteps) ? battleResult.visualSteps : [];
  const preVa = steps.findIndex((s) => s.kind === 'preVa');
  const end = preVa >= 0 ? preVa : steps.length;
  for (let i = 1; i < end; i += 1) {
    if (steps[i].side === side && STEP_ABILITY_KINDS.has(steps[i].kind)) return i;
  }
  return -1;
}

/** Eventi PV dei Poteri durante gli effetti, ognuno con lo step del suo Agente. */
function steppedPvEvents(battleResult) {
  const out = [];
  (Array.isArray(battleResult?.events) ? battleResult.events : []).forEach((e) => {
    if (!e || e.type !== 'resourceChange' || e.stat !== 'PV' || e.revealAt !== 'abilityFx') return;
    if (e.source?.kind !== 'ability') return;
    const owner = engineSide(e.source.ownerSide);
    const step = owner ? abilityStepOf(battleResult, owner) : -1;
    if (step < 0) return;
    out.push({ e, step });
  });
  return out;
}

/**
 * PV che cambiano durante gli effetti (es. «Turbo: 2 Danni dir.»): una raffica per fonte
 * nello step in cui si attiva il Potere.
 * @returns {Array<{ stepIndex: number, side: 'player'|'enemy', kind: 'hit'|'heal', amount: number, label: string|null, key: string }>}
 */
export function buildDuelHpStepBursts(battleResult) {
  const map = new Map();
  steppedPvEvents(battleResult).forEach(({ e, step }) => {
    const side = engineSide(e.target?.side);
    if (!side) return;
    const delta = toInt(e.after) - toInt(e.before);
    if (!delta) return;
    const label = sourceLabel(e.source, battleResult);
    const key = `${step}:${side}:${label || ''}`;
    const cur = map.get(key) || { stepIndex: step, side, delta: 0, label, key };
    cur.delta += delta;
    map.set(key, cur);
  });
  return [...map.values()]
    .filter((b) => b.delta)
    .map(({ delta, ...b }) => ({ ...b, kind: delta > 0 ? 'heal' : 'hit', amount: Math.abs(delta) }));
}

/** PV a schermo dopo gli effetti (partenza della sequenza del risultato). */
export function hpAfterDuelSteps(battleResult, startHP) {
  const hp = { player: toInt(startHP?.player), enemy: toInt(startHP?.enemy) };
  buildDuelHpStepBursts(battleResult).forEach((b) => { hp[b.side] += b.kind === 'heal' ? b.amount : -b.amount; });
  return hp;
}

/**
 * Raffiche di PV dopo lo scontro (i PV degli effetti sono già in `startHP`: vedi hpAfterDuelSteps).
 * @param {object|null} battleResult
 * @param {{ player: number, enemy: number }} startHP PV a schermo prima del risultato
 * @returns {{ damage: { side: 'player'|'enemy', amount: number } | null,
 *   aftermath: Array<{ side: 'player'|'enemy', kind: 'hit'|'heal', amount: number, label: string|null, key: string }> }}
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

  // Fonti dal log strutturato del motore (stessa fonte = stessa raffica)
  const sources = new Map();
  let damageApplied = 0;
  const stepped = new Set(steppedPvEvents(battleResult).map((x) => x.e));
  const pvEvents = (Array.isArray(battleResult.events) ? battleResult.events : []).filter(
    (e) => e && e.type === 'resourceChange' && e.stat === 'PV' && DUEL_REVEAL.has(e.revealAt) && !stepped.has(e)
  );
  for (const e of pvEvents) {
    const side = engineSide(e.target?.side);
    if (!side) continue;
    let delta = toInt(e.after) - toInt(e.before);
    // L'aftermath del Campo è misurato prima del DAN: il DAN dello scontro va tolto dalla sua parte
    if (e.source?.kind === 'field' && e.phase === 'post' && side === loser && damageApplied === 0) {
      damageApplied = Math.max(0, Math.min(toInt(battleResult.damageDealt), toInt(e.before)));
      delta += damageApplied;
    }
    if (!delta) continue;
    const label = sourceLabel(e.source, battleResult);
    const key = `${side}:${e.source?.kind || 'x'}:${label || e.source?.id || ''}`;
    const cur = sources.get(key) || { side, delta: 0, label, key };
    cur.delta += delta;
    sources.set(key, cur);
  }

  if (loser) {
    // Senza evento del Campo (nessun aftermath) il DAN non è passato da lì: vale il DAN dichiarato
    const amount = damageApplied || Math.max(0, Math.min(toInt(battleResult.damageDealt), start[loser]));
    if (amount > 0) out.damage = { side: loser, amount };
  }

  // Quel che il log non spiega (es. Eminenze a fine duello, aggiunte da resolveBattle) è una fonte a sé
  ['player', 'enemy'].forEach((side) => {
    let accounted = start[side] - (out.damage && out.damage.side === side ? out.damage.amount : 0);
    sources.forEach((s) => { if (s.side === side) accounted += s.delta; });
    const rest = final[side] - accounted;
    if (rest) {
      const key = `${side}:rest`;
      const label = battleResult.eminenceOutcomeNotices?.length ? 'Eminenza' : null;
      sources.set(key, { side, delta: rest, label, key });
    }
  });

  sources.forEach((s) => {
    if (!s.delta) return;
    out.aftermath.push({ side: s.side, kind: s.delta > 0 ? 'heal' : 'hit', amount: Math.abs(s.delta), label: s.label, key: s.key });
  });
  return out;
}

/**
 * Eventi PV punto per punto con l'istante (ms) relativo all'inizio dei proiettili.
 * Ogni evento porta la sua raffica (group) e il conteggio cumulativo per l'etichetta −1 → −2 → …
 * Le raffiche delle varie fonti partono insieme, sfalsate di HP_SOURCE_STAGGER_MS.
 * @returns {Array<{ t: number, side: string, from: number, to: number, kind: 'hit'|'heal',
 *   cause: 'damage'|'aftermath', n: number, total: number, label: string|null, group: string, slot: number, projectile?: number }>}
 */
export function scheduleDuelHpEvents(battleResult, startHP) {
  const { damage, aftermath } = buildDuelHpBursts(battleResult, startHP);
  const ticks = [];
  let tEnd = 0;
  if (damage) {
    for (let i = 0; i < damage.amount; i++) {
      const t = i * HP_PROJECTILE_GAP_MS + HP_PROJECTILE_FLIGHT_MS;
      ticks.push({ t, side: damage.side, step: -1, kind: 'hit', cause: 'damage', n: i + 1, total: damage.amount, label: null, group: `damage-${damage.side}`, slot: 0, projectile: i });
      tEnd = t;
    }
  }
  const t0 = tEnd + HP_AFTERMATH_DELAY_MS;
  const slotBySide = { player: 0, enemy: 0 };
  aftermath.forEach((b) => {
    const slot = slotBySide[b.side]++;
    for (let i = 0; i < b.amount; i++) {
      ticks.push({
        t: t0 + slot * HP_SOURCE_STAGGER_MS + i * HP_AFTERMATH_STEP_MS,
        side: b.side,
        step: b.kind === 'heal' ? 1 : -1,
        kind: b.kind,
        cause: 'aftermath',
        n: i + 1,
        total: b.amount,
        label: b.label,
        group: `aftermath-${b.key}`,
        // la raffica del DAN occupa il primo posto dello stesso lato
        slot: slot + (damage && damage.side === b.side ? 1 : 0),
      });
    }
  });
  ticks.sort((a, b) => a.t - b.t);
  const hp = { player: toInt(startHP?.player), enemy: toInt(startHP?.enemy) };
  return ticks.map(({ step, ...e }) => {
    const from = hp[e.side];
    hp[e.side] = from + step;
    return { ...e, from, to: from + step };
  });
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
