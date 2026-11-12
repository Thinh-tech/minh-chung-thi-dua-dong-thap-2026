import {auditMillis,AUDIT_WINDOW_MS} from './audit-store.js';

const vnTime=new Intl.DateTimeFormat('sv-SE',{
 timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'medium'
});

export function staffAuditRows(rows,accounts,staffId=''){
 const byUid=new Map();
 for(const [id,account] of Object.entries(accounts)){
  byUid.set(account.uid||id,id);
  byUid.set('staff_'+id,id);
 }
 return rows.flatMap(row=>{
  const id=byUid.get(row.actorUid)||/^staff_(cb-[a-z0-9][a-z0-9_-]{1,35})$/.exec(row.actorUid||'')?.[1];
  if(!id||(staffId&&id!==staffId))return [];
  const at=auditMillis(row.at);
  if(!Number.isFinite(at))return [];
  return [{
   time:vnTime.format(at),staffId:id,actor:row.actor||accounts[id]?.name||id,
   action:row.action||'',unit:row.unit||'',unitId:row.unitId||'',
   code:row.code||'',criterionId:row.criterionId||'',
   previousScore:Number.isFinite(row.previousScore)?row.previousScore:null,
   score:Number.isFinite(row.score)?row.score:null,
   previousFeedback:row.previousFeedback||'',feedback:row.feedback||''
  }];
 });
}

export async function writeStaffAuditWorkbook(rows,now=Date.now()){
 const ExcelJS=(await import('exceljs')).default;
 const workbook=new ExcelJS.Workbook();
 workbook.creator='Tỉnh Đoàn Đồng Tháp';
 workbook.title='Lịch sử thao tác cán bộ';
 workbook.subject=`30 ngày, từ ${vnTime.format(now-AUDIT_WINDOW_MS)} đến ${vnTime.format(now)} (giờ Việt Nam)`;
 const columns=[
  ['time','Thời gian (giờ Việt Nam)',26],['staffId','Tài khoản cán bộ',23],
  ['actor','Tên cán bộ tại thời điểm thao tác',36],['action','Thao tác',42],
  ['unit','Đơn vị / đối tượng',34],['unitId','Mã đơn vị',16],
  ['code','Mã điều kiện',18],['criterionId','ID điều kiện',28]
 ];
 const writeSheet=(name,fields,data)=>{
  const sheet=workbook.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
  sheet.columns=fields.map(([key,header,width])=>({key,header,width}));
  sheet.addRows(data);
  sheet.autoFilter={from:'A1',to:{row:Math.max(sheet.rowCount,2),column:fields.length}};
  const header=sheet.getRow(1);
  header.height=32;
  header.font={bold:true,color:{argb:'FFFFFFFF'}};
  header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0066CC'}};
  header.alignment={vertical:'middle',wrapText:true};
  sheet.eachRow((row,index)=>{if(index>1)row.alignment={vertical:'top',wrapText:true};});
 };
 writeSheet('Lịch sử thao tác',columns,rows);
 writeSheet('Lịch sử điểm',[
  ...columns,['previousScore','Điểm trước',15],['score','Điểm sau',15],
  ['previousFeedback','Phản hồi trước',55],['feedback','Phản hồi sau',55]
 ],rows.filter(row=>row.previousScore!==null||row.score!==null));
 return workbook.xlsx.writeBuffer();
}
