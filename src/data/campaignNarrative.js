// Eventi narrativi placeholder — campagna Figli (effetti su pressione fazioni).

export const CAMPAIGN_NARRATIVE_ORDER = [
  { id: 'fdh_evt_01', afterMissions: 2 },
  { id: 'fdh_evt_02', afterMissions: 4 },
];

export const CAMPAIGN_NARRATIVE_EVENTS = {
  fdh_evt_01: {
    id: 'fdh_evt_01',
    title: 'Il Canto si fa più forte',
    isAnomaly: false,
    body: [
      'Tra una missione e l\'altra il Canto risuona — non come suono, ma come certezza. I tuoi Condensati si fermano. Si guardano.',
      'Il Richiamante si avvicina: «C\'è una faglia che non abbiamo ancora visto. Dobbiamo andare?»',
      'Non sai perché, ma senti che la risposta giusta è già stata decisa.',
    ],
    choices: [
      {
        key: 'advance',
        label: '«Seguite il Canto.»',
        effectLabel: 'Kethran +20% pressione',
        apply: (war) => addFactionPressureDelta(war, 'Kethran', 20),
      },
      {
        key: 'wait',
        label: '«Aspettiamo.»',
        effectLabel: 'Tutti i fronti −10%',
        apply: (war) => addAllFactionsDelta(war, -10),
      },
    ],
  },
  fdh_evt_02: {
    id: 'fdh_evt_02',
    title: 'Un ordine inspiegabile',
    isAnomaly: true,
    body: [
      'Arriva un comando attraverso il Canto. Nitido. Urgente.',
      'Retrocedete dal campo conquistato. Lasciatelo.',
      'Non c\'è spiegazione. Il Canto non ne dà mai. Ma questa volta qualcosa è diverso.',
    ],
    choices: [
      {
        key: 'obey',
        label: 'Obbedite. Il Canto sa.',
        effectLabel: 'Orathai −30% (se attivo)',
        apply: (war) => addFactionPressureDelta(war, 'Orathai', -30),
      },
      {
        key: 'resist',
        label: '«Aspettiamo. Voglio capire.»',
        effectLabel: 'Nessun effetto immediato',
        apply: (w) => w,
      },
    ],
  },
};

function addFactionPressureDelta(war, faction, delta) {
  const fp = { ...(war.factionPressure || {}) };
  const cur = fp[faction] ?? 0;
  fp[faction] = Math.max(0, Math.min(100, cur + delta));
  return { ...war, factionPressure: fp };
}

function addAllFactionsDelta(war, delta) {
  const fp = { ...(war.factionPressure || {}) };
  for (const k of Object.keys(fp)) {
    fp[k] = Math.max(0, Math.min(100, (fp[k] ?? 0) + delta));
  }
  return { ...war, factionPressure: fp };
}

/**
 * Primo evento narrativo non ancora visto e con soglia missioni raggiunta.
 * @param {{ missionsCompleted?: number, narrativeSeenIds?: string[] }} meta
 */
export function getNextCampaignNarrative(meta) {
  const seen = new Set(meta.narrativeSeenIds || []);
  const n = meta.missionsCompleted || 0;
  for (const row of CAMPAIGN_NARRATIVE_ORDER) {
    if (n >= row.afterMissions && !seen.has(row.id)) {
      return CAMPAIGN_NARRATIVE_EVENTS[row.id] || null;
    }
  }
  return null;
}
