// Registratore di prestazioni del client desktop (F10 nel gioco, vedi FpsCounter.jsx).
//
// Registra un trace di Chromium (lo stesso degli strumenti per sviluppatori), lo salva
// compresso sul Desktop e ne ricava un riassunto leggibile a schermo: i blocchi più lunghi
// del thread del gioco, con il tempo diviso per causa (JS, stili, layout, paint, commit,
// GC, decodifica immagini) e le funzioni responsabili. Basta uno screenshot per capire
// cosa blocca il gioco su quella macchina.

const { app, contentTracing } = require('electron');
const { join } = require('path');
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require('fs');
const { gzipSync } = require('zlib');

const CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'toplevel',
  'v8.execute',
  'blink.user_timing',
  'loading',
  'gpu',
  'viz',
  // chi invalida gli stili (per i blocchi con molti ricalcoli) e campioni JS (per le funzioni)
  'disabled-by-default-devtools.timeline.invalidationTracking',
  'disabled-by-default-v8.cpu_profiler',
];

const GROUPS = {
  JS: ['FunctionCall', 'EvaluateScript', 'RunMicrotasks', 'v8.compile', 'V8.CompileCode'],
  stili: ['UpdateLayoutTree', 'ParseAuthorStyleSheet'],
  layout: ['Layout'],
  paint: ['Paint', 'PrePaint', 'Layerize', 'UpdateLayer'],
  commit: ['Commit', 'LayerTreeHost::WaitForCommitCompletion'],
  GC: ['MajorGC', 'MinorGC', 'V8.GCFinalizeMC', 'V8.GCScavenger', 'BlinkGC.AtomicPhase'],
  decodifica: ['Decode Image', 'ImageDecoder::DecodeFrameBufferAtIndex'],
  file: ['ResponseBodyLoader::OnStateChange', 'ResourceReceivedData'],
};

let busy = false;

/** Millisecondi coperti da un insieme di eventi, senza contare due volte quelli annidati. */
function unionMs(list) {
  const iv = list.map((e) => [e.ts, e.ts + e.dur]).sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur = null;
  for (const [a, b] of iv) {
    if (!cur || a > cur[1]) {
      if (cur) total += cur[1] - cur[0];
      cur = [a, b];
    } else if (b > cur[1]) cur[1] = b;
  }
  if (cur) total += cur[1] - cur[0];
  return total / 1000;
}

/** Campioni del profiler JS del thread `tid` (eventi Profile/ProfileChunk): [{ ts, stack }]. */
function cpuSamples(events, pid, tid) {
  const profiles = new Map(); // id → { t, nodes: Map(id → { cf, parent }) }
  const out = [];
  for (const e of events) {
    if (e.pid !== pid || (e.name !== 'Profile' && e.name !== 'ProfileChunk')) continue;
    // Profile ha il thread campionato; i ProfileChunk arrivano dal thread del profiler, con lo
    // stesso id (che si ripete tra processi: la chiave include il pid)
    const id = `${e.pid}:${e.id}`;
    const d = (e.args && e.args.data) || {};
    if (e.name === 'Profile') {
      profiles.set(id, { t: d.startTime || e.ts, nodes: new Map(), tid: e.tid });
      continue;
    }
    const prof = profiles.get(id);
    if (!prof || prof.tid !== tid) continue;
    const cp = d.cpuProfile || {};
    for (const n of cp.nodes || []) prof.nodes.set(n.id, { cf: n.callFrame || {}, parent: n.parent });
    const samples = cp.samples || [];
    const deltas = d.timeDeltas || [];
    for (let i = 0; i < samples.length; i += 1) {
      prof.t += deltas[i] || 0;
      out.push({ ts: prof.t, node: samples[i], prof });
    }
  }
  return out;
}

function frameLabel(cf) {
  const file = String(cf.url || '').split('/').pop().replace(/-[A-Za-z0-9_]{8}\.js$/, '.js');
  return `${cf.functionName || '(anon)'}@${file}:${(cf.lineNumber ?? -1) + 1}:${(cf.columnNumber ?? -1) + 1}`;
}

/**
 * Dove si spende il tempo nell'intervallo: funzioni "foglia" dei campioni JS (tempo proprio),
 * incluse quelle del browser chiamate dal gioco (es. getComputedStyle), con la percentuale.
 */
function topSampled(samples, t0, t1, n = 3) {
  const self = new Map();
  let total = 0;
  for (const s of samples) {
    if (s.ts < t0 || s.ts > t1) continue;
    const node = s.prof.nodes.get(s.node);
    if (!node) continue;
    total += 1;
    const cf = node.cf;
    if (/^\((program|idle|root|garbage collector)\)$/.test(cf.functionName || '')) continue;
    const k = cf.url ? frameLabel(cf) : `${cf.functionName || '(nativo)'}`;
    self.set(k, (self.get(k) || 0) + 1);
  }
  if (total < 3) return '';
  return [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([k, c]) => `${k} ${Math.round((c / total) * 100)}%`).join(' ; ');
}

