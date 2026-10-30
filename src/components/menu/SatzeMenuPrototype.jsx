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

const STAR_CLIP =
  "polygon(50% 0%, 61% 18%, 82% 8%, 80% 30%, 100% 38%, 84% 54%, 96% 74%, 74% 76%, 70% 98%, 52% 84%, 34% 100%, 28% 78%, 4% 80%, 16% 60%, 0% 42%, 20% 32%, 14% 10%, 36% 18%)";

/** Versioni del menu da confrontare; ognuna mette il logo dove le lascia spazio. */
export const MENU_VARIANTS = {
  barra: { label: "Barra in basso", logo: { x: 960, y: 420, w: 900 } },
  mezzaGhiera: { label: "Mezza ghiera", logo: { x: 640, y: 520, w: 760 } },
  scalini: { label: "Scalini", logo: { x: 600, y: 500, w: 760 } },
  ventaglio: { label: "Carte a ventaglio", logo: { x: 960, y: 300, w: 720 } },
};

/* ------------------------------------------------------------------ */
/* Barra in basso (ispirazione Metaphor: ReFantazio)                   */
/* ------------------------------------------------------------------ */

/**
 * Voci in fila su una fascia nera in basso, separate da rune delle carte.
 * La voce scelta sale su targa crema con ombra d'accento; il sottotitolo
 * compare sopra la fascia.
 */
function BarMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const current = rows[active];
  const sub = current ? sublineOf(current) : "";
  return (
    <nav className={`mb ${rows.length > 7 ? "mb--dense" : ""}`} aria-label="Menu principale">
      <div className="mb-band" aria-hidden="true" />
      {sub && (
        <div className="mb-sub" key={`sub-${active}`}>
          <span>{sub}</span>
        </div>
      )}
      <div className="mb-items">
        {rows.map((row, i) => (
          <Fragment key={`${row.label}-${i}`}>
            {i > 0 && <Rune index={i * 3} className="mb-sep" />}
            <button
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              className={`mb-item ${i === active ? "on" : ""}`}
              style={{ "--c": row.accent, "--d": `${0.2 + i * 0.05}s` }}
              disabled={row.disabled}
              aria-current={i === active ? "true" : undefined}
              onMouseEnter={() => onHover(i)}
              onFocus={() => onHover(i)}
              onClick={() => onPick(i)}
            >
              <span className="mb-plate" aria-hidden="true" />
              <span className="mb-label">
                {row.label}
                {row.hasChoices && <span className="mb-more" aria-hidden="true">+</span>}
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Mezza ghiera                                                        */
/* ------------------------------------------------------------------ */

const ARC = { cx: 2080, cy: 540, r: 560 };

/**
 * Tutte le voci ferme su un arco corto di una ruota che esce dal bordo
 * destro; si sposta solo il puntatore (e l'anello di rune gira un poco).
 */
function HalfDialMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const { cx, cy, r } = ARC;
  const n = rows.length;
  const step = Math.min(10, 66 / Math.max(1, n - 1));
  const angleOf = (i) => (i - (n - 1) / 2) * step;
  const activeAngle = angleOf(active);
  const span = ((n - 1) / 2) * step + step * 0.6;
  const arcPoint = (deg, rad) => {
    const a = (deg * Math.PI) / 180;
    return [cx - rad * Math.cos(a), cy + rad * Math.sin(a)];
  };
  const [ax, ay] = arcPoint(-span, r - 2);
  const [bx, by] = arcPoint(span, r - 2);
  return (
    <nav className="mh" aria-label="Menu principale">
      <svg className="mh-ring" viewBox="0 0 1920 1080" aria-hidden="true">
        <circle className="mh-disc" cx={cx} cy={cy} r={r + 6} />
        <path className="mh-sector" d={`M ${ax} ${ay} A ${r - 2} ${r - 2} 0 0 0 ${bx} ${by}`} />
        <g className="mh-spin" style={{ transform: `rotate(${activeAngle * 1.5}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
          {Array.from({ length: 120 }, (_, i) => {
            const a = (i / 120) * Math.PI * 2;
            const long = i % 5 === 0;
            const r1 = r - 14 - (long ? 10 : 4);
            return (
              <line
                key={`t${i}`}
                className={long ? "mh-tick mh-tick--long" : "mh-tick"}
                x1={cx + Math.cos(a) * r1}
                y1={cy + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * (r - 14)}
                y2={cy + Math.sin(a) * (r - 14)}
              />
            );
          })}
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * 360;
            const x = cx + Math.cos((a * Math.PI) / 180) * (r - 46);
            const y = cy + Math.sin((a * Math.PI) / 180) * (r - 46);
            return (
              <path
                key={`r${i}`}
                className="mh-rune"
                d={CARD_RUNES[(i * 5) % CARD_RUNES.length]}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a + 90}) scale(2)`}
              />
            );
          })}
        </g>
        <g className="mh-needle" style={{ transform: `rotate(${-activeAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
          <path className="mh-pointer" d={`M ${cx - r + 12} ${cy} l 20 -12 l -5 12 l 5 12 z`} />
        </g>
      </svg>
      {rows.map((row, i) => {
        const deg = angleOf(i);
        const [x, y] = arcPoint(deg, r);
        const on = i === active;
        const sub = sublineOf(row);
        return (
          <div
            key={`${row.label}-${i}`}
            className={`mh-arm ${on ? "on" : ""}`}
            style={{ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${-deg}deg)`, "--c": row.accent }}
          >
            <button
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              className="mh-item"
              disabled={row.disabled}
              aria-current={on ? "true" : undefined}
              onMouseEnter={() => onHover(i)}
              onFocus={() => onHover(i)}
              onClick={() => onPick(i)}
            >
              <span className="mh-body">
                {on && <span className="mh-plate" key={`p-${active}`} aria-hidden="true" />}
                <span className="mh-label">{row.label}</span>
                {row.hasChoices && <span className="mh-more" aria-hidden="true">+</span>}
                {on && sub ? <span className="mh-sub" key={`s-${active}`}>{sub}</span> : null}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Scalini (ispirazione Persona 5)                                     */
/* ------------------------------------------------------------------ */

/**
 * Voci a scalini in diagonale sulla destra; la scelta prende una fascia
 * crema che corre fino al bordo dello schermo, con stella e sottotitolo.
 */
function StairsMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const n = rows.length;
  const rowH = n > 7 ? 80 : 98;
  const top = 540 - ((n - 1) * rowH) / 2;
  return (
    <nav className="ms" aria-label="Menu principale">
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
            className={`ms-item ${on ? "on" : ""}`}
            style={{
              top: top + i * rowH,
              right: 150 + i * 34,
              "--c": row.accent,
              "--t": `${i % 2 ? -3 : -6}deg`,
              "--d": `${0.15 + i * 0.05}s`,
            }}
            disabled={row.disabled}
            aria-current={on ? "true" : undefined}
            onMouseEnter={() => onHover(i)}
            onFocus={() => onHover(i)}
            onClick={() => onPick(i)}
          >
            {on && <span className="ms-band" key={`b-${active}`} aria-hidden="true" />}
            {on && <span className="ms-star" aria-hidden="true" />}
            <span className="ms-label">
              {row.label}
              {row.hasChoices && <span className="ms-more" aria-hidden="true">+</span>}
            </span>
            {on && sub ? <span className="ms-sub" key={`s-${active}`}>{sub}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Carte a ventaglio                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ogni voce è una carta: aperte a ventaglio sotto il logo. La scelta si
 * solleva e si gira mostrando il fronte con titolo e sottotitolo.
 */
function FanMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const n = rows.length;
  const spread = Math.min(9, 64 / Math.max(1, n - 1));
  return (
    <nav className="mf" aria-label="Menu principale">
      {rows.map((row, i) => {
        const on = i === active;
        const deg = (i - (n - 1) / 2) * spread;
        const sub = sublineOf(row);
        return (
          <button
            key={`${row.label}-${i}`}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            className={`mf-slot ${on ? "on" : ""}`}
            style={{ transform: `rotate(${deg}deg)`, "--c": row.accent, "--d": `${0.15 + i * 0.05}s`, zIndex: on ? 50 : i }}
            disabled={row.disabled}
            aria-label={[row.label, sub].filter(Boolean).join(" · ")}
            aria-current={on ? "true" : undefined}
            onMouseEnter={() => onHover(i)}
            onFocus={() => onHover(i)}
            onClick={() => onPick(i)}
          >
            <span className="mf-card">
              <span className="mf-face mf-back" aria-hidden="true">
                <Rune index={i * 5} className="mf-back-rune" />
                <span className="mf-back-label">{row.label}</span>
              </span>
              <span className="mf-face mf-front" aria-hidden="true">
                <Rune index={i * 5} className="mf-front-rune" />
                <span className="mf-front-label">{row.label}</span>
                {sub && <span className="mf-front-sub">{sub}</span>}
                {row.hasChoices && <span className="mf-more">+</span>}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const VARIANT_VIEWS = { barra: BarMenu, mezzaGhiera: HalfDialMenu, scalini: StairsMenu, ventaglio: FanMenu };

/* ------------------------------------------------------------------ */
/* Pannello delle sotto-scelte (comune a tutte le versioni)            */
/* ------------------------------------------------------------------ */

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
 * Menu principale. Quattro versioni da confrontare (`variant`): barra in
 * basso, mezza ghiera, scalini e carte a ventaglio. Logica comune: voce
 * scelta, tastiera (frecce in entrambe le direzioni, Invio/Spazio, Esc),
 * rotella del mouse, passaggio del mouse, sotto-scelte in un pannello.
 * Logo animato e pioggia di carte restano sullo sfondo in tutte.
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
 * }>, buildLabel?: string, inputLocked?: boolean, variant?: keyof typeof MENU_VARIANTS }} props
 */
export default function SatzeMenuPrototype({ menuItems, buildLabel, inputLocked = false, variant = "barra" }) {
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
  const config = MENU_VARIANTS[variant] ?? MENU_VARIANTS.barra;
  const View = VARIANT_VIEWS[variant] ?? BarMenu;

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
    { keys: variant === "barra" || variant === "ventaglio" ? ["←", "→"] : ["↑", "↓"], label: "VOCE" },
    { keys: ["INVIO"], label: "SCEGLI" },
    ...(choicePicker ? [{ keys: ["ESC"], label: choicePickerStack.length > 1 ? "INDIETRO" : "ANNULLA" }] : []),
  ];

  const activeAccent = items[mainActive]?.accent ?? MENU_ACCENTS.magenta;

  return (
    <div
      ref={rootRef}
      className={`satze-menu-v5-root smp smp--${variant}`}
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

      <div className="smp-brand" style={{ left: config.logo.x, top: config.logo.y, width: config.logo.w + 100 }}>
        <AnimatedSatzeLogo
          reducedMotion={vfxProfile.quality === "low"}
          paused={inputLocked || Boolean(choicePicker)}
          strength={vfxProfile.quality === "medium" ? 0.7 : 1}
          style={{ width: config.logo.w, maxWidth: "100%", pointerEvents: "none" }}
        />
      </div>

      <View
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
      .smp-bg-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 42%, #2a0a3a 0%, #14051f 40%, ${V} 80%); }
      .smp-bg-halftone {
        position: absolute; inset: 0; z-index: 2; opacity: var(--halftone);
        background-image: radial-gradient(circle, var(--active) 1.4px, transparent 1.8px);
        background-size: 11px 11px;
        -webkit-mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
        mask-image: linear-gradient(200deg, transparent 50%, #000 90%);
      }
      .smp-brand {
        position: absolute; z-index: 10; display: flex; flex-direction: column; align-items: center;
        transform: translate(-50%, -50%) rotate(-3deg); pointer-events: none;
      }

      /* ========== Barra in basso ========== */
      .mb { position: absolute; left: 0; right: 0; bottom: 70px; height: 170px; z-index: 12; }
      .mb-band {
        position: absolute; left: -60px; right: -60px; bottom: 0; height: 86px;
        background: ${V}; transform: rotate(-1.2deg);
        border-top: 4px solid var(--active); box-shadow: 0 -24px 60px rgba(0,0,0,0.65);
        transition: border-color .3s;
        animation: mb-band-in .55s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes mb-band-in { from { transform: rotate(-1.2deg) translateY(140px); } }
      .mb-items {
        position: absolute; left: 0; right: 0; bottom: 0; height: 86px;
        display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 60px;
        transform: rotate(-1.2deg);
      }
      .mb-sep { color: color-mix(in srgb, var(--active) 70%, transparent); font-size: 14px; }
      .mb-item {
        position: relative; height: 86px; padding: 0 20px; border: 0; background: transparent; cursor: pointer;
        color: ${T}; outline: none; animation: mb-item-in .45s var(--d, .2s) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes mb-item-in { from { opacity: 0; transform: translateY(40px); } }
      .mb-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .mb-label {
        position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 10px;
        font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 30px; letter-spacing: 0.02em; white-space: nowrap;
        text-shadow: 3px 3px 0 #000;
        transition: transform .25s cubic-bezier(.3,1.6,.5,1), color .15s;
      }
      .mb--dense .mb-label { font-size: 23px; }
      .mb--dense .mb-item { padding: 0 10px; }
      .mb--dense .mb-items { gap: 4px; padding: 0 70px; }
      .mb-item:not(.on):not(:disabled):hover .mb-label { color: var(--c); }
      .mb-plate {
        position: absolute; left: 4px; right: 4px; top: 6px; bottom: 6px; z-index: 0;
        background: ${T}; clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
        filter: drop-shadow(6px 6px 0 var(--c));
        transform: translateY(26px) scaleY(0); transform-origin: bottom;
        transition: transform .28s cubic-bezier(.2,1.4,.4,1);
      }
      .mb-item.on .mb-plate { transform: translateY(-18px) scaleY(1); }
      .mb-item.on .mb-label { color: ${V}; text-shadow: none; transform: translateY(-18px); }
      .mb-more {
        display: grid; place-items: center; width: 24px; height: 24px; font-style: normal; font-size: 18px;
        background: var(--c); color: ${V}; clip-path: ${STAR_CLIP};
      }
      .mb-item.on .mb-more { background: ${V}; color: var(--c); }
      .mb-sub {
        position: absolute; left: 50%; bottom: 112px; transform: translateX(-50%) rotate(-1.2deg);
        animation: mb-sub-in .3s cubic-bezier(.2,1.2,.4,1) both;
      }
      .mb-sub > span {
        display: inline-block; background: var(--active); color: ${V};
        font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.26em; white-space: nowrap;
        padding: 5px 16px; clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
      }
      @keyframes mb-sub-in { from { opacity: 0; transform: translateX(-50%) rotate(-1.2deg) translateY(10px); } }

      /* ========== Mezza ghiera ========== */
      .mh { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
      .mh-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; animation: mh-in .7s cubic-bezier(.2,.9,.25,1) both; transform-origin: ${ARC.cx}px ${ARC.cy}px; }
      @keyframes mh-in { from { opacity: 0; transform: rotate(-20deg); } }
      .mh-disc { fill: ${V}; stroke: color-mix(in srgb, ${T} 30%, transparent); stroke-width: 3; filter: drop-shadow(0 0 60px rgba(0,0,0,0.9)); }
      .mh-sector { fill: none; stroke: var(--active); stroke-width: 9; stroke-linecap: round; transition: stroke .3s; }
      .mh-spin, .mh-needle { transition: transform .45s cubic-bezier(.2,1.2,.35,1); }
      .mh-tick { stroke: color-mix(in srgb, ${T} 30%, transparent); stroke-width: 1.5; }
      .mh-tick--long { stroke: ${T}; stroke-width: 2.2; }
      .mh-rune { fill: none; stroke: var(--active); stroke-width: 1.3; stroke-linejoin: round; vector-effect: non-scaling-stroke; opacity: 0.7; transition: stroke .3s; }
      .mh-pointer { fill: var(--active); stroke: ${T}; stroke-width: 2; transition: fill .3s; }
      .mh-arm { position: absolute; left: 0; top: 0; width: 0; height: 0; }
      .mh-item {
        position: absolute; right: 34px; top: 0; transform: translateY(-50%); pointer-events: auto;
        border: 0; padding: 0; background: transparent; color: ${T}; cursor: pointer; outline: none;
        animation: mh-item-in .4s cubic-bezier(.2,1.2,.4,1) backwards;
      }
      .mh-item:disabled { cursor: not-allowed; opacity: 0.4; }
      @keyframes mh-item-in { from { opacity: 0; transform: translate(60px, -50%); } }
      .mh-body {
        position: relative; display: inline-flex; flex-direction: row-reverse; align-items: center; gap: 10px; padding: 6px 14px;
        font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 34px; line-height: 1; white-space: nowrap;
        transform: scale(0.8); transform-origin: right center; opacity: 0.78;
        transition: transform .3s cubic-bezier(.3,1.5,.5,1), opacity .2s;
      }
      .mh-label { position: relative; z-index: 1; text-shadow: 3px 3px 0 ${V}; }
      .mh-item:hover .mh-body { opacity: 1; }
      .mh-arm.on .mh-body { transform: scale(1.18); opacity: 1; }
      .mh-arm.on .mh-label { color: ${V}; text-shadow: none; }
      .mh-plate {
        position: absolute; inset: -2px -14px; z-index: 0; background: ${T};
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        filter: drop-shadow(6px 5px 0 var(--c)); transform-origin: right center;
        animation: mh-plate-in .28s cubic-bezier(.2,1.3,.4,1) both;
      }
      @keyframes mh-plate-in { from { transform: scaleX(0); } }
      .mh-more { position: relative; z-index: 1; display: grid; place-items: center; width: 26px; height: 26px; font-style: normal; font-size: 20px; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .mh-arm.on .mh-more { background: ${V}; color: var(--c); }
      .mh-sub {
        position: absolute; z-index: 2; right: 6px; top: calc(100% + 4px);
        background: var(--c); color: ${V}; font-family: 'Share Tech Mono', monospace; font-style: normal; font-weight: 400;
        font-size: 11px; letter-spacing: 0.2em; padding: 3px 10px; white-space: nowrap;
        clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
        animation: mb-fade .3s .1s both;
      }
      @keyframes mb-fade { from { opacity: 0; } }

      /* ========== Scalini ========== */
      .ms { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
      .ms-item {
        position: absolute; transform: translateY(-50%) rotate(var(--t)); transform-origin: right center; pointer-events: auto;
        display: inline-flex; align-items: center; gap: 12px; padding: 4px 6px;
        border: 0; background: transparent; color: ${T}; cursor: pointer; outline: none; text-align: right;
        animation: ms-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes ms-in { from { opacity: 0; transform: translateY(-50%) rotate(var(--t)) translateX(200px); } }
      .ms-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .ms-label {
        position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 10px;
        font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 42px; line-height: 1; white-space: nowrap;
        text-shadow: 4px 4px 0 #000; transition: transform .22s cubic-bezier(.3,1.6,.5,1), color .15s;
      }
      .ms-item:not(.on):not(:disabled):hover .ms-label { color: var(--c); transform: translateX(-8px); }
      .ms-item.on .ms-label { color: ${V}; text-shadow: none; transform: translateX(-14px) scale(1.06); }
      .ms-band {
        position: absolute; z-index: 0; left: -26px; right: -900px; top: -6px; bottom: -6px;
        background: ${T}; clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%);
        filter: drop-shadow(8px 7px 0 var(--c));
        transform-origin: right center; animation: ms-band-in .3s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes ms-band-in { from { transform: scaleX(0); } }
      .ms-star {
        position: absolute; z-index: 2; left: -70px; top: 50%; width: 48px; height: 48px; margin-top: -24px;
        background: var(--c); clip-path: ${STAR_CLIP}; filter: drop-shadow(3px 3px 0 ${T});
        animation: ms-star .3s cubic-bezier(.2,1.6,.4,1) both, ms-spin 3.5s linear .3s infinite;
      }
      @keyframes ms-star { from { transform: scale(0) rotate(-120deg); } }
      @keyframes ms-spin { to { transform: rotate(360deg); } }
      .ms-more { display: grid; place-items: center; width: 30px; height: 30px; font-style: normal; font-size: 22px; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .ms-item.on .ms-more { background: ${V}; color: var(--c); }
      .ms-sub {
        position: absolute; z-index: 2; right: 20px; top: calc(100% + 6px);
        background: ${V}; color: var(--c); font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.22em;
        padding: 4px 12px; white-space: nowrap; animation: mb-fade .3s .12s both;
      }

      /* ========== Carte a ventaglio ========== */
      .mf { position: absolute; inset: 0; z-index: 12; pointer-events: none; perspective: 1600px; }
      .mf-slot {
        position: absolute; left: 860px; top: 600px; width: 200px; height: 280px; padding: 0; border: 0; background: transparent;
        cursor: pointer; outline: none; pointer-events: auto;
        transform-origin: 100px 1000px; perspective: 1200px;
        animation: mf-in .55s var(--d) cubic-bezier(.2,1.1,.35,1) backwards;
      }
      @keyframes mf-in { from { opacity: 0; transform: rotate(0deg) translateY(300px); } }
      .mf-slot:disabled { cursor: not-allowed; opacity: 0.45; }
      .mf-card {
        position: absolute; inset: 0; transform-style: preserve-3d;
        transition: transform .45s cubic-bezier(.2,1.1,.35,1);
      }
      .mf-slot:not(.on):not(:disabled):hover .mf-card { transform: translateY(-18px); }
      .mf-slot.on .mf-card { transform: translateY(-90px) scale(1.16) rotateY(180deg); }
      .mf-face {
        position: absolute; inset: 0; border-radius: 12px; overflow: hidden;
        backface-visibility: hidden; -webkit-backface-visibility: hidden;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 18px 14px;
        box-shadow: 0 18px 40px rgba(0,0,0,0.6);
      }
      .mf-back {
        background:
          radial-gradient(circle, color-mix(in srgb, var(--c) 40%, transparent) 1.2px, transparent 1.6px) 0 0 / 10px 10px,
          radial-gradient(ellipse at 50% 35%, #1d1028, ${V} 75%);
        border: 2px solid color-mix(in srgb, var(--c) 70%, transparent);
        box-shadow: inset 0 0 0 7px ${V}, inset 0 0 0 8px color-mix(in srgb, var(--c) 45%, transparent), 0 18px 40px rgba(0,0,0,0.6);
      }
      .mf-back-rune { font-size: 70px; color: var(--c); filter: drop-shadow(0 0 10px var(--c)); }
      .mf-back-label {
        position: absolute; left: 12px; right: 12px; bottom: 16px; text-align: center;
        font-weight: 700; font-style: italic; font-size: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: ${T};
        background: ${V}; padding: 4px 6px; transform: skewX(-10deg);
      }
      .mf-front {
        transform: rotateY(180deg); background: ${T}; color: ${V};
        box-shadow: inset 0 0 0 6px ${T}, inset 0 0 0 9px var(--c), 10px 12px 0 var(--c), 0 24px 50px rgba(0,0,0,0.7);
      }
      .mf-front-rune { font-size: 44px; color: var(--c); }
      .mf-front-label {
        font-weight: 700; font-style: italic; font-size: 26px; line-height: 1; text-transform: uppercase; text-align: center;
        text-shadow: 2px 2px 0 var(--c); overflow-wrap: anywhere;
      }
      .mf-front-sub {
        font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-align: center; line-height: 1.4;
        background: ${V}; color: ${T}; padding: 3px 6px;
      }
      .mf-more { position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 26px; height: 26px; font-size: 20px; background: ${V}; color: var(--c); clip-path: ${STAR_CLIP}; }

      /* ========== Pannello sotto-scelte ========== */
      .mp-backdrop {
        position: absolute; inset: 0; z-index: 100;
        display: flex; align-items: center; justify-content: center; padding: 60px 24px 80px;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent) 1.3px, transparent 1.7px) 0 0 / 11px 11px, rgba(5,5,7,0.86);
        animation: mb-fade .2s ease-out both;
      }
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
