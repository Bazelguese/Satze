// ============================================================
// ArmySelectCinematic.jsx — Schermata "Scegli la tua armata"
// ============================================================
// Compendium stile Persona (stesso guscio della Galleria): elenco armate a
// sinistra, emblema + bonus / stile / note / storia a destra, SCHIERA.
// I testi per ogni armata (synopsis / motto / bonusExplain / style / tips)
// si modificano in `armyLore.js`.
// Tastiera: ↑/↓ (o ←/→) armata · Invio schiera · Esc indietro.
//
// Props:
//   onSelect(armyName: string | null)  // null = "Eserciti Personalizzati"
//   onBack()                           // torna al menu
//
// Si renderizza fullscreen (position: absolute). Renderizzala al
// livello del routing, NON dentro CosmicScreenLayout o altri wrapper.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ARMY_COLORS,
  ARMY_BONUSES,
  ARMY_GIFS,
  ARMY_ICONS,
} from '../../../data/armies.js';
import { ARMY_SETS, ARMY_DECKS } from '../../../data/cards.js';
import { ARMY_LORE, MIXED_ARMIES_LORE } from './armyLore.js';
import { GAME_SOUND, playGame, playUiClick } from '../../../audio/gameSounds.js';
import {
  GalleryPersonaShell,
  PersonaList,
  GP_STAR_CLIP,
  armyBgUrl,
} from '../gallery/GalleryPersonaShell.jsx';
// ------------------------------------------------------------
// Adapter: traduce i dati reali del gioco nel formato usato dal V3
// ------------------------------------------------------------
function buildArmies() {
  const list = [];

  // Voce speciale "Eserciti Personalizzati" (tutti i mazzi creati dall'utente)
  list.push({
    id: 'mixed',
    name: 'Eserciti Personalizzati',
    color: '#a78bfa',
    bg: null,
    portrait: null,
    glyph: MIXED_ARMIES_LORE.glyph || '⚔',
    cards: 0,
    decks: 0,
    bonus: null,
    bonusLabel: MIXED_ARMIES_LORE.bonusLabel || 'NESSUNO',
    bonusWhen: MIXED_ARMIES_LORE.bonusWhen || '',
    bonusExplain: MIXED_ARMIES_LORE.bonusExplain || '',
    motto: MIXED_ARMIES_LORE.motto || '',
    synopsis: MIXED_ARMIES_LORE.synopsis || '',
    style: MIXED_ARMIES_LORE.style || '',
    tips: MIXED_ARMIES_LORE.tips || '',
    isMixed: true,
  });

  for (const armyName of Object.keys(ARMY_SETS)) {
    const lore = ARMY_LORE[armyName] || {};
    const cards = ARMY_SETS[armyName] || [];
    const decks = ARMY_DECKS?.[armyName] ? Object.keys(ARMY_DECKS[armyName]).length : 2;
    const colors = ARMY_COLORS[armyName] || { accent: '#94a3b8' };
    const bonus = ARMY_BONUSES[armyName];
    const bg = ARMY_GIFS[armyName] || null;

    list.push({
      id: armyName,
      name: armyName,
      color: colors.accent,
      bg,
      portrait: ARMY_ICONS[armyName] || null,
      glyph: lore.glyph || '◈',
      cards: cards.length,
      decks,
      bonus: bonus?.description || '—',
      bonusLabel: lore.bonusLabel || (bonus?.trigger ? bonus.trigger.toUpperCase() : 'PASSIVO'),
      bonusWhen: lore.bonusWhen || '',
      bonusExplain: lore.bonusExplain || '',
      bonusHighlight: lore.bonusHighlight || '',
      motto: lore.motto || '',
      synopsis: lore.synopsis || lore.lore || '',
      style: lore.style || '',
      tips: lore.tips || '',
      isMixed: false,
    });
  }

  return list;
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================

export default function ArmySelectCinematic({ onSelect, onBack }) {
  const ARMIES = React.useMemo(() => buildArmies(), []);
  const [idx, setIdx] = useState(1);
  const [phase, setPhase] = useState('intro'); // intro -> idle -> confirming
  const phaseRef = React.useRef(phase);
  const idxRef = React.useRef(idx);

  const total = ARMIES.length;
  const army = ARMIES[idx];
  phaseRef.current = phase;
  idxRef.current = idx;

  // Le lame d'ingresso del guscio durano ~0.6s: poi si può confermare.
  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 650);
    return () => clearTimeout(t);
  }, []);

  const goTo = useCallback((i) => {
    if (phaseRef.current === 'confirming') return;
    const next = (i + total) % total;
    if (next === idxRef.current) return;
    playUiClick();
    setIdx(next);
  }, [total]);

  const go = useCallback((delta) => goTo(idxRef.current + delta), [goTo]);

  const confirmArmy = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    playGame(GAME_SOUND.ARMY_CONFIRM);
    setPhase('confirming');
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSelect && onSelect(army.isMixed ? null : army.name);
        });
      });
    }, 1660);
  }, [army.isMixed, army.name, onSelect]);

  const listItems = React.useMemo(() => ARMIES.map((a, i) => ({
    key: a.id,
    number: String(i + 1).padStart(2, '0'),
    title: a.name,
    sub: a.isMixed ? 'I tuoi mazzi' : `Bonus · ${a.bonusLabel}`,
    meta: a.isMixed ? '' : `${a.cards} carte`,
    accent: a.color,
    icon: a.portrait || null,
    glyph: a.glyph,
  })), [ARMIES]);

  return (
    <>
      <GalleryPersonaShell
        accent={army.color}
        section="FASE I"
        eyebrow="SCHIERAMENTO"
        title={army.name}
        motto={army.motto}
        watermark="ARMATA"
        bgImage={army.isMixed ? null : armyBgUrl(army.name)}
        counterLabel="ARMATA"
        counterCurrent={idx + 1}
        counterTotal={total}
        onBack={() => { if (phaseRef.current !== 'confirming') { playUiClick(); onBack?.(); } }}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onRailPrev={() => go(-1)}
        onRailNext={() => go(1)}
        onConfirm={confirmArmy}
        hints={[
          { keys: ['↑', '↓'], label: 'ARMATA' },
          { keys: ['↵'], label: 'SCHIERA' },
          { keys: ['ESC'], label: 'MENU' },
        ]}
        list={<PersonaList items={listItems} activeIndex={idx} onSelect={goTo} />}
        stage={<ArmyStage key={army.id} army={army} onConfirm={confirmArmy} />}
      />
      {phase === 'confirming' && <ConfirmTransition army={army} />}
      <ArmySelectStyles />
    </>
  );
}

