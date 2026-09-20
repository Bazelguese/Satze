import { useCallback, useEffect, useState } from 'react';
import { hasLayeredAltArt } from '../components/cardFaceLab/cardFaceLabData.js';
import {
  ELDRITCH_FACE_CHANGE_EVENT,
  getEldritchFacePreference,
  setEldritchFacePreference,
} from '../utils/eldritchFacePreference.js';

/**
 * Preferenza Standard/Eldritch per una carta (persistita, reattiva).
 * @param {number|string|null|undefined} agentId
 */
export function useEldritchFacePreference(agentId) {
  const id = agentId == null || Number.isNaN(Number(agentId)) ? null : Number(agentId);
  const hasKit = id != null && hasLayeredAltArt(id);
  const [mode, setMode] = useState(() =>
    id == null ? 'standard' : getEldritchFacePreference(id)
  );

  useEffect(() => {
    if (id == null) {
      setMode('standard');
      return undefined;
    }
    setMode(getEldritchFacePreference(id));
    const sync = (e) => {
      if (e?.type === ELDRITCH_FACE_CHANGE_EVENT) {
        const detailId = e?.detail?.agentId;
        if (detailId != null && Number(detailId) !== id) return;
      }
      setMode(getEldritchFacePreference(id));
    };
    window.addEventListener(ELDRITCH_FACE_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ELDRITCH_FACE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [id]);

  const setPreference = useCallback(
    (next) => {
      if (id == null || !hasKit) return;
      setEldritchFacePreference(id, next === 'eldritch' ? 'eldritch' : 'standard');
    },
    [id, hasKit]
  );

  const resolvedMode = hasKit && mode === 'eldritch' ? 'eldritch' : 'standard';

  return {
    hasKit,
    mode: resolvedMode,
    showEldritch: resolvedMode === 'eldritch',
    setPreference,
  };
}
