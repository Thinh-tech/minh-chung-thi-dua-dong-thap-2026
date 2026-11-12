import {collection,onSnapshot,query,where,orderBy,limit,getDocsFromServer} from 'firebase/firestore';
export const AUDIT_DAYS=30,AUDIT_PAGE_SIZE=100,AUDIT_WINDOW_MS=AUDIT_DAYS*86400000;
export function auditMillis(value){return value?.toMillis?value.toMillis():value instanceof Date?value.getTime():typeof value==='number'?value:Date.parse(value);}
export function recentAudits(rows,now=Date.now()){
 const cutoff=now-AUDIT_WINDOW_MS;
 return rows.filter(row=>{const at=auditMillis(row.at);return Number.isFinite(at)&&at>=cutoff&&at<=now}).sort((a,b)=>auditMillis(b.at)-auditMillis(a.at));
}
export function installAudits(s,api={collection,onSnapshot,query,where,orderBy,limit,getDocsFromServer}){
 s.auditLimit=AUDIT_PAGE_SIZE;s.auditHasMore=false;s.auditLoading=false;s.auditEpoch=0;
 s.auditRows=()=>recentAudits(s.audits).slice(0,s.auditLimit);
 s.hasMoreAuditRows=()=>s.demo?recentAudits(s.audits).length>s.auditLimit:s.auditHasMore;
 s.stopAudits=()=>{s.auditEpoch++;s.auditStop?.();s.auditStop=null;s.auditLoading=false;s.auditHasMore=false;s.auditLimit=AUDIT_PAGE_SIZE;s.audits=[];};
 s.watchAudits=(onError,reset=true)=>{
  if(s.user?.role!=='admin')throw Error('Chỉ admin được xem nhật ký hoạt động.');
  if(reset)s.stopAudits();else{s.auditEpoch++;s.auditStop?.();}
  s.auditOnError=onError;
  if(s.demo){s.auditHasMore=recentAudits(s.audits).length>s.auditLimit;s.onChange();return;}
  const epoch=s.auditEpoch;s.auditLoading=true;s.onChange();
  const q=api.query(api.collection(s.db,'audits'),api.where('at','>=',new Date(Date.now()-AUDIT_WINDOW_MS)),api.orderBy('at','desc'),api.limit(s.auditLimit+1));
  s.auditStop=api.onSnapshot(q,snap=>{
   if(epoch!==s.auditEpoch||s.user?.role!=='admin')return;
   s.audits=snap.docs.slice(0,s.auditLimit).map(d=>({...d.data(),id:d.id}));s.auditHasMore=snap.docs.length>s.auditLimit;s.auditLoading=false;s.onChange();
  },error=>{if(epoch!==s.auditEpoch)return;s.auditLoading=false;s.onChange();onError?.(error)});
 };
 s.readAuditReport=async(now=Date.now())=>{
  const actor=s.user;
  if(actor?.role!=='admin')throw Error('Chỉ admin được xuất nhật ký hoạt động.');
  if(s.demo)return {rows:recentAudits(s.audits,now),accounts:s.staffAccounts};
  const logs=api.query(api.collection(s.db,'audits'),
   api.where('at','>=',new Date(now-AUDIT_WINDOW_MS)),
   api.where('at','<=',new Date(now)),api.orderBy('at','desc'));
  const [snapshot,profiles]=await Promise.all([
   api.getDocsFromServer(logs),
   api.getDocsFromServer(api.collection(s.db,'staffAccounts'))
  ]);
  if(s.user!==actor)throw Error('Phiên admin đã thay đổi.');
  return {
   rows:snapshot.docs.map(doc=>doc.data()),
   accounts:Object.fromEntries(profiles.docs.map(doc=>[doc.id,doc.data()]))
  };
 };
 s.loadMoreAudits=()=>{
  if(s.user?.role!=='admin')throw Error('Chỉ admin được xem nhật ký hoạt động.');
  if(s.auditLoading)return;
  if(s.demo){s.auditLimit+=AUDIT_PAGE_SIZE;s.auditHasMore=recentAudits(s.audits).length>s.auditLimit;s.onChange();return;}
  if(!s.auditHasMore)return;s.auditLimit+=AUDIT_PAGE_SIZE;s.watchAudits(s.auditOnError,false);
 };
}
