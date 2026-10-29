/* MASHpedition · 11-03 Music Dynamics: independent beat-volume manipulation.
   The booked reverse-waltz/march example alternates emphasis on beats 2 and 3,
   but creating a FOURTH beat and all production strength/smoothing remain OPEN.
   This is actual sample-level gain processing, not an invented march Curse,
   soundtrack, playback route, tempo, preset, token or in-game control.
   Only explicitly supplied PCM samples are processed. Originals are untouched. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHMusicDynamics=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  function validateAudio(source){
    if(!source || !Number.isSafeInteger(source.sampleRate)||source.sampleRate<1||
       !Array.isArray(source.channels)||source.channels.length<1||
       source.channels.some(channel=>!(channel instanceof Float32Array)||
         channel.length<1||channel.length!==source.channels[0].length))
      throw new TypeError('Expected sampleRate and equal-length nonempty Float32 PCM channels');
    for(const channel of source.channels){
      for(const sample of channel)if(!Number.isFinite(sample))
        throw new TypeError('PCM sample must be finite');
    }
  }
  function copy(source){
    return Object.freeze({
      sampleRate:source.sampleRate,
      channels:Object.freeze(source.channels.map(channel=>new Float32Array(channel)))
    });
  }
  function validateGain(gain){
    return typeof gain==='number'&&Number.isFinite(gain)&&gain>=0&&gain<=1;
  }
  // A two-measure *pattern only*. It does not add a missing fourth beat,
  // pick an intensity, or decide how an actual march should be constructed.
  function alternatingTwoThree({firstGain,strongGain,weakGain}={}){
    if(![firstGain,strongGain,weakGain].every(validateGain))
      throw new RangeError('All three explicitly supplied gains must be in 0..1');
    return Object.freeze([
      Object.freeze([firstGain,strongGain,weakGain]),
      Object.freeze([firstGain,weakGain,strongGain])
    ]);
  }
  function apply(source,options){
    validateAudio(source);
    if(!options || typeof options.enabled!=='boolean')
      throw new TypeError('Dynamics requires explicit enabled true/false');
    const output=copy(source);
    if(!options.enabled)return output;

    const {bpm,beatsPerBar,gainsByBar}=options;
    if(typeof bpm!=='number'||!Number.isFinite(bpm)||bpm<=0||
       !Number.isSafeInteger(beatsPerBar)||beatsPerBar<2||beatsPerBar>32||
       !Array.isArray(gainsByBar)||gainsByBar.length<1||
       gainsByBar.some(gains=>!Array.isArray(gains)||
         gains.length!==beatsPerBar||!gains.every(validateGain)))
      throw new RangeError('Explicit bpm, beats per bar and valid 0..1 gain pattern required');
    const framesPerBeat=source.sampleRate*60/bpm;
    if(!Number.isFinite(framesPerBeat)||framesPerBeat<1)
      throw new RangeError('Tempo too fast for the supplied PCM sample rate');
    const period=gainsByBar.length;
    for(let i=0;i<output.channels[0].length;i++){
      const beat=Math.floor(i/framesPerBeat);
      const bar=Math.floor(beat/beatsPerBar)%period;
      const gain=gainsByBar[bar][beat%beatsPerBar];
      for(const channel of output.channels)channel[i]*=gain;
    }
    return output;
  }
  return Object.freeze({alternatingTwoThree,apply});
});
