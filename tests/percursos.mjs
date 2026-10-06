import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const source=await readFile('percursos/aluno.html','utf8');
const units=Object.fromEntries([...source.slice(source.indexOf('const A='),source.indexOf('const WORDSEARCH_CONFIG')).matchAll(/"?\b([hfs][123]s[1-6])"?:\s*"([A-Za-z0-9+/=]+)"/g)].map(m=>[m[1],Buffer.from(m[2],'base64').toString()]));
assert.equal(Object.keys(units).length,54);
const revised=['s1s5','s1s6',...Array.from({length:6},(_,i)=>'s2s'+(i+1)),'f2s1',...Array.from({length:6},(_,i)=>'f3s'+(i+1))];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 for(const id of revised){
  await page.route('http://percursos.test/'+id,r=>r.fulfill({contentType:'text/html',body:units[id]}));
  await page.goto('http://percursos.test/'+id);
  const actual=await page.evaluate(()=>({questions:Q,key:K,title:document.querySelector('#login h2').textContent}));
  assert.equal(actual.questions.length,3,id);
  assert.equal(await page.locator('#atividade .meta').first().textContent(),'Semana '+id.at(-1));
  assert.ok(await page.locator('.sources a').count());
  assert.match(actual.key,/_20261006_records$/);
  assert.ok(source.includes('Semana '+id.at(-1)+' — '+actual.title.replaceAll('&','&amp;')),id+' menu');
  await page.locator('#nome').fill('Estudante de teste');
  await page.evaluate(()=>{localStorage.setItem('old_records','[{"preserved":true}]');start();finish()});
  assert.equal(await page.evaluate(()=>localStorage.getItem(K)),null,'Cannot finish incomplete '+id);
  await page.evaluate(()=>{one(0,1);for(let i=0;i<Q.length;i++)one(i,0);finish()});
  const result=await page.evaluate(()=>({records:JSON.parse(localStorage.getItem(K)),old:localStorage.getItem('old_records'),disabled:fim.disabled,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(result.records.length,1);assert.equal(result.records[0].total_attempts,4);
  assert.deepEqual(result.records[0].attempts_by_question,{q1:2,q2:1,q3:1});
  assert.equal(result.old,'[{"preserved":true}]');assert.equal(result.overflow,false,id+' mobile');
 }
 // Exercise the real progress migration helpers with an isolated local store.
 await page.evaluate(code=>{
  const revision=code.slice(code.indexOf('const CONTENT_REVISIONS='),code.indexOf('function activityMeta('));
  (0,eval)(revision+';window.testProgressKey=activityProgressKey');
 },source);
 assert.equal(await page.evaluate(()=>testProgressKey('s2s1')),'s2s1@20261006');
 assert.equal(await page.evaluate(()=>testProgressKey('s3s1')),'s3s1');
 assert.match(source,/p\[activityProgressKey\(id\)\]\.sync=/);
 assert.match(source,/"f1s2": \["DIREITOS", "DIGNIDADE"/);

 await page.route('https://**/*',r=>r.abort());
 const isolatedSource=source.replace('function loadLocalProgress(){','window.testLoadProgress=loadLocalProgress;window.testSaveProgress=saveLocalProgress;window.testSetSender=sender=>sendResult=sender;\nfunction loadLocalProgress(){');
 await page.route('http://percursos.test/app',r=>r.fulfill({contentType:'text/html',body:isolatedSource}));
 await page.goto('http://percursos.test/app');
 await page.evaluate(()=>{
  accessMode='student';student={name:'Teste',turma:'2ª série A',series:'2'};
  testSetSender(async payload=>{window.testPayload=payload;return {ok:true}});
  testSaveProgress({s2s1:{sync:'sent',finished_at:'2026-09-01'}});
  openActivity('s2s1');
 });
 const frame=page.frames().find(f=>f!==page.mainFrame());
 await frame.waitForSelector('#q1',{state:'attached'});
 assert.equal(await frame.locator('.question:not(.malu-hidden-step)').count(),1);
 await frame.evaluate(()=>{for(let i=0;i<Q.length;i++)one(i,0);finish()});
 await page.waitForFunction(()=>window.testPayload);
 const saved=await page.evaluate(()=>({progress:testLoadProgress(),payload:window.testPayload}));
 assert.equal(saved.progress.s2s1.finished_at,'2026-09-01');
 assert.equal(saved.progress['s2s1@20261006'].sync,'sent');
 assert.equal(saved.payload.content_revision,'20261006');
 assert.equal(Object.keys(saved.payload.question_details).length,3);
 assert.match(saved.payload.title,/República/);
 assert.deepEqual(errors,[]);
 console.log('PASS 15 revised Percursos: 3 brief applications, retries and completion records, preserved prior records, mobile layout and separate revised progress');
}finally{await browser.close()}
