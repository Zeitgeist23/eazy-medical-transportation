(()=>{
  'use strict';

  const root=document.getElementById('desktopDirectory');
  if(!root||root.querySelector('.live-provider-tabs')) return;

  const providers=[
    {name:'North Shore Medical Transport',city:'Evanston, IL',services:['Wheelchair','Ambulatory'],website:null,landingImage:null},
    {name:'Chicago Senior Ride Services',city:'Chicago, IL',services:['Ambulatory','Companion'],website:null,landingImage:null},
    {name:'Lake County Wheelchair Transit',city:'Waukegan, IL',services:['Wheelchair','Stretcher'],website:null,landingImage:null},
    {name:'Suburban Patient Transport',city:'Schaumburg, IL',services:['Ambulatory','Wheelchair'],website:null,landingImage:null},
    {name:'Metro Dialysis Rides',city:'Naperville, IL',services:['Dialysis','Wheelchair'],website:null,landingImage:null},
    {name:'Heartland Medical Transit',city:'Aurora, IL',services:['Ambulatory','Stretcher'],website:null,landingImage:null}
  ];

  const cards=[
    {left:'4.45%',width:'12.75%',viewLeft:'6.30%',viewWidth:'10.30%'},
    {left:'18.65%',width:'12.75%',viewLeft:'20.20%',viewWidth:'10.50%'},
    {left:'33.00%',width:'12.75%',viewLeft:'34.60%',viewWidth:'10.40%'},
    {left:'47.20%',width:'12.75%',viewLeft:'48.70%',viewWidth:'10.50%'},
    {left:'60.70%',width:'12.75%',viewLeft:'62.10%',viewWidth:'10.50%'},
    {left:'74.70%',width:'12.75%',viewLeft:'76.10%',viewWidth:'10.50%'}
  ];

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const style=document.createElement('style');
  style.textContent=`
    .live-provider-tabs{position:absolute;inset:0;z-index:8;pointer-events:none}
    .live-provider-tab,.live-provider-view{position:absolute;border:0!important;background:transparent!important;color:transparent!important;-webkit-text-fill-color:transparent!important;padding:0!important;margin:0!important;box-shadow:none!important;cursor:pointer;pointer-events:auto;touch-action:manipulation}
    .live-provider-tab{top:43.15%;height:15.65%;border-radius:8px!important}
    .live-provider-view{top:59.35%;height:2.8%;border-radius:4px!important}
    .live-provider-tab:focus-visible,.live-provider-view:focus-visible{outline:2px solid #087f91!important;outline-offset:2px!important}
    #modal.provider-popup-large .modal{width:min(1040px,96vw);max-height:90vh}
    #modal.provider-popup-large .modal-body{padding:22px 24px 24px}
    .provider-popup-site{width:100%;height:350px;border:1px solid #d7e7eb;border-radius:16px;overflow:hidden;background:#f8fbfc;box-shadow:0 8px 24px rgba(18,63,79,.08);margin-bottom:18px}
    .provider-popup-site img{width:100%;height:100%;object-fit:cover;display:block}
    .provider-popup-browser{height:38px;border-bottom:1px solid #d7e7eb;background:#eef5f7;display:flex;align-items:center;gap:7px;padding:0 12px;color:#597181;font-size:12px}
    .provider-popup-browser i{width:9px;height:9px;border-radius:50%;background:#c9dce2;display:block}
    .provider-popup-browser span{margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .provider-popup-unverified{height:calc(100% - 38px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;color:#597181}
    .provider-popup-unverified strong{display:block;color:#0b3552;font-size:22px;margin-bottom:8px}
    .provider-popup-unverified p{margin:0;max-width:560px;line-height:1.5;font-size:14px}
    .provider-popup-summary{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin:4px 0 2px}
    .provider-popup-city{color:#597181;font-size:16px;margin-bottom:9px}
    .provider-popup-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
    .provider-popup-actions button{border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:14px}
    .provider-popup-contact{background:#fff;color:#0b5269;border:1px solid #9fd5dc}
    .provider-popup-schedule{background:#087f91;color:#fff;border:1px solid #087f91}
    .provider-popup-note{margin:14px 0 0;color:#597181;font-size:12px;line-height:1.5}
    .provider-popup-form{display:grid;gap:12px;margin-top:6px}
    .provider-popup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .provider-popup-form label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#0b3552}
    .provider-popup-form input,.provider-popup-form select,.provider-popup-form textarea{width:100%;border:1px solid #c9dce2;border-radius:10px;padding:10px 12px;background:#fff;color:#29495c;font-size:14px}
    .provider-popup-form textarea{min-height:82px;resize:vertical}
    .provider-popup-submit{border:0;border-radius:10px;background:#087f91;color:#fff;padding:12px 14px;font-weight:900;cursor:pointer}
    @media(max-width:760px){.live-provider-tabs{display:none!important}#modal.provider-popup-large .modal{width:96vw}.provider-popup-site{height:220px}.provider-popup-grid{grid-template-columns:1fr}.provider-popup-unverified strong{font-size:18px}}
  `;
  document.head.appendChild(style);

  const layer=document.createElement('div');
  layer.className='live-provider-tabs';
  layer.setAttribute('aria-label','Featured medical transportation providers');
  root.appendChild(layer);

  const modalRoot=document.getElementById('modal');
  if(modalRoot){
    new MutationObserver(()=>{
      if(!modalRoot.classList.contains('open')&&modalRoot.classList.contains('provider-popup-large')) modalRoot.classList.remove('provider-popup-large');
    }).observe(modalRoot,{attributes:true,attributeFilter:['class']});
  }

  function setModal(title,html){
    const modal=document.getElementById('modal');
    const heading=document.getElementById('modalTitle');
    const body=document.getElementById('modalBody');
    if(!modal||!heading||!body) return false;
    heading.textContent=title;
    body.innerHTML=html;
    modal.classList.add('provider-popup-large','open');
    return true;
  }

  function websitePreview(p){
    if(p.landingImage){
      const image=`<img src="${esc(p.landingImage)}" alt="${esc(p.name)} website landing page">`;
      return p.website?`<a class="provider-popup-site" href="${esc(p.website)}" target="_blank" rel="noopener">${image}</a>`:`<div class="provider-popup-site">${image}</div>`;
    }
    return `<div class="provider-popup-site"><div class="provider-popup-browser"><i></i><i></i><i></i><span>${esc(p.website||'Provider website not verified')}</span></div><div class="provider-popup-unverified"><strong>Provider website not verified</strong><p>No verified public homepage is currently attached to this showcase provider. When a verified provider website is added, its actual landing-page image will appear here.</p></div></div>`;
  }

  function openProvider(index){
    const p=providers[index];
    if(!p) return;
    const html=`
      ${websitePreview(p)}
      <div class="provider-popup-summary">
        <div><div class="provider-popup-city">${esc(p.city)}</div><div class="tags">${p.services.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div></div>
        <div class="provider-popup-actions"><button type="button" class="provider-popup-contact" data-provider-contact="${index}">Contact Provider</button><button type="button" class="provider-popup-schedule" data-provider-schedule="${index}">Schedule a Ride</button></div>
      </div>
      <p class="provider-popup-note">Provider information should be verified independently before arranging transportation. Direct provider contact details will be used when the provider has verified its listing; otherwise Eazy routes the request for follow-up.</p>`;
    if(!setModal(p.name,html)) return;
    document.querySelector(`[data-provider-contact="${index}"]`)?.addEventListener('click',()=>openContact(index));
    document.querySelector(`[data-provider-schedule="${index}"]`)?.addEventListener('click',()=>openSchedule(index));
  }

  function openContact(index){
    const p=providers[index];
    if(!p) return;
    const html=`<p class="provider-meta"><b>${esc(p.name)}</b><br>${esc(p.city)}</p><form class="provider-popup-form" id="providerContactForm"><div class="provider-popup-grid"><label>Your Name<input name="name" required autocomplete="name"></label><label>Phone<input name="phone" required inputmode="tel" autocomplete="tel"></label></div><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Message<textarea name="message" required placeholder="What would you like to ask the provider?"></textarea></label><button class="provider-popup-submit" type="submit">Send Contact Request</button><div class="ride-note">Eazy will route this contact request to the provider when direct provider contact information is not yet verified.</div></form>`;
    if(!setModal(`Contact ${p.name}`,html)) return;
    document.getElementById('providerContactForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(e.currentTarget).entries());
      const subject=`Provider Contact Request - ${p.name}`;
      const body=[`Provider: ${p.name}`,`Location: ${p.city}`,`Name: ${d.name}`,`Phone: ${d.phone}`,`Email: ${d.email}`,`Message: ${d.message}`,`Submitted via: EazyMedicalTransportation.com`].join('\n');
      window.location.href=`mailto:info@eazymedicaltransportation.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  function openSchedule(index){
    const p=providers[index];
    if(!p) return;
    const serviceOptions=[...new Set([...p.services,'Wheelchair','Ambulatory','Stretcher','Dialysis','Companion Assistance'])];
    const html=`<p class="provider-meta"><b>${esc(p.name)}</b><br>${esc(p.city)}</p><form class="provider-popup-form" id="providerScheduleForm"><div class="provider-popup-grid"><label>Passenger Name<input name="passenger" required autocomplete="name"></label><label>Phone Number<input name="phone" required inputmode="tel" autocomplete="tel"></label></div><label>Pickup Address<input name="pickup" required autocomplete="street-address"></label><label>Destination<input name="destination" required></label><div class="provider-popup-grid"><label>Ride Date<input type="date" name="date" required></label><label>Pickup Time<input type="time" name="time" required></label></div><div class="provider-popup-grid"><label>Trip Type<select name="trip"><option>Round Trip</option><option>One Way</option></select></label><label>Service Needed<select name="service">${serviceOptions.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label></div><label>Special Instructions<textarea name="notes" placeholder="Wheelchair details, stairs, oxygen, escort needs, return time, etc."></textarea></label><button class="provider-popup-submit" type="submit">Send Ride Request</button><div class="ride-note">A ride is not confirmed until the provider accepts the request and confirms the trip.</div></form>`;
    if(!setModal(`Schedule a Ride — ${p.name}`,html)) return;
    document.getElementById('providerScheduleForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(e.currentTarget).entries());
      const subject=`Ride Request - ${p.name}`;
      const body=[`Provider: ${p.name}`,`Provider Location: ${p.city}`,`Passenger: ${d.passenger}`,`Phone: ${d.phone}`,`Pickup: ${d.pickup}`,`Destination: ${d.destination}`,`Date: ${d.date}`,`Time: ${d.time}`,`Trip: ${d.trip}`,`Service: ${d.service}`,`Notes: ${d.notes||''}`,`Submitted via: EazyMedicalTransportation.com`].join('\n');
      window.location.href=`mailto:info@eazymedicaltransportation.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  const tabs=[];
  cards.forEach((pos,index)=>{
    const p=providers[index];
    const tab=document.createElement('button');
    tab.type='button';
    tab.className='live-provider-tab';
    tab.setAttribute('role','tab');
    tab.setAttribute('aria-label',`${p.name}, ${p.city}. Services: ${p.services.join(', ')}. Open provider details.`);
    tab.style.left=pos.left;
    tab.style.width=pos.width;
    tab.addEventListener('click',()=>openProvider(index));
    layer.appendChild(tab);
    tabs.push(tab);

    const view=document.createElement('button');
    view.type='button';
    view.className='live-provider-view';
    view.setAttribute('aria-label',`View ${p.name}`);
    view.style.left=pos.viewLeft;
    view.style.width=pos.viewWidth;
    view.addEventListener('click',()=>openProvider(index));
    layer.appendChild(view);
  });

  layer.setAttribute('role','tablist');
  tabs.forEach((tab,i)=>{
    tab.tabIndex=i===0?0:-1;
    tab.addEventListener('keydown',e=>{
      let next=null;
      if(e.key==='ArrowRight') next=(i+1)%tabs.length;
      if(e.key==='ArrowLeft') next=(i-1+tabs.length)%tabs.length;
      if(e.key==='Home') next=0;
      if(e.key==='End') next=tabs.length-1;
      if(next!==null){e.preventDefault();tabs.forEach(t=>t.tabIndex=-1);tabs[next].tabIndex=0;tabs[next].focus()}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openProvider(i)}
    });
  });
})();
