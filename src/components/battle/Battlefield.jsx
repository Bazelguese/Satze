import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generateFieldParticles, FIELD_STYLES } from '../../utils';
import { Icon } from '../ui/Icon';
import { DUEL_PHASE_META } from '../../config/duelVisualTimeline.js';

/**
 * Componente sfondo campo di battaglia
 * Visualizza gradienti, glow e particelle tematiche per il campo attivo
 */
export const BattlefieldBackground = ({ activeField }) => {
  if (!activeField) return null;
  
  const fieldStyle = FIELD_STYLES[activeField.id] || {};
  const glowColor = fieldStyle.glow || 'rgba(100,100,100,0.3)';
  const particleConfig = generateFieldParticles(activeField.id, fieldStyle);
  
  // Genera particelle in base al tipo di campo
  const generateParticleData = (config) => {
    if (config.type === 'none') return [];
    
    return Array.from({ length: config.count }).map((_, i) => {
      const startX = 10 + Math.random() * 80;
      const startY = config.type === 'rise' ? 80 + Math.random() * 15 : 
                    config.type === 'fall' ? 5 + Math.random() * 15 :
                    config.type === 'vortex' ? 45 + (Math.random() - 0.5) * 20 :
                    10 + Math.random() * 80;
      
      let moveX, moveY, extraVars = {};
      
      switch(config.type) {
        case 'float':
          moveX = (Math.random() - 0.5) * 60;
          moveY = (Math.random() - 0.5) * 60;
          break;
        case 'rise':
          moveX = (Math.random() - 0.5) * 40;
          moveY = -80 - Math.random() * 20;
          break;
        case 'fall':
          moveX = (Math.random() - 0.5) * 40;
          moveY = 80 + Math.random() * 20;
          break;
        case 'sparkle':
          moveX = (Math.random() - 0.5) * 30;
          moveY = (Math.random() - 0.5) * 30;
          break;
        case 'spiral':
          const angle = (i / config.count) * 360;
          const radius = 50 + Math.random() * 30;
          moveX = Math.cos(angle * Math.PI / 180) * radius;
          moveY = Math.sin(angle * Math.PI / 180) * radius;
          extraVars['--spiral-x'] = `${moveX}px`;
          extraVars['--spiral-y'] = `${moveY}px`;
          extraVars['--spiral-x2'] = `${moveX * 2}px`;
          extraVars['--spiral-y2'] = `${moveY * 2}px`;
          moveX = 0;
          moveY = 0;
          break;
        case 'mirror':
          moveX = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40);
          moveY = 0;
          extraVars['--mirror-x'] = `${moveX}px`;
          break;
        case 'vortex':
          const centerX = 50;
          const centerY = 50;
          const distX = (startX - centerX) / 50;
          const distY = (startY - centerY) / 50;
          moveX = -distX * 30;
          moveY = -distY * 30;
          extraVars['--vortex-x'] = `${moveX}px`;
          extraVars['--vortex-y'] = `${moveY}px`;
          break;
        default:
          moveX = (Math.random() - 0.5) * 60;
          moveY = (Math.random() - 0.5) * 60;
      }
      
      return {
        id: i,
        x: startX,
        y: startY,
        moveX,
        moveY,
        delay: Math.random() * (config.type === 'sparkle' ? 2 : 4),
        duration: config.type === 'sparkle' ? 2 :
                 config.type === 'spiral' ? 10 :
                 config.type === 'vortex' ? 5 :
                 6 + Math.random() * 4,
        size: config.type === 'sparkle' ? 3 + Math.random() * 2 :
             config.type === 'spiral' ? 4 + Math.random() * 2 :
             2 + Math.random() * 2,
        ...extraVars
      };
    });
  };
  
  const particles = generateParticleData(particleConfig);
  
  return (
    <div 
      className="absolute pointer-events-none overflow-hidden"
      style={{ 
        top: 0,
        left: 0,
        width: '1920px',
        height: '1080px',
        zIndex: 0
      }}
    >
      {/* Base gradient con animazione */}
      <div 
        className="absolute transition-all duration-700 animate-gradient-shift"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `${fieldStyle.gradient || 'linear-gradient(135deg, #1a1a2e, #2a2a4e)'}, ${fieldStyle.gradient || 'linear-gradient(315deg, #2a2a4e, #1a1a2e)'}`,
          backgroundSize: '200% 200%',
          opacity: 0.5
        }}
      />
      
      {/* Glow pulsante */}
      <div 
        className="absolute transition-all duration-700 animate-glow-pulse"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Pattern overlay animato */}
      <div 
        className="absolute opacity-20"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${fieldStyle.accent || '#666'}20 10px,
            ${fieldStyle.accent || '#666'}20 20px
          )`
        }}
      />
      
      {/* Particelle tematiche (contenute) */}
      {particles.map(particle => {
        const styleObj = {
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          backgroundColor: particleConfig.accent,
          opacity: particleConfig.opacity,
          animationDelay: `${particle.delay}s`,
          animationDuration: `${particle.duration}s`
        };
        
        // Aggiungi variabili CSS per animazioni specifiche
        if (particleConfig.type === 'float' || particleConfig.type === 'rise' || particleConfig.type === 'fall') {
          styleObj['--particle-x'] = `${particle.moveX}%`;
          styleObj['--particle-y'] = `${particle.moveY}%`;
        }
        if (particle['--spiral-x']) styleObj['--spiral-x'] = particle['--spiral-x'];
        if (particle['--spiral-y']) styleObj['--spiral-y'] = particle['--spiral-y'];
        if (particle['--spiral-x2']) styleObj['--spiral-x2'] = particle['--spiral-x2'];
        if (particle['--spiral-y2']) styleObj['--spiral-y2'] = particle['--spiral-y2'];
        if (particle['--mirror-x']) styleObj['--mirror-x'] = particle['--mirror-x'];
        if (particle['--vortex-x']) styleObj['--vortex-x'] = particle['--vortex-x'];
        if (particle['--vortex-y']) styleObj['--vortex-y'] = particle['--vortex-y'];
        
        if (particleConfig.glow) {
          styleObj.boxShadow = `0 0 ${particle.size * 2}px ${particleConfig.accent}`;
        }
        
        return (
          <div
            key={particle.id}
            className={`absolute ${particleConfig.shape} ${particleConfig.className}`}
            style={styleObj}
          />
        );
      })}
    </div>
  );
};

/**
 * Componente pannello campo di battaglia centrale
 * Mostra icona, nome, effetto e controlli del campo
 */
export const BattlefieldPanel = ({ 
  field, 
  gamePhase, 
  isPlayerFirst, 
  isZoomed, 
  selectedAgent, 
  onConfirm, 
  awaitingEnemySelection = false,
  /** true = testi "avversario" invece di "IA" (multiplayer online) */
  isOnlinePvP = false,
  duelPhase, 
  battleResult,
  onContinue,
  gameResult,
  onMenu,
  onOpenPlaytest,
}) => {
  const oppWait = isOnlinePvP ? "L'avversario sta scegliendo..." : "L'IA sta scegliendo...";
  const oppThink = isOnlinePvP ? "In attesa dell'avversario..." : "L'IA sta pensando...";
  // Il pannello deve essere sempre visibile, anche quando non c'è un campo selezionato
  // (ad esempio durante la fase selectField)
  const isDuelPhase = gamePhase === 'result' && battleResult;
  const [riepilogoOpen, setRiepilogoOpen] = useState(false);
  const riepilogoAnchorRef = useRef(null);
  const [riepilogoRect, setRiepilogoRect] = useState(null);

  useEffect(() => {
    setRiepilogoOpen(false);
  }, [duelPhase]);

  useEffect(() => {
    if (!riepilogoOpen || !riepilogoAnchorRef.current) {
      setRiepilogoRect(null);
      return undefined;
    }
    const updateRect = () => {
      const rect = riepilogoAnchorRef.current?.getBoundingClientRect();
      if (rect) setRiepilogoRect({ left: rect.left, top: rect.bottom + 4, width: rect.width });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [riepilogoOpen]);

  const riepilogoContent = battleResult ? (
    <div className="px-2 py-2 rounded-b-lg border-x border-b border-slate-600/40 bg-slate-900/95 satze-riepilogo-unroll">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-slate-800/60 rounded p-2">
          <div className="text-red-400/90 font-medium mb-1 text-[10px]">IA</div>
          <div className="text-[10px] space-y-1">
            <div><span className="text-amber-400">FC:</span> {battleResult.enemyFocusUsed}</div>
            {battleResult.enemyPower !== battleResult.enemyAgent.power && (
              <div><span className="text-yellow-400">POT:</span> {battleResult.enemyAgent.power} → {battleResult.enemyPower}</div>
            )}
            {battleResult.enemyDamage !== battleResult.enemyAgent.damage && (
              <div><span className="text-purple-400">DAN:</span> {battleResult.enemyAgent.damage} → {battleResult.enemyDamage}</div>
            )}
            {(() => {
              const initialVA = battleResult.enemyPower * battleResult.enemyFocusUsed;
              return battleResult.enemyAssault !== initialVA ? (
                <div><span className="text-purple-400">VA:</span> {initialVA} → {battleResult.enemyAssault}</div>
              ) : (
                <div><span className="text-purple-400">VA:</span> {battleResult.enemyAssault}</div>
              );
            })()}
            {battleResult.enemyPower === battleResult.enemyAgent.power &&
              battleResult.enemyDamage === battleResult.enemyAgent.damage &&
              battleResult.enemyAssault === (battleResult.enemyPower * battleResult.enemyFocusUsed) && (
                <div className="text-slate-500 text-[9px] opacity-80">—</div>
              )}
          </div>
        </div>
        <div className="bg-slate-800/60 rounded p-2">
          <div className="text-green-400/90 font-medium mb-1 text-[10px]">TU</div>
          <div className="text-[10px] space-y-1">
            <div><span className="text-amber-400">FC:</span> {battleResult.playerFocusUsed}</div>
            {battleResult.playerPower !== battleResult.playerAgent.power && (
              <div><span className="text-yellow-400">POT:</span> {battleResult.playerAgent.power} → {battleResult.playerPower}</div>
            )}
            {battleResult.playerDamage !== battleResult.playerAgent.damage && (
              <div><span className="text-purple-400">DAN:</span> {battleResult.playerAgent.damage} → {battleResult.playerDamage}</div>
            )}
            {(() => {
              const initialVA = battleResult.playerPower * battleResult.playerFocusUsed;
              return battleResult.playerAssault !== initialVA ? (
                <div><span className="text-purple-400">VA:</span> {initialVA} → {battleResult.playerAssault}</div>
              ) : (
                <div><span className="text-purple-400">VA:</span> {battleResult.playerAssault}</div>
              );
            })()}
            {battleResult.playerPower === battleResult.playerAgent.power &&
              battleResult.playerDamage === battleResult.playerAgent.damage &&
              battleResult.playerAssault === (battleResult.playerPower * battleResult.playerFocusUsed) && (
                <div className="text-slate-500 text-[9px] opacity-80">—</div>
              )}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-600/40 pt-1.5 mt-1.5">
        <div className="text-slate-500 text-[10px] space-y-1">
          <div>FC investiti: IA {battleResult.enemyFocusUsed} · TU {battleResult.playerFocusUsed}</div>
          <div>Danno: {battleResult.damageDealt} PV</div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <div
      className={`absolute flex flex-col items-center justify-center p-4 pointer-events-none satze-battlefield-panel satze-hud-panel ${
        riepilogoOpen ? 'satze-battlefield-panel-riepilogo-open' : ''
      } ${
        isZoomed 
          ? 'satze-battlefield-panel-zoomed animate-battlefield-zoom-smooth' 
          : ''
      }`}
      style={{
        top: isDuelPhase ? 'calc(35% + 50px)' : '50%', 
        left: '50%', 
        transform: isZoomed ? undefined : 'translate(-50%, -50%)',
        width: '200px',
        height: isDuelPhase ? '320px' : '280px',
        zIndex: 10,
        transition: 'top 0.6s ease-out',
        overflow: 'visible',
      }}
    >
      {gamePhase === 'selectField' && (
        <div className="text-center">
          <div className="text-amber-400/90 text-sm font-semibold mb-1 tracking-wide">Campo di Battaglia</div>
          <div className="text-slate-400 text-xs">
            {isPlayerFirst ? 'Scegli un campo' : oppWait}
          </div>
        </div>
      )}
      
      {(gamePhase === 'selectAgent' || gamePhase === 'result') && field && (
        <>
          <div className="text-center w-full flex flex-col items-center justify-between h-full py-1 relative">
            <div className="flex-1 flex flex-col items-center justify-center group">
              <div className="text-amber-400/90 text-[10px] font-medium mb-2 tracking-widest uppercase">Campo</div>
              <div className={`mb-2 transition-all duration-300 flex items-center justify-center ${
                isZoomed ? 'scale-110' : 'hover:scale-105'
              }`}>
                <Icon name={field.icon} type="cardIcon" size={32} color="#D4A847" />
              </div>
              <div className="text-white text-sm font-semibold mb-1.5">{field.name}</div>
              <div className="text-slate-400 text-[11px] leading-relaxed px-1 text-center">
                {field.effect}
              </div>
            </div>
            
            {/* Pulsante CONFERMA o "L'IA sta pensando..." (solo durante selectAgent) */}
            {gamePhase === 'selectAgent' && selectedAgent && (
              <div className="w-full mt-2 pointer-events-auto">
                {awaitingEnemySelection ? (
                  <div className="w-full py-2 px-4 bg-white/5 text-slate-400 text-xs font-medium rounded-lg border border-white/10 text-center">
                    {oppThink}
                  </div>
                ) : (
                  <button
                    onClick={onConfirm}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg
                             border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="sword" type="cardIcon" size={12} color="#fff" /> Conferma
                  </button>
                )}
              </div>
            )}
            
            {/* Barra progresso fasi duello */}
            {gamePhase === 'result' && battleResult && (
              <div className="w-full mt-2">
                <div className="text-[10px] text-slate-500 mb-1">
                  {duelPhase >= 0 && duelPhase <= 6 ? DUEL_PHASE_META[duelPhase]?.label ?? '' : ''}
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400/80 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((duelPhase + 1) / 7) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Indicatore vincitore e pulsante CONTINUA (fase 5+) */}
            {gamePhase === 'result' && battleResult && duelPhase >= 5 && (
              <div className="w-full mt-2 pointer-events-auto">
                <div className={`text-center mb-2 text-sm font-semibold ${
                  battleResult.winner === 'player' ? 'satze-result-victory' : 
                  battleResult.winner === 'enemy' ? 'satze-result-defeat' : 
                  'text-slate-400'
                }`}>
                  {battleResult.winner === 'player' && <><Icon name="star" type="cardIcon" size={18} color="#4FD1C5" /> Vittoria</>}
                  {battleResult.winner === 'enemy' && <><Icon name="skull" type="cardIcon" size={18} color="#D946EF" /> Sconfitta</>}
                  {battleResult.winner === 'draw' && <><Icon name="check" type="cardIcon" size={18} /> Pareggio</>}
                </div>
                
                {duelPhase >= 6 && (
                  <>
                    {/* Riepilogo Post-Duello (chiuso di default, si apre al clic) */}
                    <div ref={riepilogoAnchorRef} className="w-full mb-2 rounded-lg border border-slate-600/40 bg-slate-900/90 overflow-visible text-[10px] relative z-20">
                      <button
                        type="button"
                        onClick={() => setRiepilogoOpen((o) => !o)}
                        className="w-full py-2 px-2 flex items-center justify-between gap-2 text-left font-medium text-slate-400 text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
                        aria-expanded={riepilogoOpen}
                      >
                        <span>Riepilogo</span>
                        <span className="text-slate-500 tabular-nums shrink-0" aria-hidden>
                          {riepilogoOpen ? '▼' : '▶'}
                        </span>
                      </button>
                      {false && riepilogoOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 px-2 py-2 rounded-b-lg border-x border-b border-slate-600/40 bg-slate-900/95 overflow-y-auto satze-riepilogo-unroll"
                      style={{ zIndex: 30, maxHeight: '128px' }}
                    >
                      {/* Cambi alle Statistiche - IA a sinistra, TU a destra */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* IA */}
                        <div className="bg-slate-800/60 rounded p-2">
                          <div className="text-red-400/90 font-medium mb-1 text-[10px]">IA</div>
                          <div className="text-[10px] space-y-1">
                            <div>
                              <span className="text-amber-400">FC:</span> {battleResult.enemyFocusUsed}
                            </div>
                            {/* POT modificato */}
                            {battleResult.enemyPower !== battleResult.enemyAgent.power && (
                              <div>
                                <span className="text-yellow-400">POT:</span> {battleResult.enemyAgent.power} → {battleResult.enemyPower}
                              </div>
                            )}
                            {/* DAN modificato */}
                            {battleResult.enemyDamage !== battleResult.enemyAgent.damage && (
                              <div>
                                <span className="text-purple-400">DAN:</span> {battleResult.enemyAgent.damage} → {battleResult.enemyDamage}
                              </div>
                            )}
                            {/* VA modificato */}
                            {(() => {
                              const initialVA = battleResult.enemyPower * battleResult.enemyFocusUsed;
                              return battleResult.enemyAssault !== initialVA ? (
                                <div>
                                  <span className="text-purple-400">VA:</span> {initialVA} → {battleResult.enemyAssault}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-purple-400">VA:</span> {battleResult.enemyAssault}
                                </div>
                              );
                            })()}
                            {/* Nessun cambiamento */}
                            {battleResult.enemyPower === battleResult.enemyAgent.power && 
                             battleResult.enemyDamage === battleResult.enemyAgent.damage &&
                             battleResult.enemyAssault === (battleResult.enemyPower * battleResult.enemyFocusUsed) && (
                              <div className="text-slate-500 text-[9px] opacity-80">—</div>
                            )}
                          </div>
                        </div>
                        
                        {/* TU */}
                        <div className="bg-slate-800/60 rounded p-2">
                          <div className="text-green-400/90 font-medium mb-1 text-[10px]">TU</div>
                          <div className="text-[10px] space-y-1">
                            <div>
                              <span className="text-amber-400">FC:</span> {battleResult.playerFocusUsed}
                            </div>
                            {/* POT modificato */}
                            {battleResult.playerPower !== battleResult.playerAgent.power && (
                              <div>
                                <span className="text-yellow-400">POT:</span> {battleResult.playerAgent.power} → {battleResult.playerPower}
                              </div>
                            )}
                            {/* DAN modificato */}
                            {battleResult.playerDamage !== battleResult.playerAgent.damage && (
                              <div>
                                <span className="text-purple-400">DAN:</span> {battleResult.playerAgent.damage} → {battleResult.playerDamage}
                              </div>
                            )}
                            {/* VA modificato */}
                            {(() => {
                              const initialVA = battleResult.playerPower * battleResult.playerFocusUsed;
                              return battleResult.playerAssault !== initialVA ? (
                                <div>
                                  <span className="text-purple-400">VA:</span> {initialVA} → {battleResult.playerAssault}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-purple-400">VA:</span> {battleResult.playerAssault}
                                </div>
                              );
                            })()}
                            {/* Nessun cambiamento */}
                            {battleResult.playerPower === battleResult.playerAgent.power && 
                             battleResult.playerDamage === battleResult.playerAgent.damage &&
                             battleResult.playerAssault === (battleResult.playerPower * battleResult.playerFocusUsed) && (
                              <div className="text-slate-500 text-[9px] opacity-80">—</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Statistiche Duello */}
                      <div className="border-t border-slate-600/40 pt-1.5 mt-1.5">
                        <div className="text-slate-500 text-[10px] space-y-1">
                          <div>
                            FC investiti: IA {battleResult.enemyFocusUsed} · TU {battleResult.playerFocusUsed}
                          </div>
                          <div>
                            Danno: {battleResult.damageDealt} PV
                          </div>
                        </div>
                      </div>
                    </div>
                      )}
                    </div>
                    
                    {/* Pulsante CONTINUA */}
                    <div className="w-full" style={riepilogoOpen ? { transform: 'translateY(132px)' } : undefined}>
                      <button
                        onClick={onContinue}
                        className="w-full py-2 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg
                                 border border-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Icon name="check" type="cardIcon" size={12} color="#fff" /> Continua
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
      
      {gamePhase === 'gameOver' && (
        <div className="text-center space-y-3 pointer-events-auto">
          <div className={`text-base font-semibold flex items-center justify-center gap-2 ${
            gameResult?.winner === 'player' ? 'satze-result-victory' : 
            gameResult?.winner === 'draw' ? 'text-slate-400' : 'satze-result-defeat'
          }`}>
            {gameResult?.winner === 'player' ? <><Icon name="star" type="cardIcon" size={20} color="#4FD1C5" /> Vittoria</> : 
             gameResult?.winner === 'draw' ? <><Icon name="check" type="cardIcon" size={20} /> Pareggio</> : <><Icon name="skull" type="cardIcon" size={20} color="#D946EF" /> Sconfitta</>}
          </div>
          <div className="text-[11px] text-slate-500">
            {gameResult?.reason === 'fields' && '3 campi conquistati'}
            {gameResult?.reason === 'hp' && 'Per punti vita'}
          </div>
          <button
            onClick={onMenu}
            className="w-full py-2 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg border border-white/20 transition-all"
          >
            Menu
          </button>
          {onOpenPlaytest && (
            <button
              onClick={onOpenPlaytest}
              className="w-full py-2 px-4 bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-500/40 transition-all"
            >
              Storico Playtest
            </button>
          )}
        </div>
      )}
    </div>
    {riepilogoOpen && riepilogoRect && riepilogoContent && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-auto text-[10px]"
            style={{
              position: 'fixed',
              left: riepilogoRect.left,
              top: riepilogoRect.top,
              width: riepilogoRect.width,
              zIndex: 9999,
            }}
          >
            {riepilogoContent}
          </div>,
          document.body
        )
      : null}
    </>
  );
};
