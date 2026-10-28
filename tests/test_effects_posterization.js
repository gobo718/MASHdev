/* MASHdev 11-03 regression: standalone Posterization, no in-game stage/demo. */
'use strict';
const assert=require('node:assert/strict');
const {posterize}=require('../effects-posterization.js');
const rgba=(...pixels)=>({width:pixels.length,height:1,data:new Uint8ClampedArray(pixels.flat())});
const src=rgba(
 [0,127,128,0],[64,191,255,128],[85,170,255,255],[17,225,255,254]
);
const original=new Uint8ClampedArray(src.data);
let checks=0;
function test(name,fn){fn();checks++;}
test('disabled makes an exact fresh copy, without a levels setting',()=>{
 const off=posterize(src,{enabled:false});
 assert.deepEqual(off.data,original);
 assert.notStrictEqual(off.data,src.data);
});
test('2-level thresholding of all three RGB channels, preserving alpha',()=>{
 const two=posterize(src,{enabled:true,levels:2});
 assert.deepEqual([...two.data],[
  0,0,255,0,0,255,255,128,0,255,255,255,0,255,255,254
 ]);
});
test('4 levels quantizes independently to exactly 0/85/170/255',()=>{
 const four=posterize(src,{enabled:true,levels:4});
 assert.deepEqual([...four.data],[
  0,85,170,0,85,170,255,128,85,170,255,255,0,255,255,254
 ]);
});
test('256 levels is a pixel-perfect copy even when enabled',()=>{
 const full=posterize(src,{enabled:true,levels:256});
 assert.deepEqual(full.data,original);
 assert.notStrictEqual(full.data,src.data);
});
test('switching OFF restores exact original, even after effect ON',()=>{
 posterize(src,{enabled:true,levels:2});
 const off=posterize(src,{enabled:false});
 assert.deepEqual(off.data,original);
 assert.deepEqual(src.data,original);
});
test('source data never modified by any level',()=>{
 for(const levels of [2,3,4,7,16,64,255,256])posterize(src,{enabled:true,levels});
 assert.deepEqual(src.data,original);
});
test('rectangular images retain dimensions and original alpha',()=>{
 const image={width:2,height:2,data:new Uint8ClampedArray([12,34,56,0,99,100,101,80,102,103,104,250,255,254,253,255])};
 const out=posterize(image,{enabled:true,levels:3});
 assert.equal(out.width,2);assert.equal(out.height,2);
 assert.deepEqual([out.data[3],out.data[7],out.data[11],out.data[15]],[0,80,250,255]);
});
test('invalid RGBA shapes or pixel types rejected',()=>{
 for(const bad of [null,{}, {width:0,height:1,data:new Uint8ClampedArray(0)},
  {width:1,height:1,data:[0,0,0,255]},
  {width:1,height:1,data:new Uint8ClampedArray(3)},
  {width:1,height:1.2,data:new Uint8ClampedArray(4)},
  {width:Number.MAX_SAFE_INTEGER,height:3,data:new Uint8ClampedArray(4)}]){
   assert.throws(()=>posterize(bad,{enabled:true,levels:4}),TypeError);
  }
});
test('enabled must be explicitly true or false',()=>{
 for(const bad of [undefined,null,{}, {enabled:1},{enabled:'yes'}])
  assert.throws(()=>posterize(src,bad),TypeError);
});
test('all invalid requested level values rejected',()=>{
 for(const levels of [undefined,null,1,0,-3,257,1000,2.5,NaN,Infinity,'4'])
  assert.throws(()=>posterize(src,{enabled:true,levels}),RangeError);
});
test('module exports only the standalone pure effect',()=>{
 assert.deepEqual(Object.keys(require('../effects-posterization.js')),['posterize']);
});
console.log('Posterization: '+checks+' development-only effect checks PASS');
