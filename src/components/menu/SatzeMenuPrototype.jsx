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

/**
 * Schizzo di vernice nuovo per ogni seme (viewBox 300×180): bordo morbido
 * con un numero variabile di punte lunghe in direzioni casuali, gocce
 * sparse attorno, inclinazione e verso diversi.
 */
function makeSplash(seed) {
  const n = 26 + Math.floor(rnd(seed) * 10);
  const spikes = new Set();
  const spikeCount = 3 + Math.floor(rnd(seed + 1) * 4);
  for (let k = 0; k < spikeCount; k += 1) spikes.add(Math.floor(rnd(seed + 10 + k) * n));
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = spikes.has(i) ? 1.25 + rnd(seed + 40 + i) * 0.55 : 0.68 + rnd(seed + 80 + i) * 0.3;
    pts.push([150 + Math.cos(a) * 118 * r, 90 + Math.sin(a) * 56 * r]);
  }
  // curve morbide tra i punti medi: bordo da vernice, non da poligono
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const f = (v) => v.toFixed(1);
  let d = `M ${mid(pts[n - 1], pts[0]).map(f).join(" ")}`;
  for (let i = 0; i < n; i += 1) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q ${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  const dropCount = 3 + Math.floor(rnd(seed + 3) * 5);
  const drops = Array.from({ length: dropCount }, (_, k) => {
    const a = rnd(seed + 200 + k) * Math.PI * 2;
    const dist = 1.15 + rnd(seed + 300 + k) * 0.5;
    return { cx: 150 + Math.cos(a) * 130 * dist, cy: 90 + Math.sin(a) * 66 * dist, r: 2.5 + rnd(seed + 400 + k) * 8 };
  });
  return { d, drops, rot: -14 + rnd(seed + 5) * 22, flip: rnd(seed + 6) > 0.5 ? -1 : 1 };
}

