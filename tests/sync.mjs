import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('assets/js/sync.js','utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const cloud=new Map(); let gate=null, started=null;
function device(storage=new Map()) {
 const handlers={},elements=new Map(); let aulas=JSON.parse(storage.get('malu-aulas-dadas')||'{}'),offline=false;
 class Element {
  constructor(id){this.id=id;this.dataset={};this.value='';this.textContent='';this.className='';this.hidden=true;this.events={};this.classList={add(){},remove(){}};}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  dispatchEvent(e){if(e.type==='input')document.dispatchEvent({type:'input',target:this});}
  matches(selector){return selector==='textarea[data-save]'&&this.id==='note';}
  focus(){} select(){} querySelectorAll(){return [];} click(){return Promise.all((this.events.click||[]).map(fn=>fn()));}
 }
 const ids=['syncView','syncBtn','syncUrl','syncCode','syncStatus','syncClose','syncNowBtn','syncGen','syncCopy','syncConnect','syncOff','navTools','navToggle','note'];
 ids.forEach(id=>elements.set(id,new Element(id)));const note=elements.get('note');note.dataset.save='test-note';note.value=storage.get('test-note')||'';
 const document={visibilityState:'visible',activeElement:null,body:{children:[],classList:{add(){},remove(){}}},getElementById:id=>elements.get(id),contains:()=>true,querySelectorAll:s=>s==='textarea[data-save]'?[note]:[],addEventListener(type,fn){(handlers[type]??=[]).push(fn);},dispatchEvent(e){for(const fn of handlers[e.type]||[])fn(e);if(e.type==='input'&&e.target===note)storage.set('test-note',note.value);}};
 const window={__maluAulas:{get:()=>aulas,set:o=>{aulas=clone(o);storage.set('malu-aulas-dadas',JSON.stringify(o));document.dispatchEvent({type:'malu:aulas-updated'});return true;}},addEventListener(type,fn){(handlers[type]??=[]).push(fn);}};
 const context={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},AbortController,Event:class{constructor(type){this.type=type;}},Date,Set,Uint8Array,crypto:{getRandomValues:x=>x.fill(1)},navigator:{},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},encodeURIComponent,
  fetch:async(url,opts)=>{if(offline)throw Error('offline');if(opts.method==='GET'){const value=clone(cloud.get(url)||{});if(gate){started?.();await gate;}return {ok:true,json:async()=>value};}
   const remote=cloud.get(url)||{};for(const [path,value]of Object.entries(JSON.parse(opts.body))){const bits=path.split('/');let at=remote;for(const b of bits.slice(0,-1))at=at[b]??={};at[bits.at(-1)]=value;}cloud.set(url,remote);return {ok:true,json:async()=>({})};}};
 vm.runInNewContext(source,context);
 return {storage,window,note,editNote:value=>{note.value=value;document.dispatchEvent({type:'input',target:note});},connect:async(code)=>{elements.get('syncUrl').value='https://test.firebaseio.com';elements.get('syncCode').value=code;await elements.get('syncConnect').click();await window.MaluSync.syncNow();},mark:(key,date)=>{const next={...aulas};if(date)next[key]=date;else delete next[key];window.__maluAulas.set(next);document.dispatchEvent({type:'malu:aula',detail:{key,date}});},sync:()=>window.MaluSync.syncNow(),offline:value=>offline=value,off:()=>elements.get('syncOff').click(),state:()=>clone(aulas),status:()=>elements.get('syncStatus').textContent};
}
const key='s3-historia-semana-2|3ªB',code='abcdefghijklmnop';
const pc=device(),phone=device();await pc.connect(code);await phone.connect(code);
pc.mark(key,'2026-10-13');await pc.sync();await phone.sync();assert.equal(phone.state()[key],'2026-10-13');
phone.mark(key,null);await phone.sync();await pc.sync();assert.equal(pc.state()[key],undefined);
console.log('PASS two devices mark and unmark the same class/week');
pc.offline(true);pc.mark(key,'2026-10-14');await pc.sync();assert.match(pc.status(),/offline/);
const reloaded=device(pc.storage);await reloaded.sync();await phone.sync();assert.equal(phone.state()[key],'2026-10-14');
console.log('PASS offline pending mark survives reload and reaches second device');
let release;gate=new Promise(r=>release=r);let notify;const signal=new Promise(r=>notify=r);started=notify;
const inFlight=reloaded.sync();await signal;reloaded.mark(key,'2026-10-15');const requested=reloaded.sync();release();await Promise.all([inFlight,requested]);gate=null;started=null;await phone.sync();assert.equal(phone.state()[key],'2026-10-15');
console.log('PASS manual sync during request is queued; new mark is preserved');
const newer=device();await newer.connect('qrstuvwxyzABCDEF');newer.mark(key,'2026-10-16');await newer.sync();
await phone.connect('qrstuvwxyzABCDEF');assert.equal(phone.state()[key],'2026-10-16');await phone.connect(code);assert.equal(phone.state()[key],'2026-10-15');
console.log('PASS changing codes isolates metadata and receives each channel state');
await phone.off();phone.mark(key,'2026-10-17');await phone.connect(code);await reloaded.sync();assert.equal(reloaded.state()[key],'2026-10-17');
console.log('PASS disconnected changes survive reconnect');
// A record from a device with a fast clock must not erase an intentional edit during GET.
const url='https://test.firebaseio.com/planejamento4bim/'+code+'.json';const remote=cloud.get(url);remote.notes={'test-note':{v:'remote',t:Date.now()+1000000}};
reloaded.note.value='local';reloaded.window.__maluAulas.get();
// Mark remains a real user change even against a future remote timestamp.
remote.aulas['s3-historia-semana-2']['3aB'].t=Date.now()+1000000;
reloaded.mark(key,'2026-10-18');await reloaded.sync();await phone.sync();assert.equal(phone.state()[key],'2026-10-18');
console.log('PASS intentional local change survives remote clock skew');

pc.editNote('Anotação do computador');pc.offline(false);await pc.sync();await phone.sync();assert.equal(phone.note.value,'Anotação do computador');
phone.editNote('Anotação do celular');await phone.sync();await pc.sync();assert.equal(pc.note.value,'Anotação do celular');
console.log('PASS notes synchronize in both directions alongside applied lessons');
