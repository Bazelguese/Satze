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

/** Distanza con segno più corta da `from` a `to` su un anello di `n` voci. */
function ringDelta(from, to, n) {
  if (!n) return 0;
  let d = (((to - from) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

/**
 * Due impianti del quadrante (canvas 1920×1080):
 * - ghiera: ruota che esce dal bordo destro, voci a sinistra dell'arco;
 * - portale: ruota attorno al logo, voci a destra dell'arco.
 */
export const MENU_DIAL_LAYOUTS = {
  ghiera: { cx: 2150, cy: 540, r: 760, side: "left", step: 13, logo: { x: 470, y: 500, w: 640 }, room: 600 },
  portale: { cx: 640, cy: 540, r: 470, side: "right", step: 15, logo: { x: 640, y: 540, w: 700 }, room: 740 },
};

const RUNE_COUNT = 56;
const TICK_COUNT = 144;

/** Anello di rune e tacche che gira con le voci; il puntatore resta fermo sulla voce scelta. */
function DialRing({ layout, spin, accent }) {
  const { cx, cy, r, side, step } = layout;
  const rot = (side === "right" ? -1 : 1) * spin * step;
  // le voci stanno appena fuori dall'arco: tacche e rune dentro la ruota
  const runeR = r - 56;
  const tickR = r - 16;
  const pointer = side === "right" ? { x: cx + tickR - 2, y: cy, a: 0 } : { x: cx - tickR + 2, y: cy, a: 180 };
  return (
    <svg className="smd-ring" viewBox="0 0 1920 1080" aria-hidden="true">
      {side === "left" && <circle className="smd-disc" cx={cx} cy={cy} r={r + 8} />}
      <circle className="smd-ring-line" cx={cx} cy={cy} r={tickR + 8} />
      <circle className="smd-ring-line smd-ring-line--thin" cx={cx} cy={cy} r={runeR - 26} />
      <g className="smd-ring-spin" style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        {Array.from({ length: TICK_COUNT }, (_, i) => {
          const a = (i / TICK_COUNT) * Math.PI * 2;
          const long = i % 6 === 0;
          const r1 = tickR - (long ? 12 : 5);
          return (
            <line
              key={`t${i}`}
              className={long ? "smd-tick smd-tick--long" : "smd-tick"}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * tickR}
              y2={cy + Math.sin(a) * tickR}
            />
          );
        })}
        {Array.from({ length: RUNE_COUNT }, (_, i) => {
          const a = (i / RUNE_COUNT) * 360;
          const x = cx + Math.cos((a * Math.PI) / 180) * runeR;
          const y = cy + Math.sin((a * Math.PI) / 180) * runeR;
          return (
            <path
              key={`r${i}`}
              className="smd-rune"
              d={CARD_RUNES[(i * 5) % CARD_RUNES.length]}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a + 90}) scale(2.6)`}
            />
          );
        })}
      </g>
      <g transform={`translate(${pointer.x} ${pointer.y}) rotate(${pointer.a})`}>
        <path className="smd-pointer" d="M 0 0 L 26 -15 L 20 0 L 26 15 Z" style={{ fill: accent }} />
      </g>
    </svg>
  );
}

const STAR_CLIP =
  "polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)";

/**
 * Voci disposte sull'arco della ruota. La voce scelta sta sul puntatore,
 * grande, su targa crema; le altre si rimpiccioliscono e sbiadiscono
 * allontanandosi. Il giro è infinito: chi esce da un lato rientra dall'altro
 * (senza animazione, fuori vista).
 */
function MenuDial({ rows, active, layout, compact = false, buttonRefs, onPick }) {
  const { cx, cy, r, side, step, room } = layout;
  const n = rows.length;
  const range = Math.min(compact ? 5 : 4, Math.floor((n - 1) / 2) || 1);
  const prevRef = useRef({});
  const current = {};

  const arms = rows.map((row, i) => {
    const d = ringDelta(active, i, n);
    current[i] = d;
    const prev = prevRef.current[i];
    const jump = prev != null && Math.abs(d - prev) > 2;
    const a = (d * step * Math.PI) / 180;
    const x = side === "right" ? cx + r * Math.cos(a) : cx - r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const rot = side === "right" ? d * step : -d * step;
    const far = Math.abs(d);
    const on = d === 0;
    const fit = Math.min(1, room / (row.label.length * (compact ? 30 : 39)));
    const scale = on ? fit : Math.max(0.36, (compact ? 0.66 : 0.6) - 0.07 * (far - 1)) * Math.max(fit, 0.8);
    const hidden = far > range;
    const subline = [row.sub, row.meta].filter(Boolean).join(" · ");
    return (
      <div
        key={`${row.label}-${i}`}
        className={`smd-arm ${jump ? "jump" : ""} ${on ? "on" : ""}`}
        style={{
          transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot}deg)`,
          opacity: hidden ? 0 : on ? 1 : Math.max(0.18, 0.86 - 0.17 * far),
          zIndex: 20 - far,
          "--c": row.accent,
          "--s": scale.toFixed(3),
        }}
      >
        <button
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          type="button"
          className="smd-item"
          disabled={row.disabled}
          tabIndex={hidden ? -1 : 0}
          aria-hidden={hidden || undefined}
          aria-current={on ? "true" : undefined}
          onClick={() => onPick(i)}
        >
          {on && <span className="smd-plate" key={`plate-${active}`} aria-hidden="true" />}
          <span className="smd-label">{row.label}</span>
          {row.hasChoices && <span className="smd-more" aria-hidden="true">+</span>}
          {on && subline ? <span className="smd-sub" key={`sub-${active}`}>{subline}</span> : null}
        </button>
      </div>
    );
  });

  useLayoutEffect(() => {
    prevRef.current = current;
  });

  return <div className={`smd-dial smd-dial--${side} ${compact ? "smd-dial--compact" : ""}`}>{arms}</div>;
}