/** Macchia nuova a ogni cambio di voce (anche tornando sulla stessa). */
function useSplash(active) {
  return useMemo(() => makeSplash(Math.floor(Math.random() * 100000)), [active]);
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
  const splash = useSplash(active);
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
                {on && <Splash splash={splash} className="mb-splash" />}
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

/**
 * Parole impilate (impaginazione Metaphor): voci in colonna a sinistra,
 * grandi e sovrapposte; la scelta è enorme su una macchia, le vicine medie,
 * le altre piccole. Logo a destra.
 */
function StackMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const splash = useSplash(active);
  return (
    <nav className="mi" aria-label="Menu principale">
      <div className="mi-col">
        {rows.map((row, i) => {
          const d = Math.abs(i - active);
          const on = d === 0;
          const size = on ? fitSize(row.label, 900, 124) : d === 1 ? fitSize(row.label, 640, 62) : fitSize(row.label, 520, 44);
          const sub = sublineOf(row);
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
              {on && sub ? <span className="mi-sub" key={`s-${active}`}>{sub}</span> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Lista sul taglio (impaginazione Persona 3 Portable): una lama crema
 * attraversa lo schermo in diagonale; la lista scorre sotto e la voce
 * scelta si ferma sulla lama, grande, sopra una macchia.
 */
function SliceMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const splash = useSplash(active);
  const rowH = 74;
  const current = rows[active];
  const sub = current ? sublineOf(current) : "";
  return (
    <nav className="mt" aria-label="Menu principale">
      <div className="mt-stack">
        <div className="mt-bar" aria-hidden="true" />
        {sub && (
          <div className="mt-sub" key={`s-${active}`} aria-hidden="true" style={{ "--c": current.accent }}>
            {sub}
          </div>
        )}
        <div className="mt-rail" style={{ transform: `translateY(${-active * rowH}px)` }}>
          {rows.map((row, i) => {
            const d = Math.abs(i - active);
            const on = d === 0;
            return (
              <button
                key={`${row.label}-${i}`}
                {...entryProps(row, i, active, buttonRefs, onHover, onPick)}
                tabIndex={d > 4 ? -1 : 0}
                className={`mt-item ${on ? "on" : ""}`}
                style={{
                  top: i * rowH,
                  "--c": row.accent,
                  "--o": on ? 1 : d > 4 ? 0 : Math.max(0.2, 0.9 - 0.18 * d),
                  "--fs": `${on ? fitSize(row.label, 820, 92) : 38}px`,
                }}
              >
                {on && <Splash splash={splash} className="mt-splash" />}
                <span className="mt-label">
                  {row.label}
                  {row.hasChoices && <span className="mt-more" aria-hidden="true">+</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Colonna sotto il logo (impaginazione Weird West): logo in alto a
 * sinistra, voci su targhe dipinte impilate sotto; la scelta diventa crema,
 * si sposta in fuori con una macchia e una runa che gira.
 */
function ColumnMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const splash = useSplash(active);
  return (
    <nav className={`mc ${rows.length > 7 ? "mc--dense" : ""}`} aria-label="Menu principale">
      {rows.map((row, i) => {
        const on = i === active;
        const sub = sublineOf(row);
        return (
          <button
            key={`${row.label}-${i}`}
            {...entryProps(row, i, active, buttonRefs, onHover, onPick)}
            className={`mc-item ${on ? "on" : ""}`}
            style={{ "--c": row.accent, "--x": `${[0, 10, 4, 14, 2, 12, 6, 16, 8][i % 9]}px`, "--d": `${0.15 + i * 0.05}s` }}
          >
            {on && <Splash splash={splash} className="mc-splash" />}
            {on && <Rune index={i * 5} className="mc-cursor" />}
            <span className="mc-plate" aria-hidden="true" />
            <span className="mc-label">
              {row.label}
              {row.hasChoices && <span className="mc-more" aria-hidden="true">+</span>}
            </span>
            {on && sub ? <span className="mc-sub" key={`s-${active}`}>{sub}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Logo in diagonale, lista a destra (impaginazione Sunset Overdrive /
 * Dishonored): una fascia nera dipinta taglia l'angolo in alto a sinistra
 * con il logo; a destra un'etichetta verticale e le voci su targhe scure,
 * la scelta crema con macchia.
 */
function DiagonalMenu({ rows, active, buttonRefs, onHover, onPick }) {
  const splash = useSplash(active);
  return (
    <nav className="md" aria-label="Menu principale">
      <div className="md-band" aria-hidden="true" />
      <div className="md-panel">
        <div className="md-tag" aria-hidden="true">
          <span>MENÙ</span>
        </div>
        <div className="md-list">
          {rows.map((row, i) => {
            const on = i === active;
            const sub = sublineOf(row);
            return (
              <button
                key={`${row.label}-${i}`}
                {...entryProps(row, i, active, buttonRefs, onHover, onPick)}
                className={`md-item ${on ? "on" : ""}`}
                style={{ "--c": row.accent, "--w": `${[96, 88, 100, 91, 97, 86, 94, 90, 99][i % 9]}%`, "--d": `${0.2 + i * 0.05}s` }}
              >
                {on && <Splash splash={splash} className="md-splash" />}
                <span className="md-plate" aria-hidden="true" />
                <span className="md-label">
                  {row.label}
                  {row.hasChoices && <span className="md-more" aria-hidden="true">+</span>}
                </span>
                {on && sub ? <span className="md-sub" key={`s-${active}`}>{sub}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Impaginazioni da confrontare; ognuna mette il logo dove le lascia spazio. */
export const MENU_VARIANTS = {
  barra: { label: "Barra", view: BarMenu, logo: { x: 960, y: 330, w: 820 }, keys: ["←", "→"] },
  impilate: { label: "Parole impilate", view: StackMenu, logo: { x: 1390, y: 440, w: 760 }, keys: ["↑", "↓"] },
  taglio: { label: "Lista sul taglio", view: SliceMenu, logo: { x: 390, y: 190, w: 560 }, keys: ["↑", "↓"] },
  colonna: { label: "Colonna sotto il logo", view: ColumnMenu, logo: { x: 430, y: 220, w: 640 }, keys: ["↑", "↓"] },
  diagonale: { label: "Logo in diagonale", view: DiagonalMenu, logo: { x: 520, y: 250, w: 660 }, keys: ["↑", "↓"] },
};

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
 * Menu principale — cinque impaginazioni da confrontare (`variant`), stesso
 * stile a pennellate e macchie. Logo animato e pioggia di carte sullo
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

  const choicePicker = choicePickerStack[choicePickerStack.length - 1] ?? null;
  const config = MENU_VARIANTS[variant] ?? MENU_VARIANTS.barra;
  const View = config.view;

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
    { keys: config.keys, label: "VOCE" },
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
      <BrushFilters />
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
        key={variant}
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
        position: absolute; z-index: 10;
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
      .mb-splash { --sy: -64%; }

      /* ========== Parole impilate ========== */
      .mi { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
      .mi-col {
        position: absolute; left: 90px; top: 500px; transform: translateY(-50%) rotate(-7deg); transform-origin: left center;
        display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
      }
      .mi-item {
        position: relative; display: inline-flex; flex-direction: column; align-items: flex-start;
        margin: 0; padding: 0 0 0 var(--x); border: 0; background: transparent; cursor: pointer; pointer-events: auto; outline: none;
        color: ${T}; opacity: var(--o); transition: opacity .25s;
        animation: mi-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes mi-in { from { opacity: 0; transform: translateX(-120px); } }
      .mi-item:disabled { cursor: not-allowed; }
      .mi-label {
        position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 14px;
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase; font-size: var(--fs);
        line-height: 1.04; letter-spacing: -0.02em; white-space: nowrap;
        text-shadow: 4px 4px 0 #000; transition: font-size .3s cubic-bezier(.2,1.1,.35,1), color .15s;
      }
      .mi-item:not(.on):hover .mi-label { color: var(--c); }
      .mi-item.on .mi-label { text-shadow: 6px 6px 0 #000, 10px 10px 0 color-mix(in srgb, var(--c) 60%, #000); }
      .mi-splash { --sw: calc(100% + 240px); --sh: 260%; --sy: -54%; }
      .mi-more { display: grid; place-items: center; width: 0.5em; height: 0.5em; min-width: 22px; min-height: 22px; font-size: 0.4em; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .mi-sub {
        position: relative; z-index: 2; margin: 10px 0 6px 14px; background: ${T}; color: ${V};
        font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.24em; padding: 5px 14px; white-space: nowrap;
        clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%); animation: mb-sub-in .3s .1s both;
      }

      /* ========== Lista sul taglio ========== */
      .mt { position: absolute; inset: 0; z-index: 12; pointer-events: none; overflow: hidden; }
      .mt-stack { position: absolute; left: 980px; top: 600px; width: 0; height: 0; transform: rotate(-11deg); }
      .mt-bar {
        position: absolute; left: -1500px; right: -1500px; width: 3000px; top: -54px; height: 108px;
        background: ${T}; filter: url(#smp-brush); box-shadow: 0 12px 0 -4px var(--active);
        animation: mt-bar-in .55s cubic-bezier(.2,1,.3,1) both; transition: box-shadow .3s;
      }
      @keyframes mt-bar-in { from { transform: scaleX(0); } }
      .mt-rail { position: absolute; left: -520px; top: 0; transition: transform .38s cubic-bezier(.2,1.1,.35,1); }
      .mt-item {
        position: absolute; left: 0; transform: translateY(-50%); pointer-events: auto;
        display: inline-flex; align-items: center; border: 0; padding: 0; background: transparent; cursor: pointer; outline: none;
        color: ${T}; opacity: var(--o); transition: opacity .3s;
      }
      .mt-item:disabled { cursor: not-allowed; }
      .mt-label {
        position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 12px; white-space: nowrap;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-style: italic; text-transform: uppercase; font-size: var(--fs);
        line-height: 1; text-shadow: 3px 3px 0 #000; transition: font-size .3s cubic-bezier(.2,1.1,.35,1);
      }
      .mt-item:not(.on):hover .mt-label { color: var(--c); }
      .mt-item.on .mt-label {
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-style: normal; letter-spacing: -0.02em;
        color: ${T}; text-shadow: 4px 4px 0 #000;
      }
      .mt-splash { --sw: calc(100% + 160px); --sh: 170%; }
      .mt-more { display: grid; place-items: center; width: 26px; height: 26px; font-size: 20px; font-style: normal; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .mt-sub {
        position: absolute; left: 330px; top: 26px; white-space: nowrap;
        font-family: 'Share Tech Mono', monospace; font-size: 15px; letter-spacing: 0.26em; color: ${V};
        animation: mb-sub-in .3s .12s both;
      }

      /* ========== Colonna sotto il logo ========== */
      .mc { position: absolute; left: 150px; top: 430px; z-index: 12; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
      .mc--dense { gap: 2px; }
      .mc-item {
        position: relative; display: inline-flex; align-items: center; margin-left: var(--x); padding: 8px 30px 8px 24px;
        border: 0; background: transparent; cursor: pointer; outline: none; color: ${T};
        transition: transform .22s cubic-bezier(.3,1.6,.5,1);
        animation: mi-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      .mc-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .mc-plate { position: absolute; inset: 0; z-index: 1; background: #0b0a10; filter: url(#smp-brush); box-shadow: 0 0 0 1px rgba(245,243,235,0.08); transition: background .15s; }
      .mc-label {
        position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 12px; white-space: nowrap;
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase; font-size: 38px; line-height: 1;
        opacity: 0.82; transition: color .15s, opacity .15s;
      }
      .mc--dense .mc-label { font-size: 30px; }
      .mc-item:not(.on):hover .mc-label { color: var(--c); opacity: 1; }
      .mc-item.on { transform: translateX(28px) rotate(-1.5deg); }
      .mc-item.on .mc-plate { background: ${T}; }
      .mc-item.on .mc-label { color: ${V}; opacity: 1; }
      .mc-splash { --sw: calc(100% + 120px); --sh: 210%; }
      .mc-cursor {
        position: absolute; z-index: 3; left: -46px; top: 50%; margin-top: -17px; font-size: 34px; color: var(--c);
        filter: drop-shadow(0 0 6px var(--c)); animation: mc-spin 3s linear infinite;
      }
      @keyframes mc-spin { to { transform: rotate(360deg); } }
      .mc-more { display: grid; place-items: center; width: 24px; height: 24px; font-size: 18px; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .mc-sub {
        position: absolute; z-index: 3; left: calc(100% + 18px); top: 50%; transform: translateY(-50%);
        background: var(--c); color: ${V}; font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.22em;
        padding: 5px 14px; white-space: nowrap; clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%); animation: mb-sub-in .3s .1s both;
      }

      /* ========== Logo in diagonale ========== */
      /* sotto il logo (z 10): la fascia nera sta dietro, la lista è a destra */
      .md { position: absolute; inset: 0; z-index: 9; pointer-events: none; }
      .md-band {
        position: absolute; left: -420px; top: -260px; width: 1700px; height: 760px; z-index: -1;
        background: ${V}; transform: rotate(-24deg); filter: url(#smp-brush);
        box-shadow: 0 18px 0 -2px var(--active), 0 30px 60px rgba(0,0,0,0.8);
        transition: box-shadow .3s; animation: md-band-in .6s cubic-bezier(.2,1,.3,1) both;
      }
      @keyframes md-band-in { from { transform: rotate(-24deg) translateY(-500px); } }
      .md-panel { position: absolute; left: 1090px; top: 540px; transform: translateY(-50%) rotate(-2deg); display: flex; align-items: stretch; gap: 18px; }
      .md-tag {
        position: relative; flex: none; display: grid; place-items: center; width: 74px;
        animation: mi-in .45s .1s both;
      }
      /* la pennellata sta sul fondo: il filtro sul testo lo deformerebbe */
      .md-tag::before { content: ''; position: absolute; inset: 0; background: ${V}; filter: url(#smp-brush); }
      .md-tag span { position: relative; }
      .md-tag span {
        writing-mode: vertical-rl; transform: rotate(180deg);
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 46px; letter-spacing: 0.2em; color: ${T};
        text-shadow: 3px 3px 0 var(--active);
      }
      .md-list { display: flex; flex-direction: column; gap: 6px; width: 600px; pointer-events: auto; }
      .md-item {
        position: relative; display: flex; align-items: center; width: var(--w); min-height: 64px; padding: 6px 26px;
        border: 0; background: transparent; cursor: pointer; outline: none; color: ${T}; text-align: left;
        transition: transform .22s cubic-bezier(.3,1.6,.5,1);
        animation: md-in .45s var(--d) cubic-bezier(.2,1.2,.4,1) backwards;
      }
      @keyframes md-in { from { opacity: 0; transform: translateX(160px); } }
      .md-item:disabled { cursor: not-allowed; opacity: 0.4; }
      .md-plate { position: absolute; inset: 0; z-index: 1; background: #0b0a10; filter: url(#smp-brush); transition: background .15s; }
      .md-label {
        position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 12px; white-space: nowrap;
        font-family: 'Cinzel', Georgia, serif; font-weight: 900; text-transform: uppercase; font-size: 32px; line-height: 1; opacity: 0.85;
      }
      .md-item:not(.on):hover .md-label { color: var(--c); opacity: 1; }
      .md-item.on { transform: translateX(-18px); }
      .md-item.on .md-plate { background: ${T}; }
      .md-item.on .md-label { color: ${V}; opacity: 1; }
      .md-splash { --sw: calc(100% + 80px); --sh: 190%; }
      .md-more { display: grid; place-items: center; width: 24px; height: 24px; font-size: 18px; background: var(--c); color: ${V}; clip-path: ${STAR_CLIP}; }
      .md-sub {
        position: absolute; z-index: 3; right: 16px; bottom: -12px;
        background: var(--c); color: ${V}; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.2em;
        padding: 3px 10px; white-space: nowrap; animation: mb-sub-in .3s .1s both;
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
