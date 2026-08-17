(function () {
  'use strict';

  var DATA_URL = '/assets/data/blog-posts.json';
  var LOCALE = (document.documentElement.getAttribute('lang') || 'tr').slice(0, 2);
  if (['tr', 'en', 'ru', 'ar'].indexOf(LOCALE) === -1) LOCALE = 'tr';

  var UI = {
    tr: { all: 'Tümü', by: '', min: 'dk okuma', empty: 'Bu kategoride henüz yazı yok.', prev: 'Önceki Yazı', next: 'Sonraki Yazı', related: 'Benzer Yazılar' },
    en: { all: 'All', by: 'by', min: 'min read', empty: 'No posts in this category yet.', prev: 'Previous Post', next: 'Next Post', related: 'Related Posts' },
    ru: { all: 'Все', by: '', min: 'мин чтения', empty: 'В этой теме пока нет статей.', prev: 'Предыдущая статья', next: 'Следующая статья', related: 'Похожие статьи' },
    ar: { all: 'الكل', by: '', min: 'دقائق قراءة', empty: 'لا توجد مقالات في هذه الفئة بعد.', prev: 'المقالة السابقة', next: 'المقالة التالية', related: 'مقالات ذات صلة' }
  }[LOCALE];

  var DATE_LOCALE = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU', ar: 'ar-SA' }[LOCALE];

  function fmtDate(iso) {
    try {
      var opts = { day: '2-digit', month: 'long', year: 'numeric' };
      if (LOCALE === 'ar') opts.calendar = 'gregory';
      return new Date(iso).toLocaleDateString(DATE_LOCALE, opts);
    } catch (e) { return iso; }
  }

  function isPublished(post) {
    return new Date(post.publishAt).getTime() <= Date.now();
  }

  function loadData() {
    return fetch(DATA_URL).then(function (r) { return r.json(); });
  }

  function categoryLabel(data, key) {
    var c = data.categories[key];
    return c ? (c[LOCALE] || c.tr) : key;
  }

  function cardHtml(data, post) {
    var loc = post.locales[LOCALE] || post.locales.tr;
    var authorLine = typeof post.author === 'object' 
      ? (post.author[LOCALE] || post.author.tr) 
      : post.author;
    return (
      '<a class="blog-card reveal" data-direction="up" href="' + loc.url + '">' +
        '<div class="blog-card-cover">' +
          '<img src="' + post.cover + '" alt="' + escapeHtml(loc.title) + '" loading="lazy">' +
          '<span class="blog-card-tag">' + escapeHtml(categoryLabel(data, post.category)) + '</span>' +
        '</div>' +
        '<div class="blog-card-body">' +
          '<h3 class="blog-card-title">' + escapeHtml(loc.title) + '</h3>' +
          '<p class="blog-card-excerpt">' + escapeHtml(loc.excerpt) + '</p>' +
          '<div class="blog-card-meta">' +
            '<span class="blog-author">' + escapeHtml(authorLine) + '</span>' +
            '<span>' + fmtDate(post.publishAt) + '</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getQueryTag() {
    var params = new URLSearchParams(window.location.search);
    return params.get('tag') || 'all';
  }

  function renderTabs(data, activeTag) {
    var wrap = document.getElementById('blog-tabs');
    if (!wrap) return;
    var base = window.location.pathname;
    var html = '<a class="blog-tab' + (activeTag === 'all' ? ' is-active' : '') + '" href="' + base + '">' + UI.all + '</a>';
    Object.keys(data.categories).forEach(function (key) {
      html += '<a class="blog-tab' + (activeTag === key ? ' is-active' : '') + '" href="' + base + '?tag=' + key + '">' +
        escapeHtml(categoryLabel(data, key)) + '</a>';
    });
    wrap.innerHTML = html;
  }

  function renderGrid() {
    var grid = document.getElementById('blog-grid');
    if (!grid) return;
    var activeTag = getQueryTag();

    loadData().then(function (data) {
      renderTabs(data, activeTag);

      var posts = data.posts
        .filter(isPublished)
        .filter(function (p) { return activeTag === 'all' || p.category === activeTag; })
        .sort(function (a, b) { return new Date(b.publishAt) - new Date(a.publishAt); });

      if (!posts.length) {
        grid.innerHTML = '<p class="blog-empty">' + UI.empty + '</p>';
        return;
      }

      grid.innerHTML = posts.map(function (p) { return cardHtml(data, p); }).join('');
      if (window.initBlogReveal) window.initBlogReveal();
    });
  }

  function renderArticleExtras() {
    var el = document.getElementById('blog-article-extras');
    if (!el) return;
    var slug = el.getAttribute('data-slug');

    loadData().then(function (data) {
      var published = data.posts.filter(isPublished).sort(function (a, b) { return new Date(a.publishAt) - new Date(b.publishAt); });
      var idx = published.findIndex(function (p) { return p.slug === slug; });
      var current = data.posts.find(function (p) { return p.slug === slug; });
      var prev = idx > 0 ? published[idx - 1] : null;
      var next = idx >= 0 && idx < published.length - 1 ? published[idx + 1] : null;

      var navHtml = '<div class="blog-pagenav">';
      navHtml += prev
        ? '<a class="blog-pagenav-item is-prev" href="' + (prev.locales[LOCALE] || prev.locales.tr).url + '"><span class="blog-pagenav-label">← ' + UI.prev + '</span><span class="blog-pagenav-title">' + escapeHtml((prev.locales[LOCALE] || prev.locales.tr).title) + '</span></a>'
        : '<span></span>';
      navHtml += next
        ? '<a class="blog-pagenav-item is-next" href="' + (next.locales[LOCALE] || next.locales.tr).url + '"><span class="blog-pagenav-label">' + UI.next + ' →</span><span class="blog-pagenav-title">' + escapeHtml((next.locales[LOCALE] || next.locales.tr).title) + '</span></a>'
        : '<span></span>';
      navHtml += '</div>';

      var related = current
        ? data.posts.filter(isPublished).filter(function (p) { return p.slug !== slug && p.category === current.category; }).slice(0, 3)
        : [];

      var relatedHtml = '';
      if (related.length) {
        relatedHtml = '<div class="blog-related"><h2 class="blog-related-title">' + UI.related + '</h2><div class="blog-grid">' +
          related.map(function (p) { return cardHtml(data, p); }).join('') + '</div></div>';
      }

      el.innerHTML = navHtml + relatedHtml;
      if (window.initBlogReveal) window.initBlogReveal();
    });
  }

  function initBlogReveal() {
    var items = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!items.length) return;
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (item, index) {
      var rect = item.getBoundingClientRect();
      var inViewport = rect.top < window.innerHeight + 120 && rect.bottom > -120;

      if (inViewport) {
        item.classList.add('is-visible');
        return;
      }

      item.style.setProperty('--reveal-delay', (index * 0.03) + 's');
      observer.observe(item);
    });
  }
  window.initBlogReveal = initBlogReveal;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.blog-copy-link');
    if (!btn) return;
    var url = btn.getAttribute('data-url') || window.location.href;
    var done = function () {
      btn.classList.add('is-copied');
      setTimeout(function () { btn.classList.remove('is-copied'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      done();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderGrid();
    renderArticleExtras();
  });
})();
