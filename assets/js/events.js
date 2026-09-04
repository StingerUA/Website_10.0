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

  var activeFilter = 'upcoming';

  function fmtDateRange(startAt, endAt) {
    try {
      var start = new Date(startAt);var end = new Date(endAt);
      var dateFmt = new Intl.DateTimeFormat(LOCALE === 'tr' ? 'tr-TR' : LOCALE === 'en' ? 'en-US' : LOCALE === 'ru' ? 'ru-RU' : 'ar-SA', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
      return dateFmt.formatRange(start, end);
    } catch (e) { return ''; }
  }

  function escapeHtml(str) {return String(str || '').replace(/[&<>'"]/g, function (c) {return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];});}
  function categoryLabel(data, key) {var c = data.categories[key];return c ? (c[LOCALE] || c.tr) : key;}
  function passHref() {if (LOCALE === 'en') return '/eng/experience-pass.html';if (LOCALE === 'ru') return '/rus/experience-pass.html';return '/experience-pass.html';}

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
        var loc = event.locales[LOCALE] || event.locales.tr;var coverClass = event.coverFit === 'contain' ? ' events-card-cover--contain' : '';
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
      var slug = el.getAttribute('data-slug');var event = data.events.find(function (item) { return item.slug === slug; });
      if (!event) {el.innerHTML = '<p class="events-empty">' + UI.empty + '</p>';return;}
      var loc = event.locales[LOCALE] || event.locales.tr;
      var highlights = (loc.highlights || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      var body = (loc.body || []).map(function (paragraph) { return '<p>' + escapeHtml(paragraph) + '</p>'; }).join('');
      var organizerHtml = (event.organizers || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      var hashHtml = (event.hashtags || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      el.innerHTML = '<span class="events-article-tag">' + escapeHtml(categoryLabel(data, event.category)) + '</span>' +
        '<h1 class="events-article-title">' + escapeHtml(loc.title) + '</h1>' +
        '<div class="events-article-meta"><span>' + escapeHtml(fmtDateRange(event.startAt, event.endAt)) + '</span><span>•</span><span>' + escapeHtml(event.location) + '</span><span>•</span><span>' + escapeHtml(event.contact) + '</span></div>' +
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
