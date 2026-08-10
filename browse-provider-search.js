(()=>{
  'use strict';

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function openBrowseProviderSearch(){
    const modal=document.getElementById('modal');
    const title=document.getElementById('modalTitle');
    const body=document.getElementById('modalBody');
    if(!modal||!title||!body)return;

    title.textContent='Search Providers by Name';
    body.innerHTML=`
      <form id="browseProviderNameForm" class="ride-form" autocomplete="off">
        <label>Provider Name
          <input id="browseProviderNameInput" type="search" placeholder="Enter provider or company name" aria-label="Provider name">
        </label>
        <button class="ride-submit" type="submit">Search Providers</button>
      </form>
      <div class="claim-callout">Search the nationwide Eazy directory for a specific medical transportation provider.</div>`;
    modal.classList.add('open');
    document.getElementById('mNav')?.classList.remove('open');
    requestAnimationFrame(()=>document.getElementById('browseProviderNameInput')?.focus());
  }

  document.addEventListener('click',e=>{
    const browse=e.target.closest?.('[aria-label="Browse Providers"],[aria-label="Footer Browse Providers"]');
    if(!browse)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openBrowseProviderSearch();
  },true);

  document.addEventListener('submit',e=>{
    if(e.target?.id!=='browseProviderNameForm')return;
    e.preventDefault();
    const input=document.getElementById('browseProviderNameInput');
    const q=String(input?.value||'').trim();
    if(!q){
      input?.focus();
      return;
    }
    if(typeof window.__eazyProviderNameSearch==='function'){
      window.__eazyProviderNameSearch(q);
    }
  },true);

  window.__eazyOpenBrowseProviderSearch=openBrowseProviderSearch;
})();