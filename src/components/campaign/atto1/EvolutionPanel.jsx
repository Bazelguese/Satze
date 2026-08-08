/**
 * EvolutionPanel + EvolutionChoice + ProtagonistStagePreview — evoluzione del Nascente (Atto I).
 * Conversione React di `campaign-evolution/*.dc.html` (pacchetto 2).
 * `choices` è un array di oggetti in React (la stringa ";;" resta supportata).
 */

import React from 'react';

const STAGE_NAMES = ['Stato iniziale', 'Impronta', 'Corpo', 'Funzione', 'Stabilizzazione'];

export function ProtagonistStagePreview(props) {
  const state = props.state || 'locked';
  const isCurrent = state === 'current';
  const done = state === 'done';
  const accent = done ? '#4a9e78' : isCurrent ? '#a78bfa' : state === 'next' ? '#e6c778' : '#5a5750';
  const pot = props.pot ?? 2;
  const dan = props.dan ?? 2;
  const name = props.name || 'Nascente';
  const power = props.power || 'Nessun potere.';

  return (
    <div
      title={`${name} — Stadio ${props.stageNum ?? 1} · L${props.level ?? 2}\nPOT ${pot} · DAN ${dan}\n${power}`}
      style={{
        width: 212, boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
        background: 'linear-gradient(172deg,#17141c,#0a0810 74%)',
        border: `1.5px solid ${accent}`,
        boxShadow: isCurrent ? `0 0 22px ${accent}55` : 'none',
        opacity: state === 'locked' ? 0.55 : 1,
        clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))',
      }}
    >
      <div style={{ position: 'relative', height: 150, backgroundImage: props.imageSrc ? undefined : 'repeating-linear-gradient(135deg,#1e1a28,#1e1a28 8px,#17131f 8px,#17131f 16px)', background: props.imageSrc ? '#0a0810' : undefined, borderBottom: `1.5px solid ${accent}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        {props.imageSrc ? (
          <img src={props.imageSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 40%,${accent}33,transparent 70%)` }} />
            <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', color: 'var(--fg3)' }}>illustrazione</span>
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,transparent 55%,rgba(7,7,7,.55))`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 7, left: 8, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: accent, textShadow: '0 1px 4px #000' }}>Stadio {props.stageNum ?? 1}</div>
        <div style={{ position: 'absolute', top: 6, right: 8, width: 24, height: 24, display: 'grid', placeItems: 'center', background: 'rgba(7,7,7,.8)', border: `1.5px solid ${accent}`, transform: 'rotate(45deg)' }}>
          <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-mono)', fontSize: 11, color: accent }}>L{props.level ?? 2}</span>
        </div>
        {isCurrent && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '3px 0', background: accent, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#070707' }}>Attuale</div>
        )}
      </div>
      <div style={{ padding: '12px 13px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--fg1)', lineHeight: 1.15 }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: accent, marginTop: 2 }}>{props.league || 'Senza Lega'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '5px 0', background: 'rgba(88,217,220,.07)', border: '1px solid rgba(88,217,220,.28)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>POT</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1, color: '#58d9dc' }}>{pot}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '5px 0', background: 'rgba(194,71,63,.07)', border: '1px solid rgba(194,71,63,.28)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>DAN</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1, color: '#d76b64' }}>{dan}</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)', marginBottom: 3 }}>Potere</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg1)', lineHeight: 1.45, minHeight: 32 }}>{power}</div>
        </div>
      </div>
    </div>
  );
}

export function EvolutionChoice(props) {
  const state = props.state || 'available';
  const disabled = state === 'disabled';
  const selected = state === 'selected';
  const accent = disabled ? '#5a5750' : selected ? '#f5f3ec' : props.accent || '#a78bfa';
  const note = disabled ? props.reason || 'Requisiti non soddisfatti' : props.note || '';
  const potFrom = props.potFrom ?? 2; const potTo = props.potTo ?? 3;
  const danFrom = props.danFrom ?? 2; const danTo = props.danTo ?? 2;

  return (
    <div
      tabIndex={0} role="button" className="ca1-hover-soft"
      onClick={disabled ? undefined : props.onPick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          if (props.onPick) props.onPick();
        }
      }}
      title={`${props.label || ''} — ${props.league || ''}\nPOT ${potFrom} → ${potTo} · DAN ${danFrom} → ${danTo}\n${props.power || ''}${note ? `\n${note}` : ''}`}
      style={{
        position: 'relative', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10,
        padding: '14px 16px', fontFamily: 'var(--font-ui)', textAlign: 'left',
        background: selected ? 'rgba(245,243,236,.07)' : disabled ? 'rgba(245,243,236,.015)' : 'rgba(245,243,236,.03)',
        border: `1.5px solid ${selected ? '#f5f3ec' : disabled ? '#2a2a30' : '#3a3a42'}`,
        borderLeft: `3px solid ${accent}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background .16s,border-color .16s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <span style={{ width: 30, height: 30, flex: 'none', display: 'grid', placeItems: 'center', border: `1.5px solid ${accent}`, transform: 'rotate(45deg)' }}>
          <span style={{ transform: 'rotate(-45deg)', fontSize: 14, lineHeight: 1, color: accent }}>{props.glyph || '✶'}</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: disabled ? '#6d6b64' : '#ece9e2', lineHeight: 1.2 }}>{props.label || ''}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: accent, marginTop: 2 }}>{props.league || 'Nessuna Lega'}</div>
        </div>
        {selected && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: accent }}>✓</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)' }}>POT</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg2)' }}>{potFrom}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent }}>→</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: '#58d9dc' }}>{potTo}</span>
        <span style={{ width: 1, height: 14, background: 'var(--accent-slate)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg3)' }}>DAN</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg2)' }}>{danFrom}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent }}>→</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: '#d76b64' }}>{danTo}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)', lineHeight: 1.5 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg2)', marginRight: 7 }}>Potere</span>
        {props.power || 'Nessun potere.'}
      </div>
      {!!note && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 9, borderTop: '1px solid rgba(245,243,236,.08)', fontFamily: 'var(--font-mono)', fontSize: 10, color: disabled ? '#d76b64' : '#e6c778' }}>
          <span>{disabled ? '⛒' : '∞'}</span>
          {note}
        </div>
      )}
    </div>
  );
}

