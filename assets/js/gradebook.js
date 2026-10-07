(async () => {
  'use strict';
  const C=window.MaluGradebookCore, key='malu-gradebook-2026-b4-v1';
  const empty=()=>({version:1,year:2026,bimestre:4,turmas:{},alunos:{},mediaModo:{},activities:[],scores:{},attendance:{},importLog:{}});
  let data=empty(),broken=false,selected='',view='notes';
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
  header.append(title,button('Fechar',()=>dialog.close()));
  const info=node('p','4º bimestre · 2026 · Salvo neste aparelho','gb-info');
  const status=node('p',null,'gb-status');status.setAttribute('role','status');
  const controls=node('div',null,'gb-controls'),select=node('select');select.setAttribute('aria-label','Turma, escola e disciplina');
  select.addEventListener('change',()=>{selected=select.value;rememberClass(data.turmas[selected]);window.MaluGradebookStorage.write(key+'-class',selected).catch(()=>{});render();if(draftOrigin&&selected)activityForm();});
  const content=node('div',null,'gb-content');
  const file=node('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
  const cloudInfo=node('p','Conectando à nuvem…','gb-info');cloudInfo.setAttribute('role','status');
  const login=button('Entrar com Google',()=>window.MaluGradebookCloud?.login());
  controls.append(select);
  const settings=node('details',null,'gb-settings'),summary=node('summary','Configurações'),settingsActions=node('div',null,'gb-settings-actions');
  settingsActions.append(button('Conferir vínculos para o SIAP',auditRegistrations),login,button('Trazer alunos do Leciona pela nuvem',importCloud),button('Importar backup do Leciona',()=>file.click()),button('Baixar backup de notas e chamada',exportBackup));settings.append(summary,settingsActions);

  info.textContent='4º bimestre · 2026';settingsActions.prepend(info,cloudInfo);dialog.append(header,controls,status,content,settings,file);document.body.append(dialog);
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
  function render(){content.replaceChildren();if(view==='attendance'){renderAttendance();return;}if(!selected){content.append(node('p',Object.keys(data.turmas).length?'Selecione uma turma para continuar.':'Importe o backup completo do Leciona para trazer turmas, alunos, horários e modo de cálculo. As notas e frequências anteriores não serão importadas.'));return;}if(view==='notes')renderNotes();else renderAttendance();}
  function renderNotes(){
    const mode=node('select');mode.setAttribute('aria-label','Modo de cálculo da média');mode.append(new Option('Média ponderada','ponderada'),new Option('Média aritmética','aritmetica'));mode.value=data.mediaModo[selected]||'ponderada';
    mode.addEventListener('change',async()=>{if(await update(d=>d.mediaModo[selected]=mode.value))render();else mode.value=data.mediaModo[selected]||'ponderada';});
    const calculation=node('details',null,'gb-calculation');calculation.append(node('summary','Cálculo da média'),mode,node('p','Atividade sem nota vale zero. Extras somam bônus, até 10.','gb-help'));content.append(button('Nova atividade',()=>activityForm()),calculation);
    const avs=activities(),als=students();
    if(!avs.length)content.append(node('p','Nenhuma atividade cadastrada neste bimestre.'));
    if(!als.length)content.append(node('p','Esta turma ainda não possui alunos ativos importados.'));
    const list=node('div',null,'gb-activities');
    for(const a of avs){const row=node('div');row.append(node('span',a.nome+' · '+a.tipo+' · máximo '+fmt(a.valorMax)+(a.extra?' · bônus':'')+' · peso '+fmt(a.peso)),button('Editar',()=>activityForm(a)),button('Excluir',async()=>{if(!confirm('Excluir esta atividade e suas pontuações?'))return;await update(d=>{d.activities=d.activities.filter(x=>x.id!==a.id);for(const scores of Object.values(d.scores))delete scores[a.id];});render();}));list.append(row);}content.append(list);
    if(!als.length)return;
    const wrap=node('div',null,'gb-table-wrap'),table=node('table'),head=node('tr');
    for(const text of ['Aluno',...avs.map(a=>a.nome),'Soma','Bônus','Média / 10'])head.append(node('th',text));table.append(head);
    for(const student of als){
      const row=node('tr'),name=node('th');name.scope='row';const studentLink=button((student.numero?student.numero+'. ':'')+student.nome,()=>showReport(student));studentLink.className='gb-student-link';name.append(studentLink);row.append(name);
      const totalCells=[node('td'),node('td'),node('td')];
      const paint=()=>{const r=C.result(avs,data.scores[student.id]||{},data.mediaModo[selected]);totalCells[0].textContent=fmt(r.sum)+' / '+fmt(r.max);totalCells[1].textContent=fmt(r.bonus);totalCells[2].textContent=fmt(r.average);};
      for(const a of avs){const cell=node('td'),input=node('input'),saved=data.scores[student.id]?.[a.id];input.setAttribute('aria-label',a.nome+' — '+student.nome);input.dataset.gbStudent=student.id;input.dataset.gbActivity=a.id;
        input.type=a.checklist?'checkbox':'number';if(a.checklist)input.checked=Number(saved)>0;else{input.min='0';input.max=String(a.valorMax);input.step='0.1';input.value=saved==null?'':String(saved);input.inputMode='decimal';}
        input.addEventListener('change',async()=>{const raw=a.checklist?(input.checked?1:0):(input.value===''?null:Number(input.value));
          if(raw!==null&&(!Number.isFinite(raw)||raw<0||(!a.checklist&&raw>a.valorMax))){input.setCustomValidity('Digite uma pontuação entre 0 e '+a.valorMax+'.');input.reportValidity();return;}input.setCustomValidity('');
          const ok=await update(d=>{d.scores[student.id]??={};if(raw===null)delete d.scores[student.id][a.id];else d.scores[student.id][a.id]=raw;});if(ok)paint();else{const old=data.scores[student.id]?.[a.id];if(a.checklist)input.checked=Number(old)>0;else input.value=old==null?'':String(old);}});cell.append(input);row.append(cell);
      }row.append(...totalCells);paint();table.append(row);
    }wrap.append(table);content.append(wrap);
  }
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
    content.replaceChildren();const top=node('div',null,'gb-report-header');top.append(button('← Voltar às notas',render),node('h3',student.nome));content.append(top);
    const records=C.reportStudents(student,data.alunos);top.append(node('p','Boletim · disciplinas do aluno','gb-help'));if(!student.matricula)content.append(node('p','Matrícula ainda não vinculada: exibindo somente esta disciplina.','gb-help'));
    for(const pupil of records.sort((a,b)=>(a.turmaId===selected?-1:b.turmaId===selected?1:0)||classLabel(data.turmas[a.turmaId]||{}).localeCompare(classLabel(data.turmas[b.turmaId]||{}),'pt-BR'))){
      const t=data.turmas[pupil.turmaId];if(!t)continue;const avs=data.activities.filter(a=>a.turmaId===pupil.turmaId).sort((a,b)=>a.data.localeCompare(b.data)),scores=data.scores[pupil.id]||{},totals=C.result(avs,scores,data.mediaModo[pupil.turmaId]);
      const section=node('section',null,'gb-report-subject');section.append(node('h4',classLabel(t)),node('p','Média: '+fmt(totals.average)+' / 10 · Soma: '+fmt(totals.sum),'gb-report-average'));
      if(!avs.length)section.append(node('p','Nenhuma atividade cadastrada no 4º bimestre.','gb-help'));
      else for(const done of [true,false]){const group=node('div',null,done?'gb-report-done':'gb-report-pending'),items=avs.filter(a=>C.completed(a,scores[a.id])===done);group.append(node('h5',(done?'✓ Feitas':'○ Pendentes')+' · '+items.length));for(const activity of items){const link=button(activity.nome+(done?' · '+(activity.checklist?'Feita':fmt(scores[activity.id])+' / '+fmt(activity.valorMax)):''),()=>{selected=pupil.turmaId;rememberClass(t);openActivitySource(activity);});link.className='gb-report-activity';group.append(link);}section.append(group);}
      content.append(section);
    }
  }
  let linkingRegistration=false,registrationChecked=false;
  async function enrichRegistrations(){if(linkingRegistration||registrationChecked||!Object.keys(data.alunos).length)return;linkingRegistration=true;try{const source=await window.MaluGradebookCloud.importSource();registrationChecked=true;const changes=Object.entries(source.alunos||{}).filter(([id,a])=>data.alunos[id]&&!data.alunos[id].siapVerificadoEm&&a?.matricula&&String(data.alunos[id].matricula||'')!==String(a.matricula).trim());if(changes.length)await update(d=>{for(const [id,a]of changes)if(d.alunos[id])d.alunos[id].matricula=String(a.matricula).trim();});}catch(e){}finally{linkingRegistration=false;}}
  function originMatchesClass(origin,t){const match=origin?.weekId?.match(/^s(\d+)-(historia|filosofia|sociologia)-/);return !!(match&&t&&Number(match[1])===Number.parseInt(t.serie||t.nome)&&({historia:'História',filosofia:'Filosofia',sociologia:'Sociologia'})[match[2]]===t.disciplina);}
  function activityForm(existing){
    const form=node('form',null,'gb-form'),field=(label,type,value)=>{const box=node('label',label),input=node('input');input.type=type;input.value=value;box.append(input);form.append(box);return input;};
    const targetClass=selected,t=data.turmas[targetClass],visibleOrigin=currentOrigin();
    const origin=existing?(existing.origem||null):(draftOrigin||(originMatchesClass(visibleOrigin,t)?visibleOrigin:null));
    form.append(node('p','Registrar em: '+classLabel(t||{}),'gb-help'));
    if(origin&&!originMatchesClass(origin,t))form.append(node('p','A unidade vinculada pertence a outra série ou disciplina. Escolha a turma correspondente antes de registrar.','gb-error'));
    const name=field('Atividade','text',existing?.nome||origin?.title||''),date=field('Data','date',existing?.data||bimestreToday());name.required=true;date.required=true;date.min='2026-10-08';date.max='2026-12-18';
    const label=node('label','Tipo'),type=node('select');for(const t of ['Texto','Resumo','Estudo dirigido','Questões','Avaliação','Outra'])type.append(new Option(t,t));type.value=existing?.tipo||'Texto';label.append(type);form.append(label);
    const sourceLabel=node('label','O que registrar'),sourceChoice=node('select'),originCard=origin?.weekId&&document.getElementById(origin.weekId),bookReferences=[...originCard?.querySelectorAll('.book-activity')||[]].map(n=>n.textContent.trim()).filter(Boolean),bookReference=[...new Set(bookReferences)].join(' · ');
    sourceChoice.append(new Option('Caderno dos alunos','notebook'),new Option('Atividade da unidade','activity'));if(bookReference)sourceChoice.append(new Option('Livro · '+bookReference,'book'));sourceChoice.value=origin?.kind==='book'?'book':(origin?.panel||'notebook');if(!sourceChoice.value)sourceChoice.value='notebook';sourceLabel.append(sourceChoice);form.append(sourceLabel);if(origin)form.append(node('p','Unidade: '+origin.title,'gb-help'));
    let suggestedName=name.value;sourceChoice.addEventListener('change',()=>{if(name.value===suggestedName){suggestedName=sourceChoice.value==='book'?'Livro · '+bookReference:origin?.title||'';name.value=suggestedName;}});
    const max=field('Valor máximo','number',existing?.valorMax||10),weight=field('Peso na média ponderada','number',existing?.peso||1);for(const n of [max,weight]){n.min='0.1';n.step='0.1';n.required=true;}
    const checkLabel=node('label','Registrar por execução (fez / não fez)'),check=node('input');check.type='checkbox';check.checked=existing?!!existing.checklist:true;checkLabel.append(check);form.append(checkLabel);
    const extraLabel=node('label','Atividade extra / bônus'),extra=node('input');extra.type='checkbox';extra.checked=!!existing?.extra;extraLabel.append(extra);form.append(extraLabel);
    form.append(node('p','No bônus por execução, o peso é o valor somado à média.','gb-help'));
    const submit=node('button','Salvar atividade');submit.type='submit';form.append(submit,button('Cancelar',()=>{draftOrigin=null;render();}));
    form.addEventListener('submit',async e=>{e.preventDefault();if(selected!==targetClass){message('A turma mudou. Abra o cadastro novamente.',true);return;}if(origin&&!originMatchesClass(origin,t)){message('Esta unidade não pertence à série e disciplina da turma selecionada.',true);return;}if(!name.value.trim())return;const value=Number(max.value),peso=Number(weight.value);if(!(value>0&&peso>0&&Number.isFinite(value)&&Number.isFinite(peso)))return;
      if(existing&&existing.checklist!==check.checked&&Object.values(data.scores).some(s=>s[existing.id]!=null)){message('Esta atividade já tem notas. Crie outra atividade para alterar o modo de registro.',true);return;}
      if(existing&&!check.checked&&Object.values(data.scores).some(s=>Number(s[existing.id])>value)){message('O valor máximo é menor que uma pontuação já lançada.',true);return;}
      const a={id:existing?.id||crypto.randomUUID(),turmaId:targetClass,bimestre:4,nome:name.value.trim(),tipo:type.value,data:date.value,valorMax:value,peso,checklist:check.checked,extra:extra.checked,origem:origin?{weekId:origin.weekId,title:origin.title,panel:sourceChoice.value==='book'?'notebook':sourceChoice.value,kind:sourceChoice.value==='book'?'book':'unit',bookReference:sourceChoice.value==='book'?bookReference:'',url:''}:null};if(await update(d=>{const i=d.activities.findIndex(x=>x.id===a.id);if(i<0)d.activities.push(a);else d.activities[i]=a;})){draftOrigin=null;render();}});content.replaceChildren(form);
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
      choice.addEventListener('click',async()=>{if(!validDate())return;choice.disabled=true;const value=data.attendance[k]?.[a.id]==='F'?'P':'F';await update(d=>{d.attendance[k]??={};d.attendance[k][a.id]=value;});color();choice.disabled=false;});list.append(choice);}if(!students().length)list.append(node('p','Importe os alunos desta turma para fazer a chamada.'));};
    const periods=()=>{
      daySchedule.replaceChildren();const day=new Date(date.value+'T12:00:00').getDay();
      const lessons=(window.MaluGradebookSchedule||[]).filter(h=>h.dia===day).map(h=>({h,t:Object.values(data.turmas).find(t=>Number.parseInt(t.serie)===h.serie&&t.letra===h.letra&&t.disciplina===h.disc&&t.unidade===h.unidade)})).filter(x=>x.t).sort((a,b)=>a.h.ini.localeCompare(b.h.ini)||classLabel(a.t).localeCompare(classLabel(b.t),'pt-BR'));
      if(!selected&&lessons.length){selected=lessons[0].t.id;select.value=selected;}
      const matching=lessons.filter(x=>x.t.id===selected);
      if(!matching.some(x=>x.h.ini===attendanceSlot))attendanceSlot=matching[0]?.h.ini||'dia';
      period.value=attendanceSlot;
      for(const {h,t}of lessons){const active=t.id===selected&&h.ini===period.value;
        const choice=button(h.ini+'–'+h.fim+' · '+t.nome+' · '+t.disciplina,()=>{attendanceDate=date.value;attendanceSlot=h.ini;selected=t.id;rememberClass(t);window.MaluGradebookStorage.write(key+'-class',selected).catch(()=>{});select.value=selected;message('');render();});
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
  window.MaluGradebookCloud?.start({status:(text,error)=>{cloudInfo.textContent=text;cloudInfo.classList.toggle('gb-error',!!error);},account:user=>{login.textContent=user?'Trocar conta Google':'Entrar com Google';},receive:async next=>{const previous=JSON.parse(JSON.stringify(next)),removed=removeRequestedActivities(next);const hadClasses=Object.keys(data.turmas).length>0;data=next;enrichRegistrations();let cached=false;try{await window.MaluGradebookStorage.write(key,JSON.stringify(next));broken=false;cached=true;if(removed)await window.MaluGradebookCloud?.save(next,previous);}catch(e){message('Dados carregados da nuvem. A cópia offline não pôde ser salva neste aparelho.',true);}if(dialog.open&&(!hadClasses||!dialog.contains(document.activeElement))){refreshClasses();render();}else dialog.dataset.remoteChanged='1';if(cached&&status.textContent.startsWith('Dados carregados da nuvem.'))message('Dados recebidos da nuvem.');}});
  dialog.addEventListener('focusout',()=>{setTimeout(()=>{if(dialog.dataset.remoteChanged==='1'&&!dialog.querySelector('input:focus')){delete dialog.dataset.remoteChanged;refreshClasses();render();}},0);});
  async function exportBackup(){const raw=broken?await window.MaluGradebookStorage.read(key):JSON.stringify(data,null,2);const blob=new Blob([raw||''],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='notas-chamada-4bimestre-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
})();
