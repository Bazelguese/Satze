import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CHOICE_STATES,
  abilityRailExpandsDown,
  paramLimits,
  selectionParamsReady,
} from '../../game/eminence/eminenceChoiceView.js';
import { describeComposedPower, fragmentIdsFromParams } from '../../game/eminence/composeAbilityParams.js';
import { EMINENCE_ANNOUNCE_HOLD_MS as EMINENCE_ANNOUNCE_HOLD_MS_DEFAULT } from '../../game/eminence/eminenceAnnouncements.js';
import { EFFECT_TIMINGS } from '../../game/eminence/eminenceConstants.js';
import { getEminenceAnnounceHoldMs } from '../../utils/eminenceSystemPreference.js';
import { ARMY_COLORS } from '../../data/armies.js';
import { ALL_AGENTS } from '../../data/cards.js';
import { getEminenceArtUrl } from '../../data/eminenceArt.js';
import { getEminenceArtFrame } from '../../data/eminenceArtFrames.js';
import { getCardImageUrl } from '../../data/images.js';
import {
  DISPLAY_SETTINGS_CHANGED_EVENT,
  getDisplaySettings,
  resolveEminenceCardLife,
} from '../../settings/displaySettings.js';
import { EminenceTarotCard } from '../eminenceLab/EminenceTarotCard.jsx';
import '../eminenceLab/eminenceArtLab.css';
import {
  APPEARANCES,
  DEFAULT_APPEARANCE,
  DEFAULT_SHAPE,
  GATE_UI,
  PRESENCE_COLOR,
  RUNES,
  blockerLabel,
  costInk,
  costTextShadow,
  formatCurve,
  formatPresenceDelta,
  gateColor,
  hexAlpha,
  resolveShape,
  sashRuneIndex,
} from './eminenceUi.js';

const EM_UI_FONT = "'Chakra Petch', 'Segoe UI', system-ui, sans-serif";
const PARAM_VALUE_LABELS = {
  VITTORIA_PROPRIA: 'Tua',
  VITTORIA_AVVERSARIA: 'Avversario',
  PAREGGIO: 'Pareggio',
  TRIGGER: 'Trigger',
  EFFECT: 'Effetto',
};

const PARAM_HINTS = {
  pronostico: 'Scegli il pronostico',
  fragmentCardId: 'Scegli il Frammento',
  preyCardId: 'Scegli la Preda',
  cardId: 'Scegli l\'Agente',
  slot: 'Scegli il Campo',
  composeComponent: 'Trigger o effetto?',
  composeOrSecond: 'Scegli un secondo Frammento, oppure Trigger o Effetto',
  leagueDelta: 'Scegli +1 o −1 Lega',
};

function agentSideLabel(side) {
  if (side === 'player' || side === 'local') return 'Tu';
  if (side === 'enemy' || side === 'opponent') return 'IA';
  return null;
}

function paramValueLabel(value, meta = null) {
  if (meta?.label) return meta.label;
  if (PARAM_VALUE_LABELS[value]) return PARAM_VALUE_LABELS[value];
  if (typeof value === 'number' && value >= 0 && value < 10) return `Campo ${value + 1}`;
  const card = ALL_AGENTS.find((agent) => agent.id === value);
  return card?.name || String(value);
}

function enumParams(schema) {
  if (!schema) return [];
  return Object.entries(schema)
    .filter(([, values]) => Array.isArray(values) && values.length)
    .map(([key, values]) => ({ key, values }));
}

function refineEnumParam(param, draftParams) {
  if (!param || param.key !== 'composeComponent') return param;
  const ids = fragmentIdsFromParams(draftParams);
  const card = ALL_AGENTS.find((agent) => agent.id === ids[0]);
  if (!card) return param;
  if (!card.ability?.trigger) {
    return { ...param, values: param.values.filter((value) => value !== 'TRIGGER') };
  }
  return param;
}

function pendingEnumParam(schema, draftParams) {
  const params = enumParams(schema);
  const fragmentParam = params.find((param) => param.key === 'fragmentCardId');
  const composeParam = params.find((param) => param.key === 'composeComponent');
  const ids = fragmentIdsFromParams(draftParams);
  const limits = paramLimits(schema, 'fragmentCardId');

  if (fragmentParam && ids.length === 0) return fragmentParam;

  if (fragmentParam && ids.length < limits.max && draftParams?.composeComponent == null) {
    if (composeParam && ids.length >= 1) {
      const compose = refineEnumParam(composeParam, draftParams);
      return { key: 'composeOrSecond', values: [...fragmentParam.values, ...compose.values] };
    }
    return fragmentParam;
  }

  for (const param of params) {
    if (param.key === 'fragmentCardId') continue;
    if (param.key === 'composeComponent' && ids.length >= 2) continue;
    if (draftParams?.[param.key] == null) return refineEnumParam(param, draftParams);
  }
  return null;
}

