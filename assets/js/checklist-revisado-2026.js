/* Checklists validados em 06/11/2026 a partir dos quadros da professora.
 * Execução de caderno/livro NÃO é nota; somente pesquisas/projetos geram campos numéricos.
 * A reconciliação é aditiva e preserva integralmente qualquer atividade com nota registrada.
 */
(() => {
  'use strict';
  const previousFirst=globalThis.MaluChecklistPrimeiraSerie;
  const previousOther=globalThis.MaluChecklistOutrasTurmas;
  const curriculum=[
    {serie:1,subject:'História',pages:['83','85','92','93'],topics:[
      'Formação do mundo medieval e sociedade feudal',
      'Religiões, culturas e Mediterrâneo medieval',
      'África medieval e redes transaarianas',
      'Transformações da Baixa Idade Média',
      'Crise do século XIV e transformações do mundo medieval'
    ],project:{title:'Pesquisa · Brinquedos autômatos',description:'Investigar mecanismos, movimento e relação entre técnica e sociedade.',url:'https://www.google.com/search?q=brinquedos+aut%C3%B4matos+hist%C3%B3ria+ci%C3%AAncia'}},
    {serie:1,subject:'Filosofia',pages:[],topics:[
      'Cidadania, direitos humanos e diversidade',
      'Kant: dignidade, autonomia e instrumentalização',
      'Honneth: reconhecimento e relações afetivas',
      'Dignidade e reconhecimento',
      'Honneth: luta por reconhecimento e justiça social'
    ]},
    {serie:1,subject:'Sociologia',pages:['44','45','118','134'],topics:[
      'Ação social, racionalização e modernidade',
      'Poder e dominação',
      'Estado moderno',
      'Violências contemporâneas',
      'Violências simbólica e institucional: poder e direitos'
    ]},
    {serie:2,subject:'História',pages:['273','275','286','295'],topics:[
      'Abolição, pós-abolição e formação da República',
      'Primeira República',
      'A República contestada',
      'Crise oligárquica',
      'Era Vargas'
    ],project:{title:'Pesquisa · Guerras brasileiras',description:'Pesquisar contexto, participantes, causas e consequências dos conflitos.',url:'https://www.google.com/search?q=guerras+brasileiras+Paraguai+Canudos+Contestado+fontes'}},
    {serie:2,subject:'Filosofia',pages:['13','59','65','66'],topics:[
      'Racionalidade instrumental e ética socioambiental',
      'Filosofias ameríndias: território, autoria e perspectivas',
      'Ailton Krenak',
      'Justiça socioambiental',
      'Ética, consumo e outras relações com a natureza'
    ]},
    {serie:2,subject:'Sociologia',pages:['118','168','182','190','204'],topics:[
      'Liberdade, desigualdades e cidadania no pós-abolição',
      'Quem era reconhecido como cidadão? Racismo, estigma e exclusão',
      'Modernização urbana e exclusão',
      'Poder e controle social',
      'Democracia em disputa'
    ]},
    {serie:3,subject:'História',pages:['382','384','385','394–397'],topics:[
      'Redemocratização e Constituição de 1988',
      'Nova República',
      'Movimentos sociais e cidadania',
      'Neoliberalismo e globalização',
      'Brasil, BRICS e Sul Global na nova ordem mundial'
    ],project:{title:'Projeto · Ciclo de debates',description:'Organizar argumentos, exemplos e fontes sobre os temas estudados.',url:'https://www.google.com/search?q=como+preparar+argumentos+para+debate+escolar+fontes+confi%C3%A1veis'}},
    {serie:3,subject:'Filosofia',pages:[],topics:[
      'Estética, natureza e circulação das imagens',
      'Hans Jonas: poder técnico e responsabilidade pelo futuro',
      'Colonialidade e natureza: território e crítica de Krenak',
      'Achille Mbembe',
      'Sociedade e natureza: modelos socioeconômicos e limites éticos'
    ]},
    {serie:3,subject:'Sociologia',pages:['281','293'],topics:[
      'Cidadania, direitos humanos e enfrentamento do racismo',
      'Gênero, identidade e reconhecimento',
      'Povos indígenas e território',
      'Movimentos sociais contemporâneos',
      'Direitos humanos na escola e na comunidade'
    ]}
  ];
  const weeks=[[1,2],[3],[4],[5],[6]];
  const periodLabels=['S1+2','S3','S4','S5','S6'];
  const slug={História:'historia',Filosofia:'filosofia',Sociologia:'sociologia'};
  const normalize=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('pt-BR').replace(/[^A-Z0-9]+/g,' ').trim();
  const legacySets=[...(previousFirst?.sets||[]).map(s=>({...s,serie:1})),...(previousOther?.sets||[])];
  function buildEntries(group) {
    const old=legacySets.find(s=>s.serie===group.serie&&normalize(s.subject)===normalize(group.subject));
    const tasks=group.topics.map((title,i)=>{
      const legacy=(old?.tasks||[]).find(t=>t.weeks?.[0]===weeks[i][0]&&!/^(Pesquisa|Atividade · Ciclo)/i.test(t.name));
      return {key:'week-'+(i+1),kind:'execution',weeks:weeks[i],label:periodLabels[i],
        title,name:'Execução · '+periodLabels[i]+' · '+title,
        aliases:[legacy?.key].filter(Boolean),legacyNames:[legacy?.name].filter(Boolean)};
    });
    if(group.pages.length)tasks.push({
      key:'pages',kind:'execution',weeks:[1,2,3,4,5,6],label:'Livro',
      title:'Páginas do livro didático',name:'Execução · Livro: páginas '+group.pages.join(', '),
      aliases:[],legacyNames:[]
    });
    if(group.project){
      const oldProject=(old?.tasks||[]).find(t=>/^(Pesquisa|Atividade · Ciclo)/i.test(t.name));
      tasks.push({key:'project',kind:'assessment',weeks:[6],label:'Projeto / pesquisa',
        title:group.project.title,name:group.project.title,description:group.project.description,url:group.project.url,
        aliases:[oldProject?.key].filter(Boolean),legacyNames:[oldProject?.name].filter(Boolean)});
    }
    return tasks;
  }
  curriculum.forEach(g=>{g.entries=buildEntries(g);});
  function matchClass(t,g){
    const unit=normalize(t.unidade);
    return t.ativo!==false&&(unit==='EFG'||unit.includes('ESCOLA DO FUTURO'))&&
      Number.parseInt(t.serie||t.nome,10)===g.serie&&normalize(t.disciplina)===normalize(g.subject);
  }
  function equivalent(a,e){
    const title=normalize(a.nome);
    const known=[e.key,...e.aliases];
    const key=a.origem?.checklistKey;
    if(key&&known.includes(key))return true;
    return [e.name,e.title,...e.legacyNames].some(value=>normalize(value)===title);
  }
  function recorded(data,id){
    return Object.values(data.scores||{}).some(scores=>
      scores&&Object.prototype.hasOwnProperty.call(scores,id)&&scores[id]!=null);
  }
  function weekId(g,e){return 's'+g.serie+'-'+slug[g.subject]+'-semana-'+e.weeks[0];}
  function origin(g,e,old){
    return {...(old||{}),weekId:weekId(g,e),title:e.title,
      panel:'notebook',kind:'unit',checklistKey:e.key,
      pageReferences:g.pages.slice(),...(e.url?{url:e.url}:{})};
  }
  function entryId(g,t,e){
    return 'checklist-b4-2026-'+t.id+'-s'+g.serie+'-'+slug[g.subject]+'-'+e.key;
  }
  function proposal(data,allowed){
    const toAdd=[],toUpdate=[];let existing=0,classes=0,protectedGrades=0;
    if(!data?.turmas||!Array.isArray(data.activities))return {toAdd,toUpdate,existing,classes,protectedGrades};
    for(const t of Object.values(data.turmas))for(const g of curriculum){
      if(!allowed.includes(g.serie)||!matchClass(t,g))continue;
      classes++;
      for(const e of g.entries){
        const candidates=data.activities.filter(a=>a.turmaId===t.id&&equivalent(a,e));
        if(!candidates.length){
          toAdd.push({id:entryId(g,t,e),turmaId:t.id,bimestre:4,nome:e.name,tipo:'Outra',
            data:'2026-11-06',valorMax:e.kind==='execution'?1:10,peso:1,
            checklist:e.kind==='execution',registroExecucao:e.kind==='execution',
            extra:false,rascunho:true,origem:origin(g,e)});
          continue;
        }
        existing++;
        const gradeProtected=candidates.some(a=>recorded(data,a.id));
        if(gradeProtected){protectedGrades++;continue;}
        const old=candidates.find(a=>(a.id||'').startsWith('caderno-')||
          (a.id||'').startsWith('checklist-b4-2026-'));
        if(!old)continue; // Nunca alterar registros manuais.
        const next={...old,nome:e.name,checklist:e.kind==='execution',
          registroExecucao:e.kind==='execution',valorMax:e.kind==='execution'?1:old.valorMax,
          rascunho:true,origem:origin(g,e,old.origem)};
        if(JSON.stringify(next)!==JSON.stringify(old))toUpdate.push(next);
      }
    }
    return {toAdd,toUpdate,existing,classes,protectedGrades};
  }
  function applyGroup(data,allowed){
    const p=proposal(data,allowed),position=new Map(data.activities.map((a,i)=>[a.id,i]));
    for(const a of p.toUpdate){const i=position.get(a.id);if(i!==undefined&&!recorded(data,a.id))data.activities[i]=a;}
    for(const a of p.toAdd)if(!position.has(a.id)&&!data.activities.some(x=>x.turmaId===a.turmaId&&equivalent(x,{key:a.origem.checklistKey,aliases:[],name:a.nome,title:a.origem.title,legacyNames:[]})))data.activities.push(a);
    return {added:p.toAdd.length,updated:p.toUpdate.length,existing:p.existing,classes:p.classes,protectedGrades:p.protectedGrades};
  }
  function renderGroup(root,allowed){
    if(!root?.querySelector)return;
    for(const g of curriculum.filter(g=>allowed.includes(g.serie))){
      for(let w=1;w<=6;w++){
        const card=root.querySelector('#s'+g.serie+'-'+slug[g.subject]+'-semana-'+w);
        if(!card||card.querySelector('[data-checklist-revisado]'))continue;
        card.querySelector('[data-malu-checklist-1a]')?.remove();
        card.querySelector('[data-checklist-outras-turmas]')?.remove();
        const section=document.createElement('section');
        section.className='malu-checklist-1a';section.dataset.checklistRevisado='true';
        const title=document.createElement('h4');
        title.textContent='Execução · '+g.serie+'ª série · '+g.subject;section.append(title);
        const list=document.createElement('ul');list.className='malu-checklist-tarefas';
        for(const e of g.entries.filter(x=>x.kind!=='execution'||x.key!=='pages')){
          if(!e.weeks.includes(w))continue;
          const li=document.createElement('li');li.textContent='☐ '+e.label+' — '+e.title;
          if(e.kind==='assessment'&&e.description)li.append(document.createTextNode(' · '+e.description));
          if(e.url){const a=document.createElement('a');a.href=e.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' · Orientação / QR';li.append(a);}
          list.append(li);
        }
        section.append(list);
        const page=document.createElement('p');page.className='malu-checklist-paginas';
        page.textContent=g.pages.length?'Livro didático (referências do bimestre): '+g.pages.map(p=>'p. '+p).join(' · '):
          'Livro didático: nenhuma página indicada neste checklist.';
        section.append(page);
        const plan=card.querySelector('.plan-grid');if(plan)card.insertBefore(section,plan);else card.append(section);
      }
    }
    if(!document.getElementById('checklist-revisado-css')){
      const css=document.createElement('style');css.id='checklist-revisado-css';
      css.textContent='.malu-checklist-1a{margin:1rem 0;padding:.85rem 1rem;border:1px solid #bda2c4;border-radius:12px;background:#faf6fc}.malu-checklist-1a h4{margin:0 0 .55rem;font-size:1rem}.malu-checklist-tarefas{margin:0;padding-left:1.25rem}.malu-checklist-tarefas li{margin:.4rem 0}.malu-checklist-paginas{border-top:1px solid #dccddd;padding-top:.6rem;margin:.65rem 0 0;font-weight:600}';
      document.head.append(css);
    }
  }
  globalThis.MaluChecklistPrimeiraSerie={
    sets:curriculum.filter(g=>g.serie===1),
    plan:data=>proposal(data,[1]),apply:data=>applyGroup(data,[1]),
    render:root=>renderGroup(root,[1])
  };
  globalThis.MaluChecklistOutrasTurmas={
    sets:curriculum.filter(g=>g.serie===2||g.serie===3),
    plan:data=>proposal(data,[2,3]),apply:data=>applyGroup(data,[2,3]),
    render(root){
      previousOther?.render(root); // Manter 9º ano como estava.
      renderGroup(root,[2,3]);
    }
  };
})();
