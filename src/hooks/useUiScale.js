import { useEffect, useState } from 'react';
import {
  DISPLAY_SETTINGS_CHANGED_EVENT,
  getDisplaySettings,
} from '../settings/displaySettings';

/** Fattore 0.8–1.25 da preferenze video (densità UI, non zoom viewport). */
export function useUiScale() {
  const [uiScale, setUiScale] = useState(() => getDisplaySettings().uiScale / 100);

  useEffect(() => {
    const on = () => setUiScale(getDisplaySettings().uiScale / 100);
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  return Number.isFinite(uiScale) && uiScale > 0 ? uiScale : 1;
}
