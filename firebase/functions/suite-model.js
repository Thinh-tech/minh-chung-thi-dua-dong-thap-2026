export const publicationKinds=['announcement','report','award','template'];
export function text(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('Nội dung không hợp lệ hoặc quá dài.');return value.trim()}
export function definition(data,unitIds){
 if(!publicationKinds.includes(data.kind))throw Error('Loại nội dung không hợp lệ.');
 const title=text(data.title,250,true),body=text(data.body||'',12000),deadline=data.deadline||'';
 if(deadline&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(deadline)||!Number.isFinite(+new Date(deadline+':00+07:00'))))throw Error('Hạn nộp không hợp lệ.');
 if(!Array.isArray(data.recipients)||!data.recipients.length||data.recipients.some(id=>!unitIds.includes(id)))throw Error('Chọn ít nhất một đơn vị nhận.');
 const fields=data.kind==='report'?data.fields||[]:[];
 if(fields.length>80||fields.some((f,i)=>f.id!=='f'+i||!['number','text'].includes(f.type)||!text(f.label,200,true)||typeof f.required!=='boolean'))throw Error('Danh mục chỉ tiêu không hợp lệ.');
 if(data.kind==='report'&&!fields.length)throw Error('Thêm ít nhất một chỉ tiêu báo cáo.');
 return {kind:data.kind,title,body,deadline,allowLate:data.allowLate!==false,recipients:[...new Set(data.recipients)],fields:fields.map(f=>({id:f.id,label:f.label.trim(),type:f.type,required:f.required,unit:text(f.unit||'',40)})),period:text(data.period||'',100),category:text(data.category||'',100)};
}
export function response(data,p,now=Date.now()){
 if(!['report','award'].includes(p.kind)||p.archived||p.closed)throw Error('Đợt này đã đóng.');
 const late=Boolean(p.deadline&&now>+new Date(p.deadline+':00+07:00'));
 if(late&&!p.allowLate)throw Error('Đã hết hạn nhận hồ sơ.');
 let values={},collectives=[],individuals=[];
 if(p.kind==='report')for(const f of p.fields){const value=data.values?.[f.id]??'';if(value===''&&!f.required){values[f.id]='';continue}if(f.type==='number'){if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e15)throw Error('Nhập số hợp lệ cho '+f.label);values[f.id]=value}else values[f.id]=text(value,4000,f.required)}
 if(p.kind==='award'){
  const rows=(items,individual)=>{if(!Array.isArray(items)||items.length>200)throw Error('Danh sách tối đa 200 dòng.');return items.map(r=>({name:text(r.name,250,true),position:individual?text(r.position||'',250):'',summary:text(r.summary,6000,true)}))};
  collectives=rows(data.collectives||[],false);individuals=rows(data.individuals||[],true);if(!collectives.length&&!individuals.length)throw Error('Thêm ít nhất một tập thể hoặc cá nhân.');
 }
 return {values,collectives,individuals,late};
}
