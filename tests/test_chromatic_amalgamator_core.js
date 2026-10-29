/* Existing Chromatic Amalgamator first-tier RGB source contract.
   Checks booked additive results and pigment milestone without game fixtures. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const paint=require('../paint-mixer-core.js');
const engine=require('../chromatic-amalgamator-core.js');
const completed=paint.firstTierKeys();
const two=(a,b)=>[{chromalucent:a,units:1},{chromalucent:b,units:1}];
const available=['BLUE','RED','GREEN'];
let scenarios=0;
const check=(title,fn)=>{fn();scenarios++};
check('booked introduction order is BLUE then RED then GREEN',()=>{
 assert.deepEqual(engine.INTRODUCTION_ORDER,['BLUE','RED','GREEN']);
 assert.deepEqual(engine.BOOKED_OUTPUTS,['YELLOW','CYAN','MAGENTA']);
 assert.equal(Object.keys(engine.FIRST_TIER).length,3);
 assert.ok(Object.isFrozen(engine.FIRST_TIER));
});
check('exactly ten distinct two-pigment mixes allow machine',()=>{
 assert.equal(completed.length,10);
 assert.equal(engine.eligibleAfterPigmentMixes(completed),true);
 assert.equal(engine.eligibleAfterPigmentMixes([...completed,...completed]),true);
 for(const key of completed){
  assert.equal(engine.eligibleAfterPigmentMixes(completed.filter(x=>x!==key)),false);
 }
});
check('an invented or duplicate pigment action does not satisfy the tenth recipe',()=>{
 const nine=completed.slice(0,9);
 assert.equal(engine.eligibleAfterPigmentMixes([...nine,nine[0]]),false);
 assert.equal(engine.eligibleAfterPigmentMixes([...nine,'FAKE+PAINT']),false);
 assert.equal(engine.eligibleAfterPigmentMixes(null),false);
});
for(const [a,b,result] of [
 ['RED','GREEN','YELLOW'],['GREEN','BLUE','CYAN'],['BLUE','RED','MAGENTA']
]){
 for(const [left,right] of [[a,b],[b,a]]){
  check(left+' + '+right+' yields booked additive result '+result,()=>{
   const proposal=engine.planMix({inputs:two(left,right),
    completedPigmentPairKeys:completed,availableChromalucents:available});
   assert.equal(proposal.status,'recipe-match');
   assert.equal(proposal.result,result);
   assert.equal(proposal.resultKind,'chromalucent');
   assert.equal(proposal.awardsGranted,0);
   assert.equal(proposal.requiresAuthenticatedServer,true);
  });
 }
}
check('one missing two-pigment recipe means no Chromalucent mix',()=>{
 const proposal=engine.planMix({inputs:two('RED','GREEN'),
  completedPigmentPairKeys:completed.slice(0,9),availableChromalucents:available});
 assert.equal(proposal.status,'machine-locked');
 assert.equal(proposal.awardsGranted,0);
});
check('a missing RED or BLUE input cannot be implicitly owned',()=>{
 for(const owned of [['BLUE'],['GREEN'],['RED','YELLOW'],[],null]){
  const proposal=engine.planMix({inputs:two('RED','GREEN'),
   completedPigmentPairKeys:completed,availableChromalucents:owned});
  assert.equal(proposal.status,'inputs-unavailable');
  assert.equal(proposal.awardsGranted,0);
 }
});
check('only two DIFFERENT RGB sources, exactly one WHOLE unit each',()=>{
 const invalid=[
  [],[two('RED','GREEN')[0]], [...two('RED','RED')],
  [{chromalucent:'RED',units:2},{chromalucent:'GREEN',units:1}],
  [{chromalucent:'RED',units:0.5},{chromalucent:'GREEN',units:1}],
  [{chromalucent:'RED',units:1},{chromalucent:'YELLOW',units:1}],
  [{chromalucent:'RED',units:1},{chromalucent:'CYAN',units:1}],
  [{chromalucent:'RED',units:1},{chromalucent:'BLUE',units:1},{chromalucent:'GREEN',units:1}],
  [{chromalucent:'RED',units:'1'},{chromalucent:'GREEN',units:1}]
 ];
 for(const inputs of invalid){
  assert.equal(engine.normalizeInputs(inputs),null);
  const result=engine.planMix({inputs,completedPigmentPairKeys:completed,
   availableChromalucents:available});
  assert.equal(result.status,'invalid-inputs');
 }
});
check('White is not an invented output of first-tier RGB mixing',()=>{
 for(const x of Object.values(engine.FIRST_TIER))assert.notEqual(x,'WHITE');
 assert.equal(engine.normalizeInputs(two('CYAN','MAGENTA')),null);
 assert.equal(engine.planMix({inputs:two('CYAN','MAGENTA'),
  completedPigmentPairKeys:completed,availableChromalucents:available}).status,'invalid-inputs');
});
check('no server-owned awards or image/paint storage methods exist',()=>{
 assert.deepEqual(Object.keys(engine),[
  'INTRODUCTION_ORDER','FIRST_TIER','BOOKED_OUTPUTS',
  'eligibleAfterPigmentMixes','normalizeInputs','planMix'
 ]);
 assert.ok(Object.isFrozen(engine));
});
check('RGB sources and CMY products are present in accepted Attic colors',()=>{
 const attic=fs.readFileSync(path.join(__dirname,'..','chromatic-attic.js'),'utf8');
 assert.equal(typeof attic,'string');
 const accepted=['RED','GREEN','BLUE','CYAN','MAGENTA','YELLOW'];
 for(const name of accepted)assert.ok(attic.includes("['"+name+"',"),name);
 // Attic DISPLAY order (RGB) is separate from earned INTRODUCTION order (BRG).
 assert.ok(attic.indexOf("['RED',")<attic.indexOf("['GREEN',"));
 assert.ok(attic.indexOf("['GREEN',")<attic.indexOf("['BLUE',"));
});
console.log('Chromatic Amalgamator first RGB tier: '+scenarios+' source-backed scenarios PASS');
