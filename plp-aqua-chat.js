'use strict';
const aquaDocuments=PLP_AQUA_DOCUMENTS.documents;
const aquaProjectFolder=[...archiveNodes.values()].find(n=>n.name==='Aqua 112');
const aquaPDFURLs=new Map();
function aquaPDFURL(id){if(aquaPDFURLs.has(id))return aquaPDFURLs.get(id);const d=aquaDocuments.find(d=>d.id===id);if(!d)return '';const binary=atob(d.pdfBase64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));aquaPDFURLs.set(id,url);return url;}
function aquaFolderForDocument(doc){const descendants=[];function visit(n){descendants.push(n);n.children.forEach(visit);}visit(aquaProjectFolder);return descendants.find(n=>n.name===doc.category)||aquaProjectFolder;}
const importedAquaIds=new Set(aquaDocuments.map(d=>d.id));
archiveDocs=archiveDocs.filter(d=>!(d.demo&&archiveIsInside(d,aquaProjectFolder.id))&&!importedAquaIds.has(d.id));
for(const d of aquaDocuments){archiveDocs.push({id:d.id,title:d.title,folderId:aquaFolderForDocument(d).id,issueDate:d.issueDate,issuer:d.issuer,documentType:d.documentType,direction:d.direction,version:'1.0',borrowed:false,demo:false,sourceDocId:d.id});}
const archiveRenderBeforeAqua=renderArchiveExplorer;
renderArchiveExplorer=function(){archiveRenderBeforeAqua();$('.heading-actions').insertAdjacentHTML('afterbegin',btn('Chatbot tra cứu','onclick="openAquaChat()"','','book'));};
const archiveRowsBeforeAqua=renderArchiveDocuments;
renderArchiveDocuments=function(){archiveRowsBeforeAqua();const tag=$('.archive-documents .demo-tag');if(tag){const actual=archiveDocumentResults().filter(d=>d.sourceDocId).length;tag.textContent=actual?`${actual} hồ sơ từ NovaInsight`:'Hồ sơ cục bộ';}};
const archiveDetailBeforeAqua=openArchiveDocument;
openArchiveDocument=function(id){const doc=aquaDocuments.find(d=>d.id===id);if(!doc){archiveDetailBeforeAqua(id);return;}openAquaSource(id,1);};
const aquaSearchText=new Map(aquaDocuments.map(d=>[d.id,normalize([d.title,d.issuer,d.category,...d.pages.map(p=>p.text)].join(' '))]));
const archiveResultsBeforeAqua=archiveDocumentResults;
archiveDocumentResults=function(){const q=normalize(archiveState.q.trim());if(!q)return archiveResultsBeforeAqua();return archiveDocs.filter(d=>archiveIsInside(d,archiveState.selected)&&(!archiveState.borrowed||d.borrowed)&&(aquaSearchText.get(d.id)||normalize(d.title+' '+d.id+' '+d.issuer)).includes(q));};
function openAquaSource(id,page=1){const d=aquaDocuments.find(d=>d.id===id);if(!d)return;page=Math.max(1,Math.min(d.pageCount,page));const p=d.pages[page-1];showDrawer(d.title,`<div class="actions" style="margin-bottom:16px"><span class="count">${esc(d.id)}</span><span class="tag green">Tài liệu gốc · Aqua 112</span><span class="subtext">${d.pageCount} trang</span></div><dl class="detail-meta"><div><dt>Ngày ban hành trên NovaInsight</dt><dd>${dateVN(d.issueDate)}</dd></div><div><dt>Cơ quan ban hành</dt><dd>${esc(d.issuer)}</dd></div><div><dt>Danh mục</dt><dd>${esc(d.category)}</dd></div><div><dt>Loại văn bản</dt><dd>${esc(d.documentType)}</dd></div></dl><div class="detail-section"><h3>Trang nguồn ${page} / ${d.pageCount} ${p.method==='ocr'?'<span class="demo-tag">Nội dung OCR</span>':''}</h3><div class="aqua-page-actions">${d.pages.map(p=>`<button class="btn small ${p.page===page?'light':''}" onclick="openAquaSource('${id}',${p.page})" aria-label="Trang ${p.page}">${p.page}</button>`).join('')}</div><pre class="aqua-page-text">${esc(p.text)}</pre></div><div class="actions"><a class="btn small" href="${aquaPDFURL(id)}#page=${page}" target="_blank" rel="noopener noreferrer">${icon('file')}Mở PDF trang ${page}</a><a class="btn small" href="${esc(d.sourceUrl)}" target="_blank" rel="noopener noreferrer">Mở trên NovaInsight ${icon('arrow')}</a></div>`,btn('Đóng','onclick="closeDrawer()"')+btn('Hỏi về hồ sơ này',`onclick="closeDrawer();openAquaChat('${id}')"`,'','book')+`<a class="btn primary" href="${aquaPDFURL(id)}" download="${esc(d.originalFilename)}">${icon('download')}Tải PDF gốc</a>`);$('#overlay .drawer').classList.add('aqua-document-drawer');}

