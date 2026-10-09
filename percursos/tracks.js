(function(){
'use strict';
const core=window.PercursosTrackCore, api=window.__percursosProgress,app=window.__percursosStudentApp;
const profileKey='percursos-student-profiles-v1',pendingKey='percursos-tracks-pending-v1';
const classLabels=['1ª série A','1ª série B','2ª série A','2ª série B','3ª série A','3ª série B','3ª série C'];
const classes=classLabels.map((label,i)=>({label,key:['1a','1b','2a','2b','3a','3b','3c'][i]}));
const token=new URLSearchParams(location.hash.slice(1)).get('turma');
const validToken=typeof token==='string'&&/^[a-f0-9]{32}$/.test(token);
const entryStatus=document.getElementById('trackEntryStatus'),entryButton=document.getElementById('entrySubmit'),names=document.getElementById('savedStudent'),nameInput=document.getElementById('entryName'),classInput=document.getElementById('entryClass');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch(e){return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}};
let roster={},classLabel='',selectedKey='',generation=0,flushPromise=null,unsubscribe=null,bootstrapPromise=null;
function status(text){entryStatus.textContent=text;const el=document.getElementById('trackSync');if(el)el.textContent=text}
async function hashName(name){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(core.normalize(name)));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function fillNames(){
 const remembered=read(profileKey,[]).filter(p=>p.turma===classInput.value).map(p=>p.name);
 const cloud=Object.values(roster).map(p=>p.name).filter(Boolean);
 const choices=[...new Map([...remembered,...cloud].map(name=>[core.normalize(name),name])).values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 names.replaceChildren(new Option('Primeiro acesso: informar meu nome',''));
 for(const name of choices)names.add(new Option(name,name));
 names.value=choices.find(n=>core.normalize(n)===core.normalize(nameInput.value))||'';
}
names.addEventListener('change',()=>{nameInput.value=names.value;nameInput.hidden=!!names.value;if(!names.value)nameInput.focus()});
classInput.addEventListener('change',()=>{nameInput.value='';nameInput.hidden=false;fillNames()});
function remember(){const list=read(profileKey,[]);if(!list.some(p=>core.normalize(p.name)===core.normalize(student.name)&&p.turma===student.turma))list.push({name:student.name,turma:student.turma});write(profileKey,list);fillNames()}
function completedLocal(){const p=api.load(),out={};for(const [key,value]of Object.entries(p))if(value&&core.validActivity(key,student.series))out[key]=true;return out}
function applyRemote(remote){
 const local=api.load(),merged=core.mergeCompleted(completedLocal(),remote,student.series);
 for(const key of Object.keys(merged))if(!local[key])local[key]={sync:'sent',source:'cloud'};
 api.save(local);paint();
}
function paint(){
 if(accessMode!=='student')return;
 api.paint();let container=document.getElementById('trackDisciplines');
 if(!container){container=document.createElement('div');container.id='trackDisciplines';container.className='track-grid';document.getElementById('maluProgress').insertAdjacentElement('afterend',container)}
 container.replaceChildren();
 const done=completedLocal();
 for(const discipline of core.disciplines(student.series,done,api.key)){
  const card=document.createElement('section');card.className='track-discipline';
  const title=document.createElement('h3');title.textContent=discipline.name;card.appendChild(title);
  const count=document.createElement('div');count.textContent=discipline.done+' de 6 aulas concluídas';card.appendChild(count);
  const weeks=document.createElement('div');weeks.className='track-weeks';
  for(const lesson of discipline.lessons){const button=document.createElement('button');button.type='button';button.className='track-week'+(lesson.done?' done':'');button.textContent=(lesson.done?'✓ ':'')+'Aula '+lesson.week;button.setAttribute('aria-label',discipline.name+', aula '+lesson.week+(lesson.done?', concluída':''));button.onclick=()=>openActivity(lesson.id);weeks.appendChild(button)}
  card.appendChild(weeks);
  const next=document.createElement('button');next.type='button';next.className='secondary';next.textContent=discipline.next?'Continuar na aula '+discipline.next.week:'Disciplina concluída ✓';next.disabled=!discipline.next;if(discipline.next)next.onclick=()=>openActivity(discipline.next.id);card.appendChild(next);container.appendChild(card);
 }
 let sync=document.getElementById('trackSync');if(!sync){sync=document.createElement('div');sync.id='trackSync';sync.className='track-sync';sync.setAttribute('role','status');sync.setAttribute('aria-live','polite');container.insertAdjacentElement('afterend',sync)}
 sync.textContent=entryStatus.textContent;
}
async function bootstrap(){
 if(!validToken){fillNames();status('Neste aparelho: seu progresso continua salvo. Para usar outros aparelhos, abra o link da turma fornecido pela professora.');return false}
 if(!app||!api||!window.__percursosEnsureAuth)throw Error('Não foi possível conectar. Atualize a página.');
 status('Buscando nomes da turma…');
 await window.__percursosEnsureAuth();
 const snap=await app.database().ref('classTracks/'+token).once('value');const data=snap.val();
 if(!data||!classLabels.includes(data.label))throw Error('Link da turma indisponível. Peça o link à professora.');
 classLabel=data.label;classInput.value=classLabel;classInput.disabled=true;roster=data.students||{};fillNames();status('Selecione seu nome. As aulas concluídas serão salvas para qualquer aparelho.');return true;
}
async function flush(){
 if(flushPromise)return flushPromise;
 flushPromise=(async()=>{
  if(!navigator.onLine){status('Salvo neste aparelho · esperando internet para salvar na nuvem.');return false}
  const pending=read(pendingKey,{});
  for(const [route,items] of Object.entries(pending)){
   try{
    await window.__percursosEnsureAuth();
    const updates={};for(const [key,value] of Object.entries(items))if(value===true)updates[key]=true;
    if(Object.keys(updates).length)await app.database().ref(route).update(updates);
    const fresh=read(pendingKey,{});const remaining=fresh[route]||{};
    for(const key of Object.keys(items))delete remaining[key];
    if(Object.keys(remaining).length)fresh[route]=remaining;else delete fresh[route];write(pendingKey,fresh);
   }catch(e){status('Salvo neste aparelho · nuvem pendente. Mantenha a página aberta com internet.');return false}
  }
  if(validToken&&selectedKey)status('Salvo na nuvem ✓ · pode continuar em outro aparelho pelo link da turma.');return true;
 })().finally(()=>{flushPromise=null});return flushPromise;
}
function queueCompleted(){
 paint();if(!validToken||!selectedKey)return;
 const route='classTracks/'+token+'/students/'+selectedKey+'/completed';const pending=read(pendingKey,{});
 pending[route]=core.mergeCompleted(pending[route],completedLocal(),student.series);write(pendingKey,pending);flush();
}
const oldEnter=window.enterStudent;
window.enterStudent=async function(){
 const name=nameInput.value.trim(),turma=classInput.value;
 if(!name||!turma){oldEnter.apply(this,arguments);return}
 if(entryButton.disabled)return;
 const gen=++generation;entryButton.disabled=true;
 try{
  if(validToken){
   await bootstrapPromise;
   if(!classLabel)await bootstrap();
   if(!classLabel)throw Error('Não foi possível conectar à turma.');
   const key=await hashName(name);const ref=app.database().ref('classTracks/'+token+'/students/'+key);
   // Immutable names: opening the same name/class on a different device reuses the profile.
   const snap=await ref.once('value');let profile=snap.val();
   if(!profile){await ref.child('name').transaction(current=>current||name);profile=(await ref.once('value')).val()}
   if(gen!==generation)return;
   nameInput.value=profile.name;selectedKey=key;
   oldEnter.apply(this,arguments);remember();applyRemote(profile.completed||{});
   if(unsubscribe)unsubscribe();
   const callback=snapshot=>{if(gen===generation&&accessMode==='student')applyRemote(snapshot.val()||{})};
   ref.child('completed').on('value',callback,error=>status('Atualização da nuvem interrompida. Seu progresso está salvo neste aparelho.'));
   unsubscribe=()=>ref.child('completed').off('value',callback);
   queueCompleted();
  }else{selectedKey='';oldEnter.apply(this,arguments);remember();paint()}
 }catch(e){status((e&&e.message)||'Não foi possível abrir. Tente novamente com internet.')}
 finally{entryButton.disabled=false}
};
const oldHome=window.goHome;window.goHome=function(){oldHome.apply(this,arguments);paint();flush()};
const oldReset=window.resetAccess;window.resetAccess=function(){generation++;selectedKey='';if(unsubscribe)unsubscribe();unsubscribe=null;oldReset.apply(this,arguments);document.getElementById('trackDisciplines')?.remove();document.getElementById('trackSync')?.remove()};
window.PercursosTracks={queueCompleted,flush,paint};
window.addEventListener('online',()=>flush());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flush()});
bootstrapPromise=bootstrap().catch(e=>{status(e.message||'Não foi possível carregar a turma. Verifique a internet.');return false});
})();
