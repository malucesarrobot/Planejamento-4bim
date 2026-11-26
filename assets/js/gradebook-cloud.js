(() => {
  'use strict';
  const storage={
    async read(key){let raw=null;try{if(!window.__maluStorageVolatile)raw=localStorage.getItem(key);}catch(e){}if(raw!==null)return raw;return this.idb(key);},
    async write(key,value){try{if(window.__maluStorageVolatile)throw Error('Volatile storage');localStorage.setItem(key,value);return;}catch(e){}await this.idb(key,value);try{localStorage.removeItem(key);}catch(e){}},
    async idb(key,value){return new Promise((resolve,reject)=>{const request=indexedDB.open('malu-gradebook-storage',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('records',value===undefined?'readonly':'readwrite'),req=value===undefined?tx.objectStore('records').get(key):tx.objectStore('records').put(value,key);let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>{db.close();resolve(result??null);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Armazenamento indisponível'));};};});}
  };
  window.MaluGradebookStorage=storage;
  const queueKey='malu-gradebook-2026-b4-pending';
  const owns=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const keyAllowed=key=>!['__proto__','prototype','constructor'].includes(key);
  function appendMissing(target,source){
    let added=0;
    for(const [key,value] of Object.entries(source)){
      if(!keyAllowed(key)||value===null)continue;
      if(!owns(target,key)){target[key]=value;added++;}
      else if(plain(target[key])&&plain(value))added+=appendMissing(target[key],value);
    }
    return added;
  }
  function mergeBackup(current,source){
    if(source?.version!==1||source.year!==2026||source.bimestre!==4||!Array.isArray(source.activities)||
       !['turmas','alunos','scores','attendance'].every(key=>plain(source[key])))
      throw Error('Selecione um backup de notas e chamada do 4º bimestre de 2026.');
    const next=JSON.parse(JSON.stringify(current));
    let added=0;
    for(const key of ['turmas','alunos','scores','attendance','mediaModo','importLog','reportCards','monitoring']){
      if(plain(source[key]))added+=appendMissing(next[key]??={},source[key]);
    }
    const activities=new Set(next.activities.map(item=>item.id));
    for(const item of source.activities){
      if(!plain(item)||typeof item.id!=='string'||!keyAllowed(item.id)||!owns(next.turmas,item.turmaId)||activities.has(item.id))continue;
      next.activities.push(item);
      activities.add(item.id);
      added++;
    }
    return {data:next,added};
  }
  async function restoreLocal(current){
    const raw=await storage.read(queueKey);
    if(!raw)return current;
    const queue=JSON.parse(raw);
    const next=JSON.parse(JSON.stringify(current));
    const mergedActivities=Object.fromEntries(next.activities.map(item=>[item.id,item]));
    const target={...next,activities:mergedActivities};
    for(const [path,entry] of Object.entries(queue)){
      const parts=path.split('/');
      if(parts.length<2||!owns(target,parts[0])||!parts.every(keyAllowed)||entry?.value==null)continue;
      let parent=target;
      for(const key of parts.slice(0,-1)){
        if(!owns(parent,key))parent[key]={};
        parent=parent[key];
        if(!plain(parent))break;
      }
      const key=parts.at(-1);
      if(plain(parent)&&!owns(parent,key))parent[key]=entry.value;
    }
    next.activities=Object.values(mergedActivities);
    return next;
  }
  window.MaluGradebookCloud={restoreLocal,mergeBackup};
})();
