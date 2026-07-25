import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import './cosmic-transitions.css';

// Mappa gamePhase → label da mostrare durante la transizione
const PHASE_LABELS = {
  menu: 'MENU PRINCIPALE',
  selectMode: 'PARTITA LOCALE',
  selectArmy: 'GESTIONE ARMATA',
  selectDeck: 'SELEZIONA MAZZO',
  deckManager: 'GESTIONE MAZZI',
  selectField: 'CAMPO DI BATTAGLIA',
  selectAgent: 'SCHIERA AGENTE',
  battle: 'DUELLO',
  result: 'RISULTATO',
  gameOver: 'FINE PARTITA',
  gallery: 'GALLERIA',
  campaign: 'CAMPAGNA',
  campaignWarHub: 'GUERRA',
  campaignHub: 'GUERRA',
  campaignSlots: 'CAMPAGNA',
  onlineDeckReady: 'PRONTI AL DUELLO',
  multiplayerLobby: 'MULTIPLAYER',
  playtestHistory: 'STORICO PLAYTEST',
  options: 'OPZIONI',
};

// Sub-fasi del duello: NON innescano la transizione cosmic
const SKIP_TRANSITION_PHASES = new Set([
  'selectAgent', 'battle', 'result',
]);

// Fasi del "mondo duello" (tema Cyber HUD): entrandoci la cortina vira
// al ciano/oro per dichiarare il cambio di identità visiva.
const DUEL_WORLD_PHASES = new Set([
  'selectField', 'selectAgent', 'battle', 'result', 'gameOver',
]);

const CosmicTransitionContext = createContext(null);

export function useCosmicTransition() {
  return useContext(CosmicTransitionContext);
}

/**
 * Hook che incapsula setGamePhase con la transizione automatica.
 */
export function useTransitionedSetGamePhase(setGamePhase, currentPhase) {
  const ctx = useCosmicTransition();
  return useCallback((nextPhase) => {
    // Sub-fasi rapide del duello: cambio istantaneo, niente cortina
    if (SKIP_TRANSITION_PHASES.has(nextPhase) || SKIP_TRANSITION_PHASES.has(currentPhase)) {
      setGamePhase(nextPhase);
      return;
    }
    if (!ctx) {
      setGamePhase(nextPhase);
      return;
    }
    ctx.requestPhaseChange({
      label: PHASE_LABELS[nextPhase] || '',
      variant: DUEL_WORLD_PHASES.has(nextPhase) ? 'duel' : 'cosmic',
      onSwap: () => setGamePhase(nextPhase),
    });
  }, [ctx, setGamePhase, currentPhase]);
}

/**
 * Provider da montare ad alto livello (App.jsx o main.jsx).
 */
export function CosmicTransitionProvider({ children }) {
  const [transition, setTransition] = useState(null);
  const busyRef = useRef(false);

  const requestPhaseChange = useCallback(({ label, variant = 'cosmic', onSwap }) => {
    if (busyRef.current) {
      // Richiesta sovrapposta: esegui swap immediato per non bloccare il gioco
      onSwap?.();
      return;
    }
    busyRef.current = true;
    setTransition({ label, variant, phase: 'covering' });

    // T+280ms: la cortina copre tutto → fai lo swap della scena
    setTimeout(() => {
      try { onSwap?.(); } catch (e) { console.error('[CosmicTransition] onSwap error', e); }
      setTransition((t) => t ? { ...t, phase: 'peak' } : null);
    }, 280);

    // T+720ms: la cortina è uscita → fine transizione
    setTimeout(() => {
      setTransition(null);
      busyRef.current = false;
    }, 720);
  }, []);

  return (
    <CosmicTransitionContext.Provider value={{ requestPhaseChange, isTransitioning: !!transition }}>
      <div
        className={transition ? 'cosmic-scene cosmic-scene--enter' : ''}
        style={{ position: 'absolute', inset: 0 }}
      >
        {children}
      </div>

      {transition && (
        <React.Fragment>
          <div className="stage-backdrop" />
          <div
            className={transition.variant === 'duel' ? 'cosmic-transition--duel' : ''}
            style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none', overflow: 'hidden' }}
          >
            <div className="sweep-panel sweep-panel--a" />
            <div className="sweep-panel sweep-panel--b" />
            <div className="flash-bloom" />
            <div className="glitch-line" style={{ top: '20%', animationDelay: '0.04s' }} />
            <div className="glitch-line" style={{ top: '55%', animationDelay: '0.14s' }} />
            <div className="glitch-line" style={{ top: '78%', animationDelay: '0.24s' }} />
            {transition.label && (
              <React.Fragment>
                <div className="load-text">{transition.label}</div>
                <div className="load-sub">&gt; CARICAMENTO</div>
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      )}
    </CosmicTransitionContext.Provider>
  );
}

// Backward-compat: se il vecchio codice importava ScreenTransition come default
export default CosmicTransitionProvider;
