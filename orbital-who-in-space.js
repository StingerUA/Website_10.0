(() => {
  const locale = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  const i18n = {
    tr:{section:'Uzayda kim var?',title:'Şu anda uzayda kim var?',lead:'Dünya yörüngesinde bulunan insanları, görevlerini ve uzayda geçirdikleri süreyi canlı sayaçlarla takip edin.',people:'Şu anda uzayda',humans:'insan var',updated:'Sayaçlar canlı güncellenir',launched:'Fırlatıldı',missionTime:'Görevde geçen süre',totalTime:'Toplam uzay süresi',profile:'PROFİLİ AÇ ↗',stationCrew:'Görev ekipleri',stationNote:'Astronotlar ve kozmonotlar görevlerine ve bulundukları istasyona göre gruplanmıştır.',ever:'Nisan 2026 itibarıyla toplam',everTail:'insan uzaya çıktı.',source:'Kaynaklar: Who Is In Space ve Launch Library 2. Alba Space sayaçları fırlatma zamanlarından yerel olarak hesaplar.',unknown:'Bilinmiyor',iss:'Uluslararası Uzay İstasyonu',tiangong:'Tiangong Uzay İstasyonu'},
    en:{section:'Who is in space?',title:'Who is in space right now?',lead:'See the humans currently in Earth orbit, their missions, and live counters for how long they have been in space.',people:'There are currently',humans:'humans in space',updated:'Counters update live',launched:'Launched',missionTime:'Mission time in space',totalTime:'Total time in space',profile:'OPEN PROFILE ↗',stationCrew:'Current mission crews',stationNote:'Astronauts and cosmonauts are grouped by their mission and current orbital station.',ever:'As of April 2026, a total of',everTail:'humans have flown to space.',source:'Sources: Who Is In Space and Launch Library 2. Alba Space calculates live counters locally from launch times.',unknown:'Unknown',iss:'International Space Station',tiangong:'Tiangong Space Station'},
    ru:{section:'Кто в космосе?',title:'Кто сейчас находится в космосе?',lead:'Смотрите, какие люди сейчас находятся на орбите Земли, в каких миссиях они участвуют и сколько времени проводят в космосе.',people:'Сейчас в космосе',humans:'человек',updated:'Счётчики обновляются в реальном времени',launched:'Запуск',missionTime:'Время текущей миссии',totalTime:'Общее время в космосе',profile:'ОТКРЫТЬ ПРОФИЛЬ ↗',stationCrew:'Текущие экипажи',stationNote:'Астронавты и космонавты сгруппированы по миссиям и орбитальным станциям.',ever:'По состоянию на апрель 2026 года всего',everTail:'человек побывали в космосе.',source:'Источники: Who Is In Space и Launch Library 2. Alba Space рассчитывает живые счётчики локально по времени запуска.',unknown:'Неизвестно',iss:'Международная космическая станция',tiangong:'Космическая станция «Тяньгун»'},
    ar:{section:'من في الفضاء؟',title:'من يوجد في الفضاء الآن؟',lead:'تعرّف على الأشخاص الموجودين حالياً في مدار الأرض، ومهامهم، والمدة التي قضوها في الفضاء عبر عدادات حية.',people:'يوجد حالياً في الفضاء',humans:'أشخاص',updated:'تتحدث العدادات مباشرة',launched:'تاريخ الإطلاق',missionTime:'مدة المهمة في الفضاء',totalTime:'إجمالي الوقت في الفضاء',profile:'فتح الملف ↗',stationCrew:'أطقم المهام الحالية',stationNote:'يتم تجميع رواد الفضاء حسب المهمة والمحطة المدارية الحالية.',ever:'حتى أبريل 2026، بلغ إجمالي من سافروا إلى الفضاء',everTail:'شخصاً.',source:'المصادر: Who Is In Space و Launch Library 2. تحسب Alba Space العدادات الحية محلياً من أوقات الإطلاق.',unknown:'غير معروف',iss:'محطة الفضاء الدولية',tiangong:'محطة تيانغونغ الفضائية'}
  };
  const t = i18n[locale] || i18n.en;

  const missions = [
    {id:'crew12',station:'ISS',name:'SpaceX Crew-12',launch:'2026-02-13T10:15:56Z',members:[
      {name:'Jessica Meir',agency:'NASA',country:'USA',image:'/assets/images/orbital-crew/jessica-meir.webp',profile:'https://www.nasa.gov/humans-in-space/astronauts/jessica-u-meir/',prior:17680770},
      {name:'Jack Hathaway',agency:'NASA',country:'USA',image:'/assets/images/orbital-crew/jack-hathaway.webp',profile:'https://www.nasa.gov/humans-in-space/astronauts/',prior:0},
      {name:'Sophie Adenot',agency:'ESA',country:'France',image:'/assets/images/orbital-crew/sophie-adenot.webp',profile:'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Astronauts/Sophie_Adenot',prior:0},
      {name:'Andrey Fedyaev',agency:'Roscosmos',country:'Russia',image:'/assets/images/orbital-crew/andrey-fedyaev.webp',profile:'https://www.gctc.ru/main.php?id=1716',prior:16083604}
    ]},
    {id:'soyuz29',station:'ISS',name:'Soyuz MS-29',launch:'2026-07-14T14:47:43Z',members:[
      {name:'Pyotr Dubrov',agency:'Roscosmos',country:'Russia',image:'/assets/images/orbital-crew/pyotr-dubrov.jpg',profile:'https://www.gctc.ru/main.php?id=1704',prior:30696928},
      {name:'Anna Kikina',agency:'Roscosmos',country:'Russia',image:'/assets/images/orbital-crew/anna-kikina.webp',profile:'https://www.gctc.ru/main.php?id=1710',prior:13600891},
      {name:'Anil Menon',agency:'NASA',country:'USA',image:'/assets/images/orbital-crew/anil-menon.webp',profile:'https://www.nasa.gov/people/nasa-astronaut-anil-menon/',prior:0}
    ]},
    {id:'shenzhou23',station:'Tiangong',name:'Shenzhou 23',launch:'2026-05-24T15:08:39Z',members:[
      {name:'Zhu Yangzhu',aliases:['Zhu Yang-zhu'],agency:'CMSA',country:'China',image:'',profile:'https://www.cmse.gov.cn/',prior:13303866},
      {name:'Zhang Zhiyuan',agency:'CMSA',country:'China',image:'',profile:'https://www.cmse.gov.cn/',prior:0},
      {name:'Lai Ka-ying',agency:'CMSA',country:'China',image:'',profile:'https://www.cmse.gov.cn/',prior:0}
    ]}
  ];

  const allMembers = missions.flatMap(m => m.members.map(p => ({...p, mission:m})));
  const norm = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'');
  const memberMap = new Map();
  allMembers.forEach(p => [p.name,...(p.aliases||[])].forEach(name => memberMap.set(norm(name),p)));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const fmtDuration = seconds => {
    seconds = Math.max(0, Math.floor(Number(seconds)||0));
    const d=Math.floor(seconds/86400); seconds%=86400;
    const h=Math.floor(seconds/3600); seconds%=3600;
    const m=Math.floor(seconds/60); const s=seconds%60;
    if(locale==='ar') return `${d}ي ${h}س ${m}د ${s}ث`;
    if(locale==='tr') return `${d}g ${h}s ${m}d ${s}sn`;
    if(locale==='ru') return `${d}д ${h}ч ${m}м ${s}с`;
    return `${d}d ${h}h ${m}m ${s}s`;
  };
  const fmtLaunch = iso => new Intl.DateTimeFormat(t===i18n.tr?'tr-TR':t===i18n.ru?'ru-RU':t===i18n.ar?'ar':'en-GB',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC',timeZoneName:'short'}).format(new Date(iso));
  const missionSeconds = mission => Math.max(0,(Date.now()-Date.parse(mission.launch))/1000);
  const initials = name => name.split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase();

  function render(){
    const count = allMembers.length;
    document.querySelectorAll('[data-wis-section]').forEach(el=>el.textContent=t.section);
    const title=document.querySelector('[data-wis-title]'); if(title) title.textContent=t.title;
    const lead=document.querySelector('[data-wis-lead]'); if(lead) lead.textContent=t.lead;
    const number=document.querySelector('[data-wis-count]'); if(number) number.textContent=count;
    const countLabel=document.querySelector('[data-wis-count-label]'); if(countLabel) countLabel.textContent=`${t.people} ${count} ${t.humans}`;
    const updated=document.querySelector('[data-wis-updated]'); if(updated) updated.textContent=t.updated;
    const missionTitle=document.querySelector('[data-wis-mission-title]'); if(missionTitle) missionTitle.textContent=t.stationCrew;
    const missionNote=document.querySelector('[data-wis-mission-note]'); if(missionNote) missionNote.textContent=t.stationNote;
    const root=document.getElementById('wisMissions'); if(!root) return;
    root.innerHTML=missions.map(mission=>`<article class="wis-mission" id="${esc(mission.id)}"><header class="wis-mission__head"><div><span class="wis-mission__station">${esc(mission.station==='ISS'?t.iss:t.tiangong)}</span><h3>${esc(mission.name)}</h3><p class="wis-mission__launch">${esc(t.launched)}: ${esc(fmtLaunch(mission.launch))}</p></div><div class="wis-mission__clock"><span>${esc(t.missionTime)}</span><strong data-mission-clock="${esc(mission.id)}">${esc(fmtDuration(missionSeconds(mission)))}</strong></div></header><div class="wis-people">${mission.members.map(person=>`<article class="wis-person"><div class="wis-person__portrait">${person.image?`<img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy">`:''}<span class="wis-person__fallback">${esc(initials(person.name))}</span></div><div class="wis-person__body"><div class="wis-person__meta"><span>${esc(person.agency)}</span><span>·</span><span>${esc(person.country)}</span></div><h4>${esc(person.name)}</h4><div class="wis-time"><div><span>${esc(t.missionTime)}</span><strong data-person-mission="${esc(norm(person.name))}">${esc(fmtDuration(missionSeconds(mission)))}</strong></div><div><span>${esc(t.totalTime)}</span><strong data-person-total="${esc(norm(person.name))}">${esc(fmtDuration(person.prior+missionSeconds(mission)))}</strong></div></div><a class="wis-profile" href="${esc(person.profile)}" target="_blank" rel="noreferrer">${esc(t.profile)}</a></div></article>`).join('')}</div></article>`).join('');
    root.querySelectorAll('.wis-person__portrait img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));
    const ever=document.querySelector('[data-wis-ever]'); if(ever) ever.innerHTML=`${esc(t.ever)} <strong>781</strong> ${esc(t.everTail)}`;
    const source=document.querySelector('[data-wis-source]'); if(source) source.textContent=t.source;
  }

  function tick(){
    missions.forEach(mission=>{
      const seconds=missionSeconds(mission);
      document.querySelectorAll(`[data-mission-clock="${mission.id}"]`).forEach(el=>el.textContent=fmtDuration(seconds));
      mission.members.forEach(person=>{
        const key=norm(person.name);
        document.querySelectorAll(`[data-person-mission="${key}"]`).forEach(el=>el.textContent=fmtDuration(seconds));
        document.querySelectorAll(`[data-person-total="${key}"]`).forEach(el=>el.textContent=fmtDuration(person.prior+seconds));
      });
    });
  }

  async function enrich(){
    try{
      const response=await fetch('https://ll.thespacedevs.com/2.3.0/astronauts/?in_space=true&limit=100&format=json',{headers:{Accept:'application/json'}});
      if(!response.ok) return;
      const data=await response.json();
      for(const item of (data.results||[])){
        const person=memberMap.get(norm(item.name)); if(!person) continue;
        const image=item.image?.image_url || item.profile_image || item.profile_image_thumbnail;
        if(image && !person.image){
          person.image=image;
          const card=[...document.querySelectorAll('.wis-person')].find(card=>norm(card.querySelector('h4')?.textContent)===norm(person.name));
          const portrait=card?.querySelector('.wis-person__portrait');
          if(portrait && !portrait.querySelector('img')){
            const img=document.createElement('img'); img.src=image; img.alt=person.name; img.loading='lazy'; img.addEventListener('error',()=>img.remove(),{once:true}); portrait.prepend(img);
          }
        }
        if(item.agency?.abbrev) person.agency=item.agency.abbrev;
        if(item.url) person.profile=item.url;
      }
    }catch(_){/* static Alba Space roster remains available */}
  }

  function renameContext(){document.querySelectorAll('[data-t="crew"],.wis-context-label').forEach(el=>el.textContent=t.section);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{render();renameContext();enrich();setInterval(tick,1000);});
  else {render();renameContext();enrich();setInterval(tick,1000);}
})();
