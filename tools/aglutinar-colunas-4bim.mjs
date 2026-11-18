/* Migração única (Malu, 18/11/2026): aglutina as colunas de notas do 4º bimestre por tema.
 *
 * Para cada turma de 1ª–3ª série (História, Filosofia, Sociologia):
 *  - colunas do mesmo tema (S1+2, S3, S4, S5, S6) viram UMA coluna de marcação "fez"; o aluno
 *    fica com "fez" se tiver feito qualquer uma das colunas juntadas;
 *  - páginas do livro, projeto/pesquisa e QR Code ficam em colunas próprias (projeto numérico
 *    juntado fica com a MAIOR nota do aluno); avaliações e bônus existentes não são tocados;
 *  - em seguida roda a reconciliação do próprio app (checklist-revisado-2026.js) pra criar o que
 *    faltar (QR Code de Filosofia/Sociologia, Bônus, temas sem coluna) e a unificação do QR Code.
 *
 * Uso: node tools/aglutinar-colunas-4bim.mjs <gradebook.json> <saida-dir>
 *   gradebook.json = firebase database:get /leciona/planejamento_gradebook/2026b4
 * Gera <saida-dir>/depois.json (estado completo), <saida-dir>/update.json (multi-path pra
 * `firebase database:update`) e imprime o relatório. Não escreve no Firebase. */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const [entrada, saida] = process.argv.slice(2);
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { console, globalThis: null, document: undefined, window: undefined };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['checklist-primeira-serie.js', 'checklist-outras-turmas.js', 'checklist-revisado-2026.js', 'gradebook-debate.js'])
  vm.runInContext(fs.readFileSync(path.join(raiz, 'assets/js', f), 'utf8'), ctx);
const CL = ctx.MaluChecklistPrimeiraSerie, OC = ctx.MaluChecklistOutrasTurmas, D = ctx.MaluDebateGrades;

const nuvem = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const antes = JSON.parse(JSON.stringify(nuvem));
const d = { ...nuvem, activities: Object.values(nuvem.activities || {}), scores: nuvem.scores || {}, turmas: nuvem.turmas || {}, alunos: nuvem.alunos || {} };

const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const STOP = new Set('E DA DE DO DAS DOS A O AS OS EM NA NO PARA COM POR UM UMA PDF EXECUCAO CADERNO REGISTRO QUEM COMO SOBRE SEMANA SEMANAS'.split(' '));
const tok = s => new Set(norm(s).split(' ').filter(w => w.length > 2 && !STOP.has(w) && !/^S\d$/.test(w)));
const LAB = ['S1+2', 'S3', 'S4', 'S5', 'S6'];
const temasDe = {};
for (const g of [...CL.sets, ...OC.sets]) temasDe[g.serie + '|' + norm(g.subject)] = g;
const temNota = (id) => Object.values(d.scores).some(s => s && s[id] != null);
const qtdNotas = (id) => Object.values(d.scores).filter(s => s && s[id] != null).length;

function classe(a, g) {
  const n = norm(a.nome), o = a.origem || {}, key = o.checklistKey || '';
  if (a.extra || n.includes('BONUS') || n.includes('PONTOS EXTRAS')) return 'BONUS';
  if (n === 'QR CODE' || o.sharedAssessment === 'qrcode-filo-socio') return 'QRCODE';
  if (a.tipo === 'Avaliação') return 'AVAL:' + a.id;
  if (key === 'pages' || /\bLIVRO\b/.test(n)) return 'LIVRO';
  if (key === 'project' || /PESQUISA|PROJETO|DEBATE/.test(n)) return 'PROJETO';
  if (/^week-\d$/.test(key)) return LAB[Number(key.slice(5)) - 1];
  if (/SEMANAS? 1 E 2/.test(n)) return 'S1+2';
  const m = n.match(/^(?:EXECUCAO )?S(\d)(?: 2)? /); if (m) return LAB[Math.max(0, Number(m[1]) - 2)];
  const t = tok(a.nome), sc = g.topics.map(x => [...tok(x)].filter(w => t.has(w)).length), best = Math.max(...sc);
  const w = Number((String(o.weekId || '').match(/semana-(\d)/) || [])[1]) || null;
  const wIdx = w ? Math.max(0, w - 2) : null;
  if (best > 0) {
    const empatados = sc.map((v, i) => v === best ? i : -1).filter(i => i >= 0);
    if (empatados.length === 1) return LAB[empatados[0]];
    if (wIdx !== null && empatados.includes(wIdx)) return LAB[wIdx];
    return LAB[empatados[0]];
  }
  return wIdx !== null ? LAB[wIdx] : '??';
}

