/* MASHdev · 12-10/07-07 Catacombs real viewer-routing regression.
   Tests fragments of the actual exhibit.js functions: no invented rooms,
   content, placeholder input screens, or modified approved map geometry. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','exhibit.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','exhibit.html'),'utf8');
const extract=(begin,end)=>{
  const start=source.indexOf(begin),finish=source.indexOf(end,start);
  if(start<0||finish<start)throw new Error('Expected existing viewer function: '+begin);
  return source.slice(start,finish);
};
const capabilities=extract('  function applyCapabilities(){','  function syncContextBar(){');
const changeFilter=extract('  function setCatSearchHas(value){','  function setCatSearchHasEmoji(value){');
const parade=extract('  function renderEndless(){','  function setRank(rank){');
const run=(code,ctx,fn)=>new Function('ctx','with(ctx){'+code+(fn?'return '+fn+';':'')+'}')(ctx);
let checks=0;
const test=(description,fn)=>{fn();checks++};

test('HTML loads the revised real viewer',()=>{
  assert.match(html,/exhibit\.js\?v=292/);
});
for(const area of ['cat-theme','cat-search']){
  for(const theme of [true,false]){
    test(area+' '+(theme?'Theme':'broad')+' view capability matrix',()=>{
      const make=()=>({hidden:false,disabled:false});
      const overheadBtn=make(),roomBtn=make(),thumbnailBtn=make(),endlessBtn=make();
      const ctx={
        requestedArea:area,catacombsContext:true,catacombsMode:true,
        catSearchHasTheme:theme,catSearchHasEmojiPresent:true,gehMode:false,
        collectionContext:false,
        capabilities:{exhibit:true,room:true,thumbnail:true,endless:true},
        overheadBtn,roomBtn,thumbnailBtn,endlessBtn,
        catSearchHas:{hidden:true},catSearchHasEmoji:{hidden:true},
        catSearchHasRadios:['theme','no-theme'].map(value=>({value,checked:false})),
        catSearchHasEmojiRadios:['emoji','no-emoji'].map(value=>({value,checked:false})),
        syncContextBar(){}
      };
      run(capabilities,ctx,'applyCapabilities')();
      assert.equal(endlessBtn.disabled,false);
      assert.equal(endlessBtn.hidden,false);
      assert.equal(thumbnailBtn.disabled,false);
      assert.equal(overheadBtn.disabled,theme);
      assert.equal(roomBtn.disabled,theme);
    });
  }
  test(area+' renders actual Parade cards',()=>{
    let view='',painted=0;
    const ctx={
      catacombsMode:true,requestedArea:area,catSearchHasTheme:area==='cat-theme',
      capabilities:{endless:true},endlessIndex:0,genericResultCount:66,
      PAGE_SIZE:22,areaLabel:'CATACOMBS',endlessSlots:[{},{},{}],
      endlessStatus:{textContent:''},
      setView(next){view=next},
      paintEndlessSlot(){painted++}
    };
    run(parade,ctx,'renderEndless')();
    assert.equal(view,'endless');
    assert.equal(painted,3);
    assert.match(ctx.endlessStatus.textContent,/RESULT 1 OF 66/);
  });
}
for(const view of ['overhead','left','wall','right','endless','thumbnail']){
  test('switching broad Catacombs to Theme while viewing '+view,()=>{
    let reroutes=0,refresh=0;
    const ctx={
      catacombsContext:true,catacombsMode:true,catSearchHasTheme:false,
      catSearchHasEmojiPresent:true,shell:{dataset:{view}},
      setCatSearchHasEmoji(){refresh++},renderThumbnailPage(){reroutes++}
    };
    run(changeFilter,ctx,'setCatSearchHas')('theme');
    assert.equal(refresh,1);
    assert.equal(reroutes,['overhead','left','wall','right'].includes(view)?1:0);
    assert.equal(ctx.catSearchHasTheme,true);
  });
}
test('switching Theme Catacombs to broad never ejects Parade',()=>{
  let reroutes=0;
  const ctx={
    catacombsContext:true,catacombsMode:true,catSearchHasTheme:true,
    catSearchHasEmojiPresent:true,shell:{dataset:{view:'endless'}},
    setCatSearchHasEmoji(){},renderThumbnailPage(){reroutes++}
  };
  run(changeFilter,ctx,'setCatSearchHas')('no-theme');
  assert.equal(reroutes,0);
});
test('the older Zazzly return-context fallback stays scoped to Zazzly',()=>{
  let reroutes=0;
  const ctx={
    catacombsContext:true,catacombsMode:false,catSearchHasTheme:true,
    catSearchHasEmojiPresent:true,shell:{dataset:{view:'endless'}},
    setCatSearchHasEmoji(){},renderThumbnailPage(){reroutes++}
  };
  run(changeFilter,ctx,'setCatSearchHas')('no-theme');
  assert.equal(reroutes,1);
});
test('GEH and Collection keep their non-Parade navigation contract',()=>{
  for(const mode of ['geh','collection']){
    const make=()=>({hidden:false,disabled:false});
    const overheadBtn=make(),roomBtn=make(),thumbnailBtn=make(),endlessBtn=make();
    const ctx={
      catacombsContext:false,catacombsMode:false,catSearchHasTheme:false,
      gehMode:mode==='geh',collectionContext:mode==='collection',
      capabilities:{exhibit:true,room:true,thumbnail:true,endless:true},
      overheadBtn,roomBtn,thumbnailBtn,endlessBtn,syncContextBar(){}
    };
    run(capabilities,ctx,'applyCapabilities')();
    assert.equal(endlessBtn.hidden,true);
  }
});
test('Theme Catacombs door opens thumbnails rather than an invalid Exhibit room',()=>{
  assert.ok(source.includes('if(catacombsMode && catSearchHasTheme) renderThumbnailPage();'));
  assert.ok(source.includes('else if(capabilities.room) renderRoom(zazzlyMode?13:23);'));
});
test('deep-linked Parade is legal for either Catacombs search type',()=>{
  assert.ok(source.includes(
   "else if((requestedStart==='parade' || requestedStart==='endless') && capabilities.endless) renderEndless();"
  ));
});
console.log('Catacombs modes: '+checks+' source-backed navigation regression cases PASS');
