import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { MENU_ACCENTS } from "../../theme/hudOratorioPalette";
import AnimatedSatzeLogo from "../brand/AnimatedSatzeLogo";
import { MenuAgentRain } from "./MenuAgentRain";
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

/** Pseudo-casuale deterministico: stesse lettere "ritagliate" a ogni render. */
function rnd(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function hashString(s) {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Sagoma frastagliata a freccia (tre varianti: alternandole la sagoma "vibra"). */
function jaggedClip(seed) {
  const top = [];
  const bottom = [];
  const n = 10;
  for (let i = 0; i <= n; i += 1) {
    const x = (i / n) * 90;
    top.push(`${(x + (rnd(seed + i) - 0.5) * 3).toFixed(1)}% ${((i % 2 ? 0 : 12) + rnd(seed + i * 3) * 10).toFixed(1)}%`);
    bottom.unshift(`${(x + (rnd(seed + i * 5) - 0.5) * 3).toFixed(1)}% ${(100 - (i % 2 ? 12 : 0) - rnd(seed + i * 7) * 10).toFixed(1)}%`);
  }
  const tip = `100% ${(44 + rnd(seed + 99) * 12).toFixed(1)}%`;
  const notch = `${(3 + rnd(seed + 77) * 5).toFixed(1)}% 50%`;
  return `polygon(${[...top, tip, ...bottom, notch].join(", ")})`;
}

const SPLASH = [jaggedClip(3), jaggedClip(41), jaggedClip(87)];
const LETTER_KINDS = ["paper", "ink", "accent", "paper", "ink", "plain"];

/**
 * Scritta "a ritaglio": ogni lettera ha misura, inclinazione e (se `cut`) un
 * riquadro diverso, come lettere ritagliate da giornali.
 */
function CutoutLabel({ text, cut }) {
  const seed = hashString(text);
  return (
    <span className={`rn ${cut ? "rn--cut" : ""}`}>
      <span className="rn-sr">{text}</span>
      {[...text].map((ch, i) => {
        if (ch === " ") return <span key={i} className="rn-sp" aria-hidden="true" />;
        const a = rnd(seed + i * 7.1);
        const b = rnd(seed + i * 3.7 + 11);
        const c = rnd(seed + i * 5.3 + 29);
        const kind = LETTER_KINDS[Math.floor(a * LETTER_KINDS.length)];
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`rn-ch rn-${kind} ${b > 0.64 ? "rn-serif" : ""}`}
            style={{
              "--s": (0.84 + b * 0.32).toFixed(3),
              "--r": `${((c - 0.5) * 16).toFixed(1)}deg`,
              "--y": `${((a - 0.5) * 12).toFixed(1)}%`,
              "--i": i,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

const SHIFT = [0, 36, 12, 44, 20, 40, 6, 30, 16, 34];
const TILT = [-2, 1.5, -1.5, 2, -2.5, 1, -1.5, 2, -1, 1.5];

/**
 * Voce del menu (e del pannello di scelta). Non scelta: scritta crema
 * inclinata. Scelta: si ingrandisce, lettere a ritaglio che saltano dentro
 * una alla volta e sagoma frastagliata che vibra dietro, con stella-cursore.
 */
function MenuEntry({ row, index, active, compact = false, buttonRef, onActivate, onHover }) {
  const subline = [row.sub, row.meta].filter(Boolean).join(" · ");
  // Ingrandimento della voce scelta: le scritte lunghe crescono meno, così restano nello schermo.
  const room = compact ? 560 / (row.label.length * 23) : 600 / (row.label.length * 35);
  const onScale = Math.max(0.95, Math.min(compact ? 1.18 : 1.26, room));
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={row.disabled}
      aria-label={[row.label, row.sub, row.meta].filter(Boolean).join(" · ")}
      className={`smp-entry ${active ? "on" : ""} ${compact ? "smp-entry--compact" : ""}`}
      style={{
        "--c": row.accent,
        "--x": `${SHIFT[index % SHIFT.length]}px`,
        "--t": `${TILT[index % TILT.length]}deg`,
        "--d": `${0.2 + index * 0.05}s`,
        "--on": onScale.toFixed(3),
      }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onActivate}
    >
      <span className="smp-entry-body">
        {active && (
          <span className="smp-splash" aria-hidden="true">
            <span className="sp sp-back" />
            <span className="sp sp-mid" />
            <span className="sp sp-front" />
          </span>
        )}
        {active && <span className="smp-entry-star" aria-hidden="true" />}
        {/* Stessi nodi da scelta a non scelta: rimontarli farebbe perdere il clic in corso. */}
        <span className="smp-entry-label">
          <CutoutLabel text={row.label} cut={active} />
        </span>
        {row.hasChoices && <span className="smp-entry-more" aria-hidden="true">+</span>}
      </span>
      {active && subline ? <span className="smp-entry-sub">{subline}</span> : null}
    </button>
  );
}

/**
 * Menu principale — stile Persona 5 sulla palette di Satze: lastra nera in
 * diagonale con bordo magenta, retino, logo animato, voci grandi "a
 * ritaglio" con sagoma frastagliata che vibra sulla voce scelta, eco gigante
 * della voce sullo sfondo, lampo diagonale a ogni cambio e lame d'ingresso.
 *
 * Tastiera: ↑/↓ voce, Invio/Spazio sceglie, Esc chiude il pannello di scelta.
 * `inputLocked` sospende la tastiera quando sopra il menu c'è un altro overlay.
 *
 * Opzionale `choices`: la voce apre un pannello per scegliere un’opzione
 * (annidabile; `children` è ancora accettato come alias di `choices`).
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
  const rowRefs = useRef([]);
  const pickerRowRefs = useRef([]);
  const pickerListRef = useRef(null);
  /** Scorre la lista solo dopo un passo da tastiera: col mouse le voci non devono scivolare sotto il cursore. */
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
    if (i === mainActive) return;
    playSound(UI_SOUND.NAVIGATE);
    setActiveIndex(i);
  };
  const selectPicker = (i) => {
    if (i === pickerIndex) return;
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

  // Focus segue la voce attiva: così Invio su un bottone sceglie sempre quella evidenziata.
  useLayoutEffect(() => {
    if (choicePicker) {
      pickerRowRefs.current[pickerIndex]?.focus({ preventScroll: true });
      const list = pickerListRef.current;
      const row = pickerRowRefs.current[pickerIndex];
      if (list && row && keyNavRef.current) {
        const pad = 40;
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

  useEffect(() => {
    const onKey = (e) => {
      const k = keyRef.current;
      if (k.inputLocked || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      const rows = k.choicePicker ? k.pickerRows : k.items;
      const current = k.choicePicker ? k.pickerIndex : k.mainActive;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown": {
          if (!rows.length) return;
          e.preventDefault();
          keyNavRef.current = true;
          const next = stepEnabled(rows, current, e.key === "ArrowUp" ? -1 : 1);
          if (k.choicePicker) k.selectPicker(next);
          else k.selectMain(next);
          break;
        }
        case "Enter":
        case " ": {
          // Su un bottone ci pensa il click nativo (il focus segue la voce attiva).
          if (e.target?.tagName === "BUTTON") return;
          e.preventDefault();
          if (k.choicePicker) k.activatePicker(current);
          else k.activateMain(current);
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

  const buildTag = `${(buildLabel ?? "v0.1 ALPHA · NON DISTRIBUIRE").replace(/[\s·]+$/, "")} · BUILD ${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ".")}`;

  const hints = choicePicker
    ? [
        { keys: ["↑", "↓"], label: "VOCE" },
        { keys: ["INVIO"], label: "SCEGLI" },
        { keys: ["ESC"], label: choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA" },
      ]
    : [
        { keys: ["↑", "↓"], label: "VOCE" },
        { keys: ["INVIO"], label: "SCEGLI" },
      ];

  const activeItem = items[mainActive];
  const activeAccent = activeItem?.accent ?? MENU_ACCENTS.magenta;

  return (
    <div
      className="satze-menu-v5-root smp"
      style={{
        zoom: uiScale,
        overflow: uiScale > 1 ? "auto" : "hidden",
        "--accent": MENU_ACCENTS.magenta,
        "--active": activeAccent,
        "--halftone": vfxProfile.quality === "low" ? 0.14 : 0.3,
      }}
    >
      <div className="smp-bg" aria-hidden="true">
        <div className="smp-bg-glow" />
        <MenuAgentRain />
        <div className="smp-bg-tone" />
        <div className="smp-bg-slab" />
        <div className="smp-bg-slab-edge" />
        <div className="smp-bg-halftone" />
      </div>

      <div className="smp-watermark" aria-hidden="true">SATZE</div>

      {activeItem && (
        <div className="smp-echo" key={`echo-${activeItem.id}`} aria-hidden="true">
          {activeItem.label}
        </div>
      )}
      <div className="smp-flash" key={`flash-${mainActive}`} aria-hidden="true" />

      <div className="smp-brand">
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={Boolean(choicePicker) || inputLocked}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          style={{ width: 760, maxWidth: "100%", pointerEvents: "none" }}
        />
      </div>

      <div className="smp-menu">
        <div className="smp-list" role="menu">
          {items.map((item, i) => (
            <MenuEntry
              key={item.id}
              row={item}
              index={i}
              active={!choicePicker && i === mainActive}
              buttonRef={(el) => {
                rowRefs.current[i] = el;
              }}
              onHover={() => !item.disabled && !choicePicker && selectMain(i)}
              onActivate={() => {
                setActiveIndex(i);
                activateMain(i);
              }}
            />
          ))}
        </div>
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

      {choicePicker ? (
        <div className="smp-picker-backdrop" role="presentation" onClick={() => closeAllPickers()}>
          <div
            className="smp-picker"
            key={`${choicePicker.trail.join("/")}/${choicePicker.title}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="satze-choice-picker-title"
            style={{ "--accent": choicePicker.accent }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="smp-picker-in">
              <div className="smp-picker-head">
                <div className="smp-picker-eyebrow">
                  <span className="sec">SCEGLI</span>
                  {choicePicker.trail.length ? <span className="trail">{choicePicker.trail.join(" › ")}</span> : null}
                </div>
                <h2 id="satze-choice-picker-title" className="smp-picker-title">
                  <CutoutLabel text={choicePicker.title} cut />
                </h2>
              </div>
              <div className="smp-picker-list" ref={pickerListRef}>
                {pickerRows.map((opt, idx) => (
                  <MenuEntry
                    key={`${opt.label}-${idx}`}
                    row={opt}
                    index={idx}
                    compact
                    active={idx === pickerIndex}
                    buttonRef={(el) => {
                      pickerRowRefs.current[idx] = el;
                    }}
                    onHover={() => !opt.disabled && selectPicker(idx)}
                    onActivate={() => {
                      setPickerIndex(idx);
                      activatePicker(idx);
                    }}
                  />
                ))}
              </div>
              <button type="button" className="smp-picker-back" onClick={backFromPicker}>
                <span className="key">ESC</span>
                <span className="lbl">{choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="smp-intro" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <SatzeMenuStyles />
    </div>
  );
}

const STAR_CLIP =
  "polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)";

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
        background: radial-gradient(ellipse at 32% 42%, #2a0a3a 0%, #14051f 40%, ${V} 80%);
      }
      .smp-bg-tone {
        position: absolute; inset: 0; z-index: 2;
        background: linear-gradient(100deg, transparent 35%, color-mix(in srgb, var(--active) 18%, transparent) 70%, transparent 100%);
        transition: background .35s;
      }
      .smp-bg-slab {
        position: absolute; top: -20%; bottom: -20%; right: -16%; width: 54%; z-index: 3;
        background: ${V};
        transform: skewX(-13deg);
        box-shadow: 0 0 90px rgba(0,0,0,0.85);
        animation: smp-slab-in .6s cubic-bezier(.2,.9,.2,1) both;
      }
      @keyframes smp-slab-in { from { transform: skewX(-13deg) translateX(110%); } }
      .smp-bg-slab-edge {
        position: absolute; top: -20%; bottom: -20%; left: calc(62% - 11px); width: 22px; z-index: 3;
        background: var(--active);
        transform: skewX(-13deg);
        box-shadow: -26px 0 0 -14px ${V}, -34px 0 0 -16px ${T};
        transition: background .3s;
        animation: smp-edge-in .55s .05s cubic-bezier(.2,.9,.2,1) both;
      }
      @keyframes smp-edge-in { from { transform: skewX(-13deg) translateY(110%); } }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--active) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 85%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 85%);
      }

      .smp-watermark {
        position: absolute; left: -30px; bottom: -80px; z-index: 1;
        font-weight: 700; font-style: italic; font-size: 300px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 2px rgba(192,38,211,0.22);
        transform: rotate(-8deg) skewX(-12deg); transform-origin: left bottom;
        pointer-events: none; user-select: none; white-space: nowrap;
      }

      /* Eco gigante della voce scelta, dietro la colonna */
      .smp-echo {
        position: absolute; right: -60px; top: 70px; z-index: 4;
        font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 210px; line-height: 0.85; letter-spacing: -0.03em; white-space: nowrap;
        color: transparent; -webkit-text-stroke: 2px color-mix(in srgb, var(--active) 45%, transparent);
        transform: rotate(-78deg) translateX(-40%); transform-origin: right top;
        pointer-events: none; user-select: none; opacity: 0.55;
        animation: smp-echo-in .45s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes smp-echo-in { from { opacity: 0; transform: rotate(-78deg) translateX(-30%); } }

      /* Lampo diagonale a ogni cambio voce */
      .smp-flash {
        position: absolute; top: -30%; bottom: -30%; left: 50%; width: 180px; z-index: 6; pointer-events: none;
        background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--active) 55%, transparent), ${T}66, transparent);
        transform: skewX(-18deg) translateX(-200%); opacity: 0;
        animation: smp-flash .42s cubic-bezier(.4,0,.2,1);
      }
      @keyframes smp-flash {
        0% { opacity: 0.9; transform: skewX(-18deg) translateX(-160%); }
        100% { opacity: 0; transform: skewX(-18deg) translateX(520%); }
      }

      /* ---------- Logo ---------- */
      .smp-brand {
        position: absolute; left: 600px; top: 470px; z-index: 10; width: 860px;
        display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%) rotate(-3deg);
        pointer-events: none;
      }

      /* ---------- Colonna voci ---------- */
      .smp-menu {
        position: absolute; top: 90px; right: 40px; bottom: 70px; width: 800px; z-index: 12;
        display: flex; flex-direction: column;
      }
      .smp-list {
        flex: 1; min-height: 0; overflow: visible;
        padding: 10px 10px 20px 90px;
        display: flex; flex-direction: column; justify-content: center;
      }

      /* ---------- Voce ---------- */
      .smp-entry {
        position: relative; display: block; flex: none; width: 100%; height: 84px;
        padding: 0 0 0 var(--x); border: 0; background: transparent; cursor: pointer; text-align: left; color: inherit;
        outline: none;
        animation: smp-entry-in .45s var(--d) cubic-bezier(.2,1.2,.3,1) backwards;
      }
      @keyframes smp-entry-in { from { opacity: 0; transform: translateX(160px) skewX(-14deg); } }
      .smp-entry:disabled { cursor: not-allowed; opacity: 0.35; }
      .smp-entry-body {
        position: relative; display: inline-flex; align-items: center; gap: 14px; height: 100%;
        transform: rotate(var(--t)); transform-origin: left center;
        transition: transform .22s cubic-bezier(.3,1.6,.5,1);
      }
      .smp-entry-label { position: relative; z-index: 2; display: inline-flex; }
      .smp-entry:not(.on):not(:disabled):hover .smp-entry-body { transform: rotate(var(--t)) translateX(-10px); }
      .smp-entry.on { z-index: 3; }
      .smp-entry.on .smp-entry-body { transform: rotate(calc(var(--t) * 1.6)) translateX(-24px) scale(var(--on)); }

      /* Lettere a ritaglio */
      .rn { display: inline-flex; align-items: center; white-space: nowrap; font-size: 46px; }
      .rn-sp { display: inline-block; width: 0.34em; }
      .rn-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
      .rn-ch {
        display: inline-block; position: relative;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 1em; line-height: 1; color: ${T};
        transform: translateY(calc(var(--y) * .2)) scale(calc(1 + (var(--s) - 1) * .25));
        text-shadow: 3px 3px 0 ${V}, -1px -1px 0 ${V};
      }
      .rn--cut .rn-serif { font-family: 'Cinzel', Georgia, serif; font-style: normal; font-weight: 900; }
      .rn--cut .rn-ch {
        padding: 2px 4px 0; margin: 0 1px; text-shadow: none;
        transform: translateY(var(--y)) rotate(var(--r)) scale(var(--s));
        animation: rn-pop .34s calc(var(--i) * 26ms) cubic-bezier(.2,1.7,.4,1) both;
      }
      .rn--cut .rn-paper { background: ${T}; color: ${V}; }
      .rn--cut .rn-ink { background: ${V}; color: ${T}; box-shadow: 0 0 0 2px ${T}; }
      .rn--cut .rn-accent { background: var(--c, var(--accent)); color: ${V}; }
      .rn--cut .rn-plain { color: ${T}; text-shadow: 3px 3px 0 ${V}; padding: 0 1px; }
      @keyframes rn-pop {
        from { opacity: 0; transform: translateY(-60%) rotate(-50deg) scale(0.2); }
        70% { opacity: 1; }
      }

      /* Sagoma frastagliata che vibra */
      .smp-splash {
        position: absolute; z-index: 1; left: -46px; right: -70px; top: 2px; bottom: 2px;
        animation: smp-splash-in .24s cubic-bezier(.2,1.4,.4,1) both;
        transform-origin: left center;
      }
      @keyframes smp-splash-in { from { transform: scaleX(0.1) skewX(-30deg); opacity: 0; } }
      .smp-splash .sp { position: absolute; inset: 0; animation: smp-jit .45s step-end infinite; }
      .smp-splash .sp-back { background: ${T}; transform: translate(10px, 8px) scale(1.06); animation-delay: -.15s; }
      .smp-splash .sp-mid { background: var(--c); transform: translate(-4px, -3px) scale(1.02); animation-delay: -.3s; }
      .smp-splash .sp-front { background: ${V}; transform: scale(0.9, 0.78); }
      @keyframes smp-jit {
        0% { clip-path: ${SPLASH[0]}; }
        33% { clip-path: ${SPLASH[1]}; }
        66% { clip-path: ${SPLASH[2]}; }
      }

      /* Stella-cursore */
      .smp-entry-star {
        position: absolute; z-index: 3; left: -62px; top: 50%; width: 52px; height: 52px; margin-top: -26px;
        background: var(--c); clip-path: ${STAR_CLIP};
        filter: drop-shadow(3px 3px 0 ${T});
        animation: smp-star-in .3s cubic-bezier(.2,1.6,.4,1) both, smp-spin 3s linear infinite .3s;
      }
      @keyframes smp-star-in { from { transform: scale(0) rotate(-120deg); } }
      @keyframes smp-spin { to { transform: rotate(360deg); } }

      .smp-entry-more {
        position: relative; z-index: 2; display: grid; place-items: center; width: 34px; height: 34px;
        background: var(--c); color: ${V}; font-weight: 700; font-size: 26px; line-height: 1;
        clip-path: ${STAR_CLIP};
      }
      .smp-entry.on .smp-entry-more { background: ${T}; animation: smp-spin 4s linear infinite; }

      .smp-entry-sub {
        position: absolute; z-index: 4; left: calc(var(--x) + 60px); bottom: -16px;
        background: ${T}; color: ${V}; font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.2em;
        padding: 4px 12px; white-space: nowrap; transform: skewX(-14deg) rotate(-2deg);
        box-shadow: 4px 4px 0 var(--c);
        animation: smp-sub-in .3s .12s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes smp-sub-in { from { opacity: 0; transform: skewX(-14deg) rotate(-2deg) translateX(40px); } }

      /* Voci del pannello di scelta: più piccole */
      .smp-entry--compact { height: 64px; }
      .smp-entry--compact .rn { font-size: 30px; }
      .smp-entry--compact.on .smp-entry-body { transform: rotate(calc(var(--t) * 1.2)) translateX(-6px) scale(var(--on)); }
      .smp-entry--compact .smp-entry-star { left: -44px; width: 36px; height: 36px; margin-top: -18px; }
      .smp-entry--compact .smp-splash { left: -30px; right: -50px; }
      .smp-entry--compact .smp-entry-more { width: 26px; height: 26px; font-size: 20px; }
      .smp-entry--compact .smp-entry-sub { font-size: 11px; bottom: -12px; left: calc(var(--x) + 40px); }

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

      /* ---------- Pannello di scelta ---------- */
      .smp-picker-backdrop {
        position: absolute; inset: 0; z-index: 100;
        display: flex; align-items: center; justify-content: center; padding: 60px 24px 80px;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px,
          rgba(5,5,7,0.86);
        animation: smp-fade .2s ease-out both;
      }
      @keyframes smp-fade { from { opacity: 0; } }
      .smp-picker {
        position: relative; width: 820px; max-height: 100%;
        display: flex; flex-direction: column;
        filter: drop-shadow(14px 14px 0 var(--accent));
        transform: rotate(-1.5deg);
        animation: smp-picker-in .32s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes smp-picker-in {
        from { opacity: 0; transform: rotate(-1.5deg) translateX(90px) skewX(-8deg); }
      }
      .smp-picker-in {
        flex: 1; min-height: 0; display: flex; flex-direction: column;
        padding: 26px 30px 22px 34px;
        background: #050507; border-left: 8px solid var(--accent);
        clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%);
      }
      .smp-picker-head { margin-bottom: 14px; }
      .smp-picker-eyebrow { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .smp-picker-eyebrow .sec {
        background: var(--accent); color: ${V}; font-weight: 700; font-size: 13px; letter-spacing: 0.24em;
        padding: 3px 12px; transform: skewX(-14deg);
      }
      .smp-picker-eyebrow .trail {
        font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.2em;
        color: rgba(245,243,235,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .smp-picker-title { margin: 10px 0 0 6px; transform: rotate(-2deg); transform-origin: left center; }
      .smp-picker-title .rn { font-size: 40px; }
      .smp-picker-list {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding: 10px 6px 18px 80px; scrollbar-width: none;
      }
      .smp-picker-list::-webkit-scrollbar { display: none; }
      .smp-picker-back {
        align-self: flex-start; margin-top: 14px; display: inline-flex; align-items: center; gap: 12px;
        background: ${T}; color: ${V}; border: 0; cursor: pointer;
        padding: 8px 22px 8px 12px; transform: skewX(-14deg);
        box-shadow: 5px 5px 0 var(--accent);
        transition: transform .15s, box-shadow .15s;
      }
      .smp-picker-back > * { transform: skewX(14deg); }
      .smp-picker-back:hover, .smp-picker-back:focus-visible {
        outline: none; transform: skewX(-14deg) translate(-3px,-3px); box-shadow: 8px 8px 0 var(--accent);
      }
      .smp-picker-back .key { background: ${V}; color: ${T}; font-weight: 700; font-size: 12px; padding: 3px 7px; letter-spacing: 0.06em; }
      .smp-picker-back .lbl { font-weight: 700; font-style: italic; font-size: 18px; letter-spacing: 0.1em; }

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
        .smp-splash .sp { animation: none !important; clip-path: ${SPLASH[0]}; }
        .smp-intro, .smp-flash { display: none; }
      }
    `}</style>
  );
}
