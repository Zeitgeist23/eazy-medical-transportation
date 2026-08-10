(()=>{
  'use strict';

  const root=document.getElementById('desktopDirectory');
  if(!root||root.querySelector('.live-provider-tabs')) return;

  const providers=[
    {name:'North Shore Medical Transport',city:'Evanston, IL',services:['Wheelchair','Ambulatory']},
    {name:'Chicago Senior Ride Services',city:'Chicago, IL',services:['Ambulatory','Companion']},
    {name:'Lake County Wheelchair Transit',city:'Waukegan, IL',services:['Wheelchair','Stretcher']},
    {name:'Suburban Patient Transport',city:'Schaumburg, IL',services:['Ambulatory','Wheelchair']},
    {name:'Metro Dialysis Rides',city:'Naperville, IL',services:['Dialysis','Wheelchair']},
    {name:'Heartland Medical Transit',city:'Aurora, IL',services:['Ambulatory','Stretcher']}
  ];

  const cards=[
    {left:'4.45%',width:'12.75%',viewLeft:'6.30%',viewWidth:'10.30%'},
    {left:'18.65%',width:'12.75%',viewLeft:'20.20%',viewWidth:'10.50%'},
    {left:'33.00%',width:'12.75%',viewLeft:'34.60%',viewWidth:'10.40%'},
    {left:'47.20%',width:'12.75%',viewLeft:'48.70%',viewWidth:'10.50%'},
    {left:'60.70%',width:'12.75%',viewLeft:'62.10%',viewWidth:'10.50%'},
    {left:'74.70%',width:'12.75%',viewLeft:'76.10%',viewWidth:'10.50%'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    .live-provider-tabs{position:absolute;inset:0;z-index:8;pointer-events:none}
    .live-provider-tab,.live-provider-view{position:absolute;border:0!important;background:transparent!important;color:transparent!important;-webkit-text-fill-color:transparent!important;padding:0!important;margin:0!important;box-shadow:none!important;cursor:pointer;pointer-events:auto;touch-action:manipulation}
    .live-provider-tab{top:43.15%;height:15.65%;border-radius:8px!important}
    .live-provider-view{top:59.35%;height:2.8%;border-radius:4px!important}
    .live-provider-tab:focus-visible,.live-provider-view:focus-visible{outline:2px solid #087f91!important;outline-offset:2px!important}
    @media(max-width:760px){.live-provider-tabs{display:none!important}}
  `;
  document.head.appendChild(style);

  const layer=document.createElement('div');
  layer.className='live-provider-tabs';
  layer.setAttribute('aria-label','Featured medical transportation providers');
  root.appendChild(layer);

  function openProvider(index){
    if(typeof window.showDesktopProvider==='function'){
      window.showDesktopProvider(index);
      return;
    }
    const p=providers[index];
    const modal=document.getElementById('modal');
    const title=document.getElementById('modalTitle');
    const body=document.getElementById('modalBody');
    if(!p||!modal||!title||!body) return;
    title.textContent=p.name;
    body.innerHTML=`<div class="provider-meta">${p.city}</div><div class="tags" style="margin-top:10px">${p.services.map(s=>`<span class="tag">${s}</span>`).join('')}</div><p class="ride-note" style="margin-top:14px">Provider information should be verified independently before arranging transportation.</p>`;
    modal.classList.add('open');
  }

  const tabs=[];
  cards.forEach((pos,index)=>{
    const p=providers[index];

    const tab=document.createElement('button');
    tab.type='button';
    tab.className='live-provider-tab';
    tab.setAttribute('role','tab');
    tab.setAttribute('aria-label',`${p.name}, ${p.city}. Services: ${p.services.join(', ')}. Open provider details.`);
    tab.style.left=pos.left;
    tab.style.width=pos.width;
    tab.addEventListener('click',()=>openProvider(index));
    layer.appendChild(tab);
    tabs.push(tab);

    const view=document.createElement('button');
    view.type='button';
    view.className='live-provider-view';
    view.setAttribute('aria-label',`View ${p.name}`);
    view.style.left=pos.viewLeft;
    view.style.width=pos.viewWidth;
    view.addEventListener('click',()=>openProvider(index));
    layer.appendChild(view);
  });

  layer.setAttribute('role','tablist');
  tabs.forEach((tab,i)=>{
    tab.tabIndex=i===0?0:-1;
    tab.addEventListener('keydown',e=>{
      let next=null;
      if(e.key==='ArrowRight') next=(i+1)%tabs.length;
      if(e.key==='ArrowLeft') next=(i-1+tabs.length)%tabs.length;
      if(e.key==='Home') next=0;
      if(e.key==='End') next=tabs.length-1;
      if(next!==null){
        e.preventDefault();
        tabs.forEach(t=>t.tabIndex=-1);
        tabs[next].tabIndex=0;
        tabs[next].focus();
      }
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openProvider(i)}
    });
  });
})();
