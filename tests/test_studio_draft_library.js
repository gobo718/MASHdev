/* Development-only checks for 06-07. Do not deploy as game UI or game content. */
'use strict';
const assert=require('node:assert/strict');
const lib=require('../studio-draft-library.js');
const drafts=[
 {id:'d2',type:'Blurblet',title:'Second',startedAt:'2026-10-02T10:00:00Z',lastWorkedAt:'2026-10-04T11:00:00Z',letterCount:12,totalTimeSeconds:120,reference:{kind:'non_owned',imageId:'ref-2'}},
 {id:'d1',type:'Meme',title:'First',startedAt:'2026-10-01T10:00:00Z',lastWorkedAt:'2026-10-05T11:00:00Z',letterCount:4,totalTimeSeconds:300,reference:{kind:'owned',imageId:'img-1'}},
 {id:'d3',type:'Blurblet',title:'Tie',startedAt:'2026-10-03T10:00:00Z',lastWorkedAt:'2026-10-06T11:00:00Z',letterCount:12,totalTimeSeconds:60,reference:null}
];
const ids=o=>lib.projectDrafts(drafts,o).items.map(item=>item.id);
assert.deepEqual(ids(),['d2','d1','d3']);
assert.equal(lib.projectDrafts(drafts,{view:'parade'}).view,'parade');
assert.deepEqual(ids({sortBy:'start_date',direction:'asc'}),['d1','d2','d3']);
assert.deepEqual(ids({sortBy:'last_worked',direction:'desc'}),['d3','d1','d2']);
assert.deepEqual(ids({sortBy:'letter_count',direction:'desc'}),['d2','d3','d1']);
assert.deepEqual(ids({sortBy:'total_time',direction:'asc'}),['d3','d2','d1']);
assert.equal(lib.projectDrafts(drafts).items[0].reference.display,'postit-surrogate');
assert.equal(lib.projectDrafts(drafts).items[1].reference.display,'owned-reference');
assert.equal(drafts[0].reference.display,undefined);
assert.equal(JSON.stringify(lib.projectDrafts(drafts)).includes('url'),false);
assert.equal(lib.prepareDraftAction({action:'move-to-trash',draftId:'d1',expectedRevision:'v8'}).requiresAuthenticatedServer,true);
assert.equal(lib.oneDayTrashDeadline('2026-10-28T00:00:00Z'),'2026-10-29T00:00:00.000Z');
assert.throws(()=>lib.projectDrafts([drafts[0],drafts[0]]));
assert.throws(()=>lib.projectDrafts(drafts,{sortBy:'letter_count'}));
assert.throws(()=>lib.prepareDraftAction({action:'move-to-trash',draftId:'d1'}));
console.log('Studio draft-library checks passed (15 assertions).');
