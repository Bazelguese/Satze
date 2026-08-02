import React, { useMemo, useState } from 'react';
import { MENU_ACCENTS } from '../../theme/hudOratorioPalette';
import { CardReworkP4 } from '../cards/CardReworkP4';
import { Icon } from '../ui/Icon';
import { getCardDisplayLabels } from '../../data/cardArchetypes';

const TRIGGER_MULTIPLIERS = {
  default: 1.0,
  alleato: 0.96,
  rinforzi: 0.55,
  imboscata: 0.7,
  intervention: 0.7,
  glory: 0.6,
  vendetta: 0.6,
  conquest: 0.6,
  lastWish: 0.6,
  sfida: 0.6,
  sopraffare: 0.6,
  reckoning: 0.5,
  overdrive: 0.5,
  opportunista: 0.5,
  invasione: 0.5,
  resistenza: 0.5,
  rimonta: 0.4,
  magnanimous: 0.4,
  ultimaChance: 0.4,
  turbo: 0.3,
};

const BONUS_PROFILE = {
  "Figli dell'Orizzonte": { nonStatEff: 0.77, nonStatPot: 0.77 },
  Kethran: { statPot: 2, statDan: 0, trigger: 'rimonta' },
  'Corte Rossa': { nonStatEff: 0.8, nonStatPot: 0.8 },
  'Calibri Pesanti': { nonStatEff: 0.7, nonStatPot: 0.7 },
  Orathai: { statPot: 0, statDan: 2, trigger: 'reckoning' },
  Mounthborn: { statPot: 1, statDan: 1, trigger: 'imboscata' },
  "L'Enclave delle Scaglie": { nonStatEff: 0.84, nonStatPot: 1.4 },
  'Ratti della Megera': { nonStatEff: 0.21, nonStatPot: 0.35 },
  'Patto degli Indocili': { nonStatEff: 0.36, nonStatPot: 0.65 },
  Khemet: { nonStatEff: 1.0, nonStatPot: 2.0 },
};

function minEfficacy(minValue) {
  if (typeof minValue !== 'number') return 1;
  if (minValue <= 2) return 0.8;
  if (minValue <= 4) return 0.7;
  return 0.55;
}

function getTriggerMultiplier(trigger, effect) {
  if (!trigger) return 1.0;
  if (trigger === 'ultimaChance' && (effect === 'focusCoin' || effect === 'toxin')) return 0.2;
  return TRIGGER_MULTIPLIERS[trigger] ?? TRIGGER_MULTIPLIERS.default;
}

function getNonStatBaseValue(ability) {
  if (!ability?.effect) return 0;
  const absValue = Math.abs(Number(ability.value || 0));
  switch (ability.effect) {
    case 'assaultValue':
      return absValue * 0.28;
    case 'focusCoin':
      return absValue * 0.7;
    case 'directDamage':
      return absValue * 0.5;
    case 'heal':
      return absValue * 0.2;
    case 'selfDamage':
      return -absValue * 0.2;
    case 'enemyPower':
      return absValue * 0.5 * minEfficacy(ability.minPower);
    case 'enemyDamage':
      return absValue * 0.35 * minEfficacy(ability.minDamage);
    case 'enemyAssault':
      return absValue * 0.28 * minEfficacy(ability.minAssault);
    case 'enemyPowerAndDamage': {
      const floor = minEfficacy(Math.min(ability.minPower ?? 99, ability.minDamage ?? 99));
      return absValue * (0.5 + 0.35) * floor;
    }
    case 'copyAbility':
    case 'copyPower':
    case 'imponiPower':
      return 1.5;
    case 'copyDamage':
    case 'imponiDamage':
      return 1.0;
    case 'blockAbility':
      return 1.5;
    case 'blockBonus':
      return 1.0;
    case 'copyBonus':
      return 0.8;
    case 'immune':
      return 2.0;
    case 'inversion':
      return 1.0;
    case 'toxin':
      return absValue * 0.35;
    default:
      return 0;
  }
}

