import test from 'node:test';import assert from 'node:assert/strict';import {resetFunctions} from '../firebase/functions/reset.js';
function fixture(locked=false){
 const data=new Map(),versions=new Map();let clock=100,id=0;const db={failBatch:false};
 const apply=(path,value,merge=true)=>{const next=merge?{...data.get(path)}:{};for(const [k,v] of Object.entries(value)){if(v?.constructor?.name==='DeleteTransform')delete next[k];else next[k]=v}data.set(path,next);versions.set(path,++clock)};
 const snapshot=path=>({id:path.split('/').at(-1),ref:ref(path),exists:data.has(path),data:()=>data.has(path)?{...data.get(path)}:undefined,updateTime:{toMillis:()=>versions.get(path)||0}});
 const collection=(path,filter)=>({doc:(key=String(++id).padStart(20,'0'))=>ref(path+'/'+key),where:(field,op,value)=>collection(path,[field,value]),get:async()=>{const docs=[...data.keys()].filter(p=>p.startsWith(path+'/')&&p.slice(path.length+1).indexOf('/')<0).map(snapshot).filter(d=>!filter||d.data()[filter[0]]===filter[1]);return {docs,size:docs.length,empty:!docs.length}}});
 const ref=path=>({path,id:path.split('/').at(-1),get:async()=>snapshot(path),set:async(v,options)=>apply(path,v,!!options?.merge),collection:name=>collection(path+'/'+name)});
 const writer=()=>{const actions=[];return {get:r=>r.get(),set:(r,v,o)=>actions.push(()=>apply(r.path,v,!!o?.merge)),update:(r,v)=>actions.push(()=>apply(r.path,v,true)),create:(r,v)=>actions.push(()=>apply(r.path,v,false)),delete:r=>actions.push(()=>{data.delete(r.path);versions.delete(r.path)}),commit:async()=>{if(db.failBatch){db.failBatch=false;throw Error('Temporary batch failure')}actions.forEach(f=>f())},flush:()=>actions.forEach(f=>f())}};
 db.doc=ref;db.collection=collection;db.batch=writer;db.runTransaction=async fn=>{const tx=writer();await fn(tx);tx.flush()};
 apply('settings/campaign',{locked,deadline:''});apply('units/dv001',{name:'Test unit'});apply('units/dv002',{name:'Other unit'});
 apply('submissions/dv001__g1-001',{unitId:'dv001',status:'approved',score:2.5,note:'original',files:[{path:'evidence/original.pdf'}]});apply('submissions/dv002__g1-001',{unitId:'dv002',status:'draft',note:'untouched'});
 const actor=async()=>({uid:'admin-test',admin:true,name:'Administrator'}),functions=resetFunctions(db,actor,{region:'asia-southeast1'});
 const req=data=>({data,auth:{uid:'admin-test',token:{auth_time:Math.floor(Date.now()/1000)}}});
 return {data,db,apply,prepare:scope=>functions.prepare.run(req({scope})),commit:id=>functions.commit.run(req({requestId:id,phrase:'DAT LAI 2026'}))};
}
test('Selected-unit reset archives exact records, preserves other units, unlocks and is idempotent',async()=>{
 const f=fixture(),p=await f.prepare('dv001');assert.equal(p.counts.total,1);await f.commit(p.requestId);
 assert.equal(f.data.has('submissions/dv001__g1-001'),false);assert.equal(f.data.get('submissions/dv002__g1-001').note,'untouched');assert.equal(f.data.get('resetArchives/'+p.requestId+'/records/dv001__g1-001').score,2.5);assert.equal(f.data.get('settings/campaign').locked,false);
 f.apply('submissions/dv001__g1-002',{unitId:'dv001',status:'draft',note:'new campaign work'});await f.commit(p.requestId);assert.equal(f.data.get('submissions/dv001__g1-002').note,'new campaign work');
});
test('Changed preview is rejected before archiving and preserves a previously locked campaign',async()=>{
 const f=fixture(true),p=await f.prepare('all');f.apply('submissions/dv001__g1-001',{note:'changed'});await assert.rejects(()=>f.commit(p.requestId));assert.equal(f.data.has('submissions/dv001__g1-001'),true);assert.equal(f.data.get('settings/campaign').locked,true);assert.equal(f.data.get('settings/campaign').resetInProgress,false);await assert.rejects(()=>f.commit(p.requestId));
});
test('Interrupted reset keeps campaign locked and resumes without losing archived evidence',async()=>{
 const f=fixture(),p=await f.prepare('all');f.db.failBatch=true;await assert.rejects(()=>f.commit(p.requestId));assert.equal(f.data.get('settings/campaign').resetInProgress,true);assert.equal(f.data.get('settings/campaign').locked,true);await f.commit(p.requestId);assert.equal(f.data.has('submissions/dv001__g1-001'),false);assert.equal(f.data.get('resetArchives/'+p.requestId+'/records/dv001__g1-001').files[0].path,'evidence/original.pdf');assert.equal(f.data.get('settings/campaign').resetInProgress,false);
});
