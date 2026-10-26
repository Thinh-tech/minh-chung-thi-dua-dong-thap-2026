import {FieldValue} from 'firebase-admin/firestore';
import {normalizeStaff} from './access-model.js';
export function staffFunctions({db,auth,call,log}){
 return {manageStaffAccount:call(async(d,a)=>{
  const next=normalizeStaff(d),ref=db.doc('staffAccounts/'+next.id),existing=(await ref.get()).data();
  if((existing?.revision||0)!==d.revision)throw Error('Tài khoản vừa được cập nhật. Vui lòng mở lại.');
  if(!existing&&!d.password)throw Error('Nhập mật khẩu khởi tạo.');
  let created=false,uid=existing?.uid;
  if(!existing){uid='staff_'+next.id;await auth.createUser({uid,email:next.id+'@minhchung.invalid',password:d.password,displayName:next.name,disabled:!next.active});created=true;}
  try{
   if(created)await auth.setCustomUserClaims(uid,{unitId:next.id,staff:true});
   await db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if((current?.revision||0)!==next.revision)throw Error('Tài khoản vừa được cập nhật. Vui lòng mở lại.');const profile={...next,unitId:next.id,uid,revision:next.revision+1,updatedAt:FieldValue.serverTimestamp()};tx.set(ref,profile);tx.set(db.doc('users/'+uid),profile,{merge:true});log(tx,a,created?'Tạo tài khoản cán bộ':'Cập nhật phân quyền cán bộ',next.name,next.id)});
  }catch(error){if(created)await auth.deleteUser(uid).catch(()=>{});throw error;}
  if(!created){try{await auth.updateUser(uid,{displayName:next.name,disabled:!next.active,...(d.password?{password:d.password}:{})});if(!next.active||d.password)await auth.revokeRefreshTokens(uid);}catch{return {ok:true,warning:'Đã lưu phân quyền. Chưa đồng bộ được trạng thái hoặc mật khẩu Firebase Authentication; hãy mở lại tài khoản và lưu lần nữa.'}}}
  return {ok:true,id:next.id};
 },true)};
}
