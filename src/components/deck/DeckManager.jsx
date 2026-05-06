// ============================================
// DECK MANAGER - Gestione mazzi personalizzati
// ============================================

import React, { useState, useEffect } from 'react';
import { loadCustomDecks, deleteCustomDeck } from '../../utils/deckManager';
import { ARMY_SETS, ARMY_COLORS } from '../../data';
import { DeckBuilder } from './DeckBuilder';

export function DeckManager({ onSelectDeck, onClose }) {
  const [decks, setDecks] = useState({});
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [armyFilter, setArmyFilter] = useState(null);
  
  useEffect(() => {
    refreshDecks();
  }, []);
  
  const refreshDecks = () => {
    setDecks(loadCustomDecks());
  };
  
  const handleDelete = (deckId, deckName) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'esercito "${deckName}"?`)) {
      if (deleteCustomDeck(deckId)) {
        refreshDecks();
      }
    }
  };
  
  const handleEdit = (deckId) => {
    const deck = decks[deckId];
    if (deck) {
      setSelectedArmy(deck.army);
      setEditingDeckId(deckId);
      setShowBuilder(true);
    }
  };
  
  const handleNewDeck = (army) => {
    setSelectedArmy(army);
    setEditingDeckId(null);
    setShowBuilder(true);
  };
  
  const handleSave = (deckId, deckData) => {
    refreshDecks();
    setShowBuilder(false);
    setSelectedArmy(null);
    setEditingDeckId(null);
  };
  
  const filteredDecks = Object.entries(decks).filter(([_, deck]) => {
    return !armyFilter || deck.army === armyFilter;
  });
  
  const armies = Object.keys(ARMY_SETS);
  
  if (showBuilder && selectedArmy) {
    return (
      <DeckBuilder
        army={selectedArmy}
        existingDeckId={editingDeckId}
        onClose={() => {
          setShowBuilder(false);
          setSelectedArmy(null);
          setEditingDeckId(null);
        }}
        onSave={handleSave}
      />
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        className="max-w-5xl w-full max-h-[90vh] overflow-y-auto satze-hide-scrollbar border-2"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #0a0e1a 0%, #1a0f3a 50%, #0a0e1a 100%)',
          borderColor: '#D4A847',
          boxShadow: '0 0 30px rgba(212, 168, 71, 0.3)',
          fontFamily: "'Cinzel', 'Georgia', serif",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#FFB347' }}>Gestione Eserciti Personalizzati</h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Filtro armate */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setArmyFilter(null)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  armyFilter === null
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Tutte
              </button>
              {armies.map(army => (
                <button
                  key={army}
                  onClick={() => setArmyFilter(army)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    armyFilter === army
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  style={armyFilter !== army ? { 
                    borderColor: ARMY_COLORS[army] || '#64748b',
                    borderWidth: '2px'
                  } : {}}
                >
                  {army}
                </button>
              ))}
            </div>
          </div>
          
          {/* Lista eserciti */}
          {filteredDecks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {armyFilter 
                ? `Nessun esercito personalizzato per ${armyFilter}`
                : 'Nessun esercito personalizzato. Crea il tuo primo esercito!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-6">
              {filteredDecks.map(([deckId, deck]) => (
                <div
                  key={deckId}
                  className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{deck.name}</h3>
                      <div className="text-sm text-slate-400 mb-2">
                        <span style={{ color: ARMY_COLORS[deck.army] || '#64748b' }}>
                          {deck.army}
                        </span>
                        {' · '}
                        {deck.cards?.length || 0} carte
                      </div>
                      {deck.description && (
                        <p className="text-sm text-slate-300">{deck.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {onSelectDeck && (
                        <button
                          onClick={() => {
                            onSelectDeck(deckId, deck);
                            if (onClose) onClose();
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
                        >
                          Seleziona
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(deckId)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(deckId, deck.name)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Crea nuovo esercito */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Crea Nuovo Esercito</h3>
            <div className="flex gap-2 flex-wrap">
              {armies.map(army => (
                <button
                  key={army}
                  onClick={() => handleNewDeck(army)}
                  className="px-4 py-2 rounded-lg font-bold transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
                  style={{ borderColor: ARMY_COLORS[army] || '#64748b', borderWidth: '2px' }}
                >
                  Nuovo: {army}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
