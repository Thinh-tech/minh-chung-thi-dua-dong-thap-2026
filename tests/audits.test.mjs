import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIT_WINDOW_MS,recentAudits,installAudits} from '../src/audit-store.js';
import {Store} from '../src/store.js';
test('Audit window includes exactly 30 days, sorts timestamp formats and ignores expired or invalid dates',()=>{
 const now=Date.now(),rows=[{id:'edge',at:now-AUDIT_WINDOW_MS},{id:'expired',at:now-AUDIT_WINDOW_MS-1},{id:'latest',at:{toMillis:()=>now}},{id:'date',at:new Date(now-1)},{id:'bad',at:'invalid'},{id:'future',at:now+1}];
 assert.deepEqual(recentAudits(rows,now).map(r=>r.id),['latest','date','edge']);assert.equal(rows.length,6);
});
test('Admin can expand beyond 100 audit rows; queries cover 30 days and obsolete callbacks cannot restore logged-out data',()=>{
 const listeners=[],queries=[];let unsubscribed=0;
 const api={collection:(db,name)=>name,where:(...x)=>({where:x}),orderBy:(...x)=>({order:x}),limit:n=>({limit:n}),query:(...x)=>{queries.push(x);return x},onSnapshot:(q,ok,error)=>{listeners.push({ok,error});return ()=>unsubscribed++}};
 const s={user:{role:'admin'},audits:[],onChange:()=>{},db:{}};installAudits(s,api);s.watchAudits(()=>{});
 assert.equal(queries[0].at(-1).limit,101);assert.equal(queries[0][1].where[0],'at');assert.equal(queries[0][1].where[1],'>=');assert(Math.abs(+queries[0][1].where[2]-(Date.now()-AUDIT_WINDOW_MS))<1000);
 const rows=n=>({docs:Array.from({length:n},(_,i)=>({id:String(i),data:()=>({at:Date.now()-i,action:'A'+i})}))});
 listeners[0].ok(rows(101));assert.equal(s.auditRows().length,100);assert.equal(s.hasMoreAuditRows(),true);
 s.loadMoreAudits();assert.equal(queries[1].at(-1).limit,201);assert.equal(unsubscribed,1);assert.equal(s.auditLoading,true);
 listeners[0].ok(rows(1));assert.equal(s.audits.length,100);
 listeners[1].ok(rows(150));assert.equal(s.auditRows().length,150);assert.equal(s.hasMoreAuditRows(),false);
 s.stopAudits();s.user={role:'unit'};listeners[1].ok(rows(150));assert.equal(s.audits.length,0);assert.throws(()=>s.loadMoreAudits());assert.throws(()=>s.watchAudits(()=>{}));
});
test('Demo audit history retains more than 100 recent actions and can display the next page',()=>{
 const previous=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 try{const s=new Store({configured:false},[],()=>{});s.user={role:'admin',name:'Admin'};
 for(let i=0;i<150;i++)s.audit('Action '+i,'Unit','1.1');
 assert.equal(s.audits.length,150);assert.equal(s.auditRows().length,100);assert.equal(s.hasMoreAuditRows(),true);
 s.loadMoreAudits();assert.equal(s.auditRows().length,150);assert.equal(s.hasMoreAuditRows(),false);
 s.audits.push({at:Date.now()-31*86400000});assert.equal(s.auditRows().length,150);
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
});
