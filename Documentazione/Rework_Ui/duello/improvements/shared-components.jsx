/* Componenti condivisi: Card, HudPanel, StatOrb, ArmySigil, FocusCoin
 * Stile aderente a colors_and_type.css (Chakra Petch / Cinzel / Share Tech Mono · cyan/gold/fire)
 */

// ─── ArmySigil — glifo a piena schermata, usato nelle clash animation ───
function ArmySigil({ army, size = 360, opacity = 1, style = {} }) {
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      opacity, ...style,
    }}>
      {/* corona di linee */}
      <svg viewBox="0 0 200 200" width={size} height={size}
        style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 24px ${army.color})` }}>
        <circle cx="100" cy="100" r="95" fill="none" stroke={army.color} strokeWidth="1.5" opacity="0.6"/>
        <circle cx="100" cy="100" r="86" fill="none" stroke={army.color} strokeWidth="0.6" opacity="0.4"
          strokeDasharray="2 6"/>
        {/* tick marks */}
        {Array.from({length: 24}).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 95, y1 = 100 + Math.sin(a) * 95;
          const x2 = 100 + Math.cos(a) * (i % 6 === 0 ? 82 : 89);
          const y2 = 100 + Math.sin(a) * (i % 6 === 0 ? 82 : 89);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={army.color} strokeWidth={i % 6 === 0 ? 2 : 0.8} opacity={i % 6 === 0 ? 0.9 : 0.5}/>;
        })}
        <circle cx="100" cy="100" r="68" fill="none" stroke={army.color} strokeWidth="1" opacity="0.4"/>
      </svg>
      {/* glifo centrato */}
      <img src={army.glyph} alt={army.name}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: size * 0.42, height: size * 0.42,
          transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 12px ${army.color}) drop-shadow(0 0 24px ${army.color})`,
          objectFit: 'contain',
        }}/>
    </div>
  );
}

// ─── FocusCoin — moneta FC con glow campionario del rainbow ufficiale ───
function FocusCoin({ size = 36, army, intensity = 1, label }) {
  const c = army?.color || '#fbbf24';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, ${c}cc, ${c}33 70%)`,
      border: `1.5px solid ${c}`,
      boxShadow: `0 0 ${6 + intensity * 14}px ${c}aa, inset 0 0 8px rgba(0,0,0,0.4)`,
      display: 'grid', placeItems: 'center',
      fontFamily: 'Share Tech Mono, monospace', fontSize: size * 0.36,
      color: '#0a0a0d', fontWeight: 700,
    }}>{label || '◆'}</div>
  );
}

// ─── HudPanel — pannello tattico con clip-path angolo tagliato ───
function HudPanel({ title, tag, tone = 'cyan', children, style = {}, dense, glow }) {
  const tones = { cyan: '#38bdf8', gold: '#d4af37', fire: '#f97316', blood: '#dc2626', violet: '#a78bfa', teal: '#14b8a6' };
  const c = typeof tone === 'string' && tone.startsWith('#') ? tone : (tones[tone] || tones.cyan);
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(10,22,40,0.88), rgba(5,6,8,0.95))',
      border: `1.5px solid ${c}`,
      boxShadow: `0 0 ${glow ? 24 : 14}px ${c}33, inset 0 0 36px rgba(0,0,0,0.55)`,
      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      padding: dense ? '8px 12px' : '12px 16px',
      ...style,
    }}>
      {(title || tag) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: dense ? 4 : 8, gap: 8 }}>
          {title && <div style={{
            fontFamily: 'Chakra Petch', fontWeight: 600, fontSize: 11,
            letterSpacing: '0.2em', textTransform: 'uppercase', color: c,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</div>}
          {tag && <div style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{tag}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── StatOrb — vita / FC con cifra centrale e ring ───
function StatOrb({ value, max, label, tone = 'gold', size = 56, icon }) {
  const tones = { gold: '#d4af37', blood: '#dc2626', cyan: '#38bdf8', fire: '#f97316' };
  const c = tones[tone] || tones.gold;
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 1;
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="rgba(5,6,8,0.7)" stroke="#1e293b" strokeWidth="2"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 4px ${c})`, transition: 'stroke-dashoffset 0.5s ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontFamily: 'Share Tech Mono, monospace', fontSize: size * 0.36, color: c,
        fontWeight: 700, letterSpacing: '0.02em',
        textShadow: `0 0 6px ${c}66`,
      }}>{value}</div>
      {label && <div style={{
        position: 'absolute', bottom: -14, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'Chakra Petch', fontSize: 9, color: '#94a3b8',
        letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>{label}</div>}
    </div>
  );
}

