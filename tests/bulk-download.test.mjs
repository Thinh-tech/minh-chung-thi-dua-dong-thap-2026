import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {safeDownloadName,allocateDownloadNames,runBulkDownload,openBulkDownload} from '../src/bulk-download.js';

test('ZIP names preserve Vietnamese text, prevent traversal and retain colliding file contents',async()=>{
 assert.equal(safeDownloadName('../CON'),'_CON');
 const tasks=[
  {name:'../Minh chứng.pdf',path:['../Đơn vị'],load:async()=>new Blob(['mot'])},
  {name:'../Minh chứng.pdf',path:['../Đơn vị'],load:async()=>new Blob(['hai'])}
 ];
 const names=allocateDownloadNames(tasks);
 assert.notEqual(names[0],names[1]);
 assert.equal(names.some(name=>name.includes('..')),false);
 let output;
 const result=await runBulkDownload({tasks,zip:true,filename:'Hồ sơ.zip',save:async(blob,name)=>output={blob,name},assertAccess:()=>{}});
 const archive=await JSZip.loadAsync(await output.blob.arrayBuffer());
 assert.equal(await archive.file(names[0]).async('string'),'mot');
 assert.equal(await archive.file(names[1]).async('string'),'hai');
 assert.equal(output.name,'Hồ sơ.zip');
 assert.equal(result.completed,2);
});

test('Bulk downloads report partial failures, include an error list and never emit an empty ZIP',async()=>{
 const saved=[];
 const tasks=[{name:'ok.txt',load:async()=>new Blob(['ok'])},{name:'fail.txt',load:async()=>{throw Error('Missing file')}}];
 const result=await runBulkDownload({tasks,zip:true,save:(blob)=>saved.push(blob),assertAccess:()=>{}});
 assert.equal(result.completed,1);assert.equal(result.failures.length,1);
 const zip=await JSZip.loadAsync(await saved[0].arrayBuffer());
 assert.equal(await zip.file('ok.txt').async('string'),'ok');
 assert.match(await zip.file('_LOI_TAI_VE.txt').async('string'),/fail.txt/);
 let writes=0;
 await runBulkDownload({tasks:[tasks[1]],zip:true,save:()=>writes++,assertAccess:()=>{}});
 assert.equal(writes,0);
});

test('Direct downloads use the selected tasks and stop immediately when access changes or cancel is requested',async()=>{
 const saved=[],loaded=[];
 const task=name=>({name,load:async()=>{loaded.push(name);return new Blob([name])}});
 await runBulkDownload({tasks:[task('b.txt')],zip:false,save:(_,name)=>saved.push(name),assertAccess:()=>{}});
 assert.deepEqual(saved,['b.txt']);assert.deepEqual(loaded,['b.txt']);
 let allowed=true,writes=0;
 await assert.rejects(runBulkDownload({
  tasks:[{name:'x',load:async()=>{allowed=false;return new Blob(['x'])}}],
  zip:false,save:()=>writes++,assertAccess:()=>{if(!allowed)throw Error('Session changed')}
 }),/Session changed/);
 assert.equal(writes,0);
 const controller=new AbortController();controller.abort();
 await assert.rejects(runBulkDownload({tasks:[task('c')],zip:true,save:()=>writes++,assertAccess:()=>{},signal:controller.signal}),{name:'AbortError'});
 assert.equal(writes,0);
});

test('Bulk download entry point rejects every non-admin role before creating UI',()=>{
 for(const role of ['unit','staff','observer',undefined]){
  assert.throws(()=>openBulkDownload({store:{user:{role}},tasks:[]}),/Chỉ admin/);
 }
});
