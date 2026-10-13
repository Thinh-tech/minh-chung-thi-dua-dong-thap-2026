export function checkScore(score,max){if(typeof score!=='number'||!Number.isFinite(score)||score<0||score>max)throw Error(`Điểm phải từ 0 đến ${max}.`)}
export function checkEdit(actor,unitId,old,revision,campaign,now=Date.now()){
 if(campaign.resetInProgress)throw Error('Hệ thống đang đặt lại số liệu. Vui lòng chờ.');
 if(!actor.admin&&actor.unitId!==unitId)throw Error('Bạn chỉ được sửa hồ sơ của đơn vị mình.');
 if(campaign.locked||(campaign.deadline&&now>new Date(campaign.deadline+':00+07:00').getTime()))throw Error('Đợt thi đua đã khóa hoặc quá hạn nộp.');
 if(['submitted','approved'].includes(old?.status))throw Error('Hồ sơ đã gửi. Cần được trả lại trước khi chỉnh sửa.');
 if((old?.revision||0)!==revision)throw Error('Dữ liệu vừa được cập nhật. Hãy mở lại hồ sơ.');
}
export function checkPayload(c,data){
 if(!['draft','submitted'].includes(data.status))throw Error('Trạng thái không hợp lệ.');
 if(typeof data.note!=='string'||data.note.length>10000)throw Error('Kết quả thực hiện tối đa 10.000 ký tự.');
 checkScore(data.selfScore,c.maxScore);
 if(!Array.isArray(data.links)||data.links.length>20)throw Error('Tối đa 20 đường dẫn.');
 for(const l of data.links){if(typeof l!=='string'||l.length>2000)throw Error('Đường dẫn không hợp lệ.');let u;try{u=new URL(l)}catch{throw Error('Đường dẫn không hợp lệ.')}if(!['https:','http:'].includes(u.protocol))throw Error('Chỉ nhận đường dẫn HTTP hoặc HTTPS.');}
 if(!Array.isArray(data.files)||data.files.length>10)throw Error('Tối đa 10 tệp.');
 for(const f of data.files){if(typeof f.name!=='string'||f.name.length>255||typeof f.path!=='string'||!Number.isFinite(f.size)||f.size<0||f.size>10485760)throw Error('Tệp không hợp lệ.');}
 if(data.status==='submitted'){if(!data.note.trim())throw Error('Vui lòng mô tả kết quả thực hiện.');if(!/Không yêu cầu đăng tải minh chứng/i.test(c.evidence)&&!data.links.length&&!data.files.length)throw Error('Điều kiện này cần tệp hoặc đường dẫn minh chứng.');}
}
export function checkReview(actor,old,data,max){if(!actor.admin)throw Error('Chỉ quản trị viên được chấm điểm.');if(!old||old.revision!==data.revision)throw Error('Hồ sơ đã thay đổi. Hãy mở lại.');if(!['approved','returned'].includes(data.status))throw Error('Trạng thái không hợp lệ.');if(data.status==='approved'&&old.status!=='submitted')throw Error('Chỉ chấm hồ sơ chờ duyệt.');if(data.status==='returned'&&!['submitted','approved'].includes(old.status))throw Error('Chỉ trả lại hồ sơ đã gửi hoặc đã duyệt.');if(typeof data.feedback!=='string'||data.feedback.length>4000)throw Error('Nhận xét tối đa 4.000 ký tự.');if(data.status==='returned'&&!data.feedback.trim())throw Error('Cần ghi lý do yêu cầu bổ sung.');if(data.status==='approved')checkScore(data.score,max);}