const aquaChat={open:false,scope:'',project:aquaProjectFolder.id,messages:[],lastDocs:[],busy:false,turn:0,controller:null};
function openAquaChat(scope){if(scope!==undefined){aquaChat.scope=scope;aquaChat.project=aquaProjectFolder.id;}aquaChat.open=true;let root=$('#aquaChat');if(!root){root=document.createElement('section');root.id='aquaChat';root.className='aqua-chat';root.setAttribute('aria-label','Chatbox Pháp lý');document.body.appendChild(root);}root.hidden=false;syncAquaChatLauncher();renderAquaChat();$('#aquaQuestion').focus();}
function closeAquaChat(){aquaChat.open=false;$('#aquaChat').hidden=true;syncAquaChatLauncher();$('#aquaChatLauncher')?.focus();}
function clearAquaChat(){aquaChat.controller?.abort();aquaChat.turn++;aquaChat.busy=false;aquaChat.messages=[];aquaChat.lastDocs=[];renderAquaChat();}
function renderAquaChat(){const root=$('#aquaChat');root.innerHTML=`<header class="aqua-chat-header"><div>${icon('book')}<strong>Chatbox Pháp lý</strong></div><div class="actions"><button title="Xóa hội thoại" aria-label="Xóa hội thoại" onclick="clearAquaChat()">↺</button><button title="Đóng chatbot" aria-label="Đóng chatbot" onclick="closeAquaChat()">${icon('close')}</button></div></header><div class="aqua-chat-scope"><label for="aquaChatScope">Dự án</label><div class="aqua-project-picker"><input id="aquaChatScope" role="combobox" aria-label="Dự án tra cứu" aria-autocomplete="list" aria-expanded="false" aria-controls="aquaProjectOptions" autocomplete="off" value="${esc(archiveNodes.get(aquaChat.project)?.name||'')}" placeholder="Tìm dự án…" onfocus="openAquaProjectPicker()" oninput="filterAquaProjects(this.value)" onkeydown="aquaProjectKeydown(event)"><div id="aquaProjectOptions" class="aqua-project-options" role="listbox" aria-label="Danh sách dự án" hidden></div></div></div><div class="aqua-chat-messages" id="aquaChatMessages" role="log" aria-live="polite">${aquaChat.messages.length?aquaChat.messages.map(m=>`<div class="aqua-message ${m.role}">${m.role==='user'?esc(m.text):m.html}</div>`).join(''):`<div class="aqua-message assistant"><strong>Bạn muốn tra cứu thông tin gì của ${esc(archiveNodes.get(aquaChat.project)?.name||'dự án')}?</strong></div><div class="aqua-chat-suggestions">${['Liệt kê hồ sơ của dự án','Hồ sơ nào liên quan nghĩa vụ tài chính?','Tóm tắt các hồ sơ hiện có'].map(q=>`<button onclick="askAquaChat(${esc(JSON.stringify(q))})">${esc(q)}</button>`).join('')}</div>`}</div>${aquaChat.busy?'<div class="aqua-chat-thinking" role="status">Đang trả lời…</div>':''}<form class="aqua-chat-form" onsubmit="event.preventDefault();askAquaChat()"><label class="sr-only" for="aquaQuestion">Câu hỏi tra cứu hồ sơ</label><textarea id="aquaQuestion" rows="2" maxlength="1200" placeholder="Hỏi về văn bản, số tiền, cơ quan, nội dung…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();askAquaChat()}"></textarea><button type="submit" class="btn primary" ${aquaChat.busy?'disabled':''} aria-label="Gửi câu hỏi">${icon('arrow')}</button></form>`;const messages=$('#aquaChatMessages');messages.scrollTop=messages.scrollHeight;}
const aquaStopWords=new Set('cho toi xin vui long cua du an aqua 112 ho so tai lieu nao cac co ve trong va la gi duoc den da thi nay nhung mot nhu tim kiem thong tin xin hay voi o tren de can ban co the xem nhat het chua'.split(' '));
function aquaNormalize(text){return normalize(text).replace(/(?<=\d)[.,](?=\d)/g,'');}
function aquaTokens(text){return aquaNormalize(text).replace(/[^a-z0-9/]+/g,' ').split(/\s+/).filter(t=>t.length>1&&!aquaStopWords.has(t));}
const aquaChunks=[];
for(const d of aquaDocuments){for(const page of d.pages){const words=page.text.split(/\s+/);for(let offset=0;offset<words.length;offset+=110){const text=words.slice(offset,offset+150).join(' ');if(!text.trim())continue;aquaChunks.push({doc:d,page:page.page,text,normalized:aquaNormalize(text),tokens:new Set(aquaTokens(text))});}}}
function aquaQueryTerms(query){const n=aquaNormalize(query);let expanded=query;if(/nghia vu tai chinh|nvtc/.test(n))expanded+=' nghĩa vụ tài chính thuế tiền sử dụng đất thuê đất';if(/gcn|giay chung nhan/.test(n))expanded+=' GCN giấy chứng nhận';if(/so tien|bao nhieu tien/.test(n))expanded+=' số tiền đồng phải nộp';return [...new Set(aquaTokens(expanded))];}
function retrieveAqua(query,scope=''){
 let docs=scope?aquaDocuments.filter(d=>d.id===scope):aquaDocuments;
 const numbers=aquaNormalize(query).match(/\b\d{3,}\b/g)?.filter(n=>n!=='112')||[];
 const idMatches=docs.filter(d=>numbers.some(n=>aquaNormalize(d.title).includes(n)));
 if(idMatches.length)docs=idMatches;
 const terms=aquaQueryTerms(query),baseTerms=aquaTokens(query),allowed=new Set(docs.map(d=>d.id));
 const idf=new Map(terms.map(t=>[t,Math.log(1+(aquaChunks.length+1)/(1+aquaChunks.filter(c=>c.tokens.has(t)).length))]));
 const matches=aquaChunks.filter(c=>allowed.has(c.doc.id)).map(c=>{let score=0,matched=0;for(const t of terms){if(c.tokens.has(t)||c.normalized.includes(t)){score+=idf.get(t);if(baseTerms.includes(t))matched++;}if(aquaNormalize(c.doc.title+' '+c.doc.category).includes(t))score+=idf.get(t)*.3;}if(/so tien|bao nhieu tien/.test(aquaNormalize(query))){if(/(\d[\d.,]+\s*(đồng|dong)|số tiền|Số tiền)/i.test(c.text))score+=4;if(/tong so tien|so tien con phai nop/.test(c.normalized))score+=10;}return {...c,score,matched};}).filter(c=>c.matched>0&&c.score>1).sort((a,b)=>b.score-a.score);
 const selected=[];for(const c of matches){if(selected.some(s=>s.doc.id===c.doc.id&&s.page===c.page))continue;selected.push(c);if(selected.length===(idMatches.length===1?1:3))break;}return {results:selected,docs,terms};
}
function aquaCite(doc,page,label='Mở nguồn'){return `<button class="aqua-source-link" onclick="openAquaSource('${doc.id}',${page})">${esc(label)} · ${doc.id} · Trang ${page}</button>`;}
function aquaExcerpt(chunk,query){if(/so tien|bao nhieu tien/.test(aquaNormalize(query))){const amount=chunk.text.match(/(?:Tổng số tiền|Số tiền còn phải nộp)[\s\S]{0,600}/iu);if(amount)return amount[0];}const terms=aquaQueryTerms(query),words=chunk.text.split(/\s+/);let best=0,bestScore=-1;for(let i=0;i<words.length;i+=8){const sample=aquaNormalize(words.slice(i,i+65).join(' '));const score=terms.reduce((s,t)=>s+(sample.includes(t)?1:0),0);if(score>bestScore){bestScore=score;best=i;}}return words.slice(best,best+85).join(' ');}
function aquaAnswerSources(results,query){return results.map(c=>`<div class="aqua-answer-source">${aquaCite(c.doc,c.page,'Nguồn')}<details><summary>Xem đoạn đối chiếu</summary><blockquote>${esc(aquaExcerpt(c,query))}</blockquote></details></div>`).join('');}
function aquaRelevantSentences(chunk,query){
 const text=chunk.doc.pages[chunk.page-1].text;
 const lines=text.split(/\n\s*\n|(?<=[.;])\s+(?=[A-ZĐÀ-Ỹ])|\n(?=\s*(?:[-•]|\d+[.)]))/u).map(s=>s.replace(/\s+/g,' ').trim()).filter(s=>s.length>35&&s.length<1000);
 const terms=aquaQueryTerms(query);
 return lines.map((text,index)=>({text,index,score:terms.reduce((s,t)=>s+(aquaNormalize(text).includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).sort((a,b)=>a.index-b.index).map(x=>x.text);
}
function answerAquaQuestion(query){
 const normalized=aquaNormalize(query);
 if(/\b(novaworld|phan thiet|ho tram|aqua ?45|aqua ?81|aqua ?91)\b/.test(normalized))return {html:'Tôi đang tra cứu bộ 10 hồ sơ của Aqua 112. Chưa có hồ sơ dự án bạn vừa nêu để đối chiếu. Bạn muốn xem nội dung nào của Aqua 112?',docs:[]};
 if(/^(hello|hi\b|xin chao|chao|alo)/.test(normalized))return {html:'Chào bạn! Bạn muốn tìm hiểu văn bản nào hoặc vấn đề gì của Aqua 112?',docs:aquaChat.lastDocs};
 if(/^(cam on|thank|ok\b|duoc roi)/.test(normalized))return {html:'Bạn cần tra cứu thêm nội dung nào cứ hỏi tôi nhé.',docs:aquaChat.lastDocs};
 if(/hoan thanh tat ca|hoan tat.*phap ly|ket luan.*(toan bo|phap ly)/.test(normalized))return {html:'Tôi chưa thể kết luận dự án đã hoàn tất pháp lý từ 10 hồ sơ hiện có. Bạn muốn kiểm tra phần đất đai, xây dựng hay nghĩa vụ tài chính? Tôi có thể đối chiếu từng nội dung với văn bản cụ thể.',docs:aquaChat.lastDocs};
 if(/liet ke|danh sach|bao nhieu (ho so|tai lieu)|10 (ho so|tai lieu)/.test(normalized)){
 let docs=aquaChat.scope?aquaDocuments.filter(d=>d.id===aquaChat.scope):aquaDocuments;
 const terms=aquaTokens(query).filter(t=>!['liet','ke','danh','sach','bao','nhieu','10'].includes(t));
 if(terms.length){const matching=docs.filter(d=>terms.some(t=>aquaNormalize(d.title+' '+d.category).includes(t)));if(matching.length)docs=matching;}
 return {html:`<p>${aquaChat.scope?'Trong phạm vi bạn chọn, tôi có hồ sơ sau':'Tôi có '+docs.length+' hồ sơ phù hợp để bạn tra cứu'}. Bạn có thể chọn một hồ sơ hoặc hỏi tiếp về nội dung cần biết.</p><ol class="aqua-doc-list">${docs.map(d=>`<li><strong>${esc(d.title)}</strong><small>${dateVN(d.issueDate)} · ${esc(d.category)}</small>${aquaCite(d,1,'Xem hồ sơ')}</li>`).join('')}</ol>`,docs:docs.map(d=>d.id)};
 }
 const explicit=aquaDocuments.filter(d=>normalized.includes(aquaNormalize(d.id))||((normalized.match(/\b\d{3,}\b/g)||[]).filter(n=>n!=='112').some(n=>aquaNormalize(d.title).includes(n))));
 const followup=/^(con |vay |the |no |van ban (do|nay)|ho so (do|nay)|so tien|ngay ban hanh|co quan ban hanh|ai ban hanh|tom tat|noi dung chinh)/.test(normalized)||/van ban (do|nay)|ho so (do|nay)/.test(normalized);
 let scope=aquaChat.scope||((explicit.length===1)?explicit[0].id:'');
 if(!scope&&followup&&aquaChat.lastDocs.length===1)scope=aquaChat.lastDocs[0];
 if(!scope&&followup&&aquaChat.lastDocs.length>1&&!explicit.length)return {html:`Bạn muốn hỏi tiếp về hồ sơ nào trong ${aquaChat.lastDocs.length} hồ sơ vừa tìm được? Chọn một nguồn hoặc nêu số văn bản giúp tôi nhé.`,docs:aquaChat.lastDocs};
 const metadata=/ngay (ban hanh|nao)|khi nao|co quan ban hanh|ai ban hanh/.test(normalized);
 if(metadata&&scope){const d=aquaDocuments.find(d=>d.id===scope);return {html:`<p>Với hồ sơ <strong>${esc(d.title)}</strong>, ${/co quan|ai ban hanh/.test(normalized)?'cơ quan được ghi trên danh mục là <strong>'+esc(d.issuer)+'</strong>':'ngày ban hành được ghi trên danh mục là <strong>'+dateVN(d.issueDate)+'</strong>'}.</p>${aquaCite(d,1,'Xem văn bản')}`,docs:[d.id]};}
 let effectiveQuery=query;
 if(scope&&/tom tat|noi dung chinh|noi gi|noi dung gi/.test(normalized))effectiveQuery=aquaDocuments.find(d=>d.id===scope).title;
 const found=retrieveAqua(effectiveQuery,scope);
 if(!found.results.length)return {html:'Chưa tìm thấy thông tin đủ rõ trong bộ hồ sơ hiện có để trả lời câu này. Bạn cho tôi số văn bản hoặc nói rõ nội dung muốn kiểm tra nhé?',docs:aquaChat.lastDocs};
 const results=found.results,docs=[...new Map(results.map(r=>[r.doc.id,r.doc])).values()];
 if(/so tien|bao nhieu tien|phai nop bao nhieu/.test(normalized)){
 const first=results[0],page=first.doc.pages[first.page-1].text.replace(/\s+/g,' ');
 const amount=page.match(/Tổng số tiền sử dụng đất phải nộp:\s*([\d.,]+\s*đồng)/iu);
 const remaining=page.match(/Số tiền còn phải nộp[^:]{0,100}:\s*([\d.,]+\s*đồng)/iu);
 if(amount||remaining)return {html:`<p>Theo <strong>${esc(first.doc.title)}</strong>, ${amount?'tổng số tiền sử dụng đất phải nộp ghi tại trang '+first.page+' là <strong>'+esc(amount[1])+'</strong>':''}${amount&&remaining?'; ':''}${remaining?'số tiền còn phải nộp ngân sách nhà nước là <strong>'+esc(remaining[1])+'</strong>':''}.</p><p>Đây là số tiền trong văn bản này; chưa đủ để kết luận nghĩa vụ tài chính của toàn bộ dự án.</p>${aquaAnswerSources([first],query)}`,docs:[first.doc.id]};
 }
 const summary=/tom tat|noi dung chinh|noi gi|noi dung gi/.test(normalized);
 const parts=results.map(c=>{const sentences=aquaRelevantSentences(c,effectiveQuery);return `<p>${results.length>1?'<strong>'+esc(c.doc.title)+'</strong><br>':''}${sentences.length?sentences.map(esc).join(' '):esc(aquaExcerpt(c,effectiveQuery))}</p>`;}).join('');
 return {html:`<p>${summary?'Văn bản bạn hỏi đề cập đến các nội dung sau:':docs.length===1?'Trong văn bản này, nội dung liên quan đến câu hỏi của bạn là:':'Tôi tìm được '+docs.length+' văn bản liên quan. Các nội dung đáng chú ý là:'}</p>${parts}${aquaAnswerSources(results,effectiveQuery)}`,docs:docs.map(d=>d.id)};
}
function aquaAIHTML(text,sources){
 let html=esc(text).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
 html=html.replace(/\[(AQUA112-\d{2}):(\d+)\]/g,(match,id,page)=>{const d=aquaDocuments.find(d=>d.id===id);return d&&sources.some(s=>s.id===id&&s.page===Number(page))?aquaCite(d,Number(page),'Nguồn'):'';});
 return html;
}
async function askAquaChat(preset){
 if(aquaChat.busy)return;
 const input=$('#aquaQuestion'),question=(preset!==undefined?preset:input.value).trim();if(!question)return;
 if(location.protocol==='file:'){
 aquaChat.messages.push({role:'user',text:question},{role:'assistant',html:'Bạn đang mở bản HTML ngoại tuyến nên chưa gọi được AI. <a href="http://127.0.0.1:8765/#p22/chat">Mở Chatbox có AI</a> hoặc chạy Mo-PLP-AI.cmd trong thư mục ứng dụng.'});renderAquaChat();return;
 }
 const scope=aquaChat.scope,project=aquaChat.project;
 const history=aquaChat.messages.filter(m=>m.scope===scope&&m.text&&!m.failed).slice(-10).map(m=>({role:m.role,text:m.text,sources:m.sources||[]}));
 aquaChat.messages.push({role:'user',text:question,scope});aquaChat.busy=true;
 const turn=++aquaChat.turn,controller=new AbortController();aquaChat.controller=controller;
 const timeout=setTimeout(()=>controller.abort(),105000);renderAquaChat();
 try{
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,scope,project,history,stream:true}),signal:controller.signal});
 let data;
 if(!response.ok){const error=await response.json();throw new Error(error.error||'Chưa nhận được phản hồi từ AI.');}
 if(response.headers.get('content-type')?.includes('text/event-stream')){
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',pending=null;
 function receive(frame){
 const kind=frame.match(/^event: (.+)$/m)?.[1],raw=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(!raw)return;
 const payload=JSON.parse(raw);
 if(kind==='error')throw new Error(payload.error||'Kết nối AI bị gián đoạn.');
 if(turn!==aquaChat.turn)return;
 if(kind==='delta'){
 if(!pending){pending={role:'assistant',text:'',html:'',scope,failed:true};aquaChat.messages.push(pending);renderAquaChat();}
 pending.text+=payload.text;pending.html=esc(pending.text).replace(/\n/g,'<br>');
 const messages=$('#aquaChatMessages'),bubble=messages.querySelector('.aqua-message:last-child');bubble.innerHTML=pending.html;messages.scrollTop=messages.scrollHeight;
 }else if(kind==='done')data=payload;
 }
 try{while(true){const chunk=await reader.read();buffer+=decoder.decode(chunk.value||new Uint8Array(),{stream:!chunk.done});let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);receive(frame);}if(chunk.done)break;}if(buffer.trim())receive(buffer);if(!data)throw new Error('Kết nối AI bị gián đoạn. Bạn gửi lại câu hỏi nhé.');}
 finally{reader.releaseLock();if(pending&&turn===aquaChat.turn){const index=aquaChat.messages.indexOf(pending);if(index>=0)aquaChat.messages.splice(index,1);}}
 }else data=await response.json();
 if(turn!==aquaChat.turn)return;
 if(typeof data.text!=='string'||!Array.isArray(data.sources))throw new Error('Phản hồi AI không hợp lệ.');
 const sources=data.sources.filter(s=>aquaDocuments.some(d=>d.id===s.id&&Number.isInteger(s.page)&&s.page>0&&s.page<=d.pageCount));
 aquaChat.messages.push({role:'assistant',text:data.text,html:aquaAIHTML(data.text,sources),sources:[...new Set(sources.map(s=>s.id))],scope});
 aquaChat.lastDocs=[...new Set(sources.map(s=>s.id))];
 }catch(error){
 if(turn!==aquaChat.turn)return;
 aquaChat.messages.push({role:'assistant',html:esc(error.name==='AbortError'?'AI phản hồi chậm. Bạn gửi lại câu hỏi nhé.':error.message),failed:true,scope});
 }finally{
 clearTimeout(timeout);if(turn===aquaChat.turn){aquaChat.busy=false;aquaChat.controller=null;renderAquaChat();$('#aquaQuestion').focus();}
 }
}
if(current.gi===5)render();
function openAquaChatRoute(){if(location.hash==='#p22/chat'){archiveState.selected=aquaProjectFolder.id;archiveState.expanded.add(aquaProjectFolder.parent.id);archiveState.expanded.add(aquaProjectFolder.id);renderArchiveExplorer();openAquaChat();}}
window.addEventListener('hashchange',openAquaChatRoute);
openAquaChatRoute();

