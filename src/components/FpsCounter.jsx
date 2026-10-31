import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const DETAILS_KEY = 'F9';
const WINDOW_MS = 2000;
/** Frame più lunghi di così (≥ 2 frame persi a 60 Hz) finiscono nel registro scatti. */
const HITCH_MS = 33;
const HITCH_LOG_SIZE = 10;
const SOFTWARE_GPU = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;

/** Nome della GPU che Chromium usa davvero per WebGL (e quindi per la composizione). */
function readGpuRenderer() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return 'WebGL non disponibile';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(name || '?');
  } catch {
    return '?';
  }
}

function pct(sorted, q) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

/**
 * Overlay FPS in alto a destra (imperativo: non re-renderizza React ogni frame).
 * F9 apre la diagnostica: tempi frame, thread principale bloccato, GPU in uso e
 * registro degli ultimi scatti con la fase di gioco in cui sono avvenuti.
 */
export function FpsCounter() {
  const elRef = useRef(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let prev = last;
    let fps = 0;
    let open = false;
    /** @type {{ t: number, d: number }[]} */
    let frameLog = [];
    /** @type {{ t: number, d: number }[]} */
    let longLog = [];
    /** @type {{ at: number, d: number, phase: string }[]} */
    let hitches = [];
    let hitchCount = 0;
    let gpuLine = '';
    let compositing = '';

    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) longLog.push({ t: e.startTime + e.duration, d: e.duration });
      });
      observer.observe({ type: 'longtask', buffered: false });
    } catch {
      observer = null;
    }

    const renderDetails = (now) => {
      const box = detailsRef.current;
      if (!box) return;
      const from = now - WINDOW_MS;
      frameLog = frameLog.filter((f) => f.t >= from);
      longLog = longLog.filter((f) => f.t >= from);
      const ds = frameLog.map((f) => f.d).sort((a, b) => a - b);
      const slow = ds.filter((d) => d > 1000 / 55).length;
      const blocked = longLog.reduce((s, e) => s + e.d, 0);
      const secs = WINDOW_MS / 1000;
      const lines = [
        `frame p50 ${pct(ds, 0.5).toFixed(1)} ms · p99 ${pct(ds, 0.99).toFixed(1)} · peggiore ${(ds[ds.length - 1] || 0).toFixed(0)}`,
        `frame lenti (>18 ms): ${(slow / secs).toFixed(1)}/s`,
        observer
          ? `thread principale bloccato: ${(blocked / secs).toFixed(0)} ms/s (${longLog.length} task lunghi)`
          : 'task lunghi: non misurabili qui',
        gpuLine,
        compositing,
        `finestra ${window.innerWidth}×${window.innerHeight} · DPR ${window.devicePixelRatio}`,
        `scatti (>${HITCH_MS} ms) dall'avvio: ${hitchCount}${hitches.length ? ' · ultimi:' : ''}`,
        ...hitches
          .slice()
          .reverse()
          .map((h) => `  ${(h.at / 1000).toFixed(1).padStart(7)} s   ${h.d.toFixed(0).padStart(4)} ms   ${h.phase}`),
      ].filter(Boolean);
      box.textContent = lines.join('\n');
    };

    const tick = (now) => {
      frames += 1;
      const d = now - prev;
      frameLog.push({ t: now, d });
      // il primo frame dopo una scheda nascosta non è uno scatto del gioco
      if (d > HITCH_MS && d < 10000 && !document.hidden) {
        hitchCount += 1;
        const phase = document.documentElement.dataset.satzePhase || 'avvio';
        hitches.push({ at: now, d, phase });
        if (hitches.length > HITCH_LOG_SIZE) hitches = hitches.slice(-HITCH_LOG_SIZE);
      }
      prev = now;
      const elapsed = now - last;
      if (elapsed >= 500) {
        fps = Math.round((frames * 1000) / elapsed);
        frames = 0;
        last = now;
        const el = elRef.current;
        if (el) {
          el.textContent = `${fps} FPS`;
          el.style.color = fps >= 50 ? '#9fe870' : fps >= 30 ? '#f0c674' : '#ff6b6b';
        }
        if (open) renderDetails(now);
        else if (frameLog.length > 2000) frameLog = frameLog.slice(-1000);
      }
      raf = requestAnimationFrame(tick);
    };

    const loadGpuInfo = async () => {
      const name = readGpuRenderer();
      gpuLine = `GPU: ${name}${SOFTWARE_GPU.test(name) ? '  ⚠ RENDERING SOFTWARE' : ''}`;
      try {
        const st = await window.electronAPI?.gpu?.getStatus?.();
        if (st) {
          compositing = `composizione: ${st.gpu_compositing} · raster: ${st.rasterization} · webgl: ${st.webgl}`;
        }
      } catch {
        /* solo nel client Electron */
      }
    };

    const onKey = (e) => {
      if (e.key !== DETAILS_KEY) return;
      e.preventDefault();
      open = !open;
      const box = detailsRef.current;
      if (box) box.style.display = open ? 'block' : 'none';
      if (open) {
        if (!gpuLine) loadGpuInfo().then(() => renderDetails(performance.now()));
        renderDetails(performance.now());
      }
    };
    window.addEventListener('keydown', onKey);

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      observer?.disconnect();
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 10,
        right: 12,
        zIndex: 2147483646,
        pointerEvents: 'none',
        fontFamily: "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textAlign: 'right',
        textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.45)',
        userSelect: 'none',
      }}
    >
      <div ref={elRef} style={{ color: '#9fe870' }}>
        — FPS
      </div>
      <div
        ref={detailsRef}
        style={{
          display: 'none',
          marginTop: 4,
          padding: '6px 8px',
          background: 'rgba(8,6,14,0.82)',
          color: '#d8d2e6',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.02em',
          lineHeight: 1.45,
          whiteSpace: 'pre',
        }}
      />
    </div>,
    document.body
  );
}
