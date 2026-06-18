/* 3 varianti dell'animazione di SCONTRO (fase 4 del duello)
 * Ognuna ha durata ~3s (regolabile via tweaks.clashSpeed), bande cinematografiche,
 * identità d'armata, culmine emotivo dello scontro.
 *
 * Tutte espongono replay tramite la key prop o un button.
 */

// Hook utility: timeline che va da 0 a 1 in `durationMs`, riavviabile via key/seed
function useClashTimeline(durationMs, runId) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf, start;
    setT(0);
    const tick = (ts) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, runId]);
  return t;
}

function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
function easeIn(p) { return p * p; }
function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

// ─── Bande cinematografiche ─────────────────────────────────
function CinemaBars({ t, intensity = 1 }) {
  const reveal = smoothstep(0, 0.12, t) - smoothstep(0.88, 1, t);
  const h = 80 * intensity * reveal;
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 50, pointerEvents: 'none',
        borderBottom: '1px solid rgba(56,189,248,0.15)',
      }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: h,
        background: '#000', zIndex: 50, pointerEvents: 'none',
        borderTop: '1px solid rgba(56,189,248,0.15)',
      }}/>
    </>
  );
}

// ─── Vignetta + flash ─────────────────────────────────
function FlashOverlay({ opacity, color = '#fff' }) {
  return <div style={{
    position: 'absolute', inset: 0, background: color, opacity, zIndex: 48,
    mixBlendMode: 'screen', pointerEvents: 'none',
  }}/>;
}

// ─── Replay button ─────────────────────────────────
function ReplayButton({ onClick, style }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', top: 12, right: 12, zIndex: 100,
      fontFamily: 'Chakra Petch', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
      padding: '6px 12px', color: '#38bdf8', background: 'rgba(5,6,8,0.85)',
      border: '1px solid #38bdf8', cursor: 'pointer',
      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      ...style,
    }}>↻ Replay</button>
  );
}

