import React, { useEffect, useState } from 'react';
import { getLayeredAltArt } from '../cardFaceLab/cardFaceLabData.js';
import {
  ELDRITCH_CORNICE,
  ELDRITCH_EXPORT_H,
  ELDRITCH_EXPORT_W,
  ELDRITCH_FRAME_H,
  ELDRITCH_FRAME_W,
} from './EldritchCardFace.jsx';
import './eldritchCardFace.css';
import './arcanaCardFace.css';

/** Stesso canvas / slot plancia degli Eldritch (23:33). */
export const ARCANA_EXPORT_W = ELDRITCH_EXPORT_W;
export const ARCANA_EXPORT_H = ELDRITCH_EXPORT_H;
export const ARCANA_FRAME_W = ELDRITCH_FRAME_W;
export const ARCANA_FRAME_H = ELDRITCH_FRAME_H;
export const ARCANA_CORNICE = ELDRITCH_CORNICE;

/**
 * Faccia Arcana — stesso schema Eldritch:
 * - default partita/mano (via AltArtCardFace): **layered** = composition kit + testi live.
 * - `variant="static"`: `composita.webp` bakeata (tile galleria / fallback).
 * - `layered` esplicito: lab / lightbox (+ motion opzionale).
 */
export function ArcanaCardFace({
  agent,
  width = ARCANA_FRAME_W,
  className = '',
  showControls = false,
  motion = false,
  parallaxOnly = false,
  idleMotion = true,
  variant = 'layered',
  backgroundUrl: backgroundOverride,
  subjectUrl: subjectOverride,
  frameUrl: frameOverride,
  layoutUrl: layoutOverride,
  parallax: parallaxOverride,
  /** Override composition (scala/posizione soggetto) — lab. */
  composition: compositionOverride,
  /** Layered: default true. Static ignora. */
  useLiveText = true,
}) {
  const kit = getLayeredAltArt(agent?.id);
  const useLayered =
    variant !== 'static' ||
    Boolean(backgroundOverride || subjectOverride || layoutOverride != null);

  const scale = width / ARCANA_CORNICE.w;
  const bitmapW = ARCANA_EXPORT_W * scale;
  const bitmapH = ARCANA_EXPORT_H * scale;
  const offsetX = -ARCANA_CORNICE.x * scale;
  const offsetY = -ARCANA_CORNICE.y * scale;
  const frameH = Math.round((width * ARCANA_CORNICE.h) / ARCANA_CORNICE.w);

  if (!kit || kit.style !== 'arcana') {
    if (!useLayered) return null;
    if (!backgroundOverride || !subjectOverride) return null;
  }

  // Static = composita bakeata (tile). Altrimenti layered con composition + testi live.
  if (!useLayered) {
    const src = kit.composite || kit.subject;
    return (
      <div
        className={`satze-eldritch-slot satze-arcana-slot ${className}`}
        style={{ width, height: frameH, minWidth: width, flexShrink: 0 }}
      >
        <div
          className="satze-eldritch-static"
          style={{
            width: bitmapW,
            height: bitmapH,
            transform: `translate(${offsetX}px, ${offsetY}px)`,
          }}
        >
          <img src={src} alt={agent?.name || ''} draggable={false} />
        </div>
        <span className="sr-only">{agent?.name}</span>
      </div>
    );
  }

  const preferLive = useLiveText !== false && !layoutOverride;
  const layoutUrl = preferLive
    ? ''
    : layoutOverride || kit?.layoutRaster || '';

  return (
    <ArcanaCardFaceLayered
      kit={kit}
      agent={agent}
      width={width}
      frameH={frameH}
      bitmapW={bitmapW}
      bitmapH={bitmapH}
      offsetX={offsetX}
      offsetY={offsetY}
      className={className}
      showControls={showControls}
      motion={Boolean(motion)}
      parallaxOnly={parallaxOnly}
      idleMotion={idleMotion}
      backgroundUrl={
        backgroundOverride || kit?.backgroundFramed || kit?.background || ''
      }
      subjectUrl={subjectOverride || kit?.subject || ''}
      frameUrl={frameOverride || kit?.frame || ''}
      layoutUrl={layoutUrl}
      parallax={parallaxOverride || kit?.parallax || null}
      composition={compositionOverride || kit?.composition || null}
      useLiveText={preferLive}
    />
  );
}

function ArcanaCardFaceLayered({
  kit,
  agent,
  width,
  frameH,
  bitmapW,
  bitmapH,
  offsetX,
  offsetY,
  className,
  showControls,
  motion,
  parallaxOnly,
  idleMotion,
  backgroundUrl,
  subjectUrl,
  frameUrl,
  layoutUrl,
  parallax,
  composition,
  useLiveText,
}) {
  const [Preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('../cardFaceLab/ArcanaLayeredPreview.jsx').then((mod) => {
      if (!cancelled) setPreview(() => mod.ArcanaLayeredPreview);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!backgroundUrl || !subjectUrl) return null;

  return (
    <div
      className={`satze-eldritch-slot satze-arcana-slot ${className}`}
      style={{ width, height: frameH, minWidth: width, flexShrink: 0 }}
    >
      <div
        className="satze-eldritch-bitmap"
        style={{
          width: bitmapW,
          height: bitmapH,
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        {Preview ? (
          <Preview
            agent={agent}
            kit={kit}
            backgroundUrl={backgroundUrl}
            subjectUrl={subjectUrl}
            frameUrl={frameUrl}
            layoutUrl={layoutUrl}
            useLiveText={useLiveText}
            framedBackground
            composition={composition}
            parallax={parallax}
            showControls={showControls}
            motionDefault={motion}
            parallaxOnly={parallaxOnly}
            idleMotion={idleMotion}
            className="satze-arcana-card-face"
          />
        ) : (
          <div className="satze-eldritch-bitmap__placeholder" aria-hidden />
        )}
      </div>
      <span className="sr-only">{agent?.name}</span>
    </div>
  );
}
