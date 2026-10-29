/* Development-only Rough Stuff projection checks. Not a player-facing fixture.
   Uses a small DOM adapter to exercise the real Rough Stuff browser controller.
   Does not save drafts, grant ownership, or replace account authorization. */
'use strict';
const assert=require('node:assert/strict');
globalThis.MASHStudioDraftLibrary=require('../studio-draft-library.js');
globalThis.MASHStudioDraftNavigation=require('../studio-draft-navigation.js');

function makeElement(tag){
 const el={
  tag,children:[],dataset:{},className:'',textContent:'',hidden:false,
  disabled:false,style:{},attributes:{},listeners:{},
  classList:{
   values:new Set(),
   toggle(name,value){if(value)this.values.add(name);else this.values.delete(name);},
   contains(name){return this.values.has(name);}
  },
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=children;},
  addEventListener(type,fn){this.listeners[type]=fn;},
  setAttribute(name,value){this.attributes[name]=value;},
  click(){if(!this.disabled&&this.listeners.click)this.listeners.click();}
 };
 return el;
}
const list=makeElement('section'),status=makeElement('p'),trash=makeElement('button');
const paradeNav=makeElement('nav'),paradePrev=makeElement('button'),
 paradeNext=makeElement('button'),paradePosition=makeElement('span');
const sortButtons=['start_date','last_worked','letter_count','total_time']
 .map(sort=>Object.assign(makeElement('button'),{dataset:{sort}}));
const viewButtons=['thumbs','parade']
 .map(view=>Object.assign(makeElement('button'),{dataset:{view}}));
const controls={
 '#drafts':list,'#drafts-status':status,'[data-trash]':trash,
 '#parade-navigation':paradeNav,'#parade-prev':paradePrev,
 '#parade-next':paradeNext,'#parade-position':paradePosition
};
globalThis.document={
 querySelector(selector){return controls[selector]||null;},
 querySelectorAll(selector){return selector==='[data-sort]'?sortButtons:selector==='[data-view]'?viewButtons:[];},
 createElement:makeElement,addEventListener(){}
};
let navigatedTo=null;
globalThis.window={location:{assign(url){navigatedTo=url;}}};
require('../rough-stuff.js');

const draft1={id:'draft1',revision:'rev1',title:'The first draft',type:'Blurblet',
 startedAt:'2026-10-01T10:00:00Z',lastWorkedAt:'2026-10-05T12:00:00Z',
 letterCount:7,totalTimeSeconds:90,reference:{kind:'non_owned',imageId:'other-art'}};
const draft2={id:'draft2',revision:'rev2',title:'Another draft',type:'Meme',
 startedAt:'2026-10-02T10:00:00Z',lastWorkedAt:'2026-10-03T12:00:00Z',
 letterCount:15,totalTimeSeconds:240,reference:null};
const snap={drafts:[draft1,draft2],trashed:[
 {id:'trashed1',title:'Old item',type:'Meme',deletedAt:'2026-10-27T10:00:00Z'}
]};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
 assert.equal(list.children.length,0);
 assert.match(status.textContent,/not connected/);
 window.MASHRoughStuff.setSnapshot(snap);
 assert.equal(list.children.length,2);
 assert.match(list.children[0].children[0].className,/postit/);
 assert.equal(list.children[0].children.at(-1).children[0].disabled,true);
 assert.equal(list.children[0].children.at(-1).children[1].disabled,true);
 sortButtons[2].click();
 assert.equal(list.children[0].children[1].textContent,'Another draft');
 viewButtons[1].click();
 assert.equal(list.classList.contains('parade'),true);
 trash.click();
 assert.equal(list.children.length,1);
 assert.match(list.children[0].children[2].textContent,/IN TRASH · DEADLINE/);
 assert.equal(MASHStudioDraftLibrary.oneDayTrashDeadline('2026-10-27T10:00:00Z'),'2026-10-28T10:00:00.000Z');
 trash.click();
 assert.throws(()=>window.MASHRoughStuff.setSnapshot({drafts:[draft1,draft1],trashed:[]}));
 assert.throws(()=>window.MASHRoughStuff.setSnapshot({drafts:[draft1],trashed:[
  {id:'draft1',type:'Blurblet',title:'Repeat',deletedAt:'2026-10-27T10:00:00Z'}
 ]}));
 assert.equal(list.children.length,2,'Rejected snapshots cannot replace the current view');
 const intents=[];
 window.MASHRoughStuff.setActionHandlers({
  moveToTrash:async intent=>{intents.push(intent);return {applied:true};},
  openDraft:async intent=>{intents.push(intent);return {authorized:true,projectId:'project1'};}
 });
 const row=list.children.find(card=>card.children[1].textContent==='The first draft');
 assert.equal(row.children.at(-1).children[0].disabled,false);
 row.children.at(-1).children[1].click();
 await tick();
 assert.equal(list.children.length,2,'Trash action waits for refreshed server snapshot');
 assert.match(status.textContent,/Awaiting updated account records/);
 assert.equal(intents[0].action,'move-to-trash');
 assert.equal(intents[0].expectedRevision,'rev1');
 assert.equal(intents[0].requiresAuthenticatedServer,true);
 const rowAgain=list.children.find(card=>card.children[1].textContent==='The first draft');
 rowAgain.children.at(-1).children[0].click();
 await tick();
 assert.equal(intents[1].action,'open-in-easel');
 assert.equal(navigatedTo,'easel.html?draftId=draft1&projectId=project1');
 window.MASHRoughStuff.setSnapshot(null);
 assert.equal(list.children.length,0);
 assert.match(status.textContent,/not connected/);
 console.log('Rough Stuff snapshot, sorting, Trash and authorization-intent checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
