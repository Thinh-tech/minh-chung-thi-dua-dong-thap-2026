import test from 'node:test';
import assert from 'node:assert/strict';
import {definition,response} from '../firebase/functions/suite-model.js';
import {suiteFunctions} from '../firebase/functions/suite.js';
const base={id:'report-1',kind:'report',title:'Báo cáo kiểm thử',body:'Hướng dẫn',recipients:['dv001'],fields:[{id:'f0',label:'Số hoạt động',type:'number',unit:'hoạt động',required:true}],deadline:'2026-11-30T00:00',allowLate:true,files:[]};
test('Definitions validate recipients, Vietnam deadlines and configurable official indicators',()=>{
 assert.deepEqual(definition(base,['dv001']).fields,base.fields);
 assert.throws(()=>definition({...base,recipients:['dv002']},['dv001']));
 assert.throws(()=>definition({...base,fields:[]},['dv001']));
 assert.throws(()=>definition({...base,fields:[{...base.fields[0],id:'duplicate'}]},['dv001']));
 assert.throws(()=>definition({...base,deadline:'yesterday'},['dv001']));
});
test('Report responses enforce finite numeric values, required text, close and late policies',()=>{
 const now=+new Date('2026-11-29T17:00:01Z');
 assert.equal(response({values:{f0:0}},base,now).late,true);
 assert.equal(response({values:{f0:4}},base,now-2000).late,false);
 for(const value of ['',NaN,Infinity,'4'])assert.throws(()=>response({values:{f0:value}},base,now));
 assert.throws(()=>response({values:{f0:4}},{...base,allowLate:false},now));
 assert.throws(()=>response({values:{f0:4}},{...base,closed:true},now));
 assert.throws(()=>response({values:{f0:''}},{...base,fields:[{id:'f0',type:'text',required:true}]},now));
});
test('Awards retain repeatable collective and individual recommendations without selecting winners',()=>{
 const p={...base,kind:'award'},d={collectives:[{name:'Tập thể A',summary:'Thành tích tập thể'}],individuals:[{name:'Cán bộ A',position:'Bí thư',summary:'Thành tích cá nhân'}]};
 const r=response(d,p,0);assert.equal(r.collectives.length,1);assert.equal(r.individuals[0].position,'Bí thư');assert.equal(r.winner,undefined);
 assert.throws(()=>response({},p));assert.throws(()=>response({...d,individuals:[{name:'A',summary:''}]},p));
});
function setup(){
 const data=new Map([['units/dv001',{name:'Đơn vị 1'}],['units/dv002',{name:'Đơn vị 2'}],['units/admin',{name:'Admin'}],['submissions/dv001__g1-001',{note:'Existing evidence'}]]);let seq=0;
 const snap=path=>({id:path.split('/').at(-1),exists:data.has(path),data:()=>data.get(path)});
 const doc=path=>({path,get:async()=>snap(path),set:async value=>data.set(path,value)});
 const collection=path=>({doc:()=>doc(path+'/'+(++seq)),get:async()=>({docs:[...data.keys()].filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1).map(snap)})});
 const db={doc,collection,runTransaction:async fn=>{const pending=[];await fn({get:async ref=>snap(ref.path),set:(ref,value)=>pending.push([ref.path,value]),create:(ref,value)=>{if(data.has(ref.path))throw Error('Exists');pending.push([ref.path,value])},update:(ref,value)=>pending.push([ref.path,{...data.get(ref.path),...value}])});for(const [path,value]of pending)data.set(path,value)},batch:()=>{const pending=[];return {update:(ref,value)=>{if(!data.has(ref.path))throw Error('Missing');pending.push([ref.path,{...data.get(ref.path),...value}])},commit:async()=>pending.forEach(([path,value])=>data.set(path,value))}}};
 const call=(fn,adminOnly=false)=>async(d,a)=>{if(adminOnly&&!a.admin)throw Error('Admin only');return fn(d,a)};
 const f=suiteFunctions({db,call,log:(tx,a,action)=>tx.create(collection('audits').doc(),{actor:a.uid,action})});
 return {data,f};
}
const admin={admin:true,unitId:'admin',name:'Admin',uid:'a'},unit={admin:false,unitId:'dv001',name:'Đơn vị 1',uid:'u'};
test('Publishing and closing are admin-only; publication structure cannot overwrite submitted history',async()=>{
 const {data,f}=setup();await assert.rejects(()=>f.savePublication(base,unit));await f.savePublication(base,admin);
 assert.equal(data.get('inboxes/dv001/items/report-1').read,false);assert.equal(data.has('inboxes/dv002/items/report-1'),false);
 await assert.rejects(()=>f.savePublication(base,admin));await assert.rejects(()=>f.closePublication({id:base.id,closed:true},unit));
 await f.closePublication({id:base.id,closed:true},admin);assert.equal(data.get('publications/report-1').closed,true);
 assert.deepEqual(data.get('submissions/dv001__g1-001'),{note:'Existing evidence'});
});
test('Responses reject cross-unit access, stale edits and closed reports; timestamps are server transforms',async()=>{
 const {data,f}=setup();await f.savePublication({...base,deadline:''},admin);const d={id:base.id,values:{f0:2},files:[],revision:0};
 await assert.rejects(()=>f.submitResponse(d,{...unit,unitId:'dv002'}));await assert.rejects(()=>f.submitResponse(d,admin));
 await f.submitResponse({...d,receivedAt:'forged'},unit);let saved=data.get('publications/report-1/responses/dv001');assert.equal(saved.revision,1);assert.notEqual(saved.receivedAt,'forged');assert.equal(typeof saved.receivedAt,'object');
 await assert.rejects(()=>f.submitResponse(d,unit));await f.submitResponse({...d,revision:1},unit);saved=data.get('publications/report-1/responses/dv001');assert.equal(saved.revision,2);assert.equal(data.get('inboxes/admin/items/response-report-1-dv001').read,false);
 await f.closePublication({id:base.id,closed:true},admin);await assert.rejects(()=>f.submitResponse({...d,revision:2},unit));
});
test('Profiles enforce ownership and attachments cannot reference another record',async()=>{
 const {data,f}=setup();await assert.rejects(()=>f.saveProfile({unitId:'dv002'},unit));await f.saveProfile({unitId:'dv001',phone:'0123'},unit);assert.equal(data.get('profiles/dv001').phone,'0123');
 await assert.rejects(()=>f.saveProfile({unitId:'dv001',photos:[{path:'resources/profile/dv002/dv002/x.jpg',name:'x.jpg',size:10}]},unit));
 await f.saveProfile({unitId:'dv002',secretary:'Bí thư'},admin);assert.equal(data.get('profiles/dv002').secretary,'Bí thư');
});
