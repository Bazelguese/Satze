// ============================================
// RUN MANAGER - Gestisce la run roguelike
// ============================================

import React, { useState, useEffect } from 'react';
import { ZONE_CONFIG } from '../../data/roguelike';
import { ARMY_SETS } from '../../data';
import { selectRandomArtifact, applyArtifactEffects } from '../../data/artifacts';
import AgentSelection, { generateAgentProposals } from './AgentSelection';
import RoguelikeDuel from './RoguelikeDuel';
import EventNode from './EventNode';
import ArtifactDisplay from './ArtifactDisplay';
import CardRewardChoice from './CardRewardChoice';

/**
 * Genera la mappa dei nodi per una zona.
 * Design: Z1 → 7 duelli, 4 eventi, 0 elite, 1 boss (12); Z2/Z3 → 7 duelli, 7 eventi, 2 elite, 1 boss (17).
 */
function generateZoneMap(zoneNumber) {
  const config = ZONE_CONFIG[zoneNumber];
  if (!config) return [];
  
  const totalNodes = config.totalNodes;
  const duelCount = config.duels || 0;
  const eliteBossCount = config.eliteBosses || 0;
  let eventCount = config.events || 0;
  const used = duelCount + eliteBossCount + 1;
  if (used + eventCount > totalNodes) eventCount = Math.max(0, totalNodes - used);
  
  const nodes = [];
  let nodeId = 0;
  
  for (let i = 0; i < duelCount; i++) {
    nodes.push({ id: nodeId++, type: 'duel', completed: false });
  }
  for (let i = 0; i < eventCount; i++) {
    nodes.push({ id: nodeId++, type: 'event', completed: false });
  }
  for (let i = 0; i < eliteBossCount; i++) {
    nodes.push({ id: nodeId++, type: 'eliteBoss', completed: false });
  }
  
  const lastNode = {
    id: nodeId++,
    type: 'finalBoss',
    completed: false,
    boss: config.finalBoss,
  };
  
  const shuffled = [...nodes].sort(() => Math.random() - 0.5);
  return [...shuffled, lastNode];
}

