/**
 * EventModal + EventChoice — modale evento della Campagna Atto I.
 * Conversione React di `campaign-event/EventModal.dc.html` e `EventChoice.dc.html` (pacchetto 2).
 * In React `choices` è un array di oggetti; `effects` di ogni scelta è un array
 * `[{ text, kind: 'pos'|'neg'|'hidden'|'perm', tip }]` (le stringhe codificate restano supportate).
 */

import React from 'react';

const KINDS = {
  incontro: { label: 'Incontro', col: '#a78bfa' },
  dilemma: { label: 'Dilemma', col: '#e6c778' },
  minaccia: { label: 'Minaccia', col: '#c2473f' },
  faglia: { label: 'Anomalia', col: '#e256c9' },
  alleanza: { label: 'Alleanza', col: '#58d9dc' },
};

const TAG_STYLES = {
  neg: { bg: 'rgba(194,71,63,.12)', border: '1px solid #7a2b28', col: '#e88f88', glyph: '▼' },
  pos: { bg: 'rgba(74,158,120,.12)', border: '1px solid #3a6b54', col: '#6fce9f', glyph: '▲' },
  hidden: { bg: 'rgba(167,139,250,.1)', border: '1px dashed #6d5aa8', col: '#a78bfa', glyph: '?' },
  perm: { bg: 'rgba(201,162,62,.1)', border: '1px solid #8a6a2a', col: '#e6c778', glyph: '∞' },
};

function parseEffects(effects) {
  if (Array.isArray(effects)) {
    return effects.map((e) => ({ text: e.text, kind: e.kind || 'pos', tip: e.tip || e.text }));
  }
  return (effects || '').split(';').map((s) => s.trim()).filter(Boolean).map((row) => {
    const [text, kind, tip] = row.split('|').map((x) => (x || '').trim());
    return { text, kind: kind || 'pos', tip: tip || text };
  });
}

function parseChoices(choices, onChoose) {
  const letters = ['A', 'B', 'C', 'D'];
  if (Array.isArray(choices)) {
    return choices.map((c, i) => ({
      letter: c.letter || letters[i] || '•',
      ...c,
      onPick: c.onPick || (onChoose ? () => onChoose(i) : null),
    }));
  }
  return (choices || '').split(';;').map((s) => s.trim()).filter(Boolean).map((row, i) => {
    const f = row.split('|').map((x) => (x || '').trim());
    return {
      letter: letters[i] || '•', label: f[0] || '', description: f[1] || '', cost: f[2] || '',
      effects: f[3] || '', state: f[4] || 'available', irreversible: f[5] === '1', reason: f[6] || '',
      affordable: f[7] !== '0',
      onPick: onChoose ? () => onChoose(i) : null,
    };
  });
}

