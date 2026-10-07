(() => {
'use strict';
function parseCSV(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else { aspas = false; } }
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}
function csvParaObjetos(texto) {
  const linhas = parseCSV(texto).filter((l) => l.some((c) => c !== ''));
  if (!linhas.length) return [];
  const cabecalho = linhas[0].map((h) => h.trim());
  return linhas.slice(1).map((l) => {
    const o = {};
    cabecalho.forEach((h, i) => { if (h) o[h] = (l[i] || '').trim(); });
    return o;
  });
}

function normNome(s) {
  return (s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}
const STOPWORDS_NOME = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E']);
function tokensRelevantes(s) { return normNome(s).split(' ').filter((t) => t && !STOPWORDS_NOME.has(t)); }

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = []; for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function tokensBatem(a, b) {
  if (a === b) return true;
  const limite = (a.length >= 7 || b.length >= 7) ? 2 : (a.length >= 4 && b.length >= 4 ? 1 : 0);
  if (!limite) return false;
  return Math.abs(a.length - b.length) <= limite && levenshtein(a, b) <= limite;
}
/* Casa um nome da planilha (pode vir incompleto, com apelido, ou com
   1-2 letras trocadas) contra o roster de UMA turma-disciplina do
   Leciona. Só retorna 'ok' quando exatamente um aluno cobre TODOS os
   tokens relevantes do nome buscado — ambíguo ou sem match viram
   pendência em vez de chute. */
function encontrarAluno(nomeAlvo, roster) {
  const alvoTokens = tokensRelevantes(nomeAlvo);
  if (!alvoTokens.length) return { status: 'sem_nome' };
  const nAlvo = normNome(nomeAlvo);
  const exatos = roster.filter((r) => normNome(r.nome) === nAlvo);
  if (exatos.length === 1) return { status: 'ok', aid: exatos[0].aid };
  if (exatos.length > 1) return { status: 'ambiguo' };
  const cobrem = roster.filter((r) => alvoTokens.every((t) => r.tokens.some((rt) => tokensBatem(t, rt))));
  if (cobrem.length === 1) return { status: 'ok', aid: cobrem[0].aid };
  if (cobrem.length > 1) return { status: 'ambiguo', candidatos: cobrem.map((c) => ({ aid: c.aid, nome: c.nome })) };
  return { status: 'nao_encontrado' };
}


function plan(text,data,turmaId,date,schedule){
 if(date<'2026-10-08'||date>'2026-12-18')throw Error('Escolha uma data do 4º bimestre, de 08/10 a 18/12.');
 const turma=data.turmas[turmaId];if(!turma||turma.unidade!=='EFG')throw Error('A planilha do Arlan cobre apenas turmas da EFG.');
 const rows=csvParaObjetos(text);if(!rows.length||!('Status' in rows[0])||!('Nome_Aluno' in rows[0])||!('Turma' in rows[0])||!('data' in rows[0]))throw Error('Use o CSV da aba Frequencia_Diaria da planilha do Arlan.');
 const code=String(Number.parseInt(turma.serie))+turma.letra;
 const roster=Object.values(data.alunos).filter(a=>a.turmaId===turmaId&&a.ativo!==false).map(a=>({aid:a.id,nome:a.nome,tokens:tokensRelevantes(a.nome)}));
 if(!roster.length)throw Error('Importe os alunos da turma primeiro.');
 const wd=new Date(date+'T12:00:00').getDay();const hasSchedule=(schedule||[]).some(h=>h.dia===wd&&h.serie===Number.parseInt(turma.serie)&&h.letra===turma.letra&&h.disc===turma.disciplina&&h.unidade===turma.unidade);
 if(!hasSchedule&&!turma.grade?.[wd])throw Error('A turma não tem aula nesta data pelo horário cadastrado.');
 const next=JSON.parse(JSON.stringify(data)),pending=[],matched=new Set();let skipped=0;
 for(const r of rows){const parts=r.data.split('/');const iso=parts.length===3?parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0'):r.data;
 if(iso!==date||r.Status!=='Falta'||r.Turma.replace(/[^0-9A-Za-z]/g,'').toUpperCase()!==code.toUpperCase())continue;
 const hit=encontrarAluno(r.Nome_Aluno,roster);if(hit.status!=='ok'){pending.push(r.Nome_Aluno+' — '+hit.status);continue;}
 const key=turmaId+'|'+date+'|dia',logKey=turmaId+'|'+date+'|'+hit.aid;
 if(next.importLog?.[logKey]||next.attendance[key]?.[hit.aid]!=null||Object.entries(next.attendance).some(([k,v])=>k.startsWith(turmaId+'|'+date+'|')&&v[hit.aid]!=null)){skipped++;continue;}
 next.attendance[key]??={};next.attendance[key][hit.aid]='F';next.importLog??={};next.importLog[logKey]=true;matched.add(hit.aid);
 }
 return {next,count:matched.size,pending,skipped};
}
window.MaluArlan={plan,url:'https://docs.google.com/spreadsheets/d/14OgFpDNC8NDosCX6uoVSxqPdyMi_mRKx/gviz/tq?tqx=out:csv&sheet=Frequencia_Diaria'};
})();
