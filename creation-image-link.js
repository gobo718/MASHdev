/* MASHpedition 06-08 / 18-06 · MINIMAL two-record linkage planner.
   DRAFT contract, not a production schema, player-authentication mechanism,
   image fingerprint algorithm, image transfer, or saved-game implementation.
   Original private pixels stay in the player's own storage/cloud. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.MASHCreationImageLink=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const ident=value=>typeof value==='string'&&value.length>0&&value.length<=256&&value.trim()===value;
 function planCreationImageLink(original,creation){
  if(!original||!creation||typeof original!=='object'||typeof creation!=='object'||Array.isArray(original)||Array.isArray(creation))
   throw new TypeError('Two distinct server-record descriptions are required');
  const {imageId,ownerAccountId,kind,fingerprintRecordId,storageScope}=original;
  const {creationId,sourceImageId,ownerAccountId:creationOwnerId,authorAccountId,type,state}=creation;
  if(![imageId,ownerAccountId,fingerprintRecordId,creationId,sourceImageId,creationOwnerId,authorAccountId,type].every(ident))
   throw new TypeError('Missing canonical IDs, author, type or trusted fingerprint-record reference');
  if(kind!=='mutosis-original')throw new RangeError('Source must be an original Mutosis image, not an edited substitute');
  if(storageScope!=='player-managed-private')throw new RangeError('Private original must remain in player-managed storage');
  if(!['draft','final'].includes(state))throw new RangeError('Creation state must be draft or final');
  if(imageId===creationId)throw new RangeError('Image and Creation must have separate identities');
  if(sourceImageId!==imageId)throw new RangeError('Creation references another original');
  if(creationOwnerId!==ownerAccountId)throw new RangeError('Server owner records disagree');
  // No raw pixels, URL, cloud credentials, client-assigned awards, or trust claim
  // are returned. Server must validate owner/author rights and original hash.
  return Object.freeze({
   imageId,creationId,ownerAccountId,authorAccountId,creationType:type,creationState:state,
   fingerprintRecordId,requiresServerOriginalVerification:true,
   requiresServerOwnershipValidation:true,privateImageUploadRequested:false,
   grantsProgress:false,validatesFingerprint:false
  });
 }
 return Object.freeze({planCreationImageLink});
});
