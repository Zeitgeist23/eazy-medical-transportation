(()=>{
  'use strict';
  if(document.getElementById('eazy-footer-hover-style')) return;
  const labels={
    'Footer Home':'Home',
    'Footer Browse Providers':'Browse Providers',
    'Footer By State':'By State',
    'Footer Wheelchair Vans':'Wheelchair Vans',
    'What is NEMT':'What is NEMT?',
    'Types of Services':'Types of Services',
    'Tips for Choosing a Provider':'Tips for Choosing a Provider',
    'Frequently Asked Questions':'Frequently Asked Questions',
    'Terms of Use':'Terms of Use',
    'Privacy Policy':'Privacy Policy',
    'Disclaimer':'Disclaimer',
    'Email Eazy Medical Transportation Directory':'info@eazymedicaltransportation.com',
    'EazyMedicalTransportation.com home':'EazyMedicalTransportation.com'
  };
  const style=document.createElement('style');
  style.id='eazy-footer-hover-style';
  style.textContent=`
    @media (min-width:761px){
      #desktopDirectory .eazy-footer-hover{
        color:transparent!important;
        background:transparent!important;
        border-radius:6px!important;
        transition:background-color .16s ease, box-shadow .16s ease!important;
        overflow:visible!important;
      }
      #desktopDirectory .eazy-footer-hover::after{
        content:attr(data-hover-text);
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        padding:0 8px;
        box-sizing:border-box;
        border-radius:6px;
        color:transparent;
        font:600 clamp(10px,.82vw,14px)/1.15 Arial,Helvetica,sans-serif;
        white-space:nowrap;
        pointer-events:none;
      }
      #desktopDirectory .eazy-footer-hover:hover,
      #desktopDirectory .eazy-footer-hover:focus-visible{
        background:#08a9c0!important;
        box-shadow:0 3px 10px rgba(8,169,192,.22)!important;
      }
      #desktopDirectory .eazy-footer-hover:hover::after,
      #desktopDirectory .eazy-footer-hover:focus-visible::after{
        color:#fff!important;
      }
    }
  `;
  document.head.appendChild(style);
  Object.entries(labels).forEach(([aria,text])=>{
    document.querySelectorAll(`[aria-label="${aria}"]`).forEach(el=>{
      el.classList.add('eazy-footer-hover');
      el.setAttribute('data-hover-text',text);
    });
  });
})();
