// ============================================
// Costruzione dei dati di una partita per la telemetria del playtest.
// Funzioni pure: prendono lo stato del gioco e restituiscono oggetti JSON compatti.
// Schema documentato in Documentazione/TELEMETRIA_PLAYTEST.md.
// ============================================

import { getEminence, getEminenceAbility } from '../data/eminences.js';

export function agente(card) {
  if (!card) return null;
  return { id: card.id ?? null, nome: card.name ?? null, armata: card.army ?? null, lega: card.league ?? null };
}

function statoAbilita(attiva, bloccata) {
  if (bloccata) return 'bloccato';
  return attiva ? 'attivo' : 'non attivo';
}

/** Statistiche di un lato ('player' | 'enemy') da un battleResult del motore. */
export function latoScontro(br, lato) {
  if (!br) return null;
  const p = lato === 'player' ? 'player' : 'enemy';
  return {
    agente: agente(br[`${p}Agent`]),
    fc: br[`${p}FocusInvested`] ?? null,
    fcTemporanei: br[`${p}TemporaryFocus`] || 0,
    va: br[`${p}Assault`] ?? null,
    pot: br[`${p}Power`] ?? null,
    dan: br[`${p}Damage`] ?? null,
    potere: statoAbilita(br[`${p}AbilityTriggered`], br[`${p}AbilityBlocked`]),
    bonus: statoAbilita(br[`${p}HasBonus`], br[`${p}BonusBlocked`]),
  };
}

function campo(field, slot) {
  if (!field && slot == null) return null;
  return { id: field?.id ?? null, nome: field?.name ?? null, slot: slot ?? null };
}

function eminenzaDelRound(matchState, lato) {
  const s = matchState?.[lato];
  if (!s?.eminenceId) return null;
  const abilitaId = s.revealedAbilityId ?? s.selectedAbilityId ?? null;
  return {
    abilita: abilitaId ? getEminenceAbility(s.eminenceId, abilitaId)?.name ?? abilitaId : null,
    presenzaDopo: s.presence ?? null,
    presenzaSpesa: s.presenceSpentThisRound ?? null,
  };
}

export function nomeEminenza(matchState, lato) {
  const id = matchState?.[lato]?.eminenceId;
  if (!id) return null;
  return getEminence(id)?.name ?? id;
}

const VINCITORE = { player: 'tu', enemy: 'avversario', draw: 'pareggio' };

/** Un round del Duello 1v1 (locale o online), dal punto di vista del giocatore. */
export function roundDuello({ roundNumber, battleResult: br, isPlayerFirst, pvTu, pvAvversario, eminenze }) {
  const conEminenze = Boolean(eminenze?.enabled);
  const tu = latoScontro(br, 'player');
  const avversario = latoScontro(br, 'enemy');
  if (conEminenze) {
    if (tu) tu.eminenza = eminenzaDelRound(eminenze, 'player');
    if (avversario) avversario.eminenza = eminenzaDelRound(eminenze, 'enemy');
  }
  return {
    n: roundNumber,
    campo: campo(br?.field, br?.fieldIndex),
    primo: isPlayerFirst ? 'tu' : 'avversario',
    tu,
    avversario,
    vincitore: VINCITORE[br?.winner] ?? null,
    danno: br?.damageDealt ?? null,
    campoDistrutto: Boolean(br?.fieldDestroyed),
    perfect: br?.perfectFocusSide ? VINCITORE[br.perfectFocusSide] ?? br.perfectFocusSide : null,
    pvDopo: { tu: pvTu ?? null, avversario: pvAvversario ?? null },
  };
}

const MOTIVI = { hp: 'PV', fields: 'Campi', draw: 'pareggio', shared: 'vittoria condivisa', supremacy: 'Supremazia' };
const ESITI = { player: 'vittoria', enemy: 'sconfitta', draw: 'pareggio' };

export function esito(gameResult) {
  return ESITI[gameResult?.winner] ?? 'sconosciuto';
}

export function motivo(gameResult) {
  const r = gameResult?.reason;
  return r ? MOTIVI[r] ?? r : null;
}

function mano(hand) {
  return (hand || []).map(agente).filter(Boolean);
}

