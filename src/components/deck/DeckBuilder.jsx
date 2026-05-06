// ============================================
// DECK BUILDER - Crea e modifica mazzi personalizzati
// ============================================

import React, { useState, useMemo } from 'react';
import { CardReworkP4Scaled } from '../cards';
import { ARMY_SETS } from '../../data';
import { validateDeck, saveCustomDeck, generateDeckId, loadCustomDeck } from '../../utils/deckManager';

export function DeckBuilder({ army, onClose, onSave, existingDeckId = null }) {
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  
  const armyCards = useMemo(() => ARMY_SETS[army] || [], [army]);
  
  // Carica mazzo esistente se modificando
  React.useEffect(() => {
    if (existingDeckId) {
      const existing = loadCustomDeck(existingDeckId);
      if (existing && existing.army === army) {
        setDeckName(existing.name);
        setDeckDescription(existing.description || '');
        setSelectedCards(existing.cards || []);
      }
    }
  }, [existingDeckId, army]);
  
  const handleCardToggle = (cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else if (prev.length < 10) {
        return [...prev, cardId];
      }
      return prev;
    });
  };
  
  const handleSave = () => {
    if (!deckName.trim()) {
      alert("Inserisci un nome per l'esercito");
      return;
    }
    
    const validation = validateDeck(selectedCards, armyCards);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    const deckData = {
      name: deckName.trim(),
      description: deckDescription.trim(),
      army,
      cards: selectedCards,
    };
    
    const deckId = existingDeckId || generateDeckId();
    if (saveCustomDeck(deckId, deckData)) {
      if (onSave) onSave(deckId, deckData);
      if (onClose) onClose();
    } else {
      alert("Errore nel salvare l'esercito");
    }
  };
  
  const totalLeague = useMemo(() => {
    return selectedCards.reduce((sum, cardId) => {
      const card = armyCards.find(c => c.id === cardId);
      return sum + (card?.league || 0);
    }, 0);
  }, [selectedCards, armyCards]);
  
  const selectedCardsData = useMemo(() => {
    return selectedCards.map(id => armyCards.find(c => c.id === id)).filter(Boolean);
  }, [selectedCards, armyCards]);
  
  const availableCards = useMemo(() => {
    return armyCards.filter(c => !selectedCards.includes(c.id));
  }, [armyCards, selectedCards]);
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        className="max-w-6xl w-full max-h-[90vh] overflow-y-auto satze-hide-scrollbar border-2"
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
            <h2 className="text-2xl font-bold" style={{ color: '#FFB347' }}>
              {existingDeckId ? 'Modifica Esercito' : 'Crea Nuovo Esercito'}
            </h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Info esercito */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Nome Esercito *
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                placeholder="Es: Controllo Totale"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Descrizione (opzionale)
              </label>
              <textarea
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                rows="2"
                placeholder="Descrivi la strategia dell'esercito..."
              />
            </div>
            
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="px-4 py-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Carte selezionate: </span>
                <span className={`font-bold ${selectedCards.length === 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selectedCards.length}/10
                </span>
              </div>
              <div className="px-4 py-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Lega totale: </span>
                <span className={`font-bold ${totalLeague <= 30 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalLeague}/30
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Carte selezionate */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Esercito ({selectedCards.length}/10)
              </h3>
              {selectedCardsData.length === 0 ? (
                <div className="text-slate-500 text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                  Nessuna carta selezionata
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {selectedCardsData.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer"
                      onClick={() => handleCardToggle(card.id)}
                    >
                      <div className="flex-shrink-0">
                        <CardReworkP4Scaled agent={{ ...card, army }} width={176} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold">{card.name}</div>
                        <div className="text-slate-400 text-xs">Lega: {card.league}</div>
                      </div>
                      <button className="text-red-400 hover:text-red-300">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Carte disponibili */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Carte Disponibili ({armyCards.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {availableCards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCards.length < 10 
                        ? 'bg-slate-800 hover:bg-slate-700' 
                        : 'bg-slate-900 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => selectedCards.length < 10 && handleCardToggle(card.id)}
                  >
                    <div className="flex-shrink-0">
                      <CardReworkP4Scaled agent={{ ...card, army }} width={176} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold">{card.name}</div>
                      <div className="text-slate-400 text-xs">Lega: {card.league}</div>
                    </div>
                    {selectedCards.length < 10 && (
                      <button className="text-green-400 hover:text-green-300">+</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCards.length !== 10 || totalLeague > 30 || !deckName.trim()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors"
            >
              Salva Esercito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
