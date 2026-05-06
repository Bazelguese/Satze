// Regole mazzo campagna (design: 3 carte iniziali, Lega 5 solo da ricompense) — struttura.

export const CAMPAIGN_DECK_RULES = {
  initialHandSize: 3,
  initialLeagueCap: 4,
  league5FromRewardsOnly: true,
};

/**
 * @param {string[]} _cardIds
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCampaignDeckForRun(_cardIds) {
  return { ok: true, errors: [] };
}
