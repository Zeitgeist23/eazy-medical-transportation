(()=>{
  'use strict';

  const MEDICAL_WORDS=/\b(hospital|medical|health|clinic|urgent care|doctor|physician|va|veterans|rehab|rehabilitation|dialysis|surgery|surgical|cancer|cardiology|orthopedic|orthopaedic|pediatr|women's health|healthcare|health care)\b/i;
  let activeController=null;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function pickupContext(){
    const p=document.querySelector('#eazyLiveRideForm [name="pickup"]');
    return String(p?.value||'').trim();
  }

  function styleOnce(){
    if(document.getElementById('eazyMedicalAutocompleteStyle'))return;
    const s=document.createElement('style');
    s.id='eazyMedicalAutocompleteStyle';
    s.textContent=`
      .eazy-medical-wrap{position:relative}
      .eazy-medical-suggestions{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:99999;background:#fff;border:1px solid #b8cfdb;border-radius:12px;box-shadow:0 12px 28px rgba(14,57,82,.18);overflow:hidden;display:none;max-height:310px;overflow-y:auto}
      .eazy-medical-suggestions.open{display:block}
      .eazy-medical-option{display:block;width:100%;padding:12px 14px;border:0;border-bottom:1px solid #e7eef2;background:#fff;text-align:left;cursor:pointer;color:#143a55;font:inherit}
      .eazy-medical-option:last-child{border-bottom:0}
      .eazy-medical-option:hover,.eazy-medical-option:focus{background:#eef9fb;outline:none}
      .eazy-medical-option b{display:block;font-size:14px;margin-bottom:3px}
      .eazy-medical-option span{display:block;font-size:12px;color:#657f8f;line-height:1.35}
      .eazy-medical-hint{padding:9px 12px;font-size:11px;color:#6a7f8b;background:#f7fbfc;border-top:1px solid #e7eef2}
    `;
    document.head.appendChild(s);
  }

  function formatFeature(f){
    const p=f.properties||{};
    const name=p.name||p.street||p.city||'';
    const address=[p.housenumber&&p.street?`${p.housenumber} ${p.street}`:p.street,p.city||p.town||p.village,p.state,p.postcode].filter(Boolean).join(', ');
    return {name,address,value:[name,address].filter(Boolean).join(' — ')};
  }

  function isMedical(f){
    const p=f.properties||{};
    const hay=[p.name,p.osm_value,p.osm_key,p.street,p.city].filter(Boolean).join(' ');
    return MEDICAL_WORDS.test(hay)||['hospital','clinic','doctors'].includes(String(p.osm_value||'').toLowerCase());
  }

  async function lookup(q){
    if(activeController)activeController.abort();
    activeController=new AbortController();
    const context=pickupContext();
    const query=[q,context].filter(Boolean).join(' ');
    const url=`https://photon.komoot.io/api/?limit=12&q=${encodeURIComponent(query)}`;
    const r=await fetch(url,{signal:activeController.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('facility lookup failed');
    const j=await r.json();
    const items=(j.features||[]).filter(isMedical).map(formatFeature).filter(x=>x.name&&x.address);
    const seen=new Set();
    return items.filter(x=>{const k=x.value.toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,8);
  }

  function enhance(input){
    if(!input||input.dataset.eazyMedicalAutocomplete==='1')return;
    input.dataset.eazyMedicalAutocomplete='1';
    input.setAttribute('autocomplete','off');
    input.setAttribute('placeholder','Start typing a hospital, VA, urgent care, doctor or facility');

    const label=input.closest('label');
    if(!label)return;
    const wrap=document.createElement('div');
    wrap.className='eazy-medical-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);
    const box=document.createElement('div');
    box.className='eazy-medical-suggestions';
    wrap.appendChild(box);

    let timer=null;
    let seq=0;
    const close=()=>box.classList.remove('open');
    const render=items=>{
      if(!items.length){close();return}
      box.innerHTML=items.map((x,i)=>`<button type="button" class="eazy-medical-option" data-i="${i}"><b>${esc(x.name)}</b><span>${esc(x.address)}</span></button>`).join('')+'<div class="eazy-medical-hint">Medical-facility suggestions. Verify the destination before submitting the ride request.</div>';
      box.classList.add('open');
      box.querySelectorAll('.eazy-medical-option').forEach(btn=>btn.addEventListener('click',()=>{
        const x=items[Number(btn.dataset.i)];
        input.value=x.value;
        input.dispatchEvent(new Event('change',{bubbles:true}));
        close();
      }));
    };

    input.addEventListener('input',()=>{
      const q=input.value.trim();
      clearTimeout(timer);
      if(q.length<2){close();return}
      const my=++seq;
      timer=setTimeout(async()=>{
        try{const items=await lookup(q);if(my===seq)render(items)}catch(e){if(e?.name!=='AbortError')close()}
      },350);
    });
    input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))close()});
  }

  function scan(){document.querySelectorAll('#eazyLiveRideForm [name="destination"]').forEach(enhance)}
  styleOnce();
  scan();
  new MutationObserver(scan).observe(document.body,{subtree:true,childList:true});
})();