// ============================================================
// CLASH A — AURORA CHARGE
// Evoluzione fedele dello scontro attuale: bande cinematografiche,
// le carte caricano energia (focus rays), poi cozzano al centro,
// shockwave aurora teal+amber, glifo del vincitore esplode dietro.
// Veloce, leggibile, riconoscibile come "Satze".
// ============================================================
function ClashV1_AuroraCharge({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO, showReadout }) {
  // Se lo scenario ha _dynamic (dalla formula), quei valori vincono su tweaks
  const dyn = scenario._dynamic;
  const effectiveSpeed = dyn ? dyn.clashSpeed : tweaks.clashSpeed;
  const effectiveIntensity = dyn ? dyn.intensity : tweaks.intensity;
  const dur = 3000 / effectiveSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const winCard = winner === 'player' ? player : enemy;
  const loseCard = winner === 'player' ? enemy : player;
  const intensity = effectiveIntensity;

  // Phases: 0-0.15 settle, 0.15-0.45 charge, 0.45-0.55 lunge, 0.55-0.65 impact, 0.65-1 aftermath
  const charge = smoothstep(0.15, 0.45, t);
  const lunge = smoothstep(0.45, 0.55, t);
  const impact = smoothstep(0.55, 0.62, t) * (1 - smoothstep(0.7, 0.9, t));
  const aftermath = smoothstep(0.65, 1, t);
  const flash = smoothstep(0.53, 0.58, t) * (1 - smoothstep(0.6, 0.72, t)) * intensity;

  // Player card transforms
  const pX = lunge * 90 - aftermath * (winner === 'player' ? -40 : 120);
  const pScale = 1 + charge * 0.08 + lunge * 0.15 - aftermath * (winner === 'player' ? -0.06 : 0.2);
  const pRot = aftermath * (winner === 'player' ? 0 : 18);
  const pOpacity = winner === 'player' ? 1 : 1 - aftermath * 0.55;

  const eX = -lunge * 90 - aftermath * (winner === 'enemy' ? -40 : -120);
  const eScale = 1 + charge * 0.08 + lunge * 0.15 - aftermath * (winner === 'enemy' ? -0.06 : 0.2);
  const eRot = aftermath * (winner === 'enemy' ? 0 : -18);
  const eOpacity = winner === 'enemy' ? 1 : 1 - aftermath * 0.55;

  // shake
  const shake = impact * 8 * intensity;
  const sx = (Math.sin(t * 220) * shake);
  const sy = (Math.cos(t * 180) * shake);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      {/* BG con saturation */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `saturate(${0.7 + charge*0.5}) brightness(${0.65 - charge*0.25 + impact*0.4})`,
        transform: `translate(${sx}px, ${sy}px) scale(${1 + impact*0.04})`,
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}/>

      <CinemaBars t={t} intensity={intensity}/>

      {/* Aurora shockwave radiale dal centro */}
      {impact > 0 && (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 100 + impact * 1600, height: 100 + impact * 1600,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%', pointerEvents: 'none',
            border: `${4 - impact*3}px solid rgba(79,209,197,${0.9 - impact*0.8})`,
            boxShadow: `0 0 ${80*impact}px rgba(79,209,197,0.8), inset 0 0 ${60*impact}px rgba(251,191,36,0.6)`,
            zIndex: 30, opacity: 1 - aftermath,
          }}/>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 60 + impact * 1100, height: 60 + impact * 1100,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%', pointerEvents: 'none',
            border: `${3 - impact*2.5}px solid rgba(251,179,71,${0.8 - impact*0.7})`,
            zIndex: 30, opacity: 1 - aftermath,
          }}/>
        </>
      )}

      {/* Glifo armata vincitore — esplode dietro durante impact */}
      {(impact > 0 || aftermath > 0) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.4 + (impact + aftermath*0.5) * 1.4}) rotate(${(impact + aftermath*0.3) * 25}deg)`,
          opacity: (impact * 0.95 + aftermath * 0.35) * intensity,
          zIndex: 6, pointerEvents: 'none',
        }}>
          <ArmySigil army={winArmy} size={520}/>
        </div>
      )}

      {/* Focus rays sulle carte durante charge */}
      {charge > 0 && (
        <>
          <ChargeRays x="30%" color={ARMIES.orizzonte.color} strength={charge * (1 - lunge)} count={8}/>
          <ChargeRays x="70%" color={ARMIES.kethran.color} strength={charge * (1 - lunge)} count={8}/>
        </>
      )}

      {/* Carta giocatore (sx) */}
      <div style={{
        position: 'absolute', top: '50%', left: '30%',
        transform: `translate(calc(-50% + ${pX + sx}px), calc(-50% + ${sy}px)) scale(${pScale}) rotate(${pRot}deg)`,
        zIndex: winner === 'player' ? 20 : 10, opacity: pOpacity,
        filter: winner === 'player'
          ? `drop-shadow(0 0 ${20 + impact*40}px ${player.army.color}) drop-shadow(0 0 ${10 + aftermath*30}px ${player.army.glow})`
          : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6})`,
      }}>
        <GameCard agent={player} scale={1.1}/>
      </div>
      {/* Carta nemico (dx) */}
      <div style={{
        position: 'absolute', top: '50%', left: '70%',
        transform: `translate(calc(-50% + ${eX + sx}px), calc(-50% + ${sy}px)) scale(${eScale}) rotate(${eRot}deg)`,
        zIndex: winner === 'enemy' ? 20 : 10, opacity: eOpacity,
        filter: winner === 'enemy'
          ? `drop-shadow(0 0 ${20 + impact*40}px ${enemy.army.color}) drop-shadow(0 0 ${10 + aftermath*30}px ${enemy.army.glow})`
          : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6})`,
      }}>
        <GameCard agent={enemy} scale={1.1}/>
      </div>

      {/* Numeri VA sotto ogni carta */}
      <VaTag x="30%" value={player.va} winner={winner === 'player'} t={t}/>
      <VaTag x="70%" value={enemy.va} winner={winner === 'enemy'} t={t}/>

      {/* Lampo bianco al momento dell'impatto */}
      <FlashOverlay opacity={flash * 0.7}/>

      {/* Title cinematografico al culmine */}
      {aftermath > 0.1 && (
        <div style={{
          position: 'absolute', top: 110, left: '50%',
          transform: `translateX(-50%) scale(${smoothstep(0.65, 0.85, t)})`,
          opacity: smoothstep(0.65, 0.78, t) * (1 - smoothstep(0.95, 1, t)),
          zIndex: 60, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 46, fontWeight: 800,
            color: winner === 'player' ? '#fbbf24' : '#dc2626',
            letterSpacing: '0.3em', textTransform: 'uppercase',
            textShadow: `0 0 24px ${winner === 'player' ? '#fbbf24' : '#dc2626'}, 0 0 48px ${winArmy.color}, 0 4px 12px #000`,
            WebkitTextStroke: '1.5px rgba(0,0,0,0.8)',
          }}>{winner === 'player' ? 'Trionfo' : 'Sconfitta'}</div>
          <div style={{
            marginTop: 10, fontFamily: 'Share Tech Mono', fontSize: 14,
            color: '#fff', letterSpacing: '0.24em',
            textShadow: '0 0 8px #000',
          }}>{winCard.name.toUpperCase()} · VA {winCard.va} → -{damage} PV</div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
      {showReadout && dyn && <DynamicReadout dyn={dyn} effectiveSpeed={effectiveSpeed} effectiveIntensity={effectiveIntensity}/>}
    </div>
  );
}