function syncAquaChatLauncher(){
 const button=$('#aquaChatLauncher');if(!button)return;
 button.setAttribute('aria-expanded',String(aquaChat.open));
 button.setAttribute('aria-label',aquaChat.open?'Thu gọn Chatbox Pháp lý':'Mở Chatbox Pháp lý');
 button.title=aquaChat.open?'Thu gọn Chatbox Pháp lý':'Chatbox Pháp lý';
 button.innerHTML=aquaChat.open?icon('close'):'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4h2A8.5 8.5 0 0 1 21 11.5Z"/><path d="M7 11h9M7 15h6"/></svg>';
}
const aquaChatLauncher=document.createElement('button');
aquaChatLauncher.id='aquaChatLauncher';aquaChatLauncher.className='aqua-chat-launcher';aquaChatLauncher.type='button';aquaChatLauncher.setAttribute('aria-controls','aquaChat');
aquaChatLauncher.addEventListener('click',()=>aquaChat.open?closeAquaChat():openAquaChat());
document.body.appendChild(aquaChatLauncher);syncAquaChatLauncher();

function changeAquaChatProject(id){
 const project=archiveNodes.get(id);if(!project||project.depth!==1||project.parent.name==='00 TÀI LIỆU CHUNG')return;
 aquaChat.project=id;aquaChat.scope='';clearAquaChat();
}

