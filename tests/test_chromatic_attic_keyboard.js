/* MASHdev Chromatic Attic source-backed keyboard regression.
   Keeps all 3/6/13/22 reference crystals and accepted floating artwork;
   never grants or equips an image/material or fabricates a player account. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const js=fs.readFileSync(path.join(__dirname,'..','chromatic-attic.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','chromatic-attic.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','chromatic-attic.css'),'utf8');
let checks=0;
const test=(label,fn)=>{fn();checks++};
class Element {
 constructor(tag,document){
  this.tag=tag;this.doc=document;this.parentElement=null;this.children=[];
  this.className='';this.dataset={};this.attributes={};this.textContent='';
  this.style={setProperty(k,v){this[k]=v}};
  this.hidden=false;this.tabIndex=-1;this.listeners={};this.value='';
 }
 append(...items){
  for(const item of items){item.parentElement=this;this.children.push(item)}
 }
 replaceChildren(...items){this.children=[];this.append(...items)}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(name,handler){(this.listeners[name]??=[]).push(handler)}
 dispatch(name,event){for(const fn of this.listeners[name]||[])fn(event)}
 contains(node){while(node){if(node===this)return true;node=node.parentElement}return false}
 closest(sel){
  let item=this;
  while(item){
   if(sel==='.crystal-row'&&item.className==='crystal-row')return item;
   if(sel==='.crystal[data-crystal-hex]'&&item.className==='crystal'&&item.dataset.crystalHex)return item;
   item=item.parentElement;
  }
  return null;
 }
 querySelectorAll(sel){
  const found=[];
  const look=el=>{for(const c of el.children){
   if(sel==='.crystal-row'&&c.className==='crystal-row')found.push(c);
   if(sel==='.crystal[data-crystal-hex]'&&c.className==='crystal'&&c.dataset.crystalHex)found.push(c);
   look(c);
  }};
  look(this);return found;
 }
 getBoundingClientRect(){
  if(this.className!=='crystal')return {left:0,width:800};
  const row=this.closest('.crystal-row');
  const index=row.children.indexOf(this);
  // Staggered rows are horizontally centered in the actual layout.
  return {left:400+(index-(row.children.length-1)/2)*65-20,width:40};
 }
 focus(){
  this.doc.activeElement=this;
  this.doc.display.dispatch('focusin',{target:this});
 }
}
const d={activeElement:null};
const display=new Element('section',d);d.display=display;
const inspector=new Element('aside',d);
const radios=[1,2,3,4].map(number=>{
 const item=new Element('input',d);item.value=String(number);return item;
});
const document={
 createElement:tag=>new Element(tag,d),
 getElementById:id=>id==='crystal-display'?display:id==='crystal-inspector'?inspector:null,
 querySelectorAll:selector=>selector==='input[name="stage"]'?radios:[],
};
vm.runInNewContext(js,{document,console},{filename:'chromatic-attic.js'});
const crystals=()=>display.querySelectorAll('.crystal[data-crystal-hex]');
const rows=()=>display.querySelectorAll('.crystal-row');
const event=(target,key,extra={})=>({
 target,key,defaultPrevented:false,altKey:false,ctrlKey:false,
 metaKey:false,shiftKey:false,
 preventDefault(){this.defaultPrevented=true},...extra
});
const press=(target,key,extra={})=>{
 const e=event(target,key,extra);display.dispatch('keydown',e);return e;
};
const click=target=>display.dispatch('click',{target});
const stage=i=>radios[i-1].dispatch('change',{target:radios[i-1]});
const focused=()=>crystals().indexOf(d.activeElement);
const tabbables=()=>crystals().filter(c=>c.tabIndex===0);

test('Stage 1 preserves RGB colors and one keyboard Tab entry',()=>{
 assert.deepEqual(rows().map(row=>row.children.length),[3]);
 assert.deepEqual(crystals().map(item=>item.dataset.crystalName),['RED','GREEN','BLUE']);
 assert.deepEqual(tabbables().map(item=>item.dataset.crystalName),['RED']);
});
test('Enter inspects the original HEX without equipping anything',()=>{
 const e=press(crystals()[0],'Enter');
 assert.equal(e.defaultPrevented,true);
 assert.match(inspector.textContent,/RED · #FF244D/);
 assert.match(inspector.textContent,/Reference preview only; not owned or equipped/);
});
test('ArrowRight keeps existing sequential order and a single active Tab stop',()=>{
 const e=press(crystals()[0],'ArrowRight');
 assert.equal(e.defaultPrevented,true);
 assert.equal(focused(),1);
 assert.deepEqual(tabbables().map(c=>c.dataset.crystalName),['GREEN']);
});
test('ArrowLeft returns to previous reference item',()=>{
 press(crystals()[1],'ArrowLeft');
 assert.equal(focused(),0);
 assert.deepEqual(tabbables().map(c=>c.dataset.crystalName),['RED']);
});
test('ArrowUp at top edge does not consume the key or lose focus',()=>{
 const e=press(crystals()[0],'ArrowUp');
 assert.equal(e.defaultPrevented,false);
 assert.equal(focused(),0);
});
test('Stage 2 re-renders three-plus-three without stealing radio focus',()=>{
 const radio=radios[1];d.activeElement=radio;stage(2);
 assert.deepEqual(rows().map(r=>r.children.length),[3,3]);
 assert.equal(d.activeElement,radio);
 assert.equal(crystals().length,6);
 assert.equal(tabbables().length,1);
});
test('Down moves to same geometric column in the next row',()=>{
 crystals()[1].focus();
 const e=press(crystals()[1],'ArrowDown');
 assert.equal(e.defaultPrevented,true);
 assert.equal(focused(),4);
 assert.deepEqual(tabbables().map(c=>c.dataset.crystalName),[crystals()[4].dataset.crystalName]);
});
test('Up returns from lower row without changing stage',()=>{
 press(crystals()[4],'ArrowUp');
 assert.equal(focused(),1);
 assert.equal(crystals().length,6);
});
test('Stage 3 remains seven plus six, and vertical motion uses staggered rows',()=>{
 stage(3);
 assert.deepEqual(rows().map(r=>r.children.length),[7,6]);
 crystals()[3].focus();
 press(crystals()[3],'ArrowDown');
 assert.ok([9,10].includes(focused()));
 assert.equal(tabbables().length,1);
});
test('Stage 4 preserves 7 / 8 / 7 accepted crystal rows',()=>{
 stage(4);
 assert.deepEqual(rows().map(r=>r.children.length),[7,8,7]);
 assert.equal(crystals().length,22);
 assert.equal(tabbables().length,1);
});
test('Three-row Up/Down moves across adjacent actual rows',()=>{
 crystals()[4].focus();
 press(crystals()[4],'ArrowDown');
 const middle=focused();
 assert.ok(middle>=7&&middle<=14);
 press(crystals()[middle],'ArrowDown');
 assert.ok(focused()>=15&&focused()<=21);
 press(crystals()[focused()],'ArrowUp');
 assert.equal(focused(),middle);
});
test('Home and End navigate to first/last without 22 Tab stops',()=>{
 crystals()[6].focus();
 press(crystals()[6],'End');
 assert.equal(focused(),21);
 press(crystals()[21],'Home');
 assert.equal(focused(),0);
 assert.equal(tabbables().length,1);
});
test('Touch on a crystal updates the keyboard entry and inspects it',()=>{
 click(crystals()[20]);
 assert.equal(focused(),20);
 assert.deepEqual(tabbables().map(c=>c.dataset.crystalName),[crystals()[20].dataset.crystalName]);
 assert.match(inspector.textContent,/Reference preview only/);
});
test('Modified keyboard shortcuts do not hijack native controls',()=>{
 const target=crystals()[20];
 for(const flag of ['altKey','ctrlKey','metaKey','shiftKey']){
  const e=press(target,'ArrowRight',{[flag]:true});
  assert.equal(e.defaultPrevented,false);
 }
 assert.equal(focused(),20);
});
test('Stage change resets active crystal without restoring old ownership',()=>{
 stage(1);
 assert.equal(crystals().length,3);
 assert.equal(tabbables()[0],crystals()[0]);
 assert.equal(inspector.hidden,true);
});
test('Existing CSS glow/float and colors are not altered',()=>{
 assert.match(css,/animation:float/);
 assert.match(css,/drop-shadow/);
 assert.match(html,/chromatic-attic\.js\?v=294/);
 assert.doesNotMatch(js,/localStorage|fetch\(/);
});
console.log('Chromatic Attic rows: '+checks+' source-backed keyboard scenarios PASS');
