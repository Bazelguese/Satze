import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generateFieldParticles, FIELD_STYLES } from '../../utils';
import { Icon } from '../ui/Icon';
import { DUEL_PHASE_META, computeDuelProgressPercent } from '../../config/duelVisualTimeline.js';
import { getDuelOutcomeSubtitle } from './DuelCinematicOverlays';
import { FieldCurseOverlay } from './FieldCurseOverlay.jsx';
import { resolveFieldThumbUrl } from '../../utils/preloadAssets';
import { RuneTitle } from '../ui/RuneTitle.jsx';

/** semiassi dell'ellisse del portale (px): più alta che larga. La cornice la disegna DuelCosmicHud */
const PORTAL_RX = 58;
const PORTAL_RY = 78;

/** rune delle carte (CardReworkP4): scorrono attorno al portale */
const PORTAL_RUNES = [
  'M -3 -3 L 3 -3 L 0 3 Z',
  'M -3 0 L 0 -3 L 3 0 L 0 3 Z',
  'M -3 -3 L 3 3 M -3 3 L 3 -3',
  'M -3 0 L 3 0 M 0 -3 L 0 3',
  'M -3 -2 L 3 -2 M -3 2 L 3 2',
  'M 0 -3 L 3 0 L 0 3 L -3 0 Z',
  'M -3 -3 L 3 -3 M 0 -3 L 0 3',
  'M -3 -3 L -3 3 L 3 0 Z',
  'M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0',
];
const PORTAL_RUNE_SEQ = [0, 3, 7, 1, 5, 2, 8, 4, 6, 0, 2, 7, 3, 1, 8, 5, 4, 6, 1, 7, 0, 3, 5, 8];
const RUNE_GAP = 8;    // distanza delle rune dal bordo dell'ellisse (px): dove prima c'era il tratteggio
const RUNE_LAP_S = 60; // un giro completo in secondi

/** Fasi del round (regolamento): 1–4 prima del Duello, 5.1–5.6 dentro il Duello */
export const ROUND_STEPS = [
  { num: '1', name: 'Comando', desc: 'Abilità delle Eminenze' },
  { num: '2', name: 'Manovra', desc: 'Scelta del Campo' },
  { num: '3', name: 'Schieramento', desc: 'Scelta degli Agenti' },
  { num: '4', name: 'Investimento', desc: 'Scelta delle Focus Coin' },
];
export const DUEL_STEPS = [
  { num: '5.1', name: 'Apertura', desc: 'Effetti di inizio Duello' },
  { num: '5.2', name: 'Attivazione', desc: 'Effetti che preparano il confronto' },
  { num: '5.3', name: 'Calcolo', desc: 'Determinazione dei VA finali' },
  { num: '5.4', name: 'Scontro', desc: 'Confronto dei VA e vincitore' },
  { num: '5.5', name: 'Esito', desc: 'Danni e conseguenze del risultato' },
  { num: '5.6', name: 'Chiusura', desc: 'Effetti di fine Duello' },
];
/** duelPhase dell'animazione (0 deploy … 6 continue) → sottofase 5.x del regolamento */
const DUEL_PHASE_TO_STEP = [0, 1, 2, 2, 3, 4, 5];

/**
 * Fase del round da mostrare nel portale e avanzamento dell'anello (0–1):
 * cinque tratti, uno per fase; il quinto (Duello) si riempie con la barra dell'animazione.
 */
export function resolveRoundStep({ gamePhase, duelPhase, selectedAgent, battleResult, commandPhase }) {
  if (gamePhase === 'result' && battleResult) {
    const i = DUEL_PHASE_TO_STEP[Math.max(0, Math.min(6, duelPhase ?? 0))] ?? 0;
    const pct = computeDuelProgressPercent(duelPhase, battleResult) / 100;
    return { ...DUEL_STEPS[i], duel: true, progress: 0.8 + 0.2 * pct };
  }
  if (commandPhase && (gamePhase === 'selectField' || gamePhase === 'selectAgent')) {
    return { ...ROUND_STEPS[0], progress: 0.1 };
  }
  if (gamePhase === 'selectField') return { ...ROUND_STEPS[1], progress: 0.3 };
  if (gamePhase === 'selectAgent') {
    return selectedAgent ? { ...ROUND_STEPS[3], progress: 0.7 } : { ...ROUND_STEPS[2], progress: 0.5 };
  }
  return null;
}

/** comandi ad arco: fascia tra questi scostamenti dal bordo dell'ellisse (px) */
const ARC_IN = 50;
const ARC_OUT = 74;

function ellPt(cx, cy, a, b, deg) {
  const t = (deg * Math.PI) / 180;
  return [cx + a * Math.cos(t), cy + b * Math.sin(t)];
}
const f1 = (n) => n.toFixed(1);

/**
 * segmento di cornice tra gli angoli dL (estremo sinistro) e dR (estremo destro),
 * con punte. Sotto l'ellisse dL > dR (90 = in basso); sopra dL < dR (270 = in alto):
 * in entrambi i casi la scritta si legge da sinistra a destra.
 */
function arcBandPath(cx, cy, RX, RY, dL, dR) {
  const P = (o, d) => ellPt(cx, cy, RX + o, RY + o, d);
  const dir = dL > dR ? 1 : -1;
  const sw = dir > 0 ? 0 : 1;
  const mid = (ARC_IN + ARC_OUT) / 2;
  const [x1, y1] = P(ARC_OUT, dL);
  const [x2, y2] = P(ARC_OUT, dR);
  const [tx, ty] = P(mid, dR - 4 * dir);
  const [x3, y3] = P(ARC_IN, dR);
  const [x4, y4] = P(ARC_IN, dL);
  const [ux, uy] = P(mid, dL + 4 * dir);
  return `M ${f1(x1)} ${f1(y1)} A ${RX + ARC_OUT} ${RY + ARC_OUT} 0 0 ${sw} ${f1(x2)} ${f1(y2)} L ${f1(tx)} ${f1(ty)} `
    + `L ${f1(x3)} ${f1(y3)} A ${RX + ARC_IN} ${RY + ARC_IN} 0 0 ${1 - sw} ${f1(x4)} ${f1(y4)} L ${f1(ux)} ${f1(uy)} Z`;
}

/**
 * Comandi del portale (Conferma, Salta, Riepilogo, Continua): pezzi di cornice
 * curvi sotto l'ellisse. Entrano staccandosi dal portale e scendendo in
 * posizione, poi una scia di luce ne percorre il bordo.
 */
