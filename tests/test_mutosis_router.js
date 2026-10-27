/* Node-backed routing and source-data tests; no browser policy assumptions. */
const fs=require('fs');
const root=fs.existsSync(__dirname+'/../lab.html')?'../':'../PATCH_ONLY/';const vm=require('vm');const assert=require('assert');
class El {
 constructor(key=''){this.key=key;this.innerHTML='';this.textContent='';this.title='';this.disabled=false;this.dataset={};this.handlers={};}
 addEventListener(event,fn){this.handlers[event]=fn;}
 setAttribute(k,v){this[k]=v;}
 append(){}
 close(){}
 showModal(){}
 getAttribute(){return ''}
}
const elements=new Map();
const elem=k=>{if(!elements.has(k))elements.set(k,new El(k));return elements.get(k)};
const document={querySelector:elem,getElementById:elem,querySelectorAll:()=>[],createElement:()=>new El()};
const context={document,location:{search:''},console,URLSearchParams,URL:{revokeObjectURL(){},createObjectURL(){return 'mock:'}},TextEncoder,DataView,Uint8Array,Promise};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-data.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-router.js','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-mock-adapters.js','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'lab-mock.js','utf8'),context);
const snap=context.__MUTOSIS_MOCK_DIAGNOSTICS__;
assert.deepEqual(JSON.parse(JSON.stringify(snap.sourceStats())),{categories:15,emoji:60,routePatterns:36});
const all=vm.runInContext('Object.values(MUTOSIS_DATA.categories).flat()',context);
const cats=vm.runInContext('Object.values(MUTOSIS_DATA.categories).map(x=>x[0])',context);
let validations=0;
for(const a of cats){for(const b of cats){
 const r=snap.previewRoute(a,b),rr=snap.previewRoute(b,a);
 assert(r.prompt&&!r.prompt.includes('[emoji_'),`${a} + ${b}: missing substitution`);
 assert.equal(r.key,rr.key,`${a} + ${b}: reversed key`);
 assert.equal(r.prompt,rr.prompt,`${a} + ${b}: reversed prompt`);
 validations++;
}}
for(const a of all)for(const b of all){
 const r=snap.previewRoute(a,b),rr=snap.previewRoute(b,a);
 assert.equal(r.key,rr.key,`reverse route mismatch ${a} / ${b}`);
 assert.equal(r.prompt,rr.prompt,`reverse prompt mismatch ${a} / ${b}`);
 validations++;
}
assert.equal(snap.previewRoute('🐱','🍕').key,'animal_food');
assert.equal(snap.previewRoute('🇯🇵','🐱').key,'flag_animal');
assert.equal(snap.previewRoute('🐱','🐱').key,'clone');
assert.equal(snap.previewRoute('🏥','🚗').key,'vehicles_transit_any');
assert.equal(snap.previewRoute('🏥','🇯🇵').key,'universal_fusion');
assert.equal(snap.snapshot().phase,'idle');
console.log('PASS source totals and',validations,'ordered/reverse-route checks, plus 6 targeted assertions');
