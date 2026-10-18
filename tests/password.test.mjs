import test from 'node:test';
import assert from 'node:assert/strict';
import {changeCurrentPassword,validatePasswordChange,passwordErrorMessage} from '../src/password.js';

const old='Current-test-123',next='New-test-45678';
function fixture(){
  const user={uid:'own-unit',email:'own-unit@minhchung.invalid'},auth={currentUser:user},calls=[];
  const api={EmailAuthProvider:{credential:(email,password)=>({email,password})},reauthenticateWithCredential:async(u,c)=>calls.push(['reauth',u,c]),updatePassword:async(u,p)=>calls.push(['update',u,p])};
  return {user,auth,calls,api};
}
test('Reject missing, short, mismatched, oversized or unchanged passwords before authentication',async()=>{
  for(const values of [['',next,next],[old,'short','short'],[old,next,'different'],[old,'a'.repeat(129),'a'.repeat(129)],[old,old,old]]){
    const f=fixture();await assert.rejects(changeCurrentPassword(f.auth,...values,f.api));assert.equal(f.calls.length,0);
  }
  assert.doesNotThrow(()=>validatePasswordChange(old,next,next));
});
test('Reauthenticate the signed-in unit before changing only its password',async()=>{
  const f=fixture();await changeCurrentPassword(f.auth,old,next,next,f.api);
  assert.deepEqual(f.calls,[['reauth',f.user,{email:f.user.email,password:old}],['update',f.user,next]]);
});
test('Incorrect current password or missing session never updates the password',async()=>{
  const f=fixture();f.api.reauthenticateWithCredential=async()=>{throw {code:'auth/invalid-credential'}};
  await assert.rejects(changeCurrentPassword(f.auth,old,next,next,f.api));assert.equal(f.calls.length,0);
  f.auth.currentUser=null;await assert.rejects(changeCurrentPassword(f.auth,old,next,next,f.api),/hết hạn/);
});
test('A switched account cannot receive the pending password change',async()=>{
  const f=fixture();f.api.reauthenticateWithCredential=async()=>{f.auth.currentUser={uid:'other-unit',email:'other@minhchung.invalid'}};
  await assert.rejects(changeCurrentPassword(f.auth,old,next,next,f.api),/đã thay đổi/);assert.equal(f.calls.length,0);
});
test('Firebase update failures propagate and auth errors have specific safe messages',async()=>{
  const f=fixture();f.api.updatePassword=async()=>{throw {code:'auth/weak-password'}};
  await assert.rejects(changeCurrentPassword(f.auth,old,next,next,f.api),e=>e.code==='auth/weak-password');
  assert.match(passwordErrorMessage({code:'auth/network-request-failed'}),/kết nối/);
  assert.match(passwordErrorMessage({code:'auth/invalid-credential'}),/hiện tại/);
  assert.equal(passwordErrorMessage({code:'auth/unknown',message:next}).includes(next),false);
});