function DynamicReadout({ dyn, effectiveSpeed, effectiveIntensity }) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 100,
      fontFamily: 'Share Tech Mono', fontSize: 10,
      padding: '8px 12px', background: 'rgba(5,6,8,0.88)',
      border: '1px solid #38bdf8', color: '#cbd5e1', letterSpacing: '0.05em',
      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      lineHeight: 1.55, pointerEvents: 'none',
    }}>
      <div style={{ color: '#38bdf8', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 9, marginBottom: 4 }}>VFX dinamici</div>
      <div>gap VA <span style={{color:'#fff'}}>{dyn.gap}</span> → speed <span style={{color:'#fbbf24'}}>{effectiveSpeed.toFixed(2)}×</span></div>
      <div>FC tot <span style={{color:'#fff'}}>{dyn.totalFc}</span> → int. <span style={{color:'#fbbf24'}}>{effectiveIntensity.toFixed(2)}×</span></div>
    </div>
  );
}

// ─── Focus rays per la fase di carica ─────────────────────────────────
function ChargeRays({ x, color, strength, count = 6 }) {
  return (
    <div style={{ position: 'absolute', top: '50%', left: x, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 5 }}>
      {Array.from({length: count}).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + strength * 0.5;
        const len = 100 + strength * 200;
        const dist = 80 + (1-strength) * 200;
        const x1 = Math.cos(a) * dist, y1 = Math.sin(a) * dist;
        const x2 = Math.cos(a) * (dist - len), y2 = Math.sin(a) * (dist - len);
        return (
          <div key={i} style={{
            position: 'absolute', left: x1, top: y1,
            width: 0, height: 0,
            borderLeft: '0 solid transparent',
          }}>
            <svg width={len} height={4} style={{
              position: 'absolute', transformOrigin: '0 50%',
              transform: `rotate(${Math.atan2(y2-y1, x2-x1)*180/Math.PI}deg)`,
            }}>
              <defs>
                <linearGradient id={`ray-${i}-${color}`} x1="0" x2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={strength * 0.9}/>
                  <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width={len} height="3" fill={`url(#ray-${i}-${color})`}/>
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function VaTag({ x, value, winner, t }) {
  const reveal = smoothstep(0.3, 0.55, t);
  const winPulse = winner ? 1 + Math.sin(t * 24) * 0.06 * smoothstep(0.6, 0.9, t) : 1;
  if (reveal < 0.02) return null;
  return (
    <div style={{
      position: 'absolute', top: 'calc(50% + 200px)', left: x,
      transform: `translateX(-50%) scale(${0.6 + reveal * 0.4 * winPulse})`,
      opacity: reveal, zIndex: 25, pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Chakra Petch', fontSize: 10, color: winner ? '#fbbf24' : '#94a3b8',
          letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 4,
        }}>Valore Assalto</div>
        <div style={{
          fontFamily: 'Share Tech Mono', fontSize: winner ? 64 : 52, fontWeight: 700,
          color: winner ? '#4FD1C5' : '#475569',
          textShadow: winner ? '0 0 24px #4FD1C5, 0 0 48px #fbbf2466, 0 2px 4px #000' : '0 2px 4px #000',
          WebkitTextStroke: '1.5px rgba(0,0,0,0.8)', lineHeight: 1,
        }}>{value}</div>
      </div>
    </div>
  );
}

// ============================================================
// CLASH B — SIGIL STRIKE
// Le due carte si caricano frontalmente con l'icona dell'armata
// che si materializa enorme dietro ciascuna. Sul colpo, il sigillo del
// PERDENTE va in frammenti, quello del VINCITORE si sigilla a fuoco
// sopra lo schermo. Più audace, identitario, "fumetto epico".
// ============================================================
function ClashV2_SigilStrike({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO }) {
  const dur = 3000 / tweaks.clashSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const intensity = tweaks.intensity;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const loseArmy = winner === 'player' ? enemy.army : player.army;
  const winCard = winner === 'player' ? player : enemy;

  // Phases: 0-0.2 reveal cards + sigils, 0.2-0.5 charge, 0.5-0.6 strike, 0.6-0.85 sigil seal, 0.85-1 outcome
  const reveal = smoothstep(0, 0.2, t);
  const charge = smoothstep(0.2, 0.5, t);
  const strike = smoothstep(0.5, 0.6, t) * (1 - smoothstep(0.66, 0.78, t));
  const seal = smoothstep(0.6, 0.85, t);
  const outcome = smoothstep(0.7, 1, t);

  const flash = smoothstep(0.52, 0.58, t) * (1 - smoothstep(0.6, 0.72, t));
  const shake = strike * 12 * intensity;
  const sx = Math.sin(t * 250) * shake, sy = Math.cos(t * 210) * shake;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      {/* BG */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `saturate(${0.6 + charge*0.6}) brightness(${0.55 - charge*0.25 + strike*0.5}) contrast(1.1)`,
        transform: `translate(${sx*0.5}px, ${sy*0.5}px)`,
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 30% 50%, ${player.army.color}25 0%, transparent 35%),
                     radial-gradient(ellipse at 70% 50%, ${enemy.army.color}25 0%, transparent 35%),
                     linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8))`,
      }}/>

      <CinemaBars t={t} intensity={intensity}/>

      {/* SIGILLI giganti dietro le carte (charge phase) */}
      <div style={{
        position: 'absolute', top: '50%', left: '30%',
        transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${reveal * (1 + charge*0.4 + strike*0.3) * (1 - outcome*(winner==='player'?0:1))}) rotate(${charge*6}deg)`,
        opacity: reveal * (winner === 'player' ? 1 : 1 - outcome*0.8),
        zIndex: 5, pointerEvents: 'none',
      }}>
        <ArmySigil army={player.army} size={520} opacity={0.85}/>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '70%',
        transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${reveal * (1 + charge*0.4 + strike*0.3) * (1 - outcome*(winner==='enemy'?0:1))}) rotate(${-charge*6}deg)`,
        opacity: reveal * (winner === 'enemy' ? 1 : 1 - outcome*0.8),
        zIndex: 5, pointerEvents: 'none',
      }}>
        <ArmySigil army={enemy.army} size={520} opacity={0.85}/>
      </div>

      {/* Frammenti del sigillo perdente — shatter */}
      {outcome > 0.05 && (
        <SigilShatter army={loseArmy} x={winner === 'player' ? '70%' : '30%'} t={outcome} intensity={intensity}/>
      )}

      {/* Carte */}
      {(() => {
        const pX = charge * 60 + strike * 30 - outcome * (winner === 'player' ? -20 : 120);
        const pScale = reveal * (1 + charge*0.05 + strike*0.12);
        const pTilt = charge * -2 + strike * -4 + outcome * (winner === 'player' ? 0 : 14);
        return (
          <div style={{
            position: 'absolute', top: '50%', left: '30%',
            transform: `translate(calc(-50% + ${pX + sx}px), calc(-50% + ${sy}px)) scale(${pScale}) rotate(${pTilt}deg)`,
            opacity: reveal * (winner === 'player' ? 1 : 1 - outcome*0.6),
            zIndex: 12, filter: winner === 'player'
              ? `drop-shadow(0 0 ${15 + strike*30}px ${player.army.color}cc)`
              : `brightness(${1 - outcome*0.5}) grayscale(${outcome*0.5})`,
          }}>
            <GameCard agent={player} scale={1.1}/>
          </div>
        );
      })()}
      {(() => {
        const eX = -charge * 60 - strike * 30 - outcome * (winner === 'enemy' ? -20 : -120);
        const eScale = reveal * (1 + charge*0.05 + strike*0.12);
        const eTilt = charge * 2 + strike * 4 + outcome * (winner === 'enemy' ? 0 : -14);
        return (
          <div style={{
            position: 'absolute', top: '50%', left: '70%',
            transform: `translate(calc(-50% + ${eX + sx}px), calc(-50% + ${sy}px)) scale(${eScale}) rotate(${eTilt}deg)`,
            opacity: reveal * (winner === 'enemy' ? 1 : 1 - outcome*0.6),
            zIndex: 12, filter: winner === 'enemy'
              ? `drop-shadow(0 0 ${15 + strike*30}px ${enemy.army.color}cc)`
              : `brightness(${1 - outcome*0.5}) grayscale(${outcome*0.5})`,
          }}>
            <GameCard agent={enemy} scale={1.1}/>
          </div>
        );
      })()}

      {/* Lightning bolt verticale al momento del colpo (charging energy) */}
      {strike > 0 && (
        <svg style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={`M 30 30 L 70 50 L 30 50 L 70 70`} stroke={winArmy.color} strokeWidth={1 - strike*0.5}
            fill="none" opacity={strike * 0.7}
            style={{ filter: `drop-shadow(0 0 10px ${winArmy.color})` }}/>
        </svg>
      )}

      <FlashOverlay opacity={flash * 0.8}/>

      {/* Sigillo del vincitore che si imprime sopra al culmine */}
      {seal > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.4 + seal * 0.9}) rotate(${(1-seal) * 60}deg)`,
          opacity: seal * (1 - smoothstep(0.95, 1, t) * 0.4),
          zIndex: 35, pointerEvents: 'none',
          filter: `drop-shadow(0 0 ${30*seal}px ${winArmy.color})`,
        }}>
          <ArmySigil army={winArmy} size={420} opacity={Math.min(1, seal * 1.4)}/>
        </div>
      )}

      {/* Banner outcome */}
      {outcome > 0.2 && (
        <div style={{
          position: 'absolute', bottom: 120, left: '50%',
          transform: `translateX(-50%) translateY(${(1-smoothstep(0.7, 0.85, t))*40}px)`,
          opacity: smoothstep(0.7, 0.85, t),
          zIndex: 60, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            display: 'inline-block', padding: '8px 36px',
            background: `linear-gradient(90deg, transparent, ${winArmy.color}33, transparent)`,
            borderTop: `1px solid ${winArmy.color}`, borderBottom: `1px solid ${winArmy.color}`,
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 32, fontWeight: 800,
              color: '#fff', letterSpacing: '0.32em', textTransform: 'uppercase',
              textShadow: `0 0 18px ${winArmy.color}, 0 0 36px ${winArmy.color}88, 0 4px 8px #000`,
              WebkitTextStroke: '1px rgba(0,0,0,0.7)',
            }}>{winner === 'player' ? 'Trionfo' : 'Sconfitta'}</div>
            <div style={{
              fontFamily: 'Share Tech Mono', fontSize: 11, color: winArmy.color,
              letterSpacing: '0.4em', marginTop: 4,
            }}>{winArmy.name.toUpperCase()}</div>
          </div>
          <div style={{
            marginTop: 14, fontFamily: 'Share Tech Mono', fontSize: 13,
            color: '#cbd5e1', letterSpacing: '0.18em',
          }}>VA {winCard.va} VS {(winner === 'player' ? enemy : player).va} · −{damage} PV</div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
    </div>
  );
}

