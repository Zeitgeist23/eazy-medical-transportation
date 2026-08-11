(()=>{
  'use strict';
  function wireAbout(){
    document.querySelectorAll('a,button').forEach(el=>{
      const label=(el.getAttribute('aria-label')||el.textContent||'').trim();
      if(/^about$/i.test(label)){
        if(el.tagName==='A'){
          el.setAttribute('href','/about/');
        }else{
          el.onclick=()=>{window.location.href='/about/'};
        }
      }
    });
  }
  wireAbout();
  new MutationObserver(wireAbout).observe(document.body,{subtree:true,childList:true});
})();
