/* Complemento de estudo exclusivo da professora, sem alterar o caderno editável. */
(function () {
  'use strict';
  function node(tag,text,cls) {const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function paragraphs(parent,text) {for(const p of text.split('\n\n'))parent.appendChild(node('p',p));}
  function attach(card) {
    const data=window.MaluStudyData,lesson=data?.lessons[card.id],panel=card.querySelector('.prof-panel');
    if(!lesson || !panel || panel.querySelector('.ux-study'))return;
    const section=node('section',null,'ux-study');section.dataset.reviewed=data.reviewedOn;
    section.setAttribute('aria-labelledby',card.id+'-study-heading');
    const title=node('h4','Aprofundamento para a explicação');title.id=card.id+'-study-heading';section.appendChild(title);
    paragraphs(section,lesson.explain);
    const limits=node('aside',null,'ux-study-limit');limits.appendChild(node('h5','Alcance e limites'));paragraphs(limits,lesson.limit);section.appendChild(limits);
    const example=node('aside',null,'ux-study-example');example.appendChild(node('h5','Exemplo didático — situação fictícia'));
    paragraphs(example,lesson.example);example.appendChild(node('h5','Como analisar'));paragraphs(example,lesson.analysis);section.appendChild(example);
    const refs=node('section',null,'ux-study-sources');refs.appendChild(node('h5','Fontes para este aprofundamento'));
    const list=node('ul');
    for(const key of lesson.refs) {const [label,url,note]=data.sources[key],li=node('li'),a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener';li.appendChild(a);li.appendChild(node('p',note));list.appendChild(li);}
    refs.appendChild(list);section.appendChild(refs);
    const anchor=[...panel.querySelectorAll('h4')].find(n=>/Roteiro da aula|Sequência da explicação/.test(n.textContent));
    if(anchor)anchor.before(section);else panel.appendChild(section);
    // Preserve prior observations without presenting them as verified documentation.
    const notes=node('details',null,'ux-study-original');notes.appendChild(node('summary','Observações e aplicações do material original'));
    for(const aside of panel.querySelectorAll('.callout.curiosity,.callout.parallel')) {
      const heading=aside.querySelector('.callout-title');
      if(heading)heading.textContent=aside.classList.contains('curiosity')?'Observação original — conferir documentação':'Proposta didática do material original';
      notes.appendChild(aside);
    }
    if(notes.children.length>1)refs.after(notes);
  }
  window.MaluStudy={attach};
})();
