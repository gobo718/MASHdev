/* MASHdev · 11-03 · test the real standalone Bitcrush PCM implementation.
   No test room, generated music, playback or assumed in-game audio bus. */
'use strict';
const assert=require('node:assert/strict');
const {bitcrush}=require('../effects-bitcrush.js');
let checks=0;
const test=(label,fn)=>{fn();checks++};
const pcm=(sampleRate,...arrays)=>({sampleRate,channels:arrays.map(x=>Float32Array.from(x))});
const values=x=>x.channels.map(c=>[...c]);
const original=pcm(48000,[.1,.8,-.3,-.8,1],[-1,0,.75,.1,-.9]);
const saved=values(original);

test('Bitcrush ON applies two-bit quantization plus shared two-sample hold frames',()=>{
 const out=bitcrush(original,{enabled:true,bitDepth:2,holdSamples:2});
 assert.equal(out.sampleRate,48000);
 assert.deepEqual(values(out),[[0,0,-.5,-.5,.5],[-1,-1,.5,.5,-1]]);
 assert.deepEqual(values(original),saved);
});
test('full positive scale saturates at maximum signed PCM quantization level',()=>{
 const out=bitcrush(pcm(44100,[1,-1,0]),{enabled:true,bitDepth:2,holdSamples:1});
 assert.deepEqual(values(out),[[.5,-1,0]]);
});
test('three-bit quantization retains signed steps without sample holding',()=>{
 const out=bitcrush(pcm(32000,[-1,-.8,-.5,-.1,0,.1,.5,.9]),
   {enabled:true,bitDepth:3,holdSamples:1});
 assert.deepEqual(values(out),[[-1,-.75,-.5,0,0,0,.5,.75]]);
});
test('holdSamples independently changes time detail without cross-channel mixing',()=>{
 const source=pcm(22050,[0,.5,1,-1],[-1,-.5,0,.5]);
 const held=bitcrush(source,{enabled:true,bitDepth:4,holdSamples:3});
 assert.deepEqual(values(held),[[0,0,0,-1],[-1,-1,-1,.5]]);
 assert.deepEqual(values(source),[[0,.5,1,-1],[-1,-.5,0,.5]]);
});
test('OFF is an exact new copy even without intensity parameters',()=>{
 const out=bitcrush(original,{enabled:false});
 assert.deepEqual(values(out),saved);
 assert.notStrictEqual(out.channels,original.channels);
 assert.notStrictEqual(out.channels[0],original.channels[0]);
 assert.notStrictEqual(out.channels[1],original.channels[1]);
});
test('switching ON then OFF from the same untouched source restores every PCM sample',()=>{
 bitcrush(original,{enabled:true,bitDepth:2,holdSamples:3});
 const off=bitcrush(original,{enabled:false});
 assert.deepEqual(values(off),saved);
 assert.deepEqual(values(original),saved);
});
test('silent signal stays silent and preserves channel count',()=>{
 const out=bitcrush(pcm(48000,[0,0,0],[0,0,0]),{enabled:true,bitDepth:1,holdSamples:2});
 assert.deepEqual(values(out),[[0,0,0],[0,0,0]]);
});
test('short final sample block is safely filled',()=>{
 const out=bitcrush(pcm(48000,[.5,-.5,0,.25,-1]),{enabled:true,bitDepth:2,holdSamples:3});
 assert.deepEqual(values(out),[[.5,.5,.5,.5,.5]]);
});
test('PCM beyond nominal full scale is clipped only in the transformed output',()=>{
 const source=pcm(48000,[2,-3,.25]);
 const out=bitcrush(source,{enabled:true,bitDepth:2,holdSamples:1});
 assert.deepEqual(values(out),[[.5,-1,.5]]);
 assert.deepEqual(values(source),[[2,-3,.25]]);
 assert.deepEqual(values(bitcrush(source,{enabled:false})),[[2,-3,.25]]);
});
test('numeric parameters are always explicit when ON',()=>{
 for(const bad of [
   {enabled:true},{enabled:true,bitDepth:2},{enabled:true,holdSamples:2},
   {enabled:true,bitDepth:0,holdSamples:2},
   {enabled:true,bitDepth:25,holdSamples:2},
   {enabled:true,bitDepth:1.5,holdSamples:2},
   {enabled:true,bitDepth:8,holdSamples:0},
   {enabled:true,bitDepth:8,holdSamples:1.1},
   {enabled:true,bitDepth:8,holdSamples:Infinity},
   {enabled:true,bitDepth:'8',holdSamples:2}
 ])assert.throws(()=>bitcrush(original,bad),RangeError);
});
test('must explicitly choose ON or OFF',()=>{
 for(const opt of [undefined,null,{}, {enabled:1},{enabled:'on'}])
   assert.throws(()=>bitcrush(original,opt),TypeError);
});
test('invalid channel counts, lengths and sample rates are rejected',()=>{
 for(const bad of [
   null,{}, {sampleRate:0,channels:[new Float32Array([0])]},
   {sampleRate:48000,channels:[]},
   {sampleRate:48000,channels:[[.5]]},
   {sampleRate:48000,channels:[new Float32Array(0)]},
   {sampleRate:48000,channels:[new Float32Array(1),new Float32Array(2)]},
   {sampleRate:48000.25,channels:[new Float32Array(1)]},
   {sampleRate:Infinity,channels:[new Float32Array(1)]}
 ])assert.throws(()=>bitcrush(bad,{enabled:true,bitDepth:4,holdSamples:2}),TypeError);
});
test('NaN and infinities in the original samples are rejected',()=>{
 for(const sample of [NaN,Infinity,-Infinity]){
   assert.throws(()=>bitcrush(pcm(48000,[sample]),{enabled:false}),TypeError);
 }
});
test('output is independent for channels, metadata fixed, with no image-effect exports',()=>{
 const out=bitcrush(original,{enabled:true,bitDepth:8,holdSamples:1});
 assert.ok(Object.isFrozen(out));
 assert.ok(Object.isFrozen(out.channels));
 assert.equal(out.channels.length,2);
 assert.deepEqual(Object.keys(require('../effects-bitcrush.js')),['bitcrush']);
 out.channels[0][0]=.375;
 assert.deepEqual(values(original),saved);
});
console.log('Bitcrush: '+checks+' independent PCM regression scenarios PASS');
