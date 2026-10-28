/* Development-only check of existing reviewed Pigment Catalog, never staged as gameplay. */
'use strict';
const assert=require('node:assert/strict');
const cat=require('../pigment-catalog.js');
const core=require('../paint-mixer-core.js');
assert.equal(cat.count,711);
const expected=new Map([
 ['BLACK+BLUE',[14,'Navy','#0A186E']],['BLACK+RED',[9,'Dark Red','#7F1725']],
 ['BLACK+YELLOW',[12,'Olive','#5B730E']],['BLACK+WHITE',[15,'Grey','#7D7A7F']],
 ['BLUE+RED',[7,'Violet','#7D1A9B']],['BLUE+YELLOW',[10,'Green','#4FA75D']],
 ['BLUE+WHITE',[13,'Light Blue','#6098FF']],['RED+YELLOW',[6,'Orange','#FF7736']],
 ['RED+WHITE',[8,'Pink','#FF7FA8']],['YELLOW+WHITE',[11,'Light Yellow','#FFF659']]
]);
assert.deepEqual(new Set(core.firstTierKeys()),new Set(expected.keys()));
for(const [key,[catalogNumber,name,hex]] of expected){
 const [a,b]=key.split('+');
 const x=cat.lookupFirstTier(a,b),y=cat.lookupFirstTier(b,a);
 assert.equal(x.status,'catalog-match');
 assert.equal(x.catalogNumber,catalogNumber);
 assert.equal(x.name,name);
 assert.equal(x.hex,hex);
 assert.equal(y.hex,hex);
 assert.equal(x.reviewState,'looks');
 assert.equal(x.outputGamePigmentId,null);
 assert.equal(x.unlockGranted,false);
 assert.equal(x.swatchComputed,false);
 assert.equal(y.catalogNumber,catalogNumber);
}
// All 711 audited recipes have a prebaked six-digit HEX value.
const fs=require('node:fs'),path=require('node:path');
const raw=fs.readFileSync(path.join(__dirname,'../pigment-catalog.js'),'utf8');
const match=raw.match(/const ROWS=(\[[\s\S]*?\]);/);
assert.ok(match,'Prebaked catalog table is present');
const entries=JSON.parse(match[1]);
assert.equal(entries.length,711);
assert.equal(new Set(entries.map(row=>row[0])).size,711);
// The completed Pigment Plan / Mix Order sheet is authoritative for gameplay:
// 500 distinct paints, 211 Mudbucket recipes representing nine Earthy buckets.
assert.equal(entries.filter(row=>row[7]==='looks').length,500);
assert.equal(entries.filter(row=>row[7]==='mud').length,211);
assert.equal(new Set(entries.filter(row=>row[7]==='mud')
  .map(row=>row[8]+':'+row[9])).size,9);
assert.ok(entries.filter(row=>row[7]==='looks').every(row=>!row[8]&&!row[9]));
// The older auditor marked #694 as Earthy; the completed workbook says Paint.
const corrected=entries.find(row=>row[0]===694);
assert.deepEqual(corrected,[694,'Blanched Green-Brown',1,2,2,2,0,'looks','','','#A6A67F']);
const correctedResult=cat.lookupRecipe({r:1,y:2,b:2,w:2,k:0});
assert.equal(correctedResult.catalogNumber,694);
assert.equal(correctedResult.reviewState,'looks');
assert.equal(correctedResult.hex,'#A6A67F');
// Trim the one source-name whitespace error; color and formula stay identical.
const twilight=entries.find(row=>row[0]===165);
assert.deepEqual(twilight,[165,'Twilight Green',0,1,1,0,3,'looks','','','#213B29']);
assert.equal(cat.lookupRecipe({r:0,y:1,b:1,w:0,k:3}).name,'Twilight Green');
assert.ok(entries.every(row=>row[1]===row[1].trim()));
assert.equal(new Set(entries.map(row=>row.slice(2,7).join('/'))).size,711);
for(const row of entries){
 assert.match(row[10],/^#[0-9A-F]{6}$/);
 assert.equal(cat.lookupRecipe({r:row[2],y:row[3],b:row[4],w:row[5],k:row[6]}).hex,row[10]);
}
assert.equal(cat.lookupRecipe({r:500}).status,'not-in-reviewed-catalog');
assert.throws(()=>cat.lookupFirstTier('RED','RED'));
assert.throws(()=>cat.lookupRecipe({r:1,y:1,n:1}));
assert.throws(()=>cat.lookupRecipe({r:1.5,y:1}));
console.log('Reviewed 711 HEX values, 500 paints / 211 Mudbucket recipes, and corrected pigment names.');
