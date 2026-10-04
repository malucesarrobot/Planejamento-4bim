
(() => {
  'use strict';
  const KEY = 'malu-aulas-dadas';
  const TURMAS = {
    s9: { historia: ['9ºA', '9ºC'] },
    s1: { historia: ['1ªA', '1ªB'], filosofia: ['1ªA', '1ªB'], sociologia: ['1ªA', '1ªB'] },
    s2: { historia: ['2ªA', '2ªB'], filosofia: ['2ªA', '2ªB'], sociologia: ['2ªA', '2ªB'] },
    s3: { historia: ['3ªA', '3ªB', '3ªC'], filosofia: ['3ªA', '3ªB', '3ªC'], sociologia: ['3ªA', '3ªB', '3ªC'] }
  };
  const DISC = { historia: 'História', filosofia: 'Filosofia', sociologia: 'Sociologia' };
  const SER = { s9: '9º ano', s1: '1ª série', s2: '2ª série', s3: '3ª série' };
  const view = document.getElementById('aulasView');
  const body = document.getElementById('aulasBody');
  const resumo = document.getElementById('aulasResumo');
  const btn = document.getElementById('aulasBtn');
  const closeBtn = document.getElementById('aulasClose');
  const toggleAll = document.getElementById('aulasToggleAll');
  const clearBtn = document.getElementById('aulasClear');
  const statusEl = document.getElementById('status');
  let data = {}, lastFocus = null, inerted = [];

  function load() { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); data = (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; } catch (e) { data = {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
  function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function br(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] : ''; }
  const keyOf = (wid, t) => wid + '|' + t;

  function groups() {
    const out = [];
    document.querySelectorAll('section.discipline[id]').forEach(sec => {
      const m = sec.id.match(/^(s\d)-(\w+)$/); if (!m) return;
      const [, sid, disc] = m; const turmas = (TURMAS[sid] || {})[disc] || [];
      const weeks = [...sec.querySelectorAll('article.week-card')].map(c => {
        const tr = document.querySelector('a.track-item[href="#' + c.id + '"] .track-theme');
        let title = tr ? tr.textContent.split('—').slice(1).join('—').trim() : '';
        const n = (c.id.match(/semana-(\d+)/) || [0, 0])[1];
        return { id: c.id, n, title };
      });
      out.push({ sid, disc, turmas, weeks });
    });
    return out;
  }
  function counts(g) { let done = 0; g.weeks.forEach(w => g.turmas.forEach(t => { if (data[keyOf(w.id, t)]) done++; })); return { done, total: g.weeks.length * g.turmas.length }; }
  function totals() { let d = 0, t = 0; groups().forEach(g => { const c = counts(g); d += c.done; t += c.total; }); return { d, t }; }
  function paintBtn() { const c = totals(); if (btn) btn.textContent = 'Progresso das turmas (' + c.d + '/' + c.t + ')'; return c; }
  function paintResumo() { const c = paintBtn(); if (resumo) resumo.textContent = c.d + ' de ' + c.t + ' aulas dadas (60 semanas × turmas)'; }

  function activeKey() {
    const s = document.querySelector('.turma-choice.is-active'), d = document.querySelector('.disciplina-choice.is-active');
    return s && d ? s.dataset.series + '-' + d.dataset.discipline : '';
  }
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function render() {
    body.textContent = '';
    const act = activeKey();
    groups().forEach(g => {
      const det = el('details', 'aulas-grupo ' + g.disc); det.id = 'ag-' + g.sid + '-' + g.disc;
      if (g.sid + '-' + g.disc === act) det.open = true;
      const sm = el('summary'); sm.appendChild(el('span', null, SER[g.sid] + ' · ' + DISC[g.disc]));
      const cnt = el('span', 'ag-count'); sm.appendChild(cnt); det.appendChild(sm);
      const refresh = () => { const c = counts(g); cnt.textContent = c.done + ' de ' + c.total + ' aulas · turmas ' + g.turmas.join(', '); };
      refresh();
      g.weeks.forEach(w => {
        const row = el('div', 'aulas-semana');
        const t = el('div', 'as-t'); const b = el('b', null, 'Semana ' + w.n); t.appendChild(b); t.appendChild(document.createTextNode(w.title ? ' — ' + w.title : '')); row.appendChild(t);
        const box = el('div', 'as-turmas'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Turmas que já tiveram a semana ' + w.n);
        g.turmas.forEach(tn => {
          const lab = el('label', 'as-turma'); const inp = document.createElement('input'); inp.type = 'checkbox';
          inp.setAttribute('aria-label', SER[g.sid] + ' ' + DISC[g.disc] + ', semana ' + w.n + ', turma ' + tn);
          const k = keyOf(w.id, tn); inp.checked = !!data[k];
          const nm = el('span', null, tn); const dt = el('small', null, inp.checked ? br(data[k]) : '');
          lab.classList.toggle('on', inp.checked);
          inp.addEventListener('change', () => {
            if (inp.checked) data[k] = today(); else delete data[k];
            lab.classList.toggle('on', inp.checked); dt.textContent = inp.checked ? br(data[k]) : '';
            if (!save()) setStatus('Não foi possível salvar as aulas dadas neste navegador.');
            document.dispatchEvent(new CustomEvent('malu:aula', { detail: { key: k, date: inp.checked ? data[k] : null } }));
            refresh(); paintResumo();
          });
          lab.appendChild(inp); lab.appendChild(nm); lab.appendChild(dt); box.appendChild(lab);
        });
        row.appendChild(box); det.appendChild(row);
      });
      body.appendChild(det);
    });
    paintResumo();
    if (toggleAll) toggleAll.textContent = 'Abrir todas';
  }
  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function setInert(on) {
    if (on) {
      inerted = [...document.body.children].filter(n => n !== view && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(n.tagName) && n.id !== 'saveToast' && !n.inert);
      inerted.forEach(n => { n.inert = true; });
    } else { inerted.forEach(n => { n.inert = false; }); inerted = []; }
  }
  function openView() {
    const tools = document.getElementById('navTools'); if (tools) tools.open = false;
    const nt = document.getElementById('navToggle'); if (nt && nt.getAttribute('aria-expanded') === 'true') nt.click();
    load(); render(); lastFocus = document.activeElement;
    setInert(true); view.hidden = false; document.body.classList.add('is-aulas');
    view.scrollTop = 0; closeBtn.focus();
    const cur = body.querySelector('details[open]'); if (cur) window.setTimeout(() => cur.scrollIntoView({ block: 'start' }), 30);
  }
  function closeView() {
    view.hidden = true; document.body.classList.remove('is-aulas'); setInert(false); paintBtn();
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus(); else if (btn) btn.focus();
  }
  btn.addEventListener('click', openView);
  closeBtn.addEventListener('click', closeView);
  toggleAll.addEventListener('click', () => {
    const ds = [...body.querySelectorAll('details')]; const open = ds.some(d => !d.open);
    ds.forEach(d => { d.open = open; }); toggleAll.textContent = open ? 'Recolher todas' : 'Abrir todas';
  });
  clearBtn.addEventListener('click', () => {
    const n = Object.keys(data).length; if (!n) return;
    if (window.confirm('Desmarcar as ' + n + ' aulas dadas? Isso não apaga suas anotações.')) { const old = Object.keys(data); data = {}; save(); render(); old.forEach(k => document.dispatchEvent(new CustomEvent('malu:aula', { detail: { key: k, date: null } }))); }
  });
  view.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeView(); return; }
    if (e.key !== 'Tab') return;
    const f = [...view.querySelectorAll('button:not(:disabled), input, summary')].filter(n => n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // backup: inclui as aulas dadas ao exportar e restaura ao importar
  window.exportNotes = function exportNotes() {
    const notes = {};
    document.querySelectorAll('textarea[data-save]').forEach(t => { notes[t.dataset.save] = t.value; });
    load();
    const payload = { schemaVersion: 3, title: 'Planejamento Unificado — 4º Bimestre — Ciências Humanas', exportedAt: new Date().toISOString(), fieldCount: Object.keys(notes).length, notes, aulasDadas: data };
    const text = JSON.stringify(payload, null, 2);
    const filename = 'backup_planejamento_4bimestre_' + new Date().toISOString().slice(0, 10) + '.json';
    saveFile(filename, text).then(res => {
      if (res === 'ok') setStatus('Backup exportado (anotações e ' + Object.keys(data).length + ' aulas dadas).');
      else if (res === 'declined') setStatus('Backup cancelado.');
      else setStatus('Não foi possível exportar o backup neste navegador.');
    });
  };
  async function saveFile(filename, text) {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const dl = await window.claude.use('downloads');
        if (dl && typeof dl.save === 'function') {
          try { await dl.save({ filename, data: text }); return 'ok'; }
          catch (err) { if (err && err.code === 'declined') return 'declined'; /* outros erros: tenta o método comum */ }
        }
      }
    } catch (e) { /* segue para o método comum */ }
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return 'ok';
    } catch (e) { return 'erro'; }
  }
  const imp = document.getElementById('importFile');
  if (imp) imp.addEventListener('change', function () {
    const f = this.files && this.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        if (p && p.aulasDadas && typeof p.aulasDadas === 'object' && !Array.isArray(p.aulasDadas)) {
          const clean = {}; Object.keys(p.aulasDadas).forEach(k => { if (k.includes('|') && /^\d{4}-\d{2}-\d{2}$/.test(p.aulasDadas[k])) clean[k] = p.aulasDadas[k]; });
          data = clean; save(); paintBtn(); if (!view.hidden) render(); document.dispatchEvent(new CustomEvent('malu:aulas-updated')); Object.keys(clean).forEach(k => document.dispatchEvent(new CustomEvent('malu:aula', { detail: { key: k, date: clean[k] } })));
        }
      } catch (e) { /* a importação das anotações trata o erro */ }
    };
    r.readAsText(f);
  }, { capture: true });

  window.__maluAulas = { get: () => data, set: (o) => { const previous=data; data=o; if (!save()) { data=previous; return false; } paintBtn(); if (!view.hidden) render(); document.dispatchEvent(new CustomEvent('malu:aulas-updated')); return true; } };
  load(); paintBtn();
  if (window.__maluStorageVolatile) {
    const m = document.querySelector('main');
    if (m) { const n = document.createElement('div'); n.setAttribute('role', 'alert'); n.style.cssText = 'margin:0 0 12px;padding:10px 14px;border:1px solid #e0b84d;background:#fff7dc;border-radius:12px;font-size:.95rem'; n.textContent = 'Este navegador bloqueou o armazenamento: anotações e aulas dadas só valem enquanto a página estiver aberta. Use Ferramentas → Exportar anotações para guardar.'; m.insertBefore(n, m.firstChild); }
  }
})();

