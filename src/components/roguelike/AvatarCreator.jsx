// ============================================
// AVATAR CREATOR - Componente per creazione Avatar
// ============================================

import React, { useState, useEffect } from 'react';
import { AVATAR_BODY_POOLS, AVATAR_POWER_PROPOSALS, AVATAR_TRIGGER_POOLS } from '../../data/roguelike';
import { TRIGGER_NAMES } from '../../data/triggers';

/**
 * Genera proposte poteri per Avatar in base al corpo scelto
 */
function generatePowerProposals(bodyType) {
  const proposals = AVATAR_POWER_PROPOSALS[bodyType];
  
  // Poteri deboli
  const weakPowers = [
    { effect: 'power', value: 1, description: '+1 POT' },
    { effect: 'damage', value: 1, description: '+1 DAN' },
    { effect: 'heal', value: 1, description: 'Cura 1 PV' },
    { effect: 'focusCoin', value: 1, description: '+1 FC' },
  ];
  
  // Poteri medi
  const mediumPowers = [
    { effect: 'power', value: 2, description: '+2 POT' },
    { effect: 'damage', value: 2, description: '+2 DAN' },
    { effect: 'assaultValue', value: 2, description: '+2 VA' },
    { effect: 'enemyPower', value: -2, minPower: 1, description: '-2 POT nem. (min 1)' },
    { effect: 'directDamage', value: 2, description: '2 Danni dir.' },
  ];
  
  // Poteri forti
  const strongPowers = [
    { effect: 'power', value: 3, description: '+3 POT' },
    { effect: 'assaultValue', value: 4, description: '+4 VA' },
    { effect: 'enemyAssault', value: -4, minAssault: 5, description: '-4 VA nem. (min 5)' },
    { effect: 'powerAndDamage', value: 2, description: '+2 POT, +2 DAN' },
  ];
  
  const selectedPowers = [];
  
  // Seleziona poteri in base alle proporzioni
  for (let i = 0; i < proposals.weak; i++) {
    const randomWeak = weakPowers[Math.floor(Math.random() * weakPowers.length)];
    selectedPowers.push({ ...randomWeak, category: 'weak' });
  }
  
  for (let i = 0; i < proposals.medium; i++) {
    const randomMedium = mediumPowers[Math.floor(Math.random() * mediumPowers.length)];
    selectedPowers.push({ ...randomMedium, category: 'medium' });
  }
  
  for (let i = 0; i < proposals.strong; i++) {
    const randomStrong = strongPowers[Math.floor(Math.random() * strongPowers.length)];
    selectedPowers.push({ ...randomStrong, category: 'strong' });
  }
  
  // Mescola le proposte
  return selectedPowers.sort(() => Math.random() - 0.5);
}

/**
 * Genera proposte trigger per Avatar in base a corpo + potere
 */
function generateTriggerProposals(bodyType, powerCategory) {
  const pools = AVATAR_TRIGGER_POOLS;
  
  // Determina il pool da usare in base alla combinazione
  let highCount, mediumCount, lowCount;
  
  if (bodyType === 'mediocre' && powerCategory === 'strong') {
    // Corpo debole + Potere forte
    highCount = 1;
    mediumCount = 1;
    lowCount = 1;
  } else if (bodyType === 'strong' && powerCategory === 'weak') {
    // Corpo forte + Potere debole
    highCount = 2;
    mediumCount = 1;
    lowCount = 0;
  } else {
    // Combinazione media
    highCount = 1;
    mediumCount = 2;
    lowCount = 0;
  }
  
  const selectedTriggers = [];
  
  // Seleziona dai pool
  const highPool = [...pools.highReliability];
  const mediumPool = [...pools.mediumReliability];
  const lowPool = [...pools.lowReliability];
  
  for (let i = 0; i < highCount; i++) {
    if (highPool.length > 0) {
      const idx = Math.floor(Math.random() * highPool.length);
      selectedTriggers.push({
        trigger: highPool.splice(idx, 1)[0],
        reliability: 'high',
      });
    }
  }
  
  for (let i = 0; i < mediumCount; i++) {
    if (mediumPool.length > 0) {
      const idx = Math.floor(Math.random() * mediumPool.length);
      selectedTriggers.push({
        trigger: mediumPool.splice(idx, 1)[0],
        reliability: 'medium',
      });
    }
  }
  
  for (let i = 0; i < lowCount; i++) {
    if (lowPool.length > 0) {
      const idx = Math.floor(Math.random() * lowPool.length);
      selectedTriggers.push({
        trigger: lowPool.splice(idx, 1)[0],
        reliability: 'low',
      });
    }
  }
  
  return selectedTriggers;
}

