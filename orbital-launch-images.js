(() => {
  const grid = document.getElementById("launchGrid");
  if (!grid) return;

  const workerBase = (window.ORBITAL_ATLAS_API || "https://albaspace-api.nncdecdgc.workers.dev").replace(/\/$/, "");
  const locale = (document.documentElement.lang || "ru").slice(0, 2).toLowerCase();
  const copy = {
    ru: { loading: "Ищем фото ракеты…", source: "Фото ракеты", unavailable: "Фото ракеты не найдено" },
    en: { loading: "Finding rocket photo…", source: "Rocket photo", unavailable: "Rocket photo unavailable" },
    tr: { loading: "Roket fotoğrafı aranıyor…", source: "Roket fotoğrafı", unavailable: "Roket fotoğrafı bulunamadı" }
  };
  const t = copy[locale] || copy.ru;

  if (!document.getElementById("orbital-rocket-image-style")) {
    const style = document.createElement("style");
    style.id = "orbital-rocket-image-style";
    style.textContent = `
      .oa-launch__vehicle-stage.has-open-rocket-photo {
        background: radial-gradient(circle at 50% 42%, rgba(48, 80, 99, .28), rgba(3, 9, 15, .94) 70%);
      }
      .oa-launch__vehicle-stage.has-open-rocket-photo > svg { opacity: 0 !important; }
      .oa-launch__rocket-photo {
        position: absolute;
        inset: 8px 10px 8px;
        width: calc(100% - 20px);
        height: calc(100% - 16px);
        object-fit: contain;
        object-position: center bottom;
        border-radius: 10px;
        z-index: 2;
        filter: drop-shadow(0 12px 18px rgba(0,0,0,.42));
      }
      .oa-launch__rocket-state {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 9px;
        z-index: 3;
        padding: 5px 7px;
        border-radius: 7px;
        background: rgba(2,8,14,.72);
        color: #78909b;
        font: 600 9px/1.25 "IBM Plex Mono", monospace;
        text-align: center;
        letter-spacing: .06em;
        text-transform: uppercase;
        pointer-events: none;
      }
      .oa-launch__vehicle-stage.has-open-rocket-photo .oa-launch__rocket-state { display:none; }
      .oa-launch__rocket-credit {
        display: block;
        margin-top: 5px;
        color: #6f8793;
        font-size: 9px;
        line-height: 1.35;
      }
      .oa-launch__rocket-credit a { color: #63dbe7; }
    `;
    document.head.append(style);
  }

  function extractVehicle(figure) {
    const caption = figure.querySelector("figcaption");
    if (!caption) return "";
    const clone = caption.cloneNode(true);
    clone.querySelectorAll("strong,.oa-launch__profile-credit,.oa-launch__reference,.oa-launch__rocket-credit").forEach(node => node.remove());
    return (clone.textContent || "").replace(/^[\s:·–—-]+|[\s:·–—-]+$/g, "").trim();
  }

  function safeLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch { return ""; }
  }

  async function enhance(figure) {
    if (figure.dataset.rocketPhotoState) return;
    const vehicle = extractVehicle(figure);
    if (!vehicle) return;
    figure.dataset.rocketPhotoState = "loading";
    const stage = figure.querySelector(".oa-launch__vehicle-stage");
    const caption = figure.querySelector("figcaption");
    if (!stage || !caption) return;

    const state = document.createElement("span");
    state.className = "oa-launch__rocket-state";
    state.textContent = t.loading;
    stage.append(state);

    try {
      const response = await fetch(`${workerBase}/api/orbital/rocket-image-meta?vehicle=${encodeURIComponent(vehicle)}`, {
        headers: { Accept: "application/json" }
      });
      const data = await response.json();
      if (!response.ok || !data?.image?.url) throw new Error(data?.error || "No rocket photo");

      stage.querySelectorAll("img.oa-launch__vehicle-photo,img.oa-launch__rocket-photo").forEach(node => node.remove());
      const image = document.createElement("img");
      image.className = "oa-launch__rocket-photo";
      image.src = data.image.url;
      image.alt = `${vehicle} rocket`;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("load", () => stage.classList.add("has-open-rocket-photo"), { once: true });
      image.addEventListener("error", () => {
        stage.classList.remove("has-open-rocket-photo");
        state.style.display = "block";
        state.textContent = t.unavailable;
      }, { once: true });
      stage.prepend(image);

      const credit = document.createElement("span");
      credit.className = "oa-launch__rocket-credit";
      credit.append(`${t.source}: ${data.image.credit || "Wikimedia Commons"} · ${data.image.license || "open licence"}`);
      const sourceUrl = safeLink(data.image.sourceUrl || data.image.licenseUrl);
      if (sourceUrl) {
        credit.append(" · ");
        const link = document.createElement("a");
        link.href = sourceUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = "Wikimedia Commons ↗";
        credit.append(link);
      }
      caption.append(credit);
      figure.dataset.rocketPhotoState = "ready";
    } catch (error) {
      console.warn(`[Orbital Atlas] rocket image unavailable for ${vehicle}`, error);
      figure.dataset.rocketPhotoState = "unavailable";
      state.textContent = t.unavailable;
    }
  }

  function scan() {
    grid.querySelectorAll(".oa-launch__vehicle").forEach(figure => enhance(figure));
  }

  const observer = new MutationObserver(scan);
  observer.observe(grid, { childList: true, subtree: true });
  scan();
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
})();
