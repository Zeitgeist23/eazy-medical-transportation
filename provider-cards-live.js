(()=>{
  'use strict';

  const root=document.getElementById('desktopDirectory');
  const modal=document.getElementById('modal');
  const modalTitle=document.getElementById('modalTitle');
  const modalBody=document.getElementById('modalBody');
  if(!root||!modal||!modalTitle||!modalBody) return;

  const stateNames={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
  const cardLefts=['4.45%','18.65%','33.00%','47.20%','60.70%','74.70%'];
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const digits=v=>String(v||'').replace(/\D/g,'');
  const smartName=v=>{const s=String(v||'Provider');return s===s.toUpperCase()?s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\b(Llc|Inc|Nfp|Corp|Co)\b/g,m=>m.toUpperCase()):s};

  const vanSvg='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 15h24l9 9v12H7V15Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M31 17v9h9M15 19v10M10 24h10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="36" r="4" fill="white" stroke="currentColor" stroke-width="3"/><circle cx="34" cy="36" r="4" fill="white" stroke="currentColor" stroke-width="3"/></svg>';
  const wheelchairSvg='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="4" fill="currentColor"/><path d="M22 14v11h10l7 12M22 18h-7M22 25l-7 11m0 0a10 10 0 1 0 17 3" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const dropSvg='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5S12 20 12 30a12 12 0 0 0 24 0C36 20 24 5 24 5Z" fill="currentColor"/></svg>';

  const style=document.createElement('style');
  style.id='unified-provider-records-style';
  style.textContent=`
    .live-provider-tabs{position:absolute;inset:0;z-index:8;pointer-events:none;font-family:Arial,Helvetica,sans-serif}
    .live-provider-card{position:absolute;top:43.15%;width:12.75%;height:19.1%;background:#fff;border:1px solid #e3edf0;border-radius:9px;box-sizing:border-box;padding:.8% .65% .7%;display:flex;flex-direction:column;align-items:center;pointer-events:auto;box-shadow:0 1px 3px rgba(20,61,75,.03)}
    .live-provider-icon{width:3.55vw;height:3.55vw;max-width:58px;max-height:58px;min-width:38px;min-height:38px;border-radius:50%;background:#eaf6f8;color:#0b6b86;display:grid;place-items:center;flex:0 0 auto}
    .live-provider-icon svg{width:62%;height:62%}.live-provider-name{width:100%;height:3.55vw;max-height:54px;min-height:38px;margin-top:.55vw;display:flex;align-items:center;justify-content:center;text-align:center;color:#111827;font-weight:700;font-size:clamp(8px,.68vw,13px);line-height:1.13;padding:0 3px;overflow:hidden}
    .live-provider-city{height:1.45vw;min-height:18px;display:flex;align-items:center;justify-content:center;text-align:center;color:#175284;font-size:clamp(7px,.57vw,11px);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .live-provider-tags{height:2.15vw;min-height:24px;display:flex;align-items:center;justify-content:center;gap:5px;width:100%;overflow:hidden}.live-provider-tags span{display:inline-flex;align-items:center;justify-content:center;border:1px solid #b7dfe7;border-radius:999px;background:#eaf7f9;color:#175284;font-weight:700;font-size:clamp(7px,.54vw,10px);padding:2px 7px;white-space:nowrap}
    .live-provider-card button{margin-top:auto;width:91%;height:2.75vw;max-height:40px;min-height:30px;border:1.4px solid #0b8b9c;border-radius:4px;background:#fff;color:#0b5269;font:700 clamp(8px,.62vw,12px)/1 Arial,Helvetica,sans-serif;cursor:pointer}
    .live-provider-card button:focus-visible{outline:2px solid #087f91;outline-offset:2px}
    #modal.provider-popup-large .modal{width:min(1040px,96vw);max-height:90vh}#modal.provider-popup-large .modal-body{padding:22px 24px 24px}
    .provider-popup-site{width:100%;height:310px;border:1px solid #d7e7eb;border-radius:16px;overflow:hidden;background:#f8fbfc;margin-bottom:18px}.provider-popup-site img{width:100%;height:100%;object-fit:cover;display:block}.provider-popup-browser{height:38px;border-bottom:1px solid #d7e7eb;background:#eef5f7;display:flex;align-items:center;gap:7px;padding:0 12px;color:#597181;font-size:12px}.provider-popup-browser i{width:9px;height:9px;border-radius:50%;background:#c9dce2}.provider-popup-browser span{margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.provider-popup-unverified{height:calc(100% - 38px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;color:#597181}.provider-popup-unverified strong{color:#0b3552;font-size:21px;margin-bottom:7px}.provider-popup-unverified p{margin:0;max-width:600px;line-height:1.5;font-size:14px}
    .provider-popup-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px}.provider-popup-fact{border:1px solid #d7e7eb;border-radius:12px;background:#f8fcfd;padding:13px 15px;min-width:0}.provider-popup-fact-label{display:block;color:#597181;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.provider-popup-fact-value{display:block;color:#0b3552;font-size:15px;font-weight:800;overflow-wrap:anywhere}.provider-popup-fact-value a{color:#087f91;text-decoration:none}.provider-popup-fact-value.is-unverified{color:#7b8f9c;font-weight:700}
    .provider-popup-address{color:#597181;font-size:14px;line-height:1.5;margin:0 0 12px}.provider-popup-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}.provider-popup-actions{display:flex;gap:10px;flex-wrap:wrap}.provider-popup-actions button,.provider-popup-actions a{border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none}.provider-popup-contact{background:#fff;color:#0b5269;border:1px solid #9fd5dc}.provider-popup-schedule{background:#087f91;color:#fff;border:1px solid #087f91}.provider-popup-note{margin:14px 0 0;color:#597181;font-size:12px;line-height:1.5}
    .provider-popup-form{display:grid;gap:12px;margin-top:6px}.provider-popup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.provider-popup-form label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#0b3552}.provider-popup-form input,.provider-popup-form select,.provider-popup-form textarea{width:100%;border:1px solid #c9dce2;border-radius:10px;padding:10px 12px;background:#fff;color:#29495c;font-size:14px}.provider-popup-form textarea{min-height:82px;resize:vertical}.provider-popup-submit{border:0;border-radius:10px;background:#087f91;color:#fff;padding:12px 14px;font-weight:900;cursor:pointer}
    .real-provider-view{margin-right:8px!important}
    @media(max-width:760px){.live-provider-tabs{display:none!important}#modal.provider-popup-large .modal{width:96vw}.provider-popup-site{height:210px}.provider-popup-grid,.provider-popup-facts{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  let claims=null;
  const stateCache=new Map();
  let currentState='IL';
  let currentFeatured=[];
  const layer=document.createElement('div');layer.className='live-provider-tabs';root.appendChild(layer);

  async function getClaims(){
    if(claims) return claims;
    try{const r=await fetch('providers-claimed.json?v=unified1',{cache:'no-store'});claims=r.ok?((await r.json()).claims||{}):{}}catch(_){claims={}}
    return claims;
  }

  async function loadState(abbr){
    if(!stateNames[abbr]) abbr='IL';
    if(stateCache.has(abbr)) return stateCache.get(abbr);
    const promise=(async()=>{
      const [r,c]=await Promise.all([fetch(`data/providers/${abbr}.json?v=unified1`,{cache:'no-store'}),getClaims()]);
      if(!r.ok) throw new Error('Provider database unavailable');
      const data=await r.json();
      data.providers=(data.providers||[]).map(p=>Object.assign({},p,c[String(p.npi)]||{}));
      return data;
    })();
    stateCache.set(abbr,promise);
    return promise;
  }

  function tagsFor(p,data){
    const tags=[],id=String(p.npi||''),cats=data?.categories||{};
    for(const name of ['Wheelchair','Ambulatory','Dialysis','Doctor Visit','Stretcher','Companion']){
      if((cats[name]||[]).map(String).includes(id)) tags.push(name);
      if(tags.length===2) break;
    }
    if(!tags.length){for(const t of [...(p.categories||[]),...(p.tags||[])]){const x=String(t);if(x&&x.toLowerCase()!=='all'&&!tags.includes(x))tags.push(x);if(tags.length===2)break}}
    return tags.length?tags:['NEMT'];
  }

  function providerIcon(tags){const t=String(tags[0]||'').toLowerCase();if(t.includes('wheelchair'))return wheelchairSvg;if(t.includes('dialysis'))return dropSvg;return vanSvg}
  function medicaidOf(p){return p.medicaidNumber||p.medicaidProviderId||p.medicaidId||p.medicaid||''}
  function websiteOf(p){return p.website||p.websiteUrl||''}
  function landingOf(p){return p.landingImage||p.websiteImage||p.homepageImage||''}

  function rankProviders(data){
    return (data.providers||[]).map(p=>{
      const tags=tagsFor(p,data),name=String(p.name||'');
      const business=/transport|transit|ride|medical|mobility|ambul|shuttle|care/i.test(name);
      const explicit=tags.some(t=>t!=='NEMT');
      const score=(p.claimed?120:0)+(p.phone?60:0)+(p.address1?20:0)+(business?25:0)+(explicit?15:0)+(websiteOf(p)?15:0);
      return Object.assign({},p,{_tags:tags,_score:score});
    }).sort((a,b)=>b._score-a._score||String(a.name||'').localeCompare(String(b.name||'')));
  }

  function renderFeatured(cards){
    currentFeatured=cards;
    layer.innerHTML=cards.map((p,i)=>`<article class="live-provider-card" style="left:${cardLefts[i]}"><div class="live-provider-icon">${providerIcon(p._tags)}</div><div class="live-provider-name">${esc(smartName(p.name))}</div><div class="live-provider-city">${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}</div><div class="live-provider-tags">${(p._tags||['NEMT']).slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div><button type="button" data-featured-i="${i}">View Provider</button></article>`).join('');
    layer.querySelectorAll('[data-featured-i]').forEach(btn=>btn.addEventListener('click',()=>openProvider(currentFeatured[Number(btn.dataset.featuredI)])));
  }

  async function refreshFeatured(abbr){
    try{const data=await loadState(abbr);const ranked=rankProviders(data);const cards=ranked.filter(p=>p.phone).slice(0,6);renderFeatured((cards.length>=6?cards:ranked.slice(0,6)));currentState=abbr}catch(e){console.error('Featured provider load failed',e)}
  }

  function websitePreview(p){
    const image=landingOf(p),site=websiteOf(p);
    if(image){const img=`<img src="${esc(image)}" alt="${esc(p.name)} website landing page">`;return site?`<a class="provider-popup-site" href="${esc(site)}" target="_blank" rel="noopener">${img}</a>`:`<div class="provider-popup-site">${img}</div>`}
    return `<div class="provider-popup-site"><div class="provider-popup-browser"><i></i><i></i><i></i><span>${esc(site||'Provider website not verified')}</span></div><div class="provider-popup-unverified"><strong>Provider website not verified</strong><p>No verified public homepage image is attached to this provider record yet.</p></div></div>`;
  }

  function facts(p){
    const med=medicaidOf(p),phone=p.phone?`<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`:'Not available';
    return `<div class="provider-popup-facts"><div class="provider-popup-fact"><span class="provider-popup-fact-label">Phone Number</span><span class="provider-popup-fact-value${p.phone?'':' is-unverified'}">${phone}</span></div><div class="provider-popup-fact"><span class="provider-popup-fact-label">Medicaid Number</span><span class="provider-popup-fact-value${med?'':' is-unverified'}">${med?esc(med):'Not available in current source'}</span></div><div class="provider-popup-fact"><span class="provider-popup-fact-label">NPI</span><span class="provider-popup-fact-value">${esc(p.npi||'Not available')}</span></div></div>`;
  }

  function setModal(title,html){modalTitle.textContent=title;modalBody.innerHTML=html;modal.classList.add('provider-popup-large','open')}

  function openProvider(p){
    if(!p) return;
    const med=medicaidOf(p),address=[p.address1,p.address2].filter(Boolean).join(' ');
    setModal(smartName(p.name),`${websitePreview(p)}${facts(p)}<div class="provider-popup-summary"><div><p class="provider-popup-address">${address?`${esc(address)}<br>`:''}${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}${p.zip?` ${esc(String(p.zip).slice(0,10))}`:''}</p><div class="tags">${(p._tags||['NEMT']).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><div class="provider-popup-actions">${p.phone?`<a class="provider-popup-contact" href="tel:${esc(p.phone)}">Contact Provider</a>`:`<button type="button" class="provider-popup-contact" data-contact>Contact Provider</button>`}<button type="button" class="provider-popup-schedule" data-schedule>Schedule a Ride</button></div></div><p class="provider-popup-note">Provider information comes from the same provider record used by directory search. Medicaid provider IDs are shown only when present in a verified provider record or connected source.</p>`);
    modalBody.querySelector('[data-contact]')?.addEventListener('click',()=>openContact(p));
    modalBody.querySelector('[data-schedule]')?.addEventListener('click',()=>openSchedule(p));
  }

  function openContact(p){
    setModal(`Contact ${smartName(p.name)}`,`<p class="provider-popup-address"><b>${esc(smartName(p.name))}</b><br>${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}${p.phone?`<br>${esc(p.phone)}`:''}</p><form class="provider-popup-form" id="providerContactForm"><div class="provider-popup-grid"><label>Your Name<input name="name" required autocomplete="name"></label><label>Phone<input name="phone" required inputmode="tel"></label></div><label>Email<input name="email" type="email" required></label><label>Message<textarea name="message" required></textarea></label><button class="provider-popup-submit" type="submit">Send Contact Request</button></form>`);
    modalBody.querySelector('#providerContactForm')?.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries()),subject=`Provider Contact Request - ${p.name}`,body=[`Provider: ${p.name}`,`NPI: ${p.npi||''}`,`Provider Phone: ${p.phone||''}`,`Medicaid Number: ${medicaidOf(p)||''}`,`Name: ${d.name}`,`Phone: ${d.phone}`,`Email: ${d.email}`,`Message: ${d.message}`].join('\n');window.location.href=`mailto:info@eazymedicaltransportation.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`});
  }

  function openSchedule(p){
    const opts=[...new Set([...(p._tags||[]),'Wheelchair','Ambulatory','Stretcher','Dialysis','Companion Assistance'])];
    setModal(`Schedule a Ride — ${smartName(p.name)}`,`<p class="provider-popup-address"><b>${esc(smartName(p.name))}</b><br>${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}${p.phone?`<br>${esc(p.phone)}`:''}</p><form class="provider-popup-form" id="providerScheduleForm"><div class="provider-popup-grid"><label>Passenger Name<input name="passenger" required></label><label>Phone Number<input name="phone" required inputmode="tel"></label></div><label>Pickup Address<input name="pickup" required></label><label>Destination<input name="destination" required></label><div class="provider-popup-grid"><label>Ride Date<input type="date" name="date" required></label><label>Pickup Time<input type="time" name="time" required></label></div><div class="provider-popup-grid"><label>Trip Type<select name="trip"><option>Round Trip</option><option>One Way</option></select></label><label>Service Needed<select name="service">${opts.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label></div><label>Special Instructions<textarea name="notes"></textarea></label><button class="provider-popup-submit" type="submit">Send Ride Request</button><div class="provider-popup-note">The ride is not confirmed until the provider accepts and confirms the trip.</div></form>`);
    modalBody.querySelector('#providerScheduleForm')?.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries()),subject=`Ride Request - ${p.name}`,body=[`Provider: ${p.name}`,`NPI: ${p.npi||''}`,`Provider Phone: ${p.phone||''}`,`Medicaid Number: ${medicaidOf(p)||''}`,`Passenger: ${d.passenger}`,`Phone: ${d.phone}`,`Pickup: ${d.pickup}`,`Destination: ${d.destination}`,`Date: ${d.date}`,`Time: ${d.time}`,`Trip: ${d.trip}`,`Service: ${d.service}`,`Notes: ${d.notes||''}`].join('\n');window.location.href=`mailto:info@eazymedicaltransportation.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`});
  }

  async function enhanceSearchResults(){
    const results=[...modalBody.querySelectorAll('.result')];
    if(!results.length) return;
    let data;try{data=await loadState(window.__eazyMenuState||currentState||'IL')}catch(_){return}
    const providers=data.providers||[];
    results.forEach(result=>{
      if(result.querySelector('[data-real-provider-view]')) return;
      const name=result.querySelector('h3')?.textContent?.trim();if(!name)return;
      const text=result.querySelector('p')?.textContent||'';const phone=(text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)||[])[0]||'';
      let p=providers.find(x=>norm(x.name)===norm(name)&&(!phone||digits(x.phone)===digits(phone)));
      if(!p) p=providers.find(x=>norm(x.name)===norm(name));
      if(!p) return;
      p=Object.assign({},p,{_tags:tagsFor(p,data)});
      let actions=result.querySelector('.result-actions');if(!actions){actions=document.createElement('div');actions.className='result-actions';result.appendChild(actions)}
      const b=document.createElement('button');b.type='button';b.className='btn-secondary real-provider-view';b.dataset.realProviderView='1';b.textContent='View Provider';b.addEventListener('click',()=>openProvider(p));actions.prepend(b);
    });
  }

  new MutationObserver(()=>{queueMicrotask(enhanceSearchResults)}).observe(modalBody,{childList:true,subtree:true});
  new MutationObserver(()=>{if(!modal.classList.contains('open'))modal.classList.remove('provider-popup-large')}).observe(modal,{attributes:true,attributeFilter:['class']});

  refreshFeatured('IL');
  let seen='IL';
  setInterval(()=>{const next=window.__eazyMenuState||seen;if(next!==seen&&stateNames[next]){seen=next;refreshFeatured(next)}},400);
})();
