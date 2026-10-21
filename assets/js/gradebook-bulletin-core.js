(() => {
  'use strict';
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/^\s*\d+\.\s*/, '').trim().replace(/\s+/g, ' ');
  const className = t => String(Number.parseInt(t.serie || t.nome)) + (t.letra || String(t.nome || '').match(/[A-Z]$/i)?.[0] || '').toUpperCase();
  const grade = value => {
    if (value === null || value === undefined || value === '' || value === '--') return null;
    const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    if (!Number.isFinite(number) || number < 0 || number > 10) throw Error('Nota fora do intervalo de 0 a 10.');
    return number;
  };
  function importBulletin(source, current) {
    if (source?.schema !== 'malu-siap-boletim-v1' || source.year !== 2026 || !Array.isArray(source.records) || !source.records.length) throw Error('Use o arquivo de boletim SIAP de 2026.');
    const next = JSON.parse(JSON.stringify(current));
    next.reportCards ??= {}; next.monitoring ??= {};
    let imported = 0, marked = 0, checks = 0, skipped = 0;
    const pending = [], seen = new Set();
    for (const record of source.records) {
      const registration = String(record.matricula || '').trim();
      if (!/^\d+$/.test(registration)) { pending.push(record.nome + ': matrícula ausente ou inválida'); continue; }
      const identity = [normalize(record.turma), normalize(record.disciplina), registration].join('|');
      if (seen.has(identity)) throw Error('Há registro duplicado de matrícula, turma e disciplina no arquivo.');
      seen.add(identity);
      const classes = Object.values(next.turmas).filter(t => normalize(className(t)) === normalize(record.turma) && normalize(t.disciplina) === normalize(record.disciplina));
      const candidates = Object.values(next.alunos).filter(a => classes.some(t => t.id === a.turmaId) && a.ativo !== false);
      let matches = candidates.filter(a => String(a.matricula || '').trim() === registration);
      if (!matches.length) matches = candidates.filter(a => !String(a.matricula || '').trim() && normalize(a.nome) === normalize(record.nome));
      if (matches.length !== 1) { pending.push(record.nome + ' · ' + record.turma + ' · ' + record.disciplina + ': vínculo não unívoco'); continue; }
      const pupil = matches[0], values = {};
      for (const [period, value] of Object.entries(record.bimestres || {})) {
        if (!['1', '2', '3'].includes(period)) throw Error('O arquivo deve conter somente bimestres anteriores.');
        const number = grade(value); if (number !== null) values[period] = number;
      }
      const final = grade(record.mediaFinal);
      if (!Object.keys(values).length && final === null) { skipped++; continue; }
      const previous = next.reportCards[pupil.id] || {};
      next.reportCards[pupil.id] = {...previous, year: 2026, bimestres: {...previous.bimestres, ...values}, fonte: 'SIAP · Resumo Final', conferidoEm: source.referenceDate};
      if (final !== null) next.reportCards[pupil.id].mediaFinalSiap = final;
      if (Object.keys(values).length) imported++;
      if (!pupil.matricula) pupil.matricula = registration;
      if (record.acompanhamento === 'aprendizagem' && final !== null && final < 4.5) {
        next.monitoring[pupil.id] = {active: true, kind: 'aprendizagem', reason: 'Média final provisória do SIAP inferior a 4,5', referenceAverage: final, referenceDate: source.referenceDate}; marked++;
      } else if (record.acompanhamento === 'conferir-lancamento') {
        next.monitoring[pupil.id] = {active: true, kind: 'conferir-lancamento', reason: 'Conferir avaliação e lançamento de Estudo Orientado', referenceAverage: final, referenceDate: source.referenceDate}; checks++;
      }
    }
    return {next, imported, marked, checks, skipped, pending};
  }
  globalThis.MaluBulletinCore = {normalize, className, grade, importBulletin};
})();
