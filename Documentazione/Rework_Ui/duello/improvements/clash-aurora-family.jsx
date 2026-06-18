/* Famiglia Aurora Charge — sotto-varianti
 * Tutte condividono: bande cinematografiche, charge rays sulle carte,
 * shockwave aurora teal+amber, sigillo armata vincitore, titolo "Trionfo/Sconfitta".
 * Variano nel "momento culminante" (slow-mo, cometa, frattura schermo).
 */

// ───────── helpers riusati ─────────
function smoothstep2(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

// Auto-loop wrapper (replay button incluso)
function ClashLoop({ render, durationMs, runId, onReplay }) {
  return null; // helper not used externally
}

// ============================================================
// A1 — SLOW-MO PINNACLE
// Variazione: al momento dell'impatto il tempo si ferma per ~350ms.
// Particelle congelate in aria, leggero chromatic aberration, zoom-in soft.
// Poi SNAP back con esplosione amplificata. Effetto: pesa il culmine.
// ============================================================
function ClashA1_SlowMo({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO }) {
  const dur = 3000 / tweaks.clashSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const winCard = winner === 'player' ? player : enemy;
  const intensity = tweaks.intensity;

  // Phases:
  // 0-0.12 settle, 0.12-0.40 charge, 0.40-0.50 lunge,
  // 0.50-0.65 FREEZE FRAME (slow-mo hold), 0.65-0.74 snap-resume impact,
  // 0.74-1 aftermath
  const charge = smoothstep2(0.12, 0.40, t);
  const lunge = smoothstep2(0.40, 0.50, t);
  const freezeStart = 0.50, freezeEnd = 0.65;
  const inFreeze = t >= freezeStart && t < freezeEnd;
  const freezeProgress = smoothstep2(freezeStart, freezeEnd, t);
  const snap = smoothstep2(0.65, 0.74, t);
  const aftermath = smoothstep2(0.74, 1, t);
  // visuals durante freeze
  const chroma = inFreeze ? (1 - Math.abs(freezeProgress - 0.5) * 2) * 6 * intensity : 0;
  const freezeZoom = inFreeze ? 1 + 0.08 * smoothstep2(0, 0.4, freezeProgress) : 1;
  const flash = smoothstep2(0.66, 0.71, t) * (1 - smoothstep2(0.74, 0.86, t)) * intensity;

  // Card transforms (frozen during 0.50-0.65)
  const pBaseX = lunge * 110;
  const eBaseX = -lunge * 110;
  const pX = inFreeze ? pBaseX : pBaseX + (snap > 0 ? snap * 20 : 0) - (aftermath * (winner === 'player' ? -40 : 140));
  const eX = inFreeze ? eBaseX : eBaseX - (snap > 0 ? snap * 20 : 0) - (aftermath * (winner === 'enemy' ? -40 : -140));
  const pScale = 1 + charge*0.08 + lunge*0.16 + (inFreeze ? 0.05 : 0) + snap*0.08 - aftermath*(winner==='player' ? -0.04 : 0.22);
  const eScale = 1 + charge*0.08 + lunge*0.16 + (inFreeze ? 0.05 : 0) + snap*0.08 - aftermath*(winner==='enemy' ? -0.04 : 0.22);
  const pOpacity = winner === 'player' ? 1 : 1 - aftermath * 0.55;
  const eOpacity = winner === 'enemy' ? 1 : 1 - aftermath * 0.55;

  // shake — solo durante snap, non durante freeze
  const shake = snap * 16 * intensity * (1 - aftermath*0.7);
  const sx = Math.sin(t * 280) * shake, sy = Math.cos(t * 240) * shake;

  // Freeze particles (frozen mid-air)
  const freezeParticles = React.useMemo(() => Array.from({length: 18}).map((_, i) => {
    const seed = (i * 173 + 41) % 360;
    const a = (i / 18) * Math.PI * 2 + (seed % 12) * 0.05;
    const r = 60 + (seed % 80);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, sz: 3 + (seed % 6), seed };
  }), [runId]);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden',
      fontFamily: 'Chakra Petch, sans-serif',
    }}>
      {/* BG */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `saturate(${0.7 + charge*0.5}) brightness(${0.65 - charge*0.25 + snap*0.5}) ${inFreeze ? 'saturate(0.35) brightness(0.5) blur(1px)' : ''}`,
        transform: `translate(${sx}px, ${sy}px) scale(${freezeZoom * (1 + snap*0.04)})`,
        transition: inFreeze ? 'filter 0.18s ease-out' : 'none',
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.85) 100%)' }}/>

      {/* Vignetta extra durante freeze (cinematic mood) */}
      {inFreeze && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 75%)',
          mixBlendMode: 'multiply',
        }}/>
      )}

      <CinemaBars t={t} intensity={intensity}/>

      {/* Aurora shockwave durante snap (più potente per la sospensione precedente) */}
      {snap > 0 && (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 100 + snap * 2200, height: 100 + snap * 2200,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%', pointerEvents: 'none',
            border: `${5 - snap*4}px solid rgba(79,209,197,${0.95 - snap*0.85})`,
            boxShadow: `0 0 ${120*snap}px rgba(79,209,197,0.9), inset 0 0 ${80*snap}px rgba(251,191,36,0.7)`,
            zIndex: 30, opacity: 1 - aftermath,
          }}/>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 60 + snap * 1500, height: 60 + snap * 1500,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%', pointerEvents: 'none',
            border: `${4 - snap*3}px solid rgba(251,179,71,${0.85 - snap*0.75})`,
            zIndex: 30, opacity: 1 - aftermath,
          }}/>
        </>
      )}

      {/* Glifo vincitore */}
      {(snap > 0 || aftermath > 0) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.4 + (snap + aftermath*0.5) * 1.5}) rotate(${(snap + aftermath*0.3) * 25}deg)`,
          opacity: (snap * 0.95 + aftermath * 0.4) * intensity,
          zIndex: 6, pointerEvents: 'none',
        }}>
          <ArmySigil army={winArmy} size={540}/>
        </div>
      )}

      {/* Charge rays */}
      {charge > 0 && !inFreeze && (
        <>
          <ChargeRays x="30%" color={player.army.color} strength={charge * (1 - lunge)} count={9}/>
          <ChargeRays x="70%" color={enemy.army.color} strength={charge * (1 - lunge)} count={9}/>
        </>
      )}

      {/* Freeze: particelle congelate sospese tra le due carte */}
      {inFreeze && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 22 }}>
          {freezeParticles.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: p.sz, height: p.sz, borderRadius: '50%',
              background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#4FD1C5' : winArmy.color,
              boxShadow: `0 0 ${p.sz*3}px currentColor`,
              color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#4FD1C5' : winArmy.color,
              opacity: 0.8 + Math.sin(freezeProgress * Math.PI) * 0.2,
            }}/>
          ))}
          {/* Energia mid-air tra le due carte */}
          <svg width="240" height="120" style={{ position: 'absolute', left: -120, top: -60 }}>
            <defs>
              <linearGradient id="midEnergy" x1="0" x2="1">
                <stop offset="0%" stopColor={player.army.color}/>
                <stop offset="50%" stopColor="#fbbf24"/>
                <stop offset="100%" stopColor={enemy.army.color}/>
              </linearGradient>
            </defs>
            <path d="M 20 60 Q 60 30 120 60 T 220 60" fill="none" stroke="url(#midEnergy)" strokeWidth="2.5" opacity={0.85} style={{ filter: 'drop-shadow(0 0 10px rgba(79,209,197,0.7))' }}/>
            <path d="M 20 60 Q 80 90 120 60 T 220 60" fill="none" stroke="url(#midEnergy)" strokeWidth="1.5" opacity={0.5}/>
          </svg>
        </div>
      )}

      {/* Chromatic aberration overlay durante freeze (offset red/cyan dello stage) */}
      {inFreeze && (
        <>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25,
            background: `url('${field.bg}') center/cover`,
            transform: `translateX(${chroma}px)`,
            mixBlendMode: 'screen', opacity: 0.15,
            filter: 'hue-rotate(-30deg)',
          }}/>
        </>
      )}

      {/* Carte */}
      <div style={{
        position: 'absolute', top: '50%', left: '30%',
        transform: `translate(calc(-50% + ${pX + sx}px), calc(-50% + ${sy}px)) scale(${pScale}) rotate(${aftermath*(winner==='player'?0:18)}deg)`,
        zIndex: winner === 'player' ? 20 : 10, opacity: pOpacity,
        filter: winner === 'player'
          ? `drop-shadow(0 0 ${20 + (snap+aftermath)*50}px ${player.army.color}) ${inFreeze ? `drop-shadow(0 0 ${30 + freezeProgress*40}px ${player.army.glow})` : ''}`
          : inFreeze ? `brightness(0.85) saturate(0.6)` : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6})`,
        transition: inFreeze ? 'filter 0.1s ease-out' : 'none',
      }}>
        <GameCard agent={player} scale={1.1}/>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '70%',
        transform: `translate(calc(-50% + ${eX + sx}px), calc(-50% + ${sy}px)) scale(${eScale}) rotate(${aftermath*(winner==='enemy'?0:-18)}deg)`,
        zIndex: winner === 'enemy' ? 20 : 10, opacity: eOpacity,
        filter: winner === 'enemy'
          ? `drop-shadow(0 0 ${20 + (snap+aftermath)*50}px ${enemy.army.color}) ${inFreeze ? `drop-shadow(0 0 ${30 + freezeProgress*40}px ${enemy.army.glow})` : ''}`
          : inFreeze ? `brightness(0.85) saturate(0.6)` : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6})`,
        transition: inFreeze ? 'filter 0.1s ease-out' : 'none',
      }}>
        <GameCard agent={enemy} scale={1.1}/>
      </div>

      {/* VA tags */}
      <VaTag x="30%" value={player.va} winner={winner === 'player'} t={t}/>
      <VaTag x="70%" value={enemy.va} winner={winner === 'enemy'} t={t}/>

      <FlashOverlay opacity={flash * 0.85}/>

      {/* Tag "SLOW MOTION" durante freeze — micro-detail cinematografico */}
      {inFreeze && (
        <div style={{
          position: 'absolute', top: 96, left: 24, zIndex: 60, pointerEvents: 'none',
          opacity: smoothstep2(0, 0.2, freezeProgress) * (1 - smoothstep2(0.85, 1, freezeProgress)),
        }}>
          <div style={{
            fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4FD1C5',
            letterSpacing: '0.4em', textTransform: 'uppercase',
            padding: '4px 10px', border: '1px solid #4FD1C5',
            background: 'rgba(5,6,8,0.7)',
            textShadow: '0 0 8px rgba(79,209,197,0.7)',
          }}>◉ Slow-Motion · {Math.round((1 - freezeProgress) * 100)}%</div>
        </div>
      )}

      {/* Title outcome */}
      {aftermath > 0.1 && (
        <div style={{
          position: 'absolute', top: 110, left: '50%',
          transform: `translateX(-50%) scale(${smoothstep2(0.74, 0.9, t)})`,
          opacity: smoothstep2(0.74, 0.85, t) * (1 - smoothstep2(0.95, 1, t)),
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
            color: '#fff', letterSpacing: '0.24em', textShadow: '0 0 8px #000',
          }}>{winCard.name.toUpperCase()} · VA {winCard.va} → −{damage} PV</div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
    </div>
  );
}

// ============================================================
// A2 — COMETA DOPPIA
// Variazione: le CARTE restano (quasi) ferme. L'energia (cometa colorata armata)
// si proietta dalle carte verso il centro. Due comete si scontrano; quella del
// vincitore TRAFIGGE l'altra e prosegue oltre, poi torna come boomerang.
// Identità: cosmica/aurora, perfetta per i temi cosmici dei Figli.
// ============================================================
function ClashA2_Cometa({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO }) {
  const dur = 3000 / tweaks.clashSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const winCard = winner === 'player' ? player : enemy;
  const loserSide = winner === 'player' ? 'enemy' : 'player';
  const intensity = tweaks.intensity;

  // Phases:
  // 0-0.18 charge (cards glow, cometa nasce vicino alla carta)
  // 0.18-0.50 cometa launches verso il centro
  // 0.50-0.58 collision: comete si incrociano al centro
  // 0.58-0.72 winner's cometa pierces loser's e raggiunge la carta perdente
  // 0.72-1 aftermath: shockwave + sigillo + title
  const charge = smoothstep2(0, 0.18, t);
  const launch = smoothstep2(0.18, 0.50, t);
  const collide = smoothstep2(0.50, 0.58, t);
  const pierce = smoothstep2(0.58, 0.72, t);
  const aftermath = smoothstep2(0.70, 1, t);

  const flash = smoothstep2(0.50, 0.56, t) * (1 - smoothstep2(0.58, 0.7, t)) * intensity;
  const shake = (collide + pierce*0.5) * 10 * intensity * (1 - aftermath*0.7);
  const sx = Math.sin(t * 240) * shake, sy = Math.cos(t * 200) * shake;

  // Cometa positions (player launches right →, enemy launches left ←)
  // Start ~10% from card, end at the OTHER card
  const cometaProgress = smoothstep2(0.18, 0.72, t);
  // Player cometa: x from 30% + 70 → 70% (until pierce, winner's continues)
  const pCometaX = winner === 'player'
    ? 0.30 + (0.40) * smoothstep2(0.18, 0.72, t)  // continues to enemy card
    : 0.30 + (0.20) * smoothstep2(0.18, 0.55, t); // stops at center, gets pierced
  const eCometaX = winner === 'enemy'
    ? 0.70 - (0.40) * smoothstep2(0.18, 0.72, t)
    : 0.70 - (0.20) * smoothstep2(0.18, 0.55, t);

  // Loser cometa fades after pierce
  const pCometaAlpha = winner === 'player' ? 1 : 1 - pierce*0.85;
  const eCometaAlpha = winner === 'enemy' ? 1 : 1 - pierce*0.85;

  // Card pulse during charge
  const pCardPulse = 1 + charge * 0.06 + (winner === 'player' ? pierce * 0.04 : -pierce * 0.12);
  const eCardPulse = 1 + charge * 0.06 + (winner === 'enemy' ? pierce * 0.04 : -pierce * 0.12);
  const pCardOpacity = winner === 'player' ? 1 : 1 - aftermath * 0.5 - pierce * 0.15;
  const eCardOpacity = winner === 'enemy' ? 1 : 1 - aftermath * 0.5 - pierce * 0.15;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `saturate(${0.7 + charge*0.4}) brightness(${0.6 - charge*0.2 + collide*0.4})`,
        transform: `translate(${sx*0.4}px, ${sy*0.4}px)`,
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.88) 100%)' }}/>

      <CinemaBars t={t} intensity={intensity}/>

      {/* Trail della cometa player */}
      {launch > 0 && (
        <CometTrail
          fromX="30%" toX={`${pCometaX*100}%`}
          color={player.army.color} secondary="#fbbf24"
          progress={Math.min(1, smoothstep2(0.18, 0.72, t))}
          alpha={pCometaAlpha} intensity={intensity}
          pierce={winner === 'player' ? pierce : 0}
        />
      )}
      {/* Trail cometa enemy */}
      {launch > 0 && (
        <CometTrail
          fromX="70%" toX={`${eCometaX*100}%`}
          color={enemy.army.color} secondary="#fbbf24"
          progress={Math.min(1, smoothstep2(0.18, 0.72, t))}
          alpha={eCometaAlpha} intensity={intensity}
          pierce={winner === 'enemy' ? pierce : 0}
        />
      )}

      {/* Collision spark (al centro) */}
      {collide > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.4 + collide * 1.6})`,
          opacity: collide * (1 - smoothstep2(0.62, 0.74, t)),
          zIndex: 18, pointerEvents: 'none',
        }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle, #fff 0%, #fbbf24 25%, ${winArmy.color}66 50%, transparent 70%)`,
            boxShadow: `0 0 80px #fff, 0 0 160px ${winArmy.color}`,
          }}/>
        </div>
      )}

      {/* Shockwave aurora dopo pierce */}
      {pierce > 0.3 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 100 + (pierce-0.3) * 1800, height: 100 + (pierce-0.3) * 1800,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%', pointerEvents: 'none',
          border: `${3 - (pierce-0.3)*2.5}px solid rgba(79,209,197,${0.85 - (pierce-0.3)*0.75})`,
          boxShadow: `0 0 ${100*(pierce-0.3)}px rgba(79,209,197,0.8)`,
          zIndex: 28, opacity: 1 - aftermath*0.6,
        }}/>
      )}

      {/* Glifo vincitore — emerge dalla cometa */}
      {(pierce > 0.3 || aftermath > 0) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.4 + (pierce*0.6 + aftermath*0.8)}) rotate(${(pierce + aftermath*0.3) * 22}deg)`,
          opacity: (pierce*0.7 + aftermath*0.4) * intensity,
          zIndex: 7, pointerEvents: 'none',
        }}>
          <ArmySigil army={winArmy} size={500}/>
        </div>
      )}

      {/* Carta player */}
      <div style={{
        position: 'absolute', top: '50%', left: '30%',
        transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${pCardPulse}) rotate(${aftermath*(winner==='player'?0:14)}deg) translateY(${aftermath*(winner==='player'?0:50)}px)`,
        zIndex: winner === 'player' ? 20 : 10,
        opacity: pCardOpacity,
        filter: winner === 'player'
          ? `drop-shadow(0 0 ${20 + (charge+pierce*30)*1.5}px ${player.army.color})`
          : `brightness(${1 - (pierce*0.4 + aftermath*0.3)}) grayscale(${pierce*0.5 + aftermath*0.3})`,
      }}>
        <GameCard agent={player} scale={1.1}/>
      </div>
      {/* Carta enemy */}
      <div style={{
        position: 'absolute', top: '50%', left: '70%',
        transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${eCardPulse}) rotate(${aftermath*(winner==='enemy'?0:-14)}deg) translateY(${aftermath*(winner==='enemy'?0:50)}px)`,
        zIndex: winner === 'enemy' ? 20 : 10,
        opacity: eCardOpacity,
        filter: winner === 'enemy'
          ? `drop-shadow(0 0 ${20 + (charge+pierce*30)*1.5}px ${enemy.army.color})`
          : `brightness(${1 - (pierce*0.4 + aftermath*0.3)}) grayscale(${pierce*0.5 + aftermath*0.3})`,
      }}>
        <GameCard agent={enemy} scale={1.1}/>
      </div>

      {/* VA tags */}
      <VaTag x="30%" value={player.va} winner={winner === 'player'} t={t}/>
      <VaTag x="70%" value={enemy.va} winner={winner === 'enemy'} t={t}/>

      <FlashOverlay opacity={flash * 0.65}/>

      {/* Title */}
      {aftermath > 0.05 && (
        <div style={{
          position: 'absolute', top: 110, left: '50%',
          transform: `translateX(-50%) scale(${smoothstep2(0.72, 0.88, t)})`,
          opacity: smoothstep2(0.72, 0.84, t) * (1 - smoothstep2(0.95, 1, t)),
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
            color: '#fff', letterSpacing: '0.24em', textShadow: '0 0 8px #000',
          }}>{winCard.name.toUpperCase()} · VA {winCard.va} → −{damage} PV</div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
    </div>
  );
}

// Cometa con scia luminosa che parte da una carta verso il centro
function CometTrail({ fromX, toX, color, secondary, progress, alpha, intensity, pierce }) {
  // Cometa head moves from fromX → toX as progress 0→1
  // Trail: 8 puntini dietro
  const fromPct = parseFloat(fromX);
  const toPct = parseFloat(toX);
  const headPct = fromPct + (toPct - fromPct) * progress;
  // Trail goes from head back to fromX
  const trailPoints = 14;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 16, opacity: alpha }}>
      {/* Scia */}
      {Array.from({length: trailPoints}).map((_, i) => {
        const tBack = i / trailPoints;
        const pct = headPct - (headPct - fromPct) * tBack * 0.8;
        const sz = (1 - tBack) * 26 * intensity + 4;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: sz, height: sz, borderRadius: '50%',
            background: `radial-gradient(circle, ${i < 4 ? '#fff' : secondary} 0%, ${color} 50%, transparent 70%)`,
            boxShadow: `0 0 ${sz*2}px ${color}`,
            opacity: (1 - tBack) * 0.9,
          }}/>
        );
      })}
      {/* Cometa head */}
      <div style={{
        position: 'absolute', top: '50%', left: `${headPct}%`,
        transform: `translate(-50%, -50%) scale(${1 + pierce * 0.4})`,
        width: 36 * intensity, height: 36 * intensity, borderRadius: '50%',
        background: `radial-gradient(circle, #fff 0%, ${secondary} 40%, ${color} 70%, transparent 90%)`,
        boxShadow: `0 0 ${30 * intensity}px ${color}, 0 0 ${60 * intensity}px ${color}aa, 0 0 ${90 * intensity}px ${secondary}55`,
      }}/>
      {/* Pierce: linea che continua oltre la cometa nel finale */}
      {pierce > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: `${headPct}%`,
          height: 3, width: 50 * pierce * intensity,
          transform: `translate(0, -50%) ${toPct < fromPct ? 'scaleX(-1)' : ''}`,
          transformOrigin: 'left center',
          background: `linear-gradient(90deg, #fff, ${color}, transparent)`,
          opacity: pierce * (1 - pierce*0.5),
        }}/>
      )}
    </div>
  );
}

