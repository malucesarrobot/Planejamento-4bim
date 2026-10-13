import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';

const server=http.createServer(async(req,res)=>{
  try {
    const path=new URL(req.url,'http://localhost').pathname;
    if(path.includes('..'))throw Error('Invalid path');
    const file=path==='/'?'index.html':path.slice(1);
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
const forbidden=/fornecido pela professora|apoio para a professora|A aula deve comparar|O foco deve estar|conexões de prova a verificar|não atribuir à prova|não atribuir essas questões|Respostas esperadas|Orientações de correção/iu;
try {
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForSelector('body.ux-ready');
  await mkdir('test-results',{recursive:true});
  const ids=await page.locator('article.week-card').evaluateAll(ns=>ns.map(n=>n.id));
  assert.equal(ids.length,60);
  assert.equal(await page.locator('article.week-card .wide.notebook .notebook-questions').count(),0,'Written exercises belong only to Activities');
  for(const id of ids)assert.ok(await page.locator('#'+id+' .atv-aluno ol li').count()>0,id+' retains written activities');
  let checked=0;
  for(const id of ids){
    await page.evaluate(id=>window.openProjection(id),id);
    for(const mode of ['caderno','atividade','esquema','exames','fontes','pergunta','conteudo']){
      await page.locator('[data-lesson-material='+mode+']').click();
      const text=await page.locator('#projectionPage').innerText();
      assert.ok(text.trim(),id+' '+mode+' empty');
      assert.doesNotMatch(text,forbidden,id+' '+mode);
      assert.equal(await page.locator('#projectionPage .atv-prof,#projectionPage .prof-panel,#projectionPage textarea').count(),0);
      if(mode==='fontes')assert.ok(await page.locator('#projectionPage .pr-fonte a').first().isVisible(),id+' source hidden');
      checked++;
    }
    await page.locator('#projectionClose').click();
  }
  for(const s of ['s1','s2','s3']){
    const one=await page.locator('#'+s+'-filosofia-semana-1 .atv-aluno').innerText();
    assert.doesNotMatch(one,/Copie somente o registro/);
    assert.match(one,/única cópia/);
    const two=await page.locator('#'+s+'-filosofia-semana-2 .registro-integrado').innerText();
    assert.match(two,/respectivas aulas/);
  }
  for(const id of ids.filter(id=>id.startsWith('s9-'))){
    assert.doesNotMatch(await page.locator('#'+id+' .atv-aluno').textContent(),/três vistos|registro integrado/);
  }
  assert.equal(await page.locator('#s3-filosofia-semana-1 .ux-glossary dt').count(),3);
  assert.match(await page.locator('#s3-historia-semana-1 .wide.notebook').textContent(),/eleição presidencial de 1985 ocorreu indiretamente/);
  const selections=await page.evaluate(()=>window.MaluShare.groups().map(g=>({id:g.id,classes:[g.classes[0]]})));
  const html=await page.evaluate(({selections,css})=>window.MaluShare.buildHtml(selections,'alunos','Material do aluno — revisão da auditoria',css),{selections,css:await readFile('assets/css/planner-base.css','utf8')});
  await writeFile('test-results/student-audit-export.html',html);
  const exported=await browser.newPage({viewport:{width:390,height:844}});
  await exported.route('https://**',r=>r.abort());
  await exported.setContent(html);
  let exports=0;
  for(let g=0;g<selections.length;g++){
    await exported.locator('#shareGroup').selectOption(String(g));
    for(let w=0;w<6;w++){
      await exported.locator('.share-weeks button').nth(w).click();
      for(const mode of ['quadro','atividade','esquema','exames','fontes']){
        await exported.locator('[data-material='+mode+']').click();
        assert.doesNotMatch(await exported.locator('.share-content').innerText(),forbidden,selections[g].id+' W'+(w+1)+' '+mode);
        exports++;
      }
    }
  }
  // Gerar PDFs reais pelas regras de impressão da projeção, além de verificar o DOM.
  await page.evaluate(()=>window.print=()=>{});
  for(const [id,mode] of [['s1-filosofia-semana-2','atividade'],['s3-historia-semana-1','caderno'],['s3-historia-semana-1','atividade'],['s9-historia-semana-2','atividade'],['s3-filosofia-semana-1','fontes']]){
    await page.evaluate(id=>window.openProjection(id),id);
    await page.locator('[data-lesson-material='+mode+']').click();
    await page.locator('#projectionView .lesson-options > summary').click();
    await page.locator('#projectionPrint').click();
    await page.emulateMedia({media:'print'});
    assert.doesNotMatch(await page.locator('#projectionPage').innerText(),forbidden);
    await page.pdf({path:'test-results/audit-'+id+'-'+mode+'.pdf',format:'A4',printBackground:true});
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({media:'screen'});
    if(id==='s3-filosofia-semana-1')await page.screenshot({path:'test-results/audit-fontes-mobile.png'});
    await page.locator('#projectionClose').click();
  }
  await exported.locator('#shareGroup').selectOption('3');
  await exported.locator('.share-weeks button').nth(1).click();
  await exported.locator('[data-material=atividade]').click();
  await exported.screenshot({path:'test-results/audit-export-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS '+checked+' projected surfaces, '+exports+' exported surfaces, unique integrated records, three-term glossary and five real student print PDFs');
}finally{await browser.close();await new Promise(r=>server.close(r));}
