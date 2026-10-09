(function(){
'use strict';
const $=id=>document.getElementById(id),board=$('board'),feedback=$('feedback');
let active='',round=0;
const titles={logic:'Qual vem depois?',words:'Caça-palavras',tic:'Jogo da velha',hang:'Forca',order:'Coloque em ordem',stones:'A última peça'};
$('backLessons').href='aluno.html'+location.hash;
function say(message){feedback.textContent=message}
function button(text,action,parent=board){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',()=>action(b));parent.appendChild(b);return b}
function block(text,cls,parent=board){const el=document.createElement('div');el.className=cls;el.textContent=text;parent.appendChild(el);return el}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function start(key){active=key;$('menu').hidden=true;$('game').hidden=false;board.replaceChildren();say('');$('gameTitle').textContent=titles[key];games[key]();$('gameTitle').setAttribute('tabindex','-1');$('gameTitle').focus()}
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.game)));
$('backGames').addEventListener('click',()=>{$('game').hidden=true;$('menu').hidden=false;document.querySelector('[data-game="'+active+'"]').focus()});
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
 instruction('Toque nos números do menor para o maior. Não precisa arrastar.');
 const base=round%3===0?1:round%3===1?10:20,values=Array.from({length:6},(_,i)=>base+i*2);let next=0;
 const progress=block('0 de 6 números organizados','stone-count'),grid=block('','order-grid');
 shuffle(values).forEach(value=>button(String(value),b=>{if(value!==values[next]){say('Procure o menor número que ainda está disponível.');return}next++;b.classList.add('chosen');b.disabled=true;progress.textContent=next+' de 6 números organizados';say(next===6?'Tudo em ordem! Você organizou do menor para o maior.':'Isso! Agora procure o próximo menor número.');},grid));
},
stones(){
 instruction('Retire 1, 2 ou 3 peças por vez. Depois o computador joga. Quem retirar a última peça vence.');
 let remaining=12+(round%3),done=false;const count=block('','stone-count'),pieces=block('','stones'),actions=block('','actions');
 const buttons=[1,2,3].map(n=>button('Retirar '+n,b=>play(n),actions));
 function draw(){count.textContent=remaining+' '+(remaining===1?'peça restante':'peças restantes');pieces.replaceChildren();for(let i=0;i<remaining;i++){const s=document.createElement('span');s.className='stone';s.setAttribute('aria-hidden','true');pieces.appendChild(s)}buttons.forEach((b,i)=>b.disabled=done||i+1>remaining)}
 function play(n){if(done||n>remaining)return;remaining-=n;if(remaining===0){done=true;say('Você retirou a última peça. Vitória!');draw();return}const take=remaining%4||Math.min(remaining,1+Math.floor(Math.random()*3));remaining-=take;if(remaining===0){done=true;say('O computador retirou '+take+' e pegou a última peça. Tente um novo plano!')}else say('O computador retirou '+take+'. Sua vez.');draw()}
 draw();say('Sua vez. Quantas peças você quer retirar?');
}
};
})();
