// Banco di prova degli effetti d'attivazione: un avviso finto e tre bersagli (Agente, Campo, PV).
// Scegli l'Eminenza e il tipo di effetto: l'animazione è la stessa che parte in partita.
import React, { useRef, useState } from 'react';
import { EMINENCES } from '../../data/eminences';
import { ARMY_COLORS } from '../../data/armies';
import { resolveArmyEntrySlug } from '../../lib/eminenzaEntry.js';
import { useEminenceEffectFx } from '../eminence/EminenceEffectFx.jsx';
import { EFFECT_FX_KINDS, semaforoLamp } from '../eminence/eminenceEffectFx.js';

const EMINENCE_LIST = Object.values(EMINENCES);

const KINDS = [
  { id: EFFECT_FX_KINDS.BOON, label: 'Sul tuo Agente', target: 'agent' },
  { id: EFFECT_FX_KINDS.BANE, label: "Sull'Agente nemico", target: 'agent' },
  { id: EFFECT_FX_KINDS.SLOT, label: 'Su un Campo', target: 'slot' },
  { id: EFFECT_FX_KINDS.HP, label: 'Sui PV', target: 'hp' },
  { id: EFFECT_FX_KINDS.AURA, label: "Solo sull'avviso", target: null },
];

const box = (extra) => ({
  position: 'absolute',
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(180,191,208,.35)',
  background: 'rgba(10,13,19,.85)',
  color: '#9aa6b8',
  font: "700 11px 'Chakra Petch', sans-serif",
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  ...extra,
});

export function EminenceEffectLab() {
  const [eminenceId, setEminenceId] = useState(EMINENCE_LIST[0].id);
  const [abilityName, setAbilityName] = useState('');
  const refs = { source: useRef(null), agent: useRef(null), slot: useRef(null), hp: useRef(null) };
  // la pagina dei lab sta a z-index 9998: qui l'effetto le passa sopra
  const { play, layer } = useEminenceEffectFx({ zIndex: 9999 });
  const eminence = EMINENCES[eminenceId];
  const accent = ARMY_COLORS[eminence.army]?.accent || '#d5ecf9';
  const theme = resolveArmyEntrySlug(eminence.army);

  const fire = (kind) => {
    play([{
      kind: kind.id,
      theme,
      accent,
      lamp: theme === 'indocili' ? semaforoLamp(abilityName || eminence.abilities?.[0]?.name) : null,
      fromEl: refs.source.current,
      toEl: kind.target ? refs[kind.target].current : null,
    }]);
  };

  return (
    <div className="space-y-4">
      <div className="satze-tool-panel p-6 space-y-3">
        <h2 className="text-lg font-bold text-[var(--st-text)]">Effetti d'attivazione</h2>
        <p className="text-xs text-[var(--st-muted)] leading-relaxed">
          Quando un'abilità si attiva, dall'avviso parte uno sciame nel motivo dell'Eminenza e il bersaglio
          riceve l'impatto. Un motivo per Eminenza; la forma dell'impatto cambia con il tipo di effetto.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            id="em-effect-lab-eminence"
            className="bg-[var(--st-well)] text-[var(--st-text)] border border-[var(--st-border)] px-2 py-1 text-sm"
            value={eminenceId}
            onChange={(e) => { setEminenceId(e.target.value); setAbilityName(''); }}
          >
            {EMINENCE_LIST.map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {item.army}</option>
            ))}
          </select>
          {theme === 'indocili' && (
            <select
              id="em-effect-lab-ability"
              className="bg-[var(--st-well)] text-[var(--st-text)] border border-[var(--st-border)] px-2 py-1 text-sm"
              value={abilityName || eminence.abilities?.[0]?.name}
              onChange={(e) => setAbilityName(e.target.value)}
            >
              {(eminence.abilities || []).map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          )}
          {KINDS.map((kind) => (
            <button
              key={kind.id}
              type="button"
              data-efx-kind={kind.id}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] bg-[var(--st-well)] text-[var(--st-text)] border border-[var(--st-border)] hover:border-[var(--st-border-hi)]"
              onClick={() => fire(kind)}
            >
              {kind.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="em-effect-lab-stage"
        style={{ position: 'relative', height: 520, background: 'radial-gradient(120% 90% at 50% 40%,#17132a,#07060d)', border: '1px solid var(--st-border)', overflow: 'hidden' }}
      >
        <div ref={refs.source} style={box({ left: 40, bottom: 60, width: 300, height: 120, borderColor: accent, color: '#fff' })}>
          Avviso · {eminence.name}
        </div>
        <div ref={refs.agent} style={box({ left: '50%', top: 110, width: 190, height: 290, marginLeft: -95 })}>Agente</div>
        <div ref={refs.slot} style={box({ right: 60, top: 60, width: 300, height: 56 })}>Campo</div>
        <div ref={refs.hp} style={box({ right: 60, bottom: 60, width: 120, height: 60 })}>PV</div>
      </div>
      {layer}
    </div>
  );
}

export default EminenceEffectLab;
