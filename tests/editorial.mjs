import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('body.ux-ready');
 assert.equal(await page.locator('.ux-exam-connections').count(),74);
 assert.equal(await page.locator('.ux-teacher-guide summary').filter({hasText:'Perguntas difíceis'}).count(),60);
 assert.equal(await page.locator('article.week-card .ux-board-model').count(),60);
 assert.equal(await page.locator('article.week-card .ux-study-example h5').filter({hasText:'Analogia para começar'}).count(),6);
 const data=await page.evaluate(()=>window.MaluEditorialData);assert.equal(Object.keys(data.exams).length,37);
 assert.equal(Object.keys(data.exams).filter(id=>id.startsWith('s3-')).length,18);
 assert.equal(Object.keys(data.occurrences).length,59);
 const research=JSON.parse(await readFile('review/exames-2016-2025.json','utf8'));
 assert.deepEqual(Object.values(data.occurrences),research,'published occurrences must preserve the reviewed research');
 for(const [id,lesson] of Object.entries(data.exams)){
  assert.ok(/^s[123]-/.test(id));assert.ok(lesson.connections.length>0);
  for(const c of lesson.connections){assert.ok(['Direta','Tangencial'].includes(c.relation));assert.equal(data.sources[c.ref][1],data.occurrences[c.ref].fonte);assert.ok(c.why.length>60);}
 }
 assert.ok(data.exams['s3-filosofia-semana-3'].connections.every(c=>c.relation==='Tangencial'),'do not invent nominal Jonas questions');
 assert.ok(data.exams['s2-filosofia-semana-4'].connections.every(c=>c.relation==='Tangencial'),'Kopenawa is not Krenak');
 assert.equal(data.exams['s1-filosofia-semana-3'],undefined,'do not force unrelated questions onto Epicurus');
 assert.equal(data.exams['s1-historia-semana-1'],undefined,'do not force contemporary themes onto feudalism');
 const ref=data.exams['s2-sociologia-semana-2'].connections[0].ref;assert.match(data.occurrences[ref].tema,/Crenshaw/);assert.equal(data.occurrences[ref].ano,2023);
 await page.locator('#uxSeries').selectOption('s3');await page.locator('#uxSubject').selectOption('filosofia');
 const exams=page.locator('article.week-card:visible .prof-panel .ux-exam-connections');assert.ok(await exams.isVisible());await exams.scrollIntoViewIfNeeded();await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/editorial-exams-mobile.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'exam records overflow on mobile');
 const mbembe=page.locator('#s3-filosofia-semana-5 .prof-panel .ux-exam-connections');assert.match(await mbembe.textContent(),/Cebraspe/);assert.match(await mbembe.textContent(),/Itens 58 e 60/);
 await page.locator('#uxSeries').selectOption('s2');await page.locator('#uxSubject').selectOption('sociologia');await page.locator('#uxWeekChoices button').nth(1).click();
 const second=page.locator('article.week-card:visible .prof-panel .ux-exam-connections');assert.match(await second.textContent(),/Crenshaw/);assert.match(await second.textContent(),/2023/);
 const proof=second.locator('a').first();assert.equal(await proof.getAttribute('target'),'_blank');assert.match(await proof.getAttribute('href'),/fuvest2023/);
 const teacherHtml=await page.evaluate(()=>window.MaluShare.buildHtml([{id:'s2-sociologia',classes:['2ªA']}],'professor','Sociologia',''));assert.ok(teacherHtml.includes('Questões já cobradas'));assert.ok(teacherHtml.includes('Crenshaw'));
 await page.locator('#uxSeries').selectOption('s3');await page.locator('#uxSubject').selectOption('filosofia');
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 const html=await page.evaluate(()=>window.MaluShare.buildHtml([{id:'s3-filosofia',classes:['3ªA']}],'alunos','Filosofia',''));
 assert.ok(!html.includes('Perguntas difíceis'));assert.ok(!html.includes('Limite da resposta:'));assert.ok(html.includes('Treino autoral opcional'));assert.ok(html.includes('Questões já cobradas'));assert.ok(html.includes('Cebraspe'));assert.ok(html.includes('Esquema de conceitos'));
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),before);
 const shared=await browser.newPage({viewport:{width:390,height:844}});await shared.setContent(html);await shared.locator('[data-material=esquema]').click();assert.equal(await shared.locator('.ux-board-model').count(),1);
 await shared.locator('[data-material=exames]').click();assert.equal(await shared.locator('.ux-exam-connections').count(),1);assert.equal(await shared.locator('.prof-panel,.ux-teacher-guide,.share-teacher-answers').count(),0);
 await page.locator('#s3-filosofia-semana-1-tab-notebook').click();assert.ok(await page.locator('#s3-filosofia-semana-1-panel-notebook .ux-exam-connections').isVisible());await page.locator('#s3-filosofia-semana-1-panel-notebook .ux-exam-connections').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/student-exams-mobile.png'});
 for(const subject of ['historia','filosofia','sociologia']){
  await page.locator('#uxSubject').selectOption(subject);await page.locator('#wkProject').click();await page.locator('[data-lesson-material=esquema]').click();
  for(let i=1;i<=6;i++){
   await page.locator('#projectionWeek').selectOption('s3-'+subject+'-semana-'+i);assert.equal(await page.locator('#projectionPage .ux-board-model').count(),1);
   assert.equal(await page.locator('#projectionPage .prof-panel,#projectionPage .ux-teacher-guide,#projectionPage .ux-exam-connections').count(),0);
   assert.ok(await page.locator('#projectionPage').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'scheme mobile overflow');
  }
  await page.locator('[data-lesson-material=exames]').click();
  for(let i=1;i<=6;i++){await page.locator('#projectionWeek').selectOption('s3-'+subject+'-semana-'+i);assert.equal(await page.locator('#projectionPage .ux-exam-connections').count(),1);assert.equal(await page.locator('#projectionPage .prof-panel,#projectionPage .ux-teacher-guide,#projectionPage .atv-prof').count(),0);assert.ok(await page.locator('#projectionPage').evaluate(n=>n.scrollWidth<=n.clientWidth+1));}
  await page.locator('#projectionClose').click();
 }
 await page.locator('#uxSubject').selectOption('filosofia');await page.locator('#wkProject').click();await page.locator('[data-lesson-material=esquema]').click();await page.screenshot({path:'test-results/editorial-board-mobile.png'});await page.locator('[data-lesson-material=exames]').click();await page.screenshot({path:'test-results/projected-exams-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS 59 sourced records, 37 lesson mappings, precise author distinctions, direct proof links, teacher export, unchanged saves and projection isolation');
}finally{await browser.close();await new Promise(r=>server.close(r));}
