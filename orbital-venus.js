(() => {
  const root = document.getElementById("venusAtlas");
  if (!root) return;

  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const copy = {
    ru: {
      loading: "Загружаем утверждённую номенклатуру USGS…", unavailable: "Номенклатура Венеры временно недоступна. Пожалуйста, обновите страницу позже.", count: "объектов", visible: "на карте", search: "Найти объект: например, Haumea или Guzel", all: "Все типы", crater: "Кратеры", corona: "Короны", mons: "Горы", patera: "Патеры", planitia: "Равнины", vallis: "Долины", other: "Остальные", select: "Выберите точку на карте или объект из списка.", feature: "объект IAU", type: "Тип", diameter: "Диаметр", coordinates: "Координаты", approval: "Утверждён", quad: "Квадрангл", origin: "Происхождение названия", source: "ОТКРЫТЬ КАРТОЧКУ USGS ↗", noResults: "Нет объектов, соответствующих текущему поиску и слоям.", share: "СКОПИРОВАТЬ ССЫЛКУ", copied: "ССЫЛКА СКОПИРОВАНА", updated: "Снимок USGS", latitude: "планетоцентрическая широта", longitude: "восточная долгота", keyboard: "Нажмите Enter, чтобы открыть объект", sourceLabel: "Официальный источник"
    },
    en: {
      loading: "Loading approved USGS nomenclature…", unavailable: "Venus nomenclature is temporarily unavailable. Please refresh the page later.", count: "features", visible: "on map", search: "Find a feature: for example, Haumea or Guzel", all: "All types", crater: "Craters", corona: "Coronae", mons: "Mountains", patera: "Paterae", planitia: "Plains", vallis: "Valleys", other: "Other", select: "Choose a point on the map or a feature from the list.", feature: "IAU feature", type: "Type", diameter: "Diameter", coordinates: "Coordinates", approval: "Approved", quad: "Quadrangle", origin: "Name origin", source: "OPEN USGS FEATURE ↗", noResults: "No features match the current search and layers.", share: "COPY LINK", copied: "LINK COPIED", updated: "USGS snapshot", latitude: "planetocentric latitude", longitude: "east longitude", keyboard: "Press Enter to open this feature", sourceLabel: "Official source"
    },
    tr: {
      loading: "USGS onaylı adlandırmaları yükleniyor…", unavailable: "Venüs adlandırmaları geçici olarak kullanılamıyor. Lütfen sayfayı daha sonra yenileyin.", count: "nesne", visible: "haritada", search: "Bir nesne bulun: örneğin Haumea veya Guzel", all: "Tüm türler", crater: "Kraterler", corona: "Koronalar", mons: "Dağlar", patera: "Pateralar", planitia: "Ovalar", vallis: "Vadiler", other: "Diğer", select: "Haritada bir nokta veya listeden bir nesne seçin.", feature: "IAU nesnesi", type: "Tür", diameter: "Çap", coordinates: "Koordinatlar", approval: "Onay", quad: "Karesi", origin: "Adın kökeni", source: "USGS KARTINI AÇ ↗", noResults: "Mevcut arama ve katmanlara uygun nesne yok.", share: "BAĞLANTIYI KOPYALA", copied: "BAĞLANTI KOPYALANDI", updated: "USGS görüntüsü", latitude: "planetsel merkez enlemi", longitude: "doğu boylamı", keyboard: "Bu nesneyi açmak için Enter tuşuna basın", sourceLabel: "Resmî kaynak"
    }
  };
  const t = copy[locale] || copy.ru;
  const apiBase = window.ORBITAL_ATLAS_API || "https://albaspace-api.nncdecdgc.workers.dev";
  const apiUrl = `${apiBase.replace(/\/$/, "")}/api/orbital/venus`;
  const state = { data: null, selectedId: new URL(location.href).searchParams.get("feature") || "", query: "", active: new Set(["AA", "CR", "MO", "PE", "PL", "VA", "other"]) };
  const groupDefinitions = [
    ["AA", "crater"], ["CR", "corona"], ["MO", "mons"], ["PE", "patera"], ["PL", "planitia"], ["VA", "vallis"], ["other", "other"]
  ];
  const groupFor = feature => ["AA", "CR", "MO", "PE", "PL", "VA"].includes(feature.code) ? feature.code : "other";
  const numberFormat = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : locale === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
  const el = id => document.getElementById(id);
  const escapeText = value => String(value ?? "");

  function safeUsGsUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "planetarynames.wr.usgs.gov" ? url.href : "https://planetarynames.wr.usgs.gov/Page/VENUS/target";
    } catch { return "https://planetarynames.wr.usgs.gov/Page/VENUS/target"; }
  }

  function create(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = escapeText(options.text);
    if (options.type) node.type = options.type;
    if (options.label) node.setAttribute("aria-label", options.label);
    return node;
  }

  function visibleFeatures() {
    if (!state.data) return [];
    const normalized = state.query.trim().toLocaleLowerCase();
    return state.data.features.filter(feature => {
      const matchesLayer = state.active.has(groupFor(feature));
      const haystack = `${feature.name} ${feature.cleanName || ""} ${feature.type || ""} ${feature.origin || ""}`.toLocaleLowerCase();
      return matchesLayer && (!normalized || haystack.includes(normalized));
    });
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (state.selectedId) url.searchParams.set("feature", state.selectedId); else url.searchParams.delete("feature");
    const active = groupDefinitions.map(([code]) => code).filter(code => state.active.has(code));
    if (active.length !== groupDefinitions.length) url.searchParams.set("layers", active.join(",")); else url.searchParams.delete("layers");
    history.replaceState({}, "", url);
  }

  function featurePosition(feature) {
    return { x: Math.max(0, Math.min(360, Number(feature.longitudeEast))), y: Math.max(0, Math.min(180, 90 - Number(feature.latitude))) };
  }

  function renderGrid(svg) {
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grid.setAttribute("class", "oa-venus-grid");
    for (let longitude = 0; longitude <= 360; longitude += 45) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", longitude); line.setAttribute("x2", longitude); line.setAttribute("y1", "0"); line.setAttribute("y2", "180"); grid.append(line);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", longitude === 360 ? "356" : String(longitude + 2)); text.setAttribute("y", "176"); text.textContent = `${longitude}°E`; grid.append(text);
    }
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const y = 90 - latitude;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0"); line.setAttribute("x2", "360"); line.setAttribute("y1", y); line.setAttribute("y2", y); grid.append(line);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "3"); text.setAttribute("y", y - 2); text.textContent = `${latitude > 0 ? "+" : ""}${latitude}°`; grid.append(text);
    }
    svg.append(grid);
  }

  function selectFeature(id, options = {}) {
    if (!state.data) return;
    state.selectedId = state.data.features.some(feature => feature.id === id) ? id : "";
    syncUrl();
    render();
    if (options.focus && state.selectedId) el("venusDetail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderMap(features) {
    const map = el("venusMap");
    map.replaceChildren();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "oa-venus-map"); svg.setAttribute("viewBox", "0 0 360 180"); svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${t.visible}: ${features.length}`);
    renderGrid(svg);
    const rendered = features.slice(0, 2200);
    for (const feature of rendered) {
      const position = featurePosition(feature);
      const point = document.createElementNS("http://www.w3.org/2000/svg", "g");
      point.setAttribute("class", `oa-venus-point${feature.id === state.selectedId ? " is-selected" : ""}`);
      point.setAttribute("data-group", groupFor(feature)); point.setAttribute("tabindex", "0"); point.setAttribute("role", "button");
      point.setAttribute("aria-label", `${feature.name}. ${feature.type || t.feature}. ${t.keyboard}`);
      point.setAttribute("transform", `translate(${position.x} ${position.y})`);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle"); dot.setAttribute("r", feature.id === state.selectedId ? "1.8" : "1.12"); point.append(dot);
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle"); hit.setAttribute("class", "oa-venus-hit"); hit.setAttribute("r", "4"); point.append(hit);
      const activate = () => selectFeature(feature.id, { focus: true });
      point.addEventListener("click", activate);
      point.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
      svg.append(point);
    }
    map.append(svg);
  }

  function renderLayers() {
    const layers = el("venusLayers");
    layers.replaceChildren();
    for (const [code, label] of groupDefinitions) {
      const button = create("button", { className: `oa-venus-layer${state.active.has(code) ? " is-active" : ""}`, type: "button", text: t[label] });
      button.dataset.group = code; button.setAttribute("aria-pressed", String(state.active.has(code)));
      button.addEventListener("click", () => {
        if (code === "other") state.active.has(code) ? state.active.delete(code) : state.active.add(code);
        else state.active.has(code) ? state.active.delete(code) : state.active.add(code);
        if (!state.active.size) state.active.add(code);
        syncUrl(); render();
      });
      layers.append(button);
    }
  }

  function renderDetail() {
    const detail = el("venusDetail");
    detail.replaceChildren();
    const selected = state.data?.features.find(feature => feature.id === state.selectedId);
    if (!selected) {
      detail.append(create("p", { className: "oa-venus-detail__eyebrow", text: t.feature }));
      detail.append(create("h2", { text: "Venus" }));
      detail.append(create("p", { className: "oa-venus-origin", text: t.select }));
      return;
    }
    detail.append(create("p", { className: "oa-venus-detail__eyebrow", text: `${t.feature} · ${selected.code || "—"}` }));
    detail.append(create("h2", { text: selected.name }));
    detail.append(create("p", { className: "oa-venus-detail__type", text: selected.type || "—" }));
    const facts = create("div", { className: "oa-venus-facts" });
    const items = [
      [t.diameter, selected.diameterKm == null ? "—" : `${numberFormat.format(selected.diameterKm)} km`],
      [t.coordinates, `${numberFormat.format(selected.latitude)}° · ${numberFormat.format(selected.longitudeEast)}°E`],
      [t.approval, selected.approvalDate || selected.approval || "—"],
      [t.quad, selected.quad || "—"]
    ];
    for (const [label, value] of items) { const item = create("div"); item.append(create("small", { text: label }), create("strong", { text: value })); facts.append(item); }
    detail.append(facts);
    if (selected.origin) detail.append(create("p", { className: "oa-venus-origin", text: `${t.origin}: ${selected.origin}` }));
    const source = create("a", { className: "oa-venus-source-link", text: t.source }); source.href = safeUsGsUrl(selected.sourceUrl); source.target = "_blank"; source.rel = "noreferrer"; detail.append(source);
  }

  function renderResults(features) {
    const results = el("venusResults");
    results.replaceChildren();
    if (!features.length) { results.append(create("div", { className: "oa-venus-notice", text: t.noResults })); return; }
    const ordered = [...features].sort((a, b) => a.name.localeCompare(b.name, "en")).slice(0, 60);
    for (const feature of ordered) {
      const button = create("button", { className: `oa-venus-result${feature.id === state.selectedId ? " is-selected" : ""}`, type: "button" });
      const labels = create("span"); labels.append(create("strong", { text: feature.name }), create("small", { text: `${feature.type || t.feature} · ${numberFormat.format(feature.latitude)}° / ${numberFormat.format(feature.longitudeEast)}°E` }));
      button.append(labels, create("code", { text: feature.code || "—" }));
      button.addEventListener("click", () => selectFeature(feature.id, { focus: true })); results.append(button);
    }
  }

  function render() {
    if (!state.data) return;
    const features = visibleFeatures();
    el("venusCount").textContent = `${numberFormat.format(state.data.featureCount)} ${t.count}`;
    el("venusMapMeta").textContent = `${numberFormat.format(features.length)} ${t.visible}`;
    el("venusSnapshot").textContent = `${t.updated}: ${dateFormat.format(new Date(state.data.snapshotAt))}`;
    renderLayers(); renderMap(features); renderDetail(); renderResults(features);
  }

  function renderUnavailable(message) {
    el("venusMap").replaceChildren(create("div", { className: "oa-venus-notice", text: message }));
    el("venusResults").replaceChildren(create("div", { className: "oa-venus-notice", text: message }));
    el("venusDetail").replaceChildren(create("p", { className: "oa-venus-origin", text: message }));
    el("venusMapMeta").textContent = "—"; el("venusCount").textContent = "—";
  }

  function hydrateFromUrl() {
    const layers = new URL(location.href).searchParams.get("layers");
    if (layers) {
      const allowed = new Set(groupDefinitions.map(([code]) => code));
      const parsed = layers.split(",").filter(code => allowed.has(code));
      if (parsed.length) state.active = new Set(parsed);
    }
  }

  const search = el("venusSearch");
  search.placeholder = t.search;
  search.addEventListener("input", () => { state.query = search.value; render(); });
  el("venusShare").textContent = t.share;
  el("venusShare").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); el("venusShare").textContent = t.copied; setTimeout(() => { el("venusShare").textContent = t.share; }, 1800); }
    catch { el("venusShare").textContent = location.href; }
  });
  hydrateFromUrl();
  el("venusMapMeta").textContent = t.loading;
  fetch(apiUrl, { headers: { Accept: "application/json" } })
    .then(async response => { const payload = await response.json(); if (!response.ok || !Array.isArray(payload?.features) || payload.features.length < 1500) throw new Error(payload?.error || "Invalid Venus snapshot"); return payload; })
    .then(data => { state.data = data; if (state.selectedId && !data.features.some(feature => feature.id === state.selectedId)) state.selectedId = ""; render(); })
    .catch(error => { console.warn("Venus Atlas data unavailable", error); renderUnavailable(t.unavailable); });
})();
