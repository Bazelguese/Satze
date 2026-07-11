import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ToolPageShell } from '../layout/ToolPageShell';
import { SatzeDialogueLayer } from '../dialogue/SatzeDialogueLayer';
import { ARMY_SETS } from '../../data/cards';
import { ARMY_COLORS } from '../../data/armies';
import { ARMY_DIALOGUE_OPTIONS } from '../../dialogue/armyDialogueMap.js';
import { ARMY } from '../../dialogue/satzeDialogue.js';
import {
  armyHasDialogueData,
  countDialogueCards,
  getCardDialogues,
  getDialoguePool,
  resolveDialogueSayOptions,
  STAT_NEMICO_BANDS,
} from '../../dialogue/selectDialogueLine.js';
import './dialogueLab.css';

const LAB_EVENTS = [
  { id: 'entrata', label: 'Entrata' },
  { id: 'triggerAttivato', label: 'Trigger' },
  { id: 'vince', label: 'Vince' },
  { id: 'perde', label: 'Perde' },
  { id: 'statNemico.colosso', label: 'vs Colosso' },
  { id: 'statNemico.fragile', label: 'vs Fragile' },
  { id: 'statNemico.spinato', label: 'vs Spinato' },
  { id: 'morte', label: 'Morte' },
  { id: 'lore', label: 'Lore' },
];

const SIDE_LAYOUT = {
  player: { x: '32%', tail: '38%', sceneSlot: 'left' },
  enemy: { x: '68%', tail: '62%', sceneSlot: 'right' },
};

function formatCardStats(card) {
  return `POT ${card.power} · DAN ${card.damage}`;
}

function rosterForArmy(armyName) {
  return (ARMY_SETS[armyName] ?? []).slice().sort((a, b) => a.league - b.league || a.id - b.id);
}

function LabCard({ card, armyName, accent, active, muted }) {
  if (!card) {
    return (
      <div className={`dialogue-lab-card dialogue-lab-card--empty ${muted ? 'is-muted' : ''}`}>
        <span className="dialogue-lab-card__empty">Nessuna carta</span>
      </div>
    );
  }
  return (
    <div
      className={`dialogue-lab-card ${active ? 'is-active' : ''} ${muted ? 'is-muted' : ''}`}
      style={{
        borderColor: accent,
        boxShadow: active ? `0 0 22px ${accent}44, 0 12px 30px #000a` : `0 8px 24px #0008`,
      }}
    >
      <div className="dialogue-lab-card__lg" style={{ color: accent }}>
        L{card.league}
      </div>
      <div className="dialogue-lab-card__nm">{card.name}</div>
      <div className="dialogue-lab-card__st">{formatCardStats(card)}</div>
      {getCardDialogues(card.id, ARMY_DIALOGUE_OPTIONS.find((a) => a.name === armyName)?.key) ? (
        <div className="dialogue-lab-card__badge" style={{ color: accent }}>
          dialogo
        </div>
      ) : (
        <div className="dialogue-lab-card__badge dialogue-lab-card__badge--off">solo flavour</div>
      )}
    </div>
  );
}

