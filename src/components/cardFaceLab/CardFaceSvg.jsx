import React, { useMemo } from 'react';
import { CARD_FACE_H, CARD_FACE_W } from './alfaCardRenderer';

/**
 * Anteprima SVG faccia Alfa/Eldritch.
 * @param {{ svg: string, showGuides?: boolean, layouts?: Array<{ box: {x:number,y:number,w:number,h:number}, key: string }>, selectedKey?: string, className?: string, style?: React.CSSProperties }} props
 */
export function CardFaceSvg({
  svg,
  showGuides = false,
  layouts = [],
  selectedKey = null,
  className = '',
  style,
}) {
  const html = useMemo(() => {
    if (!svg) return '';
    if (!showGuides || !layouts.length) return svg;
    const guides = layouts
      .map((l) => {
        const sel = l.key === selectedKey;
        return `<rect x="${l.box.x}" y="${l.box.y}" width="${l.box.w}" height="${l.box.h}" fill="${sel ? '#22ddeb22' : '#22ddeb12'}" stroke="${sel ? '#e9d62e' : '#22ddeb'}" stroke-width="2" stroke-dasharray="10 8" data-guide="${l.key}"/>`;
      })
      .join('');
    return svg.replace('</svg>', `<g id="guides" pointer-events="none">${guides}</g></svg>`);
  }, [svg, showGuides, layouts, selectedKey]);

  return (
    <div
      className={`card-face-svg ${className}`}
      style={{
        width: '100%',
        maxWidth: 470,
        aspectRatio: `${CARD_FACE_W} / ${CARD_FACE_H}`,
        filter: 'drop-shadow(0 18px 32px #0007)',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
