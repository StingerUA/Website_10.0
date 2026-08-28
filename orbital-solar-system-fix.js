(() => {
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
    const requested = String(url.searchParams.get("planet") || url.searchParams.get("body") || "").toLowerCase();
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
    url.searchParams.set("planet", button.dataset.planet);
    history.replaceState(history.state, "", url);
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
