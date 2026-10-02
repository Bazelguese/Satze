/**
 * Monete FC del duello: quando parte ognuna (la conta del gioco la fa comparire) e quante
 * sono già atterrate sulla carta. La moneta sale sopra la carta e ci sbatte dentro
 * FOCUS_SLAM_MS dopo la partenza: lì conta (scheda VA, contatore, Overdrive).
 */
import { useEffect, useRef, useState } from 'react';

export const FOCUS_RISE_MS = 240;
export const FOCUS_SLAM_MS = 380;

const SIDES = ['player', 'enemy'];

export function useFocusLaunches({ duelKey, duelPhase, playerCoins = 0, enemyCoins = 0, playerTotal = 0, enemyTotal = 0 }) {
  const launchesRef = useRef({ player: [], enemy: [] });
  const prevRef = useRef({ player: 0, enemy: 0, key: null });
  const [landed, setLanded] = useState({ player: 0, enemy: 0 });
  // i timer restano vivi tra una moneta e la successiva (possono arrivare a meno di 380 ms)
  const timersRef = useRef([]);

  if (prevRef.current.key !== duelKey) {
    prevRef.current = { player: 0, enemy: 0, key: duelKey };
    launchesRef.current = { player: [], enemy: [] };
  }

  useEffect(() => {
    const now = performance.now();
    const coins = { player: playerCoins, enemy: enemyCoins };
    SIDES.forEach((side) => {
      const prev = prevRef.current[side];
      const cur = Math.max(0, coins[side] || 0);
      const list = launchesRef.current[side];
      if (cur < prev) list.length = 0;
      // una alla volta: parte adesso; a salti (sincronizzazione, «Salta»): già atterrate
      const missing = cur - list.length;
      for (let i = 0; i < missing; i += 1) list.push(missing === 1 ? now : now - FOCUS_SLAM_MS - 1000);
      prevRef.current[side] = cur;
      if (missing === 1) {
        timersRef.current.push(setTimeout(() => setLanded((l) => ({ ...l, [side]: Math.max(l[side], cur) })), FOCUS_SLAM_MS));
      } else if (missing > 1 || cur < prev) setLanded((l) => ({ ...l, [side]: cur }));
    });
  }, [duelKey, playerCoins, enemyCoins]);

  useEffect(() => {
    setLanded({ player: 0, enemy: 0 });
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [duelKey]);

  const out = duelPhase >= 3
    ? { player: playerTotal, enemy: enemyTotal }
    : { player: Math.min(landed.player, playerCoins), enemy: Math.min(landed.enemy, enemyCoins) };
  return { landed: out, launchesRef };
}
