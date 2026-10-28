(()=>{
 const buttons=[...document.querySelectorAll('[data-station-view]')];
 const views=[...document.querySelectorAll('[data-view]')];
 // Reflect the actual visible category for keyboard and assistive-technology users.
 // Selection remains a room view only, never an equipped Font/Effect/Palette.
 const show=name=>{
   views.forEach(v=>v.hidden=v.dataset.view!==name);
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stationView===name)));
 };
 buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.stationView)));
 const q=new URLSearchParams(location.search);
 if(q.get('view')==='palettes')show('palettes');
})();
