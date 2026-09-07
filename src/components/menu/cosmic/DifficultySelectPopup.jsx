import { useMemo, useState } from 'react';
import { Icon } from '../../ui/Icon';
import { getAllDifficulties } from '../../../utils';
import { ARMY_COLORS, ARMY_ICONS } from '../../../data/armies.js';
import { EMINENCE_ARMY_ORDER } from '../../../data/eminences.js';
import { MATCH_FORMATS, getMatchFormat, matchFormatIdFromMode } from '../../../data/gameModes.js';
import { MENU_ACCENTS, HUD_ORATORIO_FONT_DISPLAY, HUD_ORATORIO_FONT_UI, PALETTE } from '../../../theme/hudOratorioPalette';

const ENEMY_PICK = {
  random: 'random',
  chosen: 'chosen',
};

function OptionChip({ active, accentColor, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: active ? accentColor : 'rgba(74, 63, 102, 0.7)',
        background: active
          ? `linear-gradient(180deg, ${accentColor}28 0%, rgba(8,7,13,0.92) 100%)`
          : 'linear-gradient(180deg, rgba(20,8,28,0.85) 0%, rgba(8,7,13,0.9) 100%)',
        boxShadow: active ? `0 0 14px ${accentColor}33` : 'none',
        color: PALETTE.textPrimary,
        fontFamily: HUD_ORATORIO_FONT_UI,
      }}
    >
      {children}
    </button>
  );
}

