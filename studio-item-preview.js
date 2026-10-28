/* MASHpedition 06-07: item inspection cannot silently equip a Functo.
   This is an intention contract only. A real editor/authoritative server must
   load the project and validate any requested selection. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.MASHStudioItemPreview=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const CATEGORIES=Object.freeze({
  'creation-station':Object.freeze(['fonts','text-effects','palettes']),
  'presentation-station':Object.freeze(['canvases','frames','finishes'])
 });
 const id=value=>typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=128;
 function beginPreview({draftId,projectId,expectedRevision,station,category,itemId,currentlyEquippedId=null}={}){
  if(![draftId,projectId,expectedRevision,itemId].every(id))throw new TypeError('Stable project, draft, revision and candidate IDs required');
  if(!Object.hasOwn(CATEGORIES,station)||!CATEGORIES[station].includes(category))throw new RangeError('Unknown Studio preview category');
  if(currentlyEquippedId!==null&&!id(currentlyEquippedId))throw new TypeError('Equipped item ID must be stable or null');
  return Object.freeze({
   draftId,projectId,expectedRevision,station,category,itemId,
   currentlyEquippedId,mode:'inspection-only',equipped:false,consumed:false,shared:false
  });
 }
 function endPreview(preview,decision){
  if(!preview||preview.mode!=='inspection-only'||!Object.isFrozen(preview))throw new TypeError('Expected an active preview');
  if(decision==='cancel')
   return Object.freeze({status:'unchanged',currentlyEquippedId:preview.currentlyEquippedId,saved:false});
  if(decision!=='apply')throw new RangeError('Only explicit apply or cancel is permitted');
  // APPLY is a validated request, NOT proof of equipped state or saved progress.
  return Object.freeze({
   status:'requires-authoritative-validation',action:'apply-studio-selection',
   draftId:preview.draftId,projectId:preview.projectId,
   expectedRevision:preview.expectedRevision,station:preview.station,
   category:preview.category,itemId:preview.itemId,
   previouslyEquippedId:preview.currentlyEquippedId,saved:false
  });
 }
 return Object.freeze({CATEGORIES,beginPreview,endPreview});
});
