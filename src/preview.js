import {esc} from './core.js';

export function previewKind(name='') {
  const extension=name.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','webp'].includes(extension)) return 'image';
  if (['pdf','docx','xlsx'].includes(extension)) return extension;
  return 'unsupported';
}

export function cellText(cell) {
  const value=cell.value;
  if (value==null) return '';
  if (value instanceof Date) return value.toLocaleDateString('vi-VN');
  if (typeof value==='object') {
    if (value.richText) return value.richText.map(part=>part.text).join('');
    if ('result' in value) return String(value.result??'');
    if ('text' in value) return String(value.text);
    if ('error' in value) return String(value.error);
    return '';
  }
  return String(value);
}

let activeClose;
export function openEvidencePreview(file,{load,download}) {
  activeClose?.();
  const previous=document.activeElement;
  const blocked=[...document.querySelectorAll('#app,#modal-root')].map(element=>({element,inert:element.inert}));
  blocked.forEach(({element})=>element.inert=true);
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const root=document.createElement('div');
  root.className='evidence-preview-backdrop';
  root.innerHTML=`<section class="evidence-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header class="preview-head"><div><small>XEM TRƯỚC MINH CHỨNG</small><h2 id="preview-title">${esc(file.name)}</h2></div><button class="icon-btn" data-preview-close aria-label="Đóng xem trước">✕</button></header><div class="preview-body" aria-busy="true"><div class="preview-message" role="status">Đang mở nội dung minh chứng…</div></div><footer class="preview-foot"><span class="preview-note">${Math.round((file.size||0)/1024)} KB · Bản gốc được giữ nguyên</span><div><button class="btn" data-preview-close>Quay lại hồ sơ</button><button class="btn primary" data-preview-save disabled>Tải về</button></div></footer></section>`;
  document.body.append(root);
  const body=root.querySelector('.preview-body'),save=root.querySelector('[data-preview-save]');
  let closed=false,blob,objectURL,dispose=()=>{};
  const live=()=>!closed;
  const close=()=>{
    if(closed)return;
    closed=true;
    dispose();
    if(objectURL)URL.revokeObjectURL(objectURL);
    document.removeEventListener('keydown',onKey,true);
    root.remove();
    blocked.forEach(({element,inert})=>element.inert=inert);
    document.body.style.overflow=overflow;
    if(previous?.isConnected)previous.focus();
    if(activeClose===close)activeClose=null;
  };
  const onKey=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return}
    if(event.key==='Tab'){
      const controls=[...root.querySelectorAll('button:not(:disabled),select,iframe,[tabindex="0"]')];
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
  };
  activeClose=close;
  document.addEventListener('keydown',onKey,true);
  root.querySelectorAll('[data-preview-close]').forEach(button=>button.onclick=close);
  root.querySelector('[data-preview-close]').focus();
  save.onclick=()=>{if(blob)download(blob,file.name)};
  const note=text=>root.querySelector('.preview-note').textContent=text;
  (async()=>{
    try {
      blob=await load(file);
      if(!live())return;
      save.disabled=false;
      const kind=previewKind(file.name);
      if(kind==='image'){
        objectURL=URL.createObjectURL(blob);
        const image=document.createElement('img');
        image.alt=file.name;image.className='preview-image';
        image.onerror=()=>{if(live())showMessage('Không đọc được ảnh này. Bạn có thể tải bản gốc về để kiểm tra.')};
        image.src=objectURL;
        body.replaceChildren(image);
      }else if(kind==='pdf'){
        const signature=await blob.slice(0,5).text();
        if(signature!=='%PDF-')throw Error('Tệp PDF không hợp lệ hoặc đã bị hỏng.');
        if(!live())return;
        const pdfjs=await import('pdfjs-dist/build/pdf.mjs');
        if(!live())return;
        pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdf-assets/pdf.worker.min.mjs',document.baseURI).href;
        const loading=pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,useSystemFonts:true,standardFontDataUrl:new URL('pdf-assets/standard_fonts/',document.baseURI).href,cMapUrl:new URL('pdf-assets/cmaps/',document.baseURI).href,cMapPacked:true,wasmUrl:new URL('pdf-assets/wasm/',document.baseURI).href});
        let renderTask;
        dispose=()=>{renderTask?.cancel();loading.destroy().catch(()=>{})};
        if(!live()){dispose();return}
        const pdf=await loading.promise;
        if(!live())return;
        const panel=document.createElement('div');panel.className='preview-pdf-panel';
        panel.innerHTML='<div class="preview-pdf-toolbar"><button class="btn small" data-pdf-prev>← Trang trước</button><span role="status" data-pdf-status></span><button class="btn small" data-pdf-next>Trang sau →</button></div><div class="preview-pdf-page" tabindex="0" aria-label="Nội dung PDF"><canvas role="img"></canvas></div>';
        body.replaceChildren(panel);
        const previousPage=panel.querySelector('[data-pdf-prev]'),nextPage=panel.querySelector('[data-pdf-next]'),status=panel.querySelector('[data-pdf-status]'),canvas=panel.querySelector('canvas');
        let pageNumber=1;
        const draw=async()=>{
          previousPage.disabled=nextPage.disabled=true;status.textContent=`Đang mở trang ${pageNumber}…`;
          try{
            const page=await pdf.getPage(pageNumber);
            if(!live())return;
            const original=page.getViewport({scale:1});
            const available=Math.max(240,body.clientWidth-48);
            const scale=Math.min(2,available/original.width),ratio=Math.min(window.devicePixelRatio||1,2);
            const viewport=page.getViewport({scale});
            canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
            canvas.style.width=Math.floor(viewport.width)+'px';canvas.style.height=Math.floor(viewport.height)+'px';
            canvas.setAttribute('aria-label',`Trang ${pageNumber} trên ${pdf.numPages}: ${file.name}`);
            renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});
            await renderTask.promise;
            if(live()){status.textContent=`Trang ${pageNumber} / ${pdf.numPages}`;panel.querySelector('.preview-pdf-page').scrollTop=0}
          }catch(error){if(live()){status.textContent='Không đọc được trang này. Chọn Tải về để xem bản gốc.'}}
          finally{if(live()){previousPage.disabled=pageNumber===1;nextPage.disabled=pageNumber===pdf.numPages}}
        };
        previousPage.onclick=()=>{if(pageNumber>1){pageNumber--;draw()}};
        nextPage.onclick=()=>{if(pageNumber<pdf.numPages){pageNumber++;draw()}};
        note('PDF · Dùng Trang trước / Trang sau để kiểm tra tài liệu.');
        await draw();
      }else if(kind==='docx'){
        const [{default:mammoth},{default:purify}]=await Promise.all([import('mammoth/mammoth.browser.js'),import('dompurify')]);
        if(!live())return;
        const result=await mammoth.convertToHtml({arrayBuffer:await blob.arrayBuffer()},{externalFileAccess:false});
        if(!live())return;
        const html=purify.sanitize(result.value,{ALLOWED_TAGS:['p','br','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','ul','ol','li','table','thead','tbody','tr','th','td','blockquote','sup','sub','img'],ALLOWED_ATTR:['src','alt','colspan','rowspan'],ALLOW_DATA_ATTR:false,ALLOWED_URI_REGEXP:/^data:image\/(?:png|jpeg|gif|webp);base64,/i});
        const article=document.createElement('article');
        article.className='preview-document';article.innerHTML=html;
        article.querySelectorAll('img').forEach(image=>{if(!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(image.getAttribute('src')||''))image.remove()});
        if(!article.textContent.trim()&&!article.querySelector('img'))showMessage('Tài liệu không có nội dung có thể xem trước. Chọn Tải về để mở bản gốc.');
        else body.replaceChildren(article);
        note('Word · Bố cục xem trước có thể khác bản gốc.');
      }else if(kind==='xlsx'){
        const {default:ExcelJS}=await import('exceljs');
        if(!live())return;
        const workbook=new ExcelJS.Workbook();
        await workbook.xlsx.load(await blob.arrayBuffer());
        if(!live())return;
        const sheets=workbook.worksheets.filter(sheet=>sheet.state==='visible');
        if(!sheets.length){showMessage('Không có trang tính hiển thị. Chọn Tải về để mở bản gốc.');return}
        const panel=document.createElement('div');panel.className='preview-workbook';
        const label=document.createElement('label');label.textContent='Trang tính';label.htmlFor='preview-sheet';
        const select=document.createElement('select');select.id='preview-sheet';
        sheets.forEach((sheet,index)=>select.add(new Option(sheet.name,String(index))));
        const wrap=document.createElement('div');wrap.className='preview-sheet-scroll';wrap.tabIndex=0;wrap.setAttribute('aria-label','Nội dung trang tính');
        const draw=()=>{
          const sheet=sheets[Number(select.value)],table=document.createElement('table');
          const rows=Math.min(sheet.rowCount,500),columns=Math.min(sheet.columnCount,50);
          const header=table.createTHead().insertRow();header.append(document.createElement('th'));
          for(let col=1;col<=columns;col++){const th=document.createElement('th');th.textContent=sheet.getColumn(col).letter;header.append(th)}
          const tbody=table.createTBody();
          for(let row=1;row<=rows;row++){
            const tr=tbody.insertRow(),th=document.createElement('th');th.textContent=String(row);tr.append(th);
            for(let col=1;col<=columns;col++){const td=tr.insertCell();td.textContent=cellText(sheet.getCell(row,col)).slice(0,10000)}
          }
          wrap.replaceChildren(table);
          note(`Excel · ${sheet.name} · Hiển thị ${rows}/${sheet.rowCount} dòng, ${columns}/${sheet.columnCount} cột. Tải bản gốc để xem đầy đủ.`);
        };
        select.onchange=draw;panel.append(label,select,wrap);body.replaceChildren(panel);draw();
      }else showMessage('Định dạng này chưa hỗ trợ xem trước. Chọn Tải về để mở tệp trên máy.');
    }catch(error){
      if(live())showMessage(blob?'Không thể đọc nội dung tệp này. Bạn vẫn có thể tải bản gốc về để kiểm tra.':'Không tải được tệp minh chứng. Vui lòng đóng cửa sổ rồi thử lại.');
    }finally{if(live())body.setAttribute('aria-busy','false')}
  })();
  function showMessage(text){const message=document.createElement('p');message.className='preview-message';message.setAttribute('role','status');message.textContent=text;body.replaceChildren(message)}
  return close;
}
