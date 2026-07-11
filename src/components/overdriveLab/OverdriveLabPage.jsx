// ============================================
// Overdrive Lab — confronto varianti effetto
// Accesso: ?overdriveLab=1  |  menu → STRUMENTI DEV
// ============================================

import React, { useCallback, useMemo, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { GameCard } from '../cards/GameCard';
import { ALL_AGENTS } from '../../data';
import { ARMY_COLORS } from '../../data/armies';
import {
  getOverdriveEffectVariant,
  setOverdriveEffectVariant,
  OVERDRIVE_EFFECT_OPTIONS,
} from '../../utils/overdriveEffectPreference';

const ARMY_NAMES = Object.keys(ARMY_COLORS);

function pickAgentForArmy(army) {
  const withOverdrive = ALL_AGENTS.find(
    (a) => a.army === army && a.ability?.trigger === 'overdrive'
  );
  if (withOverdrive) return withOverdrive;
  return ALL_AGENTS.find((a) => a.army === army) ?? ALL_AGENTS[0];
}

function VariantCard({ option, agent, active, onSelect, onApply }) {
  return (
    <div
      className={`rounded border overflow-hidden transition-colors ${
        active
          ? 'border-amber-500/70 bg-amber-950/20 ring-1 ring-amber-500/40'
          : 'border-[var(--st-border)] bg-[var(--st-well)] hover:border-[var(--st-border-hi)]'
      }`}
    >
      <div className="p-4 flex flex-col items-center gap-3 min-h-[320px] justify-center bg-[#080a10]">
        <GameCard
          agent={agent}
          overdrivePreview
          overdriveEffectVariant={option.key}
          disabled
        />
      </div>
      <div className="p-4 border-t border-[var(--st-border)] space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-[var(--st-text)]">{option.title}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--st-muted)] mt-0.5">
              {option.sub}
            </div>
          </div>
          {active && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
              Attivo
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--st-muted)] leading-relaxed">{option.desc}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="satze-tool-btn-secondary flex-1 px-3 py-1.5 text-xs"
            onClick={() => onSelect(option.key)}
          >
            Anteprima
          </button>
          <button
            type="button"
            className="satze-tool-btn-primary flex-1 px-3 py-1.5 text-xs"
            onClick={() => onApply(option.key)}
          >
            Usa in gioco
          </button>
        </div>
      </div>
    </div>
  );
}

export function OverdriveLabPage({ onClose }) {
  const [army, setArmy] = useState('Khemet');
  const [selected, setSelected] = useState(() => getOverdriveEffectVariant());
  const [applied, setApplied] = useState(() => getOverdriveEffectVariant());
  const [statusMsg, setStatusMsg] = useState('');

  const agent = useMemo(() => pickAgentForArmy(army), [army]);
  const palette = ARMY_COLORS[army]?.accent ?? '#94a3b8';

  const handleApply = useCallback((key) => {
    setOverdriveEffectVariant(key);
    setSelected(key);
    setApplied(key);
    const meta = OVERDRIVE_EFFECT_OPTIONS.find((o) => o.key === key);
    setStatusMsg(`Salvato: «${meta?.title ?? key}» — visibile in partita durante la scelta FC.`);
    setTimeout(() => setStatusMsg(''), 4500);
  }, []);

  const subtitle = (
    <>
      Confronta le varianti dell&apos;anteprima Overdrive (scelta FC, soglia 5+). I colori seguono{' '}
      <code className="text-xs text-[var(--st-muted)]">ARMY_COLORS</code> + palette companion. La scelta
      viene salvata in <code className="text-xs text-[var(--st-muted)]">localStorage</code>.
    </>
  );

  return (
    <ToolPageShell
      title="Overdrive Lab — varianti effetto"
      subtitle={subtitle}
      onClose={onClose}
      closeLabel="← Gioco"
    >
      <div className="mb-6 flex flex-wrap items-end gap-4 p-4 rounded border border-[var(--st-border)] bg-[var(--st-well)]">
        <label className="flex flex-col gap-1.5 text-xs text-[var(--st-muted)]">
          Esercito (palette)
          <select
            className="satze-tool-input min-w-[220px] text-sm"
            value={army}
            onChange={(e) => setArmy(e.target.value)}
          >
            {ARMY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-[var(--st-muted)] pb-1">
          Carta: <strong className="text-[var(--st-text)]">{agent?.name}</strong>
          <span className="ml-2 inline-block w-3 h-3 rounded-full align-middle" style={{ background: palette }} />
        </div>
        <div className="text-xs text-[var(--st-muted)] pb-1 ml-auto">
          In gioco:{' '}
          <strong className="text-amber-400/90">
            {OVERDRIVE_EFFECT_OPTIONS.find((o) => o.key === applied)?.title ?? applied}
          </strong>
        </div>
      </div>

      {statusMsg && (
        <p className="text-sm text-emerald-400/90 mb-4" role="status">
          {statusMsg}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {OVERDRIVE_EFFECT_OPTIONS.map((option) => (
          <VariantCard
            key={option.key}
            option={option}
            agent={agent}
            active={selected === option.key}
            onSelect={setSelected}
            onApply={handleApply}
          />
        ))}
      </div>

      <p className="mt-8 text-xs text-[var(--st-muted)]">
        Suggerimento: prova <strong className="opacity-90">Khemet</strong> per vedere ciano + viola + blu.
        Le varianti <strong className="opacity-90">Veil Full / Dense / Flood</strong> sono versioni più piene di Veil Columns.
        Dopo «Usa in gioco», avvia una partita e seleziona una carta Overdrive con 5+ FC.
      </p>
    </ToolPageShell>
  );
}

export default OverdriveLabPage;
