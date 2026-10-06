import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';
import { chromium } from 'playwright';

const sandbox={};vm.createContext(sandbox);vm.runInContext(await readFile('planner-core.js','utf8'),sandbox);
const core=sandbox.MaluPlannerCore;
assert.equal(core.chooseWeek(['w1','w2'],'w2'),'w2');
assert.equal(core.chooseWeek(['w1','w2'],'missing'),'w1');
assert.equal(core.chooseWeek([],'w2'),null);
assert.equal(core.dateBR('2026-10-03'),'03/10/2026');
assert.equal(core.dateLocal(new Date(2026,9,3)),'2026-10-03');
assert.throws(()=>core.parseEdits('{"version":1,"title":null,"notebook":{"__proto__":"x"},"activity":{}}'));
assert.throws(()=>core.parseEdits('{"version":1,"title":null,"notebook":[],"activity":{}}'));
assert.equal(core.parseEdits('').title,null);
console.log('PASS helpers: week selection, dates, edit validation');

const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname.includes('..')){res.writeHead(400);return res.end();}
    const file=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));
    const content=await readFile(file);const ext=file.slice(file.lastIndexOf('.'));
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(content);
  }catch(e){res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
const page=await ctx.newPage();const errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.stack)});
await page.route('https://fonts.googleapis.com/**',r=>r.abort());
await page.route('https://fonts.gstatic.com/**',r=>r.abort());
await page.addInitScript(()=>{
  window.print=()=>{window.__printCount=(window.__printCount||0)+1;};
  if(!localStorage.getItem('malu-test-seeded')) {
    localStorage.setItem('malu-aulas-dadas',JSON.stringify({'s9-historia-semana-1|9ºC':'2026-10-02'}));
    localStorage.setItem('malu-ui-view',JSON.stringify({s:'s9',d:'historia',w:'s9-historia-semana-1',t:'9ºC'}));
    localStorage.setItem('malu-test-seeded','1');
  }
  if(!localStorage.getItem('malu-s9-historia-w1-obs'))localStorage.setItem('malu-s9-historia-w1-obs','Anotação anterior preservada.');
});
async function visibleCards(){return page.locator('article.week-card:visible').count();}
async function currentId(){return page.locator('article.week-card:visible').getAttribute('id');}
async function waitFor(predicate){for(let i=0;i<120;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Condition did not become true');}
async function tools(){if(await page.locator('#navTools').getAttribute('open')===null)await page.locator('#navTools > summary').click();}
try {
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('body.ux-ready');
  assert.equal(await visibleCards(),1);
  assert.equal(await page.getByRole('checkbox',{name:'9ºC',exact:true}).first().isChecked(),true);
  assert.equal(await page.getByRole('checkbox',{name:'9ºA',exact:true}).first().isChecked(),false);
  assert.equal(await page.locator('article.week-card').count(),60);
  assert.equal(await page.locator('textarea[data-save]').count(),451);
  assert.equal(await page.locator('textarea[data-save="s9-historia-w1-obs"]').inputValue(),'Anotação anterior preservada.');
  assert.equal(await page.locator('.study-track:visible').count(),1);
  assert.equal(await page.locator('article.week-card:visible .ux-week-date').textContent(),'01 a 09/10');
  assert.match(await page.locator('#wkLabel').textContent(),/01 a 09\/10/);
  assert.match(await page.locator('#guia').textContent(),/30\/11 a 18\/12/);
  assert.match(await page.locator('#guia').textContent(),/Calendário oficial SEDUC-GO/);
  console.log('PASS initial view, official SEDUC-GO dates, visible learning track and all legacy note fields preserved');
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});

  await page.locator('#uxWeekChoices button').last().click();
  assert.equal(await currentId(),'s9-historia-semana-6');
  await page.locator('#wkPrev').click();assert.equal(await currentId(),'s9-historia-semana-5');
  await page.locator('#wkNext').click();assert.equal(await currentId(),'s9-historia-semana-6');
  await page.locator('#uxSeries').selectOption('s3');
  await page.locator('#uxSubject').selectOption('filosofia');
  assert.equal(await visibleCards(),1);assert.match(await currentId(),/^s3-filosofia/);
  assert.equal(await page.locator('#uxSeries').inputValue(),'s3');
  console.log('PASS week navigation and series selection');

  const chosen=await currentId();
  let card=page.locator('#'+chosen);
  await card.getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
  assert.equal(await card.locator('.wide.notebook').isVisible(),true);
  assert.equal(await card.locator('.lide-box').isVisible(),false);
  await card.getByRole('tab',{name:'Atividade',exact:true}).click();
  assert.equal(await card.locator('.atv-aluno').isVisible(),true);
  assert.equal(await card.locator('.atv-prof').isVisible(),false);
  console.log('PASS content tabs and teacher answers initially collapsed');

  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  await page.locator('#uxEditTitle').fill('Aula exclusiva de teste');
  const edit=page.locator('#uxEditorPreview [contenteditable]').first();
  await edit.fill('Texto alterado com <img src=x onerror=alert(1)> como texto.');
  await page.locator('#uxEditActivity').click();
  await page.locator('#uxEditorPreview .atv-texto').fill('Texto-base alterado para a atividade.');
  await page.locator('#uxEditorSave').click();
  assert.equal(await card.locator('.week-head h3').textContent(),'Aula exclusiva de teste');
  assert.equal(await card.locator('.atv-texto').textContent(),'Texto-base alterado para a atividade.');
  assert.equal(await card.locator('.wide.notebook img').count(),0);
  await card.getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
  await page.locator('#wkProject').click();
  assert.match(await page.locator('#projectionPage').textContent(),/Texto alterado com <img/);
  await page.locator('[data-lesson-material=atividade]').click();
  assert.match(await page.locator('#projectionPage').textContent(),/Texto-base alterado/);
  await page.locator('#projectionClose').click();
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('body.ux-ready');
  assert.equal(await currentId(),chosen);card=page.locator('#'+chosen);
  assert.equal(await card.locator('.week-head h3').textContent(),'Aula exclusiva de teste');
  console.log('PASS safe editing of both panels, projection and reload persistence');

  assert.equal(await page.locator('#searchBox').count(),0);
  assert.equal(await page.locator('#clearSearchBtn').count(),0);
  assert.equal(await page.locator('#uxSeries option').count(),4);
  console.log('PASS compact series selection and search removed');

  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  await page.locator('#uxEditTitle').fill('Alteração cancelada');
  page.once('dialog',d=>d.accept());await page.locator('#uxEditorCancel').click();
  assert.equal(await card.locator('.week-head h3').textContent(),'Aula exclusiva de teste');
  const mark=card.getByRole('checkbox',{name:'3ªB',exact:true});
  const other=card.getByRole('checkbox',{name:'3ªA',exact:true});
  await mark.check();assert.equal(await mark.isChecked(),true);
  assert.match(await mark.getAttribute('title'),/^Aplicado em \d{2}\/\d{2}\/\d{4}$/);
  assert.equal(await other.isChecked(),false);
  await page.locator('#uxUndo').click();assert.equal(await mark.isChecked(),false);
  await mark.check();await other.check();await mark.uncheck();
  assert.equal(await other.isChecked(),true);
  await page.locator('#uxUndo').click();assert.equal(await mark.isChecked(),true);
  await page.reload();await page.waitForSelector('body.ux-ready');
  assert.equal(await page.locator('#uxSeries').inputValue(),'s3');
  assert.equal(await mark.isChecked(),true);assert.equal(await other.isChecked(),true);
  console.log('PASS cancel, independent class checkboxes, undo and persisted completion');

  await tools();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar cópia de segurança',exact:true}).click();
  const download=await downloadPromise;await download.saveAs('test-results/backup.json');
  const backup=JSON.parse(await readFile('test-results/backup.json','utf8'));
  assert.equal(backup.fieldCount,451);
  assert.equal(backup.notes['s9-historia-w1-obs'],'Anotação anterior preservada.');
  assert.ok(backup.notes['ux-'+chosen+'-edits']);
  assert.ok(backup.aulasDadas[chosen+'|3ªB']);
  await page.locator('#navTools > summary').click();
  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  page.once('dialog',d=>d.accept());await page.locator('#uxRestoreOriginal').click();
  assert.notEqual(await card.locator('.week-head h3').textContent(),'Aula exclusiva de teste');
  await tools();await page.locator('#importFile').setInputFiles('test-results/backup.json');
  await waitFor(async()=>await card.locator('.week-head h3').textContent()==='Aula exclusiva de teste');
  assert.equal(await page.locator('textarea[data-save="s9-historia-w1-obs"]').inputValue(),'Anotação anterior preservada.');
  await page.locator('#navTools > summary').click();
  console.log('PASS backup export, restore original and import with legacy notes intact');

  await card.getByRole('button',{name:'Imprimir',exact:true}).click();
  await page.locator('#uxPrintScope').selectOption('discipline');
  await page.getByRole('button',{name:'Caderno dos alunos',exact:true}).click();
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.week-card .wide.notebook:visible').count(),6);
  assert.equal(await page.locator('.week-card .atv-prof:visible').count(),0);
  assert.equal(await page.locator('.week-card .prof-panel:visible').count(),0);
  await page.pdf({path:'test-results/cadernos.pdf',format:'A4',printBackground:true});
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({media:'screen'});assert.equal(await visibleCards(),1);
  await card.getByRole('button',{name:'Imprimir',exact:true}).click();
  await page.locator('#uxPrintScope').selectOption('all');
  await page.getByRole('button',{name:'Atividade dos alunos',exact:true}).click();
  assert.equal(await page.locator('#atvPrint .atv-aluno').count(),60);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  assert.equal(await visibleCards(),1);
  console.log('PASS printing includes all selected weeks and excludes teacher answers');

  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#searchBox').count(),0);
  assert.equal(await page.locator('#wkProject').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.equal(await page.locator('.lesson-quick-nav').count(),0);const box=await page.locator('.weekbar').boundingBox();assert.ok(box.width<=390);
  assert.equal(await card.locator('.ux-actions').evaluate(n=>getComputedStyle(n).position),'static');
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  assert.equal(await page.locator('#uxEditorSave').isVisible(),true);
  await page.screenshot({path:'test-results/mobile-editor.png'});
  await page.locator('#uxEditorCancel').click();
  console.log('PASS mobile controls, no horizontal overflow and editor access');

  let unavailable=false, patchGate=null, patchStarted=false; const patches=[];
  const remoteEdit={version:1,title:'Título recebido de outro aparelho',notebook:{},activity:{},revision:await card.getAttribute('data-content-revision')};
  const remote={notes:{['ux-'+chosen+'-edits']:{v:JSON.stringify(remoteEdit),t:Date.now()+100000}},aulas:{}};
  await page.route('https://planejamento-4bim-default-rtdb.firebaseio.com/**',async route=>{
    if(unavailable)return route.abort();
    if(route.request().method()==='PATCH') {
      const body=route.request().postDataJSON();patches.push(body);patchStarted=true;
      if(patchGate)await patchGate;
      for(const [path,value] of Object.entries(body)) {
        const bits=path.split('/');let node=remote;
        for(const bit of bits.slice(0,-1))node=node[bit] || (node[bit]={});
        node[bits.at(-1)]=value;
      }
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().method()==='GET'?remote:{})});
  });
  await tools();await page.locator('#syncBtn').click();await page.locator('#syncGen').click();await page.locator('#syncConnect').click();
  await waitFor(async()=>await card.locator('.week-head h3').textContent()==='Título recebido de outro aparelho');
  await waitFor(async()=>/Sincronizado/.test(await page.locator('#uxStorage').textContent()));
  unavailable=true;await page.evaluate(()=>window.MaluSync.syncNow());
  assert.match(await page.locator('#uxStorage').textContent(),/aguardando sincronização/);
  await page.locator('#syncClose').click();
  console.log('PASS mocked cross-device updates and offline status (no production database writes)');
  unavailable=false;
  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  await page.locator('#uxEditTitle').fill('Primeira edição durante envio');
  await page.locator('#uxEditorSave').click();
  let release;patchStarted=false;patchGate=new Promise(r=>release=r);
  const syncing=page.evaluate(()=>window.MaluSync.syncNow());
  await waitFor(()=>patchStarted);
  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  await page.locator('#uxEditTitle').fill('Segunda edição durante envio');
  await page.locator('#uxEditorSave').click();
  release();patchGate=null;await syncing;
  await waitFor(()=>patches.some(p=>Object.values(p).some(v=>typeof v.v==='string' && v.v.includes('Segunda edição durante envio'))));
  assert.equal(await card.locator('.week-head h3').textContent(),'Segunda edição durante envio');
  console.log('PASS edits made during network requests are sent and newer local edits survive clock differences');



  await tools();await page.locator('#syncBtn').click();
  const sameCode=await page.locator('#syncCode').inputValue();
  await page.locator('#syncOff').click();await page.locator('#syncClose').click();
  await card.getByRole('button',{name:'Editar aula',exact:true}).click();
  await page.locator('#uxEditTitle').fill('Edição feita com sincronização desligada');
  await page.locator('#uxEditorSave').click();
  await tools();await page.locator('#syncBtn').click();
  await page.locator('#syncCode').fill(sameCode);await page.locator('#syncConnect').click();
  await waitFor(()=>remote.notes['ux-'+chosen+'-edits'].v.includes('Edição feita com sincronização desligada'));
  assert.equal(await card.locator('.week-head h3').textContent(),'Edição feita com sincronização desligada');
  await page.locator('#syncClose').click();
  console.log('PASS edits while disconnected survive reconnect and reach the other device');

  assert.deepEqual(errors,[],'No uncaught page errors');
  console.log('PASS browser regression suite');
} finally {await browser.close();await new Promise(r=>server.close(r));}
