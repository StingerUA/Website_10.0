(function(){
  'use strict';

  const raw=(document.documentElement.lang||'tr').toLowerCase();
  const lang=raw.startsWith('ru')?'ru':raw.startsWith('en')?'en':'tr';
  const TEXT={
    tr:{recipient:'Alıcı',copyIban:"IBAN'ı kopyala",copyName:'Alıcı adını kopyala',copied:'Kopyalandı'},
    en:{recipient:'Recipient',copyIban:'Copy IBAN',copyName:'Copy recipient name',copied:'Copied'},
    ru:{recipient:'Получатель',copyIban:'Копировать IBAN',copyName:'Копировать имя получателя',copied:'Скопировано'}
  }[lang];

  function injectStyles(){
    if(document.getElementById('pass-payment-copy-style'))return;
    const style=document.createElement('style');
    style.id='pass-payment-copy-style';
    style.textContent=`
      .pass-payment-copy-btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        margin-left:8px;
        padding:5px 9px;
        border:1px solid rgba(56,189,248,.34);
        border-radius:9px;
        background:rgba(15,23,42,.88);
        color:#7dd3fc;
        font:700 11px/1.2 Inter,system-ui,sans-serif;
        cursor:pointer;
        vertical-align:middle;
        transition:background .16s ease,border-color .16s ease,color .16s ease,transform .12s ease;
      }
      .pass-payment-copy-btn:hover{
        background:rgba(14,165,233,.16);
        border-color:rgba(56,189,248,.58);
        color:#e0f2fe;
      }
      .pass-payment-copy-btn:active{transform:scale(.97)}
      .pass-payment-copy-btn.is-copied{
        color:#86efac;
        border-color:rgba(34,197,94,.45);
        background:rgba(34,197,94,.10);
      }
      @media(max-width:560px){
        .pass-payment-copy-btn{margin-top:6px;margin-left:6px;white-space:nowrap}
      }
    `;
    document.head.appendChild(style);
  }

  function fallbackCopy(value){
    const area=document.createElement('textarea');
    area.value=value;
    area.setAttribute('readonly','');
    area.style.position='fixed';
    area.style.left='-9999px';
    area.style.top='0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0,area.value.length);
    let ok=false;
    try{ok=document.execCommand('copy');}catch(error){ok=false;}
    area.remove();
    if(!ok)throw new Error('copy_failed');
  }

  async function copyValue(value){
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(value);
      return;
    }
    fallbackCopy(value);
  }

  function createButton(value,label){
    const button=document.createElement('button');
    button.type='button';
    button.className='pass-payment-copy-btn';
    button.textContent='⧉ '+label;
    button.setAttribute('aria-label',label);
    button.addEventListener('click',async()=>{
      const original=button.textContent;
      try{
        await copyValue(value);
        button.textContent='✓ '+TEXT.copied;
        button.classList.add('is-copied');
        clearTimeout(button._copyTimer);
        button._copyTimer=setTimeout(()=>{
          button.textContent=original;
          button.classList.remove('is-copied');
        },1600);
      }catch(error){
        button.textContent=original;
        button.classList.remove('is-copied');
      }
    });
    return button;
  }

  function findRecipientNode(notice){
    const prefix=TEXT.recipient+':';
    return Array.from(notice.childNodes).find(node=>
      node.nodeType===Node.TEXT_NODE&&node.textContent.trim().startsWith(prefix)
    )||null;
  }

  function enhanceNotice(notice){
    if(notice.dataset.paymentCopyEnhanced==='1')return;

    const ibanStrong=Array.from(notice.querySelectorAll('strong')).find(el=>{
      const value=el.textContent.trim();
      return /^[A-Z]{2}[0-9A-Z\s]{12,}$/.test(value)&&/\d/.test(value);
    });
    if(!ibanStrong)return;

    const iban=ibanStrong.textContent.trim();
    ibanStrong.insertAdjacentElement('afterend',createButton(iban,TEXT.copyIban));

    const recipientNode=findRecipientNode(notice);
    if(recipientNode){
      const prefix=TEXT.recipient+':';
      const text=recipientNode.textContent.trim();
      const accountName=text.slice(prefix.length).trim();
      if(accountName){
        recipientNode.after(createButton(accountName,TEXT.copyName));
      }
    }

    notice.dataset.paymentCopyEnhanced='1';
  }

  function enhanceAll(root){
    (root||document).querySelectorAll('.pass-order-card .pass-notice').forEach(enhanceNotice);
  }

  function init(){
    if(document.body.dataset.passPage!=='my-passes')return;
    injectStyles();
    const root=document.getElementById('myOrders');
    if(!root)return;
    enhanceAll(root);
    const observer=new MutationObserver(()=>enhanceAll(root));
    observer.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();