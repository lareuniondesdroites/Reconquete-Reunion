(()=>{
const manualInterviews=(window.INTERVIEW_ARCHIVE||[]).map(x=>({...x,type:'interview',auto:false,sourceKind:x.sourceKind||'Archive vérifiée'}));
const manualSpeeches=(window.SPEECH_ARCHIVE||[]).map(x=>({...x,auto:false,sourceKind:x.sourceKind||'Archive vérifiée'}));
const automatic=(window.AUTO_MEDIA_ARCHIVE||[]).map(x=>({...x,auto:true}));
const data=[...manualInterviews,...manualSpeeches,...automatic]
 .filter(x=>x&&x.date&&x.title&&x.url)
 .sort((a,b)=>String(b.date).localeCompare(String(a.date)));

const q=document.querySelector('#archive-q'),person=document.querySelector('#archive-person'),media=document.querySelector('#archive-media'),year=document.querySelector('#archive-year'),theme=document.querySelector('#archive-theme'),origin=document.querySelector('#archive-origin'),count=document.querySelector('#archive-count'),results=document.querySelector('#archive-results'),empty=document.querySelector('#archive-empty'),reset=document.querySelector('#archive-reset'),featured=document.querySelector('#archive-featured-grid'),typeButtons=[...document.querySelectorAll('.archive-type-btn')];
let activeType='all';
const params=new URLSearchParams(location.search); const requested=params.get('type'); if(requested==='interview'||requested==='speech') activeType=requested;

const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const esc=s=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate=iso=>new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));
const unique=arr=>[...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'fr'));
const broadType=x=>x.type==='interview'?'interview':'speech';

unique(data.map(x=>x.media)).forEach(v=>media.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));
unique(data.map(x=>x.date.slice(0,4))).sort((a,b)=>b-a).forEach(v=>year.insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
unique(data.flatMap(x=>x.themes||[])).forEach(v=>theme.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));

typeButtons.forEach(btn=>{if(btn.dataset.type===activeType)btn.classList.add('active');else btn.classList.remove('active');btn.addEventListener('click',()=>{activeType=btn.dataset.type;typeButtons.forEach(b=>b.classList.toggle('active',b===btn));render();});});

function typeLabel(x){return x.type==='interview'?'Interview':x.type==='meeting'?'Meeting':'Discours';}
function card(x,compact=false){
 const tags=(x.themes||[]).map(t=>`<span class="archive-chip">${esc(t)}</span>`).join('');
 const visual=x.video?`<a class="archive-thumb" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" aria-label="Voir la source vidéo"><img src="https://i.ytimg.com/vi/${esc(x.video)}/hqdefault.jpg" alt="" loading="lazy"><span class="play-badge">▶</span></a>`:`<a class="archive-thumb archive-thumb-placeholder" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(x.media)}</span><strong>${esc(x.personLabel||'Reconquête')}</strong></a>`;
 const auto=x.auto?'<span class="auto-badge">Auto</span>':'<span class="verified-badge">Archivé</span>';
 return `<article class="archive-card${compact?' compact':''}">${visual}<div class="archive-card-body"><div class="archive-card-top"><span class="tag">${esc(typeLabel(x))}</span><time datetime="${x.date}">${formatDate(x.date)}</time></div><div class="archive-meta-line"><strong>${esc(x.personLabel||'Reconquête')}</strong>${auto}</div><h3>${esc(x.title)}</h3><div class="archive-media">${esc(x.media||'Source publique')}</div><div class="archive-chips">${tags}</div><a class="text-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Ouvrir la source publique ↗</a></div></article>`;
}
function current(){
 const query=norm(q.value.trim());
 return data.filter(x=>{const hay=norm([x.personLabel,x.media,x.title,(x.themes||[]).join(' '),x.date,typeLabel(x)].join(' ')); return (!query||query.split(/\s+/).every(w=>hay.includes(w)))&&(activeType==='all'||broadType(x)===activeType)&&(person.value==='all'||x.person===person.value)&&(media.value==='all'||x.media===media.value)&&(year.value==='all'||x.date.startsWith(year.value))&&(theme.value==='all'||(x.themes||[]).includes(theme.value))&&(origin.value==='all'||(origin.value==='auto'?x.auto:!x.auto));});
}
function render(){const found=current();count.textContent=`${found.length} contenu${found.length>1?'s':''} affiché${found.length>1?'s':''}`;empty.hidden=found.length!==0;let out='',lastYear='';found.forEach(x=>{const y=x.date.slice(0,4);if(y!==lastYear){out+=`<div class="timeline-year"><span>${y}</span></div>`;lastYear=y;}out+=card(x);});results.innerHTML=out;featured.innerHTML=found.slice(0,3).map(x=>card(x,true)).join('');}
[q,person,media,year,theme,origin].forEach(el=>el.addEventListener(el===q?'input':'change',render));
reset.addEventListener('click',()=>{q.value='';person.value=media.value=year.value=theme.value=origin.value='all';activeType='all';typeButtons.forEach(b=>b.classList.toggle('active',b.dataset.type==='all'));render();});
render();
})();
