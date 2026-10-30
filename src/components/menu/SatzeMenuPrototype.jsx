import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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
import { armTransitionFrom, useArrivedByCurtain } from "../cosmic/ScreenTransition";

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

/**
 * Schizzo di vernice nuovo per ogni seme (viewBox 300×180): bordo morbido
 * con un numero variabile di punte lunghe in direzioni casuali, gocce
 * sparse attorno, inclinazione e verso diversi.
 */
function makeSplash(seed) {
  const n = 28 + Math.floor(rnd(seed) * 10);
  const spikes = new Set();
  const spikeCount = 2 + Math.floor(rnd(seed + 1) * 4);
  for (let k = 0; k < spikeCount; k += 1) spikes.add(Math.floor(rnd(seed + 10 + k) * n));
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    // corpo largo e basso come una pennellata, punte corte qua e là
    const r = spikes.has(i) ? 1.08 + rnd(seed + 40 + i) * 0.22 : 0.86 + rnd(seed + 80 + i) * 0.14;
    pts.push([150 + Math.cos(a) * 146 * r, 90 + Math.sin(a) * 80 * r]);
  }
  // curve morbide tra i punti medi: bordo da vernice, non da poligono
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  let d = `M ${mid(pts[n - 1], pts[0]).map(f).join(" ")}`;
  for (let i = 0; i < n; i += 1) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  const dropCount = 2 + Math.floor(rnd(seed + 3) * 3);
  const drops = Array.from({ length: dropCount }, (_, k) => {
    const a = rnd(seed + 200 + k) * Math.PI * 2;
    const dist = 1.08 + rnd(seed + 300 + k) * 0.18;
    return { cx: 150 + Math.cos(a) * 150 * dist, cy: 90 + Math.sin(a) * 86 * dist, r: 2 + rnd(seed + 400 + k) * 4 };
  });
  return { d, drops, rot: -5 + rnd(seed + 5) * 8, flip: rnd(seed + 6) > 0.5 ? -1 : 1 };
}

/** Macchia di colore dietro la voce scelta; posizione e misura dalla classe. */
function Splash({ splash, className = "" }) {
  return (
    <svg
      className={`spl ${className}`}
      key={splash.d}
      viewBox="0 0 300 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ "--sr": `${splash.rot.toFixed(1)}deg`, "--sf": splash.flip }}
    >
      <path d={splash.d} />
      {splash.drops.map((dr, k) => (
        <circle key={k} cx={dr.cx.toFixed(1)} cy={dr.cy.toFixed(1)} r={dr.r.toFixed(1)} />
      ))}
    </svg>
  );
}

/** Misura di una scritta in Cinzel maiuscolo perché stia in `maxW` px, al massimo `cap`. */
function fitSize(label, maxW, cap) {
  return Math.min(cap, Math.floor(maxW / (Math.max(1, label.length) * 0.8)));
}

/** Props comuni del bottone di una voce. */
function entryProps(row, i, active, buttonRefs, onHover, onPick) {
  return {
    ref: (el) => {
      buttonRefs.current[i] = el;
    },
    type: "button",
    disabled: row.disabled,
    "aria-current": i === active ? "true" : undefined,
    onMouseEnter: () => onHover(i),
    onFocus: () => onHover(i),
    onClick: () => onPick(i),
  };
}

const STAR_CLIP =
  "polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)";

