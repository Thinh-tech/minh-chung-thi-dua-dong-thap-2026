import {esc} from './core.js';

export function safeDownloadName(value){
 const name=String(value||'Tep').normalize('NFC')
  .replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/^[. ]+|[. ]+$/g,'').slice(0,150);
 return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)?'_'+name:name||'Tep';
}

export function allocateDownloadNames(tasks,folders=true){
 const used=new Set(['_loi_tai_ve.txt']);
 return tasks.map(task=>{
  const folder=folders?(task.path||[]).map(safeDownloadName).join('/'):'';
  const name=safeDownloadName(task.name),dot=name.lastIndexOf('.');
  const stem=dot>0?name.slice(0,dot):name,extension=dot>0?name.slice(dot):'';
  let candidate=name,index=1;
  const full=value=>folder?folder+'/'+value:value;
  while(used.has(full(candidate).toLocaleLowerCase('vi')))candidate=stem+' ('+(++index)+')'+extension;
  used.add(full(candidate).toLocaleLowerCase('vi'));
  return full(candidate);
 });
}

export async function runBulkDownload({tasks,zip,filename,save,assertAccess,onProgress=()=>{},signal}){
 if(!tasks.length)throw Error('Chọn ít nhất một mục để tải.');
 const check=()=>{
  if(signal?.aborted)throw new DOMException('Đã dừng tải.','AbortError');
  assertAccess();
 };
 check();
 const names=allocateDownloadNames(tasks,zip);
 const archive=zip?new (await import('jszip')).default():null;
 const failures=[];
 let completed=0;
 for(let i=0;i<tasks.length;i++){
  check();
  onProgress({completed:i,total:tasks.length,label:tasks[i].label||tasks[i].name,stage:'loading'});
  try{
   const blob=await tasks[i].load();
   check();
   if(!blob||typeof blob.arrayBuffer!=='function')throw Error('Không đọc được nội dung tệp.');
   if(archive)archive.file(names[i],new Uint8Array(await blob.arrayBuffer()));
   else await save(blob,names[i]);
   completed++;
  }catch(error){
   check();
   failures.push({name:names[i],label:tasks[i].label||tasks[i].name,error:error.message||'Tải không thành công'});
  }
 }
 check();
 if(archive&&completed){
  if(failures.length)archive.file('_LOI_TAI_VE.txt',failures.map(f=>f.name+'\n'+f.error).join('\n\n'));
  onProgress({completed:tasks.length,total:tasks.length,stage:'compressing'});
  const bytes=await archive.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:3}},info=>{
   onProgress({completed:tasks.length,total:tasks.length,stage:'compressing',percent:Math.round(info.percent)});
  });
  check();
  await save(new Blob([bytes],{type:'application/zip'}),safeDownloadName(filename||'Tai-hang-loat.zip'));
 }
 return {completed,failures};
}

export function fileDownloadTasks(store,files,path=[],prefix=''){
 return (files||[]).map(file=>({
  name:file.name,path,size:file.size,
  label:[prefix,file.name].filter(Boolean).join(' · '),
  load:()=>store.download(file)
 }));
}

