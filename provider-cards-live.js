(()=>{
  'use strict';

  const root=document.getElementById('desktopDirectory');
  const modal=document.getElementById('modal');
  const modalTitle=document.getElementById('modalTitle');
  const modalBody=document.getElementById('modalBody');
  if(!root||!modal||!modalTitle||!modalBody||root.querySelector('.featured-carousel-layer')) return;

  const cards=[
    {left:'4.45%',width:'12.75%'},
    {left:'18.65%',width:'12.75%'},
    {left:'33.00%',width:'12.75%'},
    {left:'47.20%',width:'12.75%'},
    {left:'60.70%',width:'12.75%'},
    {left:'74.70%',width:'12.75%'}
  ];
  const pageSize=6;
  let providers=[];
  let page=0;
  let stateData=null;
  let verifiedWebsites={};

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const medicaidOf=p=>p.medicaidNumber||p.medicaidProviderId||p.medicaidId||p.medicaid||'';
  const websiteOf=p=>p.website||p.websiteUrl||'';
  const landingOf=p=>p.landingImage||p.websiteImage||p.homepageImage||'';

  const style=document.createElement('style');
  style.textContent=`
    .featured-carousel-layer{position:absolute;inset:0;z-index:8;pointer-events:none;font-family:Arial,Helvetica,sans-serif}
    .featured-carousel-mask{position:absolute;top:48.45%;height:10.25%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:.35% .45% 0;pointer-events:none;overflow:hidden}
    .featured-carousel-name{width:100%;min-height:3.75vw;max-height:58px;display:flex;align-items:center;justify-content:center;text-align:center;color:#111827;font-weight:700;font-size:clamp(10px,.78vw,15px);line-height:1.15;overflow:hidden}
    .featured-carousel-city{width:100%;min-height:1.45vw;display:flex;align-items:center;justify-content:center;color:#175284;font-size:clamp(8px,.60vw,12px);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .featured-carousel-tags{width:100%;min-height:2.0vw;display:flex;align-items:center;justify-content:center;gap:5px;overflow:hidden}
    .featured-carousel-tags span{display:inline-flex;align-items:center;justify-content:center;border:1px solid #b7dfe7;border-radius:999px;background:#eaf7f9;color:#175284;font-weight:700;font-size:clamp(7px,.53vw,10px);padding:2px 7px;white-space:nowrap}
    .featured-carousel-hit{position:absolute;top:43.15%;height:19.1%;border:0!important;background:transparent!important;color:transparent!important;padding:0!important;margin:0!important;box-shadow:none!important;cursor:pointer;pointer-events:auto;touch-action:manipulation}
    .featured-carousel-hit:focus-visible{outline:2px solid #087f91;outline-offset:2px;border-radius:8px}
    .featured-carousel-arrow{position:absolute;top:52.1%;transform:translateY(-50%);width:38px;height:38px;border:1px solid #a9d6de;border-radius:50%;background:#fff;color:#087f91;font:800 24px/1 Arial,Helvetica,sans-serif;display:grid;place-items:center;cursor:pointer;pointer-events:auto;box-shadow:0 5px 16px rgba(18,63,79,.14);z-index:12}
    .featured-carousel-arrow:hover{background:#eef8fa}.featured-carousel-arrow:focus-visible{outline:2px solid #087f91;outline-offset:2px}
    .featured-carousel-prev{left:1.6%}.featured-carousel-next{left:88.5%}
    .featured-carousel-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    #modal.provider-popup-large .modal{width:min(1040px,96vw);max-height:90vh}
    #modal.provider-popup-large .modal-body{padding:22px 24px 24px}
    .provider-popup-site{width:100%;height:310px;border:1px solid #d7e7eb;border-radius:16px;overflow:hidden;background:#f8fbfc;margin-bottom:18px}
    .provider-popup-site img{width:100%;height:100%;object-fit:cover;display:block}
    .provider-popup-browser{height:38px;border-bottom:1px solid #d7e7eb;background:#eef5f7;display:flex;align-items:center;gap:7px;padding:0 12px;color:#597181;font-size:12px}
    .provider-popup-browser i{width:9px;height:9px;border-radius:50%;background:#c9dce2;display:block}.provider-popup-browser span{margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .provider-popup-unverified{height:calc(100% - 38px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;color:#597181}.provider-popup-unverified strong{color:#0b3552;font-size:21px;margin-bottom:7px}.provider-popup-unverified p{margin:0;max-width:600px;line-height:1.5;font-size:14px}
    .provider-popup-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 18px}.provider-popup-fact{border:1px solid #d7e7eb;border-radius:12px;background:#f8fcfd;padding:13px 15px;min-width:0}.provider-popup-fact-label{display:block;color:#597181;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}.provider-popup-fact-value{display:block;color:#0b3552;font-size:15px;font-weight:800;overflow-wrap:anywhere}.provider-popup-fact-value a{color:#087f91;text-decoration:none}.provider-popup-fact-value.is-unverified{color:#7b8f9c;font-weight:700}
    .provider-popup-address{color:#597181;font-size:14px;line-height:1.5;margin:0 0 12px}.provider-popup-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}.provider-popup-actions{display:flex;gap:10px;flex-wrap:wrap}.provider-popup-actions button,.provider-popup-actions a{border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:14px;text-decoration:none}.provider-popup-contact{background:#fff;color:#0b5269;border:1px solid #9fd5dc}.provider-popup-schedule{background:#087f91;color:#fff;border:1px solid #087f91}.provider-popup-note{margin:14px 0 0;color:#597181;font-size:12px;line-height:1.5}
    .provider-popup-form{display:grid;gap:12px;margin-top:6px}.provider-popup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.provider-popup-form label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#0b3552}.provider-popup-form input,.provider-popup-form select,.provider-popup-form textarea{width:100%;border:1px solid #c9dce2;border-radius:10px;padding:10px 12px;background:#fff;color:#29495c;font-size:14px}.provider-popup-form textarea{min-height:82px;resize:vertical}.provider-popup-submit{border:0;border-radius:10px;background:#087f91;color:#fff;padding:12px 14px;font-weight:900;cursor:pointer}
    @media(max-width:760px){.featured-carousel-layer{display:none!important}#modal.provider-popup-large .modal{width:96vw}.provider-popup-site{height:210px}.provider-popup-grid,.provider-popup-facts{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const layer=document.createElement('div');
  layer.className='featured-carousel-layer';
  layer.setAttribute('aria-label','Illinois Featured Providers carousel');
  root.appendChild(layer);

  const masks=[];
  const hits=[];
  cards.forEach((pos,i)=>{
    const mask=document.createElement('div');
    mask.className='featured-carousel-mask';
    mask.style.left=`calc(${pos.left} + .25%)`;
    mask.style.width=`calc(${pos.width} - .50%)`;
    if(i===0) mask.innerHTML='<div class="featured-carousel-name">Loading Illinois providers…</div>';
    layer.appendChild(mask);
    masks.push(mask);

    const hit=document.createElement('button');
    hit.type='button';
    hit.className='featured-carousel-hit';
    hit.style.left=pos.left;
    hit.style.width=pos.width;
    hit.disabled=true;
    layer.appendChild(hit);
    hits.push(hit);
  });

  const prev=document.createElement('button');
  prev.type='button';prev.className='featured-carousel-arrow featured-carousel-prev';prev.innerHTML='‹';prev.setAttribute('aria-label','Previous Illinois providers');prev.disabled=true;layer.appendChild(prev);
  const next=document.createElement('button');
  next.type='button';next.className='featured-carousel-arrow featured-carousel-next';next.innerHTML='›';next.setAttribute('aria-label','Next Illinois providers');next.disabled=true;layer.appendChild(next);
  const status=document.createElement('div');status.className='featured-carousel-sr';status.setAttribute('aria-live','polite');layer.appendChild(status);

  function closeModal(){modal.classList.remove('open','provider-popup-large')}
  document.addEventListener('click',e=>{const c=e.target.closest?.('.close,[aria-label="Close"]');if((c&&modal.contains(c))||e.target===modal) closeModal()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()},true);

  async function loadData(){
    const [r,cr,wr]=await Promise.all([
      fetch('data/providers/IL.json?v=carousel3',{cache:'no-store'}),
      fetch('providers-claimed.json?v=carousel3',{cache:'no-store'}).catch(()=>null),
      fetch('provider-website-priority.json?v=carousel3',{cache:'no-store'}).catch(()=>null)
    ]);
    if(!r.ok) throw new Error('Illinois provider database unavailable');
    const data=await r.json();
    const claims=cr&&cr.ok?((await cr.json()).claims||{}):{};
    verifiedWebsites=wr&&wr.ok?((await wr.json()).verified||{}):{};
    stateData=data;
    providers=(data.providers||[]).map(p=>{
      const merged=Object.assign({},p,claims[String(p.npi)]||{});
      const verified=verifiedWebsites[String(p.npi)]||'';
      if(verified){merged.website=verified;merged.websiteVerified=true}
      return merged;
    }).filter(p=>p&&p.name);
    providers.sort((a,b)=>
      Number(!!b.websiteVerified)-Number(!!a.websiteVerified)||
      Number(!!websiteOf(b))-Number(!!websiteOf(a))||
      Number(!!b.phone)-Number(!!a.phone)||
      String(a.name).localeCompare(String(b.name))
    );
    renderPage();
    prev.disabled=next.disabled=providers.length<=pageSize;
  }

  function tagsFor(p){
    const out=[];
    const id=String(p.npi||'');
    const cats=stateData?.categories||{};
    for(const n of ['Wheelchair','Ambulatory','Dialysis','Doctor Visit','Stretcher','Companion']){
      if((cats[n]||[]).map(String).includes(id)) out.push(n);
      if(out.length===2) break;
    }
    if(!out.length){
      for(const t of [...(p.categories||[]),...(p.tags||[])]){const s=String(t||'');if(s&&!/^all$/i.test(s)&&!out.includes(s))out.push(s);if(out.length===2)break}
    }
    return out.length?out:['NEMT'];
  }

  function renderPage(){
    const start=page*pageSize;
    const slice=providers.slice(start,start+pageSize);
    masks.forEach((mask,i)=>{
      const p=slice[i];
      if(!p){mask.innerHTML='';hits[i].disabled=true;hits[i].removeAttribute('aria-label');hits[i].onclick=null;return}
      const tags=tagsFor(p);
      mask.innerHTML=`<div class="featured-carousel-name">${esc(p.name)}</div><div class="featured-carousel-city">${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}</div><div class="featured-carousel-tags">${tags.slice(0,2).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`;
      hits[i].disabled=false;
      hits[i].setAttribute('aria-label',`View ${p.name}, ${p.city||''}, Illinois`);
      hits[i].onclick=()=>openProvider(p,tags);
    });
    const totalPages=Math.max(1,Math.ceil(providers.length/pageSize));
    status.textContent=`Showing Illinois providers ${start+1} through ${Math.min(start+pageSize,providers.length)} of ${providers.length}. Page ${page+1} of ${totalPages}.`;
  }

  function move(delta){
    const total=Math.max(1,Math.ceil(providers.length/pageSize));
    page=(page+delta+total)%total;
    renderPage();
  }
  prev.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));

  function websitePreview(p){
    const image=landingOf(p),site=websiteOf(p);
    if(image){const img=`<img src="${esc(image)}" alt="${esc(p.name)} website landing page">`;return site?`<a class="provider-popup-site" href="${esc(site)}" target="_blank" rel="noopener">${img}</a>`:`<div class="provider-popup-site">${img}</div>`}
    if(site&&p.websiteVerified){return `<a class="provider-popup-site" href="${esc(site)}" target="_blank" rel="noopener"><div class="provider-popup-browser"><i></i><i></i><i></i><span>${esc(site)}</span></div><div class="provider-popup-unverified"><strong>Live provider website</strong><p>This provider has a verified live public website. Click this preview to visit it.</p></div></a>`}
    return `<div class="provider-popup-site"><div class="provider-popup-browser"><i></i><i></i><i></i><span>${esc(site||'Provider website not verified')}</span></div><div class="provider-popup-unverified"><strong>Provider website not verified</strong><p>No verified public homepage image is attached to this Illinois provider record yet.</p></div></div>`;
  }

  function facts(p){
    const med=medicaidOf(p);
    const phone=p.phone?`<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`:'Not available';
    return `<div class="provider-popup-facts"><div class="provider-popup-fact"><span class="provider-popup-fact-label">Phone Number</span><span class="provider-popup-fact-value${p.phone?'':' is-unverified'}">${phone}</span></div><div class="provider-popup-fact"><span class="provider-popup-fact-label">Medicaid Number</span><span class="provider-popup-fact-value${med?'':' is-unverified'}">${med?esc(med):'Not available in current source'}</span></div><div class="provider-popup-fact"><span class="provider-popup-fact-label">NPI</span><span class="provider-popup-fact-value">${esc(p.npi||'Not available')}</span></div></div>`;
  }

  function setModal(title,html){modalTitle.textContent=title;modalBody.innerHTML=html;modal.classList.add('provider-popup-large','open')}

  function openProvider(p,tags=tagsFor(p)){
    const address=[p.address1,p.address2,[p.city,p.state,p.zip].filter(Boolean).join(', ').replace(/, ([A-Z]{2})/,', $1')].filter(Boolean).map(esc).join('<br>');
    const contact=p.phone?`<a class="provider-popup-contact" href="tel:${esc(p.phone)}">Contact Provider</a>`:`<button type="button" class="provider-popup-contact" data-contact-provider>Contact Provider</button>`;
    setModal(p.name,`${websitePreview(p)}${facts(p)}<div class="provider-popup-summary"><div><p class="provider-popup-address">${address}</p><div class="tags">${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><div class="provider-popup-actions">${contact}<button type="button" class="provider-popup-schedule" data-schedule-provider>Schedule a Ride</button></div></div><p class="provider-popup-note">Provider information comes from the Illinois NEMT provider record and should be independently verified before arranging transportation.</p>`);
    modalBody.querySelector('[data-contact-provider]')?.addEventListener('click',()=>openContact(p));
    modalBody.querySelector('[data-schedule-provider]')?.addEventListener('click',()=>openSchedule(p,tags));
  }

  function openContact(p){
    setModal(`Contact ${p.name}`,`<p class="provider-meta"><b>${esc(p.name)}</b><br>${esc(p.city||'')}, ${esc(p.state||'IL')}${p.phone?`<br>${esc(p.phone)}`:''}</p><form class="provider-popup-form" id="providerContactForm"><div class="provider-popup-grid"><label>Your Name<input name="name" required autocomplete="name"></label><label>Phone<input name="phone" required inputmode="tel" autocomplete="tel"></label></div><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Message<textarea name="message" required></textarea></label><button class="provider-popup-submit" type="submit">Send Contact Request</button></form>`);
    modalBody.querySelector('#providerContactForm')?.addEventListener('submit',e=>{
      e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const target=p.dispatchEmail||'info@eazymedicaltransportation.com';const subject=`Provider Contact Request - ${p.name}`;const body=[`Provider: ${p.name}`,`NPI: ${p.npi||''}`,`Provider Phone: ${p.phone||'Not available'}`,`Name: ${d.name}`,`Phone: ${d.phone}`,`Email: ${d.email}`,`Message: ${d.message}`].join('\n');window.location.href=`mailto:${encodeURIComponent(target)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  function openSchedule(p,tags){
    const serviceOptions=[...new Set([...(tags||[]),'Wheelchair','Ambulatory','Stretcher','Dialysis','Companion Assistance'])];
    setModal(`Schedule a Ride — ${p.name}`,`<p class="provider-meta"><b>${esc(p.name)}</b><br>${esc(p.city||'')}, ${esc(p.state||'IL')}${p.phone?`<br>${esc(p.phone)}`:''}</p><form class="provider-popup-form" id="providerScheduleForm"><div class="provider-popup-grid"><label>Passenger Name<input name="passenger" required autocomplete="name"></label><label>Phone Number<input name="phone" required inputmode="tel" autocomplete="tel"></label></div><label>Pickup Address<input name="pickup" required autocomplete="street-address"></label><label>Destination<input name="destination" required></label><div class="provider-popup-grid"><label>Ride Date<input type="date" name="date" required></label><label>Pickup Time<input type="time" name="time" required></label></div><div class="provider-popup-grid"><label>Trip Type<select name="trip"><option>Round Trip</option><option>One Way</option></select></label><label>Service Needed<select name="service">${serviceOptions.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label></div><label>Special Instructions<textarea name="notes"></textarea></label><button class="provider-popup-submit" type="submit">Send Ride Request</button><div class="ride-note">A ride is not confirmed until the provider accepts and confirms the trip.</div></form>`);
    modalBody.querySelector('#providerScheduleForm')?.addEventListener('submit',e=>{
      e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const target=(p.acceptsOnlineRequests&&p.dispatchEmail)?p.dispatchEmail:'info@eazymedicaltransportation.com';const subject=`Ride Request - ${p.name}`;const body=[`Provider: ${p.name}`,`NPI: ${p.npi||''}`,`Provider Phone: ${p.phone||'Not available'}`,`Passenger: ${d.passenger}`,`Phone: ${d.phone}`,`Pickup: ${d.pickup}`,`Destination: ${d.destination}`,`Date: ${d.date}`,`Time: ${d.time}`,`Trip: ${d.trip}`,`Service: ${d.service}`,`Notes: ${d.notes||''}`].join('\n');window.location.href=`mailto:${encodeURIComponent(target)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  loadData().catch(err=>{
    console.error('Illinois Featured Providers carousel failed',err);
    masks[0].innerHTML='<div class="featured-carousel-name">Illinois providers unavailable</div>';
    for(let i=1;i<masks.length;i++)masks[i].innerHTML='';
  });
})();