import {inferArea} from '../firebase/functions/criteria-model.js';

export function matchesDownloadCriterion(criterion,filters={}){
 if(!criterion)return false;
 const {group='all',area='all',criterionId='all'}=filters;
 return (group==='all'||criterion.group===group)
  &&(area==='all'||inferArea(criterion)===area)
  &&(criterionId==='all'||criterion.id===criterionId);
}

export function downloadCriteria(sets,filters={}){
 return sets.flatMap(set=>set.items.map(criterion=>({...criterion,group:set.id})))
  .filter(criterion=>matchesDownloadCriterion(criterion,filters))
  .sort((a,b)=>a.group.localeCompare(b.group)||a.code.localeCompare(b.code,'vi',{numeric:true}));
}

export function downloadSets(sets,filters={}){
 return sets.map(set=>({...set,items:set.items.filter(criterion=>matchesDownloadCriterion({...criterion,group:set.id},filters))}));
}

export function downloadRecords(records,unitIds,sets,filters={}){
 const units=new Set(unitIds),criteria=new Set(downloadCriteria(sets,filters).map(criterion=>criterion.id));
 return Object.values(records).filter(record=>units.has(record.unitId)&&criteria.has(record.criterionId));
}
