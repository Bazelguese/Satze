import React, { useState, useEffect, useRef, useCallback } from 'react';

// DeckBuilderCosmic — Costruzione Mazzo nel linguaggio V5 Cosmic Magenta
// Layout: header con logo + stats / sinistra: filtri + griglia carte / destra: pannello mazzo
// Palette: nero #06030a, magenta #c026d3, pink heat #ec4899, viola #a78bfa, deep #581c87
function DeckBuilderCosmic() {
  const ACCENT = '#c026d3';
  const HEAT = '#ec4899';
  const VIOLET = '#a78bfa';
  const DEEP = '#581c87';
  const BG = '#06030a';
  const PANEL = '#0e0518';
  const PANEL_2 = '#1a0826';

  const [tab, setTab] = useState('TUTTE');
  const [legaFilter, setLegaFilter] = useState('★');
  const [sort, setSort] = useState('Lega');

  const factions = [
    { id: 'TUTTE', sigil: '✦' },
    { id: 'FIGLI', sigil: '☩' },
    { id: 'KETHRAN', sigil: '◈', count: 5 },
    { id: 'CORTE', sigil: '✧', count: 5 },
    { id: 'CALIBRI', sigil: '⊕' },
    { id: 'ORATHAI', sigil: '◇' },
    { id: 'MOUNTHBORN', sigil: '⛰' },
    { id: "L'ENCLAVE", sigil: '◐' },
    { id: 'RATTI', sigil: '⌬' },
  ];

  const cards = [
    { id: 'nimrod',     name: 'Nimrod, il Primo Re',         lega: 5, pot: 7, dan: 3, fac: 'KETHRAN',    img: '/assets/cards/101.png', trig: 'RESA DEI CONTI', eff: '+2 DAN', selected: true },
    { id: 'vaelith',    name: 'Vaelith Sorn, il Primo',      lega: 5, pot: 7, dan: 3, fac: 'CORTE',      img: '/assets/cards/201.png', trig: 'CONQUISTA',     eff: '3 DAN dir.' },
    { id: 'patriarca',  name: "Patriarca dell'Enclave",      lega: 5, pot: 7, dan: 7, fac: 'ENCLAVE',    img: '/assets/cards/411.png', trig: 'SEMPRE',         eff: '-7 VA nem. (min 14)' },
    { id: 'sorethal',   name: 'Sorethal, il Primo Ancorante',lega: 5, pot: 6, dan: 4, fac: 'ORATHAI',    img: '/assets/cards/301.png', trig: 'SEMPRE',         eff: '-8 VA nem.' },
    { id: 'urnammu',    name: 'Ur-Nammu il Conquistatore',   lega: 5, pot: 6, dan: 5, fac: 'MOUNTHBORN', img: '/assets/cards/501.png', trig: 'MAGNANIMO',     eff: '+2 POT' },
    { id: 'titano',     name: 'Titano Corazzato MK-IV',      lega: 5, pot: 6, dan: 6, fac: 'CALIBRI',    img: '/assets/cards/601.png', trig: 'SEMPRE',         eff: 'Immune' },
    { id: 'evoluzione', name: "L'Evoluzione Finale",         lega: 5, pot: 6, dan: 3, fac: 'KETHRAN',    img: '/assets/cards/102.png', trig: 'RESA DEI CONTI',eff: 'Immune' },
    { id: 'drago',      name: 'Drago Antico Addormentato',   lega: 5, pot: 6, dan: 5, fac: 'ORATHAI',    img: '/assets/cards/311.png', trig: 'RIMONTA',        eff: 'Vendetta: Immune' },
    { id: 'megera',     name: 'La Megera Eterna',            lega: 5, pot: 6, dan: 4, fac: 'CORTE',      img: '/assets/cards/202.png', trig: 'SEMPRE',         eff: 'Blocca Potere' },
    { id: 'flagello',   name: 'Flagello della Colonia',      lega: 5, pot: 6, dan: 4, fac: 'RATTI',      img: '/assets/cards/211.png', trig: 'RESA DEI CONTI',eff: '-4 POT nem. (min 2)' },
  ];

  const deck = [
    { id: 'd1', name: 'Nimrod, il Primo Re',     lega: 5, pot: 7, dan: 3, trig: 'RESA DEI CONTI',  eff: '+2 DAN',         img: '/assets/cards/101.png', fac: 'KETHRAN' },
    { id: 'd2', name: 'Berserker della Spira',   lega: 3, pot: 4, dan: 3, trig: 'RIMONTA',          eff: 'Vendetta: +1 DAN', img: '/assets/cards/102.png', fac: 'KETHRAN' },
    { id: 'd3', name: 'Martire della Spira',     lega: 2, pot: 2, dan: 2, trig: 'ULTIMO DESIDERIO',eff: '3 DAN dir.',      img: '/assets/cards/111.png', fac: 'KETHRAN' },
    { id: 'd4', name: 'Seguace Fanatico',        lega: 2, pot: 3, dan: 1, trig: 'GLORIA',          eff: '+2 POT',          img: '/assets/cards/101.png', fac: 'KETHRAN' },
  ];

  const trigColor = {
    'RESA DEI CONTI': HEAT,
    'CONQUISTA': '#22d3ee',
    'SEMPRE': VIOLET,
    'MAGNANIMO': '#fbbf24',
    'RIMONTA': '#f97316',
    'GLORIA': '#fbbf24',
    'ULTIMO DESIDERIO': HEAT,
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: BG, color: '#f5f3eb',
      fontFamily: 'Chakra Petch, sans-serif',
    }}>
      {/* Background nebula */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, #2a0a3a 0%, #14051f 45%, #06030a 80%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
        backgroundSize: '8px 8px',
      }}/>
      {/* Halftone giant SATZE bg */}
      <div style={{
        position: 'absolute', top: -80, right: -100,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 360, lineHeight: 0.75,
        color: 'transparent',
        WebkitTextStroke: `2px ${ACCENT}22`,
        transform: 'skewX(-8deg) rotate(-2deg)',
        pointerEvents: 'none', userSelect: 'none',
      }}>MAZZO</div>

      {/* === HEADER === */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '20px 28px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${ACCENT}33`,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <img src="/assets/logo-satze-cosmic.png" alt="SATZE"
            style={{
              width: 110, height: 'auto',
              filter: `drop-shadow(0 0 12px ${ACCENT}aa)`,
            }}/>
          <div style={{
            width: 1, height: 50, background: `${ACCENT}55`,
          }}/>
          <div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 28, letterSpacing: '0.32em',
              color: '#f5f3eb',
              textShadow: `2px 2px 0 ${ACCENT}66`,
              lineHeight: 1,
            }}>COSTRUZIONE MAZZO</div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 10, letterSpacing: '0.4em',
              color: HEAT, marginTop: 6,
            }}>10 CARTE · MAX 30 LEGA · CAP III</div>
          </div>
        </div>

        {/* HEADER STATS */}
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <StatBlock label="LEGA TOTALE" value="30" max="30" color={HEAT} bar={1.0}/>
          <StatBlock label="CARTE" value="10" max="10" color={VIOLET} bar={1.0}/>
          <button style={chevBtn(ACCENT)}>📖 GLOSSARIO</button>
          <button style={chevBtn(HEAT)}>✂ RITAGLIO</button>
          <button style={{...chevBtn('#94a3b8'), opacity: 0.7}}>← CHIUDI</button>
        </div>
      </div>

      {/* === MAIN GRID: filters / cards / deck panel === */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 18, padding: 18,
        height: 'calc(100% - 96px)',
      }}>
        {/* === LEFT: FILTERS + CARDS === */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0}}>
          {/* Faction tabs */}
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {factions.map(f => {
              const active = f.id === tab;
              return (
                <button key={f.id} onClick={() => setTab(f.id)}
                  style={{
                    position: 'relative',
                    padding: '8px 16px',
                    background: active ? `linear-gradient(180deg, ${ACCENT} 0%, ${DEEP} 100%)` : PANEL,
                    border: `1px solid ${active ? HEAT : ACCENT + '33'}`,
                    color: active ? '#f5f3eb' : '#a78bfa',
                    fontFamily: 'Cinzel, serif', fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                    cursor: 'pointer',
                    boxShadow: active ? `0 0 16px ${ACCENT}88` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{fontSize: 12}}>{f.sigil}</span>
                  {f.id}
                  {f.count && (
                    <span style={{
                      fontSize: 9, padding: '1px 5px',
                      background: HEAT, color: '#06030a',
                      fontFamily: 'Share Tech Mono, monospace',
                      letterSpacing: 0,
                    }}>{f.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-filters */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            padding: '10px 14px',
            background: `${PANEL}cc`,
            border: `1px solid ${ACCENT}22`,
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
            letterSpacing: '0.25em', color: '#94a3b8',
          }}>
            <span>LEGA:</span>
            <div style={{display: 'flex', gap: 4}}>
              {['★','2','3','4','5'].map(l => (
                <button key={l} onClick={() => setLegaFilter(l)}
                  style={{
                    width: 26, height: 22,
                    background: l === legaFilter ? ACCENT : 'transparent',
                    border: `1px solid ${l === legaFilter ? HEAT : ACCENT + '55'}`,
                    color: l === legaFilter ? '#06030a' : VIOLET,
                    fontFamily: 'Share Tech Mono, monospace',
                    fontWeight: 700, fontSize: 11,
                    cursor: 'pointer',
                  }}>{l}</button>
              ))}
            </div>
            <span style={{marginLeft: 14}}>ORDINA:</span>
            <div style={{display: 'flex', gap: 4}}>
              {['Lega','POT','DAN'].map(s => (
                <button key={s} onClick={() => setSort(s)}
                  style={{
                    padding: '3px 10px',
                    background: s === sort ? HEAT : 'transparent',
                    border: `1px solid ${s === sort ? HEAT : ACCENT + '55'}`,
                    color: s === sort ? '#06030a' : VIOLET,
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: 10, letterSpacing: '0.2em', fontWeight: 700,
                    cursor: 'pointer',
                  }}>{s}</button>
              ))}
            </div>
            <span style={{marginLeft: 'auto', color: HEAT}}>120 carte trovate</span>
            <span>TRIGGER:</span>
            <select style={selectStyle(ACCENT)}><option>Tutti</option></select>
            <span>EFFETTO:</span>
            <select style={selectStyle(ACCENT)}><option>Tutti</option></select>
          </div>

          {/* Cards grid */}
          <div style={{
            flex: 1, overflowY: 'auto', minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10, paddingRight: 4,
          }}>
            {cards.map(c => (
              <CardRow key={c.id} card={c} accent={ACCENT} heat={HEAT} violet={VIOLET} deep={DEEP} panel={PANEL} trigColor={trigColor}/>
            ))}
          </div>
        </div>

        {/* === RIGHT: DECK PANEL === */}
        <div style={{
          display: 'flex', flexDirection: 'column', minHeight: 0, gap: 12,
          background: `linear-gradient(180deg, ${PANEL} 0%, ${BG} 100%)`,
          border: `1px solid ${ACCENT}55`,
          padding: 14,
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
          boxShadow: `0 0 30px ${ACCENT}33, inset 0 0 40px rgba(0,0,0,0.5)`,
        }}>
          {/* Deck header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottom: `1px dashed ${ACCENT}55`,
          }}>
            <div>
              <div style={{
                fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 18, letterSpacing: '0.28em',
                color: '#f5f3eb',
                textShadow: `1px 1px 0 ${ACCENT}99`,
              }}>IL TUO MAZZO</div>
              <div style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                color: HEAT, letterSpacing: '0.35em', marginTop: 3,
              }}>DECK//KETHRAN-04</div>
            </div>
            <button style={{
              padding: '5px 12px',
              background: 'transparent',
              border: `1px solid ${HEAT}`,
              color: HEAT,
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 9, letterSpacing: '0.3em', fontWeight: 700,
              cursor: 'pointer',
            }}>SVUOTA</button>
          </div>

          {/* Deck stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            padding: '10px 4px',
            borderBottom: `1px dashed ${ACCENT}33`,
          }}>
            {[
              {l: 'POT MED', v: '3.6', c: HEAT},
              {l: 'DAN MED', v: '2.9', c: VIOLET},
              {l: 'LEGA RIM', v: '0', c: '#22d3ee'},
            ].map(s => (
              <div key={s.l} style={{textAlign: 'center'}}>
                <div style={{
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                  color: '#94a3b8', letterSpacing: '0.3em',
                }}>{s.l}</div>
                <div style={{
                  fontFamily: 'Cinzel, serif', fontWeight: 900,
                  fontSize: 26, color: s.c,
                  textShadow: `0 0 10px ${s.c}77`,
                  lineHeight: 1.1,
                }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Bonus attivi */}
          <div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
              color: '#94a3b8', letterSpacing: '0.35em', marginBottom: 6,
            }}>// BONUS ATTIVI</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
              {[
                {n: 'Rimonta: +2 POT', x: 5, c: '#f97316'},
                {n: 'Copia Bonus nemico', x: 5, c: HEAT},
              ].map(b => (
                <div key={b.n} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 10px',
                  background: `${b.c}18`,
                  border: `1px solid ${b.c}55`,
                  fontFamily: 'Cinzel, serif', fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.15em',
                  color: b.c,
                  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                }}>
                  <span>{b.n}</span>
                  <span style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    background: b.c, color: '#06030a',
                    padding: '1px 6px', fontSize: 9, fontWeight: 700,
                  }}>{b.x}×</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deck cards list */}
          <div style={{
            flex: 1, overflowY: 'auto', minHeight: 0,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
              color: ACCENT, letterSpacing: '0.35em',
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 4,
            }}>
              <span style={{fontSize: 12}}>◈</span>
              KETHRAN <span style={{color: '#94a3b8'}}>(4)</span>
              <div style={{flex: 1, height: 1, background: `${ACCENT}33`, marginLeft: 6}}/>
            </div>
            {deck.map(d => (
              <DeckCardRow key={d.id} card={d} accent={ACCENT} heat={HEAT} violet={VIOLET} trigColor={trigColor}/>
            ))}
          </div>

          {/* Confirm button */}
          <button style={{
            position: 'relative',
            padding: '14px 0',
            background: `linear-gradient(90deg, ${ACCENT} 0%, ${HEAT} 100%)`,
            border: 'none',
            color: '#06030a',
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 16, letterSpacing: '0.32em',
            cursor: 'pointer',
            clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
            boxShadow: `0 0 24px ${HEAT}88, 0 4px 0 ${DEEP}`,
            textShadow: `1px 1px 0 #f5f3eb`,
          }}>CONFERMA MAZZO ›</button>
        </div>
      </div>

      {/* Chevron diagonal accents top-right */}
      <div style={{position:'absolute', top: 110, right: 24, display:'flex', gap: 6, transform: 'skewX(-15deg)', zIndex: 1}}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 28, height: 4,
            background: i === 0 ? HEAT : `rgba(236,72,153,${0.6 - i*0.12})`,
          }}/>
        ))}
      </div>
    </div>
  );
}