/** Riassunto del trace: blocchi più lunghi del thread del gioco con cause e funzioni. */
function summarize(events, seconds) {
  const names = new Map();
  for (const e of events) if (e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args && e.args.name);
  const count = new Map();
  for (const e of events) {
    const k = `${e.pid}:${e.tid}`;
    if (names.get(k) === 'CrRendererMain') count.set(k, (count.get(k) || 0) + 1);
  }
  const mainKey = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!mainKey) return ['trace senza thread del gioco'];
  const busyOf = (threadName) => {
    const list = events.filter((e) => e.ph === 'X' && e.dur && names.get(`${e.pid}:${e.tid}`) === threadName
      && (e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask'));
    return Math.min(100, Math.round((unionMs(list) / (seconds * 1000)) * 100));
  };

  const main = events.filter((e) => `${e.pid}:${e.tid}` === mainKey);
  const complete = main.filter((e) => e.ph === 'X' && e.dur);
  const marks = main
    .filter((e) => typeof e.name === 'string' && e.name.startsWith('satze:') && e.ts)
    .sort((a, b) => a.ts - b.ts);
  const phaseAt = (ts) => {
    let ph = '';
    for (const m of marks) { if (m.ts <= ts) ph = m.name.slice(6); else break; }
    return ph;
  };

  const tasks = complete
    .filter((e) => (e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask') && e.dur > 16000)
    .sort((a, b) => a.ts - b.ts);
  const top = [];
  for (const t of tasks) {
    const last = top[top.length - 1];
    if (last && t.ts >= last.ts && t.ts + t.dur <= last.ts + last.dur) continue; // annidato
    top.push(t);
  }
  const t0 = complete.reduce((m, e) => Math.min(m, e.ts), Infinity);
  const biggest = [...top].sort((a, b) => b.dur - a.dur).slice(0, 10).sort((a, b) => a.ts - b.ts);

  const lines = [];
  const blocked = Math.round(unionMs(top));
  lines.push(`thread gioco ${busyOf('CrRendererMain')}% · GPU ${busyOf('CrGpuMain')}% · compositor ${busyOf('VizCompositorThread')}% · blocchi >16 ms: ${top.length} (${blocked} ms)`);
  // ripartizione di tutto il lavoro del thread del gioco nella registrazione
  const totals = [];
  for (const [label, list] of Object.entries(GROUPS)) {
    const ms = Math.round(unionMs(complete.filter((e) => list.includes(e.name))));
    if (ms >= 5) totals.push(`${label} ${ms}`);
  }
  lines.push(`totale thread gioco (ms in ${seconds} s): ${totals.join(' · ') || '—'}`);
  // funzioni JS più pesanti in tutta la registrazione
  const byFn = new Map();
  for (const e of complete) {
    if (e.name !== 'FunctionCall') continue;
    const d = (e.args && e.args.data) || {};
    const file = String(d.url || '').split('/').pop().replace(/-[A-Za-z0-9_]{8}\.js$/, '.js');
    const k = `${d.functionName || '?'}@${file}:${d.lineNumber ?? ''}`;
    byFn.set(k, (byFn.get(k) || 0) + e.dur / 1000);
  }
  const fnTop = [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v)}`);
  if (fnTop.length) lines.push(`JS più pesante: ${fnTop.join(' ; ')}`);
  // cosa fanno GPU e compositor: tempo "proprio" di ogni operazione (senza quello delle
  // operazioni annidate dentro), così i contenitori generici come GPUTask non coprono tutto
  const topOps = (threadName) => {
    const list = events
      .filter((e) => e.ph === 'X' && e.dur && names.get(`${e.pid}:${e.tid}`) === threadName)
      .sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const self = new Map();
    const stack = [];
    const close = (until) => {
      while (stack.length && stack[stack.length - 1].end <= until) {
        const f = stack.pop();
        self.set(f.name, (self.get(f.name) || 0) + Math.max(0, f.dur - f.kids) / 1000);
      }
    };
    for (const e of list) {
      close(e.ts);
      if (stack.length) stack[stack.length - 1].kids += e.dur;
      stack.push({ name: e.name, dur: e.dur, end: e.ts + e.dur, kids: 0 });
    }
    close(Infinity);
    const skip = /^(ThreadControllerImpl::RunTask|RunTask|ThreadPool|SimpleWatcher|Closed mojo|Receive mojo)/;
    return [...self.entries()].filter(([k]) => !skip.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v]) => `${k} ${Math.round(v)}`).join(' ; ');
  };
  const gpuOps = topOps('CrGpuMain');
  if (gpuOps) lines.push(`GPU: ${gpuOps}`);
  const vizOps = topOps('VizCompositorThread');
  if (vizOps) lines.push(`compositor: ${vizOps}`);
  const [mainPid, mainTid] = mainKey.split(':').map(Number);
  const samples = cpuSamples(events, mainPid, mainTid);
  biggest.forEach((t, i) => {
    const inner = complete.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
    const parts = [];
    for (const [label, list] of Object.entries(GROUPS)) {
      const ms = Math.round(unionMs(inner.filter((e) => list.includes(e.name))));
      if (ms >= 3) parts.push(`${label} ${ms}`);
    }
    const fns = inner
      .filter((e) => e.name === 'FunctionCall' && e.dur > 8000)
      .sort((a, b) => b.dur - a.dur)
      .slice(0, 2)
      .map((e) => {
        const d = (e.args && e.args.data) || {};
        const file = String(d.url || '').split('/').pop().replace(/-[A-Za-z0-9_]{8}\.js$/, '.js');
        return `${d.functionName || '?'}@${file}:${d.lineNumber ?? ''}:${d.columnNumber ?? ''} ${Math.round(e.dur / 1000)}`;
      });
    // stili: quanti elementi e chi li ha invalidati (dalla fine del ricalcolo precedente)
    const recalcs = inner.filter((e) => e.name === 'UpdateLayoutTree');
    const styleMs = unionMs(recalcs);
    if (styleMs >= 8) {
      const els = recalcs.reduce((a, e) => a + ((e.args && e.args.elementCount) || 0), 0);
      const prevEnd = complete
        .filter((e) => e.name === 'UpdateLayoutTree' && e.ts + e.dur <= t.ts)
        .reduce((m, e) => Math.max(m, e.ts + e.dur), t.ts - 50000);
      const why = new Map();
      for (const e of main) {
        if (e.ts < prevEnd || e.ts > t.ts + t.dur || !/InvalidationTracking$/.test(e.name)) continue;
        const d = (e.args && e.args.data) || {};
        const k = `${d.reason || e.name.replace('InvalidationTracking', '')}←${String(d.nodeName || '?').slice(0, 48)}`;
        why.set(k, (why.get(k) || 0) + 1);
      }
      const top = [...why.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, c]) => `${c}× ${k}`).join(', ');
      parts.push(`[${els} el.${top ? ': ' + top : ''}]`);
    }
    const sampled = topSampled(samples, t.ts, t.ts + t.dur);
    if (sampled) fns.push(sampled);
    const ph = phaseAt(t.ts);
    lines.push(`${String(i + 1).padStart(2)}. +${((t.ts - t0) / 1e6).toFixed(2)}s ${String(Math.round(t.dur / 1000)).padStart(4)} ms ${ph ? `[${ph}] ` : ''}${parts.join(' · ')}${fns.length ? `  | ${fns.join(' ; ')}` : ''}`);
  });
  if (!biggest.length) lines.push('nessun blocco del thread del gioco sopra 16 ms');
  return lines;
}

/** Registra `seconds` di trace; ritorna { file, lines } oppure { error }. */
async function recordPerfTrace(seconds = 8) {
  if (busy) return { error: 'registrazione già in corso' };
  busy = true;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rawPath = join(app.getPath('temp'), `satze-trace-${stamp}.json`);
  // Desktop se c'è, altrimenti la cartella dati del gioco
  let outDir = app.getPath('userData');
  try {
    const desktop = app.getPath('desktop');
    if (desktop && existsSync(desktop)) outDir = desktop;
  } catch { /* ignore */ }
  const outPath = join(outDir, `satze-trace-${stamp}.json.gz`);
  try {
    await contentTracing.startRecording({
      included_categories: CATEGORIES,
      excluded_categories: ['*'],
    });
    await new Promise((r) => setTimeout(r, seconds * 1000));
    const file = await contentTracing.stopRecording(rawPath);
    const text = readFileSync(file, 'utf8');
    writeFileSync(outPath, gzipSync(text));
    try { unlinkSync(file); } catch { /* ignore */ }
    const parsed = JSON.parse(text);
    const events = Array.isArray(parsed) ? parsed : parsed.traceEvents || [];
    return { file: outPath, lines: summarize(events, seconds) };
  } catch (err) {
    return { error: err && err.message ? err.message : String(err) };
  } finally {
    busy = false;
  }
}

module.exports = { recordPerfTrace, summarize };
