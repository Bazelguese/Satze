// Scelta di un bersaglio sul tavolo (carta o Campo) per le abilità delle Eminenze:
// dallo schema dei parametri dice che cosa si clicca e quale eventuale opzione segue.

const CARD_KEYS = ['preyCardId', 'cardId', 'fragmentCardId'];
const SLOT_KEY = 'slot';
const LIMITS_KEY = '__limits';
/** Chiavi che la scelta sul tavolo non gestisce (la composizione di due Frammenti resta nel menù). */
const UNSUPPORTED_KEYS = ['composeComponent'];

const OPTION_LABELS = {
  leagueDelta: { 1: '+1 Lega', '-1': '−1 Lega' },
  graftInto: { power: 'Al posto del Potere', bonus: 'Al posto del Bonus' },
};

/** Parole per il segno sul bersaglio scelto e per la guida sotto il portale. */
const COPY = {
  preyCardId: { mark: 'Preda', guide: 'Scegli la Preda' },
  cardId: { mark: 'Scelto', guide: 'Scegli un Agente' },
  fragmentCardId: { mark: 'Frammento', guide: 'Scegli un Frammento' },
  slot: { mark: 'Scelto', guide: 'Scegli un Campo' },
};

function enumKeys(schema) {
  return Object.keys(schema || {}).filter((key) => Array.isArray(schema[key]) && schema[key].length > 0);
}

/**
 * @param {object|null} schema schema dei parametri già risolto (valori legali in elenco)
 * @returns {null|{ targetKey: string, targetType: 'card'|'slot', values: Array, mark: string, guide: string,
 *   optionKey: string|null, options: Array<{ value: any, label: string }> }}
 */
export function resolveTargetRequest(schema) {
  const keys = enumKeys(schema);
  if (!keys.length || keys.some((key) => UNSUPPORTED_KEYS.includes(key))) return null;
  // più bersagli insieme (es. due Frammenti da comporre) non si scelgono con un clic solo
  if (Object.values(schema?.[LIMITS_KEY] || {}).some((limit) => (limit?.max ?? 1) > 1)) return null;
  const targetKey = CARD_KEYS.find((key) => keys.includes(key)) || (keys.includes(SLOT_KEY) ? SLOT_KEY : null);
  if (!targetKey) return null;
  const rest = keys.filter((key) => key !== targetKey);
  // al più un'opzione dopo il bersaglio (es. ±1 Lega); più di una resta al menù
  if (rest.length > 1 || rest.some((key) => CARD_KEYS.includes(key) || key === SLOT_KEY)) return null;
  const optionKey = rest[0] || null;
  return {
    targetKey,
    targetType: targetKey === SLOT_KEY ? 'slot' : 'card',
    values: [...schema[targetKey]],
    mark: COPY[targetKey].mark,
    guide: COPY[targetKey].guide,
    optionKey,
    options: optionKey
      ? schema[optionKey].map((value) => ({ value, label: OPTION_LABELS[optionKey]?.[value] ?? String(value) }))
      : [],
  };
}

/** Parametri da inviare al motore per un bersaglio (e l'eventuale opzione) scelti. */
export function targetParams(request, value, optionValue = null) {
  const params = { [request.targetKey]: value };
  if (request.optionKey) params[request.optionKey] = optionValue;
  return params;
}

/** Selettore DOM del bersaglio: carta in mano o Campo nella lista. */
export function targetSelector(request, value) {
  return request.targetType === 'slot' ? `[data-field-slot="${value}"]` : `[data-hand-agent="${value}"]`;
}
