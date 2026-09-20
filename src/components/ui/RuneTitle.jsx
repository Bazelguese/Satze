import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Titolo che si decifra dalle rune delle carte.
 *
 * All'ingresso ogni lettera è una runa che sfarfalla e poi si fissa nel testo,
 * da sinistra a destra. A riposo resta il testo; ogni tanto una lettera torna
 * runa per un istante. Le rune sono le stesse della fascia delle carte
 * (CardReworkP4). La lettera resta nel flusso (trasparente) sotto la runa,
 * così la larghezza del titolo non cambia mai.
 */

export const CARD_RUNES = [
  'M -3 -3 L 3 -3 L 0 3 Z',
  'M -3 0 L 0 -3 L 3 0 L 0 3 Z',
  'M -3 -3 L 3 3 M -3 3 L 3 -3',
  'M -3 0 L 3 0 M 0 -3 L 0 3',
  'M -3 -2 L 3 -2 M -3 2 L 3 2',
  'M 0 -3 L 3 0 L 0 3 L -3 0 Z',
  'M -3 -3 L 3 -3 M 0 -3 L 0 3',
  'M -3 -3 L -3 3 L 3 0 Z',
  'M -3 -3 L 3 -3 L 3 3 L -3 3 Z M -3 0 L 3 0',
];

// nei titoli niente runa a T: si legge come una lettera
const TITLE_RUNES = CARD_RUNES.filter((_, i) => i !== 6);

const STEP_MS = 55;      // una lettera decifrata ogni STEP_MS
const SCRAMBLE_MS = 70;  // cambio di runa mentre una lettera non è ancora fissata

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/*
 * Progresso globale della decifrazione (0..1). Durante la smazzata il duello
 * lo fa salire con le carte consegnate in mano: finché è 0 i titoli sono solo
 * rune che cambiano, poi si decifrano un po' alla volta fino all'ultima carta.
 * Fuori dalla smazzata vale 1 e i titoli si decifrano all'ingresso del pannello.
 */
let decodeProgress = 1;
const listeners = new Set();
export function setRuneDecodeProgress(p) {
  const v = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 1));
  if (v === decodeProgress) return;
  decodeProgress = v;
  listeners.forEach((fn) => fn());
}
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getProgress = () => decodeProgress;

/**
 * @param {object} p
 * @param {string} p.text
 * @param {number} [p.delay]     ms dal montaggio prima che inizi la decifrazione (prima: solo rune)
 * @param {number} [p.stepMs]    ms per lettera
 * @param {number} [p.reverseAt] ms dal montaggio dopo cui le lettere tornano rune, da destra
 * @param {boolean} [p.global]   segue il progresso globale della smazzata (default true)
 */
export function RuneTitle({ text, className = '', delay = 0, stepMs = STEP_MS, reverseAt = null, global = true }) {
  const chars = useMemo(() => Array.from(String(text || '')), [text]);
  const progress = useSyncExternalStore(subscribe, getProgress, getProgress);
  const p = global ? progress : 1;
  const target = p >= 1 ? chars.length : Math.floor(p * chars.length);
  const [fixed, setFixed] = useState(() => (reduceMotion() && reverseAt == null ? chars.length : 0));
  const [runes, setRunes] = useState(() => chars.map((_, i) => i % TITLE_RUNES.length));
  const [flicker, setFlicker] = useState(-1);
  const fixedRef = useRef(fixed);
  const charsRef = useRef(chars);
  const mountRef = useRef(0);

  // decifrazione: le lettere non fissate cambiano runa di continuo; si fissano
  // una alla volta, da sinistra, fino al traguardo (progresso, ritardo, ritorno)
  useEffect(() => {
    if (!mountRef.current) mountRef.current = performance.now();
    if (charsRef.current !== chars) { charsRef.current = chars; fixedRef.current = 0; setFixed(0); }
    if (reduceMotion()) {
      const v = reverseAt != null ? chars.length : target;
      fixedRef.current = v; setFixed(v);
      if (reverseAt == null) return undefined;
      const t = window.setTimeout(() => { fixedRef.current = 0; setFixed(0); }, reverseAt);
      return () => window.clearTimeout(t);
    }
    if (target < fixedRef.current && reverseAt == null) { fixedRef.current = target; setFixed(target); } // nuova smazzata
    let raf = 0;
    let lastStep = 0;
    let lastScramble = 0;
    const tick = (now) => {
      const age = now - mountRef.current;
      const reversing = reverseAt != null && age >= reverseAt;
      const goal = reversing ? 0 : age < delay ? 0 : target;
      if (fixedRef.current !== goal && now - lastStep >= stepMs) {
        lastStep = now;
        fixedRef.current += goal > fixedRef.current ? 1 : -1;
        setFixed(fixedRef.current);
      }
      if (now - lastScramble > SCRAMBLE_MS) {
        lastScramble = now;
        setRunes(chars.map(() => Math.floor(Math.random() * TITLE_RUNES.length)));
      }
      const done = fixedRef.current >= chars.length && (reverseAt == null || reversing);
      const gone = reversing && fixedRef.current === 0 && age > reverseAt + 1500;
      if (!done && !gone) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chars, target, delay, stepMs, reverseAt]);

  // a riposo: ogni 4–7 s una lettera torna runa per un attimo
  useEffect(() => {
    if (fixed < chars.length || reduceMotion()) return undefined;
    let t1 = 0;
    let t2 = 0;
    const schedule = () => {
      t1 = window.setTimeout(() => {
        const letters = chars.map((c, i) => (c.trim() ? i : -1)).filter((i) => i >= 0);
        const i = letters[Math.floor(Math.random() * letters.length)];
        setRunes((r) => r.map((v, k) => (k === i ? Math.floor(Math.random() * TITLE_RUNES.length) : v)));
        setFlicker(i);
        t2 = window.setTimeout(() => { setFlicker(-1); schedule(); }, 170);
      }, 4000 + Math.random() * 3000);
    };
    schedule();
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [fixed, chars]);

  const renderCh = (c, i) => {
    const showRune = i >= fixed || i === flicker;
    return (
      <span
        key={i}
        aria-hidden
        className={`rune-title-ch${showRune ? ' is-rune' : ''}${i === fixed - 1 ? ' is-landed' : ''}`}
      >
        {c}
        {showRune && (
          <svg className="rune-title-glyph" viewBox="-4 -4 8 8" aria-hidden>
            <path d={TITLE_RUNES[runes[i] % TITLE_RUNES.length]} />
          </svg>
        )}
      </span>
    );
  };
  // parole indivisibili, spazi veri tra una e l'altra: il titolo può andare a capo
  const words = [];
  chars.forEach((c, i) => {
    if (!c.trim()) { words.push(c); return; }
    const last = words[words.length - 1];
    if (Array.isArray(last)) last.push(i); else words.push([i]);
  });
  return (
    <span className={`rune-title ${className}`} aria-label={text}>
      {words.map((w, k) => (Array.isArray(w)
        ? <span key={k} className="rune-title-word">{w.map((i) => renderCh(chars[i], i))}</span>
        : w))}
    </span>
  );
}

export default RuneTitle;
