/* MASHpedition · jobs 11-03 / 17-08 · atomic Music Manipulations.
   CN-00516 tempo shift and CN-00517 beat deletion/meter conversion.
   Crappy Waltz AUD-00041 is ONLY an explicitly parameterized composition
   of these two operations, not a deployed Curse or Token.
   Score format is a beat-grid: {bpm,meter:{numerator,denominator},
   measures:[ [beat1,beat2,...], ... ]}. Each beat's event payload is
   deliberately opaque: no invented instruments, synthesized audio or
   soundfont selection. Source data is never modified. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MASHMusicRhythm=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  function validate(score){
    if(!score||typeof score!=='object'||Array.isArray(score)||
       typeof score.bpm!=='number'||!Number.isFinite(score.bpm)||score.bpm<=0||
       !score.meter||!Number.isSafeInteger(score.meter.numerator)||
       score.meter.numerator<2||
       !Number.isSafeInteger(score.meter.denominator)||
       ![1,2,4,8,16,32].includes(score.meter.denominator)||
       !Array.isArray(score.measures)||score.measures.length<1||
       score.measures.some(measure=>!Array.isArray(measure)||
         measure.length!==score.meter.numerator))
      throw new TypeError('Expected nonempty beat-grid score with valid bpm and meter');
    for(const measure of score.measures)
      if(measure.some(beat=>!Array.isArray(beat)))
        throw new TypeError('Each beat must contain an array of authored events');
  }
  function copy(score){
    validate(score);
    if(typeof structuredClone!=='function')
      throw new Error('Beat-grid copying requires structuredClone');
    return structuredClone(score);
  }
  function shiftTempo(source,options){
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('Tempo shift requires explicit enabled true/false');
    const output=copy(source);
    if(!options.enabled)return output;
    const factor=options.factor;
    if(typeof factor!=='number'||!Number.isFinite(factor)||factor<=0||
       !Number.isFinite(source.bpm*factor)||source.bpm*factor<=0)
      throw new RangeError('Tempo factor must give a positive finite bpm');
    output.bpm=source.bpm*factor;
    return output;
  }
  function removeBeat(source,options){
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('Beat removal requires explicit enabled true/false');
    const output=copy(source);
    if(!options.enabled)return output;
    const i=options.beatIndex;
    if(!Number.isSafeInteger(i)||i<0||i>=source.meter.numerator)
      throw new RangeError('beatIndex must identify an existing zero-based beat');
    output.measures=output.measures.map(measure=>
      measure.filter((_,index)=>index!==i)
    );
    output.meter.numerator=source.meter.numerator-1;
    return output;
  }
  function crappyWaltz(source,options){
    if(!options||typeof options.enabled!=='boolean')
      throw new TypeError('Crappy Waltz requires explicit enabled true/false');
    const original=copy(source);
    if(!options.enabled)return original;
    if(source.meter.numerator!==4||source.meter.denominator!==4)
      throw new RangeError('Crappy Waltz expects an original 4/4 beat grid');
    // The FIRST original beat is removed, not the last, and not a random beat.
    // No global slowdown ratio is assumed: the game must choose it later.
    const factor=options.tempoFactor;
    if(typeof factor!=='number'||!Number.isFinite(factor)||factor<=0||factor>=1)
      throw new RangeError('Crappy Waltz needs an explicit slowing factor between 0 and 1');
    return shiftTempo(removeBeat(original,{enabled:true,beatIndex:0}),
      {enabled:true,factor});
  }
  return Object.freeze({shiftTempo,removeBeat,crappyWaltz});
});
