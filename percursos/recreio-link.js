(function(){
'use strict';
for(const id of ['entry','home']){
 const host=document.getElementById(id);if(!host)continue;
 const card=document.createElement('div');card.style.cssText='margin:20px 0;padding:18px;border:1px solid #ddd7f6;border-radius:16px;background:#f5f1ff';
 const title=document.createElement('strong');title.textContent='Recreio';title.style.cssText='display:block;font-size:20px;margin-bottom:6px';
 const text=document.createElement('p');text.textContent='Uma pausa com jogos de lógica, palavras e estratégia.';text.style.cssText='margin:0 0 14px;line-height:1.5';
 const link=document.createElement('a');link.href='recreio.html'+location.hash;link.textContent='Abrir os jogos →';link.style.cssText='display:inline-block;padding:12px 18px;border-radius:12px;background:#6752d5;color:#fff;font-weight:800;text-decoration:none;min-height:48px';
 card.append(title,text,link);host.appendChild(card);
}
})();
