/* MASHpedition · 11-03 · Posterization, standalone Visual Manipulation.
   Quantizes RGB into explicitly requested flat color levels. The source
   pixels are NEVER edited. This is not an Effects Preset, Token, Setting,
   Mutosis step, audio hard-distortion pair, or player progression change.
   No effect target, intensity preset, visual UI or reward is invented. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(root)root.MASHPosterization=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';

  function posterize(source,options){
    if(!source || !Number.isSafeInteger(source.width) || source.width<1 ||
       !Number.isSafeInteger(source.height) || source.height<1 ||
       !Number.isSafeInteger(source.width*source.height*4) ||
       !(source.data instanceof Uint8ClampedArray) ||
       source.data.length!==source.width*source.height*4){
      throw new TypeError('Expected nonempty ImageData-compatible RGBA source');
    }
    if(!options || typeof options.enabled!=='boolean'){
      throw new TypeError('Posterization requires explicit enabled true/false');
    }
    const {width,height}=source;
    // Always return a fresh buffer. OFF is the exact original image, not
    // a second transform of an already posterized previous result.
    const output=new Uint8ClampedArray(source.data);
    if(options.enabled){
      const levels=options.levels;
      if(!Number.isSafeInteger(levels) || levels<2 || levels>256){
        throw new RangeError('Posterization levels must be an integer from 2 to 256');
      }
      const divisions=levels-1;
      // The endpoints (0,255) stay exact. Alpha is never quantized: transparent
      // and partially transparent image boundaries retain their coverage.
      for(let i=0;i<output.length;i+=4){
        for(let channel=0;channel<3;channel++){
          const index=i+channel;
          output[index]=Math.round(Math.round(output[index]*divisions/255)*255/divisions);
        }
      }
    }
    return typeof ImageData==='function' ? new ImageData(output,width,height):
      {width,height,data:output};
  }
  return Object.freeze({posterize});
});
