// Parametri dell'effetto «bruciatura» (dissolve/burn): un rumore a soglia consuma
// l'elemento, con una fascia di fiamma sul fronte e una fascia carbonizzata subito dietro.
// Solo presentazione. Nomi e significato ricalcano i parametri dello shader di riferimento
// (Burn Progress, Flame Percent, Outline Percent, Fire Thickness, Noise Scale, …).

/** Direzioni da cui parte il fuoco. */
export const BURN_DIRECTIONS = {
  bottom: 'Dal basso',
  top: "Dall'alto",
  left: 'Da sinistra',
  right: 'Da destra',
  center: 'Dal centro',
  point: 'Da un punto',
  scatter: 'Sparso',
};

/** Default: fiamma piena sul fronte, bordo carbonizzato scuro, fuoco che sale dal basso. */
export const BURN_DEFAULTS = {
  /** Durata della bruciatura completa (ms) */
  durationMs: 1800,
  /** Colore della fiamma (di norma l'accento dell'armata) */
  flameColor: '#38bdf8',
  /** Colore della fascia carbonizzata dietro la fiamma */
  outlineColor: '#0b0710',
  /** Spessore totale del fronte (fiamma + carbone), in unità del campo 0-1 */
  thickness: 0.13,
  /** Quota dello spessore occupata dalla fiamma (0-1) */
  flamePercent: 0.72,
  /** Quota dello spessore occupata dal carbone (0-1) */
  outlinePercent: 0.24,
  /** Opacità di ciò che è già bruciato (0 = sparisce) */
  burntAlpha: 0,
  /** Scala del rumore che disegna la forma dei buchi */
  burnNoiseScale: 3.2,
  /** Peso del rumore rispetto alla direzione (0 = fronte dritto, 1 = solo macchie) */
  noiseAmount: 0.42,
  /** Scala del rumore che fa ondeggiare il fronte */
  noiseScale: 9,
  /** Ampiezza dell'ondeggiamento del fronte */
  wobble: 0.05,
  /** Frastagliatura fine del fronte */
  jaggedness: 0.035,
  /** Velocità dell'ondeggiamento (lingue di fuoco che salgono) */
  speed: 1.6,
  /** Scala finale dell'elemento a fine bruciatura (1 = non rimpicciolisce) */
  shrink: 0.9,
  /** 0 = bande nette (cartoon, come il riferimento) · 1 = sfumate e luminose */
  softness: 0.35,
  /** Intensità del bagliore che la fiamma proietta attorno al fronte */
  glow: 0.8,
  /** Faville che si staccano dal fronte (al secondo, a piena intensità) */
  embers: 70,
  /** Direzione del fuoco: chiave di BURN_DIRECTIONS */
  direction: 'bottom',
  /** Origine per direction='point' (0-1 sull'elemento, y verso il basso) */
  originX: 0.5,
  originY: 0.5,
  /** Seme del rumore: cambia la forma dei buchi a parità di parametri */
  seed: 0,
};

/** Metadati dei cursori del lab: [chiave, etichetta, min, max, passo]. */
export const BURN_SLIDERS = [
  ['durationMs', 'Durata (ms)', 400, 5000, 50],
  ['thickness', 'Spessore fuoco', 0.02, 0.4, 0.005],
  ['flamePercent', 'Fiamma %', 0, 1, 0.01],
  ['outlinePercent', 'Carbone %', 0, 1, 0.01],
  ['burntAlpha', 'Alpha bruciato', 0, 1, 0.01],
  ['burnNoiseScale', 'Scala rumore buchi', 0.5, 12, 0.1],
  ['noiseAmount', 'Peso rumore', 0, 1, 0.01],
  ['noiseScale', 'Scala ondeggio', 1, 30, 0.5],
  ['wobble', 'Ondeggio bordo', 0, 0.2, 0.002],
  ['jaggedness', 'Frastagliatura', 0, 0.15, 0.002],
  ['speed', 'Velocità', 0, 6, 0.05],
  ['shrink', 'Rimpicciolimento', 0.5, 1, 0.01],
  ['softness', 'Morbidezza', 0, 1, 0.01],
  ['glow', 'Bagliore', 0, 2, 0.01],
  ['embers', 'Faville / s', 0, 300, 1],
  ['seed', 'Seme', 0, 100, 1],
];

/** Normalizza un colore #rgb/#rrggbb in [r,g,b] 0-1 (fallback bianco). */
export function hexToRgb01(hex) {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(h);
  if (!m) return [1, 1, 1];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

/** Unisce i parametri con i default scartando valori non numerici dove serve un numero. */
export function resolveBurnParams(params) {
  const out = { ...BURN_DEFAULTS };
  if (!params) return out;
  for (const key of Object.keys(BURN_DEFAULTS)) {
    const v = params[key];
    if (v == null) continue;
    if (typeof BURN_DEFAULTS[key] === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) out[key] = n;
    } else {
      out[key] = v;
    }
  }
  return out;
}

/**
 * Curva di avanzamento: metà lineare e metà smoothstep, così il fuoco attecchisce
 * piano, divora nel mezzo e rallenta sugli ultimi brandelli.
 * @param {number} t tempo lineare 0-1
 */
export function burnProgressCurve(t) {
  const x = Math.max(0, Math.min(1, t));
  return 0.5 * x + 0.5 * x * x * (3 - 2 * x);
}
