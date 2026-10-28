/* MASHpedition · 19-03 optional desktop/foldable keyboard navigation.
   Reuses existing Exhibit LEFT/RIGHT buttons. Does not replace touch/tap or
   change room transitions, typography, geometry, or authored controls. */
(function(root){
  'use strict';
  if(!root||!root.document)return;
  const doc=root.document;
  const editable=el=>{
    if(!el||typeof el.closest!=='function')return false;
    return !!el.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"]');
  };
  doc.addEventListener('keydown',function(event){
    if(event.defaultPrevented||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    if(editable(event.target)||editable(doc.activeElement))return;
    const shell=doc.getElementById('exhibitShell');
    if(!shell)return;
    const expanded=doc.getElementById('artworkExpand');
    if(expanded&&expanded.classList.contains('is-open'))return;
    if(doc.querySelector('dialog[open],[role="dialog"][aria-modal="true"]'))return;
    const control=doc.getElementById(event.key==='ArrowLeft'?'leftBtn':'rightBtn');
    if(!control||control.disabled||control.hidden||control.getAttribute('aria-hidden')==='true')return;
    event.preventDefault();
    control.click();
  });
})(typeof window!=='undefined'?window:null);
