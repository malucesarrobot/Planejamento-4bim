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
      next.alunos[id]={...previous,id,nome:official?.nome||a.nome,numero:a.numero||null,turmaId:a.turmaId,ativo:official?official.ativo!==false:a.ativo!==false,matricula:official?.matricula|| (a.matricula==null?'':String(a.matricula).trim())};
      if(official){next.alunos[id].siapVerificadoEm=official.siapVerificadoEm;next.alunos[id].situacaoSiap=official.situacaoSiap;}
      students++;
    }
    if(!classes||!students)throw Error('O arquivo não contém turmas e alunos válidos.');
    return {next,classes,students};
  }
  function reportStudents(student,students){const registration=String(student.matricula||'').trim();return Object.values(students).filter(a=>a.ativo!==false&&(a.id===student.id||(registration&&String(a.matricula||'').trim()===registration)));}
  function completed(activity,value){return activity.checklist?Number(value)>0:value!==null&&value!==undefined;}
  globalThis.MaluGradebookCore={result,importRoster,reportStudents,completed};
})();
