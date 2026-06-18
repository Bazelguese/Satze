/* 3 varianti della sezione Duello — HUD + layout della partita in corso */

// ============================================================
// V1 — TATTICO RAFFINATO
// Pulisce e moderna il layout attuale: HUD corner-clipped più leggibili,
// timeline di fase in alto, hand con hover/select migliori, feedback PV/FC inline.
// ============================================================
function DuelV1_Tattico({ tweaks }) {
  const [selected, setSelected] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  const [pHP, setPHP] = React.useState(18);
  const [eHP, setEHP] = React.useState(12);
  const [pFC, setPFC] = React.useState(11);
  const [eFC, setEFC] = React.useState(13);
  const [turn] = React.useState(4);
  const [phase, setPhase] = React.useState(1); // 0..3 (selectAgent, lockedFC, reveal, resolution)
  const selCard = PLAYER_HAND.find(c => c.id === selected);
  const previewCard = PLAYER_HAND.find(c => c.id === hover) || selCard;

  const phases = ['Selezione Agente', 'FC Bloccati', 'Rivelazione', 'Risoluzione'];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      {/* BG campo + overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `url('${BATTLEFIELD.bg}') center/cover` }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.92) 100%)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)' }}/>
      {tweaks.showScanlines && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(to bottom, transparent 0 3px, rgba(56,189,248,0.015) 3px 4px)' }}/>}

      {/* === TOP BAR === */}
      {tweaks.showHud !== 'hideTop' && (
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 16, alignItems: 'flex-start', zIndex: 10 }}>
          {/* NEMICO */}
          <HudPanel tone="blood" title="Nemico · IA" tag="L4 · Vendetta" style={{ flex: 1, maxWidth: 380 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <StatOrb value={eHP} max={25} label="PV" tone="blood" size={56}/>
              <div style={{ flex: 1 }}>
                <HpBar value={eHP} max={25} tone="blood" label={`PV ${eHP}/25`}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.15em' }}>FC RES.</span>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: 14, color: '#fbbf24', letterSpacing: '0.05em' }}>{eFC}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.15em' }}>MANO {ENEMY_HAND.length}</span>
                </div>
              </div>
            </div>
          </HudPanel>

          {/* CENTRO: turno + fase */}
          <HudPanel tone="cyan" title={`Turno ${String(turn).padStart(2,'0')}`} tag={`${BATTLEFIELD.name}`} style={{ width: 280, textAlign: 'center' }} glow>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 6 }}>
              {phases.map((p, i) => (
                <div key={i} onClick={() => setPhase(i)} style={{
                  flex: 1, cursor: 'pointer',
                  padding: '4px 2px',
                  background: i === phase ? 'rgba(56,189,248,0.22)' : 'rgba(56,189,248,0.04)',
                  border: `1px solid ${i === phase ? '#38bdf8' : '#1e293b'}`,
                  borderTopColor: i <= phase ? '#38bdf8' : '#1e293b',
                  boxShadow: i === phase ? '0 0 8px rgba(56,189,248,0.4)' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'Share Tech Mono', fontSize: 9, color: i === phase ? '#38bdf8' : '#475569',
                    letterSpacing: '0.06em', transition: 'all 0.2s',
                  }}>F{i}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#fbbf24', letterSpacing: '0.18em', textTransform: 'uppercase', textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
              {phases[phase]}
            </div>
          </HudPanel>

          {/* GIOCATORE */}
          <HudPanel tone="gold" title="Tu · Figli dell'Orizzonte" tag="2/3 Campi" style={{ flex: 1, maxWidth: 380 }} glow>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <HpBar value={pHP} max={25} tone="gold" label={`PV ${pHP}/25`}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.15em' }}>FC RES.</span>
                  <span style={{ fontFamily: 'Share Tech Mono', fontSize: 14, color: '#fbbf24', letterSpacing: '0.05em' }}>{pFC}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.15em' }}>MANO {PLAYER_HAND.filter(c => !c.used).length}</span>
                </div>
              </div>
              <StatOrb value={pHP} max={25} label="PV" tone="gold" size={56}/>
            </div>
          </HudPanel>
        </div>
      )}

      {/* === MANO NEMICA (face-down) === */}
      <div style={{ position: 'absolute', top: 152, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, zIndex: 5 }}>
        {ENEMY_HAND.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - (ENEMY_HAND.length-1)/2)*4}deg) translateY(${Math.abs(i-(ENEMY_HAND.length-1)/2)*6}px)`,
            transformOrigin: 'bottom center',
          }}>
            <GameCard agent={{ army: c.army }} faceDown scale={0.55}/>
          </div>
        ))}
      </div>

      {/* === ARENA CENTRALE: previewScontro === */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6, display: 'flex', alignItems: 'center', gap: 36 }}>
        {/* Campo */}
        <div style={{
          width: 220, height: 220, display: 'grid', placeItems: 'center', position: 'relative',
        }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle, ${BATTLEFIELD.glowColor} 0%, transparent 70%)`,
            position: 'absolute', filter: 'blur(20px)',
          }}/>
          <HudPanel tone={BATTLEFIELD.accent} title="Campo Attivo" tag={BATTLEFIELD.name} style={{ width: 220, textAlign: 'center' }} glow dense>
            <div style={{ fontSize: 28, color: BATTLEFIELD.accent, lineHeight: 1, marginBottom: 4, textShadow: `0 0 12px ${BATTLEFIELD.glowColor}` }}>{BATTLEFIELD.icon}</div>
            <div style={{ fontFamily: 'Chakra Petch', fontSize: 10, color: '#cbd5e1', lineHeight: 1.4, letterSpacing: '0.04em' }}>{BATTLEFIELD.effect}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
              {[true, true, false, false, false].map((conq, i) => (
                <div key={i} style={{
                  width: 16, height: 16, border: `1.5px solid ${conq ? '#d4af37' : '#334155'}`,
                  background: conq ? '#d4af37' : 'transparent',
                  clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                  boxShadow: conq ? '0 0 6px #d4af37' : 'none',
                }}/>
              ))}
            </div>
          </HudPanel>
        </div>
      </div>

      {/* === PREVIEW CARTA SELEZIONATA (sinistra) === */}
      {previewCard && (
        <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-30%)', zIndex: 7 }}>
          <HudPanel tone={previewCard.army.color} title="Anteprima" tag={previewCard.army.short} style={{ width: 250 }}>
            <GameCard agent={previewCard} scale={1}/>
            <div style={{ marginTop: 10, padding: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid #1e293b' }}>
              <div style={{ fontFamily: 'Chakra Petch', fontSize: 9, color: '#94a3b8', letterSpacing: '0.18em', marginBottom: 4 }}>VA PROIETTATO</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: 28, color: '#fbbf24', textShadow: '0 0 10px #fbbf2466' }}>{previewCard.va}</span>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#64748b' }}>≈ POT×FC</span>
              </div>
            </div>
          </HudPanel>
        </div>
      )}

      {/* === LOG (destra) === */}
      {tweaks.showHud !== 'hideLog' && (
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 7, width: 280 }}>
          <HudPanel tone="cyan" title="Registro" tag="ULTIMI 8">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TURN_LOG.slice(-7).map((l, i) => (
                <div key={i} style={{
                  fontFamily: 'Share Tech Mono', fontSize: 10, lineHeight: 1.4,
                  color: l.tone === 'pos' ? '#10b981' : l.tone === 'neg' ? '#dc2626' : l.tone === 'act' ? '#38bdf8' : '#cbd5e1',
                  letterSpacing: '0.02em', paddingLeft: 6,
                  borderLeft: `2px solid ${l.tone === 'pos' ? '#10b981' : l.tone === 'neg' ? '#dc2626' : l.tone === 'act' ? '#38bdf8' : '#334155'}`,
                }}>
                  <span style={{ color: '#475569', marginRight: 6 }}>T{l.t}</span>{l.text}
                </div>
              ))}
            </div>
          </HudPanel>
        </div>
      )}

      {/* === MANO GIOCATORE === */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 8, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        {PLAYER_HAND.map((c, i) => {
          const cx = (i - (PLAYER_HAND.length-1)/2);
          const isHovered = hover === c.id && !c.used;
          const isSelected = selected === c.id;
          return (
            <div key={c.id} style={{
              transform: `translateY(${isHovered ? -32 : isSelected ? -16 : Math.abs(cx)*5}px) rotate(${cx*1.5}deg) scale(${isSelected || isHovered ? 1.04 : 1})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isHovered || isSelected ? 20 : 1,
            }}>
              <GameCard agent={c} scale={0.85}
                selected={isSelected} hovered={isHovered}
                onClick={() => !c.used && setSelected(s => s === c.id ? null : c.id)}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}/>
            </div>
          );
        })}
      </div>

      {/* === AZIONI === */}
      <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => selCard && setPhase(p => Math.min(3, p+1))} disabled={!selCard}
          style={{
            fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 13, letterSpacing: '0.22em',
            textTransform: 'uppercase', padding: '14px 28px', color: '#fff',
            background: selCard ? 'rgba(249,115,22,0.2)' : 'rgba(56,189,248,0.04)',
            border: `1.5px solid ${selCard ? '#f97316' : '#334155'}`,
            boxShadow: selCard ? '0 0 16px #f9731699, 0 0 32px #f9731644' : 'none',
            cursor: selCard ? 'pointer' : 'not-allowed', opacity: selCard ? 1 : 0.55,
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            transition: 'all 0.25s',
          }}>
          Conferma Agente ▸
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            flex: 1, fontFamily: 'Chakra Petch', fontWeight: 600, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', padding: '8px 14px', color: '#94a3b8',
            background: 'rgba(5,6,8,0.7)', border: '1.5px solid #334155', cursor: 'pointer',
          }}>Resa</button>
          <button style={{
            flex: 1, fontFamily: 'Chakra Petch', fontWeight: 600, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', padding: '8px 14px', color: '#94a3b8',
            background: 'rgba(5,6,8,0.7)', border: '1.5px solid #334155', cursor: 'pointer',
          }}>Registro</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V2 — BANNER CINEMATOGRAFICO
// Layout immersivo: HUD in due bande sottili (top/bottom), arena al centro,
// stats agent in floating panels accanto a ogni carta, focus narrativo.
// ============================================================
function DuelV2_Cinematic({ tweaks }) {
  const [selected, setSelected] = React.useState(PLAYER_HAND[0].id);
  const [hover, setHover] = React.useState(null);
  const [pHP] = React.useState(18);
  const [eHP] = React.useState(12);
  const [pFC] = React.useState(11);
  const previewCard = PLAYER_HAND.find(c => c.id === (hover || selected));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, background: `url('${BATTLEFIELD.bg}') center/cover` }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.9) 100%)' }}/>

      {/* === BANDA TOP — riepilogo essenziale === */}
      {tweaks.showHud !== 'hideTop' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, zIndex: 10,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.4))',
          borderBottom: '1px solid rgba(56,189,248,0.25)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
        }}>
          {/* Player */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
            <img src={ARMIES.orizzonte.glyph} style={{ width: 32, height: 32, filter: `drop-shadow(0 0 6px ${ARMIES.orizzonte.color})` }}/>
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#fff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tu</div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.1em' }}>FIGLI DELL'ORIZZONTE</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginLeft: 14 }}>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 28, color: '#d4af37', textShadow: '0 0 12px #d4af3766', lineHeight: 1 }}>{pHP}</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 12, color: '#64748b' }}>/25 PV</span>
            </div>
            <div style={{ marginLeft: 18, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 18, color: '#38bdf8', textShadow: '0 0 6px #38bdf866', lineHeight: 1 }}>{pFC}</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#64748b' }}>FC</span>
            </div>
            {/* Conquiste */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 18 }}>
              {[true, true, false].map((c, i) => (
                <div key={i} style={{
                  width: 18, height: 18, border: `1.5px solid ${c ? '#d4af37' : '#334155'}`,
                  background: c ? '#d4af37' : 'transparent',
                  clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                  boxShadow: c ? '0 0 8px #d4af37' : 'none',
                }}/>
              ))}
            </div>
          </div>

          {/* Turno centrale */}
          <div style={{ textAlign: 'center', padding: '0 24px',
            background: 'linear-gradient(180deg, rgba(251,191,36,0.08), transparent)',
            borderLeft: '1px solid rgba(251,191,36,0.2)', borderRight: '1px solid rgba(251,191,36,0.2)',
            alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#fbbf24', letterSpacing: '0.32em', textTransform: 'uppercase' }}>Turno IV</div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.12em' }}>{BATTLEFIELD.name.toUpperCase()}</div>
          </div>

          {/* Enemy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[true, false, false].map((c, i) => (
                <div key={i} style={{
                  width: 18, height: 18, border: `1.5px solid ${c ? '#dc2626' : '#334155'}`,
                  background: c ? '#dc2626' : 'transparent',
                  clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                  boxShadow: c ? '0 0 8px #dc2626' : 'none',
                }}/>
              ))}
            </div>
            <div style={{ marginRight: 18, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 18, color: '#38bdf8', lineHeight: 1 }}>9</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#64748b' }}>FC</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 28, color: '#dc2626', textShadow: '0 0 12px #dc262666', lineHeight: 1 }}>{eHP}</span>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 12, color: '#64748b' }}>/25 PV</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#fff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>IA</div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.1em' }}>KETHRAN</div>
            </div>
            <img src={ARMIES.kethran.glyph} style={{ width: 32, height: 32, filter: `drop-shadow(0 0 6px ${ARMIES.kethran.color})` }}/>
          </div>
        </div>
      )}

      {/* Mano nemica */}
      <div style={{ position: 'absolute', top: 84, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, zIndex: 5 }}>
        {ENEMY_HAND.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - (ENEMY_HAND.length-1)/2)*5}deg) translateY(${Math.abs(i-(ENEMY_HAND.length-1)/2)*4}px)`,
          }}>
            <GameCard agent={{ army: c.army }} faceDown scale={0.5}/>
          </div>
        ))}
      </div>

      {/* === ARENA CENTRALE — anteprima scontro === */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6,
        display: 'flex', alignItems: 'center', gap: 56 }}>
        {/* Carta in anteprima */}
        {previewCard ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#fbbf24', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Schierato</div>
              <GameCard agent={previewCard} scale={1.1} glow/>
            </div>

            {/* Pannello centrale VA proiezione + campo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%',
                border: `2px solid ${BATTLEFIELD.accent}`, display: 'grid', placeItems: 'center',
                boxShadow: `0 0 16px ${BATTLEFIELD.glowColor}, inset 0 0 16px ${BATTLEFIELD.glowColor}`,
                background: 'rgba(5,6,8,0.85)',
              }}>
                <span style={{ fontSize: 32, color: BATTLEFIELD.accent, textShadow: `0 0 8px ${BATTLEFIELD.glowColor}` }}>{BATTLEFIELD.icon}</span>
              </div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#fff', letterSpacing: '0.22em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>VS</div>
              <div style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#64748b', letterSpacing: '0.1em', textAlign: 'center' }}>VA proiettato</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Share Tech Mono', fontSize: 36, lineHeight: 1 }}>
                <span style={{ color: '#d4af37', textShadow: '0 0 12px #d4af3777' }}>{previewCard.va}</span>
                <span style={{ color: '#475569', fontSize: 18 }}>:</span>
                <span style={{ color: '#dc2626', textShadow: '0 0 12px #dc262677' }}>?</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#dc2626', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Sconosciuto</div>
              <GameCard agent={{ army: ARMIES.kethran }} faceDown scale={1.1}/>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontStyle: 'italic', color: '#64748b', letterSpacing: '0.18em' }}>
            Seleziona un Agente…
          </div>
        )}
      </div>

      {/* === BANDA BOTTOM — mano + azioni === */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, zIndex: 8,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.95), transparent)',
      }}/>

      <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 9,
        display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        {PLAYER_HAND.map((c, i) => {
          const cx = (i - (PLAYER_HAND.length-1)/2);
          const isHovered = hover === c.id && !c.used;
          const isSelected = selected === c.id;
          return (
            <div key={c.id} style={{
              transform: `translateY(${isHovered ? -36 : isSelected ? -20 : Math.abs(cx)*4}px) rotate(${cx*1.8}deg) scale(${isSelected || isHovered ? 1.06 : 1})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isHovered || isSelected ? 20 : 1,
              filter: isSelected ? `drop-shadow(0 -6px 18px ${c.army.color})` : 'none',
            }}>
              <GameCard agent={c} scale={0.78}
                selected={isSelected} hovered={isHovered}
                onClick={() => !c.used && setSelected(s => s === c.id ? null : c.id)}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}/>
            </div>
          );
        })}
      </div>

      {/* Azioni laterali */}
      <div style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 11 }}>
        <button disabled={!selected}
          style={{
            fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.28em',
            textTransform: 'uppercase', padding: '14px 32px', color: '#fff',
            background: selected ? 'linear-gradient(135deg, rgba(249,115,22,0.4), rgba(220,38,38,0.4))' : 'rgba(56,189,248,0.04)',
            border: `1.5px solid ${selected ? '#f97316' : '#334155'}`,
            boxShadow: selected ? '0 0 20px #f9731688, 0 0 40px #f9731644' : 'none',
            cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.45,
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}>
          Schiera ▸
        </button>
      </div>

      {/* Log compresso a sinistra */}
      {tweaks.showHud !== 'hideLog' && (
        <div style={{ position: 'absolute', bottom: 28, left: 24, zIndex: 11, width: 240 }}>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 9, color: '#64748b', letterSpacing: '0.28em', marginBottom: 6 }}>↳ ULTIMO TURNO</div>
          {TURN_LOG.slice(-3).map((l, i) => (
            <div key={i} style={{
              fontFamily: 'Share Tech Mono', fontSize: 11, lineHeight: 1.35, padding: '2px 0',
              color: l.tone === 'pos' ? '#10b981' : l.tone === 'neg' ? '#dc2626' : l.tone === 'act' ? '#38bdf8' : '#94a3b8',
              letterSpacing: '0.02em',
            }}>{l.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// V3 — AURORA RADIALE
// Più audace: HUD circolare/radiale ai due angoli, focus al centro su un
// "anello" che mostra tutto lo stato del duello (PV, FC, conquiste, agent slot).
// Estetica più cosmica, fedele al motivo aurora del clash attuale.
// ============================================================
function DuelV3_Aurora({ tweaks }) {
  const [selected, setSelected] = React.useState(PLAYER_HAND[0].id);
  const [hover, setHover] = React.useState(null);
  const [pHP] = React.useState(18);
  const [eHP] = React.useState(12);
  const [pFC] = React.useState(11);
  const previewCard = PLAYER_HAND.find(c => c.id === (hover || selected));
  const t = React.useRef(0);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const loop = () => { t.current += 0.012; setTick(t.current); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: 'Chakra Petch, sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: `url('${BATTLEFIELD.bg}') center/cover`, filter: 'saturate(1.1)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.92) 90%)' }}/>
      {/* aurora glow drift */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 40% at ${50 + Math.sin(tick)*6}% ${40 + Math.cos(tick*0.7)*6}%, rgba(79,209,197,0.18) 0%, transparent 60%),
                     radial-gradient(ellipse 50% 30% at ${50 + Math.cos(tick*0.5)*8}% ${60 + Math.sin(tick*0.9)*4}%, rgba(167,139,250,0.14) 0%, transparent 60%)`,
        mixBlendMode: 'screen',
      }}/>

      {/* === HUD RADIALE TOP-LEFT (PLAYER) === */}
      {tweaks.showHud !== 'hideTop' && (
        <PlayerRadialHud x={32} y={32} hp={pHP} fc={pFC} army={ARMIES.orizzonte} tone="gold" name="Tu" conq={2} hand={PLAYER_HAND.filter(c=>!c.used).length}/>
      )}
      {/* TOP-RIGHT (ENEMY) */}
      {tweaks.showHud !== 'hideTop' && (
        <PlayerRadialHud x="auto" right={32} y={32} hp={eHP} fc={9} army={ARMIES.kethran} tone="blood" name="IA" conq={1} hand={ENEMY_HAND.length} mirror/>
      )}

      {/* Turno centrale-alto */}
      <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 11, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 15, color: '#fbbf24', letterSpacing: '0.38em',
          textTransform: 'uppercase', textShadow: '0 0 12px rgba(251,191,36,0.45)',
        }}>TURNO IV</div>
        <div style={{
          fontFamily: 'Share Tech Mono', fontSize: 10, color: '#94a3b8', letterSpacing: '0.18em', marginTop: 4,
        }}>· {BATTLEFIELD.name.toUpperCase()} ·</div>
      </div>

      {/* Mano nemica fan in alto al centro */}
      <div style={{ position: 'absolute', top: 86, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 5 }}>
        {ENEMY_HAND.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - (ENEMY_HAND.length-1)/2)*4}deg) translateY(${Math.abs(i-(ENEMY_HAND.length-1)/2)*4}px)`,
          }}>
            <GameCard agent={{ army: c.army }} faceDown scale={0.46}/>
          </div>
        ))}
      </div>

      {/* === ANELLO CENTRALE === */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 7 }}>
        <AuroraDuelRing size={460} fc={[5, 3]} tick={tick} field={BATTLEFIELD} player={previewCard} enemy={null}/>
      </div>

      {/* === LOG laterale === */}
      {tweaks.showHud !== 'hideLog' && (
        <div style={{ position: 'absolute', bottom: 200, left: 24, zIndex: 11, width: 240 }}>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 9, color: '#64748b', letterSpacing: '0.28em', marginBottom: 6 }}>↳ ECO DEL DUELLO</div>
          {TURN_LOG.slice(-4).map((l, i) => (
            <div key={i} style={{
              fontFamily: 'Share Tech Mono', fontSize: 11, lineHeight: 1.35, padding: '2px 0',
              color: l.tone === 'pos' ? '#10b981' : l.tone === 'neg' ? '#dc2626' : l.tone === 'act' ? '#38bdf8' : '#94a3b8',
            }}>{l.text}</div>
          ))}
        </div>
      )}

      {/* Mano giocatore - fan in basso */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9,
        display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        {PLAYER_HAND.map((c, i) => {
          const cx = (i - (PLAYER_HAND.length-1)/2);
          const isHovered = hover === c.id && !c.used;
          const isSelected = selected === c.id;
          return (
            <div key={c.id} style={{
              transform: `translateY(${isHovered ? -36 : isSelected ? -22 : Math.abs(cx)*5}px) rotate(${cx*2}deg) scale(${isSelected || isHovered ? 1.05 : 1})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isHovered || isSelected ? 20 : 1,
              filter: isSelected ? `drop-shadow(0 -8px 24px ${c.army.glow})` : 'none',
            }}>
              <GameCard agent={c} scale={0.82}
                selected={isSelected} hovered={isHovered}
                onClick={() => !c.used && setSelected(s => s === c.id ? null : c.id)}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}/>
            </div>
          );
        })}
      </div>

      {/* Conferma */}
      <div style={{ position: 'absolute', bottom: 38, right: 32, zIndex: 11 }}>
        <button disabled={!selected}
          style={{
            fontFamily: 'Chakra Petch', fontWeight: 700, fontSize: 12, letterSpacing: '0.28em',
            textTransform: 'uppercase', padding: '14px 28px', color: '#fff',
            background: selected ? 'radial-gradient(ellipse at center, rgba(79,209,197,0.35), rgba(167,139,250,0.2))' : 'rgba(0,0,0,0.4)',
            border: `1.5px solid ${selected ? '#4FD1C5' : '#334155'}`,
            boxShadow: selected ? '0 0 24px rgba(79,209,197,0.55), 0 0 48px rgba(167,139,250,0.25)' : 'none',
            cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.5,
            borderRadius: 999,
          }}>
          ◆ Schiera ◆
        </button>
      </div>
    </div>
  );
}

