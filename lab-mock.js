/* Take 6 / 05-02 + 18-05 — local-only Laboratory interaction harness.
   NEVER accepts outside/AI image bytes: candidate images are generated locally by
   the mock canvas adapter. MOCK safety scenarios are controlled fixtures, NOT
   actual content moderation. Production adapter remains DISCONNECTED. */
(()=>{
'use strict';
const DATA=MUTOSIS_DATA;
const router=globalThis.MutosisRouter;
const adapters=globalThis.MutosisMockAdapters;
if(!router||!adapters||adapters.kind!=='local-qa-fixtures-only')throw Error('Missing Laboratory mock modules');
const {routePair,categoryOf}=router;
const niceCategory=c=>c.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const screen=document.querySelector('.machine-screen-placeholder');
const out=document.querySelector('.output-area');
const status=document.getElementById('mock-status');
const picker=document.getElementById('emoji-picker');
const pickerBody=document.getElementById('picker-body');
const pickerSlot=document.getElementById('picker-slot');
const activate=document.querySelector('.activate');
const buttons={
 A:document.querySelector('.emoji-a'),B:document.querySelector('.emoji-b'),
 save:document.querySelector('.output-actions-top button:first-child'),
 retry:document.querySelector('.output-actions-top button:last-child'),
 discard:document.querySelector('.output-actions-bottom button:first-child'),
 submit:document.querySelector('.output-actions-bottom button:last-child')
};
const state={A:null,B:null,phase:'idle',attempts:0,rejections:0,lastResult:null,objectURL:null,run:0,scenario:new URLSearchParams(location.search).get('mockSafety')||'pass',history:[]};
const scenarios=['pass','second','third','allfail','providerfail'];
if(!scenarios.includes(state.scenario))state.scenario='pass';
function note(message){status.textContent=`LOCAL MOCK · ${message}`;state.history.push(message);}
function setScreen(message){screen.textContent=message;screen.title=message;}
function releaseImage(){if(state.objectURL)URL.revokeObjectURL(state.objectURL);state.objectURL=null;out.innerHTML='<div class="output-label">OUTPUT AREA</div>';}
function present(phase,message){state.phase=phase;screen.dataset.phase=phase;setScreen(message);updateButtons();}
function updateButtons(){
 activate.disabled=state.phase==='running'||state.phase==='out-of-order'||state.phase==='accepted';
 activate.title=state.phase==='accepted'?'Discard the current result before creating another':state.phase==='out-of-order'?'Machine out of order until diagnosed and repaired':'';
 buttons.save.disabled=state.phase!=='accepted';
 buttons.retry.disabled=state.phase!=='accepted';
 buttons.discard.disabled=!['accepted','running','error'].includes(state.phase);
 buttons.submit.disabled=state.phase!=='accepted';
}
function promptForAttempt(base,number){
 if(number===1)return base;
 if(number===2)return `${base} Safe and gentle imagery only; remove concerning elements.`;
 return 'Unmistakably safe, friendly, nonviolent studio illustration of the two selected emoji themes; no injury or disturbing content.';
}
function tokenPreview(attempt){
 if(attempt===1)return '';
 return attempt===2?'Bonus Token preview: current Trick-or-Treat level; not awarded or saved.':'Upgraded bonus Token preview: one level above current Trick-or-Treat level; not awarded or saved.';
}
async function generate(){
 if(state.phase==='running'||state.phase==='out-of-order')return;
 if(state.phase==='accepted'){note('Discard the current result before starting a new one.');return}
 if(!state.A||!state.B){note('Choose EMOJI A and EMOJI B first.');return}
 const job=++state.run;
 state.attempts=0;state.rejections=0;state.lastResult=null;
 releaseImage();present('running','PREPARING LOCAL MOCK');
 let pair;
 try{pair=routePair(state.A,state.B)}catch(err){present('error','ROUTER ERROR');note(err.message);return}
 for(let attempt=1;attempt<=3;attempt++){
  if(job!==state.run)return;
  state.attempts=attempt;
  setScreen(`MOCK · ATTEMPT ${attempt}/3 · CHECKING BEFORE DISPLAY`);
  note(`Source route ${pair.key}. Attempt ${attempt}: local image fixture then mock safety check.`);
  try{
   const candidate=await adapters.generate({pair,attempt,scenario:state.scenario,prompt:promptForAttempt(pair.prompt,attempt)});
   if(job!==state.run)return;
   const allowed=await adapters.review(candidate,attempt,state.scenario);
   if(job!==state.run)return;
   if(!allowed){state.rejections++;state.history.push(`Rejected in mock scenario ${attempt}`);continue;}
   const url=URL.createObjectURL(candidate.blob);
   state.objectURL=url;
   out.innerHTML='';
   const img=document.createElement('img');img.src=url;img.alt=`Local mock artwork fixture combining ${state.A} and ${state.B}. Not AI-generated.`;
   img.className='mock-result';out.append(img);
   state.lastResult={pair,attempt,kind:candidate.kind,width:candidate.width,height:candidate.height,bytes:candidate.blob.size};
   present('accepted',`MOCK ACCEPTED · ${attempt}/3`);
   note(`Accepted local mock image, ${candidate.width}×${candidate.height}. ${tokenPreview(attempt)||'No safety-retry bonus.'}`);
   return;
  }catch(err){
   if(job!==state.run)return;
   present('error','IMAGE SERVICE ERROR');
   note(`${err.message}. Operational failure: NOT a safety rejection; no bonus Token.`);
   return;
  }
 }
 if(job!==state.run)return;
 present('out-of-order','OUT OF ORDER');
 note('All 3 MOCK safety checks failed. Upgraded bonus Token would be due, but none was granted or saved. Real machine must stay out of order until diagnosis and repair.');
}
function choose(slot,emoji){
 if(state.phase==='running'||state.phase==='accepted'||state.phase==='out-of-order'){note('Discard current result or repair machine before changing inputs.');return}
 state[slot]=emoji;buttons[slot].textContent=`EMOJI ${slot}  ${emoji}`;
 note(`Emoji ${slot} selected: ${emoji} (${niceCategory(categoryOf(emoji))}).`);
 picker.close();
}
function openPicker(slot){
 if(['running','accepted','out-of-order'].includes(state.phase)){note('Finish or discard this result before changing inputs.');return}
 pickerSlot.textContent=slot;
 pickerBody.innerHTML='';
 Object.entries(DATA.categories).forEach(([cat,items])=>{
  const group=document.createElement('section');group.className='picker-category';
  const h=document.createElement('h3');h.textContent=niceCategory(cat);group.append(h);
  const shelf=document.createElement('div');shelf.className='picker-grid';
  items.forEach(emoji=>{
   const button=document.createElement('button');button.type='button';button.textContent=emoji;button.setAttribute('aria-label',`${emoji} in ${niceCategory(cat)}`);
   button.addEventListener('click',()=>choose(slot,emoji));shelf.append(button);
  });
  group.append(shelf);pickerBody.append(group);
 });
 picker.showModal();
}
buttons.A.addEventListener('click',()=>openPicker('A'));
buttons.B.addEventListener('click',()=>openPicker('B'));
document.getElementById('close-picker').addEventListener('click',()=>picker.close());
activate.addEventListener('click',generate);
buttons.discard.addEventListener('click',()=>{
 state.run++;releaseImage();state.lastResult=null;present('idle','READY');note('Result discarded locally. No vision, plaque, storage or rewards were invoked.');
});
buttons.save.addEventListener('click',()=>note('SAVE not connected: account + private vault + fingerprint + Genreactrix vision required. No image saved.'));
buttons.submit.addEventListener('click',()=>note('SUBMIT not connected: consent, account, moderation and public FYC server required. Nothing submitted.'));
buttons.retry.addEventListener('click',()=>note('Player RETRY behavior is not decided. Automatic safety retries already run inside ACTIVATE. No action taken.'));
for(const el of document.querySelectorAll('.field,.dial,.mosaics-journal,.presets')){
 el.addEventListener('click',()=>note(`${el.getAttribute('aria-label')||el.textContent.trim()} remains unconnected in the accepted v282 page.`));
}
updateButtons();setScreen('CHOOSE EMOJI A AND B');
if(state.scenario!=='pass')note(`TEST SCENARIO: ${state.scenario}. Mock safety outcomes only, never real moderation.`);
// Read-only browser test hooks. Never add gameplay privileges or account status here.
window.__MUTOSIS_MOCK_DIAGNOSTICS__={
 snapshot:()=>({A:state.A,B:state.B,phase:state.phase,attempts:state.attempts,rejections:state.rejections,scenario:state.scenario,lastResult:state.lastResult,history:[...state.history]}),
 previewRoute:(a,b)=>routePair(a,b),
 sourceStats:router.sourceStats
};
})();
