/* Render the complete source before storage, search, projection and printing initialize. */
(function () {
  'use strict';
  const main = document.getElementById('conteudo');
  const content = window.PlannerContent;
  if (!main || !content || content.version !== 1 || typeof content.html !== 'string') {
    if (main) main.textContent = 'Não foi possível carregar o material. Recarregue a página para tentar novamente.';
    throw new Error('Conteúdo do bimestre indisponível.');
  }
  // Retain the published source for clean sharing, before restoring any personal state.
  window.MaluPublishedContent = Object.freeze({clone: function () {const t=document.createElement("template");t.innerHTML=content.html;return t.content;}});
  main.innerHTML = content.html;
  delete window.PlannerContent;
})();
