import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewChoices,reviewMatches} from '../src/review-filter.js';
const criteria=[
 {id:'g1-001',code:'1.1',group:'g1',area:'communications'},
 {id:'g2-001',code:'1.1',group:'g2',area:'organization'},
 {id:'g1-002',code:'1.2',group:'g1',area:'communications'},
 {id:'g1-010',code:'1.10',group:'g1',area:'communications'},
 {id:'g1-003',code:'1.3',group:'g1',area:'communications',active:false}
];
test('Criterion choices respect staff scope, active state, group and area; numeric codes sort naturally',()=>{
 const staff={role:'staff',active:true,areas:['communications'],permissions:['viewEvidence']};
 assert.deepEqual(reviewChoices(criteria,{actor:staff}).map(c=>c.id),['g1-001','g1-002','g1-010']);
 assert.deepEqual(reviewChoices(criteria,{actor:staff,group:'g2'}),[]);
 assert.deepEqual(reviewChoices(criteria,{actor:staff,area:'organization'}),[]);
 assert.deepEqual(reviewChoices(criteria,{actor:{role:'admin'},group:'g2'}).map(c=>c.id),['g2-001']);
 assert.deepEqual(reviewChoices(criteria,{actor:{...staff,active:false}}),[]);
});
test('Choosing one criterion includes all units for that exact ID and excludes identical codes in other sets',()=>{
 const records=[{unitId:'dv001',criterionId:'g1-001'},{unitId:'dv002',criterionId:'g1-001'},{unitId:'dv003',criterionId:'g1-002'},{unitId:'dv104',criterionId:'g2-001'}];
 assert.deepEqual(records.filter(r=>reviewMatches(r,'g1-001')).map(r=>r.unitId),['dv001','dv002']);
 assert.equal(records.filter(r=>reviewMatches(r)).length,4);
 assert.equal(records.filter(r=>reviewMatches(r,'missing')).length,0);
});