// HUD radiale d'angolo (V3): orb PV centrale, anello FC, ali armata, conquiste
function PlayerRadialHud({ x, y, right, hp, fc, army, tone, name, conq, hand, mirror }) {
  const fcMax = 18;
  const fcCirc = 2 * Math.PI * 56;
  const fcPct = Math.max(0, Math.min(1, fc / fcMax));
  const hpMax = 25;
  const hpCirc = 2 * Math.PI * 38;
  const hpPct = Math.max(0, Math.min(1, hp / hpMax));
  const c = tone === 'blood' ? '#dc2626' : '#d4af37';
  return (
    <div style={{
      position: 'absolute', top: y, left: x, right: right, zIndex: 11,
      display: 'flex', flexDirection: mirror ? 'row-reverse' : 'row', gap: 14, alignItems: 'flex-start',
    }}>
      {/* anello esterno FC + interno PV */}
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="65" cy="65" r="56" fill="rgba(5,6,8,0.7)" stroke="#1e293b" strokeWidth="1"/>
          <circle cx="65" cy="65" r="56" fill="none" stroke="#38bdf8" strokeWidth="3"
            strokeDasharray={fcCirc} strokeDashoffset={fcCirc * (1 - fcPct)}
            style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }}/>
          <circle cx="65" cy="65" r="38" fill="rgba(5,6,8,0.85)" stroke="#1e293b" strokeWidth="1"/>
          <circle cx="65" cy="65" r="38" fill="none" stroke={c} strokeWidth="3"
            strokeDasharray={hpCirc} strokeDashoffset={hpCirc * (1 - hpPct)}
            style={{ filter: `drop-shadow(0 0 6px ${c})` }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 24, color: c, fontWeight: 700, textShadow: `0 0 8px ${c}88`, lineHeight: 1 }}>{hp}</div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#94a3b8', letterSpacing: '0.18em', marginTop: 2 }}>PV/25</div>
          </div>
        </div>
        {/* FC label */}
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          background: '#050608', padding: '2px 8px',
          fontFamily: 'Share Tech Mono', fontSize: 10, color: '#38bdf8', letterSpacing: '0.12em',
        }}>FC {fc}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: mirror ? 'flex-end' : 'flex-start', gap: 6, paddingTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: mirror ? 'row-reverse' : 'row' }}>
          <img src={army.glyph} alt="" style={{ width: 28, height: 28, filter: `drop-shadow(0 0 6px ${army.color})` }}/>
          <div style={{ textAlign: mirror ? 'right' : 'left' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#fff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{name}</div>
            <div style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: army.color, letterSpacing: '0.1em' }}>{army.short}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, flexDirection: mirror ? 'row-reverse' : 'row' }}>
          {Array.from({length: 3}).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, border: `1.5px solid ${i < conq ? c : '#334155'}`,
              background: i < conq ? c : 'transparent',
              clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
              boxShadow: i < conq ? `0 0 6px ${c}` : 'none',
            }}/>
          ))}
        </div>
        <div style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#64748b', letterSpacing: '0.14em' }}>MANO · {hand}</div>
      </div>
    </div>
  );
}

