(()=>{
  'use strict';
  const KEY='eazy_event_counts_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch{}};
  function track(name,detail={}){
    const counts=read(); counts[name]=(counts[name]||0)+1; save(counts);
    try{window.dispatchEvent(new CustomEvent('eazy:analytics',{detail:{event:name,...detail}}))}catch{}
    if(typeof window.gtag==='function'){
      try{window.gtag('event',name,{event_category:'Eazy Directory',...detail})}catch{}
    }
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest?.('[data-event],a[href^="tel:"],a[href*="/providers/"],a[href*="claim-provider"],a[href*="/browse/"]');
    if(!el)return;
    let name=el.getAttribute('data-event');
    if(!name){
      const href=el.getAttribute('href')||'';
      if(href.startsWith('tel:')) name='provider_call';
      else if(href.includes('claim-provider')) name='provider_claim_click';
      else if(href.includes('/providers/')) name='provider_profile_view';
      else if(href.includes('/browse/')) name='browse_click';
    }
    if(name)track(name,{path:location.pathname,href:el.getAttribute('href')||''});
  },true);
  document.addEventListener('submit',e=>{
    if(e.target?.id==='mSearch'||e.target?.id==='browseProviderNameForm') track('provider_search',{path:location.pathname});
    if(e.target?.classList?.contains('claim-form')) track('provider_claim_submit',{path:location.pathname});
    if(e.target?.classList?.contains('ride-form')) track('ride_request_start',{path:location.pathname});
  },true);
  window.__eazyTrack=track;
})();
