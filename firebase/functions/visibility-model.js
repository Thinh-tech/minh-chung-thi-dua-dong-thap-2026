import {explanationsOpen} from './campaign-model.js';
export const isObserver=a=>a?.role==='observer';
export function canViewScores(actor,campaign,now=Date.now()){
 return actor?.role!=='unit'||actor.group!=='g1'||explanationsOpen(campaign,now);
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
