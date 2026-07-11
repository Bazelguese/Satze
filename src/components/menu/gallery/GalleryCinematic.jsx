// ============================================================
// GalleryCinematic.jsx — Schermata "Galleria dei Campi"
// ============================================================
// Drop-in component, gemello di ArmySelectCinematic / DeckSelectCinematic:
// stesso HUD, stessa tipografia, stesso linguaggio visivo cinematic. Mostra
// le animazioni reveal reali dei campi di battaglia (BattlefieldReveal) —
// e' consultazione pura, non una scelta: nessuna fase di conferma.
//
// ATTENZIONE — dati stub: galleryDemoFields.js e' un campione a 10 voci
// (un campo per tema d'armata), NON i tuoi 83 campi reali. Prima di
// integrare, sostituisci buildFields() con un adapter sui TUOI dati reali
// (src/data/battlefields.js -> ALL_BATTLEFIELDS + getBattlefieldAnimationType),
// mappando { id, army/tema, accent, glyph, anim, img, category, catLabel,
// catDesc } dal tuo schema. Vedi GalleryCinematic.README.md.
//
// Props:
//   onBack()   torna al menu
//
// Si renderizza fullscreen (position: fixed). Renderizzala al livello
// del routing (es. {currentScreen === 'gallery' && ...}), NON dentro
// CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ARMY_COLORS } from '../../../data/armies.js';
import { ALL_BATTLEFIELDS, getBattlefieldAnimationType } from '../../../data/battlefields.js';
import { ARMY_LORE } from '../cosmic/armyLore.js';
import { BattlefieldReveal } from '../../gallery/BattlefieldRevealAnimations.jsx';
import GalleryTabSwitcher from './GalleryTabSwitcher.jsx';
import { resolvePublicAssetUrl } from '../../../utils/preloadAssets.js';

const CATEGORY_LABEL = {
  values: 'VALORI',
  limit: 'VINCOLO',
  conditional: 'CONDIZIONALE',
  focus: 'FOCUS',
  trigger: 'INNESCO',
  neutral: 'NEUTRO',
};

const CATEGORY_DESC = {
  values: 'Altera POT o DAN in base allo stato della partita.',
  limit: 'Impone un tetto rigido alle mosse disponibili.',
  conditional: "Si attiva solo se una condizione è soddisfatta.",
  focus: 'Il Focus Coin scorre a un ritmo diverso, qui.',
  trigger: "Un evento innesca l'effetto una sola volta.",
  neutral: 'Nessun effetto: resta solo lo scenario.',
};

function resolveFieldImage(bgImage, fieldId) {
  if (bgImage) {
    return resolvePublicAssetUrl(bgImage) || bgImage;
  }
  return resolvePublicAssetUrl(`/campi_bg/campo-${fieldId}.webp`);
}

function buildFields() {
  return ALL_BATTLEFIELDS.map((f) => {
    const army = f.tema && f.tema !== 'generico' ? f.tema : 'Neutro';
    return {
      id: f.id,
      name: f.name,
      army,
      accent: (ARMY_COLORS[f.tema] || {}).accent || '#94a3b8',
      glyph: (ARMY_LORE[f.tema] || {}).glyph || '◈',
      anim: getBattlefieldAnimationType(f.id),
      img: resolveFieldImage(f.bgImage, f.id),
      category: f.category,
      catLabel: CATEGORY_LABEL[f.category] || 'NEUTRO',
      catDesc: f.effect || CATEGORY_DESC[f.category] || '',
    };
  });
}

