(function () {
  const content = {
    en: {
      nav: ["Orbit", "Launches", "Missions", "Live", "Planet maps"],
      heroEyebrow: "<span class=\"pulse\"></span>Live space observatory",
      heroTitle: "Space<br />in <em>motion.</em>",
      heroLead: "One live interface for launches, satellites, the International Space Station and planetary maps. Track trajectories, check telemetry and follow official broadcasts at the moment of launch.",
      heroActions: ["Open orbit", "Upcoming launches"], metric: ["Next mission", "Retrieving schedule", "The live launch catalogue will appear here.", "to launch window"],
      orbit: ["01 / Live trajectory", "Earth orbit<br />in real time.", "The scene shows the ISS position at the moment of the latest API response. Orbital objects are an orientation layer, not a complete debris catalogue."],
      orbitPanel: ["Low Earth orbit", "ISS · Hubble · Sentinel · TÜRKSAT · Starlink", "Curated catalogue", "Reference objects in the scene", "crewed orbit", "space telescope", "geostationary communications"],
      launches: ["02 / Launch cadence", "Upcoming<br />launch windows.", "Schedule data is refreshed from Launch Library 2 and cached locally to respect the public source limit."],
      live: ["03 / Watch official", "Live coverage<br />without the noise.", "The embedded stream is NASA's official channel. Availability of station imagery depends on the current link and broadcast programme.", "Watch NASA TV", "Open NASA's official channel for full-screen viewing and broadcast chat.", "Open official stream ↗", "SpaceX and ISS", "A mission card displays an available feed on launch day. Use NASA's official stream for station cameras.", "Open SpaceX Live ↗"],
      atlas: ["04 / Planetary surfaces", "Maps worth<br />exploring.", "Start with Venus, focused on craters, coronae and volcanoes. Switch the planet to change the surface and scientific layers.", "Choose a surface", "Venus", "Mars", "Earth"],
      crew: ["Station watch / live registry", "Crew in orbit", "Loading the current ISS crew…"],
      iss: ["International Space Station", "Crewed research outpost in low Earth orbit. Follow position, altitude and velocity from live telemetry.", "latitude", "longitude", "altitude", "speed", "day / night"],
      footer: ["Operational section for observing space activity.", "Sources: <a href=\"https://thespacedevs.com/llapi\" target=\"_blank\" rel=\"noreferrer\">Launch Library 2</a> — launch schedule; <a href=\"https://wheretheiss.at/w/developer\" target=\"_blank\" rel=\"noreferrer\">Where The ISS At?</a> — ISS position; <a href=\"https://whoisinspace.com/\" target=\"_blank\" rel=\"noreferrer\">Who Is In Space</a> — open ISS crew registry; <a href=\"https://celestrak.org/\" target=\"_blank\" rel=\"noreferrer\">CelesTrak</a> — orbital elements. The ISS view is for orientation only, not navigation."],
    },
    tr: {
      nav: ["Yörünge", "Fırlatmalar", "Görevler", "Yayınlar", "Gezegen haritaları"],
      heroEyebrow: "<span class=\"pulse\"></span>Canlı uzay gözlemevi",
      heroTitle: "Uzay<br /><em>hareket hâlinde.</em>",
      heroLead: "Fırlatmalar, uydular, Uluslararası Uzay İstasyonu ve gezegen haritaları için tek canlı arayüz. Yörüngeleri izleyin, telemetriyi kontrol edin ve fırlatma anında resmî yayınlara geçin.",
      heroActions: ["Yörüngeyi aç", "Yaklaşan fırlatmalar"], metric: ["Sıradaki görev", "Takvim alınıyor", "Canlı fırlatma kataloğu burada görünecek.", "fırlatma penceresine"],
      orbit: ["01 / Canlı yörünge", "Dünya yörüngesi<br />gerçek zamanlı.", "Sahne, en son API yanıtındaki ISS konumunu gösterir. Yörünge nesneleri tam bir enkaz kataloğu değil, yön bulma katmanıdır."],
      orbitPanel: ["Alçak Dünya yörüngesi", "ISS · Hubble · Sentinel · TÜRKSAT · Starlink", "Küratörlü katalog", "Sahnedeki referans nesneler", "insanlı yörünge", "uzay teleskobu", "jeostatik iletişim"],
      launches: ["02 / Fırlatma ritmi", "Yaklaşan<br />fırlatma pencereleri.", "Takvim Launch Library 2 üzerinden yenilenir ve açık kaynak sınırına saygı için yerelde önbelleğe alınır."],
      live: ["03 / Resmî yayını izle", "Gürültüsüz<br />canlı yayın.", "Gömülü yayın NASA'nın resmî kanalıdır. İstasyon görüntüsünün kullanılabilirliği bağlantı ve yayın akışına bağlıdır.", "NASA TV izle", "Tam ekran görüntüleme ve yayın sohbeti için NASA'nın resmî kanalına gidin.", "Resmî yayını aç ↗", "SpaceX ve ISS", "Fırlatma gününde görev kartında kullanılabilir yayın görünür. İstasyon kameraları için NASA'nın resmî yayınını kullanın.", "SpaceX Live aç ↗"],
      atlas: ["04 / Gezegen yüzeyleri", "Keşfetmek isteyeceğiniz<br />haritalar.", "İlk ekran, kraterlere, koronalara ve volkanlara odaklanan Venüs'tür. Yüzeyi ve bilimsel katmanları değiştirmek için gezegeni seçin.", "Bir yüzey seçin", "Venüs", "Mars", "Dünya"],
      crew: ["İstasyon takibi / canlı kayıt", "Yörüngedeki mürettebat", "Güncel ISS mürettebatı yükleniyor…"],
      iss: ["Uluslararası Uzay İstasyonu", "Alçak Dünya yörüngesindeki insanlı araştırma üssü. Konumu, yüksekliği ve hızı canlı telemetriden takip edin.", "enlem", "boylam", "irtifa", "hız", "gündüz / gece"],
      footer: ["Uzay faaliyetlerini gözlemlemek için operasyonel bölüm.", "Kaynaklar: <a href=\"https://thespacedevs.com/llapi\" target=\"_blank\" rel=\"noreferrer\">Launch Library 2</a> — fırlatma takvimi; <a href=\"https://wheretheiss.at/w/developer\" target=\"_blank\" rel=\"noreferrer\">Where The ISS At?</a> — ISS konumu; <a href=\"https://whoisinspace.com/\" target=\"_blank\" rel=\"noreferrer\">Who Is In Space</a> — açık ISS mürettebat kaydı; <a href=\"https://celestrak.org/\" target=\"_blank\" rel=\"noreferrer\">CelesTrak</a> — yörünge elemanları. ISS görünümü yalnızca yön bulma içindir; navigasyon amaçlı değildir."],
    }
  };
  const planets = {
    en: {
      venus: { title:"Venus", description:"A radar surface of craters, volcanic plains and coronae — from overview to close scientific study.", features:[["Craters","Compare the form and density of impact traces across different surface regions."],["Coronae","Identify large ring structures and open scientific object cards."],["Volcanoes","Enable a thematic layer to read the landscape as a map of processes."]] },
      mars: { title:"Mars", description:"An orbital view of the red planet: cratered plateaus, dark volcanic regions and the lines of ancient channels.", features:[["Valleys","Explore long canyon systems and traces of erosion."],["Landing zones","Connect surface locations with real missions and rovers."],["Minerals","Collect composition layers to read the landscape's history."]] },
      earth: { title:"Earth", description:"The planet around which most active human spaceflight and satellite activity currently happens.", features:[["Orbits","Compare altitudes, inclinations and classes of space objects."],["Stations","Follow the ISS and future stations through telemetry."],["Launches","Move from a launch pad to an object in orbit."]] }
    },
    tr: {
      venus: { title:"Venüs", description:"Kraterler, volkanik düzlükler ve koronalarla dolu radar yüzeyi; genel bakıştan ayrıntılı bilimsel incelemeye.", features:[["Kraterler","Farklı yüzey bölgelerindeki çarpma izlerinin biçimini ve yoğunluğunu karşılaştırın."],["Koronalar","Büyük halka yapıları işaretleyin ve bilimsel nesne kartlarını açın."],["Volkanlar","Peyzajı süreç haritası olarak okumak için tematik katmanı açın."]] },
      mars: { title:"Mars", description:"Kızıl gezegenin yörüngeden görünümü: kraterli platolar, koyu volkanik alanlar ve eski kanalların izleri.", features:[["Vadiler","Uzun kanyon sistemlerini ve erozyon izlerini inceleyin."],["İniş alanları","Yüzey konumlarını gerçek görevler ve gezginlerle ilişkilendirin."],["Mineraller","Peyzaj tarihini okumak için bileşim katmanlarını toplayın."]] },
      earth: { title:"Dünya", description:"Bugün aktif insanlı uzay uçuşlarının ve uydu faaliyetlerinin çoğunun çevresinde gerçekleştiği gezegen.", features:[["Yörüngeler","Yükseklikleri, eğimleri ve uzay nesnesi sınıflarını karşılaştırın."],["İstasyonlar","Telemetriyle ISS'i ve gelecekteki istasyonları izleyin."],["Fırlatmalar","Bir fırlatma rampasından yörüngedeki nesneye geçin."]] }
    }
  };
  const dynamic = {
    ru: { statusPending:"Статус уточняется", statusSuccess:"успешно", statusChanged:"изменено", operator:"Оператор уточняется", location:"Площадка уточняется", mission:"Миссия уточняется", date:"дата уточняется", visibility:"связь", iss:"МКС", missionRecord:"Открытая карточка миссии", day:"д", hour:"ч", minute:"м" },
    en: { statusPending:"Status pending", statusSuccess:"successful", statusChanged:"updated", operator:"Operator pending", location:"Launch site pending", mission:"Mission pending", date:"date pending", visibility:"link", iss:"ISS", missionRecord:"Open mission record", day:"d", hour:"h", minute:"m" },
    tr: { statusPending:"Durum bekleniyor", statusSuccess:"başarılı", statusChanged:"güncellendi", operator:"Operatör bekleniyor", location:"Fırlatma noktası bekleniyor", mission:"Görev bekleniyor", date:"tarih bekleniyor", visibility:"bağlantı", iss:"ISS", missionRecord:"Açık görev kaydı", day:"g", hour:"s", minute:"dk" }
  };
  function set(selector, value, html) { const node = document.querySelector(selector); if (node) { if (html) node.innerHTML = value; else node.textContent = value; } }
  function setAll(selector, values) { document.querySelectorAll(selector).forEach((node, index) => { if (values[index] != null) node.textContent = values[index]; }); }
  function apply(locale) {
    const t = content[locale];
    if (!t) return;
    setAll(".nav a", t.nav);
    set(".hero .eyebrow", t.heroEyebrow, true); set(".hero h1", t.heroTitle, true); set(".hero-lead", t.heroLead);
    setAll(".hero-actions a", t.heroActions); const metricTop = document.querySelectorAll(".metric-top span"); if (metricTop[0]) metricTop[0].textContent = t.metric[0]; if (metricTop[1]) metricTop[1].textContent = t.metric[1]; set(".metric-title", t.metric[1]); set(".metric-meta", t.metric[2]); set(".metric-count span", t.metric[3]);
    const heads = document.querySelectorAll(".section-head");
    [[0,t.orbit],[1,t.launches],[2,t.live],[3,t.atlas]].forEach(([index, values]) => { const head = heads[index]; if (!head) return; const eyebrow = head.querySelector(".eyebrow"), title = head.querySelector("h2"), note = head.querySelector(".section-note"); if (eyebrow) eyebrow.textContent = values[0]; if (title) title.innerHTML = values[1]; if (note) note.textContent = values[2]; });
    set(".panel-title", t.orbitPanel[0]); set(".panel-sub", t.orbitPanel[1]); set(".object-list h3", t.orbitPanel[2]); set(".object-list > p", t.orbitPanel[3]);
    setAll(".object small", t.orbitPanel.slice(4));
    set(".stream-card:first-child h3", t.live[3]); set(".stream-card:first-child p", t.live[4]); set(".stream-card:first-child a", t.live[5]); set(".stream-card:last-child h3", t.live[6]); set(".stream-card:last-child p", t.live[7]); set(".stream-card:last-child a", t.live[8]);
    set(".atlas-side > .eyebrow", t.atlas[3]); setAll(".planet-tab", t.atlas.slice(4)); set(".crew-intro > .eyebrow", t.crew[0]); set(".crew-intro h3", t.crew[1]); set("#crewList", `<div class=\"crew-empty\">${t.crew[2]}</div>`, true); set("#missionBoard", `<article class=\"mission-card\"><div class=\"mission-top\"><span>ISS</span><span class=\"mission-state\">—</span></div><h3>${t.metric[1]}</h3></article>`, true);
    set(".iss-name", t.iss[0]); set(".iss-desc", t.iss[1]); setAll(".telemetry small", t.iss.slice(2, 6)); set(".mini-row span:first-child", t.iss[6]);
    set("footer > div > p", t.footer[0]); set("footer .sources", t.footer[1], true);
  }
  window.orbitalAtlasI18n = { apply, planets, dynamic };
})();
