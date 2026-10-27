import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,file=p==='/'?'index.html':p.slice(1);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  const seed={version:1,year:2026,bimestre:4,turmas:{t:{id:'t',nome:'9ºA',serie:'9º ano',disciplina:'História'}},alunos:{p:{id:'p',nome:'Aluna de teste',turmaId:'t'}},mediaModo:{},activities:[{id:'a',turmaId:'t',nome:'Atividade de teste',data:'2026-10-20',valorMax:10,peso:1,checklist:false}],scores:{},attendance:{},reportCards:{},monitoring:{}};
  await page.addInitScript(seed=>{localStorage.setItem('malu-gradebook-2026-b4-v1',JSON.stringify(seed));localStorage.setItem('malu-gradebook-2026-b4-v1-class','t');},seed);
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('body.ux-ready');
  const open=async()=>{await page.locator('#navTools>summary').click();await page.getByRole('button',{name:'Notas e atividades',exact:true}).click();await page.getByRole('combobox',{name:'Turma, escola e disciplina'}).selectOption('t');};
  await open();assert.equal(await page.locator('#gradebook > .gb-info').isVisible(),true);
  await page.locator('input[data-gb-activity="a"]').fill('7.5');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')).scores.p?.a===7.5);
  await page.getByRole('button',{name:'Pontos extras',exact:true}).click();
  const extra=page.getByRole('spinbutton',{name:'Pontos extras — Aluna de teste',exact:true});
  await extra.fill('1');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')).scores.p?.['pontos-extras-b4-t']===1);
  await page.getByRole('cell',{name:'8,5',exact:true}).waitFor();
  await extra.fill('2.5');await page.getByRole('cell',{name:'10',exact:true}).waitFor();
  await extra.fill('');await page.getByRole('cell',{name:'7,5',exact:true}).waitFor();
  await extra.fill('1');await page.getByRole('cell',{name:'8,5',exact:true}).waitFor();
  const extrasState=await page.evaluate(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')));
  assert.equal(extrasState.activities.filter(a=>a.id==='pontos-extras-b4-t').length,1);
  assert.equal(extrasState.scores.p.a,7.5);assert.deepEqual(extrasState.attendance,{});
  await page.getByRole('button',{name:'← Voltar às notas',exact:true}).click();
  await page.getByRole('button',{name:'Nova atividade',exact:true}).click();await page.locator('.gb-form input[type=text]').fill('Registro automático');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')).activities.some(a=>a.nome==='Registro automático'));
  await page.locator('.gb-form input[type=text]').fill('Registro atualizado');
  await page.mouse.click(1,1);await page.waitForFunction(()=>!document.getElementById('gradebook').open);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')));assert.equal(state.activities.length,3);assert.equal(state.activities[2].nome,'Registro atualizado');
  await open();await page.getByRole('button',{name:'Aluna de teste',exact:true}).click();await page.getByText('Editar notas anteriores e acompanhamento',{exact:true}).click();
  await page.getByRole('spinbutton',{name:'1º bimestre — Aluna de teste — História',exact:true}).fill('6.5');
  await page.mouse.click(1,1);await page.waitForFunction(()=>!document.getElementById('gradebook').open);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('malu-gradebook-2026-b4-v1')).reportCards.p.bimestres[1]),6.5);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS mobile/desktop autosave, stable activity ID, final edit saved on backdrop close, numeric score and bulletin without save buttons');
}finally{await browser.close();await new Promise(r=>server.close(r));}
