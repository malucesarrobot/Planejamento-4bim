import assert from 'node:assert/strict';
import '../assets/js/checklist-primeira-serie.js';
import '../assets/js/gradebook-core.js';

const P=globalThis.MaluChecklistPrimeiraSerie;
const C=globalThis.MaluGradebookCore;
const original={
 version:1,year:2026,bimestre:4,
 turmas:{
   h:{id:'h',serie:'1ª série EM',nome:'1ªA',unidade:'EFG',disciplina:'História'},
   f:{id:'f',serie:'1ª série EM',nome:'1ªB',unidade:'EFG',disciplina:'Filosofia'},
   s:{id:'s',serie:'1ª série EM',nome:'1ªA',unidade:'EFG',disciplina:'Sociologia'},
   other:{id:'other',serie:'2ª série EM',nome:'2ªA',unidade:'EFG',disciplina:'História'},
   ce:{id:'ce',serie:'1ª série EM',nome:'1ªA',unidade:'CEPI Marajó',disciplina:'História'}
 },
 activities:[
 {id:'old',turmaId:'h',nome:'Avaliação já lançada',data:'2026-10-25',valorMax:10,peso:1,checklist:false,extra:false},
 {id:'existing-week3',turmaId:'h',nome:'Caderno · Religiões, culturas e Mediterrâneo medieval',data:'2026-10-31',
  valorMax:10,peso:1,checklist:false,extra:false}
 ],
 alunos:{a:{id:'a',turmaId:'h',nome:'ESTUDANTE TESTE'}},
 scores:{a:{old:8,'existing-week3':6}},
 attendance:{},mediaModo:{}
};
const base=structuredClone(original);
const plan=P.plan(base);
assert.equal(plan.classes,3);
assert.equal(plan.existing,1);
assert.equal(plan.toAdd.length,15,'5 História novas, 5 Filosofia, 5 Sociologia');
const saved=structuredClone(base.scores);
const out=P.apply(base);
assert.equal(out.added,15);
assert.deepEqual(base.scores,saved,'Preservar notas anteriores');
assert.equal(base.activities.find(x=>x.id==='existing-week3').data,'2026-10-31','Preservar atividade preexistente');
assert.ok(base.activities.some(x=>x.nome==='Pesquisa · Brinquedos autômatos'));
assert.ok(base.activities.some(x=>x.origem?.pageReferences?.includes('118')));
assert.ok(base.activities.some(x=>x.origem?.pageReferences?.includes('134')));
assert.ok(!base.activities.some(x=>x.turmaId==='other' && x.rascunho));
assert.ok(!base.activities.some(x=>x.turmaId==='ce' && x.rascunho));
assert.equal(P.plan(base).toAdd.length,0,'Importação idempotente');
assert.equal(P.apply(base).added,0,'Não duplicar ao reconectar');
const newActivity=base.activities.find(x=>x.turmaId==='h'&&x.rascunho);
const acts=base.activities.filter(x=>x.turmaId==='h');
assert.equal(C.result(acts,base.scores.a,'ponderada').average,7,'Média sem alterações enquanto a tarefa não é corrigida');
base.scores.a[newActivity.id]=10;
assert.equal(C.result(acts,base.scores.a,'ponderada').average,8,'A nota corrigida passa a compor a média');
console.log('1ª série: 15 atividades novas, 1 preservada, páginas, idempotência, notas e médias conferidas.');
