/* MASHpedition · 11-03 · Bitcrush CN-00548, standalone SFX Manipulation.
   Explicit offline PCM effect; not a WebAudio route or a sound preset.
   No implicit sample-rate/bit-depth defaults, Tokens, Settings, audio bus,
   reward, Mutosis or automatic coupling to visual Pixelation.
   The source float samples are never changed. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHBitcrush=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  function validateSource(source){
    if(!source || !Number.isSafeInteger(source.sampleRate) || source.sampleRate<1 ||
      !Array.isArray(source.channels) || source.channels.length<1 ||
      source.channels.some(channel=>!(channel instanceof Float32Array) ||
        channel.length<1 || channel.length!==source.channels[0].length)){
      throw new TypeError('Expected nonempty equal-length Float32 PCM channels and a sample rate');
    }
    for(const channel of source.channels){
      for(const sample of channel){
        if(!Number.isFinite(sample))
          throw new TypeError('Bitcrush does not accept non-finite PCM samples');
      }
    }
  }

  function bitcrush(source,options){
    validateSource(source);
    if(!options || typeof options.enabled!=='boolean')
      throw new TypeError('Bitcrush requires explicit enabled true/false');
    const output=source.channels.map(channel=>new Float32Array(channel));
    if(options.enabled){
      const depth=options.bitDepth,hold=options.holdSamples;
      if(!Number.isSafeInteger(depth)||depth<1||depth>24)
        throw new RangeError('Bitcrush bitDepth must be an integer from 1 to 24');
      if(!Number.isSafeInteger(hold)||hold<1)
        throw new RangeError('Bitcrush holdSamples must be a positive integer');
      const scale=2**(depth-1);
      const minimum=-scale,maximum=scale-1;
      for(const channel of output){
        // Repeated samples simulate reduced digital temporal resolution,
        // while signed PCM quantization creates independently chosen grit.
        // All channels share their frame boundaries but remain separate.
        for(let i=0;i<channel.length;i+=hold){
          const sample=channel[i];
          const quantized=Math.max(minimum,Math.min(maximum,
            Math.round(Math.max(-1,Math.min(1,sample))*scale)))/scale;
          const end=Math.min(i+hold,channel.length);
          channel.fill(quantized,i,end);
        }
      }
    }
    return Object.freeze({
      sampleRate:source.sampleRate,
      channels:Object.freeze(output)
    });
  }
  return Object.freeze({bitcrush});
});
