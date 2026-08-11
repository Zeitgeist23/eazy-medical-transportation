(function(){
  const text='EazyMedicalTransportation.com is an independent directory and is not owned by or affiliated with any transportation provider listed on this site.';

  function installDisclaimer(){
    const desktop=document.querySelector('.desktop');
    if(desktop && !desktop.querySelector('.eazy-desktop-disclaimer')){
      const el=document.createElement('div');
      el.className='eazy-desktop-disclaimer';
      el.textContent=text;
      desktop.appendChild(el);
    }

    const mobile=document.querySelector('.mobile');
    if(mobile && !mobile.querySelector('.eazy-mobile-disclaimer')){
      const el=document.createElement('div');
      el.className='eazy-mobile-disclaimer';
      el.textContent=text;
      mobile.insertBefore(el,mobile.firstChild);
    }

    if(!document.getElementById('eazy-disclaimer-style')){
      const style=document.createElement('style');
      style.id='eazy-disclaimer-style';
      style.textContent=`
        .eazy-desktop-disclaimer{
          position:absolute;
          top:0;
          left:0;
          right:0;
          z-index:50;
          min-height:2.9%;
          padding:.62% 4% .5%;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          background:#fff;
          color:#536b78;
          border-bottom:1px solid #d7e7eb;
          font:600 clamp(10px,.72vw,13px)/1.35 Arial,Helvetica,sans-serif;
          letter-spacing:.01em;
        }
        .eazy-mobile-disclaimer{
          margin:0 14px 10px;
          padding:10px 12px;
          border:1px solid #d7e7eb;
          border-radius:12px;
          background:#f7fbfc;
          color:#597181;
          text-align:center;
          font:600 11px/1.45 Arial,Helvetica,sans-serif;
        }
        @media(max-width:760px){
          .eazy-desktop-disclaimer{display:none!important}
          .eazy-mobile-disclaimer{display:block}
        }
        @media(min-width:761px){
          .eazy-mobile-disclaimer{display:none!important}
        }
      `;
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installDisclaimer);
  else installDisclaimer();
})();
