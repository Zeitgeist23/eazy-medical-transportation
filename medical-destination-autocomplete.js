(()=>{
  'use strict';

  const STRONG_MEDICAL=/(hospital|medical|health|clinic|urgent care|urgent|doctor|physician|veteran|\bva\b|rehab|dialysis|surgery|surgical|cancer|cardio|ortho|pediatr|healthcare|health care|imaging|radiology|therapy)/i;
  const MEDICAL_TYPES=/(hospital|clinic|doctors|doctor|healthcare|urgent_care|medical|dentist|physician|rehabilitation|dialysis)/i;
  const US_STATES='AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC';
  const controllers=new WeakMap();
  const timers=new WeakMap();
  const selectedIndex=new WeakMap();

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();

  function styleOnce(){
    if(document.getElementById('eazyMedicalAutocompleteStyle'))return;
    const s=document.createElement('style');
    s.id='eazyMedicalAutocompleteStyle';
    s.textContent=`
      .eazy-medical-suggestions{position:fixed;z-index:2147483647;background:#fff;border:1px solid #a9c9d7;border-radius:12px;box-shadow:0 16px 40px rgba(10,50,75,.24);display:none;max-height:330px;overflow:auto;text-align:left}
      .eazy-medical-suggestions.open{display:block}
      .eazy-medical-option{display:block;width:100%;border:0;border-bottom:1px solid #e7eef2;background:#fff;padding:12px 14px;cursor:pointer;text-align:left;color:#143a55;font:inherit}
      .eazy-medical-option:last-of-type{border-bottom:0}
      .eazy-medical-option:hover,.eazy-medical-option.active{background:#eaf8fa}
      .eazy-medical-option b{display:block;font-size:14px;line-height:1.3;margin-bottom:3px}
      .eazy-medical-option span{display:block;font-size:12px;line-height:1.35;color:#617b8b}
      .eazy-medical-hint{padding:8px 12px;font-size:11px;color:#6b7f8b;background:#f7fbfc;border-top:1px solid #e7eef2}
      .eazy-medical-loading{padding:12px 14px;color:#617b8b;font-size:13px}
    `;
    document.head.appendChild(s);
  }

  function labelText(input){
    const parts=[];
    if(input.id){const l=document.querySelector(`label[for="${CSS.escape(input.id)}"]`);if(l)parts.push(l.textContent)}
    if(input.closest('label'))parts.push(input.closest('label').textContent);
    let n=input.previousElementSibling;
    for(let i=0;n&&i<3;i++,n=n.previousElementSibling){if(/^(LABEL|DIV|SPAN|P|B|STRONG)$/i.test(n.tagName))parts.push(n.textContent)}
    const parent=input.parentElement;
    if(parent){
      parent.querySelectorAll(':scope > label,:scope > .field-label,:scope > strong,:scope > b').forEach(x=>parts.push(x.textContent));
      const txt=parent.textContent||'';if(txt.length<160)parts.push(txt);
    }
    return norm(parts.join(' '));
  }

  function isDestination(input){
    if(!input||input.type==='hidden'||input.disabled)return false;
    const key=`${input.name||''} ${input.id||''} ${input.placeholder||''} ${labelText(input)}`;
    return /destination|medical\s*facility|facility\s*destination/i.test(key);
  }

  function isPickup(input){
    const key=`${input.name||''} ${input.id||''} ${input.placeholder||''} ${labelText(input)}`;
    return /pickup\s*address|pickup|origin/i.test(key)&&!/time/i.test(key);
  }

  function sameScope(dest){return dest.closest('form')||dest.closest('[role="dialog"]')||dest.closest('.modal')||dest.closest('[class*="modal"]')||document}
  function sameScopeInputs(dest){return [...sameScope(dest).querySelectorAll('input,textarea')]}
  function pickupInput(dest){return sameScopeInputs(dest).find(x=>x!==dest&&isPickup(x))||null}

  function parseLocation(value){
    value=norm(value);
    const zip=value.match(/\b\d{5}(?:-\d{4})?\b/)?.[0]||'';
    const state=value.match(new RegExp(`(?:,|\\s)(${US_STATES})(?:\\s+\\d{5})?\\b`,'i'))?.[1]?.toUpperCase()||'';
    const beforeState=state?value.split(new RegExp(`,?\\s+${state}\\b`,'i'))[0]:'';
    const city=beforeState?beforeState.split(',').pop().trim():'';
    return {city,state,zip,text:[city,state,zip].filter(Boolean).join(' ')};
  }

  function providerLocation(dest){
    const scope=sameScope(dest);
    const text=norm(scope.textContent||'');
    const re=new RegExp(`\\b([A-Z][A-Z .'-]{2,35}),\\s*(${US_STATES})\\b`,'g');
    let m;
    while((m=re.exec(text))){
      const city=norm(m[1]);
      const state=m[2].toUpperCase();
      if(!/PASSENGER|PICKUP|DESTINATION|SERVICE|SCHEDULE|TRANSPORTATION/i.test(city))return {city,state,zip:'',text:`${city} ${state}`};
    }
    return {city:'',state:'',zip:'',text:''};
  }

  function locationContext(dest){
    const pickup=parseLocation(pickupInput(dest)?.value);
    const provider=providerLocation(dest);
    if(pickup.state||pickup.zip)return pickup;
    if(pickup.city&&provider.state)return {city:pickup.city,state:provider.state,zip:'',text:`${pickup.city} ${provider.state}`};
    return provider;
  }

  function photonAddress(f){
    const p=f.properties||{};
    const street=[p.housenumber,p.street].filter(Boolean).join(' ');
    const locality=p.city||p.town||p.village||p.district||p.county||'';
    const addr=[street,locality,p.state,p.postcode].filter(Boolean).join(', ');
    const name=p.name||p.street||locality||'';
    return {name:norm(name),address:norm(addr),type:norm(`${p.osm_value||''} ${p.osm_key||''}`),state:norm(p.state||''),country:norm(p.country||''),countrycode:norm(p.countrycode||'').toUpperCase()};
  }

  function nominatimAddress(x){
    const a=x.address||{};
    const name=x.name||x.display_name?.split(',')[0]||a.amenity||a.healthcare||'';
    const street=[a.house_number,a.road].filter(Boolean).join(' ');
    const locality=a.city||a.town||a.village||a.hamlet||a.county||'';
    const addr=[street,locality,a.state,a.postcode].filter(Boolean).join(', ');
    return {name:norm(name),address:norm(addr||x.display_name),type:norm(`${x.type||''} ${x.category||''} ${a.amenity||''} ${a.healthcare||''}`),state:norm(a.state||''),country:norm(a.country||''),countrycode:norm(a.country_code||'').toUpperCase()};
  }

  function isUS(item){
    if(item.countrycode)return item.countrycode==='US';
    return /united states|usa|u\.s\.a\.?/i.test(item.country||'')||/\b(?:IL|IN|WI|MI|MO|IA)\b/.test(item.address||'');
  }

  function isMedicalCandidate(item){
    return MEDICAL_TYPES.test(item.type||'')||STRONG_MEDICAL.test(`${item.name||''} ${item.type||''}`);
  }

  function stateMatches(item,state){
    if(!state)return false;
    const names={IL:'Illinois',IN:'Indiana',WI:'Wisconsin',MI:'Michigan',MO:'Missouri',IA:'Iowa',FL:'Florida',CA:'California',NY:'New York',TX:'Texas',OK:'Oklahoma',VA:'Virginia',NC:'North Carolina',LA:'Louisiana'};
    return new RegExp(`\\b${state}\\b|\\b${names[state]||state}\\b`,'i').test(`${item.state} ${item.address}`);
  }

  function score(item,q,ctx){
    const hay=`${item.name} ${item.address} ${item.type}`.toLowerCase();
    let s=0;
    const terms=norm(q).toLowerCase().split(/\s+/).filter(Boolean);
    terms.forEach(t=>{if(hay.includes(t))s+=8});
    if(MEDICAL_TYPES.test(item.type||''))s+=40;
    if(STRONG_MEDICAL.test(item.name||''))s+=20;
    if(ctx?.state&&stateMatches(item,ctx.state))s+=50;
    else if(ctx?.state)s-=35;
    if(ctx?.city&&new RegExp(`\\b${ctx.city.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(item.address))s+=20;
    return s;
  }

  function unique(items){
    const seen=new Set();
    return items.filter(x=>{
      if(!x.name||!x.address)return false;
      const k=`${x.name}|${x.address}`.toLowerCase();
      if(seen.has(k))return false;seen.add(k);return true;
    });
  }

  async function lookup(dest,q){
    controllers.get(dest)?.abort();
    const ac=new AbortController();controllers.set(dest,ac);
    const ctx=locationContext(dest);
    const region=norm(`${ctx.city||''} ${ctx.state||''}`);
    const queries=[
      norm(`${q} hospital ${region}`),
      norm(`${q} medical ${region}`),
      norm(`${q} clinic ${region}`)
    ].filter(Boolean);
    let items=[];

    const jobs=[];
    for(const query of queries){
      jobs.push(fetch(`https://photon.komoot.io/api/?lang=en&limit=12&q=${encodeURIComponent(query)}`,{signal:ac.signal,headers:{Accept:'application/json'}})
        .then(async r=>r.ok?(await r.json()).features||[]:[])
        .then(fs=>fs.map(photonAddress).filter(isUS).filter(isMedicalCandidate)));
      jobs.push(fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=12&q=${encodeURIComponent(query)}`,{signal:ac.signal,headers:{Accept:'application/json','Accept-Language':'en'}})
        .then(async r=>r.ok?await r.json():[])
        .then(xs=>xs.map(nominatimAddress).filter(isUS).filter(isMedicalCandidate)));
    }

    try{
      const results=await Promise.allSettled(jobs);
      results.forEach(r=>{if(r.status==='fulfilled')items=items.concat(r.value)});
    }catch(e){if(e.name==='AbortError')throw e}

    items=unique(items).map(x=>({...x,score:score(x,q,ctx)}));
    if(ctx?.state){
      const sameState=items.filter(x=>stateMatches(x,ctx.state));
      if(sameState.length)items=sameState;
    }
    return unique(items.sort((a,b)=>b.score-a.score)).slice(0,8);
  }

  function positionBox(input,box){
    const r=input.getBoundingClientRect();
    box.style.left=`${Math.max(6,r.left)}px`;
    box.style.top=`${Math.min(window.innerHeight-80,r.bottom+4)}px`;
    box.style.width=`${Math.max(260,r.width)}px`;
    box.style.maxWidth=`calc(100vw - ${Math.max(12,r.left+12)}px)`;
  }

  function enhance(input){
    if(!input||input.dataset.eazyMedicalAutocomplete==='4')return;
    input.dataset.eazyMedicalAutocomplete='4';
    input.setAttribute('autocomplete','off');
    if(!input.placeholder)input.placeholder='Start typing a hospital, VA, urgent care, doctor or facility';

    const box=document.createElement('div');
    box.className='eazy-medical-suggestions';
    box.setAttribute('role','listbox');
    document.body.appendChild(box);
    let items=[];

    const close=()=>{box.classList.remove('open');selectedIndex.set(input,-1)};
    const highlight=i=>{
      const opts=[...box.querySelectorAll('.eazy-medical-option')];
      if(!opts.length)return;
      i=Math.max(0,Math.min(i,opts.length-1));selectedIndex.set(input,i);
      opts.forEach((o,n)=>o.classList.toggle('active',n===i));opts[i]?.scrollIntoView({block:'nearest'});
    };
    const choose=i=>{
      const x=items[i];if(!x)return;
      input.value=`${x.name} — ${x.address}`;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      close();
    };
    const render=next=>{
      items=next;selectedIndex.set(input,-1);
      if(!items.length){close();return}
      positionBox(input,box);
      box.innerHTML=items.map((x,i)=>`<button type="button" class="eazy-medical-option" data-i="${i}" role="option"><b>${esc(x.name)}</b><span>${esc(x.address)}</span></button>`).join('')+'<div class="eazy-medical-hint">Medical facilities near the pickup/provider area · verify the destination before sending the ride request · © OpenStreetMap contributors</div>';
      box.classList.add('open');
      box.querySelectorAll('.eazy-medical-option').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();choose(Number(b.dataset.i))}));
    };

    input.addEventListener('input',()=>{
      const q=norm(input.value);
      clearTimeout(timers.get(input));
      if(q.length<2){close();return}
      const t=setTimeout(async()=>{
        positionBox(input,box);box.innerHTML='<div class="eazy-medical-loading">Searching nearby medical facilities…</div>';box.classList.add('open');
        try{render(await lookup(input,q))}catch(e){if(e?.name!=='AbortError')close()}
      },400);timers.set(input,t);
    });
    input.addEventListener('focus',()=>{if(items.length){positionBox(input,box);box.classList.add('open')}});
    input.addEventListener('keydown',e=>{
      if(!box.classList.contains('open'))return;
      const current=selectedIndex.get(input)??-1;
      if(e.key==='ArrowDown'){e.preventDefault();highlight(current+1)}
      else if(e.key==='ArrowUp'){e.preventDefault();highlight(current<=0?0:current-1)}
      else if(e.key==='Enter'&&current>=0){e.preventDefault();choose(current)}
      else if(e.key==='Escape')close();
    });
    const reposition=()=>{if(box.classList.contains('open'))positionBox(input,box)};
    window.addEventListener('resize',reposition,{passive:true});
    document.addEventListener('scroll',reposition,true);
    document.addEventListener('mousedown',e=>{if(e.target!==input&&!box.contains(e.target))close()});
  }

  function scan(root=document){
    const inputs=[...(root.matches?.('input,textarea')?[root]:[]),...root.querySelectorAll?.('input,textarea')||[]];
    inputs.filter(isDestination).forEach(enhance);
  }

  styleOnce();scan();
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{subtree:true,childList:true});
  setInterval(scan,1200);
})();
