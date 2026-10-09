import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const token='a'.repeat(32),database={classTracks:{[token]:{label:'3ª série C',series:'3'}}};
const lookup=path=>path.split('/').reduce((v,key)=>v?.[key],database)??null;
function update(path,values){for(const [key,value]of Object.entries(values)){const keys=(path+'/'+key).split('/'),last=keys.pop();let node=database;for(const part of keys)node=node[part]??={};node[last]=value}}
const source=(await readFile('percursos/aluno.html','utf8')).replace('function loadLocalProgress(){','sendResult=async()=>({ok:true});\nfunction loadLocalProgress(){');
const scripts=Object.fromEntries(await Promise.all(['tracks.js','tracks-core.js'].map(async file=>[file,await readFile('percursos/'+file,'utf8')])));
const browser=await chromium.launch({headless:true});const errors=[];
async function device(){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.exposeFunction('testDBRead',path=>structuredClone(lookup(path)));
 await context.exposeFunction('testDBWrite',(path,values)=>update(path,values));
 await context.addInitScript(()=>{
  const snapshots=value=>({val:()=>value,exists:()=>value!=null});
  const ref=path=>({child:key=>ref(path+'/'+key),once:async()=>snapshots(await testDBRead(path)),update:async values=>testDBWrite(path,values),transaction:async callback=>{const value=callback(await testDBRead(path));const parts=path.split('/'),key=parts.pop();await testDBWrite(parts.join('/'),{[key]:value});return {snapshot:snapshots(value)}},on:(_event,callback)=>{testDBRead(path).then(value=>callback(snapshots(value)))},off(){}});
  const app={name:'percursosAluno',auth:()=>({currentUser:{uid:'test-user'},signInAnonymously:async()=>({user:{uid:'test-user'}})}),database:()=>({ref})};
  window.firebase={apps:[app],initializeApp:()=>app};
 });
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='percursos.test'&&url.pathname==='/aluno.html')return route.fulfill({contentType:'text/html',body:source});
  const file=url.pathname.split('/').pop();if(url.hostname==='percursos.test'&&scripts[file])return route.fulfill({contentType:'application/javascript',body:scripts[file]});
  return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://percursos.test/aluno.html#turma='+token);await page.waitForFunction(()=>document.getElementById('trackEntryStatus').textContent.includes('Selecione seu nome'));return {page,context};
}
try{
 const first=await device();await first.page.locator('#entryName').fill('Ana');await first.page.getByRole('button',{name:'Entrar nas minhas aulas'}).click();await first.page.locator('#trackDisciplines').waitFor();
 assert.equal(await first.page.locator('.track-discipline').count(),3);assert.equal(await first.page.locator('#entryClass').inputValue(),'3ª série C');
 await first.page.evaluate(async()=>{for(const id of ['h3s1','h3s2','f3s1'])await window.__percursosCompleteActivity(id,{getElementById:()=>null},{});await PercursosTracks.flush()});
 const second=await device();await second.page.locator('#savedStudent').selectOption('Ana');await second.page.getByRole('button',{name:'Entrar nas minhas aulas'}).click();await second.page.locator('#trackDisciplines').waitFor();
 assert.match(await second.page.locator('.track-discipline').nth(0).textContent(),/2 de 6 aulas concluídas.*Continuar na aula 3/s);
 assert.match(await second.page.locator('.track-discipline').nth(1).textContent(),/1 de 6 aulas concluídas.*Continuar na aula 2/s);
 assert.match(await second.page.locator('.track-discipline').nth(2).textContent(),/0 de 6 aulas concluídas.*Continuar na aula 1/s);
 assert.match(await second.page.locator('#trackSync').textContent(),/Salvo na nuvem/);
 await second.page.locator('.track-discipline').nth(0).getByRole('button',{name:'Continuar na aula 3'}).click();
 await second.page.waitForFunction(()=>document.querySelector('#frame')?.contentDocument?.querySelector('.malu-stepbar'));
 assert.equal(await second.page.locator('body').evaluate(el=>el.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('PASS mobile real UI: select cloud name on another device, History lesson 3 / Philosophy lesson 2 / Sociology lesson 1, and opening the next lesson');
}finally{await browser.close()}
