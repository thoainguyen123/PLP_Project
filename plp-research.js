'use strict';
let researchView='library',researchFilters={q:'',group:'',kind:''},researchLocation='';
const researchRoutes=[
 {key:'',label:'Tất cả danh mục',group:''},
 {key:'regulations',label:PLP_RESEARCH_CATALOG.groups[0],group:PLP_RESEARCH_CATALOG.groups[0]},
 {key:'sop',label:PLP_RESEARCH_CATALOG.groups[1],group:PLP_RESEARCH_CATALOG.groups[1]},
 {key:'case-study',label:PLP_RESEARCH_CATALOG.groups[2],group:PLP_RESEARCH_CATALOG.groups[2]},
 {key:'qa',label:PLP_RESEARCH_CATALOG.groups[3],group:PLP_RESEARCH_CATALOG.groups[3]}
];
function currentResearchRoute(){const key=location.hash.split('/')[1]||'';return researchRoutes.find(r=>r.key===key)||researchRoutes[0];}
function mountResearchNav(){const submenu=$('#navigation [data-group="3"] .nvg-submenu');if(!submenu)return;const active=currentResearchRoute();submenu.innerHTML=researchRoutes.map(r=>`<a class="nvg-submenu-item ${current.id==='p13'&&r.key===active.key?'active':''}" href="#p13${r.key?'/'+r.key:''}" data-research-group="${esc(r.group)}" title="${esc(r.label)}" ${current.id==='p13'&&r.key===active.key?'aria-current="page"':''} onclick="event.preventDefault();openResearchCategory('${r.key}')"><span>${esc(r.label)}</span></a>`).join('');}
const renderNavBeforeResearch=renderNav;
renderNav=function(){renderNavBeforeResearch();mountResearchNav();};
const renderBeforeResearch=render;
render=function(){
 if(current.id==='p13'){
  if(researchLocation!==location.hash){researchLocation=location.hash;researchView='library';researchFilters={q:'',group:currentResearchRoute().group,kind:''};}
  if(researchView==='library'){renderResearchLibrary();return;}
 }
 renderBeforeResearch();
 if(current.id==='p13')$('.heading-actions').insertAdjacentHTML('afterbegin',btn('Thư viện SharePoint','onclick="showResearchLibrary()"','','book'));
};
function openResearchCategory(key){const target=researchRoutes.find(r=>r.key===key)||researchRoutes[0];researchView='library';researchFilters={q:'',group:target.group,kind:''};const hash='#p13'+(target.key?'/'+target.key:'');if(location.hash===hash){mountResearchNav();render();}else location.hash=hash;}
function showResearchLibrary(){researchView='library';researchFilters={q:'',group:currentResearchRoute().group,kind:''};render();}
function showResearchTracking(){researchView='tracking';resetFilterState();render();}
function renderResearchLibrary(){const cat=PLP_RESEARCH_CATALOG,route=currentResearchRoute(),count=cat.entries.filter(e=>!route.group||e.group===route.group).length;
 $('#breadcrumb').innerHTML=`<a class="nvg-breadcrumb-item" href="#p13">Nghiên cứu VBPL</a><span class="nvg-breadcrumb-separator">/</span><span class="nvg-breadcrumb-item current" title="${esc(route.label)}">${esc(route.label)}</span>`;
 document.title=`${route.label} · Nghiên cứu VBPL · NovaGroup PLP`;
 $('#workspace').innerHTML=`<div class="page-heading"><h1>${esc(route.label)}</h1><div class="heading-actions">${btn('Theo dõi văn bản','onclick="showResearchTracking()"','primary','file')}</div></div><section class="panel research-library"><div class="panel-head"><h2 class="panel-title">Thư viện pháp lý dự án <span class="count">${count} danh mục / liên kết</span></h2><a class="btn small" href="${esc(cat.sourceUrl)}" target="_blank" rel="noopener noreferrer">Mở thư viện gốc ${icon('arrow')}</a></div><div class="research-content"><div class="filterbar"><label class="filter-search">${icon('search')}<input id="researchSearch" aria-label="Tìm danh mục thư viện" placeholder="Tìm lĩnh vực, danh mục, SOP…" value="${esc(researchFilters.q)}" oninput="researchFilters.q=this.value;renderResearchRows()"></label><select class="select" id="researchKind" aria-label="Lọc loại tài liệu" onchange="researchFilters.kind=this.value;renderResearchRows()"><option value="">Tất cả loại tài liệu</option>${[...new Set(cat.entries.filter(e=>!route.group||e.group===route.group).map(e=>e.kind))].map(k=>`<option ${researchFilters.kind===k?'selected':''}>${esc(k)}</option>`).join('')}</select>${btn('Đặt lại','onclick="showResearchLibrary()"','ghost small')}</div><div class="table-wrap"><table><thead><tr><th>STT</th><th>Danh mục / lĩnh vực</th><th>Nhóm tài liệu</th><th>Nguồn</th><th></th></tr></thead><tbody id="researchBody"></tbody></table></div><div class="pager"><span id="researchResultCount"></span><span>Danh mục và liên kết từ thư viện nguồn</span></div></div></section>`;
 renderResearchRows();
}
function setResearchGroup(group){openResearchCategory(researchRoutes.find(r=>r.group===group)?.key||'');}
function researchResults(){const q=normalize(researchFilters.q.trim());return PLP_RESEARCH_CATALOG.entries.filter(e=>(!researchFilters.group||e.group===researchFilters.group)&&(!researchFilters.kind||e.kind===researchFilters.kind)&&(!q||normalize(e.name+' '+e.kind+' '+e.group).includes(q)));}
function renderResearchRows(){const rows=researchResults(),total=PLP_RESEARCH_CATALOG.entries.filter(e=>!researchFilters.group||e.group===researchFilters.group).length;$('#researchBody').innerHTML=rows.map((e,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><a class="record-link" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.name)}<span class="record-code">${esc(e.resourceType)}</span></a>${e.note?`<p class="research-entry-note">${esc(e.note)}</p>`:''}</td><td>${esc(e.kind)}</td><td><span class="tag green">SharePoint</span></td><td><a class="btn small" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Mở ${icon('arrow')}</a></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Không tìm thấy danh mục phù hợp. Hãy thay đổi bộ lọc hoặc tìm kiếm.</td></tr>';$('#researchResultCount').textContent=`${rows.length} / ${total} danh mục / liên kết`;}
mountResearchNav();
if(current.id==='p13')render();
