import {assertPermission} from './access-model.js';
import {checkReview} from './validation.js';

export function prepareReview(actor,old,data,criterion){
 assertPermission(actor,data.status==='returned'?'returnEvidence':'gradeEvidence',criterion);
 checkReview({...actor,admin:true,regradeAllowed:actor.admin===true},old,data,criterion.maxScore);
 const regrade=old.status==='approved'&&data.status==='approved';
 return {
  update:{status:data.status,score:data.status==='approved'?data.score:null,feedback:data.feedback.trim(),revision:old.revision+1,reviewedBy:actor.uid},
  audit:{action:regrade?`Chấm lại điểm (${old.score} → ${data.score})`:data.status==='approved'?'Chấm điểm':'Yêu cầu bổ sung',unitId:old.unitId,criterionId:old.criterionId,previousScore:old.score??null,score:data.status==='approved'?data.score:null,previousFeedback:old.feedback||'',feedback:data.feedback.trim(),previousRevision:old.revision,revision:old.revision+1,regrade}
 };
}
