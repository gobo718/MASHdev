/* 13-06 · Presentation Station category browsing only.
   The visible choice is NOT an equipped Canvas/Frame/Finish and does not save
   an inventory, grant a Functo or invent a player project. */
(()=>{
  const buttons=[...document.querySelectorAll('[data-station-view]')];
  const views=[...document.querySelectorAll('[data-view]')];
  const allowed=new Set(['canvases','frames','finishes']);
  if(buttons.length!==3 || views.length!==3)throw new Error('Presentation Station categories missing');
  function show(name){
    if(!allowed.has(name))return;
    views.forEach(view=>view.hidden=view.dataset.view!==name);
    buttons.forEach(button=>{
      const selected=button.dataset.stationView===name;
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('aria-expanded',String(selected));
    });
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>show(button.dataset.stationView));
    button.addEventListener('keydown',event=>{
      if(event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey ||
         event.metaKey || event.shiftKey ||
         !['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
        (index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      event.preventDefault();
      buttons[next].focus();
      show(buttons[next].dataset.stationView);
    });
  });
  // Existing station opens without assuming any earned item or selection.
  buttons.forEach(button=>button.setAttribute('aria-expanded','false'));
})();
