(function(){
'use strict';
const classes=[['9a','9º A'],['9b','9º B'],['9c','9º C']];
const root=document.getElementById('app');if(!root)return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const area=el('section','card');area.id='h9Teacher';
area.appendChild(el('h2','','História — 9º ano · 4º bimestre'));
area.appendChild(el('p','sub','Acompanhe os envios por estudante, turma e semana. Confira os nomes informados com a chamada oficial.'));
const controls=el('div','h9-controls'),select=el('select');select.id='h9TeacherClass';select.setAttribute('aria-label','Turma de História do 9º ano');
classes.forEach(([id,name])=>select.add(new Option(name,id)));controls.appendChild(select);
const linkButton=el('button','primary','Obter link da turma');linkButton.type='button';controls.appendChild(linkButton);
const refresh=el('button','','Atualizar turma');refresh.type='button';controls.appendChild(refresh);
const exportButton=el('button','','Exportar CSV');exportButton.type='button';exportButton.disabled=true;controls.appendChild(exportButton);area.appendChild(controls);
const linkWrap=el('div','h9-linkwrap');linkWrap.hidden=true;
linkWrap.appendChild(el('label','','Link para enviar aos estudantes'));
const linkInput=el('input');linkInput.id='h9StudentLink';linkInput.readOnly=true;linkWrap.appendChild(linkInput);
const copyButton=el('button','','Copiar link');copyButton.type='button';linkWrap.appendChild(copyButton);area.appendChild(linkWrap);
const message=el('p','status','Aguardando autenticação docente.');message.id='h9TeacherStatus';message.setAttribute('role','status');area.appendChild(message);
const summary=el('div','h9-metrics');area.appendChild(summary);
const list=el('div','tablewrap');list.id='h9Results';area.appendChild(list);
root.insertBefore(area,root.querySelector('.grid'));
const style=document.createElement('style');
style.textContent=[
'#h9Teacher .h9-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}',
'#h9Teacher .h9-controls select{width:auto;min-width:140px;max-width:180px}',
'#h9Teacher button:disabled{opacity:.5;cursor:not-allowed}',
'#h9Teacher .h9-linkwrap{padding:11px;border-radius:12px;background:#eef5ef;border:1px solid #bed4c2}',
'#h9Teacher .h9-linkwrap[hidden]{display:none}',
'#h9Teacher .h9-linkwrap input{margin-bottom:8px}',
'#h9Teacher .h9-metrics{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:9px;margin:14px 0}',
'#h9Teacher .h9-metrics>div{padding:10px;border:1px solid #dce6df;border-radius:12px;background:#f8fbf7}',
'#h9Teacher .h9-metrics strong{display:block;font-size:1.5rem;color:#215747}',
'#h9Teacher .h9-metrics span{font-size:.75rem;color:#50665c}',
'#h9Teacher .h9-badge{font-size:.77rem;background:#edf5eb;padding:4px 7px;border-radius:8px;display:inline-block;white-space:nowrap}',
'#h9Teacher .h9-badge.sent{background:#d5f1e2;color:#174e38}',
'#h9Teacher .h9-badge.draft{background:#fff1d9;color:#6c531c}',
'#h9Teacher td{min-width:85px;white-space:normal}',
'#h9Teacher details{margin:6px 0}#h9Teacher summary{font-size:.8rem;cursor:pointer}',
'#h9Teacher .h9-written{white-space:pre-wrap;background:#f5f7f4;border-left:3px solid #699d80;padding:10px;margin:6px 0;font-size:.9rem;line-height:1.45}',
'#h9Teacher .h9-answer{font-size:.81rem;padding:5px 0;border-bottom:1px dotted #c8d8ce}',
'#h9Teacher .h9-overflow{overflow-x:auto}',
'@media(max-width:740px){#h9Teacher .h9-metrics{grid-template-columns:repeat(2,minmax(100px,1fr))}#h9Teacher .h9-controls>*{width:100%!important;max-width:none!important}}'
].join('\n');document.head.appendChild(style);
let activeRef=null,activeCb=null,activeToken='',activeClass='',students=[];
const bank=window.PERCURSOS_H9;
const setMessage=(txt,error)=>{message.textContent=txt;message.className='status'+(error?' err':' ok')};
function unlisten(){if(activeRef&&activeCb)activeRef.off('value',activeCb);activeRef=null;activeCb=null}
function authorized(){const user=firebase.auth().currentUser;return user&&ALLOWED_EMAILS.has((user.email||'').toLowerCase())}
function metric(n,label){const d=el('div');d.appendChild(el('strong','',String(n)));d.appendChild(el('span','',label));summary.appendChild(d)}
function scoreFor(w,sub){if(!w||!sub?.answers)return null;return w.questions.every((q,i)=>Number.isInteger(sub.answers['a'+i])&&sub.answers['a'+i]>=0&&sub.answers['a'+i]<q.o.length)?w.questions.reduce((n,q,i)=>n+(q.a===sub.answers['a'+i]?1:0),0):null}
function weekStatus(s,id){const sub=s.submissions?.[id];if(sub?.writing!==undefined)return {kind:'sent',label:'Enviou',data:sub};if(s.started?.[id]===true)return {kind:'draft',label:'Iniciou'};return {kind:'none',label:'Sem registro'}}
function submissionDetails(w,sub){
 const d=el('details'),score=scoreFor(w,sub);
 d.appendChild(el('summary','','Ver respostas e produção'+(sub?.submittedAt?' · '+new Date(sub.submittedAt).toLocaleString('pt-BR'):'')));
 w.questions.forEach((q,i)=>{const value=sub.answers?.['a'+i],ans=Number.isInteger(value)?q.o[value]:'Sem resposta';d.appendChild(el('div','h9-answer',(i+1)+'. '+ans+(q.a===value?' (correta)':' (rever)')))});
 d.appendChild(el('p','sub','Produção escrita — requer avaliação docente'));
 d.appendChild(el('div','h9-written',sub.writing||''));
 if(score!==null&&sub.score!==score)d.appendChild(el('p','status err','Escore enviado divergente; conferência do painel recalculada.'));
 return d
}
function render(){
 summary.replaceChildren();list.replaceChildren();
 const began=students.filter(s=>Object.values(s.started||{}).some(v=>v===true)||Object.keys(s.submissions||{}).length>0).length;
 const sent=students.reduce((n,s)=>n+Object.values(s.submissions||{}).filter(v=>v?.writing!==undefined).length,0);
 const full=students.filter(s=>bank.weeks.every(w=>weekStatus(s,w.id).kind==='sent')).length;
 metric(students.length,'Identificados');metric(began,'Iniciaram atividades');metric(sent,'Atividades enviadas');metric(full,'Concluíram 6 trilhas');
 exportButton.disabled=!students.length;
 if(!students.length){list.appendChild(el('p','sub',activeToken?'Ainda não há estudantes identificados nesta turma.':'Selecione ou gere um link para começar.'));return}
 const wrap=el('div','h9-overflow'),table=el('table'),thead=el('thead'),tr=el('tr');
 ['Estudante','S1','S2','S3','S4','S5','S6','Total'].forEach(txt=>tr.appendChild(el('th','',txt)));thead.appendChild(tr);table.appendChild(thead);
 const tbody=el('tbody');
 for(const s of students){
  const row=el('tr'),name=el('td');name.appendChild(el('strong','',s.profile.name||'Sem identificação'));row.appendChild(name);
  let done=0,earned=0;
  for(const w of bank.weeks){
   const td=el('td'),st=weekStatus(s,w.id);
   if(st.kind==='sent'){done++;const sc=scoreFor(w,st.data);if(sc!==null)earned+=sc}
   td.appendChild(el('span','h9-badge '+st.kind,st.kind==='sent'?'Enviou · '+(scoreFor(w,st.data)??'?')+'/4':st.label));
   if(st.kind==='sent')td.appendChild(submissionDetails(w,st.data));row.appendChild(td)
  }
  row.appendChild(el('td','',done+'/6 · '+earned+' acertos em '+done*4+' questões'));tbody.appendChild(row)
 }
 table.appendChild(tbody);wrap.appendChild(table);list.appendChild(wrap)
}
function attach(code,token){
 unlisten();activeToken=token;activeClass=code;
 const u=new URL('index.html',location.href);if(!token.startsWith('n9_'))u.searchParams.set('etapa','9');u.hash=new URLSearchParams({turma:token}).toString();linkInput.value=u.href;linkWrap.hidden=false;
 const ref=firebase.database().ref('ninthClasses/'+token+'/students');activeRef=ref;
 activeCb=ss=>{
  if(select.value!==code)return;
  students=Object.entries(ss.val()||{}).filter(([uid,v])=>v?.profile&&typeof v.profile.name==='string').map(([uid,v])=>Object.assign({uid},v)).sort((a,b)=>a.profile.name.localeCompare(b.profile.name,'pt-BR'));
  render();setMessage('Acompanhamento em tempo real · '+classes.find(x=>x[0]===code)[1]+' · atualizado às '+new Date().toLocaleTimeString('pt-BR'))
 };
 ref.on('value',activeCb,e=>setMessage('Leitura não autorizada ou sem conexão. Confira as regras do Firebase.',true))
}
async function readExisting(){
 unlisten();activeToken='';activeClass=select.value;students=[];linkWrap.hidden=true;render();
 if(!authorized()){setMessage('Acesso docente não autenticado.',true);return}
 try{
  const code=select.value,snap=await firebase.database().ref('ninthClassKeys/'+code).once('value'),token=snap.val();
  if(!token){setMessage('Sem link criado para '+classes.find(x=>x[0]===code)[1]+'. Clique em Obter link da turma.');return}
  if(!/^(?:n9_[a-f0-9]{32}|[a-f0-9]{32})$/.test(token))throw Error('Token da turma inválido.');
  attach(code,token)
 }catch(e){setMessage(e?.code==='PERMISSION_DENIED'?'As regras do 9º ano ainda não foram publicadas no Firebase.':'Falha ao consultar a turma: '+(e?.message||'erro'),true)}
}
async function createLink(){
 if(!authorized()){setMessage('Entre com uma conta docente autorizada.',true);return}
 linkButton.disabled=true;setMessage('Criando link…');
 try{
  const code=select.value,label=classes.find(x=>x[0]===code)[1];
  const random='n9_'+Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const res=await firebase.database().ref('ninthClassKeys/'+code).transaction(current=>current||random),token=res.snapshot.val();
  if(!/^(?:n9_[a-f0-9]{32}|[a-f0-9]{32})$/.test(token))throw Error('Token inválido');
  const ref=firebase.database().ref('ninthClasses/'+token+'/config'),snap=await ref.once('value');
  if(!snap.exists())await ref.set({label,code});
  attach(code,token)
 }catch(e){setMessage(e?.code==='PERMISSION_DENIED'?'Não é possível criar o link: publique as regras de acompanhamento do Firebase.':'Falha ao criar link: '+(e?.message||'erro'),true)}
 finally{linkButton.disabled=false}
}
linkButton.onclick=createLink;refresh.onclick=readExisting;select.onchange=readExisting;
copyButton.onclick=async()=>{try{await navigator.clipboard.writeText(linkInput.value);setMessage('Link copiado. Envie somente à turma correspondente.')}catch(e){linkInput.select();setMessage('Selecione o link e copie manualmente.')}};
const cell=value=>{const s=String(value??'');const clean=/^[=+\-@]/.test(s)?"'"+s:s;return '"'+clean.replace(/"/g,'""')+'"'};
exportButton.onclick=()=>{
 if(!authorized()||!activeClass)return;
 const rows=[['Turma','Estudante','Semana','Estado','Acertos objetivos','Data da entrega','Produção escrita']];
 for(const s of students)for(const w of bank.weeks){const st=weekStatus(s,w.id);rows.push([classes.find(x=>x[0]===activeClass)[1],s.profile.name,w.week,st.label,st.kind==='sent'?scoreFor(w,st.data):'',st.kind==='sent'&&st.data.submittedAt?new Date(st.data.submittedAt).toLocaleString('pt-BR'):'',st.kind==='sent'?st.data.writing:''])}
 const csv='\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
 a.href=url;a.download='Percursos_Historia_9_'+activeClass+'_4bim_2026.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
};
firebase.auth().onAuthStateChanged(user=>{
 if(user&&ALLOWED_EMAILS.has((user.email||'').toLowerCase()))readExisting();
 else{unlisten();activeToken='';students=[];render();linkWrap.hidden=true;setMessage('Aguardando acesso docente autorizado.')}
});
render();
})();