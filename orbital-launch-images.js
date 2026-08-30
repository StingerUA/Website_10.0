(() => {
  "use strict";

  const liveGrid = document.getElementById("launchGrid");
  const libraryGrid = document.getElementById("ocLaunchLibrary");
  if (!liveGrid || !libraryGrid) return;

  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const copy = {
    ru: { source: "Фото запуска", library: "Launch Library 2", unavailable: "Изображение запуска пока недоступно" },
    en: { source: "Launch photo", library: "Launch Library 2", unavailable: "Launch image is not available yet" },
    tr: { source: "Fırlatma görseli", library: "Launch Library 2", unavailable: "Fırlatma görseli henüz kullanılamıyor" },
    ar: { source: "صورة الإطلاق", library: "Launch Library 2", unavailable: "صورة الإطلاق غير متاحة بعد" }
  };
  const t = copy[locale] || copy.ru;

  if (!document.getElementById("orbital-library-launch-image-style")) {
    const style = document.createElement("style");
    style.id = "orbital-library-launch-image-style";
    style.textContent = `
      .oa-launch__vehicle-stage.has-library-launch-photo {
        overflow: hidden;
        background: #020617;
      }
      .oa-launch__vehicle-stage.has-library-launch-photo > svg {
        opacity: 0 !important;
      }
      .oa-launch__library-photo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        z-index: 2;
        border-radius: inherit;
      }
      .oa-launch__library-credit {
        display: block;
        margin-top: 5px;
        color: #94a3b8;
        font-size: 9px;
        line-height: 1.35;
      }
      .oa-launch__library-credit a { color: #63dbe7; }
    `;
    document.head.append(style);
  }

  const normalize = value => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”„‟'\"`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = value => normalize(value)
    .split(" ")
    .filter(word => word.length >= 3 && !new Set(["the", "and", "for", "mission", "launch", "rocket", "space"]).has(word));

  function extractVehicle(figure) {
    const caption = figure?.querySelector("figcaption");
    if (!caption) return "";
    const clone = caption.cloneNode(true);
    clone.querySelectorAll("strong,.oa-launch__profile-credit,.oa-launch__reference,.oa-launch__rocket-credit,.oa-launch__library-credit").forEach(node => node.remove());
    return (clone.textContent || "").replace(/^[\s:·–—-]+|[\s:·–—-]+$/g, "").trim();
  }

  function liveCardData(card) {
    const figure = card.querySelector(".oa-launch__vehicle");
    const paragraphs = [...card.querySelectorAll(":scope > p")];
    return {
      card,
      figure,
      mission: card.querySelector("h3")?.textContent?.trim() || "",
      provider: paragraphs.find(p => !p.classList.contains("oa-launch__place") && !p.classList.contains("oa-launch__source"))?.textContent?.trim() || "",
      vehicle: extractVehicle(figure),
      net: card.querySelector("[data-countdown]")?.dataset?.countdown || ""
    };
  }

  function libraryCandidates() {
    return [...libraryGrid.querySelectorAll(".oc-launch-card")].map(card => {
      const facts = [...card.querySelectorAll(".oc-mini-facts dd")];
      const image = card.querySelector(".oc-card__media img");
      const launchLink = card.querySelector('a[href*="orbital-launch.html?id="]');
      return {
        card,
        title: card.querySelector("h3")?.textContent?.trim() || "",
        rocket: facts[0]?.textContent?.trim() || "",
        provider: facts[1]?.textContent?.trim() || "",
        image: image?.currentSrc || image?.src || "",
        href: launchLink?.getAttribute("href") || ""
      };
    }).filter(item => item.image);
  }

  function scoreMatch(live, candidate) {
    let score = 0;
    const vehicle = normalize(live.vehicle);
    const rocket = normalize(candidate.rocket);
    const mission = normalize(live.mission);
    const title = normalize(candidate.title);
    const provider = normalize(live.provider);
    const candidateProvider = normalize(candidate.provider);

    if (vehicle && rocket) {
      if (vehicle === rocket) score += 100;
      else if (rocket.includes(vehicle) || vehicle.includes(rocket)) score += 80;
      else {
        const vehicleTokens = words(vehicle);
        const rocketTokens = words(rocket);
        const overlap = vehicleTokens.filter(token => rocketTokens.includes(token)).length;
        score += overlap * 18;
      }
    }

    if (mission && title) {
      if (title.includes(mission)) score += 75;
      const missionTokens = words(mission);
      const hits = missionTokens.filter(token => title.includes(token)).length;
      score += hits * 12;
      if (missionTokens.length && hits === missionTokens.length) score += 35;
    }

    if (provider && candidateProvider && (provider.includes(candidateProvider) || candidateProvider.includes(provider))) score += 22;
    return score;
  }

  function bestCandidate(live, candidates) {
    let best = null;
    let bestScore = -1;
    for (const candidate of candidates) {
      const score = scoreMatch(live, candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    return bestScore >= 70 ? best : null;
  }

  function applyImage(live, candidate) {
    const figure = live.figure;
    const stage = figure?.querySelector(".oa-launch__vehicle-stage");
    const caption = figure?.querySelector("figcaption");
    if (!figure || !stage || !caption || !candidate?.image) return;
    if (figure.dataset.libraryPhoto === candidate.image) return;

    stage.querySelectorAll("img.oa-launch__vehicle-photo,img.oa-launch__rocket-photo,img.oa-launch__library-photo,.oa-launch__rocket-state").forEach(node => node.remove());
    caption.querySelectorAll(".oa-launch__profile-credit,.oa-launch__reference,.oa-launch__rocket-credit,.oa-launch__library-credit").forEach(node => node.remove());

    const image = document.createElement("img");
    image.className = "oa-launch__library-photo";
    image.src = candidate.image;
    image.alt = `${live.vehicle || live.mission} launch`;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("load", () => stage.classList.add("has-library-launch-photo"), { once: true });
    image.addEventListener("error", () => {
      image.remove();
      stage.classList.remove("has-library-launch-photo");
      figure.dataset.libraryPhoto = "";
    }, { once: true });
    stage.prepend(image);

    const credit = document.createElement("span");
    credit.className = "oa-launch__library-credit";
    credit.append(`${t.source}: ${t.library}`);
    if (candidate.href) {
      credit.append(" · ");
      const link = document.createElement("a");
      link.href = candidate.href;
      link.textContent = locale === "tr" ? "Görevi aç →" : locale === "en" ? "Open mission →" : "Открыть миссию →";
      credit.append(link);
    }
    caption.append(credit);
    figure.dataset.libraryPhoto = candidate.image;
  }

  function sync() {
    const candidates = libraryCandidates();
    if (!candidates.length) return;
    liveGrid.querySelectorAll(".oa-launch").forEach(card => {
      const live = liveCardData(card);
      const candidate = bestCandidate(live, candidates);
      if (candidate) applyImage(live, candidate);
    });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(sync));
  observer.observe(libraryGrid, { childList: true, subtree: true });
  observer.observe(liveGrid, { childList: true, subtree: true });
  sync();
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
})();
