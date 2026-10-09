import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const coreSource=await readFile('percursos/tracks-core.js','utf8'),source=await readFile('percursos/tracks.js','utf8');
const token='a'.repeat(32),data={classTracks:{[token]:{label:'3ª série C',series:'3'}}},listeners=new Map();
const get=path=>path.split('/').reduce((v,k)=>v?.[k],data);
function set(path,value){const keys=path.split('/'),last=keys.pop();let parent=data;for(const key of keys)parent=parent[key]??={};parent[last]=structuredClone(value);for(const [p,callbacks]of listeners)if(path===p||path.startsWith(p+'/'))for(const callback of callbacks)callback({val:()=>structuredClone(get(p)??null),exists:()=>get(p)!=null})}
class Ref{
 constructor(path){this.path=path}child(key){return new Ref(this.path+'/'+key)}
 async once(){return {val:()=>structuredClone(get(this.path)??null),exists:()=>get(this.path)!=null}}
 async transaction(update){const value=update(structuredClone(get(this.path)??null));set(this.path,value);return {snapshot:{val:()=>structuredClone(value)}}}
 async update(values){for(const [key,value]of Object.entries(values))set(this.path+'/'+key,value)}
 on(_event,callback){const c=listeners.get(this.path)||new Set();c.add(callback);listeners.set(this.path,c);callback({val:()=>structuredClone(get(this.path)??null)})}
 off(_event,callback){listeners.get(this.path)?.delete(callback)}
}
function device(){
 const elements={},local=new Map(),progress={};
 class Element{
  constructor(){this.options=[];this.value='';this.events={};this.children=[];this.classList={add(){},remove(){}}}
  add(o){this.options.push(o)}replaceChildren(...nodes){this.children=nodes;this.options=nodes}
  appendChild(node){this.children.push(node);if(node.id)elements[node.id]=node}
  insertAdjacentElement(_where,node){if(node.id)elements[node.id]=node}
  addEventListener(name,callback){this.events[name]=callback}setAttribute(){}focus(){}remove(){delete elements[this.id]}
 }
 for(const id of ['entryName','entryClass','entrySubmit','savedStudent','trackEntryStatus','maluProgress'])elements[id]=new Element();
 const context={console,crypto:webcrypto,TextEncoder,URLSearchParams,Option:function(text,value){this.text=text;this.value=value},structuredClone,navigator:{onLine:true},location:{hash:'#turma='+token},localStorage:{getItem:key=>local.get(key),setItem:(key,value)=>local.set(key,value)},document:{getElementById:id=>elements[id],createElement:()=>new Element(),addEventListener(){}},accessMode:null,student:{},addEventListener(){},__percursosEnsureAuth:async()=>({uid:'anonymous'}),__percursosStudentApp:{database:()=>({ref:path=>new Ref(path)})},openActivity(id){context.opened=id},enterStudent(){if(!elements.entryName.value||!elements.entryClass.value)return;context.student={name:elements.entryName.value,turma:elements.entryClass.value,series:'3'};context.accessMode='student'},goHome(){},resetAccess(){context.accessMode=null;context.student={}}};
 function bucket(){return context.student.name.toLowerCase()+'|'+context.student.turma}
 context.__percursosProgress={load:()=>structuredClone(progress[bucket()]||{}),save:p=>{progress[bucket()]=structuredClone(p)},paint(){},key:id=>id.startsWith('f3')?id+'@20261006':id};
 context.window=context;vm.createContext(context);vm.runInContext(coreSource,context);vm.runInContext(source,context);
 return {context,elements,progress,local};
}
async function settle(){await new Promise(resolve=>setTimeout(resolve,20))}
async function login(device,name){await settle();device.elements.entryName.value=name;await device.context.enterStudent();await device.context.PercursosTracks.flush()}
const phone=device();await login(phone,'Ana');assert.equal(phone.elements.entryClass.value,'3ª série C');assert.ok(phone.context.accessMode==='student');
phone.context.__percursosProgress.save({h3s1:{sync:'pending'},h3s2:{sync:'pending'},'f3s1@20261006':{sync:'pending'}});phone.context.PercursosTracks.queueCompleted();await phone.context.PercursosTracks.flush();
const tablet=device();await login(tablet,'ÁNA');
const saved=tablet.context.__percursosProgress.load();assert.ok(saved.h3s1);assert.ok(saved.h3s2);assert.ok(saved['f3s1@20261006']);
const summaries=tablet.context.PercursosTrackCore.disciplines('3',Object.fromEntries(Object.keys(saved).map(k=>[k,true])),tablet.context.__percursosProgress.key);
assert.equal(summaries[0].next.id,'h3s3');assert.equal(summaries[1].next.id,'f3s2');assert.equal(summaries[2].next.id,'s3s1');
assert.ok(tablet.elements.savedStudent.options.some(x=>x.value==='Ana'),'Cloud roster available on a fresh device');
const secondStudent=device();await login(secondStudent,'Bruno');assert.deepEqual(Object.keys(secondStudent.context.__percursosProgress.load()),[],'Separate pupil progress');
// Offline completions persist across a reload without replacing other-device completions.
phone.context.navigator.onLine=false;phone.context.__percursosProgress.save({...phone.context.__percursosProgress.load(),h3s3:{sync:'pending'}});phone.context.PercursosTracks.queueCompleted();await phone.context.PercursosTracks.flush();assert.ok(phone.local.get('percursos-tracks-pending-v1').includes('h3s3'));
tablet.context.__percursosProgress.save({...tablet.context.__percursosProgress.load(),s3s1:{sync:'pending'}});tablet.context.PercursosTracks.queueCompleted();await tablet.context.PercursosTracks.flush();
phone.context.navigator.onLine=true;await phone.context.PercursosTracks.flush();await settle();const synchronized=tablet.context.__percursosProgress.load();assert.ok(synchronized.h3s3);assert.ok(synchronized.s3s1);assert.ok(synchronized.h3s1);
assert.equal(phone.local.get('percursos-tracks-pending-v1'),'{}');
const core=tablet.context.PercursosTrackCore;assert.deepEqual(Object.keys(core.mergeCompleted({h3s1:true},{h3s2:true,h2s1:true,f3s3:false},'3')),['h3s1','h3s2']);
const rules=JSON.parse(await readFile('percursos/database.rules.json','utf8')).rules;
assert.equal(rules['.read'],false);assert.equal(rules['.write'],false);assert.match(rules.results.$resultId['.write'],/anonymous.*!data.exists/);
assert.match(rules.classTracks.$classToken.students.$studentKey.completed.$activityKey['.write'],/newData.val\(\) === true/);
assert.match(rules.trackClassKeys['.read'],/malu.cesar@gmail.com/);
console.log('PASS cloud class roster, class 3C, fresh second device, independent disciplines/pupils, offline queue, concurrent additive completions and preserved result restrictions');