function isParamOn(enumParam, draftParams, value) {
  if (!enumParam) return false;
  if (enumParam.key === 'composeOrSecond') {
    if (value === 'TRIGGER' || value === 'EFFECT') return draftParams?.composeComponent === value;
    return fragmentIdsFromParams(draftParams).includes(value);
  }
  if (enumParam.key === 'fragmentCardId') {
    return fragmentIdsFromParams(draftParams).includes(value);
  }
  return draftParams?.[enumParam.key] === value;
}

function nextFragmentDraft(prev, value, max) {
  const current = fragmentIdsFromParams(prev);
  let nextIds;
  if (current.includes(value)) nextIds = current.filter((id) => id !== value);
  else if (max <= 1) nextIds = [value];
  else nextIds = [...current, value].slice(0, max);
  if (!nextIds.length) return {};
  return { fragmentCardId: nextIds.length === 1 ? nextIds[0] : nextIds };
}

function splitParamGroups(enumParam) {
  const values = enumParam?.values || [];
  if (enumParam?.key === 'composeOrSecond') {
    return {
      prey: [],
      fragments: values.filter((value) => value !== 'TRIGGER' && value !== 'EFFECT'),
      compose: values.filter((value) => value === 'TRIGGER' || value === 'EFFECT'),
    };
  }
  if (enumParam?.key === 'fragmentCardId') {
    return { prey: [], fragments: values, compose: [] };
  }
  if (enumParam?.key === 'preyCardId' || enumParam?.key === 'cardId') {
    return { prey: values, fragments: [], compose: [] };
  }
  return { prey: [], fragments: [], compose: values };
}

/** Sull'ultima losanga i Frammenti restano visibili anche dopo la scelta. */
function panelEnumParam(schema, draftParams, expandDown) {
  const pending = pendingEnumParam(schema, draftParams);
  if (!expandDown) return pending;

  const fragmentParam = enumParams(schema).find((param) => param.key === 'fragmentCardId');
  const composeParam = enumParams(schema).find((param) => param.key === 'composeComponent');
  if (!fragmentParam) return pending;

  const ids = fragmentIdsFromParams(draftParams);
  if (ids.length === 0) return fragmentParam;
  if (ids.length >= 2 || !composeParam) {
    return { key: 'fragmentCardId', values: fragmentParam.values };
  }
  const compose = refineEnumParam(composeParam, draftParams);
  return { key: 'composeOrSecond', values: [...fragmentParam.values, ...compose.values] };
}

const EM_SASH_NAME_OUTLINE =
  '0 0 2px rgba(0,0,0,0.98), 0 1px 3px rgba(0,0,0,1), 0 2px 10px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,1)';
const EM_BODY_OUTLINE = '0 0 2px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)';

