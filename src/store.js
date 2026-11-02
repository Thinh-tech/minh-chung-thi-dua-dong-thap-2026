import {prepareReview} from '../firebase/functions/review-model.js';
import {installStaff} from './staff-store.js';
import {assertPermission,permitted} from '../firebase/functions/access-model.js';
import {normalizeCriterion,checkCriterionUpdate,checkExplanation,inferArea} from '../firebase/functions/criteria-model.js';
import {installSuite} from './suite-store.js';
import {validateUpload} from './files.js';
import {changeCurrentPassword} from './password.js';
import {initializeApp} from 'firebase/app';
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged,reauthenticateWithCredential,EmailAuthProvider,updatePassword} from 'firebase/auth';
import {getFirestore,collection,onSnapshot,query,where,orderBy,limit,getDocs,getDoc,doc} from 'firebase/firestore';
import {getFunctions,httpsCallable} from 'firebase/functions';
import {getStorage,ref,uploadBytes,getBlob} from 'firebase/storage';
export class Store{
 constructor(config,units,onChange){this.config=config;this.units=units;this.onChange=onChange;this.records={};this.criteria={};this.criterionChanges={};this.explanations={};this.explanationMessages={};this.messages=[];this.audits=[];this.stops=[];this.demo=!config.configured;this.settings={deadline:'',locked:false};if(!this.demo){const app=initializeApp(config.firebaseConfig);this.auth=getAuth(app);this.db=getFirestore(app);this.functions=getFunctions(app,config.region||'asia-southeast1');this.storage=getStorage(app)}else this.loadDemo();installSuite(this);installStaff(this);}
 loadDemo(){try{const s=JSON.parse(localStorage.getItem('dt2026-demo')||'{}');this.records=s.records||{};this.criteria=s.criteria||{};this.criterionChanges=s.criterionChanges||{};this.explanations=s.explanations||{};this.explanationMessages=s.explanationMessages||{};this.messages=(s.messages||[]).filter(m=>m.expiresAt>Date.now());this.audits=s.audits||[];this.settings=s.settings||this.settings}catch{this.records={};this.messages=[];} }
 persist(){localStorage.setItem('dt2026-demo',JSON.stringify({records:this.records,criteria:this.criteria,criterionChanges:this.criterionChanges,explanations:this.explanations,explanationMessages:this.explanationMessages,messages:this.messages,audits:this.audits,settings:this.settings}));this.onChange();}
 async login(id,password){if(this.demo)throw Error('Chưa kết nối Firebase. Hãy dùng nút trải nghiệm.');await signInWithEmailAndPassword(this.auth,id+'@minhchung.invalid',password);}
 stopChat(){this.chatStop?.();this.chatStop=null;this.chatCallback=null;this.chatOther=null;}
 async logout(){this.stopScoped();this.stopChat();this.stopExplanation();this.stops.splice(0).forEach(f=>f());if(!this.demo)await signOut(this.auth);this.user=null;this.suiteUser=null;this.records={};this.archives=[];}
 async observe(onUser,onError){if(this.demo)return;onAuthStateChanged(this.auth,async authUser=>{
  this.stopScoped();this.stopChat();this.stopExplanation();this.suiteUser=null;this.criteria={};this.explanations={};this.stops.splice(0).forEach(f=>f());this.records={};this.audits=[];this.archives=[];this.staffAccounts={};
  if(!authUser){this.user=null;onUser(null);return}
  try{
   const token=await authUser.getIdTokenResult(true),profile=(await getDoc(doc(this.db,'users',authUser.uid))).data();
   if(!profile?.active||profile.unitId!==token.claims.unitId)throw Error('Tài khoản chưa được cấp quyền.');
   const role=profile.role==='staff'&&token.claims.staff===true?'staff':profile.role==='admin'&&token.claims.admin===true?'admin':profile.role==='unit'?'unit':null;
   const base=role==='staff'?{id:profile.unitId,name:profile.name}:this.units.find(x=>x.id===profile.unitId);
   if(!base||!role)throw Error('Tài khoản chưa được phân quyền.');
   this.user={...base,...(role==='staff'?{areas:profile.areas,permissions:profile.permissions,active:profile.active}:{}),uid:authUser.uid,role};this.synced=false;onUser(this.user);this.watchScoped(onError);this.watchStaffAccounts(onError);
   this.stops.push(onSnapshot(doc(this.db,'users',authUser.uid),snap=>{const p=snap.data();if(!p?.active){this.logout();onUser(null);return}if(this.user?.role==='staff'){const changed=JSON.stringify([this.user.areas,this.user.permissions])!==JSON.stringify([p.areas,p.permissions]);this.user={...this.user,name:p.name,areas:p.areas,permissions:p.permissions};if(changed)this.watchScoped(onError);this.onChange()}},onError));
   this.stops.push(onSnapshot(collection(this.db,'criteria'),snap=>{this.criteria=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));this.onChange()},onError));
   this.stops.push(onSnapshot(collection(this.db,'settings'),snap=>{this.settings=snap.docs.find(d=>d.id==='campaign')?.data()||this.settings;this.onChange()},onError));
   if(role==='admin'){
    this.stops.push(onSnapshot(query(collection(this.db,'audits'),orderBy('at','desc'),limit(100)),snap=>{this.audits=snap.docs.map(d=>d.data());this.onChange()},onError));
    this.stops.push(onSnapshot(query(collection(this.db,'resetArchives'),orderBy('createdAt','desc'),limit(10)),snap=>{this.archives=snap.docs.map(d=>({id:d.id,...d.data()}));this.onChange()},onError));
   }
  }catch(error){onError(error);await signOut(this.auth)}
 });}

 async call(name,data){return (await httpsCallable(this.functions,name,{timeout:name==='commitDataReset'?540000:70000})(data)).data}
 async save(unit,c,data,status){if(!Number.isFinite(data.selfScore))throw Error('Vui lòng nhập điểm tự chấm, có thể nhập 0.');const key=unit.id+'__'+c.id;const prev=this.records[key];if(c.active===false)throw Error('Tiêu chí đã ngừng áp dụng.');if(!this.demo)return this.call('saveSubmission',{unitId:unit.id,criterionId:c.id,...data,status,criterionRevision:c.revision||0,revision:data.revision??prev?.revision??0});if(this.settings.locked||(this.settings.deadline&&Date.now()>new Date(this.settings.deadline+':00+07:00').getTime()))throw Error('Đợt thi đua đã khóa hoặc quá hạn nộp.');if(this.user.role!=='admin'&&this.user.id!==unit.id)throw Error('Bạn chỉ được sửa minh chứng của đơn vị mình.');if(prev&&['submitted','approved'].includes(prev.status))throw Error('Minh chứng đã gửi, cần quản trị viên trả lại để chỉnh sửa.');if((data.revision??0)!==(prev?.revision??0))throw Error('Dữ liệu vừa được cập nhật. Hãy mở lại minh chứng.');this.records[key]={...data,criterionRevision:c.revision||0,area:c.area,unitId:unit.id,criterionId:c.id,status,updatedAt:Date.now(),revision:(prev?.revision||0)+1,score:null,feedback:prev?.feedback||''};this.audit(status==='submitted'?'Gửi minh chứng':'Lưu bản nháp',unit.name,c.code);this.persist();}
 audit(action,unit,code){this.audits.unshift({action,unit,code,actor:this.user.name,at:Date.now()});this.audits=this.audits.slice(0,100)}
 async review(unit,c,score,feedback,status,revision){if(!this.demo)return this.call('reviewSubmission',{unitId:unit.id,criterionId:c.id,score,feedback,status,revision});const key=unit.id+'__'+c.id,p=this.records[key],review=prepareReview({...this.user,uid:this.user.id,admin:this.user.role==='admin'},p,{score,feedback,status,revision},c);this.records[key]={...p,...review.update,updatedAt:Date.now()};this.audit(review.audit.action,unit.name,c.code);Object.assign(this.audits[0],review.audit);this.persist();}
 async upload(unit,c,file){validateUpload(file);if(this.demo){if(file.size>1024*1024)throw Error('Bản trải nghiệm chỉ nhận tệp tối đa 1 MB. Khi kết nối Firebase: ảnh 5 MB, tài liệu 10 MB.');const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});return {name:file.name,size:file.size,data};}const path=`evidence/${unit.id}/${c.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;await uploadBytes(ref(this.storage,path),file,{contentType:file.type});return {name:file.name,size:file.size,path};}
 async download(file){if(this.demo)return fetch(file.data).then(r=>r.blob());return getBlob(ref(this.storage,file.path));}
 watchChat(other,onData,onError){if(this.chatOther===other&&this.chatStop)return;this.stopChat();this.chatOther=other;const room=[this.user.id,other].sort().join('__');if(this.demo){onData(this.messages.filter(m=>m.room===room&&m.expiresAt>Date.now()));this.chatCallback=onData;return}this.chatStop=onSnapshot(query(collection(this.db,'messages'),where('room','==',room),where('participants','array-contains',this.user.id),where('expiresAt','>',new Date()),orderBy('expiresAt','desc'),limit(200)),s=>onData(s.docs.map(d=>{const x=d.data();return {...x,createdAt:x.createdAt.toMillis(),expiresAt:x.expiresAt.toMillis()}}).reverse()),onError);}
 async send(other,text){if(!this.demo)return this.call('sendMessage',{to:other,text});this.messages.push({room:[this.user.id,other].sort().join('__'),from:this.user.id,to:other,text,createdAt:Date.now(),expiresAt:Date.now()+7*86400000});this.messages=this.messages.filter(m=>m.expiresAt>Date.now());this.persist();this.chatCallback?.(this.messages.filter(m=>m.room===[this.user.id,other].sort().join('__')));}
 async updateSettings(settings){if(!this.demo)return this.call('setCampaign',settings);if(this.user.role!=='admin')throw Error('Không có quyền.');this.settings={...this.settings,...settings};this.audit('Cập nhật đợt thi đua','Toàn tỉnh','');this.persist();}
 async resetPassword(unitId,password){if(this.demo)throw Error('Đổi mật khẩu thật cần kết nối Firebase.');return this.call('resetUnitPassword',{unitId,password});}
 async changePassword(currentPassword,newPassword,confirmation){if(this.demo)throw Error('Bản trải nghiệm không đổi mật khẩu thật. Vui lòng dùng tài khoản đã đăng nhập Firebase.');return changeCurrentPassword(this.auth,currentPassword,newPassword,confirmation,{reauthenticateWithCredential,EmailAuthProvider,updatePassword});}
 async confirmIdentity(password){if(this.demo)return;if(!password)throw Error('Nhập mật khẩu quản trị viên.');await reauthenticateWithCredential(this.auth.currentUser,EmailAuthProvider.credential(this.auth.currentUser.email,password));await this.auth.currentUser.getIdToken(true);}
 async prepareReset(scope){if(!this.demo)return this.call('prepareDataReset',{scope});if(this.user.role!=='admin')throw Error('Chỉ quản trị viên được đặt lại.');const rows=Object.values(this.records).filter(r=>scope==='all'||r.unitId===scope);return {requestId:'demo',scope,scopeName:scope==='all'?'Toàn tỉnh':this.units.find(u=>u.id===scope)?.name,counts:{total:rows.length,approved:rows.filter(r=>r.status==='approved').length,submitted:rows.filter(r=>r.status==='submitted').length,draft:rows.filter(r=>r.status==='draft').length,returned:rows.filter(r=>r.status==='returned').length}};}
 async commitReset(preview,phrase){if(!this.demo)return this.call('commitDataReset',{requestId:preview.requestId,phrase});if(this.user.role!=='admin'||phrase!=='DAT LAI 2026')throw Error('Xác nhận đặt lại không hợp lệ.');const archive=Object.fromEntries(Object.entries(this.records).filter(([,r])=>preview.scope==='all'||r.unitId===preview.scope));this.demoArchive=archive;for(const key of Object.keys(archive))delete this.records[key];this.audit('Đặt lại '+Object.keys(archive).length+' hồ sơ',preview.scopeName,'');this.persist();return {ok:true,count:Object.keys(archive).length};}
 async downloadArchive(id){if(this.demo)return this.demoArchive||{};const result=await getDocs(collection(this.db,'resetArchives',id,'records'));return Object.fromEntries(result.docs.map(d=>[d.id,d.data()]));}
 async updateCriterion(data,baseCriteria){
  if(!this.demo)return this.call('updateCriterion',data);
  const normalized=normalizeCriterion(data),id=data.id||data.group+'-'+crypto.randomUUID().replaceAll('-',''),old=this.criteria[id]||baseCriteria.get(id);
  checkCriterionUpdate({...this.user,admin:this.user.role==='admin'},old,{...data,id},[...baseCriteria.values()],Object.values(this.records).filter(r=>r.criterionId===id),this.settings);
  const next={...old,...normalized,id,revision:(old?.revision||0)+1};this.criteria[id]=next;for(const record of Object.values(this.records))if(record.criterionId===id)record.area=next.area;for(const thread of Object.values(this.explanations))if(thread.criterionId===id)thread.area=next.area;(this.criterionChanges[id]??=[]).unshift({before:old||null,after:next,actor:this.user.name,at:Date.now()});this.audit('Cập nhật bộ tiêu chí',data.group,data.code);this.persist();return {id};
 }
 async criterionHistory(id){if(this.demo)return this.criterionChanges[id]||[];const result=await getDocs(query(collection(this.db,'criteria',id,'history'),orderBy('at','desc'),limit(20)));return result.docs.map(d=>d.data());}
 stopExplanation(){this.explanationStop?.();this.explanationStop=null;this.explanationCallback=null;}
 watchExplanation(unitId,criterionId,onData,onError){
  this.stopExplanation();const id=unitId+'__'+criterionId;
  if(this.demo){this.explanationCallback=()=>onData(this.explanationMessages[id]||[]);this.explanationCallback();return}
  this.explanationStop=onSnapshot(query(collection(this.db,'explanations',id,'messages'),orderBy('at','desc'),limit(100)),s=>onData(s.docs.map(d=>d.data()).reverse()),onError);
 }
 async postExplanation(data,criterion,reply=false){
  if(!this.demo)return this.call(reply?'respondExplanation':'sendExplanation',data);
  const id=data.unitId+'__'+data.criterionId,old=this.explanations[id],actor={...this.user,admin:this.user.role==='admin',unitId:this.user.id};
  checkExplanation(actor,criterion,this.settings,data,old,{reply});
  const revision=(old?.revision||0)+1,at=Date.now(),status=reply?data.status:'pending';
  this.explanations[id]={...old,id,unitId:data.unitId,criterionId:data.criterionId,area:criterion.area,criterionCode:criterion.code,criterionTitle:criterion.title,revision,status,lastText:data.text.trim(),reason:reply?(old?.reason||old?.lastText||''):data.text.trim(),lastReply:reply?data.text.trim():(old?.lastReply||''),updatedAt:at,expectedDate:reply?(old?.expectedDate||''):data.expectedDate};
  (this.explanationMessages[id]??=[]).push({text:data.text.trim(),role:reply?'admin':'unit',actor:this.user.name,at,revision,expectedDate:data.expectedDate||'',status});
  this.audit(reply?'Phản hồi giải trình':'Gửi kiến nghị, giải trình',this.units.find(u=>u.id===data.unitId)?.name,criterion.code);this.persist();this.explanationCallback?.();
 }

}
