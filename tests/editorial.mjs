import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('body.ux-ready');
 assert.equal(await page.locator('.ux-exam-connections').count(),18);
 assert.equal(await page.locator('.ux-teacher-guide summary').filter({hasText:'Perguntas difíceis'}).count(),60);
 assert.equal(await page.locator('article.week-card .ux-board-model').count(),60);
 assert.equal(await page.locator('article.week-card .ux-study-example h5').filter({hasText:'Analogia para começar'}).count(),6);
 const data=await page.evaluate(()=>window.MaluEditorialData);assert.equal(Object.keys(data.exams).length,18);
 for(const [id,lesson] of Object.entries(data.exams)){
  assert.ok(id.startsWith('s3-'));assert.equal(lesson.connections.filter(c=>c.exam==='Enem').length,1);assert.ok(lesson.connections.some(c=>c.exam.includes('Vestibular')));assert.ok(lesson.connections.some(c=>c.exam.includes('seriada')));
  assert.ok(lesson.exercise.length>70);for(const c of lesson.connections){assert.ok(['Direta','Tangencial'].includes(c.relation));assert.ok(data.sources[c.ref][1].startsWith('https://'));}
 }
 await page.locator('#uxSeries').selectOption('s3');await page.locator('#uxSubject').selectOption('filosofia');
 const exams=page.locator('article.week-card:visible .ux-exam-connections');assert.ok(await exams.isVisible());await exams.scrollIntoViewIfNeeded();await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/editorial-exams-mobile.png'});
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 const html=await page.evaluate(()=>window.MaluShare.buildHtml([{id:'s3-filosofia',classes:['3ªA']}],'alunos','Filosofia',''));
 assert.ok(!html.includes('Perguntas difíceis'));assert.ok(!html.includes('Limite da resposta:'));assert.ok(!html.includes('Treino autoral opcional'));assert.ok(html.includes('Esquema de conceitos'));
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),before);
 const shared=await browser.newPage({viewport:{width:390,height:844}});await shared.setContent(html);await shared.locator('[data-material=esquema]').click();assert.equal(await shared.locator('.ux-board-model').count(),1);
 for(const subject of ['historia','filosofia','sociologia']){
  await page.locator('#uxSubject').selectOption(subject);await page.locator('#wkProject').click();await page.locator('[data-lesson-material=esquema]').click();
  for(let i=1;i<=6;i++){
   await page.locator('#projectionWeek').selectOption('s3-'+subject+'-semana-'+i);assert.equal(await page.locator('#projectionPage .ux-board-model').count(),1);
   assert.equal(await page.locator('#projectionPage .prof-panel,#projectionPage .ux-teacher-guide,#projectionPage .ux-exam-connections').count(),0);
   assert.ok(await page.locator('#projectionPage').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'scheme mobile overflow');
  }
  await page.locator('#projectionClose').click();
 }
 await page.locator('#uxSubject').selectOption('filosofia');await page.locator('#wkProject').click();await page.locator('[data-lesson-material=esquema]').click();await page.screenshot({path:'test-results/editorial-board-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS 18 exam mappings, 60 teacher questions and schemes, six bounded analogies, portable student scheme, unchanged saves, teacher isolation and all 18 projected weeks without overflow');
}finally{await browser.close();await new Promise(r=>server.close(r));}
