/* MASHpedition · job 11-03 · Pixelation (CN-00561), standalone Visual Manipulation.
   Applies an actual pixel-block transform to a COPY of pixel data. No Tokens,
   Settings, presets, rewards or gameplay state are assumed here.
   The unmodified source is always retained by the caller. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHPixelation=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  function pixelate(source, options){
    if(!source||!Number.isSafeInteger(source.width)||source.width<1||
      !Number.isSafeInteger(source.height)||source.height<1||
      !(source.data instanceof Uint8ClampedArray)||
      source.data.length!==source.width*source.height*4){
      throw new TypeError('Expected nonempty ImageData-compatible RGBA source');
    }
    if(!options||typeof options.enabled!=='boolean'){
      throw new TypeError('Pixelation requires explicit enabled true/false');
    }
    const {width,height}=source;
    const output=new Uint8ClampedArray(source.data);
    if(options.enabled){
      const cell=options.blockSize;
      if(!Number.isSafeInteger(cell)||cell<1){
        throw new RangeError('Pixelation blockSize must be a positive integer');
      }
      const input=source.data;
      for(let top=0;top<height;top+=cell){
        const bottom=Math.min(height,top+cell);
        for(let left=0;left<width;left+=cell){
          const right=Math.min(width,left+cell);
          let alphaSum=0,rSum=0,gSum=0,bSum=0;
          const count=(right-left)*(bottom-top);
          for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
            const n=(y*width+x)*4;
            const a=input[n+3];alphaSum+=a;
            rSum+=input[n]*a;gSum+=input[n+1]*a;bSum+=input[n+2]*a;
          }
          const r=alphaSum?Math.round(rSum/alphaSum):0;
          const g=alphaSum?Math.round(gSum/alphaSum):0;
          const b=alphaSum?Math.round(bSum/alphaSum):0;
          const a=Math.round(alphaSum/count);
          for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
            const n=(y*width+x)*4;
            output[n]=r;output[n+1]=g;output[n+2]=b;output[n+3]=a;
          }
        }
      }
    }
    return typeof ImageData==='function' ? new ImageData(output,width,height):
      {width,height,data:output};
  }
  return Object.freeze({pixelate});
});
