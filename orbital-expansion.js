(() => {
  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const apiBase = (window.ORBITAL_ATLAS_API || "https://albaspace-api.nncdecdgc.workers.dev").replace(/\/$/, "");
  const prefix = locale === "en" ? "/eng" : locale === "tr" ? "/tr" : "";
  const copy = {
    ru: {
      todayEyebrow: "ОПЕРАТИВНАЯ СВОДКА", todayTitle: "Сегодня в космосе.", todayLead: "Один проверяемый срез ближайших событий и текущей орбиты.", nextLaunch: "Следующий старт", crew: "На МКС", speed: "Скорость МКС", livePosition: "Текущее положение", updated: "обновлено", unavailable: "Данные временно недоступны.", trackEyebrow: "SGP4 / CURRENT TLE", trackTitle: "История и прогноз орбиты МКС.", trackLead: "Траектория строится из актуальных TLE на 90 минут назад и вперёд. Это навигационная визуализация, не инструмент пилотирования.", past: "−90 МИН", now: "СЕЙЧАС", future: "+90 МИН", trackUnavailable: "Траектория временно недоступна.", timeEyebrow: "SOLAR TIME NAVIGATOR", timeTitle: "Перемещайте время, а не макет.", timeLead: "Относительные положения планет пересчитываются для выбранной даты по упрощённой гелиоцентрической модели; это исследовательская визуализация, а не навигационная эфемерида.", previous: "ДЕНЬ НАЗАД", next: "ДЕНЬ ВПЕРЁД", reset: "СЕЙЧАС", speedLabel: "Темп", pause: "Пауза", slow: "Медленно", fast: "Быстро", planetaryAtlas: "АТЛАСЫ МАРСА И ЛУНЫ ↗", learnEyebrow: "ОБУЧАЮЩИЙ РЕЖИМ", learnTitle: "Исследуйте, а не просто наблюдайте.", learnLead: "Короткие шаги связывают живые данные Atlas с космической навигацией.", learnStart: "НАЧАТЬ ШАГ", learnNext: "СЛЕДУЮЩИЙ ШАГ", learnDone: "ПРОЙДЕНО", learnSteps: [["1. Найдите движение", "Откройте трек МКС и сравните прошлую и будущую части линии."], ["2. Измените время", "На модели Солнечной системы выберите дату и проследите изменение положений."], ["3. Назовите рельеф", "Откройте планетарный атлас и найдите объект по имени в официальном Gazetteer."]]
    },
    en: {
      todayEyebrow: "OPERATIONAL SUMMARY", todayTitle: "Today in space.", todayLead: "One verifiable view of upcoming activity and the current orbit.", nextLaunch: "Next launch", crew: "On the ISS", speed: "ISS speed", livePosition: "Current position", updated: "updated", unavailable: "Data is temporarily unavailable.", trackEyebrow: "SGP4 / CURRENT TLE", trackTitle: "ISS orbit history and forecast.", trackLead: "The ground track is propagated from current TLEs for 90 minutes back and forward. It is a navigation visualisation, not a flight-planning tool.", past: "−90 MIN", now: "NOW", future: "+90 MIN", trackUnavailable: "The ground track is temporarily unavailable.", timeEyebrow: "SOLAR TIME NAVIGATOR", timeTitle: "Move time, not the layout.", timeLead: "Relative planet positions update for the selected date using a simplified heliocentric model; this is an exploration visualisation, not a navigation ephemeris.", previous: "DAY BACK", next: "DAY FORWARD", reset: "NOW", speedLabel: "Pace", pause: "Pause", slow: "Slow", fast: "Fast", planetaryAtlas: "MARS & MOON ATLASES ↗", learnEyebrow: "LEARNING MODE", learnTitle: "Explore, don’t only observe.", learnLead: "Short steps connect live Atlas data with space navigation.", learnStart: "START STEP", learnNext: "NEXT STEP", learnDone: "COMPLETED", learnSteps: [["1. Find the motion", "Open the ISS track and compare the past and future portions of the line."], ["2. Change time", "Choose a date in the Solar System model and follow the changing positions."], ["3. Name the terrain", "Open the planetary atlas and find a feature by name in the official Gazetteer."]]
    },
    tr: {
      todayEyebrow: "OPERASYON ÖZETİ", todayTitle: "Bugün uzayda.", todayLead: "Yaklaşan etkinlikler ve güncel yörüngenin doğrulanabilir tek görünümü.", nextLaunch: "Sıradaki fırlatma", crew: "ISS'te", speed: "ISS hızı", livePosition: "Güncel konum", updated: "güncellendi", unavailable: "Veriler geçici olarak kullanılamıyor.", trackEyebrow: "SGP4 / GÜNCEL TLE", trackTitle: "ISS yörünge geçmişi ve öngörüsü.", trackLead: "Yer izi, güncel TLE'lerden 90 dakika geriye ve ileriye yayılır. Uçuş planlama aracı değil, navigasyon görselleştirmesidir.", past: "−90 DK", now: "ŞİMDİ", future: "+90 DK", trackUnavailable: "Yörünge izi geçici olarak kullanılamıyor.", timeEyebrow: "SOLAR TIME NAVIGATOR", timeTitle: "Yerleşimi değil zamanı taşıyın.", timeLead: "Göreli gezegen konumları seçilen tarih için basitleştirilmiş helyosentrik modele göre güncellenir; bu bir keşif görselleştirmesidir, navigasyon efemerisi değildir.", previous: "ÖNCEKİ GÜN", next: "SONRAKİ GÜN", reset: "ŞİMDİ", speedLabel: "Hız", pause: "Duraklat", slow: "Yavaş", fast: "Hızlı", planetaryAtlas: "MARS VE AY ATLASLARI ↗", learnEyebrow: "ÖĞRENME MODU", learnTitle: "Yalnızca izlemeyin, keşfedin.", learnLead: "Kısa adımlar canlı Atlas verilerini uzay navigasyonuyla bağlar.", learnStart: "ADIMI BAŞLAT", learnNext: "SONRAKİ ADIM", learnDone: "TAMAMLANDI", learnSteps: [["1. Hareketi bulun", "ISS izini açın; çizginin geçmiş ve gelecek bölümlerini karşılaştırın."], ["2. Zamanı değiştirin", "Güneş Sistemi modelinde tarih seçin ve konumların değişimini izleyin."], ["3. Araziyi adlandırın", "Gezegensel atlası açın ve resmi Gazetteer'de isme göre bir nesne bulun."]]
    }
  };
  const t = copy[locale] || copy.ru;
  const create = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const formatDate = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : locale === "tr" ? "tr-TR" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  function createToday() {
    if (!location.pathname.endsWith("orbital-atlas.html") || document.getElementById("orbitalToday")) return;
    const hero = document.querySelector(".oa-hero"); if (!hero) return;
    const section = create("section", "oa-section oa-today", ""); section.id = "orbitalToday";
    section.innerHTML = `<div class="oa-shell"><div class="oa-section-head"><div><p class="oa-eyebrow">${t.todayEyebrow}</p><h2 class="oa-section-title">${t.todayTitle}</h2></div><p class="oa-section-note">${t.todayLead}</p></div><div class="oa-today-grid" aria-live="polite"><article><small>${t.nextLaunch}</small><strong id="todayLaunch">—</strong><p id="todayLaunchMeta">${t.updated}: —</p></article><article><small>${t.crew}</small><strong id="todayCrew">—</strong><p id="todayCrewMeta">${t.updated}: —</p></article><article><small>${t.speed}</small><strong id="todaySpeed">—</strong><p id="todaySpeedMeta">${t.updated}: —</p></article><article><small>${t.livePosition}</small><strong id="todayPosition">—</strong><p id="todayPositionMeta">${t.updated}: —</p></article></div></div>`;
    hero.insertAdjacentElement("afterend", section);
    fetch(`${apiBase}/api/orbital/overview`, { headers: { Accept: "application/json" } }).then(r => r.json()).then(data => {
      const launch = (data.launches || []).find(item => item?.net && Date.parse(item.net) > Date.now()) || data.launches?.[0];
      const iss = data.iss;
      document.getElementById("todayLaunch").textContent = launch?.name || "—";
      document.getElementById("todayLaunchMeta").textContent = launch?.net ? formatDate.format(new Date(launch.net)) : t.unavailable;
      document.getElementById("todayCrew").textContent = String(data.crew?.length ?? "—");
      document.getElementById("todayCrewMeta").textContent = data.missions?.map(m => m.name || m.mission).filter(Boolean).slice(0, 2).join(" · ") || t.updated;
      document.getElementById("todaySpeed").textContent = Number.isFinite(iss?.velocity) ? `${Math.round(iss.velocity).toLocaleString(locale)} km/h` : "—";
      document.getElementById("todaySpeedMeta").textContent = data.updatedAt ? `${t.updated}: ${formatDate.format(new Date(data.updatedAt))}` : t.updated;
      document.getElementById("todayPosition").textContent = Number.isFinite(iss?.latitude) ? `${iss.latitude.toFixed(1)}° · ${iss.longitude.toFixed(1)}°` : "—";
      document.getElementById("todayPositionMeta").textContent = iss?.altitude ? `${Math.round(iss.altitude)} km` : t.unavailable;
    }).catch(() => section.querySelectorAll("strong").forEach(node => { node.textContent = "—"; }));
  }

  function createIssTrack() {
    if (!location.pathname.endsWith("orbital-iss.html") || document.getElementById("issGroundTrack")) return;
    const main = document.querySelector("main"); if (!main) return;
    const section = create("section", "oa-section oa-iss-track", ""); section.id = "issGroundTrack";
    section.innerHTML = `<div class="oa-shell"><div class="oa-section-head"><div><p class="oa-eyebrow">${t.trackEyebrow}</p><h2 class="oa-section-title">${t.trackTitle}</h2></div><p class="oa-section-note">${t.trackLead}</p></div><div class="oa-track-card"><div class="oa-track-labels"><span>${t.past}</span><strong>${t.now}</strong><span>${t.future}</span></div><svg id="issTrackSvg" class="oa-track-svg" viewBox="0 0 360 180" role="img" aria-label="ISS ground track"><path class="oa-track-grid" d="M0 45H360M0 90H360M0 135H360M90 0V180M180 0V180M270 0V180"/></svg><p id="issTrackStatus" class="oa-track-status">${t.updated}: —</p></div></div>`;
    main.append(section);
    fetch(`${apiBase}/api/orbital/iss-track?window=90&step=60`, { headers: { Accept: "application/json" } }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => {
      const svg = document.getElementById("issTrackSvg");
      const batches = []; let current = [];
      for (const point of data.points || []) {
        const x = ((Number(point.longitude) + 180) / 360) * 360; const y = ((90 - Number(point.latitude)) / 180) * 180;
        if (current.length && Math.abs(x - current[current.length - 1][0]) > 180) { batches.push(current); current = []; }
        current.push([x, y]);
      }
      if (current.length) batches.push(current);
      for (const batch of batches) { const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("class", "oa-track-line"); path.setAttribute("d", `M${batch.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`); svg.append(path); }
      const nowPoint = (data.points || []).reduce((best, point) => !best || Math.abs(Date.parse(point.time) - Date.now()) < Math.abs(Date.parse(best.time) - Date.now()) ? point : best, null);
      if (nowPoint) { const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle"); marker.setAttribute("class", "oa-track-now"); marker.setAttribute("cx", String(((nowPoint.longitude + 180) / 360) * 360)); marker.setAttribute("cy", String(((90 - nowPoint.latitude) / 180) * 180)); marker.setAttribute("r", "3.5"); svg.append(marker); }
      document.getElementById("issTrackStatus").textContent = `${t.updated}: ${formatDate.format(new Date(data.updatedAt))}`;
    }).catch(() => { document.getElementById("issTrackStatus").textContent = t.trackUnavailable; });
  }

  function createSolarNavigator() {
    const model = document.getElementById("solarModel"); if (!model || document.getElementById("solarTimeNavigator")) return;
    const wrap = model.closest(".oa-solar-wrap"); if (!wrap) return;
    const section = create("section", "oa-time-nav", ""); section.id = "solarTimeNavigator";
    section.innerHTML = `<p class="oa-eyebrow">${t.timeEyebrow}</p><h3>${t.timeTitle}</h3><p>${t.timeLead}</p><div class="oa-time-nav__controls"><button type="button" data-time="-1">${t.previous}</button><input type="date" aria-label="Date"><button type="button" data-time="1">${t.next}</button><button type="button" data-time="0">${t.reset}</button></div><div class="oa-time-nav__footer"><label>${t.speedLabel}<select aria-label="${t.speedLabel}"><option value="0">${t.pause}</option><option value="1">${t.slow}</option><option value="7">${t.fast}</option></select></label><a href="${prefix}/orbital-worlds.html">${t.planetaryAtlas}</a></div>`;
    wrap.insertAdjacentElement("afterend", section);
    const input = section.querySelector("input"); const pace = section.querySelector("select");
    const epochs = { mercury: 87.969, venus: 224.701, earth: 365.256, mars: 686.98, jupiter: 4332.59, saturn: 10759.22, uranus: 30688.5, neptune: 60182 }; const radii = { mercury: 8, venus: 14, earth: 21, mars: 28, jupiter: 36, saturn: 43, uranus: 48, neptune: 52 };
    const apply = () => { const date = new Date(`${input.value}T12:00:00Z`); const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000; Object.entries(epochs).forEach(([key, period], index) => { const body = model.querySelector(`[data-planet="${key}"]`); if (!body) return; const angle = (days / period) * Math.PI * 2 + index * 0.72; const radius = radii[key]; body.style.setProperty("--left", `${50 + Math.cos(angle) * radius}%`); body.style.setProperty("--top", `${50 + Math.sin(angle) * radius}%`); }); };
    input.value = new Date().toISOString().slice(0, 10); apply(); input.addEventListener("input", apply);
    section.querySelectorAll("[data-time]").forEach(button => button.addEventListener("click", () => { const step = Number(button.dataset.time); const date = step ? new Date(`${input.value}T12:00:00Z`) : new Date(); if (step) date.setUTCDate(date.getUTCDate() + step); input.value = date.toISOString().slice(0, 10); apply(); }));
    let frame = 0; let previous = 0; const animate = now => { const rate = Number(pace.value); if (rate && previous && now - previous > 450) { const date = new Date(`${input.value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + rate); input.value = date.toISOString().slice(0, 10); apply(); previous = now; } else if (!previous) previous = now; frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate); window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
  }

  function createLearningMode() {
    if (!location.pathname.endsWith("orbital-atlas.html") || document.getElementById("orbitalLearning")) return;
    const today = document.getElementById("orbitalToday"); if (!today) return;
    const section = create("section", "oa-section oa-learning", ""); section.id = "orbitalLearning";
    section.innerHTML = `<div class="oa-shell"><div class="oa-section-head"><div><p class="oa-eyebrow">${t.learnEyebrow}</p><h2 class="oa-section-title">${t.learnTitle}</h2></div><p class="oa-section-note">${t.learnLead}</p></div><div class="oa-learning-grid"></div></div>`;
    today.insertAdjacentElement("afterend", section); const grid = section.querySelector(".oa-learning-grid");
    t.learnSteps.forEach(([title, body], index) => { const card = create("article", "oa-learning-card"); card.innerHTML = `<span>0${index + 1}</span><h3>${title}</h3><p>${body}</p><button type="button">${t.learnStart}</button>`; const button = card.querySelector("button"); button.addEventListener("click", () => { const complete = card.classList.toggle("is-complete"); button.textContent = complete ? t.learnDone : index === t.learnSteps.length - 1 ? t.learnStart : t.learnNext; }); grid.append(card); });
  }

  createToday(); createIssTrack(); createSolarNavigator(); createLearningMode();
})();