function getStatModDelta(ability, mode) {
  if (!ability?.effect) return { pot: 0, dan: 0 };
  const absValue = Math.abs(Number(ability.value || 0));
  const triggerMul = mode === 'effective' ? getTriggerMultiplier(ability.trigger, ability.effect) : 1;
  switch (ability.effect) {
    case 'power':
      return { pot: absValue * triggerMul, dan: 0 };
    case 'damage':
      return { pot: 0, dan: absValue * triggerMul };
    case 'powerAndDamage':
      return { pot: absValue * triggerMul, dan: absValue * triggerMul };
    case 'attrition': {
      const factor = mode === 'effective' ? 2 : 4;
      if (ability.stat === 'damage') return { pot: 0, dan: absValue * factor };
      return { pot: absValue * factor, dan: 0 };
    }
    case 'escalation': {
      const factor = mode === 'effective' ? 1.3 : 2;
      if (ability.stat === 'damage') return { pot: 0, dan: absValue * factor };
      return { pot: absValue * factor, dan: 0 };
    }
    default:
      return { pot: 0, dan: 0 };
  }
}

function evaluateCardBalance(card) {
  const basePot = Number(card.power ?? card.pot ?? 0);
  const baseDan = Number(card.damage ?? card.dan ?? 0);
  const league = Number(card.league ?? card.lega ?? 1) || 1;
  const ability = card.ability || null;
  const armyBonus = BONUS_PROFILE[card.army] || null;

  const statEff = getStatModDelta(ability, 'effective');
  const statPot = getStatModDelta(ability, 'potential');

  if (armyBonus?.statPot || armyBonus?.statDan) {
    const bonusMul = getTriggerMultiplier(armyBonus.trigger, 'powerAndDamage');
    statEff.pot += (armyBonus.statPot || 0) * bonusMul;
    statEff.dan += (armyBonus.statDan || 0) * bonusMul;
    statPot.pot += armyBonus.statPot || 0;
    statPot.dan += armyBonus.statDan || 0;
  }

  const bodyEff = (basePot + statEff.pot) * 0.5 + (baseDan + statEff.dan) * 0.35;
  const bodyPot = (basePot + statPot.pot) * 0.5 + (baseDan + statPot.dan) * 0.35;

  const nonStatBase = getNonStatBaseValue(ability);
  const nonStatEff = nonStatBase * getTriggerMultiplier(ability?.trigger, ability?.effect);
  const nonStatPot = nonStatBase;

  const bonusNonStatEff = armyBonus?.nonStatEff || 0;
  const bonusNonStatPot = armyBonus?.nonStatPot || 0;

  const totalValue = bodyEff + nonStatEff + bonusNonStatEff;
  const potentialValue = bodyPot + nonStatPot + bonusNonStatPot;

  return {
    totalValue,
    potentialValue,
    efficiency: totalValue / league,
  };
}

