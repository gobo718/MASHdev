/* DOM/canvas simulation for state branches. Browser visual tests remain unverified. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),{Blob}=require('buffer');
const root=fs.existsSync(__dirname+'/../lab.html')?'../':'../PATCH_ONLY/';
const html=fs.readFileSync(__dirname+'/'+root+'lab.html','utf8');
for(const needle of ['class="left-cell emoji-a"','class="left-cell emoji-b"','class="mutosis-row activate"','class="output-area"','class="output-actions output-actions-top"','class="output-actions output-actions-bottom"','src="mutosis-router.js?v=take6-modular"','src="mutosis-mock-adapters.js?v=take6-modular"','src="lab-mock.js?v=take6-modular"'])assert(html.includes(needle),needle);
function boot(scenario){
 class El{
  constructor(key=''){this.key=key;this.children=[];this._html='';this.textContent='';this.disabled=false;this.dataset={};this.handlers={};this.src='';}
  set innerHTML(s){this._html=s;this.children=[];}get innerHTML(){return this._html;}
  append(...c){this.children.push(...c);}addEventListener(n,fn){this.handlers[n]=fn;}
  setAttribute(){}getAttribute(){return this.key;}
  showModal(){this.visible=true;}close(){this.visible=false;}
  click(){if(!this.disabled && this.handlers.click)return this.handlers.click();}
 }
 const elMap=new Map();const el=k=>{if(!elMap.has(k))elMap.set(k,new El(k));return elMap.get(k)};
 const pngHeader=Buffer.alloc(160);Buffer.from([137,80,78,71,13,10,26,10]).copy(pngHeader);pngHeader.writeUInt32BE(1280,16);pngHeader.writeUInt32BE(720,20);
 const context2d={createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},arc(){},fill(){},fillText(){}};
 const canvas=()=>({width:1280,height:720,getContext:()=>context2d,toBlob(cb){cb(new Blob([pngHeader],{type:'image/png'}))}});
 const document={querySelector:el,getElementById:el,querySelectorAll:()=>[],createElement:tag=>tag==='canvas'?canvas():new El(tag)};
 let imageURLs=0;
 const context={document,location:{search:scenario?'?mockSafety='+scenario:''},console,URLSearchParams,URL:{revokeObjectURL(){imageURLs--},createObjectURL(){imageURLs++;return 'blob:mock-image-'+imageURLs}},DataView,Uint8Array,Promise,Blob,Buffer};
 context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-data.js','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-router.js','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'mutosis-mock-adapters.js','utf8'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/'+root+'lab-mock.js','utf8'),context);
 function choose(slot,cat,index=0){
  el('.emoji-'+slot.toLowerCase()).click();
  const group=el('picker-body').children.find(section=>section.children[0]?.textContent.toLowerCase().replaceAll(' ','_')===cat);
  assert(group,cat);
  group.children[1].children[index].click();
 }
 return {el,choose,diag:context.__MUTOSIS_MOCK_DIAGNOSTICS__,getImageCount:()=>el('.output-area').children.filter(x=>x.key==='img').length};
}
const delay=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
 const results=[];
 for(const [scenario,expectPhase,expectAttempts,expectReject,expectImg] of [
  ['', 'accepted',1,0,1],['second','accepted',2,1,1],['third','accepted',3,2,1],['allfail','out-of-order',3,3,0],['providerfail','error',1,0,0]]){
  const x=boot(scenario);x.choose('a','animal',0);x.choose('b','food',0);
  x.el('.activate').click();
  for(let i=0;i<12 && x.diag.snapshot().phase==='running';i++)await delay();
  const s=x.diag.snapshot();
  if(s.phase!==expectPhase)console.log('DETAIL',scenario,s);
  assert.equal(s.phase,expectPhase,scenario+' phase');assert.equal(s.attempts,expectAttempts,scenario+' attempts');
  assert.equal(s.rejections,expectReject,scenario+' rejections');assert.equal(x.getImageCount(),expectImg,scenario+' image count');
  if(scenario===''){
   x.el('.output-actions-top button:first-child').click();
   assert(x.el('mock-status').textContent.includes('No image saved'));
   x.el('.output-actions-bottom button:last-child').click();
   assert(x.el('mock-status').textContent.includes('Nothing submitted'));
   x.el('.output-actions-top button:last-child').click();
   assert(x.el('mock-status').textContent.includes('not decided'));
   x.el('.output-actions-bottom button:first-child').click();
   assert.equal(x.diag.snapshot().phase,'idle');assert.equal(x.getImageCount(),0);
  }
  if(scenario==='allfail')assert(x.el('.activate').disabled);
  if(scenario==='providerfail')assert(x.el('mock-status').textContent.includes('no bonus Token'));
  results.push(`${scenario||'pass'}: ${s.phase}, attempts=${s.attempts}, rejected=${s.rejections}, displayed=${x.getImageCount()}`);
 }
 console.log('PASS 5 simulated state scenarios, disabled out-of-order, guest save/submit guard, manual retry safeguard, discard');results.forEach(x=>console.log(' ✓',x));
}
run().catch(e=>{console.error(e);process.exitCode=1});
