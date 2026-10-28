/* Development-only: inspection cannot equip, consume, share, or save. */
'use strict';
const assert=require('node:assert/strict');
const lib=require('../studio-item-preview.js');
const x=lib.beginPreview({draftId:'d1',projectId:'p1',expectedRevision:'v2',
 station:'presentation-station',category:'frames',itemId:'frame-01',currentlyEquippedId:'frame-00'});
assert.equal(x.mode,'inspection-only');
assert.equal(x.equipped,false);
assert.equal(x.consumed,false);
assert.equal(x.shared,false);
const cancelled=lib.endPreview(x,'cancel');
assert.deepEqual(cancelled,{status:'unchanged',currentlyEquippedId:'frame-00',saved:false});
const requested=lib.endPreview(x,'apply');
assert.equal(requested.action,'apply-studio-selection');
assert.equal(requested.status,'requires-authoritative-validation');
assert.equal(requested.saved,false);
assert.equal(requested.previouslyEquippedId,'frame-00');
assert.equal(requested.itemId,'frame-01');
assert.equal(x.currentlyEquippedId,'frame-00');
const font=lib.beginPreview({draftId:'d',projectId:'p',expectedRevision:'v',
 station:'creation-station',category:'fonts',itemId:'font-1'});
assert.equal(font.currentlyEquippedId,null);
assert.throws(()=>lib.endPreview(font,'auto'));
assert.throws(()=>lib.beginPreview({draftId:'d',projectId:'p',expectedRevision:'v',
 station:'creation-station',category:'frames',itemId:'x'}));
assert.throws(()=>lib.beginPreview({draftId:'d',projectId:'p',expectedRevision:'v',
 station:'presentation-station',category:'finishes',itemId:''}));
console.log('Studio item preview checks passed.');
