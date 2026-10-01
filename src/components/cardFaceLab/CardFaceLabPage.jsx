// ============================================
// Card Face Lab — Eldritch / Arcana (livelli / motion)
// Accesso: ?cardFaceLab=1  |  menu → STRUMENTI DEV
// Schermo singolo + editor layer overflow
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import {
  ELEMENT_NAMES,
  LAYOUT_RANGES,
  loadCardFaceFonts,
  parseCardFaceJson,
  parseLayoutFile,
  renderCardFace,
  sanitizeLayout,
} from './alfaCardRenderer';
import {
  ALL_FACE_CARDS,
  ARCANA_FACE_PRESETS,
  CARD_FACE_FONT_ASSETS,
  ELDRITCH_FACE_PRESETS,
  ELDRITCH_NAME_UNDER_SUBJECT_CLIP,
  LAYERED_CARD_KITS,
  agentToFaceData,
  buildAssets,
  getArmyChromeUrls,
} from './cardFaceLabData';
import { EldritchLayeredPreview } from './EldritchLayeredPreview';
import { ArcanaLayeredPreview } from './ArcanaLayeredPreview';
import { EldritchCardFace, ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from '../cards/EldritchCardFace';
import { ArcanaCardFace } from '../cards/ArcanaCardFace';
import { normalizeEldritchSvgTo2333 } from './eldritchFormat2333';
import './cardFaceLab.css';

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function basename(name) {
  return (
    String(name || 'carta')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'carta'
  );
}

async function readImageFile(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error('PNG/JPG/WebP entro 20 MB');
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const DEFAULT_CARD_ID = ELDRITCH_FACE_PRESETS[0]?.id ?? ARCANA_FACE_PRESETS[0]?.id ?? 101;

const DEFAULT_ARCANA_PARALLAX = {
  subjectX: 0.45,
  subjectY: 0.27,
  backgroundX: -0.55,
  backgroundY: -0.36,
  tiltX: 3,
  tiltY: 4,
};

function cloneParallax(p) {
  return p && typeof p === 'object' ? { ...DEFAULT_ARCANA_PARALLAX, ...p } : { ...DEFAULT_ARCANA_PARALLAX };
}

/** Opzioni select: kit alt art in cima, poi il resto. */
const LAB_AGENT_OPTIONS = (() => {
  const kitIds = new Set(Object.keys(LAYERED_CARD_KITS).map(Number));
  const withKit = ALL_FACE_CARDS.filter((c) => kitIds.has(c.id));
  const withoutKit = ALL_FACE_CARDS.filter((c) => !kitIds.has(c.id));
  const styleOf = (id) => (LAYERED_CARD_KITS[id]?.style === 'arcana' ? 'Arcana' : 'Eldritch');
  return [
    ...withKit.map((c) => ({
      ...c,
      optionLabel: `${c.id} · ${c.name} · ${styleOf(c.id)}`,
    })),
    ...withoutKit.map((c) => ({
      ...c,
      optionLabel: `${c.id} · ${c.name}`,
    })),
  ];
})();

const BREAK_PARTS = [
  {
    id: 'head',
    label: 'Testa',
    clipKey: 'breakHeadClip',
    maskKey: 'breakHeadMask',
    aboveKey: 'breakHeadAbove',
    defaultClip: ELDRITCH_NAME_UNDER_SUBJECT_CLIP,
  },
  {
    id: 'shoulder',
    label: 'Spalla / SX',
    clipKey: 'breakShoulderClip',
    maskKey: 'breakShoulderMask',
    aboveKey: 'breakShoulderAbove',
    defaultClip: 'polygon(0 31%, 31% 31%, 31% 71%, 0 71%)',
  },
  {
    id: 'right',
    label: 'Destra',
    clipKey: 'breakRightClip',
    maskKey: 'breakRightMask',
    aboveKey: 'breakRightAbove',
    defaultClip: 'polygon(70% 20%, 100% 20%, 100% 80%, 70% 80%)',
  },
  {
    id: 'extra',
    label: 'Extra',
    clipKey: 'breakExtraClip',
    maskKey: 'breakExtraMask',
    aboveKey: 'breakExtraAbove',
    defaultClip: 'polygon(0 50%, 35% 50%, 35% 90%, 0 90%)',
  },
];

const TIER_OPTIONS = [
  {
    id: 'below',
    label: 'Sotto ink',
    hint: 'Sopra cornice, sotto macchie (se macchie = sopra soggetto, l’overflow a sinistra può sparire)',
  },
  { id: 'over-ink', label: 'Sopra ink', hint: 'Sopra macchie, sotto testi — tipico per braccio/magia fuori cornice' },
  { id: 'above', label: 'Sopra tutto', hint: 'Sopra nome / layout' },
];

function tierFromFlag(flag) {
  if (flag === 'ink' || flag === 'over-ink') return 'over-ink';
  if (flag === true || flag === 'type' || flag === 'above') return 'above';
  return 'below';
}

function flagFromTier(tier) {
  if (tier === 'over-ink') return 'ink';
  if (tier === 'above') return true;
  return false;
}

function cloneComposition(comp) {
  return comp && typeof comp === 'object' ? { ...comp } : {};
}

const SIDE_TABS = [
  { id: 'layers', label: 'Layer' },
  { id: 'text', label: 'Testi' },
  { id: 'layout', label: 'Layout' },
  { id: 'io', label: 'I/O' },
];

export function CardFaceLabPage({ onClose }) {
  const [cardId, setCardId] = useState(DEFAULT_CARD_ID);
  const [face, setFace] = useState(() =>
    agentToFaceData(
      ALL_FACE_CARDS.find((c) => c.id === DEFAULT_CARD_ID) || ALL_FACE_CARDS[0],
      'eldritch'
    )
  );
  const [selectedKey, setSelectedKey] = useState('name');
  const [sideTab, setSideTab] = useState('layers');
  const [selectedPart, setSelectedPart] = useState('head');
  const [showInGame, setShowInGame] = useState(false);
  const [compositionDraft, setCompositionDraft] = useState(() =>
    cloneComposition(LAYERED_CARD_KITS[DEFAULT_CARD_ID]?.composition)
  );
  const [parallaxDraft, setParallaxDraft] = useState(() =>
    cloneParallax(LAYERED_CARD_KITS[DEFAULT_CARD_ID]?.parallax)
  );
  const [layerOverrides, setLayerOverrides] = useState({
    subject: null,
    background: null,
    frame: null,
    layout: null,
  });
  const [fontsReady, setFontsReady] = useState(false);
  const [fontError, setFontError] = useState('');
  const [status, setStatus] = useState('');
  const layoutFileRef = useRef(null);
  const layoutRasterFileRef = useRef(null);
  const cardFileRef = useRef(null);
  const subjectFileRef = useRef(null);
  const backgroundFileRef = useRef(null);
  const frameFileRef = useRef(null);

  const agent = useMemo(
    () => ALL_FACE_CARDS.find((c) => c.id === cardId) || ALL_FACE_CARDS[0],
    [cardId]
  );

  const layeredKit = LAYERED_CARD_KITS[cardId] || null;
  const isArcana = layeredKit?.style === 'arcana';
  const kitCompositionRev = layeredKit?.composition?.compositionRev ?? 0;

  // Se il kit aggiorna i break (compositionRev), sovrascrive il draft stale senza chiedere Reset.
  useEffect(() => {
    const kit = LAYERED_CARD_KITS[cardId];
    const kitComp = kit?.composition;
    if (!kitComp) return;
    setCompositionDraft((prev) => {
      if ((prev.compositionRev ?? 0) === (kitComp.compositionRev ?? 0)) return prev;
      return cloneComposition(kitComp);
    });
    if (kit?.style === 'arcana') {
      setParallaxDraft(cloneParallax(kit.parallax));
    }
  }, [cardId, kitCompositionRev]);

  useEffect(() => {
    let cancelled = false;
    loadCardFaceFonts(CARD_FACE_FONT_ASSETS)
      .then(() => {
        if (!cancelled) {
          setFontsReady(true);
          setFontError('');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFontsReady(true);
          setFontError(e?.message || 'Font non caricati');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAgent = useCallback((id) => {
    const next = ALL_FACE_CARDS.find((c) => c.id === id) || ALL_FACE_CARDS[0];
    const kit = LAYERED_CARD_KITS[next.id];
    setCardId(next.id);
    setFace(agentToFaceData(next, 'eldritch'));
    setLayerOverrides({ subject: null, background: null, frame: null, layout: null });
    setCompositionDraft(cloneComposition(kit?.composition));
    setParallaxDraft(cloneParallax(kit?.parallax));
    const styleTag = kit?.style === 'arcana' ? 'Arcana' : kit ? 'Eldritch' : 'no kit';
    setStatus(`Caricata ${next.name} · ${styleTag}`);
  }, []);

  const rendered = useMemo(() => {
    if (!fontsReady || isArcana) return null;
    return renderCardFace(
      face,
      buildAssets(undefined, {
        styleMode: 'eldritch',
        faction: face.faction,
        useArmyChrome: true,
      })
    );
  }, [face, fontsReady, isArcana]);

  const layoutOnlySvg = useMemo(() => {
    if (!fontsReady || isArcana) return '';
    const assets = {
      ...buildAssets(undefined, {
        styleMode: 'eldritch',
        faction: face.faction,
        useArmyChrome: true,
      }),
      layoutOnly: true,
    };
    const raw = renderCardFace(
      { ...face, layoutOnly: true, illustration: undefined },
      assets
    ).svg;
    return normalizeEldritchSvgTo2333(raw, { stretch: true });
  }, [face, fontsReady, isArcana]);

  const subjectUrl = layerOverrides.subject || layeredKit?.subject || '';
  const backgroundUrl =
    layerOverrides.background ||
    layeredKit?.backgroundFramed ||
    layeredKit?.background ||
    '';
  const frameUrl =
    layerOverrides.frame ||
    layeredKit?.frame ||
    (!isArcana ? getArmyChromeUrls(layeredKit?.faction || face.faction)?.frame : '') ||
    '';
  const layoutRasterUrl = layerOverrides.layout || '';
  const useArcanaLiveText = isArcana && !layerOverrides.layout;

  const canCompose = Boolean(subjectUrl && backgroundUrl);
  const studioReady = isArcana ? canCompose : canCompose && fontsReady;
  const selectedConfig = rendered?.layouts?.find((l) => l.key === selectedKey)?.config;
  const activePart = BREAK_PARTS.find((p) => p.id === selectedPart) || BREAK_PARTS[0];

  const patchFace = useCallback((partial) => {
    setFace((prev) => ({ ...prev, ...partial }));
  }, []);

  const patchComposition = useCallback((partial) => {
    setCompositionDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const patchLayoutElement = useCallback(
    (prop, raw) => {
      setFace((prev) => {
        const current = prev.layout?.[selectedKey] || {};
        const nextVal =
          prop === 'autoFit' ? Boolean(raw) : prop === 'color' ? raw : Number(raw);
        if (prop !== 'autoFit' && prop !== 'color' && !Number.isFinite(nextVal)) return prev;
        return {
          ...prev,
          layout: sanitizeLayout({
            ...prev.layout,
            [selectedKey]: { ...current, [prop]: nextVal },
          }),
        };
      });
    },
    [selectedKey]
  );

  const onLayerFile = (key) => async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = await readImageFile(f);
      setLayerOverrides((prev) => ({ ...prev, [key]: url }));
      setStatus(
        key === 'subject'
          ? 'Soggetto caricato'
          : key === 'background'
            ? 'Sfondo caricato'
            : key === 'layout'
              ? 'Layout raster caricato'
              : 'Cornice caricata'
      );
    } catch (err) {
      setStatus(err.message || 'Immagine non leggibile');
    }
  };

  const onLayoutFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const elements = parseLayoutFile(JSON.parse(await f.text()));
      setFace((prev) => ({ ...prev, layout: elements }));
      setStatus(`Layout caricato (${Object.keys(elements).length} elementi)`);
    } catch (err) {
      setStatus(`Layout non valido: ${err.message}`);
    }
  };

  const onCardFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const parsed = parseCardFaceJson(JSON.parse(await f.text()), face);
      setFace(parsed);
      if (Number.isInteger(parsed.id)) setCardId(parsed.id);
      setStatus('JSON carta caricato');
    } catch (err) {
      setStatus(`JSON non valido: ${err.message}`);
    }
  };

  const exportLayout = () => {
    if (!rendered) return;
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            {
              type: 'satze-eldritch-layout',
              version: 1,
              elements: Object.fromEntries(rendered.layouts.map((l) => [l.key, l.config])),
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      ),
      'satze-eldritch-layout.json'
    );
  };

  const exportJson = () => {
    downloadBlob(
      new Blob([JSON.stringify(face, null, 2)], { type: 'application/json' }),
      `${basename(face.name)}-eldritch.json`
    );
  };

  const exportSvg = () => {
    if (!layoutOnlySvg) return;
    downloadBlob(
      new Blob([layoutOnlySvg], { type: 'image/svg+xml' }),
      `${basename(face.name)}-eldritch-layout.svg`
    );
  };

  const exportComposition = () => {
    const payload = isArcana
      ? { style: 'arcana', composition: compositionDraft, parallax: parallaxDraft }
      : compositionDraft;
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `${basename(face.name || layeredKit?.slug)}-composition.json`
    );
    setStatus(
      isArcana
        ? 'Parallax/composition Arcana scaricati — aggiorna arcanaKitFromFolder'
        : 'Composition JSON scaricato — incolla in LAYERED_CARD_KITS'
    );
  };

  const resetComposition = () => {
    setCompositionDraft(cloneComposition(layeredKit?.composition));
    setParallaxDraft(cloneParallax(layeredKit?.parallax));
    setStatus(isArcana ? 'Composition/parallax ripristinati dal kit Arcana' : 'Composition ripristinata dal kit');
  };

  const patchParallax = useCallback((partial) => {
    setParallaxDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const partEnabled = Boolean(compositionDraft[activePart.clipKey]);
  const partTier = tierFromFlag(compositionDraft[activePart.aboveKey]);

  return (
    <ToolPageShell
      title="Card Face Lab"
      subtitle={
        isArcana
          ? 'Arcana · livelli live · soggetto sopra cornice'
          : 'Eldritch · livelli live · overflow soggetto'
      }
      onClose={onClose}
      closeLabel="← Gioco"
      scrollable={false}
      contentClassName="card-face-lab-root"
      headerActions={
        <select
          className="satze-tool-input card-face-lab-agent-select"
          value={cardId}
          onChange={(e) => loadAgent(Number(e.target.value))}
        >
          {LAB_AGENT_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.optionLabel}
            </option>
          ))}
        </select>
      }
    >
      <div className="card-face-lab-screen">
        {/* Preview centrale */}
        <section className="card-face-lab-preview">
          <div className="card-face-lab-preview__toolbar">
            <span className="card-face-lab-stage__label">
              Studio
              {layeredKit
                ? ` · ${layeredKit.slug} · ${isArcana ? 'Arcana' : 'Eldritch'}`
                : ' · no kit'}
              {!isArcana && !fontsReady ? ' · font…' : ''}
            </span>
            <label className="card-face-lab-check">
              <input
                type="checkbox"
                checked={showInGame}
                onChange={(e) => setShowInGame(e.target.checked)}
              />
              In game
            </label>
          </div>
          <div className="card-face-lab-preview__stage">
            {studioReady ? (
              <>
                <div className="card-face-lab-stage__studio">
                  {isArcana ? (
                    <ArcanaLayeredPreview
                      agent={agent}
                      kit={layeredKit}
                      backgroundUrl={backgroundUrl}
                      subjectUrl={subjectUrl}
                      frameUrl={frameUrl}
                      layoutUrl={layoutRasterUrl}
                      useLiveText={useArcanaLiveText}
                      framedBackground
                      composition={compositionDraft}
                      parallax={parallaxDraft}
                      showControls
                      motionDefault
                      idleMotion={false}
                    />
                  ) : (
                    <EldritchLayeredPreview
                      backgroundUrl={backgroundUrl}
                      subjectUrl={subjectUrl}
                      frameUrl={frameUrl}
                      layoutSvg={layoutOnlySvg}
                      composition={compositionDraft}
                      showControls
                      idleMotion={false}
                    />
                  )}
                </div>
                {showInGame && agent ? (
                  <div className="card-face-lab-stage__ingame">
                    <div className="card-face-lab-stage__label">In game</div>
                    {isArcana ? (
                      <ArcanaCardFace
                        agent={agent}
                        width={ELDRITCH_FRAME_W}
                        variant="layered"
                        composition={compositionDraft}
                        parallax={parallaxDraft}
                        motion={false}
                        idleMotion={false}
                      />
                    ) : (
                      <EldritchCardFace
                        agent={agent}
                        width={ELDRITCH_FRAME_W}
                        variant="layered"
                        backgroundUrl={backgroundUrl}
                        subjectUrl={subjectUrl}
                        frameUrl={frameUrl}
                        layoutSvg={layoutOnlySvg}
                        composition={compositionDraft}
                        motion={false}
                        idleMotion={false}
                      />
                    )}
                    <p className="card-face-lab-stage__ingame-meta">
                      {ELDRITCH_FRAME_W}×{ELDRITCH_FRAME_H} · stesso kit del lab
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="satze-tool-panel p-6 text-sm text-[var(--st-muted)] text-center">
                Scegli un agente con cartella livelli, oppure carica soggetto+sfondo in I/O.
              </div>
            )}
          </div>
          {(status || fontError || rendered?.warnings?.length) && (
            <p className="card-face-lab-status">
              {fontError || status || rendered?.warnings?.join(' ')}
            </p>
          )}
        </section>

        {/* Side rail */}
        <aside className="card-face-lab-side">
          <div className="card-face-lab-tabs">
            {SIDE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={
                  sideTab === t.id
                    ? 'card-face-lab-tabs__btn is-active'
                    : 'card-face-lab-tabs__btn'
                }
                onClick={() => setSideTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card-face-lab-side__body satze-tool-panel">
            {sideTab === 'layers' && (
              <div className="card-face-lab-layers space-y-3">
                {isArcana ? (
                  <>
                    <p className="text-[11px] text-[var(--st-muted)] leading-snug">
                      Arcana: scala/posizione soggetto (come Eldritch), poi ampiezze parallasse.
                      Export aggiorna `composition` + `parallax` nel kit.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['subjectScale', 'Scale', 0.7, 1.4, 0.01],
                        ['subjectXPercent', 'X%', -30, 30, 0.5],
                        ['subjectYPercent', 'Y%', -30, 30, 0.5],
                      ].map(([key, label, min, max, step]) => (
                        <label key={key} className="block text-[10px] text-[var(--st-muted)]">
                          {label}
                          <input
                            type="number"
                            step={step}
                            min={min}
                            max={max}
                            className="satze-tool-input mt-1"
                            value={compositionDraft[key] ?? ''}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n)) return;
                              patchComposition({ [key]: n });
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--st-border)]">
                      {[
                        ['subjectX', 'Parallax sog. X', -2, 2, 0.05],
                        ['subjectY', 'Parallax sog. Y', -2, 2, 0.05],
                        ['backgroundX', 'Parallax bg X', -2, 2, 0.05],
                        ['backgroundY', 'Parallax bg Y', -2, 2, 0.05],
                        ['tiltX', 'Tilt X°', 0, 8, 0.5],
                        ['tiltY', 'Tilt Y°', 0, 8, 0.5],
                      ].map(([key, label, min, max, step]) => (
                        <label key={key} className="block text-[10px] text-[var(--st-muted)]">
                          {label}
                          <input
                            type="number"
                            step={step}
                            min={min}
                            max={max}
                            className="satze-tool-input mt-1"
                            value={parallaxDraft[key] ?? ''}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isFinite(n)) return;
                              patchParallax({ [key]: n });
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="satze-tool-btn-secondary text-xs"
                        onClick={resetComposition}
                      >
                        Reset kit
                      </button>
                      <button
                        type="button"
                        className="satze-tool-btn-secondary text-xs"
                        onClick={exportComposition}
                      >
                        Export composition
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                <p className="text-[11px] text-[var(--st-muted)] leading-snug">
                  Controlla quali parti del soggetto passano sopra/sotto cornice, macchie e testi.
                </p>

                <div className="card-face-lab-ink-toggle">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--st-muted)]">
                    Macchie nere
                  </span>
                  <div className="card-face-lab-tiers" role="group" aria-label="Macchie vs soggetto">
                    <button
                      type="button"
                      className={
                        compositionDraft.nameInkUnderSubject &&
                        compositionDraft.inkAboveSubject !== false
                          ? 'card-face-lab-tiers__btn is-active'
                          : 'card-face-lab-tiers__btn'
                      }
                      title="Solo macchia nome sotto corona/scettro; potere/bonus/stats sopra"
                      onClick={() =>
                        patchComposition({
                          nameInkUnderSubject: true,
                          inkAboveSubject: true,
                        })
                      }
                    >
                      Solo nome sotto
                    </button>
                    <button
                      type="button"
                      className={
                        !compositionDraft.nameInkUnderSubject &&
                        compositionDraft.inkAboveSubject !== false
                          ? 'card-face-lab-tiers__btn is-active'
                          : 'card-face-lab-tiers__btn'
                      }
                      title="Tutte le macchie sopra il soggetto (default)"
                      onClick={() =>
                        patchComposition({
                          nameInkUnderSubject: false,
                          inkAboveSubject: true,
                        })
                      }
                    >
                      Tutte sopra
                    </button>
                    <button
                      type="button"
                      className={
                        compositionDraft.inkAboveSubject === false
                          ? 'card-face-lab-tiers__btn is-active'
                          : 'card-face-lab-tiers__btn'
                      }
                      title="Tutte le macchie sotto il soggetto"
                      onClick={() =>
                        patchComposition({
                          nameInkUnderSubject: false,
                          inkAboveSubject: false,
                        })
                      }
                    >
                      Tutte sotto
                    </button>
                  </div>
                </div>

                <div className="card-face-lab-parts">
                  {BREAK_PARTS.map((part) => {
                    const on = Boolean(compositionDraft[part.clipKey]);
                    const tier = tierFromFlag(compositionDraft[part.aboveKey]);
                    return (
                      <button
                        key={part.id}
                        type="button"
                        className={
                          selectedPart === part.id
                            ? 'card-face-lab-part is-active'
                            : 'card-face-lab-part'
                        }
                        onClick={() => setSelectedPart(part.id)}
                      >
                        <span className="card-face-lab-part__name">{part.label}</span>
                        <span className="card-face-lab-part__meta">
                          {on ? TIER_OPTIONS.find((t) => t.id === tier)?.label : 'off'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="card-face-lab-part-edit space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-[var(--st-text)]">{activePart.label}</strong>
                    <label className="card-face-lab-check">
                      <input
                        type="checkbox"
                        checked={partEnabled}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const kitAbove = layeredKit?.composition?.[activePart.aboveKey];
                            patchComposition({
                              [activePart.clipKey]:
                                compositionDraft[activePart.clipKey] ||
                                layeredKit?.composition?.[activePart.clipKey] ||
                                activePart.defaultClip,
                              // Default: sopra ink (visibile fuori cornice anche con macchie sopra).
                              [activePart.aboveKey]:
                                compositionDraft[activePart.aboveKey] ??
                                (kitAbove != null ? kitAbove : 'ink'),
                            });
                          } else {
                            patchComposition({
                              [activePart.clipKey]: null,
                              [activePart.maskKey]: null,
                              [activePart.aboveKey]: false,
                            });
                          }
                        }}
                      />
                      Attivo
                    </label>
                  </div>

                  <div className="card-face-lab-tiers" role="group" aria-label="Tier z-order">
                    {TIER_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!partEnabled}
                        title={t.hint}
                        className={
                          partTier === t.id
                            ? 'card-face-lab-tiers__btn is-active'
                            : 'card-face-lab-tiers__btn'
                        }
                        onClick={() =>
                          patchComposition({ [activePart.aboveKey]: flagFromTier(t.id) })
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {partEnabled &&
                  partTier === 'below' &&
                  compositionDraft.inkAboveSubject !== false &&
                  !compositionDraft.nameInkUnderSubject ? (
                    <p className="m-0 text-[10px] leading-snug text-amber-200/90">
                      Con macchie sopra il soggetto, «Sotto ink» nasconde l’overflow dove c’è la
                      macchia. Usa «Sopra ink» oppure «Solo nome sotto» per braccio/magia fuori
                      cornice.
                    </p>
                  ) : null}

                  <label className="block text-[10px] text-[var(--st-muted)]">
                    clip-path
                    <textarea
                      className="satze-tool-input mt-1 font-mono text-[11px] min-h-[64px]"
                      disabled={!partEnabled}
                      value={compositionDraft[activePart.clipKey] || ''}
                      placeholder="polygon(...) oppure inset(0)"
                      onChange={(e) =>
                        patchComposition({
                          [activePart.clipKey]: e.target.value.trim() || null,
                        })
                      }
                    />
                  </label>

                  <label className="block text-[10px] text-[var(--st-muted)]">
                    mask (opz.)
                    <textarea
                      className="satze-tool-input mt-1 font-mono text-[11px] min-h-[48px]"
                      disabled={!partEnabled}
                      value={compositionDraft[activePart.maskKey] || ''}
                      placeholder="linear-gradient(...)"
                      onChange={(e) =>
                        patchComposition({
                          [activePart.maskKey]: e.target.value.trim() || null,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--st-border)]">
                  {[
                    ['subjectScale', 'Scale', 0.7, 1.4, 0.01],
                    ['subjectXPercent', 'X%', -20, 20, 0.5],
                    ['subjectYPercent', 'Y%', -20, 20, 0.5],
                  ].map(([key, label, min, max, step]) => (
                    <label key={key} className="block text-[10px] text-[var(--st-muted)]">
                      {label}
                      <input
                        type="number"
                        step={step}
                        min={min}
                        max={max}
                        className="satze-tool-input mt-1"
                        value={compositionDraft[key] ?? ''}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) return;
                          patchComposition({ [key]: n });
                        }}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={resetComposition}
                  >
                    Reset kit
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={exportComposition}
                  >
                    Export composition
                  </button>
                </div>
                  </>
                )}
              </div>
            )}

            {sideTab === 'text' && (
              <div className="space-y-2">
                {isArcana ? (
                  <p className="m-0 text-[11px] text-[var(--st-muted)] leading-snug">
                    I testi Arcana sono nel layout raster del kit. Usa l’editor offline
                    `Leggero-Richiamato-Anteprima.html` per spostarli/ricolorarli.
                  </p>
                ) : (
                  <>
                {[
                  ['name', 'Nome'],
                  ['faction', 'Fazione'],
                ].map(([key, label]) => (
                  <label key={key} className="block text-xs text-[var(--st-muted)]">
                    {label}
                    <input
                      className="satze-tool-input mt-1"
                      value={face[key] ?? ''}
                      onChange={(e) => patchFace({ [key]: e.target.value })}
                    />
                  </label>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  {['league', 'power', 'damage'].map((key) => (
                    <label key={key} className="block text-xs text-[var(--st-muted)]">
                      {key}
                      <input
                        type="number"
                        className="satze-tool-input mt-1"
                        value={face[key] ?? 0}
                        onChange={(e) => patchFace({ [key]: Number(e.target.value) })}
                      />
                    </label>
                  ))}
                </div>
                {['ability', 'bonus'].map((block) => (
                  <div key={block} className="space-y-1 pt-2 border-t border-[var(--st-border)]">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--st-muted)]">
                      {block}
                    </div>
                    <input
                      className="satze-tool-input"
                      value={face[block]?.title ?? ''}
                      onChange={(e) =>
                        patchFace({ [block]: { ...face[block], title: e.target.value } })
                      }
                      placeholder="Titolo"
                    />
                    <textarea
                      className="satze-tool-input min-h-[56px]"
                      value={face[block]?.text ?? ''}
                      onChange={(e) =>
                        patchFace({ [block]: { ...face[block], text: e.target.value } })
                      }
                      placeholder="Testo"
                    />
                  </div>
                ))}
                  </>
                )}
              </div>
            )}

            {sideTab === 'layout' && (
              <div className="space-y-2">
                {isArcana ? (
                  <p className="m-0 text-[11px] text-[var(--st-muted)] leading-snug">
                    Layered Arcana: testi live (`arcanaLiveText`, regole tipografiche). Carica un
                    Layout PNG da I/O per forzare il raster al posto del live.
                  </p>
                ) : (
                  <>
                <select
                  className="satze-tool-input"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  {Object.entries(ELEMENT_NAMES).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                {selectedConfig && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(LAYOUT_RANGES).map((prop) => (
                      <label key={prop} className="block text-[10px] text-[var(--st-muted)]">
                        {prop}
                        <input
                          type="number"
                          step={
                            prop === 'scaleX' ||
                            prop === 'lineHeight' ||
                            prop === 'rotation' ||
                            prop === 'slant'
                              ? 0.01
                              : 1
                          }
                          className="satze-tool-input mt-1"
                          value={selectedConfig[prop] ?? ''}
                          onChange={(e) => patchLayoutElement(prop, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() =>
                      setFace((prev) => {
                        const next = { ...prev.layout };
                        delete next[selectedKey];
                        return { ...prev, layout: next };
                      })
                    }
                  >
                    Reset elemento
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => setFace((prev) => ({ ...prev, layout: {} }))}
                  >
                    Reset layout
                  </button>
                </div>
                  </>
                )}
              </div>
            )}

            {sideTab === 'io' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => subjectFileRef.current?.click()}
                  >
                    Soggetto
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => backgroundFileRef.current?.click()}
                  >
                    Sfondo
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => frameFileRef.current?.click()}
                  >
                    Cornice
                  </button>
                  {isArcana ? (
                    <button
                      type="button"
                      className="satze-tool-btn-secondary text-xs"
                      onClick={() => layoutRasterFileRef.current?.click()}
                    >
                      Layout PNG
                    </button>
                  ) : null}
                </div>
                {(layerOverrides.subject ||
                  layerOverrides.background ||
                  layerOverrides.frame ||
                  layerOverrides.layout) && (
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() =>
                      setLayerOverrides({
                        subject: null,
                        background: null,
                        frame: null,
                        layout: null,
                      })
                    }
                  >
                    Togli override
                  </button>
                )}
                {!isArcana ? (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--st-border)]">
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => layoutFileRef.current?.click()}
                  >
                    Import layout
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={() => cardFileRef.current?.click()}
                  >
                    Import carta
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={exportSvg}
                  >
                    SVG
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={exportJson}
                  >
                    JSON carta
                  </button>
                  <button
                    type="button"
                    className="satze-tool-btn-secondary text-xs"
                    onClick={exportLayout}
                  >
                    JSON layout
                  </button>
                </div>
                ) : (
                  <p className="m-0 text-[10px] text-[var(--st-muted)] leading-snug pt-2 border-t border-[var(--st-border)]">
                    Arcana usa layout raster del kit. Testi editabili restano nell’editor offline
                    del kit (`Anteprima.html`).
                  </p>
                )}
                <button
                  type="button"
                  className="satze-tool-btn-secondary text-xs w-full"
                  onClick={() => loadAgent(cardId)}
                >
                  Ricarica dati gioco
                </button>
                <input
                  ref={subjectFileRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onLayerFile('subject')}
                />
                <input
                  ref={backgroundFileRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onLayerFile('background')}
                />
                <input
                  ref={frameFileRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onLayerFile('frame')}
                />
                <input
                  ref={layoutRasterFileRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onLayerFile('layout')}
                />
                <input
                  ref={layoutFileRef}
                  hidden
                  type="file"
                  accept="application/json,.json"
                  onChange={onLayoutFile}
                />
                <input
                  ref={cardFileRef}
                  hidden
                  type="file"
                  accept="application/json,.json"
                  onChange={onCardFile}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </ToolPageShell>
  );
}

export default CardFaceLabPage;
