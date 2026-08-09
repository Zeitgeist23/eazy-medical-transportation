#!/usr/bin/env python3
from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

states=[('AL','Alabama'),('AK','Alaska'),('AZ','Arizona'),('AR','Arkansas'),('CA','California'),('CO','Colorado'),('CT','Connecticut'),('DE','Delaware'),('DC','District of Columbia'),('FL','Florida'),('GA','Georgia'),('HI','Hawaii'),('ID','Idaho'),('IL','Illinois'),('IN','Indiana'),('IA','Iowa'),('KS','Kansas'),('KY','Kentucky'),('LA','Louisiana'),('ME','Maine'),('MD','Maryland'),('MA','Massachusetts'),('MI','Michigan'),('MN','Minnesota'),('MS','Mississippi'),('MO','Missouri'),('MT','Montana'),('NE','Nebraska'),('NV','Nevada'),('NH','New Hampshire'),('NJ','New Jersey'),('NM','New Mexico'),('NY','New York'),('NC','North Carolina'),('ND','North Dakota'),('OH','Ohio'),('OK','Oklahoma'),('OR','Oregon'),('PA','Pennsylvania'),('RI','Rhode Island'),('SC','South Carolina'),('SD','South Dakota'),('TN','Tennessee'),('TX','Texas'),('UT','Utah'),('VT','Vermont'),('VA','Virginia'),('WA','Washington'),('WV','West Virginia'),('WI','Wisconsin'),('WY','Wyoming')]
state_js='['+','.join("{abbr:'%s',name:%r}"%(a,n) for a,n in states)+']'

old_mobile="""<div class=\"nav-group\"><button class=\"nav-toggle\" onclick=\"toggleMenuGroup(this)\"><span>By State</span><span class=\"chev\">▼</span></button><div class=\"nav-submenu\"><button onclick=\"showStateOption('Illinois')\">Illinois</button><button onclick=\"showStateOption('Indiana')\">Indiana</button><button onclick=\"showStateOption('Wisconsin')\">Wisconsin</button><button onclick=\"showStateOption('Michigan')\">Michigan</button><button onclick=\"showStateOption('All States')\">Browse All States</button></div></div>"""
new_mobile="""<div class=\"nav-group\"><button class=\"nav-toggle\" onclick=\"toggleMenuGroup(this)\"><span>By State</span><span class=\"chev\">▼</span></button><div class=\"nav-submenu\"><select id=\"mobileStateSelect\" aria-label=\"Select a state\" style=\"width:100%;padding:11px 14px;border:1px solid #d7e7eb;border-radius:9px;background:#f7fbfc;color:#31576a;font-weight:700\" onchange=\"if(this.value){selectState(this.value,true);this.selectedIndex=0}\"><option value=\"\">Select a state</option></select><button onclick=\"showStateOption('All States')\">Browse All States</button></div></div>"""
assert old_mobile in s, 'mobile state block not found'
s=s.replace(old_mobile,new_mobile,1)

old_decl="let providers=[];"
new_decl="""let providers=[];
let currentState='IL',currentStateName='Illinois',currentStateData=null,providerClaims={};
const stateDirectory=%s;
function stateEntry(value){const v=String(value||'').trim().toLowerCase();return stateDirectory.find(x=>x.abbr.toLowerCase()===v||x.name.toLowerCase()===v)||null}
function stateOptions(selected=''){return stateDirectory.map(x=>`<option value=\"${x.abbr}\" ${x.abbr===selected?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}
function populateStateMenus(){const m=document.getElementById('mobileStateSelect');if(m)m.innerHTML='<option value=\"\">Select a state</option>'+stateOptions('')}
function inferStateFromLocation(q){const raw=String(q||'').trim();const upper=raw.toUpperCase();const abbr=upper.match(/(?:^|[\\s,])([A-Z]{2})(?:$|[\\s,])/);if(abbr){const e=stateEntry(abbr[1]);if(e)return e}const low=raw.toLowerCase();return stateDirectory.find(x=>low.includes(x.name.toLowerCase()))||null}
function normalizeSearchText(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function categoryMatches(p,category){if(!category)return true;const wanted=String(category).toLowerCase();const vals=[...(p.categories||[]),...(p.tags||[])].map(x=>String(x).toLowerCase());return vals.some(x=>x===wanted||x.includes(wanted))}
"""%state_js
assert old_decl in s, 'provider declaration not found'
s=s.replace(old_decl,new_decl,1)

