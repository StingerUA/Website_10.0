(function(){
  const raw=(document.documentElement.lang||'tr').toLowerCase();
  const lang=raw.startsWith('ru')?'ru':raw.startsWith('tr')?'tr':'';
  if(!lang)return;

  const titles={
    tr:[
      ['güneş gözlemi',0],
      ['ay gözlemi',1],
      ['mission: iss',2],
      ['1 gün telescope + vr',3],
      ['2 gün telescope + vr',4]
    ],
    ru:[
      ['наблюдение солнца',0],
      ['наблюдение луны',1],
      ['mission: iss',2],
      ['1 день: телескоп + vr',3],
      ['2 дня: телескоп + vr',4]
    ]
  };

  function artIndex(card){
    const heading=card.querySelector('h2,h3');
    const text=(heading?.textContent||'').trim().toLowerCase();
    if(!text)return -1;
    const match=titles[lang].find(([needle])=>text.includes(needle));
    return match?match[1]:-1;
  }

  function arrangeTicket(body){
    const qr=body.querySelector('.pass-qr');
    if(!qr||body.querySelector('.pass-ticket-qr-block'))return;
    const token=body.querySelector('.pass-token');
    const block=document.createElement('div');
    block.className='pass-ticket-qr-block';
    qr.parentNode.insertBefore(block,qr);
    block.appendChild(qr);
    if(token)block.appendChild(token);
    const heading=body.querySelector('h2,h3');
    if(heading)heading.insertAdjacentElement('afterend',block);
  }

  function decorate(card,root){
    if(card.dataset.passArtDecorated==='1')return;
    const index=artIndex(card);
    if(index<0)return;

    const heading=card.querySelector('h2,h3');
    const body=document.createElement('div');
    body.className='pass-card-body';
    while(card.firstChild)body.appendChild(card.firstChild);

    const art=document.createElement('div');
    art.className=`pass-product-art pass-product-art--${index}`;
    art.setAttribute('role','img');
    art.setAttribute('aria-label',heading?.textContent||'ALBA Space Experience');

    card.classList.add('pass-card--visual');
    if(root.id==='myPasses')card.classList.add('pass-card--ticket');
    if(root.id==='myOrders')card.classList.add('pass-card--order');
    if(root.id==='passOffers')card.classList.add('pass-card--offer');
    card.dataset.passArtDecorated='1';
    card.append(art,body);

    if(root.id==='myPasses')arrangeTicket(body);
  }

  function scan(root){
    root.querySelectorAll('.pass-card').forEach(card=>decorate(card,root));
  }

  function init(){
    ['passOffers','myOrders','myPasses'].forEach(id=>{
      const root=document.getElementById(id);
      if(!root)return;
      scan(root);
      new MutationObserver(()=>scan(root)).observe(root,{childList:true,subtree:true});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
