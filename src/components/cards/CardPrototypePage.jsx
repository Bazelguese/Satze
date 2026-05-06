// ============================================
// PAGINA PROTOTIPO CARTA - Sandbox per nuovi layout
// Accesso: ?cardPrototype=1
// Non altera le carte esistenti.
// ============================================

import React, { useState, useMemo } from 'react';
import { CardPrototype, LAYOUT_VARIANTS } from './CardPrototype';
import { Card } from './Card';
import { CardReworkP4, CARD_REWORK_P4_STAT_LAYOUTS, CARD_REWORK_P4_DEFAULT_STAT_LAYOUT } from './CardReworkP4';
import { ARMY_SETS } from '../../data/cards';
import { ToolPageShell } from '../layout/ToolPageShell';

const P4_STAT_LABELS = {
  center: 'Centro — POT/DAN grandi sopra il pannello (layout classico)',
  rails: 'Binari — colonnine ai lati, centro arte libero',
  corners: 'Angoli — pill compatte sotto la fascia',
  slimBar: 'Barra sottile — una riga compatta sopra il footer',
  footerMerge: 'Nel footer — POT/DAN integrati nel pannello testo',
  sashNameHud:
    'Fascia HUD (ufficiale) — cerchi POT/DAN ai lati, nome intero; L + lega a colori accanto all’armata',
  sashNameHudStack:
    'Fascia HUD — nome sopra, cerchi POT/DAN sotto; L + lega a colori accanto all’armata',
};

const VARIANT_LABELS = {
  default: 'Default',
  refined: 'Refined (padding, bordi)',
  statsSides: 'Stats ai lati',
  compact: 'Compact',
  contrast: 'Contrast (leggibilità)',
  statsTop: 'Stats in alto',
  statsInline: 'Stats inline con nome',
  fullart: 'Full Art',
  topBar: 'Top Bar (barra in alto)',
  horizontal: 'Orizzontale',
  pillStats: 'Pill Stats (badge)',
  minimal: 'Minimal',
  framed: 'Framed (cornice arte)',
  split: 'Split (info | arte)',
  stacked: 'Stacked (sezioni)',
  inverted: 'Inverted (info sopra)',
};

const ALL_CARDS = Object.entries(ARMY_SETS).flatMap(([army, cards]) =>
  cards.map((c) => ({ ...c, army }))
);

export function CardPrototypePage({ onClose }) {
  const [selectedCardId, setSelectedCardId] = useState(101);
  const [selected, setSelected] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [layoutVariant, setLayoutVariant] = useState('default');

  const card = useMemo(
    () => ALL_CARDS.find((c) => c.id === selectedCardId) || ALL_CARDS[0],
    [selectedCardId]
  );

  return (
    <ToolPageShell
      title="Prototipo carta"
      subtitle="Sandbox per sperimentare nuovi layout. Le carte del gioco non vengono modificate."
      onClose={onClose}
    >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pannello controlli */}
          <div className="space-y-6">
            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--st-text)]">Layout</h2>
              <select
                value={layoutVariant}
                onChange={(e) => setLayoutVariant(e.target.value)}
                className="satze-tool-input mb-4"
              >
                {LAYOUT_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {VARIANT_LABELS[v] || v}
                  </option>
                ))}
              </select>
            </div>

            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--st-text)]">Carta di test</h2>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(Number(e.target.value))}
                className="satze-tool-input"
              >
                {Object.entries(ARMY_SETS).map(([army, cards]) => (
                  <optgroup key={army} label={army}>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (L{c.league})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--st-text)]">Stati</h2>
              <label className="mb-2 flex items-center gap-2 text-[var(--st-muted)]">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => setSelected(e.target.checked)}
                  className="w-4 h-4"
                />
                Selezionata
              </label>
              <label className="flex items-center gap-2 text-[var(--st-muted)]">
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  className="w-4 h-4"
                />
                Disabilitata
              </label>
            </div>

            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--st-text)]">Confronto</h2>
              <label className="flex items-center gap-2 text-[var(--st-muted)]">
                <input
                  type="checkbox"
                  checked={showOriginal}
                  onChange={(e) => setShowOriginal(e.target.checked)}
                  className="w-4 h-4"
                />
                Mostra carta originale (Card) a confronto
              </label>
            </div>

            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--st-text)]">Info</h2>
              <p className="text-sm text-[var(--st-muted)]">
                Modifica <code className="text-amber-400">src/components/cards/CardPrototype.jsx</code> per
                sperimentare nuovi layout. Il componente usa la stessa API di Card/HandCard (prop <code className="text-amber-400">agent</code>).
              </p>
            </div>
          </div>

          {/* Anteprima */}
          <div className="lg:col-span-2">
            <div className="satze-tool-panel p-8">
              <h2 className="mb-6 text-lg font-bold text-[var(--st-text)]">Anteprima</h2>

              <div className="flex flex-wrap items-start justify-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="mb-3 text-sm text-[var(--st-muted)]">
                    {VARIANT_LABELS[layoutVariant]} — Prototipo
                  </div>
                  <div className="satze-tool-well p-6">
                    <CardPrototype
                      agent={card}
                      variant={layoutVariant}
                      selected={selected}
                      disabled={disabled}
                      onClick={() => setSelected(!selected)}
                    />
                  </div>
                </div>

                {showOriginal && (
                  <div className="flex flex-col items-center">
                    <div className="mb-3 text-sm text-[var(--st-muted)]">Originale (Card)</div>
                    <div className="satze-tool-well p-6">
                      <Card
                        agent={card}
                        selected={selected}
                        disabled={disabled}
                        onClick={() => setSelected(!selected)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* P4 HUD — prototipi posizione POT/DAN */}
        <div className="satze-tool-panel mt-12 p-8">
          <h2 className="mb-2 text-xl font-bold text-[var(--st-text)]">P4 HUD — prototipi POT / DAN</h2>
          <p className="mb-8 max-w-4xl text-sm text-[var(--st-muted)]">
            Confronto veloce: stesso ritaglio e fascia; solo la zona statistiche cambia. In gioco il default è{' '}
            <code className="text-amber-400">{CARD_REWORK_P4_DEFAULT_STAT_LAYOUT}</code> (prop{' '}
            <code className="text-amber-400">statLayout</code> opzionale su <code className="text-amber-400">CardReworkP4</code>
            ).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
            {CARD_REWORK_P4_STAT_LAYOUTS.map((layout) => (
              <div key={layout} className="flex flex-col items-center max-w-[240px]">
                <div className="mb-2 text-center text-xs font-semibold leading-snug text-[var(--st-text)]">{layout}</div>
                <div className="mb-3 min-h-[3.5rem] text-center text-[10px] leading-relaxed text-[var(--st-muted)]">
                  {P4_STAT_LABELS[layout] || layout}
                </div>
                <div className="satze-tool-well p-3 shadow-lg">
                  <CardReworkP4 agent={card} statLayout={layout} />
                </div>
              </div>
            ))}
          </div>
        </div>
    </ToolPageShell>
  );
}