export function DifficultySelectPopup({
  isOpen,
  onClose,
  onSelect,
  armyName,
  deckName,
  accentColor = MENU_ACCENTS.magenta,
  initialMode = 'classic',
  excludeArmy = null,
}) {
  const difficulties = getAllDifficulties();
  const formats = useMemo(() => Object.values(MATCH_FORMATS), []);
  const armyOptions = useMemo(() => {
    const ordered = EMINENCE_ARMY_ORDER.filter((name) => ARMY_COLORS[name]);
    if (!excludeArmy) return ordered;
    return ordered.filter((name) => name !== excludeArmy);
  }, [excludeArmy]);

  const [formatId, setFormatId] = useState(() => matchFormatIdFromMode(initialMode));
  const [enemyPick, setEnemyPick] = useState(ENEMY_PICK.random);
  const [chosenEnemyArmy, setChosenEnemyArmy] = useState(null);

  if (!isOpen) return null;

  const canConfirm =
    enemyPick === ENEMY_PICK.random || Boolean(chosenEnemyArmy);

  const handleConfirm = (diffId) => {
    if (!canConfirm) return;
    const format = getMatchFormat(formatId);
    onSelect({
      difficulty: diffId,
      mode: format.mode,
      eminenceFormat: format.eminenceFormat,
      formatId: format.id,
      enemyArmy: enemyPick === ENEMY_PICK.chosen ? chosenEnemyArmy : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative mx-4 max-w-4xl w-full border-2 rounded-xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: accentColor,
          background: 'linear-gradient(180deg, #0c0614 0%, #140f22 48%, #080612 100%)',
          boxShadow: `0 0 36px ${accentColor}55, 0 0 72px rgba(88, 28, 135, 0.2)`,
          fontFamily: HUD_ORATORIO_FONT_UI,
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between sticky top-0 z-10"
          style={{ borderBottom: '1px solid rgba(74, 63, 102, 0.55)', background: `${accentColor}12`, backdropFilter: 'blur(8px)' }}
        >
          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                color: PALETTE.textPrimary,
                textShadow: `0 0 22px ${accentColor}70, 0 2px 4px #000`,
              }}
            >
              Imposta la partita
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {armyName}
              {deckName ? ` · "${deckName}"` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-fuchsia-200 transition-colors text-2xl leading-none"
            aria-label="Chiudi impostazioni partita"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3
              className="text-sm uppercase tracking-[0.14em] text-slate-400 mb-3"
              style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
            >
              Formato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {formats.map((format) => {
                const active = formatId === format.id;
                return (
                  <OptionChip
                    key={format.id}
                    active={active}
                    accentColor={accentColor}
                    onClick={() => setFormatId(format.id)}
                  >
                    <p
                      className="text-sm font-semibold m-0"
                      style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY, color: active ? accentColor : PALETTE.textPrimary }}
                    >
                      {format.name}
                    </p>
                    <p className="text-xs text-slate-400 m-0 mt-1">{format.description}</p>
                  </OptionChip>
                );
              })}
            </div>
          </section>

          <section>
            <h3
              className="text-sm uppercase tracking-[0.14em] text-slate-400 mb-3"
              style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
            >
              Nemico
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <OptionChip
                active={enemyPick === ENEMY_PICK.random}
                accentColor={accentColor}
                onClick={() => {
                  setEnemyPick(ENEMY_PICK.random);
                  setChosenEnemyArmy(null);
                }}
              >
                <p
                  className="text-sm font-semibold m-0"
                  style={{
                    fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                    color: enemyPick === ENEMY_PICK.random ? accentColor : PALETTE.textPrimary,
                  }}
                >
                  Casuale
                </p>
                <p className="text-xs text-slate-400 m-0 mt-1">Armata e esercito IA a caso</p>
              </OptionChip>
              <OptionChip
                active={enemyPick === ENEMY_PICK.chosen}
                accentColor={accentColor}
                onClick={() => setEnemyPick(ENEMY_PICK.chosen)}
              >
                <p
                  className="text-sm font-semibold m-0"
                  style={{
                    fontFamily: HUD_ORATORIO_FONT_DISPLAY,
                    color: enemyPick === ENEMY_PICK.chosen ? accentColor : PALETTE.textPrimary,
                  }}
                >
                  Armata scelta
                </p>
                <p className="text-xs text-slate-400 m-0 mt-1">Scegli tu l&apos;armata avversaria</p>
              </OptionChip>
            </div>

            {enemyPick === ENEMY_PICK.chosen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {armyOptions.map((army) => {
                  const armyAccent = ARMY_COLORS[army]?.accent || accentColor;
                  const active = chosenEnemyArmy === army;
                  const logoSrc = ARMY_ICONS[army];
                  return (
                    <button
                      key={army}
                      type="button"
                      onClick={() => setChosenEnemyArmy(army)}
                      className="rounded-lg border px-2 py-2 flex items-center gap-2 text-left transition-all"
                      style={{
                        borderColor: active ? armyAccent : 'rgba(74, 63, 102, 0.55)',
                        background: active
                          ? `linear-gradient(180deg, ${armyAccent}30 0%, rgba(8,7,13,0.95) 100%)`
                          : 'rgba(8,7,13,0.75)',
                        boxShadow: active ? `0 0 12px ${armyAccent}44` : 'none',
                      }}
                    >
                      {logoSrc ? (
                        <img src={logoSrc} alt="" className="w-7 h-7 object-contain shrink-0" />
                      ) : (
                        <span className="w-7 h-7 shrink-0" />
                      )}
                      <span
                        className="text-[11px] leading-tight font-semibold"
                        style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY, color: armyAccent }}
                      >
                        {army}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3
              className="text-sm uppercase tracking-[0.14em] text-slate-400 mb-3"
              style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY }}
            >
              Difficoltà
            </h3>
            {!canConfirm && (
              <p className="text-xs text-amber-300/90 mb-2 m-0">
                Seleziona un&apos;armata nemica per continuare.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => handleConfirm(diff.id)}
                  className="text-left rounded-xl p-4 border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    borderColor: `${diff.color}66`,
                    background: 'linear-gradient(180deg, rgba(20,8,28,0.95) 0%, rgba(8,7,13,0.95) 100%)',
                    boxShadow: `0 0 16px ${diff.color}22`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name={diff.icon} type="cardIcon" size={28} />
                    <div>
                      <p
                        className="text-base font-semibold"
                        style={{ fontFamily: HUD_ORATORIO_FONT_DISPLAY, color: diff.color }}
                      >
                        {diff.name}
                      </p>
                      <p className="text-xs text-slate-400">{diff.description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 m-0">{diff.longDescription}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
