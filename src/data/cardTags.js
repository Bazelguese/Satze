// ============================================
// Compatibilità: Sistema Tag Agenti v2 → Archetipi v3.3
// Usare preferibilmente src/data/cardArchetypes.js
// ============================================

export {
  ARCHETYPES,
  FOCUS_RELATIONS,
  FOCUS_RELATIONS as PROFILES,
  ARCHETYPE_SET,
  FOCUS_RELATION_SET,
  FOCUS_RELATION_SET as PROFILE_SET,
  FOCUS_VISIBLE_ARCHETYPES,
  ARCHETYPE_DESCRIPTIONS,
  FOCUS_DESCRIPTIONS,
  FOCUS_DESCRIPTIONS as PROFILE_DESCRIPTIONS,
  SCALANTE_DESCRIPTION,
  LABEL_TOOLTIPS,
  LABEL_TOOLTIPS as TAG_TOOLTIPS,
  ARCHETYPE_SET as RUOLO_TAGS,
  getArchetype,
  getEconomy,
  getFocusRelation,
  getSecondaryArchetype,
  isScaling,
  getCardClassification,
  getCardClassificationById,
  getCardDisplayLabels,
  getCardLabels,
  getCardLabels as getCardTags,
  getProfile,
  shouldShowFocusBadge,
  isArchetypeLabel,
  isArchetypeLabel as isRuoloTag,
  isFocusLabel,
  isFocusLabel as isProfileLabel,
  shouldShowAsArchetype,
  shouldShowAsArchetype as shouldShowTagAsRole,
} from './cardArchetypes.js';
