/* Render the complete source before storage, search, projection and printing initialize. */
(function () {
  'use strict';
  const main = document.getElementById('conteudo');
  const content = window.PlannerContent;
  if (!main || !content || content.version !== 1 || typeof content.html !== 'string') {
    if (main) main.textContent = 'Não foi possível carregar o material. Recarregue a página para tentar novamente.';
    throw new Error('Conteúdo do bimestre indisponível.');
  }
  function identifyNotebooks(root) {
    const labels={historia:'História',filosofia:'Filosofia',sociologia:'Sociologia'};
    for(const card of root.querySelectorAll('article.week-card')){
      const discipline=labels[card.id.match(/^s\d+-(historia|filosofia|sociologia)-/)?.[1]],notebook=card.querySelector('.wide.notebook');
      if(discipline&&notebook){notebook.dataset.discipline=discipline;notebook.setAttribute('aria-label','Caderno de '+discipline);}
    }
  }
  // Retain the published source for clean sharing, before restoring any personal state.
  window.MaluPublishedContent = Object.freeze({clone: function () {const t=document.createElement("template");t.innerHTML=content.html;identifyNotebooks(t.content);return t.content;}});
  main.innerHTML = content.html;
  identifyNotebooks(main);
  delete window.PlannerContent;
})();
