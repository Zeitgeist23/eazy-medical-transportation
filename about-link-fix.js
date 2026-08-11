(()=>{
  'use strict';

  function installDirectAboutLink(){
    const desktop=document.getElementById('desktopDirectory');
    if(desktop && !desktop.querySelector('#directAboutLink')){
      const a=document.createElement('a');
      a.id='directAboutLink';
      a.href='/about/';
      a.setAttribute('aria-label','About');
      Object.assign(a.style,{
        position:'absolute',
        left:'79.4%',
        top:'4.25%',
        width:'5%',
        height:'4.2%',
        zIndex:'9999',
        display:'block',
        background:'transparent',
        cursor:'pointer'
      });
      desktop.appendChild(a);
    }

    document.querySelectorAll('a,button').forEach(el=>{
      const label=(el.getAttribute?.('aria-label')||el.textContent||'').trim();
      if(!/^about$/i.test(label) || el.id==='directAboutLink')return;
      if(el.tagName==='A') el.href='/about/';
      else el.onclick=()=>{location.href='/about/';};
    });
  }

  installDirectAboutLink();
  new MutationObserver(installDirectAboutLink).observe(document.body,{subtree:true,childList:true});
})();
