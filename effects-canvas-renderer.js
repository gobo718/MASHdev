/* MASHpedition · 17-08 / 11-03 · source-safe visual-effects canvas boundary.
   Only processes an EXPLICIT caller-selected existing image surface.
   Atomic Effects and explicitly named Effects Presets remain distinct APIs.
   No demo artwork, game UI, target selection, Tokens, progression, Mutosis,
   inventory, persistence or IMPLICIT effect combinations.
   Source and destination canvases must be different to preserve originals. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHVisualEffectsCanvas=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(root){
  'use strict';
  const EFFECTS=Object.freeze(['pixelation','posterization']);
  const PRESETS=Object.freeze(['hope']);
  function validCanvas(surface){
    return !!surface && typeof surface.getContext==='function' &&
      Number.isSafeInteger(surface.width) && surface.width>0 &&
      Number.isSafeInteger(surface.height) && surface.height>0 &&
      Number.isSafeInteger(surface.width*surface.height*4);
  }
  // In the game, sourceCanvas is the caller's already-authorized image source,
  // not an image fetched or stored by this renderer. It is never written to.
  function render(sourceCanvas,destinationCanvas,options){
    if(!validCanvas(sourceCanvas)||!validCanvas(destinationCanvas)){
      throw new TypeError('Two valid, separate image canvases are required');
    }
    if(sourceCanvas===destinationCanvas){
      throw new RangeError('Source canvas must not be used as the effect output');
    }
    if(!options || !EFFECTS.includes(options.effect) ||
       typeof options.enabled!=='boolean'){
      throw new TypeError('Specify a supported standalone effect and enabled true/false');
    }
    const library=options.effect==='pixelation'
      ? root?.MASHPixelation : root?.MASHPosterization;
    const operation=options.effect==='pixelation'?'pixelate':'posterize';
    if(typeof library?.[operation]!=='function'){
      throw new Error('Requested visual-effect module is not loaded');
    }
    const sourceContext=sourceCanvas.getContext('2d',{willReadFrequently:true});
    const destinationContext=destinationCanvas.getContext('2d');
    if(!sourceContext||!destinationContext ||
       typeof sourceContext.getImageData!=='function' ||
       typeof destinationContext.putImageData!=='function'){
      throw new TypeError('Both canvases must provide readable 2D image contexts');
    }
    const width=sourceCanvas.width,height=sourceCanvas.height;
    // Reading may fail on cross-origin tainted canvases. Let the browser reject
    // it; do not silently bypass its security restriction.
    const image=sourceContext.getImageData(0,0,width,height);
    const processed=library[operation](image,{
      enabled:options.enabled,
      ...(options.effect==='pixelation'
        ? {blockSize:options.blockSize} : {levels:options.levels})
    });
    // First validate and run the effect. No destination writes on invalid
    // parameters, unavailable modules, unreadable sources or effect errors.
    if(destinationCanvas.width!==width)destinationCanvas.width=width;
    if(destinationCanvas.height!==height)destinationCanvas.height=height;
    destinationContext.putImageData(processed,0,0);
    return Object.freeze({width,height,effect:options.effect,enabled:options.enabled});
  }
  // Named configurations have their own explicit entry point, separate from
  // atomic effect selection. HOPE is the only booked, implemented preset here.
  // It owns its own Posterization + Limited Palette + caption-band treatment.
  // No renderer may infer a preset from a selected artwork or a URL parameter.
  function renderPreset(sourceCanvas,destinationCanvas,options){
    if(!validCanvas(sourceCanvas)||!validCanvas(destinationCanvas))
      throw new TypeError('Two valid, separate image canvases are required');
    if(sourceCanvas===destinationCanvas)
      throw new RangeError('Source canvas must not be used as the preset output');
    if(!options||options.preset!=='hope'||typeof options.enabled!=='boolean')
      throw new TypeError('Specify an implemented named preset and explicit enabled state');
    const preset=root?.MASHHopePreset;
    if(typeof preset?.render!=='function'||preset?.PRESET?.id!=='hope')
      throw new Error('HOPE preset module is not loaded');
    return preset.render(sourceCanvas,destinationCanvas,{
      enabled:options.enabled,
      ...(Object.hasOwn(options,'caption')?{caption:options.caption}:{})
    });
  }
  return Object.freeze({EFFECTS,PRESETS,render,renderPreset});
});
