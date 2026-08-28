(function () {
  const root = document.getElementById("worldAtlas");
  if (!root) return;

  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const apiBase = (window.ORBITAL_ATLAS_API || "https://albaspace-api.nncdecdgc.workers.dev").replace(/\/$/, "");
  const copy = {
    ru: { loading: "Загружаем утверждённую номенклатуру USGS…", unavailable: "Номенклатура временно недоступна. Попробуйте обновить страницу позже.", venus: "Венера", mars: "Марс", moon: "Луна", count: "объектов", visible: "на карте", search: "Найти объект: например, Haumea, Olympus или Tycho", all: "Все типы", crater: "Кратеры", corona: "Короны", mons: "Горы", patera: "Патеры", planitia: "Равнины", vallis: "Долины", plain: "Равнины", other: "Остальные", select: "Выберите точку на карте или объект из списка.", feature: "объект IAU", type: "Тип", diameter: "Диаметр", coordinates: "Координаты", approval: "Утверждён", quad: "Квадрангл", origin: "Происхождение названия", source: "ОТКРЫТЬ КАРТОЧКУ USGS ↗", noResults: "Нет объектов, соответствующих текущему поиску и слоям.", share: "СКОПИРОВАТЬ ССЫЛКУ", copied: "ССЫЛКА СКОПИРОВАНА", updated: "Снимок USGS", sourceLabel: "Официальный источник" },
    en: { loading: "Loading approved USGS nomenclature…", unavailable: "Nomenclature is temporarily unavailable. Please refresh the page later.", venus: "Venus", mars: "Mars", moon: "Moon", count: "features", visible: "on map", search: "Find a feature: Haumea, Olympus or Tycho", all: "All types", crater: "Craters", corona: "Coronae", mons: "Mountains", patera: "Paterae", planitia: "Plains", vallis: "Valleys", plain: "Plains", other: "Other", select: "Choose a point on the map or a feature from the list.", feature: "IAU feature", type: "Type", diameter: "Diameter", coordinates: "Coordinates", approval: "Approved", quad: "Quadrangle", origin: "Name origin", source: "OPEN USGS FEATURE ↗", noResults: "No features match the current search and layers.", share: "COPY LINK", copied: "LINK COPIED", updated: "USGS snapshot", sourceLabel: "Official source" },
    tr: { loading: "USGS onaylı adlandırmaları yükleniyor…", unavailable: "Adlandırma geçici olarak kullanılamıyor. Lütfen sayfayı daha sonra yenileyin.", venus: "Venüs", mars: "Mars", moon: "Ay", count: "nesne", visible: "haritada", search: "Bir nesne bulun: Haumea, Olympus veya Tycho", all: "Tüm türler", crater: "Kraterler", corona: "Koronalar", mons: "Dağlar", patera: "Pateralar", planitia: "Ovalar", vallis: "Vadiler", plain: "Ovalar", other: "Diğer", select: "Haritada bir nokta veya listeden bir nesne seçin.", feature: "IAU nesnesi", type: "Tür", diameter: "Çap", coordinates: "Koordinatlar", approval: "Onay", quad: "Karesi", origin: "Adın kökeni", source: "USGS KARTINI AÇ ↗", noResults: "Mevcut arama ve katmanlara uygun nesne yok.", share: "BAĞLANTIYI KOPYALA", copied: "BAĞLANTI KOPYALANDI", updated: "USGS görüntüsü", sourceLabel: "Resmî kaynak" }
  };
  const t = copy[locale] || copy.ru;
  const bodyConfig = {
    venus: { endpoint: "venus", minimum: 1500, groups: [["AA", "crater"], ["CR", "corona"], ["MO", "mons"], ["PE", "patera"], ["PL", "planitia"], ["VA", "vallis"], ["other", "other"]] },
    mars: { endpoint: "mars", minimum: 1500, groups: [["AA", "crater"], ["MO", "mons"], ["VA", "vallis"], ["PL", "plain"], ["other", "other"]] },
    moon: { endpoint: "moon", minimum: 7500, groups: [["AA", "crater"], ["MO", "mons"], ["VA", "vallis"], ["PL", "plain"], ["other", "other"]] }
  };
  const initial = new URL(location.href).searchParams.get("body");
  const state = {
    body: bodyConfig[initial] ? initial : "venus",
    data: null,
    selectedId: new URL(location.href).searchParams.get("feature") || "",
    query: "",
    active: new Set(bodyConfig[bodyConfig[initial] ? initial : "venus"].groups.map(([code]) => code))
  };
  const el = id => document.getElementById(id);
  const make = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = String(options.text);
    if (options.type) node.type = options.type;
    return node;
  };
  const nf = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 });
  const df = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : locale === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
  const labels = () => ({ venus: t.venus, mars: t.mars, moon: t.moon });
  const activeGroups = () => bodyConfig[state.body].groups;
  const groupFor = feature => activeGroups().some(([code]) => code === feature.code) ? feature.code : "other";
  const safeUsGsUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "planetarynames.wr.usgs.gov" ? url.href : "https://planetarynames.wr.usgs.gov/";
    } catch { return "https://planetarynames.wr.usgs.gov/"; }
  };
  const visible = () => {
    const q = state.query.trim().toLocaleLowerCase();
    return (state.data?.features || []).filter(feature => state.active.has(groupFor(feature)) && (!q || `${feature.name} ${feature.cleanName || ""} ${feature.type || ""} ${feature.origin || ""}`.toLocaleLowerCase().includes(q)));
  };

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.set("body", state.body);
    if (state.selectedId) url.searchParams.set("feature", state.selectedId); else url.searchParams.delete("feature");
    history.replaceState({}, "", url);
  }

  function select(id, shouldFocus = true) {
    state.selectedId = state.data?.features.some(feature => feature.id === id) ? id : "";
    syncUrl(); render();
    if (shouldFocus && state.selectedId) el("worldDetail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderBodyTabs() {
    const host = el("worldBodies") || document.querySelector("[data-world]")?.parentElement;
    if (!host) return;
    host.replaceChildren();
    Object.keys(bodyConfig).forEach(body => {
      const button = make("button", { className: `oa-venus-layer${body === state.body ? " is-active" : ""}`, type: "button", text: labels()[body] });
      button.dataset.world = body;
      button.setAttribute("aria-pressed", String(body === state.body));
      button.addEventListener("click", () => load(body));
      host.append(button);
    });
  }

  function renderMap(features) {
    const host = el("worldMap");
    if (!host) return;
    host.replaceChildren();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "oa-venus-map"); svg.setAttribute("viewBox", "0 0 360 180"); svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${labels()[state.body]}: ${features.length}`);
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "g"); grid.setAttribute("class", "oa-venus-grid");
    for (let lon = 0; lon <= 360; lon += 45) { const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", lon); line.setAttribute("x2", lon); line.setAttribute("y1", "0"); line.setAttribute("y2", "180"); grid.append(line); }
    for (let lat = -60; lat <= 60; lat += 30) { const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", "0"); line.setAttribute("x2", "360"); line.setAttribute("y1", String(90 - lat)); line.setAttribute("y2", String(90 - lat)); grid.append(line); }
    svg.append(grid);
    for (const feature of features.slice(0, 2600)) {
      const x = Math.max(0, Math.min(360, Number(feature.longitudeEast))); const y = Math.max(0, Math.min(180, 90 - Number(feature.latitude)));
      const point = document.createElementNS("http://www.w3.org/2000/svg", "g"); point.setAttribute("class", `oa-venus-point${feature.id === state.selectedId ? " is-selected" : ""}`); point.setAttribute("data-group", groupFor(feature)); point.setAttribute("tabindex", "0"); point.setAttribute("role", "button"); point.setAttribute("aria-label", `${feature.name}. ${feature.type || t.feature}`); point.setAttribute("transform", `translate(${x} ${y})`);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); dot.setAttribute("r", feature.id === state.selectedId ? "1.8" : "1.12");
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle"); hit.setAttribute("class", "oa-venus-hit"); hit.setAttribute("r", "4");
      point.append(dot, hit); point.addEventListener("click", () => select(feature.id)); point.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(feature.id); } }); svg.append(point);
    }
    host.append(svg);
  }

  function renderLayers() {
    const host = el("worldLayers"); if (!host) return;
    host.replaceChildren();
    activeGroups().forEach(([code, label]) => {
      const button = make("button", { className: `oa-venus-layer${state.active.has(code) ? " is-active" : ""}`, type: "button", text: t[label] });
      button.setAttribute("aria-pressed", String(state.active.has(code))); button.addEventListener("click", () => { state.active.has(code) ? state.active.delete(code) : state.active.add(code); if (!state.active.size) state.active.add(code); render(); }); host.append(button);
    });
  }

  function renderDetail() {
    const host = el("worldDetail"); if (!host) return;
    host.replaceChildren();
    const feature = state.data?.features.find(item => item.id === state.selectedId);
    if (!feature) { host.append(make("p", { className: "oa-venus-detail__eyebrow", text: t.feature }), make("h2", { text: labels()[state.body] }), make("p", { className: "oa-venus-origin", text: t.select })); return; }
    host.append(make("p", { className: "oa-venus-detail__eyebrow", text: `${t.feature} · ${feature.code || "—"}` }), make("h2", { text: feature.name }), make("p", { className: "oa-venus-detail__type", text: feature.type || "—" }));
    const facts = make("div", { className: "oa-venus-facts" }); [[t.diameter, feature.diameterKm == null ? "—" : `${nf.format(feature.diameterKm)} km`], [t.coordinates, `${nf.format(feature.latitude)}° · ${nf.format(feature.longitudeEast)}°E`], [t.approval, feature.approvalDate || feature.approval || "—"], [t.quad, feature.quad || "—"]].forEach(([label, value]) => { const item = document.createElement("div"); item.append(make("small", { text: label }), make("strong", { text: value })); facts.append(item); }); host.append(facts);
    if (feature.origin) host.append(make("p", { className: "oa-venus-origin", text: `${t.origin}: ${feature.origin}` }));
    const link = make("a", { className: "oa-venus-source-link", text: t.source }); link.href = safeUsGsUrl(feature.sourceUrl); link.target = "_blank"; link.rel = "noreferrer"; host.append(link);
  }

  function renderResults(features) {
    const host = el("worldResults"); if (!host) return;
    host.replaceChildren();
    if (!features.length) { host.append(make("div", { className: "oa-venus-notice", text: t.noResults })); return; }
    [...features].sort((a, b) => a.name.localeCompare(b.name, "en")).slice(0, 70).forEach(feature => {
      const button = make("button", { className: `oa-venus-result${feature.id === state.selectedId ? " is-selected" : ""}`, type: "button" }); const featureLabels = document.createElement("span"); featureLabels.append(make("strong", { text: feature.name }), make("small", { text: `${feature.type || t.feature} · ${nf.format(feature.latitude)}° / ${nf.format(feature.longitudeEast)}°E` })); button.append(featureLabels, make("code", { text: feature.code || "—" })); button.addEventListener("click", () => select(feature.id)); host.append(button);
    });
  }

  function render() {
    if (!state.data) return;
    const features = visible(); const count = el("worldCount"); const meta = el("worldMapMeta"); const snapshot = el("worldSnapshot"); const title = el("worldTitle"); const source = el("worldSourceLink");
    if (count) count.textContent = `${nf.format(state.data.featureCount)} ${t.count}`; if (meta) meta.textContent = `${nf.format(features.length)} ${t.visible}`; if (snapshot) snapshot.textContent = `${t.updated}: ${df.format(new Date(state.data.snapshotAt))}`; if (title) title.textContent = labels()[state.body]; if (source) { source.href = safeUsGsUrl(state.data.source?.targetUrl); source.textContent = `${t.sourceLabel}: USGS ${labels()[state.body]} ↗`; }
    renderBodyTabs(); renderLayers(); renderMap(features); renderDetail(); renderResults(features);
  }

  function load(body, options = {}) {
    if (!bodyConfig[body]) return;
    const keepFeature = options.keepFeature === true;
    state.body = body; state.data = null; state.query = ""; if (!keepFeature) state.selectedId = ""; state.active = new Set(activeGroups().map(([code]) => code)); syncUrl(); renderBodyTabs();
    const map = el("worldMap"), results = el("worldResults"), search = el("worldSearch"); if (map) map.replaceChildren(make("div", { className: "oa-venus-notice", text: t.loading })); if (results) results.replaceChildren(); if (search) search.value = "";
    fetch(`${apiBase}/api/orbital/${bodyConfig[body].endpoint}`, { headers: { Accept: "application/json" } }).then(async response => { const data = await response.json(); if (!response.ok || !Array.isArray(data.features) || data.features.length < bodyConfig[body].minimum) throw new Error(data.error || "Invalid snapshot"); return data; }).then(data => { state.data = data; if (state.selectedId && !data.features.some(feature => feature.id === state.selectedId)) state.selectedId = ""; render(); }).catch(() => { if (map) map.replaceChildren(make("div", { className: "oa-venus-notice", text: t.unavailable })); if (results) results.replaceChildren(make("div", { className: "oa-venus-notice", text: t.unavailable })); });
  }

  const search = el("worldSearch"); if (search) { search.placeholder = t.search; search.addEventListener("input", event => { state.query = event.target.value; if (state.data) render(); }); }
  const share = el("worldShare"); if (share) { share.textContent = t.share; share.addEventListener("click", async () => { try { await navigator.clipboard.writeText(location.href); share.textContent = t.copied; setTimeout(() => { share.textContent = t.share; }, 1800); } catch { share.textContent = location.href; } }); }
  window.addEventListener("orbital:planetary-atlas", event => { const detail = event.detail || {}; const body = bodyConfig[detail.body] ? detail.body : state.body; if (detail.feature) state.selectedId = String(detail.feature); load(body, { keepFeature: Boolean(detail.feature) }); root.scrollIntoView({ behavior: "smooth", block: "start" }); });
  load(state.body, { keepFeature: Boolean(state.selectedId) });
})();
