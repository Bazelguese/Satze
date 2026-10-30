import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { MENU_ACCENTS } from "../../theme/hudOratorioPalette";
import AnimatedSatzeLogo from "../brand/AnimatedSatzeLogo";
import { MenuAgentRain } from "./MenuAgentRain";
import { isMenuFollowUpPicker } from "../../utils/devDialogueDuelMenu";
import { DISPLAY_SETTINGS_CHANGED_EVENT, getDisplaySettings } from "../../settings/displaySettings";
import { getVfxQualityProfile, resolveVfxQualityProfile } from "../../settings/vfxQualityProfile";
import { useUiScale } from "../../hooks/useUiScale";
import { playUiClick } from "../../audio/soundBus";

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

const ZIGZAG = [0, 16, 6, 22, 4, 18, 10];

/**
 * Voce a piastra inclinata (menu e pannello di scelta).
 * Attiva = piastra crema, testo nero, ombra d'accento sfalsata e cursore.
 */
function MenuPlate({ row, index, active, compact = false, buttonRef, onActivate, onHover }) {
  const subline = [row.sub, row.meta].filter(Boolean).join(" · ");
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={row.disabled}
      className={`smp-row ${active ? "on" : ""} ${compact ? "smp-row--compact" : ""}`}
      style={{ "--c": row.accent, "--zz": `${ZIGZAG[index % ZIGZAG.length]}px`, "--d": `${0.18 + index * 0.045}s` }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onActivate}
    >
      <span className="smp-row-shadow" aria-hidden="true" />
      <span className="smp-row-plate">
        <span className="smp-row-cursor" aria-hidden="true" />
        <span className="smp-row-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="smp-row-text">
          <span className="smp-row-title">{row.label}</span>
          {subline ? <span className="smp-row-sub">{subline}</span> : null}
        </span>
        {row.hasChoices ? (
          <span className="smp-row-more">{row.choiceCount}</span>
        ) : (
          <span className="smp-row-arrow" aria-hidden="true">›</span>
        )}
      </span>
    </button>
  );
}