function StatBlock({label, value, max, color, bar}) {
  return (
    <div style={{
      padding: '6px 14px',
      background: '#06030a',
      border: `1px solid ${color}55`,
      clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
      minWidth: 120,
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
        color: '#94a3b8', letterSpacing: '0.35em',
      }}>{label}</div>
      <div style={{
        display:'flex', alignItems: 'baseline', gap: 4,
        fontFamily: 'Cinzel, serif',
      }}>
        <span style={{fontWeight: 900, fontSize: 20, color, lineHeight: 1}}>{value}</span>
        <span style={{fontSize: 11, color: '#94a3b8'}}>/ {max}</span>
      </div>
      <div style={{height: 3, background: `${color}22`, marginTop: 3, position: 'relative'}}>
        <div style={{position:'absolute', inset:0, width: `${bar*100}%`, background: color}}/>
      </div>
    </div>
  );
}

function chevBtn(c) {
  return {
    padding: '8px 14px',
    background: 'transparent',
    border: `1px solid ${c}88`,
    color: c,
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: 10, letterSpacing: '0.3em', fontWeight: 700,
    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
    cursor: 'pointer',
  };
}
function selectStyle(c) {
  return {
    background: '#0e0518',
    border: `1px solid ${c}55`,
    color: '#a78bfa',
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: 10, padding: '2px 6px',
  };
}