const rel = [], remover = new Set();
for (const t of Object.values(d.turmas)) {
  const g = temasDe[Number.parseInt(t.serie || t.nome, 10) + '|' + norm(t.disciplina)];
  if (!g || norm(t.unidade) !== 'EFG') continue;
  const acts = d.activities.filter(a => a.turmaId === t.id);
  const grupos = {};
  for (const a of acts) (grupos[classe(a, g)] ??= []).push(a);
  const linhas = [];
  for (const [k, membros] of Object.entries(grupos)) {
    const idx = LAB.indexOf(k);
    if (idx >= 0 || k === 'LIVRO') {
      const key = idx >= 0 ? 'week-' + (idx + 1) : 'pages';
      const alvo = membros.find(a => a.origem?.checklistKey === key) || membros.slice().sort((a, b) => qtdNotas(b.id) - qtdNotas(a.id))[0];
      const entrada = g.entries.find(e => e.key === key);
      if (idx >= 0 || entrada) {
        Object.assign(alvo, { nome: entrada ? entrada.name : alvo.nome, checklist: true, registroExecucao: true, valorMax: 1, tipo: 'Outra', extra: false,
          origem: { ...(alvo.origem || {}), checklistKey: key, kind: 'unit', panel: 'notebook', ...(entrada ? { title: entrada.title, weekId: 's' + g.serie + '-' + norm(g.subject).toLowerCase() + '-semana-' + entrada.weeks[0] } : {}) } });
      }
      for (const [sid, s] of Object.entries(d.scores)) {
        if (!s) continue;
        const vals = membros.map(a => s[a.id]).filter(v => v != null);
        if (!vals.length) continue;
        s[alvo.id] = vals.some(v => Number(v) > 0) ? 1 : 0;
      }
      for (const a of membros) if (a !== alvo) remover.add(a.id);
      if (membros.length > 1) linhas.push(`${k}: ${membros.map(a => a.nome.slice(0, 40) + '[' + qtdNotas(a.id) + ']').join(' + ')} → "${alvo.nome}"`);
    } else if (k === 'PROJETO') {
      const ehHist = norm(t.disciplina) === 'HISTORIA';
      if (!ehHist) { // Filosofia/Sociologia: projeto agora é o QR Code; debate sem nota sai.
        for (const a of membros) {
          if (temNota(a.id)) linhas.push(`!! ${a.nome} tem notas — mantido pra conferência`);
          else { remover.add(a.id); linhas.push(`${a.nome} (sem notas) → removido; entra o QR Code`); }
        }
        continue;
      }
      const alvo = membros.find(a => a.origem?.checklistKey === 'project') || membros.slice().sort((a, b) => qtdNotas(b.id) - qtdNotas(a.id))[0];
      alvo.origem = { ...(alvo.origem || {}), checklistKey: 'project', kind: 'unit', panel: 'notebook' };
      delete alvo.origem.sharedAssessment;
      for (const s of Object.values(d.scores)) {
        if (!s) continue;
        const vals = membros.map(a => s[a.id]).filter(v => v != null).map(Number);
        if (vals.length) s[alvo.id] = Math.max(...vals);
      }
      for (const a of membros) if (a !== alvo) remover.add(a.id);
      if (membros.length > 1) linhas.push(`PROJETO: ${membros.map(a => a.nome.slice(0, 40) + '[' + qtdNotas(a.id) + ']').join(' + ')} → "${alvo.nome}" (maior nota)`);
    } else if (k === 'QRCODE') {
      const [alvo, ...resto] = membros.sort((a, b) => qtdNotas(b.id) - qtdNotas(a.id));
      alvo.nome = 'QR Code'; alvo.origem = { ...(alvo.origem || {}), checklistKey: 'project', sharedAssessment: 'qrcode-filo-socio', kind: 'unit', panel: 'notebook' };
      for (const s of Object.values(d.scores)) { if (!s) continue; const vals = membros.map(a => s[a.id]).filter(v => v != null).map(Number); if (vals.length) s[alvo.id] = Math.max(...vals); }
      for (const a of resto) remover.add(a.id);
    } else if (k === '??') {
      linhas.push(`!! sem tema identificado, mantido: ${membros.map(a => a.nome).join(', ')}`);
    }
  }
  rel.push({ turma: `${t.nome} ${t.disciplina}`, antes: acts.length, linhas });
}

