/**
 * Hook: SFX reattivi su fasi partita / sequenza duello.
 * Gli input utente (click carta, FC, conferma) restano nei rispettivi handler.
 */

import { useEffect, useRef } from 'react';
import { playDuelPhaseBeat, playPhaseTransition } from './gameSounds.js';

/**
 * @param {{
 *   gamePhase: string,
 *   duelPhase?: number,
 *   battleResult?: { winner?: string }|null,
 * }} opts
 */
export function useMatchAudio({ gamePhase, duelPhase = 0, battleResult = null }) {
  const prevPhaseRef = useRef(null);
  const prevDuelRef = useRef(null);
  const bootRef = useRef(true);

  useEffect(() => {
    if (bootRef.current) {
      bootRef.current = false;
      prevPhaseRef.current = gamePhase;
      prevDuelRef.current = duelPhase;
      return;
    }
    const prev = prevPhaseRef.current;
    if (prev !== gamePhase) {
      playPhaseTransition(gamePhase, prev);
      prevPhaseRef.current = gamePhase;
      // Nuova sequenza risultato: reset beat
      if (gamePhase === 'result') prevDuelRef.current = -1;
    }
  }, [gamePhase]);

  // colpi programmati dello scontro (contatto, esito): seguono l'animazione Aurora, che dura
  // sempre phaseMs4 anche quando «Velocità duello» accorcia la fase 4 e resta in scena nelle
  // fasi 5–6. Si annullano solo uscendo dal risultato, non al cambio di fase.
  const pendingRef = useRef(() => {});

  useEffect(() => {
    if (gamePhase !== 'result') {
      pendingRef.current();
      pendingRef.current = () => {};
      prevDuelRef.current = duelPhase;
      return;
    }
    if (prevDuelRef.current === duelPhase) return;
    prevDuelRef.current = duelPhase;
    const before = pendingRef.current;
    const cancel = playDuelPhaseBeat(duelPhase, battleResult);
    pendingRef.current = () => {
      before();
      cancel();
    };
  }, [gamePhase, duelPhase, battleResult]);

  useEffect(() => () => pendingRef.current(), []);
}
