import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCampaign,explanationWindow,explanationsOpen,assertCompetitionExport} from '../firebase/functions/campaign-model.js';
import {campaignFunctions} from '../firebase/functions/campaign.js';
import {checkExplanation} from '../firebase/functions/criteria-model.js';
import {permitted,normalizeStaff} from '../firebase/functions/access-model.js';
import {Store} from '../src/store.js';
const window={explanationsEnabled:true,explanationStart:'2026-11-04T08:00',explanationEnd:'2026-11-04T17:00'};
const unit={role:'unit',admin:false,unitId:'dv001'},staff={role:'staff',admin:false,permissions:['viewEvidence','exportData'],active:true,areas:['organization']};
test('Vietnam explanation window is closed by default, opens at the start, and closes at the exact end',()=>{
 const start=Date.parse('2026-11-04T01:00:00Z'),end=Date.parse('2026-11-04T10:00:00Z');
 assert.equal(explanationWindow({locked:true},start),'disabled');assert.equal(explanationWindow(window,start-1),'scheduled');
 assert.equal(explanationsOpen(window,start),true);assert.equal(explanationsOpen(window,end-1),true);assert.equal(explanationWindow(window,end),'closed');
 assert.equal(explanationsOpen({...window,explanationsEnabled:false},start),false);assert.equal(explanationsOpen({...window,resetInProgress:true},start),false);
 for(const invalid of [{explanationStart:''},{explanationEnd:'2026-02-31T10:00'},{explanationStart:window.explanationEnd}])assert.equal(explanationsOpen({...window,...invalid},start),false);
});
test('Settings validate calendar dates and preserve a scheduled window when an older client only changes intake',()=>{
 const base={locked:false,deadline:'',...window};assert.deepEqual(normalizeCampaign({locked:true,deadline:''},base),{...base,locked:true});
 for(const bad of [{explanationStart:''},{explanationEnd:''},{explanationEnd:window.explanationStart},{explanationEnd:'2026-02-31T10:00'},{explanationsEnabled:'yes'},{deadline:'2026-02-31T10:00'}])assert.throws(()=>normalizeCampaign({...base,...bad}));
 assert.equal(normalizeCampaign({locked:true,deadline:''}).explanationsEnabled,false);
});
test('Every new explanation and follow-up is checked against server time; authorized replies remain available after closing',()=>{
 const criterion={area:'organization',active:true},data={unitId:'dv001',text:'Giải trình',revision:0,expectedDate:''},now=Date.parse('2026-11-04T02:00:00Z');
 assert.doesNotThrow(()=>checkExplanation(unit,criterion,window,data,null,{now}));
 assert.throws(()=>checkExplanation(unit,criterion,{...window,explanationsEnabled:false},data,null,{now}));
 assert.throws(()=>checkExplanation(unit,criterion,window,{...data,revision:1},{revision:1},{now:Date.parse('2026-11-04T10:00:00Z')}));
 assert.doesNotThrow(()=>checkExplanation({admin:true},criterion,{}, {...data,revision:1,status:'answered'},{revision:1},{reply:true,now}));
});
test('Only admin can export even when a legacy staff profile retains exportData',async()=>{
 assert.doesNotThrow(()=>assertCompetitionExport({role:'admin',admin:true}));
 for(const actor of [unit,staff,{role:'admin',admin:false},null]){assert.throws(()=>assertCompetitionExport(actor));assert.equal(permitted(actor,'exportData'),false);}
 assert.throws(()=>normalizeStaff({id:'cb-test',name:'Cán bộ',areas:['organization'],permissions:['viewEvidence','exportData'],active:true,revision:0}));
 const previous=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{const s=new Store({configured:false},[],()=>{});s.user=staff;await assert.rejects(()=>s.authorizeExport());s.user=unit;await assert.rejects(()=>s.authorizeExport());s.user={role:'admin'};assert.deepEqual(await s.authorizeExport(),{ok:true});}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
test('Campaign and export callables enforce admin access, preserve unrelated settings, and block changes during reset',async()=>{
 let saved={locked:true,deadline:'',...window,resetJob:'kept'},audits=[];
 const db={doc:path=>({path}),runTransaction:async fn=>{let next;await fn({get:async()=>({data:()=>saved}),set:(ref,value)=>next={...saved,...value}});if(next)saved=next}};
 const call=(fn,adminOnly)=>async(d,a)=>{if(adminOnly&&!a.admin)throw Error('admin only');return fn(d,a)};
 const f=campaignFunctions({db,call,log:(tx,a,action)=>audits.push(action)});
 await assert.rejects(()=>f.setCampaign({locked:false,deadline:''},staff));await assert.rejects(()=>f.authorizeCompetitionExport({},unit));
 await f.setCampaign({locked:false,deadline:''},{admin:true});assert.equal(saved.resetJob,'kept');assert.equal(saved.explanationStart,window.explanationStart);
 await f.authorizeCompetitionExport({}, {admin:true});assert(audits.includes('Xuất báo cáo thi đua'));
 saved.resetInProgress=true;await assert.rejects(()=>f.setCampaign({locked:true,deadline:''},{admin:true}));assert.equal(saved.locked,false);
});
