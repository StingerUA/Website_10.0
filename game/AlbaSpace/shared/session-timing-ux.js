/* AlbaSpace planned lesson clock + final-round decision UX. */
(() => {
  if (window.AlbaSessionTimingUX) return;
  const raw = String(document.documentElement.lang || "ru").toLowerCase();
  const LOCALE = raw.startsWith("tr") ? "tr" : raw.startsWith("en") ? "en" : "ru";
  const brand = String(document.querySelector(".brand")?.textContent || "").toUpperCase();
  const SURFACE = brand.includes("TEACHER") ? "teacher" : brand.includes("CLASSROOM") ? "classroom" : brand.includes("PLAYER") ? "player" : "other";
  if (SURFACE === "other") return;

  const C = {
    ru:{duration:"Плановая длительность занятия",durationHelp:"45–85 минут. После окончания игра не остановится сама: учитель выберет финальный вопрос или +15 минут.",min:"мин",left:"до конца",time:"ВРЕМЯ",five:"До планового конца меньше 5 минут",expired:"Запланированное время занятия завершено",finishRound:"Завершите текущий раунд. В фазе станции появится выбор, как закончить занятие.",choose:"Как продолжить занятие?",chooseSub:"Никто ещё не построил станцию 10/10. Выберите один из двух вариантов.",finalBtn:"⚡ Финальный ускоренный вопрос",finalHelp:"Один последний вопрос с сокращённым временем ответа. После него — последняя фаза станции и итоговый рейтинг.",extendBtn:"➕ Продолжить ещё 15 минут",extendHelp:"Добавить 15 минут и продолжить обычные раунды.",finalQ:"ФИНАЛЬНЫЙ ВОПРОС",finalQSub:"Это последний вопрос занятия",finalResult:"РЕЗУЛЬТАТ ФИНАЛЬНОГО ВОПРОСА",finalResultSub:"Покажите результат и перейдите к последней фазе станции.",finalStation:"ПОСЛЕДНЯЯ ФАЗА СТАНЦИИ",finalStationSub:"Используйте последние награды: можно принять кадета или построить модуль. Затем учитель завершит игру.",finish:"🏁 Завершить игру и показать результаты",waiting:"Время занятия завершено — ждём решение учителя.",audQ:"⚡ Финальный вопрос занятия",audResult:"🏆 Результат финального вопроса",audStation:"🏁 Последняя фаза станции — используйте полученные награды",extended:"Занятие продлено на 15 минут",failed:"Не удалось выполнить действие"},
    tr:{duration:"Planlanan ders süresi",durationHelp:"45–85 dakika. Süre bitince oyun otomatik durmaz: öğretmen final sorusunu veya +15 dakikayı seçer.",min:"dk",left:"kalan",time:"SÜRE",five:"Planlanan bitişe 5 dakikadan az kaldı",expired:"Planlanan ders süresi sona erdi",finishRound:"Mevcut turu tamamlayın. İstasyon aşamasında dersi nasıl bitireceğinizi seçebilirsiniz.",choose:"Derse nasıl devam edelim?",chooseSub:"Henüz hiç kimse 10/10 istasyon kurmadı. İki seçenekten birini seçin.",finalBtn:"⚡ Hızlandırılmış final sorusu",finalHelp:"Kısaltılmış cevap süresiyle son bir soru. Ardından son istasyon aşaması ve final sıralaması gelir.",extendBtn:"➕ 15 dakika daha devam et",extendHelp:"Oyuna 15 dakika ekleyin ve normal turlara devam edin.",finalQ:"FİNAL SORUSU",finalQSub:"Bu dersin son sorusudur",finalResult:"FİNAL SORUSU SONUCU",finalResultSub:"Sonucu gösterin ve son istasyon aşamasına geçin.",finalStation:"SON İSTASYON AŞAMASI",finalStationSub:"Son ödülleri kullanın: öğrenci alın veya modül inşa edin. Ardından öğretmen oyunu bitirir.",finish:"🏁 Oyunu bitir ve sonuçları göster",waiting:"Ders süresi bitti — öğretmenin kararını bekliyoruz.",audQ:"⚡ Dersin final sorusu",audResult:"🏆 Final sorusunun sonucu",audStation:"🏁 Son istasyon aşaması — son ödülleri kullanın",extended:"Ders 15 dakika uzatıldı",failed:"İşlem gerçekleştirilemedi"},
    en:{duration:"Planned lesson duration",durationHelp:"45–85 minutes. When time expires the game does not stop automatically: the teacher chooses a final question or +15 minutes.",min:"min",left:"left",time:"TIME",five:"Less than 5 minutes remain in the planned lesson",expired:"The planned lesson time has ended",finishRound:"Finish the current round. In the station phase you can choose how to end the lesson.",choose:"How should the lesson continue?",chooseSub:"No one has completed a 10/10 station yet. Choose one of the two options.",finalBtn:"⚡ Final accelerated question",finalHelp:"One last question with a shorter answer window, followed by the final station phase and standings.",extendBtn:"➕ Continue for 15 more minutes",extendHelp:"Add 15 minutes and continue with normal rounds.",finalQ:"FINAL QUESTION",finalQSub:"This is the last question of the lesson",finalResult:"FINAL QUESTION RESULT",finalResultSub:"Show the result, then move to the final station phase.",finalStation:"FINAL STATION PHASE",finalStationSub:"Use the last rewards: recruit a cadet or build a module. Then the teacher ends the game.",finish:"🏁 Finish game and show results",waiting:"Lesson time has ended — waiting for the teacher's decision.",audQ:"⚡ Final question of the lesson",audResult:"🏆 Final question result",audStation:"🏁 Final station phase — use your last rewards",extended:"Lesson extended by 15 minutes",failed:"Action could not be completed"}
  }[LOCALE];

  const app = document.getElementById("app");
  let queued = false, busy = false;
  const style = document.createElement("style");
  style.id = "alba-session-timing-style";
  style.textContent = `
    .alba-duration-control{margin:14px 0;padding:13px 14px;border-radius:14px;border:1px solid rgba(112,232,255,.13);background:rgba(112,232,255,.035)}.alba-duration-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.alba-duration-head label{font-weight:850}.alba-duration-value{padding:5px 9px;border-radius:999px;border:1px solid rgba(112,232,255,.15);background:rgba(112,232,255,.09);color:#9cf1ff;font-weight:900}.alba-duration-control input{width:100%;margin:12px 0 7px;accent-color:#72e8ff}.alba-duration-help{font-size:.78rem;line-height:1.45;color:#9eb3c1}
    #plannedSessionKpi.alba-time-warn{border-color:rgba(255,209,102,.34);color:#ffe29b}#plannedSessionKpi.alba-time-expired{border-color:rgba(255,111,111,.38);color:#ffb0a9}
    [data-session-ui]{margin:0 0 14px;border-radius:16px}.alba-time-banner{position:relative;padding:12px 14px 12px 46px;border:1px solid rgba(255,209,102,.22);background:linear-gradient(135deg,rgba(255,209,102,.09),rgba(255,128,80,.035))}.alba-time-banner:before{content:"⏱";position:absolute;left:14px;top:12px;font-size:1.25rem}.alba-time-banner strong,.alba-final-round-banner strong{display:block;color:#ffe09a;font-size:.82rem;letter-spacing:.07em}.alba-time-banner span,.alba-final-round-banner span{display:block;margin-top:4px;color:#c9d7df;font-size:.82rem;line-height:1.42}
    .alba-session-decision{padding:17px;border:1px solid rgba(255,209,102,.25);background:radial-gradient(circle at 15% 0,rgba(255,209,102,.105),transparent 38%),rgba(4,14,25,.82)}.alba-session-decision h2{margin:3px 0 5px}.alba-session-decision>p{margin:0 0 14px;color:#aebfca}.alba-session-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}.alba-session-option{padding:13px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.alba-session-option .btn{width:100%;min-height:46px}.alba-session-option p{margin:8px 2px 0;font-size:.76rem;line-height:1.42;color:#9fb2bf}
    .alba-final-round-banner{padding:13px 15px;border:1px solid rgba(112,232,255,.22);background:linear-gradient(135deg,rgba(112,232,255,.085),rgba(130,103,255,.04))}.alba-final-round-banner strong{color:#9cf3ff}.alba-final-seconds{display:inline-flex!important;width:auto;margin-top:8px!important;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,209,102,.19);color:#ffe29b!important;font-size:.72rem!important;font-weight:900}
    .alba-final-station-panel{padding:16px;border:1px solid rgba(112,232,255,.25);background:radial-gradient(circle at 12% 0,rgba(112,232,255,.095),transparent 38%),rgba(3,14,24,.82)}.alba-final-station-panel h2{margin:2px 0 5px}.alba-final-station-panel p{margin:0 0 12px;color:#aebfca;font-size:.83rem;line-height:1.45}.alba-final-station-panel .btn{width:100%}.alba-student-final-status{padding:12px 14px;border:1px solid rgba(112,232,255,.16);background:rgba(112,232,255,.045);color:#9cf3ff;font-weight:850;text-align:center}
    @media(max-width:720px){.alba-session-options{grid-template-columns:1fr}.alba-duration-head{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  function gs(){ try{return typeof state!=="undefined"?state:null}catch{return null} }
  function rid(){ try{if(typeof roomId!=="undefined"&&roomId)return roomId}catch{} return gs()?.roomId||"" }
  function expired(s,at=Date.now()){return !!(s&&s.status!=="FINISHED"&&s.startedAt&&s.plannedEndAt&&at>=Number(s.plannedEndAt))}
  function applyState(next){try{if(typeof apply==="function")apply(next)}catch{}}
  function notify(text){try{if(typeof toast==="function")return toast(text)}catch{} console.info("[AlbaSpace]",text)}
  function time(ms){const t=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
  function top(node){if(!app)return;app.firstElementChild?app.insertBefore(node,app.firstElementChild):app.appendChild(node)}
  function removePanel(){document.querySelectorAll("[data-session-ui]").forEach(n=>n.remove())}

  async function send(type,payload={}){
    if(busy||!rid())return null;busy=true;document.querySelectorAll("[data-session-command]").forEach(b=>b.disabled=true);
    try{const res=await AlbaGame.command(rid(),type,payload);if(res?.state)applyState(res.state);return res}catch(e){notify(e?.message||C.failed);return null}finally{busy=false;queue()}
  }

  function patchCreate(){
    if(SURFACE!=="teacher"||!window.AlbaGame?.createRoom||AlbaGame.createRoom.__albaTime)return;
    const original=AlbaGame.createRoom.bind(AlbaGame);
    const patched=async(presentationMode,timingMode="STANDARD")=>{
      const minutes=Number(document.getElementById("plannedDuration")?.value||60);
      const created=await original(presentationMode,timingMode);
      if(!created?.state?.roomId)return created;
      return AlbaGame.command(created.state.roomId,"SET_SESSION_DURATION",{minutes});
    };
    patched.__albaTime=true;AlbaGame.createRoom=patched;
  }

  function durationControl(){
    if(SURFACE!=="teacher"||gs()||document.getElementById("albaDurationControl"))return;
    const create=document.getElementById("create"),select=document.getElementById("presentationMode");if(!create||!select)return;
    const el=document.createElement("div");el.id="albaDurationControl";el.className="alba-duration-control";el.innerHTML=`<div class="alba-duration-head"><label for="plannedDuration">⏱ ${C.duration}</label><span id="plannedDurationValue" class="alba-duration-value">60 ${C.min}</span></div><input id="plannedDuration" type="range" min="45" max="85" step="5" value="60"><div class="alba-duration-help">${C.durationHelp}</div>`;
    (create.closest(".grid")||create).before(el);const slider=el.querySelector("#plannedDuration"),out=el.querySelector("#plannedDurationValue");slider.oninput=()=>out.textContent=`${slider.value} ${C.min}`;
  }

  function teacherClock(s){
    if(SURFACE!=="teacher")return;const base=document.getElementById("sessionKpi");
    if(!base||!s?.startedAt||s.phase==="ENDGAME"){document.getElementById("plannedSessionKpi")?.remove();return}
    let el=document.getElementById("plannedSessionKpi");if(!el){el=document.createElement("span");el.id="plannedSessionKpi";el.className="kpi";base.after(el)}
    const ms=Number(s.plannedEndAt||0)-Date.now();el.classList.toggle("alba-time-warn",ms>0&&ms<=300000);el.classList.toggle("alba-time-expired",ms<=0);el.textContent=ms<=0?`⏱ ${C.time}`:`⏳ ${time(ms)} ${C.left}`;el.title=ms>0&&ms<=300000?C.five:C.duration;
  }

  function desired(s){
    if(!s||!s.startedAt||s.phase==="LOBBY"||s.phase==="ENDGAME")return "none";
    if(s.finalRoundActive){if(s.phase==="QUESTION")return "final-q";if(s.phase==="RESULT")return "final-result";if(s.phase==="STATION"&&s.finalStationPending)return "final-station";return "none"}
    if(!expired(s))return "none";
    if(SURFACE==="teacher")return s.phase==="STATION"?"decision":"expired";
    return "waiting";
  }

  function setNext(s,type){
    if(SURFACE!=="teacher")return;const next=document.getElementById("nextQ");if(!next)return;
    const blocked=type==="decision"||type==="final-station"||!!s?.finalRoundActive;next.hidden=type==="final-station";next.disabled=blocked;next.setAttribute("aria-disabled",blocked?"true":"false");
  }

  function build(type,s){
    if(type==="none")return null;const el=document.createElement("div");el.dataset.sessionUi=type;
    if(SURFACE!=="teacher"){
      el.className="alba-student-final-status";const text=type==="waiting"?C.waiting:type==="final-q"?C.audQ:type==="final-result"?C.audResult:C.audStation;el.textContent=text;return el;
    }
    if(type==="expired"){
      el.className="alba-time-banner";el.innerHTML=`<strong>${C.expired}</strong><span>${C.finishRound}</span>`;return el;
    }
    if(type==="decision"){
      el.className="alba-session-decision";el.innerHTML=`<div class="phase">⏱ ${C.expired}</div><h2>${C.choose}</h2><p>${C.chooseSub}</p><div class="alba-session-options"><div class="alba-session-option"><button class="btn primary" data-session-command="final">${C.finalBtn}</button><p>${C.finalHelp}</p></div><div class="alba-session-option"><button class="btn ghost" data-session-command="extend">${C.extendBtn}</button><p>${C.extendHelp}</p></div></div>`;
      el.querySelector('[data-session-command="final"]').onclick=()=>send("START_FINAL_ROUND");el.querySelector('[data-session-command="extend"]').onclick=async()=>{if(await send("EXTEND_SESSION"))notify(C.extended)};return el;
    }
    if(type==="final-station"){
      el.className="alba-final-station-panel";el.innerHTML=`<h2>🏁 ${C.finalStation}</h2><p>${C.finalStationSub}</p><button class="btn primary" data-session-command="finish">${C.finish}</button>`;el.querySelector("button").onclick=()=>send("FINISH_FINAL_ROUND");return el;
    }
    el.className="alba-final-round-banner";const title=type==="final-q"?C.finalQ:C.finalResult,sub=type==="final-q"?C.finalQSub:C.finalResultSub,seconds=type==="final-q"&&Number(s.finalRoundAnswerSeconds||0)?`<span class="alba-final-seconds">≈ ${Number(s.finalRoundAnswerSeconds)} s</span>`:"";el.innerHTML=`<strong>⚡ ${title}</strong><span>${sub}</span>${seconds}`;return el;
  }

  function panel(s,type){
    const current=document.querySelector("[data-session-ui]");
    if(type==="none"){if(current)removePanel();return}
    if(current?.dataset.sessionUi===type)return;
    removePanel();const el=build(type,s);if(el)top(el);
  }

  function sync(){queued=false;patchCreate();durationControl();const s=gs();teacherClock(s);const type=desired(s);setNext(s,type);panel(s,type)}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(sync)}

  if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
  setInterval(()=>{const s=gs();if(s?.startedAt&&s.phase!=="ENDGAME")queue()},500);
  window.addEventListener("focus",queue);document.addEventListener("visibilitychange",()=>{if(!document.hidden)queue()});patchCreate();queue();
  window.AlbaSessionTimingUX={version:"20260910-time1",surface:SURFACE,refresh:queue,isExpired:expired};
})();
