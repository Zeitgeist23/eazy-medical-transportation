(()=>{
  'use strict';

  const MEDICAL_WORDS=/(hospital|medical|health|clinic|urgent|doctor|physician|veteran|\bva\b|rehab|dialysis|surgery|surgical|cancer|cardio|ortho|pediatr|healthcare|health care|imaging|radiology|therapy|center|centre)/i;
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

  function sameScopeInputs(dest){
    const scope=dest.closest('form')||dest.closest('[role="dialog"]')||dest.closest('.modal')||dest.closest('[class*="modal"]')||document;
    return [...scope.querySelectorAll('input,textarea')];
  }

  function pickupInput(dest){return sameScopeInputs(dest).find(x=>x!==dest&&isPickup(x))||null}

  function locationContext(dest){
    const value=norm(pickupInput(dest)?.value);
    if(!value)return '';
    const zip=value.match(/\b\d{5}\b/)?.[0]||'';
    const state=value.match(/(?:,|\s)([A-Z]{2})(?:\s+\d{5})?\b/i)?.[1]||'';
    const comma=value.split(',').map(x=>x.trim()).filter(Boolean);
    const city=comma.length>=2?comma[comma.length-(zip?2:1)].replace(/\b[A-Z]{2}\b.*$/i,'').trim():'';
    return [city,state,zip].filter(Boolean).join(' ');
  }

  function photonAddress(f){
    const p=f.properties||{};
    const street=[p.housenumber,p.street].filter(Boolean).join(' ');
    const locality=p.city||p.town||p.village||p.district||p.county||'';
    const addr=[street,locality,p.state,p.postcode].filter(Boolean).join(', ');
    const name=p.name||p.street||locality||'';
    return {name:norm(name),address:norm(addr),type:norm(`${p.osm_value||''} ${p.osm_key||''}`)};
  }

  function nominatimAddress(x){
    const a=x.address||{};
    const name=x.name||x.display_name?.split(',')[0]||a.amenity||a.healthcare||'';
    const street=[a.house_number,a.road].filter(Boolean).join(' ');
    const locality=a.city||a.town||a.village||a.hamlet||a.county||'';
    const addr=[street,locality,a.state,a.postcode].filter(Boolean).join(', ');
    return {name:norm(name),address:norm(addr||x.display_name),type:norm(`${x.type||''} ${x.category||''} ${a.amenity||''} ${a.healthcare||''}`)};
  }

  function medicalScore(item,q){
    const hay=`${item.name} ${item.address} ${item.type}`;
    let s=MEDICAL_WORDS.test(hay)?20:0;
    const terms=norm(q).toLowerCase().split(/\s+/).filter(Boolean);
    const h=hay.toLowerCase();
    terms.forEach(t=>{if(h.includes(t))s+=3});
    if(/hospital|clinic|doctors|healthcare|urgent_care/i.test(item.type))s+=15;
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
    const full=norm(`${q} ${ctx}`);
    let items=[];
    try{
      const u=`https://photon.komoot.io/api/?lang=en&limit=15&q=${encodeURIComponent(full)}`;
      const r=await fetch(u,{signal:ac.signal,headers:{Accept:'application/json'}});
      if(r.ok){const j=await r.json();items=(j.features||[]).map(photonAddress)}
    }catch(e){if(e.name==='AbortError')throw e}
    items=unique(items).map(x=>({...x,score:medicalScore(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(items.length<4){
      try{
        const u=`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=12&q=${encodeURIComponent(full)}`;
        const r=await fetch(u,{signal:ac.signal,headers:{Accept:'application/json','Accept-Language':'en'}});
        if(r.ok){const j=await r.json();items=items.concat(j.map(nominatimAddress).map(x=>({...x,score:medicalScore(x,q)})).filter(x=>x.score>0))}
      }catch(e){if(e.name==='AbortError')throw e}
    }
    return unique(items.sort((a,b)=>(b.score||0)-(a.score||0))).slice(0,8);
  }

  function positionBox(input,box){
    const r=input.getBoundingClientRect();
    box.style.left=`${Math.max(6,r.left)}px`;
    box.style.top=`${Math.min(window.innerHeight-80,r.bottom+4)}px`;
    box.style.width=`${Math.max(260,r.width)}px`;
    box.style.maxWidth=`calc(100vw - ${Math.max(12,r.left+12)}px)`;
  }

  function enhance(input){
    if(!input||input.dataset.eazyMedicalAutocomplete==='2')return;
    input.dataset.eazyMedicalAutocomplete='2';
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
      box.innerHTML=items.map((x,i)=>`<button type="button" class="eazy-medical-option" data-i="${i}" role="option"><b>${esc(x.name)}</b><span>${esc(x.address)}</span></button>`).join('')+'<div class="eazy-medical-hint">Medical-facility search · verify the destination before sending the ride request · © OpenStreetMap contributors</div>';
      box.classList.add('open');
      box.querySelectorAll('.eazy-medical-option').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();choose(Number(b.dataset.i))}));
    };

    input.addEventListener('input',()=>{
      const q=norm(input.value);
      clearTimeout(timers.get(input));
      if(q.length<2){close();return}
      const t=setTimeout(async()=>{
        positionBox(input,box);box.innerHTML='<div class="eazy-medical-loading">Searching medical facilities…</div>';box.classList.add('open');
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
