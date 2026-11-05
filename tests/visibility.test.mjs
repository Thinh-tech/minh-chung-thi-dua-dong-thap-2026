import test from 'node:test';
import assert from 'node:assert/strict';
import {canViewScores,publicSubmission,assertWritable,writeSubmissionView} from '../firebase/functions/visibility-model.js';
import {Store} from '../src/store.js';
const campaign={explanationsEnabled:true,explanationStart:'2026-11-05T08:00',explanationEnd:'2026-11-05T17:00'},start=Date.parse('2026-11-05T01:00:00Z'),end=Date.parse('2026-11-05T10:00:00Z');
test('Commune score access follows the active explanation window including explicit closure and reset',()=>{
 const commune={role:'unit',group:'g1'};
 assert.equal(canViewScores(commune,{},start),false);assert.equal(canViewScores(commune,campaign,start-1),false);
 assert.equal(canViewScores(commune,campaign,start),true);assert.equal(canViewScores(commune,campaign,end),false);
 assert.equal(canViewScores(commune,{...campaign,explanationsEnabled:false},start),false);
 assert.equal(canViewScores(commune,{...campaign,resetInProgress:true},start),false);
 for(const actor of [{role:'admin'},{role:'staff'},{role:'observer'},{role:'unit',group:'g2'}])assert.equal(canViewScores(actor,{},start),true);
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
