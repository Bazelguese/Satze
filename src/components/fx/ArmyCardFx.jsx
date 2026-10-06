import React from 'react';
import { ElementFx } from './ElementFx.jsx';
import { armyDefeatFor, armyEntryFor } from './effects/index.js';
import { getArmyAccent } from '../../theme/duelAccents.js';
import { prefersReducedMotion } from '../battle/placeHandoff.js';

/**
 * Animazioni d'armata sulle carte in gioco.
 *
 * - <ArmyEntryFx>: l'agente entra in campo con l'ingresso della SUA armata (nel suo colore).
 *   Parte al montaggio; `enabled` false (o nessun ingresso, o movimento ridotto) = niente effetto.
 * - <ArmyDefeatFx>: l'agente battuto fa la fine che gli infligge l'armata che VINCE (nel colore
 *   di chi vince). Parte quando `active` diventa true e la carta resta nascosta dopo.
 *
 * Entrambi lasciano la carta DOM viva sotto: senza WebGL si ripiega su una dissolvenza.
 */

/** Attesa massima della foto della carta per l'ingresso (sui PC lenti l'effetto si salta). */
export const ENTRY_SNAPSHOT_TIMEOUT_MS = 900;

export function ArmyEntryFx({ agent, enabled = true, variant = null, delayMs = 0, children, onComplete }) {
  const effect = enabled && agent?.army && !prefersReducedMotion() ? armyEntryFor(agent.army, variant) : null;
  const params = React.useMemo(() => ({ color: getArmyAccent(agent) }), [agent?.army]);
  // durante l'attesa (es. il volo dalla mano) la carta resta nascosta: quota 0 dell'ingresso
  const [started, setStarted] = React.useState(delayMs <= 0);
  React.useEffect(() => {
    if (started || !effect) return undefined;
    const t = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(t);
  }, [started, effect, delayMs]);
  if (!effect) return children;
  // la carta resta nascosta finché la foto non è pronta: oltre ENTRY_SNAPSHOT_TIMEOUT_MS si salta
  return (
    <ElementFx
      effect={effect}
      active={started}
      progress={started ? null : 0}
      params={params}
      captureKey={`entry-${agent.id}`}
      snapshotTimeoutMs={ENTRY_SNAPSHOT_TIMEOUT_MS}
      onComplete={onComplete}
    >
      {children}
    </ElementFx>
  );
}

export function ArmyDefeatFx({ agent, winnerArmy, active = false, children, onComplete }) {
  const effect = winnerArmy && !prefersReducedMotion() ? armyDefeatFor(winnerArmy) : null;
  const params = React.useMemo(() => ({ color: getArmyAccent({ army: winnerArmy }) }), [winnerArmy]);
  if (!effect) return children;
  return (
    // foto al via (non in anticipo): durante lo scontro il thread principale serve all'animazione
    <ElementFx effect={effect} active={active} params={params} captureKey={`defeat-${agent?.id}`} onComplete={onComplete}>
      {children}
    </ElementFx>
  );
}
