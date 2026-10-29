/* MASHdev: real shared-viewer Zazzly (67–78) detail navigation regression.
   Source-backed: extract actual exhibit.js functions and event handlers.
   Does not invent artwork, unlock rank, pages, geometry, or player accounts. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','exhibit.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','exhibit.html'),'utf8');
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
function between(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing production function '+start);
 return source.slice(a,b);
}
function compile(code,context,exports){
 return new Function('context','with(context){'+code+'\nreturn {'+
   exports.map(name=>name+':'+name).join(',')+'};}')(context);
}
const navigationCode=between(
 '  const artworkSequenceViews=new Set(', '  function handleLeft(){'
);
const focusCode=between(
 '  function focusReturnedArtwork(view,number){','  function restoreArtworkSource(){'
);
const cardHandlerCode=between(
 "  endlessSlots.forEach(button=>{","  rankButtons.forEach(button=>{"
);
const labelCode=between('  function updateArtworkCopy(number,rank){','  function openArtwork(number,rank=1){');
const themes=between('    zazzly:{start:67,items:[','  };');
assert.match(themes,/ZazzlyParty/);
assert.match(themes,/Seduction/);
const zazzlyNames=themes.split("    zazzly:{start:67,items:[")[1].split(']}')[0].match(/'[^']+'/g);
assert.equal(zazzlyNames.length,12);
function button(art){
 return {
   dataset:{art:String(art),result:String(art-67)},
   hidden:false,disabled:false,focused:0,
   classList:{contains:()=>false},
   focus(){this.focused++},
   events:{},addEventListener(name,fn){this.events[name]=fn}
 };
}
function fixture(zazzlyMode,view,selectedArt,roomPage=0){
 const state={
   zazzlyMode,THEME_SETS:{zazzly:{start:67,items:zazzlyNames}},
   genericResultCount:zazzlyMode?12:66,PAGE_SIZE:22,THUMBNAIL_PAGE_SIZE:11,
   shell:{dataset:{view:'zoom'}},
   artworkReturn:{view,roomPage,thumbnailPage:0,endlessIndex:0,gehRank:2},
   roomPage,thumbnailPage:0,endlessIndex:0,selectedArt,selectedRank:2,
   leftBtn:{hidden:false,disabled:false},
   rightBtn:{hidden:false,disabled:false},
   capabilities:{room:true},syncContextBar(){},
   artworkScroll:{scrollTop:45},updated:[],
   updateArtworkCopy(art,rank){state.selectedArt=art;state.selectedRank=rank;state.updated.push(art)},
 };
 return {state,fn:compile(navigationCode,state,
   ['artworkSequenceBounds','updateNavigationState','stepSelectedArtwork'])};
}
test('Zazzly uses the authored twelve Themes beginning at 67',()=>{
 const {fn}=fixture(true,'thumbnail',67);
 assert.deepEqual(fn.artworkSequenceBounds(),{first:67,last:78});
});
test('non-Zazzly uses the existing local result range',()=>{
 const {fn}=fixture(false,'thumbnail',1);
 assert.deepEqual(fn.artworkSequenceBounds(),{first:1,last:66});
});
for(const sourceView of ['thumbnail','overhead','endless']){
 test('Zazzly '+sourceView+' detail arrows enable within 67–78',()=>{
  const {state,fn}=fixture(true,sourceView,67);
  fn.updateNavigationState();
  assert.equal(state.leftBtn.disabled,true);
  assert.equal(state.rightBtn.disabled,false);
  state.selectedArt=78;fn.updateNavigationState();
  assert.equal(state.leftBtn.disabled,false);
  assert.equal(state.rightBtn.disabled,true);
  state.selectedArt=70;fn.updateNavigationState();
  assert.equal(state.leftBtn.disabled,false);
  assert.equal(state.rightBtn.disabled,false);
 });
 test('Zazzly '+sourceView+' never crosses its artwork boundaries',()=>{
  const {state,fn}=fixture(true,sourceView,67);
  fn.stepSelectedArtwork(-1);
  assert.deepEqual(state.updated,[]);
  state.selectedArt=78;
  fn.stepSelectedArtwork(1);
  assert.deepEqual(state.updated,[]);
  assert.equal(state.selectedArt,78);
 });
}
for(const sourceView of ['left','wall','right']){
 test('Zazzly '+sourceView+' loops 78→67, preserving GEH rank',()=>{
  const {state,fn}=fixture(true,sourceView,78);
  fn.stepSelectedArtwork(1);
  assert.equal(state.selectedArt,67);
  assert.equal(state.selectedRank,2);
  fn.stepSelectedArtwork(-1);
  assert.equal(state.selectedArt,78);
  assert.equal(state.roomPage,0);
 });
 test('Zazzly '+sourceView+' starts with both arrows enabled',()=>{
  const {state,fn}=fixture(true,sourceView,67);
  fn.updateNavigationState();
  assert.equal(state.leftBtn.disabled,false);
  assert.equal(state.rightBtn.disabled,false);
 });
}
test('Zazzly thumbnails keep local page zero on 77→78',()=>{
 const {state,fn}=fixture(true,'thumbnail',77);
 fn.stepSelectedArtwork(1);
 assert.equal(state.selectedArt,78);
 assert.equal(state.thumbnailPage,0);
 assert.equal(state.artworkReturn.thumbnailPage,0);
 assert.equal(state.roomPage,0);
});
test('Zazzly PARADE tracks local slot 3 after 69→70',()=>{
 const {state,fn}=fixture(true,'endless',69);
 fn.stepSelectedArtwork(1);
 assert.equal(state.selectedArt,70);
 assert.equal(state.endlessIndex,3);
 assert.equal(state.artworkReturn.endlessIndex,3);
 assert.equal(state.roomPage,0);
});
test('Zazzly Aerial detail moves to 68 but keeps local room index',()=>{
 const {state,fn}=fixture(true,'overhead',67);
 fn.stepSelectedArtwork(1);
 assert.equal(state.selectedArt,68);
 assert.equal(state.roomPage,0);
});
test('standard thumbnails still cross from 11 to 12 on page one',()=>{
 const {state,fn}=fixture(false,'thumbnail',11);
 fn.stepSelectedArtwork(1);
 assert.equal(state.selectedArt,12);
 assert.equal(state.thumbnailPage,1);
});
test('standard Exhibit 22-room boundaries still wrap on art 22',()=>{
 const {state,fn}=fixture(false,'wall',22);
 fn.stepSelectedArtwork(1);assert.equal(state.selectedArt,1);
 state.selectedArt=1;fn.stepSelectedArtwork(-1);assert.equal(state.selectedArt,22);
});
test('standard second Exhibit room wraps artwork 44 to 23',()=>{
 const {state,fn}=fixture(false,'left',44,1);
 fn.stepSelectedArtwork(1);assert.equal(state.selectedArt,23);
 fn.stepSelectedArtwork(-1);assert.equal(state.selectedArt,44);
});
test('standard PARADE still counts local selected artwork from one',()=>{
 const {state,fn}=fixture(false,'endless',10);
 fn.stepSelectedArtwork(1);
 assert.equal(state.selectedArt,11);
 assert.equal(state.endlessIndex,10);
});
test('PARADE opens the card displayed art number, not its local slot',()=>{
 const target=button(70),opens=[];
 const ctx={endlessSlots:[target],endlessIndex:0,gehMode:false,gehRank:2,
   renderEndless(){},openArtwork(art,rank){opens.push([art,rank])}};
 compile(cardHandlerCode,ctx,[]);
 target.events.click();
 assert.deepEqual(opens,[[70,1]]);
 assert.equal(ctx.endlessIndex,3);
});
test('GEH ranks are not downgraded by PARADE handler if it is invoked',()=>{
 const target=button(70),opens=[];
 const ctx={endlessSlots:[target],endlessIndex:0,gehMode:true,gehRank:2,
   renderEndless(){},openArtwork(art,rank){opens.push([art,rank])}};
 compile(cardHandlerCode,ctx,[]);
 target.events.click();
 assert.deepEqual(opens,[[70,2]]);
});
test('Parade BACK returns focus by displayed artwork ID',()=>{
 const target=button(70),other=button(69),controls=[other,target];
 const ctx={thumbnailGrid:{querySelectorAll:()=>[]},overheadSlots:[],
   leftSlots:[],wallSlots:[],rightSlotsVisual:[],endlessSlots:controls,
   frontDoor:{},thumbnailBtn:{},overheadBtn:{},roomBtn:{},endlessBtn:button(0)};
 const {focusReturnedArtwork}=compile(focusCode,ctx,['focusReturnedArtwork']);
 focusReturnedArtwork('endless',70);
 assert.equal(target.focused,1);
 assert.equal(other.focused,0);
});
test('thumbnail BACK still refocuses the matching displayed art',()=>{
 const target=button(78);
 const ctx={thumbnailGrid:{querySelectorAll:()=>[button(67),target]},overheadSlots:[],
   leftSlots:[],wallSlots:[],rightSlotsVisual:[],endlessSlots:[],
   frontDoor:{},thumbnailBtn:{},overheadBtn:{},roomBtn:{},endlessBtn:{}};
 const {focusReturnedArtwork}=compile(focusCode,ctx,['focusReturnedArtwork']);
 focusReturnedArtwork('thumbnail',78);
 assert.equal(target.focused,1);
});
test('Zazzly artwork detail identity displays Theme 67, not wrapped Theme 1',()=>{
 const texts=Object.fromEntries(['artworkLabel','artworkArea','artworkRankTime',
   'artworkEmojis','artworkTheme','creatorLink','plaqueText'].map(key=>[key,{textContent:''}]));
 const ctx={...texts,selectedArt:1,selectedRank:1,gehMode:true,
   zazzlyMode:true,entranceKind:'geh',entranceEmojiText:'😀 😎',
   emojiPairs:[['🎭','✨']],areaLabel:'GRAND EXHIBITION HALL',
   exhibitArtLabel:n=>'ART '+n,rankWord:n=>n===2?'2nd':'1st',
   PAGE_SIZE:22,emojiPairDefinedLocation:false};
 const {updateArtworkCopy}=compile(labelCode,ctx,['updateArtworkCopy']);
 updateArtworkCopy(67,2);
 assert.equal(texts.artworkTheme.textContent,'THEME 67');
 assert.equal(texts.artworkLabel.textContent,'ART 67 · 2nd');
 updateArtworkCopy(78,2);
 assert.equal(texts.artworkTheme.textContent,'THEME 78');
});
test('live HTML requests the fixed Exhibit script and keeps accepted room geometry',()=>{
 assert.match(html,/exhibit\.js\?v=296/);
 assert.match(source,/id:'zazzly-12'/);
 assert.match(source,/cornerAfter:\[1,5,8,12\]/);
 assert.match(source,/number:5,locked:true/);
 assert.doesNotMatch(source,/openArtwork\(index\+1,1\)/);
});
console.log('Zazzly art details: '+scenarios+' source-backed regression scenarios PASS');
