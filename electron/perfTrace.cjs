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
    .filter((e) => (e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask') && e.dur > 33000)
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
  lines.push(`thread gioco ${busyOf('CrRendererMain')}% · GPU ${busyOf('CrGpuMain')}% · compositor ${busyOf('VizCompositorThread')}% · blocchi >33 ms: ${top.length} (${blocked} ms)`);
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
    const ph = phaseAt(t.ts);
    lines.push(`${String(i + 1).padStart(2)}. +${((t.ts - t0) / 1e6).toFixed(2)}s ${String(Math.round(t.dur / 1000)).padStart(4)} ms ${ph ? `[${ph}] ` : ''}${parts.join(' · ')}${fns.length ? `  | ${fns.join(' ; ')}` : ''}`);
  });
  if (!biggest.length) lines.push('nessun blocco del thread del gioco sopra 33 ms');
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
