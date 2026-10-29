/* MASHdev · booked music transformations, no synthetic playback/tests.
   Test the original first-beat deletion and independently reversible tempo. */
'use strict';
const assert=require('node:assert/strict');
const rhythm=require('../effects-music-rhythm.js');
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
const source={
 bpm:120,
 meter:{numerator:4,denominator:4},
 measures:[
  [[{id:'A1',pitch:60}],[{id:'B1',pitch:62}],[],[{id:'D1',pitch:65}]],
  [[{id:'A2',pitch:67}],[{id:'B2',pitch:69}],[{id:'C2',pitch:71}],[{id:'D2',pitch:72}]]
 ],
 scoreId:'a-four-beat-composition',
 provenance:{part:'unchanged original'}
};
const original=structuredClone(source);
function labels(score){
 return score.measures.map(measure=>measure.map(beat=>beat.map(note=>note.id)));
}
test('tempo shift is atomic: exact beats and metadata, only bpm changes',()=>{
 const out=rhythm.shiftTempo(source,{enabled:true,factor:.5});
 assert.equal(out.bpm,60);
 assert.equal(out.meter.numerator,4);
 assert.deepEqual(labels(out),labels(source));
 assert.deepEqual(out.provenance,source.provenance);
 assert.deepEqual(source,original);
});
test('tempo shift supports explicitly requested acceleration independently',()=>{
 const out=rhythm.shiftTempo(source,{enabled:true,factor:1.25});
 assert.equal(out.bpm,150);
 assert.deepEqual(labels(out),labels(source));
});
test('tempo OFF creates a fresh, identical non-shared score',()=>{
 const off=rhythm.shiftTempo(source,{enabled:false});
 assert.deepEqual(off,original);
 assert.notStrictEqual(off,source);
 assert.notStrictEqual(off.measures,source.measures);
 off.measures[0][0][0].pitch=99;
 assert.deepEqual(source,original);
});
test('remove FIRST beat from every bar to obtain exactly 3/4',()=>{
 const out=rhythm.removeBeat(source,{enabled:true,beatIndex:0});
 assert.equal(out.meter.numerator,3);
 assert.equal(out.meter.denominator,4);
 assert.equal(out.bpm,120);
 assert.deepEqual(labels(out),[
  [['B1'],[],['D1']],
  [['B2'],['C2'],['D2']]
 ]);
 assert.deepEqual(source,original);
});
test('generic beat removal can independently remove another explicit beat',()=>{
 const out=rhythm.removeBeat(source,{enabled:true,beatIndex:2});
 assert.deepEqual(labels(out),[
  [['A1'],['B1'],['D1']],
  [['A2'],['B2'],['D2']]
 ]);
 assert.equal(out.meter.numerator,3);
});
test('removeBeat OFF returns exact original with isolated nested objects',()=>{
 const out=rhythm.removeBeat(source,{enabled:false});
 assert.deepEqual(out,source);
 out.measures[1][0][0].pitch=-1;
 assert.deepEqual(source,original);
});
test('Crappy Waltz composes first-beat deletion with explicit slowdown',()=>{
 const out=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.75});
 assert.equal(out.bpm,90);
 assert.deepEqual(out.meter,{numerator:3,denominator:4});
 assert.deepEqual(labels(out),[[['B1'],[],['D1']],[['B2'],['C2'],['D2']]]);
 assert.equal(out.scoreId,source.scoreId);
 assert.deepEqual(source,original);
});
test('Crappy Waltz OFF is exact source, with no required speed input',()=>{
 const off=rhythm.crappyWaltz(source,{enabled:false});
 assert.deepEqual(off,original);
 assert.notStrictEqual(off.measures[0][1][0],source.measures[0][1][0]);
});
test('repeated ON from source never accumulates damage or meter changes',()=>{
 const a=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.6});
 const b=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.6});
 assert.deepEqual(a,b);
 assert.deepEqual(source,original);
 assert.equal(a.measures[1].length,3);
});
test('different slowdown factors leave same beat mapping',()=>{
 const a=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.5});
 const b=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.8});
 assert.deepEqual(labels(a),labels(b));
 assert.equal(a.bpm,60);
 assert.equal(b.bpm,96);
});
test('do not silently choose a slowdown or accept non-slowdown',()=>{
 for(const factor of [undefined,null,0,-.2,1,1.5,Infinity,NaN,'0.7'])
  assert.throws(()=>rhythm.crappyWaltz(source,{enabled:true,tempoFactor:factor}),RangeError);
});
test('Crappy Waltz rejects non-4/4 originals when ON',()=>{
 const triple=rhythm.removeBeat(source,{enabled:true,beatIndex:0});
 assert.throws(()=>rhythm.crappyWaltz(triple,{enabled:true,tempoFactor:.7}),RangeError);
 const sixth={...source,meter:{numerator:4,denominator:8}};
 assert.throws(()=>rhythm.crappyWaltz(sixth,{enabled:true,tempoFactor:.7}),RangeError);
});
test('tempo input must give a positive finite resulting bpm',()=>{
 for(const factor of [undefined,null,-1,0,Infinity,NaN,'0.5'])
  assert.throws(()=>rhythm.shiftTempo(source,{enabled:true,factor}),RangeError);
});
test('removeBeat index must be explicitly within original meter',()=>{
 for(const beatIndex of [undefined,-1,4,1.5,NaN,'0'])
  assert.throws(()=>rhythm.removeBeat(source,{enabled:true,beatIndex}),RangeError);
});
test('all three operations require explicit ON/OFF',()=>{
 for(const bad of [null,undefined,{}, {enabled:1},{enabled:'true'}]){
  assert.throws(()=>rhythm.shiftTempo(source,bad),TypeError);
  assert.throws(()=>rhythm.removeBeat(source,bad),TypeError);
  assert.throws(()=>rhythm.crappyWaltz(source,bad),TypeError);
 }
});
test('reject invalid beat-grid shape without modifying source',()=>{
 const invalid=[
  null,{}, {...source,bpm:0},{...source,bpm:Infinity},
  {...source,meter:{numerator:1,denominator:4}},
  {...source,meter:{numerator:4,denominator:3}},
  {...source,measures:[]},
  {...source,measures:[[[],[],[]]]},
  {...source,measures:[[1,2,3,4]]}
 ];
 for(const v of invalid)assert.throws(()=>rhythm.shiftTempo(v,{enabled:false}),TypeError);
 assert.deepEqual(source,original);
});
test('source remains mutable but output changes do not mutate source',()=>{
 const out=rhythm.crappyWaltz(source,{enabled:true,tempoFactor:.5});
 out.measures[0][0].push({id:'extra'});
 out.provenance.part='modified output';
 assert.deepEqual(source,original);
});
test('no extra UI, Token, or audio-route methods are exported',()=>{
 assert.deepEqual(Object.keys(rhythm),['shiftTempo','removeBeat','crappyWaltz']);
 assert.ok(Object.isFrozen(rhythm));
});
console.log('Music rhythm: '+scenarios+' independent regression scenarios PASS');