export default function AvatarCreator({ onComplete }) {
  const [bodyType, setBodyType] = useState(null);
  const [selectedBody, setSelectedBody] = useState(null);
  const [powerProposals, setPowerProposals] = useState([]);
  const [selectedPower, setSelectedPower] = useState(null);
  const [triggerProposals, setTriggerProposals] = useState([]);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [bodyOptions, setBodyOptions] = useState([]);
  
  // Genera le proposte iniziali quando il componente viene montato
  useEffect(() => {
    const mediocrePool = AVATAR_BODY_POOLS.mediocre;
    const mediumPool = AVATAR_BODY_POOLS.medium;
    const strongPool = AVATAR_BODY_POOLS.strong;
    
    const options = [
      { ...mediocrePool[Math.floor(Math.random() * mediocrePool.length)], poolType: 'mediocre', label: 'Mediocre' },
      { ...mediumPool[Math.floor(Math.random() * mediumPool.length)], poolType: 'medium', label: 'Medio' },
      { ...strongPool[Math.floor(Math.random() * strongPool.length)], poolType: 'strong', label: 'Forte' },
    ];
    
    setBodyOptions(options);
  }, []);
  
  // Step 1: Scelta POT/DAN (Corpo)
  const handleBodySelect = (bodyOption) => {
    const type = bodyOption.poolType || (() => {
      const totalStats = bodyOption.power + bodyOption.damage;
      if (totalStats <= 3) return 'mediocre';
      if (totalStats === 4) return 'medium';
      return 'strong';
    })();
    
    setBodyType(type);
    setSelectedBody(bodyOption);
    
    // Genera proposte poteri
    const powers = generatePowerProposals(type);
    setPowerProposals(powers);
  };
  
  // Step 2: Scelta Potere
  const handlePowerSelect = (power) => {
    setSelectedPower(power);
    
    // Genera proposte trigger solo se abbiamo il bodyType
    if (bodyType) {
      const triggers = generateTriggerProposals(bodyType, power.category);
      setTriggerProposals(triggers);
    }
  };
  
  // Step 3: Scelta Trigger
  const handleTriggerSelect = (trigger) => {
    setSelectedTrigger(trigger);
  };
  
  // Step 4: Completamento
  const handleComplete = () => {
    if (!selectedBody || !selectedPower || !selectedTrigger) return;
    
    const avatar = {
      league: 2,
      power: selectedBody.power,
      damage: selectedBody.damage,
      ability: {
        trigger: selectedTrigger.trigger,
        effect: selectedPower.effect,
        value: selectedPower.value,
        minPower: selectedPower.minPower,
        minDamage: selectedPower.minDamage,
        minAssault: selectedPower.minAssault,
      },
      bonus: 'gregario',
      bodyType,
    };
    
    onComplete(avatar);
  };
  
  // Colori e stili
  const poolColors = {
    mediocre: 'from-slate-700 to-slate-600 border-slate-500',
    medium: 'from-blue-600 to-blue-500 border-blue-400',
    strong: 'from-purple-600 to-purple-500 border-purple-400',
  };
  
  const categoryColors = {
    weak: 'from-slate-600 to-slate-500 border-slate-400',
    medium: 'from-blue-600 to-blue-500 border-blue-400',
    strong: 'from-purple-600 to-purple-500 border-purple-400',
  };
  
  const reliabilityColors = {
    high: 'from-green-600 to-emerald-500 border-green-400',
    medium: 'from-yellow-600 to-orange-500 border-yellow-400',
    low: 'from-red-600 to-rose-500 border-red-400',
  };
  
  const canComplete = selectedBody && selectedPower && selectedTrigger;
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Effetti di sfondo animati */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-7xl w-full h-full flex flex-col relative z-10">
        {/* Header compatto con più stile */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="inline-block mb-2 relative">
            <span className="text-5xl animate-bounce">⚔️</span>
            <span className="absolute -top-1 -right-1 text-2xl animate-spin">✨</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-1 tracking-tight drop-shadow-lg">
            CREA IL TUO AVATAR
          </h1>
          <p className="text-slate-300 text-sm flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Completa tutte le sezioni per creare il tuo Avatar
          </p>
        </div>
        
        {/* Grid con tutti gli step - usa flex-1 per occupare lo spazio rimanente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* STEP 1: CORPO */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border-2 border-slate-600/50 p-4 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className={`w-2 h-6 rounded-full transition-all ${selectedBody ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-slate-600'}`}></div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">💪</span> 1. Corpo
              </h2>
              {selectedBody && <span className="text-green-400 text-xl ml-auto animate-bounce">✓</span>}
            </div>
            
            {bodyOptions.length > 0 && (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                {bodyOptions.map((option, idx) => {
                  const totalStats = option.power + option.damage;
                  const isSelected = selectedBody && selectedBody.power === option.power && selectedBody.damage === option.damage;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleBodySelect(option)}
                      className={`group relative w-full max-w-xs mx-auto p-3 bg-gradient-to-br ${poolColors[option.poolType]} rounded-lg border-2 transition-all duration-200 text-left overflow-hidden ${
                        isSelected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50 border-yellow-400' : 'hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            option.poolType === 'mediocre' ? 'bg-slate-500 text-white' :
                            option.poolType === 'medium' ? 'bg-blue-400 text-white' :
                            'bg-purple-400 text-white'
                          }`}>
                            {option.label}
                          </span>
                          {isSelected && <span className="text-lg animate-pulse">✓</span>}
                        </div>
                        <div className="text-base font-black text-white">
                          <span className="text-yellow-300">⚡{option.power}</span> | <span className="text-red-300">🗡️{option.damage}</span>
                        </div>
                        <div className="text-xs text-slate-200 mt-0.5">Totale: {totalStats}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* STEP 2: POTERE */}
          <div className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border-2 p-4 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm ${
            !selectedBody ? 'border-slate-700 opacity-50' : 'border-slate-600/50'
          }`}>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className={`w-2 h-6 rounded-full transition-all ${selectedPower ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : selectedBody ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">✨</span> 2. Potere
              </h2>
              {selectedPower && <span className="text-green-400 text-xl ml-auto animate-bounce">✓</span>}
            </div>
            
            {!selectedBody ? (
              <p className="text-slate-400 text-xs text-center my-auto flex items-center justify-center gap-2">
                <span>🔒</span> Seleziona prima il corpo
              </p>
            ) : powerProposals.length > 0 ? (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                {powerProposals.map((power, idx) => {
                  const isSelected = selectedPower && selectedPower.description === power.description;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePowerSelect(power)}
                      disabled={!selectedBody}
                      className={`group relative w-full max-w-xs mx-auto p-3 bg-gradient-to-br ${categoryColors[power.category]} rounded-lg border-2 transition-all duration-200 text-left overflow-hidden ${
                        isSelected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50 border-yellow-400' : 'hover:border-slate-400 hover:shadow-md'
                      } ${!selectedBody ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{power.category === 'weak' ? '⭐' : power.category === 'medium' ? '✨' : '💫'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              power.category === 'weak' ? 'bg-slate-500 text-white' :
                              power.category === 'medium' ? 'bg-blue-400 text-white' :
                              'bg-purple-400 text-white'
                            }`}>
                              {power.category === 'weak' ? 'Debole' : power.category === 'medium' ? 'Medio' : 'Forte'}
                            </span>
                          </div>
                          {isSelected && <span className="text-lg animate-pulse">✓</span>}
                        </div>
                        <div className="text-sm font-black text-white mb-1">
                          {power.description}
                        </div>
                        <div className="text-xs text-slate-200 leading-tight">
                          {power.effect === 'power' && 'Aumenta la tua Potenza'}
                          {power.effect === 'damage' && 'Aumenta il tuo Danno'}
                          {power.effect === 'heal' && 'Rigenera i tuoi Punti Vita'}
                          {power.effect === 'focusCoin' && 'Guadagna Focus Coin extra'}
                          {power.effect === 'assaultValue' && 'Aumenta direttamente il Valore Assalto'}
                          {power.effect === 'enemyPower' && 'Riduce la Potenza nemica'}
                          {power.effect === 'enemyAssault' && 'Riduce il Valore Assalto nemico'}
                          {power.effect === 'directDamage' && 'Infligge danno diretto ai PV nemici'}
                          {power.effect === 'powerAndDamage' && 'Aumenta sia Potenza che Danno'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center my-auto">Generazione proposte...</p>
            )}
          </div>
          
          {/* STEP 3: TRIGGER */}
          <div className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border-2 p-4 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm ${
            !selectedPower ? 'border-slate-700 opacity-50' : 'border-slate-600/50'
          }`}>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className={`w-2 h-6 rounded-full transition-all ${selectedTrigger ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : selectedPower ? 'bg-yellow-500' : 'bg-slate-600'}`}></div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">⚡</span> 3. Trigger
              </h2>
              {selectedTrigger && <span className="text-green-400 text-xl ml-auto animate-bounce">✓</span>}
            </div>
            
            {!selectedPower ? (
              <p className="text-slate-400 text-xs text-center my-auto flex items-center justify-center gap-2">
                <span>🔒</span> Seleziona prima il potere
              </p>
            ) : triggerProposals.length > 0 ? (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                {triggerProposals.map((trigger, idx) => {
                  const isSelected = selectedTrigger && selectedTrigger.trigger === trigger.trigger;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTriggerSelect(trigger)}
                      disabled={!selectedPower}
                      className={`group relative w-full max-w-xs mx-auto p-3 bg-gradient-to-br ${reliabilityColors[trigger.reliability]} rounded-lg border-2 transition-all duration-200 text-left overflow-hidden ${
                        isSelected ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50 border-yellow-400' : 'hover:border-slate-400 hover:shadow-md'
                      } ${!selectedPower ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            trigger.reliability === 'high' ? 'bg-green-400 text-white' :
                            trigger.reliability === 'medium' ? 'bg-yellow-400 text-white' :
                            'bg-red-400 text-white'
                          }`}>
                            {trigger.reliability === 'high' ? 'Alta' : trigger.reliability === 'medium' ? 'Media' : 'Bassa'} Affidabilità
                          </span>
                          {isSelected && <span className="text-lg animate-pulse">✓</span>}
                        </div>
                        <div className="text-sm font-black text-white mb-1">
                          {TRIGGER_NAMES[trigger.trigger] || trigger.trigger}
                        </div>
                        <div className="text-xs text-slate-200 leading-tight">
                          {trigger.trigger === 'conquest' && 'Si attiva quando vinci uno scontro'}
                          {trigger.trigger === 'intervention' && 'Si attiva quando sei il secondo a scegliere'}
                          {trigger.trigger === 'glory' && 'Si attiva quando hai vinto lo scontro precedente'}
                          {trigger.trigger === 'vendetta' && 'Si attiva quando hai perso lo scontro precedente'}
                          {trigger.trigger === 'imboscata' && 'Si attiva quando sei il primo a scegliere'}
                          {trigger.trigger === 'rimonta' && "Si attiva quando hai meno PV dell'avversario"}
                          {trigger.trigger === 'turbo' && 'Si attiva nei Round 1 o 2'}
                          {trigger.trigger === 'reckoning' && 'Si attiva dal 3° scontro (dopo 2 duelli completati per entrambi)'}
                          {trigger.trigger === 'overdrive' && 'Si attiva quando spendi 5+ Focus Coin'}
                          {trigger.trigger === 'magnanimous' && 'Si attiva quando hai più PV dell\'avversario'}
                          {trigger.trigger === 'sfida' && 'Si attiva quando la tua Lega è inferiore a quella nemica'}
                          {trigger.trigger === 'opportunista' && 'Si attiva quando il nemico ha speso 5+ Focus Coin'}
                          {trigger.trigger === 'invasione' && 'Si attiva quando hai conquistato 1+ campi'}
                          {trigger.trigger === 'resistenza' && 'Si attiva quando il nemico ha conquistato 1+ campi'}
                          {trigger.trigger === 'ultimaChance' && 'Si attiva quando è il Round 5 o successivo'}
                          {!['conquest', 'intervention', 'glory', 'vendetta', 'imboscata', 'rimonta', 'turbo', 'reckoning', 'overdrive', 'magnanimous', 'sfida', 'opportunista', 'invasione', 'resistenza', 'ultimaChance'].includes(trigger.trigger) && 'Condizione di attivazione speciale'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center my-auto">Generazione proposte...</p>
            )}
          </div>
          
          {/* STEP 4: RIEPILOGO E COMPLETAMENTO */}
          <div className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border-2 p-4 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm ${
            !canComplete ? 'border-slate-700 opacity-50' : 'border-yellow-500/50'
          }`}>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className={`w-2 h-6 rounded-full transition-all ${canComplete ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-slate-600'}`}></div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">📋</span> 4. Riepilogo
              </h2>
              {canComplete && <span className="text-green-400 text-xl ml-auto animate-bounce">✓</span>}
            </div>
            
            {!canComplete ? (
              <p className="text-slate-400 text-xs text-center my-auto flex items-center justify-center gap-2">
                <span>🔒</span> Completa tutte le sezioni precedenti
              </p>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {/* Statistiche compatte */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-lg p-3 border border-slate-700/50 shadow-md">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <span>📊</span> Statistiche
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <div className="text-xs text-slate-400 mb-1">POT</div>
                      <div className="text-2xl font-black text-yellow-300 drop-shadow-lg">⚡{selectedBody.power}</div>
                    </div>
                    <div className="text-slate-600 text-xl">×</div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-slate-400 mb-1">DAN</div>
                      <div className="text-2xl font-black text-red-300 drop-shadow-lg">🗡️{selectedBody.damage}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-slate-400 mb-1">Lega</div>
                      <div className="text-2xl font-black text-purple-300 drop-shadow-lg">👑2</div>
                    </div>
                  </div>
                </div>
                
                {/* Potere compatto */}
                <div className="bg-gradient-to-r from-blue-600/60 to-blue-500/60 rounded-lg p-3 border border-blue-400/40 shadow-md">
                  <div className="text-xs text-blue-200 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <span>✨</span> Potere
                  </div>
                  <div className="text-sm font-bold text-white">{selectedPower.description}</div>
                </div>
                
                {/* Trigger compatto */}
                <div className="bg-gradient-to-r from-green-600/60 to-green-500/60 rounded-lg p-3 border border-green-400/40 shadow-md">
                  <div className="text-xs text-green-200 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <span>⚡</span> Trigger
                  </div>
                  <div className="text-sm font-bold text-white">
                    {TRIGGER_NAMES[selectedTrigger.trigger] || selectedTrigger.trigger}
                  </div>
                </div>
                
                {/* Bonus compatto */}
                <div className="bg-gradient-to-r from-yellow-600/70 to-orange-600/70 rounded-lg p-3 border border-yellow-400/50 shadow-md">
                  <div className="text-xs text-yellow-200 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <span>🎁</span> Bonus
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    <div className="text-xs font-bold text-yellow-200">Gregario</div>
                  </div>
                </div>
                
                {/* Bottone Completa */}
                <button
                  onClick={handleComplete}
                  disabled={!canComplete}
                  className="w-full max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-black text-base transition-all shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  🚀 Inizia la Run! →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
