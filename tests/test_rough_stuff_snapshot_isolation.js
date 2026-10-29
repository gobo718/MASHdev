/* MASHdev 06-07 / 18-09 · Rough Stuff server-snapshot isolation.
   Executes real production Rough Stuff controller and draft read model.
   Test-only records simulate the service boundary; no player-facing sample
   drafts, authentication, saving, grants, deletion, or fake accounts. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const library=require('../studio-draft-library.js');
const navigation=require('../studio-draft-navigation.js');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'rough-stuff.js'),'utf8');
const html=fs.readFileSync(path.join(root,'rough-stuff.html'),'utf8');
let passed=0;
async function check(label,fn){await fn();passed++}
class Element{
 constructor(tag='div',name=''){
  this.tagName=tag;this.name=name;this.children=[];this.parent=null;
  this.dataset={};this.className='';this.textContent='';this.hidden=false;
  this.disabled=false;this.attributes={};this.listeners={};this.title='';
  this.style={};this.scrollLeft=0;
  this.classList={
   contains:key=>this.className.split(/\s+/).includes(key),
   toggle:(key,on)=>{
    const parts=this.className.split(/\s+/).filter(Boolean);
    this.className=(on?[...new Set([...parts,key])]:parts.filter(x=>x!==key)).join(' ');
    return on;
   }
  };
 }
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 addEventListener(event,fn){(this.listeners[event]??=[]).push(fn)}
 click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({target:this})}
 setAttribute(key,value){this.attributes[key]=String(value)}
 querySelectorAll(selector){return selector==='.draft-card'
  ?this.children.filter(node=>node.className.includes('draft-card')):[]}
 getBoundingClientRect(){return {left:5,width:400}}
 scrollTo({left}){this.scrollLeft=left}
 closest(){return null}
}
const ids=['#drafts','#drafts-status','[data-trash]','#parade-navigation',
 '#parade-prev','#parade-next','#parade-position'];
const ui=Object.fromEntries(ids.map(id=>[id,new Element('div',id)]));
const sorts=['start_date','last_worked','letter_count','total_time'].map(name=>
 Object.assign(new Element('button'),{dataset:{sort:name}}));
const views=['thumbs','parade'].map(name=>
 Object.assign(new Element('button'),{dataset:{view:name}}));
const doc={
 querySelector:key=>ui[key]||null,
 querySelectorAll:key=>key==='[data-sort]'?sorts:key==='[data-view]'?views:[],
 createElement:tag=>new Element(tag),addEventListener(){}
};
const navigationLog=[];
const win={location:{assign(href){navigationLog.push(href)}}};
vm.runInNewContext(source,{document:doc,window:win,
 globalThis:{MASHStudioDraftLibrary:library,MASHStudioDraftNavigation:navigation},
 Date,console,matchMedia:()=>({matches:false})
},{filename:'rough-stuff.js'});
const app=win.MASHRoughStuff;
const date='2026-10-27T10:00:00Z';
function draft(id,kind='non_owned'){
 return {id,revision:'rev-'+id,title:'Original '+id,type:'Blurblet',
  startedAt:'2026-10-01T10:00:00Z',lastWorkedAt:'2026-10-05T10:00:00Z',
  letterCount:7,totalTimeSeconds:90,
  reference:{kind,imageId:'image-'+id}};
}
const initial={
 drafts:[draft('one'),draft('two','owned')],
 trashed:[{id:'deleted',title:'Prior item',type:'Meme',deletedAt:date}]
};
const cards=()=>ui['#drafts'].children;
const title=card=>card.children.find(c=>c.className==='draft-title').textContent;
const refClass=card=>card.children[0].className;
const find=id=>cards().find(card=>title(card).includes(id));
const actions=card=>card.children.at(-1).children;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const delay=()=>{let resolve,reject;
 const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
 return {promise,resolve,reject}};
(async()=>{
 await check('starts with no account data and no invented drafts',async()=>{
  assert.equal(cards().length,0);
  assert.match(ui['#drafts-status'].textContent,/not connected/);
 });
 await check('validated snapshot projects exactly the intended two records',async()=>{
  app.setSnapshot(initial);
  assert.equal(cards().length,2);
  assert.match(refClass(cards()[0]),/postit/);
  assert.match(refClass(cards()[1]),/owned/);
 });
 await check('external nested reference edits cannot change a displayed ownership cue',async()=>{
  initial.drafts[0].reference.kind='owned';
  initial.drafts[0].reference.imageId='replacement-private-image';
  sorts[2].click(); // Force projection and re-render from held snapshot.
  assert.match(refClass(find('one')),/postit/);
  assert.doesNotMatch(refClass(find('one')),/owned/);
 });
 await check('external title/type/metrics edits do not replace the accepted snapshot',async()=>{
  initial.drafts[0].title='Counterfeit replacement';
  initial.drafts[0].type='Changed';
  initial.drafts[0].letterCount=800000;
  initial.drafts[0].revision='forged-rev';
  sorts[0].click();
  assert.equal(title(find('one')),'Original one');
  assert.doesNotMatch(cards().map(c=>title(c)).join('|'),/Counterfeit/);
 });
 await check('external array removal or injection cannot add a saved Creation',async()=>{
  initial.drafts.splice(0,2,draft('injected','owned'));
  sorts[1].click();
  assert.equal(cards().length,2);
  assert.ok(find('one')&&find('two'));
  assert.equal(find('injected'),undefined);
 });
 await check('accepted Trash snapshot does not mutate with caller object',async()=>{
  initial.trashed[0].title='Counterfeit Trash';
  initial.trashed.push({id:'new',title:'Injected',type:'Meme',deletedAt:date});
  ui['[data-trash]'].click();
  assert.equal(cards().length,1);
  assert.equal(title(cards()[0]),'Prior item');
  ui['[data-trash]'].click();
 });
 await check('invalid new snapshot cannot replace or revoke the old snapshot',async()=>{
  assert.throws(()=>app.setSnapshot({drafts:[draft('repeat'),draft('repeat')],trashed:[]}));
  assert.equal(cards().length,2);
  assert.ok(find('one')&&find('two'));
 });
 await check('server-bound action receives the original stable revision only',async()=>{
  const intents=[];
  app.setActionHandlers({moveToTrash:async intent=>{intents.push(intent);return {applied:true}}});
  const button=actions(find('one'))[1];
  assert.equal(button.disabled,false);
  button.click();await tick();
  assert.equal(intents.length,1);
  assert.equal(intents[0].expectedRevision,'rev-one');
  assert.equal(intents[0].requiresAuthenticatedServer,true);
  assert.equal(cards().length,2); // No client-authoritative Trash operation.
 });
 await check('new snapshot cancels old pending open without navigating',async()=>{
  const old=delay();
  app.setActionHandlers({openDraft:()=>old.promise});
  actions(find('one'))[0].click();
  app.setSnapshot({drafts:[draft('new')],trashed:[]});
  old.resolve({authorized:true,projectId:'old-project'});
  await tick();
  assert.deepEqual(navigationLog,[]);
  assert.equal(cards().length,1);
  assert.equal(title(cards()[0]),'Original new');
 });
 await check('sign-out snapshot cancels pending open and stays signed out',async()=>{
  const old=delay();
  app.setActionHandlers({openDraft:()=>old.promise});
  actions(cards()[0])[0].click();
  app.setSnapshot(null);
  old.resolve({authorized:true,projectId:'old-project'});
  await tick();
  assert.deepEqual(navigationLog,[]);
  assert.equal(cards().length,0);
  assert.match(ui['#drafts-status'].textContent,/not connected/);
 });
 await check('replacing account handlers cancels action from previous handlers',async()=>{
  app.setSnapshot({drafts:[draft('fresh')],trashed:[]});
  const old=delay();
  app.setActionHandlers({openDraft:()=>old.promise});
  actions(cards()[0])[0].click();
  app.setActionHandlers({});
  old.resolve({authorized:true,projectId:'old-project'});
  await tick();
  assert.deepEqual(navigationLog,[]);
  assert.equal(actions(cards()[0])[0].disabled,true);
 });
 await check('superseded callback rejection cannot overwrite the current snapshot notice',async()=>{
  const stale=delay();
  app.setActionHandlers({openDraft:()=>stale.promise});
  actions(cards()[0])[0].click();
  app.setSnapshot({drafts:[],trashed:[]});
  stale.reject(new Error('Old callback failed'));
  await tick();
  assert.match(ui['#drafts-status'].textContent,/No drafts/);
  assert.doesNotMatch(ui['#drafts-status'].textContent,/Old callback/);
 });
 await check('older async finally never re-enables a newer account action',async()=>{
  app.setSnapshot({drafts:[draft('v1')],trashed:[]});
  const old=delay(),fresh=delay();
  app.setActionHandlers({openDraft:()=>old.promise});
  actions(cards()[0])[0].click();
  app.setSnapshot({drafts:[draft('v2')],trashed:[]});
  app.setActionHandlers({openDraft:()=>fresh.promise});
  actions(cards()[0])[0].click();
  assert.equal(actions(cards()[0])[0].disabled,true);
  old.resolve({authorized:true,projectId:'old-project'});
  await tick();
  assert.equal(actions(cards()[0])[0].disabled,true);
  assert.deepEqual(navigationLog,[]);
  fresh.resolve({authorized:false});
  await tick();
  assert.equal(actions(cards()[0])[0].disabled,false);
  assert.deepEqual(navigationLog,[]);
 });
 await check('unchanged snapshot and current callback still allow a server-approved open',async()=>{
  app.setSnapshot({drafts:[draft('approved')],trashed:[]});
  app.setActionHandlers({openDraft:async()=>({authorized:true,projectId:'project-approved'})});
  actions(cards()[0])[0].click();await tick();
  assert.deepEqual(navigationLog,['easel.html?draftId=approved&projectId=project-approved']);
 });
 await check('sorting, PARADE and one-day Trash remain unchanged',async()=>{
  app.setSnapshot({drafts:[draft('a'),draft('b')],trashed:[
   {id:'deleted',title:'Prior item',type:'Meme',deletedAt:date}
  ]});
  views[1].click();
  assert.equal(ui['#parade-navigation'].hidden,false);
  assert.equal(ui['#parade-position'].textContent,'1 OF 2');
  ui['[data-trash]'].click();
  assert.equal(cards().length,1);
  assert.match(cards()[0].children[2].textContent,/DEADLINE/);
  assert.equal(library.oneDayTrashDeadline(date),'2026-10-28T10:00:00.000Z');
 });
 await check('no additional source UI, local saving or changed geometric contract',async()=>{
  assert.match(html,/rough-stuff\.js\?v=293/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(/);
  assert.doesNotMatch(source,/new Image\(|URL\.createObjectURL/);
  assert.match(source,/snapshotGeneration/);
 });
 console.log('Rough Stuff snapshot isolation: '+passed+' source-backed scenarios PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
