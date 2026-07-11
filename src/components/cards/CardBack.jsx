import React, { useMemo } from 'react';
import { ARMY_COLORS, ARMY_GIFS, ARMY_ICONS } from '../../data';
import { getDeckArmies, getHandAccentColor } from '../../utils/deckManager';

const FALLBACK_ACCENT = '#94a3b8';

function getArmyAccent(army) {
  return ARMY_COLORS[army]?.accent || FALLBACK_ACCENT;
}

function ArmyBackIcon({ army, size = '42%' }) {
  const src = ARMY_ICONS[army];
  const accent = ARMY_COLORS[army]?.accent || FALLBACK_ACCENT;
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: 'auto',
        objectFit: 'contain',
        filter: `drop-shadow(0 0 10px color-mix(in srgb, ${accent} 55%, transparent))`,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Porzione centrale dell'immagine dorso, sovrapposta in trasparenza sul colore opaco. */
function DeckBackTexture({ src, objectPosition = 'center center' }) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition,
        opacity: 0.38,
        pointerEvents: 'none',
      }}
    />
  );
}

function ArmyBackTexture({ army, objectPosition = 'center center' }) {
  return <DeckBackTexture src={ARMY_GIFS[army]} objectPosition={objectPosition} />;
}

function IconLayer({ armies, isDual }) {
  if (isDual) {
    return (
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10%',
        }}
      >
        <ArmyBackIcon army={armies[0]} size="32%" />
        <ArmyBackIcon army={armies[1]} size="32%" />
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ArmyBackIcon army={armies[0]} />
    </div>
  );
}

/**
 * Dorso carta: base opaca colore esercito + texture centrale armata in trasparenza.
 * Mono armata → icona centrata; doppia armata → due icone affiancate, colore fusione pesata.
 */
export function CardBack({
  armies: armiesProp,
  deck,
  backImage = null,
  fallbackArmy = null,
  borderRadius = 10,
  style,
  className = '',
}) {
  const armies = useMemo(() => {
    if (armiesProp?.length) return armiesProp.slice(0, 2);
    return getDeckArmies(deck, { fallbackArmy });
  }, [armiesProp, deck, fallbackArmy]);

  const accentColor = useMemo(() => {
    const colorHand = deck?.length
      ? deck
      : armies.map((army) => ({ army }));
    return getHandAccentColor(colorHand, ARMY_COLORS, getArmyAccent(armies[0]));
  }, [deck, armies]);

  const isDual = armies.length >= 2;
  const borderColor = `color-mix(in srgb, ${accentColor} 55%, #1a1a22)`;

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius,
        overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${accentColor} 28%, transparent), 0 4px 16px rgba(0,0,0,0.9)`,
        display: 'flex',
        flexDirection: 'column',
        background: '#060608',
        ...style,
      }}
    >
      {/* Layer 1 — colore esercito opaco (come nel duello, ma pieno) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(165deg, color-mix(in srgb, ${accentColor} 82%, #0c0c10) 0%, color-mix(in srgb, ${accentColor} 58%, #060608) 100%)`,
        }}
      />

      {/* Layer 2 — texture armata dominante; il dorso PNG generico resta in overlay */}
      {armies[0] ? <ArmyBackTexture army={armies[0]} /> : null}
      {backImage ? <DeckBackTexture src={backImage} /> : null}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <IconLayer armies={armies} isDual={isDual} />
      </div>
    </div>
  );
}
