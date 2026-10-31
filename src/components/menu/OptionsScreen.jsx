// ============================================================
// OptionsScreen — Opzioni in stile Persona
// ============================================================
// Categorie inclinate a sinistra (ognuna col suo colore), a destra solo le
// voci della categoria attiva, in basso la spiegazione della voce in fuoco
// e le azioni della categoria. Stesse impostazioni e stesso salvataggio di
// prima (displaySettings / audioPreferences).
//
// Tastiera: Q/E categoria · ↑/↓ voce · ←/→ cambia valore · Esc menu.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DISPLAY_MODES,
  RESOLUTION_PRESETS,
  UI_SCALE_PRESETS,
  CURSOR_SIZE_PRESETS,
  CURSOR_TRAIL_LENGTH_PRESETS,
  CURSOR_TRAIL_DURATION_PRESETS,
  VFX_QUALITY_LEVELS,
  DUEL_LAYOUT_BREATH_LEVELS,
  FPS_CAP_PRESETS,
  SCREEN_TRANSITION_MS_PRESETS,
  applyElectronDisplay,
  getDisplaySettings,
  hasElectronDisplayApi,
  resetDisplaySettings,
  setDisplaySettings,
} from '../../settings/displaySettings';
import {
  AUDIO_SETTINGS_CHANGED_EVENT,
  getAudioSettings,
  resetAudioSettings,
  setAudioSettings,
} from '../../audio/audioPreferences';
import { playCinematic, playUiClick, unlockAudio } from '../../audio/soundBus';

const MODE_LABELS = {
  windowed: 'Finestra',
  fullscreen: 'Schermo intero',
  borderless: 'Borderless',
};

const QUALITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
};

const BREATH_LABELS = {
  off: 'Off',
  soft: 'Soft',
  strong: 'Forte',
};

const TRAIL_LENGTH_LABELS = {
  5: 'Corta',
  10: 'Media',
  16: 'Lunga',
};

const TRAIL_DURATION_LABELS = {
  200: 'Rapida',
  400: 'Media',
  700: 'Lunga',
};

const FPS_CAP_LABELS = {
  0: 'Illimitato',
  30: '30',
  60: '60',
  120: '120',
};

const TRANSITION_LABELS = {
  1450: '1,45 s',
  1800: '1,8 s',
  2150: '2,15 s',
};

const ON_OFF = [
  { value: false, label: 'Off' },
  { value: true, label: 'On' },
];

