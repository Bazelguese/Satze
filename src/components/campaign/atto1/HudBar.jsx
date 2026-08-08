/**
 * HudBar — barra HUD della Campagna Atto I.
 * Conversione React del componente `campaign-hud/HudBar.dc.html` (pacchetto 2).
 * Le variabili CSS calcolate (--hb-*) diventano proprietà dell'oggetto style del root.
 */

import React from 'react';

function pct(n, cap) {
  return cap > 0 ? Math.max(0, Math.min(100, (n / cap) * 100)) : 0;
}

function keyFn(cb) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (cb) cb();
    }
  };
}

/**
 * @param {Array<{short:string,value:number,days?:number,tip?:string}>|string} modifiers
 *   In React si preferisce l'array di oggetti; la stringa "nome,valore,giorni[,tip]; …" resta supportata.
 */
function parseMods(modifiers) {
  if (Array.isArray(modifiers)) {
    return modifiers.map((m) => ({
      short: m.short,
      value: m.value ?? 0,
      days: m.days ?? 0,
      tip: m.tip || `${m.short} ${(m.value ?? 0) >= 0 ? '+' : ''}${m.value ?? 0}`,
    }));
  }
  const out = [];
  const raw = (modifiers || '').trim();
  if (raw) {
    raw.split(';').forEach((seg) => {
      const parts = seg.split(',').map((s) => s.trim());
      if (!parts[0]) return;
      const val = Number(parts[1] || 0);
      out.push({
        short: parts[0],
        value: val,
        days: parts[2] ? Number(parts[2]) : 0,
        tip: parts[3] || `${parts[0]} ${val >= 0 ? '+' : ''}${val}`,
      });
    });
  }
  return out;
}

const SEP = (
  <div style={{ width: 1, background: 'linear-gradient(180deg,transparent,rgba(201,162,62,.28),transparent)' }} />
);

function ModBadge({ m }) {
  const neg = m.neg;
  return (
    <span
      title={m.tip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px',
        background: neg ? 'rgba(194,71,63,.12)' : 'rgba(74,158,120,.12)',
        border: `1px solid ${neg ? '#7a2b28' : '#3a6b54'}`,
        clipPath: 'polygon(0 3px,3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%)',
      }}
    >
      <span style={{ color: neg ? '#d76b64' : '#6fce9f', fontSize: 9 }}>{neg ? '▼' : '▲'}</span>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, color: neg ? '#e6c9c6' : '#cfe6da', letterSpacing: '.02em' }}>{m.short}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: neg ? '#d76b64' : '#6fce9f' }}>{m.valTxt}</span>
      {m.hasDays && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#9a988f' }}>{m.daysTxt}</span>}
    </span>
  );
}

