(()=>{
  const states=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  let currentState='IL';
  let dropdown=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function closeDropdown(){if(dropdown){dropdown.remove();dropdown=null}}
  function scrollRatio(r){const root=document.getElementById('desktopDirectory');if(!root)return;const y=root.offsetTop+(root.offsetHeight*r);window.scrollTo(0,Math.max(0,Math.round(y)))}
  function openModal(title,html){const wrap=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');if(!wrap||!t||!b)return;t.textContent=title;b.innerHTML=html;wrap.classList.add('open')}
  function stateName(abbr){return (states.find(s=>s[0]===abbr)||[abbr,abbr])[1]}
  async function getStateData(abbr){const r=await fetch(`data/providers/${abbr}.json?v=menu2`,{cache:'no-store'});if(!r.ok)throw new Error('State database unavailable');return r.json()}
  function providerList(data,list){if(!list.length)return '<div class="claim-callout">No matching providers are currently indexed for this selection.</div>';return `<div class="results">${list.slice(0,250).map(p=>`<div class="result"><h3>${esc(p.name)}</h3><p>${esc(p.city)}, ${esc(p.state)} ${esc(p.zip||'')}${p.phone?`<br>${esc(p.phone)}`:''}</p><div class="tags" style="margin-top:8px">${(p.categories||p.tags||['NEMT']).slice(0,4).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>${p.phone?`<div class="result-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}</div>`).join('')}</div>`}
  async function browseState(abbr){closeDropdown();currentState=abbr;window.__eazyMenuState=abbr;const name=stateName(abbr);openModal(`${name} Medical Transportation`,'<div class="claim-callout">Loading provider database…</div>');try{const data=await getStateData(abbr);openModal(`${name} Medical Transportation (${data.providers?.length||0})`,providerList(data,data.providers||[]))}catch(e){openModal(`${name} Medical Transportation`,'<div class="claim-callout">The provider database could not be loaded. Please try again.</div>')}}
  async function wheelchair(){closeDropdown();const abbr=window.__eazyMenuState||currentState||'IL',name=stateName(abbr);openModal(`${name} Wheelchair Providers`,'<div class="claim-callout">Loading provider database…</div>');try{const data=await getStateData(abbr),ids=new Set((data.categories?.Wheelchair||[]).map(String)),list=(data.providers||[]).filter(p=>ids.has(String(p.npi))||(p.categories||[]).some(x=>String(x).toLowerCase().includes('wheelchair')));openModal(`${name} Wheelchair Providers (${list.length})`,list.length?providerList(data,list):`<div class="claim-callout">No providers in ${esc(name)} are currently explicitly indexed as wheelchair providers. Other NEMT providers may offer wheelchair service; confirm directly with the provider.</div>`)}catch(e){openModal(`${name} Wheelchair Providers`,'<div class="claim-callout">The provider database could not be loaded. Please try again.</div>')}}
  function showStateDropdown(anchor){closeDropdown();const r=anchor.getBoundingClientRect(),menu=document.createElement('div');dropdown=menu;menu.setAttribute('role','menu');Object.assign(menu.style,{position:'fixed',zIndex:'2000',top:`${Math.min(window.innerHeight-430,r.bottom+5)}px`,left:`${Math.min(window.innerWidth-270,Math.max(8,r.left))}px`,width:'260px',maxHeight:'420px',overflowY:'auto',background:'#fff',border:'1px solid #d7e7eb',borderRadius:'10px',boxShadow:'0 14px 35px rgba(18,63,79,.20)',padding:'7px'});states.forEach(([abbr,name])=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('role','menuitem');Object.assign(b.style,{display:'block',width:'100%',border:'0',background:'#fff',color:'#173b57',textAlign:'left',padding:'10px 12px',borderRadius:'7px',cursor:'pointer',font:'600 14px Arial,Helvetica,sans-serif'});b.addEventListener('mouseenter',()=>b.style.background='#f0f8fa');b.addEventListener('mouseleave',()=>b.style.background='#fff');b.addEventListener('click',()=>browseState(abbr));menu.appendChild(b)});document.body.appendChild(menu)}
  const actions={
    'Eazy Medical Transportation home':()=>scrollRatio(0),
    'Home':()=>scrollRatio(0),
    'Browse Providers':()=>scrollRatio(.37),
    'Browse by State':el=>showStateDropdown(el),
    'Wheelchair Vans':()=>wheelchair(),
    'About':()=>scrollRatio(.835),
    'Footer Home':()=>scrollRatio(0),
    'Footer Browse Providers':()=>scrollRatio(.37),
    'Footer By State':el=>showStateDropdown(el),
    'Footer Wheelchair Vans':()=>wheelchair(),
    'EazyMedicalTransportation.com home':()=>scrollRatio(0)
  };
  document.addEventListener('click',e=>{const el=e.target.closest('[aria-label]');if(!el)return;const label=el.getAttribute('aria-label'),fn=actions[label];if(!fn)return;e.preventDefault();e.stopImmediatePropagation();fn(el)},true);
  document.addEventListener('click',e=>{if(dropdown&&!dropdown.contains(e.target)&&!e.target.closest('[aria-label="Browse by State"],[aria-label="Footer By State"]'))closeDropdown()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDropdown()});
})();
