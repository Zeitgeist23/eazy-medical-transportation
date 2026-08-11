(()=>{
  function add(){
    if(document.getElementById('eazySeoDirectoryLinks'))return;
    const host=document.querySelector('.mobile .footer')||document.querySelector('.mobile')||document.body;
    const box=document.createElement('section');
    box.id='eazySeoDirectoryLinks';
    box.innerHTML=`<div style="max-width:1100px;margin:0 auto;padding:30px 18px;background:#f6fbfc;border-top:1px solid #d7e7eb">
      <h2 style="margin:0 0 10px;color:#0b3552;font-size:22px">Explore Medical Transportation Resources</h2>
      <p style="margin:0 0 18px;color:#597181;line-height:1.5">Browse providers by state or city, compare transportation services, and read practical NEMT guides.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px">
        <div><strong style="display:block;margin-bottom:8px;color:#0b3552">Browse providers</strong><a href="/browse/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">All states</a><a href="/browse/il/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">Illinois providers</a><a href="/browse/il/chicago/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">Chicago providers</a></div>
        <div><strong style="display:block;margin-bottom:8px;color:#0b3552">Transportation services</strong><a href="/wheelchair-transportation/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">Wheelchair transportation</a><a href="/dialysis-transportation/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">Dialysis transportation</a><a href="/non-emergency-medical-transportation/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">What is NEMT?</a></div>
        <div><strong style="display:block;margin-bottom:8px;color:#0b3552">Learn about Eazy</strong><a href="/guides/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">NEMT guides</a><a href="/about/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">About the directory</a><a href="/data-sources/" style="display:block;color:#087f91;font-weight:800;margin:6px 0">Provider data sources</a></div>
      </div>
    </div>`;
    host.appendChild(box);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
