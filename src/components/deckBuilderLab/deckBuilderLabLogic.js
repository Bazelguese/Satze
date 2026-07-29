import { shouldShowTagAsRole } from '../../data/cardTags';
import { DECK_SIZE, MAX_LEAGUE, isRole, EFFECT_NAMES } from './deckBuilderLabData';

export const ROLES = ['Assalto', 'Difesa', 'Élite', 'Supporto'];
export const ROLE_ORDER = { Assalto: 0, Difesa: 1, Élite: 2, Supporto: 3 };

const avg = (arr, k) => (arr.length ? arr.reduce((s, c) => s + c[k], 0) / arr.length : 0);

function normalizeCatalogSearch(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Ricerca catalogo: nome, tag, trigger, testo potere, etichetta effetto */
export function cardMatchesCatalogQuery(card, rawQuery) {
  const q = normalizeCatalogSearch(rawQuery.trim());
  if (!q) return true;

  const fields = [
    card.name,
    card.army,
    card.trigger,
    card.role,
    card.abilityText,
    card.powerDesc,
    card.effect,
    card.effect ? EFFECT_NAMES[card.effect] : '',
  ];

  if (fields.some((s) => normalizeCatalogSearch(s).includes(q))) return true;
  return (card.tags || []).some((tag) => normalizeCatalogSearch(tag).includes(q));
}

export function uniqTags(c) {
  return [...new Set(c.tags || [])];
}

/** Tag unici per carta, stesso criterio del deck builder ufficiale */
export function displayTagsForCard(card) {
  const tags = card?.tags || [];
  const unique = [...new Set(tags)];
  return unique.map((tag) => ({
    tag,
    showAsRole: shouldShowTagAsRole(tag, tags),
  }));
}

export { isRole, shouldShowTagAsRole };

export function analyzeDeck(deckCards) {
  const count = deckCards.length;
  const totalLeague = deckCards.reduce((s, c) => s + c.league, 0);
  const remLeague = MAX_LEAGUE - totalLeague;
  const aP = avg(deckCards, 'pot');
  const aD = avg(deckCards, 'dan');
  const roles = ROLES.map((r) => ({ r, n: deckCards.filter((c) => c.role === r).length }));
  const leagues = [2, 3, 4, 5].map((l) => ({ l, n: deckCards.filter((c) => c.league === l).length }));
  const off = Math.round((aP / 9) * 100);
  const def = Math.round((aD / 9) * 100);
  const msgs = [];

  if (count === 0) {
    msgs.push({ t: 'info', x: 'Seleziona le carte dal set per formare l\'esercito.' });
  } else {
    if (count < DECK_SIZE) {
      msgs.push({ t: 'warn', x: `Mancano ${DECK_SIZE - count} carte (${remLeague} Lega residua).` });
    }
    if (totalLeague > MAX_LEAGUE) {
      msgs.push({ t: 'warn', x: `Lega totale ${totalLeague}: supera il massimo di ${MAX_LEAGUE}.` });
    }
    if (count === DECK_SIZE && totalLeague < MAX_LEAGUE) {
      msgs.push({
        t: 'warn',
        x: `Lega ${totalLeague}/${MAX_LEAGUE}: devi usare tutti i ${MAX_LEAGUE} punti Lega (${remLeague} residui).`,
      });
    }
  }

  const legal = count === DECK_SIZE && totalLeague === MAX_LEAGUE;
  if (legal) {
    msgs.length = 0;
    msgs.push({ t: 'ok', x: `Esercito completo · ${totalLeague}/${MAX_LEAGUE} Lega.` });
  }

  return { count, totalLeague, remLeague, aP, aD, roles, leagues, off, def, msgs, legal };
}
