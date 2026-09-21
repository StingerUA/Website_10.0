(function(){
'use strict';
const BASE='/games/albamen-cosmos/';
const HAPPY=BASE+'assets/ui/albamen-happy.webp?v=20260922-1';
const SAD=BASE+'assets/ui/albamen-sad.webp?v=20260922-1';

function ensureStyle(){
  if(document.getElementById('quiz-albamen-mood-style'))return;
  const s=document.createElement('style');
  s.id='quiz-albamen-mood-style';
  s.textContent=`
  .quiz-albamen-mood-wrap{width:92px;min-width:92px;height:92px;border-radius:18px;overflow:hidden;flex:0 0 92px;background:#0b1028;border:1px solid rgba(120,150,255,.28);box-shadow:0 10px 24px rgba(0,0,0,.28)}
  .quiz-albamen-mood-wrap img,.feedback img.quiz-albamen-face{display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center top!important;border-radius:18px!important;transform:none!important;animation:none!important;filter:none!important}
  .feedback.quiz-albamen-correct .quiz-albamen-mood-wrap{border-color:rgba(34,197,94,.6);box-shadow:0 0 20px rgba(34,197,94,.22)}
  .feedback.quiz-albamen-wrong .quiz-albamen-mood-wrap{border-color:rgba(251,113,133,.55);box-shadow:0 0 20px rgba(251,113,133,.18)}
  @media(max-width:520px){.quiz-albamen-mood-wrap{width:78px;min-width:78px;height:78px;flex-basis:78px}}
  `;
  document.head.appendChild(s);
}

function answerState(panel){
  if(!panel)return'';
  const feedback=panel.querySelector('.feedback,[class*="feedback"]');
  const t=String(feedback?.textContent||'').toLocaleLowerCase();
  if(/не совсем|невер|неправ|ничего|следующ|yanlış|hatal|bir dahaki|not quite|wrong|incorrect|next time|try again/.test(t))return'wrong';
  if(/верно|правиль|отлично|doğru|harika|correct|great/.test(t))return'correct';
  if(panel.querySelector('.wrong,.incorrect,[data-correct="false"].selected,[aria-pressed="true"][data-correct="false"]'))return'wrong';
  if(panel.querySelector('.correct,[data-correct="true"].selected,[aria-pressed="true"][data-correct="true"]'))return'correct';
  return'';
}

function stateFromFeedback(feedback){
  const t=String(feedback?.textContent||'').toLocaleLowerCase();
  if(/не совсем|невер|неправ|ничего|следующ|yanlış|hatal|bir dahaki|not quite|wrong|incorrect|next time|try again/.test(t))return'wrong';
  if(/верно|правиль|отлично|doğru|harika|correct|great/.test(t))return'correct';
  return'';
}

function syncFeedback(feedback){
  const state=stateFromFeedback(feedback);
  if(!state)return;
  const src=state==='correct'?HAPPY:SAD;
  if(feedback.dataset.albamenMood===state&&feedback.querySelector('img.quiz-albamen-face'))return;
  feedback.dataset.albamenMood=state;
  feedback.classList.toggle('quiz-albamen-correct',state==='correct');
  feedback.classList.toggle('quiz-albamen-wrong',state==='wrong');

  let wrap=feedback.querySelector('.albamen-avatar-wrap,.quiz-albamen-mood-wrap');
  if(!wrap){wrap=document.createElement('div');feedback.prepend(wrap);}
  wrap.classList.add('albamen-avatar-wrap','quiz-albamen-mood-wrap');
  wrap.replaceChildren();
  const face=document.createElement('img');
  face.className='quiz-albamen-face';face.alt='ALBAMEN';face.src=src;
  wrap.appendChild(face);

  feedback.querySelectorAll('img').forEach(img=>{if(img!==face)img.remove();});
}
function syncOne(panel){
  const feedback=panel?.querySelector('.feedback,[class*="feedback"]');
  if(feedback)syncFeedback(feedback);
}
function sync(){
  document.querySelectorAll('.feedback,[class*="feedback"]').forEach(syncFeedback);
}

function install(){
  ensureStyle();
  [HAPPY,SAD].forEach(src=>{const i=new Image();i.src=src;});
  const root=document.getElementById('root')||document.body;
  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});};
  const observer=new MutationObserver(queue);
  observer.observe(root,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(sync,0),true);
  sync();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();