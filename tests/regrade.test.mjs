import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReview} from '../firebase/functions/review-model.js';
import {Store} from '../src/store.js';
const criterion={id:'g1-001',code:'1.1',maxScore:5,area:'organization',active:true};
const admin={id:'admin',uid:'admin',name:'Admin',role:'admin',admin:true};
const original={unitId:'dv001',criterionId:criterion.id,status:'approved',score:2,selfScore:4,feedback:'Lần đầu',revision:7,note:'Kết quả của đơn vị',files:[{name:'a.pdf',path:'evidence/dv001/g1-001/a.pdf'}],links:['https://example.com']};
const data={status:'approved',score:0,feedback:'Đối chiếu lại hồ sơ',revision:7};

test('Admin regrading preserves evidence and records the old and new score, feedback and revision',async()=>{
 const review=prepareReview(admin,original,data,criterion);
 assert.equal(review.update.score,0);assert.equal(review.update.status,'approved');assert.equal(review.update.revision,8);
 assert.equal(review.audit.regrade,true);assert.equal(review.audit.previousScore,2);assert.equal(review.audit.score,0);
 assert.equal(review.audit.previousFeedback,'Lần đầu');assert.equal(review.audit.feedback,data.feedback);
 const storage=globalThis.localStorage,values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 try{for(const campaign of [{locked:true},{deadline:'2020-01-01T00:00'}]){
  const s=new Store({configured:false},[],()=>{});s.user=admin;s.settings=campaign;s.records={'dv001__g1-001':structuredClone(original)};
  await s.review({id:'dv001',name:'Đơn vị'},criterion,0,data.feedback,'approved',7);
  const saved=s.records['dv001__g1-001'];assert.equal(saved.score,0);assert.equal(saved.selfScore,4);assert.equal(saved.note,original.note);assert.deepEqual(saved.files,original.files);assert.deepEqual(saved.links,original.links);assert.deepEqual(s.settings,campaign);assert.equal(s.audits[0].previousScore,2);
  await s.review({id:'dv001',name:'Đơn vị'},criterion,5,'Kiểm tra lần nữa','approved',8);assert.equal(s.records['dv001__g1-001'].score,5);assert.equal(s.audits[0].previousScore,0);
 }}finally{if(storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=storage}
});
test('Regrading rejects stale, missing, draft and returned records and invalid scores',()=>{
 for(const score of [-1,6,NaN,Infinity,null,'',undefined])assert.throws(()=>prepareReview(admin,original,{...data,score},criterion));
 for(const old of [undefined,{...original,revision:8},{...original,status:'draft'},{...original,status:'returned'}])assert.throws(()=>prepareReview(admin,old,data,criterion));
 assert.equal(original.score,2);assert.equal(original.revision,7);
});
test('Unit and staff accounts cannot regrade, while staff can still grade submitted evidence in their area',()=>{
 const staff={role:'staff',admin:false,uid:'cb-test',areas:['organization'],permissions:['viewEvidence','gradeEvidence'],active:true};
 assert.throws(()=>prepareReview({role:'unit',admin:false},original,data,criterion));
 assert.throws(()=>prepareReview(staff,original,data,criterion));
 assert.doesNotThrow(()=>prepareReview(staff,{...original,status:'submitted'},data,criterion));
 assert.throws(()=>prepareReview(staff,{...original,status:'submitted'},data,{...criterion,area:'movement'}));
});
