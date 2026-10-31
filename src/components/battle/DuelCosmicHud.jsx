import React, { useEffect, useRef } from 'react';
import { DISPLAY_SETTINGS_CHANGED_EVENT } from '../../settings/displaySettings';
import { getVfxQualityProfile } from '../../settings/vfxQualityProfile';
import { COSMO_FS, COSMO_VS } from './duelCosmicShaders';

/**
 * HUD cosmico del duello.
 *
 * Ogni pannello reale (stats, Anteprima, insegna di conquista, tabellone,
 * log/FC, pannello campo, round, uscita) riceve un proprio <canvas> come
 * figlio, dietro al contenuto: cos├¼ eredita trasformazioni 2.5D, respiro,
 * dissolvenze e flip del pannello senza calcoli. Un solo contesto WebGL
 * fuori schermo disegna, pannello per pannello, una finestra sul cosmo
 * (nebulosa e tre livelli di stelle in parallasse col mouse, bordo di luce,
 * costola d'accento) e la copia nel canvas del pannello.
 *
 * Il pannello campo al centro ├¿ un portale: ellisse con l'anteprima del campo,
 * cornice di anelli in rotazione continua e anello di avanzamento del round.
 * Il fondo di ogni pannello ├¿ spazio profondo sempre in moto: banchi di
 * nebulosa che scorrono e stelle che vengono incontro, come oltre un portale.
 * Sui box PV/FC corre un flusso di luce lungo il bordo, veloce per chi sta
 * agendo e lento per l'altro: a ogni PV perso si glitcha, e a soglie di PV (18, 12, 6) diventa
 * sempre pi├╣ rosso, spezzato e corrotto. Altri effetti: cosmo che si spegne
 * coi PV, impulso sugli FC spesi, sigillo runico sul campo conquistato (canvas sopra le righe del
 * tabellone), stella nel log a ogni evento.
 */

const W = 1920;
/** durata dell'apertura del portale (s): uguale all'animazione CSS bf-portal-open */
const PORTAL_INTRO_S = 0.9;
const H = 1080;
const PAD = 28; // alone fuori dal pannello

// argento freddo: il colore nel duello resta alle due armate (box PV/FC, sigilli, lampo)
const SILVER = '#b4bfd0';
/** cornice del portale quando tocca al giocatore scegliere */
const AMBER_HEX = '#f5c451';

// kind: 0 pannello ┬À 1 stats ┬À 2 log ┬À 3 portale (pannello campo con .satze-bf-portal-disc)
const PANEL_DEFS = [
  { sel: '.satze-stats-panel--enemy', acc: 'enemy', cut: 12, kind: 1, side: 0, seed: 0 },
  { sel: '.satze-stats-panel--player', acc: 'player', cut: 12, kind: 1, side: 1, seed: 1 },
  { sel: '.imp-preview', acc: SILVER, cut: 30, kind: 0, seed: 2 },
  { sel: '.imp-topbar', acc: SILVER, cut: 30, kind: 0, seed: 3 },
  { sel: '.imp-board', acc: SILVER, cut: 30, kind: 0, seed: 4 },
  { sel: '.satze-panel-flip-container', acc: SILVER, cut: 30, kind: 2, seed: 5 },
  { sel: '.satze-battlefield-panel', acc: SILVER, cut: 26, kind: 0, seed: 6, portal: true },
  { sel: '.hud-round', acc: SILVER, cut: 10, kind: 0, seed: 7 },
  { sel: '.hud-exit', acc: SILVER, cut: 8, kind: 0, seed: 8 },
];

function hexToRgb(hex, fallback = [0.75, 0.15, 0.83]) {
  if (!hex || typeof hex !== 'string') return fallback;
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return fallback;
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}
const AMBER = hexToRgb(AMBER_HEX);

/** soglie di corruzione del box PV/FC: integro sopra 18, poi Ôëñ18, Ôëñ12, Ôëñ6 */
function corruptionStage(hp, max) {
  const f = (hp ?? max) / max;
  if (f <= 0.24) return 3;
  if (f <= 0.48) return 2;
  if (f <= 0.72) return 1;
  return 0;
}

