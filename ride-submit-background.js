(()=>{
  'use strict';
  const API='/api/ride-request';
  let indexPromise=null;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const digits=v=>String(v||'').replace(/\D/g,'');

  function modalParts(){return{modal:document.getElementById('modal'),title:document.getElementById('modalTitle'),body:document.getElementById('modalBody')}}
  function show(title,html){const p=modalParts();if(!p.modal||!p.title||!p.body)return;p.title.textContent=title;p.body.innerHTML=html;p.modal.classList.add('open')}

  async function loadIndex(){
    if(!indexPromise)indexPromise=fetch('data/provider-name-index.json?v=ride-submit-1',{cache:'no-store'}).then(r=>r.ok?r.json():{providers:[]}).catch(()=>({providers:[]}));
    return indexPromise;
  }

  function ensureEmail(form){
    if(!form||form.querySelector('[name="email"]'))return;
    const phone=form.querySelector('[name="phone"]');
    if(!phone)return;
    const label=document.createElement('label');
    label.innerHTML='Passenger Email<input type="email" name="email" required autocomplete="email">';
    const grid=phone.closest('.provider-popup-grid,.ride-grid');
    if(grid)grid.appendChild(label);else phone.closest('label')?.after(label);
  }

  function providerText(){
    const p=modalParts();
    const title=String(p.title?.textContent||'').replace(/^Schedule a Ride\s*[—-]\s*/i,'').replace(/^Request a Ride\s*[—-]?\s*/i,'').trim();
    const meta=String(p.body?.querySelector('.provider-meta')?.innerText||'').trim();
    return {title,meta};
  }

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
    return {name:name||record.name||'Provider',npi:record.npi||'',phone:record.phone||phone||'',city:record.city||city||'',state:record.state||state||''};
  }

  async function submit(form){
    ensureEmail(form);
    if(!form.reportValidity())return;
    const button=form.querySelector('button[type="submit"]');
    const old=button?.textContent||'Send Ride Request';
    if(button){button.disabled=true;button.textContent='Sending Ride Request…'}
    const d=Object.fromEntries(new FormData(form).entries());
    try{
      const provider=await resolveProvider();
      const payload={
        provider,
        passenger:{name:d.passenger||'',email:d.email||'',phone:d.phone||''},
        trip:{pickup:d.pickup||'',destination:d.destination||'',date:d.date||'',time:d.time||'',tripType:d.trip||'',service:d.service||d.mobility||'',notes:d.notes||''}
      };
      const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});
      const result=await r.json().catch(()=>({ok:false,error:'The server returned an unreadable response.'}));
      if(!r.ok||!result.ok)throw new Error(result.error||'Ride request could not be submitted.');
      const route=result.routedDirectly
        ?`<b>${esc(result.provider)}</b> dispatch was notified automatically, and EAZY received a tracking copy.`
        :`EAZY received the request and will route it to <b>${esc(result.provider)}</b>.`;
      show('Ride Request Submitted',`<div class="claim-callout"><b>Request ${esc(result.id)}</b><br>Status: <b>Pending Provider Confirmation</b></div><p class="provider-meta">${route}</p><p class="ride-note">You do not need to open or send an email. Keep the request number above. The ride is not confirmed until the provider accepts the trip.</p>${provider.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${esc(provider.phone)}">Call Provider</a></div>`:''}`);
    }catch(err){
      show('Ride Request Not Sent',`<div class="claim-callout">${esc(err?.message||'The request could not be submitted.')}</div><p class="ride-note">No ride has been booked. Please try again or contact the provider directly.</p>`);
    }finally{
      if(button){button.disabled=false;button.textContent=old}
    }
  }

  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form?.id!=='providerScheduleForm'&&form?.id!=='eazyLiveRideForm'&&form?.id!=='rideRequestForm')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    submit(form);
  },true);

  const observer=new MutationObserver(()=>{
    ensureEmail(document.getElementById('providerScheduleForm'));
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  ensureEmail(document.getElementById('providerScheduleForm'));
})();
