// Regia dei passi del duello (solo presentazione): per ogni step visivo degli effetti
// (fase 1) e del post-duello (fase 5) dice chi agisce, con quale stato (attivato,
// bloccato, copiato, non soddisfatto), che effetto e verso chi — per il riquadro in
// alto e per i fasci verso la carta o la scheda VA. Gli stati delle righe sono quelli
// che la carta mostra già (getDuelVisualDisplay): qui si guarda solo cosa cambia.

import { TRIGGER_NAMES } from '../../data/triggers.js';
import { formatAbilityHelper } from '../../utils/cardUtils.js';
import { getPreVaStepIndex, getPostStepsStartIndex } from '../../game/duel/duelVisualSteps.js';
import { getDuelVisualDisplay, resolveDuelArmyBonusDisplay } from './duelVisualDisplay.js';
import { buildDuelVaLedgerRows } from '../../game/duel/duelVaLedger.js';

export const STEP_FX_COLORS = Object.freeze({
  ability: '#fb923c',
  bonus: '#38bdf8',
  inactive: '#64748b',
  copied: '#86efac',
  blocked: '#f87171',
  field: '#cbd5e1',
});

export const STEP_FX_TAGS = Object.freeze({
  active: 'ATTIVATO',
  blocked: 'BLOCCATO',
  copied: 'COPIATO',
  inactive: 'NON SODDISFATTO',
  field: 'CAMPO',
});

const SIDES = ['player', 'enemy'];
const ROWS = ['ability', 'bonus'];
const ABILITY_KINDS = new Set(['power', 'powerBlocked', 'inversion', 'block', 'postPower', 'postPowerBlocked']);
const BONUS_KINDS = new Set(['bonus', 'postBonus']);

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function other(side) {
  return side === 'player' ? 'enemy' : 'player';
}

function shortName(agent) {
  return String(agent?.name || '').split(',')[0];
}

/** Stato di una riga carta come la mostra la carta in quel momento. */
export function rowStateFromDisplay(d, side, row) {
  const S = cap(side);
  const R = row === 'ability' ? 'Ability' : 'Bonus';
  const blocked = d[`show${S}${R}Blocked`];
  const copied = d[`show${S}Copied${R}`];
  const copiedInactive = d[`show${S}Copied${R}NotTriggered`];
  const inactive = (d[`show${S}${R}NotTriggered`] && !copied) || copiedInactive;
  const lit = d[`highlight${S}${R}`];
  if (blocked) return 'blocked';
  if (inactive) return 'inactive';
  if (copied && lit) return 'copied';
  if (lit) return 'active';
  return 'neutral';
}

function rowStates(br, phase, step) {
  const d = getDuelVisualDisplay(br, phase, step);
  const out = {};
  SIDES.forEach((side) => {
    out[side] = {};
    ROWS.forEach((row) => { out[side][row] = rowStateFromDisplay(d, side, row); });
  });
  return out;
}

/** «Rimonta: +2 POT» → { trigger: 'Rimonta', effect: '+2 POT' }. */
function splitTriggerText(text) {
  const s = String(text || '');
  const names = Object.values(TRIGGER_NAMES);
  const m = /^([^:]+):\s*(.+)$/.exec(s);
  if (m && names.includes(m[1].trim())) return { trigger: m[1].trim(), effect: m[2] };
  return { trigger: null, effect: s };
}

function abilityOf(br, side) {
  const isPlayer = side === 'player';
  return (isPlayer ? br.playerAbilityCopied : br.enemyAbilityCopied)
    || (isPlayer ? br.playerAgent?.ability : br.enemyAgent?.ability) || null;
}

