(()=>{
  'use strict';
  const root=document.getElementById('desktopDirectory');
  if(!root) return;

  const stateNames={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
  let featured=[];
  let currentState='IL';

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const cleanImage='https://raw.githubusercontent.com/Zeitgeist23/eazy-medical-transportation/9a50aa4f7ad5c5aa320b62bad69a23823f7feaf0/directory-landing-approved.png';
  const heroImg=root.querySelector(':scope > img');
  if(heroImg) heroImg.src=cleanImage;

  function removePriorOverlays(){
    root.querySelectorAll('.crisp-provider-layer,.crisp-directory-note,.eazy-repair-layer,.eazy-featured-layer,.eazy-nav-layer,.eazy-section-layer').forEach(el=>el.remove());
    document.querySelectorAll('style').forEach(s=>{
      const t=s.textContent||'';
      if(t.includes('.crisp-provider-layer')||t.includes('.crisp-directory-note')) s.remove();
    });
  }

  function applySearchControls(){
    const location=document.getElementById('location');
    const service=document.getElementById('service');
    const access=document.getElementById('accessibility');
    if(location){
      location.placeholder='City, State or ZIP Code';
      Object.assign(location.style,{background:'linear-gradient(90deg,transparent 0 13%,#fff 13% 100%)',color:'#415a6b',webkitTextFillColor:'#415a6b',fontWeight:'500',paddingLeft:'15%',paddingRight:'4%'});
    }
    [service,access].forEach((el,i)=>{
      if(!el) return;
      if(el.options.length) el.options[0].textContent=i===0?'e.g., Dialysis, Doctor Visit':'e.g., Wheelchair, Stretcher';
      Object.assign(el.style,{background:'linear-gradient(90deg,transparent 0 13%,#fff 13% 86%,transparent 86% 100%)',color:'#415a6b',webkitTextFillColor:'#415a6b',fontWeight:'500',paddingLeft:'15%',paddingRight:'15%'});
    });
  }

  function addDisclaimer(){
    const d=document.createElement('div');
    d.className='eazy-repair-layer eazy-disclaimer';
    d.innerHTML='<span>This directory lists independent providers. We do not provide transportation services.</span>';
    root.appendChild(d);
  }

  const pinSvg=`<svg class="eazy-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.75 6.5-11.2A6.5 6.5 0 0 0 5.5 9.8C5.5 15.25 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.7" r="2.2" fill="currentColor"/></svg>`;

  function providerTags(p,data){
    const out=[];
    const npi=String(p.npi||'');
    const cats=data?.categories||{};
    for(const name of ['Wheelchair','Ambulatory','Dialysis','Doctor Visit','Stretcher','Companion']){
      if((cats[name]||[]).map(String).includes(npi)) out.push(name);
      if(out.length===2) break;
    }
    if(!out.length){
      for(const t of (p.categories||p.tags||[])){
        const s=String(t);
        if(s&&s.toLowerCase()!=='all'&&!out.includes(s)) out.push(s);
        if(out.length===2) break;
      }
    }
    if(!out.length) out.push('NEMT');
    return out.slice(0,2);
  }

  function chooseFeatured(data){
    const list=[...(data.providers||[])];
    list.sort((a,b)=>Number(Boolean(b.phone))-Number(Boolean(a.phone))||String(a.name||'').localeCompare(String(b.name||'')));
    return list.slice(0,6).map(p=>({...p,_tags:providerTags(p,data)}));
  }

  function openProvider(p){
    const modal=document.getElementById('modal'), title=document.getElementById('modalTitle'), body=document.getElementById('modalBody');
    if(!modal||!title||!body||!p) return;
    title.textContent=p.name||'Provider';
    body.innerHTML=`<div class="provider-meta">${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''} ${esc(String(p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}${p.npi?`<br>NPI: ${esc(p.npi)}`:''}</div><div class="tags" style="margin-top:10px">${(p._tags||['NEMT']).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${p.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}<p class="ride-note" style="margin-top:14px">Provider information should be verified independently before arranging transportation.</p>`;
    modal.classList.add('open');
  }

  function renderFeatured(){
    root.querySelector('.eazy-featured-layer')?.remove();
    const layer=document.createElement('div');
    layer.className='eazy-featured-layer';
    const lefts=['5.35%','19.35%','33.72%','47.82%','61.22%','75.22%'];
    const buttonLefts=['6.3%','20.2%','34.6%','48.7%','62.1%','76.1%'];
    const buttonWidths=['10.3%','10.5%','10.4%','10.5%','10.5%','10.5%'];
    layer.innerHTML=featured.map((p,i)=>{
      const tags=(p._tags||['NEMT']).map(t=>`<span>${esc(t)}</span>`).join('');
      return `<div class="ef-name" style="left:${lefts[i]}">${esc(p.name||'Provider')}</div><div class="ef-city" style="left:${lefts[i]}">${pinSvg}<span>${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}</span></div><div class="ef-tags" style="left:${lefts[i]}">${tags}</div><div class="ef-btn-mask" style="left:calc(${buttonLefts[i]} - .35%);width:calc(${buttonWidths[i]} + .7%)"></div><button type="button" class="ef-view" data-index="${i}" style="left:${buttonLefts[i]};width:${buttonWidths[i]}">View Provider</button>`;
    }).join('');
    root.appendChild(layer);
    layer.querySelectorAll('.ef-view').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openProvider(featured[Number(btn.dataset.index)])}));
  }

  async function loadFeaturedState(abbr){
    if(!stateNames[abbr]) return;
    try{
      const r=await fetch(`data/providers/${abbr}.json?v=featured8`,{cache:'no-store'});
      if(!r.ok) return;
      const data=await r.json();
      featured=chooseFeatured(data);
      currentState=abbr;
      renderFeatured();
    }catch(_){ }
  }

  function addNavAndSectionText(){
    const nav=document.createElement('div');
    nav.className='eazy-nav-layer';
    const items=[['Home','44.55%','4.8%',true],['Browse Providers','50.75%','9.2%'],['By State','61%','6.6%'],['Wheelchair Vans','69.5%','9.2%'],['About','79.4%','5%'],['Contact','85.4%','5.2%']];
    nav.innerHTML=items.map(([text,left,width,active])=>`<div class="en-item${active?' active':''}" style="left:${left};width:${width}">${esc(text)}${text==='By State'?'<span class="en-chev">⌄</span>':''}</div>`).join('');
    root.appendChild(nav);

    const sec=document.createElement('div');
    sec.className='eazy-section-layer';
    sec.innerHTML='<div class="es-featured-title">Featured Providers</div><div class="es-featured-sub">Independent NEMT providers in your area.</div><div class="es-browse">Browse all providers →</div>';
    root.appendChild(sec);
  }

  function installStyles(){
    const style=document.createElement('style');
    style.id='eazy-repair-styles';
    style.textContent=`
      #location::placeholder{color:#415a6b!important;opacity:1!important}
      #location,#service,#accessibility{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-size:clamp(9px,.78vw,14px)!important}
      .eazy-disclaimer{position:absolute;left:25.2%;top:34.15%;width:47.8%;height:2.25%;z-index:7;background:#fff;display:flex;align-items:center;justify-content:center;color:#40596b;font:600 clamp(8px,.7vw,13px)/1 Arial,Helvetica,sans-serif;white-space:nowrap;pointer-events:none;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
      .eazy-featured-layer{position:absolute;inset:0;z-index:7;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;pointer-events:none}
      .eazy-featured-layer .ef-name,.eazy-featured-layer .ef-city,.eazy-featured-layer .ef-tags{position:absolute;width:12.15%;background:#fff;text-align:center;box-sizing:border-box}
      .eazy-featured-layer .ef-name{top:49.35%;min-height:3.25%;display:flex;align-items:center;justify-content:center;color:#111827;font-weight:700;font-size:clamp(9px,.72vw,14px);line-height:1.08;padding:0 .22%}
      .eazy-featured-layer .ef-city{top:53.18%;height:1.72%;display:flex;align-items:center;justify-content:center;color:#174b83;font-weight:600;font-size:clamp(8px,.60vw,12px);line-height:1;gap:4px}
      .eazy-pin{width:10px;height:12px;flex:0 0 auto;color:#174b83}
      .eazy-featured-layer .ef-tags{top:55.48%;height:2.18%;display:flex;align-items:center;justify-content:center;gap:.55%}
      .eazy-featured-layer .ef-tags span{display:inline-flex;align-items:center;justify-content:center;min-height:15px;height:1.52vw;max-height:23px;padding:0 .52vw;border:1px solid #b7dfe7;border-radius:999px;background:#eaf7f9;color:#174b83;font-weight:700;font-size:clamp(7px,.56vw,11px);line-height:1;white-space:nowrap}
      .eazy-featured-layer .ef-btn-mask{position:absolute;top:58.95%;height:3.65%;background:#fff;z-index:0}
      .eazy-featured-layer .ef-view{position:absolute;top:59.35%;height:2.8%;z-index:1;display:flex;align-items:center;justify-content:center;background:#fff;border:1.5px solid #13889a;border-radius:4px;color:#0b5269;font:700 clamp(8px,.66vw,13px)/1 Arial,Helvetica,sans-serif;pointer-events:auto;cursor:pointer}
      .eazy-nav-layer{position:absolute;inset:0;z-index:7;pointer-events:none;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
      .en-item{position:absolute;top:4.25%;height:4.2%;display:flex;align-items:center;justify-content:center;background:#fff;color:#102d46;font-size:clamp(10px,.9vw,16px);font-weight:500;white-space:nowrap}
      .en-item.active{color:#07879a;font-weight:700;border-bottom:2px solid #07879a}
      .en-chev{margin-left:5px;color:#174b83;font-weight:700}
      .eazy-section-layer{position:absolute;inset:0;z-index:7;pointer-events:none;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
      .es-featured-title{position:absolute;left:7.7%;top:37.45%;width:17%;height:2.35%;display:flex;align-items:center;background:#fff;color:#0b3552;font-size:clamp(12px,1.15vw,21px);font-weight:800}
      .es-featured-sub{position:absolute;left:7.7%;top:39.65%;width:20%;height:1.8%;display:flex;align-items:center;background:#fff;color:#597181;font-size:clamp(8px,.68vw,12px);font-weight:500}
      .es-browse{position:absolute;left:85.7%;top:40.38%;width:9.8%;height:2.35%;display:flex;align-items:center;justify-content:center;background:#fff;color:#0c5488;font-size:clamp(8px,.68vw,12px);font-weight:700;white-space:nowrap}
      @media(max-width:760px){.eazy-disclaimer,.eazy-featured-layer,.eazy-nav-layer,.eazy-section-layer{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  removePriorOverlays();
  document.getElementById('eazy-repair-styles')?.remove();
  installStyles();
  applySearchControls();
  addDisclaimer();
  addNavAndSectionText();
  loadFeaturedState(window.__eazyMenuState||'IL');

  let observed=window.__eazyMenuState||'IL';
  setInterval(()=>{
    const next=window.__eazyMenuState||observed;
    if(next!==observed){ observed=next; loadFeaturedState(next); }
  },400);
})();
