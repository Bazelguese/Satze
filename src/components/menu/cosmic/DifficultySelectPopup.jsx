// ============================================================
// DifficultySelectPopup.jsx — "Imposta la partita" prima del duello
// ============================================================
// Menù a comparsa in stile Persona sopra la scelta esercito: formato,
// nemico (casuale o armata scelta) e difficoltà, poi INIZIA.
// Ricorda le ultime scelte. Tastiera: ↑↓ voce, ←→ valore, Invio inizia,
// Esc chiude. Va renderizzato dentro il canvas di gioco (1920×1080).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useScreenActiveRef } from '../../screenCache/ScreenCache.jsx';
import { Icon } from '../../ui/Icon';
import { getAllDifficulties } from '../../../utils';
import { ARMY_COLORS, ARMY_ICONS } from '../../../data/armies.js';
import { EMINENCE_ARMY_ORDER } from '../../../data/eminences.js';
import { MATCH_FORMATS, getMatchFormat, matchFormatIdFromMode } from '../../../data/gameModes.js';
import { MENU_ACCENTS } from '../../../theme/hudOratorioPalette';
import { playUiClick } from '../../../audio/soundBus';
import { useLeaveThen } from '../../../hooks/usePresence';
import { MC_TRAITS, MC_TRAIT_IDS } from '../../../game/ai/mc/mcTraits.js';
import { TEAMMATE_TRAIT_IDS, teammateTraitFromChoice, trustForTrait } from '../../../game/ai/mcTeam/teamTraits.js';

const ENEMY_PICK = {
  random: 'random',
  chosen: 'chosen',
};

const SETUP_STORAGE_KEY = 'satze_match_setup';

/** Modalità di partita locale: duello 1v1 e le modalità a più posti. */
const MATCH_MODES = [
  { id: 'duel', name: 'Duello', description: '1 contro 1' },
  { id: 'teamDuel', name: '2v2', description: 'Abbinamenti segreti' },
  { id: 'kingOfHill', name: 'Re della collina', description: 'Tutti contro tutti' },
];
const PLAYER_COUNTS = [3, 4];
/** Personalità dell'IA nel Duello: Neutrale (predefinita), Casuale, poi i tratti. */
const PERSONALITY_IDS = ['neutral', 'random', ...MC_TRAIT_IDS.filter((id) => id !== 'neutral')];
function personalityInfo(id) {
  if (id === 'random') {
    return { name: 'Casuale', description: 'Un tratto a sorpresa, svelato nella schermata VS.' };
  }
  return MC_TRAITS[id] || MC_TRAITS.neutral;
}
/** Le modalità a più posti non usano le Eminenze. */
const MULTI_SEAT_FORMAT_IDS = ['noEminence', 'bareHands'];

