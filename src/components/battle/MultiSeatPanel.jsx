// ============================================================
// MultiSeatPanel — il "Tavolo" delle modalità a più posti
// ============================================================
// Pannello dentro la scena del duello: posti, PV/FC, carte schierate, fronti, disposizione
// segreta (2v2) e reclamo. Le scelte proprie (Campo, Agente, FC) restano sui comandi del
// duello; qui solo ciò che l'1v1 non ha.
// ============================================================

import { HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import '../../styles/satze-multi-seat.css';
import { MiniBattlefield } from './MiniBattlefield';

const PAIRING_LABEL = { direct: 'Diretta', crossed: 'Incrociata' };

function cardOf(seat, cardId) {
  return seat?.hand?.find((c) => c.id === cardId) || null;
}

function CardChip({ card, hidden = false }) {
  if (hidden) return <span className="msp-chip msp-chip-hidden">Agente coperto</span>;
  if (!card) return <span className="msp-chip msp-chip-empty">—</span>;
  return (
    <span className="msp-chip" title={card.description || card.name}>
      <b>{card.name}</b>
      <i>{card.power} POT · {card.damage} DAN · L{card.league}</i>
    </span>
  );
}

function Bar({ value, max, accent }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <span className="msp-bar"><span style={{ width: `${pct}%`, background: accent }} /></span>
  );
}

function seatName(view, id) {
  return view.seats?.find((s) => s.id === id)?.name || id;
}

function presentingLine(view) {
  const scontri = view.kind === 'teamDuel' ? view.roundResult?.fronts : view.contestResult?.fights;
  const s = scontri?.[view.presentIndex ?? 0];
  if (!s) return 'Scontro in corso: premi CONTINUA alla fine.';
  const human = view.kind === 'teamDuel' ? 'A1' : 'P1';
  const involved = s.playerSeatId === human || s.enemySeatId === human;
  const who = `${seatName(view, s.playerSeatId)} contro ${seatName(view, s.enemySeatId)}`;
  return involved
    ? `Scontro: ${who}. Premi CONTINUA alla fine.`
    : `Assisti: ${who}. Premi CONTINUA alla fine.`;
}

function overLine(view) {
  const r = view.result;
  if (view.kind !== 'teamDuel' && view.seats?.find((s) => s.id === 'P1')?.eliminated) {
    return 'Partita conclusa: sei stato eliminato.';
  }
  if (!r) return 'Partita conclusa.';
  if (view.kind === 'teamDuel') {
    if (r.winner === 'draw') return 'Partita conclusa: pareggio.';
    return r.winner === 'A' ? 'Partita conclusa: vince la tua squadra!' : 'Partita conclusa: vince la squadra avversaria.';
  }
  if (!r.winners?.length) return 'Partita conclusa: nessun sopravvissuto, pareggio.';
  const names = r.winners.map((id) => seatName(view, id)).join(' e ');
  return r.shared ? `Partita conclusa: vittoria condivisa (${names}).` : `Partita conclusa: vince ${names}.`;
}

function stageLine(view) {
  switch (view.stage) {
    case 'pending': return 'Si prepara il tavolo…';
    case 'humanDeploy':
      if (view.kind === 'teamDuel') {
        return view.role === 'opening'
          ? 'Apri tu: scegli un Campo e trascina un Agente, poi conferma.'
          : 'Rispondi: trascina un Agente e conferma. Gli abbinamenti li decidi dopo.';
      }
      return view.role === 'opening'
        ? 'Apri tu: scegli il Campo, schiera un Agente e i FC.'
        : 'Tocca a te: schiera un Agente e i FC. Combatterai contro chi resta sulla collina.';
    case 'planning': return 'Piano segreto: regola i tuoi FC nel pannello FC e conferma.';
    case 'aiTurn': return 'Gli altri giocatori stanno scegliendo…';
    case 'presenting': return presentingLine(view);
    case 'claim': return 'Hai raggiunto la soglia dei Campi.';
    case 'over': return overLine(view);
    default: return '';
  }
}

