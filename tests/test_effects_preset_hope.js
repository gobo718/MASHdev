/* MASHdev HOPE preset: real underlying effects with explicit canvases.
   Development-only checks. Does not stage a demo or infer a game target. */
'use strict';
const assert=require('node:assert/strict');
require('../effects-posterization.js');
const limited=require('../effects-limited-palette.js');
const hope=require('../effects-preset-hope.js');
let checks=0;
function test(name,fn){fn();checks++}
const image=(pixels,width=pixels.length)=>({
 width,height:pixels.length/width,
 data:new Uint8ClampedArray(pixels.flat())
});
const toArray=p=>[...p.data];
const inks=hope.PRESET.inks;
const colors=Object.values(inks).map(s=>s.toUpperCase());
const toHex=(a,i)=>'#'+[0,1,2].map(k=>a[i*4+k].toString(16).padStart(2,'0')).join('').toUpperCase();
const source=image([
 [12,20,25,255], [90,120,135,120], [255,243,218,255], [225,35,12,255],
 [10,40,50,0], [110,110,110,255], [110,110,110,255], [205,190,185,200]
],4);
const saved=toArray(source);
function canvas(w,h,pixels){
 const records={reads:0,writes:0,rects:[],texts:[],saves:0,restores:0};
 const surface={width:w,height:h,pixels:new Uint8ClampedArray(pixels),records};
 const context={
  getImageData(x,y,width,height){records.reads++;assert.deepEqual([x,y,width,height],[0,0,surface.width,surface.height]);return {width,height,data:new Uint8ClampedArray(surface.pixels)}},
  putImageData(img,x,y){records.writes++;assert.deepEqual([x,y],[0,0]);surface.pixels=new Uint8ClampedArray(img.data)},
  save(){records.saves++},restore(){records.restores++},
  fillRect(...args){records.rects.push({args,color:context.fillStyle})},
  fillText(...args){records.texts.push({args,color:context.fillStyle,font:context.font})}
 };
 surface.getContext=type=>type==='2d'?context:null;
 return surface;
}
test('named preset and four reference inks are frozen',()=>{
 assert.equal(hope.PRESET.name,'HOPE');
 assert.equal(hope.PRESET.kind,'effects-preset');
 assert.equal(hope.PRESET.domain,'Visual');
 assert.ok(Object.isFrozen(hope.PRESET)&&Object.isFrozen(inks));
 assert.deepEqual(inks,{shadow:'#072137',cool:'#679B9E',highlight:'#F4ECC5',accent:'#C62507'});
});
test('limited palette ON emits exactly the booked four inks',()=>{
 const out=limited.recolor(source,{enabled:true,inks,
  shadowBelow:72,highlightAbove:185,accentStart:.53});
 const opaque=new Set();
 for(let i=0;i<out.data.length;i+=4){if(out.data[i+3])opaque.add(toHex(out.data,i/4))}
 for(const color of opaque)assert.ok(colors.includes(color));
 assert.ok(opaque.has('#072137')&&opaque.has('#679B9E')&&opaque.has('#F4ECC5')&&opaque.has('#C62507'));
 assert.deepEqual(toArray(source),saved);
});
test('palette operation leaves fully transparent pixels and all alpha unchanged',()=>{
 const out=limited.recolor(source,{enabled:true,inks,shadowBelow:72,highlightAbove:185,accentStart:.53});
 for(let i=3;i<out.data.length;i+=4)assert.equal(out.data[i],source.data[i]);
 assert.deepEqual([...out.data.slice(16,20)],[10,40,50,0]);
});
test('posterized limited-palette composition produces a four-color print',()=>{
 const out=hope.apply(source,{enabled:true});
 assert.equal(out.width,4);assert.equal(out.height,2);
 for(let i=0;i<out.data.length;i+=4){
   if(out.data[i+3])assert.ok(colors.includes(toHex(out.data,i/4)));
 }
 assert.deepEqual(toArray(source),saved);
});
test('HOPE OFF returns bit-exact original after ON',()=>{
 hope.apply(source,{enabled:true});
 const out=hope.apply(source,{enabled:false});
 assert.deepEqual(toArray(out),saved);
 assert.notStrictEqual(out.data,source.data);
});
test('four-ink atomic transformation is separately switchable',()=>{
 const out=limited.recolor(source,{enabled:false});
 assert.deepEqual(toArray(out),saved);
 assert.notStrictEqual(out.data,source.data);
});
test('HOPE canvas render paints only separately supplied output',()=>{
 const src=canvas(4,2,saved),dest=canvas(1,1,[1,2,3,4]);
 const meta=hope.render(src,dest,{enabled:true});
 assert.deepEqual(meta,{preset:'HOPE',enabled:true,width:4,height:2,caption:'HOPE'});
 assert.equal(src.records.writes,0);
 assert.deepEqual([...src.pixels],saved);
 assert.equal(dest.records.writes,1);
 assert.equal(dest.records.texts.length,1);
 assert.equal(dest.records.texts[0].args[0],'HOPE');
 assert.equal(dest.records.texts[0].color,inks.cool);
 assert.ok(dest.records.rects.length>=5);
 assert.equal(dest.records.saves,1);assert.equal(dest.records.restores,1);
});
test('caption may be explicitly changed without changing preset ID',()=>{
 const src=canvas(4,2,saved),dest=canvas(4,2,saved);
 const meta=hope.render(src,dest,{enabled:true,caption:'YES WE CAN'});
 assert.equal(meta.caption,'YES WE CAN');
 assert.equal(dest.records.texts[0].args[0],'YES WE CAN');
 assert.equal(meta.preset,'HOPE');
});
test('HOPE render OFF restores original pixels and draws no caption/border',()=>{
 const src=canvas(4,2,saved),dest=canvas(4,2,saved.map(()=>0));
 const meta=hope.render(src,dest,{enabled:false});
 assert.deepEqual([...dest.pixels],saved);
 assert.equal(dest.records.texts.length,0);
 assert.equal(dest.records.rects.length,0);
 assert.equal(meta.caption,null);
});
test('source=destination cannot be used, no writes on source',()=>{
 const src=canvas(4,2,saved);
 assert.throws(()=>hope.render(src,src,{enabled:true}),RangeError);
 assert.equal(src.records.writes,0);
});
test('invalid caption fails before writing any output',()=>{
 const src=canvas(4,2,saved),dst=canvas(4,2,saved);
 for(const caption of ['',null,'caption-that-is-far-too-long','💖']){
   assert.throws(()=>hope.render(src,dst,{enabled:true,caption}),RangeError);
 }
 assert.equal(dst.records.writes,0);
});
test('valid explicit disabled state and canvas APIs required',()=>{
 const src=canvas(4,2,saved),dst=canvas(4,2,saved);
 assert.throws(()=>hope.render(src,dst,{}),TypeError);
 assert.throws(()=>hope.render(src,dst,{enabled:1}),TypeError);
 assert.throws(()=>hope.render({},dst,{enabled:true}),TypeError);
 const broken=canvas(4,2,saved);broken.getContext=()=>null;
 assert.throws(()=>hope.render(src,broken,{enabled:true}),TypeError);
 assert.equal(dst.records.writes,0);
});
test('unreadable original leaves destination untouched',()=>{
 const src=canvas(4,2,saved),dst=canvas(4,2,saved);
 src.getContext=()=>({getImageData(){throw new Error('cross-origin taint')}});
 assert.throws(()=>hope.render(src,dst,{enabled:true}),/cross-origin/);
 assert.equal(dst.records.writes,0);
});
test('missing atomic effect prevents HOPE composition',()=>{
 const prior=globalThis.MASHLimitedPalette;
 try{delete globalThis.MASHLimitedPalette;assert.throws(()=>hope.apply(source,{enabled:true}),/requires/)}
 finally{globalThis.MASHLimitedPalette=prior}
});
test('original source stays byte-perfect on repeated ON/OFF',()=>{
 for(let i=0;i<3;i++){
  hope.apply(source,{enabled:true});
  hope.apply(source,{enabled:false});
 }
 assert.deepEqual(toArray(source),saved);
});
test('modules do not expose any Token/audio/game account methods',()=>{
 assert.deepEqual(Object.keys(hope),['PRESET','apply','render']);
 assert.deepEqual(Object.keys(limited),['recolor','CHANNELS']);
 assert.ok(Object.isFrozen(hope)&&Object.isFrozen(limited));
});
console.log('HOPE preset: '+checks+' developer scenarios PASS');
