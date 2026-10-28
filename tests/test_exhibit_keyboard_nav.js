/* Development-only verification for 19-03. No on-screen QA controls. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const calls={left:0,right:0,prevented:0};
let handler,overlay=false,modal=false;
const elements={
 exhibitShell:{},
 artworkExpand:{classList:{contains:()=>overlay}},
 leftBtn:{disabled:false,hidden:false,getAttribute:()=>null,click:()=>calls.left++},
 rightBtn:{disabled:false,hidden:false,getAttribute:()=>null,click:()=>calls.right++}
};
const doc={
 activeElement:null,
 addEventListener:(name,fn)=>{if(name==='keydown')handler=fn;},
 getElementById:id=>elements[id],
 querySelector:()=>modal?{}:null
};
const code=fs.readFileSync(path.join(__dirname,'../exhibit-keyboard-nav.js'),'utf8');
vm.runInNewContext(code,{window:{document:doc}});
assert.equal(typeof handler,'function');
const event=(key,other={})=>({
 key,target:{closest:()=>null},repeat:false,altKey:false,ctrlKey:false,
 metaKey:false,shiftKey:false,defaultPrevented:false,
 preventDefault:()=>calls.prevented++,...other
});
handler(event('ArrowLeft'));handler(event('ArrowRight'));
assert.equal(calls.left,1);assert.equal(calls.right,1);
handler(event('ArrowLeft',{target:{closest:()=>({})}}));
assert.equal(calls.left,1);
overlay=true;handler(event('ArrowRight'));overlay=false;assert.equal(calls.right,1);
modal=true;handler(event('ArrowRight'));modal=false;assert.equal(calls.right,1);
handler(event('ArrowLeft',{shiftKey:true}));assert.equal(calls.left,1);
elements.leftBtn.disabled=true;handler(event('ArrowLeft'));assert.equal(calls.left,1);
handler(event('ArrowRight',{repeat:true}));assert.equal(calls.right,1);
assert.equal(calls.prevented,2);
const html=fs.readFileSync(path.join(__dirname,'../exhibit.html'),'utf8');
assert.match(html,/exhibit-keyboard-nav\.js\?v=1/);
console.log('Keyboard navigation checks passed (11 assertions).');
