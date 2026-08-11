(()=>{
  'use strict';

  function labelText(input){
    const parts=[];
    if(input.id){
      try{const l=document.querySelector(`label[for="${CSS.escape(input.id)}"]`);if(l)parts.push(l.textContent||'')}catch{}
    }
    if(input.closest('label'))parts.push(input.closest('label').textContent||'');
    let p=input.previousElementSibling;
    for(let i=0;p&&i<3;i++,p=p.previousElementSibling){
      if(/^(LABEL|DIV|SPAN|P|B|STRONG)$/i.test(p.tagName))parts.push(p.textContent||'');
    }
    return parts.join(' ').replace(/\s+/g,' ').trim();
  }

  function isPhoneField(input){
    if(!input||input.disabled||input.type==='hidden')return false;
    const key=`${input.name||''} ${input.id||''} ${input.placeholder||''} ${input.type||''} ${labelText(input)}`;
    return /phone|mobile|telephone|tel\b/i.test(key);
  }

  function digitsOnly(value){
    let d=String(value||'').replace(/\D/g,'');
    if(d.length===11&&d.startsWith('1'))d=d.slice(1);
    return d.slice(0,10);
  }

  function formatPhone(value){
    const d=digitsOnly(value);
    if(!d)return '';
    if(d.length<4)return `(${d}`;
    if(d.length<7)return `(${d.slice(0,3)})${d.slice(3)}`;
    return `(${d.slice(0,3)})${d.slice(3,6)}-${d.slice(6)}`;
  }

  function enhance(input){
    if(!input||input.dataset.eazyPhoneFormat==='1')return;
    input.dataset.eazyPhoneFormat='1';
    input.setAttribute('inputmode','tel');
    input.setAttribute('autocomplete','tel');
    input.setAttribute('maxlength','13');
    if(!input.placeholder)input.placeholder='(555)555-5555';

    const apply=()=>{
      const formatted=formatPhone(input.value);
      if(input.value!==formatted)input.value=formatted;
    };

    input.addEventListener('input',apply);
    input.addEventListener('change',apply);
    input.addEventListener('blur',apply);
    input.addEventListener('paste',()=>setTimeout(apply,0));
    if(input.value)apply();
  }

  function scan(root=document){
    const list=[];
    if(root.matches?.('input'))list.push(root);
    root.querySelectorAll?.('input').forEach(x=>list.push(x));
    list.filter(isPhoneField).forEach(enhance);
  }

  scan();
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{subtree:true,childList:true});
  setInterval(scan,1200);
})();
