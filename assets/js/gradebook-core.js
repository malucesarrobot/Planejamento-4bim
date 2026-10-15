(() => {
  'use strict';
  function result(activities, scores, mode='ponderada') {
    let sum=0,max=0,weighted=0,weights=0,bonus=0;
    for(const a of activities){
      const raw=scores[a.id], value=raw==null?0:Number(raw);
      if(!Number.isFinite(value)||value<0||(!a.checklist&&value>a.valorMax))throw Error('Pontuação fora do intervalo da atividade.');
      if(a.extra){bonus+=a.checklist?(value>0?a.peso:0):value;continue;}
      const points=a.checklist?(value>0?a.valorMax:0):value;
      const weight=mode==='aritmetica'?1:a.peso;
      sum+=points;max+=a.valorMax;weighted+=(points/a.valorMax)*10*weight;weights+=weight;
    }
    return {sum,max,bonus,average:weights||bonus?Math.min(10,(weights?weighted/weights:0)+bonus):null};
  }
  function importRoster(source, current) {
    if(!source || !source.turmas || !source.alunos)throw Error('Use o backup completo do Leciona, com turmas e alunos.');
    const next=JSON.parse(JSON.stringify(current));let classes=0,students=0;
    for(const [id,t] of Object.entries(source.turmas)){
      if(!t||typeof t!=='object')continue;
      if(!source.siapCorrection||!next.turmas[id])next.turmas[id]={...t,id};classes++;
      const mode=source.mediaModo?.[id];if(!source.siapCorrection&&['aritmetica','ponderada'].includes(mode))next.mediaModo[id]=mode;
    }
    for(const [id,a] of Object.entries(source.alunos)){
      if(!a||typeof a.nome!=='string'||!next.turmas[a.turmaId])continue;
      const previous=next.alunos[id]||{}, official=a.siapVerificadoEm?a:previous.siapVerificadoEm?previous:null;
      const preferred=previous.cadastroEditadoEm?previous:official||a;
      // A fresh import must not restore pupils removed manually or replace local corrections.
      next.alunos[id]={...previous,id,nome:preferred.nome,numero:previous.cadastroEditadoEm?previous.numero:a.numero||null,turmaId:a.turmaId,ativo:preferred.ativo!==false,matricula:preferred.matricula==null?'':String(preferred.matricula).trim()};
      if(official){next.alunos[id].siapVerificadoEm=official.siapVerificadoEm;next.alunos[id].situacaoSiap=official.situacaoSiap;}
      students++;
    }
    if(!classes||!students)throw Error('O arquivo não contém turmas e alunos válidos.');
    return {next,classes,students};
  }
  function reportStudents(student,students){const registration=String(student.matricula||'').trim();return Object.values(students).filter(a=>a.ativo!==false&&(a.id===student.id||(registration&&String(a.matricula||'').trim()===registration)));}
  function completed(activity,value){return activity.checklist?Number(value)>0:value!==null&&value!==undefined;}
  const normalizedName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');
  function saveStudent(data,turmaId,draft){
    if(!data.turmas[turmaId])throw Error('Selecione uma turma válida.');
    const previous=data.alunos[draft.id];
    if(previous&&previous.turmaId!==turmaId)throw Error('O aluno pertence a outra turma.');
    const nome=String(draft.nome||'').trim().replace(/\s+/g,' '),matricula=String(draft.matricula||'').trim(),rawNumber=String(draft.numero??'').trim();
    if(!nome)throw Error('Informe o nome do aluno.');
    if(rawNumber&&(!/^\d+$/.test(rawNumber)||!Number.isSafeInteger(Number(rawNumber))||Number(rawNumber)<1))throw Error('O número de chamada deve ser um inteiro positivo.');
    if(matricula&&!/^\d+$/.test(matricula))throw Error('A matrícula deve conter somente números.');
    const duplicate=Object.values(data.alunos).find(a=>a.id!==draft.id&&a.turmaId===turmaId&&((matricula&&String(a.matricula||'').trim()===matricula)||normalizedName(a.nome)===normalizedName(nome)));
    if(duplicate)throw Error(duplicate.ativo===false?'Este aluno já está nos removidos. Restaure o cadastro existente.':'Já existe aluno com este nome ou matrícula nesta turma.');
    const id=draft.id||globalThis.crypto.randomUUID();
    data.alunos[id]={...previous,id,turmaId,nome,matricula,numero:rawNumber?Number(rawNumber):null,ativo:previous?.ativo!==false,cadastroEditadoEm:new Date().toISOString()};
    return id;
  }
  function setStudentActive(data,turmaId,id,active){
    const a=data.alunos[id];if(!a||a.turmaId!==turmaId)throw Error('Aluno não encontrado nesta turma.');
    a.ativo=!!active;a.cadastroEditadoEm=new Date().toISOString();
  }
  function positions(rows){
    let pos=1;
    return rows.map((row,i)=>{if(i&&row.average!==rows[i-1].average)pos=i+1;return {...row,pos};});
  }
  function ranking(data, selected){
    const active=Object.values(data.turmas).filter(t=>t.ativo!==false);
    const pool=[],classes=[];
    for(const turma of active){
      const avs=data.activities.filter(a=>a.turmaId===turma.id),rows=[];
      for(const aluno of Object.values(data.alunos).filter(a=>a.turmaId===turma.id&&a.ativo!==false)){
        const average=result(avs,data.scores[aluno.id]||{},data.mediaModo[turma.id]).average;
        if(average!==null)rows.push({aluno,turma,average});
      }
      pool.push(...rows);
      if(rows.length)classes.push({turma,average:rows.reduce((sum,r)=>sum+r.average,0)/rows.length});
    }
    const order=rows=>positions(rows.slice().sort((a,b)=>b.average-a.average||(a.aluno?.nome||a.turma.nome||'').localeCompare(b.aluno?.nome||b.turma.nome||'','pt-BR')));
    const disciplines=[...new Set(classes.map(r=>r.turma.disciplina||'Sem disciplina'))].sort();
    const schools=[...new Set(pool.map(r=>r.turma.unidade).filter(Boolean))].sort();
    return {students:order(pool.filter(r=>r.turma.id===selected)),classes:order(classes),
      disciplines:disciplines.map(name=>({name,rows:order(classes.filter(r=>(r.turma.disciplina||'Sem disciplina')===name))})),
      top:order(pool).slice(0,30),schools:schools.map(name=>({name,rows:order(pool.filter(r=>r.turma.unidade===name)).slice(0,30)}))};
  }
  globalThis.MaluGradebookCore={result,importRoster,reportStudents,completed,ranking,saveStudent,setStudentActive};
})();
