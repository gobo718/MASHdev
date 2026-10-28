/* MASHpedition 06-07 · The Rough Stuff authoritative-snapshot presentation.
 * Existing Studio draft-library module is the only source for sorting,
 * date/letter/time validation, reference kind, and 1-day Trash deadline.
 * The page contains NO sample drafts, storage, deletion, auto-save, or
 * client-side decision that a player owns an image/project.
 * The account service supplies drafts via setSnapshot(). Server-approved
 * actions must be attached separately; IDs alone never prove permission. */
(() => {
  'use strict';
  const library=globalThis.MASHStudioDraftLibrary;
  const navigation=globalThis.MASHStudioDraftNavigation;
  const list=document.querySelector('#drafts');
  const status=document.querySelector('#drafts-status');
  const trashButton=document.querySelector('[data-trash]');
  const sortButtons=[...document.querySelectorAll('[data-sort]')];
  const viewButtons=[...document.querySelectorAll('[data-view]')];
  if(!library||!list||!status)throw new Error('Rough Stuff cannot initialize without the draft projection');
  let snapshot=null;
  let handlers=Object.freeze({});
  let view='thumbnails',sortBy=null,direction=null,showTrash=false;
  let actionInFlight=false;
  const safeId=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
  const create=(tag,className,text)=>{
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=String(text);
    return element;
  };
  function validateSnapshot(data){
    if(!data||typeof data!=='object'||Array.isArray(data)
       ||!Array.isArray(data.drafts)||!Array.isArray(data.trashed))
      throw new TypeError('Expected server-provided drafts and trashed arrays');
    library.projectDrafts(data.drafts);
    const used=new Set(data.drafts.map(x=>x.id));
    for(const item of data.trashed){
      if(!item||typeof item!=='object'||!safeId(item.id)||used.has(item.id))
        throw new TypeError('Invalid or duplicate Trash record identity');
      used.add(item.id);
      library.oneDayTrashDeadline(item.deletedAt);
      if(typeof item.title!=='string'||typeof item.type!=='string')
        throw new TypeError('Trash record requires a title and Creation type');
    }
    return {drafts:data.drafts.map(x=>({...x})),
      trashed:data.trashed.map(x=>({...x})),
      receivedAt:new Date().toISOString()};
  }
  function statusText(value){
    status.textContent=value;
    status.hidden=!value;
  }
  function button(text,onClick){
    const b=create('button','',text);
    b.type='button';b.addEventListener('click',onClick);
    return b;
  }
  function formatDate(iso){return new Date(iso).toLocaleDateString();}
  function openIntent(record,action){
    if(!safeId(record.id)||!safeId(record.revision))
      throw new TypeError('A server record revision and stable ID are required for draft actions');
    return library.prepareDraftAction({action,draftId:record.id,expectedRevision:record.revision});
  }
  function renderDraft(draft,source){
    const article=create('article','draft-card');
    const ref=draft.reference;
    const imageKind=ref?.kind==='owned'?'owned':ref?.kind==='non_owned'?'postit':'meme';
    const placeholder=ref?.kind==='owned'?'OWNED IMAGE\nREFERENCE':ref?.kind==='non_owned'?'IMAGE\nREFERENCE':'DRAFT\nTHUMBNAIL';
    const art=create('div','ref '+imageKind,placeholder);
    art.setAttribute('aria-label',ref?'Image reference ('+(ref.kind==='owned'?'owned':'non-owned')+')':'Draft thumbnail');
    article.append(art);
    article.append(create('b','draft-title',draft.title||draft.type));
    article.append(create('p','draft-type',draft.type));
    article.append(create('p','draft-metadata',
      'START '+formatDate(draft.startedAt)+' · LAST '+formatDate(draft.lastWorkedAt)+
      ' · LETTERS '+draft.letterCount+' · TIME '+draft.totalTimeSeconds+'s'));
    const footer=create('footer');
    const open=button('SEND TO EASEL',()=>execute('open-in-easel',source));
    open.disabled=!handlers.openDraft||!safeId(source.revision)||actionInFlight;
    if(open.disabled)open.title='Requires a server-authorized draft loader';
    footer.append(open);
    const del=button('DELETE',()=>execute('move-to-trash',source));
    del.className='delete';
    del.disabled=!handlers.moveToTrash||!safeId(source.revision)||actionInFlight;
    if(del.disabled)del.title='Requires server-authorized Trash action';
    footer.append(del);
    article.append(footer);
    return article;
  }
  function renderTrashed(item){
    const article=create('article','draft-card trash-card');
    article.append(create('b','draft-title',item.title||item.type));
    article.append(create('p','draft-type',item.type));
    article.append(create('p','draft-metadata','IN TRASH · DEADLINE '+new Date(library.oneDayTrashDeadline(item.deletedAt)).toLocaleString()));
    // Not an active draft: no unauthenticated restore or direct deletion.
    return article;
  }
  function render(){
    list.replaceChildren();
    list.classList.toggle('parade',view==='parade'&&!showTrash);
    for(const b of viewButtons){
      b.classList.toggle('active',b.dataset.view===(view==='thumbnails'?'thumbs':'parade'));
      b.setAttribute('aria-pressed',String(b.classList.contains('active')));
    }
    for(const b of sortButtons){
      b.classList.toggle('active',sortBy===b.dataset.sort);
      b.setAttribute('aria-pressed',String(sortBy===b.dataset.sort));
      b.title=sortBy===b.dataset.sort?'Sorted '+direction:'Sort drafts';
    }
    trashButton.classList.toggle('active',showTrash);
    trashButton.setAttribute('aria-pressed',String(showTrash));
    if(!snapshot){statusText('Saved drafts are not connected to an account in this build.');return;}
    if(showTrash){
      snapshot.trashed.forEach(item=>list.append(renderTrashed(item)));
      statusText(snapshot.trashed.length?'': 'No items in the supplied Trash snapshot.');
      return;
    }
    const model=library.projectDrafts(snapshot.drafts,{view,sortBy,direction});
    const original=new Map(snapshot.drafts.map(draft=>[draft.id,draft]));
    model.items.forEach(draft=>list.append(renderDraft(draft,original.get(draft.id))));
    statusText(model.total?'':'No drafts in the supplied account snapshot.');
  }
  async function execute(action,record){
    const callback=action==='open-in-easel'?handlers.openDraft:handlers.moveToTrash;
    if(actionInFlight||typeof callback!=='function')return;
    let intent;
    try{intent=openIntent(record,action);}catch(e){statusText('Draft action unavailable: '+e.message);return;}
    actionInFlight=true;render();
    try{
      const response=await callback(intent);
      if(action==='open-in-easel'){
        // The service must return authorization and the linked project ID.
        if(!response||response.authorized!==true||!safeId(response.projectId))
          throw new Error('The account service did not authorize opening this draft.');
        if(!navigation)throw new Error('Studio draft navigation is not available.');
        const url=navigation.easelHref({draftId:record.id,projectId:response.projectId});
        window.location.assign(url);
      }else{
        // Do not remove cards locally: only a new authoritative snapshot can
        // change the displayed draft/Trash membership.
        if(!response||response.applied!==true)
          throw new Error('The account service did not confirm the Trash action.');
        statusText('Trash action accepted. Awaiting updated account records.');
      }
    }catch(e){statusText('Draft action could not finish: '+(e?.message||'account service error'));}
    finally{actionInFlight=false;render();} // Rendering state remains server-sourced.
  }
  viewButtons.forEach(b=>b.addEventListener('click',()=>{
    view=b.dataset.view==='parade'?'parade':'thumbnails';showTrash=false;render();
  }));
  sortButtons.forEach(b=>b.addEventListener('click',()=>{
    const next=b.dataset.sort;
    if(!library.SORT_FIELDS.includes(next))return;
    if(sortBy===next)direction=direction==='desc'?'asc':'desc';
    else {sortBy=next;direction='desc';}
    showTrash=false;render();
  }));
  trashButton.addEventListener('click',()=>{showTrash=!showTrash;render();});
  window.MASHRoughStuff=Object.freeze({
    setSnapshot(data){snapshot=data===null?null:validateSnapshot(data);render();},
    setActionHandlers(next){
      if(!next||typeof next!=='object'||Array.isArray(next)
        ||Object.keys(next).some(key=>!['openDraft','moveToTrash'].includes(key))
        ||Object.values(next).some(fn=>typeof fn!=='function'))
        throw new TypeError('Only account-service action callbacks are allowed');
      handlers=Object.freeze({...next});render();
    }
  });
  render();
})();
