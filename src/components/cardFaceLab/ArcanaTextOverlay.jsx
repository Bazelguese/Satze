import React, { useEffect, useMemo, useState } from 'react';
import { ARCANA_ART_SCALE, ARCANA_ART_X } from './arcanaGeometry.js';
import {
  ARCANA_DISPLAY_FONT_FAMILY,
  buildArcanaLiveTexts,
  fitArcanaFontSize,
  fitArcanaNameToBox,
  loadArcanaCardFont,
} from './arcanaLiveText.js';

/**
 * Tipografia Arcana live — Lora Semibold.
 * Nome: riempie il cartiglio (auto-size). Virgola → sottotitolo. Niente curva.
 */
export function ArcanaTextOverlay({ agent, kit = null, className = '' }) {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadArcanaCardFont().finally(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const model = useMemo(() => buildArcanaLiveTexts(agent, kit), [
    agent,
    agent?.id,
    agent?.name,
    agent?.league,
    agent?.power,
    agent?.damage,
    agent?.army,
    agent?.description,
    agent?.ability,
    kit,
  ]);

  if (!agent && !kit) return null;

  return (
    <svg
      className={`arcana-layered__layout-svg ${className}`}
      viewBox="0 0 1104 1584"
      width="100%"
      height="100%"
      aria-hidden
      overflow="visible"
    >
      <g transform={`translate(${ARCANA_ART_X} 0) scale(${ARCANA_ART_SCALE})`} overflow="visible">
        {model.items.map((item) => {
          const family = item.font || ARCANA_DISPLAY_FONT_FAMILY;
          const weight = item.weight ?? 600;
          const isSeal =
            item.key === 'league' || item.key === 'power' || item.key === 'damage';
          const isName = item.key === 'name';
          const nameTracking = 0.03;
          const stroke =
            isSeal || isName
              ? {
                  stroke: isSeal && item.key === 'league' ? '#1a1410' : '#fff6e0',
                  strokeWidth: isSeal ? 5 : 3,
                  paintOrder: 'stroke fill',
                  strokeLinejoin: 'round',
                }
              : null;

          let fontSize = item.size;
          let lineHeight = item.lineHeight || item.size;
          let startY = item.y;

          if (fontsReady) {
            if (isName && item.fillBox) {
              const fitted = fitArcanaNameToBox(
                item.lines,
                item.w,
                item.h || 130,
                family,
                weight,
                nameTracking,
                item.lineHeightRatio || 1.06
              );
              fontSize = fitted.size;
              lineHeight = fitted.lineHeight;
              const blockH = item.lines.length * lineHeight;
              const boxY = item.boxY ?? 78;
              const boxH = item.h || 130;
              startY = boxY + (boxH - blockH) / 2 + lineHeight / 2;
            } else if (!isSeal) {
              // Sigilli: size fissa (niente auto-fit — le cifre hanno larghezze diverse).
              fontSize = fitArcanaFontSize(
                item.lines,
                item.size,
                item.w,
                family,
                weight
              );
              lineHeight = item.lineHeight || fontSize;
              startY = item.y;
            }
          }

          return (
            <g
              key={item.key}
              fill={item.fill}
              textAnchor="middle"
              style={{
                fontFamily: `${family}, Lora, Georgia, serif`,
                fontWeight: weight,
                letterSpacing: isName
                  ? `${nameTracking}em`
                  : isSeal
                    ? '0.02em'
                    : '0.01em',
              }}
            >
              {item.lines.map((line, i) => (
                <text
                  key={`${item.key}-${i}`}
                  x={item.x}
                  y={startY + i * lineHeight}
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  {...(stroke || {})}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
