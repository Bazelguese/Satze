import React, { useRef, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import { Icon } from '../ui/Icon';

// DeckSelectCosmic — Scelta Mazzo pre-duello in stile V5 Cosmic
// Layout: header fight intro / centro: carosello mazzi / dettagli + schiera
const DEFAULT_OPPONENT = { name: 'AVVERSARIO', faction: 'IA', level: '—', sigil: 'X' };
const DEFAULT_TRIGGERS = [
  { n: 'RESA DEI CONTI', v: 8 },
  { n: 'CONQUISTA', v: 6 },
  { n: 'SEMPRE', v: 12 },
  { n: 'GLORIA', v: 4 },
];

function DeckSelectCosmic({
  decks = [],
  opponent = DEFAULT_OPPONENT,
  mapName = 'PIANE DEL DEBITO',
  mode = 'DUELLO 1v1',
  initialIndex = 0,
  onSelectDeck = () => {},
  onBack = () => {},
  onPreviewDeck = null,
  onEditDeck = null,
}) {
  const ACCENT = MENU_ACCENTS.magenta;
  const HEAT = MENU_ACCENTS.pink;
  const VIOLET = '#a78bfa';
  const DEEP = '#581c87';
  const BG = MENU_ACCENTS.void;

  const safeDecks = decks.length
    ? decks
    : [
        {
          id: '__empty',
          name: 'Nessun esercito',
          fac: '—',
          sigil: '◇',
          cards: 0,
          lega: 0,
          pot: 0,
          dan: 0,
          win: 0,
          lead: '',
          warning: 'Nessun esercito disponibile',
        },
      ];
  const [active, setActive] = useState(Math.min(initialIndex, safeDecks.length - 1));
  const wheelCooldownRef = useRef(0);
  const cur = safeDecks[active];
  const bgPrimary = cur.bgColor || ACCENT;
  const bgSecondary = cur.bgColorSecondary || VIOLET;
  const triggerColors = [HEAT, '#22d3ee', VIOLET, '#fbbf24'];
  const triggers = (cur.triggers || DEFAULT_TRIGGERS).slice(0, 4);
  const curveData = cur.curve || [8, 14, 6, 2, 0];
  const curveMax = Math.max(...curveData, 1);
  const visibleDeckEntries =
    safeDecks.length >= 3
      ? [-1, 0, 1].map((offset) => {
          const index = (active + offset + safeDecks.length) % safeDecks.length;
          return { deck: safeDecks[index], index, offset };
        })
      : safeDecks.map((deck, index) => ({ deck, index, offset: index - active }));

  const handleCarouselWheel = (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - wheelCooldownRef.current < 180) return;
    wheelCooldownRef.current = now;
    if (event.deltaY > 0) {
      setActive((prev) => (prev + 1) % safeDecks.length);
    } else if (event.deltaY < 0) {
      setActive((prev) => (prev - 1 + safeDecks.length) % safeDecks.length);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: BG,
        color: MENU_ACCENTS.text,
        fontFamily: 'Chakra Petch, sans-serif',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${bgPrimary}44 0%, ${bgSecondary}26 42%, ${MENU_ACCENTS.void} 90%)`,
        }}
      />
      {/* Halftone */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
          backgroundSize: '8px 8px',
        }}
      />
      {/* Giant SCELTA bg */}
      <div
        style={{
          position: 'absolute',
          top: 125,
          left: 20,
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: 320,
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          color: `${ACCENT}22`,
          WebkitTextStroke: `3px ${ACCENT}66`,
          textShadow: `0 0 26px ${ACCENT}66`,
          transform: 'skewX(-8deg) rotate(-2deg)',
          animation: 'cosmic-schiera-flicker 4.8s ease-in-out infinite',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        SCHIERA
        <br />
        IL TUO
        <br />
        ESERCITO
      </div>

      {/* === TOP BAR === */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px 36px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${ACCENT}33`,
        }}
      >
        <button
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${VIOLET}88`,
            color: VIOLET,
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.3em',
            fontWeight: 700,
            clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
            cursor: 'pointer',
          }}
          onClick={onBack}
        >
          ← INDIETRO
        </button>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 10,
              color: HEAT,
              letterSpacing: '0.5em',
            }}
          >
            · DUELLO IMMINENTE ·
          </div>
          <div
            style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: '0.32em',
              color: MENU_ACCENTS.text,
              marginTop: 4,
              textShadow: `2px 2px 0 ${ACCENT}88`,
            }}
          >
            SCELTA ESERCITO
          </div>
          <div
            style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9,
              color: '#94a3b8',
              letterSpacing: '0.4em',
              marginTop: 4,
            }}
          >
            {safeDecks.length} {safeDecks.length === 1 ? 'ESERCITO' : 'ESERCITI'} DISPONIBILI · SELEZIONA
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9,
              color: '#94a3b8',
              letterSpacing: '0.3em',
            }}
          >
            AVVERSARIO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
                clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Cinzel, serif',
                fontWeight: 900,
                fontSize: 12,
                color: MENU_ACCENTS.void,
              }}
            >
              {opponent.sigil || 'X'}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.15em',
                  color: MENU_ACCENTS.text,
                }}
              >
                {(opponent.name || 'AVVERSARIO').toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: HEAT, letterSpacing: '0.3em' }}>
                {(opponent.faction || '').toUpperCase()}
                {opponent.level != null ? ' · LIV ' + opponent.level : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === MAIN: carousel + details === */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 28,
          padding: '24px 36px',
          height: 'calc(100% - 92px - 90px)',
        }}
      >
        {/* === CAROUSEL === */}
        <div onWheel={handleCarouselWheel} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          {/* Prev arrow */}
          <button onClick={() => setActive((active - 1 + safeDecks.length) % safeDecks.length)} style={navArrow(VIOLET, false)}>
            ‹
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center', perspective: '1400px', transformStyle: 'preserve-3d' }}>
            {visibleDeckEntries.map(({ deck, index, offset }) => (
              <DeckCard
                key={`${deck.id}_${index}`}
                deck={deck}
                offset={offset}
                active={offset === 0}
                onClick={() => setActive(index)}
                ACCENT={ACCENT}
                HEAT={HEAT}
                VIOLET={VIOLET}
                DEEP={DEEP}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button onClick={() => setActive((active + 1) % safeDecks.length)} style={navArrow(VIOLET, true)}>
            ›
          </button>

          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {safeDecks.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? 28 : 8,
                  height: 4,
                  background: i === active ? HEAT : `${VIOLET}55`,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>
        </div>

        {/* === DETAILS PANEL === */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: 'linear-gradient(180deg, rgba(14,5,24,0.86) 0%, rgba(6,3,10,0.82) 100%)',
            border: `1px solid ${ACCENT}55`,
            padding: 22,
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
            boxShadow: `0 0 32px ${ACCENT}33, inset 0 0 40px rgba(0,0,0,0.5)`,
          }}
        >
          {/* faction badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 50,
                height: 56,
                background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
                clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: MENU_ACCENTS.void,
                boxShadow: `0 0 20px ${HEAT}88`,
              }}
            >
              {cur.sigil}
            </div>
            <div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: HEAT, letterSpacing: '0.4em' }}>FAZIONE · {cur.fac}</div>
              <div
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: '0.16em',
                  color: MENU_ACCENTS.text,
                  marginTop: 3,
                  textShadow: `1px 1px 0 ${ACCENT}99`,
                }}
              >
                «{cur.name}»
              </div>
            </div>
          </div>

          {/* warning if any */}
          {cur.warning && (
            <div
              style={{
                marginTop: 16,
                padding: '6px 10px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.6)',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 10,
                color: '#fca5a5',
                letterSpacing: '0.2em',
                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
              }}
            >
              ⚠ {cur.warning.toUpperCase()}
            </div>
          )}

          {/* big stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
            <BigStat label="POT MED" value={cur.pot} c={HEAT} />
            <BigStat label="DAN MED" value={cur.dan} c={VIOLET} />
            <BigStat label="LEGA TOT" value={`${cur.lega}/30`} c="#22d3ee" />
            <BigStat label="STATO" value={cur.warning ? 'CHECK' : 'OK'} c={cur.warning ? '#fca5a5' : '#22c55e'} />
          </div>

          {/* mana curve */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: '#94a3b8', letterSpacing: '0.35em', marginBottom: 16 }}>// CURVA LEGA</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64, padding: '0 4px', borderBottom: `1px solid ${ACCENT}55` }}>
              {curveData.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: '100%',
                      height: (h / curveMax) * 56,
                      background: i <= 1 ? HEAT : ACCENT,
                      boxShadow: `0 0 8px ${i <= 1 ? HEAT : ACCENT}88`,
                    }}
                  />
                  <span style={{ fontSize: 8, color: '#94a3b8', fontFamily: 'Share Tech Mono, monospace' }}>{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* trigger breakdown */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: '#94a3b8', letterSpacing: '0.35em', marginBottom: 6 }}>// TRIGGER PRINCIPALI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {triggers.map((tr, i) => {
                const t = { ...tr, c: tr.c || triggerColors[i % triggerColors.length] };
                const triggerMax = Math.max(...triggers.map((x) => x.v), 1);
                return (
                  <div key={t.n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }}>
                    <span style={{ minWidth: 118, color: t.c, fontWeight: 700, letterSpacing: '0.12em' }}>{t.n}</span>
                    <div style={{ flex: 1, height: 4, background: `${t.c}22`, position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${(t.v / triggerMax) * 100}%`,
                          background: t.c,
                          boxShadow: `0 0 8px ${t.c}99`,
                        }}
                      />
                    </div>
                    <span style={{ color: MENU_ACCENTS.text, fontWeight: 700, minWidth: 18, textAlign: 'right' }}>{t.v}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* spacer push button down */}
          <div style={{ flex: 1 }} />

          {/* bottom buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: `1px solid ${VIOLET}88`,
                color: VIOLET,
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 9,
                letterSpacing: '0.3em',
                fontWeight: 700,
                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                cursor: onPreviewDeck ? 'pointer' : 'not-allowed',
                opacity: onPreviewDeck ? 1 : 0.4,
              }}
              onClick={() => onPreviewDeck && onPreviewDeck(cur)}
            >
              👁 ANTEPRIMA
            </button>
            <button
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: `1px solid ${VIOLET}88`,
                color: VIOLET,
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 9,
                letterSpacing: '0.3em',
                fontWeight: 700,
                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                cursor: onEditDeck ? 'pointer' : 'not-allowed',
                opacity: onEditDeck ? 1 : 0.4,
              }}
              onClick={() => onEditDeck && onEditDeck(cur)}
            >
              ✎ MODIFICA
            </button>
          </div>

          <button
            style={{
              position: 'relative',
              padding: '16px 0',
              background: cur.warning ? '#3a2030' : `linear-gradient(90deg, ${ACCENT} 0%, ${HEAT} 100%)`,
              border: 'none',
              color: cur.warning ? '#94a3b8' : MENU_ACCENTS.void,
              fontFamily: 'Cinzel, serif',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: '0.32em',
              cursor: cur.warning ? 'not-allowed' : 'pointer',
              clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
              boxShadow: cur.warning ? 'none' : `0 0 28px ${HEAT}aa, 0 4px 0 ${DEEP}`,
              textShadow: cur.warning ? 'none' : `1px 1px 0 ${MENU_ACCENTS.text}`,
            }}
            disabled={!!cur.warning}
            onClick={() => !cur.warning && onSelectDeck(cur)}
          >
            {cur.warning ? 'ESERCITO INCOMPLETO' : 'SCHIERA ESERCITO ›'}
          </button>
        </div>
      </div>

      {/* === FOOTER MARQUEE === */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 30,
          background: ACCENT,
          clipPath: 'polygon(0 6px, 100% 0, 100% 100%, 0 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
          zIndex: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: MENU_ACCENTS.void,
            padding: '0 24px',
            animation: 'data-marquee 60s linear infinite',
          }}
        >
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <span key={i}>
                SCHIERA · {mode.toUpperCase()} · {(opponent.faction || '').toUpperCase()} · MAPPA: {mapName.toUpperCase()} · {(opponent.name || '').toUpperCase()} ·{' '}
              </span>
            ))}
        </div>
      </div>

      {/* corner brackets */}
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <div
          key={c}
          style={{
            position: 'absolute',
            top: c.startsWith('t') ? 8 : 'auto',
            bottom: c.startsWith('b') ? 38 : 'auto',
            left: c.endsWith('l') ? 8 : 'auto',
            right: c.endsWith('r') ? 8 : 'auto',
            width: 22,
            height: 22,
            borderTop: c.startsWith('t') ? `2px solid ${HEAT}` : 'none',
            borderBottom: c.startsWith('b') ? `2px solid ${HEAT}` : 'none',
            borderLeft: c.endsWith('l') ? `2px solid ${HEAT}` : 'none',
            borderRight: c.endsWith('r') ? `2px solid ${HEAT}` : 'none',
            zIndex: 9,
          }}
        />
      ))}
    </div>
  );
}

