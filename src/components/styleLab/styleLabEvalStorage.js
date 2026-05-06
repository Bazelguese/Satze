// Persistenza valutazioni Style Lab (solo browser locale)

export const STYLELAB_EVAL_KEY = 'satze_stylelab_eval_v1';

export function defaultEvalRecord() {
  return {
    overall: 0,
    gameFeel: 0,
    legibility: 0,
    notWeb: 0,
    note: '',
  };
}

/** @param {string[]} themeIds */
export function loadEvaluations(themeIds) {
  const base = {};
  for (const id of themeIds) {
    base[id] = defaultEvalRecord();
  }
  try {
    const raw = localStorage.getItem(STYLELAB_EVAL_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    for (const id of themeIds) {
      if (parsed[id] && typeof parsed[id] === 'object') {
        base[id] = { ...defaultEvalRecord(), ...parsed[id] };
      }
    }
    return base;
  } catch {
    return base;
  }
}

export function saveEvaluations(data) {
  try {
    localStorage.setItem(STYLELAB_EVAL_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

/** Score sort: media dei criteri numerici se overall è 0 */
export function sortScore(e) {
  const o = e.overall || 0;
  if (o > 0) return o;
  const nums = [e.gameFeel, e.legibility, e.notWeb].filter((n) => n > 0);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * @param {Array<{ id: string, label: string }>} themes
 * @param {Record<string, ReturnType<defaultEvalRecord>>} evalByTheme
 */
export function buildEvalReportText(themes, evalByTheme) {
  const lines = [];
  lines.push('SATZE — Style Lab — valutazione prototipi');
  lines.push(`Data: ${new Date().toLocaleString('it-IT')}`);
  lines.push('');
  for (const t of themes) {
    const e = evalByTheme[t.id] || defaultEvalRecord();
    lines.push(`## ${t.label}`);
    lines.push(`- Complessivo: ${e.overall ? `${e.overall}/5` : '—'}`);
    lines.push(`- Sensazione da gioco: ${e.gameFeel ? `${e.gameFeel}/5` : '—'}`);
    lines.push(`- Leggibilità: ${e.legibility ? `${e.legibility}/5` : '—'}`);
    lines.push(`- Non sembra un sito web: ${e.notWeb ? `${e.notWeb}/5` : '—'}`);
    if (e.note && e.note.trim()) {
      lines.push(`- Note: ${e.note.trim().replace(/\n/g, ' ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
