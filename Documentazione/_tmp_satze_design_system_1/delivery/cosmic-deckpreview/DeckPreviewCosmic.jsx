import React, { useState, useMemo } from 'react';

// DeckPreviewCosmic — Anteprima Mazzo (schermata standard 1920x1080)
// Layout: header (nome mazzo · armata · sigillo · stats) · griglia 5x2 con badge 01-10
//         · side-panel destra con dettagli carta selezionata · footer azioni
// Props:
//   deck: { name, army, sigil, accentColor, cards: Card[] }
//   onBack(), onEdit(deck), onConfirm(deck) — opzionali
//   showActions: bool (default true)
function DeckPreviewCosmic({
  deck = null,
  onBack = () => {},
  onEdit = null,
  onConfirm = null,
  showActions = true,
}) {
  const ACCENT = '#c026d3';
  const HEAT = '#ec4899';
  const VIOLET = '#a78bfa';
  const DEEP = '#581c87';
  const BG = '#06030a';

  // Fallback demo se nessun deck passato (per design canvas)
  const demoDeck = useMemo(() => ({
    name: 'Lama del Re',
    army: 'KETHRAN',
    sigil: '◈',
    accentColor: '#fbbf24',
    cards: [
      { id: 1,  name: 'Nimrod, il Primo Re',         lega: 5, pot: 7,  dan: 3, power: 'Resa: +2 DAN',          bonus: '+1 POT alleati',   portrait: '101', flavor: "Il primo a salire. L'ultimo a cadere." },
      { id: 2,  name: "L'Evoluzione Finale",         lega: 5, pot: 6,  dan: 3, power: 'Resa: Immune',          bonus: '+2 DAN',           portrait: '102', flavor: "Quando la carne ricorda, la pietra dimentica." },
      { id: 3,  name: 'Berserker della Spira',       lega: 3, pot: 4,  dan: 3, power: 'Rimonta: +1 DAN',       bonus: 'Vendetta: +1 DAN', portrait: '111', flavor: "Più colpisce, più ride." },
      { id: 4,  name: 'Keth il Muto',                lega: 4, pot: 11, dan: 7, power: 'Coro: +2 POT',          bonus: '+1 FC',            portrait: '411', flavor: "I templi cantano. La carne tace." },
      { id: 5,  name: 'Ancorante Spezzata',          lega: 3, pot: 5,  dan: 4, power: 'Sempre: -2 VA nem.',    bonus: 'Blocca Potere',    portrait: '301', flavor: "Aggrappata al filo del mondo." },
      { id: 6,  name: 'Martire della Spira',         lega: 2, pot: 2,  dan: 2, power: 'Ult. Desid.: 3 DAN',    bonus: '+1 LEGA',          portrait: '202', flavor: "Cadere è solo un altro modo di salire." },
      { id: 7,  name: 'Seguace Fanatico',            lega: 2, pot: 3,  dan: 1, power: 'Gloria: +2 POT',        bonus: '+1 POT',           portrait: '201', flavor: "Crede senza vedere. Vede senza credere." },
      { id: 8,  name: 'Cantore di Pietra',           lega: 3, pot: 4,  dan: 2, power: 'Coro: copia BON',       bonus: '-1 DAN nem.',      portrait: '211', flavor: "La sua voce è una crepa." },
      { id: 9,  name: 'Vessillo del Primo',          lega: 2, pot: 3,  dan: 2, power: 'Sempre: +1 POT',        bonus: 'Ispira: +1 LEGA',  portrait: '501', flavor: "Lo stendardo non cade mai." },
      { id: 10, name: 'Eco del Coro',                lega: 1, pot: 2,  dan: 1, power: 'Conquista: +1 POT',     bonus: '+1 FC alleati',    portrait: '601', flavor: "L'ultima nota dura più a lungo." },
    ],
  }), []);

  const D = deck || demoDeck;
  const cards = D.cards || [];
  const armyAccent = D.accentColor || '#fbbf24';

  const totalLega = cards.reduce((s, c) => s + (c.lega || 0), 0);
  const avgPot = cards.length ? (cards.reduce((s, c) => s + (c.pot || 0), 0) / cards.length).toFixed(1) : '0';
  const avgDan = cards.length ? (cards.reduce((s, c) => s + (c.dan || 0), 0) / cards.length).toFixed(1) : '0';

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: BG, color: '#f5f3eb',
      fontFamily: 'Chakra Petch, sans-serif',
    }}>
      {/* Background nebula */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, #2a0a3a 0%, #14051f 50%, #06030a 90%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
        backgroundSize: '8px 8px',
      }}/>
      <div style={{
        position: 'absolute', top: -60, left: -40,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 320, lineHeight: 0.75, letterSpacing: '-0.04em',
        color: 'transparent', WebkitTextStroke: `2px ${ACCENT}1c`,
        transform: 'skewX(-8deg) rotate(-2deg)',
        pointerEvents: 'none', userSelect: 'none',
      }}>ARMATA</div>

      {/* === TOP BAR === */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '22px 40px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${ACCENT}33`,
      }}>
        <button onClick={onBack} style={{
          padding: '9px 16px',
          background: 'transparent',
          border: `1px solid ${VIOLET}88`,
          color: VIOLET,
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11, letterSpacing: '0.3em', fontWeight: 700,
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
          cursor: 'pointer',
        }}>← INDIETRO</button>

        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          {/* sigillo armata */}
          <div style={{
            width: 56, height: 64,
            background: `linear-gradient(180deg, ${armyAccent} 0%, ${DEEP} 100%)`,
            clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 28,
            color: '#06030a',
            boxShadow: `0 0 22px ${armyAccent}88`,
          }}>{D.sigil || '◈'}</div>

          <div style={{textAlign: 'center'}}>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 11,
              color: HEAT, letterSpacing: '0.5em',
            }}>· ANTEPRIMA MAZZO ·</div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 34, letterSpacing: '0.28em',
              color: '#f5f3eb', marginTop: 4,
              textShadow: `2px 2px 0 ${ACCENT}88`,
            }}>«{(D.name || 'MAZZO').toUpperCase()}»</div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
              color: armyAccent, letterSpacing: '0.4em', marginTop: 4,
            }}>FAZIONE {(D.army || '—').toUpperCase()} · {cards.length} CARTE · {totalLega} LEGA</div>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <MiniStat label="LEGA"    value={`${totalLega}/30`} c="#22d3ee"/>
          <MiniStat label="POT MED" value={avgPot} c={HEAT}/>
          <MiniStat label="DAN MED" value={avgDan} c={VIOLET}/>
        </div>
      </div>

      {/* === GRID 2x5 === */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: 'calc(100% - 110px - 90px)',
        padding: '22px 60px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '40px 30px',
          width: '100%', height: '100%',
          maxWidth: 1700,
        }}>
          {cards.slice(0, 10).map((c, i) => (
            <CardSlot key={c.id ?? i} idx={i+1} card={c}
              ACCENT={ACCENT} HEAT={HEAT} VIOLET={VIOLET} DEEP={DEEP}
              armyAccent={armyAccent}/>
          ))}
        </div>
      </div>

      {/* === BOTTOM ACTIONS === */}
      {showActions && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 30, zIndex: 5,
          padding: '0 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
            color: '#94a3b8', letterSpacing: '0.3em',
          }}>
            <span>// LEGENDA:</span>
            <Legenda c={HEAT}      label="POTENZA"/>
            <Legenda c="#f5f3eb"   label="DANNO"/>
            <Legenda c={armyAccent} label={`ARMATA · ${(D.army || '').toUpperCase()}`}/>
          </div>

          <div style={{display: 'flex', gap: 10}}>
            {onEdit && (
              <button onClick={() => onEdit(D)} style={{
                padding: '12px 24px',
                background: 'transparent',
                border: `1px solid ${VIOLET}88`,
                color: VIOLET,
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: 11, letterSpacing: '0.3em', fontWeight: 700,
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                cursor: 'pointer',
              }}>✎ MODIFICA</button>
            )}
            {onConfirm && (
              <button onClick={() => onConfirm(D)} style={{
                padding: '13px 30px',
                background: `linear-gradient(90deg, ${ACCENT} 0%, ${HEAT} 100%)`,
                border: 'none',
                color: '#06030a',
                fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 15, letterSpacing: '0.32em',
                cursor: 'pointer',
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                boxShadow: `0 0 24px ${HEAT}88, 0 4px 0 ${DEEP}`,
                textShadow: `1px 1px 0 #f5f3eb`,
              }}>SCHIERA MAZZO ›</button>
            )}
          </div>
        </div>
      )}

      {/* corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{
          position: 'absolute',
          top: c.startsWith('t') ? 8 : 'auto',
          bottom: c.startsWith('b') ? 8 : 'auto',
          left: c.endsWith('l') ? 8 : 'auto',
          right: c.endsWith('r') ? 8 : 'auto',
          width: 24, height: 24,
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

function MiniStat({label, value, c}) {
  return (
    <div style={{
      padding: '7px 16px',
      background: '#06030a',
      border: `1px solid ${c}55`,
      clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
      minWidth: 96,
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
        color: '#94a3b8', letterSpacing: '0.35em',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 22, color: c, lineHeight: 1.05,
        textShadow: `0 0 10px ${c}66`,
      }}>{value}</div>
    </div>
  );
}

function Legenda({c, label}) {
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap: 6}}>
      <span style={{display:'inline-block', width: 10, height: 10, background: c, boxShadow: `0 0 8px ${c}99`}}/>
      <span>{label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// CardSlot — wraps card P4 + index badge + active highlight
// ─────────────────────────────────────────────────────────
function CardSlot({card, idx, ACCENT, HEAT, VIOLET, DEEP, armyAccent}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: hover ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s cubic-bezier(0.2,0.9,0.3,1.2)',
        zIndex: hover ? 5 : 1,
      }}>
      <div style={{
        position: 'absolute', top: -12, left: -8, zIndex: 6,
        width: 30, height: 34,
        background: `linear-gradient(180deg, ${ACCENT} 0%, ${DEEP} 100%)`,
        clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13,
        color: '#06030a',
        boxShadow: `0 0 14px ${ACCENT}99`,
      }}>{String(idx).padStart(2,'0')}</div>

      <CardP4Rune card={card} accent={armyAccent} hover={hover}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CardP4Rune — versione compatta (cf. card-layouts.html)
// ─────────────────────────────────────────────────────────
function CardP4Rune({card, accent, hover}) {
  const RUNES = [
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
  let seed = 0;
  for (let i = 0; i < (card.name || '').length; i++) seed = (seed * 31 + card.name.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const COUNT = 14;
  const STEP = 220 / (COUNT + 1);
  const topR = Array.from({ length: COUNT }, () => Math.floor(rand() * RUNES.length));
  const botR = Array.from({ length: COUNT }, () => Math.floor(rand() * RUNES.length));
  const id = (card.portrait || 'x') + '-' + (card.name || '').replace(/\s+/g,'');

  return (
    <div style={{
      position: 'relative', width: 220, height: 320,
      background: '#0a0a0d', overflow: 'hidden',
      border: `1.5px solid ${accent}`,
      borderRadius: '0 0 14px 14px',
      boxShadow: hover
        ? `0 0 28px ${accent}cc, 0 6px 22px rgba(0,0,0,0.95)`
        : `0 0 14px ${accent}66, 0 4px 16px rgba(0,0,0,0.9)`,
      transition: 'box-shadow 0.25s ease',
      fontFamily: 'Chakra Petch',
    }}>
      {card.portrait && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('../assets/cards/${card.portrait}.png')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}/>
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 100%)',
      }}/>
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 4,
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(0,0,0,0.85)', border: `2px solid ${accent}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 10px ${accent}aa`,
      }}>
        <div style={{fontSize: 6, color: accent, letterSpacing: '0.1em', fontWeight: 700}}>LEGA</div>
        <div style={{fontFamily: 'Cinzel', fontWeight: 900, fontSize: 17, color: '#fff', lineHeight: 0.9}}>{card.lega}</div>
      </div>
      <div style={{
        position: 'absolute', top: 30, left: -26,
        transform: 'rotate(-22deg)', transformOrigin: 'left center', zIndex: 3,
      }}>
        <div style={{position: 'absolute', inset: '-8px -10px', background: accent, opacity: 0.32, filter: 'blur(14px)'}}/>
        <svg width="220" height="52" viewBox="0 0 220 52"
          style={{position: 'relative', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.85))'}}>
          <defs>
            <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={accent} stopOpacity="0.4" />
              <stop offset="20%"  stopColor={accent} />
              <stop offset="80%"  stopColor={accent} />
              <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect x="0" y="15" width="220" height="22" fill={`url(#rg-${id})`} />
          <line x1="0" y1="14" x2="220" y2="14" stroke={accent} strokeWidth="0.8" />
          <line x1="0" y1="38" x2="220" y2="38" stroke={accent} strokeWidth="0.8" />
          {topR.map((idx, i) => (
            <g key={`tg-${i}`} transform={`translate(${STEP * (i + 1)} 7)`}>
              <path d={RUNES[idx]} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.9"/>
            </g>
          ))}
          {botR.map((idx, i) => (
            <g key={`bg-${i}`} transform={`translate(${STEP * (i + 1)} 45)`}>
              <path d={RUNES[idx]} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.9"/>
            </g>
          ))}
          <rect x="0" y="24" width="220" height="2" fill="rgba(255,255,255,0.25)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0a0a0d',
          fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.18em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${accent}, 0 1px 0 rgba(255,255,255,0.25)`,
          padding: '0 14px',
        }}>{card.name}</div>
      </div>
      <div style={{
        position: 'absolute', bottom: 96, left: 0, right: 0, zIndex: 2,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 14px',
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{
            fontFamily: 'Cinzel', fontWeight: 900, fontSize: 44,
            color: accent, lineHeight: 0.9,
            textShadow: '0 0 16px rgba(0,0,0,1), 0 2px 6px #000',
          }}>{card.pot}</div>
          <div style={{fontSize: 9, letterSpacing: '0.2em', color: '#cbd5e1', fontWeight: 600, marginTop: 3}}>POTENZA</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{
            fontFamily: 'Cinzel', fontWeight: 900, fontSize: 44, color: '#fff', lineHeight: 0.9,
            textShadow: '0 0 16px rgba(0,0,0,1), 0 2px 6px #000',
          }}>{card.dan}</div>
          <div style={{fontSize: 9, letterSpacing: '0.2em', color: '#cbd5e1', fontWeight: 600, marginTop: 3}}>DANNO</div>
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
        background: `linear-gradient(180deg, ${accent}dd 0%, ${accent} 100%)`,
        color: '#0a0a0d', padding: '8px 12px 10px',
        borderRadius: '0 0 14px 14px',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{fontWeight: 800, fontSize: 9, letterSpacing: '0.15em'}}>⚡ POT</span>
          <span style={{fontWeight: 700, fontSize: 11}}>{card.power}</span>
        </div>
        <div style={{height: 1, background: 'rgba(0,0,0,0.3)', margin: '4px 0'}}/>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{fontWeight: 800, fontSize: 9, letterSpacing: '0.15em'}}>▢ BON</span>
          <span style={{fontWeight: 700, fontSize: 11}}>{card.bonus}</span>
        </div>
      </div>
    </div>
  );
}

export default DeckPreviewCosmic;
