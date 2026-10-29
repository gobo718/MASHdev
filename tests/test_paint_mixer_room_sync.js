/* MASHdev · 13-07 / 13-08: Paint Mixer and Color Cellar must display
   THE SAME audited spreadsheet-backed pigment catalog. No Mixbox, mixing
   engine, invented recipes, grants, account state or new test-only game UI. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const catalog=require('../pigment-catalog.js');
const core=require('../paint-mixer-core.js');
const html=fs.readFileSync(path.join(__dirname,'..','paint-mixer.html'),'utf8');
const cellar=fs.readFileSync(path.join(__dirname,'..','color-cellar.html'),'utf8');
const mixer=fs.readFileSync(path.join(__dirname,'..','paint-mixer.js'),'utf8');
let scenarios=0;
function test(name,fn){fn();scenarios++}
const assetVersion=markup=>{
 const matches=[...markup.matchAll(/pigment-catalog\.js\?v=(\d+)/g)];
 assert.equal(matches.length,1);
 return matches[0][1];
};
test('both active rooms request the same current catalog asset revision',()=>{
 assert.equal(assetVersion(html),assetVersion(cellar));
 assert.equal(assetVersion(html),'3');
});
test('catalog contains exactly 500 accepted Paints and 211 Mudbucket recipes',()=>{
 assert.equal(catalog.count,711);
 assert.equal(catalog.paintRecords.length,500);
 assert.deepEqual(core.firstTierKeys().length,10);
});
class Element{
 constructor(name=''){
  this.name=name;this.dataset={};this.attributes={};this.listeners={};
  this.style={backgroundColor:''};this.hidden=false;this.textContent='';
 }
 setAttribute(name,value){this.attributes[name]=String(value)}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
 click(){for(const fn of this.listeners.click||[])fn({target:this})}
}
const primaries=core.FIRST_PRIMARIES.map(value=>{
 const node=new Element(value);node.dataset.primary=value;return node;
});
const lookup={
 '#primaries':{querySelectorAll:q=>q==='[data-primary]'?primaries:[]},
 '#selected-recipe':new Element('selected'),
 '#recipe-name':new Element('name'),
 '#source-note':new Element('note'),
 '#recipe-hex':new Element('hex'),
 '#result-swatch':new Element('swatch'),
 '#clear-choice':new Element('clear')
};
const document={querySelector:selector=>lookup[selector]||null};
vm.runInNewContext(mixer,{
 document,globalThis:{MASHPigmentCatalog:catalog}
},{filename:'paint-mixer.js'});
const press=name=>primaries.find(x=>x.dataset.primary===name).click();
const clear=()=>lookup['#clear-choice'].click();
test('empty Mixer never pretends to own or award a paint',()=>{
 assert.equal(lookup['#selected-recipe'].textContent,'Choose two primaries.');
 assert.equal(lookup['#result-swatch'].hidden,true);
});
const expected=new Map([
 ['BLACK+BLUE',['Navy','#0A186E',14]],
 ['BLACK+RED',['Dark Red','#7F1725',9]],
 ['BLACK+YELLOW',['Olive','#5B730E',12]],
 ['BLACK+WHITE',['Grey','#7D7A7F',15]],
 ['BLUE+RED',['Violet','#7D1A9B',7]],
 ['BLUE+YELLOW',['Green','#4FA75D',10]],
 ['BLUE+WHITE',['Light Blue','#6098FF',13]],
 ['RED+YELLOW',['Orange','#FF7736',6]],
 ['RED+WHITE',['Pink','#FF7FA8',8]],
 ['YELLOW+WHITE',['Light Yellow','#FFF659',11]]
]);
for(const [pair,[name,hex,number]] of expected){
 test('Mixer exact source name/HEX for '+pair,()=>{
  const [a,b]=pair.split('+');clear();press(a);
  assert.equal(lookup['#result-swatch'].hidden,true);
  press(b);
  assert.equal(lookup['#recipe-name'].textContent,name);
  assert.equal(lookup['#recipe-hex'].textContent,hex);
  assert.equal(lookup['#result-swatch'].style.backgroundColor,hex);
  assert.equal(lookup['#result-swatch'].hidden,false);
  assert.match(lookup['#result-swatch'].attributes['aria-label'],new RegExp(hex));
  assert.match(lookup['#source-note'].textContent,new RegExp('catalog #'+number+' .*Not awarded'));
  assert.equal(catalog.lookupFirstTier(a,b).hex,hex);
  assert.equal(catalog.lookupFirstTier(b,a).name,name);
 });
}
test('removing a selected ingredient clears the old swatch and HEX',()=>{
 clear();press('RED');press('YELLOW');press('RED');
 assert.equal(lookup['#result-swatch'].hidden,true);
 assert.equal(lookup['#recipe-hex'].textContent,'');
 assert.equal(lookup['#recipe-name'].textContent,'No recipe selected.');
});
test('selecting a third primary evicts oldest, without inventing a recipe',()=>{
 clear();press('RED');press('BLUE');press('WHITE');
 const result=catalog.lookupFirstTier('BLUE','WHITE');
 assert.equal(lookup['#recipe-name'].textContent,result.name);
 assert.equal(lookup['#recipe-hex'].textContent,result.hex);
 assert.equal(primaries.find(x=>x.dataset.primary==='RED').attributes['aria-pressed'],'false');
 assert.equal(primaries.find(x=>x.dataset.primary==='WHITE').attributes['aria-pressed'],'true');
});
test('clear selection removes result, and no data are posted or persisted',()=>{
 clear();
 assert.equal(lookup['#recipe-hex'].textContent,'');
 assert.equal(lookup['#result-swatch'].hidden,true);
 assert.doesNotMatch(mixer,/localStorage|fetch\(|\.send\(|unlockGranted\s*=|award\(/);
 assert.doesNotMatch(mixer,/Mixbox/i);
});
console.log('Paint Mixer/Cellar catalog sync: '+scenarios+' source-backed UI scenarios PASS');