// ============================================================
// STAGE: emblema, bonus, stile, note, storia, SCHIERA
// ============================================================

function ArmyStage({ army, onConfirm }) {
  const synopsisBlocks = (army.synopsis || '').split(/\n\n+/).filter(Boolean);
  return (
    <div className="asp-stage" style={{ '--accent': army.color }}>
      <div className="asp-left">
        <div className="asp-emblem">
          <span className="asp-emblem-burst" aria-hidden="true" />
          <span className="asp-emblem-ring" aria-hidden="true" />
          {army.portrait
            ? <img className="asp-emblem-img" src={army.portrait} alt="" draggable={false} />
            : <span className="asp-emblem-glyph">{army.glyph}</span>}
        </div>

        {!army.isMixed && (
          <div className="asp-meta gp-anim-swipe d1">
            <span><b>{army.cards}</b> carte</span>
            <span><b>{army.decks}</b> eserciti</span>
          </div>
        )}

        <button type="button" className="asp-confirm" onClick={onConfirm}>
          <span className="in">
            <span className="lbl">SCHIERA</span>
            <kbd>↵</kbd>
          </span>
        </button>
      </div>

      <div className="asp-right">
        <div className="asp-scroll">
          <div className="gp-panel gp-panel--light asp-bonus gp-anim-swipe d1">
            <div className="gp-panel-label">BONUS · {army.bonusLabel}</div>
            {army.bonusHighlight && (
              <div className="asp-highlight">
                <span className="tag">DIVERSO DALLE ALTRE</span>
                <p>{army.bonusHighlight}</p>
              </div>
            )}
            {army.bonusWhen && <p className="asp-when">{army.bonusWhen}</p>}
            {army.bonusExplain && <p className="asp-explain">{army.bonusExplain}</p>}
            {army.bonus
              ? <div className="asp-bonus-val">{army.bonus}</div>
              : !army.bonusExplain && <div className="asp-bonus-val">— Multi-Armata —</div>}
          </div>

          {(army.style || army.tips) && (
            <div className="asp-grid gp-anim-swipe d2">
              {army.style && (
                <div className="gp-panel">
                  <div className="gp-panel-label">STILE CONSIGLIATO</div>
                  <p className="asp-txt">{army.style}</p>
                </div>
              )}
              {army.tips && (
                <div className="gp-panel">
                  <div className="gp-panel-label">NOTE TATTICHE</div>
                  <p className="asp-txt">{army.tips}</p>
                </div>
              )}
            </div>
          )}

          {synopsisBlocks.length > 0 && (
            <div className="gp-panel asp-story gp-anim-swipe d3">
              <div className="gp-panel-label">{army.isMixed ? 'COSA TROVI QUI' : 'STORIA'}</div>
              {synopsisBlocks.map((block, i) => <p key={i}>{block}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmTransition({ army }) {
  return (
    <div className="asp-confirming" style={{ '--accent': army.color }}>
      <div className="asp-confirming-blades" aria-hidden="true"><span /><span /><span /></div>
      <div className="asp-confirming-text">
        <div className="eye">SIGILLO IMPRESSO</div>
        <div className="nm"><span>{army.name}</span></div>
        <div className="next">Apertura → Scelta dell&apos;esercito</div>
      </div>
    </div>
  );
}

function ArmySelectStyles() {
  return (
    <style>{`
      .asp-stage { position: absolute; inset: 0; display: grid; grid-template-columns: 400px 1fr; gap: 40px; }

      /* Sinistra: emblema + meta + SCHIERA */
      .asp-left { display: flex; flex-direction: column; align-items: center; gap: 22px; padding-top: 60px; min-height: 0; }
      .asp-emblem {
        position: relative; width: 360px; height: 360px; display: grid; place-items: center;
        animation: gp-slam .55s cubic-bezier(.2,.9,.25,1) both;
      }
      .asp-emblem-burst {
        position: absolute; inset: 0; background: var(--accent);
        clip-path: ${GP_STAR_CLIP};
        filter: drop-shadow(10px 10px 0 #050507);
        animation: gp-burst-spin 30s linear infinite;
      }
      .asp-emblem-ring {
        position: absolute; inset: 52px; border-radius: 50%; background: #050507;
        box-shadow: 0 0 0 6px #f5f3eb;
      }
      .asp-emblem-img {
        position: relative; width: 230px; height: 230px; object-fit: contain;
        filter: drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 60%, transparent));
      }
      .asp-emblem-glyph { position: relative; font-size: 140px; line-height: 1; color: var(--accent); }

      .asp-meta { display: flex; gap: 10px; transform: rotate(-3deg); }
      .asp-meta span {
        background: #050507; color: #f5f3eb; padding: 4px 14px; transform: skewX(-14deg);
        font-weight: 600; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase;
        box-shadow: 4px 4px 0 var(--accent);
      }
      .asp-meta b { font-size: 22px; font-style: italic; margin-right: 4px; }

      .asp-confirm {
        margin-top: auto; margin-bottom: 18px; width: 360px;
        border: 0; padding: 0; cursor: pointer; background: transparent; font-family: inherit;
      }
      .asp-confirm .in {
        display: flex; align-items: center; justify-content: space-between; gap: 14px;
        height: 92px; padding: 0 22px 0 30px;
        background: var(--accent); color: #050507;
        font-weight: 700; font-style: italic; font-size: 52px; letter-spacing: 0.01em;
        transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 9px 9px 0 #f5f3eb;
        transition: transform .15s, box-shadow .15s;
        animation: asp-ready 1.6s ease-in-out infinite;
      }
      .asp-confirm .in > * { transform: skewX(14deg); }
      .asp-confirm .in kbd { background: #050507; color: #f5f3eb; font-size: 20px; min-width: 40px; height: 34px; }
      .asp-confirm:hover .in, .asp-confirm:focus-visible .in {
        transform: skewX(-14deg) rotate(-3deg) translate(-4px,-4px);
        box-shadow: 13px 13px 0 #f5f3eb;
      }
      @keyframes asp-ready { 50% { box-shadow: 9px 9px 0 #f5f3eb, 0 0 40px color-mix(in srgb, var(--accent) 70%, transparent); } }

      /* Destra: targa + pannelli */
      .asp-right { display: flex; flex-direction: column; gap: 18px; min-height: 0; padding: 40px 0 10px; }
      .asp-scroll {
        flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none;
        display: flex; flex-direction: column; gap: 14px; padding: 4px 6px 10px 0;
      }
      .asp-scroll::-webkit-scrollbar { display: none; }
      .asp-bonus p { margin: 0; }
      .asp-when { font-style: italic; font-weight: 600; font-size: 15px; opacity: 0.75; margin-bottom: 6px !important; }
      .asp-explain { font-weight: 600; font-size: 19px; line-height: 1.35; }
      .asp-bonus-val {
        display: inline-block; margin-top: 10px; padding: 3px 12px;
        background: #050507; color: #f5f3eb; font-weight: 700; font-size: 15px; letter-spacing: 0.04em;
        transform: skewX(-12deg);
      }
      .asp-highlight { margin: 2px 0 10px; padding: 8px 12px; background: color-mix(in srgb, var(--accent) 22%, #f5f3eb); }
      .asp-highlight .tag {
        display: inline-block; margin-bottom: 4px; background: #050507; color: #f5f3eb;
        font-weight: 700; font-size: 11px; letter-spacing: 0.2em; padding: 1px 8px;
      }
      .asp-highlight p { font-size: 15px; line-height: 1.4; }
      .asp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .asp-txt { margin: 0; font-size: 15px; line-height: 1.5; color: rgba(245,243,235,0.9); }
      .asp-story p { margin: 0 0 10px; font-size: 15px; line-height: 1.55; color: rgba(245,243,235,0.85); }
      .asp-story p:last-child { margin-bottom: 0; }

      /* Conferma */
      .asp-confirming {
        position: absolute; inset: 0; z-index: 200; display: grid; place-items: center;
        background: rgba(5,5,7,0.9); animation: asp-fade .2s ease both;
      }
      @keyframes asp-fade { from { opacity: 0; } }
      .asp-confirming-blades { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
      .asp-confirming-blades > span {
        position: absolute; top: -30%; bottom: -30%; width: 38%;
        transform: skewX(-18deg) translateX(-260%);
        animation: asp-blade .75s cubic-bezier(.7,0,.3,1) forwards;
      }
      .asp-confirming-blades > span:nth-child(1) { left: 0; background: var(--accent); }
      .asp-confirming-blades > span:nth-child(2) { left: 34%; background: #f5f3eb; animation-delay: .06s; }
      .asp-confirming-blades > span:nth-child(3) { left: 68%; background: var(--accent); animation-delay: .12s; }
      @keyframes asp-blade { 60% { transform: skewX(-18deg) translateX(0); } 100% { transform: skewX(-18deg) translateX(280%); } }
      .asp-confirming-text {
        position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px;
        transform: rotate(-3deg); animation: asp-txt 1.4s ease both;
      }
      @keyframes asp-txt { 0%, 30% { opacity: 0; transform: rotate(-3deg) scale(1.3); } 45% { opacity: 1; transform: rotate(-3deg) scale(1); } }
      .asp-confirming-text .eye {
        background: var(--accent); color: #050507; font-weight: 700; font-size: 20px; letter-spacing: 0.4em;
        padding: 4px 20px; transform: skewX(-14deg);
      }
      .asp-confirming-text .nm {
        background: #f5f3eb; color: #050507; font-weight: 700; font-style: italic; font-size: 76px; line-height: 1;
        text-transform: uppercase; padding: 12px 40px; box-shadow: 12px 12px 0 var(--accent);
      }
      .asp-confirming-text .next {
        font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.24em; text-transform: uppercase; color: #f5f3eb;
      }

      @media (prefers-reduced-motion: reduce) {
        .asp-stage *, .asp-confirming * { animation-duration: 0.001s !important; animation-iteration-count: 1 !important; }
      }
    `}</style>
  );
}