function parseChoices(value, sel, onSelect) {
  const rows = Array.isArray(value)
    ? value
    : (value || '').split(';;').map((s) => s.trim()).filter(Boolean).map((row) => {
      const f = row.split('|').map((x) => (x || '').trim());
      return {
        label: f[0] || '', league: f[1] || '', glyph: f[2] || '✶', accent: f[3] || '#a78bfa',
        potFrom: Number(f[4] || 2), potTo: Number(f[5] || 3), danFrom: Number(f[6] || 2), danTo: Number(f[7] || 2),
        power: f[8] || '', note: f[9] || '', disabled: f[10] === 'disabled', reason: f[11] || '',
      };
    });
  return rows.map((c, i) => ({
    ...c,
    state: c.state || (c.disabled ? 'disabled' : sel === i ? 'selected' : 'available'),
    onPick: c.onPick || (onSelect ? () => onSelect(i) : null),
  }));
}

export default function EvolutionPanel(props) {
  const sel = props.selected ?? -1;
  const choices = parseChoices(props.choices, sel, props.onSelect);
  const cur = props.fromStage ?? 1;
  const track = STAGE_NAMES.map((label, i) => ({
    num: i + 1, label,
    tip: `Stadio ${i + 1} — ${label}${i + 1 === cur ? ' (attuale)' : i + 1 < cur ? ' (completato)' : ''}`,
  }));
  const confirmDisabled = props.requireSelection !== false && sel < 0;

  return (
    <div
      className="ca1-anim"
      style={{
        width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-ui)', position: 'relative',
        background: 'linear-gradient(178deg,#17141d,#0a0810 74%),radial-gradient(ellipse 68% 44% at 50% 0%,rgba(167,139,250,.14),transparent 68%)',
        border: '1.5px solid #a78bfa',
        boxShadow: 'inset 0 0 70px rgba(0,0,0,.6),0 0 30px rgba(167,139,250,.24)',
        padding: '26px 30px 28px',
        clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,.6),transparent)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: '#a78bfa' }}>{props.eyebrow || 'Nascente · Atto I'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 29, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--fg1)', marginTop: 6, textShadow: '0 2px 12px #000' }}>{props.title || 'Evoluzione del Nascente'}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)', marginTop: 7, lineHeight: 1.5, maxWidth: 660, marginLeft: 'auto', marginRight: 'auto' }}>
          {props.subtitle || 'Ogni stadio incide una scelta sul corpo del Nascente. Non si torna indietro.'}
        </div>
      </div>

      {/* Traccia stadi */}
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {track.map((t) => (
          <span key={t.num} title={t.tip} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', border: '1px solid #3a3a42', background: 'rgba(245,243,236,.03)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg3)' }}>{t.num}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10.5, letterSpacing: '.06em', color: 'var(--fg2)' }}>{t.label}</span>
          </span>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 26, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProtagonistStagePreview stageNum={cur} name={props.fromName || 'Nascente'} league={props.fromLeague || 'Senza Lega'} level={props.fromLevel ?? 2} pot={props.fromPot ?? 2} dan={props.fromDan ?? 2} power={props.fromPower || 'Nessun potere.'} state="current" imageSrc={props.fromImageSrc} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: '#a78bfa' }}>→</span>
          <ProtagonistStagePreview stageNum={props.toStage ?? cur + 1} name={props.toName || 'Nascente'} league={props.toLeague || '—'} level={props.toLevel ?? 2} pot={props.toPot ?? 3} dan={props.toDan ?? 2} power={props.toPower || 'Definito dalla scelta.'} state="next" imageSrc={props.toImageSrc} />
        </div>
        <div style={{ flex: 1, minWidth: 330, maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg2)' }}>{props.choicesLabel || "Scegli l'evoluzione"}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--accent-slate)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg3)' }}>{choices.length ? `1 di ${choices.length}` : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {choices.map((c, i) => <EvolutionChoice key={i} {...c} />)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 16, borderTop: '1px solid var(--accent-slate)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: confirmDisabled ? '#d76b64' : '#9a988f' }}>
          {confirmDisabled ? "Seleziona un'evoluzione per continuare." : props.note || 'La scelta è permanente.'}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {!!props.skipLabel && (
            <button
              type="button" onClick={props.onSkip}
              style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg2)', background: 'transparent', border: '1.5px solid var(--accent-slate)', padding: '11px 18px', cursor: 'pointer' }}
            >
              {props.skipLabel}
            </button>
          )}
          <button
            type="button" onClick={props.onConfirm} disabled={confirmDisabled}
            style={{
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase',
              color: '#070707', background: '#a78bfa', border: '1.5px solid #a78bfa', padding: '11px 26px',
              cursor: confirmDisabled ? 'default' : 'pointer', opacity: confirmDisabled ? 0.45 : 1,
              clipPath: 'polygon(0 5px,5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%)',
            }}
          >
            {props.confirmLabel || "Incidi l'evoluzione"}
          </button>
        </div>
      </div>
    </div>
  );
}