const CATEGORIES = [
  { id: 'screen', label: 'SCHERMO', sub: 'Modalità · risoluzione · FPS', accent: '#38bdf8', glyph: '▣' },
  { id: 'graphics', label: 'GRAFICA', sub: 'Effetti · transizioni · foil', accent: '#ec4899', glyph: '✦' },
  { id: 'interface', label: 'INTERFACCIA', sub: 'Scala · cursore · scia', accent: '#fbbf24', glyph: '◈' },
  { id: 'audio', label: 'AUDIO', sub: 'Effetti sonori · volume', accent: '#a78bfa', glyph: '♪' },
];

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function OptionsScreen({ onClose }) {
  const [settings, setSettings] = useState(() => getDisplaySettings());
  const [audio, setAudio] = useState(() => getAudioSettings());
  const [status, setStatus] = useState(/** @type {null | { tone: 'ok'|'warn'|'err', text: string }} */ (null));
  const [applying, setApplying] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [rowIndex, setRowIndex] = useState(0);
  const electronReady = hasElectronDisplayApi();

  const resolutionLocked = settings.displayMode !== 'windowed';

  useEffect(() => {
    const onAudio = () => setAudio(getAudioSettings());
    window.addEventListener(AUDIO_SETTINGS_CHANGED_EVENT, onAudio);
    return () => window.removeEventListener(AUDIO_SETTINGS_CHANGED_EVENT, onAudio);
  }, []);

  const dirtyDisplay = useMemo(() => {
    const saved = getDisplaySettings();
    return (
      settings.displayMode !== saved.displayMode ||
      settings.resolutionPreset !== saved.resolutionPreset
    );
  }, [settings.displayMode, settings.resolutionPreset]);

  const persistPresentation = useCallback((partial) => {
    const next = setDisplaySettings(partial);
    setSettings(next);
    setStatus({ tone: 'ok', text: 'Impostazioni presentazione aggiornate.' });
  }, []);

  const persistAudio = useCallback((partial) => {
    unlockAudio();
    const next = setAudioSettings(partial);
    setAudio(next);
    setStatus({ tone: 'ok', text: 'Impostazioni audio aggiornate.' });
  }, []);

  const handleMode = (displayMode) => {
    setSettings((s) => ({ ...s, displayMode }));
    setStatus(null);
  };

  const handleResolution = (resolutionPreset) => {
    setSettings((s) => ({ ...s, resolutionPreset }));
    setStatus(null);
  };

  const handleApplyDisplay = async () => {
    setApplying(true);
    setStatus(null);
    const next = setDisplaySettings({
      displayMode: settings.displayMode,
      resolutionPreset: settings.resolutionPreset,
    });
    setSettings(next);
    const result = await applyElectronDisplay(next);
    setApplying(false);
    if (!result.ok) {
      setStatus({ tone: 'err', text: result.error || 'Applicazione display fallita.' });
      return;
    }
    if (result.warning) {
      setStatus({ tone: 'warn', text: result.warning });
      return;
    }
    setStatus({ tone: 'ok', text: 'Display applicato.' });
  };

  const handleReset = async () => {
    if (!window.confirm('Ripristinare le impostazioni video predefinite?')) return;
    const next = resetDisplaySettings();
    setSettings(next);
    const result = await applyElectronDisplay(next);
    if (!result.ok) {
      setStatus({
        tone: 'warn',
        text: 'Default ripristinati in locale. Display Electron non applicato.',
      });
      return;
    }
    setStatus({ tone: 'ok', text: 'Impostazioni ripristinate.' });
  };

  const handleResetAudio = () => {
    const next = resetAudioSettings();
    setAudio(next);
    setStatus({ tone: 'ok', text: 'Audio ripristinato.' });
  };

  const handleTestSfx = () => {
    unlockAudio();
    playUiClick({ force: true });
    window.setTimeout(() => playCinematic('LINK_AGENT', 'launch', { force: true }), 80);
    window.setTimeout(() => playCinematic('LINK_AGENT', 'impact', { force: true }), 220);
  };

  useEffect(() => {
    // Sync eventuali valori display salvati dal main process (solo Electron)
    let cancelled = false;
    (async () => {
      if (!window.electronAPI?.display?.getSaved) return;
      try {
        const saved = await window.electronAPI.display.getSaved();
        if (cancelled || !saved) return;
        setSettings((s) => ({
          ...s,
          displayMode: saved.displayMode || s.displayMode,
          resolutionPreset: saved.resolutionPreset || s.resolutionPreset,
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Voci per categoria (un solo modello per mouse e tastiera) ----------
  const reduceMotionLock = settings.reduceMotion ? 'Disattivato da «Riduci animazioni».' : null;

  const rowsByCategory = {
    screen: [
      {
        key: 'displayMode',
        label: 'Modalità schermo',
        hint: 'Finestra, schermo intero o borderless. Si applica con «Applica display».',
        type: 'choice',
        value: settings.displayMode,
        options: DISPLAY_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] })),
        onPick: handleMode,
        tag: settings.displayMode !== getDisplaySettings().displayMode ? 'DA APPLICARE' : null,
      },
      {
        key: 'resolutionPreset',
        label: 'Risoluzione',
        hint: resolutionLocked
          ? 'Disponibile solo in modalità Finestra.'
          : 'Dimensione della finestra. Si applica con «Applica display».',
        type: 'stepper',
        value: settings.resolutionPreset,
        options: RESOLUTION_PRESETS.map((p) => ({ value: p.key, label: p.label })),
        onPick: handleResolution,
        disabled: resolutionLocked,
        tag: settings.resolutionPreset !== getDisplaySettings().resolutionPreset ? 'DA APPLICARE' : null,
      },
      {
        key: 'fpsCap',
        label: 'Cap frame rate',
        hint: 'Limita gli aggiornamenti JS (animazioni, VFX, cursore).',
        type: 'choice',
        value: settings.fpsCap,
        options: FPS_CAP_PRESETS.map((n) => ({ value: n, label: FPS_CAP_LABELS[n] })),
        onPick: (n) => persistPresentation({ fpsCap: n }),
      },
    ],
    graphics: [
      {
        key: 'vfxQuality',
        label: 'Qualità effetti',
        hint: 'Particelle, overdrive, clash, zoom, cosmo del duello. Bassa spegne anche sfocature di sfondo e rotazioni decorative: scegli Media o Bassa se gli FPS calano.',
        type: 'choice',
        value: settings.vfxQuality,
        options: VFX_QUALITY_LEVELS.map((q) => ({ value: q, label: QUALITY_LABELS[q] })),
        onPick: (q) => persistPresentation({ vfxQuality: q }),
      },
      {
        key: 'reduceMotion',
        label: 'Riduci animazioni',
        hint: 'Forza il profilo effetti Basso e spegne respiro del layout e scia del cursore.',
        type: 'choice',
        value: settings.reduceMotion,
        options: ON_OFF,
        onPick: (v) => persistPresentation({ reduceMotion: v }),
      },
      {
        key: 'duelLayoutBreath',
        label: 'Respiro layout duello',
        hint: reduceMotionLock || 'Oscillazione leggera di colonne, mani e pannello campo.',
        type: 'choice',
        value: settings.duelLayoutBreath,
        options: DUEL_LAYOUT_BREATH_LEVELS.map((l) => ({ value: l, label: BREATH_LABELS[l] })),
        onPick: (l) => persistPresentation({ duelLayoutBreath: l }),
        disabled: settings.reduceMotion,
      },
      {
        key: 'screenTransitionMs',
        label: 'Durata transizioni',
        hint: 'Quanto dura la cortina tra il menù e le altre schermate.',
        type: 'choice',
        value: settings.screenTransitionMs,
        options: SCREEN_TRANSITION_MS_PRESETS.map((n) => ({ value: n, label: TRANSITION_LABELS[n] })),
        onPick: (n) => persistPresentation({ screenTransitionMs: n }),
      },
      {
        key: 'eminenceFoil',
        label: 'Eminenze foil',
        hint: 'Lamina olografica sulle tue Eminenze in partita.',
        type: 'choice',
        value: settings.eminenceFoil,
        options: ON_OFF,
        onPick: (v) => persistPresentation({ eminenceFoil: v }),
      },
    ],
    interface: [
      {
        key: 'uiScale',
        label: 'Scala interfaccia',
        hint: 'Densità dei menù (testi e controlli). Il frame resta intero; scroll se serve.',
        type: 'choice',
        value: settings.uiScale,
        options: UI_SCALE_PRESETS.map((n) => ({ value: n, label: `${n}%` })),
        onPick: (n) => persistPresentation({ uiScale: n }),
      },
      {
        key: 'cursorSize',
        label: 'Scala cursore',
        hint: 'Dimensione del puntatore personalizzato.',
        type: 'choice',
        value: settings.cursorSize,
        options: CURSOR_SIZE_PRESETS.map((n) => ({ value: n, label: `${n}%` })),
        onPick: (n) => persistPresentation({ cursorSize: n }),
      },
      {
        key: 'cursorTrailLength',
        label: 'Lunghezza scia',
        hint: settings.reduceMotion ? 'Disattivata da «Riduci animazioni».' : 'Quanti segmenti lascia dietro il cursore.',
        type: 'choice',
        value: settings.cursorTrailLength,
        options: CURSOR_TRAIL_LENGTH_PRESETS.map((n) => ({ value: n, label: TRAIL_LENGTH_LABELS[n] })),
        onPick: (n) => persistPresentation({ cursorTrailLength: n }),
        disabled: settings.reduceMotion,
      },
      {
        key: 'cursorTrailDuration',
        label: 'Durata scia',
        hint: settings.reduceMotion ? 'Disattivata da «Riduci animazioni».' : 'Quanto resta visibile a cursore fermo.',
        type: 'choice',
        value: settings.cursorTrailDuration,
        options: CURSOR_TRAIL_DURATION_PRESETS.map((n) => ({ value: n, label: TRAIL_DURATION_LABELS[n] })),
        onPick: (n) => persistPresentation({ cursorTrailDuration: n }),
        disabled: settings.reduceMotion,
      },
    ],
    audio: [
      {
        key: 'muted',
        label: 'Effetti sonori',
        hint: 'Silenzia gli effetti (non la musica, quando arriverà).',
        type: 'choice',
        value: audio.muted,
        options: [
          { value: false, label: 'Attivi' },
          { value: true, label: 'Muti' },
        ],
        onPick: (v) => {
          playUiClick();
          persistAudio({ muted: v });
        },
      },
      {
        key: 'sfxVolume',
        label: 'Volume SFX',
        hint: audio.muted ? 'Gli effetti sono muti: riattivali per regolare il volume.' : 'Volume degli effetti sonori.',
        type: 'slider',
        value: Math.round(audio.sfxVolume * 100),
        onPick: (n) => persistAudio({ sfxVolume: n / 100 }),
        disabled: audio.muted,
      },
    ],
  };

  const category = CATEGORIES[catIndex];
  const rows = rowsByCategory[category.id];
  const focusRow = rows[Math.min(rowIndex, rows.length - 1)];

  const changeCategory = useCallback((i) => {
    setCatIndex((prev) => {
      const next = (i + CATEGORIES.length) % CATEGORIES.length;
      if (next !== prev) playUiClick();
      return next;
    });
    setRowIndex(0);
  }, []);

  /** ←/→ sulla voce in fuoco. */
  const stepRow = (row, delta) => {
    if (!row || row.disabled) return;
    if (row.type === 'slider') {
      row.onPick(Math.max(0, Math.min(100, row.value + delta * 5)));
      return;
    }
    const i = row.options.findIndex((o) => o.value === row.value);
    const next = row.options[Math.max(0, Math.min(row.options.length - 1, i + delta))];
    if (next && next.value !== row.value) {
      if (row.key !== 'muted') playUiClick();
      row.onPick(next.value);
    }
  };

  const keyStateRef = useRef({});
  keyStateRef.current = { rows, focusRow, catIndex, stepRow, changeCategory, onClose };

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      const k = keyStateRef.current;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === 'Escape') { e.preventDefault(); k.onClose?.(); return; }
      if (key === 'q') { e.preventDefault(); k.changeCategory(k.catIndex - 1); return; }
      if (key === 'e') { e.preventDefault(); k.changeCategory(k.catIndex + 1); return; }
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        const d = key === 'ArrowUp' ? -1 : 1;
        setRowIndex((i) => (Math.min(i, k.rows.length - 1) + d + k.rows.length) % k.rows.length);
        return;
      }
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
        k.stepRow(k.focusRow, key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const statusColor =
    status?.tone === 'err' ? '#fb7185' : status?.tone === 'warn' ? '#fbbf24' : '#4ade80';

  return (
    <div className="ops" style={{ '--accent': category.accent }}>
      <div className="ops-bg" aria-hidden="true">
        <div className="ops-bg-slab" />
        <div className="ops-bg-edge" />
        <div className="ops-bg-halftone" />
        <div className="ops-bg-stripes" />
      </div>
      <div className="ops-watermark" aria-hidden="true">OPZIONI</div>

      <button type="button" className="ops-back" onClick={onClose}>
        <span className="key">ESC</span><span className="lbl">MENU</span>
      </button>

      <div className="ops-title">
        <div className="ops-eyebrow"><span>SISTEMA</span></div>
        <h1>OPZIONI</h1>
      </div>

      <nav className="ops-cats" aria-label="Categorie">
        <div className="ops-cats-keys"><kbd>Q</kbd><kbd>E</kbd><span>CATEGORIA</span></div>
        {CATEGORIES.map((c, i) => {
          const on = i === catIndex;
          return (
            <button
              key={c.id}
              type="button"
              className={`ops-cat ${on ? 'on' : ''}`}
              style={{ '--c': c.accent, '--zz': `${[0, 22, 8, 30][i]}px` }}
              onClick={() => changeCategory(i)}
              aria-pressed={on}
            >
              <span className="ops-cat-shadow" aria-hidden="true" />
              <span className="ops-cat-plate">
                <span className="ops-cat-cursor" aria-hidden="true" />
                <span className="ops-cat-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ops-cat-glyph" aria-hidden="true">{c.glyph}</span>
                <span className="ops-cat-text">
                  <span className="ops-cat-label">{c.label}</span>
                  <span className="ops-cat-sub">{c.sub}</span>
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="ops-panel" key={category.id} aria-label={category.label}>
        <header className="ops-panel-head">
          <span className="ops-panel-glyph" aria-hidden="true">{category.glyph}</span>
          <h2>{category.label}</h2>
          <span className="ops-panel-sub">{category.sub}</span>
        </header>

        <div className="ops-rows">
          {rows.map((row, i) => (
            <OptionRow
              key={row.key}
              row={row}
              index={i}
              focused={i === Math.min(rowIndex, rows.length - 1)}
              onFocus={() => setRowIndex(i)}
            />
          ))}
        </div>

        {category.id === 'screen' && !electronReady && (
          <p className="ops-note">
            Client web: qualità, scala, cap FPS e riduci animazioni funzionano. Modalità schermo e
            risoluzione richiedono l&apos;exe Electron.
          </p>
        )}

        <div className="ops-actions">
          {category.id === 'screen' && (
            <button
              type="button"
              className={`ops-btn ops-btn--main${dirtyDisplay ? ' is-dirty' : ''}`}
              disabled={applying || !electronReady}
              onClick={handleApplyDisplay}
            >
              <span>{applying ? 'APPLICO…' : 'APPLICA DISPLAY'}</span>
            </button>
          )}
          {category.id === 'audio' ? (
            <>
              <button type="button" className="ops-btn ops-btn--main" onClick={handleTestSfx}>
                <span>PROVA SFX</span>
              </button>
              <button type="button" className="ops-btn" onClick={handleResetAudio}>
                <span>DEFAULT AUDIO</span>
              </button>
            </>
          ) : (
            <button type="button" className="ops-btn" onClick={handleReset} title="Schermo, grafica e interfaccia">
              <span>RIPRISTINA VIDEO</span>
            </button>
          )}
        </div>
      </section>

      <footer className="ops-help">
        <div className="ops-help-text" key={`${category.id}-${focusRow?.key}`}>
          <span className="ops-help-label">{focusRow?.label}</span>
          <span className="ops-help-hint">{focusRow?.hint}</span>
        </div>
        {status && (
          <div className="ops-status" style={{ '--s': statusColor }}>{status.text}</div>
        )}
        <div className="ops-help-keys">
          <span><kbd>↑</kbd><kbd>↓</kbd>VOCE</span>
          <span><kbd>←</kbd><kbd>→</kbd>VALORE</span>
          <span><kbd>ESC</kbd>MENU</span>
        </div>
      </footer>

      <OptionsStyles />
    </div>
  );
}

function OptionRow({ row, index, focused, onFocus }) {
  return (
    <div
      className={`ops-row${focused ? ' focus' : ''}${row.disabled ? ' dis' : ''}`}
      style={{ '--zz': `${index % 2 ? 10 : 0}px` }}
      onMouseEnter={onFocus}
      onFocusCapture={onFocus}
    >
      <div className="ops-row-label">
        <span>{row.label}</span>
        {row.tag && <em className="ops-row-tag">{row.tag}</em>}
        {row.disabled && <em className="ops-row-tag ops-row-tag--lock">BLOCCATO</em>}
      </div>
      <div className="ops-row-control">
        {row.type === 'choice' && <ChoiceControl row={row} />}
        {row.type === 'stepper' && <StepperControl row={row} />}
        {row.type === 'slider' && <SliderControl row={row} />}
      </div>
    </div>
  );
}

function ChoiceControl({ row }) {
  return (
    <div className="ops-choice" role="radiogroup" aria-label={row.label}>
      {row.options.map((o) => {
        const on = o.value === row.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={row.disabled}
            className={`ops-chip${on ? ' on' : ''}`}
            onClick={() => { if (!on) { if (row.key !== 'muted') playUiClick(); row.onPick(o.value); } }}
          >
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StepperControl({ row }) {
  const i = Math.max(0, row.options.findIndex((o) => o.value === row.value));
  const pick = (d) => {
    const next = row.options[Math.max(0, Math.min(row.options.length - 1, i + d))];
    if (next && next.value !== row.value) {
      playUiClick();
      row.onPick(next.value);
    }
  };
  return (
    <div className="ops-stepper">
      <button type="button" className="ops-step" disabled={row.disabled || i === 0} onClick={() => pick(-1)} aria-label="Precedente">‹</button>
      <div className="ops-step-val">
        <span className="v">{row.options[i]?.label}</span>
        <span className="dots" aria-hidden="true">
          {row.options.map((o, j) => <i key={String(o.value)} className={j === i ? 'on' : ''} />)}
        </span>
      </div>
      <button type="button" className="ops-step" disabled={row.disabled || i === row.options.length - 1} onClick={() => pick(1)} aria-label="Successiva">›</button>
    </div>
  );
}

const SLIDER_TICKS = 20;

function SliderControl({ row }) {
  const barRef = useRef(null);
  const dragging = useRef(false);

  const valueAt = (clientX) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return row.value;
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round((t * 100) / 5) * 5;
  };

  const onDown = (e) => {
    if (row.disabled) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    row.onPick(valueAt(e.clientX));
  };
  const onMove = (e) => {
    if (!dragging.current || row.disabled) return;
    const v = valueAt(e.clientX);
    if (v !== row.value) row.onPick(v);
  };
  const onUp = () => { dragging.current = false; };

  const filled = Math.round((row.value / 100) * SLIDER_TICKS);
  return (
    <div className="ops-slider">
      <div
        ref={barRef}
        className="ops-slider-bar"
        role="slider"
        aria-label={row.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={row.value}
        aria-disabled={row.disabled || undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {Array.from({ length: SLIDER_TICKS }, (_, i) => (
          <span key={i} className={i < filled ? 'on' : ''} />
        ))}
      </div>
      <div className="ops-slider-num">{row.value}<small>%</small></div>
    </div>
  );
}

function OptionsStyles() {
  return (
    <style>{`
      .ops {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --plate-hi: #1c1c23;
        --dim: rgba(245,243,235,0.6);
        position: absolute; inset: 0; overflow: hidden; isolation: isolate; z-index: 2;
        background: var(--void); color: var(--ink);
        font-family: 'Chakra Petch', sans-serif;
      }
      .ops * { box-sizing: border-box; }
      .ops kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 5px;
        background: var(--ink); color: var(--void); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }

      /* Fondo */
      .ops-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .ops-bg-slab {
        position: absolute; top: -20%; bottom: -20%; left: -10%; width: 44%;
        background: linear-gradient(170deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, color-mix(in srgb, var(--accent) 35%, #000) 100%);
        transform: skewX(-13deg);
        transition: background .35s;
      }
      .ops-bg-edge {
        position: absolute; top: -20%; bottom: -20%; left: 33.2%; width: 14px;
        background: var(--ink); transform: skewX(-13deg);
      }
      .ops-bg-halftone {
        position: absolute; inset: 0; opacity: 0.4;
        background-image: radial-gradient(circle, var(--void) 1.5px, transparent 2px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(100deg, #000 0%, transparent 34%);
        mask-image: linear-gradient(100deg, #000 0%, transparent 34%);
      }
      .ops-bg-stripes {
        position: absolute; inset: 0; opacity: 0.05;
        background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px);
      }
      .ops-watermark {
        position: absolute; right: -30px; bottom: -60px; z-index: 1;
        font-weight: 700; font-style: italic; font-size: 280px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--accent) 28%, transparent);
        transform: rotate(-7deg); pointer-events: none; user-select: none; white-space: nowrap;
      }

      /* Indietro + titolo */
      .ops-back {
        position: absolute; top: 26px; left: 40px; z-index: 20;
        display: inline-flex; align-items: center; gap: 12px;
        border: 0; cursor: pointer; background: var(--void); color: var(--ink);
        padding: 10px 26px 10px 14px; transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 5px 5px 0 var(--ink);
        transition: transform .15s, box-shadow .15s;
      }
      .ops-back > * { transform: skewX(14deg); }
      .ops-back:hover, .ops-back:focus-visible { transform: skewX(-14deg) rotate(-2deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink); }
      .ops-back .key { background: var(--ink); color: var(--void); font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .ops-back .lbl { font-weight: 700; font-style: italic; font-size: 22px; letter-spacing: 0.08em; }

      .ops-title { position: absolute; top: 96px; left: 70px; z-index: 12; transform: rotate(-5deg); transform-origin: left top; }
      .ops-eyebrow span {
        display: inline-block; background: var(--void); color: var(--ink);
        font-weight: 700; font-size: 15px; letter-spacing: 0.3em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .ops-title h1 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 120px; line-height: 0.9; letter-spacing: -0.02em;
        color: var(--ink); text-shadow: 7px 7px 0 var(--void);
      }

      /* Categorie */
      .ops-cats { position: absolute; top: 330px; left: 54px; width: 560px; z-index: 12; display: flex; flex-direction: column; gap: 14px; }
      .ops-cats-keys { display: flex; align-items: center; gap: 5px; margin: 0 0 6px 14px; font-weight: 700; font-size: 13px; letter-spacing: 0.18em; }
      .ops-cats-keys span { margin-left: 6px; color: var(--ink); text-shadow: 2px 2px 0 var(--void); }
      .ops-cat {
        position: relative; display: block; width: 100%; height: 92px; padding: 0; border: 0; background: transparent;
        cursor: pointer; text-align: left; color: inherit; font-family: inherit;
        transform: translateX(var(--zz)); transition: transform .2s cubic-bezier(.3,1.5,.5,1);
      }
      .ops-cat-shadow, .ops-cat-plate { position: absolute; inset: 0; clip-path: polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%); }
      .ops-cat-shadow { background: var(--c); opacity: 0; transition: transform .2s, opacity .15s; }
      .ops-cat-plate {
        display: flex; align-items: center; gap: 16px; padding: 0 34px 0 30px;
        background: var(--void); color: var(--ink);
        transition: background .15s, color .15s;
      }
      .ops-cat-plate::before {
        content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 6px;
        background: var(--c); transform: skewX(-12deg);
      }
      .ops-cat-cursor {
        position: absolute; left: -46px; top: 50%; width: 36px; height: 40px; margin-top: -20px;
        background: var(--ink); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        filter: drop-shadow(3px 3px 0 var(--void));
        opacity: 0; transition: opacity .15s;
      }
      .ops-cat-num { font-family: 'Share Tech Mono', monospace; font-size: 15px; color: var(--c); width: 24px; }
      .ops-cat-glyph { font-size: 30px; color: var(--c); width: 36px; text-align: center; }
      .ops-cat-text { display: flex; flex-direction: column; line-height: 1; min-width: 0; }
      .ops-cat-label { font-weight: 700; font-style: italic; font-size: 40px; letter-spacing: -0.01em; }
      .ops-cat-sub { margin-top: 6px; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.12em; opacity: 0.6; text-transform: uppercase; }
      .ops-cat:hover { transform: translateX(calc(var(--zz) + 10px)); }
      .ops-cat.on { transform: translateX(calc(var(--zz) + 40px)) rotate(-2deg) scale(1.05); z-index: 2; }
      .ops-cat.on .ops-cat-shadow { opacity: 1; transform: translate(12px, 10px); }
      .ops-cat.on .ops-cat-plate { background: var(--ink); color: var(--void); }
      .ops-cat.on .ops-cat-plate::before { background: var(--void); }
      .ops-cat.on .ops-cat-num { color: var(--void); }
      .ops-cat.on .ops-cat-cursor { opacity: 1; animation: ops-cursor .9s ease-in-out infinite; }
      @keyframes ops-cursor { 50% { transform: translateX(7px); } }

      /* Pannello voci */
      .ops-panel {
        position: absolute; top: 70px; right: 60px; bottom: 120px; width: 1120px; z-index: 10;
        display: flex; flex-direction: column; gap: 10px;
        padding: 34px 48px 30px 64px;
        background: rgba(5,5,7,0.94);
        clip-path: polygon(40px 0, 100% 0, 100% 100%, 0 100%);
        animation: ops-panel-in .32s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes ops-panel-in { from { opacity: 0; transform: translateX(60px); } }
      .ops-panel::before {
        content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 56px;
        background: var(--accent); clip-path: polygon(40px 0, 56px 0, 16px 100%, 0 100%);
      }
      .ops-panel-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px; transform: rotate(-1.5deg); transform-origin: left; }
      .ops-panel-glyph { font-size: 44px; color: var(--accent); }
      .ops-panel-head h2 {
        margin: 0; font-weight: 700; font-style: italic; font-size: 72px; line-height: 1; letter-spacing: -0.01em;
        text-shadow: 5px 5px 0 var(--accent);
      }
      .ops-panel-sub { font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; }

      .ops-rows { display: flex; flex-direction: column; gap: 10px; }
      .ops-row {
        position: relative; display: grid; grid-template-columns: 330px 1fr; align-items: center; gap: 24px;
        min-height: 82px; padding: 12px 22px 12px 30px;
        background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        transform: translateX(var(--zz));
        transition: background .15s, transform .18s cubic-bezier(.3,1.5,.5,1);
      }
      .ops-row::before {
        content: ''; position: absolute; left: 12px; top: 0; bottom: 0; width: 5px;
        background: rgba(245,243,235,0.18); transform: skewX(-12deg); transition: background .15s;
      }
      .ops-row.focus { background: var(--plate-hi); transform: translateX(calc(var(--zz) - 8px)); }
      .ops-row.focus::before { background: var(--accent); }
      .ops-row-label { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
      .ops-row-label > span { font-weight: 700; font-size: 25px; text-transform: uppercase; letter-spacing: 0.02em; }
      .ops-row.focus .ops-row-label > span { font-style: italic; }
      .ops-row-tag {
        font-style: normal; font-weight: 700; font-size: 11px; letter-spacing: 0.18em;
        background: var(--accent); color: var(--void); padding: 2px 8px; transform: skewX(-14deg);
      }
      .ops-row-tag--lock { background: #3a3a44; color: var(--ink); }
      .ops-row.dis .ops-row-control { opacity: 0.38; }
      .ops-row-control { min-width: 0; }

      /* Scelte */
      .ops-choice { display: flex; flex-wrap: wrap; gap: 8px; }
      .ops-chip {
        flex: 1 1 0; min-width: 0; height: 50px; padding: 0 14px;
        border: 0; cursor: pointer; background: var(--void); color: var(--dim);
        font-family: inherit; font-weight: 700; font-size: 18px; letter-spacing: 0.04em; text-transform: uppercase;
        transform: skewX(-14deg);
        box-shadow: inset 0 0 0 2px rgba(245,243,235,0.18);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s;
      }
      .ops-chip > span { display: inline-block; transform: skewX(14deg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .ops-chip:hover:not(:disabled):not(.on), .ops-chip:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .ops-chip.on {
        background: var(--accent); color: var(--void); box-shadow: 5px 5px 0 var(--ink);
        transform: skewX(-14deg) translateY(-3px);
      }
      .ops-chip:disabled { cursor: not-allowed; }

      /* Stepper */
      .ops-stepper { display: flex; align-items: stretch; gap: 8px; height: 50px; }
      .ops-step {
        flex: none; width: 56px; border: 0; cursor: pointer;
        background: var(--ink); color: var(--void);
        font-family: inherit; font-weight: 700; font-size: 30px; line-height: 1;
        transform: skewX(-14deg);
        transition: background .15s, opacity .15s;
      }
      .ops-step:hover:not(:disabled), .ops-step:focus-visible { background: var(--accent); }
      .ops-step:disabled { opacity: 0.25; cursor: default; }
      .ops-step-val {
        flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 0 20px; background: var(--void); box-shadow: inset 0 0 0 2px var(--accent);
        transform: skewX(-14deg);
      }
      .ops-step-val > * { transform: skewX(14deg); }
      .ops-step-val .v { font-weight: 700; font-style: italic; font-size: 22px; white-space: nowrap; }
      .ops-step-val .dots { display: flex; gap: 5px; }
      .ops-step-val .dots i { width: 14px; height: 6px; background: rgba(245,243,235,0.2); transform: skewX(-20deg); }
      .ops-step-val .dots i.on { background: var(--accent); }

      /* Slider */
      .ops-slider { display: flex; align-items: center; gap: 20px; }
      .ops-slider-bar {
        flex: 1; height: 40px; display: grid; grid-template-columns: repeat(${SLIDER_TICKS}, minmax(0, 1fr)); gap: 4px;
        cursor: pointer; touch-action: none;
      }
      .ops-row.dis .ops-slider-bar { cursor: not-allowed; }
      .ops-slider-bar span { background: rgba(245,243,235,0.12); transform: skewX(-18deg); transition: background .12s; }
      .ops-slider-bar span.on { background: var(--accent); }
      .ops-slider-bar span.on:last-of-type, .ops-slider-bar span.on:nth-child(5n) { background: var(--ink); }
      .ops-slider-num { flex: none; width: 2.6em; font-weight: 700; font-style: italic; font-size: 40px; line-height: 1; text-shadow: 3px 3px 0 var(--accent); font-variant-numeric: tabular-nums; }
      .ops-slider-num small { font-size: 0.5em; margin-left: 2px; }

      .ops-note {
        margin: 6px 0 0; padding: 10px 16px; background: rgba(251,191,36,0.12); border-left: 4px solid #fbbf24;
        color: #fde68a; font-size: 15px; line-height: 1.4;
      }

      /* Azioni */
      .ops-actions { margin-top: auto; display: flex; justify-content: flex-end; gap: 14px; }
      .ops-btn {
        border: 0; cursor: pointer; padding: 0 28px; height: 58px;
        background: var(--void); color: var(--ink);
        font-family: inherit; font-weight: 700; font-size: 20px; letter-spacing: 0.08em;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px var(--ink);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s;
      }
      .ops-btn > span { display: inline-block; transform: skewX(14deg); }
      .ops-btn:hover:not(:disabled), .ops-btn:focus-visible { background: var(--ink); color: var(--void); }
      .ops-btn--main { background: var(--accent); color: var(--void); box-shadow: 6px 6px 0 var(--ink); font-style: italic; font-size: 24px; }
      .ops-btn--main:hover:not(:disabled), .ops-btn--main:focus-visible { background: var(--accent); transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 9px 9px 0 var(--ink); }
      .ops-btn--main.is-dirty { animation: ops-dirty 1.4s ease-in-out infinite; }
      @keyframes ops-dirty { 50% { box-shadow: 6px 6px 0 var(--ink), 0 0 30px var(--accent); } }
      .ops-btn:disabled { opacity: 0.35; cursor: not-allowed; animation: none; }

      /* Barra di aiuto */
      .ops-help {
        position: absolute; left: 0; right: 0; bottom: 0; height: 96px; z-index: 14;
        display: flex; align-items: center; gap: 28px; padding: 0 60px 0 70px;
        background: var(--ink); color: var(--void);
        clip-path: polygon(0 26px, 100% 0, 100% 100%, 0 100%);
      }
      .ops-help-text { flex: 1; min-width: 0; display: flex; align-items: center; gap: 18px; padding-top: 18px; animation: ops-help-in .25s ease both; }
      @keyframes ops-help-in { from { opacity: 0; transform: translateY(8px); } }
      .ops-help-label {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 15px; letter-spacing: 0.14em;
        text-transform: uppercase; padding: 4px 14px; transform: skewX(-14deg);
        box-shadow: 4px 4px 0 var(--accent);
      }
      .ops-help-hint { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ops-status {
        flex: none; padding-top: 18px; font-weight: 700; font-size: 15px;
        color: var(--void); border-left: 6px solid var(--s); padding-left: 10px;
      }
      .ops-help-keys { flex: none; display: flex; gap: 20px; padding-top: 18px; font-weight: 700; font-size: 14px; letter-spacing: 0.12em; font-style: italic; }
      .ops-help-keys span { display: inline-flex; align-items: center; gap: 4px; }
      .ops-help-keys kbd { background: var(--void); color: var(--ink); margin-right: 2px; }

      @media (prefers-reduced-motion: reduce) {
        .ops *, .ops *::before, .ops *::after { animation: none !important; transition-duration: 0.001s !important; }
      }
    `}</style>
  );
}

export default OptionsScreen;
