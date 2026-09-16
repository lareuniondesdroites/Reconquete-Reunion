(function(){
  const autoData = Array.isArray(window.LOCAL_AUTO_DATA) ? window.LOCAL_AUTO_DATA : [];
  const manualData = Array.isArray(window.LOCAL_MANUAL_DATA) ? window.LOCAL_MANUAL_DATA : [];
  const all = [...manualData, ...autoData].filter(Boolean).sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fmt = d => { if(!d) return ''; const x = new Date(d+'T12:00:00'); return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}); };
  const typeLabel = t => ({communique:'Communiqué',article:'Actualité',evenement:'Événement',terrain:'Sur le terrain',video:'Vidéo'}[t] || 'Publication');
  const badgeClass = t => t === 'communique' ? 'local-badge communique' : t === 'evenement' ? 'local-badge event' : 'local-badge';

  function card(item){
    const themes=(item.themes||[]).slice(0,3).map(t=>`<span class="archive-chip">${esc(t)}</span>`).join('');
    const href=item.url ? `href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"` : '';
    const action=item.url ? `<a class="text-link" ${href}>Voir la source →</a>` : '';
    return `<article class="local-card" data-local-type="${esc(item.type||'article')}" data-local-zone="${esc(item.zone||'La Réunion')}" data-local-year="${esc((item.date||'').slice(0,4))}">
      <div class="local-card-head"><span class="${badgeClass(item.type)}">${esc(typeLabel(item.type))}</span><time>${esc(fmt(item.date))}</time></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.excerpt||'Publication locale de la fédération.')}</p>
      <div class="local-meta"><span>${esc(item.zone||'La Réunion')}</span>${item.commune?`<span>${esc(item.commune)}</span>`:''}<span>${esc(item.sourceKind||item.source||'Source locale')}</span></div>
      <div class="archive-chips">${themes}</div>${action}
    </article>`;
  }

  function renderLatest(){
    document.querySelectorAll('[data-local-latest]').forEach(el=>{
      const count=Number(el.dataset.localLatest||3);
      const types=(el.dataset.types||'').split(',').map(x=>x.trim()).filter(Boolean);
      const data=types.length?all.filter(x=>types.includes(x.type)):all;
      el.innerHTML=data.slice(0,count).map(card).join('') || '<div class="archive-empty">Aucune publication locale à afficher.</div>';
    });
  }

  function renderArchive(){
    const root=document.querySelector('[data-local-archive]'); if(!root) return;
    const typeSel=document.querySelector('#local-type'); const zoneSel=document.querySelector('#local-zone'); const yearSel=document.querySelector('#local-year'); const q=document.querySelector('#local-q');
    const options=(sel,vals)=>{ if(!sel)return; [...new Set(vals.filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);}); };
    options(zoneSel,all.map(x=>x.zone||'La Réunion')); options(yearSel,all.map(x=>(x.date||'').slice(0,4)).filter(Boolean).sort().reverse());
    const update=()=>{
      const term=(q?.value||'').trim().toLowerCase();
      const data=all.filter(x=>(!typeSel?.value||x.type===typeSel.value)&&(!zoneSel?.value||(x.zone||'La Réunion')===zoneSel.value)&&(!yearSel?.value||(x.date||'').startsWith(yearSel.value))&&(!term||[x.title,x.excerpt,x.zone,x.commune,...(x.themes||[])].join(' ').toLowerCase().includes(term)));
      root.innerHTML=data.map(card).join('')||'<div class="archive-empty">Aucun résultat pour ces filtres.</div>';
      const count=document.querySelector('[data-local-count]'); if(count) count.textContent=`${data.length} publication${data.length>1?'s':''}`;
    };
    [typeSel,zoneSel,yearSel].forEach(x=>x?.addEventListener('change',update)); q?.addEventListener('input',update); update();
  }

  function renderCommuniques(){
    const root=document.querySelector('[data-local-communiques]'); if(!root)return;
    const data=all.filter(x=>x.type==='communique'); root.innerHTML=data.map(card).join('')||'<div class="archive-empty">Aucun communiqué archivé.</div>';
  }

  function renderAgenda(){
    const root=document.querySelector('[data-local-agenda]'); if(!root)return;
    const today=new Date(); today.setHours(0,0,0,0);
    const data=all.filter(x=>x.type==='evenement' && x.date && new Date(x.date+'T12:00:00')>=today).sort((a,b)=>a.date.localeCompare(b.date));
    root.innerHTML=data.map(x=>`<article class="event local-event"><div class="datebox">${esc(new Date(x.date+'T12:00:00').getDate())}<span>${esc(new Date(x.date+'T12:00:00').toLocaleDateString('fr-FR',{month:'short'}))}</span></div><div><strong>${esc(x.title)}</strong><div class="meta">${esc([x.commune,x.zone,x.time].filter(Boolean).join(' • ')||'La Réunion')}</div><p>${esc(x.excerpt||'')}</p></div></article>`).join('')||'<div class="archive-empty">Aucun événement futur n’est encore renseigné dans la base locale manuelle.</div>';
  }

  function renderTerrain(){
    document.querySelectorAll('[data-terrain-zone]').forEach(root=>{
      const z=root.dataset.terrainZone;
      const data=all.filter(x=>x.type==='terrain' && (x.zone||'')===z);
      root.innerHTML=data.map(card).join('')||`<div class="terrain-empty">Aucun compte rendu terrain publié pour la zone ${esc(z)}.</div>`;
    });
  }

  function renderHomeLatest(){
    const root=document.querySelector('#home-local-latest'); if(!root)return;
    const item=all[0]; if(!item) return;
    root.innerHTML=`<span class="tag">${esc(typeLabel(item.type))}</span><h3>${esc(item.title)}</h3><p>${esc(item.excerpt||'Publication locale de la fédération.')}</p><div class="meta">${esc(fmt(item.date))} • ${esc(item.sourceKind||'Source officielle')}</div>${item.url?`<p><a class="text-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Voir la source →</a></p>`:''}`;
  }

  document.addEventListener('DOMContentLoaded',()=>{renderLatest();renderArchive();renderCommuniques();renderAgenda();renderTerrain();renderHomeLatest();});
})();
