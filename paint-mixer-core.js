/* MASHpedition · Paint Mixer, first booked mixing tier (AUD-00004).
   Pure game logic; no mock UI, invented resulting colors, or persistence. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MASHPaintMixerCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  const FIRST_PRIMARIES = Object.freeze(['BLACK', 'BLUE', 'RED', 'YELLOW', 'WHITE']);
  const ORDER = new Map(FIRST_PRIMARIES.map((name, index) => [name, index]));
  const allPrimaryUnlocked = owned =>
    Array.isArray(owned) && FIRST_PRIMARIES.every(primary => owned.includes(primary));
  const firstTierKeys = () => {
    const keys = [];
    for (let i = 0; i < FIRST_PRIMARIES.length; i++)
      for (let j = i + 1; j < FIRST_PRIMARIES.length; j++)
        keys.push(FIRST_PRIMARIES[i] + '+' + FIRST_PRIMARIES[j]);
    return keys;
  };
  function normalizeFirstTier(inputs) {
    if (!Array.isArray(inputs) || inputs.length !== 2) return null;
    const seen = new Set(), names = [];
    for (const entry of inputs) {
      if (!entry || typeof entry !== 'object') return null;
      const name = entry.primary;
      if (!ORDER.has(name) || seen.has(name) || entry.units !== 1) return null;
      seen.add(name);
      names.push(name);
    }
    return names.sort((a, b) => ORDER.get(a) - ORDER.get(b)).join('+');
  }
  function firstTierMix({ inputs, unlockedPrimaries, recipeOutputs = {} } = {}) {
    if (!allPrimaryUnlocked(unlockedPrimaries))
      return {status: 'locked', reason: 'Paint Mixer opens after White, the fifth primary'};
    const key = normalizeFirstTier(inputs);
    if (!key) return {status: 'invalid_inputs', reason: 'First tier requires two different primary paints, one whole unit each'};
    const value = recipeOutputs && Object.hasOwn(recipeOutputs, key) ? recipeOutputs[key] : null;
    if (typeof value !== 'string' || !value.trim())
      return {status: 'recipe_unmapped', recipeKey: key, reason: 'Exact resulting color has not been sourced; no reward granted'};
    return {status: 'resolved', recipeKey: key, outputColorId: value};
  }
  return Object.freeze({FIRST_PRIMARIES, allPrimaryUnlocked, firstTierKeys, normalizeFirstTier, firstTierMix});
});
