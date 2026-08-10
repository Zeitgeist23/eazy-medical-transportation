(()=>{
  'use strict';

  const featured={
    'North Shore Medical Transport':{city:'Evanston, IL',phone:'',medicaidNumber:''},
    'Chicago Senior Ride Services':{city:'Chicago, IL',phone:'',medicaidNumber:''},
    'Lake County Wheelchair Transit':{city:'Waukegan, IL',phone:'',medicaidNumber:''},
    'Suburban Patient Transport':{city:'Schaumburg, IL',phone:'',medicaidNumber:''},
    'Metro Dialysis Rides':{city:'Naperville, IL',phone:'',medicaidNumber:''},
    'Heartland Medical Transit':{city:'Aurora, IL',phone:'',medicaidNumber:''}
  };

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let ilDataPromise=null;
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function getILData(){
    if(!ilDataPromise){
      ilDataPromise=fetch('data/providers/IL.json?v=popupfacts1',{cache:'no-store'})
        .then(r=>r.ok?r.json():null)
        .catch(()=>null);
    }
    return ilDataPromise;
  }

  async function resolveFacts(name){
    const base=featured[name];
    if(!base) return null;
    const out={...base};
    const data=await getILData();
    if(data?.providers?.length){
      const target=norm(name);
      const city=norm(base.city.split(',')[0]);
      const match=data.providers.find(p=>norm(p.name)===target && (!city||norm(p.city)===city));
      if(match){
        out.phone=match.phone||out.phone;
        out.medicaidNumber=match.medicaidNumber||match.medicaid||match.medicaidId||match.medicaidProviderId||out.medicaidNumber;
      }
    }
    return out;
  }

  function ensureStyle(){
    if(document.getElementById('provider-popup-facts-style')) return;
    const s=document.createElement('style');
    s.id='provider-popup-facts-style';
    s.textContent=`
      .provider-popup-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 6px}
      .provider-popup-fact{border:1px solid #d7e7eb;border-radius:12px;background:#f8fcfd;padding:12px 14px;min-width:0}
      .provider-popup-fact-label{display:block;color:#597181;font:700 11px/1.2 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
      .provider-popup-fact-value{display:block;color:#0b3552;font:800 15px/1.25 Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
      .provider-popup-fact-value a{color:#087f91;text-decoration:none}
      .provider-popup-fact-value.is-unverified{color:#7b8f9c;font-weight:700}
      @media(max-width:760px){.provider-popup-facts{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  async function inject(){
    const modal=document.getElementById('modal');
    const title=document.getElementById('modalTitle');
    const body=document.getElementById('modalBody');
    if(!modal?.classList.contains('open')||!title||!body) return;
    const name=title.textContent.trim();
    if(!featured[name]||body.querySelector('.provider-popup-facts')) return;

    ensureStyle();
    const facts=await resolveFacts(name);
    if(!facts||title.textContent.trim()!==name||body.querySelector('.provider-popup-facts')) return;

    const phone=facts.phone?`<a href="tel:${esc(facts.phone)}">${esc(facts.phone)}</a>`:'Not verified';
    const medicaid=facts.medicaidNumber?esc(facts.medicaidNumber):'Not verified';
    const wrap=document.createElement('div');
    wrap.className='provider-popup-facts';
    wrap.innerHTML=`
      <div class="provider-popup-fact"><span class="provider-popup-fact-label">Phone Number</span><span class="provider-popup-fact-value${facts.phone?'':' is-unverified'}">${phone}</span></div>
      <div class="provider-popup-fact"><span class="provider-popup-fact-label">Medicaid Number</span><span class="provider-popup-fact-value${facts.medicaidNumber?'':' is-unverified'}">${medicaid}</span></div>`;

    const details=body.querySelector('.provider-popup-details');
    const website=body.querySelector('.provider-website-preview,.provider-popup-website,.provider-popup-preview');
    if(website?.parentNode){website.insertAdjacentElement('afterend',wrap)}
    else if(details?.parentNode){details.parentNode.insertAdjacentElement('afterend',wrap)}
    else body.prepend(wrap);
  }

  const observer=new MutationObserver(()=>queueMicrotask(inject));
  const modal=document.getElementById('modal');
  if(modal) observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(inject,0),true);
})();
