import assert from 'node:assert/strict';
import '../assets/js/gradebook-batch-import.js';
const helper=globalThis.MaluBlocoImport;
const records=Array.from({length:28},(_,i)=>({
  nome:'ESTUDANTE TESTE '+String(i+1).padStart(2,'0'),
  notas:{'História':i===0?9.33:8,'Geografia':i===0?6.67:10}
}));
const original={
  version:1,year:2026,bimestre:4,
  turmas:{
    h:{id:'h',serie:'2',letra:'AB',nome:'2º AB',unidade:'EFG',disciplina:'História'},
    g:{id:'g',serie:'2',letra:'AB',nome:'2º AB',unidade:'EFG',disciplina:'Geografia'}
  },
  alunos:Object.fromEntries(records.flatMap((r,i)=>[['h'+i,{id:'h'+i,turmaId:'h',nome:r.nome,ativo:true}],['g'+i,{id:'g'+i,turmaId:'g',nome:r.nome,ativo:true}]])),
  activities:[{id:'outra',turmaId:'h',nome:'Outra atividade',tipo:'Avaliação',data:'2026-10-20',valorMax:10,peso:1,checklist:false,extra:false}],
  scores:{h0:{outra:7.5}},
  attendance:{},importLog:{},reportCards:{},monitoring:{},mediaModo:{}
};
const source={schema:'malu-avaliacao-bloco-ii-v1',year:2026,bimestre:4,serie:2,turma:'B',
  atividade:'Avaliação Bloco II',data:'2026-11-04',valorMax:10,records,
  pendentes:['ESTUDANTE TESTE PENDENTE A','ESTUDANTE TESTE PENDENTE B','ESTUDANTE TESTE PENDENTE C']};
let planned=helper.plan(source,original);
assert.equal(planned.issues.length,0,planned.issues.join('; '));
assert.equal(planned.toSave,56);
assert.equal(planned.entries.length,56);
const missing=structuredClone(original);
delete missing.alunos.h0;
assert.ok(helper.plan(source,missing).issues.some(x=>x.includes('27/28 nomes encontrados')),
  'Não deve importar para um diário com nome ausente');
const mistakenSchool=structuredClone(original);
mistakenSchool.turmas.h.unidade='CEPI Marajó';
assert.ok(helper.plan(source,mistakenSchool).issues.some(x=>x.includes('Nenhum diário')),
  'Não deve importar a nota da EFG no CEPI Marajó');
const data=structuredClone(original);
helper.apply(source,data);
const history=data.activities.find(a=>a.turmaId==='h'&&a.nome==='Avaliação Bloco II');
const geography=data.activities.find(a=>a.turmaId==='g'&&a.nome==='Avaliação Bloco II');
assert.ok(history && geography);
assert.equal(data.scores.h0[history.id],9.33);
assert.equal(data.scores.g0[geography.id],6.67);
assert.equal(data.scores.h0.outra,7.5);
assert.equal(Object.keys(data.scores).length,56);
assert.equal(Object.keys(data.scores).filter(k=>k.startsWith('pending')).length,0);
planned=helper.plan(source,data);
assert.equal(planned.issues.length,0);
assert.equal(planned.alreadySaved,56);
assert.equal(planned.toSave,0);
helper.apply(source,data);
assert.equal(data.activities.length,3,'Idempotência: nenhuma atividade duplicada');
data.scores.h0[history.id]=7;
const conflict=helper.plan(source,data);
assert.ok(conflict.issues.some(x=>x.includes('já existe nota diferente')));
assert.throws(()=>helper.apply(source,data));
console.log('Bloco II: 56 notas, duas disciplinas, preservação, idempotência e conflito validados.');
