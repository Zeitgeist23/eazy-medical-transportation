(()=>{
  'use strict';
  const FORMSUBMIT='https://formsubmit.co/ajax/info@eazymedicaltransportation.com';
  const SITE='https://www.eazymedicaltransportation.com/';
  let indexPromise=null,claimsPromise=null;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const digits=v=>String(v||'').replace(/\D/g,'');
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());

  function makeId(){
    const d=new Date(),y=String(d.getFullYear()).slice(-2),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    const rand=(crypto.randomUUID?.()||Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,6).toUpperCase();
    return `EAZY-${y}${m}${day}-${rand}`;
  }
  function modalParts(){return{modal:document.getElementById('modal'),title:document.getElementById('modalTitle'),body:document.getElementById('modalBody')}}
  function show(title,html){const p=modalParts();if(!p.modal||!p.title||!p.body)return;p.title.textContent=title;p.body.innerHTML=html;p.modal.classList.add('open')}
  async function loadIndex(){if(!indexPromise)indexPromise=fetch('data/provider-name-index.json?v=ride-submit-2',{cache:'no-store'}).then(r=>r.ok?r.json():{providers:[]}).catch(()=>({providers:[]}));return indexPromise}
  async function loadClaims(){if(!claimsPromise)claimsPromise=fetch('providers-claimed.json?v=ride-submit-2',{cache:'no-store'}).then(r=>r.ok?r.json():{claims:{}}).catch(()=>({claims:{}}));return claimsPromise}

  function ensureEmail(form){
    if(!form||form.querySelector('[name="email"]'))return;
    const phone=form.querySelector('[name="phone"]');if(!phone)return;
    const label=document.createElement('label');
    label.innerHTML='Passenger Email<input type="email" name="email" required autocomplete="email">';
    const grid=phone.closest('.provider-popup-grid,.ride-grid');
    if(grid)grid.appendChild(label);else phone.closest('label')?.after(label);
  }
  function providerText(){const p=modalParts();const title=String(p.title?.textContent||'').replace(/^Schedule a Ride\s*[—-]\s*/i,'').replace(/^Request a Ride\s*[—-]?\s*/i,'').trim();const meta=String(p.body?.querySelector('.provider-meta')?.innerText||'').trim();return{title,meta}}
  async function resolveProvider(){
    const {title,meta}=providerText(),data=await loadIndex(),all=data.providers||[];
    const name=title||String(meta.split('\n')[0]||'').trim();
    const phone=(meta.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)||[])[0]||'';
    const state=(meta.toUpperCase().match(/,\s*([A-Z]{2})(?:\s+\d{5})?\b/)||[])[1]||'';
    const cityLine=meta.split('\n').find(x=>state&&x.toUpperCase().includes(`, ${state}`))||'';
    const city=cityLine.split(',')[0]?.trim()||'';
    const same=all.filter(p=>norm(p.name)===norm(name));
    const byPhone=phone?same.find(p=>digits(p.phone)===digits(phone)):null;
    const byPlace=same.find(p=>(!state||String(p.state||'').toUpperCase()===state)&&(!city||norm(p.city)===norm(city)));
    const record=byPhone||byPlace||same[0]||{};
    return {name:name||record.name||'Provider',npi:String(record.npi||''),phone:record.phone||phone||'',city:record.city||city||'',state:record.state||state||''};
  }
  async function routingFor(provider){
    const claims=await loadClaims(),claim=provider.npi?claims.claims?.[provider.npi]||{}:{};
    const dispatchEmail=String(claim.dispatchEmail||'').trim();
    const accepts=claim.acceptsOnlineRequests===true||/^yes\b/i.test(String(claim.acceptsOnlineRequests||claim.accepts||''));
    return {direct:!!(accepts&&validEmail(dispatchEmail)),dispatchEmail};
  }
  async function sendAjax(fields){
    const r=await fetch(FORMSUBMIT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(fields)});
    const data=await r.json().catch(()=>({success:false,message:'The ride relay returned an unreadable response.'}));
    if(!r.ok||data.success===false)throw new Error(data.message||`Ride relay failed (${r.status}).`);
    return data;
  }
  async function submit(form){
    ensureEmail(form);if(!form.reportValidity())return;
    const button=form.querySelector('button[type="submit"]'),old=button?.textContent||'Send Ride Request';
    if(button){button.disabled=true;button.textContent='Sending Ride Request…'}
    const d=Object.fromEntries(new FormData(form).entries());
    try{
      const provider=await resolveProvider(),route=await routingFor(provider),id=makeId();
      const responseUrl=new URL('ride-response-v2.html',SITE);
      responseUrl.searchParams.set('id',id);responseUrl.searchParams.set('provider',provider.name);responseUrl.searchParams.set('passengerEmail',d.email||'');responseUrl.searchParams.set('passengerName',d.passenger||'');
      const fields={
        _subject:`EAZY Ride Request ${id} — ${provider.name}`,
        _template:'table',_captcha:'false',_url:SITE,
        request_id:id,status:'PENDING PROVIDER CONFIRMATION',provider:provider.name,provider_npi:provider.npi||'Not available',provider_phone:provider.phone||'Not available',provider_location:[provider.city,provider.state].filter(Boolean).join(', '),
        passenger:d.passenger||'',email:d.email||'',passenger_phone:d.phone||'',pickup:d.pickup||'',destination:d.destination||'',ride_date:d.date||'',pickup_time:d.time||'',trip_type:d.trip||'',service_needed:d.service||d.mobility||'',special_instructions:d.notes||'None provided',
        routing:route.direct?'Connected provider dispatch + EAZY':'EAZY relay/follow-up',
        provider_response_link:route.direct?responseUrl.toString():'Provider is not yet connected to direct EAZY dispatch.'
      };
      if(route.direct)fields._cc=route.dispatchEmail;
      const relay=await sendAjax(fields);
      const msg=String(relay.message||'');
      if(/activate|activation|confirm your email/i.test(msg)){
        show('Ride Request Setup Pending',`<div class="claim-callout"><b>Request ${esc(id)}</b></div><p class="provider-meta">EAZY's background ride relay requires a one-time owner activation before requests can be delivered.</p><p class="ride-note">No ride has been confirmed. Please contact the provider directly for this trip.</p>${provider.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${esc(provider.phone)}">Call Provider</a></div>`:''}`);
        return;
      }
      const routeText=route.direct?`<b>${esc(provider.name)}</b> dispatch was notified automatically and EAZY received a copy.`:`EAZY received the request and will route it to <b>${esc(provider.name)}</b>.`;
      show('Ride Request Submitted',`<div class="claim-callout"><b>Request ${esc(id)}</b><br>Status: <b>Pending Provider Confirmation</b></div><p class="provider-meta">${routeText}</p><p class="ride-note">You do not need to open or send an email. Keep this request number. The ride is not confirmed until the provider accepts the trip.</p>${provider.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${esc(provider.phone)}">Call Provider</a></div>`:''}`);
    }catch(err){
      show('Ride Request Not Sent',`<div class="claim-callout">${esc(err?.message||'The request could not be submitted.')}</div><p class="ride-note">No ride has been booked. Please try again or contact the provider directly.</p>`);
    }finally{if(button){button.disabled=false;button.textContent=old}}
  }

  document.addEventListener('submit',e=>{const form=e.target;if(form?.id!=='providerScheduleForm'&&form?.id!=='eazyLiveRideForm'&&form?.id!=='rideRequestForm')return;e.preventDefault();e.stopImmediatePropagation();submit(form)},true);
  const observer=new MutationObserver(()=>ensureEmail(document.getElementById('providerScheduleForm')));observer.observe(document.documentElement,{subtree:true,childList:true});ensureEmail(document.getElementById('providerScheduleForm'));
})();