/** posizione di layout (senza trasformazioni) di el rispetto a un antenato */
function layoutOffset(el, root) {
  let x = 0;
  let y = 0;
  let n = el;
  while (n && n !== root) {
    x += n.offsetLeft || 0;
    y += n.offsetTop || 0;
    const next = n.offsetParent;
    if (!next || next === root || !root.contains(next)) break;
    n = next;
  }
  return [x, y];
}

/**
 * Consegna senza copie: il contesto GL vive su un OffscreenCanvas e ogni pannello
 * riceve il frame con transferToImageBitmap → bitmaprenderer. Il ripiego copia con
 * drawImage nel canvas 2D del pannello, che costringe la GPU a finire il disegno
 * prima di ogni copia (nove volte a frame).
 */
function supportsBitmapHandoff() {
  if (typeof OffscreenCanvas === 'undefined' || !('transferToImageBitmap' in OffscreenCanvas.prototype)) return false;
  try {
    return !!document.createElement('canvas').getContext('bitmaprenderer');
  } catch {
    return false;
  }
}

/** canvas figlio del pannello, dietro al contenuto (o sopra, per i sigilli) */
function ensurePanelCanvas(el, key, z) {
  let cv = el[key];
  if (cv && cv.parentNode === el) return cv;
  cv = document.createElement('canvas');
  cv.className = 'cosmo-panel-canvas';
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, {
    position: 'absolute',
    left: `${-PAD}px`,
    top: `${-PAD}px`,
    width: `calc(100% + ${PAD * 2}px)`,
    height: `calc(100% + ${PAD * 2}px)`,
    pointerEvents: 'none',
    zIndex: String(z),
  });
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.classList.add('cosmo-host');
  el.appendChild(cv);
  el[key] = cv;
  return cv;
}