function readSetup() {
  try {
    const raw = window.localStorage?.getItem(SETUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSetup(setup) {
  try {
    window.localStorage?.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
  } catch {
    /* preferenza facoltativa */
  }
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
  /** Torneo: solo formato e difficoltà (duello 1v1, avversari decisi dal tabellone). */
  tournament = false,
}) {
  const difficulties = getAllDifficulties();
  const allFormats = useMemo(() => Object.values(MATCH_FORMATS), []);
  const armyOptions = useMemo(() => {
    const ordered = EMINENCE_ARMY_ORDER.filter((name) => ARMY_COLORS[name]);
    if (!excludeArmy) return ordered;
    return ordered.filter((name) => name !== excludeArmy);
  }, [excludeArmy]);

  // Ultime scelte; una modalità già scelta nel menù (es. Mani nude) vince sul ricordo.
  const [saved] = useState(readSetup);
  const [formatId, setFormatId] = useState(() =>
    initialMode !== 'classic' ? matchFormatIdFromMode(initialMode) : (MATCH_FORMATS[saved?.formatId]?.id ?? MATCH_FORMATS.standard.id)
  );
  const [enemyPick, setEnemyPick] = useState(() =>
    tournament ? ENEMY_PICK.random : saved?.enemyPick === ENEMY_PICK.chosen && armyOptions.includes(saved?.enemyArmy) ? ENEMY_PICK.chosen : ENEMY_PICK.random
  );
  const [chosenEnemyArmy, setChosenEnemyArmy] = useState(() =>
    armyOptions.includes(saved?.enemyArmy) ? saved.enemyArmy : null
  );
  const [difficultyId, setDifficultyId] = useState(() =>
    difficulties.some((d) => d.id === saved?.difficulty) ? saved.difficulty : 'medium'
  );
  const [matchModeId, setMatchModeIdState] = useState(() =>
    tournament ? 'duel' : MATCH_MODES.some((m) => m.id === saved?.matchMode) ? saved.matchMode : 'duel'
  );
  // Compagno del 2v2: una personalità (un vecchio preset salvato si converte).
  const [teammatePreset, setTeammatePreset] = useState(() => teammateTraitFromChoice(saved?.teammatePreset));
  const [playerCount, setPlayerCount] = useState(() => (PLAYER_COUNTS.includes(saved?.players) ? saved.players : 3));
  const [personalityId, setPersonalityId] = useState(() =>
    PERSONALITY_IDS.includes(saved?.personality) ? saved.personality : 'neutral'
  );
  const [focus, setFocusState] = useState(0);
  /** Valori correnti anche tra un tasto e l'altro, prima del nuovo render. */
  const live = useRef({ focus: 0, enemyPick, matchMode: matchModeId });

  const isMultiSeat = matchModeId !== 'duel';
  const formats = useMemo(
    () => (isMultiSeat ? allFormats.filter((f) => MULTI_SEAT_FORMAT_IDS.includes(f.id)) : allFormats),
    [allFormats, isMultiSeat]
  );
  // Nelle modalità a più posti il formato con Eminenze non c'è: si passa al primo disponibile.
  const effectiveFormatId = formats.some((f) => f.id === formatId) ? formatId : formats[0].id;

  const canConfirm = isMultiSeat || enemyPick === ENEMY_PICK.random || Boolean(chosenEnemyArmy);
  const rowsFor = (pick, mode = live.current.matchMode) => {
    if (tournament) return ['format', 'difficulty'];
    if (mode === 'teamDuel') return ['mode', 'format', 'teammate', 'difficulty', 'personality'];
    if (mode === 'kingOfHill') return ['mode', 'format', 'players', 'difficulty', 'personality'];
    return ['mode', 'format', 'enemy', ...(pick === ENEMY_PICK.chosen ? ['army'] : []), 'difficulty', 'personality'];
  };
  const setMatchModeId = (id) => {
    live.current.matchMode = id;
    setMatchModeIdState(id);
  };
  const rows = rowsFor(enemyPick, matchModeId);
  const focusKey = rows[Math.min(focus, rows.length - 1)];

  const setFocus = (i) => {
    live.current.focus = i;
    setFocusState(i);
  };
  const pickEnemy = (pick) => {
    live.current.enemyPick = pick;
    setEnemyPick(pick);
  };

  const cycle = (list, current, d) => {
    const i = Math.max(0, list.indexOf(current));
    return list[(i + d + list.length) % list.length];
  };

  const stepRow = (key, d) => {
    playUiClick();
    if (key === 'mode') setMatchModeId(cycle(MATCH_MODES.map((m) => m.id), live.current.matchMode, d));
    else if (key === 'teammate') setTeammatePreset((x) => cycle(TEAMMATE_TRAIT_IDS, x, d));
    else if (key === 'players') setPlayerCount((x) => cycle(PLAYER_COUNTS, x, d));
    else if (key === 'format') setFormatId((f) => cycle(formats.map((x) => x.id), formats.some((x) => x.id === f) ? f : formats[0].id, d));
    else if (key === 'enemy') pickEnemy(live.current.enemyPick === ENEMY_PICK.random ? ENEMY_PICK.chosen : ENEMY_PICK.random);
    else if (key === 'army') setChosenEnemyArmy((a) => cycle(armyOptions, a ?? armyOptions[d > 0 ? armyOptions.length - 1 : 0], d));
    else if (key === 'difficulty') setDifficultyId((x) => cycle(difficulties.map((y) => y.id), x, d));
    else if (key === 'personality') setPersonalityId((x) => cycle(PERSONALITY_IDS, x, d));
  };

  const [starting, setStarting] = useState(false);
  // Esc, X e clic sullo sfondo: stessa uscita della conferma, poi si chiude
  const [closing, requestClose] = useLeaveThen(onClose, 320);
  const leaving = starting || closing;
  const start = () => {
    if (!canConfirm || leaving) return;
    const format = getMatchFormat(effectiveFormatId);
    const enemyArmy = !isMultiSeat && enemyPick === ENEMY_PICK.chosen ? chosenEnemyArmy : null;
    // Torneo: restano le preferenze della partita locale, cambiano solo formato e difficoltà.
    writeSetup(tournament ? { ...saved, formatId: format.id, difficulty: difficultyId } : {
      formatId: format.id,
      enemyPick,
      enemyArmy: chosenEnemyArmy,
      difficulty: difficultyId,
      matchMode: matchModeId,
      teammatePreset,
      players: playerCount,
      personality: personalityId,
    });
    // il riquadro vola via, poi parte il passaggio al VS
    setStarting(true);
    window.setTimeout(() => onSelect({
      difficulty: difficultyId,
      mode: format.mode,
      eminenceFormat: format.eminenceFormat,
      formatId: format.id,
      enemyArmy,
      matchMode: matchModeId,
      teammatePreset,
      players: playerCount,
      personality: personalityId,
    }), 280);
  };

  const stateRef = useRef({});
  stateRef.current = { stepRow, start, requestClose, leaving };
  live.current.matchMode = matchModeId;
  const screenActiveRef = useScreenActiveRef();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (!screenActiveRef.current) return; // schermata in cache e nascosta
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // la scelta esercito sotto non deve sentire questi tasti
      e.stopImmediatePropagation();
      const k = stateRef.current;
      if (k.leaving) return;
      if (e.key === 'Escape') { e.preventDefault(); playUiClick(); k.requestClose(); return; }
      if (e.key === 'Enter') { e.preventDefault(); k.start(); return; }
      const rs = rowsFor(live.current.enemyPick);
      const cur = Math.min(live.current.focus, rs.length - 1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        playUiClick();
        setFocus((cur + (e.key === 'ArrowUp' ? -1 : 1) + rs.length) % rs.length);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        k.stepRow(rs[cur], e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const format = getMatchFormat(effectiveFormatId);
  const difficulty = difficulties.find((d) => d.id === difficultyId) || difficulties[0];
  const modeInfo = MATCH_MODES.find((m) => m.id === matchModeId) || MATCH_MODES[0];
  const mateInfo = MC_TRAITS[teammatePreset] || MC_TRAITS.neutral;
  const rowIndex = (key) => rows.indexOf(key);
  const focusProps = (key) => ({
    className: `mst-row${focusKey === key ? ' on' : ''}`,
    // solo movimenti veri: se la riga scivola sotto il cursore fermo non ruba la tastiera
    onMouseMove: (e) => {
      if ((e.movementX || e.movementY) && live.current.focus !== rowIndex(key)) setFocus(rowIndex(key));
    },
  });

  const help = {
    mode: matchModeId === 'teamDuel'
      ? 'Tu e un compagno IA contro due IA. Una squadra sceglie in segreto chi affronta chi.'
      : matchModeId === 'kingOfHill'
        ? 'Tutti contro tutti: chi vince resta sulla collina e affronta il successivo.'
        : 'Il duello classico contro un’IA.',
    teammate: `${mateInfo.name}: ${mateInfo.description} Segue i tuoi consigli ${Math.round(trustForTrait(teammatePreset) * 100)}% delle volte.`,
    players: `${playerCount} giocatori: tu e ${playerCount - 1} IA.`,
    format: format.description,
    enemy: enemyPick === ENEMY_PICK.random ? 'Armata ed esercito dell’IA scelti a caso.' : 'Scegli tu l’armata avversaria.',
    army: chosenEnemyArmy ? `Affronterai ${chosenEnemyArmy}.` : 'Scegli l’armata che affronterai.',
    difficulty: difficulty?.longDescription,
    personality: isMultiSeat && personalityId === 'random'
      ? 'Casuale: ogni avversario estrae il suo tratto, svelato nella schermata VS.'
      : `${personalityInfo(personalityId).name}: ${personalityInfo(personalityId).description}${isMultiSeat ? ' (tutti gli avversari)' : ''}`,
  }[focusKey];
  const helpLabel = {
    mode: 'MODALITÀ', teammate: 'COMPAGNO', players: 'GIOCATORI',
    format: 'FORMATO', enemy: 'NEMICO', army: 'ARMATA NEMICA', difficulty: 'DIFFICOLTÀ',
    personality: isMultiSeat ? 'AVVERSARI' : 'PERSONALITÀ',
  }[focusKey];
  const rowNumber = (key) => String(rows.indexOf(key) + 1).padStart(2, '0');

  return (
    <div className={`mst${leaving ? ' is-leaving' : ''}`} style={{ '--accent': accentColor }} onClick={leaving ? undefined : requestClose}>
      <div className="mst-card" role="dialog" aria-modal="true" aria-label={tournament ? 'Imposta il torneo' : 'Imposta la partita'} onClick={(e) => e.stopPropagation()}>
        <div className="mst-sheet">
          <header className="mst-head">
            <span className="mst-eye">{tournament ? '12 ARMATE · AL MEGLIO DELLE 3' : 'PRIMA DEL DUELLO'}</span>
            <h2>{tournament ? 'IMPOSTA IL TORNEO' : 'IMPOSTA LA PARTITA'}</h2>
            <div className="mst-who">
              <span className="army">{armyName}</span>
              {deckName ? <span className="deck">{deckName}</span> : null}
            </div>
            <button type="button" className="mst-x" onClick={requestClose} aria-label="Chiudi impostazioni partita">
              <kbd>ESC</kbd><span>INDIETRO</span>
            </button>
          </header>

          <div className="mst-rows">
            {!tournament && (
            <section {...focusProps('mode')}>
              <h3><span className="n">{rowNumber('mode')}</span>MODALITÀ</h3>
              <div className="mst-chips">
                {MATCH_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mst-chip${matchModeId === m.id ? ' sel' : ''}`}
                    aria-pressed={matchModeId === m.id}
                    onClick={() => { playUiClick(); setMatchModeId(m.id); }}
                  >
                    <span className="t">{m.name}</span>
                    <span className="d">{m.description}</span>
                  </button>
                ))}
              </div>
            </section>
            )}

            <section {...focusProps('format')}>
              <h3><span className="n">{rowNumber('format')}</span>FORMATO</h3>
              <div className="mst-chips">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`mst-chip${effectiveFormatId === f.id ? ' sel' : ''}`}
                    aria-pressed={effectiveFormatId === f.id}
                    onClick={() => { playUiClick(); setFormatId(f.id); }}
                  >
                    <span className="t">{f.name}</span>
                    <span className="d">{f.description}</span>
                  </button>
                ))}
              </div>
            </section>

            {matchModeId === 'teamDuel' && (
              <section {...focusProps('teammate')}>
                <h3><span className="n">{rowNumber('teammate')}</span>COMPAGNO</h3>
                <div className="mst-chips mst-stepper">
                  <button
                    type="button"
                    className="mst-chip mst-step"
                    aria-label="Compagno precedente"
                    onClick={() => stepRow('teammate', -1)}
                  >
                    <span className="t">‹</span>
                  </button>
                  <div className="mst-chip sel mst-step-value" aria-live="polite">
                    <span className="t">{mateInfo.name}</span>
                    <span className="d">
                      {`IA compagna · ascolta ${Math.round(trustForTrait(teammatePreset) * 100)}% · ${TEAMMATE_TRAIT_IDS.indexOf(teammatePreset) + 1}/${TEAMMATE_TRAIT_IDS.length}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mst-chip mst-step"
                    aria-label="Compagno successivo"
                    onClick={() => stepRow('teammate', 1)}
                  >
                    <span className="t">›</span>
                  </button>
                </div>
              </section>
            )}

            {matchModeId === 'kingOfHill' && (
              <section {...focusProps('players')}>
                <h3><span className="n">{rowNumber('players')}</span>GIOCATORI</h3>
                <div className="mst-chips">
                  {PLAYER_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`mst-chip${playerCount === n ? ' sel' : ''}`}
                      aria-pressed={playerCount === n}
                      onClick={() => { playUiClick(); setPlayerCount(n); }}
                    >
                      <span className="t">{n} giocatori</span>
                      <span className="d">Tu e {n - 1} IA</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!isMultiSeat && !tournament && (
            <section {...focusProps('enemy')}>
              <h3><span className="n">{rowNumber('enemy')}</span>NEMICO</h3>
              <div className="mst-chips">
                <button
                  type="button"
                  className={`mst-chip${enemyPick === ENEMY_PICK.random ? ' sel' : ''}`}
                  aria-pressed={enemyPick === ENEMY_PICK.random}
                  onClick={() => { playUiClick(); pickEnemy(ENEMY_PICK.random); }}
                >
                  <span className="t">Casuale</span>
                  <span className="d">Armata ed esercito a caso</span>
                </button>
                <button
                  type="button"
                  className={`mst-chip${enemyPick === ENEMY_PICK.chosen ? ' sel' : ''}`}
                  aria-pressed={enemyPick === ENEMY_PICK.chosen}
                  onClick={() => { playUiClick(); pickEnemy(ENEMY_PICK.chosen); }}
                >
                  <span className="t">Armata scelta</span>
                  <span className="d">La scegli tu</span>
                </button>
              </div>
            </section>
            )}

            {!isMultiSeat && enemyPick === ENEMY_PICK.chosen && (
              <section {...focusProps('army')}>
                <h3><span className="n">↳</span>ARMATA NEMICA</h3>
                <div className="mst-armies">
                  {armyOptions.map((army) => {
                    const sel = chosenEnemyArmy === army;
                    return (
                      <button
                        key={army}
                        type="button"
                        className={`mst-army${sel ? ' sel' : ''}`}
                        style={{ '--c': ARMY_COLORS[army]?.accent || accentColor }}
                        aria-pressed={sel}
                        title={army}
                        onClick={() => { playUiClick(); setChosenEnemyArmy(army); }}
                      >
                        {ARMY_ICONS[army] ? <img src={ARMY_ICONS[army]} alt="" /> : null}
                        <span>{army}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section {...focusProps('difficulty')}>
              <h3><span className="n">{rowNumber('difficulty')}</span>DIFFICOLTÀ</h3>
              <div className="mst-chips">
                {difficulties.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`mst-chip mst-diff${difficultyId === d.id ? ' sel' : ''}`}
                    style={{ '--c': d.color }}
                    aria-pressed={difficultyId === d.id}
                    onClick={() => { playUiClick(); setDifficultyId(d.id); }}
                  >
                    <span className="ic"><Icon name={d.icon} type="cardIcon" size={30} /></span>
                    <span className="t">{d.name}</span>
                    <span className="d">{d.description}</span>
                  </button>
                ))}
              </div>
            </section>

            {!tournament && (
              <section {...focusProps('personality')}>
                <h3><span className="n">{rowNumber('personality')}</span>{isMultiSeat ? 'AVVERSARI' : 'PERSONALITÀ'}</h3>
                <div className="mst-chips mst-stepper">
                  <button
                    type="button"
                    className="mst-chip mst-step"
                    aria-label="Personalità precedente"
                    onClick={() => stepRow('personality', -1)}
                  >
                    <span className="t">‹</span>
                  </button>
                  <div className="mst-chip sel mst-step-value" aria-live="polite">
                    <span className="t">{personalityInfo(personalityId).name}</span>
                    <span className="d">
                      {personalityId === 'neutral'
                        ? 'Predefinita'
                        : personalityId === 'random'
                          ? (isMultiSeat ? 'Un tratto a testa' : 'Tratto a sorpresa')
                          : 'Tratto IA'}
                      {` · ${PERSONALITY_IDS.indexOf(personalityId) + 1}/${PERSONALITY_IDS.length}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mst-chip mst-step"
                    aria-label="Personalità successiva"
                    onClick={() => stepRow('personality', 1)}
                  >
                    <span className="t">›</span>
                  </button>
                </div>
              </section>
            )}
          </div>

          <footer className="mst-foot">
            <div className="mst-help" key={`${focusKey}-${help}`}>
              <span className="lbl">{helpLabel}</span>
              <span className="hint">{canConfirm ? help : 'Scegli l’armata nemica per iniziare.'}</span>
            </div>
            <div className="mst-keys">
              <span><kbd>↑</kbd><kbd>↓</kbd>VOCE</span>
              <span><kbd>←</kbd><kbd>→</kbd>VALORE</span>
            </div>
            <button type="button" className="mst-go" disabled={!canConfirm} onClick={start}>
              <span>INIZIA</span><kbd>↵</kbd>
            </button>
          </footer>
        </div>
      </div>
      <MatchSetupStyles />
    </div>
  );
}

function MatchSetupStyles() {
  return (
    <style>{`
      .mst {
        --ink: #f5f3eb; --void: #050507; --plate: #111116; --dim: rgba(245,243,235,0.6);
        position: absolute; inset: 0; z-index: 1100; display: grid; place-items: center;
        background:
          radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent) 1.4px, transparent 1.8px) 0 0 / 11px 11px,
          rgba(5,5,7,0.84);
        font-family: 'Chakra Petch', sans-serif; color: var(--ink);
        animation: mst-fade .2s ease both;
      }
      @keyframes mst-fade { from { opacity: 0; } }
      .mst * { box-sizing: border-box; }
      .mst kbd {
        display: inline-grid; place-items: center; min-width: 24px; height: 22px; padding: 0 5px;
        background: var(--ink); color: var(--void); border: 0;
        font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 12px;
        clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      }
      .mst-card {
        width: 1460px; transform: rotate(-1.2deg);
        filter: drop-shadow(16px 16px 0 var(--accent));
        animation: mst-in .34s cubic-bezier(.2,1.2,.4,1) both;
      }
      @keyframes mst-in { from { opacity: 0; transform: rotate(-1.2deg) translateY(60px) skewX(-6deg); } }
      .mst.is-leaving { animation: mst-out-bg .32s ease forwards; }
      .mst.is-leaving .mst-card { animation: mst-out .3s cubic-bezier(.6,0,.9,.4) forwards; }
      @keyframes mst-out { to { opacity: 0; transform: rotate(4deg) translate(140px, -220px) skewX(-10deg) scale(.9); } }
      @keyframes mst-out-bg { to { background-color: transparent; opacity: 0; } }
      .mst-sheet {
        position: relative; display: flex; flex-direction: column; background: var(--void);
        clip-path: polygon(0 0, 100% 0, calc(100% - 34px) 100%, 0 100%);
      }
      .mst-sheet::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: var(--accent); }

      .mst-head { position: relative; display: flex; align-items: flex-end; gap: 24px; padding: 30px 56px 16px 52px; }
      .mst-eye {
        position: absolute; left: 50px; top: 18px; background: var(--accent); color: var(--void);
        font-weight: 700; font-size: 14px; letter-spacing: 0.28em; padding: 3px 14px; transform: skewX(-14deg);
      }
      .mst-head h2 {
        margin: 18px 0 0; font-weight: 700; font-style: italic; font-size: 84px; line-height: 0.95; letter-spacing: -0.02em;
        text-shadow: 6px 6px 0 var(--accent); white-space: nowrap;
      }
      .mst-who { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 8px; min-width: 0; }
      .mst-who .army {
        background: var(--ink); color: var(--void); font-weight: 700; font-size: 14px; letter-spacing: 0.18em;
        text-transform: uppercase; padding: 3px 12px; transform: skewX(-14deg);
      }
      .mst-who .deck { font-weight: 700; font-style: italic; font-size: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px; }
      .mst-x {
        margin-left: auto; margin-bottom: 14px; display: inline-flex; align-items: center; gap: 10px;
        border: 0; cursor: pointer; background: transparent; color: var(--ink);
        font: italic 700 20px/1 'Chakra Petch', sans-serif; letter-spacing: 0.08em;
      }
      .mst-x:hover span, .mst-x:focus-visible span { color: var(--accent); }

      .mst-rows { display: flex; flex-direction: column; gap: 12px; padding: 10px 76px 26px 52px; }
      .mst-row {
        position: relative; display: grid; grid-template-columns: 280px 1fr; align-items: center; gap: 20px;
        min-height: 88px; padding: 12px 22px 12px 34px; background: var(--plate);
        clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
        transition: background .15s, transform .18s cubic-bezier(.3,1.5,.5,1);
      }
      .mst-row::before {
        content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 6px;
        background: rgba(245,243,235,0.18); transform: skewX(-12deg); transition: background .15s;
      }
      .mst-row.on { background: #1c1c23; transform: translateX(-10px); }
      .mst-row.on::before { background: var(--accent); }
      .mst-row h3 { margin: 0; display: flex; align-items: baseline; gap: 14px; font-weight: 700; font-size: 28px; letter-spacing: 0.02em; }
      .mst-row.on h3 { font-style: italic; }
      .mst-row h3 .n { font-family: 'Share Tech Mono', monospace; font-weight: 400; font-size: 14px; color: var(--accent); }

      .mst-chips { display: flex; gap: 10px; min-width: 0; }
      .mst-chip {
        flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;
        min-height: 60px; padding: 6px 22px; border: 0; cursor: pointer; text-align: left;
        background: var(--void); color: var(--dim); font-family: inherit;
        transform: skewX(-14deg); box-shadow: inset 0 0 0 2px rgba(245,243,235,0.18);
        transition: background .15s, color .15s, box-shadow .15s, transform .15s;
      }
      .mst-chip > * { transform: skewX(14deg); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mst-chip .t { font-weight: 700; font-size: 22px; text-transform: uppercase; letter-spacing: 0.02em; }
      .mst-chip .d { font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.08em; }
      .mst-chip:hover:not(.sel), .mst-chip:focus-visible { color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
      .mst-chip.sel { background: var(--accent); color: var(--void); box-shadow: 5px 5px 0 var(--ink); transform: skewX(-14deg) translateY(-3px); }
      .mst-chip.sel .t { font-style: italic; }

      .mst-stepper { align-items: stretch; }
      .mst-step { flex: 0 0 64px; align-items: center; padding: 6px 0; }
      .mst-step .t { font-size: 30px; }
      .mst-step-value { flex: 1 1 auto; min-width: 0; cursor: default; }
      .mst-diff { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 14px; }
      .mst-diff .ic { grid-row: 1 / span 2; display: grid; place-items: center; width: 42px; height: 42px; background: color-mix(in srgb, var(--c) 22%, transparent); }
      .mst-diff .t { color: var(--c); }
      .mst-diff.sel { background: var(--c); }
      .mst-diff.sel .t { color: var(--void); }
      .mst-diff.sel .ic { background: rgba(5,5,7,0.25); }

      .mst-armies { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
      .mst-army {
        display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 10px; border: 0; cursor: pointer;
        background: var(--void); color: var(--c); font-family: inherit; text-align: left;
        transform: skewX(-12deg); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 40%, transparent);
        transition: background .15s, color .15s, box-shadow .15s;
      }
      .mst-army > * { transform: skewX(12deg); }
      .mst-army img { width: 28px; height: 28px; object-fit: contain; flex: none; }
      .mst-army span { font-weight: 700; font-size: 13px; line-height: 1.05; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .mst-army:hover, .mst-army:focus-visible { box-shadow: inset 0 0 0 2px var(--c); }
      .mst-army.sel { background: var(--c); color: var(--void); box-shadow: 4px 4px 0 var(--ink); }

      .mst-foot {
        display: flex; align-items: center; gap: 26px; padding: 18px 76px 18px 52px;
        background: var(--ink); color: var(--void);
        clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%);
      }
      .mst-help { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; padding-top: 10px; animation: mst-fade .2s ease both; }
      .mst-help .lbl {
        flex: none; background: var(--void); color: var(--ink); font-weight: 700; font-size: 14px; letter-spacing: 0.14em;
        padding: 4px 14px; transform: skewX(-14deg); box-shadow: 4px 4px 0 var(--accent);
      }
      .mst-help .hint { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mst-keys { display: flex; gap: 18px; padding-top: 10px; font-weight: 700; font-style: italic; font-size: 15px; letter-spacing: 0.1em; }
      .mst-keys span { display: inline-flex; align-items: center; gap: 4px; }
      .mst-keys kbd { background: var(--void); color: var(--ink); margin-right: 2px; }
      .mst-go {
        display: inline-flex; align-items: center; gap: 16px; border: 0; cursor: pointer; height: 66px; padding: 0 36px; margin-top: 8px;
        background: var(--accent); color: var(--void); font: italic 700 40px/1 'Chakra Petch', sans-serif; letter-spacing: 0.02em;
        transform: skewX(-14deg); box-shadow: 7px 7px 0 var(--void); transition: transform .15s, box-shadow .15s, opacity .15s;
      }
      .mst-go > * { transform: skewX(14deg); }
      .mst-go kbd { background: var(--void); color: var(--ink); font-style: normal; }
      .mst-go:hover:not(:disabled), .mst-go:focus-visible { transform: skewX(-14deg) translate(-3px,-3px) rotate(-1deg); box-shadow: 11px 11px 0 var(--void); }
      .mst-go:disabled { opacity: 0.35; cursor: not-allowed; }

      @media (prefers-reduced-motion: reduce) {
        .mst, .mst-card, .mst-help { animation: none; }
      }
    `}</style>
  );
}