function CardRow({card, accent, heat, violet, deep, panel, trigColor}) {
  const [hover, setHover] = useState(false);
  const c = trigColor[card.trig] || violet;
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '34px 70px 1fr 60px 28px',
        alignItems: 'center', gap: 10,
        padding: '8px 10px',
        background: card.selected
          ? `linear-gradient(90deg, ${accent}33 0%, ${panel} 100%)`
          : hover ? `${panel}` : `${panel}aa`,
        border: `1px solid ${card.selected ? heat : hover ? accent + '88' : accent + '22'}`,
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: card.selected ? `0 0 16px ${heat}66` : 'none',
      }}>
      {/* LEGA badge */}
      <div style={{
        width: 32, height: 38,
        display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${heat} 0%, ${deep} 100%)`,
        clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
      }}>
        <div style={{fontSize: 7, color: '#06030a', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em', fontWeight: 700, marginTop: 4}}>LEGA</div>
        <div style={{fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: '#06030a', lineHeight: 1, marginTop: -2}}>{card.lega}</div>
      </div>

      {/* Card art */}
      <div style={{
        position: 'relative', width: 60, height: 76,
        background: '#000',
        border: `1px solid ${accent}55`,
        overflow: 'hidden',
      }}>
        <img src={card.img} alt={card.name}
          style={{width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated'}}/>
        {/* mini stats overlay */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%)',
          padding: '8px 4px 2px',
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
        }}>
          <span style={{color: heat}}>{card.pot}</span>
          <span style={{color: violet}}>{card.dan}</span>
        </div>
      </div>

      {/* Name + trigger */}
      <div style={{minWidth: 0}}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 700,
          fontSize: 13, letterSpacing: '0.05em',
          color: '#f5f3eb',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: card.selected ? `0 0 8px ${heat}aa` : 'none',
        }}>{card.name}</div>
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center', marginTop: 4,
          fontFamily: 'Share Tech Mono, monospace', fontSize: 8,
        }}>
          <span style={{
            padding: '2px 6px',
            background: `${c}22`, color: c,
            border: `1px solid ${c}77`,
            letterSpacing: '0.18em', fontWeight: 700,
          }}>{card.trig}</span>
          <span style={{color: '#a78bfa', letterSpacing: '0.1em'}}>{card.eff}</span>
        </div>
      </div>

      {/* POT/DAN big */}
      <div style={{display: 'flex', gap: 4}}>
        {[
          {l: 'POT', v: card.pot, c: heat},
          {l: 'DAN', v: card.dan, c: violet},
        ].map(s => (
          <div key={s.l} style={{
            width: 26, textAlign: 'center',
            border: `1px solid ${s.c}55`,
            background: `${s.c}11`,
          }}>
            <div style={{fontSize: 7, color: '#94a3b8', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.1em'}}>{s.l}</div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 16, color: s.c, lineHeight: 1.1,
            }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* +/- button */}
      <button style={{
        width: 24, height: 24,
        background: card.selected ? heat : 'transparent',
        border: `1px solid ${card.selected ? heat : accent + '88'}`,
        color: card.selected ? '#06030a' : accent,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 16, lineHeight: 1,
        cursor: 'pointer',
      }}>{card.selected ? '−' : '+'}</button>
    </div>
  );
}

function DeckCardRow({card, accent, heat, violet, trigColor}) {
  const c = trigColor[card.trig] || violet;
  return (
    <div style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '36px 1fr 22px',
      gap: 8, padding: '5px 8px',
      background: 'linear-gradient(90deg, rgba(192,38,211,0.15) 0%, rgba(14,5,24,0.6) 100%)',
      border: `1px solid ${accent}55`,
      borderLeft: `3px solid ${heat}`,
      alignItems: 'center',
    }}>
      {/* mini stats column */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 1, fontFamily: 'Share Tech Mono, monospace', fontSize: 8}}>
        <Stat3 l="LEGA" v={card.lega} c={heat}/>
        <Stat3 l="POT" v={card.pot} c={heat}/>
        <Stat3 l="DAN" v={card.dan} c={violet}/>
      </div>
      {/* name + trigger */}
      <div style={{minWidth: 0}}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 700,
          fontSize: 12, color: '#f5f3eb',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{card.name}</div>
        <div style={{
          display: 'flex', gap: 5, alignItems: 'center', marginTop: 2,
          fontFamily: 'Share Tech Mono, monospace', fontSize: 7,
        }}>
          <span style={{
            padding: '1px 5px',
            background: c, color: '#06030a',
            letterSpacing: '0.15em', fontWeight: 700,
          }}>{card.trig}</span>
          <span style={{color: '#a78bfa'}}>{card.eff}</span>
        </div>
      </div>
      <button style={{
        width: 22, height: 22,
        background: 'transparent', border: `1px solid ${heat}aa`,
        color: heat, fontWeight: 900, fontSize: 14,
        cursor: 'pointer',
      }}>−</button>
    </div>
  );
}

function Stat3({l, v, c}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
      <span style={{color: '#64748b', fontSize: 7, letterSpacing: '0.15em', minWidth: 22}}>{l}</span>
      <span style={{color: c, fontWeight: 900, fontSize: 11, fontFamily: 'Cinzel, serif'}}>{v}</span>
    </div>
  );
}

export default DeckBuilderCosmic;
