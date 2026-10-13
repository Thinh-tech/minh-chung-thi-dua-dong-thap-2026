import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReset,fingerprint} from '../firebase/functions/reset-policy.js';
import {checkEdit} from '../firebase/functions/validation.js';
test('Reset requires exact confirmation, valid scope and recent identity confirmation',()=>{
 const now=Date.now(),recent=Math.floor(now/1000);
 assert.doesNotThrow(()=>validateReset('all','DAT LAI 2026',recent,now));
 assert.doesNotThrow(()=>validateReset('dv001','DAT LAI 2026',recent,now));
 assert.throws(()=>validateReset('all','',recent,now));
 assert.throws(()=>validateReset('all','dat lai 2026',recent,now));
 assert.throws(()=>validateReset('admin','DAT LAI 2026',recent,now));
 assert.throws(()=>validateReset('dv001','DAT LAI 2026',recent-301,now));
 assert.throws(()=>validateReset('dv001','DAT LAI 2026',NaN,now));
});
test('Preview fingerprint changes when data changes and is independent of ordering',()=>{
 const a={id:'a',updateTime:{toMillis:()=>100}},b={id:'b',updateTime:{toMillis:()=>200}};
 assert.equal(fingerprint([a,b]),fingerprint([b,a]));
 assert.notEqual(fingerprint([a,b]),fingerprint([a,{...b,updateTime:{toMillis:()=>201}}]));
 assert.notEqual(fingerprint([a,b]),fingerprint([a]));
});
test('Submission changes blocked during reset regardless of administrator permission',()=>{
 assert.throws(()=>checkEdit({admin:true},'dv001',undefined,0,{resetInProgress:true,locked:false}));
});
