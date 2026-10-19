import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,normalizeCriterion,checkCriterionUpdate,checkExplanation,campaignClosed,criterionIdPattern} from '../firebase/functions/criteria-model.js';
import {makeCatalog} from '../src/catalog.js';
import {metrics} from '../src/core.js';
const c={id:'g1-001',group:'g1',code:'1.1',section:'Công tác tuyên truyền, giáo dục',title:'Nội dung',maxScore:5,evaluation:'Hướng dẫn',evidence:'Báo cáo',area:'communications',active:true,revision:0};
const admin={admin:true,unitId:'admin'},unit={admin:false,unitId:'dv001'};
const data={unitId:'dv001',text:'Đơn vị chưa hoàn thành do thiếu số liệu; đề nghị bổ sung sau.',revision:0,expectedDate:'2026-11-20'};
test('Criteria validate exact areas, numeric scores, required text and generated IDs',()=>{
 assert.equal(AREAS.length,4);assert.doesNotThrow(()=>normalizeCriterion(c));
 for(const change of [{area:'admin'},{maxScore:NaN},{maxScore:-1},{maxScore:'5'},{title:' '},{revision:-1},{active:'false'},{group:'g6'}])assert.throws(()=>normalizeCriterion({...c,...change}));
 assert(criterionIdPattern.test('g1-'+'a'.repeat(32)));assert(!criterionIdPattern.test('../users/admin'));
});
test('Only admin can change criteria; concurrent edits, duplicate codes and group moves are rejected',()=>{
 assert.throws(()=>checkCriterionUpdate(unit,c,c,[],[],{}));
 assert.throws(()=>checkCriterionUpdate(admin,{...c,revision:1},c,[],[],{}));
 assert.throws(()=>checkCriterionUpdate(admin,c,{...c,group:'g2'},[],[],{}));
 assert.throws(()=>checkCriterionUpdate(admin,c,c,[{...c,id:'g1-002'}],[],{}));
 assert.throws(()=>checkCriterionUpdate(admin,c,c,[],[],{resetInProgress:true}));
 assert.doesNotThrow(()=>checkCriterionUpdate(admin,c,c,[c],[],{}));
});
test('Lowering maximum cannot invalidate existing scores; soft archive keeps all submissions',()=>{
 assert.throws(()=>checkCriterionUpdate(admin,c,{...c,maxScore:2},[],[{selfScore:4}],{}));
 assert.throws(()=>checkCriterionUpdate(admin,c,{...c,maxScore:2},[],[{score:4}],{}));
 const bases=[{id:'g1',items:[c]}],records={'dv001__g1-001':{status:'approved',score:4}};
 const archived=makeCatalog(bases,{'g1-001':{...c,active:false,revision:1}});
 assert.equal(metrics({id:'dv001',group:'g1'},archived.sets,records).total,0);
 assert.equal(records['dv001__g1-001'].score,4);assert(archived.all.has('g1-001'));
 const restored=makeCatalog(bases,{'g1-001':{...c,revision:2}});
 assert.equal(metrics({id:'dv001',group:'g1'},restored.sets,records).score,4);
});
test('Dynamic catalog includes new sections and classifies legacy criteria',()=>{
 const result=makeCatalog([{id:'g1',items:[c]}],{'g1-002':{...c,id:'g1-002',code:'2.1',section:'Nhóm mới',area:'movement'}});
 assert.equal(result.sets[0].items.length,2);assert.equal(result.sets[0].groups.length,2);assert.equal(result.all.get('g1-002').area,'movement');
});
test('Own-unit explanations work when locked or after Vietnam deadline, never while open',()=>{
 assert.doesNotThrow(()=>checkExplanation(unit,c,{locked:true},data));
 assert.throws(()=>checkExplanation(unit,c,{locked:false},data));
 const now=Date.parse('2026-11-01T10:01:00Z');
 assert(campaignClosed({deadline:'2026-11-01T17:00'},now));
 assert.doesNotThrow(()=>checkExplanation(unit,c,{deadline:'2026-11-01T17:00'},data,null,{now}));
 assert.throws(()=>checkExplanation({...unit,unitId:'dv002'},c,{locked:true},data));
 assert.throws(()=>checkExplanation(admin,c,{locked:true},data));
});
test('Explanation writes reject archived criteria, reset, empty content, invalid dates and stale revisions',()=>{
 for(const change of [{text:' '},{text:'x'.repeat(4001)},{expectedDate:'2026-02-31'},{revision:1}])assert.throws(()=>checkExplanation(unit,c,{locked:true},{...data,...change}));
 assert.throws(()=>checkExplanation(unit,{...c,active:false},{locked:true},data));
 assert.throws(()=>checkExplanation(unit,c,{locked:true,resetInProgress:true},data));
});
test('Admin replies require an existing thread and revision; units cannot mark it resolved',()=>{
 const old={revision:2},reply={...data,revision:2,status:'resolved'};
 assert.doesNotThrow(()=>checkExplanation(admin,c,{locked:false},reply,old,{reply:true}));
 assert.throws(()=>checkExplanation(unit,c,{locked:true},reply,old,{reply:true}));
 assert.throws(()=>checkExplanation(admin,c,{locked:true},reply,null,{reply:true}));
 assert.throws(()=>checkExplanation(admin,c,{locked:true},{...reply,revision:1},old,{reply:true}));
 assert.throws(()=>checkExplanation(admin,c,{locked:true},{...reply,status:'approved'},old,{reply:true}));
});
