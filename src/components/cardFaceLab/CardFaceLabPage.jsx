// ============================================
// Card Face Lab — Eldritch (livelli / motion)
// Accesso: ?cardFaceLab=1  |  menu → STRUMENTI DEV
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
  CARD_FACE_FONT_ASSETS,
  ELDRITCH_FACE_PRESETS,
  LAYERED_CARD_KITS,
  agentToFaceData,
  buildAssets,
  getArmyChromeUrls,
} from './cardFaceLabData';
import { EldritchLayeredPreview } from './EldritchLayeredPreview';
import { EldritchCardFace, ELDRITCH_FRAME_W, ELDRITCH_FRAME_H } from '../cards/EldritchCardFace';
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

const DEFAULT_CARD_ID = ELDRITCH_FACE_PRESETS[0]?.id ?? 101;

export function CardFaceLabPage({ onClose }) {
  const [cardId, setCardId] = useState(DEFAULT_CARD_ID);
  const [face, setFace] = useState(() =>
    agentToFaceData(
      ALL_FACE_CARDS.find((c) => c.id === DEFAULT_CARD_ID) || ALL_FACE_CARDS[0],
      'eldritch'
    )
  );
  const [selectedKey, setSelectedKey] = useState('name');
  /** Override locali: soggetto / sfondo / cornice caricati nel lab. */
  const [layerOverrides, setLayerOverrides] = useState({
    subject: null,
    background: null,
    frame: null,
  });
  const [fontsReady, setFontsReady] = useState(false);
  const [fontError, setFontError] = useState('');
  const [status, setStatus] = useState('');
  const layoutFileRef = useRef(null);
  const cardFileRef = useRef(null);
  const subjectFileRef = useRef(null);
  const backgroundFileRef = useRef(null);
  const frameFileRef = useRef(null);

  const agent = useMemo(
    () => ALL_FACE_CARDS.find((c) => c.id === cardId) || ALL_FACE_CARDS[0],
    [cardId]
  );

  const layeredKit = LAYERED_CARD_KITS[cardId] || null;

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
    setCardId(next.id);
    setFace(agentToFaceData(next, 'eldritch'));
    setLayerOverrides({ subject: null, background: null, frame: null });
    setStatus(`Caricata ${next.name}`);
  }, []);

  const rendered = useMemo(() => {
    if (!fontsReady) return null;
    return renderCardFace(
      face,
      buildAssets(undefined, {
        styleMode: 'eldritch',
        faction: face.faction,
        useArmyChrome: true,
      })
    );
  }, [face, fontsReady]);

  const layoutOnlySvg = useMemo(() => {
    if (!fontsReady) return '';
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
  }, [face, fontsReady]);

  const subjectUrl = layerOverrides.subject || layeredKit?.subject || '';
  const backgroundUrl = layerOverrides.background || layeredKit?.background || '';
  const frameUrl =
    layerOverrides.frame ||
    layeredKit?.frame ||
    getArmyChromeUrls(layeredKit?.faction || face.faction)?.frame ||
    '';

  const canCompose = Boolean(subjectUrl && backgroundUrl);

  const selectedConfig = rendered?.layouts?.find((l) => l.key === selectedKey)?.config;

  const patchFace = useCallback((partial) => {
    setFace((prev) => ({ ...prev, ...partial }));
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

  return (
    <ToolPageShell
      title="Card Face Lab"
      subtitle="Eldritch = cartella livelli (soggetto+sfondo) + layout Eldritch. Path: public/card-images/eldritch/layers/<slug>/."
      onClose={onClose}
      closeLabel="← Gioco"
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-3">
          <div className="satze-tool-panel p-5 space-y-4">
            <h2 className="text-lg font-bold text-[var(--st-text)]">Agente</h2>
            <div className="flex flex-wrap gap-2">
              {ELDRITCH_FACE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    cardId === p.id ? 'satze-tool-btn-primary text-sm' : 'satze-tool-btn-secondary text-sm'
                  }
                  onClick={() => loadAgent(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <select
              className="satze-tool-input"
              value={cardId}
              onChange={(e) => loadAgent(Number(e.target.value))}
            >
              {ALL_FACE_CARDS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} · {c.name} ({c.army})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="satze-tool-btn-secondary text-sm w-full"
              onClick={() => loadAgent(cardId)}
            >
              Ricarica dati gioco
            </button>
          </div>

          <div className="satze-tool-panel p-5 space-y-3">
            <h2 className="text-lg font-bold text-[var(--st-text)]">Livelli</h2>
            <p className="text-xs text-[var(--st-muted)] leading-relaxed">
              Source of truth: cartella{' '}
              <code className="text-[var(--st-text)]">
                public/card-images/eldritch/layers/&lt;slug&gt;/
              </code>{' '}
              con <code className="text-[var(--st-text)]">soggetto.webp</code> +{' '}
              <code className="text-[var(--st-text)]">sfondo.webp</code> (art 1024×1536 → slot 23:33), poi registra in{' '}
              <code className="text-[var(--st-text)]">LAYERED_CARD_KITS</code>. Vedi{' '}
              <code className="text-[var(--st-text)]">layers/LEGGIMI.md</code>.
            </p>
            {layeredKit ? (
              <p className="text-[11px] text-[var(--st-muted)]">
                Cartella attiva:{' '}
                <code className="text-[var(--st-text)]">layers/{layeredKit.slug}/</code>
              </p>
            ) : (
              <p className="text-[11px] text-amber-200/90">
                Questo agente non ha ancora una cartella livelli. Creala come le altre, oppure usa
                gli upload sotto solo per una prova rapida.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="satze-tool-btn-secondary text-sm"
                onClick={() => subjectFileRef.current?.click()}
              >
                Prova soggetto
              </button>
              <button
                type="button"
                className="satze-tool-btn-secondary text-sm"
                onClick={() => backgroundFileRef.current?.click()}
              >
                Prova sfondo
              </button>
              <button
                type="button"
                className="satze-tool-btn-secondary text-sm"
                onClick={() => frameFileRef.current?.click()}
              >
                Prova cornice
              </button>
            </div>
            <ul className="text-[11px] text-[var(--st-muted)] space-y-1">
              <li>
                Soggetto:{' '}
                {layerOverrides.subject
                  ? 'override upload'
                  : layeredKit?.subject
                    ? `cartella · ${layeredKit.slug}`
                    : 'manca'}
              </li>
              <li>
                Sfondo:{' '}
                {layerOverrides.background
                  ? 'override upload'
                  : layeredKit?.background
                    ? `cartella · ${layeredKit.slug}`
                    : 'manca'}
              </li>
              <li>
                Cornice:{' '}
                {layerOverrides.frame
                  ? 'override upload'
                  : layeredKit?.frame
                    ? 'cartella'
                    : frameUrl
                      ? 'esercito'
                      : 'manca'}
              </li>
            </ul>
            {(layerOverrides.subject || layerOverrides.background || layerOverrides.frame) && (
              <button
                type="button"
                className="satze-tool-btn-secondary text-xs"
                onClick={() => setLayerOverrides({ subject: null, background: null, frame: null })}
              >
                Togli override → cartella
              </button>
            )}
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
          </div>

          <div className="satze-tool-panel p-5 space-y-3">
            <h2 className="text-lg font-bold text-[var(--st-text)]">Testi</h2>
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
            <label className="block text-xs text-[var(--st-muted)]">
              Accento
              <input
                type="color"
                className="satze-tool-input mt-1 h-10"
                value={/^#[0-9a-f]{6}$/i.test(face.accent) ? face.accent : '#f22c59'}
                onChange={(e) => patchFace({ accent: e.target.value, autoFaction: false })}
              />
            </label>
            {['ability', 'bonus'].map((block) => (
              <div key={block} className="space-y-2 pt-2 border-t border-[var(--st-border)]">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--st-muted)]">{block}</div>
                <input
                  className="satze-tool-input"
                  value={face[block]?.title ?? ''}
                  onChange={(e) =>
                    patchFace({ [block]: { ...face[block], title: e.target.value } })
                  }
                  placeholder="Titolo"
                />
                <textarea
                  className="satze-tool-input min-h-[72px]"
                  value={face[block]?.text ?? ''}
                  onChange={(e) =>
                    patchFace({ [block]: { ...face[block], text: e.target.value } })
                  }
                  placeholder="Testo"
                />
              </div>
            ))}
          </div>

          <div className="satze-tool-panel p-5 space-y-3">
            <h2 className="text-lg font-bold text-[var(--st-text)]">Layout Eldritch</h2>
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
                <label className="block text-[10px] text-[var(--st-muted)] col-span-2">
                  color
                  <input
                    type="color"
                    className="satze-tool-input mt-1 h-9"
                    value={selectedConfig.color || '#eee8c9'}
                    onChange={(e) => patchLayoutElement('color', e.target.value)}
                  />
                </label>
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
          </div>

          <div className="satze-tool-panel p-5 space-y-3">
            <h2 className="text-lg font-bold text-[var(--st-text)]">Import / Export</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="satze-tool-btn-secondary text-sm"
                onClick={() => layoutFileRef.current?.click()}
              >
                Carica layout JSON
              </button>
              <button
                type="button"
                className="satze-tool-btn-secondary text-sm"
                onClick={() => cardFileRef.current?.click()}
              >
                Carica JSON carta
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="satze-tool-btn-secondary text-sm" onClick={exportSvg}>
                SVG layout
              </button>
              <button type="button" className="satze-tool-btn-secondary text-sm" onClick={exportJson}>
                JSON carta
              </button>
              <button type="button" className="satze-tool-btn-secondary text-sm" onClick={exportLayout}>
                JSON layout
              </button>
            </div>
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
            {(status || fontError) && (
              <p className="text-xs text-amber-200/90">{fontError || status}</p>
            )}
            {rendered?.warnings?.length > 0 && (
              <p className="text-xs text-red-300/90">{rendered.warnings.join(' ')}</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-9 space-y-4">
          <div className="text-xs text-[var(--st-muted)]">
            Canvas art 1024×1536 · carta 23:33 · {fontsReady ? 'font ok' : 'font…'} · Eldritch livelli
            {agent ? ` · ${agent.name}` : ''}
          </div>

          <div className="card-face-lab-stage">
            {canCompose && fontsReady ? (
              <>
                <div className="card-face-lab-stage__panel card-face-lab-stage__studio">
                  <div className="card-face-lab-stage__label">Studio · grande</div>
                  <EldritchLayeredPreview
                    backgroundUrl={backgroundUrl}
                    subjectUrl={subjectUrl}
                    frameUrl={frameUrl}
                    layoutSvg={layoutOnlySvg}
                    composition={layeredKit?.composition || null}
                  />
                </div>
                <div className="card-face-lab-stage__panel card-face-lab-stage__ingame">
                  <div className="card-face-lab-stage__label">In game</div>
                  {agent ? (
                    <EldritchCardFace agent={agent} width={ELDRITCH_FRAME_W} />
                  ) : (
                    <EldritchLayeredPreview
                      backgroundUrl={backgroundUrl}
                      subjectUrl={subjectUrl}
                      frameUrl={frameUrl}
                      layoutSvg={layoutOnlySvg}
                      composition={layeredKit?.composition || null}
                      showControls={false}
                      motionDefault={false}
                    />
                  )}
                  <p className="card-face-lab-stage__ingame-meta">
                    Come in partita: <code>composita.webp</code> — footprint = cornice interna{' '}
                    {ELDRITCH_FRAME_W}×{ELDRITCH_FRAME_H}px. Studio = livelli live.
                  </p>
                </div>
              </>
            ) : (
              <div className="satze-tool-panel p-8 text-sm text-[var(--st-muted)] text-center max-w-md mx-auto space-y-3">
                <p>
                  Per vedere la carta: carica <strong className="text-[var(--st-text)]">soggetto</strong> e{' '}
                  <strong className="text-[var(--st-text)]">sfondo</strong> nel pannello{' '}
                  <strong className="text-[var(--st-text)]">Livelli</strong>, oppure scegli un agente
                  già predisposto (Sorethai / Cyber May Punk / Glauson).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

export default CardFaceLabPage;
