import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname.includes('..')){res.writeHead(400);return res.end();}
    const file=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));
    const body=await readFile(file),ext=file.slice(file.lastIndexOf('.'));
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream'});res.end(body);
  }catch(e){res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://fonts.googleapis.com/**',r=>r.abort());
await page.route('https://fonts.gstatic.com/**',r=>r.abort());
await page.addInitScript(()=>{
  window.print=()=>{};
  // Keep old edits saved, without applying them to the replacement topics.
  localStorage.setItem('malu-ux-s9-historia-semana-1-edits',JSON.stringify({version:1,title:null,notebook:{'1.1.0':'Etiqueta salva antes desta revisão'},activity:{}}));
});
await mkdir('test-results',{recursive:true});
async function card(){return page.locator('article.week-card:visible');}
try {
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('body.ux-ready');
  assert.equal(await page.locator('article.week-card .student-curriculum').count(),60);
  assert.equal(await page.locator('textarea[data-save]').count(),451);
  const revisedTitles=['Redemocratização e Constituição de 1988','Nova República: democracia, economia e conflitos sociais','Guerra Fria: um mundo bipolar','Fim da Guerra Fria e nova ordem mundial','Descolonização da Ásia e Conferência de Bandung','Descolonização da África e pan-africanismo'];
  for(let i=0;i<6;i++){const id='s9-historia-semana-'+(i+1);assert.equal(await page.locator('#'+id+' .week-head h3').textContent(),revisedTitles[i]);assert.equal(await page.locator('#'+id+' .atv-titulo').textContent(),revisedTitles[i]);assert.equal(await page.locator('#'+id).getAttribute('data-content-revision'),'revisagoias-20261005');}
  assert.notEqual(await page.locator('#s9-historia-semana-1 .registro-node').first().textContent(),'Etiqueta salva antes desta revisão');
  assert.match(await page.locator('textarea[data-save="ux-s9-historia-semana-1-edits"]').inputValue(),/Etiqueta salva antes desta revisão/);
  const data=await page.locator('article.week-card').evaluateAll(cards=>cards.map(c=>{
    const expected={bncc:[],matriz:[]};
    for(const section of c.querySelectorAll('.plan-grid > .meta-curric')){
      const key=/BNCC/.test(section.querySelector('h4').textContent)?'bncc':'matriz';
      const heading=section.querySelector('h4').textContent;
      const codeNode=section.querySelector('.code');
      const text=(codeNode?codeNode.textContent:section.textContent.slice(heading.length)).split(' — ')[0];
      expected[key]=[...new Set(text.match(/GO-[A-Z0-9-]+|EM13CHS\d+|EF\d{2}HI\d+/g)||[])];
    }
    const actual={};
    for(const key of ['bncc','matriz'])actual[key]=[...c.querySelectorAll('.student-curriculum [data-code-kind="'+key+'"] .student-code-chip')].map(n=>n.textContent);
    return {id:c.id,expected,actual};
  }));
  for(const item of data)assert.deepEqual(item.actual,item.expected,item.id);
  console.log('PASS all 60 notebooks reproduce their existing BNCC and Matrix codes; old 9th-grade edits remain saved without overwriting the revised content');

  let c=await card();
  await c.getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
  await page.locator('#wkProject').click();
  await page.locator('.lesson-options > summary').click();
  await page.locator('#projectionRefs').click();
  await page.locator('.lesson-options > summary').click();
  assert.equal(await page.locator('#projectionPage .student-curriculum').isVisible(),true);
  assert.equal(await page.locator('#projectionPage .projection-refs').isVisible(),false);
  assert.match(await page.locator('#projectionPage .student-curriculum').textContent(),/EF09HI22/);
  assert.equal(await page.locator('#projectionPage [data-code-kind=matriz] .student-code-missing').count(),1);
  await page.screenshot({path:'test-results/mobile-codes-projection.png'});
  await page.locator('#projectionClose').click();
  await page.locator('#uxWeekChoices button').nth(1).click();c=await card();
  assert.equal(await c.getByRole('tab',{name:'Caderno dos alunos',exact:true}).getAttribute('aria-selected'),'true');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('body.ux-ready');c=await card();
  assert.equal(await c.getByRole('tab',{name:'Caderno dos alunos',exact:true}).getAttribute('aria-selected'),'true');
  console.log('PASS codes remain when sources are hidden, skill disclosure works, and chosen panel survives week navigation and reload');

  const groups=[['s9',['historia']],['s1',['historia','filosofia','sociologia']],['s2',['historia','filosofia','sociologia']],['s3',['historia','filosofia','sociologia']]];
  let checked=0;
  for(const [classValue,subjects] of groups){
    await page.locator('#uxSeries').selectOption(classValue);
    for(const subject of subjects){
      await page.locator('#uxSubject').selectOption(subject);
      for(let i=0;i<6;i++){
        await page.locator('#uxWeekChoices button').nth(i).click();
        c=await card();
        await c.getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
        assert.equal(await page.locator('article.week-card:visible').count(),1);
        assert.equal(await c.locator('.student-curriculum').isVisible(),true);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'notebook overflow '+await c.getAttribute('id'));
        await c.locator('.student-curriculum').scrollIntoViewIfNeeded();
        const foot=await c.locator('.student-curriculum').boundingBox();
        assert.ok(foot.x>=0 && foot.x+foot.width<=391,'footer clipping '+await c.getAttribute('id'));
        await c.getByRole('tab',{name:'Atividade',exact:true}).click();
        assert.equal(await c.locator('.atv-aluno').isVisible(),true);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'activity overflow '+await c.getAttribute('id'));
        checked++;
      }
    }
  }
  assert.equal(checked,60);
  console.log('PASS all 60 weeks work at phone width, in notebook and activity panels, without horizontal overflow');

  c=await card();await c.getByRole('tab',{name:'Caderno dos alunos',exact:true}).click();
  await c.locator('.student-curriculum').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/mobile-notebook-footer.png'});
  await c.getByRole('button',{name:'Editar aula',exact:true}).click();
  assert.equal(await page.locator('#uxEditorPreview .student-curriculum [contenteditable]').count(),0);
  assert.equal(await page.locator('#uxEditorPreview .student-curriculum').isVisible(),true);
  await page.locator('#uxEditorCancel').click();

  const mark=c.getByRole('checkbox',{name:'3ªB',exact:true});await mark.check();
  assert.match(await page.locator('#uxResume').textContent(),/1 de 6 semanas dadas/);
  await page.locator('#uxUndo').click();
  assert.match(await page.locator('#uxResume').textContent(),/0 de 6 semanas dadas/);
  console.log('PASS curriculum footer is protected from text editing and class progress updates with undo');

  await c.getByRole('button',{name:'Imprimir',exact:true}).click();
  await page.locator('#uxPrintScope').selectOption('all');
  await page.getByRole('button',{name:'Caderno dos alunos',exact:true}).click();
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.week-card .student-curriculum:visible').count(),60);
  assert.equal(await page.locator('.week-card .prof-panel:visible').count(),0);
  assert.equal(await page.locator('.week-card .ux-glossary:visible').count(),0);
  await page.pdf({path:'test-results/all-notebooks-with-codes.pdf',format:'A4',printBackground:true});
  const font=await page.locator('.week-card .student-curriculum').first().evaluate(n=>getComputedStyle(n).fontSize);
  assert.ok(parseFloat(font)>=13,'footer print text too small');
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({media:'screen'});
  assert.equal(await page.locator('article.week-card:visible').count(),1);
  console.log('PASS printed notebooks include all 60 curriculum footers and omit teacher material');
  assert.deepEqual(errors,[]);
  console.log('PASS second usability round');
}finally{await browser.close();await new Promise(r=>server.close(r));}
