import React, { useState, useEffect, useRef, useCallback } from 'react';

// DeckSelectCosmic — Scelta Mazzo pre-duello in stile V5 Cosmic
// Layout: header fight intro / centro: carosello mazzi / dettagli + schiera
function DeckSelectCosmic() {
  const ACCENT = '#c026d3';
  const HEAT = '#ec4899';
  const VIOLET = '#a78bfa';
  const DEEP = '#581c87';
  const BG = '#06030a';

  const [active, setActive] = useState(1);

  const decks = [
    { id: 0, name: 'Lama del Re',       fac: 'KETHRAN',    sigil: '◈', cards: 30, lega: 30, pot: 3.6, dan: 2.9, win: 64, lead: '/assets/cards/101.png' },
    { id: 1, name: 'Corte Cremisi',     fac: 'CORTE',      sigil: '✧', cards: 30, lega: 30, pot: 4.1, dan: 3.2, win: 71, lead: '/assets/cards/201.png', favorite: true },
    { id: 2, name: 'Marea di Ferro',    fac: 'CALIBRI',    sigil: '⊕', cards: 30, lega: 30, pot: 3.2, dan: 4.5, win: 58, lead: '/assets/cards/601.png' },
    { id: 3, name: 'Profondi Sussurri', fac: 'ORATHAI',    sigil: '◇', cards: 30, lega: 30, pot: 4.8, dan: 2.1, win: 49, lead: '/assets/cards/301.png' },
    { id: 4, name: 'Roccia & Ossa',     fac: 'MOUNTHBORN', sigil: '⛰', cards: 28, lega: 30, pot: 3.5, dan: 3.8, win: 55, lead: '/assets/cards/501.png', warning: '2 carte mancanti' },
  ];

  const cur = decks[active];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: BG, color: '#f5f3eb',
      fontFamily: 'Chakra Petch, sans-serif',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, #2a0a3a 0%, #14051f 50%, #06030a 90%)',
      }}/>
      {/* Halftone */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.10,
        backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
        backgroundSize: '8px 8px',
      }}/>
      {/* Giant SCELTA bg */}
      <div style={{
        position: 'absolute', top: -50, left: -40,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 320, lineHeight: 0.75, letterSpacing: '-0.04em',
        color: 'transparent', WebkitTextStroke: `2px ${ACCENT}1f`,
        transform: 'skewX(-8deg) rotate(-2deg)',
        pointerEvents: 'none', userSelect: 'none',
      }}>SCHIERA</div>

      {/* === TOP BAR === */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '20px 36px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${ACCENT}33`,
      }}>
        <button style={{
          padding: '8px 14px',
          background: 'transparent',
          border: `1px solid ${VIOLET}88`,
          color: VIOLET,
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 10, letterSpacing: '0.3em', fontWeight: 700,
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
          cursor: 'pointer',
        }}>← INDIETRO</button>

        <div style={{textAlign: 'center'}}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
            color: HEAT, letterSpacing: '0.5em',
          }}>· DUELLO IMMINENTE ·</div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 30, letterSpacing: '0.32em',
            color: '#f5f3eb', marginTop: 4,
            textShadow: `2px 2px 0 ${ACCENT}88`,
          }}>SCELTA DEL MAZZO</div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
            color: '#94a3b8', letterSpacing: '0.4em', marginTop: 4,
          }}>5 MAZZI DISPONIBILI · SELEZIONA UN'ARMA</div>
        </div>

        <div style={{textAlign: 'right'}}>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
            color: '#94a3b8', letterSpacing: '0.3em',
          }}>AVVERSARIO</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end',
          }}>
            <div style={{
              width: 28, height: 28,
              background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
              clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12,
              color: '#06030a',
            }}>X</div>
            <div>
              <div style={{
                fontFamily: 'Cinzel, serif', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.15em',
                color: '#f5f3eb',
              }}>VAELITH SORN</div>
              <div style={{fontSize: 9, color: HEAT, letterSpacing: '0.3em'}}>CORTE ROSSA · LIV 12</div>
            </div>
          </div>
        </div>
      </div>

      {/* === MAIN: carousel + details === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 24, padding: '24px 36px',
        height: 'calc(100% - 92px - 90px)',
      }}>
        {/* === CAROUSEL === */}
        <div style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14,
        }}>
          {/* Prev arrow */}
          <button onClick={() => setActive((active - 1 + decks.length) % decks.length)}
            style={navArrow(VIOLET, false)}>‹</button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flex: 1,
            justifyContent: 'center',
          }}>
            {decks.map((d, i) => {
              const offset = i - active;
              if (Math.abs(offset) > 2) return null;
              return (
                <DeckCard key={d.id} deck={d} offset={offset}
                  active={i === active}
                  onClick={() => setActive(i)}
                  ACCENT={ACCENT} HEAT={HEAT} VIOLET={VIOLET} DEEP={DEEP}/>
              );
            })}
          </div>

          {/* Next arrow */}
          <button onClick={() => setActive((active + 1) % decks.length)}
            style={navArrow(VIOLET, true)}>›</button>

          {/* Dots */}
          <div style={{
            position: 'absolute', bottom: 6, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 8,
          }}>
            {decks.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                style={{
                  width: i === active ? 28 : 8, height: 4,
                  background: i === active ? HEAT : `${VIOLET}55`,
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.25s',
                }}/>
            ))}
          </div>
        </div>

        {/* === DETAILS PANEL === */}
        <div style={{
          display: 'flex', flexDirection: 'column', minHeight: 0,
          background: 'linear-gradient(180deg, #0e0518 0%, #06030a 100%)',
          border: `1px solid ${ACCENT}55`,
          padding: 18,
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
          boxShadow: `0 0 32px ${ACCENT}33, inset 0 0 40px rgba(0,0,0,0.5)`,
        }}>
          {/* faction badge */}
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{
              width: 50, height: 56,
              background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
              clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: '#06030a',
              boxShadow: `0 0 20px ${HEAT}88`,
            }}>{cur.sigil}</div>
            <div>
              <div style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                color: HEAT, letterSpacing: '0.4em',
              }}>FAZIONE · {cur.fac}</div>
              <div style={{
                fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 22, letterSpacing: '0.16em',
                color: '#f5f3eb', marginTop: 3,
                textShadow: `1px 1px 0 ${ACCENT}99`,
              }}>«{cur.name}»</div>
            </div>
          </div>

          {/* warning if any */}
          {cur.warning && (
            <div style={{
              marginTop: 12, padding: '6px 10px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.6)',
              fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
              color: '#fca5a5', letterSpacing: '0.2em',
              clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
            }}>⚠ {cur.warning.toUpperCase()}</div>
          )}

          {/* big stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 8, marginTop: 18,
          }}>
            <BigStat label="POT MED" value={cur.pot} c={HEAT}/>
            <BigStat label="DAN MED" value={cur.dan} c={VIOLET}/>
            <BigStat label="CARTE" value={`${cur.cards}/30`} c="#22d3ee"/>
            <BigStat label="WIN-RATE" value={`${cur.win}%`} c={cur.win > 60 ? HEAT : '#fbbf24'}/>
          </div>

          {/* mana curve */}
          <div style={{marginTop: 16}}>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
              color: '#94a3b8', letterSpacing: '0.35em', marginBottom: 6,
            }}>// CURVA LEGA</div>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 6, height: 64,
              padding: '0 4px',
              borderBottom: `1px solid ${ACCENT}55`,
            }}>
              {[8, 14, 6, 2, 0].map((h, i) => (
                <div key={i} style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4}}>
                  <div style={{
                    width: '100%', height: h * 4,
                    background: i <= 1 ? HEAT : ACCENT,
                    boxShadow: `0 0 8px ${i <= 1 ? HEAT : ACCENT}88`,
                  }}/>
                  <span style={{fontSize: 8, color: '#94a3b8', fontFamily: 'Share Tech Mono, monospace'}}>{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* trigger breakdown */}
          <div style={{marginTop: 14}}>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
              color: '#94a3b8', letterSpacing: '0.35em', marginBottom: 6,
            }}>// TRIGGER PRINCIPALI</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
              {[
                {n: 'RESA DEI CONTI', v: 8, c: HEAT},
                {n: 'CONQUISTA', v: 6, c: '#22d3ee'},
                {n: 'SEMPRE', v: 12, c: VIOLET},
                {n: 'GLORIA', v: 4, c: '#fbbf24'},
              ].map(t => (
                <div key={t.n} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
                }}>
                  <span style={{
                    minWidth: 110, color: t.c, fontWeight: 700, letterSpacing: '0.15em',
                  }}>{t.n}</span>
                  <div style={{flex: 1, height: 4, background: `${t.c}22`, position: 'relative'}}>
                    <div style={{
                      position:'absolute', inset:0,
                      width: `${(t.v/12)*100}%`,
                      background: t.c, boxShadow: `0 0 8px ${t.c}99`,
                    }}/>
                  </div>
                  <span style={{color: '#f5f3eb', fontWeight: 700, minWidth: 18, textAlign: 'right'}}>{t.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* spacer push button down */}
          <div style={{flex: 1}}/>

          {/* bottom buttons */}
          <div style={{display: 'flex', gap: 8, marginBottom: 10}}>
            <button style={{
              flex: 1, padding: '10px',
              background: 'transparent',
              border: `1px solid ${VIOLET}88`,
              color: VIOLET,
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9, letterSpacing: '0.3em', fontWeight: 700,
              clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              cursor: 'pointer',
            }}>👁 ANTEPRIMA</button>
            <button style={{
              flex: 1, padding: '10px',
              background: 'transparent',
              border: `1px solid ${VIOLET}88`,
              color: VIOLET,
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9, letterSpacing: '0.3em', fontWeight: 700,
              clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              cursor: 'pointer',
            }}>✎ MODIFICA</button>
          </div>

          <button style={{
            position: 'relative',
            padding: '16px 0',
            background: cur.warning ? '#3a2030' : `linear-gradient(90deg, ${ACCENT} 0%, ${HEAT} 100%)`,
            border: 'none',
            color: cur.warning ? '#94a3b8' : '#06030a',
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 18, letterSpacing: '0.32em',
            cursor: cur.warning ? 'not-allowed' : 'pointer',
            clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
            boxShadow: cur.warning ? 'none' : `0 0 28px ${HEAT}aa, 0 4px 0 ${DEEP}`,
            textShadow: cur.warning ? 'none' : `1px 1px 0 #f5f3eb`,
          }}>{cur.warning ? 'MAZZO INCOMPLETO' : 'SCHIERA MAZZO ›'}</button>
        </div>
      </div>

      {/* === FOOTER MARQUEE === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
        background: ACCENT,
        clipPath: 'polygon(0 6px, 100% 0, 100% 100%, 0 100%)',
        display: 'flex', alignItems: 'flex-end',
        overflow: 'hidden', zIndex: 8,
      }}>
        <div style={{
          display: 'flex', whiteSpace: 'nowrap',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.3em',
          color: '#06030a', padding: '0 24px',
          animation: 'data-marquee 60s linear infinite',
        }}>
          {Array(2).fill(0).map((_, i) => (
            <span key={i}>SCHIERA · DUELLO 1v1 · CORTE ROSSA · MAPPA: PIANE DEL DEBITO · MISSIONE 03 · LA GRANDE GUERRA · {' '}</span>
          ))}
        </div>
      </div>

      {/* corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{
          position: 'absolute',
          top: c.startsWith('t') ? 8 : 'auto',
          bottom: c.startsWith('b') ? 38 : 'auto',
          left: c.endsWith('l') ? 8 : 'auto',
          right: c.endsWith('r') ? 8 : 'auto',
          width: 22, height: 22,
          borderTop: c.startsWith('t') ? `2px solid ${HEAT}` : 'none',
          borderBottom: c.startsWith('b') ? `2px solid ${HEAT}` : 'none',
          borderLeft: c.endsWith('l') ? `2px solid ${HEAT}` : 'none',
          borderRight: c.endsWith('r') ? `2px solid ${HEAT}` : 'none',
          zIndex: 9,
        }}/>
      ))}
    </div>
  );
}

function navArrow(c, right) {
  return {
    width: 44, height: 64,
    background: `${c}22`,
    border: `1px solid ${c}88`,
    color: c,
    fontFamily: 'Cinzel, serif', fontWeight: 900,
    fontSize: 32, lineHeight: 1,
    cursor: 'pointer',
    clipPath: right
      ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
      : 'polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)',
    flexShrink: 0,
  };
}

function BigStat({label, value, c}) {
  return (
    <div style={{
      padding: '8px 12px',
      background: '#06030a',
      border: `1px solid ${c}55`,
      clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
        color: '#94a3b8', letterSpacing: '0.35em',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 26, color: c,
        textShadow: `0 0 10px ${c}77`,
        lineHeight: 1.1,
      }}>{value}</div>
    </div>
  );
}

function DeckCard({deck, offset, active, onClick, ACCENT, HEAT, VIOLET, DEEP}) {
  const [hover, setHover] = useState(false);
  const isSide = !active && Math.abs(offset) === 1;
  const isFar = !active && Math.abs(offset) === 2;
  const scale = active ? 1 : isSide ? 0.78 : 0.6;
  const opacity = active ? 1 : isSide ? 0.7 : 0.35;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 240, height: 380,
        flexShrink: 0,
        cursor: 'pointer',
        transform: `scale(${scale}) translateX(${offset > 0 ? -10 : offset < 0 ? 10 : 0}px) ${active && hover ? 'translateY(-6px)' : ''}`,
        opacity,
        transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        filter: active ? `drop-shadow(0 0 30px ${ACCENT}aa)` : 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))',
      }}>
      {/* card frame */}
      <div style={{
        position: 'absolute', inset: 0,
        background: active
          ? `linear-gradient(180deg, ${ACCENT} 0%, ${DEEP} 100%)`
          : `linear-gradient(180deg, ${DEEP} 0%, #1a0826 100%)`,
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
        boxShadow: active ? `0 0 0 2px ${HEAT}` : 'none',
      }}/>
      <div style={{
        position: 'absolute', inset: 4,
        background: '#06030a',
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
      }}/>

      {/* leader image */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12, height: 220,
        background: '#000', overflow: 'hidden',
        border: `1px solid ${active ? HEAT : ACCENT + '55'}`,
      }}>
        <img src={deck.lead} alt={deck.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            imageRendering: 'pixelated',
            filter: active ? 'none' : 'saturate(0.6) brightness(0.8)',
          }}/>
        {/* fade overlay bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(0deg, #06030a 0%, transparent 100%)',
        }}/>
        {/* faction sigil top-right */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 26, height: 30,
          background: `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)`,
          clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#06030a',
        }}>{deck.sigil}</div>
        {/* favorite star */}
        {deck.favorite && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            color: '#fbbf24', fontSize: 18,
            textShadow: '0 0 10px #fbbf24',
          }}>★</div>
        )}
      </div>

      {/* lower content */}
      <div style={{
        position: 'absolute', top: 240, left: 16, right: 16, bottom: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
            color: HEAT, letterSpacing: '0.4em',
          }}>{deck.fac}</div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 17, letterSpacing: '0.14em',
            color: '#f5f3eb', marginTop: 3, lineHeight: 1.1,
            textShadow: active ? `1px 1px 0 ${ACCENT}99` : 'none',
          }}>{deck.name}</div>
        </div>

        {/* mini stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
          fontFamily: 'Share Tech Mono, monospace',
        }}>
          {[
            {l: 'POT', v: deck.pot, c: HEAT},
            {l: 'DAN', v: deck.dan, c: VIOLET},
            {l: 'WIN', v: deck.win + '%', c: deck.win > 60 ? '#22d3ee' : '#fbbf24'},
          ].map(s => (
            <div key={s.l} style={{
              padding: '4px 4px',
              background: `${s.c}11`,
              border: `1px solid ${s.c}55`,
              textAlign: 'center',
            }}>
              <div style={{fontSize: 7, color: '#94a3b8', letterSpacing: '0.2em'}}>{s.l}</div>
              <div style={{
                fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 14, color: s.c, lineHeight: 1.1,
              }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* deck meta */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
          color: '#94a3b8', letterSpacing: '0.2em',
          padding: '4px 0',
          borderTop: `1px dashed ${ACCENT}33`,
        }}>
          <span>{deck.cards} CARTE</span>
          <span style={{color: deck.lega === 30 ? VIOLET : '#fca5a5'}}>{deck.lega}/30 LEGA</span>
        </div>

        {deck.warning && (
          <div style={{
            fontSize: 8, color: '#fca5a5', letterSpacing: '0.2em',
            fontFamily: 'Share Tech Mono, monospace',
            textAlign: 'center', padding: '3px 0',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.5)',
          }}>⚠ {deck.warning.toUpperCase()}</div>
        )}

        {active && !deck.warning && (
          <div style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
            color: HEAT, letterSpacing: '0.4em', textAlign: 'center',
            padding: '5px 0',
            background: `${HEAT}22`,
            border: `1px solid ${HEAT}99`,
            animation: 'pulse-glow 1.6s ease-in-out infinite',
          }}>● SELEZIONATO</div>
        )}
      </div>
    </div>
  );
}

export default DeckSelectCosmic;