export function DialogueLabPage({ onClose }) {
  const dialogueRef = useRef(null);
  const lastLineRef = useRef({ player: null, enemy: null });
  const sequenceTimerRef = useRef(null);

  const [playerArmy, setPlayerArmy] = useState('Corte Rossa');
  const [enemyArmy, setEnemyArmy] = useState('Kethran');
  const [playerCardId, setPlayerCardId] = useState('311');
  const [enemyCardId, setEnemyCardId] = useState('201');
  const [activeSide, setActiveSide] = useState('player');
  const [selectiveEmphasis, setSelectiveEmphasis] = useState(true);
  const [charMs, setCharMs] = useState(34);
  const [lastMeta, setLastMeta] = useState(null);

  const playerRoster = useMemo(() => rosterForArmy(playerArmy), [playerArmy]);
  const enemyRoster = useMemo(() => rosterForArmy(enemyArmy), [enemyArmy]);

  const playerCard = useMemo(
    () => playerRoster.find((c) => String(c.id) === String(playerCardId)) ?? playerRoster[0],
    [playerCardId, playerRoster]
  );
  const enemyCard = useMemo(
    () => enemyRoster.find((c) => String(c.id) === String(enemyCardId)) ?? enemyRoster[0],
    [enemyCardId, enemyRoster]
  );

  const activeCard = activeSide === 'player' ? playerCard : enemyCard;
  const activeArmyName = activeSide === 'player' ? playerArmy : enemyArmy;
  const activeArmyKey = ARMY_DIALOGUE_OPTIONS.find((a) => a.name === activeArmyName)?.key ?? 'corte';

  const clearSequenceTimer = useCallback(() => {
    if (sequenceTimerRef.current != null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const sayForSide = useCallback(
    (side, eventKey, onDone) => {
      const card = side === 'player' ? playerCard : enemyCard;
      const armyName = side === 'player' ? playerArmy : enemyArmy;
      const armyKey = ARMY_DIALOGUE_OPTIONS.find((a) => a.name === armyName)?.key ?? 'orizzonte';
      const layout = SIDE_LAYOUT[side];

      if (!card) {
        onDone?.();
        return false;
      }

      const opts = resolveDialogueSayOptions(
        { ...card, army: armyName },
        eventKey,
        { lastText: lastLineRef.current[side], armyKey }
      );

      if (!opts) {
        onDone?.();
        return false;
      }

      lastLineRef.current[side] = opts.text;
      setLastMeta({ ...opts.meta, side, armyName });
      dialogueRef.current?.say({
        army: opts.army,
        name: opts.name,
        text: opts.text,
        x: layout.x,
        y: 250,
        side: 'above',
        tail: layout.tail,
        charMs,
        emphasis: selectiveEmphasis ? 'selective' : 'all',
        onDone,
      });
      return true;
    },
    [charMs, enemyArmy, enemyCard, playerArmy, playerCard, selectiveEmphasis]
  );

  const sayEvent = useCallback(
    (eventKey, side = activeSide) => {
      clearSequenceTimer();
      sayForSide(side, eventKey);
    },
    [activeSide, clearSequenceTimer, sayForSide]
  );

  const handleSequence = useCallback(() => {
    clearSequenceTimer();
    dialogueRef.current?.hide();
    const outcome = Math.random() < 0.6 ? 'vince' : 'perde';
    const steps = [
      { side: 'player', event: 'entrata' },
      { side: 'enemy', event: 'entrata' },
      { side: 'player', event: 'statNemico.colosso' },
      { side: 'enemy', event: 'triggerAttivato' },
      { side: 'player', event: outcome },
      { side: 'enemy', event: outcome === 'vince' ? 'perde' : 'vince' },
    ];
    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        sequenceTimerRef.current = window.setTimeout(() => dialogueRef.current?.hide(), 1100);
        return;
      }
      const step = steps[i];
      const played = sayForSide(step.side, step.event, () => {
        i += 1;
        sequenceTimerRef.current = window.setTimeout(next, 900);
      });
      if (!played) {
        i += 1;
        sequenceTimerRef.current = window.setTimeout(next, 120);
      }
    };
    next();
  }, [clearSequenceTimer, sayForSide]);

  const handleSceneClick = useCallback(() => {
    if (!dialogueRef.current?.isDone()) dialogueRef.current?.skip();
  }, []);

  const poolPreview = useMemo(() => {
    if (!activeCard) return [];
    return getDialoguePool(getCardDialogues(activeCard.id, activeArmyKey), lastMeta?.eventKey ?? 'entrata');
  }, [activeArmyKey, activeCard, lastMeta?.eventKey]);

  const playerDialogueCount = countDialogueCards(
    ARMY_DIALOGUE_OPTIONS.find((a) => a.name === playerArmy)?.key
  );
  const enemyDialogueCount = countDialogueCards(
    ARMY_DIALOGUE_OPTIONS.find((a) => a.name === enemyArmy)?.key
  );

  return (
    <ToolPageShell
      title="Dialogue Lab"
      subtitle="Anteprima dialoghi per giocatore e avversario. Solo le armate con dialoghi scritti (pilota: Corte Rossa) hanno battute reali; le altre usano flavour/placeholder in partita."
      onClose={onClose}
      contentClassName="dialogue-lab-root"
    >
      <div className="dialogue-lab-armies">
        <span className="dialogue-lab-armies__label">Armata veloce</span>
        <div className="dialogue-lab-army-chips" role="tablist" aria-label="Seleziona armata attiva">
          {ARMY_DIALOGUE_OPTIONS.map(({ name, key }) => {
            const hasData = armyHasDialogueData(key);
            const isPlayer = playerArmy === name;
            const isEnemy = enemyArmy === name;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                className={`dialogue-lab-army-chip ${activeArmyName === name ? 'is-active' : ''}`}
                style={{
                  '--chip-accent': ARMY_COLORS[name]?.accent ?? ARMY[key]?.color ?? '#888',
                }}
                title={
                  hasData
                    ? `${name} · ${countDialogueCards(key)} carte con dialogo`
                    : `${name} · dialoghi non ancora scritti`
                }
                onClick={() => {
                  if (activeSide === 'player') {
                    setPlayerArmy(name);
                    const first = rosterForArmy(name)[0];
                    if (first) setPlayerCardId(String(first.id));
                  } else {
                    setEnemyArmy(name);
                    const first = rosterForArmy(name)[0];
                    if (first) setEnemyCardId(String(first.id));
                  }
                  lastLineRef.current = { player: null, enemy: null };
                  setLastMeta(null);
                  dialogueRef.current?.hide();
                }}
              >
                <span className="dialogue-lab-army-chip__name">{name.replace(/^Figli dell'/, "Figli'")}</span>
                {hasData ? <span className="dialogue-lab-army-chip__dot" /> : null}
                {isPlayer ? <span className="dialogue-lab-army-chip__tag">TU</span> : null}
                {isEnemy ? <span className="dialogue-lab-army-chip__tag dialogue-lab-army-chip__tag--enemy">AVV</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dialogue-lab-wrap">
        <div
          className="dialogue-lab-scene"
          role="presentation"
          onClick={handleSceneClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleSceneClick();
          }}
        >
          <div className="dialogue-lab-duel">
            <LabCard
              card={playerCard}
              armyName={playerArmy}
              accent={ARMY_COLORS[playerArmy]?.accent ?? '#a78bfa'}
              active={activeSide === 'player'}
              muted={activeSide === 'enemy'}
            />
            <div className="dialogue-lab-vs">VS</div>
            <LabCard
              card={enemyCard}
              armyName={enemyArmy}
              accent={ARMY_COLORS[enemyArmy]?.accent ?? '#fbbf24'}
              active={activeSide === 'enemy'}
              muted={activeSide === 'player'}
            />
          </div>
          <SatzeDialogueLayer ref={dialogueRef} charMs={charMs} />
        </div>

        <aside className="dialogue-lab-panel satze-tool-panel">
          <h2 className="dialogue-lab-panel__h">Chi parla</h2>
          <div className="dialogue-lab-side-toggle">
            <button
              type="button"
              className={`satze-tool-btn-secondary text-sm ${activeSide === 'player' ? 'is-on' : ''}`}
              onClick={() => setActiveSide('player')}
            >
              Tu ({playerDialogueCount || '0'} dialoghi)
            </button>
            <button
              type="button"
              className={`satze-tool-btn-secondary text-sm ${activeSide === 'enemy' ? 'is-on' : ''}`}
              onClick={() => setActiveSide('enemy')}
            >
              Avversario ({enemyDialogueCount || '0'} dialoghi)
            </button>
          </div>

          <h2 className="dialogue-lab-panel__h">Carta {activeSide === 'player' ? 'tua' : 'avversario'}</h2>
          <select
            className="dialogue-lab-select"
            value={String(activeSide === 'player' ? playerCardId : enemyCardId)}
            onChange={(e) => {
              if (activeSide === 'player') setPlayerCardId(e.target.value);
              else setEnemyCardId(e.target.value);
              lastLineRef.current[activeSide] = null;
              setLastMeta(null);
              dialogueRef.current?.hide();
            }}
          >
            {(activeSide === 'player' ? playerRoster : enemyRoster).map((card) => {
              const key = ARMY_DIALOGUE_OPTIONS.find(
                (a) => a.name === (activeSide === 'player' ? playerArmy : enemyArmy)
              )?.key;
              const hasLines = Boolean(getCardDialogues(card.id, key));
              return (
                <option key={card.id} value={card.id}>
                  L{card.league} · {card.name}
                  {hasLines ? ' ✓' : ''}
                </option>
              );
            })}
          </select>

          {!armyHasDialogueData(activeArmyKey) ? (
            <p className="dialogue-lab-warn">
              <strong>{activeArmyName}</strong> non ha ancora file dialoghi: in partita l&apos;avversario (e tu, se
              giochi questa armata) vedranno solo flavour o placeholder.
            </p>
          ) : !getCardDialogues(activeCard?.id, activeArmyKey) ? (
            <p className="dialogue-lab-warn">Questa carta non ha righe in dialoghi-{activeArmyKey}.js.</p>
          ) : null}

          <h2 className="dialogue-lab-panel__h">Evento</h2>
          <div className="dialogue-lab-btns">
            {LAB_EVENTS.map((ev) => {
              const count = getDialoguePool(getCardDialogues(activeCard?.id, activeArmyKey), ev.id).length;
              return (
                <button
                  key={ev.id}
                  type="button"
                  className="satze-tool-btn-secondary text-sm"
                  disabled={!count}
                  onClick={() => sayEvent(ev.id)}
                >
                  {ev.label}
                  {count ? ` (${count})` : ''}
                </button>
              );
            })}
            <button type="button" className="dialogue-lab-seq satze-tool-btn-primary text-sm" onClick={handleSequence}>
              ▶ Sequenza tu + avversario
            </button>
          </div>

          <label className="dialogue-lab-row">
            <input
              type="checkbox"
              checked={selectiveEmphasis}
              onChange={(e) => setSelectiveEmphasis(e.target.checked)}
            />
            <span>Enfasi selettiva (off = tutta la riga animata)</span>
          </label>

          <label className="dialogue-lab-row dialogue-lab-row--slider">
            <span>Velocità typewriter ({charMs} ms/car)</span>
            <input
              type="range"
              min={12}
              max={80}
              value={charMs}
              onChange={(e) => setCharMs(Number(e.target.value))}
            />
          </label>

          {lastMeta ? (
            <div className="dialogue-lab-meta">
              <div>
                <strong>Lato:</strong> {lastMeta.side === 'player' ? 'Tu' : 'Avversario'} · {lastMeta.armyName}
              </div>
              <div>
                <strong>Evento:</strong> {lastMeta.eventKey}
              </div>
              {lastMeta.register ? (
                <div>
                  <strong>Registro:</strong> {lastMeta.register}
                </div>
              ) : null}
              {poolPreview.length ? (
                <div>
                  <strong>Pool:</strong> {poolPreview.length} varianti
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="dialogue-lab-hint">
            I chip armata impostano l&apos;armata del lato attivo (Tu / Avversario). Clicca sulla scena per completare la
            riga.
          </p>

          <details className="dialogue-lab-details">
            <summary>Fasce stat nemiche</summary>
            <ul>
              {Object.entries(STAT_NEMICO_BANDS).map(([key, band]) => (
                <li key={key}>
                  <code>{key}</code> — {band.label} ({band.threshold})
                </li>
              ))}
            </ul>
          </details>
        </aside>
      </div>
    </ToolPageShell>
  );
}