// Anello duello centrale (V3): mostra agent slot, glifo campo, FC orbs, VA projection
function AuroraDuelRing({ size, fc, tick, field, player, enemy }) {
  const cx = size/2, cy = size/2;
  const r = size/2 - 4;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* anello sfumato */}
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9"/>
            <stop offset="50%" stopColor="#4FD1C5" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9"/>
          </linearGradient>
          <radialGradient id="auroraCenter">
            <stop offset="0%" stopColor="rgba(10,22,40,0.95)"/>
            <stop offset="80%" stopColor="rgba(10,22,40,0.65)"/>
            <stop offset="100%" stopColor="rgba(10,22,40,0.1)"/>
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r-30} fill="url(#auroraCenter)" stroke="url(#auroraGrad)" strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 20px rgba(79,209,197,0.45))' }}/>
        {/* anello rotante segmentato */}
        <g transform={`rotate(${tick*8} ${cx} ${cy})`}>
          {Array.from({length: 48}).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const x1 = cx + Math.cos(a) * (r-4), y1 = cy + Math.sin(a) * (r-4);
            const x2 = cx + Math.cos(a) * (r-14), y2 = cy + Math.sin(a) * (r-14);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i % 12 === 0 ? '#fbbf24' : i % 4 === 0 ? '#4FD1C5' : '#1e293b'}
              strokeWidth={i % 12 === 0 ? 2 : 1} opacity={i % 4 === 0 ? 0.85 : 0.4}/>;
          })}
        </g>
        {/* inner ring */}
        <circle cx={cx} cy={cy} r={r-24} fill="none" stroke="rgba(79,209,197,0.25)" strokeWidth="1"/>
      </svg>

      {/* Slot player a sinistra */}
      <div style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)' }}>
        {player ? (
          <GameCard agent={player} scale={0.85} glow/>
        ) : (
          <EmptySlot army={ARMIES.orizzonte}/>
        )}
      </div>
      {/* Slot enemy a destra */}
      <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
        <EmptySlot army={ARMIES.kethran} mystery/>
      </div>
      {/* Centro: campo + VA */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{
          fontSize: 36, color: field.accent,
          textShadow: `0 0 20px ${field.glowColor}, 0 0 40px ${field.glowColor}`,
        }}>{field.icon}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#fff', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4, textShadow: `0 0 8px ${field.glowColor}` }}>
          {field.name}
        </div>
        <div style={{ fontFamily: 'Chakra Petch', fontSize: 9, color: '#94a3b8', maxWidth: 180, marginTop: 6, lineHeight: 1.3 }}>{field.effect}</div>
        {player && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, fontFamily: 'Share Tech Mono' }}>
            <span style={{ fontSize: 32, color: '#d4af37', textShadow: '0 0 12px #d4af3777', lineHeight: 1 }}>{player.va}</span>
            <span style={{ fontSize: 14, color: '#475569' }}>vs</span>
            <span style={{ fontSize: 32, color: '#dc2626', textShadow: '0 0 12px #dc262677', lineHeight: 1 }}>?</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySlot({ army, mystery }) {
  return (
    <div style={{
      width: 170, height: 240,
      border: `1.5px dashed ${army.color}`,
      background: 'rgba(5,6,8,0.5)',
      display: 'grid', placeItems: 'center',
      boxShadow: `inset 0 0 24px ${army.color}22, 0 0 18px ${army.color}33`,
    }}>
      <img src={army.glyph} alt="" style={{ width: 80, height: 80, opacity: mystery ? 0.4 : 0.6, filter: `drop-shadow(0 0 12px ${army.color})` }}/>
    </div>
  );
}

Object.assign(window, { DuelV1_Tattico, DuelV2_Cinematic, DuelV3_Aurora });
