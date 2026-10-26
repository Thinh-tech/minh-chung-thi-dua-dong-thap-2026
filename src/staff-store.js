import {collection,doc,onSnapshot,query,where} from 'firebase/firestore';
import {normalizeStaff} from '../firebase/functions/access-model.js';
export function installStaff(s){
 s.staffAccounts={};try{if(s.demo)s.staffAccounts=JSON.parse(localStorage.getItem('dt2026-staff')||'{}')}catch{}
 s.saveStaff=async data=>{if(!s.demo)return s.call('manageStaffAccount',data);if(s.user.role!=='admin')throw Error('Chỉ admin được quản lý cán bộ.');const next=normalizeStaff(data),old=s.staffAccounts[next.id];if(!old&&!data.password)throw Error('Nhập mật khẩu khởi tạo.');if((old?.revision||0)!==data.revision)throw Error('Tài khoản vừa được cập nhật.');s.staffAccounts[next.id]={...next,revision:next.revision+1};localStorage.setItem('dt2026-staff',JSON.stringify(s.staffAccounts));s.onChange();return {ok:true}};
 s.stopScoped=()=>{(s.scopedStops||[]).forEach(stop=>stop());s.scopedStops=[];s.records={};s.explanations={};};
 s.watchScoped=onError=>{s.stopScoped();const user=s.user;if(!user)return;const source=user.role==='staff'?query(collection(s.db,'submissions'),where('area','in',user.areas)):collection(s.db,'submissions');
  const listen=(q,key)=>s.scopedStops.push(onSnapshot(q,{includeMetadataChanges:true},snap=>{s[key]=Object.fromEntries(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));if(key==='records'){s.synced=!snap.metadata.fromCache;if(s.synced)s.lastSync=Date.now()}s.onChange()},error=>{s[key]={};s.onChange();onError(error)}));
  listen(source,'records');listen(user.role==='admin'?collection(s.db,'explanations'):query(collection(s.db,'explanations'),where(user.role==='staff'?'area':'unitId',user.role==='staff'?'in':'==',user.role==='staff'?user.areas:user.id)),'explanations');
 };
 s.watchStaffAccounts=onError=>{if(s.demo||s.user.role!=='admin')return;s.stops.push(onSnapshot(collection(s.db,'staffAccounts'),snap=>{s.staffAccounts=Object.fromEntries(snap.docs.map(d=>[d.id,{...d.data(),id:d.id}]));s.onChange()},onError));};
}