function describeRow(br, side, row, state) {
  const isPlayer = side === 'player';
  const agent = isPlayer ? br.playerAgent : br.enemyAgent;
  if (row === 'ability') {
    const ability = abilityOf(br, side);
    const copied = Boolean(isPlayer ? br.playerAbilityCopied : br.enemyAbilityCopied);
    const trig = TRIGGER_NAMES[ability?.trigger];
    const eff = ability ? formatAbilityHelper({ ...ability, trigger: null }) : '—';
    return { src: shortName(agent), k: copied ? '★ Copia Potere' : `★ ${trig || 'Potere'}`, eff, trigger: ability?.trigger || null, copied };
  }
  const def = resolveDuelArmyBonusDisplay(br, isPlayer);
  const copied = Boolean(isPlayer ? br.playerBonusCopied : br.enemyBonusCopied);
  const { trigger, effect } = splitTriggerText(def?.description);
  const army = copied ? (isPlayer ? br.enemyAgent : br.playerAgent)?.army : agent?.army;
  return {
    src: army || shortName(agent),
    k: copied ? '✠ Copia Bonus' : trigger ? `✠ ${trigger}` : '✠ Bonus',
    eff: effect || '—',
    trigger: null,
    copied,
    state,
  };
}

function statDelta(prev, cur, side) {
  const P = side === 'player' ? 'player' : 'enemy';
  return {
    power: (cur?.[`${P}Power`] ?? 0) - (prev?.[`${P}Power`] ?? 0),
    damage: (cur?.[`${P}Damage`] ?? 0) - (prev?.[`${P}Damage`] ?? 0),
    va: (cur?.[`${P}AssaultMod`] ?? 0) - (prev?.[`${P}AssaultMod`] ?? 0),
  };
}

function targetText(br, side, delta, selfSide) {
  const agent = side === 'player' ? br.playerAgent : br.enemyAgent;
  const name = shortName(agent);
  if (side === selfSide) return 'su sé stesso';
  if (delta.va) return `sul VA di ${name} · si applica in Calcolo`;
  return `su ${name}`;
}

/**
 * Un elemento per step animato.
 * @returns {Array<{ phase: 1|5, step: number, kind: string, side: 'player'|'enemy'|null, row: 'ability'|'bonus'|'field',
 *   state: string, color: string, tag: string, src: string, k: string, eff: string, tgt: string,
 *   beams: Array<{ from: object, to: object, color: string, delay: number }>, pulse: object|null, burst: object|null,
 *   subs: Array<{ side: string, row: string, text: string }>, rowFx: Array<{ side: string, row: string, state: string }> }>}
 */
