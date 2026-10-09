(function(){
'use strict';
const classes=[['1a','1ª série A'],['1b','1ª série B'],['2a','2ª série A'],['2b','2ª série B'],['3a','3ª série A'],['3b','3ª série B'],['3c','3ª série C']];
const host=document.createElement('section');host.className='card';host.id='classTrackLinks';
const title=document.createElement('h2');title.textContent='Trilhas por aluno e disciplina';host.appendChild(title);
const help=document.createElement('p');help.className='sub';help.textContent='Compartilhe o link da turma. Em qualquer aparelho, o aluno seleciona seu nome e vê as aulas já concluídas. O link dá acesso aos nomes e ao andamento da turma; envie somente à turma e à equipe que acompanha os alunos.';host.appendChild(help);
const label=document.createElement('label');label.textContent='Turma';label.htmlFor='trackLinkClass';host.appendChild(label);
const select=document.createElement('select');select.id='trackLinkClass';for(const [key,text]of classes)select.add(new Option(text,key));host.appendChild(select);
const button=document.createElement('button');button.type='button';button.textContent='Obter link da turma';host.appendChild(button);
const output=document.createElement('input');output.id='classTrackLink';output.readOnly=true;output.hidden=true;output.setAttribute('aria-label','Link da turma');host.appendChild(output);
const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar link';copy.hidden=true;host.appendChild(copy);
const info=document.createElement('p');info.setAttribute('role','status');info.setAttribute('aria-live','polite');host.appendChild(info);
document.getElementById('app').prepend(host);
button.addEventListener('click',async()=>{
 button.disabled=true;info.textContent='Buscando link…';
 try{
  const user=firebase.auth().currentUser;if(!user||!ALLOWED_EMAILS.has((user.email||'').toLowerCase()))throw Error('Entre com a conta docente autorizada.');
  const key=select.value,label=classes.find(x=>x[0]===key)[1];
  const random=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const result=await firebase.database().ref('trackClassKeys/'+key).transaction(current=>current||random);
  const token=result.snapshot.val();if(!/^[a-f0-9]{32}$/.test(token))throw Error('Link da turma inválido.');
  const ref=firebase.database().ref('classTracks/'+token);const snap=await ref.child('label').once('value');
  if(!snap.exists())await ref.update({label,series:key.charAt(0)});
  const url=new URL('aluno.html',location.href);url.hash=new URLSearchParams({turma:token}).toString();
  output.value=url.href;output.hidden=false;copy.hidden=false;info.textContent='Link de '+label+' pronto. Os alunos podem usar esse mesmo link em outros aparelhos.';
 }catch(e){info.textContent='Não foi possível obter o link. Verifique se as regras das trilhas estão ativadas no Firebase.';output.hidden=true;copy.hidden=true}
 finally{button.disabled=false}
});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);info.textContent='Link copiado.'}catch(e){output.focus();output.select();info.textContent='Selecione e copie o link acima.'}});
})();
(function(){
'use strict';
const host=document.getElementById('classTrackLinks');if(!host)return;
const button=document.createElement('button');button.textContent='Ver jogos da turma';button.type='button';const output=document.createElement('div');output.setAttribute('role','status');host.append(button,output);
const games={logic:'Lógica',words:'Caça-palavras',crossword:'Palavras cruzadas',tic:'Jogo da velha',hang:'Forca',dots:'Pontinho',math:'Cálculos',snake:'Cobrinha'};
button.addEventListener('click',async()=>{button.disabled=true;output.textContent='Buscando registros…';try{const key=document.getElementById('trackLinkClass').value,token=(await firebase.database().ref('trackClassKeys/'+key).once('value')).val();if(!token){output.textContent='Gere o link da turma para começar a registrar os jogos.';return}const students=(await firebase.database().ref('classTracks/'+token+'/students').once('value')).val()||{};output.replaceChildren();const title=document.createElement('h3');title.textContent='Jogos iniciados pelos alunos';output.appendChild(title);const table=document.createElement('table');table.style.cssText='width:100%;text-align:left;border-collapse:collapse';const head=table.createTHead().insertRow();for(const text of ['Aluno','Jogos registrados']){const th=document.createElement('th');th.textContent=text;head.appendChild(th)}for(const profile of Object.values(students).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){const row=table.insertRow();row.insertCell().textContent=profile.name;row.insertCell().textContent=Object.keys(profile.played||{}).filter(k=>profile.played[k]===true&&games[k]).map(k=>games[k]).join(', ')||'Nenhum jogo registrado'}output.appendChild(table);if(!Object.keys(students).length)output.appendChild(document.createTextNode('Ainda não há alunos registrados nesta turma.'))}catch(e){output.textContent='Não foi possível carregar os registros. Verifique a conexão e a conta docente.'}finally{button.disabled=false}});
})();
