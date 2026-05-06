const PLAYTEST_STORAGE_KEY = 'satze_playtest_history_v1';

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function loadPlaytestHistory() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PLAYTEST_STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function savePlaytestHistory(records) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(PLAYTEST_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error('Errore salvataggio storico playtest:', err);
    return false;
  }
}

export function appendPlaytestRecord(record) {
  const history = loadPlaytestHistory();
  const entry = {
    id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...record,
  };
  history.unshift(entry);
  // Limite di sicurezza per non gonfiare localStorage.
  const trimmed = history.slice(0, 2000);
  savePlaytestHistory(trimmed);
  return entry;
}

export function clearPlaytestHistory() {
  return savePlaytestHistory([]);
}

export function updatePlaytestRecord(recordId, patch) {
  const history = loadPlaytestHistory();
  const idx = history.findIndex((r) => r.id === recordId);
  if (idx < 0) return false;
  history[idx] = {
    ...history[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return savePlaytestHistory(history);
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toPlaytestCsv(records) {
  const headers = [
    'id',
    'createdAt',
    'mode',
    'difficulty',
    'playerArmy',
    'playerDeck',
    'enemyArmy',
    'enemyDeck',
    'winner',
    'reason',
    'playerHP',
    'enemyHP',
    'playerFields',
    'enemyFields',
    'roundsPlayed',
    'notes',
  ];
  const lines = [headers.join(',')];
  for (const r of records) {
    const row = [
      r.id,
      r.createdAt,
      r.mode,
      r.difficulty,
      r.playerArmy,
      r.playerDeck,
      r.enemyArmy,
      r.enemyDeck,
      r.winner,
      r.reason,
      r.playerHP,
      r.enemyHP,
      r.playerFields,
      r.enemyFields,
      r.roundsPlayed,
      r.notes || '',
    ].map(escapeCsv);
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

export function downloadPlaytestCsv(records) {
  if (typeof window === 'undefined') return false;
  try {
    const csv = toPlaytestCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `satze-playtest-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Errore export CSV playtest:', err);
    return false;
  }
}
