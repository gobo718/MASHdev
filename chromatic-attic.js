(() => {
  const display = document.getElementById('crystal-display');
  const inspector = document.getElementById('crystal-inspector');
  // Inspection is visual reference only, never a material selection or unlock.
  if (!display || !inspector) throw new Error('Chromatic Attic display/inspector missing');
  const colors = [
    ['RED','#ff244d'],['GREEN','#29ff63'],['BLUE','#2878ff'],
    ['CYAN','#21f4ff'],['MAGENTA','#ff32ef'],['YELLOW','#fff02d'],
    ['ORANGE','#ff8b24'],['CHARTREUSE','#b8ff2c'],['SPRING GREEN','#27ffad'],
    ['AZURE','#2bb7ff'],['VIOLET','#8c45ff'],['ROSE','#ff4f9d'],['WHITE','#ffffff'],
    ['EMBER','#ff5b35'],['LIME','#78ff38'],['MINT','#38ffd2'],['SKY','#42d7ff'],
    ['INDIGO','#5b59ff'],['FUCHSIA','#e34cff'],['PINK','#ff70bb'],['GOLD','#ffd34a'],['ICE','#b8f7ff']
  ];
  const stages = {
    1:{count:3, rows:[3], note:'3 Chromalucents · RGB'},
    2:{count:6, rows:[3,3], note:'6 Chromalucents · RGB + CMY'},
    3:{count:13, rows:[7,6], note:'13 Chromalucents'},
    4:{count:22, rows:[7,8,7], note:'22 Chromalucents · complete display'}
  };
  function crystal([name,color],i){
    const c=document.createElement('div'); c.className='crystal'; c.style.setProperty('--c',color);
    c.style.animationDuration=(3.2+(i%5)*.27)+'s';
    c.tabIndex=-1;
    c.setAttribute('role','button');
    c.dataset.crystalName=name;
    c.dataset.crystalHex=color.toUpperCase();
    c.setAttribute('aria-label','Inspect '+name+' Chromalucent ('+color.toUpperCase()+')');
    c.title=name+' · '+color.toUpperCase()+' · reference only';
    const core=document.createElement('div'); core.className='crystal-core';
    const label=document.createElement('span'); label.className='crystal-name'; label.textContent=name;
    c.append(core,label); return c;
  }
  function inspect(element){
    if(!element || !display.contains(element))return;
    const name=element.dataset.crystalName,hex=element.dataset.crystalHex;
    if(!name || !/^#[0-9A-F]{6}$/.test(hex))return;
    inspector.textContent='CHROMALUCENT · '+name+' · '+hex+' · Reference preview only; not owned or equipped.';
    inspector.hidden=false;
  }
  display.addEventListener('click',event=>{
    const crystal=event.target.closest?.('.crystal[data-crystal-hex]');
    if(crystal)inspect(crystal);
  });
  display.addEventListener('keydown',event=>{
    const crystal=event.target.closest?.('.crystal[data-crystal-hex]');
    if(!crystal || !display.contains(crystal))return;
    if(event.key==='Enter' || event.key===' '){
      event.preventDefault();
      inspect(crystal);
    }else if(event.key==='ArrowLeft' || event.key==='ArrowRight'){
      const all=[...display.querySelectorAll('.crystal[data-crystal-hex]')];
      const i=all.indexOf(crystal),delta=event.key==='ArrowRight'?1:-1;
      const next=all[i+delta];
      if(next){event.preventDefault();next.focus();inspect(next);}
    }
  });
  function render(stage){
    const s=stages[stage];
    inspector.hidden=true;inspector.textContent='';
    display.replaceChildren();
    const field=document.createElement('div'); field.className='crystal-field';
    let n=0;
    s.rows.forEach(amount=>{
      const row=document.createElement('div'); row.className='crystal-row';
      for(let i=0;i<amount && n<s.count;i++,n++) row.append(crystal(colors[n],n));
      field.append(row);
    });
    const note=document.createElement('div'); note.className='stage-note'; note.textContent=s.note;
    display.append(field,note);
  }
  document.querySelectorAll('input[name="stage"]').forEach(r=>r.addEventListener('change',()=>render(Number(r.value))));
  render(1);
})();