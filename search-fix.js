(()=>{
  const states=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  const ranges=[
    [350,369,'AL'],[995,999,'AK'],[850,865,'AZ'],[716,729,'AR'],[900,961,'CA'],[800,816,'CO'],[60,69,'CT'],[197,199,'DE'],[200,205,'DC'],[320,349,'FL'],[300,319,'GA'],[398,399,'GA'],[967,968,'HI'],[832,838,'ID'],[600,629,'IL'],[460,479,'IN'],[500,528,'IA'],[660,679,'KS'],[400,427,'KY'],[700,714,'LA'],[39,49,'ME'],[206,219,'MD'],[10,27,'MA'],[55,55,'MA'],[480,499,'MI'],[550,567,'MN'],[386,397,'MS'],[630,658,'MO'],[590,599,'MT'],[680,693,'NE'],[889,898,'NV'],[30,38,'NH'],[70,89,'NJ'],[870,884,'NM'],[5,5,'NY'],[63,63,'NY'],[100,149,'NY'],[270,289,'NC'],[580,588,'ND'],[430,459,'OH'],[730,749,'OK'],[970,979,'OR'],[150,196,'PA'],[28,29,'RI'],[290,299,'SC'],[570,577,'SD'],[370,385,'TN'],[733,733,'TX'],[750,799,'TX'],[885,885,'TX'],[840,847,'UT'],[50,59,'VT'],[201,201,'VA'],[220,246,'VA'],[980,994,'WA'],[247,268,'WV'],[530,549,'WI'],[820,831,'WY']
  ];
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const stateName=abbr=>(states.find(s=>s[0]===abbr)||[abbr,abbr])[1];
  const modal=(title,html)=>{const w=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');if(!w||!t||!b)return;t.textContent=title;b.innerHTML=html;w.classList.add('open')};
  const zip5=v=>{const m=String(v||'').match(/\b(\d{5})(?:-\d{4})?\b/);return m?m[1]:''};
  function stateFromZip(zip){if(!zip)return'';const p=Number(zip.slice(0,3));const r=ranges.find(([a,b])=>p>=a&&p<=b);return r?r[2]:''}
  function stateFromText(text){const raw=String(text||'');const up=raw.toUpperCase();for(const [abbr,name] of states){if(new RegExp(`(?:^|[\\s,])${abbr}(?:$|[\\s,])`).test(up))return abbr;if(raw.toLowerCase().includes(name.toLowerCase()))return abbr}return''}
  async function getStateData(abbr){const r=await fetch(`data/providers/${abbr}.json?v=search3`,{cache:'no-store'});if(!r.ok)throw new Error('Provider database unavailable');return r.json()}
  function selected(idDesktop,idMobile){return document.getElementById(idMobile)?.value||document.getElementById(idDesktop)?.value||''}
  function categorySet(data,name){if(!name)return null;const ids=data.categories?.[name]||[];return new Set(ids.map(String))}
  function hasCategory(p,set,name){if(!name)return true;if(set&&set.has(String(p.npi)))return true;const vals=[...(p.categories||[]),...(p.tags||[])].map(x=>String(x).toLowerCase());return vals.some(x=>x.includes(String(name).toLowerCase()))}
  function providerList(list,note=''){if(!list.length)return `${note?`<div class="claim-callout">${esc(note)}</div>`:''}<div class="claim-callout">No matching providers are currently indexed for this selection.</div>`;return `${note?`<div class="claim-callout">${esc(note)}</div>`:''}<div class="results">${list.slice(0,250).map(p=>`<div class="result"><h3>${esc(p.name)}</h3><p>${esc(p.address1||'')}${p.address1?'<br>':''}${esc(p.city)}, ${esc(p.state)} ${esc((p.zip||'').slice(0,5))}${p.phone?`<br>${esc(p.phone)}`:''}</p><div class="tags" style="margin-top:8px">${(p.categories||p.tags||['NEMT']).slice(0,4).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>${p.phone?`<div class="result-actions"><a class="btn-secondary" href="tel:${esc(p.phone)}">Call Provider</a></div>`:''}</div>`).join('')}</div>`}
  function stripStateTerms(q,abbr){let s=String(q||'');const name=stateName(abbr);s=s.replace(new RegExp(`\\b${abbr}\\b`,'ig'),' ').replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),' ');return s.replace(/[,]+/g,' ').replace(/\s+/g,' ').trim()}
  async function run(){
    const q=selected('location','mLocation').trim();
    const service=selected('service','mService').trim();
    const access=selected('accessibility','mAccessibility').trim();
    const zip=zip5(q);
    const abbr=stateFromText(q)||stateFromZip(zip)||window.__eazyMenuState||'IL';
    const name=stateName(abbr);
    modal('Find Providers','<div class="claim-callout">Searching provider database…</div>');
    try{
      const data=await getStateData(abbr);
      let list=data.providers||[];
      let note='';
      if(zip){
        const exact=list.filter(p=>String(p.zip||'').slice(0,5)===zip);
        if(exact.length){list=exact}
        else{
          const prefix=zip.slice(0,3),near=list.filter(p=>String(p.zip||'').startsWith(prefix));
          if(near.length){list=near;note=`No providers are indexed in ZIP ${zip}; showing providers in nearby ${prefix}xx ZIP codes.`}
          else{note=`No providers are indexed in ZIP ${zip} or nearby ${prefix}xx ZIP codes; showing ${name} providers.`}
        }
      }else if(q){
        const terms=stripStateTerms(q,abbr).toLowerCase().split(/\s+/).filter(Boolean);
        if(terms.length){const local=list.filter(p=>{const hay=[p.name,p.city,p.zip,p.address1].join(' ').toLowerCase();return terms.every(t=>hay.includes(t))});if(local.length)list=local;else note=`No exact location matches were found for “${q}”; showing ${name} providers.`}
      }
      const serviceSet=categorySet(data,service),accessSet=categorySet(data,access);
      if(service)list=list.filter(p=>hasCategory(p,serviceSet,service));
      if(access)list=list.filter(p=>hasCategory(p,accessSet,access));
      window.__eazyMenuState=abbr;
      const label=zip?`Providers for ${zip}`:`${name} Providers`;
      modal(`${label} (${list.length})`,providerList(list,note));
    }catch(e){
      console.error('Independent provider search failed',e);
      modal('Find Providers','<div class="claim-callout">The provider database could not be loaded. Please try again.</div>');
    }
  }
  document.addEventListener('click',e=>{const el=e.target.closest('[aria-label="Find Providers"]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();run()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='location'){e.preventDefault();e.stopImmediatePropagation();run()}},true);
  document.addEventListener('submit',e=>{if(e.target?.id==='mSearch'){e.preventDefault();e.stopImmediatePropagation();run()}},true);
  window.__eazyIndependentSearch=run;
})();