function SigilShatter({ army, x, t, intensity }) {
  const shards = 14;
  return (
    <div style={{ position: 'absolute', top: '50%', left: x, transform: 'translate(-50%, -50%)', zIndex: 14, pointerEvents: 'none' }}>
      {Array.from({length: shards}).map((_, i) => {
        const seed = (i * 137 + 41) % 360;
        const a = (i / shards) * Math.PI * 2 + seed * 0.01;
        const dist = 80 + t * 380 * intensity + (seed % 60);
        const x1 = Math.cos(a) * dist, y1 = Math.sin(a) * dist + t * 100;
        const rot = (seed % 360) + t * 720;
        return (
          <div key={i} style={{
            position: 'absolute', left: x1, top: y1,
            width: 22, height: 4 + (seed % 18),
            background: army.color,
            opacity: 1 - t * 0.85,
            transform: `rotate(${rot}deg)`,
            boxShadow: `0 0 6px ${army.color}`,
            clipPath: 'polygon(0 50%, 30% 0, 100% 50%, 30% 100%)',
          }}/>
        );
      })}
    </div>
  );
}

// ============================================================
// CLASH C — TACTICAL STRIKE
// Più TCG/tattico: niente bande, schermo intero, focus sui NUMERI VA che
// si scontrano in mezzo allo schermo come "13 vs 11", il vincitore "spinge"
// il numero del perdente che si rompe in frantumi. Particelle armata-color.
// Veloce, secco, leggibile, ottimo per partite "speedrun".
// ============================================================
function ClashV3_TacticalStrike({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO }) {
  const dur = 3000 / tweaks.clashSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const intensity = tweaks.intensity;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const loseArmy = winner === 'player' ? enemy.army : player.army;
  const winCard = winner === 'player' ? player : enemy;

  // Phases:
  // 0-0.15 cards slide into corners, big VA numbers rise from each card
  // 0.15-0.4 numbers slide toward center, sigils flash behind
  // 0.4-0.55 numbers collide; loser shatters
  // 0.55-1 winner pulses, outcome banner
  const settle = smoothstep(0, 0.15, t);
  const approach = smoothstep(0.15, 0.4, t);
  const collide = smoothstep(0.4, 0.5, t);
  const after = smoothstep(0.5, 1, t);
  const winnerPulse = 1 + Math.sin(t * 20) * 0.04 * smoothstep(0.55, 0.85, t);
  const flash = smoothstep(0.4, 0.47, t) * (1 - smoothstep(0.5, 0.6, t));
  const shake = collide * 6 * intensity * (1 - after*0.7);
  const sx = Math.sin(t * 240) * shake, sy = Math.cos(t * 200) * shake;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0e1a', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      {/* BG with tactical grid */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `brightness(0.35) saturate(0.85)`,
      }}/>
      {/* tactical grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
        backgroundImage: `linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06), rgba(0,0,0,0.7) 70%)' }}/>

      {/* Carte miniature negli angoli */}
      <div style={{
        position: 'absolute', top: 40, left: 40,
        transform: `translate(${sx*0.3}px, ${sy*0.3}px) scale(${0.7 + settle*0.3})`,
        opacity: settle * (winner === 'player' ? 1 : 1 - after*0.4),
        zIndex: 10, filter: winner === 'player' ? `drop-shadow(0 0 18px ${player.army.color}aa)` : 'none',
      }}>
        <GameCard agent={player} scale={0.78}/>
      </div>
      <div style={{
        position: 'absolute', top: 40, right: 40,
        transform: `translate(${sx*0.3}px, ${sy*0.3}px) scale(${0.7 + settle*0.3})`,
        opacity: settle * (winner === 'enemy' ? 1 : 1 - after*0.4),
        zIndex: 10, filter: winner === 'enemy' ? `drop-shadow(0 0 18px ${enemy.army.color}aa)` : 'none',
      }}>
        <GameCard agent={enemy} scale={0.78}/>
      </div>

      {/* Frecce di forza (player → center, enemy → center) */}
      {(approach > 0 && collide < 1) && (
        <>
          <ForceArrow x="30%" dir="right" army={player.army} strength={approach * (1 - after)} winning={winner === 'player'}/>
          <ForceArrow x="70%" dir="left" army={enemy.army} strength={approach * (1 - after)} winning={winner === 'enemy'}/>
        </>
      )}

      {/* Sigilli grandi BLUR sullo sfondo */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) scale(${0.8 + approach*0.5}) rotate(${approach*15}deg)`,
        opacity: approach * 0.35 * (winner === 'player' ? 1 : 1-after*0.7),
        zIndex: 4, filter: 'blur(6px)',
      }}><ArmySigil army={player.army} size={640}/></div>

      {/* Numeri VA giganti che si scontrano */}
      {(() => {
        // Position: starts at card position, slides to center
        const pStartX = '15%', pEndX = winner === 'player' ? '46%' : '38%';
        const eStartX = '85%', eEndX = winner === 'enemy' ? '54%' : '62%';
        const pX = `calc(${pStartX} + (${pEndX} - ${pStartX}) * ${easeInOut(approach + collide*0.3)})`;
        const eX = `calc(${eStartX} + (${eEndX} - ${eStartX}) * ${easeInOut(approach + collide*0.3)})`;
        const pPulse = winner === 'player' ? winnerPulse : 1 - after*0.5;
        const ePulse = winner === 'enemy' ? winnerPulse : 1 - after*0.5;
        return (
          <>
            {/* Player VA */}
            <div style={{
              position: 'absolute', top: '50%', left: pX,
              transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${(0.4 + settle*0.6) * pPulse})`,
              opacity: settle * (winner === 'player' ? 1 : 1 - after*0.85),
              zIndex: 20, pointerEvents: 'none',
            }}>
              <BigVa value={player.va} color={player.army.color} winner={winner === 'player'} broken={winner !== 'player' && after > 0.3} t={t} side="L"/>
            </div>
            {/* Enemy VA */}
            <div style={{
              position: 'absolute', top: '50%', left: eX,
              transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${(0.4 + settle*0.6) * ePulse})`,
              opacity: settle * (winner === 'enemy' ? 1 : 1 - after*0.85),
              zIndex: 20, pointerEvents: 'none',
            }}>
              <BigVa value={enemy.va} color={enemy.army.color} winner={winner === 'enemy'} broken={winner !== 'enemy' && after > 0.3} t={t} side="R"/>
            </div>
            {/* VS in mezzo */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: `translate(-50%, -50%) scale(${1 + collide * 0.8 - after*0.7})`,
              opacity: smoothstep(0.1, 0.3, t) * (1 - smoothstep(0.45, 0.55, t)),
              zIndex: 19, pointerEvents: 'none',
              fontFamily: 'Cinzel, serif', fontSize: 64, fontWeight: 800,
              color: '#fff', letterSpacing: '0.1em',
              textShadow: '0 0 24px rgba(56,189,248,0.7), 0 0 48px rgba(251,191,36,0.5)',
              WebkitTextStroke: '2px rgba(0,0,0,0.8)',
            }}>VS</div>
          </>
        );
      })()}

      {/* Particelle dell'armata vincente che esplodono dal centro */}
      {collide > 0 && (
        <VictoryParticles army={winArmy} t={collide + after*0.3} intensity={intensity}/>
      )}

      <FlashOverlay opacity={flash * 0.5}/>

      {/* Outcome banner — tactical readout */}
      {after > 0.3 && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%',
          transform: 'translateX(-50%)',
          opacity: smoothstep(0.55, 0.75, t),
          zIndex: 60, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <img src={winArmy.glyph} style={{ width: 44, height: 44, filter: `drop-shadow(0 0 12px ${winArmy.color})` }}/>
          <div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 24, fontWeight: 700, color: '#fff',
              letterSpacing: '0.26em', textTransform: 'uppercase',
              textShadow: `0 0 12px ${winArmy.color}, 0 2px 4px #000`,
            }}>{winner === 'player' ? 'Trionfo' : 'Sconfitta'}</div>
            <div style={{
              fontFamily: 'Share Tech Mono', fontSize: 12,
              color: winArmy.color, letterSpacing: '0.18em', marginTop: 2,
            }}>{winCard.name.toUpperCase()} · VA {winCard.va} → −{damage} PV</div>
          </div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
    </div>
  );
}

