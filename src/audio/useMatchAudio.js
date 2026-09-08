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

  useEffect(() => {
    if (gamePhase !== 'result') {
      prevDuelRef.current = duelPhase;
      return;
    }
    if (prevDuelRef.current === duelPhase) return;
    // Evita doppio deploy se result arriva già con phase 0 dallo stesso tick di transition
    const prev = prevDuelRef.current;
    prevDuelRef.current = duelPhase;
    if (prev == null || prev < 0) {
      // Prima beat della sequenza
      playDuelPhaseBeat(duelPhase, battleResult);
      return;
    }
    playDuelPhaseBeat(duelPhase, battleResult);
  }, [gamePhase, duelPhase, battleResult]);
}
