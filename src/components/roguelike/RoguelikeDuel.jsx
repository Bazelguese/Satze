// ============================================
// ROGUELIKE DUEL - Sistema di combattimento per roguelike
// ============================================

import React, { useState, useEffect } from 'react';
import { ZONE_CONFIG } from '../../data/roguelike';
import { ALL_AGENTS, ARMY_COLORS } from '../../data';

/**
 * Genera nemici per un duello roguelike
 */
function generateEnemyHand(zoneNumber, nodeType = 'duel') {
  const config = ZONE_CONFIG[zoneNumber];
  if (!config) return [];
  
  const enemyLeague = nodeType === 'finalBoss' 
    ? config.finalBoss?.league || 3
    : nodeType === 'eliteBoss'
    ? (zoneNumber === 2 ? 4 : 5)
    : zoneNumber === 1 
    ? 2 
    : zoneNumber === 2 || zoneNumber === 3
    ? 3
    : 4;
  
  const enemyCount = nodeType === 'finalBoss' || nodeType === 'eliteBoss'
    ? 1
    : zoneNumber === 1
    ? 3
    : Math.floor(Math.random() * 3) + 3; // 3-5 per zone 2-4
  
  // Seleziona agenti casuali della lega appropriata
  const eligibleAgents = ALL_AGENTS.filter(a => a.league === enemyLeague);
  const selected = [];
  
  for (let i = 0; i < enemyCount && eligibleAgents.length > 0; i++) {
    const randomIdx = Math.floor(Math.random() * eligibleAgents.length);
    selected.push(eligibleAgents.splice(randomIdx, 1)[0]);
  }
  
  return selected;
}

export default function RoguelikeDuel({ 
  playerDeck, 
  zoneNumber, 
  nodeType = 'duel',
  onVictory,
  onDefeat,
  playerHP,
  onHPChange
}) {
  const [enemyHand, setEnemyHand] = useState([]);
  const [currentPlayerHP, setCurrentPlayerHP] = useState(playerHP);
  const [combatStarted, setCombatStarted] = useState(false);
  
  const zoneConfig = ZONE_CONFIG[zoneNumber];
  
  useEffect(() => {
    // Genera nemici quando il componente viene montato
    const enemies = generateEnemyHand(zoneNumber, nodeType);
    setEnemyHand(enemies);
  }, [zoneNumber, nodeType]);
  
  const handleStartCombat = () => {
    setCombatStarted(true);
    const totalEnemyLeagues = enemyHand.reduce((sum, agent) => sum + agent.league, 0);
    // Simulazione combattimento (design: danno sconfitta = somma Leghe; Z4 vittoria = somma/2)
    setTimeout(() => {
      const won = Math.random() > 0.3;
      if (won) {
        onVictory(zoneNumber === 4 ? { enemyLeagueSum: totalEnemyLeagues } : {});
      } else {
        const damage = totalEnemyLeagues;
        const newHP = currentPlayerHP - damage;
        setCurrentPlayerHP(newHP);
        onHPChange(newHP);
        onDefeat(damage);
      }
    }, 1000);
  };
  
  if (!combatStarted) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
              {nodeType === 'finalBoss' && `💀 ${zoneConfig?.finalBoss?.name || 'Boss Finale'}`}
              {nodeType === 'eliteBoss' && '👑 Boss Elite'}
              {nodeType === 'duel' && '⚔️ Duello'}
            </h2>
            <p className="text-slate-300 text-sm mb-4">
              {nodeType === 'finalBoss' && `Lega ${zoneConfig?.finalBoss?.league || 3}`}
              {nodeType === 'eliteBoss' && `Zona ${zoneNumber} - Lega ${zoneNumber === 2 ? 4 : 5}`}
              {nodeType === 'duel' && `Zona ${zoneNumber}`}
            </p>
            
            {/* Statistiche */}
            <div className="flex items-center justify-center gap-6 text-sm mb-6">
              <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                <span className="text-slate-400">I tuoi PV: </span>
                <span className="text-red-400 font-bold text-lg">{currentPlayerHP}</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                <span className="text-slate-400">Esercito: </span>
                <span className="text-blue-400 font-bold text-lg">{playerDeck.length} carte</span>
              </div>
            </div>
          </div>
          
          {/* Preview Nemici */}
          <div className="bg-slate-800/80 rounded-xl border-2 border-slate-600 p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Nemici</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {enemyHand.map((enemy, idx) => {
                const colors = ARMY_COLORS[enemy.army] || { accent: '#64748b' };
                return (
                  <div
                    key={enemy.id || idx}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                    style={{ borderColor: colors.accent + '40' }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{enemy.icon || '⚔️'}</div>
                      <div className="font-bold text-white mb-1">{enemy.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{enemy.army}</div>
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <div>
                          <span className="text-slate-400">POT: </span>
                          <span className="text-yellow-300 font-bold">{enemy.power}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">DAN: </span>
                          <span className="text-red-300 font-bold">{enemy.damage}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Lega: </span>
                          <span className="text-purple-300 font-bold">{enemy.league}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Regole Combattimento */}
          <div className="bg-slate-800/80 rounded-xl border-2 border-slate-600 p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Regole Combattimento</h3>
            <div className="space-y-2 text-sm text-slate-300">
              {zoneNumber === 1 && (
                <>
                  <p>• <strong>Zone di scontro:</strong> 3</p>
                  <p>• <strong>Vittoria:</strong> 2 zone (turni 1-2), poi più PV (turno 3)</p>
                  <p>• <strong>FC iniziali:</strong> 12</p>
                  <p>• <strong>Danno sconfitta:</strong> Somma Leghe carte nemiche</p>
                </>
              )}
              {(zoneNumber === 2 || zoneNumber === 3) && (
                <>
                  <p>• <strong>Campi di battaglia:</strong> 5</p>
                  <p>• <strong>Vittoria:</strong> 3 campi (turni 1-4), poi più PV (turno 5+)</p>
                  <p>• <strong>FC iniziali:</strong> 18</p>
                  <p>• <strong>Danno sconfitta:</strong> Somma Leghe carte nemiche</p>
                </>
              )}
              {zoneNumber === 4 && (
                <>
                  <p>• <strong>Zone d'Assedio:</strong> 5 (iniziano conquistate)</p>
                  <p>• <strong>Vittoria:</strong> Mantieni zone e PV</p>
                  <p>• <strong>FC iniziali:</strong> 18</p>
                  <p>• <strong>Danno sconfitta:</strong> Somma Leghe carte nemiche</p>
                </>
              )}
            </div>
          </div>
          
          {/* Bottone Inizia */}
          <div className="flex justify-center">
            <button
              onClick={handleStartCombat}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-red-500/50"
            >
              Inizia il Combattimento
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Durante il combattimento (placeholder - da integrare con sistema esistente)
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-spin">⚔️</div>
        <h2 className="text-3xl font-bold text-white mb-2">Combattimento in corso...</h2>
        <p className="text-slate-300">Il sistema di combattimento verrà integrato presto</p>
      </div>
    </div>
  );
}
