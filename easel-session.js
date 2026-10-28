(()=>{
 const p=new URLSearchParams(location.search);
 const draftNav=globalThis.MASHStudioDraftNavigation;
 const draftContext=draftNav?.contextFromSearch(location.search) || null;
 if(p.get('creation')==='palette'){
  document.body.classList.add('easel-session');
  const back=document.createElement('a'); back.className='easel-return'; back.href=draftContext ? draftNav.stationHref('creation-station.html?view=palettes',draftContext) : 'creation-station.html?view=palettes'; back.textContent='RETURN TO CREATION STATION'; document.body.append(back);
  return;
 }
 if(p.get('easel')!=='1')return;
 document.body.classList.add('easel-session');
 const back=document.createElement('a'); back.className='easel-return'; back.href=draftContext ? draftNav.easelHref(draftContext) : 'easel.html'; back.textContent='RETURN TO PROJECT'; document.body.append(back);
 // If this is a draft-context session, keep its opaque identity through the
 // Creation Station -> Cellar/Attic -> Creation Station palette excursion.
 if(draftContext){
   document.querySelectorAll('.palette-sources a[href]').forEach(link=>{
     link.href=draftNav.stationHref(link.getAttribute('href'),draftContext);
   });
 }
 const icons=['🖌️','🫟','🖼️','📊','🔡','📄','✏️','✨','🌈','🎨','🎨'];
 const box=document.createElement('aside'); box.className='easel-loadout'; box.setAttribute('aria-label','Current Easel selections');
 icons.forEach(i=>{const s=document.createElement('span');s.className='slot';s.innerHTML=`<span class="ico">${i}</span><span class="def">DEFAULT</span>`;box.append(s)});
 document.body.append(box);
})();
