/* Checklists de caderno – 2ª, 3ª séries e 9º ano, 4º bimestre de 2026.
 * Somente títulos pedagógicos, tarefas e referências públicas de páginas.
 * Os dados de estudantes e as notas existentes não são modificados.
 */
(() => {
  'use strict';
  const sets=[
    {serie:2,school:'EFG',subject:'História',book:'Livro didático',tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Caderno · Crise do Império, abolição e Primeira República',
       work:'Textos unificados das semanas 1 e 2; quadro histórico, três questões e debate sobre pós-abolição.',pages:['236–241','239','273–274']},
      {key:'hist-republica3',weeks:[3],name:'Caderno · Primeira República: oligarquias, voto e coronelismo',
       work:'Texto, quadro dos mecanismos políticos e três questões.',pages:['274–276']},
      {key:'hist-revoltas4',weeks:[4],name:'Caderno · República contestada e movimentos populares',
       work:'Texto, debate e quadro comparativo das lutas sociais; questões sobre a Revolta da Chibata.',pages:['284–286']},
      {key:'hist-crise5',weeks:[5],name:'Caderno · Tenentismo e crise oligárquica',
       work:'Texto, esquema dos acontecimentos e três questões.',pages:['277','287']},
      {key:'hist-vargas6',weeks:[6],name:'Caderno · Era Vargas: Estado, trabalho e autoritarismo',
       work:'Texto, quadro das fases do período, perguntas e debate.',pages:['288–289','294–296']},
      {key:'hist-pesquisa-guerras',weeks:[6],name:'Pesquisa · Guerras brasileiras',
       work:'Pesquisa orientada sobre conflitos e guerras na história do Brasil: contexto, sujeitos, consequências e fontes; incluir QR code de acesso à orientação quando disponível.',pages:[]}
    ]},
    {serie:2,school:'EFG',subject:'Filosofia',book:'Livro didático',tasks:[
      {key:'filo-textos1e2',weeks:[1,2],name:'Caderno · Racionalidade instrumental e ética socioambiental',
       work:'Textos das semanas 1 e 2; conceitos, esquema, questões e debate sobre humanidade e natureza.',pages:['38','58–59','67']},
      {key:'filo-amerindias3',weeks:[3],name:'Caderno · Filosofias ameríndias e território',
       work:'Texto, síntese e questões sobre modos de conhecer, autoria e território.',pages:[]},
      {key:'filo-krenak4',weeks:[4],name:'Caderno · Ailton Krenak: humanidade e natureza',
       work:'Texto, quadro, questão e debate sobre território, rio e modos de vida.',pages:['12–13']},
      {key:'filo-justica5',weeks:[5],name:'Caderno · Justiça socioambiental',
       work:'Texto e questão sobre desigualdade, responsabilidade histórica e crise ambiental.',pages:['64–65']},
      {key:'filo-sintese6',weeks:[6],name:'Caderno · Consumo, sustentabilidade e ética',
       work:'Síntese do bimestre, atividade de reflexão e debate.',pages:['66']}
    ]},
    {serie:2,school:'EFG',subject:'Sociologia',book:'Livro didático',tasks:[
      {key:'soc-textos1e2',weeks:[1,2],name:'Caderno · República, pós-abolição e desigualdades',
       work:'Textos unificados das semanas 1 e 2; esquema, conceitos, questões e debate.',pages:['203–204']},
      {key:'soc-cidadania3',weeks:[3],name:'Caderno · Racismo, preconceito, estigma e cidadania',
       work:'Texto, esquema, perguntas e exemplos de discriminação.',pages:['168–170']},
      {key:'soc-cidade4',weeks:[4],name:'Caderno · Modernização urbana e exclusão social',
       work:'Texto, quadro e leitura de mapa sobre espaço urbano e desigualdade.',pages:['176–182']},
      {key:'soc-poder5',weeks:[5],name:'Caderno · Poder, obediência e participação',
       work:'Texto, esquema e debate sobre autoridade, obediência e direitos.',pages:['118']},
      {key:'soc-democracia6',weeks:[6],name:'Caderno · Democracia em disputa',
       work:'Texto, síntese e pergunta: participação e acesso a serviços públicos.',pages:['190']}
    ]},
    {serie:3,school:'EFG',subject:'História',book:'Livro didático',tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Caderno · Redemocratização e Constituição de 1988',
       work:'Textos unificados das semanas 1 e 2; linha do tempo, quadro de direitos e três questões.',pages:['384–389']},
      {key:'hist-nova3',weeks:[3],name:'Caderno · Nova República e desigualdades',
       work:'Texto, esquema de governos e políticas, três questões e debate.',pages:['390–394']},
      {key:'hist-movimentos4',weeks:[4],name:'Caderno · Movimentos sociais e cidadania',
       work:'Texto, quadro sobre sujeitos e reivindicações, questões e debate.',pages:['394–397']},
      {key:'hist-global5',weeks:[5],name:'Caderno · Neoliberalismo e globalização',
       work:'Texto, esquema e questões sobre mudanças econômicas e sociais.',pages:['362–363','382']},
      {key:'hist-sul6',weeks:[6],name:'Caderno · Brasil, BRICS e Sul Global',
       work:'Texto, quadro comparativo e debate sobre cooperação Sul-Sul, autonomia e multipolaridade.',pages:[]},
      {key:'hist-ciclo',weeks:[6],name:'Atividade · Ciclo (conforme checklist da 3ª série)',
       work:'Registro da atividade denominada “ciclo” no último checklist; conferir o enunciado específico antes da correção.',pages:[]}
    ]},
    {serie:3,school:'EFG',subject:'Filosofia',book:'Livro didático',tasks:[
      {key:'filo-textos1e2',weeks:[1,2],name:'Caderno · Estética, paisagem, natureza e sociedade',
       work:'Textos unificados das semanas 1 e 2; leitura de imagens, esquema e debate.',pages:[]},
      {key:'filo-jonas3',weeks:[3],name:'Caderno · Hans Jonas e responsabilidade pelo futuro',
       work:'Texto, síntese e duas questões prioritárias.',pages:[]},
      {key:'filo-krenak4',weeks:[4],name:'Caderno · Colonialidade e território: Krenak',
       work:'Texto, quadro, questões e debate.',pages:[]},
      {key:'filo-mbembe5',weeks:[5],name:'Caderno · Mbembe: exploração e exposição ao dano',
       work:'Texto, esquema, questão e análise de situação fictícia.',pages:[]},
      {key:'filo-modelos6',weeks:[6],name:'Caderno · Modelos socioeconômicos e natureza',
       work:'Quadro comparativo e questões sobre limites éticos e sociedade.',pages:[]}
    ]},
    {serie:3,school:'EFG',subject:'Sociologia',book:'Livro didático',tasks:[
      {key:'soc-textos1e2',weeks:[1,2],name:'Caderno · Cidadania, direitos humanos, raça e racismo',
       work:'Textos unificados das semanas 1 e 2; conceitos, quadro e três questões.',pages:['281–283','167–170','295']},
      {key:'soc-genero3',weeks:[3],name:'Caderno · Gênero, identidade e reconhecimento',
       work:'Texto, esquema de interseccionalidade e debate.',pages:['203–214']},
      {key:'soc-originarios4',weeks:[4],name:'Caderno · Povos indígenas e território',
       work:'Texto, síntese e questão sobre direitos coletivos.',pages:['296']},
      {key:'soc-movimentos5',weeks:[5],name:'Caderno · Movimentos sociais contemporâneos',
       work:'Texto, quadro de movimentos e reivindicações, debate.',pages:['287–296']},
      {key:'soc-proposta6',weeks:[6],name:'Caderno · Diagnóstico e proposta para a comunidade',
       work:'Síntese e proposta coletiva sobre questão da comunidade escolar.',pages:[]}
    ]},
    {serie:9,school:'CEPI',subject:'História',book:'Revisa Goiás',tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Caderno · Redemocratização, Constituição e Nova República',
       work:'Textos unificados das semanas 1 e 2; linha do tempo e três questões.',pages:['10–13']},
      {key:'hist-guerra3',weeks:[3],name:'Caderno · Guerra Fria: bipolaridade e conflitos',
       work:'Texto, mapa de blocos, síntese e três questões.',pages:['13–15']},
      {key:'hist-fim4',weeks:[4],name:'Caderno · Fim da Guerra Fria e ordem mundial',
       work:'Texto, esquema das reformas soviéticas e três questões.',pages:['15–16']},
      {key:'hist-asia5',weeks:[5],name:'Caderno · Descolonização da Ásia e Bandung',
       work:'Texto, mapa, debate sobre autodeterminação e três questões.',pages:['16–17']},
      {key:'hist-africa6',weeks:[6],name:'Caderno · Descolonização africana e pan-africanismo',
       work:'Texto, mapa e quadro de lideranças, debate e três questões.',pages:['17–18']}
    ]}
  ];
  const normalize=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim().replace(/\s+/g,' ');
  const slug={'História':'historia','Filosofia':'filosofia','Sociologia':'sociologia'};
  const weekId=(s,w)=>'s'+s.serie+'-'+slug[s.subject]+'-semana-'+w;
  function matches(t,s){
    const unit=normalize(t.unidade);
    const school=s.school==='EFG'?(unit==='EFG'||unit.includes('ESCOLA DO FUTURO')):(unit.includes('CEPI')||unit.includes('MARAJO'));
    return school&&t.ativo!==false&&Number.parseInt(t.serie||t.nome,10)===s.serie&&normalize(t.disciplina)===normalize(s.subject);
  }
  function equivalent(a,entry,s){
    const sameTitle=normalize(a.nome)===normalize(entry.name);
    const sameKey=a.origem?.checklistKey===entry.key;
    // Registro anterior explicitamente associado ao mesmo caderno da semana.
    const isSpecial=/^(Pesquisa|Atividade · Ciclo)/i.test(entry.name);
    const sameNotebook=!isSpecial && a.origem?.weekId===weekId(s,entry.weeks[0]) &&
      (a.origem?.kind==='book'||a.origem?.panel==='notebook') &&
      /CADERNO|TEXTO UNIFICADO|ATIVIDADE DO LIVRO|PESQUISA/.test(normalize(a.nome));
    return sameTitle||sameKey||sameNotebook;
  }
  function plan(data){
    if(!data?.turmas||!Array.isArray(data.activities))return {toAdd:[],existing:0,classes:0};
    const toAdd=[];let existing=0,classes=0;
    for(const turma of Object.values(data.turmas)){
      for(const set of sets){
        if(!matches(turma,set))continue;
        classes++;
        for(const entry of set.tasks){
          if(data.activities.some(a=>a.turmaId===turma.id&&equivalent(a,entry,set))){existing++;continue;}
          toAdd.push({
            id:'caderno-2026b4-'+turma.id+'-s'+set.serie+'-'+slug[set.subject]+'-'+entry.key,
            turmaId:turma.id,bimestre:4,nome:entry.name,tipo:'Outra',data:'2026-11-06',
            valorMax:10,peso:1,checklist:false,extra:false,rascunho:true,
            origem:{weekId:weekId(set,entry.weeks[0]),title:entry.name,
              panel:'notebook',kind:'unit',checklistKey:entry.key,pageReferences:entry.pages.slice()}
          });
        }
      }
    }
    return {toAdd,existing,classes};
  }
  function apply(data){const proposed=plan(data);data.activities.push(...proposed.toAdd);return {added:proposed.toAdd.length,existing:proposed.existing,classes:proposed.classes};}
  function render(root=document){
    if(!root?.querySelector)return;
    for(const set of sets){
      for(let wk=1;wk<=6;wk++){
        const tasks=set.tasks.filter(t=>t.weeks.includes(wk));
        if(!tasks.length)continue;
        const card=root.querySelector('#'+weekId(set,wk));
        if(!card||card.querySelector('[data-checklist-outras-turmas]'))continue;
        const box=document.createElement('section');box.className='malu-checklist-1a';
        box.dataset.checklistOutrasTurmas='true';
        const heading=document.createElement('h4');heading.textContent='Checklist do caderno · '+(set.serie===9?'9º ano':set.serie+'ª série');
        const list=document.createElement('ul');list.className='malu-checklist-tarefas';
        for(const task of tasks){
          const li=document.createElement('li');li.textContent='☐ '+task.work;list.append(li);
        }
        box.append(heading,list);
        const pages=[...new Set(tasks.flatMap(t=>t.pages))];
        const p=document.createElement('p');p.className='malu-checklist-paginas';
        p.textContent=pages.length?set.book+' — páginas: '+pages.map(v=>'p. '+v).join(' · '):set.book+' — sem páginas adicionais confirmadas neste checklist';
        box.append(p);
        const plan=card.querySelector('.plan-grid');if(plan)card.insertBefore(box,plan);else card.append(box);
      }
    }
  }
  globalThis.MaluChecklistOutrasTurmas={sets,plan,apply,render};
})();
