export const STAFF_PERMISSIONS=[
 ['viewEvidence','Xem minh chứng và giải trình'],['gradeEvidence','Duyệt và chấm điểm'],['returnEvidence','Yêu cầu bổ sung'],['manageCriteria','Thêm, sửa, ngừng áp dụng tiêu chí'],['replyExplanation','Phản hồi giải trình'],['exportData','Xuất Excel trong lĩnh vực phụ trách']
];
export const AREA_IDS=['organization','movement','youth','communications'];
export const isStaff=a=>a?.role==='staff' || a?.staff===true;
export const isAdmin=a=>a?.admin===true || (a?.role==='admin'&&a.admin!==false);
export function permitted(a,permission,criterion){
 if(isAdmin(a))return true;
 return isStaff(a)&&a.active!==false&&a.permissions?.includes(permission)===true&&(!criterion||a.areas?.includes(criterion.area)===true);
}
export function assertPermission(a,permission,criterion){if(!permitted(a,permission,criterion))throw Error('Bạn chưa được cấp quyền thao tác trong lĩnh vực này.');}
export function normalizeStaff(d){
 const id=String(d.id||'').trim().toLowerCase();if(!/^cb-[a-z0-9][a-z0-9_-]{1,35}$/.test(id))throw Error('Tên đăng nhập dạng cb-ten, dài 5–39 ký tự; dùng chữ thường, số, gạch ngang hoặc gạch dưới.');
 if(typeof d.name!=='string'||!d.name.trim()||d.name.length>150)throw Error('Nhập họ tên cán bộ (tối đa 150 ký tự).');
 if(!Array.isArray(d.areas)||!d.areas.length||d.areas.some(x=>!AREA_IDS.includes(x)))throw Error('Chọn ít nhất một lĩnh vực hợp lệ.');
 if(!Array.isArray(d.permissions)||d.permissions.some(x=>!STAFF_PERMISSIONS.some(([id])=>id===x)))throw Error('Quyền thao tác không hợp lệ.');
 if(!d.permissions.includes('viewEvidence'))throw Error('Cần cấp quyền xem minh chứng cho tài khoản cán bộ.');
 if(typeof d.active!=='boolean'||!Number.isSafeInteger(d.revision)||d.revision<0)throw Error('Thông tin tài khoản không hợp lệ.');
 if(d.password!==undefined&&(typeof d.password!=='string'||d.password.length<10||d.password.length>128))throw Error('Mật khẩu từ 10 đến 128 ký tự.');
 return {id,name:d.name.trim(),role:'staff',active:d.active,areas:[...new Set(d.areas)],permissions:[...new Set(d.permissions)],revision:d.revision};
}
