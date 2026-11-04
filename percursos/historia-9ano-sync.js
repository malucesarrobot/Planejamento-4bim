(function(){
'use strict';
// Área de acompanhamento para História do 9º ano. Não usa nem altera as trilhas do Ensino Médio.
const appConfig={
 apiKey:"AIzaSyDjxPzcMZcnW679kERfSkMOFY98Ncrtd58",
 authDomain:"percursos-754d6.firebaseapp.com",
 databaseURL:"https://percursos-754d6-default-rtdb.firebaseio.com",
 projectId:"percursos-754d6",
 storageBucket:"percursos-754d6.firebasestorage.app",
 messagingSenderId:"304874200719",
 appId:"1:304874200719:web:e05949c4c71d40a542dafa"
};
const token=new URLSearchParams(location.hash.slice(1)).get('turma');
const valid=typeof token==='string'&&/^[a-f0-9]{32}$/.test(token);
const root='ninthClasses/'+token;
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const card=el('section','h9-identify');
card.id='h9Identity';
card.appendChild(el('h3','','Registro com a professora'));
const tip=el('p','sub','Para que a professora acompanhe as atividades, abra o link da sua turma e informe seu nome como está na chamada.');
card.appendChild(tip);
const classroom=el('p','sub','');classroom.id='h9Class';card.appendChild(classroom);
const input=el('input');input.type='text';input.id='h9Name';input.maxLength=120;input.minLength=2;input.autocomplete='name';input.placeholder='Nome completo do estudante';input.setAttribute('aria-label','Nome completo do estudante');card.appendChild(input);
const enter=el('button','btn primary','Entrar na turma');enter.type='button';card.appendChild(enter);
const change=el('button','btn','Trocar estudante');change.type='button';change.hidden=true;card.appendChild(change);
const status=el('p','status','');status.id='h9CloudStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');card.appendChild(status);
const hint=el('p','sub','Somente a professora e a equipe docente autorizada podem consultar respostas e resultados. Não é uma nota lançada no SIAP. Em aparelhos compartilhados, use Trocar estudante ao terminar.');card.appendChild(hint);
document.querySelector('aside')?.prepend(card);
let auth=null,db=null,user=null,profile=null,config=null,inFlight=false;
const started=new Set();
function say(text,error){status.textContent=text;status.style.color=error?'#a23232':''}
function localInfo(){
 if(!valid){say('Este endereço permite estudar e guardar as respostas neste aparelho, mas não permite enviá-las à professora. Peça a ela o link específico da sua turma.');input.hidden=true;enter.hidden=true;change.hidden=true;return}
}
localInfo();
function ensureFirebase(){
 if(!valid)return false;
 if(typeof firebase==='undefined'){say('Não foi possível carregar a conexão. Continue estudando e tente novamente com internet.',true);return false}
 if(!firebase.apps.length)firebase.initializeApp(appConfig);
 auth=firebase.auth();db=firebase.database();return true
}
async function signIn(){
 let current=auth.currentUser;
 if(!current||current.isAnonymous!==true){const result=await auth.signInAnonymously();current=result.user}
 return current
}
async function getConfig(){
 user=await signIn();
 const snap=await db.ref(root+'/config').once('value');
 const c=snap.val();
 if(!c||!/^9[abc]$/.test(c.code)||!/^9º [ABC]$/.test(c.label))throw Error('Link de turma indisponível. Solicite um novo link à professora.');
 config=c;classroom.textContent='Turma: '+c.label;return c
}
async function recognize(){
 try{
  await getConfig();
  const snap=await db.ref(root+'/students/'+user.uid+'/profile').once('value');
  const found=snap.val();
  if(found&&found.name){profile=found;input.value=found.name;showIdentity();await restoreSubmissions()}
  else{say('Informe seu nome completo e entre na turma.');input.hidden=false;enter.hidden=false}
 }catch(e){say((e&&e.code==='PERMISSION_DENIED')?'O acompanhamento ainda não está ativado no Firebase. As atividades locais continuam disponíveis.':(e?.message||'Falha na conexão com a turma.'),true)}
}
async function restoreSubmissions(){
 if(!profile)return;
 try{
  const snap=await db.ref(root+'/students/'+user.uid+'/submissions').once('value');
  const submitted=snap.val()||{};
  for(const [id,value] of Object.entries(submitted)){
   if(value&&value.submittedAt&&window.PercursosH9Bridge){
    const rec=window.PercursosH9Bridge.getRecord(id);
    if(rec&&!rec.submittedAt){rec.submittedAt=value.submittedAt}
   }
  }
  window.PercursosH9Bridge?.save();
  refreshWeek();
 }catch(e){say('Entrada confirmada; não foi possível consultar as entregas anteriores. Tente atualizar a página.',true)}
}
function showIdentity(){
 window.PercursosH9Bridge?.switchProfile(user.uid);
 input.hidden=true;enter.hidden=true;change.hidden=false;
 classroom.textContent='Turma: '+config.label+' · '+profile.name;
 say('Identificação confirmada. Para registrar uma atividade, responda às questões e clique em Enviar à professora.');
 refreshWeek()
}
function refreshWeek(){
 if(!profile)return;
 const w=window.PercursosH9Bridge?.currentLesson();
 const rec=w?window.PercursosH9Bridge.getRecord(w.id):null;
 const tag=$('cloudSubmit');
 if(tag){tag.disabled=false;tag.title='Envia as quatro respostas objetivas e a produção escrita desta semana à professora'}
 if(rec?.submittedAt)say('Identificação: '+profile.name+' · A semana '+w.week+' já teve uma entrega registrada. Você pode reenviar uma versão revisada.');
}
async function register(){
 if(inFlight)return;
 const name=input.value.trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>120){say('Informe um nome válido como consta na chamada.',true);return}
 inFlight=true;enter.disabled=true;say('Conectando à sua turma…');
 try{
  await getConfig();
  const ref=db.ref(root+'/students/'+user.uid+'/profile');
  const snap=await ref.once('value');
  if(snap.exists()){
   profile=snap.val();
   if(profile.name!==name){say('Este navegador já está identificado como '+profile.name+'. Use Trocar estudante para outro aluno.',true);return}
  }else{
   await ref.set({name:name,joinedAt:firebase.database.ServerValue.TIMESTAMP});
   profile=(await ref.once('value')).val()
  }
  showIdentity();await restoreSubmissions()
 }catch(e){say(e?.code==='PERMISSION_DENIED'?'Acesso negado pelo Firebase: a professora precisa publicar as regras de acompanhamento.':(e?.message||'Falha ao registrar o estudante.'),true)}
 finally{inFlight=false;enter.disabled=false}
}
async function markStarted(id){
 if(!valid||!profile||!/^h9s[1-6]$/.test(id)||started.has(id))return;
 started.add(id);
 try{await db.ref(root+'/students/'+user.uid+'/started/'+id).set(true)}
 catch(e){started.delete(id);say('O progresso desta semana está local; sincronização pendente. Verifique a conexão.',true)}
}
async function submit(id){
 if(!valid){say('Para enviar, abra o link da turma fornecido pela professora.',true);return}
 if(!profile){say('Primeiro informe seu nome e entre na turma.',true);input.focus();return}
 const bridge=window.PercursosH9Bridge;
 const w=bridge?.allLessons().find(x=>x.id===id),r=bridge?.getRecord(id);
 if(!w||!r){say('Atividade não encontrada. Atualize a página.',true);return}
 const validAnswers=w.questions.every((q,i)=>Number.isInteger(r.answers?.[i])&&r.answers[i]>=0&&r.answers[i]<q.o.length);
 const writing=String(r.writing||'').trim();
 if(!validAnswers||writing.length<20){say('Responda às quatro questões e escreva ao menos 20 caracteres na produção escrita antes de enviar.',true);return}
 if(writing.length>2500){say('Reduza sua resposta escrita para no máximo 2.500 caracteres.',true);return}
 const button=$('cloudSubmit');if(button)button.disabled=true;say('Enviando a atividade…');
 const answers=Object.fromEntries(w.questions.map((q,i)=>['a'+i,r.answers[i]]));
 const score=w.questions.reduce((total,q,i)=>total+(r.answers[i]===q.a?1:0),0);
 try{
  await markStarted(id);
  await db.ref(root+'/students/'+user.uid+'/submissions/'+id).set({
   answers:answers,writing:writing,score:score,
   submittedAt:firebase.database.ServerValue.TIMESTAMP,
   version:'2026-11-04'
  });
  r.submittedAt=Date.now();bridge.save();
  say('Semana '+w.week+' enviada e registrada para '+profile.name+'. Acertos objetivos: '+score+' de 4. A resposta escrita será avaliada pela professora.');
 }catch(e){say((e&&e.code==='PERMISSION_DENIED')?'Não foi possível enviar: regras de acesso do Firebase ainda não habilitadas. A resposta permanece salva neste aparelho.':'Falha ao enviar. A resposta continua salva neste aparelho; tente novamente com internet.',true)}
 finally{if(button)button.disabled=false}
}
enter.onclick=register;
change.onclick=async()=>{
 if(!auth)return;
 const yes=window.confirm('Sair deste estudante neste aparelho? As entregas já registradas permanecerão disponíveis à professora.');
 if(!yes)return;
 try{
  await auth.signOut();user=null;profile=null;started.clear();
  window.PercursosH9Bridge?.switchProfile('guest-anon');
  input.value='';input.hidden=false;enter.hidden=false;change.hidden=true;
  await signIn();say('Informe o nome do próximo estudante. Cada estudante terá um registro separado.');
 }catch(e){say('Não foi possível trocar de estudante agora.',true)}
};
document.addEventListener('h9render',refreshWeek);
window.PercursosH9Cloud={markStarted,submit};
if(ensureFirebase()){recognize()}else if(valid){say('Conexão indisponível. As atividades continuam acessíveis localmente.',true)}
})();