d.activities = d.activities.filter(a => !remover.has(a.id));
for (const s of Object.values(d.scores)) if (s) for (const id of remover) delete s[id];
const r1 = CL.apply(d), r2 = OC.apply(d), r3 = D.backfill(d);

for (const r of rel.sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR'))) {
  const t = Object.values(d.turmas).find(x => `${x.nome} ${x.disciplina}` === r.turma);
  const depois = d.activities.filter(a => a.turmaId === t.id);
  console.log(`\n== ${r.turma}: ${r.antes} → ${depois.length} colunas`);
  for (const l of r.linhas) console.log('   ' + l);
  console.log('   colunas: ' + depois.map(a => a.nome.replace(/ · .*/, m => m.length > 26 ? m.slice(0, 26) + '…' : m)).join(' | '));
}
console.log(`\nReconciliação do app: 1ª série +${r1.added}/~${r1.updated}; 2ª–3ª +${r2.added}/~${r2.updated}; QR Code unificado: ${r3.updated} notas copiadas.`);

// Conflitos de QR Code (Filo x Socio com notas diferentes) — só relatório.
const conflitos = [];
for (const a of d.activities.filter(x => D.isDebate(d, x))) for (const p of Object.values(d.alunos)) {
  if (p.turmaId !== a.turmaId || d.scores[p.id]?.[a.id] == null) continue;
  for (const tg of D.linked(d, a.id, p.id).targets) {
    const outro = d.scores[tg.student.id]?.[tg.activity.id];
    if (outro != null && Number(outro) !== Number(d.scores[p.id][a.id])) conflitos.push(`${d.turmas[a.turmaId].nome} ${p.nome}: ${d.turmas[a.turmaId].disciplina} ${d.scores[p.id][a.id]} x ${tg.subject} ${outro}`);
  }
}
if (conflitos.length) console.log('QR Code com notas diferentes entre Filo e Socio (mantidas):\n  ' + [...new Set(conflitos)].join('\n  '));

// Saídas
fs.mkdirSync(saida, { recursive: true });
const depoisNuvem = { ...nuvem, activities: Object.fromEntries(d.activities.map(a => [a.id, a])), scores: d.scores };
fs.writeFileSync(path.join(saida, 'depois.json'), JSON.stringify(depoisNuvem));
const update = {};
for (const id of Object.keys(antes.activities || {})) if (!depoisNuvem.activities[id]) update['activities/' + id] = null;
for (const [id, a] of Object.entries(depoisNuvem.activities)) if (JSON.stringify(a) !== JSON.stringify(antes.activities?.[id])) update['activities/' + id] = a;
for (const sid of new Set([...Object.keys(antes.scores || {}), ...Object.keys(d.scores)])) {
  const A = antes.scores?.[sid] || {}, B = d.scores[sid] || {};
  for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) if (JSON.stringify(A[id]) !== JSON.stringify(B[id])) update[`scores/${sid}/${id}`] = B[id] ?? null;
}
fs.writeFileSync(path.join(saida, 'update.json'), JSON.stringify(update, null, 1));
console.log(`\nAlterações: ${Object.keys(update).filter(k => k.startsWith('activities/')).length} em atividades, ${Object.keys(update).filter(k => k.startsWith('scores/')).length} em notas.`);
