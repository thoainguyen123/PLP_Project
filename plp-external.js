'use strict';
// Share the archive explorer's layout and tree styling; keep business records separate.
const externalNodes=new Map();
const externalFolders=PLP_MENU[4].pages;
const externalRoots=['Vùng Bình Thuận','Vùng Đồng Nai','Vùng Bà Rịa - Vũng Tàu'].map((name,i)=>({id:`ext-region-${i}`,name,children:[{id:`ext-project-${i}`,name:projectCatalog[i].name,project:projectCatalog[i].name,children:externalFolders.map(p=>({id:`ext-${i}-${p.id}`,name:p.name,page:p.id,project:projectCatalog[i].name,children:[]}))}]}));
function prepareExternalNode(node,parent=null){node.parent=parent;node.depth=parent?parent.depth+1:0;externalNodes.set(node.id,node);node.children.forEach(n=>prepareExternalNode(n,node));}
externalRoots.forEach(n=>prepareExternalNode(n));
const externalState={selected:'all',expanded:new Set(),treeQuery:'',treeVisible:true,route:''};
function externalProjects(node){if(!node)return projects;if(node.project)return [node.project];return node.children.flatMap(externalProjects);}
function externalCount(node){const allowed=externalProjects(node),page=node?.page||current.id;return records[page].filter(r=>allowed.includes(r.project)).length;}
const filteredBeforeExternal=filtered;
filtered=function(){const rows=filteredBeforeExternal();if(current.gi!==4)return rows;const node=externalNodes.get(externalState.selected),allowed=externalProjects(node);return rows.filter(r=>allowed.includes(r.project));};
const renderBeforeExternal=render;
render=function(){if(current.gi===4){renderExternalExplorer();return;}renderBeforeExternal();};
function renderExternalExplorer(){
 if(externalState.route!==location.hash){
   const id=location.hash.split('/')[1],node=externalNodes.get(id);
   externalState.selected=node&&(!node.page||node.page===current.id)?id:'all';
   externalState.route=location.hash;externalState.treeQuery='';
   for(let n=externalNodes.get(externalState.selected)?.parent;n;n=n.parent)externalState.expanded.add(n.id);
 }
 const selected=externalNodes.get(externalState.selected);
 activeProject=selected?.project?projectCatalog.find(p=>p.name===selected.project):null;
 $('#workspace').innerHTML=`<div class="page-heading"><h1>${esc(current.name)}</h1><div class="heading-actions">${btn('Tạo mới','onclick="openExternalCreate()"','primary','plus')}</div></div><section class="panel archive-browser ${externalState.treeVisible?'':'archive-tree-hidden'}"><aside class="archive-tree-panel"><div class="archive-tree-heading"><strong>Cây thư mục đối ngoại</strong><button class="btn ghost small" onclick="collapseExternalTree()" title="Thu gọn các nhánh">−</button></div><label class="filter-search archive-tree-search">${icon('search')}<input id="externalTreeSearch" aria-label="Tìm thư mục đối ngoại" placeholder="Tìm vùng, dự án, thư mục…" value="${esc(externalState.treeQuery)}" oninput="externalState.treeQuery=this.value;renderExternalTree()"></label><div id="externalTree" class="archive-tree" role="tree" aria-label="Cấu trúc thư mục đối ngoại"></div></aside><div class="archive-documents external-documents"><div class="archive-location"><button class="btn ghost small" onclick="toggleExternalTreePanel()" aria-label="Ẩn hoặc hiện cây thư mục đối ngoại">${icon('grid')}</button><nav id="externalBreadcrumb" aria-label="Đường dẫn thư mục đối ngoại"></nav></div>${tablePanel()}</div></section>`;
 renderExternalTree();renderExternalBreadcrumb();renderRows();
}
function renderExternalTree(){
 const q=normalize(externalState.treeQuery.trim()),allowed=new Set();
 if(q)externalNodes.forEach(n=>{if(normalize(n.name).includes(q))for(let p=n;p;p=p.parent)allowed.add(p.id);});
 function branch(n,parentMatch=false){
   const matched=parentMatch||Boolean(q&&normalize(n.name).includes(q));
   if(q&&!allowed.has(n.id)&&!parentMatch)return '';
   const open=Boolean(q)||externalState.expanded.has(n.id),count=externalCount(n);
   return `<div class="archive-tree-node" role="treeitem" aria-level="${n.depth+1}" aria-selected="${externalState.selected===n.id}" ${n.children.length?`aria-expanded="${open}"`:''}><div class="archive-tree-row ${externalState.selected===n.id?'selected':''}" style="padding-left:${8+n.depth*17}px">${n.children.length?`<button class="archive-expander" aria-label="${open?'Thu gọn':'Mở rộng'} ${esc(n.name)}" onclick="toggleExternalBranch('${n.id}')">${open?'−':'+'}</button>`:'<span class="archive-leaf-line"></span>'}<button class="archive-tree-label" title="${esc(n.name)}" onclick="selectExternalFolder('${n.id}')">${archiveFolderIcon}<span>${esc(n.name)}</span>${count?`<small>${count}</small>`:''}</button></div>${open&&n.children.length?`<div role="group">${n.children.map(c=>branch(c,matched)).join('')}</div>`:''}</div>`;
 }
 $('#externalTree').innerHTML=`<div class="archive-tree-row ${externalState.selected==='all'?'selected':''}"><button class="archive-tree-label" onclick="selectExternalFolder('all')">${archiveFolderIcon}<span>Quản lý đối ngoại</span><small>${records[current.id].length}</small></button></div>`+externalRoots.map(n=>branch(n)).join('')+(q&&!allowed.size?'<p class="archive-tree-empty">Không tìm thấy thư mục.</p>':'');
}
function toggleExternalBranch(id){externalState.expanded.has(id)?externalState.expanded.delete(id):externalState.expanded.add(id);renderExternalTree();}
function collapseExternalTree(){externalState.expanded.clear();externalState.treeQuery='';$('#externalTreeSearch').value='';renderExternalTree();}
function selectExternalFolder(id){
 const node=externalNodes.get(id);if(id!=='all'&&!node)return;
 const hash=`#${node?.page||current.id}${id==='all'?'':'/'+id}`;
 if(location.hash===hash){resetFilterState();renderExternalExplorer();}else location.hash=hash;
}
function renderExternalBreadcrumb(){
 const parts=[];for(let n=externalNodes.get(externalState.selected);n;n=n.parent)parts.unshift(n);
 $('#externalBreadcrumb').innerHTML='<button onclick="selectExternalFolder(\'all\')">Quản lý đối ngoại</button>'+parts.map(n=>`<span>/</span><button onclick="selectExternalFolder('${n.id}')" title="${esc(n.name)}">${esc(n.name)}</button>`).join('');
}
function toggleExternalTreePanel(){externalState.treeVisible=!externalState.treeVisible;$('.archive-browser').classList.toggle('archive-tree-hidden',!externalState.treeVisible);}
function openExternalCreate(){openCreate();if(activeProject)$('#createForm [name="project"]').innerHTML=`<option>${esc(activeProject.name)}</option>`;}
if(current.gi===4)render();
