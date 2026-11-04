import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const [html,dataJs,syncJs,teacherHtml,teacherJs,rulesText]=await Promise.all([
 'percursos/historia-9ano.html','percursos/historia-9ano-data.js','percursos/historia-9ano-sync.js',
 'percursos/professora.html','percursos/teacher-historia-9ano.js','percursos/database.rules.json'
].map(p=>readFile(p,'utf8')));
new Function(syncJs);new Function(teacherJs);
const inline=html.match(/<script>([\s\S]*?)<\/script>/);assert.ok(inline);new Function(inline[1]);
const windowObject={};new Function('window',dataJs)(windowObject);
const bank=windowObject.PERCURSOS_H9;
assert.equal(bank.weeks.length,6);
assert.deepEqual(bank.weeks.map(w=>w.id),['h9s1','h9s2','h9s3','h9s4','h9s5','h9s6']);
for(const w of bank.weeks){assert.equal(w.questions.length,4);assert.ok(w.writing.length>20);for(const q of w.questions){assert.equal(q.o.length,4);assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4);assert.ok(q.e.length>10)}}
const rules=JSON.parse(rulesText).rules;
assert.ok(rules.results&&rules.trackClassKeys&&rules.classTracks,'schemas anteriores preservados');
assert.ok(rules.ninthClasses&&rules.ninthClassKeys);
assert.match(rules.ninthClasses.$classToken.students.$uid.profile['.write'],/auth.uid === \$uid/);
assert.match(rules.ninthClasses.$classToken.students.$uid.submissions.$week['.write'],/auth.uid === \$uid/);
assert.ok(teacherHtml.includes('teacher-historia-9ano.js'));
assert.ok(html.includes('historia-9ano-sync.js'));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const token='a'.repeat(32);
const fakeFirebase=[
 "(function(){",
 "const token='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';",
 "const state={ninthClasses:{[token]:{config:{label:'9º A',code:'9a'},students:{}}}};",
 "const read=p=>p.split('/').reduce((v,k)=>v?.[k],state);",
 "const set=(p,v)=>{let parts=p.split('/'),key=parts.pop(),at=state;for(const s of parts)at=at[s]??={};at[key]=structuredClone(v);if(v&&typeof v==='object'&&v.submittedAt?.['.sv']==='timestamp')at[key].submittedAt=Date.now()};",
 "const auth={currentUser:null,async signInAnonymously(){this.currentUser={uid:'test-student-uid-123',isAnonymous:true};return {user:this.currentUser}},async signOut(){this.currentUser=null}};",
 "function ref(p){return {async once(){return {val:()=>structuredClone(read(p)??null),exists:()=>read(p)!=null}},async set(v){set(p,v)},child(s){return ref(p+'/'+s)}}}",
 "window.__testDb=state;",
 "window.firebase={apps:[],initializeApp(x){this.apps.push(x)},auth:()=>auth,database:()=>({ref})};",
 "window.firebase.database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};",
 "})();"
].join('\n');
async function visit(mock,withToken){
 await page.route('http://percursos.test/**',route=>{
  const name=new URL(route.request().url()).pathname;
  if(name.endsWith('historia-9ano-data.js'))return route.fulfill({contentType:'text/javascript',body:dataJs});
  if(name.endsWith('historia-9ano-sync.js'))return route.fulfill({contentType:'text/javascript',body:syncJs});
  if(name.endsWith('historia-9ano.html'))return route.fulfill({contentType:'text/html',body:html});
  return route.abort();
 });
 await page.route('https://www.gstatic.com/**',route=>route.fulfill({contentType:'text/javascript',body:mock&&route.request().url().includes('firebase-app-compat')?fakeFirebase:''}));
 await page.goto('http://percursos.test/historia-9ano.html'+(withToken?'?mode=class#turma='+token:''));
 await page.locator('fieldset.question').first().waitFor();
}
try{
 await visit(false,false);
 assert.equal(await page.locator('fieldset.question').count(),4);
 for(let i=0;i<4;i++)await page.locator('fieldset.question').nth(i).locator('input[type=radio]').first().check();
 await page.locator('#writing').fill('Resposta histórica com explicação e relações sociais entre grupos.');
 assert.match(await page.locator('#progresslabel').textContent(),/1 de 6/);
 await page.locator('#cloudSubmit').click();
 assert.match(await page.locator('#h9CloudStatus').textContent(),/link da turma/);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('percursos-h9-2026-v1')).records.h9s1.answers.length),4);
 await page.unrouteAll();
 await visit(true,true);
 await page.locator('#h9Name').fill('Aluna Exemplo');
 await page.getByRole('button',{name:'Entrar na turma'}).click();
 await page.waitForFunction(()=>document.getElementById('h9Class').textContent.includes('Aluna Exemplo'));
 for(let i=0;i<4;i++)await page.locator('fieldset.question').nth(i).locator('input[type=radio]').first().check();
 await page.locator('#writing').fill('Uma análise construída com exemplos e acontecimentos históricos verificáveis.');
 await page.locator('#cloudSubmit').click();
 await page.waitForFunction(()=>document.getElementById('h9CloudStatus').textContent.includes('enviada e registrada'));
 const result=await page.evaluate(()=>{
  const s=window.__testDb.ninthClasses['a'.repeat(32)].students['test-student-uid-123'];
  return {name:s.profile.name,started:s.started.h9s1,submission:s.submissions.h9s1,local:JSON.parse(localStorage.getItem('percursos-h9-2026-v1-test-student-uid-123'))};
 });
 assert.equal(result.name,'Aluna Exemplo');assert.equal(result.started,true);
 assert.ok(result.submission.writing.length>20);assert.equal(Object.keys(result.submission.answers).length,4);
 assert.equal(result.submission.score,1);assert.ok(result.local.records.h9s1.submittedAt);
 assert.deepEqual(errors,[]);
 console.log('PASS: 9º ano seis trilhas, gabaritos, autenticação simulada, envio e rascunhos isolados');
}finally{await browser.close()}