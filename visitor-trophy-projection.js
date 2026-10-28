/* MASHpedition Trophy Room, visitor projection (CN-00265/CN-02042).
   Read-only calculation. Does not create rooms, change earned trophies, award
   items, define Token exceptions or reveal deepest matched depth in player UI.
   Each supplied order is already the visitor's authoritative earned order for
   one authored trophy track. Physical locations remain separately authored. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MASHVisitorTrophyProjection = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  function normalizeIds(value, label) {
    if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !id.trim()))
      throw new TypeError(label + ' must be an ordered array of nonempty identity strings');
    if (new Set(value).size !== value.length)
      throw new TypeError(label + ' must not contain duplicate trophy identities');
    return [...value];
  }
  function projectVisit({ visitorEarnedInOrder, residentEarnedIds } = {}) {
    const visitor = normalizeIds(visitorEarnedInOrder, 'visitorEarnedInOrder');
    const resident = new Set(normalizeIds(residentEarnedIds, 'residentEarnedIds'));
    let prefixStillReachable = true;
    const slots = visitor.map((trophyId, visitorOrderIndex) => {
      const shared = resident.has(trophyId);
      const reachable = prefixStillReachable && shared;
      if (!shared) prefixStillReachable = false;
      return { trophyId, visitorOrderIndex, presentation: shared ? 'shared-trophy' : 'shadow', reachable };
    });
    // Internal navigation state; must NOT be displayed as a pre-visit depth hint.
    const reachablePrefix = slots.filter(slot => slot.reachable).length;
    return { slots, reachablePrefix, presentationIsVisitorSpecific: true };
  }
  function canReceiveVisitorOnlyReward({ visitingOtherResidence, universalLocationId, authoredRewardsByLocation, alreadyReceivedIds } = {}) {
    if (!visitingOtherResidence) return { eligible: false, reason: 'not_visiting' };
    if (typeof universalLocationId !== 'string' || !universalLocationId.trim()) return { eligible: false, reason: 'no_authored_location' };
    if (!authoredRewardsByLocation || !Object.hasOwn(authoredRewardsByLocation, universalLocationId)) return { eligible: false, reason: 'no_booked_reward_at_location' };
    const rewardId = authoredRewardsByLocation[universalLocationId];
    if (typeof rewardId !== 'string' || !rewardId.trim()) return { eligible: false, reason: 'not_defined' };
    if (!Array.isArray(alreadyReceivedIds)) throw new TypeError('alreadyReceivedIds must come from authoritative player progress');
    if (alreadyReceivedIds.includes(rewardId)) return { eligible: false, reason: 'already_awarded' };
    // Eligibility is only a request for server validation, NOT an award or mutation.
    return { eligible: true, rewardId, requiresServerValidation: true };
  }
  return Object.freeze({projectVisit, canReceiveVisitorOnlyReward});
});
