import assert from 'node:assert/strict';
import '../assets/js/checklist-outras-turmas.js';
import '../assets/js/gradebook-core.js';
const P=globalThis.MaluChecklistOutrasTurmas,C=globalThis.MaluGradebookCore;
const turmas={
 h2a:{id:'h2a',serie:'2ª série EM',nome:'2ª A',letra:'A',unidade:'EFG',disciplina:'História'},
 h2b:{id:'h2b',serie:'2ª série EM',nome:'2ª B',letra:'B',unidade:'EFG',disciplina:'História'},
 f2b:{id:'f2b',serie:'2ª série EM',nome:'2ª B',unidade:'EFG',disciplina:'Filosofia'},
 s2a:{id:'s2a',serie:'2ª série EM',nome:'2ª A',unidade:'EFG',disciplina:'Sociologia'},
 h3a:{id:'h3a',serie:'3ª série EM',nome:'3ª A',unidade:'EFG',disciplina:'História'},
 h3b:{id:'h3b',serie:'3ª série EM',nome:'3ª B',unidade:'EFG',disciplina:'História'},
 f3a:{id:'f3a',serie:'3ª série EM',nome:'3ª A',unidade:'EFG',disciplina:'Filosofia'},
 s3a:{id:'s3a',serie:'3ª série EM',nome:'3ª A',unidade:'EFG',disciplina:'Sociologia'},
 h9a:{id:'h9a',serie:'9º ano',nome:'9º A',unidade:'CEPI Marajó',disciplina:'História'},
 h9b:{id:'h9b',serie:'9º ano',nome:'9º B',unidade:'CEPI Marajó',disciplina:'História'},
 h9c:{id:'h9c',serie:'9º ano',nome:'9º C',unidade:'CEPI Marajó',disciplina:'História'},
 h1a:{id:'h1a',serie:'1ª série EM',nome:'1ª A',unidade:'EFG',disciplina:'História'},
 h9wrong:{id:'h9wrong',serie:'9º ano',nome:'9º A',unidade:'EFG',disciplina:'História'},
 h2wrong:{id:'h2wrong',serie:'2ª série EM',nome:'2ª A',unidade:'CEPI Marajó',disciplina:'História'}
};
const data={
 version:1,year:2026,bimestre:4,turmas,
 activities:[
  {id:'bloco',turmaId:'h2b',nome:'Avaliação Bloco II',data:'2026-11-04',valorMax:10,peso:1,checklist:false,extra:false},
  {id:'cadernoExistente',turmaId:'h2a',nome:'Caderno - Primeira República',
   origem:{weekId:'s2-historia-semana-3',kind:'unit',panel:'notebook'},
   data:'2026-11-03',valorMax:10,peso:1,checklist:false,extra:false},
  {id:'cadernoNove',turmaId:'h9a',nome:'Caderno - Guerra Fria',
   origem:{weekId:'s9-historia-semana-3',kind:'unit',panel:'notebook'},
   data:'2026-11-02',valorMax:10,peso:1,checklist:false,extra:false}
 ],
 scores:{p1:{bloco:8,cadernoExistente:6},p2:{}},
 alunos:{p1:{id:'p1',turmaId:'h2b',nome:'PESSOA TESTE'},p2:{id:'p2',turmaId:'h9a',nome:'OUTRA PESSOA TESTE'}},
 mediaModo:{},attendance:{}
};
const copy=structuredClone(data),scores=structuredClone(data.scores);
const plan=P.plan(copy);
assert.equal(plan.classes,11,'Somente turmas nas 2ª e 3ª séries EFG e 9º CEPI');
assert.equal(plan.existing,2,'Reaproveita caderno lançado na semana');
assert.equal(plan.toAdd.length,59,'Todas as tarefas válidas sem duplicar 2 cadernos já lançados');
assert.ok(plan.toAdd.some(a=>a.nome==='Pesquisa · Guerras brasileiras'&&a.turmaId==='h2a'));
assert.ok(plan.toAdd.some(a=>a.nome.startsWith('Atividade · Ciclo')&&a.turmaId==='h3b'));
assert.ok(plan.toAdd.some(a=>a.turmaId==='s2a'&&a.origem.pageReferences.includes('118')));
assert.ok(plan.toAdd.some(a=>a.turmaId==='h9c'&&a.origem.pageReferences.includes('17–18')));
assert.ok(plan.toAdd.every(a=>a.rascunho&&!a.extra&&!a.checklist));
assert.ok(plan.toAdd.every(a=>a.valorMax===10));
assert.ok(plan.toAdd.every(a=>a.id.startsWith('caderno-2026b4-')));
assert.ok(!plan.toAdd.some(a=>['h1a','h9wrong','h2wrong'].includes(a.turmaId)));
const applied=P.apply(copy);
assert.equal(applied.added,plan.toAdd.length);
assert.deepEqual(copy.scores,scores,'Nenhuma pontuação original alterada');
assert.deepEqual(copy.activities.slice(0,data.activities.length),data.activities,'Nenhuma atividade preexistente alterada');
assert.equal(P.plan(copy).toAdd.length,0,'Sem duplicações ao atualizar');
assert.equal(P.apply(copy).added,0,'Segundo carregamento não duplica');
const newCaderno=copy.activities.find(a=>a.turmaId==='h2b'&&a.rascunho);
const activities=copy.activities.filter(a=>a.turmaId==='h2b');
assert.equal(C.result(activities,copy.scores.p1).average,8,'Rascunhos sem nota não alteram média');
copy.scores.p1[newCaderno.id]=10;
assert.equal(C.result(activities,copy.scores.p1).average,9,'Nota de caderno passa a contar após correção');
console.log('Checklists das demais turmas: preservação, páginas, pesquisa, ciclo, médias e idempotência.');
