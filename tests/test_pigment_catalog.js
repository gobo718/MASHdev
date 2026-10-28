/* Development-only check of existing reviewed Pigment Catalog, never staged as gameplay. */
'use strict';
const assert=require('node:assert/strict');
const cat=require('../pigment-catalog.js');
const core=require('../paint-mixer-core.js');
assert.equal(cat.count,711);
const expected=new Map([
 ['BLACK+BLUE',[14,'Navy']],['BLACK+RED',[9,'Dark Red']],
 ['BLACK+YELLOW',[12,'Olive']],['BLACK+WHITE',[15,'Grey']],
 ['BLUE+RED',[7,'Violet']],['BLUE+YELLOW',[10,'Green']],
 ['BLUE+WHITE',[13,'Light Blue']],['RED+YELLOW',[6,'Orange']],
 ['RED+WHITE',[8,'Pink']],['YELLOW+WHITE',[11,'Light Yellow']]
]);
assert.deepEqual(new Set(core.firstTierKeys()),new Set(expected.keys()));
for(const [key,[catalogNumber,name]] of expected){
 const [a,b]=key.split('+');
 const x=cat.lookupFirstTier(a,b),y=cat.lookupFirstTier(b,a);
 assert.equal(x.status,'catalog-match');
 assert.equal(x.catalogNumber,catalogNumber);
 assert.equal(x.name,name);
 assert.equal(x.reviewState,'looks');
 assert.equal(x.outputGamePigmentId,null);
 assert.equal(x.unlockGranted,false);
 assert.equal(x.swatchComputed,false);
 assert.equal(y.catalogNumber,catalogNumber);
}
assert.equal(cat.lookupRecipe({r:500}).status,'not-in-reviewed-catalog');
assert.throws(()=>cat.lookupFirstTier('RED','RED'));
assert.throws(()=>cat.lookupRecipe({r:1,y:1,n:1}));
assert.throws(()=>cat.lookupRecipe({r:1.5,y:1}));
console.log('Reviewed 711-pigment catalog and first-tier recipe checks passed.');
