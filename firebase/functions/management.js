import {randomUUID} from 'node:crypto';
import {FieldValue} from 'firebase-admin/firestore';
import {normalizeCriterion,checkCriterionUpdate,checkExplanation,criterionIdPattern} from './criteria-model.js';
export function managementFunctions({db,call,context,log}){
 const updateCriterion=call(async(data,a)=>{
  const normalized=normalizeCriterion(data),id=data.id||normalized.group+'-'+randomUUID().replaceAll('-','');
  if(!criterionIdPattern.test(id)||!id.startsWith(normalized.group+'-'))throw Error('Mã tiêu chí không hợp lệ.');
  const ref=db.doc('criteria/'+id);
  await db.runTransaction(async tx=>{
   const [old,others,records,campaign]=await Promise.all([tx.get(ref),tx.get(db.collection('criteria').where('group','==',normalized.group)),tx.get(db.collection('submissions').where('criterionId','==',id)),tx.get(db.doc('settings/campaign'))]);
   if(data.id&&!old.exists)throw Error('Không tìm thấy tiêu chí cần sửa.');
   checkCriterionUpdate(a,old.data(),{...normalized,id,revision:data.revision},others.docs.map(d=>({...d.data(),id:d.id})),records.docs.map(d=>d.data()),campaign.data());
   const next={...normalized,id,revision:(old.data()?.revision||0)+1,updatedBy:a.uid,updatedAt:FieldValue.serverTimestamp()};
   tx.set(ref,next,{merge:true});
   tx.create(ref.collection('history').doc(),{before:old.data()||null,after:next,actor:a.name,at:FieldValue.serverTimestamp()});
   log(tx,a,!old.exists?'Thêm tiêu chí':normalized.active===false?'Ngừng áp dụng tiêu chí':old.data().active===false?'Khôi phục tiêu chí':'Chỉnh sửa tiêu chí',normalized.group,normalized.code);
  });return {ok:true,id};
 },true);
 const post=(reply)=>call(async(data,a)=>{
  const {unit,ref:submission}=await context(data),ref=db.doc('explanations/'+data.unitId+'__'+data.criterionId);
  await db.runTransaction(async tx=>{
   const [old,campaign,criterion]=await Promise.all([tx.get(ref),tx.get(db.doc('settings/campaign')),tx.get(db.doc('criteria/'+data.criterionId))]);
   checkExplanation(a,criterion.data(),campaign.data()||{},data,old.data(),{reply});
   const status=reply?data.status:'pending',at=FieldValue.serverTimestamp(),revision=(old.data()?.revision||0)+1;
   tx.set(ref,{unitId:data.unitId,criterionId:data.criterionId,status,revision,lastText:data.text.trim(),updatedAt:at,updatedBy:a.uid,criterionCode:criterion.data().code,criterionTitle:criterion.data().title,...(!old.exists?{createdAt:at}:{}),...(!reply?{expectedDate:data.expectedDate,reason:data.text.trim()}:{}),...(reply?{respondedAt:at,lastReply:data.text.trim()}:{})},{merge:true});
   tx.create(ref.collection('messages').doc(),{text:data.text.trim(),role:reply?'admin':'unit',actor:a.name,at,revision,...(!reply?{expectedDate:data.expectedDate}:{status})});
   tx.set(db.doc('inboxes/'+(reply?data.unitId:'admin')+'/items/explanation-'+data.unitId+'-'+data.criterionId),{title:(reply?'Phản hồi giải trình: ':'Kiến nghị giải trình: ')+criterion.data().code,kind:'evidence',unitId:data.unitId,criterionId:data.criterionId,read:false,at});
   log(tx,a,reply?'Phản hồi giải trình':'Gửi kiến nghị, giải trình',unit,criterion.data().code);
  });return {ok:true};
 },reply);
 return {updateCriterion,sendExplanation:post(false),respondExplanation:post(true)};
}
