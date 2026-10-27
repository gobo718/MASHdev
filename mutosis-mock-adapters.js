/* LOCAL DEMO ADAPTER ONLY. Returns a locally drawn fixture, not AI artwork.
   review() is a deterministic QA fixture, NOT content moderation.
   Real providers and real safety review must be implemented separately; do not
   use this mock to approve or show unreviewed real model output. */
(()=>{
'use strict';
// This is a pixel output fixture, NOT a model and NOT a mock representation of its quality.
async function generate({pair,attempt,scenario}){
 if(scenario==='providerfail')throw new Error('Simulated image service outage');
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
 const cx=canvas.getContext('2d');if(!cx)throw new Error('Canvas unavailable');
 const gradient=cx.createLinearGradient(0,0,1280,720);
 gradient.addColorStop(0,'#183640');gradient.addColorStop(.55,'#395961');gradient.addColorStop(1,'#806e67');
 cx.fillStyle=gradient;cx.fillRect(0,0,1280,720);
 cx.fillStyle='rgba(255,255,255,.075)';for(let i=0;i<15;i++){cx.beginPath();cx.arc((i*223)%1280,(i*137)%720,30+i*8,0,2*Math.PI);cx.fill()}
 cx.fillStyle='rgba(250,245,218,.22)';cx.beginPath();cx.arc(640,335,260,0,2*Math.PI);cx.fill();
 cx.textAlign='center';cx.textBaseline='middle';cx.font='215px sans-serif';cx.fillText(pair.emojiA,540,342);cx.fillText(pair.emojiB,744,342);
 cx.font='700 34px Arial, sans-serif';cx.fillStyle='#fff';cx.fillText('LOCAL MOCK · NOT AI ART',640,655);
 cx.font='24px Arial, sans-serif';cx.fillText(`1280 × 720 · attempt ${attempt}`,640,692);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
 // Byte-level guard then decode size; never assume a response is a usable image.
 if(blob.type!=='image/png'||blob.size<100)throw Error('Invalid mock image bytes');
 const header=new Uint8Array(await blob.slice(0,24).arrayBuffer());
 if([137,80,78,71,13,10,26,10].some((v,i)=>header[i]!==v))throw Error('PNG signature missing');
 const view=new DataView(header.buffer);
 if(view.getUint32(16)!==1280||view.getUint32(20)!==720)throw Error('Unexpected output size');
 return {blob,kind:'trusted-local-mock',width:1280,height:720};
}
// A deterministic TEST FIXTURE, not real automatic content safety or production approval.
async function review(candidate,attempt,scenario){
 if(candidate.kind!=='trusted-local-mock')return false;
 if(scenario==='allfail')return false;
 if(scenario==='third')return attempt===3;
 if(scenario==='second')return attempt>=2;
 return true;
}

globalThis.MutosisMockAdapters=Object.freeze({generate,review,kind:'local-qa-fixtures-only'});
})();
