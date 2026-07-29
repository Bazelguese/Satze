import React, { useEffect, useState } from 'react';
import { HandCard, CardBack } from '../cards';
import { ARMY_GIFS } from '../../data/armies';
import { ARENA_SEAT_SCALE, ARENA_SEAT_ZONES, HAND_CARD_W, HAND_CARD_H } from '../../config/arenaContesaLayout';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import { ARENA_CONTESA } from '../../game/arenaContesa';

const TRIANGLE_STROKE = {
  'top-left': '0,0 1071,0 0,459',
  'top-right': '0,0 1071,0 1071,459',
  'bottom-left': '0,0 0,459 1071,459',
  'bottom-right': '1071,0 1071,459 0,459',
};

const TRIANGLE_GRADIENT = {
  'top-left': 'linear-gradient(135deg, {color}2B 0%, {color}14 100%)',
  'top-right': 'linear-gradient(225deg, {color}2B 0%, {color}14 100%)',
  'bottom-left': 'linear-gradient(45deg, {color}2B 0%, {color}14 100%)',
  'bottom-right': 'linear-gradient(315deg, {color}2B 0%, {color}14 100%)',
};

/**
 * Mano seat Arena: sfondo armata (come Hand produzione) + HandCard + Riserva.
 */
export function ArenaSeatHand({
  player,
  corner,
  role = null,
  isActive = false,
  isLocal = false,
  selectedAgentId = null,
  usedIds = [],
  onPreview,
  onSelectAgent,
  className = '',
}) {
  const zoneCfg = ARENA_SEAT_ZONES[corner];
  const [gifError, setGifError] = useState(false);

  useEffect(() => {
    setGifError(false);
  }, [player?.army]);

  if (!zoneCfg || !player) return null;

  const scale = ARENA_SEAT_SCALE[corner] ?? 0.78;
  const accent = player.accent;
  const hand = player.hand || [];
  const reserveCount = Math.min(player.reserve?.length ?? 0, 5);
  const gifSrc = ARMY_GIFS[player.army];
  const showGif = Boolean(gifSrc) && !gifError;
  const gradient = (TRIANGLE_GRADIENT[corner] || TRIANGLE_GRADIENT['top-left']).replace(/\{color\}/g, accent);
  const strokePoints = TRIANGLE_STROKE[corner] || TRIANGLE_STROKE['top-left'];

  return (
    <div className={`absolute pointer-events-none ${className}`.trim()} style={{ ...zoneCfg.zone, zIndex: isActive ? 9 : 6 }}>
      {/* Sfondo armata (webp) — come Hand produzione */}
      {showGif && (
        <>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: zoneCfg.clipPath,
              zIndex: 1,
            }}
          >
            <img
              src={gifSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{ imageRendering: 'crisp-edges' }}
              onError={() => setGifError(true)}
            />
          </div>
          <svg
            className="absolute inset-0"
            style={{ zIndex: 1.5 }}
            viewBox="0 0 1071 459"
            preserveAspectRatio="none"
          >
            <polygon
              points={strokePoints}
              fill="none"
              stroke={`color-mix(in srgb, ${accent} 55%, black)`}
              strokeWidth={isActive ? '16' : '14'}
            />
          </svg>
        </>
      )}

      {/* Triangolo gradiente sopra lo sfondo */}
      <div
        className={`absolute inset-0 ${isActive ? 'satze-hand-active' : ''}`}
        style={{
          background: gradient,
          clipPath: zoneCfg.clipPath,
          zIndex: 2,
          filter: `drop-shadow(0 0 1px ${accent}) drop-shadow(0 0 3px ${accent})`,
        }}
      />

      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none satze-hand-particles overflow-hidden"
          style={{ clipPath: zoneCfg.clipPath, zIndex: 2.5 }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/80 satze-hand-particle"
              style={{
                width: '4px',
                height: '4px',
                left: `${15 + (i % 4) * 24}%`,
                top: `${18 + Math.floor(i / 4) * 24}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Badge seat */}
      <div
        className="absolute pointer-events-none"
        style={{
          ...zoneCfg.labelAnchor,
          zIndex: 5,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div
          className="px-2 py-1 rounded-md"
          style={{
            background: 'rgba(8,6,18,0.82)',
            border: `1px solid ${isActive ? accent : `${accent}88`}`,
            boxShadow: isLocal ? `0 0 12px ${accent}55` : undefined,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: accent }}>
              {player.seat} {player.name}
            </span>
            {role ? (
              <span className="text-[10px] uppercase tracking-wider" style={{ color: PALETTE.amber }}>
                {role}
              </span>
            ) : null}
          </div>
          <div className="text-[11px] tabular-nums mt-0.5" style={{ color: PALETTE.textPrimary }}>
            {player.hp} PV · {player.focus} FC · {player.fields}/{ARENA_CONTESA.conquestThreshold}
          </div>
        </div>
      </div>

      {/* Carte mano */}
      <div className="absolute inset-0" style={{ zIndex: 4 }}>
        {hand.map((agent, idx) => {
          const pos = zoneCfg.positions[idx];
          if (!pos) return null;
          const isSelected = selectedAgentId != null && agent.id === selectedAgentId;
          return (
            <div
              key={agent.id}
              className="absolute pointer-events-auto"
              style={{
                ...pos,
                width: HAND_CARD_W,
                height: HAND_CARD_H,
                transform: `scale(${scale})`,
                transformOrigin: corner.includes('top')
                  ? (corner.includes('left') ? 'top left' : 'top right')
                  : (corner.includes('left') ? 'bottom left' : 'bottom right'),
                zIndex: isSelected ? 20 : 5 + idx,
              }}
            >
              <HandCard
                agent={agent}
                selected={isSelected}
                disabled={!isLocal || !onSelectAgent || usedIds.includes(agent.id)}
                usedCards={usedIds}
                onPreviewClick={(data) => onPreview?.(data)}
                onClick={() => {
                  onPreview?.({ agent });
                  if (isLocal && onSelectAgent && !usedIds.includes(agent.id)) {
                    onSelectAgent(agent.id);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Riserva */}
      <div
        className="absolute pointer-events-none"
        style={{ ...zoneCfg.reserveAnchor, zIndex: 3 }}
      >
        <div className="relative" style={{ width: 90, height: 110 }}>
          {Array.from({ length: reserveCount }, (_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: i * 8,
                top: i * 4,
                width: 56,
                height: 80,
                zIndex: i,
              }}
            >
              <CardBack armies={[player.army]} />
            </div>
          ))}
          {reserveCount === 0 && (
            <div
              className="text-[10px] px-1.5 py-1 rounded"
              style={{ color: PALETTE.textSecondary, background: 'rgba(8,6,18,0.7)', border: `1px solid ${PALETTE.slate}` }}
            >
              Riserva vuota
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
