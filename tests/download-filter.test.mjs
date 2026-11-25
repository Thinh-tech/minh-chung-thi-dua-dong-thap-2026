import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadCriteria,downloadSets,downloadRecords} from '../src/download-filter.js';
import {metrics} from '../src/core.js';

const sets=[
 {id:'g1',items:[{id:'g1-001',code:'1.1',area:'movement',maxScore:4},{id:'g1-002',code:'1.2',area:'organization',maxScore:3}]},
 {id:'g2',items:[{id:'g2-001',code:'1.1',area:'movement',maxScore:9}]}
];
const records={
 a:{unitId:'dv001',criterionId:'g1-001',status:'approved',score:0},
 b:{unitId:'dv002',criterionId:'g1-001',status:'approved',score:2},
 c:{unitId:'dv001',criterionId:'g1-002',status:'approved',score:3},
 d:{unitId:'dv003',criterionId:'g2-001',status:'approved',score:8}
};
test('An exact criterion selects multiple units while keeping equal criterion codes in other groups separate',()=>{
 const filters={criterionId:'g1-001'};
 assert.deepEqual(downloadCriteria(sets,filters).map(c=>c.id),['g1-001']);
 assert.deepEqual(downloadRecords(records,['dv001','dv002','dv003'],sets,filters).map(r=>r.unitId),['dv001','dv002']);
 assert.deepEqual(downloadRecords(records,['dv002'],sets,filters).map(r=>r.unitId),['dv002']);
});
test('Area and group filters constrain both files and report metrics including zero awarded scores',()=>{
 const scope={group:'g1',area:'movement'},filtered=downloadSets(sets,scope);
 assert.deepEqual(downloadRecords(records,['dv001','dv002','dv003'],sets,scope).map(r=>r.criterionId),['g1-001','g1-001']);
 const report=metrics({id:'dv001',group:'g1'},filtered,{
  'dv001__g1-001':records.a,'dv001__g1-002':records.c
 });
 assert.equal(report.total,1);assert.equal(report.max,4);assert.equal(report.score,0);assert.equal(report.approved,1);
 assert.equal(downloadCriteria(sets,{group:'g1',area:'organization',criterionId:'g1-001'}).length,0);
 assert.equal(downloadCriteria(sets).length,3);
});
