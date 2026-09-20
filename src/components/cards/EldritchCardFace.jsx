import React, { useEffect, useMemo, useState } from 'react';
import {
  CARD_FACE_FONT_ASSETS,
  agentToFaceData,
  buildAssets,
  getArmyChromeUrls,
  getLayeredAltArt,
} from '../cardFaceLab/cardFaceLabData.js';
import { normalizeEldritchSvgTo2333 } from '../cardFaceLab/eldritchFormat2333.js';
import './eldritchCardFace.css';

/** Artwork livelli (PNG/WebP artistici). */
export const ELDRITCH_ART_W = 1024;
export const ELDRITCH_ART_H = 1536;

/** Export / composita — carta intera 23:33. */
export const ELDRITCH_EXPORT_W = 1104;
export const ELDRITCH_EXPORT_H = 1584;

/** @deprecated Alias art canvas. */
export const ELDRITCH_CANVAS_W = ELDRITCH_EXPORT_W;
export const ELDRITCH_CANVAS_H = ELDRITCH_EXPORT_H;

/**
 * Cornice interna sul canvas export (stessi % delle anteprime: inset 3.3/4.5/3.5/4.5).
 * I 230px di plancia = larghezza di QUESTO rettangolo, non del bordo esterno carta.
 */
export const ELDRITCH_CORNICE = {
  x: Math.round(ELDRITCH_EXPORT_W * 0.045),
  y: Math.round(ELDRITCH_EXPORT_H * 0.033),
  w: Math.round(ELDRITCH_EXPORT_W * (1 - 0.045 - 0.045)),
  h: Math.round(ELDRITCH_EXPORT_H * (1 - 0.033 - 0.035)),
};

/** Larghezza cornice in plancia = stessa della P4. */
export const ELDRITCH_FRAME_W = 230;
export const ELDRITCH_FRAME_H = Math.round(
  (ELDRITCH_FRAME_W * ELDRITCH_CORNICE.h) / ELDRITCH_CORNICE.w
);

/** @deprecated Usare ELDRITCH_FRAME_W / ELDRITCH_FRAME_H. */
export const ELDRITCH_GAME_W = ELDRITCH_FRAME_W;
export const ELDRITCH_GAME_H = ELDRITCH_FRAME_H;
export const ELDRITCH_IN_P4_SLOT_W = ELDRITCH_FRAME_W;

/**
 * Faccia Eldritch.
 * - default / partita: `composita.webp`, slot = cornice interna 230×H.
 * - `layered`: lab / lightbox (livelli + SVG live).
 *
 * `width` = larghezza CORNICE in px (default 230).
 */
export function EldritchCardFace({
  agent,
  width = ELDRITCH_FRAME_W,
  className = '',
  showControls = false,
  motion = false,
  parallaxOnly = false,
  idleMotion = true,
  variant = 'static',
  backgroundUrl: backgroundOverride,
  subjectUrl: subjectOverride,
  frameUrl: frameOverride,
  layoutSvg: layoutOverride,
  composition: compositionOverride,
}) {
  const kit = getLayeredAltArt(agent?.id);
  const useLayered =
    variant === 'layered' ||
    Boolean(backgroundOverride || subjectOverride || layoutOverride != null);

  const scale = width / ELDRITCH_CORNICE.w;
  const bitmapW = ELDRITCH_EXPORT_W * scale;
  const bitmapH = ELDRITCH_EXPORT_H * scale;
  const offsetX = -ELDRITCH_CORNICE.x * scale;
  const offsetY = -ELDRITCH_CORNICE.y * scale;
  const frameH = Math.round((width * ELDRITCH_CORNICE.h) / ELDRITCH_CORNICE.w);

  if (!kit && !useLayered) return null;

  if (!useLayered) {
    const src = kit.composite || kit.subject;
    return (
      <div
        className={`satze-eldritch-slot ${className}`}
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
      </div>
    );
  }

  return (
    <EldritchCardFaceLayered
      agent={agent}
      kit={kit}
      width={width}
      frameH={frameH}
      bitmapW={bitmapW}
      bitmapH={bitmapH}
      offsetX={offsetX}
      offsetY={offsetY}
      className={className}
      showControls={showControls}
      motion={motion}
      parallaxOnly={parallaxOnly}
      idleMotion={idleMotion}
      backgroundOverride={backgroundOverride}
      subjectOverride={subjectOverride}
      frameOverride={frameOverride}
      layoutOverride={layoutOverride}
      compositionOverride={compositionOverride}
    />
  );
}

