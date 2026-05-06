// MenuV3Bellica — accampamento dopo battaglia, embers, banner di guerra lacerati
// Atmosfera: fuoco arancione/rosso, fumo lento, schegge di metallo che fluttuano,
// pulsanti come placche di acciaio scheggiato montate su pali di legno
function MenuV3Bellica() {
  const [hover, setHover] = React.useState(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const embers = Array.from({length: 80}, () => ({
      x: Math.random()*canvas.width,
      y: canvas.height + Math.random()*200,
      vy: -(Math.random()*1.2 + 0.4),
      vx: (Math.random()-0.5)*0.4,
      size: Math.random()*2 + 0.4,
      life: Math.random()*300,
      max: Math.random()*200 + 200,
      hot: Math.random() > 0.4,
    }));
    const smoke = Array.from({length: 30}, () => ({
      x: Math.random()*canvas.width,
      y: canvas.height + Math.random()*100,
      vy: -(Math.random()*0.4 + 0.1),
      r: Math.random()*40 + 20,
      life: 0, max: Math.random()*400 + 300,
    }));
    let raf;
    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // smoke
      smoke.forEach(s => {
        s.life++;
        if (s.life > s.max) { s.life = 0; s.x = Math.random()*canvas.width; s.y = canvas.height + 50; }
        s.y += s.vy;
        const r = s.life/s.max;
        ctx.globalAlpha = (r < 0.5 ? r : 1-r) * 0.18;
        ctx.fillStyle = '#3a2820';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      });
      // embers
      embers.forEach(p => {
        p.life++;
        if (p.life > p.max || p.y < -20) { p.y = canvas.height+20; p.x = Math.random()*canvas.width; p.life = 0; }
        p.y += p.vy; p.x += p.vx;
        const r = p.life/p.max;
        const o = r<0.15 ? r/0.15 : r>0.8 ? (1-r)/0.2 : 1;
        ctx.globalAlpha = o;
        ctx.fillStyle = p.hot ? (r < 0.4 ? '#fff7ed' : '#f97316') : '#dc2626';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [
    { id: 'campagna',     label: 'Campagna',       sub: 'Marcia avanti',   tag: 'CAP III · DEBITO DI SANGUE' },
    { id: 'scaramuccia',  label: 'Scaramuccia',    sub: 'Schermaglia',     tag: 'PARTITA LIBERA' },
    { id: 'multiplayer',  label: 'Multigiocatore', sub: 'In addestramento', tag: 'BETA', disabled: true },
    { id: 'galleria',     label: 'Galleria',       sub: 'Reliquie',        tag: '247 / 312 CARTE' },
    { id: 'opzioni',      label: 'Opzioni',        sub: 'Tenda comandante', tag: 'SISTEMA' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 90%, #4a1a08 0%, #1a0d06 50%, #050302 100%)',
      fontFamily: 'Chakra Petch, sans-serif', color: '#f5e7d3',
    }}>
      <canvas ref={canvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%'}}/>

      {/* terrain glow at bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.35) 0%, transparent 60%)',
        animation: 'flicker 4s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      {/* burnt edges vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* === BANNERS lacerati ai lati === */}
      {[
        { side: 'left', color: '#dc2626', sigil: 'III' },
        { side: 'right', color: '#7c2d12', sigil: 'X' },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute', top: 30,
          [b.side]: 60, width: 70, height: 380,
          background: `linear-gradient(180deg, ${b.color} 0%, ${b.color}cc 70%, ${b.color}77 95%, transparent 100%)`,
          clipPath: 'polygon(0 0, 100% 0, 100% 78%, 90% 84%, 95% 92%, 80% 95%, 88% 100%, 60% 96%, 50% 100%, 30% 94%, 12% 100%, 5% 92%, 18% 86%, 0 80%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          animation: `${b.side === 'left' ? 'drift-x' : 'float-y'} ${4 + i*0.6}s ease-in-out infinite`,
          opacity: 0.85,
        }}>
          {/* rod */}
          <div style={{
            position: 'absolute', top: -8, left: -2, right: -2, height: 4,
            background: '#3a2820', boxShadow: '0 1px 0 #1a0d06',
          }}/>
          {/* sigil */}
          <div style={{
            position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center',
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 38, letterSpacing: '0.1em',
            color: '#fef3c7',
            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
          }}>{b.sigil}</div>
          {/* texture lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(180deg, transparent 0, transparent 10px, rgba(0,0,0,0.18) 10px, rgba(0,0,0,0.18) 11px)',
            pointerEvents: 'none',
          }}/>
        </div>
      ))}

      {/* === LOGO carved-in-stone === */}
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center',
        zIndex: 5,
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 900,
          fontSize: 88, letterSpacing: '0.4em',
          color: '#fef3c7', marginLeft: '0.4em',
          textShadow: '0 0 30px rgba(249,115,22,0.5), 0 4px 8px #000, 4px 6px 0 #1a0d06',
          lineHeight: 1,
          animation: 'shake-tiny 3s infinite',
        }}>SATZE</div>
        <div style={{
          fontFamily: 'Cinzel, serif', fontStyle: 'italic',
          fontSize: 14, letterSpacing: '0.45em',
          color: '#f97316', marginTop: 14,
          textTransform: 'uppercase',
          textShadow: '0 0 12px rgba(249,115,22,0.6)',
        }}>«La pietra ricorda»</div>
      </div>

      {/* === MENU iron plates === */}
      <div style={{
        position: 'absolute', top: 280, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
        zIndex: 5,
      }}>
        {items.map((item, i) => {
          const isHover = hover === item.id;
          const tilt = (i % 2 === 0 ? -1 : 1) * 0.5;
          return (
            <button key={item.id}
              onMouseEnter={() => !item.disabled && setHover(item.id)}
              onMouseLeave={() => setHover(null)}
              disabled={item.disabled}
              style={{
                position: 'relative',
                width: 480, padding: 0,
                background: 'transparent', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                transform: `rotate(${tilt}deg) ${isHover ? 'translateY(-3px) scale(1.03)' : ''}`,
                transition: 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
                filter: isHover ? 'drop-shadow(0 0 24px rgba(249,115,22,0.7))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
              }}>
              {/* iron plate, scheggiata sui bordi */}
              <div style={{
                position: 'relative',
                height: 64,
                background: isHover
                  ? 'linear-gradient(180deg, #3a2418 0%, #1f120a 100%)'
                  : 'linear-gradient(180deg, #2a1a10 0%, #14080a 100%)',
                clipPath: 'polygon(8px 4px, 18px 0, 60% 2px, 70% 0, 90% 3px, calc(100% - 6px) 0, 100% 8px, calc(100% - 4px) 22px, 100% 50%, calc(100% - 6px) calc(100% - 4px), 92% 100%, 68% calc(100% - 3px), 50% 100%, 32% calc(100% - 2px), 12% 100%, 0 calc(100% - 8px), 4px 60%, 0 30%, 4px 16px)',
                border: isHover ? '1px solid #f97316' : '1px solid #5c2a0e',
              }}>
                {/* rivets */}
                {[0.05, 0.12, 0.88, 0.95].map((p, j) => (
                  <div key={j} style={{
                    position: 'absolute', top: 8, left: `${p*100}%`,
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #8a6a48 0%, #3a2818 100%)',
                    boxShadow: '0 1px 0 #000',
                  }}/>
                ))}
                {[0.05, 0.12, 0.88, 0.95].map((p, j) => (
                  <div key={'b'+j} style={{
                    position: 'absolute', bottom: 8, left: `${p*100}%`,
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #8a6a48 0%, #3a2818 100%)',
                    boxShadow: '0 1px 0 #000',
                  }}/>
                ))}
                {/* heat glow inset */}
                {isHover && (
                  <div style={{
                    position:'absolute', inset:0,
                    background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.25) 0%, transparent 70%)',
                    animation: 'flicker 0.4s infinite',
                  }}/>
                )}
                {/* scratches across */}
                <svg width="100%" height="100%" style={{position:'absolute', inset:0, opacity: 0.4}}>
                  <line x1="10%" y1="20%" x2="40%" y2="40%" stroke="#5c2a0e" strokeWidth="0.5"/>
                  <line x1="60%" y1="60%" x2="92%" y2="80%" stroke="#5c2a0e" strokeWidth="0.4"/>
                  <line x1="20%" y1="80%" x2="55%" y2="50%" stroke="#5c2a0e" strokeWidth="0.3"/>
                </svg>
              </div>
              {/* text overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px',
                pointerEvents: 'none',
              }}>
                <div style={{textAlign: 'left'}}>
                  <div style={{
                    fontFamily: 'Cinzel, serif', fontWeight: 700,
                    fontSize: 22, letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: isHover ? '#fef3c7' : '#d6b88a',
                    textShadow: isHover ? '0 0 14px rgba(249,115,22,0.8)' : '0 2px 4px #000',
                    lineHeight: 1,
                  }}>{item.label}</div>
                  <div style={{
                    fontFamily: 'Cinzel, serif', fontStyle: 'italic',
                    fontSize: 11, letterSpacing: '0.2em',
                    color: isHover ? '#f97316' : '#94704a',
                    marginTop: 4,
                  }}>{item.sub}</div>
                </div>
                <div style={{
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 9, letterSpacing: '0.3em',
                  color: isHover ? '#f97316' : '#7a4a2a',
                  textAlign: 'right',
                  maxWidth: 160,
                }}>{item.tag}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* === FOOTER === */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10, color: '#94704a', letterSpacing: '0.4em',
        zIndex: 5,
      }}>v0.1 ALPHA · «Il ferro non dimentica»</div>
    </div>
  );
}

window.MenuV3Bellica = MenuV3Bellica;
