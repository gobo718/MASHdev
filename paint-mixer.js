/* MASHpedition · 13-07 source-catalog interaction only.
   Two tap-selectable primary inputs. Never awards, saves, equips, or claims
   authoritative unlocks. Names and prebaked HEX come from audited spreadsheet records. */
(()=>{
 'use strict';
 const catalog=globalThis.MASHPigmentCatalog;
 const group=document.querySelector('#primaries');
 const selectedText=document.querySelector('#selected-recipe');
 const recipeText=document.querySelector('#recipe-name');
 const sourceNote=document.querySelector('#source-note');
 const hexText=document.querySelector('#recipe-hex');
 const swatch=document.querySelector('#result-swatch');
 function clearSwatch(){swatch.hidden=true;swatch.style.backgroundColor='';swatch.setAttribute('aria-label','No recipe color selected');hexText.textContent='';}
 const picks=[];
 const buttons=[...group.querySelectorAll('[data-primary]')];
 function render(){
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(picks.includes(b.dataset.primary))));
   if(!catalog){selectedText.textContent='Catalog unavailable.';recipeText.textContent='No recipe';sourceNote.textContent='';clearSwatch();return;}
   if(picks.length<2){
     selectedText.textContent=picks.length?picks[0]+' + …':'Choose two primaries.';
     recipeText.textContent='No recipe selected.';
     sourceNote.textContent='';clearSwatch();return;
   }
   const match=catalog.lookupFirstTier(picks[0],picks[1]);
   selectedText.textContent=picks[0]+' (1) + '+picks[1]+' (1)';
   if(match.status!=='catalog-match'){
     recipeText.textContent='Recipe not in reviewed catalog.';
     sourceNote.textContent='No new recipe is invented.';clearSwatch();return;
   }
   recipeText.textContent=match.name;
   hexText.textContent=match.hex;
   swatch.style.backgroundColor=match.hex;
   swatch.setAttribute('aria-label',match.name+' pigment: '+match.hex);
   swatch.hidden=false;
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
