(()=>{
  'use strict';
  const root=document.getElementById('desktopDirectory');
  if(!root)return;

  const states={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pinSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.75 6.5-11.2A6.5 6.5 0 0 0 5.5 9.8C5.5 15.25 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.7" r="2.2" fill="currentColor"/></svg>';
  const serviceSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="7" width="16" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10v6M9 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const accessSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M11 7v5h5l3 5M11 9H8M11 12l-3 5m0 0a5 5 0 1 0 8.5 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const shieldSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.7-2.9 8-7 10-4.1-2-7-5.3-7-10V6l7-3Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9.2 12 1.8 1.8 3.8-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const vanSvg='<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 9c0-2.2 1.8-4 4-4h13l6 6v8H3V9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M19 7v6h6M9 8v6M6 11h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="19" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="19" r="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const wheelchairSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M11 7v5h5l3 5M11 9H8M11 12l-3 5m0 0a5 5 0 1 0 8.5 1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const dropSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2S6 9 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12Z" fill="currentColor"/></svg>';
  const chevSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  root.querySelectorAll('.crisp-provider-layer,.crisp-directory-note,.safe-search-icon,.native-field-icon,.native-field-chevron,.native-disclaimer,.native-featured-heading,.native-featured-layer,.native-browse-link,.native-how-heading').forEach(el=>el.remove());
  document.querySelectorAll('style').forEach(s=>{const t=s.textContent||'';if(t.includes('.crisp-provider-layer')||t.includes('.crisp-directory-note')||s.id==='safe-surgical-ui-styles')s.remove()});

  const style=document.createElement('style');
  style.id='safe-surgical-ui-styles';
  style.textContent=`
    #location,#service,#accessibility{z-index:25!important;pointer-events:auto!important;background:#fff!important;color:#415a6b!important;-webkit-text-fill-color:#415a6b!important;font-weight:500!important;font-size:clamp(9px,.76vw,13px)!important;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    #location{padding-left:42px!important;padding-right:10px!important;cursor:text!important}
    #service{padding-left:42px!important;padding-right:28px!important;cursor:pointer!important;appearance:none!important}
    #accessibility{padding-left:38px!important;padding-right:18px!important;cursor:pointer!important;appearance:none!important;font-size:clamp(8px,.67vw,12px)!important}
    #location::placeholder{color:#415a6b!important;opacity:1!important}
    .native-field-icon,.native-field-chevron{position:absolute;z-index:26;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#0b91a0}
    .native-field-icon svg,.native-field-chevron svg{width:100%;height:100%}
    .native-field-icon.location{left:9.18%;top:29.72%;width:1.05%;height:2.15%}.native-field-icon.service{left:23.47%;top:29.72%;width:1.05%;height:2.15%}.native-field-icon.access{left:39.03%;top:29.72%;width:1.05%;height:2.15%}
    .native-field-chevron.service{left:35.55%;top:29.9%;width:.7%;height:1.65%;color:#174b83}.native-field-chevron.access{left:49.9%;top:29.9%;width:.7%;height:1.65%;color:#174b83}
    .native-disclaimer{position:absolute;left:25.5%;top:34.17%;width:38.2%;height:1.78%;z-index:20;background:rgba(255,255,255,.9);backdrop-filter:blur(3px);border-radius:999px;box-shadow:0 0 8px 5px rgba(255,255,255,.52);display:flex;align-items:center;justify-content:center;gap:7px;color:#40596b;font:600 clamp(8px,.67vw,12px)/1 Arial,Helvetica,sans-serif;white-space:nowrap;pointer-events:none;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .native-disclaimer svg{width:14px;height:16px;color:#0b91a0;flex:0 0 auto}
    .native-featured-heading{position:absolute;left:7.55%;top:37.15%;width:29%;height:4.1%;z-index:20;background:#fff;font-family:Arial,Helvetica,sans-serif;pointer-events:none;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .native-featured-heading h2{margin:0;color:#0b3552;font-size:clamp(13px,1.1vw,20px);line-height:1.2;font-weight:800}.native-featured-heading p{margin:3px 0 0;color:#597181;font-size:clamp(8px,.66vw,12px);line-height:1.2;font-weight:500}
    .native-browse-link{position:absolute;left:85.9%;top:40.45%;width:9.4%;height:1.72%;z-index:20;background:rgba(255,255,255,.9);border-radius:999px;box-shadow:0 0 7px 5px rgba(255,255,255,.5);display:flex;align-items:center;justify-content:flex-end;padding-right:.15%;color:#0c5488;font:700 clamp(8px,.65vw,12px)/1 Arial,Helvetica,sans-serif;pointer-events:none;white-space:nowrap;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .native-featured-layer{position:absolute;inset:0;z-index:19;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;pointer-events:none}
    .native-provider-card{position:absolute;top:43.28%;width:12.7%;height:19.22%;background:#fff;border-radius:8px;overflow:hidden;clip-path:inset(1px round 8px);box-shadow:0 0 0 2px #fff inset;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;padding:1.0% .45% .6%;pointer-events:none}
    .native-provider-card .npc-icon{width:3.3vw;height:3.3vw;max-width:58px;max-height:58px;min-width:30px;min-height:30px;border-radius:50%;background:#eaf6f8;display:grid;place-items:center;color:#0b6686;flex:0 0 auto}.native-provider-card .npc-icon svg{width:62%;height:62%}
    .native-provider-card .npc-name{margin-top:.85%;height:3.65vw;max-height:54px;min-height:36px;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:#111827;font-weight:700;font-size:clamp(8px,.66vw,12px);line-height:1.16;padding:0 .3%;overflow:hidden}
    .native-provider-card .npc-city{height:1.7vw;max-height:24px;min-height:17px;width:100%;display:flex;align-items:center;justify-content:center;gap:4px;color:#174b83;font-weight:600;font-size:clamp(7px,.58vw,11px)}.native-provider-card .npc-city svg{width:9px;height:11px;flex:0 0 auto}
    .native-provider-card .npc-tags{height:2.1vw;max-height:29px;min-height:20px;width:100%;display:flex;align-items:center;justify-content:center;gap:5px}.native-provider-card .npc-tags span{display:inline-flex;align-items:center;justify-content:center;min-height:18px;padding:2px 7px;border:1px solid #b7dfe7;border-radius:999px;background:#eaf7f9;color:#174b83;font-weight:700;font-size:clamp(7px,.53vw,10px);white-space:nowrap}
    .native-provider-card button{margin-top:auto;width:88%;height:2.8vw;max-height:42px;min-height:30px;background:#fff;border:1.5px solid #13889a;border-radius:4px;color:#0b5269;font:700 clamp(8px,.64vw,12px)/1 Arial,Helvetica,sans-serif;pointer-events:auto;cursor:pointer}
    .native-how-heading{position:absolute;left:33.8%;top:63.55%;width:22.6%;height:2.45%;z-index:20;background:rgba(255,255,255,.96);display:flex;align-items:center;justify-content:center;color:#0b3552;font:800 clamp(13px,1.04vw,20px)/1 Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;pointer-events:none}
    @media(max-width:760px){.native-field-icon,.native-field-chevron,.native-disclaimer,.native-featured-heading,.native-featured-layer,.native-browse-link,.native-how-heading{display:none!important}}
  `;
  document.head.appendChild(style);

  const location=document.getElementById('location'),service=document.getElementById('service'),access=document.getElementById('accessibility');
  if(location){location.placeholder='City, State or ZIP Code';location.style.pointerEvents='auto';location.addEventListener('pointerdown',()=>location.focus());location.addEventListener('click',e=>{e.stopPropagation();location.focus()},true)}
  if(service&&service.options.length)service.options[0].textContent='e.g., Dialysis, Doctor Visit';
  if(access&&access.options.length)access.options[0].textContent='e.g., Wheelchair, Stretcher';

  function addIcon(cls,svg,kind='icon'){const el=document.createElement('span');el.className=kind==='chev'?`native-field-chevron ${cls}`:`native-field-icon ${cls}`;el.innerHTML=svg;root.appendChild(el)}
  addIcon('location',pinSvg);addIcon('service',serviceSvg);addIcon('access',accessSvg);addIcon('service',chevSvg,'chev');addIcon('access',chevSvg,'chev');

  const disclaimer=document.createElement('div');disclaimer.className='native-disclaimer';disclaimer.innerHTML=shieldSvg+'<span>This directory lists independent providers. We do not provide transportation services.</span>';root.appendChild(disclaimer);
  const heading=document.createElement('div');heading.className='native-featured-heading';root.appendChild(heading);
  const browse=document.createElement('div');browse.className='native-browse-link';browse.textContent='Browse all providers →';root.appendChild(browse);
  const how=document.createElement('div');how.className='native-how-heading';how.textContent='How the Directory Works';root.appendChild(how);
  const layer=document.createElement('div');layer.className='native-featured-layer';root.appendChild(layer);

  const cardLefts=['4.82%','18.82%','33.22%','47.32%','60.72%','74.72%'];
  let currentCards=[],claimCache=null;
  async function getClaims(){if(claimCache)return claimCache;try{const r=await fetch('providers-claimed.json?v=2',{cache:'no-store'});claimCache=r.ok?((await r.json()).claims||{}):{}}catch(_){claimCache={}}return claimCache}
  function tagsFor(p,data){
    const out=[],npi=String(p.npi||''),cats=data?.categories||{};
    for(const name of ['Wheelchair','Ambulatory','Dialysis','Doctor Visit','Stretcher','Companion']){if((cats[name]||[]).map(String).includes(npi))out.push(name);if(out.length===2)break}
    if(!out.length){for(const t of (p.categories||p.tags||[])){const s=String(t);if(s&&s.toLowerCase()!=='all'&&!out.includes(s))out.push(s);if(out.length===2)break}}
    return out.length?out:['NEMT','Transport Van'];
  }
  function iconFor(tags){const t=(tags[0]||'').toLowerCase();if(t.includes('wheelchair'))return wheelchairSvg;if(t.includes('dialysis'))return dropSvg;return vanSvg}
  function stableHash(v){let h=0;for(const c of String(v||''))h=((h<<5)-h+c.charCodeAt(0))|0;return Math.abs(h)}
  function openProvider(p){const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');if(!modal||!title||!body||!p)return;title.textContent=p.name||'Provider';body.innerHTML=`<div class="provider-meta">${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''} ${esc(String(p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}${p.npi?`<br>NPI: ${esc(p.npi)}`:''}</div><div class="tags" style="margin-top:10px">${(p._tags||['NEMT','Transport Van']).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${p.phone?`<div class="provider-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}<p class="ride-note" style="margin-top:14px">Provider information should be verified independently before arranging transportation.</p>`;modal.classList.add('open')}
  function renderCards(cards,abbr){
    currentCards=cards;
    const stateName=states[abbr]||abbr;
    heading.innerHTML=`<h2>Featured Providers — ${esc(stateName)}</h2><p>Independent NEMT providers in ${esc(stateName)}.</p>`;
    layer.innerHTML=cards.map((p,i)=>`<div class="native-provider-card" style="left:${cardLefts[i]}"><div class="npc-icon">${iconFor(p._tags)}</div><div class="npc-name">${esc(p.name||'Provider')}</div><div class="npc-city">${pinSvg}<span>${esc(p.city||'')}${p.state?`, ${esc(p.state)}`:''}</span></div><div class="npc-tags">${(p._tags||['NEMT','Transport Van']).map(t=>`<span>${esc(t)}</span>`).join('')}</div><button type="button" data-i="${i}">View Provider</button></div>`).join('');
    layer.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openProvider(currentCards[Number(btn.dataset.i)])}));
  }
  async function loadFeatured(abbr){
    if(!states[abbr])abbr='IL';
    try{
      const [r,claims]=await Promise.all([fetch(`data/providers/${abbr}.json?v=cards4`,{cache:'no-store'}),getClaims()]);
      if(!r.ok)return;
      const data=await r.json();
      const ranked=(data.providers||[]).map(p=>{
        const merged=Object.assign({},p,claims[String(p.npi)]||{});
        const tags=tagsFor(merged,data);
        const explicit=tags.some(t=>!['NEMT','Transport Van'].includes(t));
        const score=(merged.claimed?100:0)+(explicit?45:0)+(merged.phone?20:0)+(merged.address1?10:0)+(merged.zip?3:0);
        return Object.assign({},merged,{_tags:tags,_score:score,_hash:stableHash(merged.npi||merged.name)});
      }).sort((a,b)=>b._score-a._score||b._hash-a._hash);
      const cards=ranked.slice(0,6);if(cards.length)renderCards(cards,abbr);
    }catch(_){}
  }

  let shown=window.__eazyMenuState||'IL';
  loadFeatured(shown);
  setInterval(()=>{const next=window.__eazyMenuState||shown;if(next!==shown){shown=next;loadFeatured(next)}},350);
})();
