/* MASHdev · Residence service snapshot isolation, job 14-01/14-02.
   Test-only DOM, real popup source; no fabricated messages in game, accounts,
   persistence, visits, or rewards. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const production=fs.readFileSync(path.join(__dirname,'..','residence-service-popups.js'),'utf8');
function element(tag){
 return {tag,className:'',textContent:'',hidden:false,open:false,dataset:{},isConnected:true,
  children:[],events:{},attributes:{},
  setAttribute(k,v){this.attributes[k]=String(v)},
  addEventListener(k,fn){this.events[k]=fn},
  append(...n){this.children.push(...n)},
  replaceChildren(...n){this.children=n},
  showModal(){this.open=true},
  close(){this.open=false;this.events.close?.()},
  focus(){},
  contains(){return false}
 };
}
const created=[],body=element('body');
const document={body,activeElement:null,createElement(tag){const e=element(tag);created.push(e);return e},querySelector(){return null}};
const window={};
vm.runInNewContext(production,{document,window,Date,Map,Object,Array,String});
const api=window.MASHResidenceServicePopups;
const content=created.find(e=>e.className==='residence-service-content');
const dialog=created.find(e=>e.tag==='dialog');
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
const entry=()=>content.children[0]?.children[0]?.textContent;
const currentCount=()=>content.children.length;
const when='2026-10-28T12:00:00Z';
const messages={messages:[{id:'m1',subject:'Original subject',sender:'Museum',receivedAt:when,read:false}]};
test('mailbox initially shows supplied account snapshot',()=>{
 api.setSnapshot('mailbox',messages);api.open('mailbox');
 assert.equal(entry(),'Original subject');assert.equal(currentCount(),1);
});
test('mutating supplied mailbox objects does not silently change rendered records',()=>{
 messages.messages[0].subject='CHANGED OUTSIDE SERVICE';
 messages.messages[0].sender='Impostor';
 api.open('mailbox');assert.equal(entry(),'Original subject');
 assert.match(content.children[0].children[1].textContent,/From: Museum/);
});
test('pushing into incoming array does not invent another displayed message',()=>{
 messages.messages.push({id:'m2',subject:'Injected'});
 api.open('mailbox');assert.equal(currentCount(),1);
});
test('only explicit new snapshot can update mailbox data',()=>{
 api.setSnapshot('mailbox',messages);
 assert.equal(entry(),'CHANGED OUTSIDE SERVICE');assert.equal(currentCount(),2);
});
const visits={visits:[{id:'v1',visitor:'Resident A',action:'Visited',visitedAt:when,signingStyle:'Signature'}]};
test('guestbook caller mutations cannot silently change visit identity',()=>{
 api.setSnapshot('guestbook',visits);api.open('guestbook');
 assert.equal(entry(),'Resident A');
 visits.visits[0].visitor='Resident B';visits.visits.push({id:'v2',visitor:'C'});
 api.open('guestbook');assert.equal(entry(),'Resident A');assert.equal(currentCount(),1);
});
const gifts={gifts:[{id:'g1',itemLabel:'Original gift',sender:'Resident A',sentAt:when}]};
test('Gift Dropbox caller mutations cannot silently change gift identity',()=>{
 api.setSnapshot('gift-dropbox',gifts);api.open('gift-dropbox');
 assert.equal(entry(),'Original gift');
 gifts.gifts[0].itemLabel='Not the gift';api.open('gift-dropbox');
 assert.equal(entry(),'Original gift');
});
test('clearing one service does not clear another service',()=>{
 api.setSnapshot('mailbox',null);
 api.open('mailbox');
 assert.match(content.children[0].textContent,/Mailbox records have not been connected/);
 api.open('guestbook');assert.equal(entry(),'Resident A');
});
test('invalid data cannot replace an existing accepted snapshot',()=>{
 assert.throws(()=>api.setSnapshot('guestbook',[]),TypeError);
 api.open('guestbook');assert.equal(entry(),'Resident A');
});
test('duplicate record identities still render only once',()=>{
 api.setSnapshot('mailbox',{messages:[{id:'dup',subject:'One'},{id:'dup',subject:'Two'}]});
 api.open('mailbox');assert.equal(currentCount(),1);assert.equal(entry(),'One');
});
test('unsupported record list shape retains its existing unavailable behavior',()=>{
 api.setSnapshot('mailbox',{messages:'invalid'});
 api.open('mailbox');assert.match(content.children[0].textContent,/Mailbox records have not been connected/);
});
test('Trick or Treat status is copied as a snapshot, never live caller state',()=>{
 const status={status:'Eligibility pending'};
 api.setSnapshot('trick-or-treat',status);api.open('trick-or-treat');
 status.status='Unexpected reward';api.open('trick-or-treat');
 assert.match(content.children[0].textContent,/Eligibility pending/);
 assert.doesNotMatch(content.children[0].textContent,/Unexpected reward/);
});
test('dialog and service remain presentation-only',()=>{
 assert.equal(dialog.open,true);
 assert.doesNotMatch(production,/localStorage|sessionStorage|fetch\(|innerHTML|awardsGranted/);
});
console.log('Residence service snapshot isolation: '+scenarios+' scenarios PASS');