old_load="""async function loadProviders(){try{const [r,cr]=await Promise.all([fetch('providers-il.json?v=2',{cache:'no-store'}),fetch('providers-claimed.json?v=1',{cache:'no-store'})]);const d=await r.json();let claims={};if(cr.ok){const cd=await cr.json();claims=cd.claims||{}}providers=(d.providers||[]).map(p=>Object.assign({},p,claims[String(p.npi)]||{}));renderFeaturedProviders()}catch(e){console.error('Provider database failed to load',e)}}"""
new_load="""async function loadProviders(state='IL'){const entry=stateEntry(state)||stateEntry('IL');try{let r=await fetch(`data/providers/${entry.abbr}.json?v=1`,{cache:'no-store'});if(!r.ok&&entry.abbr==='IL')r=await fetch('providers-il.json?v=2',{cache:'no-store'});if(!r.ok)throw new Error(`Provider database unavailable for ${entry.name}`);const d=await r.json();if(!Object.keys(providerClaims).length){try{const cr=await fetch('providers-claimed.json?v=1',{cache:'no-store'});if(cr.ok){const cd=await cr.json();providerClaims=cd.claims||{}}catch(_){}}providers=(d.providers||[]).map(p=>Object.assign({},p,providerClaims[String(p.npi)]||{}));currentState=entry.abbr;currentStateName=entry.name;currentStateData=d;renderFeaturedProviders();return providers}catch(e){console.error('Provider database failed to load',e);throw e}}"""
assert old_load in s, 'loadProviders function not found'
s=s.replace(old_load,new_load,1)

old_state_line="""function showProviderCategory(tag){closeMobileNav();const list=tag==='All'?providers:providers.filter(p=>(p.tags||[]).includes(tag));openModal(tag==='All'?`Illinois Providers (${list.length})`:tag+' Providers',renderProviderList(list.slice(0,250)))}function showStateOption(state){closeMobileNav();openModal(state==='All States'?'Browse by State':state+' Medical Transportation',`<p>${state==='All States'?'Select a state to browse independent medical transportation providers as directory coverage expands.':'Browse independent medical transportation providers serving '+escapeHtml(state)+'. Directory coverage is being expanded.'}</p>`)}function showWheelchairOption(kind){closeMobileNav();openModal(kind,`<p>Use the directory filters to compare providers offering ${escapeHtml(kind.toLowerCase())}. Confirm vehicle accessibility, availability, pricing, and credentials directly with each provider.</p>`)}"""
new_state_line="""function categoryList(tag){if(tag==='All')return providers;const ids=new Set((currentStateData?.categories?.[tag]||[]).map(String));return providers.filter(p=>ids.has(String(p.npi))||categoryMatches(p,tag))}
function showProviderCategory(tag){closeMobileNav();const list=categoryList(tag);openModal(tag==='All'?`${currentStateName} Providers (${list.length})`:`${currentStateName} ${tag} Providers (${list.length})`,renderProviderList(list.slice(0,250)))}
async function selectState(value,browse=true){closeMobileNav();const entry=stateEntry(value);if(!entry)return;openModal(`${entry.name} Medical Transportation`,'<div class=\"claim-callout\">Loading provider database…</div>');try{await loadProviders(entry.abbr);if(browse)openModal(`${entry.name} Medical Transportation (${providers.length})`,renderProviderList(providers.slice(0,250)))}catch(e){openModal(`${entry.name} Medical Transportation`,'<div class=\"claim-callout\">The provider database for this state is still being generated. Please try again shortly.</div>')}}
function showStateOption(state){closeMobileNav();if(state!=='All States'){selectState(state,true);return}openModal('Browse by State',`<div class=\"claim-callout\">Select a state to browse its independent non-emergency medical transportation provider database.</div><label style=\"display:grid;gap:7px;font-weight:800;color:#173b57\">State<select id=\"statePicker\" style=\"width:100%;border:1px solid #c9dce2;border-radius:11px;padding:11px 12px;background:#fff;color:#29495c;font-size:15px\" onchange=\"if(this.value)selectState(this.value,true)\"><option value=\"\">Choose a state</option>${stateOptions(currentState)}</select></label><p class=\"ride-note\" style=\"margin-top:12px\">The directory contains all active CMS NPPES records in each state carrying the Non-emergency Medical Transport (VAN) taxonomy. Service-specific categories appear only when supported by explicit provider information.</p>`)}
function showWheelchairOption(kind){closeMobileNav();const list=categoryList('Wheelchair');openModal(`${currentStateName} Wheelchair Providers (${list.length})`,list.length?renderProviderList(list.slice(0,250)):`<div class=\"claim-callout\">No providers in ${escapeHtml(currentStateName)} are currently verified or explicitly identified as offering wheelchair service. NEMT providers may offer it; confirm directly with the provider.</div>`)}"""
assert old_state_line in s, 'state/provider category function block not found'
s=s.replace(old_state_line,new_state_line,1)

