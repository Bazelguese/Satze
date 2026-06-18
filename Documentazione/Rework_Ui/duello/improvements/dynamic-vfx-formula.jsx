/* Formula dinamica VFX scontro
 *
 * - clashSpeed: deriva dal GAP fra i due VA → più decisivo, più rapido
 *   gap 0  → 0.7×  (combattuto, "savor")
 *   gap 15+ → 1.5× (dominazione)
 * - intensity: deriva dal TOTALE FC investiti → più risorse, più epico
 *   FC 2  (1+1, minimo) → 0.3×
 *   FC 16+ (8+8, alto)  → 1.6×
 *
 * Curva lineare clamped per entrambi.
 */
const CLASH_VFX_RANGES = {
  gap: { min: 0, max: 15, speedMin: 0.7, speedMax: 1.5 },
  fc:  { min: 2, max: 16, intMin: 0.3, intMax: 1.6 },
};

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function computeDynamicVfx(battleResult) {
  const pVa = battleResult.playerAssault ?? 0;
  const eVa = battleResult.enemyAssault ?? 0;
  const pFc = battleResult.playerFocusUsed ?? 0;
  const eFc = battleResult.enemyFocusUsed ?? 0;

  const gap = Math.abs(pVa - eVa);
  const totalFc = pFc + eFc;

  const gapNorm = clamp01((gap - CLASH_VFX_RANGES.gap.min) / (CLASH_VFX_RANGES.gap.max - CLASH_VFX_RANGES.gap.min));
  const fcNorm  = clamp01((totalFc - CLASH_VFX_RANGES.fc.min) / (CLASH_VFX_RANGES.fc.max - CLASH_VFX_RANGES.fc.min));

  const clashSpeed = lerp(CLASH_VFX_RANGES.gap.speedMin, CLASH_VFX_RANGES.gap.speedMax, gapNorm);
  const intensity  = lerp(CLASH_VFX_RANGES.fc.intMin,  CLASH_VFX_RANGES.fc.intMax,  fcNorm);

  return { clashSpeed, intensity, gap, totalFc, gapNorm, fcNorm };
}

// Scenari preset per dimostrare le combinazioni estreme
const DYNAMIC_SCENARIOS = [
  {
    id: 'schermaglia',
    label: 'Schermaglia',
    sub: 'gap basso · FC bassi',
    description: 'Vittoria al pelo, pochi FC. Più lento e più sobrio.',
    pVa: 7, eVa: 5, pFc: 1, eFc: 1,
    winner: 'player', damage: 3,
  },
  {
    id: 'combattuto',
    label: 'Duello combattuto',
    sub: 'gap minimo · FC alti',
    description: 'Stretto e teso: scontro al limite con tanta posta in gioco.',
    pVa: 14, eVa: 13, pFc: 5, eFc: 6,
    winner: 'player', damage: 4,
  },
  {
    id: 'battEpica',
    label: 'Battaglia epica',
    sub: 'gap medio · FC alti',
    description: 'Punta culminante della partita: VFX al massimo.',
    pVa: 22, eVa: 14, pFc: 7, eFc: 5,
    winner: 'player', damage: 6,
  },
  {
    id: 'dominazione',
    label: 'Dominazione',
    sub: 'gap alto · FC bassi',
    description: 'Vittoria schiacciante e rapidissima. Pochi FC, ma decisivo.',
    pVa: 18, eVa: 4, pFc: 3, eFc: 1,
    winner: 'player', damage: 7,
  },
];

/** Genera un battleResult mock applicando i parametri di scenario sul template di CLASH_SCENARIO */
function applyScenarioToBattle(base, scenario) {
  return {
    ...base,
    player: { ...base.player, va: scenario.pVa },
    enemy:  { ...base.enemy,  va: scenario.eVa },
    playerFc: scenario.pFc,
    enemyFc:  scenario.eFc,
    winner: scenario.winner,
    damage: scenario.damage,
    // Forziamo l'override dinamico:
    _dynamic: computeDynamicVfx({
      playerAssault: scenario.pVa,
      enemyAssault: scenario.eVa,
      playerFocusUsed: scenario.pFc,
      enemyFocusUsed: scenario.eFc,
    }),
  };
}

Object.assign(window, { computeDynamicVfx, CLASH_VFX_RANGES, DYNAMIC_SCENARIOS, applyScenarioToBattle });
