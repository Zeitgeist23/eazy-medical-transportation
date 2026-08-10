(()=>{
  'use strict';

  let indexPromise=null,claimsPromise=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

  function ensurePopup(){
    let wrap=document.getElementById('providerWebsitePopup');
    if(wrap)return wrap;
    wrap=document.createElement('div');
    wrap.id='providerWebsitePopup';
    wrap.innerHTML=`<div class="pwp-card" role="dialog" aria-modal="true" aria-labelledby="pwpTitle"><div class="pwp-head"><h2 id="pwpTitle">Provider</h2><button type="button" class="pwp-close" aria-label="Close provider website popup">×</button></div><div class="pwp-body" id="pwpBody"></div></div>`;
    document.body.appendChild(wrap);
    const style=document.createElement('style');
    style.id='providerWebsitePopupStyles';
    style.textContent=`
      .result{cursor:pointer;transition:box-shadow .16s ease,transform .16s ease,border-color .16s ease}
      .result:hover{box-shadow:0 10px 24px rgba(18,63,79,.12);border-color:#9fd5dc;transform:translateY(-1px)}
      #providerWebsitePopup{position:fixed;inset:0;z-index:4000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(5,32,43,.58)}
      #providerWebsitePopup.open{display:flex}
      #providerWebsitePopup .pwp-card{width:min(560px,94vw);max-height:84vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      #providerWebsitePopup .pwp-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #d7e7eb}
      #providerWebsitePopup .pwp-head h2{margin:0;color:#0b3552;font:800 22px/1.2 Arial,Helvetica,sans-serif}
      #providerWebsitePopup .pwp-close{width:42px;height:42px;flex:0 0 42px;border:0;border-radius:50%;background:#eef8fa;color:#087f91;font-size:27px;line-height:1;cursor:pointer}
      #providerWebsitePopup .pwp-body{padding:20px;color:#31536b;font-family:Arial,Helvetica,sans-serif}
      #providerWebsitePopup .pwp-details{font-size:16px;line-height:1.5;margin-bottom:18px;white-space:pre-line}
      #providerWebsitePopup .pwp-website{border:1px solid #d7e7eb;border-radius:14px;padding:16px;background:#f7fbfc}
      #providerWebsitePopup .pwp-website strong{display:block;color:#0b3552;font-size:14px;margin-bottom:9px}
      #providerWebsitePopup .pwp-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:11px;background:#087f91;color:#fff;text-decoration:none;font-weight:800}
      #providerWebsitePopup .pwp-note{margin:10px 0 0;color:#597181;font-size:12px;line-height:1.45}
      #providerWebsitePopup .pwp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
      #providerWebsitePopup .pwp-call{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 16px;border:1px solid #c9dce2;border-radius:11px;background:#eef8fa;color:#0b3552;text-decoration:none;font-weight:800}
    `;
    document.head.appendChild(style);
    wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('.pwp-close'))wrap.classList.remove('open')});
    return wrap;
  }

  async function loadIndex(){
    if(!indexPromise)indexPromise=fetch('data/provider-name-index.json?v=2',{cache:'no-store'}).then(r=>r.ok?r.json():{providers:[]}).catch(()=>({providers:[]}));
    return indexPromise;
  }
  async function loadClaims(){
    if(!claimsPromise)claimsPromise=fetch('providers-claimed.json?v=2',{cache:'no-store'}).then(r=>r.ok?r.json():{claims:{}}).catch(()=>({claims:{}}));
    return claimsPromise;
  }
  function safeWebsite(value){
    let s=String(value||'').trim();
    if(!s)return'';
    if(!/^https?:\/\//i.test(s))s='https://'+s;
    try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return''}
  }
  function findPhone(text){const m=String(text||'').match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);return m?m[0]:''}
  async function resolveRecord(name,details){
    const data=await loadIndex(),all=data.providers||[],n=norm(name),phone=findPhone(details).replace(/\D/g,'');
    const matches=all.filter(p=>norm(p.name)===n);
    if(!matches.length)return null;
    if(phone){const byPhone=matches.find(p=>String(p.phone||'').replace(/\D/g,'')===phone);if(byPhone)return byPhone}
    const d=norm(details);
    return matches.find(p=>d.includes(norm(p.city))&&d.includes(norm(p.state)))||matches[0];
  }
  async function openProviderWebsite(result){
    const wrap=ensurePopup(),title=wrap.querySelector('#pwpTitle'),body=wrap.querySelector('#pwpBody');
    const name=String(result.querySelector('h3')?.textContent||'Provider').trim();
    const details=String(result.querySelector('p')?.innerText||'').trim();
    title.textContent=name;
    body.innerHTML=`<div class="pwp-details">${esc(details)}</div><div class="pwp-website"><strong>Website</strong><div>Looking up website information…</div></div>`;
    wrap.classList.add('open');

    const record=await resolveRecord(name,details);
    const claims=await loadClaims();
    const claim=record?.npi?claims.claims?.[String(record.npi)]||{}:{};
    const direct=safeWebsite(claim.website||record?.website||record?.webUrl);
    const query=[name,record?.city,record?.state,'official website'].filter(Boolean).join(' ');
    const search=`https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const phone=record?.phone||findPhone(details);
    const websiteBox=direct
      ?`<div class="pwp-website"><strong>Website</strong><a class="pwp-link" href="${esc(direct)}" target="_blank" rel="noopener noreferrer">Visit Website</a><p class="pwp-note">Website listed in the Eazy provider record.</p></div>`
      :`<div class="pwp-website"><strong>Website</strong><a class="pwp-link" href="${esc(search)}" target="_blank" rel="noopener noreferrer">Find Provider Website</a><p class="pwp-note">A verified website is not yet stored in Eazy for this provider. This opens a web search for the provider's official site instead of guessing a URL.</p></div>`;
    body.innerHTML=`<div class="pwp-details">${esc(details)}</div>${websiteBox}${phone?`<div class="pwp-actions"><a class="pwp-call" href="tel:${esc(phone)}">Call Provider</a></div>`:''}`;
  }

  document.addEventListener('click',e=>{
    const result=e.target.closest?.('.result');
    if(!result)return;
    if(e.target.closest('a,button,input,select,textarea,label'))return;
    e.preventDefault();
    e.stopPropagation();
    openProviderWebsite(result);
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')document.getElementById('providerWebsitePopup')?.classList.remove('open');
  });
})();
