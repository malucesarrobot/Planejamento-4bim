(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function validActivity(key,series){return new RegExp('^[hfs]'+series+'s[1-6](?:@[a-zA-Z0-9_-]+)?$').test(key)}
function mergeCompleted(local,remote,series){
 const merged={};
 for(const source of [local||{},remote||{}])for(const [key,value] of Object.entries(source))if(value&&validActivity(key,series))merged[key]=true;
 return merged;
}
function disciplines(series,completed,progressKey){return [['h','História'],['f','Filosofia'],['s','Sociologia']].map(([prefix,name])=>{
 const lessons=Array.from({length:6},(_,i)=>{const id=prefix+series+'s'+(i+1);return {id,week:i+1,done:completed[progressKey(id)]===true}});
 return {name,lessons,done:lessons.filter(x=>x.done).length,next:lessons.find(x=>!x.done)||null};
})}
root.PercursosTrackCore={normalize,validActivity,mergeCompleted,disciplines};
})(typeof window==='undefined'?globalThis:window);
