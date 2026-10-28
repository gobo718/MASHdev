/* MASHpedition · 19-03 optional keyboard navigation for the standalone Parade.
   Reuses its existing LEFT/RIGHT controls. Touch gestures and artwork layout
   remain unchanged; keyboard arrows do nothing while THUMBNAILS are open. */
(function(root){
 'use strict';
 if(!root||!root.document)return;
 const doc=root.document;
 const editable=el=>!!(el&&typeof el.closest==='function'&&
   el.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"]'));
 doc.addEventListener('keydown',event=>{
   if(event.defaultPrevented||event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
   if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
   if(editable(event.target)||editable(doc.activeElement))return;
   const shell=doc.getElementById('endlessShell');
   if(!shell||shell.dataset.view!=='wall')return;
   if(doc.querySelector('dialog[open],[role="dialog"][aria-modal="true"]'))return;
   const control=doc.getElementById(event.key==='ArrowLeft'?'leftBtn':'rightBtn');
   if(!control||control.disabled||control.hidden||control.getAttribute('aria-hidden')==='true')return;
   event.preventDefault();
   control.click();
 });
})(typeof window!=='undefined'?window:null);
