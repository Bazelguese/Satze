// MenuV2Cyber — tattico-cyber HUD denso, telemetria militare ovunque
// Stile terminale di guerra: griglia di dati, righe POT/DAN simulate, glitch
function MenuV2Cyber() {
  const [hover, setHover] = React.useState(null);
  const [time, setTime] = React.useState(0);
  React.useEffect(() => {
    const h = setInterval(() => setTime(t => t + 1), 100);
    return () => clearInterval(h);
  }, []);

  const items = [
    { id: 'campagna',     label: 'CAMPAGNA',     code: 'CMP-001', pot: 84, dan: 76, status: 'READY' },
    { id: 'scaramuccia',  label: 'SCARAMUCCIA',  code: 'SKM-002', pot: 62, dan: 58, status: 'READY' },
    { id: 'multiplayer',  label: 'MULTIGIOC.',   code: 'MLT-003', pot: 0,  dan: 0,  status: 'OFFLINE', disabled: true },
    { id: 'galleria',     label: 'GALLERIA',     code: 'ARC-004', pot: 99, dan: 99, status: 'INDEX' },
    { id: 'opzioni',      label: 'OPZIONI',      code: 'SYS-005', pot: 50, dan: 50, status: 'STATIC' },
  ];

  // simulated telemetry rows
  const telemetry = [
    'SAT-NODE//6F-22 LINK ACTIVE',
    'GRID 47.20°N · 9.51°E STABLE',
    'POT-CORE @ 96.2% NOMINAL',
    'DAN-FIELD ECHO RETURNING',
    'CRYO LOCK · SECTOR 7G ARMED',
    'KETHRAN PINGED · SIG STRONG',
    'COMETA ETA T-00:14:32',
    'CORTE ROSSA · PRESENCE FLAGGED',
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: '#040608',
      fontFamily: 'Share Tech Mono, monospace', color: '#38bdf8',
    }}>
      {/* background grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: 'linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}/>
      {/* scanlines */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(56,189,248,0.04) 2px, rgba(56,189,248,0.04) 3px)',
        animation: 'scanline-move 8s linear infinite',
        pointerEvents: 'none',
      }}/>
      {/* CRT vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* === TOP HUD BAR === */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        borderBottom: '1px solid rgba(56,189,248,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: 10, letterSpacing: '0.3em',
        background: 'linear-gradient(180deg, rgba(56,189,248,0.12) 0%, transparent 100%)',
      }}>
        <div style={{display:'flex', gap: 24}}>
          <span style={{color:'#fbbf24'}}>● SATZE //COMMAND</span>
          <span style={{color:'#94a3b8'}}>BUILD 2026.05.01</span>
          <span style={{color:'#94a3b8'}}>v0.1 ALPHA</span>
        </div>
        <div style={{display:'flex', gap: 18, color:'#94a3b8'}}>
          <span>NODE 6F-22</span>
          <span style={{color: time%10 < 5 ? '#22d3ee' : '#0891b2'}}>UPLINK ●</span>
          <span>{new Date().toISOString().slice(0,19).replace('T',' ')}</span>
        </div>
      </div>

      {/* === TITLE block === */}
      <div style={{
        position: 'absolute', top: 64, left: 36,
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontWeight: 900,
          fontSize: 56, letterSpacing: '0.35em',
          color: '#e8eaed',
          textShadow: '0 0 20px rgba(56,189,248,0.5)',
          lineHeight: 1,
        }}>SATZE</div>
        <div style={{
          fontSize: 11, letterSpacing: '0.4em',
          color: '#fbbf24', marginTop: 6,
        }}>// LA·GRANDE·GUERRA · TACTICAL OS</div>
        <div style={{
          marginTop: 14, fontSize: 10, color:'#64748b',
          maxWidth: 380, lineHeight: 1.6,
        }}>
          TERMINALE OPERATIVO · CMD ROOT · ACCESSO LIVELLO 7<br/>
          SELEZIONA UN MODULO PER PROCEDERE
        </div>
      </div>

      {/* === LEFT TELEMETRY PANEL === */}
      <div style={{
        position: 'absolute', top: 64, right: 36, width: 320,
        border: '1px solid rgba(56,189,248,0.4)',
        background: 'rgba(56,189,248,0.04)',
        padding: 14,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.3em',
          color: '#fbbf24', marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px dashed rgba(56,189,248,0.3)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>TELEMETRY</span><span>LIVE ●</span>
        </div>
        {telemetry.map((line, i) => (
          <div key={i} style={{
            fontSize: 10, color: '#94a3b8', marginBottom: 4,
            opacity: ((time + i*7) % 100) > 5 ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }}>
            <span style={{color:'#22d3ee'}}>›</span> {line}
          </div>
        ))}
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px dashed rgba(56,189,248,0.3)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: '#94a3b8',
        }}>
          <span>BUFFER</span>
          <span style={{color:'#fbbf24'}}>
            {Array.from({length:10}, (_,i) => (time+i)%10 < 7 ? '█' : '▒').join('')}
          </span>
        </div>
      </div>

      {/* === MENU MODULE LIST (centro) === */}
      <div style={{
        position: 'absolute', top: 200, left: 36, right: 36,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.4em',
          color:'#fbbf24', marginBottom: 6,
          display:'flex', justifyContent:'space-between',
        }}>
          <span>// MODULES · 5 AVAILABLE</span>
          <span style={{color:'#94a3b8'}}>SELECT &gt;_</span>
        </div>
        {items.map((item, i) => {
          const isHover = hover === item.id;
          return (
            <button key={item.id}
              onMouseEnter={() => !item.disabled && setHover(item.id)}
              onMouseLeave={() => setHover(null)}
              disabled={item.disabled}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '46px 80px 1fr 220px 100px',
                alignItems: 'center', gap: 16,
                padding: '12px 18px',
                background: isHover ? 'rgba(56,189,248,0.12)' : item.disabled ? 'rgba(148,163,184,0.03)' : 'rgba(56,189,248,0.03)',
                border: `1px solid ${isHover ? '#fbbf24' : 'rgba(56,189,248,0.25)'}`,
                color: isHover ? '#fbbf24' : '#e8eaed',
                fontFamily: 'Share Tech Mono, monospace',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                textAlign: 'left',
                transition: 'all 0.18s ease',
                transform: isHover ? 'translateX(6px)' : 'translateX(0)',
              }}>
              <span style={{
                fontSize: 16, color: isHover ? '#fbbf24' : '#22d3ee',
                fontWeight: 700,
              }}>{isHover ? '▶' : '◇'}</span>
              <span style={{fontSize: 11, letterSpacing: '0.2em', color:'#94a3b8'}}>{item.code}</span>
              <span style={{
                fontFamily: 'Cinzel, serif', fontWeight: 700,
                fontSize: 22, letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: isHover ? '#fbbf24' : '#e8eaed',
                textShadow: isHover ? '0 0 12px rgba(251,191,36,0.6)' : 'none',
                animation: isHover ? 'shake-tiny 0.4s infinite' : 'none',
              }}>{item.label}</span>
              {/* POT/DAN bars */}
              <div style={{display:'flex', gap: 12, fontSize: 10}}>
                <div style={{flex: 1}}>
                  <div style={{display:'flex', justifyContent:'space-between', color:'#94a3b8', marginBottom: 2}}>
                    <span>POT</span><span style={{color:'#22d3ee'}}>{String(item.pot).padStart(2,'0')}</span>
                  </div>
                  <div style={{height: 4, background:'rgba(56,189,248,0.15)', position:'relative'}}>
                    <div style={{
                      position:'absolute', inset: 0,
                      width: `${item.pot}%`,
                      background: isHover ? '#fbbf24' : '#22d3ee',
                      transition: 'background 0.2s',
                    }}/>
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <div style={{display:'flex', justifyContent:'space-between', color:'#94a3b8', marginBottom: 2}}>
                    <span>DAN</span><span style={{color:'#dc2626'}}>{String(item.dan).padStart(2,'0')}</span>
                  </div>
                  <div style={{height: 4, background:'rgba(220,38,38,0.15)', position:'relative'}}>
                    <div style={{
                      position:'absolute', inset: 0,
                      width: `${item.dan}%`,
                      background: '#dc2626',
                    }}/>
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 10, letterSpacing: '0.2em',
                color: item.status === 'OFFLINE' ? '#64748b' : '#22d3ee',
                textAlign:'right',
              }}>[{item.status}]</span>
            </button>
          );
        })}
      </div>

      {/* === BOTTOM HUD: POT/DAN aggregate + alerts === */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
        borderTop: '1px solid rgba(56,189,248,0.4)',
        background: 'linear-gradient(0deg, rgba(56,189,248,0.1) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px',
      }}>
        <div style={{display:'flex', gap: 32, alignItems:'center'}}>
          <div>
            <div style={{fontSize: 9, color:'#64748b', letterSpacing:'0.3em'}}>POT-CORE</div>
            <div style={{fontSize: 22, color:'#22d3ee', fontWeight: 700}}>96.2%</div>
          </div>
          <div>
            <div style={{fontSize: 9, color:'#64748b', letterSpacing:'0.3em'}}>DAN-FIELD</div>
            <div style={{fontSize: 22, color:'#dc2626', fontWeight: 700}}>14.8</div>
          </div>
          <div>
            <div style={{fontSize: 9, color:'#64748b', letterSpacing:'0.3em'}}>LATENCY</div>
            <div style={{fontSize: 22, color:'#fbbf24', fontWeight: 700}}>{12 + (time % 7)}ms</div>
          </div>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap: 14,
          fontSize: 10, color:'#94a3b8', letterSpacing: '0.25em',
        }}>
          <span style={{color:'#dc2626', animation:'flicker 2s infinite'}}>⚠ COMETA T-00:14:32</span>
          <span>·</span>
          <span style={{color:'#fbbf24'}}>3 NUOVE MISSIONI</span>
        </div>
      </div>

      {/* corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{
          position: 'absolute',
          top: c.startsWith('t') ? 8 : 'auto',
          bottom: c.startsWith('b') ? 8 : 'auto',
          left: c.endsWith('l') ? 8 : 'auto',
          right: c.endsWith('r') ? 8 : 'auto',
          width: 22, height: 22,
          borderTop: c.startsWith('t') ? '2px solid #fbbf24' : 'none',
          borderBottom: c.startsWith('b') ? '2px solid #fbbf24' : 'none',
          borderLeft: c.endsWith('l') ? '2px solid #fbbf24' : 'none',
          borderRight: c.endsWith('r') ? '2px solid #fbbf24' : 'none',
        }}/>
      ))}
    </div>
  );
}

window.MenuV2Cyber = MenuV2Cyber;