export default function HudBar(props) {
  const compact = !!props.compact;
  const day = props.day ?? 1;
  const maxDays = props.maxDays ?? 14;
  const left = maxDays - day;
  const dayLow = left <= 3;

  // ── Testa di ponte ──
  const bh = props.bridgeheadStatus || 'stable';
  const bhDays = props.daysToBridgeheadAttack ?? 0;
  const BH = {
    stable: { col: '#58d9dc', label: 'Stabile', icon: '◎', sub: 'Ancora salda', anim: 'none', bc: 'transparent', bg: 'transparent', subCol: '#7fb8ba' },
    threatened: { col: '#e7a849', label: 'Minacciata', icon: '⚠', sub: bhDays ? `Attacco fra ${bhDays}g` : 'Sotto pressione', anim: 'hb-threatpulse 1.8s ease-in-out infinite', bc: '#8a6a2a', bg: 'rgba(231,168,73,.08)', subCol: '#e7a849' },
    critical: { col: '#c2473f', label: 'Critica', icon: '⚑', sub: 'La perdita conclude la run', anim: 'hb-critborder 1.3s ease-in-out infinite', bc: '#c2473f', bg: 'rgba(194,71,63,.1)', subCol: '#d76b64' },
  };
  const b = BH[bh] || BH.stable;

  // ── Faglie ──
  const rifts = props.rifts ?? 0;
  const riftsMax = props.riftsMax ?? 2;
  const rState = rifts > 0 ? props.mostCriticalRiftState || 'active' : 'none';
  const rDays = props.mostCriticalRiftDays ?? 0;
  const RS = {
    none: { col: '#5a5750', label: 'Fronte quieto', glow: 'none', anim: 'none' },
    unstable: { col: '#a78bfa', label: 'Instabile', glow: '0 0 8px rgba(167,139,250,.5)', anim: 'none' },
    active: { col: '#c05fb8', label: 'Attiva', glow: '0 0 9px rgba(192,95,184,.55)', anim: 'hb-riftpulse 2s ease-in-out infinite' },
    grave: { col: '#e256c9', label: 'Grave', glow: '0 0 10px rgba(226,86,201,.6)', anim: 'hb-riftpulse 1.7s ease-in-out infinite' },
    critical: { col: '#c2473f', label: 'Critica', glow: '0 0 12px rgba(194,71,63,.65)', anim: 'hb-riftpulse 1.2s ease-in-out infinite' },
  };
  const r = RS[rState] || RS.none;
  const riftSub = rifts > 0 ? r.label + (rDays ? ` · ⏣ ${rDays}g` : '') : 'Nessuna Faglia';

  // ── Contatori ──
  const pvEff = props.pvEff ?? 10; const pvBase = props.pvBase ?? 10; const pvCap = props.pvCap ?? 25;
  const fcEff = props.fcEff ?? 10; const fcBase = props.fcBase ?? 10; const fcCap = props.fcCap ?? 18;
  const pvLow = pvCap > 0 && pvEff / pvCap <= 0.3;
  const fcLow = fcCap > 0 && fcEff / fcCap <= 0.3;
  const pvEP = pct(pvEff, pvCap); const pvBP = pct(pvBase, pvCap);
  const fcEP = pct(fcEff, fcCap); const fcBP = pct(fcBase, fcCap);

  // ── Esercito ──
  const army = props.army ?? 3;
  const armyCap = props.armyCap ?? 6;
  const free = Math.max(0, armyCap - army);

  // ── Modificatori ──
  const mods = parseMods(props.modifiers);
  const modBadges = mods.slice(0, 2).map((m) => ({
    short: m.short, neg: m.value < 0,
    valTxt: (m.value > 0 ? '+' : '') + m.value,
    hasDays: !!m.days, daysTxt: m.days ? `· ${m.days}g` : '',
    tip: m.tip + (m.days ? ` · dura ${m.days} giorni` : ''),
  }));
  const moreN = Math.max(0, mods.length - 2);
  const moreTip = mods.slice(2).map((m) => `${m.short} ${m.value > 0 ? '+' : ''}${m.value}${m.days ? ` (${m.days}g)` : ''}`).join('\n');

  const showBrand = !compact && props.showActTitle !== false;
  const pvCol = pvLow ? '#c2473f' : '#58d9dc';
  const fcCol = fcLow ? '#c2473f' : '#6a8cff';

  return (
    <div
      className="ca1-anim"
      style={{
        display: 'inline-flex', alignItems: 'stretch', gap: compact ? 13 : 20,
        fontFamily: 'var(--font-ui)', position: 'relative', padding: compact ? '8px 16px' : '10px 22px',
        background: 'linear-gradient(178deg,#1a1712,#0c0a08 62%,#080706),radial-gradient(ellipse 60% 120% at 12% 0%,rgba(167,139,250,.08),transparent 70%)',
        border: '1.5px solid #2a2620',
        boxShadow: 'inset 0 1px 0 rgba(201,162,62,.22),inset 0 0 44px rgba(0,0,0,.6),0 6px 26px rgba(0,0,0,.6)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,162,62,.5),transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,162,62,.22),transparent)' }} />
      <div style={{ position: 'absolute', top: 3, left: 3, width: 11, height: 11, border: '1.5px solid #c9a23e', borderRight: 'none', borderBottom: 'none', opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: 3, right: 3, width: 11, height: 11, border: '1.5px solid #c9a23e', borderLeft: 'none', borderBottom: 'none', opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: 3, left: 3, width: 11, height: 11, border: '1.5px solid #c9a23e', borderRight: 'none', borderTop: 'none', opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: 3, right: 3, width: 11, height: 11, border: '1.5px solid #c9a23e', borderLeft: 'none', borderTop: 'none', opacity: 0.8 }} />

      {showBrand && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingRight: 2 }}>
            <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1.5px solid #c9a23e', transform: 'rotate(45deg)', flex: 'none', boxShadow: 'inset 0 0 8px rgba(201,162,62,.3)' }}>
              <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: '#e6c778' }}>S</span>
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.2em', color: '#a78bfa' }}>FIGLI DELL'ORIZZONTE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#d9d3c6', whiteSpace: 'nowrap' }}>Atto I · Ancorare</div>
            </div>
          </div>
          <div style={{ width: 1, background: 'linear-gradient(180deg,transparent,rgba(201,162,62,.35),transparent)' }} />
        </>
      )}

      {/* Giorno */}
      <div
        title={`Giorno ${day} di ${maxDays} — mancano ${left} giorni all'accensione del Faro`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px',
          clipPath: 'polygon(0 5px,5px 0,calc(100% - 5px) 0,100% 5px,100% calc(100% - 5px),calc(100% - 5px) 100%,5px 100%,0 calc(100% - 5px))',
          border: `1.5px solid ${dayLow ? '#c2473f' : '#58d9dc'}`,
          background: dayLow ? 'rgba(194,71,63,.12)' : 'rgba(88,217,220,.06)',
          boxShadow: dayLow ? '0 0 16px rgba(194,71,63,.4)' : 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: compact ? 22 : 28, lineHeight: 1, color: dayLow ? '#e88f88' : '#e6e2d8' }}>
          {day}
          <span style={{ color: 'var(--fg3)', fontSize: '.58em' }}> / {maxDays}</span>
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 7.5, letterSpacing: '.22em', color: dayLow ? '#d76b64' : '#9a988f', textTransform: 'uppercase', marginTop: 2 }}>
          {left > 0 ? `${left} GIORNI` : 'ULTIMO GIORNO'}
        </span>
      </div>

      {SEP}
      {/* Testa di ponte */}
      <div
        tabIndex={0} role="button" className="ca1-hover-soft ca1-focus-cyan"
        onClick={props.onOpenBridgehead} onKeyDown={keyFn(props.onOpenBridgehead)}
        title={`Testa di ponte: ${b.label}${bhDays && bh === 'threatened' ? ` — attacco fra ${bhDays} giorni` : bh === 'critical' ? ' — la sua perdita conclude la run' : ''}\n(clic per aprire il dettaglio)`}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '3px 9px', cursor: 'pointer', border: `1.5px solid ${b.bc}`, background: b.bg, animation: b.anim, borderRadius: 1 }}
      >
        <span style={{ fontSize: 17, lineHeight: 1, color: b.col, textShadow: `0 0 9px ${b.col}`, flex: 'none' }}>{b.icon}</span>
        <div style={{ lineHeight: 1.2, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.16em', color: '#9a988f', textTransform: 'uppercase' }}>Testa di ponte</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '.05em', color: b.col }}>{b.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.02em', color: b.subCol, whiteSpace: 'nowrap' }}>{b.sub}</div>
        </div>
      </div>

      {SEP}
      {/* PV */}
      <div
        tabIndex={0} className="ca1-focus-cyan"
        title={`PV effettivi ${pvEff}\nPV base ${pvBase}\nCap ${pvCap}${pvBase - pvEff ? `\nPenalità ${pvEff - pvBase}` : ''}`}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: 104 }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.16em', color: '#9a988f', textTransform: 'uppercase' }}>PV</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--fg3)' }}>Base {pvBase} · Cap {pvCap}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: compact ? 21 : 26, color: pvCol, textShadow: '0 0 8px rgba(88,217,220,.35)' }}>{pvEff}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.5em', color: 'var(--fg3)' }}>effettivi</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: 5, background: '#201d16', border: '1px solid rgba(201,162,62,.26)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pvBP}%`, background: 'rgba(88,217,220,.24)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pvEP}%`, width: `${Math.max(0, pvBP - pvEP)}%`, background: 'repeating-linear-gradient(45deg,#c2473f,#c2473f 2px,transparent 2px,transparent 4px)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pvEP}%`, background: '#58d9dc', boxShadow: '0 0 6px rgba(88,217,220,.6)' }} />
        </div>
      </div>

      {SEP}
      {/* Focus Coin */}
      <div
        tabIndex={0} className="ca1-focus-blue"
        title={`Focus Coin effettivi ${fcEff}\nFC base ${fcBase}\nCap ${fcCap}${fcBase - fcEff ? `\nPenalità ${fcEff - fcBase}` : ''}`}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: 104 }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.16em', color: '#9a988f', textTransform: 'uppercase' }}>Focus Coin</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--fg3)' }}>Base {fcBase} · Cap {fcCap}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: compact ? 21 : 26, color: fcCol, textShadow: '0 0 8px rgba(106,140,255,.35)' }}>{fcEff}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.5em', color: 'var(--fg3)' }}>effettivi</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: 5, background: '#201d16', border: '1px solid rgba(201,162,62,.26)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fcBP}%`, background: 'rgba(106,140,255,.24)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${fcEP}%`, width: `${Math.max(0, fcBP - fcEP)}%`, background: 'repeating-linear-gradient(45deg,#c2473f,#c2473f 2px,transparent 2px,transparent 4px)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fcEP}%`, background: '#6a8cff', boxShadow: '0 0 6px rgba(106,140,255,.6)' }} />
        </div>
      </div>

      {SEP}
      {/* Esercito */}
      <div
        tabIndex={0} role="button" className="ca1-hover-soft ca1-focus-cyan"
        onClick={props.onOpenArmy} onKeyDown={keyFn(props.onOpenArmy)}
        title={`Esercito: ${army} Agenti su ${armyCap}${free > 0 ? ` — ${free} slot liberi` : ' — al completo'}\n(clic per gestire l'esercito)`}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', cursor: 'pointer', borderRadius: 1 }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, color: '#c9a23e', flex: 'none' }}>⛨</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.16em', color: '#9a988f', textTransform: 'uppercase' }}>Esercito</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#e6e2d8' }}>
            {army}
            <span style={{ color: 'var(--fg3)', fontSize: '.72em' }}> / {armyCap}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: free > 0 ? '#c9a23e' : '#6d6b64', whiteSpace: 'nowrap' }}>
            {free > 0 ? `${free} slot liberi` : 'al completo'}
          </div>
        </div>
      </div>

      {SEP}
      {/* Faglie */}
      <div
        tabIndex={0} role="button" className="ca1-hover-soft ca1-focus-violet"
        onClick={props.onOpenRifts} onKeyDown={keyFn(props.onOpenRifts)}
        title={rifts > 0 ? `Faglie attive: ${rifts} / ${riftsMax}\nPiù grave: ${r.label}${rDays ? ` — Collasso fra ${rDays} giorni` : ''}\n(clic per aprire le Faglie)` : 'Nessuna Faglia aperta — fronte quieto'}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', cursor: 'pointer', borderRadius: 1 }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, color: r.col, textShadow: r.glow, flex: 'none', animation: r.anim, display: 'inline-block' }}>⟁</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.16em', color: '#9a988f', textTransform: 'uppercase' }}>Faglie</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: rifts > 0 ? r.col : '#9a988f' }}>
            {rifts}
            <span style={{ color: 'var(--fg3)', fontSize: '.72em' }}> / {riftsMax}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: rifts > 0 ? r.col : '#6d6b64', whiteSpace: 'nowrap' }}>{riftSub}</div>
        </div>
      </div>

      {modBadges.length > 0 && (
        <>
          {SEP}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 7.5, letterSpacing: '.18em', color: '#9a988f', textTransform: 'uppercase' }}>Modificatori</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {modBadges.map((m, i) => <ModBadge key={i} m={m} />)}
              {moreN > 0 && (
                <span
                  title={moreTip} tabIndex={0} className="ca1-focus-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', background: 'rgba(201,162,62,.1)', border: '1px solid #c9a23e', color: '#e6c778', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'default' }}
                >
                  +{moreN}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
