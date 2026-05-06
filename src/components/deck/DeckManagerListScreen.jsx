// ============================================
// DECK MANAGER LIST SCREEN
// Schermata elenco mazzi - unico punto di accesso per modificare i mazzi
// Usata da "Gestione Mazzi" nel menu principale
// ============================================

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { loadCustomDecks, isMixedDeck, resolveDeckCards } from '../../utils/deckManager';
import { ARMY_SETS, ARMY_DECKS, ARMY_COLORS } from '../../data';
import { Icon } from '../ui';
import { MenuScreenLayout, MenuCard, MenuBackButton } from '../menu';

export function DeckManagerListScreen({ onEditDeck, onCreateNew, onClose }) {
  const customDecks = loadCustomDecks();
  const deckEntries = Object.entries(customDecks);
  const [previewDeck, setPreviewDeck] = useState(null);
  const predefinedDeckEntries = Object.entries(ARMY_DECKS).flatMap(([army, armyDecks]) =>
    Object.entries(armyDecks).map(([slot, deck]) => ({
      id: `${army}::${slot}`,
      slot,
      army,
      ...deck,
    }))
  );

  return createPortal(
    <div
      className="satze-hide-scrollbar"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a0e1a 0%, #1a0f3a 50%, #0a0e1a 100%)',
      }}
    >
      <MenuScreenLayout centered={false} title="Gestione Eserciti" subtitle="Modifica un esercito esistente o creane uno nuovo">
        {deckEntries.length === 0 ? (
          <div className="text-center text-slate-400 py-12 px-4">
            <p className="text-lg mb-4">Nessun esercito personalizzato.</p>
            <p className="text-sm">Crea il tuo primo esercito con il pulsante qui sotto.</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl px-4 mb-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#FFB347' }}>
              I tuoi eserciti
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deckEntries.map(([deckId, deck]) => {
                const isMixed = isMixedDeck(deck, ARMY_SETS);
                const deckCards = isMixed ? resolveDeckCards(deck, ARMY_SETS) : (ARMY_SETS[deck.army] || []).filter(c => deck.cards?.includes(c.id));
                const totalLeague = deckCards.reduce((sum, c) => sum + (c.league || 0), 0);
                const accentColor = isMixed ? '#a78bfa' : (ARMY_COLORS[deck.army]?.accent || '#f59e0b');
                return (
                  <MenuCard
                    key={deckId}
                    accentColor={accentColor}
                    onClick={() => onEditDeck(deckId)}
                    className="relative"
                  >
                    <div className="font-bold text-white mb-1">{deck.name}</div>
                    {deck.description && <p className="text-slate-400 text-xs mb-2">{deck.description}</p>}
                    <div className="flex items-center gap-2 mb-2">
                      {isMixed ? (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#a78bfa30', color: '#a78bfa' }}>
                          Esercito misto
                        </span>
                      ) : (
                        deck.army && (
                          <span className="flex items-center gap-1">
                            <Icon name={deck.army} type="army" size={16} color={accentColor} />
                            <span className="text-xs" style={{ color: accentColor }}>{deck.army}</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-xs text-slate-500">Lega: {totalLeague}/30 • {deck.cards?.length || 0} carte</div>
                    <div className="mt-2 text-xs font-semibold" style={{ color: accentColor }}>Modifica →</div>
                  </MenuCard>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl px-4 mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#94a3b8' }}>
            Mazzi predefiniti (sola lettura)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedDeckEntries.map((deck) => {
              const deckCards = resolveDeckCards(deck, ARMY_SETS);
              const totalLeague = deckCards.reduce((sum, c) => sum + (c.league || 0), 0);
              const accentColor = ARMY_COLORS[deck.army]?.accent || '#94a3b8';
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setPreviewDeck({ ...deck, deckCards, totalLeague })}
                  style={{
                    position: 'relative',
                    textAlign: 'left',
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    background: `${accentColor}0c`,
                    border: '1.5px solid #334155',
                    borderRadius: 0,
                    boxShadow: '0 2px 8px #000',
                    fontFamily: "'Cinzel', 'Georgia', serif",
                    cursor: 'pointer',
                  }}
                >
                  <div className="font-bold text-white mb-1">
                    [{deck.slot}] {deck.name}
                  </div>
                  {deck.description && <p className="text-slate-400 text-xs mb-2">{deck.description}</p>}
                  <div className="flex items-center gap-1 mb-2">
                    <Icon name={deck.army} type="army" size={16} color={accentColor} />
                    <span className="text-xs" style={{ color: accentColor }}>{deck.army}</span>
                  </div>
                  <div className="text-xs text-slate-500">Lega: {totalLeague}/30 • {deck.cards?.length || 0} carte</div>
                  <div className="mt-2 text-xs font-semibold text-slate-300">Apri anteprima (sola lettura)</div>
                </button>
              );
            })}
          </div>
        </div>

        <MenuCard accentColor="#FFB347" onClick={onCreateNew} className="w-full max-w-4xl">
          <span className="text-lg font-bold" style={{ color: '#FFB347' }}>
            + Crea Nuovo Esercito
          </span>
        </MenuCard>

        <MenuBackButton onClick={onClose}>Chiudi</MenuBackButton>

        {previewDeck && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10010,
              background: 'rgba(0,0,0,0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setPreviewDeck(null)}
          >
            <div
              className="satze-hide-scrollbar"
              style={{
                width: 'min(920px, 95vw)',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #0a0e1a 0%, #1a0f3a 50%, #0a0e1a 100%)',
                border: `1.5px solid ${ARMY_COLORS[previewDeck.army]?.accent || '#94a3b8'}`,
                borderRadius: 0,
                boxShadow: '0 0 24px rgba(0,0,0,0.8)',
                padding: '1rem 1.25rem',
                fontFamily: "'Cinzel', 'Georgia', serif",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-bold text-white">
                    [{previewDeck.slot}] {previewDeck.name}
                  </div>
                  <div className="text-sm mt-1" style={{ color: ARMY_COLORS[previewDeck.army]?.accent || '#94a3b8' }}>
                    {previewDeck.army} • Lega {previewDeck.totalLeague}/30 • {previewDeck.deckCards.length} carte
                  </div>
                  {previewDeck.description && (
                    <p className="text-xs text-slate-400 mt-2">{previewDeck.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDeck(null)}
                  className="text-slate-300 hover:text-white text-xl leading-none"
                  aria-label="Chiudi anteprima"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {previewDeck.deckCards.map((card, idx) => (
                  <div
                    key={`${previewDeck.id}-${card.id}-${idx}`}
                    className="px-3 py-2 border border-slate-700 bg-slate-900/40"
                  >
                    <div className="text-sm font-bold text-white">{card.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      L{card.league} • POT {card.power} • DAN {card.damage} • {card.army}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-slate-400 font-semibold">
                Mazzo predefinito: visualizzazione sola lettura (non modificabile).
              </div>
            </div>
          </div>
        )}
      </MenuScreenLayout>
    </div>,
    document.body
  );
}
