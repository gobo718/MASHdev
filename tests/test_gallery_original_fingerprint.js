/* MASHdev · 18-07/18-09 · actual SHA-256 private-original pixels.
   Does not save, import, sync, upload, share or accept a gallery image.
   These are isolated unit tests of the cryptographic comparison primitive,
   never a mock game gallery or fabricated account test. */
'use strict';
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const api=require('../gallery-original-fingerprint.js');
const subtle=webcrypto.subtle;
let passed=0;
async function test(label,run){await run();passed++}
const pixels=(width,height,values)=>({
  width,height,data:Uint8ClampedArray.from(values)
});
const original=pixels(2,2,[
  255,17,33,255, 0,255,47,180,
  10,20,30,0,   99,5,199,255
]);
const saved=Array.from(original.data);
const options={subtle};
// Independently compute the published canonical byte sequence using Node
// createHash and Buffer, not the module's encoder or WebCrypto.
function independent(image){
 const dims=Buffer.alloc(8);
 dims.writeUInt32LE(image.width,0);dims.writeUInt32LE(image.height,4);
 return createHash('sha256')
   .update(Buffer.from('MASHPEDITION/RGBA/V1\0','ascii'))
   .update(dims).update(Buffer.from(image.data)).digest('hex');
}
(async()=>{
 await test('frozen exported primitive and versioned algorithm',async()=>{
  assert.deepEqual(Object.keys(api),['FORMAT','fingerprint','matchesExpected']);
  assert.ok(Object.isFrozen(api));
  assert.equal(api.FORMAT,'mashpedition.rgba-sha256.v1');
 });
 const trusted=await api.fingerprint(original,options);
 await test('uses actual SHA-256 over independent canonical RGBA vector',async()=>{
  assert.equal(trusted.sha256,independent(original));
  assert.equal(trusted.width,2);assert.equal(trusted.height,2);
  assert.equal(trusted.format,api.FORMAT);
  assert.ok(Object.isFrozen(trusted));
  assert.match(trusted.sha256,/^[0-9a-f]{64}$/);
 });
 await test('exact same pixel buffer is accepted, no pixel copy emitted',async()=>{
  assert.equal(await api.matchesExpected(original,trusted,options),true);
  assert.deepEqual(Object.keys(trusted),['format','width','height','sha256']);
 });
 await test('fresh typed array with identical content is accepted',async()=>{
  const copy=pixels(2,2,saved);
  assert.equal(await api.matchesExpected(copy,trusted,options),true);
  assert.notStrictEqual(copy.data,original.data);
 });
 await test('one red channel changed: rejected',async()=>{
  const changed=pixels(2,2,saved);
  changed.data[0]--;
  assert.equal(await api.matchesExpected(changed,trusted,options),false);
 });
 await test('one blue channel changed: rejected',async()=>{
  const changed=pixels(2,2,saved);
  changed.data[6]++;
  assert.equal(await api.matchesExpected(changed,trusted,options),false);
 });
 await test('alpha-only change: rejected',async()=>{
  const changed=pixels(2,2,saved);
  changed.data[7]--;
  assert.equal(await api.matchesExpected(changed,trusted,options),false);
 });
 await test('hidden RGB under fully transparent alpha is still protected',async()=>{
  const changed=pixels(2,2,saved);
  changed.data[8]++;
  assert.equal(changed.data[11],0);
  assert.equal(await api.matchesExpected(changed,trusted,options),false);
 });
 await test('swapping dimensions without changing RGBA bytes: rejected',async()=>{
  const reshaped=pixels(1,4,saved);
  assert.equal(await api.matchesExpected(reshaped,trusted,options),false);
  const result=await api.fingerprint(reshaped,options);
  assert.notEqual(result.sha256,trusted.sha256);
  assert.equal(result.sha256,independent(reshaped));
 });
 await test('byte reordering: rejected',async()=>{
  const reordered=pixels(2,2,[...saved.slice(4,8),...saved.slice(0,4),...saved.slice(8)]);
  assert.equal(await api.matchesExpected(reordered,trusted,options),false);
 });
 await test('an otherwise matching altered trusted hash: rejected',async()=>{
  const changed={...trusted,sha256:'0'+trusted.sha256.slice(1)};
  if(changed.sha256===trusted.sha256)changed.sha256='1'+trusted.sha256.slice(1);
  assert.equal(await api.matchesExpected(original,changed,options),false);
 });
 await test('wrong format or malformed server expectation is never silently accepted',async()=>{
  for(const expected of [
    null,undefined,{...trusted,format:'older-format'}, {...trusted,sha256:'bad'},
    {...trusted,sha256:trusted.sha256.toUpperCase()}, {...trusted,width:0},
    {...trusted,width:'2'}, {...trusted,height:NaN}, {sha256:trusted.sha256}
  ])await assert.rejects(api.matchesExpected(original,expected,options),TypeError);
 });
 await test('input validation rejects non-RGBA buffers and malformed dimensions',async()=>{
  for(const image of [
    null,{}, {width:2,height:2,data:Uint8Array.from(saved)},
    {width:2,height:2,data:[...saved]},
    pixels(3,3,saved),pixels(2,3,saved),pixels(0,0,[]),
    {width:1.5,height:4,data:Uint8ClampedArray.from(saved)},
    {width:Infinity,height:1,data:Uint8ClampedArray.from(saved)},
    {width:4294967296,height:1,data:Uint8ClampedArray.from(saved)}
  ])await assert.rejects(api.fingerprint(image,options));
 });
 await test('large forged dimensions rejected before large allocations',async()=>{
  await assert.rejects(api.fingerprint({width:100000,height:100000,
    data:new Uint8ClampedArray(16)},options),RangeError);
 });
 await test('source remains byte-exact before and after hashing',async()=>{
  await api.fingerprint(original,options);
  assert.deepEqual([...original.data],saved);
 });
 await test('input is snapshotted before an asynchronous digest finishes',async()=>{
  const image=pixels(2,2,saved);
  let seen=null;
  const delayed={digest:async(alg,buffer)=>{
    seen=new Uint8Array(buffer).slice();
    await Promise.resolve();
    return subtle.digest(alg,buffer);
  }};
  const pending=api.fingerprint(image,{subtle:delayed});
  image.data.fill(0);
  const response=await pending;
  assert.ok(seen instanceof Uint8Array);
  assert.equal(response.sha256,trusted.sha256);
 });
 await test('missing cryptographic provider fails closed',async()=>{
  await assert.rejects(api.fingerprint(original,{subtle:{}}),
    /SHA-256 Web Crypto unavailable/);
 });
 await test('provider errors fail closed rather than claiming integrity',async()=>{
  await assert.rejects(api.fingerprint(original,{subtle:{
    digest(){return Promise.reject(new Error('Crypto provider failed'))}
  }}),/Crypto provider failed/);
 });
 await test('an invalid digest response fails closed',async()=>{
  await assert.rejects(api.fingerprint(original,{subtle:{
    digest:async()=>new Uint8Array([1,2,3]).buffer
  }}),/Invalid SHA-256 digest response/);
 });
 await test('changed pixels with a freshly forged matching hash are NOT authenticated',async()=>{
  const changed=pixels(2,2,saved);changed.data[0]=0;
  const forged=await api.fingerprint(changed,options);
  assert.equal(await api.matchesExpected(changed,forged,options),true);
  assert.equal(await api.matchesExpected(changed,trusted,options),false);
  // The test proves the CALLER must retrieve the expectation from a truly
  // authenticated server record; this primitive does not establish trust.
 });
 await test('standard 1280 x 720 opaque image handles practical output size',async()=>{
  const large=new Uint8ClampedArray(1280*720*4);
  large.fill(127);
  for(let i=3;i<large.length;i+=4)large[i]=255;
  const image={width:1280,height:720,data:large};
  const sha=await api.fingerprint(image,options);
  assert.equal(sha.sha256,independent(image));
  assert.equal(await api.matchesExpected(image,sha,options),true);
 });
 console.log('Gallery original pixels: '+passed+' SHA-256 regression scenarios PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
