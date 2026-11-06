/* Nota compartilhada do ciclo de debates — 3ª série, 4º bimestre.
 * Mesma avaliação em História, Filosofia e Sociologia.
 * Uma nota pré-existente divergente nunca é sobrescrita automaticamente.
 */
(() => {
  'use strict';
  const disciplines=new Set(['HISTORIA','FILOSOFIA','SOCIOLOGIA']);
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('pt-BR').trim().replace(/\s+/g,' ');
  const has=(s,key)=>s&&Object.prototype.hasOwnProperty.call(s,key)&&s[key]!=null;
  const group=t=>{
    if(!t||Number.parseInt(t.serie||t.nome,10)!==3||!disciplines.has(norm(t.disciplina)))return null;
    const letter=norm(t.letra||String(t.nome||'').match(/\b([A-Z])$/i)?.[1]);
    const unit=norm(t.unidade);
    if(!letter||!unit)return null; // Não cruzar turmas ou escolas sem identificação segura.
    return unit+'|3|'+letter;
  };
  const isDebate=(d,a)=>{
    const t=d.turmas?.[a.turmaId];
    if(!group(t)||a.registroExecucao||a.extra)return false;
    const name=norm(a.nome);
    return a.origem?.sharedAssessment==='ciclo-debates-s3'||
      a.origem?.checklistKey==='hist-ciclo'||
      name.includes('CICLO DE DEBATES')||
      name.startsWith('ATIVIDADE CICLO CONFORME CHECKLIST');
  };
  function sameStudent(a,b){
    const r1=String(a.matricula||'').trim(),r2=String(b.matricula||'').trim();
    if(r1&&r2)return r1===r2;
    return !!(norm(a.nome)&&norm(a.nome)===norm(b.nome));
  }
  function linked(d,activityId,studentId){
    const a=d.activities.find(x=>x.id===activityId),p=d.alunos?.[studentId],t=d.turmas?.[a?.turmaId];
    if(!a||!p||p.turmaId!==a.turmaId||!isDebate(d,a))return {targets:[],missing:['Atividade ou aluno não vinculado ao ciclo de debates']};
    const g=group(t),targets=[],missing=[];
    const currentSubject=norm(t.disciplina);
    for(const subject of disciplines){
      if(subject===currentSubject)continue;
      const classes=Object.values(d.turmas||{}).filter(x=>x.ativo!==false&&group(x)===g&&norm(x.disciplina)===subject);
      if(classes.length!==1){missing.push(subject+' (turma não identificada de forma única)');continue;}
      const targetClass=classes[0];
      const pupils=Object.values(d.alunos||{}).filter(x=>x.turmaId===targetClass.id&&x.ativo!==false&&sameStudent(p,x));
      if(pupils.length!==1){missing.push(subject+' (estudante sem correspondência única)');continue;}
      const targetStudent=pupils[0];
      const candidates=d.activities.filter(x=>x.turmaId===targetClass.id&&isDebate(d,x));
      if(candidates.length!==1){missing.push(subject+' (campo de debate ausente ou duplicado)');continue;}
      targets.push({subject,student:targetStudent,activity:candidates[0]});
    }
    return {targets,missing};
  }
  function propagate(d,activityId,studentId,value,opts={}){
    const {targets,missing}=linked(d,activityId,studentId),conflicts=[],updated=[],same=[];
    const existing=d.scores?.[studentId]?.[activityId];
    for(const target of targets){
      const scores=d.scores?.[target.student.id]||{};
      const current=scores[target.activity.id];
      if(value===null){ // Apagar uma nota não remove automaticamente registros das demais disciplinas.
        if(has(scores,target.activity.id))same.push(target.subject+' (nota mantida)');
        continue;
      }
      if(has(scores,target.activity.id)){
        if(current===value){same.push(target.subject);continue;}
        if(!opts.onlyMissing&&opts.previous!==undefined&&opts.previous!==null&&Number(current)===Number(opts.previous)){
          d.scores[target.student.id][target.activity.id]=value;updated.push(target.subject);continue;
        }
        conflicts.push(target.subject+' (nota existente '+current+')');continue;
      }
      d.scores[target.student.id]??={};
      d.scores[target.student.id][target.activity.id]=value;updated.push(target.subject);
    }
    return {updated,conflicts,missing,same,oldScore:existing};
  }
  function backfill(d){
    let updated=0;
    if(!d?.activities||!d?.scores||!d?.alunos)return {updated:0};
    // Primeiro História: caso uma nota antiga tenha sido lançada apenas nessa disciplina.
    const ordered=d.activities.filter(a=>isDebate(d,a)).sort((a,b)=>{
      const rank=t=>['HISTORIA','FILOSOFIA','SOCIOLOGIA'].indexOf(norm(d.turmas[a===t?a.turmaId:t.turmaId]?.disciplina));
      return rank(a)-rank(b);
    });
    for(const a of ordered)for(const p of Object.values(d.alunos)){
      if(p.turmaId!==a.turmaId||!has(d.scores[p.id],a.id))continue;
      const result=propagate(d,a.id,p.id,Number(d.scores[p.id][a.id]),{onlyMissing:true});
      updated+=result.updated.length;
    }
    return {updated};
  }
  globalThis.MaluDebateGrades={isDebate,linked,propagate,backfill};
})();
