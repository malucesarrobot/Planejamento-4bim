
(() => {
  'use strict';
  const view = document.getElementById('projectionView');
  const page = document.getElementById('projectionPage');
  const scroll = document.getElementById('projectionScroll');
  const title = document.getElementById('projectionTitle');
  const context = document.getElementById('projectionContext');
  const prevBtn = document.getElementById('projectionPrev');
  const nextBtn = document.getElementById('projectionNext');
  const main = document.querySelector('main');
  const navigation = document.querySelector('.toolbar');
  const hero = document.querySelector('.hero');
  let currentId = null;
  let scale = 1;
  let returnFocus = null;
  let printMode = null;

  function getCards(card) {
    return card ? [...card.closest('section.discipline').querySelectorAll('article.week-card')].filter(c => !c.classList.contains('hidden')) : [];
  }
  function adjustNeighbors(card) {
    const cards = getCards(card), ix = cards.indexOf(card);
    prevBtn.disabled = ix <= 0;
    nextBtn.disabled = ix < 0 || ix >= cards.length - 1;
  }
  
  const REFS_KEY = 'malu-ui-proj-refs';
  const refsBtn = document.getElementById('projectionRefs');
  function refsOn() { try { const v=localStorage.getItem(REFS_KEY); return v===null ? true : v==='1'; } catch (e) { return true; } }
  function paintRefs() { const on = refsOn(); view.classList.toggle('refs-off', !on); if (refsBtn) refsBtn.setAttribute('aria-pressed', String(on)); }
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function readCodes(card) {
    const out = { bncc: [], matriz: [] };
    card.querySelectorAll('.plan-grid > section.meta-curric').forEach(sec => {
      const h = (sec.querySelector('h4') ? sec.querySelector('h4').textContent : '').trim();
      const p = sec.querySelector('.code');
      const raw = p ? p.textContent : sec.textContent.replace(h, '');
      const t = raw.replace(/\s+/g, ' ').trim();
      if (!t || t === '—') return;
      if (/BNCC/i.test(h)) {
        t.split(';').map(s => s.trim()).filter(s => /^(EM13|EF\d{2})/.test(s)).forEach(c => out.bncc.push(c));
      } else if (/Matriz/i.test(h)) {
        const ix = t.indexOf(' — ');
        const left = ix >= 0 ? t.slice(0, ix) : t;
        const codes = left.match(/GO-[A-Z0-9-]+|EF\d{2}HI\d+/g) || [];
        codes.forEach(c => { if (!out.matriz.includes(c)) out.matriz.push(c); });
      }
    });
    return out;
  }
  function qrFor(url) {
    const tpl = [...document.querySelectorAll('#qrStore template')].find(t => t.dataset.u === url);
    if (!tpl) return null;
    const box = el('div', 'pr-qr'); box.setAttribute('role', 'img'); box.setAttribute('aria-label', 'QR code do link ao lado');
    box.appendChild(tpl.content.cloneNode(true));
    return box;
  }
  let _mt = null;
  function matrizTextos() { if (_mt) return _mt; try { _mt = JSON.parse(document.getElementById('matrizTextos').textContent); } catch (e) { _mt = {}; } return _mt; }
  function buildRefs(card) {
    let fontes = [];
    try { fontes = JSON.parse(card.dataset.fontes || '[]'); } catch (e) { fontes = []; }
    if (!fontes.length) return null;
    const wrap = el('section', 'projection-refs');
    wrap.setAttribute('aria-label', 'Fontes desta aula');
    if (fontes.length) {
      const b = el('div', 'pr-fontes'); b.appendChild(el('h3', null, fontes.length > 1 ? 'Fontes e para saber mais' : 'Fonte e para saber mais'));
      const list = el('ul', 'pr-list');
      fontes.forEach(f => {
        const li = el('li', 'pr-fonte');
        const q = qrFor(f.u); if (q) li.appendChild(q);
        const txt = el('div');
        const a = el('a', null, f.t); a.href = f.u; a.target = '_blank'; a.rel = 'noopener';
        txt.appendChild(a);
        let host = ''; try { host = new URL(f.u).hostname.replace(/^www2?\./, ''); } catch (e) {}
        if (host) txt.appendChild(el('span', 'pr-host', host));
        li.appendChild(txt); list.appendChild(li);
      });
      b.appendChild(list); wrap.appendChild(b);
    }
    return wrap;
  }
  let mode = 'caderno';
  const positions = new Map();
  function changeMaterial(next) {
    if (!currentId) return;
    positions.set(currentId+'|'+mode, scroll.scrollTop);
    mode=next; renderCard(currentId);
    scroll.scrollTop=positions.get(currentId+'|'+mode) || 0;
  }
  document.querySelectorAll('[data-lesson-material]').forEach(b=>b.addEventListener('click',()=>changeMaterial(b.dataset.lessonMaterial)));
  const weekSelect=el('select');weekSelect.id='projectionWeek';weekSelect.setAttribute('aria-label','Semana da aula');
  const weekNav=el('nav','lesson-week-nav');weekNav.setAttribute('aria-label','Escolher semana da aula');
  prevBtn.textContent='←';nextBtn.textContent='→';prevBtn.setAttribute('aria-label','Semana anterior');nextBtn.setAttribute('aria-label','Próxima semana');
  weekNav.append(prevBtn,weekSelect,nextBtn);view.querySelector('.projection-toolbar').prepend(weekNav);
  weekSelect.addEventListener('change',()=>renderCard(weekSelect.value));
  function studentMaterial(card, kind) {
    const wrap=el('section','lesson-reading');
    wrap.appendChild(el('h2',null,kind==='pergunta' ? 'Problematização' : 'Conteúdo da aula'));
    const headings=kind==='pergunta' ? /problematiza|pergunta/i : /conteúdo/i;
    const sections=kind==='pergunta' ? [...card.querySelectorAll('.gancho .gq')] : [...card.querySelectorAll('.plan-grid > section')].filter(n=>headings.test(n.querySelector('h4')?.textContent || ''));
    sections.forEach(n=>{const copy=n.cloneNode(true);copy.querySelector('h4')?.remove();wrap.appendChild(copy);});
    if(!sections.length)wrap.appendChild(el('p',null,'Este planejamento não possui um texto separado para este material. Consulte o Quadro.'));
    return wrap;
  }
  function paintMode() {
    const b = document.getElementById('projectionMode'); if (!b) return;
    b.setAttribute('aria-pressed', String(mode === 'atividade'));
    b.textContent = mode === 'atividade' ? 'Ver quadro' : 'Atividade';
    document.querySelectorAll('[data-lesson-material]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.lessonMaterial===mode)));
    const card=document.getElementById(currentId),cards=getCards(card);
    weekSelect.replaceChildren(...cards.map((c,i)=>{const opt=el('option',null,'S'+(i+1)+' / '+cards.length);opt.setAttribute('aria-label','Semana '+(i+1)+' de '+cards.length);opt.value=c.id;return opt;}));
    weekSelect.value=currentId;
    view.classList.toggle('lesson-sources',mode==='fontes');
  }
  function toggleMode() { changeMaterial(mode === 'atividade' ? 'caderno' : 'atividade'); }
  function renderCard(id) {
    const card = document.getElementById(id);
    const notebook = card && card.querySelector('.wide.notebook');
    if (!card || !notebook) return false;
    const subject = card.closest('section.discipline');
    const series = card.closest('section.series');
    const atvSrc = mode === 'atividade' ? card.querySelector('.atv-aluno') : null;
    const clone = mode==='exames' ? (window.MaluStudy.exams(card) || el('section','lesson-reading','Não há questão vinculada a esta aula na seleção pesquisada de 2016–2025. Isso não significa que o conteúdo nunca tenha sido cobrado.')) : mode==='esquema' ? window.MaluStudy.board(card) : ['pergunta','conteudo'].includes(mode) ? studentMaterial(card,mode) : mode==='fontes' ? (buildRefs(card) || el('section','lesson-reading','Nenhuma fonte cadastrada para esta aula.')) : (atvSrc || notebook).cloneNode(true);
    page.className = `projection-page ${[...subject.classList].find(c => ['historia','filosofia','sociologia'].includes(c)) || ''}`;
    page.style.setProperty('--projection-scale',String(scale));
    page.replaceChildren(clone);
    { if (mode==='caderno' || mode==='atividade') {const refs = buildRefs(card); if (refs) page.appendChild(refs);} }
    currentId=id; paintMode();
    document.dispatchEvent(new CustomEvent('malu:projection', {detail:{id,mode}}));
    title.textContent=card.querySelector('.week-head h3')?.textContent.trim() || 'Registro da semana';
    context.textContent=`${series?.querySelector('.series-head h1')?.textContent.trim() || ''} · ${subject?.querySelector('.discipline-title h2')?.textContent.trim() || ''} · ${card.querySelector('.week-head span')?.textContent.trim() || ''}`;
    adjustNeighbors(card);
    scroll.scrollTop=0;
    return true;
  }
  window.openProjectionAtv = function openProjectionAtv(id) { window.__atvFlag = true; mode = 'atividade'; window.openProjection(id); };
  window.openProjection = function openProjection(id) {
    if (!currentId) returnFocus = document.activeElement;
    if (!currentId && !window.__atvFlag) mode = 'caderno';
    window.__atvFlag = false;
    if (!renderCard(id)) return;
    view.hidden=false;
    paintRefs();
    view.setAttribute('aria-hidden','false');
    document.body.classList.add('is-projecting');
    if (main) main.inert=true;
    if (navigation) navigation.inert=true;
    document.querySelector('.lesson-quick-nav')?.setAttribute('inert','');
    if (hero) hero.inert=true;
    document.getElementById('projectionClose').focus();
  };
  function closeProjection() {
    view.hidden=true;
    view.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-projecting');
    if (main) main.inert=false;
    if (navigation) navigation.inert=false;
    document.querySelector('.lesson-quick-nav')?.removeAttribute('inert');
    if (hero) hero.inert=false;
    currentId=null;
    if (returnFocus && typeof returnFocus.focus==='function') returnFocus.focus();
    returnFocus=null;
  }
  function step(delta) {
    const card = currentId && document.getElementById(currentId);
    const cards=getCards(card), ix=cards.indexOf(card);
    if (ix>=0 && cards[ix+delta]) renderCard(cards[ix+delta].id);
  }
  document.querySelectorAll('.projetar-btn').forEach(button => {
    button.addEventListener('click', () => window.openProjection(button.dataset.projetar));
  });
  document.getElementById('projectionClose').addEventListener('click',closeProjection);
  { const mb = document.getElementById('projectionMode'); if (mb) mb.addEventListener('click', toggleMode); }
  if (refsBtn) refsBtn.addEventListener('click',()=>{ try { localStorage.setItem(REFS_KEY, refsOn() ? '0' : '1'); } catch (e) {} paintRefs(); });
  paintRefs();
  let _opened = [];
  window.addEventListener('beforeprint', () => { _opened = [...view.querySelectorAll('.pr-hab:not([open])')]; _opened.forEach(d => { d.open = true; }); });
  window.addEventListener('afterprint', () => { _opened.forEach(d => { d.open = false; }); _opened = []; });
  prevBtn.addEventListener('click',()=>step(-1));
  nextBtn.addEventListener('click',()=>step(1));
  document.getElementById('projectionSmaller').addEventListener('click',()=>{scale=Math.max(.85,Math.round((scale-.1)*100)/100);page.style.setProperty('--projection-scale',String(scale));});
  document.getElementById('projectionLarger').addEventListener('click',()=>{scale=Math.min(1.6,Math.round((scale+.1)*100)/100);page.style.setProperty('--projection-scale',String(scale));});
  document.addEventListener('keydown',event=>{
    if (view.hidden) return;
    if (event.key==='Escape') {event.preventDefault();closeProjection();}
    if (event.key==='ArrowRight' && !event.ctrlKey && !event.altKey) {event.preventDefault();step(1);}
    if (event.key==='ArrowLeft' && !event.ctrlKey && !event.altKey) {event.preventDefault();step(-1);}
    if ((event.key==='a' || event.key==='A') && !event.ctrlKey && !event.altKey && !event.metaKey) {event.preventDefault();toggleMode();}
    if (event.key==='Tab') {
      const controls=[...view.querySelectorAll('button:not(:disabled), a[href], summary')].filter(n=>n.offsetParent!==null);
      if (controls.length && event.shiftKey && document.activeElement===controls[0]) {event.preventDefault();controls[controls.length-1].focus();}
      else if (controls.length && !event.shiftKey && document.activeElement===controls[controls.length-1]) {event.preventDefault();controls[0].focus();}
    }
  });

  const seriesSections=[...document.querySelectorAll('section.series[id]')];
  const disciplineSections=[...document.querySelectorAll('section.discipline[id]')];
  function cleanupPrint() {
    document.body.classList.remove('print-scope-tudo','print-scope-disciplina','print-scope-caderno','print-scope-cadernos');
    seriesSections.forEach(s=>s.classList.remove('print-selected-series'));
    disciplineSections.forEach(s=>s.classList.remove('print-selected-discipline'));
    view.classList.remove('projection-printing');
    document.querySelectorAll('.print-first-caderno').forEach(n=>n.classList.remove('print-first-caderno'));
    document.querySelectorAll('.wide.notebook').forEach(n=>{n.style.removeProperty('--fit');n.style.removeProperty('--fit-w');});
    printMode=null;
  }
  window.addEventListener('afterprint',cleanupPrint);
  window.printScope=function printScope(mode) {
    cleanupPrint();
    if (mode==='caderno') {
      if (view.hidden || !currentId) return;
      printMode='caderno';
      document.body.classList.add('print-scope-caderno');
      view.classList.add('projection-printing');
    } else if (mode==='tudo') {
      printMode='tudo';
      document.body.classList.add('print-scope-tudo');
    } else {
      printMode='disciplina';
      const activeSeries=seriesSections.find(s=>!s.hidden) || seriesSections[0];
      const activeDiscipline=activeSeries && [...activeSeries.querySelectorAll(':scope > section.discipline')].find(d=>!d.hidden);
      if (activeSeries) activeSeries.classList.add('print-selected-series');
      if (activeDiscipline) activeDiscipline.classList.add('print-selected-discipline');
      document.body.classList.add('print-scope-disciplina');
      if (mode==='cadernos') {
        document.body.classList.add('print-scope-cadernos');
        // Uma semana por folha: mede cada caderno na largura útil de uma A4 (~690px) e reduz o que passar da altura útil (~1000px)
        const W=690, H=1000;
        let first=true;
        (activeDiscipline ? [...activeDiscipline.querySelectorAll('.week-card')] : []).forEach(card=>{
          const nb=card.querySelector('.wide.notebook:not(.empty)');
          if (!nb || card.hidden) return;
          if (first) { card.classList.add('print-first-caderno'); first=false; }
          // a medida é feita com o estilo de tela; impresso, o caderno ocupa ~80–100% dessa altura (medido nas 59 semanas)
          const old=nb.style.width; nb.style.width=W+'px';
          const est=nb.scrollHeight*.9; nb.style.width=old;
          const z=est>H ? Math.max(.6,H/est) : 1;
          if (z<1) { nb.style.setProperty('--fit',z.toFixed(3)); nb.style.setProperty('--fit-w',Math.round(W/z)+'px'); }
        });
      }
    }
    window.print();
  };
  document.getElementById('projectionPrint').addEventListener('click',()=>window.printScope('caderno'));
  window.MaluCurriculum = { readCodes, matrizTextos };
})();
