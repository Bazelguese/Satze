import { Fragment, useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { MENU_ACCENTS } from "../../theme/hudOratorioPalette";
import AnimatedSatzeLogo from "../brand/AnimatedSatzeLogo";
import { MenuAgentRain } from "./MenuAgentRain";
import { CARD_RUNES } from "../ui/RuneTitle.jsx";
import { isMenuFollowUpPicker } from "../../utils/devDialogueDuelMenu";
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from "../../settings/displaySettings";
import { getVfxQualityProfile, resolveVfxQualityProfile } from "../../settings/vfxQualityProfile";
import { useUiScale } from "../../hooks/useUiScale";
import { playSound, playUiClick } from "../../audio/soundBus";
import { UI_SOUND } from "../../audio/soundCatalog";

/**
 * @param {{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }} c
 */
function normalizeChoiceOption(c) {
  const nested = c.choices?.map((child) => normalizeChoiceOption(child)) ?? null;
  return {
    label: c.label,
    sub: c.sub ?? "",
    meta: c.meta ?? "",
    onClick: c.onClick,
    disabled: c.disabled,
    choices: nested?.length ? nested : null,
  };
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** Prima voce abilitata a partire da `from` nella direzione `dir` (con wrap). */
function stepEnabled(rows, from, dir) {
  const n = rows.length;
  for (let k = 1; k <= n; k += 1) {
    const i = (from + dir * k + n * k) % n;
    if (!rows[i].disabled) return i;
  }
  return from;
}

function firstEnabled(rows) {
  const i = rows.findIndex((r) => !r.disabled);
  return i < 0 ? 0 : i;
}

function sublineOf(row) {
  return [row.sub, row.meta].filter(Boolean).join(" · ");
}

function Rune({ index, className = "" }) {
  return (
    <svg className={`smp-rune ${className}`} viewBox="-4 -4 8 8" aria-hidden="true">
      <path d={CARD_RUNES[Math.abs(index) % CARD_RUNES.length]} />
    </svg>
  );
}

/** Pseudo-casuale deterministico: lo schizzo ha sempre la stessa forma. */
function rnd(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Schizzo di vernice: macchia irregolare con punte e colature (viewBox 300×180). */
function splashPath(seed) {
  const pts = [];
  const n = 22;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const spike = i % 4 === 1 ? 1.25 + rnd(seed + i) * 0.35 : 0.72 + rnd(seed + i * 3) * 0.24;
    pts.push([150 + Math.cos(a) * 128 * spike, 90 + Math.sin(a) * 58 * spike]);
  }
  return `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}

const SPLASH = splashPath(11);

const STAR_CLIP =
  "polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)";

/** Filtri SVG per i bordi a pennellata (fascia, targa e schizzo). */
function BrushFilters() {
  return (
    <svg className="smp-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="smp-brush" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.09" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="smp-splash" x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Barra in basso (ispirazione Metaphor / Persona 3 Portable, con pennellate
 * alla Dishonored): una lama crema taglia lo schermo in diagonale; sopra,
 * il nome della voce scelta in grande nel carattere del logo, col
 * sottotitolo; sotto, una fascia a pennellata con le voci separate da rune.
 * La voce scelta sale su una targa dipinta con uno schizzo di colore dietro.
 */
function BarMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const current = rows[active];
  const sub = current ? sublineOf(current) : "";
  const headSize = current ? Math.min(132, Math.floor(1560 / (current.label.length * 0.8))) : 132;
  return (
    <nav className={`mb ${rows.length > 7 ? "mb--dense" : ""}`} aria-label="Menu principale">
      <div className="mb-slash" aria-hidden="true" />
      {current && (
        <div className="mb-head" key={`h-${active}`} aria-hidden="true" style={{ "--c": current.accent }}>
          <span className="mb-head-word" style={{ fontSize: headSize }}>
            {current.label}
          </span>
          {sub && <span className="mb-head-sub">{sub}</span>}
        </div>
      )}
      <div className="mb-band" aria-hidden="true" />
      <div className="mb-items">
        {rows.map((row, i) => {
          const on = i === active;
          return (
            <Fragment key={`${row.label}-${i}`}>
              {i > 0 && <Rune index={i * 3} className="mb-sep" />}
              <button
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                type="button"
                className={`mb-item ${on ? "on" : ""}`}
                style={{ "--c": row.accent, "--d": `${0.25 + i * 0.05}s` }}
                disabled={row.disabled}
                aria-current={on ? "true" : undefined}
                onMouseEnter={() => onHover(i)}
                onFocus={() => onHover(i)}
                onClick={() => onPick(i)}
              >
                {on && (
                  <svg className="mb-splash" key={`s-${active}`} viewBox="0 0 300 180" aria-hidden="true">
                    <path d={SPLASH} />
                    <circle cx="28" cy="40" r="7" />
                    <circle cx="278" cy="132" r="9" />
                    <circle cx="262" cy="30" r="4" />
                  </svg>
                )}
                <span className="mb-plate" aria-hidden="true" />
                <span className="mb-label">
                  {row.label}
                  {row.hasChoices && <span className="mb-more" aria-hidden="true">+</span>}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}

/** Pannello delle sotto-scelte (es. Strumenti dev). */
function ChoicePanel({ picker, rows, active, depth, buttonRefs, listRef, onHover, onPick, onBack, onDismiss }) {
  return (
    <div className="mp-backdrop" role="presentation" onClick={onDismiss}>
      <div
        className="mp"
        key={`${picker.trail.join("/")}/${picker.title}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="satze-choice-picker-title"
        style={{ "--accent": picker.accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mp-in">
          <div className="mp-eyebrow">
            <span className="sec">SCEGLI</span>
            {picker.trail.length ? <span className="trail">{picker.trail.join(" › ")}</span> : null}
          </div>
          <h2 id="satze-choice-picker-title" className="mp-title">
            {picker.title}
          </h2>
          <div className="mp-list" ref={listRef}>
            {rows.map((row, i) => {
              const on = i === active;
              const sub = sublineOf(row);
              return (
                <button
                  key={`${row.label}-${i}`}
                  ref={(el) => {
                    buttonRefs.current[i] = el;
                  }}
                  type="button"
                  className={`mp-row ${on ? "on" : ""}`}
                  disabled={row.disabled}
                  aria-current={on ? "true" : undefined}
                  onMouseEnter={() => onHover(i)}
                  onFocus={() => onHover(i)}
                  onClick={() => onPick(i)}
                >
                  <span className="mp-row-label">{row.label}</span>
                  {sub && <span className="mp-row-sub">{sub}</span>}
                  {row.hasChoices && <span className="mp-row-more">+</span>}
                </button>
              );
            })}
          </div>
          <button type="button" className="mp-back" onClick={onBack}>
            <span className="key">ESC</span>
            <span className="lbl">{depth > 1 ? "INDIETRO" : "ANNULLA"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Menu principale — barra in basso. Logo animato e pioggia di carte sullo
 * sfondo; voce scelta con frecce (in entrambe le direzioni), rotella o
 * passaggio del mouse; Invio/Spazio o clic aprono; le sotto-scelte
 * (`choices`) si aprono in un pannello, Esc torna indietro.
 * `inputLocked` sospende i comandi quando sopra il menu c'è un altro overlay.
 *
 * @param {{ menuItems: Array<{
 *   label: string,
 *   onClick?: () => void,
 *   sub?: string,
 *   meta?: string,
 *   accent?: string,
 *   disabled?: boolean,
 *   choices?: Array<{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }>,
 *   children?: Array<{ label: string, onClick?: () => void, sub?: string, meta?: string, disabled?: boolean, choices?: Array<unknown> }>,
 * }>, buildLabel?: string, inputLocked?: boolean }} props
 */
export default function SatzeMenuPrototype({ menuItems, buildLabel, inputLocked = false }) {
  /** @type {Array<{ accent: string, title: string, trail: string[], options: ReturnType<typeof normalizeChoiceOption>[] }>} */
  const [choicePickerStack, setChoicePickerStack] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [pickerIndex, setPickerIndex] = useState(0);
  const [vfxProfile, setVfxProfile] = useState(() => getVfxQualityProfile());
  const uiScale = useUiScale();
  const rootRef = useRef(null);
  const rowRefs = useRef([]);
  const pickerRowRefs = useRef([]);
  const pickerListRef = useRef(null);
  /** Scorre il pannello solo dopo un passo da tastiera, non al passaggio del mouse. */
  const keyNavRef = useRef(false);

  const choicePicker = choicePickerStack[choicePickerStack.length - 1] ?? null;

  useEffect(() => {
    const on = () => setVfxProfile(resolveVfxQualityProfile(getDisplaySettings()));
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);

  const accentCycle = useMemo(
    () => [MENU_ACCENTS.pink, MENU_ACCENTS.magenta, "#a78bfa", "#d946ef", "#8b5cf6", "#f472b6"],
    [],
  );

  const items = useMemo(() => {
    return menuItems.map((item, i) => {
      const raw = item.choices ?? item.children;
      const options = raw?.map((c) => normalizeChoiceOption(c)) ?? null;
      return {
        id: `menu-${i}`,
        label: item.label,
        sub: item.sub ?? "",
        meta: item.meta ?? "",
        accent: item.accent ?? accentCycle[i % accentCycle.length],
        disabled: item.disabled,
        hasChoices: Boolean(options?.length),
        options,
        leafOnClick: item.onClick,
      };
    });
  }, [menuItems, accentCycle]);

  const pickerRows = useMemo(
    () =>
      (choicePicker?.options ?? []).map((opt) => ({
        ...opt,
        accent: choicePicker.accent,
        hasChoices: Boolean(opt.choices?.length),
      })),
    [choicePicker],
  );

  const mainActive = activeIndex ?? firstEnabled(items);

  const openPicker = (picker) => {
    setChoicePickerStack((s) => [...s, picker]);
    setPickerIndex(firstEnabled(picker.options));
  };
  const closeAllPickers = () => setChoicePickerStack([]);
  const closeTopPicker = () => {
    setChoicePickerStack((s) => s.slice(0, -1));
    setPickerIndex(0);
  };

  const selectMain = (i) => {
    if (i === mainActive || items[i]?.disabled) return;
    playSound(UI_SOUND.NAVIGATE);
    setActiveIndex(i);
  };
  const selectPicker = (i) => {
    if (i === pickerIndex || pickerRows[i]?.disabled) return;
    playSound(UI_SOUND.NAVIGATE);
    setPickerIndex(i);
  };

  const activateMain = (i) => {
    const item = items[i];
    if (!item || item.disabled) return;
    playUiClick();
    if (item.hasChoices) {
      openPicker({ accent: item.accent, title: item.label, trail: [], options: item.options });
      return;
    }
    item.leafOnClick?.();
  };

  const activatePicker = (i) => {
    const opt = choicePicker?.options[i];
    if (!opt || opt.disabled) return;
    playUiClick();
    if (opt.choices?.length) {
      openPicker({
        accent: choicePicker.accent,
        title: opt.label,
        trail: [...choicePicker.trail, choicePicker.title],
        options: opt.choices,
      });
      return;
    }
    const followUp = opt.onClick?.();
    if (isMenuFollowUpPicker(followUp)) {
      setChoicePickerStack([]);
      openPicker({
        accent: followUp.accent ?? choicePicker.accent,
        title: followUp.title ?? opt.label,
        trail: [],
        options: followUp.options.map((c) => normalizeChoiceOption(c)),
      });
      return;
    }
    closeAllPickers();
  };

  const backFromPicker = () => {
    playUiClick();
    if (choicePickerStack.length > 1) closeTopPicker();
    else closeAllPickers();
  };

  // Focus sulla voce scelta: così Invio su un bottone apre sempre quella evidenziata.
  useLayoutEffect(() => {
    if (choicePicker) {
      pickerRowRefs.current[pickerIndex]?.focus({ preventScroll: true });
      const list = pickerListRef.current;
      const row = pickerRowRefs.current[pickerIndex];
      if (list && row && keyNavRef.current) {
        const pad = 30;
        if (row.offsetTop - pad < list.scrollTop) list.scrollTo({ top: Math.max(0, row.offsetTop - pad) });
        else if (row.offsetTop + row.offsetHeight + pad > list.scrollTop + list.clientHeight) {
          list.scrollTo({ top: row.offsetTop + row.offsetHeight + pad - list.clientHeight });
        }
      }
    } else if (activeIndex != null) {
      rowRefs.current[activeIndex]?.focus({ preventScroll: true });
    }
    keyNavRef.current = false;
  }, [choicePicker, pickerIndex, activeIndex]);

  const keyRef = useRef({});
  keyRef.current = {
    inputLocked,
    choicePicker,
    pickerRows,
    pickerIndex,
    items,
    mainActive,
    selectMain,
    selectPicker,
    activateMain,
    activatePicker,
    backFromPicker,
  };

  /** Un passo avanti o indietro (tastiera e rotella); legge lo stato da keyRef. */
  const stepRef = useRef(null);
  stepRef.current = (dir) => {
    const k = keyRef.current;
    const rows = k.choicePicker ? k.pickerRows : k.items;
    if (!rows.length) return;
    keyNavRef.current = true;
    const next = stepEnabled(rows, k.choicePicker ? k.pickerIndex : k.mainActive, dir);
    if (k.choicePicker) k.selectPicker(next);
    else k.selectMain(next);
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = keyRef.current;
      if (k.inputLocked || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
        case "ArrowDown":
        case "ArrowRight": {
          e.preventDefault();
          stepRef.current(e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1);
          break;
        }
        case "Enter":
        case " ": {
          // Su un bottone ci pensa il click nativo (il focus segue la voce scelta).
          if (e.target?.tagName === "BUTTON") return;
          e.preventDefault();
          if (k.choicePicker) k.activatePicker(k.pickerIndex);
          else k.activateMain(k.mainActive);
          break;
        }
        case "Escape": {
          if (!k.choicePicker) return;
          e.preventDefault();
          k.backFromPicker();
          break;
        }
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rotella: un passo ogni ~60px di scorrimento (nel pannello scorre la lista).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    let acc = 0;
    const onWheel = (e) => {
      const k = keyRef.current;
      if (k.inputLocked || k.choicePicker) return;
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) < 60) return;
      stepRef.current(acc > 0 ? 1 : -1);
      acc = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const buildTag = `${(buildLabel ?? "v0.1 ALPHA · NON DISTRIBUIRE").replace(/[\s·]+$/, "")} · BUILD ${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".")}`;

  const hints = [
    { keys: ["←", "→"], label: "VOCE" },
    { keys: ["INVIO"], label: "SCEGLI" },
    ...(choicePicker ? [{ keys: ["ESC"], label: choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA" }] : []),
  ];

  const activeAccent = items[mainActive]?.accent ?? MENU_ACCENTS.magenta;

  return (
    <div
      ref={rootRef}
      className="satze-menu-v5-root smp"
      style={{
        zoom: uiScale,
        overflow: uiScale > 1 ? "auto" : "hidden",
        "--accent": MENU_ACCENTS.magenta,
        "--active": activeAccent,
        "--halftone": vfxProfile.quality === "low" ? 0.12 : 0.26,
      }}
    >
      <BrushFilters />
      <div className="smp-bg" aria-hidden="true">
        <div className="smp-bg-glow" />
        <MenuAgentRain />
        <div className="smp-bg-halftone" />
      </div>

      <div className="smp-brand">
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={inputLocked || Boolean(choicePicker)}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          style={{ width: 820, maxWidth: "100%", pointerEvents: "none" }}
        />
      </div>

      <BarMenu
        rows={items}
        active={mainActive}
        buttonRefs={rowRefs}
        onHover={(i) => !choicePicker && selectMain(i)}
        onPick={(i) => {
          selectMain(i);
          activateMain(i);
        }}
      />

      {choicePicker && (
        <ChoicePanel
          picker={choicePicker}
          rows={pickerRows}
          active={pickerIndex}
          depth={choicePickerStack.length}
          buttonRefs={pickerRowRefs}
          listRef={pickerListRef}
          onHover={selectPicker}
          onPick={(i) => {
            setPickerIndex(i);
            activatePicker(i);
          }}
          onBack={backFromPicker}
          onDismiss={closeAllPickers}
        />
      )}

      <footer className="smp-hints">
        <span className="smp-build">{buildTag}</span>
        <span className="smp-hints-keys">
          {hints.map((h) => (
            <span key={h.label} className="smp-hint">
              {h.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
              <span className="lbl">{h.label}</span>
            </span>
          ))}
        </span>
      </footer>

      <div className="smp-intro" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SatzeMenuStyles />
    </div>
  );
}

function SatzeMenuStyles() {
  const V = MENU_ACCENTS.void;
  const T = MENU_ACCENTS.text;
  return (
    <style>{`
      .smp {
        position: relative; width: 100%; height: 100%; min-height: 100%;
        isolation: isolate; background: ${V}; color: ${T};
        font-family: 'Chakra Petch', system-ui, sans-serif;
      }
      .smp * { box-sizing: border-box; }
      .smp-defs { position: absolute; width: 0; height: 0; }
      .smp kbd {
        display: inline-grid; place-items: center; min-width: 26px; height: 24px; padding: 0 6px;
        background: ${T}; color: ${V}; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; line-height: 1;
        clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
      }
      .smp-rune { width: 1em; height: 1em; flex: none; overflow: visible; }
      .smp-rune path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .smp button { font-family: 'Chakra Petch', sans-serif; }

      /* ---------- Fondo ---------- */
      .smp-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
      .smp-bg-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 34%, #2a0a3a 0%, #14051f 40%, ${V} 80%); }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--active) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
      }
      .smp-brand {
        position: absolute; left: 960px; top: 330px; z-index: 10; width: 920px;
        display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%) rotate(-3deg); pointer-events: none;
      }

      /* ---------- Barra ---------- */
      .mb { position: absolute; inset: 0; z-index: 12; pointer-events: none; }

      /* lama crema che taglia lo schermo, passa dietro il titolo */
      .mb-slash {
        position: absolute; left: -80px; right: -80px; top: 790px; height: 16px;
        background: ${T}; transform: rotate(-3deg); transform-origin: left center;
        box-shadow: 0 9px 0 -4px var(--active);
        filter: url(#smp-brush);
        animation: mb-slash-in .6s .1s cubic-bezier(.2,1,.3,1) both;
        transition: box-shadow .3s;
      }
      @keyframes mb-slash-in { from { transform: rotate(-3deg) scaleX(0); } }

      /* nome della voce scelta, in grande */
      .mb-head {
        position: absolute; left: 96px; top: 640px; z-index: 2;
        display: flex; flex-direction: column; align-items: flex-start;
        transform: rotate(-3deg); transform-origin: left center;
      }
      .mb-head-word {
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase; line-height: 0.9;
        letter-spacing: -0.02em; white-space: nowrap; color: ${T};
        text-shadow: 6px 6px 0 var(--c), 11px 11px 0 #000;
        animation: mb-head-in .42s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes mb-head-in {
        from { clip-path: inset(0 100% 0 0); transform: translateX(-60px) skewX(-12deg); }
        to { clip-path: inset(-20% -10% -20% -2%); transform: none; }
      }
      .mb-head-sub {
        margin: 12px 0 0 10px; background: var(--c); color: ${V};
        font-family: 'Share Tech Mono', monospace; font-size: 16px; letter-spacing: 0.26em; white-space: nowrap;
        padding: 5px 16px; clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        animation: mb-sub-in .32s .14s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes mb-sub-in { from { opacity: 0; transform: translateX(-30px); } }

      /* fascia a pennellata con le voci */
      .mb-band {
        position: absolute; left: -60px; right: -60px; top: 898px; height: 92px;
        background: ${V}; transform: rotate(-1.4deg);
        box-shadow: 0 -4px 0 var(--active);
        filter: url(#smp-brush);
        transition: box-shadow .3s;
        animation: mb-band-in .55s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes mb-band-in { from { transform: rotate(-1.4deg) translateY(160px); } }
      .mb-items {
        position: absolute; left: 0; right: 0; top: 898px; height: 92px;
        display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 60px;
        transform: rotate(-1.4deg);
      }
      .mb-sep { color: color-mix(in srgb, var(--active) 70%, transparent); font-size: 14px; }
      .mb-item {
        position: relative; height: 92px; padding: 0 20px; border: 0; background: transparent; cursor: pointer; pointer-events: auto;
        color: ${T}; outline: none; animation: mb-item-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes mb-item-in { from { opacity: 0; transform: translateY(40px); } }
      .mb-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .mb-label {
        position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 10px;
        font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 30px; letter-spacing: 0.02em; white-space: nowrap;
        text-shadow: 3px 3px 0 #000; opacity: 0.86;
        transition: transform .25s cubic-bezier(.3,1.6,.5,1), color .15s, opacity .15s;
      }
      .mb--dense .mb-label { font-size: 23px; }
      .mb--dense .mb-item { padding: 0 10px; }
      .mb--dense .mb-items { gap: 4px; padding: 0 70px; }
      .mb-item:not(.on):not(:disabled):hover .mb-label { color: var(--c); opacity: 1; }
      .mb-plate {
        position: absolute; left: 0; right: 0; top: 10px; bottom: 10px; z-index: 1;
        background: ${T}; filter: url(#smp-brush);
        transform: translateY(26px) scaleY(0); transform-origin: bottom;
        transition: transform .28s cubic-bezier(.2,1.4,.4,1);
      }
      .mb-item.on .mb-plate { transform: translateY(-20px) rotate(-2deg) scaleY(1); }
      .mb-item.on .mb-label { color: ${V}; text-shadow: none; opacity: 1; transform: translateY(-20px) rotate(-2deg); }
      .mb-splash {
        position: absolute; z-index: 0; left: 50%; top: 50%; width: calc(100% + 200px); height: 200px;
        transform: translate(-50%, -64%) rotate(-6deg); overflow: visible; filter: url(#smp-splash);
        animation: mb-splat .38s cubic-bezier(.2,1.6,.4,1) both;
      }
      .mb-splash path, .mb-splash circle { fill: var(--c); }
      @keyframes mb-splat {
        from { opacity: 0; transform: translate(-50%, -64%) rotate(-30deg) scale(0.2); }
        60% { opacity: 1; }
      }
      .mb-more {
        display: grid; place-items: center; width: 24px; height: 24px; font-style: normal; font-size: 18px;
        background: var(--c); color: ${V}; clip-path: ${STAR_CLIP};
      }
      .mb-item.on .mb-more { background: ${V}; color: var(--c); }

      /* ========== Pannello sotto-scelte ========== */
      .mp-backdrop {
        position: absolute; inset: 0; z-index: 100;
        display: flex; align-items: center; justify-content: center; padding: 60px 24px 80px;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px, rgba(5,5,7,0.86);
        animation: mp-fade .2s ease-out both;
      }
      @keyframes mp-fade { from { opacity: 0; } }
      .mp { position: relative; width: 760px; max-height: 100%; display: flex; flex-direction: column; filter: drop-shadow(14px 14px 0 var(--accent)); transform: rotate(-1.5deg); animation: mp-in .32s cubic-bezier(.2,1.2,.4,1) both; }
      @keyframes mp-in { from { opacity: 0; transform: rotate(-1.5deg) translateX(90px) skewX(-8deg); } }
      .mp-in {
        flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 26px 30px 22px 34px;
        background: ${V}; border-left: 8px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
      }
      .mp-eyebrow { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .mp-eyebrow .sec { background: var(--accent); color: ${V}; font-weight: 700; font-size: 13px; letter-spacing: 0.24em; padding: 3px 12px; transform: skewX(-14deg); }
      .mp-eyebrow .trail { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.2em; color: rgba(245,243,235,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mp-title {
        margin: 6px 0 14px; font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 46px; line-height: 0.95; color: ${T};
        text-shadow: 4px 4px 0 var(--accent), 7px 7px 0 #000; transform: rotate(-2deg); transform-origin: left center;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .mp-list { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 4px 8px 12px 4px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--accent) 60%, transparent) transparent; }
      .mp-row {
        position: relative; display: flex; align-items: baseline; gap: 14px; width: 100%; margin: 0 0 6px; padding: 10px 18px;
        border: 0; background: #121216; color: ${T}; cursor: pointer; text-align: left; outline: none;
        clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
        transition: transform .18s cubic-bezier(.3,1.5,.5,1), background .12s;
      }
      .mp-row:disabled { cursor: not-allowed; opacity: 0.4; }
      .mp-row-label { font-weight: 700; font-style: italic; font-size: 22px; text-transform: uppercase; white-space: nowrap; }
      .mp-row-sub { flex: 1; min-width: 0; font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.16em; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mp-row-more { flex: none; display: grid; place-items: center; width: 24px; height: 24px; font-size: 18px; background: var(--accent); color: ${V}; clip-path: ${STAR_CLIP}; align-self: center; }
      .mp-row.on { background: ${T}; color: ${V}; transform: translateX(14px) rotate(-1deg); }
      .mp-row.on .mp-row-sub { opacity: 0.8; }
      .mp-row.on .mp-row-more { background: ${V}; color: var(--accent); }
      .mp-back {
        align-self: flex-start; margin-top: 14px; display: inline-flex; align-items: center; gap: 12px;
        background: ${T}; color: ${V}; border: 0; cursor: pointer; padding: 8px 22px 8px 12px; transform: skewX(-14deg);
        box-shadow: 5px 5px 0 var(--accent); transition: transform .15s, box-shadow .15s;
      }
      .mp-back > * { transform: skewX(14deg); }
      .mp-back:hover, .mp-back:focus-visible { outline: none; transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--accent); }
      .mp-back .key { background: ${V}; color: ${T}; font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .mp-back .lbl { font-weight: 700; font-style: italic; font-size: 18px; letter-spacing: 0.1em; }

      /* ---------- Barra comandi ---------- */
      .smp-hints {
        position: absolute; left: 0; right: 0; bottom: 0; height: 58px; z-index: 18;
        display: flex; align-items: center; justify-content: space-between; gap: 26px; padding: 0 48px;
        background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.6) 70%, transparent);
      }
      .smp-build { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.28em; color: rgba(245,243,235,0.55); white-space: nowrap; }
      .smp-hints-keys { display: inline-flex; align-items: center; gap: 26px; }
      .smp-hint { display: inline-flex; align-items: center; gap: 5px; }
      .smp-hint .lbl { margin-left: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.16em; font-style: italic; }

      /* ---------- Intro: tre lame diagonali ---------- */
      .smp-intro { position: absolute; inset: 0; z-index: 200; pointer-events: none; overflow: hidden; }
      .smp-intro > span { position: absolute; top: -30%; bottom: -30%; width: 46%; transform: skewX(-18deg); animation: smp-blade .62s cubic-bezier(.7,0,.3,1) forwards; }
      .smp-intro > span:nth-child(1) { left: -8%; background: var(--accent); }
      .smp-intro > span:nth-child(2) { left: 30%; background: #050507; animation-delay: .05s; }
      .smp-intro > span:nth-child(3) { left: 68%; background: ${T}; animation-delay: .1s; }
      @keyframes smp-blade { to { transform: skewX(-18deg) translateX(260%); } }

      @media (prefers-reduced-motion: reduce) {
        .smp *, .smp *::before, .smp *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .smp-intro { display: none; }
      }
    `}</style>
  );
}
