/* MASHdev 11-03 / 17-08 · HOPE Effects Preset through real shared renderer.
   Real production modules; synthetic ImageData/canvas interfaces only inside
   regression tests. No staged game artwork, user image, inventory, Mutosis,
   account, award, or unlock is created. */
'use strict';
const assert=require('node:assert/strict');
require('../effects-pixelation.js');
require('../effects-posterization.js');
require('../effects-limited-palette.js');
const hope=require('../effects-preset-hope.js');
const renderer=require('../effects-canvas-renderer.js');
let scenarios=0;
function check(title,fn){fn();scenarios++}
const srcPixels=[
 255,0,0,255, 10,20,40,255, 200,210,220,255, 40,120,150,100,
 6,15,20,0, 77,140,160,255, 220,90,40,255, 222,233,244,255
];
function canvas(width,height,pixels){
 const logs={reads:0,writes:0,texts:[],rects:[],save:0,restore:0};
 const box={width,height,pixels:new Uint8ClampedArray(pixels),logs};
 const ctx={
  getImageData(x,y,w,h){
   assert.deepEqual([x,y,w,h],[0,0,box.width,box.height]);
   logs.reads++;
   return {width:w,height:h,data:new Uint8ClampedArray(box.pixels)};
  },
  putImageData(image,x,y){
   assert.deepEqual([x,y],[0,0]);
   assert.equal(image.data.length,box.width*box.height*4);
   box.pixels=new Uint8ClampedArray(image.data);
   logs.writes++;
  },
  save(){logs.save++},restore(){logs.restore++},
  fillRect(...args){logs.rects.push({args,color:ctx.fillStyle})},
  fillText(...args){logs.texts.push({args,color:ctx.fillStyle})}
 };
 box.getContext=type=>type==='2d'?ctx:null;
 return box;
}
check('the renderer distinguishes atomic effects and named presets',()=>{
 assert.deepEqual([...renderer.EFFECTS],['pixelation','posterization']);
 assert.deepEqual([...renderer.PRESETS],['hope']);
 assert.ok(Object.isFrozen(renderer)&&Object.isFrozen(renderer.PRESETS));
 assert.equal(typeof renderer.render,'function');
 assert.equal(typeof renderer.renderPreset,'function');
});
check('HOPE is rejected by the atomic-effect entry point',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[0,0,0,0]);
 assert.throws(()=>renderer.render(src,out,{effect:'hope',enabled:true}),TypeError);
 assert.equal(src.logs.writes+out.logs.writes,0);
});
check('the registered HOPE preset runs the full poster print through shared renderer',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[17,18,19,20]);
 const result=renderer.renderPreset(src,out,{preset:'hope',enabled:true});
 assert.deepEqual(result,{preset:'HOPE',enabled:true,width:4,height:2,caption:'HOPE'});
 assert.equal(src.logs.writes,0);
 assert.deepEqual([...src.pixels],srcPixels);
 assert.equal(out.logs.writes,1);
 assert.equal(out.logs.texts.length,1);
 assert.equal(out.logs.texts[0].args[0],'HOPE');
 assert.ok(out.logs.rects.length>=5);
 assert.equal(out.width,4);assert.equal(out.height,2);
});
check('OFF restores exact source pixels after an ON render, without a caption',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(4,2,srcPixels.map(()=>0));
 renderer.renderPreset(src,out,{preset:'hope',enabled:true});
 const drawn=out.logs.rects.length,meta=renderer.renderPreset(src,out,{preset:'hope',enabled:false});
 assert.equal(drawn>=5,true);
 assert.equal(meta.caption,null);
 assert.deepEqual([...out.pixels],srcPixels);
 assert.equal(out.logs.texts.length,1); // From the preceding ON render only.
 assert.equal(src.logs.writes,0);
});
check('an explicit caption reaches the existing HOPE render function',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(4,2,srcPixels);
 const result=renderer.renderPreset(src,out,{preset:'hope',enabled:true,caption:'HELLO'});
 assert.equal(result.caption,'HELLO');
 assert.equal(out.logs.texts[0].args[0],'HELLO');
});
check('invalid captions fail before a destination resize/write',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[0,0,0,0]);
 for(const caption of ['',null,'A CAPTION WAY TOO LONG','💖']){
  assert.throws(()=>renderer.renderPreset(src,out,{preset:'hope',enabled:true,caption}),RangeError);
  assert.equal(out.width,1);
  assert.equal(out.logs.writes,0);
 }
});
check('unknown presets never select game targets or run unrelated effects',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(4,2,srcPixels);
 for(const opts of [{preset:'bitcrush',enabled:true},{preset:'HOPE',enabled:true},
   {effect:'hope',enabled:true},{preset:'hope'},{preset:'hope',enabled:1},null])
  assert.throws(()=>renderer.renderPreset(src,out,opts),TypeError);
 assert.equal(out.logs.writes,0);
});
check('source canvas cannot be used as the target',()=>{
 const src=canvas(4,2,srcPixels);
 assert.throws(()=>renderer.renderPreset(src,src,{preset:'hope',enabled:true}),RangeError);
 assert.equal(src.logs.writes,0);
});
check('unreadable existing source leaves destination untouched',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[2,3,4,5]);
 src.getContext=()=>({getImageData(){throw new Error('cross-origin taint')}});
 assert.throws(()=>renderer.renderPreset(src,out,{preset:'hope',enabled:true}),
   /cross-origin taint/);
 assert.equal(out.logs.writes,0);
 assert.equal(out.width,1);
});
check('missing named-preset module fails explicitly',()=>{
 const previous=globalThis.MASHHopePreset;
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[3,4,5,6]);
 try{
  delete globalThis.MASHHopePreset;
  assert.throws(()=>renderer.renderPreset(src,out,{preset:'hope',enabled:false}),/not loaded/);
  assert.equal(out.logs.writes,0);
 }finally{globalThis.MASHHopePreset=previous}
});
check('missing HOPE atomic dependency also fails before any writes',()=>{
 const previous=globalThis.MASHLimitedPalette;
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[3,4,5,6]);
 try{
  delete globalThis.MASHLimitedPalette;
  assert.throws(()=>renderer.renderPreset(src,out,{preset:'hope',enabled:true}),/requires/);
  assert.equal(out.logs.writes,0);
 }finally{globalThis.MASHLimitedPalette=previous}
});
check('the original pixelation entrypoint remains functional',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[0,0,0,0]);
 const meta=renderer.render(src,out,{effect:'pixelation',enabled:false});
 assert.equal(meta.effect,'pixelation');
 assert.deepEqual([...out.pixels],srcPixels);
 assert.equal(src.logs.writes,0);
});
check('the original posterization entrypoint remains functional',()=>{
 const src=canvas(4,2,srcPixels),out=canvas(1,1,[0,0,0,0]);
 const meta=renderer.render(src,out,{effect:'posterization',enabled:false});
 assert.equal(meta.effect,'posterization');
 assert.deepEqual([...out.pixels],srcPixels);
});
check('HOPE remains an Effects Preset, not a stored Setting, Gem or award',()=>{
 assert.equal(hope.PRESET.kind,'effects-preset');
 assert.equal(hope.PRESET.domain,'Visual');
 assert.deepEqual(Object.keys(renderer),['EFFECTS','PRESETS','render','renderPreset']);
 assert.equal(Object.keys(renderer).some(x=>/unlock|award|equip|save|account/i.test(x)),false);
});
console.log('HOPE renderer integration: '+scenarios+' source-backed scenarios PASS');
