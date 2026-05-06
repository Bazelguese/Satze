// MenuV5PersonaCosmic — variante della V5 Persona-style con logo reale e palette
// adattata al wordmark (viola/magenta/nero invece di gold)
function MenuV5PersonaCosmic() {
  const [hover, setHover] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(h);
  }, []);

  // Palette derived from logo: deep violet, magenta core, silver edges
  const ACCENT = '#c026d3';   // magenta primary
  const DEEP   = '#581c87';   // deep violet
  const HEAT   = '#ec4899';   // pink heat
  const SILVER = '#e5e7eb';   // wordmark silver

  const items = [
    { id: 'campagna',     label: 'CAMPAGNA',       sub: 'STORIA',         accent: HEAT,   meta: 'CAP 03 · DEBITO DI SANGUE' },
    { id: 'scaramuccia',  label: 'SCARAMUCCIA',    sub: 'PARTITA LIBERA', accent: ACCENT, meta: '5v5 · QUICK MATCH' },
    { id: 'multiplayer',  label: 'MULTIGIOCATORE', sub: 'BETA',           accent: '#a78bfa', meta: 'COMING SOON', disabled: true },
    { id: 'galleria',     label: 'GALLERIA',       sub: 'ARCHIVIO',       accent: '#22d3ee', meta: '247 / 312 CARTE' },
    { id: 'opzioni',      label: 'OPZIONI',        sub: 'SISTEMA',        accent: '#94a3b8', meta: 'v0.1 ALPHA' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: '#06030a',
      fontFamily: 'Chakra Petch, sans-serif',
      color: '#f5f3eb',
    }}>
      {/* === FONDO: gradient violaceo + nebula swirl === */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 40%, #2a0a3a 0%, #14051f 40%, #06030a 80%)',
      }}/>
      {/* radial swirl behind the logo */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '70%', height: '90%',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(192,38,211,0.2) 0%, rgba(88,28,135,0.18) 30%, transparent 65%)',
        filter: 'blur(24px)',
        animation: 'pulse-glow 6s ease-in-out infinite',
        color: ACCENT,
        pointerEvents: 'none',
      }}/>
      {/* halftone dots in magenta */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.10,
        backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
        backgroundSize: '8px 8px',
        mixBlendMode: 'screen',
      }}/>
      {/* diagonal scratches */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, opacity:0.18}}>
        <defs>
          <pattern id="scratchV5C" width="200" height="200" patternUnits="userSpaceOnUse">
            <line x1="0" y1="50"  x2="200" y2="0"   stroke={ACCENT} strokeWidth="0.5"/>
            <line x1="0" y1="120" x2="200" y2="80"  stroke={ACCENT} strokeWidth="0.3"/>
            <line x1="0" y1="180" x2="200" y2="150" stroke="#fff"   strokeWidth="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scratchV5C)"/>
      </svg>

      {/* === GIANT BG TYPOGRAPHY (the "explosion") === */}
      <div style={{
        position: 'absolute', top: -40, left: -60,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 320, lineHeight: 0.75,
        letterSpacing: '-0.04em',
        color: 'rgba(192,38,211,0.07)',
        WebkitTextStroke: `2px rgba(192,38,211,0.18)`,
        transform: 'skewX(-8deg) rotate(-2deg)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>SATZE</div>
      <div style={{
        position: 'absolute', bottom: -60, right: -40,
        fontFamily: 'Cinzel, serif', fontStyle: 'italic',
        fontSize: 180, lineHeight: 0.85,
        color: 'rgba(236,72,153,0.06)',
        WebkitTextStroke: '1px rgba(236,72,153,0.22)',
        transform: 'skewX(-8deg) rotate(2deg)',
        textAlign: 'right',
        pointerEvents: 'none', userSelect: 'none',
      }}>LA GRANDE<br/>GUERRA</div>

      {/* === CHEVRON DIAGONAL ACCENTS (alto-sx, in movimento) === */}
      <div style={{ position:'absolute', top: 24, left: 24, display:'flex', gap: 6, transform: 'skewX(-15deg)' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 28, height: 4,
            background: i === 0 ? HEAT : `rgba(236,72,153,${0.6 - i*0.12})`,
            animation: `drift-x 1.6s ${i*0.1}s ease-in-out infinite`,
          }}/>
        ))}
      </div>
      {/* basso-dx mirror */}
      <div style={{ position:'absolute', bottom: 24, right: 24, display:'flex', gap: 6, transform: 'skewX(-15deg)' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 4, height: 28,
            background: i === 4 ? '#a78bfa' : `rgba(167,139,250,${0.18 + i*0.16})`,
            animation: `float-y 1.6s ${i*0.1}s ease-in-out infinite`,
          }}/>
        ))}
      </div>

      {/* === HEADER: real logo, no text wordmark === */}
      <div style={{
        position: 'absolute', top: 30, left: 50,
        zIndex: 10,
        animation: 'float-y 5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 30px rgba(192,38,211,0.5)) drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
      }}>
        <img src="../assets/logo-satze-cosmic.png" alt="SATZE"
          style={{ width: 380, height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }}/>
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11, color: HEAT,
          letterSpacing: '0.45em',
          marginTop: -8, marginLeft: 36,
          textShadow: `0 0 8px ${HEAT}88`,
        }}>LA·GRANDE·GUERRA</div>
      </div>

      {/* === MENU LIST === */}
      <div style={{
        position: 'absolute', top: 280, right: 60,
        width: 620,
        display: 'flex', flexDirection: 'column', gap: 14,
        zIndex: 5,
      }}>
        {items.map((item, i) => {
          const isHover = hover === item.id;
          const offsetX = isHover ? -36 : -i * 12;
          return (
            <button key={item.id}
              onMouseEnter={() => !item.disabled && setHover(item.id)}
              onMouseLeave={() => setHover(null)}
              disabled={item.disabled}
              style={{
                position: 'relative',
                marginLeft: offsetX,
                padding: 0,
                background: 'transparent', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                transition: 'margin-left 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
                transformOrigin: 'right center',
                animation: `p5-slide-in 0.5s ${i*0.08}s backwards ease-out`,
              }}>
              {/* OUTER SHAPE */}
              <div style={{
                position: 'relative',
                height: 78,
                background: isHover
                  ? `linear-gradient(90deg, ${item.accent} 0%, ${item.accent}dd 60%, ${item.accent}88 100%)`
                  : 'linear-gradient(90deg, #1a0d24 0%, #0a0510 100%)',
                clipPath: 'polygon(40px 0, 100% 0, 100% 100%, 0 100%)',
                transform: 'skewX(-12deg)',
                transition: 'background 0.2s',
                boxShadow: isHover
                  ? `-6px 6px 0 ${item.accent}, 0 0 32px ${item.accent}66`
                  : '4px 4px 0 rgba(0,0,0,0.6)',
              }}>
                <div style={{
                  position: 'absolute', top: 6, bottom: 6, left: 50, right: 6,
                  border: `1.5px solid ${isHover ? '#06030a' : '#3a2a44'}`,
                  pointerEvents: 'none',
                }}/>
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, width: 12,
                  background: item.accent,
                  boxShadow: 'inset -2px 0 0 #06030a',
                }}/>
              </div>
              {/* TEXT */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 80, right: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: isHover ? '#06030a' : '#f5f3eb',
                pointerEvents: 'none',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'Cinzel, serif', fontWeight: 900,
                    fontSize: 26, letterSpacing: '0.18em',
                    textShadow: isHover ? '2px 2px 0 #f5f3eb' : `2px 2px 0 ${item.accent}`,
                    lineHeight: 1,
                  }}>{item.label}</div>
                  <div style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: 9, letterSpacing: '0.35em',
                    marginTop: 5,
                    color: isHover ? '#06030a' : '#94a3b8',
                  }}>{item.sub} · {item.meta}</div>
                </div>
                <div style={{
                  fontFamily: 'Cinzel, serif', fontWeight: 900,
                  fontSize: 30,
                  color: isHover ? '#06030a' : item.accent,
                  transform: isHover ? 'translateX(6px)' : 'translateX(0)',
                  transition: 'transform 0.25s ease',
                }}>›</div>
              </div>
              {isHover && (
                <div style={{
                  position: 'absolute', top: -14, left: -28,
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 10, letterSpacing: '0.35em',
                  color: item.accent,
                  background: '#06030a',
                  padding: '4px 10px',
                  transform: 'skewX(-12deg)',
                  border: `1px solid ${item.accent}`,
                  animation: 'p5-slide-in 0.18s ease-out',
                }}>SELECT ›</div>
              )}
            </button>
          );
        })}
      </div>

      {/* === FOOTER tape (magenta) === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
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
            <span key={i}>v0.1 ALPHA · NON DISTRIBUIRE · BUILD 2026.05.01 · LA GRANDE GUERRA · CAP. III · DEBITO DI SANGUE · {' '}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

window.MenuV5PersonaCosmic = MenuV5PersonaCosmic;