// ============================================================
// A3 — SCHERMO FRANTUMATO
// Variazione: al momento dell'impatto, lo schermo si crepa come vetro
// dal punto centrale. Le lastre ruotano leggermente, la carta vincitore
// emerge intera dalla crepa centrale, quella del perdente viene distorta
// dalle lastre disallineate. Più brutale, viscerale.
// ============================================================
function ClashA3_Frantumato({ tweaks, runId, onReplay, scenario = CLASH_SCENARIO }) {
  const dur = 3000 / tweaks.clashSpeed;
  const t = useClashTimeline(dur, runId);
  const { player, enemy, winner, damage, field } = scenario;
  const winArmy = winner === 'player' ? player.army : enemy.army;
  const winCard = winner === 'player' ? player : enemy;
  const intensity = tweaks.intensity;

  // Phases:
  // 0-0.15 settle, 0.15-0.45 charge, 0.45-0.55 lunge,
  // 0.55-0.62 IMPACT + screen crack appears
  // 0.62-0.85 lastre si separano e ruotano leggermente
  // 0.85-1 aftermath con sigillo e title emergenti dalla crepa
  const charge = smoothstep2(0.15, 0.45, t);
  const lunge = smoothstep2(0.45, 0.55, t);
  const impact = smoothstep2(0.55, 0.62, t);
  const shatter = smoothstep2(0.55, 0.85, t);
  const aftermath = smoothstep2(0.78, 1, t);
  const flash = smoothstep2(0.55, 0.6, t) * (1 - smoothstep2(0.62, 0.72, t)) * intensity;

  const pX = lunge * 90 - aftermath * (winner === 'player' ? -20 : 100);
  const eX = -lunge * 90 - aftermath * (winner === 'enemy' ? -20 : -100);
  const pScale = 1 + charge*0.08 + lunge*0.15 - aftermath*(winner==='player'?-0.03:0.18);
  const eScale = 1 + charge*0.08 + lunge*0.15 - aftermath*(winner==='enemy'?-0.03:0.18);

  const shake = impact * 14 * intensity * (1 - aftermath*0.6);
  const sx = Math.sin(t * 290) * shake, sy = Math.cos(t * 250) * shake;

  // Lastre — quando lo schermo crepa, segmentiamo lo stage in lastre triangolari
  // che ruotano da 0 a piccoli angoli; la carta perdente è "tagliata" in mezzo
  const plates = React.useMemo(() => [
    { angle: -38, ox: -180, oy: -120, rot: -2.4, depth: 0.6 },
    { angle: -8, ox: -60, oy: -180, rot: 1.8, depth: 0.4 },
    { angle: 35, ox: 140, oy: -160, rot: -1.5, depth: 0.5 },
    { angle: -55, ox: -210, oy: 60, rot: 2.2, depth: 0.7 },
    { angle: 14, ox: 80, oy: 90, rot: -1.2, depth: 0.4 },
    { angle: 60, ox: 200, oy: 130, rot: 1.6, depth: 0.6 },
  ], [runId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `url('${field.bg}') center/cover`,
        filter: `saturate(${0.7 + charge*0.4}) brightness(${0.6 - charge*0.2 + impact*0.5})`,
        transform: `translate(${sx}px, ${sy}px)`,
      }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.88) 100%)' }}/>

      <CinemaBars t={t} intensity={intensity}/>

      {/* Charge rays */}
      {charge > 0 && (
        <>
          <ChargeRays x="30%" color={player.army.color} strength={charge * (1 - lunge)} count={9}/>
          <ChargeRays x="70%" color={enemy.army.color} strength={charge * (1 - lunge)} count={9}/>
        </>
      )}

      {/* SCHERMO CRACK — SVG crepe partendo dal centro */}
      {impact > 0 && (
        <svg style={{
          position: 'absolute', inset: 0, zIndex: 35, pointerEvents: 'none',
          opacity: smoothstep2(0.55, 0.65, t) * (1 - smoothstep2(0.92, 1, t)),
        }} viewBox="0 0 100 56" preserveAspectRatio="none">
          <defs>
            <filter id="crackGlow">
              <feGaussianBlur stdDeviation="0.3"/>
              <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Crepe radiali dal centro */}
          {[0, 32, 65, 92, 130, 165, 210, 248, 285, 318].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const len = 30 + (i*7 % 18);
            const x2 = 50 + Math.cos(rad) * len * shatter;
            const y2 = 28 + Math.sin(rad) * len * 0.6 * shatter;
            // jagged path
            const mx = 50 + Math.cos(rad) * len * 0.45 * shatter + (i % 3 - 1) * 2;
            const my = 28 + Math.sin(rad) * len * 0.45 * 0.6 * shatter + (i % 3 - 1) * 1.5;
            return (
              <g key={i}>
                <path d={`M 50 28 L ${mx} ${my} L ${x2} ${y2}`}
                  stroke="rgba(255,255,255,0.92)" strokeWidth="0.18" fill="none"
                  filter="url(#crackGlow)"
                  style={{ filter: 'drop-shadow(0 0 1px rgba(79,209,197,0.8))' }}/>
                <path d={`M 50 28 L ${mx} ${my} L ${x2} ${y2}`}
                  stroke={winArmy.color} strokeWidth="0.07" fill="none" opacity="0.8"/>
              </g>
            );
          })}
          {/* Cerchio centrale */}
          <circle cx="50" cy="28" r={1.2 + impact * 1.4} fill="rgba(255,255,255,0.9)"
            style={{ filter: `drop-shadow(0 0 4px ${winArmy.color})` }}/>
        </svg>
      )}

      {/* Lastre — frammenti che si spostano leggermente con la luce dei sigilli */}
      {shatter > 0.2 && plates.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(calc(-50% + ${p.ox * shatter}px), calc(-50% + ${p.oy * shatter}px)) rotate(${p.rot * shatter * intensity}deg)`,
          width: 280, height: 180,
          opacity: (shatter - 0.2) * 0.4 * (1 - aftermath*0.5),
          background: `linear-gradient(${p.angle}deg, transparent 45%, rgba(79,209,197,0.18) 49%, rgba(255,255,255,0.4) 50%, rgba(251,191,36,0.18) 51%, transparent 55%)`,
          clipPath: `polygon(${10 + i*3}% 0, ${60 + i*4}% 0, 100% 100%, ${30 + i*5}% 100%)`,
          zIndex: 14, pointerEvents: 'none',
          boxShadow: `inset 0 0 20px ${winArmy.color}33`,
        }}/>
      ))}

      {/* Shockwave concentrico */}
      {impact > 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 100 + impact * 1700, height: 100 + impact * 1700,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%', pointerEvents: 'none',
          border: `${4 - impact*3}px solid rgba(79,209,197,${0.9 - impact*0.8})`,
          boxShadow: `0 0 ${90*impact}px rgba(79,209,197,0.85), inset 0 0 ${70*impact}px rgba(251,191,36,0.6)`,
          zIndex: 30, opacity: 1 - aftermath,
        }}/>
      )}

      {/* Glifo vincitore — emerge dalla crepa centrale */}
      {(shatter > 0.5 || aftermath > 0) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${0.2 + (shatter-0.5) * 1.4 + aftermath*0.4}) rotate(${(shatter + aftermath*0.3) * 20}deg)`,
          opacity: ((shatter-0.5) * 1.2 + aftermath * 0.5) * intensity,
          zIndex: 16, pointerEvents: 'none',
          clipPath: `circle(${50 + (shatter-0.5)*60}% at 50% 50%)`,
        }}>
          <ArmySigil army={winArmy} size={520}/>
        </div>
      )}

      {/* Carte */}
      <div style={{
        position: 'absolute', top: '50%', left: '30%',
        transform: `translate(calc(-50% + ${pX + sx}px), calc(-50% + ${sy}px)) scale(${pScale}) rotate(${aftermath*(winner==='player'?0:14)}deg)`,
        zIndex: winner === 'player' ? 22 : 8,
        opacity: winner === 'player' ? 1 : 1 - aftermath * 0.55,
        filter: winner === 'player'
          ? `drop-shadow(0 0 ${20 + (impact+aftermath*0.4)*40}px ${player.army.color}) drop-shadow(0 0 ${10 + aftermath*30}px ${player.army.glow})`
          : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6}) ${shatter > 0.3 ? `hue-rotate(${shatter*-20}deg)` : ''}`,
      }}>
        <GameCard agent={player} scale={1.1}/>
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '70%',
        transform: `translate(calc(-50% + ${eX + sx}px), calc(-50% + ${sy}px)) scale(${eScale}) rotate(${aftermath*(winner==='enemy'?0:-14)}deg)`,
        zIndex: winner === 'enemy' ? 22 : 8,
        opacity: winner === 'enemy' ? 1 : 1 - aftermath * 0.55,
        filter: winner === 'enemy'
          ? `drop-shadow(0 0 ${20 + (impact+aftermath*0.4)*40}px ${enemy.army.color}) drop-shadow(0 0 ${10 + aftermath*30}px ${enemy.army.glow})`
          : `brightness(${1 - aftermath*0.45}) grayscale(${aftermath*0.6}) ${shatter > 0.3 ? `hue-rotate(${shatter*20}deg)` : ''}`,
      }}>
        <GameCard agent={enemy} scale={1.1}/>
      </div>

      {/* VA tags */}
      <VaTag x="30%" value={player.va} winner={winner === 'player'} t={t}/>
      <VaTag x="70%" value={enemy.va} winner={winner === 'enemy'} t={t}/>

      <FlashOverlay opacity={flash * 0.8}/>

      {/* Title */}
      {aftermath > 0.1 && (
        <div style={{
          position: 'absolute', top: 110, left: '50%',
          transform: `translateX(-50%) scale(${smoothstep2(0.78, 0.92, t)})`,
          opacity: smoothstep2(0.78, 0.88, t) * (1 - smoothstep2(0.95, 1, t)),
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
            color: '#fff', letterSpacing: '0.24em', textShadow: '0 0 8px #000',
          }}>{winCard.name.toUpperCase()} · VA {winCard.va} → −{damage} PV</div>
        </div>
      )}

      <ReplayButton onClick={onReplay}/>
    </div>
  );
}

Object.assign(window, { ClashA1_SlowMo, ClashA2_Cometa, ClashA3_Frantumato });
