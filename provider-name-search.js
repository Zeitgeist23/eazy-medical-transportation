(()=>{
  'use strict';
  let indexPromise=null,profilePromise=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const queryValue=()=>String(document.getElementById('mLocation')?.value||document.getElementById('location')?.value||'').trim();
  const hasZip=q=>/\b\d{5}(?:-\d{4})?\b/.test(q);
  const hasState=q=>/(?:^|[\s,])(AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)(?:$|[\s,])/i.test(q);
  function scoreName(name,q){const n=norm(name),x=norm(q);if(!n||!x)return 0;if(n===x)return 100;if(n.startsWith(x))return 92;if(n.includes(x))return 84;const terms=x.split(/\s+/).filter(t=>t.length>1);if(terms.length>=2&&terms.every(t=>n.includes(t)))return 74;return 0}
  function openModal(title,html){const w=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');if(!w||!t||!b)return;t.textContent=title;b.innerHTML=html;w.classList.add('open')}
  async function loadIndex(){if(!indexPromise)indexPromise=fetch('/data/provider-name-index.json?v=4',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Provider name index unavailable');return r.json()});return indexPromise}
  async function loadProfiles(){if(!profilePromise)profilePromise=fetch('/providers/index.json?v=4',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(a=>Object.fromEntries(a.map(x=>[String(x.npi),x.url]))).catch(()=>({}));return profilePromise}
  function resultsHtml(list,q,profiles){
    if(!list.length)return `<div class="claim-callout">No provider-name matches were found for “${esc(q)}”.</div>`;
    return `<div class="claim-callout">Provider-name matches from the national Eazy NEMT directory. Verify current services directly with the provider.</div><div class="results">${list.map(p=>{
      const u=profiles[String(p.npi)]||'';
      const categories=Array.isArray(p.categories)?p.categories:[];
      const tags=['NEMT',...categories].slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
      const claimed=p.claimed?'<span class="claim-badge">Claimed profile</span>':'';
      const website=p.website?`<a class="btn-secondary" href="${esc(p.website)}" target="_blank" rel="nofollow noopener" data-event="provider_website_click">Website</a>`:'';
      return `<div class="result"><h3>${esc(p.name)} ${claimed}</h3><p>${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city||'')}, ${esc(p.state||'')} ${esc(String(p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}${p.npi?`<br>NPI: ${esc(p.npi)}`:''}${p.serviceArea?`<br>Service area: ${esc(p.serviceArea)}`:''}</p><div class="tags" style="margin-top:8px">${tags}</div><div class="result-actions">${u?`<a class="btn-primary" href="${esc(u)}" data-event="provider_profile_view">Provider Profile</a>`:''}${p.phone?`<a class="btn-secondary" href="tel:${esc(p.phone)}" data-event="provider_call">Call Provider</a>`:''}${website}</div></div>`
    }).join('')}</div>`
  }
  function fallbackToLocationSearch(){if(typeof window.__eazyIndependentSearch==='function')return window.__eazyIndependentSearch();if(typeof window.runSearch==='function')return window.runSearch()}
  async function smartSearch(q){if(!q||hasZip(q)||hasState(q))return fallbackToLocationSearch();openModal('Find Providers','<div class="claim-callout">Searching provider names…</div>');try{const [data,profiles]=await Promise.all([loadIndex(),loadProfiles()]),all=data.providers||[],x=norm(q);if(all.some(p=>norm(p.city)===x))return fallbackToLocationSearch();const strong=all.map(p=>({p,score:scoreName(p.name,q)})).filter(x=>x.score>=74).sort((a,b)=>b.score-a.score||String(a.p.name).localeCompare(String(b.p.name))).slice(0,100).map(x=>x.p);if(!strong.length)return fallbackToLocationSearch();openModal(`Provider matches for “${q}” (${strong.length})`,resultsHtml(strong,q,profiles));window.__eazyTrack?.('provider_search_results',{query:q,count:strong.length})}catch(e){console.error('Provider-name search failed',e);fallbackToLocationSearch()}}
  function intercept(e){const q=queryValue();if(!q)return false;e.preventDefault();e.stopImmediatePropagation();smartSearch(q);return true}
  document.addEventListener('click',e=>{const el=e.target.closest?.('[aria-label="Find Providers"]');if(el)intercept(e)},true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target?.id==='location'||e.target?.id==='mLocation'))intercept(e)},true);
  document.addEventListener('submit',e=>{if(e.target?.id==='mSearch')intercept(e)},true);
  window.__eazyProviderNameSearch=smartSearch;
})();
