/* MASHpedition 13-02: Chromatic Amalgamator first-tier additive-color recipes.
   Source-only validation. No game awards or local inventory. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.MASHChromaticAmalgamatorCore=api;
})(typeof globalThis!=='undefined'?globalThis:null,function(root){
 'use strict';
 const INTRODUCTION_ORDER=Object.freeze(['BLUE','RED','GREEN']);
 const FIRST_TIER=Object.freeze({
  'GREEN+RED':'YELLOW',
  'BLUE+GREEN':'CYAN',
  'BLUE+RED':'MAGENTA'
 });
 const BOOKED_OUTPUTS=Object.freeze(['YELLOW','CYAN','MAGENTA']);
 const RGB=new Set(INTRODUCTION_ORDER);
 const isStringArray=value=>Array.isArray(value)&&value.every(x=>typeof x==='string');
 function eligibleAfterPigmentMixes(completedPigmentPairKeys){
  if(!isStringArray(completedPigmentPairKeys))return false;
  const core=root?.MASHPaintMixerCore;
  if(typeof core?.firstTierKeys!=='function')
   throw new Error('Load the existing Paint Mixer core for milestone validation');
  const completed=new Set(completedPigmentPairKeys);
  return core.firstTierKeys().every(key=>completed.has(key));
 }
 function normalizeInputs(inputs){
  if(!Array.isArray(inputs)||inputs.length!==2)return null;
  const names=[];
  for(const item of inputs){
   if(!item||typeof item!=='object'||Array.isArray(item)||
      !RGB.has(item.chromalucent)||item.units!==1||
      names.includes(item.chromalucent))return null;
   names.push(item.chromalucent);
  }
  return names.sort().join('+');
 }
 function planMix({inputs,completedPigmentPairKeys,availableChromalucents}={}){
  if(!eligibleAfterPigmentMixes(completedPigmentPairKeys))
   return {status:'machine-locked',requiresAuthenticatedServer:true,awardsGranted:0};
  const recipeKey=normalizeInputs(inputs);
  if(!recipeKey||!Object.hasOwn(FIRST_TIER,recipeKey))
   return {status:'invalid-inputs',requiresAuthenticatedServer:true,awardsGranted:0};
  if(!isStringArray(availableChromalucents)||
     !recipeKey.split('+').every(name=>availableChromalucents.includes(name)))
   return {status:'inputs-unavailable',recipeKey,requiresAuthenticatedServer:true,awardsGranted:0};
  return {status:'recipe-match',recipeKey,result:FIRST_TIER[recipeKey],
   resultKind:'chromalucent',requiresAuthenticatedServer:true,awardsGranted:0};
 }
 return Object.freeze({INTRODUCTION_ORDER,FIRST_TIER,BOOKED_OUTPUTS,
  eligibleAfterPigmentMixes,normalizeInputs,planMix});
});
