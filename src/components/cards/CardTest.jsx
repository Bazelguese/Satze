// ============================================
// COMPONENTE - CardTest
// Pagina di test per visualizzare una carta di prova
// ============================================

import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { CardReworkP4, CardReworkP4Scaled } from './CardReworkP4';
import { ARMY_SETS } from '../../data/cards';
import { ToolPageShell } from '../layout/ToolPageShell';

export const CardTest = () => {
  // Prendi una carta di esempio (prima carta dei Figli dell'Orizzonte)
  const exampleCard = ARMY_SETS["Figli dell'Orizzonte"][0];
  const cardWithArmy = { ...exampleCard, army: "Figli dell'Orizzonte" };
  
  const [selected, setSelected] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [small, setSmall] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [modifiedPower, setModifiedPower] = useState(null);
  const [modifiedDamage, setModifiedDamage] = useState(null);
  const [isUsed, setIsUsed] = useState(false);
  
  const usedCards = isUsed ? [cardWithArmy.id] : [];
  const previewAgent = {
    ...cardWithArmy,
    power: modifiedPower !== null ? modifiedPower : cardWithArmy.power,
    damage: modifiedDamage !== null ? modifiedDamage : cardWithArmy.damage,
  };
  
  const resetModifiers = () => {
    setModifiedPower(null);
    setModifiedDamage(null);
    setIsUsed(false);
  };
  
  return (
    <ToolPageShell
      title="Test layout carta"
      subtitle="Usa questa pagina per testare e modificare il layout delle carte."
    >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pannello di controllo */}
          <div className="space-y-6 lg:col-span-1">
            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--st-text)]">Controlli</h2>

              {/* Dimensioni */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-[var(--st-muted)]">Dimensioni</label>
                <button
                  type="button"
                  onClick={() => setSmall(!small)}
                  className={`w-full rounded-lg px-4 py-2 transition-colors ${
                    small ? 'bg-purple-600 text-white' : 'satze-tool-btn-secondary'
                  }`}
                >
                  {small ? 'Anteprima ridotta (scala)' : 'Anteprima dimensione piena'}
                </button>
              </div>
              
              {/* Stati base */}
              <div className="mb-4 space-y-2">
                <label className="mb-2 block text-sm font-medium text-[var(--st-muted)]">Stati Base</label>
                <label className="flex items-center gap-2 text-[var(--st-muted)]">
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
                <label className="flex items-center gap-2 text-[var(--st-muted)]">
                  <input
                    type="checkbox"
                    checked={isUsed}
                    onChange={(e) => setIsUsed(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Usata
                </label>
              </div>
              
              {/* Modificatori */}
              <div className="mb-4 space-y-2">
                <label className="mb-2 block text-sm font-medium text-[var(--st-muted)]">Modificatori</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="POT"
                    value={modifiedPower ?? ''}
                    onChange={(e) => setModifiedPower(e.target.value ? parseInt(e.target.value) : null)}
                    className="satze-tool-input flex-1 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="DAN"
                    value={modifiedDamage ?? ''}
                    onChange={(e) => setModifiedDamage(e.target.value ? parseInt(e.target.value) : null)}
                    className="satze-tool-input flex-1 text-sm"
                  />
                </div>
              </div>

              {/* Poteri e Bonus */}
              <div className="mb-4 space-y-2">
                <label className="mb-2 block text-sm font-medium text-[var(--st-muted)]">Poteri e Bonus</label>
                <label className="flex items-center gap-2 text-[var(--st-muted)]">
                  <input
                    type="checkbox"
                    checked={showBonus}
                    onChange={(e) => setShowBonus(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Mostra Bonus
                </label>
              </div>
              
              {/* Reset */}
              <button
                onClick={resetModifiers}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Reset Modificatori
              </button>
            </div>
            
            {/* Info carta */}
            <div className="satze-tool-panel p-6">
              <h2 className="mb-4 text-xl font-bold text-[var(--st-text)]">Info Carta</h2>
              <div className="space-y-2 text-sm text-[var(--st-muted)]">
                <div><span className="font-semibold">Nome:</span> {cardWithArmy.name}</div>
                <div><span className="font-semibold">Armata:</span> {cardWithArmy.army}</div>
                <div><span className="font-semibold">Lega:</span> {cardWithArmy.league}</div>
                <div><span className="font-semibold">Potere:</span> {cardWithArmy.power}</div>
                <div><span className="font-semibold">Danno:</span> {cardWithArmy.damage}</div>
                <div><span className="font-semibold">Potere:</span> {cardWithArmy.description}</div>
              </div>
            </div>
          </div>
          
          {/* Visualizzazione carta */}
          <div className="lg:col-span-2">
            <div className="satze-tool-panel p-8">
              <h2 className="mb-6 text-xl font-bold text-[var(--st-text)]">Anteprima Carta</h2>

              <div className="satze-tool-well flex min-h-[600px] items-center justify-center p-8">
                {small ? (
                  <CardReworkP4Scaled agent={previewAgent} width={176} />
                ) : (
                  <GameCard
                    agent={previewAgent}
                    selected={selected}
                    disabled={disabled}
                    usedCards={usedCards}
                    showBonus={showBonus}
                    onClick={() => setSelected(!selected)}
                  />
                )}
              </div>
              
              {/* Varianti multiple */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-bold text-[var(--st-text)]">Varianti Multiple</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Normale</div>
                    <CardReworkP4 agent={cardWithArmy} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Selezionata</div>
                    <GameCard agent={cardWithArmy} selected />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Piccola</div>
                    <CardReworkP4Scaled agent={cardWithArmy} width={176} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Con Bonus</div>
                    <GameCard agent={cardWithArmy} showBonus />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Potere bloccato</div>
                    <CardReworkP4 agent={cardWithArmy} />
                    <span className="mt-1 text-center text-[10px] text-[var(--st-muted)]">Stato non distinto in P4</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-[var(--st-muted)]">Usata</div>
                    <GameCard agent={cardWithArmy} usedCards={[cardWithArmy.id]} disabled />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </ToolPageShell>
  );
};
