import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {installAudits,AUDIT_WINDOW_MS} from '../src/audit-store.js';
import {staffAuditRows,writeStaffAuditWorkbook} from '../src/staff-audit-export.js';

const now=Date.parse('2026-11-12T08:00:00Z');
const accounts={'cb-test':{uid:'staff_cb-test',name:'Tên hiện tại'},'cb-other':{uid:'staff_cb-other',name:'Cán bộ khác'}};

test('Staff workbook excludes admin actions and preserves historical names and zero scores',async()=>{
 const source=[
  {at:now,actorUid:'staff_cb-test',actor:'=Tên lúc thao tác',action:'Chấm lại điểm',unit:'Đơn vị A',code:'1.1',previousScore:3,score:0},
  {at:now,actorUid:'staff_cb-test',action:'Phản hồi giải trình'},
  {at:now,actorUid:'staff_cb-other',action:'Chấm điểm',score:2},
  {at:now,actorUid:'staff_cb-archived',action:'Chấm điểm',score:1},
  {at:now,actorUid:'admin',actor:'Tên hiện tại',action:'Chấm điểm',score:9}
 ];
 assert.equal(staffAuditRows(source,accounts).length,4);
 const selected=staffAuditRows(source,accounts,'cb-test');
 assert.equal(selected.length,2);
 const wb=new ExcelJS.Workbook();
 await wb.xlsx.load(await writeStaffAuditWorkbook(selected,now));
 const history=wb.getWorksheet('Lịch sử thao tác');
 const scores=wb.getWorksheet('Lịch sử điểm');
 assert.equal(history.rowCount,3);
 assert.equal(scores.rowCount,2);
 assert.equal(scores.getCell('A2').value,'2026-11-12 15:00:00');
 assert.equal(scores.getCell('C2').value,'=Tên lúc thao tác');
 assert.equal(scores.getCell('I2').value,3);
 assert.equal(scores.getCell('J2').value,0);
});

test('Only admins can read an export and it loads the whole 30-day window beyond the visible page',async()=>{
 const rows=Array.from({length:150},(_,n)=>({at:now-n,actorUid:'staff_cb-test'}));
 const calls=[];
 const api={collection:(_,name)=>name,query:(...terms)=>terms,where:(...filter)=>filter,orderBy:(...order)=>order,
  getDocsFromServer:async source=>{
   calls.push(source);
   return {docs:source==='staffAccounts'
    ?Object.entries(accounts).map(([id,record])=>({id,data:()=>record}))
    :rows.map(record=>({data:()=>record}))};
  }};
 const store={user:{role:'staff'},audits:rows.slice(0,100)};
 installAudits(store,api);
 await assert.rejects(store.readAuditReport(now),/Chỉ admin/);
 assert.equal(calls.length,0);
 store.user={role:'admin'};
 assert.equal((await store.readAuditReport(now)).rows.length,150);
 assert.deepEqual(calls[0],['audits',['at','>=',new Date(now-AUDIT_WINDOW_MS)],['at','<=',new Date(now)],['at','desc']]);
});
