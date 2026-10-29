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
  const crystalItems=()=>[...display.querySelectorAll('.crystal[data-crystal-hex]')];
  function selectCrystal(target,focus=false,show=false){
    if(!target||!display.contains(target))return;
    for(const item of crystalItems())item.tabIndex=item===target?0:-1;
    if(focus)target.focus({preventScroll:true});
    if(show)inspect(target);
  }
  function verticalTarget(current,step){
    const row=current.closest('.crystal-row');
    const rows=row?[...row.parentElement.querySelectorAll('.crystal-row')]:[];
    const neighbor=rows[rows.indexOf(row)+step];
    if(!neighbor)return null;
    const items=[...neighbor.querySelectorAll('.crystal[data-crystal-hex]')];
    if(!items.length)return null;
    const rect=current.getBoundingClientRect(),center=rect.left+rect.width/2;
    return items.reduce((best,item)=>{
      const box=item.getBoundingClientRect();
      const distance=Math.abs(box.left+box.width/2-center);
      return !best||distance<best.distance?{item,distance}:best;
    },null)?.item||null;
  }
  display.addEventListener('focusin',event=>{
    const target=event.target.closest?.('.crystal[data-crystal-hex]');
    if(target)selectCrystal(target);
  });
  display.addEventListener('click',event=>{
    const target=event.target.closest?.('.crystal[data-crystal-hex]');
    if(target)selectCrystal(target,true,true);
  });
  display.addEventListener('keydown',event=>{
    const target=event.target.closest?.('.crystal[data-crystal-hex]');
    if(!target||!display.contains(target)||event.defaultPrevented||
       event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();selectCrystal(target,false,true);return;
    }
    const all=crystalItems(),i=all.indexOf(target);
    if(i<0)return;
    let next=null;
    if(event.key==='ArrowUp')next=verticalTarget(target,-1);
    else if(event.key==='ArrowDown')next=verticalTarget(target,1);
    else if(event.key==='ArrowLeft')next=all[i-1];
    else if(event.key==='ArrowRight')next=all[i+1];
    else if(event.key==='Home')next=all[0];
    else if(event.key==='End')next=all[all.length-1];
    if(!next)return;
    event.preventDefault();selectCrystal(next,true,true);
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
    const first=crystalItems()[0];
    if(first)first.tabIndex=0;
  }
  document.querySelectorAll('input[name="stage"]').forEach(r=>r.addEventListener('change',()=>render(Number(r.value))));
  render(1);
})();