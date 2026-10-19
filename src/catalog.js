import {inferArea} from '../firebase/functions/criteria-model.js';
export function makeCatalog(baseSets,overrides={}){
 const all=new Map(baseSets.flatMap(s=>s.items.map(c=>[c.id,{...c,group:s.id,active:true,revision:0,area:inferArea(c)}])));
 for(const [id,value] of Object.entries(overrides||{}))all.set(id,{...(all.get(id)||{}),...value,id,area:inferArea(value)});
 const sets=baseSets.map(s=>{const items=[...all.values()].filter(c=>c.group===s.id&&c.active!==false).sort((a,b)=>a.code.localeCompare(b.code,'vi',{numeric:true})||a.id.localeCompare(b.id));return {...s,items,groups:[...new Set(items.map(c=>c.section))].map(title=>({title}))}});
 return {sets,all};
}
