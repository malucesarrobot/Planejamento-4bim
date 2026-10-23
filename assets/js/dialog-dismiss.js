(() => {
  'use strict';
  let startedOutside=null;
  function outside(event,dialog){const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;}
  document.addEventListener('pointerdown',event=>{const d=event.target;startedOutside=d.matches?.('dialog[open]')&&outside(event,d)?d:null;});
  document.addEventListener('click',event=>{
    const d=event.target,started=startedOutside;startedOutside=null;
    if(d.id==='syncView'){document.getElementById('syncClose')?.click();return;}
    if(d!==started||!d.matches?.('dialog[open]')||!outside(event,d))return;
    const cancel=new Event('cancel',{cancelable:true});if(d.dispatchEvent(cancel))d.close();
  });
})();
