import React from 'react';
import { formatAbilityHelper, splitAbilityMinSuffix } from '../../utils';

/** Solo se c’è davvero ` (min N)` in coda; altrimenti tutto il testo resta corpo unico (maggioranza delle carte). */
export const DEFAULT_MIN_CLASS =
  'text-[0.74em] font-semibold opacity-95 align-baseline whitespace-nowrap';

/** Suffisso `(min N)` a corpo pieno (stessi px del footer attivo) — es. stati grigi carta. */
export const FOOTER_MUTED_MIN_CLASS =
  'text-[11px] font-semibold opacity-95 align-baseline whitespace-nowrap';

/**
 * Testo abilità carta: suffisso "(min N)" leggermente più piccolo del corpo; senza suffisso, testo invariato.
 */
export function AbilityFormatted({ ability, options = {}, minClassName = DEFAULT_MIN_CLASS }) {
  if (!ability) return '—';
  const full = formatAbilityHelper(ability, options);
  const { base, minSuffix } = splitAbilityMinSuffix(full);
  if (!minSuffix) return full;
  return (
    <>
      {base}
      <span className={minClassName}>{minSuffix}</span>
    </>
  );
}

/**
 * Stringa già pronta (potere da `formatAbilityHelper` o testo bonus armata da `ARMY_BONUSES`).
 * Suffisso ` (min N)` in coda, se c’è, reso leggermente più piccolo.
 */
export function AbilityFormattedFromString({ text, minClassName = DEFAULT_MIN_CLASS }) {
  if (text == null || text === '') return '—';
  const s = String(text);
  const { base, minSuffix } = splitAbilityMinSuffix(s);
  if (!minSuffix) return s;
  return (
    <>
      {base}
      <span className={minClassName}>{minSuffix}</span>
    </>
  );
}

/** Alias semantico: descrizioni bonus armata (es. «-5 VA nem. (min 6)», «Tossina 2 (min 4)»). */
export function BonusFormattedFromString(props) {
  return <AbilityFormattedFromString {...props} />;
}