/** Filtro SVG che rende irregolare il bordo della macchia. */
function BrushFilters() {
  return (
    <svg className="smp-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="smp-splash" x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Parole impilate (impaginazione Metaphor): voci in colonna a destra,
 * grandi e inclinate; la scelta è enorme su una macchia, le vicine medie,
 * le altre piccole. Logo a sinistra.
 */
function StackMenu({ rows, active, buttonRefs, onHover, onPick }) {
  // forma nuova a ogni cambio di voce (anche tornando sulla stessa)
  const splash = useMemo(() => makeSplash(Math.floor(Math.random() * 100000)), [active]);
  return (
    <nav className="mi" aria-label="Menu principale">
      <div className="mi-col">
        {rows.map((row, i) => {
          const d = Math.abs(i - active);
          const on = d === 0;
          const size = on ? fitSize(row.label, 900, 124) : d === 1 ? fitSize(row.label, 640, 62) : fitSize(row.label, 520, 44);
          return (
            <button
              key={`${row.label}-${i}`}
              {...entryProps(row, i, active, buttonRefs, onHover, onPick)}
              className={`mi-item ${on ? "on" : ""}`}
              style={{
                "--c": row.accent,
                "--fs": `${size}px`,
                "--x": `${[0, 34, 12, 46, 20, 40, 6, 28, 16][i % 9]}px`,
                "--o": on ? 1 : Math.max(0.32, 1 - 0.2 * d),
                "--d": `${0.15 + i * 0.05}s`,
              }}
            >
              {on && <Splash splash={splash} className="mi-splash" />}
              <span className="mi-label">
                {row.label}
                {row.hasChoices && <span className="mi-more" aria-hidden="true">+</span>}
              </span>
            </button>
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
 * Menu principale — parole impilate (impaginazione Metaphor) con macchia di
 * colore dietro la voce scelta. Logo animato e pioggia di carte sullo
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
  // tornando da un'altra schermata la cortina ha già fatto da ingresso
  const arrivedByCurtain = useArrivedByCurtain();
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
    // la cortina verso la schermata prende il colore della voce scelta
    armTransitionFrom({ accent: item.accent });
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
    { keys: ["↑", "↓"], label: "VOCE" },
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
        {vfxProfile.menuGlowEnabled && (
          <div
            className="smp-bg-pulse"
            style={{
              filter: vfxProfile.menuBlurPx > 0 ? `blur(${Math.min(vfxProfile.menuBlurPx, 16)}px)` : "none",
              animationPlayState: vfxProfile.menuSigilAnimation ? "running" : "paused",
            }}
          />
        )}
        <div className="smp-bg-halftone" />
        <MenuAgentRain />
        {items[mainActive] && (
          <div className="smp-echo" key={`echo-${mainActive}`}>
            {items[mainActive].label}
          </div>
        )}
      </div>

      <div className="mfr-veil" aria-hidden="true" />

      <div className="smp-brand">
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={inputLocked || Boolean(choicePicker)}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          formed={arrivedByCurtain}
          style={{ width: 940, maxWidth: "100%", pointerEvents: "none" }}
        />
      </div>

      <StackMenu
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

      {!arrivedByCurtain && (
        <div className="smp-intro" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

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
      .smp-bg-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 46%, #3a0f50 0%, #1c0829 42%, #0b0512 82%); }
      /* bagliore magenta che pulsa dietro il logo (come nel menu di prima) */
      .smp-bg-pulse {
        position: absolute; left: 560px; top: 500px; width: 1100px; height: 900px; transform: translate(-50%, -50%);
        background: radial-gradient(ellipse at 50% 50%, rgba(192,38,211,0.3) 0%, rgba(88,28,135,0.24) 32%, transparent 66%);
        animation: smp-pulse 6s ease-in-out infinite;
      }
      @keyframes smp-pulse { 0%, 100% { opacity: 0.72; } 50% { opacity: 1; } }
      /* nome della voce scelta a contorno, dietro la colonna */
      .smp-echo {
        position: absolute; z-index: 3; font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase;
        line-height: 0.8; white-space: nowrap; color: transparent; pointer-events: none; user-select: none;
        right: -60px; bottom: 210px; font-size: 230px; letter-spacing: -0.03em;
        -webkit-text-stroke: 2px color-mix(in srgb, var(--active) 34%, transparent);
        transform: rotate(-7deg); transform-origin: right bottom;
        animation: smp-echo-in .5s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes smp-echo-in { from { opacity: 0; transform: rotate(-7deg) translateX(120px); } }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--active) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
      }
      .smp-brand {
        position: absolute; left: 560px; top: 500px; width: 1040px; z-index: 10;
        display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%); pointer-events: none;
      }

      /* macchia comune: misura e posto dalle variabili della classe */
      .spl {
        position: absolute; z-index: 0; left: 50%; top: 50%; width: var(--sw, calc(100% + 200px)); height: var(--sh, 200px);
        transform: translate(-50%, var(--sy, -50%)) rotate(var(--sr)) scaleX(var(--sf)); overflow: visible; filter: url(#smp-splash);
        animation: spl-in .38s cubic-bezier(.2,1.6,.4,1) both; pointer-events: none;
      }
      .spl path, .spl circle { fill: var(--c); }
      @keyframes spl-in {
        from { opacity: 0; transform: translate(-50%, var(--sy, -50%)) rotate(calc(var(--sr) - 30deg)) scale(0.2); }
        60% { opacity: 1; }
      }
      /* ========== Cornici ========== */
      /* velo: ombra trasparente inclinata solo dietro la colonna */
      .mfr-veil {
        position: absolute; z-index: 5; right: -6%; top: 50px; width: 62%; height: 940px; pointer-events: none;
        background: radial-gradient(ellipse 50% 46% at 62% 50%, rgba(5,5,7,0.78) 0%, rgba(5,5,7,0.5) 50%, transparent 100%);
        transform: rotate(-7deg);
        animation: mfr-veil-in .6s ease-out both;
      }
      @keyframes mfr-veil-in { from { opacity: 0; } }
      /* ========== Parole impilate ========== */
      .mi { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
      .mi-col {
        position: absolute; right: 110px; top: 520px; transform: translateY(-50%) rotate(-7deg); transform-origin: right center;
        display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
      }
      .mi-item {
        position: relative; display: inline-flex; flex-direction: column; align-items: flex-end;
        margin: 0; padding: 0 var(--x) 0 0; border: 0; background: transparent; cursor: pointer; pointer-events: auto; outline: none;
        color: ${T}; opacity: var(--o); transition: opacity .25s;
        animation: mi-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes mi-in { from { opacity: 0; transform: translateX(160px); } }
      .mi-item:disabled { cursor: not-allowed; }
      .mi-label {
        position: relative; z-index: 1; display: inline-flex; flex-direction: row-reverse; align-items: center; gap: 14px;
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase; font-size: var(--fs);
        line-height: 1.04; letter-spacing: -0.02em; white-space: nowrap;
        text-shadow: 4px 4px 0 #000; transition: font-size .3s cubic-bezier(.2,1.1,.35,1), color .15s;
      }
      .mi-item:not(.on):hover .mi-label { color: var(--c); }
      .mi-item.on .mi-label { text-shadow: 6px 6px 0 #000, 10px 10px 0 color-mix(in srgb, var(--c) 60%, #000); }
      .mi-splash { --sw: calc(100% + 0.9em); --sh: 150%; --sy: -52%; font-size: var(--fs); }
      .mi-more { display: grid; place-items: center; width: 0.5em; height: 0.5em; min-width: 22px; min-height: 22px; font-size: 0.4em; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }

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