old_filter="""function getFilteredProviders(){const q=(document.getElementById('mLocation')?.value||document.getElementById('location')?.value||'').trim().toLowerCase();if(!q)return providers;return providers.filter(p=>[p.name,p.city,p.zip,p.address1].some(v=>(v||'').toLowerCase().includes(q)))}function runMobileSearch(e){e.preventDefault();const list=getFilteredProviders();openModal(`Matching Providers (${list.length})`,renderProviderList(list.slice(0,250)))}function runSearch(){const list=getFilteredProviders();openModal(`Matching Providers (${list.length})`,renderProviderList(list.slice(0,250)))}"""
new_filter="""function getSearchValues(){return{q:(document.getElementById('mLocation')?.value||document.getElementById('location')?.value||'').trim(),service:(document.getElementById('mService')?.value||document.getElementById('service')?.value||'').trim(),access:(document.getElementById('mAccessibility')?.value||document.getElementById('accessibility')?.value||'').trim()}}
function getFilteredProviders(){const f=getSearchValues(),terms=normalizeSearchText(f.q).split(/\\s+/).filter(Boolean);return providers.filter(p=>{const hay=normalizeSearchText([p.name,p.city,p.state,p.zip,p.address1].join(' '));if(terms.length&&!terms.every(t=>hay.includes(t)))return false;if(f.service&&!categoryMatches(p,f.service))return false;if(f.access&&!categoryMatches(p,f.access))return false;return true})}
async function ensureStateFromSearch(){const f=getSearchValues(),entry=inferStateFromLocation(f.q);if(entry&&entry.abbr!==currentState)await loadProviders(entry.abbr)}
async function runMobileSearch(e){e.preventDefault();try{await ensureStateFromSearch()}catch(_){}const list=getFilteredProviders();openModal(`Matching ${currentStateName} Providers (${list.length})`,renderProviderList(list.slice(0,250)))}async function runSearch(){try{await ensureStateFromSearch()}catch(_){}const list=getFilteredProviders();openModal(`Matching ${currentStateName} Providers (${list.length})`,renderProviderList(list.slice(0,250)))}"""
assert old_filter in s, 'filter/search block not found'
s=s.replace(old_filter,new_filter,1)

old_end="""document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});loadProviders();"""
new_end="""document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});populateStateMenus();loadProviders('IL');"""
assert old_end in s, 'page init block not found'
s=s.replace(old_end,new_end,1)

p.write_text(s,encoding='utf-8')
print('Patched index.html with 51-state directory support')
