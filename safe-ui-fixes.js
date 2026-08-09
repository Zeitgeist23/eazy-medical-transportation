(()=>{
  'use strict';
  const root=document.getElementById('desktopDirectory');
  if(!root) return;

  const pinSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.75 6.5-11.2A6.5 6.5 0 0 0 5.5 9.8C5.5 15.25 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.7" r="2.2" fill="currentColor"/></svg>';
  const serviceSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="7" width="16" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10v6M9 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const accessSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M11 7v5h5l3 5M11 9H8M11 12l-3 5m0 0a5 5 0 1 0 8.5 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const style=document.createElement('style');
  style.id='safe-surgical-ui-styles';
  style.textContent=`
    .safe-search-icon{position:absolute;z-index:8;width:1.15%;height:2.2%;display:flex;align-items:center;justify-content:center;color:#0b91a0;pointer-events:none}
    .safe-search-icon svg{width:100%;height:100%}
    .safe-search-icon.location{left:9.15%;top:29.72%}
    .safe-search-icon.service{left:23.45%;top:29.72%}
    .safe-search-icon.access{left:39.0%;top:29.72%}
    #location{padding-left:34px!important;padding-right:10px!important}
    #service,#accessibility{padding-left:34px!important;padding-right:30px!important}
    .crisp-directory-note{left:26.9%!important;top:34.24%!important;width:36%!important;height:2.05%!important;background:#fff!important;white-space:nowrap!important}
    .crisp-provider-layer .cp-mask{top:58.9%!important;height:3.7%!important;background:#fff!important}
    .crisp-provider-layer .cp-city{gap:4px!important}
    .crisp-provider-layer .cp-city svg{width:10px;height:12px;flex:0 0 auto;color:#174b83}
    .crisp-provider-layer .cp-view{pointer-events:auto!important}
    @media(max-width:760px){.safe-search-icon{display:none!important}}
  `;
  document.head.appendChild(style);

  function addSearchIcons(){
    if(root.querySelector('.safe-search-icon')) return;
    const defs=[['location',pinSvg],['service',serviceSvg],['access',accessSvg]];
    for(const [cls,svg] of defs){const el=document.createElement('span');el.className=`safe-search-icon ${cls}`;el.innerHTML=svg;root.appendChild(el)}
  }

  function fixProviderPins(){
    root.querySelectorAll('.crisp-provider-layer .cp-city').forEach(el=>{
      const text=(el.textContent||'').replace(/^\s*[⌾⊙]\s*/,'').trim();
      if(!text) return;
      el.innerHTML=pinSvg+`<span>${text}</span>`;
    });
  }

  function tagsFor(p,data){
    const out=[],npi=String(p.npi||''),cats=data?.categories||{};
    for(const name of ['Wheelchair','Ambulatory','Dialysis','Doctor Visit','Stretcher','Companion']){
      if((cats[name]||[]).map(String).includes(npi)) out.push(name);
      if(out.length===2) break;
    }
    if(!out.length) out.push('NEMT');
    return out;
  }

  function setFeatured(cards){
    const names=root.querySelectorAll('.crisp-provider-layer .cp-name');
    const cities=root.querySelectorAll('.crisp-provider-layer .cp-city');
    const tags=root.querySelectorAll('.crisp-provider-layer .cp-tags');
    const buttons=root.querySelectorAll('.crisp-provider-layer .cp-view');
    if(names.length<6||cities.length<6||tags.length<6||buttons.length<6) return false;
    cards.slice(0,6).forEach((p,i)=>{
      names[i].textContent=p.name||'Provider';
      cities[i].innerHTML=pinSvg+`<span>${p.city||''}${p.state?`, ${p.state}`:''}</span>`;
      tags[i].innerHTML=(p._tags||['NEMT']).map(t=>`<span>${t}</span>`).join('');
      buttons[i].onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();if(window.__eazyIndependentCloseModal){} const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');if(!modal||!title||!body)return;title.textContent=p.name||'Provider';body.innerHTML=`<div class="provider-meta">${p.address1||''}${p.address1?'<br>':''}${p.city||''}${p.state?`, ${p.state}`:''} ${(p.zip||'').toString().slice(0,5)}${p.phone?`<br>${p.phone}`:''}${p.npi?`<br>NPI: ${p.npi}`:''}</div>${p.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${p.phone}">Call Provider</a></div>`:''}`;modal.classList.add('open')};
    });
    return true;
  }

  async function loadFeatured(abbr){
    try{
      const r=await fetch(`data/providers/${abbr}.json?v=safe1`,{cache:'no-store'});
      if(!r.ok) return;
      const data=await r.json();
      const cards=[...(data.providers||[])].sort((a,b)=>Number(Boolean(b.phone))-Number(Boolean(a.phone))||String(a.name||'').localeCompare(String(b.name||''))).slice(0,6).map(p=>Object.assign({},p,{_tags:tagsFor(p,data)}));
      if(cards.length>=6) setFeatured(cards);
    }catch(_){ }
  }

  addSearchIcons();
  setTimeout(fixProviderPins,0);
  setTimeout(()=>loadFeatured(window.__eazyMenuState||'IL'),120);
  let shown=window.__eazyMenuState||'IL';
  setInterval(()=>{
    addSearchIcons();
    fixProviderPins();
    const next=window.__eazyMenuState||shown;
    if(next!==shown){shown=next;loadFeatured(next)}
  },500);
})();
