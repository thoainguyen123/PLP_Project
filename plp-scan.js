'use strict';
// OCR runs locally in the browser. CDN requests load libraries/language models only.
const scanIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H4v4m12-4h4v4M4 17v4h4m8 0h4v-4M2 12h20M7 8h10v8H7z"/></svg>';
let scanSession = null;
function mountScanButton(){const section=$('#navigation .nvg-menu-section');if(!section||section.querySelector('#scanDocumentButton'))return;section.insertAdjacentHTML('beforeend',`<button id="scanDocumentButton" class="scan-sidebar-btn" title="Scan hồ sơ · Nhận dạng OCR" aria-label="Scan hồ sơ" onclick="openScanDocument()">${scanIcon}</button>`);}
mountScanButton();
new MutationObserver(mountScanButton).observe($('#navigation'),{childList:true});
const closeDrawerBeforeScan=closeDrawer;
closeDrawer=function(){disposeScanSession();closeDrawerBeforeScan();};
function disposeScanSession(){const s=scanSession;scanSession=null;if(!s)return;if(s.url)URL.revokeObjectURL(s.url);if(s.worker)s.worker.terminate().catch(()=>{});}
function openScanDocument(){
 disposeScanSession();
 scanSession={file:null,url:null,worker:null,busy:false,recognized:false,text:''};
 showDrawer('Scan hồ sơ',`<div class="scan-steps"><span>01 · Chọn hồ sơ</span><span>02 · Nhận dạng OCR</span><span>03 · Kiểm tra & lưu</span></div><form id="scanForm" onsubmit="event.preventDefault();saveScannedDocument()"><div class="scan-drop" id="scanDrop" ondragover="event.preventDefault();this.classList.add('dragging')" ondragleave="this.classList.remove('dragging')" ondrop="event.preventDefault();this.classList.remove('dragging');selectScanFile(event.dataTransfer.files[0])">${scanIcon}<strong>Kéo thả ảnh hoặc PDF vào đây</strong><span class="subtext">JPG, PNG, WEBP hoặc PDF · Tối đa 20 MB / 10 trang</span><div class="actions"><label class="btn"><input id="scanFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onchange="selectScanFile(this.files[0])" hidden>Chọn tệp</label><label class="btn"><input type="file" accept="image/*" capture="environment" onchange="selectScanFile(this.files[0])" hidden>Chụp ảnh</label></div></div><div id="scanPreview" class="scan-preview" hidden></div><div class="scan-action"><button id="runScan" type="button" class="btn primary" onclick="runDocumentOCR()" disabled>${scanIcon}Nhận dạng OCR</button><span id="scanStatus" class="subtext" role="status">Chọn hồ sơ để bắt đầu.</span></div><progress id="scanProgress" value="0" max="100" hidden></progress><p class="note">Nhận dạng tiếng Việt tại trình duyệt. Cần Internet để tải bộ nhận dạng lần đầu. Bạn kiểm tra thông tin trước khi lưu.</p><div id="scanResult" hidden><div class="detail-section"><h3>Thông tin trích xuất</h3><div class="form-grid"><label class="form-group full">Tên văn bản / hồ sơ *<input name="title" id="ocrTitle" required maxlength="240"></label><label class="form-group">Số / ký hiệu<input name="documentNumber" id="ocrNumber" maxlength="120"></label><label class="form-group">Ngày ban hành<input name="issueDate" id="ocrDate" type="date"></label><label class="form-group full">Cơ quan ban hành<input name="issuer" id="ocrIssuer" maxlength="240"></label><label class="form-group">Dự án *<select name="project" id="ocrProject" required>${projects.map(p=>`<option ${activeProject?.name===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label><label class="form-group">Nhóm pháp lý *<select name="category" id="ocrCategory" required>${legalCategories.map(c=>`<option>${c}</option>`).join('')}</select></label></div></div><details class="scan-text-detail"><summary>Đối chiếu nội dung nhận dạng</summary><textarea id="ocrText" aria-label="Nội dung OCR" rows="10"></textarea><button type="button" class="btn small" onclick="fillOCRFields(document.querySelector('#ocrText').value)">Trích lại thông tin từ nội dung</button></details><label class="scan-review"><input id="scanReviewed" type="checkbox" required>Tôi đã đối chiếu và kiểm tra thông tin hồ sơ.</label></div></form>`,btn('Đóng','onclick="closeDrawer()"')+'<button class="btn primary" id="saveScan" type="submit" form="scanForm" disabled>'+icon('check')+'Lưu hồ sơ</button>');
 $('#overlay .drawer').classList.add('scan-drawer');
}
function scanStatus(message,progress){if(!scanSession||!$('#scanStatus'))return;$('#scanStatus').textContent=message;if(progress!==undefined){$('#scanProgress').hidden=false;$('#scanProgress').value=progress;}}
function selectScanFile(file){
 const s=scanSession;if(!s||s.busy||!file)return;
 if(file.size>20*1024*1024){toast('Tệp vượt quá 20 MB. Hãy chọn tệp nhỏ hơn.');return;}
 const valid=/\.(pdf|jpe?g|png|webp)$/i.test(file.name)&&(!file.type||/^image\/(jpeg|png|webp)$|^application\/pdf$/.test(file.type));
 if(!valid){toast('Hãy chọn ảnh JPG, PNG, WEBP hoặc tài liệu PDF.');return;}
 if(s.url)URL.revokeObjectURL(s.url);s.file=file;s.url=URL.createObjectURL(file);s.recognized=false;s.text='';
 $('#scanResult').hidden=true;$('#saveScan').disabled=true;$('#runScan').disabled=false;$('#scanReviewed').checked=false;$('#scanProgress').hidden=true;
 $('#scanPreview').hidden=false;$('#scanPreview').innerHTML=`<div class="scan-file-meta"><strong>${esc(file.name)}</strong><span>${(file.size/1024/1024).toFixed(2)} MB</span></div>${/\.pdf$/i.test(file.name)?'<p class="subtext">PDF · Bản xem trước hiển thị khi nhận dạng.</p>':`<img src="${s.url}" alt="Ảnh hồ sơ được chọn">`}`;
 scanStatus('Sẵn sàng nhận dạng.');
}
const loadedOCRScripts=new Map();
function loadOCRScript(url,globalName){if(window[globalName])return Promise.resolve(window[globalName]);if(loadedOCRScripts.has(url))return loadedOCRScripts.get(url);const job=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.crossOrigin='anonymous';script.onload=()=>window[globalName]?resolve(window[globalName]):reject(new Error('Không tải được thư viện nhận dạng.'));script.onerror=()=>{script.remove();loadedOCRScripts.delete(url);reject(new Error('Không tải được bộ nhận dạng. Kiểm tra Internet rồi thử lại.'));};document.head.appendChild(script);});loadedOCRScripts.set(url,job);return job;}
async function runDocumentOCR(){
 const s=scanSession;if(!s?.file||s.busy)return;s.busy=true;s.recognized=false;$('#runScan').disabled=true;$('#saveScan').disabled=true;$('#scanResult').hidden=true;$('#scanReviewed').checked=false;
 const valid=()=>scanSession===s&&!!$('#scanForm');let pdf=null;
 try{
  scanStatus('Đang chuẩn bị nhận dạng…',0);
  const chunks=[];let total=1,completed=0;
  const recognize=async image=>{
   if(!s.worker){const lib=await loadOCRScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','Tesseract');if(!valid())return '';const worker=await lib.createWorker('vie+eng',1,{logger:m=>{if(valid()){const pct=m.status==='recognizing text'?Math.round((completed+(m.progress||0))/total*100):Math.round(completed/total*100);scanStatus(m.status==='recognizing text'?`Đang nhận dạng trang ${completed+1}/${total}…`:'Đang tải bộ nhận dạng tiếng Việt…',pct);}}});if(!valid()){await worker.terminate();return '';}s.worker=worker;}
   const result=await s.worker.recognize(image);return result.data.text||'';
  };
  if(/\.pdf$/i.test(s.file.name)){
   const lib=await loadOCRScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','pdfjsLib');if(!valid())return;
   lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
   pdf=await lib.getDocument({data:new Uint8Array(await s.file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true}).promise;
   total=pdf.numPages;if(total>10)throw new Error('PDF có hơn 10 trang. Hãy tách thành tệp tối đa 10 trang.');
   for(let i=1;i<=total;i++){
    if(!valid())return;scanStatus(`Đang đọc trang ${i}/${total}…`,Math.round((i-1)/total*100));
    const page=await pdf.getPage(i),viewport=page.getViewport({scale:1.8}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;if(!valid())return;
    if(i===1){const preview=canvas.cloneNode();preview.width=canvas.width;preview.height=canvas.height;preview.getContext('2d').drawImage(canvas,0,0);$('#scanPreview').appendChild(preview);}
    const content=await page.getTextContent();let text='',lastY=null;
    content.items.forEach(item=>{const y=Math.round(item.transform[5]);if(lastY!==null&&Math.abs(y-lastY)>4)text+='\n';else if(text)text+=' ';text+=item.str;lastY=y;});
    chunks.push(text.replace(/\s/g,'').length>=30?text:await recognize(canvas));completed++;page.cleanup();canvas.width=0;canvas.height=0;
   }
  }else chunks.push(await recognize(s.file));
  if(!valid())return;const text=chunks.join('\n\n').trim();if(!text)throw new Error('Chưa đọc được chữ. Hãy thử ảnh rõ hơn, thẳng trang và đủ sáng.');
  s.text=text;s.recognized=true;fillOCRFields(text);$('#scanResult').hidden=false;$('#saveScan').disabled=false;scanStatus('Đã nhận dạng. Kiểm tra và chỉnh lại các trường trước khi lưu.',100);
 }catch(error){if(valid()){scanStatus(error.message||'Không nhận dạng được hồ sơ. Hãy thử lại.');$('#scanProgress').hidden=true;}}
 finally{if(pdf)await pdf.destroy().catch(()=>{});if(s.worker){await s.worker.terminate().catch(()=>{});s.worker=null;}s.busy=false;if(valid())$('#runScan').disabled=false;}
}
function extractDocumentFields(text,fileName=''){
 const lines=text.split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean),norm=lines.map(normalize);
 const number=text.match(/(?:số|s[o0])\s*[:：.]\s*([^\s\n]+(?:\s*\/\s*[^\s\n]+)?)/iu)?.[1]||'';
 const dt=text.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(20\d{2}|19\d{2})/iu)||text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2}|19\d{2})\b/);
 let issueDate='';if(dt){const y=+dt[3],m=+dt[2],d=+dt[1],check=new Date(Date.UTC(y,m-1,d));if(check.getUTCFullYear()===y&&check.getUTCMonth()===m-1&&check.getUTCDate()===d)issueDate=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
 const typeIndex=norm.findIndex(s=>/^(quyet dinh|cong van|thong bao|giay phep|giay chung nhan|to trinh|bien ban|bao cao)\b/.test(s));
 const subjectIndex=norm.findIndex(s=>/^(ve viec|v\/v|vv[:. ])/.test(s));
 let title=typeIndex>=0?lines[typeIndex]:'';
 if(subjectIndex>=0&&subjectIndex!==typeIndex)title+=(title?' · ':'')+lines[subjectIndex];
 if(!title)title=fileName.replace(/\.[^.]+$/,'');
 const header=lines.slice(0,Math.min(typeIndex>=0?typeIndex:8,8));
 const agencyLines=header.map(l=>l.split(/CỘNG HÒA|CỘNG HOÀ|Độc lập|ĐỘC LẬP/i)[0].trim());
 const agency=agencyLines.filter((l,i)=>/^(ủy ban|uỷ ban|ubnd|sở |bộ |ban |phòng |công ty|tập đoàn|văn phòng|hội đồng)/i.test(l)&&!/^ban hành/i.test(l)||i>0&&/^(thành phố|tỉnh |quận |huyện |phường |xã )/i.test(l)&&/^(ủy ban|uỷ ban|ubnd)/i.test(agencyLines[i-1]));
 const categoryText=normalize(title+' '+lines.slice(typeIndex>=0?typeIndex:0,(typeIndex>=0?typeIndex:0)+8).join(' '));
 const category=legalCategory({title:categoryText});
 return {title,documentNumber:number,issuer:agency.slice(0,2).join(' · '),issueDate,category};
}
function fillOCRFields(text){const s=scanSession;if(!s)return;const fields=extractDocumentFields(text,s.file?.name||'');$('#ocrText').value=text;$('#ocrTitle').value=fields.title;$('#ocrNumber').value=fields.documentNumber;$('#ocrIssuer').value=fields.issuer;$('#ocrDate').value=fields.issueDate;$('#ocrCategory').value=fields.category;$('#scanReviewed').checked=false;}
function attachmentRequest(mode,action){return new Promise((resolve,reject)=>{const req=indexedDB.open('plp-scan-attachments',1);req.onupgradeneeded=()=>req.result.createObjectStore('files',{keyPath:'id'});req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;const tx=db.transaction('files',mode);let result;try{const op=action(tx.objectStore('files'));op.onsuccess=()=>result=op.result;}catch(e){db.close();reject(e);return;}tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error||new Error('Không lưu được tệp.'));};};});}
async function saveScannedDocument(){
 const s=scanSession;if(!s?.recognized||s.busy||!$('#scanForm').reportValidity())return;
 const d=Object.fromEntries(new FormData($('#scanForm')));d.title=d.title.trim();if(!d.title){$('#ocrTitle').value='';$('#ocrTitle').reportValidity();return;}
 let n=records.p08.length+1;while(records.p08.some(r=>r.id===`TT-2026-${String(n).padStart(3,'0')}`))n++;
 const id=`TT-2026-${String(n).padStart(3,'0')}`,attachmentId=`${id}-${Date.now()}`,now=new Date().toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'});
 const r={...d,id,owner:names[0],status:'Đang xử lý',priority:'Trung bình',due:'',progress:0,note:'',history:[{text:'Scan OCR · Đã kiểm tra thông tin và lưu hồ sơ',time:now}],ocrText:$('#ocrText').value,sourceFileName:s.file.name,attachmentId};
 $('#saveScan').disabled=true;$('#runScan').disabled=true;s.busy=true;
 try{await attachmentRequest('readwrite',store=>store.put({id:attachmentId,file:s.file}));records.p08.unshift(r);try{localStorage.setItem('plp-prototype-v1',JSON.stringify(records));}catch(error){records.p08.splice(records.p08.indexOf(r),1);await attachmentRequest('readwrite',store=>store.delete(attachmentId));throw error;}const project=projectCatalog.find(p=>p.name===d.project);closeDrawer();const hash=`#p08/${project.code}`;if(location.hash===hash)loadPage();else location.hash=hash;toast('Đã lưu hồ sơ, thông tin OCR và tệp gốc vào dự án.');}
 catch(error){if(scanSession===s){s.busy=false;$('#saveScan').disabled=false;$('#runScan').disabled=false;scanStatus('Chưa lưu được hồ sơ. Kiểm tra dung lượng lưu trữ của trình duyệt rồi thử lại.');}}
}
async function downloadScannedOriginal(id){try{const result=await attachmentRequest('readonly',store=>store.get(id));if(!result?.file){toast('Không tìm thấy tệp gốc trong trình duyệt này.');return;}const a=document.createElement('a');a.href=URL.createObjectURL(result.file);a.download=result.file.name||'ho-so-scan';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}catch{toast('Không mở được tệp gốc trong trình duyệt này.');}}
// Add scan metadata and the original file to the existing record detail panel.
const openDetailBeforeScan=openDetail;
openDetail=function(id){openDetailBeforeScan(id);const r=selected;if(!r||r.id!==id||!r.attachmentId)return;$('#overlay .drawer-body').insertAdjacentHTML('afterbegin',`<section class="detail-section scan-saved-detail"><h3>Thông tin hồ sơ đã scan</h3><dl class="detail-meta"><div><dt>Số / ký hiệu</dt><dd>${esc(r.documentNumber||'—')}</dd></div><div><dt>Ngày ban hành</dt><dd>${dateVN(r.issueDate)}</dd></div><div><dt>Cơ quan ban hành</dt><dd>${esc(r.issuer||'—')}</dd></div><div><dt>Nhóm pháp lý</dt><dd>${esc(r.category)}</dd></div></dl><button class="btn small" style="margin-top:15px" onclick="downloadScannedOriginal('${esc(r.attachmentId)}')">${icon('download')}${esc(r.sourceFileName)}</button><details class="scan-text-detail"><summary>Nội dung nhận dạng OCR</summary><pre>${esc(r.ocrText)}</pre></details></section>`);};
function openScanRoute(){if(location.hash==='#scan')openScanDocument();}
window.addEventListener('hashchange',openScanRoute);
openScanRoute();
