import {isAdmin} from './access-model.js';
export function assertCompetitionExport(actor){if(!isAdmin(actor))throw Error('Chỉ admin được xuất báo cáo thi đua.');}
function validTime(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+':00Z'))&&new Date(value+':00Z').toISOString().slice(0,16)===value;}
const vnTime=value=>Date.parse(value+':00+07:00');
export function explanationWindow(campaign,now=Date.now()){
 if(campaign.explanationsEnabled!==true)return 'disabled';
 const start=campaign.explanationStart,end=campaign.explanationEnd;
 if(!validTime(start)||!validTime(end)||vnTime(start)>=vnTime(end))return 'disabled';
 if(now<vnTime(start))return 'scheduled';
 return now<vnTime(end)?'open':'closed';
}
export function explanationsOpen(campaign,now=Date.now()){return !campaign.resetInProgress&&explanationWindow(campaign,now)==='open';}
export function normalizeCampaign(data,previous={}){
 if(typeof data.locked!=='boolean'||typeof data.deadline!=='string'||(data.deadline&&!validTime(data.deadline)))throw Error('Thiết lập hoặc hạn nộp không hợp lệ.');
 const enabled=data.explanationsEnabled??previous.explanationsEnabled??false,start=data.explanationStart??previous.explanationStart??'',end=data.explanationEnd??previous.explanationEnd??'';
 if(typeof enabled!=='boolean'||typeof start!=='string'||typeof end!=='string'||(start&&!validTime(start))||(end&&!validTime(end)))throw Error('Thời gian giải trình không hợp lệ.');
 if(enabled&&(!start||!end))throw Error('Chọn đủ thời gian bắt đầu và kết thúc giải trình.');
 if(start&&end&&vnTime(start)>=vnTime(end))throw Error('Kết thúc giải trình phải sau thời gian bắt đầu.');
 return {locked:data.locked,deadline:data.deadline,explanationsEnabled:enabled,explanationStart:start,explanationEnd:end};
}
