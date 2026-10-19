import test from 'node:test';
import assert from 'node:assert/strict';
import {managementFunctions} from '../firebase/functions/management.js';
const criterion={id:'g1-001',group:'g1',code:'1.1',section:'Tuyên truyền',title:'Tiêu chí ban đầu',maxScore:5,area:'communications',evaluation:'Hướng dẫn',evidence:'Báo cáo',active:true,revision:0};
const admin={admin:true,unitId:'admin',uid:'admin',name:'Admin'},unit={admin:false,unitId:'dv001',uid:'unit1',name:'Đơn vị 1'};
function setup(){
 const original={unitId:'dv001',criterionId:'g1-001',note:'Hồ sơ ban đầu',files:[{name:'minh-chung.pdf',path:'evidence/dv001/g1-001/old.pdf',size:100}],status:'draft',selfScore:4,revision:1};
 const data=new Map([['criteria/g1-001',criterion],['units/dv001',{name:'Đơn vị 1',group:'g1'}],['settings/campaign',{locked:true}],['submissions/dv001__g1-001',original]]);let sequence=0;
 const snapshot=(path)=>({id:path.split('/').at(-1),exists:data.has(path),data:()=>data.get(path)});
 const collection=path=>({path,doc:()=>doc(path+'/'+(++sequence)),where:(field,op,value)=>({path,field,value})});
 const doc=path=>({path,collection:name=>collection(path+'/'+name)});
 const db={doc,collection,runTransaction:async fn=>{const writes=[];await fn({get:async ref=>ref.field?{docs:[...data.keys()].filter(p=>p.startsWith(ref.path+'/')&&p.split('/').length===ref.path.split('/').length+1&&data.get(p)[ref.field]===ref.value).map(snapshot)}:snapshot(ref.path),set:(ref,value,options)=>writes.push([ref.path,options?.merge?{...data.get(ref.path),...value}:value]),create:(ref,value)=>writes.push([ref.path,value])});for(const [path,value]of writes)data.set(path,value)}};
 const call=(fn,onlyAdmin=false)=>async(value,actor)=>{if(onlyAdmin&&!actor.admin)throw Error('Admin only');return fn(value,actor)};
 const context=async d=>{const u=data.get('units/'+d.unitId),c=data.get('criteria/'+d.criterionId);if(!u||!c||u.group!==c.group)throw Error('Wrong group');return {unit:u,criterion:c,ref:doc('submissions/'+d.unitId+'__'+d.criterionId)}};
 return {data,original,functions:managementFunctions({db,call,context,log:(tx,a,action)=>tx.create(collection('audits').doc(),{action,actor:a.uid})})};
}
test('Criterion transaction keeps submitted evidence and stores previous versions through archive and restore',async()=>{
 const {data,original,functions}=setup();
 await functions.updateCriterion({...criterion,title:'Tiêu chí được chỉnh sửa'},admin);
 assert.equal(data.get('criteria/g1-001').revision,1);
 await functions.updateCriterion({...criterion,title:'Tiêu chí được chỉnh sửa',revision:1,active:false},admin);
 await functions.updateCriterion({...criterion,revision:2,active:true},admin);
 assert.deepEqual(data.get('submissions/dv001__g1-001'),original);
 assert.equal(data.get('criteria/g1-001').revision,3);
 const history=[...data.entries()].filter(([path])=>path.startsWith('criteria/g1-001/history/')).map(([,v])=>v);
 assert.equal(history.length,3);assert.equal(history[0].before.title,'Tiêu chí ban đầu');assert.equal(history[1].after.active,false);
 await assert.rejects(()=>functions.updateCriterion(criterion,unit));
 const size=data.size;await assert.rejects(()=>functions.updateCriterion({...criterion,revision:0},admin));assert.equal(data.size,size);
});
test('Explanation transaction appends immutable history and preserves locked submission through replies and follow-ups',async()=>{
 const {data,original,functions}=setup(),payload={unitId:'dv001',criterionId:'g1-001',text:'Lý do nộp muộn',expectedDate:'2026-11-20',revision:0};
 await functions.sendExplanation(payload,unit);
 const path='explanations/dv001__g1-001';assert.equal(data.get(path).status,'pending');
 await functions.respondExplanation({...payload,text:'Yêu cầu làm rõ',status:'answered',revision:1},admin);
 await functions.sendExplanation({...payload,text:'Đơn vị bổ sung nội dung giải trình',revision:2},unit);
 assert.equal(data.get(path).status,'pending');assert.equal(data.get(path).revision,3);
 assert.equal([...data.keys()].filter(p=>p.startsWith(path+'/messages/')).length,3);
 assert.deepEqual(data.get('submissions/dv001__g1-001'),original);
 const size=data.size;await assert.rejects(()=>functions.sendExplanation(payload,{...unit,unitId:'dv002'}));assert.equal(data.size,size);
 data.set('settings/campaign',{locked:false});
 await functions.respondExplanation({...payload,text:'Đã kết thúc xử lý',status:'resolved',revision:3},admin);
 assert.equal(data.get(path).status,'resolved');
 await assert.rejects(()=>functions.sendExplanation({...payload,revision:4},unit));
 assert.deepEqual(data.get('submissions/dv001__g1-001'),original);
});
