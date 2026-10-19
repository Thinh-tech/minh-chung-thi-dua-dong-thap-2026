export const AREAS=[{id:'organization',name:'Tổ chức - Kiểm tra'},{id:'movement',name:'Phong trào'},{id:'youth',name:'Mặt trận Thanh thiếu nhi'},{id:'communications',name:'Tuyên giáo - Hành chính'}];
export const criterionIdPattern=/^g[1-5]-(?:\d{3}|[a-f0-9]{32})$/;
export function inferArea(c){
 if(AREAS.some(a=>a.id===c.area))return c.area;
 const section=String(c.section||'').toLocaleLowerCase('vi');
 if(/phụ trách đội|thiếu nhi|thiếu niên, nhi đồng|đồng hành/.test(section))return 'youth';
 if(/tuyên truyền|giáo dục|bảo vệ đảng/.test(section))return 'communications';
 if(/xây dựng đoàn|kiểm tra|giám sát/.test(section))return 'organization';
 return 'movement';
}
export function normalizeCriterion(data){
 if(!data||!/^g[1-5]$/.test(data.group||''))throw Error('Bộ tiêu chí không hợp lệ.');
 const out={group:data.group};
 for(const [key,max] of [['code',30],['section',500],['title',4000],['evaluation',10000],['evidence',10000]]){
  if(typeof data[key]!=='string'||!data[key].trim()||data[key].length>max)throw Error('Vui lòng nhập đầy đủ nội dung, hướng dẫn và yêu cầu minh chứng đúng giới hạn.');
  out[key]=data[key].trim();
 }
 if(!AREAS.some(a=>a.id===data.area))throw Error('Chọn một trong bốn lĩnh vực.');
 if(typeof data.maxScore!=='number'||!Number.isFinite(data.maxScore)||data.maxScore<0||data.maxScore>10000)throw Error('Điểm tối đa phải từ 0 đến 10.000.');
 if(typeof data.active!=='boolean')throw Error('Trạng thái áp dụng không hợp lệ.');
 if(!Number.isSafeInteger(data.revision)||data.revision<0)throw Error('Phiên bản tiêu chí không hợp lệ.');
 return {...out,area:data.area,maxScore:data.maxScore,active:data.active};
}
export function checkCriterionUpdate(actor,old,data,others,records,campaign){
 if(!actor.admin)throw Error('Chỉ admin được quản lý bộ tiêu chí.');
 if(campaign?.resetInProgress)throw Error('Đang đặt lại số liệu. Vui lòng chờ.');
 if(old&&old.group!==data.group)throw Error('Không được chuyển tiêu chí đã có sang bộ khác.');
 if((old?.revision||0)!==data.revision)throw Error('Tiêu chí vừa được cập nhật. Vui lòng mở lại.');
 if(data.active&&others.some(c=>c.id!==data.id&&c.active!==false&&c.code===data.code))throw Error('Mã điều kiện đã có trong bộ tiêu chí này.');
 if(old&&data.maxScore<old.maxScore&&records.some(r=>Math.max(r.selfScore||0,r.score||0)>data.maxScore))throw Error('Không thể giảm điểm tối đa thấp hơn điểm trong hồ sơ hiện có.');
}
export function campaignClosed(campaign,now=Date.now()){
 return campaign.locked===true||Boolean(campaign.deadline&&now>new Date(campaign.deadline+':00+07:00').getTime());
}
export function checkExplanation(actor,criterion,campaign,data,old,{reply=false,now=Date.now()}={}){
 if(campaign.resetInProgress)throw Error('Đang đặt lại số liệu. Vui lòng chờ.');
 if(!Number.isSafeInteger(data.revision)||data.revision<0||data.revision!==(old?.revision||0))throw Error('Giải trình vừa có cập nhật. Vui lòng xem nội dung mới trước khi gửi.');
 if(typeof data.text!=='string'||!data.text.trim()||data.text.length>4000)throw Error('Nội dung kiến nghị, giải trình hoặc phản hồi cần từ 1 đến 4.000 ký tự.');
 if(reply){
  if(!actor.admin||!old)throw Error('Chỉ admin được phản hồi giải trình đã gửi.');
  if(!['answered','resolved'].includes(data.status))throw Error('Trạng thái phản hồi không hợp lệ.');
 }else{
  if(actor.admin||actor.unitId!==data.unitId)throw Error('Chỉ đơn vị sở hữu được gửi giải trình của mình.');
  if(criterion.active===false)throw Error('Tiêu chí đã ngừng áp dụng.');
  if(!campaignClosed(campaign,now))throw Error('Mục giải trình được mở khi khóa minh chứng hoặc hết hạn nộp.');
  if(typeof data.expectedDate!=='string'||(data.expectedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.expectedDate)||(!Number.isFinite(Date.parse(data.expectedDate+'T00:00:00Z'))||new Date(data.expectedDate+'T00:00:00Z').toISOString().slice(0,10)!==data.expectedDate))))throw Error('Ngày dự kiến hoàn thành không hợp lệ.');
 }
}
