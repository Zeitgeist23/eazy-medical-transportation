(()=>{
  'use strict';

  const states=['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  const stateNames=new Set(['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','district of columbia','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']);
  const cache=new Map();

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const queryValue=()=>String(document.getElementById('mLocation')?.value||document.getElementById('location')?.value||'').trim();
  const hasZip=q=>/\b\d{5}(?:-\d{4})?\b/.test(q);
  const hasState=q=>{const n=norm(q);if(stateNames.has(n))return true;return /(?:^|[\s,])(AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)(?:$|[\s,])/i.test(q)};
  function looksLikeProviderName(q){
    const n=norm(q),terms=n.split(/\s+/).filter(Boolean);
    if(!n||hasZip(q)||hasState(q))return false;
    if(/\b(transport|transportation|medical|medicar|nemt|mobility|ride|rides|transit|ambulance|shuttle|logistics|care|health|healthcare|services|service|llc|inc|corp|corporation|company|bus|cab|van)\b/.test(n))return true;
    return terms.length>=3;
  }
  function scoreName(name,q){
    const n=norm(name),x=norm(q);
    if(!n||!x)return 0;
    if(n===x)return 100;
    if(n.startsWith(x))return 92;
    if(n.includes(x))return 84;
    const terms=x.split(/\s+/).filter(t=>t.length>1);
    if(terms.length&&terms.every(t=>n.includes(t)))return 74;
    return 0;
  }
  function openModal(title,html){
    const w=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');
    if(!w||!t||!b)return;
    t.textContent=title;b.innerHTML=html;w.classList.add('open');
  }
  async function stateData(abbr){
    if(cache.has(abbr))return cache.get(abbr);
    const pending=fetch(`data/providers/${abbr}.json?v=name1`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(abbr);return r.json()}).catch(e=>{cache.delete(abbr);throw e});
    cache.set(abbr,pending);return pending;
  }
  async function searchName(q){
    const results=[],seen=new Set();let cursor=0;
    async function worker(){
      while(cursor<states.length){
        const abbr=states[cursor++];
        try{
          const data=await stateData(abbr);
          for(const p of data.providers||[]){
            const score=scoreName(p.name,q);if(!score)continue;
            const key=`${p.npi||''}|${p.state||abbr}|${norm(p.name)}`;if(seen.has(key))continue;seen.add(key);results.push({p,score});
          }
        }catch(_){ }
      }
    }
    await Promise.all(Array.from({length:8},()=>worker()));
    return results.sort((a,b)=>b.score-a.score||String(a.p.name||'').localeCompare(String(b.p.name||''))||String(a.p.state||'').localeCompare(String(b.p.state||''))).slice(0,100).map(x=>x.p);
  }
  function resultsHtml(list,q){
    if(!list.length)return `<div class="claim-callout">No provider-name matches were found for “${esc(q)}”. Try the provider's full legal or business name.</div>`;
    return `<div class="claim-callout">Provider-name search across the national Eazy NEMT directory.</div><div class="results">${list.map(p=>`<div class="result"><h3>${esc(p.name)}</h3><p>${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city||'')}, ${esc(p.state||'')} ${esc(String(p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}${p.npi?`<br>NPI: ${esc(p.npi)}`:''}</p><div class="tags" style="margin-top:8px"><span class="tag">NEMT</span></div>${p.phone?`<div class="result-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}</div>`).join('')}</div>`;
  }
  async function runProviderNameSearch(q){
    openModal('Search Provider by Name','<div class="claim-callout">Searching provider names across all states…</div>');
    try{const list=await searchName(q);openModal(`Provider matches for “${q}” (${list.length})`,resultsHtml(list,q))}
    catch(e){console.error('Provider-name search failed',e);openModal('Search Provider by Name','<div class="claim-callout">The provider-name search could not be completed. Please try again.</div>')}
  }
  function intercept(e){
    const q=queryValue();if(!looksLikeProviderName(q))return false;
    e.preventDefault();e.stopImmediatePropagation();runProviderNameSearch(q);return true;
  }
  document.addEventListener('click',e=>{const el=e.target.closest?.('[aria-label="Find Providers"]');if(el)intercept(e)},true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target?.id==='location'||e.target?.id==='mLocation'))intercept(e)},true);
  document.addEventListener('submit',e=>{if(e.target?.id==='mSearch')intercept(e)},true);
  document.addEventListener('DOMContentLoaded',()=>{const m=document.getElementById('mLocation');if(m)m.placeholder='ZIP code, city, or provider name';const d=document.getElementById('location');if(d)d.setAttribute('aria-label','Location or provider name')});
  window.__eazyProviderNameSearch=runProviderNameSearch;
})();
