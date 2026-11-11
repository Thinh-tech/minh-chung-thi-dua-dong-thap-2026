import test from 'node:test';
import assert from 'node:assert/strict';
import {canViewScores,canViewRankings,submissionScoreScope,canViewUnitScore,publicSubmission,assertWritable,writeSubmissionView} from '../firebase/functions/visibility-model.js';
import {Store} from '../src/store.js';
const campaign={explanationsEnabled:true,explanationStart:'2026-11-05T08:00',explanationEnd:'2026-11-05T17:00'},start=Date.parse('2026-11-05T01:00:00Z'),end=Date.parse('2026-11-05T10:00:00Z');
test('All five unit groups have score access only during the allowed explanation window',()=>{
 for(const group of ['g1','g2','g3','g4','g5',undefined]){
  const actor={role:'unit',group};
  assert.equal(canViewScores(actor,{},start),false);assert.equal(canViewScores(actor,campaign,start-1),false);
  assert.equal(canViewScores(actor,campaign,start),true);assert.equal(canViewScores(actor,campaign,end-1),true);assert.equal(canViewScores(actor,campaign,end),false);
  assert.equal(canViewScores(actor,{...campaign,explanationsEnabled:false},start),false);
  assert.equal(canViewScores(actor,{...campaign,resetInProgress:true},start),false);
  assert.equal(canViewScores(actor,{...campaign,explanationEnd:''},start),false);
 }
 for(const actor of [{role:'admin'},{role:'staff'},{role:'observer'}])assert.equal(canViewScores(actor,{},start),true);
});
test('Public submission strips grades, approved feedback and unrecognized fields while preserving editable evidence and revisions',()=>{
 const row={unitId:'dv001',criterionId:'g1-001',status:'approved',revision:4,selfScore:3,score:2,reviewedBy:'private',feedback:'Điểm duyệt 2',previousScore:1,note:'Hồ sơ',files:[{path:'a'}],links:[]};
 const view=publicSubmission(row);assert.equal(view.score,undefined);assert.equal(view.previousScore,undefined);assert.equal(view.reviewedBy,undefined);assert.equal(view.feedback,'');assert.equal(view.selfScore,3);assert.equal(view.revision,4);assert.deepEqual(view.files,row.files);
 assert.equal(publicSubmission({...row,status:'returned',feedback:'Bổ sung tệp'}).feedback,'Bổ sung tệp');assert.equal(row.score,2);
});
test('Projection writes and reset deletion share the authoritative transaction writer',()=>{
 const operations=[],db={doc:path=>({path})},writer={set:(ref,row)=>operations.push({ref,row}),delete:ref=>operations.push({ref,deleted:true})};
 writeSubmissionView(db,writer,'dv001__g1-001',{status:'approved',score:4,revision:8});
 assert.equal(operations[0].ref.path,'submissionViews/dv001__g1-001');assert.equal(operations[0].row.revision,8);assert.equal(operations[0].row.score,undefined);
 writeSubmissionView(db,writer,'dv001__g1-001',null);assert.equal(operations[1].deleted,true);
});
test('Observer cannot call application mutations, edit evidence, upload files or export competition reports',async()=>{
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{const s=new Store({configured:false},[],()=>{});s.user={id:'observer',role:'observer',name:'Quan sát'};
 assert.throws(()=>assertWritable(s.user));
 for(const run of [()=>s.call('setCampaign',{}),()=>s.save({}, {}, {},'draft'),()=>s.upload({}, {},{}),()=>s.updateSettings({}),()=>s.postExplanation({},{}),()=>s.send('admin','x'),()=>s.saveProfile({}),()=>s.savePublication({}),()=>s.submitResponse({}),()=>s.setBanner({}),()=>s.authorizeExport()])await assert.rejects(run);
 assert.doesNotThrow(()=>assertWritable({role:'unit'}));
 }finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old}
});

test('Rankings require explicit publication and unit score access; admin retains management access',()=>{
 const now=start+1,commune={role:'unit',group:'g1'};
 assert.equal(canViewRankings({role:'admin'},{},now),true);
 for(const actor of [commune,{role:'unit',group:'g2'},{role:'staff'},{role:'observer'}]){
  assert.equal(canViewRankings(actor,campaign,now),false);
  assert.equal(canViewRankings(actor,{...campaign,rankingsEnabled:true},now),true);
  assert.equal(canViewRankings(actor,{...campaign,rankingsEnabled:false},now),false);
 }
 for(const group of ['g1','g2','g3','g4','g5']){
  assert.equal(canViewRankings({role:'unit',group},{...campaign,rankingsEnabled:true},end),false);
  assert.equal(canViewRankings({role:'unit',group},{rankingsEnabled:true},now),false);
 }
});

test('A unit only sees its own awarded scores until rankings open within the explanation window',()=>{
 const unit={role:'unit',id:'dv001'};
 const published={...campaign,rankingsEnabled:true};
 assert.equal(submissionScoreScope(unit,campaign,start-1),'hidden');
 assert.equal(submissionScoreScope(unit,campaign,start),'own');
 assert.equal(canViewUnitScore(unit,campaign,'dv001',start),true);
 assert.equal(canViewUnitScore(unit,campaign,'dv002',start),false);
 assert.equal(submissionScoreScope(unit,published,start),'all');
 assert.equal(canViewUnitScore(unit,published,'dv002',start),true);
 assert.equal(canViewUnitScore(unit,{...published,rankingsEnabled:false},'dv002',start),false);
 assert.equal(canViewUnitScore(unit,published,'dv001',end),false);
 assert.equal(canViewUnitScore(unit,published,'dv002',end),false);
 assert.equal(canViewUnitScore({role:'admin'},campaign,'dv002',end),true);
});
