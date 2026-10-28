/* MASHpedition · 08-09 overlapping-progress reconciliation.
   A single player action can count for multiple authoritative qualifying tracks,
   but must count at most once per event/track pair.
   This module proposes deltas only. It does NOT infer qualifiers, grant rewards,
   set thresholds, mutate player state, or replace server-side authority. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHProgressDeltaPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  function validId(value,label){
    if(typeof value!=='string'||!value.trim())throw new TypeError(label+' must be a nonempty stable ID');
    return value;
  }
  function progressKey(eventId,trackId){
    return JSON.stringify([validId(eventId,'eventId'),validId(trackId,'trackId')]);
  }
  function planProgressDeltas({eventId,qualifiedTrackIds,alreadyAppliedKeys}={}){
    validId(eventId,'eventId');
    if(!Array.isArray(qualifiedTrackIds))throw new TypeError('qualifiedTrackIds must be server-evaluated array');
    if(!Array.isArray(alreadyAppliedKeys))throw new TypeError('alreadyAppliedKeys must come from authoritative progress');
    const applied=new Set();
    for(const key of alreadyAppliedKeys){
      if(typeof key!=='string'||!key.trim())throw new TypeError('Invalid authoritative deduplication key');
      applied.add(key);
    }
    const qualified=new Set();
    for(const trackId of qualifiedTrackIds)qualified.add(validId(trackId,'trackId'));
    const pending=[],previouslyApplied=[];
    for(const trackId of qualified){
      const dedupeKey=progressKey(eventId,trackId);
      const item={eventId,trackId,dedupeKey,delta:1};
      if(applied.has(dedupeKey))previouslyApplied.push(item);
      else pending.push(item);
    }
    // No defaults for thresholds, awards, prerequisite rules or transactional writes.
    return {eventId,pending,previouslyApplied,requiresServerTransaction:true,awardsGranted:0};
  }
  return Object.freeze({progressKey,planProgressDeltas});
});
