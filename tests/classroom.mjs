import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=path==='/'?'index.html':path.slice(1);if(file.includes('..'))throw Error();const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForSelector('body.ux-ready');
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    const boxes=await page.locator('#uxWeekChoices button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));
    assert.ok(boxes.every(b=>Math.abs(b.y-boxes[0].y)<1 && b.x>=0 && b.right<=width),'six weeks must stay in one row at '+width);
    assert.ok((await page.locator('.weekbar').boundingBox()).height<130,'compact week navigation');
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/mobile-navigation-compact.png'});
  assert.equal(await page.locator('.lesson-launch').count(),0);
  assert.equal(await page.locator('#uxResume').isVisible(),false);
  assert.equal(await page.locator('#uxStorage').isVisible(),false);
  assert.equal(await page.locator('#searchCount').isVisible(),false);
  assert.equal(await page.locator('#guia').isVisible(),false);
  const lesson=await page.locator('article.week-card:visible').boundingBox(),track=await page.locator('.study-track:visible').boundingBox();
  assert.ok(lesson.y<track.y,'lesson must precede the overview');
  await page.locator('#wkTrack').click();
  const trackBox=await page.locator('.study-track:visible').boundingBox();assert.ok(trackBox.y>=0 && trackBox.y<100);
  await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  await page.screenshot({path:'test-results/mobile-lesson-first.png'});
  await page.locator('article.week-card:visible').getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
  await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  assert.equal(await page.locator('article.week-card:visible').getAttribute('data-ux-panel'),'prepare');
  assert.equal(await page.locator('article.week-card:visible .prof-caderno').getAttribute('open'),'');
  assert.equal(await page.locator('article.week-card:visible .prof-panel').isVisible(),true);
  assert.equal(await page.locator('.lesson-quick-nav').count(),0);assert.equal(await page.locator('#wkPrepare').count(),0);
  await page.locator('#wkProject').click();
  assert.equal(await page.locator('[data-lesson-material=caderno]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#projectionPage .student-curriculum').isVisible(),true);
  for(const stage of ['pergunta','conteudo','caderno','atividade','fontes']){
    const b=page.locator('[data-lesson-material='+stage+']');
    await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391,'stage outside mobile viewport');
    await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#projectionPage .atv-prof').count(),0);
    assert.equal(await page.locator('#projectionPage textarea').count(),0);
    assert.doesNotMatch(await page.locator('#projectionPage').textContent(),/não possui um texto separado/);
  }
  const link=page.locator('#projectionPage .pr-fonte a').first(),url=await link.getAttribute('href');
  assert.ok(url.startsWith('https://'));
  await page.context().route(url,r=>r.fulfill({contentType:'text/html',body:'<h1>Fonte de teste</h1>'}));
  const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;
  await popup.waitForLoadState();assert.equal(popup.url(),url);await popup.close();
  assert.equal(await page.locator('[data-lesson-material=fontes]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-lesson-material=caderno]').click();
  const position=await page.locator('#projectionScroll').evaluate(n=>{n.scrollTop=250;return n.scrollTop;});
  await page.locator('[data-lesson-material=fontes]').click();await page.locator('[data-lesson-material=caderno]').click();
  assert.equal(await page.locator('#projectionScroll').evaluate(n=>n.scrollTop),position);
  assert.equal(await page.locator('.lesson-controls,#lessonNext,#lessonPosition').count(),0);
  assert.equal(await page.locator('#projectionWeek option').count(),6);
  await page.locator('[data-lesson-material=conteudo]').click();
  await page.locator('#projectionWeek').selectOption('s9-historia-semana-6');
  assert.equal(await page.locator('[data-lesson-material=conteudo]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#projectionNext').isDisabled(),true);
  assert.equal(await page.locator('#projectionPrev').isDisabled(),false);
  await page.locator('[data-lesson-material=atividade]').click();
  assert.equal(await page.locator('#projectionPage .atv-aluno').isVisible(),true);
  await page.locator('[data-lesson-material=fontes]').click();
  await page.locator('#projectionPrev').click();
  assert.equal(await page.locator('#projectionWeek').inputValue(),'s9-historia-semana-5');
  assert.equal(await page.locator('[data-lesson-material=fontes]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-lesson-material=caderno]').click();
  await page.locator('[data-lesson-material=pergunta]').click();
  await page.locator('[data-lesson-material=conteudo]').click();
  assert.equal(await page.locator('#projectionPage .atv-aluno').count(),0);
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/mobile-classroom-sources.png'});
  await page.locator('#projectionClose').click();
  assert.equal(await page.locator('article.week-card:visible').getAttribute('data-ux-panel'),'prepare');
  await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  await page.screenshot({path:'test-results/mobile-teacher-preparation.png'});
  await page.locator('#uxSeries').selectOption('s3');await page.locator('#uxSubject').selectOption('filosofia');await page.locator('#uxWeekChoices button').nth(2).click();
  await page.reload();await page.waitForSelector('body.ux-ready');await page.locator('#wkProject').click();
  assert.match(await page.locator('#projectionTitle').textContent(),/\S/);
  assert.equal(await page.locator('article.week-card:not(.ux-inactive):not(.hidden)').getAttribute('id'),'s3-filosofia-semana-3');
  assert.equal(await page.locator('[data-lesson-material=caderno]').getAttribute('aria-pressed'),'true');
  await page.locator('#projectionClose').click();
  assert.equal(await page.locator('.ux-glossary').count(),60);
  const coverage=await page.locator('article.week-card').evaluateAll(cards=>cards.every(c=>{
    const defined=[...c.querySelectorAll('.ux-glossary dt')].map(n=>n.textContent.trim().toLocaleLowerCase('pt-BR'));
    return [...c.querySelectorAll('.concept-chip')].every(n=>defined.includes(n.textContent.trim().toLocaleLowerCase('pt-BR')));
  }));assert.equal(coverage,true,'all listed concepts need glossary entries');
  await page.locator('#uxWeekChoices button').first().click();await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  const glossary=page.locator('article.week-card:visible .ux-glossary');
  assert.equal(await glossary.isVisible(),true);
  assert.ok(await glossary.locator('dt').count()>=15);
  for(const term of ['Belo','Arte','Fruição','Representação','Juízo estético'])assert.equal(await glossary.getByText(term,{exact:true}).isVisible(),true);
  assert.equal(await glossary.locator('.ux-glossary-example').count(),15);
  await glossary.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/mobile-glossary.png'});
  await page.locator('#wkProject').click();
  for(const material of ['pergunta','conteudo','caderno','atividade','fontes']){
    await page.locator('[data-lesson-material='+material+']').click();
    assert.equal(await page.locator('#projectionPage .ux-glossary').count(),0);
  }
  await page.locator('#projectionClose').click();
  await page.locator('#uxWeekChoices button').nth(1).click();await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  assert.match(await page.locator('article.week-card:visible .ux-glossary').textContent(),/Aura — em Walter Benjamin/);
  await page.locator('article.week-card:visible .ux-glossary-sources summary').click();
  assert.equal(await page.locator('article.week-card:visible .ux-glossary-sources a').count(),5);
  const reviewed=await page.locator('article.week-card').evaluateAll(cards=>cards.every(c=>{
    const study=c.querySelector('.ux-study');
    return study && study.querySelector('.ux-study-limit')?.textContent.length>80
      && study.querySelector('.ux-study-example')?.textContent.includes('situação fictícia')
      && study.querySelectorAll('.ux-study-sources a').length>0
      && !c.querySelector('.prof-panel .callout-title')?.textContent.includes('Curiosidade documentada');
  }));assert.equal(reviewed,true,'all lessons need substantive limitations, labelled examples and sources');
  await page.locator('#uxSeries').selectOption('s1');await page.locator('#uxSubject').selectOption('filosofia');await page.locator('#uxWeekChoices button').nth(2).click();
  await page.locator('article.week-card:visible [id$="-tab-prepare"]').click();
  const kant=page.locator('article.week-card:visible');
  for(const term of ['Dignidade','Pessoa como fim em si mesma','Autonomia moral','Dever e imperativo categórico','Preço e dignidade'])assert.equal(await kant.locator('.ux-glossary').getByText(term,{exact:true}).isVisible(),true);
  assert.match(await kant.locator('.atv-aluno').textContent(),/dignidade/);
  assert.match(await kant.locator('.atv-prof').textContent(),/manipula a decisão/);
  assert.match(await kant.locator('.ux-glossary').textContent(),/autonomia/);
  assert.doesNotMatch(await kant.textContent(),/Epicuro|ataraxia|aponia/);
  await kant.locator('.ux-study').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/mobile-kant-study.png'});
  await page.locator('#wkProject').click();
  for(const material of ['pergunta','conteudo','caderno','atividade','fontes']) {
    await page.locator('[data-lesson-material='+material+']').click();
    assert.equal(await page.locator('#projectionPage .ux-study').count(),0,'preparation must not leak into any projection material');
  }
  await page.locator('#projectionClose').click();
  console.log('PASS 60 substantive teacher supplements, explicit evidence limits and source provenance, Kant dignity and autonomy, no preparation leakage');
  console.log('PASS 60 teacher glossaries, full concept coverage, art definitions and examples, linked references and no projection leakage');
  assert.deepEqual(errors,[]);
  console.log('PASS one-tap classroom launch, independent materials visible on mobile, student-only content, direct source opening, scroll return, free choice and restored selection');
}finally{await browser.close();await new Promise(r=>server.close(r));}
