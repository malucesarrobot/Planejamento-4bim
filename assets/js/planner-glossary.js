/* Glossários de preparação: definições do material e complementos didáticos de arte. */
(function () {
  'use strict';
  const art = [
    ['Estética','Área da Filosofia que investiga a experiência sensível, os juízos de gosto, a beleza e questões relacionadas à arte.','Perguntar por que uma imagem nos chama a atenção, além de identificar o que ela mostra.'],
    ['Arte','Campo de práticas de criação de obras e acontecimentos que produzem formas, expressões e sentidos. O que conta como arte é objeto de debate histórico e filosófico.','Um filme pode ser arte sem representar algo bonito.'],
    ['Belo','Categoria de avaliação estética: dizemos que algo é belo ao experimentar e julgar sua beleza. Os critérios e a relação entre objeto e observador são discutidos por diferentes teorias.','Uma paisagem pode ser considerada bela sem ser uma obra de arte.'],
    ['Fruição','Neste uso didático, é o ato de apreciar e vivenciar uma obra, envolvendo atenção, percepção, emoções e interpretação. Pode incluir prazer, incômodo ou estranhamento.','Ouvir uma música percebendo seu ritmo e o que ela provoca em você.'],
    ['Gosto','Capacidade de apreciar e julgar esteticamente. Sua formação envolve experiências, repertório e contexto social; não se esgota em uma preferência individual.','Explicar que prefere uma canção pela composição, além de dizer que gosta dela.'],
    ['Experiência estética','Encontro em que percebemos e elaboramos formas, qualidades sensíveis e sentidos de uma obra, objeto ou situação. Pode ocorrer também fora da arte.','Perceber como o silêncio e a luz de uma cena afetam sua experiência do filme.'],
    ['Sensação e percepção','Sensação diz respeito à resposta sensorial; percepção envolve organizar e reconhecer o que se apresenta aos sentidos. Essa distinção serve como ponto de partida para a aula.','Ouvir sons e reconhecer, na sequência deles, uma melodia.'],
    ['Juízo estético','Avaliação de qualidades estéticas, como beleza, expressividade ou equilíbrio. Pode ser discutida por meio de razões e critérios.','Dizer que uma composição transmite tensão e indicar quais elementos produzem esse efeito.'],
    ['Representação','Modo pelo qual uma obra apresenta ou evoca algo, como uma pessoa, situação ou ideia. Representar envolve escolhas; nem toda arte é figurativa.','Dois retratos da mesma pessoa podem construir sentidos diferentes.'],
    ['Interpretação','Construção de uma compreensão da obra a partir de seus elementos, de seu contexto e do repertório de quem a encontra.','Relacionar as imagens e a letra de um videoclipe para justificar uma leitura.'],
    ['Forma e conteúdo','Forma é a organização dos elementos e dos meios da obra; conteúdo é aquilo que ela tematiza ou elabora. Eles se relacionam na produção de sentido.','Uma denúncia social muda de efeito conforme o ritmo, o enquadramento e as cores.'],
    ['Criação artística','Processo de elaborar uma obra por escolhas, técnicas, experimentação e reelaboração. Não depende apenas de inspiração.','Testar arranjos e revisar uma música antes de apresentá-la.'],
    ['Cânone','Conjunto de obras e autores reconhecidos como referências por uma tradição ou por instituições. Sua seleção é histórica e pode ser contestada.','Investigar quem aparece nos livros de arte e quais produções ficam de fora.'],
    ['Legitimação artística','Processo social pelo qual práticas e obras recebem reconhecimento como arte ou como arte relevante.','Examinar o papel de museus, críticos, comunidades e públicos no reconhecimento de uma produção.'],
    ['Desinteresse estético — em Kant','No juízo puro de gosto, apreciar não depende do desejo de possuir o objeto ou de sua utilidade. Desinteresse não significa indiferença ou falta de atenção.','Apreciar a forma de um vaso sem pensar em comprá-lo.']
  ];
  const society = [
    ['Aura — em Walter Benjamin','Relação com a existência singular da obra, seu aqui e agora, sua história e sua inserção na tradição. Não se reduz ao preço nem à qualidade da peça.','Comparar o encontro com uma obra em seu contexto e o encontro com uma imagem dela.'],
    ['Reprodutibilidade técnica','Possibilidade de multiplicar obras ou imagens por meios técnicos, alterando circulação, acesso e modos de recepção.','Fotografia, cinema e gravação permitem alcançar públicos em diferentes lugares.'],
    ['Reprodução','Produção de cópias ou novas apresentações de uma obra por determinado meio. Pode mudar escala, suporte e contexto.','Uma pintura vista em uma impressão e depois na tela do celular.'],
    ['Recepção','Modos pelos quais públicos encontram, percebem e interpretam uma obra, em condições históricas e sociais determinadas.','Assistir ao mesmo filme no cinema e em trechos numa rede social.'],
    ['Mercantilização','Processo de tratar práticas ou bens culturais como mercadorias, organizando sua circulação por venda, lucro e demanda.','Analisar como a promoção comercial interfere na circulação de uma música.'],
    ['Mercado','Sistema de trocas de bens e serviços. No mercado de arte, agentes participam da compra, venda e valorização econômica de obras. Preço e valor estético não são equivalentes.','Uma obra cara não é, por esse motivo, necessariamente a mais expressiva.'],
    ['Consumo cultural','Acesso, escolha e uso de obras, práticas e experiências culturais. As condições de acesso variam entre grupos sociais.','Ouvir música, ir a uma mostra ou participar de uma apresentação comunitária.'],
    ['Valor de culto e valor de exposição — em Benjamin','Dois polos de valorização: a importância da obra em uma tradição ritual e sua possibilidade de ser mostrada e circular publicamente.','Comparar um objeto reservado a um rito e uma imagem produzida para ampla circulação.']
  ];
  const sources = [
    ['Stanford Encyclopedia of Philosophy — The Concept of the Aesthetic','https://plato.stanford.edu/entries/aesthetic-concept/'],
    ['Stanford Encyclopedia of Philosophy — Beauty','https://plato.stanford.edu/entries/beauty/'],
    ['Stanford Encyclopedia of Philosophy — The Definition of Art','https://plato.stanford.edu/entries/art-definition/'],
    ['OpenStax — Introduction to Philosophy, Aesthetics','https://openstax.org/books/introduction-philosophy/pages/8-5-aesthetics']
  ];
  const benjamin=['Walter Benjamin — The Work of Art in the Age of Mechanical Reproduction (texto em inglês, MIT)','https://web.mit.edu/21w.784/www/BD%20Supplementals/Materials/Unit%20Three/Benjamin%20work%20of%20art.html'];
  const norm=s=>s.trim().replace(/\s*—\s*$/,'').toLocaleLowerCase('pt-BR');
  function node(tag,text,cls) {const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function build(card,notebook) {
    const terms=[...card.querySelectorAll('.concept-chip')].map(n=>n.textContent.trim());
    const entries=new Map();
    function add(term,definition,example) {if(term && definition)entries.set(norm(term),[term.trim().replace(/\s*—\s*$/,''),definition.trim(),example]);}
    for(const n of notebook.querySelectorAll('.registro-conceito'))add(n.querySelector('strong')?.textContent,n.querySelector('span')?.textContent);
    for(const n of card.querySelectorAll('.concept-definition-item')){const strong=n.querySelector('strong');if(strong)add(strong.textContent,n.textContent.slice(strong.textContent.length));}
    for(const r of notebook.querySelectorAll('.registro-tabela tr')){const td=r.querySelectorAll('td');if(td.length===2 && terms.some(t=>norm(t)===norm(td[0].textContent)))add(td[0].textContent,td[1].textContent);}
    const special=card.id==='s3-filosofia-semana-1' ? art : card.id==='s3-filosofia-semana-2' ? [...art.filter(e=>['Arte','Fruição','Experiência estética','Interpretação','Cânone'].includes(e[0])),...society] : null;
    if(special){entries.clear();for(const e of special)add(...e);}
    if(!entries.size)return null;
    const box=node('section',null,'ux-glossary');box.setAttribute('aria-labelledby',card.id+'-glossary-title');
    const heading=node('h4','Glossário da aula');heading.id=card.id+'-glossary-title';box.appendChild(heading);
    if(special)box.appendChild(node('p','Definições de trabalho para explicar em sala. Quando o sentido é de um autor, ele está identificado.','ux-glossary-intro'));
    const list=node('dl');
    for(const [term,definition,example] of entries.values()) {
      list.appendChild(node('dt',term));const dd=node('dd');dd.appendChild(node('p',definition));
      if(example)dd.appendChild(node('p','Exemplo: '+example,'ux-glossary-example'));list.appendChild(dd);
    }
    box.appendChild(list);
    if(special){const refs=node('details',null,'ux-glossary-sources');refs.appendChild(node('summary','Referências do glossário'));
      const links=node('ul');for(const [title,url] of (card.id.endsWith('semana-2')?[...sources,benjamin]:sources)){const li=node('li'),a=node('a',title);a.href=url;a.target='_blank';a.rel='noopener';li.appendChild(a);links.appendChild(li);}refs.appendChild(links);box.appendChild(refs);}
    return box;
  }
  window.MaluGlossary={build};
})();
