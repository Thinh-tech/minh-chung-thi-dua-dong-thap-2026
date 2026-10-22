import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../src/store.js';
import {checkEdit,checkReview} from '../firebase/functions/validation.js';

test('Closing intake or passing the deadline keeps admin grading and returns available without permitting unit edits',async()=>{
 const previous=globalThis.localStorage,values=new Map();
 globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 try{
  for(const campaign of [{locked:true},{locked:false,deadline:'2020-01-01T00:00'}]){
   const s=new Store({configured:false},[{id:'admin',name:'Admin',role:'admin'},{id:'dv001',name:'Đơn vị',role:'unit'}],()=>{});
   const unit={id:'dv001',name:'Đơn vị'},c={id:'g1-001',code:'1.1',maxScore:5,active:true};
   s.user={id:'admin',role:'admin',name:'Admin'};s.settings=campaign;
   const original={unitId:unit.id,criterionId:c.id,note:'Minh chứng đã nộp',files:[{name:'bao-cao.pdf',path:'evidence/dv001/g1-001/bao-cao.pdf',size:100}],links:[],selfScore:3,status:'submitted',revision:1};
   s.records={[unit.id+'__'+c.id]:structuredClone(original)};
   assert.doesNotThrow(()=>checkReview({admin:true},original,{status:'approved',score:0,feedback:'Đã kiểm tra',revision:1},c.maxScore));
   await s.review(unit,c,0,'Đã kiểm tra','approved',1);
   const approved=s.records[unit.id+'__'+c.id];assert.equal(approved.status,'approved');assert.equal(approved.score,0);
   assert.deepEqual(approved.files,original.files);assert.equal(approved.note,original.note);assert.deepEqual(s.settings,campaign);
   assert.doesNotThrow(()=>checkReview({admin:true},approved,{status:'returned',feedback:'Làm rõ số liệu',revision:2},c.maxScore));
   await s.review(unit,c,0,'Làm rõ số liệu','returned',2);
   const returned=s.records[unit.id+'__'+c.id];assert.equal(returned.status,'returned');
   assert.throws(()=>checkEdit({unitId:unit.id},unit.id,returned,returned.revision,campaign));
   assert.throws(()=>checkReview({admin:false},returned,{status:'approved',score:5,feedback:'',revision:3},5));
   s.user={id:unit.id,role:'unit',name:unit.name};
   await assert.rejects(()=>s.save(unit,c,{note:'Thay nội dung',selfScore:5,links:[],files:[],revision:3},'submitted'));
   assert.equal(s.records[unit.id+'__'+c.id].note,original.note);
  }
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
