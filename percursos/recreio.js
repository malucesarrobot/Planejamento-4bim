(function(){
'use strict';
const $=id=>document.getElementById(id),board=$('board'),feedback=$('feedback');
let active='',round=0;
let mathLevel=0,previousMath='',mathWins=0,dotsMode='computer';
let cleanup=()=>{};
const titles={logic:'Qual vem depois?',words:'Caça-palavras',tic:'Jogo da velha',hang:'Forca',dots:'Jogo do pontinho',math:'Pequenos cálculos',snake:'Cobrinha'};
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
dots(){
 instruction('Toque entre dois pontos para desenhar uma linha. Quem fechar um quadrado ganha um ponto e joga outra vez.');
 const modes=block('','actions');for(const [key,name]of [['computer','Contra o computador'],['two','Duas pessoas']]){const b=button(name,()=>{dotsMode=key;start('dots')},modes);b.setAttribute('aria-pressed',String(dotsMode===key));if(dotsMode===key)b.classList.add('selected')}
 const names=dotsMode==='computer'?['Você','Computador']:['Jogador 1','Jogador 2'];
 const scores=[0,0],owners=Array(9).fill(null);let turn=0,done=false;
 const score=block('','dots-score'),grid=block('','dots-grid');const edges=[],boxes=[];
 function edge(kind,row,col){const e={kind,row,col,owner:null,button:null};edges.push(e);return e}
 const horizontal=Array.from({length:4},(_,r)=>Array.from({length:3},(_,c)=>edge('h',r,c)));
 const vertical=Array.from({length:3},(_,r)=>Array.from({length:4},(_,c)=>edge('v',r,c)));
 const sides=Array.from({length:9},(_,i)=>{const r=Math.floor(i/3),c=i%3;return [horizontal[r][c],horizontal[r+1][c],vertical[r][c],vertical[r][c+1]]});
 for(let r=0;r<7;r++)for(let c=0;c<7;c++){
  if(r%2===0&&c%2===0){const dot=block('','dots-dot',grid);dot.setAttribute('aria-hidden','true')}
  else if(r%2===1&&c%2===1){const index=Math.floor(r/2)*3+Math.floor(c/2);boxes[index]=block('','dots-box',grid);boxes[index].setAttribute('aria-label','Quadrado '+(index+1)+' livre')}
  else{const e=r%2===0?horizontal[r/2][Math.floor(c/2)]:vertical[Math.floor(r/2)][c/2];const b=button('',()=>play(e),grid);e.button=b;b.className='dots-edge '+(e.kind==='h'?'dots-horizontal':'dots-vertical');b.setAttribute('aria-label','Linha '+(e.kind==='h'?'horizontal':'vertical')+', linha '+(e.row+1)+', coluna '+(e.col+1))}
 }
 function draw(){score.textContent=names[0]+': '+scores[0]+' · '+names[1]+': '+scores[1];edges.forEach(e=>{e.button.disabled=done||e.owner!==null;if(e.owner!==null)e.button.classList.add('dots-player-'+e.owner)});owners.forEach((owner,i)=>{if(owner!==null){boxes[i].textContent=owner===0?'1':'2';boxes[i].classList.add('dots-player-'+owner);boxes[i].setAttribute('aria-label','Quadrado '+(i+1)+' de '+names[owner])}})}
 function claim(e){e.owner=turn;let gained=0;sides.forEach((list,i)=>{if(owners[i]===null&&list.every(x=>x.owner!==null)){owners[i]=turn;scores[turn]++;gained++}});if(!gained)turn=1-turn;return gained}
 function finish(){if(owners.some(x=>x===null))return false;done=true;say(scores[0]===scores[1]?'Empate! Todos os quadrados foram preenchidos.':names[scores[0]>scores[1]?0:1]+' venceu! Todos os quadrados foram preenchidos.');return true}
 function bot(){const free=edges.filter(e=>e.owner===null);const closing=free.filter(e=>sides.some(list=>list.includes(e)&&list.filter(x=>x.owner!==null).length===3));const safe=free.filter(e=>!sides.some(list=>list.includes(e)&&list.filter(x=>x.owner!==null).length===2));return shuffle(closing.length?closing:safe.length?safe:free)[0]}
 function play(e){if(done||e.owner!==null)return;const gained=claim(e);if(!finish()&&dotsMode==='computer'){while(turn===1&&!done){claim(bot());finish()}}if(!done)say(names[turn]+': sua vez.'+(gained&&turn===0?' Você fechou um quadrado e joga novamente.':gained&&dotsMode==='two'?' Fechou um quadrado e joga novamente.':''));draw()}
 draw();say(names[turn]+': sua vez. Toque em uma linha livre.');
},
math(){
 instruction('Resolva uma conta por vez. Toque na resposta. Você pode tentar novamente e pedir uma dica.');
 const modes=block('','actions');['Fácil','Médio','Desafio'].forEach((name,i)=>{const b=button(name,()=>{mathLevel=i;start('math')},modes);b.setAttribute('aria-pressed',String(mathLevel===i));if(mathLevel===i)b.classList.add('selected')});
 const pool=[];const max=mathLevel===0?10:20;for(let a=1;a<=max;a++)for(let b=1;b<=max;b++){pool.push({a,b,op:'+',answer:a+b});if(a>=b)pool.push({a,b,op:'−',answer:a-b})}
 if(mathLevel>0)for(let a=2;a<=(mathLevel===1?5:10);a++)for(let b=1;b<=10;b++){pool.push({a,b,op:'×',answer:a*b});if(mathLevel===2)pool.push({a:a*b,b:a,op:'÷',answer:b})}
 const operations=mathLevel===0?['+','−']:mathLevel===1?['+','−','×']:['+','−','×','÷'];const op=shuffle(operations)[0];const q=shuffle(pool.filter(q=>q.op===op&&q.a+' '+q.op+' '+q.b!==previousMath))[0];previousMath=q.a+' '+q.op+' '+q.b;
 block(mathWins+' '+(mathWins===1?'conta resolvida':'contas resolvidas'),'stone-count');block(previousMath+' = ?','sequence');
 const options=new Set([q.answer]);for(const candidate of shuffle(Array.from({length:7},(_,i)=>q.answer+i-3).filter(n=>n>=0)))if(options.size<3)options.add(candidate);
 const choices=block('','choices');let solved=false;
 for(const value of shuffle([...options]))button(String(value),b=>{if(solved)return;if(value===q.answer){solved=true;mathWins++;b.classList.add('chosen');choices.querySelectorAll('button').forEach(x=>x.disabled=true);say('Isso! '+previousMath+' = '+q.answer+'.');const next=button('Próxima conta →',()=>start('math'));next.classList.add('chosen')}else{b.disabled=true;say('Ainda não. Tente outra resposta ou peça uma dica.')}},choices);
 button('Ver dica',()=>{say(q.op==='+'?'Comece em '+q.a+' e conte mais '+q.b+'.':q.op==='−'?'Comece em '+q.a+' e volte '+q.b+' passos.':q.op==='×'?'Some '+q.a+' um total de '+q.b+' vezes.':'Divida '+q.a+' em grupos de '+q.b+'. Quantos grupos cabem?')});
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