function Sash({ accent, name, gradId }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const step = 220 / 16;
  const glyphs = (y, offset) => Array.from({ length: 15 }, (_, i) => (
    <g key={`${y}-${i}`} transform={`translate(${step * (i + 1)} ${y})`}>
      <path d={RUNES[sashRuneIndex(i, offset)]} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.9" />
    </g>
  ));
  const gid = gradId || 'em-sash-grad';

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;
    const maxW = Math.max(40, wrap.clientWidth - 20);
    const minFs = 8;
    const maxFs = 15;
    el.style.whiteSpace = 'nowrap';
    let low = minFs;
    let high = maxFs;
    let best = minFs;
    for (let i = 0; i < 24; i += 1) {
      if (high - low < 0.15) break;
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= maxW + 0.5) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    el.style.fontSize = `${best}px`;
  }, [name]);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 4, zIndex: 8, height: 52 }}>
      <svg width="100%" height="52" viewBox="0 0 220 52" preserveAspectRatio="none" style={{ display: 'block', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.75))' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="20%" stopColor={accent} />
            <stop offset="80%" stopColor={accent} />
            <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <rect x="0" y="15" width="220" height="22" fill={`url(#${gid})`} />
        <line x1="0" y1="14" x2="220" y2="14" stroke={accent} strokeWidth="0.8" />
        <line x1="0" y1="38" x2="220" y2="38" stroke={accent} strokeWidth="0.8" />
        {glyphs(7, 0)}
        {glyphs(45, 5)}
        <rect x="0" y="24" width="220" height="2" fill="rgba(248,250,252,0.2)" />
      </svg>
      <div
        ref={wrapRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px',
          pointerEvents: 'none',
        }}
      >
        <span
          ref={textRef}
          style={{
            fontFamily: EM_UI_FONT,
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#f8fafc',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: `${EM_SASH_NAME_OUTLINE}, 0 0 14px ${accent}99`,
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function EminenzaCard({
  eminence,
  presence,
  accent,
  appearance,
  artX,
  artY,
  artZoom,
  artFocusX,
  artFocusY,
  life = 'arena',
  prey = [],
  fragments = [],
  focusedMarkId = null,
  arrivingMarkId = null,
  skipEntrance = false,
  onMarkFocus,
}) {
  const artUrl = getEminenceArtUrl(eminence);
  const frame = getEminenceArtFrame(eminence.id);
  const x = artX ?? frame.artX;
  const y = artY ?? frame.artY;
  const zoom = artZoom ?? frame.zoom;
  const focusX = artFocusX ?? frame.focusX;
  const focusY = artFocusY ?? frame.focusY;

  return (
    <div
      className="em-card"
      style={{
        position: 'relative',
        zIndex: 1,
        width: 300,
        height: 525,
        flex: 'none',
        overflow: (prey.length || fragments.length) ? 'visible' : 'hidden',
        background: 'transparent',
        '--em-acc': accent,
        animation: skipEntrance ? 'none' : appearance.card,
        transformOrigin: appearance.origin || 'center center',
      }}
    >
      <EminenceTarotCard
        className="em-card__arena"
        name={eminence.name}
        army={eminence.army}
        staticText={eminence.staticText || ''}
        presence={presence}
        artUrl={artUrl}
        accent={accent}
        life={life}
        tiltEnabled
        idleOrbit
        lockPlane
        showChrome={false}
        showEdge={false}
        artX={x}
        artY={y}
        artZoom={zoom}
        artFocusX={focusX}
        artFocusY={focusY}
      >
        {appearance.ring && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            margin: '-100px 0 0 -100px',
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            animation: 'emRing .7s .5s ease-out both',
            pointerEvents: 'none',
          }}
          />
        )}
        <Sash accent={accent} name={eminence.name} gradId={`em-sash-${String(eminence.id).replace(/[^a-z0-9]/gi, '')}`} />
        <MarkTokens
          kind="prey"
          ids={prey}
          arrivingId={arrivingMarkId}
          accent={accent}
          band={0}
          focusedId={focusedMarkId}
          onFocus={onMarkFocus}
        />
        <MarkTokens
          kind="fragment"
          ids={fragments}
          accent={accent}
          band={prey.length ? 1 : 0}
          focusedId={focusedMarkId}
          onFocus={onMarkFocus}
        />
        <div className="em-card-copy" style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 24,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 9px 9px',
        }}
        >
          {eminence.staticName && (
            <div className="em-card-static" style={{
              flex: 'none',
              marginBottom: 8,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(4,6,12,.88)',
              border: '1px solid rgba(255,255,255,.16)',
              borderLeft: `3px solid ${accent}`,
              boxShadow: '0 8px 18px rgba(0,0,0,.5)',
            }}
            >
            <div style={{
              fontFamily: EM_UI_FONT,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: accent,
            }}
            >
              {`Statico · ${eminence.staticName}`}
            </div>
            <div style={{
              marginTop: 5,
              fontFamily: EM_UI_FONT,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.4,
              color: '#f8fafc',
              textShadow: EM_BODY_OUTLINE,
            }}
            >
              {eminence.staticText}
            </div>
            </div>
          )}
          <div style={{
            flex: 'none',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,.62)',
            border: '1px solid rgba(255,255,255,.1)',
          }}
          >
            <span style={{
              fontFamily: EM_UI_FONT,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              lineHeight: 1.25,
            }}
            >
              Presenza
              <br />
              iniziale
            </span>
            <span
              data-em-presence
              style={{
              fontFamily: EM_UI_FONT,
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: PRESENCE_COLOR,
              textShadow: '0 1px 2px rgba(0,0,0,.9),0 0 12px rgba(56,189,248,.3)',
            }}
            >
              {presence}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ textAlign: 'right', lineHeight: 1.25, fontFamily: EM_UI_FONT }}>
              <span style={{
                display: 'block',
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: '#94a3b8',
              }}
              >
                Curva
              </span>
              <span style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
                textShadow: EM_BODY_OUTLINE,
              }}
              >
                {formatCurve(eminence.presenceCurve)}
              </span>
            </span>
          </div>
        </div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 9px',
          borderRadius: '0 0 11px 11px',
          background: hexAlpha(accent, 0.6),
        }}
        >
          <span style={{
            fontFamily: EM_UI_FONT,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: '#f8fafc',
            textShadow: EM_SASH_NAME_OUTLINE,
          }}
          >
            {eminence.army}
          </span>
          <span style={{
            fontFamily: EM_UI_FONT,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: '#f8fafc',
            textShadow: EM_SASH_NAME_OUTLINE,
          }}
          >
            Eminenza
          </span>
        </div>
      </EminenceTarotCard>
    </div>
  );
}

function useDisplaySettings() {
  const [settings, setSettings] = useState(() => getDisplaySettings());
  useEffect(() => {
    const on = () => setSettings(getDisplaySettings());
    window.addEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
    return () => window.removeEventListener(DISPLAY_SETTINGS_CHANGED_EVENT, on);
  }, []);
  return settings;
}

