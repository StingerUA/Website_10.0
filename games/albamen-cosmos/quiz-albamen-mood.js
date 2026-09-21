(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const HAPPY=BASE+'assets/ui/albamen-happy.webp?v=20260921-1';
const SAD=BASE+'assets/ui/albamen-sad.webp?v=20260921-1';

function ensureStyle(){
  if(document.getElementById('quiz-albamen-mood-style'))return;
  const s=document.createElement('style');
  s.id='quiz-albamen-mood-style';
  s.textContent=`
  .quiz-albamen-mood-wrap{width:92px;min-width:92px;height:92px;border-radius:18px;overflow:hidden;flex:0 0 92px;background:#0b1028;border:1px solid rgba(120,150,255,.28);box-shadow:0 10px 24px rgba(0,0,0,.28)}
  .quiz-albamen-mood-wrap img,.feedback .albamen-avatar.quiz-albamen-mood-img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;border-radius:18px!important;transform:none!important;animation:none!important}
  .feedback.quiz-albamen-correct .quiz-albamen-mood-wrap{border-color:rgba(34,197,94,.6);box-shadow:0 0 20px rgba(34,197,94,.22)}
  .feedback.quiz-albamen-wrong .quiz-albamen-mood-wrap{border-color:rgba(251,113,133,.55);box-shadow:0 0 20px rgba(251,113,133,.18)}
  @media(max-width:520px){.quiz-albamen-mood-wrap{width:78px;min-width:78px;height:78px;flex-basis:78px}}
  `;
  document.head.appendChild(s);
}

function answerState(panel){
  if(!panel)return'';
  if(panel.querySelector('.answer.wrong,button.answer.wrong,[class~="answer"][class~="wrong"]'))return'wrong';
  if(panel.querySelector('.answer.correct,button.answer.correct,[class~="answer"][class~="correct"]'))return'correct';
  const feedback=panel.querySelector('.feedback,[class*="feedback"]');
  const t=String(feedback?.textContent||'').toLocaleLowerCase();
  if(/не совсем|невер|неправ|yanlış|hatal|not quite|wrong|incorrect/.test(t))return'wrong';
  if(/верно|правиль|doğru|correct/.test(t))return'correct';
  return'';
}

function syncOne(panel){
  const feedback=panel?.querySelector('.feedback,[class*="feedback"]');
  if(!feedback)return;
  const state=answerState(panel);
  if(!state)return;

  feedback.classList.toggle('quiz-albamen-correct',state==='correct');
  feedback.classList.toggle('quiz-albamen-wrong',state==='wrong');

  const src=state==='correct'?HAPPY:SAD;
  let img=feedback.querySelector('img.albamen-avatar,img.quiz-albamen-mood-img,img[alt*="albamen" i]');
  if(img){
    img.src=src;
    img.classList.add('quiz-albamen-mood-img');
    if(!img.closest('.quiz-albamen-mood-wrap')){
      const wrap=document.createElement('div');
      wrap.className='quiz-albamen-mood-wrap';
      img.parentNode?.insertBefore(wrap,img);
      wrap.appendChild(img);
    }
    return;
  }

  let wrap=feedback.querySelector('.quiz-albamen-mood-wrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.className='quiz-albamen-mood-wrap';
    img=document.createElement('img');
    img.className='quiz-albamen-mood-img';
    img.alt='ALBAMEN';
    wrap.appendChild(img);
    feedback.prepend(wrap);
  }else{
    img=wrap.querySelector('img')||document.createElement('img');
    if(!img.parentNode)wrap.appendChild(img);
  }
  img.src=src;
}

function sync(){
  document.querySelectorAll('section.panel,.panel').forEach(panel=>{
    if(panel.querySelector('.question')&&panel.querySelector('.feedback,[class*="feedback"]'))syncOne(panel);
  });
}

function install(){
  ensureStyle();
  [HAPPY,SAD].forEach(src=>{const i=new Image();i.src=src;});
  sync();
  const root=document.getElementById('root')||document.body;
  const observer=new MutationObserver(()=>queueMicrotask(sync));
  observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(sync,0),true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();