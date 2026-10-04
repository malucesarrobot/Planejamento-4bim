
(() => {
  'use strict';
  const box = document.getElementById('atvPrint');
  function printAtv(ids) {
    box.textContent = '';
    ids.forEach(id => { const src = document.querySelector('#' + id + ' .atv-aluno'); if (src) box.appendChild(src.cloneNode(true)); });
    if (!box.children.length) return;
    document.body.classList.add('print-atv'); window.print();
  }
  function cleanup() { document.body.classList.remove('print-atv'); box.textContent = ''; }
  window.addEventListener('afterprint', cleanup);
  document.querySelectorAll('[data-atv-proj]').forEach(b => b.addEventListener('click', () => window.openProjectionAtv && window.openProjectionAtv(b.dataset.atvProj)));
  document.querySelectorAll('[data-atv-print]').forEach(b => b.addEventListener('click', () => printAtv([b.dataset.atvPrint])));
  const all = document.getElementById('atvPrintAll');
  if (all) all.addEventListener('click', () => {
    const tools = document.getElementById('navTools'); if (tools) tools.open = false;
    const nt = document.getElementById('navToggle'); if (nt && nt.getAttribute('aria-expanded') === 'true') nt.click();
    const sec = [...document.querySelectorAll('section.discipline[id]')].find(s => !s.hidden && s.offsetParent !== null && !s.closest('[hidden]'));
    if (!sec) return;
    printAtv([...sec.querySelectorAll('article.week-card')].map(c => c.id));
  });
})();

