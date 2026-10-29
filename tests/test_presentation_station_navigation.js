/* MASHdev 13-06/19-03 · real Presentation Station category interaction.
   This does NOT equip Frames, Canvases or Finishes or create player data.
   The actual production JS is run inside the no-account DOM harness. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'presentation-station.js'),'utf8');
const html=fs.readFileSync(path.join(root,'presentation-station.html'),'utf8');
const css=fs.readFileSync(path.join(root,'presentation-station.css'),'utf8');
let scenarios=0;
function test(title,fn){fn();scenarios++}
class Element{
 constructor(name){
   this.name=name;this.dataset={};this.hidden=false;this.attrs={};this.events={};
   this.focusCount=0;
 }
 setAttribute(name,value){this.attrs[name]=String(value)}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 focus(){this.focusCount++;doc.activeElement=this}
 emit(type,event){for(const fn of this.events[type]||[])fn(event)}
 click(){this.emit('click',{target:this})}
}
const names=['canvases','frames','finishes'];
const buttons=names.map(name=>Object.assign(new Element(name),{dataset:{stationView:name}}));
const views=names.map(name=>Object.assign(new Element(name),{dataset:{view:name},hidden:true}));
const doc={
  activeElement:null,
  querySelectorAll(query){
   if(query==='[data-station-view]')return buttons;
   if(query==='[data-view]')return views;
   throw new Error('Unexpected selector: '+query);
  }
};
vm.runInNewContext(js,{document:doc,console},{filename:'presentation-station.js'});
const key=(button,name,overrides={})=>{
 const e={
  key:name,defaultPrevented:false,repeat:false,altKey:false,ctrlKey:false,
  metaKey:false,shiftKey:false,preventDefault(){this.defaultPrevented=true},
  ...overrides
 };
 button.emit('keydown',e);
 return e;
};
const visible=()=>views.filter(v=>!v.hidden).map(v=>v.name);
const selected=()=>buttons.filter(b=>b.attrs['aria-pressed']==='true').map(b=>b.name);

test('Opening the existing Station equips/selects no category by default',()=>{
 assert.deepEqual(visible(),[]);
 assert.deepEqual(selected(),[]);
 assert.ok(buttons.every(b=>b.attrs['aria-expanded']==='false'));
});
test('Clicking FRAMES reveals only Frames without equipping a Functo',()=>{
 buttons[1].click();
 assert.deepEqual(visible(),['frames']);
 assert.deepEqual(selected(),['frames']);
 assert.equal(buttons[1].attrs['aria-expanded'],'true');
 assert.equal(buttons[0].attrs['aria-expanded'],'false');
});
test('Clicking CANVASES hides Frames and identifies the new category',()=>{
 buttons[0].click();
 assert.deepEqual(visible(),['canvases']);
 assert.deepEqual(selected(),['canvases']);
});
test('Right arrow advances to the next real category and moves focus',()=>{
 const e=key(buttons[0],'ArrowRight');
 assert.equal(e.defaultPrevented,true);
 assert.equal(doc.activeElement,buttons[1]);
 assert.deepEqual(visible(),['frames']);
});
test('Right arrow wraps from FINISHES to CANVASES',()=>{
 const e=key(buttons[2],'ArrowRight');
 assert.equal(e.defaultPrevented,true);
 assert.deepEqual(selected(),['canvases']);
 assert.equal(doc.activeElement,buttons[0]);
});
test('Left arrow wraps from CANVASES to FINISHES',()=>{
 const e=key(buttons[0],'ArrowLeft');
 assert.equal(e.defaultPrevented,true);
 assert.deepEqual(selected(),['finishes']);
 assert.equal(doc.activeElement,buttons[2]);
});
test('Home/End move to first/last category without new controls',()=>{
 const end=key(buttons[1],'End');
 assert.equal(end.defaultPrevented,true);
 assert.deepEqual(visible(),['finishes']);
 assert.equal(doc.activeElement,buttons[2]);
 const home=key(buttons[2],'Home');
 assert.equal(home.defaultPrevented,true);
 assert.deepEqual(visible(),['canvases']);
 assert.equal(doc.activeElement,buttons[0]);
});
test('Modified keys, held repeats and unrelated keys are left to browser',()=>{
 for(const modification of ['altKey','ctrlKey','metaKey','shiftKey','repeat','defaultPrevented']){
   const e=key(buttons[0],'ArrowRight',{[modification]:true});
   assert.equal(e.defaultPrevented,true===modification?true:modification==='defaultPrevented');
 }
 assert.deepEqual(selected(),['canvases']);
 const e=key(buttons[0],'Tab');
 assert.equal(e.defaultPrevented,false);
 assert.deepEqual(visible(),['canvases']);
});
test('HTML exposes exact relationships and loads updated game assets',()=>{
 assert.match(html,/presentation-station\.js\?v=295/);
 assert.match(html,/presentation-station\.css\?v=295/);
 for(const name of names){
   assert.match(html,new RegExp('data-station-view="'+name+'" aria-pressed="false" aria-controls="presentation-'+name+'"'));
   assert.match(html,new RegExp('id="presentation-'+name+'" data-view="'+name+'" hidden'));
 }
});
test('CSS selected/keyboard presentation is distinct and non-destructive',()=>{
 assert.match(css,/button\[aria-pressed="true"\]/);
 assert.match(css,/button:focus-visible/);
 assert.doesNotMatch(js,/localStorage|fetch\(|equip\(|award\(|unlock\(|new Image\(/);
});
console.log('Presentation Station: '+scenarios+' production-category regression scenarios PASS');
