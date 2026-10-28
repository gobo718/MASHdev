/* MASHpedition · 11-03 · reusable limited-palette visual manipulation.
   Copies ImageData-compatible pixels to a fixed four-ink color ramp. Source
   and alpha are never changed. No UI, accounts, presets or audio are implied. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHLimitedPalette=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const CHANNELS=Object.freeze(['shadow','cool','highlight','accent']);
  const HEX=/^#[0-9A-Fa-f]{6}$/;
  function color(hex){
    if(typeof hex!=='string'||!HEX.test(hex))throw new TypeError('Ink must be #RRGGBB');
    return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  }
  function recolor(source,options){
    if(!source||!Number.isSafeInteger(source.width)||source.width<1||
       !Number.isSafeInteger(source.height)||source.height<1||
       !Number.isSafeInteger(source.width*source.height*4)||
       !(source.data instanceof Uint8ClampedArray)||
       source.data.length!==source.width*source.height*4){
      throw new TypeError('Expected nonempty ImageData-compatible RGBA source');
    }
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('Limited palette needs explicit enabled true/false');
    const {width,height}=source;
    const output=new Uint8ClampedArray(source.data);
    if(options.enabled){
      const inks=options.inks,shadow=options.shadowBelow,highlight=options.highlightAbove,
        redSide=options.accentStart;
      if(!inks||CHANNELS.some(name=>typeof inks[name]!=='string'||!HEX.test(inks[name])))
        throw new TypeError('Supply four valid shadow/cool/highlight/accent inks');
      if(!Number.isInteger(shadow)||!Number.isInteger(highlight)||
         shadow<0||shadow>=highlight||highlight>255||
         typeof redSide!=='number'||!Number.isFinite(redSide)||redSide<0||redSide>1)
        throw new RangeError('Invalid tonal cutoffs or accent split');
      const palette=Object.fromEntries(CHANNELS.map(name=>[name,color(inks[name])]));
      for(let i=0;i<output.length;i+=4){
        const a=source.data[i+3];
        if(a===0)continue; // untouched fully transparent pixels
        const r=source.data[i],g=source.data[i+1],b=source.data[i+2];
        const luma=.2126*r+.7152*g+.0722*b;
        const x=(i/4)%width;
        // Strongly warm image features become accent ink. Neutral midtones
        // on the right also acquire that ink, recreating a split poster feel.
        const warm=r>95&&r-g>23&&r-b>23;
        const right=x/width>=redSide;
        const tone=luma>=highlight?'highlight'
          : (warm ? 'accent'
          : luma<shadow?'shadow'
          : (right&&luma<highlight-16 ? 'accent' : 'cool'));
        for(let channel=0;channel<3;channel++)output[i+channel]=palette[tone][channel];
      }
    }
    return typeof ImageData==='function'?new ImageData(output,width,height):
      {width,height,data:output};
  }
  return Object.freeze({recolor,CHANNELS});
});
