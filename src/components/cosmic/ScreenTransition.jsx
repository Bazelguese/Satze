import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { getVfxQualityProfile } from '../../settings/vfxQualityProfile.js';
import './cosmic-transitions.css';

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

const SKIP_TRANSITION_PHASES = new Set(['selectAgent', 'battle', 'result']);

const DUEL_WORLD_PHASES = new Set([
  'selectField',
  'selectAgent',
  'battle',
  'result',
  'gameOver',
]);

const CosmicTransitionContext = createContext(null);

export function useCosmicTransition() {
  return useContext(CosmicTransitionContext);
}

/**
 * True = ok montare contenuto pesante.
 * Si attiva sotto cortina (dopo lo swap), non a fine animazione —
 * così la coda dello sweep non coincide col montaggio carte.
 */
export function useCosmicHeavyContentReady() {
  const ctx = useContext(CosmicTransitionContext);
  const allowHeavy = ctx ? ctx.heavyContentReady : true;
  const isTransitioning = !!ctx?.isTransitioning;
  const [ready, setReady] = useState(() => !isTransitioning);

  useEffect(() => {
    if (allowHeavy) setReady(true);
  }, [allowHeavy]);

  return ready;
}

export function useReportCosmicScreenReady() {}

export function useTransitionedSetGamePhase(setGamePhase, currentPhase) {
  const ctx = useCosmicTransition();
  const requestPhaseChange = ctx?.requestPhaseChange;

  return useCallback(
    (nextPhase) => {
      if (SKIP_TRANSITION_PHASES.has(nextPhase) || SKIP_TRANSITION_PHASES.has(currentPhase)) {
        setGamePhase(nextPhase);
        return;
      }
      if (!requestPhaseChange) {
        setGamePhase(nextPhase);
        return;
      }
      requestPhaseChange({
        label: PHASE_LABELS[nextPhase] || '',
        variant: DUEL_WORLD_PHASES.has(nextPhase) ? 'duel' : 'cosmic',
        onSwap: () => setGamePhase(nextPhase),
      });
    },
    [requestPhaseChange, setGamePhase, currentPhase]
  );
}

export function CosmicTransitionProvider({ children }) {
  const [transition, setTransition] = useState(null);
  const [sceneSwapped, setSceneSwapped] = useState(false);
  const [heavyContentReady, setHeavyContentReady] = useState(true);
  const busyRef = useRef(false);
  const timersRef = useRef([]);
  const runIdRef = useRef(0);
  const vfxLite = getVfxQualityProfile().quality !== 'high';

  const SWAP_MS = 280;
  /** Carte / reveal: subito dopo lo swap, ancora sotto copertura piena. */
  const HEAVY_MS = 320;
  /** Inizio dissolvenza overlay (CSS uncover già quasi finito). */
  const FADE_MS = 760;
  const TOTAL_MS = 920;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const requestPhaseChange = useCallback(
    ({ label, variant = 'cosmic', onSwap }) => {
      if (busyRef.current) return;

      clearTimers();
      busyRef.current = true;
      setSceneSwapped(false);
      setHeavyContentReady(false);
      runIdRef.current += 1;
      const runId = runIdRef.current;
      setTransition({ label, variant, lite: vfxLite, runId, exiting: false });

      timersRef.current.push(
        setTimeout(() => {
          try {
            onSwap?.();
          } catch (e) {
            console.error('[CosmicTransition] onSwap error', e);
          }
          setSceneSwapped(true);
        }, SWAP_MS)
      );

      timersRef.current.push(
        setTimeout(() => {
          setHeavyContentReady(true);
        }, HEAVY_MS)
      );

      timersRef.current.push(
        setTimeout(() => {
          setTransition((t) => (t && t.runId === runId ? { ...t, exiting: true } : t));
        }, FADE_MS)
      );

      timersRef.current.push(
        setTimeout(() => {
          setTransition(null);
          setSceneSwapped(false);
          setHeavyContentReady(true);
          busyRef.current = false;
        }, TOTAL_MS)
      );
    },
    [clearTimers, vfxLite]
  );

  useEffect(
    () => () => {
      clearTimers();
      busyRef.current = false;
    },
    [clearTimers]
  );

  const ctxValue = useMemo(
    () => ({
      requestPhaseChange,
      isTransitioning: !!transition,
      heavyContentReady,
    }),
    [requestPhaseChange, transition, heavyContentReady]
  );

  const sceneClass = [
    'cosmic-scene',
    transition && !sceneSwapped ? 'cosmic-scene--outgoing' : '',
    transition && sceneSwapped ? 'cosmic-scene--under-curtain' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overlayClass = [
    transition?.variant === 'duel' ? 'cosmic-transition--duel' : '',
    transition?.lite ? 'cosmic-transition--lite' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CosmicTransitionContext.Provider value={ctxValue}>
      <div className={sceneClass} style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>

      {transition ? (
        <div
          key={transition.runId}
          className={
            transition.exiting
              ? 'satze-cosmic-transition-mount satze-cosmic-transition-mount--out'
              : 'satze-cosmic-transition-mount'
          }
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50000,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            className={
              transition.lite
                ? 'cosmic-transition-stack cosmic-transition-stack--lite'
                : 'cosmic-transition-stack'
            }
          >
            <div
              className={
                transition.lite ? 'stage-backdrop stage-backdrop--lite' : 'stage-backdrop'
              }
            />
            <div
              className={overlayClass}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              <div className="transition-opaque-plate" aria-hidden />
              <div className="sweep-panel sweep-panel--a" />
              <div className="sweep-panel sweep-panel--b" />
              {transition.label ? (
                <>
                  <div className="load-text">{transition.label}</div>
                  <div className="load-sub">&gt; CARICAMENTO</div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </CosmicTransitionContext.Provider>
  );
}

export default CosmicTransitionProvider;

export function useCosmicOutgoingRetainer() {
  return null;
}

export function useCosmicIsRetainedScreen() {
  return false;
}
