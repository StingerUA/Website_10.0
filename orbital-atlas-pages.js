(() => {
  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const isDev = location.hostname === "localhost" || location.hostname.includes("manus.computer");
  const workerBase = window.ORBITAL_ATLAS_API || (isDev ? "" : "https://albaspace-api.nncdecdgc.workers.dev");
  const overviewUrl = workerBase
    ? `${workerBase}/api/orbital/overview`
    : "/api/trpc/orbital.overview?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D";
  const trpcPassUrl = "/api/trpc/orbital.issPass?batch=1&input=";
  const tleUrl = `${workerBase}/api/orbital/iss-tle`;

  const dictionary = {
    ru: {
      language: "ru-RU", browse: "Открыть раздел", watching: "ОТКРЫТЬ ЭФИР ↗", streamPending: "Ссылка на эфир появится после подтверждения", imageCredit: "Фото", live: "прямой эфир", fallback: "Данные временно недоступны. Попробуйте обновить страницу позже.", awaiting: "Получаем актуальные данные", next: "Следующая миссия", launchWindow: "до окна старта", provider: "Оператор уточняется", location: "Площадка уточняется", mission: "Миссия уточняется", launch: "Запуски", cameras: "Камеры МКС", station: "МКС", crew: "Экипаж", solar: "Солнечная система", activeCrew: "активный экипаж МКС", officialProfile: "ОТКРЫТЬ ОФИЦИАЛЬНЫЙ ПРОФИЛЬ ↗", loaded: "Данные обновлены", position: "Положение МКС", speed: "Скорость", altitude: "Высота", latitude: "Широта", longitude: "Долгота", visibility: "Видимость", pass: "Следующий пролёт", city: "Ваше местоположение", allowLocation: "Определить мой город", locationWaiting: "ожидание геолокации", requestLocation: "Разрешите доступ к геолокации", passDetail: "После согласия рассчитаем ближайший видимый пролёт МКС над вашим городом.", maxElevation: "Максимальная высота", duration: "Продолжительность", calculating: "считаем траекторию", locating: "получаем координаты", unavailable: "Расчёт временно недоступен. Попробуйте позже.", denied: "Геолокация недоступна. Разрешите доступ к местоположению в браузере и повторите попытку.", noPass: "Нет видимого пролёта в ближайшие 48 часов.", retry: "Повторить расчёт", mapWaiting: "Карта маршрута появится после разрешения геолокации.", technical: "Технический профиль", model2d: "2D", model3d: "3D", selectPlanet: "Выберите планету", cameraUnavailable: "Если проигрыватель недоступен, откройте эфир на YouTube.", camera1: "Камера 1", camera2: "Камера 2", camera3: "Камера 3", camera4: "Камера 4", overview: "Обзор", now: "Сейчас", route: "Маршрут", start: "Начало", end: "Окончание", linkLabel: "ОТКРЫТЬ НА YOUTUBE ↗", source: "Официальный источник", day: "д", hour: "ч", minute: "м", second: "с"
    },
    en: {
      language: "en-US", browse: "Open section", watching: "OPEN STREAM ↗", streamPending: "A stream link will appear after confirmation", imageCredit: "Photo", live: "live stream", fallback: "Data is temporarily unavailable. Please refresh the page later.", awaiting: "Loading current data", next: "Next mission", launchWindow: "to launch window", provider: "Provider pending", location: "Launch site pending", mission: "Mission pending", launch: "Launches", cameras: "ISS cameras", station: "ISS", crew: "Crew", solar: "Solar system", activeCrew: "current ISS crew", officialProfile: "OPEN OFFICIAL PROFILE ↗", loaded: "Data updated", position: "ISS position", speed: "Velocity", altitude: "Altitude", latitude: "Latitude", longitude: "Longitude", visibility: "Visibility", pass: "Next pass", city: "Your location", allowLocation: "Find my city", locationWaiting: "location needed", requestLocation: "Allow location access", passDetail: "After your consent, we will calculate the next visible ISS pass above your city.", maxElevation: "Maximum elevation", duration: "Duration", calculating: "calculating route", locating: "getting coordinates", unavailable: "The calculation is unavailable. Please try again later.", denied: "Location is unavailable. Allow location access in your browser and try again.", noPass: "No visible pass within the next 48 hours.", retry: "Calculate again", mapWaiting: "The route map will appear after location access is granted.", technical: "Technical profile", model2d: "2D", model3d: "3D", selectPlanet: "Choose a planet", cameraUnavailable: "If the embedded player is unavailable, open the stream on YouTube.", camera1: "Camera 1", camera2: "Camera 2", camera3: "Camera 3", camera4: "Camera 4", overview: "Overview", now: "Now", route: "Route", start: "Start", end: "End", linkLabel: "OPEN ON YOUTUBE ↗", source: "Official source", day: "d", hour: "h", minute: "m", second: "s"
    },
    tr: {
      language: "tr-TR", browse: "Bölümü aç", watching: "YAYINI AÇ ↗", streamPending: "Yayın bağlantısı onaydan sonra görünecek", imageCredit: "Fotoğraf", live: "canlı yayın", fallback: "Veriler geçici olarak kullanılamıyor. Lütfen sayfayı daha sonra yenileyin.", awaiting: "Güncel veriler yükleniyor", next: "Sıradaki görev", launchWindow: "fırlatma penceresine", provider: "Operatör bekleniyor", location: "Fırlatma sahası bekleniyor", mission: "Görev bekleniyor", launch: "Fırlatmalar", cameras: "ISS kameraları", station: "ISS", crew: "Mürettebat", solar: "Güneş sistemi", activeCrew: "mevcut ISS mürettebatı", officialProfile: "RESMÎ PROFİLİ AÇ ↗", loaded: "Veriler güncellendi", position: "ISS konumu", speed: "Hız", altitude: "İrtifa", latitude: "Enlem", longitude: "Boylam", visibility: "Visibility", pass: "Sıradaki geçiş", city: "Konumunuz", allowLocation: "Şehrimi bul", locationWaiting: "konum bekleniyor", requestLocation: "Konum erişimine izin verin", passDetail: "İzninizden sonra ISS'in şehriniz üzerindeki sıradaki görünür geçişini hesaplayacağız.", maxElevation: "En yüksek irtifa", duration: "Süre", calculating: "rota hesaplanıyor", locating: "koordinatlar alınıyor", unavailable: "Hesaplama geçici olarak kullanılamıyor. Lütfen tekrar deneyin.", denied: "Konum kullanılamıyor. Tarayıcıda konum erişimine izin verip tekrar deneyin.", noPass: "Önümüzdeki 48 saatte görünür geçiş yok.", retry: "Tekrar hesapla", mapWaiting: "Konum izni verildiğinde rota haritası görünür.", technical: "Teknik profil", model2d: "2D", model3d: "3D", selectPlanet: "Gezegen seçin", cameraUnavailable: "Yerleşik oynatıcı çalışmazsa yayını YouTube'da açın.", camera1: "Kamera 1", camera2: "Kamera 2", camera3: "Kamera 3", camera4: "Kamera 4", overview: "Genel bakış", now: "Şimdi", route: "Rota", start: "Başlangıç", end: "Bitiş", linkLabel: "YOUTUBE'DA AÇ ↗", source: "Resmî kaynak", day: "g", hour: "s", minute: "d", second: "sn"
    }
  };
  const t = dictionary[locale] || dictionary.ru;
  const copy = {
    ru: {
      landingTitle: "Космос в движении.", landingLead: "Orbital Atlas — пространство для наблюдения за запусками, Международной космической станцией и Солнечной системой.", landingSection: "Выберите траекторию исследования.", landingNote: "Данные запусков и станции обновляются через проверяемые открытые источники, а официальные эфиры открываются в один клик.", routeLaunch: "Запуски", routeLaunchDesc: "Ближайшие миссии, действующие таймеры и ссылки на официальные эфиры.", routeLive: "Камеры МКС", routeLiveDesc: "Четыре предоставленных эфира, телеметрия, карта и следующий пролёт над вами.", routeCrew: "Экипаж", routeCrewDesc: "Состав станции, портреты и переходы к официальным профилям космонавтов.", routeSolar: "Солнечная система", routeSolarDesc: "Самостоятельная интерактивная 2D/3D модель планет, созданная для Alba Space.", launchesTitle: "Запуски с живым обратным отсчётом.", launchesLead: "Следите за ближайшими окнами старта: каждая карточка показывает актуальное время, оператора, площадку и секундный таймер до миссии.", camerasTitle: "Камеры МКС: орбита в прямом эфире.", camerasLead: "Выберите один из предоставленных потоков, следите за текущим положением станции и рассчитайте ближайший видимый пролёт над своим городом.", factsTitle: "Краткий технический профиль МКС.", hdevNote: "HDEV — исторический эксперимент высококачественной съёмки Земли, завершённый в 2020 году. Современные эфиры на этой странице — предоставленные пользователем внешние трансляции; доступность и вид изображения определяет их вещатель.", crewTitle: "Экипаж МКС и официальные профили.", crewLead: "Карточки объединяют предоставленные пользователем портреты с текущим открытым реестром экипажа. Внешние ссылки ведут к проверенным страницам агентств и Центра подготовки космонавтов.", rosterTitle: "Текущий открытый реестр на борту.", solarTitle: "Солнечная система: 2D и 3D.", solarLead: "Собственная интерактивная модель Alba Space помогает посмотреть взаимное расположение планет, выбрать объект и переключить проекцию."
    },
    en: {
      landingTitle: "Space in motion.", landingLead: "Orbital Atlas is a space for observing launches, the International Space Station and the Solar System.", landingSection: "Choose an observation path.", landingNote: "Launch and station data use verifiable open sources, while official streams open in one click.", routeLaunch: "Launches", routeLaunchDesc: "Upcoming missions, live countdowns and links to official coverage.", routeLive: "ISS cameras", routeLiveDesc: "Four supplied streams, telemetry, a map and the next pass above you.", routeCrew: "Crew", routeCrewDesc: "Station roster, portraits and links to official astronaut profiles.", routeSolar: "Solar system", routeSolarDesc: "An original interactive 2D/3D planetary model created for Alba Space.", launchesTitle: "Launches with live countdowns.", launchesLead: "Follow upcoming launch windows: every card shows the latest time, provider, site and a second-by-second mission timer.", camerasTitle: "ISS cameras: orbit live.", camerasLead: "Choose one of the supplied streams, track the station's current position and calculate the next visible pass above your city.", factsTitle: "ISS technical profile at a glance.", hdevNote: "HDEV was a historic high-definition Earth-imaging experiment which ended in 2020. The current video choices on this page are user-supplied external streams; their broadcaster determines the availability and image shown.", crewTitle: "ISS crew and official profiles.", crewLead: "The cards combine user-supplied portraits with the current open crew registry. External links point to verified agency and Cosmonaut Training Center pages.", rosterTitle: "Current open registry on board.", solarTitle: "Solar System: 2D and 3D.", solarLead: "An original Alba Space interactive model helps explore the relative layout of planets, choose an object and switch projection."
    },
    tr: {
      landingTitle: "Hareket halindeki uzay.", landingLead: "Orbital Atlas; fırlatmaları, Uluslararası Uzay İstasyonu'nu ve Güneş Sistemi'ni gözlemlemek için bir alandır.", landingSection: "Bir gözlem rotası seçin.", landingNote: "Fırlatma ve istasyon verileri doğrulanabilir açık kaynaklardan gelir; resmî yayınlar tek tıkla açılır.", routeLaunch: "Fırlatmalar", routeLaunchDesc: "Yaklaşan görevler, canlı sayaçlar ve resmî yayın bağlantıları.", routeLive: "ISS kameraları", routeLiveDesc: "Sağlanan dört yayın, telemetri, harita ve konumunuz üzerindeki sıradaki geçiş.", routeCrew: "Mürettebat", routeCrewDesc: "İstasyon kadrosu, portreler ve resmî astronot profillerine bağlantılar.", routeSolar: "Güneş sistemi", routeSolarDesc: "Alba Space için oluşturulmuş özgün etkileşimli 2D/3D gezegen modeli.", launchesTitle: "Canlı geri sayımlı fırlatmalar.", launchesLead: "Yaklaşan fırlatma pencerelerini takip edin: her kart güncel saati, operatörü, sahayı ve saniye saniye görev sayacını gösterir.", camerasTitle: "ISS kameraları: yörüngeden canlı.", camerasLead: "Sağlanan yayınlardan birini seçin, istasyonun güncel konumunu izleyin ve şehriniz üzerindeki sıradaki görünür geçişi hesaplayın.", factsTitle: "ISS için kısa teknik profil.", hdevNote: "HDEV, 2020'de sona eren tarihî yüksek çözünürlüklü Dünya görüntüleme deneyiydi. Bu sayfadaki güncel video seçenekleri kullanıcı tarafından sağlanan dış yayınlardır; görüntü ve erişilebilirliği yayıncı belirler.", crewTitle: "ISS mürettebatı ve resmî profiller.", crewLead: "Kartlar, kullanıcı tarafından sağlanan portreleri güncel açık mürettebat kaydıyla birleştirir. Dış bağlantılar doğrulanmış ajans ve Kozmonot Eğitim Merkezi sayfalarına yönlendirir.", rosterTitle: "Araçtaki güncel açık kayıt.", solarTitle: "Güneş Sistemi: 2D ve 3D.", solarLead: "Özgün Alba Space etkileşimli modeli gezegenlerin göreli düzenini incelemeye, bir nesne seçmeye ve projeksiyonu değiştirmeye yardımcı olur."
    }
  };
  const c = copy[locale] || copy.ru;
  const issReference = {
    ru: {
      facts: [
        ["Начало эксплуатации", "20.11.1998", "Международная космическая станция."],
        ["Масса и габариты", "417 289 кг", "Длина 109 м; ширина с фермами 73,15 м; высота 27,4 м."],
        ["Жилой модуль", "916 м³", "Давление 1 атмосфера; средняя температура около 26,9 °C."],
        ["Солнечные батареи", "110 кВт", "Справочная электрическая мощность солнечных батарей станции."]
      ],
      note: "<strong>HDEV</strong> — исторический эксперимент высококачественной съёмки Земли, завершённый в 2020 году. Внешняя камера Node 2 расположена в передней части МКС и может показывать IDA2; во время операций или полёта станции в тени изображение способно временно стать тёмным, серым либо быть заменено помеченной архивной записью. Доступность каждого эфира определяет его вещатель."
    },
    en: {
      facts: [
        ["Operations began", "20 Nov 1998", "International Space Station."],
        ["Mass and dimensions", "417,289 kg", "Length 109 m; span with trusses 73.15 m; height 27.4 m."],
        ["Habitable module", "916 m³", "Pressure: 1 atmosphere; average temperature: about 26.9 °C."],
        ["Solar arrays", "110 kW", "Reference electrical output of the station's solar arrays."]
      ],
      note: "<strong>HDEV</strong> was a historic high-definition Earth-imaging experiment that ended in 2020. The external Node 2 camera is at the forward end of the ISS and may show IDA2; during operations or orbital night the picture can temporarily turn dark or grey, or be replaced by a labelled archive loop. Each broadcaster determines a stream's availability."
    },
    tr: {
      facts: [
        ["Operasyon başlangıcı", "20.11.1998", "Uluslararası Uzay İstasyonu."],
        ["Kütle ve boyutlar", "417.289 kg", "Uzunluk 109 m; kirişlerle genişlik 73,15 m; yükseklik 27,4 m."],
        ["Yaşanabilir modül", "916 m³", "Basınç 1 atmosfer; ortalama sıcaklık yaklaşık 26,9 °C."],
        ["Güneş panelleri", "110 kW", "İstasyon güneş panellerinin referans elektrik gücü."]
      ],
      note: "<strong>HDEV</strong>, 2020'de sona eren tarihî yüksek çözünürlüklü Dünya görüntüleme deneyiydi. Dış Node 2 kamerası ISS'in ön kısmındadır ve IDA2'yi gösterebilir; operasyonlar veya yörünge gecesi sırasında görüntü geçici olarak karanlık ya da gri olabilir veya etiketli bir arşiv döngüsü gösterilebilir. Her yayının erişilebilirliğini yayıncı belirler."
    }
  };
  const dateLocale = t.language;
  const escape = (value = "") => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const byId = id => document.getElementById(id);
  const setText = (id, value) => document.querySelectorAll(`[id="${id}"]`).forEach(node => { node.textContent = value; });
  const shortDate = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const longDate = new Intl.DateTimeFormat(dateLocale, { weekday: "short", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

  const localePath = locale === "en" ? "eng" : locale;
  if (locale !== "ru") document.querySelectorAll('a[href^="/orbital-"]').forEach(link => {
    const path = link.getAttribute("href");
    if (path && !path.startsWith(`/${localePath}/`)) link.setAttribute("href", `/${localePath}${path}`);
  });
  document.querySelectorAll("[data-t]").forEach(node => { const value = t[node.dataset.t]; if (value) node.textContent = value; });
  document.querySelectorAll("[data-copy]").forEach(node => { const value = c[node.dataset.copy]; if (value) node.textContent = value; });
  document.querySelectorAll("[data-t-title]").forEach(node => { const value = t[node.dataset.tTitle]; if (value) node.setAttribute("title", value); });
  const placeLabels = { ru: "Космические места", en: "Space places", tr: "Uzay yerleri" };
  const placeNav = document.querySelector(".oa-contextnav__links");
  if (placeNav && !placeNav.querySelector("[data-orbital-places]")) {
    const link = document.createElement("a");
    link.dataset.orbitalPlaces = "true";
    link.href = locale === "ru" ? "/orbital-places.html" : `/${localePath}/orbital-places.html`;
    link.textContent = placeLabels[locale] || placeLabels.ru;
    if (location.pathname.endsWith("/orbital-places.html")) link.classList.add("is-active");
    placeNav.append(link);
  }
  const placeRoutes = {
    ru: { title: "Космические места", description: "Реальные планетарии, обсерватории и научные центры рядом с вами на открытой карте." },
    en: { title: "Space places", description: "Real planetariums, observatories and science centres near you, on an open map." },
    tr: { title: "Uzay yerleri", description: "Açık haritada yakınınızdaki gerçek gezegenevleri, gözlemevleri ve bilim merkezleri." }
  };
  const routeGrid = document.querySelector(".oa-route-grid");
  if (location.pathname.endsWith("/orbital-atlas.html") && routeGrid && !routeGrid.querySelector('a[href$="/orbital-places.html"]')) {
    const route = placeRoutes[locale] || placeRoutes.ru;
    const card = document.createElement("a");
    card.className = "oa-route-card";
    card.dataset.orbitalPlacesRoute = "true";
    card.href = locale === "ru" ? "/orbital-places.html" : `/${localePath}/orbital-places.html`;
    card.innerHTML = `<span class="oa-route-card__number">05</span><h3>${route.title}</h3><p>${route.description}</p><span class="oa-route-card__go">${t.browse}</span>`;
    routeGrid.append(card);
  }

  function unwrapOverview(payload) {
    const entry = Array.isArray(payload) ? payload[0] : payload;
    return entry?.result?.data?.json || entry?.result?.data || entry || {};
  }

  async function getOverview() {
    const response = await fetch(overviewUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Overview request failed: ${response.status}`);
    return unwrapOverview(await response.json());
  }

  function formatCountdown(value) {
    const target = new Date(value || 0).getTime();
    if (!Number.isFinite(target) || !value) return "—";
    const delta = target - Date.now();
    if (delta <= 0) return "LIVE / T−0";
    const days = Math.floor(delta / 86400000);
    const hours = Math.floor((delta % 86400000) / 3600000);
    const minutes = Math.floor((delta % 3600000) / 60000);
    const seconds = Math.floor((delta % 60000) / 1000);
    return `${days ? `${days}${t.day} ` : ""}${String(hours).padStart(2, "0")}${t.hour} ${String(minutes).padStart(2, "0")}${t.minute} ${String(seconds).padStart(2, "0")}${t.second}`;
  }

  function updateCountdowns() {
    document.querySelectorAll("[data-countdown]").forEach(node => { node.textContent = formatCountdown(node.dataset.countdown); });
  }

  function launchStream(launch) {
    return typeof launch?.streamUrl === "string" && /^https:\/\//i.test(launch.streamUrl) ? launch.streamUrl : "";
  }

  function launchImage(launch) {
    const image = launch?.image;
    if (!image || typeof image.url !== "string" || !/^https:\/\//i.test(image.url) || typeof image.license !== "string" || !/^CC BY(?:\s|[-–])/i.test(image.license) || /\bNC\b/i.test(image.license)) return null;
    return image;
  }

  function renderLandingLaunch(launches) {
    const next = launches.find(item => item?.net && new Date(item.net) > new Date()) || launches[0];
    const name = next?.name || t.mission;
    setText("landingMission", name);
    setText("landingMeta", next?.provider ? `${next.provider} · ${next.net ? longDate.format(new Date(next.net)) : "—"}` : t.fallback);
    const clock = byId("landingCountdown");
    if (clock) clock.dataset.countdown = next?.net || "";
  }

  function renderLaunches(launches) {
    const root = byId("launchGrid");
    if (!root) return;
    if (!Array.isArray(launches) || !launches.length) { root.innerHTML = `<article class="oa-card oa-fallback">${escape(t.fallback)}</article>`; return; }
    root.innerHTML = launches.map(launch => {
      const when = launch.net || "";
      const stream = launchStream(launch);
      const image = launchImage(launch);
      const visual = image ? `<figure class="oa-launch__image"><img src="${escape(image.url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><figcaption>${escape(t.imageCredit)}: ${escape(image.credit)} · ${image.licenseUrl ? `<a href="${escape(image.licenseUrl)}" target="_blank" rel="noreferrer">${escape(image.license)}</a>` : escape(image.license)}</figcaption></figure>` : "";
      const watch = stream ? `<a class="oa-launch__watch" href="${escape(stream)}" target="_blank" rel="noreferrer">${escape(t.watching)}</a>` : `<span class="oa-launch__stream-pending">${escape(t.streamPending)}</span>`;
      const source = typeof launch.source === "string" && launch.source.trim() ? `<p class="oa-launch__source">${escape(launch.source)}</p>` : "";
      return `<article class="oa-card oa-launch">${visual}<div class="oa-launch__top"><span>${when ? `${escape(shortDate.format(new Date(when)))} UTC` : "—"}</span><span class="oa-launch__status">${escape(launch.status || "—")}</span></div><h3>${escape(launch.name || t.mission)}</h3><p>${escape(launch.provider || t.provider)}</p><p class="oa-launch__place">${escape(launch.location || t.location)}</p><strong class="oa-launch__clock" data-countdown="${escape(when)}">—</strong>${watch}${source}</article>`;
    }).join("");
  }

  function decimal(value, hemisphere) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return `${Math.abs(number).toFixed(2)}°${number < 0 ? hemisphere[1] : hemisphere[0]}`;
  }

  let issMap;
  function renderIssMap(iss) {
    const node = byId("issMap");
    if (!node || !window.L || !iss) return;
    const lat = Number(iss.latitude), lon = Number(iss.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    node.innerHTML = "";
    if (issMap) issMap.remove();
    issMap = window.L.map(node, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([lat, lon], 3);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(issMap);
    const icon = window.L.divIcon({ className: "oa-pin", iconSize: [14, 14], iconAnchor: [7, 7] });
    window.L.marker([lat, lon], { icon, title: t.station }).addTo(issMap);
  }

  function renderTelemetry(iss) {
    if (!iss) return;
    setText("issLatitude", decimal(iss.latitude, "NS"));
    setText("issLongitude", decimal(iss.longitude, "EW"));
    setText("issAltitude", `${Math.round(Number(iss.altitude) || 0)} km`);
    setText("issSpeed", `${Math.round((Number(iss.velocity) || 0) / 10) * 10} km/h`);
    setText("issVisibility", iss.visibility || "—");
    renderIssMap(iss);
  }

  const cameras = [
    { id: "awQzjn72bI0", key: "camera1", description: { ru: "Внешний вид на Землю", en: "External view of Earth", tr: "Dünya dış görünümü" } },
    { id: "M3HKLzjvKPc", key: "camera2", description: { ru: "Камера модуля МКС", en: "ISS module camera", tr: "ISS modül kamerası" } },
    { id: "fO9e9jnhYK8", key: "camera3", description: { ru: "Орбитальный видеопоток", en: "Orbital video stream", tr: "Yörünge video akışı" } },
    { id: "fO9e9jnhYK8", key: "camera4", description: { ru: "Резервный эфир", en: "Backup stream", tr: "Yedek yayın" } }
  ];

  function initCameras() {
    const player = byId("cameraPlayer");
    const list = byId("cameraList");
    if (!player || !list) return;
    const render = index => {
      const camera = cameras[index];
      player.innerHTML = `<iframe title="${escape(t[camera.key])}" src="https://www.youtube-nocookie.com/embed/${camera.id}?rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><div class="oa-player-note">${escape(t.cameraUnavailable)} <a href="https://www.youtube.com/watch?v=${camera.id}" target="_blank" rel="noreferrer">${escape(t.linkLabel)}</a></div>`;
      list.querySelectorAll("button").forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === index));
    };
    list.innerHTML = cameras.map((camera, index) => `<button type="button" class="oa-camera-choice${index === 0 ? " is-active" : ""}" data-camera-index="${index}"><small>${escape(t.live)}</small><strong>${escape(t[camera.key])}</strong><span>${escape(camera.description[locale] || camera.description.ru)}</span></button>`).join("");
    list.addEventListener("click", event => { const button = event.target.closest("[data-camera-index]"); if (button) render(Number(button.dataset.cameraIndex)); });
    render(0);
  }

  let passMap;
  function passEmpty(message) { const node = byId("passMap"); if (node) node.innerHTML = `<div class="oa-map-empty">${escape(message)}</div>`; }
  function browserPass(line1, line2, latitude, longitude) {
    if (!window.satellite) throw new Error("SGP4 unavailable");
    const satellite = window.satellite;
    const satrec = satellite.twoline2satrec(line1, line2);
    const observer = { longitude: satellite.degreesToRadians(longitude), latitude: satellite.degreesToRadians(latitude), height: 0 };
    let active = false, start = null, peak = null, maxElevation = -90;
    const track = [];
    const until = Date.now() + 48 * 60 * 60 * 1000;
    for (let time = Date.now(); time <= until; time += 30 * 1000) {
      const date = new Date(time);
      const state = satellite.propagate(satrec, date);
      if (!state?.position) continue;
      const gmst = satellite.gstime(date);
      const ecf = satellite.eciToEcf(state.position, gmst);
      const look = satellite.ecfToLookAngles(observer, ecf);
      const elevation = satellite.radiansToDegrees(look.elevation);
      const geo = satellite.eciToGeodetic(state.position, gmst);
      const visible = elevation >= 10;
      if (!active && visible) { active = true; start = date; }
      if (!active) continue;
      if (elevation > maxElevation) { maxElevation = elevation; peak = date; }
      if (!track.length || time - new Date(track[track.length - 1].at).getTime() >= 60000) track.push({ latitude: satellite.degreesLat(geo.latitude), longitude: satellite.degreesLong(geo.longitude), at: date.toISOString() });
      if (!visible && start && peak) return { start: start.toISOString(), end: date.toISOString(), peak: peak.toISOString(), peakElevation: Math.round(maxElevation), durationSeconds: Math.round((date.getTime() - start.getTime()) / 1000), groundTrack: track };
    }
    return null;
  }

  async function getPass(latitude, longitude) {
    if (workerBase) {
      const response = await fetch(`${tleUrl}?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("TLE request failed");
      const data = await response.json();
      return { city: data.city, location: { latitude, longitude }, pass: browserPass(data.line1, data.line2, latitude, longitude) };
    }
    const input = encodeURIComponent(JSON.stringify({ 0: { json: { latitude, longitude } } }));
    const response = await fetch(`${trpcPassUrl}${input}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Pass request failed");
    return unwrapOverview(await response.json());
  }

  function drawPassMap(location, pass) {
    const node = byId("passMap");
    if (!node || !window.L) { passEmpty(t.unavailable); return; }
    node.innerHTML = "";
    if (passMap) passMap.remove();
    passMap = window.L.map(node, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(passMap);
    const icon = window.L.divIcon({ className: "oa-pin", iconSize: [14, 14], iconAnchor: [7, 7] });
    window.L.marker([location.latitude, location.longitude], { icon, title: t.city }).addTo(passMap);
    const points = (pass.groundTrack || []).map(point => [point.latitude, point.longitude]);
    if (points.length > 1) { const track = window.L.polyline(points, { color: "#42d5e8", weight: 3, opacity: .9 }).addTo(passMap); passMap.fitBounds(track.getBounds().pad(.28)); }
    else passMap.setView([location.latitude, location.longitude], 6);
    setTimeout(() => passMap?.invalidateSize(), 100);
  }

  function initPass() {
    const button = byId("locatePass");
    if (!button) return;
    passEmpty(t.mapWaiting);
    const render = async position => {
      button.disabled = true;
      setText("passStatus", t.calculating);
      try {
        const result = await getPass(position.coords.latitude, position.coords.longitude);
        const pass = result?.pass;
        setText("passCity", result?.city || t.city);
        if (!pass) { setText("passTime", t.noPass); setText("passDetail", "—"); setText("passPeak", "—"); setText("passDuration", "—"); passEmpty(t.noPass); return; }
        setText("passStatus", result?.city || t.loaded);
        setText("passTime", longDate.format(new Date(pass.start)));
        setText("passDetail", `${t.start}: ${longDate.format(new Date(pass.start))} · ${t.end}: ${longDate.format(new Date(pass.end))}`);
        setText("passPeak", `${Math.round(pass.peakElevation)}°`);
        setText("passDuration", `${Math.max(1, Math.round(Number(pass.durationSeconds || 0) / 60))} min`);
        drawPassMap(result.location, pass);
      } catch (error) {
        console.warn("[Orbital Atlas] ISS pass unavailable", error);
        setText("passStatus", "—"); setText("passTime", t.unavailable); setText("passDetail", ""); setText("passPeak", "—"); setText("passDuration", "—"); passEmpty(t.unavailable);
      } finally { button.disabled = false; button.textContent = t.retry; }
    };
    button.addEventListener("click", () => {
      if (!navigator.geolocation) { setText("passTime", t.denied); passEmpty(t.denied); return; }
      button.disabled = true; setText("passStatus", t.locating);
      navigator.geolocation.getCurrentPosition(render, () => { button.disabled = false; setText("passTime", t.denied); setText("passDetail", ""); passEmpty(t.denied); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
    });
  }

  const profiles = [
    { name: "Jessica Meir", agency: "NASA", image: "/assets/images/orbital-crew/jessica-meir.webp", profile: "https://www.nasa.gov/humans-in-space/astronauts/jessica-u-meir/", mission: "Crew-12" },
    { name: "Jack Hathaway", agency: "NASA", image: "/assets/images/orbital-crew/jack-hathaway.webp", profile: "https://www.nasa.gov/humans-in-space/astronauts/", mission: "Crew-12" },
    { name: "Sophie Adenot", agency: "ESA", image: "/assets/images/orbital-crew/sophie-adenot.webp", profile: "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Astronauts/Sophie_Adenot", mission: "Crew-12" },
    { name: "Andrey Fedyaev", agency: "Roscosmos", image: "/assets/images/orbital-crew/andrey-fedyaev.webp", profile: "https://www.gctc.ru/main.php?id=1716", mission: "Crew-12" },
    { name: "Pyotr Dubrov", agency: "Roscosmos", image: "/assets/images/orbital-crew/pyotr-dubrov.jpg", profile: "https://www.gctc.ru/main.php?id=1704", mission: "Soyuz MS-29" },
    { name: "Anna Kikina", agency: "Roscosmos", image: "/assets/images/orbital-crew/anna-kikina.webp", profile: "https://www.gctc.ru/main.php?id=1710", mission: "Soyuz MS-29" },
    { name: "Anil Menon", agency: "NASA", image: "/assets/images/orbital-crew/anil-menon.webp", profile: "https://www.nasa.gov/people/nasa-astronaut-anil-menon/", mission: "Soyuz MS-29" }
  ];

  function renderCrew(crew) {
    const root = byId("crewGrid");
    const roster = byId("crewRoster");
    if (!root) return;
    const liveNames = new Set((crew || []).map(member => String(member.name || "").toLocaleLowerCase()));
    root.innerHTML = profiles.map(member => {
      const isLive = liveNames.has(member.name.toLocaleLowerCase());
      const initials = member.name.split(/\s+/).map(part => part[0] || "").join("").slice(0, 2).toUpperCase();
      return `<article class="oa-crew-card"><div class="oa-crew-card__portrait" role="img" aria-label="${escape(member.name)}"><img src="${escape(member.image)}" alt="${escape(member.name)}" loading="lazy"><span class="oa-crew-card__fallback" aria-hidden="true">${escape(initials)}</span></div><div class="oa-crew-card__body"><span class="oa-crew-card__agency">${escape(member.agency)}${isLive ? ` · ${escape(t.now)}` : ""}</span><h3>${escape(member.name)}</h3><p>${escape(member.mission)} · ${escape(isLive ? t.activeCrew : t.source)}</p><a class="oa-profile-link" href="${escape(member.profile)}" target="_blank" rel="noreferrer">${escape(t.officialProfile)}</a></div></article>`;
    }).join("");
    root.querySelectorAll(".oa-crew-card__portrait img").forEach(image => image.addEventListener("error", () => {
      image.parentElement?.classList.add("is-fallback");
      image.remove();
    }, { once: true }));
    if (roster) {
      roster.innerHTML = Array.isArray(crew) && crew.length
        ? crew.map(member => `<span class="is-live">${escape(member.name)} · ${escape(String(member.mission || "").replace(/^ISS\s*-\s*/i, ""))}</span>`).join("")
        : `<span>${escape(t.fallback)}</span>`;
    }
  }

  const planets = {
    ru: { mercury: ["Меркурий", "Ближайшая к Солнцу планета.", "88 дней", "Период обращения", "4 879 км", "Диаметр"], venus: ["Венера", "Плотная атмосфера и вулканические равнины.", "225 дней", "Период обращения", "12 104 км", "Диаметр"], earth: ["Земля", "Наш динамичный дом и опорная точка орбитальных наблюдений.", "365 дней", "Период обращения", "12 742 км", "Диаметр"], mars: ["Марс", "Каньоны, полярные шапки и роботизированные исследователи.", "687 дней", "Период обращения", "6 779 км", "Диаметр"], jupiter: ["Юпитер", "Газовый гигант с мощной магнитосферой.", "11,9 лет", "Период обращения", "139 820 км", "Диаметр"], saturn: ["Сатурн", "Планета с яркой системой колец.", "29,5 лет", "Период обращения", "116 460 км", "Диаметр"], uranus: ["Уран", "Ледяной гигант с экстремальным наклоном оси.", "84 года", "Период обращения", "50 724 км", "Диаметр"], neptune: ["Нептун", "Самая дальняя планета с быстрыми ветрами.", "164,8 лет", "Период обращения", "49 244 км", "Диаметр"] },
    en: { mercury: ["Mercury", "The closest planet to the Sun.", "88 days", "Orbital period", "4,879 km", "Diameter"], venus: ["Venus", "A dense atmosphere above volcanic plains.", "225 days", "Orbital period", "12,104 km", "Diameter"], earth: ["Earth", "Our dynamic home and reference point for orbital observation.", "365 days", "Orbital period", "12,742 km", "Diameter"], mars: ["Mars", "Canyons, polar caps and robotic explorers.", "687 days", "Orbital period", "6,779 km", "Diameter"], jupiter: ["Jupiter", "A gas giant with a powerful magnetosphere.", "11.9 years", "Orbital period", "139,820 km", "Diameter"], saturn: ["Saturn", "A planet with a luminous ring system.", "29.5 years", "Orbital period", "116,460 km", "Diameter"], uranus: ["Uranus", "An ice giant with an extreme axial tilt.", "84 years", "Orbital period", "50,724 km", "Diameter"], neptune: ["Neptune", "The outermost planet with rapid winds.", "164.8 years", "Orbital period", "49,244 km", "Diameter"] },
    tr: { mercury: ["Merkür", "Güneş'e en yakın gezegen.", "88 gün", "Yörünge dönemi", "4.879 km", "Çap"], venus: ["Venüs", "Volkanik düzlüklerin üzerindeki yoğun atmosfer.", "225 gün", "Yörünge dönemi", "12.104 km", "Çap"], earth: ["Dünya", "Dinamik evimiz ve yörünge gözlemleri için referans noktası.", "365 gün", "Yörünge dönemi", "12.742 km", "Çap"], mars: ["Mars", "Kanyonlar, kutup başlıkları ve robotik kâşifler.", "687 gün", "Yörünge dönemi", "6.779 km", "Çap"], jupiter: ["Jüpiter", "Güçlü manyetosfere sahip gaz devi.", "11,9 yıl", "Yörünge dönemi", "139.820 km", "Çap"], saturn: ["Satürn", "Parlak halka sistemiyle gezegen.", "29,5 yıl", "Yörünge dönemi", "116.460 km", "Çap"], uranus: ["Uranüs", "Aşırı eksen eğimine sahip buz devi.", "84 yıl", "Yörünge dönemi", "50.724 km", "Çap"], neptune: ["Neptün", "Hızlı rüzgârlara sahip en uzak gezegen.", "164,8 yıl", "Yörünge dönemi", "49.244 km", "Çap"] }
  };

  const planetIcons = isDev
    ? { sun: "/manus-storage/sun_d727f9a3.png", venus: "/manus-storage/venus_c0383fbe.png", earth: "/manus-storage/earth_a7188212.png", mars: "/manus-storage/mars_8010c496.png", jupiter: "/manus-storage/jupiter_f35041cc.png", saturn: "/manus-storage/saturn_256fe28e.png", uranus: "/manus-storage/uranus_99b0a8c4.png", neptune: "/manus-storage/neptune_8974c7dc.png" }
    : { sun: "/assets/images/orbital-planets/sun.png", venus: "/assets/images/orbital-planets/venus.png", earth: "/assets/images/orbital-planets/earth.png", mars: "/assets/images/orbital-planets/mars.png", jupiter: "/assets/images/orbital-planets/jupiter.png", saturn: "/assets/images/orbital-planets/saturn.png", uranus: "/assets/images/orbital-planets/uranus.png", neptune: "/assets/images/orbital-planets/neptune.png" };
  const planetIconSizes = { venus: 42, earth: 45, mars: 40, jupiter: 79, saturn: 74, uranus: 62, neptune: 58 };

  function initSolar() {
    const model = byId("solarModel");
    if (!model) return;
    const data = planets[locale] || planets.ru;
    const sun = model.querySelector(".oa-sun");
    if (sun) {
      sun.classList.add("oa-sun--icon");
      sun.innerHTML = `<img src="${planetIcons.sun}" alt="" aria-hidden="true">`;
    }
    Object.entries(planetIcons).forEach(([key, src]) => {
      if (key === "sun") return;
      const button = model.querySelector(`[data-planet="${key}"]`);
      if (!button) return;
      button.classList.add("oa-planet--icon");
      button.style.setProperty("--planet-icon-size", `${planetIconSizes[key]}px`);
      button.innerHTML = `<img src="${src}" alt="${data[key]?.[0] || key}" draggable="false">`;
    });
    const setPlanet = key => {
      const current = data[key];
      setText("solarPlanetName", current[0]); setText("solarPlanetDescription", current[1]); setText("solarOrbitValue", current[2]); setText("solarOrbitLabel", current[3]); setText("solarSizeValue", current[4]); setText("solarSizeLabel", current[5]);
      model.querySelectorAll("[data-planet]").forEach(button => button.classList.toggle("is-active", button.dataset.planet === key));
    };
    model.addEventListener("click", event => { const button = event.target.closest("[data-planet]"); if (button) setPlanet(button.dataset.planet); });
    document.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => { model.classList.toggle("oa-solar-model--3d", button.dataset.model === "3d"); document.querySelectorAll("[data-model]").forEach(item => item.classList.toggle("is-active", item === button)); }));
    setPlanet("earth");
  }

  function initIssReference() {
    const reference = issReference[locale] || issReference.ru;
    document.querySelectorAll(".oa-fact").forEach((card, index) => {
      const fact = reference.facts[index];
      if (!fact) return;
      const [label, value, detail] = fact;
      const small = card.querySelector("small"), strong = card.querySelector("strong"), paragraph = card.querySelector("p");
      if (small) small.textContent = label;
      if (strong) strong.textContent = value;
      if (paragraph) paragraph.textContent = detail;
    });
    const note = document.querySelector(".oa-info-note");
    if (note) note.innerHTML = reference.note;
  }

  async function hydrate() {
    try {
      const overview = await getOverview();
      renderLandingLaunch(overview.launches || []);
      renderLaunches(overview.launches || []);
      renderTelemetry(overview.iss);
      renderCrew(overview.crew || []);
    } catch (error) {
      console.warn("[Orbital Atlas] overview unavailable", error);
      renderLandingLaunch([]); renderLaunches([]); renderCrew([]);
      setText("landingMeta", t.fallback);
    }
    updateCountdowns();
  }

  function alignContextNavigation() {
    const navigation = document.querySelector(".oa-contextnav");
    if (!navigation) return;
    const align = () => {
      if (window.innerWidth <= 1080) {
        navigation.style.removeProperty("--oa-context-start");
        return true;
      }
      const logo = document.querySelector(".site-header .main-center-logo");
      if (!logo) return false;
      const left = Math.max(20, Math.round(logo.getBoundingClientRect().left));
      navigation.style.setProperty("--oa-context-start", `${left}px`);
      return true;
    };
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (align() || attempts >= 24) window.clearInterval(retry);
    }, 120);
    align();
    window.addEventListener("resize", align, { passive: true });
  }

  initCameras();
  initPass();
  initSolar();
  initIssReference();
  alignContextNavigation();
  hydrate();
  setInterval(updateCountdowns, 1000);
})();
