(function () {
  'use strict';

  var hasBlogGrid = !!document.getElementById('blog-grid');
  var hasArticle = !!document.querySelector('.blog-article');
  if (!hasBlogGrid && !hasArticle) return;

  var LOCALE = (document.documentElement.getAttribute('lang') || 'tr').slice(0, 2);
  if (['tr', 'en', 'ru', 'ar'].indexOf(LOCALE) === -1) LOCALE = 'tr';

  var UI = {
    tr: {
      authors: 'Yazara göre', allAuthors: 'Tüm yazarlar', author: 'Yazar', posts: 'yazı',
      empty: 'Bu yazarın seçili kategoride henüz yazısı yok.', share: 'Paylaş',
      whatsapp: "WhatsApp'ta paylaş", instagram: "Instagram'da paylaş",
      instagramTip: 'Bağlantı kopyalandı — Instagram hikayene yapıştır',
      status: 'WhatsApp Durumunda paylaş', statusTip: 'Bağlantı kopyalandı — WhatsApp Durumuna yapıştır',
      copy: 'Bağlantıyı kopyala'
    },
    en: {
      authors: 'By author', allAuthors: 'All authors', author: 'Author', posts: 'posts',
      empty: 'This author has no posts in the selected category yet.', share: 'Share',
      whatsapp: 'Share on WhatsApp', instagram: 'Share on Instagram',
      instagramTip: 'Link copied — paste it into your Instagram Story',
      status: 'Share to WhatsApp Status', statusTip: 'Link copied — paste it into your WhatsApp Status',
      copy: 'Copy link'
    },
    ru: {
      authors: 'По автору', allAuthors: 'Все авторы', author: 'Автор', posts: 'статей',
      empty: 'У этого автора пока нет статей в выбранной категории.', share: 'Поделиться',
      whatsapp: 'Поделиться в WhatsApp', instagram: 'Поделиться в Instagram',
      instagramTip: 'Ссылка скопирована — вставьте её в историю Instagram',
      status: 'Поделиться в статусе WhatsApp', statusTip: 'Ссылка скопирована — вставьте её в статус WhatsApp',
      copy: 'Скопировать ссылку'
    },
    ar: {
      authors: 'حسب الكاتب', allAuthors: 'جميع الكتّاب', author: 'الكاتب', posts: 'مقالات',
      empty: 'لا توجد لهذا الكاتب مقالات في الفئة المحددة بعد.', share: 'مشاركة',
      whatsapp: 'مشاركة عبر واتساب', instagram: 'مشاركة عبر إنستغرام',
      instagramTip: 'تم نسخ الرابط — الصقه في قصة إنستغرام',
      status: 'مشاركة في حالة واتساب', statusTip: 'تم نسخ الرابط — الصقه في حالة واتساب',
      copy: 'نسخ الرابط'
    }
  }[LOCALE];

  var CSS_URL = '/assets/css/blog-author-filters.css?v=20260829-1';
  var AUTHORS_URL = '/assets/data/blog-authors.json?v=20260829-1';
  var POSTS_URL = '/assets/data/blog-posts.json';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function localized(value) {
    if (value && typeof value === 'object') return value[LOCALE] || value.tr || '';
    return value || '';
  }

  function slugifyAuthor(name) {
    return String(name || '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ç/g, 'c')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function authorIdForPost(post) {
    var canonical = post && post.author && typeof post.author === 'object'
      ? (post.author.tr || post.author.en || '')
      : ((post && post.author) || '');
    return slugifyAuthor(canonical);
  }

  function isPublished(post) {
    return new Date(post.publishAt).getTime() <= Date.now();
  }

  function ensureStyles() {
    if (document.querySelector('link[data-blog-author-filters]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    link.setAttribute('data-blog-author-filters', 'true');
    document.head.appendChild(link);
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function filterUrl(authorId) {
    var params = getParams();
    if (authorId && authorId !== 'all') params.set('author', authorId);
    else params.delete('author');
    var query = params.toString();
    return window.location.pathname + (query ? '?' + query : '');
  }

  function ensureAuthorHost() {
    var host = document.getElementById('blog-author-sort');
    if (host) return host;
    var tabs = document.getElementById('blog-tabs');
    if (!tabs || !tabs.parentNode) return null;
    host = document.createElement('section');
    host.id = 'blog-author-sort';
    host.className = 'blog-author-sort';
    host.setAttribute('aria-label', UI.authors);
    tabs.parentNode.insertBefore(host, tabs.nextSibling);
    return host;
  }

  function buildAuthors(posts, registry) {
    var map = {};
    (registry.authors || []).forEach(function (author) {
      map[author.id] = {
        id: author.id,
        image: author.image || '/assets/icons/AlbaLogo.png',
        name: localized(author.name),
        role: localized(author.role),
        count: 0
      };
    });

    posts.filter(isPublished).forEach(function (post) {
      var id = authorIdForPost(post);
      if (!map[id]) {
        map[id] = {
          id: id,
          image: '/assets/icons/AlbaLogo.png',
          name: localized(post.author),
          role: localized(post.authorRole),
          count: 0
        };
      }
      map[id].count += 1;
    });

    return Object.keys(map)
      .map(function (id) { return map[id]; })
      .filter(function (author) { return author.count > 0; })
      .sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }

  function renderAuthorControls(authors, activeAuthor) {
    var host = ensureAuthorHost();
    if (!host) return;

    var html = '<div class="blog-author-sort-head"><span class="blog-author-sort-kicker">' +
      escapeHtml(UI.authors) + '</span></div><div class="blog-author-filters">';

    html += '<a class="blog-author-filter is-all' + (activeAuthor === 'all' ? ' is-active' : '') +
      '" href="' + filterUrl('all') + '"><span>' + escapeHtml(UI.allAuthors) + '</span></a>';

    authors.forEach(function (author) {
      html += '<a class="blog-author-filter' + (activeAuthor === author.id ? ' is-active' : '') +
        '" href="' + filterUrl(author.id) + '">' +
        '<img src="' + escapeHtml(author.image) + '" alt="' + escapeHtml(author.name) + '" loading="lazy">' +
        '<span class="blog-author-filter-name">' + escapeHtml(author.name) + '</span>' +
        '<span class="blog-author-filter-count">' + author.count + '</span></a>';
    });

    html += '</div>';

    var selected = authors.find(function (author) { return author.id === activeAuthor; });
    if (selected) {
      html += '<article class="blog-author-profile">' +
        '<img class="blog-author-profile-avatar" src="' + escapeHtml(selected.image) + '" alt="' + escapeHtml(selected.name) + '">' +
        '<div class="blog-author-profile-copy">' +
          '<span class="blog-author-profile-kicker">' + escapeHtml(UI.author) + '</span>' +
          '<h2>' + escapeHtml(selected.name) + '</h2>' +
          '<p>' + escapeHtml(selected.role) + '</p>' +
          '<span class="blog-author-profile-count">' + selected.count + ' ' + escapeHtml(UI.posts) + '</span>' +
        '</div></article>';
    }

    host.innerHTML = html;
  }

  function preserveAuthorInCategoryTabs(activeAuthor) {
    var tabs = document.getElementById('blog-tabs');
    if (!tabs) return;
    Array.prototype.forEach.call(tabs.querySelectorAll('a.blog-tab'), function (link) {
      try {
        var url = new URL(link.getAttribute('href') || window.location.pathname, window.location.origin);
        if (activeAuthor !== 'all') url.searchParams.set('author', activeAuthor);
        else url.searchParams.delete('author');
        link.setAttribute('href', url.pathname + (url.search ? url.search : ''));
      } catch (e) { /* leave original href */ }
    });
  }

  function blogPath(value) {
    try { return new URL(value, window.location.origin).pathname; }
    catch (e) { return value; }
  }

  function enhanceGrid(posts, authors, activeAuthor) {
    var grid = document.getElementById('blog-grid');
    if (!grid) return;

    var authorById = {};
    authors.forEach(function (author) { authorById[author.id] = author; });
    var postByPath = {};
    posts.filter(isPublished).forEach(function (post) {
      var loc = post.locales[LOCALE] || post.locales.tr;
      if (loc && loc.url) postByPath[blogPath(loc.url)] = post;
    });

    var visible = 0;
    var cards = grid.querySelectorAll('a.blog-card');
    Array.prototype.forEach.call(cards, function (card) {
      var post = postByPath[blogPath(card.getAttribute('href') || '')];
      var id = post ? authorIdForPost(post) : '';
      var show = activeAuthor === 'all' || id === activeAuthor;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;

      if (post) {
        var author = authorById[id];
        var authorEl = card.querySelector('.blog-card-meta .blog-author');
        if (author && authorEl && !authorEl.querySelector('img.blog-card-author-avatar')) {
          authorEl.classList.add('has-avatar');
          var img = document.createElement('img');
          img.className = 'blog-card-author-avatar';
          img.src = author.image;
          img.alt = '';
          img.loading = 'lazy';
          authorEl.insertBefore(img, authorEl.firstChild);
        }
      }
    });

    var empty = grid.querySelector('.blog-author-empty');
    if (activeAuthor !== 'all' && cards.length && visible === 0) {
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'blog-empty blog-author-empty';
        empty.textContent = UI.empty;
        grid.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  function initAuthorSorting() {
    var grid = document.getElementById('blog-grid');
    if (!grid) return;

    Promise.all([
      fetch(POSTS_URL).then(function (r) { return r.json(); }),
      fetch(AUTHORS_URL).then(function (r) { return r.json(); })
    ]).then(function (values) {
      var data = values[0];
      var registry = values[1];
      var authors = buildAuthors(data.posts || [], registry || {});
      var requested = getParams().get('author') || 'all';
      var activeAuthor = authors.some(function (author) { return author.id === requested; }) ? requested : 'all';

      renderAuthorControls(authors, activeAuthor);

      var apply = function () {
        preserveAuthorInCategoryTabs(activeAuthor);
        enhanceGrid(data.posts || [], authors, activeAuthor);
      };

      apply();

      var observer = new MutationObserver(function () { apply(); });
      observer.observe(grid, { childList: true, subtree: true });
      var tabs = document.getElementById('blog-tabs');
      if (tabs) observer.observe(tabs, { childList: true, subtree: true });
    }).catch(function (err) {
      console.error('[blog-enhancements] Author sorting failed', err);
    });
  }

  function getShareUrl() {
    var og = document.querySelector('meta[property="og:url"]');
    var value = og && og.getAttribute('content') ? og.getAttribute('content') : window.location.href;
    try {
      var url = new URL(value, window.location.href);
      url.hash = '';
      return url.href;
    } catch (e) {
      return String(value).split('#')[0];
    }
  }

  function ensureUniversalShare() {
    var article = document.querySelector('.blog-article');
    if (!article) return;

    var titleNode = article.querySelector('.blog-article-title');
    var title = titleNode ? titleNode.textContent.trim() : document.title;
    var url = getShareUrl();
    var share = article.querySelector('.blog-share');

    if (!share) {
      share = document.createElement('div');
      share.className = 'blog-share';
      var extras = document.getElementById('blog-article-extras');
      if (extras && extras.parentNode === article) article.insertBefore(share, extras);
      else article.appendChild(share);
    }

    var safeUrl = escapeHtml(url);
    var safeTitle = escapeHtml(title);
    var whatsappText = encodeURIComponent(title + ' - ' + url);

    share.innerHTML =
      '<span>' + escapeHtml(UI.share) + '</span>' +
      '<a class="blog-share-whatsapp" href="https://wa.me/?text=' + whatsappText + '" target="_blank" rel="noopener" aria-label="' + escapeHtml(UI.whatsapp) + '">' +
        '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
      '</a>' +
      '<button type="button" class="blog-share-instagram" data-url="' + safeUrl + '" data-title="' + safeTitle + '" aria-label="' + escapeHtml(UI.instagram) + '">' +
        '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/></svg>' +
        '<span class="blog-share-tooltip">' + escapeHtml(UI.instagramTip) + '</span>' +
      '</button>' +
      '<button type="button" class="blog-share-status" data-url="' + safeUrl + '" data-title="' + safeTitle + '" aria-label="' + escapeHtml(UI.status) + '">' +
        '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '<span class="blog-share-tooltip">' + escapeHtml(UI.statusTip) + '</span>' +
      '</button>' +
      '<button type="button" class="blog-copy-link" data-url="' + safeUrl + '" aria-label="' + escapeHtml(UI.copy) + '">' +
        '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
      '</button>';
  }

  ensureStyles();
  ensureUniversalShare();
  initAuthorSorting();
})();
