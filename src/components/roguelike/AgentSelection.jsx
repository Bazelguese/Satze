// ============================================
// AGENT SELECTION - Selezione agenti per roguelike
// ============================================

import React, { useState, useEffect } from 'react';
import { ALL_AGENTS, ARMY_COLORS } from '../../data';
import { CardReworkP4 } from '../cards';
import { Icon } from '../ui/Icon';

/**
 * Genera proposte di agenti per la selezione iniziale
 * @param {Array} availableArmies - Array di armate disponibili
 * @param {number} count - Numero di agenti da proporre
 * @param {number} league - Lega degli agenti da proporre
 * @returns {Array} Array di agenti proposti (uno per armata diversa)
 */
export function generateAgentProposals(availableArmies, count = 3, league = 2) {
  const proposals = [];
  const usedArmies = new Set();
  
  // Filtra agenti per lega e armate disponibili
  const eligibleAgents = ALL_AGENTS.filter(agent => 
    agent.league === league && 
    availableArmies.includes(agent.army) &&
    !usedArmies.has(agent.army)
  );
  
  // Seleziona un agente per ogni armata diversa
  for (let i = 0; i < count && proposals.length < count; i++) {
    const availableForArmy = eligibleAgents.filter(a => !usedArmies.has(a.army));
    
    if (availableForArmy.length === 0) break;
    
    // Seleziona un'armata casuale tra quelle non ancora usate
    const availableArmiesForSelection = availableArmies.filter(a => !usedArmies.has(a));
    if (availableArmiesForSelection.length === 0) break;
    
    const randomArmy = availableArmiesForSelection[Math.floor(Math.random() * availableArmiesForSelection.length)];
    const agentsFromArmy = eligibleAgents.filter(a => a.army === randomArmy);
    
    if (agentsFromArmy.length > 0) {
      const randomAgent = agentsFromArmy[Math.floor(Math.random() * agentsFromArmy.length)];
      proposals.push(randomAgent);
      usedArmies.add(randomArmy);
    }
  }
  
  return proposals;
}

export default function AgentSelection({ 
  availableArmies, 
  league = 2, 
  count = 3,
  onSelect,
  title = "Scegli un Agente",
  description = "Seleziona un agente da aggiungere al tuo esercito"
}) {
  const [proposals, setProposals] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  useEffect(() => {
    const agentProposals = generateAgentProposals(availableArmies, count, league);
    setProposals(agentProposals);
  }, [availableArmies, league, count]);
  
  const handleConfirm = () => {
    if (selectedAgent && onSelect) {
      onSelect(selectedAgent);
    }
  };
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            {title}
          </h2>
          <p className="text-slate-300 text-sm">{description}</p>
        </div>
        
        {/* Proposte Agenti */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {proposals.map((agent, idx) => {
            const colors = ARMY_COLORS[agent.army] || { accent: '#64748b' };
            const isSelected = selectedAgent?.id === agent.id;
            
            return (
              <button
                key={agent.id || idx}
                onClick={() => setSelectedAgent(agent)}
                className={`relative p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105' 
                    : 'border-slate-600 hover:border-slate-500 hover:scale-[1.02]'
                }`}
                style={{
                  borderColor: isSelected ? colors.accent : undefined,
                  boxShadow: isSelected ? `0 8px 32px ${colors.accent}40` : undefined,
                }}
              >
                {/* Checkmark selezionato */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold animate-bounce">
                    ✓
                  </div>
                )}
                
                {/* Simbolo armata */}
                <div className="flex items-center justify-center mb-3">
                  <Icon 
                    name={agent.army} 
                    type="army" 
                    size={64} 
                    color={colors.accent}
                  />
                </div>
                
                {/* Card preview */}
                <div className="flex justify-center mb-4">
                  <div className="scale-75 origin-center">
                    <CardReworkP4 agent={agent} />
                  </div>
                </div>
                
                {/* Info agente */}
                <div className="text-center">
                  <div className="font-bold text-white text-lg mb-1">{agent.name}</div>
                  <div className="text-sm text-slate-400 mb-2">{agent.army}</div>
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">POT: </span>
                      <span className="text-yellow-300 font-bold">{agent.power}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">DAN: </span>
                      <span className="text-red-300 font-bold">{agent.damage}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Lega: </span>
                      <span className="text-purple-300 font-bold">{agent.league}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Bottone Conferma */}
        <div className="flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedAgent}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Conferma Scelta
          </button>
        </div>
      </div>
    </div>
  );
}
