/* MASHdev 12-08 / 07-03 · GEH rank availability boundary.
   In the current no-account game, only first place is available.
   URLs are not server progress. This does NOT define future unlock rules
   or add authentication, rewards, a backend, artwork, or rank fixtures. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const hub=fs.readFileSync(path.join(root,'index.html'),'utf8');
const viewer=fs.readFileSync(path.join(root,'exhibit.js'),'utf8');
const markup=fs.readFileSync(path.join(root,'exhibit.html'),'utf8');
let checks=0;
const test=(label,fn)=>{fn();checks++};
function between(start,end){
 const a=viewer.indexOf(start);
 const b=viewer.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing current code: '+start);
 return viewer.slice(a,b);
}
// Evaluate the exact committed assignments, not independently guessed rules.
const maxRankCode=between('  const maxUnlockedRank=', '  const gehMode=');
const firstRankCode=between('  const requestedRank=', '  const entranceKind=');
const buttonCode=between('  function updateRankButtons(){','  function resetSlotButton(');
const selectCode=between('  function setRank(rank){','  function rememberArtworkReturn(){');
function rankBoundary(query,gehMode=true){
 const params=new URLSearchParams(query);
 const maxUnlockedRank=new Function('params',maxRankCode+' return maxUnlockedRank;')(params);
 const requestedRank=new Function('params','gehMode',firstRankCode+' return requestedRank;')(params,gehMode);
 return {maxUnlockedRank,requestedRank};
}
function rankControls(query){
 const result=rankBoundary(query,true);
 const buttons=Array.from({length:10},(_,index)=>({
   dataset:{rank:String(index+1)},hidden:false,attributes:{},classes:new Set(),
   setAttribute(k,v){this.attributes[k]=v},
   classList:{toggle(k,enabled){this._last=[k,enabled]}}
 }));
 // The selection routine uses the actual source and the same ten rank buttons
 // that remain authored in the GEH markup.
 const ctx={
   ...result,rankButtons:buttons,gehMode:true,gehRank:result.requestedRank,
   rankWord:n=>n===1?'1st':n+'th',
   entranceRank:{textContent:'1st PLACE'},shell:{dataset:{view:'overhead'}},
   updateRankButtons(){},renderOverhead(){ctx.rendered++},renderThumbnailPage(){ctx.rendered++},
   renderRoom(){ctx.rendered++},lastRoomStart:1,rendered:0,
   document:{createElement(){return {textContent:'',style:{}}}}
 };
 const actual=new Function('ctx','with(ctx){'+buttonCode+selectCode+
    'return {updateRankButtons,setRank};}')(ctx);
 ctx.updateRankButtons=actual.updateRankButtons;
 actual.updateRankButtons();
 return {ctx,buttons,functions:actual};
}
test('Museum normal GEH entry does not claim ten earned places',()=>{
 assert.match(hub,/href="exhibit\.html\?area=geh&amp;start=exhibit"/);
 assert.doesNotMatch(hub,/area=geh[^"]*ranks=(?:2|3|10)/);
});
for(const query of [
 'area=geh', 'area=geh&start=exhibit',
 'area=geh&ranks=10', 'area=geh&ranks=999&rank=10',
 'area=geh&rank=2', 'area=zazzly&geh=1&rank=3&ranks=10',
 'area=geh&rank=-5&ranks=-5'
]){
 test('Untrusted rank/query cannot unlock GEH: '+query,()=>{
  assert.deepEqual(rankBoundary(query),{maxUnlockedRank:1,requestedRank:1});
 });
}
test('GEH rank selector retains the ten authored slots for future progress',()=>{
 const present=[...markup.matchAll(/data-rank="(\d+)"/g)].map(m=>Number(m[1]));
 assert.equal(present.length%10,0);
 assert.ok(present.length>=10);
 for(let i=0;i<present.length;i+=10)
   assert.deepEqual(present.slice(i,i+10),[1,2,3,4,5,6,7,8,9,10]);
 assert.match(markup,/exhibit\.js\?v=297/);
});
test('Only the first GEH rank button is visible and selected',()=>{
 const {buttons}=rankControls('area=geh');
 assert.deepEqual(buttons.map(b=>b.hidden),[false,true,true,true,true,true,true,true,true,true]);
 assert.equal(buttons[0].attributes['aria-pressed'],'true');
 for(const button of buttons.slice(1))assert.equal(button.attributes['aria-pressed'],'false');
});
test('URL rank=10 cannot leave a hidden tenth-place button selected',()=>{
 const {buttons}=rankControls('area=geh&ranks=10&rank=10');
 assert.equal(buttons[0].hidden,false);
 assert.equal(buttons[0].attributes['aria-pressed'],'true');
 assert.equal(buttons[9].hidden,true);
 assert.equal(buttons[9].attributes['aria-pressed'],'false');
});
test('Click-style request for rank 2 is rejected without repaint',()=>{
 const {ctx,functions}=rankControls('area=geh&ranks=10&rank=2');
 functions.setRank(2);
 assert.equal(ctx.gehRank,1);
 assert.equal(ctx.rendered,0);
 assert.equal(ctx.entranceRank.textContent,'1st PLACE');
});
test('Click-style request for rank 10 is also rejected',()=>{
 const {ctx,functions}=rankControls('area=geh&ranks=10&rank=10');
 functions.setRank(10);
 assert.equal(ctx.gehRank,1);
 assert.equal(ctx.rendered,0);
});
test('Selecting allowed first place keeps normal overhead presentation',()=>{
 const {ctx,functions}=rankControls('area=geh');
 functions.setRank(1);
 assert.equal(ctx.gehRank,1);
 assert.equal(ctx.rendered,1);
 assert.equal(ctx.entranceRank.textContent,'1st PLACE');
});
test('The existing standard/Zazzly room geometry is not rewritten',()=>{
 assert.match(viewer,/id:'standard-22'/);
 assert.match(viewer,/id:'zazzly-12'/);
 assert.match(viewer,/cornerAfter:\[1,5,8,12\]/);
 assert.match(viewer,/number:5,locked:true/);
});
test('Non-GEH area is not granted a new rank presentation',()=>{
 const {ctx,buttons,functions}=rankControls('area=gallery');
 ctx.gehMode=false;
 functions.updateRankButtons();
 assert.equal(buttons.every(b=>b.hidden),true);
 functions.setRank(2);
 assert.equal(ctx.gehRank,1);
});
console.log('GEH first-place-only: '+checks+' rank/presentation scenarios PASS');
