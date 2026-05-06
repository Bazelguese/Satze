/** Colori lega per tier — stessi valori di deck builder / crop tool. */
export const LEAGUE_TIER_COLORS = {
  2: '#71717a',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b',
};

export function leagueTierColorHex(league) {
  const n = Number(league);
  if (!Number.isFinite(n)) return LEAGUE_TIER_COLORS[2];
  const k = Math.min(5, Math.max(2, Math.round(n)));
  return LEAGUE_TIER_COLORS[k] || LEAGUE_TIER_COLORS[2];
}
