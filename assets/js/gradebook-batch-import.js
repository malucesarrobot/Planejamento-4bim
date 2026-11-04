(() => {
  'use strict';
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  // A EFG mantém 2º AB como agrupamento administrativo das turmas A e B.
  // A importação do Bloco II - 2B só pode usar essa turma se TODOS os 28 nomes
  // do arquivo estiverem vinculados univocamente ao diário da disciplina.
  const classLetter = turma => normalize(turma.letra || String(turma.nome || '').match(/[A-Z]+$/i)?.[0] || '');
  const isTargetGroup = turma => {
    const letter=classLetter(turma);
    const unit=normalize(turma.unidade);
    const name=normalize(turma.nome);
    return Number.parseInt(turma.serie || turma.nome) === 2 &&
      (letter === 'B' || letter === 'AB' || /2\s*[º°ª]?\s*AB\b/.test(name)) &&
      (unit === 'EFG' || unit.includes('ESCOLA DO FUTURO') || /\bEFG\b/.test(unit)) &&
      turma.ativo !== false;
  };
  const isEnem = source => source?.schema === 'malu-simulado-enem-2b-v1';
  const activityMatches = (title, source) => isEnem(source)
    ? /\bSIMULADO\b.*\bENEM\b|\bENEM\b.*\bSIMULADO\b/.test(normalize(title))
    : /\bBLOCO\s*(?:II|2)\b/.test(normalize(title));
  function plan(source, data) {
    const enem=isEnem(source);
    const validRecords=Array.isArray(source?.records) && (enem
      ? source.records.length > 0 && source.records.length <= 30 &&
        Array.isArray(source.pendentesConferencia) &&
        source.records.length + source.pendentesConferencia.length === 30 &&
        Array.isArray(source.turmaAlunosConfirmados) &&
        source.turmaAlunosConfirmados.length === 31
      : source.records.length === 28);
    if (!['malu-avaliacao-bloco-ii-v1','malu-simulado-enem-2b-v1'].includes(source?.schema) ||
        source.year !== 2026 || source.bimestre !== 4 || source.serie !== 2 ||
        normalize(source.turma) !== 'B' || !validRecords ||
        source.valorMax !== (enem ? 6 : 10)) {
      throw Error('Arquivo de notas incompatível. Utilize o lote validado da 2ª série B (Bloco II ou Simulado ENEM de 2026).');
    }
    if (!data?.turmas || !data?.alunos || !Array.isArray(data.activities) || !data?.scores) {
      throw Error('Os dados das turmas ainda não foram carregados no Planejamento.');
    }
    const issues=[], courses={}, entries=[], seen=new Set();
    for (const discipline of ['História','Geografia']) {
      const candidates = Object.values(data.turmas).filter(t =>
        isTargetGroup(t) && normalize(t.disciplina) === normalize(discipline)
      );
      // Escolhe o diário exclusivamente pela correspondência integral dos
      // estudantes. Isso impede misturar a turma B com a A no agrupamento AB.
      const rosters=candidates.map(t => ({
        turma:t,
        pupils:Object.values(data.alunos).filter(a => a.turmaId === t.id && a.ativo !== false)
      }));
      const complete=rosters.filter(({pupils}) => source.records.every(r =>
        pupils.filter(a => normalize(a.nome) === normalize(r.nome)).length === 1
      ));
      if (complete.length === 0 && !candidates.length && discipline === 'Geografia' && courses['História']) {
        // Geografia pode não existir no Leciona. Criá-la somente quando
        // os estudantes do arquivo estão vinculados ao diário único de História.
        const history=courses['História'];
        courses[discipline]={turmaId:null,activityId:null,sourceTurmaId:history.turmaId,
          pupils:history.pupils,createCourse:true};
        continue;
      }
      if (complete.length !== 1) {
        const detail=rosters.map(({turma,pupils}) => {
          const count=source.records.filter(r => pupils.some(a => normalize(a.nome) === normalize(r.nome))).length;
          return turma.nome + ': ' + count + '/' + source.records.length + ' nomes encontrados';
        }).join('; ');
        issues.push(discipline + ': não foi identificado um único diário da 2ª B/2º AB na EFG contendo os ' + source.records.length + ' estudantes confirmados. ' +
          (detail || 'Nenhum diário da disciplina foi localizado. Confira se a turma e os alunos foram importados do Leciona.'));
        continue;
      }
      const {turma,pupils}=complete[0];
      const possibles = data.activities.filter(a => a.turmaId === turma.id && activityMatches(a.nome,source));
      if (possibles.length > 1) {
        issues.push(discipline + ': há mais de uma atividade correspondente ao arquivo; escolha/corrija antes de importar.');
        continue;
      }
      const activity=possibles[0] || null;
      if (activity && (activity.checklist || activity.extra || Number(activity.valorMax) !== source.valorMax)) {
        issues.push(discipline + ': a atividade existente tem tipo ou valor máximo incompatível (' + source.valorMax + ' pontos).');
        continue;
      }
      courses[discipline]={turmaId:turma.id,activityId:activity?.id || null,pupils};
    }
    for (const record of source.records) {
      const normalized=normalize(record?.nome);
      if (!normalized || seen.has(normalized)) {
        issues.push('Nome ausente ou duplicado no arquivo: ' + String(record?.nome || '(sem nome)'));
        continue;
      }
      seen.add(normalized);
      for (const discipline of ['História','Geografia']) {
        const grade=record?.notas?.[discipline],course=courses[discipline];
        if (typeof grade !== 'number' || !Number.isFinite(grade) || grade < 0 || grade > source.valorMax ||
            Math.round(grade * 100) !== grade * 100 && Math.abs(Math.round(grade * 100) - grade * 100) > 1e-8) {
          issues.push(record.nome + ': nota inválida em ' + discipline);
          continue;
        }
        if (!course) continue;
        const match=course.pupils.filter(a=>normalize(a.nome)===normalized);
        if (match.length !== 1) {
          issues.push(record.nome + ': vínculo ' + discipline + ' não encontrado de forma única (' + match.length + ').');
          continue;
        }
        const pupil=match[0];
        const existing=course.activityId ? data.scores[pupil.id]?.[course.activityId] : undefined;
        if (existing !== null && existing !== undefined && Math.abs(Number(existing)-grade)>0.001) {
          issues.push(record.nome + ': já existe nota diferente em ' + discipline + ', não substituída.');
          continue;
        }
        entries.push({discipline,studentId:pupil.id,grade,alreadySaved:existing !== undefined && existing !== null});
      }
    }
    if (entries.length !== source.records.length*2 && !issues.length) issues.push('O total de notas não corresponde aos estudantes confirmados em duas disciplinas.');
    return {issues,courses,entries,matched:source.records.length,alreadySaved:entries.filter(e=>e.alreadySaved).length,
      toSave:entries.filter(e=>!e.alreadySaved).length, pending:Array.isArray(source.pendentes)?source.pendentes:[],
      pendingReview:Array.isArray(source.pendentesConferencia)?source.pendentesConferencia:[],
      activityName:source.atividade || (enem?'Simulado ENEM':'Avaliação Bloco II')};
  }
  function apply(source, data) {
    const checked=plan(source,data);
    if (checked.issues.length) throw Error(checked.issues.join('\n'));
    const activityId={};
    const cloneMap={};
    const geography=checked.courses['Geografia'];
    if (geography.createCourse) {
      const oldClass=data.turmas[geography.sourceTurmaId],newClassId=crypto.randomUUID();
      // Não copiar alunos de outra turma em um agrupamento administrativo.
      const verified=Array.isArray(source.turmaAlunosConfirmados)
        ? source.turmaAlunosConfirmados
        : [...source.records.map(r=>r.nome),...(source.pendentes||[]).map(p=>typeof p==='string'?p:p?.nome)];
      const wanted=new Set(verified.map(normalize));
      const students=geography.pupils.filter(p=>wanted.has(normalize(p.nome)));
      if(students.length !== wanted.size)throw Error('O cadastro da nova turma de Geografia não coincide com a lista conferida; nada será alterado.');
      data.turmas[newClassId]={...oldClass,id:newClassId,nome:'2ªB',letra:'B',
        unidade:oldClass.unidade,disciplina:'Geografia',ativo:true};
      for (const pupil of students) {
        const newId=crypto.randomUUID();
        data.alunos[newId]={...pupil,id:newId,turmaId:newClassId};
        cloneMap[pupil.id]=newId;
      }
      geography.turmaId=newClassId;
    }
    for (const discipline of ['História','Geografia']) {
      const target=checked.courses[discipline];
      let id=target.activityId;
      if (!id) {
        id=crypto.randomUUID();
        data.activities.push({id,turmaId:target.turmaId,bimestre:4,nome:source.atividade || 'Avaliação Bloco II',
          tipo:'Avaliação',data:source.data || '2026-11-04',valorMax:source.valorMax,peso:1,checklist:false,extra:false,origem:null});
      }
      activityId[discipline]=id;
    }
    for (const entry of checked.entries) {
      const id=entry.discipline==='Geografia' && geography.createCourse
        ?cloneMap[entry.studentId] : entry.studentId;
      if (!id)throw Error('Não foi possível vincular o estudante à Geografia.');
      data.scores[id] ??= {};
      if (!entry.alreadySaved) data.scores[id][activityId[entry.discipline]]=entry.grade;
    }
    return checked;
  }
  globalThis.MaluBlocoImport={plan,apply};
})();
