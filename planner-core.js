/* Small, dependency-free helpers shared by the planner UI and regression tests. */
(function (root) {
  'use strict';
  const CLASSES = Object.freeze({s9:['9ºA','9ºC'],s1:['1ªA','1ªB'],s2:['2ªA','2ªB'],s3:['3ªA','3ªB','3ªC']});
  function chooseWeek(ids, preferred) { return ids.includes(preferred) ? preferred : (ids[0] || null); }
  function parseEdits(raw) {
    if (!raw) return {version:1,title:null,notebook:{},activity:{}};
    const p = JSON.parse(raw);
    if (!p || p.version !== 1 || (p.title !== null && typeof p.title !== 'string')) throw new Error('Formato de edição inválido.');
    const out = {version:1,title:p.title,notebook:{},activity:{}};
    for (const type of ['notebook','activity']) {
      if (!p[type] || typeof p[type] !== 'object' || Array.isArray(p[type])) throw new Error('Conteúdo de edição inválido.');
      for (const [path, value] of Object.entries(p[type])) {
        if (!/^(?:\d+\.)*\d+$/.test(path) || typeof value !== 'string') throw new Error('Trecho de edição inválido.');
        out[type][path] = value;
      }
    }
    return out;
  }
  function pathOf(node, rootNode) {
    const path = [];
    while (node !== rootNode) {
      const parent = node.parentElement;
      if (!parent) throw new Error('Trecho fora do conteúdo.');
      path.unshift(Array.prototype.indexOf.call(parent.children,node));
      node = parent;
    }
    return path.join('.');
  }
  function atPath(rootNode, path) {
    return path.split('.').reduce((node, i) => node && node.children[Number(i)], rootNode);
  }
  function applyTextEdits(rootNode, edits) {
    for (const [path,text] of Object.entries(edits)) {
      const node = atPath(rootNode,path);
      if (!node || node.closest('svg,script,style')) throw new Error('A estrutura desta aula mudou; confira a edição.');
      node.textContent = text; // saved data is always text, never executable HTML
    }
    return rootNode;
  }
  function dateLocal(d) { return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
  function dateBR(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3]+'/'+m[2]+'/'+m[1] : ''; }
  root.MaluPlannerCore = Object.freeze({CLASSES,chooseWeek,parseEdits,pathOf,atPath,applyTextEdits,dateLocal,dateBR});
})(typeof window !== 'undefined' ? window : globalThis);
