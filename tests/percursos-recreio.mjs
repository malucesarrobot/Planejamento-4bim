import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const files=Object.fromEntries(await Promise.all(['recreio.html','recreio.css','recreio.js'].map(async f=>[f,await readFile('percursos/'+f,'utf8')])));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
await context.route('**/*',async r=>{const path=new URL(r.request().url()).pathname.split('/').pop();if(files[path])return r.fulfill({body:files[path],contentType:path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'application/javascript'});return r.abort()});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const token='a'.repeat(32);
async function game(key){await page.locator('[data-game="'+key+'"]').click()}
async function menu(){await page.getByRole('button',{name:'Escolher outro jogo',exact:false}).click()}
const status=()=>page.locator('#feedback').textContent();
try{
 await page.goto('https://percursos.test/recreio.html#turma='+token);
 assert.equal(await page.locator('[data-game]').count(),7);
 assert.equal(await page.locator('#backLessons').getAttribute('href'),'aluno.html#turma='+token);
 await game('logic');await page.getByRole('button',{name:'9',exact:true}).click();assert.match(await status(),/Tente/);await page.getByRole('button',{name:'10',exact:true}).click();assert.match(await status(),/Isso/);await menu();
 await game('words');const cells=page.locator('.word-grid button');for(const [start,end]of [[9,11],[25,43],[36,56]]){await cells.nth(start).click();await cells.nth(end).click()}assert.match(await status(),/todas/);await menu();
 await game('tic');for(let i=0;i<9;i++){const cell=page.locator('.tic-grid button').nth(i);if(await cell.isEnabled())await cell.click()}assert.match(await status(),/venceu|computador fez|Empate/);await menu();
 await game('hang');for(const letter of ['J','A','N','E','L'])await page.getByRole('button',{name:letter,exact:true}).click();assert.match(await status(),/descobriu: JANELA/);await page.getByRole('button',{name:'Jogar de novo',exact:false}).click();for(const letter of ['B','C','F','H','K','L'])await page.getByRole('button',{name:letter,exact:true}).click();assert.match(await status(),/palavra era AMIZADE/);await menu();
 await game('order');
 const numbers=async()=>Promise.all((await page.locator('.order-grid button').allTextContents()).map(Number));
 async function solveOrder(){const values=await numbers();const descending=(await page.locator('#instructions').textContent()).includes('do maior');values.sort((a,b)=>descending?b-a:a-b);for(const n of values)await page.locator('.order-grid').getByRole('button',{name:String(n),exact:true}).click();assert.match(await status(),/Tudo em ordem/)}
 const firstOrder=await numbers();assert.equal(new Set(firstOrder).size,6);assert(firstOrder.every(n=>n>=1&&n<=20));
 const wrong=Math.max(...firstOrder);await page.locator('.order-grid').getByRole('button',{name:String(wrong),exact:true}).click();assert.match(await status(),/menor/);assert.equal(await page.locator('.order-grid button:disabled').count(),0);
 await solveOrder();await page.getByRole('button',{name:'Próximo desafio',exact:false}).click();assert.notDeepEqual((await numbers()).sort((a,b)=>a-b),firstOrder.sort((a,b)=>a-b));
 for(const [level,max,count]of [['Médio',50,6],['Desafio',100,9],['Fácil',20,6]]){await page.getByRole('button',{name:level,exact:true}).click();const values=await numbers();assert.equal(values.length,count);assert.equal(new Set(values).size,count);assert(values.every(n=>n>=1&&n<=max));await solveOrder()}
 await page.getByRole('button',{name:'Jogar de novo',exact:false}).click();assert.equal(await page.locator('.order-grid button:disabled').count(),0);await menu();
 await game('stones');assert.equal(await page.getByRole('button',{name:'Retirar 2',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Retirar 5',exact:true}).count(),1);for(let i=0;i<20;i++){const b=page.getByRole('button',{name:'Retirar 1',exact:true});if(!await b.isEnabled())break;await b.click();assert.match(await status(),/retirou [135]|Vitória/)}assert.match(await status(),/total inicial era/);await menu();
 await page.clock.install();await game('snake');const snake=page.locator('canvas');const initial=await snake.getAttribute('aria-label');await page.getByRole('button',{name:'Começar',exact:true}).click();await page.clock.runFor(460);assert.notEqual(await snake.getAttribute('aria-label'),initial);await page.getByRole('button',{name:'Pausar',exact:true}).click();const paused=await snake.getAttribute('aria-label');await page.clock.runFor(1000);assert.equal(await snake.getAttribute('aria-label'),paused);await page.getByRole('button',{name:'Cima',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.clock.runFor(460);assert.match(await snake.getAttribute('aria-label'),/linha 7/);await page.clock.runFor(5000);assert.match(await status(),/Fim da partida/);await page.getByRole('button',{name:'Jogar de novo',exact:false}).click();assert.match(await status(),/Começar/);await page.getByRole('button',{name:'Começar',exact:true}).click();await menu();await page.clock.runFor(6000);assert.equal(await page.locator('#menu').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/percursos-recreio-mobile.png',fullPage:true});
 console.log('PASS seven mobile games; fresh ordering numbers and three levels; odd-only pieces; snake movement, pause, direction, collision, restart and exit; class link preserved; no overflow or JS errors');
}finally{await browser.close()}
