/* 05-02 Mutosis semantic router. Browser-only, source-backed, provider independent.
   Both input orders map to the same prompt. No network, no game storage. */
(()=>{
'use strict';
const DATA=MUTOSIS_DATA;
const reverseIndex=new Map();
Object.entries(DATA.categories).forEach(([cat,items])=>items.forEach(emoji=>reverseIndex.set(emoji,cat)));
const niceCategory=c=>c.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
function categoryOf(x){return reverseIndex.get(x)}
function routePair(emoji1,emoji2){
 const c1=categoryOf(emoji1),c2=categoryOf(emoji2);
 if(!c1||!c2)throw Error('Unsupported demo emoji');
 let a={emoji:emoji1,category:c1,trait:DATA.traits[emoji1]},b={emoji:emoji2,category:c2,trait:DATA.traits[emoji2]};
 // Route orientation is determined by the named rule, not the order clicked.
 let key=c1===c2?'clone':null;
 if(key && a.emoji.localeCompare(b.emoji)>0)[a,b]=[b,a];
 if(!key){
  const direct=`${a.category}_${b.category}`,rev=`${b.category}_${a.category}`;
  if(DATA.routes[direct])key=direct;
  else if(DATA.routes[rev]){key=rev;[a,b]=[b,a]}
  else {
   const priority=['flag','abstract_symbols','celestial_weather','anatomy_gesture','clothing_fashion','vehicles_transit','pure_smileys'];
   const special=priority.find(cat=>DATA.routes[`${cat}_any`]&&(cat===a.category||cat===b.category));
   if(special){if(b.category===special)[a,b]=[b,a];key=`${special}_any`;}
   else {key='universal_fusion'; if(a.category.localeCompare(b.category)>0 || (a.category===b.category && a.emoji.localeCompare(b.emoji)>0))[a,b]=[b,a];}
  }
 }
 const raw=DATA.routes[key];
 if(!raw)throw Error('No source route '+key);
 const tokens={
  'emoji_A.trait':a.trait,'emoji_B.trait':b.trait,
  'emoji_A.context':niceCategory(a.category),'emoji_B.context':niceCategory(b.category),
  'emoji_A.getName':a.emoji,'emoji_B.getName':b.emoji,
  'emoji_A.name':a.emoji,'emoji_B.name':b.emoji,
  'emoji_A':a.emoji,'emoji_B':b.emoji
 };
 const twist=raw.replace(/\[(emoji_[AB](?:\.trait|\.context|\.getName|\.name)?)\]/g,(_,k)=>tokens[k]||k);
 const prompt=`${twist}, isolated single subject centered in frame, surrealist oil painting, vivid colors, detailed textures, neutral minimalist studio gradient background. Exclude text, logos, captions, watermarks, split screens.`;
 return {key,emojiA:a.emoji,emojiB:b.emoji,categoryA:a.category,categoryB:b.category,prompt};
}

globalThis.MutosisRouter=Object.freeze({routePair,categoryOf,sourceStats:()=>({categories:Object.keys(DATA.categories).length,emoji:Object.values(DATA.categories).flat().length,routePatterns:Object.keys(DATA.routes).length})});
})();
