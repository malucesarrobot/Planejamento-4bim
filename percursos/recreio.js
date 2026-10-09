(function(){
'use strict';
const $=id=>document.getElementById(id),board=$('board'),feedback=$('feedback');
let active='',round=0;
let orderLevel=0,previousOrder='',orderWins=0;
let cleanup=()=>{};
const titles={logic:'Qual vem depois?',words:'Caça-palavras',tic:'Jogo da velha',hang:'Forca',order:'Coloque em ordem',stones:'A última peça',snake:'Cobrinha'};
$('backLessons').href='aluno.html'+location.hash;
function say(message){feedback.textContent=message}
function button(text,action,parent=board){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>action(b));parent.appendChild(b);return b}
function block(text,cls,parent=board){const el=document.createElement('div');el.className=cls;el.textContent=text;parent.appendChild(el);return el}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function start(key){cleanup();cleanup=()=>{};active=key;$('menu').hidden=true;$('game').hidden=false;board.replaceChildren();say('');$('gameTitle').textContent=titles[key];games[key]();$('gameTitle').setAttribute('tabindex','-1');$('gameTitle').focus()}
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.game)));
$('backGames').addEventListener('click',()=>{cleanup();cleanup=()=>{};$('game').hidden=true;$('menu').hidden=false;document.querySelector('[data-game="'+active+'"]').focus()});
$('restart').addEventListener('click',()=>{round++;start(active)});
function instruction(text){$('instructions').textContent=text}
const games={
logic(){
 instruction('Observe o padrão. Toque na opção que vem depois.');
 const puzzles=[['2 · 4 · 6 · 8 · ?',['9','10','12'],'10','Os números aumentam de 2 em 2.'],['● · ▲ · ● · ▲ · ?',['●','■','▲'],'●','O círculo e o triângulo se alternam.'],['5 · 10 · 15 · 20 · ?',['21','25','30'],'25','Os números aumentam de 5 em 5.'],['■ · ■ · ● · ■ · ■ · ?',['▲','■','●'],'●','Duas figuras quadradas e um círculo.'],['10 · 8 · 6 · 4 · ?',['0','2','3'],'2','Os números diminuem de 2 em 2.'],['1 · 2 · 4 · 8 · ?',['10','12','16'],'16','Cada número é o dobro do anterior.']];
 const [pattern,choices,answer,explanation]=puzzles[round%puzzles.length];block(pattern,'sequence');const row=block('','choices');choices.forEach(choice=>button(choice,b=>{if(choice===answer){b.classList.add('chosen');row.querySelectorAll('button').forEach(x=>x.disabled=true);say('Isso! '+explanation)}else say('Tente outra opção. Observe o que se repete ou muda.');},row));
},
words(){
 instruction('Toque na primeira e na última letra da palavra. Elas estão em linha reta: na horizontal, vertical ou diagonal.');
 const sets=[['SOL','LUA','MAR'],['GATO','PATO','SAPO'],['LIVRO','ARTE','JOGO']];const words=sets[round%sets.length];
 const cells=Array.from({length:81},()=>String.fromCharCode(65+Math.floor(Math.random()*26)));
 const paths=words.map((word,i)=>Array.from(word,(_,j)=>i===0?9+j:i===1?(j+2)*9+7:(j+4)*9+j));
 paths.forEach((path,i)=>path.forEach((pos,j)=>cells[pos]=words[i][j]));
 const list=block('','word-list');const labels=words.map(w=>{const el=document.createElement('span');el.textContent=w;list.appendChild(el);return el});
 const grid=block('','word-grid');let first=null;const found=new Set();const buttons=cells.map((letter,index)=>{const b=button(letter,()=>select(index),grid);b.setAttribute('aria-label',letter+', linha '+(Math.floor(index/9)+1)+', coluna '+(index%9+1));return b});
 function select(index){if(found.size===words.length)return;if(first===null){first=index;buttons[index].classList.add('selected');say('Agora toque na última letra.');return}
 const previous=first;first=null;buttons[previous].classList.remove('selected');
 const hit=paths.findIndex(p=>(p[0]===previous&&p[p.length-1]===index)||(p[0]===index&&p[p.length-1]===previous));
 if(hit<0){say('Essa seleção não corresponde a uma das palavras. Tente novamente.');return}
 found.add(hit);paths[hit].forEach(pos=>buttons[pos].classList.add('found'));labels[hit].classList.add('found');say(found.size===words.length?'Você encontrou todas as palavras!':'Encontrou '+words[hit]+'! Faltam '+(words.length-found.size)+'.');
 }
 button('Limpar seleção',()=>{if(first!==null)buttons[first].classList.remove('selected');first=null;say('Seleção limpa. Toque na primeira letra.');});
},
tic(){
 instruction('Você é X. Toque em uma casa livre. O computador joga com O. Vença formando uma linha de três.');
 const grid=block('','tic-grid'),state=Array(9).fill('');let done=false;
 const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 const winner=()=>{const line=lines.find(l=>state[l[0]]&&l.every(i=>state[i]===state[l[0]]));return line?state[line[0]]:null};
 const buttons=state.map((_,i)=>{const b=button('',()=>play(i),grid);b.setAttribute('aria-label','Casa '+(i+1)+' vazia');return b});
 function draw(){buttons.forEach((b,i)=>{b.textContent=state[i];b.disabled=done||!!state[i];b.setAttribute('aria-label','Casa '+(i+1)+': '+(state[i]||'vazia'))})}
 function finish(){const win=winner();if(win||state.every(Boolean)){done=true;say(win==='X'?'Você venceu! Três X na mesma linha.':win==='O'?'O computador fez uma linha. Vamos tentar outra vez?':'Empate! Nenhuma casa ficou livre.');return true}return false}
 function moveFor(mark){return lines.map(l=>({l,marks:l.filter(i=>state[i]===mark),empty:l.filter(i=>!state[i])})).find(x=>x.marks.length===2&&x.empty.length===1)?.empty[0]}
 function play(i){if(done||state[i])return;state[i]='X';if(!finish()){const move=moveFor('O')??moveFor('X')??(!state[4]?4:undefined)??shuffle(state.map((x,j)=>x?null:j).filter(x=>x!==null))[0];state[move]='O';if(!finish())say('Sua vez. Procure uma linha ou bloqueie o O.')}draw()}
 say('Sua vez: jogue com X.');
},
hang(){
 instruction('Leia a dica e toque nas letras. Você pode errar seis vezes.');
 const puzzles=[['JANELA','Por ela, vemos o lado de fora.'],['AMIZADE','Laço entre pessoas que gostam de estar juntas.'],['LIVRO','Tem páginas e pode contar uma história.'],['PIPOCA','Milho que estoura e vira um lanche.'],['ESCOLA','Lugar de aprender e conviver.'],['PLANETA','A Terra é um deles.']];
 const [word,clue]=puzzles[round%puzzles.length];block('Dica: '+clue,'intro');const slots=block('','word-slots'),tries=block('','tries'),keys=block('','keyboard');const guessed=new Set();let errors=0,done=false;
 function draw(){slots.textContent=[...word].map(l=>guessed.has(l)||done?l:'_').join(' ');tries.textContent='Tentativas restantes: '+(6-errors)}
 for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')button(letter,b=>{if(done)return;guessed.add(letter);b.disabled=true;if(word.includes(letter)){b.classList.add('chosen');say('A letra '+letter+' está na palavra.')}else{errors++;b.classList.add('missed');say('A letra '+letter+' não está na palavra. Tente outra.')}if([...word].every(l=>guessed.has(l))){done=true;say('Você descobriu: '+word+'!')}else if(errors===6){done=true;say('A palavra era '+word+'. Você pode jogar de novo.')}if(done)keys.querySelectorAll('button').forEach(x=>x.disabled=true);draw();},keys);draw();
},
order(){
 const levels=[{name:'Fácil',max:20,count:6},{name:'Médio',max:50,count:6},{name:'Desafio',max:100,count:9}];
 const level=levels[orderLevel],descending=orderLevel>0&&Math.random()<.5;
 const direction=descending?'do maior para o menor':'do menor para o maior';
 instruction('Toque nos números '+direction+'. Novos números em cada partida. Não precisa arrastar.');
 const controls=block('','actions');
 levels.forEach((l,i)=>{const b=button(l.name,()=>{orderLevel=i;start('order')},controls);b.setAttribute('aria-pressed',String(i===orderLevel));if(i===orderLevel)b.classList.add('selected')});
 const pool=Array.from({length:level.max},(_,i)=>i+1),chosen=shuffle(pool).slice(0,level.count);
 const signature=values=>[...values].sort((a,b)=>a-b).join(',');
 if(signature(chosen)===previousOrder)chosen[0]=pool.find(n=>!chosen.includes(n));
 previousOrder=signature(chosen);
 const values=[...chosen].sort((a,b)=>descending?b-a:a-b);let next=0;
 const progress=block('0 de '+level.count+' números organizados','stone-count'),grid=block('','order-grid');
 shuffle(chosen).forEach(value=>button(String(value),b=>{
  if(value!==values[next]){say('Procure o '+(descending?'maior':'menor')+' número que ainda está disponível.');return}
  next++;b.classList.add('chosen');b.disabled=true;progress.textContent=next+' de '+level.count+' números organizados';
  if(next===level.count){orderWins++;say('Tudo em ordem! '+orderWins+' '+(orderWins===1?'desafio concluído.':'desafios concluídos.'));const nextGame=button('Próximo desafio →',()=>start('order'));nextGame.classList.add('chosen')}
  else say('Isso! Agora procure o próximo '+(descending?'maior':'menor')+' número.');
 },grid));
},
 stones(){
 instruction('Retire 1, 3 ou 5 peças. Depois o computador joga. Quem retirar a última vence. Observe: o total inicial ser par ou ímpar faz diferença?');
 const initial=12+Math.floor(Math.random()*9);let remaining=initial,done=false;const count=block('','stone-count'),pieces=block('','stones'),actions=block('','actions');
 const allowed=[1,3,5];const buttons=allowed.map(n=>button('Retirar '+n,b=>play(n),actions));
 function draw(){count.textContent=remaining+' '+(remaining===1?'peça restante':'peças restantes');pieces.replaceChildren();for(let i=0;i<remaining;i++){const s=document.createElement('span');s.className='stone';s.setAttribute('aria-hidden','true');pieces.appendChild(s)}buttons.forEach((b,i)=>b.disabled=done||allowed[i]>remaining)}
 function explain(){return ' O total inicial era '+initial+' ('+(initial%2?'ímpar':'par')+'). Cada retirada ímpar troca a paridade: com total ímpar vence quem começa; com total par vence quem joga depois.'}
 function play(n){if(done||n>remaining)return;remaining-=n;if(remaining===0){done=true;say('Você retirou a última peça. Vitória!'+explain());draw();return}const options=allowed.filter(n=>n<=remaining),take=options[Math.floor(Math.random()*options.length)];remaining-=take;if(remaining===0){done=true;say('O computador retirou '+take+' e pegou a última peça.'+explain())}else say('O computador retirou '+take+'. Sua vez.');draw()}
 draw();say('Sua vez. Quantas peças você quer retirar?');
},
snake(){
 instruction('Coma as frutas vermelhas e cresça. Use as setas abaixo ou no teclado. Evite as paredes e o próprio corpo.');
 const size=14,cell=28;let body=[{x:6,y:7},{x:5,y:7},{x:4,y:7}],direction={x:1,y:0},pending=direction,fruit=null,score=0,timer=null,done=false,started=false;
 const scoreLabel=block('Frutas: 0','stone-count'),canvas=document.createElement('canvas');canvas.width=canvas.height=size*cell;canvas.className='snake-board';canvas.setAttribute('role','img');board.appendChild(canvas);const ctx=canvas.getContext('2d');
 const toolbar=block('','actions');const toggle=button('Começar',()=>{if(done)return;if(timer)pause();else{started=true;toggle.textContent='Pausar';timer=setInterval(tick,Number(speed.value));say('Em jogo. Você pode pausar a qualquer momento.')}},toolbar);
 const label=document.createElement('label');label.textContent='Velocidade ';const speed=document.createElement('select');speed.setAttribute('aria-label','Velocidade da cobrinha');for(const [name,value]of [['Devagar',450],['Normal',280],['Rápida',150]])speed.add(new Option(name,String(value)));label.appendChild(speed);toolbar.appendChild(label);speed.addEventListener('change',()=>{if(timer){clearInterval(timer);timer=setInterval(tick,Number(speed.value))}});
 const arrows=block('','snake-controls');for(const [name,key,symbol]of [['Cima','ArrowUp','↑'],['Esquerda','ArrowLeft','←'],['Baixo','ArrowDown','↓'],['Direita','ArrowRight','→']]){const b=button(symbol,()=>turn(key),arrows);b.setAttribute('aria-label',name);b.className='snake-'+name.toLowerCase()}
 function pause(){clearInterval(timer);timer=null;toggle.textContent=started?'Continuar':'Começar';if(!done)say('Pausado. Toque em Continuar para voltar.');}
 function turn(key){const dirs={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};const d=dirs[key];if(d&&!(d.x===-direction.x&&d.y===-direction.y))pending=d}
 function spawn(){const free=[];for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!body.some(p=>p.x===x&&p.y===y))free.push({x,y});fruit=free[Math.floor(Math.random()*free.length)]||null;}
 function paint(){ctx.fillStyle='#eef6f0';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#dce9df';for(let i=0;i<=size;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(canvas.width,i*cell);ctx.stroke()}if(fruit){ctx.fillStyle='#c63c54';ctx.beginPath();ctx.arc((fruit.x+.5)*cell,(fruit.y+.5)*cell,cell*.32,0,Math.PI*2);ctx.fill()}body.forEach((p,i)=>{ctx.fillStyle=i?'#339077':'#174f42';ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4)});const head=body[0];canvas.setAttribute('aria-label','Cobrinha. Frutas: '+score+'. Cabeça na linha '+(head.y+1)+', coluna '+(head.x+1)+'.');scoreLabel.textContent='Frutas: '+score;}
 function finish(message){done=true;pause();toggle.disabled=true;say(message)}
 function tick(){direction=pending;const head={x:body[0].x+direction.x,y:body[0].y+direction.y};const eats=fruit&&head.x===fruit.x&&head.y===fruit.y;const occupied=eats?body:body.slice(0,-1);if(head.x<0||head.y<0||head.x>=size||head.y>=size||occupied.some(p=>p.x===head.x&&p.y===head.y)){finish('Fim da partida! Você pegou '+score+' frutas. Toque em Jogar de novo para tentar outra vez.');return}body.unshift(head);if(eats){score++;spawn()}else body.pop();paint();if(!fruit)finish('Você preencheu o tabuleiro inteiro. Vitória!')}
 function keys(event){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)&&!['SELECT','INPUT'].includes(event.target.tagName)){event.preventDefault();turn(event.key)}else if(event.code==='Space'&&event.target.tagName!=='BUTTON'&&event.target.tagName!=='SELECT'){event.preventDefault();toggle.click()}}
 function visibility(){if(document.hidden&&timer)pause()}
 window.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);
 cleanup=()=>{clearInterval(timer);window.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility)};
 spawn();paint();say('Toque em Começar quando estiver pronto.');
}
};
})();