export default function GalleryCinematic({
  onBack,
  totalFields = ALL_BATTLEFIELDS.length,
  galleryTab,
  onGalleryTabChange,
  agentCount,
  fieldCount = ALL_BATTLEFIELDS.length,
}) {
  const FIELDS = useMemo(() => buildFields(), []);
  const total = FIELDS.length;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('intro'); // intro -> idle
  const [token, setToken] = useState(0);
  const tickerRef = useRef(null);
  const chipRefs = useRef([]);

  const field = FIELDS[idx];

  useEffect(() => {
    const chip = chipRefs.current[idx];
    const rail = tickerRef.current;
    if (!chip || !rail) return;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;
    const target = chipLeft - rail.clientWidth / 2 + chipWidth / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [idx]);

  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 1500);
    return () => clearTimeout(t);
  }, []);

  const go = (delta) => {
    if (phase !== 'idle') return;
    setIdx((idx + delta + total) % total);
    setToken((t) => t + 1);
  };
  const goTo = (i) => {
    if (phase !== 'idle') return;
    setIdx(i);
    setToken((t) => t + 1);
  };
  const replay = () => setToken((t) => t + 1);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'idle') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'r' || e.key === 'R') replay();
      if (e.key === 'Escape' && onBack) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`glc phase-${phase}`} style={{ '--accent': field.accent }}>
      {/* BG layer */}
      <div className="glc-bg-layer">
        <div className="glc-bg" key={`bg-${idx}`} style={{ backgroundImage: `url('${field.img}')` }} />
        <div className="glc-bg-vignette" />
        <div className="glc-stars" />
        <div className="glc-diag" />
      </div>

      <div className="glc-watermark">GALLERIA</div>

      {/* Barra mode + navigazione */}
      <header className="glc-mode-bar">
        <button type="button" className="glc-back" onClick={onBack}>
          <span className="ar">←</span><span className="lbl">MENU</span>
        </button>
        {onGalleryTabChange && (
          <GalleryTabSwitcher
            activeTab={galleryTab}
            onTabChange={onGalleryTabChange}
            agentCount={agentCount}
            fieldCount={fieldCount}
          />
        )}
        <div className="glc-counter">
          <div className="ft-lbl">CAMPO</div>
          <div className="ft-name">
            {String(idx + 1).padStart(2, '0')}<span className="sep">/</span>{String(total).padStart(2, '0')}
          </div>
        </div>
      </header>

      <div className="glc-head">
        <div className="glc-eyebrow">ARCHIVIO DI GUERRA</div>
        <h1 className="glc-title">GALLERIA DEI CAMPI</h1>
        <div className="glc-sub">
          {totalFields} campi di battaglia · <kbd>←</kbd><kbd>→</kbd> sfoglia · <kbd>R</kbd> rigioca
        </div>
      </div>

      {/* Nav arrows */}
      {total > 1 && phase === 'idle' && <button className="glc-nav left" onClick={() => go(-1)} aria-label="prev">‹</button>}
      {total > 1 && phase === 'idle' && <button className="glc-nav right" onClick={() => go(1)} aria-label="next">›</button>}

      {/* Stage: viewer principale con l'animazione reveal reale */}
      <div className="glc-stage">
        <div className="glc-viewer">
          <div className="glc-viewer-frame" key={`v-${idx}-${token}`}>
            <BattlefieldReveal imageSrc={field.img} animationType={field.anim} />
          </div>
          <div className="glc-viewer-vignette" />
          <div className="glc-viewer-grid" />

          <div className="glc-tape">
            <span className="glyph">{field.glyph}</span>
            <span className="nm">{field.name}</span>
          </div>
          <div className="glc-catbadge">{field.catLabel}</div>

          <button className="glc-replay" onClick={replay} title="Rigioca (R)">
            <span className="ic">↻</span><span className="lbl">RIGIOCA</span>
          </button>

          <div className="glc-viewer-foot">
            <div className="glc-viewer-name">{field.name.toUpperCase()} · {String(field.id).padStart(2, '0')}</div>
            <div className="glc-viewer-desc">{field.catDesc}</div>
          </div>

          <div className="glc-corners"><span/><span/><span/><span/></div>
        </div>
      </div>

      {/* Ticker: una riga scrollabile — non impila 83 voci sul viewer */}
      <div className="glc-ticker-wrap">
        <div className="glc-ticker-label">ELENCO CAMPI</div>
        <div className="glc-ticker" ref={tickerRef}>
          {FIELDS.map((f, i) => {
            const active = i === idx;
            return (
              <button
                key={f.id}
                type="button"
                ref={(el) => { chipRefs.current[i] = el; }}
                className={`gtk ${active ? 'on' : ''}`}
                onClick={() => goTo(i)}
                style={{ '--c': f.accent }}
                title={f.name}
              >
                <span className="id">{String(f.id).padStart(2, '0')}</span>
                <span className="gy">{f.glyph}</span>
                <span className="nm">{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intro sigillo */}
      {phase === 'intro' && <IntroSigillo accent={field.accent} glyph={field.glyph} />}

      <div className="glc-scanlines" />
      <GalleryStyles />
    </div>
  );
}

// ============================================================
// INTRO
// ============================================================
function IntroSigillo({ accent, glyph }) {
  return (
    <div className="glc-intro" style={{ '--accent': accent }}>
      <svg viewBox="0 0 800 800" width="760" height="760" className="glc-intro-svg">
        <g className="glc-intro-spin">
          <circle cx="400" cy="400" r="320" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx="400" cy="400" r="260" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.5" />
        </g>
        <g className="glc-intro-spin-r">
          <circle cx="400" cy="400" r="200" fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.5" strokeDasharray="4 4" />
        </g>
      </svg>
      <div className="glc-intro-glyph" style={{ color: accent }}>{glyph}</div>
      <div className="glc-intro-text">APERTURA · ARCHIVIO</div>
    </div>
  );
}

// ============================================================
// STILI (scoped .glc-)
// ============================================================
function GalleryStyles() {
  return (
    <style>{`
      .glc {
        position: fixed; inset: 0;
        background: #050608; color: #f5f3eb;
        font-family: 'Chakra Petch', sans-serif;
        overflow: hidden; isolation: isolate; z-index: 1000;
      }
      .glc * { box-sizing: border-box; }
      .glc.phase-intro { cursor: wait; }
      .glc kbd {
        display: inline-block; padding: 1px 6px;
        border: 1px solid color-mix(in srgb, var(--accent) 60%, rgba(255,255,255,0.3));
        margin: 0 2px; color: var(--accent); font-family: 'Share Tech Mono', monospace;
      }

      /* BG */
      .glc-bg-layer { position: absolute; inset: 0; z-index: 0; }
      .glc-bg {
        position: absolute; inset: -3%;
        background-size: cover; background-position: center;
        filter: brightness(0.32) saturate(1.05) blur(2px);
        animation: glc-bg-in 1.1s cubic-bezier(.2,.7,.2,1);
      }
      @keyframes glc-bg-in { from { opacity: 0; transform: scale(1.12); filter: brightness(0.08) blur(10px); } }
      .glc-bg-vignette {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 50% 45%, transparent 18%, rgba(0,0,0,0.82) 85%),
          linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 26%, rgba(0,0,0,0.15) 58%, rgba(0,0,0,0.95) 100%);
      }
      .glc-stars {
        position: absolute; inset: 0; opacity: 0.55;
        background-image:
          radial-gradient(1px 1px at 18% 22%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 64% 14%, rgba(255,255,255,0.6), transparent 100%),
          radial-gradient(1.5px 1.5px at 88% 38%, #fff 0%, transparent 100%),
          radial-gradient(1px 1px at 12% 78%, rgba(255,255,255,0.5), transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 92%, rgba(255,255,255,0.7), transparent 100%);
        animation: glc-stars 120s linear infinite;
      }
      @keyframes glc-stars { to { transform: translate(-30px,-20px); } }
      .glc-diag {
        position: absolute; inset: 0; opacity: 0.04;
        background-image: repeating-linear-gradient(115deg, var(--accent) 0 1px, transparent 1px 22px);
        pointer-events: none;
      }
      .glc-watermark {
        position: absolute; top: 220px; left: -40px; right: 0; text-align: center;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 280px; line-height: 0.78;
        letter-spacing: -0.02em; color: transparent;
        -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 10%, transparent);
        transform: skewX(-8deg); user-select: none; pointer-events: none;
        z-index: 1; white-space: nowrap;
      }

      /* Mode bar + titolo */
      .glc-mode-bar {
        position: absolute; top: 0; left: 0; right: 0; z-index: 12;
        padding: 14px 48px 0;
        display: grid; grid-template-columns: 180px 1fr 180px; align-items: center; gap: 16px;
      }
      .glc-mode-bar .gallery-mode-switch { justify-self: center; }
      .glc-head {
        position: absolute; top: 62px; left: 0; right: 0; z-index: 10;
        text-align: center; padding: 0 48px;
        pointer-events: none;
      }
      .glc-back {
        display: inline-flex; align-items: center; gap: 10px; justify-self: start;
        background: rgba(5,6,8,0.65); border: 1.5px solid color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.18));
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
        padding: 11px 18px; cursor: pointer; transition: all .2s;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      }
      .glc-back:hover { border-color: var(--accent); color: var(--accent); }
      .glc-back .ar { font-size: 15px; }
      .glc-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.38em; color: var(--accent); }
      .glc-title {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 28px; letter-spacing: 0.2em;
        margin: 6px 0 4px; text-shadow: 0 4px 24px rgba(0,0,0,0.9);
      }
      .glc-sub { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.14em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
      .glc-counter { text-align: right; justify-self: end; }
      .glc-counter .ft-lbl { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.28em; color: #94a3b8; }
      .glc-counter .ft-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 18px; letter-spacing: 0.08em; color: var(--accent); margin-top: 2px; }
      .glc-counter .ft-name .sep { color: rgba(255,255,255,0.3); margin: 0 4px; font-weight: 400; }

      /* Nav arrows */
      .glc-nav {
        position: absolute; top: 54%; transform: translateY(-50%); z-index: 30;
        width: 60px; height: 80px; background: rgba(5,6,8,0.6);
        backdrop-filter: blur(6px);
        border: 1.5px solid color-mix(in srgb, var(--accent) 50%, rgba(255,255,255,0.18));
        color: var(--accent); cursor: pointer;
        font-family: 'Cinzel', serif; font-weight: 900; font-size: 40px;
        display: grid; place-items: center; transition: all .25s;
      }
      .glc-nav.left { left: 28px; clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%); }
      .glc-nav.right { right: 28px; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%); }
      .glc-nav:hover { border-color: var(--accent); box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 60%, transparent); background: rgba(5,6,8,0.85); }

      /* Stage / viewer */
      .glc-stage {
        position: absolute; top: 148px; left: 0; right: 0; bottom: 118px; z-index: 4;
        display: grid; place-items: center;
      }
      .glc-viewer {
        position: relative; width: 1180px; height: 100%; max-height: 640px;
        border: 1.5px solid var(--accent);
        background: #0a0a0e;
        box-shadow: 0 0 0 1.5px var(--accent), 0 30px 90px rgba(0,0,0,0.85), 0 0 90px color-mix(in srgb, var(--accent) 45%, transparent);
        overflow: hidden;
      }
      .glc-viewer-frame { position: absolute; inset: 0; }
      .glc-viewer-vignette {
        position: absolute; inset: 0; z-index: 6; pointer-events: none;
        background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.15) 34%, rgba(0,0,0,0) 62%);
      }
      .glc-viewer-grid {
        position: absolute; inset: 0; z-index: 5; pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 44px 44px; mix-blend-mode: overlay;
      }

      .glc-tape {
        position: absolute; top: 20px; left: 20px; z-index: 8;
        display: flex; align-items: center; gap: 10px;
        padding: 9px 16px 9px 12px;
        background: rgba(5,6,8,0.72); border-left: 3px solid var(--accent);
        backdrop-filter: blur(4px);
      }
      .glc-tape .glyph { font-family: 'Cinzel', serif; font-size: 18px; color: var(--accent); text-shadow: 0 0 14px var(--accent); }
      .glc-tape .nm { font-family: 'Cinzel', serif; font-weight: 700; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: #f5f3eb; }

      .glc-catbadge {
        position: absolute; top: 20px; right: 20px; z-index: 8;
        padding: 9px 16px;
        font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.28em;
        color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
        background: rgba(5,6,8,0.72); backdrop-filter: blur(4px);
      }

      .glc-replay {
        position: absolute; bottom: 96px; right: 20px; z-index: 9;
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 16px;
        background: rgba(5,6,8,0.75); border: 1.5px solid color-mix(in srgb, var(--accent) 60%, rgba(255,255,255,0.2));
        color: #f5f3eb; font-family: 'Share Tech Mono', monospace;
        font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase;
        cursor: pointer; transition: all .2s; backdrop-filter: blur(4px);
      }
      .glc-replay:hover { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 40%, transparent); }
      .glc-replay .ic { font-size: 15px; }

      .glc-viewer-foot {
        position: absolute; left: 24px; right: 24px; bottom: 22px; z-index: 8;
      }
      .glc-viewer-name {
        font-family: 'Cinzel', serif; font-weight: 700; font-size: 26px; letter-spacing: 0.16em;
        text-transform: uppercase; color: var(--accent);
        text-shadow: 0 2px 14px rgba(0,0,0,0.95);
      }
      .glc-viewer-desc {
        margin-top: 6px;
        font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.06em;
        color: rgba(255,255,255,0.75);
      }

      .glc-corners { position: absolute; inset: 0; pointer-events: none; z-index: 9; }
      .glc-corners > span { position: absolute; width: 26px; height: 26px; border: 2px solid var(--accent); }
      .glc-corners > span:nth-child(1) { top: 4px; left: 4px; border-right: 0; border-bottom: 0; }
      .glc-corners > span:nth-child(2) { top: 4px; right: 4px; border-left: 0; border-bottom: 0; }
      .glc-corners > span:nth-child(3) { bottom: 4px; left: 4px; border-right: 0; border-top: 0; }
      .glc-corners > span:nth-child(4) { bottom: 4px; right: 4px; border-left: 0; border-top: 0; }

      /* Ticker — singola riga scrollabile in basso */
      .glc-ticker-wrap {
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 11;
        padding: 0 40px 20px;
        background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 70%, transparent 100%);
        pointer-events: none;
      }
      .glc-ticker-wrap * { pointer-events: auto; }
      .glc-ticker-label {
        font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.32em;
        color: rgba(148,163,184,0.9); text-transform: uppercase; margin: 0 0 8px 4px;
      }
      .glc-ticker {
        display: flex; flex-wrap: nowrap; align-items: stretch;
        gap: 8px; overflow-x: auto; overflow-y: hidden;
        padding: 8px 4px 10px;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.25) transparent;
      }
      .glc-ticker::-webkit-scrollbar { height: 6px; }
      .glc-ticker::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 3px; }
      .gtk {
        flex: 0 0 auto;
        background: rgba(5,6,8,0.85); border: 1px solid rgba(255,255,255,0.12);
        cursor: pointer; padding: 10px 14px; opacity: 0.72;
        display: inline-flex; align-items: center; gap: 8px;
        font-family: 'Share Tech Mono', monospace; color: rgba(255,255,255,0.82);
        transition: all .18s; white-space: nowrap;
      }
      .gtk .id { font-size: 10px; letter-spacing: 0.12em; color: rgba(148,163,184,0.95); }
      .gtk .gy { font-family: 'Cinzel', serif; font-size: 14px; color: var(--c); flex: none; }
      .gtk .nm { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
      .gtk:hover { opacity: 0.95; border-color: rgba(255,255,255,0.28); }
      .gtk.on {
        opacity: 1; border-color: var(--c);
        background: color-mix(in srgb, var(--c) 18%, rgba(5,6,8,0.9));
        color: #f5f3eb; box-shadow: 0 0 18px color-mix(in srgb, var(--c) 35%, transparent);
      }

      /* Intro */
      .glc-intro { position: absolute; inset: 0; z-index: 50; display: grid; place-items: center; background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 80%); animation: glc-intro-fade 1.5s ease forwards; }
      @keyframes glc-intro-fade { 0%,75% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
      .glc-intro-svg { position: absolute; animation: glc-intro-zoom 1.5s cubic-bezier(.2,.7,.2,1); }
      @keyframes glc-intro-zoom { 0% { transform: scale(0.2); opacity: 0; } 40% { opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
      .glc-intro-spin { animation: glc-spin 6s linear infinite; transform-origin: 400px 400px; }
      .glc-intro-spin-r { animation: glc-spin 6s linear infinite reverse; transform-origin: 400px 400px; }
      @keyframes glc-spin { to { transform: rotate(360deg); } }
      .glc-intro-glyph { position: relative; font-family: 'Cinzel', serif; font-size: 170px; text-shadow: 0 0 80px currentColor; animation: glc-intro-glyph 1.5s ease; }
      @keyframes glc-intro-glyph { 0% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); filter: blur(20px); } }
      .glc-intro-text { position: absolute; bottom: 28%; font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.5em; color: rgba(255,255,255,0.85); animation: glc-intro-txt 1.5s ease; }
      @keyframes glc-intro-txt { 0%,30% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

      /* Scanlines */
      .glc-scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 90; background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(255,255,255,0.022) 3px, rgba(255,255,255,0.022) 4px); mix-blend-mode: overlay; }

      @media (prefers-reduced-motion: reduce) {
        .glc *, .glc *::after, .glc *::before { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}
