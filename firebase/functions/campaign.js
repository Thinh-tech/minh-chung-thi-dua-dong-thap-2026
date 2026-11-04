import {normalizeCampaign,assertCompetitionExport} from './campaign-model.js';
export function campaignFunctions({db,call,log}){
 return {
  setCampaign:call(async(data,a)=>{await db.runTransaction(async tx=>{const ref=db.doc('settings/campaign'),current=(await tx.get(ref)).data()||{};if(current.resetInProgress)throw Error('Đang đặt lại số liệu. Vui lòng chờ.');const next=normalizeCampaign(data,current);tx.set(ref,next,{merge:true});log(tx,a,'Cập nhật đợt thi đua / thời gian giải trình','Toàn tỉnh','')});return {ok:true}},true),
  authorizeCompetitionExport:call(async(data,a)=>{assertCompetitionExport(a);await db.runTransaction(async tx=>log(tx,a,'Xuất báo cáo thi đua','Toàn tỉnh',''));return {ok:true}},true)
 };
}
