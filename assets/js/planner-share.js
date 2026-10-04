/* Cópias portáteis por série/disciplina: dados publicados, sem estado pessoal. */
(function () {
  'use strict';
  const labels={s9:'9º ano',s1:'1ª série',s2:'2ª série',s3:'3ª série',historia:'História',filosofia:'Filosofia',sociologia:'Sociologia'};
  const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  function source(){return window.MaluPublishedContent.clone();}
  function clean(element){
    const copy=element.cloneNode(true);
    copy.querySelectorAll('script,iframe,textarea,input,button,form,.atv-prof,.build,.ux-answer').forEach(n=>n.remove());
    for(const n of [copy,...copy.querySelectorAll('*')]) {
      for(const a of [...n.attributes])if(/^on/i.test(a.name)||a.name==='data-save'||a.name==='contenteditable')n.removeAttribute(a.name);
      if(n.tagName==='A') {try{const url=new URL(n.getAttribute('href'),location.href);if(!['https:','http:'].includes(url.protocol))n.removeAttribute('href');else n.href=url.href;}catch{n.removeAttribute('href');}n.target='_blank';n.rel='noopener';}
    }
    return copy.outerHTML;
  }
  function groups(){const map=new Map();for(const card of source().querySelectorAll('article.week-card')){
    const id=card.id.split('-semana-')[0],[s,d]=id.split('-');if(!map.has(id))map.set(id,{id,label:labels[s]+' · '+labels[d],classes:window.MaluPlannerCore.CLASSES[s]});
  }return [...map.values()];}
  function buildHtml(selections,kind,title,baseCss){
    if(!['alunos','professor'].includes(kind))throw Error('Escolha o tipo de versão.');
    const available=groups(),valid=new Map(available.map(g=>[g.id,g])),seen=new Set();
    const root=source(),items=[];
    for(const selection of selections) {
      const g=valid.get(selection.id);if(!g||seen.has(g.id))throw Error('Seleção inválida.');seen.add(g.id);
      const classes=[...new Set(selection.classes)].filter(c=>g.classes.includes(c));if(!classes.length)throw Error('Selecione ao menos uma turma para '+g.label+'.');
      const lessons=[];
      for(const c of root.querySelectorAll('article.week-card'))if(c.id.startsWith(g.id+'-semana-')){
        const notebook=c.querySelector('.wide.notebook'),activity=c.querySelector('.atv-aluno');
        const exam=window.MaluStudy.exams(c);
        const lesson={exames:exam?clean(exam):'<p>Não há questão vinculada a esta aula na seleção pesquisada de 2016–2025. Isso não significa que o conteúdo nunca tenha sido cobrado.</p>',id:c.id,title:c.querySelector('.week-head h3').textContent.trim(),quadro:clean(notebook),esquema:clean(window.MaluStudy.board(c)),atividade:clean(activity),fontes:[]};
        const refs=new Map();
        function addSource(t,u,n){if(!/^https?:\/\//.test(u))return;const old=refs.get(u);refs.set(u,{t:n?t:(old?.t||t),u,n:n||old?.n||''});}
        for(const f of JSON.parse(c.dataset.fontes||'[]'))addSource(f.t,f.u,'');
        const study=window.MaluStudyData?.lessons[c.id];
        for(const ref of study?.refs||[]){const [t,u,n]=window.MaluStudyData.sources[ref];addSource(t,u,n);}
        const bibliography=window.MaluBibliographyData;
        for(const entry of bibliography?.lessons[c.id]?.entries||[]){
          const [t,u,n]=entry.source?bibliography.sources[entry.source]:window.MaluStudyData.sources[entry.ref];addSource(t,u,n);
        }
        lesson.fontes=[...refs.values()];
        if(kind==='professor') {
          const glossary=window.MaluGlossary.build(c,notebook);window.MaluStudy.attach(c);
          const prepare=node('section');const grid=c.querySelector('.plan-grid');if(grid)prepare.append(grid.cloneNode(true));if(glossary)prepare.append(glossary);const teacher=c.querySelector('.prof-panel');if(teacher)prepare.append(teacher.cloneNode(true));const answers=c.querySelector('.atv-prof');if(answers){const a=answers.cloneNode(true);a.classList.remove('atv-prof');a.classList.add('share-teacher-answers');const details=node('details');details.append(node('summary','Respostas e orientações da atividade'),a);prepare.append(details);}lesson.preparacao=clean(prepare);
        }
        lessons.push(lesson);
      }
      items.push({label:g.label,classes,lessons});
    }
    if(!items.length)throw Error('Selecione ao menos uma série e disciplina.');
    const data=JSON.stringify({kind,title:title.trim()||'Material de aula',items}).replace(/</g,'\\u003c');
    const css=baseCss.replace(/<\/style/gi,'');
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Material de aula</title><style>'+css+`
      body{margin:0!important;background:#f3f5f0!important;color:#243730;font-family:system-ui,sans-serif!important}body *{box-sizing:border-box}
      .share-header,.share-controls{padding:14px 18px;background:#fff;border-bottom:1px solid #dce4de}.share-header h1{margin:0;font:500 1.45rem/1.3 Georgia,serif}.share-header p{margin:5px 0;font-size:.85rem;color:#52655a}
      .share-controls{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:10px}.share-controls select{max-width:100%;flex:1;min-width:180px}.share-controls button,.share-controls select{font:600 .95rem system-ui;min-height:44px;padding:8px 12px;border:1px solid #ccd9cf;border-radius:9px;background:#fff;color:#243730}.share-controls button[aria-pressed=true],.share-controls button[aria-selected=true],#shareProject{background:#245c49;color:white}
      .share-weeks,.share-tabs{display:flex;gap:5px;width:100%}.share-weeks button{flex:1;padding:8px 0}.share-tabs{flex-wrap:wrap}.share-title{padding:14px 18px;margin:0;font-size:1.2rem}.share-content{max-width:1100px;margin:auto;padding:12px}.share-content .wide{width:100%!important;max-width:100%!important}.share-content .notebook{margin:0!important}.share-content a{overflow-wrap:anywhere}.share-content table{max-width:100%}.share-content .table-wrap{overflow-x:auto}.share-content .prof-panel{padding:18px}.share-content .ux-glossary,.share-content .ux-study{padding:16px;margin:12px 0;border:1px solid #dce4de;background:#fff}.share-content dd{margin:0 0 14px}.share-content dt{font-weight:700}.share-content .ux-study h5{font-size:1rem}.share-content .ux-study-original{margin-top:18px}.share-content .ux-study-sources p{font-size:.9rem}.share-content .share-sources li{padding:12px 0}
      .ux-board-model{padding:18px;background:white;line-height:1.55}.ux-board-model dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0}.ux-board-concept{border:1px solid #cddbd3;border-top:4px solid #56826c;border-radius:9px;overflow:hidden}.ux-board-caption{font-size:.86em;color:#587062}@media(max-width:700px){.ux-board-model dl{grid-template-columns:1fr}}.ux-board-model dt{font-weight:700;background:#f3f6ef;padding:10px 12px}.ux-board-model dd{margin:0;padding:10px 12px 18px}.ux-board-question{border-left:3px solid #245c49;padding:12px;background:#f3f6ef}.ux-teacher-guide{margin:12px 0;padding:12px;border:1px solid #dce5dd;border-radius:8px}.ux-exam-item{padding:12px 0;border-bottom:1px solid #dce5dd}.ux-editorial-note{font-size:.85rem;color:#52655a}.ux-exam-connections a{overflow-wrap:anywhere}
      .share-project .share-header,.share-project .share-title{display:none}.share-project .share-controls{padding:4px 6px;gap:4px}.share-project .share-tabs{flex-wrap:nowrap;overflow-x:auto}.share-project .share-tabs button{flex:0 0 auto;white-space:nowrap;padding:6px 9px;font-size:.8rem}.share-project .share-weeks button{min-height:36px;padding:4px 0}.ux-bibliography{margin-top:20px;padding:16px;background:#f6f8f2;border:1px solid #dce5dd}.ux-bibliography li{margin:16px 0}.ux-bibliography a{overflow-wrap:anywhere}.share-project .share-content{max-width:none;font-size:1.2em}.share-project [data-material=preparacao]{display:none}
      @media print{.share-controls,.share-header{display:none!important}.share-content{display:block!important;padding:0!important}.share-title{display:block!important}}
      </style></head><body><header class="share-header"><h1 id="shareHeading"></h1><p id="shareAudience"></p></header><nav class="share-controls" aria-label="Escolher material"><select id="shareGroup" aria-label="Série e disciplina"></select>${kind==='professor'?'<button id="shareProject" type="button">Projetar quadro</button>':''}<div class="share-weeks" aria-label="Semanas"></div><div class="share-tabs" role="tablist"></div></nav><h2 class="share-title"></h2><main class="share-content"></main><script id="shareData" type="application/json">`+data+`</script><script>
      (function(){'use strict';const data=JSON.parse(document.getElementById('shareData').textContent),select=document.getElementById('shareGroup'),content=document.querySelector('.share-content'),weeks=document.querySelector('.share-weeks'),tabs=document.querySelector('.share-tabs');let index=0,material='quadro';
      document.title=data.title;document.getElementById('shareHeading').textContent=data.title;
      data.items.forEach((g,i)=>{const o=document.createElement('option');o.value=i;o.textContent=g.label;select.append(o);});
      const materials=data.kind==='professor'?[['preparacao','Preparação'],['quadro','Quadro'],['esquema','Esquema'],['atividade','Atividades'],['exames','Exames'],['fontes','Fontes']]:[['quadro','Caderno'],['esquema','Esquema'],['atividade','Atividades'],['exames','Exames'],['fontes','Fontes e repertório']];
      materials.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.dataset.material=key;b.textContent=label;b.setAttribute('role','tab');b.onclick=()=>{material=key;render();};tabs.append(b);});
      function render(){const g=data.items[Number(select.value)],lesson=g.lessons[index];document.getElementById('shareAudience').textContent=g.classes.join(' · ');document.querySelector('.share-title').textContent=lesson.title;content.replaceChildren();weeks.replaceChildren();g.lessons.forEach((l,i)=>{const b=document.createElement('button');b.textContent=i+1;b.setAttribute('aria-label','Semana '+(i+1));b.setAttribute('aria-pressed',String(i===index));b.onclick=()=>{index=i;render();window.scrollTo(0,0);};weeks.append(b);});
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.material===material)));
      if(material==='fontes'){const ul=document.createElement('ul');ul.className='share-sources';lesson.fontes.forEach(f=>{const li=document.createElement('li'),a=document.createElement('a');a.textContent=f.t;a.href=f.u;a.target='_blank';a.rel='noopener';li.append(a);if(f.n){const note=document.createElement('p');note.textContent=f.n;li.append(note);}ul.append(li);});content.append(ul);if(!lesson.fontes.length)content.textContent='Nenhuma fonte cadastrada nesta aula.';}else content.innerHTML=lesson[material]||'';}
      select.onchange=()=>{index=0;render();window.scrollTo(0,0);};const project=document.getElementById('shareProject');if(project)project.onclick=()=>{const on=document.body.classList.toggle('share-project');material='quadro';document.getElementById('shareProject').textContent=on?'Sair da projeção':'Projetar quadro';render();window.scrollTo(0,0);};document.addEventListener('keydown',e=>{if(project&&e.key==='Escape'&&document.body.classList.contains('share-project'))project.click();});render();})();
      </script></body></html>`;
  }
  function setup(){
    const button=node('button','Compartilhar material');button.type='button';button.id='shareMaterial';button.setAttribute('aria-haspopup','dialog');document.querySelector('#navTools .tools-actions').append(button);
    const dialog=node('dialog');dialog.id='shareDialog';dialog.setAttribute('aria-labelledby','shareDialogTitle');
    dialog.innerHTML='<form method="dialog"><h2 id="shareDialogTitle">Criar versão para compartilhar</h2><p>Uma cópia do material publicado, sem suas edições, anotações, marcações ou sincronização.</p><label>Versão <select id="shareKind"><option value="professor">Professor</option><option value="alunos">Alunos</option></select></label><label>Título <input id="shareName" placeholder="Ex.: Material do professor Andrei"></label><div id="shareChoices"></div><p id="shareMessage" role="status"></p><div class="share-dialog-actions"><button value="cancel">Cancelar</button><button id="shareDownload" type="button">Baixar versão em HTML</button></div></form>';
    for(const g of groups()) {
      const field=node('fieldset'),legend=node('legend'),label=node('label'),check=node('input');check.type='checkbox';check.value=g.id;check.dataset.shareGroup='';label.append(check,document.createTextNode(g.label));legend.append(label);field.append(legend);
      for(const turma of g.classes){const l=node('label'),c=node('input');c.type='checkbox';c.value=turma;c.dataset.shareClass='';c.checked=true;l.append(c,document.createTextNode(turma));field.append(l);}
      check.onchange=()=>field.querySelectorAll('[data-share-class]').forEach(c=>c.disabled=!check.checked);field.dataset.group=g.id;dialog.querySelector('#shareChoices').append(field);
    }
    document.body.append(dialog);button.onclick=()=>{document.getElementById('navTools').open=false;const selected=document.getElementById('uxSeries').value+'-'+document.getElementById('uxSubject').value;dialog.querySelectorAll('[data-share-group]').forEach(c=>{c.checked=c.value===selected;c.onchange();});dialog.querySelector('#shareMessage').textContent='';dialog.showModal();};
    dialog.querySelector('#shareDownload').onclick=async()=>{
      const status=dialog.querySelector('#shareMessage'),download=dialog.querySelector('#shareDownload');download.disabled=true;
      try {
        const selections=[...dialog.querySelectorAll('fieldset')].filter(f=>f.querySelector('[data-share-group]').checked).map(f=>({id:f.dataset.group,classes:[...f.querySelectorAll('[data-share-class]:checked')].map(c=>c.value)}));
        if(!selections.length)throw Error('Selecione ao menos uma série e disciplina.');
        const response=await fetch(new URL('assets/css/planner-base.css',document.baseURI));if(!response.ok)throw Error('Não foi possível carregar o estilo. Tente novamente com conexão.');
        const html=buildHtml(selections,dialog.querySelector('#shareKind').value,dialog.querySelector('#shareName').value,await response.text());
        const a=node('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));a.download='material-'+dialog.querySelector('#shareKind').value+'.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),10000);status.textContent='Versão baixada. Você pode enviar esse arquivo; ele abre no navegador e funciona sem conexão, exceto os links de fontes.';
      }catch(e){status.textContent=e.message;}finally{download.disabled=false;}
    };
  }
  window.MaluShare={buildHtml,groups};setup();
})();