function EldritchCardFaceLayered({
  agent,
  kit,
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
  backgroundOverride,
  subjectOverride,
  frameOverride,
  layoutOverride,
  compositionOverride,
}) {
  const [Preview, setPreview] = useState(null);
  const [fontsReady, setFontsReady] = useState(layoutOverride != null);
  const [renderApi, setRenderApi] = useState(null);

  const backgroundUrl = backgroundOverride || kit?.background || '';
  const subjectUrl = subjectOverride || kit?.subject || '';
  const canShow = Boolean(backgroundUrl && subjectUrl);

  useEffect(() => {
    let cancelled = false;
    import('../cardFaceLab/EldritchLayeredPreview.jsx').then((prevMod) => {
      if (!cancelled) setPreview(() => prevMod.EldritchLayeredPreview);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (layoutOverride != null) {
      setFontsReady(true);
      return undefined;
    }
    let cancelled = false;
    import('../cardFaceLab/alfaCardRenderer.js').then((renderMod) => {
      if (cancelled) return;
      setRenderApi({
        loadCardFaceFonts: renderMod.loadCardFaceFonts,
        renderCardFace: renderMod.renderCardFace,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [layoutOverride]);

  useEffect(() => {
    if (!renderApi || layoutOverride != null) return undefined;
    let cancelled = false;
    renderApi
      .loadCardFaceFonts(CARD_FACE_FONT_ASSETS)
      .then(() => {
        if (!cancelled) setFontsReady(true);
      })
      .catch(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [renderApi, layoutOverride]);

  const face = useMemo(
    () => (agent ? agentToFaceData(agent, 'eldritch') : null),
    [
      agent,
      agent?.id,
      agent?.power,
      agent?.damage,
      agent?.league,
      agent?.name,
      agent?.army,
      agent?.description,
    ]
  );

  const layoutSvg = useMemo(() => {
    if (layoutOverride != null) return normalizeEldritchSvgTo2333(layoutOverride, { stretch: true });
    if (!fontsReady || !face || !renderApi) return '';
    const faction = kit?.faction || face.faction;
    const assets = {
      ...buildAssets(undefined, {
        styleMode: 'eldritch',
        faction,
        useArmyChrome: true,
      }),
      layoutOnly: true,
    };
    const raw = renderApi.renderCardFace(
      { ...face, layoutOnly: true, illustration: undefined },
      assets
    ).svg;
    return normalizeEldritchSvgTo2333(raw, { stretch: true });
  }, [layoutOverride, face, fontsReady, kit, renderApi]);

  if (!canShow) return null;

  const frameUrl =
    frameOverride ||
    kit?.frame ||
    getArmyChromeUrls(kit?.faction || face?.faction)?.frame ||
    '';

  const composition = compositionOverride || kit?.composition || null;
  const ready = Boolean(Preview && fontsReady);

  return (
    <div
      className={`satze-eldritch-slot ${className}`}
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
        {ready ? (
          <Preview
            backgroundUrl={backgroundUrl}
            subjectUrl={subjectUrl}
            frameUrl={frameUrl}
            layoutSvg={layoutSvg}
            composition={composition}
            showControls={showControls}
            motionDefault={motion}
            parallaxOnly={parallaxOnly}
            idleMotion={idleMotion}
            className="satze-eldritch-card-face"
          />
        ) : (
          <div className="satze-eldritch-bitmap__placeholder" aria-hidden />
        )}
      </div>
    </div>
  );
}
