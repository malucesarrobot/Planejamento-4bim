(() => {
  'use strict';
  const storage={
    async read(key){let raw=null;try{if(!window.__maluStorageVolatile)raw=localStorage.getItem(key);}catch(e){}if(raw!==null)return raw;return this.idb(key);},
    async write(key,value){try{if(window.__maluStorageVolatile)throw Error('Volatile storage');localStorage.setItem(key,value);return;}catch(e){}await this.idb(key,value);try{localStorage.removeItem(key);}catch(e){}},
    async idb(key,value){return new Promise((resolve,reject)=>{const request=indexedDB.open('malu-gradebook-storage',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('records',value===undefined?'readonly':'readwrite'),req=value===undefined?tx.objectStore('records').get(key):tx.objectStore('records').put(value,key);let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>{db.close();resolve(result??null);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Armazenamento indisponível'));};};});}
  };
  window.MaluGradebookStorage=storage;
  const queueKey='malu-gradebook-2026-b4-pending';
  const config={apiKey:'AIzaSyC89tYmSG7Fl0wv37doAiO2tmf7sCGX6Ps',authDomain:'leciona-eaa56.firebaseapp.com',databaseURL:'https://leciona-eaa56-default-rtdb.firebaseio.com',projectId:'leciona-eaa56',appId:'1:824991056615:web:3cd321e321f1a5c91dd842'};
  let pending={},auth,db,ref,connected=false,ready=false,sending=false,revision=0,callbacks,stopped=false;
  const queueLoaded=storage.read(queueKey).then(raw=>{pending=JSON.parse(raw||'{}');}).catch(()=>{stopped=true;});
  function wire(data){return {...data,activities:Object.fromEntries(data.activities.map(a=>[a.id,a]))};}
  function unwire(value){const v=value||{};return {version:1,year:2026,bimestre:4,turmas:v.turmas||{},alunos:v.alunos||{},mediaModo:v.mediaModo||{},activities:Object.values(v.activities||{}),scores:v.scores||{},attendance:v.attendance||{},importLog:v.importLog||{}};}
  function flatten(value,prefix='',out={}){
    for(const [key,val] of Object.entries(value)){if(['version','year','bimestre'].includes(key)&&!prefix)continue;
      const path=prefix?prefix+'/'+key:key;if(val&&typeof val==='object'&&!Array.isArray(val)){flatten(val,path,out);}else out[path]=val;
    }return out;
  }
  function diff(previous,next){const a=flatten(wire(previous)),b=flatten(wire(next)),out={};for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))out[k]=k in b?b[k]:null;return out;}
  function setPath(root,path,value){const keys=path.split('/');let at=root;for(const k of keys.slice(0,-1))at=at[k]??={};if(value===null)delete at[keys.at(-1)];else at[keys.at(-1)]=value;}
  function status(text,error=false){callbacks?.status(text,error);}
  async function keepQueue(){try{await storage.write(queueKey,JSON.stringify(pending));return true;}catch(e){stopped=true;status('Falha ao guardar pendências. Baixe o backup; os dados ainda não foram enviados à nuvem.',true);return false;}}
  async function flush(){
    if(stopped||sending||!ready||!auth.currentUser||!connected||!Object.keys(pending).length)return;
    sending=true;const batch={...pending};status('Sincronizando com a nuvem…');
    try{await ref.update(Object.fromEntries(Object.entries(batch).map(([k,v])=>[k,v.value])));
      for(const [k,v] of Object.entries(batch))if(pending[k]?.revision===v.revision)delete pending[k];await keepQueue();
      if(!Object.keys(pending).length)status('Salvo na nuvem · '+auth.currentUser.email);}
    catch(e){status('Salvo neste aparelho · nuvem recusou o envio: '+e.message,true);}
    finally{sending=false;if(Object.keys(pending).length&&connected)setTimeout(flush,3000);}
  }
  async function save(next,previous){const changes=diff(previous,next);for(const [k,v] of Object.entries(changes))pending[k]={value:v,revision:Date.now()+'-'+(++revision)};
    if(await keepQueue()){status(auth?.currentUser?(connected?'Sincronizando com a nuvem…':'Salvo neste aparelho · aguardando conexão'):'Salvo neste aparelho · entre com Google para salvar na nuvem');flush();}
  }
  async function start(cb){await queueLoaded;callbacks=cb;if(!window.firebase){status('Nuvem indisponível. Verifique a conexão e atualize a página.',true);return;}
    try{const app=firebase.apps.length?firebase.app():firebase.initializeApp(config);auth=app.auth();db=app.database();ref=db.ref('leciona/planejamento_gradebook/2026b4');
      db.ref('.info/connected').on('value',s=>{connected=s.val()===true;if(connected)flush();else if(auth.currentUser)status('Salvo neste aparelho · aguardando conexão');});
      auth.onAuthStateChanged(user=>{ref.off();ready=false;callbacks.account(user);if(!user){status('Entre com Google para sincronizar celular e Mac.');return;}
        if(!['prof.malufc@gmail.com','malu.cesar@gmail.com'].includes(user.email)){status('Use uma das contas autorizadas no Leciona.',true);return;}
        ref.on('value',snapshot=>{let cloud=wire(unwire(snapshot.val()));for(const [path,entry]of Object.entries(pending))setPath(cloud,path,entry.value);ready=true;callbacks.receive(unwire(cloud));if(Object.keys(pending).length)flush();else status(connected?'Salvo na nuvem · '+user.email:'Salvo neste aparelho · aguardando conexão');},error=>{ready=false;status('A nuvem recusou a leitura: '+error.message,true);});
      });
    }catch(e){status('Não foi possível iniciar a nuvem: '+e.message,true);}
  }
  async function login(){if(!auth){status('Atualize a página para carregar a conexão com Google.',true);return;}try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}catch(e){if(e.code==='auth/popup-closed-by-user'&&auth.currentUser){status('Conta conectada · '+auth.currentUser.email);return;}status(e.code==='auth/popup-closed-by-user'?'A janela do Google foi fechada. Toque em Entrar com Google para tentar novamente.':'Login não concluído: '+e.message,true);}}
  async function importSource(){if(!auth?.currentUser||!ready)throw Error('Entre com a conta do Leciona e aguarde a conexão com a nuvem.');
    const paths=['turmas','alunos','media_modo'];const snapshots=await Promise.all(paths.map(k=>db.ref('leciona/'+k).once('value')));return {turmas:snapshots[0].val()||{},alunos:snapshots[1].val()||{},mediaModo:snapshots[2].val()||{}};
  }
  window.MaluGradebookCloud={start,save,login,importSource,diff,wire,unwire};
})();