/**
 * Menu principale — quadrante rotante (ispirazione Persona 3 Reload) sulla
 * palette di Satze: le voci stanno sull'arco di una ruota con anello di rune
 * delle carte; scegliendo, la ruota gira e la voce scelta si ferma sul
 * puntatore, su targa crema con ombra d'accento. Logo animato e pioggia di
 * carte restano sullo sfondo. Le sotto-scelte (`choices`) aprono una seconda
 * ruota al posto della prima.
 *
 * Input: ↑/↓ o rotella del mouse girano la ruota; Invio/Spazio o clic
 * scelgono (il clic su una voce la porta al puntatore e la apre); Esc torna
 * indietro dalle sotto-scelte. `inputLocked` sospende i comandi quando sopra
 * il menu c'è un altro overlay.
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
 * }>, buildLabel?: string, inputLocked?: boolean, layout?: keyof typeof MENU_DIAL_LAYOUTS }} props
 */
export default function SatzeMenuPrototype({ menuItems, buildLabel, inputLocked = false, layout = "ghiera" }) {
  /** @type {Array<{ accent: string, title: string, trail: string[], options: ReturnType<typeof normalizeChoiceOption>[] }>} */
  const [choicePickerStack, setChoicePickerStack] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [pickerIndex, setPickerIndex] = useState(0);
  /** Scatti accumulati della ruota (continui anche quando l'indice fa il giro). */
  const [spin, setSpin] = useState(0);
  const [vfxProfile, setVfxProfile] = useState(() => getVfxQualityProfile());
  const uiScale = useUiScale();
  const rootRef = useRef(null);
  const rowRefs = useRef([]);
  const pickerRowRefs = useRef([]);
  const dial = MENU_DIAL_LAYOUTS[layout] ?? MENU_DIAL_LAYOUTS.ghiera;

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
    setSpin(0);
  };
  const closeAllPickers = () => {
    setChoicePickerStack([]);
    setSpin(0);
  };
  const closeTopPicker = () => {
    setChoicePickerStack((s) => s.slice(0, -1));
    setPickerIndex(0);
    setSpin(0);
  };

  const selectMain = (i) => {
    if (i === mainActive) return;
    playSound(UI_SOUND.NAVIGATE);
    setSpin((s) => s + ringDelta(mainActive, i, items.length));
    setActiveIndex(i);
  };
  const selectPicker = (i) => {
    if (i === pickerIndex) return;
    playSound(UI_SOUND.NAVIGATE);
    setSpin((s) => s + ringDelta(pickerIndex, i, pickerRows.length));
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

  // Focus sulla voce scelta: così Invio su un bottone apre sempre quella sul puntatore.
  useLayoutEffect(() => {
    if (choicePicker) pickerRowRefs.current[pickerIndex]?.focus({ preventScroll: true });
    else if (activeIndex != null) rowRefs.current[activeIndex]?.focus({ preventScroll: true });
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

  /** Uno scatto della ruota (tastiera e rotella); legge lo stato da keyRef. */
  const stepRef = useRef(null);
  stepRef.current = (dir) => {
    const k = keyRef.current;
    const rows = k.choicePicker ? k.pickerRows : k.items;
    if (!rows.length) return;
    const current = k.choicePicker ? k.pickerIndex : k.mainActive;
    const next = stepEnabled(rows, current, dir);
    if (k.choicePicker) k.selectPicker(next);
    else k.selectMain(next);
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = keyRef.current;
      if (k.inputLocked || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          stepRef.current(e.key === "ArrowUp" ? -1 : 1);
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

  // Rotella: uno scatto della ruota ogni ~60px di scorrimento.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    let acc = 0;
    const onWheel = (e) => {
      if (keyRef.current.inputLocked) return;
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
    { keys: ["↑", "↓"], label: "GIRA" },
    { keys: ["INVIO"], label: "SCEGLI" },
    ...(choicePicker ? [{ keys: ["ESC"], label: choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA" }] : []),
  ];

  const rows = choicePicker ? pickerRows : items;
  const active = choicePicker ? pickerIndex : mainActive;
  const activeAccent = rows[active]?.accent ?? MENU_ACCENTS.magenta;
  const anchorX = dial.side === "right" ? dial.cx + dial.r : dial.cx - dial.r;
  const sideAnchor = dial.side === "right" ? { left: anchorX + 40 } : { right: 1920 - anchorX + 40 };

  return (
    <div
      ref={rootRef}
      className={`satze-menu-v5-root smp smp--${dial.side}`}
      style={{
        zoom: uiScale,
        overflow: uiScale > 1 ? "auto" : "hidden",
        "--accent": MENU_ACCENTS.magenta,
        "--active": activeAccent,
        "--halftone": vfxProfile.quality === "low" ? 0.12 : 0.26,
      }}
    >
      <div className="smp-bg" aria-hidden="true">
        <div className="smp-bg-glow" />
        <MenuAgentRain />
        <div className="smp-bg-halftone" />
      </div>

      <div className="smp-brand" style={{ left: dial.logo.x, top: dial.logo.y, width: dial.logo.w + 100 }}>
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={inputLocked}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          style={{ width: dial.logo.w, maxWidth: "100%", pointerEvents: "none" }}
        />
      </div>

      <div
        className="smd"
        key={choicePicker ? `p-${choicePickerStack.length}-${choicePicker.title}` : "main"}
        style={{ "--hub-x": `${dial.cx}px`, "--hub-y": `${dial.cy}px` }}
      >
        <DialRing layout={dial} spin={spin} accent={activeAccent} />
        {choicePicker && (
          <div className="smd-head" style={sideAnchor}>
            {choicePicker.trail.length ? <div className="smd-trail">{choicePicker.trail.join(" › ")}</div> : null}
            <div className="smd-title">{choicePicker.title}</div>
          </div>
        )}
        <MenuDial
          rows={rows}
          active={active}
          layout={dial}
          compact={Boolean(choicePicker)}
          buttonRefs={choicePicker ? pickerRowRefs : rowRefs}
          onPick={(i) => {
            if (choicePicker) {
              selectPicker(i);
              activatePicker(i);
            } else {
              selectMain(i);
              activateMain(i);
            }
          }}
        />
        {choicePicker && (
          <button type="button" className="smd-back" style={sideAnchor} onClick={backFromPicker}>
            <span className="key">ESC</span>
            <span className="lbl">{choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA"}</span>
          </button>
        )}
      </div>

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
      .smp kbd {
        display: inline-grid; place-items: center; min-width: 26px; height: 24px; padding: 0 6px;
        background: ${T}; color: ${V}; border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 13px; line-height: 1;
        clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
      }

      /* ---------- Fondo ---------- */
      .smp-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
      .smp-bg-glow {
        position: absolute; inset: 0;
        background: radial-gradient(ellipse at 32% 46%, #2a0a3a 0%, #14051f 40%, ${V} 80%);
      }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--active) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
      }

      /* ---------- Logo ---------- */
      .smp-brand {
        position: absolute; z-index: 10;
        display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%) rotate(-3deg);
        pointer-events: none;
      }

      /* ---------- Quadrante ---------- */
      .smd {
        position: absolute; inset: 0; z-index: 12; pointer-events: none;
        transform-origin: var(--hub-x) var(--hub-y);
        animation: smd-in .7s cubic-bezier(.2,.9,.25,1) both;
      }
      @keyframes smd-in { from { opacity: 0; transform: rotate(-24deg); } }
      .smp--right .smd { animation-name: smd-in-r; }
      @keyframes smd-in-r { from { opacity: 0; transform: rotate(24deg); } }

      .smd-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .smd-disc { fill: ${V}; stroke: var(--active); stroke-width: 10; transition: stroke .3s; filter: drop-shadow(0 0 60px rgba(0,0,0,0.9)); }
      .smd-ring-line { fill: none; stroke: color-mix(in srgb, ${T} 55%, transparent); stroke-width: 2; }
      .smd-ring-line--thin { stroke: color-mix(in srgb, var(--active) 45%, transparent); stroke-width: 1.5; transition: stroke .3s; }
      .smd-ring-spin { transition: transform .5s cubic-bezier(.2,.9,.25,1); }
      .smd-tick { stroke: color-mix(in srgb, ${T} 35%, transparent); stroke-width: 1.5; }
      .smd-tick--long { stroke: ${T}; stroke-width: 2.5; }
      .smd-rune {
        fill: none; stroke: var(--active); stroke-width: 1.4; stroke-linejoin: round; vector-effect: non-scaling-stroke;
        opacity: 0.75; transition: stroke .3s;
      }
      .smd-pointer { stroke: ${T}; stroke-width: 2; transition: fill .3s; filter: drop-shadow(3px 3px 0 ${V}); }

      .smd-dial { position: absolute; inset: 0; }
      .smd-arm {
        position: absolute; left: 0; top: 0; width: 0; height: 0;
        transition: transform .5s cubic-bezier(.2,.9,.25,1), opacity .35s;
      }
      .smd-arm.jump { transition: none; }
      .smd-item {
        position: absolute; top: 0; pointer-events: auto;
        display: inline-flex; align-items: center; gap: 14px; white-space: nowrap;
        border: 0; padding: 6px 18px; background: transparent; color: ${T}; cursor: pointer; outline: none;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 68px; line-height: 1; letter-spacing: 0.01em;
        transition: transform .5s cubic-bezier(.2,.9,.25,1), color .2s;
      }
      .smd-dial--left .smd-item { right: 46px; transform: translateY(-50%) scale(var(--s)); transform-origin: right center; flex-direction: row-reverse; }
      .smd-dial--right .smd-item { left: 46px; transform: translateY(-50%) scale(var(--s)); transform-origin: left center; }
      .smd-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .smd-label { position: relative; z-index: 1; text-shadow: 4px 4px 0 ${V}; }
      .smd-arm:not(.on) .smd-item:not(:disabled):hover { color: var(--c); }
      .smd-arm.on .smd-label { color: ${V}; text-shadow: none; }
      .smd-plate {
        position: absolute; inset: -4px -26px -4px -26px; z-index: 0;
        background: ${T}; clip-path: polygon(22px 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
        filter: drop-shadow(10px 8px 0 var(--c));
        animation: smd-plate-in .32s cubic-bezier(.2,1.3,.4,1) both;
      }
      .smd-dial--left .smd-plate { transform-origin: right center; }
      .smd-dial--right .smd-plate { transform-origin: left center; }
      @keyframes smd-plate-in { from { transform: scaleX(0); } }
      .smd-more {
        position: relative; z-index: 1; display: grid; place-items: center; width: 44px; height: 44px; flex: none;
        background: var(--c); color: ${V}; font-style: normal; font-size: 32px; clip-path: ${STAR_CLIP};
      }
      .smd-arm.on .smd-more { background: ${V}; color: var(--c); animation: smd-spin 4s linear infinite; }
      @keyframes smd-spin { to { transform: rotate(360deg); } }
      .smd-sub {
        position: absolute; z-index: 2; top: calc(100% + 6px);
        background: var(--c); color: ${V}; font-family: 'Share Tech Mono', monospace; font-style: normal; font-weight: 400;
        font-size: 17px; letter-spacing: 0.22em; padding: 5px 14px; white-space: nowrap;
        clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        animation: smd-sub-in .3s .12s cubic-bezier(.2,1.2,.4,1) both;
      }
      .smd-dial--left .smd-sub { right: 10px; }
      .smd-dial--right .smd-sub { left: 10px; }
      @keyframes smd-sub-in { from { opacity: 0; transform: translateY(-10px); } }

      .smd-dial--compact .smd-item { font-size: 54px; }

      .smd-head { position: absolute; top: 96px; pointer-events: none; animation: smd-head-in .4s cubic-bezier(.2,1.2,.4,1) both; }
      .smp--left .smd-head { text-align: right; }
      @keyframes smd-head-in { from { opacity: 0; transform: translateY(-20px); } }
      .smd-trail { font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.24em; color: rgba(245,243,235,0.65); margin-bottom: 6px; }
      .smd-title {
        display: inline-block; font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 40px; line-height: 1;
        background: var(--active); color: ${V}; padding: 6px 20px; transform: skewX(-12deg) rotate(-2deg);
        box-shadow: 6px 6px 0 ${T};
      }
      .smd-back {
        position: absolute; bottom: 92px; pointer-events: auto;
        display: inline-flex; align-items: center; gap: 12px;
        background: ${T}; color: ${V}; border: 0; cursor: pointer;
        padding: 8px 22px 8px 12px; transform: skewX(-14deg);
        box-shadow: 5px 5px 0 var(--active);
        transition: transform .15s, box-shadow .15s;
      }
      .smd-back > * { transform: skewX(14deg); }
      .smd-back:hover, .smd-back:focus-visible { outline: none; transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--active); }
      .smd-back .key { background: ${V}; color: ${T}; font-weight: 700; font-size: 12px; padding: 3px 7px; }
      .smd-back .lbl { font-weight: 700; font-style: italic; font-size: 18px; letter-spacing: 0.1em; }

      /* ---------- Barra comandi ---------- */
      .smp-hints {
        position: absolute; left: 0; right: 0; bottom: 0; height: 58px; z-index: 18;
        display: flex; align-items: center; justify-content: space-between; gap: 26px; padding: 0 48px;
        background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.6) 70%, transparent);
      }
      .smp-build {
        font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.28em;
        color: rgba(245,243,235,0.55); white-space: nowrap;
      }
      .smp-hints-keys { display: inline-flex; align-items: center; gap: 26px; }
      .smp-hint { display: inline-flex; align-items: center; gap: 5px; }
      .smp-hint .lbl { margin-left: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.16em; font-style: italic; }

      /* ---------- Intro: tre lame diagonali ---------- */
      .smp-intro { position: absolute; inset: 0; z-index: 200; pointer-events: none; overflow: hidden; }
      .smp-intro > span {
        position: absolute; top: -30%; bottom: -30%; width: 46%;
        transform: skewX(-18deg);
        animation: smp-blade .62s cubic-bezier(.7,0,.3,1) forwards;
      }
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
