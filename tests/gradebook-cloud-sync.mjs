import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('assets/js/gradebook-cloud.js','utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const initial={version:1,year:2026,bimestre:4,turmas:{},alunos:{},mediaModo:{},activities:[],scores:{},attendance:{}};
let remote={},hold;const listeners=new Set();
const tick=async()=>{for(let i=0;i<20;i++)await new Promise(r=>setImmediate(r));};
function device(storage=new Map()){
 let receive,connection,online=true,state,status='';
 const ref={async once(){return {val:()=>copy(remote)};},off(){if(receive)listeners.delete(receive);},on(type,cb){receive=cb;listeners.add(cb);cb({val:()=>copy(remote)});},async update(patch){if(hold)await hold;for(const [path,value]of Object.entries(patch)){const keys=path.split('/');let at=remote;for(const k of keys.slice(0,-1))at=at[k]??={};if(value===null)delete at[keys.at(-1)];else at[keys.at(-1)]=value;}for(const cb of listeners)cb({val:()=>copy(remote)});}};
 let tokenRefreshes=0,popupError=null,redirects=0,lastPrompt='';
 class GoogleAuthProvider{setCustomParameters(options){lastPrompt=options.prompt;}}
 const auth={currentUser:{email:'malu.cesar@gmail.com',async getIdToken(force){if(force)tokenRefreshes++;return 'token';}},
   onAuthStateChanged(cb){cb(this.currentUser);},
   async signInWithPopup(){if(popupError)throw popupError;return {user:this.currentUser};},
   async signInWithRedirect(){redirects++;}
 },app={auth:()=>auth,database:()=>({ref:path=>path==='.info/connected'?{on(type,cb){connection=cb;cb({val:()=>online});}}:ref})};
 const firebase={apps:[app],app:()=>app,auth:{GoogleAuthProvider}},window={firebase,addEventListener(){}};
 const ctx={window,firebase,localStorage:{getItem:k=>storage.get(k)??'{}',setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:()=>1};vm.runInNewContext(source,ctx);
 return {api:window.MaluGradebookCloud,storage,start:()=>window.MaluGradebookCloud.start({account(){},status:t=>status=t,receive:d=>state=copy(d)}),state:()=>state,status:()=>status,offline(v){online=!v;connection?.({val:()=>online});},close(){ref.off();},
  tokenRefreshes:()=>tokenRefreshes,lastPrompt:()=>lastPrompt,redirects:()=>redirects,
  setPopupError(error){popupError=error;}};
}
const pc=device(),phone=device();await pc.start();await phone.start();
const next=copy(initial);next.activities.push({id:'a',turmaId:'t',nome:'Atividade pelo caderno',valorMax:10});
await pc.api.save(next,initial);await tick();assert.equal(phone.state().activities[0].nome,'Atividade pelo caderno');assert.match(pc.status(),/Salvo na nuvem/);
pc.offline(true);const changed=copy(next);changed.scores.p={a:8};await pc.api.save(changed,next);assert.match(pc.status(),/aguardando conexão/);assert.equal(phone.state().scores.p,undefined);
pc.close();const reloaded=device(pc.storage);await reloaded.start();await tick();assert.equal(phone.state().scores.p.a,8);assert.match(reloaded.status(),/Salvo na nuvem/);
let release;hold=new Promise(r=>release=r);const edit=copy(changed);edit.activities[0].nome='Renomeada';await reloaded.api.save(edit,changed);assert.match(reloaded.status(),/Sincronizando/);release();hold=null;await tick();assert.equal(phone.state().activities[0].nome,'Renomeada');assert.equal(phone.state().activities.length,1);
const queueKey='malu-gradebook-2026-b4-pending',early=device(new Map([[queueKey,JSON.stringify({'scores/p/b':{value:4,revision:'old'}})]]));
const earlyNext=copy(initial);earlyNext.scores.p={c:5};await early.api.save(earlyNext,initial);const pending=JSON.parse(early.storage.get(queueKey));assert.equal(pending['scores/p/b'].value,4);assert.equal(pending['scores/p/c'].value,5);
await phone.api.refresh();assert.equal(phone.state().activities[0].nome,'Renomeada');assert.equal(phone.state().scores.p.a,8);
assert.equal(await phone.api.reconnect(),true,'reconnect must refresh token and cloud');
assert.equal(phone.tokenRefreshes(),1,'refresh token before reading grades');
assert.equal(await phone.api.login(),true,'manual Google login must be accessible');
assert.equal(phone.lastPrompt(),'select_account','must let teacher choose their Google account');
phone.setPopupError({code:'auth/popup-blocked',message:'popup blocked'});
assert.equal(await phone.api.login(),true,'fallback to same-tab login when popup is blocked');
assert.equal(phone.redirects(),1);
phone.setPopupError({code:'auth/popup-closed-by-user',message:'popup closed'});
assert.equal(await phone.api.login(),false,'close must not force redirect');
assert.equal(phone.redirects(),1);
phone.setPopupError(null);

phone.offline(true);await assert.rejects(()=>phone.api.refresh(),/Sem conexão/);
assert.equal(await phone.api.reconnect(),false,'offline reconnection must not erase grades');
assert.equal(phone.state().scores.p.a,8);
phone.offline(false);
let releaseRefresh;hold=new Promise(r=>releaseRefresh=r);
const localEdit=copy(phone.state());localEdit.scores.p.a=9;
await phone.api.save(localEdit,phone.state());await phone.api.refresh();
assert.equal(phone.state().scores.p.a,9,'refresh must preserve unsent local scores');
assert.equal(phone.state().activities.length,1,'refresh must not duplicate activities');
releaseRefresh();hold=null;await tick();assert.equal(reloaded.state().scores.p.a,9);
console.log('PASS manual refresh/reconnect/Google login popup and redirect fallback, pending scores preserved');
console.log('PASS two-device activities/scores, offline queue survives reload, cloud acknowledgement, stable record and edits before queue startup');
