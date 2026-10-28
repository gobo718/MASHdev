/* MASHpedition · 13-07 source-catalog interaction only.
   Two tap-selectable primary inputs. Never awards, saves, equips, or claims
   authoritative unlocks. Exact labels come from StudioPigmentMixer data. */
(()=>{
 'use strict';
 const catalog=globalThis.MASHPigmentCatalog;
 const group=document.querySelector('#primaries');
 const selectedText=document.querySelector('#selected-recipe');
 const recipeText=document.querySelector('#recipe-name');
 const sourceNote=document.querySelector('#source-note');
 const picks=[];
 const buttons=[...group.querySelectorAll('[data-primary]')];
 function render(){
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(picks.includes(b.dataset.primary))));
   if(!catalog){selectedText.textContent='Catalog unavailable.';recipeText.textContent='No recipe';return;}
   if(picks.length<2){
     selectedText.textContent=picks.length?picks[0]+' + …':'Choose two primaries.';
     recipeText.textContent='No recipe selected.';
     sourceNote.textContent='';return;
   }
   const match=catalog.lookupFirstTier(picks[0],picks[1]);
   selectedText.textContent=picks[0]+' (1) + '+picks[1]+' (1)';
   if(match.status!=='catalog-match'){
     recipeText.textContent='Recipe not in reviewed catalog.';
     sourceNote.textContent='No new recipe is invented.';return;
   }
   recipeText.textContent=match.name;
   sourceNote.textContent='Reviewed pigment catalog #'+match.catalogNumber+' · '+(match.reviewState==='looks'?'Looks Right':match.reviewState)+' · Not awarded';
 }
 buttons.forEach(button=>button.addEventListener('click',()=>{
   const name=button.dataset.primary;
   if(picks.includes(name))picks.splice(picks.indexOf(name),1);
   else if(picks.length===2){picks.shift();picks.push(name);}
   else picks.push(name);
   render();
 }));
 document.querySelector('#clear-choice').addEventListener('click',()=>{picks.length=0;render();});
 render();
})();
