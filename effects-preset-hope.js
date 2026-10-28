/* MASHpedition · 11-03 / 17-08 · HOPE named Effects Preset.
   Visual reference: supplied four-ink political-screenprint-style poster.
   A NAMED configuration of existing Posterization + Limited Palette, with a
   caption-band presentation layer. A future selectable preset is a Setting
   and its Gem/unlock mapping belongs to job 11-04, not this renderer.
   No audio, Tokens, account work, Mutosis or automatic game target selection. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHHopePreset=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(root){
  'use strict';
  const INKS=Object.freeze({
    shadow:'#072137',cool:'#679B9E',highlight:'#F4ECC5',accent:'#C62507'
  });
  const PRESET=Object.freeze({
    id:'hope',name:'HOPE',kind:'effects-preset',domain:'Visual',
    // Reference-derived starting values; final intensity is not locked.
    posterizationLevels:4,shadowBelow:72,highlightAbove:185,accentStart:.53,
    captionBandRatio:.18,caption:'HOPE',inks:INKS
  });
  const CAPTION=/^[A-Za-z0-9][A-Za-z0-9 !?'\-]{0,19}$/;
  const validCanvas=canvas=>!!canvas&&typeof canvas.getContext==='function'&&
    Number.isSafeInteger(canvas.width)&&canvas.width>0&&
    Number.isSafeInteger(canvas.height)&&canvas.height>0&&
    Number.isSafeInteger(canvas.width*canvas.height*4);

  function dependencies(){
    const poster=root?.MASHPosterization?.posterize;
    const palette=root?.MASHLimitedPalette?.recolor;
    if(typeof poster!=='function'||typeof palette!=='function')
      throw new Error('HOPE requires the standalone Posterization and Limited Palette effects');
    return {poster,palette};
  }
  // Does NOT add typography. Allows callers to test the pixel operation
  // independently, including exact original restoration when disabled.
  function apply(source,options){
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('HOPE requires explicit enabled true/false');
    const {poster,palette}=dependencies();
    if(!options.enabled)return poster(source,{enabled:false});
    const flat=poster(source,{enabled:true,levels:PRESET.posterizationLevels});
    return palette(flat,{
      enabled:true,inks:INKS,shadowBelow:PRESET.shadowBelow,
      highlightAbove:PRESET.highlightAbove,accentStart:PRESET.accentStart
    });
  }
  // The caller supplies an ACTUAL authorized source canvas and a different
  // output canvas. This never selects a MASHpedition room/artwork on its own.
  function render(sourceCanvas,destinationCanvas,options){
    if(!validCanvas(sourceCanvas)||!validCanvas(destinationCanvas))
      throw new TypeError('HOPE requires valid source/output canvases');
    if(sourceCanvas===destinationCanvas)
      throw new RangeError('HOPE cannot render over the source canvas');
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('HOPE requires explicit enabled true/false');

    const caption=options.caption===undefined?PRESET.caption:options.caption;
    if(options.enabled && (typeof caption!=='string'||!CAPTION.test(caption)))
      throw new RangeError('HOPE caption must be 1–20 simple printable characters');
    const ink=caption?.toUpperCase();

    // Preflight the real 2D APIs before the first destination write.
    const sourceContext=sourceCanvas.getContext('2d',{willReadFrequently:true});
    const destinationContext=destinationCanvas.getContext('2d');
    if(!sourceContext||!destinationContext||
       typeof sourceContext.getImageData!=='function'||
       typeof destinationContext.putImageData!=='function'||
       (options.enabled&&(
         typeof destinationContext.fillRect!=='function'||
         typeof destinationContext.fillText!=='function'||
         typeof destinationContext.save!=='function'||
         typeof destinationContext.restore!=='function')))
      throw new TypeError('HOPE requires usable canvas 2D contexts');
    const {width,height}=sourceCanvas;
    const input=sourceContext.getImageData(0,0,width,height);
    const result=apply(input,{enabled:options.enabled});
    // Effect and input validation finished before resizing/writing output.
    if(destinationCanvas.width!==width)destinationCanvas.width=width;
    if(destinationCanvas.height!==height)destinationCanvas.height=height;
    const out=destinationCanvas.getContext('2d');
    if(!out||typeof out.putImageData!=='function')
      throw new TypeError('Output context unavailable after size change');
    out.putImageData(result,0,0);
    if(options.enabled){
      // Image stays at original dimensions. The poster treatment overlays
      // its OWN output; it does not crop, reencode, or mutate the original.
      const band=Math.max(1,Math.round(height*PRESET.captionBandRatio));
      const margin=Math.max(1,Math.floor(Math.min(width,height)*.022));
      out.save();
      out.fillStyle=INKS.shadow;
      out.fillRect(margin,height-band-margin,width-2*margin,band);
      out.fillStyle=INKS.cool;
      out.font='900 '+Math.max(1,Math.floor(Math.min(band*.88,(width-2*margin)/Math.max(1,ink.length)*1.6)))+'px Impact, "Arial Black", sans-serif';
      out.textAlign='center';out.textBaseline='middle';
      out.fillText(ink,width/2,height-margin-band/2,width-4*margin);
      out.fillStyle=INKS.highlight;
      // Print-like border, no changes to the authored game plate geometry.
      out.fillRect(0,0,width,margin);
      out.fillRect(0,height-margin,width,margin);
      out.fillRect(0,0,margin,height);
      out.fillRect(width-margin,0,margin,height);
      out.restore();
    }
    return Object.freeze({
      preset:'HOPE',enabled:options.enabled,width,height,
      caption:options.enabled?ink:null
    });
  }
  return Object.freeze({PRESET,apply,render});
});
