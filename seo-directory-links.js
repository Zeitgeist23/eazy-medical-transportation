(()=>{
  function add(){
    if(document.getElementById('eazySeoDirectoryLinks'))return;
    const host=document.querySelector('.mobile .footer')||document.querySelector('.mobile')||document.body;
    const box=document.createElement('section');
    box.id='eazySeoDirectoryLinks';
    box.innerHTML='<div style="max-width:1100px;margin:0 auto;padding:26px 18px;background:#f6fbfc;border-top:1px solid #d7e7eb"><h2 style="margin:0 0 10px;color:#0b3552;font-size:22px">Explore Medical Transportation Resources</h2><p style="margin:0 0 14px;color:#597181;line-height:1.5">Browse non-emergency medical transportation providers by state or read practical guides for wheelchair, dialysis, Medicaid, Medicare and recurring medical rides.</p><p style="margin:0"><a href="/browse/" style="color:#087f91;font-weight:800;margin-right:18px">Browse Providers by State</a><a href="/guides/" style="color:#087f91;font-weight:800">NEMT Guides</a></p></div>';
    host.appendChild(box);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
