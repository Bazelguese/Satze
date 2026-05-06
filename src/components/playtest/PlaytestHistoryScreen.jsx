import React, { useMemo, useState } from 'react';
import { MenuScreenLayout, MenuCard, MenuBackButton } from '../menu';
import { loadPlaytestHistory, clearPlaytestHistory, downloadPlaytestCsv, updatePlaytestRecord } from '../../utils/playtestHistory';

export function PlaytestHistoryScreen({ onClose }) {
  const [records, setRecords] = useState(() => loadPlaytestHistory());
  const [armyFilter, setArmyFilter] = useState('');
  const [deckFilter, setDeckFilter] = useState('');
  const [winnerFilter, setWinnerFilter] = useState('');
  const [notesDraft, setNotesDraft] = useState({});

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (armyFilter && r.playerArmy !== armyFilter) return false;
      if (deckFilter && r.playerDeck !== deckFilter) return false;
      if (winnerFilter && r.winner !== winnerFilter) return false;
      return true;
    });
  }, [records, armyFilter, deckFilter, winnerFilter]);

  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const wins = filteredRecords.filter((r) => r.winner === 'player').length;
    const losses = filteredRecords.filter((r) => r.winner === 'enemy').length;
    const draws = filteredRecords.filter((r) => r.winner === 'draw').length;
    const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    return { total, wins, losses, draws, winrate };
  }, [filteredRecords]);

  const deckAggregates = useMemo(() => {
    const byDeck = {};
    for (const r of filteredRecords) {
      const key = `${r.playerArmy || 'N/A'} :: ${r.playerDeck || 'N/A'}`;
      if (!byDeck[key]) {
        byDeck[key] = { deck: r.playerDeck || 'N/A', army: r.playerArmy || 'N/A', total: 0, wins: 0, losses: 0, draws: 0 };
      }
      byDeck[key].total += 1;
      if (r.winner === 'player') byDeck[key].wins += 1;
      else if (r.winner === 'enemy') byDeck[key].losses += 1;
      else if (r.winner === 'draw') byDeck[key].draws += 1;
    }
    return Object.values(byDeck)
      .map((x) => ({ ...x, winrate: x.total > 0 ? (x.wins / x.total) * 100 : 0 }))
      .sort((a, b) => b.winrate - a.winrate || b.total - a.total)
      .slice(0, 10);
  }, [filteredRecords]);

  const armies = useMemo(
    () => [...new Set(records.map((r) => r.playerArmy).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [records]
  );
  const decks = useMemo(
    () => [...new Set(records.map((r) => r.playerDeck).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [records]
  );

  const handleClear = () => {
    if (!window.confirm('Vuoi cancellare tutto lo storico playtest?')) return;
    clearPlaytestHistory();
    setRecords([]);
  };

  const handleExport = () => {
    if (!filteredRecords.length) return;
    downloadPlaytestCsv(filteredRecords);
  };

  const handleSaveNote = (recordId) => {
    const nextNote = (notesDraft[recordId] ?? '').trim();
    const ok = updatePlaytestRecord(recordId, { notes: nextNote });
    if (!ok) return;
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, notes: nextNote } : r)));
  };

  return (
    <MenuScreenLayout centered={false} title="Storico Playtest" subtitle="Partite salvate in locale · Export CSV">
      <div className="w-full max-w-5xl px-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-700 px-3 py-2">Match: <b>{summary.total}</b></div>
          <div className="text-xs text-emerald-300 bg-slate-900/60 border border-slate-700 px-3 py-2">Vittorie: <b>{summary.wins}</b></div>
          <div className="text-xs text-rose-300 bg-slate-900/60 border border-slate-700 px-3 py-2">Sconfitte: <b>{summary.losses}</b></div>
          <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-700 px-3 py-2">Pareggi: <b>{summary.draws}</b> · WR <b>{summary.winrate}%</b></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <select value={armyFilter} onChange={(e) => setArmyFilter(e.target.value)} className="px-2 py-2 text-xs bg-slate-900/60 border border-slate-700 text-slate-200">
            <option value="">Tutte le armate</option>
            {armies.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={deckFilter} onChange={(e) => setDeckFilter(e.target.value)} className="px-2 py-2 text-xs bg-slate-900/60 border border-slate-700 text-slate-200">
            <option value="">Tutti i deck</option>
            {decks.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={winnerFilter} onChange={(e) => setWinnerFilter(e.target.value)} className="px-2 py-2 text-xs bg-slate-900/60 border border-slate-700 text-slate-200">
            <option value="">Tutti gli esiti</option>
            <option value="player">Vittorie</option>
            <option value="enemy">Sconfitte</option>
            <option value="draw">Pareggi</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredRecords.length}
            className="px-3 py-2 text-xs font-bold rounded border border-emerald-700 bg-emerald-900/40 text-emerald-200 disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!records.length}
            className="px-3 py-2 text-xs font-bold rounded border border-rose-700 bg-rose-900/40 text-rose-200 disabled:opacity-40"
          >
            Cancella Storico
          </button>
          <button
            type="button"
            onClick={() => {
              setArmyFilter('');
              setDeckFilter('');
              setWinnerFilter('');
            }}
            className="px-3 py-2 text-xs font-bold rounded border border-slate-600 bg-slate-800/50 text-slate-200"
          >
            Reset Filtri
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl px-4 mb-4">
        <h3 className="text-sm font-bold mb-2 text-slate-300">Winrate per deck (filtri correnti)</h3>
        {deckAggregates.length === 0 ? (
          <div className="text-slate-500 text-xs border border-slate-700 bg-slate-900/40 px-3 py-2">Nessun dato con i filtri correnti.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {deckAggregates.map((d) => (
              <div key={`${d.army}-${d.deck}`} className="text-xs border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-300">
                <b>{d.army}</b> · {d.deck} — WR <b>{d.winrate.toFixed(1)}%</b> ({d.wins}/{d.total}) · L {d.losses} · D {d.draws}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl px-4 mb-4">
        {filteredRecords.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center border border-slate-700 bg-slate-900/40">
            Nessun match registrato. Gioca una partita: il risultato viene salvato automaticamente a fine match.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRecords.slice(0, 200).map((r) => (
              <MenuCard key={r.id} accentColor={r.winner === 'player' ? '#22c55e' : r.winner === 'enemy' ? '#ef4444' : '#94a3b8'}>
                <div className="text-xs text-slate-400 mb-1">{new Date(r.createdAt).toLocaleString()}</div>
                <div className="text-sm font-bold text-white mb-1">
                  {r.playerArmy} ({r.playerDeck}) vs {r.enemyArmy || 'Sconosciuto'}
                </div>
                <div className="text-xs text-slate-300 mb-1">
                  {r.mode} · {r.difficulty || '-'} · Round {r.roundsPlayed ?? '-'}
                </div>
                <div className="text-xs text-slate-400">
                  Esito: <b>{r.winner}</b> ({r.reason || '-'}) · PV {r.playerHP} - {r.enemyHP} · Campi {r.playerFields} - {r.enemyFields}
                </div>
                <div className="mt-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Note match</label>
                  <textarea
                    value={notesDraft[r.id] ?? r.notes ?? ''}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full min-h-[54px] px-2 py-1 text-xs bg-slate-950/50 border border-slate-700 text-slate-200"
                    placeholder="Annota trigger chiave, errori, matchup, tuning..."
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveNote(r.id)}
                      className="px-2 py-1 text-[11px] font-bold rounded border border-amber-700 bg-amber-900/30 text-amber-200"
                    >
                      Salva nota
                    </button>
                  </div>
                </div>
              </MenuCard>
            ))}
          </div>
        )}
      </div>

      <MenuBackButton onClick={onClose}>Torna al menu</MenuBackButton>
    </MenuScreenLayout>
  );
}
