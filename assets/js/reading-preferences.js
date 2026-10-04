
(() => {
  'use strict';
  const body = document.body;
  const K = {easy: 'malu-ui-easy', aula: 'malu-ui-aula'};
  const read = k => { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
  const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} };
  const easyBtn = document.getElementById('easyBtn');
  const aulaBtn = document.getElementById('aulaBtn');
  function paint() {
    const e = read(K.easy), a = read(K.aula);
    body.classList.toggle('easy', e);
    body.classList.toggle('mode-aula', a);
    if (easyBtn) easyBtn.setAttribute('aria-pressed', String(e));
    if (aulaBtn) aulaBtn.setAttribute('aria-pressed', String(a));
  }
  if (easyBtn) easyBtn.addEventListener('click', () => { write(K.easy, !read(K.easy)); paint(); });
  if (aulaBtn) aulaBtn.addEventListener('click', () => { write(K.aula, !read(K.aula)); paint(); });
  paint();
  let reopen = [];
  window.addEventListener('beforeprint', () => {
    reopen = [...document.querySelectorAll('details.aval-d:not([open])')];
    reopen.forEach(d => { d.open = true; });
  });
  window.addEventListener('afterprint', () => { reopen.forEach(d => { d.open = false; }); reopen = []; });
})();

