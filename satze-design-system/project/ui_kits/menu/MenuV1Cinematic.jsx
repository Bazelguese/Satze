// MenuV1Cinematic — atmosfera cinematica scura, profondità cosmica
// Layout: pannelli sliding orizzontali, scena di cometa che cade in lontananza,
// pulsanti come carte tattili che si illuminano da dentro
function MenuV1Cinematic() {
  const [hover, setHover] = React.useState(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const stars = Array.from({length: 200}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height*0.7,
      r: Math.random()*1.4 + 0.2,
      tw: Math.random()*Math.PI*2,
      depth: Math.random(),
    }));
    const dust = Array.from({length: 40}, () => ({
      x: Math.random()*canvas.width, y: canvas.height + Math.random()*100,
      vy: -(Math.random()*0.5 + 0.15),
      vx: (Math.random()-0.5)*0.2,
      size: Math.random()*1.6 + 0.3,
      life: Math.random()*400, max: Math.random()*300 + 200,
    }));
    let raf;
    const tick = (t) => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      stars.forEach(s => {
        const a = (0.4 + 0.5*Math.sin(t*0.0012 + s.tw)) * (0.5 + s.depth*0.5);
        ctx.globalAlpha = a;
        ctx.fillStyle = s.depth > 0.7 ? '#fbbf24' : '#cfe8ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      });
      dust.forEach(p => {
        p.life++;
        if (p.life > p.max || p.y < -20) { p.y = canvas.height+20; p.x = Math.random()*canvas.width; p.life = 0; }
        p.y += p.vy; p.x += p.vx;
        const r = p.life/p.max;
        const o = r<0.15 ? r/0.15 : r>0.8 ? (1-r)/0.2 : 1;
        ctx.globalAlpha = o*0.6; ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [
    { id: 'campagna',     label: 'Campagna',       sub: 'Storia',         tag: 'CAP III' },
    { id: 'scaramuccia',  label: 'Scaramuccia',    sub: 'Partita libera', tag: '5v5' },
    { id: 'multiplayer',  label: 'Multigiocatore', sub: 'Beta',           tag: 'WIP', disabled: true },
    { id: 'galleria',     label: 'Galleria',       sub: 'Archivio carte', tag: '247/312' },
    { id: 'opzioni',      label: 'Opzioni',        sub: 'Sistema',        tag: 'v0.1' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 35%, #0e1c30 0%, #050608 60%, #000 100%)',
      fontFamily: 'Chakra Petch, sans-serif', color: '#e8eaed',
    }}>
      <canvas ref={canvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%'}}/>

      {/* COMETA in lontananza */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, pointerEvents:'none'}}>
        <defs>
          <radialGradient id="cometHead">
            <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
            <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="cometTail" x1="0" x2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0"/>
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        <line x1="20%" y1="55%" x2="78%" y2="22%" stroke="url(#cometTail)" strokeWidth="1.5" />
        <circle cx="78%" cy="22%" r="14" fill="url(#cometHead)">
          <animate attributeName="r" values="12;16;12" dur="3.4s" repeatCount="indefinite"/>
        </circle>
      </svg>

      {/* Distant battle silhouette */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%',
        background: 'linear-gradient(to top, #1a0e08 0%, rgba(26,20,16,0.6) 30%, transparent 100%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '24%',
        background: 'radial-gradient(ellipse at 30% 100%, rgba(194, 65, 12, 0.25) 0%, transparent 70%)',
        animation: 'flicker 6s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      {/* === LOGO floating top === */}
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center',
        zIndex: 5, animation: 'float-y 5s ease-in-out infinite',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 900,
          fontSize: 92, letterSpacing: '0.42em',
          color: '#f5f3eb', marginLeft: '0.42em',
          textShadow: '0 0 40px rgba(56,189,248,0.4), 0 4px 20px #000',
          lineHeight: 1,
        }}>SATZE</div>
        <div style={{
          width: 240, height: 1, margin: '14px auto',
          background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
        }}/>
        <div style={{
          fontFamily: 'Cinzel, serif', fontStyle: 'italic',
          fontSize: 13, letterSpacing: '0.5em',
          color: '#94a3b8', textTransform: 'uppercase',
        }}>La Grande Guerra</div>
      </div>

      {/* === MENU sliding panels horizontal at bottom === */}
      <div style={{
        position: 'absolute', bottom: 90, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 14,
        zIndex: 5, padding: '0 60px',
      }}>
        {items.map((item, i) => {
          const isHover = hover === item.id;
          return (
            <button key={item.id}
              onMouseEnter={() => !item.disabled && setHover(item.id)}
              onMouseLeave={() => setHover(null)}
              disabled={item.disabled}
              style={{
                position: 'relative',
                width: isHover ? 260 : 200, height: 220,
                background: 'transparent', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.35 : 1,
                transition: 'width 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)',
                padding: 0,
              }}>
              {/* outer panel: thin frame + dark inset */}
              <div style={{
                position: 'absolute', inset: 0,
                background: isHover
                  ? 'linear-gradient(180deg, rgba(251,191,36,0.18) 0%, rgba(56,189,248,0.04) 50%, rgba(0,0,0,0.7) 100%)'
                  : 'linear-gradient(180deg, rgba(56,189,248,0.06) 0%, rgba(0,0,0,0.7) 100%)',
                border: isHover ? '1px solid #fbbf24' : '1px solid rgba(148,163,184,0.3)',
                clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
                transition: 'all 0.3s ease',
                boxShadow: isHover ? '0 0 40px rgba(251,191,36,0.35), inset 0 0 30px rgba(251,191,36,0.08)' : 'inset 0 0 30px rgba(0,0,0,0.6)',
              }}/>
              {/* inner dashed frame */}
              <div style={{
                position: 'absolute', inset: 10,
                border: `1px dashed ${isHover ? '#fbbf24' : 'rgba(148,163,184,0.35)'}`,
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                pointerEvents: 'none',
              }}/>
              {/* content */}
              <div style={{
                position: 'absolute', inset: 0,
                padding: '24px 22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                pointerEvents: 'none',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: 9, letterSpacing: '0.4em',
                    color: isHover ? '#fbbf24' : '#64748b',
                  }}>{String(i+1).padStart(2,'0')} · {item.tag}</div>
                  <div style={{
                    height: 1, marginTop: 8, marginBottom: 14,
                    background: isHover ? '#fbbf24' : 'rgba(148,163,184,0.3)',
                  }}/>
                </div>
                <div style={{textAlign: 'left'}}>
                  <div style={{
                    fontFamily: 'Cinzel, serif', fontWeight: 700,
                    fontSize: isHover ? 26 : 22,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#f5f3eb',
                    transition: 'font-size 0.3s ease',
                    textShadow: isHover ? '0 0 14px rgba(251,191,36,0.6)' : '0 2px 6px #000',
                    lineHeight: 1,
                  }}>{item.label}</div>
                  <div style={{
                    fontFamily: 'Cinzel, serif', fontStyle: 'italic',
                    fontSize: 11, letterSpacing: '0.32em',
                    color: '#94a3b8', marginTop: 8,
                    textTransform: 'uppercase',
                  }}>{item.sub}</div>
                </div>
              </div>
              {/* glow line bottom on hover */}
              {isHover && (
                <div style={{
                  position: 'absolute', bottom: 14, left: 14, right: 14, height: 2,
                  background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                  filter: 'blur(0.5px)',
                  animation: 'pulse-glow 1.4s ease-in-out infinite',
                  color: '#fbbf24',
                }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* === FOOTER === */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10, color: '#475569', letterSpacing: '0.4em',
      }}>v0.1 ALPHA · NON DISTRIBUIRE</div>

      {/* corner ticks */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{
          position: 'absolute',
          top: c.startsWith('t') ? 18 : 'auto',
          bottom: c.startsWith('b') ? 18 : 'auto',
          left: c.endsWith('l') ? 18 : 'auto',
          right: c.endsWith('r') ? 18 : 'auto',
          width: 18, height: 18,
          borderTop: c.startsWith('t') ? '1px solid #fbbf24' : 'none',
          borderBottom: c.startsWith('b') ? '1px solid #fbbf24' : 'none',
          borderLeft: c.endsWith('l') ? '1px solid #fbbf24' : 'none',
          borderRight: c.endsWith('r') ? '1px solid #fbbf24' : 'none',
          opacity: 0.6,
        }}/>
      ))}
    </div>
  );
}

window.MenuV1Cinematic = MenuV1Cinematic;
