/* MASHdev · 06-07 / 18-02 · Easel no-account action integrity.
   The real Easel has no editor/save/delete service yet. A navigation to
   Rough Stuff is NOT a completed save. Prevent false assurance of
   persistence/deletion, while protecting the accepted room geometry.
   This is NOT an account prototype or a simulated creation. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','easel.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','easel.css'),'utf8');
const rough=fs.readFileSync(path.join(__dirname,'..','rough-stuff.js'),'utf8');
let count=0;
const test=(label,fn)=>{fn();count++};
const actions=html.match(/<div class="project-actions">([\s\S]*?)<\/div>/)?.[1]||'';
function button(id){
 const matches=[...actions.matchAll(new RegExp('<button\\b[^>]*\\bid="'+id+'"[^>]*>[^<]*<\\/button>','g'))];
 assert.equal(matches.length,1,'Expected one original action button: '+id);
 return matches[0][0];
}
test('Save is clickable for account disclosure, not a fake Save',()=>{
 const save=button('save-project');
 assert.doesNotMatch(save,/\sdisabled\b/);
 assert.match(save,/aria-haspopup="dialog"/);
 assert.match(save,/aria-controls="easel-account-needed"/);
 assert.match(save,/title="Saving requires a player account"/);
 assert.match(save,/>SAVE TO DRAFTS<\/button>/);
 assert.doesNotMatch(actions,/<a\b[^>]*href="rough-stuff\.html"[^>]*>SAVE TO DRAFTS<\/a>/);
});
test('Guest Save opens an accessible account dialog, not registration or persistence',()=>{
 assert.match(html,/<dialog id="easel-account-needed" class="easel-save-dialog" aria-labelledby="easel-save-heading"/);
 assert.match(html,/SAVING REQUIRES AN ACCOUNT/);
 assert.match(html,/Guests can experiment with the creation tools/);
 assert.match(html,/Registration and draft storage are not connected in this build yet/);
 assert.match(html,/No artwork has been saved/);
 assert.match(html,/dialog\.showModal\(\)/);
 assert.match(html,/close\.addEventListener\('click',\(\)=>dialog\.close\(\)\)/);
 assert.match(html,/dialog\.addEventListener\('close',\(\)=>trigger\.focus\(\)\)/);
});
test('Delete is also disabled until an actual authoritative project action exists',()=>{
 const remove=button('delete-project');
 assert.match(remove,/\bdisabled\b/);
 assert.match(remove,/\btype="button"/);
 assert.match(remove,/aria-label="[^"]*no project deletion service[^"]*"/);
 assert.doesNotMatch(html,/Rudimentary DELETE placeholder|alert\(/);
});
test('Original Easel actions and measured project surface still have their geometry',()=>{
 assert.match(html,/<div class="work">EASEL/);
 assert.match(html,/<div class="project-actions">/);
 assert.match(css,/\.project-actions\{position:absolute;bottom:0;left:50%;transform:translateX\(-50%\)/);
 assert.match(css,/\.work\{width:var\(--easel-landscape-w\);height:var\(--easel-landscape-h\)/);
 assert.equal((actions.match(/<button\b/g)||[]).length,2);
});
test('Navigation to actual Studio selection rooms and Museum is preserved',()=>{
 for(const route of ['chromatic-attic.html?easel=1','color-cellar.html?easel=1',
   'creation-station.html?easel=1','presentation-station.html?easel=1','studio.html','index.html'])
   assert.ok(html.includes('href="'+route+'"'),route);
 assert.match(html,/studio-draft-navigation\.js\?v=283/);
 assert.match(css,/\.easel-save-dialog::backdrop/);
 assert.match(html,/easel-fit\.js\?v=274/);
});
test('CSS preserves action geometry and styles native guest-save disclosure',()=>{
 assert.match(css,/\.project-actions button:disabled\{opacity:\.48;cursor:not-allowed\}/);
 assert.match(html,/easel\.css\?v=300/);
});
test('No client-side persistence or fake server completion is introduced',()=>{
 assert.doesNotMatch(html,/localStorage|sessionStorage|fetch\(|saveDraft\(|deleteDraft\(|window\.location\s*=\s*['"]rough-stuff/);
 assert.match(rough,/Saved drafts are not connected to an account in this build\./);
 assert.match(rough,/open\.disabled=!handlers\.openDraft\|\|/); // inspect real server-guarded action state
});
console.log('Easel action integrity: '+count+' production-source scenarios PASS');
