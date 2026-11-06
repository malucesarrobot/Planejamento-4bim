/* Checklist de cadernos — 1ª série, 4º bimestre/2026. Sem nomes ou notas de alunos. */
(() => {
  'use strict';
  const sets = [
    {subject:'História', tasks:[
      {key:'hist-texto-1-2',weeks:[1,2],name:'Caderno · Texto unificado — Formação do mundo medieval e sociedade feudal',
        task:'Texto unificado das semanas 1 e 2; registro do conteúdo, quadro e questões.',pages:[]},
      {key:'hist-religioes-3',weeks:[3],name:'Caderno · Religiões, culturas e Mediterrâneo medieval',
        task:'Texto; quadro comparativo; questões 1, 2 e 3.',pages:['80','83']},
      {key:'hist-africa-4',weeks:[4],name:'Caderno · África medieval e redes transaarianas',
        task:'Texto sobre Gana, Mali, Sahel e circulação de saberes; quadro e questões 1, 2 e 3.',pages:['85']},
      {key:'hist-baixa-5',weeks:[5],name:'Caderno · Transformações da Baixa Idade Média',
        task:'Texto, quadro e questões 1, 2 e 3.',pages:['93']},
      {key:'hist-crise-6',weeks:[6],name:'Caderno · Crise do século XIV e transformações',
        task:'Texto; quadro de síntese; questões 1, 2 e 3.',pages:['92']},
      {key:'hist-automatos',weeks:[6],name:'Pesquisa · Brinquedos autômatos',
        task:'Pesquisa: mecanismos, contextos históricos, usos e fontes. Registrar os resultados no caderno.',pages:[]}
    ]},
    {subject:'Filosofia',tasks:[
      {key:'filo-texto-1-2',weeks:[1,2],name:'Caderno · Texto unificado — Cidadania, direitos humanos e diversidade',
        task:'Texto unificado das semanas 1 e 2; síntese, quadro conceitual e questão de debate.',pages:[]},
      {key:'filo-kant-3',weeks:[3],name:'Caderno · Kant: dignidade, autonomia e instrumentalização',
        task:'Texto de Kant; síntese e questões sobre dignidade, autonomia e regra universal.',pages:[]},
      {key:'filo-honneth-4',weeks:[4],name:'Caderno · Honneth: reconhecimento e relações afetivas',
        task:'Texto sobre reconhecimento, cuidado e autoconfiança; esquema e pergunta.',pages:[]},
      {key:'filo-honneth-5',weeks:[5],name:'Caderno · Honneth: direitos e estima social',
        task:'Texto, quadro comparativo e debate sobre direitos e respeito social.',pages:[]},
      {key:'filo-honneth-6',weeks:[6],name:'Caderno · Dignidade e luta por reconhecimento',
        task:'Síntese e debate: dignidade, reconhecimento e justiça social.',pages:[]}
    ]},
    {subject:'Sociologia',tasks:[
      {key:'soc-texto-1-2',weeks:[1,2],name:'Caderno · Texto unificado — Ação social, racionalização e modernidade',
        task:'Texto unificado das semanas 1 e 2; esquema, conceitos e pergunta.',pages:[]},
      {key:'soc-poder-3',weeks:[3],name:'Caderno · Poder e dominação',
        task:'Texto; esquema de dominação tradicional, carismática e racional-legal; pergunta.',pages:['118']},
      {key:'soc-estado-4',weeks:[4],name:'Caderno · Estado moderno',
        task:'Texto; esquema sobre Estado e dominação racional-legal; pergunta.',pages:['134']},
      {key:'soc-violencias-5',weeks:[5],name:'Caderno · Violências contemporâneas',
        task:'Texto; esquema sobre violências física e psicológica; pergunta e debate.',pages:[]},
      {key:'soc-violencias-6',weeks:[6],name:'Caderno · Violências simbólica e institucional',
        task:'Texto; quadro sobre mecanismos, evidências e mudanças possíveis; pergunta.',pages:[]}
    ]}
  ];
  const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim().replace(/\s+/g,' ');
  const getId=(subject,week)=>'s1-'+({História:'historia',Filosofia:'filosofia',Sociologia:'sociologia'})[subject]+'-semana-'+week;
  const firstYear=t=>Number.parseInt(t.serie||t.nome,10)===1 && (norm(t.unidade)==='EFG'||norm(t.unidade).includes('ESCOLA DO FUTURO')) && t.ativo!==false;
  function plan(data){
    if(!data?.turmas||!Array.isArray(data.activities))return {toAdd:[],existing:0,classes:0};
    const additions=[];let existing=0,classes=0;
    for(const turma of Object.values(data.turmas)){
      if(!firstYear(turma))continue;
      const set=sets.find(s=>norm(s.subject)===norm(turma.disciplina));
      if(!set)continue;
      classes++;
      for(const entry of set.tasks){
        const weekId=getId(set.subject,entry.weeks[0]);
        const found=data.activities.some(a=>a.turmaId===turma.id && (
          a.origem?.checklistKey===entry.key || norm(a.nome)===norm(entry.name) ||
          // Se a tarefa já foi cadastrada pelo Caderno da Professora, mantê-la.
          (a.origem?.weekId===weekId && norm(a.nome).includes(norm(entry.name.replace(/^Caderno · /,'').replace(/^Pesquisa · /,''))))
        ));
        if(found){existing++;continue;}
        additions.push({id:'caderno-1a-2026b4-'+turma.id+'-'+entry.key,
          turmaId:turma.id,bimestre:4,nome:entry.name,tipo:'Outra',
          data:'2026-11-05',valorMax:10,peso:1,
          checklist:false,extra:false,rascunho:true,
          origem:{weekId,title:entry.name,panel:'notebook',kind:'unit',checklistKey:entry.key,
            pageReferences:entry.pages.slice()}});
      }
    }
    return {toAdd:additions,existing,classes};
  }
  function apply(data){
    const result=plan(data);
    for(const a of result.toAdd)data.activities.push(a);
    return {added:result.toAdd.length,existing:result.existing,classes:result.classes};
  }
  function render(root=document){
    if(!root?.querySelector)return;
    for(const set of sets){
      const byWeek=new Map();
      for(const task of set.tasks)for(const week of task.weeks){
        if(!byWeek.has(week))byWeek.set(week,[]);
        byWeek.get(week).push(task);
      }
      for(const [week,tasks] of byWeek){
        const card=root.querySelector('#'+getId(set.subject,week));
        if(!card || card.querySelector('[data-malu-checklist-1a]'))continue;
        const box=document.createElement('section');
        box.className='malu-checklist-1a';box.dataset.maluChecklist1a='true';
        const title=document.createElement('h4');title.textContent='Checklist do caderno · 1ª série';
        const ul=document.createElement('ul');ul.className='malu-checklist-tarefas';
        for(const entry of tasks){
          const li=document.createElement('li');
          li.textContent='☐ '+entry.task;ul.append(li);
        }
        box.append(title,ul);
        const pages=[...new Set(tasks.flatMap(task=>task.pages))];
        const pageRow=document.createElement('p');pageRow.className='malu-checklist-paginas';
        pageRow.textContent=pages.length?'Livro didático — páginas: '+pages.map(x=>'p. '+x).join(' · '):'Livro didático — sem páginas adicionais indicadas neste checklist';
        box.append(pageRow);
        const plan=card.querySelector('.plan-grid');
        if(plan)card.insertBefore(box,plan);else card.append(box);
      }
    }
    if(!document.getElementById('malu-checklist-1a-css')){
      const style=document.createElement('style');style.id='malu-checklist-1a-css';
      style.textContent='.malu-checklist-1a{margin:1rem 0;padding:.85rem 1rem;border:1px solid currentColor;border-radius:12px;background:rgba(128,128,128,.055)}.malu-checklist-1a h4{margin:0 0 .6rem;font-size:1rem}.malu-checklist-tarefas{margin:0;padding-left:1.25rem}.malu-checklist-tarefas li{margin:.35rem 0}.malu-checklist-paginas{border-top:1px solid rgba(128,128,128,.25);padding-top:.6rem;margin:.7rem 0 0;font-weight:600}';
      document.head.append(style);
    }
  }
  globalThis.MaluChecklistPrimeiraSerie={sets,plan,apply,render};
})();
