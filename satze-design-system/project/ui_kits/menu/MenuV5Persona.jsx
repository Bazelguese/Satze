// MenuV5Persona — stile Persona 5R / P3 Reload
// Pulsanti enormi inclinati (skewX), chevron radiali, tipografia esplosa fuori dai bordi,
// fondo a graffi/screen-tone, accenti grafici diagonali ovunque, hover che fa "saltare" i pulsanti
function MenuV5Persona() {
  const [hover, setHover] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(h);
  }, []);

  const items = [
    { id: 'campagna',     label: 'CAMPAGNA',       sub: 'STORIA',        accent: '#fbbf24', meta: 'CAP 03 · DEBITO DI SANGUE' },
    { id: 'scaramuccia',  label: 'SCARAMUCCIA',    sub: 'PARTITA LIBERA', accent: '#38bdf8', meta: '5v5 · QUICK MATCH' },
    { id: 'multiplayer',  label: 'MULTIGIOCATORE', sub: 'BETA',           accent: '#a78bfa', meta: 'COMING SOON',   disabled: true },
    { id: 'galleria',     label: 'GALLERIA',       sub: 'ARCHIVIO',       accent: '#22d3ee', meta: '247 / 312 CARTE' },
    { id: 'opzioni',      label: 'OPZIONI',        sub: 'SISTEMA',        accent: '#94a3b8', meta: 'v0.1 ALPHA' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: '#0a0a0d',
      fontFamily: 'Chakra Petch, sans-serif',
      color: '#f5f3eb',
    }}>
      {/* === FONDO: gradient + texture screen-tone + scratches === */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #1a0a14 0%, #0a0a0d 55%, #14091a 100%)',
      }}/>
      {/* halftone dots */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1.4px)',
        backgroundSize: '8px 8px',
        mixBlendMode: 'screen',
      }}/>
      {/* diagonal scratches */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, opacity:0.18}}>
        <defs>
          <pattern id="scratch" width="200" height="200" patternUnits="userSpaceOnUse">
            <line x1="0" y1="50"  x2="200" y2="0"   stroke="#fbbf24" strokeWidth="0.5"/>
            <line x1="0" y1="120" x2="200" y2="80"  stroke="#fbbf24" strokeWidth="0.3"/>
            <line x1="0" y1="180" x2="200" y2="150" stroke="#fff"    strokeWidth="0.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scratch)"/>
      </svg>

      {/* === GIANT BG TYPOGRAPHY (the "explosion") === */}
      <div style={{
        position: 'absolute', top: -40, left: -60,
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 320, lineHeight: 0.75,
        letterSpacing: '-0.04em',
        color: 'rgba(251, 191, 36, 0.08)',
        WebkitTextStroke: '2px rgba(251,191,36,0.18)',
        transform: 'skewX(-8deg) rotate(-2deg)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>SATZE</div>
      <div style={{
        position: 'absolute', bottom: -60, right: -40,
        fontFamily: 'Cinzel, serif', fontStyle: 'italic',
        fontSize: 180, lineHeight: 0.85,
        color: 'rgba(167, 139, 250, 0.06)',
        WebkitTextStroke: '1px rgba(167,139,250,0.22)',
        transform: 'skewX(-8deg) rotate(2deg)',
        textAlign: 'right',
        pointerEvents: 'none', userSelect: 'none',
      }}>LA GRANDE<br/>GUERRA</div>

      {/* === CHEVRON DIAGONAL ACCENTS (alto-sx, in movimento) === */}
      <div style={{ position:'absolute', top: 24, left: 24, display:'flex', gap: 6, transform: 'skewX(-15deg)' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width: 28, height: 4,
            background: i === 0 ? '#fbbf24' : `rgba(251,191,36,${0.6 - i*0.12})`,
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

      {/* === HEADER (logo small, off-grid) === */}
      <div style={{
        position: 'absolute', top: 36, left: '50%',
        transform: 'translateX(-50%) skewX(-6deg)',
        display: 'flex', alignItems: 'center', gap: 18,
        zIndex: 10,
      }}>
        <div style={{ width: 48, height: 48, position: 'relative' }}>
          {/* runa stilizzata */}
          <svg viewBox="0 0 48 48" width="48" height="48"
            style={{ animation: 'spin-slow 20s linear infinite' }}>
            <polygon points="24,4 44,18 36,42 12,42 4,18" fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
            <polygon points="24,12 36,20 32,36 16,36 12,20" fill="none" stroke="#fbbf24" strokeWidth="0.6"/>
            <circle cx="24" cy="24" r="3" fill="#fbbf24"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 38, letterSpacing: '0.22em',
            color: '#f5f3eb', textShadow: '4px 4px 0 #fbbf24',
            lineHeight: 1,
          }}>SATZE</div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 10, color: '#fbbf24',
            letterSpacing: '0.45em', marginTop: 4,
          }}>LA·GRANDE·GUERRA</div>
        </div>
      </div>

      {/* === MENU LIST: pulsanti P5-style stacked, con offset progressivo === */}
      <div style={{
        position: 'absolute', top: 150, right: 60,
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
              {/* OUTER BLACK SHAPE (big, skewed, with red accent edge) */}
              <div style={{
                position: 'relative',
                height: 78,
                background: isHover
                  ? `linear-gradient(90deg, ${item.accent} 0%, ${item.accent}dd 60%, ${item.accent}88 100%)`
                  : 'linear-gradient(90deg, #1a1a1f 0%, #0a0a0d 100%)',
                clipPath: 'polygon(40px 0, 100% 0, 100% 100%, 0 100%)',
                transform: 'skewX(-12deg)',
                transition: 'background 0.2s',
                boxShadow: isHover ? `-6px 6px 0 ${item.accent}, 0 0 32px ${item.accent}66` : '4px 4px 0 rgba(0,0,0,0.6)',
              }}>
                {/* inner stripe (P5 signature) */}
                <div style={{
                  position: 'absolute', top: 6, bottom: 6, left: 50, right: 6,
                  border: `1.5px solid ${isHover ? '#0a0a0d' : '#3a3a42'}`,
                  pointerEvents: 'none',
                }}/>
                {/* faction stripe sx */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, width: 12,
                  background: item.accent,
                  boxShadow: `inset -2px 0 0 #0a0a0d`,
                }}/>
              </div>
              {/* TEXT (un-skewed, on top) */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 80, right: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: isHover ? '#0a0a0d' : '#f5f3eb',
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
                    color: isHover ? '#0a0a0d' : '#94a3b8',
                  }}>{item.sub} · {item.meta}</div>
                </div>
                {/* arrow */}
                <div style={{
                  fontFamily: 'Cinzel, serif', fontWeight: 900,
                  fontSize: 30,
                  color: isHover ? '#0a0a0d' : item.accent,
                  transform: isHover ? 'translateX(6px)' : 'translateX(0)',
                  transition: 'transform 0.25s ease',
                }}>›</div>
              </div>
              {/* hover satellite labels (P5 signature: extra graphic on hover) */}
              {isHover && (
                <div style={{
                  position: 'absolute', top: -14, left: -28,
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 10, letterSpacing: '0.35em',
                  color: item.accent,
                  background: '#0a0a0d',
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

      {/* === CHARACTER SILHOUETTE (left side, P5-style portrait crop) === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 40,
        width: 380, height: 580,
        clipPath: 'polygon(20px 0, 100% 0, calc(100% - 40px) 100%, 0 100%)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.08) 60%, rgba(251,191,36,0.18) 100%)',
        border: '2px solid rgba(251,191,36,0.4)',
        overflow: 'hidden',
        animation: 'float-y 4s ease-in-out infinite',
      }}>
        {/* sigil watermark inside */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cinzel, serif', fontWeight: 900,
          fontSize: 280, lineHeight: 1,
          color: 'rgba(251,191,36,0.25)',
          textShadow: '0 0 40px rgba(251,191,36,0.6)',
        }}>K</div>
        {/* label */}
        <div style={{
          position: 'absolute', bottom: 18, left: 24, right: 24,
          fontFamily: 'Cinzel, serif', fontStyle: 'italic',
          fontSize: 14, color: '#fbbf24',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textShadow: '0 2px 4px #000',
        }}>"I templi cantano. La pietra ascolta."</div>
        <div style={{
          position: 'absolute', top: 16, left: 16,
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 9, letterSpacing: '0.4em',
          color: '#fbbf24',
        }}>KETHRAN · L4</div>
      </div>

      {/* === FOOTER tape === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
        background: '#fbbf24',
        clipPath: 'polygon(0 6px, 100% 0, 100% 100%, 0 100%)',
        display: 'flex', alignItems: 'flex-end',
        overflow: 'hidden', zIndex: 8,
      }}>
        <div style={{
          display: 'flex', whiteSpace: 'nowrap',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.3em',
          color: '#0a0a0d', padding: '0 24px',
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

window.MenuV5Persona = MenuV5Persona;
