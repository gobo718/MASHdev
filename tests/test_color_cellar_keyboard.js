/* MASHdev · 13-08 / 19-03 · Color Cellar physical-shelf keyboard access.
   Execute the real color-cellar.js against the actual 711-recipe catalog.
   DOM geometry is simulated ONLY in the test, not added to the game.
   No palette purchase, ownership, Mutosis, accounts, or new UI invented. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const pigment=require('../pigment-catalog.js');
const source=fs.readFileSync(path.join(__dirname,'..','color-cellar.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','color-cellar.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','color-cellar.css'),'utf8');
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
class Element{
 constructor(tag){
  this.tagName=tag;this.className='';this.dataset={};this.title='';
  this.children=[];this.parentElement=null;this.tabIndex=-1;this.hidden=false;
  this.textContent='';this.attributes={};this.listeners={};this.style={
   _props:{},setProperty(k,v){this._props[k]=String(v)},
   getPropertyValue(k){return this._props[k]||''}
  };
 }
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}
 replaceChildren(...nodes){for(const node of this.children)node.parentElement=null;this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
 dispatch(name,event){for(const fn of this.listeners[name]||[])fn(event)}
 contains(node){for(let p=node;p;p=p.parentElement)if(p===this)return true;return false}
 closest(selector){
  let node=this;
  while(node){
   if(selector==='[data-inspect-kind]'&&node.dataset.inspectKind)return node;
   if(selector.startsWith('.')&&node.className.split(' ').includes(selector.slice(1)))return node;
   node=node.parentElement;
  }
  return null;
 }
 querySelectorAll(selector){
  const found=[];
  const walk=parent=>{for(const node of parent.children){
   if(selector==='[data-inspect-kind]'&&node.dataset.inspectKind)found.push(node);
   else if(selector.startsWith('.')&&node.className.split(' ').includes(selector.slice(1)))found.push(node);
   walk(node);
  }};walk(this);return found;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 focus(){
  doc.activeElement=this;
  doc.display.dispatch('focusin',{target:this});
 }
 getBoundingClientRect(){
  if(this.dataset.inspectKind){
   const shelf=this.closest('.shelf')||this.closest('.case-shelf');
   const siblings=shelf?.children||[];
   const col=siblings.indexOf(this);
   const small=this.className!=='jar';
   const box={width:small?12:36,height:small?17:45};
   if(this.closest('.bookcase')){
    const shelfIndex=shelf.parentElement.children.indexOf(shelf);
    return {left:100+col*70,top:80+shelfIndex*90,...box};
   }
   const room=this.closest('.cases'),caseEl=this.closest('.case');
   const caseIndex=room.children.indexOf(caseEl);
   const rowIndex=caseEl.children.indexOf(shelf);
   return {left:40+caseIndex*150+col*12,top:80+rowIndex*42,...box};
  }
  return {left:0,top:0,width:100,height:80};
 }
}
const doc={activeElement:null};
const display=new Element('section'),inspector=new Element('aside');
inspector.hidden=true;doc.display=display;
const radios=Array.from({length:7},(_,index)=>{
 const node=new Element('input');node.value=String(index+1);return node;
});
const document={
 getElementById:id=>id==='display'?display:id==='cellar-inspector'?inspector:null,
 createElement:tag=>new Element(tag),
 querySelectorAll:selector=>selector==='input[name="stage"]'?radios:[]
};
const runtime={
 document,globalThis:{MASHPigmentCatalog:pigment},
 requestAnimationFrame:()=>42,cancelAnimationFrame:()=>{},
 addEventListener:()=>{},console
};
vm.runInNewContext(source,runtime,{filename:'color-cellar.js'});
const items=()=>display.querySelectorAll('[data-inspect-kind]');
const tabbables=()=>items().filter(item=>item.tabIndex===0);
const stage=n=>radios[n-1].dispatch('change',{target:radios[n-1]});
const event=(target,key,extra={})=>({
 target,key,defaultPrevented:false,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,
 preventDefault(){this.defaultPrevented=true},...extra
});
const arrow=(target,key,extra={})=>{
 const e=event(target,key,extra);display.dispatch('keydown',e);return e;
};
const click=target=>display.dispatch('click',{target});
test('initial five primaries stay in accepted 3/2 bookshelf arrangement',()=>{
 assert.equal(items().length,5);
 assert.deepEqual(display.querySelectorAll('.shelf').map(row=>row.children.length),[3,2]);
 assert.deepEqual(items().map(item=>item.dataset.inspectName),
  ['RED','YELLOW','BLUE','WHITE','BLACK']);
 assert.equal(tabbables().length,1);
});
test('Enter inspects first primary without granting it',()=>{
 const e=arrow(items()[0],'Enter');
 assert.equal(e.defaultPrevented,true);
 assert.match(inspector.textContent,/RED · #FF2E5B/);
 assert.match(inspector.textContent,/Reference only; not an owned or equipped color/);
});
test('ArrowRight travels across actual top shelf',()=>{
 const original=items()[0];
 const e=arrow(original,'ArrowRight');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[1]);
 assert.equal(tabbables().length,1);
 assert.equal(original.tabIndex,-1);
});
test('ArrowDown follows physical bookshelf row rather than flat source order',()=>{
 items()[1].focus();const e=arrow(items()[1],'ArrowDown');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[4]);
 assert.equal(tabbables().length,1);
});
test('ArrowUp returns to top shelf without losing focus',()=>{
 const e=arrow(items()[4],'ArrowUp');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[1]);
});
test('Up at first shelf cannot jump to the last catalog entry',()=>{
 items()[0].focus();const e=arrow(items()[0],'ArrowUp');
 assert.equal(e.defaultPrevented,false);
 assert.equal(doc.activeElement,items()[0]);
});
test('Stage change does not steal focus from its stage radio button',()=>{
 const radio=radios[1];doc.activeElement=radio;stage(2);
 assert.equal(doc.activeElement,radio);
 assert.equal(items().length,15);
 assert.equal(tabbables().length,1);
});
test('Stage 2 arrows follow real three shelf rows',()=>{
 const first=items()[1];first.focus();const e=arrow(first,'ArrowDown');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[6]);
});
test('Stage 3 preserves 41 jars plus three Earthy buckets and two cases',()=>{
 stage(3);
 assert.equal(items().length,44);
 assert.equal(display.querySelectorAll('.case').length,2);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='earthy').length,3);
 assert.equal(tabbables().length,1);
});
test('Case shelves use physical Up/Down rather than list index step',()=>{
 const jar=items()[1];jar.focus();
 const e=arrow(jar,'ArrowDown');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[7]);
});
test('Cross-case movement follows visible horizontal direction',()=>{
 const left=items()[5];left.focus();const e=arrow(left,'ArrowRight');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement.closest('.case'),
  display.querySelectorAll('.case')[1]);
});
test('Stage 4 maintains 84 jars, six buckets and four accepted cases',()=>{
 stage(4);assert.equal(items().length,90);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='earthy').length,6);
 assert.equal(display.querySelectorAll('.case').length,4);
});
test('Stage 5 maintains 168 jars, nine buckets and five accepted cases',()=>{
 stage(5);assert.equal(items().length,177);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='earthy').length,9);
 assert.equal(display.querySelectorAll('.case').length,5);
});
test('Stage 6 maintains 278 jars, nine buckets and eight accepted cases',()=>{
 stage(6);assert.equal(items().length,287);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='earthy').length,9);
 assert.equal(display.querySelectorAll('.case').length,8);
});
test('Stage 7 preserves ALL 500 paints and nine buckets, eleven cases',()=>{
 stage(7);assert.equal(items().length,509);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='paint').length,500);
 assert.equal(items().filter(x=>x.dataset.inspectKind==='earthy').length,9);
 assert.equal(display.querySelectorAll('.case').length,11);
 assert.equal(tabbables().length,1);
});
test('Home/End span the accepted 509 objects without extra Tab stops',()=>{
 items()[87].focus();
 const e=arrow(items()[87],'End');assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,items()[508]);
 arrow(items()[508],'Home');
 assert.equal(doc.activeElement,items()[0]);
 assert.equal(tabbables().length,1);
});
test('Touch updates the inspector and next keyboard entry point',()=>{
 const earthy=items()[505];click(earthy);
 assert.equal(doc.activeElement,earthy);
 assert.equal(tabbables()[0],earthy);
 assert.match(inspector.textContent,/EARTHY BUCKET/);
 assert.match(inspector.textContent,/Reference only/);
});
test('Guard browser shortcuts and modified arrow keys',()=>{
 items()[5].focus();
 for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey']){
  const e=arrow(items()[5],'ArrowRight',{[modifier]:true});
  assert.equal(e.defaultPrevented,false);
  assert.equal(doc.activeElement,items()[5]);
 }
});
test('Stage reset clears read-only inspection, not local inventory',()=>{
 stage(1);assert.equal(items().length,5);
 assert.equal(inspector.hidden,true);
 assert.equal(tabbables()[0],items()[0]);
 assert.doesNotMatch(source,/localStorage|fetch\(/);
});
test('Jar dimensions and CSS selectors remain unmodified',()=>{
 assert.match(css,/aspect-ratio:3\/4/);
 assert.match(css,/aspect-ratio:6\/5/);
 assert.match(html,/color-cellar\.js\?v=298/);
});
console.log('Color Cellar keyboard: '+scenarios+' source-backed navigation scenarios PASS');
