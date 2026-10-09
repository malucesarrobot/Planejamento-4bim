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
 assert.equal(await page.locator('[data-game]').count(),6);
 assert.equal(await page.locator('#backLessons').getAttribute('href'),'aluno.html#turma='+token);
 await game('logic');await page.getByRole('button',{name:'9',exact:true}).click();assert.match(await status(),/Tente/);await page.getByRole('button',{name:'10',exact:true}).click();assert.match(await status(),/Isso/);await menu();
 await game('words');const cells=page.locator('.word-grid button');for(const [start,end]of [[9,11],[25,43],[36,56]]){await cells.nth(start).click();await cells.nth(end).click()}assert.match(await status(),/todas/);await menu();
 await game('tic');for(let i=0;i<9;i++){const cell=page.locator('.tic-grid button').nth(i);if(await cell.isEnabled())await cell.click()}assert.match(await status(),/venceu|computador fez|Empate/);await menu();
 await game('hang');for(const letter of ['J','A','N','E','L'])await page.getByRole('button',{name:letter,exact:true}).click();assert.match(await status(),/descobriu: JANELA/);await page.getByRole('button',{name:'Jogar de novo',exact:false}).click();for(const letter of ['B','C','F','H','K','L'])await page.getByRole('button',{name:letter,exact:true}).click();assert.match(await status(),/palavra era AMIZADE/);await menu();
 await game('order');for(const n of [10,12,14,16,18,20])await page.getByRole('button',{name:String(n),exact:true}).click();assert.match(await status(),/Tudo em ordem/);await menu();
 await game('stones');for(let i=0;i<15;i++){const b=page.getByRole('button',{name:'Retirar 1',exact:true});if(!await b.isEnabled())break;await b.click()}assert.match(await status(),/Vitória|última peça/);await menu();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/percursos-recreio-mobile.png',fullPage:true});
 console.log('PASS six accessible mobile games: logic, word search, tic-tac-toe, hangman success/failure, ordering, strategy; class link preserved; no overflow or JS errors');
}finally{await browser.close()}
