import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.fulfill({contentType:'application/json',body:'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('malu-PRIVATE_TEST','PRIVATE_NOTE_98431');localStorage.setItem('malu-sync-cfg',JSON.stringify({url:'https://test.firebaseio.com',code:'PRIVATE_SYNC_98431'}));});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('#shareMaterial',{state:'attached'});
 await page.locator('article.week-card .wide.notebook').first().evaluate(n=>n.append(document.createTextNode('PRIVATE_EDIT_98431')));
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 await page.locator('#navTools>summary').click();await page.locator('#shareMaterial').click();
 await page.locator('#shareChoices [data-share-group]').evaluateAll(ns=>ns.forEach(n=>{n.checked=false;n.dispatchEvent(new Event('change'));}));
 for(const id of ['s3-historia','s1-filosofia'])await page.locator('[data-share-group][value="'+id+'"]').check();
 await page.locator('#shareName').fill('Professor Andrei');
 const downloadEvent=page.waitForEvent('download');await page.locator('#shareDownload').click();const download=await downloadEvent;const html=await readFile(await download.path(),'utf8');
 for(const privateValue of ['PRIVATE_NOTE_98431','PRIVATE_EDIT_98431','PRIVATE_SYNC_98431','firebaseio.com','malu-sync-cfg'])assert.ok(!html.includes(privateValue),privateValue+' leaked');
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),before,'export must leave personal saves untouched');
 const share=await browser.newPage({viewport:{width:390,height:844}});await share.setContent(html);
 assert.equal(await share.locator('#shareGroup option').count(),2);assert.deepEqual((await share.locator('#shareGroup option').allTextContents()).sort(),['1ª série · Filosofia','3ª série · História']);assert.equal(await share.locator('.share-weeks button').count(),6);
 await share.locator('[data-material=preparacao]').click();assert.equal(await share.locator('.ux-study').count(),1);assert.equal(await share.locator('.share-teacher-answers').count(),1);
 await share.locator('#shareProject').click();assert.equal(await share.locator('.prof-panel,.share-teacher-answers').count(),0);assert.equal(await share.locator('.wide.notebook').isVisible(),true);
 await mkdir('test-results',{recursive:true});await share.screenshot({path:'test-results/sharing-teacher-mobile.png'});
 const example=await page.evaluate(css=>window.MaluShare.buildHtml([{id:'s3-historia',classes:['3ªA','3ªB','3ªC']},{id:'s1-filosofia',classes:['1ªA','1ªB']}],'professor','História · 3ª série e Filosofia · 1ª série',css),await readFile('assets/css/planner-base.css','utf8'));await writeFile('test-results/share-prof-example.html',example);
 const student=await page.evaluate(()=>window.MaluShare.buildHtml([{id:'s3-historia',classes:['3ªA']}],'alunos','3ª A',''));
 assert.ok(!student.includes('"preparacao":'));assert.ok(!student.includes('Resposta esperada'));assert.ok(!student.includes('Fundamentação acadêmica'));assert.ok(!student.includes('PRIVATE_'));
 const studentPage=await browser.newPage({viewport:{width:390,height:844}});await studentPage.setContent(student);assert.equal(await studentPage.locator('[data-material=preparacao]').count(),0);assert.equal(await studentPage.locator('#shareAudience').textContent(),'3ªA');
 await studentPage.locator('#shareProject').click();assert.equal(await studentPage.locator('.wide.notebook').isVisible(),true);
 for(let week=0;week<6;week++){await studentPage.locator('.share-weeks button').nth(week).click();for(const material of ['quadro','atividade','fontes']){await studentPage.locator('[data-material='+material+']').click();assert.ok((await studentPage.locator('.share-content').textContent()).trim().length>0);}}
 assert.equal(await studentPage.locator('.share-content a').first().getAttribute('target'),'_blank');
 await studentPage.locator('[data-material=quadro]').click();assert.ok(await studentPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');
 assert.equal(await page.locator('#shareMessage').textContent().then(t=>t.startsWith('Versão baixada')),true);assert.deepEqual(errors,[]);
 console.log('PASS Andrei multi-series selection, six weeks, class scope, teacher preparation and answers, student board/activities/sources, no personal data or synchronization, unchanged saves and mobile export');
}finally{await browser.close();await new Promise(r=>server.close(r));}
