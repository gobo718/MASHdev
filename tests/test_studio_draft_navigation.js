/* Development-only tests. Never stage as game features. */
'use strict';
const assert=require('node:assert/strict');
const nav=require('../studio-draft-navigation.js');
const ctx=Object.freeze({draftId:'draft:8',projectId:'project.2'});
const start=nav.easelHref(ctx);
assert.equal(start,'easel.html?draftId=draft%3A8&projectId=project.2');
const fromEasel=nav.contextFromSearch('?'+start.split('?')[1]);
assert.deepEqual(fromEasel,ctx);
for(const station of nav.STATIONS){
 const url=nav.stationHref(station+'?view=palettes',fromEasel);
 assert.equal(new URLSearchParams(url.split('?')[1]).get('view'),'palettes');
 assert.equal(new URLSearchParams(url.split('?')[1]).get('easel'),'1');
 assert.equal(nav.returnHref('?'+url.split('?')[1]),start);
}
assert.equal(nav.returnHref('?easel=1'),'easel.html');
assert.equal(nav.contextFromSearch('?draftId=x'),null);
assert.equal(nav.contextFromSearch('?draftId=x&projectId=y&draftId=z'),null);
assert.equal(nav.contextFromSearch('?draftId=%3Cscript%3E&projectId=x'),null);
assert.throws(()=>nav.stationHref('https://evil.example/creation-station.html',ctx));
assert.throws(()=>nav.stationHref('../creation-station.html',ctx));
assert.throws(()=>nav.stationHref('museum.html',ctx));
assert.throws(()=>nav.stationHref('creation-station.html',{draftId:'bad id',projectId:'x'}));
assert.equal(nav.stationHref('creation-station.html?easel=0',ctx).includes('easel=1'),true);
console.log('Studio draft-navigation checks passed.');
