(()=>{
 const p=new URLSearchParams(location.search);
 const draftNav=globalThis.MASHStudioDraftNavigation;
 const draftContext=draftNav?.contextFromSearch(location.search) || null;
 if(p.get('creation')==='palette'){
  document.body.classList.add('easel-session');
  // Palette material trips always return to Creation Station. If this trip
  // began at the Easel, keep that origin even before saved drafts/accounts exist.
  const origin='creation-station.html?view=palettes';
  const returnHref=draftContext
    ? draftNav.stationHref(origin,draftContext)
    : p.get('easel')==='1' ? origin+'&easel=1' : origin;
  const back=document.createElement('a'); back.className='easel-return';
  back.href=returnHref; back.textContent='RETURN TO CREATION STATION';
  document.body.append(back);
  return;
 }
 if(p.get('easel')!=='1')return;
 document.body.classList.add('easel-session');
 const back=document.createElement('a'); back.className='easel-return'; back.href=draftContext ? draftNav.easelHref(draftContext) : 'easel.html'; back.textContent='RETURN TO PROJECT'; document.body.append(back);
 // Maintain the Easel origin through both Palette material rooms, whether
 // this is an unsaved project or a server-authorized draft with opaque IDs.
 document.querySelectorAll('.palette-sources a[href]').forEach(link=>{
   const href=link.getAttribute('href');
   if(!/^(?:color-cellar|chromatic-attic)\.html\?creation=palette$/.test(href))return;
   link.href=draftContext ? draftNav.stationHref(href,draftContext) : href+'&easel=1';
 });
 const icons=['🖌️','🫟','🖼️','📊','🔡','📄','✏️','✨','🌈','🎨','🎨'];
 const box=document.createElement('aside'); box.className='easel-loadout'; box.setAttribute('aria-label','Current Easel selections');
 icons.forEach(i=>{const s=document.createElement('span');s.className='slot';s.innerHTML=`<span class="ico">${i}</span><span class="def">DEFAULT</span>`;box.append(s)});
 document.body.append(box);
})();
