import {permitted} from '../firebase/functions/access-model.js';

// Use criterion IDs, since the same code can describe different work in each set.
export function reviewChoices(criteria,{actor,group='all',area='all'}){
 return [...criteria].filter(c=>c.active!==false&&permitted(actor,'viewEvidence',c)&&(group==='all'||c.group===group)&&(area==='all'||c.area===area))
  .sort((a,b)=>a.code.localeCompare(b.code,'vi',{numeric:true})||a.id.localeCompare(b.id));
}
export function reviewMatches(record,criterionId='all'){
 return criterionId==='all'||record.criterionId===criterionId;
}
