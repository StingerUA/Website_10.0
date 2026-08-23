const AS = (() => {
  const CHANNEL = "albaspace_ru_proto_v01";
  const ROOM_PREFIX = "albaspace_room_";
  const TOPICS = {
    PLANETS:{label:"🟣 Планеты"},
    SATELLITES:{label:"🔵 Спутники"},
    TELESCOPES:{label:"🟢 Телескопы"},
    ROVERS:{label:"🟠 Марсоходы"},
    TURKISH_SATELLITES:{label:"🟡 Турецкие спутники"}
  };
  const MODES = {
    // Это только рекомендуемое время для преподавателя. Оно НЕ блокирует ответы игроков.
    SPRINT:{label:"⚡ Спринт", answer:{EASY:12,NORMAL:17,HARD:22,EXPERT:27}, station:7},
    STANDARD:{label:"⚖️ Стандарт", answer:{EASY:15,NORMAL:24,HARD:30,EXPERT:36}, station:8},
    LEARNING:{label:"🐢 Обучение", answer:{EASY:20,NORMAL:30,HARD:38,EXPERT:45}, station:9}
  };
  const ECON = {start:300, participation:10, winner:30, graduation:350, small:650, large:950};
  const MAX = {small:7, large:3, knowledge:4};

  const clone = v => JSON.parse(JSON.stringify(v));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now();
  const normalize = s => String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g,"е")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[’'`´]/g,"")
    .replace(/[^\p{L}\p{N}]+/gu," ")
    .replace(/\s+/g," ")
    .trim();

  // Damerau-Levenshtein: разрешает обычные опечатки и перестановку соседних букв.
  function damerauDistance(a,b){
    a=normalize(a).replace(/\s/g,"");
    b=normalize(b).replace(/\s/g,"");
    const n=a.length,m=b.length;
    const d=Array.from({length:n+1},()=>Array(m+1).fill(0));
    for(let i=0;i<=n;i++)d[i][0]=i;
    for(let j=0;j<=m;j++)d[0][j]=j;
    for(let i=1;i<=n;i++){
      for(let j=1;j<=m;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
      }
    }
    return d[n][m];
  }

  function textAnswerMatches(given,accepted){
    const g=normalize(given);
    if(!g)return false;
    return (accepted||[]).some(raw=>{
      const a=normalize(raw);
      if(!a)return false;
      if(g===a)return true;
      const gc=g.replace(/\s/g,"");
      const ac=a.replace(/\s/g,"");
      if(gc===ac)return true;
      const len=Math.max(gc.length,ac.length);
      let allowed=0;
      if(len<=5)allowed=1;
      else if(len<=9)allowed=2;
      else if(len<=15)allowed=3;
      else allowed=4;
      return damerauDistance(gc,ac)<=allowed;
    });
  }
  const roomKey = code => ROOM_PREFIX + code;
  const bc = new BroadcastChannel(CHANNEL);

  const loadRoom = code => {
    try { return JSON.parse(localStorage.getItem(roomKey(code)) || "null"); }
    catch { return null; }
  };

  const saveRoom = room => {
    room.updatedAt = Date.now();
    localStorage.setItem(roomKey(room.code), JSON.stringify(room));
    bc.postMessage({type:"ROOM_UPDATED",code:room.code,updatedAt:room.updatedAt});
    return room;
  };

  function createRoom(mode="STANDARD"){
    let code;
    do { code=String(Math.floor(10000+Math.random()*90000)); } while(loadRoom(code));
    const room={
      id:uid(),code,status:"LOBBY",phase:"LOBBY",mode,round:0,
      players:[],usedQuestionIds:[],topicBag:[],currentQuestion:null,
      deadline:null,results:null,winnerId:null,createdAt:Date.now(),updatedAt:Date.now()
    };
    saveRoom(room); return room;
  }

  function joinRoom(code){
    const room=loadRoom(code);
    if(!room) throw new Error("Комната не найдена");
    if(room.status!=="LOBBY" && room.status!=="SETUP") throw new Error("Игра уже началась");
    if(room.players.length>=10) throw new Error("В комнате уже 10 игроков");
    const player={
      id:uid(),company:"",ready:false,credits:ECON.start,
      small:1,large:1,seatCapacity:5,cadets:[],graduates:0,correct:0,wins:0,
      answered:false,lastAnswer:null,moduleBoughtRound:0
    };
    room.players.push(player); saveRoom(room); return player;
  }

  function updatePlayer(code,playerId,fn){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    const p=room.players.find(x=>x.id===playerId); if(!p) throw new Error("Игрок не найден");
    fn(p,room); saveRoom(room); return {room,player:p};
  }

  function setCompany(code,playerId,name){
    name=String(name||"").trim();
    if(name.length<3 || name.length>20) throw new Error("Название: 3–20 символов");
    return updatePlayer(code,playerId,(p,r)=>{
      if(r.players.some(x=>x.id!==p.id && normalize(x.company)===normalize(name))) throw new Error("Это название уже занято");
      p.company=name;
    });
  }

  function setStartCadets(code,playerId,topics){
    if(!Array.isArray(topics)||topics.length!==3||new Set(topics).size!==3) throw new Error("Выбери ровно 3 направления");
    return updatePlayer(code,playerId,p=>{
      p.cadets=topics.map(t=>({id:uid(),topic:t,knowledge:0,status:"ACTIVE"}));
      p.ready=!!p.company;
    });
  }

  function fillTopicBag(room){
    if(room.topicBag?.length) return;
    room.topicBag=Object.keys(TOPICS).sort(()=>Math.random()-.5);
  }

  async function loadQuestions(){
    const res=await fetch("./data/questions.ru.json",{cache:"no-store"});
    if(!res.ok) throw new Error("Не удалось загрузить questions.ru.json");
    return res.json();
  }

  function chooseQuestion(room,questions){
    fillTopicBag(room);
    const topic=room.topicBag.shift();
    let pool=questions.filter(q=>q.topic===topic && !room.usedQuestionIds.includes(q.id));
    if(!pool.length){
      room.usedQuestionIds=room.usedQuestionIds.filter(id=>!questions.some(q=>q.id===id && q.topic===topic));
      pool=questions.filter(q=>q.topic===topic);
    }
    const q=clone(pool[Math.floor(Math.random()*pool.length)]);
    room.usedQuestionIds.push(q.id);
    return q;
  }

  function startGame(code){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    if(room.players.length<2) throw new Error("Нужно минимум 2 игрока");
    if(room.players.some(p=>!p.ready)) throw new Error("Не все игроки готовы");
    room.status="ACTIVE"; room.phase="STATION"; room.round=0;
    room.startedAt=Date.now();
    saveRoom(room); return room;
  }

  async function startQuestion(code,questions){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    if(room.winnerId) throw new Error("Игра уже завершена");
    const q=chooseQuestion(room,questions);
    room.round+=1; room.phase="QUESTION"; room.results=null;
    room.players.forEach(p=>{p.answered=false;p.lastAnswer=null});
    room.currentQuestion=q;
    const sec=MODES[room.mode].answer[q.difficulty]||20;
    room.deadline=Date.now()+sec*1000;
    saveRoom(room); return room;
  }

  function submitAnswer(code,playerId,value){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    if(room.phase!=="QUESTION") throw new Error("Сейчас нельзя отвечать");
    // deadline — только подсказка учителю; после его истечения ответы продолжают приниматься.
    const p=room.players.find(x=>x.id===playerId); if(!p) throw new Error("Игрок не найден");
    if(p.answered) throw new Error("Ответ уже отправлен");
    const q=room.currentQuestion;
    if(q.type==="NUMBER"){
      const n=Number(String(value).replace(",",".").replace(/\s/g,""));
      if(!Number.isFinite(n)) throw new Error("Введите число");
      p.lastAnswer=n;
    }else{
      if(!String(value).trim()) throw new Error("Введите ответ");
      p.lastAnswer=String(value).trim();
    }
    p.answered=true; saveRoom(room); return room;
  }

  function scoreAnswer(q,answer){
    if(answer===null || answer===undefined) return {submitted:false,valid:false,distance:null};
    if(q.type==="NUMBER"){
      const d=Math.abs(Number(answer)-Number(q.correct));
      return {submitted:true,valid:d<=Number(q.tolerance||0),distance:d};
    }
    return {submitted:true,valid:textAnswerMatches(answer,q.answers||[]),distance:null};
  }

  function allocateKnowledge(p,topic,amount){
    const existing=p.cadets.filter(c=>c.status==="ACTIVE"&&c.topic===topic).sort((a,b)=>b.knowledge-a.knowledge);
    const changes=[]; const grads=[]; let left=amount;
    for(const c of existing){
      if(left<=0) break;
      const before=c.knowledge;
      const give=Math.min(left,MAX.knowledge-c.knowledge);
      c.knowledge+=give; left-=give;
      changes.push({cadetId:c.id,topic,before,after:c.knowledge});
      if(c.knowledge>=MAX.knowledge){
        c.status="GRADUATED"; p.graduates+=1; p.credits+=ECON.graduation;
        grads.push({cadetId:c.id,topic,reward:ECON.graduation});
      }
    }
    return {changes,grads};
  }

  function reveal(code){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    if(room.phase!=="QUESTION") throw new Error("Нет активного вопроса");
    const q=room.currentQuestion;
    const scored=room.players.map(p=>({p, ...scoreAnswer(q,p.lastAnswer)}));
    let winners=[];
    if(q.type==="NUMBER"){
      const submitted=scored.filter(x=>x.submitted);
      if(submitted.length){
        const best=Math.min(...submitted.map(x=>x.distance));
        winners=submitted.filter(x=>x.distance===best).map(x=>x.p.id);
      }
    }else{
      winners=scored.filter(x=>x.valid).map(x=>x.p.id);
    }

    const results=[];
    for(const x of scored){
      const p=x.p; let credits=0,knowledge=0,changes=[],grads=[];
      if(x.submitted){p.credits+=ECON.participation;credits+=ECON.participation}
      const isWinner=winners.includes(p.id);
      if(isWinner){p.credits+=ECON.winner;credits+=ECON.winner;p.wins+=1}
      if(x.valid){
        p.correct+=1; knowledge=1+(isWinner?1:0);
        const a=allocateKnowledge(p,q.topic,knowledge);changes=a.changes;grads=a.grads;
      }
      results.push({playerId:p.id,company:p.company,answer:p.lastAnswer,submitted:x.submitted,
        valid:x.valid,distance:x.distance,isWinner,credits,knowledge,changes,grads});
    }
    room.results={questionId:q.id,correct:q.type==="NUMBER"?q.correct:(q.answers?.[0]||""),explanation:q.explanation,items:results};
    room.phase="RESULT"; room.deadline=null; saveRoom(room); return room;
  }

  function startStation(code){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    room.phase="STATION"; room.deadline=Date.now()+MODES[room.mode].station*1000;
    saveRoom(room); return room;
  }

  function freeSeats(p){
    const active=p.cadets.filter(c=>c.status==="ACTIVE").length;
    return p.seatCapacity-active;
  }

  function recruitCadet(code,playerId,topic){
    if(!TOPICS[topic]) throw new Error("Неизвестная специализация");
    return updatePlayer(code,playerId,(p,r)=>{
      if(r.phase!=="STATION") throw new Error("Сейчас нельзя принимать кадетов");
      if(freeSeats(p)<=0) throw new Error("Нет свободных мест");
      p.cadets.push({id:uid(),topic,knowledge:0,status:"ACTIVE"});
    });
  }

  function buyModule(code,playerId,type){
    return updatePlayer(code,playerId,(p,r)=>{
      if(r.phase!=="STATION") throw new Error("Сейчас нельзя строить");
      if(p.moduleBoughtRound===r.round && r.round>0) throw new Error("В этом раунде модуль уже построен");
      if(type==="SMALL"){
        if(p.small>=MAX.small) throw new Error("Малых модулей уже 7/7");
        if(p.credits<ECON.small) throw new Error("Недостаточно кредитов");
        p.credits-=ECON.small;p.small+=1;p.seatCapacity+=2;
      }else if(type==="LARGE"){
        if(p.large>=MAX.large) throw new Error("Больших модулей уже 3/3");
        if(p.credits<ECON.large) throw new Error("Недостаточно кредитов");
        p.credits-=ECON.large;p.large+=1;p.seatCapacity+=3;
      }else throw new Error("Неизвестный тип модуля");
      p.moduleBoughtRound=r.round;
      if(p.small===MAX.small && p.large===MAX.large){
        r.winnerId=p.id;r.status="FINISHED";r.phase="ENDGAME";
      }
    });
  }

  function endGame(code){
    const room=loadRoom(code); if(!room) throw new Error("Комната не найдена");
    room.status="FINISHED";room.phase="ENDGAME";saveRoom(room);return room;
  }

  function rank(room){
    return [...room.players].sort((a,b)=>{
      const am=a.small+a.large,bm=b.small+b.large;
      return bm-am || b.credits-a.credits || b.graduates-a.graduates;
    });
  }

  function resetAll(){
    Object.keys(localStorage).filter(k=>k.startsWith(ROOM_PREFIX)).forEach(k=>localStorage.removeItem(k));
    bc.postMessage({type:"RESET"});
  }

  return {TOPICS,MODES,ECON,MAX,bc,uid,loadRoom,saveRoom,createRoom,joinRoom,updatePlayer,
    setCompany,setStartCadets,loadQuestions,startGame,startQuestion,submitAnswer,reveal,startStation,
    freeSeats,recruitCadet,buyModule,endGame,rank,resetAll};
})();