/** Partita del Duello 1v1 conclusa (locale contro IA oppure online). */
export function partitaDuello({
  idPartita, inizio, fine, round, gameResult, online, aiDifficulty, gameMode, eminenze,
  giocatore, avversario, torneo = null,
}) {
  const conEminenze = Boolean(eminenze?.enabled);
  return {
    idPartita,
    inizio: inizio ? new Date(inizio).toISOString() : null,
    fine: new Date(fine).toISOString(),
    durataSecondi: inizio ? Math.round((fine - inizio) / 1000) : null,
    modalita: torneo ? 'torneo' : online ? 'multiplayer' : 'duello',
    formato: gameMode === 'bareHands' ? 'maniNude' : conEminenze ? 'standard' : 'noEminenza',
    // Partita di una serie del Torneo: { incontro, partita } (online anche contro una persona).
    torneo: torneo ? { incontro: torneo.incontro ?? null, partita: torneo.partita ?? null } : null,
    difficolta: online ? null : aiDifficulty ?? null,
    esito: esito(gameResult),
    motivo: motivo(gameResult),
    roundGiocati: round.length,
    giocatore: {
      armata: giocatore.armata ?? null,
      esercito: giocatore.esercito ?? null,
      carteEsercito: giocatore.carteEsercito ?? null,
      mano: mano(giocatore.mano),
      eminenza: conEminenze ? nomeEminenza(eminenze, 'player') : null,
      pvFinali: giocatore.pv ?? null,
      campi: gameResult?.playerFields ?? null,
    },
    avversari: [{
      tipo: online ? 'umano' : 'IA',
      nome: avversario.nome ?? null,
      armata: avversario.armata ?? avversario.mano?.[0]?.army ?? null,
      esercito: avversario.esercito ?? null,
      mano: mano(avversario.mano),
      eminenza: conEminenze ? nomeEminenza(eminenze, 'enemy') : null,
      pvFinali: avversario.pv ?? null,
      campi: gameResult?.enemyFields ?? null,
    }],
    stanza: online?.stanza ?? null,
    round,
  };
}

const FORMATI_MULTI = { classic: 'noEminenza', bareHands: 'maniNude' };

function posto(seat) {
  return {
    posto: seat.id,
    umano: Boolean(seat.isHuman),
    nome: seat.name ?? null,
    armata: seat.army ?? null,
    squadra: seat.team ?? null,
    esercito: seat.deckKey ?? null,
    mano: mano(seat.hand),
    pvFinali: seat.hp ?? null,
    campi: seat.conquests ?? null,
    eliminato: Boolean(seat.eliminated),
    ia: seat.aiProfile ?? null,
  };
}

/** Uno scontro di una modalità a più posti: i due lati del battleResult corrispondono a due posti. */
function scontroMulti(x) {
  const br = x.battleResult;
  return {
    campo: campo(br?.field, x.fieldIndex),
    primo: x.firstSeatId ?? null,
    lati: {
      [x.playerSeatId]: latoScontro(br, 'player'),
      [x.enemySeatId]: latoScontro(br, 'enemy'),
    },
    vincitore: x.winnerSeatId ?? null,
    danno: br?.damageDealt ?? null,
  };
}

/** Partita 2v2 o Re della collina conclusa. `telemetria` arriva da useMultiSeatDuel (finishWith). */
export function partitaMultiPosto({ idPartita, inizio, fine, gameResult, telemetria }) {
  const t = telemetria || {};
  const opzioni = t.opzioni || {};
  const storico = t.storico || [];
  const posti = (t.posti || []).map(posto);
  const umano = posti.find((p) => p.umano) || {};
  const isTeam = opzioni.kind === 'teamDuel';
  const round = isTeam
    ? storico.map((r) => ({
      n: r.roundNumber,
      apre: r.openingTeam ?? null,
      disposizione: r.pairing ?? null,
      fc: r.investments ?? null,
      fronti: (r.fronts || []).map(scontroMulti),
      pvDopo: r.hpAfter ?? null,
    }))
    : storico.map((c) => ({
      n: c.roundNumber,
      campo: c.fights?.[0] ? campo(c.fights[0].battleResult?.field, c.fieldIndex) : { slot: c.fieldIndex ?? null },
      ordine: c.order ?? null,
      fc: Object.fromEntries(Object.entries(c.commits || {}).map(([id, v]) => [id, v?.investment ?? null])),
      scontri: (c.fights || []).map((f) => ({ ...scontroMulti(f), eliminati: f.eliminated || [] })),
      conquista: c.conquerorSeatId ?? null,
    }));
  return {
    idPartita,
    inizio: inizio ? new Date(inizio).toISOString() : null,
    fine: new Date(fine).toISOString(),
    durataSecondi: inizio ? Math.round((fine - inizio) / 1000) : null,
    modalita: isTeam ? '2v2' : 'reDellaCollina',
    formato: FORMATI_MULTI[opzioni.fieldMode] ?? opzioni.fieldMode ?? null,
    difficolta: opzioni.difficulty ?? null,
    compagnoIA: isTeam ? opzioni.teammatePreset ?? null : null,
    giocatori: isTeam ? 4 : posti.length,
    esito: esito(gameResult),
    motivo: motivo(gameResult),
    roundGiocati: round.length,
    giocatore: { ...umano },
    compagno: isTeam ? posti.find((p) => !p.umano && p.squadra === umano.squadra) ?? null : null,
    avversari: posti.filter((p) => !p.umano && (!isTeam || p.squadra !== umano.squadra)),
    round,
  };
}
