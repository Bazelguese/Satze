import React from 'react';

function HeatRiseFx() {
  return (
    <>
      <div className="satze-field-overdrive-fx__wash" />
      <div className="satze-field-overdrive-fx__stream-track satze-field-overdrive-fx__stream-track--a">
        <div className="satze-field-overdrive-fx__stream-segment satze-field-overdrive-fx__stream-segment--a" />
        <div className="satze-field-overdrive-fx__stream-segment satze-field-overdrive-fx__stream-segment--a" aria-hidden />
      </div>
      <div className="satze-field-overdrive-fx__stream-track satze-field-overdrive-fx__stream-track--b">
        <div className="satze-field-overdrive-fx__stream-segment satze-field-overdrive-fx__stream-segment--b" />
        <div className="satze-field-overdrive-fx__stream-segment satze-field-overdrive-fx__stream-segment--b" aria-hidden />
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className={`satze-field-overdrive-fx__ember satze-field-overdrive-fx__ember--${i + 1}`}
        />
      ))}
    </>
  );
}

function AuroraRingFx() {
  return (
    <>
      <div className="satze-od-aurora__wash" />
      <div className="satze-od-aurora__ring" />
      <div className="satze-od-aurora__core" />
    </>
  );
}

const COLUMN_TRACKS = {
  'veil-columns': [
    { id: 'a', segment: 'a', delay: 0 },
    { id: 'b', segment: 'b', delay: -0.34 },
    { id: 'c', segment: 'c', delay: -0.68 },
  ],
  'veil-columns-full': [
    { id: 'a', segment: 'a', delay: 0 },
    { id: 'b', segment: 'b', delay: -0.2 },
    { id: 'c', segment: 'c', delay: -0.4 },
    { id: 'd', segment: 'a', delay: -0.6 },
    { id: 'e', segment: 'b', delay: -0.8 },
  ],
  'veil-columns-dense': [
    { id: 'a', segment: 'a', delay: 0 },
    { id: 'b', segment: 'b', delay: -0.15 },
    { id: 'c', segment: 'c', delay: -0.29 },
    { id: 'd', segment: 'a', delay: -0.44 },
    { id: 'e', segment: 'b', delay: -0.59 },
    { id: 'f', segment: 'c', delay: -0.73 },
    { id: 'g', segment: 'a', delay: -0.88 },
  ],
  'veil-columns-flood': [
    { id: 'a', segment: 'a', delay: 0 },
    { id: 'b', segment: 'b', delay: -0.25 },
    { id: 'c', segment: 'c', delay: -0.49 },
    { id: 'd', segment: 'a', delay: -0.73 },
  ],
};

function VeilColumnsFx({ variant = 'veil-columns' }) {
  const tracks = COLUMN_TRACKS[variant] ?? COLUMN_TRACKS['veil-columns'];
  const washClass =
    variant === 'veil-columns'
      ? 'satze-field-overdrive-fx__wash'
      : `satze-od-columns__wash satze-od-columns__wash--${variant.replace('veil-columns-', '') || 'base'}`;

  return (
    <>
      <div className={washClass} />
      {tracks.map((track) => (
        <div
          key={track.id}
          className={`satze-od-columns__track satze-od-columns__track--${track.id}`}
          style={track.delay ? { animationDelay: `${track.delay}s` } : undefined}
        >
          <div className={`satze-od-columns__segment satze-od-columns__segment--${track.segment}`} />
          <div
            className={`satze-od-columns__segment satze-od-columns__segment--${track.segment}`}
            aria-hidden
          />
        </div>
      ))}
      {variant !== 'veil-columns' &&
        tracks.map((track) => (
          <div
            key={`core-${track.id}`}
            className={`satze-od-columns__core satze-od-columns__core--${track.id}`}
            style={track.delay ? { animationDelay: `${track.delay}s` } : undefined}
          />
        ))}
    </>
  );
}

function VeilColumnsLiteFx() {
  return <VeilColumnsFx variant="veil-columns" />;
}

function EmberFieldFx() {
  return (
    <>
      <div className="satze-field-overdrive-fx__wash satze-od-ember-field__wash" />
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`satze-field-overdrive-fx__ember satze-od-ember-field__spark satze-od-ember-field__spark--${i + 1}`}
        />
      ))}
    </>
  );
}

function PrismHaloFx() {
  return <div className="satze-od-prism__veil" />;
}

function SurgeBloomFx() {
  return (
    <>
      <div className="satze-field-overdrive-fx__wash satze-od-surge__wash" />
      <div className="satze-od-surge__track">
        <div className="satze-od-surge__bloom" />
        <div className="satze-od-surge__bloom" aria-hidden />
      </div>
    </>
  );
}

const FX_BY_VARIANT = {
  'heat-rise': HeatRiseFx,
  'aurora-ring': AuroraRingFx,
  'veil-columns': VeilColumnsLiteFx,
  'veil-columns-full': () => <VeilColumnsFx variant="veil-columns-full" />,
  'veil-columns-dense': () => <VeilColumnsFx variant="veil-columns-dense" />,
  'veil-columns-flood': () => <VeilColumnsFx variant="veil-columns-flood" />,
  'ember-field': EmberFieldFx,
  'prism-halo': PrismHaloFx,
  'surge-bloom': SurgeBloomFx,
};

export function OverdriveEffectOverlay({ variant = 'veil-columns' }) {
  const Fx = FX_BY_VARIANT[variant] ?? HeatRiseFx;

  return (
    <>
      <div
        className={`satze-field-overdrive-fx satze-field-overdrive-fx--${variant} pointer-events-none`}
        aria-hidden
      >
        <Fx />
      </div>
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center" aria-hidden>
        <span className="satze-hand-outcome-label satze-hand-outcome-label-overdrive">Overdrive</span>
      </div>
    </>
  );
}
