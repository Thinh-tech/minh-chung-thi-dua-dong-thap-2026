import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {FieldValue,Timestamp} from 'firebase-admin/firestore';
import {validateReset,fingerprint} from './reset-policy.js';
export function resetFunctions(db,actor,opts){
 const campaign=db.doc('settings/campaign');
 const scoped=scope=>scope==='all'?db.collection('submissions'):db.collection('submissions').where('unitId','==',scope);
 const prepare=onCall({...opts,timeoutSeconds:60},async req=>{
  const a=await actor(req,true),scope=req.data?.scope;
  if(scope!=='all'&&!/^dv\d{3}$/.test(scope||''))throw new HttpsError('invalid-argument','Chọn phạm vi đặt lại.');
  const [settings,rows]=await Promise.all([campaign.get(),scoped(scope).get()]);
  if(settings.data()?.resetInProgress)throw new HttpsError('failed-precondition','Đang đặt lại dữ liệu. Hãy hoàn tất thao tác đang chờ.');
  const scopeName=scope==='all'?'Toàn tỉnh':(await db.doc('units/'+scope).get()).data()?.name;
  if(!scopeName)throw new HttpsError('not-found','Đơn vị không tồn tại.');
  const counts={total:rows.size,draft:0,submitted:0,approved:0,returned:0};rows.docs.forEach(d=>{if(d.data().status in counts)counts[d.data().status]++});
  const ref=db.collection('resetRequests').doc();await ref.set({scope,scopeName,actorUid:a.uid,actor:a.name,counts,fingerprint:fingerprint(rows.docs),createdAt:Timestamp.now(),expiresAt:Timestamp.fromMillis(Date.now()+600000),status:'prepared'});
  return {requestId:ref.id,scope,scopeName,counts};
 });
 const commit=onCall({...opts,timeoutSeconds:540,memory:'512MiB'},async req=>{
  const a=await actor(req,true),id=req.data?.requestId;
  if(typeof id!=='string'||!/^[A-Za-z0-9]{20}$/.test(id))throw new HttpsError('invalid-argument','Yêu cầu đặt lại không hợp lệ.');
  const ref=db.doc('resetRequests/'+id),archive=db.doc('resetArchives/'+id);let job;
  await db.runTransaction(async tx=>{
   const [r,c]=await Promise.all([tx.get(ref),tx.get(campaign)]);job=r.data();
   if(!job||job.actorUid!==a.uid)throw new HttpsError('permission-denied','Yêu cầu không thuộc phiên quản trị này.');
   try{validateReset(job.scope,req.data?.phrase,req.auth.token.auth_time)}catch(e){throw new HttpsError('failed-precondition',e.message)}
   if(job.status==='complete')return;
   if(!['prepared','running'].includes(job.status))throw new HttpsError('failed-precondition','Yêu cầu đã hủy. Hãy xem lại phạm vi.');
   if(job.status==='prepared'&&job.expiresAt.toMillis()<Date.now())throw new HttpsError('failed-precondition','Xác nhận đã hết hạn. Hãy xem lại phạm vi.');
   if(c.data()?.resetJob&&c.data().resetJob!==id)throw new HttpsError('failed-precondition','Có thao tác đặt lại khác đang xử lý.');
   if(job.leaseUntil?.toMillis()>Date.now())throw new HttpsError('aborted','Thao tác đang xử lý. Vui lòng chờ trước khi thử lại.');
   job.previousLocked??=!!c.data()?.locked;
   tx.update(ref,{status:'running',leaseUntil:Timestamp.fromMillis(Date.now()+600000),previousLocked:job.previousLocked,expiresAt:FieldValue.delete()});
   tx.set(campaign,{resetInProgress:true,resetJob:id,resetScope:job.scope,locked:true},{merge:true});
  });
  if(job.status==='complete')return {ok:true,archiveId:id,count:job.counts.total};
  try{
   const rows=await scoped(job.scope).get();
   if(job.status==='prepared'&&fingerprint(rows.docs)!==job.fingerprint){
    await db.runTransaction(async tx=>{const c=await tx.get(campaign);if(c.data()?.resetJob===id)tx.update(campaign,{locked:job.previousLocked??false,resetInProgress:false,resetJob:FieldValue.delete(),resetScope:FieldValue.delete()});tx.update(ref,{status:'cancelled',leaseUntil:FieldValue.delete()})});
    throw new HttpsError('failed-precondition','Dữ liệu vừa thay đổi. Hãy xem lại số hồ sơ trước khi đặt lại.');
   }
   await archive.set({scope:job.scope,scopeName:job.scopeName,actor:a.name,actorUid:a.uid,count:job.counts.total,status:'running',createdAt:job.createdAt},{merge:true});
   for(let i=0;i<rows.docs.length;i+=150){const batch=db.batch();for(const d of rows.docs.slice(i,i+150)){batch.set(archive.collection('records').doc(d.id),d.data());batch.delete(d.ref)}await batch.commit()}
   await db.runTransaction(async tx=>{const [r,c]=await Promise.all([tx.get(ref),tx.get(campaign)]);if(c.data()?.resetJob!==id)throw Error('Không thể hoàn tất trạng thái đặt lại.');tx.update(campaign,{locked:r.data().previousLocked,resetInProgress:false,resetJob:FieldValue.delete(),resetScope:FieldValue.delete()});tx.update(ref,{status:'complete',leaseUntil:FieldValue.delete(),completedAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+7*86400000)});tx.set(archive,{status:'complete',completedAt:FieldValue.serverTimestamp()},{merge:true});tx.create(db.collection('audits').doc(),{actor:a.name,actorUid:a.uid,action:'Đặt lại '+job.counts.total+' hồ sơ (đã lưu bản sao)',unit:job.scopeName,code:id,at:FieldValue.serverTimestamp()})});
   return {ok:true,count:job.counts.total,archiveId:id};
  }catch(e){await ref.set({leaseUntil:FieldValue.delete(),lastError:'Thao tác chưa hoàn tất; có thể tiếp tục từ thiết lập hệ thống.'},{merge:true});throw e instanceof HttpsError?e:new HttpsError('internal','Chưa hoàn tất đặt lại. Dữ liệu đã xử lý được lưu bản sao. Hãy chọn Tiếp tục trong Thiết lập hệ thống.');}
 });
 return {prepare,commit};
}
