(()=>{
  'use strict';

  function closeOtherGroups(activeGroup=null){
    document.querySelectorAll('.nav-group.open').forEach(group=>{
      if(group!==activeGroup) group.classList.remove('open');
    });
  }

  // Enforce one open submenu at a time after the page's existing toggle runs.
  document.addEventListener('click',event=>{
    const toggle=event.target.closest?.('.nav-toggle');
    if(toggle){
      const activeGroup=toggle.closest('.nav-group');
      queueMicrotask(()=>closeOtherGroups(activeGroup?.classList.contains('open')?activeGroup:null));
      return;
    }

    // When a submenu action is chosen, clear all submenu open states so the
    // next time the menu is opened it starts cleanly.
    if(event.target.closest?.('.nav-submenu button,.nav-submenu a,.nav-submenu select')){
      queueMicrotask(()=>closeOtherGroups());
    }
  },true);

  // Safety net: if any other script opens more than one group, keep only the
  // most recently changed/open group.
  const nav=document.getElementById('mNav');
  if(nav){
    let enforcing=false;
    new MutationObserver(mutations=>{
      if(enforcing)return;
      const opened=[...nav.querySelectorAll('.nav-group.open')];
      if(opened.length<=1)return;
      const changed=mutations.map(m=>m.target).find(el=>el?.classList?.contains('nav-group')&&el.classList.contains('open'));
      const keep=changed&&opened.includes(changed)?changed:opened[opened.length-1];
      enforcing=true;
      opened.forEach(group=>{if(group!==keep)group.classList.remove('open')});
      enforcing=false;
    }).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  }
})();
