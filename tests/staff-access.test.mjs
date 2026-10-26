import test from 'node:test';
import assert from 'node:assert/strict';
import {permitted,assertPermission,normalizeStaff} from '../firebase/functions/access-model.js';
import {checkCriterionUpdate,checkExplanation} from '../firebase/functions/criteria-model.js';
import {staffFunctions} from '../firebase/functions/staff.js';
import {validateSubmission} from '../src/core.js';
import {checkPayload} from '../firebase/functions/validation.js';
import {readFile} from 'node:fs/promises';
const c={id:'g1-001',group:'g1',area:'organization',title:'Tiêu chí',code:'1.1',maxScore:5,active:true,revision:1};
const staff={role:'staff',admin:false,unitId:'cb-tochuc',areas:['organization'],permissions:['viewEvidence','gradeEvidence','manageCriteria','replyExplanation'],active:true};
test('Staff capabilities require both the assigned area and specific action; no admin escalation',()=>{
 assert.equal(permitted(staff,'gradeEvidence',c),true);
 assert.equal(permitted(staff,'returnEvidence',c),false);
 assert.equal(permitted(staff,'gradeEvidence',{...c,area:'movement'}),false);
 assert.equal(permitted({...staff,active:false},'viewEvidence',c),false);
 assert.equal(permitted({role:'unit',permissions:['gradeEvidence'],areas:['organization']},'gradeEvidence',c),false);
 assert.equal(permitted({role:'admin',admin:false},'manageCriteria',c),false);
 assert.throws(()=>assertPermission(staff,'returnEvidence',c));
});
test('Criterion changes cannot escape staff scope and explanation replies have a separate permission',()=>{
 assert.doesNotThrow(()=>checkCriterionUpdate(staff,c,c,[],[],{}));
 assert.throws(()=>checkCriterionUpdate(staff,c,{...c,area:'movement'},[],[],{}));
 assert.throws(()=>checkCriterionUpdate(staff,{...c,area:'movement'},c,[],[],{}));
 const data={unitId:'dv001',criterionId:c.id,text:'Đã kiểm tra giải trình',revision:1,status:'answered'};
 assert.doesNotThrow(()=>checkExplanation(staff,c,{locked:true},data,{revision:1},{reply:true}));
 assert.throws(()=>checkExplanation({...staff,permissions:['viewEvidence']},c,{locked:true},data,{revision:1},{reply:true}));
 assert.throws(()=>checkExplanation(staff,{...c,area:'youth'},{locked:true},data,{revision:1},{reply:true}));
});
test('Staff forms reject arbitrary permissions, malformed IDs and missing area assignments',()=>{
 const d={id:'cb-tochuc',name:'Cán bộ phụ trách',areas:['organization'],permissions:['viewEvidence'],active:true,revision:0,password:'test-only-12345'};
 assert.equal(normalizeStaff(d).role,'staff');assert.equal(normalizeStaff(d).password,undefined);
 for(const bad of [{...d,id:'admin'},{...d,areas:[]},{...d,areas:['other']},{...d,permissions:['viewEvidence','admin']},{...d,permissions:[]},{...d,password:'short'}])assert.throws(()=>normalizeStaff(bad));
});
test('Staff account creation is admin-only, excludes passwords from stored profiles and supports immediate disable',async()=>{
 const data=new Map(),authEvents=[];let failWrite=false;
 const doc=path=>({path,get:async()=>({data:()=>data.get(path)})});
 const db={doc,runTransaction:async fn=>{const writes=[];await fn({get:async ref=>({data:()=>data.get(ref.path)}),set:(ref,value,options)=>writes.push([ref.path,options?.merge?{...data.get(ref.path),...value}:value])});if(failWrite)throw Error('write failed');writes.forEach(([p,v])=>data.set(p,v))}};
 const auth={createUser:async d=>authEvents.push(['create',d.uid]),setCustomUserClaims:async(uid,claims)=>authEvents.push(['claims',uid,claims]),deleteUser:async uid=>authEvents.push(['delete',uid]),updateUser:async(uid,d)=>authEvents.push(['update',uid,d]),revokeRefreshTokens:async uid=>authEvents.push(['revoke',uid])};
 const call=(fn,adminOnly)=>async(d,a)=>{if(adminOnly&&!a.admin)throw Error('Admin only');return fn(d,a)};
 const f=staffFunctions({db,auth,call,log:()=>{}}).manageStaffAccount;
 const d={id:'cb-tochuc',name:'Cán bộ thử nghiệm',areas:['organization'],permissions:['viewEvidence','gradeEvidence'],active:true,revision:0,password:'test-only-12345'};
 await assert.rejects(()=>f(d,staff));await f(d,{admin:true});
 assert.equal(data.get('users/staff_cb-tochuc').role,'staff');assert.equal(data.get('users/staff_cb-tochuc').password,undefined);assert.equal(data.get('staffAccounts/cb-tochuc').password,undefined);
 assert.deepEqual(authEvents.find(x=>x[0]==='claims')[2],{unitId:'cb-tochuc',staff:true});
 await assert.rejects(()=>f({...d,revision:0},{admin:true}));
 await f({...d,revision:1,active:false,password:undefined},{admin:true});assert.equal(data.get('users/staff_cb-tochuc').active,false);assert(authEvents.some(x=>x[0]==='revoke'));
 failWrite=true;await assert.rejects(()=>f({...d,id:'cb-another'},{admin:true}));assert(authEvents.some(x=>x[0]==='delete'&&x[1]==='staff_cb-another'));assert.equal(data.has('users/staff_cb-another'),false);
});
test('Self score must be explicitly numeric; zero remains valid and Trường Xuân belongs to commune criteria',async()=>{
 const criterion={maxScore:5,evidence:'Không yêu cầu đăng tải minh chứng'},d={status:'submitted',note:'Đã thực hiện',links:[],files:[]};
 for(const selfScore of [null,undefined,'',NaN,'0']){assert.throws(()=>validateSubmission(criterion,{...d,selfScore},'submitted'));assert.throws(()=>checkPayload(criterion,{...d,selfScore}));}
 assert.doesNotThrow(()=>validateSubmission(criterion,{...d,selfScore:0},'submitted'));assert.doesNotThrow(()=>checkPayload(criterion,{...d,selfScore:0}));
 const units=JSON.parse(await readFile(new URL('../dist/units.json',import.meta.url)));assert.equal(units.find(u=>u.id==='dv099').name,'Xã Trường Xuân');assert.equal(units.find(u=>u.id==='dv099').group,'g1');
});
