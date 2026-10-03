(() => {
  'use strict';
  const C = window.MaluPlannerCore, planner = window.MaluPlanner;
  if (!C || !planner) return;
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('article.week-card')];
  const bases = new Map(), panels = new Map(), remembered = new Map();
  const classSelect = $('uxClass'), subjectSelect = $('uxSubject');
  const fieldFor = id => document.querySelector('textarea[data-save="ux-' + id + '-edits"]');
  const viewKey = 'malu-ui-view';
  let current = null, realClass = '9ºA', undoAction = null, restoring = true;
  let editorState = null, editorDirty = false, printState = [];
  function el(tag, cls, text) { const n=document.createElement(tag); if(cls)n.className=cls; if(text != null)n.textContent=text; return n; }
  function feedback(message, undo) {
    $('uxFeedback').hidden=false; $('uxFeedbackText').textContent=message;
    if ($('uxEditor') && $('uxEditor').open && $('uxEditorMessage')) $('uxEditorMessage').textContent=message;
    undoAction=undo || null; $('uxUndo').hidden=!undoAction;
  }
  $('uxUndo').addEventListener('click',()=>{ const fn=undoAction; undoAction=null; if(fn)fn(); $('uxUndo').hidden=true; });
  function closeTools() { $('navTools').open=false; }
  function activeSection() { const v=planner.getSelection(); return $(v.s+'-'+v.d); }
  function matches() { const section=activeSection(); return section ? [...section.querySelectorAll('article.week-card')].filter(c=>!c.classList.contains('hidden')) : []; }
  function weekNumber(card) { return Number(card.id.split('-semana-')[1]); }
  function weekTitle(card) { return card.querySelector('.week-head h3').textContent.trim(); }
  function saveView() {
    if(restoring)return;
    const v=planner.getSelection();
    try{localStorage.setItem(viewKey,JSON.stringify({s:v.s,d:v.d,w:current,t:realClass}));}catch(e){}
  }
  function toolbarHeight() { document.documentElement.style.setProperty('--toolbar-h', $('navShell').parentElement.offsetHeight+'px'); }
  function rememberClass() {
    const v=planner.getSelection();
    if(!C.CLASSES[v.s].includes(realClass))realClass=C.CLASSES[v.s][0];
    classSelect.value=v.s+'|'+realClass;
    subjectSelect.value=v.d;
    for(const opt of subjectSelect.options)opt.disabled=v.s==='s9' && opt.value!=='historia';
  }
  function refresh(preferred, focus) {
    rememberClass();
    const eligible=matches(), ids=eligible.map(c=>c.id);
    current=C.chooseWeek(ids,preferred || current);
    for(const c of cards)c.classList.toggle('ux-inactive',c.id!==current);
    const choices=$('uxWeekChoices'); choices.replaceChildren();
    for(const c of eligible) {
      const b=el('button','ux-week-number',String(weekNumber(c)));
      b.type='button';b.setAttribute('aria-label','Semana '+weekNumber(c)+': '+weekTitle(c));b.title=weekTitle(c);
      b.setAttribute('aria-pressed',String(c.id===current));
      b.addEventListener('click',()=>showWeek(c.id,true));choices.appendChild(b);
    }
    const i=ids.indexOf(current),c=current && $(current);
    $('wkPrev').disabled=i<=0; $('wkNext').disabled=i<0 || i>=ids.length-1; $('wkProject').disabled=!c;
    $('wkLabel').textContent=c ? 'Semana '+weekNumber(c)+' · '+realClass : 'Nenhuma aula encontrada';
    $('uxEmpty').hidden=!!c;
    if(c)remembered.set(activeSection().id,c.id);
    $('uxResume').textContent=c ? 'Sua aula · '+realClass+' · '+subjectSelect.selectedOptions[0].textContent+' · semana '+weekNumber(c) : '';
    refreshMarks();toolbarHeight();saveView();
    if(focus && c) { c.querySelector('.week-head h3').focus({preventScroll:true});c.scrollIntoView({block:'start',behavior:'auto'}); }
  }
  function showWeek(id, focus) { refresh(id,focus); }
  $('wkPrev').addEventListener('click',()=>{const list=matches(),i=list.findIndex(c=>c.id===current);if(i>0)showWeek(list[i-1].id,true);});
  $('wkNext').addEventListener('click',()=>{const list=matches(),i=list.findIndex(c=>c.id===current);if(i>=0 && i<list.length-1)showWeek(list[i+1].id,true);});
  $('wkProject').addEventListener('click',()=>{if(current)window.openProjection(current);});
  classSelect.addEventListener('change',()=>{
    const [s,t]=classSelect.value.split('|');realClass=t;const d=subjectSelect.value;
    $('searchBox').value='';planner.setSelection(s,d);refresh(remembered.get(activeSection().id),false);
  });
  subjectSelect.addEventListener('change',()=>{
    $('searchBox').value='';planner.setSelection(planner.getSelection().s,subjectSelect.value);
    refresh(remembered.get(activeSection().id),false);
  });
  document.addEventListener('malu:selection',()=>{if(!restoring)refresh(remembered.get(activeSection().id));});
  document.addEventListener('malu:search',()=>{if(!restoring)refresh();});
  document.addEventListener('malu:projection',e=>{if(!restoring)refresh(e.detail.id);});
  document.querySelectorAll('a.track-item').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();const id=a.getAttribute('href').slice(1);showWeek(id,true);
  }));
  window.addEventListener('hashchange',()=>{
    const id=location.hash.slice(1),card=$(id);
    if(!card || !card.matches('article.week-card'))return;
    const m=id.match(/^(s9|s1|s2|s3)-(historia|filosofia|sociologia)-/);
    if(m){$('searchBox').value='';planner.setSelection(m[1],m[2]);showWeek(id,true);}
  });
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') || document.body.classList.contains('is-projecting') || document.body.classList.contains('is-aulas') || document.body.classList.contains('is-sync'))return;
    if(e.target.closest('input,textarea,select,[contenteditable]'))return;
    if(e.key==='p'||e.key==='P'){e.preventDefault();if(current)window.openProjection(current);}
  });

  // Preserve original nodes and stable note IDs. Screen panels only change presentation.
  function setPanel(card,key) {
    const set=panels.get(card.id); if(!set)return;
    for(const [k,p] of Object.entries(set)) {
      const active=k===key;p.classList.toggle('ux-panel-inactive',!active);
      const b=$(card.id+'-tab-'+k);b.setAttribute('aria-selected',String(active));b.tabIndex=active ? 0 : -1;
    }
    card.dataset.uxPanel=key;
  }
  function setupCard(card) {
    const notebook=card.querySelector('.wide.notebook'),activity=card.querySelector('.atv-aluno');
    if(!notebook || !activity)throw new Error('Aula sem caderno ou atividade: '+card.id);
    const head=card.querySelector('.week-head h3');head.tabIndex=-1;
    bases.set(card.id,{title:head.textContent,notebook:notebook.cloneNode(true),activity:activity.cloneNode(true)});
    const actions=el('div','ux-actions');actions.setAttribute('aria-label','Ações desta aula');
    const project=el('button','ux-primary','Projetar');project.type='button';project.addEventListener('click',()=>{
      const panel=card.dataset.uxPanel;
      if(panel==='activity')window.openProjectionAtv(card.id);else window.openProjection(card.id);
    });
    const edit=el('button',null,'Editar aula');edit.type='button';edit.addEventListener('click',()=>openEditor(card.id));
    const print=el('button',null,'Imprimir');print.type='button';print.addEventListener('click',()=>openPrint(card.id));
    const done=el('button','ux-mark','Marcar como dada');done.type='button';done.dataset.uxMark=card.id;
    done.addEventListener('click',()=>markGiven(card.id));
    const date=el('span','ux-given-date');date.dataset.uxDate=card.id;
    actions.append(project,edit,print,done,date);card.querySelector('.week-head').after(actions);
    const tabs=el('div','ux-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Conteúdo da aula');
    const set={};
    for(const [key,label] of [['prepare','Preparar aula'],['notebook','Caderno dos alunos'],['activity','Atividade']]) {
      const b=el('button',null,label);b.type='button';b.id=card.id+'-tab-'+key;
      b.setAttribute('role','tab');b.setAttribute('aria-controls',card.id+'-panel-'+key);
      b.addEventListener('click',()=>setPanel(card,key));tabs.appendChild(b);
      const p=el('div','ux-panel');p.id=card.id+'-panel-'+key;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;set[key]=p;
    }
    tabs.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      const all=[...tabs.querySelectorAll('button')],i=all.indexOf(document.activeElement);
      const next=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;
      e.preventDefault();all[next].click();all[next].focus();
    });
    actions.after(tabs);
    set.notebook.appendChild(notebook);
    const atv=card.querySelector('.atv-d'),body=atv.querySelector('.atv-body');
    const answer=body.querySelector('.atv-prof');
    if(answer){const d=el('details','ux-answer');d.appendChild(el('summary',null,'Orientações e respostas da professora'));d.appendChild(answer);body.appendChild(d);}
    set.activity.appendChild(body);atv.remove();
    const leftovers=[...card.children].filter(n=>n!==actions && n!==tabs && !n.classList.contains('week-head'));
    for(const n of leftovers)set.prepare.appendChild(n);
    const grid=set.prepare.querySelector('.plan-grid');
    if(grid){const d=el('details','ux-curriculum');d.appendChild(el('summary',null,'Conteúdo, habilidades e conceitos'));grid.before(d);d.appendChild(grid);}
    const notes=set.prepare.querySelector('.build');
    if(notes)notes.querySelector('summary').textContent='Minhas anotações (não aparecem na projeção)';
    const teacher=set.prepare.querySelector('.prof-caderno > summary');
    if(teacher)teacher.textContent='Fundamentação e roteiro da professora';
    card.append(set.prepare,set.notebook,set.activity);panels.set(card.id,set);setPanel(card,'prepare');
  }
  document.body.classList.remove('mode-aula');
  for(const card of cards)setupCard(card);
  document.querySelectorAll('.study-track').forEach(track=>{
    const d=el('details','ux-overview');d.appendChild(el('summary',null,'Ver as seis semanas do bimestre'));track.before(d);d.appendChild(track);
  });

  // Restore title, notebook and activity from text-only patches. No saved HTML is executed.
  function readEdits(id) { return C.parseEdits(fieldFor(id).value); }
  function applyCardEdits(id) {
    const card=$(id),base=bases.get(id);let data;
    try {
      data=readEdits(id);
      const nb=C.applyTextEdits(base.notebook.cloneNode(true),data.notebook);
      const ac=C.applyTextEdits(base.activity.cloneNode(true),data.activity);
      const title=data.title===null ? base.title : data.title;
      card.querySelector('.week-head h3').textContent=title;
      const nt=nb.querySelector('.registro-titulo'),at=ac.querySelector('.atv-titulo');
      if(nt && nt.textContent===base.title)nt.textContent=title;
      if(at && at.textContent===base.title)at.textContent=title;
      card.querySelector('.wide.notebook').replaceWith(nb);card.querySelector('.atv-aluno').replaceWith(ac);
      const tr=document.querySelector('a.track-item[href="#'+id+'"] .track-theme');
      if(tr)tr.textContent='Semana '+weekNumber(card)+' — '+title;
      return true;
    } catch(e) {feedback('Não foi possível aplicar uma edição em '+id+'. O original foi preservado. '+e.message);return false;}
  }
  cards.forEach(c=>applyCardEdits(c.id));
  function persistEdits(id,value) {
    const field=fieldFor(id),previous=field.value;
    try {localStorage.setItem('malu-'+field.dataset.save,value);}
    catch(e){feedback('Não foi possível salvar. Sua edição permanece aberta para você copiar.');return false;}
    field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));
    if(!applyCardEdits(id)){field.value=previous;localStorage.setItem('malu-'+field.dataset.save,previous);field.dispatchEvent(new Event('input',{bubbles:true}));return false;}
    planner.updateSearch();refresh(id);return true;
  }
  document.addEventListener('input',e=>{
    if(e.target.matches('textarea[data-save^="ux-"]')){applyCardEdits(e.target.dataset.save.slice(3,-6));}
    paintStorage();
  });
  document.addEventListener('malu:notes-restored',()=>{
    cards.forEach(c=>applyCardEdits(c.id));planner.updateSearch();refresh();
  });

  // One tap records this week's completion for the selected real class.
  function refreshMarks() {
    const data=window.__maluAulas.get();
    for(const card of cards) {
      const date=data[card.id+'|'+realClass],button=card.querySelector('[data-ux-mark]');
      button.textContent=date ? 'Dada para '+realClass+' ✓' : 'Marcar como dada para '+realClass;
      button.setAttribute('aria-pressed',String(!!date));
      card.querySelector('[data-ux-date]').textContent=date ? C.dateBR(date) : '';
    }
  }
  function setMark(key,date) {
    const data={...window.__maluAulas.get()};if(date)data[key]=date;else delete data[key];
    if(!window.__maluAulas.set(data)){feedback('Não foi possível salvar a marcação neste aparelho.');return false;}
    document.dispatchEvent(new CustomEvent('malu:aula',{detail:{key,date:date || null}}));refreshMarks();return true;
  }
  function markGiven(id) {
    const turma=realClass,key=id+'|'+turma,previous=window.__maluAulas.get()[key] || null;
    const date=previous ? null : C.dateLocal(new Date());
    if(setMark(key,date))feedback(date ? 'Semana marcada como dada para '+turma+'.' : 'Marcação retirada para '+turma+'.',()=>{setMark(key,previous);feedback('Marcação desfeita.');});
  }
  document.addEventListener('malu:aula',refreshMarks);document.addEventListener('malu:aulas-updated',refreshMarks);
  $('aulasClose').addEventListener('click',refreshMarks);
  $('importFile').addEventListener('change',()=>setTimeout(refreshMarks,100));

  // Native dialog: keyboard focus stays inside; cancel never changes stored content.
  const editor=el('dialog','ux-dialog');editor.id='uxEditor';editor.setAttribute('aria-labelledby','uxEditorHeading');
  editor.innerHTML='<form method="dialog"><header class="ux-dialog-head"><h2 id="uxEditorHeading">Editar aula</h2><button type="button" id="uxEditorClose" aria-label="Fechar edição">Fechar</button></header><p>Toque no texto para alterar. As mudanças aparecem na projeção e na impressão. Os desenhos e a disposição do conteúdo são preservados.</p><label class="ux-editor-title" for="uxEditTitle">Título da aula<input id="uxEditTitle" type="text"/></label><div class="ux-editor-tabs"><button type="button" id="uxEditNotebook" aria-pressed="true">Caderno dos alunos</button><button type="button" id="uxEditActivity" aria-pressed="false">Atividade</button></div><p id="uxEditorMessage" role="status" aria-live="polite"></p><div id="uxEditorPreview" class="ux-editor-preview"></div><footer class="ux-dialog-actions"><button type="button" id="uxRestoreOriginal">Restaurar original</button><button type="button" id="uxEditorCancel">Cancelar</button><button type="button" id="uxEditorSave" class="ux-primary">Salvar alterações</button></footer></form>';
  document.body.appendChild(editor);
  function editingTargets(root) {
    const semantic='h1,h2,h3,h4,h5,h6,p,li,td,th,figcaption,.registro-titulo,.registro-node,.registro-conceito,.notebook-questions-title';
    const candidates=[...root.querySelectorAll('*')].filter(n=>{
      if(n.closest('svg,script,style,[aria-hidden="true"]') || !n.textContent.trim())return false;
      return n.matches(semantic) || (!n.children.length && !n.matches('br,hr,input,button,textarea'));
    });
    return candidates.filter(n=>!candidates.some(other=>other!==n && other.contains(n)));
  }
  function editorCollect() {
    if(!editorState)return;
    for(const item of editorState.targets) {
      const text=item.node.textContent;
      if(text!==item.original)editorState.draft[editorState.mode][item.path]=text;
      else delete editorState.draft[editorState.mode][item.path];
    }
    editorState.draft.title=$('uxEditTitle').value===bases.get(editorState.id).title ? null : $('uxEditTitle').value;
  }
  function editorRender(mode) {
    editorCollect();editorState.mode=mode;
    const base=bases.get(editorState.id)[mode],clone=base.cloneNode(true);
    C.applyTextEdits(clone,editorState.draft[mode]);
    const originals=editingTargets(base);
    editorState.targets=originals.map(n=>{
      const path=C.pathOf(n,base),node=C.atPath(clone,path);
      node.setAttribute('contenteditable','plaintext-only');node.setAttribute('role','textbox');node.setAttribute('aria-multiline','true');node.setAttribute('aria-label','Editar trecho: '+n.textContent.trim().slice(0,70));node.classList.add('ux-editable');
      return {node,path,original:n.textContent};
    });
    $('uxEditorPreview').replaceChildren(clone);
    $('uxEditNotebook').setAttribute('aria-pressed',String(mode==='notebook'));
    $('uxEditActivity').setAttribute('aria-pressed',String(mode==='activity'));
  }
  function openEditor(id) {
    closeTools();$('uxEditorMessage').textContent='';let draft;try{draft=readEdits(id);}catch(e){feedback(e.message);return;}
    editorState={id,draft,mode:'notebook',targets:[],original:fieldFor(id).value};editorDirty=false;
    $('uxEditTitle').value=draft.title===null ? bases.get(id).title : draft.title;
    editorRender('notebook');editor.showModal();$('uxEditTitle').focus();
  }
  function cancelEditor() { if(editorDirty && !confirm('Descartar as alterações que ainda não foram salvas?'))return;editor.close();editorState=null;editorDirty=false; }
  editor.addEventListener('cancel',e=>{e.preventDefault();cancelEditor();});
  $('uxEditorCancel').addEventListener('click',cancelEditor);$('uxEditorClose').addEventListener('click',cancelEditor);
  editor.addEventListener('input',()=>{editorDirty=true;});
  // Paste is plain text even on browsers without plaintext-only support.
  editor.addEventListener('paste',e=>{
    if(!e.target.closest('[contenteditable]'))return;e.preventDefault();
    const text=e.clipboardData.getData('text/plain'),selection=window.getSelection();
    if(!selection.rangeCount)return;const range=selection.getRangeAt(0);range.deleteContents();
    const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);editorDirty=true;
  });
  $('uxEditNotebook').addEventListener('click',()=>editorRender('notebook'));
  $('uxEditActivity').addEventListener('click',()=>editorRender('activity'));
  $('uxEditorSave').addEventListener('click',()=>{
    editorCollect();const id=editorState.id,previous=editorState.original;
    if(!$('uxEditTitle').value.trim()){feedback('Preencha o título da aula.');$('uxEditTitle').focus();return;}
    const draft=editorState.draft;
    const value=draft.title===null && !Object.keys(draft.notebook).length && !Object.keys(draft.activity).length ? '' : JSON.stringify(draft);
    if(!persistEdits(id,value))return;editor.close();editorState=null;editorDirty=false;
    feedback('Aula salva. A projeção e a impressão já usam as alterações.',()=>{if(persistEdits(id,previous))feedback('Edição desfeita.');});
  });
  $('uxRestoreOriginal').addEventListener('click',()=>{
    if(!confirm('Restaurar o título, o caderno e a atividade originais? Suas anotações da professora serão mantidas.'))return;
    const id=editorState.id,previous=fieldFor(id).value;
    if(!persistEdits(id,''))return;editor.close();editorState=null;editorDirty=false;
    feedback('Conteúdo original restaurado.',()=>{if(persistEdits(id,previous))feedback('Restauração desfeita.');});
  });
  window.addEventListener('beforeunload',e=>{if(editor.open && editorDirty){e.preventDefault();e.returnValue='';}});

  // Simple print choices; a lesson action defaults to the current week.
  const printDialog=el('dialog','ux-dialog ux-print-dialog');printDialog.id='uxPrint';printDialog.setAttribute('aria-labelledby','uxPrintHeading');
  printDialog.innerHTML='<header class="ux-dialog-head"><h2 id="uxPrintHeading">Imprimir</h2><button id="uxPrintClose" type="button">Fechar</button></header><label for="uxPrintScope">Quais aulas?<select id="uxPrintScope"><option value="week">Esta semana</option><option value="discipline">Todas as semanas da disciplina</option><option value="all">Todo o bimestre</option></select></label><div class="ux-print-options"><button type="button" data-print-kind="activity">Atividade dos alunos</button><button type="button" data-print-kind="notebook">Caderno dos alunos</button><button type="button" data-print-kind="prepare">Planejamento da professora</button></div>';
  document.body.appendChild(printDialog);let printId=null;
  function openPrint(id,all) {closeTools();printId=id || current;$('uxPrintScope').value=all?'discipline':'week';printDialog.showModal();}
  $('uxPrintAll').addEventListener('click',()=>openPrint(current,true));$('uxPrintClose').addEventListener('click',()=>printDialog.close());
  function printCards(scope) { return scope==='all' ? cards : scope==='discipline' ? [...activeSection().querySelectorAll('article.week-card')] : [$(printId)].filter(Boolean); }
  function executePrint(kind,scope) {
    const selected=printCards(scope);if(!selected.length)return;
    printDialog.close();
    // Existing print styles and JS can measure every selected card, even when only one is on screen.
    printState=cards.map(c=>({c,inactive:c.classList.contains('ux-inactive'),filtered:c.classList.contains('hidden')}));
    for(const c of cards){c.classList.remove('ux-inactive','hidden');c.classList.toggle('ux-print-selected',selected.includes(c));}
    document.body.classList.add('ux-print-'+kind);
    if(kind==='activity') {
      const box=$('atvPrint');box.replaceChildren(...selected.map(c=>c.querySelector('.atv-aluno').cloneNode(true)));
      document.body.classList.add('print-atv');window.print();
    } else if(kind==='notebook') {
      // Print directly from the notebook nodes: no teacher answer or editor enters the output.
      document.body.classList.add('ux-print-notebooks');window.print();
    } else {
      for(const c of selected)c.querySelectorAll('details').forEach(d=>{if(!d.open){d.dataset.uxPrintOpened='1';d.open=true;}});
      window.print();
    }
  }
  printDialog.querySelectorAll('[data-print-kind]').forEach(b=>b.addEventListener('click',()=>executePrint(b.dataset.printKind,$('uxPrintScope').value)));
  window.addEventListener('afterprint',()=>{
    document.body.classList.remove('ux-print-activity','ux-print-notebook','ux-print-prepare','ux-print-notebooks','print-atv');
    for(const {c,inactive,filtered} of printState){c.classList.toggle('ux-inactive',inactive);c.classList.toggle('hidden',filtered);c.classList.remove('ux-print-selected');}
    printState=[];document.querySelectorAll('[data-ux-print-opened]').forEach(d=>{d.open=false;delete d.dataset.uxPrintOpened;});
    $('atvPrint').replaceChildren();
  });

  // Friendly sync wording; the database address stays configured but remains available in advanced settings.
  const syncView=$('syncView'),url=$('syncUrl'),urlLabel=document.querySelector('label[for="syncUrl"]');
  const advanced=el('details','ux-sync-advanced');advanced.appendChild(el('summary',null,'Configuração avançada'));
  urlLabel.before(advanced);advanced.append(urlLabel,url);syncView.querySelector('.sync-card').insertBefore(advanced,syncView.querySelector('.sync-actions'));
  $('syncTitle').textContent='Conectar outro aparelho';
  syncView.querySelector('.sync-p').textContent='Neste aparelho, gere um código e toque em Conectar. No outro aparelho, abra o planejamento e use o mesmo código. Suas anotações, edições e aulas dadas serão sincronizadas.';
  $('syncConnect').textContent='Conectar';$('syncCode').placeholder='Cole o código do outro aparelho ou toque em Gerar';
  function paintStorage() {
    const state=$('uxStorage');
    if(window.__maluStorageVolatile){state.textContent='Salvamento temporário: baixe uma cópia de segurança antes de fechar.';state.classList.add('ux-warning');return;}
    const cfg=window.MaluSync && window.MaluSync.config();
    const status=$('syncStatus').textContent;
    const failure=$('status').dataset.kind==='error';
    state.classList.toggle('ux-warning',failure || !!(cfg && $('syncStatus').classList.contains('err')));
    if(failure){state.textContent=$('status').textContent;return;}
    state.textContent=!cfg ? 'Salvo neste aparelho' : $('syncStatus').classList.contains('err') ? 'Salvo neste aparelho · aguardando sincronização' : $('syncStatus').classList.contains('ok') ? status : 'Salvo neste aparelho · sincronizando…';
    $('syncBtn').textContent=cfg ? 'Aparelhos e sincronização' : 'Conectar outro aparelho';
  }
  new MutationObserver(paintStorage).observe($('syncStatus'),{subtree:true,childList:true,characterData:true,attributes:true});
  new MutationObserver(paintStorage).observe($('status'),{subtree:true,childList:true,characterData:true,attributes:true});
  document.addEventListener('malu:storage-error',paintStorage);

  let saved=null;try{saved=JSON.parse(localStorage.getItem(viewKey)||'null');}catch(e){}
  const hash=location.hash.slice(1),hashCard=$(hash);
  if(saved && C.CLASSES[saved.s] && ['historia','filosofia','sociologia'].includes(saved.d) && !hash) {
    realClass=C.CLASSES[saved.s].includes(saved.t) ? saved.t : C.CLASSES[saved.s][0];
    planner.setSelection(saved.s,saved.d);current=saved.w;
  } else if(hashCard && hashCard.matches('article.week-card'))current=hash;
  document.body.classList.add('ux-ready');restoring=false;planner.updateSearch();refresh(current);
  paintStorage();window.addEventListener('resize',toolbarHeight);
  if(window.ResizeObserver)new ResizeObserver(toolbarHeight).observe($('navShell').parentElement);
})();
