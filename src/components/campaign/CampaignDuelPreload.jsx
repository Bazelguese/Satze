import React, { useMemo } from 'react';
import { DuelLoadingOverlay } from '../DuelLoadingOverlay.jsx';
import { FIRST_ACT_NODES, FIRST_ACT_COLLECTIVES, FIGLI, campaignField, firstActCard } from '../../campaign/data/firstAct.js';
import { runCard, isFirstActRun } from '../../campaign/state/firstActState.js';
import { TERRAFORM_DESTINATIONS } from '../../game/duel/terraform.js';
import { ARMY_SETS, ALL_BATTLEFIELDS, ARMY_GIFS } from '../../data';
import { getNascenteStageImageUrl } from '../../data/images.js';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets.js';

/** Include future encounters and reserve transformations, not just the opening hand. */
export function campaignDuelAssets(run) {
  const firstAct = isFirstActRun(run);
  const fieldIds = new Set([...FIRST_ACT_NODES.flatMap(n=>n.fieldIds || []), ...TERRAFORM_DESTINATIONS]);
  const fields = firstAct ? [...fieldIds].map(campaignField).filter(Boolean) : ALL_BATTLEFIELDS;
  const cards = firstAct
    ? [...new Set([...FIRST_ACT_NODES.flatMap(n=>n.roster || []), ...(ARMY_SETS[FIGLI] || []).map(c=>c.id), ...FIRST_ACT_COLLECTIVES.map(c=>c.id), ...run.deck, ...run.copies.map(c=>c.cardId)])].map(id=>runCard(run,id)).filter(Boolean)
    : Object.values(ARMY_SETS).flat();
  const armies = [...new Set(cards.map(c=>c.army))];
  const urls = [0,1,2,3].map(getNascenteStageImageUrl);
  // Warm the full random pool in bounded loading batches, without mounting 100+ GPU surfaces.
  urls.push(...ALL_BATTLEFIELDS.map(f=>resolvePublicAssetUrl(f.bgImage)).filter(Boolean));
  urls.push(...armies.map(a=>resolvePublicAssetUrl(ARMY_GIFS[a])).filter(Boolean));
  const playerCards = firstAct ? run.deck.map(id=>runCard(run,id)) : cards.slice(0,5);
  const enemyCards = firstAct ? FIRST_ACT_NODES[0].roster.map(firstActCard) : cards.slice(5,10);
  return { battlefields:fields, playerCards, enemyCards, preloadCards:cards, preloadUrls:urls,
    playerArmy:playerCards[0]?.army, enemyArmy:enemyCards[0]?.army };
}

export function CampaignDuelPreload({ run, onComplete }) {
  const assets = useMemo(()=>campaignDuelAssets(run),[run]);
  return <DuelLoadingOverlay {...assets} onComplete={onComplete}/>;
}
