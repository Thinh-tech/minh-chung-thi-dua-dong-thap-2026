import {submissionScoreScope,isObserver} from '../firebase/functions/visibility-model.js';
import {collection,doc,onSnapshot,query,where} from 'firebase/firestore';
import {normalizeStaff} from '../firebase/functions/access-model.js';
export function installStaff(s){
 s.staffAccounts={};try{if(s.demo)s.staffAccounts=JSON.parse(localStorage.getItem('dt2026-staff')||'{}')}catch{}
 s.saveStaff=async data=>{if(!s.demo)return s.call('manageStaffAccount',data);if(s.user.role!=='admin')throw Error('Chỉ admin được quản lý cán bộ.');const next=normalizeStaff(data),old=s.staffAccounts[next.id];if(!old&&!data.password)throw Error('Nhập mật khẩu khởi tạo.');if((old?.revision||0)!==data.revision)throw Error('Tài khoản vừa được cập nhật.');s.staffAccounts[next.id]={...next,revision:next.revision+1};localStorage.setItem('dt2026-staff',JSON.stringify(s.staffAccounts));s.onChange();return {ok:true}};
 s.stopScoped=()=>{(s.scopedStops||[]).forEach(stop=>stop());s.scopedStops=[];s.records={};s.explanations={};};
 s.watchScoped=onError=>{
  s.scopeError=onError;
  s.stopScoped();
  const user=s.user;
  if(!user)return;
  const scoreScope=submissionScoreScope(user,s.settings);
  s.scoreSource=scoreScope;
  s.synced=false;

  const mainSource=user.role==='staff'
   ?query(collection(s.db,'submissions'),where('area','in',user.areas))
   :collection(s.db,scoreScope==='all'?'submissions':'submissionViews');
  let baseRecords={},ownRecords={},baseSynced=false,ownSynced=scoreScope!=='own';
  const readRows=snap=>Object.fromEntries(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));
  const publishRecords=()=>{
   s.records={...baseRecords,...ownRecords};
   s.synced=baseSynced&&ownSynced;
   if(s.synced)s.lastSync=Date.now();
   s.onChange();
  };
  s.scopedStops.push(onSnapshot(mainSource,{includeMetadataChanges:true},snap=>{
   baseRecords=readRows(snap);
   baseSynced=!snap.metadata.fromCache;
   publishRecords();
  },error=>{
   baseRecords={};baseSynced=false;publishRecords();onError(error);
  }));
  if(scoreScope==='own'){
   const ownSource=query(collection(s.db,'submissions'),where('unitId','==',user.id));
   s.scopedStops.push(onSnapshot(ownSource,{includeMetadataChanges:true},snap=>{
    ownRecords=readRows(snap);
    ownSynced=!snap.metadata.fromCache;
    publishRecords();
   },error=>{
    ownRecords={};ownSynced=false;publishRecords();onError(error);
   }));
  }
  const explanationSource=user.role==='admin'||isObserver(user)
   ?collection(s.db,'explanations')
   :query(collection(s.db,'explanations'),where(user.role==='staff'?'area':'unitId',user.role==='staff'?'in':'==',user.role==='staff'?user.areas:user.id));
  s.scopedStops.push(onSnapshot(explanationSource,snap=>{
   s.explanations=readRows(snap);s.onChange();
  },error=>{
   s.explanations={};s.onChange();onError(error);
  }));
 };
 s.refreshScoreAccess=()=>{
  if(!s.demo&&s.user&&s.scoreSource!==submissionScoreScope(s.user,s.settings)){
   s.watchScoped(s.scopeError);
  }
 };
 s.watchStaffAccounts=onError=>{if(s.demo||s.user.role!=='admin')return;s.stops.push(onSnapshot(collection(s.db,'staffAccounts'),snap=>{s.staffAccounts=Object.fromEntries(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));s.onChange()},onError));};
}
