// MenuV4Sacrale — cattedrale spaziale, runa cosmica al centro, sigilli orbitanti
// Atmosfera: oro su nero, simmetria sacra, lentezza, simboli runici
// Pulsanti come petali/stazioni attorno alla runa centrale
function MenuV4Sacrale() {
  const [hover, setHover] = React.useState(null);

  const items = [
    { id: 'campagna',     label: 'CAMPAGNA',       sub: 'STORIA',         angle: -90, glyph: '✦' },
    { id: 'scaramuccia',  label: 'SCARAMUCCIA',    sub: 'PARTITA LIBERA', angle: -36, glyph: '◈' },
    { id: 'multiplayer',  label: 'MULTIGIOCATORE', sub: 'BETA',           angle: 18,  glyph: '◇', disabled: true },
    { id: 'galleria',     label: 'GALLERIA',       sub: 'ARCHIVIO',       angle: 162, glyph: '✧' },
    { id: 'opzioni',      label: 'OPZIONI',        sub: 'SISTEMA',        angle: 234, glyph: '✜' },
  ];

  // hover info
  const hoveredItem = items.find(i => i.id === hover);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 50%, #1a1410 0%, #0a0608 50%, #000 100%)',
      fontFamily: 'Cinzel, serif', color: '#fef3c7',
    }}>
      {/* === STARFIELD STILL === */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0}}>
        {Array.from({length: 80}).map((_, i) => {
          const x = (i*73 % 1280); const y = (i*131 % 840);
          const r = 0.3 + (i%5)*0.2;
          return <circle key={i} cx={x} cy={y} r={r} fill="#fef3c7" opacity={0.3 + (i%4)*0.15}/>;
        })}
      </svg>

      {/* === CATHEDRAL ARCHWAY (vertical lines + arch on top) === */}
      <svg width="100%" height="100%" style={{position:'absolute', inset:0, pointerEvents:'none'}} viewBox="0 0 1280 840" preserveAspectRatio="none">
        {/* Side columns */}
        <line x1="120" y1="60" x2="120" y2="780" stroke="rgba(212,175,55,0.25)" strokeWidth="1"/>
        <line x1="160" y1="60" x2="160" y2="780" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5"/>
        <line x1="1160" y1="60" x2="1160" y2="780" stroke="rgba(212,175,55,0.25)" strokeWidth="1"/>
        <line x1="1120" y1="60" x2="1120" y2="780" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5"/>
        {/* Arch */}
        <path d="M 120 60 Q 640 -120 1160 60" stroke="rgba(212,175,55,0.4)" strokeWidth="1" fill="none"/>
        <path d="M 160 80 Q 640 -80 1120 80" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" fill="none"/>
        {/* Floor lines (perspective) */}
        <line x1="0" y1="780" x2="1280" y2="780" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
        <line x1="200" y1="820" x2="1080" y2="820" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5"/>
      </svg>

      {/* === CENTRAL RUNE - the focal element === */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 460, height: 460,
        zIndex: 3,
      }}>
        {/* outer slow ring */}
        <svg width="460" height="460" style={{
          position:'absolute', inset:0,
          animation: 'spin-slow 80s linear infinite',
        }} viewBox="0 0 460 460">
          <circle cx="230" cy="230" r="220" fill="none" stroke="#d4af37" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.5"/>
          {/* runic glyphs around */}
          {Array.from({length: 12}).map((_, i) => {
            const a = (i*30 - 90) * Math.PI/180;
            const x = 230 + Math.cos(a)*220;
            const y = 230 + Math.sin(a)*220;
            return <text key={i} x={x} y={y} fill="#d4af37" fontSize="13"
              fontFamily="Cinzel, serif" textAnchor="middle" dominantBaseline="middle"
              opacity="0.85">{['✦','◇','✧','◈','☩','✜','✦','◇','✧','◈','☩','✜'][i]}</text>;
          })}
        </svg>
        {/* middle reverse ring */}
        <svg width="460" height="460" style={{
          position:'absolute', inset:0,
          animation: 'spin-rev 60s linear infinite',
        }} viewBox="0 0 460 460">
          <circle cx="230" cy="230" r="170" fill="none" stroke="#d4af37" strokeWidth="0.6" opacity="0.4"/>
          <circle cx="230" cy="230" r="160" fill="none" stroke="#d4af37" strokeWidth="0.4" strokeDasharray="1 4" opacity="0.6"/>
        </svg>
        {/* inner core */}
        <div style={{
          position: 'absolute', inset: 100,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection: 'column',
          animation: 'runic-throb 5s ease-in-out infinite',
        }}>
          <svg width="260" height="260" viewBox="0 0 260 260">
            <defs>
              <radialGradient id="runeCore">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9"/>
                <stop offset="60%" stopColor="#d4af37" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="130" cy="130" r="120" fill="url(#runeCore)"/>
            {/* hexagram */}
            <polygon points="130,30 215,180 45,180" fill="none" stroke="#fef3c7" strokeWidth="1.2" opacity="0.85"/>
            <polygon points="130,230 215,80 45,80" fill="none" stroke="#fef3c7" strokeWidth="1.2" opacity="0.85"/>
            <circle cx="130" cy="130" r="100" fill="none" stroke="#d4af37" strokeWidth="0.6"/>
            <circle cx="130" cy="130" r="60" fill="none" stroke="#d4af37" strokeWidth="0.4" strokeDasharray="3 3"/>
            <circle cx="130" cy="130" r="6" fill="#fef3c7"/>
          </svg>
        </div>
        {/* SATZE wordmark inside on top of rune */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          transform: 'translateY(-50%)',
          textAlign: 'center', pointerEvents: 'none',
          zIndex: 4,
        }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 56, letterSpacing: '0.4em',
            color: '#fef3c7', marginLeft: '0.4em',
            textShadow: '0 0 30px rgba(212,175,55,0.8)',
            lineHeight: 1,
          }}>SATZE</div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontStyle: 'italic',
            fontSize: 11, letterSpacing: '0.45em',
            color: '#d4af37', marginTop: 8,
            textTransform: 'uppercase',
          }}>La Grande Guerra</div>
        </div>
      </div>

      {/* === ORBITAL MENU PETALS === */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 0, height: 0,
        zIndex: 4,
      }}>
        {items.map((item, i) => {
          const isHover = hover === item.id;
          const radius = 320;
          const a = item.angle * Math.PI/180;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius;
          return (
            <button key={item.id}
              onMouseEnter={() => !item.disabled && setHover(item.id)}
              onMouseLeave={() => setHover(null)}
              disabled={item.disabled}
              style={{
                position: 'absolute',
                left: x, top: y,
                transform: `translate(-50%, -50%) ${isHover ? 'scale(1.12)' : 'scale(1)'}`,
                background: 'transparent', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.35 : 1,
                padding: 0,
                transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)',
              }}>
              {/* hexagonal sigil tile */}
              <div style={{
                position: 'relative',
                width: 130, height: 150,
                clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                background: isHover
                  ? 'radial-gradient(ellipse at center, rgba(254,243,199,0.25) 0%, rgba(212,175,55,0.15) 60%, rgba(0,0,0,0.6) 100%)'
                  : 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0.7) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
                transition: 'all 0.4s ease',
                boxShadow: isHover ? '0 0 50px rgba(212,175,55,0.6)' : 'none',
              }}>
                {/* hex border via second clipPath layer */}
                <div style={{
                  position:'absolute', inset: 2,
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                  background: '#000',
                  zIndex: 0,
                }}/>
                <div style={{
                  position:'absolute', inset: 3,
                  clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                  background: isHover
                    ? 'radial-gradient(ellipse at center, rgba(254,243,199,0.28) 0%, rgba(0,0,0,0.95) 100%)'
                    : 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, rgba(0,0,0,0.95) 100%)',
                  zIndex: 0,
                  transition: 'all 0.4s ease',
                }}/>
                <div style={{
                  position: 'relative', zIndex: 1,
                  fontSize: 36,
                  color: isHover ? '#fef3c7' : '#d4af37',
                  textShadow: isHover ? '0 0 20px rgba(254,243,199,0.9)' : '0 0 10px rgba(212,175,55,0.5)',
                  marginBottom: 6,
                  animation: isHover ? 'runic-throb 1.6s ease-in-out infinite' : 'none',
                }}>{item.glyph}</div>
                <div style={{
                  position: 'relative', zIndex: 1,
                  fontFamily: 'Cinzel, serif', fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.25em',
                  color: isHover ? '#fef3c7' : '#d4af37',
                  textShadow: isHover ? '0 0 8px rgba(212,175,55,0.7)' : 'none',
                  textAlign: 'center', padding: '0 8px',
                  textTransform: 'uppercase',
                }}>{item.label}</div>
              </div>
              {/* connector line to center on hover */}
              {isHover && (
                <div style={{
                  position: 'absolute', left: '50%', top: '50%',
                  width: radius - 65,
                  height: 1,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.8) 0%, transparent 100%)',
                  transformOrigin: '0 0',
                  transform: `rotate(${item.angle + 180}deg)`,
                  pointerEvents: 'none',
                }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* === HOVER caption — bottom === */}
      <div style={{
        position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center',
        zIndex: 6, height: 40,
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontStyle: 'italic',
          fontSize: 14, letterSpacing: '0.4em',
          color: hoveredItem ? '#fef3c7' : '#5c4a2a',
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(212,175,55,0.5)',
          transition: 'color 0.3s ease',
        }}>
          {hoveredItem ? `« ${hoveredItem.sub} »` : '· scegli la tua via ·'}
        </div>
      </div>

      {/* corner sigils */}
      {[
        {top: 24, left: 24, r: 0},
        {top: 24, right: 24, r: 90},
        {bottom: 24, right: 24, r: 180},
        {bottom: 24, left: 24, r: 270},
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', ...c,
          fontFamily: 'Cinzel, serif',
          fontSize: 16, color: '#d4af37',
          opacity: 0.5,
          transform: `rotate(${c.r}deg)`,
        }}>✜</div>
      ))}
    </div>
  );
}

window.MenuV4Sacrale = MenuV4Sacrale;
