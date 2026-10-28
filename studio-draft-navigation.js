/* MASHpedition 06-07: navigation context for a server-verified Studio draft.
   This only preserves opaque IDs across pages. It does NOT hydrate an editor,
   authorize a draft, save data, equip preview items, or publish anything. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  if(root) root.MASHStudioDraftNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const STATIONS=Object.freeze(['chromatic-attic.html','color-cellar.html','creation-station.html','presentation-station.html']);
  const validId=value=>typeof value==='string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
  function contextFromSearch(search){
    const q=new URLSearchParams(search);
    const draft=q.getAll('draftId'),project=q.getAll('projectId');
    if(draft.length!==1 || project.length!==1 || !validId(draft[0]) || !validId(project[0]))return null;
    return Object.freeze({draftId:draft[0],projectId:project[0]});
  }
  function verifiedShape(ctx){
    if(!ctx || !validId(ctx.draftId) || !validId(ctx.projectId))throw new TypeError('Draft and project IDs are required');
  }
  function stationHref(href,ctx){
    verifiedShape(ctx);
    if(typeof href!=='string' || !href)throw new TypeError('Station path required');
    if(!STATIONS.some(station=>href===station || href.startsWith(station+'?') || href.startsWith(station+'#')))
      throw new RangeError('Expected a direct path to a Studio selection room');
    // Reject navigation to a different origin or a nested/unknown location.
    const u=new URL(href,'https://studio.invalid/');
    if(u.origin!=='https://studio.invalid' || !STATIONS.includes(u.pathname.slice(1)))
      throw new RangeError('Only existing Studio selection rooms are allowed');
    u.searchParams.set('easel','1');
    u.searchParams.set('draftId',ctx.draftId);
    u.searchParams.set('projectId',ctx.projectId);
    return u.pathname.slice(1)+u.search+u.hash;
  }
  function easelHref(ctx){
    verifiedShape(ctx);
    const q=new URLSearchParams({draftId:ctx.draftId,projectId:ctx.projectId});
    return 'easel.html?'+q.toString();
  }
  function returnHref(search){
    const ctx=contextFromSearch(search);
    return ctx?easelHref(ctx):'easel.html';
  }
  return Object.freeze({STATIONS,contextFromSearch,stationHref,easelHref,returnHref});
});
