(function () {
  'use strict';

  var DATA_URL = '/assets/data/events.json';
  var LOCALE = (document.documentElement.getAttribute('lang') || 'tr').slice(0, 2);
  if (['tr', 'en', 'ru', 'ar'].indexOf(LOCALE) === -1) LOCALE = 'tr';

  var UI = {
    tr: {empty:'Henüz bir etkinlik eklenmemiş.',emptyUpcoming:'Şu anda yaklaşan bir etkinlik bulunmuyor.',emptyPast:'Henüz geçmiş bir etkinlik bulunmuyor.',upcoming:'Yaklaşan Etkinlikler',past:'Geçmiş Etkinlikler',organizers:'Organizasyon',tags:'Etiketler',buyPass:'Etkinlik için QR Pass satın al'},
    en: {empty:'No events have been added yet.',emptyUpcoming:'There are no upcoming events right now.',emptyPast:'There are no past events yet.',upcoming:'Upcoming Events',past:'Past Events',organizers:'Organizers',tags:'Tags',buyPass:'Get a QR Pass for this event'},
    ru: {empty:'Мероприятий пока нет.',emptyUpcoming:'Сейчас нет предстоящих мероприятий.',emptyPast:'Прошедших мероприятий пока нет.',upcoming:'Предстоящие мероприятия',past:'Прошедшие мероприятия',organizers:'Организаторы',tags:'Теги',buyPass:'Приобрести QR-пропуск на мероприятие'},
    ar: {empty:'لم تتم إضافة أي فعالية بعد.',emptyUpcoming:'لا توجد فعاليات قادمة حاليًا.',emptyPast:'لا توجد فعاليات سابقة حتى الآن.',upcoming:'الفعاليات القادمة',past:'الفعاليات السابقة',organizers:'المنظمون',tags:'الوسوم',buyPass:'احصل على تصريح QR للفعالية'}
  }[LOCALE];

  var RU_EVENTS = {
    'perseid-meteor-yagmuru-2026': {
      title:'Лагерь наблюдения метеорного потока Персеиды',
      excerpt:'Готовимся увидеть одно из самых впечатляющих природных явлений ночного неба.',
      hero:'В ночь с 13 на 14 августа встречаемся в Pozantı Belemedik на наблюдении метеорного потока Персеиды.',
      body:[
        'В 2026 году максимум активности Персеид ожидается примерно 13 августа. Ночь с 13 на 14 августа будет особенно подходящей для наблюдений: метеорная активность сохранится, а лунный свет будет минимальным. В тёмном месте при хороших условиях можно увидеть десятки метеоров в час.',
        'В течение этой особенной ночи мы соберёмся у костра, будем наблюдать Луну и небо в телескопы, вместе следить за метеорным потоком и узнавать больше об этом явлении во время познавательных презентаций.'
      ],
      highlights:['Костёр','Наблюдение Луны и неба в телескоп','Наблюдение метеорного потока Персеиды','Познавательные презентации']
    },
    'alba-hyper-kids-summer-camp-2026': {
      title:'Летний лагерь ALBA Hyper Kids',
      excerpt:'Летняя программа, где дети знакомятся с космосом, технологиями и наукой.',
      hero:'С 15 по 30 августа 2026 года в Адане пройдёт летний лагерь ALBA Hyper Kids, знакомящий детей с космосом, технологиями и наукой.',
      body:[
        'Во время лагеря дети развивают интерес к науке, космосу и технологиям через увлекательные практические занятия. Программа включает интерактивное обучение и творческие мастерские.',
        'Лагерь помогает юным участникам развивать любознательность, придумывать идеи на космическую тему и работать в команде.'
      ],
      highlights:['Космическое образование','Технологические мастерские','Научные занятия','Опыт летнего лагеря']
    },
    'tua-astro-hackathon-finali-2026': {
      title:'Финал TUA Astro Hackathon',
      excerpt:'Финал хакатона по космическим технологиям и созданию решений состоится в Анкаре.',
      hero:'С 7 по 13 сентября 2026 года в Анкаре пройдёт финал TUA Astro Hackathon, посвящённый космическим решениям будущего.',
      body:[
        'Финальный этап даёт участникам возможность представить разработанные идеи и получить экспертную оценку их инновационности и практической реализации.',
        'Мероприятие объединяет космос, данные, искусственный интеллект и инновационный дизайн и поддерживает новое поколение разработчиков.'
      ],
      highlights:['Финальные презентации','Космические технологии','Инновационные идеи','Командная работа']
    },
    'aydin-tedx-2026': {
      title:'TEDx Aydın',
      excerpt:'Мероприятие TEDx в Айдыне объединит идеи, вдохновение и новые взгляды.',
      hero:'26 сентября 2026 года в Айдыне состоится TEDx Aydın — встреча, посвящённая вдохновляющим выступлениям и обмену идеями.',
      body:[
        'TEDx создаёт пространство, где люди могут свободно делиться идеями и формировать новые взгляды. Особое внимание уделяется творческому мышлению и общественной пользе.',
        'На этой встрече спикеры поделятся вдохновляющим опытом и историями о том, как создавать реальные изменения.'
      ],
      highlights:['Выступления TEDx','Вдохновляющие идеи','Общественная польза','Творческое мышление']
    },
    'iac-antalya-2026': {
      title:'Международный астронавтический конгресс (IAC)',
      excerpt:'Одно из важнейших международных событий космической отрасли состоится в Анталье.',
      hero:'В октябре 2026 года в Анталье пройдёт Международный астронавтический конгресс (IAC), посвящённый глобальному сотрудничеству в космической сфере.',
      body:[
        'IAC — глобальное событие, объединяющее космическую науку, технологии, исследования и проектирование. Конгресс создаёт ценные возможности для сотрудничества специалистов и организаций.',
        'AlbaSpace стремится внести свой вклад в развитие новых идей и партнёрств в области космоса и науки.'
      ],
      highlights:['Международная космическая встреча','Наука и технологии','Глобальное сотрудничество','Взгляд в будущее']
    },
    'dunya-uzay-haftasi-2026': {
      title:'Всемирная неделя космоса',
      excerpt:'Специальная серия мероприятий и образовательных программ, посвящённых космосу.',
      hero:'С 4 по 10 октября 2026 года пройдёт Всемирная неделя космоса — серия событий, направленных на развитие интереса к космосу и науке.',
      body:[
        'В течение недели объединятся космическая наука, наблюдения неба и образовательные программы. Цель — усилить интерес к космосу у детей, молодёжи и семей.',
        'Познавательные и увлекательные активности помогают формировать более широкое общественное понимание космических исследований.'
      ],
      highlights:['Популяризация космоса','Образовательные программы','Наблюдение неба','Общественные мероприятия']
    },
    'yesilay-aile-festivali-2026': {
      title:'Семейный фестиваль Yeşilay',
      excerpt:'Семейный фестиваль объединит развлечения, общение и просветительские активности.',
      hero:'18 октября 2026 года в Адане состоится семейный фестиваль Yeşilay, рассчитанный на совместный и содержательный отдых всей семьи.',
      body:[
        'Фестиваль наполнен развлечениями, общением и мероприятиями, посвящёнными осознанности и здоровому образу жизни. Семейное участие находится в центре программы.',
        'В этот день гостей ждут образовательные, творческие и социальные активности, создающие позитивный совместный опыт.'
      ],
      highlights:['Семейное участие','Фестивальная атмосфера','Просветительские активности','Развлечения']
    },
    'nasa-space-apps-challenge-2026': {
      title:'NASA Space Apps Challenge',
      excerpt:'Творческий хакатон, где участники создают решения с использованием космических данных.',
      hero:'14–15 ноября 2026 года в Адане состоится NASA Space Apps Challenge, где участники будут использовать космические данные для решения реальных задач.',
      body:[
        'Мероприятие предоставляет участникам платформу для превращения идей в реальные проекты. Здесь соединяются космические данные, технологии и инновационное мышление.',
        'Хакатон поддерживает молодых талантов и помогает развивать навыки командной работы, дизайна и технической реализации.'
      ],
      highlights:['Хакатон','Космические данные','Творческие решения','Развитие технических навыков']
    }
  };

  var activeFilter = 'upcoming';

  function fmtDateRange(startAt, endAt) {
    try {
      var start = new Date(startAt);var end = new Date(endAt);
      var dateFmt = new Intl.DateTimeFormat(LOCALE === 'tr' ? 'tr-TR' : LOCALE === 'en' ? 'en-US' : LOCALE === 'ru' ? 'ru-RU' : 'ar-SA', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
      return dateFmt.formatRange(start, end);
    } catch (e) { return ''; }
  }

  function escapeHtml(str) {return String(str || '').replace(/[&<>'\"]/g, function (c) {return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c];});}
  function categoryLabel(data, key) {var c = data.categories[key];return c ? (c[LOCALE] || c.tr) : key;}
  function passHref() {if (LOCALE === 'en') return '/eng/experience-pass.html';if (LOCALE === 'ru') return '/rus/experience-pass.html';return '/experience-pass.html';}

  function localizedEvent(event) {
    var loc = event.locales[LOCALE] || event.locales.tr;
    if (LOCALE !== 'ru') return loc;

    var translated = RU_EVENTS[event.slug];
    if (!translated && event.locales.ru) translated = event.locales.ru;
    if (!translated) translated = loc;

    return {
      title: translated.title || loc.title,
      excerpt: translated.excerpt || loc.excerpt,
      hero: translated.hero || loc.hero,
      body: translated.body || loc.body || [],
      highlights: translated.highlights || loc.highlights || [],
      url: '/rus/etkinlikler/event.html?slug=' + encodeURIComponent(event.slug)
    };
  }

  function ensurePassCtaStyles() {
    if (document.getElementById('events-pass-cta-style')) return;
    var style = document.createElement('style');style.id = 'events-pass-cta-style';
    style.textContent = '.events-pass-cta-wrap{margin:4px 0 30px;display:flex;justify-content:center}.events-pass-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:48px;padding:12px 20px;border-radius:14px;background:#0ea5e9;color:#001018;text-decoration:none;font-weight:800;box-shadow:0 12px 34px rgba(14,165,233,.22);transition:transform .18s ease,box-shadow .18s ease}.events-pass-cta:hover{transform:translateY(-2px);box-shadow:0 16px 42px rgba(14,165,233,.34)}.events-pass-cta:focus-visible{outline:2px solid #e0f2fe;outline-offset:3px}@media(max-width:560px){.events-pass-cta{width:100%;box-sizing:border-box;text-align:center}}';
    document.head.appendChild(style);
  }

  function renderGrid(filter) {
    var grid = document.getElementById('events-grid');if (!grid) return;
    fetch(DATA_URL).then(function (res) { return res.json(); }).then(function (data) {
      var now = new Date();
      var events = data.events.filter(function (event) {var hasEnded = new Date(event.endAt) < now;return filter === 'past' ? hasEnded : !hasEnded;}).sort(function (a, b) {if (filter === 'past') return new Date(b.endAt) - new Date(a.endAt);return new Date(a.startAt) - new Date(b.startAt);});
      if (!events.length) {grid.innerHTML = '<p class="events-empty">' + (filter === 'past' ? UI.emptyPast : UI.emptyUpcoming) + '</p>';return;}
      grid.innerHTML = events.map(function (event) {
        var loc = localizedEvent(event);var coverClass = event.coverFit === 'contain' ? ' events-card-cover--contain' : '';
        return '<a class="events-card" href="' + loc.url + '"><div class="events-card-cover' + coverClass + '"><img src="' + event.cover + '" alt="' + escapeHtml(loc.title) + '" loading="lazy"></div><div class="events-card-body"><span class="events-card-tag">' + escapeHtml(categoryLabel(data, event.category)) + '</span><h3 class="events-card-title">' + escapeHtml(loc.title) + '</h3><p class="events-card-excerpt">' + escapeHtml(loc.excerpt) + '</p><div class="events-card-meta">' + escapeHtml(fmtDateRange(event.startAt, event.endAt)) + '</div></div></a>';
      }).join('');
    }).catch(function () {grid.innerHTML = '<p class="events-empty">' + UI.empty + '</p>';});
  }

  function setActiveFilter(filter) {
    activeFilter = filter === 'past' ? 'past' : 'upcoming';
    document.querySelectorAll('[data-events-filter]').forEach(function (tab) {var isActive = tab.getAttribute('data-events-filter') === activeFilter;tab.classList.toggle('is-active', isActive);tab.setAttribute('aria-selected', isActive ? 'true' : 'false');});
    var grid = document.getElementById('events-grid');if (grid) grid.setAttribute('aria-labelledby', activeFilter === 'past' ? 'events-tab-past' : 'events-tab-upcoming');
    renderGrid(activeFilter);
  }

  function initTabs() {
    var tabs = document.querySelectorAll('[data-events-filter]');if (!tabs.length) return;
    tabs.forEach(function (tab) {var filter = tab.getAttribute('data-events-filter');tab.textContent = filter === 'past' ? UI.past : UI.upcoming;tab.addEventListener('click', function () {setActiveFilter(filter);});});
  }

  function renderArticle() {
    var el = document.getElementById('event-article');if (!el) return;
    fetch(DATA_URL).then(function (res) { return res.json(); }).then(function (data) {
      var slug = el.getAttribute('data-slug') || new URLSearchParams(window.location.search).get('slug');
      var event = data.events.find(function (item) { return item.slug === slug; });
      if (!event) {el.innerHTML = '<p class="events-empty">' + UI.empty + '</p>';return;}
      var loc = localizedEvent(event);
      var highlights = (loc.highlights || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      var body = (loc.body || []).map(function (paragraph) { return '<p>' + escapeHtml(paragraph) + '</p>'; }).join('');
      var organizerHtml = (event.organizers || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      var hashHtml = (event.hashtags || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      var location = event.location;
      if (LOCALE === 'ru') location = String(location).replace(/TÜRKİYE/g, 'Турция');
      el.innerHTML = '<span class="events-article-tag">' + escapeHtml(categoryLabel(data, event.category)) + '</span>' +
        '<h1 class="events-article-title">' + escapeHtml(loc.title) + '</h1>' +
        '<div class="events-article-meta"><span>' + escapeHtml(fmtDateRange(event.startAt, event.endAt)) + '</span><span>•</span><span>' + escapeHtml(location) + '</span><span>•</span><span>' + escapeHtml(event.contact) + '</span></div>' +
        '<img class="events-article-cover' + (event.coverFit === 'contain' ? ' events-article-cover--contain' : '') + '" src="' + event.cover + '" alt="' + escapeHtml(loc.title) + '">' +
        '<div class="events-pass-cta-wrap"><a class="events-pass-cta" href="' + passHref() + '">🎟️ ' + escapeHtml(UI.buyPass) + '</a></div>' +
        '<div class="events-article-body"><p><strong>' + escapeHtml(loc.hero) + '</strong></p>' + body +
        '<div class="events-highlights"><h3>' + escapeHtml(UI.upcoming) + '</h3><ul>' + highlights + '</ul></div>' +
        '<div class="events-highlights"><h3>' + escapeHtml(UI.organizers) + '</h3><ul>' + organizerHtml + '</ul></div>' +
        '<div class="events-highlights"><h3>' + escapeHtml(UI.tags) + '</h3><ul>' + hashHtml + '</ul></div></div>';
    }).catch(function () {el.innerHTML = '<p class="events-empty">' + UI.empty + '</p>';});
  }

  document.addEventListener('DOMContentLoaded', function () {ensurePassCtaStyles();initTabs();renderGrid(activeFilter);renderArticle();});
})();
