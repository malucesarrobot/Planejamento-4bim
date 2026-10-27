(async () => {
  'use strict';
  await import('./gradebook-bulletin-core.js?v=20261021boletim');
  const B=window.MaluBulletinCore;
  const C=window.MaluGradebookCore, key='malu-gradebook-2026-b4-v1';
  const empty=()=>({version:1,year:2026,bimestre:4,turmas:{},alunos:{},mediaModo:{},activities:[],scores:{},attendance:{},importLog:{},reportCards:{},monitoring:{}});
  let data=empty(),broken=false,selected='',view='notes',reportStudentId='';
  try{const saved=await window.MaluGradebookStorage.read(key);if(saved){data=JSON.parse(saved);if(data.version!==1||data.bimestre!==4||!Array.isArray(data.activities)||!data.turmas||!data.alunos||!data.scores||!data.attendance||!data.mediaModo)throw Error();}}
  catch(e){broken=true;data=empty();}
  try{selected=await window.MaluGradebookStorage.read(key+'-class')||'';}catch(e){}
  let classContext={};try{classContext=JSON.parse(await window.MaluGradebookStorage.read(key+'-context')||'{}');}catch(e){}
  function rememberClass(t){if(!t)return;const series=String(Number.parseInt(t.serie||t.nome));classContext[series]=t.letra||(t.nome||'').match(/[A-Z]$/)?.[0];window.MaluGradebookStorage.write(key+'-context',JSON.stringify(classContext)).catch(()=>{});}
  document.addEventListener('change',event=>{const n=event.target;if(n.matches?.('input[data-ux-class]')){const label=n.dataset.uxClass,series=String(Number.parseInt(label));classContext[series]=label.match(/[A-Z]$/)?.[0];window.MaluGradebookStorage.write(key+'-context',JSON.stringify(classContext)).catch(()=>{});}});
  function plannerClass(){const p=window.MaluPlanner?.getSelection?.();if(!p)return;const series=String(Number.parseInt(p.s.replace('s',''))),subjects={historia:'História',filosofia:'Filosofia',sociologia:'Sociologia'},subject=subjects[p.d];const candidates=Object.values(data.turmas).filter(t=>String(Number.parseInt(t.serie||t.nome))===series&&t.disciplina===subject);const letter=classContext[series];const match=candidates.find(t=>(t.letra||(t.nome||'').match(/[A-Z]$/)?.[0])===letter);if(match)selected=match.id;else if(candidates.length===1)selected=candidates[0].id;else if(!candidates.some(t=>t.id===selected))selected='';}
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,fn)=>{const n=node('button',text);n.type='button';n.addEventListener('click',fn);return n;};
  const dialog=node('dialog',null,'gb-dialog');dialog.id='gradebook';dialog.setAttribute('aria-labelledby','gbTitle');
  const header=node('header',null,'gb-header'),title=node('h2','Notas e atividades');title.id='gbTitle';
  header.append(title,button('Fechar',closeGradebook));
  const info=node('p','4º bimestre · 2026 · Salvo neste aparelho','gb-info');
  const status=node('p',null,'gb-status');status.setAttribute('role','status');
  const controls=node('div',null,'gb-controls'),select=node('select');select.setAttribute('aria-label','Turma, escola e disciplina');
  select.addEventListener('change',()=>{selected=select.value;view='notes';rememberClass(data.turmas[selected]);window.MaluGradebookStorage.write(key+'-class',selected).catch(()=>{});render();if(draftOrigin&&selected)activityForm();});
  const content=node('div',null,'gb-content');
  const file=node('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  const cloudInfo=node('p','Conectando à nuvem…','gb-info');cloudInfo.setAttribute('role','status');cloudInfo.tabIndex=0;cloudInfo.title='Toque para conectar ou trocar a conta Google';cloudInfo.addEventListener('click',()=>window.MaluGradebookCloud?.login());cloudInfo.addEventListener('keydown',e=>{if(e.key==='Enter')window.MaluGradebookCloud?.login();});
  const login=button('Entrar com Google',()=>window.MaluGradebookCloud?.login());
  const bulletinFile=node('input');bulletinFile.type='file';bulletinFile.accept='.json,application/json';bulletinFile.hidden=true;
  const pupilsMenu=button('Alunos',()=>{view='students';message('');render();});
  const refreshList=button('↻',async()=>{
    refreshList.disabled=true;
    try{if(!await flushEditors())return;await writes;await window.MaluGradebookCloud.refresh();refreshClasses();render();message('Lista atualizada da nuvem.');}
    catch(e){message(e.message,true);}finally{refreshList.disabled=false;}
  });refreshList.setAttribute('aria-label','Atualizar notas e atividades da nuvem');refreshList.title='Atualizar notas e atividades da nuvem';
  controls.append(select,pupilsMenu,refreshList);
  const settings=node('details',null,'gb-settings'),summary=node('summary','Configurações'),settingsActions=node('div',null,'gb-settings-actions');
  settingsActions.append(button('Importar boletim do SIAP',()=>bulletinFile.click()),button('Alunos em acompanhamento',()=>{view='monitoring';render();}),button('Conferir vínculos para o SIAP',auditRegistrations),login,button('Trazer alunos do Leciona pela nuvem',importCloud),button('Importar backup do Leciona',()=>file.click()),button('Baixar backup de notas e chamada',exportBackup));settings.append(summary,settingsActions);

  info.textContent='4º bimestre · 2026';settingsActions.prepend(info);dialog.append(header,controls,cloudInfo,status,content,settings,file,bulletinFile);document.body.append(dialog);
  const actions=document.querySelector('#navTools .tools-actions');
  const notesMenu=button('Notas e atividades',()=>open('notes')),attendanceMenu=button('Chamada',()=>open('attendance'));notesMenu.className='gb-menu-notes';attendanceMenu.className='gb-menu-attendance';actions.prepend(notesMenu,attendanceMenu);
  function message(text,error=false){status.textContent=text;status.classList.toggle('gb-error',error);}
  async function save(next){
    if(broken){message('Os dados salvos não puderam ser lidos. Baixe o backup para conferência antes de substituir dados.',true);return false;}
    try{await window.MaluGradebookStorage.write(key,JSON.stringify(next));const previous=data;data=next;await window.MaluGradebookCloud?.save(next,previous);message('Lançamento registrado.');return true;}
    catch(e){message('Não foi possível salvar neste aparelho. O lançamento não foi aplicado; baixe uma cópia de segurança.',true);return false;}
  }
  let writes=Promise.resolve();
  function update(fn){const task=writes.then(()=>{const next=JSON.parse(JSON.stringify(data));fn(next);return save(next);});writes=task.catch(()=>{});return task;}

  const autoEditors=new Set();
  function autosave(root,commit){
    let dirty=false,timer,running=Promise.resolve(true);
    const flush=(force=false)=>{clearTimeout(timer);if(!dirty&&!force)return running;dirty=false;running=Promise.resolve(commit()).then(ok=>{if(!ok)dirty=true;return ok;}).catch(e=>{dirty=true;message(e.message,true);return false;});return running;};
    const changed=()=>{dirty=true;clearTimeout(timer);message('Salvando automaticamente…');timer=setTimeout(flush,600);};
    root.addEventListener('input',changed);root.addEventListener('change',changed);autoEditors.add(flush);return flush;
  }
  function flushEditors(){return Promise.all([...autoEditors].map(flush=>flush())).then(results=>results.every(Boolean));}
  async function closeGradebook(){
    if(dialog.contains(document.activeElement))document.activeElement.blur();
    if(await flushEditors()){await writes;dialog.close();draftOrigin=null;autoEditors.clear();}
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeGradebook();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushEditors();});

  // Remoção solicitada após conferência do backup de 07/10/2026.
  // IDs exatos evitam atingir outras atividades com nomes semelhantes.
  const removedActivityIds=new Set(['2e89fe8f-9ee1-4dd1-a787-36b46c735f48','8201db89-f892-4de2-96b9-061d851ee448']);
  function removeRequestedActivities(record){
    const count=record.activities.length;
    record.activities=record.activities.filter(a=>!removedActivityIds.has(a.id));
    let changed=record.activities.length!==count;
    for(const scores of Object.values(record.scores))for(const id of removedActivityIds)if(Object.hasOwn(scores,id)){delete scores[id];changed=true;}
    return changed;
  }
  function classLabel(t){return [t.nome||((t.serie||'')+(t.letra||'')),t.unidade,t.disciplina].filter(Boolean).join(' · ');}
  function refreshClasses(){
    select.replaceChildren();select.append(new Option('Selecione a turma',''));
    Object.values(data.turmas).sort((a,b)=>classLabel(a).localeCompare(classLabel(b),'pt-BR')).forEach(t=>select.append(new Option(classLabel(t),t.id)));
    if(!data.turmas[selected])selected='';select.value=selected;
  }
  function open(which){plannerClass();message('');view=which;document.getElementById('navTools').open=false;title.textContent=which==='notes'?'Notas e atividades':'Chamada';refreshClasses();render();dialog.showModal();if(broken)message('Não foi possível ler os dados locais. Nada foi sobrescrito.',true);}
  function students(){return Object.values(data.alunos).filter(a=>a.turmaId===selected&&a.ativo!==false).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR',{sensitivity:'base',numeric:true})||a.id.localeCompare(b.id));}
  function activities(){return data.activities.filter(a=>a.turmaId===selected).sort((a,b)=>a.data.localeCompare(b.data)||a.nome.localeCompare(b.nome,'pt-BR'));}
  const fmt=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
  function render(){flushEditors();autoEditors.clear();content.replaceChildren();pupilsMenu.disabled=!selected;if(view==='attendance'){renderAttendance();return;}if(view==='monitoring'){renderMonitoring();return;}if(view==='report'&&data.alunos[reportStudentId]){showReport(data.alunos[reportStudentId]);return;}if(!selected){content.append(node('p',Object.keys(data.turmas).length?'Selecione uma turma para continuar.':'Importe o backup completo do Leciona para trazer turmas, alunos, horários e modo de cálculo. As notas e frequências anteriores não serão importadas.'));return;}if(view==='notes')renderNotes();else if(view==='ranking')renderRanking();else if(view==='students')renderStudents();else renderAttendance();}
  function renderStudents(){
    dialog.classList.remove('gb-ranking-projection');
    const turmaId=selected,all=Object.values(data.alunos).filter(a=>a.turmaId===turmaId).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR',{sensitivity:'base'}));
    content.append(button('← Notas',()=>{view='notes';render();}),node('h3','Alunos · '+classLabel(data.turmas[turmaId])),button('Adicionar aluno',()=>studentForm()),node('p','Remover retira o aluno das notas, da chamada e do ranking. As notas e presenças anteriores ficam guardadas; você pode restaurar o cadastro.','gb-help'));
    const active=node('div',null,'gb-roster'),removed=node('details',null,'gb-roster-removed'),inactive=all.filter(a=>a.ativo===false);removed.append(node('summary','Removidos · '+inactive.length));
    content.append(node('p',all.length-inactive.length+' alunos ativos'),active,removed);
    for(const a of all){
      const row=node('div',null,'gb-roster-row'),identity=node('div');identity.append(node('strong',(a.numero?a.numero+'. ':'')+a.nome),node('p',a.matricula?'Matrícula: '+a.matricula:'Sem matrícula','gb-help'));
      const actions=node('div',null,'gb-roster-actions'),edit=button('Editar',()=>studentForm(a));edit.setAttribute('aria-label','Editar '+a.nome);
      const toggle=button(a.ativo===false?'Restaurar':'Remover',async()=>{
        const restoring=a.ativo===false;
        if(!restoring&&!confirm('Remover '+a.nome+' da lista ativa desta turma? Notas e chamadas ficam guardadas e o aluno poderá ser restaurado.'))return;
        toggle.disabled=true;
        try{if(await update(d=>C.setStudentActive(d,turmaId,a.id,restoring))){render();message(restoring?'Aluno restaurado.':'Aluno removido da lista ativa.');}}
        catch(e){message(e.message,true);}finally{toggle.disabled=false;}
      });toggle.setAttribute('aria-label',(a.ativo===false?'Restaurar ':'Remover ')+a.nome);actions.append(edit,toggle);row.append(identity,actions);(a.ativo===false?removed:active).append(row);
    }
    if(!all.some(a=>a.ativo!==false))active.append(node('p','Nenhum aluno ativo. Use Adicionar aluno ou restaure um cadastro.'));
  }
  function studentForm(existing){
    const turmaId=selected,form=node('form',null,'gb-form');form.append(node('h3',existing?'Editar aluno':'Adicionar aluno'),node('p',classLabel(data.turmas[turmaId]),'gb-help'));
    function field(label,value){const box=node('label',label),input=node('input');input.type='text';input.value=value??'';box.append(input);form.append(box);return input;}
    const name=field('Nome completo',existing?.nome);name.required=true;name.maxLength=200;
    const number=field('Número de chamada (opcional)',existing?.numero),registration=field('Matrícula (opcional)',existing?.matricula);number.inputMode=registration.inputMode='numeric';number.pattern=registration.pattern='[0-9]*';
    form.append(node('p','A matrícula permite vincular o boletim às outras disciplinas. O cadastro será incluído somente na turma selecionada.','gb-help'));
    const submit=node('button','Salvar aluno');submit.type='submit';form.append(submit,button('Cancelar',render));
    form.addEventListener('submit',async e=>{e.preventDefault();if(selected!==turmaId){message('A turma mudou. Abra o cadastro novamente.',true);return;}submit.disabled=true;
      try{if(await update(d=>C.saveStudent(d,turmaId,{id:existing?.id,nome:name.value,numero:number.value,matricula:registration.value}))){render();message(existing?'Cadastro atualizado.':'Aluno adicionado.');}}
      catch(e){message(e.message,true);}finally{submit.disabled=false;}
    });content.replaceChildren(form);name.focus();
  }
  function renderNotes(){
    const mode=node('select');mode.setAttribute('aria-label','Modo de cálculo da média');mode.append(new Option('Média ponderada','ponderada'),new Option('Média aritmética','aritmetica'));mode.value=data.mediaModo[selected]||'ponderada';
    mode.addEventListener('change',async()=>{if(await update(d=>d.mediaModo[selected]=mode.value))render();else mode.value=data.mediaModo[selected]||'ponderada';});
    const calculation=node('details',null,'gb-calculation');calculation.append(node('summary','Cálculo da média'),mode,node('p','Atividade sem nota vale zero. Extras somam bônus, até 10.','gb-help'));content.append(button('Ranking',()=>{view='ranking';render();}),button('Nova atividade',()=>activityForm()),button('Pontos extras',numericExtras),button('Bônus por execução',()=>activityForm(null,'bonus')),calculation);
    const avs=activities(),als=students();
    if(!avs.length)content.append(node('p','Nenhuma atividade cadastrada neste bimestre.'));
    if(!als.length)content.append(node('p','Esta turma ainda não possui alunos ativos importados.'));
    const list=node('div',null,'gb-activities');
    for(const a of avs){const row=node('div');row.append(node('span',a.nome+' · '+a.tipo+' · máximo '+fmt(a.valorMax)+(a.extra?' · bônus':'')+' · peso '+fmt(a.peso)),button('Editar',()=>activityForm(a)),button('Excluir',async()=>{if(!confirm('Excluir esta atividade e suas pontuações?'))return;await update(d=>{d.activities=d.activities.filter(x=>x.id!==a.id);for(const scores of Object.values(d.scores))delete scores[a.id];});render();}));list.append(row);}content.append(list);
    if(!als.length)return;
    const wrap=node('div',null,'gb-table-wrap'),table=node('table'),head=node('tr');
    head.className='gb-column-head';for(const text of ['Aluno',...avs.map(a=>a.nome),'Atividades','Bônus','Média / 10']){const cell=node('th',text);cell.scope='col';head.append(cell);}table.append(head);
    for(const student of als){
      const row=node('tr'),name=node('th');row.dataset.gbStudentRow=student.id;name.scope='row';const studentLink=button((student.numero?student.numero+'. ':'')+student.nome,()=>showReport(student));studentLink.className='gb-student-link';name.append(studentLink);if(data.monitoring?.[student.id]?.active){const marker=node('span',data.monitoring[student.id].kind==='conferir-lancamento'?'Conferir lançamento':'Acompanhamento','gb-monitoring-badge');name.append(marker);}row.append(name);
      const totalCells=[node('td'),node('td'),node('td')];
      const paint=()=>{const r=C.result(avs,data.scores[student.id]||{},data.mediaModo[selected]);totalCells[0].textContent=fmt(r.sum)+' / '+fmt(r.max);totalCells[1].textContent=fmt(r.bonus);totalCells[2].textContent=fmt(r.average);};
      for(const a of avs){const cell=node('td'),input=node('input'),saved=data.scores[student.id]?.[a.id];input.setAttribute('aria-label',a.nome+' — '+student.nome);input.dataset.gbStudent=student.id;input.dataset.gbActivity=a.id;
        input.type=a.checklist?'checkbox':'number';if(a.checklist)input.checked=Number(saved)>0;else{input.min='0';input.max=String(a.valorMax);input.step='0.1';input.value=saved==null?'':String(saved);input.inputMode='decimal';}
        input.addEventListener(a.checklist?'change':'input',async()=>{const raw=a.checklist?(input.checked?1:0):(input.value===''?null:Number(input.value));
          if(raw!==null&&(!Number.isFinite(raw)||raw<0||(!a.checklist&&raw>a.valorMax))){input.setCustomValidity('Digite uma pontuação entre 0 e '+a.valorMax+'.');input.reportValidity();return;}input.setCustomValidity('');
          const ok=await update(d=>{d.scores[student.id]??={};if(raw===null)delete d.scores[student.id][a.id];else d.scores[student.id][a.id]=raw;});if(ok)paint();else{const old=data.scores[student.id]?.[a.id];if(a.checklist)input.checked=Number(old)>0;else input.value=old==null?'':String(old);}});cell.append(input);row.append(cell);
      }row.append(...totalCells);paint();table.append(row);
    }wrap.append(table);content.append(wrap);
  }
  function numericExtras(){
    const turmaId=selected,id='pontos-extras-b4-'+turmaId,als=students();
    const activity={id,turmaId,bimestre:4,nome:'Pontos extras do bimestre',tipo:'Outra',data:bimestreToday(),valorMax:10,peso:1,checklist:false,extra:true,origem:null};
    const form=node('div',null,'gb-numeric-extras');
    form.append(button('← Voltar às notas',render),node('h3','Pontos extras · '+classLabel(data.turmas[turmaId])),node('p','Digite os pontos de cada aluno. Eles são somados diretamente à média final do 4º bimestre, até o limite de 10. Exemplo: média 6 + 1 ponto = 7. Salvo automaticamente.','gb-help'));
    const wrap=node('div',null,'gb-table-wrap'),table=node('table'),head=node('tr',null,'gb-column-head');
    for(const text of ['Aluno','Pontos extras','Média do bimestre / 10']){const th=node('th',text);th.scope='col';head.append(th);}table.append(head);
    for(const pupil of als){
      const row=node('tr'),name=node('th',pupil.nome),cell=node('td'),input=node('input'),mean=node('td');name.scope='row';
      input.type='number';input.min='0';input.max='10';input.step='0.1';input.inputMode='decimal';input.value=data.scores[pupil.id]?.[id]??'';input.setAttribute('aria-label','Pontos extras — '+pupil.nome);
      const paint=()=>{mean.textContent=fmt(C.result(data.activities.filter(a=>a.turmaId===turmaId),data.scores[pupil.id]||{},data.mediaModo[turmaId]).average);};
      input.addEventListener('input',async()=>{
        if(!input.checkValidity()){message('Digite pontos extras de 0 a 10.',true);return;}
        const value=input.value===''?null:Number(input.value);
        const ok=await update(d=>{if(!d.activities.some(a=>a.id===id)&&value!==null)d.activities.push(activity);d.scores[pupil.id]??={};if(value===null)delete d.scores[pupil.id][id];else d.scores[pupil.id][id]=value;});
        if(ok)paint();else input.value=data.scores[pupil.id]?.[id]??'';
      });cell.append(input);row.append(name,cell,mean);paint();table.append(row);
    }
    wrap.append(table);form.append(wrap);if(!als.length)form.append(node('p','Esta turma ainda não possui alunos ativos.'));
    flushEditors();autoEditors.clear();content.replaceChildren(form);
  }
  let rankingMode='geral';
  function renderRanking(){
    const toolbar=node('div',null,'gb-ranking-tools');
    toolbar.append(button('← Notas',()=>{view='notes';dialog.classList.remove('gb-ranking-projection');render();}),button('Projetar',()=>dialog.classList.toggle('gb-ranking-projection')));
    content.append(toolbar,node('h3','Ranking · '+classLabel(data.turmas[selected])),node('p','4º bimestre · Médias iguais dividem a posição (1º, 2º, 2º, 4º).','gb-help'));
    const ranks=C.ranking(data,selected);
    function section(title,rows,kind){
      const box=node('section',null,'gb-ranking-section');box.append(node('h3',title));
      if(!rows.length)box.append(node('p','Ainda não há médias para classificar.','gb-help'));
      for(const r of rows){
        const row=node('div',null,'gb-ranking-row'+(r.pos<=3?' gb-ranking-top':'')+(r.turma.id===selected?' gb-ranking-current':''));
        const name=kind==='class'?classLabel(r.turma):r.aluno.nome+(kind==='all'?' · '+classLabel(r.turma):'');
        row.append(node('span',r.pos===1?'🥇':r.pos===2?'🥈':r.pos===3?'🥉':r.pos+'º','gb-ranking-pos'),node('span',name),node('strong',r.average.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}),'gb-ranking-score'));box.append(row);
      }content.append(box);
    }
    section('Alunos da turma',ranks.students,'student');
    const modes=node('div',null,'gb-ranking-tools');
    for(const [value,label]of [['geral','Geral'],['disciplina','Por disciplina']]){const b=button(label,()=>{rankingMode=value;render();});b.setAttribute('aria-pressed',String(rankingMode===value));modes.append(b);}content.append(node('h3','Comparar turmas'),modes);
    if(rankingMode==='geral')section('Todas as turmas',ranks.classes,'class');else for(const group of ranks.disciplines)section(group.name,group.rows,'class');
    const general=node('details');general.append(node('summary','Top 30 · geral e por escola'));content.append(general);
    const start=content.children.length;section('Geral · top 30',ranks.top,'all');for(const school of ranks.schools)section(school.name+' · top 30',school.rows,'all');
    while(content.children.length>start)general.append(content.children[start]);
    general.prepend(node('p','Cada aluno aparece por turma e disciplina, como no Leciona.','gb-help'));
  }
  dialog.addEventListener('close',()=>dialog.classList.remove('gb-ranking-projection'));
  let draftOrigin=null;
  function currentOrigin(){const card=document.querySelector('article.week-card:not(.ux-inactive):not(.hidden)');return card?{weekId:card.id,title:card.querySelector('.week-head h3')?.textContent?.trim()||'Unidade',panel:card.querySelector('.ux-tabs [aria-selected=true]')?.getAttribute('aria-controls')?.split('-panel-')[1]||'notebook'}:null;}
  function registerFrom(card,panel){draftOrigin={weekId:card.id,title:card.querySelector('.week-head h3')?.textContent?.trim()||'Unidade',panel};open('notes');if(selected)activityForm();else message('Escolha a turma para confirmar o registro desta unidade.');}
  for(const card of document.querySelectorAll('article.week-card'))for(const panel of ['notebook','activity']){const host=document.getElementById(card.id+'-panel-'+panel);if(host){const register=button('Registrar atividade',()=>registerFrom(card,panel));register.className='gb-register-unit';host.append(register);}}
  function openActivitySource(activity){if(activity.origem?.url){window.open(activity.origem.url,'_blank','noopener');return;}if(activity.origem?.weekId&&window.MaluPlannerUnits?.open(activity.origem.weekId,activity.origem.panel)){dialog.close();if(activity.origem.kind==='book')document.getElementById(activity.origem.weekId)?.querySelector('.book-activity')?.scrollIntoView({block:'center'});return;}message('Esta atividade ainda não tem conteúdo vinculado. Confirme a origem no cadastro.');activityForm(activity);}
  function auditRegistrations(){
    content.replaceChildren();content.append(button('← Voltar',render),node('h3','Conferência para o SIAP'));
    const pupils=Object.values(data.alunos).filter(a=>a.ativo!==false),groups=new Map(),issues=[];let missing=0;
    const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
    for(const a of pupils){const registration=String(a.matricula||'').trim(),t=data.turmas[a.turmaId];if(!registration){missing++;issues.push(a.nome+' · '+classLabel(t||{})+' · sem matrícula');}else{if(!groups.has(registration))groups.set(registration,[]);groups.get(registration).push(a);}if(!t||!t.disciplina)issues.push(a.nome+' · vínculo de turma/disciplina incompleto');}
    let duplicates=0,conflicts=0;for(const records of groups.values()){const classes=new Set();for(const a of records){if(classes.has(a.turmaId)){duplicates++;issues.push(a.nome+' · matrícula duplicada na mesma turma');}classes.add(a.turmaId);}if(new Set(records.map(a=>normalize(a.nome))).size>1){conflicts++;issues.push('Conferir grafia: '+[...new Set(records.map(a=>a.nome))].join(' / '));}}
    content.append(node('p',pupils.length+' cadastros · '+groups.size+' matrículas distintas · '+missing+' sem matrícula · '+duplicates+' duplicidades na mesma turma · '+conflicts+' divergências de nome.'));
    content.append(node('p','Matrícula identifica a pessoa; turma, disciplina, data e bimestre identificam cada lançamento. Pendências precisam de conferência antes de qualquer envio ao SIAP.','gb-help'));
    for(const issue of issues)content.append(node('p',issue,'gb-help'));
  }
  function showReport(student){
    reportStudentId=student.id;view='report';
    flushEditors();autoEditors.clear();content.replaceChildren();const top=node('div',null,'gb-report-header');top.append(button('← Voltar às notas',()=>{view='notes';render();}),node('h3',student.nome));content.append(top);
    const records=C.reportStudents(student,data.alunos);top.append(node('p','Boletim · disciplinas do aluno','gb-help'));if(!student.matricula)content.append(node('p','Matrícula ainda não vinculada: exibindo somente esta disciplina.','gb-help'));
    for(const pupil of records.sort((a,b)=>(a.turmaId===selected?-1:b.turmaId===selected?1:0)||classLabel(data.turmas[a.turmaId]||{}).localeCompare(classLabel(data.turmas[b.turmaId]||{}),'pt-BR'))){
      const t=data.turmas[pupil.turmaId];if(!t)continue;const avs=data.activities.filter(a=>a.turmaId===pupil.turmaId).sort((a,b)=>a.data.localeCompare(b.data)),scores=data.scores[pupil.id]||{},totals=C.result(avs,scores,data.mediaModo[pupil.turmaId]);
      const section=node('section',null,'gb-report-subject'),subjectHead=node('div',null,'gb-report-subject-head');
      const subjectLink=button(t.disciplina||'Disciplina',()=>goToStudentRecord(pupil));subjectLink.className='gb-report-subject-link';subjectLink.title='Abrir os registros de '+pupil.nome+' nesta disciplina';
      subjectHead.append(subjectLink,node('span',(t.nome||'')+' · '+(t.unidade||''),'gb-help'),node('strong','4º bim.: '+fmt(totals.average),'gb-report-average'));section.append(subjectHead);
      appendBulletin(section,pupil);
      if(!avs.length)section.append(node('p','Nenhuma atividade cadastrada no 4º bimestre.','gb-help'));
      else for(const done of [false,true]){
        const items=avs.filter(a=>C.completed(a,scores[a.id])===done),group=node(done?'details':'div',null,done?'gb-report-done':'gb-report-pending');
        group.append(node(done?'summary':'h5',(done?'✓ Feitas':'○ Pendentes')+' · '+items.length));
        for(const activity of items){const item=node('div',null,'gb-report-activity-row'),link=button(activity.nome,()=>goToStudentRecord(pupil,activity));link.className='gb-report-activity';link.title='Ir ao registro desta atividade para '+pupil.nome;
          item.append(link,node('span',done?(activity.checklist?'Feita':fmt(scores[activity.id])+' / '+fmt(activity.valorMax)):'Sem registro','gb-report-score'));
          if(activity.origem?.url||activity.origem?.weekId){const source=button('Ver conteúdo',()=>openActivitySource(activity));source.className='gb-report-source';item.append(source);}group.append(item);
        }section.append(group);
      }
      content.append(section);
    }
  }
  function goToStudentRecord(pupil,activity){
    selected=pupil.turmaId;view='notes';rememberClass(data.turmas[selected]);
    window.MaluGradebookStorage.write(key+'-class',selected).catch(()=>{});title.textContent='Notas e atividades';refreshClasses();render();
    const inputs=[...content.querySelectorAll('input[data-gb-student]')];
    const input=inputs.find(n=>n.dataset.gbStudent===pupil.id&&(!activity||n.dataset.gbActivity===activity.id));
    const row=[...content.querySelectorAll('tr[data-gb-student-row]')].find(r=>r.dataset.gbStudentRow===pupil.id);
    const target=activity?input?.closest('td'):row;
    if(target){target.classList.add('gb-note-target');target.scrollIntoView({block:'center',inline:'center'});}
    if(input){input.focus({preventScroll:true});if(input.type==='number')input.select();}
    message(activity?pupil.nome+' · '+activity.nome:'Registros de '+pupil.nome+' · '+(data.turmas[selected]?.disciplina||''));
  }
  function renderMonitoring(){
    content.append(button('← Notas',()=>{view='notes';render();}),node('h3','Alunos em acompanhamento'));
    const list=Object.values(data.alunos).filter(a=>a.ativo!==false&&data.monitoring?.[a.id]?.active).sort((a,b)=>classLabel(data.turmas[a.turmaId]||{}).localeCompare(classLabel(data.turmas[b.turmaId]||{}),'pt-BR')||a.nome.localeCompare(b.nome,'pt-BR'));
    content.append(node('p',list.length+' registros por disciplina. A marcação não altera as notas nem os critérios de avaliação.','gb-help'));
    for(const a of list){const m=data.monitoring[a.id],row=node('section',null,'gb-report-subject');row.append(button(a.nome,()=>showReport(a)),node('p',classLabel(data.turmas[a.turmaId]||{})),node('p',m.reason+(m.referenceAverage==null?'':' · SIAP: '+fmt(m.referenceAverage)),'gb-help'));content.append(row);}
  }
  function appendBulletin(section,pupil){
    const previous=data.reportCards?.[pupil.id]||{},line=node('div',null,'gb-bulletin-summary');line.setAttribute('aria-label','Notas anteriores e média do SIAP');
    for(const period of [1,2,3]){const item=node('span');item.append(node('span',period+'º: '),node('strong',fmt(previous.bimestres?.[period])));line.append(item);}
    const mean=node('span');mean.append(node('span','Média SIAP: '),node('strong',fmt(previous.mediaFinalSiap)));line.append(mean);section.append(line);
    const editor=node('details',null,'gb-bulletin-editor');editor.append(node('summary','Editar notas anteriores e acompanhamento'));
    const box=node('div',null,'gb-bulletin-history');editor.append(box);
    const fields=[];for(const period of [1,2,3]){const label=node('label',period+'º bimestre'),input=node('input');input.type='number';input.min='0';input.max='10';input.step='0.1';input.inputMode='decimal';input.value=previous.bimestres?.[period]??'';input.setAttribute('aria-label',period+'º bimestre — '+pupil.nome+' — '+(data.turmas[pupil.turmaId]?.disciplina||''));label.append(input);box.append(label);fields.push([String(period),input]);}
    if(previous.mediaFinalSiap!=null)box.append(node('p','Média final provisória no SIAP: '+fmt(previous.mediaFinalSiap)+' · '+(previous.conferidoEm||''),'gb-help'));
    const tracking=node('label','Acompanhar nesta disciplina'),check=node('input');check.type='checkbox';check.checked=!!data.monitoring?.[pupil.id]?.active;check.setAttribute('aria-label','Acompanhar '+pupil.nome+' em '+(data.turmas[pupil.turmaId]?.disciplina||''));tracking.append(check);box.append(tracking);
    const reason=node('label','Observação de acompanhamento'),text=node('input');text.type='text';text.maxLength=300;text.value=data.monitoring?.[pupil.id]?.reason||'';reason.append(text);box.append(reason);
    autosave(box,async()=>{try{const values={};for(const [period,input]of fields){if(!input.checkValidity())throw Error('Confira as notas de 0 a 10.');const value=B.grade(input.value);if(value!==null)values[period]=value;}
      const active=check.checked,reason=text.value.trim()||'Acompanhamento pedagógico';
      const ok=await update(d=>{d.reportCards??={};d.monitoring??={};d.reportCards[pupil.id]={...(d.reportCards[pupil.id]||{}),year:2026,bimestres:values};d.monitoring[pupil.id]={...(d.monitoring[pupil.id]||{}),active,kind:d.monitoring[pupil.id]?.kind||'aprendizagem',reason};});
      if(ok)fields.forEach(([period],i)=>line.children[i].querySelector('strong').textContent=fmt(values[period]));return ok;
    }catch(e){message(e.message,true);return false;}});box.append(node('p','Alterações salvas automaticamente.','gb-help'));section.append(editor);
  }
  bulletinFile.addEventListener('change',async()=>{const f=bulletinFile.files[0];if(!f)return;try{if(f.size>5*1024*1024)throw Error('Arquivo grande demais.');const source=JSON.parse(await f.text());const preview=B.importBulletin(source,data);content.replaceChildren(node('h3','Conferir importação do boletim'),node('p',preview.imported+' registros de notas anteriores · '+preview.marked+' acompanhamentos · '+preview.checks+' conferências de lançamento · '+preview.pending.length+' pendências.'));
      for(const issue of preview.pending)content.append(node('p',issue,'gb-help'));
      content.append(button('Aplicar notas e marcações',async()=>{try{let applied;const ok=await update(d=>{applied=B.importBulletin(source,d);Object.assign(d,applied.next);});if(ok){view='monitoring';render();message(applied.imported+' boletins importados. '+applied.pending.length+' pendências preservadas para conferência.');}}catch(e){message(e.message,true);}}),button('Cancelar',render));
    }catch(e){message(e.message,true);}finally{bulletinFile.value='';}});
  let linkingRegistration=false,registrationChecked=false;
  async function enrichRegistrations(){if(linkingRegistration||registrationChecked||!Object.keys(data.alunos).length)return;linkingRegistration=true;try{const source=await window.MaluGradebookCloud.importSource();registrationChecked=true;const changes=Object.entries(source.alunos||{}).filter(([id,a])=>data.alunos[id]&&!data.alunos[id].cadastroEditadoEm&&!data.alunos[id].siapVerificadoEm&&a?.matricula&&String(data.alunos[id].matricula||'')!==String(a.matricula).trim());if(changes.length)await update(d=>{for(const [id,a]of changes)if(d.alunos[id]&&!d.alunos[id].cadastroEditadoEm)d.alunos[id].matricula=String(a.matricula).trim();});}catch(e){}finally{linkingRegistration=false;}}
  function originMatchesClass(origin,t){const match=origin?.weekId?.match(/^s(\d+)-(historia|filosofia|sociologia)-/);return !!(match&&t&&Number(match[1])===Number.parseInt(t.serie||t.nome)&&({historia:'História',filosofia:'Filosofia',sociologia:'Sociologia'})[match[2]]===t.disciplina);}
  function activityForm(existing,preset){
    const form=node('form',null,'gb-form'),field=(label,type,value)=>{const box=node('label',label),input=node('input');input.type=type;input.value=value;box.append(input);form.append(box);return input;};
    const targetClass=selected,t=data.turmas[targetClass],visibleOrigin=currentOrigin();
    const origin=existing?(existing.origem||null):(draftOrigin||(originMatchesClass(visibleOrigin,t)?visibleOrigin:null));
    form.append(node('p','Registrar em: '+classLabel(t||{}),'gb-help'));
    if(origin&&!originMatchesClass(origin,t))form.append(node('p','A unidade vinculada pertence a outra série ou disciplina. Escolha a turma correspondente antes de registrar.','gb-error'));
    const name=field('Atividade','text',existing?.nome||(preset==='points'?'Pontos extras':preset==='bonus'?'Bônus':origin?.title||'')),date=field('Data','date',existing?.data||bimestreToday());name.required=true;date.required=true;date.min='2026-10-08';date.max='2026-12-18';
    const label=node('label','Tipo'),type=node('select');for(const t of ['Texto','Resumo','Estudo dirigido','Questões','Avaliação','Outra'])type.append(new Option(t,t));type.value=existing?.tipo||'Texto';label.append(type);form.append(label);
    const sourceLabel=node('label','O que registrar'),sourceChoice=node('select'),originCard=origin?.weekId&&document.getElementById(origin.weekId),bookReferences=[...originCard?.querySelectorAll('.book-activity')||[]].map(n=>n.textContent.trim()).filter(Boolean),bookReference=[...new Set(bookReferences)].join(' · ');
    sourceChoice.append(new Option('Caderno dos alunos','notebook'),new Option('Atividade da unidade','activity'));if(bookReference)sourceChoice.append(new Option('Livro · '+bookReference,'book'));sourceChoice.value=origin?.kind==='book'?'book':(origin?.panel||'notebook');if(!sourceChoice.value)sourceChoice.value='notebook';sourceLabel.append(sourceChoice);form.append(sourceLabel);if(origin)form.append(node('p','Unidade: '+origin.title,'gb-help'));
    let suggestedName=name.value;sourceChoice.addEventListener('change',()=>{if(name.value===suggestedName){suggestedName=sourceChoice.value==='book'?'Livro · '+bookReference:origin?.title||'';name.value=suggestedName;}});
    const max=field('Valor máximo','number',existing?.valorMax||(preset?1:10)),weight=field('Peso na média ponderada','number',existing?.peso||(preset==='bonus'?0.1:1));for(const n of [max,weight]){n.min='0.1';n.step='0.1';n.required=true;}
    const checkLabel=node('label','Registrar por execução (fez / não fez)'),check=node('input');check.type='checkbox';check.checked=existing?!!existing.checklist:preset!=='points';checkLabel.append(check);form.append(checkLabel);
    const extraLabel=node('label','Atividade extra / bônus'),extra=node('input');extra.type='checkbox';extra.checked=existing?!!existing.extra:!!preset;extraLabel.append(extra);form.append(extraLabel);
    const bonusHelp=node('p','','gb-help');form.append(bonusHelp);
    function explainBonus(){weight.closest('label').firstChild.textContent=extra.checked&&check.checked?'Bônus somado à média ao marcar fez':'Peso na média ponderada';bonusHelp.textContent=extra.checked?(check.checked?'Ao marcar fez, o bônus indicado é somado diretamente à média. Exemplo: 0,1 acrescenta um décimo.':'Os pontos digitados para cada aluno são somados diretamente à média, sem entrar no cálculo das atividades obrigatórias.'):'O peso é utilizado no cálculo da média ponderada.';}
    extra.addEventListener('change',explainBonus);check.addEventListener('change',explainBonus);explainBonus();
    const activityId=existing?.id||crypto.randomUUID();
    const done=button('Concluir',async()=>{if(await flush(true)){draftOrigin=null;render();}});form.append(node('p','Alterações salvas automaticamente.','gb-help'),done);
    async function commit(){if(!form.checkValidity()){message('Confira os campos da atividade antes de sair.',true);return false;}if(origin&&!originMatchesClass(origin,t)){message('Esta unidade não pertence à série e disciplina da turma selecionada.',true);return;}if(!name.value.trim())return false;const value=Number(max.value),peso=Number(weight.value);if(!(value>0&&peso>0&&Number.isFinite(value)&&Number.isFinite(peso)))return;
      if(existing&&existing.checklist!==check.checked&&Object.values(data.scores).some(s=>s[existing.id]!=null)){message('Esta atividade já tem notas. Crie outra atividade para alterar o modo de registro.',true);return;}
      if(existing&&!check.checked&&Object.values(data.scores).some(s=>Number(s[existing.id])>value)){message('O valor máximo é menor que uma pontuação já lançada.',true);return;}
      const a={id:activityId,turmaId:targetClass,bimestre:4,nome:name.value.trim(),tipo:type.value,data:date.value,valorMax:value,peso,checklist:check.checked,extra:extra.checked,origem:origin?{weekId:origin.weekId,title:origin.title,panel:sourceChoice.value==='book'?'notebook':sourceChoice.value,kind:sourceChoice.value==='book'?'book':'unit',bookReference:sourceChoice.value==='book'?bookReference:'',url:''}:null};return update(d=>{const current=d.activities.find(x=>x.id===a.id);if(current&&current.checklist!==a.checklist&&Object.values(d.scores).some(scores=>scores[a.id]!=null))throw Error('Esta atividade já tem notas. Preserve o modo de registro.');const i=d.activities.findIndex(x=>x.id===a.id);if(i<0)d.activities.push(a);else d.activities[i]=a;});}
    flushEditors();autoEditors.clear();const flush=autosave(form,commit);form.addEventListener('submit',async e=>{e.preventDefault();await flush(true);});content.replaceChildren(form);name.focus();
  }
  function bimestreToday(){return today()<'2026-10-08'?'2026-10-08':today()>'2026-12-18'?'2026-12-18':today();}
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  let attendanceDate='',attendanceSlot='';
  function renderAttendance(){
    const label=node('label','Data da aula'),date=node('input');date.type='date';date.min='2026-10-08';date.max='2026-12-18';date.value=attendanceDate||bimestreToday();attendanceDate=date.value;label.append(date);content.append(label);
    const period={value:'dia'},daySchedule=node('div',null,'gb-day-schedule');daySchedule.setAttribute('role','group');daySchedule.setAttribute('aria-label','Aulas da data selecionada');content.append(daySchedule);
    const imports=node('details',null,'gb-settings');imports.append(node('summary','Importar chamada'));const importActions=node('div',null,'gb-settings-actions');imports.append(importActions);
    const csv=node('input');csv.type='file';csv.accept='.csv,text/csv';csv.hidden=true;importActions.append(button('Importar chamada do Arlan',async()=>{try{message('Lendo a planilha do Arlan…');const r=await fetch(window.MaluArlan.url);if(!r.ok)throw Error();await applyArlan(await r.text());}catch(e){message('A leitura da planilha falhou. Use Importar CSV do Arlan com o arquivo da aba Frequencia_Diaria.',true);}}),button('Importar CSV do Arlan',()=>csv.click()),csv);csv.addEventListener('change',async()=>{try{if(csv.files[0])await applyArlan(await csv.files[0].text());}catch(e){message(e.message,true);}finally{csv.value='';}});
    const list=node('div',null,'gb-attendance-list');content.append(list);
    async function applyArlan(text){try{const r=window.MaluArlan.plan(text,data,selected,date.value,window.MaluGradebookSchedule);if(r.pending.length){message('Nomes que exigem conferência: '+r.pending.join('; '),true);}if(!r.count){if(!r.pending.length)message('Nenhuma falta nova nesta data. Registros anteriores foram preservados.');return;}if(!confirm('Importar '+r.count+' falta(s) em '+date.value+'? '+r.skipped+' registro(s) preservado(s) e '+r.pending.length+' nome(s) pendente(s). Os demais alunos continuarão sem lançamento.'))return;if(await save(r.next)){paint();message(r.count+' falta(s) importada(s).'+(r.pending.length?' Conferir: '+r.pending.join('; '):''),!!r.pending.length);}}catch(e){message(e.message,true);}}
    function validDate(){if(!date.value||date.value<'2026-10-08'||date.value>'2026-12-18'){message('Escolha uma data entre 08/10 e 18/12, no 4º bimestre.',true);return false;}return true;}
    content.append(button('Salvar chamada',async()=>{if(!selected){message('Escolha uma aula ou turma.',true);return;}if(!validDate())return;const k=selected+'|'+date.value+'|'+period.value;if(await update(d=>{d.attendance[k]??={};for(const a of students())d.attendance[k][a.id]??='P';}))message('Chamada registrada.');}));
    const paint=()=>{list.replaceChildren();for(const a of students()){const choice=node('button');choice.type='button';const k=selected+'|'+date.value+'|'+period.value;
      const color=()=>{const absent=data.attendance[k]?.[a.id]==='F';choice.textContent=(absent?'✕ ':'✓ ')+a.nome;choice.className='gb-attendance-row '+(absent?'gb-absent':'gb-present');choice.setAttribute('aria-label',(absent?'Falta':'Presente')+' — '+a.nome);choice.setAttribute('aria-pressed',String(absent));};color();choice.disabled=!date.value;
      choice.addEventListener('click',async()=>{if(!validDate())return;choice.disabled=true;const value=data.attendance[k]?.[a.id]==='F'?'P':'F';await update(d=>{d.attendance[k]??={};d.attendance[k][a.id]=value;});color();choice.disabled=false;});
      const row=node('div',null,'gb-attendance-pupil');row.append(choice);
      const tracking=data.monitoring?.[a.id];
      if(tracking?.active){const marker=button('⚠️',()=>showReport(a));marker.className='gb-attendance-warning';marker.title=tracking.reason||'Acompanhamento pedagógico';marker.setAttribute('aria-label','Aviso de acompanhamento — '+a.nome);row.append(marker);}
      list.append(row);}if(!students().length)list.append(node('p','Importe os alunos desta turma para fazer a chamada.'));};
    const periods=()=>{
      daySchedule.replaceChildren();const day=new Date(date.value+'T12:00:00').getDay();
      const lessons=(window.MaluGradebookSchedule||[]).filter(h=>h.dia===day).map(h=>({h,t:Object.values(data.turmas).find(t=>Number.parseInt(t.serie)===h.serie&&t.letra===h.letra&&t.disciplina===h.disc&&t.unidade===h.unidade)})).filter(x=>x.t).sort((a,b)=>a.h.ini.localeCompare(b.h.ini)||classLabel(a.t).localeCompare(classLabel(b.t),'pt-BR'));
      if(!selected&&lessons.length){selected=lessons[0].t.id;select.value=selected;}
      const matching=lessons.filter(x=>x.t.id===selected);
      if(!matching.some(x=>x.h.ini===attendanceSlot))attendanceSlot=matching[0]?.h.ini||'dia';
      period.value=attendanceSlot;
      for(const {h,t}of lessons){const active=t.id===selected&&h.ini===period.value;
        const choice=button(t.nome+' · '+t.disciplina+' · '+h.ini+'–'+h.fim,()=>{attendanceDate=date.value;attendanceSlot=h.ini;selected=t.id;rememberClass(t);window.MaluGradebookStorage.write(key+'-class',selected).catch(()=>{});select.value=selected;message('');render();});
        choice.className='gb-lesson-choice';choice.setAttribute('aria-pressed',String(active));daySchedule.append(choice);
      }
      if(!lessons.length)daySchedule.append(node('p','Nenhuma aula cadastrada para esta data.','gb-help'));
      if(selected){const legacyKey=selected+'|'+date.value+'|dia';if(!matching.length||data.attendance[legacyKey]){
        const avulso=button('Registro do dia · '+(data.turmas[selected]?.nome||''),()=>{attendanceSlot='dia';period.value='dia';for(const b of daySchedule.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===avulso));paint();});
        avulso.className='gb-lesson-choice';avulso.setAttribute('aria-pressed',String(period.value==='dia'));daySchedule.append(avulso);
      }}
      paint();
    };date.addEventListener('change',()=>{attendanceDate=date.value;attendanceSlot='';message('');periods();});periods();content.append(imports);
  }
  file.addEventListener('change',async()=>{const f=file.files[0];if(!f)return;try{if(f.size>32*1024*1024)throw Error('Arquivo grande demais. Use o backup JSON do Leciona.');const source=JSON.parse(await f.text());const {next,classes,students}=C.importRoster(source,data);if(!confirm('Importar '+students+' alunos e '+classes+' turmas? Notas e frequências antigas não serão trazidas. Seus lançamentos atuais serão preservados.'))return;if(await save(next)){refreshClasses();render();message(students+' alunos importados. Notas e chamada do bimestre anterior não foram copiadas.');}}catch(e){message(e.message,true);}finally{file.value='';}});
  async function importCloud(){try{const source=await window.MaluGradebookCloud.importSource();const imported=C.importRoster(source,data);if(await save(imported.next)){refreshClasses();render();message(imported.students+' alunos e '+imported.classes+' turmas importados, sem notas nem chamada anteriores.');}}catch(e){message(e.message,true);}}
  if(!broken&&(data.activities.some(a=>removedActivityIds.has(a.id))||Object.values(data.scores).some(scores=>[...removedActivityIds].some(id=>Object.hasOwn(scores,id)))))await update(removeRequestedActivities);
  window.MaluGradebookCloud?.start({status:(text,error)=>{cloudInfo.textContent=text;cloudInfo.classList.toggle('gb-error',!!error);},account:user=>{login.textContent=user?'Trocar conta Google':'Entrar com Google';},receive:async next=>{const previous=JSON.parse(JSON.stringify(next)),removed=removeRequestedActivities(next);const hadClasses=Object.keys(data.turmas).length>0,activitiesChanged=JSON.stringify(data.activities.filter(a=>a.turmaId===selected))!==JSON.stringify(next.activities.filter(a=>a.turmaId===selected));data=next;enrichRegistrations();let cached=false;try{await window.MaluGradebookStorage.write(key,JSON.stringify(next));broken=false;cached=true;if(removed)await window.MaluGradebookCloud?.save(next,previous);}catch(e){message('Dados carregados da nuvem. A cópia offline não pôde ser salva neste aparelho.',true);}if(dialog.open&&!autoEditors.size&&(!hadClasses||!dialog.contains(document.activeElement)||(activitiesChanged&&!content.querySelector('input:focus,textarea:focus,select:focus')))){refreshClasses();render();}else dialog.dataset.remoteChanged='1';if(cached&&status.textContent.startsWith('Dados carregados da nuvem.'))message('Dados recebidos da nuvem.');}});
  dialog.addEventListener('focusout',()=>{setTimeout(()=>{if(dialog.dataset.remoteChanged==='1'&&!autoEditors.size&&!dialog.querySelector('input:focus')){delete dialog.dataset.remoteChanged;refreshClasses();render();}},0);});
  async function exportBackup(){const raw=broken?await window.MaluGradebookStorage.read(key):JSON.stringify(data,null,2);const blob=new Blob([raw||''],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='notas-chamada-4bimestre-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
})();

