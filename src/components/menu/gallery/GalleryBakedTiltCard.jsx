import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CardReworkP4 } from '../../cards/CardReworkP4.jsx';
import { CardPointerTilt } from '../../cards/CardPointerTilt.jsx';
import {
  bakeDomNodeToObjectUrl,
  getBakedCardUrl,
  rememberBakedCardUrl,
} from '../../../utils/bakeDomToImage.js';

/**
 * Lightbox P4: prima volta render DOM + bake in cache sessione;
 * dopo tilt su bitmap (una sola texture) invece che sull'albero carta.
 */
export function GalleryBakedTiltCard({
  agent,
  accent,
  width,
  height,
  nativeW = 230,
  nativeH = 330,
  scale = 1,
  maxTilt = 16,
  hitPadX = 0,
  hitPadY = 0,
  className = '',
}) {
  const bakeKey = `p4:${agent.id}`;
  const cached = getBakedCardUrl(bakeKey, nativeW, nativeH);
  const [bakedUrl, setBakedUrl] = useState(cached);
  const [bakeFailed, setBakeFailed] = useState(false);
  const stageRef = useRef(null);
  const bakingRef = useRef(false);

  useLayoutEffect(() => {
    setBakedUrl(getBakedCardUrl(bakeKey, nativeW, nativeH));
    setBakeFailed(false);
  }, [bakeKey, nativeW, nativeH]);

  useEffect(() => {
    if (bakedUrl || bakeFailed || bakingRef.current) return undefined;
    const node = stageRef.current;
    if (!node) return undefined;

    let cancelled = false;
    bakingRef.current = true;

    const run = async () => {
      try {
        // Lascia decodificare arte / layout un frame.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled) return;
        const url = await bakeDomNodeToObjectUrl(node, {
          width: nativeW,
          height: nativeH,
          pixelRatio: 2,
          minimalCss: true,
        });
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        rememberBakedCardUrl(bakeKey, nativeW, nativeH, url);
        setBakedUrl(url);
      } catch (err) {
        console.warn('[gallery] bake carta fallito, resto su DOM live', err);
        if (!cancelled) setBakeFailed(true);
      } finally {
        bakingRef.current = false;
      }
    };

    const idleId =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback(() => {
            run();
          }, { timeout: 400 })
        : setTimeout(run, 50);

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === 'function' && typeof idleId === 'number') {
        cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
  }, [agent.id, bakedUrl, bakeFailed, bakeKey, nativeW, nativeH]);

  const useBitmap = Boolean(bakedUrl) && !bakeFailed;

  return (
    <CardPointerTilt
      shineAccent={accent}
      maxTilt={maxTilt}
      className={className}
      style={{ width, height }}
      hitPadX={hitPadX}
      hitPadY={hitPadY}
    >
      {useBitmap ? (
        <img
          src={bakedUrl}
          alt={agent.name}
          width={width}
          height={height}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            display: 'block',
            borderRadius: '0 0 14px 14px',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          className="cgl-lb-card-scale"
          style={{
            width: nativeW,
            height: nativeH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div ref={stageRef}>
            <CardReworkP4 agent={agent} showBonus suppressAnimations />
          </div>
        </div>
      )}
    </CardPointerTilt>
  );
}
