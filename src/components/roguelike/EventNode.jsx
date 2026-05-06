// ============================================
// EVENT NODE - Gestisce eventi narrativi
// ============================================

import React, { useState } from 'react';
import { selectRandomEvent, EVENT_CATEGORIES } from '../../data/roguelikeEvents';
import { selectRandomArtifact } from '../../data/artifacts';

export default function EventNode({ 
  zoneNumber, 
  onComplete, 
  playerDeck,
  playerHP,
  onHPChange,
  onDeckChange,
  onArtifactGain,
  onFocusMaxChange,
}) {
  const [event] = useState(() => selectRandomEvent(zoneNumber));
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [choiceResolved, setChoiceResolved] = useState(false);
  
  const categoryInfo = EVENT_CATEGORIES[event.category];
  const categoryColor = {
    curse: 'red',
    omen: 'orange',
    neutral: 'blue',
    generous: 'green',
    enlightening: 'purple',
  }[event.category] || 'slate';
  
  const handleChoice = (choice, choiceIndex) => {
    setSelectedChoice(choiceIndex);
    
    // Applica l'effetto della scelta
    if (choice.effect) {
      applyEffect(choice.effect);
    }
    
    setChoiceResolved(true);
  };
  
  const applyEffect = (effect) => {
    if (!effect) return;
    
    switch (effect.type) {
      case 'hp':
        if (onHPChange) {
          const newHP = playerHP + (effect.value || 0);
          onHPChange(newHP);
        }
        break;
        
      case 'permanentStats':
        // TODO: Implementare modifiche permanenti all'Avatar
        if (effect.target === 'avatar') {
          // Modifica stats Avatar
        }
        break;
        
      case 'loseAgent':
        // TODO: Implementare perdita agente
        if (effect.lowest) {
          // Perdi agente con lega più bassa
        } else if (effect.highest) {
          // Perdi agente con lega più alta
        } else {
          // Perdi agente casuale o a scelta
        }
        break;
        
      case 'agent':
        // TODO: Aggiungi agente al mazzo
        if (onDeckChange) {
          // onDeckChange(newAgent);
        }
        break;
        
      case 'focusMax':
        if (onFocusMaxChange) {
          onFocusMaxChange(effect.value || 0);
        }
        break;
        
      case 'loseFocusMax':
        if (onFocusMaxChange) {
          onFocusMaxChange(-(effect.value || 0));
        }
        break;
        
      case 'artifact':
        if (onArtifactGain) {
          const artifact = effect.artifactId 
            ? { id: effect.artifactId, category: effect.category || 'neutral' }
            : selectRandomArtifact(effect.category || 'neutral');
          onArtifactGain(artifact);
        }
        break;
        
      case 'duel':
        // TODO: Avvia duello
        // Per ora completiamo l'evento
        break;
        
      case 'gamble':
        const won = Math.random() < (effect.probability || 0.5);
        if (won && onFocusMaxChange) {
          onFocusMaxChange(effect.win || 0);
        } else if (!won && onFocusMaxChange) {
          onFocusMaxChange(-(effect.lose || 0));
        }
        break;
        
      default:
        break;
    }
    
    // Gestisci effetti secondari (gain/lose)
    if (effect.gain) {
      applyEffect(effect.gain);
    }
    if (effect.lose) {
      // Applica perdite
      if (effect.lose.type === 'agent') {
        // Perdi agente
      }
    }
  };
  
  const handleContinue = () => {
    onComplete();
  };
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-4xl w-full">
        {/* Header Evento */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-2 rounded-full mb-4 bg-${categoryColor}-600/30 border-2 border-${categoryColor}-500/50`}>
            <span className={`text-${categoryColor}-300 font-bold text-sm uppercase tracking-wide`}>
              {categoryInfo.name}
            </span>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            {event.name}
          </h2>
        </div>
        
        {/* Testo Evento */}
        <div className="bg-slate-800/80 rounded-xl border-2 border-slate-600 p-8 mb-6">
          <p className="text-slate-200 text-lg leading-relaxed italic text-center">
            "{event.text}"
          </p>
        </div>
        
        {/* Scelte o Effetto Automatico */}
        {!choiceResolved && event.choices && event.choices.length > 0 ? (
          <div className="space-y-4 mb-6">
            {event.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(choice, idx)}
                className="w-full p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border-2 border-slate-600 hover:border-slate-500 transition-all text-left hover:scale-[1.02]"
              >
                <div className="font-bold text-white text-lg mb-2">{choice.text}</div>
                {choice.effect && (
                  <div className="text-sm text-slate-400">
                    {choice.effect.description || 'Effetto applicato'}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : !choiceResolved && event.effect ? (
          // Effetto automatico
          <div className="bg-slate-800/80 rounded-xl border-2 border-slate-600 p-6 mb-6">
            <div className="text-slate-300 text-center">
              <p className="font-bold mb-2">Effetto:</p>
              <p>{event.effect.description}</p>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  applyEffect(event.effect);
                  setChoiceResolved(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-bold transition-all"
              >
                Accetta
              </button>
            </div>
          </div>
        ) : null}
        
        {/* Bottone Continua (dopo scelta/effetto) */}
        {choiceResolved && (
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-orange-500/50"
            >
              Continua
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
