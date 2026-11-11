import {explanationsOpen} from './campaign-model.js';
export const isObserver=a=>a?.role==='observer';
export function canViewScores(actor,campaign,now=Date.now()){
 return actor?.role!=='unit'||explanationsOpen(campaign,now);
}
export function canViewRankings(actor,campaign,now=Date.now()){
 return actor?.role==='admin'||(campaign.rankingsEnabled===true&&canViewScores(actor,campaign,now));
}
export function submissionScoreScope(actor,campaign,now=Date.now()){
 if(!canViewScores(actor,campaign,now))return 'hidden';
 if(actor?.role==='unit'&&!canViewRankings(actor,campaign,now))return 'own';
 return 'all';
}
export function canViewUnitScore(actor,campaign,unitId,now=Date.now()){
 const scope=submissionScoreScope(actor,campaign,now);
 return scope==='all'||(scope==='own'&&unitId!=null&&unitId===(actor.id??actor.unitId));
}
export function publicSubmission(row){
 const keys=['unitId','criterionId','criterionRevision','area','note','selfScore','links','files','status','revision','updatedAt','updatedBy'];
 const view=Object.fromEntries(keys.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));
 return {...view,feedback:row.status==='returned'?(row.feedback||''):''};
}
export function assertWritable(actor){if(isObserver(actor))throw Error('Chế độ quan sát chỉ được xem dữ liệu.');}
// Commit the safe view in the same transaction/batch as its authoritative source.
export function writeSubmissionView(db,writer,id,row){
 const target=db.doc('submissionViews/'+id);
 if(row)writer.set(target,publicSubmission(row));else writer.delete(target);
}