export function DuelCosmicHud({
  playerHP,
  enemyHP,
  playerFocus,
  enemyFocus,
  conqueredFields,
  playerColor,
  enemyColor,
  gamePhase = null,
  duelPhase = -1,
  battleResult: _battleResult,
  eventsCount = 0,
  maxHP = 25,
  /** 'player' | 'enemy' | null ÔÇö chi sta agendo (come il badge "Tocca a te") */
  turnSide = null,
}) {
  void _battleResult;
  const hostRef = useRef(null);
  const stateRef = useRef({
    hitAt: [-99, -99],
    fcAt: [-99, -99],
    sealAt: [-1, -1, -1, -1, -1],
    sealWho: [0, 0, 0, 0, 0],
    starAt: -99,
  });
  const propsRef = useRef({});
  const t0Ref = useRef(performance.now());
  const now = () => (performance.now() - t0Ref.current) / 1000;

  propsRef.current = { playerHP, enemyHP, playerColor, enemyColor, maxHP, turnSide, gamePhase, duelPhase };

  // PV persi ÔåÆ raffica di glitch sul box di chi ├¿ colpito
  const prevHp = useRef({ p: playerHP, e: enemyHP });
  useEffect(() => {
    const st = stateRef.current;
    const add = (side) => { st.hitAt[side] = now(); };
    if (playerHP < prevHp.current.p) add(1);
    if (enemyHP < prevHp.current.e) add(0);
    prevHp.current = { p: playerHP, e: enemyHP };
  }, [playerHP, enemyHP]);

  // FC spesi ÔåÆ impulso sul pannello stats
  const prevFc = useRef({ p: playerFocus, e: enemyFocus });
  useEffect(() => {
    const st = stateRef.current;
    // FC spese o aggiunte da un effetto: lo stesso guizzo sul pannello
    if (playerFocus !== prevFc.current.p) st.fcAt[1] = now();
    if (enemyFocus !== prevFc.current.e) st.fcAt[0] = now();
    prevFc.current = { p: playerFocus, e: enemyFocus };
  }, [playerFocus, enemyFocus]);

  // campo conquistato ÔåÆ sigillo runico sulla riga del tabellone
  useEffect(() => {
    const st = stateRef.current;
    for (let i = 0; i < 5; i++) {
      const c = conqueredFields?.[i];
      const who = c ? (typeof c === 'object' ? (c.winner === 'player' ? 1 : c.winner === 'enemy' ? -1 : 0) : 0) : 0;
      if (c && st.sealAt[i] < 0) { st.sealAt[i] = now(); st.sealWho[i] = who; }
      if (!c) { st.sealAt[i] = -1; st.sealWho[i] = 0; }
    }
  }, [conqueredFields]);

  // nuovo evento nel log ÔåÆ stella
  const prevEvents = useRef(eventsCount);
  useEffect(() => {
    if (eventsCount > prevEvents.current) stateRef.current.starAt = now();
    prevEvents.current = eventsCount;
  }, [eventsCount]);


  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = host.parentElement;

    // contesto WebGL unico, fuori dal DOM
    const glOpts = { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false };
    let handoff = supportsBitmapHandoff();
    let glCv = null;
    let gl = null;
    if (handoff) {
      glCv = new OffscreenCanvas(640, 960);
      gl = glCv.getContext('webgl', glOpts);
      if (!gl) handoff = false;
    }
    if (!handoff) {
      glCv = document.createElement('canvas');
      glCv.width = 640;
      glCv.height = 960;
      gl = glCv.getContext('webgl', glOpts);
    }
    if (!gl) return undefined;
    let glW = glCv.width;
    let glH = glCv.height;
    const panelCtxType = handoff ? 'bitmaprenderer' : '2d';
    const panelCtx = (cv) => {
      if (!cv.__cosmoCtx) cv.__cosmoCtx = cv.getContext(panelCtxType);
      return cv.__cosmoCtx;
    };
    const clearPanel = (cv) => {
      const ctx = panelCtx(cv);
      if (handoff) ctx.transferFromImageBitmap(null);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    let dead = false;
    let raf = 0;
    const onLost = (e) => { e.preventDefault(); dead = true; cancelAnimationFrame(raf); };
    glCv.addEventListener('webglcontextlost', onLost);

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[DuelCosmicHud]', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, COSMO_VS);
    const fs = compile(gl.FRAGMENT_SHADER, COSMO_FS);
    if (!vs || !fs) return undefined;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[DuelCosmicHud]', gl.getProgramInfoLog(prog));
      return undefined;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aL = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aL);
    gl.vertexAttribPointer(aL, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ['uScale', 'uVH', 'uPad', 'uMode', 'uSize', 'uSeed', 'uAcc', 'uCut', 'uKind', 'uTime', 'uLook',
      'uLum', 'uHitT', 'uFcT', 'uCor', 'uHead', 'uCircle', 'uEll', 'uStar', 'uRow', 'uSealB', 'uSealW', 'uColP', 'uColE']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    gl.clearColor(0, 0, 0, 0);
    // risoluzione e ritmo del cosmo seguono la Qualità effetti
    let sc = 0.75;
    let minFrameMs = 0;
    let lastDrawMs = -1e9;
    const applyQuality = () => {
      const profile = getVfxQualityProfile();
      sc = profile.duelCosmoScale;
      minFrameMs = profile.duelCosmoFps > 0 ? 1000 / profile.duelCosmoFps : 0;
      gl.uniform1f(U.uScale, sc);
    };
    applyQuality();
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, applyQuality);
    gl.uniform1f(U.uPad, PAD);

    let look = [0, 0];
    let target = [0, 0];
    let lastMove = -10;
    const onMove = (e) => {
      const r = scene.getBoundingClientRect();
      target = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2];
      lastMove = now();
    };
    window.addEventListener('pointermove', onMove);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const cor = [0, 0];
    const spd = [0.18, 0.18];
    const head = [0, 0.37];
    let lastT = now();
    const hosts = new Set();
    let frameCount = 0;
    const panelCache = PANEL_DEFS.map((def) => ({ def, el: null }));
    const resyncPanels = () => {
      for (const entry of panelCache) entry.el = scene.querySelector(entry.def.sel);
    };
    resyncPanels();

    // disegna una regione (cw ├ù ch) nel contesto GL e la consegna al canvas del pannello
    const blit = (cv, cw, ch) => {
      if (handoff) {
        // il canvas GL prende la misura del pannello: il bitmap passa intero, senza copie
        if (cv.width !== cw) cv.width = cw;
        if (cv.height !== ch) cv.height = ch;
        if (glCv.width !== cw) glCv.width = cw;
        if (glCv.height !== ch) glCv.height = ch;
        gl.viewport(0, 0, cw, ch);
        gl.uniform1f(U.uVH, ch);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        panelCtx(cv).transferFromImageBitmap(glCv.transferToImageBitmap());
        return;
      }
      if (cv.width !== cw) cv.width = cw;
      if (cv.height !== ch) cv.height = ch;
      if (cw > glW || ch > glH) {
        glW = Math.max(glW, cw);
        glH = Math.max(glH, ch);
        glCv.width = glW;
        glCv.height = glH;
      }
      gl.viewport(0, 0, cw, ch);
      gl.uniform1f(U.uVH, ch);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const ctx = panelCtx(cv);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(glCv, 0, glCv.height - ch, cw, ch, 0, 0, cw, ch);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (!raf && !dead) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const frame = () => {
      if (dead) return;
      if (document.hidden) {
        raf = 0;
        return;
      }
      const pr = propsRef.current;
      // Durante Aurora clash il cosmo resta congelato: libera GPU per lo scontro.
      if (pr.gamePhase === 'result' && Number(pr.duelPhase) >= 4) {
        raf = requestAnimationFrame(frame);
        return;
      }
      raf = requestAnimationFrame(frame);
      const nowMs = performance.now();
      if (minFrameMs && nowMs - lastDrawMs < minFrameMs - 2) return;
      lastDrawMs = nowMs;
      const t = now();
      const st = stateRef.current;
      const colP = hexToRgb(pr.playerColor, [0.635, 0.533, 0.984]);
      const colE = hexToRgb(pr.enemyColor, [0.984, 0.569, 0.176]);
      const mh = Math.max(1, pr.maxHP || 25);
      const dt = Math.min(0.1, t - lastT);
      lastT = t;
      const lumOf = (hp) => 0.35 + 0.65 * Math.max(0, Math.min(1, (hp ?? mh) / mh));

      if (t - lastMove > 3) target = [Math.cos(t * 0.2) * 0.6, Math.sin(t * 0.27) * 0.5];
      look = [look[0] + (target[0] - look[0]) * 0.06, look[1] + (target[1] - look[1]) * 0.06];

      gl.uniform1f(U.uTime, reduce ? 0 : t);
      gl.uniform2f(U.uLook, look[0], look[1]);
      gl.uniform3f(U.uColP, colP[0], colP[1], colP[2]);
      gl.uniform3f(U.uColE, colE[0], colE[1], colE[2]);

      frameCount += 1;
      if (frameCount % 45 === 0) resyncPanels();
      for (const { def, el: cachedEl } of panelCache) {
        const el = cachedEl || scene.querySelector(def.sel);
        if (!el) continue;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w < 3 || h < 3) continue;
        hosts.add(el);
        const cv = ensurePanelCanvas(el, '__cosmoBg', -1);
        const cw = Math.round((w + PAD * 2) * sc);
        const ch = Math.round((h + PAD * 2) * sc);
        const acc = def.acc === 'player' ? colP : def.acc === 'enemy' ? colE : hexToRgb(def.acc);

        gl.uniform1f(U.uMode, 0);
        gl.uniform2f(U.uSize, w, h);
        gl.uniform1f(U.uSeed, def.seed);
        gl.uniform3f(U.uAcc, acc[0], acc[1], acc[2]);
        gl.uniform1f(U.uCut, def.cut);
        let kind = def.kind;
        if (def.portal && !el.querySelector('.satze-bf-portal-disc')) {
          // pannello campo senza portale (fine partita, passaggi di fase): niente riquadro
          clearPanel(cv);
          continue;
        }
        if (def.portal) {
          const disc = el.querySelector('.satze-bf-portal-disc');
          if (disc && disc.offsetWidth > 10) {
            const [dx, dy] = layoutOffset(disc, el);
            gl.uniform3f(U.uCircle, dx + disc.offsetWidth / 2, dy + disc.offsetHeight / 2, disc.offsetWidth / 2);
            // l'anello di avanzamento scorre verso il valore nuovo invece di saltare
            const target = parseFloat(disc.dataset.progress) || 0;
            const cur = el.__cosmoProg ?? target;
            el.__cosmoProg = target < cur - 0.3 ? target : cur + (target - cur) * 0.08;
            // apertura del portale a inizio round: parte quando cambia data-intro
            if (el.__cosmoIntro !== disc.dataset.intro) {
              el.__cosmoIntro = disc.dataset.intro;
              el.__cosmoIntroAt = t;
            }
            const u = Math.min(1, (t - (el.__cosmoIntroAt ?? -9)) / PORTAL_INTRO_S);
            const back = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2); // ease-out con leggero rimbalzo
            gl.uniform3f(U.uEll, disc.offsetHeight / 2, el.__cosmoProg, reduce ? 1 : back);
            // tocca a te scegliere (Affare, Comando): la cornice vira dall'argento all'ambra
            const dk = disc.dataset.decide === '1' ? 1 : 0;
            el.__cosmoDecide = (el.__cosmoDecide ?? dk) + (dk - (el.__cosmoDecide ?? dk)) * 0.08;
            const k = el.__cosmoDecide;
            if (k > 0.002) gl.uniform3f(U.uAcc, acc[0] + (AMBER[0] - acc[0]) * k, acc[1] + (AMBER[1] - acc[1]) * k, acc[2] + (AMBER[2] - acc[2]) * k);
            kind = 3;
          }
        }
        gl.uniform1f(U.uKind, kind);
        if (def.kind === 1) {
          gl.uniform1f(U.uLum, lumOf(def.side === 1 ? pr.playerHP : pr.enemyHP));
          gl.uniform1f(U.uHitT, t - st.hitAt[def.side]);
          gl.uniform1f(U.uFcT, t - st.fcAt[def.side]);
          const hp = def.side === 1 ? pr.playerHP : pr.enemyHP;
          const stage = corruptionStage(hp, mh);
          cor[def.side] += (stage / 3 - cor[def.side]) * 0.04;
          gl.uniform1f(U.uCor, cor[def.side]);
          // luce sul bordo: veloce per chi sta agendo, lenta per l'altro; il colpo la strattona
          const turn = pr.turnSide == null ? -1 : pr.turnSide === 'player' ? 1 : 0;
          const base = turn === def.side ? 0.62 : turn === -1 ? 0.2 : 0.12;
          spd[def.side] += (base * (1 - 0.35 * cor[def.side]) - spd[def.side]) * 0.06;
          const jolt = 0.9 * Math.exp(-(t - st.hitAt[def.side]) * 4) + 0.06 * cor[def.side] * Math.sin(t * 7);
          head[def.side] = (head[def.side] + dt * (spd[def.side] + jolt)) % 1;
          gl.uniform1f(U.uHead, head[def.side]);
          // anche il testo del box sente il colpo e la corruzione (vedi CSS)
          if (el.dataset.cosmoStage !== String(stage)) el.dataset.cosmoStage = String(stage);
          el.classList.toggle('cosmo-hit', t - st.hitAt[def.side] < 0.5);
        } else {
          gl.uniform1f(U.uLum, 1);
          gl.uniform1f(U.uHitT, 99);
          gl.uniform1f(U.uFcT, 99);
          gl.uniform1f(U.uCor, 0);
        }
        gl.uniform3f(U.uStar, 22, 18, def.kind === 2 && t - st.starAt < 6 ? st.starAt : -1);
        blit(cv, cw, ch);

        // i campi conquistati hanno il sigillo di ceralacca in DOM (WaxSeal)
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, applyQuality);
      document.removeEventListener('visibilitychange', onVisibility);
      glCv.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      hosts.forEach((el) => {
        el.__cosmoBg?.remove();
        el.__cosmoTop?.remove();
        el.__cosmoBg = null;
        el.__cosmoTop = null;
        el.classList.remove('cosmo-host', 'cosmo-hit');
        delete el.dataset.cosmoStage;
      });
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="duel-cosmic-hud-host"
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', zIndex: 30 }}
    />
  );
}

export default DuelCosmicHud;
