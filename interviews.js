(function(){
const data=(window.INTERVIEW_ARCHIVE||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
const q=document.getElementById('archive-q');
const person=document.getElementById('archive-person');
const media=document.getElementById('archive-media');
const year=document.getElementById('archive-year');
const theme=document.getElementById('archive-theme');
const reset=document.getElementById('archive-reset');
const count=document.getElementById('archive-count');
const results=document.getElementById('archive-results');
const featured=document.getElementById('archive-featured-grid');
const empty=document.getElementById('archive-empty');
if(!results||!data.length)return;

const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const esc=s=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate=iso=>new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));
const unique=arr=>[...new Set(arr)].sort((a,b)=>String(a).localeCompare(String(b),'fr'));

unique(data.map(x=>x.media)).forEach(v=>media.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));
unique(data.map(x=>x.date.slice(0,4))).sort((a,b)=>b-a).forEach(v=>year.insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
unique(data.flatMap(x=>x.themes)).forEach(v=>theme.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`));

function card(x,compact=false){
 const tags=x.themes.map(t=>`<span class="archive-chip">${esc(t)}</span>`).join('');
 const visual=x.video
  ? `<a class="archive-thumb" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" aria-label="Voir la source vidéo"><img src="https://i.ytimg.com/vi/${esc(x.video)}/hqdefault.jpg" alt="" loading="lazy"><span class="play-badge">▶</span></a>`
  : `<a class="archive-thumb archive-thumb-placeholder" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(x.media)}</span><strong>${esc(x.personLabel)}</strong></a>`;
 return `<article class="archive-card${compact?' compact':''}">
   ${visual}
   <div class="archive-card-body">
    <div class="archive-card-top"><span class="tag">${esc(x.personLabel)}</span><time datetime="${x.date}">${formatDate(x.date)}</time></div>
    <h3>${esc(x.title)}</h3>
    <div class="archive-media">${esc(x.media)}</div>
    <div class="archive-chips">${tags}</div>
    <a class="text-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Ouvrir la source publique ↗</a>
   </div>
 </article>`;
}

function current(){
 const query=norm(q.value.trim());
 return data.filter(x=>{
   const hay=norm([x.personLabel,x.media,x.title,(x.themes||[]).join(' '),x.date].join(' '));
   return (!query||query.split(/\s+/).every(w=>hay.includes(w)))
    && (person.value==='all'||x.person===person.value)
    && (media.value==='all'||x.media===media.value)
    && (year.value==='all'||x.date.startsWith(year.value))
    && (theme.value==='all'||x.themes.includes(theme.value));
 });
}

function render(){
 const found=current();
 count.textContent=`${found.length} interview${found.length>1?'s':''} affichée${found.length>1?'s':''}`;
 empty.hidden=found.length!==0;
 let out='', lastYear='';
 found.forEach(x=>{
   const y=x.date.slice(0,4);
   if(y!==lastYear){out+=`<div class="timeline-year"><span>${y}</span></div>`;lastYear=y;}
   out+=card(x);
 });
 results.innerHTML=out;
 const recent=found.slice(0,3);
 featured.innerHTML=recent.map(x=>card(x,true)).join('');
}

[q,person,media,year,theme].forEach(el=>el.addEventListener(el===q?'input':'change',render));
reset.addEventListener('click',()=>{q.value='';person.value=media.value=year.value=theme.value='all';render();});
render();
})();