export function openBulkDownload({store,tasks,title='Tải lựa chọn / hàng loạt',filename='Tai-hang-loat.zip',download}){
 if(store.user?.role!=='admin')throw Error('Chỉ admin được tải hàng loạt.');
 if(document.querySelector('#bulk-download-panel'))return;
 const actor=store.user,previous=document.activeElement,controller=new AbortController();
 const root=document.createElement('div');
 root.id='bulk-download-panel';
 root.className='modal-backdrop';
 root.style.zIndex='1000';
 root.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
 <header class="modal-head"><h2 id="bulk-title">${esc(title)}</h2><button class="icon-btn" data-bulk-close aria-label="Đóng tải hàng loạt">×</button></header>
 <div class="modal-content">
 <div class="buttonrow"><label class="checkbox-row"><input id="bulk-select-all" type="checkbox">Chọn tất cả</label><span id="bulk-count">0 / ${tasks.length} mục</span></div>
 <div class="field"><label for="bulk-format">Cách tải</label><select id="bulk-format"><option value="zip">Gộp thành tệp ZIP</option><option value="files">Tải từng tệp</option></select></div>
 <div class="bulk-item-list">${tasks.map((task,i)=>`<label class="checkbox-row" style="display:flex;align-items:flex-start;padding:9px 0;border-bottom:1px solid #e5eaf0"><input type="checkbox" data-bulk-item="${i}"><span>${esc(task.label||task.name)}</span></label>`).join('')||'<p>Chưa có mục để tải.</p>'}</div>
 <p id="bulk-progress" role="status" aria-live="polite"></p><div id="bulk-errors"></div>
 </div><footer class="modal-foot"><button class="btn" data-bulk-close>Đóng</button><button class="btn" id="bulk-download-all" ${tasks.length?'':'disabled'}>Tải tất cả</button><button class="btn primary" id="bulk-download-selected" disabled>Tải đã chọn</button></footer></section>`;
 document.body.append(root);
 const q=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
 const boxes=all('[data-bulk-item]');
 let busy=false;
 const update=()=>{
  const count=boxes.filter(box=>box.checked).length;
  q('#bulk-count').textContent=count+' / '+tasks.length+' mục';
  q('#bulk-select-all').checked=count===tasks.length&&count>0;
  q('#bulk-select-all').indeterminate=count>0&&count<tasks.length;
  q('#bulk-download-selected').disabled=busy||controller.signal.aborted||!count;
 };
 const close=()=>{
  if(busy){controller.abort();q('#bulk-progress').textContent='Đang dừng tải…';return;}
  root.remove();previous?.focus();
 };
 all('[data-bulk-close]').forEach(button=>button.onclick=close);
 q('#bulk-select-all').onchange=event=>{boxes.forEach(box=>box.checked=event.target.checked);update();};
 boxes.forEach(box=>box.onchange=update);
 const run=async every=>{
  if(busy)return;
  if(every)boxes.forEach(box=>box.checked=true);
  const selected=boxes.filter(box=>box.checked).map(box=>tasks[Number(box.dataset.bulkItem)]);
  update();
  if(!selected.length)return;
  busy=true;
  all('input,select,button:not([data-bulk-close])').forEach(element=>element.disabled=true);
  all('[data-bulk-close]').forEach(button=>button.textContent='Dừng tải');
  q('#bulk-errors').textContent='';
  const assertAccess=()=>{
   if(store.user!==actor||store.user?.role!=='admin')throw Error('Phiên admin đã thay đổi. Vui lòng mở lại mục tải.');
  };
  try{
   const zip=q('#bulk-format').value==='zip';
   const result=await runBulkDownload({tasks:selected,zip,filename,save:download,assertAccess,signal:controller.signal,onProgress:progress=>{
    q('#bulk-progress').textContent=progress.stage==='compressing'
     ?'Đang đóng gói ZIP '+(progress.percent||0)+'%'
     :'Đang tải '+(progress.completed+1)+' / '+progress.total+' · '+progress.label;
   }});
   q('#bulk-progress').textContent='Đã tải '+result.completed+' / '+selected.length+' mục'+(zip&&result.completed?' trong gói ZIP.':'.');
   q('#bulk-errors').innerHTML=result.failures.length
    ?'<div class="notice"><strong>Các mục tải chưa thành công</strong><ul>'+result.failures.map(f=>'<li>'+esc(f.label)+' · '+esc(f.error)+'</li>').join('')+'</ul></div>':'';
   if(!zip&&result.completed>1)q('#bulk-progress').textContent+=' Kiểm tra quyền tải nhiều tệp nếu trình duyệt hiện thông báo.';
   boxes.forEach(box=>box.checked=result.failures.some(f=>f.label===(tasks[Number(box.dataset.bulkItem)].label||tasks[Number(box.dataset.bulkItem)].name)));
  }catch(error){q('#bulk-progress').textContent=error.name==='AbortError'?'Đã dừng tải.':error.message;}
  finally{
   busy=false;
   all('input,select,button').forEach(element=>element.disabled=false);
   all('[data-bulk-close]').forEach(button=>button.textContent='Đóng');
   update();
   if(controller.signal.aborted){q('#bulk-download-all').disabled=true;q('#bulk-download-selected').disabled=true;}
  }
 };
 q('#bulk-download-all').onclick=()=>run(true);
 q('#bulk-download-selected').onclick=()=>run(false);
 root.onkeydown=event=>{
  if(event.key==='Escape'){event.stopPropagation();close();}
  if(event.key==='Tab'){
   const elements=all('input:not(:disabled),select:not(:disabled),button:not(:disabled)');
   if(event.shiftKey&&document.activeElement===elements[0]){event.preventDefault();elements.at(-1)?.focus();}
   else if(!event.shiftKey&&document.activeElement===elements.at(-1)){event.preventDefault();elements[0]?.focus();}
  }
 };
 q('#bulk-select-all').focus();
}