/**
 * Menu principale — stile Persona come Galleria, costruzione esercito e
 * caricamento: lastra nera in diagonale con bordo magenta, retino, logo
 * animato inclinato con motto su targa, voci a piastra con cursore e ombra
 * d'accento, barra comandi in basso e lame d'ingresso.
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
    () => [MENU_ACCENTS.pink, MENU_ACCENTS.magenta, "#a78bfa", "#22d3ee", "#94a3b8", "#f472b6"],
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
        choiceCount: options?.length ?? 0,
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
        choiceCount: opt.choices?.length ?? 0,
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
      const setIndex = k.choicePicker ? setPickerIndex : setActiveIndex;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown": {
          if (!rows.length) return;
          e.preventDefault();
          keyNavRef.current = true;
          setIndex(stepEnabled(rows, current, e.key === "ArrowUp" ? -1 : 1));
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

  const activeAccent = items[mainActive]?.accent ?? MENU_ACCENTS.magenta;

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
        <div className="smp-bg-stripes" />
      </div>

      <div className="smp-watermark" aria-hidden="true">SATZE</div>

      <div className="smp-brand">
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={Boolean(choicePicker) || inputLocked}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          style={{ width: 720, maxWidth: "100%", pointerEvents: "none" }}
        />
        <div className="smp-tagline">
          <span>LA GRANDE GUERRA</span>
        </div>
      </div>

      <div className="smp-menu">
        <div className="smp-head">
          <span className="smp-head-sec">MENÙ</span>
          <span className="smp-head-txt">PRINCIPALE</span>
        </div>
        <div className="smp-list" role="menu">
          {items.map((item, i) => (
            <MenuPlate
              key={item.id}
              row={item}
              index={i}
              active={!choicePicker && i === mainActive}
              buttonRef={(el) => {
                rowRefs.current[i] = el;
              }}
              onHover={() => !item.disabled && !choicePicker && setActiveIndex(i)}
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
                  <span>{choicePicker.title}</span>
                </h2>
                <div className="smp-picker-count">
                  <span className="cur">{String(pickerIndex + 1).padStart(2, "0")}</span>
                  <span className="sep">/</span>
                  <span className="tot">{String(pickerRows.length).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="smp-picker-list" ref={pickerListRef}>
                {pickerRows.map((opt, idx) => (
                  <MenuPlate
                    key={`${opt.label}-${idx}`}
                    row={opt}
                    index={idx}
                    compact
                    active={idx === pickerIndex}
                    buttonRef={(el) => {
                      pickerRowRefs.current[idx] = el;
                    }}
                    onHover={() => !opt.disabled && setPickerIndex(idx)}
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
        background: linear-gradient(100deg, transparent 35%, color-mix(in srgb, var(--active) 16%, transparent) 70%, transparent 100%);
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
        background: var(--accent);
        transform: skewX(-13deg);
        box-shadow: -26px 0 0 -14px ${V}, -34px 0 0 -16px ${T};
        animation: smp-edge-in .55s .05s cubic-bezier(.2,.9,.2,1) both;
      }
      @keyframes smp-edge-in { from { transform: skewX(-13deg) translateY(110%); } }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--accent) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 85%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 85%);
      }
      .smp-bg-stripes {
        position: absolute; inset: 0; z-index: 4; opacity: 0.06;
        background-image: repeating-linear-gradient(-77deg, #fff 0 2px, transparent 2px 46px);
      }

      .smp-watermark {
        position: absolute; left: -30px; bottom: -80px; z-index: 1;
        font-weight: 700; font-style: italic; font-size: 300px; line-height: 0.8; letter-spacing: -0.04em;
        color: transparent; -webkit-text-stroke: 2px rgba(192,38,211,0.22);
        transform: rotate(-8deg) skewX(-12deg); transform-origin: left bottom;
        pointer-events: none; user-select: none; white-space: nowrap;
      }

      /* ---------- Logo ---------- */
      .smp-brand {
        position: absolute; left: 600px; top: 430px; z-index: 10; width: 820px;
        display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%) rotate(-3deg);
        pointer-events: none;
      }
      .smp-tagline {
        margin-top: 6px; background: ${T}; color: ${V};
        font-weight: 700; font-size: 16px; letter-spacing: 0.4em;
        padding: 5px 20px 5px 24px; transform: skewX(-14deg);
        box-shadow: 6px 6px 0 var(--accent);
        animation: smp-swipe-in .45s .25s cubic-bezier(.2,1,.3,1) both;
      }
      .smp-tagline > span { display: inline-block; transform: skewX(14deg); }

      /* ---------- Colonna voci ---------- */
      .smp-menu {
        position: absolute; top: 110px; right: 60px; bottom: 70px; width: 680px; z-index: 12;
        display: flex; flex-direction: column;
      }
      .smp-head {
        display: flex; align-items: center; gap: 12px; margin: 0 0 14px 60px;
        transform: rotate(-3deg); transform-origin: left center;
        animation: smp-swipe-in .4s .1s cubic-bezier(.2,1,.3,1) both;
      }
      .smp-head-sec {
        background: var(--accent); color: ${V}; font-weight: 700; font-size: 15px; letter-spacing: 0.26em;
        padding: 4px 14px; transform: skewX(-14deg);
      }
      .smp-head-txt {
        font-weight: 700; font-style: italic; font-size: 40px; line-height: 1; letter-spacing: 0.02em;
        text-shadow: 4px 4px 0 var(--accent), 7px 7px 0 ${V};
      }
      .smp-list {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding: 6px 10px 20px 60px; scrollbar-width: none;
      }
      .smp-list::-webkit-scrollbar { display: none; }

      /* ---------- Voce a piastra ---------- */
      .smp-row {
        position: relative; display: block; width: calc(100% - 40px); height: 68px; margin: 0 0 8px;
        padding: 0; border: 0; background: transparent; cursor: pointer; text-align: left; color: inherit;
        outline: none;
        transform: translateX(var(--zz));
        transition: transform .2s cubic-bezier(.3,1.5,.5,1);
        animation: smp-row-in .42s var(--d) cubic-bezier(.2,1,.3,1) backwards;
      }
      @keyframes smp-row-in { from { opacity: 0; transform: translateX(calc(var(--zz) + 120px)) skewX(-10deg); } }
      .smp-row:disabled { cursor: not-allowed; opacity: 0.4; }
      .smp-row-plate, .smp-row-shadow {
        position: absolute; inset: 0;
        clip-path: polygon(18px 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
      }
      .smp-row-shadow { background: var(--c); opacity: 0; transition: transform .2s, opacity .15s; }
      .smp-row-plate {
        display: flex; align-items: center; gap: 16px; padding: 0 34px 0 28px;
        background: rgba(14,14,18,0.94); transition: background .15s, color .15s;
      }
      .smp-row-plate::before {
        content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 5px;
        background: var(--c); transform: skewX(-15deg);
      }
      .smp-row-cursor {
        position: absolute; left: -40px; top: 50%; width: 32px; height: 34px; margin-top: -17px;
        background: var(--c); clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);
        opacity: 0; transform: translateX(-12px); transition: opacity .15s, transform .2s;
      }
      .smp-row-num {
        flex: none; width: 34px; font-family: 'Share Tech Mono', monospace; font-size: 15px;
        color: var(--c); letter-spacing: 0.04em;
      }
      .smp-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.05; }
      .smp-row-title {
        font-weight: 700; font-style: italic; font-size: 30px; text-transform: uppercase; letter-spacing: 0.02em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .smp-row-sub {
        margin-top: 3px; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.16em;
        opacity: 0.6; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .smp-row-arrow { flex: none; font-weight: 700; font-size: 34px; color: var(--c); transition: transform .2s; }
      .smp-row-more {
        flex: none; display: grid; place-items: center; width: 44px; height: 44px;
        background: var(--c); color: ${V}; font-weight: 700; font-style: italic; font-size: 18px;
        clip-path: ${STAR_CLIP};
      }
      .smp-row:not(:disabled):hover { transform: translateX(calc(var(--zz) - 8px)); }
      .smp-row:not(:disabled):hover .smp-row-plate { background: rgba(32,32,40,0.97); }
      .smp-row.on { transform: translateX(calc(var(--zz) - 30px)) rotate(-1.5deg) scale(1.05); z-index: 2; }
      .smp-row.on .smp-row-shadow { opacity: 1; transform: translate(10px, 8px); }
      .smp-row.on .smp-row-plate { background: ${T}; color: ${V}; }
      .smp-row.on .smp-row-plate::before { background: ${V}; }
      .smp-row.on .smp-row-num { color: ${V}; font-weight: 700; }
      .smp-row.on .smp-row-sub { opacity: 0.75; }
      .smp-row.on .smp-row-arrow { color: ${V}; transform: translateX(6px); }
      .smp-row.on .smp-row-more { background: ${V}; color: var(--c); animation: smp-spin 6s linear infinite; }
      .smp-row.on .smp-row-cursor { opacity: 1; transform: translateX(0); animation: smp-cursor .9s ease-in-out infinite; }
      @keyframes smp-cursor { 50% { transform: translateX(7px); } }
      @keyframes smp-spin { to { transform: rotate(360deg); } }

      .smp-row--compact { height: 56px; margin-bottom: 6px; }
      .smp-row--compact .smp-row-title { font-size: 22px; }
      .smp-row--compact .smp-row-sub { font-size: 11px; }
      .smp-row--compact .smp-row-more { width: 38px; height: 38px; font-size: 15px; }

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
          repeating-linear-gradient(-77deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 46px),
          rgba(5,5,7,0.84);
        animation: smp-fade .2s ease-out both;
      }
      @keyframes smp-fade { from { opacity: 0; } }
      .smp-picker {
        position: relative; width: 760px; max-height: 100%;
        display: flex; flex-direction: column;
        filter: drop-shadow(12px 12px 0 var(--accent));
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
      .smp-picker-head {
        display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; column-gap: 20px;
        margin-bottom: 16px;
      }
      .smp-picker-eyebrow { grid-column: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
      .smp-picker-eyebrow .sec {
        background: var(--accent); color: ${V}; font-weight: 700; font-size: 13px; letter-spacing: 0.24em;
        padding: 3px 12px; transform: skewX(-14deg);
      }
      .smp-picker-eyebrow .trail {
        font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.2em;
        color: rgba(245,243,235,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .smp-picker-title {
        grid-column: 1; margin: 6px 0 0; font-weight: 700; font-style: italic; text-transform: uppercase;
        font-size: 44px; line-height: 0.95; color: ${T};
        text-shadow: 4px 4px 0 var(--accent), 7px 7px 0 ${V};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .smp-picker-count {
        grid-column: 2; grid-row: 1 / span 2; align-self: end;
        font-weight: 700; font-style: italic; line-height: 0.9; transform: rotate(-3deg);
      }
      .smp-picker-count .cur { font-size: 46px; color: var(--accent); text-shadow: 3px 3px 0 ${V}; }
      .smp-picker-count .sep { font-size: 28px; margin: 0 3px; }
      .smp-picker-count .tot { font-size: 24px; }
      .smp-picker-list {
        flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding: 8px 6px 12px 46px; scrollbar-width: none;
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

      @keyframes smp-swipe-in { from { opacity: 0; transform: translateX(60px) skewX(-14deg); } }

      @media (prefers-reduced-motion: reduce) {
        .smp *, .smp *::before, .smp *::after { animation-duration: 0.001s !important; animation-delay: 0s !important; transition-duration: 0.001s !important; }
        .smp-intro { display: none; }
      }
    `}</style>
  );
}
