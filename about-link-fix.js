(()=>{
  'use strict';

  const isAbout=el=>{
    if(!el)return false;
    const label=(el.getAttribute?.('aria-label')||el.textContent||'').trim();
    return /^about$/i.test(label);
  };

  document.addEventListener('click',e=>{
    const el=e.target?.closest?.('a,button');
    if(!isAbout(el))return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    window.location.assign('/about/');
  },true);

  function wireAbout(){
    document.querySelectorAll('a,button').forEach(el=>{
      if(!isAbout(el))return;
      if(el.tagName==='A')el.setAttribute('href','/about/');
      el.setAttribute('data-eazy-about-link','1');
    });
  }

  wireAbout();
  new MutationObserver(wireAbout).observe(document.body,{subtree:true,childList:true});
})();