function BoardVariantPicker({ value, variants, onChange }) {
  if (!onChange || !variants) return null;
  return (
    <div className="msp-variants">
      <span className="msp-dim">Carte sul tavolo (prova):</span>
      <div className="msp-variant-row">
        {Object.entries(variants).map(([id, v]) => (
          <button key={id} type="button" className={`msp-btn msp-btn-sm${value === id ? ' on' : ''}`} onClick={() => onChange(id)}>
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * I due fronti del turno: per ciascun Campo chi lo occupa (apertura) e chi lo attacca
 * (risposta). Quando risponde la tua squadra, nel piano si inverte da qui la direzione.
 */
function FrontsSection({ view, ownFieldIndex, onPairing, onHoverField }) {
  const { seats, deployments, battlefields, plan, openingTeam, board } = view;
  const seat = (id) => seats.find((x) => x.id === id);
  const presenting = view.stage === 'presenting' && view.roundResult;
  const planning = view.stage === 'planning';
  const usResponding = openingTeam === 'B';

  let fronts;
  if (presenting) {
    fronts = view.roundResult.fronts.map((f) => ({ fieldIndex: f.fieldIndex, opener: f.firstSeatId, responder: f.secondSeatId, winner: f.winnerSeatId }));
  } else {
    const openers = seats.filter((x) => x.team === openingTeam);
    const fieldOf = (id) => {
      if (deployments[id]?.fieldIndex != null) return deployments[id].fieldIndex;
      if (id === 'A1') return ownFieldIndex ?? null;
      if (id === 'A2') return board?.player?.[1]?.fieldIndex ?? null;
      return null;
    };
    const responderOf = (id) => {
      if (!(planning && usResponding) || !view.fronts) return null;
      return view.fronts.find((f) => f.firstSeatId === id)?.secondSeatId ?? null;
    };
    fronts = openers.map((o) => ({ fieldIndex: fieldOf(o.id), opener: o.id, responder: responderOf(o.id), winner: null }));
  }

  const cardFor = (id) => {
    const d = deployments?.[id];
    const entry = [...(board?.player || []), ...(board?.enemy || [])].find((e) => e.seatId === id);
    const cardId = d?.cardId ?? entry?.card?.id ?? null;
    return cardId != null ? cardOf(seat(id), cardId) : null;
  };

  const responderHint = presenting
    ? null
    : usResponding
      ? (planning ? null : 'Sceglierai la direzione dopo lo schieramento.')
      : 'La direzione la sceglie in segreto la squadra avversaria.';

  const sideClass = (id) => (seat(id)?.team === 'A' ? 'is-ally' : 'is-foe');

  return (
    <div className="msp-fronts">
      <div className="msp-plan-title">
        Fronti{presenting ? ` · disposizione ${PAIRING_LABEL[view.roundResult.pairing] || ''}` : ''}
      </div>
      {fronts.map((f, i) => {
        const field = f.fieldIndex != null ? battlefields[f.fieldIndex] : null;
        return (
          <div key={f.opener} className={`msp-front-card${presenting && view.presentIndex === i ? ' on' : ''}`}>
            <div className="msp-front-field">
              <span className="msp-front-n">{i + 1}</span>
              {field ? (
                <div className="msp-front-mini" onMouseEnter={() => onHoverField?.(field)} onMouseLeave={() => onHoverField?.(null)}>
                  <MiniBattlefield field={field} conquered={false} hidden={false} selected={false} />
                </div>
              ) : (
                <div className="msp-front-empty">Campo da scegliere</div>
              )}
            </div>
            <div className="msp-front-duel">
              <div className={`msp-front-who ${sideClass(f.opener)}`}>
                <span className="msp-front-role">Difende</span>
                <b>{seat(f.opener)?.name}</b>
                <CardChip card={cardFor(f.opener)} />
              </div>
              <div className="msp-front-arrow" aria-hidden>⚔</div>
              <div className={`msp-front-who ${f.responder ? sideClass(f.responder) : 'is-unknown'}`}>
                <span className="msp-front-role">Attacca</span>
                {f.responder ? (
                  <>
                    <b>{seat(f.responder)?.name}</b>
                    <CardChip card={cardFor(f.responder)} />
                  </>
                ) : (
                  <b className="msp-dim">?</b>
                )}
              </div>
            </div>
            {presenting && f.winner && view.presentIndex > i ? (
              <div className="msp-front-result">Conquista: {seat(f.winner)?.name}</div>
            ) : null}
          </div>
        );
      })}
      {planning && usResponding && plan && (
        <div className="msp-swap">
          <button type="button" className="msp-btn msp-primary" onClick={() => onPairing(plan.pairing === 'crossed' ? 'direct' : 'crossed')}>
            ⇄ Inverti direzione
          </button>
          <span className="msp-dim">
            {PAIRING_LABEL[plan.pairing]}{plan.suggestedPairing === plan.pairing ? ' · consigliata dal compagno' : ''}
          </span>
        </div>
      )}
      {responderHint ? <div className="msp-dim msp-note">{responderHint}</div> : null}
    </div>
  );
}

const INVEST_LABEL = { basso: 'Basso', medio: 'Medio', alto: 'Alto' };

/** Consigli al compagno IA: carta (dalla sua mano), Campo (quando aprite), investimento. */
function AdviceSection({ view, ownFieldIndex, onAdvise }) {
  const mate = view.seats.find((x) => x.id === 'A2');
  if (!mate || !onAdvise) return null;
  const deploying = view.stage === 'humanDeploy' && !view.deployments?.A2;
  const canInvest = ['humanDeploy', 'aiTurn', 'planning'].includes(view.stage);
  if (!deploying && !canInvest) return null;
  const advice = view.advice || {};
  const replies = view.adviceReplies || {};
  const advisedCard = advice.card ? cardOf(mate, advice.card.value) : null;
  const opening = view.openingTeam === 'A';
  const fields = (view.legalFields || []).filter((i) => i !== ownFieldIndex);
  const reply = (kind) => (replies[kind] ? (
    <div className={`msp-reply${replies[kind].accepted ? ' ok' : ' no'}`}>«{replies[kind].text}»</div>
  ) : null);

  return (
    <div className="msp-advice">
      <div className="msp-plan-title">
        Consigli a {mate.name}
        {view.mateTrust != null ? <span className="msp-dim"> · ascolta il {Math.round(view.mateTrust * 100)}%</span> : null}
      </div>
      {deploying && (
        <div className="msp-advice-row">
          <span className="msp-advice-k">Carta</span>
          <span>{advisedCard ? <b>{advisedCard.name}</b> : <span className="msp-dim">Apri «Mano compagno» e clicca una sua carta.</span>}</span>
        </div>
      )}
      {deploying && reply('card')}
      {deploying && opening && (
        <div className="msp-advice-row">
          <span className="msp-advice-k">Campo</span>
          <div className="msp-advice-chips">
            {fields.map((i) => (
              <button key={i} type="button" className={`msp-btn msp-btn-sm${advice.field?.value === i ? ' on' : ''}`} onClick={() => onAdvise('field', i)}>
                {view.battlefields[i]?.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {deploying && opening && reply('field')}
      {canInvest && (
        <div className="msp-advice-row">
          <span className="msp-advice-k">FC</span>
          <div className="msp-advice-chips">
            {['basso', 'medio', 'alto'].map((lvl) => (
              <button key={lvl} type="button" className={`msp-btn msp-btn-sm${advice.invest?.value === lvl ? ' on' : ''}`} onClick={() => onAdvise('invest', lvl)}>
                {INVEST_LABEL[lvl]}
              </button>
            ))}
          </div>
        </div>
      )}
      {canInvest && reply('invest')}
    </div>
  );
}

function TeamView({ view, ownFocus, ownFieldIndex, onPairing, onSubmit, onClaim, onAdvise, onHoverField, boardVariant, boardVariants, onBoardVariant }) {
  const { seats, deployments, teams, plan, openingTeam } = view;
  const planning = view.stage === 'planning';
  const revealed = view.stage === 'presenting' && view.roundResult;
  const showFronts = Boolean(view.board) || revealed;

  const investmentLabel = (s) => {
    if (revealed) return `${view.roundResult.investments[s.id]} FC`;
    if (s.team === 'A') return plan ? (s.id === 'A1' ? `${ownFocus} FC` : `${plan.investments[s.id]} FC`) : '';
    return deployments[s.id] && view.stage !== 'over' ? '? FC' : '';
  };

  const teamBlock = (teamId, label, accent) => (
    <div className="msp-team" key={teamId}>
      <div className="msp-team-head">
        <span>{label}{openingTeam === teamId ? ' · Apertura' : ' · Risposta'}</span>
        <span>{teams[teamId].hp}/{teams[teamId].maxHp} PV · {teams[teamId].fields}/{view.threshold} Campi</span>
      </div>
      <Bar value={teams[teamId].hp} max={teams[teamId].maxHp} accent={accent} />
      {seats.filter((s) => s.team === teamId).map((s) => (
        <div className="msp-seat-name msp-seat-compact" key={s.id}>
          <span>{s.name}</span>
          <span className="msp-dim">{s.focus} FC {investmentLabel(s) ? `· ${investmentLabel(s)}` : ''}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {showFronts && <FrontsSection view={view} ownFieldIndex={ownFieldIndex} onPairing={onPairing} onHoverField={onHoverField} />}

      {planning && (
        <button type="button" className="msp-btn msp-primary" onClick={onSubmit}>Conferma piano ({ownFocus} FC)</button>
      )}

      <AdviceSection view={view} ownFieldIndex={ownFieldIndex} onAdvise={onAdvise} />

      {view.stage === 'claim' && (
        <div className="msp-plan">
          <div className="msp-plan-title">La tua squadra ha {teams.A.fields} Campi</div>
          <button type="button" className="msp-btn msp-primary" onClick={() => onClaim('claim')}>Reclama la vittoria</button>
          <button type="button" className="msp-btn" onClick={() => onClaim('continue')}>Continua a giocare</button>
        </div>
      )}

      {teamBlock('A', 'La tua squadra', '#a78bfa')}
      {teamBlock('B', 'Avversari', '#f87171')}

      {view.board && <BoardVariantPicker value={boardVariant} variants={boardVariants} onChange={onBoardVariant} />}
    </>
  );
}

function KothView({ view, onClaim }) {
  const { seats, order, commits, battlefields, contestFieldIndex } = view;
  const seat = (id) => seats.find((s) => s.id === id);
  const cr = view.stage === 'presenting' ? view.contestResult : null;
  const listed = order.length ? order : seats.map((s) => s.id);
  const eliminated = seats.filter((s) => s.eliminated && !listed.includes(s.id));
  return (
    <>
      {cr && (
        <div className="msp-plan">
          <div className="msp-plan-title">Catena · scontro {Math.min(cr.fights.length, (view.presentIndex ?? 0) + 1)} di {cr.fights.length}</div>
          {cr.fights.map((f, i) => (
            <div className={`msp-front${i === view.presentIndex ? ' on' : ''}`} key={f.fightIndex}>
              <span>{seat(f.firstSeatId).name} <span className="msp-dim">contro</span> {seat(f.secondSeatId).name}</span>
              {i < (view.presentIndex ?? 0) && <span className="msp-dim">→ {seat(f.winnerSeatId).name}</span>}
            </div>
          ))}
        </div>
      )}
      {view.stage === 'claim' && (
        <div className="msp-plan">
          <div className="msp-plan-title">Hai conquistato {seat('P1').conquests} Campi</div>
          <button type="button" className="msp-btn msp-primary" onClick={() => onClaim('claim')}>Reclama la vittoria</button>
          <button type="button" className="msp-btn" onClick={() => onClaim('continue')}>Continua a giocare</button>
        </div>
      )}
      {contestFieldIndex != null && (
        <div className="msp-contest">Campo conteso: <span className="msp-field">{battlefields[contestFieldIndex]?.name}</span></div>
      )}
      {listed.map((id, i) => {
        const s = seat(id);
        const c = commits[id];
        const card = c ? cardOf(s, c.cardId) : null;
        return (
          <div className="msp-seat" key={id}>
            <div className="msp-seat-name">
              <span>{i === 0 ? '♛ ' : `${i + 1}. `}{s.name}</span>
              <span className="msp-dim">{s.hp} PV · {s.focus} FC · {s.conquests} Campi</span>
            </div>
            <Bar value={s.hp} max={s.maxHp} accent={s.isHuman ? '#a78bfa' : '#f87171'} />
            <div className="msp-seat-play">
              <CardChip card={card} />
              {c && view.stage !== 'over' && <span className="msp-dim">{cr || s.isHuman ? `${c.investment} FC` : '? FC'}</span>}
            </div>
          </div>
        );
      })}
      {eliminated.map((s) => (
        <div className="msp-seat msp-out" key={s.id}><span>{s.name}</span><span className="msp-dim">eliminato</span></div>
      ))}
    </>
  );
}

export function MultiSeatPanel({ view, ownFocus, ownFieldIndex = null, onPairing, onSubmit, onClaim, onAdvise, onHoverField, boardVariant, boardVariants, onBoardVariant }) {
  if (!view) return null;
  const title = view.kind === 'teamDuel' ? '2v2 · Abbinamenti segreti' : 'Re della collina';
  return (
    <div className="msp" style={{ fontFamily: HUD_ORATORIO_FONT_UI }} data-multi-seat-panel="">
      <div className="msp-head">
        <span>{title}</span>
        {view.roundNumber ? <span className="msp-dim">{view.kind === 'teamDuel' ? 'Turno' : 'Contesa'} {view.roundNumber}/5</span> : null}
      </div>
      <div className="msp-stage">{stageLine(view)}</div>
      {view.seats && (view.kind === 'teamDuel'
        ? <TeamView view={view} ownFocus={ownFocus} ownFieldIndex={ownFieldIndex} onPairing={onPairing} onSubmit={onSubmit} onClaim={onClaim} onAdvise={onAdvise} onHoverField={onHoverField} boardVariant={boardVariant} boardVariants={boardVariants} onBoardVariant={onBoardVariant} />
        : <KothView view={view} onClaim={onClaim} />)}
    </div>
  );
}
