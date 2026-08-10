(()=>{
  const states=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  const ranges=[[350,369,'AL'],[995,999,'AK'],[850,865,'AZ'],[716,729,'AR'],[900,961,'CA'],[800,816,'CO'],[60,69,'CT'],[197,199,'DE'],[200,205,'DC'],[320,349,'FL'],[300,319,'GA'],[398,399,'GA'],[967,968,'HI'],[832,838,'ID'],[600,629,'IL'],[460,479,'IN'],[500,528,'IA'],[660,679,'KS'],[400,427,'KY'],[700,714,'LA'],[39,49,'ME'],[206,219,'MD'],[10,27,'MA'],[55,55,'MA'],[480,499,'MI'],[550,567,'MN'],[386,397,'MS'],[630,658,'MO'],[590,599,'MT'],[680,693,'NE'],[889,898,'NV'],[30,38,'NH'],[70,89,'NJ'],[870,884,'NM'],[5,5,'NY'],[63,63,'NY'],[100,149,'NY'],[270,289,'NC'],[580,588,'ND'],[430,459,'OH'],[730,749,'OK'],[970,979,'OR'],[150,196,'PA'],[28,29,'RI'],[290,299,'SC'],[570,577,'SD'],[370,385,'TN'],[733,733,'TX'],[750,799,'TX'],[885,885,'TX'],[840,847,'UT'],[50,59,'VT'],[201,201,'VA'],[220,246,'VA'],[980,994,'WA'],[247,268,'WV'],[530,549,'WI'],[820,831,'WY']];
  let currentState='IL',dropdown=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const stateName=abbr=>(states.find(s=>s[0]===abbr)||[abbr,abbr])[1];
  const zip5=v=>{const m=String(v||'').match(/\b(\d{5})(?:-\d{4})?\b/);return m?m[1]:''};
  const stateFromZip=zip=>{if(!zip)return'';const p=Number(zip.slice(0,3)),r=ranges.find(([a,b])=>p>=a&&p<=b);return r?r[2]:''};
  function stateFromText(text){const raw=String(text||''),up=raw.toUpperCase();for(const [abbr,name] of states){if(new RegExp(`(?:^|[\\s,])${abbr}(?:$|[\\s,])`).test(up))return abbr;if(raw.toLowerCase().includes(name.toLowerCase()))return abbr}return''}
  function closeDropdown(){if(dropdown){dropdown.remove();dropdown=null}}
  function openModal(title,html){const w=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');if(!w||!t||!b)return;t.textContent=title;b.innerHTML=html;w.classList.add('open')}
  function closeModal(){const w=document.getElementById('modal');if(w)w.classList.remove('open')}
  function scrollRatio(r){const root=document.getElementById('desktopDirectory');if(!root)return;window.scrollTo({top:Math.max(0,Math.round(root.offsetTop+root.offsetHeight*r)),behavior:'smooth'})}
  async function getStateData(abbr){const r=await fetch(`data/providers/${abbr}.json?v=controls5`,{cache:'no-store'});if(!r.ok)throw new Error('State database unavailable');return r.json()}
  function providerList(list,note=''){if(!list.length)return `${note?`<div class="claim-callout">${esc(note)}</div>`:''}<div class="claim-callout">No matching providers are currently indexed for this selection.</div>`;return `${note?`<div class="claim-callout">${esc(note)}</div>`:''}<div class="results">${list.slice(0,250).map(p=>`<div class="result"><h3>${esc(p.name)}</h3><p>${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city)}, ${esc(p.state)} ${esc(String(p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}</p><div class="tags" style="margin-top:8px">${(p.categories||p.tags||['NEMT']).slice(0,4).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>${p.phone?`<div class="result-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}</div>`).join('')}</div>`}
  function categorySet(data,name){if(!name)return null;return new Set((data.categories?.[name]||[]).map(String))}
  function hasCategory(p,set,name){if(!name)return true;if(set&&set.has(String(p.npi)))return true;return [...(p.categories||[]),...(p.tags||[])].some(x=>String(x).toLowerCase().includes(String(name).toLowerCase()))}
  async function browseState(abbr){closeDropdown();currentState=abbr;window.__eazyMenuState=abbr;const name=stateName(abbr);openModal(`${name} Medical Transportation`,'<div class="claim-callout">Loading provider database…</div>');try{const data=await getStateData(abbr);openModal(`${name} Medical Transportation (${data.providers?.length||0})`,providerList(data.providers||[]))}catch(e){openModal(`${name} Medical Transportation`,'<div class="claim-callout">The provider database could not be loaded. Please try again.</div>')}}
  async function wheelchair(){closeDropdown();const abbr=window.__eazyMenuState||currentState||'IL',name=stateName(abbr);openModal(`${name} Wheelchair Providers`,'<div class="claim-callout">Loading provider database…</div>');try{const data=await getStateData(abbr),ids=new Set((data.categories?.Wheelchair||[]).map(String)),list=(data.providers||[]).filter(p=>ids.has(String(p.npi))||(p.categories||[]).some(x=>String(x).toLowerCase().includes('wheelchair')));openModal(`${name} Wheelchair Providers (${list.length})`,list.length?providerList(list):`<div class="claim-callout">No providers in ${esc(name)} are currently explicitly indexed as wheelchair providers. Other NEMT providers may offer wheelchair service; confirm directly with the provider.</div>`)}catch(e){openModal(`${name} Wheelchair Providers`,'<div class="claim-callout">The provider database could not be loaded. Please try again.</div>')}}
  function showStateDropdown(anchor){closeDropdown();const r=anchor.getBoundingClientRect(),menu=document.createElement('div');dropdown=menu;menu.setAttribute('role','menu');Object.assign(menu.style,{position:'fixed',zIndex:'2000',top:`${Math.min(window.innerHeight-430,r.bottom+5)}px`,left:`${Math.min(window.innerWidth-270,Math.max(8,r.left))}px`,width:'260px',maxHeight:'420px',overflowY:'auto',background:'#fff',border:'1px solid #d7e7eb',borderRadius:'10px',boxShadow:'0 14px 35px rgba(18,63,79,.20)',padding:'7px'});states.forEach(([abbr,name])=>{const b=document.createElement('button');b.type='button';b.textContent=name;Object.assign(b.style,{display:'block',width:'100%',border:'0',background:'#fff',color:'#173b57',textAlign:'left',padding:'10px 12px',borderRadius:'7px',cursor:'pointer',font:'600 14px Arial,Helvetica,sans-serif'});b.onmouseenter=()=>b.style.background='#f0f8fa';b.onmouseleave=()=>b.style.background='#fff';b.onclick=()=>browseState(abbr);menu.appendChild(b)});document.body.appendChild(menu)}
  function selected(desktop,mobile){return document.getElementById(mobile)?.value||document.getElementById(desktop)?.value||''}
  function stripStateTerms(q,abbr){let s=String(q||''),name=stateName(abbr);s=s.replace(new RegExp(`\\b${abbr}\\b`,'ig'),' ').replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),' ');return s.replace(/[,]+/g,' ').replace(/\s+/g,' ').trim()}
  async function runSearch(){const q=selected('location','mLocation').trim(),service=selected('service','mService').trim(),access=selected('accessibility','mAccessibility').trim(),zip=zip5(q),abbr=stateFromText(q)||stateFromZip(zip)||window.__eazyMenuState||'IL',name=stateName(abbr);openModal('Find Providers','<div class="claim-callout">Searching provider database…</div>');try{const data=await getStateData(abbr);let list=data.providers||[],note='';if(zip){const exact=list.filter(p=>String(p.zip||'').slice(0,5)===zip);if(exact.length)list=exact;else{const prefix=zip.slice(0,3),near=list.filter(p=>String(p.zip||'').startsWith(prefix));if(near.length){list=near;note=`No providers are indexed in ZIP ${zip}; showing providers in nearby ${prefix}xx ZIP codes.`}else note=`No providers are indexed in ZIP ${zip} or nearby ${prefix}xx ZIP codes; showing ${name} providers.`}}else if(q){const terms=stripStateTerms(q,abbr).toLowerCase().split(/\s+/).filter(Boolean);if(terms.length){const local=list.filter(p=>{const hay=[p.name,p.city,p.zip,p.address1].join(' ').toLowerCase();return terms.every(t=>hay.includes(t))});if(local.length)list=local;else note=`No exact location matches were found for “${q}”; showing ${name} providers.`}}const sset=categorySet(data,service),aset=categorySet(data,access);if(service)list=list.filter(p=>hasCategory(p,sset,service));if(access)list=list.filter(p=>hasCategory(p,aset,access));currentState=abbr;window.__eazyMenuState=abbr;openModal(`${zip?`Providers for ${zip}`:`${name} Providers`} (${list.length})`,providerList(list,note))}catch(e){console.error('Independent provider search failed',e);openModal('Find Providers','<div class="claim-callout">The provider database could not be loaded. Please try again.</div>')}}
  const actions={'Eazy Medical Transportation home':()=>scrollRatio(0),'Home':()=>scrollRatio(0),'Browse Providers':()=>scrollRatio(.37),'Browse by State':el=>showStateDropdown(el),'Wheelchair Vans':()=>wheelchair(),'About':()=>scrollRatio(.835),'Footer Home':()=>scrollRatio(0),'Footer Browse Providers':()=>scrollRatio(.37),'Footer By State':el=>showStateDropdown(el),'Footer Wheelchair Vans':()=>wheelchair(),'EazyMedicalTransportation.com home':()=>scrollRatio(0),'Close':()=>closeModal()};
  document.addEventListener('click',e=>{const el=e.target.closest('[aria-label]');if(!el)return;const label=el.getAttribute('aria-label');if(label==='Find Providers'){e.preventDefault();e.stopImmediatePropagation();runSearch();return}const fn=actions[label];if(!fn)return;e.preventDefault();e.stopImmediatePropagation();fn(el)},true);
  document.addEventListener('click',e=>{if(e.target?.id==='modal'){e.preventDefault();e.stopImmediatePropagation();closeModal();return}if(dropdown&&!dropdown.contains(e.target)&&!e.target.closest('[aria-label="Browse by State"],[aria-label="Footer By State"]'))closeDropdown()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDropdown();closeModal()}else if(e.key==='Enter'&&e.target?.id==='location'){e.preventDefault();e.stopImmediatePropagation();runSearch()}},true);
  document.addEventListener('submit',e=>{if(e.target?.id==='mSearch'){e.preventDefault();e.stopImmediatePropagation();runSearch()}},true);
  window.__eazyIndependentSearch=runSearch;
  window.__eazyIndependentCloseModal=closeModal;
})();

(()=>{
  if(document.querySelector('script[data-provider-cards-live]'))return;
  const s=document.createElement('script');
  s.src='provider-cards-live.js?v=1';
  s.dataset.providerCardsLive='1';
  document.head.appendChild(s);
})();

(()=>{
  if(document.getElementById('r2d-approved-hero-style')) return;
  const style=document.createElement('style');
  style.id='r2d-approved-hero-style';
  style.textContent=`
    @media (min-width:901px){
      .hero{min-height:838px!important;background:#fff!important}
      .hero-photo{width:64%!important;height:100%!important;right:0!important;top:0!important}
      .hero-photo img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:58% center!important}
      .hero::after{display:block!important;content:""!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;background:linear-gradient(90deg,#fff 0%,#fff 39%,rgba(255,255,255,.99) 44%,rgba(255,255,255,.92) 48%,rgba(255,255,255,.62) 53%,rgba(255,255,255,.20) 59%,rgba(255,255,255,0) 66%)!important}
      .hero-content{padding-top:82px!important;padding-bottom:68px!important}
      .hero-copy{width:600px!important;max-width:38vw!important}
      .hero h1{font-size:66px!important;line-height:1.04!important;letter-spacing:-.048em!important;font-weight:850!important;max-width:610px!important}
      .hero h1 .line:first-child{display:block!important;white-space:normal!important;max-width:590px!important}
      .hero h1 .line:last-child{white-space:nowrap!important}
      .hero-copy>p{max-width:505px!important;margin-top:28px!important;font-size:19px!important;line-height:1.58!important}
      .finder{width:min(1010px,61vw)!important;margin-top:24px!important;padding:22px 25px 24px!important;border-radius:15px!important}
      .finder-grid{grid-template-columns:1fr 1fr 1fr 164px!important;gap:15px!important}
      .control,.search-btn{height:60px!important}
      .search-btn{justify-content:center!important;padding:0 20px!important}
      .finder-points{margin-top:22px!important;padding-top:20px!important;gap:16px!important}
      .point{grid-template-columns:38px 1fr!important}
    }
    @media (min-width:901px) and (max-width:1280px){
      .hero h1{font-size:58px!important}
      .hero-copy{width:540px!important;max-width:44vw!important}
      .hero h1 .line:first-child{max-width:520px!important}
      .finder{width:min(920px,72vw)!important}
      .hero-photo{width:62%!important}
    }
  `;
  document.head.appendChild(style);
})();