function DeckPreviewCosmic({
  deck = null,
  onBack = () => {},
  onEdit = null,
  onConfirm = null,
  showActions = true,
}) {
  const ACCENT = MENU_ACCENTS.magenta;
  const HEAT = MENU_ACCENTS.pink;
  const VIOLET = '#a78bfa';
  const DEEP = '#581c87';
  const BG = MENU_ACCENTS.void;

  const fallbackDeck = useMemo(
    () => ({
      id: '__empty',
      name: 'Nessun esercito',
      army: 'Misto',
      accentColor: '#a78bfa',
      cards: [],
    }),
    []
  );

  const D = deck || fallbackDeck;
  const cards = Array.isArray(D.cards) ? D.cards.slice(0, 10) : [];
  const displayArmies = useMemo(() => {
    const fromCards = [...new Set(cards.map((c) => c?.army).filter(Boolean))];
    if (fromCards.length) return fromCards.slice(0, 2);
    if (Array.isArray(D.armies) && D.armies.length) return D.armies.slice(0, 2);
    return D.army ? [D.army] : [];
  }, [cards, D.armies, D.army]);
  const [selectedIndex, setSelectedIndex] = useState(cards.length ? 0 : -1);
  const selectedCard = selectedIndex >= 0 ? cards[selectedIndex] : null;
  const selectedTags = selectedCard
    ? (selectedCard.displayLabels?.length
        ? selectedCard.displayLabels
        : getCardDisplayLabels(selectedCard.id))
    : [];
  const deckHighlights = useMemo(() => {
    if (!cards.length) return null;
    const byPower = cards.reduce((best, cur) => ((cur.power ?? cur.pot ?? 0) > (best.power ?? best.pot ?? 0) ? cur : best), cards[0]);
    const byDamage = cards.reduce((best, cur) => ((cur.damage ?? cur.dan ?? 0) > (best.damage ?? best.dan ?? 0) ? cur : best), cards[0]);
    const scored = cards.map((c) => ({ card: c, metrics: evaluateCardBalance(c) }));
    const byPotential = scored.reduce((best, cur) => (cur.metrics.potentialValue > best.metrics.potentialValue ? cur : best), scored[0]);
    const mascot = scored.reduce((best, cur) => (cur.metrics.totalValue < best.metrics.totalValue ? cur : best), scored[0]);
    return { byPower, byDamage, byPotential, mascot };
  }, [cards]);
  const accent = D.accentColor || '#fbbf24';

  const totalLega = cards.reduce((sum, c) => sum + (c?.league || c?.lega || 0), 0);
  const avgPot = cards.length ? (cards.reduce((sum, c) => sum + (c?.power || c?.pot || 0), 0) / cards.length).toFixed(1) : '0';
  const avgDan = cards.length ? (cards.reduce((sum, c) => sum + (c?.damage || c?.dan || 0), 0) / cards.length).toFixed(1) : '0';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: BG,
        color: MENU_ACCENTS.text,
        fontFamily: 'Chakra Petch, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, #2a0a3a 0%, #14051f 52%, ${MENU_ACCENTS.void} 90%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          backgroundImage: `radial-gradient(${ACCENT} 1px, transparent 1.4px)`,
          backgroundSize: '8px 8px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -56,
          left: -38,
          fontFamily: 'Cinzel, serif',
          fontWeight: 900,
          fontSize: 320,
          lineHeight: 0.75,
          letterSpacing: '-0.04em',
          color: 'transparent',
          WebkitTextStroke: `2px ${ACCENT}1f`,
          transform: 'skewX(-8deg) rotate(-2deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        ESERCITO
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px 36px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${ACCENT}33`,
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${VIOLET}88`,
            color: VIOLET,
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.3em',
            fontWeight: 700,
            clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
            cursor: 'pointer',
          }}
        >
          ← INDIETRO
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 62,
              background: `linear-gradient(180deg, ${accent} 0%, ${DEEP} 100%)`,
              clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${accent}88`,
              overflow: 'hidden',
            }}
          >
            {displayArmies.length > 1 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(6,3,10,0.45)' }}>
                  <Icon name={displayArmies[0]} type="army" size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={displayArmies[1]} type="army" size={16} />
                </div>
              </div>
            ) : (
              <Icon name={displayArmies[0] || D.army} type="army" size={30} />
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: HEAT, letterSpacing: '0.45em' }}>· ANTEPRIMA ESERCITO ·</div>
            <div
              style={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: '0.2em',
                textShadow: `2px 2px 0 ${ACCENT}88`,
              }}
            >
              «{(D.name || 'ESERCITO').toUpperCase()}»
            </div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: accent, letterSpacing: '0.3em' }}>
              {(displayArmies.length >= 2 ? displayArmies.join(' · ') : (D.army || '—')).toUpperCase()} · {cards.length} CARTE · {totalLega} LEGA
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <MiniStat label="LEGA" value={`${totalLega}/30`} c="#22d3ee" />
          <MiniStat label="POT MED" value={avgPot} c={HEAT} />
          <MiniStat label="DAN MED" value={avgDan} c={VIOLET} />
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 22,
          padding: '18px 30px',
          height: 'calc(100% - 96px - 90px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '20px 16px',
            alignItems: 'center',
            justifyItems: 'center',
            minHeight: 0,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const c = cards[i] || null;
            if (!c) {
              return (
                <div
                  key={`empty-${i}`}
                  style={{
                    width: 220,
                    height: 320,
                    border: `1px dashed ${ACCENT}44`,
                    background: 'rgba(8,5,14,0.45)',
                  }}
                />
              );
            }
            const active = i === selectedIndex;
            return (
              <button
                key={c.id ?? i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                style={{
                  width: 220,
                  height: 320,
                  border: active ? `2px solid ${HEAT}` : `1px solid ${ACCENT}55`,
                  boxShadow: active ? `0 0 26px ${HEAT}99` : `0 0 12px ${ACCENT}44`,
                  transform: active ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -8,
                    zIndex: 4,
                    width: 30,
                    height: 34,
                    background: active ? `linear-gradient(180deg, ${HEAT} 0%, ${DEEP} 100%)` : `linear-gradient(180deg, ${ACCENT} 0%, ${DEEP} 100%)`,
                    clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 900,
                    fontSize: 13,
                    color: MENU_ACCENTS.void,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ transform: 'scale(0.9565)', transformOrigin: 'top left', width: 230, height: 330 }}>
                  <div style={{ pointerEvents: 'none' }}>
                    <CardReworkP4 agent={c} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, rgba(14,5,24,0.88) 0%, rgba(6,3,10,0.84) 100%)',
            border: `1px solid ${ACCENT}55`,
            padding: 16,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
          }}
        >
          {selectedCard ? (
            <>
              <div style={{ minHeight: 0, overflow: 'auto' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, letterSpacing: '0.08em', fontSize: 20, color: MENU_ACCENTS.text }}>
                  {selectedCard.name}
                </div>
                <div style={{ marginTop: 4, fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.25em', color: '#94a3b8' }}>
                  LEGA {selectedCard.league || selectedCard.lega || 0} · ARMATA {(selectedCard.army || D.army || '—').toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <BigStat label="POT" value={selectedCard.power ?? selectedCard.pot ?? 0} c={HEAT} />
                  <BigStat label="DAN" value={selectedCard.damage ?? selectedCard.dan ?? 0} c={VIOLET} />
                </div>
                <div style={{ marginTop: 12, padding: '10px 12px', border: `1px solid ${HEAT}55`, background: `${HEAT}12` }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: HEAT, letterSpacing: '0.22em', marginBottom: 4 }}>POTERE — DETTAGLIO</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.35 }}>
                    {selectedCard.powerDesc || selectedCard.description || selectedCard.abilityText || selectedCard.powerEffect || '—'}
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: '10px 12px', border: `1px solid ${VIOLET}55`, background: `${VIOLET}12` }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: VIOLET, letterSpacing: '0.22em', marginBottom: 4 }}>BONUS — DETTAGLIO</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.35 }}>
                    {selectedCard.bonusDesc || selectedCard.bonusEffect || '—'}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: '#94a3b8', letterSpacing: '0.22em', marginBottom: 6 }}>
                    ARCHETIPO · FOCUS
                  </div>
                  {selectedTags.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedTags.map(({ text, kind }) => {
                        const colors = {
                          archetype: { color: '#fbbf24', bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.45)' },
                          secondary: { color: '#cbd5e1', bg: 'rgba(100,116,139,0.22)', border: 'rgba(148,163,184,0.35)' },
                          focus: { color: '#67e8f9', bg: 'rgba(103,232,249,0.14)', border: 'rgba(103,232,249,0.4)' },
                          scaling: { color: '#c084fc', bg: 'rgba(192,132,252,0.14)', border: 'rgba(192,132,252,0.42)' },
                        }[kind] || { color: '#cbd5e1', bg: 'rgba(100,116,139,0.22)', border: 'rgba(148,163,184,0.35)' };
                        return (
                          <span
                            key={`${kind}-${text}`}
                            style={{
                              fontSize: 11,
                              color: colors.color,
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              padding: '3px 8px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {kind === 'secondary' ? `/ ${text}` : text}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Nessun tag disponibile.</div>
                  )}
                </div>
                {selectedCard.flavor ? (
                  <div style={{ marginTop: 12, fontFamily: 'Cinzel, serif', fontStyle: 'italic', fontSize: 13, color: '#cbd5e1' }}>
                    “{selectedCard.flavor}”
                  </div>
                ) : null}
                {deckHighlights ? (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${ACCENT}55` }}>
                    <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#d8e1ee', letterSpacing: '0.2em', marginBottom: 10, textShadow: '0 0 10px rgba(192,38,211,0.35)' }}>
                      PROFILO ESERCITO
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <InfoLine label="Agente con Potenza più alta" value={deckHighlights.byPower.name} />
                      <InfoLine label="Agente con Danno più alto" value={deckHighlights.byDamage.name} />
                      <InfoLine
                        label="Agente con Potenziale più alto"
                        value={deckHighlights.byPotential.card.name}
                      />
                      <InfoLine
                        label="Agente Mascotte"
                        value={deckHighlights.mascot.card.name}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', color: '#94a3b8', letterSpacing: '0.3em' }}>
              SELEZIONA UNA CARTA
            </div>
          )}
        </div>
      </div>

      {showActions ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 34,
            zIndex: 5,
            padding: '0 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#94a3b8', letterSpacing: '0.25em' }}>
            // ANTEPRIMA COMPLETA ESERCITO
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onEdit ? (
              <button
                onClick={() => onEdit(D)}
                style={{
                  padding: '11px 22px',
                  background: 'transparent',
                  border: `1px solid ${VIOLET}88`,
                  color: VIOLET,
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  fontWeight: 700,
                  clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                  cursor: 'pointer',
                }}
              >
                ✎ MODIFICA
              </button>
            ) : null}
            {onConfirm ? (
              <button
                onClick={() => onConfirm(D)}
                style={{
                  padding: '12px 28px',
                  background: `linear-gradient(90deg, ${ACCENT} 0%, ${HEAT} 100%)`,
                  border: 'none',
                  color: MENU_ACCENTS.void,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 900,
                  fontSize: 15,
                  letterSpacing: '0.3em',
                  cursor: 'pointer',
                  clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                  boxShadow: `0 0 24px ${HEAT}88, 0 4px 0 ${DEEP}`,
                }}
              >
                SCHIERA ESERCITO ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value, c }) {
  return (
    <div
      style={{
        padding: '6px 12px',
        background: MENU_ACCENTS.void,
        border: `1px solid ${c}55`,
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        minWidth: 94,
      }}
    >
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: '#94a3b8', letterSpacing: '0.3em' }}>{label}</div>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 20, color: c, lineHeight: 1.05 }}>{value}</div>
    </div>
  );
}

function BigStat({ label, value, c }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        background: MENU_ACCENTS.void,
        border: `1px solid ${c}55`,
      }}
    >
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: '#94a3b8', letterSpacing: '0.3em' }}>{label}</div>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 26, color: c, lineHeight: 1.05 }}>{value}</div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 4,
        padding: '8px 10px',
        border: '1px solid rgba(148,163,184,0.26)',
        background: 'rgba(15,23,42,0.32)',
      }}
    >
      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#d1d9e6', letterSpacing: '0.13em', textShadow: '0 0 6px rgba(148,163,184,0.25)' }}>{label}:</div>
      <div style={{ fontSize: 17, color: '#ffffff', lineHeight: 1.2, fontWeight: 700, textShadow: '0 0 10px rgba(255,255,255,0.16)' }}>{value}</div>
    </div>
  );
}

export default DeckPreviewCosmic;
