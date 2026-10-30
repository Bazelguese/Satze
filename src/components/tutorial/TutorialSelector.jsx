// ============================================================
// TutorialSelector.jsx — scelta del percorso tutorial (sopra il menù)
// ============================================================
// Menù a comparsa in stile Persona: tre percorsi affiancati.
// Tastiera: ←→ percorso, Invio avvia, Esc chiude.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { playUiClick } from '../../audio/soundBus';

/** Stesso colore della voce TUTORIAL del menù. */
export const TUTORIAL_ACCENT = '#d946ef';

export function TutorialSelector({ isOpen, onClose, onSelect, tracks, wasIntroCompleted }) {
  if (!isOpen) return null;
  return <TutorialSelectorPanel onClose={onClose} onSelect={onSelect} tracks={tracks} wasIntroCompleted={wasIntroCompleted} />;
}

function TutorialSelectorPanel({ onClose, onSelect, tracks, wasIntroCompleted }) {
  const [active, setActive] = useState(0);
  const ref = useRef({});
  ref.current = { active, tracks, onClose, onSelect };

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // il menù sotto non deve sentire questi tasti
      e.stopImmediatePropagation();
      const k = ref.current;
      if (e.key === 'Escape') { e.preventDefault(); playUiClick(); k.onClose(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        playUiClick();
        const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        setActive((a) => (a + d + k.tracks.length) % k.tracks.length);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playUiClick(); k.onSelect(k.tracks[k.active].id); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const cur = tracks[active];

  return (
    <div className="tts" style={{ '--accent': TUTORIAL_ACCENT }} onClick={onClose}>
      <div className="tts-card" role="dialog" aria-modal="true" aria-label="Scegli il percorso tutorial" onClick={(e) => e.stopPropagation()}>
        <div className="tts-sheet">
          <header className="tts-head">
            <span className="tts-eye">GUIDA</span>
            <h2>TUTORIAL</h2>
            <span className="tts-note">PUOI RIPETERLI QUANDO VUOI DAL MENÙ</span>
            <button type="button" className="tts-x" onClick={onClose} aria-label="Chiudi scelta tutorial">
              <kbd>ESC</kbd><span>CHIUDI</span>
            </button>
          </header>

          <div className="tts-tracks">
            {tracks.map((t, i) => {
              const on = i === active;
              const afterIntro = t.id === 'advanced' && !wasIntroCompleted;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`tts-track${on ? ' on' : ''}`}
                  style={{ '--zz': `${[0, 26, 8][i % 3]}px` }}
                  aria-pressed={on}
                  onMouseMove={(e) => { if ((e.movementX || e.movementY) && !on) setActive(i); }}
                  onFocus={() => setActive(i)}
                  onClick={() => { playUiClick(); onSelect(t.id); }}
                >
                  <span className="tts-track-shadow" aria-hidden="true" />
                  <span className="tts-track-plate">
                    <span className="tts-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="tts-kind">TUTORIAL</span>
                    <span className="tts-name">{t.title.replace(/^Tutorial\s+/i, '')}</span>
                    <span className="tts-dur">{t.duration.toUpperCase()}</span>
                    <span className="tts-desc">{t.description}</span>
                    {afterIntro && <span className="tts-after">MEGLIO DOPO L’INTRODUTTIVO</span>}
                    <span className="tts-go">AVVIA →</span>
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="tts-foot">
            <div className="tts-help" key={cur.id}>
              <span className="lbl">{cur.title.toUpperCase()}</span>
              <span className="hint">{cur.description}</span>
            </div>
            <div className="tts-keys">
              <span><kbd>←</kbd><kbd>→</kbd>PERCORSO</span>
              <span><kbd>↵</kbd>AVVIA</span>
            </div>
          </footer>
        </div>
      </div>
      <TutorialSelectorStyles />
    </div>
  );
}

function TutorialSelectorStyles() {
  return (
    <style>{`
      .tts {
        --ink: #f5f3eb; --void: #050507; --plate: #111116;
        position: absolute; inset: 0; z-index: 900; display: grid; place-items: center;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          rgba(5,5,7,0.84);
        font-family: 'Chakra Petch', sans-serif; color: var(--ink);
        animation: tts-fade .2s ease both;
      }
      @keyframes tts-fade { from { opacity: 0; } }
      .tts * { box-sizing: border-box; }
      .tts kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 5px;
        background: var(--ink); color: var(--void); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }
      .tts-card { width: 1500px; transform: rotate(-1.2deg); filter: drop-shadow(16px 16px 0 var(--accent)); animation: tts-in .34s cubic-bezier(.2,1.2,.4,1) both; }
      @keyframes tts-in { from { opacity: 0; transform: rotate(-1.2deg) translateY(60px) skewX(-6deg); } }
      .tts-sheet { position: relative; display: flex; flex-direction: column; background: var(--void); clip-path: polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%); }
      .tts-sheet::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: var(--accent); }

      .tts-head { position: relative; display: flex; align-items: flex-end; gap: 22px; padding: 30px 56px 18px 52px; }
      .tts-eye { position: absolute; left: 50px; top: 18px; background: var(--accent); color: var(--void); font-weight: 700; font-size: 14px; letter-spacing: 0.28em; padding: 3px 14px; transform: skewX(-14deg); }
      .tts-head h2 { margin: 18px 0 0; font-weight: 700; font-style: italic; font-size: 92px; line-height: 0.95; letter-spacing: -0.02em; text-shadow: 6px 6px 0 var(--accent); }
      .tts-note { margin-bottom: 14px; font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.16em; color: rgba(245,243,235,0.55); }
      .tts-x { margin-left: auto; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 10px; border: 0; cursor: pointer; background: transparent; color: var(--ink); font: italic 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.08em; }
      .tts-x:hover span, .tts-x:focus-visible span { color: var(--accent); }

      .tts-tracks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 30px; padding: 16px 80px 40px 60px; }
      .tts-track {
        position: relative; height: 400px; padding: 0; border: 0; background: transparent; cursor: pointer; text-align: left;
        color: inherit; font-family: inherit; transform: translateY(var(--zz)); transition: transform .22s cubic-bezier(.3,1.5,.5,1);
      }
      .tts-track:focus-visible { outline: none; }
      .tts-track-shadow, .tts-track-plate { position: absolute; inset: 0; clip-path: polygon(22px 0, 100% 0, calc(100% - 22px) 100%, 0 100%); }
      .tts-track-shadow { background: var(--accent); opacity: 0; transition: transform .2s, opacity .15s; }
      .tts-track-plate {
        display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 30px 40px 30px 42px;
        background: var(--plate); color: var(--ink); transition: background .15s, color .15s;
      }
      .tts-track-plate::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 8px; background: var(--accent); }
      .tts-num { position: absolute; right: 40px; bottom: 14px; font-weight: 700; font-style: italic; font-size: 92px; line-height: 1; letter-spacing: -0.04em; color: transparent; -webkit-text-stroke: 2px rgba(245,243,235,0.35); }
      .tts-kind { margin-top: 8px; font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.3em; color: var(--accent); }
      .tts-name { max-width: 100%; font-weight: 700; font-style: italic; font-size: 46px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; }
      .tts-dur { margin-top: 6px; background: var(--ink); color: var(--void); font-weight: 700; font-size: 15px; letter-spacing: 0.16em; padding: 3px 12px; transform: skewX(-14deg); }
      .tts-desc { margin-top: 14px; font-weight: 600; font-size: 21px; line-height: 1.35; opacity: 0.85; }
      .tts-after { margin-top: 8px; font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.12em; color: #fbbf24; }
      .tts-go { position: relative; z-index: 1; margin-top: auto; font-weight: 700; font-style: italic; font-size: 24px; letter-spacing: 0.06em; opacity: 0; transform: translateX(-10px); transition: opacity .15s, transform .15s; }

      .tts-track.on { transform: translateY(calc(var(--zz) - 18px)) rotate(-1.5deg) scale(1.04); z-index: 2; }
      .tts-track.on .tts-track-shadow { opacity: 1; transform: translate(12px, 12px); }
      .tts-track.on .tts-track-plate { background: var(--ink); color: var(--void); }
      .tts-track.on .tts-track-plate::before { background: var(--void); }
      .tts-track.on .tts-num { -webkit-text-stroke: 0; color: var(--accent); text-shadow: 4px 4px 0 var(--void); }
      .tts-track.on .tts-kind { color: var(--void); }
      .tts-track.on .tts-dur { background: var(--void); color: var(--ink); }
      .tts-track.on .tts-after { color: #b45309; }
      .tts-track.on .tts-go { opacity: 1; transform: none; }

      .tts-foot { display: flex; align-items: center; gap: 26px; padding: 22px 80px 20px 52px; background: var(--ink); color: var(--void); clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%); }
      .tts-help { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; padding-top: 10px; animation: tts-fade .2s ease both; }
      .tts-help .lbl { flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; letter-spacing: 0.14em; padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent); }
      .tts-help .hint { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tts-keys { display: flex; gap: 18px; padding-top: 10px; font-weight: 700; font-style: italic; font-size: 15px; letter-spacing: 0.1em; }
      .tts-keys span { display: inline-flex; align-items: center; gap: 4px; }
      .tts-keys kbd { background: var(--void); color: var(--ink); margin-right: 2px; }

      @media (prefers-reduced-motion: reduce) {
        .tts, .tts-card, .tts-help { animation: none; }
      }
    `}</style>
  );
}
