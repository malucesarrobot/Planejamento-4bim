/* Checklists aprovados de caderno — 2ª e 3ª séries; 9º ano usa o 9º A como referência manual.
 * Atualizações preservam IDs e notas vinculadas às atividades já existentes.
 */
(() => {
  'use strict';
  const sets=[
    {serie:2,school:'EFG',subject:'História',book:'Livro didático',pages:['273','275','286','295'],tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Abolição, pós-abolição e formação da República',work:'Abolição, pós-abolição e formação da República',pages:[]},
      {key:'hist-republica3',weeks:[3],name:'Primeira República',work:'Primeira República',pages:[]},
      {key:'hist-revoltas4',weeks:[4],name:'A República contestada',work:'A República contestada',pages:[]},
      {key:'hist-crise5',weeks:[5],name:'Crise oligárquica',work:'Crise oligárquica',pages:[]},
      {key:'hist-vargas6',weeks:[6],name:'Era Vargas',work:'Era Vargas',pages:[]},
      {key:'hist-pesquisa-guerras',weeks:[6],name:'Pesquisa: guerras brasileiras',work:'Pesquisar contexto, participantes, causas e consequências dos conflitos.',pages:[]}
    ]},
    {serie:2,school:'EFG',subject:'Filosofia',book:'Livro didático',pages:['13','59','65','66','67'],tasks:[
      {key:'filo-textos1e2',weeks:[1,2],name:'Racionalidade instrumental e ética socioambiental',work:'Racionalidade instrumental e ética socioambiental',pages:[]},
      {key:'filo-amerindias3',weeks:[3],name:'Filosofias ameríndias: território, autoria e perspectivas',work:'Filosofias ameríndias: território, autoria e perspectivas',pages:[]},
      {key:'filo-krenak4',weeks:[4],name:'Ailton Krenak',work:'Ailton Krenak',pages:[]},
      {key:'filo-justica5',weeks:[5],name:'Justiça socioambiental',work:'Justiça socioambiental',pages:[]},
      {key:'filo-sintese6',weeks:[6],name:'Ética, consumo e outras relações com a natureza',work:'Ética, consumo e outras relações com a natureza',pages:[]}
    ]},
    {serie:2,school:'EFG',subject:'Sociologia',book:'Livro didático',pages:['118','168','182','190','191','204'],tasks:[
      {key:'soc-textos1e2',weeks:[1,2],name:'Liberdade, desigualdades e cidadania no pós-abolição',work:'Liberdade, desigualdades e cidadania no pós-abolição',pages:[]},
      {key:'soc-cidadania3',weeks:[3],name:'Quem era reconhecido como cidadão? Racismo, estigma e exclusão',work:'Quem era reconhecido como cidadão? Racismo, estigma e exclusão',pages:[]},
      {key:'soc-cidade4',weeks:[4],name:'Modernização urbana e exclusão',work:'Modernização urbana e exclusão',pages:[]},
      {key:'soc-poder5',weeks:[5],name:'Poder e controle social',work:'Poder e controle social',pages:[]},
      {key:'soc-democracia6',weeks:[6],name:'Democracia em disputa',work:'Democracia em disputa',pages:[]}
    ]},
    {serie:3,school:'EFG',subject:'História',book:'Livro didático',pages:['381','382','386','392','387'],tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Redemocratização e Constituição de 1988',work:'Redemocratização e Constituição de 1988',pages:[]},
      {key:'hist-nova3',weeks:[3],name:'Nova República',work:'Nova República',pages:[]},
      {key:'hist-movimentos4',weeks:[4],name:'Movimentos sociais e cidadania',work:'Movimentos sociais e cidadania',pages:[]},
      {key:'hist-global5',weeks:[5],name:'Neoliberalismo e globalização',work:'Neoliberalismo e globalização',pages:[]},
      {key:'hist-sul6',weeks:[6],name:'Brasil, BRICS e Sul Global na nova ordem mundial',work:'Brasil, BRICS e Sul Global na nova ordem mundial',pages:[]},
      {key:'hist-ciclo',weeks:[6],name:'Ciclo de debates',work:'Organizar argumentos, exemplos e fontes sobre os temas estudados.',pages:[]}
    ]},
    {serie:3,school:'EFG',subject:'Filosofia',book:'Livro didático',pages:[],tasks:[
      {key:'filo-textos1e2',weeks:[1,2],name:'Estética, natureza e circulação das imagens',work:'Estética, natureza e circulação das imagens',pages:[]},
      {key:'filo-jonas3',weeks:[3],name:'Hans Jonas: poder técnico e responsabilidade pelo futuro',work:'Hans Jonas: poder técnico e responsabilidade pelo futuro',pages:[]},
      {key:'filo-krenak4',weeks:[4],name:'Colonialidade e natureza: território e crítica de Krenak',work:'Colonialidade e natureza: território e crítica de Krenak',pages:[]},
      {key:'filo-mbembe5',weeks:[5],name:'Achille Mbembe',work:'Achille Mbembe',pages:[]},
      {key:'filo-modelos6',weeks:[6],name:'Sociedade e natureza: modelos socioeconômicos e limites éticos',work:'Sociedade e natureza: modelos socioeconômicos e limites éticos',pages:[]}
    ]},
    {serie:3,school:'EFG',subject:'Sociologia',book:'Livro didático',pages:['281','289','293'],tasks:[
      {key:'soc-textos1e2',weeks:[1,2],name:'Cidadania, direitos humanos e enfrentamento do racismo',work:'Cidadania, direitos humanos e enfrentamento do racismo',pages:[]},
      {key:'soc-genero3',weeks:[3],name:'Gênero, identidade e reconhecimento',work:'Gênero, identidade e reconhecimento',pages:[]},
      {key:'soc-originarios4',weeks:[4],name:'Povos indígenas e território',work:'Povos indígenas e território',pages:[]},
      {key:'soc-movimentos5',weeks:[5],name:'Movimentos sociais contemporâneos',work:'Movimentos sociais contemporâneos',pages:[]},
      {key:'soc-proposta6',weeks:[6],name:'Direitos humanos na escola e na comunidade',work:'Direitos humanos na escola e na comunidade',pages:[]}
    ]},
    {serie:9,school:'CEPI',subject:'História',book:'Revisa Goiás (material de referência 2025)',tasks:[
      {key:'hist-textos1e2',weeks:[1,2],name:'Caderno · Redemocratização, Constituição e Nova República',work:'Textos unificados das semanas 1 e 2; linha do tempo e três questões.',pages:['10–13']},
      {key:'hist-guerra3',weeks:[3],name:'Caderno · Guerra Fria: bipolaridade e conflitos',work:'Texto, mapa de blocos, síntese e três questões.',pages:['13–15']},
      {key:'hist-fim4',weeks:[4],name:'Caderno · Fim da Guerra Fria e ordem mundial',work:'Texto, esquema das reformas soviéticas e três questões.',pages:['15–16']},
      {key:'hist-asia5',weeks:[5],name:'Caderno · Descolonização da Ásia e Bandung',work:'Texto, mapa, debate sobre autodeterminação e três questões.',pages:['16–17']},
      {key:'hist-africa6',weeks:[6],name:'Caderno · Descolonização africana e pan-africanismo',work:'Texto, mapa e quadro de lideranças, debate e três questões.',pages:['17–18']}
    ]}
  ];
  const normalize=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim().replace(/\s+/g,' ');
  const slug={'História':'historia','Filosofia':'filosofia','Sociologia':'sociologia'};
  const weekId=(s,w)=>'s'+s.serie+'-'+slug[s.subject]+'-semana-'+w;
  const pageTitle=pages=>pages.length<=1?pages.join(''):pages.slice(0,-1).join(', ')+' e '+pages[pages.length-1];
  function matches(t,s){
    const unit=normalize(t.unidade);
    const school=s.school==='EFG'?(unit==='EFG'||unit.includes('ESCOLA DO FUTURO')):(unit.includes('CEPI')||unit.includes('MARAJO'));
    return school&&t.ativo!==false&&Number.parseInt(t.serie||t.nome,10)===s.serie&&normalize(t.disciplina)===normalize(s.subject);
  }
  function equivalent(a,entry,s){
    const sameTitle=normalize(a.nome)===normalize(entry.name);
    const sameKey=a.origem?.checklistKey===entry.key;
    const isSpecial=/^(Pesquisa|Ciclo de debates)/i.test(entry.name);
    const sameNotebook=!isSpecial&&a.origem?.weekId===weekId(s,entry.weeks[0])&&
      (a.origem?.kind==='book'||a.origem?.panel==='notebook')&&
      /CADERNO|TEXTO UNIFICADO|ATIVIDADE DO LIVRO|PESQUISA/.test(normalize(a.nome));
    return sameTitle||sameKey||sameNotebook;
  }
  function plan(data){
    if(!data?.turmas||!Array.isArray(data.activities))return {toAdd:[],toUpdate:[],toRemove:[],existing:0,classes:0};
    const toAdd=[],toUpdate=[],toRemove=[];let existing=0,classes=0;
    for(const turma of Object.values(data.turmas)){
      for(const set of sets){
        if(set.serie===9||!matches(turma,set))continue;
        classes++;
        for(const entry of set.tasks){
          const keyed=data.activities.filter(a=>a.turmaId===turma.id&&a.origem?.checklistKey===entry.key);
          if(keyed.length){
            existing+=keyed.length;
            for(const a of keyed){
              const origin={...(a.origem||{}),weekId:weekId(set,entry.weeks[0]),title:entry.name,panel:'notebook',kind:'unit',checklistKey:entry.key,pageReferences:entry.pages.slice()};
              if(a.nome!==entry.name||a.origem?.title!==entry.name||JSON.stringify(a.origem?.pageReferences||[])!==JSON.stringify(entry.pages))toUpdate.push({id:a.id,nome:entry.name,origem:origin});
            }
          }else if(data.activities.some(a=>a.turmaId===turma.id&&equivalent(a,entry,set))){existing++;}
          else toAdd.push({id:'caderno-2026b4-'+turma.id+'-s'+set.serie+'-'+slug[set.subject]+'-'+entry.key,
            turmaId:turma.id,bimestre:4,nome:entry.name,tipo:'Outra',data:'2026-11-06',valorMax:10,peso:1,checklist:false,extra:false,rascunho:true,
            origem:{weekId:weekId(set,entry.weeks[0]),title:entry.name,panel:'notebook',kind:'unit',checklistKey:entry.key,pageReferences:entry.pages.slice()}});
        }
        if(set.serie===2&&turma.nome==='2ªA'&&turma.disciplina==='Filosofia'){
          const accidentalTitle='Execução · Livro: páginas 13, 59, 65, 66 e 67';
          for(const a of data.activities.filter(a=>a.turmaId===turma.id&&a.nome===accidentalTitle&&a.tipo==='Outra'&&a.data==='2026-11-06'&&!a.checklist&&!a.registroExecucao)){
            const linked=Object.values(data.scores||{}).some(scores=>scores&&Object.prototype.hasOwnProperty.call(scores,a.id));
            if(!linked)toRemove.push(a.id);
          }
        }
        if(set.pages.length){
          const title='Execução · Livro: páginas '+pageTitle(set.pages);
          for(const a of data.activities.filter(a=>a.turmaId===turma.id&&/^Execução · Livro: páginas/i.test(a.nome||'')))
            if(a.nome!==title)toUpdate.push({id:a.id,nome:title});
        }
      }
    }
    return {toAdd,toUpdate,toRemove,existing,classes};
  }
  function apply(data){
    const proposed=plan(data);
    for(const a of proposed.toAdd)data.activities.push(a);
    for(const id of proposed.toRemove||[]){
      const linked=Object.values(data.scores||{}).some(scores=>scores&&Object.prototype.hasOwnProperty.call(scores,id));
      if(!linked)data.activities=data.activities.filter(a=>a.id!==id);
    }
    for(const change of proposed.toUpdate){
      const current=data.activities.find(a=>a.id===change.id);
      if(!current)continue;
      if(change.nome)current.nome=change.nome;
      if(change.origem)current.origem={...(current.origem||{}),...change.origem};
    }
    return {added:proposed.toAdd.length,updated:proposed.toUpdate.length,removed:proposed.toRemove?.length||0,existing:proposed.existing,classes:proposed.classes};
  }
  function render(root=document){
    if(!root?.querySelector)return;
    for(const set of sets){
      for(let wk=1;wk<=6;wk++){
        const tasks=set.tasks.filter(t=>t.weeks.includes(wk));
        if(!tasks.length)continue;
        const card=root.querySelector('#'+weekId(set,wk));
        if(!card||card.querySelector('[data-checklist-outras-turmas]'))continue;
        const box=document.createElement('section');box.className='malu-checklist-1a';box.dataset.checklistOutrasTurmas='true';
        const heading=document.createElement('h4');heading.textContent='Checklist do caderno · '+(set.serie===9?'9º ano':set.serie+'ª série');
        const list=document.createElement('ul');list.className='malu-checklist-tarefas';
        for(const task of tasks){const li=document.createElement('li');li.textContent='☐ '+task.work;list.append(li);}
        box.append(heading,list);
        const pages=[...new Set([...(set.pages||[]),...tasks.flatMap(t=>t.pages||[])])];
        const p=document.createElement('p');p.className='malu-checklist-paginas';
        p.textContent=pages.length?set.book+' — páginas do checklist da disciplina: '+pages.join(', '):set.book+' — sem páginas indicadas neste checklist';
        box.append(p);
        const plan=card.querySelector('.plan-grid');if(plan)card.insertBefore(box,plan);else card.append(box);
      }
    }
  }
  globalThis.MaluChecklistOutrasTurmas={sets,plan,apply,render};
})();