export function buildDuelStepFx(br) {
  const steps = Array.isArray(br?.visualSteps) ? br.visualSteps : [];
  if (!steps.length) return [];
  const preVa = getPreVaStepIndex(steps);
  const preEnd = preVa >= 0 ? preVa - 1 : steps.length - 1;
  const postStart = preVa >= 0 ? getPostStepsStartIndex(steps) : steps.length;
  const ledger = { player: buildDuelVaLedgerRows(br, 'player'), enemy: buildDuelVaLedgerRows(br, 'enemy') };
  const out = [];

  const entries = [];
  for (let i = 1; i <= preEnd; i += 1) entries.push({ phase: 1, step: i, index: i });
  for (let i = postStart; i < steps.length; i += 1) entries.push({ phase: 5, step: i - postStart + 1, index: i });

  let before = rowStates(br, 0, 1);
  entries.forEach(({ phase, step, index }, n) => {
    if (phase === 5 && n > 0 && entries[n - 1].phase === 1) before = rowStates(br, 4, 1);
    const now = rowStates(br, phase, step);
    const rowFx = [];
    SIDES.forEach((side) => ROWS.forEach((row) => {
      if (now[side][row] !== before[side][row] && now[side][row] !== 'neutral') rowFx.push({ side, row, state: now[side][row] });
    }));
    before = now;

    const s = steps[index];
    const prev = steps[index - 1];
    const side = s.side === 'player' || s.side === 'enemy' ? s.side : null;
    const row = ABILITY_KINDS.has(s.kind) || s.kind === 'copyAbility' ? 'ability'
      : BONUS_KINDS.has(s.kind) || s.kind === 'copyBonus' ? 'bonus' : 'field';

    let item;
    if (!side || row === 'field') {
      item = {
        side: null, row: 'field', state: 'field', color: STEP_FX_COLORS.field, tag: STEP_FX_TAGS.field,
        src: br.field?.name || 'Campo', k: '◈ Campo', eff: br.field?.effect || '', tgt: '', beams: [], pulse: null, burst: null,
      };
    } else {
      const fx = rowFx.find((f) => f.side === side && f.row === row);
      let state = fx?.state || now[side][row];
      if (s.kind === 'powerBlocked' || s.kind === 'postPowerBlocked') state = 'blocked';
      if (s.kind === 'copyAbility' || s.kind === 'copyBonus') state = 'copied';
      if (state === 'neutral') state = 'active';
      const d = describeRow(br, side, row, state);
      const color = state === 'active' ? STEP_FX_COLORS[row] : STEP_FX_COLORS[state];
      const beams = [];
      let pulse = null;
      let burst = null;
      let tgt = '';
      const opp = other(side);

      if (state === 'blocked') {
        const blocker = shortName(opp === 'player' ? br.playerAgent : br.enemyAgent);
        tgt = `bloccato da ${blocker}`;
        pulse = { side, color: STEP_FX_COLORS.blocked };
      } else if (s.kind === 'block') {
        const victimRow = rowFx.find((f) => f.side === opp && f.state === 'blocked')?.row || 'ability';
        d.eff = d.eff || (victimRow === 'ability' ? 'Blocca Potere' : 'Blocca Bonus');
        tgt = `sul ${victimRow === 'ability' ? 'Potere' : 'Bonus'} di ${shortName(opp === 'player' ? br.playerAgent : br.enemyAgent)}`;
        beams.push({ from: { card: side, row }, to: { card: opp, row: victimRow }, color, delay: 60 });
        burst = { card: opp, row: victimRow, color: STEP_FX_COLORS.blocked, delay: 480 };
      } else {
        if (state === 'copied') {
          beams.push({ from: { card: opp, row }, to: { card: side, row }, color: STEP_FX_COLORS.copied, delay: 40 });
          tgt = `copiato da ${shortName(opp === 'player' ? br.playerAgent : br.enemyAgent)}`;
        }
        const self = statDelta(prev, s, side);
        const foe = statDelta(prev, s, opp);
        const vaTargets = [];
        [[opp, foe], [side, self]].forEach(([t, dl]) => {
          if (dl.va) {
            const mod = ledger[t].mods.findIndex((m) => m.arriveStep === index);
            vaTargets.push(t);
            beams.push({ from: { card: side, row }, to: { ledger: t, mod: Math.max(0, mod) }, color, delay: state === 'copied' ? 400 : 60 });
          }
        });
        if (self.power || self.damage) pulse = { side, color };
        if ((foe.power || foe.damage) && !foe.va) beams.push({ from: { card: side, row }, to: { card: opp, row: null }, color, delay: 60 });
        const t = vaTargets[0] || ((foe.power || foe.damage) ? opp : (self.power || self.damage) ? side : null);
        if (t) {
          const dl = t === side ? self : foe;
          const where = targetText(br, t, dl, side);
          tgt = tgt ? `${tgt} · ${where}` : where;
        }
      }
      item = { side, row, state, color, tag: STEP_FX_TAGS[state], src: d.src, k: d.k, eff: d.eff, tgt, beams, pulse, burst };
    }

    // Righe che nello stesso step risultano non soddisfatte: riquadro secondario
    const subs = rowFx
      .filter((f) => f.state === 'inactive' && !(f.side === item.side && f.row === item.row))
      .map((f) => {
        const d = describeRow(br, f.side, f.row, 'inactive');
        return { side: f.side, row: f.row, text: `${d.src} · ${d.k}` };
      });
    out.push({ phase, step, index, kind: s.kind, ...item, subs, rowFx });
  });
  return out;
}

/** Lo step in corso per fase e duelEffectStep, o null. */
export function currentStepFx(list, duelPhase, duelEffectStep) {
  if (duelPhase !== 1 && duelPhase !== 5) return null;
  const st = Math.max(1, duelEffectStep || 1);
  return list.find((x) => x.phase === duelPhase && x.step === st) || null;
}
