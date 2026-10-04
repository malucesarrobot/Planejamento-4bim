/* Complemento de estudo exclusivo da professora, sem alterar o caderno editável. */
(function () {
  'use strict';
  function node(tag,text,cls) {const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function paragraphs(parent,text) {for(const p of text.split('\n\n'))parent.appendChild(node('p',p));}
  function link(parent,label,url) {const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener';parent.appendChild(a);}
  function board(card) {
    const lesson=window.MaluStudyData?.lessons[card.id];if(!lesson)return null;
    const wrap=node('section',null,'ux-board-model');
    wrap.appendChild(node('h3','Esquema sugerido para o quadro'));wrap.appendChild(node('p','Esquema de conceitos · leia cada bloco e compare os sentidos.','ux-board-caption'));
    const list=node('dl');
    for(const [term,meaning] of lesson.terms.slice(0,3)){const concept=node('div',null,'ux-board-concept');concept.append(node('dt',term),node('dd',meaning));list.appendChild(concept);}
    wrap.appendChild(list);
    const q=window.MaluEditorialData?.questions[card.id];if(q)wrap.appendChild(node('p',q.question,'ux-board-question'));
    return wrap;
  }
  function exams(card) {
    const data=window.MaluEditorialData,lesson=data?.exams[card.id];if(!lesson)return null;
    const wrap=node('section',null,'ux-exam-connections');wrap.appendChild(node('h4','Questões já cobradas · 2016–2025'));
    wrap.appendChild(node('p',lesson.theme,'ux-exam-theme'));
    wrap.appendChild(node('p','O ano indica a edição; consulte o caderno e a questão informados.','ux-editorial-note'));
    const occurrences={...data.occurrences,...data.essayOccurrences};
    const groups=[['Questões objetivas e discursivas',lesson.connections.filter(c=>occurrences[c.ref].tipo!=='Redação')],['Temas de redação já cobrados',lesson.connections.filter(c=>occurrences[c.ref].tipo==='Redação')]];
    for(const [heading,connections] of groups){
     if(!connections.length)continue;
     wrap.appendChild(node('h4',heading));
     for(const c of connections){
      const r=occurrences[c.ref],item=node('article',null,'ux-exam-item');item.dataset.examRef=c.ref;
      item.appendChild(node('h5',r.exame+' · '+r.ano));
      item.appendChild(node('p',r.tema,'ux-exam-theme'));
      item.appendChild(node('p','Banca: '+r.banca+' · '+r.localizacao+' · '+r.caderno,'ux-editorial-note'));
      item.appendChild(node('p',c.relation==='Direta'?'Conteúdo diretamente relacionado':'Aproximação com esta aula','ux-exam-relation'));
      const context=node('details',null,'ux-exam-context');context.appendChild(node('summary','Relação com a aula'));paragraphs(context,c.why);if(r.nota)paragraphs(context,r.nota);item.appendChild(context);

      link(item,'Abrir prova ou publicação oficial ↗',r.fonte);wrap.appendChild(item);
    }
    }
    return wrap;
  }
  function bibliography(card) {
    const lesson=window.MaluBibliographyData?.lessons[card.id];if(!lesson)return null;
    const wrap=node('section',null,'ux-bibliography');wrap.appendChild(node('h4','Bibliografia e repertório da semana'));
    wrap.appendChild(node('p',lesson.focus));
    const list=node('ul');
    for(const entry of lesson.entries){
      const source=entry.source?window.MaluBibliographyData.sources[entry.source]:null;
      const [title,url,note]=source||window.MaluStudyData.sources[entry.ref];
      const li=node('li');link(li,title,url);paragraphs(li,entry.use);
      paragraphs(li,note);
      if(!source&&/classics.mit.edu|plato.stanford.edu|openstax.org|web.mit.edu|sites.duke.edu/.test(url))li.appendChild(node('p','Texto em inglês; leitura de apoio para a professora.','ux-editorial-note'));
      list.appendChild(li);
    }
    wrap.appendChild(list);wrap.appendChild(node('p','As indicações são opcionais. Os links identificam texto, catálogo ou acervo; não prometem filme completo gratuito. Antes de levar um trecho à turma, confira contexto, linguagem, duração e adequação.','ux-editorial-note'));
    return wrap;
  }
  function editorial(card,section,lesson) {
    const q=window.MaluEditorialData?.questions[card.id];if(!q)return;
    const difficult=node('details',null,'ux-teacher-guide');difficult.appendChild(node('summary','Perguntas difíceis'));
    difficult.appendChild(node('h5',q.question));paragraphs(difficult,q.answer);paragraphs(difficult,'Limite da resposta: '+lesson.limit);section.appendChild(difficult);
    const model=node('details',null,'ux-teacher-guide');model.appendChild(node('summary','Modelo de registro no quadro'));
    model.appendChild(node('p','Separe os conceitos em blocos. Leia as diferenças antes de relacioná-los; setas só devem indicar uma relação explicitamente justificada. O esquema também está disponível na projeção.'));
    model.appendChild(board(card));section.appendChild(model);
    const reading=node('details',null,'ux-teacher-guide');reading.appendChild(node('summary','Leitura e confronto de fontes'));
    const subject=card.id.split('-')[1],qs=subject==='historia'?
      ['Quem produziu a fonte, quando e para qual público? O que sua posição permite observar?','Como imagem, palavras, seleção e silêncios constroem a narrativa?','Que afirmação pode ser sustentada? Qual informação exige outra fonte independente?']:
      subject==='filosofia'?['Qual problema o autor ou a obra formula, e em qual contexto?','Como conceitos, composição, suporte e enquadramento orientam a interpretação?','Que tese ou interpretação é justificável, e qual objeção ou elemento da obra limita essa leitura?']:
      ['Quem fala, a partir de qual posição, e quem é representado ou fica fora do enquadramento?','Que classificação, contraste ou composição produz sentidos sobre identidade e poder?','O material é testemunho, construção artística ou dado de pesquisa? O que cada tipo permite concluir?'];
    const ol=node('ol');qs.forEach(t=>ol.appendChild(node('li',t)));reading.appendChild(ol);
    paragraphs(reading,'Para confrontar uma fonte estatal e uma fonte de movimento social: registre autoria, data, gênero e finalidade de cada uma; formule a mesma pergunta para ambas; separe fatos observados, interpretações e reivindicações; compare convergências e divergências; indique o que precisa de corroboração. Nenhuma posição torna a fonte automaticamente verdadeira ou falsa.');
    if(card.id==='s2-sociologia-semana-1')paragraphs(reading,'Em Ilha das Flores, observe montagem, repetição e voz narrativa. A denúncia do filme não substitui levantamento estatístico: verifique sua autoria e data nas fontes da aula antes de generalizar.');
    if(card.id==='s2-filosofia-semana-4')paragraphs(reading,'Ao analisar o rosto pintado de Krenak, localize o registro completo, a ocasião e a explicação do próprio autor; observe gesto, enquadramento e interlocutores. Não atribua um significado universal à pintura corporal indígena sem fonte situada.');
    section.appendChild(reading);
    const timing=node('details',null,'ux-teacher-guide');timing.appendChild(node('summary','Tempo e aplicação opcional'));
    paragraphs(timing,'Possibilidade para 45 minutos: 5 min para uma pergunta; 20 min de explicação e leitura de fonte; 10 min de conversa; 10 min de registro. Ajuste livremente: atividade, debate e explicação podem substituir-se conforme a turma; esta divisão não é uma sequência obrigatória.');
    if(/s1-sociologia-semana-[245]|s2-sociologia-semana-5/.test(card.id))paragraphs(timing,'Aplicação ao cotidiano escolar: escolha uma regra pública de atendimento ou do regimento, sem nomes de pessoas. Distinga finalidade declarada, procedimento e efeito observado; teste o conceito da aula e indique também onde ele não se aplica. A existência de uma regra não prova violência ou injustiça.');
    if(card.id.endsWith('-6'))paragraphs(timing,'Na síntese, avalie: precisão dos conceitos, evidências, relação entre razões e conclusão, melhor objeção e resposta fundamentada. A nota considera a qualidade do argumento, não a concordância com a posição da professora.');
    section.appendChild(timing);
    if(card.id.startsWith('s9-')) {
      const bridges=[['Irradiação e contaminação','Receber luz de uma lâmpada não leva a lâmpada para seu corpo; receber poeira deixa material sobre ele. A comparação ajuda a separar exposição e presença de material. Limite: luz e poeira comuns não reproduzem os efeitos de uma fonte radioativa.'],['Redemocratização','Trocar quem dirige um grêmio e mudar suas regras são acontecimentos distintos. Isso aproxima eleição e transformação institucional. Limite: uma escola não reproduz a escala e os conflitos de um Estado.'],['Direito e acesso','Uma biblioteca pode permitir empréstimo a todos, mas uma escada pode impedir alguém de chegar ao balcão. A regra de acesso não remove automaticamente a barreira. Limite: o exemplo não esgota a diversidade de garantias e obstáculos sociais.'],['Mobilização','Uma demanda de estudantes pode reunir assinaturas, representação e negociação; a mudança depende de ações e instituições. Limite: movimentos sociais possuem trajetórias, riscos e relações de poder que vão além desse exemplo escolar.'],['Igualdade e equidade','Oferecer a mesma folha a todos não garante leitura a quem precisa de letra ampliada. A adaptação remove uma barreira para exercer o mesmo direito. Limite: não é uma justificativa automática para qualquer política; critérios e efeitos precisam ser examinados.'],['Política pública','Propor melhorar uma biblioteca é diferente de definir acervo, recursos, responsáveis e avaliação. Isso aproxima intenção e implementação. Limite: políticas públicas envolvem escalas, orçamento e disputas que uma iniciativa escolar não representa integralmente.']];
      const [title,text]=bridges[Number(card.id.slice(-1))-1],bridge=node('aside',null,'ux-study-example');bridge.appendChild(node('h5','Analogia para começar · '+title));paragraphs(bridge,text);section.appendChild(bridge);
    }
    const exam=exams(card);if(exam)section.appendChild(exam);
  }
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
    editorial(card,section,lesson);
    const reading=bibliography(card);if(reading)section.appendChild(reading);
  }
  window.MaluStudy={attach,board,exams,bibliography};
})();
