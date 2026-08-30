(() => {
  "use strict";

  const API = (window.ORBITAL_LIBRARY_API || "https://ll.thespacedevs.com/2.3.0").replace(/\/+$/, "");
  const pageType = document.body?.dataset?.orbitalPage || "";
  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const lang = ["ru", "tr", "en"].includes(locale) ? locale : "ru";
  const prefix = lang === "tr" ? "/tr" : lang === "en" ? "/eng" : "";
  const dateLocale = { ru: "ru-RU", tr: "tr-TR", en: "en-GB" }[lang];

  const T = {
    ru: {
      loading: "Загрузка данных…", error: "Не удалось загрузить данные.", retry: "Повторить",
      source: "Данные: Launch Library 2 / The Space Devs", allCompanies: "Все компании и агентства",
      searchLaunches: "Поиск по миссии, ракете, космодрому…", searchRockets: "Поиск ракеты или производителя…",
      upcoming: "Предстоящие", previous: "Прошедшие", all: "Весь архив",
      soonest: "Сначала ближайшие", newest: "Сначала новые", oldest: "Сначала старые", nameAZ: "По названию",
      results: "запусков", page: "Страница", previousPage: "← Назад", nextPage: "Вперёд →",
      provider: "Оператор", rocket: "Ракета", site: "Стартовая площадка", location: "Космодром",
      status: "Статус", mission: "Миссия", orbit: "Орбита", launchWindow: "Окно запуска",
      probability: "Вероятность запуска", weather: "Погодные ограничения", webcast: "Официальная трансляция",
      openLaunch: "Открыть запуск", openRocket: "Открыть ракету", openMap: "Показать на карте",
      mapTitle: "Космодромы и ракеты на карте", mapLead: "Активные стартовые площадки отмечены голубым. Предстоящие ракеты — зелёными маркерами.",
      pads: "Стартовые площадки", upcomingRockets: "Предстоящие ракеты", active: "Активна", inactive: "Неактивна",
      launchCount: "Всего запусков", orbitalCount: "Орбитальных запусков", nextLaunch: "Ближайший запуск",
      rocketsTitle: "Библиотека ракет", rocketsLead: "Семейства и конфигурации ракет-носителей с производителями и статистикой запусков.",
      activeOnly: "Только активные", allRockets: "Все ракеты", manufacturer: "Производитель",
      maidenFlight: "Первый полёт", successfulLaunches: "Успешных запусков", failedLaunches: "Неудачных запусков",
      pendingLaunches: "Запланировано", reusable: "Многоразовая", stages: "Ступеней", height: "Высота", diameter: "Диаметр",
      mass: "Стартовая масса", payloadLEO: "Полезная нагрузка на НОО", description: "Описание",
      relatedLaunches: "Связанные запуски", noDescription: "Описание пока отсутствует.",
      noResults: "По заданным фильтрам ничего не найдено.", rateLimited: "Источник данных временно ограничил частоту запросов. Подождите несколько минут.",
      mapUnavailable: "Карта временно недоступна.", backLaunches: "← К библиотеке запусков", backRockets: "← К библиотеке ракет",
      unknown: "Не указано", today: "Сегодня", tomorrow: "Завтра", launchDetails: "Детали запуска",
      rocketDetails: "Профиль ракеты", copied: "Ссылка скопирована", country: "Страна",
      allCountries: "Все страны", filterMap: "Поиск космодрома или площадки…", launchesHere: "Запуски с этой площадки",
      upcomingAtSite: "Предстоящие запуски", currentVehicle: "Ракета для ближайшей миссии"
    },
    tr: {
      loading: "Veriler yükleniyor…", error: "Veriler yüklenemedi.", retry: "Tekrar dene",
      source: "Veri: Launch Library 2 / The Space Devs", allCompanies: "Tüm şirketler ve ajanslar",
      searchLaunches: "Görev, roket veya fırlatma sahası ara…", searchRockets: "Roket veya üretici ara…",
      upcoming: "Yaklaşan", previous: "Geçmiş", all: "Tüm arşiv",
      soonest: "En yakından başla", newest: "En yeniden başla", oldest: "En eskiden başla", nameAZ: "Ada göre",
      results: "fırlatma", page: "Sayfa", previousPage: "← Geri", nextPage: "İleri →",
      provider: "Operatör", rocket: "Roket", site: "Fırlatma rampası", location: "Uzay üssü",
      status: "Durum", mission: "Görev", orbit: "Yörünge", launchWindow: "Fırlatma penceresi",
      probability: "Fırlatma olasılığı", weather: "Hava durumu kısıtları", webcast: "Resmî yayın",
      openLaunch: "Fırlatmayı aç", openRocket: "Roketi aç", openMap: "Haritada göster",
      mapTitle: "Uzay üsleri ve roketler haritası", mapLead: "Aktif rampalar mavi, yaklaşan görevlerin roketleri yeşil işaretlenir.",
      pads: "Fırlatma rampaları", upcomingRockets: "Yaklaşan roketler", active: "Aktif", inactive: "Pasif",
      launchCount: "Toplam fırlatma", orbitalCount: "Yörüngesel fırlatma", nextLaunch: "Sıradaki fırlatma",
      rocketsTitle: "Roket kütüphanesi", rocketsLead: "Roket aileleri ve konfigürasyonları; üretici ve fırlatma istatistikleriyle.",
      activeOnly: "Yalnızca aktif", allRockets: "Tüm roketler", manufacturer: "Üretici",
      maidenFlight: "İlk uçuş", successfulLaunches: "Başarılı fırlatma", failedLaunches: "Başarısız fırlatma",
      pendingLaunches: "Planlanan", reusable: "Yeniden kullanılabilir", stages: "Kademe", height: "Yükseklik", diameter: "Çap",
      mass: "Fırlatma kütlesi", payloadLEO: "LEO yük kapasitesi", description: "Açıklama",
      relatedLaunches: "İlgili fırlatmalar", noDescription: "Henüz açıklama yok.",
      noResults: "Bu filtrelerle sonuç bulunamadı.", rateLimited: "Veri kaynağı istek hızını geçici olarak sınırladı. Birkaç dakika sonra tekrar deneyin.",
      mapUnavailable: "Harita geçici olarak kullanılamıyor.", backLaunches: "← Fırlatma kütüphanesine dön", backRockets: "← Roket kütüphanesine dön",
      unknown: "Belirtilmedi", today: "Bugün", tomorrow: "Yarın", launchDetails: "Fırlatma ayrıntıları",
      rocketDetails: "Roket profili", copied: "Bağlantı kopyalandı", country: "Ülke",
      allCountries: "Tüm ülkeler", filterMap: "Uzay üssü veya rampa ara…", launchesHere: "Bu rampadaki fırlatmalar",
      upcomingAtSite: "Yaklaşan fırlatmalar", currentVehicle: "Sıradaki görevin roketi"
    },
    en: {
      loading: "Loading data…", error: "Could not load data.", retry: "Try again",
      source: "Data: Launch Library 2 / The Space Devs", allCompanies: "All companies and agencies",
      searchLaunches: "Search mission, rocket or launch site…", searchRockets: "Search rocket or manufacturer…",
      upcoming: "Upcoming", previous: "Previous", all: "Full archive",
      soonest: "Soonest first", newest: "Newest first", oldest: "Oldest first", nameAZ: "Name A–Z",
      results: "launches", page: "Page", previousPage: "← Previous", nextPage: "Next →",
      provider: "Provider", rocket: "Rocket", site: "Launch pad", location: "Spaceport",
      status: "Status", mission: "Mission", orbit: "Orbit", launchWindow: "Launch window",
      probability: "Launch probability", weather: "Weather concerns", webcast: "Official webcast",
      openLaunch: "Open launch", openRocket: "Open rocket", openMap: "Show on map",
      mapTitle: "Spaceports and rockets map", mapLead: "Active launch pads are blue. Rockets for upcoming missions use green markers.",
      pads: "Launch pads", upcomingRockets: "Upcoming rockets", active: "Active", inactive: "Inactive",
      launchCount: "Total launches", orbitalCount: "Orbital launches", nextLaunch: "Next launch",
      rocketsTitle: "Rocket library", rocketsLead: "Launch-vehicle families and configurations with manufacturers and flight statistics.",
      activeOnly: "Active only", allRockets: "All rockets", manufacturer: "Manufacturer",
      maidenFlight: "Maiden flight", successfulLaunches: "Successful launches", failedLaunches: "Failed launches",
      pendingLaunches: "Pending", reusable: "Reusable", stages: "Stages", height: "Height", diameter: "Diameter",
      mass: "Launch mass", payloadLEO: "LEO payload", description: "Description",
      relatedLaunches: "Related launches", noDescription: "No description is available yet.",
      noResults: "No results match these filters.", rateLimited: "The data source is temporarily rate-limiting requests. Please try again in a few minutes.",
      mapUnavailable: "The map is temporarily unavailable.", backLaunches: "← Back to launch library", backRockets: "← Back to rocket library",
      unknown: "Not specified", today: "Today", tomorrow: "Tomorrow", launchDetails: "Launch details",
      rocketDetails: "Rocket profile", copied: "Link copied", country: "Country",
      allCountries: "All countries", filterMap: "Search spaceport or pad…", launchesHere: "Launches from this pad",
      upcomingAtSite: "Upcoming launches", currentVehicle: "Rocket for next mission"
    }
  }[lang];

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

  function apiUrl(path, params = {}) {
    const u = new URL(`${API}/${String(path).replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") u.searchParams.set(key, String(value));
    }
    return u.toString();
  }

  function cacheKey(url) {
    let hash = 2166136261;
    for (let i = 0; i < url.length; i++) {
      hash ^= url.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `oa-ll2-${(hash >>> 0).toString(16)}`;
  }

  async function cachedJson(url, ttlMs = 10 * 60 * 1000) {
    const key = cacheKey(url);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.time && Date.now() - saved.time < ttlMs) return saved.data;
      }
    } catch {}
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (response.status === 429) {
      const error = new Error(T.rateLimited);
      error.rateLimited = true;
      throw error;
    }
    if (!response.ok) throw new Error(`${T.error} HTTP ${response.status}`);
    const data = await response.json();
    try { localStorage.setItem(key, JSON.stringify({ time: Date.now(), data })); } catch {}
    return data;
  }

  async function fetchPaged(path, params = {}, maxPages = 3, ttlMs = 60 * 60 * 1000) {
    let url = apiUrl(path, params);
    const results = [];
    let pages = 0;
    while (url && pages < maxPages) {
      const payload = await cachedJson(url, ttlMs);
      results.push(...(Array.isArray(payload?.results) ? payload.results : []));
      url = payload?.next || "";
      pages++;
    }
    return results;
  }

  function formatDate(value, withTime = true) {
    if (!value) return T.unknown;
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return T.unknown;
    return new Intl.DateTimeFormat(dateLocale, {
      year: "numeric", month: "short", day: "2-digit",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(d);
  }

  function formatDateRange(start, end) {
    if (!start && !end) return T.unknown;
    if (start && end && start !== end) return `${formatDate(start)} — ${formatDate(end)}`;
    return formatDate(start || end);
  }

  function formatMetric(value, suffix = "") {
    const num = asNumber(value);
    if (num === null) return T.unknown;
    return `${new Intl.NumberFormat(dateLocale, { maximumFractionDigits: 1 }).format(num)}${suffix}`;
  }

  function imageFrom(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.image_url || value.thumbnail_url || value.url || "";
  }

  function launchImage(launch) {
    return imageFrom(launch?.image)
      || imageFrom(launch?.rocket?.configuration?.image)
      || imageFrom(launch?.mission?.image)
      || "";
  }

  function configManufacturer(config) {
    const direct = config?.manufacturer;
    if (Array.isArray(direct)) return direct[0] || null;
    if (direct && typeof direct === "object") return direct;
    const families = Array.isArray(config?.families) ? config.families : [];
    for (const family of families) {
      const makers = Array.isArray(family?.manufacturer) ? family.manufacturer : (family?.manufacturer ? [family.manufacturer] : []);
      if (makers[0]) return makers[0];
    }
    return null;
  }

  function rocketImage(config) {
    const maker = configManufacturer(config);
    return imageFrom(config?.image) || imageFrom(maker?.logo) || "";
  }

  function agencyName(launch) {
    return launch?.launch_service_provider?.name || launch?.lsp?.name || T.unknown;
  }

  function rocketName(launch) {
    return launch?.rocket?.configuration?.full_name || launch?.rocket?.configuration?.name || T.unknown;
  }

  function padName(launch) {
    return launch?.pad?.name || T.unknown;
  }

  function locationName(launch) {
    return launch?.pad?.location?.name || T.unknown;
  }

  function statusClass(status) {
    const s = String(status?.abbrev || status?.name || "").toLowerCase();
    if (/success|go/.test(s)) return "is-good";
    if (/fail|hold|tbd|tbc/.test(s)) return "is-warn";
    return "";
  }

  function localizedPath(page) {
    return `${prefix}/${page}`.replace(/^\/\//, "/");
  }

  function launchHref(id) {
    return `${localizedPath("orbital-launch.html")}?id=${encodeURIComponent(id)}`;
  }

  function rocketHref(id) {
    return `${localizedPath("orbital-rocket.html")}?id=${encodeURIComponent(id)}`;
  }

  function mapHref(pad, location) {
    const u = new URL(localizedPath("orbital-locations.html"), locationOrigin());
    if (pad) u.searchParams.set("pad", pad);
    if (location) u.searchParams.set("location", location);
    return u.pathname + u.search;
  }

  function locationOrigin() {
    return window.location.origin === "null" ? "https://albaspace.com.tr" : window.location.origin;
  }

  function setBusy(container, message = T.loading) {
    if (container) container.innerHTML = `<div class="oc-state"><span class="oc-spinner" aria-hidden="true"></span><p>${esc(message)}</p></div>`;
  }

  function setError(container, error, retryFn) {
    const message = error?.rateLimited ? T.rateLimited : (error?.message || T.error);
    container.innerHTML = `<div class="oc-state oc-state--error"><p>${esc(message)}</p>${retryFn ? `<button class="oc-btn oc-btn--primary" type="button" data-retry>${esc(T.retry)}</button>` : ""}</div>`;
    if (retryFn) qs("[data-retry]", container)?.addEventListener("click", retryFn);
  }

  function sourceNote() {
    return `<p class="oc-source">${esc(T.source)}</p>`;
  }

  function launchCard(launch) {
    const image = launchImage(launch);
    const configId = launch?.rocket?.configuration?.id;
    const badge = launch?.status?.name || launch?.status?.abbrev || T.unknown;
    return `<article class="oc-card oc-launch-card">
      <a class="oc-card__media" href="${launchHref(launch.id)}" aria-label="${esc(launch.name)}">
        ${image ? `<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="oc-card__placeholder">🚀</div>`}
        <span class="oc-badge ${statusClass(launch.status)}">${esc(badge)}</span>
      </a>
      <div class="oc-card__body">
        <p class="oc-kicker">${esc(formatDate(launch.net))}</p>
        <h3><a href="${launchHref(launch.id)}">${esc(launch.name || T.unknown)}</a></h3>
        <dl class="oc-mini-facts">
          <div><dt>${esc(T.rocket)}</dt><dd>${configId ? `<a href="${rocketHref(configId)}">${esc(rocketName(launch))}</a>` : esc(rocketName(launch))}</dd></div>
          <div><dt>${esc(T.provider)}</dt><dd>${esc(agencyName(launch))}</dd></div>
          <div><dt>${esc(T.location)}</dt><dd>${esc(locationName(launch))}</dd></div>
        </dl>
        <div class="oc-card__actions">
          <a class="oc-btn oc-btn--primary" href="${launchHref(launch.id)}">${esc(T.openLaunch)}</a>
          ${launch?.pad?.id ? `<a class="oc-btn" href="${mapHref(launch.pad.id, launch.pad.location?.id)}">${esc(T.openMap)}</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  function rocketCard(config) {
    const image = rocketImage(config);
    const manufacturer = configManufacturer(config)?.name || T.unknown;
    return `<article class="oc-card oc-rocket-card">
      <a class="oc-card__media oc-card__media--rocket" href="${rocketHref(config.id)}">
        ${image ? `<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="oc-card__placeholder">🚀</div>`}
        ${config?.active ? `<span class="oc-badge is-good">${esc(T.active)}</span>` : ""}
      </a>
      <div class="oc-card__body">
        <p class="oc-kicker">${esc(manufacturer)}</p>
        <h3><a href="${rocketHref(config.id)}">${esc(config.full_name || config.name || T.unknown)}</a></h3>
        <div class="oc-stat-row">
          <span><strong>${esc(config.total_launch_count ?? "—")}</strong>${esc(T.launchCount)}</span>
          <span><strong>${esc(config.successful_launches ?? "—")}</strong>${esc(T.successfulLaunches)}</span>
          <span><strong>${esc(config.pending_launches ?? "—")}</strong>${esc(T.pendingLaunches)}</span>
        </div>
        <a class="oc-btn oc-btn--primary" href="${rocketHref(config.id)}">${esc(T.openRocket)}</a>
      </div>
    </article>`;
  }

  async function loadAgencyOptions(select) {
    if (!select) return;
    try {
      const agencies = await fetchPaged("agencies/", {
        limit: 100, ordering: "-total_launch_count", total_launch_count__gt: 0, mode: "list"
      }, 1, 12 * 60 * 60 * 1000);
      const options = agencies
        .filter(a => a?.id && a?.name)
        .sort((a,b) => String(a.name).localeCompare(String(b.name), dateLocale));
      select.innerHTML = `<option value="">${esc(T.allCompanies)}</option>` +
        options.map(a => `<option value="${esc(a.id)}">${esc(a.name)}${a.abbrev ? ` (${esc(a.abbrev)})` : ""}</option>`).join("");
    } catch {
      select.innerHTML = `<option value="">${esc(T.allCompanies)}</option>`;
    }
  }

  function initLaunchLibrary() {
    const grid = qs("#ocLaunchLibrary");
    if (!grid) return;
    const form = qs("#ocLaunchFilters");
    const search = qs("#ocLaunchSearch");
    const company = qs("#ocCompanyFilter");
    const period = qs("#ocPeriodFilter");
    const ordering = qs("#ocLaunchOrdering");
    const meta = qs("#ocLaunchMeta");
    const prev = qs("#ocPrevPage");
    const next = qs("#ocNextPage");
    let offset = 0;
    const limit = 24;
    let currentPayload = null;

    loadAgencyOptions(company);

    async function load(reset = false) {
      if (reset) offset = 0;
      setBusy(grid);
      const selectedPeriod = period?.value || "upcoming";
      const path = selectedPeriod === "upcoming" ? "launches/upcoming/" : selectedPeriod === "previous" ? "launches/previous/" : "launches/";
      let order = ordering?.value || (selectedPeriod === "upcoming" ? "net" : "-net");
      if (selectedPeriod === "upcoming" && order === "-net") order = "net";
      const params = {
        limit, offset, mode: "normal", ordering: order,
        search: search?.value?.trim() || "",
        lsp__id: company?.value || ""
      };
      try {
        currentPayload = await cachedJson(apiUrl(path, params), 5 * 60 * 1000);
        const rows = Array.isArray(currentPayload?.results) ? currentPayload.results : [];
        grid.innerHTML = rows.length ? rows.map(launchCard).join("") : `<div class="oc-state"><p>${esc(T.noResults)}</p></div>`;
        const total = Number(currentPayload?.count || 0);
        const page = Math.floor(offset / limit) + 1;
        const pages = Math.max(1, Math.ceil(total / limit));
        if (meta) meta.innerHTML = `<strong>${new Intl.NumberFormat(dateLocale).format(total)}</strong> ${esc(T.results)} · ${esc(T.page)} ${page}/${pages}`;
        if (prev) prev.disabled = !currentPayload?.previous;
        if (next) next.disabled = !currentPayload?.next;
      } catch (error) {
        setError(grid, error, () => load(false));
        if (meta) meta.textContent = "";
      }
    }

    form?.addEventListener("submit", e => { e.preventDefault(); load(true); });
    company?.addEventListener("change", () => load(true));
    period?.addEventListener("change", () => {
      if (ordering) ordering.value = period.value === "upcoming" ? "net" : "-net";
      load(true);
    });
    ordering?.addEventListener("change", () => load(true));
    let searchTimer;
    search?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => load(true), 450);
    });
    prev?.addEventListener("click", () => {
      if (currentPayload?.previous) { offset = Math.max(0, offset - limit); load(false); scrollToGrid(grid); }
    });
    next?.addEventListener("click", () => {
      if (currentPayload?.next) { offset += limit; load(false); scrollToGrid(grid); }
    });

    load(true);
  }

  function scrollToGrid(grid) {
    const top = grid.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function infoItem(label, value, html = false) {
    if (value === undefined || value === null || value === "") return "";
    return `<div class="oc-info-item"><span>${esc(label)}</span><strong>${html ? value : esc(value)}</strong></div>`;
  }

  function chooseVideo(launch) {
    const candidates = [
      ...(Array.isArray(launch?.vidURLs) ? launch.vidURLs : []),
      ...(Array.isArray(launch?.vid_urls) ? launch.vid_urls : []),
      ...(Array.isArray(launch?.webcast_live) ? launch.webcast_live : [])
    ];
    for (const item of candidates) {
      const url = typeof item === "string" ? item : item?.url;
      if (/^https:\/\//i.test(url || "")) return url;
    }
    return "";
  }

  async function initLaunchDetail() {
    const root = qs("#ocLaunchDetail");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      root.innerHTML = `<div class="oc-state oc-state--error"><p>${esc(T.error)}</p><a class="oc-btn" href="${localizedPath("orbital-launches.html")}">${esc(T.backLaunches)}</a></div>`;
      return;
    }
    setBusy(root);
    try {
      const launch = await cachedJson(apiUrl(`launches/${encodeURIComponent(id)}/`, { mode: "detailed" }), 5 * 60 * 1000);
      document.title = `${launch.name || T.launchDetails} — Orbital Atlas`;
      const image = launchImage(launch);
      const config = launch?.rocket?.configuration;
      const pad = launch?.pad;
      const mission = launch?.mission;
      const video = chooseVideo(launch);
      const probability = launch?.probability != null ? `${launch.probability}%` : "";
      const windowText = formatDateRange(launch?.window_start, launch?.window_end);
      const desc = mission?.description || launch?.mission_description || "";
      root.innerHTML = `
        <a class="oc-back" href="${localizedPath("orbital-launches.html")}">${esc(T.backLaunches)}</a>
        <section class="oc-detail-hero">
          <div class="oc-detail-media">${image ? `<img src="${esc(image)}" alt="" referrerpolicy="no-referrer">` : `<div class="oc-detail-placeholder">🚀</div>`}</div>
          <div class="oc-detail-copy">
            <div class="oc-detail-badges"><span class="oc-badge ${statusClass(launch.status)}">${esc(launch?.status?.name || T.unknown)}</span><span class="oc-badge">${esc(formatDate(launch.net))}</span></div>
            <p class="oc-kicker">${esc(agencyName(launch))}</p>
            <h1>${esc(launch.name || T.unknown)}</h1>
            <p class="oc-detail-lead">${esc(desc || T.noDescription)}</p>
            <div class="oc-card__actions">
              ${video ? `<a class="oc-btn oc-btn--primary" href="${esc(video)}" target="_blank" rel="noopener">${esc(T.webcast)} ↗</a>` : ""}
              ${config?.id ? `<a class="oc-btn" href="${rocketHref(config.id)}">${esc(T.openRocket)}</a>` : ""}
              ${pad?.id ? `<a class="oc-btn" href="${mapHref(pad.id, pad.location?.id)}">${esc(T.openMap)}</a>` : ""}
            </div>
          </div>
        </section>
        <section class="oc-detail-grid">
          <article class="oc-panel">
            <h2>${esc(T.launchDetails)}</h2>
            <div class="oc-info-grid">
              ${infoItem(T.status, launch?.status?.name)}
              ${infoItem(T.launchWindow, windowText)}
              ${infoItem(T.provider, agencyName(launch))}
              ${infoItem(T.rocket, config?.id ? `<a href="${rocketHref(config.id)}">${esc(config.full_name || config.name || T.unknown)}</a>` : esc(rocketName(launch)), true)}
              ${infoItem(T.site, pad?.name)}
              ${infoItem(T.location, pad?.location?.name)}
              ${infoItem(T.probability, probability)}
              ${infoItem(T.weather, launch?.weather_concerns)}
            </div>
          </article>
          <article class="oc-panel">
            <h2>${esc(T.mission)}</h2>
            <div class="oc-info-grid">
              ${infoItem(T.mission, mission?.name)}
              ${infoItem(T.orbit, mission?.orbit?.name)}
              ${infoItem(T.description, mission?.description)}
            </div>
          </article>
        </section>
        ${pad && asNumber(pad.latitude) !== null && asNumber(pad.longitude) !== null ? `
          <section class="oc-panel oc-detail-map-panel">
            <div class="oc-panel-head"><div><p class="oc-kicker">${esc(T.location)}</p><h2>${esc(pad.location?.name || pad.name)}</h2></div><a class="oc-btn" href="${mapHref(pad.id, pad.location?.id)}">${esc(T.openMap)}</a></div>
            <div id="ocDetailMap" class="oc-map oc-map--detail" data-lat="${esc(pad.latitude)}" data-lon="${esc(pad.longitude)}" data-name="${esc(pad.name)}"></div>
          </section>` : ""}
        ${sourceNote()}
      `;
      const detailMap = qs("#ocDetailMap");
      if (detailMap) ensureLeaflet().then(() => {
        const lat = Number(detailMap.dataset.lat), lon = Number(detailMap.dataset.lon);
        const map = createMap(detailMap, [lat, lon], 6);
        L.marker([lat, lon], { icon: padIcon() }).addTo(map).bindPopup(`<strong>${esc(detailMap.dataset.name)}</strong>`).openPopup();
      }).catch(() => {});
    } catch (error) {
      setError(root, error, () => initLaunchDetail());
    }
  }

  function ensureLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    return new Promise((resolve, reject) => {
      if (!qs('link[data-oa-leaflet]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.dataset.oaLeaflet = "1";
        document.head.appendChild(link);
      }
      const existing = qs('script[data-oa-leaflet]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.L), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.dataset.oaLeaflet = "1";
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function createMap(container, center = [25, 10], zoom = 2) {
    const map = L.map(container, { worldCopyJump: true, minZoom: 2 }).setView(center, zoom);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Tiles © Esri"
    }).addTo(map);
    L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "Labels © Esri"
    }).addTo(map);
    return map;
  }

  function padIcon() {
    return L.divIcon({ className: "oc-map-icon-wrap", html: '<span class="oc-map-icon oc-map-icon--pad">●</span>', iconSize: [28,28], iconAnchor: [14,14] });
  }

  function rocketIcon() {
    return L.divIcon({ className: "oc-map-icon-wrap", html: '<span class="oc-map-icon oc-map-icon--rocket">🚀</span>', iconSize: [34,34], iconAnchor: [17,17] });
  }

  async function initLocations() {
    const mapNode = qs("#ocWorldMap");
    const listNode = qs("#ocLocationList");
    if (!mapNode || !listNode) return;
    setBusy(listNode);
    try {
      await ensureLeaflet();
      const [pads, upcoming] = await Promise.all([
        fetchPaged("pads/", { active: true, limit: 100, ordering: "location__name" }, 3, 6 * 60 * 60 * 1000),
        cachedJson(apiUrl("launches/upcoming/", { limit: 50, ordering: "net", mode: "normal" }), 10 * 60 * 1000).then(x => x.results || [])
      ]);
      const validPads = pads.filter(p => asNumber(p?.latitude) !== null && asNumber(p?.longitude) !== null);
      const map = createMap(mapNode);
      const padMarkers = new Map();
      const rocketMarkers = [];
      validPads.forEach(pad => {
        const lat = Number(pad.latitude), lon = Number(pad.longitude);
        const marker = L.marker([lat, lon], { icon: padIcon(), title: pad.name || "" }).addTo(map);
        marker.bindPopup(padPopup(pad));
        padMarkers.set(String(pad.id), marker);
      });
      upcoming.forEach(launch => {
        const pad = launch?.pad;
        if (!pad || asNumber(pad.latitude) === null || asNumber(pad.longitude) === null) return;
        const lat = Number(pad.latitude), lon = Number(pad.longitude);
        const marker = L.marker([lat, lon], { icon: rocketIcon(), title: launch.name || "" }).addTo(map);
        marker.bindPopup(launchPopup(launch));
        rocketMarkers.push(marker);
      });

      const focusPad = new URLSearchParams(location.search).get("pad");
      const focusLocation = new URLSearchParams(location.search).get("location");
      if (focusPad && padMarkers.has(String(focusPad))) {
        const marker = padMarkers.get(String(focusPad));
        map.setView(marker.getLatLng(), 7);
        marker.openPopup();
      } else if (focusLocation) {
        const pad = validPads.find(p => String(p?.location?.id) === String(focusLocation));
        const marker = pad && padMarkers.get(String(pad.id));
        if (marker) { map.setView(marker.getLatLng(), 6); marker.openPopup(); }
      } else if (validPads.length) {
        const bounds = L.latLngBounds(validPads.map(p => [Number(p.latitude), Number(p.longitude)]));
        map.fitBounds(bounds.pad(0.08), { maxZoom: 3 });
      }

      renderLocationList(validPads, upcoming, listNode, map, padMarkers);
      initLocationFilters(validPads, upcoming, listNode, map, padMarkers);
      const statsText = `${validPads.length} ${T.pads} · ${rocketMarkers.length} ${T.upcomingRockets}`;
      const count = qs("#ocMapStats");
      const sideCount = qs("#ocMapStatsSide");
      if (count) count.textContent = statsText;
      if (sideCount) sideCount.textContent = statsText;
    } catch (error) {
      setError(listNode, error, () => initLocations());
      mapNode.innerHTML = `<div class="oc-state"><p>${esc(T.mapUnavailable)}</p></div>`;
    }
  }

  function padPopup(pad) {
    const loc = pad?.location?.name || T.unknown;
    return `<div class="oc-popup"><strong>${esc(pad.name || T.unknown)}</strong><span>${esc(loc)}</span><span>${esc(T.launchCount)}: ${esc(pad.total_launch_count ?? "—")}</span>${pad.map_url ? `<a href="${esc(pad.map_url)}" target="_blank" rel="noopener">Google Maps ↗</a>` : ""}</div>`;
  }

  function launchPopup(launch) {
    return `<div class="oc-popup"><strong>${esc(launch.name || T.unknown)}</strong><span>${esc(formatDate(launch.net))}</span><span>${esc(rocketName(launch))}</span><a href="${launchHref(launch.id)}">${esc(T.openLaunch)} →</a></div>`;
  }

  function renderLocationList(pads, upcoming, node, map, markers, query = "", country = "") {
    const normalized = query.trim().toLowerCase();
    const filtered = pads.filter(p => {
      const text = `${p.name || ""} ${p.location?.name || ""} ${p.country?.name || p.location?.country?.name || ""}`.toLowerCase();
      const c = p.country?.name || p.location?.country?.name || "";
      return (!normalized || text.includes(normalized)) && (!country || c === country);
    });
    node.innerHTML = filtered.length ? filtered.slice(0, 100).map(p => {
      const launch = upcoming.find(l => String(l?.pad?.id) === String(p.id));
      const countryName = p.country?.name || p.location?.country?.name || "";
      return `<button type="button" class="oc-location-row" data-pad="${esc(p.id)}">
        <span class="oc-location-dot"></span>
        <span><strong>${esc(p.name || T.unknown)}</strong><small>${esc(p.location?.name || countryName || T.unknown)}</small>${launch ? `<em>🚀 ${esc(launch.name)}</em>` : ""}</span>
        <b>${esc(p.total_launch_count ?? "—")}</b>
      </button>`;
    }).join("") : `<div class="oc-state"><p>${esc(T.noResults)}</p></div>`;
    qsa("[data-pad]", node).forEach(btn => btn.addEventListener("click", () => {
      const marker = markers.get(String(btn.dataset.pad));
      if (!marker) return;
      map.setView(marker.getLatLng(), 7, { animate: true });
      marker.openPopup();
      qs("#ocWorldMap")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
  }

  function initLocationFilters(pads, upcoming, node, map, markers) {
    const search = qs("#ocLocationSearch");
    const country = qs("#ocCountryFilter");
    if (country) {
      const countries = [...new Set(pads.map(p => p.country?.name || p.location?.country?.name || "").filter(Boolean))].sort((a,b) => a.localeCompare(b, dateLocale));
      country.innerHTML = `<option value="">${esc(T.allCountries)}</option>` + countries.map(c => `<option>${esc(c)}</option>`).join("");
    }
    const rerender = () => renderLocationList(pads, upcoming, node, map, markers, search?.value || "", country?.value || "");
    search?.addEventListener("input", rerender);
    country?.addEventListener("change", rerender);
  }

  async function initRockets() {
    const grid = qs("#ocRocketGrid");
    if (!grid) return;
    const search = qs("#ocRocketSearch");
    const state = qs("#ocRocketState");
    const ordering = qs("#ocRocketOrdering");
    const meta = qs("#ocRocketMeta");
    const prev = qs("#ocRocketPrev");
    const next = qs("#ocRocketNext");
    let offset = 0;
    const limit = 24;
    let payload = null;

    async function load(reset = false) {
      if (reset) offset = 0;
      setBusy(grid);
      try {
        const params = {
          limit, offset, mode: "normal",
          ordering: ordering?.value || "name",
          search: search?.value?.trim() || "",
          active: state?.value === "active" ? "true" : ""
        };
        payload = await cachedJson(apiUrl("launcher_configurations/", params), 30 * 60 * 1000);
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        grid.innerHTML = rows.length ? rows.map(rocketCard).join("") : `<div class="oc-state"><p>${esc(T.noResults)}</p></div>`;
        const total = Number(payload?.count || 0);
        const page = Math.floor(offset / limit) + 1;
        const pages = Math.max(1, Math.ceil(total / limit));
        if (meta) meta.innerHTML = `<strong>${new Intl.NumberFormat(dateLocale).format(total)}</strong> · ${esc(T.page)} ${page}/${pages}`;
        if (prev) prev.disabled = !payload?.previous;
        if (next) next.disabled = !payload?.next;
      } catch (error) {
        setError(grid, error, () => load(false));
      }
    }
    let timer;
    search?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => load(true), 450); });
    state?.addEventListener("change", () => load(true));
    ordering?.addEventListener("change", () => load(true));
    prev?.addEventListener("click", () => { if (payload?.previous) { offset = Math.max(0, offset-limit); load(false); scrollToGrid(grid); } });
    next?.addEventListener("click", () => { if (payload?.next) { offset += limit; load(false); scrollToGrid(grid); } });
    load(true);
  }

  async function initRocketDetail() {
    const root = qs("#ocRocketDetail");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      root.innerHTML = `<div class="oc-state oc-state--error"><p>${esc(T.error)}</p><a class="oc-btn" href="${localizedPath("orbital-rockets.html")}">${esc(T.backRockets)}</a></div>`;
      return;
    }
    setBusy(root);
    try {
      const [config, upcoming, previous] = await Promise.all([
        cachedJson(apiUrl(`launcher_configurations/${encodeURIComponent(id)}/`, { mode: "detailed" }), 60 * 60 * 1000),
        cachedJson(apiUrl("launches/upcoming/", { launcher_config__id: id, limit: 6, ordering: "net", mode: "normal" }), 10 * 60 * 1000).catch(() => ({results:[]})),
        cachedJson(apiUrl("launches/previous/", { launcher_config__id: id, limit: 6, ordering: "-net", mode: "normal" }), 30 * 60 * 1000).catch(() => ({results:[]}))
      ]);
      document.title = `${config.full_name || config.name || T.rocketDetails} — Orbital Atlas`;
      const image = rocketImage(config);
      const desc = config.description || T.noDescription;
      const maker = configManufacturer(config);
      const leoPayload = config.leo_capacity || config.to_leo || "";
      root.innerHTML = `
        <a class="oc-back" href="${localizedPath("orbital-rockets.html")}">${esc(T.backRockets)}</a>
        <section class="oc-detail-hero oc-detail-hero--rocket">
          <div class="oc-detail-media">${image ? `<img src="${esc(image)}" alt="" loading="eager" referrerpolicy="no-referrer">` : `<div class="oc-detail-placeholder">🚀</div>`}</div>
          <div class="oc-detail-copy">
            <div class="oc-detail-badges">${config.active ? `<span class="oc-badge is-good">${esc(T.active)}</span>` : `<span class="oc-badge">${esc(T.inactive)}</span>`}</div>
            <p class="oc-kicker">${esc(maker?.name || T.unknown)}</p>
            <h1>${esc(config.full_name || config.name || T.unknown)}</h1>
            <p class="oc-detail-lead">${esc(desc)}</p>
          </div>
        </section>
        <section class="oc-detail-grid">
          <article class="oc-panel">
            <h2>${esc(T.rocketDetails)}</h2>
            <div class="oc-info-grid">
              ${infoItem(T.manufacturer, maker?.name)}
              ${infoItem(T.maidenFlight, formatDate(config?.maiden_flight, false))}
              ${infoItem(T.stages, config?.min_stage ?? config?.max_stage)}
              ${infoItem(T.height, config?.length != null ? formatMetric(config.length, " m") : "")}
              ${infoItem(T.diameter, config?.diameter != null ? formatMetric(config.diameter, " m") : "")}
              ${infoItem(T.mass, config?.launch_mass != null ? formatMetric(config.launch_mass, " t") : "")}
              ${infoItem(T.payloadLEO, leoPayload ? formatMetric(leoPayload, " kg") : "")}
            </div>
          </article>
          <article class="oc-panel">
            <h2>${esc(T.launchCount)}</h2>
            <div class="oc-stat-grid">
              <div><strong>${esc(config.total_launch_count ?? "—")}</strong><span>${esc(T.launchCount)}</span></div>
              <div><strong>${esc(config.successful_launches ?? "—")}</strong><span>${esc(T.successfulLaunches)}</span></div>
              <div><strong>${esc(config.failed_launches ?? "—")}</strong><span>${esc(T.failedLaunches)}</span></div>
              <div><strong>${esc(config.pending_launches ?? "—")}</strong><span>${esc(T.pendingLaunches)}</span></div>
            </div>
          </article>
        </section>
        <section class="oc-panel">
          <div class="oc-panel-head"><div><p class="oc-kicker">${esc(T.relatedLaunches)}</p><h2>${esc(T.upcoming)}</h2></div></div>
          <div class="oc-related-grid">${(upcoming.results || []).length ? upcoming.results.map(launchCard).join("") : `<div class="oc-state"><p>${esc(T.noResults)}</p></div>`}</div>
        </section>
        <section class="oc-panel">
          <div class="oc-panel-head"><div><p class="oc-kicker">${esc(T.relatedLaunches)}</p><h2>${esc(T.previous)}</h2></div></div>
          <div class="oc-related-grid">${(previous.results || []).length ? previous.results.map(launchCard).join("") : `<div class="oc-state"><p>${esc(T.noResults)}</p></div>`}</div>
        </section>
        ${sourceNote()}
      `;
    } catch (error) {
      setError(root, error, () => initRocketDetail());
    }
  }

  function initNavActive() {
    const map = {
      launches: "launches",
      "launch-detail": "launches",
      locations: "locations",
      rockets: "rockets",
      "rocket-detail": "rockets"
    };
    const key = map[pageType];
    if (!key) return;
    qsa(".oa-contextnav__links a").forEach(a => a.classList.toggle("is-active", a.dataset.ocNav === key));
  }

  function fillStaticLabels() {
    qsa("[data-oc-text]").forEach(el => {
      const key = el.dataset.ocText;
      if (T[key]) el.textContent = T[key];
    });
    qsa("[data-oc-placeholder]").forEach(el => {
      const key = el.dataset.ocPlaceholder;
      if (T[key]) el.setAttribute("placeholder", T[key]);
    });
  }

  fillStaticLabels();
  initNavActive();

  if (pageType === "launches") initLaunchLibrary();
  if (pageType === "launch-detail") initLaunchDetail();
  if (pageType === "locations") initLocations();
  if (pageType === "rockets") initRockets();
  if (pageType === "rocket-detail") initRocketDetail();
})();