export function EventChoice(props) {
  const state = props.state || 'available';
  const disabled = state === 'disabled';
  const selected = state === 'selected';
  const irreversible = !!props.irreversible;
  const accent = disabled ? '#5a5750' : irreversible ? '#c2473f' : selected ? '#f5f3ec' : '#58d9dc';
  const tags = parseEffects(props.effects);
  const footText = disabled
    ? props.reason || 'Requisiti non soddisfatti'
    : irreversible ? "Scelta irreversibile — cambia l'Atto in modo permanente" : '';
  const onPick = disabled ? undefined : props.onPick;

  return (
    <div
      tabIndex={0} role="button" className="ca1-hover-soft"
      onClick={onPick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          if (props.onPick) props.onPick();
        }
      }}
      title={`${props.label || ''}${props.cost ? ` — costo ${props.cost}` : ''}${footText ? `\n${footText}` : ''}`}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, width: '100%', boxSizing: 'border-box',
        padding: '13px 15px', textAlign: 'left', fontFamily: 'var(--font-ui)',
        background: selected ? 'rgba(245,243,236,.07)' : disabled ? 'rgba(245,243,236,.015)' : 'rgba(245,243,236,.03)',
        border: `1.5px solid ${selected ? '#f5f3ec' : disabled ? '#2a2a30' : '#3a3a42'}`,
        borderLeft: `3px solid ${accent}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background .16s,border-color .16s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent, paddingTop: 2, flex: 'none' }}>{props.letter || 'A'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '.01em', color: disabled ? '#6d6b64' : '#ece9e2', lineHeight: 1.25 }}>{props.label || ''}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', lineHeight: 1.45, marginTop: 3 }}>{props.description || ''}</div>
        </div>
        {!!props.cost && (
          <span style={{ flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, color: props.affordable === false ? '#c2473f' : '#e6c778', border: `1px solid ${props.affordable === false ? '#c2473f' : '#e6c778'}`, padding: '2px 7px', whiteSpace: 'nowrap' }}>{props.cost}</span>
        )}
      </div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map((t, i) => {
            const st = TAG_STYLES[t.kind] || TAG_STYLES.pos;
            return (
              <span key={i} title={t.tip} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: st.bg, border: st.border, fontFamily: 'var(--font-mono)', fontSize: 10, color: st.col }}>
                {st.glyph} {t.text}
              </span>
            );
          })}
        </div>
      )}
      {!!footText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, color: irreversible && !disabled ? '#d76b64' : '#9a988f', borderTop: '1px solid rgba(245,243,236,.08)', paddingTop: 7 }}>
          <span>{disabled ? '⛒' : '⚠'}</span>
          {footText}
        </div>
      )}
    </div>
  );
}

export default function EventModal(props) {
  const kind = props.kind || 'incontro';
  const k = KINDS[kind] || KINDS.incontro;
  const choices = parseChoices(props.choices, props.onChoose);
  const showFooter = !!props.footNote || !!props.dismissLabel;

  return (
    <div
      role="dialog" aria-modal="true" className="ca1-anim"
      style={{
        width: 600, boxSizing: 'border-box', fontFamily: 'var(--font-ui)', position: 'relative',
        background: `linear-gradient(176deg,#17141c,#0a0810 72%),radial-gradient(ellipse 70% 50% at 15% 0%,${k.col}26,transparent 70%)`,
        border: `1.5px solid ${k.col}`,
        boxShadow: `0 0 34px ${k.col}4d,inset 0 0 60px rgba(0,0,0,.55),0 20px 60px rgba(0,0,0,.7)`,
        clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,162,62,.5),transparent)' }} />
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.22em', textTransform: 'uppercase', color: k.col }}>{k.label} · Giorno {props.day ?? 7}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg3)' }}>{props.place || ''}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, letterSpacing: '.02em', color: 'var(--fg1)', marginTop: 8, lineHeight: 1.1, textShadow: '0 2px 10px #000' }}>{props.title || ''}</div>
      </div>

      <div style={{ display: 'flex', gap: 18, padding: '16px 24px 0' }}>
        {(props.speaker || props.speakerRole) && (
          <div style={{ width: 108, flex: 'none' }}>
            <div style={{ height: 132, backgroundImage: 'repeating-linear-gradient(135deg,#1d1a26,#1d1a26 8px,#16131d 8px,#16131d 16px)', border: `1.5px solid ${k.col}`, display: 'grid', placeItems: 'center', position: 'relative' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '.1em', color: 'var(--fg3)', textAlign: 'center', padding: '0 6px' }}>ritratto</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: 'var(--fg1)', marginTop: 7, lineHeight: 1.2 }}>{props.speaker || ''}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', color: k.col, textTransform: 'uppercase', marginTop: 1 }}>{props.speakerRole || ''}</div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--fg1)', lineHeight: 1.62 }}>{props.body || ''}</div>
          {!!props.quote && (
            <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${k.col}`, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--fg2)', lineHeight: 1.5 }}>{props.quote}</div>
          )}
        </div>
      </div>

      <div style={{ padding: '18px 24px 22px' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg2)', marginBottom: 9 }}>Scelte</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {choices.map((c, i) => <EventChoice key={i} {...c} />)}
        </div>
        {showFooter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--accent-slate)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg3)' }}>{props.footNote || ''}</span>
            {!!props.onDismiss && (
              <button
                type="button" onClick={props.onDismiss}
                style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg2)', background: 'transparent', border: '1.5px solid var(--accent-slate)', padding: '8px 14px', cursor: 'pointer' }}
              >
                {props.dismissLabel || 'Allontanati'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
