(() => {
  // Solar System has its own model/audio UX. Prevent the site-wide helpers
  // from adding the generic text toggle, AR scanner button and generic player.
  if (document.body) document.body.dataset.disableModelExtras = "true";
  document.getElementById("toggleBtn")?.remove();
  document.getElementById("alba-scanner-btn-wrap")?.remove();
  document.getElementById("alba-scanner-hint")?.remove();
  document.getElementById("albaModelPlayer")?.remove();

  if (!document.querySelector("script[data-alba-model-player]")) {
    const guard = document.createElement("script");
    guard.type = "application/json";
    guard.dataset.albaModelPlayer = "solar-disabled";
    document.head.append(guard);
  }

  if (!document.querySelector('link[data-solar-3d-style]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/orbital-solar-system-3d.css?v=20260828-2";
    link.dataset.solar3dStyle = "true";
    document.head.append(link);
  }

  // Remove the previous 3D implementation: it placed eight model-viewer
  // elements directly inside the system widget. The replacement below uses
  // a single Three.js/WebGL canvas there and one model-viewer in the sidebar.
  document.querySelector("#solarModel .oa-solar-model3d")?.remove();

  if (!document.querySelector('script[data-solar-3d-module]')) {
    const module = document.createElement("script");
    module.type = "module";
    module.src = "/orbital-solar-system-3d.js?v=20260828-2";
    module.dataset.solar3dModule = "true";
    document.head.append(module);
  }

  const model = document.getElementById("solarModel");
  if (!model) return;

  const validPlanets = new Set(["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"]);
  const atlasBodies = new Set(["venus", "mars", "moon"]);
  const heroName = document.getElementById("solarHeroPlanetName");
  const heroDescription = document.getElementById("solarHeroPlanetDescription");
  const sideName = document.querySelector(".oa-solar-side #solarPlanetName") || document.getElementById("solarPlanetName");
  const sideDescription = document.querySelector(".oa-solar-side #solarPlanetDescription") || document.getElementById("solarPlanetDescription");

  const syncPlanetUi = () => {
    if (heroName && sideName) heroName.textContent = sideName.textContent;
    if (heroDescription && sideDescription) heroDescription.textContent = sideDescription.textContent;
    model.querySelectorAll("[data-planet]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    });
  };

  const syncModeUi = () => {
    document.querySelectorAll("[data-model]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    });
  };

  const choosePlanet = key => {
    if (!validPlanets.has(key)) return false;
    const button = model.querySelector(`.oa-solar-system [data-planet="${key}"]`) || model.querySelector(`[data-planet="${key}"]`);
    if (!button) return false;
    button.click();
    syncPlanetUi();
    return true;
  };

  const applyUrlState = () => {
    const url = new URL(location.href);
    const body = String(url.searchParams.get("body") || "").toLowerCase();
    const planet = String(url.searchParams.get("planet") || "").toLowerCase();
    const requested = validPlanets.has(body) ? body : planet;
    if (validPlanets.has(requested)) choosePlanet(requested);

    const view = String(url.searchParams.get("view") || "").toLowerCase();
    if (view === "3d") document.querySelector('[data-model="3d"]')?.click();
    else if (view === "2d") document.querySelector('[data-model="2d"]')?.click();

    syncPlanetUi();
    syncModeUi();
  };

  model.addEventListener("click", event => {
    const button = event.target.closest("[data-planet]");
    if (!button) return;
    syncPlanetUi();
    if (!event.isTrusted || !validPlanets.has(button.dataset.planet)) return;
    const url = new URL(location.href);
    const body = String(url.searchParams.get("body") || "").toLowerCase();
    if (!atlasBodies.has(body)) {
      url.searchParams.set("planet", button.dataset.planet);
      history.replaceState(history.state, "", url);
    }
  });

  document.querySelectorAll("[data-model]").forEach(button => {
    button.addEventListener("click", event => {
      syncModeUi();
      if (!event.isTrusted) return;
      const url = new URL(location.href);
      if (button.dataset.model === "3d") url.searchParams.set("view", "3d");
      else url.searchParams.delete("view");
      history.replaceState(history.state, "", url);
    });
  });

  const scrollToRequestedAtlas = () => {
    const url = new URL(location.href);
    const body = String(url.searchParams.get("body") || "").toLowerCase();
    if (!atlasBodies.has(body)) return false;
    if (url.hash && url.hash !== "#worldAtlas") return false;
    const atlas = document.getElementById("worldAtlas");
    if (!atlas) return false;
    atlas.style.scrollMarginTop = "120px";
    if (window.scrollY < 120) requestAnimationFrame(() => atlas.scrollIntoView({ block: "start" }));
    return true;
  };

  if (!scrollToRequestedAtlas()) {
    const observer = new MutationObserver(() => {
      if (scrollToRequestedAtlas()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  window.addEventListener("popstate", applyUrlState);
  applyUrlState();
})();
