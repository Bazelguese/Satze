// ============================================
// DECK MANAGER LIST SCREEN
// Schermata elenco eserciti personalizzati — stesso carosello cinematic del duello
// ============================================

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { loadCustomDecks, isMixedDeck, resolveDeckCards, getDeckVisualMeta } from '../../utils/deckManager';
import { ARMY_SETS, ARMY_COLORS } from '../../data';
import DeckSelectCinematic from '../menu/cosmic/DeckSelectCinematic.jsx';

function buildCustomDeckGameOptions() {
  const customDecks = loadCustomDecks();
  return Object.entries(customDecks).map(([deckId, deck]) => {
    const isMixed = isMixedDeck(deck, ARMY_SETS);
    const deckCards = isMixed
      ? resolveDeckCards(deck, ARMY_SETS)
      : (ARMY_SETS[deck.army] || []).filter((c) => deck.cards?.includes(c.id));
    const totalLeague = deckCards.reduce((sum, c) => sum + (c.league || 0), 0);
    const { accent: accentColor, armies } = getDeckVisualMeta(deckCards, {
      fallbackArmy: deck.army,
      armyColors: ARMY_COLORS,
      fallbackAccent: ARMY_COLORS[deck.army]?.accent || '#94a3b8',
    });

    return {
      key: `custom_${deckId}`,
      name: deck.name,
      armyLabel: isMixed && armies.length >= 2
        ? armies.join(' · ')
        : (deck.army || (isMixed ? 'Misto' : '')),
      description: deck.description || 'Esercito personalizzato',
      meta: `${deck.cards?.length || 0} carte • Lega ${totalLeague}/30`,
      accent: accentColor,
    };
  });
}

export function DeckManagerListScreen({ onEditDeck, onCreateNew, onClose, renderInPortal = true }) {
  const gameDeckOptions = useMemo(() => buildCustomDeckGameOptions(), []);

  const content = (
    <DeckSelectCinematic
      variant="manager"
      gameDeckOptions={gameDeckOptions}
      onCreateNew={onCreateNew}
      onSelectDeck={(deckKey) => {
        const deckId = deckKey.startsWith('custom_') ? deckKey.replace('custom_', '') : deckKey;
        onEditDeck(deckId);
      }}
      onBack={onClose}
    />
  );

  return renderInPortal ? createPortal(content, document.body) : content;
}