function navArrow(c, right) {
  return {
    width: 44,
    height: 64,
    background: `${c}22`,
    border: `1px solid ${c}88`,
    color: c,
    fontFamily: 'Cinzel, serif',
    fontWeight: 900,
    fontSize: 32,
    lineHeight: 1,
    cursor: 'pointer',
    clipPath: right
      ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
      : 'polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)',
    flexShrink: 0,
  };
}

function BigStat({ label, value, c }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: MENU_ACCENTS.void,
        border: `1px solid ${c}55`,
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
      }}
    >
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: '#94a3b8', letterSpacing: '0.35em' }}>{label}</div>
      <div
        style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: 30,
          color: c,
          textShadow: `0 0 10px ${c}77`,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DeckCard({ deck, offset, active, onClick, ACCENT, HEAT, VIOLET, DEEP }) {
  const [hover, setHover] = useState(false);
  const isSide = !active && Math.abs(offset) === 1;
  const opacity = active ? 1 : isSide ? 0.7 : 0.35;
  const xShift = offset > 0 ? -10 : offset < 0 ? 10 : 0;
  const yShift = active && hover ? -6 : 0;
  const scale = active ? 1.03 : 1;
  const rotateY = active ? 0 : offset > 0 ? -11 : 11;
  const zShift = active ? 8 : -4;
  const deckArmies = (deck.armies || []).filter(Boolean);
  const displayArmies = deckArmies.length ? deckArmies.slice(0, 2) : [];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 286,
        height: 442,
        flexShrink: 0,
        cursor: 'pointer',
        transform: `translateX(${xShift}px) translateY(${yShift}px) translateZ(${zShift}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity,
        transition: 'transform 0.34s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.28s ease, filter 0.34s ease',
        filter: active ? `drop-shadow(0 0 30px ${ACCENT}aa)` : 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))',
        zIndex: active ? 3 : 1,
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -4,
          border: `1px solid ${HEAT}`,
          clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
          boxShadow: `0 0 20px ${HEAT}88, inset 0 0 22px ${HEAT}3d`,
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.985)',
          transition: 'opacity 0.26s ease, transform 0.26s ease',
          pointerEvents: 'none',
        }}
      />

      {/* card frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: active ? `linear-gradient(180deg, ${ACCENT} 0%, ${DEEP} 100%)` : `linear-gradient(180deg, ${DEEP} 0%, #1a0826 100%)`,
          clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
          boxShadow: active ? `0 0 0 2px ${HEAT}` : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 4,
          background: MENU_ACCENTS.void,
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        }}
      />

      {/* leader image */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 236,
          height: 236,
          background: '#000',
          overflow: 'hidden',
          border: `1px solid ${active ? HEAT : ACCENT + '55'}`,
        }}
      >
        <img
          src={deck.lead}
          alt={deck.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: deck.leadObjectPosition || '50% 25%',
            imageRendering: 'pixelated',
            filter: active ? 'none' : 'saturate(0.6) brightness(0.8)',
          }}
        />
        {/* fade overlay bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: `linear-gradient(0deg, ${MENU_ACCENTS.void} 0%, transparent 100%)`,
          }}
        />
        {/* faction sigil top-right */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 26,
            height: 30,
            background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
            clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: MENU_ACCENTS.void,
            overflow: 'hidden',
          }}
        >
          {displayArmies.length > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(6,3,10,0.45)' }}>
                <Icon name={displayArmies[0]} type="army" size={16} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={displayArmies[1]} type="army" size={16} />
              </div>
            </div>
          ) : displayArmies.length === 1 ? (
            <Icon name={displayArmies[0]} type="army" size={28} />
          ) : (
            deck.sigil
          )}
        </div>
        {/* favorite star */}
        {deck.favorite && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              color: '#fbbf24',
              fontSize: 18,
              textShadow: '0 0 10px #fbbf24',
            }}
          >
            ★
          </div>
        )}
      </div>

      {/* lower content */}
      <div
        style={{
          position: 'absolute',
          top: 256,
          left: 16,
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: HEAT, letterSpacing: '0.4em' }}>{deck.fac}</div>
          <div
            style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: '0.14em',
              color: MENU_ACCENTS.text,
              marginTop: 3,
              lineHeight: 1.1,
              textShadow: active ? `1px 1px 0 ${ACCENT}99` : 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {deck.name}
          </div>
        </div>

        {/* mini stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 4,
            fontFamily: 'Share Tech Mono, monospace',
          }}
        >
          {[
            { l: 'POT', v: deck.pot, c: HEAT },
            { l: 'DAN', v: deck.dan, c: VIOLET },
            { l: 'WIN', v: deck.win + '%', c: deck.win > 60 ? '#22d3ee' : '#fbbf24' },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                padding: '4px 4px',
                background: `${s.c}11`,
                border: `1px solid ${s.c}55`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 7, color: '#94a3b8', letterSpacing: '0.2em' }}>{s.l}</div>
              <div
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 900,
                  fontSize: 14,
                  color: s.c,
                  lineHeight: 1.1,
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* deck meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 9,
            color: '#94a3b8',
            letterSpacing: '0.2em',
            padding: '4px 0',
            borderTop: `1px dashed ${ACCENT}33`,
          }}
        >
          <span style={{ color: deck.lega === 30 ? VIOLET : '#fca5a5' }}>{deck.lega}/30 LEGA</span>
        </div>

        {deck.warning && (
          <div
            style={{
              fontSize: 8,
              color: '#fca5a5',
              letterSpacing: '0.2em',
              fontFamily: 'Share Tech Mono, monospace',
              textAlign: 'center',
              padding: '3px 0',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.5)',
            }}
          >
            ⚠ {deck.warning.toUpperCase()}
          </div>
        )}

        {active && !deck.warning && (
          <div
            style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9,
              color: HEAT,
              letterSpacing: '0.4em',
              textAlign: 'center',
              padding: '5px 0',
              background: `${HEAT}22`,
              border: `1px solid ${HEAT}99`,
              animation: 'pulse-glow 1.6s ease-in-out infinite',
            }}
          >
            ● SELEZIONATO
          </div>
        )}
      </div>
    </div>
  );
}

export default DeckSelectCosmic;