// ─── HpBar — barra orizzontale con pulse on damage ───
function HpBar({ value, max, tone = 'gold', flash = 0, label }) {
  const tones = { gold: '#d4af37', blood: '#dc2626', cyan: '#38bdf8', emerald: '#10b981' };
  const c = tones[tone] || tones.gold;
  const pct = max ? Math.max(0, Math.min(1, value / max)) * 100 : 100;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        height: 10, background: 'rgba(5,6,8,0.7)', border: '1px solid #1e293b',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${c}55, ${c})`,
          boxShadow: `0 0 8px ${c}, inset 0 -2px 4px rgba(0,0,0,0.4)`,
          transition: 'width 0.7s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}/>
        {/* ticks */}
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${(i+1)*20}%`, width: 1, background: 'rgba(0,0,0,0.4)',
          }}/>
        ))}
        {flash > 0 && <div style={{
          position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.6,
          pointerEvents: 'none',
        }}/>}
      </div>
      {label && <div style={{
        fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8',
        letterSpacing: '0.15em', marginTop: 3,
      }}>{label}</div>}
    </div>
  );
}

// ─── GameCard — replica fedele del card layout Satze (porta + stats + abilità + footer armata) ───
function GameCard({ agent, scale = 1, selected, hovered, faceDown, glow, dim, onClick, onMouseEnter, onMouseLeave, hideFooter, layoutRef }) {
  const W = 200 * scale, H = 290 * scale;
  if (faceDown) {
    return (
      <div ref={layoutRef} style={{
        width: W, height: H, position: 'relative',
        background: `linear-gradient(135deg, #1a0a0a, ${agent.army.colorDark || '#3b1d1d'})`,
        border: `1.5px solid ${agent.army.color}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.85), inset 0 0 24px rgba(0,0,0,0.7), 0 0 8px ${agent.army.color}55`,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <img src={agent.army.glyph} alt={agent.army.short}
          style={{
            width: '52%', height: '52%', objectFit: 'contain', opacity: 0.65,
            filter: `drop-shadow(0 0 12px ${agent.army.color})`,
          }}/>
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: 14 * scale,
          color: agent.army.color, letterSpacing: '0.18em', fontWeight: 700,
          textShadow: `0 0 8px ${agent.army.color}`,
        }}>?</div>
      </div>
    );
  }
  const borderC = selected ? '#fbbf24' : (hovered ? '#38bdf8' : '#38bdf8aa');
  const ext = selected
    ? `0 0 18px #fbbf2488, 0 0 36px #fbbf2444`
    : hovered ? `0 0 14px #38bdf877, 0 0 28px #38bdf833`
    : glow ? `0 0 16px ${agent.army.color}99, 0 0 32px ${agent.army.color}55`
    : `0 0 8px #38bdf833`;
  return (
    <div ref={layoutRef}
      onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{
        width: W, height: H, position: 'relative',
        background: '#0a0a0d',
        border: `1.5px solid ${borderC}`,
        boxShadow: `${ext}, 0 4px 16px rgba(0,0,0,0.9)`,
        cursor: onClick ? 'pointer' : 'default',
        opacity: dim ? 0.42 : 1,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Chakra Petch, sans-serif',
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.3s',
        flexShrink: 0,
      }}>
      {/* Header: nome + lega */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${8*scale}px ${10*scale}px`, flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)',
      }}>
        <div style={{
          fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 11 * scale,
          color: '#fff', letterSpacing: '0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: '0 1px 2px #000', flex: 1, paddingRight: 6 * scale,
        }}>{agent.name}</div>
        <div style={{
          fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 10 * scale,
          color: '#cbd5e1', letterSpacing: '0.1em',
          padding: `2px ${8*scale}px`, background: '#1a1a22',
          border: '1px solid #2a2a33', flexShrink: 0,
        }}>L{agent.league}</div>
      </div>
      {/* Portrait */}
      <div style={{
        position: 'relative', marginLeft: 10 * scale, marginRight: 10 * scale,
        height: 120 * scale,
        background: `url('${agent.portrait}') center/cover, ${agent.army.colorDark}`,
        flexShrink: 0,
      }}/>
      {/* Stats */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: `${8*scale}px ${20*scale}px ${4*scale}px`, flexShrink: 0,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Chakra Petch', fontWeight: 800, fontSize: 28 * scale, color: '#fbbf24', lineHeight: 1, textShadow: '0 0 8px #fbbf2466' }}>{agent.pot}</div>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 8 * scale, letterSpacing: '0.18em', color: '#94a3b8', marginTop: 1 }}>↑ POT</div>
        </div>
        <div style={{ width: 1, height: 24 * scale, background: '#1e293b' }}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Chakra Petch', fontWeight: 800, fontSize: 28 * scale, color: '#fbbf24', lineHeight: 1, textShadow: '0 0 8px #fbbf2466' }}>{agent.dan}</div>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 8 * scale, letterSpacing: '0.18em', color: '#94a3b8', marginTop: 1 }}>⇅ DAN</div>
        </div>
      </div>
      {/* Abilità */}
      <div style={{ padding: `${4*scale}px ${10*scale}px`, flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#fbbf24', fontSize: 10 * scale }}>⚡</span>
          <span style={{ fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 9 * scale, color: '#fbbf24', letterSpacing: '0.18em' }}>POTERE</span>
        </div>
        <div style={{ fontFamily: 'Chakra Petch', fontSize: 10 * scale, color: '#e8eaed', marginTop: 1, lineHeight: 1.25 }}>
          {agent.abilityKind ? <span style={{ color: '#fbbf24' }}>{agent.abilityKind}: </span> : null}{agent.abilityText}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <span style={{ color: '#10b981', fontSize: 10 * scale }}>▢</span>
          <span style={{ fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 9 * scale, color: '#10b981', letterSpacing: '0.18em' }}>BONUS</span>
        </div>
        <div style={{ fontFamily: 'Chakra Petch', fontSize: 10 * scale, color: '#cbd5e1', marginTop: 1, lineHeight: 1.25 }}>
          {agent.bonusText}
        </div>
      </div>
      {/* Footer armata */}
      {!hideFooter && (
        <div style={{
          background: agent.army.color, color: '#0a0a0d',
          padding: `${5*scale}px ${8*scale}px`, textAlign: 'center', flexShrink: 0,
          fontFamily: 'Chakra Petch', fontWeight: 800, fontSize: 9 * scale,
          letterSpacing: '0.14em', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <img src={agent.army.glyph} alt="" style={{ width: 12 * scale, height: 12 * scale, objectFit: 'contain', filter: 'brightness(0)' }}/>
          {agent.army.short}
        </div>
      )}
      {agent.used && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'Chakra Petch', fontSize: 13 * scale, letterSpacing: '0.25em',
          color: '#dc2626', textTransform: 'uppercase', fontWeight: 700,
        }}>USATA</div>
      )}
    </div>
  );
}

Object.assign(window, { GameCard, HudPanel, StatOrb, HpBar, ArmySigil, FocusCoin });