function EminenzaRailItem({
  option,
  armyAccent,
  shapeId,
  selected,
  dimmed,
  appearance,
  index,
  four,
  onPick,
  onConfirm,
  enumParam = null,
  isParamSelected = null,
  onSelectParam,
  commitOnPick = false,
  draftParams = null,
  paramHint = 'Clicca di nuovo per confermare',
  paramHintRecap = false,
  expandDown = false,
  paramMeta = null,
}) {
  const gain = option.isGain;
  const illegal = Boolean(option.blocker);
  const shape = resolveShape(shapeId, armyAccent, gain);
  const gate = GATE_UI[option.revealGate] || GATE_UI.GENERAL;
  const note = blockerLabel(option.blocker);
  const height = four ? 76 : 92;
  const per = appearance.per ? appearance.per(index) : {};
  const ink = costInk(shape, armyAccent, gain);
  const csh = costTextShadow(shape, armyAccent, gain);
  const isAgentParam = enumParam?.key === 'cardId';
  const overlayParams = selected && enumParam && onSelectParam && !expandDown && !isAgentParam;
  const agentPicks = selected && onSelectParam && isAgentParam;
  const dropParams = selected && expandDown && onSelectParam && (enumParam || paramHintRecap);
  const paramGroups = splitParamGroups(enumParam);

  const pickParam = (value) => {
    if (!enumParam || !onSelectParam) return;
    const isOn = Boolean(isParamSelected?.(value));
    const concluding = value === 'TRIGGER' || value === 'EFFECT'
      || (enumParam.key !== 'fragmentCardId' && enumParam.key !== 'composeOrSecond');
    if (isOn && (enumParam.key === 'preyCardId' || enumParam.key === 'cardId') && !commitOnPick) return;
    if (isOn && concluding && onConfirm && !expandDown) {
      onConfirm(option.id);
      return;
    }
    onSelectParam(enumParam.key, value);
    if (commitOnPick && concluding && onConfirm) {
      onConfirm(option.id, { ...(draftParams || {}), [enumParam.key]: value });
    }
  };

  return (
    <div
      className={[
        'em-rail-item',
        illegal ? 'em-rail-illegal' : '',
        selected ? 'em-rail-sel' : '',
        dimmed ? 'em-rail-dim' : '',
        overlayParams ? 'em-rail-params-open' : '',
        dropParams ? 'em-rail-expand-down' : '',
        agentPicks ? 'em-rail-agent-open' : '',
      ].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        minHeight: height,
        display: 'flex',
        alignItems: dropParams || agentPicks ? 'stretch' : 'center',
        flexDirection: dropParams || agentPicks ? 'column' : 'row',
        justifyContent: 'flex-end',
        transform: `skewX(${shape['--skew']})`,
        animation: appearance.rail,
        animationDelay: `${appearance.base + index * appearance.step}s`,
        transformOrigin: appearance.originRail || 'right center',
        ...per,
        '--em-sel': armyAccent,
      }}
    >
      <div className="em-rail-lozenge" style={{
        position: 'relative',
        flex: dropParams || agentPicks ? 'none' : 1,
        width: '100%',
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
      >
      <div style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${shape['--offx']},${shape['--offy']})`,
        clipPath: shape['--clip'],
        background: shape['--backplate'],
      }}
      />
      <button
        type="button"
        className="em-rail-hit"
        disabled={!onPick}
        aria-disabled={illegal || !onPick}
        onClick={() => {
          if (illegal || !onPick) return;
          if (selected && onConfirm) onConfirm(option.id);
          else onPick(option.id);
        }}
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          minHeight: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: 0,
          border: 0,
          cursor: !onPick ? 'default' : illegal ? 'not-allowed' : 'pointer',
          color: 'inherit',
          background: shape['--plate'],
          clipPath: shape['--clip'],
          boxShadow: selected ? undefined : (shape['--plateshadow'] || 'none'),
        }}
      >
        <div
          className={selected ? 'em-rail-fill' : undefined}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: shape['--clip'] === 'none' ? undefined : shape['--clip'],
            background: selected
              ? `linear-gradient(270deg,${hexAlpha(armyAccent, 0.78)},${hexAlpha(armyAccent, 0.28)})`
              : (shape['--grain'] || 'none'),
            opacity: selected ? 1 : Number(shape['--grainop'] || 0),
            pointerEvents: 'none',
            boxShadow: selected ? `inset 0 0 0 2px ${armyAccent}` : 'none',
          }}
        />
        {illegal && (
          <div
            className="em-rail-hatch"
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: shape['--clip'],
              boxShadow: 'inset 0 0 0 2px #8c3346',
              background: 'repeating-linear-gradient(45deg,rgba(140,51,70,.16),rgba(140,51,70,.16) 4px,transparent 4px,transparent 9px)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: shape['--barw'] || '0px',
          background: shape['--bar'] || 'transparent',
        }}
        />
        <div style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          padding: '13px 18px 14px 22px',
          textAlign: 'right',
          transform: `skewX(${shape['--unskew']})`,
        }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexDirection: 'row-reverse' }}>
            <span style={{
              fontFamily: EM_UI_FONT,
              fontWeight: 800,
              fontSize: shape['--namefs2'] || 16,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: shape['--ink'],
              textShadow: shape['--inkshadow'] === 'none' ? 'none' : (shape['--inkshadow'] || EM_SASH_NAME_OUTLINE),
            }}
            >
              {option.name || formatPresenceDelta(option.presenceDelta)}
            </span>
            <span style={{
              fontFamily: EM_UI_FONT,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: gateColor(shape, option.revealGate),
            }}
            >
              {gate.label}
            </span>
          </div>
          <div style={{
            marginTop: 6,
            fontFamily: EM_UI_FONT,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.4,
            color: shape['--sub'],
            textShadow: shape['--subshadow'] === 'none' ? 'none' : (shape['--subshadow'] || EM_BODY_OUTLINE),
          }}
          >
            {option.text}
          </div>
          {note && (
            <div style={{
              marginTop: 4,
              fontFamily: EM_UI_FONT,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#ff8a9b',
              textShadow: EM_BODY_OUTLINE,
            }}
            >
              {note}
            </div>
          )}
        </div>
        <div style={{
          position: 'relative',
          flex: 'none',
          width: shape['--costw'],
          alignSelf: 'stretch',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 14,
          boxSizing: 'border-box',
          background: shape['--costbg'],
          clipPath: shape['--costclip'] || 'none',
          boxShadow: shape['--costshadow'] || 'none',
          transform: `skewX(${shape['--unskew']})`,
        }}
        >
          <span style={{
            fontFamily: shape['--costfont'] || EM_UI_FONT,
            fontSize: shape['--costfs'] || 30,
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: ink,
            textShadow: csh,
          }}
          >
            {formatPresenceDelta(option.presenceDelta)}
          </span>
        </div>
      </button>
      {overlayParams && (
        <div
          className={['em-rail-params', (enumParam.key === 'preyCardId' || enumParam.key === 'cardId') ? 'is-names' : ''].filter(Boolean).join(' ')}
          style={{
            clipPath: shape['--clip'] === 'none' ? undefined : shape['--clip'],
          }}
        >
          {enumParam.values.map((value) => {
            const meta = paramMeta?.[enumParam.key]?.[value] || paramMeta?.[enumParam.key]?.[String(value)] || null;
            return (
            <button
              key={value}
              type="button"
              title={paramValueLabel(value, meta)}
              className={[
                'em-rail-param',
                isParamSelected?.(value) ? 'is-on' : '',
                meta?.cursed ? 'is-marked' : '',
              ].filter(Boolean).join(' ')}
              onClick={(event) => {
                event.stopPropagation();
                pickParam(value);
              }}
            >
              <span style={{ transform: `skewX(${shape['--unskew']})` }}>
                {paramValueLabel(value, meta)}
              </span>
            </button>
            );
          })}
        </div>
      )}
      {selected && onConfirm && !expandDown && !agentPicks && (
        <div className={['em-rail-confirm-hint', paramHintRecap ? 'is-recap' : ''].filter(Boolean).join(' ')}>
          {paramHint}
        </div>
      )}
      </div>
      {agentPicks && (
        <RailAgentTokens
          values={enumParam.values}
          armyAccent={armyAccent}
          isParamSelected={isParamSelected}
          paramMeta={paramMeta}
          paramKey={enumParam.key}
          onPick={pickParam}
          hint={paramHint}
          hintReady={paramHintRecap}
          unskew={shape['--unskew']}
        />
      )}
      {dropParams && (
        <div
          className="em-rail-drop"
          style={{ transform: `skewX(${shape['--unskew']})`, transformOrigin: '50% 0' }}
        >
          {paramGroups.prey.length > 0 && (
            <div className="em-rail-drop-block">
              <div className="em-rail-drop-label">
                {paramGroups.prey.length === 1 ? 'Preda' : 'Prede'}
              </div>
              {paramGroups.prey.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={['em-rail-drop-choice', isParamSelected?.(value) ? 'is-on' : ''].filter(Boolean).join(' ')}
                  onClick={(event) => {
                    event.stopPropagation();
                    pickParam(value);
                  }}
                >
                  {paramValueLabel(value)}
                </button>
              ))}
            </div>
          )}
          {paramGroups.fragments.length > 0 && (
            <div className="em-rail-drop-block">
              <div className="em-rail-drop-label">
                {paramGroups.fragments.length === 1 ? 'Frammento' : 'Frammenti'}
              </div>
              {paramGroups.fragments.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={['em-rail-drop-choice', isParamSelected?.(value) ? 'is-on' : ''].filter(Boolean).join(' ')}
                  onClick={(event) => {
                    event.stopPropagation();
                    pickParam(value);
                  }}
                >
                  {paramValueLabel(value)}
                </button>
              ))}
            </div>
          )}
          {paramGroups.compose.length > 0 && (
            <div className="em-rail-drop-block">
              <div className="em-rail-drop-label">Oppure una sola metà dell'Agente</div>
              <div className="em-rail-drop-compose">
                {paramGroups.compose.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={['em-rail-drop-choice', 'em-rail-drop-half', isParamSelected?.(value) ? 'is-on' : ''].filter(Boolean).join(' ')}
                    onClick={(event) => {
                      event.stopPropagation();
                      pickParam(value);
                    }}
                  >
                    {paramValueLabel(value)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={['em-rail-drop-recap', paramHintRecap ? 'is-ready' : ''].filter(Boolean).join(' ')}>
            {paramHint}
          </div>
        </div>
      )}
    </div>
  );
}

function EminenzaRail({
  options,
  armyAccent,
  shapeId,
  pickedId,
  appearance,
  locked,
  onPick,
  onConfirm,
  draftParams: draftParamsProp = null,
  onDraftParams = null,
  paramMeta = null,
  paramsLocked = null,
  commitOnPick = false,
}) {
  const resolvedPick = pickedId ?? options.find((o) => o.selected)?.id ?? null;
  const four = options.length > 3;
  const selectedOption = options.find((option) => option.id === resolvedPick) || null;
  const schema = selectedOption?.paramsSchema ?? null;
  const [localDraft, setLocalDraft] = useState(null);
  const draftParams = onDraftParams ? draftParamsProp : localDraft;
  const setDraftParams = onDraftParams || setLocalDraft;
  const expandDownId = options.at(-1)?.id ?? null;
  const expandDown = abilityRailExpandsDown(schema, {
    isLastOption: resolvedPick != null && resolvedPick === expandDownId,
  });
  const pending = pendingEnumParam(schema, draftParams);
  const enumParam = panelEnumParam(schema, draftParams, expandDown);

  useEffect(() => {
    setDraftParams(null);
  }, [resolvedPick]);

  const recap = describeComposedPower(draftParams, {
    allowAlias: !schema?.composeComponent,
  });
  const pendingHint = pending?.key === 'fragmentCardId' && paramLimits(schema, 'fragmentCardId').max > 1
    ? 'Scegli uno o due Frammenti'
    : (pending ? (PARAM_HINTS[pending.key] || 'Scegli') : null);
  const paramHint = pendingHint
    || (recap ? `${recap}. Clicca di nuovo la losanga per confermare.` : 'Clicca di nuovo per confermare');

  const paramsAreLocked = paramsLocked ?? locked;
  const confirm = (!locked || !paramsAreLocked) && onConfirm
    ? (abilityId, params = draftParams) => {
      const option = options.find((entry) => entry.id === abilityId);
      const optionSchema = option?.paramsSchema ?? null;
      if (!selectionParamsReady(optionSchema, params)) return;
      onConfirm(abilityId, optionSchema ? params : null);
    }
    : null;

  return (
    <div className="em-rail">
      {options.map((option, i) => (
        <EminenzaRailItem
          key={option.id}
          option={option}
          armyAccent={armyAccent}
          shapeId={shapeId}
          selected={resolvedPick === option.id}
          dimmed={resolvedPick != null && resolvedPick !== option.id}
          appearance={appearance}
          index={i}
          four={four}
          onPick={locked ? null : onPick}
          onConfirm={confirm}
          enumParam={resolvedPick === option.id ? enumParam : null}
          isParamSelected={(value) => isParamOn(enumParam, draftParams, value)}
          paramHint={paramHint}
          paramHintRecap={!pending && Boolean(recap)}
          expandDown={expandDown && option.id === expandDownId}
          paramMeta={paramMeta}
          commitOnPick={commitOnPick}
          draftParams={draftParams}
          onSelectParam={paramsAreLocked ? null : (key, value) => {
            setDraftParams((prev) => {
              if (key === 'composeOrSecond') {
                if (value === 'TRIGGER' || value === 'EFFECT') {
                  return { ...(prev || {}), composeComponent: value };
                }
                return nextFragmentDraft(prev, value, paramLimits(schema, 'fragmentCardId').max);
              }
              if (key === 'fragmentCardId') {
                return nextFragmentDraft(prev, value, paramLimits(schema, 'fragmentCardId').max);
              }
              return { ...(prev || {}), [key]: value };
            });
          }}
        />
      ))}
    </div>
  );
}

const POST_DUEL_ANNOUNCE_TIMINGS = new Set([
  EFFECT_TIMINGS.AFTER_DUEL_OUTCOME,
  EFFECT_TIMINGS.BEFORE_CONQUEST,
  EFFECT_TIMINGS.POST_BATTLE,
  EFFECT_TIMINGS.END_ROUND,
  EFFECT_TIMINGS.END_MATCH,
]);

function isPostDuelAnnounce(notice) {
  if (!notice) return false;
  if (notice.phaseDetail === 'Dopo il Duello') return true;
  if (notice.timing && POST_DUEL_ANNOUNCE_TIMINGS.has(notice.timing)) return true;
  return false;
}

function EminenceAnnounceBanner({ notice, accent, onDismiss, held = false, autoDismiss = true }) {
  const holdMs = getEminenceAnnounceHoldMs() || EMINENCE_ANNOUNCE_HOLD_MS_DEFAULT;
  useEffect(() => {
    if (!notice || !autoDismiss) return undefined;
    const timer = setTimeout(() => onDismiss?.(notice.id), holdMs);
    return () => clearTimeout(timer);
  }, [notice, onDismiss, autoDismiss, holdMs]);

  if (!notice) return null;

  const phaseKey = (notice.phase || 'REVEAL').toLowerCase();
  const postDuel = isPostDuelAnnounce(notice);
  const ownerLabel = notice.ownerLabel
    || (notice.side === 'player' ? 'La tua Eminenza' : 'Eminenza avversaria');
  const badgeText = notice.badgeText || notice.phaseLabel || 'Avviso';
  const hint = notice.hint || (notice.kind === 'setup'
    ? 'Clicca per scegliere il bersaglio'
    : 'Clicca per chiudere');
  const delta = notice.presenceDelta;

  return (
    <button
      type="button"
      className={[
        'em-announce',
        `em-announce-${notice.side}`,
        `em-announce-phase-${phaseKey}`,
        held ? 'is-held' : '',
      ].filter(Boolean).join(' ')}
      data-phase={phaseKey}
      data-post-duel={postDuel ? '1' : undefined}
      data-em-announce={notice.side}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDismiss?.(notice.id);
      }}
      style={{
        '--em-ann-acc': accent,
        '--em-ann-phase': notice.phaseColor || accent,
        '--em-ann-hold': `${holdMs}ms`,
      }}
      aria-label={`${ownerLabel}: ${notice.sourceName || badgeText}. ${notice.name}. ${notice.text}`}
    >
      <span className="em-announce-burst" aria-hidden />
      <span className="em-announce-sweep" aria-hidden />
      <span className="em-announce-eyebrow">{ownerLabel}</span>
      {notice.sourceName && (
        <span className="em-announce-source">{notice.sourceName}</span>
      )}
      <span className="em-announce-kind">
        <span className="em-announce-phase-label">{notice.phaseLabel || badgeText}</span>
        {notice.phaseDetail && (
          <span className="em-announce-phase-detail">{notice.phaseDetail}</span>
        )}
      </span>
      <strong className="em-announce-name">{notice.name}</strong>
      {typeof delta === 'number' && (
        <span className="em-announce-cost">{formatPresenceDelta(delta)} Presenza</span>
      )}
      <p className="em-announce-text">{notice.text}</p>
      <span className="em-announce-hint">{hint}</span>
      <span className="em-announce-timer" aria-hidden />
    </button>
  );
}

function RailAgentTokens({
  values,
  armyAccent,
  isParamSelected,
  paramMeta,
  paramKey,
  onPick,
  hint,
  hintReady,
  unskew,
}) {
  if (!values?.length) return null;
  return (
    <div
      className="em-rail-agent-picks"
      style={{ '--em-acc': armyAccent, transform: unskew ? `skewX(${unskew})` : undefined, transformOrigin: '50% 0' }}
    >
      <div className="em-rail-agent-picks-label">Scegli l'Agente</div>
      <div className="em-rail-agent-picks-row">
        {values.map((value) => {
          const meta = paramMeta?.[paramKey]?.[value] || paramMeta?.[paramKey]?.[String(value)] || null;
          const card = ALL_AGENTS.find((agent) => agent.id === value);
          const artUrl = getCardImageUrl(null, value);
          const name = paramValueLabel(value, meta);
          const side = agentSideLabel(meta?.side);
          return (
            <button
              key={value}
              type="button"
              title={name}
              className={['em-mark-token', isParamSelected?.(value) ? 'is-on' : ''].filter(Boolean).join(' ')}
              onClick={(event) => {
                event.stopPropagation();
                onPick(value);
              }}
            >
              {side && <span className="em-rail-agent-side">{side}</span>}
              <span className="em-mark-token-disk">
                {artUrl ? <img src={artUrl} alt="" /> : null}
                <span className="em-mark-token-glint" aria-hidden />
              </span>
              <span className="em-mark-token-name">{card?.name || name}</span>
            </button>
          );
        })}
      </div>
      {hint && (
        <div className={['em-rail-drop-recap', hintReady ? 'is-ready' : ''].filter(Boolean).join(' ')}>
          {hint}
        </div>
      )}
    </div>
  );
}

function MarkTokens({ kind = 'prey', ids = [], accent, band = 0, focusedId = null, arrivingId = null, onFocus }) {
  if (!ids.length) return null;
  const singular = kind === 'fragment' ? 'Frammento' : 'Preda';
  const plural = kind === 'fragment' ? 'Frammenti' : 'Prede';
  return (
    <div
      className={`em-mark-tokens em-mark-tokens-${kind}`}
      data-count={Math.min(ids.length, 4)}
      data-band={band}
      style={{ '--em-acc': accent }}
      aria-label={`${ids.length} ${ids.length === 1 ? singular.toLowerCase() : plural.toLowerCase()} su questa Eminenza`}
    >
      {ids.map((id) => {
        const card = ALL_AGENTS.find((agent) => agent.id === id);
        const artUrl = getCardImageUrl(null, id);
        const name = card?.name || `Carta ${id}`;
        return (
          <button
            key={`${kind}-${id}`}
            type="button"
            className={['em-mark-token', focusedId === id ? 'is-on' : '', arrivingId === id ? 'is-arrive' : ''].filter(Boolean).join(' ')}
            data-mark-token={`${kind}-${id}`}
            onClick={(event) => {
              event.stopPropagation();
              onFocus?.(id, kind);
            }}
            aria-pressed={focusedId === id}
            aria-label={`${singular}: ${name}. Evidenzia in mano.`}
          >
            <span className="em-mark-token-disk">
              {artUrl ? <img src={artUrl} alt="" draggable={false} /> : null}
              <span className="em-mark-token-glint" aria-hidden />
            </span>
            <span className="em-mark-token-name">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EminenzaZone({
  side,
  eminence,
  presence,
  accent: accentOverride,
  options = [],
  pickedId = null,
  choiceState = CHOICE_STATES.CHOOSING,
  appearance = DEFAULT_APPEARANCE,
  shape = DEFAULT_SHAPE,
  embedded = false,
  artX,
  artY,
  artZoom,
  artFocusX,
  artFocusY,
  shiftX = 0,
  shiftY = 0,
  opponentFoil = false,
  onPick,
  onConfirm,
  draftParams = null,
  onDraftParams = null,
  paramMeta = null,
  announce = null,
  hideRail = false,
  paramsOpen = false,
  onDismissAnnounce,
  fragments = [],
  prey = [],
  setup = null,
  onSetupConfirm,
  focusedMarkId = null,
  arrivingMarkId = null,
  onMarkFocus,
  stowed = false,
  announceHeld = false,
  announceAutoDismiss = true,
}) {
  if (!eminence) return null;

  const displaySettings = useDisplaySettings();
  const cardLife = resolveEminenceCardLife(side, displaySettings, { opponentFoil });

  const style = APPEARANCES[appearance] || APPEARANCES[DEFAULT_APPEARANCE];
  const accent = accentOverride || ARMY_COLORS[eminence.army]?.accent || '#d5ecf9';
  const isPlayer = side === 'player';
  const announceOnly = Boolean(announce) && isPostDuelAnnounce(announce);
  const setupPending = Boolean(setup?.pending && isPlayer);
  const locked = !isPlayer
    || (!setupPending && (choiceState === CHOICE_STATES.LOCKED_HIDDEN || choiceState === CHOICE_STATES.REVEALED));
  const railOptions = setupPending
    ? [{
      id: '__setup__',
      name: setup.name || 'Setup',
      text: setup.text || '',
      presenceDelta: 0,
      isGain: true,
      revealGate: 'GENERAL',
      paramsSchema: setup.paramsSchema,
      selectable: true,
      blocker: null,
    }]
    : options;

  return (
    <div className={`em-layer em-layer-${side}${embedded ? ' em-layer-embedded' : ''}${stowed ? ' is-stowed' : ''}`}>
      <div className={`em-zone em-zone-${side}`} data-side={side} style={{
        transform: (shiftX || shiftY) ? `translate(${shiftX}px, ${shiftY}px)` : undefined,
      }}
      >
        {style.slash && !announce && !stowed && !(prey.length || fragments.length) && (
          <div style={{
            position: 'absolute',
            top: '-8%',
            bottom: '-8%',
            left: 0,
            width: 70,
            zIndex: 9,
            pointerEvents: 'none',
            transform: 'skewX(-16deg)',
            background: `linear-gradient(90deg,transparent,${accent},#fff,${accent},transparent)`,
            mixBlendMode: 'screen',
            animation: 'emSlashLine .62s cubic-bezier(.3,.9,.2,1) both',
          }}
          />
        )}
        <div className={`em-stage${announceOnly ? ' em-stage-announce-only' : ''}`}>
          {!announceOnly && (
            <EminenzaCard
              eminence={eminence}
              presence={presence}
              accent={accent}
              appearance={style}
              artX={artX}
              artY={artY}
              artZoom={artZoom}
              artFocusX={artFocusX}
              artFocusY={artFocusY}
              life={cardLife}
              prey={prey}
              fragments={fragments}
              focusedMarkId={focusedMarkId}
              arrivingMarkId={arrivingMarkId}
              skipEntrance={stowed || Boolean(announce) || prey.length > 0 || fragments.length > 0}
              onMarkFocus={onMarkFocus}
            />
          )}
          {announce ? (
            <EminenceAnnounceBanner
              key={announce.id}
              notice={announce}
              accent={accent}
              held={announceHeld}
              autoDismiss={announceAutoDismiss}
              onDismiss={onDismissAnnounce}
            />
          ) : (
            !hideRail && (
              <EminenzaRail
                options={railOptions}
                armyAccent={accent}
                shapeId={shape}
                pickedId={setupPending ? '__setup__' : pickedId}
                appearance={style}
                locked={locked}
                paramsLocked={locked && !paramsOpen}
                commitOnPick={paramsOpen}
                onPick={setupPending ? () => {} : onPick}
                onConfirm={setupPending
                  ? (_id, params) => onSetupConfirm?.(params)
                  : onConfirm}
                draftParams={draftParams}
                onDraftParams={onDraftParams}
                paramMeta={paramMeta}
              />
            )
          )}
        </div>
        {choiceState === CHOICE_STATES.LOCKED_HIDDEN && isPlayer && !announce && !paramsOpen && (
          <div className="em-locked-note">Scelta sigillata</div>
        )}
      </div>
    </div>
  );
}

export default EminenzaZone;
