// ============================================
// CARD REWARD CHOICE - Ricompensa post-duello vinto
// Design: 1-2 carte proposte, accetta una o nessuna;
// se mazzo pieno, scarta una (non Avatar) per fare spazio.
// ============================================

import React, { useState, useEffect } from 'react';
import { ALL_AGENTS, ARMY_COLORS } from '../../data';
import { CardReworkP4 } from '../cards';
import { Icon } from '../ui/Icon';

/**
 * Propose 1-2 agents from current armata pool (design: "1-2 carte proposte (dell'armata corrente)").
 * Z1: availableArmies = 4 armate; Z2/Z3: chosen army.
 */
export function generateRewardProposals(availableArmies, zoneNumber, currentDeckIds = [], count = 2) {
  const leagueMap = { 1: 2, 2: 3, 3: 3, 4: 4 };
  const L = leagueMap[zoneNumber] ?? 2;
  const excludeIds = new Set(currentDeckIds);
  const eligible = ALL_AGENTS.filter(
    (a) =>
      a.league === L &&
      availableArmies.includes(a.army) &&
      !excludeIds.has(a.id)
  );
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const n = Math.min(count, shuffled.length);
  return shuffled.slice(0, n);
}

export default function CardRewardChoice({
  availableArmies,
  zoneNumber,
  currentDeck,
  maxDeckSize,
  onAccept,
  onSkip,
}) {
  const [proposals, setProposals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null); // da scartare se mazzo pieno
  const [needDiscard, setNeedDiscard] = useState(false);

  const isAvatar = (c) => c && c.bonus === 'gregario';
  const nonAvatarDeck = (currentDeck || []).filter((c) => !isAvatar(c));

  useEffect(() => {
    const deckIds = (currentDeck || []).map((c) => c.id).filter(Boolean);
    const p = generateRewardProposals(availableArmies, zoneNumber, deckIds, 2);
    setProposals(p);
    setSelected(null);
    setDiscardTarget(null);
    setNeedDiscard(false);
  }, [availableArmies, zoneNumber, currentDeck?.length]);

  const deckFull = (currentDeck || []).length >= maxDeckSize;
  const canTakeOne = !deckFull || (deckFull && discardTarget);

  const handleSelectCard = (agent) => {
    if (!agent) return;
    setSelected(agent);
    if (deckFull) {
      setNeedDiscard(true);
      setDiscardTarget(null);
    } else {
      setNeedDiscard(false);
      setDiscardTarget(null);
    }
  };

  const handleDiscard = (card) => {
    if (isAvatar(card)) return;
    setDiscardTarget(card);
  };

  const handleConfirm = () => {
    if (selected && canTakeOne) {
      onAccept({ add: selected, remove: discardTarget || undefined });
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            Vittoria! Scegli una ricompensa
          </h2>
          <p className="text-slate-300 text-sm">
            Esercito: {(currentDeck || []).length}/{maxDeckSize} carte
            {deckFull && ' — Pieno: scarta una carta per accettarne una nuova.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {proposals.map((agent, idx) => {
            const colors = ARMY_COLORS[agent.army] || { accent: '#64748b' };
            const isSelected = selected?.id === agent.id;
            return (
              <button
                key={agent.id ?? idx}
                onClick={() => handleSelectCard(agent)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-900/20 shadow-lg shadow-yellow-400/30'
                    : 'border-slate-600 bg-slate-800/80 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon name={agent.army} type="army" size={44} color={colors.accent} />
                  <div>
                    <div className="font-bold text-white">{agent.name}</div>
                    <div className="text-xs text-slate-400">
                      {agent.army} · Lega {agent.league} · POT {agent.power} DAN {agent.damage}
                    </div>
                  </div>
                  {isSelected && <span className="ml-auto text-green-400 text-xl">✓</span>}
                </div>
                <div className="scale-50 origin-top-left">
                  <CardReworkP4 agent={agent} />
                </div>
              </button>
            );
          })}
        </div>

        {needDiscard && (
          <div className="mb-6 p-4 rounded-xl bg-amber-900/30 border border-amber-500/50">
            <div className="text-amber-200 font-bold mb-2">Scarta una carta per fare spazio (l’Avatar non si può scartare)</div>
            <div className="flex flex-wrap gap-2">
              {nonAvatarDeck.map((c, idx) => {
                const active = discardTarget && (c.id === discardTarget.id);
                return (
                  <button
                    key={c.id ?? idx}
                    onClick={() => handleDiscard(c)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      active ? 'border-amber-400 bg-amber-500/30' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    {c.name} (L{c.league})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={!selected || !canTakeOne}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Accetta carta
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-bold transition-all"
          >
            Nessuna carta
          </button>
        </div>
      </div>
    </div>
  );
}
