/* MASHpedition · 06-07 Studio draft library read model.
   Source: v273 Rough Stuff (THUMBNAILS, PARADE MODE, four sort controls,
   owned reference vs non-owned Post-it, one-day Trash label).
   Read-only and source-backed: no anonymous saves, client-authoritative progress,
   image uploads, fabricated draft data, deletion, or unapproved UI layout. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.MASHStudioDraftLibrary=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const SORT_FIELDS=Object.freeze(['start_date','last_worked','letter_count','total_time']);
  const VIEWS=Object.freeze(['thumbnails','parade']);
  const SORT_PROP=Object.freeze({
    start_date:'startedAt',last_worked:'lastWorkedAt',
    letter_count:'letterCount',total_time:'totalTimeSeconds'
  });
  const DAY_MS=24*60*60*1000;
  function isIsoTime(value){
    return typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
  }
  function checkedDraft(draft){
    if(!draft||typeof draft!=='object'||Array.isArray(draft))throw new TypeError('Draft record must be an object');
    if(typeof draft.id!=='string'||!draft.id.trim())throw new TypeError('Draft identity is required');
    if(typeof draft.type!=='string'||!draft.type.trim())throw new TypeError('Creation type is required');
    if(typeof draft.title!=='string')throw new TypeError('Draft title must be text');
    if(!isIsoTime(draft.startedAt)||!isIsoTime(draft.lastWorkedAt))throw new TypeError('Draft dates require timezone-qualified ISO timestamps');
    if(Date.parse(draft.lastWorkedAt)<Date.parse(draft.startedAt))throw new RangeError('Last worked precedes start date');
    if(!Number.isSafeInteger(draft.letterCount)||draft.letterCount<0)throw new RangeError('Letter count must be a nonnegative integer');
    if(!Number.isSafeInteger(draft.totalTimeSeconds)||draft.totalTimeSeconds<0)throw new RangeError('Total time must be a nonnegative whole number of seconds');
    let reference=null;
    if(draft.reference!==null&&draft.reference!==undefined){
      if(!draft.reference||typeof draft.reference!=='object'||!['owned','non_owned'].includes(draft.reference.kind)||
         typeof draft.reference.imageId!=='string'||!draft.reference.imageId.trim())
        throw new TypeError('Image reference requires a kind and stable image ID');
      // The client receives only an image ID, not an image URL, ownership grant or file.
      reference={kind:draft.reference.kind,imageId:draft.reference.imageId,
        display: draft.reference.kind==='owned'?'owned-reference':'postit-surrogate'};
    }
    return {
      id:draft.id,type:draft.type,title:draft.title,
      startedAt:draft.startedAt,lastWorkedAt:draft.lastWorkedAt,
      letterCount:draft.letterCount,totalTimeSeconds:draft.totalTimeSeconds,
      reference
    };
  }
  function projectDrafts(records,{view='thumbnails',sortBy=null,direction=null}={}){
    if(!Array.isArray(records))throw new TypeError('Expected authoritative draft record array');
    if(!VIEWS.includes(view))throw new RangeError('Unknown Rough Stuff view');
    if(sortBy!==null&&!SORT_FIELDS.includes(sortBy))throw new RangeError('Unknown Rough Stuff sort field');
    if(sortBy===null&&direction!==null)throw new RangeError('Sort direction needs a sort field');
    if(sortBy!==null&&!['asc','desc'].includes(direction))throw new RangeError('Sort direction must be explicitly selected');
    const seen=new Set();
    const drafts=records.map((record,index)=>{
      const draft=checkedDraft(record);
      if(seen.has(draft.id))throw new RangeError('Duplicate draft identity');
      seen.add(draft.id);
      return {draft,index};
    });
    if(sortBy){
      const key=SORT_PROP[sortBy],sign=direction==='asc'?1:-1;
      drafts.sort((a,b)=>{
        const av=a.draft[key],bv=b.draft[key];
        const left=key.endsWith('At')?Date.parse(av):av;
        const right=key.endsWith('At')?Date.parse(bv):bv;
        return sign*(left-right)||a.index-b.index;
      });
    }
    return {view,sortBy,direction,items:drafts.map(x=>x.draft),total:drafts.length};
  }
  function prepareDraftAction({action,draftId,expectedRevision}={}){
    if(!['open-in-easel','move-to-trash'].includes(action))throw new RangeError('Unknown draft action');
    if(typeof draftId!=='string'||!draftId.trim())throw new TypeError('Draft identity is required');
    if(typeof expectedRevision!=='string'||!expectedRevision.trim())throw new TypeError('Authoritative record revision is required');
    // An intent for authenticated server validation, NEVER a local save/delete.
    return {action,draftId,expectedRevision,requiresAuthenticatedServer:true};
  }
  function oneDayTrashDeadline(deletedAt){
    if(!isIsoTime(deletedAt))throw new TypeError('Deletion time must be timezone-qualified ISO');
    return new Date(Date.parse(deletedAt)+DAY_MS).toISOString();
  }
  return Object.freeze({SORT_FIELDS,VIEWS,projectDrafts,prepareDraftAction,oneDayTrashDeadline});
});
