import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUpload} from '../src/files.js';
test('JPG, PNG and WEBP allow exactly 5 MiB and reject one byte above',()=>{
  for(const type of ['image/jpeg','image/png','image/webp']){
    assert.doesNotThrow(()=>validateUpload({type,size:5*1024*1024}));
    assert.throws(()=>validateUpload({type,size:5*1024*1024+1}),/5 MB/);
  }
});
test('PDF, Word and Excel retain the 10 MiB cap',()=>{
  for(const type of ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']){
    assert.doesNotThrow(()=>validateUpload({type,size:10*1024*1024}));
    assert.throws(()=>validateUpload({type,size:10*1024*1024+1}),/10 MB/);
  }
});
test('Unsupported formats and invalid sizes are rejected',()=>{
  for(const file of [{type:'image/svg+xml',size:1},{type:'application/octet-stream',size:1},{type:'image/png',size:NaN},{type:'image/png',size:-1}]) assert.throws(()=>validateUpload(file));
});
