import test from 'node:test';
import assert from 'node:assert/strict';
import {selectRelease} from '../scripts/release.mjs';
test('Unchanged rebuild preserves version, release note and date',()=>{
 const old={version:'1.2.2',fingerprint:'abc',note:'Cũ',sourceNote:'Cũ',updatedAt:'2026-10-18'};
 assert.equal(selectRelease({version:'1.2.2'},old,'abc'),old);
});
test('A content update increments patch and does not repeat an old specific release note',()=>{
 const old={version:'1.2.2',fingerprint:'abc',note:'Giới hạn ảnh',sourceNote:'Giới hạn ảnh'};
 const next=selectRelease({version:'1.2.2',releaseNote:'Giới hạn ảnh'},old,'changed','new-date');
 assert.equal(next.version,'1.2.3');assert.equal(next.updatedAt,'new-date');assert.notEqual(next.note,'Giới hạn ảnh');
});
test('Explicit higher version and new note are honored; stale versions cannot downgrade',()=>{
 const old={version:'1.2.2',fingerprint:'abc',sourceNote:'Cũ'};
 const next=selectRelease({version:'1.3.0',releaseNote:'Mới'},old,'changed');
 assert.equal(next.version,'1.3.0');assert.equal(next.note,'Mới');
 assert.equal(selectRelease({version:'1.0.0'},old,'changed').version,'1.2.3');
 assert.throws(()=>selectRelease({version:'invalid'},null,'changed'));
});
