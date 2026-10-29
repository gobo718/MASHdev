/* MASHdev · 11-03 Music Dynamics beat-volume sample processor.
   Tests authored score/PCM concepts, never generates test-game music. */
'use strict';
const assert=require('node:assert/strict');
const dynamics=require('../effects-music-dynamics.js');
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
const pcm=(rate,...channels)=>({
 sampleRate:rate,channels:channels.map(values=>Float32Array.from(values))
});
const arrays=source=>source.channels.map(channel=>[...channel]);
const original=pcm(12,Array(18).fill(1),Array(18).fill(.5));
const originalData=arrays(original);
// 120 quarter-note beats/minute at 12 Hz = six sample frames per beat.
test('explicit beat gains apply to PCM without editing either channel of the original',()=>{
 const out=dynamics.apply(original,{
   enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,.5,0]]
 });
 assert.deepEqual(arrays(out),[
  [1,1,1,1,1,1,.5,.5,.5,.5,.5,.5,0,0,0,0,0,0],
  [ .5,.5,.5,.5,.5,.5,.25,.25,.25,.25,.25,.25,0,0,0,0,0,0]
 ]);
 assert.deepEqual(arrays(original),originalData);
});
test('alternating two/three builds two measures with caller-selected strengths',()=>{
 const pattern=dynamics.alternatingTwoThree({firstGain:1,strongGain:.75,weakGain:.25});
 assert.deepEqual(pattern,[[1,.75,.25],[1,.25,.75]]);
 assert.ok(Object.isFrozen(pattern)&&pattern.every(Object.isFrozen));
});
test('alternating bar pattern applies in exact 2/3, then 3/2 order',()=>{
 // 6 beats across two bars; 1 frame per beat (60 bpm, 1 sample/sec).
 const source=pcm(1,[1,1,1,1,1,1]);
 const out=dynamics.apply(source,{
   enabled:true,bpm:60,beatsPerBar:3,
   gainsByBar:[[1,.75,.25],[1,.25,.75]]
 });
 assert.deepEqual(arrays(out),[[1,.75,.25,1,.25,.75]]);
 assert.deepEqual(arrays(source),[[1,1,1,1,1,1]]);
});
test('pattern wraps cleanly over more bars',()=>{
 const out=dynamics.apply(pcm(1,Array(9).fill(1)),{
   enabled:true,bpm:60,beatsPerBar:3,
   gainsByBar:[[1,.75,.25],[1,.25,.75]]
 });
 assert.deepEqual(arrays(out),[[1,.75,.25,1,.25,.75,1,.75,.25]]);
});
test('works with 4/4 gain patterns but never invents a fourth beat',()=>{
 const out=dynamics.apply(pcm(1,[1,1,1,1,1,1,1,1]),{
   enabled:true,bpm:60,beatsPerBar:4,gainsByBar:[[1,.5,.25,0]]
 });
 assert.deepEqual(arrays(out),[[1,.5,.25,0,1,.5,.25,0]]);
 assert.equal(out.channels[0].length,8);
});
test('OFF returns a detached sample-perfect copy with no pattern chosen',()=>{
 const off=dynamics.apply(original,{enabled:false});
 assert.deepEqual(arrays(off),originalData);
 assert.notStrictEqual(off.channels[0],original.channels[0]);
 assert.notStrictEqual(off.channels,original.channels);
});
test('OFF after ON restores exact source samples',()=>{
 dynamics.apply(original,{enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,.5,0]]});
 const off=dynamics.apply(original,{enabled:false});
 assert.deepEqual(arrays(off),originalData);
});
test('stereo channels share timing but keep independent values',()=>{
 const out=dynamics.apply(pcm(1,[1,1,1],[-1,0,.5]),{
   enabled:true,bpm:60,beatsPerBar:3,gainsByBar:[[.5,.5,0]]
 });
 assert.deepEqual(arrays(out),[[.5,.5,0],[-.5,0,0]]);
});
test('no automatic clipping and explicit gain never amplifies above source',()=>{
 const input=pcm(1,[2,-2,.3]);
 const out=dynamics.apply(input,{enabled:true,bpm:60,beatsPerBar:3,gainsByBar:[[.5,.25,1]]});
 assert.deepEqual(arrays(out),[[1,-.5,Math.fround(.3)]]);
 assert.deepEqual(arrays(input),[[2,-2,Math.fround(.3)]]);
});
test('invalid beat patterns are rejected',()=>{
 for(const options of [
  {enabled:true},
  {enabled:true,bpm:0,beatsPerBar:3,gainsByBar:[[1,1,1]]},
  {enabled:true,bpm:Infinity,beatsPerBar:3,gainsByBar:[[1,1,1]]},
  {enabled:true,bpm:120,beatsPerBar:1,gainsByBar:[[1]]},
  {enabled:true,bpm:120,beatsPerBar:2.2,gainsByBar:[[1,1]]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,1]]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,-.1,1]]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,1,1.5]]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,NaN,1]]},
  {enabled:true,bpm:120,beatsPerBar:3,gainsByBar:[[1,'1',1]]}
 ])assert.throws(()=>dynamics.apply(original,options),RangeError);
});
test('sample rate too low for requested tempo is rejected',()=>{
 assert.throws(()=>dynamics.apply(pcm(1,[1,1]),{
   enabled:true,bpm:240,beatsPerBar:3,gainsByBar:[[1,1,1]]
 }),RangeError);
});
test('nonexplicit enabled state is rejected',()=>{
 for(const options of [undefined,null,{}, {enabled:'true'},{enabled:1}])
  assert.throws(()=>dynamics.apply(original,options),TypeError);
});
test('invalid PCM channel shapes and nonfinite samples are rejected',()=>{
 for(const bad of [
  null,{}, {sampleRate:0,channels:[new Float32Array(1)]},
  {sampleRate:48000,channels:[]},
  {sampleRate:48000,channels:[[1]]},
  {sampleRate:48000,channels:[new Float32Array(0)]},
  {sampleRate:48000,channels:[new Float32Array(1),new Float32Array(2)]},
  {sampleRate:48000,channels:[new Float32Array([Infinity])]},
  {sampleRate:48000,channels:[new Float32Array([NaN])]}
 ])assert.throws(()=>dynamics.apply(bad,{enabled:false}),TypeError);
});
test('alternate helper requires explicit finite non-amplifying gains',()=>{
 for(const options of [
  undefined,{}, {firstGain:1,strongGain:.8},
  {firstGain:1,strongGain:1.2,weakGain:.5},
  {firstGain:1,strongGain:.8,weakGain:-.2},
  {firstGain:1,strongGain:'0.8',weakGain:.2},
  {firstGain:NaN,strongGain:.8,weakGain:.2}
 ])assert.throws(()=>dynamics.alternatingTwoThree(options),RangeError);
});
test('retains independent module API, never mutates input or reward state',()=>{
 assert.deepEqual(Object.keys(dynamics),['alternatingTwoThree','apply']);
 assert.ok(Object.isFrozen(dynamics));
 assert.deepEqual(arrays(original),originalData);
});
console.log('Music Dynamics: '+scenarios+' non-destructive PCM scenarios PASS');
