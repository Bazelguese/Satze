// ============================================
// Eminence System Lab — pipeline, standard, timing
// Accesso: ?eminenceSystemLab=1  |  menu → STRUMENTI DEV
// ============================================

import React, { useCallback, useMemo, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { ARMY_COLORS } from '../../data/armies';
import {
  EMINENCE_SYSTEM_DEFAULTS,
  EMINENCE_SYSTEM_TUNABLES,
  getEminenceSystemPrefs,
  setEminenceSystemPrefs,
  resetEminenceSystemPrefs,
} from '../../utils/eminenceSystemPreference.js';
import {
  PIPELINE_STEPS,
  STANDARD_DOCS,
  ANNOUNCE_PHASES,
  PHASE_LABELS,
  PHASE_COLORS,
  GATE_LABELS,
  EFFECT_TIMINGS,
  CINEMATIC_RECIPES,
  EMINENCE_PRIMITIVES,
  CONDITION_KEYS,
  PRIMITIVE_ALLOWED_TARGETS,
  listLabEminences,
  createLabSession,
  labOpenRound,
  labChooseAbilities,
  labAdvanceGate,
  labPrepareDuel,
  labSettle,
  sessionView,
  auditImplementedStandards,
} from './eminenceSystemLabLogic.js';

function TabButton({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
        active
          ? 'bg-[var(--st-border-hi)] text-[var(--st-text)]'
          : 'bg-[var(--st-well)] text-[var(--st-muted)] hover:text-[var(--st-text)]'
      }`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="satze-tool-panel p-5 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--st-text)]">{title}</h2>
      {children}
    </div>
  );
}

function JsonBlock({ value }) {
  return (
    <pre className="text-[10px] leading-relaxed overflow-auto max-h-64 p-3 rounded bg-black/40 border border-[var(--st-border)] text-[var(--st-muted)]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function NoticeCard({ notice }) {
  return (
    <div
      className="rounded border p-3 space-y-1"
      style={{
        borderColor: notice.phaseColor || 'var(--st-border)',
        background: 'rgba(8,6,18,.72)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: notice.phaseColor }}>
          {notice.phaseLabel || notice.phase}
        </span>
        <span className="text-[10px] text-[var(--st-muted)]">{notice.side}</span>
      </div>
      <div className="text-sm font-semibold text-[var(--st-text)]">{notice.name}</div>
      <p className="text-xs text-[var(--st-muted)] leading-relaxed">{notice.text}</p>
      {notice.recipes?.length > 0 && (
        <div className="text-[10px] text-amber-300/90">
          Ricette: {notice.recipes.join(' · ')}
        </div>
      )}
    </div>
  );
}

function TimingPanel() {
  const [prefs, setPrefs] = useState(() => getEminenceSystemPrefs());
  const [msg, setMsg] = useState('');

  const apply = useCallback((next) => {
    const saved = setEminenceSystemPrefs(next);
    setPrefs(saved);
    setMsg('Salvato in localStorage — attivo in partita al prossimo avviso/scintilla.');
    window.setTimeout(() => setMsg(''), 3500);
  }, []);

  const reset = useCallback(() => {
    const defaults = resetEminenceSystemPrefs();
    setPrefs(defaults);
    setMsg('Ripristinati i default canonici.');
    window.setTimeout(() => setMsg(''), 3000);
  }, []);

  return (
    <div className="space-y-6">
      <Section title="Timing editabili (in partita)">
        <p className="text-xs text-[var(--st-muted)] leading-relaxed">
          Questi valori non cambiano le regole di gioco: regolano solo la presentazione
          (avvisi e saette). Persistono in <code>satze_eminence_system</code>.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {EMINENCE_SYSTEM_TUNABLES.map((tunable) => (
            <label key={tunable.key} className="flex flex-col gap-2 text-xs text-[var(--st-muted)]">
              <span className="flex justify-between gap-2">
                <span className="text-[var(--st-text)] font-semibold">{tunable.label}</span>
                <span className="tabular-nums">{prefs[tunable.key]}</span>
              </span>
              <input
                type="range"
                min={tunable.min}
                max={tunable.max}
                step={tunable.step}
                value={prefs[tunable.key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [tunable.key]: Number(e.target.value) }))}
              />
              <span className="leading-relaxed">{tunable.desc}</span>
              <span className="text-[10px] opacity-70">
                Default {EMINENCE_SYSTEM_DEFAULTS[tunable.key]} · range {tunable.min}–{tunable.max}
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" className="satze-tool-btn-primary px-4 py-2 text-xs" onClick={() => apply(prefs)}>
            Usa in gioco
          </button>
          <button type="button" className="satze-tool-btn-secondary px-4 py-2 text-xs" onClick={reset}>
            Reset default
          </button>
          {msg && <span className="text-xs text-amber-300 self-center">{msg}</span>}
        </div>
      </Section>
    </div>
  );
}

function StandardsPanel() {
  const audit = useMemo(() => auditImplementedStandards(), []);

  return (
    <div className="space-y-6">
      <Section title="Standard di design (canonici)">
        <div className="grid gap-3 md:grid-cols-2">
          {STANDARD_DOCS.map((doc) => (
            <div key={doc.id} className="rounded border border-[var(--st-border)] bg-[var(--st-well)] p-4 space-y-2">
              <div className="text-sm font-semibold text-[var(--st-text)]">{doc.title}</div>
              <p className="text-xs text-[var(--st-muted)] leading-relaxed">{doc.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Vocabolario motore (sola lettura)">
        <div className="grid gap-4 lg:grid-cols-3 text-xs">
          <div>
            <div className="font-semibold text-[var(--st-text)] mb-2">Fasi avviso</div>
            <ul className="space-y-1">
              {Object.values(ANNOUNCE_PHASES).map((phase) => (
                <li key={phase} className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PHASE_COLORS[phase] }} />
                  <span>{PHASE_LABELS[phase]} · {phase}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[var(--st-text)] mb-2">Gate</div>
            <ul className="space-y-1 text-[var(--st-muted)]">
              {Object.entries(GATE_LABELS).map(([id, label]) => (
                <li key={id}><code className="text-[var(--st-text)]">{id}</code> — {label}</li>
              ))}
            </ul>
            <div className="font-semibold text-[var(--st-text)] mt-4 mb-2">Timing effetto</div>
            <ul className="space-y-0.5 text-[var(--st-muted)] max-h-40 overflow-auto">
              {Object.values(EFFECT_TIMINGS).map((t) => (
                <li key={t}><code>{t}</code></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[var(--st-text)] mb-2">Ricette cinematiche</div>
            <ul className="space-y-0.5 text-[var(--st-muted)]">
              {Object.values(CINEMATIC_RECIPES).map((r) => (
                <li key={r}><code>{r}</code></li>
              ))}
            </ul>
            <div className="font-semibold text-[var(--st-text)] mt-4 mb-2">Condition keys</div>
            <ul className="space-y-0.5 text-[var(--st-muted)] max-h-32 overflow-auto">
              {CONDITION_KEYS.map((k) => (
                <li key={k}><code>{k}</code></li>
              ))}
            </ul>
          </div>
        </div>
        <details className="pt-2">
          <summary className="cursor-pointer text-xs text-amber-300">Primitive + target ammessi</summary>
          <JsonBlock value={{ primitives: Object.values(EMINENCE_PRIMITIVES), allowed: PRIMITIVE_ALLOWED_TARGETS }} />
        </details>
      </Section>

      <Section title="Audit curva / ricarica (implementate)">
        <div className="space-y-2">
          {audit.map((row) => (
            <div
              key={row.id}
              className={`rounded border px-3 py-2 text-xs ${
                row.ok
                  ? 'border-emerald-700/50 bg-emerald-950/20'
                  : 'border-amber-700/50 bg-amber-950/20'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-[var(--st-text)]">{row.name}</span>
                <span className="text-[var(--st-muted)]">{row.army} · [{row.curve.join(' / ')}]</span>
              </div>
              {row.issues.length === 0 ? (
                <div className="text-emerald-300/90 mt-1">Conforme agli invarianti soft</div>
              ) : (
                <ul className="mt-1 text-amber-200/90 list-disc pl-4">
                  {row.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--st-muted)]">
          Soft = debito di design (§11.9 / §11.10), non blocco runtime. Serve a vedere dove cambiare
          le ricariche inerti o le curve con più slot non negativi.
        </p>
      </Section>
    </div>
  );
}

function PipelinePanel() {
  const eminences = useMemo(() => listLabEminences(), []);
  const [playerId, setPlayerId] = useState(eminences[0]?.id || 'apex_sole_verde');
  const [enemyId, setEnemyId] = useState(eminences[1]?.id || 'patto_grande_semaforo');
  const [roundNumber, setRoundNumber] = useState(3);
  const [playerAbility, setPlayerAbility] = useState('');
  const [enemyAbility, setEnemyAbility] = useState('');
  const [winner, setWinner] = useState('player');
  const [session, setSession] = useState(null);

  const playerMeta = eminences.find((e) => e.id === playerId);
  const enemyMeta = eminences.find((e) => e.id === enemyId);
  const view = sessionView(session);

  const boot = useCallback(() => {
    const next = createLabSession({
      playerEminenceId: playerId,
      enemyEminenceId: enemyId,
      roundNumber,
    });
    setSession(next);
    const pAb = playerMeta?.abilities?.[0]?.id || '';
    const eAb = enemyMeta?.abilities?.[0]?.id || '';
    setPlayerAbility(pAb);
    setEnemyAbility(eAb);
  }, [playerId, enemyId, roundNumber, playerMeta, enemyMeta]);

  const run = useCallback((fn) => {
    setSession((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  return (
    <div className="space-y-6">
      <Section title="Setup sessione">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-xs">
          <label className="flex flex-col gap-1 text-[var(--st-muted)]">
            Tua Eminenza
            <select className="satze-tool-input" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {eminences.map((e) => (
                <option key={e.id} value={e.id}>{e.army} — {e.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[var(--st-muted)]">
            Avversario
            <select className="satze-tool-input" value={enemyId} onChange={(e) => setEnemyId(e.target.value)}>
              {eminences.map((e) => (
                <option key={e.id} value={e.id}>{e.army} — {e.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[var(--st-muted)]">
            Round
            <input
              type="number"
              min={1}
              max={5}
              className="satze-tool-input"
              value={roundNumber}
              onChange={(e) => setRoundNumber(Number(e.target.value) || 1)}
            />
          </label>
          <div className="flex items-end">
            <button type="button" className="satze-tool-btn-primary w-full px-3 py-2 text-xs" onClick={boot}>
              Nuova sessione
            </button>
          </div>
        </div>
        <ol className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[var(--st-muted)]">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step.id} className="rounded border border-[var(--st-border)] px-2 py-1">
              {index + 1}. {step.label}
            </li>
          ))}
        </ol>
      </Section>

      {!session ? (
        <p className="text-sm text-[var(--st-muted)]">Crea una sessione per avanzare i gate con il motore reale.</p>
      ) : (
        <>
          <Section title="Controlli pipeline">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="satze-tool-btn-secondary px-3 py-2 text-xs" onClick={() => run(labOpenRound)}>
                1 · Apri round
              </button>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-[10px] text-[var(--st-muted)]">
                  Abilità tua
                  <select className="satze-tool-input min-w-[180px]" value={playerAbility} onChange={(e) => setPlayerAbility(e.target.value)}>
                    {(playerMeta?.abilities || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.presenceDelta >= 0 ? `+${a.presenceDelta}` : a.presenceDelta} {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[10px] text-[var(--st-muted)]">
                  Abilità avv.
                  <select className="satze-tool-input min-w-[180px]" value={enemyAbility} onChange={(e) => setEnemyAbility(e.target.value)}>
                    {(enemyMeta?.abilities || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.presenceDelta >= 0 ? `+${a.presenceDelta}` : a.presenceDelta} {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="satze-tool-btn-secondary px-3 py-2 text-xs"
                  onClick={() => run((s) => labChooseAbilities(s, { playerAbility, enemyAbility }))}
                >
                  2 · Scegli
                </button>
              </div>
              <button type="button" className="satze-tool-btn-secondary px-3 py-2 text-xs" onClick={() => run(labAdvanceGate)}>
                3 · Avanza gate
                {view?.nextGate ? ` (${GATE_LABELS[view.nextGate] || view.nextGate})` : ''}
              </button>
              <button type="button" className="satze-tool-btn-secondary px-3 py-2 text-xs" onClick={() => run(labPrepareDuel)}>
                4 · Prepara Duello
              </button>
              <label className="flex items-end gap-2 text-[10px] text-[var(--st-muted)]">
                Vincitore
                <select className="satze-tool-input" value={winner} onChange={(e) => setWinner(e.target.value)}>
                  <option value="player">player</option>
                  <option value="enemy">enemy</option>
                  <option value="draw">draw</option>
                </select>
              </label>
              <button
                type="button"
                className="satze-tool-btn-secondary px-3 py-2 text-xs"
                onClick={() => run((s) => labSettle(s, { winner }))}
              >
                5 · Settle
              </button>
            </div>
            {view?.error && (
              <div className="text-xs text-red-300 border border-red-800/60 bg-red-950/30 rounded px-3 py-2">
                {view.error}
              </div>
            )}
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Stato pubblico">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[view.player, view.enemy].filter(Boolean).map((side, index) => {
                  const meta = eminences.find((e) => e.id === side.eminenceId);
                  const accent = ARMY_COLORS[meta?.army]?.accent || '#94a3b8';
                  return (
                    <div key={side.eminenceId + index} className="rounded border border-[var(--st-border)] p-3 space-y-1" style={{ borderColor: `${accent}66` }}>
                      <div className="font-semibold" style={{ color: accent }}>{meta?.name || side.eminenceId}</div>
                      <div className="text-[var(--st-muted)]">Presenza {side.presence}</div>
                      <div>Scelta: <code>{side.selectedAbilityId || '—'}</code></div>
                      <div>Reveal: <code>{side.revealedAbilityId || '—'}</code></div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-[var(--st-muted)]">
                Fase lab: <code className="text-[var(--st-text)]">{view.phase}</code>
                {' · '}
                Prossimo gate: <code className="text-[var(--st-text)]">{view.nextGate || 'nessuno'}</code>
              </div>
              <JsonBlock value={{ gateProgress: view.gateProgress, lastBundle: view.lastBundle }} />
            </Section>

            <Section title="Avvisi / ricette dell’ultimo passo">
              {view.lastNotices?.length ? (
                <div className="space-y-2">
                  {view.lastNotices.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--st-muted)]">Nessun avviso in questo passo.</p>
              )}
            </Section>
          </div>

          <Section title="Cronologia passi">
            <div className="space-y-2 max-h-80 overflow-auto">
              {(view.history || []).slice().reverse().map((entry, index) => (
                <details key={`${entry.at}-${index}`} className="rounded border border-[var(--st-border)] bg-[var(--st-well)] px-3 py-2">
                  <summary className="cursor-pointer text-xs text-[var(--st-text)]">
                    <span className="uppercase tracking-wider text-[10px] text-amber-300/90 mr-2">{entry.step}</span>
                    {entry.label || entry.gateLabel || entry.gate || entry.winner || 'passo'}
                  </summary>
                  <div className="pt-2">
                    <JsonBlock value={entry} />
                  </div>
                </details>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function CatalogPanel() {
  const eminences = useMemo(() => listLabEminences(), []);
  const [id, setId] = useState(eminences[0]?.id || '');
  const selected = eminences.find((e) => e.id === id) || eminences[0];

  if (!selected) return null;

  return (
    <div className="space-y-6">
      <Section title="Catalogo implementato">
        <select className="satze-tool-input max-w-md" value={selected.id} onChange={(e) => setId(e.target.value)}>
          {eminences.map((e) => (
            <option key={e.id} value={e.id}>{e.army} — {e.name}</option>
          ))}
        </select>
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-[var(--st-text)]">{selected.name}</div>
            <div className="text-[var(--st-muted)]">{selected.army}</div>
            <div>Presenza iniziale: {selected.initialPresence}</div>
            <div>Curva: [{selected.curve.join(' / ')}]</div>
            <div>Statico: {selected.staticName || '—'}</div>
            {selected.rechargeDebt.length > 0 && (
              <div className="text-amber-300">Debito ricarica: {selected.rechargeDebt.join(', ')}</div>
            )}
          </div>
          <div className="space-y-2">
            {selected.abilities.map((ability) => (
              <div key={ability.id} className="rounded border border-[var(--st-border)] p-3">
                <div className="font-semibold text-[var(--st-text)]">
                  {ability.presenceDelta >= 0 ? `+${ability.presenceDelta}` : ability.presenceDelta}
                  {' '}{ability.name}
                </div>
                <div className="text-[10px] text-[var(--st-muted)] uppercase tracking-wider mt-0.5">
                  Gate {ability.revealGate} · {ability.implemented ? 'segmenti ok' : 'non implementata'}
                </div>
                <p className="mt-1 text-[var(--st-muted)] leading-relaxed">{ability.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

export function EminenceSystemLabPage({ onClose }) {
  const [tab, setTab] = useState('pipeline');

  const subtitle = (
    <>
      Stepper della pipeline Eminenza (motore reale), browser degli standard e timing
      editabili. Arte/forma: lab dedicato <code className="text-xs">?eminenceArtLab=1</code>.
    </>
  );

  return (
    <ToolPageShell
      title="Eminence System Lab"
      subtitle={subtitle}
      onClose={onClose}
      closeLabel="← Gioco"
      headerActions={(
        <div className="flex flex-wrap gap-1">
          <TabButton id="pipeline" label="Pipeline" active={tab === 'pipeline'} onClick={setTab} />
          <TabButton id="standards" label="Standard" active={tab === 'standards'} onClick={setTab} />
          <TabButton id="timing" label="Timing" active={tab === 'timing'} onClick={setTab} />
          <TabButton id="catalog" label="Catalogo" active={tab === 'catalog'} onClick={setTab} />
        </div>
      )}
    >
      {tab === 'pipeline' && <PipelinePanel />}
      {tab === 'standards' && <StandardsPanel />}
      {tab === 'timing' && <TimingPanel />}
      {tab === 'catalog' && <CatalogPanel />}
    </ToolPageShell>
  );
}

export default EminenceSystemLabPage;
