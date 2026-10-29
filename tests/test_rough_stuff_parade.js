/* MASHdev 06-07 · The Rough Stuff PARADE no-swipe navigation.
   Execute against ACTUAL rough-stuff.js and draft-library read model.
   Test-only authoritative snapshots do not create real accounts, images,
   saved drafts, deletion, or a new game UI. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const library=require('../studio-draft-library.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'rough-stuff.html'),'utf8');
const css=fs.readFileSync(path.join(root,'rough-stuff.css'),'utf8');
const source=fs.readFileSync(path.join(root,'rough-stuff.js'),'utf8');
let checks=0;
const test=(name,fn)=>{fn();checks++};
class Element{
 constructor(tag='div',name=''){
   this.tagName=tag;this.name=name;this.children=[];this.parent=null;
   this.dataset={};this.className='';this.textContent='';this.hidden=false;
   this.disabled=false;this.attributes={};this.listeners={};this.style={};
   this.scrollLeft=0;this.scrolls=[];
   this.classList={
     contains:cls=>this.className.split(/\s+/).includes(cls),
     toggle:(cls,on)=>{
       const all=this.className.split(/\s+/).filter(Boolean);
       const active=on??!all.includes(cls);
       this.className=(active?[...new Set([...all,cls])]:all.filter(x=>x!==cls)).join(' ');
       return active;
     }
   };
 }
 setAttribute(key,value){this.attributes[key]=String(value)}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);this.scrollLeft=0}
 addEventListener(name,handler){(this.listeners[name]??=[]).push(handler)}
 click(){for(const handler of this.listeners.click||[])handler({target:this})}
 querySelectorAll(selector){return selector==='.draft-card'
   ? this.children.filter(c=>c.className.includes('draft-card')) : []}
 getBoundingClientRect(){return {left:this.parent
   ? 5+this.parent.children.indexOf(this)*420 : 5,width:400}}
 scrollTo(options){this.scrollLeft=options.left;this.scrolls.push(options)}
 closest(selector){
   if(selector.includes('input')||selector.includes('contenteditable'))return null;
   if(selector==='#drafts,#parade-navigation')
     return this.parent?.name==='drafts'?this.parent:this.name==='parade-navigation'?this:null;
   return null;
 }
}
const named=['#drafts','#drafts-status','[data-trash]',
  '#parade-navigation','#parade-prev','#parade-next','#parade-position'];
const els=Object.fromEntries(named.map(key=>[
  key,new Element('div',key==='[data-trash]'?'trash':key.slice(1))
]));
const sorts=['start_date','last_worked','letter_count','total_time'].map(sort=>
 Object.assign(new Element('button'),{dataset:{sort}})
);
const views=['thumbs','parade'].map(view=>
 Object.assign(new Element('button'),{dataset:{view}})
);
const doc={
 listeners:{},
 querySelector:key=>els[key]||null,
 querySelectorAll:key=>key==='[data-sort]'?sorts:key==='[data-view]'?views:[],
 createElement:tag=>new Element(tag),
 addEventListener(name,handler){(this.listeners[name]??=[]).push(handler)},
 emit(name,event){for(const handler of this.listeners[name]||[])handler(event)}
};
const win={location:{assign(){throw new Error('Unexpected account navigation')}}};
vm.runInNewContext(source,{
 document:doc,window:win,MASHStudioDraftLibrary:library,
 MASHStudioDraftNavigation:null,matchMedia:()=>({matches:false}),
 Date,URLSearchParams,console
},{filename:'rough-stuff.js'});
const app=win.MASHRoughStuff;
const draft=(id,letters)=>({
 id,revision:'rev-'+id,type:'Blurblet',title:id,
 startedAt:'2026-10-01T10:00:00Z',lastWorkedAt:'2026-10-02T10:00:00Z',
 letterCount:letters,totalTimeSeconds:letters*4,reference:null
});
const records={drafts:[draft('d-1',1),draft('d-2',3),draft('d-3',2)],
 trashed:[{id:'del-1',type:'Blurblet',title:'In Trash',deletedAt:'2026-10-26T00:00:00Z'}]};
test('No accounts: empty state has hidden PARADE controls',()=>{
 assert.equal(els['#parade-navigation'].hidden,true);
 assert.match(els['#drafts-status'].textContent,/not connected/);
});
test('An authorized read-model snapshot does not invent player ownership',()=>{
 app.setSnapshot(records);
 assert.equal(els['#drafts'].children.length,3);
 assert.equal(els['#parade-navigation'].hidden,true);
 const actions=els['#drafts'].children[0].children.at(-1).children;
 assert.equal(actions[0].disabled,true);
 assert.equal(actions[1].disabled,true);
});
test('PARADE exposes two tap buttons and a position label',()=>{
 views[1].click();
 assert.equal(els['#parade-navigation'].hidden,false);
 assert.equal(els['#parade-position'].textContent,'1 OF 3');
 assert.equal(els['#parade-prev'].attributes['aria-disabled'],'true');
 assert.equal(els['#parade-next'].attributes['aria-disabled'],'false');
});
test('NEXT/PREV moves through exact existing cards without a swipe',()=>{
 els['#parade-next'].click();
 assert.equal(els['#parade-position'].textContent,'2 OF 3');
 assert.equal(els['#drafts'].scrollLeft,420);
 els['#parade-next'].click();
 assert.equal(els['#parade-position'].textContent,'3 OF 3');
 assert.equal(els['#parade-next'].attributes['aria-disabled'],'true');
 const prior=els['#drafts'].scrolls.length;
 els['#parade-next'].click();
 assert.equal(els['#drafts'].scrolls.length,prior);
 els['#parade-prev'].click();
 assert.equal(els['#parade-position'].textContent,'2 OF 3');
});
test('ArrowRight on a PARADE card moves; modified keys are ignored',()=>{
 let prevented=false;
 const card=els['#drafts'].children[0];
 const event=(key,extra={})=>({
  key,target:card,defaultPrevented:false,repeat:false,
  altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,
  preventDefault(){prevented=true},...extra
 });
 doc.emit('keydown',event('ArrowRight'));
 assert.equal(prevented,true);
 assert.equal(els['#parade-position'].textContent,'3 OF 3');
 prevented=false;
 doc.emit('keydown',event('ArrowLeft',{ctrlKey:true}));
 assert.equal(prevented,false);
 assert.equal(els['#parade-position'].textContent,'3 OF 3');
});
test('Sorting uses original draft-library field and resets the PARADE cursor',()=>{
 sorts[2].click();
 assert.equal(els['#parade-position'].textContent,'1 OF 3');
 assert.equal(els['#drafts'].children[0].children.find(
  x=>x.className==='draft-title').textContent,'d-2');
});
test('Trash hides controls, and returning to PARADE resets position',()=>{
 els['[data-trash]'].click();
 assert.equal(els['#parade-navigation'].hidden,true);
 assert.equal(els['#drafts'].children.length,1);
 views[1].click();
 assert.equal(els['#parade-navigation'].hidden,false);
 assert.equal(els['#parade-position'].textContent,'1 OF 3');
});
test('One draft or no authorized snapshot hides empty navigation',()=>{
 app.setSnapshot({drafts:[draft('only',1)],trashed:[]});
 assert.equal(els['#parade-navigation'].hidden,true);
 app.setSnapshot(null);
 assert.equal(els['#parade-navigation'].hidden,true);
 assert.equal(els['#drafts'].children.length,0);
});
test('Latest assets and no mandatory swipe/implicit persistence',()=>{
 assert.match(html,/rough-stuff\.js\?v=293/);
 assert.match(html,/rough-stuff\.css\?v=293/);
 assert.match(css,/\.parade-navigation\[hidden\]\{display:none\}/);
 assert.match(source,/behavior:reduce\?'auto':'smooth'/);
 assert.doesNotMatch(source,/localStorage|fetch\(/);
});
console.log('Rough Stuff PARADE: '+checks+' game-UI regression scenarios PASS');
