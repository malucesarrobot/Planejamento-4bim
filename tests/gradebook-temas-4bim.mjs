import assert from 'node:assert/strict';
import '../assets/js/checklist-primeira-serie.js';
import '../assets/js/checklist-outras-turmas.js';
import '../assets/js/checklist-revisado-2026.js';
import '../assets/js/gradebook-debate.js';
import '../assets/js/gradebook-core.js';
const CL=globalThis.MaluChecklistPrimeiraSerie,OC=globalThis.MaluChecklistOutrasTurmas,D=globalThis.MaluDebateGrades,C=globalThis.MaluGradebookCore;

// Uma coluna por tema (S1+2…S6), projeto da série, QR Code em Filosofia/Sociologia e Bônus.
const sets=[...CL.sets,...OC.sets];
for(const g of sets){
  const nomes=g.entries.map(e=>e.name);
  assert.deepEqual(nomes.slice(0,5).map(n=>n.split(' · ')[0]),['S1+2','S3','S4','S5','S6'],g.serie+' '+g.subject);
  assert.ok(nomes.includes('Bônus'),'Bônus em '+g.serie+' '+g.subject);
  if(g.subject==='História')assert.ok(!nomes.includes('QR Code'));
  else assert.ok(nomes.includes('QR Code'),'QR Code em '+g.serie+' '+g.subject);
}
assert.ok(sets.find(g=>g.serie===1&&g.subject==='História').entries.some(e=>e.name==='Pesquisa · Brinquedo medieval'));
assert.ok(sets.find(g=>g.serie===2&&g.subject==='História').entries.some(e=>e.name==='Pesquisa · Guerras brasileiras'));
assert.ok(sets.find(g=>g.serie===3&&g.subject==='História').entries.some(e=>e.name==='Projeto · Ciclo de debates'));

// Reconciliação: coluna antiga "Execução · S3 · …" com nota é reconhecida (não duplica).
const turmas={
  f1a:{id:'f1a',serie:'1ª série EM',nome:'1ªA',letra:'A',unidade:'EFG',disciplina:'Filosofia'},
  s1a:{id:'s1a',serie:'1ª série EM',nome:'1ªA',letra:'A',unidade:'EFG',disciplina:'Sociologia'},
  h1a:{id:'h1a',serie:'1ª série EM',nome:'1ªA',letra:'A',unidade:'EFG',disciplina:'História'}
};
const alunos={pf:{id:'pf',turmaId:'f1a',nome:'ANA TESTE',matricula:'1'},ps:{id:'ps',turmaId:'s1a',nome:'ANA TESTE',matricula:'1'}};
const d={turmas,alunos,activities:[{id:'antiga',turmaId:'f1a',nome:'Execução · S3 · Kant: dignidade, autonomia e instrumentalização',
  data:'2026-11-06',valorMax:1,peso:1,checklist:true,registroExecucao:true,extra:false,origem:{checklistKey:'week-2'}}],scores:{pf:{antiga:1}},mediaModo:{}};
CL.apply(d);
assert.equal(d.activities.filter(a=>a.turmaId==='f1a'&&a.origem?.checklistKey==='week-2').length,1,'Tema S3 não duplicado');
const qrF=d.activities.find(a=>a.turmaId==='f1a'&&a.nome==='QR Code'),qrS=d.activities.find(a=>a.turmaId==='s1a'&&a.nome==='QR Code');
assert.ok(qrF&&qrS,'QR Code criado em Filosofia e Sociologia');
assert.ok(!d.activities.some(a=>a.turmaId==='h1a'&&a.nome==='QR Code'),'História sem QR Code');

// QR Code: nota lançada em Filosofia vale para Sociologia da mesma turma.
assert.ok(D.isDebate(d,qrF)&&D.isDebate(d,qrS));
d.scores.pf[qrF.id]=8.5;
const r=D.propagate(d,qrF.id,'pf',8.5,{});
assert.deepEqual(r.updated,['SOCIOLOGIA']);
assert.equal(d.scores.ps[qrS.id],8.5);

// Bônus: soma direto à média.
const bonus=d.activities.find(a=>a.turmaId==='f1a'&&a.nome==='Bônus');
assert.ok(bonus.extra&&!bonus.checklist&&bonus.valorMax===2);
assert.equal(C.result([{id:'n',valorMax:10,peso:1},bonus],{n:6,[bonus.id]:0.5}).average,6.5);
console.log('Temas S1+2…S6, projetos por série, QR Code unificado Filo/Socio e bônus de 0,5.');
