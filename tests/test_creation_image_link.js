/* Development-only 06-08 mapping checks. No external art used. */
'use strict';
const assert=require('node:assert/strict');
const {planCreationImageLink}=require('../creation-image-link.js');
const original={imageId:'placeholder-image-id',ownerAccountId:'owner-1',
 kind:'mutosis-original',fingerprintRecordId:'server-fingerprint-ref',
 storageScope:'player-managed-private'};
const creation={creationId:'placeholder-creation-id',sourceImageId:'placeholder-image-id',
 ownerAccountId:'owner-1',authorAccountId:'author-1',type:'Blurblet',state:'draft'};
const result=planCreationImageLink(original,creation);
assert.equal(result.imageId,creation.sourceImageId);
assert.notEqual(result.imageId,result.creationId);
assert.equal(result.creationType,'Blurblet');
assert.equal(result.requiresServerOriginalVerification,true);
assert.equal(result.requiresServerOwnershipValidation,true);
assert.equal(result.privateImageUploadRequested,false);
assert.equal(result.grantsProgress,false);
assert.equal(result.validatesFingerprint,false);
assert.equal(result.creationState,'draft');
assert.equal(Object.keys(result).some(key=>/pixels|bytes|url|token|cloud/i.test(key)),false);
assert.throws(()=>planCreationImageLink(original,{...creation,ownerAccountId:'other-owner'}));
assert.throws(()=>planCreationImageLink({...original,kind:'edited-image'},creation));
assert.throws(()=>planCreationImageLink({...original,storageScope:'game-server'},creation));
assert.throws(()=>planCreationImageLink(original,{...creation,sourceImageId:'wrong'}));
assert.throws(()=>planCreationImageLink(original,{...creation,creationId:original.imageId}));
assert.throws(()=>planCreationImageLink(original,{...creation,state:'published-without-review'}));
assert.deepEqual(planCreationImageLink(original,creation),result);
console.log('Creation/image identity contract checks passed.');