const aquaProjectPicker={matches:[],index:-1};
function openAquaProjectPicker(){const input=$('#aquaChatScope');input.value='';input.placeholder=archiveNodes.get(aquaChat.project)?.name||'Tìm dự án…';filterAquaProjects('');}
function filterAquaProjects(query){
 const q=normalize(query.trim());
 aquaProjectPicker.matches=PLP_ARCHIVE_TREE.roots.filter(r=>r.name!=='00 TÀI LIỆU CHUNG').flatMap(r=>r.children.map(p=>({id:p.id,name:p.name,region:r.name}))).filter(p=>normalize(p.name+' '+p.region).includes(q));
 aquaProjectPicker.index=-1;const input=$('#aquaChatScope'),list=$('#aquaProjectOptions');
 input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');list.hidden=false;
 list.innerHTML=aquaProjectPicker.matches.length?aquaProjectPicker.matches.map((p,i)=>`<button type="button" id="aquaProjectOption${i}" role="option" aria-selected="${p.id===aquaChat.project}" tabindex="-1" onmousedown="event.preventDefault()" onclick="changeAquaChatProject('${p.id}')"><span>${esc(p.name)}</span><small>${esc(p.region)}</small></button>`).join(''):'<div class="aqua-project-empty" role="status">Không tìm thấy dự án.</div>';
}
function closeAquaProjectPicker(){const input=$('#aquaChatScope'),list=$('#aquaProjectOptions');if(!input||!list)return;list.hidden=true;input.value=archiveNodes.get(aquaChat.project)?.name||'';input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
function aquaProjectKeydown(event){
 const list=$('#aquaProjectOptions');
 if(event.key==='Escape'||event.key==='Tab'){if(event.key==='Escape')event.preventDefault();closeAquaProjectPicker();return;}
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
 event.preventDefault();if(list.hidden)filterAquaProjects('');const length=aquaProjectPicker.matches.length;if(!length)return;
 aquaProjectPicker.index=aquaProjectPicker.index<0?(event.key==='ArrowDown'?0:length-1):(aquaProjectPicker.index+(event.key==='ArrowDown'?1:-1)+length)%length;
 list.querySelectorAll('[role="option"]').forEach((el,i)=>el.classList.toggle('highlighted',i===aquaProjectPicker.index));
 const active=$('#aquaProjectOption'+aquaProjectPicker.index);$('#aquaChatScope').setAttribute('aria-activedescendant',active.id);active.scrollIntoView({block:'nearest'});
 }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();const p=aquaProjectPicker.matches[aquaProjectPicker.index<0?0:aquaProjectPicker.index];if(p){changeAquaChatProject(p.id);$('#aquaQuestion').focus();}}
}
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.aqua-project-picker'))closeAquaProjectPicker();});