function PortalArcActions({ actions, RX, RY }) {
  if (!actions?.length) return null;
  const m = ARC_OUT + 16;
  const bw = (RX + m) * 2;
  const bh = (RY + m) * 2;
  const cx = bw / 2;
  const cy = bh / 2;
  const baseDown = ARC_IN + (ARC_OUT - ARC_IN) / 2 + 4; // linea di base del testo, centrata nella fascia
  const baseUp = ARC_IN + (ARC_OUT - ARC_IN) / 2 - 4;   // sopra l'ellisse le lettere guardano fuori
  return (
    <svg
      className="satze-bf-portal-actions"
      width={bw}
      height={bh}
      viewBox={`0 0 ${bw} ${bh}`}
      style={{ left: RX - cx, top: RY - cy }}
    >
      <defs>
        <linearGradient id="bf-arc-primary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe6f0" stopOpacity=".42" />
          <stop offset="55%" stopColor="#6e7a8e" stopOpacity=".22" />
          <stop offset="100%" stopColor="#06080c" stopOpacity=".92" />
        </linearGradient>
        <linearGradient id="bf-arc-secondary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b4bfd0" stopOpacity=".16" />
          <stop offset="100%" stopColor="#06080c" stopOpacity=".9" />
        </linearGradient>
      </defs>
      {actions.map((act, i) => {
        const id = `bf-arc-lbl-${act.key}`;
        const up = act.dL < act.dR;
        const base = up ? baseUp : baseDown;
        const [lx, ly] = ellPt(cx, cy, RX + base, RY + base, act.dL);
        const [rx2, ry2] = ellPt(cx, cy, RX + base, RY + base, act.dR);
        const span = (Math.abs(act.dL - act.dR) * Math.PI) / 180;
        const approxLen = span * Math.sqrt(((RX + base) ** 2 + (RY + base) ** 2) / 2) * 0.86;
        const estLabel = act.label.length * 10.5 * 0.9;
        const onKey = (e) => {
          if (act.disabled) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act.onClick?.(); }
        };
        return (
          <g
            key={act.key}
            ref={act.anchorRef}
            className={`satze-bf-arc-btn is-${act.variant}${act.disabled ? ' is-disabled' : ''}${act.pressed ? ' is-pressed' : ''}`}
            style={{ animationDelay: `${i * 0.12}s`, '--arc-delay': `${i * 0.12 + 0.45}s` }}
            role={act.onClick ? 'button' : undefined}
            tabIndex={act.onClick && !act.disabled ? 0 : undefined}
            aria-label={act.aria || act.label}
            aria-disabled={act.disabled || undefined}
            aria-expanded={act.expanded}
            onClick={act.disabled ? undefined : act.onClick}
            onKeyDown={act.onClick ? onKey : undefined}
          >
            <path className="satze-bf-arc-shape" d={arcBandPath(cx, cy, RX, RY, act.dL, act.dR)} />
            <path className="satze-bf-arc-trace" d={arcBandPath(cx, cy, RX, RY, act.dL, act.dR)} pathLength="100" />
            <defs>
              <path id={id} d={`M ${f1(lx)} ${f1(ly)} A ${RX + base} ${RY + base} 0 0 ${up ? 1 : 0} ${f1(rx2)} ${f1(ry2)}`} />
            </defs>
            <text className="satze-bf-arc-label">
              <textPath
                href={`#${id}`}
                startOffset="50%"
                textAnchor="middle"
                {...(estLabel > approxLen ? { textLength: approxLen, lengthAdjust: 'spacingAndGlyphs' } : {})}
              >
                {act.label.toUpperCase()}
              </textPath>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Portale del campo: ellisse con l'anteprima del campo e, al centro, la fase
 * del round; nome del campo sull'arco alto, effetto sull'arco basso. Anelli in
 * rotazione e anello di avanzamento li disegna lo shader dell'HUD attorno a
 * `.satze-bf-portal-disc` (legge `data-progress`).
 */
function FieldPortal({ field, cursed, curseAccent, step, introKey = 0, actions = null, turn = null, outcome = null, children }) {
  const glow = turn?.color || outcome?.color || null;
  const RX = PORTAL_RX;
  const RY = PORTAL_RY;
  const bw = (RX + 60) * 2;
  const bh = (RY + 60) * 2;
  const cx = bw / 2;
  const cy = bh / 2;
  const tTop = 31;
  const tBot = 40;
  const thumb = field?.bgImage ? resolveFieldThumbUrl(field.bgImage) : null;
  const effect = field?.effect || '';
  const effFont = effect.length > 46 ? 9 : 10;
  // mezza ellisse ≈ π·√((a²+b²)/2); si lascia un margine per gli estremi
  const halfLen = (a, b) => Math.PI * Math.sqrt((a * a + b * b) / 2);
  const bottomArcLen = halfLen(RX + tBot, RY + tBot) * 0.9;
  const estEff = effect.length * effFont * 0.62;
  return (
    <div className="satze-bf-portal" style={{ width: RX * 2, height: RY * 2 }}>
      <div
        className="satze-bf-portal-disc"
        data-progress={outcome ? '1' : step ? String(step.progress) : '0'}
        data-intro={String(introKey)}
        style={{ width: RX * 2, height: RY * 2, backgroundImage: thumb ? `url("${thumb}")` : undefined }}
      >
        {/* bagliore interno nel colore di chi deve agire: sfuma da un'armata all'altra */}
        <span
          className={`satze-bf-portal-turn-glow${glow ? ' is-on' : ''}`}
          style={glow ? { '--turn-c': glow } : undefined}
          aria-hidden
        />
        {turn && (
          <div className="satze-bf-portal-turn" style={{ '--turn-c': turn.color }} role="status">
            <span key={turn.side} className="satze-bf-portal-turn-label" data-side={turn.side}>
              {turn.label}
            </span>
          </div>
        )}
        {outcome && (
          <div className={`satze-bf-portal-step satze-bf-portal-outcome is-${outcome.kind}`} style={{ '--turn-c': outcome.color }}>
            <span className="satze-bf-portal-step-kicker">Esito</span>
            <span className="satze-bf-portal-step-name"><RuneTitle text={outcome.title} global={false} delay={250} stepMs={70} /></span>
            {outcome.desc && (
              <span className="satze-bf-portal-step-desc"><RuneTitle text={outcome.desc} global={false} delay={700} stepMs={24} /></span>
            )}
          </div>
        )}
        {step && !outcome && (
          <div key={step.num} className={`satze-bf-portal-step${step.duel ? ' is-duel' : ''}`}>
            {step.duel && <span className="satze-bf-portal-step-kicker">Duello</span>}
            <span className="satze-bf-portal-step-name">{step.name}</span>
            <span className="satze-bf-portal-step-desc">{step.desc}</span>
          </div>
        )}
        {children}
        {cursed && (
          <div className="satze-bf-curse-mark" style={{ '--curse-accent': curseAccent || '#26c4e8' }}>
            <FieldCurseOverlay accent={curseAccent} variant="panel" />
          </div>
        )}
      </div>
      {/* anello di rune (le stesse delle carte) che scorrono lungo l'ellisse */}
      <svg
        className="satze-bf-portal-runes"
        width={bw}
        height={bh}
        viewBox={`0 0 ${bw} ${bh}`}
        style={{ left: RX - cx, top: RY - cy }}
        aria-hidden
      >
        <defs>
          <path
            id="bf-rune-ring"
            d={`M ${cx - RX - RUNE_GAP} ${cy} A ${RX + RUNE_GAP} ${RY + RUNE_GAP} 0 1 1 ${cx + RX + RUNE_GAP} ${cy} A ${RX + RUNE_GAP} ${RY + RUNE_GAP} 0 1 1 ${cx - RX - RUNE_GAP} ${cy}`}
          />
        </defs>
        {PORTAL_RUNE_SEQ.map((idx, i) => (
          <g key={i}>
            <animateMotion
              dur={`${RUNE_LAP_S}s`}
              repeatCount="indefinite"
              rotate="auto"
              begin={`${(-RUNE_LAP_S * i) / PORTAL_RUNE_SEQ.length}s`}
            >
              <mpath href="#bf-rune-ring" />
            </animateMotion>
            <path d={PORTAL_RUNES[idx]} className="satze-bf-portal-rune" transform="scale(1.1)" />
          </g>
        ))}
      </svg>
      <PortalArcActions actions={actions} RX={RX} RY={RY} />
      {field && (
        <svg
          className="satze-bf-portal-text"
          width={bw}
          height={bh}
          viewBox={`0 0 ${bw} ${bh}`}
          style={{ left: RX - cx, top: RY - cy }}
          aria-hidden
        >
          <defs>
            <path id="bf-arc-top" d={`M ${cx - RX - tTop} ${cy} A ${RX + tTop} ${RY + tTop} 0 0 1 ${cx + RX + tTop} ${cy}`} />
            <path id="bf-arc-bot" d={`M ${cx - RX - tBot} ${cy} A ${RX + tBot} ${RY + tBot} 0 0 0 ${cx + RX + tBot} ${cy}`} />
          </defs>
          <text className="satze-bf-portal-name">
            <textPath href="#bf-arc-top" startOffset="50%" textAnchor="middle">{field.name}</textPath>
          </text>
          {effect && (
            <text className="satze-bf-portal-effect" style={{ fontSize: effFont }}>
              <textPath
                href="#bf-arc-bot"
                startOffset="50%"
                textAnchor="middle"
                {...(estEff > bottomArcLen ? { textLength: bottomArcLen, lengthAdjust: 'spacingAndGlyphs' } : {})}
              >
                {effect}
              </textPath>
            </text>
          )}
        </svg>
      )}
    </div>
  );
}

// Le posizioni sono casuali: vanno calcolate una volta sola per campo, altrimenti
// ogni re-render del duello teletrasporta le particelle e forza un repaint completo.
const generateParticleData = (config) => {
    if (config.type === 'none') return [];
    
    return Array.from({ length: config.count }).map((_, i) => {
      const startX = 10 + Math.random() * 80;
      const startY = config.type === 'rise' ? 80 + Math.random() * 15 : 
                    config.type === 'fall' ? 5 + Math.random() * 15 :
                    config.type === 'vortex' ? 45 + (Math.random() - 0.5) * 20 :
                    10 + Math.random() * 80;
      
      let moveX, moveY, extraVars = {};
      
      switch(config.type) {
        case 'float':
          moveX = (Math.random() - 0.5) * 60;
          moveY = (Math.random() - 0.5) * 60;
          break;
        case 'rise':
          moveX = (Math.random() - 0.5) * 40;
          moveY = -80 - Math.random() * 20;
          break;
        case 'fall':
          moveX = (Math.random() - 0.5) * 40;
          moveY = 80 + Math.random() * 20;
          break;
        case 'sparkle':
          moveX = (Math.random() - 0.5) * 30;
          moveY = (Math.random() - 0.5) * 30;
          break;
        case 'spiral':
          const angle = (i / config.count) * 360;
          const radius = 50 + Math.random() * 30;
          moveX = Math.cos(angle * Math.PI / 180) * radius;
          moveY = Math.sin(angle * Math.PI / 180) * radius;
          extraVars['--spiral-x'] = `${moveX}px`;
          extraVars['--spiral-y'] = `${moveY}px`;
          extraVars['--spiral-x2'] = `${moveX * 2}px`;
          extraVars['--spiral-y2'] = `${moveY * 2}px`;
          moveX = 0;
          moveY = 0;
          break;
        case 'mirror':
          moveX = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40);
          moveY = 0;
          extraVars['--mirror-x'] = `${moveX}px`;
          break;
        case 'vortex':
          const centerX = 50;
          const centerY = 50;
          const distX = (startX - centerX) / 50;
          const distY = (startY - centerY) / 50;
          moveX = -distX * 30;
          moveY = -distY * 30;
          extraVars['--vortex-x'] = `${moveX}px`;
          extraVars['--vortex-y'] = `${moveY}px`;
          break;
        default:
          moveX = (Math.random() - 0.5) * 60;
          moveY = (Math.random() - 0.5) * 60;
      }
      
      return {
        id: i,
        x: startX,
        y: startY,
        moveX,
        moveY,
        delay: Math.random() * (config.type === 'sparkle' ? 2 : 4),
        duration: config.type === 'sparkle' ? 2 :
                 config.type === 'spiral' ? 10 :
                 config.type === 'vortex' ? 5 :
                 6 + Math.random() * 4,
        size: config.type === 'sparkle' ? 3 + Math.random() * 2 :
             config.type === 'spiral' ? 4 + Math.random() * 2 :
             2 + Math.random() * 2,
        ...extraVars
      };
    });
};

function formatFocusUsedLabel(used, invested, temporary) {
  const tmp = Math.max(0, Number(temporary) || 0);
  if (!tmp) return String(used ?? 0);
  const inv = invested != null ? invested : Math.max(0, (used || 0) - tmp);
  return `${used} (${inv} investiti + ${tmp} temporanei)`;
}

function formatFocusInvestedLine(br) {
  const pTmp = br.playerTemporaryFocus || 0;
  const eTmp = br.enemyTemporaryFocus || 0;
  if (!pTmp && !eTmp) {
    return `FC investiti: IA ${br.enemyFocusUsed} · TU ${br.playerFocusUsed}`;
  }
  return `FC: IA ${formatFocusUsedLabel(br.enemyFocusUsed, br.enemyFocusInvested, eTmp)} · TU ${formatFocusUsedLabel(br.playerFocusUsed, br.playerFocusInvested, pTmp)}`;
}

/**
 * Componente sfondo campo di battaglia
 * Visualizza gradienti, glow e particelle tematiche per il campo attivo
 */
export const BattlefieldBackground = React.memo(({ activeField, cursed = false, curseAccent = null }) => {
  const fieldId = activeField?.id ?? null;
  const fieldStyle = fieldId != null ? (FIELD_STYLES[fieldId] || {}) : {};
  const glowColor = fieldStyle.glow || 'rgba(100,100,100,0.3)';

  const particleConfig = useMemo(
    () => (fieldId != null ? generateFieldParticles(fieldId, FIELD_STYLES[fieldId] || {}) : null),
    [fieldId]
  );
  const particles = useMemo(
    () => (particleConfig ? generateParticleData(particleConfig) : []),
    [particleConfig]
  );

  if (!activeField) return null;

  return (
    <div 
      className="absolute pointer-events-none overflow-hidden"
      style={{ 
        top: 0,
        left: 0,
        width: '1920px',
        height: '1080px',
        zIndex: 0
      }}
    >
      {/* Base gradient con animazione */}
      <div 
        className="absolute transition-all duration-700 animate-gradient-shift"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `${fieldStyle.gradient || 'linear-gradient(135deg, #1a1a2e, #2a2a4e)'}, ${fieldStyle.gradient || 'linear-gradient(315deg, #2a2a4e, #1a1a2e)'}`,
          backgroundSize: '200% 200%',
          // Tenere basso: lo sfondo vero è la foto del campo (BattlefieldReveal).
          // A 0.5 il gradiente mangia l'immagine e il duello sembra "senza campo".
          opacity: 0.18
        }}
      />
      
      {/* Glow pulsante */}
      <div 
        className="absolute transition-all duration-700 animate-glow-pulse"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Pattern overlay animato */}
      <div 
        className="absolute opacity-20"
        style={{ 
          top: 0,
          left: 0,
          width: '1920px',
          height: '1080px',
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${fieldStyle.accent || '#666'}20 10px,
            ${fieldStyle.accent || '#666'}20 20px
          )`
        }}
      />
      
      {/* Particelle tematiche (contenute) */}
      {particles.map(particle => {
        const styleObj = {
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          backgroundColor: particleConfig.accent,
          opacity: particleConfig.opacity,
          animationDelay: `${particle.delay}s`,
          animationDuration: `${particle.duration}s`
        };
        
        // Aggiungi variabili CSS per animazioni specifiche
        if (particleConfig.type === 'float' || particleConfig.type === 'rise' || particleConfig.type === 'fall') {
          styleObj['--particle-x'] = `${particle.moveX}%`;
          styleObj['--particle-y'] = `${particle.moveY}%`;
        }
        if (particle['--spiral-x']) styleObj['--spiral-x'] = particle['--spiral-x'];
        if (particle['--spiral-y']) styleObj['--spiral-y'] = particle['--spiral-y'];
        if (particle['--spiral-x2']) styleObj['--spiral-x2'] = particle['--spiral-x2'];
        if (particle['--spiral-y2']) styleObj['--spiral-y2'] = particle['--spiral-y2'];
        if (particle['--mirror-x']) styleObj['--mirror-x'] = particle['--mirror-x'];
        if (particle['--vortex-x']) styleObj['--vortex-x'] = particle['--vortex-x'];
        if (particle['--vortex-y']) styleObj['--vortex-y'] = particle['--vortex-y'];
        
        if (particleConfig.glow) {
          styleObj.boxShadow = `0 0 ${particle.size * 2}px ${particleConfig.accent}`;
        }
        
        return (
          <div
            key={particle.id}
            className={`absolute ${particleConfig.shape} ${particleConfig.className}`}
            style={styleObj}
          />
        );
      })}
      {cursed && (
        <div
          className="satze-bf-curse-wash"
          style={{ '--curse-accent': curseAccent || '#26c4e8' }}
          aria-hidden
        />
      )}
    </div>
  );
});
BattlefieldBackground.displayName = 'BattlefieldBackground';

/**
 * Componente pannello campo di battaglia centrale
 * Mostra icona, nome, effetto e controlli del campo
 */
export const BattlefieldPanel = ({ 
  field, 
  gamePhase, 
  isPlayerFirst, 
  isZoomed, 
  selectedAgent, 
  onConfirm,
  confirmDisabled = false,
  awaitingEnemySelection = false,
  /** true = testi "avversario" invece di "IA" (multiplayer online) */
  isOnlinePvP = false,
  duelPhase, 
  battleResult,
  onContinue,
  gameResult,
  onMenu,
  isCampaign = false,
  onCampaignRetry,
  onRematch,
  /** Rematch online: cambia esercito/mazzo restando in stanza */
  onRematchChangeDeck,
  /** turno corrente { side, label, color } mostrato dentro il portale */
  turn = null,
  /** colore del vincitore per il bagliore del portale a fine partita */
  outcomeColor = null,
  rematchLabel = 'Rematch',
  rematchChangeDeckLabel = 'Cambia mazzo',
  /** false mentre overlay TRIONFO/SCONFITTA è attivo — i tasti compaiono dopo */
  endGameActionsReady = true,
  onOpenPlaytest,
  onReplayDuel,
  onSkipDuel,
  /** Log ragionamenti IA della partita (post-match) */
  aiDecisionLog = null,
  onCopyAiDecisionLog = null,
  cursed = false,
  curseAccent = null,
  /** HUD cosmico: il pannello diventa un portale con l'anteprima del campo */
  portalFrame = false,
  /** true mentre si scelgono le abilità dell'Eminenza (fase 1 · Comando) */
  commandPhase = false,
}) => {
  const oppWait = isOnlinePvP
    ? "L'avversario sta scegliendo il campo di battaglia"
    : 'Il nemico sta scegliendo il campo di battaglia';
  const oppThink = isOnlinePvP ? "In attesa dell'avversario..." : 'Il nemico sta pensando...';
  // Il pannello deve essere sempre visibile, anche quando non c'è un campo selezionato
  // (ad esempio durante la fase selectField)
  const isDuelPhase = gamePhase === 'result' && battleResult;
  // nuovo round = si rientra nelle fasi di scelta da un'altra fase → il portale si riapre
  const introRef = useRef({ prev: gamePhase, key: 0 });
  if (introRef.current.prev !== gamePhase) {
    const pre = (p) => p === 'selectField' || p === 'selectAgent';
    if (pre(gamePhase) && !pre(introRef.current.prev)) introRef.current.key += 1;
    introRef.current.prev = gamePhase;
  }
  const roundStep = portalFrame
    ? resolveRoundStep({ gamePhase, duelPhase, selectedAgent, battleResult, commandPhase })
    : null;
  const [riepilogoOpen, setRiepilogoOpen] = useState(false);
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [aiLogCopied, setAiLogCopied] = useState(false);
  const riepilogoAnchorRef = useRef(null);
  // comandi ad arco sotto il portale: angoli (gradi, 90 = in basso) di ogni pezzo
  const portalActions = [];
  if (portalFrame) {
    if (gamePhase === 'selectAgent' && selectedAgent) {
      portalActions.push(awaitingEnemySelection
        ? { key: 'wait', label: oppThink.replace(/\.+$/, '…'), variant: 'wait', dL: 132, dR: 48 }
        : { key: 'confirm', label: 'Conferma', variant: 'primary', dL: 128, dR: 52, onClick: onConfirm, disabled: confirmDisabled });
    }
    if (gamePhase === 'result' && battleResult && duelPhase < 6 && onSkipDuel) {
      portalActions.push({ key: 'skip', label: 'Salta', aria: 'Salta l\'animazione del duello', variant: 'secondary', dL: 112, dR: 68, onClick: onSkipDuel });
    }
    if (gamePhase === 'result' && battleResult && duelPhase >= 6) {
      portalActions.push({
        key: 'recap', label: 'Riepilogo', variant: 'secondary', dL: 156, dR: 96,
        onClick: () => setRiepilogoOpen((o) => !o), expanded: riepilogoOpen, pressed: riepilogoOpen,
      });
      portalActions.push({ key: 'continue', label: 'Continua', variant: 'primary', dL: 84, dR: 24, onClick: onContinue });
    }
  }
  const [riepilogoRect, setRiepilogoRect] = useState(null);
  // fine partita: il portale dell'esito, comandi ad arco sotto e sopra l'ellisse
  const endPortal = portalFrame && gamePhase === 'gameOver' && endGameActionsReady;
  const hasAiLog = !isOnlinePvP && Array.isArray(aiDecisionLog) && aiDecisionLog.length > 0;
  if (endPortal) {
    if (isCampaign) {
      portalActions.push(gameResult?.winner === 'player'
        ? { key: 'go', label: 'Prosegui', variant: 'primary', dL: 124, dR: 56, onClick: onMenu }
        : { key: 'retry', label: 'Ritenta', variant: 'primary', dL: 124, dR: 56, onClick: onCampaignRetry });
    } else {
      // sotto: Menù a sinistra e Rematch a destra, come Riepilogo / Continua
      if (onRematchChangeDeck) {
        portalActions.push({ key: 'menu', label: 'Menù', variant: 'secondary', dL: 176, dR: 134, onClick: onMenu });
        portalActions.push({ key: 'deck', label: rematchChangeDeckLabel, variant: 'secondary', dL: 128, dR: 84, onClick: onRematchChangeDeck });
        if (onRematch) portalActions.push({ key: 'rematch', label: rematchLabel, variant: 'primary', dL: 78, dR: 22, onClick: onRematch });
      } else {
        portalActions.push({ key: 'menu', label: 'Menù', variant: 'secondary', dL: 156, dR: 96, onClick: onMenu });
        if (onRematch) portalActions.push({ key: 'rematch', label: rematchLabel, variant: 'primary', dL: 84, dR: 24, onClick: onRematch });
      }
      // sopra: gli strumenti (ragionamenti dell'IA, storico playtest)
      const tools = [];
      if (hasAiLog) {
        tools.push({
          key: 'ailog', label: 'Ragionamenti IA', aria: `Ragionamenti IA (${aiDecisionLog.length})`, variant: 'secondary',
          onClick: () => setAiLogOpen((o) => !o), expanded: aiLogOpen, pressed: aiLogOpen,
        });
      }
      if (onOpenPlaytest) tools.push({ key: 'playtest', label: 'Storico Playtest', variant: 'secondary', onClick: onOpenPlaytest });
      const spans = tools.length === 2 ? [[204, 266], [274, 336]] : [[236, 304]];
      tools.forEach((t, i) => portalActions.push({ ...t, dL: spans[i][0], dR: spans[i][1] }));
    }
  }
  const outcome = endPortal && gameResult ? (
    gameResult.winner === 'player'
      ? { kind: 'win', title: 'Vittoria', desc: getDuelOutcomeSubtitle(gameResult, 'win'), color: outcomeColor }
      : gameResult.winner === 'enemy'
        ? { kind: 'lose', title: 'Sconfitta', desc: getDuelOutcomeSubtitle(gameResult, 'lose'), color: outcomeColor }
        : { kind: 'draw', title: 'Pareggio', desc: 'Nessun vincitore', color: null }
  ) : null;
  const aiLogAnchorRef = useRef(null);
  const [aiLogRect, setAiLogRect] = useState(null);

  useEffect(() => {
    setRiepilogoOpen(false);
  }, [duelPhase]);

  useEffect(() => {
    if (gamePhase !== 'gameOver') {
      setAiLogOpen(false);
      setAiLogCopied(false);
    }
  }, [gamePhase]);

  useEffect(() => {
    if (!riepilogoOpen || !riepilogoAnchorRef.current) {
      setRiepilogoRect(null);
      return undefined;
    }
    const updateRect = () => {
      const rect = riepilogoAnchorRef.current?.getBoundingClientRect();
      if (rect) setRiepilogoRect({ left: rect.left, top: rect.bottom + 4, width: rect.width });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [riepilogoOpen]);

  useEffect(() => {
    if (!aiLogOpen || !endPortal || !aiLogAnchorRef.current) {
      setAiLogRect(null);
      return undefined;
    }
    const updateRect = () => {
      const rect = aiLogAnchorRef.current?.getBoundingClientRect();
      if (rect) setAiLogRect({ left: rect.left, top: rect.bottom + 4, width: rect.width });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [aiLogOpen, endPortal]);

  // ragionamenti IA a fine partita: scheda del HUD che si srotola sotto gli archi
  const aiLogHud = endPortal && hasAiLog ? (
    <div className="satze-recap satze-ailog" role="region" aria-label="Ragionamenti dell'IA">
      <div className="satze-recap-title">Ragionamenti dell'IA</div>
      <div className="satze-ailog-list">
        {aiDecisionLog.map((entry) => (
          <div key={entry.id} className="satze-ailog-entry">
            <div className="satze-ailog-head">{entry.headline}</div>
            <ul>
              {(entry.considerations || []).slice(0, 12).map((line, idx) => (
                <li key={`${entry.id}-${idx}`}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {onCopyAiDecisionLog && (
        <button
          type="button"
          className="satze-ailog-copy"
          onClick={() => {
            onCopyAiDecisionLog();
            setAiLogCopied(true);
            window.setTimeout(() => setAiLogCopied(false), 1600);
          }}
        >
          {aiLogCopied ? 'Copiato' : 'Copia log completo'}
        </button>
      )}
    </div>
  ) : null;

  // riepilogo nello stile del portale: due colonne IA / TU, valori che cambiano evidenziati
  const recapSide = (who) => {
    const r = battleResult;
    const e = who === 'enemy';
    const agent = e ? r.enemyAgent : r.playerAgent;
    const pow = e ? r.enemyPower : r.playerPower;
    const dmg = e ? r.enemyDamage : r.playerDamage;
    const fcUsed = e ? r.enemyFocusUsed : r.playerFocusUsed;
    const va = e ? r.enemyAssault : r.playerAssault;
    const vaBase = pow * fcUsed;
    const rows = [
      { k: 'FC', v: formatFocusUsedLabel(fcUsed, e ? r.enemyFocusInvested : r.playerFocusInvested, e ? r.enemyTemporaryFocus : r.playerTemporaryFocus) },
      pow !== agent.power ? { k: 'POT', from: agent.power, v: pow } : null,
      dmg !== agent.damage ? { k: 'DAN', from: agent.damage, v: dmg } : null,
      { k: 'VA', from: va !== vaBase ? vaBase : null, v: va, strong: true },
    ].filter(Boolean);
    return (
      <div className="satze-recap-col">
        <div className="satze-recap-side">{e ? (isOnlinePvP ? 'Avversario' : 'IA') : 'Tu'}</div>
        {rows.map((row) => (
          <div key={row.k} className={`satze-recap-row${row.strong ? ' is-strong' : ''}`}>
            <span className="satze-recap-k">{row.k}</span>
            <span className="satze-recap-v">
              {row.from != null && <><span className="satze-recap-from">{row.from}</span><span className="satze-recap-arrow" aria-hidden>›</span></>}
              {row.v}
            </span>
          </div>
        ))}
      </div>
    );
  };
  const riepilogoHud = battleResult ? (
    <div className="satze-recap" role="region" aria-label="Riepilogo del duello">
      <div className="satze-recap-title">Riepilogo del duello</div>
      <div className="satze-recap-cols">
        {recapSide('enemy')}
        <span className="satze-recap-divider" aria-hidden />
        {recapSide('player')}
      </div>
      <div className="satze-recap-foot">
        <div>{formatFocusInvestedLine(battleResult)}</div>
        <div className="satze-recap-damage">Danno <b>{battleResult.damageDealt} PV</b></div>
      </div>
    </div>
  ) : null;

  const riepilogoContent = battleResult ? (
    <div className="px-2 py-2 rounded-b-lg border-x border-b border-slate-600/40 bg-slate-900/95 satze-riepilogo-unroll">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-slate-800/60 rounded p-2">
          <div className="text-red-400/90 font-medium mb-1 text-[10px]">IA</div>
          <div className="text-[10px] space-y-1">
            <div><span className="text-amber-400">FC:</span> {formatFocusUsedLabel(battleResult.enemyFocusUsed, battleResult.enemyFocusInvested, battleResult.enemyTemporaryFocus)}</div>
            {battleResult.enemyPower !== battleResult.enemyAgent.power && (
              <div><span className="text-yellow-400">POT:</span> {battleResult.enemyAgent.power} → {battleResult.enemyPower}</div>
            )}
            {battleResult.enemyDamage !== battleResult.enemyAgent.damage && (
              <div><span className="text-purple-400">DAN:</span> {battleResult.enemyAgent.damage} → {battleResult.enemyDamage}</div>
            )}
            {(() => {
              const initialVA = battleResult.enemyPower * battleResult.enemyFocusUsed;
              return battleResult.enemyAssault !== initialVA ? (
                <div><span className="text-purple-400">VA:</span> {initialVA} → {battleResult.enemyAssault}</div>
              ) : (
                <div><span className="text-purple-400">VA:</span> {battleResult.enemyAssault}</div>
              );
            })()}
            {battleResult.enemyPower === battleResult.enemyAgent.power &&
              battleResult.enemyDamage === battleResult.enemyAgent.damage &&
              battleResult.enemyAssault === (battleResult.enemyPower * battleResult.enemyFocusUsed) && (
                <div className="text-slate-500 text-[9px] opacity-80">—</div>
              )}
          </div>
        </div>
        <div className="bg-slate-800/60 rounded p-2">
          <div className="text-green-400/90 font-medium mb-1 text-[10px]">TU</div>
          <div className="text-[10px] space-y-1">
            <div><span className="text-amber-400">FC:</span> {formatFocusUsedLabel(battleResult.playerFocusUsed, battleResult.playerFocusInvested, battleResult.playerTemporaryFocus)}</div>
            {battleResult.playerPower !== battleResult.playerAgent.power && (
              <div><span className="text-yellow-400">POT:</span> {battleResult.playerAgent.power} → {battleResult.playerPower}</div>
            )}
            {battleResult.playerDamage !== battleResult.playerAgent.damage && (
              <div><span className="text-purple-400">DAN:</span> {battleResult.playerAgent.damage} → {battleResult.playerDamage}</div>
            )}
            {(() => {
              const initialVA = battleResult.playerPower * battleResult.playerFocusUsed;
              return battleResult.playerAssault !== initialVA ? (
                <div><span className="text-purple-400">VA:</span> {initialVA} → {battleResult.playerAssault}</div>
              ) : (
                <div><span className="text-purple-400">VA:</span> {battleResult.playerAssault}</div>
              );
            })()}
            {battleResult.playerPower === battleResult.playerAgent.power &&
              battleResult.playerDamage === battleResult.playerAgent.damage &&
              battleResult.playerAssault === (battleResult.playerPower * battleResult.playerFocusUsed) && (
                <div className="text-slate-500 text-[9px] opacity-80">—</div>
              )}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-600/40 pt-1.5 mt-1.5">
        <div className="text-slate-500 text-[10px] space-y-1">
          <div>{formatFocusInvestedLine(battleResult)}</div>
          <div>Danno: {battleResult.damageDealt} PV</div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <div
      className={`absolute flex flex-col items-center justify-center p-4 pointer-events-none satze-battlefield-panel satze-hud-panel ${
        riepilogoOpen ? 'satze-battlefield-panel-riepilogo-open' : ''
      } ${
        gamePhase === 'gameOver' ? 'satze-battlefield-panel-gameover' : ''
      } ${
        isZoomed 
          ? 'satze-battlefield-panel-zoomed animate-battlefield-zoom-smooth' 
          : ''
      }`}
      style={{
        top: isDuelPhase ? 'calc(35% + 50px)' : '50%', 
        left: '50%', 
        transform: isZoomed ? undefined : 'translate(-50%, -50%)',
        width: '200px',
        height: portalFrame
          ? (isDuelPhase ? '360px' : '330px')
          : isDuelPhase ? '320px' : gamePhase === 'gameOver' ? '300px' : '280px',
        zIndex: isDuelPhase || gamePhase === 'gameOver' ? 20 : 10,
        transition: 'top 0.6s ease-out',
        overflow: 'visible',
      }}
    >
      {/* Portale: un solo punto di montaggio per tutto il round, così l'apertura
          animata parte una volta a inizio round e non a ogni cambio di fase */}
      {portalFrame && (gamePhase === 'selectField' || gamePhase === 'selectAgent' || endPortal || ((gamePhase === 'battle' || gamePhase === 'result') && field)) && (
        <div className="satze-bf-portal-slot" style={{ marginLeft: -PORTAL_RX }}>
          <FieldPortal
            key={endPortal ? 'end' : `round-${introRef.current.key}`}
            introKey={endPortal ? introRef.current.key + 1000 : introRef.current.key}
            actions={portalActions}
            turn={endPortal ? null : turn}
            outcome={outcome}
            field={gamePhase === 'selectField' || endPortal ? null : field}
            cursed={cursed}
            curseAccent={curseAccent}
            step={roundStep}
          >
            {gamePhase === 'result' && battleResult && onReplayDuel && (
              <button
                type="button"
                onClick={onReplayDuel}
                className="satze-bf-portal-replay pointer-events-auto"
                aria-label="Rivedi il duello"
                title="Rivedi il duello"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                  <path d="M12 5V1.5L7 6l5 4.5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" />
                </svg>
              </button>
            )}
          </FieldPortal>
          {gamePhase === 'result' && battleResult && duelPhase >= 6 && (
            // il riepilogo si apre sotto i comandi ad arco
            <div ref={riepilogoAnchorRef} className="satze-bf-recap-anchor" aria-hidden />
          )}
          {endPortal && hasAiLog && (
            <div ref={aiLogAnchorRef} className="satze-bf-recap-anchor is-wide" aria-hidden />
          )}
        </div>
      )}
      {gamePhase === 'selectField' && !portalFrame && (
        <div className="text-center satze-bf-select-placeholder">
          <div className="text-amber-400/90 text-sm font-semibold mb-1 tracking-wide">Campo di Battaglia</div>
          <div className="text-slate-400 text-xs">
            {isPlayerFirst ? 'Scegli un campo' : oppWait}
          </div>
        </div>
      )}
      
      {(gamePhase === 'selectAgent' || (gamePhase === 'result' && field)) && (
        <>
          <div className="text-center w-full flex flex-col items-center justify-between h-full py-1 relative">
            {portalFrame ? (
              <div className="flex-1" aria-hidden />
            ) : (
            <div className="flex-1 flex flex-col items-center justify-center group">
              {field ? (
                <>
                  <div className="text-amber-400/90 text-[10px] font-medium mb-2 tracking-widest uppercase">Campo</div>
                  <div className={`mb-2 transition-all duration-300 flex items-center justify-center ${
                    isZoomed ? 'scale-110' : 'hover:scale-105'
                  }`}>
                    <Icon name={field.icon} type="cardIcon" size={32} color="#D4A847" />
                  </div>
                  <div className="text-white text-sm font-semibold mb-1.5">{field.name}</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed px-1 text-center">
                    {field.effect}
                  </div>
                  {cursed && (
                    <div className="satze-bf-curse-mark" style={{ '--curse-accent': curseAccent || '#26c4e8' }}>
                      <FieldCurseOverlay accent={curseAccent} variant="panel" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-amber-400/90 text-[10px] font-medium mb-2 tracking-widest uppercase">Schieramento</div>
                  <div className="text-white text-sm font-semibold mb-1.5">
                    {selectedAgent ? selectedAgent.name : 'Scegli un Agente'}
                  </div>
                  <div className="text-slate-400 text-[11px] leading-relaxed px-1 text-center">
                    {selectedAgent
                      ? 'Conferma lo schieramento. Il Campo si sceglie dopo.'
                      : 'Scegli un Agente dalla mano, poi conferma.'}
                  </div>
                </>
              )}
            </div>
            )}
            
            {/* Pulsante CONFERMA o "L'IA sta pensando..." (solo durante selectAgent) */}
            {!portalFrame && gamePhase === 'selectAgent' && selectedAgent && (
              <div className="w-full mt-2 pointer-events-auto">
                {awaitingEnemySelection ? (
                  <div className="w-full py-2 px-4 bg-white/5 text-slate-400 text-xs font-medium rounded-lg border border-white/10 text-center">
                    {oppThink}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={confirmDisabled}
                    onClick={onConfirm}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg
                             border border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Icon name="sword" type="cardIcon" size={12} color="#fff" /> Conferma
                  </button>
                )}
              </div>
            )}
            
            {/* Barra progresso fasi duello */}
            {gamePhase === 'result' && battleResult && (
              <div className="w-full mt-2">
                {/* con il portale, fase e avanzamento stanno dentro e attorno all'ellisse */}
                {!portalFrame && (
                  <>
                    <div className="text-[10px] text-slate-500 mb-1">
                      {duelPhase >= 0 && duelPhase <= 6 ? DUEL_PHASE_META[duelPhase]?.label ?? '' : ''}
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div 
                        className="h-full bg-amber-400/80 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${computeDuelProgressPercent(duelPhase, battleResult)}%` }}
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-1.5 items-center justify-center mt-2 pointer-events-auto">
                  {onReplayDuel && !portalFrame && (
                    <button
                      type="button"
                      onClick={onReplayDuel}
                      className="satze-hud-duel-btn"
                    >
                      Replay
                    </button>
                  )}
                  {onSkipDuel && duelPhase < 6 && !portalFrame && (
                    <button
                      type="button"
                      onClick={onSkipDuel}
                      className="satze-hud-duel-btn satze-hud-duel-btn--skip"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Pulsante CONTINUA e riepilogo (fase 6) */}
            {!portalFrame && gamePhase === 'result' && battleResult && duelPhase >= 6 && (
              <div className="w-full mt-2 pointer-events-auto">
                {/* Riepilogo Post-Duello (chiuso di default, si apre al clic) */}
                <div ref={riepilogoAnchorRef} className={`w-full mb-2 rounded-lg border border-slate-600/40 bg-slate-900/90 overflow-visible text-[10px] relative z-20${portalFrame ? ' satze-bf-recap' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setRiepilogoOpen((o) => !o)}
                    className={`w-full py-2 px-2 flex items-center justify-between gap-2 text-left font-medium text-slate-400 text-xs uppercase tracking-wide hover:bg-white/5 transition-colors${portalFrame ? ' satze-bf-recap-btn' : ''}`}
                    aria-expanded={riepilogoOpen}
                  >
                    {portalFrame ? (
                      <>
                        <svg className="satze-bf-cta-rune" viewBox="-4 -4 8 8" width="10" height="10" aria-hidden>
                          <path d="M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span className="flex-1">Riepilogo</span>
                        <svg className={`satze-bf-recap-chev${riepilogoOpen ? ' is-open' : ''}`} viewBox="0 0 12 12" width="10" height="10" aria-hidden>
                          <path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Riepilogo</span>
                        <span className="text-slate-500 tabular-nums shrink-0" aria-hidden>
                          {riepilogoOpen ? '▼' : '▶'}
                        </span>
                      </>
                    )}
                  </button>
                  {false && riepilogoOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 px-2 py-2 rounded-b-lg border-x border-b border-slate-600/40 bg-slate-900/95 overflow-y-auto satze-riepilogo-unroll"
                      style={{ zIndex: 30, maxHeight: '128px' }}
                    >
                      {/* Cambi alle Statistiche - IA a sinistra, TU a destra */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* IA */}
                        <div className="bg-slate-800/60 rounded p-2">
                          <div className="text-red-400/90 font-medium mb-1 text-[10px]">IA</div>
                          <div className="text-[10px] space-y-1">
                            <div>
                              <span className="text-amber-400">FC:</span> {formatFocusUsedLabel(battleResult.enemyFocusUsed, battleResult.enemyFocusInvested, battleResult.enemyTemporaryFocus)}
                            </div>
                            {/* POT modificato */}
                            {battleResult.enemyPower !== battleResult.enemyAgent.power && (
                              <div>
                                <span className="text-yellow-400">POT:</span> {battleResult.enemyAgent.power} → {battleResult.enemyPower}
                              </div>
                            )}
                            {/* DAN modificato */}
                            {battleResult.enemyDamage !== battleResult.enemyAgent.damage && (
                              <div>
                                <span className="text-purple-400">DAN:</span> {battleResult.enemyAgent.damage} → {battleResult.enemyDamage}
                              </div>
                            )}
                            {/* VA modificato */}
                            {(() => {
                              const initialVA = battleResult.enemyPower * battleResult.enemyFocusUsed;
                              return battleResult.enemyAssault !== initialVA ? (
                                <div>
                                  <span className="text-purple-400">VA:</span> {initialVA} → {battleResult.enemyAssault}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-purple-400">VA:</span> {battleResult.enemyAssault}
                                </div>
                              );
                            })()}
                            {/* Nessun cambiamento */}
                            {battleResult.enemyPower === battleResult.enemyAgent.power && 
                             battleResult.enemyDamage === battleResult.enemyAgent.damage &&
                             battleResult.enemyAssault === (battleResult.enemyPower * battleResult.enemyFocusUsed) && (
                              <div className="text-slate-500 text-[9px] opacity-80">—</div>
                            )}
                          </div>
                        </div>
                        
                        {/* TU */}
                        <div className="bg-slate-800/60 rounded p-2">
                          <div className="text-green-400/90 font-medium mb-1 text-[10px]">TU</div>
                          <div className="text-[10px] space-y-1">
                            <div>
                              <span className="text-amber-400">FC:</span> {formatFocusUsedLabel(battleResult.playerFocusUsed, battleResult.playerFocusInvested, battleResult.playerTemporaryFocus)}
                            </div>
                            {/* POT modificato */}
                            {battleResult.playerPower !== battleResult.playerAgent.power && (
                              <div>
                                <span className="text-yellow-400">POT:</span> {battleResult.playerAgent.power} → {battleResult.playerPower}
                              </div>
                            )}
                            {/* DAN modificato */}
                            {battleResult.playerDamage !== battleResult.playerAgent.damage && (
                              <div>
                                <span className="text-purple-400">DAN:</span> {battleResult.playerAgent.damage} → {battleResult.playerDamage}
                              </div>
                            )}
                            {/* VA modificato */}
                            {(() => {
                              const initialVA = battleResult.playerPower * battleResult.playerFocusUsed;
                              return battleResult.playerAssault !== initialVA ? (
                                <div>
                                  <span className="text-purple-400">VA:</span> {initialVA} → {battleResult.playerAssault}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-purple-400">VA:</span> {battleResult.playerAssault}
                                </div>
                              );
                            })()}
                            {/* Nessun cambiamento */}
                            {battleResult.playerPower === battleResult.playerAgent.power && 
                             battleResult.playerDamage === battleResult.playerAgent.damage &&
                             battleResult.playerAssault === (battleResult.playerPower * battleResult.playerFocusUsed) && (
                              <div className="text-slate-500 text-[9px] opacity-80">—</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Statistiche Duello */}
                      <div className="border-t border-slate-600/40 pt-1.5 mt-1.5">
                        <div className="text-slate-500 text-[10px] space-y-1">
                          <div>
                            {formatFocusInvestedLine(battleResult)}
                          </div>
                          <div>
                            Danno: {battleResult.damageDealt} PV
                          </div>
                        </div>
                      </div>
                    </div>
                      )}
                    </div>
                    
                    {/* Pulsante CONTINUA */}
                    <div className="w-full" style={riepilogoOpen ? { transform: 'translateY(132px)' } : undefined}>
                      {portalFrame ? (
                        <button type="button" onClick={onContinue} className="satze-bf-cta">
                          <span className="satze-bf-cta-label">Continua</span>
                          <svg className="satze-bf-cta-chev" viewBox="0 0 16 12" width="14" height="11" aria-hidden>
                            <path d="M2 2 L6 6 L2 10 M8 2 L12 6 L8 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                          </svg>
                        </button>
                      ) : (
                      <button
                        onClick={onContinue}
                        className="w-full py-2 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg
                                 border border-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Icon name="check" type="cardIcon" size={12} color="#fff" /> Continua
                      </button>
                      )}
                    </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {gamePhase === 'gameOver' && endGameActionsReady && !portalFrame && (
        <div className="text-center space-y-3 pointer-events-auto satze-endgame-actions w-full">
          <div className={`text-base font-semibold flex items-center justify-center gap-2 ${
            gameResult?.winner === 'player' ? 'satze-result-victory' : 
            gameResult?.winner === 'draw' ? 'text-slate-400' : 'satze-result-defeat'
          }`}>
            {gameResult?.winner === 'player' ? <><Icon name="star" type="cardIcon" size={20} color="#4FD1C5" /> Vittoria</> : 
             gameResult?.winner === 'draw' ? <><Icon name="check" type="cardIcon" size={20} /> Pareggio</> : <><Icon name="skull" type="cardIcon" size={20} color="#D946EF" /> Sconfitta</>}
          </div>
          <div className="text-[11px] text-slate-500">
            {gameResult?.winner === 'player' && getDuelOutcomeSubtitle(gameResult, 'win')}
            {gameResult?.winner === 'enemy' && getDuelOutcomeSubtitle(gameResult, 'lose')}
            {gameResult?.winner === 'draw' && 'Pareggio'}
          </div>
          <div className="flex flex-col gap-2 w-full">
            {isCampaign ? <button type="button" onClick={gameResult?.winner === 'player' ? onMenu : onCampaignRetry}
              className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium rounded-lg border border-amber-400/40 transition-all">
              {gameResult?.winner === 'player' ? 'Prosegui' : 'Ritenta'}
            </button> : <>
            {onRematch && (
              <button
                type="button"
                onClick={onRematch}
                className="w-full py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium rounded-lg border border-amber-400/40 transition-all"
              >
                {rematchLabel}
              </button>
            )}
            {onRematchChangeDeck && (
              <button
                type="button"
                onClick={onRematchChangeDeck}
                className="w-full py-2 px-4 bg-violet-500/20 hover:bg-violet-500/30 text-violet-100 text-xs font-medium rounded-lg border border-violet-400/40 transition-all"
              >
                {rematchChangeDeckLabel}
              </button>
            )}
            {!isOnlinePvP && Array.isArray(aiDecisionLog) && aiDecisionLog.length > 0 && (
              <div className="w-full rounded-lg border border-sky-500/30 bg-sky-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAiLogOpen((v) => !v)}
                  className="w-full py-2 px-3 text-sky-100 text-[11px] font-medium flex items-center justify-between gap-2 hover:bg-sky-900/40 transition-colors"
                >
                  <span>Ragionamenti IA ({aiDecisionLog.length})</span>
                  <span className="text-sky-300/80">{aiLogOpen ? '▲' : '▼'}</span>
                </button>
                {aiLogOpen && (
                  <div className="px-2 pb-2 max-h-44 overflow-y-auto space-y-2 border-t border-sky-500/20">
                    {aiDecisionLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md bg-slate-900/70 px-2 py-1.5 text-left"
                      >
                        <div className="text-[10px] font-semibold text-sky-200/95 mb-1">
                          {entry.headline}
                        </div>
                        <ul className="space-y-0.5">
                          {(entry.considerations || []).slice(0, 12).map((line, idx) => (
                            <li key={`${entry.id}-${idx}`} className="text-[9px] leading-snug text-slate-300/90">
                              · {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {onCopyAiDecisionLog && (
                      <button
                        type="button"
                        onClick={() => {
                          onCopyAiDecisionLog();
                          setAiLogCopied(true);
                          window.setTimeout(() => setAiLogCopied(false), 1600);
                        }}
                        className="w-full mt-1 py-1.5 px-2 rounded border border-sky-400/30 text-[10px] text-sky-100/90 hover:bg-sky-900/50 transition-colors"
                      >
                        {aiLogCopied ? 'Copiato' : 'Copia log completo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onMenu}
              className="w-full py-2 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg border border-white/20 transition-all"
            >
              Menù
            </button>
            </>}
          </div>
          {!isCampaign && onOpenPlaytest && (
            <button
              type="button"
              onClick={onOpenPlaytest}
              className="w-full py-2 px-4 bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-500/40 transition-all"
            >
              Storico Playtest
            </button>
          )}
        </div>
      )}
    </div>
    {riepilogoOpen && riepilogoRect && riepilogoContent && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-auto text-[10px]"
            style={{
              position: 'fixed',
              left: riepilogoRect.left,
              top: riepilogoRect.top,
              width: riepilogoRect.width,
              zIndex: 9999,
            }}
          >
            {portalFrame ? riepilogoHud : riepilogoContent}
          </div>,
          document.body
        )
      : null}
    {aiLogOpen && aiLogRect && aiLogHud && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-auto text-[10px]"
            style={{ position: 'fixed', left: aiLogRect.left, top: aiLogRect.top, width: aiLogRect.width, zIndex: 9999 }}
          >
            {aiLogHud}
          </div>,
          document.body
        )
      : null}
    </>
  );
};
