(() => {
  'use strict';
  const C = window.MaluPlannerCore, planner = window.MaluPlanner;
  if (!C || !planner) return;
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('article.week-card')];
  const bases = new Map(), panels = new Map(), remembered = new Map();
  const seriesSelect = $('uxSeries'), subjectSelect = $('uxSubject');
  const fieldFor = id => document.querySelector('textarea[data-save="ux-' + id + '-edits"]');
  const viewKey = 'malu-ui-view', panelKey = 'malu-ui-panels';
  let panelMemory={};try { const p=JSON.parse(localStorage.getItem(panelKey)||'{}'); if(p && typeof p==='object' && !Array.isArray(p))panelMemory=p; }catch(e){}
  let current = null, undoAction = null, restoring = true;
  let editorState = null, editorDirty = false, printState = [];
  function el(tag, cls, text) { const n=document.createElement(tag); if(cls)n.className=cls; if(text != null)n.textContent=text; return n; }

  // Datas de referência alinhadas ao cronograma oficial SEDUC-GO 2026.
  // A SEDUC publica eventos e avaliações; as seis semanas abaixo são a organização do app encaixada nesse cronograma.
  const SEDUC_WEEK_RANGES = Object.freeze({
    // Seis períodos pedagógicos distribuídos pelos dias letivos de 01/10 a 27/11.
    // Assim, 30/11 a 18/12 fica livre para recomposição, recuperação e revisões.
    s9:['01 a 09/10','13 a 20/10','21 a 29/10','30/10 a 09/11','10 a 17/11','18 a 27/11'],
    s1:['01 a 09/10','13 a 20/10','21 a 29/10','30/10 a 09/11','10 a 17/11','18 a 27/11'],
    s2:['01 a 09/10','13 a 20/10','21 a 29/10','30/10 a 09/11','10 a 17/11','18 a 27/11'],
    s3:['01 a 09/10','13 a 20/10','21 a 29/10','30/10 a 09/11','10 a 17/11','18 a 27/11']
  });
  function seducWeekRange(card) {
    const series=card && card.id.split('-')[0], n=card ? Number(card.id.split('-semana-')[1]) : 0;
    return (SEDUC_WEEK_RANGES[series] && SEDUC_WEEK_RANGES[series][n-1]) || '';
  }
  function addOfficialCalendar() {
    for(const card of cards) {
      const range=seducWeekRange(card), head=card.querySelector('.week-head');
      if(range && head && !head.querySelector('.ux-week-date')) {
        const badge=el('span','ux-week-date',range);
        badge.title='Período previsto para esta unidade do planejamento, considerando os dias letivos SEDUC-GO 2026';
        head.querySelector('h3').before(badge);
      }
      const track=document.querySelector('a.track-item[href="#'+card.id+'"]');
      if(range && track && !track.querySelector('.ux-track-date')) {
        const date=el('div','ux-track-date',range);
        const concepts=track.querySelector('.track-concepts');
        if(concepts) concepts.after(date);
      }
    }

    const grid=document.querySelector('#guia .guia-grid');
    if(grid && !grid.querySelector('.ux-seduc-calendar')) {
      const section=el('section','ux-seduc-calendar');
      section.appendChild(el('h3',null,'Calendário oficial SEDUC-GO · 4º bimestre'));
      section.appendChild(el('p',null,'O planejamento de conteúdo começa na primeira semana letiva de outubro e termina em 27/11. As seis semanas do app foram distribuídas pelos dias letivos desse período; o dia exato de cada aula depende do horário da turma.'));
      const reserve=el('div','ux-review-reserve');
      reserve.appendChild(el('h4',null,'30/11 a 18/12 · período reservado pela professora'));
      reserve.appendChild(el('p',null,'Recomposição das aprendizagens, recuperação, revisão dos conteúdos do bimestre e revisão para vestibulares. Esse período também coincide com avaliações finais, 2ª chamada, intensificação/recomposição, Pré-Conselho e Conselho de Classe previstos no cronograma da rede.'));
      section.appendChild(reserve);

      const ef=el('div','ux-seduc-stage');
      ef.appendChild(el('h4',null,'9º ano'));
      const efList=el('ul');
      for(const item of [
        '19/10 · Produção de Texto — CEPI',
        '30/11 · Bloco 5: História',
        '01 a 04/12 · Blocos — SEDUC',
        '07 a 11/12 · 2ª chamada e Intensificação/Recomposição',
        '14 a 17/12 · Pré-Conselho de Classe',
        '18/12 · Conselho de Classe'
      ]) efList.appendChild(el('li',null,item));
      ef.appendChild(efList);section.appendChild(ef);

      const em=el('div','ux-seduc-stage');
      em.appendChild(el('h4',null,'Ensino Médio'));
      const emList=el('ul');
      for(const item of [
        '13/10 · Produção Textual — SEDUC',
        '26/10 · Simulado Enem (1ª, 2ª e 3ª série)',
        '09/11 · Bloco 2: Geografia / História',
        '01 a 04/12 · Blocos — SEDUC',
        '07/12 · Bloco 6: Biologia / Sociologia / Filosofia',
        '07 a 11/12 · 2ª chamada e Intensificação/Recomposição',
        '14 a 17/12 · Pré-Conselho de Classe',
        '18/12 · Conselho de Classe'
      ]) emList.appendChild(el('li',null,item));
      em.appendChild(emList);section.appendChild(em);

      const calendarSource=document.createElement('a');
      calendarSource.href='https://goias.gov.br/educacao/wp-content/uploads/sites/40/2026/02/DIRETRIZES-PEDAGOGICAS-2026.pdf';
      calendarSource.target='_blank';calendarSource.rel='noopener';
      calendarSource.textContent='Abrir Calendário Escolar 2026 — SEDUC-GO';
      section.appendChild(calendarSource);
      section.appendChild(document.createTextNode(' · '));
      const source=document.createElement('a');
      source.href='https://goias.gov.br/educacao/wp-content/uploads/sites/40/2026/03/CADERNO-ORIENTADOR-AVALIACAO-EDUCACIONAL-2026.pdf';
      source.target='_blank';source.rel='noopener';
      source.textContent='Abrir Caderno Orientador de Avaliação 2026';
      section.appendChild(source);
      grid.appendChild(section);
    }

    const old=[...document.querySelectorAll('#guia p')].find(p=>p.textContent.includes('O calendário escolar da SEDUC-GO não foi consultado'));
    if(old) old.textContent='Calendário e cronograma SEDUC-GO 2026 conferidos e incorporados ao planejamento.';
  }
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
    try{localStorage.setItem(viewKey,JSON.stringify({s:v.s,d:v.d,w:current}));}catch(e){}
  }
  function toolbarHeight() { document.documentElement.style.setProperty('--toolbar-h', $('navShell').parentElement.offsetHeight+'px'); }
  function rememberSeries() {
    const v=planner.getSelection();
    seriesSelect.value=v.s;
    subjectSelect.value=v.d;
    for(const opt of subjectSelect.options)opt.disabled=v.s==='s9' && opt.value!=='historia';
  }
  function refresh(preferred, focus) {
    rememberSeries();
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
    $('wkPrev').disabled=i<=0; $('wkNext').disabled=i<0 || i>=ids.length-1; $('wkProject').disabled=!c;if($('wkPrepare'))$('wkPrepare').disabled=!c;
    const range=c ? seducWeekRange(c) : '';
    $('wkLabel').textContent=c ? 'Semana '+weekNumber(c)+' · '+seriesSelect.selectedOptions[0].textContent+(range?' · '+range:'') : 'Nenhuma aula encontrada';
    $('uxEmpty').hidden=!!c;
    $('searchCount').hidden=true;
    if(c){remembered.set(activeSection().id,c.id);const panel=panelMemory[activeSection().id];setPanel(c,['prepare','notebook','activity'].includes(panel)?panel:'prepare',false);}

    refreshMarks();toolbarHeight();saveView();
    if(focus && c) { c.querySelector('.week-head h3').focus({preventScroll:true});c.scrollIntoView({block:'start',behavior:'instant'}); }
  }
  function showWeek(id, focus) { refresh(id,focus); }
  $('wkPrev').addEventListener('click',()=>{const list=matches(),i=list.findIndex(c=>c.id===current);if(i>0)showWeek(list[i-1].id,true);});
  $('wkNext').addEventListener('click',()=>{const list=matches(),i=list.findIndex(c=>c.id===current);if(i>=0 && i<list.length-1)showWeek(list[i+1].id,true);});
  function startLesson() { if(current)window.openProjection(current); }
  $('wkProject').addEventListener('click',startLesson);
  const shortcuts=el('nav','lesson-quick-nav');shortcuts.setAttribute('aria-label','Acesso direto à aula');
  const prepareButton=el('button',null,'Preparar / estudar');prepareButton.id='wkPrepare';prepareButton.type='button';
  prepareButton.addEventListener('click',()=>{
    const card=current && $(current);if(!card)return;
    setPanel(card,'prepare');
    card.querySelectorAll('.prof-caderno,.ux-curriculum').forEach(d=>d.open=true);
    card.scrollIntoView({block:'start',behavior:'instant'});
    card.querySelector('.week-head h3').focus({preventScroll:true});
  });
  shortcuts.append(prepareButton,$('wkProject'));$('navShell').parentElement.after(shortcuts);

  seriesSelect.addEventListener('change',()=>{
    const s=seriesSelect.value,d=subjectSelect.value;
    planner.setSelection(s,d);refresh(remembered.get(activeSection().id),true);
  });
  subjectSelect.addEventListener('change',()=>{
    planner.setSelection(planner.getSelection().s,subjectSelect.value);
    refresh(remembered.get(activeSection().id),true);
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
    if(m){planner.setSelection(m[1],m[2]);showWeek(id,true);}
  });
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') || document.body.classList.contains('is-projecting') || document.body.classList.contains('is-aulas') || document.body.classList.contains('is-sync'))return;
    if(e.target.closest('input,textarea,select,[contenteditable]'))return;
    if(e.key==='p'||e.key==='P'){e.preventDefault();if(current)window.openProjection(current);}
  });


  // Only teaching controls stay prominent; occasional adjustments are grouped.
  const projectionOptions=el('details','lesson-options');
  projectionOptions.appendChild(el('summary',null,'Ajustes'));
  const optionButtons=el('div');
  for(const id of ['projectionSmaller','projectionLarger','projectionPrint','projectionRefs'])optionButtons.appendChild($(id));
  projectionOptions.appendChild(optionButtons);
  $('projectionClose').before(projectionOptions);
  $('projectionMode').hidden=true;
  document.querySelectorAll('[data-lesson-material]').forEach(b=>b.addEventListener('click',()=>{projectionOptions.open=false;}));

  // Codes belong to the student notebook, independently of optional source visibility.
  function notebookCurriculum(card,notebook) {
    const info=window.MaluCurriculum.readCodes(card),texts=window.MaluCurriculum.matrizTextos();
    const footer=el('div','student-curriculum');footer.setAttribute('role','note');footer.setAttribute('aria-label','BNCC e Matriz desta aula');footer.dataset.readonly='true';
    for(const [key,label] of [['bncc','BNCC'],['matriz','Matriz SEDUC-GO']]) {
      const row=el('div','student-code-row');row.dataset.codeKind=key;
      row.appendChild(el('strong','student-code-label',label+':'));
      const values=el('div','student-code-values');
      if(!info[key].length)values.appendChild(el('span','student-code-missing','Não indicada neste planejamento.'));
      for(const code of info[key]) {
        if(key==='matriz' && texts[code]) {
          const detail=el('details','student-skill'),summary=el('summary','student-code-chip',code);
          summary.title='Ler a habilidade '+code;detail.append(summary,el('p','student-skill-text',texts[code]));values.appendChild(detail);
        } else values.appendChild(el('span','student-code-chip',code));
      }
      row.appendChild(values);footer.appendChild(row);
    }
    notebook.appendChild(footer);
  }

  // Preserve original nodes and stable note IDs. Screen panels only change presentation.
  function setPanel(card,key,remember=true) {
    const set=panels.get(card.id); if(!set)return;
    for(const [k,p] of Object.entries(set)) {
      const active=k===key;p.classList.toggle('ux-panel-inactive',!active);
      const b=$(card.id+'-tab-'+k);b.setAttribute('aria-selected',String(active));b.tabIndex=active ? 0 : -1;
    }
    card.dataset.uxPanel=key;
    if(remember){panelMemory[card.closest('section.discipline').id]=key;try{localStorage.setItem(panelKey,JSON.stringify(panelMemory));}catch(e){}}
  }
  function setupCard(card) {
    const notebook=card.querySelector('.wide.notebook'),activity=card.querySelector('.atv-aluno');
    if(!notebook || !activity)throw new Error('Aula sem caderno ou atividade: '+card.id);
    notebookCurriculum(card,notebook);
    const head=card.querySelector('.week-head h3');head.tabIndex=-1;
    bases.set(card.id,{title:head.textContent,notebook:notebook.cloneNode(true),activity:activity.cloneNode(true)});
    const actions=el('div','ux-actions');actions.setAttribute('aria-label','Ações desta aula');
    const edit=el('button',null,'Editar aula');edit.type='button';edit.addEventListener('click',()=>openEditor(card.id));
    const print=el('button',null,'Imprimir');print.type='button';print.addEventListener('click',()=>openPrint(card.id));
    const checks=el('div','ux-class-checks');checks.setAttribute('role','group');checks.setAttribute('aria-label','Aplicado às turmas');
    for(const turma of C.CLASSES[card.id.split('-')[0]]) {
      const label=el('label','ux-class-check');
      const check=el('input');check.type='checkbox';check.dataset.uxMark=card.id;check.dataset.uxClass=turma;
      check.addEventListener('change',()=>markGiven(card.id,turma,check.checked));
      label.append(check,document.createTextNode(turma));checks.appendChild(label);
    }
    actions.append(edit,print,checks);card.querySelector('.week-head').after(actions);
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
    if(teacher){teacher.textContent='Fundamentação e roteiro da professora';teacher.parentElement.open=true;}
    const curriculum=set.prepare.querySelector('.ux-curriculum');if(curriculum)curriculum.open=true;
    card.append(set.prepare,set.notebook,set.activity);panels.set(card.id,set);setPanel(card,'prepare',false);
  }
  document.body.classList.remove('mode-aula');
  addOfficialCalendar();
  for(const card of cards)setupCard(card);
  // Keep each discipline's six-week learning track visible. It is primary navigation/context, not optional detail.
  document.querySelectorAll('.study-track').forEach(track=>{
    track.removeAttribute('hidden');
    const section=track.closest('section.discipline'),last=section.querySelector('article.week-card:last-of-type');
    if(last)last.after(track);
  });
  const trackButton=el('button',null,'Ver trilha');trackButton.id='wkTrack';trackButton.type='button';
  trackButton.addEventListener('click',()=>{const track=activeSection()?.querySelector('.study-track');if(track){track.tabIndex=-1;track.scrollIntoView({block:'start',behavior:'instant'});track.focus({preventScroll:true});}});
  $('wkLabel').after(trackButton);
  const toolsPanel=$('navTools').querySelector('.tools-panel');
  toolsPanel.prepend($('uxResume'),$('uxStorage'),$('guia'));


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

  // Each class retains its existing week|class record independently of navigation.
  function refreshMarks() {
    const data=window.__maluAulas.get();
    const section=activeSection(),weeks=section ? [...section.querySelectorAll('article.week-card')] : [];
    const classes=C.CLASSES[planner.getSelection().s];
    $('uxResume').textContent=classes.map(turma=>turma+': '+weeks.filter(c=>!!data[c.id+'|'+turma]).length+' de '+weeks.length+' semanas dadas').join(' · ');
    for(const check of document.querySelectorAll('input[data-ux-mark]')) {
      const date=data[check.dataset.uxMark+'|'+check.dataset.uxClass];
      check.checked=!!date;
      check.title=date ? 'Aplicado em '+C.dateBR(date) : '';
    }
  }
  function setMark(key,date) {
    const data={...window.__maluAulas.get()};if(date)data[key]=date;else delete data[key];
    if(!window.__maluAulas.set(data)){feedback('Não foi possível salvar a marcação neste aparelho.');return false;}
    document.dispatchEvent(new CustomEvent('malu:aula',{detail:{key,date:date || null}}));refreshMarks();return true;
  }
  function markGiven(id,turma,checked) {
    const key=id+'|'+turma,previous=window.__maluAulas.get()[key] || null;
    const date=checked ? C.dateLocal(new Date()) : null;
    if(!setMark(key,date)){refreshMarks();return;}
    feedback(date ? 'Semana marcada como dada para '+turma+'.' : 'Marcação retirada para '+turma+'.',()=>{setMark(key,previous);feedback('Marcação desfeita.');});
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
      if(n.closest('svg,script,style,[aria-hidden="true"],[data-readonly]') || !n.textContent.trim())return false;
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
  window.addEventListener('beforeprint',()=>{
    if (!document.body.classList.contains('ux-print-notebooks')) return;
    document.querySelectorAll('.ux-print-selected .wide.notebook').forEach(nb=>{
      nb.style.removeProperty('--fit'); nb.style.removeProperty('--fit-w');
      const old=nb.style.width; nb.style.width='690px';
      const height=nb.scrollHeight; nb.style.width=old;
      const footer=nb.querySelector('.student-curriculum'), footHeight=footer ? footer.offsetHeight : 0;
      const scale=height>990 ? Math.max(.6,(990-footHeight)/Math.max(1,height-footHeight)) : 1;
      nb.style.setProperty('--fit',String(scale)); nb.style.setProperty('--fit-w',Math.round(690/scale)+'px');
    });
  });
  window.addEventListener('afterprint',()=>{
    document.querySelectorAll('.wide.notebook').forEach(nb=>{nb.style.removeProperty('--fit');nb.style.removeProperty('--fit-w');});
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
    planner.setSelection(saved.s,saved.d);current=saved.w;
  } else if(hashCard && hashCard.matches('article.week-card'))current=hash;
  document.body.classList.add('ux-ready');restoring=false;planner.updateSearch();refresh(current);
  paintStorage();window.addEventListener('resize',toolbarHeight);
  if(window.ResizeObserver)new ResizeObserver(toolbarHeight).observe($('navShell').parentElement);
})();
