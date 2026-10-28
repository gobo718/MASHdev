/* MASHdev 17-08: production renderer boundary, no game-only mock room. */
'use strict';
const assert=require('node:assert/strict');
require('../effects-pixelation.js');
require('../effects-posterization.js');
const renderer=require('../effects-canvas-renderer.js');
let tests=0;
function check(label,fn){fn();tests++;}
function canvas(width,height,rgba){
  const surface={
    width,height,pixels:new Uint8ClampedArray(rgba),
    writes:0,reads:0,
    getContext(type){
      if(type!=='2d')return null;
      return {
        getImageData(x,y,w,h){
          assert.deepEqual([x,y,w,h],[0,0,surface.width,surface.height]);
          surface.reads++;
          return {width:w,height:h,data:new Uint8ClampedArray(surface.pixels)};
        },
        putImageData(value,x,y){
          assert.deepEqual([x,y],[0,0]);
          assert.equal(value.data.length,surface.width*surface.height*4);
          surface.pixels=new Uint8ClampedArray(value.data);
          surface.writes++;
        }
      };
    }
  };
  return surface;
}
const input=[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255];
const original=canvas(2,2,input);
const output=canvas(1,1,[17,18,19,20]);
check('explicit Pixelation sends a 2x2 block into only the target canvas',()=>{
 const status=renderer.render(original,output,{effect:'pixelation',enabled:true,blockSize:2});
 assert.deepEqual(status,{width:2,height:2,effect:'pixelation',enabled:true});
 assert.deepEqual([...output.pixels],[128,128,128,255,128,128,128,255,128,128,128,255,128,128,128,255]);
 assert.deepEqual([...original.pixels],input);
});
check('switching Pixelation OFF restores the original RGBA source exactly',()=>{
 renderer.render(original,output,{effect:'pixelation',enabled:false});
 assert.deepEqual([...output.pixels],input);
});
check('Posterization uses the same destination and does not compose Pixelation',()=>{
 renderer.render(original,output,{effect:'posterization',enabled:true,levels:2});
 assert.deepEqual([...output.pixels],input);
});
check('Posterization actually reduces intermediate colors and preserves alpha',()=>{
 const src=canvas(2,1,[50,127,128,90,190,220,240,155]);
 const dst=canvas(2,1,[0,0,0,0,0,0,0,0]);
 renderer.render(src,dst,{effect:'posterization',enabled:true,levels:2});
 assert.deepEqual([...dst.pixels],[0,0,255,90,255,255,255,155]);
 assert.deepEqual([...src.pixels],[50,127,128,90,190,220,240,155]);
});
check('Posterization OFF restores the exact unmodified image, not a prior output',()=>{
 const dst=canvas(1,1,[0,0,0,0]);
 renderer.render(original,dst,{effect:'posterization',enabled:false});
 assert.deepEqual([...dst.pixels],input);
});
check('same source and destination is rejected before any source writes',()=>{
 const prior=original.writes;
 assert.throws(()=>renderer.render(original,original,{effect:'pixelation',enabled:true,blockSize:2}),RangeError);
 assert.equal(original.writes,prior);
});
check('unsupported effect and missing explicit enabled state are rejected',()=>{
 for(const opts of [{effect:'bitcrush',enabled:true},{effect:'pixelation'},{effect:'posterization',enabled:1},null]){
  const writes=output.writes;
  assert.throws(()=>renderer.render(original,output,opts),TypeError);
  assert.equal(output.writes,writes);
 }
});
check('invalid effect parameters never overwrite existing destination pixels',()=>{
 const before=[...output.pixels],writes=output.writes;
 assert.throws(()=>renderer.render(original,output,{effect:'posterization',enabled:true,levels:1}),RangeError);
 assert.throws(()=>renderer.render(original,output,{effect:'pixelation',enabled:true,blockSize:0}),RangeError);
 assert.deepEqual([...output.pixels],before);
 assert.equal(output.writes,writes);
});
check('invalid or missing canvas contexts are refused',()=>{
 assert.throws(()=>renderer.render({},output,{effect:'pixelation',enabled:false}),TypeError);
 assert.throws(()=>renderer.render(original,{}, {effect:'pixelation',enabled:false}),TypeError);
 const noContext={width:1,height:1,getContext(){return null}};
 assert.throws(()=>renderer.render(original,noContext,{effect:'pixelation',enabled:false}),TypeError);
});
check('source reading errors do not write destination pixels',()=>{
 const bad=canvas(1,1,[0,0,0,255]);
 bad.getContext=()=>({getImageData(){throw new Error('Tainted canvas')}});
 const before=output.writes;
 assert.throws(()=>renderer.render(bad,output,{effect:'pixelation',enabled:false}),/Tainted canvas/);
 assert.equal(output.writes,before);
});
check('each effect must be explicitly loaded',()=>{
 const prev=globalThis.MASHPosterization;
 try{
  delete globalThis.MASHPosterization;
  assert.throws(()=>renderer.render(original,output,{effect:'posterization',enabled:false}),/not loaded/);
 }finally{globalThis.MASHPosterization=prev}
});
check('effect renderer only exports two independent choices and a render entrypoint',()=>{
 assert.deepEqual([...renderer.EFFECTS],['pixelation','posterization']);
 assert.deepEqual(Object.keys(renderer),['EFFECTS','render']);
 assert.ok(Object.isFrozen(renderer));
});
console.log('Visual effects canvas renderer: '+tests+' production-boundary checks PASS');
