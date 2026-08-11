(()=>{
  'use strict';

  const EAZY_EMAIL='info@eazymedicaltransportation.com';
  const RESPONSE_URL='https://www.eazymedicaltransportation.com/ride-response.html';
  let claimsPromise=null;
  const stateCache=new Map();

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const phoneDigits=v=>String(v||'').replace(/\D/g,'');
  const cleanEmail=v=>String(v||'').trim();

  function requestId(){
    const d=new Date();
    const y=String(d.getFullYear()).slice(-2),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    const rand=Math.random().toString(36).slice(2,6).toUpperCase();
    return `EAZY-${y}${m}${day}-${rand}`;
  }

  function openModal(title,html){
    const modal=document.getElementById('modal'),heading=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
    if(!modal||!heading||!body)return false;
    heading.textContent=title;
    body.innerHTML=html;
    modal.classList.add('open');
    return true;
  }

  async function loadClaims(){
    if(!claimsPromise)claimsPromise=fetch('providers-claimed.json?v=3',{cache:'no-store'}).then(r=>r.ok?r.json():{claims:{}}).catch(()=>({claims:{}}));
    return claimsPromise;
  }

  async function loadState(abbr){
    const a=String(abbr||'').toUpperCase();
    if(!/^[A-Z]{2}$/.test(a))return {providers:[]};
    if(!stateCache.has(a))stateCache.set(a,fetch(`data/providers/${a}.json?v=ride1`,{cache:'no-store'}).then(r=>r.ok?r.json():{providers:[]}).catch(()=>({providers:[]})));
    return stateCache.get(a);
  }

  function claimFor(record,claims){
    return record?.npi?claims?.claims?.[String(record.npi)]||{}:{};
  }

  function connectedRouting(record,claim){
    const dispatchEmail=cleanEmail(claim.dispatchEmail||record?.dispatchEmail||'');
    const accepts=claim.acceptsOnlineRequests===true||/^yes\b/i.test(String(claim.acceptsOnlineRequests||claim.accepts||''));
    return {direct:!!(dispatchEmail&&accepts),dispatchEmail};
  }

  function stateFromDetails(text){
    const m=String(text||'').toUpperCase().match(/,\s*([A-Z]{2})(?:\s+\d{5})?\b/);
    return m?m[1]:'';
  }

  async function providerFromCard(card){
    const name=String(card?.querySelector('h3')?.textContent||'').trim();
    const details=String(card?.querySelector('p')?.innerText||'');
    const state=stateFromDetails(details);
    if(!name||!state)return null;
    const data=await loadState(state),phone=phoneDigits(details);
    const same=(data.providers||[]).filter(p=>String(p.name||'').trim().toLowerCase()===name.toLowerCase());
    if(phone){const exact=same.find(p=>phoneDigits(p.phone)===phone);if(exact)return exact}
    return same[0]||null;
  }

  async function providerFromNpi(npi){
    if(typeof window.findProviderByNpi==='function'){
      try{const p=window.findProviderByNpi(String(npi));if(p)return p}catch(_){ }
    }
    const current=String(window.__eazyMenuState||'IL').toUpperCase();
    const data=await loadState(current);
    return (data.providers||[]).find(p=>String(p.npi)===String(npi))||null;
  }

  function rideForm(record,route){
    const location=[record.address1,record.city,record.state,record.zip].filter(Boolean).join(', ');
    const routing=route.direct
      ?`<div class="claim-callout" style="color:#176348"><b>Connected provider:</b> this request is prepared for ${esc(record.name)} dispatch and copied to EAZY for tracking.</div>`
      :`<div class="claim-callout"><b>Provider not yet connected to EAZY dispatch.</b> EAZY will receive this request for relay/follow-up. A ride is not confirmed until a provider accepts it.</div>`;
    return `${routing}
      <div class="provider-meta" style="margin-bottom:14px"><b>${esc(record.name)}</b><br>${esc(location)}${record.phone?`<br>${esc(record.phone)}`:''}${record.npi?`<br>NPI: ${esc(record.npi)}`:''}</div>
      <form class="ride-form" id="eazyLiveRideForm">
        <div class="ride-grid"><label>Passenger Name<input name="passenger" required autocomplete="name"></label><label>Passenger Email<input type="email" name="email" required autocomplete="email"></label></div>
        <label>Phone Number<input name="phone" required inputmode="tel" autocomplete="tel"></label>
        <label>Pickup Address<input name="pickup" required autocomplete="street-address"></label>
        <label>Destination / Medical Facility<input name="destination" required></label>
        <div class="ride-grid"><label>Appointment Date<input type="date" name="date" required></label><label>Pickup / Appointment Time<input type="time" name="time" required></label></div>
        <div class="ride-grid"><label>Trip Type<select name="trip"><option>Round Trip</option><option>One Way</option></select></label><label>Transportation Need<select name="mobility"><option>Ambulatory</option><option>Wheelchair</option><option>Stretcher</option><option>Dialysis</option><option>Companion Assistance</option></select></label></div>
        <label>Special Transportation Instructions<textarea name="notes" placeholder="Examples: wheelchair size, stairs, escort needs, oxygen equipment, return-time details. Do not include diagnoses or medical records."></textarea></label>
        <button class="ride-submit" type="submit">Continue to Send Ride Request</button>
        <div class="ride-note">Non-emergency transportation only. Submitting a request does not confirm a ride. The provider must accept and confirm availability.</div>
      </form>`;
  }

  async function openRide(record){
    if(!record){openModal('Request a Ride','<div class="claim-callout">This provider record could not be loaded. Please try again.</div>');return}
    const claims=await loadClaims(),claim=claimFor(record,claims),route=connectedRouting(record,claim);
    if(!openModal('Request a Ride',rideForm(record,route)))return;
    const form=document.getElementById('eazyLiveRideForm');
    if(!form)return;
    form.addEventListener('submit',e=>submitRide(e,record,route),{once:true});
  }

  function mailtoFor(record,route,id,data){
    const recipient=route.direct?route.dispatchEmail:EAZY_EMAIL;
    const responseLink=`${RESPONSE_URL}?id=${encodeURIComponent(id)}&provider=${encodeURIComponent(record.name||'Provider')}`;
    const subject=`EAZY Ride Request ${id} — ${record.name||'Provider'}`;
    const body=[
      `EAZY RIDE REQUEST: ${id}`,
      `STATUS: PENDING PROVIDER CONFIRMATION`,
      ``,
      `REQUESTED PROVIDER`,
      `${record.name||''}`,
      `NPI: ${record.npi||''}`,
      `Provider phone: ${record.phone||''}`,
      ``,
      `PASSENGER / TRIP`,
      `Passenger: ${data.passenger||''}`,
      `Passenger email: ${data.email||''}`,
      `Passenger phone: ${data.phone||''}`,
      `Pickup: ${data.pickup||''}`,
      `Destination: ${data.destination||''}`,
      `Date: ${data.date||''}`,
      `Time: ${data.time||''}`,
      `Trip: ${data.trip||''}`,
      `Transportation need: ${data.mobility||''}`,
      `Special instructions: ${data.notes||'None provided'}`,
      ``,
      route.direct?`PROVIDER: Please accept or decline this request at:`:`EAZY: Please relay this request to the requested provider and track the response.`,
      route.direct?responseLink:'',
      route.direct?`You may also reply directly to the passenger and quote request ${id}.`:'',
      ``,
      `A ride is not confirmed until the provider accepts it.`
    ].filter(v=>v!==undefined).join('\n');
    const params=new URLSearchParams();
    if(route.direct)params.set('cc',EAZY_EMAIL);
    params.set('subject',subject);
    params.set('body',body);
    return `mailto:${encodeURIComponent(recipient)}?${params.toString()}`;
  }

  function submitRide(e,record,route){
    e.preventDefault();
    const form=e.currentTarget,data=Object.fromEntries(new FormData(form).entries()),id=requestId();
    const href=mailtoFor(record,route,id,data);
    const next=route.direct
      ?`Your email application is opening a request addressed directly to <b>${esc(record.name)}</b>, with EAZY copied for tracking.`
      :`Your email application is opening a request addressed to <b>EAZY</b> for relay to ${esc(record.name)}.`;
    openModal('Ride Request Ready',`<div class="claim-callout"><b>Request ${esc(id)}</b><br>Status: <b>Pending Provider Confirmation</b></div><p class="provider-meta">${next}</p><p class="ride-note">Send the prepared email to submit the request. Keep the request number. The ride is booked only after the provider confirms availability.</p><div class="provider-actions">${record.phone?`<a class="btn-secondary" href="tel:${esc(record.phone)}">Call Provider</a>`:''}<a class="btn-primary" href="${esc(href)}">Open Prepared Request</a></div>`);
    setTimeout(()=>{window.location.href=href},120);
  }

  function addRequestButton(card){
    if(!card||card.dataset.eazyRideButton==='1')return;
    card.dataset.eazyRideButton='1';
    let actions=card.querySelector('.result-actions');
    if(!actions){actions=document.createElement('div');actions.className='result-actions';card.appendChild(actions)}
    const button=document.createElement('button');
    button.type='button';
    button.className='btn-primary eazy-request-ride';
    button.textContent='Request a Ride';
    button.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation();
      button.disabled=true;
      try{await openRide(await providerFromCard(card))}finally{button.disabled=false}
    });
    actions.appendChild(button);
  }

  function enhanceResults(root=document){
    root.querySelectorAll?.('.result').forEach(addRequestButton);
  }

  document.addEventListener('click',async e=>{
    const existing=e.target.closest?.('[onclick*="requestRideByNpi"]');
    if(!existing)return;
    const code=existing.getAttribute('onclick')||'',m=code.match(/requestRideByNpi\(['\"]([^'\"]+)['\"]\)/);
    if(!m)return;
    e.preventDefault();e.stopImmediatePropagation();
    await openRide(await providerFromNpi(m[1]));
  },true);

  new MutationObserver(mutations=>{
    for(const m of mutations)for(const node of m.addedNodes)if(node.nodeType===1){if(node.matches?.('.result'))addRequestButton(node);enhanceResults(node)}
  }).observe(document.body,{subtree:true,childList:true});

  enhanceResults();
  window.__eazyOpenRideRequest=async npi=>openRide(await providerFromNpi(npi));
})();