export default function RunManager({ avatar, onRunComplete, onRunAbandon }) {
  const [currentZone, setCurrentZone] = useState(1);
  const [zoneMap, setZoneMap] = useState([]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [playerHP, setPlayerHP] = useState(30);
  const [playerDeck, setPlayerDeck] = useState([avatar]); // Inizia con solo l'Avatar
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArmies, setSelectedArmies] = useState([]); // Armate estratte per la run
  const [showInitialAgentSelection, setShowInitialAgentSelection] = useState(false);
  const [initialAgentSelectionRound, setInitialAgentSelectionRound] = useState(0); // 0 o 1 (due volte)
  const [chosenFirstArmy, setChosenFirstArmy] = useState(null); // Prima armata scelta (Zona 2)
  const [chosenSecondArmy, setChosenSecondArmy] = useState(null); // Seconda armata scelta (Zona 3)
  const [showDuel, setShowDuel] = useState(false); // Mostra schermata duello
  const [showEvent, setShowEvent] = useState(false); // Mostra schermata evento
  const [focusMax, setFocusMax] = useState(12); // FC Max per la run (inizializzato a 12, cambia per zona)
  const [showMap, setShowMap] = useState(true); // Mostra mappa (true) o nodo (false)
  const [showCardReward, setShowCardReward] = useState(false); // Ricompensa post-duello vinto
  
  // Inizializza la run quando il componente viene montato
  useEffect(() => {
    // Estrai 4 armate casuali dalle armate disponibili
    const allArmies = Object.keys(ARMY_SETS);
    const shuffled = [...allArmies].sort(() => Math.random() - 0.5);
    const extractedArmies = shuffled.slice(0, 4);
    setSelectedArmies(extractedArmies);
    
    // Evento iniziale Zona 1: proposta di 3 agenti (si ripete due volte)
    setShowInitialAgentSelection(true);
    setInitialAgentSelectionRound(0);
  }, []);
  
  // Gestione selezione agente iniziale
  const handleInitialAgentSelect = (agent) => {
    // Aggiungi l'agente al mazzo
    setPlayerDeck(prev => [...prev, agent]);
    
    // Se è la prima selezione (round 0), passa al round 1
    if (initialAgentSelectionRound === 0) {
      setInitialAgentSelectionRound(1);
      // La selezione rimane aperta per la seconda volta
    } else {
      // Seconda selezione completata, inizia la run
      setShowInitialAgentSelection(false);
      // Genera la mappa della prima zona
      const map = generateZoneMap(1);
      setZoneMap(map);
      setCurrentNodeIndex(0);
    }
  };
  
  const currentNode = zoneMap[currentNodeIndex];
  const zoneConfig = ZONE_CONFIG[currentZone];
  
  // Gestione completamento nodo
  const handleNodeComplete = () => {
    const newMap = [...zoneMap];
    newMap[currentNodeIndex].completed = true;
    setZoneMap(newMap);
    
    // Torna alla mappa
    setShowMap(true);
    setShowDuel(false);
    setShowEvent(false);
    
    // Passa al nodo successivo
    if (currentNodeIndex < zoneMap.length - 1) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    } else {
      // Zona completata, passa alla zona successiva
      if (currentZone < 4) {
        const nextZone = currentZone + 1;
        setCurrentZone(nextZone);
        const nextMap = generateZoneMap(nextZone);
        setZoneMap(nextMap);
        setCurrentNodeIndex(0);
        
        // Aggiorna HP e FC Max se necessario
        if (nextZone === 4) {
          setPlayerHP(50); // Zona 4 ha 50 PV
        }
        // Aggiorna FC Max in base alla zona
        const nextZoneConfig = ZONE_CONFIG[nextZone];
        if (nextZoneConfig?.combat?.initialFC) {
          setFocusMax(nextZoneConfig.combat.initialFC);
        } else if (nextZone === 2 || nextZone === 3) {
          setFocusMax(18); // Zone 2-3 hanno 18 FC
        }
      } else {
        // Run completata!
        onRunComplete({
          zonesCompleted: 4,
          finalHP: playerHP,
        });
      }
    }
  };
  
  // Gestione sconfitta
  const handleDefeat = (damage) => {
    const newHP = playerHP - damage;
    setPlayerHP(newHP);
    
    if (newHP <= 0) {
      // Run persa
      onRunAbandon({
        zone: currentZone,
        node: currentNodeIndex,
        reason: 'hp',
      });
    }
  };
  
  // Render della mappa
  const renderMap = () => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        {/* Header Zona */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            Zona {currentZone}: {zoneConfig?.name || 'Caricamento...'}
          </h2>
          <p className="text-slate-300 text-sm mb-4">{zoneConfig?.narrative || ''}</p>
          
          {/* Statistiche Run */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-slate-400">PV: </span>
              <span className="text-red-400 font-bold text-lg">{playerHP}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-slate-400">Esercito: </span>
              <span className="text-blue-400 font-bold text-lg">{playerDeck.length}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
              <span className="text-slate-400">Artefatti: </span>
              <span className="text-purple-400 font-bold text-lg">{artifacts.length}</span>
              {artifacts.length > 0 && (
                <div className="mt-2">
                  <ArtifactDisplay artifacts={artifacts} compact={true} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mappa Nodi */}
        <div className="flex items-center gap-4 flex-wrap justify-center max-w-6xl">
          {zoneMap.map((node, idx) => {
            const isCurrent = idx === currentNodeIndex;
            const isCompleted = node.completed;
            const isAccessible = idx <= currentNodeIndex;
            
            let nodeIcon = '⚪';
            let nodeStyles = {
              bg: 'bg-slate-700',
              border: 'border-slate-500',
              shadow: 'shadow-slate-500/50',
            };
            
            if (node.type === 'duel') {
              nodeIcon = '⚔️';
              nodeStyles = { bg: 'bg-red-700', border: 'border-red-500', shadow: 'shadow-red-500/50' };
            } else if (node.type === 'event') {
              nodeIcon = '📜';
              nodeStyles = { bg: 'bg-blue-700', border: 'border-blue-500', shadow: 'shadow-blue-500/50' };
            } else if (node.type === 'eliteBoss') {
              nodeIcon = '👑';
              nodeStyles = { bg: 'bg-purple-700', border: 'border-purple-500', shadow: 'shadow-purple-500/50' };
            } else if (node.type === 'finalBoss') {
              nodeIcon = '💀';
              nodeStyles = { bg: 'bg-orange-700', border: 'border-orange-500', shadow: 'shadow-orange-500/50' };
            } else {
              nodeIcon = '⚪';
              nodeStyles = { bg: 'bg-slate-700', border: 'border-slate-500', shadow: 'shadow-slate-500/50' };
            }
            
            return (
              <div
                key={node.id}
                className={`relative flex flex-col items-center gap-2 transition-all ${
                  isCurrent ? 'scale-110 z-10' : isAccessible ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {/* Linea connessione */}
                {idx > 0 && (
                  <div className={`absolute -left-6 top-6 w-12 h-0.5 ${
                    isAccessible ? 'bg-slate-600' : 'bg-slate-800'
                  }`}></div>
                )}
                
                {/* Nodo */}
                <button
                  onClick={() => {
                    if (isAccessible && !isCompleted) {
                      setCurrentNodeIndex(idx);
                      setShowMap(false); // Mostra il nodo invece della mappa
                    }
                  }}
                  disabled={!isAccessible || isCompleted}
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl transition-all ${
                    isCurrent
                      ? `${nodeStyles.bg} ${nodeStyles.border} shadow-lg ${nodeStyles.shadow} animate-pulse`
                      : isCompleted
                      ? `${nodeStyles.bg}/50 ${nodeStyles.border}/50 opacity-60`
                      : isAccessible
                      ? `${nodeStyles.bg}/30 ${nodeStyles.border}/30 hover:${nodeStyles.border}/60 hover:${nodeStyles.bg}/50 cursor-pointer`
                      : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? '✓' : nodeIcon}
                </button>
                
                {/* Label nodo */}
                <div className="text-xs text-slate-400 text-center max-w-20">
                  {node.type === 'duel' && 'Duello'}
                  {node.type === 'event' && 'Evento'}
                  {node.type === 'eliteBoss' && 'Boss Elite'}
                  {node.type === 'finalBoss' && 'Boss Finale'}
                  {node.type === 'normal' && 'Normale'}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pulsante Abbandona */}
        <button
          onClick={() => {
            if (confirm('Sei sicuro di voler abbandonare la run?')) {
              onRunAbandon({
                zone: currentZone,
                node: currentNodeIndex,
                reason: 'abandoned',
              });
            }
          }}
          className="mt-8 px-6 py-3 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg border border-red-500/30 transition-all"
        >
          Abbandona Run
        </button>
      </div>
    );
  };
  
  // Gestione vittoria duello → ricompensa carta (design: 1-2 proposte, accetta una o nessuna)
  const handleDuelVictory = (opts = {}) => {
    setShowDuel(false);
    const z4 = currentZone === 4;
    if (z4 && opts.enemyLeagueSum != null) {
      const dmg = Math.floor(opts.enemyLeagueSum / 2);
      setPlayerHP((h) => Math.max(0, h - dmg));
    }
    setShowCardReward(true);
  };
  
  // Gestione sconfitta duello: danno = somma Leghe nemiche (Z4 idem; design)
  const handleDuelDefeat = (damage) => {
    setShowDuel(false);
    setShowCardReward(false);
    if (playerHP - damage > 0) setShowMap(true);
    handleDefeat(damage);
  };
  
  const handleCardRewardAccept = ({ add, remove }) => {
    setPlayerDeck((prev) => {
      let next = [...prev];
      if (remove) {
        const idx = next.findIndex((c) => c.id === remove.id && c.army === remove.army);
        if (idx >= 0) next.splice(idx, 1);
      }
      next.push(add);
      return next;
    });
    setShowCardReward(false);
    handleNodeComplete();
  };
  
  const handleCardRewardSkip = () => {
    setShowCardReward(false);
    handleNodeComplete();
  };
  
  // Gestione completamento evento
  const handleEventComplete = () => {
    setShowEvent(false);
    handleNodeComplete();
  };
  
  // Gestione cambio focus max
  const handleFocusMaxChange = (delta) => {
    setFocusMax(prev => Math.max(1, prev + delta));
  };
  
  // Render del nodo corrente
  const renderCurrentNode = () => {
    if (!currentNode) return null;
    
    // Se è un evento, mostra il componente evento
    if (currentNode.type === 'event' && showEvent) {
      return (
        <EventNode
          zoneNumber={currentZone}
          onComplete={handleEventComplete}
          playerDeck={playerDeck}
          playerHP={playerHP}
          onHPChange={setPlayerHP}
          onDeckChange={setPlayerDeck}
          onArtifactGain={(artifact) => setArtifacts(prev => [...prev, artifact])}
          onFocusMaxChange={handleFocusMaxChange}
        />
      );
    }
    
    // Ricompensa carta post-duello vinto (design: 1-2 proposte, mazzo max 5/10)
    if (showCardReward) {
      const maxDeck = zoneConfig?.maxDeckSize ?? 10;
      const armies = selectedArmies.length ? selectedArmies : [];
      return (
        <CardRewardChoice
          availableArmies={armies}
          zoneNumber={currentZone}
          currentDeck={playerDeck}
          maxDeckSize={maxDeck}
          onAccept={handleCardRewardAccept}
          onSkip={handleCardRewardSkip}
        />
      );
    }
    
    // Se è un duello, mostra il componente duello
    if ((currentNode.type === 'duel' || currentNode.type === 'eliteBoss' || currentNode.type === 'finalBoss') && showDuel) {
      return (
        <RoguelikeDuel
          playerDeck={playerDeck}
          zoneNumber={currentZone}
          nodeType={currentNode.type}
          onVictory={handleDuelVictory}
          onDefeat={handleDuelDefeat}
          playerHP={playerHP}
          onHPChange={setPlayerHP}
        />
      );
    }
    
    // Placeholder per altri tipi di nodo
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="bg-slate-800/80 rounded-xl border-2 border-slate-600 p-8 max-w-2xl text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            {currentNode.type === 'duel' && '⚔️ Duello'}
            {currentNode.type === 'event' && '📜 Evento Narrativo'}
            {currentNode.type === 'eliteBoss' && '👑 Boss Elite'}
            {currentNode.type === 'finalBoss' && '💀 Boss Finale'}
            {currentNode.type === 'normal' && '⚪ Nodo Normale'}
          </h3>
          
          <p className="text-slate-300 mb-6">
            {currentNode.type === 'duel' && 'Preparati per uno scontro!'}
            {currentNode.type === 'event' && 'Un evento ti attende...'}
            {currentNode.type === 'eliteBoss' && 'Un potente nemico ti sfida!'}
            {currentNode.type === 'finalBoss' && `Affronta ${currentNode.boss?.name || 'il Boss Finale'}!`}
            {currentNode.type === 'normal' && 'Un momento di tregua...'}
          </p>
          
          <div className="flex gap-4 justify-center">
            {(currentNode.type === 'duel' || currentNode.type === 'eliteBoss' || currentNode.type === 'finalBoss') && (
              <button
                onClick={() => setShowDuel(true)}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-red-500/50"
              >
                Inizia Combattimento
              </button>
            )}
            {currentNode.type === 'event' && (
              <button
                onClick={() => setShowEvent(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-blue-500/50"
              >
                Esplora Evento
              </button>
            )}
            {currentNode.type === 'normal' && (
              <button
                onClick={handleNodeComplete}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-black text-lg transition-all shadow-lg shadow-orange-500/50"
              >
                Continua
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Mostra selezione agenti iniziale se necessario
  if (showInitialAgentSelection) {
    return (
      <AgentSelection
        availableArmies={selectedArmies}
        league={2}
        count={3}
        onSelect={handleInitialAgentSelect}
        title={`Selezione Agente ${initialAgentSelectionRound + 1}/2`}
        description="Scegli un agente da aggiungere al tuo esercito. Questa selezione si ripeterà una seconda volta."
      />
    );
  }
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      {showMap ? renderMap() : renderCurrentNode()}
    </div>
  );
}