function BigVa({ value, color, winner, broken, t, side }) {
  const shards = 8;
  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      {!broken && (
        <>
          <div style={{
            fontFamily: 'Share Tech Mono', fontSize: 12, color, letterSpacing: '0.3em',
            textTransform: 'uppercase', marginBottom: 4, opacity: 0.85,
          }}>Valore Assalto</div>
          <div style={{
            fontFamily: 'Share Tech Mono', fontSize: 180, fontWeight: 700, lineHeight: 1,
            color: winner ? '#fbbf24' : '#cbd5e1',
            textShadow: winner
              ? `0 0 30px ${color}, 0 0 60px ${color}88, 0 0 90px ${color}44, 0 6px 12px #000`
              : `0 0 20px ${color}66, 0 4px 8px #000`,
            WebkitTextStroke: '2px rgba(0,0,0,0.85)',
          }}>{value}</div>
        </>
      )}
      {broken && (
        <div style={{ position: 'relative', height: 220 }}>
          {Array.from({length: shards}).map((_, i) => {
            const a = ((i / shards) - 0.5) * Math.PI;
            const fall = (t - 0.5) * 2;
            const dist = fall * 300;
            const x1 = Math.cos(a) * dist * (side === 'L' ? -1 : 1) - 60;
            const y1 = Math.sin(a) * dist + fall * 80;
            return (
              <div key={i} style={{
                position: 'absolute', left: x1, top: y1,
                fontFamily: 'Share Tech Mono', fontSize: 60 + (i*7 % 40), fontWeight: 700,
                color: '#475569', opacity: 1 - fall * 0.8,
                transform: `rotate(${i * 47 + fall * 360}deg)`,
                textShadow: `0 0 8px ${color}55`,
                WebkitTextStroke: '1px rgba(0,0,0,0.7)',
              }}>{value.toString()[i % value.toString().length] || value.toString()[0]}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ForceArrow({ x, dir, army, strength, winning }) {
  // a sequence of chevrons pointing toward center
  const chevrons = 5;
  return (
    <div style={{ position: 'absolute', top: '50%', left: x, transform: 'translate(-50%, -50%)', display: 'flex', gap: 6, flexDirection: dir === 'right' ? 'row' : 'row-reverse', zIndex: 8, pointerEvents: 'none' }}>
      {Array.from({length: chevrons}).map((_, i) => {
        const phase = (strength * 4 - i * 0.3) % 1;
        const visible = Math.max(0, Math.min(1, phase));
        return (
          <div key={i} style={{
            width: 26, height: 26,
            opacity: visible * (winning ? 1 : 0.5),
            transform: `scale(${0.6 + visible * 0.6}) rotate(${dir === 'right' ? 0 : 180}deg)`,
            transition: 'opacity 0.1s',
          }}>
            <svg viewBox="0 0 30 30" width="100%" height="100%">
              <path d="M 6 6 L 22 15 L 6 24 Z" fill={army.color} opacity="0.8"
                style={{ filter: `drop-shadow(0 0 8px ${army.color})` }}/>
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function VictoryParticles({ army, t, intensity }) {
  const count = 24;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 22 }}>
      {Array.from({length: count}).map((_, i) => {
        const seed = (i * 311 + 71) % 360;
        const a = (i / count) * Math.PI * 2 + (seed % 18) * 0.01;
        const dist = (t * 380 + seed % 60) * intensity;
        const x = Math.cos(a) * dist, y = Math.sin(a) * dist;
        const sz = 5 + (seed % 7);
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: sz, height: sz, borderRadius: '50%',
            background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? army.color : '#4FD1C5',
            opacity: Math.max(0, 1 - t * 1.2),
            boxShadow: `0 0 ${sz*2}px currentColor`,
            color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? army.color : '#4FD1C5',
          }}/>
        );
      })}
    </div>
  );
}

Object.assign(window, { ClashV1_AuroraCharge, ClashV2_SigilStrike, ClashV3_TacticalStrike });
