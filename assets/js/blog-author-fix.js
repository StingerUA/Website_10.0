(function () {
  'use strict';

  var TARGET_SLUG = 'uzayi-copluge-ceviriyoruz-gelecegin-uzay-yolculuklari-tehlikede-mi';
  var AUTHOR_IMAGE = '/assets/images/blog/authors/team-asli.jpg';
  var locale = (document.documentElement.getAttribute('lang') || 'tr').slice(0, 2).toLowerCase();
  if (['tr', 'en', 'ru', 'ar'].indexOf(locale) === -1) locale = 'tr';

  var AUTHOR = {
    name: {
      tr: 'Aslı Bolat',
      en: 'Aslı Bolat',
      ru: 'Аслы Болат',
      ar: 'أصلي بولات'
    },
    role: {
      tr: 'Astronom ve Eğitmen',
      en: 'Astronomer and Educator',
      ru: 'Астроном и преподаватель',
      ar: 'عالمة فلك ومدرِّبة'
    }
  };

  var DEPRECATED_NAMES = [
    'Alba Space Ekibi',
    'Alba Space Team',
    'Команда Alba Space',
    'فريق ألبا للفضاء',
    'فريق ألبا سبيس'
  ];

  function isBlogPage() {
    return !!document.getElementById('blog-grid') || !!document.querySelector('.blog-article');
  }

  function patchPost(post) {
    if (!post || post.slug !== TARGET_SLUG) return post;
    post.author = {
      tr: AUTHOR.name.tr,
      en: AUTHOR.name.en,
      ru: AUTHOR.name.ru,
      ar: AUTHOR.name.ar
    };
    post.authorRole = {
      tr: AUTHOR.role.tr,
      en: AUTHOR.role.en,
      ru: AUTHOR.role.ru,
      ar: AUTHOR.role.ar
    };
    return post;
  }

  function patchBlogData(data) {
    if (!data || !Array.isArray(data.posts)) return data;
    data.posts.forEach(patchPost);
    return data;
  }

  function isPostsRequest(input) {
    try {
      var value = typeof input === 'string' ? input : (input && input.url) || '';
      return new URL(value, window.location.href).pathname === '/assets/data/blog-posts.json';
    } catch (e) {
      return false;
    }
  }

  function installPostsFetchPatch() {
    if (window.__albaBlogAuthorFetchPatched) return;
    window.__albaBlogAuthorFetchPatched = true;

    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      return nativeFetch(input, init).then(function (response) {
        if (!isPostsRequest(input) || !response.ok) return response;
        return response.clone().json().then(function (data) {
          patchBlogData(data);
          var headers = new Headers(response.headers);
          headers.set('content-type', 'application/json; charset=utf-8');
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        }).catch(function () {
          return response;
        });
      });
    };
  }

  function pathOf(value) {
    try { return new URL(value, window.location.href).pathname; }
    catch (e) { return String(value || ''); }
  }

  function isTargetArticle() {
    var path = window.location.pathname;
    var extras = document.getElementById('blog-article-extras');
    var slug = extras ? extras.getAttribute('data-slug') : '';
    return slug === TARGET_SLUG ||
      path.endsWith('/blog/uzay.html') ||
      path.indexOf('/blog/' + TARGET_SLUG + '.html') !== -1;
  }

  function setAuthorText(el, value) {
    if (!el) return;
    var avatar = el.querySelector('img.blog-card-author-avatar');
    el.textContent = '';
    if (avatar) el.appendChild(avatar);
    if (avatar) el.appendChild(document.createTextNode(' '));
    el.appendChild(document.createTextNode(value));
  }

  function fixTargetArticle() {
    if (!isTargetArticle()) return;
    var name = AUTHOR.name[locale] || AUTHOR.name.tr;
    var role = AUTHOR.role[locale] || AUTHOR.role.tr;
    var meta = document.querySelector('.blog-article-meta');
    if (!meta) return;

    var avatar = meta.querySelector('.blog-author-avatar');
    if (avatar) {
      avatar.src = AUTHOR_IMAGE;
      avatar.alt = name;
      avatar.onerror = function () { this.onerror = null; this.src = '/assets/icons/alien.png'; };
    }

    var author = meta.querySelector('.blog-author');
    if (author) author.textContent = name;

    var roleNode = meta.querySelector('.blog-author-details > span:not(.blog-author):not(.dot)');
    if (roleNode) roleNode.textContent = role;
  }

  function fixTargetCards() {
    var name = AUTHOR.name[locale] || AUTHOR.name.tr;
    document.querySelectorAll('#blog-grid a.blog-card, .blog-related a.blog-card').forEach(function (card) {
      var path = pathOf(card.getAttribute('href'));
      if (path.endsWith('/blog/uzay.html') || path.indexOf('/blog/' + TARGET_SLUG + '.html') !== -1) {
        setAuthorText(card.querySelector('.blog-card-meta .blog-author'), name);
      }
    });
  }

  function removeDeprecatedAuthorUi() {
    document.querySelectorAll('.blog-author-filter').forEach(function (item) {
      var href = item.getAttribute('href') || '';
      var text = (item.textContent || '').trim();
      if (href.indexOf('author=alba-space-ekibi') !== -1 || DEPRECATED_NAMES.some(function (name) { return text.indexOf(name) !== -1; })) {
        item.remove();
      }
    });

    document.querySelectorAll('.blog-author-profile').forEach(function (profile) {
      var text = (profile.textContent || '').trim();
      if (DEPRECATED_NAMES.some(function (name) { return text.indexOf(name) !== -1; })) profile.remove();
    });
  }

  function applyDomFixes() {
    fixTargetArticle();
    fixTargetCards();
    removeDeprecatedAuthorUi();
  }

  function loadEnhancements() {
    if (document.querySelector('script[data-blog-enhancements-loader], script[src*="/assets/js/blog-enhancements.js"]')) return;
    var script = document.createElement('script');
    script.src = '/assets/js/blog-enhancements.js?v=20260903-author-fix';
    script.defer = true;
    script.async = false;
    script.setAttribute('data-blog-enhancements-loader', 'true');
    (document.head || document.documentElement).appendChild(script);
  }

  if (isBlogPage()) {
    installPostsFetchPatch();
    applyDomFixes();

    var queued = false;
    var observer = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        applyDomFixes();
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  loadEnhancements();
})();
