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
import { PersonaTransitionOverlay, PTR_COVER_MS, PTR_REVEAL_MS, PTR_END_MS } from './PersonaTransition.jsx';

const PHASE_LABELS = {
  menu: 'MENU PRINCIPALE',
  selectMode: 'PARTITA LOCALE',
  selectArmy: 'PARTITA LOCALE',
  selectDeck: 'SCEGLI L\'ESERCITO',
  deckManager: 'GESTIONE ESERCITI',
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

/** Riga piccola sopra il nome, sulla cortina Persona. */
const PHASE_KICKERS = {
  menu: 'SATZE',
  selectArmy: 'FASE I · SCHIERAMENTO',
  selectDeck: 'FASE II · ARRUOLAMENTO',
  deckManager: 'ESERCITO · LISTA',
  gallery: 'ARCHIVIO',
  campaignSlots: 'STORIA · SALVATAGGI',
  campaignHub: 'CAMPAGNA',
  multiplayerLobby: 'ONLINE · LOBBY',
  playtestHistory: 'DATI',
  options: 'SISTEMA',
};

const DEFAULT_ACCENT = '#c026d3';

/**
 * Il menù principale segna da quale voce parte il passaggio (colore e punto
 * dello schermo), così la cortina parte dalla voce scelta.
 */
let pendingFrom = null;
export function armTransitionFrom({ accent, x, y }) {
  pendingFrom = { accent, origin: Number.isFinite(x) ? { x, y } : null, at: Date.now() };
}
function takeTransitionFrom() {
  const p = pendingFrom;
  pendingFrom = null;
  return p && Date.now() - p.at < 1500 ? p : null;
}

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

/**
 * True se la schermata è stata montata sotto la cortina: le sue animazioni
 * d'ingresso "a lame" vanno saltate, altrimenti si vedono due transizioni.
 */
export function useArrivedByCurtain() {
  const ctx = useContext(CosmicTransitionContext);
  const [arrived] = useState(() => !!ctx?.isTransitioning);
  return arrived;
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
      const from = takeTransitionFrom();
      requestPhaseChange({
        label: PHASE_LABELS[nextPhase] || '',
        kicker: PHASE_KICKERS[nextPhase] || '',
        variant: DUEL_WORLD_PHASES.has(nextPhase) ? 'duel' : 'cosmic',
        dir: nextPhase === 'menu' ? 'back' : 'fwd',
        accent: from?.accent ?? DEFAULT_ACCENT,
        origin: from?.origin ?? null,
        onSwap: () => setGamePhase(nextPhase),
      });
    },
    [requestPhaseChange, setGamePhase, currentPhase]
  );
}

export function CosmicTransitionProvider({ children, look = 'lastra' }) {
  const [transition, setTransition] = useState(null);
  const [sceneSwapped, setSceneSwapped] = useState(false);
  /** Cortina Persona che si sta aprendo: la nuova schermata può animarsi. */
  const [curtainOpening, setCurtainOpening] = useState(false);
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
    ({ label, kicker = '', variant = 'cosmic', dir = 'fwd', accent = DEFAULT_ACCENT, origin = null, onSwap }) => {
      if (busyRef.current) return;

      clearTimers();
      busyRef.current = true;
      setSceneSwapped(false);
      setCurtainOpening(false);
      setHeavyContentReady(false);
      runIdRef.current += 1;
      const runId = runIdRef.current;
      const persona = variant === 'cosmic';
      setTransition({ label, kicker, variant, dir, accent, origin, look, persona, lite: vfxLite, runId, exiting: false });
      const swapMs = persona ? PTR_COVER_MS : SWAP_MS;
      const heavyMs = persona ? PTR_COVER_MS + 40 : HEAVY_MS;
      const totalMs = persona ? PTR_END_MS + 20 : TOTAL_MS;

      timersRef.current.push(
        setTimeout(() => {
          try {
            onSwap?.();
          } catch (e) {
            console.error('[CosmicTransition] onSwap error', e);
          }
          setSceneSwapped(true);
        }, swapMs)
      );

      timersRef.current.push(
        setTimeout(() => {
          setHeavyContentReady(true);
        }, heavyMs)
      );

      if (persona) {
        timersRef.current.push(setTimeout(() => setCurtainOpening(true), PTR_REVEAL_MS));
      } else {
        timersRef.current.push(
          setTimeout(() => {
            setTransition((t) => (t && t.runId === runId ? { ...t, exiting: true } : t));
          }, FADE_MS)
        );
      }

      timersRef.current.push(
        setTimeout(() => {
          setTransition(null);
          setSceneSwapped(false);
          setCurtainOpening(false);
          setHeavyContentReady(true);
          busyRef.current = false;
        }, totalMs)
      );
    },
    [clearTimers, vfxLite, look]
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
    // la cortina Persona copre la scena vecchia mentre è ancora visibile
    transition && !sceneSwapped ? (transition.persona ? 'cosmic-scene--covering' : 'cosmic-scene--outgoing') : '',
    transition && sceneSwapped ? 'cosmic-scene--under-curtain' : '',
    // sotto la cortina chiusa gli ingressi della nuova schermata aspettano:
    // partono mentre la cortina si apre, come un movimento solo
    transition?.persona && sceneSwapped && !curtainOpening ? 'cosmic-scene--held' : '',
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
          {transition.persona ? (
            <PersonaTransitionOverlay run={transition} />
          ) : (
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
          )}
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
